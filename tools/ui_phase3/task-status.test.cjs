const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const source = fs.readFileSync(path.resolve('EasyFormSE_finance/assets/www2/js/task_status.js'), 'utf8');
function setup() {
    const errors = [], requests = [], window = { console: { error: message => errors.push(message) } };
    vm.runInNewContext(source, { window });
    function reader(overrides = {}, Request) {
        const values = { company_id: '1', wayflow: 10, global_wcf_url: 'https://example.invalid/api/', ...overrides };
        const state = { glob_statusName_ary: { 0: 'Saved' } }, ready = [], messages = [];
        Request ||= function (url, data, success, failure) {
            const record = { url, data: JSON.parse(data), success, failure, sends: 0, cancelled: 0 }; requests.push(record);
            this.callOtherDomain = () => record.sends++; this.cancel = () => record.cancelled++;
        };
        const api = window.AppTaskStatus.create({ storage: { getItem: key => JSON.stringify(values[key] ?? null) }, request: Request }, state,
            page => ready.push(page), message => messages.push(message));
        return { api, state, ready, messages };
    }
    return { reader, requests, errors };
}
function response(rows) { return { responseText: JSON.stringify([{ status: 1, data: JSON.stringify([{ FSM_Data: rows }]) }]) }; }
const rows = [{ Status: 0, Status_Name: 'Pending', color: '#123456', text_color: '#abcdef' },
    { Status: 1, Status_Name: 'Completed', color: '', text_color: '#ffffff' }];

test('shared status reader preserves the existing request and status label/colour contract', () => {
    const h = setup(), a = h.reader({ company_id: 1 }); a.api.load('select_survey');
    assert.equal(h.requests[0].url, 'https://example.invalid/api/WCF_Get_ddl_Data');
    assert.deepEqual(h.requests[0].data, [{ Company_id: '1', Flow_id: 10, Flag: 'get_data' }]); assert.equal(h.requests[0].sends, 1);
    h.requests[0].success(response(rows));
    assert.equal(a.state.glob_statusName_ary[0], 'Pending'); assert.equal(a.state.glob_statusId_ary.Completed, 1);
    assert.equal(a.state.glob_statusColor_ary.Pending, '#123456'); assert.equal(a.state.glob_statusColor_ary.Completed, 'gray');
    assert.equal(a.state.glob_textColor_ary.Completed, '#ffffff'); assert.deepEqual(a.ready, ['select_survey']);
    a.api.cancel(); assert.equal(h.requests[0].cancelled, 0); assert.deepEqual(h.errors, []);
});
test('independent task status readers update only their own page state', () => {
    const h = setup(), a = h.reader(), b = h.reader({ wayflow: 20 }); a.api.load('a'); b.api.load('b');
    h.requests[1].success(response([{ Status: 0, Status_Name: 'Other', color: '#ffffff' }])); h.requests[0].success(response(rows));
    assert.equal(a.state.glob_statusName_ary[0], 'Pending'); assert.equal(b.state.glob_statusName_ary[0], 'Other');
    assert.equal(h.requests[1].data[0].Flow_id, 20); assert.deepEqual(a.ready, ['a']); assert.deepEqual(b.ready, ['b']);
});
test('a newer status read cancels the old request and ignores both stale replies', () => {
    const h = setup(), a = h.reader(); a.api.load('old'); a.api.load('new');
    assert.equal(h.requests[0].cancelled, 1); h.requests[0].success(response(rows)); h.requests[0].failure('retired');
    assert.equal(a.state.glob_statusName_ary[0], 'Saved'); assert.deepEqual(a.ready, []);
    h.requests[1].success(response(rows)); h.requests[1].failure('duplicate'); assert.deepEqual(a.ready, ['new']);
});
test('leaving a status reader cancels once and suppresses late mutation and continuation', () => {
    const h = setup(), a = h.reader(); a.api.load('a'); a.api.cancel(); a.api.cancel();
    h.requests[0].success(response(rows)); h.requests[0].failure('retired');
    assert.equal(h.requests[0].cancelled, 1); assert.equal(a.state.glob_statusName_ary[0], 'Saved'); assert.deepEqual(a.ready, []);
});
for (const body of ['{bad', '[]', JSON.stringify([{ status: 1, data: '[{"FSM_Data":null}]' }])]) test('malformed status data retains cached labels and continues once: ' + body, () => {
    const h = setup(), a = h.reader(); a.api.load('a'); h.requests[0].success({ responseText: body }); h.requests[0].failure('duplicate');
    assert.equal(a.state.glob_statusName_ary[0], 'Saved'); assert.deepEqual(a.ready, ['a']); assert.deepEqual(a.messages, []);
    assert.deepEqual(h.errors, ['Unable to read task status labels']);
});
test('server rejection keeps its existing user message and transport failure continues without inventing one', () => {
    const h = setup(), a = h.reader(); a.api.load('server'); h.requests[0].success({ responseText: '[{"status":0,"message":"Synthetic rejection"}]' });
    a.api.load('transport'); h.requests[1].failure('Synthetic transport failure');
    assert.deepEqual(a.messages, ['Synthetic rejection']); assert.deepEqual(a.ready, ['server', 'transport']); assert.equal(a.state.glob_statusName_ary[0], 'Saved');
});
for (const context of [{ company_id: null }, { wayflow: null }, { global_wcf_url: null }]) test('missing status context never guesses server arguments: ' + Object.keys(context)[0], () => {
    const h = setup(), a = h.reader(context); a.api.load('a'); assert.equal(h.requests.length, 0); assert.deepEqual(a.ready, ['a']);
    assert.deepEqual(h.errors, ['Unable to load task status labels']);
});
test('synchronous completion does not retain a cancellation handle', () => {
    const h = setup(); let cancellations = 0;
    const a = h.reader({}, function (url, data, success) { this.callOtherDomain = () => {}; this.cancel = () => cancellations++; success(response(rows)); });
    a.api.load('a'); a.api.cancel(); assert.deepEqual(a.ready, ['a']); assert.equal(cancellations, 0);
});
