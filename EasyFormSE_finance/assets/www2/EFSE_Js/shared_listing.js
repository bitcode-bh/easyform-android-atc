/* Home's settle-on-row behavior, shared by inset listing windows. */
var AppListing = (function () {
    'use strict';
    function toRowEdge(top, size, canGoOn) {
        return canGoOn ? (-top <= top + size ? top : top + size) : 0;
    }
    function bind(scroller, options) {
        if (!scroller) return;
        if (scroller.appListingCleanup) scroller.appListingCleanup();
        options = options || {};
        var touching = false, timer;
        function settle() {
            timer = null;
            if (touching || !scroller.clientHeight || (options.enabled && !options.enabled())) return;
            var bounds = scroller.getBoundingClientRect();
            var edge = options.head ? options.head.getBoundingClientRect().bottom : bounds.top;
            var rows = scroller.querySelectorAll(options.rows || '.app-listing > .app-listing-row, .app-listing > .item-content');
            for (var i = 0; i < rows.length; i++) {
                var row = rows[i].getBoundingClientRect();
                if (!row.height || row.top >= edge - 1 || row.bottom <= edge + 1) continue;
                if (row.height > bounds.bottom - edge) return;
                var by = Math.round(toRowEdge(row.top - edge, row.height,
                    scroller.scrollTop + scroller.clientHeight < scroller.scrollHeight - 1));
                if (!by) return;
                if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) scroller.scrollTop += by;
                else {
                    try { scroller.scrollBy({ top: by, behavior: 'smooth' }); }
                    catch (e) { scroller.scrollTop += by; }
                }
                return;
            }
        }
        function later() { clearTimeout(timer); timer = setTimeout(settle, 140); }
        function start() { touching = true; clearTimeout(timer); }
        function end() { touching = false; later(); }
        scroller.addEventListener('scroll', later, { passive: true });
        scroller.addEventListener('touchstart', start, { passive: true });
        scroller.addEventListener('touchend', end, { passive: true });
        scroller.addEventListener('touchcancel', end, { passive: true });
        scroller.appListingCleanup = function () {
            clearTimeout(timer);
            scroller.removeEventListener('scroll', later);
            scroller.removeEventListener('touchstart', start);
            scroller.removeEventListener('touchend', end);
            scroller.removeEventListener('touchcancel', end);
        };
        return scroller.appListingCleanup;
    }
    function init() {
        document.querySelectorAll('[data-listing-scroll]').forEach(function (scroller) { bind(scroller); });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
    return { bind: bind, toRowEdge: toRowEdge };
})();
