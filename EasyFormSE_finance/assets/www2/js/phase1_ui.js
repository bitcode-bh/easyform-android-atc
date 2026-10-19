/* Phase 1 only: existing pages, controls and full-reload navigation. */
(function (w, d) {
    'use strict';
    if (w.AppPhase1) return;
    var noticeTimer, noticeNode, pendingNotice;
    var directionKey = 'mwfm_phase1_navigation';
    var noticeKey = 'mwfm_phase1_notice';
    var bundles = Object.create(null);
    var featureNames = ['notices', 'press', 'motion', 'lazyScripts', 'savedLists'];

    function decode(value) {
        for (var i = 0; i < 2 && typeof value === 'string'; i++) {
            try { value = JSON.parse(value); } catch (e) { return null; }
        }
        return value;
    }

    function account() {
        try { return ['company_id', 'user_id', 'global_wcf_url'].map(function (key) { return w.storage.getItem(key); }).join('|'); }
        catch (e) { return null; }
    }
    function validConfig(value) {
        if (typeof value === 'boolean') return value;
        if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
        var result = {};
        featureNames.forEach(function (name) { if (typeof value[name] === 'boolean') result[name] = value[name]; });
        return result;
    }
    // Existing login response and downloaded flow JSON can supply ui_phase1
    // switches. No new endpoint/request. Missing flags use DEFAULT_ON; an explicit false is the kill switch.
    // Preview is bounded, account-scoped session state for the debug demo only.
    var cached = null, CACHE_MS = 1000;
    function storedConfigs() {
        if (cached && Date.now() - cached.at < CACHE_MS) return cached.configs;
        var configs = [], scope = account();
        try {
            var saved = JSON.parse(w.localStorage.getItem('mwfm_phase1_server'));
            if (saved && saved.scope === scope) configs.push(saved.config);
        } catch (e) { }
        try {
            if (w.storage) {
                var flow = decode(w.storage.getItem('list_json'));
                flow = Array.isArray(flow) ? flow[0] : flow;
                if (flow) configs.push(flow.ui_phase1);
            }
        } catch (e) { }
        try {
            var preview = JSON.parse(w.sessionStorage.getItem('mwfm_phase1_preview'));
            if (preview && preview.scope === scope && preview.expires > Date.now()) configs.push(preview.config);
        } catch (e) { }
        cached = { at: Date.now(), configs: configs };
        return configs;
    }
    // A page start asks many times in a row; the flow JSON is large, so it is
    // read once a second at most. configure()/preview() reset it at once.
    // On unless the server (or a debug override) says false. The two switches that
    // change what loads or what is shown first stay off until proven on phones.
    var DEFAULT_ON = { notices: true, press: true, motion: true };
    function enabled(name) {
        var result = DEFAULT_ON[name] === true;
        storedConfigs().concat([w.MWFMPhase1Config]).forEach(function (config) {
            if (typeof config === 'boolean') result = config;
            else if (config && typeof config[name] === 'boolean') result = config[name];
        });
        return result;
    }

    function configure(value) {
        cached = null;
        try {
            var config = validConfig(value);
            if (config == null) w.localStorage.removeItem('mwfm_phase1_server');
            else w.localStorage.setItem('mwfm_phase1_server', JSON.stringify({ scope: account(), config: config }));
        } catch (e) { }
        syncClasses();
    }
    function preview(value) {
        cached = null;
        try {
            var config = validConfig(value);
            if (config == null) w.sessionStorage.removeItem('mwfm_phase1_preview');
            else w.sessionStorage.setItem('mwfm_phase1_preview', JSON.stringify({ scope: account(), config: config, expires: Date.now() + 6 * 60 * 60 * 1000 }));
        } catch (e) { }
        syncClasses();
    }

    function syncClasses() {
        ['press', 'motion'].forEach(function (name) {
            d.documentElement.classList.toggle('phase1-' + name, enabled(name));
        });
    }

    function technical(value, message) {
        return typeof value !== 'string' ||
            /(?:\b(?:TypeError|ReferenceError|SyntaxError|RangeError|Exception|SQLException|SQLiteException|JSONException)\b|^\s*Error:|\b(?:Cannot read|Cannot set|is not a function|is not defined)\b|\bat\s+\S+\s*\([^\n]+:\d+|\b(?:undefined|null)\b.*\b(?:property|function|object)\b|(?:^|\n)\s*(?:SELECT\s+(?:\*|\w+\s*,)|(?:INSERT INTO|UPDATE \w+ SET|DELETE FROM)\b)|https?:\/\/|(?:^|\n)\s*(?:[\[{]|<!doctype|<html)|_[A-Za-z_$][\w$]*\s*\(\s*\)\s*$)/i.test(message);
    }

    function showNotice(message) {
        if (!d.body) { pendingNotice = message; return; }
        if (!noticeNode) {
            noticeNode = d.createElement('div');
            noticeNode.className = 'phase1-notice';
            noticeNode.setAttribute('role', 'status');
            noticeNode.setAttribute('aria-live', 'polite');
            noticeNode.setAttribute('aria-atomic', 'true');
            d.body.appendChild(noticeNode);
        }
        clearTimeout(noticeTimer);
        noticeNode.textContent = message;
        noticeNode.classList.add('is-visible');
        // About 55 ms per character, so instructions can be read: 3.2 s up to 9 s.
        var readMs = Math.min(9000, Math.max(3200, 2500 + message.length * 55));
        noticeTimer = setTimeout(function () { noticeNode.classList.remove('is-visible'); }, readMs);
    }

    function notice(value) {
        var message;
        try { message = String(value == null ? '' : value); } catch (e) { message = ''; }
        if (technical(value, message)) {
            try { if (w.console && w.console.error) w.console.error('MWFM:', value); } catch (e) { }
            message = 'Something went wrong. Please try again.';
        }
        if (message.trim()) showNotice(message.slice(0, 240));
    }

    function navigate(url, direction) {
        try {
            var destination = String(url).split(/[?#]/)[0].split('/').pop();
            w.sessionStorage.setItem(directionKey, JSON.stringify({
                page: destination,
                direction: direction === 'back' ? 'back' : 'forward', at: Date.now()
            }));
            var message = pendingNotice || (noticeNode && noticeNode.classList.contains('is-visible') && noticeNode.textContent);
            if (message) w.sessionStorage.setItem(noticeKey, JSON.stringify({ message: message, page: destination, at: Date.now() }));
        } catch (e) { }
    }

    // Only scripts whose public entry points are asynchronous UI actions are
    // registered. Calculator/type22 remain eager: their renderers return values
    // synchronously and initialise state needed while the form is built.
    function register(src, names, initial) {
        Object.keys(initial || {}).forEach(function (name) {
            if (typeof w[name] === 'undefined') w[name] = initial[name];
        });
        if (!enabled('lazyScripts')) {
            d.write('<script src="' + src + '"><' + '/script>');
            return;
        }
        if (bundles[src]) return;
        var bundle = bundles[src] = { stubs: {}, calls: [], loading: false, implementations: null };

        function load() {
            if (bundle.loading) return;
            bundle.loading = true;
            var previous = {}, script = d.createElement('script'), timer;
            var attempt = bundle.attempt = (bundle.attempt || 0) + 1;
            names.forEach(function (name) { previous[name] = w[name]; });
            script.src = src;
            script.async = true;
            function finish(ok) {
                if (!bundle.loading || bundle.attempt !== attempt) return;
                bundle.loading = false;
                clearTimeout(timer);
                script.onload = script.onerror = null;
                var implementations = {};
                if (ok) names.forEach(function (name) {
                    if (typeof w[name] !== 'function' || w[name] === bundle.stubs[name]) ok = false;
                    else implementations[name] = w[name];
                });
                // Preserve functions that a later eager script intentionally
                // replaced. Late loading must not change existing load-order ownership.
                names.forEach(function (name) {
                    if (previous[name] !== bundle.stubs[name]) w[name] = previous[name];
                    else if (!ok) w[name] = bundle.stubs[name];
                });
                var calls = bundle.calls.splice(0);
                if (!ok) {
                    if (script.parentNode) script.parentNode.removeChild(script);
                    notice('Unable to open this control. Please try again.');
                    return;
                }
                bundle.implementations = implementations;
                calls.forEach(function (call) { implementations[call.name].apply(call.context, call.args); });
            }
            script.onload = function () { finish(true); };
            script.onerror = function () { finish(false); };
            timer = setTimeout(function () { finish(false); }, 15000);
            d.head.appendChild(script);
        }
        names.forEach(function (name) {
            bundle.stubs[name] = w[name] = function () {
                if (bundle.implementations) return bundle.implementations[name].apply(this, arguments);
                bundle.calls.push({ name: name, context: this, args: Array.prototype.slice.call(arguments) });
                load();
            };
        });
    }

    function enter() {
        syncClasses();
        var state;
        try {
            state = JSON.parse(w.sessionStorage.getItem(directionKey));
            w.sessionStorage.removeItem(directionKey);
        } catch (e) { }
        var page = String(w.location.pathname).split('/').pop();
        var back = state && state.page === page && Date.now() - state.at < 15000 && state.direction === 'back';
        d.documentElement.setAttribute('data-phase1-direction', back ? 'back' : 'forward');
        try {
            var savedNotice = JSON.parse(w.sessionStorage.getItem(noticeKey));
            w.sessionStorage.removeItem(noticeKey);
            if (savedNotice && savedNotice.page === page && Date.now() - savedNotice.at < 5000 && enabled('notices')) {
                pendingNotice = savedNotice.message;
            }
        } catch (e) { }
        if (pendingNotice) { showNotice(pendingNotice); pendingNotice = null; }
    }

    w.AppPhase1 = { enabled: enabled, notice: notice, navigate: navigate, sync: syncClasses,
        register: register, configure: configure, preview: preview };
    syncClasses();
    if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', enter);
    else enter();
    var css = d.createElement('link');
    css.rel = 'stylesheet'; css.href = 'css/phase1_ui.css';
    d.head.appendChild(css);
})(window, document);
