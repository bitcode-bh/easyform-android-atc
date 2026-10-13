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

    function siteSlideHtml() {
        return '<div class="hh-slide" data-slide="site">'
            + topHtml('Nearest site', 'hh-site-label', 'hh-site-status')
            + '<div class="hh-row"><div class="hh-ic"><i class="hh-site-icon fa-solid fa-location-dot" aria-hidden="true"></i></div>'
            + '<div class="hh-row-text"><div class="hh-head hh-site-name"></div><div class="hh-sub hh-site-sub"></div></div></div>'
            + '<div class="hh-site-fullname"></div>'
            + '<div class="hh-note hh-site-note"></div>'
            + '<label class="hh-field"><small>Reason for visit</small>'
            + '<select class="hh-select hh-site-reason" disabled aria-label="Reason for visit">'
            + '<option value="">Loading modules…</option></select></label>'
            + '<div class="hh-foot"><button type="button" class="hh-refresh">'
            + '<i class="fa-solid fa-rotate" aria-hidden="true"></i><span>Refresh location</span></button>'
            + '<small class="hh-site-updated"></small></div>'
            + '</div>';
    }

    function tripSlideHtml() {
        var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return '<div class="hh-slide" data-slide="trips">'
            + topHtml('Driver trips · ' + months[new Date().getMonth()], '', 'hh-trip-status')
            + '<div class="hh-head hh-figure hh-trip-km">…</div>'
            + '<div class="hh-sub hh-trip-sub"></div>'
            + '<div class="hh-stats">' + statHtml('hh-trip-time', 'Drive time') + statHtml('hh-trip-viol', 'Violations')
            + statHtml('hh-trip-call', 'On call') + '</div>'
            + '<a href="#" class="hh-foot hh-link hh-open-trips"><span>View trips</span><i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>'
            + '</div>';
    }

    function lmsSlideHtml() {
        return '<div class="hh-slide" data-slide="lms">'
            + '<div class="hh-top"><span class="hh-eyebrow">Learning</span><span class="hh-pill hh-lms-lessons"></span></div>'
            + '<div class="hh-head hh-lms-name"></div>'
            + '<div class="hh-bar"><i></i></div>'
            + '<div class="hh-stats">' + statHtml('hh-lms-pct', 'Complete') + statHtml('hh-lms-score', 'Avg score')
            + statHtml('hh-lms-assess', 'Assessments') + '</div>'
            + '<a href="#" class="hh-foot hh-link hh-open-lms"><span>Continue learning</span><i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>'
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
        // "Nearest" only while the technician is not at it.
        $slide.find('.hh-site-label').text(status === 'on' ? 'Current site' : 'Nearest site');
        var $btn = $slide.find('.hh-refresh');
        $btn.prop('disabled', site.busy).toggleClass('is-busy', site.busy)
            .find('span').text(site.busy ? 'Getting location…' : 'Refresh location');

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
        var stale = site.fix && Date.now() - site.fix.at > STALE_FIX_MS;
        $slide.find('.hh-site-updated').text(site.fix ? ((stale || site.problem ? 'Last seen ' : 'Updated ') + clock(site.fix.at)) : '');
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

    function passportSlideHtml() {
        function cell(label, key) {
            return '<div class="col-50"><div class="label">' + label + '</div>'
                + '<div class="value"><span class="hh-pass-' + key + '"></span></div></div>';
        }
        return '<div class="hh-slide" data-slide="passport">'
            + '<a href="#" class="hh-passport" aria-label="Open My Safety Passport">'
            + '<div class="passport-header">'
            + '<div class="passport-photo"><img class="hh-pass-photo" src="images/profile_pic.png" alt="" /></div>'
            + '<div class="passport-title"><div class="country">SAFETY PASSPORT</div>'
            + '<div class="doctype"><span class="hh-pass-name"></span></div></div>'
            + '<div class="passport-badge"><img class="hh-pass-badge" alt="" /></div>'
            + '</div>'
            + '<div class="passport-body">'
            + '<div class="row">' + cell('SAFETY PASSPORT ID', 'id') + cell('CIRCLE', 'circle') + '</div>'
            + '<div class="row">' + cell('PARTNER NAME', 'partner') + cell('EMERGENCY CONTACT NO', 'contact') + '</div>'
            + '<div class="row">' + cell('Role', 'role') + cell('BLOOD GROUP', 'blood') + '</div>'
            + '</div></a></div>';
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
        // Same shield as the profile's card, from whichever host the app is on.
        var $badge = $slide.find('.hh-pass-badge');
        if (!$badge.attr('src')) {
            try {
                var base = JSON.parse(storage.getItem('global_wcf_url')) || (typeof global_wcf_url !== 'undefined' ? global_wcf_url : '');
                $badge.attr('src', new URL(base).origin + '/images/safety_passport/sp_shield.png');
            } catch (e) { }
        }
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

    function paintLms($slide) {
        var modules = cachedListing('modules');
        var assessments = cachedListing('assessments');
        if (!modules) {
            $slide.find('.hh-lms-name').text('Open LMS to see your progress');
            $slide.find('.hh-lms-lessons').text('');
            $slide.find('.hh-lms-pct, .hh-lms-score, .hh-lms-assess').text('—');
            $slide.find('.hh-bar i').css('width', '0%');
            return;
        }
        var done = 0, total = 0, score = 0, questions = 0, current = null;
        for (var i = 0; i < modules.length; i++) {
            var m = modules[i];
            var d = Number(m.SubmitedSkill) || 0, t = Number(m.TotalSkill) || 0;
            done += d; total += t;
            if (d > 0) { score += Number(m.Score) || 0; questions += Number(m.TotalQuestion) || 0; }
            var p = Number(m.Progress) || 0;
            // The module to carry on with: furthest along but not finished.
            if (p < 100 && (!current || p > (Number(current.Progress) || 0))) current = m;
        }
        var head = current ? current.Module_Name : 'All modules complete';
        var pct = total ? Math.round(done / total * 100) : 0;
        $slide.find('.hh-lms-name').text(head || '');
        $slide.find('.hh-lms-lessons').text(done + ' of ' + total + ' lessons');
        $slide.find('.hh-lms-pct').text(pct + '%');
        $slide.find('.hh-bar i').css('width', pct + '%');
        $slide.find('.hh-lms-score').text(questions ? Math.round(score / questions * 100) + '%' : '—');
        $slide.find('.hh-lms-assess').text(assessments ? String(assessments.length) : '—');
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

    function permitSlideHtml() {
        function cell(label, cls) {
            return '<div><small>' + label + '</small><b class="' + cls + '"></b></div>';
        }
        return '<div class="hh-slide" data-slide="permit"><div class="hh-permit">'
            + '<div class="hh-permit-head"><div class="hh-permit-ic"><i class="hh-permit-icon fa-solid fa-clipboard-check" aria-hidden="true"></i></div>'
            + '<div class="hh-permit-title"><small>Permit to work</small><b class="hh-permit-type"></b></div>'
            + '<span class="hh-pill hh-permit-status"><i class="hh-dot"></i><span class="hh-status-text"></span></span></div>'
            + '<div class="hh-permit-body">' + cell('Permit no.', 'hh-permit-no') + cell('Site', 'hh-permit-site')
            + cell('Valid from', 'hh-permit-from') + cell('Valid until', 'hh-permit-until') + '</div>'
            + '<div class="hh-permit-foot"><span class="hh-permit-by"></span><b class="hh-permit-time"></b></div>'
            + '<div class="hh-permit-none">Start a blank permit for hot work, work at height, electrical or FTTH.</div>'
            + '</div>'
            + '<a href="#" class="hh-foot hh-link hh-blank-permit"><span>Blank permit</span><i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>'
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
            $slide.find('.hh-permit-type').text('No permit in force');
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
        $slide.find('.hh-permit-icon').attr('class', 'hh-permit-icon fa-solid ' + type.icon);
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

    // The Permit To Work row of the Home module list. "Blank permit" opens the
    // module through that row's own click, so navigation is the list's.
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
        if (Math.abs(r) < 1) return;
        root.style.setProperty('--hh-slide-h', (base + r) + 'px');
        // A slide cannot shrink below its content; grow instead when it did not take.
        if (Math.abs(remainder()) >= 1 && r < 0) root.style.setProperty('--hh-slide-h', (base + r + pitch) + 'px');
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
        $(root).find('.hh-blank-permit').toggle(!!ptwModuleRow());
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
        shownPermitSlide = !!(permitProvider || ptwModuleRow());
        if (shownPermitSlide) slides.push(permitSlideHtml());
        slides.push(passportSlideHtml());

        var dots = '';
        for (var i = 0; i < slides.length; i++) dots += '<span' + (i === 0 ? ' class="on"' : '') + '></span>';
        $root.html('<div class="hh-card"><div class="hh-track">' + slides.join('') + '</div>'
            + '<div class="hh-dots" aria-hidden="true">' + dots + '</div></div>');

        var track = $root.find('.hh-track')[0];
        var raf = null;
        $(track).off('scroll.homeHero').on('scroll.homeHero', function () {
            if (raf) return;
            raf = setTimeout(function () { raf = null; setDots($root); }, 80);
        });
        $root.find('.hh-open-trips').off('click.homeHero').on('click.homeHero', function (ev) {
            ev.preventDefault();
            if (typeof TripListSheet !== 'undefined') TripListSheet.open();
            return false;
        });
        $root.find('.hh-open-lms').off('click.homeHero').on('click.homeHero', function (ev) {
            ev.preventDefault();
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
            $site.find('.hh-refresh').off('click.homeHero').on('click.homeHero', function (ev) {
                ev.preventDefault();
                refreshLocation($site);
                return false;
            });
        }
        paintPassport($root.find('[data-slide="passport"]'));
        $root.find('.hh-passport').off('click.homeHero').on('click.homeHero', function (ev) {
            ev.preventDefault();
            if (typeof get_safety_passport === 'function') get_safety_passport();
            return false;
        });

        bindRestOnRow($root);
        addListFoot();
        watchModuleList();
        $root.find('.hh-blank-permit').off('click.homeHero').on('click.homeHero', function (ev) {
            ev.preventDefault();
            var row = ptwModuleRow();
            if (row) row.click();
            return false;
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
    try {
        $(document).ready(function () {
            render();
            if (deviceIsReady || (typeof cordova !== 'undefined' && cordova.exec && window.device)) refresh();
        });
        document.addEventListener('deviceready', function () {
            deviceIsReady = true;
            if (!$('#' + ROOT_ID + ' .hh-track').length) render();
            refresh();
        }, false);
    } catch (e) { }

    return { render: render, refresh: refresh, setGeofenceValidator: setGeofenceValidator, setPermitProvider: setPermitProvider, isVendorTechnician: isVendorTechnician,
        // exposed for tests
        _toRowEdge: toRowEdge, _isHomeLevel: isHomeLevel, _permitToShow: permitToShow, _span: span, _site: site, _siteStatus: siteStatus, _formatDistance: formatDistance, _nearestSite: nearestSite, _metresBetween: metresBetween };
})();
