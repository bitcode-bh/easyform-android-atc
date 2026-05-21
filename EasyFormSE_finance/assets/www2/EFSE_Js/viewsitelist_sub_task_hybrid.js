

// hybrid (sub flow + checksheet)

function get_checklist_data_for_subtask_hybrid() {
    try {
        var flow_Array = JSON.parse(storage.getItem('flow_Array'));
        if (flow_Array.length = 1) {
            var moduleid = JSON.parse(storage.getItem('wayflow'));
        } else {
            var moduleid = flow_Array[flow_Array.length - 1].wayflow;
        }

        var query = "select data from flow_master where moduleid = '" + moduleid + "'";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "1"
        });
        cordova.exec(onsuccess_get_checklist_data_for_subtask_hybrid, onfail_get_checklist_data_for_subtask_hybrid, 'SqlitePlugin', 'showValues', q_jsonobj);
    } catch (e) {
        alert1(e + '_get_checklist_data_for_subtask_hybrid()');
        loading_hide();
    }
}

function onsuccess_get_checklist_data_for_subtask_hybrid(e) {
    try {
        var myArray = JSON.parse(e);
        if (myArray == '' || myArray == null || myArray == undefined || myArray.length == 0) {
            var flow_Array = JSON.parse(storage.getItem('flow_Array'));
            var flow_id = flow_Array[flow_Array.length - 1].wayflow;
            var flow_flowname = flow_Array[flow_Array.length - 1].wayflow_name;
            //alert1(flow_flowname + " (" + flow_id + ") flow not found in flow master ! ");
            loading_hide();

            // get flow online 20102021 
            get_checklist_data_for_subtask_hybrid_online(flow_id);
        }
        else {

            var task_checklist_data = myArray[0].data;
            storage.setItem('task_data_column', task_checklist_data);

            // sitewise module listing change
            var data_json = JSON.parse(storage.getItem('list_json'));
            var list_data = JSON.parse(data_json);
            var multiflow_list = list_data[0].multiflow_list;
            var flow_id_found = 0;
            var sub_flow_id_found = 0;
            var t_task_checklist_data = JSON.parse(task_checklist_data);
            for (var i = 0; i < t_task_checklist_data.length; i++) {
                var sub_flow_id = t_task_checklist_data[i].sub_flow_id;
                if (sub_flow_id == '' || sub_flow_id == null || sub_flow_id == undefined || sub_flow_id == 0) { } else {
                    sub_flow_id_found++;
                    break;
                }
            }

            if (sub_flow_id_found == 0) {
                // sub flow not found
                check_server_date();
            }
            else {
                // sub flow found
                get_list_of_pm_subflow_hybrid();
            }
        }
    } catch (e) {
        alert1(e + '_get_checklist_data_for_subtask_hybrid()');
    }
}

function onfail_get_checklist_data_for_subtask_hybrid(e) {
    alert1(e + '_get_checklist_data_for_subtask_hybrid()');
}

function get_list_of_pm_subflow_hybrid() {
    try {
        var tid = JSON.parse(storage.getItem('tid'));
        var query = "SELECT status, global_var, survey_date, upload_date FROM task_master WHERE tid = " + tid + "";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "1"
        });
        cordova.exec(onsuccess_get_list_of_pm_subflow_hybrid, onfail_get_list_of_pm_subflow_hybrid, 'SqlitePlugin', 'showValues', q_jsonobj);
    } catch (e) {
        alert1(e + '_get_list_of_pm_subflow_hybrid()')
    }
}

function onsuccess_get_list_of_pm_subflow_hybrid(e) {
    try {
        var myArray = JSON.parse(e);
        var start_status = myArray[0].status;
        storage.setItem('start_status', JSON.stringify(start_status));
        var checksheet_list = JSON.parse(storage.getItem('task_data_column'));

        let group_found = 0;
        for (c = 0; c < checksheet_list.length; c++) {
            let Group_Name = checksheet_list[c].Group_Name;
            if (Group_Name == "" || Group_Name == null || Group_Name == undefined) { }
            else {
                group_found++;
                break;
            }
        }

        if (group_found == 0) {
            // sort checklist array by order_id
            checksheet_list = checksheet_list.sort(function (a, b) {
                var x = a.order_id < b.order_id ? -1 : 1;
                return x;
            });
        }
        else {
            // sort checklist array by group name
            checksheet_list = checksheet_list.sort(function (a, b) {
                var x = a.Group_Name < b.Group_Name ? -1 : 1;
                return x;
            });
        }


        // /--- set global values in storage start ------/ //
        var global_var_obj = myArray[0].global_var;
        if (global_var_obj == null || global_var_obj == "null" || global_var_obj == undefined || global_var_obj == "" || global_var_obj == " " || global_var_obj == "Unknown") {
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
                if (is_online == '' || is_online == null || is_online == undefined) {
                    is_online = 0;
                }

                var is_icon_display = checksheet_list[j].is_icon_display;
                if (is_icon_display == '' || is_icon_display == null || is_icon_display == undefined) {
                    is_icon_display = "true";
                }

                new_checksheet_list.push({
                    'role_id': checksheet_list[j].role_id,
                    'checksheetid': checksheet_list[j].checksheetid,
                    'c_name': checksheet_list[j].c_name,
                    'start_status': checksheet_list[j].start_status,
                    'end_status': checksheet_list[j].end_status,
                    'last_step': checksheet_list[j].last_step,
                    'is_flow': checksheet_list[j].is_flow,
                    'is_disabled': checksheet_list[j].is_disabled,
                    'is_submited': is_submited,
                    'is_mandatory': is_mandatory,
                    'is_disabled': is_disabled,
                    'is_online': is_online,
                    'is_icon_display': is_icon_display,
                    'sub_flow_id': checksheet_list[j].sub_flow_id,
                    'reject_status': checksheet_list[j].reject_status,
                    'Checksheet_Icon': checksheet_list[j].Checksheet_Icon,
                    "sub_flow_name": checksheet_list[j].sub_flow_name,
                    "udf_name": checksheet_list[j].udf_name,
                    "id": checksheet_list[j].id,
                    "type": checksheet_list[j].type,
                    "Group_Name": checksheet_list[j].Group_Name,
                    "tat_type": checksheet_list[j].tat_type,
                    "dependent": checksheet_list[j].dependent,
                    "before_days": checksheet_list[j].before_days,
                    "gap_days": checksheet_list[j].gap_days,
                    "start_time": checksheet_list[j].start_time,
                    "duration": checksheet_list[j].duration
                });
            }
        }
        else {
            var myArray1 = JSON.parse(global_var_obj);
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
                    if (is_online == '' || is_online == null || is_online == undefined) {
                        is_online = 0;
                    }

                    var is_icon_display = checksheet_list[j].is_icon_display;
                    if (is_icon_display == '' || is_icon_display == null || is_icon_display == undefined) {
                        is_icon_display = "true";
                    }

                    new_checksheet_list.push({
                        'role_id': checksheet_list[j].role_id,
                        'checksheetid': checksheet_list[j].checksheetid,
                        'c_name': checksheet_list[j].c_name,
                        'start_status': checksheet_list[j].start_status,
                        'end_status': checksheet_list[j].end_status,
                        'last_step': checksheet_list[j].last_step,
                        'is_flow': checksheet_list[j].is_flow,
                        'is_disabled': checksheet_list[j].is_disabled,
                        'is_submited': is_submited,
                        'is_mandatory': is_mandatory,
                        'is_disabled': is_disabled,
                        'is_online': is_online,
                        'is_icon_display': is_icon_display,
                        'sub_flow_id': checksheet_list[j].sub_flow_id,
                        'reject_status': checksheet_list[j].reject_status,
                        'Checksheet_Icon': checksheet_list[j].Checksheet_Icon,
                        "sub_flow_name": checksheet_list[j].sub_flow_name,
                        "udf_name": checksheet_list[j].udf_name,
                        "id": checksheet_list[j].id,
                        "type": checksheet_list[j].type,
                        "Group_Name": checksheet_list[j].Group_Name,
                        "tat_type": checksheet_list[j].tat_type,
                        "dependent": checksheet_list[j].dependent,
                        "before_days": checksheet_list[j].before_days,
                        "gap_days": checksheet_list[j].gap_days,
                        "start_time": checksheet_list[j].start_time,
                        "duration": checksheet_list[j].duration
                    });
                }
            } else {
                var old_checksheet_list = new_checklist_obj;
                var new_checksheet_list = [];

                // merge global var/ second user login (on server 1st user global var saved (siklu))
                for (k = 0; k < checksheet_list.length; k++) {
                    var loc_checksheetid = checksheet_list[k].checksheetid;
                    var loc_start_status = checksheet_list[k].start_status;
                    var loc_sub_flow_id = checksheet_list[k].sub_flow_id;
                    var role_id = checksheet_list[k].role_id;
                    var loc_chk_found = 0;

                    var is_mandatory = checksheet_list[k].is_mandatory;
                    var is_disabled = checksheet_list[k].is_disabled;
                    var is_submited = checksheet_list[k].is_submited;
                    if (is_submited == 1 || is_mandatory == 0 || is_disabled == 1) {
                        is_submited = 1;
                    }
                    else {
                        is_submited = 0;
                    }

                    for (m = 0; m < old_checksheet_list.length; m++) {
                        var ser_checksheetid = old_checksheet_list[m].checksheetid;
                        var ser_start_status = old_checksheet_list[m].start_status;
                        var ser_sub_flow_id = old_checksheet_list[m].sub_flow_id;
                        var ser_role_id = old_checksheet_list[m].role_id;

                        if (ser_checksheetid == loc_checksheetid && ser_start_status == loc_start_status && ser_sub_flow_id == loc_sub_flow_id && role_id == ser_role_id) {
                            old_checksheet_list[m].reject_status = checksheet_list[k].reject_status;
                            old_checksheet_list[m].Checksheet_Icon = checksheet_list[k].Checksheet_Icon;
                            old_checksheet_list[m].id = checksheet_list[k].id;
                            old_checksheet_list[m].is_mandatory = checksheet_list[k].is_mandatory;
                            old_checksheet_list[m].sub_flow_name = checksheet_list[k].sub_flow_name;
                            old_checksheet_list[m].udf_name = checksheet_list[k].udf_name;
                            old_checksheet_list[m].is_online = checksheet_list[k].is_online;
                            old_checksheet_list[m].is_disabled = checksheet_list[k].is_disabled;
                            old_checksheet_list[m].c_name = checksheet_list[k].c_name;
                            old_checksheet_list[m].Group_Name = checksheet_list[k].Group_Name;
                            old_checksheet_list[m].tat_type = checksheet_list[k].tat_type;
                            old_checksheet_list[m].dependent = checksheet_list[k].dependent;
                            old_checksheet_list[m].before_days = checksheet_list[k].before_days;
                            old_checksheet_list[m].gap_days = checksheet_list[k].gap_days;
                            old_checksheet_list[m].start_time = checksheet_list[k].start_time;
                            old_checksheet_list[m].duration = checksheet_list[k].duration;
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

                        new_checksheet_list.push({
                            'role_id': checksheet_list[k].role_id,
                            'checksheetid': checksheet_list[k].checksheetid,
                            'c_name': checksheet_list[k].c_name,
                            'start_status': checksheet_list[k].start_status,
                            'end_status': checksheet_list[k].end_status,
                            'last_step': checksheet_list[k].last_step,
                            'is_flow': checksheet_list[k].is_flow,
                            'is_disabled': checksheet_list[k].is_disabled,
                            'is_submited': is_submited,
                            'is_mandatory': is_mandatory,
                            'is_disabled': is_disabled,
                            'is_online': is_online,
                            'is_icon_display': is_icon_display,
                            'sub_flow_id': checksheet_list[k].sub_flow_id,
                            'reject_status': checksheet_list[k].reject_status,
                            'Checksheet_Icon': checksheet_list[k].Checksheet_Icon,
                            "sub_flow_name": checksheet_list[k].sub_flow_name,
                            "udf_name": checksheet_list[k].udf_name,
                            "id": checksheet_list[k].id,
                            "type": checksheet_list[k].type,
                            "Group_Name": checksheet_list[k].Group_Name,
                            "tat_type": checksheet_list[k].tat_type,
                            "dependent": checksheet_list[k].dependent,
                            "before_days": checksheet_list[k].before_days,
                            "gap_days": checksheet_list[k].gap_days,
                            "start_time": checksheet_list[k].start_time,
                            "duration": checksheet_list[k].duration
                        });
                    }
                }
            }
        }

        storage.setItem('new_checklist', JSON.stringify(new_checksheet_list));
        var flow_Array = JSON.parse(storage.getItem('flow_Array'));
        flow_Array[flow_Array.length - 1].checklist = new_checksheet_list;

        // new change
        var data_count = flow_Array[flow_Array.length - 1].list_json;
        storage.setItem('list_json_Array', JSON.stringify(data_count));

        storage.setItem('flow_Array', JSON.stringify(flow_Array));

        var survey_date = myArray[0].survey_date;
        var assign_date = myArray[0].upload_date;
        append_child_flows_to_list_hybrid(new_checksheet_list, start_status, survey_date, assign_date);
    } catch (e) {
        alert1(e + '_onsuccess_get_list_of_pm_subflow_hybrid()');
    }
}

function onfail_get_list_of_pm_subflow_hybrid(e) {
    alert1(e + '_onfail_get_list_of_pm_subflow_hybrid()');
}

function append_child_flows_to_list_hybrid(new_checksheet_list, start_status, survey_date, assign_date) {
    try {
        $("#tbl_chk_details").hide();
        $("#checksheet_list").empty();
        //var myArray = JSON.parse(storage.getItem('t_subflow_list'));
        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var status_array = list_data[0].status;

        var gb_by_status = list_data[0].gb_by_status;
        if (gb_by_status == 'true') {
            var gb_check = 'true';
        } else {
            var gb_check = 'false';
        }
        var tat_check = list_data[0].tat;
        var cl_geofence = list_data[0].checklist_geofence;

        var bgr_found = 0;
        var blue_found = 0;
        var blue_index = 0;
        var blue_flow_index = 0;
        var blue_id = '';
        var green_id = '';
        var checksheet_displaying = 0;

        var group_name_array = [];
        var group_btn_color_array = [];

        var status_checksheet_only = list_data[0].status_checksheet_only;

        var flow_found = 0;
        for (i = 0; i < new_checksheet_list.length; i++) {
            var c_role_id = new_checksheet_list[i].role_id;
            if (c_role_id == '' || c_role_id == null || c_role_id == undefined) {
                var role_matched = 1;
            } else {
                var role_id = JSON.parse(storage.getItem('role_id'));
                if (role_id == c_role_id) {
                    var role_matched = 1;
                } else {
                    var role_matched = 0;
                }
            }

            if (role_matched == 1) {
                var c_start_status = new_checksheet_list[i].start_status;
                //var st_found = 0;
                //for (g = 0; g < status_array.length; g++) {
                //    if (c_start_status == status_array[g]) {
                //        st_found = 1;
                //        break;
                //    }
                //}


                var st_found = 0;
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

                if (st_found == 1) {
                    var is_submited = new_checksheet_list[i].is_submited;
                    var udf_id = new_checksheet_list[i].id;
                    var sub_flow_id = new_checksheet_list[i].sub_flow_id;
                    var c_end_status = new_checksheet_list[i].end_status;
                    var reject_status = new_checksheet_list[i].reject_status;

                    if (new_checksheet_list[i].is_disabled == '' || new_checksheet_list[i].is_disabled == null || new_checksheet_list[i].is_disabled == undefined) {
                        new_checksheet_list[i].is_disabled = 0;
                    }

                    if (new_checksheet_list[i].is_readchecksheet == '' || new_checksheet_list[i].is_readchecksheet == null || new_checksheet_list[i].is_readchecksheet == undefined) {
                        new_checksheet_list[i].is_readchecksheet = 0;
                    }

                    if (new_checksheet_list[i].is_online == '' || new_checksheet_list[i].is_online == null || new_checksheet_list[i].is_online == undefined) {
                        new_checksheet_list[i].is_online = 0;
                    }

                    var is_mandatory = new_checksheet_list[i].is_mandatory;
                    var is_disabled = new_checksheet_list[i].is_disabled;
                    var is_readchecksheet = new_checksheet_list[i].is_readchecksheet;
                    var is_online = new_checksheet_list[i].is_online;  // get log from server if not found in local forward side
                    if (is_mandatory == 0 || is_disabled == 1) {
                        // is_mandatory == 0 (checksheet is not mandatory)
                        // is_disabled == 1 (checksheet should be in read only mode)
                        is_submited = 1;
                    }

                    var is_icon_display = new_checksheet_list[i].is_icon_display;  // show/hide control icon
                    if (is_icon_display == '' || is_icon_display == null || is_icon_display == undefined) {
                        is_icon_display = "true";
                    }

                    var t_id = "li_" + i + "";

                    var checksheetid = new_checksheet_list[i].checksheetid;
                    if (checksheetid != 0) {
                        // bind checksheet
                        if (is_disabled != 2) {
                            var name = new_checksheet_list[i].c_name;

                            var server_task_id = JSON.parse(storage.getItem('server_task_id'));
                            var start_status = JSON.parse(storage.getItem('start_status'));
                            //var survey_date = '';
                            //var assign_date = '';
                            var d1 = new Date();
                            var curr_date = getFormattedDate(d1);

                            var icon_str = '';
                            var checksheetid = new_checksheet_list[i].checksheetid;
                            var c_role_id = new_checksheet_list[i].role_id;
                            var c_start_status = new_checksheet_list[i].start_status;
                            var is_flow = new_checksheet_list[i].is_flow;
                            var reject_status = new_checksheet_list[i].reject_status;
                            if (reject_status == '' || reject_status == undefined || reject_status == null) {
                                reject_status = 0;
                            }

                            var RaiseExceptionFlag = localStorage.getItem('RaiseExceptionFlag');
                            if ((new_checksheet_list[i].checksheetid == 3791 || new_checksheet_list[i].checksheetid == 15555) && (RaiseExceptionFlag == 1 || RaiseExceptionFlag == 2 || RaiseExceptionFlag == 3)) {
                                // if raise exception then make checksheet disabled
                                is_disabled = 1;
                            }

                            if (is_submited == 1 && gb_check == 'false' || is_mandatory == 0 || is_disabled == 1) {
                                // completed checksheet button (for atc rejection)
                                var back_color = "green";
                                var param = "check_old_task_for_checksheet('" + new_checksheet_list[i].checksheetid + "','" + new_checksheet_list[i].c_name
                                    + "','" + server_task_id + "','" + new_checksheet_list[i].start_status + "','" + new_checksheet_list[i].end_status
                                    + "', '" + new_checksheet_list[i].last_step + "','" + reject_status + "','1', 'true','" + is_disabled + "', '" + is_readchecksheet + "', '" + is_online + "', '" + i + "', '" + new_checksheet_list[i].Group_Name + "', '" + is_icon_display + "')";

                                green_id = t_id;
                            } else if (is_submited == 1 || (start_status > c_start_status && gb_by_status == 'true' || is_mandatory == 0)) {
                                // completed checksheet button (for atc rejection)
                                var back_color = "green";
                                var param = "check_old_task_for_checksheet('" + new_checksheet_list[i].checksheetid + "','" + new_checksheet_list[i].c_name
                                    + "','" + server_task_id + "','" + new_checksheet_list[i].start_status + "','" + new_checksheet_list[i].end_status
                                    + "', '" + new_checksheet_list[i].last_step + "','" + reject_status + "','1', 'true','" + is_disabled + "', '" + is_readchecksheet + "', '" + is_online + "', '" + i + "', '" + new_checksheet_list[i].Group_Name + "', '" + is_icon_display + "')";
                                green_id = t_id;
                            } else if (start_status == c_start_status || (start_status != c_start_status && is_submited == 0 && c_start_status == 0)) {
                                // status matched & fill

                                if (tat_check == "false" || tat_check == "" || tat_check == null || tat_check == undefined) {
                                    var enable = 0;
                                } else {
                                    var tat_type = new_checksheet_list[i].tat_type;
                                    var dependent = new_checksheet_list[i].dependent;
                                    var before_days = parseInt(new_checksheet_list[i].before_days);
                                    var gap_days = parseInt(new_checksheet_list[i].gap_days);

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

                                if (enable == 0) {
                                    var back_color = "#cb6767";
                                    var param = "check_old_task_for_checksheet('" + new_checksheet_list[i].checksheetid + "','"
                                        + new_checksheet_list[i].c_name + "','" + server_task_id + "','" + new_checksheet_list[i].start_status
                                        + "','" + new_checksheet_list[i].end_status + "', '" + new_checksheet_list[i].last_step
                                        + "','" + reject_status + "','0', 'false','" + is_disabled + "', '" + is_readchecksheet + "', '" + is_online + "', '" + i + "', '" + new_checksheet_list[i].Group_Name + "', '" + is_icon_display + "')";
                                    blue_index = i;
                                    bgr_found++;
                                    blue_found++;
                                    blue_id = t_id;

                                }
                                else if (enable == 1) {
                                    // status matched but wait till TAT date
                                    var back_color = "grey";
                                    var param = "grey_button_click('" + tat_date + "')";
                                    bgr_found++;
                                }
                                else {
                                    // enable == 2 status matched but wait till refrence checksheet completed
                                    var back_color = "grey";
                                    var param = "grey2_button_click('" + ref_c_name + "')";
                                    bgr_found++;
                                }

                            } else {
                                // status not matched
                                var back_color = "red";
                                var param = "red_button_click()";
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
                                        if (new_checksheet_list[i].c_name == checksheet_name) {
                                            main_back_color = 'background-color: #ffcccc';
                                            break;
                                        }
                                    }
                                }
                            }

                            var is_punchinout = new_checksheet_list[i].is_punchinout;
                            if (is_punchinout == '0') {
                                var class_str = '';
                            }
                            else {
                                var class_str = 'cls-punchinout';
                            }

                            if (new_checksheet_list[i].dynamic_checksheet == 'true') {
                                var dyn_class = 'dyn_cls';
                            }
                            else {
                                var dyn_class = '';
                            }

                            var list_item = '';

                            /////////////create checksheet group button/////////
                            var group_name = new_checksheet_list[i].Group_Name;
                            if (group_name == "" || group_name == null || group_name == undefined) {
                                group_name = "";
                                var checksheet_disp = '';
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

                                //if (group_name.indexOf(group_name_array[0]) > -1) {
                                if ($.inArray(group_name, group_name_array) !== -1) { }
                                else {
                                    group_name_array.push(group_name);
                                    list_item += '<li class="list_grp_checksheet" group_ico="' + group_name + '" onclick="show_hide_group_checksheet(this)" style="font-weight:bold;border-right: 0px solid #2196f3;"><a class="item-content button" style="padding-left:20px; ' + main_back_color + '"><div class="item-media"><i id="icon_group_checksheet_' + group_name + '" class="fa fa-plus-square-o" style="color: #000;font-size:18px;"></i></div><div class="item-inner item-no-pad" style="padding-right:5px"><div class="item-title">' + group_name + '</div>';
                                    list_item += '<div class="item-after"><span class="badge" style="border-radius: 50px; width: 20px; height: 20px; background: #2196f3"></span></div>';
                                    list_item += '</div></a></li> ';
                                }
                            }
                            //////////////////////

                            var icon_base64 = new_checksheet_list[i].Checksheet_Icon;
                            if (icon_base64 == '' || icon_base64 == null || icon_base64 == undefined) {
                                icon_base64 = "file-text-o";
                            }

                            if (icon_base64.indexOf("data:image") > -1) {
                                //----base64
                                list_item += '<li id=' + t_id + ' onclick ="' + param + '" style="border-right: 0px solid ' + back_color + ';' + checksheet_disp + '" class="' + dyn_class + ' ' + class_str + '" group_name="' + group_name + '"><a class="item-content button" style="padding-left:20px; ' + main_back_color + '"><div class="item-media"><img src="' + icon_base64 + '" style="width:42px; height:42px; margin-top:-5px; margin-right:7px"></div><div class="item-inner item-no-pad" style="padding-right:5px"><div class="item-title">' + new_checksheet_list[i].c_name + '</div>';
                            }
                            else {
                                //----FA icon
                                list_item += '<li id=' + t_id + ' onclick ="' + param + '" style="border-right: 0px solid ' + back_color + ';' + checksheet_disp + '" group_name="' + group_name + '"><a class="item-content button" style="padding-left:20px; ' + main_back_color + '"><div class="item-media"><i class="fa fa-' + icon_base64 + '"></i></div><div class="item-inner item-no-pad" style="padding-right:5px"><div class="item-title">' + new_checksheet_list[i].c_name + '</div>';
                            }

                            var Background_Image = new_checksheet_list[i].Background_Image;
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

                            list_item += '<span class="badge" style="border-radius: 50px; width: 10px; height: 10px; background: ' + back_color + ' "></span>';

                            if (cl_geofence == 'true' && ref_found == 1) {
                                if (near_site == 1) {
                                    list_item += '<i class="fa fa-check-circle cls_task_ico" style="font-size: 32px; margin-top:5px" onclick="' + alert_param + '"></i>';
                                } else {
                                    list_item += '<i class="fa fa-times-circle cls_task_ico" style="font-size: 32px; margin-top:5px" onclick="' + alert_param + '"></i>';
                                }
                            }
                            list_item += '</div></div></div></a>';
                            list_item += '</li>';

                        }
                    }
                    else {
                        // bind sub flow
                        var name = new_checksheet_list[i].udf_name;
                        if (name == "" || name == null || name == undefined) {
                            name = new_checksheet_list[i].sub_flow_name;
                        }

                        if (is_submited == 1 || is_submited == 2 && gb_check == 'false') {
                            // green
                            var back_color = "green";
                            var loc_task_update = "true";
                            green_id = t_id;
                        } else if (is_submited == 1 || is_submited == 2 || (start_status > c_start_status && gb_check == 'true')) {
                            // green
                            var back_color = "green";
                            var loc_task_update = "true";
                            green_id = t_id;
                        }
                        else {
                            // blue/gray
                            var back_color = "dodgerblue";
                            var loc_task_update = "false";
                            bgr_found++;
                            blue_index = i;
                            blue_id = t_id;
                        }

                        var s_type = new_checksheet_list[i].type;
                        var param = "\"redirect_on_pre_subflow_click_hybrid(" + udf_id + ", '" + c_start_status + "', '" + c_end_status + "', '" + reject_status + "','" + loc_task_update + "', '" + back_color + "', '" + is_online + "', '" + s_type + "', '" + sub_flow_id + "', '" + name + "', '" + c_role_id + "')\"";

                        if (back_color == "green") {
                            back_color = "#4caf50";
                        }

                        if (back_color == "dodgerblue") {
                            back_color = "#2196f3";
                        }

                        //var list_ico = 'class="fa fa-sitemap" style="font-size:20px"';
                        var Checksheet_Icon = new_checksheet_list[i].Checksheet_Icon;
                        if (Checksheet_Icon == "" || Checksheet_Icon == null || Checksheet_Icon == undefined) {
                            Checksheet_Icon = "sitemap";
                        }
                        if (Checksheet_Icon.indexOf('data:image') > -1) {
                            var list_ico = '<img src="' + Checksheet_Icon + '" style="width:42px; height:42px; margin-top:-5px; margin-right:7px">';
                        }
                        else {
                            var list_ico = '<i class="fa fa-' + Checksheet_Icon + '"></i>';
                        }

                        let display_str = '';
                        if (is_disabled == 2) {
                            // 2 = hidden               [FT-18102024]
                            display_str = 'display: none;';
                        }

                        let start_time = new_checksheet_list[i].start_time;
                        if (start_time == "" || start_time == null || start_time == undefined || start_time == "00:00:00") { }
                        else {
                            let duration = new_checksheet_list[i].duration;
                            if (duration == "" || duration == null || duration == undefined || duration == "0") { }
                            else {
                                duration = parseInt(duration);
                            }

                            if (isCurrentTimeInSlot(start_time, duration)) {
                                //console.log("Current time is inside slot");
                            } else {
                                //console.log("Outside slot");

                                // hide sub flow if outside time slot
                                display_str = 'display: none;';
                            }
                        }

                        var list_item = '<li id=' + t_id + ' onclick =' + param + ' style="border-right: 0px solid ' + back_color + ';' + display_str + '"><a href="#" class="item-content button" style="padding-left:20px"><div class="item-media">' + list_ico + '</div><div class="item-inner item-no-pad" style="padding-right:5px"><div class="item-title">' + name + '</div>';
                        list_item += '<div class="item-after"><span class="badge" style="border-radius: 50px; width: 10px; height: 10px; background: ' + back_color + ' "></span></div>';
                        list_item += '</div></a>';
                        list_item += '</li>';
                    }

                    $("#checksheet_list").append(list_item);
                    checksheet_displaying++;
                }

            }

        }

        var li_length = $("#checksheet_list li").length;
        if (li_length > 5) {
            $("#txtsearch").show();
        } else {
            $("#txtsearch").hide();
        }

        //localStorage.setItem('last_subflow_count', checksheet_displaying);
        //localStorage.setItem('last_checklist_count', checksheet_displaying);

        set_common_localStorage('last_subflow_count', checksheet_displaying);
        set_common_localStorage('last_checklist_count', checksheet_displaying);

        var redirect_on_checksheet = get_common_localStorage('redirect_on_checksheet');
        var curr_btn_mode = JSON.parse(storage.getItem('curr_btn_mode'));
        if (curr_btn_mode != 'back' && redirect_on_checksheet == "true" && checksheet_displaying > 1) {
            set_common_localStorage('redirect_on_checksheet', 'false');
            changeurl("viewsitelist_pm_grouplist.html");
        }
        else {

            var dynamic_checklist_display = list_data[0].dynamic_checklist_display;
            if (dynamic_checklist_display == 'false') {
                $('.dyn_cls').hide();
            }

            /////// nokia change - shortcut buttons//////////////
            var buttons = list_data[0].buttons;
            if (buttons == '' || buttons == null || buttons == undefined || buttons.length == 0) {
                $("#buttons_list").hide();
            }
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
                            var task_status = JSON.parse(storage.getItem('start_status'));
                            var t_status = task_status;
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


            storage.setItem('all_green', JSON.stringify('false'));

            if (bgr_found == 0) {
                var data_json = JSON.parse(storage.getItem('list_json'));
                var list_data = JSON.parse(data_json);
                var completed_editable = list_data[0].completed_editable;
                var curr_btn_mode = JSON.parse(storage.getItem('curr_btn_mode'));
                if (curr_btn_mode == 'updatetasknsubmit') {
                    completed_editable = 'false';
                } else {
                    if (gb_by_status == 'true') {
                        storage.setItem('all_green', JSON.stringify('true'));
                    }
                }

                if (completed_editable == "" || completed_editable == null || completed_editable == undefined || completed_editable == "false") {
                    // if short cut button is displaying then do not redirect to task listing
                    let SB_count = $(".buttons-row").find("a.button").length;
                    if (SB_count == 0) {
                        changeurl("selection_survey.html");
                    }
                }
                //else if (checksheet_displaying > 1 && (redirect_on_checksheet == "true" || curr_btn_mode == 'back')) {
                else if (checksheet_displaying > 1 && redirect_on_checksheet == "true") {
                    // task listing page
                    set_common_localStorage('redirect_on_checksheet', 'false');
                    storage.setItem('curr_btn_mode', JSON.stringify(""));           //don't backward skip for single green checksheet
                    changeurl("viewsitelist_pm_grouplist.html");
                }
                else if (curr_btn_mode != 'back' && checksheet_displaying == 1) {
                    //to skip single subflow checksheet(user: haresh.tse/oneatctesting)
                    //storage.setItem('curr_btn_mode', JSON.stringify('subflow'));
                    //$("#checksheet_list").append('<li><input type="hidden" id="hdn_' + myArray[blue_index].id + '" value=\'' + myArray[blue_index].data + '\'></li>');

                    //if (myArray[blue_index].type == 'Flow') {
                    //    var flow_name = myArray[blue_index].flow_name1;
                    //}
                    //else {
                    //    var flow_name = myArray[blue_index].flow_name;
                    //}
                    //redirect_on_pre_subflow_click_hybrid(flow_name, myArray[blue_index].id, myArray[blue_index].flow_id, myArray[blue_index].type, new_checksheet_list[blue_flow_index].start_status, new_checksheet_list[blue_flow_index].end_status, new_checksheet_list[blue_flow_index].reject_status, 'true', myArray[blue_index].rollid, back_color);

                    storage.setItem('curr_btn_mode', JSON.stringify('subflow'));

                    if (blue_id == "" || blue_id == null || blue_id == undefined) {
                        // all displaying checksheets are green
                        if (green_id != "") {
                            $("#" + green_id + "").trigger('onclick');
                        }
                    }
                    else {
                        // possible blue checksheet
                        $("#" + blue_id + "").trigger('onclick');
                    }
                }
                else if (redirect_on_checksheet == "true") {
                    // task listing page
                    if (buttons.length > 0) {
                        set_common_localStorage('redirect_on_checksheet', 'false');
                        storage.setItem('curr_btn_mode', JSON.stringify(""));           //don't backward skip for single green checksheet
                        changeurl("viewsitelist_pm_grouplist.html");
                    }
                    else {
                        alert1('No checksheet/subflow to display!');
                        loading_hide();
                    }
                }
            }
            else if (curr_btn_mode != 'back' && checksheet_displaying == 1) {
                //to skip single subflow checksheet(user: haresh.tse/oneatctesting)
                //storage.setItem('curr_btn_mode', JSON.stringify('subflow'));
                //$("#checksheet_list").append('<li><input type="hidden" id="hdn_' + myArray[blue_index].id + '" value=\'' + myArray[blue_index].data + '\'></li>');

                //if (myArray[blue_index].type == 'Flow') {
                //    var flow_name = myArray[blue_index].flow_name1;
                //}
                //else {
                //    var flow_name = myArray[blue_index].flow_name;
                //}
                //redirect_on_pre_subflow_click_hybrid(flow_name, myArray[blue_index].id, myArray[blue_index].flow_id, myArray[blue_index].type, new_checksheet_list[blue_flow_index].start_status, new_checksheet_list[blue_flow_index].end_status, new_checksheet_list[blue_flow_index].reject_status, 'true', myArray[blue_index].rollid, back_color);

                storage.setItem('curr_btn_mode', JSON.stringify('subflow'));
                $("#" + blue_id + "").trigger('onclick');
            }
            else if (curr_btn_mode != 'back' && redirect_on_checksheet == "true" && checksheet_displaying > 1) {
                set_common_localStorage('redirect_on_checksheet', 'false');
                changeurl("viewsitelist_pm_grouplist.html");
            }
        }

        enable_back_button();

    } catch (e) {
        alert1(e + '_append_child_flows_to_list_hybrid()');
        loading_hide();
    }
}

var sub_flow_data = [];
function redirect_on_pre_subflow_click_hybrid(udf_id, selected_start_status, selected_end_status, reject_status, loc_task_update, back_color, is_online, type, flow_id, flow_name1, role_id) {
    storage.setItem('c_start_status', JSON.stringify(selected_start_status));
    storage.setItem('sub_flow_end_status', JSON.stringify(selected_end_status));
    storage.setItem('sub_flow_reject_status', JSON.stringify(reject_status));
    storage.setItem('sub_flow_back_color', JSON.stringify(back_color));
    storage.setItem('loc_task_update', JSON.stringify(loc_task_update));
    storage.setItem('loc_flow_update', JSON.stringify(loc_task_update));
    storage.setItem('c_is_online', JSON.stringify(is_online));
    sub_flow_data.push({
        id: udf_id,
        type: type,
        flow_id: flow_id,
        flow_name1: flow_name1,
        rollid: role_id
    })

    if (udf_id == "" || udf_id == null || udf_id == undefined || udf_id == 0) {
        alert1("UDF Id is not mapped with this sub flow!");
    }
    else {
        var query = "SELECT id, type, flow_id, flow_name1, rollid, data FROM  User_Define_Flow_Master WHERE id = " + udf_id + " and (is_delete != 1 or is_delete IS NULL)";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "1"
        });
        cordova.exec(onsuccess_redirect_on_pre_subflow_click_hybrid, onfail_redirect_on_pre_subflow_click_hybrid, 'SqlitePlugin', 'showValues', q_jsonobj);
    }
}

function onsuccess_redirect_on_pre_subflow_click_hybrid(e) {
    try {
        var myArray = JSON.parse(e);
        if (myArray.length == 0) {

            // not found in local db
            myArray = sub_flow_data;
            var id = myArray[0].id;
            var type = myArray[0].type;
            var flow_id = myArray[0].flow_id;
            var flow_name1 = myArray[0].flow_name1;
            var role_id = myArray[0].rollid;
            var selected_start_status = JSON.parse(storage.getItem('c_start_status'));
            var selected_end_status = JSON.parse(storage.getItem('sub_flow_end_status'));
            var reject_status = JSON.parse(storage.getItem('sub_flow_reject_status'));
            var loc_task_update = JSON.parse(storage.getItem('loc_task_update'));
            var back_color = JSON.parse(storage.getItem('sub_flow_back_color'));
            var c_is_online = JSON.parse(storage.getItem('c_is_online'));

            var checksheet_list = JSON.parse(storage.getItem('task_data_column'));
            for (c = 0; c < checksheet_list.length; c++) {
                var t_udf_id = checksheet_list[c].id;
                if (t_udf_id == id) {
                    var data = checksheet_list[c].data;
                    var list_item = '<input type="hidden" id="hdn_' + id + '" value=\'' + encodeURIComponent(data) + '\'>';
                    $("#checksheet_list").append(list_item);
                    break;
                }
            }

            redirect_on_subflow_click(flow_name1, id, flow_id, type, selected_start_status, selected_end_status, reject_status, loc_task_update, role_id, '', c_is_online);
        }
        else {
            var id = myArray[0].id;
            var type = myArray[0].type;
            var flow_id = myArray[0].flow_id;
            var flow_name1 = myArray[0].flow_name1;
            var role_id = myArray[0].rollid;
            var selected_start_status = JSON.parse(storage.getItem('c_start_status'));
            var selected_end_status = JSON.parse(storage.getItem('sub_flow_end_status'));
            var reject_status = JSON.parse(storage.getItem('sub_flow_reject_status'));
            var loc_task_update = JSON.parse(storage.getItem('loc_task_update'));
            var back_color = JSON.parse(storage.getItem('sub_flow_back_color'));
            var c_is_online = JSON.parse(storage.getItem('c_is_online'));

            var list_item = '<input type="hidden" id="hdn_' + id + '" value=\'' + encodeURIComponent(myArray[0].data) + '\'>';
            $("#checksheet_list").append(list_item);

            redirect_on_subflow_click(flow_name1, id, flow_id, type, selected_start_status, selected_end_status, reject_status, loc_task_update, role_id, '', c_is_online);
        }
    }
    catch (e) {
        alert1(e + '_onsuccess_redirect_on_pre_subflow_click_hybrid()');
    }
}

function onfail_redirect_on_pre_subflow_click_hybrid(e) {
    alert1(e + '_onfail_redirect_on_pre_subflow_click_hybrid()');
}



function get_checklist_data_for_subtask_hybrid_online(moduleid) {
    try {

        loading();
        var company_id = JSON.parse(storage.getItem('company_id'));
        var user_id = JSON.parse(storage.getItem('user_id'));
        var role_id = JSON.parse(storage.getItem('role_id'));
        var selected_site = JSON.parse(storage.getItem('siteid'));
        var selected_server_task_id = JSON.parse(storage.getItem('server_task_id'));
        if (selected_server_task_id == "" || selected_server_task_id == null || selected_server_task_id == undefined) {
            selected_server_task_id = JSON.parse(storage.getItem('p_server_task_id'));
        }

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

        var getdata = new Webservicecall_REST(common_global_wcf_url + 'WCF_GetCustomerWithGlobalVar_With_Role_Port', JSON.stringify(param_obj), function (e) {
            var responseText = JSON.parse(e.responseText);
            var status = responseText[0].status;
            if (status == 1) {
                loading_hide();
                var myArray = JSON.parse(responseText[0].data);
                var task_checklist_data = myArray[0].data;
                task_checklist_data = JSON.stringify(task_checklist_data)

                storage.setItem('task_data_column', task_checklist_data);

                // sitewise module listing change
                var data_json = JSON.parse(storage.getItem('list_json'));
                var list_data = JSON.parse(data_json);
                var multiflow_list = list_data[0].multiflow_list;
                var flow_id_found = 0;
                var sub_flow_id_found = 0;
                var t_task_checklist_data = JSON.parse(task_checklist_data);
                for (var i = 0; i < t_task_checklist_data.length; i++) {
                    var sub_flow_id = t_task_checklist_data[i].sub_flow_id;
                    if (sub_flow_id == '' || sub_flow_id == null || sub_flow_id == undefined || sub_flow_id == 0) { } else {
                        sub_flow_id_found++;
                        break;
                    }
                }

                if (sub_flow_id_found == 0) {
                    // sub flow not found
                    check_server_date();
                }
                else {
                    // sub flow found
                    get_list_of_pm_subflow_hybrid();
                }
            }
            else {
                loading_hide();
                alert1(responseText[0].message);
            }

        }, onfail);
        getdata.callOtherDomain();

    } catch (e) {
        alert1(e + '_get_checklist_data_for_subtask_hybrid_online()');
        loading_hide();
    }
}
