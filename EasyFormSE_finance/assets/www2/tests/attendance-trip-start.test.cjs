const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
function source(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
function fn(text, name) {
    const start = text.indexOf('function ' + name + '(');
    const next = text.indexOf('\nfunction ', start + 1);
    return text.slice(start, next < 0 ? text.length : next);
}
const taskRead = fn(source('EFSE_Js_Task/GetCheckSheet_Task.js'), 'onsuccess_check_for_notification_task');
const submit = source('EFSE_Js/SubmitSurveyData.js');
const callbackStart = submit.indexOf('// successfull attendance task create');
const callbackEnd = submit.indexOf("}, onfail_request, 'AttendanceTaskCreatePlugin'", callbackStart);
assert(callbackStart > 0 && callbackEnd > callbackStart);
const taskCreated = 'function taskCreated(e) {\n' + submit.slice(callbackStart, callbackEnd) + '\n}';
const trips = source('EFSE_Js/get_trip_info.js');
function fixture() {
    const values = new Map(), alerts = [], redirects = [], calls = [];
    const storage = { getItem: key => values.has(key) ? values.get(key) : null, setItem: (key, value) => values.set(key, String(value)) };
    const state = { values, alerts, redirects, calls, preloader: false, reads: 0, genericLoads: 0, tripResult: 'success' };
    const context = {
        localStorage: storage, storage, json: [{ que_id: '1109', ans: ['Private-2W'] }], btnJsonObj: [],
        curr_survey_data: {}, JSON, Array, String, Error,
        alert1: message => alerts.push(message), loading_hide: () => state.genericLoads++,
        changeurl: url => redirects.push(url),
        myApp: { showPreloader: () => state.preloader = true, hidePreloader: () => state.preloader = false },
        get_blank_task_form: () => { state.reads++; assert(JSON.parse(storage.getItem('AttendanceJson'))[0]); },
        data_to_read_task_Post: () => { throw Error('Wrong form route'); },
        cordova: { exec: (success, failure, plugin, action, args) => {
            calls.push({ plugin, action, args });
            assert.equal(plugin, 'TripPlugin', 'Do not gate trip start on an unrelated location lookup');
            if (state.tripResult === 'success') success('success');
            else if (state.tripResult === 'throw') throw Error('Native invocation unavailable');
            else failure(state.tripResult);
        } }
    };
    vm.createContext(context);
    vm.runInContext(taskRead + '\n' + taskCreated + '\n' + fn(trips, 'auto_start_trip_on_attendane_task_create') + '\n' + fn(trips, 'start_stop_trip_on_attendace'), context);
    storage.setItem('uniqcode', 'test-session');
    state.context = context;
    state.hydrate = config => context.onsuccess_check_for_notification_task(JSON.stringify([{ task_checksheet_id: '100', flow_id: '2', flow_name: 'Test trip', photo_url: '', attendance_json: typeof config === 'string' ? config : JSON.stringify(config) }]));
    state.created = () => context.taskCreated(JSON.stringify([{ tid: '7' }]));
    return state;
}
for (const auto_trip of ['true', true]) {
    const f = fixture();
    f.hydrate([{ auto_trip, stillviolation_event: 'true' }]);
    assert.equal(f.reads, 1);
    f.created();
    assert.equal(f.calls.length, 1);
    assert.equal(f.calls[0].args[0].tid, '7');
    assert.equal(f.calls[0].args[0].stillviolation_event, 'true');
    assert.equal(f.calls[0].args[0].vehicle_type, 'Private-2W');
    assert.equal(f.values.get('trip_status'), '0');
    assert.equal(f.values.get('trip_tid'), '7');
    assert.deepEqual(f.redirects, ['selection.html']);
    assert.equal(f.preloader, false);
    assert.equal(f.alerts.length, 0);
}
{
    const f = fixture();
    f.hydrate([{ auto_trip: 'false' }]);
    f.created();
    assert.equal(f.calls.length, 0, 'Attendance-only configuration must not start tracking');
    assert.deepEqual(f.redirects, ['selection.html']);
}
for (const cached of [null, '""', '[]', '{broken']) {
    const f = fixture();
    if (cached !== null) f.values.set('AttendanceJson', cached);
    f.created();
    assert.equal(f.calls.length, 0);
    assert.equal(f.alerts.length, 1, 'Missing settings must produce a visible error after save');
    assert.match(f.alerts[0], /Attendance was saved/);
    assert.equal(f.genericLoads, 1);
}
for (const outcome of ['Unable to open the trip screen', 'error', 'throw']) {
    const f = fixture();
    f.hydrate([{ auto_trip: 'true' }]);
    f.tripResult = outcome;
    f.created();
    assert.equal(f.preloader, false);
    assert.equal(f.values.get('crash_status'), '"0"');
    assert.equal(f.values.get('trip_status'), undefined, 'Failed/cancelled startup must not mark a trip active');
    assert.equal(f.values.get('trip_tid'), undefined);
    assert.equal(f.redirects.length, 0);
    assert.equal(f.alerts.length, outcome === 'error' ? 0 : 1);
}
{
    const f = fixture();
    f.hydrate('{broken');
    assert.equal(f.reads, 0, 'Do not submit a form with malformed native settings');
    assert.equal(f.alerts.length, 1);
}
console.log('PASS attendance configuration recovery, automatic/attendance-only startup, missing settings, cancellation and native failure cleanup');
