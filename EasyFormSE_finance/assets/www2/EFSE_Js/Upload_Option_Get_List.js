
// Get distance between two point in Meters
// function getDistanceFromLatLonInMeter(lat1, lon1, lat2, lon2) {
// var R = 6371000; // Radius of the earth in meters
// var dLat = deg2rad(lat2 - lat1); // deg2rad below
// var dLon = deg2rad(lon2 - lon1);
// var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(deg2rad(lat1))
// * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
// var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
// var d = R * c; // Distance in meters
// return d;
// }

// function deg2rad(deg) {
// return deg * (Math.PI / 180);
// }

// Get list of sites
function get_list_of_UP_sites_temp() {
    // alert1("Getting site list...");
    try {
        disable_back_button();
        $("#txtsearch").val("");
        $('#btn_Create_Task').hide();

        var selected_module_id = JSON.parse(storage.getItem('wayflow'));

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

        // var query = "select tid, siteid, site_name, flag, lat, long, data,
        // site_address, survey_date from task_master where username = '"
        // + username + "' and flag=1 limit " + limit_range + "";
        // var query = "select tid, siteid, site_name, flag, lat, long, data,
        // site_address, survey_date from task_master where username = '"
        // + username + "' and flag=1 limit " + limit_range + "";

        var orderby = list_data[0].orderby;
        var order_type = list_data[0].order_type;
        if (orderby == "assigndate") {
            // orderby = "survey_date";
            orderby = "upload_date";
        }
        if (orderby == "task_id") {
            orderby = "tid";
        }

        var flow_Array = JSON.parse(storage.getItem('flow_Array'));
        if (flow_Array.length == 1) {
            var p_tid_str = '';
        } else {
            var p_tid = JSON.parse(storage.getItem('tid'));
            var p_tid_str = 'and p_tid = ' + p_tid + '';
        }

        if (orderby == "distance") {
            var lat_radian = 3.14 * (user_lat) / 180;
            var equa_distance = Math.pow(Math.cos(lat_radian), 2);

            var query = "select tm.tid,tm.moduleid,tm.module_name,tm.siteid,tm.site_name,tm.lat,tm.long,tm.data,tm.site_address,tm.status,tm.survey_date, tm.server_task_id, tm.is_delete_photo, fm.f_data, fm.step, fm.c_id from task_master tm INNER JOIN f_master fm ON tm.tid = fm.tid left join lat_plug lp on lp.tid=tm.tid where tm.moduleid = '"
                + selected_module_id
                + "' and tm.username = '"
                + username
                + "' and fm.c_id in("
                + cid_array
                + ") and fm.step in("
                + step_array
                + ")and (tm.flag=1 or tm.flag=3) and tm.status != -1 or lp.issend = 0 "
                + p_tid_str
                + " order by (("
                + user_lat
                + "-tm.lat)*("
                + user_lat
                + "-tm.lat)+("
                + user_long
                + "-tm.long)*("
                + user_long
                + "-tm.long)*"
                + equa_distance
                + ")"
                + order_type + " limit " + limit_range + "";

        } else {
            //var query = "select tm.tid,tm.moduleid,tm.module_name,tm.siteid,tm.site_name,tm.lat,tm.long,tm.data,tm.site_address,tm.status,tm.survey_date, tm.server_task_id, tm.is_delete_photo, fm.f_data, fm.step, fm.c_id from task_master tm INNER JOIN f_master fm ON tm.tid = fm.tid left join lat_plug lp on lp.tid=tm.tid where tm.moduleid = '"
            //		+ selected_module_id
            //		+ "' and tm.username = '"
            //		+ username
            //		+ "' and fm.c_id in("
            //		+ cid_array
            //		+ ") and fm.step in("
            //		+ step_array
            //		+ ")and (tm.flag=1 or tm.flag=3) and tm.status != -1 or lp.issend = 0 "
            //		+ p_tid_str
            //		+ " ORDER BY  tm."
            //		+ orderby
            //		+ " "
            //		+ order_type
            //		+ " limit " + limit_range + "";

            var query = "select tid,moduleid,module_name,siteid,site_name,lat,long,data,site_address,status,survey_date, server_task_id, is_delete_photo, list_html from task_master where moduleid = '"
                + selected_module_id + "' and username = '" + username + "' and (flag=1 or flag=3) and status != -1"
                + p_tid_str + " ORDER BY " + orderby + " " + order_type + " limit " + limit_range + "";

        }
        //alert1(query);
        // var query = "select
        // tm.tid,tm.moduleid,tm.module_name,tm.siteid,tm.site_name,tm.lat,tm.long,tm.data,tm.site_address,tm.status,tm.survey_date,
        // fm.f_data, fm.step, fm.c_id from task_master tm INNER JOIN f_master
        // fm ON tm.tid = fm.tid where tm.moduleid = '"
        // + selected_module_id
        // + "' and tm.username = '"
        // + username
        // + "' and fm.c_id in("
        // + cid_array
        // + ") and fm.step in("
        // + step_array + ")and tm.flag=1 limit " + limit_range + "";

        if (up_Click == 0) {
            var p_value = "6"; // call for upload to native
        } else {
            var p_value = "1";
        }

        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: p_value
        });
        // alert1(JSON.stringify(q_jsonobj));
        cordova.exec(onsuccess_get_list_of_UP_sites,
            onfail_get_list_of_UP_sites, 'SqlitePlugin', 'showValues',
            q_jsonobj);
    } catch (e) {
        alert1(e + '_get_list_of_UP_sites()');
        loading_hide();
    }
}

// successfull getting site list
function onsuccess_get_list_of_UP_sites_temp(e) {
    try {
        var tid_Array = [];
        var test_c_id = [];
        var myArray = JSON.parse(e);

        $("#site_list").empty();
        if (myArray.length < limit_range) {
            $("#btn_SeeAll").hide();
            $("#btn_SeeMore").hide();
        }
        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var Columndata_json = list_data[0].columndata;
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
                var color = list_data[0].columndata[p].color;
                var header = list_data[0].columndata[p].header;
                var qid = list_data[0].columndata[p].qid;
                var system_var = list_data[0].columndata[p].system_var;
                if (position == c + 1) {
                    Panding_que_id_json.push({
                        "position": position,
                        "checksheetID": checksheetID,
                        "step": step,
                        "que_id": qid,
                        "font_size": font_size,
                        "color": color,
                        "header": header,
                        "format": format,
                        "system_var": system_var
                    });
                    // alert1("at push:" +
                    // JSON.stringify(Panding_que_id_json))

                }
            }
        }

        if (myArray.length > 0) {
            // for ( var q = 0; q < Panding_que_id_json.length; q++) {
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
                }
            }
            // }
        }
        $("#tabCount_Up").html(tid_Array.length);
        $("#tabCount_Up").addClass('numberCircle');

        if (myArray.length > 0) {
            for (var t = 0; t < tid_Array.length; t++) {
                var list_item = '';
                var tid = tid_Array[t];

                var distance_desplay;
                // var param = "redirect_on_UP_site_click('" + myArray[i].siteid
                // + "','" + myArray[i].tid + "')";


                for (var d = 0; d < myArray.length; d++) {
                    if (tid == myArray[d].tid) {
                        // check for deleted media for task
                        var del_media_str = '';
                        var is_delete_photo = myArray[d].is_delete_photo;
                        if (is_delete_photo == "Unknown" || is_delete_photo == null || is_delete_photo == undefined || is_delete_photo == "") { }
                        else {
                            var media_data = JSON.parse(is_delete_photo);
                            if (media_data.length > 0) {
                                var checksheet_name = media_data[0].c_name;
                                if (checksheet_name == '' || checksheet_name == null || checksheet_name == undefined) { }
                                else {
                                    del_media_str += '<a style="width:97%"><details class="cls_remove">';
                                    if (media_data.length == 1) {
                                        del_media_str += '<summary>1 media file is missing - Tap to view</summary><ul class="media_ui">';
                                    }
                                    else {
                                        del_media_str += '<summary>' + media_data.length + ' media files are missing - Tap to view</summary><ul class="media_ui">';
                                    }
                                    for (dm = 0; dm < media_data.length; dm++) {
                                        var checksheet_name = media_data[dm].c_name;
                                        var step_name = media_data[dm].s_name;
                                        // var checksheet_name = "Demo Checksheet " + (dm+1);
                                        del_media_str += '<li class="media_li"><span class="mk_rounded_number theme_login_info_div_content">' + (dm + 1) + '</span> ' + checksheet_name + ' > ' + step_name + '</li>';
                                    }
                                    del_media_str += '</ul></details></a>';
                                }
                            }
                        }
                        break;
                    }
                }

                var list_item = '<li id="upload_lst_' + tid + '" onclick="Upload_pending_task_data(' + tid + ')">' + del_media_str + '<a href="#" class="item-link item-content">';
                list_item += '<div class="item-inner item-no-pad"><div class="item-title">';
                var list_HTML = '';
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
                    for (var i = 0; i < myArray.length; i++) {
                        var system_var = Panding_que_id_json[p].system_var;
                        if (system_var == '' || system_var == null || system_var == undefined) {
                            if (tid == myArray[i].tid && checksheetID == myArray[i].c_id && step == myArray[i].step) {
                                var site_lat = myArray[i].lat;
                                var site_long = myArray[i].long;
                                var distance = getDistanceFromLatLonInMeter(user_lat, user_long, site_lat, site_long);
                                distance = parseInt(distance);
                                distance_desplay = distance;
                                position_flag++;
                                var f_data = myArray[i].f_data;
                                f_data = itemObj._checkStrObj(f_data);  		// check_item
                                var data = f_data[0].data;
                                data = itemObj._checkStrObj(data);  		// check_item
                                break;
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
                                if (F7_device == 'ios') {
                                    ans_lable = ans_lable.toString();
                                }
                                ans_lable = ans_lable.replace(/['"]+/g, '');
                                if (format == 'italic') {
                                    list_item += '<label style="font-size:' + font_size + 'pt; font-style:' + format + '; color:' + color + '; font-weight:bold" >' + header + ' : </label><label style="font-size:' + font_size + 'pt; font-style:' + format + '; color:' + color + '" class="cls_search">' + ans_lable + '</label><br />';
                                } else {
                                    list_item += '<label style="font-size:' + font_size + 'pt; text-decoration:' + format + '; color:' + color + '; font-weight:bold" >' + header + ' : </label><label style="font-size:' + font_size + 'pt; text-decoration:' + format + '; color:' + color + '" class="cls_search">' + ans_lable + '</label><br />';
                                }
                                break;
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
                                if (data[q].type == "20" || data[q].type == "8") {
                                    var ans_lable = data[q].ans[0];
                                } else if (data[q].type == "22") {
                                    var json_inv_calc = itemObj._checkStrObj(data[q].ans[0]);  		// check_item

                                    var sum_finaljson = json_inv_calc[0].sum_finaljson;
                                    for (m = 0; m < sum_finaljson.length; m++) {
                                        var ans_lable = sum_finaljson[m].txt_sum_value;
                                        if (ans_lable == "" || ans_lable == null || ans_lable == undefined) {
                                            var ans_lable = "Sum Not Available!";
                                        } else {
                                            break;
                                        }
                                    }
                                } else {
                                    var ans_lable = data[q].ans;
                                }

                                if (format == 'italic') {
                                    list_item += '<label style="font-size:'
                                        + font_size
                                        + 'pt; font-style:'
                                        + format
                                        + '; color:'
                                        + color
                                        + '">'
                                        + header
                                        + ' :</label><label style="font-size:'
                                        + font_size + 'pt; font-style:'
                                        + format + '; color:' + color
                                        + '">' + ans_lable
                                        + '</label><br />';

                                } else {
                                    list_item += '<label style="font-size:'
                                        + font_size
                                        + 'pt; text-decoration:'
                                        + format
                                        + '; color:'
                                        + color
                                        + '">'
                                        + header
                                        + ' :</label><label style="font-size:'
                                        + font_size
                                        + 'pt; text-decoration:' + format
                                        + '; color:' + color + '">'
                                        + ans_lable + '</label><br />';
                                }
                                // alert1("list_item : 2 :" + list_item)
                                // $("#site_list").append(list_item);
                                // list_item = '';
                                row_flag++;
                                break;
                            }
                        }
                        test_r++;
                    }

                    if (test_r == "0" && test_position_flag == "1") {
                        // list_item += '<label >' + tid + '</label>';
                        // list_item += '<label>No Data Avilable !</label><br>';

                        list_item += '<label style="font-size:' + font_size
                            + 'pt; font-style:' + format + '; color:'
                            + color + '" >' + header + ' :'
                            + 'No Data Avilable !</label><br>';
                        // list_item += '<label ></label><br>';

                    }
                }
                // if (position_flag == "0") {
                // list_item += '<label >' + tid + '</label>';
                // list_item += '<label style="margin-top:30px;">No Data
                // Avilable here !</label><br>';
                // }
                var geofance_flag = list_data[0].geofence[0].value;
                var geofance_distance = list_data[0].geofence[0].show_distance;
                if (geofance_distance == 'true' && geofance_flag == 'true') {
                    // list_item += '<label > tid :' + tid + '</label><br>';
                    list_item += '<label> Distance : ' + distance_desplay
                        + '</label><br>';
                }

                list_item += '</div></div></a>';

                list_item += '</li>';
                //$("#site_list").append(list_item);


                list_HTML += decodeURIComponent(myArray[t].list_html);
                $("#site_list").append(list_HTML);

                $()
            }

            $('.cls_remove').click(function (event) {
                event.stopPropagation();
            });

            // here

            up_Timer1 = setTimeout(function () {
                up_Click = 1;
                get_list_of_UP_sites();
            }, 3000);
        } else {
            $("#tabCount_Up").html(0);
            $("#tabCount_Up").addClass('numberCircle');
            var list_item = '<li><a href="#" class="item-link item-content"><div class="item-inner item-no-pad"><div class="item-title">No Record Found !</div></div></a></li>';
            $("#site_list").append(list_item);
            get_pending_trips_count();
        }

        enable_back_button();
        loading_hide();
        $("#tasklist_loader").hide();
    } catch (e) {
        alert1(e + '_onsuccess_get_list_of_UP_sites()');
        loading_hide();
    }
}


function search_UP_site_list() {
    limit_range = default_range; // set default range limit
    query_type = 2; // search site listing
    $("#btn_SeeAll").show();
    $("#btn_SeeMore").show();
    get_list_of_UP_sites_by_search();
}

// Get list of sites by search
function get_list_of_UP_sites_by_search_temp() {
    // alert1("Getting site list by search...");
    try {
        var search_keyword = $("#txtsearch").val();
        if (search_keyword != "") {
            var selected_module_id = JSON.parse(storage.getItem('wayflow'));

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

            // var query = "select tid, siteid, site_name, flag, lat, long,
            // data,
            // site_address, survey_date from task_master where username = '"
            // + username + "' and flag=1 limit " + limit_range + "";
            // var query = "select tid, siteid, site_name, flag, lat, long,
            // data,
            // site_address, survey_date from task_master where username = '"
            // + username + "' and flag=1 limit " + limit_range + "";

            var orderby = list_data[0].orderby;
            var order_type = list_data[0].order_type;
            if (orderby == "assigndate") {
                // orderby = "survey_date";
                orderby = "upload_date";
            }
            if (orderby == "task_id") {
                orderby = "tid";
            }

            var flow_Array = JSON.parse(storage.getItem('flow_Array'));
            if (flow_Array.length == 1) {
                var p_tid_str = '';
            } else {
                var p_tid = JSON.parse(storage.getItem('tid'));
                var p_tid_str = 'and tm.p_tid = ' + p_tid + '';
            }

            if (orderby == "distance") {
                var lat_radian = 3.14 * (user_lat) / 180;
                var equa_distance = Math.pow(Math.cos(lat_radian), 2);

                var query = "select tm.tid,tm.moduleid,tm.module_name,tm.siteid,tm.site_name,tm.lat,tm.long,tm.data,tm.site_address,tm.status,tm.survey_date, tm.server_task_id, tm.is_delete_photo, fm.f_data, fm.step, fm.c_id from task_master tm INNER JOIN f_master fm ON tm.tid = fm.tid left join lat_plug lp on lp.tid=tm.tid where (siteid like '%"
                    + search_keyword
                    + "%' or site_name like '%"
                    + search_keyword
                    + "%') and tm.moduleid = '"
                    + selected_module_id
                    + "' and tm.username = '"
                    + username
                    + "' and fm.c_id in("
                    + cid_array
                    + ") and fm.step in("
                    + step_array
                    + ")and (tm.flag=1 or tm.flag=3) and tm.status != -1 or lp.issend = 0 "
                    + p_tid_str
                    + " order by (("
                    + user_lat
                    + "-tm.lat)*("
                    + user_lat
                    + "-tm.lat)+("
                    + user_long
                    + "-tm.long)*("
                    + user_long
                    + "-tm.long)*"
                    + equa_distance
                    + ")"
                    + order_type
                    + " limit " + limit_range + "";

            } else {
                var query = "select tm.tid,tm.moduleid,tm.module_name,tm.siteid,tm.site_name,tm.lat,tm.long,tm.data,tm.site_address,tm.status,tm.survey_date, tm.server_task_id, tm.is_delete_photo, fm.f_data, fm.step, fm.c_id from task_master tm INNER JOIN f_master fm ON tm.tid = fm.tid left join lat_plug lp on lp.tid=tm.tid where (siteid like '%"
                    + search_keyword
                    + "%' or site_name like '%"
                    + search_keyword
                    + "%') and tm.moduleid = '"
                    + selected_module_id
                    + "' and tm.username = '"
                    + username
                    + "' and fm.c_id in("
                    + cid_array
                    + ") and fm.step in("
                    + step_array
                    + ")and (tm.flag=1 or tm.flag=3) and tm.status != -1 or lp.issend = 0 "
                    + p_tid_str
                    + " ORDER BY  tm."
                    + orderby
                    + " "
                    + order_type
                    + " limit " + limit_range + "";
            }

            // var query = "select tid, siteid, site_name, lat, long, data,
            // site_address, survey_date from task_master where (siteid like '%"
            // + search_keyword
            // + "%' or site_name like '%"
            // + search_keyword
            // + "%') and moduleid = '"
            // + selected_module_id
            // + "' and username = '"
            // + username
            // + "' and flag=1 limit " + limit_range + "";

            var q_jsonobj = [];
            q_jsonobj.push({
                data: query,
                p: "1"
            });
            cordova.exec(onsuccess_get_list_of_UP_sites,
                onfail_get_list_of_UP_sites, 'SqlitePlugin', 'showValues',
                q_jsonobj);
        } else {
            alert1("Please enter search keyword !");
        }
    } catch (e) {
        alert1(e + '_get_list_of_UP_sites_by_search()');
        loading_hide();
    }
}

function get_list_of_UP_sites() {
    $('#btn_Search').hide();
    get_list_of_UP_sites_New('');
}

function get_list_of_UP_sites_by_search() {
    try {
        var search_keyword = $("#txtsearch").val();
        if (search_keyword != "") {
            get_list_of_UP_sites_New(search_keyword);
        } else {
            alert1("Please enter search keyword !");
        }
    } catch (e) {
        alert1(e + '_get_list_of_UP_sites_by_search()');
        loading_hide();
    }
}

function get_list_of_UP_sites_New(search_keyword) {
    // alert1("Getting site list...");
    try {
        disable_back_button();
        $("#txtsearch").val("");
        $('#btn_Create_Task').hide();
        $('#popup_create_task').css({ 'display': 'none' });
        $('#popup_create_task_arrow').css({ 'display': 'none' });

        var selected_module_id = JSON.parse(storage.getItem('wayflow'));
        var flow_Array = JSON.parse(storage.getItem('flow_Array'));
        if (flow_Array.length == 1) {
            var p_tid_str = '';
        } else {
            var p_tid = JSON.parse(storage.getItem('tid'));
            var p_tid_str = ' and p_tid = ' + p_tid + '';
        }

        var search_str = '';
        if (search_keyword == '') { } else {
            search_str = "(siteid like '%" + search_keyword + "%' or site_name like '%" + search_keyword + "%') and ";
        }

        var query = "select tid, p_tid, moduleid, module_name, siteid, site_name, server_task_id, lat, long, survey_date, millisecond, is_delete_photo, is_delete_log, is_delete_sub, is_valid_log, status, response_status, columndata from task_master where " + search_str + " moduleid = '" + selected_module_id + "' and username = '" + username + "' and (flag=1 or flag=3) and status != -1" + p_tid_str + "";

        if (up_Click == 0) {
            var p_value = "6"; // call for upload to native
        } else {
            var p_value = "1";
        }

        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: p_value
        });

        //alert1(JSON.stringify(q_jsonobj));
        cordova.exec(onsuccess_get_list_of_UP_sites, onfail_get_list_of_UP_sites, 'SqlitePlugin', 'showValues', q_jsonobj);
    } catch (e) {
        alert1(e + '_get_list_of_UP_sites_New()');
        loading_hide();
    }
}

// successfull getting site list
function onsuccess_get_list_of_UP_sites(e) {
    try {
        var tid_Array = [];
        var test_c_id = [];
        var myArray = JSON.parse(e);

        $("#site_list").empty();
        if (myArray.length < limit_range) {
            $("#btn_SeeAll").hide();
            $("#btn_SeeMore").hide();
        }
        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var survey_mode = list_data[0].survey_mode;

        $("#tabCount_Up").html(myArray.length);
        $("#tabCount_Up").addClass('numberCircle');
        var list_item = '';
        if (myArray.length > 0) {
            for (var t = 0; t < myArray.length; t++) {
                var tid = myArray[t].tid;
                var task_status = myArray[t].status;
                var site_name = myArray[t].site_name;
                var ser_task_id = myArray[t].server_task_id;
                var columndata = myArray[t].columndata;
                if(columndata == "" || columndata == null || columndata == undefined || columndata == "Unknown"){ }
                else{
                                columndata = decodeURIComponent(columndata);
                                columndata = JSON.parse(columndata);
                }
                var list_HTML = decodeURIComponent(myArray[t].list_html);
                if (list_HTML == "" || list_HTML == null || list_HTML == undefined || list_HTML == "Unknown" || list_HTML == "null" || list_HTML == "undefined") {
                    //list_HTML = '<li id="lst_' + tid + '" style="border-bottom: 1px solid #ddd;" padding: 0px 0;><label class="label-checkbox item-content">'
                    //list_HTML += '<div class="item-title" style="width: 100%;"><table style="width: 100% !important;vertical-align: top !important;"><tr>';
                    //list_HTML += '<td style="text-align:left;width: 50% !important; vertical-align: top;"><div class="item-title" style="font-size:9pt;"><b>Task Id: </b><div class="text-break cls_search">' + ser_task_id + '</div></div></td>';
                    //list_HTML += '<td style="text-align:left;width: 50% !important; vertical-align: top;"><div class="item-title" style="font-size:9pt;"><b>Site Id: </b><div class="text-break cls_search">' + site_name + '</div></div></td>';
                    //list_HTML += '</tr></table></div></label>';

                    //// display task info on swipe to right
                    //var info_param = "view_task_details_from_task_master('', " + tid + ")";
                    //list_HTML += '<div class="swipeout-actions-left cls_remove">';
                    //list_HTML += '<a hreflist_item class="action1" onclick="' + info_param + '">Details</a>';
                    //list_HTML += '</div>';

                    //list_HTML += '</li>';

                    list_item += '<li class="swipeout task_cardview" value="" id ="lst_' + tid + '" style="padding: 5px;margin-bottom: 2px;"><label class="label-checkbox item-content" style="padding-left:0;">';
                    list_item += '<div class="readmore">';
                    list_item += '<table class="swipeout-content" style="width: 100% !important;vertical-align: top !important;">';
                    list_item += '<tr>';
                    for (var c = 0; c < columndata.length; c++) {
                        var header = columndata[c].header;
                        var ans_lable = columndata[c].ans;
                        list_item += '<td style="width: 50%; display:inline-block; overflow: hidden;text-overflow: ellipsis; word-break: break-all; vertical-align:top;font-size:9pt;"><b>' + header
                            + '</b></td>';
                        list_item += '<td style="width: 50%; display:inline-block; overflow: hidden;text-overflow: ellipsis; word-break: break-all; vertical-align:top;font-size:9pt;text-align: right !important;" class="cls_search">'
                            + ans_lable + '</td>';
                    }
                    list_item += '</tr>';
                    list_item += '</table>';
                    list_item += '<span class="readmore-link" onclick="show_more_task_data(this);event.cancelBubble=true;" style="background-image: linear-gradient(to bottom, transparent, white);display:none;"><div class="showmore-box">Show More <i class="fa fa-angle-down"></i></div></span>';
                    list_item += '</div>';

                    //// display task info on swipe to right
                    var info_param = "view_task_details_from_task_master('', " + tid + ")";
                    list_item += '<div class="swipeout-actions-left cls_remove">';
                    list_item += '<a href="#" class="action1" onclick="' + info_param + '">Details</a>';
                    list_item += '</div>';

                    list_item += '</label>';
                    list_item += '</li>';
                }
                else {

                    list_item = list_HTML.replace('</li>', '');

                    // display task info on swipe to right
                    var info_param = "view_task_details_from_task_master('', " + tid + ")";
                    list_item += '<div class="swipeout-actions-left cls_remove" >';
                    list_item += '<a href="#" class="action1" onclick="' + info_param + '">Details</a>';
                    list_item += '</div>';
                    list_item += '</li>';

                }
                $("#site_list").append(list_item);

                $("#site_list li").each(function () {
                    var li_height = $("#site_list li").height();
                    if (li_height < 110) {  //130=max-height of li
                        $('.readmore-link').hide();
                    }
                    else {
                        $('.readmore-link').show();
                    }
                })
                var panel_found = 0;

                // check for duplicate task (for offline task only 15102020)
                var response_status = myArray[t].response_status;
                var dup_task_str = '';
                if (response_status == 14) {
                    dup_task_str += "<div style='margin-top:8px; padding:2px; width:100%; background-color:white; color:red; border-top: 1px solid red; border-bottom: 1px solid red; text-align:center'><i class='fa fa-warning' style='margin-right: 5px; color:red'></i>Duplicate task</div>";
                    $("#site_list li:last-child").prepend(dup_task_str);
                }

                // check for deleted media for task
                var dlt_media_chksht_type = '';
                var del_media_str = '';
                var is_delete_photo = myArray[t].is_delete_photo;
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
                            $("#site_list > li:last-child").prepend(del_media_str);
                        }
                        panel_found++;
                    }
                }

                // check for deleted log for task
                var del_log_str = '';
                var is_delete_log = myArray[t].is_delete_log;
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
                            $("#site_list > li:last-child").prepend(del_log_str);
                        }
                        panel_found++;
                    }
                }

                // check for deleted sub task in sub flow
                var del_subflow_str = '';
                var is_delete_sub = myArray[t].is_delete_sub;
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
                            $("#site_list > li:last-child").prepend(del_subflow_str);
                        }
                        panel_found++;
                    }
                }

                // check for invalid log for task
                var valid_log_str = '';
                var is_valid_log = myArray[t].is_valid_log;
                if (is_valid_log == "[]" || is_valid_log == "null" || is_valid_log == "Unknown" || is_valid_log == null || is_valid_log == undefined || is_valid_log == "") { }
                else {
                    var log_data = JSON.parse(is_valid_log);
                    if (log_data.length > 0) {
                        var checksheet_name = log_data[0].c_name;
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
                            $("#site_list > li:last-child").prepend(valid_log_str);
                        }
                        panel_found++;
                    }
                }

                if (dlt_media_chksht_type == "5") {
                    // force edit due to delete media case
                    var msg = 'Some media files may deleted from the device, please recapture and submit again!';
                    var param = "redirect_on_task_edit_form(" + myArray[t].tid + ", '" + task_status + "', '" + msg + "')";
                    $("#site_list li:last-child").attr('onclick', param);
                }
                if (dlt_media_chksht_type == "1") {
                    // force edit due to delete media case
                    var siteid = myArray[t].siteid;
                    var moduleid = myArray[t].moduleid;
                    var module_name = myArray[t].module_name;
                    var task_update = 1;
                    var site_lat = myArray[t].lat;
                    var site_long = myArray[t].long;
                    var survey_date = myArray[t].survey_date;
                    var ser_milli = myArray[t].millisecond;
                    var p_tid = myArray[t].p_tid;

                    if (survey_mode == "online") {
                        var param = "redirect_on_pm_site_click_online('" + siteid + "','" + site_name + "', '" + ser_task_id + "', '" + task_status + "','" + moduleid + "', '" + module_name + "','" + task_update + "', '" + site_lat + "', '" + site_long + "', '" + survey_date + "', '" + ser_milli + "')";
                    }
                    else {
                        var param = "redirect_on_pm_site_click('" + siteid + "', '" + myArray[t].tid + "', '" + task_status + "','" + moduleid + "', '" + module_name + "', '" + site_name + "', '" + site_lat + "', '" + site_long + "','" + t + "' , '" + encodeURIComponent(is_delete_photo) + "', '" + p_tid + "')";
                    }
                    $("#site_list li:last-child").attr('onclick', param);
                }
                else if (response_status == 14) {
                    // force edit due to task duplication
                    var msg = 'Some details of this task may same as the previous one, please make appropriate changes and submit again!';
                    var param = "redirect_on_task_edit_form(" + myArray[t].tid + ", '" + task_status + "', '" + msg + "')";
                    $("#site_list li:last-child").attr('onclick', param);
                }
                else if (panel_found == 0) {
                    var param = "Upload_pending_task_data(" + tid + ")";
                    $("#site_list li:last-child").attr('onclick', param);
                }


                $("#site_list li:last-child").find('.item-inner').attr('onclick', '');
            }

            $('.cls_remove').click(function (event) {
                event.stopPropagation();
            });

            up_Timer1 = setTimeout(function () {
                up_Click = 1;
                get_list_of_UP_sites();
            }, 5000);
        } else {
            $("#tabCount_Up").html(0);
            $("#tabCount_Up").addClass('numberCircle');
            var list_item = '<li><a href="#" class="item-link item-content"><div class="item-inner item-no-pad"><div class="item-title">No Record Found !</div></div></a></li>';
            $("#site_list").append(list_item);
            get_pending_trips_count();
        }

        enable_back_button();
        loading_hide();
        $("#tasklist_loader").hide();
    } catch (e) {
        alert1(e + '_onsuccess_get_list_of_UP_sites()');
        loading_hide();
    }
}

//getting pending trips count
function get_pending_trips_count() {
    var query = "select issend from lat_plug where issend = 0";
    var q_jsonobj = [];
    q_jsonobj.push({
        data: query,
        p: "1"
    });
    cordova.exec(onsuccess_get_pending_trips_count, onfail_get_pending_trips_count, 'SqlitePlugin', 'showValues', q_jsonobj);
}

function onsuccess_get_pending_trips_count(e) {
    var myArray = JSON.parse(e);
    if (myArray.length > 0) {
        $("#site_list > li:first-child").html('<a href="#" class="item-link item-content"><div class="item-inner item-no-pad"><div class="item-title">' + myArray.length + ' Trips Found !</div></div></a>');

        setTimeout(function () {
            get_pending_trips_count();
        }, 3000);
    }
}

function onfail_get_pending_trips_count(e) { }

// temp close

// redirect page on site click when user near from site
function redirect_on_UP_site_click(selected_site, selected_tid) {
    try {
        // alert1(selected_tid);
        storage.setItem('siteid', JSON.stringify(selected_site));
        storage.setItem('tid', JSON.stringify(selected_tid));
        changeurl("Upload_Each_Site.html");
    } catch (e) {
        alert1(e + 'redirect_on_UP_site_click()');
        loading_hide();
    }
}

// on click upload pending page
function Upload_pending_task_data(task_id) {
    try {
        storage.setItem('upload_task', JSON.stringify(task_id));
        storage.setItem('pending_status_page', JSON.stringify('1'));
        // storage.setItem('upload_task', JSON.stringify(task_id));
        var task_id_1 = JSON.parse(storage.getItem('upload_task'));
        //changeurl("Upload_Pending_test.html");
        changeurl("pending_status.html");
    } catch (e) {
        // TODO: handle exception
        alert1(e + "_Upload_pending_task_data");
    }
}

// download latest site from server on refresh button click through select query
function refresh_UP_site_list() {
    limit_range = default_range; // set default range limit
    query_type = 1; // regular site listing
    $("#btn_SeeAll").show();
    $("#btn_SeeMore").show();
    get_list_of_UP_sites();
}

// onfail part
function onfail_get_list_of_UP_sites(e) {
    alert1(e + '_onfail_get_list_of_UP_sites()');
    $("#tabCount_Up").html(0);
    $("#tabCount_Up").addClass('numberCircle');
    var list_item = '<li style="padding:5px; list-style-type:none; border-style:solid; border-width:1px; text-align:center" class="theme_viewsitepm_li"><label style="font-size:11pt; font-weight:bold">No Record Found !</label></li>';
    $("#site_list").append(list_item);
    loading_hide();
}

// /--- unused code
// //call on click of show all button
// function see_all_UP_site_list() {
// limit_range = 1000; // set max limit
// if (query_type == 1) {
// get_list_of_UP_sites();
// } else {
// get_list_of_UP_sites_by_search();
// }
// }
//
// //call on click of show more button
// function see_more_UP_site_list() {
// limit_range = limit_range + increment_range;
// if (query_type == 1) {
// get_list_of_UP_sites();
// } else {
// get_list_of_UP_sites_by_search();
// }
// }
