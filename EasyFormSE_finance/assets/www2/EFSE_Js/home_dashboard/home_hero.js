// Home hero: one swipeable card at the top of Home with up to five slides.
//
//   Site visit    Vendor Technician role only. Nearest site from the phone's
//                 site catalog, its distance, the geofence status, a Refresh
//                 location button and the reason for the visit.
//   Driver trips  This month's trips, rolled up the same way as the Trips tab.
//   Learning      LMS progress, read from what the LMS last cached on the phone.
//   Permit        The permit to work in force (or the next approved one), as
//                 a card. Shown only once a permit source is plugged in.
//   Passport      The Safety Passport card from the profile menu.
//
// The card is always present; a slide with nothing to show says so rather than
// disappearing. Everything here reads existing data. Nothing is written to the
// engine's tables, and the only thing stored is the chosen visit reason.

var HomeHero = (function () {
    'use strict';

    var ROOT_ID = 'div_home_hero';
    var REASON_KEY = 'home_hero_site_visit_reason';
    // Last trip figures shown, so the card paints at once on the next visit to
    // Home instead of sitting on placeholders while the database is read.
    var TRIPS_CACHE_KEY = 'home_hero_trips_last';
    var REFRESH_MS = 60000;
    // The reason chosen while no nearest site is known is kept under this id.
    var TEST_SITE_ID = 'no-site';
    // Below this screen height the card scrolls with the list instead of
    // staying fixed (same rule as BillBaant K's PinnedHeaderList).
    var FIXED_MIN_HEIGHT = 600;
    var REST_AFTER_MS = 140;
    // Room under the last row, clear of the strip above the tab bar.
    var LIST_END_ROOM = 18;

    // A fix less accurate than this is not treated as a reliable location.
    var ACCURACY_LIMIT_M = 100;
    var FIX_TIMEOUT_MS = 30000;
    // Refresh cannot be tapped again until this long after the last one ended.
    var REFRESH_COOLDOWN_MS = 10000;
    // A stored position older than this is shown with its time.
    var STALE_FIX_MS = 10 * 60000;

    // The radius used for a site whose catalog row carries none (0 or blank).
    var DEFAULT_RADIUS_M = 50;

    // Optional server-side geofence validation. Called with a fresh fix and the
    // nearest site ({lat, lon, accuracy, at, siteId}); answers {status: 'on' |
    // 'off', siteId, siteName, distanceM} or null when the server could not
    // say. When one is plugged in its answer wins. Without one (the app has no
    // endpoint that validates a position without an open task) the status is
    // worked out on the phone: inside the site's geofence radius is On-site.
    var geofenceValidator = null;

    // What the site slide currently knows.
    var site = {
        loaded: false,    // catalog read at least once
        sites: [],        // the phone's catalog
        fix: null,        // {lat, lon, accuracy, at, fresh}
        nearest: null,    // {siteId, siteName, distanceM, radiusM}
        verdict: null,    // the server's answer for the current fix
        problem: '',      // why a location could not be used
        note: '',
        flowRadius: {},   // flow id -> geofence radius in metres
        busy: false,
        autoAskAt: 0,     // no automatic location request before this time
        readyAt: 0
    };

    var timer = null;

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function readSession(key) {
        try { return JSON.parse(storage.getItem(key)); } catch (e) { return null; }
    }

    // Vendor Technician, by the role name the login response puts in the session.
    function isVendorTechnician() {
        var name = readSession('role_name');
        if (name == null) return false;
        var n = String(name).trim().toLowerCase();
        // The role is stored as "Vender Technician" (sic) on the live server.
        return n === 'vt' || /vend[eo]r\s*technician/.test(n) || /(^|[^a-z])vt([^a-z]|$)/.test(n);
    }

    function pad(n) { return n < 10 ? '0' + n : String(n); }

    function clock(ms) {
        var d = new Date(ms);
        var h = d.getHours(), m = d.getMinutes();
        var suffix = h >= 12 ? 'pm' : 'am';
        h = h % 12; if (h === 0) h = 12;
        return h + ':' + pad(m) + ' ' + suffix;
    }

    // ---- slides ----------------------------------------------------------

    // Every slide has the same anatomy: a quiet label with the status beside
    // it, one headline, one supporting line, a body block and one action.
    function topHtml(label, labelClass, pillClass) {
        return '<div class="hh-top"><span class="hh-eyebrow ' + labelClass + '">' + label + '</span>'
            + '<span class="hh-pill ' + pillClass + '"><i class="hh-dot"></i><span class="hh-status-text"></span></span></div>';
    }

    function statHtml(valueClass, label) {
        return '<div class="hh-stat"><b class="' + valueClass + '">…</b><span>' + label + '</span></div>';
    }

    // Decoration only: geofence rings around a point, for what the slide
    // answers (inside the site's radius or not).
    var SITE_ART = '<svg class="hh-site-art" viewBox="0 0 320 250" preserveAspectRatio="xMaxYMin slice" aria-hidden="true">'
        + '<g fill="none" stroke="#c9ccd3" stroke-width="1.5"><circle cx="262" cy="70" r="26"/><circle cx="262" cy="70" r="52"/>'
        + '<circle cx="262" cy="70" r="80" stroke-opacity=".8"/><circle cx="262" cy="70" r="110" stroke-opacity=".55"/>'
        + '<circle cx="262" cy="70" r="142" stroke-opacity=".35"/></g>'
        + '<circle cx="262" cy="70" r="26" fill="#2a3086" fill-opacity=".07"/>'
        + '<circle cx="262" cy="70" r="5" fill="#2a3086" fill-opacity=".55"/></svg>';

    function siteSlideHtml() {
        return '<div class="hh-slide" data-slide="site">'
            + SITE_ART
            + topHtml('Nearest site', 'hh-site-label', 'hh-site-status')
            + '<div class="hh-row"><div class="hh-ic"><i class="hh-site-icon fa-solid fa-location-dot" aria-hidden="true"></i></div>'
            + '<div class="hh-row-text"><div class="hh-head hh-site-name"></div><div class="hh-sub hh-site-sub"></div></div></div>'
            + '<div class="hh-site-fullname"></div>'
            + '<div class="hh-note hh-site-note"></div>'
            + '<label class="hh-field"><small>Reason for visit</small>'
            + '<select class="hh-select hh-site-reason" disabled aria-label="Reason for visit">'
            + '<option value="">Loading modules…</option></select></label>'
            + '<div class="hh-foot hh-pull"><i class="fa-solid fa-arrow-down" aria-hidden="true"></i>'
            + '<span class="hh-pull-text">Pull down to refresh location</span></div>'
            + '</div>';
    }

    // Decoration only: a faint street map with one route across the whole
    // slide, under a light veil so the figures stay readable. It is drawn
    // artwork, not the user's trips.
    var TRIP_MAP_ART = '<svg class="hh-map-art" viewBox="0 0 320 250" preserveAspectRatio="xMidYMid slice" aria-hidden="true">'
        + '<g stroke="#d3d6dc" stroke-width="7" fill="none" stroke-linecap="round">'
        + '<path d="M-10 40 L330 95"/><path d="M-10 150 L330 190"/><path d="M-10 235 L330 262"/>'
        + '<path d="M50 -10 L25 260"/><path d="M140 -10 L118 260"/><path d="M228 -10 L212 260"/><path d="M300 -10 L308 260"/></g>'
        + '<g stroke="#dcdee3" stroke-width="3" fill="none"><path d="M-10 95 L330 142"/><path d="M-10 195 L330 228"/>'
        + '<path d="M95 -10 L72 260"/><path d="M185 -10 L165 260"/><path d="M265 -10 L258 260"/></g>'
        + '<path d="M130 172 L215 182 L224 82 L308 96" fill="none" stroke="#2a3086" stroke-opacity=".5" stroke-width="3.5" '
        + 'stroke-linecap="round" stroke-linejoin="round"/>'
        + '<circle cx="130" cy="172" r="5.5" fill="#fff" stroke="#2a3086" stroke-width="2"/>'
        + '<circle cx="308" cy="96" r="5.5" fill="#2a3086" fill-opacity=".7"/>'
        + '<rect width="320" height="250" fill="#ecedef" fill-opacity=".45"/></svg>';

    // A trip figure; tapping any of them opens the Trips page.
    function tripStat(valueClass, label) {
        return '<a href="#" class="hh-stat hh-open-trips"><b class="' + valueClass + '">…</b><span>' + label + '</span></a>';
    }

    function tripSlideHtml() {
        var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return '<div class="hh-slide" data-slide="trips">'
            + TRIP_MAP_ART
            + topHtml('Driver trips · ' + months[new Date().getMonth()], '', 'hh-trip-status')
            + '<div class="hh-head hh-figure hh-trip-km">…</div>'
            + '<div class="hh-sub hh-trip-sub"></div>'
            + '<div class="hh-stats">' + tripStat('hh-trip-time', 'Drive time') + tripStat('hh-trip-viol', 'Violations')
            + tripStat('hh-trip-call', 'On call') + '</div>'
            + '</div>';
    }

    // The LMS tab each learning area opens (LMS_Dashboard.html).
    var LMS_TABS = { mod: 'tab-1', ass: 'tab-2', ml: 'tab-4' };

    // One learning area: completed out of total, then what is pending and the
    // score. Tapping it opens the LMS on that area's tab.
    function lmsStatHtml(key, label) {
        return '<a href="#" class="hh-stat hh-lms-open" data-tab="' + LMS_TABS[key] + '"><b class="hh-lms-' + key + '-done">—</b>'
            + '<span>' + label + '</span><span class="hh-lms-' + key + '-more"></span></a>';
    }

    // The learning score sits inside a hard hat drawn in faint safety yellow
    // (most of the learning is safety training), with its label underneath.
    var LEARNING_ART = '<div class="hh-learn-art"><svg viewBox="0 0 184 108" aria-hidden="true">'
        + '<g fill="none" stroke="#e0b63a" stroke-opacity=".5" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">'
        + '<path d="M20 86 C20 40 52 12 92 12 S164 40 164 86"/>'
        + '<path d="M4 88 H180 a6 6 0 0 1 0 14 H4 a6 6 0 0 1 0 -14 z"/>'
        + '<path d="M76 14 V34"/><path d="M108 14 V34"/></g>'
        + '<path d="M92 12 V32" stroke="#e0b63a" stroke-opacity=".8" stroke-width="5" stroke-linecap="round"/>'
        + '<text x="92" y="76" text-anchor="middle"><tspan class="hh-score-val"></tspan><tspan class="hh-score-of">/100</tspan></text></svg>'
        + '<div class="hh-score-lab">Learning score<small class="hh-score-tag"></small></div></div>';

    function lmsSlideHtml() {
        return '<div class="hh-slide" data-slide="lms">'
            + LEARNING_ART
            + '<div class="hh-top"><span class="hh-eyebrow">Learning</span><img class="hh-shield" alt="" /></div>'
            + '<div class="hh-head hh-lms-name"></div>'
            + '<div class="hh-sub hh-lms-lessons"></div>'
            + '<div class="hh-stats">' + lmsStatHtml('mod', 'Modules') + lmsStatHtml('ass', 'Assessments')
            + lmsStatHtml('ml', 'Micro learning') + '</div>'
            + '</div>';
    }

    // ---- site visit --------------------------------------------------------

    // The modules on this phone (flow_master), for the reason dropdown.
    function loadModules(onDone) {
        try {
            cordova.exec(function (e) {
                var rows = [];
                try { rows = JSON.parse(e) || []; } catch (err) { rows = []; }
                onDone(rows);
            }, function () { onDone([]); }, 'SqlitePlugin', 'showValues',
                [{ data: 'select moduleid, module_name from flow_master order by module_name', p: '1' }]);
        } catch (e) { onDone([]); }
    }

    function savedReason(siteId) {
        var r = null;
        try { r = JSON.parse(localStorage.getItem(REASON_KEY)); } catch (e) { r = null; }
        return (r && String(r.siteId) === String(siteId)) ? r : null;
    }

    // Fills the reason dropdown with the phone's modules. It is open whether or
    // not a nearest site is known, so the choice can be tried anywhere; with
    // no site the choice is kept under TEST_SITE_ID.
    function fillReasons($select, place) {
        var siteId = place ? place.siteId : TEST_SITE_ID;
        var siteName = place ? place.siteName : '';
        loadModules(function (modules) {
            // Leave an open dropdown alone: the card repaints every minute.
            var stamp = String(siteId) + '|' + modules.length;
            if ($select.data('hhStamp') === stamp && modules.length) return;
            $select.data('hhStamp', stamp);

            var chosen = savedReason(siteId);
            var html = '<option value="">' + (modules.length ? 'Select a module' : 'No modules on this phone yet') + '</option>';
            for (var i = 0; i < modules.length; i++) {
                var id = String(modules[i].moduleid);
                html += '<option value="' + esc(id) + '"' + (chosen && String(chosen.moduleId) === id ? ' selected' : '') + '>'
                    + esc(String(modules[i].module_name || '').trim()) + '</option>';
            }
            $select.html(html).prop('disabled', modules.length === 0);
            $select.off('change.homeHero').on('change.homeHero', function () {
                var moduleId = $(this).val();
                if (!moduleId) { localStorage.removeItem(REASON_KEY); return; }
                try {
                    localStorage.setItem(REASON_KEY, JSON.stringify({
                        siteId: siteId,
                        siteName: siteName,
                        moduleId: moduleId,
                        moduleName: $(this).find('option:selected').text(),
                        at: Date.now()
                    }));
                } catch (e) { }
            });
        });
    }

    // ---- nearest site and geofence status --------------------------------

    function toRad(deg) { return deg * (Math.PI / 180); }

    function metresBetween(lat1, lon1, lat2, lon2) {
        var dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
        var h = Math.sin(dLat / 2) * Math.sin(dLat / 2)
            + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    }

    // Meters (spelled out, so "3 m" is not read as minutes) under 1 km,
    // kilometres from there.
    function formatDistance(m) {
        if (Math.round(m) < 1000) return Math.round(m) + (Math.round(m) === 1 ? ' meter' : ' meters');
        return (Math.round(m / 100) / 10) + ' km';
    }

    function validCoords(lat, lon) {
        return !isNaN(lat) && !isNaN(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180 && !(lat === 0 && lon === 0);
    }

    // Site names are not in the phone's catalog. One is shown only when the
    // site list the user last had on screen (TripMapCache) carries it.
    function knownSiteName(siteId) {
        try {
            if (typeof TripMapCache === 'undefined') return '';
            var rows = TripMapCache.getSites() || [];
            for (var i = 0; i < rows.length; i++) {
                if (String(rows[i].site_id) === String(siteId)) {
                    var n = String(rows[i].site_name == null ? '' : rows[i].site_name).trim();
                    return (n && n !== String(siteId)) ? n : '';
                }
            }
        } catch (e) { }
        return '';
    }

    // The closest catalog site to a position; rows with unusable coordinates
    // are skipped.
    function nearestSite(sites, fix) {
        var best = null;
        for (var i = 0; i < (sites || []).length; i++) {
            var lat = parseFloat(sites[i].latitude), lon = parseFloat(sites[i].longitude);
            if (!validCoords(lat, lon)) continue;
            var d = metresBetween(fix.lat, fix.lon, lat, lon);
            if (!best || d < best.distanceM) {
                best = { siteId: sites[i].place_id, distanceM: d, radiusM: parseFloat(sites[i].radius), flowId: sites[i].flow_id, siteType: sites[i].site_type };
            }
        }
        if (best) best.siteName = knownSiteName(best.siteId);
        return best;
    }

    // The site's own radius, else its flow's (what the app's geofence itself
    // uses when the site row carries 0), else DEFAULT_RADIUS_M.
    function siteRadius(n) {
        if (n && n.radiusM > 0) return n.radiusM;
        if (n && site.flowRadius[n.flowId] > 0) return site.flowRadius[n.flowId];
        return DEFAULT_RADIUS_M;
    }

    // One of: checking, nosites, unavailable, pending, on, off.
    function siteStatus() {
        if (!site.loaded) return 'checking';
        if (!site.sites.length) return 'nosites';
        if (!site.fix || site.problem) return 'unavailable';
        if (site.verdict && (site.verdict.status === 'on' || site.verdict.status === 'off')) return site.verdict.status;
        // A position too old to say where the technician is now.
        if (Date.now() - site.fix.at > STALE_FIX_MS) return 'pending';
        if (!site.nearest) return 'pending';
        return site.nearest.distanceM <= siteRadius(site.nearest) ? 'on' : 'off';
    }

    var STATUS_TEXT = {
        checking: 'Checking…',
        nosites: 'No sites on this phone',
        unavailable: 'Location unavailable',
        pending: 'Validation pending',
        on: 'On-site',
        off: 'Off-site'
    };

    // Telecom site type -> icon. The phone's site catalog carries no type today
    // (place id, coordinates, radius, flow only), so every site gets the pin
    // until the server sends one with the site.
    var SITE_TYPE_ICONS = [
        [/gbt|ground/, 'fa-tower-cell'],
        [/rtt|rtp|roof/, 'fa-building'],
        [/cow|wheel/, 'fa-truck'],
        [/ibs|in.?building|indoor/, 'fa-city'],
        [/small|pole|gbm/, 'fa-tower-broadcast']
    ];

    function siteTypeIcon(type) {
        var t = String(type == null ? '' : type).trim().toLowerCase();
        for (var i = 0; t && i < SITE_TYPE_ICONS.length; i++) {
            if (SITE_TYPE_ICONS[i][0].test(t)) return SITE_TYPE_ICONS[i][1];
        }
        return 'fa-location-dot';
    }

    function paintSite($slide) {
        var status = siteStatus();
        $slide.find('.hh-site-status').removeClass('is-on is-off is-warn')
            .addClass(status === 'on' ? 'is-on' : status === 'off' ? 'is-off' : status === 'unavailable' ? 'is-warn' : '')
            .find('.hh-status-text').text(STATUS_TEXT[status]);
        // "Nearest" only while the technician is not at it; then when the
        // position behind it was taken.
        var label = status === 'on' ? 'Current site' : 'Nearest site';
        if (site.fix) {
            var old = Date.now() - site.fix.at > STALE_FIX_MS || site.problem;
            label += (old ? ' · last seen ' : ' · updated ') + clock(site.fix.at);
        }
        $slide.find('.hh-site-label').text(label);
        $slide.find('.hh-pull').toggleClass('is-busy', site.busy)
            .find('.hh-pull-text').text(site.busy ? 'Getting location…' : 'Pull down to refresh location');

        // The server's own site and distance win over the phone's when it gave them.
        var v = site.verdict, n = site.nearest;
        var siteId = (v && v.siteId != null) ? v.siteId : (n ? n.siteId : null);
        var siteName = (v && v.siteName) ? v.siteName : (n ? n.siteName : '');
        var siteType = n ? n.siteType : '';
        var distanceM = (v && v.distanceM != null) ? v.distanceM : (n ? n.distanceM : null);

        $slide.find('.hh-site-icon').attr('class', 'hh-site-icon fa-solid ' + siteTypeIcon(siteType));
        if (siteId == null) {
            $slide.find('.hh-site-name').text(status === 'checking' ? '' : status === 'nosites' ? 'No sites downloaded' : 'Not known yet');
            $slide.find('.hh-site-sub').text('');
            $slide.find('.hh-site-fullname').text('');
        } else {
            // The Site ID is the headline; the name, when the app has it, goes
            // underneath in smaller text.
            $slide.find('.hh-site-name').text('Site ' + siteId);
            var parts = [];
            if (siteType) parts.push(String(siteType));
            if (distanceM != null && status !== 'unavailable') {
                parts.push(formatDistance(distanceM) + (status === 'on' ? ' from site' : ' away'));
            }
            $slide.find('.hh-site-sub').text(parts.join(' · '));
            $slide.find('.hh-site-fullname').text(siteName || '');
        }

        $slide.find('.hh-site-note').text(site.note || '');
        fillReasons($slide.find('.hh-site-reason'), siteId == null ? null : { siteId: siteId, siteName: siteName });
    }

    // Catalog plus the position the location service last stored, taken
    // whenever it is newer than the one held. The only GPS request made from
    // here is one automatic one when that position is missing or too old to
    // place the technician, and at most once per STALE_FIX_MS.
    function loadSite($slide) {
        if (typeof HomeDashboardData === 'undefined' || !HomeDashboardData.getSiteCatalog) { paintSite($slide); return; }
        HomeDashboardData.getSiteCatalog(function (rows) {
            site.sites = rows || [];
            site.loaded = true;
            HomeDashboardData.getLastLocation(function (row) {
                var lat = row ? parseFloat(row.lat) : NaN, lon = row ? parseFloat(row.lon) : NaN;
                var at = row ? parseInt(row.date, 10) : NaN;
                if (validCoords(lat, lon) && !isNaN(at) && at > 0 && (!site.fix || at > site.fix.at)) {
                    site.fix = { lat: lat, lon: lon, accuracy: parseFloat(row.accuracy), at: at, fresh: false };
                    site.verdict = null;
                    site.problem = '';
                    site.note = '';
                }
                site.nearest = site.fix ? nearestSite(site.sites, site.fix) : null;
                var n = site.nearest;
                var needsFlowRadius = n && !(n.radiusM > 0) && site.flowRadius[n.flowId] === undefined && HomeDashboardData.getFlowRadius;
                function done() {
                    paintSite($slide);
                    var stale = !site.fix || Date.now() - site.fix.at > STALE_FIX_MS;
                    if (stale && !site.busy && site.sites.length && Date.now() >= site.autoAskAt) {
                        site.autoAskAt = Date.now() + STALE_FIX_MS;
                        refreshLocation($slide);
                    }
                }
                if (!needsFlowRadius) { done(); return; }
                HomeDashboardData.getFlowRadius(n.flowId, function (radius) {
                    site.flowRadius[n.flowId] = radius || 0;
                    done();
                });
            });
        });
    }

    // Pulling down on the site slide asks for a new position. The slide takes
    // vertical drags itself (touch-action in the stylesheet), so the pull does
    // not scroll Home.
    var PULL_DISTANCE = 56;

    function bindPullToRefresh($slide) {
        var x0 = 0, y0 = 0, tracking = false;
        function pulled(t) {
            var dx = t.clientX - x0, dy = t.clientY - y0;
            return dy >= PULL_DISTANCE && dy > Math.abs(dx) * 1.5;
        }
        $slide.off('.hhPullSite')
            .on('touchstart.hhPullSite', function (ev) {
                // The dropdown keeps its own touches.
                if ($(ev.target).closest('.hh-field').length) { tracking = false; return; }
                var t = (ev.originalEvent || ev).touches[0];
                x0 = t.clientX; y0 = t.clientY; tracking = true;
            })
            .on('touchmove.hhPullSite', function (ev) {
                if (!tracking || site.busy) return;
                var ready = pulled((ev.originalEvent || ev).touches[0]);
                $slide.find('.hh-pull').toggleClass('is-ready', ready)
                    .find('.hh-pull-text').text(ready ? 'Release to refresh' : 'Pull down to refresh location');
            })
            .on('touchend.hhPullSite touchcancel.hhPullSite', function (ev) {
                if (!tracking) return;
                tracking = false;
                $slide.find('.hh-pull').removeClass('is-ready');
                var done = ev.type === 'touchend' && pulled((ev.originalEvent || ev).changedTouches[0]);
                if (done) refreshLocation($slide); else paintSite($slide);
            });
    }

    // A new position from the location service (the plugin the site list's own
    // refresh uses). It answers only when the service reports a location after
    // this call, so a stored one is never passed off as new.
    function requestFreshFix(onDone) {
        var settled = false;
        var timeout = setTimeout(function () { finish({ error: 'timeout' }); }, FIX_TIMEOUT_MS);
        function finish(result) {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            onDone(result);
        }
        try {
            cordova.exec(function (e) {
                var row = null;
                try { row = JSON.parse(e)[0]; } catch (err) { row = null; }
                var lat = row ? parseFloat(row.lat) : NaN, lon = row ? parseFloat(row.lon) : NaN;
                if (!validCoords(lat, lon)) { finish({ error: 'nofix' }); return; }
                finish({ lat: lat, lon: lon, accuracy: parseFloat(row.accuracy), at: Date.now(), fresh: true, gpsOn: String(row.gps) !== '0' });
            }, function (err) {
                finish({ error: /gps/i.test(String(err)) ? 'off' : 'nofix' });
            }, 'current_lat', 'showValues', []);
        } catch (ex) {
            finish({ error: 'nofix' });
        }
    }

    var FIX_ERRORS = {
        off: 'Location is turned off. Turn on GPS and tap Refresh.',
        timeout: 'No location received. Check that GPS is on and location permission is allowed.',
        nofix: 'Could not get a location. Move to open sky and tap Refresh.'
    };

    function refreshLocation($slide) {
        if (site.busy || Date.now() < site.readyAt) return;
        site.busy = true;
        site.note = '';
        paintSite($slide);
        function end() {
            site.busy = false;
            site.readyAt = Date.now() + REFRESH_COOLDOWN_MS;
            paintSite($slide);
        }
        requestFreshFix(function (fix) {
            // Whatever happened, the earlier server answer no longer applies.
            site.verdict = null;
            if (fix.error) {
                site.problem = fix.error;
                site.note = FIX_ERRORS[fix.error];
                end();
                return;
            }
            site.fix = fix;
            site.nearest = nearestSite(site.sites, fix);
            if (!(fix.accuracy <= ACCURACY_LIMIT_M)) {
                site.problem = 'accuracy';
                site.note = 'GPS accuracy is too low' + (isNaN(fix.accuracy) ? '' : ' (±' + Math.round(fix.accuracy) + ' m)')
                    + '. Move to open sky and tap Refresh.';
                end();
                return;
            }
            site.problem = '';
            if (!site.nearest) { end(); return; }
            if (!geofenceValidator) { end(); return; }
            if (navigator.onLine === false) {
                site.note = 'No network. Tap Refresh when you are back online.';
                end();
                return;
            }
            var answered = false;
            var giveUp = setTimeout(function () { answer(null); }, FIX_TIMEOUT_MS);
            function answer(v) {
                if (answered) return;
                answered = true;
                clearTimeout(giveUp);
                site.verdict = v || null;
                site.note = v ? '' : 'The server could not validate this location. Tap Refresh to try again.';
                end();
            }
            try {
                geofenceValidator({ lat: fix.lat, lon: fix.lon, accuracy: fix.accuracy, at: fix.at, siteId: site.nearest.siteId }, answer);
            } catch (ex) { answer(null); }
        });
    }

    // ---- safety passport -----------------------------------------------------

    // The same card as My Safety Passport in the profile menu, as a slide. Its
    // fields are answers in the profile the app already keeps (login response,
    // refreshed by the profile page); the question ids are the ones
    // build_user_safety_passport() reads. The backend sends no validity status
    // or expiry, so none is shown.
    var PASSPORT_FIELDS = { id: 10044, name: 20, circle: 42, partner: 10016, contact: 10036, blood: 10037 };

    // Front and back of the passport card. The same markup is the Home slide
    // and, at full size, the card PermitCards.openPassport() shows.
    function passportFacesHtml() {
        function cell(label, key) {
            return '<div><small>' + label + '</small><b class="hh-pass-' + key + '"></b></div>';
        }
        var shieldArt = '<svg class="sp-art" viewBox="0 0 100 100" aria-hidden="true">'
            + '<path d="M50 6 L86 18 V48 C86 72 70 88 50 96 C30 88 14 72 14 48 V18 Z" fill="none" stroke="#2a3086" stroke-width="4" stroke-linejoin="round"/>';
        var altius = (typeof PermitCards !== 'undefined' && PermitCards.altiusLogo) ? PermitCards.altiusLogo : '<span class="ps-altius">ALTIUS</span>';
        var back = '';
        // The six safety icons, in their original order: narrow, wide, narrow.
        for (var n = 1; n <= 6; n++) back += '<img src="images/safety_passport/sp_back_' + n + '.png" alt="" />';
        return '<div class="sp-face sp-front">' + shieldArt
            + '<path d="M34 50 l12 12 l22 -24" fill="none" stroke="#2a3086" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
            + '<div class="sp-head"><img class="sp-photo hh-pass-photo" src="images/profile_pic.png" alt="" />'
            + '<div class="sp-title"><small>Safety passport</small><b class="hh-pass-name"></b></div>' + altius + '</div>'
            + '<div class="sp-fields">' + cell('Safety passport ID', 'id') + cell('Circle', 'circle')
            + cell('Partner name', 'partner') + cell('Emergency contact', 'contact')
            + cell('Role', 'role') + cell('Blood group', 'blood') + '</div>'
            + '<div class="sp-foot"><a href="#" class="sp-share"><i class="fa-solid fa-share-nodes" aria-hidden="true"></i> Share</a></div>'
            + '<img class="sp-shield" src="images/lms_shield_logo.png" alt="24x7 SHIELD" /></div>'
            + '<div class="sp-face sp-back">' + shieldArt + '</svg><div class="sp-rules">' + back + '</div></div>';
    }

    function passportSlideHtml() {
        return '<div class="hh-slide" data-slide="passport">'
            // A div, not a link: the card holds the Share link, and a link
            // inside a link makes the browser break the card's markup apart.
            + '<div class="hh-passport sp-card" role="button" aria-label="Open Safety Passport">' + passportFacesHtml() + '</div></div>';
    }

    function passportData() {
        var out = {};
        var data = null;
        try {
            data = localStorage.getItem('profile_user_data');
            for (var n = 0; n < 2 && typeof data === 'string' && data; n++) data = JSON.parse(data);
        } catch (e) { data = null; }
        for (var i = 0; i < (data && data.length ? data.length : 0); i++) {
            for (var key in PASSPORT_FIELDS) {
                if (!data[i] || String(data[i].que_id) !== String(PASSPORT_FIELDS[key])) continue;
                var ans = data[i].ans;
                var val = (ans && typeof ans !== 'string' && ans.length !== undefined) ? ans[0] : ans;
                // Only plain text answers; a structured one is left blank.
                if (typeof val === 'string' || typeof val === 'number') {
                    val = String(val).trim();
                    if (val && val.charAt(0) !== '[' && val.charAt(0) !== '{') out[key] = val;
                }
            }
        }
        var role = readSession('role_name');
        out.role = String(role == null ? '' : role).replace(/Vender Technician/g, 'Vendor Technician');
        return out;
    }

    function paintPassport($slide) {
        if (!$slide.length) return;
        var d = passportData();
        var keys = ['id', 'name', 'circle', 'partner', 'contact', 'blood', 'role'];
        for (var i = 0; i < keys.length; i++) $slide.find('.hh-pass-' + keys[i]).text(d[keys[i]] || '');
        if (!d.id) $slide.find('.hh-pass-id').text('Not available');
        var photo = $('#menu_img_profile').attr('src');
        if (photo) $slide.find('.hh-pass-photo').attr('src', photo);
    }

    // A vertical swipe over the passport turns it over; leaving the slide
    // turns it back to the front.
    function bindPassportFlip($root) {
        var $card = $root.find('.hh-passport');
        if (!$card.length) return;
        var x0 = 0, y0 = 0, tracking = false, turned = false;
        $card.off('.hhFlip')
            .on('touchstart.hhFlip', function (ev) {
                var t = (ev.originalEvent || ev).touches[0];
                x0 = t.clientX; y0 = t.clientY; tracking = true; turned = false;
            })
            .on('touchend.hhFlip touchcancel.hhFlip', function (ev) {
                if (!tracking) return;
                tracking = false;
                var t = (ev.originalEvent || ev).changedTouches[0];
                var dx = t.clientX - x0, dy = t.clientY - y0;
                if (Math.abs(dy) < 30 || Math.abs(dy) < Math.abs(dx) * 1.5) return;
                $card.toggleClass('is-back');
                turned = true;
            })
            // The swipe that turned the card must not also open the passport page.
            .on('click.hhFlip', function (ev) {
                if (!turned) return;
                turned = false;
                ev.preventDefault();
                ev.stopImmediatePropagation();
                return false;
            });
    }

    // ---- driver trips ------------------------------------------------------

    function showTrips($slide, t) {
        var $status = $slide.find('.hh-trip-status');
        if (t.live) $status.addClass('is-on').find('.hh-status-text').text('Trip in progress · ' + t.liveText);
        else $status.removeClass('is-on').find('.hh-status-text').text('No trip in progress');
        $slide.find('.hh-trip-km').text(t.kmText);
        $slide.find('.hh-trip-time').text(t.timeText);
        $slide.find('.hh-trip-viol').text(String(t.violations));
        $slide.find('.hh-trip-call').text(String(t.call));
        $slide.find('.hh-trip-sub').text(t.trips + (t.trips === 1 ? ' trip' : ' trips') + ' this month');
    }

    function cachedTrips() {
        var c = null;
        try { c = JSON.parse(localStorage.getItem(TRIPS_CACHE_KEY)); } catch (e) { c = null; }
        return (c && String(c.uid) === String(readSession('user_id'))) ? c.t : null;
    }

    function paintTrips($slide) {
        if (!$slide.length) return;
        if (typeof TripListSheet === 'undefined' || !TripListSheet.summary) return;
        TripListSheet.summary('month', function (t) {
            if (!t) {
                $slide.find('.hh-trip-status').removeClass('is-on').find('.hh-status-text').text('No trip data');
                return;
            }
            showTrips($slide, t);
            try {
                localStorage.setItem(TRIPS_CACHE_KEY, JSON.stringify({
                    uid: readSession('user_id'),
                    t: { live: t.live, liveText: t.liveText, kmText: t.kmText, timeText: t.timeText,
                        violations: t.violations, trips: t.trips, speed: t.speed, call: t.call }
                }));
            } catch (e) { }
        });
    }

    // ---- learning ----------------------------------------------------------

    // The LMS keeps its last listing responses in localStorage (LMS/lms_data.js,
    // keys "lms_cache_<version>_<kind>_<user>_<role>"). Home is a different page,
    // so this is the only LMS data it can see without calling the LMS API.
    function cachedListing(kind) {
        var uid = readSession('user_id');
        var best = null;
        try {
            for (var i = 0; i < localStorage.length; i++) {
                var key = localStorage.key(i);
                if (!key || key.indexOf('lms_cache_') !== 0) continue;
                if (key.indexOf('_' + kind + '_' + uid + '_') === -1) continue;
                var res = JSON.parse(localStorage.getItem(key));
                if (res && res[0] && res[0].status == 1) {
                    var data = res[0].data;
                    if (typeof data === 'string') data = JSON.parse(data);
                    if (data && data.length) best = data;
                }
            }
        } catch (e) { best = null; }
        return best;
    }

    // Completed count and average score of a listing, by the LMS's own rules
    // (lms_compute_completion_kpi): complete at Progress 100, score averaged
    // over items that have answers in.
    function listingKpi(items) {
        var total = (items || []).length, done = 0, scoreSum = 0, scored = 0;
        for (var i = 0; i < total; i++) {
            var it = items[i];
            if ((Number(it.Progress) || 0) >= 100) done++;
            var questions = Number(it.TotalQuestion) || 0;
            var submitted = Number(it.SubmitedSkill) || Number(it.SubmitedQuestion) || 0;
            var score = Number(it.Score);
            if (submitted > 0 && questions > 0 && !isNaN(score)) { scoreSum += score / questions * 100; scored++; }
        }
        return { total: total, done: done, score: scored ? Math.round(scoreSum / scored) : null };
    }

    function showLmsStat($slide, key, done, total, score) {
        if (total == null) {
            $slide.find('.hh-lms-' + key + '-done').text('—');
            $slide.find('.hh-lms-' + key + '-more').text('');
            return;
        }
        $slide.find('.hh-lms-' + key + '-done').text(done + '/' + total);
        var pending = Math.max(0, total - done);
        $slide.find('.hh-lms-' + key + '-more').text(pending + ' pending' + (score == null ? '' : ' · ' + score + '%'));
    }

    // Watched and library counts the Micro Learning screen leaves behind, and
    // the quiz score it keeps on the phone.
    function microLearning() {
        var s = null;
        try { s = JSON.parse(localStorage.getItem('lms_ml_home_summary')); } catch (e) { s = null; }
        if (!s || String(s.uid) !== String(readSession('user_id'))) return null;
        var answered = Number(localStorage.getItem('lms_ml_quiz_total')) || 0;
        var correct = Number(localStorage.getItem('lms_ml_quiz_correct')) || 0;
        return { done: Number(s.watched) || 0, total: Number(s.total) || 0, score: answered ? Math.round(correct / answered * 100) : null };
    }

    // PLACEHOLDER. There is no overall learning score yet: nothing in the LMS
    // or its API produces one. Until it exists the slide shows this fixed
    // sample figure, marked "Sample" on screen. Replace learningScore() with
    // the real source and drop the tag when it does.
    var SAMPLE_LEARNING_SCORE = 82;

    function learningScore() {
        return { value: SAMPLE_LEARNING_SCORE, sample: true };
    }

    function paintLms($slide) {
        var score = learningScore();
        $slide.find('.hh-score-val').text(String(score.value));
        $slide.find('.hh-score-tag').text(score.sample ? ' · Sample' : '');
        var $shield = $slide.find('.hh-shield');
        if ($shield.length && !$shield.attr('src')) {
            try {
                var base = JSON.parse(storage.getItem('global_wcf_url')) || (typeof global_wcf_url !== 'undefined' ? global_wcf_url : '');
                $shield.attr('src', new URL(base).origin + '/images/safety_passport/sp_shield.png');
            } catch (e) { }
        }
        var modules = cachedListing('modules');
        var assessments = cachedListing('assessments');
        var ml = microLearning();
        if (ml) showLmsStat($slide, 'ml', ml.done, ml.total, ml.score); else showLmsStat($slide, 'ml', 0, null);
        if (assessments) { var ak = listingKpi(assessments); showLmsStat($slide, 'ass', ak.done, ak.total, ak.score); }
        else showLmsStat($slide, 'ass', 0, null);
        if (!modules) {
            $slide.find('.hh-lms-name').text('Open LMS to see your progress');
            $slide.find('.hh-lms-lessons').text('');
            showLmsStat($slide, 'mod', 0, null);
            return;
        }
        var done = 0, total = 0, current = null;
        for (var i = 0; i < modules.length; i++) {
            var m = modules[i];
            done += Number(m.SubmitedSkill) || 0;
            total += Number(m.TotalSkill) || 0;
            var p = Number(m.Progress) || 0;
            // The module to carry on with: furthest along but not finished.
            if (p < 100 && (!current || p > (Number(current.Progress) || 0))) current = m;
        }
        var pct = total ? Math.round(done / total * 100) : 0;
        $slide.find('.hh-lms-name').text((current ? current.Module_Name : 'All modules complete') || '');
        $slide.find('.hh-lms-lessons').text(done + ' of ' + total + ' lessons · ' + pct + '%');
        var mk = listingKpi(modules);
        showLmsStat($slide, 'mod', mk.done, mk.total, mk.score);
    }

    // ---- permit to work ------------------------------------------------------

    // Where permits come from. Nothing in the app reads PTW records yet, so no
    // provider is set and the slide is not shown. A provider is called with a
    // callback and answers a list of
    //   {workType, permitNo, siteId, fromMs, untilMs, approvedBy, status}
    // where status is 'active' or 'approved'. The slide shows the active
    // permit, else the next approved one.
    var permitProvider = null;
    var shownPermitSlide = false;
    var permits = [];
    var ENDING_SOON_MS = 15 * 60000;

    // Work type -> its name on the card and its icon.
    var WORK_TYPES = [
        [/hot/, 'Hot work', 'fa-fire'],
        [/height/, 'Work at height', 'fa-person-falling'],
        [/electric/, 'Electrical', 'fa-bolt'],
        [/ftth|fib/, 'FTTH', 'fa-network-wired']
    ];

    function workType(raw) {
        var t = String(raw == null ? '' : raw).trim();
        for (var i = 0; i < WORK_TYPES.length; i++) {
            if (WORK_TYPES[i][0].test(t.toLowerCase())) return { name: WORK_TYPES[i][1], icon: WORK_TYPES[i][2] };
        }
        return { name: t || 'Permit', icon: 'fa-clipboard-check' };
    }

    // Decoration only: nested caution triangles, in faint safety yellow, in the
    // foot of the slide.
    var PERMIT_ART = '<svg class="hh-permit-art" viewBox="0 0 320 250" preserveAspectRatio="xMaxYMax slice" aria-hidden="true">'
        + '<g fill="none" stroke="#e0b63a" stroke-opacity=".5" stroke-linecap="round" stroke-linejoin="round">'
        + '<path d="M236 118 L296 220 H176 Z" stroke-width="4"/>'
        + '<path d="M236 92 L320 236 H152 Z" stroke-width="1.5"/>'
        + '<path d="M236 66 L344 252 H128 Z" stroke-width="1.5"/>'
        + '<path d="M236 154 V188" stroke-width="5"/></g>'
        + '<circle cx="236" cy="203" r="3.5" fill="#e0b63a" fill-opacity=".8"/>'
        + '<path d="M236 154 V188" stroke="#e0b63a" stroke-opacity=".8" stroke-width="5" stroke-linecap="round"/></svg>';

    function permitSlideHtml() {
        function cell(label, cls) {
            return '<div><small>' + label + '</small><b class="' + cls + '"></b></div>';
        }
        return '<div class="hh-slide" data-slide="permit">' + PERMIT_ART + '<div class="hh-permit">'
            + '<div class="hh-permit-head"><div class="hh-permit-who"><img class="hh-permit-photo" src="images/profile_pic.png" alt="" />'
            + '<span class="hh-permit-name"></span></div>'
            + '<div class="hh-permit-title"><small>Permit to work</small><b class="hh-permit-type"></b></div>'
            + '<span class="hh-pill hh-permit-status"><i class="hh-dot"></i><span class="hh-status-text"></span></span>'
            + '<i class="hh-permit-go fa-solid fa-arrow-right" aria-hidden="true"></i></div>'
            + '<div class="hh-permit-body">' + cell('Permit no.', 'hh-permit-no') + cell('Site', 'hh-permit-site')
            + cell('Valid from', 'hh-permit-from') + cell('Valid until', 'hh-permit-until') + '</div>'
            + '<div class="hh-permit-foot"><span class="hh-permit-by"></span><b class="hh-permit-time"></b></div>'
            + '<div class="hh-permit-none"><span>Request here</span><i class="fa-solid fa-arrow-right" aria-hidden="true"></i></div>'
            + '</div>'
            + '<a href="#" class="hh-foot hh-link hh-permit-sample"><span>Show sample</span></a>'
            + '</div>';
    }

    function dayTime(ms) {
        var d = new Date(ms);
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return clock(ms) + ', ' + d.getDate() + ' ' + months[d.getMonth()];
    }

    function span(ms) {
        var mins = Math.max(0, Math.round(ms / 60000));
        if (mins < 60) return mins + 'm';
        if (mins < 48 * 60) return Math.floor(mins / 60) + 'h ' + pad(mins % 60) + 'm';
        return Math.round(mins / 1440) + ' days';
    }

    // The permit in force now, else the approved one that starts first.
    function permitToShow(list, now) {
        var active = null, next = null;
        for (var i = 0; i < (list || []).length; i++) {
            var p = list[i];
            if (!p || !(p.untilMs > now)) continue;
            if (p.status === 'active') { if (!active || p.untilMs < active.untilMs) active = p; }
            else if (p.status === 'approved') { if (!next || p.fromMs < next.fromMs) next = p; }
        }
        return active || next;
    }

    function paintPermit($slide) {
        if (!$slide.length) return;
        var now = Date.now();
        var p = permitToShow(permits, now);
        var $card = $slide.find('.hh-permit');
        if (!p) {
            $card.removeClass('is-active').addClass('is-empty');
            $slide.find('.hh-permit-type').text('No Active Permit to Work');
            $slide.find('.hh-permit-status .hh-status-text').text('');
            $slide.find('.hh-permit-no, .hh-permit-site, .hh-permit-from, .hh-permit-until').text('—');
            $slide.find('.hh-permit-by, .hh-permit-time').text('');
            return;
        }
        var active = p.status === 'active';
        var type = workType(p.workType);
        var left = p.untilMs - now;
        var soon = active && left <= ENDING_SOON_MS;
        $card.removeClass('is-empty').toggleClass('is-active', active);
        // The holder's own picture and username, in the card's top left corner.
        var photo = $('#menu_img_profile').attr('src');
        if (photo) $slide.find('.hh-permit-photo').attr('src', photo);
        $slide.find('.hh-permit-name').text(String(readSession('username') || ''));
        $slide.find('.hh-permit-type').text(type.name);
        $slide.find('.hh-permit-status').removeClass('is-on is-warn is-ring')
            .addClass(soon ? 'is-warn' : active ? 'is-on' : 'is-ring')
            .find('.hh-status-text').text(soon ? 'Ending soon' : active ? 'Active' : 'Approved');
        $slide.find('.hh-permit-no').text(p.permitNo == null ? '—' : String(p.permitNo));
        $slide.find('.hh-permit-site').text(p.siteId == null ? '—' : String(p.siteId));
        $slide.find('.hh-permit-from').text(p.fromMs ? dayTime(p.fromMs) : '—');
        $slide.find('.hh-permit-until').text(p.untilMs ? dayTime(p.untilMs) : '—');
        $slide.find('.hh-permit-by').text(p.approvedBy ? 'Approved by ' + p.approvedBy : '');
        $slide.find('.hh-permit-time').toggleClass('is-warn', soon)
            .text(active ? span(left) + ' left' : (p.fromMs > now ? 'Starts in ' + span(p.fromMs - now) : 'Ready to start'));
    }

    // The Permit To Work row of the Home module list. With no permit to show,
    // tapping the card opens the module through that row's own click, so
    // navigation is the list's.
    function ptwModuleRow() {
        var rows = document.querySelectorAll('#module_list > li[udf_name]');
        for (var i = 0; i < rows.length; i++) {
            if (/permit\s*to\s*work/i.test(rows[i].getAttribute('udf_name') || '')) return rows[i];
        }
        return null;
    }

    function loadPermits($slide) {
        if (!permitProvider || !$slide.length) return;
        try {
            permitProvider(function (list) {
                permits = (list && list.length) ? list : [];
                paintPermit($slide);
            });
        } catch (e) { paintPermit($slide); }
    }

    function setPermitProvider(fn) {
        permitProvider = (typeof fn === 'function') ? fn : null;
        permits = [];
        render();
        refresh();
    }

    // ---- list under the pinned card -----------------------------------------
    //
    // The same list design as BillBaant K's PinnedHeaderList: the card stays
    // fixed, the Home cards scroll away under it inside a rounded window (the
    // corner caps in home_dashboard.css), and when scrolling stops with a card
    // cut by the card's foot the list eases on to the nearer end of that card,
    // so the top card always shows whole. Anything that is not a Home card (a
    // gap, the module list) is left where it stopped, and so is the end of the
    // list. On a short screen the card is not fixed and none of this applies.

    // How far to scroll on so the cut row is whole or gone, whichever is
    // nearer. top: where the row starts from the edge (negative: that much is
    // hidden); size: its height.
    function toRowEdge(top, size, canGoOn) {
        if (!canGoOn) return 0;
        return (-top <= top + size) ? top : top + size;
    }

    function restOnRow(root, scroller) {
        if (window.innerHeight < FIXED_MIN_HEIGHT) return;
        if (!root.offsetHeight) return;
        var edge = root.getBoundingClientRect().bottom;
        var windowHeight = scroller.getBoundingClientRect().bottom - edge;
        var rows = document.querySelectorAll('#div_home_dashboard .hd-widget, #module_list > li');
        for (var i = 0; i < rows.length; i++) {
            var r = rows[i].getBoundingClientRect();
            if (!r.height || r.top >= edge - 1 || r.bottom <= edge + 1) continue;
            // A card taller than the window could never show whole.
            if (r.height > windowHeight) return;
            var canGoOn = scroller.scrollTop + scroller.clientHeight < scroller.scrollHeight - 1;
            var by = Math.round(toRowEdge(r.top - edge, r.height, canGoOn));
            if (!by) return;
            try { scroller.scrollBy({ top: by, behavior: 'smooth' }); }
            catch (e) { scroller.scrollTop += by; }
            return;
        }
    }

    // The card is Home's. Inside a module the same page lists that module's
    // items (selection.js keeps the open levels in level_Array), and the card
    // and the list foot are hidden there.
    function isHomeLevel() {
        var levels = readSession('level_Array');
        return !(levels && levels.length);
    }

    // Sizes the card so the list's window holds a whole number of module rows:
    // with the top row resting whole under the card, the bottom row is whole
    // too instead of being cut through its text by the foot. The card gives or
    // takes at most half a row.
    function fitListWindow() {
        var root = document.getElementById(ROOT_ID);
        var foot = document.getElementById('div_home_list_foot');
        var rows = document.querySelectorAll('#module_list > li');
        if (!root || !foot || !root.offsetHeight) return;
        root.style.removeProperty('--hh-slide-h');
        if (window.innerHeight < FIXED_MIN_HEIGHT) return;
        var first = null, second = null;
        for (var i = 0; i < rows.length && !second; i++) {
            if (!rows[i].offsetHeight) continue;
            if (!first) first = rows[i]; else second = rows[i];
        }
        if (!second) return;
        var pitch = second.getBoundingClientRect().top - first.getBoundingClientRect().top;
        if (!(pitch > 20)) return;
        var slide = root.querySelector('.hh-slide');
        if (!slide) return;
        var base = slide.getBoundingClientRect().height;
        function remainder() {
            // The window runs from the card's foot to the top of the foot's solid strip.
            var h = (foot.getBoundingClientRect().top + 10) - root.getBoundingClientRect().bottom;
            var r = h % pitch;
            return r > pitch / 2 ? r - pitch : r;
        }
        var r = remainder();
        if (Math.abs(r) >= 1) {
            root.style.setProperty('--hh-slide-h', (base + r) + 'px');
            // A slide cannot shrink below its content; grow instead when it did not take.
            if (Math.abs(remainder()) >= 1 && r < 0) root.style.setProperty('--hh-slide-h', (base + r + pitch) + 'px');
        }
        // The end of the list has to land on a whole row as well, or the list
        // would stop with its top row cut by the card: pad the scroller so its
        // full travel is a whole number of rows from where the first row rests.
        var scroller = root.parentNode;
        scroller.style.paddingBottom = LIST_END_ROOM + 'px';
        var start = first.getBoundingClientRect().top + scroller.scrollTop - root.getBoundingClientRect().bottom;
        if (root.getBoundingClientRect().top > scroller.getBoundingClientRect().top + 60) return;   // card not at its pinned place
        var travel = scroller.scrollHeight - scroller.clientHeight - start;
        var over = travel % pitch;
        if (travel > 0 && over >= 1 && pitch - over >= 1) scroller.style.paddingBottom = (LIST_END_ROOM + pitch - over) + 'px';
    }

    function syncLevel() {
        var root = document.getElementById(ROOT_ID);
        if (!root) return;
        var home = isHomeLevel();
        root.classList[home ? 'remove' : 'add']('hh-off');
        var foot = document.getElementById('div_home_list_foot');
        if (foot) foot.classList[home ? 'remove' : 'add']('hh-off');
        if (!home) return;
        // The module list arrives after the card is first drawn.
        if (!!(permitProvider || ptwModuleRow()) !== shownPermitSlide) { render(); refresh(); return; }
        fitListWindow();
    }

    var listWatch = null;
    function watchModuleList() {
        var list = document.getElementById('module_list');
        if (!list || listWatch || typeof MutationObserver === 'undefined') return;
        var wait = null;
        listWatch = new MutationObserver(function () {
            if (wait) clearTimeout(wait);
            wait = setTimeout(function () { wait = null; syncLevel(); }, 60);
        });
        listWatch.observe(list, { childList: true });
    }

    function bindRestOnRow($root) {
        var root = $root[0];
        var scroller = $root.closest('.page-content')[0];
        if (!root || !scroller) return;
        var touching = false, wait = null;
        function later() {
            if (wait) clearTimeout(wait);
            wait = setTimeout(function () {
                wait = null;
                if (!touching && isHomeLevel()) restOnRow(root, scroller);
            }, REST_AFTER_MS);
        }
        $(scroller).off('.homeHeroRest')
            .on('touchstart.homeHeroRest', function () { touching = true; if (wait) { clearTimeout(wait); wait = null; } })
            .on('touchend.homeHeroRest touchcancel.homeHeroRest', function () { touching = false; later(); })
            .on('scroll.homeHeroRest', later);
    }

    // ---- shell -------------------------------------------------------------

    function setDots($root) {
        var track = $root.find('.hh-track')[0];
        if (!track) return;
        var idx = Math.round(track.scrollLeft / Math.max(track.clientWidth, 1));
        $root.find('.hh-dots span').removeClass('on').eq(idx).addClass('on');
    }

    function refresh() {
        var $root = $('#' + ROOT_ID);
        if (!$root.length || !$root.find('.hh-track').length) return;
        var $site = $root.find('[data-slide="site"]');
        if ($site.length) loadSite($site);
        paintTrips($root.find('[data-slide="trips"]'));
        paintLms($root.find('[data-slide="lms"]'));
        loadPermits($root.find('[data-slide="permit"]'));
        paintPassport($root.find('[data-slide="passport"]'));
    }

    // The list's window ends a little above the tab bar with the same rounded
    // corners it has under the pinned card: a strip of page colour over the
    // foot of the scroller, with a quarter-circle left clear in each corner.
    function addListFoot() {
        var scroller = document.getElementById('div_page_content');
        if (!scroller || document.getElementById('div_home_list_foot')) return;
        var foot = document.createElement('div');
        foot.id = 'div_home_list_foot';
        foot.setAttribute('aria-hidden', 'true');
        scroller.parentNode.insertBefore(foot, scroller.nextSibling);
    }

    function render() {
        var $root = $('#' + ROOT_ID);
        if (!$root.length) return;
        var slides = [];
        if (isVendorTechnician()) slides.push(siteSlideHtml());
        slides.push(tripSlideHtml());
        slides.push(lmsSlideHtml());
        slides.push(passportSlideHtml());
        // Permit to work is always second; Learning stays second to last.
        shownPermitSlide = !!(permitProvider || ptwModuleRow());
        if (shownPermitSlide) slides.splice(1, 0, permitSlideHtml());

        var dots = '';
        for (var i = 0; i < slides.length; i++) dots += '<span' + (i === 0 ? ' class="on"' : '') + '></span>';
        $root.html('<div class="hh-card"><div class="hh-track">' + slides.join('') + '</div>'
            + '<div class="hh-dots" aria-hidden="true">' + dots + '</div></div>');

        var track = $root.find('.hh-track')[0];
        var raf = null;
        $(track).off('scroll.homeHero').on('scroll.homeHero', function () {
            if (raf) return;
            raf = setTimeout(function () {
                raf = null;
                setDots($root);
                // Off the passport slide, the card goes back to its front.
                var $pass = $root.find('[data-slide="passport"]');
                if ($pass.length && Math.abs($pass[0].offsetLeft - track.scrollLeft) > 4) $pass.find('.hh-passport').removeClass('is-back');
            }, 80);
        });
        $root.find('.hh-open-trips').off('click.homeHero').on('click.homeHero', function (ev) {
            ev.preventDefault();
            if (typeof TripListSheet !== 'undefined') TripListSheet.open();
            return false;
        });
        $root.find('.hh-lms-open').off('click.homeHero').on('click.homeHero', function (ev) {
            ev.preventDefault();
            // Read once by the LMS as it opens.
            try { localStorage.setItem('lms_open_tab', $(this).attr('data-tab')); } catch (e) { }
            if (typeof crossToLMS === 'function') crossToLMS('LMS_Dashboard.html');
            else if (typeof changeurl === 'function') changeurl('LMS_Dashboard.html');
            return false;
        });

        // Everything that needs no database is on screen before the first read
        // returns: learning comes from localStorage, trips from the last figures.
        paintLms($root.find('[data-slide="lms"]'));
        var last = cachedTrips();
        if (last) showTrips($root.find('[data-slide="trips"]'), last);
        var $site = $root.find('[data-slide="site"]');
        if ($site.length) {
            paintSite($site);
            bindPullToRefresh($site);
        }
        paintPassport($root.find('[data-slide="passport"]'));
        bindPassportFlip($root);
        $root.find('.hh-passport').off('click.homeHero').on('click.homeHero', function (ev) {
            ev.preventDefault();
            var share = function () { if (typeof get_safety_passport === 'function') get_safety_passport(); };
            // Share on the slide itself goes straight to the passport page.
            if ($(ev.target).closest('.sp-share').length) { share(); return false; }
            if (typeof PermitCards !== 'undefined' && PermitCards.openPassport) PermitCards.openPassport(this.innerHTML, share);
            else share();
            return false;
        });

        bindRestOnRow($root);
        addListFoot();
        // Pulling down to reveal search belongs to the list. A touch that
        // starts on the card never reaches the page's pull handler.
        $root.off('touchstart.hhPull').on('touchstart.hhPull', function (ev) { ev.stopPropagation(); });
        watchModuleList();
        $root.find('.hh-permit-sample').off('click.homeHero').on('click.homeHero', function (ev) {
            ev.preventDefault();
            if (typeof PermitCards !== 'undefined') PermitCards.open();
            return false;
        });
        $root.find('.hh-permit').off('click.homeHero').on('click.homeHero', function () {
            var row = ptwModuleRow();
            if ($(this).hasClass('is-empty') && row) row.click();
        });
        paintPermit($root.find('[data-slide="permit"]'));

        syncLevel();

        if (timer) clearInterval(timer);
        timer = setInterval(refresh, REFRESH_MS);
    }

    function setGeofenceValidator(fn) {
        geofenceValidator = (typeof fn === 'function') ? fn : null;
    }

    // Draw as soon as the page's markup exists; the database-backed figures
    // follow when Cordova is ready. The card used to wait on deviceready plus a
    // timer, which left a gap at the top of Home on every return to it.
    var deviceIsReady = false;
    // Tab icon "pop": the tapped tab's icon swells and eases back.
    $(document).on('click.hhTabPop', '#div_new_tabbar .tab-link', function () {
        var ico = this.querySelector('.tab-ico');
        if (!ico) return;
        ico.classList.remove('tab-pop');
        void ico.offsetWidth;   // restart the animation on a repeat tap
        ico.classList.add('tab-pop');
    });
    try {
        // A failure in the card must never take the rest of Home's start-up
        // with it: an exception thrown from a ready handler stops the ones
        // queued after it.
        $(document).ready(function () {
            try {
                render();
                if (deviceIsReady || (typeof cordova !== 'undefined' && cordova.exec && window.device)) refresh();
            } catch (e) { try { console.error('HomeHero failed:', e); } catch (ignored) { } }
        });
        document.addEventListener('deviceready', function () {
          try {
            deviceIsReady = true;
            // Coming back from the LMS reels, the system bar is light again.
            try { cordova.exec(function () { }, function () { }, 'SystemBarPlugin', 'navColor', ['#ECEDEF', true]); } catch (e) { }
            if (!$('#' + ROOT_ID + ' .hh-track').length) render();
            refresh();
          } catch (e) { try { console.error('HomeHero failed:', e); } catch (ignored) { } }
        }, false);
    } catch (e) { }

    return { render: render, refresh: refresh, setGeofenceValidator: setGeofenceValidator, setPermitProvider: setPermitProvider, isVendorTechnician: isVendorTechnician,
        // exposed for tests
        _toRowEdge: toRowEdge, _listingKpi: listingKpi, _isHomeLevel: isHomeLevel, _permitToShow: permitToShow, _span: span, _site: site, _siteStatus: siteStatus, _formatDistance: formatDistance, _nearestSite: nearestSite, _metresBetween: metresBetween };
})();
