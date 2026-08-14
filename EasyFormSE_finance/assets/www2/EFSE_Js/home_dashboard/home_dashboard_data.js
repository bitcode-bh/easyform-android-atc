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

    // Online: same WCF_OnlineTaskList_Native_Count call and params as
    // get_counter_for_online_flow_profile() (common-functions.js), but the
    // response is only summed here — never merged into profile_flow_Array,
    // never triggers draw_my_task_chart(), no loading() spinner.
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

        var param_obj = [{
            company_id: company_id,
            user_id: user_id,
            user_lat: 0,
            user_long: 0,
            role_id: role_id
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
                        var data = myArray[0].data;
                        var message = (data === '' || data === null || data === undefined)
                            ? []
                            : JSON.parse(data);
                        var total = 0;
                        var byFlow = [];
                        for (var i = 0; i < message.length; i++) {
                            var task_count = message[i].task_count || 0;
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

    // Verbatim copies of pending_status.js's own 5 queries — issued
    // independently, never through get_pending_tasks()/get_pending_trips()/etc.
    function getUploadCounts(onDone) {
        var counts = { tasks: 0, trips: 0, videos: 0, files: 0, photos: 0 };
        var remaining = 5;
        function done(key, n) {
            counts[key] = n;
            remaining--;
            if (remaining === 0) {
                counts.total = counts.tasks + counts.trips + counts.videos + counts.files + counts.photos;
                onDone(counts);
            }
        }
        function countRows(query, key) {
            sql(query,
                function (e) {
                    var rows = [];
                    try { rows = JSON.parse(e) || []; } catch (err) { rows = []; }
                    done(key, rows.length);
                },
                function () { done(key, 0); }
            );
        }
        countRows("select flag from task_master where flag = 1 or flag = 3", 'tasks');
        countRows("select issend from lat_plug where issend = 0", 'trips');
        countRows("select issend_track from video where issend_track = 0", 'videos');
        countRows("select flag from f_master where flag = 0", 'files');
        countRows("select flag from p_master where flag = 0", 'photos');
    }

    function toRad(deg) {
        return deg * Math.PI / 180;
    }

    function haversineKm(lat1, lon1, lat2, lon2) {
        var R = 6371;
        var dLat = toRad(lat2 - lat1);
        var dLon = toRad(lon2 - lon1);
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
            + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    function sumHaversineKm(points) {
        var total = 0;
        var prev = null;
        for (var i = 0; i < points.length; i++) {
            var lat = parseFloat(points[i].lat);
            var lon = parseFloat(points[i].lon);
            if (isNaN(lat) || isNaN(lon)) continue;
            if (prev) {
                total += haversineKm(prev.lat, prev.lon, lat, lon);
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

    return {
        getTaskCounts: getTaskCounts,
        getTripStatus: getTripStatus,
        getUploadCounts: getUploadCounts,
        getTripStats: getTripStats,
        getAttendanceToday: getAttendanceToday,
        getNotificationsSummary: getNotificationsSummary
    };
})();
