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
        if (r._server) return r._status || 'Ended';
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
            // A downloaded trip has no rows in this phone's track_master, so its
            // own points are handed to the map instead of a time window.
            TripSiteMap.openRoute(min, tripMaxMs(trip, live), rowTitle(trip, live, trip._km),
                trip._server ? trip._path : null);
        }
    }

    // A stored server trip -> the row shape the list already renders.
    function serverRow(s) {
        return {
            _server: true,
            _status: s.status,
            _path: s.path || [],
            _events: s.ev || {},
            _eventsLoaded: true,
            _speedRuns: serverViolationRuns(s.path),
            _km: (s.m || 0) / 1000,
            _id: '',
            tid: '',
            sid: s.id,
            server_task_id: s.id,
            trip_status: '1',
            min_milli: String(s.start),
            max_milli: String(s.end),
            site_name: '',
            issend: '1',
            distance: String((s.m || 0) / 1000)
        };
    }

    // Phone rows first; a downloaded trip is added only when the phone has no
    // record of the same server task, so a trip still being recorded or not
    // yet uploaded is never replaced by its server copy.
    function mergeServerRows(localRows, bounds) {
        localRows = localRows || [];
        if (typeof TripServerHistory === 'undefined' || !TripServerHistory.getRows) return localRows;
        var have = {};
        for (var i = 0; i < localRows.length; i++) {
            var a = localRows[i].server_task_id, c = localRows[i].sid;
            if (a != null && String(a) !== '0' && String(a) !== '') have[String(a)] = true;
            if (c != null && String(c) !== '0' && String(c) !== '') have[String(c)] = true;
        }
        var server = TripServerHistory.getRows(bounds.start, bounds.end);
        var merged = localRows.slice();
        for (var j = 0; j < server.length; j++) {
            if (!have[String(server[j].id)]) merged.push(serverRow(server[j]));
        }
        merged.sort(function (x, y) {
            return (parseInt(y.min_milli, 10) || 0) - (parseInt(x.min_milli, 10) || 0);
        });
        return merged;
    }

    function serverViolationRuns(path) {
        var runs = 0, inRun = false;
        for (var i = 0; i < (path || []).length; i++) {
            if (path[i][3] === 3) { if (!inRun) { runs++; inRun = true; } }
            else inRun = false;
        }
        return runs;
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

    // The points of one trip out of the range's points.
    function tripPts(pts, minMs, maxMs, live) {
        var min = parseInt(minMs, 10);
        if (isNaN(min) || min <= 0) return [];
        var max = live ? Date.now() : parseInt(maxMs, 10);
        if (isNaN(max) || max < min) max = Date.now();
        var sub = [];
        for (var i = 0; i < pts.length; i++) {
            if (pts[i].ms >= min && pts[i].ms <= max) sub.push(pts[i]);
        }
        return sub;
    }

    function tripPathKm(pts, minMs, maxMs, live) {
        return pathKm(tripPts(pts, minMs, maxMs, live));
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
            if (row._server) continue;   // distance came with the download
            var live = String(row.trip_status) === '0';
            var km = tripPathKm(pts, row.min_milli, row.max_milli, live);
            row._km = km;
            row._speedRuns = violationRuns(tripPts(pts, row.min_milli, row.max_milli, live));
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
        // Downloaded trips have no points in track_master; their distance and
        // violations are added on top of what the phone's own path yields.
        var serverKm = 0, serverViol = 0;
        for (var s = 0; s < rows.length; s++) {
            if (rows[s]._server) {
                serverKm += rows[s]._km || 0;
                serverViol += serverViolationRuns(rows[s]._path);
            }
        }
        setStats('…', timeText, '…');
        if (typeof HomeDashboardData === 'undefined' || !HomeDashboardData.getTripPath) {
            setStats(formatKm(serverKm), timeText, String(serverViol));
            return;
        }
        var b = boundsFor(range);
        HomeDashboardData.getTripPath(b.start, b.end, function (pathRows) {
            var pts = parsePts(pathRows);
            setStats(formatKm(pathKm(pts) + serverKm), timeText, String(violationRuns(pts) + serverViol));
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
            // Tapping the row expands it; the icon on the right opens the map.
            html += '<li class="trip-li" data-idx="' + j + '">'
                + '<div class="trip-row">'
                + '<a href="#" class="item-content trip-list-item" data-idx="' + j + '" aria-expanded="false">'
                + '<div class="item-inner">'
                + '<div class="item-title">' + esc(title) + '</div>'
                + '<div class="item-text">' + esc(sub) + '</div>'
                + '<div class="trip-row-status">'
                + (tripId ? '<span class="trip-id-tag">' + esc(tripId) + '</span>' : '')
                + esc(status)
                + '</div>'
                + '</div></a>'
                + '<a href="#" class="trip-map-btn" data-idx="' + j + '" aria-label="Open trip on map" title="Open map">'
                + '<i class="fa-solid fa-map-location-dot" aria-hidden="true"></i></a>'
                + '</div>'
                + '<div class="trip-details" style="display:none"></div>'
                + '</li>';
        }
        box.innerHTML = html;
        $(box).find('.trip-list-item').off('click.tripList').on('click.tripList', function (ev) {
            ev.preventDefault();
            var idx = parseInt($(this).attr('data-idx'), 10);
            if (rows[idx]) toggleDetails(rows[idx], $(this).closest('.trip-li'));
            return false;
        });
        $(box).find('.trip-map-btn').off('click.tripMap').on('click.tripMap', function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
            var trip = rows[parseInt($(this).attr('data-idx'), 10)];
            if (!trip) return false;
            openNativeRoute(trip, String(trip.trip_status) === '0');
            return false;
        });
    }

    // Engine / server event names -> the buckets shown in a trip's details.
    // Normal (non-harsh) acceleration events are not violations and are left out.
    var EVENT_BUCKETS = {
        'speed': 'speed',
        'acc': 'accel',
        'deacc': 'brake',
        'harsh brake': 'brake',
        'call': 'call',
        'still': 'idle',
        'powersavingmode': 'power'
    };

    function bucketEvents(counts) {
        var out = { speed: 0, accel: 0, brake: 0, call: 0, idle: 0, power: 0 };
        for (var key in counts) {
            if (!counts.hasOwnProperty(key)) continue;
            var bucket = EVENT_BUCKETS[String(key).trim().toLowerCase()];
            if (bucket) out[bucket] += parseInt(counts[key], 10) || 0;
        }
        return out;
    }

    function detailCell(label, value) {
        return '<div class="trip-detail"><span class="trip-detail-lab">' + esc(label) + '</span>'
            + '<span class="trip-detail-val">' + esc(value) + '</span></div>';
    }

    function eventChip(icon, label, count) {
        return '<div class="trip-event' + (count > 0 ? ' has-events' : '') + '">'
            + '<i class="fa-solid ' + icon + '" aria-hidden="true"></i>'
            + '<span class="trip-event-count">' + count + '</span>'
            + '<span class="trip-event-lab">' + esc(label) + '</span></div>';
    }

    function detailsHtml(row) {
        var live = String(row.trip_status) === '0';
        var ev = bucketEvents(row._events || {});
        // Overspeed is also visible in the path itself (tripflag 3 runs); a trip
        // whose events were already uploaded and cleared still shows it.
        var speed = Math.max(ev.speed, row._speedRuns || 0);
        var end = live ? 'In progress' : (formatWhen(row.max_milli) || '—');
        var html = '<div class="trip-detail-grid">'
            + detailCell('Started', formatWhen(row.min_milli) || '—')
            + detailCell('Ended', end)
            + detailCell('Duration', formatDuration(row.min_milli, row.max_milli, live) || '—')
            + detailCell('Distance', formatKm(row._km || 0))
            + '</div>';
        html += '<div class="trip-event-row">'
            + eventChip('fa-gauge-high', 'Overspeed', speed)
            + eventChip('fa-angles-up', 'Harsh accel.', ev.accel)
            + eventChip('fa-angles-down', 'Harsh brake', ev.brake)
            + eventChip('fa-phone', 'On call', ev.call)
            + '</div>';
        if (ev.idle > 0 || ev.power > 0) {
            html += '<div class="trip-event-extra">'
                + (ev.idle > 0 ? 'Idle stops: ' + ev.idle : '')
                + (ev.idle > 0 && ev.power > 0 ? ' · ' : '')
                + (ev.power > 0 ? 'Power saving: ' + ev.power : '')
                + '</div>';
        }
        if (!row._eventsLoaded) html += '<div class="trip-event-extra">Loading events…</div>';
        return html;
    }

    function toggleDetails(row, $li) {
        var $panel = $li.find('.trip-details');
        var open = $li.hasClass('is-open');
        if (open) {
            $li.removeClass('is-open');
            $panel.hide();
            $li.find('.trip-list-item').attr('aria-expanded', 'false');
            return;
        }
        $li.addClass('is-open');
        $li.find('.trip-list-item').attr('aria-expanded', 'true');
        $panel.html(detailsHtml(row)).show();
        if (row._eventsLoaded) return;
        if (typeof HomeDashboardData === 'undefined' || !HomeDashboardData.getTripEvents) {
            row._events = {};
            row._eventsLoaded = true;
            $panel.html(detailsHtml(row));
            return;
        }
        var live = String(row.trip_status) === '0';
        HomeDashboardData.getTripEvents(row.tid, row.min_milli, live ? 0 : row.max_milli, function (eventRows) {
            var counts = {};
            for (var i = 0; i < (eventRows || []).length; i++) {
                counts[eventRows[i].Event_type] = parseInt(eventRows[i].c, 10) || 0;
            }
            row._events = counts;
            row._eventsLoaded = true;
            // Only repaint if this row is still the open one on screen.
            if ($li.hasClass('is-open')) $panel.html(detailsHtml(row));
        });
    }

    var loadSeq = 0;

    function load() {
        var ul = document.getElementById('trip_list_ul');
        var b = boundsFor(range);
        var seq = ++loadSeq;

        function paint() {
            // A newer range was picked while this one was loading.
            if (seq !== loadSeq) return;
            if (typeof HomeDashboardData !== 'undefined' && HomeDashboardData.getTripList) {
                HomeDashboardData.getTripList(b.start, b.end, function (rows) {
                    if (seq !== loadSeq) return;
                    renderRows(mergeServerRows(rows, b));
                });
            } else {
                renderRows(mergeServerRows([], b));
            }
        }

        // First Trips open after an install or login: fetch last month + this
        // month from the server before painting. A failed fetch still paints
        // the phone's own trips and is retried on the next open.
        var needsDownload = typeof TripServerHistory !== 'undefined' && TripServerHistory.ensureDownloaded
            && !TripServerHistory.hasDownload();
        if (ul) {
            ul.innerHTML = '<li class="trip-list-empty-li"><div class="trip-list-empty">'
                + (needsDownload ? 'Downloading trip history…' : 'Loading…') + '</div></li>';
        }
        if (needsDownload) {
            TripServerHistory.ensureDownloaded(function () { paint(); });
        } else {
            paint();
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
