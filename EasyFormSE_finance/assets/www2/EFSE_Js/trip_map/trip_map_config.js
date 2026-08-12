// Universal Trip & Site Map — defaults and profile registry.
// See docs/PRD-Trip-Site-Map-v2.md §4.2 / §6.4.

var TripMapConfig = (function () {
    'use strict';

    var TYPES = {
        ASSIGNED_LIST: 'ASSIGNED_LIST',
        NEARBY_RADIUS: 'NEARBY_RADIUS',
        ASSIGNED_CLUSTER: 'ASSIGNED_CLUSTER',
        ASSIGNED_CLUSTER_TODAY: 'ASSIGNED_CLUSTER_TODAY',
        DATE_RANGE: 'DATE_RANGE',
        GEOFENCE_DOWNLOAD: 'GEOFENCE_DOWNLOAD',
        OFFLINE_TASK_MASTER: 'OFFLINE_TASK_MASTER',
        CUSTOM_API: 'CUSTOM_API'
    };

    // A configured profile whose type is not listed here resolves to null so the
    // button stays hidden (FR-04) instead of opening a map the loader cannot
    // populate. Shipping a later phase = adding a key here plus a loader branch.
    var IMPLEMENTED = {
        ASSIGNED_LIST: true,
        NEARBY_RADIUS: true,
        ASSIGNED_CLUSTER: true,
        ASSIGNED_CLUSTER_TODAY: true,
        GEOFENCE_DOWNLOAD: true,
        DATE_RANGE: true
    };

    // marker_cluster is deliberately absent here: when a profile does not set it
    // explicitly, it is derived from the effective limit (see CLUSTER_THRESHOLD).
    var TYPE_DEFAULTS = {
        ASSIGNED_LIST: {
            limit: 100,
            use_cached_list: true,
            data_source: 'listing_cache'
        },
        NEARBY_RADIUS: {
            radius_km: 50,
            site_limit: 500,
            data_source: 'task_listing_url'
        },
        ASSIGNED_CLUSTER: {
            limit: 200,
            cluster_field: 'circle_id',
            use_cached_list: true,
            data_source: 'listing_cache'
        },
        ASSIGNED_CLUSTER_TODAY: {
            limit: 200,
            cluster_field: 'circle_id',
            date_field: 'survey_date',
            use_cached_list: true,
            data_source: 'listing_cache'
        },
        // Sourced from the device's own geofence_tracking table (PRD §11),
        // read natively — the JS layer never touches this data itself.
        GEOFENCE_DOWNLOAD: {
            radius_km: 50,
            limit: 500,
            data_source: 'geofence_tracking'
        },
        // start_date/end_date have no static default (epoch ms — see
        // MapProfile.hasDateRange()) — a profile must actually set them; the
        // native side treats a missing/invalid range as "filter skipped",
        // not an error.
        DATE_RANGE: {
            limit: 200,
            use_cached_list: true,
            data_source: 'listing_cache'
        }
    };

    // PRD §10: clustering is required once a profile can draw more than this
    // many markers. An explicit marker_cluster in config still wins.
    var CLUSTER_THRESHOLD = 50;

    var CACHE_KEYS = {
        sites: 'trip_map_sites_v1',
        profile: 'trip_map_profile_v1',
        meta: 'trip_map_meta_v1'
    };

    // The header label is built natively (MapHeader): only the map activity knows
    // the final rendered count and whether a radius filter could actually be
    // applied, so a label composed here could contradict what is drawn.

    function isImplemented(type) {
        return IMPLEMENTED[type] === true;
    }

    function withDefaults(profile) {
        if (!profile || !profile.type) {
            return null;
        }
        var defaults = TYPE_DEFAULTS[profile.type];
        if (!defaults) {
            return null;
        }
        var merged = {};
        var k;
        for (k in defaults) {
            if (defaults.hasOwnProperty(k)) {
                merged[k] = defaults[k];
            }
        }
        for (k in profile) {
            if (profile.hasOwnProperty(k) && profile[k] !== null && profile[k] !== undefined && profile[k] !== '') {
                merged[k] = profile[k];
            }
        }
        if (typeof merged.marker_cluster !== 'boolean') {
            var effectiveLimit = parseInt(merged.site_limit || merged.limit, 10);
            merged.marker_cluster = !isNaN(effectiveLimit) && effectiveLimit > CLUSTER_THRESHOLD;
        }
        return merged;
    }

    return {
        TYPES: TYPES,
        CACHE_KEYS: CACHE_KEYS,
        isImplemented: isImplemented,
        withDefaults: withDefaults
    };
})();
