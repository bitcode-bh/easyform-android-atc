/* Persistent-page foundation. Production adapters are added in Phase 3. */
(function (w, d) {
    'use strict';
    if (w.AppShell) return;
    var pages = ('EF_Aadhar_Verification.html EF_Account_Verification.html EF_Custom_Reports.html EF_User_List.html ' +
        'EF_User_Update.html LMS_Dashboard.html Login.html Signup.html change_password.html download_status.html ' +
        'f7-verify-otp.html f7_faq.html f7_flowchart.html f7_myprofile.html f7_navbar.html f7_privacy_policy.html ' +
        'f7_safety_passport.html feature_chart.html feature_filter.html pending_status.html selection.html ' +
        'selection_survey.html support_page.html viewcustomerlist_on.html viewsitedata.html viewsitedata_task.html ' +
        'viewsitelist_pm_grouplist.html').split(' ');
    var configKey = 'mwfm_shell_config', previewKey = 'mwfm_shell_preview', bootKey = 'mwfm_shell_last_boot', flowKey = 'mwfm_shell_flow_scope';
    var definitions = Object.create(null), stack = [], current, host, busy = false, queued, redirecting = false;
    var pendingPage, generation = 0;
    var deviceReady = false, readyWaiters = [], owner, sessionOwner, nativeBack, booted = false;
    var fallbacks = Object.create(null);

    function decode(value) {
        for (var i = 0; i < 2 && typeof value === 'string'; i++) {
            try { value = JSON.parse(value); } catch (e) { return null; }
        }
        return value;
    }
    function account() {
        try {
            var values = ['company_id', 'user_id', 'global_wcf_url'].map(function (key) { return JSON.parse(w.storage.getItem(key)); });
            return values.every(function (value) { return value !== null && value !== undefined && value !== ''; }) ? JSON.stringify(values) : null;
        } catch (e) { return null; }
    }
    function route(url, allowLegacy) {
        try {
            var base = new URL('.', w.location.href), target = new URL(String(url), base);
            if (target.protocol !== base.protocol || target.host !== base.host || new URL('.', target).pathname !== base.pathname) return null;
            var name = target.pathname.split('/').pop();
            if (pages.indexOf(name) < 0 && !(allowLegacy && /^[\w-]+\.html$/.test(name))) return null;
            return { name: name, url: name + target.search + target.hash };
        } catch (e) { return null; }
    }
    function valid(value) {
        if (typeof value === 'boolean') return { enabled: value, pages: {} };
        if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
        var result = {};
        if (typeof value.enabled === 'boolean') result.enabled = value.enabled;
        if (value.pages && typeof value.pages === 'object' && !Array.isArray(value.pages)) {
            result.pages = {};
            pages.forEach(function (name) { if (typeof value.pages[name] === 'boolean') result.pages[name] = value.pages[name]; });
        }
        if (['default', 'atc', 'vodafone'].indexOf(value.theme) >= 0) result.theme = value.theme;
        if (['light', 'dark', 'system'].indexOf(value.colorScheme) >= 0) result.colorScheme = value.colorScheme;
        return result;
    }
    function settings() {
        var scope = account(), serverDisabled = false, result = { enabled: false, pages: {}, theme: 'default', colorScheme: 'light' };
        if (!scope) return result;
        function apply(value) {
            value = valid(value);
            if (value) Object.keys(value).forEach(function (key) { result[key] = value[key]; });
        }
        try {
            var saved = JSON.parse(w.localStorage.getItem(configKey));
            if (saved && saved.scope === scope) { apply(saved.config); serverDisabled = saved.config.enabled === false; }
        } catch (e) { }
        try {
            var flow = decode(w.storage.getItem('list_json'));
            flow = Array.isArray(flow) ? flow[0] : flow;
            if (flow && !serverDisabled && w.localStorage.getItem(flowKey) === scope) apply(flow.ui_shell);
        } catch (e) { }
        try {
            var preview = JSON.parse(w.sessionStorage.getItem(previewKey));
            if (preview && preview.scope === scope && preview.expires > Date.now()) apply(preview.config);
        } catch (e) { }
        return result;
    }
    function configure(value) {
        try {
            var config = valid(value), scope = account();
            w.sessionStorage.removeItem(previewKey);
            w.sessionStorage.removeItem(bootKey);
            w.localStorage.removeItem(flowKey);
            if (config && scope) w.localStorage.setItem(configKey, JSON.stringify({ scope: scope, config: config }));
            else w.localStorage.removeItem(configKey);
        } catch (e) { }
        if (host && owner !== account()) { queued = null; clearHistory(); }
    }
    function flowChanged(value) {
        try {
            var flow = decode(value), scope = account();
            flow = Array.isArray(flow) ? flow[0] : flow;
            if (scope && flow && valid(flow.ui_shell)) w.localStorage.setItem(flowKey, scope);
            else w.localStorage.removeItem(flowKey);
        } catch (e) { }
    }
    function preview(value) {
        try {
            var config = valid(value), scope = account();
            if (config && scope) w.sessionStorage.setItem(previewKey, JSON.stringify({ scope: scope, config: config, expires: Date.now() + 21600000 }));
            else w.sessionStorage.removeItem(previewKey);
        } catch (e) { }
    }
    function fallback(target, reason) {
        if (!target) return;
        var key = target.name + ':' + reason;
        fallbacks[key] = (fallbacks[key] || 0) + 1;
        d.dispatchEvent(new CustomEvent('mwfm:route-fallback', { detail: { page: target.name, reason: reason } }));
    }
    function eligible(target) {
        var config = settings();
        return !!target && config.enabled && config.pages[target.name] === true && !!definitions[target.name];
    }
    function reason(target) {
        if (!settings().enabled) return 'disabled';
        if (settings().pages[target.name] !== true) return 'page-disabled';
        return 'unregistered';
    }
    function register(name, definition) {
        if (pages.indexOf(name) < 0 || !definition || (typeof definition.create !== 'function' && typeof definition.load !== 'function')) {
            throw new Error('Invalid shell page definition');
        }
        if (definitions[name]) throw new Error('Shell page already registered');
        definitions[name] = { definition: definition, promise: null };
    }
    function adapter(target) {
        var entry = definitions[target.name];
        if (!entry.promise) {
            entry.promise = Promise.resolve().then(function () {
                return entry.definition.load ? entry.definition.load() : entry.definition;
            }).then(function (value) {
                if (!value || typeof value.create !== 'function') throw new Error('Invalid shell page adapter');
                return value;
            }).catch(function (error) { entry.promise = null; throw error; });
        }
        return entry.promise;
    }
    function scope() {
        var active = true, identity = account(), cleanup = [], timers = new Map();
        function defer(fn) { if (active) cleanup.push(fn); else fn(); return fn; }
        function guard(fn) { return function () { if (active && identity === account()) return fn.apply(this, arguments); }; }
        function own(fn) { return guard(function () { var args = Array.prototype.map.call(arguments, function (argument) { return typeof argument === 'function' ? own(argument) : argument; }); return fn.apply(this, args); }); }
        // Existing inline actions see only the active page's compatibility facade.
        // Scoped controllers and callbacks never resolve through this facade.
        function publish(values) {
            var installed = [];
            function restore() {
                installed.reverse().forEach(function (item) {
                    var now = Object.getOwnPropertyDescriptor(w, item.name), own = item.own;
                    if (!now || (own.get ? now.get !== own.get : now.value !== own.value)) return;
                    if (item.previous) Object.defineProperty(w, item.name, item.previous); else delete w[item.name];
                });
                installed = [];
            }
            try {
                Object.keys(values).forEach(function (name) {
                    var previous = Object.getOwnPropertyDescriptor(w, name), own = Object.getOwnPropertyDescriptor(values, name);
                    if (previous && !previous.configurable) {
                        if (!previous.writable || own.get) throw new Error('Page facade conflicts with a shared binding');
                        w[name] = own.value;
                    } else Object.defineProperty(w, name, Object.assign({}, own, { configurable: true }));
                    installed.push({name:name,previous:previous,own:Object.getOwnPropertyDescriptor(w,name)});
                });
            } catch (error) { restore(); throw error; }
            defer(restore);
        }
        function release(fn) { var index = cleanup.indexOf(fn); if (index >= 0) cleanup.splice(index, 1); }
        return {
            guard: guard, own: own, publish: publish, defer: defer, release: release,
            on: function (node, type, fn, options) {
                fn = guard(fn); node.addEventListener(type, fn, options);
                defer(function () { node.removeEventListener(type, fn, options); });
                return fn;
            },
            timeout: function (fn, ms) {
                function cancel() {
                    if (timers.get(id) !== cancel) return;
                    timers.delete(id); release(cancel); clearTimeout(id);
                }
                var id = setTimeout(guard(function () {
                    if (timers.get(id) !== cancel) return;
                    timers.delete(id); release(cancel); return fn.apply(this, arguments);
                }), ms);
                timers.set(id, cancel); defer(cancel); return id;
            },
            clearTimeout: function (id) { var cancel = timers.get(id); if (cancel) cancel(); },
            interval: function (fn, ms) {
                function cancel() {
                    if (timers.get(id) !== cancel) return;
                    timers.delete(id); release(cancel); clearInterval(id);
                }
                var id = setInterval(guard(function () {
                    if (timers.get(id) === cancel) return fn.apply(this, arguments);
                }), ms);
                timers.set(id, cancel); defer(cancel); return id;
            },
            clearInterval: function (id) { var cancel = timers.get(id); if (cancel) cancel(); },
            dispose: function () {
                if (!active) return;
                active = false;
                cleanup.splice(0).reverse().forEach(function (fn) { try { fn(); } catch (e) { w.console.error('MWFM page cleanup:', e); } });
            }
        };
    }
    function services(lifetime) {
        var result = { cordova: w.cordova, storage: w.storage, request: w.Webservicecall_REST, app: w.myApp };
        if (!lifetime) return result;
        var owner = account(), bridge = result.cordova, Request = result.request;
        function owned(fn) {
            return typeof fn !== 'function' ? fn : lifetime.guard(function () {
                if (owner === account()) return fn.apply(this, arguments);
            });
        }
        if (bridge && typeof bridge.exec === 'function') {
            result.cordova = Object.create(bridge);
            result.cordova.exec = owned(function () {
                var args = Array.prototype.slice.call(arguments);
                args[0] = owned(args[0]); args[1] = owned(args[1]);
                return bridge.exec.apply(bridge, args);
            });
        }
        if (typeof Request === 'function') {
            var create = owned(function () {
                var args = Array.prototype.slice.call(arguments), finished = false;
                function completion(callback) {
                    if (typeof callback !== 'function') return callback;
                    callback = owned(callback);
                    return function () {
                        if (finished) return;
                        finished = true; lifetime.release(cancel);
                        return callback.apply(this, arguments);
                    };
                }
                args[2] = completion(args[2]); args[3] = completion(args[3]); args[4] = completion(args[4]);
                var request = Reflect.construct(Request, args), send = request.callOtherDomain, stop = request.cancel;
                function cancel() {
                    if (finished) return;
                    finished = true; lifetime.release(cancel);
                    if (typeof stop === 'function') return stop.call(request);
                }
                request.callOtherDomain = owned(function () { if (!finished) return send.apply(request, arguments); });
                request.cancel = cancel;
                if (!finished) lifetime.defer(cancel);
                return request;
            });
            result.request = function () {
                return create.apply(this, arguments) || { callOtherDomain: function () {}, cancel: function () {} };
            };
            result.request.prototype = Request.prototype;
        }
        return result;
    }
    function capture(page) {
        var values = Object.create(null), scroll = [];
        page.root.querySelectorAll('[data-shell-state]').forEach(function (node) {
            var key = node.getAttribute('data-shell-state');
            if (key && !/^(password|file)$/i.test(node.type || '')) values[key] = node.type === 'checkbox' ? node.checked : node.value;
        });
        page.root.querySelectorAll('.page-content,[data-shell-scroll]').forEach(function (node) { scroll.push({ top: node.scrollTop, left: node.scrollLeft }); });
        return { values: values, scroll: scroll, page: page.adapter.capture ? page.adapter.capture(page.context) : null };
    }
    function restore(page, state) {
        if (!state) return;
        page.root.querySelectorAll('[data-shell-state]').forEach(function (node) {
            var key = node.getAttribute('data-shell-state');
            if (!state.values || !Object.prototype.hasOwnProperty.call(state.values, key) || /^(password|file)$/i.test(node.type || '')) return;
            if (node.type === 'checkbox') node.checked = state.values[key]; else node.value = state.values[key];
        });
        if (page.adapter.restore) page.adapter.restore(page.context, state.page);
        page.root.querySelectorAll('.page-content,[data-shell-scroll]').forEach(function (node, i) {
            if (state.scroll && state.scroll[i]) { node.scrollTop = state.scroll[i].top; node.scrollLeft = state.scroll[i].left; }
        });
    }
    function call(page, hook) { return page && page.adapter[hook] ? page.adapter[hook](page.context) : undefined; }
    function dispose(page) {
        if (!page || page.disposed) return;
        page.disposed = true;
        page.context.scope.dispose();
        try { call(page, 'dispose'); } catch (e) { w.console.error('MWFM page dispose:', e); }
        if (page.root && page.root.parentNode) page.root.parentNode.removeChild(page.root);
    }
    function reducedMotion() { return !!w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches; }
    function animate(previous, next, direction) {
        next.root.style.visibility = '';
        next.root.removeAttribute('aria-hidden');
        next.root.setAttribute('data-shell-direction', direction);
        if (reducedMotion()) return Promise.resolve();
        next.root.classList.add('app-shell-enter');
        if (previous) { previous.root.setAttribute('data-shell-direction', direction); previous.root.classList.add('app-shell-leave'); }
        return new Promise(function (resolve) { setTimeout(resolve, 190); });
    }
    function clearHistory() {
        generation++; dispose(pendingPage); pendingPage = null;
        dispose(current); current = null; stack = []; owner = account();
    }
    function bounded(work) {
        return new Promise(function (resolve, reject) {
            var timer = setTimeout(function () { reject(new Error('Shell page startup timed out')); }, 15000);
            work.then(function (value) { clearTimeout(timer); resolve(value); }, function (error) { clearTimeout(timer); reject(error); });
        });
    }
    function rememberBoot(target, why) {
        if (!booted) return;
        try {
            w.sessionStorage.setItem(bootKey, JSON.stringify({ scope: account(), at: Date.now(), page: target.name, reason: why,
                ready: deviceReady, registeredPages: Object.keys(definitions).length,
                core: { cordova: !!w.cordova, jquery: !!w.jQuery, framework7: !!w.myApp, storage: !!w.storage, request: !!w.Webservicecall_REST } }));
        } catch (e) { }
    }
    function noticeError(error) {
        w.console.error('MWFM shell navigation:', error);
        if (w.AppPhase1) w.AppPhase1.notice('Unable to open this page. Please try again.');
    }
    function change(target, direction, legacy) {
        var old = current, next, snapshot, backIndex = -1, permitted = false;
        if (owner !== account()) { clearHistory(); old = null; }
        var version = generation;
        function stale() { return version !== generation || owner !== account(); }
        function check() { if (stale()) throw new Error('Retired shell navigation'); }
        return Promise.resolve().then(function () {
            return old && old.adapter.canLeave ? old.adapter.canLeave(old.context, target.url) : true;
        }).then(function (ok) {
            check();
            if (ok === false) { queued = null; return false; }
            permitted = true;
            if (old) { snapshot = capture(old); old.root.classList.add('app-shell-blocked'); }
            if (!eligible(target)) {
                return Promise.resolve(call(old, 'leave')).then(function () {
                    fallback(target, reason(target)); rememberBoot(target, reason(target)); queued = null; clearHistory(); legacy(target.url, direction); return true;
                });
            }
            if (direction === 'back') {
                for (var i = stack.length - 2; i >= 0; i--) if (stack[i].url === target.url) { backIndex = i; break; }
            }
            var saved = backIndex >= 0 ? stack[backIndex].state : null;
            return bounded(adapter(target).then(function (definition) {
                check();
                var pageScope = scope();
                var context = { root: null, route: target.url, state: saved, direction: direction, scope: pageScope, services: services(pageScope) };
                next = { root: null, adapter: definition, context: context }; pendingPage = next;
                return Promise.resolve(definition.supports ? definition.supports(context) : true).then(function (supported) {
                    check();
                    if (supported === false) {
                        var unavailable = new Error('This flow retains its legacy page');
                        unavailable.shellFallback = 'page-unsupported'; throw unavailable;
                    }
                    var root = definition.create(d, context);
                    if (!root || root.nodeType !== 1 || root.parentNode) throw new Error('Shell pages must create a detached element');
                    root.classList.add('page', 'app-shell-page'); root.setAttribute('data-page', target.name); root.setAttribute('aria-hidden', 'true'); root.style.visibility = 'hidden';
                    next.root = root; context.root = root;
                    host.appendChild(root);
                    return Promise.resolve(call(next, 'reset')).then(function () { check(); return call(next, 'open'); });
                });
            }).then(function () {
                check();
                restore(next, saved);
                return call(old, 'leave');
            })).then(function () {
                check();
                if (old) { old.context.scope.dispose(); stack[stack.length - 1].state = snapshot; }
                if (backIndex >= 0) stack = stack.slice(0, backIndex + 1);
                else if (old && (old.context.route === target.url || direction === 'back')) stack[stack.length - 1] = { url: target.url, state: null };
                else { stack.push({ url: target.url, state: null }); if (stack.length > 20) stack.shift(); }
                current = next; pendingPage = null; owner = account();
                var bootstrap = host.querySelector('[data-shell-bootstrap]'); if (bootstrap) bootstrap.remove();
                try { w.history.replaceState(null, '', 'app-shell.html?route=' + encodeURIComponent(target.url)); } catch (e) { }
                if (w.AppLoader) w.AppLoader.hide();
                return Promise.resolve(call(next, 'activate')).then(function () { return animate(old, next, direction); }).then(function () { dispose(old); next.root.classList.remove('app-shell-enter'); return true; });
            });
        }).catch(function (error) {
            dispose(next);
            if (old) old.root.classList.remove('app-shell-blocked');
            if (stale()) { if (owner !== account()) clearHistory(); return false; }
            var expectedFallback = error && error.shellFallback === 'page-unsupported';
            if (!expectedFallback) noticeError(error); queued = null;
            // A failed leave guard must retain the current form and history.
            if (!permitted) return false;
            var failureReason = expectedFallback ? 'page-unsupported' : 'adapter-error';
            fallback(target, failureReason); rememberBoot(target, failureReason);
            clearHistory(); legacy(target.url, direction); return false;
        }).then(function (result) {
            if (old && old.root) old.root.classList.remove('app-shell-blocked');
            return result;
        });
    }
    function request(target, direction, legacy) {
        if (busy) { if (!queued || queued.target.url !== target.url) queued = { target: target, direction: direction, legacy: legacy }; return; }
        busy = true;
        if (w.AppLoader) w.AppLoader.busy();
        function finish() {
            busy = false; if (w.AppLoader) w.AppLoader.idle();
            var pending = queued; queued = null;
            if (pending && (!current || pending.target.url !== current.context.route)) navigate(pending.target.url, pending.direction, pending.legacy);
        }
        change(target, direction, legacy).then(finish, function (error) { queued = null; noticeError(error); finish(); });
    }
    function shellURL(target, direction) { return 'app-shell.html?route=' + encodeURIComponent(target.url) + (direction === 'back' ? '&direction=back' : ''); }
    function launch(url) {
        var target = route(url || 'selection.html');
        var here = w.location.pathname.split('/').pop();
        if (!target || !settings().enabled || redirecting || ['selection.html', 'Login.html'].indexOf(here) < 0) return false;
        redirecting = true;
        if (w.changeurl) w.changeurl(shellURL(target));
        else setTimeout(function () { w.location.href = shellURL(target); }, 0);
        setTimeout(function () { redirecting = false; }, 2000);
        return true;
    }
    function navigate(url, direction, legacy) {
        var target = route(url, true), inShell = d.documentElement.hasAttribute('data-app-shell');
        if (!target && inShell && current) {
            if (/^\s*(javascript|data|vbscript):/i.test(String(url))) {
                noticeError(new Error('Unsupported shell navigation')); return true;
            }
            // Even a legacy/external destination must respect the active
            // adapter's unsaved-change guard before leaving this document.
            target = { name: 'legacy', url: String(url) };
        }
        if (!target) return false;
        direction = direction === 'back' ? 'back' : 'forward';
        if (!inShell) {
            var loginEntry = w.location.pathname.split('/').pop() === 'Login.html' && target.name === 'selection.html' && settings().enabled;
            if (!eligible(target) && !loginEntry) { fallback(target, reason(target)); return false; }
            if (!redirecting) { redirecting = true; legacy(shellURL(target, direction), direction); setTimeout(function () { redirecting = false; }, 2000); }
            return true;
        }
        // Shared chrome and legacy helper aliases belong to one account session.
        // A different login must start a fresh document, not reuse its popups.
        if (booted && sessionOwner !== account()) {
            queued = null; clearHistory(); fallback(target, 'account-change'); legacy(target.url, direction); return true;
        }
        if (!host || (!current && !eligible(target))) { fallback(target, reason(target)); rememberBoot(target, reason(target)); return false; }
        request(target, direction, legacy); return true;
    }
    function back() {
        if (!current || stack.length < 2) return false;
        w.changeurl(stack[stack.length - 2].url, 'back'); return true;
    }
    d.addEventListener('deviceready', function () {
        deviceReady = true; readyWaiters.splice(0).forEach(function (resolve) { resolve(); });
    }, { once: true });
    function ready() {
        return new Promise(function (resolve, reject) {
            if (deviceReady) { resolve(services()); return; }
            var timer = setTimeout(function () { readyWaiters = readyWaiters.filter(function (fn) { return fn !== done; }); reject(new Error('Cordova startup timed out')); }, 8000);
            function done() { clearTimeout(timer); resolve(services()); }
            readyWaiters.push(done);
        });
    }
    function boot(element) {
        if (booted) return;
        booted = true; host = element; owner = sessionOwner = account();
        var query = new URL(w.location.href).searchParams, target = route(query.get('route') || 'selection.html') || route('selection.html');
        ready().then(function () { return w.AppComponents ? w.AppComponents.sideMenu() : null; }).then(function () {
            var config = settings();
            if (w.AppComponents) w.AppComponents.theme(config.theme, config.colorScheme);
            nativeBack = function (event) {
                event.preventDefault();
                if (w.AppComponents && w.AppComponents.dismissOverlay()) return;
                if (current && current.adapter.onBack && current.adapter.onBack(current.context) === true) return;
                if (!back()) { if (w.go_home_top) w.go_home_top(); else w.changeurl('selection.html', 'back'); }
            };
            d.addEventListener('backbutton', nativeBack, false);
            w.changeurl(target.url, query.get('direction'));
        }, function (error) {
            noticeError(error); rememberBoot(target, 'bridge-timeout');
            setTimeout(function () { w.location.replace(target.url); }, 0);
        });
    }
    function diagnostics() {
        var last;
        try { last = JSON.parse(w.sessionStorage.getItem(bootKey)); } catch (e) { }
        if (last && last.scope !== account()) last = null;
        if (last) { last = Object.assign({}, last); delete last.scope; }
        return { booted: booted, ready: deviceReady, registeredPages: Object.keys(definitions), historyDepth: stack.length,
            active: current ? current.context.route : null, fallbacks: Object.assign({}, fallbacks), lastBoot: last || null };
    }
    w.AppShell = { configure: configure, flowChanged: flowChanged, preview: preview, settings: settings, register: register, navigate: navigate,
        launch: launch, boot: boot, ready: ready, back: back, scope: scope, diagnostics: diagnostics,
        dispose: function () { queued = null; clearHistory(); if (nativeBack) d.removeEventListener('backbutton', nativeBack); } };
})(window, document);
