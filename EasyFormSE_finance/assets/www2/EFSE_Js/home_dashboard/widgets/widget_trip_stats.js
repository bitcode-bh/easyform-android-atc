// Home Operations Dashboard — trip_stats widget.
// See docs/PRD-Home-Operations-Dashboard.md §6.5.
//
// Active-trip-only: the card is always inserted (so refresh() has a stable
// root to show/hide) but stays display:none whenever HomeDashboardData
// .getTripStats() reports no active trip -- mirrors how the Start Trip tab
// bar action already reads the same trip_status signal.

(function (w) {
    'use strict';
    if (w.AppHomeWidgetTripStatsController) return;
    function create(options) {
        options = options || {};
        var HomeDashboardData = options.data || w.HomeDashboardData;

    'use strict';

    function render(container, cfg) {
        var html = '<div class="hd-widget hd-trip-stats" data-widget="trip_stats" style="display:none">'
            + '<div class="hd-card-title">Active trip</div>'
            + '<div class="hd-trip-duration"></div>'
            + '<div class="hd-trip-metrics">'
            + '<div class="hd-trip-metric"><span class="hd-trip-metric-val hd-ts-km">&hellip;</span><span class="hd-trip-metric-label">km</span></div>'
            + '<div class="hd-trip-metric"><span class="hd-trip-metric-val hd-ts-sites">&hellip;</span><span class="hd-trip-metric-label">Sites</span></div>'
            + '<div class="hd-trip-metric"><span class="hd-trip-metric-val hd-ts-violations">&hellip;</span><span class="hd-trip-metric-label">Alerts</span></div>'
            + '</div>'
            + '</div>';
        container.append(html);

        var root = container.find('[data-widget="trip_stats"]');
        root.off('click.hdTripStats').on('click.hdTripStats', function () {
            try {
                if (typeof TripSiteMap !== 'undefined') TripSiteMap.open();
            } catch (e) { }
        });

        refresh(container);
    }

    function formatDuration(ms) {
        if (ms === null || ms === undefined || ms < 0) return 'Active';
        var totalMin = Math.floor(ms / 60000);
        var h = Math.floor(totalMin / 60);
        var m = totalMin % 60;
        return 'Active ' + (h > 0 ? (h + 'h ' + m + 'm') : (m + 'm'));
    }

    function refresh(container) {
        var root = container.find('[data-widget="trip_stats"]');
        if (root.length === 0) {
            return;
        }
        HomeDashboardData.getTripStats(function (result) {
            if (!result.active) {
                root.hide();
                return;
            }
            root.show();
            root.find('.hd-trip-duration').text(formatDuration(result.durationMs));
            root.find('.hd-ts-km').text(result.km !== null ? result.km.toFixed(1) : '—');
            root.find('.hd-ts-sites').text(result.sitesVisited !== null ? result.sitesVisited : '—');
            root.find('.hd-ts-violations').text(result.violations !== null ? result.violations : '—');
        });
    }


        var api = { render: render, refresh: refresh };
        if (options.scope) Object.keys(api).forEach(function (key) { if (typeof api[key] === 'function') api[key] = (options.scope.own || options.scope.guard)(api[key]); });
        return api;
    }
    w.AppHomeWidgetTripStatsController = { create: create };
    if (!w.document.documentElement.hasAttribute || !w.document.documentElement.hasAttribute('data-app-shell')) w.HomeWidgetTripStats = create();
})(window);
