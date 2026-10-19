/* A bounded visual preview, never a replay of a renderer or database callback.
 * Cached rows cannot act on stale metadata: a tap waits for the matching fresh
 * row. Existing renderers and their normal event bindings remain authoritative.
 */
(function (w, d) {
    'use strict';
    var key = 'mwfm_phase1_lists', records = Object.create(null), revisions = Object.create(null);
    var scopeKeys = ['company_id', 'user_id', 'role_id', 'global_wcf_url', 'udf_id', 'wayflow',
        'siteid', 'tid', 'server_task_id', 'start_status', 'tab_index', 'survey_type',
        'checksheet_type_filter', 'list_json', 'type20_columndata'];

    function enabled() { return w.AppPhase1 && w.AppPhase1.enabled('savedLists'); }
    function scope() {
        var context = { page: w.location.pathname.split('/').pop(), values: {}, filters: {} };
        try {
            scopeKeys.forEach(function (name) { context.values[name] = w.storage.getItem(name); });
            var parents = JSON.parse(w.storage.getItem('flow_Array'));
            context.parents = (Array.isArray(parents) ? parents : []).map(function (p) {
                return [p.id, p.wayflow, p.tid, p.siteid, p.start_status, p.tab_index];
            });
            for (var i = 0; i < w.localStorage.length; i++) {
                var name = w.localStorage.key(i);
                if (name !== 'filter_ddl_Array' && /filter|search|sort|is_subflow/i.test(name)) context.filters[name] = w.localStorage.getItem(name);
            }
            if (w.jQuery && w.jQuery.jStorage && w.jQuery.jStorage.index) {
                w.jQuery.jStorage.index().forEach(function (name) {
                    if (name !== 'filter_ddl_Array' && /filter|search|sort/i.test(name)) context.filters['j:' + name] = w.storage.getItem(name);
                });
            }
            context.keyword = w.search_keyword || '';
        } catch (error) { return null; }
        // Sort variable-name lists so storage enumeration order is immaterial.
        var ordered = {};
        Object.keys(context.filters).sort().forEach(function (name) { ordered[name] = context.filters[name]; });
        context.filters = ordered;
        return JSON.stringify(context);
    }
    function read() {
        try { var entries = JSON.parse(w.localStorage.getItem(key)); return Array.isArray(entries) ? entries : []; }
        catch (e) { return []; }
    }
    function lookup(id, context) {
        return read().filter(function (e) {
            return e.id === id && e.scope === context && typeof e.html === 'string' &&
                e.html.length <= 180000 && Number.isFinite(e.at) && Date.now() >= e.at && Date.now() - e.at < 24 * 60 * 60 * 1000;
        })[0];
    }
    function action(element) {
        var match = (element.getAttribute('onclick') || '').match(/^\s*([\w$]+)\s*\(/);
        return match ? match[1] : '';
    }
    function bindPreview(root, record) {
        record.root = root;
        record.boundRoots = record.boundRoots || [];
        if (record.boundRoots.indexOf(root) !== -1) return;
        record.boundRoots.push(root);
        root.addEventListener('click', function (event) {
            if (!record.preview || record.root !== root) return;
            event.preventDefault(); event.stopImmediatePropagation();
            if (record.failed) { w.AppPhase1.notice('Unable to refresh this list. Please go back and try again.'); return; }
            var target = event.target.closest('[onclick],a,input,button');
            var row = event.target.closest('li');
            record.tap = row && row.id && target ? { row: row.id, id: target.id, action: action(target) } : null;
            if (!record.tap) w.AppPhase1.notice('Please wait for the list to refresh.');
        }, true);
        root.addEventListener('touchstart', function (event) {
            if (record.preview && record.root === root) event.stopImmediatePropagation();
        }, { capture: true, passive: true });
    }
    function restore(id) {
        if (!enabled()) return false;
        var root = d.getElementById(id), context = scope();
        if (!root || !context) return false;
        var saved = lookup(id, context);
        if (!saved) return false;
        var record = records[id] || (records[id] = {});
        if (record.stop) record.stop();
        if (record.scope !== context) record.tap = null;
        record.scope = context; record.preview = true; record.failed = false;
        root.innerHTML = saved.html;
        root.setAttribute('aria-busy', 'true');
        bindPreview(root, record);
        return true;
    }
    function save(id, context, record) {
        var root = d.getElementById(id);
        if (!root || !root.children.length || record.scope !== context) return;
        record.preview = false;
        root.removeAttribute('aria-busy');
        if (scope() !== context) { record.tap = null; return; }
        var html = root.innerHTML;
        if (html.length <= 180000) {
            var entries = read().filter(function (e) { return !(e.id === id && e.scope === context); });
            entries.push({ id: id, scope: context, html: html, at: Date.now() });
            try { w.localStorage.setItem(key, JSON.stringify(entries.slice(-6))); } catch (e) { }
        }
        var tap = record.tap;
        record.tap = null;
        if (!tap) return;
        var rows = Array.prototype.filter.call(root.querySelectorAll('li[id]'), function (el) { return el.id === tap.row; });
        var row = rows.length === 1 ? rows[0] : null;
        if (!row) { w.AppPhase1.notice('The list has changed. Please select an item again.'); return; }
        var targets = Array.prototype.slice.call(row.querySelectorAll('[onclick],a,input,button'));
        targets.unshift(row);
        targets = targets.filter(function (el) {
            return tap.id ? el.id === tap.id : tap.action && action(el) === tap.action;
        });
        if (targets.length === 1) targets[0].click();
        else w.AppPhase1.notice('The list has changed. Please select an item again.');
    }
    function response(id, callback) {
        if (!enabled()) return callback;
        var context = scope();
        if (!context) return callback;
        if (records[id] && records[id].scope === context) records[id].failed = false;
        var offset = Number(w.limit_range) - Number(w.default_range);
        // Startup/tab setup can clear or reassign #site_list after DOM ready.
        // Restore against the initialized request context before refreshing.
        var list = d.getElementById(id);
        if (!(offset > 0) && list && !list.children.length) restore(id);
        var revisionKey = id + context;
        if (!(offset > 0)) revisions[revisionKey] = (revisions[revisionKey] || 0) + 1;
        var revision = revisions[revisionKey];
        return function () {
            if (scope() !== context || revisions[revisionKey] !== revision) return;
            var root = d.getElementById(id), record = records[id] || (records[id] = {});
            if (!root) return callback.apply(this, arguments);
            if (record.stop) record.stop();
            if (record.scope !== context) record.tap = null;
            record.scope = context;
            var observer, timer, expiry, active = true;
            function stop() {
                active = false;
                clearTimeout(timer); clearTimeout(expiry);
                if (observer) observer.disconnect();
                if (record.stop === stop) record.stop = null;
            }
            record.stop = stop;
            function complete() {
                if (!active) return;
                clearTimeout(timer);
                timer = setTimeout(function () {
                    if (!active || !root.children.length) return;
                    stop();
                    save(id, context, record);
                }, 0);
            }
            // Only the first refreshed page replaces the preview. Pagination
            // appends normally. Observe asynchronous checklist construction too.
            if (!(offset > 0) && record.preview) {
                root.innerHTML = '';
                record.preview = false;
                root.removeAttribute('aria-busy');
            }
            if (w.MutationObserver) {
                observer = new MutationObserver(complete);
                observer.observe(root, { childList: true, subtree: true });
                expiry = setTimeout(function () {
                    stop();
                    if (record.scope === context && record.tap) {
                        record.tap = null;
                        w.AppPhase1.notice('Please select an item when the list finishes refreshing.');
                    }
                }, 10000);
            }
            var result = callback.apply(this, arguments);
            if (root.children.length) complete();
            return result;
        };
    }
    function keep(id) {
        if (!enabled()) return false;
        var root = d.getElementById(id), record = records[id];
        if (record && record.scope !== scope()) return false;
        if (!(root && record && record.preview && root.children.length) && !restore(id)) return false;
        record = records[id];
        record.failed = true; record.tap = null;
        w.AppPhase1.notice('Unable to refresh. Showing saved data.');
        return true;
    }
    function failed(id, error) {
        if (!enabled()) return false;
        try { if (w.console && w.console.error) w.console.error('MWFM:', error); } catch (e) { }
        if (!keep(id)) w.AppPhase1.notice('Unable to refresh this list. Please go back and try again.');
        return true;
    }
    w.AppPhase1Lists = { response: response, restore: restore, keep: keep, failed: failed };
    d.addEventListener('DOMContentLoaded', function () {
        var page = w.location.pathname.split('/').pop();
        if (page === 'selection_survey.html') restore('site_list');
        else if (page === 'viewsitelist_pm_grouplist.html') restore('checksheet_list');
    });
})(window, document);
