// The app's one loading animation; styles in css/app_loader.css.
//   AppLoader.show() / hide()  the full-screen loader. A page shows it just
//                              before it leaves for another page, and the
//                              next page writes it first thing in its body
//                              (AppLoader.html()) and hides it when ready,
//                              so the animation runs unbroken across the
//                              page change.
//   AppLoader.busy() / idle()  the same drawing in a small tile, for a wait
//                              inside a page (common-functions.js loading()).
var AppLoader = (function () {
    var LOOP_MS = 1200, T0_KEY = 'app_loader_t0';

    // The site card's mark: a dot with one ring pulsing out from it.
    var SVG = '<svg viewBox="0 0 132 100" fill="none" stroke="#2a3086" stroke-width="2">'
        + '<circle class="al-r" cx="66" cy="50" r="48"/>'
        + '<circle cx="66" cy="50" r="6" fill="#2a3086" stroke="none"/></svg>';

    // How far into its loop the full-screen loader is, counted from when it
    // first came up -- on this page or the one before it.
    function phase() {
        var now = Date.now(), t0 = 0;
        try { t0 = parseInt(localStorage.getItem(T0_KEY), 10) || 0; } catch (e) { }
        if (!t0 || now - t0 > 20000 || now < t0) {
            t0 = now;
            try { localStorage.setItem(T0_KEY, String(t0)); } catch (e) { }
        }
        return (now - t0) % LOOP_MS;
    }

    // True when the page before this one left under the loader, so this one
    // should open under it too.
    function pending() {
        var t0 = 0;
        try { t0 = parseInt(localStorage.getItem(T0_KEY), 10) || 0; } catch (e) { }
        return !!t0 && Date.now() - t0 >= 0 && Date.now() - t0 < 20000;
    }

    function html() {
        // al-cont: carrying on from the page before, so the pulse is there
        // from the first frame; otherwise it fades in after a moment and a
        // short wait shows only the plain grey.
        var cont = pending() ? ' al-cont' : '';
        return '<div id="app_loader" class="al-box' + cont + '" aria-hidden="true" style="--p:' + phase() + 'ms">' + SVG + '</div>';
    }

    function el() { return document.getElementById('app_loader'); }

    var hideTimer = null, hiddenAt = 0;

    function show() {
        if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
        var node = el();
        if (node) { node.classList.remove('al-out'); return; }
        if (!document.body) return;
        removeTile();
        var box = document.createElement('div');
        box.innerHTML = html();
        node = box.firstChild;
        node.classList.add('al-in');
        document.body.appendChild(node);
    }

    // after: ms to wait first; a show() in that time keeps the loader up.
    function hide(after) {
        if (hideTimer) clearTimeout(hideTimer);
        hideTimer = setTimeout(function () {
            hideTimer = null;
            var node = el();
            if (!node) return;
            hiddenAt = Date.now();
            try { localStorage.removeItem(T0_KEY); } catch (e) { }
            node.classList.add('al-out');
            setTimeout(function () {
                if (node.parentNode && node.classList.contains('al-out')) node.parentNode.removeChild(node);
            }, 320);
        }, after > 0 ? after : 0);
    }

    function isUp() { var node = el(); return !!node && !node.classList.contains('al-out'); }

    // The small tile. It waits before appearing, so an ordinary load (most
    // server calls answer within about 0.7 s) shows nothing at all, and it
    // stays through back-to-back loads.
    var TILE_AFTER_MS = 700, TILE_LINGER_MS = 150, QUIET_AFTER_LOADER_MS = 1200;
    var tileTimer = null, tileOff = null;

    function removeTile() {
        if (tileTimer) { clearTimeout(tileTimer); tileTimer = null; }
        if (tileOff) { clearTimeout(tileOff); tileOff = null; }
        var t = document.getElementById('app_busy');
        if (t && t.parentNode) t.parentNode.removeChild(t);
    }

    function busy() {
        if (tileOff) { clearTimeout(tileOff); tileOff = null; }
        if (tileTimer || document.getElementById('app_busy')) return;
        var wait = Math.max(TILE_AFTER_MS, QUIET_AFTER_LOADER_MS - (Date.now() - hiddenAt));
        tileTimer = setTimeout(function () {
            tileTimer = null;
            if (isUp() || !document.body) return;
            var box = document.createElement('div');
            box.innerHTML = '<div id="app_busy" class="al-box" aria-hidden="true">' + SVG + '</div>';
            document.body.appendChild(box.firstChild);
        }, wait);
    }

    function idle() {
        if (tileTimer) { clearTimeout(tileTimer); tileTimer = null; }
        if (!document.getElementById('app_busy') || tileOff) return;
        tileOff = setTimeout(removeTile, TILE_LINGER_MS);
    }

    return { html: html, pending: pending, show: show, hide: hide, isUp: isUp, busy: busy, idle: idle };
})();
