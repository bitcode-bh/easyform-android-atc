// Resolves which map profile applies, from server config only.
// See docs/PRD-Trip-Site-Map-v2.md §4.1 — priority order, no role IDs in code.

var TripMapProfile = (function () {
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

    function isEnabled(flow) {
        // Kill switch (§6.4): only an explicit false disables the module, so a
        // flow that has never heard of this feature still behaves normally.
        return !(flow && flow.trip_map_enabled === false);
    }

    function fromRoleMap(flow, roleId) {
        if (!flow || !flow.role_map) {
            return null;
        }
        var map = flow.role_map;
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

    function heuristic(flow) {
        var url = flow && flow.task_listing_url;
        if (url !== null && url !== undefined && url !== '') {
            return { type: TripMapConfig.TYPES.NEARBY_RADIUS, radius_km: 50, site_limit: 500 };
        }
        return { type: TripMapConfig.TYPES.ASSIGNED_LIST };
    }

    // Returns a defaults-merged profile, or null when the map must stay hidden.
    function resolve() {
        var flow = readListJson();
        if (!isEnabled(flow)) {
            return null;
        }

        var candidate = (flow && flow.map_profile) || fromRoleMap(flow, readRoleId()) || heuristic(flow);
        if (typeof candidate === 'string') {
            try {
                candidate = JSON.parse(candidate);
            } catch (e) {
                return null;
            }
        }
        if (!candidate || !TripMapConfig.isImplemented(candidate.type)) {
            return null;
        }
        return TripMapConfig.withDefaults(candidate);
    }

    // The logged-in user's own value for the profile's cluster field (default
    // circle_id, seeded at login). Returns null when unknown, which the loader
    // treats as "cannot filter by cluster" rather than silently matching none.
    function readClusterValue(profile) {
        if (!profile || !profile.cluster_field) {
            return null;
        }
        try {
            var raw = storage.getItem(profile.cluster_field);
            if (raw === null || raw === undefined || raw === '') {
                return null;
            }
            var value = JSON.parse(raw);
            if (value === null || value === undefined || value === '') {
                return null;
            }
            return String(value);
        } catch (e) {
            return null;
        }
    }

    return {
        resolve: resolve,
        readRoleId: readRoleId,
        readClusterValue: readClusterValue
    };
})();
