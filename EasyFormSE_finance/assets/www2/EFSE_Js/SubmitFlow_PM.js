// this part is for PM flow

// get formatted date


// update current checksheet status in store checklist
function update_current_checksheet_status() {
    try {
        var is_shortcutbutton = localStorage.getItem('is_shortcutbutton');
        if (is_shortcutbutton == 'true') {
            // update status directly without checking validation and all because of shorcut button (11012019)
            var t_shortcut_button_array = JSON.parse(localStorage.getItem('shortcut_button_array'));
            if (t_shortcut_button_array == "" || t_shortcut_button_array == null || t_shortcut_button_array == undefined) {
                update_task_status_on_pm_checksheet_submit();
            }
            else {
                var t_sb_trip = t_shortcut_button_array[0].sb_trip;

                if (t_sb_trip == "start") {
                    myApp.showPreloader('Initializing Trip...');

                    var locObj = new MkLocation();
                    locObj._getLocation(function (e) {
                        temp_location_Array = e;
                        setTimeout(function () {
                            start_stop_trip_on_SB_click(0);
                        }, 1000);
                    });

                }
                else if (t_sb_trip == "stop") {
                    myApp.showPreloader('Finalizing Trip...');
                    setTimeout(function () {
                        start_stop_trip_on_SB_click(1);
                    }, 1000)
                }
                else {
                    setTimeout(function () {
                        update_task_status_on_pm_checksheet_submit();
                    }, 500);
                }
            }
        }
        else {
            //check for trip
            var checksheet_trip = curr_survey_data["trip"];
            var trip_status = localStorage.getItem('trip_status')

            if (checksheet_trip == 'start') {
                // Auto trip start

                var itemObj = new MKCheckItem();
                itemObj._isTripAvailable(function (e) {
                    var trip_available = e;
                    if (trip_available == "yes") {
                        var trip_status = 1;
                    }
                    else {
                        var trip_status = 0;
                    }

                    if (trip_status == '' || trip_status == undefined || trip_status == null || trip_status == 1) {
                        myApp.showPreloader('Initializing Trip...');

                        var locObj = new MkLocation();
                        locObj._getLocation(function (e) {
                            temp_location_Array = e;
                            setTimeout(function () {
                                start_stop_trip(0);
                            }, 1000);
                        });
                    }
                    else {
                        update_current_checksheet_status_post();
                    }
                });

                //if (trip_status == '' || trip_status == undefined || trip_status == null || trip_status == 1) {
                //    myApp.showPreloader('Initializing Trip...');
                //    var locObj = new MkLocation();
                //    locObj._getLocation(function (e) {
                //        temp_location_Array = e;
                //        start_stop_trip(0);
                //    });
                //}
                //else {
                //    update_current_checksheet_status_post();
                //}

            }
            else if (checksheet_trip == 'stop') {
                check_n_auto_stop_trip_on_submit();
            }
            else {
                var data_json = JSON.parse(storage.getItem('list_json'));
                var list_data = JSON.parse(data_json);
                var auto_trip = list_data[0].auto_trip;
                if (auto_trip == 'true') {
                    var end_status = JSON.parse(storage.getItem('end_status'));
                    var end_trip_status = list_data[0].end_trip_status;
                    if (end_status == end_trip_status) {
                        check_n_auto_stop_trip_on_submit();
                    }
                    else {
                        alert("End Trip Status is not configured or not matched!");
                        loading_hide();
                    }
                }
                else {
                    update_current_checksheet_status_post();
                }
            }
        }
    } catch (e) {
        alert1(e + 'update_current_checksheet_status()');
        loading_hide();
    }
}

function update_current_checksheet_status_post() {
    try {
        var checksheet_found = 0;
        if (curr_btn_mode == "updatetasknsubmit" || curr_btn_mode == "updatetasknredirect" || curr_btn_mode == "updatetasknautoopentaskform" || curr_btn_mode == "checknsubmit" || curr_btn_mode == "reject") {

            // // store 0/1 for status update or not at the end start---------
            // var loc_task_update = false;
            // var check_type = JSON.parse(storage.getItem('check_type'));
            // var c_start_status =
            // JSON.parse(storage.getItem('c_start_status'));
            // var new_checksheet_list = JSON.parse(storage
            // .getItem('new_checklist'));
            // for (i = 0; i < new_checksheet_list.length; i++) {
            // var checksheetid = new_checksheet_list[i].checksheetid;
            // var is_submited = new_checksheet_list[i].is_submited;
            // var start_status = new_checksheet_list[i].start_status;
            // if (checksheetid == check_type
            // && start_status == c_start_status && is_submited == 1) {
            // loc_task_update = true;
            // break;
            // }
            // }
            // storage.setItem('loc_task_update',
            // JSON.stringify(loc_task_update));
            // // store 0/1 for status update or not at the end end---------

            var check_type = JSON.parse(storage.getItem('check_type'));
            var role_id = JSON.parse(storage.getItem('role_id'));
            var c_start_status = JSON.parse(storage.getItem('c_start_status'));

            var new_checksheet_list = JSON.parse(storage.getItem('new_checklist'));
            for (i = 0; i < new_checksheet_list.length; i++) {
                var checksheetid = new_checksheet_list[i].checksheetid;
                var start_status = new_checksheet_list[i].start_status;
                var c_role_id = new_checksheet_list[i].role_id;
                if (c_role_id == '' || c_role_id == null || c_role_id == undefined) {
                    c_role_id = role_id;
                }
                if (checksheetid == check_type && start_status == c_start_status && role_id == c_role_id) {
                    new_checksheet_list[i].is_submited = 1;
                    checksheet_found++;
                    break;
                }
            }
            storage.setItem('new_checklist', JSON.stringify(new_checksheet_list));

            // /--sub task--////
            var flow_Array = JSON.parse(storage.getItem('flow_Array'));
            if (flow_Array.length > 1) {
                var type = flow_Array[flow_Array.length - 1].type;
                if (type == 'Module' || type == 'Flow') {
                    flow_Array[flow_Array.length - 1].checklist = new_checksheet_list;
                } else {
                    // Group
                    flow_Array[flow_Array.length - 2].checklist = new_checksheet_list;
                }

                // new change
                var data_count = flow_Array[flow_Array.length - 1].list_json;
                storage.setItem('list_json_Array', JSON.stringify(data_count));

                storage.setItem('flow_Array', JSON.stringify(flow_Array));
            }
            // ///////////
        }

        if (checksheet_found == 0) {
            alert1("Checksheet is not found in global variable, Please submit again !");
            changeurl("viewsitelist_pm_grouplist.html");
        }
        else {
            var c_is_online = JSON.parse(storage.getItem('c_is_online'));
            if (c_is_online == 1) {
                // update global var on server on every checksheet submit 11032024
                save_global_variables_PV_online_new();
            }
            else {
                save_global_variables_PV();
            }
        }

    } catch (e) {
        alert1(e + 'update_current_checksheet_status_post()');
        loading_hide();
    }
}

function save_global_variables_PV_online_new() {
    loading();
    var company_id = JSON.parse(storage.getItem('company_id'));
    var user_id = JSON.parse(storage.getItem('user_id'));
    var server_task_id = JSON.parse(storage.getItem('server_task_id'));

    var checksheet_dependency = JSON.parse(storage.getItem('checksheet_dependency'));
    if (checksheet_dependency == null || checksheet_dependency == undefined || checksheet_dependency == "") {
        var checksheet_dependency = [];
    }

    if (step_Array == undefined || step_Array == "" || step_Array == null) {
        var step_Array = [];
    }

    var new_checksheet_list = JSON.parse(storage.getItem('new_checklist'));
    if (new_checksheet_list == null || new_checksheet_list == undefined || new_checksheet_list == "") {
        alert1("Task is not updated. Please submit again!");
    }
    else {
        var global_var_Array = [];
        global_var_Array.push({
            'checksheet_dependency': checksheet_dependency,
            'new_checklist': new_checksheet_list,
            'step_Array_to_read': step_Array,
            't_id': server_task_id,
            'task_id': server_task_id,
            'server_task_id': server_task_id
        });
        var global_var_obj = JSON.stringify(global_var_Array);

        var param_obj = [];
        param_obj.push({
            'Company_Id': company_id,
            'User_Id': user_id,
            'server_task_id': server_task_id,
            'global_var': global_var_obj
        });

        var getdata = new Webservicecall_REST(common_global_wcf_url + 'WCF_SaveGlobalVarAndStep_Port', JSON.stringify(param_obj), function (e) {
            var responseText = JSON.parse(e.responseText);
            var status = responseText[0].status;
            if (status == 1) {
                loading_hide();
                save_global_variables_PV();
            }
            else {
                loading_hide();
                alert1(responseText[0].message);
            }
        }, onfail_request);
        getdata.callOtherDomain();

    }
}

// save global variables for current task (site)
function save_global_variables_PV() {
    try {
        // alert1("saving global variables");
        var t_id = JSON.parse(storage.getItem('tid'));
        var task_id = JSON.parse(storage.getItem('task_id'));
        var server_task_id = JSON.parse(storage.getItem('server_task_id'));
        var checksheet_dependency = JSON.parse(storage.getItem('checksheet_dependency'));
        if (checksheet_dependency == null || checksheet_dependency == undefined || checksheet_dependency == "") {
            var checksheet_dependency = [];
        }

        if (step_Array == undefined || step_Array == "" || step_Array == null) {
            var step_Array = [];
        }

        var new_checksheet_list = JSON.parse(storage.getItem('new_checklist'));
        if (new_checksheet_list == null || new_checksheet_list == undefined || new_checksheet_list == "") {
            alert1("Task is not updated. Please submit again!");
        }
        else {
            var global_var_Array = [];
            global_var_Array.push({
                'checksheet_dependency': checksheet_dependency,
                'new_checklist': new_checksheet_list,
                'step_Array_to_read': step_Array,
                't_id': t_id,
                'task_id': task_id,
                'server_task_id': server_task_id
            });

            var global_var_obj = JSON.stringify(global_var_Array);
            localStorage.setItem('global_var_obj', global_var_obj);

            var is_subflow = localStorage.getItem('is_subflow');
            if (is_subflow == 'true') {
                var q1 = "0";
            } else {
                //var q1 = "1";

                var c_is_online = JSON.parse(storage.getItem('c_is_online'));
                if (c_is_online == 1) {
                    var q1 = "0";    // will remain flag = 0
                }
                else {
                    var q1 = "1";    // will update flag = 1
                }
            }

            var query = "UPDATE task_master SET global_var = '" + global_var_obj + "', step='0' where tid = '" + t_id + "'";
            //alert1(query);
            var q_jsonobj = [];
            q_jsonobj.push({
                data: query,
                q: q1,
                tid: t_id
            });

            // alert1("curr_btn_mode: " + curr_btn_mode);
            if (curr_btn_mode == "reject") {
                cordova.exec(reject_current_checksheet, onfail_save_global_variables_PV, 'SqlitePlugin', 'insertValuse', q_jsonobj);
            } else {
                cordova.exec(check_all_checksheet_status, onfail_save_global_variables_PV, 'SqlitePlugin', 'insertValuse', q_jsonobj);
            }
        }
    } catch (e) {
        alert1(e + '_save_global_variables_PV()');
        loading_hide();
    }
}

// check all step status by getting button array from survey
function check_all_checksheet_status() {
    try {
        var flow_Array = JSON.parse(storage.getItem('flow_Array'));
        var c_start_status = JSON.parse(storage.getItem('c_start_status'));
        var role_id = JSON.parse(storage.getItem('role_id'));
        if (flow_Array.length == 1) {
            var new_checksheet_list = JSON.parse(storage.getItem('new_checklist'));

            var pending = 0;
            var rejected_cnt = 0;
            for (i = 0; i < new_checksheet_list.length; i++) {
                var curr_start_status = new_checksheet_list[i].start_status;
                var is_submited = new_checksheet_list[i].is_submited;
                if (is_submited == '' || is_submited == null || is_submited == undefined) {
                    is_submited = 0;
                }
                var c_role_id = new_checksheet_list[i].role_id;
                if (c_role_id == '' || c_role_id == null || c_role_id == undefined) {
                    c_role_id = role_id;
                }
                if (is_submited == 0 && curr_start_status == c_start_status && role_id == c_role_id) {

                    var is_mandatory = new_checksheet_list[i].is_mandatory;
                    var is_disabled = new_checksheet_list[i].is_disabled;
                    if (is_mandatory == 0 || is_disabled == 1) {
                        // is_mandatory == 0 (checksheet is not mandatory)
                        // is_disabled == 1 (checksheet should be in read only mode)
                    }
                    else {

                      
                        let start_time = new_checksheet_list[i].start_time;
                        if (start_time == "" || start_time == null || start_time == undefined || start_time == "00:00:00") {
                            pending++;
                            break;
                        }
                        else {
                            let duration = new_checksheet_list[i].duration;
                            if (duration == "" || duration == null || duration == undefined || duration == "0") {
                                pending++;
                                break;
                            }
                            else {
                                duration = parseInt(duration);
                            }

                            if (isCurrentTimeInSlot(start_time, duration)) {
                                //console.log("Current time is inside slot");
                                pending++;
                                break;

                            } else {
                                //console.log("Outside slot");

                                // do not validation sub flow if outside time slot
                                
                            }
                        }
                                            
                    }
                }
                else if (is_submited == 2) {
                    rejected_cnt++;
                }
            }
        } else {
            var curr_module_id = JSON.parse(storage.getItem('wayflow'));
            var type = flow_Array[flow_Array.length - 1].type;
            var all_count = $("#site_list > li").length;
            var f_li_text = $('#site_list > li:first').text();
            if ((type == 'Module' || type == 'Flow') && (all_count == 0 || f_li_text == 'No Record Found !')) {
                // / Fix
                var new_checksheet_list = flow_Array[flow_Array.length - 1].checklist;
                var pending = 0;
                var rejected_cnt = 0;

                for (i = 0; i < new_checksheet_list.length; i++) {
                    var curr_start_status = new_checksheet_list[i].start_status;
                    var is_submited = new_checksheet_list[i].is_submited;
                    if (is_submited == '' || is_submited == null || is_submited == undefined) {
                        is_submited = 0;
                    }
                    var c_role_id = new_checksheet_list[i].role_id;
                    if (c_role_id == '' || c_role_id == null || c_role_id == undefined) {
                        c_role_id = role_id;
                    }
                    if (is_submited == 0 && curr_start_status == c_start_status && role_id == c_role_id) {

                        var is_mandatory = new_checksheet_list[i].is_mandatory;
                        var is_disabled = new_checksheet_list[i].is_disabled;
                        if (is_mandatory == 0 || is_disabled == 1) {
                            // is_mandatory == 0 (checksheet is not mandatory)
                            // is_disabled == 1 (checksheet should be in read only mode)
                        }
                        else {
                            pending++;
                            break;
                        }
                    }
                    else if (is_submited == 2) {
                        rejected_cnt++;
                    }
                }
            } else {
                // Group
                var new_checksheet_list = flow_Array[flow_Array.length - 2].checklist;
                var pending = 0;
                var rejected_cnt = 0;

                for (i = 0; i < new_checksheet_list.length; i++) {
                    var curr_start_status = new_checksheet_list[i].start_status;
                    var is_submited = new_checksheet_list[i].is_submited;
                    if (is_submited == '' || is_submited == null || is_submited == undefined) {
                        is_submited = 0;
                    }
                    // var flow_id = new_checksheet_list[i].sub_flow_id;
                    var c_role_id = new_checksheet_list[i].role_id;
                    if (c_role_id == '' || c_role_id == null || c_role_id == undefined) {
                        c_role_id = role_id;
                    }
                    if (is_submited == 0 && curr_start_status == c_start_status && role_id == c_role_id) {
                        var is_mandatory = new_checksheet_list[i].is_mandatory;
                        var is_disabled = new_checksheet_list[i].is_disabled;
                        if (is_mandatory == 0 || is_disabled == 1) {
                            // is_mandatory == 0 (checksheet is not mandatory)
                            // is_disabled == 1 (checksheet should be in read only mode)
                        }
                        else {
                            pending++;
                            break;
                        }
                    }
                    else if (is_submited == 2) {
                        rejected_cnt++;
                    }
                }
            }
        }
        // alert1("pending: " + pending);

        var all_green = JSON.parse(storage.getItem('all_green'));
        if (all_green == 'true') {
            pending = 0;
        }

        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var submit_msg = list_data[0].submit_msg;
        if (submit_msg == '' || submit_msg == null || submit_msg == undefined) { }
        else {
            var checklist = submit_msg[0].checksheet_msg;
            var check_type = JSON.parse(storage.getItem('check_type'));
            for (f = 0; f < checklist.length; f++) {
                if (check_type == checklist[f].id) {
                    var checksheet_msg = checklist[f].msg;
                    if (checksheet_msg == '' || checksheet_msg == null || checksheet_msg == undefined) { } else {
                        alert1(checksheet_msg);
                    }
                    break;
                }
            }
        }

        //alert1("pending: " + pending);
        if (pending == 0) {
            if (rejected_cnt > 0) {
                var sub_flow_reject_status = storage.getItem('sub_flow_reject_status');
                storage.setItem('end_status', sub_flow_reject_status);
            }
            // all checksheet with same start_status are completed

            var c_is_online = JSON.parse(storage.getItem('c_is_online'));
            if (c_is_online == 1) {
                // don't check local local with mapping as partial log for same task are allowed for multiple mobile - 15032024
                update_task_status_on_pm_checksheet_submit();
            }
            else {
                get_mapped_checklist();
            }

        } else {
            // all checksheet with same start_status are not completed
            //var survey_mode = list_data[0].survey_mode;
            //if (survey_mode == 'online') {
            //    save_global_variables_PV_online();
            //}
            //else {
            check_and_redirect_subflow_on_submit();
            //}
        }
    } catch (e) {
        alert1(e + 'check_all_checksheet_status()');
        loading_hide();
    }
}

function check_and_redirect_subflow_on_submit() {
    try {
        loading_hide();
        // all checksheet with same start_status are not completed
        step_Array = [];
        storage.setItem('step_Array_to_read', JSON.stringify(step_Array.slice(0)));

        var shortest_path = curr_survey_data["shortest_path"];
        if (shortest_path == '' || shortest_path == null || shortest_path == undefined) {
            // OTHER STATUS
            var flow_Array = JSON.parse(storage.getItem('flow_Array'));
            if (flow_Array.length == 1) {
                // other checksheets are still pending
                changeurl("viewsitelist_pm_grouplist.html");
            } else {
                var curr_module_id = JSON.parse(storage.getItem('wayflow'));
                var all_count = $("#site_list > li").length;
                var type = flow_Array[flow_Array.length - 1].type;
                if (type == 'Module' || type == 'Flow') {
                    // /////////////////////---Fix-----------//////////
                    if (all_count == 0) {
                        // normal submit button
                        var selected_tid = flow_Array[flow_Array.length - 1].tid;
                        var selected_site = flow_Array[flow_Array.length - 1].siteid;
                        storage.setItem('tid', JSON.stringify(selected_tid));
                        storage.setItem('siteid', JSON.stringify(selected_site));
                        changeurl("viewsitelist_pm_grouplist.html");
                    } else {
                        // subflow submit button
                        flow_Array.pop();
                        var id = flow_Array[0].id;
                        var flow_id = flow_Array[0].wayflow;
                        var flow_name = flow_Array[0].wayflow_name;
                        var list_json = flow_Array[0].list_json;
                        storage.setItem('udf_id', JSON.stringify(id));
                        storage.setItem('wayflow', JSON.stringify(flow_id));
                        storage.setItem('wayflow_name', JSON.stringify(flow_name));
                        storage.setItem('list_json', JSON.stringify(list_json));

                        // new change
                        var data_count = flow_Array[0].list_json;
                        storage.setItem('list_json_Array', JSON.stringify(data_count));

                        storage.setItem('flow_Array', JSON.stringify(flow_Array));

                        var selected_tid = flow_Array[0].tid;
                        var selected_site = flow_Array[0].siteid;
                        storage.setItem('tid', JSON.stringify(selected_tid));
                        storage.setItem('siteid', JSON.stringify(selected_site));
                        changeurl("viewsitelist_pm_grouplist.html");
                    }
                    // /////////////////////////////////////

                } else {
                    // group
                    var selected_tid = flow_Array[flow_Array.length - 2].tid;
                    var selected_site = flow_Array[flow_Array.length - 2].siteid;
                    storage.setItem('tid', JSON.stringify(selected_tid));
                    storage.setItem('siteid', JSON.stringify(selected_site));
                    changeurl("viewsitelist_pm_grouplist.html");
                }
                // ////----------------/////
            }
        } else {
            get_shortest_path();
        }
    }
    catch (e) {
        alert1(e + '_check_and_redirect_subflow_on_submit()');
    }
}


// added on 23/07/2018
function get_mapped_checklist() {
    try {
        var moduleid = JSON.parse(storage.getItem('wayflow'));
        var query = "select data from flow_master where moduleid = '" + moduleid + "'";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "1"
        });
        AppBridge.on(cordova).read(onsuccess_get_mapped_checklist, onfail_request, 'flowMapping', { moduleid: moduleid });
    } catch (e) {
        alert1(e + '_get_mapped_checklist()')
    }
}

function onsuccess_get_mapped_checklist(e) {
    try {
        var myArray = JSON.parse(e);
        if (myArray == '' || myArray == null || myArray == undefined || myArray.length == 0) {
            get_mapped_checklist_online();
        }
        else {
            var task_checklist_data = myArray[0].data;
            task_checklist_data = JSON.parse(task_checklist_data);
            check_all_checksheet_log(task_checklist_data);
        }
    } catch (e) {
        alert1(e + "_onsuccess_get_mapped_checklist");
    }
}

function get_mapped_checklist_online() {
    try {

        loading();
        var moduleid = JSON.parse(storage.getItem('wayflow'));
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

        var getdata = new Webservicecall_REST(common_global_wcf_url + 'WCF_GetCustomerWithGlobalVar_With_Role_Port', JSON.stringify(param_obj), function (e) {
            var responseText = JSON.parse(e.responseText);
            var status = responseText[0].status;
            if (status == 1) {
                loading_hide();
                var myArray = JSON.parse(responseText[0].data);
                var task_checklist_data = myArray[0].data;
                check_all_checksheet_log(task_checklist_data);
            }
            else {
                loading_hide();
                alert1(responseText[0].message);
            }

        }, onfail_request);
        getdata.callOtherDomain();

    } catch (e) {
        alert1(e + '_get_mapped_checklist_online()');
        loading_hide();
    }
}

function check_all_checksheet_log(checksheet_list) {
    try {
        var t_id = JSON.parse(storage.getItem('tid'));
        var c_start_status = JSON.parse(storage.getItem('c_start_status'));
        var role_id = JSON.parse(storage.getItem('role_id'));
        //var checksheet_list = JSON.parse(storage.getItem('task_data_column'));

        var checksheet_Array = [];
        var total_checksheets = checksheet_list.length;
        for (t = 0; t < total_checksheets; t++) {
            var checksheet_id = checksheet_list[t].checksheetid;
            var start_status = checksheet_list[t].start_status;
            var c_role_id = checksheet_list[t].role_id;
            if (c_role_id == '' || c_role_id == null || c_role_id == undefined) {
                c_role_id = role_id;
            }
            if (start_status == c_start_status && checksheet_id != 0 && role_id == c_role_id) {
                checksheet_Array.push(checksheet_id);
            }
        }

        var query = "select fid from f_master where tid = '" + t_id + "' and c_id in (" + checksheet_Array + ") and step = '1'";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "1"
        });
        cordova.exec(onsuccess_check_all_checksheet_log, onfail_check_all_checksheet_log, 'SqlitePlugin', 'showValues', q_jsonobj);
    }
    catch (e) {
        alert1(e + '_check_all_checksheet_log()');
    }
}

function onsuccess_check_all_checksheet_log(e) {
    try {
        var myArray = JSON.parse(e);
        var log_count = myArray.length;
        var new_checksheet_list = JSON.parse(storage.getItem('new_checklist'));
        var role_id = JSON.parse(storage.getItem('role_id'));
        var c_start_status = JSON.parse(storage.getItem('c_start_status'));

        var chk_count = 0;
        var total_checksheets = new_checksheet_list.length;
        for (t = 0; t < total_checksheets; t++) {
            var checksheet_id = new_checksheet_list[t].checksheetid;
            var start_status = new_checksheet_list[t].start_status;
            var c_role_id = new_checksheet_list[t].role_id;
            if (c_role_id == '' || c_role_id == null || c_role_id == undefined) {
                c_role_id = role_id;
            }

            var is_disabled = new_checksheet_list[t].is_disabled;
            if (is_disabled == '' || is_disabled == null || is_disabled == undefined) {
                is_disabled = 0;   // 0 for read-write mode (vodafone: metal for TES - 28122018)
            }

            var is_mandatory = new_checksheet_list[t].is_mandatory;
            if (start_status == c_start_status && checksheet_id != 0 && role_id == c_role_id && is_disabled == 0 && is_mandatory == 1) {
                chk_count++;
            }
        }

        //alert1("chk_count: " + chk_count);
        //alert1("log_count: " + log_count);
        if (log_count >= chk_count) {
            // All logs are found locally

            // update_task_status_on_pm_checksheet_submit();

            // patch for check again for validate tid and moduleid (15102018)
            reverse_check_for_valid_flowid_and_tid();
        } else {
            alert1("GlobalVar Checksheet Mapping Count: " + chk_count + ", \nLog Count: " + log_count + ". \nSome checksheets survey are still pending, please survey all checksheets and submit again !");
            null_global_var_on_mapping_mismatch();
        }
    }
    catch (e) {
        alert1(e + '_onsuccess_check_all_checksheet_log()');
    }
}

function onfail_check_all_checksheet_log(e) {
    alert1(e + '_onfail_check_all_checksheet_log()');
}

///--1--////
function reverse_check_for_valid_flowid_and_tid() {
    var t_id = JSON.parse(storage.getItem('tid'));
    var query = "select global_var, status, moduleid from task_master where tid = '" + t_id + "'";
    var q_jsonobj = [];
    q_jsonobj.push({
        data: query,
        p: "1"
    });
    cordova.exec(reverse_get_mapped_checklist, onfail_request, 'SqlitePlugin', 'showValues', q_jsonobj);
}

var reverse_global_var;
function reverse_get_mapped_checklist(e) {
    try {
        var myArray = JSON.parse(e);
        var moduleid = myArray[0].moduleid;
        reverse_global_var = myArray[0].global_var;

        var query = "select data from flow_master where moduleid = '" + moduleid + "'";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "1"
        });
        AppBridge.on(cordova).read(onsuccess_reverse_get_mapped_checklist, onfail_request, 'flowMapping', { moduleid: moduleid });
    } catch (e) {
        alert1(e + '_reverse_get_mapped_checklist()');
    }
}

function onsuccess_reverse_get_mapped_checklist(e) {
    try {
        var myArray = JSON.parse(e);
        if (myArray == '' || myArray == null || myArray == undefined || myArray.length == 0) {
            onsuccess_reverse_get_mapped_checklist_online();
        }
        else {
            var mapped_checklist_data = myArray[0].data;
            mapped_checklist_data = JSON.parse(mapped_checklist_data);
            onsuccess_reverse_get_mapped_checklist_post(mapped_checklist_data);
        }
    } catch (e) {
        alert1(e + "_onsuccess_reverse_get_mapped_checklist()");
    }
}

function onsuccess_reverse_get_mapped_checklist_online() {
    try {

        loading();
        var moduleid = JSON.parse(storage.getItem('wayflow'));
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

        var getdata = new Webservicecall_REST(common_global_wcf_url + 'WCF_GetCustomerWithGlobalVar_With_Role_Port', JSON.stringify(param_obj), function (e) {
            var responseText = JSON.parse(e.responseText);
            var status = responseText[0].status;
            if (status == 1) {
                loading_hide();
                var myArray = JSON.parse(responseText[0].data);
                var mapped_checklist_data = myArray[0].data;
                onsuccess_reverse_get_mapped_checklist_post(mapped_checklist_data);
            }
            else {
                loading_hide();
                alert1(responseText[0].message);
            }

        }, onfail_request);
        getdata.callOtherDomain();

    } catch (e) {
        alert1(e + '_onsuccess_reverse_get_mapped_checklist_online()');
        loading_hide();
    }
}

function onsuccess_reverse_get_mapped_checklist_post(mapped_checklist_data) {
    var myArray1 = JSON.parse(reverse_global_var);
    var new_checksheet_list = myArray1[0].new_checklist;

    // mapped checklist
    var flow_mismatched = 0;
    for (t = 0; t < mapped_checklist_data.length; t++) {
        var mp_is_disabled = mapped_checklist_data[t].is_disabled;
        if (mp_is_disabled == '' || mp_is_disabled == null || mp_is_disabled == undefined) {
            mp_is_disabled = 0;   // 0 for read-write mode (vodafone: metal for TES - 28122018)
        }

        if (mp_is_disabled == 0) {
            var mp_checksheet_id = mapped_checklist_data[t].checksheetid;
            var mp_start_status = mapped_checklist_data[t].start_status;
            var mp_flow_id = mapped_checklist_data[t].sub_flow_id;

            // local global_var
            var mapped_chk_found = 0;
            for (i = 0; i < new_checksheet_list.length; i++) {
                var start_status = new_checksheet_list[i].start_status;

                if (mp_checksheet_id == 0) {
                    // sub flow obj
                    var flow_id = new_checksheet_list[i].sub_flow_id;
                    if (mp_flow_id == flow_id && start_status == mp_start_status) {
                        mapped_chk_found++;
                        break;
                    }
                }
                else {
                    // checksheet obj
                    var checksheetid = new_checksheet_list[i].checksheetid;
                    if (checksheetid == mp_checksheet_id && start_status == mp_start_status) {
                        mapped_chk_found++;
                        break;
                    }
                }
            }

            if (mapped_chk_found == 0) {
                flow_mismatched++;
                break;
            }
        }
    }

    if (flow_mismatched == 0) {
        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var punching = list_data[0].punching;
        if (punching == 'true') {
            make_punch_out_entry_task();
        }
        else {
            update_task_status_on_pm_checksheet_submit();
        }
    }
    else {
        alert1("Flowid or Tid is invalid in local, Please submit again !");
        storage.setItem('flow_Array', JSON.stringify(''));
        localStorage.setItem('is_subflow', 'false');
        changeurl("selection.html");
    }

}

function null_global_var_on_mapping_mismatch() {
    try {
        var t_id = JSON.parse(storage.getItem('tid'));
        var query = "UPDATE task_master SET global_var = '' where tid = '" + t_id + "'";
        //alert1(query);
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            q: "0",
            tid: "0"
        });
        cordova.exec(onsuccess_null_global_var_on_mapping_mismatch, onfail_null_global_var_on_mapping_mismatch, 'SqlitePlugin', 'insertValuse', q_jsonobj);
    } catch (e) {
        alert1(e + '_null_global_var_on_mapping_mismatch()');
        loading_hide();
    }
}

function onsuccess_null_global_var_on_mapping_mismatch(e) {
    storage.setItem('flow_Array', JSON.stringify(''));
    localStorage.setItem('is_subflow', 'false');
    changeurl("selection.html");
}

function onfail_null_global_var_on_mapping_mismatch(e) {
    alert1(e + '_onfail_null_global_var_on_map_mismatch()');
}

//-----1------//


// Update task status on PM checksheet submit means checksheet is completed but
// flow is still pending.
function update_task_status_on_pm_checksheet_submit() {
    var c_is_online = JSON.parse(storage.getItem('c_is_online'));
    if (c_is_online == 1) {
        // online checksheet
        update_task_status_on_pm_checksheet_submit_online();
    }
    else {
        // offline checksheet
        update_task_status_on_pm_checksheet_submit_post();
    }
}

function update_task_status_on_pm_checksheet_submit_post() {
    try {
        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var survey_mode = list_data[0].survey_mode;
        var is_shortcutbutton = localStorage.getItem('is_shortcutbutton');
        localStorage.setItem('online_counter', 'false');                // to update module counter after task is uploaded

        var technician_call = "indirect";
        if (is_shortcutbutton == 'true' && survey_mode == 'online') {
            var shortcut_button_array = JSON.parse(localStorage.getItem('shortcut_button_array'));
            if (shortcut_button_array == "" || shortcut_button_array == null || shortcut_button_array == undefined) { }
            else {
                var btn_checksheet_id = shortcut_button_array[0].btn_checksheet_id;
                if (btn_checksheet_id == '0') {
                    var technician_call = "direct";
                }
            }
        }

        if (technician_call == "direct") {
            // update task directly when shortcut button with no checksheet
            var selected_server_task_id = localStorage.getItem('server_task_id_SB');
            update_server_task_entry_online_SB(selected_server_task_id);
        }
        else {
            // update task locally (offline listing / online and shortcut button with checksheet)
            var t_id = JSON.parse(storage.getItem('tid'));

            var start_status = JSON.parse(storage.getItem('start_status'));
            var end_status = JSON.parse(storage.getItem('end_status'));
            var d = new Date();
            var survey_ms = new Date().getTime();
            var curr_date = getFormattedDate(d);

            var match_temp_id = list_data[0].match_temp_id;
            if (match_temp_id == "" || match_temp_id == null || match_temp_id == undefined) {
                match_temp_id = "";
            }

            if (end_status == 2) {
                // when end_status = 2
                var query = "UPDATE task_master SET status = '2', rate='2', survey_ms='" + survey_ms + "', match_temp_id = '" + match_temp_id + "' where tid = '" + t_id + "'";
            } else {
                var loc_task_update = JSON.parse(storage.getItem('loc_task_update'));

                if (loc_task_update == true || loc_task_update == "true") {
                    var c_start_status = JSON.parse(storage.getItem('c_start_status'));
                    // when end_status = 3,4,5,6,7......(Second Time)
                    //var query = "UPDATE task_master SET survey_date='" + curr_date + "' ,step='0', rate='2', status = '" + end_status
                    //    + "', match_temp_id = '" + match_temp_id + "' where tid = '" + t_id + "' and status < '" + end_status + "'";
                    var query = "UPDATE task_master SET survey_date='" + curr_date + "' ,step='0', rate='2', status = '" + end_status
                        + "', match_temp_id = '" + match_temp_id + "' where tid = '" + t_id + "' and status = '" + c_start_status + "'";
                } else {
                    // when end_status = 3,4,5,6,7......(First Time)
                    var query = "UPDATE task_master SET survey_date='" + curr_date + "' ,step='0', rate='2', status = '" + end_status
                        + "', match_temp_id = '" + match_temp_id + "' where tid = '" + t_id + "'";
                }
            }

            //alert1(query);

            var c_is_online = JSON.parse(storage.getItem('c_is_online'));
            if (c_is_online == 1) {
                var q = "0"  // no upload call
            }
            else {
                var q = "2";   // call upload task_master_history
            }

            var q_jsonobj = [];
            q_jsonobj.push({
                data: query,
                q: q,
                tid: t_id,
                old_status: start_status
            });

            cordova.exec(onsuccess_update_task_status_on_pm_checksheet_submit, onfail_update_task_status_on_pm_checksheet_submit, 'SqlitePlugin', 'insertValuse', q_jsonobj);
        }
    } catch (e) {
        alert1(e + '_update_task_status_on_pm_checksheet_submit_post()');
        loading_hide();
    }
}

// onsuccess update task status
function onsuccess_update_task_status_on_pm_checksheet_submit(e) {
    try {
        // alert1("Checksheet has been completed !");

        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var survey_mode = list_data[0].survey_mode;

        var is_shortcutbutton = localStorage.getItem('is_shortcutbutton');
        if (is_shortcutbutton == 'true') {
            // status changed from shortuct button additional checksheet (for online/offline both)

            var shortcut_button_array = JSON.parse(localStorage.getItem('shortcut_button_array'));
            if (shortcut_button_array == "" || shortcut_button_array == null || shortcut_button_array == undefined) {
                //to remove sub task from online task listing
                changeurl("selection_survey.html");
            }
            else {
                var submit_message = shortcut_button_array[0].btn_submit_message;
                if (submit_message == '' || submit_message == null || submit_message == undefined) { }
                else {
                    alert1(submit_message);
                }
                var btn_checksheet_id = shortcut_button_array[0].btn_checksheet_id;
                if (btn_checksheet_id == '0') {
                    changeurl("selection_survey.html");
                }
                else {
                    back_button('viewsitelist_pm_grouplist');
                }
            }
        }
        else {
            // status changed locally
            if (curr_btn_mode == "updatetasknredirect") {
                changeurl("selection_survey.html");
            }
            else {
                step_Array = [];
                storage.setItem('step_Array_to_read', JSON.stringify(step_Array.slice(0)));
                var c_start_status = JSON.parse(storage.getItem('c_start_status'));

                var shortest_path = curr_survey_data["shortest_path"];

                // make shortest path blank for new trip logic (native)
                shortest_path = '';

                if (shortest_path == '' || shortest_path == null || shortest_path == undefined) {
                    var end_status = JSON.parse(storage.getItem('end_status'));
                    if (end_status == "2") {
                        // all checksheets are completed
                        //   alert1("Flow has been completed !");

                        var submit_msg = list_data[0].submit_msg;
                        if (submit_msg == '' || submit_msg == null || submit_msg == undefined) { }
                        else {
                            var flow_msg = submit_msg[0].flow_msg[1];
                            if (flow_msg == '' || flow_msg == null || flow_msg == undefined) { }
                            else {
                                alert1(flow_msg);
                            }
                        }

                        // changeurl("selection_survey.html");

                        // ///////---sub task---///////
                        var flow_Array = JSON.parse(storage.getItem('flow_Array'));
                        if (flow_Array.length == 1) {
                            //for sub task control type37, main task creation on submit btn click [FT-09082024]
                            if (last_submit_button_Array.length > 0) {
                                // redirect to target udf after updating status - sub task control is avialable in checksheet - mk - 10072024
                                let main_udf_id = $("#div_aggr_data_" + curr_type37_new_id + "").attr("main_udf_id");
                                if (main_udf_id == "" || main_udf_id == null || main_udf_id == undefined) {
                                    //window.location.reload();
                                    refresh_site_list_common();
                                }
                                else {
                                    var role_id = JSON.parse(storage.getItem('role_id'));

                                    var t_main_column_array = $("#div_aggr_data_" + curr_type37_new_id + "").attr('main_udf_data')
                                    t_main_column_array = JSON.parse(t_main_column_array);

                                    let flow_id = t_main_column_array[0].main_flow_id;
                                    let flow_name = t_main_column_array[0].main_flow_name;
                                    storage.setItem('flow_Array', JSON.stringify(''));

                                    redirect_on_module_click(flow_name, main_udf_id, flow_id, 'Flow', role_id);
                                }
                            }
                            else {
                                changeurl("selection_survey.html");
                            }
                        } else {
                            var type = flow_Array[flow_Array.length - 1].type;
                            if (type == 'Module' || type == 'Flow') {
                                // Fix
                                var new_checksheet_list = flow_Array[flow_Array.length - 2].checklist;
                                var pending = 0;
                                for (i = 0; i < new_checksheet_list.length; i++) {
                                    var is_submited = new_checksheet_list[i].is_submited;
                                    if (is_submited == 0) {
                                        pending++;
                                        break;
                                    }
                                }
                                if (pending == 0) {
                                    // all group checksheets and sublfow submitted
                                    flow_Array.pop();
                                    var id = flow_Array[0].id;
                                    var flow_id = flow_Array[0].wayflow;
                                    var flow_name = flow_Array[0].wayflow_name;
                                    var list_json = flow_Array[0].list_json;
                                    storage.setItem('udf_id', JSON.stringify(id));
                                    storage.setItem('wayflow', JSON.stringify(flow_id));
                                    storage.setItem('wayflow_name', JSON.stringify(flow_name));
                                    storage.setItem('list_json', JSON.stringify(list_json));

                                    // new change
                                    var data_count = flow_Array[0].list_json;
                                    storage.setItem('list_json_Array', JSON.stringify(data_count));

                                    storage.setItem('flow_Array', JSON.stringify(flow_Array));

                                    // reset task checksheet on sub flow back
                                    var task_checksheetid = flow_Array[0].task_checksheetid;
                                    storage.setItem('check_type_task', JSON.stringify(task_checksheetid));

                                    changeurl("selection_survey.html");
                                } else {
                                    // all sublfow submitted (group checksheets pending)
                                    var flow_id = flow_Array[flow_Array.length - 1].wayflow;
                                    var flow_name = flow_Array[flow_Array.length - 1].wayflow_name;
                                    var list_json = flow_Array[flow_Array.length - 1].list_json;
                                    var selected_tid = flow_Array[flow_Array.length - 2].tid;

                                    var selected_server_task_id = flow_Array[flow_Array.length - 2].server_task_id;
                                    if (selected_server_task_id == "" || selected_server_task_id == null || selected_server_task_id == undefined) {
                                        selected_server_task_id = 0;
                                    }

                                    var selected_site = flow_Array[flow_Array.length - 2].siteid;
                                    var selected_start_status = flow_Array[flow_Array.length - 2].start_status;
                                    storage.setItem('wayflow', JSON.stringify(flow_id));
                                    storage.setItem('wayflow_name', JSON.stringify(flow_name));
                                    storage.setItem('list_json', JSON.stringify(list_json));

                                    // new change
                                    var data_count = flow_Array[flow_Array.length - 1].list_json;
                                    storage.setItem('list_json_Array', JSON.stringify(data_count));

                                    storage.setItem('flow_Array', JSON.stringify(flow_Array));
                                    storage.setItem('tid', JSON.stringify(selected_tid));
                                    storage.setItem('server_task_id', JSON.stringify(selected_server_task_id));
                                    storage.setItem('siteid', JSON.stringify(selected_site));
                                    storage.setItem('c_start_status', JSON.stringify(selected_start_status));
                                    storage.setItem('start_status', JSON.stringify(selected_start_status));

                                    changeurl("selection_survey.html");
                                }

                                // ///////---fix (redirect to main flow)---
                            } else {
                                // //////----fix--/////
                                flow_Array.pop();

                                var id = flow_Array[0].id;
                                var flow_id = flow_Array[0].wayflow;
                                var flow_name = flow_Array[0].wayflow_name;
                                storage.setItem('udf_id', JSON.stringify(id));
                                storage.setItem('wayflow', JSON.stringify(flow_id));
                                storage.setItem('wayflow_name', JSON.stringify(flow_name));

                                // new change
                                var data_count = flow_Array[0].list_json;
                                storage.setItem('list_json_Array', JSON.stringify(data_count));

                                storage.setItem('flow_Array', JSON.stringify(flow_Array));
                                changeurl("selection_survey.html");
                            }

                        }

                        // ////----------------/////
                    } else {
                        // OTHER STATUS
                        var flow_Array = JSON.parse(storage.getItem('flow_Array'));
                        if (flow_Array.length == 1) {
                            // other checksheets are still pending
                            storage.setItem('start_status', JSON.stringify(end_status)); // refresh task status after task updated by new end status
                            flow_Array[flow_Array.length - 1].start_status = end_status;            //refresh flow_array start staus for subflow center btn submit (atc-Add Inventory) [16072021]
                            storage.setItem('flow_Array', JSON.stringify(flow_Array));

                            var is_jitsi_plugin_call = checkCall();
                            if (is_jitsi_plugin_call == true) {
                                //close jitsi webview page from android
                                AndroidCallChecker.closeWebView();
                            }
                            else {
                                changeurl("viewsitelist_pm_grouplist.html");
                            }
                        } else {
                            var curr_module_id = JSON.parse(storage.getItem('wayflow'));
                            var all_count = $("#site_list > li").length;
                            var type = flow_Array[flow_Array.length - 1].type;
                            if (type == 'Module' || type == 'Flow' || type == 'MultiFlow') {
                                // /////////////////////---Fix-----------//////////
                                if (all_count == 0) {
                                    // normal submit button
                                    var selected_tid = flow_Array[flow_Array.length - 1].tid;
                                    var selected_site = flow_Array[flow_Array.length - 1].siteid;
                                    storage.setItem('tid', JSON.stringify(selected_tid));
                                    storage.setItem('siteid', JSON.stringify(selected_site));
                                    changeurl("viewsitelist_pm_grouplist.html");
                                } else {
                                    // subflow submit button
                                    flow_Array.pop();
                                    var id = flow_Array[0].id;
                                    var flow_id = flow_Array[0].wayflow;
                                    var flow_name = flow_Array[0].wayflow_name;
                                    var list_json = flow_Array[0].list_json;
                                    storage.setItem('udf_id', JSON.stringify(id));
                                    storage.setItem('wayflow', JSON.stringify(flow_id));
                                    storage.setItem('wayflow_name', JSON.stringify(flow_name));
                                    storage.setItem('list_json', JSON.stringify(list_json));

                                    // new change
                                    var data_count = flow_Array[0].list_json;
                                    storage.setItem('list_json_Array', JSON.stringify(data_count));

                                    storage.setItem('flow_Array', JSON.stringify(flow_Array));

                                    var selected_tid = flow_Array[0].tid;
                                    var selected_site = flow_Array[0].siteid;
                                    storage.setItem('tid', JSON.stringify(selected_tid));
                                    storage.setItem('siteid', JSON.stringify(selected_site));
                                    changeurl("viewsitelist_pm_grouplist.html");
                                }
                                // /////////////////////////////////////
                            } else {
                                // group
                                var selected_tid = flow_Array[flow_Array.length - 2].tid;
                                var selected_site = flow_Array[flow_Array.length - 2].siteid;
                                storage.setItem('tid', JSON.stringify(selected_tid));
                                storage.setItem('siteid', JSON.stringify(selected_site));
                                changeurl("viewsitelist_pm_grouplist.html");
                            }
                            // ////----------------/////
                        }
                    }
                } else {
                    get_shortest_path();
                }
            }
        }

    } catch (e) {
        (e + '_onsuccess_update_task_status_on_pm_checksheet_submit()');
        loading_hide();
    }
}

// get shortest path to server
function get_shortest_path() {
    try {
        var t_id = JSON.parse(storage.getItem('tid'));
        var sp_array = JSON.parse(decodeURIComponent(curr_survey_data["shortest_path"]));
        var sid = JSON.parse(storage.getItem('server_task_id'));
        var odometer_array = sp_array[0].odometer_point;
        if (odometer_array.length > 0) {
            var que_id = odometer_array[0].que_id;
            var data = curr_survey_data["json"];
            for (i = 0; i < data.length; i++) {
                var t_que_id = data[i].que_id;
                if (t_que_id == que_id) {
                    odometer_array[0].answer = data[i].ans[0];
                    break;
                }
            }
        }

        var shortest_path = [];
        shortest_path.push({
            'tid': t_id,
            'sid': sid,
            'start_point': sp_array[0].start_point,
            'middle_point': sp_array[0].middle_point,
            'end_point': sp_array[0].end_point,
            'odometer_point': sp_array[0].odometer_point
        });
        // alert1(JSON.stringify(shortest_path));
        var q_jsonobj = [];
        q_jsonobj.push({
            'shortest_path': shortest_path
        })

        // temporary commented old trip insert
        //cordova.exec(onsuccess_get_shortest_path, onfail_get_shortest_path, 'SqlitePlugin', 'sh_path_plug', q_jsonobj);


    } catch (e) {
        alert1(e + '_get_shortest_path()');
    }
}

// successfull shortest path
function onsuccess_get_shortest_path(e) {
    try {
        // alert1("shortest path submitted successfully!");
        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);

        var c_start_status = JSON.parse(storage.getItem('c_start_status'));
        var end_status = JSON.parse(storage.getItem('end_status'));
        if (end_status == "2") {
            // all checksheets are completed
            var submit_msg = list_data[0].submit_msg;
            if (submit_msg == '' || submit_msg == null || submit_msg == undefined) { }
            else {
                var flow_msg = submit_msg[0].flow_msg[1];
                alert1(flow_msg);
            }

            // ///////---sub task---///////
            var flow_Array = JSON.parse(storage.getItem('flow_Array'));
            if (flow_Array.length == 1) {
                changeurl("selection_survey.html");
            } else {
                var type = flow_Array[flow_Array.length - 1].type;
                if (type == 'Module' || type == 'Flow') {
                    // Fix
                    var new_checksheet_list = flow_Array[flow_Array.length - 2].checklist;
                    var pending = 0;
                    for (i = 0; i < new_checksheet_list.length; i++) {
                        var is_submited = new_checksheet_list[i].is_submited;
                        if (is_submited == 0) {
                            pending++;
                            break;
                        }
                    }
                    if (pending == 0) {
                        // all group checksheets and sublfow submitted
                        flow_Array.pop();
                        var id = flow_Array[0].id;
                        var flow_id = flow_Array[0].wayflow;
                        var flow_name = flow_Array[0].wayflow_name;
                        var list_json = flow_Array[0].list_json;
                        storage.setItem('udf_id', JSON.stringify(id));
                        storage.setItem('wayflow', JSON.stringify(flow_id));
                        storage.setItem('wayflow_name', JSON.stringify(flow_name));
                        storage.setItem('list_json', JSON.stringify(list_json));

                        // new change
                        var data_count = flow_Array[0].list_json;
                        storage.setItem('list_json_Array', JSON.stringify(data_count));

                        storage.setItem('flow_Array', JSON.stringify(flow_Array));
                        changeurl("selection_survey.html");
                    } else {
                        // all sublfow submitted (group checksheets pending)
                        var flow_id = flow_Array[flow_Array.length - 1].wayflow;
                        var flow_name = flow_Array[flow_Array.length - 1].wayflow_name;
                        var list_json = flow_Array[flow_Array.length - 1].list_json;
                        var selected_tid = flow_Array[flow_Array.length - 2].tid;
                        var selected_site = flow_Array[flow_Array.length - 2].siteid;
                        var selected_start_status = flow_Array[flow_Array.length - 2].start_status;
                        storage.setItem('wayflow', JSON.stringify(flow_id));
                        storage.setItem('wayflow_name', JSON.stringify(flow_name));
                        storage.setItem('list_json', JSON.stringify(list_json));

                        // new change
                        var data_count = flow_Array[flow_Array.length - 1].list_json;
                        storage.setItem('list_json_Array', JSON.stringify(data_count));

                        storage.setItem('flow_Array', JSON.stringify(flow_Array));
                        storage.setItem('tid', JSON.stringify(selected_tid));
                        storage.setItem('siteid', JSON.stringify(selected_site));
                        storage.setItem('c_start_status', JSON.stringify(selected_start_status));
                        changeurl("selection_survey.html");
                    }

                    // ///////---fix (redirect to main flow)---
                } else {
                    // //////----fix--/////
                    flow_Array.pop();

                    // new change
                    var data_count = flow_Array[0].list_json;
                    storage.setItem('list_json_Array', JSON.stringify(data_count));

                    storage.setItem('flow_Array', JSON.stringify(flow_Array));
                    changeurl("selection_survey.html");
                }
            }

            // ////----------------/////
        } else {
            // OTHER STATUS
            var flow_Array = JSON.parse(storage.getItem('flow_Array'));
            if (flow_Array.length == 1) {
                // other checksheets are still pending
                changeurl("viewsitelist_pm_grouplist.html");
            } else {
                var curr_module_id = JSON.parse(storage.getItem('wayflow'));
                var all_count = $("#site_list > li").length;
                var type = flow_Array[flow_Array.length - 1].type;
                if (type == 'Module' || type == 'Flow') {
                    // /////////////////////---Fix-----------//////////
                    if (all_count == 0) {
                        // normal submit button
                        var selected_tid = flow_Array[flow_Array.length - 1].tid;
                        var selected_site = flow_Array[flow_Array.length - 1].siteid;
                        storage.setItem('tid', JSON.stringify(selected_tid));
                        storage.setItem('siteid', JSON.stringify(selected_site));
                        changeurl("viewsitelist_pm_grouplist.html");
                    } else {
                        // subflow submit button
                        flow_Array.pop();
                        var id = flow_Array[0].id;
                        var flow_id = flow_Array[0].wayflow;
                        var flow_name = flow_Array[0].wayflow_name;
                        var list_json = flow_Array[0].list_json;
                        storage.setItem('udf_id', JSON.stringify(id));
                        storage.setItem('wayflow', JSON.stringify(flow_id));
                        storage.setItem('wayflow_name', JSON.stringify(flow_name));
                        storage.setItem('list_json', JSON.stringify(list_json));

                        // new change
                        var data_count = flow_Array[0].list_json;
                        storage.setItem('list_json_Array', JSON.stringify(data_count));

                        storage.setItem('flow_Array', JSON.stringify(flow_Array));

                        var selected_tid = flow_Array[0].tid;
                        var selected_site = flow_Array[0].siteid;
                        storage.setItem('tid', JSON.stringify(selected_tid));
                        storage.setItem('siteid', JSON.stringify(selected_site));
                        changeurl("viewsitelist_pm_grouplist.html");
                    }
                    // /////////////////////////////////////

                } else {
                    // group
                    var selected_tid = flow_Array[flow_Array.length - 2].tid;
                    var selected_site = flow_Array[flow_Array.length - 2].siteid;
                    storage.setItem('tid', JSON.stringify(selected_tid));
                    storage.setItem('siteid', JSON.stringify(selected_site));
                    changeurl("viewsitelist_pm_grouplist.html");
                }
                // ////----------------/////
            }

        }
    } catch (e) {
        alert1(e + '_onsuccess_get_shortest_path()');
    }
}

// reject checksheet on reject button
function reject_current_checksheet() {
    try {
        // alert1("Updating task status on reject...");
        localStorage.setItem('online_counter', 'false');                // to update module counter after task is uploaded
        var t_id = JSON.parse(storage.getItem('tid'));
        var d = new Date();
        var curr_date = getFormattedDate(d);
        var start_status = JSON.parse(storage.getItem('start_status'));
        var reject_status = JSON.parse(storage.getItem('reject_status'));

        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var match_temp_id = list_data[0].match_temp_id;
        if (match_temp_id == "" || match_temp_id == null || match_temp_id == undefined) {
            match_temp_id = "";
        }

        var query = "UPDATE task_master SET survey_date='" + curr_date + "' ,step='0', status = '" + reject_status + "', match_temp_id = '" + match_temp_id + "' where tid = '"
            + t_id + "'";

        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            q: "2", // call upload task_master_history
            tid: t_id,
            old_status: start_status
        });
        cordova.exec(onsuccess_reject_current_checksheet, onfail_reject_current_checksheet, 'SqlitePlugin', 'insertValuse', q_jsonobj);
    } catch (e) {
        alert1(e + '_reject_current_checksheet()');
        loading_hide();
    }
}

function onsuccess_reject_current_checksheet(e) {
    //alert1("Flow has been completed due to checksheet rejection!");
    var data_json = JSON.parse(storage.getItem('list_json'));
    var list_data = JSON.parse(data_json);
    var submit_msg = list_data[0].submit_msg;
    if (submit_msg == '' || submit_msg == null || submit_msg == undefined) { }
    else {
        var checklist = submit_msg[0].checksheet_msg;
        var check_type = JSON.parse(storage.getItem('check_type'));
        for (f = 0; f < checklist.length; f++) {
            if (check_type == checklist[f].id) {
                var flow_msg = checklist[f].r_msg;  // checksheet rejection msg
                if (flow_msg == '' || flow_msg == null || flow_msg == undefined) { }
                else {
                    alert1(flow_msg);
                }
                break;
            }
        }
    }

    // changeurl("selection_survey.html");
    // ///////---sub task---///////
    var flow_Array = JSON.parse(storage.getItem('flow_Array'));
    if (flow_Array.length == 1) {
        changeurl("selection_survey.html");
    } else {
        flow_Array.pop();
        var id = flow_Array[0].id;
        var flow_id = flow_Array[0].wayflow;
        var flow_name = flow_Array[0].wayflow_name;
        var list_json = flow_Array[0].list_json;
        storage.setItem('udf_id', JSON.stringify(id));
        storage.setItem('wayflow', JSON.stringify(flow_id));
        storage.setItem('wayflow_name', JSON.stringify(flow_name));
        storage.setItem('list_json', JSON.stringify(list_json));

        // new change
        var data_count = flow_Array[0].list_json;
        storage.setItem('list_json_Array', JSON.stringify(data_count));

        storage.setItem('flow_Array', JSON.stringify(flow_Array));
        changeurl("selection_survey.html");
    }
    // ////----------------/////
}

function onfail_reject_current_checksheet(e) {
    alert1(e + '_onfail_reject_current_checksheet()');
}

function onfail_get_shortest_path(e) {
    alert1(e + '_onfail_get_shortest_path()');
    loading_hide();
}

function onfail_check_all_step_status_PV(e) {
    alert1("Please complete all the steps before submit !");
    loading_hide();
}

function onfail_update_task_status_on_pm_checksheet_submit(e) {
    alert1(e + "_onfail_update_task_status_on_pm_checksheet_submit()");
    loading_hide();
}

function onfail_save_global_variables_PV(e) {
    alert1(e + '_onfail_save_global_variables_PV()');
    loading_hide();
}


// auto stop trip on task submit
function check_n_auto_stop_trip_on_submit() {
    myApp.showPreloader('Finalizing Trip...');
    setTimeout(function () {
        start_stop_trip(1);
    }, 1000);


    //---commented coz of end trip submission issue in TCTS(tata.ckdriver) [20042020]
    //var t_id = JSON.parse(storage.getItem('tid'));
    //var trip_tid = localStorage.getItem('trip_tid');
    //if (trip_tid == t_id || trip_tid == '' || trip_tid == null || trip_tid == undefined) {
    //    myApp.showPreloader('Finalizing Trip...');
    //    start_stop_trip(1);
    //}
    //else {
    //    alert1("Trip is running on another task. Please complete it first !");
    //    changeurl("selection_survey.html");
    //}
}

