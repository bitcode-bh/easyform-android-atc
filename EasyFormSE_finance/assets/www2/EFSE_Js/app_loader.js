// Loading screen shown between Login and Home; styles in css/app_loader.css.
// Login shows it (AppLoader.show) just before it leaves for Home; Home writes
// it as the first thing in its body (AppLoader.html) and hides it once the
// page is ready, so both sides of the page change look the same.
var AppLoader = (function () {
    function d(path, extra) {
        return '<path class="al-d" pathLength="1" d="' + path + '"' + (extra || '') + '/>';
    }
    var NAVY = ' stroke="#2a3086"', YELLOW = ' stroke="#e0b63a"';
    var html = '<div id="app_loader" aria-hidden="true">'
        + '<svg viewBox="0 0 132 100" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">'
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
        + d('M50 50 l12 12 l22 -24') + '</g>'
        + '</svg><b>ALTIUS</b><small>Getting things ready</small></div>';

    function el() { return document.getElementById('app_loader'); }

    function show() {
        if (el() || !document.body) return;
        var box = document.createElement('div');
        box.innerHTML = html;
        var node = box.firstChild;
        node.className = 'al-in';
        document.body.appendChild(node);
    }

    function hide() {
        var node = el();
        if (!node) return;
        node.classList.add('al-out');
        setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 320);
    }

    return { html: html, show: show, hide: hide };
})();
