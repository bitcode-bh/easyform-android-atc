// In-page trip list (bottom-bar Trips). Same card language as Home
// #module_list. Range chips: Week / Month (MTD, default) / Quarter / Custom.

var TripListSheet = (function () {
    'use strict';

    var range = 'month';
    var customFrom = '';
    var customTo = '';

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function pad(n) {
        return n < 10 ? '0' + n : String(n);
    }

    function ymd(d) {
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    }

    function parseYmdStart(str) {
        var p = String(str || '').split('-');
        if (p.length !== 3) return NaN;
        return new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10), 0, 0, 0, 0).getTime();
    }

    function parseYmdEnd(str) {
        var p = String(str || '').split('-');
        if (p.length !== 3) return NaN;
        return new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10), 23, 59, 59, 999).getTime();
    }

    function boundsFor(kind) {
        var now = new Date();
        var end = now.getTime();
        var start;
        if (kind === 'week') {
            var day = now.getDay();
            var mondayOffset = (day + 6) % 7;
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset).getTime();
        } else if (kind === 'quarter') {
            var q = Math.floor(now.getMonth() / 3) * 3;
            start = new Date(now.getFullYear(), q, 1).getTime();
        } else if (kind === 'custom') {
            start = parseYmdStart(customFrom);
            end = parseYmdEnd(customTo);
            if (isNaN(start) || isNaN(end)) {
                kind = 'month';
            }
        }
        if (kind === 'month' || start === undefined) {
            start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
            end = now.getTime();
        }
        return { start: start, end: end };
    }

    function formatWhen(ms) {
        var n = parseInt(ms, 10);
        if (isNaN(n) || n <= 0) return '';
        var d = new Date(n);
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return d.getDate() + ' ' + months[d.getMonth()] + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    }

    function formatDuration(startMs, endMs, active) {
        var start = parseInt(startMs, 10);
        if (isNaN(start) || start <= 0) return '';
        var end = active ? Date.now() : parseInt(endMs, 10);
        if (isNaN(end) || end < start) end = Date.now();
        var totalMin = Math.floor((end - start) / 60000);
        if (totalMin < 1) return '< 1m';
        var h = Math.floor(totalMin / 60);
        var m = totalMin % 60;
        return h > 0 ? (h + 'h ' + m + 'm') : (m + 'm');
    }

    function rowTitle(r, active, km) {
        var site = r.site_name && String(r.site_name).trim();
        if (site && site !== '0' && site !== '0.0' && site.toLowerCase() !== 'o' && site.toLowerCase() !== 'n/a' && site.toLowerCase() !== 'null' && site.toLowerCase() !== 'undefined') {
            return site.toUpperCase();
        }
        if (km !== undefined && km !== null) {
            return formatKm(km);
        }
        var distVal = parseFloat(r.distance);
        if (!isNaN(distVal) && distVal > 0) {
            return formatKm(distVal);
        }
        return '0 km';
    }

    function rowSubtitle(r, active) {
        var parts = [];
        var when = formatWhen(r.min_milli);
        var dur = formatDuration(r.min_milli, r.max_milli, active);
        if (when) parts.push(when);
        if (dur) parts.push(dur);
        return parts.join(' · ');
    }

    function rowTripId(r) {
        var taskId = (r.server_task_id && String(r.server_task_id) !== '0') ? r.server_task_id :
                     (r.sid && String(r.sid) !== '0') ? r.sid :
                     (r.tid && String(r.tid) !== '0') ? r.tid : '';
        if (taskId && String(taskId).toLowerCase() !== 'null' && String(taskId).trim() !== '') {
            return '#' + taskId;
        }
        if (r._id && String(r._id) !== '0') {
            return '#' + r._id;
        }
        return '';
    }

    function rowStatus(r, active) {
        if (String(r.issend) === '0') return 'Upload pending';
        return active ? 'Live' : 'Ended';
    }

    function setCount(n) {
        var el = document.getElementById('trip_filter_count');
        if (el) el.textContent = String(n == null ? 0 : n);
    }

    function tripMaxMs(r, live) {
        if (live) return 0;
        var max = parseInt(r.max_milli, 10);
        if (isNaN(max) || max <= 0) return 0;
        return max;
    }

    function openNativeRoute(trip, live) {
        var min = parseInt(trip.min_milli, 10);
        if (isNaN(min) || min <= 0) return;
        if (typeof TripSiteMap !== 'undefined' && TripSiteMap.openRoute) {
            TripSiteMap.openRoute(min, tripMaxMs(trip, live), rowTitle(trip, live, trip._km));
        }
    }

    function setStats(kmText, timeText, violText) {
        var km = document.getElementById('trip_stat_km');
        var tm = document.getElementById('trip_stat_time');
        var vl = document.getElementById('trip_stat_violations');
        if (km) km.textContent = kmText;
        if (tm) tm.textContent = timeText;
        if (vl) vl.textContent = violText;
    }

    function parsePts(rows) {
        var pts = [];
        rows = rows || [];
        for (var i = 0; i < rows.length; i++) {
            var lat = parseFloat(rows[i].lat);
            var lon = parseFloat(rows[i].lon);
            if (isNaN(lat) || isNaN(lon)) continue;
            if (lat === 0 && lon === 0) continue;
            var d = parseInt(rows[i].date, 10);
            if (isNaN(d) || d <= 0) continue;
            var v = String(rows[i].tripflag) === '3';
            pts.push({ lat: lat, lon: lon, ms: d, violation: v });
        }
        pts.sort(function (a, b) { return a.ms - b.ms; });
        return pts;
    }

    function toRad(deg) { return deg * (Math.PI / 180); }

    function haversineKm(lat1, lon1, lat2, lon2) {
        var R = 6371;
        var dLat = toRad(lat2 - lat1);
        var dLon = toRad(lon2 - lon1);
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
            + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2))
            * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    function pathKm(pts) {
        if (!pts || pts.length < 2) return 0;
        var km = 0;
        for (var i = 1; i < pts.length; i++) {
            var d = haversineKm(pts[i - 1].lat, pts[i - 1].lon, pts[i].lat, pts[i].lon);
            if (d < 50) km += d;
        }
        return km;
    }

    function tripPathKm(pts, minMs, maxMs, live) {
        var min = parseInt(minMs, 10);
        if (isNaN(min) || min <= 0) return 0;
        var max = live ? Date.now() : parseInt(maxMs, 10);
        if (isNaN(max) || max < min) max = Date.now();
        var sub = [];
        for (var i = 0; i < pts.length; i++) {
            if (pts[i].ms >= min && pts[i].ms <= max) sub.push(pts[i]);
        }
        return pathKm(sub);
    }

    function violationRuns(pts) {
        if (!pts || !pts.length) return 0;
        var runs = 0;
        var inRun = false;
        for (var i = 0; i < pts.length; i++) {
            if (pts[i].violation) {
                if (!inRun) {
                    runs++;
                    inRun = true;
                }
            } else {
                inRun = false;
            }
        }
        return runs;
    }

    function formatKm(km) {
        if (!km) return '0 km';
        if (km < 1) return Math.round(km * 1000) + ' m';
        return km.toFixed(1) + ' km';
    }

    function tripDurationMs(r, live) {
        var start = parseInt(r.min_milli, 10);
        if (isNaN(start) || start <= 0) return 0;
        var end = live ? Date.now() : parseInt(r.max_milli, 10);
        if (isNaN(end) || end < start) end = Date.now();
        return end - start;
    }

    function formatTotalDuration(ms) {
        if (!ms || ms < 0) return '0m';
        var totalMin = Math.floor(ms / 60000);
        if (totalMin < 1) return '< 1m';
        var h = Math.floor(totalMin / 60);
        var m = totalMin % 60;
        return h > 0 ? (h + 'h ' + m + 'm') : (m + 'm');
    }

    function updateRowDistances(rows, pts) {
        var box = document.getElementById('trip_list_ul');
        if (!box) return;
        for (var j = 0; j < rows.length; j++) {
            var row = rows[j];
            var live = String(row.trip_status) === '0';
            var km = tripPathKm(pts, row.min_milli, row.max_milli, live);
            row._km = km;
            var title = rowTitle(row, live, km);
            var $item = $(box).find('.trip-list-item[data-idx="' + j + '"]');
            if ($item.length) {
                $item.find('.item-title').text(title);
            }
        }
    }

    function refreshListStats(rows) {
        rows = rows || [];
        var timeMs = 0;
        for (var i = 0; i < rows.length; i++) {
            timeMs += tripDurationMs(rows[i], String(rows[i].trip_status) === '0');
        }
        var timeText = rows.length ? formatTotalDuration(timeMs) : '0m';
        setStats('…', timeText, '…');
        if (typeof HomeDashboardData === 'undefined' || !HomeDashboardData.getTripPath) {
            setStats('0 km', timeText, '0');
            return;
        }
        var b = boundsFor(range);
        HomeDashboardData.getTripPath(b.start, b.end, function (pathRows) {
            var pts = parsePts(pathRows);
            setStats(formatKm(pathKm(pts)), timeText, String(violationRuns(pts)));
            updateRowDistances(rows, pts);
        });
    }

    function renderRows(rows) {
        var box = document.getElementById('trip_list_ul');
        if (!box) return;
        rows = rows || [];
        setCount(rows.length);
        refreshListStats(rows);
        if (!rows.length) {
            box.innerHTML = '<li class="trip-list-empty-li"><div class="trip-list-empty">No trips in this range.</div></li>';
            return;
        }

        var html = '';
        for (var j = 0; j < rows.length; j++) {
            var row = rows[j];
            var live = String(row.trip_status) === '0';
            var title = rowTitle(row, live, row._km);
            var sub = rowSubtitle(row, live);
            var status = rowStatus(row, live);
            var tripId = rowTripId(row);
            html += '<li><a href="#" class="item-content trip-list-item" data-idx="' + j + '">'
                + '<div class="item-inner">'
                + '<div class="item-title">' + esc(title) + '</div>'
                + '<div class="item-text">' + esc(sub) + '</div>'
                + '<div class="trip-row-status">'
                + (tripId ? '<span class="trip-id-tag">' + esc(tripId) + '</span>' : '')
                + esc(status)
                + '</div>'
                + '</div></a></li>';
        }
        box.innerHTML = html;
        $(box).find('.trip-list-item').off('click.tripList').on('click.tripList', function (ev) {
            ev.preventDefault();
            var idx = parseInt($(this).attr('data-idx'), 10);
            var trip = rows[idx];
            if (!trip) return false;
            var live = String(trip.trip_status) === '0';
            openNativeRoute(trip, live);
            return false;
        });
    }

    function load() {
        var ul = document.getElementById('trip_list_ul');
        if (ul) ul.innerHTML = '<li class="trip-list-empty-li"><div class="trip-list-empty">Loading…</div></li>';
        var b = boundsFor(range);
        if (typeof HomeDashboardData !== 'undefined' && HomeDashboardData.getTripList) {
            HomeDashboardData.getTripList(b.start, b.end, renderRows);
        } else {
            renderRows([]);
        }
    }

    function syncChips() {
        $('.trip-filter-chip').removeClass('active');
        $('.trip-filter-chip[data-range="' + range + '"]').addClass('active');
        var customRow = document.getElementById('trip_custom_row');
        if (customRow) customRow.style.display = range === 'custom' ? 'flex' : 'none';
    }

    function fillCustomDefaults() {
        var now = new Date();
        if (!customFrom) customFrom = ymd(new Date(now.getFullYear(), now.getMonth(), 1));
        if (!customTo) customTo = ymd(now);
        var fromEl = document.getElementById('trip_date_from');
        var toEl = document.getElementById('trip_date_to');
        if (fromEl) fromEl.value = customFrom;
        if (toEl) toEl.value = customTo;
    }

    function setChrome(tripsOn) {
        var page = document.querySelector('.page.page-on-center') || document.querySelector('.page');
        var inner = document.querySelector('.view-main .navbar-inner');
        if (page) {
            if (tripsOn) page.classList.add('trips-open');
            else page.classList.remove('trips-open');
        }
        if (inner) {
            if (tripsOn) inner.classList.add('trip-filters-on');
            else inner.classList.remove('trip-filters-on');
        }
        setHomeTabOn(!tripsOn);
    }

    function setHomeTabOn(on) {
        var home = document.querySelector('#div_new_tabbar a.tab-link');
        var trips = document.getElementById('btn_trip_list');
        if (home) {
            if (on) home.classList.add('tab-link-active', 'active');
            else home.classList.remove('tab-link-active', 'active');
        }
        if (trips) {
            if (on) trips.classList.remove('tab-link-active', 'active');
            else trips.classList.add('tab-link-active', 'active');
        }
    }

    function isOpen() {
        var el = document.getElementById('div_trip_list');
        return el && el.style.display !== 'none' && $(el).is(':visible');
    }

    function close() {
        $('#div_trip_list').hide();
        $('#div_page_content').show();
        setChrome(false);
        return false;
    }

    function open() {
        try {
            $('#div_vertical_dashboard').hide();
            $('#div_page_content').hide();
            $('#div_trip_list').css('display', 'block');
            setChrome(true);
            if (range === 'custom') fillCustomDefaults();
            syncChips();
            load();
        } catch (e) { }
        return false;
    }

    function bindOnce() {
        $(document).off('click.tripFilter', '.trip-filter-chip').on('click.tripFilter', '.trip-filter-chip', function () {
            range = $(this).attr('data-range') || 'month';
            if (range === 'custom') fillCustomDefaults();
            syncChips();
            load();
            return false;
        });
        $(document).off('change.tripCustom', '#trip_date_from, #trip_date_to').on('change.tripCustom', '#trip_date_from, #trip_date_to', function () {
            customFrom = $('#trip_date_from').val() || customFrom;
            customTo = $('#trip_date_to').val() || customTo;
            range = 'custom';
            syncChips();
            load();
        });
    }

    try {
        $(document).ready(bindOnce);
    } catch (e) { }

    return { open: open, close: close, isOpen: isOpen };
})();
