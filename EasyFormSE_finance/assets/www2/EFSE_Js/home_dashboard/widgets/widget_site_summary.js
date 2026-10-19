// Home Operations Dashboard — site_summary widget (top card).
// Replaces task_summary as HomeDashboardConfig.DEFAULT_PROFILE's first card,
// by explicit request — task_summary itself is untouched and still usable
// via a server-driven dashboard_profile/dashboard_role_map for any role that
// wants it back.
//
// PM Pending / Energy Reading Pending: the task count the app's own home
// screen counter already fetches, read from its existing localStorage cache
// — no extra server call and no separate count query of our own (see
// HomeDashboardData.getSiteSummary / readCachedUdfCount). "—" means that
// counter has not finished yet this session, which is not a real zero.
//
// KNOWN SERVER-SIDE DEPENDENCY (verified on device 2026-08-17, prod
// mwfm.altiusinfra.com, user premdas.vt): WCF_OnlineTaskList_Native_Count
// answers for these flows with TASK_COUNT 0, CONT_ [0] and an empty QUERY
// field — i.e. no count query is configured server-side for them — so these
// two cards read 0 even when the flow's own listing has rows (6 at the time
// of checking). Nothing on the client can derive the real number from that
// endpoint; the listing endpoint (OnlineTaskListing) returns only a
// pagination-capped page of rows with no total, so counting it would either
// undercount or require fetching every row on every home load. The fix is to
// configure the count query for these flows server-side, after which these
// cards populate with no further app change.
//
// Visited Today: geofence_user_tracking_detail confirmed-dwell rows for today.
//
// Tap delegates to the real TripSiteMap.open() when the map module is
// loaded and enabled for this role -- a no-op otherwise (TripSiteMap.open()
// already guards on TripMapProfile.resolve() internally), so this card never
// needs its own isEnabled() gate the way P2's map_entry widget does.

(function (w) {
    'use strict';
    if (w.AppHomeWidgetSiteSummaryController) return;
    function create(options) {
        options = options || {};
        var HomeDashboardData = options.data || w.HomeDashboardData;

    'use strict';

    function render(container, cfg) {
        var html = '<div class="hd-widget hd-site-summary" data-widget="site_summary">'
            + '<div class="hd-card-title">Sites</div>'
            + '<div class="hd-site-stats">'
            + '<div class="hd-site-stat"><span class="hd-count hd-pm-pending">&hellip;</span><span class="hd-label">PM Pending</span></div>'
            + '<div class="hd-site-stat"><span class="hd-count hd-er-pending">&hellip;</span><span class="hd-label">Energy Reading Pending</span></div>'
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

    // The counts come from SQLite queries that can take a visible moment, and
    // until now the card just sat on its previous (or placeholder) value with
    // no sign anything was happening -- indistinguishable from a finished
    // load that genuinely returned that number. .hd-loading paints them red
    // and blinks (css/home_dashboard.css) so "still loading" is never
    // mistaken for "this is the answer".
    function refresh(container) {
        var root = container.find('[data-widget="site_summary"]');
        if (root.length === 0) {
            return;
        }

        var counts = root.find('.hd-pm-pending, .hd-er-pending, .hd-site-visited');
        counts.addClass('hd-loading');

        HomeDashboardData.getSiteSummary(function (result) {
            root.find('.hd-pm-pending')
                .removeClass('hd-loading')
                .text(result.pmPending !== null ? result.pmPending : '—');
            root.find('.hd-er-pending')
                .removeClass('hd-loading')
                .text(result.erPending !== null ? result.erPending : '—');
            root.find('.hd-site-visited')
                .removeClass('hd-loading')
                .text(result.visitedToday !== null ? result.visitedToday : '—');
        });
    }


        var api = { render: render, refresh: refresh };
        if (options.scope) Object.keys(api).forEach(function (key) { if (typeof api[key] === 'function') api[key] = (options.scope.own || options.scope.guard)(api[key]); });
        return api;
    }
    w.AppHomeWidgetSiteSummaryController = { create: create };
    if (!w.document.documentElement.hasAttribute || !w.document.documentElement.hasAttribute('data-app-shell')) w.HomeWidgetSiteSummary = create();
})(window);
