// Public API for the Universal Trip & Site Map. List pages use only this file.
// See docs/PRD-Trip-Site-Map-v2.md §7.1.

var TripSiteMap = (function () {
    'use strict';

    // Home bottom bar no longer hosts Map (Trip List replaced it). Widgets
    // and list pages still call open() / bindButton(selector).
    var BUTTON_ID = '#btn_trip_map';

    function isEnabled() {
        return TripMapProfile.resolve() !== null;
    }

    function cacheListing(rows) {
        try {
            var count = TripMapCache.saveListing(rows);
            bindButton(BUTTON_ID);
            return count;
        } catch (e) {
            // Caching is a side errand of the list page; never let it surface there.
            return 0;
        }
    }

    // Drops the `raw` passthrough before the plugin hop. It exists for a future
    // "open task" deep link and stays in the session cache, but shipping a full
    // listing row per site through an Intent extra risks TransactionTooLarge at
    // the larger site limits.
    function forPlugin(sites) {
        var out = [];
        for (var i = 0; i < sites.length; i++) {
            var s = sites[i];
            out.push({
                site_id: s.site_id,
                site_name: s.site_name,
                lat: s.lat,
                lon: s.lon,
                status: s.status,
                server_task_id: s.server_task_id,
                survey_ms: s.survey_ms,
                cluster_id: s.cluster_id,
                module_id: s.module_id,
                module_name: s.module_name
            });
        }
        return out;
    }

    // Same jStorage key the list pages scope their task_master queries by.
    function readUsername() {
        try {
            var raw = storage.getItem('username');
            if (raw === null || raw === undefined || raw === '') {
                return '';
            }
            var value = JSON.parse(raw);
            return (value === null || value === undefined) ? '' : String(value);
        } catch (e) {
            return '';
        }
    }

    // No limit is applied here: profiles that rank by distance must sort before
    // truncating (FR-13), and only the native side knows the user's position.
    function open() {
        try {
            var profile = TripMapProfile.resolve();
            if (!profile) {
                return;
            }
            // An empty cache is no longer a reason to refuse: the map opens and
            // says so, and its range chips let the user widen the search.
            var sites = TripMapCache.getSites();
            cordova.exec(function () { }, function (e) {
                alert1(e + '_TripSiteMap.open()');
            }, 'TripTrackingMapPlugin', 'anAction', [{
                profile: profile,
                cluster_value: TripMapProfile.readClusterValue(profile),
                // Lets the native side fall back to the local task_master rows
                // when no list page has populated the cache yet.
                username: readUsername(),
                sites: forPlugin(sites)
            }]);
        } catch (e) {
            alert1(e + '_TripSiteMap.open()');
        }
    }

    // Trip list row: native Google Map overlay (Maps SDK). maxMs <= 0 means
    // live / until now.
    function openRoute(minMs, maxMs, title) {
        try {
            var min = parseInt(minMs, 10);
            var max = parseInt(maxMs, 10);
            if (isNaN(min) || min <= 0) {
                return;
            }
            if (isNaN(max) || max < 0) {
                max = 0;
            }
            var payload = {
                overlay: true,
                title: title ? String(title) : '',
                path_min_ms: min,
                path_max_ms: max
            };
            var profile = TripMapProfile.resolve();
            if (profile) {
                payload.profile = profile;
                payload.cluster_value = TripMapProfile.readClusterValue(profile);
                payload.username = readUsername();
                payload.sites = forPlugin(TripMapCache.getSites());
            }
            cordova.exec(function () { }, function (e) {
                alert1(e + '_TripSiteMap.openRoute()');
            }, 'TripTrackingMapPlugin', 'anAction', [payload]);
        } catch (e) {
            alert1(e + '_TripSiteMap.openRoute()');
        }
    }

    // Shows the caller's button element only when a profile resolves (FR-01/FR-04).
    function bindButton(selector) {
        try {
            if (isEnabled()) {
                $(selector).show();
            } else {
                $(selector).hide();
            }
        } catch (e) {
            // ignore
        }
    }

    try {
        $(document).ready(function () {
            bindButton(BUTTON_ID);
        });
    } catch (e) {
        // No jQuery on this page — the button simply stays hidden.
    }

    return {
        open: open,
        openRoute: openRoute,
        cacheListing: cacheListing,
        isEnabled: isEnabled,
        bindButton: bindButton
    };
})();
