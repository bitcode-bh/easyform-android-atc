/* One top bar and one bottom bar for the pages that run in a frame inside the shell.
 *
 * The pages draw their own bars, so every page change redrew them. Here the shell keeps two bars
 * of its own, on top of the frame, and fills them from the bars the page drew: the same look
 * (copied from the page's computed styles, so no page CSS is needed in the shell), the same state
 * (kept in step with a MutationObserver) and the same behaviour (a tap on the shell bar clicks the
 * page's own button). The page's bar stays in place underneath, invisible, so the page's layout
 * does not move. The bars stay on screen while the next page loads and are swapped when it is
 * ready.
 *
 * A bar is only taken over when it can be copied faithfully: no inputs or other live controls in
 * it. Otherwise the page keeps its own bar. A popup or side panel opened by the page covers the
 * shell bars, so they hide while one is open.
 */
(function (w, d) {
    'use strict';
    if (w.AppChrome) return;
    var OFF_KEY = 'mwfm_chrome_off';
    var EXCLUDE = '.popup,.popover,.panel,.picker-modal,.actions-modal,.modal,.preloader-modal';
    var OPEN = '.popup.modal-in,.popover.modal-in,.picker-modal.modal-in,.actions-modal.modal-in,.modal.modal-in,.panel.active';
    var LIVE = 'input,textarea,select,canvas,video,audio,iframe,object,embed,svg';
    var STYLE = ('display position top right bottom left width height min-width min-height max-width max-height ' +
        'margin-top margin-right margin-bottom margin-left padding-top padding-right padding-bottom padding-left box-sizing ' +
        'flex-grow flex-shrink flex-basis flex-direction flex-wrap align-items align-self justify-content gap order float ' +
        'overflow-x overflow-y z-index transform color background-color background-image background-size background-position ' +
        'background-repeat border-top-width border-right-width border-bottom-width border-left-width border-top-style ' +
        'border-right-style border-bottom-style border-left-style border-top-color border-right-color border-bottom-color ' +
        'border-left-color border-top-left-radius border-top-right-radius border-bottom-right-radius border-bottom-left-radius ' +
        'box-shadow font-family font-size font-weight font-style line-height letter-spacing text-align text-transform ' +
        'text-decoration-line text-overflow white-space vertical-align cursor opacity ' +
        '-webkit-mask-image -webkit-mask-repeat -webkit-mask-position -webkit-mask-size -webkit-mask-origin -webkit-mask-clip ' +
        'background-clip background-origin object-fit').split(' ');
    var ROOT_SKIP = { opacity: 1, position: 1, top: 1, right: 1, bottom: 1, left: 1, transform: 1, 'z-index': 1, 'margin-top': 1, 'margin-right': 1, 'margin-bottom': 1, 'margin-left': 1, width: 1, height: 1 };
    var containers = {}, current = {}, hidden = false;

    function enabled() { try { return w.localStorage.getItem(OFF_KEY) !== '1'; } catch (e) { return true; } }

    function first(doc, selector) {
        return Array.prototype.find.call(doc.querySelectorAll(selector), function (node) { return !node.closest(EXCLUDE); }) || null;
    }

    // The icon character a pseudo-element draws, from its computed `content` value.
    function glyphText(content) {
        if (!content || content === 'none' || content === 'normal') return '';
        // Newer Chrome reports an icon as "<glyph>" / "<alt text>"; only the first string is drawn.
        var match = /^"((?:[^"\\]|\\.)*)"|^'((?:[^'\\]|\\.)*)'/.exec(content);
        if (!match) return '';
        return (match[1] !== undefined ? match[1] : match[2]).replace(/\\([0-9a-fA-F]{1,6})\s?/g, function (all, hex) { return String.fromCodePoint(parseInt(hex, 16)); }).replace(/\\(.)/g, '$1');
    }
    function glyph(win, node, which) { return glyphText(win.getComputedStyle(node, which).content); }

    function paint(win, source, clone, root) {
        var style = win.getComputedStyle(source);
        STYLE.forEach(function (name) { if (!(root && ROOT_SKIP[name])) clone.style.setProperty(name, style.getPropertyValue(name)); });
        if (!root) clone.style.setProperty('visibility', style.getPropertyValue('visibility'));
    }

    // A copy of a node that keeps how it looks, not how the page's CSS describes it.
    function copy(win, source, root) {
        var doc = d, clone;
        if (source.nodeType === 3) return doc.createTextNode(source.nodeValue);
        if (source.nodeType !== 1) return null;
        var tag = source.tagName.toLowerCase();
        if (tag === 'script' || tag === 'style' || tag === 'noscript' || tag === 'template') return null;
        if (!root && win.getComputedStyle(source).display === 'none') return null;
        clone = doc.createElement(tag);
        clone.__orig = source;
        paint(win, source, clone, root);
        if (tag === 'img') { clone.src = source.currentSrc || source.src; clone.alt = source.alt || ''; }
        ['title', 'aria-label', 'role'].forEach(function (name) { if (source.hasAttribute(name)) clone.setAttribute(name, source.getAttribute(name)); });
        var before = glyph(win, source, '::before');
        if (before) { var b = doc.createElement('span'); b.textContent = before; b.style.cssText = 'font:inherit;color:inherit;'; clone.appendChild(b); }
        Array.prototype.forEach.call(source.childNodes, function (child) {
            var part = copy(win, child, false); if (part) clone.appendChild(part);
        });
        var after = glyph(win, source, '::after');
        if (after) { var a = doc.createElement('span'); a.textContent = after; a.style.cssText = 'font:inherit;color:inherit;'; clone.appendChild(a); }
        return clone;
    }

    // Pages that are not frames (the list pages) draw their own bars: the shell bars leave when no frame is left.
    var watching = false;
    function watchPages() {
        var pages = d.getElementById('app-shell-pages');
        if (watching || !pages) return;
        watching = true;
        new w.MutationObserver(function () { if (!pages.querySelector('.app-frame-page')) clear(); }).observe(pages, { childList: true });
    }

    // "3 waiting to upload": what the phone still has to send, read from the same data the pending-status page counts.
    function syncLabel(summary) {
        var total = summary && Number(summary.total);
        if (!(total > 0)) return '';
        return total + ' waiting to upload';
    }
    var badge, syncTimer;
    function showSync(summary) {
        var text = syncLabel(summary);
        if (!badge && text) {
            badge = d.createElement('div'); badge.id = 'app-chrome-sync'; badge.className = 'app-chrome-sync';
            badge.setAttribute('role', 'status'); d.body.appendChild(badge);
        }
        if (!badge) return;
        badge.textContent = text; badge.hidden = !text || hidden;
        var bottom = containers.bottom && current.bottom && !containers.bottom.hidden ? containers.bottom.getBoundingClientRect().height : 0;
        badge.style.bottom = Math.round(bottom + 10) + 'px';
    }
    function refreshSync() {
        if (!w.AppBridge || d.hidden) return;
        w.AppBridge.shared().outbox().then(showSync, function () { });
    }
    function startSync() {
        if (syncTimer || !w.AppBridge) return;
        syncTimer = w.setInterval(refreshSync, 30000);
        refreshSync();
    }

    function container(kind) {
        if (containers[kind]) return containers[kind];
        var node = d.createElement('div');
        node.id = 'app-chrome-' + kind; node.className = 'app-chrome app-chrome-' + kind; node.hidden = true;
        node.addEventListener('click', function (event) {
            var target = event.target;
            while (target && target !== node && !target.__orig) target = target.parentNode;
            if (!target || target === node || !target.__orig) return;
            event.preventDefault(); event.stopPropagation();
            try { target.__orig.click(); } catch (e) { w.console.error('MWFM chrome:', e.message); }
        }, true);
        d.body.appendChild(node);
        return (containers[kind] = node);
    }

    function place(node, frame, rect) {
        var at = frame.getBoundingClientRect();
        node.style.left = Math.round(at.left + rect.left) + 'px';
        node.style.width = Math.round(rect.width) + 'px';
        node.style.top = Math.round(at.top + rect.top) + 'px';
        node.style.height = Math.round(rect.height) + 'px';
    }

    function bar(kind, win, frame, selector) {
        var source = first(win.document, selector);
        if (!source) return null;
        var rect = source.getBoundingClientRect();
        if (!rect.height || win.getComputedStyle(source).display === 'none') return null;
        if (source.querySelector(LIVE)) return null;
        var node = container(kind), clone = copy(win, source, true);
        if (!clone) return null;
        var holder = d.createElement('div');
        holder.style.cssText = 'position:relative;width:100%;height:100%;';
        clone.style.setProperty('position', 'absolute'); clone.style.setProperty('left', '0'); clone.style.setProperty('top', '0');
        clone.style.setProperty('width', '100%'); clone.style.setProperty('height', '100%'); clone.style.setProperty('margin', '0');
        holder.appendChild(clone);
        place(node, frame, rect);
        node.replaceChildren(holder);
        node.hidden = hidden;
        // The page's own bar stays where it is so the page does not shift; it just stops showing.
        source.style.setProperty('opacity', '0', 'important'); source.style.setProperty('pointer-events', 'none', 'important');
        return source;
    }

    function covered(doc) {
        return !!doc.querySelector(OPEN) || /(^|\s)with-panel/.test(doc.body ? doc.body.className : '');
    }

    function setHidden(value) {
        hidden = value; if (badge) badge.hidden = badge.hidden || value;
        Object.keys(containers).forEach(function (kind) { if (current[kind]) containers[kind].hidden = value; });
    }

    // Takes over the page's bars; returns a handle that releases them when the page is left.
    function attach(win, frame) {
        if (!enabled()) return { detach: function () { } };
        watchPages(); startSync(); refreshSync();
        var watchers = [], timer = 0, stopped = false, sources = {};
        function build() {
            timer = 0;
            if (stopped) return;
            ['top', 'bottom'].forEach(function (kind) {
                var selector = kind === 'top' ? '.navbar' : '.toolbar';
                var previous = sources[kind];
                var source = null;
                try { source = bar(kind, win, frame, selector); } catch (e) { source = null; w.console.error('MWFM chrome:', e.message); }
                // Only let go of a bar that is no longer the one on show; re-writing the same style would wake the observer below.
                if (previous && previous !== source) { previous.style.removeProperty('opacity'); previous.style.removeProperty('pointer-events'); }
                sources[kind] = source; current[kind] = !!source;
                if (!source && containers[kind]) containers[kind].hidden = true;
            });
            setHidden(covered(win.document));
        }
        function later() { if (!timer && !stopped) timer = w.setTimeout(build, 60); }
        build();
        ['top', 'bottom'].forEach(function (kind) {
            var source = sources[kind];
            if (!source) return;
            // The shell itself writes opacity/pointer-events on the page's bar; that must not count as the page changing it.
            var observer = new w.MutationObserver(function (records) {
                if (records.some(function (r) { return !(r.target === source && r.attributeName === 'style'); })) later();
            });
            observer.observe(source, { subtree: true, childList: true, attributes: true, characterData: true, attributeFilter: ['class', 'style', 'src', 'hidden', 'disabled'] });
            watchers.push(observer);
        });
        // Class changes happen all over a busy page; look for an open popup or panel at most every 80 ms.
        var checking = 0;
        var state = new w.MutationObserver(function () {
            if (checking || stopped) return;
            checking = w.setTimeout(function () { checking = 0; if (!stopped) setHidden(covered(win.document)); }, 80);
        });
        state.observe(win.document.documentElement, { subtree: true, attributes: true, attributeFilter: ['class'] });
        watchers.push(state);
        // The page finishes drawing its bars after the page-ready event, so look again once it settles.
        w.setTimeout(later, 250); w.setTimeout(later, 900);
        return {
            refresh: later,
            detach: function () {
                stopped = true; w.clearTimeout(timer); w.clearTimeout(checking);
                watchers.forEach(function (observer) { observer.disconnect(); });
                // The bars stay until the next page replaces them, so changing pages does not blank them.
            }
        };
    }

    // The next page has no bars of its own.
    function clear() {
        current = {}; Object.keys(containers).forEach(function (kind) { containers[kind].hidden = true; });
    }

    w.AppChrome = { attach: attach, clear: clear, enabled: enabled, glyphText: glyphText, syncLabel: syncLabel };
})(window, document);
