
var last_submit_button_Array = [];
function Insert_Update_Question_Log() {
    try {
        var finaljsonObj = curr_survey_data["finaljsonObj"];
        var fileData = JSON.stringify(finaljsonObj);
        var date_s = new Date();
        var date = date_s.getTime();
        var servertaskid = JSON.parse(storage.getItem('server_task_id'));

        var param_obj = [];
        param_obj.push({
            'q_data': fileData,
            'utcmilliseconds': date,
            'timezone': "",
            'c_type': '1',
            'server_task_id': servertaskid,
            'btn_action': curr_btn_mode
        });

        loading();
        var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_InsertQuestionMaster_Log_EF_1_0_0_0', JSON.stringify(param_obj), function (e) {
            var myArray = JSON.parse(e.responseText);
            var status = myArray[0].status;
            if (status == 1) {

                if (comment_state_array.length == 0) {
                    // no comment statement found
                    check_survey_entry_post();
                }
                else {
                    // comment statement found
                    var arrayto_str = comment_state_array.join('</br>');
                    comment_state_array = [];
                    comment_state_array.push(arrayto_str);
                    check_n_autocall_send_comment();
                }
            }
            else {
                var message = myArray[0].message;
                alert1(message);
                loading_hide();
            }
        }, onfail);
        getdata.callOtherDomain();
    }
    catch (e) {
        alert1(e + '_Insert_Update_Question_Log();');
        loading_hide();
    }
}

// check and autocall comment 
function check_n_autocall_send_comment(t_server_task_id) {
    try {

        if (comment_state_array.length > 0) {
            var user_id = JSON.parse(storage.getItem('user_id'));
            var ms = new Date().getTime();
            var client_id = user_id + '_' + ms;

            var message = comment_state_array[0];

            if (t_server_task_id == '' || t_server_task_id == null || t_server_task_id == undefined) {
                var view_full_task_id = JSON.parse(storage.getItem('server_task_id'));
            }
            else {
                var view_full_task_id = t_server_task_id;
            }

            let company_id = JSON.parse(storage.getItem('company_id'));
            let subject = '';
            if (company_id == '1840') {
                // Send subject only for ticketing tool 09072024 PG
                let ticket_id = $('#div_AutoInc_0_85968_143_85965_117 .cls-read-only').text();
                let issue_title = $('#div_txt_0_85968_143_85965_20 .cls-read-only').text();

                subject = ticket_id + ' [#' + view_full_task_id + '] - ' + issue_title;
            }

            var param_obj = [];
            param_obj.push({
                "subject": subject,
                "message": message,
                "From": "",
                "email": [],
                "Cc": [],
                "Bcc": [],
                "contact": [],
                "server_task_id": view_full_task_id,
                "checksheet_id": 0,
                "step_id": 0,
                "que_id": 0,
                "client_request_id": client_id
            });

            loading();
            var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_Mobile_Notification_Master', JSON.stringify(param_obj), function (e) {
                var Suc_Message = e.responseText;
                Suc_Message = eval('(' + Suc_Message + ')');
                var message = Suc_Message[0].message;
                var status = Suc_Message[0].status;
                if (status == 1) {
                    comment_state_array.shift();
                    check_n_autocall_send_comment();
                }
                else {
                    alert1(message);
                    loading_hide();

                    if (is_approval) {
                        if (is_approval == '1') { }
                        else {
                            check_survey_entry_post();
                        }
                    }
                    else {
                        check_survey_entry_post();
                    }
                }
            }, onfail);
            getdata.callOtherDomain();

        }
        else {
            if (is_approval) {
                if (is_approval == '1') {
                    alert1("Your request to update your user details sent for approval for review.");
                    //myApp.closeModal('.popup-update-user');
                    //$('#iframe_update_profile').attr('src', '');
                    //window.parent.$('#iframe_update_profile').hide();
                    //window.parent.$('.popup-profile .page').show();

                    setTimeout(function () {
                        window.parent.location.reload();
                    }, 100);
                }
                else {
                    check_survey_entry_post();
                }
            }
            else {
                check_survey_entry_post();
            }
        }
    }
    catch (e) {
        alert(e + '_check_n_autocall_send_comment');
    }
}

function update_task_status_on_pm_checksheet_submit_online() {
    try {
        var end_status = JSON.parse(storage.getItem('end_status'));
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
            var new_checksheet_list = [];
        }

        var srnumber = '1';

        var global_var_Array = [];
        global_var_Array.push({
            'checksheet_dependency': checksheet_dependency,
            'new_checklist': new_checksheet_list,
            'step_Array_to_read': step_Array,
            't_id': curr_survey_data["server_task_id"],
            'task_id': "",
            'server_task_id': server_task_id,
            'srnumber': srnumber
        });

        var global_var_obj = JSON.stringify(global_var_Array);
        if (global_var_obj == '' || global_var_obj == null || global_var_obj == undefined) {
            alert('Unsuccessfull submission because of blank Global Variable');
            loading_hide();
        }
        else {
            var company_id = JSON.parse(storage.getItem('company_id'));
            var siteid = JSON.parse(storage.getItem('siteid'));
            var check_type = JSON.parse(storage.getItem('check_type'));
            if (check_type == "" || check_type == null || check_type == undefined) {
                //in case of subflow center submit
                check_type = 0;
            }

            var flow_id = JSON.parse(storage.getItem('wayflow'));
            var start_status = JSON.parse(storage.getItem('start_status'));

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

            loading();
            var getdata = new Webservicecall_REST(global_wcf_url + 'WCFTechnicianDataUpload', JSON.stringify(param_obj), function (e) {
                var res_text = e.responseText;
                var result = eval('(' + res_text + ')');
                var message = result[0].message;
                var status = result[0].status;
                if (status == 1) {

                    var locObj = new MkLocation();
                    locObj._addWaypoint("status_change");

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
                        update_task_status_on_pm_checksheet_submit_post();
                    }
                }
                else {
                    alert(message);
                    loading_hide();
                }
            }, onfail);
            getdata.callOtherDomain();
        }
    } catch (e) {
        alert(e + '_update_task_status_on_pm_checksheet_submit_online()');
        loading_hide();
    }
}


function onfail(e) {
    alert1(e + '_onfail()');
    loading_hide();
}