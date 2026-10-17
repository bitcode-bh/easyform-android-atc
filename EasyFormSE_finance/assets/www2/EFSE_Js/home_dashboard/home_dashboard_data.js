// Home Operations Dashboard — read-only data adapters.
// See docs/PRD-Home-Operations-Dashboard.md §10.1.
//
// Every method here issues its own independent query/API call. None of them
// call into get_counter_for_online_flow_profile() (mutates the shared global
// profile_flow_Array, pops the app-wide loading() spinner) or pending_status.js's
// functions (hard-coupled to pending_status.html-only DOM ids; one failure
// path there is an unbounded re-poll loop). Calling either from a background
// Home refresh would visually hijack the screen or, worse, loop silently.

var HomeDashboardData = (function () {
    'use strict';

    function sql(query, onSuccess, onFail) {
        var q_jsonobj = [{ data: query, p: '1' }];
        cordova.exec(onSuccess, onFail || function () { }, 'SqlitePlugin', 'showValues', q_jsonobj);
    }

    // One WCF_OnlineTaskList_Native_Count row -> its count. cont_[] is the
    // per-tab breakdown and is what selection.js trusts; task_count is only
    // consulted when the server sent no cont_ at all. -1 is the server's
    // "count query failed" sentinel (selection.js renders it as "E") and must
    // not be added into a total as a negative number.
    function countForRow(row) {
        var cont_ = row.cont_;
        if (cont_ && cont_.length !== undefined) {
            var sum = 0;
            for (var j = 0; j < cont_.length; j++) {
                var tab = parseInt(cont_[j], 10);
                if (!isNaN(tab) && tab > 0) {
                    sum += tab;
                }
            }
            return sum;
        }
        var fallback = parseInt(row.task_count, 10);
        return (!isNaN(fallback) && fallback > 0) ? fallback : 0;
    }

    // WCF_OnlineTaskList_Native_Count is a generic executor: per flow, the
    // server runs a count query configured for that flow and substitutes the
    // system_var placeholders into it. A caller that omits system_var gets
    // whatever an unresolved <'#user_id#'> evaluates to — which is why this
    // now mirrors get_counter_for_online_flow() (selection.js), the caller
    // that populates the module badges and is known to work, rather than
    // get_counter_for_online_flow_profile() (common-functions.js), which
    // sends role_id alone and no placeholders.
    //
    // Same reasoning for the count field: selection.js deliberately ignores
    // the row's own task_count and sums cont_[] (the per-tab counts). We do
    // the same, falling back to task_count only when cont_ is absent.
    //
    // Unlike either of those, the response is only summed here — never merged
    // into the shared global profile_flow_Array, never triggers
    // draw_my_task_chart(), no app-wide loading() spinner.
    // Offline fallback: common-functions.js's own aggregate query.
    function getTaskCounts(onDone) {
        var company_id, user_id, role_id;
        try {
            company_id = JSON.parse(storage.getItem('company_id'));
            user_id = JSON.parse(storage.getItem('user_id'));
            role_id = JSON.parse(storage.getItem('role_id'));
        } catch (e) {
            onDone({ total: 0, byFlow: [], online: false });
            return;
        }

        function offline() {
            var username = null;
            try {
                username = JSON.parse(storage.getItem('username'));
            } catch (e) {
                username = null;
            }
            if (!username) {
                onDone({ total: 0, byFlow: [], online: false });
                return;
            }
            sql(
                "select count(*) as cnt, tower_type as udf_id, moduleid, module_name from task_master where username = '"
                    + username + "' group by udf_id",
                function (e) {
                    var rows = [];
                    try { rows = JSON.parse(e) || []; } catch (err) { rows = []; }
                    var total = 0;
                    var byFlow = [];
                    for (var i = 0; i < rows.length; i++) {
                        var cnt = parseInt(rows[i].cnt, 10) || 0;
                        total += cnt;
                        byFlow.push({ flow_name: rows[i].module_name, udf_id: rows[i].udf_id, task_count: cnt });
                    }
                    onDone({ total: total, byFlow: byFlow, online: false });
                },
                function () { onDone({ total: 0, byFlow: [], online: false }); }
            );
        }

        if (!company_id || !user_id) {
            offline();
            return;
        }

        // Placeholder keys and spelling are the server's contract — copied
        // verbatim from get_counter_for_online_flow() (selection.js). A missing
        // key here silently breaks any flow whose count query references it.
        // Kept to storage reads only: no MkLocation GPS fix, so user_lat/long
        // stay 0 (only distance-scoped count queries would need them, and no
        // dashboard card uses one).
        var sys_var_Array = [];
        function pushSysVar(key, storageKey) {
            var value = '';
            try {
                var raw = storage.getItem(storageKey);
                if (raw !== null && raw !== undefined && raw !== '') {
                    value = JSON.parse(raw);
                }
            } catch (e) {
                value = '';
            }
            sys_var_Array.push({ "key": key, "value": value });
        }
        pushSysVar("<'#company_id#'>", 'company_id');
        pushSysVar("<'#user_id#'>", 'user_id');
        pushSysVar("<'#user_name#'>", 'user_name');
        pushSysVar("<'#role_id#'>", 'role_id');
        pushSysVar("<'#role_name#'>", 'role_name');
        pushSysVar("<'#circle_id#'>", 'circle_id');
        pushSysVar("<'#circle_name#'>", 'circle_name');

        var param_obj = [{
            company_id: company_id,
            user_id: user_id,
            user_lat: 0,
            user_long: 0,
            role_id: role_id,
            'system_var': sys_var_Array
        }];

        try {
            var getdata = new Webservicecall_REST(
                global_wcf_url + 'WCF_OnlineTaskList_Native_Count',
                JSON.stringify(param_obj),
                function (e) {
                    try {
                        var myArray = JSON.parse(e.responseText);
                        if (myArray[0].status != 1) {
                            offline();
                            return;
                        }
                        // The payload arrives in `data`, except when it
                        // arrives in `message` instead — selection.js handles
                        // both and so must we, or a message-carried response
                        // reads as zero flows and drops us to the offline
                        // count for no reason.
                        var payload = myArray[0].data;
                        if (payload === '' || payload === null || payload === undefined) {
                            payload = myArray[0].message;
                        }
                        var message = [];
                        if (payload !== '' && payload !== null && payload !== undefined) {
                            message = JSON.parse(payload) || [];
                        }
                        var total = 0;
                        var byFlow = [];
                        for (var i = 0; i < message.length; i++) {
                            var task_count = countForRow(message[i]);
                            total += task_count;
                            byFlow.push({ flow_id: message[i].flow_id, udf_id: message[i].udf_id, task_count: task_count });
                        }
                        onDone({ total: total, byFlow: byFlow, online: true });
                    } catch (err) {
                        offline();
                    }
                },
                offline
            );
            getdata.callOtherDomain();
        } catch (e) {
            offline();
        }
    }

    // trip_status ('0' = active) mirrors get_today_attendance_for_notification()'s
    // own check (selection.js). Duration source confirmed via native
    // TrackPathReader.java's own query pattern (select tid,min_milli from
    // lat_plug where trip_status = 0) and TripPlugin.java (min_milli =
    // System.currentTimeMillis() at trip start) — duration is Date.now() - min_milli.
    function getTripStatus(onDone) {
        var status = null;
        try {
            status = localStorage.getItem('trip_status');
        } catch (e) {
            status = null;
        }
        var active = status === '0';
        if (!active) {
            onDone({ active: false, durationMs: null });
            return;
        }
        sql(
            "select tid,min_milli from lat_plug where trip_status = 0",
            function (e) {
                var rows = [];
                try { rows = JSON.parse(e) || []; } catch (err) { rows = []; }
                var durationMs = null;
                if (rows.length > 0 && rows[0].min_milli) {
                    var startMs = parseInt(rows[0].min_milli, 10);
                    if (!isNaN(startMs) && startMs > 0) {
                        durationMs = Date.now() - startMs;
                    }
                }
                onDone({ active: true, durationMs: durationMs });
            },
            function () { onDone({ active: true, durationMs: null }); }
        );
    }

    // Reuse the shared queue reader without pulling rows or caching counts.
    function getUploadCounts(onDone) {
        get_pending_upload_counts(onDone);
    }

    function sumHaversineKm(points) {
        var total = 0;
        var prev = null;
        for (var i = 0; i < points.length; i++) {
            var lat = parseFloat(points[i].lat);
            var lon = parseFloat(points[i].lon);
            if (isNaN(lat) || isNaN(lon)) continue;
            if (prev) {
                total += getDistanceFromLatLonInMeter(prev.lat, prev.lon, lat, lon) / 1000;
            }
            prev = { lat: lat, lon: lon };
        }
        return total;
    }

    // trip_stats (PRD §6.5, active trip only). Scopes track_master by
    // date >= min_milli, NOT by a tid join — track_master has no tid column
    // (confirmed against MySQLiteHelper.java's CREATE TABLE), so this mirrors
    // TrackPathReader.java's own native query verbatim ("select lat,lon,tripflag
    // from track_master where tripflag IN (2,3) and date>=" + trip.minMilli).
    // tripflag 2/3 (MapConstants.TRIPFLAG_FUSED/TRIPFLAG_VIOLATION) and the
    // unquoted-numeric-literal-vs-TEXT-column comparison style are both copied
    // from that same proven native query, not guessed.
    //
    // Per PRD §11 ("skip trip_stats path calculation if > 5,000 points on
    // low-end devices"), the Haversine sum over raw lat/lon rows is only run
    // once a cheap count() confirms the point set is small enough; above that,
    // km stays null (never a fabricated/estimated distance) and the widget
    // falls back to duration + violations + sites-visited + "Open map" only.
    //
    // Sites visited comes from geofence_user_tracking_detail, NOT
    // geofence_tracking (that table is only the downloaded site catalog, no
    // visit events). is_send='1' means GeofenceTrasitionService.java confirmed
    // a real dwell past the configured threshold, not a bounce.
    function getTripStats(onDone) {
        var status = null;
        try { status = localStorage.getItem('trip_status'); } catch (e) { status = null; }
        if (status !== '0') {
            onDone({ active: false });
            return;
        }

        function inactiveNoData() {
            onDone({ active: true, durationMs: null, km: null, violations: null, sitesVisited: null, pointCount: 0 });
        }

        sql(
            "select tid,min_milli from lat_plug where trip_status = 0",
            function (e) {
                var rows = [];
                try { rows = JSON.parse(e) || []; } catch (err) { rows = []; }
                if (rows.length === 0 || !rows[0].min_milli) {
                    inactiveNoData();
                    return;
                }
                var minMilli = parseInt(rows[0].min_milli, 10);
                if (isNaN(minMilli) || minMilli <= 0) {
                    inactiveNoData();
                    return;
                }

                var result = {
                    active: true,
                    durationMs: Date.now() - minMilli,
                    km: null,
                    violations: null,
                    sitesVisited: null,
                    pointCount: 0
                };
                var pending = 3;
                function maybeDone() {
                    pending--;
                    if (pending === 0) onDone(result);
                }

                sql(
                    "select count(*) as cnt from track_master where tripflag = 3 and date >= " + minMilli,
                    function (e2) {
                        var r = []; try { r = JSON.parse(e2) || []; } catch (err) { r = []; }
                        result.violations = (r.length && r[0].cnt !== undefined) ? parseInt(r[0].cnt, 10) : 0;
                        maybeDone();
                    },
                    function () { maybeDone(); }
                );

                sql(
                    "select count(*) as cnt from track_master where tripflag IN (2,3) and date >= " + minMilli,
                    function (e3) {
                        var r = []; try { r = JSON.parse(e3) || []; } catch (err) { r = []; }
                        var cnt = (r.length && r[0].cnt !== undefined) ? parseInt(r[0].cnt, 10) : 0;
                        result.pointCount = cnt;
                        if (cnt === 0 || cnt > 5000) {
                            maybeDone();
                            return;
                        }
                        sql(
                            "select lat,lon from track_master where tripflag IN (2,3) and date >= " + minMilli + " order by date",
                            function (e4) {
                                var pts = []; try { pts = JSON.parse(e4) || []; } catch (err) { pts = []; }
                                result.km = sumHaversineKm(pts);
                                maybeDone();
                            },
                            function () { maybeDone(); }
                        );
                    },
                    function () { maybeDone(); }
                );

                var todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);
                sql(
                    "select count(distinct place_id) as cnt from geofence_user_tracking_detail where is_send = 1 and in_time >= " + todayStart.getTime(),
                    function (e5) {
                        var r = []; try { r = JSON.parse(e5) || []; } catch (err) { r = []; }
                        result.sitesVisited = (r.length && r[0].cnt !== undefined) ? parseInt(r[0].cnt, 10) : 0;
                        maybeDone();
                    },
                    function () { maybeDone(); }
                );
            },
            inactiveNoData
        );
    }

    // attendance_chip (PRD §6.7). Mirrors the live Get_Attendance caller in
    // selection.js's get_today_attendance_for_notification_old() / EF_User_List.js's
    // get_user_attendance() — same endpoint, params and response shape. There is
    // no explicit checked-in/out boolean anywhere in that response; "checked in
    // today" is derived the same way the rest of the app derives it: a returned
    // record whose AssignDate matches today. status===2 ("no records this
    // period") is a real, valid "not checked in" answer, not an error.
    function getAttendanceToday(onDone) {
        var flowId = null;
        var userId = null;
        try {
            var attJson = JSON.parse(localStorage.getItem('AttendanceJson'));
            flowId = attJson && attJson[0] && attJson[0].flow_id;
            userId = JSON.parse(storage.getItem('user_id'));
        } catch (e) {
            onDone({ available: false });
            return;
        }
        if (!flowId || !userId) {
            onDone({ available: false });
            return;
        }

        var now = new Date();
        var param_obj = [{
            Flow_id: flowId,
            User_id: userId,
            Month: now.getMonth() + 1,
            Year: now.getFullYear()
        }];

        try {
            var getdata = new Webservicecall_REST(
                global_wcf_url + 'Get_Attendance',
                JSON.stringify(param_obj),
                function (e) {
                    try {
                        var result = JSON.parse(e.responseText);
                        var status = result[0].status;
                        if (status == 2) {
                            onDone({ available: true, checkedIn: false });
                            return;
                        }
                        if (status != 1) {
                            onDone({ available: false });
                            return;
                        }
                        var rows = JSON.parse(result[0].data) || [];
                        var today = new Date();
                        var checkedIn = false;
                        for (var i = 0; i < rows.length; i++) {
                            var d = new Date(rows[i].AssignDate);
                            if (d.getFullYear() === today.getFullYear()
                                && d.getMonth() === today.getMonth()
                                && d.getDate() === today.getDate()) {
                                checkedIn = true;
                                break;
                            }
                        }
                        onDone({ available: true, checkedIn: checkedIn });
                    } catch (err) {
                        onDone({ available: false });
                    }
                },
                function () { onDone({ available: false }); }
            );
            getdata.callOtherDomain();
        } catch (e) {
            onDone({ available: false });
        }
    }

    // notifications_summary (PRD §6.9). Independent Get_NotificationList_For_User
    // call — same endpoint/params get_user_notifications() (selection.js) uses,
    // minus its myApp.popup('.popup-notifications') side effect, since rendering
    // the dashboard card must not force-open the native notification panel.
    // hasUnread reads the same localStorage.new_notification flag the bell-icon
    // badge already uses (set by check_for_new_user_notifications()) — cheap,
    // no extra network call, and consistent with whatever the badge shows.
    function getNotificationsSummary(limit, onDone) {
        var user_id = null;
        try {
            user_id = JSON.parse(storage.getItem('user_id'));
        } catch (e) {
            user_id = null;
        }

        var hasUnread = false;
        try {
            hasUnread = localStorage.getItem('new_notification') === 'true';
        } catch (e) {
            hasUnread = false;
        }

        if (!user_id) {
            onDone({ items: [], hasUnread: hasUnread, available: false });
            return;
        }

        var param_obj = [{ user_id: user_id, offset: 0, fetch: limit }];
        try {
            var getdata = new Webservicecall_REST(
                global_wcf_url + 'Get_NotificationList_For_User',
                JSON.stringify(param_obj),
                function (e) {
                    try {
                        var result = JSON.parse(e.responseText);
                        var status = result[0].status;
                        if (status == 2) {
                            onDone({ items: [], hasUnread: hasUnread, available: true });
                            return;
                        }
                        if (status != 1) {
                            onDone({ items: [], hasUnread: hasUnread, available: false });
                            return;
                        }
                        var rows = JSON.parse(result[0].data) || [];
                        var items = [];
                        for (var i = 0; i < rows.length && i < limit; i++) {
                            var r = rows[i];
                            var title = r.title || r.Title || (r.task_id ? ('Task ' + r.task_id) : 'Notification');
                            var isRead = r.is_read == 1 || r.status == 'read' || r.status == 1;
                            items.push({ title: title, isRead: isRead });
                        }
                        onDone({ items: items, hasUnread: hasUnread, available: true });
                    } catch (err) {
                        onDone({ items: [], hasUnread: hasUnread, available: false });
                    }
                },
                function () { onDone({ items: [], hasUnread: hasUnread, available: false }); }
            );
            getdata.callOtherDomain();
        } catch (e) {
            onDone({ items: [], hasUnread: hasUnread, available: false });
        }
    }

    // The SqlitePlugin bridge returns each result row's keys however the
    // underlying column ended up cased (User_Define_Flow_Master's own
    // columns come back upper-cased -- ID/P_ID/FLOW_ID/FLOW_NAME/TYPE/DATA --
    // while an explicit `as alias` on other tables has come back as
    // typed elsewhere in this file). Rather than trust either case, index
    // this object case-insensitively.
    function getField(row, name) {
        if (!row) {
            return undefined;
        }
        if (row[name] !== undefined) {
            return row[name];
        }
        var upper = name.toUpperCase();
        if (row[upper] !== undefined) {
            return row[upper];
        }
        var lower = name.toLowerCase();
        return row[lower];
    }

    // The task count the home screen has ALREADY fetched for each module and
    // cached (selection.js get_counter_for_online_flow -> localStorage
    // 'udf_count_array', indexed by User_Define_Flow_Master.id). Reading that
    // cache is deliberate: the dashboard shows the very same number as the
    // module's own badge, with no second server call and no separate count
    // query of its own. null (rendered "—") means that counter has not
    // completed yet this session, which is not the same as a real zero.
    function readCachedUdfCount(udfId) {
        try {
            var raw = localStorage.getItem('udf_count_array');
            if (!raw) {
                return null;
            }
            var counts = JSON.parse(raw);
            if (!counts) {
                return null;
            }
            var value = counts[udfId];
            if (value === undefined || value === null || value === '') {
                return null;
            }
            return value;
        } catch (e) {
            return null;
        }
    }

    // site_summary (top dashboard card). PM / Energy Reading show the task
    // count the home screen's own module badges already show, read straight
    // from that counter's localStorage cache (readCachedUdfCount above) — no
    // extra server call and no separate count query. The only lookup here is
    // one local row-id read, because which User_Define_Flow_Master id is "PM"
    // is per-company config rather than a fixed constant. Visited Today
    // reuses the same geofence_user_tracking_detail / is_send='1'
    // confirmed-dwell logic getTripStats() already uses, scoped by user_id
    // (the column exists there) as well as by date.
    function getSiteSummary(onDone) {
        var user_id = null;
        try {
            user_id = JSON.parse(storage.getItem('user_id'));
        } catch (e) {
            user_id = null;
        }

        var result = { pmPending: null, erPending: null, visitedToday: null };
        var pending = 2;
        function maybeDone() {
            pending--;
            if (pending === 0) onDone(result);
        }

        // Top-level module rows only (p_id = 0) — the same granularity the
        // cached counter is keyed by. Matched case-insensitively because
        // flow_name casing is per-company data entry.
        sql(
            "select id, flow_name from User_Define_Flow_Master where p_id = 0 "
            + "and (upper(flow_name) = 'PM' or upper(flow_name) = 'ENERGY READING') "
            + "and (is_delete != 1 or is_delete IS NULL)",
            function (e) {
                var rows = []; try { rows = JSON.parse(e) || []; } catch (err) { rows = []; }
                for (var i = 0; i < rows.length; i++) {
                    var name = String(getField(rows[i], 'flow_name') || '').toUpperCase();
                    var id = getField(rows[i], 'id');
                    if (name === 'PM') {
                        result.pmPending = readCachedUdfCount(id);
                    } else if (name === 'ENERGY READING') {
                        result.erPending = readCachedUdfCount(id);
                    }
                }
                maybeDone();
            },
            function () { maybeDone(); }
        );

        var todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        var userClause = user_id ? (" and user_id = '" + user_id + "'") : '';
        sql(
            "select count(distinct place_id) as cnt from geofence_user_tracking_detail where is_send = 1 and in_time >= " + todayStart.getTime() + userClause,
            function (e) {
                var r = []; try { r = JSON.parse(e) || []; } catch (err) { r = []; }
                result.visitedToday = (r.length && r[0].cnt !== undefined) ? parseInt(r[0].cnt, 10) : 0;
                maybeDone();
            },
            function () { maybeDone(); }
        );
    }

    // Recent trips from lat_plug. trip_status 0 = in progress (same as
    // getTripStatus / TrackPathReader); anything else is an ended row.
    // Ordered by _id desc (autoincrement) — min_milli is TEXT so we don't
    // CAST. Cap keeps the sheet snappy on long-lived devices.
    // engine_m: the native trip engine's measured distance (see getLiveTrip);
    // trips recorded before the engine existed have none.
    function getTripList(startMs, endMs, onDone) {
        var start = parseInt(startMs, 10);
        var end = parseInt(endMs, 10);
        if (isNaN(start)) start = 0;
        if (isNaN(end) || end <= 0) end = Date.now();
        var cols = "lp._id, lp.tid, lp.sid, tm.server_task_id, lp.trip_status, lp.min_milli, lp.max_milli, lp.site_name, lp.unique_trip_id, lp.issend, lp.distance";
        var rest = " from lat_plug lp left join task_master tm on tm.tid = lp.tid where (lp.min_milli+0) >= " + start + " and (lp.min_milli+0) <= " + end + " order by lp._id desc limit 80";
        sqlOrFallback("select " + cols + ", (select s.distance_m from trip_engine_state s where s.tid = lp.tid) as engine_m" + rest,
            "select " + cols + rest, function (rows) { onDone(rows); });
    }

    // Runs primary; if it fails (e.g. a native table that doesn't exist yet),
    // runs fallback instead. onDone gets the parsed rows ([] on failure).
    function sqlOrFallback(primary, fallback, onDone) {
        function parse(e) {
            try { return JSON.parse(e) || []; } catch (err) { return []; }
        }
        sql(primary, function (e) { onDone(parse(e)); }, function () {
            sql(fallback, function (e) { onDone(parse(e)); }, function () { onDone([]); });
        });
    }

    // GPS breadcrumbs for one lat_plug window (same tripflag filter as
    // TrackPathReader). date is millis text, compared numerically.
    function getTripPath(minMs, maxMs, onDone) {
        var min = parseInt(minMs, 10);
        var max = parseInt(maxMs, 10);
        if (isNaN(min)) min = 0;
        if (isNaN(max) || max <= 0) max = Date.now();
        sql(
            "select lat,lon,tripflag,date,speed from track_master where tripflag IN (2,3) and (date+0) >= " + min + " and (date+0) <= " + max + " order by date limit 5000",
            function (e) {
                var rows = [];
                try { rows = JSON.parse(e) || []; } catch (err) { rows = []; }
                onDone(rows);
            },
            function () { onDone([]); }
        );
    }

    // The trip running now (trip_status 0, as in getTripStatus), or null.
    // SELECT only. engine_m is the distance the native trip engine measured from every
    // trusted fix (trip_engine_state). That table appears with the first
    // fix of a trip, so fall back to the plain query until it exists.
    function getLiveTrip(onDone) {
        sqlOrFallback("select l.tid, l.min_milli, l.site_name, "
            + "(select s.distance_m from trip_engine_state s where s.tid = l.tid) as engine_m "
            + "from lat_plug l where l.trip_status = 0 order by l._id desc limit 1",
            "select tid, min_milli, site_name from lat_plug where trip_status = 0 order by _id desc limit 1",
            function (rows) { onDone(rows.length ? rows[0] : null); });
    }

    // Motion segments (driving, idle, on site, walking, stopped, no signal)
    // overlapping a time window, from the native engine's motion_segments
    // table. The table appears with the first segment; until then: none.
    function getMotionSegments(minMs, maxMs, onDone) {
        var min = parseInt(minMs, 10) || 0;
        var max = parseInt(maxMs, 10) || Date.now();
        sql("select state, start_ms, end_ms, site_id from motion_segments where end_ms >= " + min
            + " and start_ms <= " + max + " order by start_ms",
            function (e) {
                var rows = [];
                try { rows = JSON.parse(e) || []; } catch (err) { rows = []; }
                onDone(rows);
            },
            function () { onDone([]); }
        );
    }

    // The native engine's record for one trip (distance, gaps, weak-GPS part),
    // or null.
    function getTripEngine(tid, onDone) {
        var id = String(tid == null ? '' : tid).replace(/[^0-9A-Za-z_-]/g, '');
        if (!id) { onDone(null); return; }
        sql("select * from trip_engine_state where tid = '" + id + "'",
            function (e) {
                var rows = [];
                try { rows = JSON.parse(e) || []; } catch (err) { rows = []; }
                onDone(rows.length ? rows[0] : null);
            },
            function () { onDone(null); }
        );
    }

    // The site catalog on this phone (geofence_tracking: the sites the server
    // sent down for this user). Same row filter as the native map's
    // GeofenceTrackingReader. SELECT only.
    function getSiteCatalog(onDone) {
        sql(
            "select place_id, latitude, longitude, radius, flow_id from geofence_tracking "
            + "where latitude is not null and latitude <> '' and latitude <> '0' "
            + "and longitude is not null and longitude <> '' and longitude <> '0' "
            + "and not (latitude = '21' and longitude = '61')",
            function (e) {
                var rows = [];
                try { rows = JSON.parse(e) || []; } catch (err) { rows = []; }
                onDone(rows);
            },
            function () { onDone([]); }
        );
    }

    // The geofence radius (metres) a flow defines, for catalog rows whose own
    // radius is 0: the same value GeoFenceDraw.getRadiusfromFlowmaster() reads
    // (User_Define_Flow_Master.data -> geotracking[0].radius). SELECT only.
    function getFlowRadius(flowId, onDone) {
        var id = parseInt(flowId, 10);
        if (isNaN(id)) { onDone(null); return; }
        sql(
            "select data from User_Define_Flow_Master where id = " + id + " limit 1",
            function (e) {
                var radius = null;
                try {
                    var geo = JSON.parse(JSON.parse(e)[0].data)[0].geotracking;
                    if (typeof geo === 'string') geo = JSON.parse(geo);
                    radius = parseFloat(geo[0].radius);
                    if (isNaN(radius) || radius <= 0) radius = null;
                } catch (err) { radius = null; }
                onDone(radius);
            },
            function () { onDone(null); }
        );
    }

    // The most recent position the location service stored. SELECT only.
    function getLastLocation(onDone) {
        sql(
            "select lat, lon, accuracy, date from track_master "
            + "where lat is not null and lat <> '' and lat <> '0' order by _id desc limit 1",
            function (e) {
                var rows = [];
                try { rows = JSON.parse(e) || []; } catch (err) { rows = []; }
                onDone(rows.length ? rows[0] : null);
            },
            function () { onDone(null); }
        );
    }

    // Events the engine logged for one trip (Events table), counted by type.
    // Matched on the trip's tid, or on the trip's time window for rows written
    // without one. SELECT only.
    function getTripEvents(tid, minMs, maxMs, onDone) {
        var min = parseInt(minMs, 10);
        var max = parseInt(maxMs, 10);
        if (isNaN(min)) min = 0;
        if (isNaN(max) || max <= 0) max = Date.now();
        var where = "((Event_strt+0) >= " + min + " and (Event_strt+0) <= " + max + ")";
        var t = parseInt(tid, 10);
        if (!isNaN(t) && t > 0) where = "(tid = '" + t + "' or " + where + ")";
        sql(
            "select Event_type, count(*) as c from Events where " + where + " group by Event_type",
            function (e) {
                var rows = [];
                try { rows = JSON.parse(e) || []; } catch (err) { rows = []; }
                onDone(rows);
            },
            function () { onDone([]); }
        );
    }

    // Every engine event in a time range, for the Trips summary card. SELECT only.
    function getEventsInRange(minMs, maxMs, onDone) {
        var min = parseInt(minMs, 10);
        var max = parseInt(maxMs, 10);
        if (isNaN(min)) min = 0;
        if (isNaN(max) || max <= 0) max = Date.now();
        sql(
            "select Event_type, Event_strt, tid from Events where (Event_strt+0) >= " + min + " and (Event_strt+0) <= " + max + " limit 5000",
            function (e) {
                var rows = [];
                try { rows = JSON.parse(e) || []; } catch (err) { rows = []; }
                onDone(rows);
            },
            function () { onDone([]); }
        );
    }

    return {
        getEventsInRange: getEventsInRange,
        getTripEvents: getTripEvents,
        getSiteCatalog: getSiteCatalog,
        getLastLocation: getLastLocation,
        getFlowRadius: getFlowRadius,
        getTaskCounts: getTaskCounts,
        getTripStatus: getTripStatus,
        getLiveTrip: getLiveTrip,
        getMotionSegments: getMotionSegments,
        getTripEngine: getTripEngine,
        getUploadCounts: getUploadCounts,
        getTripStats: getTripStats,
        getTripList: getTripList,
        getTripPath: getTripPath,
        getAttendanceToday: getAttendanceToday,
        getNotificationsSummary: getNotificationsSummary,
        getSiteSummary: getSiteSummary
    };
})();
