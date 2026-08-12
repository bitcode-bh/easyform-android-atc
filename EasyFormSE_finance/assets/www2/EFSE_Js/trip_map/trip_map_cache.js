// Normalizes listing rows into MapSite and caches them for the map.
// See docs/PRD-Trip-Site-Map-v2.md §9.1 / §9.2.

var TripMapCache = (function () {
    'use strict';

    function pick(row, names) {
        for (var i = 0; i < names.length; i++) {
            var v = row[names[i]];
            if (v !== null && v !== undefined && v !== '') {
                return v;
            }
        }
        return null;
    }

    function toCoord(value) {
        if (value === null || value === undefined || value === '') {
            return null;
        }
        var n = parseFloat(value);
        if (isNaN(n) || n === 0) {
            return null;
        }
        return n;
    }

    // FR-12. Rows are captured before the list pages substitute the user's own
    // position for a missing site coordinate, so a surviving 0/null here is a
    // genuinely unmapped site rather than that fallback.
    function normalizeRow(row) {
        if (!row) {
            return null;
        }
        var lat = toCoord(pick(row, ['lat', 'latitude', 'site_lat']));
        var lon = toCoord(pick(row, ['long1', 'long', 'longitude', 'site_long']));
        if (lat === null || lon === null) {
            return null;
        }
        if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
            return null;
        }
        return {
            site_id: pick(row, ['Customer_id', 'site_id', 'siteid']),
            site_name: pick(row, ['siteid', 'site_name', 'Customer_id']),
            lat: lat,
            lon: lon,
            status: pick(row, ['status1', 'status']),
            server_task_id: pick(row, ['server_task_id']),
            survey_date: pick(row, ['survey_date']),
            // Epoch companion of survey_date (online listings call it
            // `millisecond`, the offline task table `survey_ms`). Date filters
            // use this instead of parsing the display string, whose format is
            // server/tenant dependent.
            survey_ms: pick(row, ['millisecond', 'survey_ms']),
            cluster_id: pick(row, ['circle_id', 'cluster_id']),
            raw: row
        };
    }

    function normalize(rows) {
        var out = [];
        if (!rows || !rows.length) {
            return out;
        }
        for (var i = 0; i < rows.length; i++) {
            var site = normalizeRow(rows[i]);
            if (site) {
                out.push(site);
            }
        }
        return out;
    }

    function write(key, value) {
        try {
            sessionStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            // A cache write failure must never break the list page it hooks into.
        }
    }

    function read(key) {
        try {
            var raw = sessionStorage.getItem(key);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function saveListing(rows) {
        var sites = normalize(rows);
        write(TripMapConfig.CACHE_KEYS.sites, sites);
        write(TripMapConfig.CACHE_KEYS.meta, {
            role_id: TripMapProfile.readRoleId(),
            count: sites.length,
            cached_at: new Date().getTime()
        });
        return sites.length;
    }

    function getSites() {
        return read(TripMapConfig.CACHE_KEYS.sites) || [];
    }

    function clear() {
        try {
            sessionStorage.removeItem(TripMapConfig.CACHE_KEYS.sites);
            sessionStorage.removeItem(TripMapConfig.CACHE_KEYS.profile);
            sessionStorage.removeItem(TripMapConfig.CACHE_KEYS.meta);
        } catch (e) {
            // ignore
        }
    }

    return {
        normalize: normalize,
        saveListing: saveListing,
        getSites: getSites,
        clear: clear
    };
})();
