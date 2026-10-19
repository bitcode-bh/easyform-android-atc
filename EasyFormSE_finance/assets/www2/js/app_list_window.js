/* Shared long lists: legacy DOM containment and lifecycle-owned model windows.
 * Only adapters using model APIs for all rows may opt into create().
 */
(function (w, d) {
    'use strict';
    var mounted = new WeakMap();
    function enabled() {
        if (!w.AppShell) return false;
        var settings = w.AppShell.settings();
        return settings.enabled && settings.pages['selection_survey.html'] === true;
    }
    function mount(root, options) {
        if (!root) return null;
        if (mounted.has(root)) return mounted.get(root);
        options = options || {};
        var frame = null, disposed = false, observer, cleanup;
        var supported = !!w.CSS && w.CSS.supports('content-visibility', 'auto') &&
            w.CSS.supports('contain-intrinsic-block-size', 'auto 180px');
        function refresh() {
            if (disposed) return;
            var allowed = options.enabled ? options.enabled() : enabled();
            root.classList.toggle('app-list-windowed', !!(supported && allowed && root.childElementCount > 200));
        }
        function schedule() {
            if (frame !== null || disposed) return;
            frame = w.requestAnimationFrame(function () { frame = null; refresh(); });
        }
        var handle = {
            refresh: refresh,
            dispose: function () {
                if (disposed) return;
                disposed = true;
                if (observer) observer.disconnect();
                if (frame !== null) w.cancelAnimationFrame(frame);
                root.classList.remove('app-list-windowed');
                mounted.delete(root);
                if (options.scope && options.scope.release) options.scope.release(cleanup);
            }
        };
        if (supported) {
            observer = new MutationObserver(schedule);
            observer.observe(root, { childList: true });
        }
        if (options.scope) cleanup = options.scope.defer(handle.dispose);
        mounted.set(root, handle); refresh();
        return handle;
    }
    // Page adapters keep the complete data here; only the visible slice owns DOM.
    // Legacy DOM-based search/bulk handlers must keep using mount() until ported.
    function create(root, options) {
        options = options || {};
        options = Object.assign({}, options);
        var cleanup, scroller = options.scroller || root.closest('.page-content');
        if (!scroller || typeof options.render !== 'function') throw new Error('A list renderer and scroller are required');
        var rows = [], filtered = [], keys = new Map(), heights = new Map(), selected = new Set();
        var offsets = [0], nodes = new Map(), predicate = function () { return true; };
        var frame = null, observer, disposed = false, print = false, range = '', estimate = options.estimate || 56;
        function key(row) { return String(options.key(row)); }
        function prefix() {
            offsets = [0];
            filtered.forEach(function (row, i) { offsets.push(offsets[i] + (heights.get(key(row)) || estimate)); });
        }
        function rebuild() { filtered = rows.filter(predicate); prefix(); range = ''; }
        function localTop() {
            return scroller.getBoundingClientRect().top + scroller.clientTop - root.getBoundingClientRect().top - (parseFloat(w.getComputedStyle(root).paddingTop) || 0);
        }
        function indexAt(position) {
            var low = 0, high = filtered.length;
            while (low < high) { var middle = (low + high) >>> 1; if (offsets[middle + 1] <= position) low = middle + 1; else high = middle; }
            return low;
        }
        function spacer(height) {
            var node = d.createElement('li'); node.setAttribute('aria-hidden', 'true'); node.setAttribute('role', 'presentation');
            node.setAttribute('data-list-spacer', '');
            node.style.cssText = 'display:block!important;height:' + height + 'px!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important;background:none!important;pointer-events:none';
            return node;
        }
        function measure() {
            var top = localTop(), anchor = indexAt(top), old = offsets[Math.min(anchor, filtered.length)], changed = false;
            nodes.forEach(function (node, id) {
                var style = w.getComputedStyle(node), height = node.getBoundingClientRect().height + (parseFloat(style.marginTop) || 0) + (parseFloat(style.marginBottom) || 0);
                if (height > 0 && Math.abs(height - (heights.get(id) || estimate)) > 0.5) { heights.set(id, height); changed = true; }
            });
            if (changed) {
                prefix();
                var delta = offsets[Math.min(anchor, filtered.length)] - old;
                if (delta && top >= 0) scroller.scrollTop += delta;
            }
            return changed;
        }
        function draw() {
            if (disposed) return;
            var windowed = !print && filtered.length > (options.threshold || 200), top = Math.max(0, localTop());
            var start = windowed ? Math.max(0, indexAt(top) - 3) : 0;
            var end = windowed ? Math.min(filtered.length, indexAt(top + scroller.clientHeight) + 4) : filtered.length;
            var next = start + ':' + end;
            if (range !== next) {
                range = next;
                if (observer) observer.disconnect();
                nodes.clear();
                var fragment = d.createDocumentFragment();
                if (start) fragment.appendChild(spacer(offsets[start]));
                for (var i = start; i < end; i++) {
                    var row = filtered[i], id = key(row), node = options.render(row, selected.has(id), i);
                    node.setAttribute('aria-posinset', i + 1); node.setAttribute('aria-setsize', filtered.length);
                    nodes.set(id, node); fragment.appendChild(node);
                }
                if (end < filtered.length) fragment.appendChild(spacer(offsets[filtered.length] - offsets[end]));
                root.replaceChildren(fragment);
                if (observer) { observer.observe(scroller); nodes.forEach(function (node) { observer.observe(node); }); }
            } else {
                var spacers = root.querySelectorAll('[data-list-spacer]');
                if (start) spacers[0].style.setProperty('height', offsets[start] + 'px', 'important');
                if (end < filtered.length) spacers[spacers.length - 1].style.setProperty('height', offsets[filtered.length] - offsets[end] + 'px', 'important');
            }
            if (measure()) schedule();
        }
        function schedule() {
            if (disposed || frame !== null) return;
            frame = w.requestAnimationFrame(function () { frame = null; draw(); });
        }
        function validate(values, next) {
            values.forEach(function (row) { var id = key(row); if (next.has(id)) throw new Error('Duplicate list row'); next.set(id, row); });
            return next;
        }
        function add(values) {
            keys = validate(values, new Map(keys)); rows = rows.concat(values); rebuild(); draw();
        }
        function invalidate() { if (disposed) return; range = ''; draw(); }
        var api = {
            append: function (values) { if (!disposed) add(values); },
            replace: function (values) {
                if (disposed) return;
                var next = validate(values, new Map());
                keys = next; rows = values.slice(); heights.clear(); selected.clear(); scroller.scrollTop = 0; rebuild(); draw();
            },
            filter: function (fn) { if (!disposed) { predicate = fn || function () { return true; }; rebuild(); scroller.scrollTop = 0; draw(); } },
            rows: function () { return rows.slice(); },
            visibleRows: function () { return filtered.slice(); },
            selectedRows: function () { return rows.filter(function (row) { return selected.has(key(row)); }); },
            select: function (id, value) { if (disposed || !keys.has(String(id))) return; if (value) selected.add(String(id)); else selected.delete(String(id)); invalidate(); },
            selectAll: function (value, filteredOnly) {
                if (disposed) return;
                (filteredOnly ? filtered : rows).forEach(function (row) { if (value) selected.add(key(row)); else selected.delete(key(row)); }); invalidate();
            },
            update: function (id, row) {
                id = String(id); if (disposed || !keys.has(id)) return;
                if (key(row) !== id) throw new Error('List row identity cannot change');
                var old = keys.get(id); rows[rows.indexOf(old)] = row; keys.set(id, row); heights.delete(id); rebuild(); draw();
            },
            scrollTo: function (id) {
                if (disposed) return;
                var index = filtered.findIndex(function (row) { return key(row) === String(id); });
                if (index < 0) return;
                scroller.scrollTop += offsets[index] - localTop(); draw();
            },
            refresh: invalidate,
            dispose: function () {
                if (disposed) return; disposed = true;
                root.removeEventListener('load', schedule, true); root.removeEventListener('toggle', schedule, true);
                scroller.removeEventListener('scroll', schedule); w.removeEventListener('resize', schedule);
                w.removeEventListener('beforeprint', beforePrint); w.removeEventListener('afterprint', afterPrint);
                if (observer) observer.disconnect(); if (frame !== null) w.cancelAnimationFrame(frame);
                if (options.scope && options.scope.release) options.scope.release(cleanup);
                root.replaceChildren(); rows = []; filtered = []; keys.clear(); heights.clear(); nodes.clear(); selected.clear(); offsets = [0];
            }
        };
        function beforePrint() { print = true; invalidate(); }
        function afterPrint() { print = false; invalidate(); }
        if (w.ResizeObserver) observer = new w.ResizeObserver(schedule);
        root.addEventListener('load', schedule, true); root.addEventListener('toggle', schedule, true);
        scroller.addEventListener('scroll', schedule, { passive: true }); w.addEventListener('resize', schedule);
        w.addEventListener('beforeprint', beforePrint); w.addEventListener('afterprint', afterPrint);
        add(options.rows || []); options.rows = null;
        if (options.scope) cleanup = options.scope.defer(api.dispose);
        return api;
    }

    w.AppListWindow = { mount: mount, create: create };
    var legacy = [];
    d.addEventListener('DOMContentLoaded', function () {
        if (d.documentElement.hasAttribute('data-app-shell')) return;
        if (w.location.pathname.split('/').pop() === 'selection_survey.html') {
            d.querySelectorAll('[id=site_list]').forEach(function (root) { legacy.push(mount(root)); });
        }
    }, { once: true });
    w.addEventListener('pagehide', function () { legacy.forEach(function (handle) { handle.dispose(); }); legacy = []; }, { once: true });
})(window, document);
