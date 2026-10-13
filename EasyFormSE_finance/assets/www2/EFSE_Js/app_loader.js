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
    var LOOP_MS = 2500, T0_KEY = 'app_loader_t0';

    function d(path) { return '<path class="al-d" pathLength="1" d="' + path + '"/>'; }
    var NAVY = ' stroke="#2a3086"', YELLOW = ' stroke="#e0b63a"';
    var SVG = '<svg viewBox="0 0 132 100" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">'
        // site rings
        + '<g class="al-i"' + NAVY + '><circle cx="66" cy="50" r="6" fill="#2a3086" stroke="none"/>'
        + '<circle class="al-r" cx="66" cy="50" r="48" stroke-width="2"/>'
        + '<circle class="al-r" cx="66" cy="50" r="48" stroke-width="2" style="animation-delay:-.25s"/></g>'
        // trip route
        + '<g class="al-i" style="--d:.5s"' + NAVY + '>' + d('M14 82 H52 V40 H96 V25')
        + '<circle cx="14" cy="82" r="5" fill="#2a3086" stroke="none"/><circle cx="96" cy="18" r="7"/></g>'
        // hard hat
        + '<g class="al-i" style="--d:1s"' + YELLOW + '>' + d('M16 74 H116 a5 5 0 0 1 0 10 H16 a5 5 0 0 1 0 -10 z')
        + d('M28 72 C28 42 44 24 66 24 S104 42 104 72') + d('M56 26 V38') + d('M66 24 V38') + d('M76 26 V38') + '</g>'
        // permit triangle
        + '<g class="al-i" style="--d:1.5s"' + YELLOW + '>' + d('M66 14 L112 88 H20 Z') + d('M66 42 V64')
        + '<circle cx="66" cy="76" r="1.5" fill="#e0b63a"/></g>'
        // passport shield
        + '<g class="al-i" style="--d:2s"' + NAVY + '>' + d('M66 8 L102 20 V48 C102 72 86 86 66 94 C46 86 30 72 30 48 V20 Z')
        + d('M50 50 l12 12 l22 -24') + '</g></svg>';

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

    function html() {
        return '<div id="app_loader" class="al-box" aria-hidden="true" style="--p:' + phase() + 'ms">' + SVG + '</div>';
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

    // The small tile. It waits a moment before appearing, so a quick load
    // shows nothing at all, and it stays through back-to-back loads.
    var TILE_AFTER_MS = 350, TILE_LINGER_MS = 150, QUIET_AFTER_LOADER_MS = 1200;
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

    return { html: html, show: show, hide: hide, isUp: isUp, busy: busy, idle: idle };
})();
