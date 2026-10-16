const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict'), path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../EFSE_Js/common-functions.js'), 'utf8');
function fn(name) { const start = source.indexOf('function ' + name + '('), end = source.indexOf('\nfunction ', start + 1); return source.slice(start, end); }
const code = ['get_pending_upload_counts', 'confirm_logout', 'logout_on_click', 'logout_on_click_online'].map(fn).join('\n');
function fixture({ pending = {}, learning = false, fail = false, malformed = false, defer = false, accept = false, ios = false } = {}) {
    const messages = [], reads = [], callbacks = [], actions = [], timers = new Map(); let timerId = 0, clears = 0, destroys = 0;
    const context = vm.createContext({
        F7_device: ios ? 'ios' : 'android', username: 'test.user', uniqcode: 'test-session', imeino: 'test-device',
        setTimeout: fn => { timers.set(++timerId, fn); return timerId; }, clearTimeout: id => timers.delete(id),
        vibrate_device() {}, confirm: message => { messages.push(message); return accept; }, loading() {},
        lms_clear_vapt_cache: () => clears++, HomeDashboard: { destroy: () => destroys++ }, changeurl: url => actions.push(url),
        onsuccess_logout_on_click_online() {}, onfail_logout_on_click_online() {},
        cordova: { exec: (ok, error, plugin, action, args) => {
            if (action !== 'showValues') { actions.push(action); return; }
            const query = args[0].data; assert.match(query, /^select /i); assert(!/\b(?:delete|update|insert)\b/i.test(query)); reads.push(query);
            const respond = () => {
                if (/sqlite_master/.test(query)) { ok(learning ? '[{"name":"lms_action_queue"}]' : '[]'); return; }
                if (fail) { error('database unavailable'); return; }
                if (malformed) { ok('{broken'); return; }
                const row = {}; for (const match of query.matchAll(/\) as ([a-z]+)/g)) row[match[1]] = pending[match[1]] || 0;
                ok(JSON.stringify([row]));
            };
            if (defer) callbacks.push(respond); else respond();
        } }
    });
    vm.runInContext(code, context);
    return { context, messages, reads, callbacks, actions, timers, clears: () => clears, destroys: () => destroys };
}
for (const name of ['logout_on_click', 'logout_on_click_online']) {
    const empty = fixture(); empty.context[name]();
    assert.deepEqual(empty.messages, ['Are you sure you want to logout?']);
    assert.equal(empty.actions.length, 0); assert.equal(empty.clears(), 0);
    for (const queue of ['tasks', 'trips', 'videos', 'files', 'photos', 'history', 'learning']) {
        const f = fixture({ pending: { [queue]: 1 }, learning: true }); f.context[name]();
        assert.match(f.messages[0], /waiting to sync/); assert.equal(f.actions.length, 0); assert.equal(f.clears(), 0);
    }
    for (const error of [{ fail: true }, { malformed: true }]) {
        const f = fixture(error); f.context[name](); assert.match(f.messages[0], /could not be checked/); assert(!f.messages[0].includes('waiting to sync')); assert.equal(f.actions.length, 0);
    }
    const yes = fixture({ accept: true }); yes.context[name]();
    assert.deepEqual(yes.actions, [name === 'logout_on_click' ? 'Login.html' : 'login_detail_plug1']);
    assert.equal(yes.clears(), name === 'logout_on_click' ? 1 : 0, 'Online logout must retain data until the server acknowledges it');
    const timeout = fixture({ defer: true }); timeout.context[name](); timeout.context[name](); assert.equal(timeout.callbacks.length, 1, 'Repeated taps must not duplicate checks');
    [...timeout.timers.values()][0](); assert.equal(timeout.messages.length, 1); assert.match(timeout.messages[0], /could not be checked/);
    timeout.callbacks[0](); assert.equal(timeout.messages.length, 1, 'Late queue replies must not reopen the dialog');
    const ios = fixture({ ios: true }); ios.context[name](); assert.equal(ios.messages.length, 0); assert.equal(ios.reads.length, 0); assert.equal(ios.actions.length, 1);
}
{
    const f = fixture(); let counts;
    f.context.get_pending_upload_counts(value => counts = value);
    assert.equal(f.reads.length, 1, 'Home uses one aggregate read without optional logout queues');
    assert.equal(counts.known, true); assert.equal(counts.total, 0); assert.equal(counts.history, undefined); assert.equal(f.timers.size, 0);
    const queries = [];
    const full = fixture({ learning: true }); full.context.get_pending_upload_counts(() => {}, true); queries.push(full.reads.at(-1));
    if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(queries));
}
console.log('PASS fresh logout queue checks, all pending categories, empty/failed/malformed/timeout states, Stay/Yes actions, double-tap and late-callback handling, and shared Home counts');
