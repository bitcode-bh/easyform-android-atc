// Trip history from the server (GetTripData), for the Trips list.
//
// The list is normally built from this phone's own lat_plug / track_master
// rows, so a freshly installed app shows nothing even though the user has
// trips on the server. The first time Trips is opened after an install or a
// login, this module downloads the logged-in user's trips for last month plus
// the month to date, once, and keeps only that window.
//
// Read-only: nothing here writes to lat_plug, track_master or any other engine
// table. The download lives in localStorage and is merged into the list in
// trip_list.js, where a trip recorded on this phone always wins over its
// server copy.

var TripServerHistory = (function () {
    'use strict';

    var STORE_KEY = 'trip_server_history';
    var API_NAME = 'GetTripData';
    // Intent extras cannot carry an unbounded path; the server sends a handful
    // of points per trip, this only guards against a pathological row.
    var MAX_POINTS_PER_TRIP = 1500;

    var inFlight = false;
    var waiting = [];

    function pad(n) { return n < 10 ? '0' + n : String(n); }

    function readJson(store, key) {
        try { return JSON.parse(store.getItem(key)); } catch (e) { return null; }
    }

    function userId() {
        var id = null;
        try { id = JSON.parse(storage.getItem('user_id')); } catch (e) { id = null; }
        return (id == null || id === '') ? '' : String(id);
    }

    // The trip flow is the attendance (punch-in) flow. Its ids arrive with the
    // login response and are kept in AttendanceJson, so they are available on a
    // fresh install before any trip exists on the phone.
    function tripFlow() {
        var att = readJson(localStorage, 'AttendanceJson');
        var row = (att && att.length) ? att[0] : null;
        if (!row) return null;
        var checksheetId = row.Checksheet_id;
        if (checksheetId == null || String(checksheetId).trim() === '' || String(checksheetId) === '0') return null;
        return {
            flowId: row.flow_id == null ? '' : String(row.flow_id),
            checksheetId: String(checksheetId)
        };
    }

    // GetTripData is served by the web API that sits beside the app's own:
    // .../coreapi/api/  ->  .../coreapi_web/api/
    function apiUrl() {
        var base = '';
        try { base = String(JSON.parse(storage.getItem('global_wcf_url')) || ''); } catch (e) { base = ''; }
        if (!base && typeof global_wcf_url !== 'undefined') base = String(global_wcf_url || '');
        var m = /^(https?:\/\/[^\/]+)\//i.exec(base);
        if (!m) return '';
        return m[1] + '/coreapi_web/api/' + API_NAME;
    }

    // First day of last month 00:00 -> now.
    function windowBounds() {
        var now = new Date();
        var start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
        return { start: start.getTime(), end: now.getTime() };
    }

    function apiDate(ms, endOfDay) {
        var d = new Date(ms);
        return d.getFullYear() + '/' + pad(d.getMonth() + 1) + '/' + pad(d.getDate()) + (endOfDay ? ' 23:59' : ' 00:00');
    }

    // Same filter objects the web portal's trip page sends (EF_Common_Adv_Filter).
    function filterObj(systemVar, equation, values, ctrlType, calendarType) {
        return {
            columnName: systemVar,
            id: '',
            queId: 0,
            value: values,
            Equation: equation,
            calendar_type: calendarType || '',
            system_var: systemVar,
            checksheetID: 0,
            checksheet_type: '0',
            qid: 0,
            ctrl_type: ctrlType
        };
    }

    function requestBody(flow, uid, bounds) {
        return [{
            flow_id: flow.flowId,
            checksheetId: flow.checksheetId,
            // 0 = Trip Started, 2 = Trip Completed
            task_status: ['0,2'],
            offset: 0,
            fetch: 500,
            searchParticularColumn: [
                // Without this the API returns every user's trips.
                filterObj('user_id', 'IN', [uid], 0, ''),
                filterObj('CreateDTTM', 'BETWEEN', [apiDate(bounds.start, false), apiDate(bounds.end, true)], 8, 'is_between')
            ],
            order_by: [{
                checksheet_type: 0, checksheet_id: 0, que_id: 0, data_type: 'ValueString',
                order_by: 'task_id', order_type: 'desc', column_name: 'task_id'
            }]
        }];
    }

    function parsePath(raw) {
        var arr = raw;
        if (typeof arr === 'string') {
            try { arr = JSON.parse(arr); } catch (e) { arr = []; }
        }
        if (!arr || !arr.length) return [];
        var pts = [];
        for (var i = 0; i < arr.length; i++) {
            var lat = parseFloat(arr[i].lat);
            var lon = parseFloat(arr[i].lng != null ? arr[i].lng : arr[i].lon);
            if (isNaN(lat) || isNaN(lon)) continue;
            if (lat === 0 && lon === 0) continue;
            var ms = parseInt(arr[i].date, 10);
            if (isNaN(ms)) ms = 0;
            pts.push([lat, lon, ms, String(arr[i].tripflag) === '3' ? 3 : 2]);
        }
        pts.sort(function (a, b) { return a[2] - b[2]; });
        if (pts.length > MAX_POINTS_PER_TRIP) {
            // Keep the ends and thin the middle evenly.
            var step = pts.length / MAX_POINTS_PER_TRIP;
            var thin = [];
            for (var k = 0; k < MAX_POINTS_PER_TRIP - 1; k++) thin.push(pts[Math.floor(k * step)]);
            thin.push(pts[pts.length - 1]);
            pts = thin;
        }
        return pts;
    }

    // "2026-10-12T14:53:12.617" has no zone; it is server-local wall time, the
    // same clock the app's own timestamps use.
    function parseServerStamp(s) {
        var m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/.exec(String(s || ''));
        if (!m) return 0;
        return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0), 0).getTime();
    }

    // One API row -> the compact record that is stored.
    function slimRow(row) {
        var taskId = row.task_id == null ? '' : String(row.task_id);
        if (!taskId) return null;
        var path = parsePath(row.actual_path);
        var durMs = parseInt(row.TotalTripTime, 10);
        if (isNaN(durMs) || durMs < 0) durMs = 0;

        var startMs = 0, endMs = 0;
        for (var i = 0; i < path.length; i++) {
            if (path[i][2] > 0) {
                if (!startMs || path[i][2] < startMs) startMs = path[i][2];
                if (path[i][2] > endMs) endMs = path[i][2];
            }
        }
        // The row is written when the trip ends, so its stamp is the end time.
        var created = parseServerStamp(row.CREATEDTTM);
        if (!startMs && created) startMs = created - durMs;
        if (!startMs) return null;
        if (durMs > 0) endMs = startMs + durMs;
        if (!endMs || endMs < startMs) endMs = created > startMs ? created : startMs;

        var meters = parseFloat(row.actual_distance);
        if (isNaN(meters) || meters < 0) meters = 0;

        return {
            id: taskId,
            start: startMs,
            end: endMs,
            status: row.Status == null ? '' : String(row.Status),
            m: meters,
            path: path
        };
    }

    function readStore() {
        var s = readJson(localStorage, STORE_KEY);
        if (!s || typeof s !== 'object' || !s.at || !s.rows) return null;
        return s;
    }

    // Present for this user, i.e. the one-time download has already happened.
    function hasDownload() {
        var s = readStore();
        return !!(s && s.at && String(s.uid) === userId());
    }

    function prune(rows, bounds) {
        var out = [];
        for (var i = 0; i < rows.length; i++) {
            if (rows[i] && rows[i].start >= bounds.start) out.push(rows[i]);
        }
        return out;
    }

    function save(rows) {
        try {
            localStorage.setItem(STORE_KEY, JSON.stringify({ uid: userId(), at: Date.now(), rows: rows }));
        } catch (e) {
            // Quota or serialisation failure: the list simply stays local-only.
        }
    }

    // Stored trips inside [startMs, endMs], newest first. Trims the store to
    // the keep-window as a side effect so it never grows past last month + MTD.
    function getRows(startMs, endMs) {
        var s = readStore();
        if (!s || String(s.uid) !== userId()) return [];
        var bounds = windowBounds();
        var kept = prune(s.rows || [], bounds);
        if (kept.length !== (s.rows || []).length) {
            try { localStorage.setItem(STORE_KEY, JSON.stringify({ uid: s.uid, at: s.at, rows: kept })); } catch (e) { }
        }
        var out = [];
        for (var i = 0; i < kept.length; i++) {
            if (kept[i].start >= startMs && kept[i].start <= endMs) out.push(kept[i]);
        }
        out.sort(function (a, b) { return b.start - a.start; });
        return out;
    }

    function finish(ok) {
        inFlight = false;
        var cbs = waiting;
        waiting = [];
        for (var i = 0; i < cbs.length; i++) {
            try { cbs[i](ok); } catch (e) { }
        }
    }

    // Downloads once per install/login. onDone(true) when a download is on
    // the phone (now or already), onDone(false) when it could not be fetched;
    // a failure leaves no marker, so the next Trips open tries again.
    function ensureDownloaded(onDone) {
        onDone = onDone || function () { };
        if (hasDownload()) { onDone(true); return; }
        waiting.push(onDone);
        if (inFlight) return;

        var flow = tripFlow();
        var uid = userId();
        var url = apiUrl();
        if (!flow || !uid || !url || typeof Webservicecall_REST === 'undefined') { finish(false); return; }

        inFlight = true;
        var bounds = windowBounds();
        var settled = false;
        function done(ok) { if (settled) return; settled = true; finish(ok); }

        try {
            var call = new Webservicecall_REST(url, JSON.stringify(requestBody(flow, uid, bounds)), function (e) {
                try {
                    var res = JSON.parse(e.responseText);
                    var status = res && res[0] ? res[0].status : 0;
                    if (status == 2) { save([]); done(true); return; }   // no trips in the window
                    if (status != 1) { done(false); return; }
                    var data = res[0].data;
                    if (typeof data === 'string') data = data ? JSON.parse(data) : [];
                    var rows = [];
                    for (var i = 0; i < (data || []).length; i++) {
                        // Belt and braces: never keep another user's trip even if
                        // the server-side filter were ever dropped.
                        if (data[i].CREATEDBY != null && String(data[i].CREATEDBY) !== uid) continue;
                        var slim = slimRow(data[i]);
                        if (slim) rows.push(slim);
                    }
                    save(prune(rows, bounds));
                    done(true);
                } catch (err) {
                    done(false);
                }
            }, function () { done(false); });
            call.callOtherDomain();
        } catch (ex) {
            done(false);
        }
        // Webservicecall_REST has its own long timeout; do not hold the list for it.
        setTimeout(function () { done(false); }, 30000);
    }

    return {
        ensureDownloaded: ensureDownloaded,
        hasDownload: hasDownload,
        getRows: getRows,
        // exposed for tests
        _slimRow: slimRow,
        _requestBody: requestBody,
        _windowBounds: windowBounds
    };
})();
