// Home Operations Dashboard — defaults and widget registry.
// See docs/PRD-Home-Operations-Dashboard.md §6 (widget catalog) / §12 (phases).

var HomeDashboardConfig = (function () {
    'use strict';

    // Rollout switch, same manual pattern as selection.html's own
    // `var ischart_enabled = 'false'`. Real server-driven enablement
    // (list_json[0].home_dashboard_enabled, or a future login.js-persisted
    // flag) always wins when present; this is only the fallback when neither
    // exists yet — which is every account today, since no backend ships that
    // config, so this is what actually decides whether the cards render.
    var DEFAULT_ENABLED = true;

    // Two former widgets are deliberately absent, and neither is a
    // "not implemented yet" gap — both were promoted to permanent chrome:
    //   greeting_header -> the navbar, beside the avatar (selection.html's
    //                      own inline script)
    //   trip_status     -> the bottom tab bar's "Start Trip" action
    // Both are now unconditional, not gated behind home_dashboard_enabled /
    // dashboard_profile. Keeping TYPES/IMPLEMENTED entries for them would
    // wrongly suggest to a server-config author that they can still be
    // placed as dashboard cards.
    var TYPES = {
        TASK_SUMMARY: 'task_summary',
        FLOW_LIST_COMPACT: 'flow_list_compact',
        TRIP_STATS: 'trip_stats',
        UPLOAD_HEALTH: 'upload_health',
        ATTENDANCE_CHIP: 'attendance_chip',
        MAP_ENTRY: 'map_entry',
        NOTIFICATIONS_SUMMARY: 'notifications_summary',
        APPROVALS_PENDING: 'approvals_pending',
        ANALYTICS_STRIP: 'analytics_strip',
        FEATURE_LINKS: 'feature_links'
    };

    // A configured profile whose type is not listed here resolves to null so
    // the widget is skipped (never rendered/erroring) instead of the whole
    // dashboard failing — same reasoning as TripMapConfig.IMPLEMENTED.
    var IMPLEMENTED = {
        task_summary: true,
        upload_health: true,
        // P2 (PRD §12 phased delivery). Implemented client-side but, unlike
        // P1's two widgets, deliberately NOT added to DEFAULT_PROFILE below —
        // trip_stats/map_entry/attendance_chip are only relevant to some
        // personas (PRD §5's persona table: an Auditor or Head/feature-only
        // user has no trips and no map profile at all), so they only render
        // for a role a real dashboard_role_map opts in, same lifecycle this
        // gate's own comment already anticipates for future types. map_entry
        // and trip_stats also each self-gate further at render time (map
        // profile resolved / trip actually active).
        trip_stats: true,
        map_entry: true,
        attendance_chip: true,
        // P3 (PRD §12). approvals_pending is deliberately NOT here —
        // WCF_Bulk_approval (common-functions.js) is a write-only submit
        // endpoint that operates on whatever's checked in a specific flow's
        // on-screen #site_list; there is no server API anywhere in this
        // codebase that returns a standalone "count of items awaiting
        // approval". Showing a number here would mean fabricating it. Needs
        // a real backend endpoint before this widget can exist.
        notifications_summary: true,
        feature_links: true
    };

    // PRD Appendix A — the built-in default when no server config exists at
    // all (list_json empty, no tenant flag). This is what actually renders
    // on a fresh Home load today, since list_json is not populated until a
    // flow has been opened once this session (see home_dashboard_resolver.js).
    // Deliberately P1-only — see the IMPLEMENTED comment above for why the P2
    // widgets aren't here too.
    var DEFAULT_PROFILE = {
        layout: 'stack',
        refresh_interval_sec: 60,
        widgets: [
            { type: TYPES.TASK_SUMMARY, show_per_flow_breakdown: false },
            { type: TYPES.UPLOAD_HEALTH, show_sync_button: true }
        ]
    };

    function isImplemented(type) {
        return IMPLEMENTED[type] === true;
    }

    return {
        TYPES: TYPES,
        DEFAULT_ENABLED: DEFAULT_ENABLED,
        DEFAULT_PROFILE: DEFAULT_PROFILE,
        isImplemented: isImplemented
    };
})();
