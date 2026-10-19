const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const webRoot = path.resolve(__dirname, '../../EasyFormSE_finance/assets/www2');
const source = fs.readFileSync(path.join(webRoot, 'js/app_shell.js'), 'utf8');
const A = 'selection.html', B = 'selection_survey.html', C = 'viewsitelist_pm_grouplist.html';
const flush = () => new Promise(resolve => setImmediate(resolve));

function store(initial = {}) {
    const values = new Map(Object.entries(initial));
    return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key) };
}
function element() {
    const attrs = new Map(), classes = new Set(), listeners = new Map();
    return { nodeType: 1, parentNode: null, children: [], style: {}, states: [], scrollers: [],
        classList: { add: (...names) => names.forEach(n => classes.add(n)), remove: (...names) => names.forEach(n => classes.delete(n)) },
        setAttribute: (key, value) => attrs.set(key, value), getAttribute: key => attrs.get(key),
        hasAttribute: key => attrs.has(key), removeAttribute: key => attrs.delete(key),
        appendChild(child) { this.children.push(child); child.parentNode = this; },
        removeChild(child) { this.children.splice(this.children.indexOf(child), 1); child.parentNode = null; },
        remove() { this.parentNode?.removeChild(this); },
        querySelector() { return null; },
        querySelectorAll(selector) { return selector === '[data-shell-state]' ? this.states : this.scrollers; },
        addEventListener(type, fn) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(fn); },
        removeEventListener(type, fn) { listeners.get(type)?.delete(fn); },
        dispatchEvent(event) { [...(listeners.get(event.type) || [])].forEach(fn => fn(event)); },
        listenerCount: type => listeners.get(type)?.size || 0
    };
}
function field(key, value, type = 'search') { return { value, type, getAttribute: () => key }; }
function setup({ shell = false, page = A, device = true } = {}) {
    const document = element(); document.documentElement = element();
    if (shell) document.documentElement.setAttribute('data-app-shell', '');
    const values = { company_id: 1, user_id: 2, global_wcf_url: 'https://example.invalid/api/', list_json: null };
    const timers = new Map(), legacy = [], errors = [], clearedTimers = []; let nextTimer = 0;
    const window = { document, localStorage: store(), sessionStorage: store(), console: { error: (...args) => errors.push(args) },
        storage: { getItem: key => JSON.stringify(values[key]) },
        location: { href: 'file:///android_asset/www2/' + (shell ? 'app-shell.html?route=' + page : page), pathname: '/android_asset/www2/' + (shell ? 'app-shell.html' : page) },
        history: { replaceState() {} }, matchMedia: () => ({ matches: true }),
        cordova: { exec() { throw new Error('Unit tests must not call a native service'); } },
        jQuery: {}, myApp: {}, Webservicecall_REST() {}, AppPhase1: { notice() {} } };
    const context = vm.createContext({ window, document, URL, Date, Promise,
        CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
        setTimeout: (fn, ms) => { timers.set(++nextTimer, { fn, ms }); return nextTimer; }, clearTimeout: id => { clearedTimers.push(id); timers.delete(id); },
        setInterval: (fn, ms) => { timers.set(++nextTimer, { fn, ms }); return nextTimer; }, clearInterval: id => timers.delete(id) });
    vm.runInContext(source, context);
    const ui = window.AppShell;
    function reload(url, direction) { legacy.push({ url, direction }); }
    window.changeurl = (url, direction) => { if (!ui.navigate(url, direction, reload)) reload(url, direction); };
    if (device) document.dispatchEvent({ type: 'deviceready' });
    return { ui, window, document, values, timers, legacy, errors, reload, context, clearedTimers };
}
function enabled(s, names = [A, B, C]) { s.ui.configure({ enabled: true, pages: Object.fromEntries(names.map(n => [n, true])) }); }
function page(log, options = {}) {
    return {
        create() { const root = element(); root.states = [field('search', ''), field('tab', 'pending', 'hidden'), field('secret', '', 'password')]; root.scrollers = [{ scrollTop: 0, scrollLeft: 0 }]; return root; },
        reset(ctx) { log.push(['reset', ctx.route]); },
        open(ctx) { log.push(['open', ctx.route]); options.open?.(ctx); },
        leave(ctx) { log.push(['leave', ctx.route]); },
        dispose(ctx) { log.push(['dispose', ctx.route]); },
        ...(options.canLeave ? { canLeave: options.canLeave } : {})
    };
}
async function start(s, definitions = {}) {
    enabled(s);
    for (const [name, adapter] of Object.entries(definitions)) s.ui.register(name, adapter);
    const host = element(); s.ui.boot(host); await flush(); return host;
}

test('shell and page switches require typed values and are isolated by account', () => {
    const s = setup();
    assert.equal(s.ui.settings().enabled, false);
    s.ui.configure({ enabled: 'true', pages: { [A]: 'true' } });
    assert.equal(s.ui.settings().enabled, false);
    assert.equal(s.ui.settings().pages[A], undefined);
    enabled(s); assert.equal(s.ui.settings().pages[B], true);
    s.values.user_id = 3; assert.equal(s.ui.settings().enabled, false);
    s.values.user_id = 2;
    s.values.list_json = JSON.stringify([{ ui_shell: { enabled: false } }]);
    s.ui.flowChanged(s.values.list_json);
    assert.equal(s.ui.settings().enabled, false);
    s.ui.preview({ enabled: true, pages: {} });
    assert.equal(s.ui.settings().enabled, true);
    assert.deepEqual(Object.keys(s.ui.settings().pages), [], 'preview can explicitly keep every route in fallback');
    s.ui.configure(undefined); s.values.list_json = null;
    assert.equal(s.ui.settings().enabled, false, 'omitted login field clears configuration and preview');
});

test('cached flow rollout is bound to the selecting account and must be rebound after login', () => {
    const s = setup();
    s.values.list_json = JSON.stringify([{ ui_shell: { enabled: true, pages: { [A]: true } } }]);
    assert.equal(s.ui.settings().enabled, false, 'an unowned cached flow cannot enable the shell');
    s.ui.flowChanged(s.values.list_json); assert.equal(s.ui.settings().enabled, true);
    s.values.user_id = 3; assert.equal(s.ui.settings().enabled, false);
    s.ui.configure(undefined); assert.equal(s.ui.settings().enabled, false);
    s.ui.flowChanged(s.values.list_json); assert.equal(s.ui.settings().enabled, true);
    s.ui.configure(undefined); assert.equal(s.ui.settings().enabled, false, 'same-account re-login also clears a stale flow override');
});

test('an explicit login kill switch cannot be overridden by a cached flow', () => {
    const s = setup(); s.ui.configure({ enabled: false });
    s.values.list_json = JSON.stringify([{ ui_shell: { enabled: true, pages: { [A]: true } } }]);
    s.ui.flowChanged(s.values.list_json);
    assert.equal(s.ui.settings().enabled, false);
    s.ui.preview({ enabled: true, pages: {} });
    assert.equal(s.ui.settings().enabled, true, 'only the explicit account-scoped QA preview can override the kill switch');
});

test('disabled, unregistered, unknown and non-asset routes retain legacy navigation', () => {
    const s = setup();
    for (const url of [A, B, 'future.html', 'https://example.invalid/selection.html', '../selection.html', 'javascript:alert(1)']) {
        assert.equal(s.ui.navigate(url, 'forward', s.reload), false);
    }
    enabled(s);
    assert.equal(s.ui.navigate(B, 'forward', s.reload), false, 'a server switch cannot enable a page with no adapter');
    assert.throws(() => s.ui.register('../selection.html', { create() {} }), /Invalid/);
    assert.equal(s.legacy.length, 0, 'caller remains responsible for its unchanged fallback');
});

test('all current production pages remain fallback even if a server enables their flags', () => {
    const s = setup();
    const names = fs.readdirSync(webRoot).filter(name => name.endsWith('.html') && name !== 'app-shell.html');
    assert.equal(names.length, 27);
    enabled(s, names);
    for (const name of names) assert.equal(s.ui.navigate(name, 'forward', s.reload), false, name);
    assert.deepEqual(Array.from(s.ui.diagnostics().registeredPages), []);
});

test('a demo preview expires and is ignored for a different account', () => {
    const s = setup(); s.ui.preview({ enabled: true, pages: { [A]: true } });
    assert.equal(s.ui.settings().enabled, true);
    s.values.company_id = 5; assert.equal(s.ui.settings().enabled, false); s.values.company_id = 1;
    const preview = JSON.parse(s.window.sessionStorage.getItem('mwfm_shell_preview')); preview.expires = Date.now() - 1;
    s.window.sessionStorage.setItem('mwfm_shell_preview', JSON.stringify(preview));
    assert.equal(s.ui.settings().enabled, false);
});

test('enabled login enters the shell even when all production pages remain fallback', () => {
    const s = setup({ page: 'Login.html' }); s.ui.configure({ enabled: true, pages: {} });
    assert.equal(s.ui.navigate(A, 'forward', s.reload), true);
    assert.equal(s.legacy[0].url, 'app-shell.html?route=selection.html');
    s.ui.navigate(A, 'forward', s.reload);
    assert.equal(s.legacy.length, 1, 'repeated login callbacks do not start two shell entries');
});

test('core readiness and bootstrap run once; an all-fallback shell returns to original HTML', async () => {
    const s = setup({ shell: true, device: false }); s.ui.configure({ enabled: true, pages: {} });
    let loaded = 0; s.window.AppComponents = { sideMenu: () => { loaded++; return Promise.resolve(); }, theme() {} };
    const host = element(); s.ui.boot(host); s.ui.boot(host);
    assert.equal(s.legacy.length, 0);
    s.document.dispatchEvent({ type: 'deviceready' }); await flush();
    assert.equal(loaded, 1); assert.equal(s.document.listenerCount('backbutton'), 1);
    assert.equal(s.legacy.length, 1); assert.equal(s.legacy[0].url, A);
    const last = s.ui.diagnostics().lastBoot;
    assert.equal(last.ready, true); assert.equal(last.registeredPages, 0);
    assert.ok(Object.values(last.core).every(Boolean));
    assert.equal(s.timers.size, 0, 'startup timeout is released');
});

test('Back recreates the page and restores opt-in search, tab and scroll without retaining password state', async () => {
    const s = setup({ shell: true }), log = [];
    const host = await start(s, { [A]: page(log), [B]: page(log) });
    const first = host.children[0]; first.states[0].value = 'helmet'; first.states[1].value = 'completed'; first.states[2].value = 'private'; first.scrollers[0].scrollTop = 260;
    s.window.changeurl(B); await flush();
    assert.equal(first.parentNode, null);
    assert.equal(s.ui.back(), true); await flush();
    const restored = host.children[0];
    assert.notEqual(restored, first);
    assert.equal(restored.states[0].value, 'helmet'); assert.equal(restored.states[1].value, 'completed');
    assert.equal(restored.states[2].value, ''); assert.equal(restored.scrollers[0].scrollTop, 260);
    assert.equal(log.filter(([hook, route]) => hook === 'reset' && route === A).length, 2);
    assert.equal(s.ui.diagnostics().historyDepth, 1);
});

test('leaving releases page listeners, timers and late native callbacks exactly once', async () => {
    const s = setup({ shell: true }), log = [], target = element(); let guarded, called = 0;
    await start(s, { [A]: page(log, { open(ctx) {
        ctx.scope.on(target, 'change', () => called++);
        ctx.scope.timeout(() => called++, 100); ctx.scope.interval(() => called++, 100);
        guarded = ctx.scope.guard(() => called++);
    } }), [B]: page(log) });
    assert.equal(target.listenerCount('change'), 1); assert.equal(s.timers.size, 2);
    s.window.changeurl(B); await flush();
    target.dispatchEvent({ type: 'change' }); guarded();
    assert.equal(called, 0); assert.equal(target.listenerCount('change'), 0); assert.equal(s.timers.size, 0);
    assert.equal(log.filter(([hook, route]) => hook === 'dispose' && route === A).length, 1);
});

test('cancelled or failed leave guards retain the active page and history, including queued taps', async () => {
    for (const guard of [() => false, () => { throw new Error('guard failed'); }, () => Promise.reject(new Error('guard failed'))]) {
        const s = setup({ shell: true }), log = [];
        const host = await start(s, { [A]: page(log, { canLeave: guard }), [B]: page(log), [C]: page(log) });
        const first = host.children[0]; s.window.changeurl(B); s.window.changeurl(C); await flush();
        assert.equal(s.ui.diagnostics().active, A); assert.equal(s.ui.diagnostics().historyDepth, 1);
        assert.equal(host.children[0], first); assert.equal(s.legacy.length, 0);
    }
});

test('external/legacy fallbacks respect the leave guard and script URLs cannot bypass it', async () => {
    const s = setup({ shell: true }), log = []; let allow = false;
    await start(s, { [A]: page(log, { canLeave: () => allow }) });
    s.window.changeurl('https://example.invalid/help'); await flush();
    assert.equal(s.legacy.length, 0); assert.equal(s.ui.diagnostics().active, A);
    allow = true; s.window.changeurl('javascript:alert(1)'); await flush();
    assert.equal(s.legacy.length, 0); assert.equal(s.ui.diagnostics().active, A);
    s.window.changeurl('https://example.invalid/help'); await flush();
    assert.equal(s.legacy.length, 1); assert.equal(s.legacy[0].url, 'https://example.invalid/help');
});

test('failed first-use page loading falls back once and allows a later retry', async () => {
    const s = setup({ shell: true }), log = []; let attempts = 0;
    await start(s, { [A]: page(log), [B]: { load() { return ++attempts === 1 ? Promise.reject(new Error('asset unavailable')) : page(log); } } });
    s.window.changeurl(B); await flush();
    assert.equal(s.legacy.length, 1); assert.equal(s.legacy[0].url, B);
    assert.equal(log.filter(([hook, route]) => hook === 'dispose' && route === A).length, 1);
    assert.equal(s.ui.navigate(B, 'forward', s.reload), true); await flush();
    assert.equal(attempts, 2); assert.equal(s.ui.diagnostics().active, B);
});

test('rapid navigation keeps the latest destination and deduplicates repeated page opening', async () => {
    const s = setup({ shell: true }), log = []; let allow;
    await start(s, { [A]: page(log, { canLeave: () => new Promise(resolve => { allow = resolve; }) }), [B]: page(log), [C]: page(log) });
    s.window.changeurl(B); s.window.changeurl(B); s.window.changeurl(C); await flush();
    allow(true); await flush(); await flush();
    assert.equal(s.ui.diagnostics().active, C);
    assert.equal(log.filter(([hook, route]) => hook === 'open' && route === B).length, 1);
    assert.equal(s.legacy.length, 0);
});

test('changing account drops old state and reloads instead of reusing another account\'s chrome', async () => {
    const s = setup({ shell: true }), log = [];
    const host = await start(s, { [A]: page(log), [B]: page(log) });
    host.children[0].states[0].value = 'previous account filter';
    s.values.user_id = 3; enabled(s); s.window.changeurl(B); await flush();
    assert.equal(s.ui.diagnostics().active, null); assert.equal(s.ui.diagnostics().historyDepth, 0);
    assert.equal(host.children.length, 0); assert.equal(s.ui.back(), false);
    assert.equal(s.legacy.length, 1); assert.equal(s.legacy[0].url, B);
});

test('an account change retires an unfinished page open and releases its resources', async () => {
    const s = setup({ shell: true }), log = []; let release;
    const delayed = page(log); delayed.open = ctx => { ctx.scope.interval(() => {}, 100); return new Promise(resolve => { release = resolve; }); };
    const host = await start(s, { [A]: page(log), [B]: delayed });
    s.window.changeurl(B); await flush();
    s.values.user_id = 3; enabled(s);
    assert.equal(host.children.length, 0);
    assert.equal([...s.timers.values()].filter(timer => timer.ms === 100).length, 0);
    release(); await flush();
    assert.equal(host.children.length, 0); assert.equal(s.ui.diagnostics().active, null);
    assert.equal(s.legacy.length, 0, 'a retired request must not navigate using old account context');
});

test('a hung page startup falls back and its late completion cannot remount a retired page', async () => {
    const s = setup({ shell: true }), log = []; let release;
    const delayed = page(log); delayed.open = ctx => { ctx.scope.interval(() => {}, 100); return new Promise(resolve => { release = resolve; }); };
    const host = await start(s, { [A]: page(log), [B]: delayed });
    s.window.changeurl(B); await flush();
    const timeout = [...s.timers.values()].find(timer => timer.ms === 15000);
    assert.ok(timeout, 'page loading has a bounded timeout'); timeout.fn(); await flush();
    assert.equal(s.legacy.length, 1); assert.equal(s.legacy[0].url, B);
    assert.equal(host.children.length, 0); assert.equal(s.ui.diagnostics().active, null);
    release(); await flush();
    assert.equal(host.children.length, 0); assert.equal(s.legacy.length, 1);
    assert.equal(log.filter(([hook, route]) => hook === 'dispose' && route === B).length, 1);
    assert.equal([...s.timers.values()].filter(timer => timer.ms === 100).length, 0);
});


function requestBridge(s) {
    const requests = [];
    function Request(...args) {
        this.args = args; this.sends = 0; this.cancels = 0;
        this.callOtherDomain = function () { assert.equal(this, request); this.sends++; return 'sent'; };
        this.cancel = function () { assert.equal(this, request); this.cancels++; };
        const request = this; requests.push(this);
    }
    Request.prototype.kind = 'shared-request';
    s.window.Webservicecall_REST = Request;
    return requests;
}

test('core readiness preserves the original shared bridge and request identities', async () => {
    const s = setup();
    const ready = await s.ui.ready();
    assert.equal(ready.cordova, s.window.cordova); assert.equal(ready.request, s.window.Webservicecall_REST);
    assert.equal(ready.storage, s.window.storage); assert.equal(ready.app, s.window.myApp);
});

test('page native calls preserve arguments, repeated callbacks and nulls, then retire on leave', async () => {
    const s = setup({ shell: true }), calls = [], received = [], receiver = {}; let ctx;
    const bridge = s.window.cordova;
    bridge.platformId = 'android';
    bridge.exec = function (...args) { assert.equal(this, bridge); calls.push(args); return 'native-result'; };
    await start(s, { [A]: page([], { open(value) { ctx = value; } }), [B]: page([]) });
    const args = ['unchanged'], success = function (...args) { received.push([this, ...args]); };
    assert.equal(ctx.services.cordova.platformId, 'android');
    assert.equal(ctx.services.cordova.exec(success, null, 'ReadService', 'read', args), 'native-result');
    assert.equal(calls[0][1], null); assert.equal(calls[0][2], 'ReadService'); assert.equal(calls[0][3], 'read'); assert.equal(calls[0][4], args);
    calls[0][0].call(receiver, 'first', 1); calls[0][0].call(receiver, 'second', 2);
    assert.deepEqual(received, [[receiver, 'first', 1], [receiver, 'second', 2]]);
    ctx.services.cordova.exec(null, null, 'ReadService', 'read', args);
    assert.equal(calls[1][0], null); assert.equal(calls[1][1], null);
    s.window.changeurl(B); await flush();
    calls[0][0]('late'); ctx.services.cordova.exec(success, success, 'ReadService', 'read', args);
    assert.equal(received.length, 2); assert.equal(calls.length, 2);
});

test('native success, failure and new calls are suppressed when the page account changes', async () => {
    const s = setup({ shell: true }), calls = []; let ctx, received = 0;
    s.window.cordova.exec = (...args) => calls.push(args);
    await start(s, { [A]: page([], { open(value) { ctx = value; } }) });
    ctx.services.cordova.exec(() => received++, () => received++, 'ReadService', 'read', []);
    s.values.user_id = 3;
    calls[0][0](); calls[0][1](); ctx.services.cordova.exec(null, null, 'ReadService', 'read', []);
    assert.equal(received, 0); assert.equal(calls.length, 1);
});

test('page requests retain the shared contract and cancel pending work once on leave', async () => {
    const s = setup({ shell: true }), requests = requestBridge(s); let ctx, received = 0;
    await start(s, { [A]: page([], { open(value) { ctx = value; } }), [B]: page([]) });
    const params = { unchanged: true }, retry = { attempts: 2 };
    const request = new ctx.services.request('https://example.invalid/read', params, () => received++, () => received++, null, 1234, 'true', retry);
    assert.ok(request instanceof s.window.Webservicecall_REST); assert.equal(request.kind, 'shared-request');
    assert.equal(request.args[0], 'https://example.invalid/read'); assert.equal(request.args[1], params);
    assert.equal(request.args[4], null); assert.equal(request.args[5], 1234); assert.equal(request.args[6], 'true'); assert.equal(request.args[7], retry);
    assert.equal(request.callOtherDomain(), 'sent'); assert.equal(request.sends, 1);
    s.window.changeurl(B); await flush();
    request.args[2]('late'); request.args[3]('late'); request.cancel(); request.callOtherDomain();
    const retired = new ctx.services.request('https://example.invalid/read', params, () => received++);
    retired.callOtherDomain(); retired.cancel();
    assert.equal(request.cancels, 1); assert.equal(request.sends, 1); assert.equal(received, 0); assert.equal(requests.length, 1);
});

for (const index of [2, 3, 4]) test('completed request callback ' + index + ' releases cleanup and preserves receiver and arguments', async () => {
    const s = setup({ shell: true }); requestBridge(s); let ctx;
    await start(s, { [A]: page([], { open(value) { ctx = value; } }), [B]: page([]) });
    const received = [], receiver = {}, args = ['https://example.invalid/read', '[{}]', null, null, null];
    args[index] = function (...values) { received.push([this, ...values]); return 'handled'; };
    const request = new ctx.services.request(...args);
    request.callOtherDomain();
    assert.equal(request.args[index].call(receiver, 'response', 7), 'handled');
    request.args[index]('duplicate');
    assert.deepEqual(received, [[receiver, 'response', 7]]);
    s.window.changeurl(B); await flush(); request.cancel(); request.callOtherDomain();
    assert.equal(request.cancels, 0); assert.equal(request.sends, 1, 'completed requests cannot be resent');
});

test('manual cancellation suppresses both late callbacks and repeated cancellation', async () => {
    const s = setup({ shell: true }); requestBridge(s); let ctx, received = 0;
    await start(s, { [A]: page([], { open(value) { ctx = value; } }), [B]: page([]) });
    const request = new ctx.services.request('https://example.invalid/read', '[{}]', () => received++, () => received++);
    request.cancel(); request.cancel(); request.args[2](); request.args[3](); request.callOtherDomain();
    s.window.changeurl(B); await flush();
    assert.equal(request.cancels, 1); assert.equal(request.sends, 0); assert.equal(received, 0);
});

test('account changes block stale request creation, sends and callbacks', async () => {
    const s = setup({ shell: true }), requests = requestBridge(s); let ctx, received = 0;
    await start(s, { [A]: page([], { open(value) { ctx = value; } }) });
    const request = new ctx.services.request('https://example.invalid/read', '[{}]', () => received++);
    s.values.user_id = 3;
    request.callOtherDomain(); request.args[2]('previous account');
    const retired = new ctx.services.request('https://example.invalid/read', '[{}]', () => received++);
    retired.callOtherDomain(); retired.cancel(); s.ui.dispose();
    assert.equal(request.sends, 0); assert.equal(received, 0); assert.equal(requests.length, 1);
});

for (const failure of ['throw', 'timeout']) test(failure + ' during page startup retires pending native and server callbacks', async () => {
    const s = setup({ shell: true }), requests = requestBridge(s), calls = []; let received = 0;
    s.window.cordova.exec = (...args) => calls.push(args);
    const delayed = page([]);
    delayed.open = function (ctx) {
        ctx.services.cordova.exec(() => received++, () => received++, 'ReadService', 'read', []);
        new ctx.services.request('https://example.invalid/read', '[{}]', () => received++).callOtherDomain();
        if (failure === 'throw') throw new Error('Synthetic startup failure');
        return new Promise(() => {});
    };
    await start(s, { [A]: page([]), [B]: delayed });
    s.window.changeurl(B); await flush();
    if (failure === 'timeout') { [...s.timers.values()].find(t => t.ms === 15000).fn(); await flush(); }
    assert.equal(requests[0].cancels, 1); assert.equal(s.legacy.length, 1);
    calls[0][0](); calls[0][1](); requests[0].args[2](); assert.equal(received, 0);
});

test('a fired scope timeout releases its cleanup while live resources still dispose', () => {
    const s = setup(), scope = s.ui.scope(); let calls = 0, detachedCleanup = 0;
    const detached = scope.defer(() => detachedCleanup++); scope.release(detached);
    const completed = scope.timeout(() => calls++, 100), pending = scope.timeout(() => calls++, 200);
    const fired = s.timers.get(completed); s.timers.delete(completed); fired.fn();
    scope.dispose(); scope.dispose();
    assert.equal(calls, 1); assert.equal(detachedCleanup, 0);
    assert.equal(s.clearedTimers.includes(completed), false, 'completed timeout cleanup must not be retained');
    assert.equal(s.clearedTimers.filter(id => id === pending).length, 1);
    assert.equal(s.timers.size, 0);
});


for (const cause of ['HTTP', 'timeout']) test('page leave cancels the real shared transport during an active ' + cause + ' retry', async () => {
    const s = setup({ shell: true }), xhrs = []; let ctx, replies = 0;
    class XHR {
        constructor() { this.readyState = 0; this.status = 0; this.sends = 0; this.aborts = 0; xhrs.push(this); }
        open() { this.readyState = 1; } setRequestHeader() {} send() { this.sends++; }
        abort() { this.aborts++; this.readyState = 4; this.status = 0; this.onreadystatechange?.(); }
    }
    Object.assign(s.values, { username: 'Synthetic', uniqcode: 'Synthetic', role_id: 7 });
    Object.assign(s.context, { XMLHttpRequest: XHR, storage: s.window.storage, localStorage: s.window.localStorage,
        mk_notify() {}, loading_hide() {}, vibrate_device() {}, alert() { throw new Error('Unexpected alert'); } });
    vm.runInContext(fs.readFileSync(path.join(webRoot, 'js/webservicecall_REST.js'), 'utf8'), s.context);
    s.window.Webservicecall_REST = s.context.Webservicecall_REST;
    await start(s, { [A]: page([], { open(value) { ctx = value; } }), [B]: page([]) });
    const request = new ctx.services.request('https://example.invalid/read', '[{}]', () => replies++, () => replies++, null, 4312);
    request.callOtherDomain();
    if (cause === 'HTTP') { xhrs[0].readyState = 4; xhrs[0].status = 503; xhrs[0].onreadystatechange(); }
    else { const [id, timer] = [...s.timers.entries()].find(([, timer]) => timer.ms === 4312); s.timers.delete(id); timer.fn(); }
    assert.equal(xhrs.length, 2); const retry = xhrs[1], late = retry.onreadystatechange;
    s.window.changeurl(B); await flush();
    assert.equal(retry.aborts, 1); assert.equal(s.timers.size, 0);
    retry.readyState = 4; retry.status = 200; retry.responseText = '[{"status":1}]'; late();
    request.callOtherDomain(); assert.equal(xhrs.length, 2); assert.equal(replies, 0);
});

test('synchronously completed requests do not retain a cancellation cleanup', async () => {
    const s = setup({ shell: true }); let ctx, cancellations = 0, replies = 0;
    s.window.Webservicecall_REST = function (url, params, success) {
        this.callOtherDomain = () => {}; this.cancel = () => cancellations++; success('immediate');
    };
    await start(s, { [A]: page([], { open(value) { ctx = value; } }), [B]: page([]) });
    new ctx.services.request('https://example.invalid/read', '[{}]', () => replies++);
    s.window.changeurl(B); await flush();
    assert.equal(replies, 1); assert.equal(cancellations, 0);
});


test('unsupported page flows fall back silently before creating/resetting UI and release startup resources',async()=>{
 const s=setup({shell:true}),log=[];const unsupported=page(log);let created=0;
 unsupported.supports=ctx=>{ctx.scope.interval(()=>{},123);return false;};unsupported.create=()=>{created++;throw Error('Unsupported UI must not mount');};
 await start(s,{[A]:page(log),[B]:unsupported});s.window.changeurl(B);await flush();
 assert.equal(created,0);assert.equal(log.some(([hook,route])=>hook==='reset'&&route===B),false);
 assert.equal(s.legacy.length,1);assert.equal(s.legacy[0].url,B);assert.equal(s.errors.length,0);
 assert.equal(s.ui.diagnostics().fallbacks[B+':page-unsupported'],1);assert.equal([...s.timers.values()].some(t=>t.ms===123),false);
});
test('supported page startup checks finish before create/reset/open',async()=>{
 const s=setup({shell:true}),log=[];let release;const supported=page(log);
 supported.supports=()=>new Promise(resolve=>{release=resolve;});await start(s,{[A]:page(log),[B]:supported});
 s.window.changeurl(B);await flush();assert.equal(log.some(([hook,route])=>hook==='open'&&route===B),false);
 release(true);await flush();assert.equal(s.ui.diagnostics().active,B);assert.equal(s.legacy.length,0);
});
test('account changes retire an unfinished page support check without mounting late UI',async()=>{
 const s=setup({shell:true}),log=[];let release;const pending=page(log);
 pending.supports=ctx=>{ctx.scope.interval(()=>{},123);return new Promise(resolve=>{release=resolve;});};
 const host=await start(s,{[A]:page(log),[B]:pending});s.window.changeurl(B);await flush();s.values.user_id=3;enabled(s);
 release(true);await flush();assert.equal(host.children.length,0);assert.equal(s.legacy.length,0);assert.equal([...s.timers.values()].some(t=>t.ms===123),false);
});
test('unexpected failures during a page support check retain normal error fallback',async()=>{
 const s=setup({shell:true}),log=[];const broken=page(log);broken.supports=()=>Promise.reject(new Error('Synthetic read failure'));
 await start(s,{[A]:page(log),[B]:broken});s.window.changeurl(B);await flush();assert.equal(s.legacy.length,1);assert.ok(s.errors.length>0);
 assert.equal(s.ui.diagnostics().fallbacks[B+':adapter-error'],1);
});

test('manually cancelled page timeouts release cleanup and suppress queued callbacks',()=>{
 const s=setup(),scope=s.ui.scope();let replies=0;const id=scope.timeout(()=>replies++,100),timer=s.timers.get(id);
 const cancel=scope.clearTimeout||s.context.clearTimeout;cancel(id);timer.fn();scope.dispose();
 assert.equal(replies,0);assert.equal(s.clearedTimers.filter(value=>value===id).length,1);assert.equal(s.timers.size,0);
});
test('page timers cannot cancel another page timer and repeated cancellation stays idempotent',()=>{
 const s=setup(),a=s.ui.scope(),b=s.ui.scope();let replies=0;const id=b.timeout(()=>replies++,100);
 assert.equal(typeof a.clearTimeout,'function');a.clearTimeout(id);assert.equal(s.timers.has(id),true);
 b.clearTimeout(id);b.clearTimeout(id);a.dispose();b.dispose();assert.equal(s.clearedTimers.filter(value=>value===id).length,1);assert.equal(replies,0);
});
test('manually cancelled page intervals stop queued ticks and release their cleanup',()=>{
 const s=setup(),scope=s.ui.scope();let replies=0,clears=0;const clear=s.context.clearInterval;s.context.clearInterval=id=>{clears++;clear(id);};
 const id=scope.interval(()=>replies++,100),timer=s.timers.get(id);timer.fn();assert.equal(replies,1);
 assert.equal(typeof scope.clearInterval,'function');scope.clearInterval(id);scope.clearInterval(id);timer.fn();scope.dispose();
 assert.equal(replies,1);assert.equal(clears,1);assert.equal(s.timers.size,0);
});


test('page actions, events and timers cannot write state after an account change',()=>{
 const s=setup(),scope=s.ui.scope(),node=element();let writes=0;
 const action=scope.guard(()=>writes++);scope.on(node,'click',action);const id=scope.timeout(action,100),timer=s.timers.get(id);
 action();assert.equal(writes,1);s.values.user_id=999;action();node.dispatchEvent({type:'click'});timer.fn();
 assert.equal(writes,1,'stale page code never runs, including before native/request guards');
 scope.dispose();assert.equal(node.listenerCount('click'),0);assert.equal(s.timers.size,0);
});
