
// This page is only for F7

// change downloading label automatically
function starttimer() {
    var wait_label = document.getElementById("lbl_refreshing");
    wait_label.innerHTML = wait_label.innerHTML == "Refreshing..." ? "Please Wait..."
        : "Refreshing...";
}
// redirect to login page on logout button click

function refresh_user_latlong_pm() {
    try {
        var curr_img = $("#img_refresh_latlong").attr("src");
        if (curr_img == "images/refresh.png") {
            $("#img_refresh_latlong").attr("src", "images/refresh_animate.gif");

            var q_jsonobj = [];
            cordova.exec(onsuccess_refresh_user_latlong_pm,
                onfail_refresh_user_latlong_pm, 'current_lat',
                'showValues', q_jsonobj);
        } else {
            alert1("Please wait getting location...");
            // $("#img_refresh_latlong").attr("src", "images/refresh.png");
        }
    } catch (e) {
        alert1(e + '_refresh_user_latlong_pm()');
    }
}

function onsuccess_refresh_user_latlong_pm(e) {
    // alert1(e);
    var myArray = JSON.parse(e);
    // var ref_lat = myArray[0].lat;
    // var ref_long = myArray[0].lon;
    var ref_gprs = myArray[0].gprs;
    var ref_gps = myArray[0].gps;
    if (myArray[0].lat == "" || myArray[0].lat == undefined
        || myArray[0].lat == null) {
        var lat = 0;
    } else {
        var lat = myArray[0].lat;
    }
    if (myArray[0].lon == "" || myArray[0].lon == undefined
        || myArray[0].lon == null) {
        var long = 0;
    } else {
        var long = myArray[0].lon;
    }
    if (myArray[0].accuracy == "" || myArray[0].accuracy == undefined
        || myArray[0].accuracy == null) {
        var accuracy = 0;
    } else {
        var accuracy = myArray[0].accuracy;
    }

    try {
        user_lat = parseFloat(lat);
    } catch (e) {
        user_lat = 0;
    }
    try {
        user_long = parseFloat(long);
    } catch (e) {
        user_long = 0;
    }
    try {
        user_accuracy = parseFloat(accuracy);
    } catch (e) {
        user_accuracy = 0;
    }
    var user_lat_long_str = user_lat + " | " + user_long;
    $("#lbl_ref_latlong").html(user_lat_long_str);
    $("#img_refresh_latlong").attr("src", "images/refresh.png");

    if (ref_gprs == "1") {
        $("#img_gprs").attr("src", "images/online.png");
        $("#lbl_gprs").html("Online");
    } else {
        $("#img_gprs").attr("src", "images/offline.png");
        $("#lbl_gprs").html("Offline");
    }

    if (ref_gps == "1") {
        $("#img_gps").attr("src", "images/gps_on.png");
    } else {
        $("#img_gps").attr("src", "images/gps_off.png");
    }

    var user_track_array = [{
        'user_lat': user_lat,
        'user_long': user_long,
        'user_accuracy': user_accuracy
    }];
    storage.setItem('user_track_details', JSON.stringify(user_track_array));
}

function onfail_refresh_user_latlong_pm(e) {
    // alert1(e + '_onfail_refresh_user_latlong_pm()');
    $("#img_gps").attr("src", "images/gps_off.png");
    $("#img_refresh_latlong").attr("src", "images/refresh.png");
}

// Get user latlong
function get_user_latlong_pm() {
    try {
        cordova.exec(onsuccess_get_user_latlong, onfail_get_user_latlong,
            'maulik', 'nck', ["ds"]);
        // var q_jsonobj = [];
        // cordova.exec(onsuccess_get_user_latlong, onfail_get_user_latlong,
        // 'current_lat', 'showValues', q_jsonobj);
    } catch (e) {
        alert1(e + '_get_user_latlong_pm()');
        loading_hide();
    }
}

// successful getting user latlong
function onsuccess_get_user_latlong(e) {
    try {
        // alert1(JSON.stringify(e))
        var myArray = JSON.parse(e);
        if (myArray[0].lat == "" || myArray[0].lat == undefined
            || myArray[0].lat == null) {
            var lat = 0;
        } else {
            var lat = myArray[0].lat;
        }
        if (myArray[0].lon == "" || myArray[0].lon == undefined
            || myArray[0].lon == null) {
            var long = 0;
        } else {
            var long = myArray[0].lon;
        }
        if (myArray[0].accuracy == "" || myArray[0].accuracy == undefined
            || myArray[0].accuracy == null) {
            var accuracy = 0;
        } else {
            var accuracy = myArray[0].accuracy;
        }

        try {
            user_lat = parseFloat(lat);
        } catch (e) {
            user_lat = 0;
        }
        try {
            user_long = parseFloat(long);
        } catch (e) {
            user_long = 0;
        }
        try {
            user_accuracy = parseFloat(accuracy);
        } catch (e) {
            user_accuracy = 0;
        }

        var gprs = myArray[0].gprs;
        var gps = myArray[0].gps;
        var user_lat_long_str = user_lat + " | " + user_long;
        $("#lbl_ref_latlong").html(user_lat_long_str);

        if (gprs == "1") {
            $("#img_gprs").attr("src", "images/online.png");
            $("#lbl_gprs").html("Online");
        } else {
            $("#img_gprs").attr("src", "images/offline.png");
            $("#lbl_gprs").html("Offline");
        }

        if (gps == "1") {
            $("#img_gps").attr("src", "images/gps_on.png");
        } else {
            $("#img_gps").attr("src", "images/gps_off.png");
        }

        var address = myArray[0].address;
        var user_track_array = [{
            'user_lat': user_lat,
            'user_long': user_long,
            'user_accuracy': user_accuracy,
            'user_address': address,
            'user_gprs': gprs,
            'user_gps': gps
        }];
        storage.setItem('user_track_details', JSON.stringify(user_track_array));

        get_active_trips();

    } catch (e) {
        // alert1('Problem while getting GPS lat long, Please change your position !');
        user_lat = 0;
        user_long = 0;
        user_accuracy = 0;

        var user_lat_long_str = "<td><img src='images/offline.png' style='width:14px; height:14px; margin-right:1%' /> <label style='font-size:8pt; vertical-align:text-top'>Offline</label></td><td style='text-align: right'><img src='images/gps_off.png' style='width:14px; height:14px; margin-right:1%; margin-top:1px' /><label style='vertical-align:top'>"
            + user_lat + " | " + user_long + "</label><img id='img_refresh_latlong' onclick='refresh_user_latlong_pm()' src='images/refresh.png' style='width:14px; height:14px; margin-left:1%; margin-top:1px' /></td>";

        $("#lbl_user_lat_long_pm td").remove();
        $("#lbl_user_lat_long_pm").append(user_lat_long_str);

        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var survey_mode = list_data[0].survey_mode;
        if (survey_mode == "" || survey_mode == null || survey_mode == undefined) {
            survey_mode = "offline";
        }

        if (survey_mode == "online") {
            var redirect = list_data[0].redirect;
            if (redirect == 'customer') {
                get_list_of_customer_online();
            } else {
                // get_list_of_pm_sites_online();
                get_list_of_task_for_compare_online();
            }
        } else {
            get_list_of_pm_sites();
        }
        loading_hide();
    }
}

var trip_New_Array = [];
function get_active_trips() {
    var query = "SELECT lat_plug.tid, lat_plug.sid, task_master.server_task_id FROM lat_plug INNER JOIN task_master ON lat_plug.tid = task_master.tid where lat_plug.trip_status = 0";
    var q_jsonobj = [];
    q_jsonobj.push({
        data: query,
        p: "1"
    });
    cordova.exec(function (e) {
        var myArray = JSON.parse(e);
        if (myArray.length == 0) {
            trip_New_Array = [];
        }
        else {
            trip_New_Array = myArray;
        }

        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var survey_mode = list_data[0].survey_mode;
        if (survey_mode == "" || survey_mode == null || survey_mode == undefined) {
            survey_mode = "offline";
        }

        if (survey_mode == "online") {
            var redirect = list_data[0].redirect;
            if (redirect == 'customer') {
                get_list_of_customer_online();
            } else {
                // get_list_of_pm_sites_online();
                get_list_of_task_for_compare_online();
            }
        } else {
            get_list_of_pm_sites();
        }
 
    }, function () { alert1(e) }, 'SqlitePlugin', 'showValues', q_jsonobj);




}

// Get distance between two point in Meters
function getDistanceFromLatLonInMeter(lat1, lon1, lat2, lon2) {
    var R = 6371000; // Radius of the earth in meters
    var dLat = deg2rad(lat2 - lat1); // deg2rad below
    var dLon = deg2rad(lon2 - lon1);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(deg2rad(lat1))
        * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in meters
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

// Get list of pm sites without checking user distance
function get_list_of_pm_sites() {
    var data_json = JSON.parse(storage.getItem('list_json'));
    var list_data = JSON.parse(data_json);
    var search_value = list_data[0].search;
    if (search_value == "true") {
        $('#btn_Search').show();
    }
    get_list_of_pm_sites_New('');   // default blank search string
}

function get_list_of_pm_sites_New(search_keyword) {
    try {
        disable_back_button();
        //loading();
        $("#tasklist_loader").show();
        $("#txtsearch").val("");
        $("#tab1").unbind('scroll');
        $("#btn_Create_Task").hide();
        $("#btn_advanced_search").hide();

        var selected_module_id = JSON.parse(storage.getItem('wayflow'));

        if (selected_module_id == 0) {
            alert1("Please select flow !")
        } else {
            var step_array = [];
            var cid_array = [];
            var data_json = JSON.parse(storage.getItem('list_json'));

            var list_data = JSON.parse(data_json);
            var status_array = list_data[0].status;

            // add all number of status
            var Columndata_json = list_data[0].columndata;
            for (c = 0; c < Columndata_json.length; c++) {
                var step_temp = list_data[0].columndata[c].step;
                var checksheetID_temp = list_data[0].columndata[c].checksheetID;
                var step_check = 0;
                var cid_check = 0;
                for (s = 0; s < step_array.length; s++) {
                    if (step_array[s] == step_temp) {
                        step_check++;
                    }
                }
                if (step_check == 0) {
                    step_array.push(step_temp);
                }
                for (k = 0; k < cid_array.length; k++) {
                    if (cid_array[k] == checksheetID_temp) {
                        cid_check++;
                    }
                }
                if (cid_check == 0) {
                    cid_array.push(checksheetID_temp);
                }
            }

            var orderby = list_data[0].orderby;
            var order_type = list_data[0].order_type;

            if (orderby == "assigndate") {
                var orderbystr = "(substr(tm.upload_date,7,4) || substr(tm.upload_date,1,2) || substr(tm.upload_date,4,2))";
            }
            if (orderby == "task_id") {
                orderby = "tid";
            }

            var flow_Array = JSON.parse(storage.getItem('flow_Array'));
            var is_subflow = localStorage.getItem('is_subflow');
            //if (flow_Array.length == 1) {
            if (is_subflow == 'true') {
                //var p_tid = JSON.parse(storage.getItem('tid'));
                var p_tid = flow_Array[0].tid;
                var p_tid_str = 'and task_master.p_tid = ' + p_tid + '';
            } else {
                var p_tid_str = '';
            }

            var search_str = '';
            if (search_keyword == '') { } else {
                search_str = "(task_master.display_siteid like '%" + search_keyword + "%' or task_master.site_name like '%" + search_keyword + "%') and ";
            }

            var limit_offset = parseInt(limit_range - default_range);
            if (orderby == "distance") {
                var lat_radian = 3.14 * (user_lat) / 180;
                var equa_distance = Math.pow(Math.cos(lat_radian), 2);
                var dynamic_orderby_str = "((" + user_lat + "-tm.lat)*(" + user_lat + "-tm.lat)+(" + user_long + "-tm.long)*(" + user_long + "-tm.long)*" + equa_distance + ") ";
            }
            else if (orderby == "assigndate") {
                var dynamic_orderby_str = orderbystr;
            } else {
                var dynamic_orderby_str = "tm." + orderby + " ";
            }

            var multiflow_list = list_data[0].multiflow_list;
            var survey_mode = list_data[0].survey_mode;
            var upload_pending_display = list_data[0].upload_pending_display;
            var upload_pending_query = '';

            if (survey_mode == 'offline') {
                if (multiflow_list == '' || multiflow_list == null || multiflow_list == undefined) {
                    multiflow_list = [];

                    if (upload_pending_display != "false") {
                        upload_pending_query = " or ( task_master.status != -1 and task_master.rate=2 and task_master.flag=1 and " + search_str + " task_master.moduleid = '" + selected_module_id + "' and task_master.username = '" + username + "' and task_master.is_down_complete=1 " + p_tid_str + " )";
                    }

                    var query = "select tm.flag, tm.tower_type as udf_id, tm.rate, tm.tid, tm.p_tid, tm.moduleid,tm.module_name,tm.siteid,tm.site_name,tm.lat,tm.long,tm.data,tm.site_address,tm.status,tm.survey_date,tm.survey_ms, tm.server_task_id, tm.is_delete_photo, tm.is_delete_log, tm.is_delete_sub, tm.is_valid_log, tm.list_html, tm.columndata, tm.response_status, fm.f_data, fm.step, fm.c_id from "
                        + "(select * from task_master where " + search_str + " task_master.moduleid = '" + selected_module_id + "' and task_master.username = '" + username + "' and task_master.is_down_complete=1 and task_master.status in(" + status_array + ") " + p_tid_str + ""
                        + upload_pending_query + " limit " + default_range + " offset " + limit_offset + ") as tm INNER JOIN f_master fm ON tm.tid = fm.tid where fm.c_id in(" + cid_array + ") and fm.step in(" + step_array + ") ORDER BY " + dynamic_orderby_str + " " + order_type + "";
                }
                else {
                    var mf_query_str = '';
                    var mf_flow_id_ary = [];
                    for (m = 0; m < multiflow_list.length; m++) {
                        var mf_flow_id = multiflow_list[m].flow_id;
                        var mf_status = multiflow_list[m].status;
                        var or_str = "";
                        mf_flow_id_ary.push(mf_flow_id);

                        if (m > 0) {
                            var or_str = " or ";
                        }

                        mf_query_str += or_str + "(task_master.moduleid = '" + mf_flow_id + "' and task_master.status in (" + mf_status + "))";

                    }

                    if (upload_pending_display != "false") {
                        upload_pending_query = " or ( task_master.rate=2 and task_master.flag=1 and " + search_str + " task_master.moduleid IN (" + mf_flow_id_ary + ") and task_master.username = '" + username + "' and task_master.is_down_complete=1 " + p_tid_str + " )";
                    }

                    //custome development for offline multiflow for ATC(user: kk.site)(26032019)
                    cid_array.push(["5002, 5003, 5004"]);
                    var query = "select tm.flag, tm.tower_type as udf_id, tm.rate, tm.tid, tm.p_tid, tm.moduleid,tm.module_name,tm.siteid,tm.site_name,tm.lat,tm.long,tm.data,tm.site_address,tm.status,tm.survey_date,tm.survey_ms, tm.server_task_id, tm.is_delete_photo, tm.is_delete_log, tm.is_delete_sub, tm.is_valid_log, tm.list_html, tm.columndata, tm.response_status, fm.f_data, fm.step, fm.c_id from "
                        + "(select * from task_master where " + search_str + " " + mf_query_str + " and task_master.username = '" + username + "' and task_master.is_down_complete=1 " + p_tid_str + ""
                        + upload_pending_query + " limit " + default_range + " offset " + limit_offset + ") as tm INNER JOIN f_master fm ON tm.tid = fm.tid where fm.c_id in(" + cid_array + ") and fm.step in(" + step_array + ") ORDER BY " + dynamic_orderby_str + " " + order_type + "";
                }
            }
            else {
                // removed username from where condition in hyrbid flow (11022019)
                if (upload_pending_display != "false") {
                    upload_pending_query = " or ( task_master.rate=2 and task_master.flag=1 and " + search_str + " task_master.moduleid = '" + selected_module_id + "' and task_master.is_down_complete=1 " + p_tid_str + " )";
                }

                var query = "select tm.flag, tm.tower_type as udf_id, tm.rate, tm.tid, tm.p_tid, tm.moduleid,tm.module_name,tm.siteid,tm.site_name,tm.lat,tm.long,tm.data,tm.site_address,tm.status,tm.survey_date,tm.survey_ms, tm.server_task_id, tm.is_delete_photo, tm.is_delete_log, tm.is_delete_sub, tm.is_valid_log, tm.list_html, tm.columndata, tm.response_status, fm.f_data, fm.step, fm.c_id from "
                    + "(select * from task_master where " + search_str + " task_master.moduleid = '" + selected_module_id + "' and task_master.is_down_complete=1 and task_master.status in(" + status_array + ") " + p_tid_str + ""
                    + upload_pending_query + " limit " + default_range + " offset " + limit_offset + ") as tm INNER JOIN f_master fm ON tm.tid = fm.tid where fm.c_id in(" + cid_array + ") and fm.step in(" + step_array + ") ORDER BY " + dynamic_orderby_str + " " + order_type + "";
            }
            //alert1(query);

            var q_jsonobj = [];
            q_jsonobj.push({
                data: query,
                p: "1"
            });
            cordova.exec(onsuccess_get_list_of_pm_sites, onfail_get_list_of_pm_sites, 'SqlitePlugin', 'showValues', q_jsonobj);
        }
    } catch (e) {
        alert1(e + '_get_list_of_pm_sites()');
    }
}

// Get list of pm sites by search
function get_list_of_pm_sites_by_search() {
    try {
        var search_keyword = $("#txtsearch").val();
        if (search_keyword != "") {
            get_list_of_pm_sites_New(search_keyword);
        } else {
            var limit_offset = parseInt(limit_range - default_range);
            if (limit_offset == 0) {
                alert1("Please enter search keyword !");
            }
            else {
                get_list_of_pm_sites_New(search_keyword);
            }
        }
    } catch (e) {
        alert1(e + '_get_list_of_pm_sites_by_search()');
        loading_hide();
    }
}

var no_udf_id_found = 0;
var task_refresh_timer;
function onsuccess_get_list_of_pm_sites(e) {
    try {
        no_udf_id_found = 0;
        var no_data_found = 0;
        var tid_Array = [];
        var distance_array = [];
        var test_c_id = [];
        var type20_columndata = [];
        var myArray = JSON.parse(e);
        //alert1(JSON.stringify(myArray));

        var limit_offset = parseInt(limit_range - default_range);
        if (limit_offset == 0) {
            var filter_ddl_Array = [];
        }
        else {
            var old_filter_ddl_Array = localStorage.getItem('filter_ddl_Array');
            old_filter_ddl_Array = JSON.parse(old_filter_ddl_Array);
            var filter_ddl_Array = old_filter_ddl_Array;
        }
        

        //$("#site_list").empty();

        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);

        //list_data[0].geofence[0].value = 'true';
        //list_data[0].navigation = 'true';
        //list_data[0].site_route = 'true';
        //list_data[0].pdf_site_list = 'true';
        //list_data[0].weather_display = 'true';
        //list_data[0].colwise_align = 'true';
        //list_data[0].buttons = [];

        active_Tab = JSON.parse(storage.getItem('tab_index'));
        var Columndata_json = list_data[0].columndata;
        var staticdata = list_data[0].staticdata;
        var task_removable = list_data[0].task_removable;
        var task_editable = list_data[0].task_editable;
        var task_clickable = list_data[0].task_clickable;
        var weather_display = list_data[0].weather_display;
        var customer_info = list_data[0].customer_info;
        var CommentUI = list_data[0].CommentUI;
        var site_route = list_data[0].site_route;
        var latlong_api = list_data[0].latlong_api;
        var company_id = window.storage.getItem('company_id');

        if (customer_info == "" || customer_info == null || customer_info == undefined) {
            customer_info = "true";
        }

        if (CommentUI == "" || CommentUI == null || CommentUI == undefined) {
            CommentUI = "true";
        }

        if (site_route == "" || site_route == null || site_route == undefined) {
            site_route = "false";
        }

        if (F7_device == 'ios') {
            var clickable_param = "mk_notify('This information is read only !')";
            var upload_param = "mk_notify('Task is uploading, please wait... !')";
        }
        else {
            var clickable_param = "alert1('This information is read only !')";
            var upload_param = "alert1('Task is uploading, please wait... !')";
        }

        var status_array = list_data[0].status;

        // setting task list icons alignment start
        var geofance_flag = list_data[0].geofence[0].value;
        var pdf_site_list = list_data[0].pdf_site_list;
        var navigation_type = list_data[0].navigation;
        var alternate_list_color = list_data[0].alternate_list_color;
        if (alternate_list_color == '' || alternate_list_color == null || alternate_list_color == undefined) { }
        else {
            var back_color_even = alternate_list_color[1];
            var back_color_odd = alternate_list_color[0];
        }

        if (pdf_site_list == '' || pdf_site_list == null || pdf_site_list == undefined) {
            pdf_site_list = "false";
        }

        var pdf_mar_top = '30px';
        var li_min_height = '28px';
        if (geofance_flag == 'true' && pdf_site_list == 'true') {
            li_min_height = '90px';
            pdf_mar_top = '60px';
        } else if (geofance_flag == 'true' && pdf_site_list == 'false') {
            li_min_height = '57px';
        } else if (geofance_flag == 'false' && pdf_site_list == 'true') {
            li_min_height = '62px';
            pdf_mar_top = '30px';
        } else if (geofance_flag == 'false' && pdf_site_list == 'false') {
            li_min_height = '20px';
        }
        // setting task list icons alignment end

        var flow_Array = JSON.parse(storage.getItem('flow_Array'));
        //if (task_removable == 'true' && flow_Array.length > 1) {
        //    mk_notify("Swipe left on last list item to remove...");
        //}

        // var staticdata = "Tenant";
        var Panding_que_id_json = [];
        for (c = 0; c < Columndata_json.length; c++) {
            var qid = list_data[0].columndata[c].qid;
            var checksheetID = list_data[0].columndata[c].checksheetID;
            var step = list_data[0].columndata[c].step;

            for (p = 0; p < Columndata_json.length; p++) {
                var position = list_data[0].columndata[p].position;
                var font_size = list_data[0].columndata[p].font_size;
                var checksheetID = list_data[0].columndata[p].checksheetID;
                var step = list_data[0].columndata[p].step;
                var format = list_data[0].columndata[p].format;
                var border = list_data[0].columndata[p].border;
                var color = list_data[0].columndata[p].color;
                var header = list_data[0].columndata[p].header;
                var header_view = list_data[0].columndata[p].header_view;
                var qid = list_data[0].columndata[p].qid;
                var system_var = list_data[0].columndata[p].system_var;
                var is_hide = list_data[0].columndata[p].is_hide;
                if (is_hide == "" || is_hide == null || is_hide == undefined) {
                    is_hide = "false";
                }

                if (position == c + 1) {
                    Panding_que_id_json.push({
                        "position": position,
                        "checksheetID": checksheetID,
                        "step": step,
                        "que_id": qid,
                        "font_size": font_size,
                        "color": color,
                        "header": header,
                        "header_view": header_view,
                        "format": format,
                        "border": border,
                        "system_var": system_var,
                        "is_hide": is_hide
                    });
                }
            }
        }

        if (myArray.length > 0) {
            // remove duplicate tid
            for (var q = 0; q < myArray.length; q++) {
                var tid_temp = myArray[q].tid;
                var f_step = myArray[q].step;
                var f_cid = myArray[q].c_id;
                var f_data = myArray[q].f_data;

                var tid_check = 0;
                for (s = 0; s < tid_Array.length; s++) {
                    if (tid_Array[s] == tid_temp) {
                        tid_check++;
                    }
                }
                if (tid_check == 0) {
                    tid_Array.push(tid_temp);
                    var site_lat = myArray[q].lat;
                    var site_long = myArray[q].long;
                    var distance = getDistanceFromLatLonInMeter(user_lat, user_long, site_lat, site_long);
                    distance = parseInt(distance);
                    distance_array.push({
                        'tid': tid_temp,
                        'distance': distance
                    });
                }
            }
        }


        var order_type = list_data[0].order_type;
        var orderby = list_data[0].orderby;

        if (orderby == "distance") {
            if (order_type == 'asc') {
                // sort array by element position in list
                var sorted_distance_array = distance_array
                    .sort(function (a, b) {
                        return a.distance - b.distance;
                    });
                distance_array = sorted_distance_array;
            }
            else {
                var sorted_distance_array = distance_array
                    .sort(function (a, b) {
                        return b.distance - a.distance;
                    });
                distance_array = sorted_distance_array;
            }
            tid_Array = [];
            for (var d = 0; d < distance_array.length; d++) {
                tid_Array.push(distance_array[d].tid);
            }
        }
        else {
            if (order_type == 'desc') {
                // sort array by element position in list
                var sorted_tid_Array = tid_Array
                    .sort(function (a, b) {
                        var x = a.position < b.position ? -1 : 1;
                        return x;
                    });
                tid_Array = sorted_tid_Array;
            }
        }


        var is_subflow = localStorage.getItem('is_subflow');
        //if (flow_Array.length > 1) {
        if (is_subflow == 'true') {
            var view_submit_button = list_data[0].view_submit_button;
            if (view_submit_button == 'false') { }
            else {
                $("#btn_Submit").show();
            }
        }

        //$("#survey_td_1").html("Total : " + tid_Array.length + "");

        var tbl_counter = 0;
        var colwise_align = list_data[0].colwise_align;
        if (colwise_align == '' || colwise_align == null || colwise_align == undefined) {
            colwise_align = "true";
        }
        var taskview_label = list_data[0].taskview_label;
        if (taskview_label == '' || taskview_label == null || taskview_label == undefined) {
            taskview_label = "true";
        }
        var taskview_align = list_data[0].taskview_align;
        if (taskview_align == '' || taskview_align == null || taskview_align == undefined) {
            taskview_align = "left";
        }

        var task_layout = list_data[0].task_layout;
        if (task_layout == "" || task_layout == null || task_layout == undefined) {
            task_layout = "cardview";
        }

        if (task_layout == "cardview") {
            var cls_task_layout = "task_cardview";
        }
        else {
            var cls_task_layout = "";
        }

        var upload_pending_count = 0;

        if (myArray.length > 0) {
            $(".op-show-btns").show();

            var ddl_cnt = 0;
            $('#lst_filter').empty();

            var approve_status = list_data[0].approval_status;
            var rejected_status = list_data[0].rejection_status;
            var upload_pending_display = list_data[0].upload_pending_display;

            for (var t = 0; t < tid_Array.length; t++) {
                if (staticdata == '' || staticdata == null || staticdata == undefined) {
                    var test_json_temp = [];
                    var list_item = '';
                    var tid = tid_Array[t];
                    var geo_falg = 0;// print geofance and navigation only once

                    var distance_desplay = 0;
                    var store_param = [];
                    var near_site;
                    var icon_str = '';

                    var priority_found = 0;
                    var old_priority;

                    var multiple_LatLong_ary = [{ 'Lat 1': "", 'Long 1': "", 'Lat 2': "", 'Long 2': "", }];
                    var new_Panding_que_id_json = [];
                    for (var n = 0; n < Panding_que_id_json.length; n++) {
                        var d_header = Panding_que_id_json[n].header;
                        if (site_route == "true") {                                     //display site route on map [23042021]
                            if (latlong_api == "" || latlong_api == null || latlong_api == undefined) {
                                if (d_header == "Lat 1") {
                                    var lat1 = t_ans;
                                    multiple_LatLong_ary[0]['Lat 1'] = lat1;
                                }
                                else if (d_header == "Lat 2") {
                                    var lat2 = t_ans;
                                    multiple_LatLong_ary[0]['Lat 2'] = lat2;
                                }
                                else if (d_header == "Long 1") {
                                    var long1 = t_ans;
                                    multiple_LatLong_ary[0]['Long 1'] = long1;
                                }
                                else if (d_header == "Long 2") {
                                    var long2 = t_ans;
                                    multiple_LatLong_ary[0]['Long 2'] = long2;
                                }
                            }
                        }

                        var is_hide = Panding_que_id_json[n].is_hide;
                        if (is_hide == "true") { }                              //hide columndata element when is_hide is true in task listing [22042021]
                        else {
                            new_Panding_que_id_json.push(Panding_que_id_json[n]);
                        }
                    }
                    Panding_que_id_json = new_Panding_que_id_json;

                    for (p = 0; p < Panding_que_id_json.length; p++) {
                        var position_flag = 0;
                        var test_position_flag = 0;
                        var qid = Panding_que_id_json[p].que_id;
                        var checksheetID = Panding_que_id_json[p].checksheetID;
                        var step = Panding_que_id_json[p].step;
                        var position = Panding_que_id_json[p].position;
                        var font_size = Panding_que_id_json[p].font_size;
                        var format = Panding_que_id_json[p].format;
                        var color = Panding_que_id_json[p].color;
                        var header = Panding_que_id_json[p].header;
                        var data = [];
                        var border = Panding_que_id_json[p].border;
                        var header_view = Panding_que_id_json[p].header_view;
                        if (header_view == "" || header_view == null || header_view == undefined) {
                            header_view = "true";
                        }

                        // set filters
                        if (t == 0) {
                            var ddl_header = header.replace(/ /g, "__");
                            var param = "sub_filter_popup_task('" + ddl_header + "')";
                            var opt = ""
                            opt += '<li name="ddl_filter_' + ddl_header + '" data=""><a onclick="' + param + '" href="#"class="item-link item-content"><div class="item-inner">';
                            opt += '<div class="item-title">' + header + '</div><div class="item-text" name="filter_sub_label_' + ddl_header + '" style="color: #8e8e93 !important;"></div></div></a></li>';
                            var param = "get_options_for_search_task('" + ddl_header + "')"
                            $('#lst_filter').append(opt);
                        }

                        if (taskview_label == "false") {
                            header = '';
                        }
                        else {
                            if (header_view == "true") {
                                if (colwise_align == "true") { }
                                else {
                                    header = header + ': ';
                                }
                            }
                            else {
                                header = "";
                            }
                        }

                        for (var i = 0; i < myArray.length; i++) {
                            if (tid == myArray[i].tid) {

                                var task_status = myArray[i].status;
                                if (task_status == approve_status || task_status == rejected_status) {
                                    var rate = 2;
                                }
                                else {
                                    var rate = 0;
                                }

                                var task_udf_id = myArray[i].udf_id;
                                if (task_udf_id == '' || task_udf_id == null || task_udf_id == undefined) {
                                    no_udf_id_found++;
                                }

                                if (task_status == 2 || (rate == 2 && flow_Array.length > 1)) {
                                    var back_color = '#e6e6e6';
                                } else {
                                    if (alternate_list_color == '' || alternate_list_color == null || alternate_list_color == undefined) {
                                        var back_color = 'white';
                                    }
                                    else {
                                        var li_length = $("#site_list > li:not(:hidden)").length;
                                        if (li_length % 2 == 0) {
                                            var back_color = back_color_odd;
                                        }
                                        else {
                                            var back_color = back_color_even;
                                        }
                                    }
                                }

                                store_param.push({
                                    "lat": myArray[i].lat,
                                    "long": myArray[i].long,
                                    "siteid": myArray[i].siteid,
                                    "tid": myArray[i].tid,
                                    "status": task_status,
                                    "moduleid": myArray[i].moduleid,
                                    "module_name": myArray[i].module_name
                                });

                                // check for upload pending task
                                var upload_pending_str = '';
                                if (upload_pending_display != "false") {
                                    if (myArray[i].flag == 1) {
                                        upload_pending_str += "<div style='border:1px solid black; margin-top:8px; padding:2px; width:100%; background-color:white; color:#32cd32; border-top: 1px solid #32cd32; border-bottom: 1px solid #32cd32; text-align:center'>Task is uploading...</div>";
                                        upload_pending_count++;
                                    }
                                }

                                // check for duplicate task (for offline task only 15102020)
                                var response_status = myArray[i].response_status;
                                var dup_task_str = '';
                                if (response_status == 14) {
                                    dup_task_str += "<div style='margin-top:8px; padding:2px; width:100%; background-color:white; color:red; border-top: 1px solid red; border-bottom: 1px solid red; text-align:center'><i class='fa fa-warning' style='margin-right: 5px; color:red'></i>Duplicate task</div>";
                                }

                                if (geo_falg == 0) {
                                    var geofance_flag = list_data[0].geofence[0].value;
                                    var param2 = "get_user_latlong_for_map('" + myArray[i].lat + "', '" + myArray[i].long + "')";
                                    var geofanceradius = parseInt(list_data[0].geofanceradius);
                                    var site_lat = myArray[i].lat;
                                    var site_long = myArray[i].long;
                                    var distance = getDistanceFromLatLonInMeter(user_lat, user_long, site_lat, site_long);
                                    distance = parseInt(distance);
                                    distance_desplay = distance;
                                    //distance = 0;

                                    // check for deleted media for task
                                    var dlt_media_chksht_type = '';
                                    var del_media_str = '';
                                    var is_delete_photo = myArray[i].is_delete_photo;
                                    if (is_delete_photo == "[]" || is_delete_photo == "null" || is_delete_photo == "Unknown" || is_delete_photo == null || is_delete_photo == undefined || is_delete_photo == "") { }
                                    else {
                                        var media_data = JSON.parse(is_delete_photo);
                                        if (media_data.length > 0) {
                                            var checksheet_name = media_data[0].c_name;
                                            dlt_media_chksht_type = media_data[0].checksheet_type;
                                            if (checksheet_name == '' || checksheet_name == null || checksheet_name == undefined) { }
                                            else {
                                                del_media_str += '<a style="width:97%"><details class="cls_remove">';
                                                if (media_data.length == 1) {
                                                    del_media_str += '<summary>media files missing in 1 step- Tap to view</summary><ul class="media_ui">';
                                                }
                                                else {
                                                    del_media_str += '<summary>media files missing in ' + media_data.length + ' steps - Tap to view</summary><ul class="media_ui">';
                                                }
                                                for (dm = 0; dm < media_data.length; dm++) {
                                                    var checksheet_name = media_data[dm].c_name;
                                                    var step_name = media_data[dm].s_name;
                                                    var que_name = media_data[dm].que_name;
                                                    del_media_str += '<li class="media_li"><span class="mk_rounded_number theme_login_info_div_content">' + (dm + 1) + '</span> ' + checksheet_name + ' > ' + step_name + ' > ' + que_name + '</li>';
                                                }
                                                del_media_str += '</ul></details></a>';
                                            }
                                        }
                                    }

                                    // check for deleted log for task
                                    var del_log_str = '';
                                    //var is_delete_log = '[{ "c_name": "Fuel Data", "s_name": "Fuel Data" }, { "c_name": "Demo Checksheet", "s_name": "Demo Step" }]';
                                    var is_delete_log = myArray[i].is_delete_log;
                                    if (is_delete_log == "[]" || is_delete_log == "null" || is_delete_log == "Unknown" || is_delete_log == null || is_delete_log == undefined || is_delete_log == "") { }
                                    else {
                                        var log_data = JSON.parse(is_delete_log);
                                        if (log_data.length > 0) {
                                            var checksheet_name = log_data[0].c_name;
                                            if (checksheet_name == '' || checksheet_name == null || checksheet_name == undefined) { }
                                            else {
                                                del_log_str += '<a style="width:97%"><details class="cls_remove">';
                                                if (log_data.length == 1) {
                                                    del_log_str += '<summary>log file missing in 1 step - Tap to view</summary><ul class="media_ui">';
                                                }
                                                else {
                                                    del_log_str += '<summary>log files missing in ' + log_data.length + ' steps - Tap to view</summary><ul class="media_ui">';
                                                }
                                                for (dm = 0; dm < log_data.length; dm++) {
                                                    var checksheet_name = log_data[dm].c_name;
                                                    var step_name = log_data[dm].s_name;
                                                    del_log_str += '<li class="media_li"><span class="mk_rounded_number theme_login_info_div_content">' + (dm + 1) + '</span> ' + checksheet_name + ' > ' + step_name + '</li>';
                                                }
                                                del_log_str += '</ul></details></a>';
                                            }
                                        }
                                    }

                                    // check for deleted sub task in sub flow
                                    var del_subflow_str = '';
                                    //var is_delete_sub = '[{ "module_id": "552", "module_name": "ELECTRICAL" }]';
                                    var is_delete_sub = myArray[i].is_delete_sub;
                                    if (is_delete_sub == "[]" || is_delete_sub == "null" || is_delete_sub == "Unknown" || is_delete_sub == null || is_delete_sub == undefined || is_delete_sub == "") { }
                                    else {
                                        var sub_data = JSON.parse(is_delete_sub);
                                        if (sub_data.length > 0) {
                                            var module_name = sub_data[0].module_name;
                                            if (module_name == '' || module_name == null || module_name == undefined) { }
                                            else {
                                                del_subflow_str += '<a style="width:97%"><details class="cls_remove">';
                                                if (sub_data.length == 1) {
                                                    del_subflow_str += '<summary>media files missing in 1 sub flow - Tap to view</summary><ul class="media_ui">';
                                                }
                                                else {
                                                    del_subflow_str += '<summary>media files missing in ' + sub_data.length + ' sub flows - Tap to view</summary><ul class="media_ui">';
                                                }
                                                for (dm = 0; dm < sub_data.length; dm++) {
                                                    var module_name = sub_data[dm].module_name;
                                                    del_subflow_str += '<li class="media_li"><span class="mk_rounded_number theme_login_info_div_content">' + (dm + 1) + '</span> ' + module_name + '</li>';
                                                }
                                                del_subflow_str += '</ul></details></a>';
                                            }
                                        }
                                    }

                                    // check for invalid log for task
                                    var valid_log_str = '';
                                    //var is_valid_log = '[{"c_name":"Demo Checksheet Name","s_name":"Demo Step Name","type":2,"que_id":91,"name":"Modules Fan"}, {"c_name":"Demo Checksheet Name1","s_name":"Demo Step Name1","type":2,"que_id":92,"name":"Modules Fan1"}]';
                                    var is_valid_log = myArray[i].is_valid_log;
                                    if (is_valid_log == "[]" || is_valid_log == "null" || is_valid_log == "Unknown" || is_valid_log == null || is_valid_log == undefined || is_valid_log == "") { }
                                    else {
                                        var log_data = JSON.parse(is_valid_log);
                                        if (log_data.length > 0) {
                                            var checksheet_name = log_data[0].c_name;
                                            dlt_media_chksht_type = log_data[0].checksheet_type;
                                            if (checksheet_name == '' || checksheet_name == null || checksheet_name == undefined) { }
                                            else {
                                                valid_log_str += '<a style="width:97%;"><details class="cls_remove">';
                                                if (log_data.length == 1) {
                                                    valid_log_str += '<summary>1 invalid log found - Tap to view</summary><ul class="media_ui">';
                                                }
                                                else {
                                                    valid_log_str += '<summary>' + log_data.length + ' invalid logs found - Tap to view</summary><ul class="media_ui">';
                                                }
                                                for (dm = 0; dm < log_data.length; dm++) {
                                                    var checksheet_name = log_data[dm].c_name;
                                                    var step_name = log_data[dm].s_name;
                                                    var cntrl_name = log_data[dm].name;
                                                    var que_id = log_data[dm].que_id;

                                                    valid_log_str += '<li class="media_li"><span class="mk_rounded_number theme_login_info_div_content">' + (dm + 1) + '</span> ' + checksheet_name + ' > ' + step_name + '</li>';
                                                    valid_log_str += '<li class="media_li" style="margin-left: 25px;padding:0 0 5px;line-height:14px;">' + ' > (' + que_id + ') ' + cntrl_name + '</li>';
                                                }
                                                valid_log_str += '</ul></details></a>';
                                            }
                                        }
                                    }

                                    if (dlt_media_chksht_type == "5") {
                                        // force edit due to delete media case
                                        var msg = 'Some media files may deleted from the device, please recapture and submit again!';
                                        var param = "redirect_on_task_edit_form(" + myArray[i].tid + ", '" + task_status + "', '" + msg + "')";
                                    }
                                    else if (response_status == 14) {
                                        // force edit due to task duplication
                                        var msg = 'Some details of this task may same as the previous one, please make appropriate changes and submit again!';
                                        var param = "redirect_on_task_edit_form(" + myArray[i].tid + ", '" + task_status + "', '" + msg + "')";
                                    }
                                    else if (task_clickable == 'false' || task_clickable == 'disable_all') {
                                        var param = clickable_param;
                                    }
                                    else {
                                        var user_column = list_data[0].user_column;
                                        if (user_column == "" || user_column == null || user_column == undefined) {
                                            if (geofance_flag == "true") {
                                                // geofence is true
                                                var alert_param = "alert_task_distance('" + distance + "','" + geofanceradius + "','" + user_accuracy + "','" + user_lat + "','" + user_long + "','" + site_lat + "','" + site_long + "', '" + myArray[i].site_name + "')";

                                                if (distance < (geofanceradius + user_accuracy)) {
                                                    var near_site = 1; // inside site radius
                                                    var param = "redirect_on_pm_site_click_PRE('" + myArray[i].siteid + "', '" + myArray[i].tid + "', '" + task_status + "','" + myArray[i].moduleid + "', '" + myArray[i].module_name + "', '" + myArray[i].site_name + "', '" + myArray[i].lat + "', '" + myArray[i].long + "','" + i + "', '" + encodeURIComponent(is_delete_photo) + "', '" + myArray[i].p_tid + "', '" + myArray[i].server_task_id + "','" + user_accuracy + "','" + geofanceradius + "', '" + myArray[i].survey_date + "')";
                                                } else {


                                                    var new_column_obj = {
                                                        "siteid": myArray[i].siteid,
                                                        "site_name": myArray[i].site_name,
                                                        "ser_task_id": myArray[i].server_task_id,
                                                        "start_status": task_status,
                                                        "module_id": myArray[i].moduleid,
                                                        "module_name": myArray[i].module_name,
                                                        "task_update": 1,
                                                        "site_lat": site_lat,
                                                        "site_long": site_long,
                                                        "survey_date": myArray[i].survey_date,
                                                        "ser_milli": 0
                                                    };
                                                    new_column_obj = JSON.stringify(new_column_obj);
                                                    var t_new_column_obj = encodeURIComponent(new_column_obj);

                                                    near_site = 0; // outside site radius
                                                    var param = "get_distance_confirmation_pm('" + myArray[i].siteid + "', '" + myArray[i].tid + "','" + myArray[i].moduleid + "', '" + myArray[i].module_name + "', '" + myArray[i].server_task_id + "', '" + myArray[i].site_name
                                                        + "','" + user_lat + "','" + user_long + "','" + user_accuracy + "','" + geofanceradius + "','" + site_lat + "','" + site_long + "','" + t_new_column_obj + "')";
                                                }

                                                if (near_site == 1) {
                                                    icon_str += '<i class="fa fa-check-circle cls_task_ico" style="font-size: 32px; color: #4caf50 !important" onclick="' + alert_param + '"></i>';
                                                } else {
                                                    icon_str += '<i class="fa fa-times-circle cls_task_ico" style="font-size: 32px; color: #f44336 !important" onclick="' + alert_param + '"></i>';
                                                }
                                            }
                                            else {
                                                var param = "redirect_on_pm_site_click('" + myArray[i].siteid + "', '" + myArray[i].tid + "', '" + task_status + "','" + myArray[i].moduleid + "', '" + myArray[i].module_name + "', '" + myArray[i].site_name + "', '" + myArray[i].lat + "', '" + myArray[i].long + "','" + i + "', '" + encodeURIComponent(is_delete_photo) + "', '" + myArray[i].p_tid + "')";
                                            }
                                        }
                                        else {
                                            //when user_column is defined to get another user lat long
                                            var user_column_obj = {
                                                "siteid": myArray[i].siteid,
                                                "tid": myArray[i].tid,
                                                "task_status": task_status,
                                                "module_id": myArray[i].moduleid,
                                                "module_name": myArray[i].module_name,
                                                "site_name": myArray[i].site_name,
                                                "lat": myArray[i].lat,
                                                "long": myArray[i].long,
                                                "index": i,
                                                "is_delete_photo": encodeURIComponent(is_delete_photo),
                                                "p_tid": myArray[i].p_tid
                                            };
                                            user_column_obj = JSON.stringify(user_column_obj);
                                            var t_user_column_obj = encodeURIComponent(user_column_obj);
                                            var param = "get_current_user_latlong('" + geofance_flag + "', '" + geofanceradius + "', '" + t_user_column_obj + "')";
                                        }
                                    }

                                    var st_found = 0;
                                    for (g = 0; g < status_array.length; g++) {
                                        if (task_status == status_array[g]) {
                                            // task belongs to flow status array
                                            st_found = 1;
                                            break;
                                        }
                                    }

                                    if (myArray[i].flag == 1 && flow_Array.length == 1 && st_found == 0) {
                                        // if status is not allowed then restrict click
                                        param = upload_param;
                                    }

                                    geo_falg++;

                                    list_item += '<li class="swipeout ' + cls_task_layout + '" value="' + rate + '" id ="lst_' + tid + '" style="background-color:' + back_color + '">' + dup_task_str + ' ' + upload_pending_str + ' ' + del_media_str + ' ' + del_log_str + ' ' + del_subflow_str + ' ' + valid_log_str + '<label class="label-checkbox item-content">';
                                    //list_item += '<img src="images/multicircle.svg" class="cloud-absolute" style="filter: invert(25%);">';

                                    var cloud_str = localStorage.getItem("cloud_str");
                                    list_item += cloud_str;

                                    // navigation map view
                                    if (navigation_type == "true") {
                                        icon_str += '<i class="fa fa-street-view cls_task_ico" style="font-size: 32px; margin-bottom:6px" onclick="' + param2 + '"></i>';
                                    }

                                    if (site_route == "true") {
                                        var latlong_str = JSON.stringify(multiple_LatLong_ary);
                                        latlong_str = encodeURIComponent(latlong_str);
                                        //var param_site_route = "plugin_call_for_site_route_map('" + latlong_str + "')";
                                        var ser_task_id = myArray[i].server_task_id;
                                        var param_site_route = "display_site_route_on_map('" + latlong_api + "', '" + ser_task_id + "', '" + latlong_str + "')";
                                        icon_str += '<i class="fa fa-map-marker cls_task_ico" style="font-size: 32px; margin-bottom:6px" onclick="' + param_site_route + '"></i>';
                                    }

                                    // check for pdf download option
                                    if (pdf_site_list == 'true') {
                                        var param_pdf = "Generate_PDFFile('" + myArray[i].server_task_id + "')";
                                        icon_str += '<i class="fa fa-file-pdf-o cls_task_ico" style="font-size: 32px; margin-bottom:4px" onclick="' + param_pdf + '"></i>';
                                    }

                                    if (weather_display == 'true') {
                                        var param_weather = "view_weather_for_site('" + myArray[i].lat + "', '" + myArray[i].long + "')";
                                        icon_str += '<i class="fa fa-cloud cls_task_ico" style="font-size: 30px" onclick="' + param_weather + '"></i>';
                                    }

                                    if (customer_info == 'true') {
                                        var customer_id = myArray[i].siteid;
                                        if (customer_id == 0) { }
                                        else {
                                            var param_cust_info = "view_customer_detail_task('" + customer_id + "')";
                                            icon_str += '<i class="fa fa-info-circle cls_task_ico" style="font-size: 32px" onclick="' + param_cust_info + '"></i>';
                                        }
                                    }

                                    if (CommentUI == 'true') {
                                        var param_commentUI = "get_sub_tasks('" + myArray[i].server_task_id + "')";
                                        icon_str += '<i class="fa fa-comments cls_task_ico" style="font-size: 30px; margin-bottom:4px" onclick="' + param_commentUI + '"></i>';
                                    }

                                    list_item += '<input type="checkbox" name="li_chk" value="' + myArray[i].server_task_id + '" onchange="get_selected_chk_count()"><div class="item-media li_no_chk"><i class="icon icon-form-checkbox"></i></div>';
                                    list_item += '<div class="item-inner item-no-pad" style="padding-right:7px!important;" onclick ="' + param + '"><div class="item-title" style="width: 100%;">';
                                }
                            }

                            var system_var = Panding_que_id_json[p].system_var;
                            if (system_var == '' || system_var == null || system_var == undefined) {
                                var multiflow_list = list_data[0].multiflow_list;
                                if (multiflow_list == '' || multiflow_list == null || multiflow_list == undefined) {
                                    if (tid == myArray[i].tid && checksheetID == myArray[i].c_id && step == myArray[i].step) {
                                        position_flag++;
                                        var f_data = myArray[i].f_data;
                                        f_data = itemObj._checkStrObj(f_data);  		// check_item
                                        data = itemObj._checkStrObj(f_data[0].data);  		// check_item
                                        break;
                                    }
                                }
                                else {
                                    //custom development for offline multiflow task ---ATC multirole(26032019)
                                    if (tid == myArray[i].tid && (checksheetID == myArray[i].c_id || myArray[i].c_id == '5002' || myArray[i].c_id == '5003' || myArray[i].c_id == '5004') && step == myArray[i].step) {
                                        position_flag++;
                                        var f_data = myArray[i].f_data;
                                        f_data = itemObj._checkStrObj(f_data);  		// check_item
                                        data = itemObj._checkStrObj(f_data[0].data);  		// check_item
                                        break;
                                    }
                                }

                                if (i == myArray.length - 1 && position_flag == 0) {
                                    test_position_flag = 1;
                                }
                            }
                            else {
                                if (tid == myArray[i].tid) {
                                    var system_var_Array = [];
                                    var company_id = window.storage.getItem('company_id');
                                    var user_id = window.storage.getItem('user_id');
                                    var module_id = JSON.parse(window.storage.getItem('wayflow'));
                                    var module_name = JSON.parse(window.storage.getItem('wayflow_name'));
                                    var role_id = window.storage.getItem('role_id');
                                    var role_name = window.storage.getItem('role_name');
                                    var circle_id = window.storage.getItem('circle_id');
                                    var circle_name = window.storage.getItem('circle_name');
                                    system_var_Array["company_id"] = company_id;
                                    system_var_Array["user_id"] = user_id;
                                    system_var_Array["module_id"] = module_id;
                                    system_var_Array["module_name"] = module_name;
                                    system_var_Array["role_id"] = role_id;
                                    system_var_Array["role_name"] = role_name;
                                    system_var_Array["circle_id"] = circle_id;
                                    system_var_Array["circle_name"] = circle_name;
                                    system_var_Array["task_id"] = myArray[i].server_task_id;

                                    var ans_lable = system_var_Array[system_var];
                                    if (ans_lable == "" || ans_lable == null || ans_lable == undefined) {
                                        ans_lable = "";
                                    }

                                    if (F7_device == 'ios') {
                                        ans_lable = ans_lable.toString();
                                    }
                                    ans_lable = ans_lable.replace(/['"]+/g, '');

                                    // colwise table here
                                    if (colwise_align == 'true' && tbl_counter == 0) {
                                        list_item += '<table class="swipeout-content" style="width: 100% !important;vertical-align: top !important;">';
                                        tbl_counter = 1;
                                    }
                                    else if (colwise_align == 'false' && tbl_counter == 0) {
                                        list_item += '<table class="swipeout-content" style="width: 100% !important;vertical-align: top !important;">';
                                        tbl_counter = 1;
                                    }

                                    if (colwise_align == 'true') {
                                        if ((p) % 2 == 0) {
                                            var text_align = "text-align: left;";
                                            list_item += '<tr>';
                                        }
                                        else {
                                            if (taskview_label == "true") {
                                                var text_align = "text-align: left;";
                                            }
                                            else {
                                                var text_align = "text-align: right;";
                                            }
                                        }

                                        if (format == "bold") {
                                            var font_format = "font-weight: bold;";
                                        }
                                        else if (format == "italic") {
                                            var font_format = "font-style: italic;"
                                        }
                                        else {
                                            var font_format = "";
                                        }

                                        list_item += '<td style="' + text_align + 'width: 50% !important; vertical-align: top;"><div class="item-title cls_disp_blk" style="color:' + color + ';font-size:' + font_size + 'pt;"><b>' + header + '</b><div class="text-break cls_search cls_disp_blk" style="' + font_format + '">' + ans_lable + '</div></div></td>';
                                        if ((p) % 2 == 0) { }
                                        else {
                                            list_item += '</tr>';
                                        }
                                        break;
                                    }
                                    else {
                                        if (taskview_align == "left") {
                                            var text_align = 'text-align: left;';
                                        }
                                        else {
                                            var text_align = 'text-align: right;';
                                        }

                                        list_item += '<tr>';
                                        if (format == 'italic') {
                                            list_item += '<td style="' + text_align + 'width: 50% !important; vertical-align: top;font-size:' + font_size + 'pt; font-style:' + format + '; color:' + color + '; font-weight:bold" >'
                                                + header + '</td><td style="' + text_align + 'width: 50% !important; vertical-align: top;font-size:' + font_size + 'pt; font-style:' + format + '; color:' + color + '" class="cls_search">' + ans_lable + '</td>';
                                        } else {
                                            list_item += '<td style="' + text_align + 'width: 50% !important; vertical-align: top;font-size:' + font_size + 'pt; text-decoration:' + format + '; color:' + color + '; font-weight:bold" >'
                                                + header + '</td><td style="' + text_align + 'width: 50% !important; vertical-align: top;font-size:' + font_size + 'pt; text-decoration:' + format + '; color:' + color + '" class="cls_search">' + ans_lable + '</td>';
                                        }
                                        list_item += '</tr>';
                                        break;
                                    }
                                }
                            }
                        }

                        var flag_test_fdata = 0;
                        var test_r = 0;

                        if (data.length > 0) {
                            flag_test_fdata = 1;
                            var row_flag = 0;
                            for (var q = 0; q < data.length; q++) {
                                var que_id = data[q].que_id;
                                if (qid == que_id) {
                                    var prop = data[q].prop;
                                    if (prop == "" || prop == null || prop == undefined) {
                                        prop = '';
                                    }
                                    else {
                                        var name = data[q].prop[0].name;
                                    }
                                    var type = data[q].type;
                                    if ((name == 'Priority' || Panding_que_id_json[p].header == "Priority") && type == 3) {
                                        old_priority = data[q].ans[0];
                                        priority_found = 1;
                                    }
                                    else {
                                        priority_found = 0;
                                    }

                                    if (data[q].type == "20" || data[q].type == "21" || data[q].type == "8") {
                                        var ans_lable = data[q].ans[0];
                                    } else if (data[q].type == "22") {
                                        var json_inv_calc = itemObj._checkStrObj(data[q].ans[0]);  		// check_item
                                        var sum_finaljson = json_inv_calc[0].sum_finaljson;
                                        //alert1("sum_finaljson :" + JSON.stringify(sum_finaljson));
                                        for (m = 0; m < sum_finaljson.length; m++) {
                                            var ans_lable = sum_finaljson[m].txt_sum_value;
                                            if (ans_lable == "" || ans_lable == null || ans_lable == undefined) {
                                                var ans_lable = "Sum Not Available!";
                                            } else {
                                                break;
                                            }
                                        }
                                    } else {
                                        var ans_lable = data[q].ans[0];
                                    }

                                    ans_lable = ans_lable.toString();
                                    ans_lable = ans_lable.replace(/,/g, ";");   // address issue in atc

                                    //var type = data[q].type;
                                    //if (type == '8') {
                                    //    ans_lable = convert_to_view_date_F7(ans_lable);
                                    //}

                                    var t_header = Panding_que_id_json[p].header;
                                    var header_sys_str = t_header.replace(': ', '');
                                    if (header_sys_str == 'Site Age') {
                                        var curr_dt = new Date();
                                        var assign_dt = new Date(ans_lable);
                                        var diffDays = parseInt((curr_dt - assign_dt) / (1000 * 60 * 60 * 24));
                                        ans_lable = diffDays + ' days';
                                    }

                                    type20_columndata.push({
                                        header: header_sys_str,
                                        ans: ans_lable
                                    });

                                    filter_ddl_Array.push({
                                        header: header_sys_str,
                                        ans: ans_lable
                                    });

                                    // table here
                                    if (colwise_align == 'true' && tbl_counter == 0) {
                                        list_item += '<table class="swipeout-content" style="width: 100% !important;vertical-align: top !important;">';
                                        tbl_counter = 1;
                                    }
                                    else if (colwise_align == 'false' && tbl_counter == 0) {
                                        list_item += '<table class="swipeout-content" style="width: 100% !important;vertical-align: top !important;">';
                                        tbl_counter = 1;
                                    }

                                    if (colwise_align == 'true') {
                                        if ((p) % 2 == 0) {
                                            var text_align = "text-align: left;";
                                            list_item += '<tr>';
                                        }
                                        else {
                                            if (taskview_label == "true") {
                                                var text_align = "text-align: left;";
                                            }
                                            else {
                                                var text_align = "text-align: right;";
                                            }
                                        }

                                        if (format == "bold") {
                                            var font_format = "font-weight: bold;"
                                        }
                                        else if (format == "italic") {
                                            var font_format = "font-style: italic;"
                                        }
                                        else {
                                            var font_format = ""
                                        }

                                        if (priority_found == 0) {
                                            if (format == 'italic') {
                                                list_item += '<td style="' + text_align + 'width: 50% !important; vertical-align: top;"><div class="item-title cls_disp_blk" style="color:' + color + ';font-size:' + font_size + 'pt;"><b>' + header + '</b><div class="text-break cls_search cls_disp_blk" style="' + font_format + '">' + ans_lable + '</div></div></td>';
                                            }
                                            else {
                                                list_item += '<td style="' + text_align + 'width: 50% !important; vertical-align: top;"><div class="item-title cls_disp_blk" style="color:' + color + ';font-size:' + font_size + 'pt;"><b>' + header + '</b><div class="text-break cls_search cls_disp_blk">' + ans_lable + '</div></div></td>';
                                            }
                                        }
                                        else {
                                            if (old_priority == '' || old_priority == null || old_priority == undefined) {
                                                old_priority = 'Select';
                                            }
                                            var param_priority = "change_option_priority('#priority_ddl_" + i + "','" + myArray[i].siteid + "', '" + myArray[i].tid + "', '" + tid_Array.toString() + "')";

                                            list_item += '<td style="' + text_align + 'width: 50% !important; vertical-align: top;">';
                                            list_item += '<div class="item-title cls_disp_blk" style="color:' + color + ';font-size:' + font_size + 'pt;"><b>' + header + '</b>';
                                            list_item += '<div class="text-break cls_search cls_disp_blk">';

                                            if (text_align == "text-align: right;") {
                                                var float_align = 'float: right !important;';
                                            }
                                            else {
                                                var float_align = '';
                                            }

                                            if (back_color == '#e6e6e6') {
                                                var priority_disable = 'disabled="disabled"';
                                            }
                                            else {
                                                var priority_disable = '';
                                            }

                                            list_item += '<select id="priority_ddl_' + i + '" class="cls_fence" onChange="' + param_priority
                                                + '" style="' + float_align + 'width: 80px; display: inline-block; border:1px solid #ccc; border-radius: 15px; padding: 0px 5px; height:25px; margin-left:5px !important; font-size:9pt; -webkit-appearance: menulist" ' + priority_disable + '>';

                                            if (old_priority == 'Select') {
                                                list_item += '<option select="selected">Select</option>';
                                                var lastChar = '';
                                            } else {
                                                list_item += '<option>Select</option>';
                                                var lastChar = old_priority.substr(old_priority.length - 1);
                                            }

                                            for (j = 1; j <= myArray.length; j++) {
                                                if (lastChar == j) {
                                                    list_item += '<option selected="selected">P' + j + '</option>';
                                                } else {
                                                    list_item += '<option>P' + j + '</option>';
                                                }
                                            }

                                            list_item += '</select>';
                                            list_item += '</div></div></td>';
                                        }

                                        if ((p) % 2 == 0) { }
                                        else {
                                            list_item += '</tr>';
                                        }
                                    }
                                    else {
                                        //***********
                                        if (taskview_align == "left") {
                                            var text_align = 'text-align: left;';
                                        }
                                        else {
                                            var text_align = 'text-align: right;';
                                        }

                                        if (format == "bold") {
                                            var font_format = "font-weight: bold;";
                                        }
                                        else if (format == "italic") {
                                            var font_format = "font-style: italic;";
                                        }
                                        else {
                                            var font_format = "";
                                        }

                                        var dd_border_color = $('.navbar').css('background-color');
                                        var company_id = JSON.parse(window.storage.getItem('company_id'));

                                        if (border == "true") {
                                            if (flow_Array.length > 1 && p == 0) {
                                                var round_border = "border: solid 1px " + dd_border_color + " !important;border-radius: 10px;padding: 2px 4px;";
                                            }
                                            else {
                                                var round_border = "border: solid 1px " + dd_border_color + " !important;border-radius: 10px;padding: 2px 4px; position: absolute; right: 0;top: 0;";
                                            }
                                        }
                                        else {
                                            var round_border = "";
                                        }

                                        list_item += '<tr>';
                                        if (priority_found == 0) {
                                            if (taskview_label == "hybrid") {
                                                list_item += '<td colspan=2 class="cls_search" style="' + text_align + 'padding-top: 1px ;vertical-align: top;font-size:' + font_size + 'pt; ' + font_format + ' color:'
                                                    + color + ';" ><label style="' + round_border + '">' + header + ans_lable + '</label></td>';
                                            }
                                            else {
                                                if (format == 'italic') {
                                                    list_item += '<td style="' + text_align + 'width: 50% !important; vertical-align: top;font-size:' + font_size + 'pt; ' + font_format + ' color:' + color
                                                        + '; font-weight:bold" >' + header + '</td><td style="' + text_align + 'width: 50% !important; vertical-align: top;font-size:' + font_size + 'pt; font-style:'
                                                        + format + '; color:' + color + '" class="cls_search">' + ans_lable + '</td>';
                                                } else {
                                                    list_item += '<td style="' + text_align + 'width: 45% !important; vertical-align: top;font-size:' + font_size + 'pt; ' + font_format + ' color:'
                                                        + color + '; font-weight:bold" >' + header + '</td><td style="' + text_align + 'width: 45% !important; vertical-align: top;font-size:'
                                                        + font_size + 'pt; text-decoration:' + format + '; color:' + color + '" class="cls_search">' + ans_lable + '</td>';
                                                }
                                            }
                                        }
                                        else {
                                            if (old_priority == '' || old_priority == null || old_priority == undefined) {
                                                old_priority = 'Select';
                                            }
                                            var param_priority = "change_option_priority('#priority_ddl_" + i + "','" + myArray[i].siteid + "', '" + myArray[i].tid + "', '" + tid_Array.toString() + "')";

                                            list_item += '<td colspan=2 style="' + text_align + 'width: 50% !important; vertical-align: top;">';

                                            if (text_align == "text-align: right;") {
                                                var float_align = 'float: right !important;'
                                            }
                                            else {
                                                var float_align = ''
                                            }

                                            if (back_color == '#e6e6e6') {
                                                var priority_disable = 'disabled="disabled"';
                                            }
                                            else {
                                                var priority_disable = '';
                                            }

                                            list_item += '<div style="position: absolute; right: 85px; top: 0;width: 45px; display: inline-block;border:1px solid ' + dd_border_color + ' !important; border-radius: 15px; padding: 2px 7px 0px 5px; height:20px; margin-left:5px !important; font-size:'
                                                + font_size + 'pt;"><b>Option' + (t + 1) + '</b></div>';

                                            list_item += '<select id="priority_ddl_' + i + '" class="cls_fence button button-fill button-raised" onChange="' + param_priority
                                                + '" style="position: absolute; right: 0 !important; top: 0;' + float_align + 'width: 80px; display: inline-block; border:1px solid #ccc; border-radius: 15px; padding: 0px 5px; height:25px; margin-left:5px !important; font-size:' + font_size + 'pt; -webkit-appearance: menulist" ' + priority_disable + '>';

                                            if (old_priority == 'Select') {
                                                list_item += '<option select="selected">Select</option>';
                                                var lastChar = '';
                                            } else {
                                                list_item += '<option>Select</option>';
                                                var lastChar = old_priority.substr(old_priority.length - 1);
                                            }

                                            for (j = 1; j <= myArray.length; j++) {
                                                if (lastChar == j) {
                                                    list_item += '<option selected="selected">P' + j + '</option>';
                                                } else {
                                                    list_item += '<option>P' + j + '</option>';
                                                }
                                            }

                                            list_item += '</select>';
                                            list_item += '</td>';
                                        }
                                        list_item += '</tr>';
                                    }

                                    row_flag++;
                                    break;
                                }
                            }
                            test_r++;
                        }
                        if (test_r == "0" && test_position_flag == "1") {
                            // table here
                            if (tbl_counter == 0) {
                                list_item += '<table class="swipeout-content" style="width: 100% !important;vertical-align: top !important;">';
                                tbl_counter = 1;
                            }

                            if (colwise_align == "true") {
                                if ((p) % 2 == 0) {
                                    var text_align = "text-align: left;";
                                    list_item += '<tr>';
                                }
                                else {
                                    if (taskview_label == "true") {
                                        var text_align = "text-align: left;";
                                    }
                                    else {
                                        var text_align = "text-align: right;";
                                    }
                                }
                                list_item += '<td style="' + text_align + 'width: 45% !important; vertical-align: top;font-size:' + font_size + 'pt; font-style:' + format + '; color:'
                                    + color + '; font-weight:bold" ><div class="item-title cls_disp_blk">' + header + '</div><div class="text-break cls_search cls_disp_blk" style="font-weight: normal;color:' + color + ';font-size:' + font_size + 'pt;">No Data Avilable !</div></td>';
                                if ((p) % 2 == 0) { }
                                else {
                                    list_item += '</tr>';
                                }
                                no_data_found++;
                            }
                            else {
                                list_item += '<tr>';
                                list_item += '<td style="width: 45% !important; vertical-align: top;font-size:' + font_size + 'pt; font-style:' + format + '; color:'
                                    + color + '; font-weight:bold" >' + header + '</td><td style="width: 45% !important; vertical-align: top;text-align: right;font-size:' + font_size + 'pt; font-style:' + format + '; color:'
                                    + color + '; ">No Data Avilable !</td>';
                                list_item += '</tr>';
                                no_data_found++;
                            }
                        }

                        //store task_list html
                        try {
                            list_item += '<input type="hidden" id="hdn_lst_html_' + myArray[i].tid + '" value="' + encodeURIComponent(myArray[i].list_html) + '">';
                        } catch (e) { }
                    }

                    tbl_counter = 0;
                    var geofance_flag = list_data[0].geofence[0].value;
                    var geofance_distance = list_data[0].geofence[0].show_distance;
                    if (geofance_distance == 'true') {
                        //list_item += '<label style="font-size:10pt"><b>Distance</b> : ' + distance_desplay + ' m</label><br>';
                        if (taskview_label == "false" || taskview_label == "hybrid") {
                            var dist_header = '';
                            font_size = '11';
                        }
                        else {
                            var dist_header = 'Distance: ';
                            font_size = '9';
                        }
                        if (colwise_align == 'true') {
                            if (Panding_que_id_json.length % 2 == 0) {
                                var text_align = "text-align: left;";
                                list_item += '<tr>'
                            }
                            else {
                                if (taskview_label == "true") {
                                    var text_align = "text-align: left;";
                                }
                                else {
                                    var text_align = "text-align: right;";
                                }
                            }
                            list_item += '<td style="' + text_align + 'width: 50% !important; vertical-align: top;"><div class="item-title cls_disp_blk" style="color:' + color + ';font-size:' + font_size + 'pt;"><b>' + dist_header + '</b><div class="text-break cls_search cls_disp_blk">' + distance_desplay + ' m</div></div></td>';
                            list_item += '</tr>';
                        }
                        else {
                            if (Panding_que_id_json.length % 2 == 0) {
                                var text_align = "text-align: left;";
                            }
                            else {
                                if (taskview_label == "true") {
                                    var text_align = "text-align: left;";
                                }
                                else {
                                    var text_align = "text-align: right;";
                                }
                            }
                            list_item += '<tr>';
                            list_item += '<td style="' + text_align + 'font-size:' + font_size + 'pt; text-decoration:' + format + '; color:' + color + ';"><b>' + dist_header + '</b></td><td style="' + text_align + 'font-size:' + font_size + 'pt; text-decoration:' + format + '; color:' + color + '" class="cls_search">' + distance_desplay + ' m</td>';
                            list_item += '</tr>';
                        }

                    }

                    if (colwise_align == 'true') {
                        list_item += '</table>';
                    }
                    else {
                        list_item += '</table>';
                    }

                    if (back_color == "" || back_color == null || back_color == undefined) {
                        back_color = "white";
                    }
                    var showmore_back_color = back_color.replace(/['"]+/g, '');

                    list_item += '<span class="readmore-link" onclick="show_more_task_data(this);event.cancelBubble=true;" style="background-image: linear-gradient(to bottom, transparent, ' + showmore_back_color + ');display:none;"><div class="showmore-box">Show More <i class="fa fa-angle-down"></i></div></span>';

                    var trip_str = '';
                    
                    let trip_found = 0;
                    if (trip_New_Array.length > 0) {
                        for (let t = 0; trip_New_Array.length; t++) {
                            let trip_tid = trip_New_Array[t].tid;
                            if (trip_tid == tid) {
                                trip_found = 1;
                                break;
                            }
                        }
                    }

                    if (trip_found == 1) {
                        if (company_id == 1502) {
                            trip_str = '<i class="fa fa-motorcycle fa-flip-horizontal cls_task_ico" style="font-size: 22px"></i>';
                        }
                        else {
                            trip_str = '<i class="fa fa-car cls_task_ico" style="font-size: 22px"></i>';
                        }
                        icon_str += trip_str;
                    }

                    if (icon_str == "" || icon_str == null || icon_str == undefined) {
                        list_item += '</div></div>';
                        list_item += '</label>';
                    }
                    else {
                        if (task_layout == "cardview") {
                            list_item += '</div></div>';
                            list_item += '</label><div class="item-after" style="padding-top: 15px;width:95%;"><div class="item-icon task-icon" style="width:95%;text-align:center !important;">' + icon_str + '</div></div>';
                        }
                        else {
                            list_item += '</div><div class="item-after" style="padding-top: 6px;"><div class="item-icon">' + icon_str + '</div></div></div>';
                            list_item += '</label>';
                        }
                    }

                    /////////---shortcut buttons---//////////
                    var buttons = list_data[0].buttons;
                    //var buttons = [];
                    var btn_count = 0;
                    if (buttons == '' || buttons == null || buttons == undefined || buttons.length == 0) { }
                    else {
                        var task_btn_str = '<div class="buttons-row" style="margin: 0px 15px;padding-bottom:0px;width:90% !important;display:block;">';
                        var btn_len = buttons.length;

                        task_btn_str += '<table style="width: 100%;"><tr>';

                        for (b = 0; b < btn_len; b++) {
                            var enabled = false;
                            var placement = buttons[b].placement;
                            if (placement == 'task' || placement == 'all') {
                                var view_dependancy = buttons[b].view_dependancy;
                                if (view_dependancy == 'always') { enabled = true; }
                                else if (view_dependancy == 'status') {
                                    var dependancy_status = buttons[b].dependancy_status;
                                    var dlen = dependancy_status.length
                                    //var t_status = myArray[i].status;
                                    var t_status = task_status;
                                    for (s = 0; s < dlen; s++) {
                                        if (dependancy_status[s] == t_status) {
                                            enabled = true;
                                            break;
                                        }
                                    }
                                }

                                if (enabled == true) {
                                    var submit_message = buttons[b].submit_message;
                                    var sb_trip = buttons[b].trip;

                                    if (task_clickable == 'disable_all') {
                                        var param_btn = clickable_param;
                                    }
                                    else {
                                        var param_btn = "update_task_by_shortcut_button('" + buttons[b].checksheet_id + "','" + buttons[b].status + "','" + myArray[t].siteid + "', '" + myArray[t].tid + "', '" + task_status + "','"
                                            + myArray[t].moduleid + "', '" + myArray[t].module_name + "', '" + myArray[t].site_name + "', '" + myArray[t].server_task_id + "', '" + myArray[t].lat + "', '" + myArray[t].long + "', '" + myArray[t].survey_date + "', '" + myArray[t].survey_ms + "', '" + submit_message + "', '" + sb_trip + "')";
                                    }

                                    if (buttons[b].checksheet_id == 0) {
                                        var sb_icon = "fa-paper-plane";
                                    }
                                    else {
                                        var sb_icon = "fa-share-square-o";
                                    }

                                    if (btn_count % 2 == 0) {
                                        var margin_left = "margin-left: 0px;"
                                    }
                                    else {
                                        var margin_left = "margin-left: 10px !important;"
                                    }

                                    if (btn_count % 2 == 0 && btn_count != 0) {
                                        task_btn_str += '</tr><tr>';
                                    }

                                    //var type20_columndata = JSON.parse(storage.getItem('type20_columndata'));
                                    //if (type20_columndata == '' || type20_columndata == null || type20_columndata == undefined) {
                                    //    type20_columndata = [];
                                    //}
                                    //task_btn_str += '<input type="hidden" id="lst_sys_var_' + myArray[i].server_task_id + '" value="' + encodeURIComponent(JSON.stringify(type20_columndata)) + '">'

                                    //display SB with full width [07092020]
                                    task_btn_str += '<td style="width:50%;"><a class="button button-fill button-raised cls_fence" onclick="' + param_btn + '" style="margin:0;display: inline-block;' + margin_left + '">';
                                    //task_btn_str += '<i class="fa ' + sb_icon + '" style="font-size: 20px;display: inline-block; color: #fff !important;vertical-align: middle;margin-right: 10px !important;"></i>' + buttons[b].name + '</a>';
                                    task_btn_str += buttons[b].name + '</a></td>';
                                    btn_count++;
                                }
                            }
                        }

                        task_btn_str += '</tr><table>';
                        task_btn_str += '</div>';
                        if (btn_count > 0) {
                            list_item += task_btn_str;
                        }
                    }
                    //////////////

                    // store system var
                    list_item += '<input type="hidden" id="lst_sys_var_' + tid + '" value="' + encodeURIComponent(JSON.stringify(type20_columndata)) + '">';
                    type20_columndata = [];

                    // //--- sub task remove icon ----///////
                    //var flow_Array = JSON.parse(storage.getItem('flow_Array'));
                    //if (flow_Array.length > 1 && task_removable == 'true') {
                    //    var param_remove_sub = "remove_last_subtask('" + myArray[i].tid + "')";
                    //    list_item += '<div style="display:none" class="swipeout-actions-right" id="img_remove_' + t + '"><a href="#" class="swipeout-delete cls_remove" onclick ="' + param_remove_sub + '">Delete</a></div>';
                    //}


                    //------task remove-----------
                    var task_remove_str = '';
                    if (task_removable == 'true') {
                        var param_remove_sub = "remove_last_subtask('" + tid + "')";
                        task_remove_str += '<a  id="img_remove_' + t + '" href="#" class="swipeout-delete cls_remove" onclick ="' + param_remove_sub + '">Delete</a>';
                    }

                    //------task edit-----------
                    var task_edit_str = '';
                    if (task_editable == "true") {
                        var param_edit_task = "redirect_on_task_edit_form(" + tid + ", '" + task_status + "','')";
                        task_edit_str += '<a id="btn_task_edit_' + tid + '"  onclick="' + param_edit_task + '" style="transform: translate3d(0, 0px, 0px);">Edit</a>';
                    }

                    if (task_editable == 'true' || task_removable == 'true') {
                        list_item += '<div class="swipeout-actions-right" style="right: 0% !important;">';
                        list_item += task_edit_str;
                        list_item += task_remove_str;
                        list_item += '</div>';
                    }

                    // display task info on swipe to right
                    var info_param = "view_task_details_from_task_master('', " + tid + ")";
                    list_item += '<div class="swipeout-actions-left">';
                    list_item += '<a href="#" class="action1" onclick="' + info_param + '">Details</a>';
                    list_item += '</div>';

                    list_item += '</li>';
                    $("#site_list").append(list_item);

                    var count = t + 1;
                    //if (count == tid_Array.length) {
                    $("#img_remove_" + t + "").show();
                    $("#site_list").find('li').addClass("swipeout");
                    //$("#site_list > li").last().addClass("swipeout");
                    //}

                    $('.cls_remove').click(function (event) {
                        event.stopPropagation();
                    });

                    $('.cls_fence').click(function (event) {
                        event.stopPropagation();
                    });
                    $('.cls_task_ico').click(function (event) {
                        event.stopPropagation();
                    });
                } else {
                    // static data available
                    var tid = tid_Array[t];
                    for (var j = 0; j < myArray.length; j++) {
                        if (tid == myArray[j].tid) {
                            var response_status = myArray[j].response_status;

                            if (myArray[j].status == 2 || (myArray[j].rate == 2 && flow_Array.length > 1)) {
                                var back_color = '#e6e6e6';
                            } else {
                                var back_color = 'white';
                            }

                            var upload_pending_str = '';
                            if (upload_pending_display != "false") {
                                if (myArray[j].rate == 2 && myArray[j].flag == 1) {
                                    // upload pending task
                                    upload_pending_str += "<a style='width:97%'><details class='cls_remove' style='border-top: 1px solid #32cd32; border-bottom: 1px solid #32cd32;'><summary style='color:#32cd32'>Task is uploading...</summary></details></a>";
                                    upload_pending_count++;
                                }
                            }

                            // check for deleted media for task
                            var dlt_media_chksht_type = '';
                            var del_media_str = '';
                            //var is_delete_photo = '[{ "c_name": "Fuel Data", "s_name": "Fuel Data" }]';
                            var is_delete_photo = myArray[j].is_delete_photo;
                            if (is_delete_photo == "[]" || is_delete_photo == "null" || is_delete_photo == "Unknown" || is_delete_photo == null || is_delete_photo == undefined || is_delete_photo == "") { }
                            else {
                                var media_data = JSON.parse(is_delete_photo);
                                if (media_data.length > 0) {
                                    var checksheet_name = media_data[0].c_name;
                                    dlt_media_chksht_type = media_data[0].checksheet_type;
                                    if (checksheet_name == '' || checksheet_name == null || checksheet_name == undefined) { }
                                    else {
                                        del_media_str += '<a style="width:97%"><details class="cls_remove">';
                                        if (media_data.length == 1) {
                                            del_media_str += '<summary>media files missing in 1 step - Tap to view</summary><ul class="media_ui">';
                                        }
                                        else {
                                            del_media_str += '<summary>media files missing in ' + media_data.length + ' steps - Tap to view</summary><ul class="media_ui">';
                                        }
                                        for (dm = 0; dm < media_data.length; dm++) {
                                            var checksheet_name = media_data[dm].c_name;
                                            var step_name = media_data[dm].s_name;
                                            var que_name = media_data[dm].que_name;
                                            del_media_str += '<li class="media_li"><span class="mk_rounded_number theme_login_info_div_content">' + (dm + 1) + '</span> ' + checksheet_name + ' > ' + step_name + ' > ' + que_name + '</li>';
                                        }
                                        del_media_str += '</ul></details></a>';
                                    }
                                }
                            }

                            // check for deleted log for task
                            var del_log_str = '';
                            //var is_delete_log = '[{ "c_name": "Fuel Data", "s_name": "Fuel Data", "checksheet_type": "5" }]';
                            var is_delete_log = myArray[j].is_delete_log;
                            if (is_delete_log == "[]" || is_delete_log == "null" || is_delete_log == "Unknown" || is_delete_log == null || is_delete_log == undefined || is_delete_log == "") { }
                            else {
                                var log_data = JSON.parse(is_delete_log);
                                if (log_data.length > 0) {
                                    var checksheet_name = log_data[0].c_name;
                                    if (checksheet_name == '' || checksheet_name == null || checksheet_name == undefined) { }
                                    else {
                                        del_log_str += '<a style="width:97%"><details class="cls_remove">';
                                        if (log_data.length == 1) {
                                            del_log_str += '<summary>log files missing in 1 checksheet - Tap to view</summary><ul class="media_ui">';
                                        }
                                        else {
                                            del_log_str += '<summary>log files missing in ' + log_data.length + ' checksheets - Tap to view</summary><ul class="media_ui">';
                                        }
                                        for (dm = 0; dm < log_data.length; dm++) {
                                            var checksheet_name = log_data[dm].c_name;
                                            var step_name = log_data[dm].s_name;
                                            del_log_str += '<li class="media_li"><span class="mk_rounded_number theme_login_info_div_content">' + (dm + 1) + '</span> ' + checksheet_name + ' > ' + step_name + '</li>';
                                        }
                                        del_log_str += '</ul></details></a>';
                                    }
                                }
                            }

                            // check for deleted sub task in sub flow
                            var del_subflow_str = '';
                            //var is_delete_sub = '[{ "module_id": "552", "module_name": "ELECTRICAL" }]';
                            var is_delete_sub = myArray[j].is_delete_sub;
                            if (is_delete_sub == "[]" || is_delete_sub == "null" || is_delete_sub == "Unknown" || is_delete_sub == null || is_delete_sub == undefined || is_delete_sub == "") { }
                            else {
                                var sub_data = JSON.parse(is_delete_sub);
                                if (sub_data.length > 0) {
                                    var module_name = sub_data[0].module_name;
                                    if (module_name == '' || module_name == null || module_name == undefined) { }
                                    else {
                                        del_subflow_str += '<a style="width:97%"><details class="cls_remove">';
                                        if (sub_data.length == 1) {
                                            del_subflow_str += '<summary>media files missing in 1 sub flow - Tap to view</summary><ul class="media_ui">';
                                        }
                                        else {
                                            del_subflow_str += '<summary>media files missing in ' + sub_data.length + ' sub flows - Tap to view</summary><ul class="media_ui">';
                                        }
                                        for (dm = 0; dm < sub_data.length; dm++) {
                                            var module_name = sub_data[dm].module_name;
                                            del_subflow_str += '<li class="media_li"><span class="mk_rounded_number theme_login_info_div_content">' + (dm + 1) + '</span> ' + module_name + '</li>';
                                        }
                                        del_subflow_str += '</ul></details></a>';
                                    }
                                }
                            }

                            // check for invalid log for task
                            var valid_log_str = '';
                            //var is_valid_log = '[{"c_name":"Demo Checksheet Name","s_name":"Demo Step Name","type":2,"que_id":91,"name":"Modules Fan"}, {"c_name":"Demo Checksheet Name1","s_name":"Demo Step Name1","type":2,"que_id":92,"name":"Modules Fan1"}]';
                            var is_valid_log = myArray[j].is_valid_log;
                            if (is_valid_log == "[]" || is_valid_log == "null" || is_valid_log == "Unknown" || is_valid_log == null || is_valid_log == undefined || is_valid_log == "") { }
                            else {
                                var log_data = JSON.parse(is_valid_log);
                                if (log_data.length > 0) {
                                    var checksheet_name = log_data[0].c_name;
                                    dlt_media_chksht_type = log_data[0].checksheet_type;
                                    if (checksheet_name == '' || checksheet_name == null || checksheet_name == undefined) { }
                                    else {
                                        valid_log_str += '<a style="width:97%;"><details class="cls_remove">';
                                        if (log_data.length == 1) {
                                            valid_log_str += '<summary>1 invalid log found - Tap to view</summary><ul class="media_ui">';
                                        }
                                        else {
                                            valid_log_str += '<summary>' + log_data.length + ' invalid logs found - Tap to view</summary><ul class="media_ui">';
                                        }
                                        for (dm = 0; dm < log_data.length; dm++) {
                                            var checksheet_name = log_data[dm].c_name;
                                            var step_name = log_data[dm].s_name;
                                            var cntrl_name = log_data[dm].name;
                                            var que_id = log_data[dm].que_id;

                                            valid_log_str += '<li class="media_li"><span class="mk_rounded_number theme_login_info_div_content">' + (dm + 1) + '</span> ' + checksheet_name + ' > ' + step_name + '</li>';
                                            valid_log_str += '<li class="media_li" style="margin-left: 25px;padding:0 0 5px;line-height:14px;">' + ' > (' + que_id + ') ' + cntrl_name + '</li>';
                                        }
                                        valid_log_str += '</ul></details></a>';
                                    }
                                }
                            }

                            var siteid = JSON.parse(storage.getItem('siteid'));
                            var sitename = JSON.parse(storage.getItem('sitename'));

                            if (dlt_media_chksht_type == "5") {
                                // force edit due to delete media case
                                var msg = 'Some media files may deleted from the device, please recapture and submit again!';
                                var param = "redirect_on_task_edit_form(" + myArray[i].tid + ", '" + myArray[j].status + "', '" + msg + "')";
                            }
                            else if (response_status == 14) {
                                // force edit due to task duplication
                                var msg = 'Some details of this task may same as the previous one, please make appropriate changes and submit again!';
                                var param = "redirect_on_task_edit_form(" + myArray[i].tid + ", '" + myArray[j].status + "', '" + msg + "')";
                            }
                            else if (task_clickable == 'false' || task_clickable == 'disable_all') {
                                param = clickable_param;
                            }
                            else {
                                var param = "redirect_on_pm_site_click('" + siteid + "', '" + myArray[j].tid + "', '" + myArray[j].status + "','" + myArray[j].moduleid + "', '" + myArray[j].module_name + "', '" + sitename + "', '" + myArray[j].lat + "', '" + myArray[j].long + "','" + j + "' , '" + encodeURIComponent(is_delete_photo) + "', '" + myArray[j].p_tid + "')";
                            }

                            var list_item = '<li class="swipeout ' + cls_task_layout + '" value="' + myArray[j].rate + '" id ="lst_' + tid + '" onclick ="' + param + '" style="background-color:'
                                + back_color + '">' + upload_pending_str + ' ' + del_media_str + '' + del_log_str + ' ' + del_subflow_str + ' ' + valid_log_str + '<a href="#" class="item-link item-content swipeout-content"><div class="item-inner item-no-pad"><div class="item-title">';

                            list_item += '<label style="font-size:10pt; font-weight:bold" class="cls_search">' + staticdata + ' : ' + (t + 1) + '</label>';

                            var param_remove_sub = "remove_last_subtask('" + myArray[j].tid + "')";
                            list_item += '</div></div></a>';
                            //list_item += '<div style="display:none" class="swipeout-actions-right" id="img_remove_' + t + '"><a href="#" class="swipeout-delete cls_remove" onclick ="' + param_remove_sub + '">Delete</a></div>';


                            //------task remove-----------
                            var task_remove_str = '';
                            if (flow_Array.length > 1 && task_removable == 'true') {
                                var param_remove_sub = "remove_last_subtask('" + tid + "')";
                                task_remove_str += '<a  id="img_remove_' + t + '" href="#" class="swipeout-delete cls_remove" onclick ="' + param_remove_sub + '">Delete</a>';
                            }

                            //------task edit-----------
                            var task_edit_str = '';
                            if (task_editable == "true") {
                                var param_edit_task = "redirect_on_task_edit_form(" + tid + ", '" + myArray[j].status + "', '')";
                                task_edit_str += '<a id="btn_task_edit_' + tid + '"  onclick="' + param_edit_task + '" style="transform: translate3d(0, 0px, 0px);">Edit</a>';
                            }

                            if (task_editable == 'true' || task_removable == 'true') {
                                list_item += '<div class="swipeout-actions-right" style="right: 0% !important;">';
                                list_item += task_edit_str;
                                list_item += task_remove_str;
                                list_item += '</div>';
                            }

                            // display task info on swipe to right
                            var info_param = "view_task_details_from_task_master('', " + tid + ")";
                            list_item += '<div class="swipeout-actions-left">';
                            list_item += '<a href="#" class="action1" onclick="' + info_param + '">Details</a>';
                            list_item += '</div>';

                            list_item += '</li>';

                            //store task_list html
                            list_item += '<input type="hidden" id="hdn_lst_html_' + myArray[j].tid + '" value="' + encodeURIComponent(myArray[j].list_html) + '">';
                            $("#site_list").append(list_item);

                            $('.cls_remove').click(function (event) {
                                event.stopPropagation();
                            });

                            var count = t + 1;
                            //if (count == tid_Array.length) {
                            $("#img_remove_" + t + "").show();
                            $("#site_list > li").last().addClass("swipeout");
                            //}
                            break;
                        }
                    }
                }
            }

            var bulk_approval = list_data[0].bulk_approval;
            if (bulk_approval == 'true') {
                $("#site_list li").on('taphold', function () {
                    $(this).find('input[name="li_chk"]').prop('checked', true);
                    get_selected_chk_count();
                    show_bulk_approval_panel();
                });

                var bulk_approval_status = list_data[0].bulk_approval_status;
                var len = bulk_approval_status.length;
                var btn_str = '';
                for (b = 0; b < len; b++) {
                    var name = bulk_approval_status[b].name;
                    var status = bulk_approval_status[b].status;
                    btn_str += '<a href="#" class="link" onclick="send_bulk_approval_online(' + status + ')">' + name + '</a>';
                }
                $("#div_bulk_btn").empty();
                $("#div_bulk_btn").append(btn_str);
            }

            var crash_status = JSON.parse(storage.getItem('crash_status'));
            if (crash_status == null || crash_status == undefined || crash_status == '') {
                crash_status = 0;
            }
            if (crash_status == 2) {
                // application has been crashed
                storage.setItem('crash_status', JSON.stringify('0'));
            }
            loading_hide();
            //clearInterval(label_timer); // stop_refreshing_label_change_timer

            var li_length = $("#site_list > li:not(:hidden)").length;
            var f_li_text = $('#site_list > li:first').text();
            if (li_length == 1 && f_li_text == 'No Record Found !') {
                li_length = 0;
                //$("#tabCount_0").html(li_length);  // for static 3 tabs
                //$("#tabCount_0").addClass('numberCircle');
                $("#tabCount_" + active_Tab + "").html(li_length);
                $("#tabCount_" + active_Tab + "").addClass('numberCircle');
            }
            else {
                $("#tabCount_" + active_Tab + "").html(li_length);
                $("#tabCount_" + active_Tab + "").addClass('numberCircle');
                if (li_length > 99) {
                    $("#tabCount_" + active_Tab + "").css('width', '22px');
                }
            }
            //$("#survey_td_1").html("Total : " + li_length + "");

            $("#tasklist_loader").hide();
            var flow_Array = JSON.parse(storage.getItem('flow_Array'));
            if (flow_Array.length == 1 && li_length >= limit_range) {
                $("#btn_SeeAll").show();
                $("#btn_SeeMore").show();

                $("#tab1").scroll(function () {
                    var offsetHeight = document.getElementById("tab1").offsetHeight;
                    var scrollTop = document.getElementById("tab1").scrollTop;
                    var scrollHeight = document.getElementById("tab1").scrollHeight;

                    // added 2nd or condition as show more not callled due to 1 pixel change 29112022
                    if (parseInt(scrollTop) === (parseInt(scrollHeight) - parseInt(offsetHeight)) || parseInt(scrollTop) === (parseInt(scrollHeight) - parseInt(offsetHeight) - 1)) {
                        $("#tasklist_loader").show();
                        see_more_site_list_common();
                    }
                });
            }
            else {
                $("#btn_SeeAll").hide();
                $("#btn_SeeMore").hide();
            }
        } else {
            $("#tab1").unbind('scroll');
            $("#tasklist_loader").hide();
            var f_li_text = $('#site_list > li:first').text();
            if (f_li_text == "") {
                $(".op-show-btns").hide();
                //$("#survey_td_1").html("Total : 0");
                $("#tabCount_" + active_Tab + "").html(0);
                $("#tabCount_" + active_Tab + "").addClass('numberCircle');
                var list_item = '<li><a href="#" class="item-link item-content"><div class="item-inner item-no-pad"><div class="item-title">No Record Found !</div></div></a></li>';

                var auto_open_task_form_no_task = list_data[0].auto_open_task_form_no_task;
                if (auto_open_task_form_no_task == "" || auto_open_task_form_no_task == null || auto_open_task_form_no_task == undefined) {
                    auto_open_task_form_no_task = "false;"
                }
                var create_task = list_data[0].task;
                if (auto_open_task_form_no_task == 'true' && create_task == "true") {
                    create_new_task();
                }
            }
            $("#site_list").append(list_item);
        }

        $("#site_list li").each(function () {
            var li_height = $("#site_list li").height();
            if (li_height < 130) {  //130=max-height of li
                $('.readmore-link').hide();
            }
            else {
                $('.readmore-link').show();
            }
        });

        var sub_task_limit = list_data[0].sub_task_limit;
        if (sub_task_limit == '' || sub_task_limit == null || sub_task_limit == undefined) {
            sub_task_limit = 1000;
        }

        var main_task_limit = list_data[0].main_task_limit;
        if (main_task_limit == '' || main_task_limit == null || main_task_limit == undefined) {
            main_task_limit = 1000;
        }

        var flag = 0;
        var f_li_text = $('#site_list > li:first').text();
        if (sub_task_limit == 1 && f_li_text == 'No Record Found !' || main_task_limit == 1 && f_li_text == 'No Record Found !') {
            flag = 1;
        }

        if ((li_length >= sub_task_limit || li_length >= main_task_limit) && flag == 0) {
            $("#btn_Create_Task").hide();
        }
        else {
            setTimeout(function () {
                var data_json = JSON.parse(storage.getItem('list_json'));
                var list_data = JSON.parse(data_json);
                var task_value = list_data[0].task;
                if (task_value == "true") {
                    $("#btn_Create_Task").show();
                }
            }, 500);
        }

        //var task_value = list_data[0].task;

        ////if subtask is greater than sub_task_limit then hide plus button and 'click here' popup
        //if (task_value == 'true') {
        //    if ((li_length >= sub_task_limit || li_length >= main_task_limit) && flag == 0) {
        //        $("#btn_Create_Task").hide();
        //        var plus_btn_visible = $('#btn_Create_Task').is(':visible');

        //        if (plus_btn_visible == 'false') {
        //            setTimeout(function () {
        //                $('#popup_create_task').css({ 'display': 'none' });
        //                $('#popup_create_task_arrow').css({ 'display': 'none' });
        //            }, 100);
        //            setTimeout(function () {
        //                $('#popup_create_task').css({ 'bottom': '-60px' });
        //                $('#popup_create_task_arrow').css({ 'bottom': '-50px' });
        //            }, 100);
        //        }
        //    }
        //    else {
        //        if (li_length < default_range) {
        //            setTimeout(function () {
        //                $('#popup_create_task').css({ 'display': 'inline-flex' });
        //                $('#popup_create_task_arrow').css({ 'display': 'block' });

        //                if (F7_device == 'ios') {
        //                    $('#popup_create_task').animate({ 'bottom': '59px' });
        //                    $('#popup_create_task_arrow').animate({ 'bottom': '74px' });
        //                }
        //                else {
        //                    $('#popup_create_task').animate({ 'bottom': '15px' });
        //                    $('#popup_create_task_arrow').animate({ 'bottom': '33px' });
        //                }
        //            }, 1000);

        //            setTimeout(function () {
        //                $('#popup_create_task').animate({ 'bottom': '-60px' });
        //                $('#popup_create_task_arrow').animate({ 'bottom': '-50px' });
        //            }, 5000);
        //        }
        //    }
        //}

        if (ddl_cnt == 0) {
            //if type 2, 3, 6 not available
            opt += '<li style="margin-top: 5px; list-style-type:none; border:1px solid #ccc">No Filter Available.</li>';
        }

        //$('#apply_filter').append('<a href="#" class="link" onclick="' + param + '">APPLY</a')
        localStorage.setItem('filter_ddl_Array', JSON.stringify(filter_ddl_Array));
        //alert1(JSON.stringify(filter_ddl_Array));

        //if (no_data_found > 0 && limit_range < 200 && myArray.length > 0) {
        //    see_more_site_list_common();
        //}

        //loading_hide();
        //clearInterval(label_timer); // stop_refreshing_label_change_timer

        clearTimeout(task_refresh_timer);
        task_refresh_timer = setTimeout(function () {
            if (upload_pending_count > 0) {
                //for upload pending task, refresh task-listing
                $("#site_list").empty();
                get_list_of_pm_sites();
            }
        }, 60000);

        var curr_btn_mode = JSON.parse(storage.getItem('curr_btn_mode'));
        if (curr_btn_mode == 'updatetasknsubmit') {
            var data_json = JSON.parse(storage.getItem('list_json'));
            var list_data = JSON.parse(data_json);
            var auto_open_task_form = list_data[0].auto_open_task_form;
            if (auto_open_task_form == 'true') {
                var auto_open_confirm_msg = list_data[0].auto_open_confirm_msg;
                vibrate_device();
                var user_choice = confirm(auto_open_confirm_msg);
                if (user_choice == true) {
                    // auto open task form
                    select_network_for_create_task();
                }
                else {
                    get_list_of_UP_sites_count();
                }
            }
            else {
                get_list_of_UP_sites_count();
            }
        }
        else {
            get_list_of_UP_sites_count();
        }
    } catch (e) {
        alert1(e + '_onsuccess_get_list_of_pm_sites()');
        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var task_value = list_data[0].task;
        if (task_value == "true") {
            $("#btn_Create_Task").show();
        }
        //loading_hide();
    }
}

// ////////////////---------- sub task remove start -------------/////////////
var remove_tid;
function remove_last_subtask(t_id) {
    try {
        localStorage.setItem('task_mode', 'delete');

        if (F7_device == 'ios') {
            var user_choice = true;
        }
        else {
            vibrate_device();
            var user_choice = confirm("Are you sure, you want to remove this task ?");
        }
        if (user_choice == true) {
            loading();
            remove_tid = t_id;

            var start_status = JSON.parse(storage.getItem('start_status'));
            var data_json = JSON.parse(storage.getItem('list_json'));
            var list_data = JSON.parse(data_json);
            var match_temp_id = list_data[0].match_temp_id;
            if (match_temp_id == "" || match_temp_id == null || match_temp_id == undefined) {
                match_temp_id = "";
            }

            var query = "UPDATE task_master SET status = '-1', flag=2, match_temp_id='" + match_temp_id + "'  where tid = '" + t_id + "'";
            var q_jsonobj = [];
            q_jsonobj.push({
                data: query,
                q: "2",
                tid: t_id,
                old_status: start_status
            });
            cordova.exec(remove_log_last_subtask, onfail_remove_last_subtask, 'SqlitePlugin', 'insertValuse', q_jsonobj);
        }
    } catch (e) {
        alert1(e + '_remove_last_subtask()');
    }
}

function onfail_remove_last_subtask() {
    alert1(e + '_onfail_remove_last_subtask()');
}

function remove_log_last_subtask() {
    try {
        var date_s = new Date();
        var time = date_s.getTime();
        var query = "UPDATE f_master SET millisecond='" + time + "', flag = '1' where tid = '" + remove_tid + "'";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            q: "0",
            tid: remove_tid
        });
        cordova.exec(remove_photo_last_subtask, onfail_remove_log_last_subtask, 'SqlitePlugin', 'insertValuse', q_jsonobj);
    } catch (e) {
        alert1(e + '_remove_log_last_subtask()');
    }
}

function onfail_remove_log_last_subtask(e) {
    alert1(e + '_onfail_remove_log_last_subtask()');
}

function remove_photo_last_subtask() {
    try {
        var query = "UPDATE p_master SET flag = '1' where tid = '" + remove_tid + "'";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            q: "0",
            tid: remove_tid
        });
        cordova.exec(onsuccess_remove_photo_last_subtask, onfail_remove_photo_last_subtask, 'SqlitePlugin', 'insertValuse', q_jsonobj);
    } catch (e) {
        alert1(e + '_remove_photo_last_subtask()');
    }
}

function onsuccess_remove_photo_last_subtask(e) {
    try {
        mk_notify('Sub Task Removed !');
        $('#lst_' + remove_tid).remove();

        var li_length = $("#site_list > li").length;
        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var task_value = list_data[0].task;
        var sub_task_limit = list_data[0].sub_task_limit;
        if (sub_task_limit == '' || sub_task_limit == null || sub_task_limit == undefined) {
            sub_task_limit = 1000;
        }
        if (li_length < sub_task_limit && task_value == 'true') {
            $("#btn_Create_Task").show();
        }
        else {
            $("#btn_Create_Task").hide();
        }
        loading_hide();
        $("#site_list").empty();
        get_list_of_pm_sites();
        //get_list_of_UP_sites_count(); 
    } catch (e) {
        alert1(e + '_onsuccess_remove_photo_last_subtask()');
    }
}

function onfail_remove_photo_last_subtask() {
    alert1(e + '_onfail_remove_photo_last_subtask()');
}
// ////////////////---------- sub task remove end -------------/////////////

// Get list of upload pending sites
function get_list_of_UP_sites_count() {
    try {
        var flow_Array = JSON.parse(storage.getItem('flow_Array'));
        if (flow_Array.length == 1) {
            var p_tid_str = '';
        } else {
            var p_tid = JSON.parse(storage.getItem('tid'));
            var p_tid_str = 'and task_master.p_tid = ' + p_tid + '';
        }

        var selected_module_id = JSON.parse(storage.getItem('wayflow'));
        var query = "select tid from task_master where moduleid = '" + selected_module_id + "' and username = '" + username
            + "' and (flag=1 or flag=3) and status != -1 " + p_tid_str + "";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "1"
        });
        cordova.exec(onsuccess_get_list_of_UP_sites_count, onfail_get_list_of_UP_sites_count, 'SqlitePlugin', 'showValues', q_jsonobj);
    } catch (e) {
        alert1(e + '_onsuccess_get_list_of_UP_sites_count()');
        loading_hide();
    }
}

// successfull getting site list
function onsuccess_get_list_of_UP_sites_count(e) {
    try {
        var myArray = JSON.parse(e);
        $("#tabCount_Up").html(myArray.length);
        $("#tabCount_Up").addClass('numberCircle');

        if (myArray.length > 0) {
            $('.tab-upload').css("display", "inline-table");
            $('#div_tab_bar a').css("width", "50%");
        }
        else {
            $('.tab-upload').css("display", "none");
        }

        //disable back btn on single module skip on first level
        //var id_Array = JSON.parse(storage.getItem('id_Array'));                           //commented to show back btn on single module skip
        //var flow_Array = JSON.parse(storage.getItem('flow_Array'));
        //var module_list_cnt = localStorage.getItem('last_modulelist_count');
        //var cust_flow_Array = JSON.parse(storage.getItem('cust_flow_Array'));
        //if (id_Array.length == 0 && cust_flow_Array.length == 0 && flow_Array.length == 1 && module_list_cnt == 1) {
        //    disable_back_button();
        //}
        //else {
        //    enable_back_button();
        //}

        enable_back_button();
        loading_hide();

        // for profile site ration
        //if (no_udf_id_found > 0) {
        //    put_udf_id_for_all_tasks();
        //}
    } catch (e) {
        alert1(e + '_onsuccess_get_list_of_UP_sites_count()');
        loading_hide();
    }
}

// put udf_id in task_master that used in profile site ratio
function put_udf_id_for_all_tasks() {
    var udf_id = JSON.parse(storage.getItem('udf_id'));
    var module_id = JSON.parse(storage.getItem('wayflow'));
    var data_json = JSON.parse(storage.getItem('list_json'));
    var list_data = JSON.parse(data_json);
    var status_array = list_data[0].status;

    var query = "UPDATE task_master SET tower_type = '" + udf_id + "' where moduleid = '" + module_id + "' and status in(" + status_array + ")";
    var q_jsonobj = [];
    q_jsonobj.push({
        data: query,
        q: "0",
        tid: "0"
    });

    cordova.exec(onsuccess_put_udf_id_for_all_tasks, onfail_put_udf_id_for_all_tasks, 'SqlitePlugin', 'insertValuse', q_jsonobj);
}

function onsuccess_put_udf_id_for_all_tasks(e) {
    get_list_of_pm_sites();
}

function onfail_put_udf_id_for_all_tasks(e) { }

var glob_off_taskclick_ary = [];
function redirect_on_pm_site_click_PRE(selected_site, selected_tid, selected_start_status, selected_moduleid, selected_modulename, selected_site_name, t_site_lat, t_site_long, t_index, t_deleted_media, t_p_tid, selected_server_task_id, accuracy, radius, selected_survey_date) {
    try {
        var company_id = JSON.parse(storage.getItem('company_id'));
        var Support_Details = JSON.parse(storage.getItem('support_refrences1'));

        storage.setItem('user_accuracy', JSON.stringify(accuracy));
        storage.setItem('user_radius', JSON.stringify(radius));

        glob_off_taskclick_ary = [];
        glob_off_taskclick_ary.push({
            'site_id': selected_site,
            'tid': selected_tid,
            'start_status': selected_start_status,
            'moduleid': selected_moduleid,
            'modulename': selected_modulename,
            'site_name': selected_site_name,
            'site_lat': t_site_lat,
            'site_long': t_site_long,
            'index': t_index,
            'deleted_media': t_deleted_media,
            'p_tid': t_p_tid,
            'server_task_id': selected_server_task_id,
            'survey_date': selected_survey_date
        });

        var param_obj = [];
        param_obj.push({
            'IMEI': imeino,
            'Company_Id': company_id,
            'Username': username,
            'Customer_Unique': selected_site_name,
            'Task_Id': selected_server_task_id,
            'site_lat': t_site_lat,
            'site_long': t_site_long,
            'Accuracy': accuracy,
            'Radius': radius,
            'Support_Details': Support_Details,
            'customer_id': selected_site
        });

        cordova.exec(onsuccess_get_green_site_data_offline, onfail_get_green_site_data_offline, 'SupportPageMapsPlugin_Green', 'anAction', param_obj);
    }
    catch (e) {
        alert1(e + '_redirect_on_pm_site_click_online_PRE');
    }
}

function onsuccess_get_green_site_data_offline(e) {
    try {
        var myArray = JSON.parse(e);
        var site_result = myArray[0].site_result;

        var selected_site = glob_off_taskclick_ary[0].site_id;
        var selected_tid = glob_off_taskclick_ary[0].tid;
        var selected_start_status = glob_off_taskclick_ary[0].start_status;
        var selected_moduleid = glob_off_taskclick_ary[0].moduleid;
        var selected_modulename = glob_off_taskclick_ary[0].modulename;
        var selected_site_name = glob_off_taskclick_ary[0].site_name;
        var t_site_lat = glob_off_taskclick_ary[0].site_lat;
        var t_site_long = glob_off_taskclick_ary[0].site_long;
        var t_index = glob_off_taskclick_ary[0].index;
        var t_deleted_media = glob_off_taskclick_ary[0].deleted_media;
        var t_p_tid = glob_off_taskclick_ary[0].p_tid;
        var selected_server_task_id = glob_off_taskclick_ary[0].server_task_id;
        var t_survey_date = glob_off_taskclick_ary[0].survey_date;

        if (site_result == "green") {
            redirect_on_pm_site_click(selected_site, selected_tid, selected_start_status, selected_moduleid, selected_modulename, selected_site_name, t_site_lat, t_site_long, t_index, t_deleted_media, t_p_tid);
        }
        else {
            //------red-----
            var accuracy = JSON.parse(storage.getItem('user_accuracy'));
            var radius = JSON.parse(storage.getItem('user_radius'));

            var new_column_obj = {
                "siteid": selected_site,
                "site_name": selected_site_name,
                "ser_task_id": selected_server_task_id,
                "start_status": selected_start_status,
                "module_id": selected_moduleid,
                "module_name": selected_modulename,
                "task_update": 1,
                "site_lat": t_site_lat,
                "site_long": t_site_long,
                "survey_date": t_survey_date,
                "ser_milli": 0
            };
            new_column_obj = JSON.stringify(new_column_obj);
            var t_new_column_obj = encodeURIComponent(new_column_obj);

            get_distance_confirmation_pm(selected_site, selected_tid, selected_moduleid, selected_modulename, selected_server_task_id, selected_site_name, user_lat, user_long, accuracy, radius, t_site_lat, t_site_long, t_new_column_obj);
        }
        loading_hide();
    } catch (e) {
        alert1(e + '_onsuccess_get_green_site_data_offline');
        loading_hide();
    }
}

function onfail_get_green_site_data_offline(e) {
    alert1(e + '_onfail_get_green_site_data_offline');
    loading_hide();
}

// redirect page on pm site click when user near from site
function redirect_on_pm_site_click(selected_site, selected_tid, selected_start_status, selected_moduleid, selected_modulename, selected_site_name, t_site_lat, t_site_long, t_index, t_deleted_media, t_p_tid) {
    try {

        localStorage.setItem('task_mode', 'click');

        // clear system variables on main task click 06052022
        var is_subflow = localStorage.getItem('is_subflow');
        if (is_subflow == 'true') { }
        else {
            storage.setItem('type20_columndata', JSON.stringify(''));
        }

        var priority = $('#priority_ddl_' + t_index + '').val();
        if (priority == 'Select') {
            alert1("Please select priority first !");
        }
        else {
            loading();
            var list_HTML = document.getElementById("lst_" + selected_tid + "").innerHTML;
            localStorage.setItem('TaskListHTML', list_HTML);
            localStorage.setItem('is_shortcutbutton', 'false');

            storage.setItem('site_lat', JSON.stringify(t_site_lat));
            storage.setItem('site_long', JSON.stringify(t_site_long));
            storage.setItem('curr_btn_mode', JSON.stringify(''));
            storage.setItem('siteid', JSON.stringify(selected_site));
            storage.setItem('tid', JSON.stringify(selected_tid));
            storage.setItem('start_status', JSON.stringify(selected_start_status));
            storage.setItem('wayflow', JSON.stringify(selected_moduleid));
            storage.setItem('wayflow_name', JSON.stringify(selected_modulename));
            storage.setItem('sitename', JSON.stringify(selected_site_name));
            storage.setItem('type20_cust_id', JSON.stringify(selected_site));
            storage.setItem('type20_cust_name', JSON.stringify(selected_site_name));
            set_common_localStorage('redirect_on_checksheet', 'true');

            t_deleted_media = decodeURIComponent(t_deleted_media);
            localStorage.setItem('is_photo_delete', t_deleted_media);

            var flow_Array = JSON.parse(storage.getItem('flow_Array'));
            flow_Array[flow_Array.length - 1].tid = selected_tid;
            flow_Array[flow_Array.length - 1].siteid = selected_site;
            flow_Array[flow_Array.length - 1].start_status = selected_start_status;
            storage.setItem('flow_Array', JSON.stringify(flow_Array));

            var data_json = JSON.parse(storage.getItem('list_json'));
            var list_data = JSON.parse(data_json);
            var edit_globalvar = list_data[0].edit_globalvar;

            var task_Dependency = [];
            var staticdata = list_data[0].staticdata;
            if (staticdata == "" || staticdata == null || staticdata == undefined) {
                var columndata_str = $('#lst_sys_var_' + selected_tid + '').val();
                var columndata_Array = JSON.parse(decodeURIComponent(columndata_str));
                storage.setItem('type20_columndata', JSON.stringify(columndata_Array));

                // store task dependency 14092020
                var columndata = list_data[0].columndata;
                for (c = 0; c < columndata.length; c++) {
                    var col_dependency = columndata[c].dependency;
                    if (col_dependency == "" || col_dependency == null || col_dependency == undefined) { }
                    else {
                        var header = columndata[c].header;
                        for (h = 0; h < columndata_Array.length; h++) {
                            var t_header = columndata_Array[h].header;
                            if (header == t_header) {
                                var ele_ans = columndata_Array[h].ans;
                                break;
                            }
                        }

                        for (d = 0; d < col_dependency.length; d++) {
                            var dep_type = col_dependency[d].dep_type;
                            var dep_ans = col_dependency[d].dep_ans;
                            var dep_class = col_dependency[d].dep_class;
                            task_Dependency.push({
                                ele_type: "task",
                                ele_ans: ele_ans,
                                dep_type: dep_type,
                                dep_ans: dep_ans,
                                dep_class: dep_class
                            });
                        }
                    }
                }
            }
            localStorage.setItem('task_Dependency', JSON.stringify(task_Dependency));

            // store parent tid when sub task listed in main task listing and auto open task form is true
            var data_json = JSON.parse(storage.getItem('list_json'));
            var list_data = JSON.parse(data_json);
            var auto_open_task_form = list_data[0].auto_open_task_form;
            if (flow_Array.length == 1 && auto_open_task_form == 'true') {
                if (t_p_tid == '' || t_p_tid == null || t_p_tid == undefined) {
                    storage.setItem('p_tid', JSON.stringify(''));
                }
                else {
                    storage.setItem('p_tid', JSON.stringify(t_p_tid));
                }
            }

            var selected_list_html = $('#hdn_lst_html_' + selected_tid + '').val();
            if (selected_list_html == "" || selected_list_html == null || selected_list_html == undefined || selected_list_html == "Unknown" || selected_list_html == "null" || selected_list_html == "undefined") {
                update_task_list_html(selected_tid);
            }
            else {
                if (edit_globalvar == "true") {
                    check_task_n_update_globalvar(selected_tid);
                } else {
                    //changeurl("viewsitelist_pm_grouplist.html");
                    check_child_flow_for_parent()                   //to skip single checksheet list
                }
            }
        }
    } catch (e) {
        alert1(e + '_redirect_on_pm_site_click');
        loading_hide();
    }
    return false;
}

function update_task_list_html(selected_tid) {
    try {
        var list_HTML = document.getElementById("lst_" + selected_tid + "").outerHTML;
        list_HTML = encodeURIComponent(list_HTML);
        var columndata_str = $('#lst_sys_var_' + selected_tid + '').val();

        var query = 'UPDATE task_master set list_html="' + list_HTML + '", columndata="' + columndata_str + '" where tid = "' + selected_tid + '"';

        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            q: "0",
            tid: selected_tid
        });
        cordova.exec(onsuccess_update_task_list_html, onfail_update_task_list_html, 'SqlitePlugin', 'insertValuse', q_jsonobj);
    }
    catch (e) {
        alert1(e + '_update_task_list_html');
    }
}

function onsuccess_update_task_list_html(e) {
    try {
        var selected_tid = JSON.parse(storage.getItem('tid'));
        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var edit_globalvar = list_data[0].edit_globalvar;

        if (edit_globalvar == "true") {
            check_task_n_update_globalvar(selected_tid);
        } else {
            //changeurl("viewsitelist_pm_grouplist.html");
            check_child_flow_for_parent()                   //to skip single checksheet list
        }
    }
    catch (e) {
        alert1(e + '_onsuccess_update_task_list_html');
        loading_hide();
    }
}

function onfail_update_task_list_html(e) {
    alert1(e + '_onfail_update_task_list_html()');
    loading_hide();
}


// when user far from site
function get_distance_confirmation_pm(selected_site, selected_tid,
    selected_moduleid, selected_modulename, selected_server_task_id,
    selected_site_name, t_user_lat, t_user_long, t_user_accuracy,
    t_user_radius, t_site_lat, t_site_long, t_new_column_obj) {
    try {

        if (t_site_lat == "" || t_site_lat == null || t_site_lat == undefined) {
            t_site_lat = "0";
        }

        if (t_site_long == "" || t_site_long == null || t_site_long == undefined) {
            t_site_long = "0";
        }

        if (t_site_long == "0" || t_site_long == "0") {
            alert("Latitude or longitude is 0.");
        }
        else {
            localStorage.setItem('is_shortcutbutton', 'false');

            var t_new_column_obj = decodeURIComponent(t_new_column_obj);
            t_new_column_obj = JSON.parse(t_new_column_obj);

            glob_taskclick_ary = [];
            glob_taskclick_ary.push({
                'site_id': selected_site,
                'site_name': selected_site_name,
                'server_task_id': selected_server_task_id,
                'start_status': t_new_column_obj.start_status,
                'moduleid': selected_moduleid,
                'modulename': selected_modulename,
                'task_update': t_new_column_obj.task_update,
                'site_lat': t_site_lat,
                'site_long': t_site_long,
                'survey_date': t_new_column_obj.survey_date,
                'millisecond': t_new_column_obj.ser_milli,
                'accuracy': t_user_accuracy,
                'radius': t_user_radius,
                'tid': selected_tid
            });

            var data_json = JSON.parse(storage.getItem('list_json'));
            var list_data = JSON.parse(data_json);
            var support = list_data[0].support;
            if (support == "" || support == null || support == undefined) {
                support = "false";
            }

            // support = "true";
            if (support == "false") {
                alert1("You can not access this work order as you are not within site radius!");
            } else {
                if (F7_device == 'ios') {
                    var user_choice = true;
                }
                else {
                    vibrate_device();
                    var user_choice = confirm("You are far from site. Are you sure, you want to go ahead ?");
                }
                if (user_choice == true) {
                    storage.setItem('site_lat', JSON.stringify(t_site_lat));
                    storage.setItem('site_long', JSON.stringify(t_site_long));
                    storage.setItem('siteid', JSON.stringify(selected_site));
                    storage.setItem('sitename', JSON.stringify(selected_site_name));
                    storage.setItem('server_task_id', JSON.stringify(selected_server_task_id));
                    storage.setItem('tid', JSON.stringify(selected_tid));
                    storage.setItem('wayflow', JSON.stringify(selected_moduleid));
                    storage.setItem('wayflow_name', JSON.stringify(selected_modulename));
                    storage.setItem('user_lat', JSON.stringify(t_user_lat));
                    storage.setItem('user_long', JSON.stringify(t_user_long));
                    storage.setItem('user_accuracy', JSON.stringify(t_user_accuracy));
                    storage.setItem('user_radius', JSON.stringify(t_user_radius));
                    storage.setItem('support_type', JSON.stringify('task'));
                    //changeurl('support_page.html');
                    send_user_lat_long_native();
                }
            }
        }

    } catch (e) {
        alert1(e + '_get_distance_confirmation_pm()');
        loading_hide();
    }
    return false;
}

// download latest site from server on refresh button click through select query
function refresh_pm_site_list() {
    try {
        // var data_json = JSON.parse(storage.getItem('list_json'));
        // var list_data = JSON.parse(data_json);
        // var survey_mode = list_data[0].survey_mode;
        // if (survey_mode == "" || survey_mode == null
        // || survey_mode == undefined) {
        // survey_mode = "offline";
        // }
        // if (survey_mode == "online") {
        // get_list_of_pm_sites_online();
        // } else {
        //loading();
        //label_timer = setInterval(starttimer, 1000); // start refreshing
        // label change timer
        var query = "select username from Login_Master";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "4" // call for download to native
        });
        cordova.exec(onsuccess_refersh_pm_site_list,
            onfail_refresh_pm_site_list, 'SqlitePlugin', 'showValues',
            q_jsonobj);
        // }
    } catch (e) {
        alert1(e + '_refresh_pm_site_list');
        loading_hide();
    }
}

//----------------Duplicate Code--------------------
//// //////// Map View Part ///////////////////////////
//// Get user latlong
//function get_user_latlong_for_map(temp_site_lat, temp_site_long) {
//    try {
//        storage.setItem('crash_status', JSON.stringify('2')); // crash status
//        // for map
//        site_lat = temp_site_lat;
//        site_long = temp_site_long;
//        cordova.exec(onsuccess_get_user_latlong_for_map,
//            onfail_get_user_latlong_for_map, 'maulik', 'nck', ["ds"]);
//    } catch (e) {
//        alert1(e + '_get_user_latlong_for_map()');
//        loading_hide();
//    }
//}

//// successful getting user latlong
//function onsuccess_get_user_latlong_for_map(e) {
//    try {
//        // alert1(e);
//        var myArray = JSON.parse(e);
//        var user_lat = myArray[0].lat;
//        var user_long = myArray[0].lon;
//        view_user_on_map(user_lat, user_long);
//    } catch (e) {
//        // alert1('Problem while getting GPS lat long, Please change your
//        // position !');
//        var user_lat = 0;
//        var user_long = 0;
//        view_user_on_map(user_lat, user_long);
//        loading_hide();
//    }
//}

//// view map on map click
//function view_user_on_map(user_lat, user_long) {
//    try {

//        var q_jsonobj = [];
//        q_jsonobj.push({
//            user_lat: user_lat,
//            user_long: user_long,
//            site_lat: site_lat,
//            site_long: site_long
//        });
//        //alert1(JSON.stringify(q_jsonobj));

//        // old map view
//        // cordova.exec(onsuccess_view_user_on_map, onfail_view_user_on_map,
//        // 'map', 'anAction', q_jsonobj);

//        // new map view(original google map)
//        cordova.exec(onsuccess_view_user_on_map, onfail_view_user_on_map, 'navigation_new_plug', 'anAction', q_jsonobj);
//    } catch (e) {
//        alert1(e + '_view_user_on_map()');
//        loading_hide();
//    }
//}

//function onfail_get_user_latlong_for_map(e) {
//    // alert1(e + '_onfail_get_user_latlong_for_map()');
//    // alert1('Problem while getting GPS lat long, Please change your position
//    // !');
//    var user_lat = 0;
//    var user_long = 0;
//    view_user_on_map(user_lat, user_long);
//    loading_hide();
//}

//function onsuccess_view_user_on_map(e) {
//    // alert1("sucessful map open...");
//}

//function onfail_view_user_on_map(e) {
//    if (e == null || e == undefined || e == '') {
//        // user press back button
//        // alert1("back");
//    } else {
//        // when open map in offline
//        alert1("Network is slow or not working, Please check your internet connection !")
//    }
//    storage.setItem('crash_status', JSON.stringify('0')); // reset crash status for map
//}
//----------------Duplicate Code--------------------

function alert_task_distance(distance, radius, accuracy, t_user_lat, t_user_long, t_task_lat, t_task_long, t_site_name) {
    alert1("You are " + distance + " meters far from site! \nSite name: " + t_site_name + " \nRadius: " + radius
        + ", Accuracy: " + accuracy + ", \nUser: " + t_user_lat + ", " + t_user_long + ", \nSite: " + t_task_lat + ", " + t_task_long
        + "\n\nNote: Click on data to go ahead");
}

// ///////////////////////

// ////////////// /error part

// successful refresh site (call for download)
function onsuccess_refersh_pm_site_list(e) {

    var data_json = JSON.parse(storage.getItem('list_json'));
    var list_data = JSON.parse(data_json);
    var survey_mode = list_data[0].survey_mode;
    if (survey_mode == "online") {
        limit_range = default_range; // set default range limit
        query_type = 1; // regular site listing
        $("#site_list").empty();
        $("#cust_list").empty();
        get_user_latlong_pm();
    }
    else {
        setTimeout(function () {
            limit_range = default_range; // set default range limit
            query_type = 1; // regular site listing
            $("#site_list").empty();
            get_user_latlong_pm();
        }, 10000); // show loading screen for 10 sec
    }
}

// ////// onfail part
function onfail_get_user_latlong(e) {
    // alert1('Problem while getting GPS lat long, Please change your position
    // !');
    user_lat = 0;
    user_long = 0;
    user_accuracy = 0;

    var data_json = JSON.parse(storage.getItem('list_json'));
    var list_data = JSON.parse(data_json);
    var survey_mode = list_data[0].survey_mode;
    if (survey_mode == "" || survey_mode == null || survey_mode == undefined) {
        survey_mode = "offline";
    }
    if (survey_mode == "online") {
        var redirect = list_data[0].redirect;
        if (redirect == 'customer') {
            get_list_of_customer_online();
        } else {
            // get_list_of_pm_sites_online();
            get_list_of_task_for_compare_online();
        }
    } else {
        get_list_of_pm_sites();
    }
    loading_hide();
}

function onfail_get_list_of_pm_sites(e) {
    $("#site_list").empty();
    $("#tasklist_loader").hide();
    $("#tabCount_" + active_Tab + "").html(0);
    $("#tabCount_" + active_Tab + "").addClass('numberCircle');
    //$("#survey_td_1").html("Total : 0");
    var list_item = '<li><a href="#" class="item-link item-content"><div class="item-inner item-no-pad"><div class="item-title">No Record Found !</div></div></a></li>';
    $("#site_list").append(list_item);

    var data_json = JSON.parse(storage.getItem('list_json'));
    var list_data = JSON.parse(data_json);
    var task_value = list_data[0].task;
    if (task_value == "true") {
        $("#btn_Create_Task").show();
    }
    get_list_of_UP_sites_count();
    loading_hide();
}

function onfail_refresh_pm_site_list(e) {
    alert1(e + '_onfail_refresh_pm_site_list()');
    loading_hide();
}

function onfail_get_list_of_UP_sites_count(e) {
    //alert1(e + '_onfail_get_list_of_UP_sites_count()');
    enable_back_button();
    loading_hide();
}

function check_task_n_update_globalvar(selected_tid) {
    try {
        var query = "select global_var, status, srnumber from task_master where tid = '"
            + selected_tid + "'";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "1"
        });
        cordova.exec(onsuccess_check_task_n_update_globalvar,
            onfail_check_task_n_update_globalvar, 'SqlitePlugin',
            'showValues', q_jsonobj);
    } catch (e) {
        alert1(e + '_check_task_n_update_globalvar()');
    }
}

function onsuccess_check_task_n_update_globalvar(e) {
    try {
        var myArray = JSON.parse(e);
        var update_flag = myArray[0].srnumber;
        var global_var_obj = myArray[0].global_var;

        //"update_flag == 2" removed for "vedang" (6/9/2018)
        //if (update_flag == '' || update_flag == null || update_flag == undefined || global_var_obj == '' || global_var_obj == null || global_var_obj == undefined
        //    || update_flag == 0 || update_flag == 2) {                

        //"update_flag = 2" added again for "sky expense" (4/12/2018)(https://trello.com/c/c9BrPn89/2405-tripsky-expenseopen-the-rejected-tab-go-in-to-the-detail-view-of-rejected-task-tap-on-trip-rejection-and-submit-it-trip-rejectio)
        if (update_flag == '' || update_flag == null || update_flag == undefined || global_var_obj == '' || global_var_obj == null || global_var_obj == undefined || global_var_obj == ' ' || global_var_obj == "Unknown" || global_var_obj == "null"
            || update_flag == 0 || update_flag == 2) {
            // new task
            //changeurl("viewsitelist_pm_grouplist.html");
            check_child_flow_for_parent()                   //to skip single checksheet list
        } else {
            // old task

            var curr_ms = new Date().getTime();

            var myArray1 = JSON.parse(global_var_obj);
            var new_checksheet_list = myArray1[0].new_checklist;
            var start_status = myArray[0].status;
            for (i = 0; i < new_checksheet_list.length; i++) {
                var c_start_status = new_checksheet_list[i].start_status;
                if (start_status == c_start_status) {
                    new_checksheet_list[i].is_submited = 0;
                    new_checksheet_list[i]['ms'] = curr_ms;
                }
            }
            update_global_var_for_old_task(myArray1);
        }
    } catch (e) {
        loading_hide();
        alert1(e + '_onsuccess_check_task_n_update_globalvar()');
    }
}

function onfail_check_task_n_update_globalvar(e) {
    loading_hide();
    alert1(e + '_onfail_check_task_n_update_globalvar()');
}

function update_global_var_for_old_task(global_var_T) {
    try {
        var t_id = JSON.parse(storage.getItem('tid'));
        var global_var_obj = JSON.stringify(global_var_T);
        var query = "UPDATE task_master SET srnumber='2', global_var = '"
            + global_var_obj + "' where tid = '" + t_id + "'";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            q: "0",
            tid: "0"
        });
        cordova.exec(onsuccess_update_global_var_for_old_task,
            onfail_update_global_var_for_old_task, 'SqlitePlugin',
            'insertValuse', q_jsonobj);
    } catch (e) {
        alert1(e + '_update_global_var_for_old_task()');
        loading_hide();
    }
}

function onsuccess_update_global_var_for_old_task(e) {
    // changeurl("viewsitelist_pm_grouplist.html");
    check_subtask_n_update_globalvar();
}

function onfail_update_global_var_for_old_task(e) {
    alert1(e + '_onfail_update_global_var_for_old_task()');
}

function check_subtask_n_update_globalvar() {
    try {
        var t_id = JSON.parse(storage.getItem('tid'));
        var query = "select global_var, status, srnumber from task_master where p_tid = '"
            + t_id + "'";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "1"
        });
        cordova.exec(onsuccess_check_subtask_n_update_globalvar,
            onfail_check_subtask_n_update_globalvar, 'SqlitePlugin',
            'showValues', q_jsonobj);
    } catch (e) {
        alert1(e + '_check_subtask_n_update_globalvar()');
    }
}

function onsuccess_check_subtask_n_update_globalvar(e) {
    try {
        var myArray = JSON.parse(e);
        if (myArray.length > 0) {
            for (j = 0; j < myArray.length; j++) {
                var global_var_obj = myArray[j].global_var;
                if (global_var_obj == '' || global_var_obj == null || global_var_obj == undefined || global_var_obj == ' ' || global_var_obj == 'Unknown' || global_var_obj == 'null') {
                    // null global var
                } else {
                    var myArray1 = JSON.parse(global_var_obj);
                    var new_checksheet_list = myArray1[0].new_checklist;
                    var start_status = myArray[0].status;
                    var role_id = JSON.parse(storage.getItem('role_id'));
                    for (i = 0; i < new_checksheet_list.length; i++) {
                        var c_start_status = new_checksheet_list[i].start_status;
                        if (start_status == c_start_status) {
                            new_checksheet_list[i].is_submited = 0;
                        }
                    }
                    break;
                }
            }
            if (myArray1 == '' || myArray1 == null || myArray1 == undefined) {
                //changeurl("viewsitelist_pm_grouplist.html");
                check_child_flow_for_parent()                   //to skip single checksheet list
            } else {
                update_subglobal_var_for_old_task(myArray1);
            }
        } else {
            //changeurl("viewsitelist_pm_grouplist.html");
            check_child_flow_for_parent()                   //to skip single checksheet list
        }
    } catch (e) {
        alert1(e + '_onsuccess_check_subtask_n_update_globalvar()');
    }
}

function onfail_check_subtask_n_update_globalvar(e) {
    alert1(e + '_onfail_check_subtask_n_update_globalvar()');
}

function update_subglobal_var_for_old_task(global_var_T) {
    try {
        var t_id = JSON.parse(storage.getItem('tid'));
        var global_var_obj = JSON.stringify(global_var_T);
        var query = "UPDATE task_master SET srnumber='2', global_var = '"
            + global_var_obj + "' where p_tid = '" + t_id + "'";

        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            q: "0",
            tid: "0"
        });
        cordova.exec(onsuccess_update_subglobal_var_for_old_task,
            onfail_update_subglobal_var_for_old_task, 'SqlitePlugin',
            'insertValuse', q_jsonobj);
    } catch (e) {
        alert1(e + '_update_subglobal_var_for_old_task()');
        loading_hide();
    }
}

function onsuccess_update_subglobal_var_for_old_task(e) {
    //changeurl("viewsitelist_pm_grouplist.html");
    check_child_flow_for_parent()                   //to skip single checksheet list
}

function onfail_update_subglobal_var_for_old_task(e) {
    alert1(e + '_onfail_update_subglobal_var_for_old_task()');
}

// //////// Weather View Part ///////////////////////////
function view_weather_for_site(temp_site_lat, temp_site_long) {
    try {
        storage.setItem('crash_status', JSON.stringify('2')); // crash status for map

        var d = new Date();
        var ms = d.getTime();

        var q_jsonobj = [];
        q_jsonobj.push({
            time: ms,
            lat: temp_site_lat,
            lon: temp_site_long
        });
        //alert1(JSON.stringify(q_jsonobj));

        cordova.exec(onsuccess_view_weather_for_site, onfail_view_weather_for_site,
            'weather_plug', 'anAction', q_jsonobj);
    } catch (e) {
        alert1(e + '_get_user_latlong_for_map()');
        loading_hide();
    }
}

function onsuccess_view_weather_for_site(e) {
    // successfull weather display
}

function onfail_view_weather_for_site(e) {
    storage.setItem('crash_status', JSON.stringify('0')); // reset crash
}


function redirect_on_task_edit_form(selected_tid, t_start_status, msg) {
    try {

        if (msg == '' || msg == null || msg == undefined) { }
        else {
            alert1(msg);
        }

        localStorage.setItem('task_mode', 'edit');                  //for task form (create mode/edit mode)
        storage.setItem('start_status', JSON.stringify(t_start_status));
        storage.setItem('tid', JSON.stringify(selected_tid));
        changeurl("viewsitedata_task.html");
    }
    catch (e) {
        alert1(e + '_redirect_on_task_edit_form');
        loading_hide();
    }
}


////////