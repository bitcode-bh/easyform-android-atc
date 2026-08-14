// Home Operations Dashboard — site_summary widget (top card).
// Replaces task_summary as HomeDashboardConfig.DEFAULT_PROFILE's first card,
// by explicit request — task_summary itself is untouched and still usable
// via a server-driven dashboard_profile/dashboard_role_map for any role that
// wants it back.
//
// Total Sites: geofence_tracking (the downloaded site catalog). Visited
// Today: geofence_user_tracking_detail confirmed-dwell rows for today. See
// HomeDashboardData.getSiteSummary() for the exact queries and why they're
// safe to read without extra scoping.
//
// Tap delegates to the real TripSiteMap.open() when the map module is
// loaded and enabled for this role -- a no-op otherwise (TripSiteMap.open()
// already guards on TripMapProfile.resolve() internally), so this card never
// needs its own isEnabled() gate the way P2's map_entry widget does.

var HomeWidgetSiteSummary = (function () {
    'use strict';

    function render(container, cfg) {
        var html = '<div class="hd-widget hd-site-summary" data-widget="site_summary">'
            + '<div class="hd-card-title">Sites</div>'
            + '<div class="hd-site-stats">'
            + '<div class="hd-site-stat"><span class="hd-count hd-site-total">&hellip;</span><span class="hd-label">Total Sites</span></div>'
            + '<div class="hd-site-stat"><span class="hd-count hd-site-visited">&hellip;</span><span class="hd-label">Visited Today</span></div>'
            + '</div>'
            + '</div>';
        container.append(html);

        var root = container.find('[data-widget="site_summary"]');
        root.off('click.hdSiteSummary').on('click.hdSiteSummary', function () {
            try {
                if (typeof TripSiteMap !== 'undefined') TripSiteMap.open();
            } catch (e) { }
        });

        refresh(container);
    }

    function refresh(container) {
        var root = container.find('[data-widget="site_summary"]');
        if (root.length === 0) {
            return;
        }
        HomeDashboardData.getSiteSummary(function (result) {
            root.find('.hd-site-total').text(result.totalSites !== null ? result.totalSites : '—');
            root.find('.hd-site-visited').text(result.visitedToday !== null ? result.visitedToday : '—');
        });
    }

    return { render: render, refresh: refresh };
})();
