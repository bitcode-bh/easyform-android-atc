// Every plugin service the pages call must exist as a native feature. A typo or a removed plugin otherwise only
// shows up as a button that does nothing on a phone. Services that never existed on this app are listed here on
// purpose; the list can only shrink.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const www = path.join(__dirname, '..');
const app = path.join(www, '..', '..');

function features() {
    const found = new Set();
    for (const file of ['res/xml/config.xml', 'res/xml/cordova.xml']) {
        const text = fs.readFileSync(path.join(app, file), 'utf8');
        for (const m of text.matchAll(/<feature name="([^"]+)"/g)) found.add(m[1]);
    }
    return found;
}
function walk(dir, out = []) {
    for (const name of fs.readdirSync(dir)) {
        const full = path.join(dir, name);
        const rel = path.relative(www, full);
        if (/^(tests|Plugin_Js|LMS|Framework7|\.vs|font-awesome)/.test(rel) || name.endsWith('.min.js')) continue;
        const stat = fs.statSync(full);
        if (stat.isDirectory()) walk(full, out); else if (/\.(js|html)$/.test(name)) out.push(full);
    }
    return out;
}
// The arguments of one cordova.exec( call, split at the top level (callbacks and nested calls are skipped over).
function argumentsOf(text, start) {
    const args = [];
    let depth = 0, current = '', i = start;
    while (i < text.length) {
        const c = text[i];
        if (c === '"' || c === "'" || c === '`') {
            let j = i + 1;
            while (j < text.length && text[j] !== c) j += text[j] === '\\' ? 2 : 1;
            current += text.slice(i, j + 1); i = j + 1; continue;
        }
        if (c === '/' && text[i + 1] === '/') { while (i < text.length && text[i] !== '\n') i++; continue; }
        if (c === '/' && text[i + 1] === '*') { const end = text.indexOf('*/', i + 2); i = end < 0 ? text.length : end + 2; continue; }
        if (c === '(' || c === '[' || c === '{') depth++;
        if (c === ')' || c === ']' || c === '}') { if (depth === 0) { args.push(current.trim()); return args; } depth--; }
        if (c === ',' && depth === 0) { args.push(current.trim()); current = ''; i++; continue; }
        current += c; i++;
    }
    return args;
}
function called() {
    const services = new Map();
    for (const file of walk(www)) {
        const text = fs.readFileSync(file, 'utf8');
        for (const m of text.matchAll(/cordova\.exec\(/g)) {
            const args = argumentsOf(text, m.index + m[0].length);
            const service = /^'([A-Za-z0-9_]+)'$/.exec(args[2] || ''), action = /^'([A-Za-z0-9_]+)'$/.exec(args[3] || '');
            if (!service || !action) continue;
            if (!services.has(service[1])) services.set(service[1], new Set());
            services.get(service[1]).add(path.relative(www, file));
        }
    }
    return services;
}

// Called from the pages, with no native feature behind them in this app (iOS-only or retired plugins).
const KNOWN_MISSING = new Set(['EntityDetection', 'FrontWebserviceCall', 'IMEI', 'choose_file_plug', 'detectDeviceIphoneOrIpadPlugin',
    'openURLSafariPlug', 'pdfview', 'submitAnIdeaPlugin', 'wiprochat_plugin']);

test('every service a page calls is a native feature, apart from the known missing ones', () => {
    const have = features(), unknown = [];
    for (const [service, files] of called()) if (!have.has(service) && !KNOWN_MISSING.has(service)) unknown.push(`${service} (${[...files][0]})`);
    assert.deepEqual(unknown, []);
});

test('the known-missing list only holds services that are still called and still missing', () => {
    const have = features(), seen = called();
    for (const service of KNOWN_MISSING) {
        assert.equal(have.has(service), false, `${service} now exists; remove it from the list`);
        assert.equal(seen.has(service), true, `${service} is no longer called; remove it from the list`);
    }
});

test('the named-query plugin is registered and its queries are the ones the bridge asks for', () => {
    assert.ok(features().has('DataBridge'));
    const bridge = fs.readFileSync(path.join(www, 'js/app_bridge.js'), 'utf8');
    const java = fs.readFileSync(path.join(app, 'src/com/sky/atc/easyformse/DataQueries.java'), 'utf8');
    for (const m of bridge.matchAll(/query\('([A-Za-z]+)'/g)) assert.match(java, new RegExp(`all\\.put\\("${m[1]}"`), m[1]);
});
