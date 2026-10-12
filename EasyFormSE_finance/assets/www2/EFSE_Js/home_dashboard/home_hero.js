// Home hero: one swipeable card at the top of Home with up to three slides.
//
//   Site visit    Vendor Technician role only. Shows whether the technician is
//                 on a site and lets them pick the reason for the visit.
//   Driver trips  This month's trips, rolled up the same way as the Trips tab.
//   Learning      LMS progress, read from what the LMS last cached on the phone.
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

    // Where "is this technician on a site right now" comes from. It is asked
    // for {onSite, siteId, siteName, arrivedMs, nearest}. Until a real source
    // is plugged in with setSiteProvider() the slide reports "Not on a site".
    var siteProvider = function (onDone) { onDone(null); };

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
            + '<div class="hd-card-title hh-title"><span>Site visit</span><i class="fa-solid fa-location-dot" aria-hidden="true"></i></div>'
            + '<div class="hh-status hh-site-status"><span class="hh-dot"></span><span class="hh-status-text">Checking…</span></div>'
            + '<div class="hh-head hh-site-name"></div>'
            + '<div class="hh-sub hh-site-sub"></div>'
            + '<div class="hh-field-lab">Reason for site visit</div>'
            + '<select class="hh-select hh-site-reason" disabled aria-label="Reason for site visit">'
            + '<option value="">Available once you arrive</option></select>'
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

    function paintSite($slide, site) {
        var $status = $slide.find('.hh-site-status');
        var $select = $slide.find('.hh-site-reason');
        if (!site || !site.onSite) {
            $status.removeClass('is-on').find('.hh-status-text').text('Not on a site');
            $slide.find('.hh-site-name').text('No site nearby');
            $slide.find('.hh-site-sub').text(site && site.nearest ? ('Nearest: ' + site.nearest) : '');
            $select.prop('disabled', true).html('<option value="">Available once you arrive</option>');
            return;
        }
        $status.addClass('is-on').find('.hh-status-text').text('You are on-site');
        $slide.find('.hh-site-name').text(site.siteName || '');
        var sub = 'Site ID ' + (site.siteId == null ? '—' : site.siteId);
        if (site.arrivedMs) sub += ' · arrived ' + clock(site.arrivedMs);
        $slide.find('.hh-site-sub').text(sub);

        loadModules(function (modules) {
            var chosen = savedReason(site.siteId);
            var html = '<option value="">Select a module</option>';
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
                        siteId: site.siteId,
                        siteName: site.siteName,
                        moduleId: moduleId,
                        moduleName: $(this).find('option:selected').text(),
                        at: Date.now()
                    }));
                } catch (e) { }
            });
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
        if ($site.length) siteProvider(function (site) { paintSite($site, site); });
        paintTrips($root.find('[data-slide="trips"]'));
        paintLms($root.find('[data-slide="lms"]'));
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
        if ($site.length) paintSite($site, null);

        if (timer) clearInterval(timer);
        timer = setInterval(refresh, REFRESH_MS);
    }

    function setSiteProvider(fn) {
        if (typeof fn === 'function') siteProvider = fn;
        refresh();
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

    return { render: render, refresh: refresh, setSiteProvider: setSiteProvider, isVendorTechnician: isVendorTechnician };
})();
