/* ==========================================================================
   LmsData — cache-first data layer (Phase 1)
   --------------------------------------------------------------------------
   A THIN, opt-in wrapper over the existing Webservicecall_REST. It does not
   replace it and does not change any existing call site unless that site is
   migrated. Provides:
     - read-through localStorage cache (instant paint) + silent refresh
     - request de-duplication (one in-flight request per url+params)
     - timeout + limited retry with backoff (transport failures only)
     - a cache-version prefix for invalidation after schema changes
     - clearAll() for VAPT logout wipe
     - showSkeletons() helper for first-load placeholders
   Backward compatible: if this file is absent, callers fall back to the
   original Webservicecall_REST path.
   ========================================================================== */
var LmsData = (function () {
    'use strict';

    var CACHE_VERSION = 'v1';                       // bump to invalidate every cache after a schema change
    var PREFIX = 'lms_cache_' + CACHE_VERSION + '_';
    var inflight = {};                              // "url|params" -> true

    function ck(k) { return PREFIX + k; }

    function getCache(cacheKey) {
        try { return localStorage.getItem(ck(cacheKey)); } catch (e) { return null; }
    }

    function setCache(cacheKey, responseText) {
        try {
            localStorage.setItem(ck(cacheKey), responseText);
            localStorage.setItem(ck(cacheKey) + '__t', String(Date.now()));   // when it was saved, for opts.maxAge
        } catch (e) { /* quota — ignore */ }
    }

    // Progress was saved: the module list, assessments and dashboard carry
    // progress too, so their saved copies stay on screen but are fetched again
    // on the next view instead of waiting out LIST_MAX_AGE.
    function markListsStale() {
        try {
            var stale = [];
            for (var i = 0; i < localStorage.length; i++) {
                var k = localStorage.key(i);
                if (k && k.indexOf(PREFIX) === 0 && /__t$/.test(k)
                    && /^(modules|assessments|dashboard)/.test(k.slice(PREFIX.length))) stale.push(k);
            }
            stale.forEach(function (k) { localStorage.removeItem(k); });
        } catch (e) { }
    }

    // Milliseconds since the cache entry was saved; Infinity when unknown.
    function cacheAge(cacheKey) {
        try {
            var t = Number(localStorage.getItem(ck(cacheKey) + '__t'));
            return t ? Date.now() - t : Infinity;
        } catch (e) { return Infinity; }
    }

    function clearCache(cacheKey) {
        try { localStorage.removeItem(ck(cacheKey)); localStorage.removeItem(ck(cacheKey) + '__t'); } catch (e) { }
    }

    // Remove every LmsData cache entry (used on logout for VAPT compliance).
    function clearAll() {
        try {
            var toRemove = [];
            for (var i = 0; i < localStorage.length; i++) {
                var k = localStorage.key(i);
                if (k && k.indexOf(PREFIX) === 0) toRemove.push(k);
            }
            for (var j = 0; j < toRemove.length; j++) localStorage.removeItem(toRemove[j]);
        } catch (e) { }
    }

    /**
     * Cache-first fetch.
     *   onData(responseText, source)  source is 'cache' then 'network'
     *   onError(err)                  only fires when NO cache was shown and the network failed
     *   opts: { timeout (ms, default 15000), retries (default 1),
     *           maxAge (ms): when the cached copy is younger than this, show it
     *           and skip the network entirely }
     */
    function fetch(cacheKey, url, paramsStr, onData, onError, opts) {
        opts = opts || {};
        var timeout = opts.timeout || 15000;
        var maxRetries = opts.retries != null ? opts.retries : 1;
        var force = opts.force === true;

        var cached = null;
        if (!force) {
            cached = getCache(cacheKey);
            if (cached != null && onData) {
                try { onData(cached, 'cache'); } catch (e) { }
            }
            if (cached != null && opts.maxAge && cacheAge(cacheKey) < opts.maxAge) return;
        }

        var dedupKey = url + '|' + paramsStr;
        if (inflight[dedupKey]) {
            if (!force) return;                       // a refresh for the same request is already running
            delete inflight[dedupKey];                // force: allow a fresh network fetch
        }
        inflight[dedupKey] = true;

        var attempt = 0;
        function run() {
            var settled = false;
            var g = new Webservicecall_REST(url, paramsStr,
                function (e) {
                    if (settled) return; settled = true;
                    delete inflight[dedupKey];
                    var txt = e && e.responseText;
                    if (txt != null) {
                        setCache(cacheKey, txt);
                        if (onData) { try { onData(txt, 'network'); } catch (er) { } }
                    }
                },
                function (err) {
                    if (settled) return;
                    if (attempt < maxRetries) {
                        attempt++;
                        setTimeout(run, 500 * attempt);   // backoff
                        return;
                    }
                    settled = true;
                    delete inflight[dedupKey];
                    if (cached == null && onError) { try { onError(err); } catch (er) { } }
                },
                null, timeout
            );
            g.callOtherDomain();
        }
        run();
    }

    // First-load placeholder cards (replaced by the real render when data arrives).
    function showSkeletons(selector, count) {
        var el = document.querySelector(selector);
        if (!el) return;
        var n = count || 4, html = '';
        for (var i = 0; i < n; i++) {
            html += '<div class="lms-skel-card">' +
                        '<div class="lms-skel-thumb"></div>' +
                        '<div class="lms-skel-body">' +
                            '<div class="lms-skel-line w80"></div>' +
                            '<div class="lms-skel-line w60"></div>' +
                            '<div class="lms-skel-line w40"></div>' +
                        '</div>' +
                    '</div>';
        }
        el.innerHTML = html;
    }

    // Error / retry state shown when a fetch fails and no cache was available.
    function showError(selector, retryCall) {
        var el = document.querySelector(selector);
        if (!el) return;
        el.innerHTML = '<div class="lms-state-card">' +
            '<div class="lms-state-icon"><i class="fa-solid fa-cloud-arrow-down"></i></div>' +
            '<div class="lms-state-title">Couldn\'t load</div>' +
            '<div class="lms-state-sub">Check your connection and try again.</div>' +
            '<button type="button" class="lms-state-retry" onclick="' + (retryCall || '') + '">Retry</button>' +
            '</div>';
    }

    // ---- Offline-tolerant write (Phase 2) -------------------------------------
    function isOnline() {
        if (navigator.connection && navigator.connection.type) return navigator.connection.type !== 'none';
        return navigator.onLine !== false;
    }
    function optimisticOk(onSuccess) {
        if (onSuccess) { try { onSuccess({ responseText: '[{"status":1,"offline":true}]' }); } catch (e) { } }
    }
    // Online: behaves exactly like a normal Webservicecall_REST (onSuccess/onFail
    // fire unchanged). Offline, or on a mid-flight network drop: enqueue the
    // action for later replay and report optimistic success.
    function postAction(url, paramsStr, actionType, onSuccess, onFail) {
        var hasQueue = (typeof LMS_State !== 'undefined');
        if (hasQueue && !isOnline()) {
            LMS_State.enqueueAction(actionType, { url: url, payload: paramsStr }, function (saved) {
                if (saved) optimisticOk(onSuccess);
                else if (onFail) onFail('Unable to save offline action');
            });
            return;
        }
        var g = new Webservicecall_REST(url, paramsStr,
            function (e) { if (onSuccess) onSuccess(e); },
            function (err) {
                if (hasQueue && !isOnline()) {
                    LMS_State.enqueueAction(actionType, { url: url, payload: paramsStr }, function (saved) {
                        if (saved) optimisticOk(onSuccess);
                        else if (onFail) onFail('Unable to save offline action');
                    });
                } else if (onFail) onFail(err);
            });
        g.callOtherDomain();
    }
    // Replay queued actions sequentially (invoked by LMS_State on reconnect).
    function processOfflineQueue(records, onDone) {
        var finished = false;
        function done() { if (!finished) { finished = true; if (onDone) onDone(); } }
        if (!records || !records.length || typeof LMS_State === 'undefined') { done(); return; }
        (function next(i) {
            if (i >= records.length) { done(); return; }
            var rec = records[i], pd;
            try { pd = JSON.parse(rec.payload); }
            catch (e) { done(); return; }
            var g = new Webservicecall_REST(pd.url, pd.payload,
                function (response) {
                    var result;
                    try { result = JSON.parse(response.responseText); } catch (e) { done(); return; }
                    // HTTP success alone does not confirm that the write was saved.
                    if (!result || !result[0] || String(result[0].status) !== '1') { done(); return; }
                    LMS_State.removeAction(rec.id, function (removed) { if (removed === false) done(); else next(i + 1); });
                },
                function () { done(); });
            try { g.callOtherDomain(); } catch (e) { done(); }
        })(0);
    }

    return {
        fetch: fetch,
        getCache: getCache,
        setCache: setCache,
        cacheAge: cacheAge,
        markListsStale: markListsStale,
        // Lists (modules, assessments, dashboard) are fetched again only after
        // this long, or on pull-down; lessons behind the course times once a day.
        LIST_MAX_AGE: 10 * 60 * 1000,
        LESSONS_MAX_AGE: 24 * 60 * 60 * 1000,
        clearCache: clearCache,
        clearAll: clearAll,
        showSkeletons: showSkeletons,
        showError: showError,
        postAction: postAction,
        processOfflineQueue: processOfflineQueue,
        isOnline: isOnline,
        prefix: PREFIX
    };
})();

// Every LMS request that saves progress (watch logs, quiz answers, ratings,
// micro-learning activity) marks the saved lists out of date as it is sent,
// so no screen shows progress older than the last thing the learner did.
(function () {
    if (typeof Webservicecall_REST !== 'function' || Webservicecall_REST.lmsWrapped) return;
    var Original = Webservicecall_REST;
    var SAVES_PROGRESS = /\/(LMS_Insert|LMS_Skill_VideoLog_Master)/;
    Webservicecall_REST = function (url1, params, sucesscallback, failcallback, catchback, settimeout, is_type30, retryState) {
        if (SAVES_PROGRESS.test(String(url1))) LmsData.markListsStale();
        return new Original(url1, params, sucesscallback, failcallback, catchback, settimeout, is_type30, retryState);
    };
    Webservicecall_REST.lmsWrapped = true;
})();
