// Home Operations Dashboard — map_entry widget.
// See docs/PRD-Home-Operations-Dashboard.md §6.8.
//
// Gated on the same TripSiteMap.isEnabled() check the tab bar's own hidden
// #btn_trip_map button uses (trip_map_entry.js bindButton()) -- a role/profile
// that doesn't resolve a trip-map profile gets no card at all, not an empty
// one. Site count reads TripMapCache.getSites() (sessionStorage only, no
// network/native call); tapping OPEN MAP is the one place that actually calls
// TripSiteMap.open(), the real native map entry point.

(function (w) {
    'use strict';
    if (w.AppHomeWidgetMapEntryController) return;
    function create(options) {
        options = options || {};

    'use strict';

    var _cfg = null;

    function isMapAvailable() {
        try {
            return typeof TripSiteMap !== 'undefined' && TripSiteMap.isEnabled();
        } catch (e) {
            return false;
        }
    }

    function siteCount() {
        try {
            if (typeof TripMapCache === 'undefined') return null;
            var sites = TripMapCache.getSites();
            return (sites && sites.length) ? sites.length : null;
        } catch (e) {
            return null;
        }
    }

    function subLabel() {
        var count = siteCount();
        return (count !== null)
            ? (count + (count === 1 ? ' site nearby' : ' sites nearby'))
            : 'Open the map to see nearby sites';
    }

    function render(container, cfg) {
        _cfg = cfg;
        if (!isMapAvailable()) {
            return;
        }
        var label = (cfg && cfg.label) || 'Trip & Site Map';
        var html = '<div class="hd-widget hd-map-entry" data-widget="map_entry">'
            + '<div class="hd-card-title">' + label + '</div>'
            + '<div class="hd-map-sub">' + subLabel() + '</div>'
            + '<button type="button" class="hd-btn hd-btn-map">OPEN MAP</button>'
            + '</div>';
        container.append(html);

        var root = container.find('[data-widget="map_entry"]');
        root.find('.hd-btn-map').off('click.hdMapEntry').on('click.hdMapEntry', function () {
            try {
                TripSiteMap.open();
            } catch (e) { }
        });
    }

    // Re-checks availability every refresh (not just at render time): the
    // profile can resolve mid-session once list_json populates after the
    // user opens a flow once, same lazy-availability case
    // HomeDashboardResolver already documents for the whole dashboard.
    function refresh(container) {
        var root = container.find('[data-widget="map_entry"]');
        var available = isMapAvailable();

        if (root.length === 0) {
            if (available) {
                render(container, _cfg);
            }
            return;
        }
        if (!available) {
            root.remove();
            return;
        }
        root.find('.hd-map-sub').text(subLabel());
    }


        var api = { render: render, refresh: refresh };
        if (options.scope) Object.keys(api).forEach(function (key) { if (typeof api[key] === 'function') api[key] = (options.scope.own || options.scope.guard)(api[key]); });
        return api;
    }
    w.AppHomeWidgetMapEntryController = { create: create };
    if (!w.document.documentElement.hasAttribute || !w.document.documentElement.hasAttribute('data-app-shell')) w.HomeWidgetMapEntry = create();
})(window);
