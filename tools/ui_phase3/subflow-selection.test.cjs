const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const root = process.env.MWFM_SUBFLOW_SOURCE_ROOT || path.resolve('EasyFormSE_finance/assets/www2');

function harness() {
    const values = { flow_Array: [{ checklist: [], start_status: 0, list_json: '[]' }],
        task_data_column: [101, 202].map(id => ({ id, data: 'Synthetic ' + id })), tid: 1, task_id: 1, server_task_id: 1 };
    const local = new Map(), native = [], navigations = [], notices = [], appended = [], timers = new Map(), events = {};
    let clock = 0;
    const c = vm.createContext({
        console, document: { documentElement: { hasAttribute: () => false } }, F7_device: 'android', button_clicked_subflow: 0,
        storage: { getItem: key => JSON.stringify(values[key] ?? null), setItem: (key, value) => { values[key] = JSON.parse(value); } },
        localStorage: { getItem: key => local.get(key) ?? null, setItem: (key, value) => local.set(key, String(value)) },
        cordova: { exec: (...args) => native.push(args) },
        $: () => ({ append: html => appended.push(html), val: () => '', html() {}, text() {} }),
        setTimeout: (fn, ms) => { const id = ++clock; timers.set(id, { fn, ms }); return id; },
        clearTimeout: id => timers.delete(id),
        addEventListener: (type, fn) => { (events[type] ||= []).push(fn); },
        alert1: message => notices.push(String(message)), loading() {}, loading_hide() {}, vibrate_device() {}, confirm: () => true,
        redirect_on_module_click: (...args) => navigations.push(args)
    });
    c.window = c;
    for (const file of ['viewsitelist_pm_grouplist.js', 'viewsitelist_sub_task.js', 'viewsitelist_sub_task_hybrid.js']) {
        vm.runInContext(fs.readFileSync(path.join(root, 'EFSE_Js', file), 'utf8'), c, { filename: file });
    }
    function selection(id, type = 'Page') {
        return [id, id + 1, id + 2, id + 3, 'true', '', 1, type, id + 1000, 'Synthetic ' + id, id + 10];
    }
    function tap(id, type) { c.redirect_on_pre_subflow_click_hybrid(...selection(id, type)); return native.at(-1); }
    function expireHold() { for (const [id, timer] of timers) if (timer.ms === 2000) { timers.delete(id); timer.fn(); } }
    return { c, values, native, navigations, notices, appended, tap, selection, expireHold,
        leave: () => (events.pagehide || []).forEach(fn => fn({ persisted: false })) };
}

test('each locally missing hybrid subflow opens the selected row rather than the first tap', () => {
    const h = harness();
    h.tap(101)[0]('[]'); h.expireHold(); h.tap(202)[0]('[]');
    assert.deepEqual(h.navigations, [['Synthetic 101', 101, 1101, 'Page', 111], ['Synthetic 202', 202, 1202, 'Page', 212]]);
    assert.match(h.appended[0], /hdn_101/); assert.match(h.appended[1], /hdn_202/);
    assert.deepEqual(h.notices, []);
});

for (const lateFirst of [true, false]) test('superseded hybrid replies cannot navigate or add hidden fields, late-first=' + lateFirst, () => {
    const h = harness(), old = h.tap(101), current = h.tap(202);
    const before = JSON.stringify(h.values);
    if (lateFirst) { old[0]('[]'); old[1]('Retired synthetic failure'); }
    current[0]('[]');
    if (!lateFirst) { old[0]('[]'); old[1]('Retired synthetic failure'); }
    assert.deepEqual(h.navigations, [['Synthetic 202', 202, 1202, 'Page', 212]]);
    assert.equal(h.appended.length, 1); assert.match(h.appended[0], /hdn_202/);
    assert.deepEqual(h.notices, []);
    // Redirect uses the latest selection's existing status contract.
    assert.equal(h.values.c_start_status, 203); assert.equal(h.values.sub_flow_end_status, 204);
    assert.equal(JSON.parse(before).sub_flow_reject_status, h.values.sub_flow_reject_status);
});

test('leaving the page retires both hybrid success and failure callbacks', () => {
    const h = harness(), pending = h.tap(101), before = JSON.stringify(h.values);
    h.leave(); pending[0]('[]'); pending[1]('Retired synthetic failure');
    assert.deepEqual(h.navigations, []); assert.deepEqual(h.appended, []); assert.deepEqual(h.notices, []);
    assert.equal(JSON.stringify(h.values), before);
});

test('an ordinary subflow selection retires the pending hybrid lookup', () => {
    const h = harness(), old = h.tap(101);
    h.c.redirect_on_subflow_click('Ordinary', 303, 1303, 'Page', 3, 4, 5, 'true', 7, '', 1);
    old[0]('[]'); old[1]('Retired synthetic failure');
    assert.deepEqual(h.navigations, [['Ordinary', 303, 1303, 'Page', 7]]);
    assert.deepEqual(h.appended, []); assert.deepEqual(h.notices, []);
});

test('a later checksheet selection retires the pending hybrid lookup and cancels its server read', () => {
    const h = harness(), old = h.tap(101); let cancelled = 0;
    h.c.pending_checksheet_step_request = { cancel: () => cancelled++ };
    h.c.invalidate_checksheet_open();
    old[0]('[]'); old[1]('Retired synthetic failure');
    assert.equal(cancelled, 1); assert.deepEqual(h.navigations, []); assert.deepEqual(h.appended, []); assert.deepEqual(h.notices, []);
});

test('a local hybrid row keeps native row metadata, query and status arguments unchanged', () => {
    const h = harness(), call = h.tap(101), args = h.selection(101), received = [];
    h.c.redirect_on_subflow_click = (...values) => received.push(values);
    assert.equal(call[2], 'SqlitePlugin'); assert.equal(call[3], 'showValues');
    assert.equal(call[4][0].p, '1'); assert.match(call[4][0].data, /WHERE id = 101 and \(is_delete != 1 or is_delete IS NULL\)$/);
    const row = { id: 101, type: 'NativePage', flow_id: 900, flow_name1: 'Native row', rollid: 8, data: 'Synthetic data' };
    call[0](JSON.stringify([row]));
    assert.deepEqual(received, [['Native row', 101, 900, 'NativePage', args[1], args[2], args[3], args[4], 8, '', args[6]]]);
    assert.equal(h.appended.length, 1); assert.match(h.appended[0], /hdn_101/); assert.deepEqual(h.notices, []);
});

test('subflow write completion uses its own navigation arguments while retaining compatibility keys', () => {
    const h = harness();
    h.c.redirect_on_subflow_click('Selected', 101, 1101, 'Flow', 0, 1, 2, 'true', 7, '', 1);
    const call = h.native.at(-1);
    assert.equal(call[3], 'insertValuse'); assert.match(call[4][0].data, /^UPDATE task_master SET global_var = /);
    assert.equal(h.values.redirect_id, 101); assert.equal(h.values.redirect_flow_id, 1101);
    h.values.redirect_flow_name1 = 'Another operation'; h.values.redirect_id = 999;
    h.values.redirect_flow_id = 1999; h.values.redirect_type = 'Other'; h.values.redirect_role_id = 99;
    call[0]();
    assert.deepEqual(h.navigations, [['Selected', 101, 1101, 'Flow', 7]]); assert.deepEqual(h.notices, []);
});

for (const retire of ['selection', 'leave']) test('retired subflow writes cannot redirect or show errors after ' + retire, () => {
    const h = harness();
    h.c.redirect_on_subflow_click('Selected', 101, 1101, 'Flow', 0, 1, 2, 'true', 7, '', 1);
    const call = h.native.at(-1);
    if (retire === 'leave') h.leave(); else h.tap(202);
    call[0](); call[1]('Retired synthetic failure');
    assert.deepEqual(h.navigations, []); assert.deepEqual(h.notices, []);
});

test('current subflow write failure reports its supplied error rather than throwing ReferenceError', () => {
    const h = harness();
    h.c.redirect_on_subflow_click('Selected', 101, 1101, 'Flow', 0, 1, 2, 'true', 7, '', 1);
    assert.doesNotThrow(() => h.native.at(-1)[1]('Synthetic write failure'));
    assert.deepEqual(h.notices, ['Synthetic write failure_onfail_refresh_global_variables_subflow()']);
});

test('declining modification preserves the pending selection, and the existing duplicate-tap hold stays effective', () => {
    const h = harness(), pending = h.tap(101);
    h.c.confirm = () => false;
    h.c.redirect_on_subflow_click('Declined', 303, 1303, 'Page', 0, 1, 2, 'true', 7, 'green', 1);
    pending[0]('[]');
    h.c.redirect_on_subflow_click('Duplicate', 303, 1303, 'Page', 0, 1, 2, 'true', 7, '', 1);
    assert.deepEqual(h.navigations, [['Synthetic 101', 101, 1101, 'Page', 111]]);
    assert.deepEqual(h.notices, []);
});
