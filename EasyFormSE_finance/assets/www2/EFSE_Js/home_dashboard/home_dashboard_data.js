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

    return {
        getTaskCounts: getTaskCounts,
        getTripStatus: getTripStatus,
        getUploadCounts: getUploadCounts
    };
})();
