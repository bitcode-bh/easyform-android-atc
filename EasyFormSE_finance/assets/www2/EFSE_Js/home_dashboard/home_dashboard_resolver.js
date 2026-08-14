// Home Operations Dashboard — enable/profile resolution.
// See docs/PRD-Home-Operations-Dashboard.md §7 (config schema) / §7.4 (priority).
//
// list_json is NOT populated at Home-screen load: login.js only ever resets
// it to '' (list_json is filled later, once a flow's own listing API call
// returns — see common-functions.js's redirect_on_module_click chain). So on
// a fresh Home load flow/readListJson() below is null, and both isEnabled()
// and resolveProfile() fall through to their last, always-available step.
// That's expected, not a bug — see home_dashboard_entry.js for how init()
// re-resolves on every call so a profile picked up mid-session (after the
// user opens a flow once) still takes effect on the next refresh/PTR.

var HomeDashboardResolver = (function () {
    'use strict';

    function readListJson() {
        try {
            var raw = storage.getItem('list_json');
            if (!raw) {
                return null;
            }
            var parsed = JSON.parse(raw);
            if (!parsed || !parsed.length) {
                return null;
            }
            return parsed[0];
        } catch (e) {
            return null;
        }
    }

    function readRoleId() {
        try {
            var raw = storage.getItem('role_id');
            if (raw === null || raw === undefined || raw === '') {
                return null;
            }
            return String(JSON.parse(raw));
        } catch (e) {
            return null;
        }
    }

    // list_json[0].home_dashboard_enabled (forward-compat, inert until a flow
    // opens) -> a future login.js-persisted localStorage flag (also inert in
    // P1, nothing writes it yet) -> HomeDashboardConfig.DEFAULT_ENABLED.
    function isEnabled() {
        var flow = readListJson();
        if (flow && typeof flow.home_dashboard_enabled === 'boolean') {
            return flow.home_dashboard_enabled;
        }
        var tenantFlag = null;
        try {
            tenantFlag = localStorage.getItem('home_dashboard_enabled');
        } catch (e) {
            tenantFlag = null;
        }
        if (tenantFlag === 'true') {
            return true;
        }
        if (tenantFlag === 'false') {
            return false;
        }
        return HomeDashboardConfig.DEFAULT_ENABLED === true;
    }

    function fromRoleMap(flow, roleId) {
        if (!flow || !flow.dashboard_role_map) {
            return null;
        }
        var map = flow.dashboard_role_map;
        if (typeof map === 'string') {
            try {
                map = JSON.parse(map);
            } catch (e) {
                return null;
            }
        }
        if (roleId && map[roleId]) {
            return map[roleId];
        }
        return map['*'] || null;
    }

    // A profile can list widget types this session doesn't implement yet
    // (P2+ types configured server-side ahead of the client shipping them) —
    // drop those rather than rendering nothing or throwing.
    function filterImplemented(profile) {
        if (!profile || !profile.widgets) {
            return profile;
        }
        var kept = [];
        for (var i = 0; i < profile.widgets.length; i++) {
            var w = profile.widgets[i];
            if (w && HomeDashboardConfig.isImplemented(w.type)) {
                kept.push(w);
            }
        }
        var out = {};
        for (var k in profile) {
            if (profile.hasOwnProperty(k)) {
                out[k] = profile[k];
            }
        }
        out.widgets = kept;
        return out;
    }

    // list_json[0].dashboard_profile -> list_json[0].dashboard_role_map[role_id|'*']
    // -> HomeDashboardConfig.DEFAULT_PROFILE (PRD Appendix A).
    function resolveProfile() {
        var flow = readListJson();
        var candidate = (flow && flow.dashboard_profile)
            || fromRoleMap(flow, readRoleId())
            || HomeDashboardConfig.DEFAULT_PROFILE;
        if (typeof candidate === 'string') {
            try {
                candidate = JSON.parse(candidate);
            } catch (e) {
                candidate = HomeDashboardConfig.DEFAULT_PROFILE;
            }
        }
        return filterImplemented(candidate);
    }

    return {
        isEnabled: isEnabled,
        resolveProfile: resolveProfile,
        readRoleId: readRoleId
    };
})();
