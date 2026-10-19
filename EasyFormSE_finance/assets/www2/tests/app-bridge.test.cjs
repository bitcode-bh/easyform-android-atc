const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/app_bridge.js'), 'utf8');

function load() {
    const timers = [];
    const w = { console };
    w.window = w;
    vm.runInContext(source, vm.createContext({ window: w, Promise, Error, JSON, Array, Number, String, RegExp,
        setTimeout: (fn, ms) => { timers.push({ fn, ms }); return timers.length; }, clearTimeout: () => { } }));
    return { AppBridge: w.AppBridge, timers };
}
// A host that records calls and answers when the test says so.
function host() {
    const calls = [];
    return { calls, exec(ok, fail, service, action, args) { calls.push({ ok, fail, service, action, args }); } };
}
const reject = async (promise, code) => assert.rejects(promise, error => { assert.equal(error.code, code); return true; });

test('a named read asks the native side for the query by name and returns its rows', async () => {
    const { AppBridge } = load(), h = host(), bridge = AppBridge.create(h);
    const pending = bridge.taskByTid(7);
    assert.deepEqual(JSON.parse(JSON.stringify(h.calls[0])), { service: 'DataBridge', action: 'query', args: [{ name: 'taskByTid', args: { tid: 7 } }] });
    h.calls[0].ok(JSON.stringify({ rows: [{ tid: '7', task_id: 'a' }] }));
    assert.deepEqual(JSON.parse(JSON.stringify(await pending)), [{ tid: '7', task_id: 'a' }]);
});

test('every named read sends only its declared value', async () => {
    const { AppBridge } = load(), h = host(), bridge = AppBridge.create(h);
    bridge.flowMapping(2287); bridge.taskCountByFlag('1');
    assert.equal(h.calls[0].args[0].name, 'flowMapping'); assert.deepEqual(JSON.parse(JSON.stringify(h.calls[0].args[0].args)), { moduleid: 2287 });
    assert.equal(h.calls[1].args[0].name, 'taskCountByFlag'); assert.deepEqual(JSON.parse(JSON.stringify(h.calls[1].args[0].args)), { flag: '1' });
    h.calls[1].ok(JSON.stringify({ rows: [{ n: '3' }] }));
    h.calls[0].ok(JSON.stringify({ rows: [] }));
});

test('a count comes back as a number, and no rows as zero', async () => {
    const { AppBridge } = load(), h = host(), bridge = AppBridge.create(h);
    const a = bridge.taskCountByFlag('1'); h.calls[0].ok(JSON.stringify({ rows: [{ n: '12' }] })); assert.equal(await a, 12);
    const b = bridge.taskCountByFlag('1'); h.calls[1].ok(JSON.stringify({ rows: [] })); assert.equal(await b, 0);
});

test('errors carry a short code, never native text', async () => {
    const { AppBridge } = load(), h = host(), bridge = AppBridge.create(h);
    const a = bridge.taskByTid(1); h.calls[0].fail('data-invalid'); await reject(a, 'data-invalid');
    const b = bridge.taskByTid(1); h.calls[1].fail('near "SELECT": syntax error in task_master for user 42'); await reject(b, 'bridge-failed');
    const c = bridge.taskByTid(1); h.calls[2].fail({ message: 'x' }); await reject(c, 'bridge-failed');
});

test('a result that is not the expected shape is an error, not undefined behaviour', async () => {
    const { AppBridge } = load(), h = host(), bridge = AppBridge.create(h);
    const a = bridge.taskByTid(1); h.calls[0].ok('not json'); await reject(a, 'bridge-bad-result');
    const b = bridge.taskByTid(1); h.calls[1].ok(''); await reject(b, 'bridge-bad-result');
    const c = bridge.taskByTid(1); h.calls[2].ok(JSON.stringify({ other: 1 })); await reject(c, 'bridge-bad-result');
});

test('a raw SQL read always gives an array, including when the native side returns an empty string', async () => {
    const { AppBridge } = load(), h = host(), bridge = AppBridge.create(h);
    const a = bridge.sql('select 1'); h.calls[0].ok(''); assert.deepEqual(JSON.parse(JSON.stringify(await a)), []);
    const b = bridge.sql('select 1'); h.calls[1].ok('[{"x":"1"}]'); assert.deepEqual(JSON.parse(JSON.stringify(await b)), [{ x: '1' }]);
    assert.equal(h.calls[0].service, 'SqlitePlugin'); assert.equal(h.calls[0].action, 'showValues');
});

test('a call that is never answered times out once, and a late answer is ignored', async () => {
    const { AppBridge, timers } = load(), h = host(), bridge = AppBridge.create(h, { timeout: 5000 });
    const pending = bridge.taskByTid(1);
    assert.equal(timers[0].ms, 5000);
    timers[0].fn();
    await reject(pending, 'bridge-timeout');
    h.calls[0].ok(JSON.stringify({ rows: [] }));
    assert.equal(bridge.pending(), 0);
});

test('leaving the page retires its calls: late answers and new calls are refused', async () => {
    const { AppBridge } = load(), h = host(), bridge = AppBridge.create(h);
    const pending = bridge.taskByTid(1);
    bridge.retire();
    h.calls[0].ok(JSON.stringify({ rows: [{ tid: '1' }] }));
    await reject(pending, 'bridge-retired');
    await reject(bridge.taskByTid(2), 'bridge-retired');
    assert.equal(h.calls.length, 1);
});

test('a missing native side is reported, and a throwing host does not leak its message', async () => {
    const { AppBridge } = load();
    await reject(AppBridge.create(null).taskByTid(1), 'bridge-unavailable');
    await reject(AppBridge.create({}).taskByTid(1), 'bridge-unavailable');
    await reject(AppBridge.create({ exec() { throw new Error('secret path /data/x'); } }).taskByTid(1), 'bridge-failed');
});

test('the shared bridge follows the window cordova object, which the shell fills in later', async () => {
    const { AppBridge } = load();
    const bridge = AppBridge.shared();
    await reject(bridge.taskByTid(1), 'bridge-unavailable');
});

test('the upload summary counts tasks, files, photos and videos, and ignores anything else in the row', async () => {
    const { AppBridge } = load(), h = host(), bridge = AppBridge.create(h);
    const pending = bridge.outbox();
    assert.equal(h.calls[0].args[0].name, 'pendingUploads');
    h.calls[0].ok(JSON.stringify({ rows: [{ tasks: '2', files: '3', photos: '4', videos: '1', other: '9' }] }));
    assert.deepEqual(JSON.parse(JSON.stringify(await pending)), { tasks: 2, files: 3, photos: 4, videos: 1, total: 10 });
    const empty = bridge.outbox(); h.calls[1].ok(JSON.stringify({ rows: [] }));
    assert.deepEqual(JSON.parse(JSON.stringify(await empty)), { tasks: 0, files: 0, photos: 0, videos: 0, total: 0 });
});

const tick = () => new Promise(resolve => setImmediate(resolve));

test('a page read asks for the old result shape and hands its handler the same string showValues returned', async () => {
    const { AppBridge } = load(), h = host(), got = [];
    AppBridge.on(h).read(text => got.push(text), code => got.push('fail:' + code), 'formDataByStep', { tid: 7, c_id: undefined, step: null });
    const call = h.calls[0];
    assert.deepEqual(JSON.parse(JSON.stringify(call.args)), [{ name: 'formDataByStep', args: { tid: '7', c_id: 'undefined', step: 'null' }, compat: true }]);
    call.ok(JSON.stringify({ rows: [{ f_data: 'x', imei: 'dev' }] }));
    await tick();
    assert.deepEqual(got, ['[{"f_data":"x","imei":"dev"}]']);
});

test('a page read reports a native failure to the failure handler only, never an error thrown by the success handler', async () => {
    const { AppBridge, timers } = load(), h = host(), failures = [];
    AppBridge.on(h).read(() => { throw new Error('page handler bug'); }, code => failures.push(code), 'loginImei', {});
    h.calls[0].ok(JSON.stringify({ rows: [] }));
    await tick();
    assert.deepEqual(failures, []);
    // The handler's error is raised again as an uncaught error, so the page's error logging sees it.
    assert.throws(() => timers.at(-1).fn(), /page handler bug/);
    AppBridge.on(h).read(() => { }, code => failures.push(code), 'loginImei', {});
    h.calls[1].fail('data-unavailable');
    await tick();
    assert.deepEqual(failures, ['data-unavailable']);
});

test('a bridge over a page-owned cordova object keeps using that object, and is shared per object', async () => {
    const { AppBridge } = load(), a = host(), b = host();
    assert.equal(AppBridge.on(a), AppBridge.on(a));
    assert.notEqual(AppBridge.on(a), AppBridge.on(b));
    AppBridge.on(b).read(() => { }, () => { }, 'loginImei', {});
    assert.equal(a.calls.length, 0); assert.equal(b.calls.length, 1);
});

test('a first-column read gives the plain value, as the old p=0 read did, and no rows is "No data found"', async () => {
    const { AppBridge } = load(), h = host(), got = [];
    AppBridge.on(h).first(v => got.push(['ok', v]), e => got.push(['fail', e]), 'formDataByStep', { tid: 1, c_id: 2, step: 3 });
    assert.equal(h.calls[0].args[0].first, true); assert.equal(h.calls[0].args[0].compat, true);
    h.calls[0].ok(JSON.stringify({ rows: [{ f_data: 'abc', imei: 'd' }], first: 'abc' }));
    AppBridge.on(h).first(v => got.push(['ok', v]), e => got.push(['fail', e]), 'formDataByStep', { tid: 1, c_id: 2, step: 3 });
    h.calls[1].ok(JSON.stringify({ rows: [] }));
    AppBridge.on(h).first(v => got.push(['ok', v]), e => got.push(['fail', e]), 'formDataByStep', { tid: 1, c_id: 2, step: 3 });
    h.calls[2].ok(JSON.stringify({ rows: [{ f_data: 'Unknown' }], first: null }));
    AppBridge.on(h).first(v => got.push(['ok', v]), e => got.push(['fail', e]), 'formDataByStep', { tid: 1, c_id: 2, step: 3 });
    h.calls[3].fail('data-unavailable');
    await tick();
    assert.deepEqual(JSON.parse(JSON.stringify(got)), [['ok', 'abc'], ['fail', 'No data found'], ['ok', null], ['fail', 'data-unavailable']]);
});
