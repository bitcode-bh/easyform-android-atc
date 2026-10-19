
var curr_all_data_20_Array = [];
var GT_17_dep_array = [];


// get blank step template
var step_template = [];
function read_blank_checksheet_group() {
    try {

        jsonObj_old = [];
        collapse_Json = []; // type23 inner data array
        collapse_id_Array = []; // type23 ids
        Type20_AutoFill_DDL_Array = []; // type20 autofill dropdown
        Type20_AutoBind_Onchange_Array = []; // autofill by parent

        //step_Array = [2];


        //alert1(JSON.stringify(step_Array));
        var step = step_Array[step_Array.length - 1];
        var selected_check_type = JSON.parse(storage.getItem('check_type'));

        var query = "select subcategory, checksheetid, step, data, buttons from checksheet where checksheetid = '" + selected_check_type + "' and step = '" + step + "'";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "1"
        });
        cordova.exec(onsuccess_get_blank_checksheet, onfail_get_blank_checksheet, 'SqlitePlugin', 'showValues', q_jsonobj);
    } catch (e) {
        alert1(e + '_read_blank_checksheet_group()');
        loading_hide();
    }
}

function onsuccess_get_blank_checksheet(e) {
    try {
        var myArray = JSON.parse(e);
        if (myArray.length > 0) {

            step_template = myArray;
            check_survey_entry_next_read_group();

        } else {
            alert1("checksheet data not found in device!");
        }
    } catch (e) {
        alert1(e + '_onsuccess_get_blank_checksheet()');
        loading_hide();
    }
}


var group_task_log_array = [];
function check_survey_entry_next_read_group() {
    try {

        var group_task_array = JSON.parse(localStorage.getItem("group_task_array"));

        $("#container_div").empty();
        $("#container_btn_div").empty();
        $("#collapsible_top").empty();
        $("#clps_popup_container_div").empty();

        var myArray = step_template;
        var heading = myArray[0].subcategory;
        var buttons = JSON.parse(myArray[0].buttons);


        var lbl_str = '<label style="font-size: 16px; font-weight:bold; font-family: calibri; text-align:center; display:block; color:#337ab7">' + heading + ' (Battery Bank: ' + group_task_array.length + ')</label>';
        $("#container_div").append(lbl_str);

        group_task_log_array = [];

        for (gt = 0; gt < group_task_array.length; gt++) {
            var target_div = "cd_" + group_task_array[gt] + "";

            var newdiv = '';
            if (gt != 0) {
                newdiv += '<hr class="theme_customer_li_border" style="10px 0px; border-top: 2px dashed">';
            }

            var param = "set_cd_div('" + target_div + "')";
            newdiv += '<div id=' + target_div + ' onclick=' + param + '></div>';
            $("#container_div").append(newdiv);

            group_task_log_array.push({
                server_task_id: group_task_array[gt],
                myArray: [],
                target_div: target_div,
                index: gt
            });

        }

        var newdiv = "";
        var btnSN_counter = 0;
        var btnUTNS_Counter = 0;
        var btnSE_Counter = 0;

        enable_back = 0; // disable back button

        var btnJsonObj = buttons;
        for (j = 0; j < btnJsonObj.length; j++) {

            // save current step and goto next step
            if (btnJsonObj[j].action == 'goto') {
                var btnName = btnJsonObj[j].name;
                var subaction = parseInt(btnJsonObj[j].subaction);
                var btn_color = btnJsonObj[j].color;
                if (btn_color == undefined) {
                    // btn_color = '#337ab7';
                    btn_color = color_btn;
                }
                var btn_class = "";
                if (btnJsonObj[j].class1 != undefined) {
                    var class_Array = btnJsonObj[j].class1;
                    btn_class = class_Array[0];
                    for (var c = 1; c < btnJsonObj[j].class1.length; c++) {
                        btn_class += ' ' + class_Array[c] + '';
                    }
                }

                var dis_style = '';
                if (btn_class == "" || btn_class == null || btn_class == undefined) {
                    btn_class = '';
                    dis_style = '';
                } else {
                    dis_style = 'display:none;';
                }

                var param = "goto_on_click_group('" + subaction + "', 'goto')";

                newdiv += '<div id="div_btnSN_' + btnSN_counter + '" class="right ' + btn_class + '"><a class="link ' + btn_class + '" onclick="' + param + '" style="' + dis_style + '">' + btnName + '</a></div>';
                btnSN_counter++;
            }

            // save current step and goto sitelist
            else if (btnJsonObj[j].action == 'savenexit') {
                var btnName = btnJsonObj[j].name;
                var subaction = parseInt(btnJsonObj[j].subaction);
                var btn_color = btnJsonObj[j].color;
                if (btn_color == undefined) {
                    btn_color = color_btn;
                }
                var btn_class = "";
                if (btnJsonObj[j].class1 != undefined) {
                    var class_Array = btnJsonObj[j].class1;
                    btn_class = class_Array[0];
                    for (var c = 1; c < btnJsonObj[j].class1.length; c++) {
                        btn_class += ' ' + class_Array[c] + '';
                    }
                }


                var dis_style = '';
                if (btn_class == "" || btn_class == null || btn_class == undefined) {
                    btn_class = '';
                    dis_style = '';
                } else {
                    dis_style = 'display:none;';
                }

                var param = "goto_on_click_group('" + subaction + "', 'savenexit')";
                newdiv += '<div id="div_btnSE_' + btnSE_Counter + '" class="right ' + btn_class + '"><a class="link ' + btn_class + '" onclick="' + param + '" style="' + dis_style + '">' + btnName + '</a></div>';
                btnSE_Counter++;
            }


            // Update task status and submit
            else if (btnJsonObj[j].action == 'updatetasknsubmit') {
                var btnName = btnJsonObj[j].name;
                var subaction = parseInt(btnJsonObj[j].subaction);
                var btn_color = btnJsonObj[j].color;
                if (btn_color == undefined) {
                    // btn_color = '#337ab7';
                    btn_color = color_btn;
                }
                var btn_class = "";
                if (btnJsonObj[j].class1 != undefined) {
                    var class_Array = btnJsonObj[j].class1;
                    btn_class = class_Array[0];
                    for (var c = 1; c < btnJsonObj[j].class1.length; c++) {
                        btn_class += ' ' + class_Array[c] + '';
                    }
                }

                var shortest_path = btnJsonObj[j].shortest_path;
                if (shortest_path == '' || shortest_path == null || shortest_path == undefined) {
                    var shortest_path = "";
                } else {
                    var shortest_path = encodeURIComponent(JSON.stringify(shortest_path));
                }

                var status = btnJsonObj[j].status;
                var dependency = btnJsonObj[j].dependency;
                var trip = btnJsonObj[j].trip;

                //var param = "updatetasknsubmit_on_click('" + subaction + "', '" + shortest_path + "','" + status + "', '" + dependency + "', '" + trip + "')";
                var param = "goto_on_click_group('" + subaction + "', 'updatetasknsubmit')";

                var dis_style = '';
                if (btn_class == "" || btn_class == null || btn_class == undefined) {
                    btn_class = '';
                    dis_style = '';
                } else {
                    dis_style = 'display:none;';
                }

                newdiv += '<div id="div_btnUTNS_' + btnUTNS_Counter + '" class="right ' + btn_class + '"><a class="link '
                    + btn_class + '" onclick="'
                    + param + '" style="' + dis_style + '" >' + btnName + '</a></div>';
                btnUTNS_Counter++;
            }

            // goto back step without saving current step
            else if (btnJsonObj[j].action == 'back') {
                $('#btn_back_step').show();
                enable_back = 1;
            }
        }
        $("#container_btn_div").append(newdiv);

        //var param_task = "validate_group_form();";
        //var footer_btn_str = '<div style="text-align:center; margin-top: 6px;"><button type="button" onclick="' + param_task + '" class="btn btn-primary btn-sm">Save & Next All Tasks</button></div>';
        //$("#container_btn_div").append(footer_btn_str);



        check_log_for_group_task(0);
    }
    catch (e) {
        alert1(e + '_check_survey_entry_next_read_group()');
        loading_hide();
    }
}

// check for existing log
function check_survey_entry_next_read_group_post(server_task_id, target_div, index) {
    try {
        var step = step_Array[step_Array.length - 1];
        var check_type = curr_survey_data["check_type"];

        var ms = 0;

        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var open_template_in_blue = list_data[0].open_template_in_blue;
        if (open_template_in_blue == "true") {

            var role_id = JSON.parse(storage.getItem('role_id'));
            var check_type = JSON.parse(storage.getItem('check_type'));
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
                    var ms = new_checksheet_list[i].ms;
                    break;
                }
            }

            if (ms == "" || ms == null || ms == undefined) {
                ms = 0;
            }
        }

        var selected_server_task_id = JSON.parse(storage.getItem('server_task_id'));

        var param_obj = [];
        param_obj.push({
            'servertaskid': server_task_id,
            'stepid': step,
            'check_type': check_type,
            'check_parent': "false",
            'ms': ms
        });

        loading();
        var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_GetBackSurvey', JSON.stringify(param_obj), function (e) {
            var responseText = JSON.parse(e.responseText);
            var status = responseText[0].status;
            if (status == 1) {
                //alert1("Survey Found ! - Reading from file master table...");
                var myArray = JSON.parse(responseText[0].data);
                var heading = myArray[0].subcategory;
                var check_type = myArray[0].check_type;
                var step = myArray[0].stepid;
                var data = myArray[0].data;
                var buttons = myArray[0].buttons;

                for (i = 0; i < group_task_log_array.length; i++) {
                    var t_server_task_id = group_task_log_array[i].server_task_id;
                    if (server_task_id == t_server_task_id) {
                        group_task_log_array[i].myArray = myArray;
                        break;
                    }
                }

                check_log_for_group_task(index + 1);
            }
            else if (status == 2) {
                //alert1("Survey Not Found ! - checking server call... ");
                check_log_for_group_task(index + 1);
            }
            else {
                loading_hide();
                alert1(responseText[0].message);
            }
        }, onfail_group_task);
        getdata.callOtherDomain();

    } catch (e) {
        alert1(e + '_check_survey_entry_next_read_group_post()');
        loading_hide();
    }
}

// check and bind blank and filled forms (index of server task details)
function check_log_for_group_task(index) {
    var data_json = JSON.parse(storage.getItem('list_json'));
    var list_data = JSON.parse(data_json);
    var group_task_steps = list_data[0].group_task_steps;
    var step = step_Array[step_Array.length - 1];
    var check = group_task_steps.includes(step.toString());
    if (check == true) {
        // check log for 1st task only 

        if (index == 0) {
            var server_task_id = group_task_log_array[0].server_task_id;
            var target_div = group_task_log_array[0].target_div;
            check_survey_entry_next_read_group_post(server_task_id, target_div, index);
        }
        else {
            var server_task_id = group_task_log_array[0].server_task_id;
            var myArray = group_task_log_array[0].myArray;
            var target_div = group_task_log_array[0].target_div;
            var index = group_task_log_array[0].index;

            if (myArray.length == 0) {
                var myArray = step_template;
                var heading = myArray[0].subcategory;
                var check_type = myArray[0].checksheetid;
                var step = myArray[0].step;
                var data = JSON.parse(myArray[0].data); // Need to parse again because its inner json
                var buttons = JSON.parse(myArray[0].buttons);
                read_dynamic_checksheet_main(heading, check_type, step, data, buttons, 12, 0, target_div, index);
            }
            else {
                var heading = myArray[0].subcategory;
                var check_type = myArray[0].check_type;
                var step = myArray[0].stepid;
                var data = myArray[0].data;
                var buttons = myArray[0].buttons;
                read_dynamic_surveydata(heading, check_type, step, data, buttons, 12, 0, target_div, index);
            }
        }

    }
    else {
        // check log for all task 
        if (index <= (group_task_log_array.length - 1)) {
            var server_task_id = group_task_log_array[index].server_task_id;
            var target_div = group_task_log_array[index].target_div;
            check_survey_entry_next_read_group_post(server_task_id, target_div, index);
        }
        else {
            // logs collected for group tasks

            for (gt = 0; gt < group_task_log_array.length; gt++) {
                var server_task_id = group_task_log_array[gt].server_task_id;
                var myArray = group_task_log_array[gt].myArray;
                var target_div = group_task_log_array[gt].target_div;
                var index = group_task_log_array[gt].index;

                GT_17_dep_array[target_div] = false;

                if (myArray.length == 0) {
                    var myArray = step_template;
                    var heading = myArray[0].subcategory;
                    var check_type = myArray[0].checksheetid;
                    var step = myArray[0].step;
                    var data = JSON.parse(myArray[0].data); // Need to parse again because its inner json
                    var buttons = JSON.parse(myArray[0].buttons);
                    read_dynamic_checksheet_main(heading, check_type, step, data, buttons, 12, 0, target_div, index);
                }
                else {
                    var heading = myArray[0].subcategory;
                    var check_type = myArray[0].check_type;
                    var step = myArray[0].stepid;
                    var data = myArray[0].data;
                    var buttons = myArray[0].buttons;
                    read_dynamic_surveydata(heading, check_type, step, data, buttons, 12, 0, target_div, index);
                }
            }
        }

    }


}

// group buttons binding
var group_task_data_array = [];

// Save & Next Button and Reject Button (Go to next step)
function goto_on_click_group(go_to_chk_no, action) {

    var group_task_array = JSON.parse(localStorage.getItem("group_task_array"));

    curr_btn_mode = action;    // "goto" or "updatetasknsubmit"
    storage.setItem('curr_btn_mode', JSON.stringify(action));

    group_task_data_array = [];

    var data_json = JSON.parse(storage.getItem('list_json'));
    var list_data = JSON.parse(data_json);
    var group_task_steps = list_data[0].group_task_steps;
    var step = step_Array[step_Array.length - 1];
    var check = group_task_steps.includes(step.toString());
    if (check == true) {
        // save log for 1st task only 
        var target_div = "cd_" + group_task_array[0] + "";
        validate_and_submit_surveydata_main(go_to_chk_no, 12, jsonObj_old, target_div, 0);

        var group_validation = 0;
        var validation = group_task_data_array[0].validation;
        if (validation > 0) {
            group_validation++;
        }
        else {
            // save 1st log for all the tasks
            for (gt = 1; gt < group_task_array.length; gt++) {
                var json = group_task_data_array[0].data;

                group_task_data_array.push({
                    server_task_id: group_task_array[gt],
                    data: json,
                    validation: 0
                });
            }

        }
    }
    else {
        // save log for all tasks 
        for (gt = 0; gt < group_task_array.length; gt++) {
            var target_div = "cd_" + group_task_array[gt] + "";
            validate_and_submit_surveydata_main(go_to_chk_no, 12, jsonObj_old, target_div, gt);
        }

        var group_validation = 0;
        for (gt = 0; gt < group_task_data_array.length; gt++) {
            var validation = group_task_data_array[gt].validation;
            if (validation > 0) {
                group_validation++;
                break;
            }
        }
    }

    if (action == "savenexit") {
        group_validation = 0;
    }

    if (group_validation == 0) {
        if (action == "updatetasknsubmit") {
            vibrate_device();
            var user_choice = confirm("Are you sure, you want to submit this Checksheet?");
        }
        else {
            var user_choice = true;
        }

        if (user_choice == true) {
            check_and_call_log();
        }
    }
}

function check_and_call_log() {
    try {
        if (group_task_data_array.length > 0) {
            Insert_Update_Question_Log_group();
        }
        else {
            if (curr_btn_mode == "goto") {
                // current step logs are saved and go to next step
                read_blank_checksheet_group();
            }
            else if (curr_btn_mode == "savenexit") {
                // current step logs are saved and redirect to checksheet or task listing
                redirect_after_group_status_update();
            }
            else {
                // current step logs are saved and redirect to checksheet or task listing
                redirect_after_group_status_update();
            }
        }
    }
    catch (e) {
        alert1(e + '_check_and_call_log()');
    }
}

// insert/update log
function Insert_Update_Question_Log_group() {
    try {
        var date_s = new Date();
        var date = date_s.getTime();
        var heading = curr_survey_data["heading"];
        var step = curr_survey_data["step"];
        var check_type = curr_survey_data["check_type"];
        var task_id = curr_survey_data["task_id"];

        var server_task_id = group_task_data_array[0].server_task_id;
        var data = group_task_data_array[0].data;

        var site_id = curr_survey_data["siteid"];

        var username = JSON.parse(storage.getItem('username'));
        var uniqcode = JSON.parse(storage.getItem('uniqcode'));
        var user_id = window.storage.getItem("user_id");
        var udf_id = window.storage.getItem("udf_id");

        var company_id = JSON.parse(storage.getItem('company_id'));
        var flow_id = storage.getItem('wayflow');
        var flow_name = storage.getItem('wayflow_name');
        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var match_temp_id = list_data[0].match_temp_id;
        if (match_temp_id == "" || match_temp_id == null || match_temp_id == undefined) {
            match_temp_id = "0";
        }

        var finaljsonObj = [];
        finaljsonObj.push({
            taskid: task_id,
            servertaskid: server_task_id,
            siteid: site_id,
            stepid: step,
            category: wayflow,
            imei: 0,
            User_Id: user_id,
            username: username,
            u_c: uniqcode,
            subcategory: heading,
            date: date,
            date_s: date_s,
            address: "",
            lat: 0,
            long1: 0,
            gps: 0, // 0 = off, 1 = on
            accuracy: 0,
            diff_time: 0,
            check_type: check_type,
            data: data,
            buttons: btnJsonObj,
            udf_id: udf_id,
            CompanyId: company_id,
            FlowId: flow_id,
            FlowName: flow_name,
            match_temp_id: match_temp_id
        });

        curr_survey_data["finaljsonObj"] = finaljsonObj;
        var fileData = JSON.stringify(finaljsonObj);
        //check_survey_entry();


        var param_obj = [];
        param_obj.push({
            'q_data': fileData,
            'utcmilliseconds': date,
            'timezone': "",
            'c_type': '1',
            'server_task_id': server_task_id,
            'btn_action': curr_btn_mode
        });

        loading();
        var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_InsertQuestionMaster_Log_EF_1_0_0_0', JSON.stringify(param_obj), function (e) {
            var myArray = JSON.parse(e.responseText);
            var status = myArray[0].status;
            if (status == 1) {
                if (curr_btn_mode == "goto" || curr_btn_mode == "savenexit") {
                    group_task_data_array.shift();
                    check_and_call_log();
                }
                else {
                    update_task_status_on_pm_checksheet_submit_group();
                }
            }
            else {
                var message = myArray[0].message;
                alert1(message);
                loading_hide();
            }
        }, onfail_Insert_Update_Question_Log_group);
        getdata.callOtherDomain();
    }
    catch (e) {
        alert1(e + '_Insert_Update_Question_Log_group');
    }
}


// update task
function update_task_status_on_pm_checksheet_submit_group() {
    try {
        var end_status = JSON.parse(storage.getItem('end_status'));
        var task_id = JSON.parse(storage.getItem('task_id'));

        var server_task_id = group_task_data_array[0].server_task_id;

        var checksheet_dependency = JSON.parse(storage.getItem('checksheet_dependency'));
        if (checksheet_dependency == null || checksheet_dependency == undefined || checksheet_dependency == "") {
            var checksheet_dependency = [];
        }

        if (step_Array == undefined || step_Array == "" || step_Array == null) {
            var step_Array = [];
        }

        var new_checksheet_list = JSON.parse(storage.getItem('new_checklist'));
        if (new_checksheet_list == null || new_checksheet_list == undefined || new_checksheet_list == "") {
            var new_checksheet_list = [];
        }

        var srnumber = storage.getItem('srnumber');
        if (srnumber == "" || srnumber == null || srnumber == undefined) {
            srnumber = '1';
        }

        var global_var_Array = [];
        global_var_Array.push({
            'checksheet_dependency': checksheet_dependency,
            'new_checklist': new_checksheet_list,
            'step_Array_to_read': step_Array,
            't_id': server_task_id,
            'task_id': task_id,
            'server_task_id': server_task_id,
            'srnumber': srnumber
        });

        var global_var_obj = JSON.stringify(global_var_Array);
        if (global_var_obj == '' || global_var_obj == null || global_var_obj == undefined) {
            alert1('Unsuccessfull submission because of blank Global Variable');
            loading_hide();
        }
        else {
            loading();
            var company_id = JSON.parse(storage.getItem('company_id'));
            var siteid = JSON.parse(storage.getItem('siteid'));
            var check_type = JSON.parse(storage.getItem('check_type'));
            var flow_id = JSON.parse(storage.getItem('wayflow'));
            var start_status = JSON.parse(storage.getItem('start_status'));
            last_updated_end_status = end_status;
            //var username = JSON.parse(storage.getItem('username'));
            //var uniqcode = JSON.parse(storage.getItem('uniqcode'));

            var now = new Date();
            var time = now.getTime();
            var offset = now.getTimezoneOffset();
            offset = offset * 60000;
            var utcmilliseconds = time - offset;
            var timezone = new Date().getTimezoneOffset();

            var param_obj = [];
            param_obj.push({
                'username': username,
                'height': 0,
                'tower': 0,
                'check_type': check_type,
                'u_c': uniqcode,
                'siteid': siteid,
                'servertaskid': server_task_id,
                'status': end_status,
                'old_status': start_status,
                'step': 1,
                'moduledef': "",
                'global_var': global_var_obj,
                'flow_id': flow_id,
                'company_id': company_id,
                'punch_flag': 0,
                'in_ms': 0,
                'out_ms': 0,
                'duration': 0,
                'utcmilliseconds': utcmilliseconds,
                'timezone': timezone
            });

            var getdata = new Webservicecall_REST(global_wcf_url + 'WCFTechnicianDataUpload', JSON.stringify(param_obj), function (e) {
                var res_text = e.responseText;
                var result = eval('(' + res_text + ')');
                var message = result[0].message;
                var status = result[0].status;
                if (status == 1) {
                    group_task_data_array.shift();
                    check_and_call_log();
                }
                else {
                    alert1(message);
                    loading_hide();
                }
            }, onfail_group_task);
            getdata.callOtherDomain();
        }
    }
    catch (e) {
        loading_hide();
        alert1(e + '_update_task_status_on_pm_checksheet_submit_group');
    }
}

function redirect_after_group_status_update() {
    try {

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

            var end_status = JSON.parse(storage.getItem('end_status'));
            if (end_status == "2") {
                var flow_msg = submit_msg[0].flow_msg[1];
                if (flow_msg == '' || flow_msg == null || flow_msg == undefined) { }
                else {
                    alert1(flow_msg);
                }
            }
        }

        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var subflow_listview = list_data[0].subflow_listview;
        if (subflow_listview == 'hybrid') {
            // new structure [subflow + checksheet] (sublow listing base on flow_master mapping)
            var getdata = new Webservicecall_REST(common_global_wcf_url + 'WCF_SaveGlobalVarAndStep_Port', JSON.stringify(param_obj), get_checklist_data_for_subtask_hybrid, onfail_save_global_variables_only);
            getdata.callOtherDomain();
        }
        else {
            var flow_Array = JSON.parse(storage.getItem('flow_Array'));
            var f_type = flow_Array[flow_Array.length - 1].type;
            if (f_type == "Flow" && flow_Array.length > 1) {
                //flow_Array.pop();
                //var id = flow_Array[0].id;
                //var flow_id = flow_Array[0].wayflow;
                //var flow_name = flow_Array[0].wayflow_name;
                //var list_json = flow_Array[0].list_json;
                //storage.setItem('wayflow', JSON.stringify(flow_id));
                //storage.setItem('wayflow_name', JSON.stringify(flow_name));
                //storage.setItem('udf_id', JSON.stringify(id));

                //var tab_index = flow_Array[0].tab_index;
                //storage.setItem('tab_index', JSON.stringify(tab_index));
                //list_json = JSON.parse(list_json);
                //var f_list_data = JSON.stringify(list_json[tab_index]);
                //storage.setItem('list_json', JSON.stringify("[" + f_list_data + "]"));

                //// new change
                //var data_count = flow_Array[0].list_json;
                //storage.setItem('list_json_Array', JSON.stringify(data_count));

                //storage.setItem('flow_Array', JSON.stringify(flow_Array));
                //storage.setItem('curr_btn_mode', JSON.stringify("back"));
                ////curr_btn_mode = "";

                ////var chek_type_main = JSON.parse(storage.getItem('check_type_task_main'));
                ////storage.setItem('check_type_task', JSON.stringify(chek_type_main));

                //get_list_of_pm_subflow();

                changeurl("selection_survey.html");                         //changes for group task subflow center btn submit
            }
            else {
                get_list_of_pm_checksheets();
            }
        }
    }
    catch (e) {
        loading_hide();
        alert1(e + '_redirect_after_group_status_update');
    }
}

function onfail_save_global_variables_only(e) {
    loading_hide();
    alert1(e + '_onfail_save_global_variables_only()');
}

function onfail_Insert_Update_Question_Log_group(e) {
    loading_hide();
    alert1(e + '_onfail_Insert_Update_Question_Log_group()');
}

function onfail_group_task(e) {
    loading_hide();
    alert1(e)
}

var curr_target_div;
var curr_cd_div = '';
function set_cd_div(cd_div) {
    curr_cd_div = cd_div;
}