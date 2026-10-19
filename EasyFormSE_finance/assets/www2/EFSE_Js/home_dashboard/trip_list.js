// In-page trip list (bottom-bar Trips). Same card language as Home
// #module_list. Range chips: Week / Month (MTD, default) / Quarter / Custom.

(function (w) {
    'use strict';
    if (w.AppTripListSheetController) return;
    function create(options) {
        options = options || {};
        var $ = options.$ || function () { return w.jQuery.apply(w, arguments); };
        var document = options.document || w.document;
        var HomeDashboardData = options.data || w.HomeDashboardData;

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

    // Over-speed points less than this apart are one episode, as in the
    // engine (OverspeedEpisodes.MERGE_GAP_MS). Ordinary track points that land
    // between them while speeding don't split it.
    var OVERSPEED_MERGE_MS = 2 * 60 * 1000;

    function countEpisodes(times) {
        var runs = 0, last = -Infinity;
        for (var i = 0; i < times.length; i++) {
            if (times[i] - last > OVERSPEED_MERGE_MS) runs++;
            last = times[i];
        }
        return runs;
    }

    function serverViolationRuns(path) {
        var times = [];
        for (var i = 0; i < (path || []).length; i++) {
            if (path[i][3] === 3) times.push(path[i][2] || 0);
        }
        return countEpisodes(times);
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

    function pathKm(pts) {
        if (!pts || pts.length < 2) return 0;
        var km = 0;
        for (var i = 1; i < pts.length; i++) {
            var d = getDistanceFromLatLonInMeter(pts[i - 1].lat, pts[i - 1].lon, pts[i].lat, pts[i].lon) / 1000;
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

    function updateRowDistances(rows, pts, dataOnly) {
        var box = dataOnly ? null : document.getElementById('trip_list_ul');
        if (!box && !dataOnly) return;
        for (var j = 0; j < rows.length; j++) {
            var row = rows[j];
            if (row._server) continue;   // distance came with the download
            var live = String(row.trip_status) === '0';
            // The native engine's distance (every trusted fix) when the trip
            // has one; otherwise the stored track points, 300 m apart.
            var engineM = parseFloat(row.engine_m);
            var km = (!isNaN(engineM) && engineM > 0) ? engineM / 1000
                : tripPathKm(pts, row.min_milli, row.max_milli, live);
            row._km = km;
            if (dataOnly) continue;
            var title = rowTitle(row, live, km);
            var $item = $(box).find('.trip-list-item[data-idx="' + j + '"]');
            if ($item.length) {
                $item.find('.item-title').text(title);
            }
        }
    }

    function setText(id, text) {
        var el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    function setEventStat(id, count) {
        var el = document.getElementById(id);
        if (!el) return;
        var c = el.querySelector('.trip-event-count');
        if (c) c.textContent = (count == null) ? '…' : String(count);
        if (count > 0) el.classList.add('has-events');
        else el.classList.remove('has-events');
    }

    // One trip's violation counts, exactly as its own card shows them. Harsh
    // acceleration and braking are no longer tracked.
    // Over-speeding counts the engine's recorded events: a short burst below
    // the configured duration leaves red map points but is not a violation.
    // A downloaded trip may lack its events, so its map points count too.
    function rowViolations(row) {
        var ev = bucketEvents(row._events || {});
        return {
            speed: row._server ? Math.max(ev.speed, row._speedRuns || 0) : ev.speed,
            call: ev.call
        };
    }

    // Hand each engine event to the trip it belongs to: by trip id when the
    // event carries one, otherwise by falling inside the trip's time window.
    function assignEvents(rows, eventRows) {
        var local = [];
        for (var i = 0; i < rows.length; i++) {
            if (!rows[i]._server) { rows[i]._events = {}; local.push(rows[i]); }
        }
        for (var e = 0; e < (eventRows || []).length; e++) {
            var evt = eventRows[e];
            var at = parseInt(evt.Event_strt, 10);
            var tid = (evt.tid == null) ? '' : String(evt.tid).trim();
            var owner = null;
            for (var k = 0; k < local.length && !owner; k++) {
                if (tid && tid !== '0' && tid.toLowerCase() !== 'null' && String(local[k].tid) === tid) owner = local[k];
            }
            for (var m = 0; m < local.length && !owner; m++) {
                var min = parseInt(local[m].min_milli, 10);
                var max = String(local[m].trip_status) === '0' ? Date.now() : parseInt(local[m].max_milli, 10);
                if (!isNaN(at) && !isNaN(min) && at >= min && (isNaN(max) || at <= max)) owner = local[m];
            }
            if (!owner) continue;   // logged outside any listed trip
            owner._events[evt.Event_type] = (owner._events[evt.Event_type] || 0) + 1;
        }
        for (var d = 0; d < local.length; d++) local[d]._eventsLoaded = true;
    }

    function totalsFor(rows) {
        var t = { trips: rows.length, km: 0, speed: 0, call: 0, live: false, liveMs: 0 };
        for (var i = 0; i < rows.length; i++) {
            t.km += rows[i]._km || 0;
            var v = rowViolations(rows[i]);
            t.speed += v.speed; t.call += v.call;
            if (String(rows[i].trip_status) === '0') { t.live = true; t.liveMs = tripDurationMs(rows[i], true); }
        }
        t.violations = t.speed + t.call;
        return t;
    }

    // The same roll-up the Trips summary card shows, for another screen (the
    // Home card). Reads only; does not open or repaint the Trips list, and does
    // not trigger the history download.
    function summary(kind, onDone) {
        var b = boundsFor(kind === 'week' || kind === 'quarter' ? kind : 'month');
        if (typeof HomeDashboardData === 'undefined' || !HomeDashboardData.getTripList) { onDone(null); return; }
        HomeDashboardData.getTripList(b.start, b.end, function (localRows) {
            var rows = mergeServerRows(localRows, b);
            var timeMs = 0;
            for (var i = 0; i < rows.length; i++) timeMs += tripDurationMs(rows[i], String(rows[i].trip_status) === '0');
            HomeDashboardData.getTripPath(b.start, b.end, function (pathRows) {
                updateRowDistances(rows, parsePts(pathRows), true);
                HomeDashboardData.getEventsInRange(b.start, Date.now(), function (eventRows) {
                    assignEvents(rows, eventRows);
                    var t = totalsFor(rows);
                    t.timeMs = timeMs;
                    t.kmText = formatKm(t.km);
                    t.timeText = rows.length ? formatTotalDuration(timeMs) : '0m';
                    t.liveText = t.live ? formatTotalDuration(t.liveMs) : '';
                    onDone(t);
                });
            });
        });
    }

    // The summary card is the sum (or per-trip average) of the cards below it,
    // so it can never disagree with them.
    // The card's head: for the list, "All trips" and how many; for a picked
    // trip, its ID and state on the left and its start and end on the right.
    // Tapping the picked trip again goes back to the list's summary.
    function setCardHead(title, state, when, forTrip) {
        setText('trip_stat_title', title);
        setText('trip_stat_state', state);
        setText('trip_stat_when', when);
        var card = document.getElementById('trip_main_card');
        if (card) card.classList[forTrip ? 'add' : 'remove']('is-trip');
    }

    // The picked trip in the main card: only what the trip record holds.
    function paintTrip(row) {
        var live = String(row.trip_status) === '0';
        var v = rowViolations(row);
        var id = rowTripId(row);
        var from = formatWhen(row.min_milli) || '—';
        var to = live ? 'In progress' : (formatWhen(row.max_milli) || '—');
        setCardHead(id || rowTitle(row, live, row._km), rowStatus(row, live), from + ' – ' + to, true);
        // Distance and events arrive after the list is drawn.
        var known = summaryReady;
        setStats(known || row._km != null ? formatKm(row._km || 0) : '…', formatDuration(row.min_milli, row.max_milli, live) || '—',
            known ? String(v.speed + v.call) : '…');
        setEventStat('trip_stat_ev_speed', v.speed);
        setEventStat('trip_stat_ev_call', v.call);
        paintMotion(row, live);
    }

    // How the picked trip's time split between driving, idle, on site, walking,
    // stopped and no signal (native motion_segments), plus how much of its
    // distance came from weak GPS.
    var MOTION_STATES = [
        { key: 'driving', label: 'Driving' },
        { key: 'idle', label: 'Idle' },
        { key: 'on_site', label: 'On site' },
        { key: 'walking', label: 'Walking' },
        { key: 'stopped', label: 'Stopped' },
        { key: 'no_signal', label: 'No signal' }
    ];
    var motionSeq = 0;

    function hideMotion() {
        var box = document.getElementById('trip_stat_motion');
        if (box) box.hidden = true;
    }

    function paintMotion(row, live) {
        var box = document.getElementById('trip_stat_motion');
        if (!box || row._server || typeof HomeDashboardData === 'undefined' || !HomeDashboardData.getMotionSegments) {
            hideMotion();
            return;
        }
        var min = parseInt(row.min_milli, 10);
        var max = live ? Date.now() : parseInt(row.max_milli, 10);
        if (isNaN(min) || isNaN(max) || max <= min) { hideMotion(); return; }
        var seq = ++motionSeq;
        HomeDashboardData.getMotionSegments(min, max, function (segs) {
            if (seq !== motionSeq) return;
            var ms = {}, total = 0;
            for (var i = 0; i < segs.length; i++) {
                var a = Math.max(min, parseInt(segs[i].start_ms, 10) || 0);
                var b = Math.min(max, parseInt(segs[i].end_ms, 10) || 0);
                if (b <= a) continue;
                ms[segs[i].state] = (ms[segs[i].state] || 0) + (b - a);
                total += b - a;
            }
            if (!total) { hideMotion(); return; }
            var bar = '', legend = '';
            for (var k = 0; k < MOTION_STATES.length; k++) {
                var st = MOTION_STATES[k], t = ms[st.key] || 0;
                if (!t) continue;
                bar += '<span class="tm-seg tm-' + st.key + '" style="width:' + (t / total * 100).toFixed(2) + '%"></span>';
                legend += '<span class="tm-item"><i class="tm-dot tm-' + st.key + '"></i>' + st.label
                    + ' <b>' + formatTotalDuration(t) + '</b></span>';
            }
            document.getElementById('trip_motion_bar').innerHTML = bar;
            document.getElementById('trip_motion_legend').innerHTML = legend;
            var note = document.getElementById('trip_motion_note');
            note.textContent = '';
            box.hidden = false;
            if (HomeDashboardData.getTripEngine) {
                HomeDashboardData.getTripEngine(row.tid, function (eng) {
                    if (seq !== motionSeq || !eng) return;
                    var weak = parseFloat(eng.degraded_m);
                    if (!isNaN(weak) && weak >= 50) {
                        note.textContent = formatKm(weak / 1000) + ' of this trip was measured on weak GPS (forest, valleys).';
                    }
                });
            }
        });
    }

    // What the list is showing, which of its trips is picked (-1: none), and
    // the list's total time once known.
    var shownRows = [];
    var pickedIdx = -1;
    var shownTimeMs = 0;
    var summaryReady = false;

    // Paints the main card for the current state: the picked trip, or the
    // summary of the list.
    function paintCard() {
        if (pickedIdx >= 0 && shownRows[pickedIdx]) { paintTrip(shownRows[pickedIdx]); return; }
        setCardHead('All trips', shownRows.length + (shownRows.length === 1 ? ' trip' : ' trips'), '', false);
        hideMotion();
        if (summaryReady) paintSummary(shownRows, shownTimeMs);
        else paintSummaryLoading(shownRows, shownTimeMs);
    }

    function pick(idx) {
        pickedIdx = (idx === pickedIdx) ? -1 : idx;
        $('#trip_list_ul .trip-li').removeClass('is-picked').find('.trip-list-item').attr('aria-pressed', 'false');
        if (pickedIdx >= 0) {
            $('#trip_list_ul .trip-li[data-idx="' + pickedIdx + '"]').addClass('is-picked')
                .find('.trip-list-item').attr('aria-pressed', 'true');
        }
        paintCard();
        // The card is at the top of the page; bring it into view for a trip
        // picked from further down the list.
        var page = document.getElementById('div_trip_list');
        if (pickedIdx >= 0 && page && page.scrollTop > 0) {
            try { page.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { page.scrollTop = 0; }
        }
    }

    function paintSummaryLoading(rows, timeMs) {
        setStats('…', rows.length ? formatTotalDuration(timeMs) : '0m', '…');
        setEventStat('trip_stat_ev_speed', null);
        setEventStat('trip_stat_ev_call', null);
    }

    function paintSummary(rows, timeMs) {
        var n = rows.length;
        var tot = totalsFor(rows);
        var km = tot.km, speed = tot.speed, call = tot.call;
        var violations = tot.violations;
        setStats(formatKm(km), n ? formatTotalDuration(timeMs) : '0m', String(violations));
        setEventStat('trip_stat_ev_speed', speed);
        setEventStat('trip_stat_ev_call', call);
    }

    function refreshListStats(rows) {
        rows = rows || [];
        var timeMs = 0;
        for (var i = 0; i < rows.length; i++) {
            timeMs += tripDurationMs(rows[i], String(rows[i].trip_status) === '0');
        }
        shownRows = rows;
        shownTimeMs = timeMs;
        summaryReady = false;
        paintCard();

        var seq = loadSeq;
        var b = boundsFor(range);
        function withEvents() {
            if (typeof HomeDashboardData === 'undefined' || !HomeDashboardData.getEventsInRange) {
                summaryReady = true;
                paintCard();
                return;
            }
            HomeDashboardData.getEventsInRange(b.start, Date.now(), function (eventRows) {
                if (seq !== loadSeq) return;
                assignEvents(rows, eventRows);
                summaryReady = true;
                paintCard();
            });
        }
        if (typeof HomeDashboardData === 'undefined' || !HomeDashboardData.getTripPath) {
            withEvents();
            return;
        }
        HomeDashboardData.getTripPath(b.start, b.end, function (pathRows) {
            if (seq !== loadSeq) return;
            // Sets each phone-recorded trip's own distance and overspeed runs.
            updateRowDistances(rows, parsePts(pathRows));
            paintGroupTotals(rows);
            withEvents();
        });
    }

    // Trips are grouped by workday, each split into Day (6 AM–6 PM) and Night
    // (6 PM–6 AM the next morning), by when the trip started. A trip at 2 AM
    // belongs to the previous day's night.
    var DAY_START_H = 6;
    var NIGHT_START_H = 18;
    var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    function shiftOf(ms) {
        var n = parseInt(ms, 10);
        if (isNaN(n) || n <= 0) return { day: '', part: 'day' };
        var d = new Date(n);
        var h = d.getHours();
        if (h < DAY_START_H) {
            d = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
            return { day: ymd(d), part: 'night' };
        }
        return { day: ymd(d), part: h < NIGHT_START_H ? 'day' : 'night' };
    }

    // The workday a moment belongs to, as yyyy-mm-dd.
    function workdayOf(ms) {
        return shiftOf(ms).day;
    }

    function dayLabel(key) {
        var p = String(key).split('-');
        if (p.length !== 3) return '';
        var d = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
        var date = WEEKDAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()];
        var t = workdayOf(Date.now()).split('-');
        if (key === t.join('-')) return 'Today · ' + date;
        if (key === ymd(new Date(+t[0], +t[1] - 1, +t[2] - 1))) return 'Yesterday · ' + date;
        return date;
    }

    function groupKm(rows, key, part) {
        var km = 0, n = 0;
        for (var i = 0; i < rows.length; i++) {
            var s = shiftOf(rows[i].min_milli);
            if (s.day !== key || (part && s.part !== part)) continue;
            km += rows[i]._km || 0;
            n++;
        }
        return { km: km, n: n };
    }

    function tripsText(n) {
        return n + (n === 1 ? ' trip' : ' trips');
    }

    // Day and shift totals, once each trip's distance is known.
    function paintGroupTotals(rows) {
        var box = document.getElementById('trip_list_ul');
        if (!box) return;
        $(box).find('.trip-day-km').each(function () {
            var t = groupKm(rows, $(this).attr('data-day'), null);
            $(this).text(formatKm(t.km));
        });
        $(box).find('.trip-shift-km').each(function () {
            var t = groupKm(rows, $(this).attr('data-day'), $(this).attr('data-part'));
            $(this).text(tripsText(t.n) + ' · ' + formatKm(t.km));
        });
    }

    // Keeps a long merged path small enough for the map: every violation
    // point, each trip's first and last point, and an even sample of the rest.
    var MAX_ROUTE_POINTS = 3000;
    function thinRoute(path) {
        if (path.length <= MAX_ROUTE_POINTS) return path;
        var step = Math.ceil(path.length / MAX_ROUTE_POINTS);
        var out = [];
        for (var i = 0; i < path.length; i++) {
            var keep = i % step === 0 || i === path.length - 1 || path[i][3] === 3 || path[i][4]
                || (i + 1 < path.length && path[i + 1][4]);
            if (keep) out.push(path[i]);
        }
        return out;
    }

    // All trips of one workday on the map as one route, in time order. The
    // join from one trip's end to the next trip's start is drawn dashed: it
    // was not recorded, so it is not shown as driven road.
    function openDayRoute(rows, key) {
        var trips = [];
        for (var i = 0; i < rows.length; i++) {
            if (shiftOf(rows[i].min_milli).day === key) trips.push(rows[i]);
        }
        if (!trips.length) return;
        trips.sort(function (a, b) { return (parseInt(a.min_milli, 10) || 0) - (parseInt(b.min_milli, 10) || 0); });
        var minMs = parseInt(trips[0].min_milli, 10);
        var maxMs = 0, km = 0;
        for (var t = 0; t < trips.length; t++) {
            var live = String(trips[t].trip_status) === '0';
            var end = live ? Date.now() : parseInt(trips[t].max_milli, 10);
            if (!isNaN(end) && end > maxMs) maxMs = end;
            km += trips[t]._km || 0;
        }
        var title = (key === workdayOf(Date.now()) ? "Today's route" : dayLabel(key) + ' route')
            + ' · ' + tripsText(trips.length) + ' · ' + formatKm(km);

        function build(localPts) {
            var path = [];
            for (var k = 0; k < trips.length; k++) {
                var tr = trips[k];
                var pts;
                if (tr._server) {
                    pts = tr._path || [];
                } else {
                    var sub = tripPts(localPts, tr.min_milli, tr.max_milli, String(tr.trip_status) === '0');
                    pts = [];
                    for (var j = 0; j < sub.length; j++) pts.push([sub[j].lat, sub[j].lon, sub[j].ms, sub[j].violation ? 3 : 2]);
                }
                for (var q = 0; q < pts.length; q++) {
                    var join = q === 0 && path.length > 0;
                    path.push([pts[q][0], pts[q][1], pts[q][2], pts[q][3], join ? 1 : 0]);
                }
            }
            if (!path.length) {
                alert('No route was recorded for this day.');
                return;
            }
            if (typeof TripSiteMap !== 'undefined' && TripSiteMap.openRoute) {
                TripSiteMap.openRoute(minMs, maxMs, title, thinRoute(path));
            }
        }
        if (typeof HomeDashboardData !== 'undefined' && HomeDashboardData.getTripPath) {
            HomeDashboardData.getTripPath(minMs, maxMs || Date.now(), function (pathRows) { build(parsePts(pathRows)); });
        } else {
            build([]);
        }
    }

    function dayHeadHtml(key, isToday) {
        return '<li class="trip-day-head">'
            + '<div class="trip-day-title">' + esc(dayLabel(key)) + '</div>'
            + '<span class="trip-day-km" data-day="' + esc(key) + '">…</span>'
            + '<a href="#" class="trip-day-route" data-day="' + esc(key) + '" aria-label="'
            + (isToday ? "Open today's route" : 'Open this day\'s route') + '">'
            + '<i class="fa-solid fa-route" aria-hidden="true"></i>'
            + (isToday ? "Today's route" : 'Route') + '</a>'
            + '</li>';
    }

    function shiftHeadHtml(key, part) {
        var night = part === 'night';
        return '<li class="trip-shift-head' + (night ? ' is-night' : '') + '">'
            + '<i class="fa-solid ' + (night ? 'fa-moon' : 'fa-sun') + '" aria-hidden="true"></i>'
            + '<span class="trip-shift-name">' + (night ? 'Night · 6 PM–6 AM' : 'Day · 6 AM–6 PM') + '</span>'
            + '<span class="trip-shift-km" data-day="' + esc(key) + '" data-part="' + part + '">…</span>'
            + '</li>';
    }

    function renderRows(rows) {
        var box = document.getElementById('trip_list_ul');
        if (!box) return;
        rows = rows || [];
        // Newest first, so each day reads Night then Day, as the hours ran.
        rows.sort(function (x, y) {
            return (parseInt(y.min_milli, 10) || 0) - (parseInt(x.min_milli, 10) || 0);
        });
        pickedIdx = -1;
        setCount(rows.length);
        refreshListStats(rows);
        if (!rows.length) {
            box.innerHTML = '<li class="trip-list-empty-li"><div class="trip-list-empty">No trips in this range.</div></li>';
            return;
        }

        var html = '';
        var lastDay = null, lastPart = null;
        var todayKey = workdayOf(Date.now());
        for (var j = 0; j < rows.length; j++) {
            var row = rows[j];
            var shift = shiftOf(row.min_milli);
            if (shift.day !== lastDay) {
                html += dayHeadHtml(shift.day, shift.day === todayKey);
                lastDay = shift.day;
                lastPart = null;
            }
            if (shift.part !== lastPart) {
                html += shiftHeadHtml(shift.day, shift.part);
                lastPart = shift.part;
            }
            var live = String(row.trip_status) === '0';
            var title = rowTitle(row, live, row._km);
            var sub = rowSubtitle(row, live);
            var status = rowStatus(row, live);
            var tripId = rowTripId(row);
            // Tapping the row shows the trip in the main card; the icon on the
            // right opens the map.
            html += '<li class="trip-li" data-idx="' + j + '">'
                + '<div class="trip-row">'
                + '<a href="#" class="item-content trip-list-item" data-idx="' + j + '" aria-pressed="false">'
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
                + '</li>';
        }
        box.innerHTML = html;
        paintGroupTotals(rows);
        $(box).find('.trip-day-route').off('click.tripDay').on('click.tripDay', function (ev) {
            ev.preventDefault();
            openDayRoute(rows, $(this).attr('data-day'));
            return false;
        });
        $(box).find('.trip-list-item').off('click.tripList').on('click.tripList', function (ev) {
            ev.preventDefault();
            var idx = parseInt($(this).attr('data-idx'), 10);
            if (rows[idx]) pick(idx);
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

    // Engine / server event names -> the buckets shown on the main card.
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
        // Home's trip summary follows whatever changed while Trips was open.
        try { if (typeof (options.hero || w.HomeHero) !== 'undefined') (options.hero || w.HomeHero).refresh(); } catch (e) { }
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
        if (options.scope) bindOnce(); else $(document).ready(bindOnce);
    } catch (e) { }


        var api = { open: open, close: close, isOpen: isOpen, summary: summary };
        if (options.scope) Object.keys(api).forEach(function (key) { if (typeof api[key] === 'function') api[key] = (options.scope.own || options.scope.guard)(api[key]); });

        if (options.scope) options.scope.defer(function () { $(document).off('.tripFilter .tripCustom'); });
        return api;
    }
    w.AppTripListSheetController = { create: create };
    if (!w.document.documentElement.hasAttribute || !w.document.documentElement.hasAttribute('data-app-shell')) w.TripListSheet = create();
})(window);
