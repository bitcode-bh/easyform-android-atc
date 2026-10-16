const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(__dirname + '/../EFSE_Js/selection.js', 'utf8');
function harness() {
    const values = new Map([['id_Array', '[10]'], ['cust_flow_Array', '[]'], ['role_id_array', '1']]);
    const calls = [], badges = new Map();
    const store = { getItem: k => values.get(k) || null, setItem: (k, v) => values.set(k, v) };
    const c = vm.createContext({ storage: store, localStorage: store,
        cordova: { exec: (ok, fail, plugin, action, args) => calls.push({ ok, fail, args }) },
        $: selector => ({ text: value => badges.set(selector, value) }),
        alert1: () => {}, loading_hide: () => {}, button_clicked: 0 });
    vm.runInContext(source, c);
    return { c, calls, values, badges };
}
{
    const { c } = harness();
    let rendered, counts = 0;
    c.get_list_of_modules = done => { rendered = done; };
    c.onload_get_counter_of_module_flow_new = () => counts++;
    c.SuccessCallBack_onload_get_data_from_ufm(JSON.stringify([{ id: 11, type: 'Flow', data: '[{"status":"1"}]' }]));
    assert.equal(counts, 0, 'badge queries cannot delay the first rendering');
    rendered();
    assert.equal(counts, 1);
}
{
    const { c, calls, values } = harness();
    let renders = 0;
    c.SuccessCallBack_onload_get_data_from_ufm = () => renders++;
    c.get_data_from_ufm();
    const first = calls[0];
    values.set('id_Array', '[20]');
    c.get_data_from_ufm();
    first.ok('[]');
    assert.equal(renders, 0, 'old module responses cannot redraw a new module');
    calls[1].ok('[]');
    assert.equal(renders, 1);
}
{
    const { c, calls, values, badges } = harness();
    c.onload_get_counter_of_module_flow_new('(tm.status=1)');
    values.set('id_Array', '[20]');
    calls[0].ok('[{"id":"11","count":"9","type":"Flow"}]');
    assert.equal(badges.size, 0, 'stale counts cannot change the new screen');
    values.set('id_Array', '[10]');
    c.onload_get_counter_of_module_flow_new('(tm.status=1)');
    const row = '[{"id":"11","count":"9","type":"Flow"}]';
    calls[1].ok(row);
    calls[1].ok(row);
    assert.equal(c.value_counter.length, 1, 'count refreshes do not accumulate old rows');
    assert.equal(badges.get('#offline_circle_11'), '9');
    c.SuccessCallBack_onload_get_counter_of_module_flow('[]');
    assert.equal(calls.length, 2, 'empty counts must not start a recursive query');
}
{
    const { c } = harness();
    let loaders = 0;
    c.button_clicked = 1;
    c.loading = () => loaders++;
    c.redirect_on_module_click('RSA', 10, 20, 'Module', 1);
    assert.equal(loaders, 0, 'ignored taps must not create an orphaned loader');
}
console.log('Module rendering order, stale callbacks, badge refresh, and repeated tap tests passed');

{
    const { c, values } = harness();
    let online = 0;
    values.set('Attendance', 'true');
    values.set('KYFF', 'True');
    c.get_list_of_modules_online = () => online++;
    c.SuccessCallBack_onload_get_data_from_ufm('[]');
    assert.equal(online, 1, 'a submenu missing locally must fetch online despite enabled home features');
}
console.log('Empty local submenu fallback test passed');

{
    const { c, values } = harness();
    let stopped = 0;
    values.set('id_Array', '[]');
    values.set('Attendance', 'true');
    c.$ = () => ({ show() {} });
    c.loading_hide = () => stopped++;
    c.enable_back_button = () => {};
    c.SuccessCallBack_onload_get_data_from_ufm('[]');
    assert.equal(stopped, 1, 'an empty home list must release its loader');
}
console.log('Empty home loader cleanup test passed');

{
    const { c, values, calls } = harness();
    values.set('level_Array', '[{"last_flow_name":"RSA"}]');
    values.set('flow_Array', '[]');
    values.set('Attendance', 'true');
    values.set('KYFF', 'True');
    c.module_navigation_uses_online = true;
    c.$ = () => ({ length: 0, hide() {}, show() {}, is() { return false; } });
    c.loading = () => {};
    let online = 0;
    c.get_list_of_modules_online = () => online++;
    const common = fs.readFileSync(__dirname + '/../EFSE_Js/common-functions.js', 'utf8');
    const start = common.indexOf('function back_button(page) {');
    const end = common.indexOf('\nfunction ', start + 1);
    vm.runInContext(common.slice(start, end), c);
    c.back_button('selection');
    assert.equal(values.get('id_Array'), '[]');
    assert.equal(values.get('level_Array'), '[]');
    calls[0].ok('[]');
    assert.equal(online, 1, 'back from an online submenu must restore the online home list even with home features enabled');
}
console.log('Submenu back-to-home regression test passed');
