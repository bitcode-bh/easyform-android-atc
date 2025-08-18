
// get formatted date
function getFormattedDate(date) {
    var year = date.getFullYear();
    var month = (1 + date.getMonth()).toString();
    month = month.length > 1 ? month : '0' + month;
    var day = date.getDate().toString();
    day = day.length > 1 ? day : '0' + day;
    return year + '/' + month + '/' + day;
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

// compare server date with current date
function check_server_date() {
    try {
        //var server_date = JSON.parse(storage.getItem('server_date'));
        //var d = new Date();
        //var curr_date = getFormattedDate(d);
        //if (curr_date > server_date) {
        //    if (server_dt_Counter == 0) {
        //        get_server_date();
        //    } else {
        //        alert1("Your device date is not matched with server date, Please reset your device date by " + server_date + " !");
        //        var list_item = '<li><input type="button" value="No Checksheet Found !" style="word-wrap: break-word;max-width:100%; min-width:150px; margin:5px; padding:5px 10px; margin-left:auto; margin-right:auto;  font-size:12pt; border:2px solid white; border-radius:5px; box-shadow:3px 3px 3px black" class="theme_Selection_btn"></li>';
        //        $("#checksheet_list").append(list_item);
        //        loading_hide();
        //    }
        //} else {
        //    loading_hide();
        //    get_checklist_data_for_task();
        //}

        // removed compare logic for mobile and server date - atc - 08062020
        get_checklist_data_for_task();

    } catch (e) {
        alert1(e + '_check_server_date()');
        loading_hide();
    }
}

// getting server current date
function get_server_date() {
    try {
        loading();

        var appversion = JSON.parse(storage.getItem('appversion'));
        var auth = [];
        auth.push({
            "username": username,
            "devicetype": F7_device,
            "appid": "",
            "u_c": uniqcode,
            "appversion": appversion
        });

        var param_obj = [];
        param_obj.push({
            'data': ''
        });

        var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_GetServerCurrentDate', JSON.stringify(param_obj), onsuccess_get_server_date, onfail_get_server_date);
        getdata.callOtherDomain();
    } catch (e) {
        alert1(e + '_get_server_date()');
        loading_hide();
    }
}

function onsuccess_get_server_date(e) {
    try {
        var result = eval('(' + e.responseText + ')');
        var status = result[0].status;
        if (status == 1) {
            var data = result[0].data;
            if (data == "" || data == null || data == undefined) {
                var server_date = result[0].date;
            }
            else {
                data = JSON.parse(data);
                var server_date = data[0].date;
            }

            storage.setItem('server_date', JSON.stringify(server_date));
            server_dt_Counter = 1;
            check_server_date();
        }
        else {
            var message = result[0].message;
            alert(message);
            loading_hide();
        }
    } catch (e) {
        alert1(e + '_onsuccess_get_server_date()');
        loading_hide();
    }
}

function onfail_get_server_date(e) {
    alert1("Please login again to synchronize your device with server !");
    loading_hide();
}

function get_checklist_data_for_task() {
    try {
        var flow_Array = JSON.parse(storage.getItem('flow_Array'));
        if (flow_Array.length = 1) {
            var moduleid = JSON.parse(storage.getItem('wayflow'));
        } else {
            var moduleid = flow_Array[flow_Array.length - 1].wayflow;
        }

        if (moduleid == 0 || moduleid == '' || moduleid == null || moduleid == undefined) {
            alert1("No task checksheet is mapped to this flow!");
        } else {
            var query = "select data from flow_master where moduleid = '" + moduleid + "'";
            var q_jsonobj = [];
            q_jsonobj.push({
                data: query,
                p: "1"
            });
            cordova.exec(onsuccess_get_checklist_data_for_task, onfail_get_checklist_data_for_task, 'SqlitePlugin', 'showValues', q_jsonobj);
        }
    } catch (e) {
        alert1(e + '_get_checklist_data_for_task()')
    }
}

function onsuccess_get_checklist_data_for_task(e) {
    try {
        var myArray = JSON.parse(e);
        if (myArray.length == 0) {
            // table not available get data from server

            var flow_Array = JSON.parse(storage.getItem('flow_Array'));
            if (flow_Array.length = 1) {
                var moduleid = JSON.parse(storage.getItem('wayflow'));
            } else {
                var moduleid = flow_Array[flow_Array.length - 1].wayflow;
            }

            var company_id = JSON.parse(storage.getItem('company_id'));
            var user_id = JSON.parse(storage.getItem('user_id'));
            var role_id = JSON.parse(storage.getItem('role_id'));
            var selected_site = JSON.parse(storage.getItem('siteid'));
            var selected_server_task_id = JSON.parse(storage.getItem('server_task_id'));

            if (selected_site == "" || selected_site == null || selected_site == undefined) {
                selected_site = "0";
            }

            var param_obj = [];
            param_obj.push({
                'Company_Id': company_id,
                'User_Id': user_id,
                'moduleid': moduleid,
                'siteid': selected_site,
                'server_task_id': selected_server_task_id,
                'role_id': role_id
            });

            var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_GetCustomerWithGlobalVar_With_Role_Port', JSON.stringify(param_obj), function (e) {
                var responseText = JSON.parse(e.responseText);
                var status = responseText[0].status;
                if (status == 1) {
                    var myArray = JSON.parse(responseText[0].data);
                    var task_checklist_data = JSON.stringify(myArray[0].data);
                    storage.setItem('task_data_column', task_checklist_data);
                    get_checklist_data_for_task_post();
                }
                else {
                    loading_hide();
                    alert(responseText[0].message);
                }
            }, onfail_get_checklist_data_for_subtask);
            getdata.callOtherDomain();
        }
        else {
            var task_checklist_data = myArray[0].data;
            storage.setItem('task_data_column', task_checklist_data);
            get_checklist_data_for_task_post();
        }
    } catch (e) {
        alert1(e + "_onsuccess_get_checklist_data_for_task()");
    }
}

function get_checklist_data_for_task_post() {
    // check for geofence available
    var data_json = JSON.parse(storage.getItem('list_json'));
    var list_data = JSON.parse(data_json);
    var cl_geofence = list_data[0].checklist_geofence;
    if (cl_geofence == 'true') {
        var cl_geofence_Array = list_data[0].checklist_geo_data;
        var cust_checksheet_id = '';
        for (g = 0; g < cl_geofence_Array.length; g++) {
            var ref_check_type = cl_geofence_Array[g].ref_check_type;
            if (ref_check_type == 3) {
                cust_checksheet_id = cl_geofence_Array[g].ref_checksheet_id;
                break;
            }
        }
        // storing customer checksheet_id for getting customer json from
        // f_master afterwards
        storage.setItem('cust_checksheet_id', JSON.stringify(cust_checksheet_id));
        get_task_json_for_getting_cl_latlong();
    } else {
        get_list_of_pm_checksheets();
    }
}

// Get list of checksheets
function get_list_of_pm_checksheets() {
    try {
        var selected_module_id = JSON.parse(storage.getItem('wayflow'));
        var selected_site = JSON.parse(storage.getItem('siteid'));
        var selected_tid = JSON.parse(storage.getItem('tid'));
        var query = "select punch_flag, in_ms, out_ms, duration, site_name, server_task_id, survey_date, global_var, Dynamic_Globalvar, status, upload_date, tower_type from task_master where tid = '" + selected_tid + "'";
        last_query = query;
        //alert1(query);
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "1"
        });
        cordova.exec(onsuccess_get_list_of_pm_checksheets, onfail_get_list_of_pm_checksheets, 'SqlitePlugin', 'showValues', q_jsonobj);
    } catch (e) {
        alert1(e + '_get_list_of_pm_checksheets()');
        loading_hide();
    }
}

var in_ms;
var duration;
var last_var_obj;
function onsuccess_get_list_of_pm_checksheets(e) {
    try {
        var bgr_found = 0;
        var blue_found = 0;
        var blue_index = 0;
        var checksheet_displaying = 0;
        var myArray = JSON.parse(e);
        $("#checksheet_list").empty();
        var breakpoint = 0;

        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var tat_check = list_data[0].tat;

        if (myArray == '' || myArray == null || myArray == undefined) {
            alert1(last_query + '_onsuccess_get_list_of_pm_checksheets()');
        }

        if (myArray.length > 0) {
            breakpoint = 1;

            var multiflow_list = list_data[0].multiflow_list;
            if (multiflow_list == '' || multiflow_list == null || multiflow_list == undefined) {
                var status_array = list_data[0].status;
            }
            else {
                var status_array;
                var flow_id = JSON.parse(storage.getItem('wayflow'));
                for (m = 0; m < multiflow_list.length; m++) {
                    var mf_flow_id = multiflow_list[m].flow_id;
                    if (flow_id == mf_flow_id) {
                        status_array = multiflow_list[m].status;
                        break;
                    }
                }
            }

            breakpoint = 2;

            var cl_geofence = list_data[0].checklist_geofence;
            var gb_by_status = list_data[0].gb_by_status;
            if (gb_by_status == 'true') {
                var gb_check = 'true';
            } else {
                var gb_check = 'false';
            }

            var server_task_id = myArray[0].server_task_id;
            var start_status = myArray[0].status;
            storage.setItem('start_status', JSON.stringify(start_status));
            storage.setItem('server_task_id', JSON.stringify(myArray[0].server_task_id));

            var checksheet_list = JSON.parse(storage.getItem('task_data_column'));
            var survey_date = myArray[0].survey_date;
            var assign_date = myArray[0].upload_date;
            var d1 = new Date();
            var curr_date = getFormattedDate(d1);

            // /--- set global values in storage start ------/ //
            var global_var_obj = myArray[0].global_var;
            var Dynamic_Globalvar = myArray[0].Dynamic_Globalvar;

            breakpoint = 3;

            // nokia change
            // storage.setItem('role_id', JSON.stringify('1509'));
            var dynamic_checklist = list_data[0].dynamic_checklist;
            if (dynamic_checklist == 'true') {
                // dynamic checksklist from new global_var column'
                if (Dynamic_Globalvar == null || Dynamic_Globalvar == "null" || Dynamic_Globalvar == undefined || Dynamic_Globalvar == "" || Dynamic_Globalvar == " " || Dynamic_Globalvar == "Unknown") {
                    var myArray1 = [];
                }
                else {
                    // merge dynamic checklist to flow checklist for particular task
                    var myArray1 = JSON.parse(Dynamic_Globalvar);
                    var len1 = myArray1.length;
                    var role_id = JSON.parse(storage.getItem('role_id'));

                    for (y = 0; y < len1; y++) {
                        var c_role_id = myArray1[y].role_id;
                        if (c_role_id == role_id) {
                            myArray1[y]['dynamic_checksheet'] = 'true';
                            checksheet_list.push(myArray1[y]);
                        }
                    }
                }
            }

            breakpoint = 4;

            // sort checklist array by order_id
            checksheet_list = checksheet_list.sort(function (a, b) {
                var x = a.order_id < b.order_id ? -1 : 1;
                return x;
            });

            // static checksklist from flow_master
            if (global_var_obj == null || global_var_obj == "null" || global_var_obj == undefined || global_var_obj == ""
                || global_var_obj == " " || global_var_obj == "Unknown") {
                // Creating new global var
                var checksheet_dependency = [];
                var new_checksheet_list = [];
                for (j = 0; j < checksheet_list.length; j++) {
                    var is_mandatory = checksheet_list[j].is_mandatory;
                    var is_disabled = checksheet_list[j].is_disabled;
                    var is_submited = checksheet_list[j].is_submited;
                    if (is_submited == 1 || is_mandatory == 0 || is_disabled == 1) {
                        is_submited = 1;
                    }
                    else {
                        is_submited = 0;
                    }

                    var is_online = checksheet_list[j].is_online;
                    if (is_online == "" || is_online == null || is_online == undefined) {
                        is_online = 0;
                    }

                    var is_icon_display = checksheet_list[j].is_icon_display;
                    if (is_icon_display == "" || is_icon_display == null || is_icon_display == undefined) {
                        is_icon_display = "true";
                    }

                    new_checksheet_list.push({
                        'role_id': checksheet_list[j].role_id,
                        'checksheetid': checksheet_list[j].checksheetid,
                        'start_status': checksheet_list[j].start_status,
                        'end_status': checksheet_list[j].end_status,
                        'is_flow': checksheet_list[j].is_flow,
                        'is_submited': is_submited,
                        'is_mandatory': is_mandatory,
                        'is_disabled': is_disabled,
                        'is_online': is_online,
                        'is_icon_display': is_icon_display,
                        'c_name': checksheet_list[j].c_name,
                        'sub_flow_id': checksheet_list[j].sub_flow_id
                    });
                }
            }
            else {
                var myArray1 = JSON.parse(global_var_obj);
                var ch_dependency_obj = myArray1[0].checksheet_dependency;
                if (ch_dependency_obj == null || ch_dependency_obj == undefined || ch_dependency_obj == "" || ch_dependency_obj == "Unknown") {
                    var checksheet_dependency = [];
                } else {
                    var checksheet_dependency = ch_dependency_obj;
                }

                var new_checklist_obj = myArray1[0].new_checklist;
                if (new_checklist_obj == null || new_checklist_obj == undefined || new_checklist_obj == "" || new_checklist_obj == "Unknown") {
                    var new_checksheet_list = [];
                    for (j = 0; j < checksheet_list.length; j++) {
                        var is_mandatory = checksheet_list[j].is_mandatory;
                        var is_disabled = checksheet_list[j].is_disabled;
                        var is_submited = checksheet_list[j].is_submited;
                        if (is_submited == 1 || is_mandatory == 0 || is_disabled == 1) {
                            is_submited = 1;
                        }
                        else {
                            is_submited = 0;
                        }

                        var is_online = checksheet_list[j].is_online;
                        if (is_online == "" || is_online == null || is_online == undefined) {
                            is_online = 0;
                        }

                        var is_icon_display = checksheet_list[j].is_icon_display;
                        if (is_icon_display == "" || is_icon_display == null || is_icon_display == undefined) {
                            is_icon_display = "true";
                        }

                        new_checksheet_list.push({
                            'role_id': checksheet_list[j].role_id,
                            'checksheetid': checksheet_list[j].checksheetid,
                            'start_status': checksheet_list[j].start_status,
                            'end_status': checksheet_list[j].end_status,
                            'is_flow': checksheet_list[j].is_flow,
                            'is_submited': is_submited,
                            'is_mandatory': is_mandatory,
                            'is_disabled': is_disabled,
                            'is_online': is_online,
                            'is_icon_display': is_icon_display,
                            'c_name': checksheet_list[j].c_name,
                            'sub_flow_id': checksheet_list[j].sub_flow_id
                        });
                    }
                } else {
                    var old_checksheet_list = new_checklist_obj;
                    var new_checksheet_list = [];

                    // removed unused object from global var
                    old_checksheet_list = remove_unused_object_from_global_var(checksheet_list, old_checksheet_list);

                    // merge global var/ second user login (on server 1st user global var saved (siklu))
                    for (k = 0; k < checksheet_list.length; k++) {
                        var loc_checksheetid = checksheet_list[k].checksheetid;
                        var loc_start_status = checksheet_list[k].start_status;
                        var loc_sub_flow_id = checksheet_list[k].sub_flow_id;
                        var loc_chk_found = 0;
                        var role_id = checksheet_list[k].role_id

                        for (m = 0; m < old_checksheet_list.length; m++) {
                            var ser_checksheetid = old_checksheet_list[m].checksheetid;
                            var ser_start_status = old_checksheet_list[m].start_status;
                            var ser_sub_flow_id = old_checksheet_list[m].sub_flow_id;
                            var ser_role_id = old_checksheet_list[m].role_id

                            if (ser_checksheetid == loc_checksheetid && ser_start_status == loc_start_status && ser_sub_flow_id == loc_sub_flow_id && role_id == ser_role_id) {
                                loc_chk_found++;
                                break;
                            }
                        }

                        if (loc_chk_found > 0) {
                            // server checksheet found in local checklist
                            new_checksheet_list.push(old_checksheet_list[m]);
                        } else {
                            // server checksheet not found in local checklist
                            var is_mandatory = checksheet_list[k].is_mandatory;
                            var is_disabled = checksheet_list[k].is_disabled;
                            var is_submited = checksheet_list[k].is_submited;
                            if (is_submited == 1 || is_mandatory == 0 || is_disabled == 1) {
                                is_submited = 1;
                            }
                            else {
                                is_submited = 0;
                            }

                            var is_online = checksheet_list[k].is_online;
                            if (is_online == "" || is_online == null || is_online == undefined) {
                                is_online = 0;
                            }

                            var is_icon_display = checksheet_list[k].is_icon_display;
                            if (is_icon_display == "" || is_icon_display == null || is_icon_display == undefined) {
                                is_icon_display = "true";
                            }

                            new_checksheet_list
                                .push({
                                    'role_id': checksheet_list[k].role_id,
                                    'checksheetid': checksheet_list[k].checksheetid,
                                    'start_status': checksheet_list[k].start_status,
                                    'end_status': checksheet_list[k].end_status,
                                    'is_flow': checksheet_list[k].is_flow,
                                    'is_submited': is_submited,
                                    'is_mandatory': is_mandatory,
                                    'is_disabled': is_disabled,
                                    'is_online': is_online,
                                    'is_icon_display': is_icon_display,
                                    'c_name': checksheet_list[k].c_name,
                                    'sub_flow_id': checksheet_list[k].sub_flow_id
                                });
                        }
                    }
                }
            }

            breakpoint = 5;

            storage.setItem('checksheet_dependency', JSON.stringify(checksheet_dependency));
            storage.setItem('new_checklist', JSON.stringify(new_checksheet_list));

            var flow_Array = JSON.parse(storage.getItem('flow_Array'));
            if (flow_Array.length > 1) {
                var type = flow_Array[flow_Array.length - 1].type;
                if (type == 'Module' || type == 'Flow') {
                    flow_Array[flow_Array.length - 1].checklist = new_checksheet_list;
                } else {
                    flow_Array[flow_Array.length - 2].checklist = new_checksheet_list;
                }
                storage.setItem('flow_Array', JSON.stringify(flow_Array));
            }

            breakpoint = 6;

            var curr_btn_mode = JSON.parse(storage.getItem('curr_btn_mode'));
            var group_name_array = [];
            var group_btn_color_array = [];
            for (var i = 0; i < checksheet_list.length; i++) {
                var icon_str = '';
                var checksheetid = checksheet_list[i].checksheetid;
                if (checksheetid != 0) {
                    // show checksheet by role_id start
                    var role_id = JSON.parse(storage.getItem('role_id'));
                    var c_role_id = checksheet_list[i].role_id;
                    if (c_role_id == '' || c_role_id == null || c_role_id == undefined) {
                        var role_matched = 1;
                    } else {
                        if (role_id == c_role_id) {
                            var role_matched = 1;
                        } else {
                            var role_matched = 0;
                        }
                    }

                    // show checksheet by role_id end
                    if (role_matched == 1) {
                        // role matched
                        var c_start_status = checksheet_list[i].start_status;
                        var is_flow = checksheet_list[i].is_flow;
                        var reject_status = checksheet_list[i].reject_status;
                        if (reject_status == '' || reject_status == undefined || reject_status == null) {
                            reject_status = 0;
                        }

                        // check is_submitted from new checklist in global var
                        var d_checksheetid = checksheet_list[i].checksheetid;
                        for (n = 0; n < new_checksheet_list.length; n++) {
                            var g_checksheetid = new_checksheet_list[n].checksheetid;
                            var g_start_status = new_checksheet_list[n].start_status;
                            var g_role_id = new_checksheet_list[n].role_id;
                            if (g_role_id == '' || g_role_id == null || g_role_id == undefined) {
                                g_role_id = role_id;
                            }
                            if (d_checksheetid == g_checksheetid && c_start_status == g_start_status && role_id == g_role_id) {
                                var is_submited = new_checksheet_list[n].is_submited;
                                var is_mandatory = new_checksheet_list[n].is_mandatory;
                                var is_disabled = new_checksheet_list[n].is_disabled;
                                if (is_mandatory == 0 || is_disabled == 1) {
                                    // is_mandatory == 0 (checksheet is not mandatory)
                                    // is_disabled == 1 (checksheet should be in read only mode)
                                    is_submited = 1;
                                }
                                break;
                            }
                        }

                        if (is_submited == '' || is_submited == null || is_submited == undefined) {
                            is_submited = 0;
                        }

                        var st_found = 0;
                        var status_checksheet_only = list_data[0].status_checksheet_only;
                        if (status_checksheet_only == 'true') {
                            if (c_start_status == start_status) {
                                // checksheet status match with current status

                                for (g = 0; g < status_array.length; g++) {
                                    if (c_start_status == status_array[g]) {
                                        // checksheet belongs to flow status array
                                        st_found = 1;
                                        break;
                                    }
                                }
                            }
                        }
                        else {
                            for (g = 0; g < status_array.length; g++) {
                                if (c_start_status == status_array[g]) {
                                    // checksheet belongs to flow status array
                                    st_found = 1;
                                    break;
                                }
                            }
                        }

                        //var checksheet_status_array = list_data[0].checksheet_status;
                        //var chk_st_found = 0;
                        //if (checksheet_status_array == '' || checksheet_status_array == null || checksheet_status_array == undefined) { }
                        //else {
                        //    for (h = 0; h < checksheet_status_array.length; h++) {
                        //        if (c_start_status == checksheet_status_array[h]) {
                        //            // checksheet belongs to flow checksheet status array
                        //            chk_st_found = 1;
                        //            break;
                        //        }
                        //    }
                        //}

                        if (st_found == 1) {
                            // alert1("checksheet start status found in array");

                            // checklist geo fence checksheet id check start
                            var ref_found = 0;
                            if (cl_geofence == 'true') {
                                var cl_geofence_radius = parseInt(list_data[0].checklist_radius);
                                var cl_geofence_Array = list_data[0].checklist_geo_data;
                                for (g = 0; g < cl_geofence_Array.length; g++) {
                                    var geo_checksheet_id = cl_geofence_Array[g].checksheet_id;
                                    var ref_checksheet_id = cl_geofence_Array[g].ref_checksheet_id;
                                    var ref_check_type = cl_geofence_Array[g].ref_check_type;
                                    if (checksheet_list[i].checksheetid == geo_checksheet_id) {
                                        var lat_que_id = cl_geofence_Array[g].lat_que_id;
                                        var long_que_id = cl_geofence_Array[g].long_que_id;
                                        ref_found++;
                                        break;
                                    }
                                }

                                if (ref_found == 1) {
                                    if (ref_check_type == 3) {
                                        var t_finaljsonobj = JSON.parse(storage.getItem('cl_geo_customer_json'));
                                    } else {
                                        var t_finaljsonobj = JSON.parse(storage.getItem('cl_geo_task_json'));
                                    }

                                    var data = itemObj._checkStrObj(t_finaljsonobj[0].data);  		// check_item
                                    for (k = 0; k < data.length; k++) {
                                        if (lat_que_id == data[k].que_id) {
                                            var checksheet_lat = data[k].ans;
                                            break;
                                        }
                                    }
                                    for (k1 = 0; k1 < data.length; k1++) {
                                        if (long_que_id == data[k1].que_id) {
                                            var checksheet_long = data[k1].ans;
                                            break;
                                        }
                                    }

                                    var user_track_array = JSON.parse(storage.getItem('user_track_details'));
                                    var user_lat = user_track_array[0].user_lat;
                                    var user_long = user_track_array[0].user_long;
                                    var user_accuracy = user_track_array[0].user_accuracy;

                                    checksheet_lat = parseFloat(checksheet_lat);
                                    checksheet_long = parseFloat(checksheet_long);
                                    user_lat = parseFloat(user_lat);
                                    user_long = parseFloat(user_long);
                                    user_accuracy = parseFloat(user_accuracy);

                                    var distance = getDistanceFromLatLonInMeter(user_lat, user_long, checksheet_lat, checksheet_long);
                                    distance = parseInt(distance);
                                    var alert_param = "alert_checksheet_distance('" + distance + "','" + cl_geofence_radius + "','" + user_accuracy + "','"
                                        + checksheet_list[i].c_name + "','" + user_lat + "','" + user_long + "','" + checksheet_lat + "','" + checksheet_long + "')";

                                    if (distance < (cl_geofence_radius + user_accuracy)) {
                                        // inside geofence
                                        var near_site = 1;
                                    } else {
                                        // outside geofence
                                        var near_site = 0;
                                        var site_name = myArray[0].site_name;
                                        var geo_checksheet_name = checksheet_list[i].c_name;
                                        var param_geo = "get_distance_confirmation_pm_checksheet('" + server_task_id + "','" + site_name + "', '" + geo_checksheet_id
                                            + "', '" + geo_checksheet_name + "', '" + ref_checksheet_id + "', '" + ref_check_type + "', '"
                                            + lat_que_id + "','" + long_que_id + "','" + user_lat + "','" + user_long + "','"
                                            + user_accuracy + "','" + cl_geofence_radius + "', '" + distance + "')";
                                    }
                                }
                            }
                            // checklist geo fence checksheet id check end

                            if (checksheet_list[i].is_disabled == '' || checksheet_list[i].is_disabled == null || checksheet_list[i].is_disabled == undefined) {
                                checksheet_list[i].is_disabled = 0;
                            }

                            if (checksheet_list[i].is_readchecksheet == '' || checksheet_list[i].is_readchecksheet == null || checksheet_list[i].is_readchecksheet == undefined) {
                                checksheet_list[i].is_readchecksheet = 0;
                            }

                            if (checksheet_list[i].is_online == '' || checksheet_list[i].is_online == null || checksheet_list[i].is_online == undefined) {
                                checksheet_list[i].is_online = 0;
                            }

                            var is_mandatory = checksheet_list[i].is_mandatory;
                            var is_disabled = checksheet_list[i].is_disabled;
                            var is_readchecksheet = checksheet_list[i].is_readchecksheet;
                            var is_online = checksheet_list[i].is_online;  // get log from server if not found in local forward side
                            var is_icon_display = checksheet_list[i].is_icon_display;  // show/hide control icon
                            if (is_icon_display == '' || is_icon_display == null || is_icon_display == undefined) {
                                is_icon_display = "true";
                            }

                            var RaiseExceptionFlag = localStorage.getItem('RaiseExceptionFlag');
                            if ((checksheet_list[i].checksheetid == 3791 || checksheet_list[i].checksheetid == 15555) && (RaiseExceptionFlag == 1 || RaiseExceptionFlag == 2 || RaiseExceptionFlag == 3)) {
                                // if raise exception then make checksheet disabled
                                is_disabled = 1;
                            }

                            if (is_submited == 1 && gb_check == 'false' || is_mandatory == 0 || is_disabled == 1) {
                                // completed checksheet button (for atc rejection)
                                var back_color = "green";
                                var param = "check_old_task_for_checksheet('" + checksheet_list[i].checksheetid + "','" + checksheet_list[i].c_name
                                    + "','" + server_task_id + "','" + checksheet_list[i].start_status + "','" + checksheet_list[i].end_status
                                    + "', '" + checksheet_list[i].last_step + "','" + reject_status + "','1', 'true','" + is_disabled + "', '" + is_readchecksheet + "', '" + is_online + "', '" + i + "', '" + checksheet_list[i].Group_Name + "', '" + is_icon_display + "')";
                                if (cl_geofence == 'true' && near_site == 0 && ref_found == 1) {
                                    param = param_geo;
                                }
                                blue_index = i;
                            } else if (is_submited == 1 || (start_status > c_start_status && gb_by_status == 'true' || is_mandatory == 0)) {
                                // completed checksheet button (for atc rejection)
                                var back_color = "green";
                                var param = "check_old_task_for_checksheet('" + checksheet_list[i].checksheetid + "','" + checksheet_list[i].c_name
                                    + "','" + server_task_id + "','" + checksheet_list[i].start_status + "','" + checksheet_list[i].end_status
                                    + "', '" + checksheet_list[i].last_step + "','" + reject_status + "','1', 'true','" + is_disabled + "', '" + is_readchecksheet + "', '" + is_online + "', '" + i + "', '" + checksheet_list[i].Group_Name + "', '" + is_icon_display + "')";
                                if (cl_geofence == 'true' && near_site == 0 && ref_found == 1) {
                                    param = param_geo;
                                }
                                blue_index = i;
                            }
                            else if (start_status == c_start_status || (start_status != c_start_status && is_submited == 0 && c_start_status == 0)) {
                                // status matched & fill

                                if (dynamic_checklist == 'true') {
                                    // dynamic checksheet exist

                                    // check for refrence checksheet is filled or not
                                    var Ref_checksheet_id = checksheet_list[i].Ref_checksheet_id;
                                    if (Ref_checksheet_id == 0) {
                                        var enable = 0;  // enabled it there is no reference
                                    }
                                    else {
                                        for (p = 0; p < new_checksheet_list.length; p++) {
                                            if (Ref_checksheet_id == new_checksheet_list[p].checksheetid && c_start_status == new_checksheet_list[p].start_status) {
                                                var ref_is_submited = new_checksheet_list[p].is_submited;
                                                var ref_c_name = new_checksheet_list[p].c_name;
                                                break;
                                            }
                                        }
                                        if (ref_is_submited == 1) {
                                            var enable = 0;  // enable it because reference checksheet is completed
                                        }
                                        else {
                                            var enable = 2;  // disable it because reference checksheet is not completed
                                        }
                                    }
                                }
                                else {
                                    if (tat_check == "false" || tat_check == "" || tat_check == null || tat_check == undefined) {
                                        var enable = 0;
                                    } else {
                                        var tat_type = checksheet_list[i].tat_type;
                                        var dependent = checksheet_list[i].dependent;
                                        var before_days = parseInt(checksheet_list[i].before_days);
                                        var gap_days = parseInt(checksheet_list[i].gap_days);

                                        if (dependent == "assign") {
                                            // assign date

                                            var d2 = new Date(assign_date);
                                            var d3 = new Date(assign_date);

                                            // in case online task click + dateformat is dd/mm/yyyy
                                            if (d2 == "Invalid Date") {
                                                // convert to fixed format as it is dyanmic now - mk - 08072025
                                                assign_date = convert_fix_format_date_on_submit(assign_date, "date");
                                                d2 = new Date(assign_date);
                                                d3 = new Date(assign_date);
                                            }

                                            d2.setDate(d2.getDate() - before_days);
                                            d3.setDate(d3.getDate() + gap_days);
                                            var tat_date = getFormattedDate(d2);
                                            var end_tat_date = getFormattedDate(d3);
                                            if (tat_type == "include") {
                                                if ((curr_date >= tat_date) && (curr_date <= end_tat_date)) {
                                                    var enable = 0;
                                                } else {
                                                    var enable = 1;
                                                }
                                            } else {
                                                if ((curr_date <= tat_date) || (curr_date >= end_tat_date)) {
                                                    var enable = 0;
                                                } else {
                                                    var enable = 1;
                                                }
                                            }
                                        } else {
                                            // survey date
                                            var d2 = new Date(survey_date);
                                            d2.setDate(d2.getDate() + gap_days);
                                            var tat_date = getFormattedDate(d2);
                                            if (tat_type == "include") {
                                                if (curr_date <= tat_date) {
                                                    var enable = 0;
                                                } else {
                                                    var enable = 1;
                                                }
                                            } else {
                                                if (curr_date >= tat_date) {
                                                    var enable = 0;
                                                } else {
                                                    var enable = 1;
                                                }
                                            }
                                        }
                                    }
                                }

                                if (enable == 0) {
                                    var back_color = "#cb6767";
                                    var param = "check_old_task_for_checksheet('" + checksheet_list[i].checksheetid + "','"
                                        + checksheet_list[i].c_name + "','" + server_task_id + "','" + checksheet_list[i].start_status
                                        + "','" + checksheet_list[i].end_status + "', '" + checksheet_list[i].last_step
                                        + "','" + reject_status + "','0', 'false','" + is_disabled + "', '" + is_readchecksheet + "', '" + is_online + "', '" + i + "', '" + checksheet_list[i].Group_Name + "', '" + is_icon_display + "')";
                                    if (cl_geofence == 'true' && near_site == 0 && ref_found == 1) {
                                        param = param_geo;
                                    }
                                    blue_index = i;
                                    bgr_found++;
                                    blue_found++;
                                }
                                else if (enable == 1) {
                                    // status matched but wait till TAT date
                                    var back_color = "grey";
                                    var param = "grey_button_click('" + tat_date + "', '" + end_tat_date + "', '" + dependent + "', '" + tat_type + "')";
                                    if (cl_geofence == 'true' && near_site == 0 && ref_found == 1) {
                                        param = param_geo;
                                    }
                                    bgr_found++;
                                }
                                else {
                                    // enable == 2 status matched but wait till refrence checksheet completed
                                    var back_color = "grey";
                                    var param = "grey2_button_click('" + ref_c_name + "')";
                                    if (cl_geofence == 'true' && near_site == 0 && ref_found == 1) {
                                        param = param_geo;
                                    }
                                    bgr_found++;
                                }

                            } else {
                                // status not matched
                                var back_color = "red";
                                var param = "red_button_click()";
                                if (cl_geofence == 'true' && near_site == 0 && ref_found == 1) {
                                    param = param_geo;
                                }
                                bgr_found++;
                            }

                            if (back_color == "green") {
                                back_color = "#4caf50";
                            }
                            else if (back_color == "#cb6767") {
                                back_color = "#2196f3";
                            }
                            else if (back_color == "grey") {
                                back_color = "#9e9e9e";
                            }
                            else if (back_color == "red") {
                                back_color = "#f44336";
                            }

                            var main_back_color = '';
                            var is_delete_photo = localStorage.getItem('is_photo_delete');
                            if (is_delete_photo == "[]" || is_delete_photo == "null" || is_delete_photo == "Unknown" || is_delete_photo == null || is_delete_photo == undefined || is_delete_photo == "") { }
                            else {
                                var media_data = JSON.parse(is_delete_photo);
                                if (media_data.length > 0) {
                                    for (dm = 0; dm < media_data.length; dm++) {
                                        var checksheet_name = media_data[dm].c_name;
                                        if (checksheet_list[i].c_name == checksheet_name) {
                                            main_back_color = 'background-color: #ffcccc';
                                            break;
                                        }
                                    }
                                }
                            }

                            var is_punchinout = checksheet_list[i].is_punchinout;
                            if (is_punchinout == '0') {
                                var class_str = '';
                            }
                            else {
                                var class_str = 'cls-punchinout';
                            }

                            if (checksheet_list[i].dynamic_checksheet == 'true') {
                                var dyn_class = 'dyn_cls';
                            }
                            else {
                                var dyn_class = '';
                            }


                            var list_item = '';

                            /////////////create checksheet group button/////////
                            var group_name = checksheet_list[i].Group_Name;
                            if (group_name == "" || group_name == null || group_name == undefined) {
                                group_name = "";
                                var checksheet_disp = '';
                                var cls_checksheet = '';
                            }
                            else {
                                group_btn_color_array.push(back_color);

                                var checksheet_group_name = localStorage.getItem('checksheet_group_name');
                                if (checksheet_group_name != "" && (curr_btn_mode == "back" || curr_btn_mode == "updatetasknsubmit" || curr_btn_mode == "submit" || curr_btn_mode == "reject")) {
                                    var checksheet_disp = 'display:block;';
                                    $("#icon_group_checksheet").attr('class', 'fa fa-minus-square-o');
                                }
                                else {
                                    var checksheet_disp = 'display:none;';
                                }

                                var cls_checksheet = 'cls_grp_chekchseet';
                                if (group_name.indexOf(group_name_array[0]) > -1) {
                                }
                                else {
                                    group_name_array.push(group_name);
                                    list_item += '<li class="list_grp_checksheet" onclick="show_hide_group_checksheet()" style="font-weight:bold;border-right: 15px solid #2196f3;"><a class="item-content button" style="padding-left:20px; ' + main_back_color + '"><div class="item-media"><i id="icon_group_checksheet" class="fa fa-plus-square-o" style="color: #000;"></i></div><div class="item-inner item-no-pad" style="padding-right:5px"><div class="item-title">' + group_name + '</div></div></a></li>';
                                }
                            }
                            //////////////////////


                            var curr_checksheet_id = checksheet_list[i].checksheetid;
                            var icon_base64 = checksheet_list[i].Checksheet_Icon;
                            if (icon_base64 == '' || icon_base64 == null || icon_base64 == undefined) {
                                icon_base64 = "check-square-o";
                            }

                            if (icon_base64.indexOf("data:image") > -1) {
                                //----base64
                                list_item += '<li id="checksheet_' + curr_checksheet_id + '" class="' + cls_checksheet + '" onclick ="' + param + '" style="border-right: 15px solid ' + back_color + ';' + checksheet_disp + '" class="' + dyn_class + ' ' + class_str + '"><a class="item-content button" style="padding-left:10px; ' + main_back_color + '"><div class="item-media"><img src="' + icon_base64 + '" style="width:42px; height:42px; margin-top:-5px; margin-right:7px"></div><div class="item-inner item-no-pad" style="padding-right:5px"><div class="item-title">' + checksheet_list[i].c_name + '</div>';
                            }
                            else {
                                //----FA icon
                                list_item += '<li id="checksheet_' + curr_checksheet_id + '" class="' + cls_checksheet + '" onclick ="' + param + '" style="border-right: 15px solid ' + back_color + ';' + checksheet_disp + '"><a class="item-content button" style="padding-left:12px; ' + main_back_color + '"><div class="item-media"><i class="fa fa-' + icon_base64 + '" style="margin-right:0;"></i></div><div class="item-inner item-no-pad" style="padding-right:5px"><div class="item-title">' + checksheet_list[i].c_name + '</div>';
                            }

                            var Background_Image = checksheet_list[i].Background_Image;
                            if (Background_Image == '' || Background_Image == null || Background_Image == undefined) {
                                list_item += '<input type="hidden" id="Chk_Back_' + i + '" value="" >';
                            }
                            else {
                                list_item += '<input type="hidden" id="Chk_Back_' + i + '" value="' + Background_Image + '" >';
                            }

                            // when checklist geofence is on and geo fence is applied in current checksheet
                            //cl_geofence = 'true';
                            //ref_found = 1;
                            list_item += '<div class="item-after"><div class="item-icon">';

                            if (cl_geofence == 'true' && ref_found == 1) {
                                if (near_site == 1) {
                                    list_item += '<i class="fa fa-check-circle cls_task_ico" style="font-size: 32px; margin-top:5px" onclick="' + alert_param + '"></i>';
                                } else {
                                    list_item += '<i class="fa fa-times-circle cls_task_ico" style="font-size: 32px; margin-top:5px" onclick="' + alert_param + '"></i>';
                                }
                            }
                            list_item += '</div></div></div></a>';
                            list_item += '</li>';
                            $("#checksheet_list").append(list_item);
                            checksheet_displaying++;

                            $('.cls_task_ico').click(function (event) {
                                event.stopPropagation();
                            });
                        } else {
                            // alert1("checksheet start status not found in array");
                        }
                    } else {
                        // alert1("role not matched");
                    }
                }
            }

            breakpoint = 7;

        } else {
            var list_item = '<li><input type="button" value="No Checksheet Found !"  class="theme_Selection_btn"></li>';
            $("#checksheet_list").append(list_item);
        }

        // remove autoscroll after checksheet submit - atc - 09062020
        ////when checksheet is submitted or go back from checksheet from, scroll that checksheet to top 
        //if (curr_btn_mode == "back" || curr_btn_mode == "updatetasknsubmit" || curr_btn_mode == "submit" || curr_btn_mode == "reject") {
        //    try {
        //        var curr_check_type = JSON.parse(storage.getItem('check_type'));
        //        var scroll_top = $("#checksheet_" + curr_check_type + "").offset().top;
        //        $("#checksheet_" + curr_check_type + "").parents('.page-content').animate({ scrollTop: scroll_top - 58 });
        //    }
        //    catch (e) { }
        //}

        breakpoint = 8;

        //border-color of checksheet group btn
        if (group_name_array.length > 0) {
            if (group_btn_color_array.indexOf("#2196f3") > -1) {
                //blue group btn
                $(".list_grp_checksheet").css('border-right', 'solid 15px #2196f3');
            }
            else {
                //green group btn
                $(".list_grp_checksheet").css('border-right', 'solid 15px #4caf50');

                $('.cls_grp_chekchseet').css('display', 'none');
                $("#icon_group_checksheet").attr('class', 'fa fa-plus-square-o');
            }
        }
        ////////////////

        breakpoint = 9;

        //localStorage.setItem('last_checklist_count', checksheet_displaying);
        set_common_localStorage('last_checklist_count', checksheet_displaying);

        var redirect_on_checksheet = get_common_localStorage('redirect_on_checksheet');
        if (redirect_on_checksheet == "true" && checksheet_displaying > 1) {
            // task listing page
            set_common_localStorage('redirect_on_checksheet', 'false');
            changeurl("viewsitelist_pm_grouplist.html");
        }
        else {
            // checklist page

            var dynamic_checklist_display = list_data[0].dynamic_checklist_display;
            if (dynamic_checklist_display == 'false') {
                $('.dyn_cls').hide();
            }

            /////// nokia change - shortcut buttons//////////////
            var buttons = list_data[0].buttons;
            if (buttons == '' || buttons == null || buttons == undefined || buttons.length == 0) { }
            else {
                var siteid = JSON.parse(storage.getItem('siteid'));
                var tid = JSON.parse(storage.getItem('tid'));
                var start_status = JSON.parse(storage.getItem('start_status'));
                var wayflow = JSON.parse(storage.getItem('wayflow'));
                var wayflow_name = JSON.parse(storage.getItem('wayflow_name'));
                var sitename = JSON.parse(storage.getItem('sitename'));
                var server_task_id = JSON.parse(storage.getItem('server_task_id'));
                var site_lat = JSON.parse(storage.getItem('site_lat'));;
                var site_long = JSON.parse(storage.getItem('site_long'));;
                var curr_date = new Date();
                var survey_date = curr_date.toUTCString();
                var ser_milli = curr_date.getTime();

                var btn_str = '<p class="buttons-row" style="margin-top: 10px; display: block">';
                var btn_len = buttons.length;
                for (b = 0; b < btn_len; b++) {
                    var placement = buttons[b].placement;
                    if (placement == 'checksheet' || placement == 'all') {
                        var view_dependancy = buttons[b].view_dependancy;
                        var enabled = false;
                        if (view_dependancy == 'always') { enabled = true; }
                        else if (view_dependancy == 'green') {
                            if (bgr_found == 0) { enabled = true; }
                        }
                        else if (view_dependancy == 'status') {
                            var dependancy_status = buttons[b].dependancy_status;
                            var dlen = dependancy_status.length
                            var t_status = myArray[0].status;
                            for (s = 0; s < dlen; s++) {
                                if (dependancy_status[s] == t_status) {
                                    enabled = true;
                                    break;
                                }
                            }
                        }
                        if (enabled == true) {
                            var checksheet_id = buttons[b].checksheet_id;
                            var btn_status = buttons[b].status;
                            var submit_message = buttons[b].submit_message;
                            punchout_entry = buttons[b].punchout_entry;
                            if (punchout_entry == '' || punchout_entry == null || punchout_entry == undefined) {
                                punchout_entry = '0';
                            }

                            if (buttons[b].name == "MORE") {
                                $('.cls-more').show();
                            }
                            else {
                                var RaiseExceptionFlag = localStorage.getItem('RaiseExceptionFlag');
                                if (RaiseExceptionFlag == '1' || RaiseExceptionFlag == '2') {
                                    var param_btn = "";
                                }
                                else {
                                    var param_btn = "update_task_by_shortcut_button('" + checksheet_id + "','" + btn_status + "', '" + siteid + "', '" + tid + "', '" + start_status + "','" + wayflow + "', '" + wayflow_name + "', '" + sitename + "', '" + server_task_id + "', '" + site_lat + "', '" + site_long + "', '" + survey_date + "', '" + ser_milli + "', '" + submit_message + "')";
                                }

                                var type20_columndata = JSON.parse(storage.getItem('type20_columndata'));
                                if (type20_columndata == '' || type20_columndata == null || type20_columndata == undefined) {
                                    type20_columndata = [];
                                }
                                btn_str += '<input type="hidden" id="lst_sys_var_' + server_task_id + '" value="' + encodeURIComponent(JSON.stringify(type20_columndata)) + '">'

                                if (checksheet_id == 0) {
                                    var sb_icon = "fa-paper-plane";
                                }
                                else {
                                    var sb_icon = "fa-share-square-o";
                                }
                                if (btn_len == 0) {
                                    var margin_right = "margin-right: 0px;"
                                }
                                else {
                                    var margin_right = "margin-right: 14px !important;"
                                }

                                btn_str += '<a class="button button-fill button-raised cls_fence cls-punchinout" onclick="' + param_btn + '" style="margin: 0;' + margin_right + 'background:grey!important; border-right: 0px !important;display: inline-block;">';
                                btn_str += '<i class="fa ' + sb_icon + '" style="font-size: 20px;display: inline-block; color: #fff !important;vertical-align: middle;margin-right: 10px !important;"></i>' + buttons[b].name + '</a>';
                            }
                        }
                    }
                }
                btn_str += '</p>';
                $("#buttons_list").append(btn_str);
            }

            var punching = list_data[0].punching;
            if (punching == 'true') {
                in_ms = myArray[0].in_ms;
                duration = myArray[0].duration;
                var punch_flag = myArray[0].punch_flag;
                curr_punch_flag = punch_flag;

                if (in_ms == '' || in_ms == null || in_ms == undefined || in_ms == 'Unknown' || in_ms == 'null' || in_ms == '-1') {
                    in_ms = new Date().getTime();
                }
                if (duration == '' || duration == null || duration == undefined || duration == 'Unknown' || duration == 'null' || duration == 'NA' || duration == '-1') {
                    duration = 0;
                }

                punchin_detail = [{ 'in_ms': in_ms, 'duration': duration }];
                localStorage.setItem('punchin_detail', JSON.stringify(punchin_detail));

                if (punch_flag == '0' || punch_flag == '' || punch_flag == null || punch_flag == undefined || punch_flag == 'Unknown' || punch_flag == 'null' || punch_flag == 'NA' || punch_flag == '-1') {
                    $(".punchinout input[type=checkbox]").prop('checked', false);
                    $(".cls-punchinout").addClass('chk_disabled');
                    var total_working_time = parseMillisecondsIntoReadableTime(duration);
                    //document.getElementById("lbl_count").innerHTML = total_working_time;
                    $('#lbl_count').text(total_working_time);
                }
                else if (punch_flag == '1') {
                    $(".punchinout input[type=checkbox]").prop('checked', true);
                    $(".cls-punchinout").removeClass('chk_disabled');
                    $("#btn_punch_pause").removeAttr('disabled');
                    $(".punchinout input[type=checkbox]").attr('disabled', 'disabled');
                    continous_update_punch_milli();
                }
                else if (punch_flag == '2') {
                    $(".punchinout input[type=checkbox]").prop('checked', true);
                    $(".cls-punchinout").addClass('chk_disabled');
                    $("#btn_punch_continue").removeAttr('disabled');
                    $(".punchinout input[type=checkbox]").attr('disabled', 'disabled');
                    var total_working_time = parseMillisecondsIntoReadableTime(duration);
                    //document.getElementById("lbl_count").innerHTML = total_working_time;
                    $('#lbl_count').text(total_working_time);
                }
                else if (punch_flag == '3') {
                    $(".punchinout input[type=checkbox]").prop('checked', true);
                    $(".cls-punchinout").removeClass('chk_disabled');
                    $("#btn_punch_pause").removeAttr('disabled');
                    $(".punchinout input[type=checkbox]").attr('disabled', 'disabled');
                    continous_update_punch_milli();
                }
            }

            /////////////////////////////////

            $("#tbl_chk_details").show();
            var li_length = $("#checksheet_list li").length;
            if (li_length > 5) {
                $("#txtsearch").show();
            } else {
                $("#txtsearch").hide();
            }

            storage.setItem('all_green', JSON.stringify('false'));
            var curr_btn_mode = JSON.parse(storage.getItem('curr_btn_mode'));

            if (bgr_found == 0) {
                // no blue, grey, red viewable checksheet found
                // changeurl("selection_survey.html");

                // //////////////////////////////
                var completed_editable = list_data[0].completed_editable;

                if (curr_btn_mode != 'back' && blue_found == 0 && checksheet_displaying == 1) {
                    // wipro - case - global var updated but log not submit due to authentication 03042023 mk
                    completed_editable = "true";
                }

                if (curr_btn_mode == 'updatetasknsubmit') {
                    completed_editable = 'false';
                } else {
                    if (gb_by_status == 'true') {
                        storage.setItem('all_green', JSON.stringify('true'));
                    }
                }

                if (completed_editable == "" || completed_editable == null || completed_editable == undefined || completed_editable == "false") {

                    var cust_flow_Array = JSON.parse(storage.getItem('cust_flow_Array'));
                    var flow_Array = JSON.parse(storage.getItem('flow_Array'));
                    if (flow_Array.length == 1 || (flow_Array.length == 2 && cust_flow_Array.length == 1)) {
                        if (curr_btn_mode != 'updatetasknsubmit' && curr_btn_mode != 'savenexit') {
                            alert1("This task is already submitted !"); // commented 13032023-DV --      enabled - mk - 11092024 
                        }
                        //if (checksheet_displaying != 0) {
                        changeurl("selection_survey.html");
                        //}
                    } else {
                        var selected_tid = flow_Array[flow_Array.length - 2].tid;
                        var selected_site = flow_Array[flow_Array.length - 2].siteid;
                        var selected_start_status = flow_Array[flow_Array.length - 2].start_status;
                        // var selected_end_status = flow_Array[flow_Array.length -
                        // 2].end_status;
                        storage.setItem('tid', JSON.stringify(selected_tid));
                        storage.setItem('siteid', JSON.stringify(selected_site));
                        storage.setItem('start_status', JSON.stringify(selected_start_status));
                        // storage.setItem('end_status',
                        // JSON.stringify(selected_end_status));

                        var type = flow_Array[flow_Array.length - 1].type;
                        if (type == 'Module' || type == 'Flow') {
                            if (curr_btn_mode != 'updatetasknsubmit' && curr_btn_mode != 'savenexit') {
                                alert1("This task is already submitted !"); // commented 13032023-DV    enabled - mk - 11092024 
                            }
                            //if (checksheet_displaying != 0) {
                            changeurl("selection_survey.html");
                            //}
                        } else {
                            // group
                            flow_Array.pop();
                            var id = flow_Array[0].id;
                            var flow_id = flow_Array[0].wayflow;
                            var flow_name = flow_Array[0].wayflow_name;
                            var list_json = flow_Array[0].list_json;
                            storage.setItem('udf_id', JSON.stringify(id));
                            storage.setItem('wayflow', JSON.stringify(flow_id));
                            storage.setItem('wayflow_name', JSON.stringify(flow_name));

                            // multitab handling
                            var tab_index = flow_Array[0].tab_index;
                            list_json = JSON.parse(list_json);
                            var f_list_data = JSON.stringify(list_json[tab_index]);
                            storage.setItem('list_json', JSON.stringify("[" + f_list_data + "]"));

                            storage.setItem('flow_Array', JSON.stringify(flow_Array));
                            changeurl("viewsitelist_pm_grouplist.html");
                        }
                    }
                }
                //else if (checksheet_displaying > 1 && (redirect_on_checksheet == "true" || curr_btn_mode == 'back')) {
                else if (checksheet_displaying > 1 && redirect_on_checksheet == "true") {
                    // skip + task listing page
                    set_common_localStorage('redirect_on_checksheet', 'false');
                    storage.setItem('curr_btn_mode', JSON.stringify(""));           //don't backward skip for multiple green checksheet
                    changeurl("viewsitelist_pm_grouplist.html");
                }
                else if (curr_btn_mode != 'back' && checksheet_displaying == 1) {
                    //to skip single checksheet
                    $("#checksheet_list").empty();
                    $('#tbl_chk_details').hide();

                    let server_call_flag = get_is_submitted_from_global_var(checksheet_list[blue_index].checksheetid, checksheet_list[blue_index].start_status, checksheet_list[blue_index].role_id);

                    check_old_task_for_checksheet(checksheet_list[blue_index].checksheetid, checksheet_list[blue_index].c_name, server_task_id, checksheet_list[blue_index].start_status,
                        checksheet_list[blue_index].end_status, checksheet_list[blue_index].last_step, checksheet_list[blue_index].reject_status, server_call_flag, 'false', checksheet_list[blue_index].is_disabled, checksheet_list[blue_index].is_readchecksheet, checksheet_list[blue_index].is_online, blue_index, checksheet_list[blue_index].Group_Name, checksheet_list[blue_index].is_icon_display);
                }
                else if ((curr_btn_mode == 'back' && checksheet_displaying == 0)) {
                    // no checksheet to display on back 
                    back_button('viewsitelist_pm_grouplist');
                }
                //else if (curr_btn_mode == 'back' && checksheet_displaying == 1
                //   && (cl_geofence == 'false' || (cl_geofence == 'true' && near_site == 1 && ref_found == 1))) {
                //    // backward skip for single checksheet 
                //    back_button('viewsitelist_pm_grouplist');
                //}
            }
            else if (curr_btn_mode != 'back' && blue_found == 1 && checksheet_displaying == 1
                && (cl_geofence == 'false' || (cl_geofence == 'true' && near_site == 1 && ref_found == 1))) {
                //to skip single checksheet
                $("#checksheet_list").empty();
                $('#tbl_chk_details').hide();
                check_old_task_for_checksheet(checksheet_list[blue_index].checksheetid, checksheet_list[blue_index].c_name, server_task_id, checksheet_list[blue_index].start_status,
                    checksheet_list[blue_index].end_status, checksheet_list[blue_index].last_step, checksheet_list[blue_index].reject_status, '0', 'false', checksheet_list[blue_index].is_disabled, checksheet_list[blue_index].is_readchecksheet, checksheet_list[blue_index].is_online, blue_index, checksheet_list[blue_index].Group_Name, checksheet_list[blue_index].is_icon_display);
            }
            //else if ((curr_btn_mode != 'back' && redirect_on_checksheet == "true") || (curr_btn_mode == 'back' && checksheet_displaying > 1)) {
            else if ((curr_btn_mode != 'back' && redirect_on_checksheet == "true")) {
                // skip + red/grey checksheet
                set_common_localStorage('redirect_on_checksheet', 'false');
                storage.setItem('curr_btn_mode', JSON.stringify(""));               // Don't backward skip for multiple checksheet 
                changeurl("viewsitelist_pm_grouplist.html");
            }
            //else if (curr_btn_mode == 'back' && blue_found == 1 && checksheet_displaying == 1
            //       && (cl_geofence == 'false' || (cl_geofence == 'true' && near_site == 1 && ref_found == 1))) {
            //    // backward skip for single checksheet 
            //    back_button('viewsitelist_pm_grouplist');
            //}
        }

        breakpoint = 10;

        enable_back_button();
        loading_hide();

    } catch (e) {
        alert1("breakpoint: " + breakpoint);
        alert1(e + '_onsuccess_get_list_of_pm_checksheets');
        loading_hide();
    }
}


function show_hide_group_checksheet(t_elem) {
    // remove autoscroll after checksheet submit - atc - 09062020
    //var scroll_top = $(".list_grp_checksheet").position().top;
    //$(".list_grp_checksheet").parents('.page-content').animate({ scrollTop: scroll_top });

    let t_group_name = $(t_elem).attr("group_ico");
    if (t_group_name == "" || t_group_name == null || t_group_name == undefined) {
        // listing from viewsitelist_pm_grouplist
        var check_disp = $('.cls_grp_chekchseet').css('display');
        if (check_disp == "none") {
            $("#icon_group_checksheet").attr('class', 'fa fa-minus-square-o');
            $('.cls_grp_chekchseet').show();
        }
        else {
            $("#icon_group_checksheet").attr('class', 'fa fa-plus-square-o');
            $('.cls_grp_chekchseet').hide();
        }
    }
    else {
        // listing from hybrid viewsitelist_sub_task_hybrid
        //var check_disp = $('.cls_grp_chekchseet').css('display');
        var curr_class = $(t_elem).find('i').attr("class");
        if (curr_class == "fa fa-plus-square-o") {
            $(t_elem).find('i').attr("class", 'fa fa-minus-square-o');
            $("#checksheet_list li[group_name='" + t_group_name + "']").show();
        }
        else {
            $(t_elem).find('i').attr("class", 'fa fa-plus-square-o');
            $("#checksheet_list li[group_name='" + t_group_name + "']").hide();
        }
    }
}


// checking old task status from task master
function check_old_task_for_checksheet(selected_check_type, selected_checksheet_name, selected_server_task_id, selected_start_status, selected_end_status,
    selected_last_step, reject_status, server_call_flag, loc_task_update, c_is_disabled, c_is_readchecksheet, c_is_online, c_index, c_group_name, c_is_icon_display) {
    try {

        loading();

        storage.setItem('check_type', JSON.stringify(selected_check_type));
        storage.setItem('checksheet_name', JSON.stringify(selected_checksheet_name));
        storage.setItem('c_start_status', JSON.stringify(selected_start_status));
        storage.setItem('end_status', JSON.stringify(selected_end_status));
        storage.setItem('reject_status', JSON.stringify(reject_status));
        storage.setItem('last_step', JSON.stringify(selected_last_step));
        storage.setItem('server_call_flag', JSON.stringify(server_call_flag));
        storage.setItem('loc_task_update', JSON.stringify(loc_task_update));
        storage.setItem('c_is_disabled', JSON.stringify(c_is_disabled));
        storage.setItem('c_is_readchecksheet', JSON.stringify(c_is_readchecksheet));
        storage.setItem('c_is_online', JSON.stringify(c_is_online));

        var company_id = JSON.parse(storage.getItem('company_id'));
        if (company_id == "157") {
            // display icon for ATC company
            c_is_icon_display = "true";
        }
        else {
            c_is_icon_display = "false";
        }

        storage.setItem('c_is_icon_display', JSON.stringify(c_is_icon_display));                      //to show/hide checksheet contol icon

        var Background_Image = $("#Chk_Back_" + c_index + "").val();
        localStorage.setItem('c_back_image', Background_Image);

        var selected_tid = JSON.parse(storage.getItem('tid'));

        if (c_group_name == "" || c_group_name == null || c_group_name == undefined) {
            localStorage.setItem('checksheet_group_name', "");
        }
        else {
            localStorage.setItem('checksheet_group_name', c_group_name);
        }

        var query = "select tid, server_task_id, task_id, step from task_master where tid = '" + selected_tid + "'";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "1" // 1 for selecting values from table (in json)
        });
        cordova.exec(onsuccess_check_old_task, onfail_check_old_task, 'SqlitePlugin', 'showValues', q_jsonobj);
    } catch (e) {
        alert1(e + '_check_old_task_for_checksheet()');
        loading_hide();
    }
}

var start_step = 'last_blank';
function onsuccess_check_old_task(e) {
    try {
        var myArray = JSON.parse(e);
        if (myArray.length > 0) {
            // alert1("Old task is pending...starting old task...");
            storage.setItem('tid', JSON.stringify(myArray[0].tid));
            storage.setItem('task_id', JSON.stringify(myArray[0].task_id));
            storage.setItem('server_task_id', JSON.stringify(myArray[0].server_task_id));

            var data_json = JSON.parse(storage.getItem('list_json'));
            var list_data = JSON.parse(data_json);
            var group_task_column = list_data[0].group_task_column;
            if (group_task_column == "" || group_task_column == null || group_task_column == undefined) {
                var is_delete_photo = localStorage.getItem('is_photo_delete');
                if (is_delete_photo == "[]" || is_delete_photo == "null" || is_delete_photo == "Unknown" || is_delete_photo == null || is_delete_photo == undefined || is_delete_photo == "") {
                    //if delete media is not found
                    var data_json = JSON.parse(storage.getItem('list_json'));
                    var list_data = JSON.parse(data_json);
                    var checksheet_start_step = list_data[0].checksheet_start_step;
                    if (checksheet_start_step == '' || checksheet_start_step == null || checksheet_start_step == undefined) {
                        // start checksheet with first step
                        onfail_get_last_log_step_for_chekchseet('e');
                    }
                    else {
                        var check_type = JSON.parse(storage.getItem('check_type'));
                        var len = checksheet_start_step.length;
                        for (i = 0; i < len; i++) {
                            var checkhseet_id = checksheet_start_step[i].id;
                            if (check_type == checkhseet_id) {
                                start_step = checksheet_start_step[i].step;
                                break;
                            }
                        }
                        if (start_step == 'first') {
                            // start checksheet with first step
                            onfail_get_last_log_step_for_chekchseet('e');
                        }
                        else {
                            // start checksheet with last filled step
                            get_last_log_step_for_chekchseet();
                        }
                    }
                }
                else {
                    //if delete media is found then start checksheet with first step always
                    var media_data = JSON.parse(is_delete_photo);
                    if (media_data.length > 0) {
                        for (dm = 0; dm < media_data.length; dm++) {
                            var dm_checksheet_name = media_data[dm].c_name;
                            var curr_checksheet_name = JSON.parse(storage.getItem('checksheet_name'));
                            if (curr_checksheet_name == dm_checksheet_name) {
                                // start checksheet with first step
                                onfail_get_last_log_step_for_chekchseet('e');
                                break;
                            }
                        }
                    }
                }
            }
            else {
                // group task - get last filled step number directly
                get_last_log_step_for_chekchseet_group_task();
            }

        } else {
            // alert1("Task is syncing with server please try again !");
            get_list_of_pm_checksheets();
            loading_hide();
        }
    } catch (e) {
        alert1(e + '_onsuccess_check_old_task');
        loading_hide();
    }
}

function get_last_log_step_for_chekchseet() {
    try {
        var t_id = JSON.parse(storage.getItem('tid'));
        var check_type = JSON.parse(storage.getItem('check_type'));
        var query = "select max(fid), step from f_master where tid = '" + t_id
            + "' and f_value = '" + check_type + "' and c_type='1' and f_type != 'save' and f_key != '0'";
        //alert1(query);
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "1"
        });
        cordova.exec(onsuccess_get_last_log_step_for_chekchseet, onfail_get_last_log_step_for_chekchseet, 'SqlitePlugin', 'showValues', q_jsonobj);
    } catch (e) {
        alert1(e + '_get_last_log_step_for_chekchseet()');
    }
}

function onsuccess_get_last_log_step_for_chekchseet(e) {
    try {
        var myArray = JSON.parse(e);
        if (myArray.length > 0) {
            var step = myArray[0].step;
            if (step == '' || step == null || step == undefined || step == 'Unknown') {
                var step = 1;
            }
            else {
                var step = parseInt(step);
                //var chk_last_step = JSON.parse(storage.getItem('last_step'));
                //if (start_step == 'last_blank' && step < chk_last_step) {
                //    step = step + 1;
                //}
            }
        }
        else {
            var step = 1;
        }

        var last_step = step;
        var temp_step_Array = [];
        for (i = 1; i <= last_step; i++) {
            temp_step_Array.push(i); // push steps in array upto last step
        }

        storage.setItem('step_Array_to_read', JSON.stringify(temp_step_Array));
        changeurl("viewsitedata.html");
    } catch (e) {
        alert1(e + '_onsuccess_get_last_log_step_for_chekchseet()');
    }
}

function onfail_get_last_log_step_for_chekchseet(e) {
    try {
        var last_step = 1;
        var temp_step_Array = [];
        for (i = 1; i <= last_step; i++) {
            temp_step_Array.push(i); // push steps in array upto last step
        }

        storage.setItem('step_Array_to_read', JSON.stringify(temp_step_Array));
        changeurl("viewsitedata.html");
    } catch (e) {
        alert1(e + '_onfail_get_last_log_step_for_chekchseet()');
    }
}

// group task - get last step
function get_last_log_step_for_chekchseet_group_task() {
    var server_task_id = JSON.parse(storage.getItem('server_task_id'));
    var check_type = JSON.parse(storage.getItem('check_type'))

    var Param_obj = [];
    Param_obj.push({
        'Task_Id': server_task_id,
        'Checksheet_Id': check_type
    });

    loading();
    var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_GetMaxstep', JSON.stringify(Param_obj), function (e) {
        var res_text = e.responseText;
        var result = eval('(' + res_text + ')');
        var status = result[0].status;
        if (status == 1) {
            var last_step = result[0].data;
            var temp_step_Array = [];
            for (i = 1; i <= last_step; i++) {
                temp_step_Array.push(i); // push steps in array upto last step
            }

            storage.setItem('step_Array_to_read', JSON.stringify(temp_step_Array));
            changeurl("viewsitedata.html");
        }
        else {
            var message = result[0].message;
            alert1("Server: " + message);
            loading_hide();
        }
    }, onfail);
    getdata.callOtherDomain();
}

// get task json data from native
function get_task_json_for_getting_cl_latlong() {
    try {
        var t_id = JSON.parse(storage.getItem('tid'));
        var step = 1;
        var check_type = JSON.parse(storage.getItem('check_type_task'));

        var query = "select f_data from f_master where tid = '" + t_id + "' and c_id = '" + check_type + "' and step = '" + step + "'";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "0"
        });
        cordova.exec(onsuccess_get_task_json_for_getting_cl_latlong, onfail_get_task_json_for_getting_cl_latlong, 'SqlitePlugin',
            'showValues', q_jsonobj);
    } catch (e) {
        alert1(e + '_get_task_json_for_getting_cl_latlong()');
        loading_hide();
    }
}

// onsuccess get last step data
function onsuccess_get_task_json_for_getting_cl_latlong(e) {
    try {
        // alert1("Survey Found ! - Reading from file master table...");
        var myArray = JSON.parse(e);
        var data = myArray[0].data;
        data = itemObj._checkStrObj(data);  		// check_item

        storage.setItem('cl_geo_task_json', JSON.stringify(data));
        var cust_checksheet_id = JSON.parse(storage.getItem('cust_checksheet_id'));
        if (cust_checksheet_id == '' || cust_checksheet_id == null || cust_checksheet_id == undefined) {
            // only task json needed
            get_list_of_pm_checksheets();
        } else {
            // customer json needed
            get_customer_json_for_getting_cl_latlong(cust_checksheet_id);
        }
    } catch (e) {
        alert1(e + '_onsuccess_get_task_json_for_getting_cl_latlong()');
        loading_hide();
    }
}

// onfail get last step data
function onfail_get_task_json_for_getting_cl_latlong(e) {
    alert1(e + '_onfail_get_task_json_for_getting_cl_latlong()');
}

// get customer json data from native
function get_customer_json_for_getting_cl_latlong(check_type) {
    try {
        var t_id = JSON.parse(storage.getItem('tid'));
        var step = 1;
        // var check_type = 5538;

        var query = "select f_data from f_master where tid = '" + t_id + "' and c_id = '" + check_type + "' and step = '" + step + "'";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "0"
        });
        cordova.exec(onsuccess_get_customer_json_for_getting_cl_latlong, onfail_get_customer_json_for_getting_cl_latlong,
            'SqlitePlugin', 'showValues', q_jsonobj);
    } catch (e) {
        alert1(e + '_get_customer_json_for_getting_cl_latlong()');
        loading_hide();
    }
}

// onsuccess get customer data
function onsuccess_get_customer_json_for_getting_cl_latlong(e) {
    try {
        // alert1("Survey Found ! - Reading from file master table...");
        var myArray = JSON.parse(e);
        storage.setItem('cl_geo_customer_json', JSON.stringify(myArray));
        get_list_of_pm_checksheets();
    } catch (e) {
        alert1(e + '_onsuccess_get_customer_json_for_getting_cl_latlong()');
        loading_hide();
    }
}

// onfail get customer data
function onfail_get_customer_json_for_getting_cl_latlong(e) {
    alert1(e + '_onfail_get_customer_json_for_getting_cl_latlong()');
}

// when user far from checksheet location
function get_distance_confirmation_pm_checksheet(selected_server_task_id, selected_site_name, geo_checksheet_id, geo_checksheet_name,
    ref_checksheet_id, ref_check_type, lat_que_id, long_que_id, t_user_lat, t_user_long, t_user_accuracy, t_user_radius, t_distance) {
    try {
        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var support = list_data[0].support;
        if (support == "" || support == null || support == undefined) {
            support = "false";
        }

        if (support == "false") {
            alert1("You are " + t_distance + " meters far from checksheet, please change your position !");
        } else {
            if (F7_device == 'ios') {
                var user_choice = true;
            }
            else {
                vibrate_device();
                var user_choice = confirm("You are " + t_distance + " meters far from checksheet. Are you sure, you want to go ahead ?");
            }
            if (user_choice == true) {
                storage.setItem('sitename', JSON.stringify(selected_site_name));
                storage.setItem('server_task_id', JSON.stringify(selected_server_task_id));
                storage.setItem('geo_checksheet_id', JSON.stringify(geo_checksheet_id));
                storage.setItem('geo_checksheet_name', JSON.stringify(geo_checksheet_name));
                storage.setItem('ref_checksheet_id', JSON.stringify(ref_checksheet_id));
                storage.setItem('ref_check_type', JSON.stringify(ref_check_type));
                storage.setItem('lat_que_id', JSON.stringify(lat_que_id));
                storage.setItem('long_que_id', JSON.stringify(long_que_id));
                storage.setItem('user_lat', JSON.stringify(t_user_lat));
                storage.setItem('user_long', JSON.stringify(t_user_long));
                storage.setItem('user_accuracy', JSON.stringify(t_user_accuracy));
                storage.setItem('user_radius', JSON.stringify(t_user_radius));
                storage.setItem('support_type', JSON.stringify('checksheet'));
                changeurl('support_page.html');
            }
        }
    } catch (e) {
        alert1(e + '_get_distance_confirmation_pm_checksheet()');
    }
    return false;
}

// ////////////////////////////

function alert_checksheet_distance(distance, radius, accuracy, check_name, t_user_lat, t_user_long, t_checksheet_lat, t_checksheet_long) {
    alert1("You are " + distance + " meters far from " + check_name + "! \nRadius: " + radius + ", Accuracy: " + accuracy
        + ", \nUser: " + t_user_lat + ", " + t_user_long + ", \nChecksheet: " + t_checksheet_lat + ", " + t_checksheet_long + "");
}

// click on grey button
function grey_button_click(tat_date, end_tat_date, dependent, tat_type) {
    var data_json = JSON.parse(storage.getItem('list_json'));
    var list_data = JSON.parse(data_json);
    var gray_chk_msg = list_data[0].gray_chk_msg;
    if (gray_chk_msg == '' || gray_chk_msg == null || gray_chk_msg == undefined) {
        if (dependent == "assign") {
            if (tat_type == "include") {
                alert1("You are able to fill this checksheet in between " + tat_date + " and " + end_tat_date + " !");
            }
            else {
                alert1("You are able to fill this checksheet on or before " + tat_date + " / on or after " + end_tat_date + " !");
            }
        }
        else {
            alert1("You are able to fill this checksheet on or after " + tat_date + " !");
        }
    }
    else {
        alert1(gray_chk_msg);
    }
}


// click on red button
function red_button_click() {
    alert1("Please complete above checksheet first !");
}

function onfail_check_old_task(e) {
    alert1(e + '_onfail_check_old_task()');
    loading_hide();
}

function onfail_get_list_of_pm_checksheets(e) {
    alert1(e + '_onfail_get_list_of_pm_checksheets()');
    loading_hide();
}

function onfail_get_checklist_data_for_task(e) {
    alert1(e + '_onfail_get_checklist_data_for_task()');
    loading_hide();
}

var temp_punch_flag = 0;
var temp_location_Array = [];
function get_punching_location(p_flag) {
    temp_punch_flag = p_flag;
    var locObj = new MkLocation();
    locObj._getLocation(function (e) {
        check_punching_geo_fence(e);
    });
}

function check_punching_geo_fence(myArray) {
    try {
        temp_location_Array = myArray;
        var lat = myArray[0].lat;
        var long = myArray[0].long;
        var user_accuracy = myArray[0].accuracy;
        user_accuracy = parseFloat(user_accuracy);

        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var punching_geofence = list_data[0].punching_geofence;
        if (punching_geofence == 'false') {
            if (temp_punch_flag == 1) {
                toggle_checksheet_by_punchin_punchout();
            }
            else {
                toggle_checksheet_by_pause_continue(temp_punch_flag);
            }
        }
        else {
            var punching_radius = list_data[0].punching_radius;
            if (punching_radius == '' || punching_radius == null || punching_radius == undefined) {
                punching_radius = 150;
            } else {
                punching_radius = parseInt(punching_radius);
            }

            var site_lat = JSON.parse(storage.getItem('site_lat'));
            var site_long = JSON.parse(storage.getItem('site_long'));
            var distance = getDistanceFromLatLonInMeter(lat, long, site_lat, site_long);
            distance = parseInt(distance);
            //distance = 0;
            if (distance < (punching_radius + user_accuracy)) {
                // inside
                if (temp_punch_flag == 1) {
                    toggle_checksheet_by_punchin_punchout();
                }
                else {
                    toggle_checksheet_by_pause_continue(temp_punch_flag);
                }
            }
            else {
                // outside
                alert1("You are " + distance + " meters far from site!");

                $(".punchinout input[type=checkbox]").prop('checked', false);
                $(".cls-punchinout").addClass('chk_disabled');
            }
        }
    }
    catch (e) {
        alert1(e + '_check_punching_geo_fence()');
    }
}


var curr_punch_flag = 0;
// punch_flag = 0 (punchout) (default/ first time)
// punch_flag = 1 (punchin)
// punch_flag = 2 (pause)
// punch_flag = 3 (continue)
function toggle_checksheet_by_punchin_punchout() {
    if ($(".punchinout input[type=checkbox]").is(':checked')) {
        // punch in
        $(".cls-punchinout").removeClass('chk_disabled');
        $("#btn_punch_pause").removeAttr('disabled');
        $("#btn_punch_continue").attr('disabled', 'disabled');
        $(".punchinout input[type=checkbox]").attr('disabled', 'disabled');
        punchinout_get_location(1);
    }
    else {
        // punch out
        $(".cls-punchinout").addClass('chk_disabled');
        $("#btn_punch_pause").attr('disabled', 'disabled');
        $("#btn_punch_continue").attr('disabled', 'disabled');
        punchinout_get_location(0);
    }
}

function toggle_checksheet_by_pause_continue(p_flag) {
    if (p_flag == 2) {
        // pause
        $(".cls-punchinout").addClass('chk_disabled');
        $("#btn_punch_pause").attr('disabled', 'disabled');
        $("#btn_punch_continue").removeAttr('disabled');
    }
    else {
        // continue
        $(".cls-punchinout").removeClass('chk_disabled');
        $("#btn_punch_pause").removeAttr('disabled');
        $("#btn_punch_continue").attr('disabled', 'disabled');
    }
    punchinout_get_location(p_flag);
}

//function punchinout_get_location(p_flag) {
//    curr_punch_flag = p_flag;
//    var locObj = new MkLocation();
//    locObj._getLocation(function (e) {
//        change_punch_flag(e);
//    });
//}

function punchinout_get_location(p_flag) {
    curr_punch_flag = p_flag;
    var t_myArray = temp_location_Array;
    change_punch_flag(t_myArray);
}

function change_punch_flag(myArray) {
    try {
        var t_id = JSON.parse(storage.getItem('tid'));
        var user_id = JSON.parse(storage.getItem('user_id'));
        var appid = JSON.parse(storage.getItem('appid'));

        var now = new Date();
        var ms = now.getTime();
        var utc_now = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds());
        var utc_ms = utc_now.getTime();
        var lat = myArray[0].lat;
        var long = myArray[0].long;
        var address = myArray[0].address;
        var gprs = myArray[0].gprs;
        var gps = myArray[0].gps;

        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var match_temp_id = list_data[0].match_temp_id;
        if (match_temp_id == "" || match_temp_id == null || match_temp_id == undefined) {
            match_temp_id = "";
        }

        var query = "insert into punch_master(tid, millisecond, UTCmillisecond, username, userid, appid, lat, lon, gprs, gps, address, punch_flag, punch_upload_flag, match_temp_id) values('"
            + t_id + "', '" + ms + "', '" + utc_ms + "', '" + username + "', '" + user_id + "', '" + appid + "', '" + lat + "', '" + long + "', '" + gprs + "', '"
            + gps + "', '" + address + "', '" + curr_punch_flag + "', '0', '" + match_temp_id + "');";
        //alert1(query);
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            q: "0",
            tid: t_id
        });
        cordova.exec(onsuccess_change_punch_flag, onfail_change_punch_flag, 'SqlitePlugin', 'insertValuse', q_jsonobj);
    } catch (e) {
        alert1(e + '_change_punch_flag()');
        loading_hide();
    }
}

//function onsuccess_change_punch_flag(e) {
//    if (curr_punch_flag == "3" || curr_punch_flag == "1") {
//        punch_in_out_time();
//    }
//}

function onsuccess_change_punch_flag(e) {
    update_punch_milli_to_task();
}

function onfail_change_punch_flag(e) { alert1("onfail"); }

function update_punch_milli_to_task() {
    try {
        var t_id = JSON.parse(storage.getItem('tid'));
        var ms = new Date().getTime();

        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var match_temp_id = list_data[0].match_temp_id;
        if (match_temp_id == "" || match_temp_id == null || match_temp_id == undefined) {
            match_temp_id = "";
        }

        if (curr_punch_flag == "3" || curr_punch_flag == "1") {
            in_ms = ms;
            continous_update_punch_milli();
            var query = "UPDATE task_master SET punch_flag = '" + curr_punch_flag + "', in_ms = '" + ms + "', match_temp_id = '" + match_temp_id + "' where tid = '" + t_id + "'";
        }
        else {
            var t_in_ms = parseInt(in_ms);
            var t_duration = (ms - parseInt(in_ms)) + parseInt(duration);
            duration = t_duration;
            var total_working_time = parseMillisecondsIntoReadableTime(t_duration);
            //document.getElementById("lbl_count").innerHTML = total_working_time;
            $('#lbl_count').text(total_working_time);
            clearTimeout(cont_update_punch_ms);

            var query = "UPDATE task_master SET punch_flag = '" + curr_punch_flag + "', out_ms = '" + ms + "', duration = '" + t_duration + "', match_temp_id = '" + match_temp_id + "' where tid = '" + t_id + "'";
        }
        //alert1(query);
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            q: "0",
            tid: "0"
        });
        cordova.exec(onsuccess_update_punch_milli_to_task, onfail_update_punch_milli_to_task, 'SqlitePlugin', 'insertValuse', q_jsonobj);
    }
    catch (e) {
        alert1(e + '_update_punch_milli_to_task()');
    }
}

function onsuccess_update_punch_milli_to_task(e) { }

function onfail_update_punch_milli_to_task(e) { }

var cont_update_punch_ms;
function continous_update_punch_milli() {
    var ms = new Date().getTime();
    var t_duration = (ms - parseInt(in_ms)) + parseInt(duration);
    var total_working_time = parseMillisecondsIntoReadableTime(t_duration);
    //document.getElementById("lbl_count").innerHTML = total_working_time;
    $('#lbl_count').text(total_working_time);
    cont_update_punch_ms = setTimeout(function () {
        continous_update_punch_milli();
    }, 1000);
}

function parseMillisecondsIntoReadableTime(milliseconds) {
    //Get hours from milliseconds
    var hours = milliseconds / (1000 * 60 * 60);
    var absoluteHours = Math.floor(hours);
    var h = absoluteHours > 9 ? absoluteHours : '0' + absoluteHours;

    //Get remainder from hours and convert to minutes
    var minutes = (hours - absoluteHours) * 60;
    var absoluteMinutes = Math.floor(minutes);
    var m = absoluteMinutes > 9 ? absoluteMinutes : '0' + absoluteMinutes;

    //Get remainder from minutes and convert to seconds
    var seconds = (minutes - absoluteMinutes) * 60;
    var absoluteSeconds = Math.floor(seconds);
    var s = absoluteSeconds > 9 ? absoluteSeconds : '0' + absoluteSeconds;


    return h + ':' + m + ':' + s;
}



// Trip Start-Stop

function get_trip_location() {
    var trip_status = localStorage.getItem('trip_status');
    if (trip_status == '1' || trip_status == '' || trip_status == null || trip_status == undefined) {
        // trip start
        myApp.showPreloader('Initializing Trip...');
        var locObj = new MkLocation();
        locObj._getLocation(function (e) {
            onsuccess_get_trip_location(e);
        });
    }
    else {
        // trip disallow
        var t_tid = JSON.parse(storage.getItem('tid'));
        var trip_tid = localStorage.getItem('trip_tid');
        if (t_tid == trip_tid) {
            myApp.showPreloader('Initializing Trip...');
            var locObj = new MkLocation();
            locObj._getLocation(function (e) {
                onsuccess_get_trip_location(e);
            });
        }
        else {
            alert1("Trip is running on another task. Please complete it first !");
            $(".trip-start-stop input[type=checkbox]").prop('checked', false);
        }
    }
}

function onsuccess_get_trip_location(myArray) {
    temp_location_Array = myArray;

    var t_tid = JSON.parse(storage.getItem('tid'));
    if ($(".trip-start-stop input[type=checkbox]").is(':checked')) {
        // trip start
        var t_tid = JSON.parse(storage.getItem('tid'));
        var t_ser_task_id = JSON.parse(storage.getItem('server_task_id'));
        localStorage.setItem('trip_status', '0');
        localStorage.setItem('trip_tid', t_tid);
        localStorage.setItem('trip_ser_task_id', t_ser_task_id);
        start_stop_trip(0);
    }
    else {
        // trip stop
        localStorage.setItem('trip_status', '1');
        localStorage.setItem('trip_tid', '');
        localStorage.setItem('trip_ser_task_id', '');
        start_stop_trip(1);
    }
}

// remove unused object from global var (removed recently from mapping) - 15122020
function remove_unused_object_from_global_var(mapped_checksheet, t_global_var) {

    var role_id = JSON.parse(storage.getItem('role_id'));

    var g_len = t_global_var.length;
    var removal_index_Array = [];
    for (g = 0; g < g_len; g++) {
        var g_role_id = t_global_var[g].role_id;
        if (g_role_id == role_id) {
            var g_checksheetid = t_global_var[g].checksheetid;
            var g_start_status = t_global_var[g].start_status;
            var g_sub_flow_id = t_global_var[g].sub_flow_id;

            var m_len = mapped_checksheet.length;
            var mapping_found = 0;
            for (mp = 0; mp < m_len; mp++) {
                var m_checksheetid = mapped_checksheet[mp].checksheetid;
                var m_start_status = mapped_checksheet[mp].start_status;
                var m_sub_flow_id = mapped_checksheet[mp].sub_flow_id;

                if (m_checksheetid == g_checksheetid && m_start_status == g_start_status && m_sub_flow_id == g_sub_flow_id) {
                    mapping_found++;
                    break;
                }
            }

            if (mapping_found == 0) {
                removal_index_Array.push(g);
            }
        }
    }

    removal_index_Array.sort(function (a, b) { return b - a });
    for (r = 0; r < removal_index_Array.length; r++) {
        t_global_var.splice(removal_index_Array[r], 1);
    }

    return t_global_var;
}

let get_is_submitted_from_global_var = (t_checksheetid, c_start_status, role_id) => {
    let is_submitted = 0;
    var new_checksheet_list = JSON.parse(storage.getItem('new_checklist'));
    for (i = 0; i < new_checksheet_list.length; i++) {
        var checksheetid = new_checksheet_list[i].checksheetid;
        var start_status = new_checksheet_list[i].start_status;
        var c_role_id = new_checksheet_list[i].role_id;
        if (c_role_id == '' || c_role_id == null || c_role_id == undefined) {
            c_role_id = role_id;
        }
        if (checksheetid == t_checksheetid && start_status == c_start_status && role_id == c_role_id) {
            is_submitted = new_checksheet_list[i].is_submited;
            break;
        }
    }

    return is_submitted;
}


// var assign_date = "10/05/2015";
// survey_date = "09/28/2015";
// tat_type = "exclude";
// dependent = "survey";
// before_days = 0;
// gap_days = 3;

