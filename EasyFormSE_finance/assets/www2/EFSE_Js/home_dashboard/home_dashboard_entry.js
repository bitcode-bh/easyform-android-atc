// Home Operations Dashboard — public API. selection.html / common-functions.js
// call only HomeDashboard.{init,refresh,isEnabled,destroy}; nothing else in
// this module is meant to be reached from outside it.
// See docs/PRD-Home-Operations-Dashboard.md §8.1.

(function (w) {
    'use strict';
    if (w.AppHomeDashboardController) return;
    function create(options) {
        options = options || {};
        var $ = options.$ || function () { return w.jQuery.apply(w, arguments); };
        var HomeDashboardResolver = options.resolver || w.HomeDashboardResolver;

    'use strict';

    // Maps HomeDashboardConfig.TYPES values to the widget modules that
    // implement them. greeting_header and trip_status are not here — both
    // are permanent chrome now (the navbar and the bottom tab bar's
    // "Start Trip" action respectively), not dashboard cards. A profile
    // entry for an unregistered/not-yet-implemented type was already
    // dropped by HomeDashboardResolver.resolveProfile()'s isImplemented()
    // filter.
    var WIDGET_REGISTRY = {
        task_summary: (options.widgets ? options.widgets.HomeWidgetTaskSummary : w.HomeWidgetTaskSummary),
        site_summary: (options.widgets ? options.widgets.HomeWidgetSiteSummary : w.HomeWidgetSiteSummary),
        upload_health: (options.widgets ? options.widgets.HomeWidgetUploadHealth : w.HomeWidgetUploadHealth),
        trip_stats: (options.widgets ? options.widgets.HomeWidgetTripStats : w.HomeWidgetTripStats),
        map_entry: (options.widgets ? options.widgets.HomeWidgetMapEntry : w.HomeWidgetMapEntry),
        attendance_chip: (options.widgets ? options.widgets.HomeWidgetAttendance : w.HomeWidgetAttendance),
        notifications_summary: (options.widgets ? options.widgets.HomeWidgetNotifications : w.HomeWidgetNotifications),
        feature_links: (options.widgets ? options.widgets.HomeWidgetFeatureLinks : w.HomeWidgetFeatureLinks)
    };

    var _container = null;
    var _activeWidgets = []; // { type, module } for every widget in the current render

    function isEnabled() {
        try {
            return HomeDashboardResolver.isEnabled();
        } catch (e) {
            return false;
        }
    }

    function init() {
        try {
            _container = $('#div_home_dashboard');
            if (_container.length === 0) {
                return;
            }

            if (!isEnabled()) {
                _container.hide().empty();
                _activeWidgets = [];
                return;
            }

            var profile = HomeDashboardResolver.resolveProfile();
            if (!profile || !profile.widgets || profile.widgets.length === 0) {
                _container.hide().empty();
                _activeWidgets = [];
                return;
            }

            _container.empty();
            _activeWidgets = [];

            for (var i = 0; i < profile.widgets.length; i++) {
                var cfg = profile.widgets[i];
                var widget = cfg && WIDGET_REGISTRY[cfg.type];
                if (!widget || typeof widget.render !== 'function') {
                    continue;
                }
                widget.render(_container, cfg);
                _activeWidgets.push({ type: cfg.type, module: widget });
            }

            _container.show();
        } catch (e) {
            // A dashboard failure must never take Home down with it.
            try { console.error('HomeDashboard.init failed:', e); } catch (ignored) { }
        }
    }

    // Re-resolves enabled/profile from scratch (not just re-rendering the
    // current widget set) so a profile that only became available mid-session
    // (list_json populated after the user opened a flow once) takes effect on
    // the next refresh/PTR without needing a full page reload.
    function refresh() {
        if (!_container) {
            init();
            return;
        }
        var stillEnabled = isEnabled();
        var currentTypes = [];
        for (var i = 0; i < _activeWidgets.length; i++) {
            currentTypes.push(_activeWidgets[i].type);
        }
        var profile = stillEnabled ? HomeDashboardResolver.resolveProfile() : null;
        var newTypes = (profile && profile.widgets) ? profile.widgets.map(function (w) { return w.type; }) : [];

        if (!stillEnabled || currentTypes.join(',') !== newTypes.join(',')) {
            init();
            return;
        }

        for (var j = 0; j < _activeWidgets.length; j++) {
            var w = _activeWidgets[j].module;
            if (typeof w.refresh === 'function') {
                try { w.refresh(_container); } catch (e) { }
            }
        }
    }

    function destroy() {
        try {
            if (_container) {
                _container.hide().empty();
            }
        } catch (e) { }
        _activeWidgets = [];
    }


        var api = {
        init: init,
        refresh: refresh,
        isEnabled: isEnabled,
        destroy: destroy
    };
        if (options.scope) Object.keys(api).forEach(function (key) { if (typeof api[key] === 'function') api[key] = (options.scope.own || options.scope.guard)(api[key]); });

        if (options.scope) options.scope.defer(destroy);
        return api;
    }
    w.AppHomeDashboardController = { create: create };
    if (!w.document.documentElement.hasAttribute || !w.document.documentElement.hasAttribute('data-app-shell')) w.HomeDashboard = create();
})(window);
