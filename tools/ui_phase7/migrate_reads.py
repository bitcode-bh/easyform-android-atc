#!/usr/bin/env python3
"""Moves page reads from raw SQL text to the named queries in DataQueries.java.

A call is rewritten only when the SQL it runs is one of the shapes below, written the way the pages wrote it (literal
text, with the page's own variables joined in), and the call follows the assignment closely. Anything else is left alone
and listed. Run from the repository root:  python3 tools/ui_phase7/migrate_reads.py [--write]
"""
import glob, re, sys

WWW = 'EasyFormSE_finance/assets/www2'
# normalized SQL (variables as {name}) -> (named query, [argument name for each variable, in order])
SHAPES = {
    'select imei from login_master': ('loginImei', []),
    'select username from login_master': ('loginUsername', []),
    "select data from flow_master where moduleid = '{}'": ('flowMapping', ['moduleid']),
    'select fm.checksheet_id from flow_master fm where fm.moduleid={}': ('flowChecksheet', ['moduleid']),
    "select f_data from f_master where tid = '{}' and c_id = '{}' and step = '{}'": ('formDataByStep', ['tid', 'c_id', 'step']),
    "select f_data from f_master where tid = '{}' and f_value = '{}' and step = '{}'": ('formDataByValueStep', ['tid', 'f_value', 'step']),
    "select f_data from f_master where tid = '{}' and step = '{}' and c_type='1'": ('formDataByTypeOneStep', ['tid', 'step']),
    "select f_data from f_master where tid = '{}' and c_type = '5'": ('formDataByTypeFive', ['tid']),
    "select fm.c_id, fm.f_data, ch.data from f_master fm join checksheet ch on fm.c_id = ch.checksheetid where fm.tid = '{}' and fm.c_type = '5'": ('formAndChecksheetByTypeFive', ['tid']),
    "select subcategory, checksheetid, step, data, buttons from checksheet where checksheetid = '{}' and step = '{}'": ('checksheetStep', ['checksheetid', 'step']),
    'select issend from lat_plug where issend = 0': ('pendingLocationPoints', []),
    'select _id from download_video order by _id desc limit 1': ('lastDownloadVideo', []),
    'select counter_name, status, counter, total_count, globalcounter from download_counter': ('downloadCounters', []),
    "select tid from task_master where server_task_id = '{}'": ('taskByServerId', ['server_task_id']),
    "select tid, checksheetid, moduleid, task_id from task_master where username = '{}' order by tid desc limit 1": ('lastTaskByUser', ['username']),
    "select tid, checksheetid from task_master where username = '{}' order by tid desc limit 1": ('lastTaskIdsByUser', ['username']),
}
ASSIGN = re.compile(r'''(?:\bvar\s+|\blet\s+|\bconst\s+)?(\b[A-Za-z_]\w*)\s*=\s*("(?:[^"\\]|\\.)*"(?:\s*\+\s*(?:"(?:[^"\\]|\\.)*"|[A-Za-z_][\w.]*))*)\s*;''')
LOOKAHEAD = 5000


def split_args(text, start):
    """The top-level arguments of the call whose '(' ends just before `start`, and the index after its ')'."""
    args, depth, cur, i = [], 0, '', start
    while i < len(text):
        c = text[i]
        if c in '"\'`':
            j = i + 1
            while j < len(text) and text[j] != c:
                j += 2 if text[j] == '\\' else 1
            cur += text[i:j + 1]; i = j + 1; continue
        if c == '/' and text[i + 1:i + 2] == '/':
            while i < len(text) and text[i] != '\n': i += 1
            continue
        if c == '/' and text[i + 1:i + 2] == '*':
            e = text.find('*/', i + 2); i = len(text) if e < 0 else e + 2; continue
        if c in '([{': depth += 1
        if c in ')]}':
            if depth == 0:
                args.append(cur.strip()); return args, i + 1
            depth -= 1
        if c == ',' and depth == 0:
            args.append(cur.strip()); cur = ''; i += 1; continue
        cur += c; i += 1
    return args, i


def normalise(expr):
    toks = re.findall(r'"(?:[^"\\]|\\.)*"|[A-Za-z_][\w.]*', expr)
    out, variables = '', []
    for t in toks:
        if t.startswith('"'): out += t[1:-1]
        else: out += '{}'; variables.append(t)
    return re.sub(r'\s+', ' ', out).strip().lower().replace('{}', '{}'), variables


def migrate(path, write):
    text = open(path, encoding='utf8', errors='surrogateescape').read()
    edits, skipped = [], []
    for m in ASSIGN.finditer(text):
        shape, variables = normalise(m.group(2))
        # the shape table is lower-case; variable placeholders keep their quotes
        key = re.sub(r"\{\}", '{}', shape)
        if key not in SHAPES: continue
        name, argnames = SHAPES[key]
        qv = m.group(1)
        if len(variables) != len(argnames):
            skipped.append((path, qv, 'variable count')); continue
        window = text[m.end():m.end() + LOOKAHEAD]
        # The same variable name is reused all over a file: the window ends at the next assignment to it or the next function.
        stop = re.search(r'\b' + re.escape(qv) + r'\s*=[^=]|\n\s*(?:async\s+)?function\b', window)
        if stop: window = window[:stop.start()]
        pushes = re.findall(r'data\s*:\s*' + re.escape(qv) + r'\b', window)
        if len(pushes) != 1:
            skipped.append((path, qv, 'data pushed %d times' % len(pushes))); continue
        call = None
        for c in re.finditer(r'cordova\.exec\(', window):
            args, end = split_args(window, c.end())
            if len(args) >= 5 and args[2] == "'SqlitePlugin'" and args[3] == "'showValues'":
                # The call must run the array this query was pushed into (or carry the query inline).
                carrier = re.search(r'(\b[A-Za-z_][\w.]*)\.push\(\s*\{[^}]*data\s*:\s*' + re.escape(qv) + r'\b', window)
                if args[4] == (carrier.group(1) if carrier else None) or re.search(r'data\s*:\s*' + re.escape(qv) + r'\b', args[4]):
                    call = (c.start(), end, args); break
        if not call:
            skipped.append((path, qv, 'no showValues call')); continue
        start, end, args = call
        # the call must come before the next statement that rebuilds this query variable's shape
        argobj = '{ ' + ', '.join('%s: %s' % (n, v) for n, v in zip(argnames, variables)) + ' }' if argnames else '{}'
        replacement = "AppBridge.on(cordova).read(%s, %s, '%s', %s)" % (args[0], args[1], name, argobj)
        edits.append((m.end() + start, m.end() + end, replacement, name))
    if not edits: return [], skipped
    for s, e, r, _ in sorted(edits, reverse=True):
        text = text[:s] + r + text[e:]
    if write: open(path, 'w', encoding='utf8', errors='surrogateescape').write(text)
    return edits, skipped


def main():
    write = '--write' in sys.argv
    files = [f for f in glob.glob(WWW + '/**/*.js', recursive=True) + glob.glob(WWW + '/*.html')
             if not re.search(r'/(tests|Plugin_Js|LMS|Framework7[^/]*|\.vs)/|\.min\.js$|/js/app_bridge\.js$', f)]
    done, skipped = {}, []
    for f in sorted(files):
        e, s = migrate(f, write)
        for x in e: done.setdefault(x[3], []).append(f.replace(WWW + '/', ''))
        skipped += s
    total = sum(len(v) for v in done.values())
    print('%s %d call sites in %d queries' % ('rewrote' if write else 'would rewrite', total, len(done)))
    for k, v in sorted(done.items(), key=lambda kv: -len(kv[1])): print('  %-30s %2d  %s' % (k, len(v), sorted(set(v))[:3]))
    print('skipped %d' % len(skipped))
    for s in skipped: print('  ', s)


main()
