const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(__dirname + '/../EFSE_Js/selection.js', 'utf8');
function harness() {
    const values = new Map([['id_Array', '[10]'], ['cust_flow_Array', '[]'], ['role_id_array', '1']]);
    const calls = [], requests = [], notices = [], badges = new Map();
    for (const [key,value] of Object.entries({level_Array:[],global_url:'https://example.invalid/',common_global_wcf_url:'https://example.invalid/',company_id:1,user_id:2,curr_btn_mode:'back'})) values.set(key,JSON.stringify(value));
    const store = { getItem: k => values.get(k) || null, setItem: (k, v) => values.set(k, v) };
    const c = vm.createContext({ storage: store, localStorage: store,
        cordova: { exec: (ok, fail, plugin, action, args) => calls.push({ ok, fail, args }) },
        $: selector => { const chain = new Proxy(function () {}, { get: (_, key) => key === 'length' ? 0 : key === 'text' ? value => badges.set(selector, value) : chain, apply: () => chain }); return chain; },
        Webservicecall_REST: function (url,data,success,failure) { requests.push({url,data,success,failure}); this.callOtherDomain=()=>{};this.cancel=()=>{}; },
        document:{documentElement:{hasAttribute:()=>false}},setTimeout:()=>0,
        alert1: message => notices.push(String(message)), loading:()=>{}, enable_back_button:()=>{}, loading_hide: () => {}, button_clicked: 0 });
    c.window=c;
    vm.runInContext(source, c);
    return { c, calls, values, badges, requests, notices };
}
{
    const { c, calls } = harness();
    c.SuccessCallBack_onload_get_data_from_ufm(JSON.stringify([{ id: 11, type: 'Flow', data: '[{"status":"1"}]' }]));
    assert.equal(calls.length,1,'first query renders the module list');
    assert.match(calls[0].args[0].data,/SELECT \* FROM\s+User_Define_Flow_Master/i);
    assert.doesNotMatch(calls[0].args[0].data,/task_master/i,'badge queries cannot delay first rendering');
    calls[0].ok('[]');
    assert.equal(calls.length,2,'badge count starts only after the render reply');
    assert.match(calls[1].args[0].data,/task_master/i);
}
{
    const { c, calls, values, requests, notices } = harness();
    c.get_data_from_ufm();
    const first = calls[0];
    values.set('id_Array', '[20]');
    c.get_data_from_ufm();
    first.ok('invalid retired reply');
    assert.equal(requests.length,0,'old module responses cannot redraw a new module');
    assert.deepEqual(notices,[],'retired replies are ignored before parsing');
    calls[1].ok('[]');
    assert.equal(requests.length,1,'current empty submenu starts its online fallback');
    assert.equal(JSON.parse(requests[0].data)[0].p_id,20);
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
    const { c, values, requests } = harness();
    values.set('Attendance', 'true');
    values.set('KYFF', 'True');
    c.SuccessCallBack_onload_get_data_from_ufm('[]');
    assert.equal(requests.length, 1, 'a submenu missing locally must fetch online despite enabled home features');
    assert.match(requests[0].url,/WCF_UserDefineFlowMaster_With_MultiRole_Port$/);
}
console.log('Empty local submenu fallback test passed');

{
    const { c, values } = harness();
    let stopped = 0;
    values.set('id_Array', '[]');
    values.set('Attendance', 'true');
    c.loading_hide = () => stopped++;
    c.enable_back_button = () => {};
    c.SuccessCallBack_onload_get_data_from_ufm('[]');
    assert.equal(stopped, 1, 'an empty home list must release its loader');
}
console.log('Empty home loader cleanup test passed');

{
    const { c, values, calls, requests } = harness();
    values.set('level_Array', '[{"last_flow_name":"RSA"}]');
    values.set('flow_Array', '[]');
    values.set('Attendance', 'true');
    values.set('KYFF', 'True');
    c.module_navigation_uses_online = true;
    c.loading = () => {};
    const common = fs.readFileSync(__dirname + '/../EFSE_Js/common-functions.js', 'utf8');
    const start = common.indexOf('function back_button(page) {');
    const end = common.indexOf('\nfunction ', start + 1);
    vm.runInContext(common.slice(start, end), c);
    c.back_button('selection');
    assert.equal(values.get('id_Array'), '[]');
    assert.equal(values.get('level_Array'), '[]');
    calls[0].ok('[]');
    assert.equal(requests.length,1,'back from an online submenu must restore the online home list even with home features enabled');
    assert.equal(JSON.parse(requests[0].data)[0].p_id,0);
}
console.log('Submenu back-to-home regression test passed');
