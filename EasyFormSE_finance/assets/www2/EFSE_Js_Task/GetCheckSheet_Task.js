
// default function on page load for initial check read
var is_attendance_task = 0;
var attendance_photo_url;

var glob_livelink_Array = [];
function data_to_read_task() {
    var query = "select * from download_live_url";
    var q_jsonobj = [];
    q_jsonobj.push({
        data: query,
        p: "1"
    });
    cordova.exec(function (e) {
        let myArray = JSON.parse(e);
        if (myArray.length > 0) {

            for (let l = 0; l < myArray.length; l++) {
                let live_url = myArray[l].live_url;
                let download_url_path = myArray[l].download_url_path;

                glob_livelink_Array.push({
                    "live_url": live_url,
                    "download_url_path": download_url_path
                });
            }

            data_to_read_task_post();
        }
        else {
            data_to_read_task_post();
        }
    }, function (e) {
        // fail
        data_to_read_task_post();

    }, 'SqlitePlugin', 'showValues', q_jsonobj);
}
function data_to_read_task_post() {
    var query = "select username from Login_master";
    var q_jsonobj = [];
    q_jsonobj.push({
        data: query,
        p: "1"
    });

    cordova.exec(onsuccess_check_for_notification_task, onfail, 'SqlitePlugin', 'shared', q_jsonobj);
}

function onsuccess_check_for_notification_task(e) {
    try {
        var myArray = JSON.parse(e);
        var task_checksheet_id = myArray[0].task_checksheet_id;
        //var task_checksheet_id = 76909;
        if (task_checksheet_id == '' || task_checksheet_id == null || task_checksheet_id == undefined) {
            // attendance notification not exist
            data_to_read_task_Post();
        } else {
            // attendance notification exist
            is_attendance_task = 1;
            var flow_id = myArray[0].flow_id;
            var flow_name = myArray[0].flow_name;
            attendance_photo_url = myArray[0].photo_url;

            localStorage.setItem('checksheetid', task_checksheet_id);
            storage.setItem('check_type_task', task_checksheet_id);
            storage.setItem('wayflow_name', JSON.stringify(flow_name));
            localStorage.setItem('task_Dependency', '');
            get_blank_task_form();
        }
    } catch (e) {
        alert1(e + '_onsuccess_check_for_notification_task()');
        loading_hide();
    }
}

function data_to_read_task_Post() {
    try {
        var crash_status = JSON.parse(storage.getItem('crash_status'));
        if (crash_status == 6 || crash_status == 7) {
            var cam_crash_data = JSON.parse(storage.getItem('cam_crash_data'));
            var heading = cam_crash_data[0].heading;
            var check_type = cam_crash_data[0].check_type;
            var step = cam_crash_data[0].step;
            var data = cam_crash_data[0].data;
            var buttons = cam_crash_data[0].buttons;
            read_dynamic_surveydata(heading, check_type, step, data, buttons, 6, 0);
        }
        else {
            var data_json = JSON.parse(storage.getItem('list_json'));
            var list_data = JSON.parse(data_json);
            var redirect = list_data[0].redirect;
            var is_new_cust_click = localStorage.getItem("is_new_customer_click");
            if (redirect == 'customer' && is_new_cust_click == "true") {
                //if (redirect == 'customer') {
                if (is_new_cust_click == "true") {
                    redirect_to_customer_form();
                }
                else {
                    get_edit_customer_checksheet();
                }
            }
            else {
                var task_mode = localStorage.getItem('task_mode');
                if (task_mode == "edit") {
                    get_filled_task_form();
                }
                else {
                    get_blank_task_form();
                }
            }
        }
    } catch (e) {
        alert1(e + '_data_to_read_task_Post()');
        loading_hide();
    }
}


function get_blank_task_form() {
    // alert1("Reading from checksheet table...");
    var selected_check_type = JSON.parse(storage.getItem('check_type_task'));
    var query = 'select subcategory, checksheetid, step, data, buttons from checksheet where checksheetid = ' + selected_check_type + '';
    // alert1(query);
    var q_jsonobj = [];
    q_jsonobj.push({
        data: query,
        p: "1" // 1 for selecting values from table in json
    });
    cordova.exec(onsuccess_data_to_read_task, onfail_data_to_read_task, 'SqlitePlugin', 'showValues', q_jsonobj);
}

// successfull checksheet read from server
function onsuccess_data_to_read_task(e) {
    try {

        var company_id = JSON.parse(storage.getItem('company_id'));
        var user_id = JSON.parse(storage.getItem('user_id'));
        var user_name = JSON.parse(storage.getItem('user_name'));
        var module_id = JSON.parse(window.storage.getItem('wayflow'));
        var module_name = JSON.parse(window.storage.getItem('wayflow_name'));
        var role_id = JSON.parse(storage.getItem('role_id'));
        var role_name = JSON.parse(storage.getItem('role_name'));
        var circle_id = JSON.parse(storage.getItem('circle_id'));
        var circle_name = JSON.parse(storage.getItem('circle_name'));

        curr_all_data_20["company_id"] = company_id;
        curr_all_data_20["user_id"] = user_id;
        curr_all_data_20["user_name"] = user_name;
        curr_all_data_20["module_id"] = module_id;
        curr_all_data_20["module_name"] = module_name;
        curr_all_data_20["role_id"] = role_id;
        curr_all_data_20["role_name"] = role_name;
        curr_all_data_20["circle_id"] = circle_id;
        curr_all_data_20["circle_name"] = circle_name;
        storage.setItem('c_is_disabled', JSON.stringify('0'));

        let task_create_popup = $('.popup-new-task-create.modal-in:visible');
        if (task_create_popup.length > 0) { }
        else {
            storage.setItem('server_task_id', JSON.stringify(''));

            // blank system variables before main task create 27072021
            var flow_Array = JSON.parse(storage.getItem('flow_Array'));
            if (flow_Array.length == 1) {
                storage.setItem('type20_columndata', JSON.stringify(''));
            }
        }

        var myArray = JSON.parse(e);
        if (myArray.length > 0) {
            $('#btn_create_task').prop("disabled", false);
            var heading = myArray[0].subcategory;
            var check_type = myArray[0].checksheetid;
            var step = myArray[0].step;
            var data = itemObj._checkStrObj(myArray[0].data);  		// check_item
            var buttons = itemObj._checkStrObj(myArray[0].buttons);  		// check_item

            read_dynamic_checksheet(heading, check_type, step, data, buttons, 6, 0);
        }
        else {
            get_task_checksheet_from_server();
        }
    } catch (e) {
        alert1(e + '_onsuccess_data_to_read_task()');
        $('#btn_create_task').prop("disabled", true);
        loading_hide();
    }
}

// get blank task checksheet
function get_task_checksheet_from_server() {
    try {
        loading();
        var selected_check_type = JSON.parse(storage.getItem('check_type_task'));
        var company_id = JSON.parse(storage.getItem('company_id'));
        var user_id = JSON.parse(storage.getItem('user_id'));
        var trip_id = localStorage.getItem("transport_trip_id");
        if (trip_id == "" || trip_id == null || trip_id == undefined) {
            trip_id = 0;
        }

        var param_obj = [];
        param_obj.push({
            'Company_Id': company_id,
            'User_Id': user_id,
            'checksheetid': selected_check_type,
            'step': 1,
            'trip_id': trip_id
        });

        var getdata = new Webservicecall_REST(common_global_wcf_url + 'WCF_GetCheckSheetData_Port', JSON.stringify(param_obj), function (e) {
            var responseText = JSON.parse(e.responseText);
            var status = responseText[0].status;
            if (status == 1) {
                var myArray = JSON.parse(responseText[0].data);
                if (myArray.length > 0) {
                    var heading = myArray[0].subcategory;
                    var check_type = myArray[0].checksheetid;
                    var step = myArray[0].step;
                    var blank_data = itemObj._checkStrObj(myArray[0].data);  		// check_item
                    var buttons = itemObj._checkStrObj(myArray[0].buttons);  		// check_item

                    read_dynamic_checksheet(heading, check_type, step, blank_data, buttons, 6, 0);
                }
            }
            else {
                var message = responseText[0].message;
                alert1("Server: " + message);
            }
        }, onfail);
        getdata.callOtherDomain();
    } catch (e) {
        alert1(e + '_get_task_checksheet_from_server()');
        loading_hide();
    }
}

function onfail_data_to_read_task(e) {
    alert1(e + '_onfail_data_to_read_task()');
    $('#btn_create_task').prop("disabled", true);
    loading_hide();
}

function get_filled_task_form() {
    try {
        var selected_tid = JSON.parse(storage.getItem('tid'));
        var query = "select c_id, f_data from f_master where c_type = 5 and tid = '" + selected_tid + "' ";

        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "1"
        });
        cordova.exec(onsuccess_get_filled_task_form, onfail_get_filled_task_form, 'SqlitePlugin', 'showValues', q_jsonobj);
    }
    catch (e) {
        alert1(e + '_get_filled_task_form');
        loading_hide();
    }
}

function onsuccess_get_filled_task_form(e) {
    try {
        var myArray = JSON.parse(e);
        if (myArray.length == 0) {
            // task json not found in f_master hence get it online

            let t_check_type = storage.getItem('check_type_task');
            localStorage.setItem('checksheetid', t_check_type);
            let selected_server_task_id = JSON.parse(storage.getItem("server_task_id"));

            loading();
            var param_obj = [];
            param_obj.push({
                'server_task_id': selected_server_task_id
            });

            var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_Get_Task_Data_For_Online', JSON.stringify(param_obj), function (e) {
                var myArray = JSON.parse(e.responseText);
                var status = myArray[0].status;
                if (status == 1) {
                    var data_new = JSON.parse(myArray[0].data);
                    if (data_new == "" || data_new == null || data_new == undefined) {
                        var data = myArray[0].task_json[0].task_json;
                        data = JSON.parse(data);
                    }
                    else {
                        var data = data_new[0].task_json[0].task_json;
                        data = JSON.parse(data);
                    }

                    let t_check_type = JSON.parse(storage.getItem('check_type_task'));
                    read_dynamic_surveydata('', t_check_type, '1', data, '', 6, 0);
                }
                else {
                    alert(myArray[0].message);
                    loading_hide();
                }
            }, onfail);
            getdata.callOtherDomain();

        }
        else {
            // task json found in f_master
            var check_type = myArray[0].c_id;
            var f_data = myArray[0].f_data;
            f_data = JSON.parse(f_data);
            var data = JSON.parse(f_data[0].data);

            localStorage.setItem('checksheetid', check_type);

            //storage.setItem('c_is_readchecksheet', JSON.stringify('1'));                      //commented coz when click on edit task in case on delete media it display error(user: er.tctsdriver) [28082020]
            read_dynamic_surveydata('', check_type, '1', data, '', 6, 0);
        }
    } catch (e) {
        alert1(e + '_onsuccess_get_filled_task_form()');
        loading_hide();
    }
}

function onfail_get_filled_task_form(e) {
    alert1(e + '_onfail_get_filled_task_form');
}

function update_online_task_servercall(t_status) {
    try {
        loading();
        var company_id = JSON.parse(storage.getItem('company_id'));
        var user_id = JSON.parse(storage.getItem('user_id'));
        var checksheet_id = JSON.parse(storage.getItem('check_type_task'));
        var Json_data = JSON.stringify(ap_json[0].data);
        var server_task_id = JSON.parse(storage.getItem('server_task_id'));

        var flow_Array = JSON.parse(storage.getItem('flow_Array'));
        if (flow_Array.length == 1) {
            var p_server_task_id = 0;
        } else {
            var p_server_task_id = JSON.parse(storage.getItem('p_server_task_id'));
        }

        let status = JSON.parse(storage.getItem('start_status'));

        var flow_Array = JSON.parse(storage.getItem('flow_Array'));
        if (flow_Array.length == 1) {
            var RequestFor = "Single";
            var p_server_task_id = 0;
            var p_match_temp_id = 0;
        }
        else {
            //for sub task
            var RequestFor = "Sub";
            var p_server_task_id = JSON.parse(storage.getItem('p_server_task_id'));
            var p_match_temp_id = localStorage.getItem('p_match_temp_id');
        }

        var moduleid = JSON.parse(storage.getItem('wayflow'));
        var module_name = JSON.parse(storage.getItem('wayflow_name'));

        // remove duplicate photo ids
        if (Photo_Id_Array.length > 0) {
            Photo_Id_Array = Photo_Id_Array.reduce(function (item, e1) {
                var matches = item.filter(function (e2) { return e1.photo_id == e2.photo_id });
                if (matches.length == 0) {
                    item.push(e1);
                }
                return item;
            }, []);
        }

        var MainData = [];
        MainData.push({
            'task_id': server_task_id,
            'checksheet_id': checksheet_id,
            'c_name': "",
            'module_name': module_name,
            'Company_id': company_id,
            'status': status,
            'moduleid': moduleid,
            'createby': user_id,
            'subcategory': "",
            'data': Json_data,
            'stepid': 0,
            'User_Id': user_id,
            'millisecond': 0,
            'createby': user_id,
            'UpdatedBy': user_id,
            'photo_temp': Photo_Id_Array,
            "Parent_Task_ID": p_server_task_id,
            "p_match_temp_id": p_match_temp_id
        });

        var SubData = [];
        SubData.push({
            'RequestFor': RequestFor,
            'WhereCondition': "",
            'TackAction': "Update"
        });

        var param_obj = [];
        param_obj.push({
            'MainData': MainData,
            'SubData': SubData,
            'call_type': 'web'
        });

        //alert1("param_obj:" + JSON.stringify(param_obj));

        loading();
        var getdata = new Webservicecall_REST(global_wcf_url + 'InsertUpdateDelete_MainAndSub_Task', JSON.stringify(param_obj), onssuccess_update_online_task_servercall, onfail_update_online_task_servercall);
        getdata.callOtherDomain();
    } catch (e) {
        alert1(e + '_update_online_task_servercall()');
    }
}

function onssuccess_update_online_task_servercall(e) {
    try {
        var Suc_Message = e.responseText;
        Suc_Message = eval('(' + Suc_Message + ')');
        var message = Suc_Message[0].message;
        var status = Suc_Message[0].status;
        if (status == '1') {
            //var task_mode = localStorage.getItem('task_mode');
            //if (task_mode == "edit_online") {
            //    alert1('Task has been updated successfully');
            //    changeurl("selection_survey.html");
            //}
            //else {

            let t_ser_task_id = JSON.parse(storage.getItem('server_task_id'));
            var query = "select tid from task_master where server_task_id = '" + t_ser_task_id + "'";

            var q_jsonobj = [];
            q_jsonobj.push({
                data: query,
                p: "1"
            });

            cordova.exec(function (e) {
                var myArray = e;
                if (myArray == "" || myArray == "[]" || myArray == null || myArray == undefined) {
                    // task not found in local
                    alert1('Task has been updated successfully');
                    changeurl("selection_survey.html");
                }
                else {

                    // check for task json locally
                    var myArray = JSON.parse(e)
                    let t_id = myArray[0].tid;
                    var query = "select fid from f_master where tid = '" + t_id + "' and c_type = '5'";
                    var q_jsonobj = [];
                    q_jsonobj.push({
                        data: query,
                        p: "0"
                    });
                    cordova.exec(function (e) {
                        // task json found locally
                        //edit task locally
                        update_online_offline_task();
                    }, function (e) {
                        // task json not found locally
                        alert1('Task has been updated successfully');
                        changeurl("selection_survey.html");
                    }, 'SqlitePlugin', 'showValues', q_jsonobj);

                }
            }, function (e) {
                // task not found in local
                update_online_offline_task();
            }, 'SqlitePlugin', 'showValues', q_jsonobj);



            //}
        }
        else {
            //var message = myArray[0].message;
            alert1(message);
            loading_hide();
        }
    }
    catch (e) {
        alert1(e + '_onssuccess_update_online_task_servercall');
        loading_hide();
    }
}



function onfail_update_online_task_servercall(e) {
    alert1(e + '_onfail_update_online_task_servercall');
    loading_hide();
}

function update_online_offline_task() {
    try {
        var jsonData = JSON.stringify(ap_json[0].data);
        var selected_tid = JSON.parse(storage.getItem('tid'));

        var finaljsonObj = [];
        finaljsonObj.push({
            taskid: "",
            servertaskid: "",
            siteid: "",
            stepid: "",
            category: "",
            imei: "",
            username: "",
            u_c: "",
            subcategory: "",
            date: "",
            date_s: "",
            address: "",
            lat: "",
            long1: "",
            gps: "", // 0 = off, 1 = on
            accuracy: "",
            diff_time: "",
            check_type: "",
            data: jsonData,
            buttons: ""
        });

        var fileData = JSON.stringify(finaljsonObj);
        var date_s = new Date();
        var time = date_s.getTime();

        var query = "UPDATE f_master SET millisecond='" + time + "', f_data = '" + fileData + "' where tid = '" + selected_tid + "' and c_type = 5";

        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            q: "0",
            tid: selected_tid
        });
        cordova.exec(onsuccess_update_online_offline_task, onfail_update_online_offline_task, 'SqlitePlugin', 'insertValuse', q_jsonobj);
    }
    catch (e) {
        alert1(e + '_update_online_offline_task');
    }
}

function onsuccess_update_online_offline_task(e) {
    var data_json = JSON.parse(storage.getItem('list_json'));
    var list_data = JSON.parse(data_json);
    var survey_mode = list_data[0].survey_mode;
    if (survey_mode == "online") {
        // don't update task_master locally in case of online task edit
        alert1('Task has been updated successfully');
        changeurl("selection_survey.html");
    }
    else {
        // update task_master locally in case of offline task edit
        update_task_master_edit_task();
    }
}

//when task is edited from task form
function update_task_master_edit_task() {
    var selected_tid = JSON.parse(storage.getItem('tid'));
    var start_status = JSON.parse(storage.getItem('start_status'));

    var date_s = new Date();
    var time = date_s.getTime();

    var data_json = JSON.parse(storage.getItem('list_json'));
    var list_data = JSON.parse(data_json);
    var match_temp_id = list_data[0].match_temp_id;
    if (match_temp_id == "" || match_temp_id == null || match_temp_id == undefined) {
        match_temp_id = "";
    }

    var query = "UPDATE task_master SET edit_flag = '1', millisecond='" + time + "', match_temp_id = '" + match_temp_id + "' where tid = '" + selected_tid + "'";

    var q_jsonobj = [];
    q_jsonobj.push({
        data: query,
        q: "2",         // call upload task_master_history
        tid: selected_tid,
        old_status: start_status
    });

    cordova.exec(onsuccess_update_task_master_edit_task, onfail_update_online_offline_task, 'SqlitePlugin', 'insertValuse', q_jsonobj);
}

function onsuccess_update_task_master_edit_task() {
    alert1('Task has been updated successfully');
    changeurl("selection_survey.html");
}

function onfail_update_online_offline_task(e) {
    alert1(e + '_onfail_update_online_offline_task');
    loading_hide();
}

function set_attendance_photo_in_task_form(check_type, attendance_photo_url) {
    $('#cbtn_0_' + check_type + '_15').attr("src", attendance_photo_url);
    $('#cbtn_0_' + check_type + '_15').removeAttr("onclick");

    /* set photo answer */
    var date_s = new Date();
    var time = date_s.getTime();
    var company_id = JSON.parse(storage.getItem('company_id'));
    var user_id = JSON.parse(storage.getItem('user_id'));
    var siteid = 0;

    var p_name = company_id + "_" + user_id + "_" + siteid + "_" + time;

    var type22_popup = $('.popup-type22:visible');
    if (type22_popup.length > 0) {
        if (type22_current_mode == 'edit') {
            // edit mode
            var t_row_index_no = row_index_no;
        }
        else {
            //  insert mode
            var last_index = $('#row_index_' + type22_new_id + '').val();
            last_index = parseInt(last_index);
            var t_row_index_no = last_index + 1;
        }
    }
    else {
        var t_row_index_no = 0;
    }
    p_name = p_name + '_' + t_row_index_no;

    var answer = [];
    answer.push(attendance_photo_url, p_name, '', '', '', '', "camera");

    for (a = 0; a < jsonObj_old.length; a++) {
        var que_id = jsonObj_old[a].que_id;
        if (que_id == 15) {
            let task_create_popup = $('.popup-new-task-create.modal-in:visible');
            if (task_create_popup.length > 0) {
                //new task create popup [FT-08052025]
                jsonObj_task_add[a].ans = answer;
            }
            else {
                jsonObj_old[a].ans = answer;
            }
            break;
        }
    }

}