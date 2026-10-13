// Home hero: one swipeable card at the top of Home with up to three slides.
//
//   Site visit    Vendor Technician role only. Nearest site from the phone's
//                 site catalog, its distance, the geofence status, a Refresh
//                 location button and the reason for the visit.
//   Driver trips  This month's trips, rolled up the same way as the Trips tab.
//   Learning      LMS progress, read from what the LMS last cached on the phone.
//
// Under the slides sits one compact Safety Passport line (all roles).
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

    // Server-side geofence validation. Called with a fresh fix and the nearest
    // site ({lat, lon, accuracy, at, siteId}); answers {status: 'on' | 'off',
    // siteId, siteName, distanceM} or null when the server could not say.
    // On-site / Off-site are only ever shown from this answer, never from the
    // distance worked out on the phone. Nothing is plugged in yet: the app has
    // no endpoint that validates a position without an open task.
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
        busy: false,
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

    function siteSlideHtml() {
        return '<div class="hh-slide" data-slide="site">'
            + '<div class="hd-card-title hh-title"><span>Nearest site</span><i class="fa-solid fa-location-dot" aria-hidden="true"></i></div>'
            + '<div class="hh-status hh-site-status"><span class="hh-dot"></span><span class="hh-status-text">Checking…</span>'
            + '<button type="button" class="hh-refresh" aria-label="Refresh location">'
            + '<i class="fa-solid fa-rotate" aria-hidden="true"></i><span>Refresh</span></button></div>'
            + '<div class="hh-head hh-site-name"></div>'
            + '<div class="hh-sub hh-site-sub"></div>'
            + '<div class="hh-note hh-site-note"></div>'
            + '<div class="hh-field-lab">Reason for site visit</div>'
            + '<select class="hh-select hh-site-reason" disabled aria-label="Reason for site visit">'
            + '<option value="">Loading modules…</option></select>'
            + '</div>';
    }

    function tripSlideHtml() {
        return '<div class="hh-slide" data-slide="trips">'
            + '<div class="hd-card-title hh-title"><span>Driver trips · this month</span><i class="fa-solid fa-route" aria-hidden="true"></i></div>'
            + '<div class="hh-status hh-trip-status"><span class="hh-dot"></span><span class="hh-status-text">…</span></div>'
            + '<div class="hd-trip-metrics">'
            + '<div class="hd-trip-metric"><span class="hd-trip-metric-val hh-trip-km">…</span><span class="hd-trip-metric-label">Distance</span></div>'
            + '<div class="hd-trip-metric"><span class="hd-trip-metric-val hh-trip-time">…</span><span class="hd-trip-metric-label">Time</span></div>'
            + '<div class="hd-trip-metric"><span class="hd-trip-metric-val hh-trip-viol">…</span><span class="hd-trip-metric-label">Violations</span></div>'
            + '</div>'
            + '<div class="hh-sub hh-trip-sub"></div>'
            + '<a href="#" class="hh-link hh-open-trips"><span>View trips</span><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></a>'
            + '</div>';
    }

    function lmsSlideHtml() {
        return '<div class="hh-slide" data-slide="lms">'
            + '<div class="hd-card-title hh-title"><span>Learning</span><i class="fa-solid fa-shield" aria-hidden="true"></i></div>'
            + '<div class="hh-head hh-lms-name"></div>'
            + '<div class="hh-lms-progress"><span class="hh-lms-lessons"></span><span class="hh-lms-pct"></span></div>'
            + '<div class="hh-bar"><i></i></div>'
            + '<div class="hd-trip-metrics">'
            + '<div class="hd-trip-metric"><span class="hd-trip-metric-val hh-lms-score">—</span><span class="hd-trip-metric-label">Avg score</span></div>'
            + '<div class="hd-trip-metric"><span class="hd-trip-metric-val hh-lms-modules">—</span><span class="hd-trip-metric-label">Modules</span></div>'
            + '<div class="hd-trip-metric"><span class="hd-trip-metric-val hh-lms-assess">—</span><span class="hd-trip-metric-label">Assessments</span></div>'
            + '</div>'
            + '<a href="#" class="hh-link hh-open-lms"><span>Continue learning</span><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></a>'
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

    // Metres under 1 km, kilometres from there.
    function formatDistance(m) {
        if (Math.round(m) < 1000) return Math.round(m) + ' m';
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
                best = { siteId: sites[i].place_id, distanceM: d, radiusM: parseFloat(sites[i].radius) };
            }
        }
        if (best) best.siteName = knownSiteName(best.siteId);
        return best;
    }

    // One of: checking, nosites, unavailable, pending, on, off.
    function siteStatus() {
        if (!site.loaded) return 'checking';
        if (!site.sites.length) return 'nosites';
        if (!site.fix || site.problem) return 'unavailable';
        if (site.verdict && (site.verdict.status === 'on' || site.verdict.status === 'off')) return site.verdict.status;
        return 'pending';
    }

    var STATUS_TEXT = {
        checking: 'Checking…',
        nosites: 'No sites on this phone',
        unavailable: 'Location unavailable',
        pending: 'Validation pending',
        on: 'On-site',
        off: 'Off-site'
    };

    function paintSite($slide) {
        var status = siteStatus();
        var $status = $slide.find('.hh-site-status');
        $status.removeClass('is-on is-off is-warn')
            .addClass(status === 'on' ? 'is-on' : status === 'off' ? 'is-off' : status === 'unavailable' ? 'is-warn' : '')
            .find('.hh-status-text').text(site.busy ? 'Getting location…' : STATUS_TEXT[status]);
        var $btn = $slide.find('.hh-refresh');
        $btn.prop('disabled', site.busy).toggleClass('is-busy', site.busy);

        // The server's own site and distance win over the phone's when it gave them.
        var v = site.verdict, n = site.nearest;
        var siteId = (v && v.siteId != null) ? v.siteId : (n ? n.siteId : null);
        var siteName = (v && v.siteName) ? v.siteName : (n ? n.siteName : '');
        var distanceM = (v && v.distanceM != null) ? v.distanceM : (n ? n.distanceM : null);

        if (siteId == null) {
            $slide.find('.hh-site-name').text(status === 'checking' ? '' : status === 'nosites' ? 'No sites downloaded' : 'Nearest site not known yet');
            $slide.find('.hh-site-sub').text('');
        } else {
            $slide.find('.hh-site-name').text(siteName || ('Site ' + siteId));
            var sub = 'Site ID ' + siteId;
            if (distanceM != null) sub += ' · ' + formatDistance(distanceM) + ' away';
            $slide.find('.hh-site-sub').text(sub);
        }

        var note = site.note;
        if (!note && site.fix && !site.fix.fresh && Date.now() - site.fix.at > STALE_FIX_MS) {
            note = 'Location from ' + clock(site.fix.at) + '. Tap Refresh for a new one.';
        }
        $slide.find('.hh-site-note').text(note || '');
        fillReasons($slide.find('.hh-site-reason'), siteId == null ? null : { siteId: siteId, siteName: siteName });
    }

    // Catalog plus, until Refresh has been used, the position the location
    // service last stored. No GPS request is made here.
    function loadSite($slide) {
        if (typeof HomeDashboardData === 'undefined' || !HomeDashboardData.getSiteCatalog) { paintSite($slide); return; }
        HomeDashboardData.getSiteCatalog(function (rows) {
            site.sites = rows || [];
            site.loaded = true;
            function done() {
                site.nearest = site.fix ? nearestSite(site.sites, site.fix) : null;
                paintSite($slide);
            }
            if (site.fix) { done(); return; }
            HomeDashboardData.getLastLocation(function (row) {
                var lat = row ? parseFloat(row.lat) : NaN, lon = row ? parseFloat(row.lon) : NaN;
                var at = row ? parseInt(row.date, 10) : NaN;
                if (!site.fix && validCoords(lat, lon) && !isNaN(at) && at > 0) {
                    site.fix = { lat: lat, lon: lon, accuracy: parseFloat(row.accuracy), at: at, fresh: false };
                }
                if (!site.fix && !site.note) site.note = 'Tap Refresh to get your location.';
                done();
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
            if (!geofenceValidator) {
                site.note = 'Location updated. Server check is not connected yet.';
                end();
                return;
            }
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

    // The passport ID is answer 10044 of the profile the app already keeps
    // (login response, refreshed by the profile page). The backend sends no
    // validity status or expiry with it, so none is shown.
    var PASSPORT_QUE_ID = 10044;

    function passportId() {
        var data = null;
        try {
            data = localStorage.getItem('profile_user_data');
            for (var n = 0; n < 2 && typeof data === 'string' && data; n++) data = JSON.parse(data);
        } catch (e) { data = null; }
        if (data && data.length) {
            for (var i = 0; i < data.length; i++) {
                if (data[i] && String(data[i].que_id) === String(PASSPORT_QUE_ID)) {
                    var ans = data[i].ans;
                    var val = (ans && ans.length !== undefined && typeof ans !== 'string') ? ans[0] : ans;
                    val = String(val == null ? '' : val).trim();
                    if (val) return val;
                }
            }
        }
        // The passport page, once opened, has it on screen.
        var shown = $('#lbl_sp_empid').text();
        return String(shown || '').trim();
    }

    function passportHtml() {
        return '<a href="#" class="hh-passport" aria-label="Open My Safety Passport">'
            + '<i class="fa-solid fa-id-card" aria-hidden="true"></i>'
            + '<span class="hh-pass-lab">Safety Passport</span>'
            + '<span class="hh-pass-id"></span>'
            + '<i class="fa-solid fa-chevron-right hh-pass-go" aria-hidden="true"></i></a>';
    }

    function paintPassport($root) {
        var id = passportId();
        $root.find('.hh-pass-id').text(id || 'Not available').toggleClass('is-missing', !id);
    }

    // ---- driver trips ------------------------------------------------------

    function showTrips($slide, t) {
        var $status = $slide.find('.hh-trip-status');
        if (t.live) $status.addClass('is-on').find('.hh-status-text').text('Trip in progress · ' + t.liveText);
        else $status.removeClass('is-on').find('.hh-status-text').text('No trip in progress');
        $slide.find('.hh-trip-km').text(t.kmText);
        $slide.find('.hh-trip-time').text(t.timeText);
        $slide.find('.hh-trip-viol').text(String(t.violations));
        $slide.find('.hh-trip-sub').text(t.trips + (t.trips === 1 ? ' trip' : ' trips')
            + ' · ' + t.speed + ' overspeed · ' + t.call + ' on call');
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
            $slide.find('.hh-lms-pct').text('');
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
        $slide.find('.hh-lms-modules').text(String(modules.length));
        $slide.find('.hh-lms-assess').text(assessments ? String(assessments.length) : '—');
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
        var rows = document.querySelectorAll('#div_home_dashboard .hd-widget');
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

    function bindRestOnRow($root) {
        var root = $root[0];
        var scroller = $root.closest('.page-content')[0];
        if (!root || !scroller) return;
        var touching = false, wait = null;
        function later() {
            if (wait) clearTimeout(wait);
            wait = setTimeout(function () {
                wait = null;
                if (!touching) restOnRow(root, scroller);
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
        paintPassport($root);
    }

    function render() {
        var $root = $('#' + ROOT_ID);
        if (!$root.length) return;
        var slides = [];
        if (isVendorTechnician()) slides.push(siteSlideHtml());
        slides.push(tripSlideHtml());
        slides.push(lmsSlideHtml());

        var dots = '';
        for (var i = 0; i < slides.length; i++) dots += '<span' + (i === 0 ? ' class="on"' : '') + '></span>';
        $root.html('<div class="hh-card"><div class="hh-track">' + slides.join('') + '</div>'
            + '<div class="hh-dots" aria-hidden="true">' + dots + '</div>' + passportHtml() + '</div>');

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
        paintPassport($root);
        $root.find('.hh-passport').off('click.homeHero').on('click.homeHero', function (ev) {
            ev.preventDefault();
            if (typeof get_safety_passport === 'function') get_safety_passport();
            return false;
        });

        bindRestOnRow($root);

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

    return { render: render, refresh: refresh, setGeofenceValidator: setGeofenceValidator, isVendorTechnician: isVendorTechnician,
        // exposed for tests
        _toRowEdge: toRowEdge, _formatDistance: formatDistance, _nearestSite: nearestSite, _metresBetween: metresBetween };
})();
