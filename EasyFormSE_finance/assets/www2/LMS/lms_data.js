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
        try { localStorage.setItem(ck(cacheKey), responseText); } catch (e) { /* quota — ignore */ }
    }

    function clearCache(cacheKey) {
        try { localStorage.removeItem(ck(cacheKey)); } catch (e) { }
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
     *   opts: { timeout (ms, default 15000), retries (default 1) }
     */
    function fetch(cacheKey, url, paramsStr, onData, onError, opts) {
        opts = opts || {};
        var timeout = opts.timeout || 15000;
        var maxRetries = opts.retries != null ? opts.retries : 1;

        var cached = getCache(cacheKey);
        if (cached != null && onData) {
            try { onData(cached, 'cache'); } catch (e) { }
        }

        var dedupKey = url + '|' + paramsStr;
        if (inflight[dedupKey]) return;             // a refresh for the same request is already running
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
            LMS_State.enqueueAction(actionType, { url: url, payload: paramsStr }, function () { optimisticOk(onSuccess); });
            return;
        }
        var g = new Webservicecall_REST(url, paramsStr,
            function (e) { if (onSuccess) onSuccess(e); },
            function (err) {
                if (hasQueue && !isOnline()) {
                    LMS_State.enqueueAction(actionType, { url: url, payload: paramsStr }, function () { optimisticOk(onSuccess); });
                } else if (onFail) onFail(err);
            });
        g.callOtherDomain();
    }
    // Replay queued actions sequentially (invoked by LMS_State on reconnect).
    function processOfflineQueue(records) {
        if (!records || !records.length || typeof LMS_State === 'undefined') return;
        (function next(i) {
            if (i >= records.length) return;
            var rec = records[i], pd;
            try { pd = JSON.parse(rec.payload); }
            catch (e) { LMS_State.removeAction(rec.id, function () { next(i + 1); }); return; }
            var g = new Webservicecall_REST(pd.url, pd.payload,
                function () { LMS_State.removeAction(rec.id, function () { next(i + 1); }); },
                function () { if (!isOnline()) return; next(i + 1); });
            g.callOtherDomain();
        })(0);
    }

    return {
        fetch: fetch,
        getCache: getCache,
        setCache: setCache,
        clearCache: clearCache,
        clearAll: clearAll,
        showSkeletons: showSkeletons,
        postAction: postAction,
        processOfflineQueue: processOfflineQueue,
        isOnline: isOnline,
        prefix: PREFIX
    };
})();
