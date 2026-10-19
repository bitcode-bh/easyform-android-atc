const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../js/phase1_ui.js'), 'utf8');

function setup({ body = true, flow, config = true, navigation } = {}) {
    const events = {}, timers = new Map(), writes = [], errors = [], nodes = [];
    let id = 0;
    function node() {
        const classes = new Set();
        return { textContent: '', attrs: {}, children: [],
            classList: { add: n => classes.add(n), remove: n => classes.delete(n),
                toggle(n, on) { on ? classes.add(n) : classes.delete(n); }, contains: n => classes.has(n) },
            setAttribute(k, v) { this.attrs[k] = v; },
            appendChild(n) { this.children.push(n); n.parentNode = this; nodes.push(n); },
            removeChild(n) { this.children.splice(this.children.indexOf(n), 1); n.parentNode = null; }
        };
    }
    const session = new Map(navigation ? [['mwfm_phase1_navigation', JSON.stringify(navigation)]] : []);
    const document = { body: body ? node() : null, head: node(), documentElement: node(),
        readyState: 'loading', createElement: node, write: v => writes.push(v),
        addEventListener: (n, cb) => { events[n] = cb; } };
    const window = { document, location: { pathname: '/selection.html' }, MWFMPhase1Config: config,
        storage: { getItem: () => flow }, console: { error: (...v) => errors.push(v) },
        sessionStorage: { getItem: k => session.get(k), setItem: (k, v) => session.set(k, v), removeItem: k => session.delete(k) } };
    const context = vm.createContext({ window, document, console: window.console, Date,
        setTimeout: fn => { timers.set(++id, fn); return id; }, clearTimeout: n => timers.delete(n) });
    vm.runInContext(source, context);
    return { context, window, document, node, events, timers, nodes, writes, errors, session, ui: window.AppPhase1 };
}

test('raw exceptions, SQL, JSON and stack text become a safe notice; validation stays readable', () => {
    const s = setup();
    for (const value of [new Error('private detail'), 'TypeError: x is undefined', 'Error: internal detail',
        '{"sql":"private"}', 'SELECT * FROM Login_Master', 'failure_onsuccess_load()', 'Cannot read properties of null']) {
        s.ui.notice(value);
        assert.equal(s.document.body.children[0].textContent, 'Something went wrong. Please try again.');
    }
    assert.equal(s.errors.length, 7);
    s.ui.notice('Please select a site first.');
    assert.equal(s.document.body.children[0].textContent, 'Please select a site first.');
    s.ui.notice('<img src=x onerror=alert(1)>');
    assert.equal(s.document.body.children[0].children.length, 0, 'messages are literal text');
    assert.equal(s.document.body.children.length, 1, 'reuse a single notice');
    assert.equal(s.timers.size, 1, 'latest notice owns the fade timer');
    [...s.timers.values()][0]();
    assert.equal(s.document.body.children[0].classList.contains('is-visible'), false);
});

test('notices work before body creation and without jQuery or Framework7', () => {
    const s = setup({ body: false });
    s.ui.notice('Please try again.');
    s.document.body = s.node();
    s.events.DOMContentLoaded();
    assert.equal(s.document.body.children[0].textContent, 'Please try again.');
});

test('only typed rollout switches apply, including double-encoded flow config', () => {
    const flow = JSON.stringify(JSON.stringify([{ ui_phase1: { motion: false, notices: 'false' } }]));
    const s = setup({ flow, config: null });
    assert.equal(s.ui.enabled('motion'), false, 'typed false turns it off');
    assert.equal(s.ui.enabled('notices'), true, 'a string is not a switch, so the default applies');
    assert.equal(setup({ config: false }).ui.enabled('press'), false);
});

test('safe features are on by default; the two that change loading stay off', () => {
    const s = setup({ config: null });
    ['notices', 'press', 'motion'].forEach(n => assert.equal(s.ui.enabled(n), true, n));
    ['lazyScripts', 'savedLists'].forEach(n => assert.equal(s.ui.enabled(n), false, n));
    const off = setup({ config: null, flow: JSON.stringify([{ ui_phase1: false }]) });
    ['notices', 'press', 'motion'].forEach(n => assert.equal(off.ui.enabled(n), false, 'server kill switch ' + n));
});

test('back direction is scoped to the destination, consumed once, and expires', () => {
    const state = { page: 'selection.html', direction: 'back', at: Date.now() };
    const s = setup({ navigation: state });
    s.events.DOMContentLoaded();
    assert.equal(s.document.documentElement.attrs['data-phase1-direction'], 'back');
    assert.equal(s.session.size, 0);
    const other = setup({ navigation: { ...state, page: 'other.html' } });
    other.events.DOMContentLoaded();
    assert.equal(other.document.documentElement.attrs['data-phase1-direction'], 'forward');
    const old = setup({ navigation: { ...state, at: Date.now() - 16000 } });
    old.events.DOMContentLoaded();
    assert.equal(old.document.documentElement.attrs['data-phase1-direction'], 'forward');
});

test('a notice survives immediate changeurl navigation without replay on unrelated pages', () => {
    const s = setup();
    s.ui.notice('Saved successfully.');
    s.ui.navigate('selection.html', 'back');
    assert.equal(JSON.parse(s.session.get('mwfm_phase1_notice')).message, 'Saved successfully.');
    s.events.DOMContentLoaded();
    assert.equal(s.session.has('mwfm_phase1_notice'), false);
    assert.equal(s.document.body.children[0].textContent, 'Saved successfully.');
});

test('lazy loading deduplicates simultaneous calls, preserves arguments/this and later eager owners', () => {
    const s = setup();
    s.ui.register('feature.js', ['openFeature', 'sharedHelper'], { sharedValue: '' });
    const a = { name: 'a' }, calls = [];
    const laterOwner = () => 'later';
    s.window.sharedHelper = laterOwner;
    s.window.openFeature.call(a, 1, 2);
    s.window.openFeature.call(a, 3);
    assert.equal(s.document.head.children.filter(n => n.src === 'feature.js').length, 1);
    const script = s.document.head.children.find(n => n.src === 'feature.js');
    // The eager definition loaded after registration has priority.
    // Simulate the actual globals being installed by a downloaded script.
    s.window.openFeature = function (...args) { calls.push([this, args]); };
    s.window.sharedHelper = () => 'feature';
    script.onload();
    assert.equal(calls.length, 2);
    assert.equal(calls[0][0], a);
    assert.deepEqual(Array.from(calls[0][1]), [1, 2]);
    assert.equal(s.window.sharedValue, '');
    assert.equal(s.window.sharedHelper, laterOwner);
});

test('a failed lazy load can be retried; a retired attempt cannot complete the retry', () => {
    const s = setup();
    s.ui.register('feature.js', ['openFeature']);
    s.window.openFeature('first');
    const first = s.document.head.children.find(n => n.src === 'feature.js');
    const late = first.onload;
    first.onerror();
    s.window.openFeature('retry');
    const second = s.document.head.children.find(n => n.src === 'feature.js');
    late();
    let result;
    s.window.openFeature = value => { result = value; };
    second.onload();
    assert.equal(result, 'retry');
});

test('the rollout fallback preserves parser-time eager script loading', () => {
    const s = setup({ config: { lazyScripts: false } });
    s.ui.register('feature.js', ['openFeature']);
    assert.equal(s.writes[0], '<script src="feature.js"></script>');
    assert.equal(s.window.openFeature, undefined);
});

test('a missing local task or malformed checksheet response retains the saved list and enables Back', () => {
    const listSource = fs.readFileSync(path.join(__dirname, '../EFSE_Js/viewsitelist_pm_grouplist.js'), 'utf8');
    const callback = listSource.slice(listSource.indexOf('function onsuccess_get_list_of_pm_checksheets(e)'),
        listSource.indexOf('function show_hide_group_checksheet('));
    const calls = [];
    const lists = { failed(id) { calls.push(['failed', id]); return true; } };
    const context = { window: { AppPhase1Lists: lists }, AppPhase1Lists: lists, savedLists: () => lists, JSON,
        enable_back_button() { calls.push('back'); }, loading_hide() { calls.push('idle'); },
        alert1() { throw new Error('raw renderer errors must not reach the user'); },
        $() { throw new Error('missing task response must not erase the cached markup'); }
    };
    vm.runInNewContext(callback, context);
    for (const response of ['[]', '{"status":0}', '{bad json']) {
        calls.length = 0;
        context.onsuccess_get_list_of_pm_checksheets(response);
        assert.deepEqual(calls, [['failed', 'checksheet_list'], 'back', 'idle']);
    }
});

test('plain messages that name a field with an underscore are shown as written', () => {
    const s = setup();
    s.ui.notice('Select a value for site_name');
    assert.equal(s.document.body.children[0].textContent, 'Select a value for site_name');
    assert.equal(s.errors.length, 0);
    s.ui.notice('Select a site first.');
    assert.equal(s.document.body.children[0].textContent, 'Select a site first.');
    s.ui.notice('SELECT * FROM Login_Master');
    assert.equal(s.document.body.children[0].textContent, 'Something went wrong. Please try again.');
    s.ui.notice('Something failed in load_form()');
    assert.equal(s.document.body.children[0].textContent, 'Something went wrong. Please try again.');
});

test('page start reads the flow configuration once, not once per switch', () => {
    let reads = 0;
    const s = setup({ config: undefined });
    s.window.storage.getItem = key => { if (key === 'list_json') reads++; return JSON.stringify([{ ui_phase1: { notices: true } }]); };
    s.ui.configure(undefined);   // forget what the script's own start-up read
    for (let i = 0; i < 12; i++) s.ui.enabled(['notices', 'press', 'motion', 'lazyScripts'][i % 4]);
    assert.equal(reads, 1);
    assert.equal(s.ui.enabled('notices'), true);
    s.ui.configure({ notices: false });
    s.ui.enabled('notices');
    assert.equal(reads, 2, 'configure() resets the cache');
});
