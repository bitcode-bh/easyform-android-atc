// validate text box value from email
function IsEmail(email) {
    var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    return regex.test(email);
}

// change range validator label on slide
function updateTextInput(val, range_id) {
    $("#" + range_id + "").html(val);
}

function convert_to_submit_date_F7(date, mode) {
    if (mode == 'date') {
        var dateFormat = localStorage.getItem("dateFormat");
        //var dateFormat = 'mm/dd/yyyy';
        if (dateFormat == '' || dateFormat == null || dateFormat == undefined) {
            dateFormat = 'mm/dd/yyyy';
        }

        if (dateFormat == 'mm/dd/yyyy') {
            // 31/12/2017
            var mm1 = date.substring(0, 2);
            var dd1 = date.substring(3, 5);
            var yyyy1 = date.substring(6, 10);
        }
        else if (dateFormat == 'dd/mm/yyyy' || dateFormat == 'dd-MMM-y') {
            // 12/31/2017
            var dd1 = date.substring(0, 2);
            var mm1 = date.substring(3, 5);
            var yyyy1 = date.substring(6, 10);
        }
        else if (dateFormat == 'yyyy-MM-dd') {
            // 2017/12/31
            var yyyy1 = date.substring(0, 4);
            var mm1 = date.substring(5, 7);
            var dd1 = date.substring(8, 10);
        }
        else if (dateFormat == 'DD, d MM yyyy') {
            // Sunday, 31 December, 2017
            date = new Date(date);
            var mm1 = date.getMonth() + 1;
            var dd1 = date.getDate();
            var yyyy1 = date.getFullYear();
        }
        else if (dateFormat == 'D, M d, yyyy') {
            // Sun, Dec 31, 2017
            date = new Date(date);
            var mm1 = date.getMonth() + 1;
            var dd1 = date.getDate();
            var yyyy1 = date.getFullYear();
        }
        else if (dateFormat == 'D, d M yyyy' || dateFormat == 'yyyy M d, DD' || dateFormat == 'dd-M-yyyy') {
            // Sun, 31 Dec 2017 || 01-Jan-2020
            date = new Date(date);
            var mm1 = date.getMonth() + 1;
            var dd1 = date.getDate();
            var yyyy1 = date.getFullYear();
        }
        else {
            // 31/12/2017
            var mm1 = date.substring(0, 2);
            var dd1 = date.substring(3, 5);
            var yyyy1 = date.substring(6, 10);
        }

        if (dd1 < 10) {
            dd1 = '0' + dd1;
        }
        if (mm1 < 10) {
            mm1 = '0' + mm1;
        }

        mm1 = mm1.toString();
        dd1 = dd1.toString();
        mm1 = mm1.replace("00", "0");
        dd1 = dd1.replace("00", "0");

        var submit_date = mm1 + '/' + dd1 + '/' + yyyy1;
        return submit_date;
    }
    else if (mode == 'datetime') {
        // datetime  //  08/31/2016 14:59

        var full_date = date;
        date = new Date(date);
        var mm1 = date.getMonth() + 1;
        var dd1 = date.getDate();
        var yyyy1 = date.getFullYear();

        var start = full_date.lastIndexOf(" ");
        var time = full_date.substr(start + 1, full_date.length);

        if (dd1 < 10) {
            dd1 = '0' + dd1;
        }
        if (mm1 < 10) {
            mm1 = '0' + mm1;
        }

        mm1 = mm1.toString();
        dd1 = dd1.toString();
        mm1 = mm1.replace("00", "0");
        dd1 = dd1.replace("00", "0");

        var submit_date = mm1 + '/' + dd1 + '/' + yyyy1 + ' ' + time;
        return submit_date;
    }
    else {
        // time
        return date;
    }

}

// pass date and return formated date by adding extra hour
function get_formated_DateTime(old_date, extra_days, extra_hours, fix_date, fix_time, boundary_type) {
    //var mm1 = old_date.substring(0, 2);
    //var dd1 = old_date.substring(3, 5);
    //var yyyy1 = old_date.substring(6, 10);
    //var hour = old_date.substring(11, 13);
    //var min = old_date.substring(14, 16);
    //var new_Date = mm1 + '/' + dd1 + '/' + yyyy1 + ' ' + hour + ':' + min;

    var new_Date = old_date;
    var ms = new Date(new_Date).getTime();

    var d1 = new Date(ms);
    d1.setHours(d1.getHours() + parseInt(extra_hours));

    if (boundary_type == 'start') {
        var d1_ms = d1.setDate(d1.getDate() - parseInt(extra_days));
    }
    else {
        var d1_ms = d1.setDate(d1.getDate() + parseInt(extra_days));
    }
    var new_d1 = new Date(d1_ms);
    var dd1 = new_d1.getDate();
    var mm1 = new_d1.getMonth() + 1; // January is 0!
    var hour = new_d1.getHours()
    var min = new_d1.getMinutes();
    var yyyy1 = new_d1.getFullYear();

    if (dd1 < 10) {
        dd1 = '0' + dd1;
    }
    if (mm1 < 10) {
        mm1 = '0' + mm1;
    }
    if (hour < 10) {
        hour = '0' + hour;
    }
    if (min < 10) {
        min = '0' + min;
    }

    if (fix_date == '') {
        var date_str = mm1 + '/' + dd1 + '/' + yyyy1;
    } else {
        var date_str = fix_date;
    }

    if (fix_time == '') {
        var time_str = hour + ':' + min;
    } else {
        var time_str = fix_time;
    }

    // new logic 16032020 (solution for the issue after companywise date format change)
    date_str = convert_datetime_by_format(date_str, 'date');
    time_str = convert_datetime_by_format(time_str, 'time');

    return [date_str, time_str]
}

function focus_element_on_click(element) {
    try {
        var div_top = $(element).parents('.page-content').scrollTop();
        var ele_top = $(element).offset().top;
        $(element).parents('.page-content').animate({
            scrollTop: ele_top + div_top - 90
        }, 10);
    } catch (e) {
        alert1(e + '_focus_element_on_click()');
    }
}

function autoscroll_form_on_submit(ele_div_id) {
    try {
        var div_top = $(ele_div_id).parents('.page-content').scrollTop();
        var ele_top = $(ele_div_id).offset().top;
        $(ele_div_id).parents('.page-content').animate({
            scrollTop: ele_top + div_top - 90
        }, 10);
    } catch (e) {
        alert1(e + '_autoscroll_form_on_submit()');
    }
}

function validate_and_submit_surveydata(go_to_chk_no, form_flag, data) {
    loading();
    if (curr_btn_mode == 'savenexit') {
        // don't validate form on save and exit button click (27052019 - stcs)
        validate_and_submit_surveydata_main(go_to_chk_no, form_flag, data);
    }
    else {
        if (curr_btn_mode != "calculate") {
            $("#container_btn_div").find('a').css({ 'cursor': "default", 'pointer-events': 'none' });
        }
        if (form_flag == 6) {
            $("#container_btn_div").find('a').prop('disabled', true);
        }
        check_calculator_button_clicked(go_to_chk_no, form_flag, data);
    }
}

var press_calc_Array = [];
var t_validate_Array = [];
var auto_click_calc_type = "normal_submit";

function check_calculator_button_clicked(go_to_chk_no, form_flag, data) {
    try {
        for (f = 0; f < Type17_Autofill_Textbox_Array.length; f++) {
            var fill_txtbox_class = Type17_Autofill_Textbox_Array[f];
            if (fill_txtbox_class == '' || fill_txtbox_class == null || fill_txtbox_class == undefined) { }
            else {
                var type17_class_id = $("." + fill_txtbox_class + "").attr("id");
                var type17_type_id = $("#" + type17_class_id + " :input").attr("id");
                $("#" + type17_type_id + "").val('');
            }
        }

        t_validate_Array = [];
        press_calc_Array = [];
        t_validate_Array.push({
            'go_to_chk_no': go_to_chk_no,
            'form_flag': form_flag,
            'data': data
        });

        if (form_flag == 1) {
            //invoice(add record) calc
            press_calc_Array = $("#div_inv_form").find("[id^='txt_Calc_']");
        }
        else {
            //normal calc
            press_calc_Array = $("[id^='txt_Calc_']");
        }
        call_calc_click(press_calc_Array);
    } catch (e) {
        alert1(e + '_check_calculator_button_clicked()');
    }
}

function call_calc_click(press_calc_Array) {
    try {
        if (press_calc_Array.length > 0) {
            var id = press_calc_Array[0].id;
            var has_is_hide = $("#" + id).parents('div[id^="div_Calc_"]').hasClass("st_hdn");
            var has_is_depen = $("#" + id).parents('div[id^="div_Calc_"]').hasClass("st_depen_hide");
            if (($("#" + id).is(':hidden') && has_is_hide == true && has_is_depen == true)
                || ($("#" + id).is(':hidden') && has_is_hide == false && has_is_depen == false)
                || ($("#" + id).is(':hidden') && has_is_hide == false && has_is_depen == true)) {  // new change
                // dep_hide+hidden/is_hide='false' element /
                press_calc_Array.splice(0, 1);
                call_calc_click(press_calc_Array);
            } else {
                var onclick_event = press_calc_Array[0].nextSibling.onclick();
                setTimeout(function () {
                    $("#container_btn_div").find('a').css({ 'cursor': "initial", 'pointer-events': 'initial' });
                    $("#container_btn_div").find('a').removeClass('active-state');
                }, 3000);
                // var onclick_event = press_calc_Array[0].nextSibling;
            }
        }
        else {
            if (auto_click_calc_type != "invoice_type20_autofill") {
                var go_to_chk_no = t_validate_Array[0].go_to_chk_no;
                var form_flag = t_validate_Array[0].form_flag;
                var data = t_validate_Array[0].data;
                validate_and_submit_surveydata_main(go_to_chk_no, form_flag, data);
            }
        }
    } catch (e) {
        alert1(e + '_call_calc_click()');
    }
}

var validation = 0, other_validation = 0;
var vali_ani_speed = 10;

var comment_state_array = [];
var validation_breach_count = 0;
var concat_statement_found = 0;
function validate_and_submit_surveydata_main(go_to_chk_no, form_flag, data, target_div, target_index) {
    try {
        auto_click_calc_type = "normal_submit";

        var json = [];
        var jsonObj = [];

        var type37_len = $("div[id^='div_subtask_']").length;
        if (type37_len > 0 && form_flag == 6) {
            //for edit type37 subtask [FT-22052025]
            var check_type = JSON.parse(storage.getItem('check_type_task'));
        }
        else {
            var check_type = JSON.parse(storage.getItem('check_type'));
        }

        var server_call_flag = JSON.parse(storage.getItem('server_call_flag'));
        var data_json = JSON.parse(storage.getItem('list_json'));
        if (data_json == '' || data_json == null || data_json == undefined) {
            var mand_border_color = '#FF0000';  //red
        }
        else {
            var list_data = JSON.parse(data_json);
            var mand_border_color = list_data[0].mandatory_border_color;
            if (mand_border_color == '' || mand_border_color == null || mand_border_color == undefined) {
                mand_border_color = '#FF0000';   //red
            }
        }

        if (form_flag == 0) {
            // normal form
            curr_clps_new_id = 0;
            data = jsonObj_old;
        } else if (form_flag == 1 || form_flag == 4) {// 1 type 22 4 edit row
            // collapsible step div type 22
            data = jsonObj_type22;
        } else if (form_flag == 2) {
            // collapsible step div type 23
            // data = jsonObj_type23;
        } else if (form_flag == 3) {
            // type 23 popup div container
            data = jsonObj_type23;
            check_type = collapse_Json[0].checksheet_id;
        } else if (form_flag == 5) {
            // camera
            curr_clps_new_id = 0;
            data = jsonObj_old;
            var cam_flag = localStorage.getItem('cam_flag');
            if (cam_flag == 'task') {
                var check_type_str = storage.getItem('check_type_task');
                check_type = JSON.parse(check_type_str);
            }
        } else if (form_flag == 6 || form_flag == 9 || form_flag == 14) {
            // create task  --------form_flag = 9 for custom report in vodafone(metal for TES)
            curr_clps_new_id = 0;
            concat_statement_found = 0;

            let task_create_popup = $('.popup-new-task-create.modal-in:visible');
            if (task_create_popup.length > 0) {
                data = jsonObj_task_add;
            }
            else {
                data = jsonObj_old;
            }

            var checksheet_type_filter = JSON.parse(storage.getItem('checksheet_type_filter'));
            if (checksheet_type_filter != '9') {
                //if its not online filter
                var check_type_str = storage.getItem('check_type_task');
                check_type = JSON.parse(check_type_str);
            }
        }
        else if (form_flag == 7) {
            // create customer
            data = jsonObj_cust_add;
            check_type = localStorage.getItem('check_type_customer');
        }
        else if (form_flag == 8) {
            // create user
            data = jsonObj_user_add;
            check_type = localStorage.getItem('check_type_user');
        }
        else if (form_flag == 13) {
            // bulk approval
            data = jsonObj_old;
            check_type = JSON.parse(localStorage.getItem('check_type'));
        }

        //alert1("data: " + JSON.stringify(data));

        jsonObj = data;

        var answer;
        validation = 0;
        other_validation = 0;

        var total_mand_count = 0;
        var total_non_mand_count = 0;
        var filled_mand_count = 0;
        var filled_non_mand_count = 0;
        var company_id = JSON.parse(storage.getItem('company_id'));
        var check_dup_ans_ary = [];
        comment_state_array = [];

        // var check_type = JSON.parse(storage.getItem('check_type'));

        for (var i = 0; i < jsonObj.length; i++) {
            //alert1("i: " + i + " data: " + JSON.stringify(jsonObj[i]));

            var prop_name = jsonObj[i].prop[0].name;
            var is_hide = jsonObj[i].prop[0].is_hide;
            var misc_Array = jsonObj[i].prop[0].misc_data;
            var control_type = jsonObj[i].type;
            var control_que_id = jsonObj[i].que_id;

            if (control_type == 10) {
                json.push({
                    type: control_type,
                    que_id: control_que_id,
                    ans: [""]
                });
            }
            else {
                if (target_div == "" || target_div == null || target_div == undefined) {
                    var new_id = curr_clps_new_id + '_' + check_type + '_' + jsonObj[i].que_id;
                }
                else {
                    var new_id = curr_clps_new_id + '_' + check_type + '_' + jsonObj[i].que_id + '_' + target_div;
                }

                var check_duplicate = jsonObj[i].check_duplicate;
                if (check_duplicate == "" || check_duplicate == null || check_duplicate == undefined) {
                    check_duplicate = "false";
                }

                var obj_data_Array = get_elem_data_by_object(jsonObj[i], new_id);
                var autofill_parent_id = obj_data_Array[0];

                if (form_flag != 5) {
                    var type = jsonObj[i].type;
                    if (type == 0 || type == 5 || type == 10 || type == 14 || type == 23 || type == 24 || type == 500) { }
                    else {
                        var valid = jsonObj[i].prop[0].valid;
                        var a = $("div[id*='" + new_id + "']");
                        var id = a[0].id;
                        if ($("#" + id + "").is(':hidden')) {
                            var hidden_check = 1;
                        }
                        else {
                            var hidden_check = 0;
                        }
                        if (hidden_check == 0) {
                            if (valid == 'true') {
                                total_mand_count++;
                            }
                            else {
                                total_non_mand_count++;
                            }
                        }
                    }
                }

                // Question Start
                if (jsonObj[i].type == 0) {
                    var answer = [""];
                }

                // Text Box
                else if (jsonObj[i].type == 1) {

                    // check for validation changed by dep_type = 0
                    var is_valid = $('#div_txt_' + new_id + '').attr('valid');
                    if (is_valid == 'false') {
                        var dep_res = "invalid";
                        $('#div_txt_' + new_id + '').css({ "border": "none" });
                    }
                    else {
                        var dep_res = "valid";
                    }

                    var answer = [];
                    // if element is hide then don't check validation
                    if ($('#div_txt_' + new_id + '').is(':hidden')) {
                        dep_res = "invalid";
                        if (is_hide == "true" || autofill_parent_id != "") {
                            if (glob_add_cust_from_search == "true") {
                                //----add new customer from search in type20 for ATC [atc.bb - 05052021]
                                //var txt_answer = $("#F7_type20_ddl_Search :input[type='search']").val();
                                var type20_text_cust_id = localStorage.getItem('type20_text_cust_id');
                                var txt_answer = $("#type20_txt_" + type20_text_cust_id + "").val();
                            }
                            else {
                                var txt_answer = $("#txt_" + new_id + "").val();
                            }

                            if (txt_answer == '' || txt_answer == null || txt_answer == undefined) { txt_answer = '' }
                            var value, textbox_type;
                            for (h = 0; h < misc_Array.length; h++) {
                                value = itemObj._checkStrObj(misc_Array[h].value);  		// check_item
                                textbox_type = value[0].box_type;
                            }

                            // Concat string of 2 elements answers [FT - 19042024]
                            var concat_statement = value[0].concat_statement;
                            if (concat_statement == '' || concat_statement == null || concat_statement == undefined) {
                                var txt_answer = $("#txt_" + new_id + "").val();
                            }
                            else {
                                $("#txt_" + new_id + "").val('');
                                //var txt_answer = replace_classwith_ans_comment_statement(concat_statement);
                                //if (txt_answer == '' || txt_answer == null || txt_answer == undefined) {
                                //    alert('Required value is blank used in concat statement string (' + jsonObj[i].prop[0].name + ')')
                                //}

                                // make control non mandetory as concate logic has been moved to server side hence removed from front 22052024 - mk
                                txt_answer = "";
                                dep_res = "invalid";
                                jsonObj[i].prop[0].valid = "false";
                                concat_statement_found++;
                            }

                            if (txt_answer == '' || txt_answer == null || txt_answer == undefined) {
                                txt_answer = '';
                            } else {
                                if (textbox_type == "email") {
                                    var email_check = IsEmail(txt_answer);
                                    if (email_check == false) {
                                        txt_answer = '';
                                    }
                                }
                            }

                            var regex = misc_Array[0].regex;
                            // var regex =
                            // ["^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$",
                            // "Invalid String"];
                            if (regex == '' || regex == null || regex == undefined || regex.length == 0) {
                                // no regular expression
                            } else {
                                var formula = regex[0];
                                var error_msg = regex[1];
                                var reg_exp_check = mk_check_RegExp(formula, txt_answer);
                                if (reg_exp_check == false) {
                                    if (txt_answer != "") {
                                        other_validation++;
                                    }

                                    txt_answer = '';
                                }
                            }

                            if (jsonObj[i].prop[0].valid == "true" && curr_btn_mode != "save") {
                                if (txt_answer == '' || txt_answer == null || txt_answer == undefined) {
                                    validation = show_hidden_cntrl_alert(prop_name, validation, autofill_parent_id);
                                }
                            }

                            txt_answer = txt_answer.trim();
                            answer.push(txt_answer);
                        } else {
                            answer.push("");
                        }
                        $('#div_txt_' + new_id + '').css({ "border": "none" });
                    }

                    if (dep_res == "valid") {
                        if (glob_add_cust_from_search == "true") {
                            //----add new customer from search in type20 for ATC [atc.bb - 05052021]
                            //var txt_answer = $("#F7_type20_ddl_Search :input[type='search']").val();
                            var type20_text_cust_id = localStorage.getItem('type20_text_cust_id');
                            var txt_answer = $("#type20_txt_" + type20_text_cust_id + "").val();
                        }
                        else {
                            var txt_answer = $("#txt_" + new_id + "").val();
                        }

                        if (txt_answer == '' || txt_answer == null || txt_answer == undefined) { txt_answer = '' }
                        var value, textbox_type;

                        var value = misc_Array[0].value;
                        if (value == '' || value == null || value == undefined) {
                            value = [];
                            textbox_type = "text";
                        }
                        else {
                            value = itemObj._checkStrObj(misc_Array[0].value);  // check_item
                            textbox_type = value[0].box_type;
                        }

                        //for (h = 0; h < misc_Array.length; h++) {
                        //    value = itemObj._checkStrObj(misc_Array[h].value);  		// check_item
                        //    textbox_type = value[0].box_type;
                        //}

                        //// Concat string of 2 elements answers [FT - 19042024]
                        var concat_statement = value[0].concat_statement;
                        if (concat_statement == '' || concat_statement == null || concat_statement == undefined) {

                            if (glob_add_cust_from_search == "true") {
                                // customer create from plus button -- ATC UAT NEW - mk - 07092025
                            }
                            else {
                                var txt_answer = $("#txt_" + new_id + "").val();
                            }
                        }
                        else {
                            $("#txt_" + new_id + "").val('');
                            //var txt_answer = replace_classwith_ans_comment_statement(concat_statement);
                            //if (txt_answer == '' || txt_answer == null || txt_answer == undefined) {
                            //    alert('Required value is blank used in concat statement string (' + jsonObj[i].prop[0].name + ')')
                            //}

                            // make control non mandetory as concate logic has been moved to server side hence removed from front 22052024 - mk
                            txt_answer = "";
                            jsonObj[i].prop[0].valid = "false";
                            concat_statement_found++;
                        }

                        if (txt_answer == '' || txt_answer == null || txt_answer == undefined) {
                            txt_answer = '';
                        } else {
                            if (textbox_type == "email") {
                                var email_check = IsEmail(txt_answer);
                                if (email_check == false) {
                                    txt_answer = '';
                                    var txt_str = $("#txt_" + new_id + "").val();
                                    if (txt_str != '' && txt_answer == '') {
                                        if (curr_btn_mode != "save") {
                                            alert1("Invalid email");
                                        }
                                    }
                                    mk_animate_border('#div_txt_' + new_id + '', 0, 500, mand_border_color);
                                    validation++;
                                }
                                else {
                                    $('#div_txt_' + new_id + '').css({ "border": "none" });
                                }
                            }
                            else if (textbox_type == "password") {
                                var check_flag = true;
                                if (jsonObj[i].ans == '' || jsonObj[i].ans == null || jsonObj[i].ans == undefined) {
                                    check_flag = true;
                                }
                                else {
                                    // old password found
                                    check_flag = false;
                                }

                                if (check_flag == true) {
                                    var hash = CryptoJS.SHA256(txt_answer);
                                    txt_answer = hash.toString(CryptoJS.enc.Base64);
                                }
                            }

                            // check regex if field is not blank
                            // var regex = ["^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$", "Invalid String"];
                            var check_flag = true;
                            var regex = misc_Array[0].regex;
                            if (regex == '' || regex == null || regex == undefined || regex.length == 0) {
                                // no regular expression

                                // bypass default regex from password field 23022022
                                if (textbox_type == "password") {
                                    check_flag = false;
                                }
                                else {
                                    // commented static regex - mk - 14072025
                                    check_flag = false;
                                    // regex = ["^[A-Za-z0-9 .:\/,?#&(){};@_÷*+-]+$", "Invalid String"];
                                }
                            }

                            if (textbox_type == "password") {
                                if (jsonObj[i].ans == '' || jsonObj[i].ans == null || jsonObj[i].ans == undefined) { }
                                else {
                                    // old password found
                                    check_flag = false;
                                }
                            }

                            if (check_flag == true) {
                                var formula = regex[0];
                                var error_msg = regex[1];
                                var reg_exp_check = mk_check_RegExp(formula, txt_answer);
                                if (reg_exp_check == false) {
                                    if (txt_answer != "") {
                                        other_validation++;
                                    }

                                    txt_answer = '';
                                    if (txt_str != '' && txt_answer == '') {
                                        if (error_msg == '' || error_msg == null || error_msg == undefined) {
                                            if (curr_btn_mode != "save") {
                                                alert1("Invalid input string for " + prop_name + "");
                                            }
                                        } else {
                                            if (curr_btn_mode != "save") {
                                                alert1(error_msg);
                                            }
                                        }
                                    }
                                    mk_animate_border('#div_txt_' + new_id + '', 0, 500, mand_border_color);
                                    validation++;
                                } else {
                                    $('#div_txt_' + new_id + '').css({ "border": "none" });
                                }
                            }
                        }

                        if (textbox_type == "password") { }
                        else {
                            txt_answer = txt_answer.trim();
                        }

                        answer.push(txt_answer);
                        if (jsonObj[i].prop[0].valid == "true" && curr_btn_mode != "save") {
                            if (answer == '' || answer == null || answer == undefined) {
                                mk_animate_border('#div_txt_' + new_id + '', 0, 500, mand_border_color);
                                if (validation < 1) {
                                    autoscroll_form_on_submit("#div_txt_" + new_id + "");
                                }
                                validation++;
                            } else {
                                filled_mand_count++;
                                $('#div_txt_' + new_id + '').css({ "border": "none" });
                            }
                        }
                        else {
                            if (answer == '' || answer == null || answer == undefined) { }
                            else { filled_non_mand_count++; }
                        }
                    }

                    if (textbox_type == "password") {
                        if (jsonObj[i].ans == '' || jsonObj[i].ans == null || jsonObj[i].ans == undefined) {
                            answer = answer;
                        }
                        else {
                            answer = jsonObj[i].ans;
                        }
                    }
                }

                // Radio Button
                else if (jsonObj[i].type == 2) {

                    // check for validation changed by dep_type = 0
                    var is_valid = $('#div_rdo_' + new_id + '').attr('valid');
                    if (is_valid == 'false') {
                        var dep_res = "invalid";
                        $('#div_rdo_' + new_id + '').css({ "border": "none" });
                    }
                    else {
                        var dep_res = "valid";
                    }

                    var answer = [];
                    // if element is hide then don't check validation
                    if ($('#div_rdo_' + new_id + '').is(':hidden')) {
                        dep_res = "invalid";
                        if (is_hide == "true" || autofill_parent_id != "") {
                            var rdo_answer = $('input[name=rdogroup_' + new_id + ']:checked').val();
                            if (rdo_answer == null) {
                                rdo_answer = '';
                            }
                            answer.push(rdo_answer);

                            if (jsonObj[i].prop[0].valid == "true" && curr_btn_mode != "save") {
                                if (answer == '' || answer == null || answer == undefined) {
                                    validation = show_hidden_cntrl_alert(prop_name, validation, autofill_parent_id);
                                }
                            }
                        } else {
                            answer.push("");
                        }

                        $('#div_rdo_' + new_id + '').css({
                            "border": "none"
                        });
                    }

                    if (dep_res == "valid") {
                        var rdo_answer = $('input[name=rdogroup_' + new_id + ']:checked').val();
                        if (rdo_answer == null) {
                            rdo_answer = '';
                        }
                        answer.push(rdo_answer);
                        if (jsonObj[i].prop[0].valid == "true" && curr_btn_mode != "save") {
                            if (answer == '' || answer == null || answer == undefined) {
                                mk_animate_border('#div_rdo_' + new_id + '', 0, 500, mand_border_color);
                                if (validation < 1) {
                                    autoscroll_form_on_submit("#div_rdo_" + new_id + "");
                                }
                                validation++;
                            } else {
                                filled_mand_count++;
                                $('#div_rdo_' + new_id + '').css({
                                    "border": "none"
                                });
                            }
                        }
                        else {
                            if (answer == '' || answer == null || answer == undefined) { }
                            else { filled_non_mand_count++; }
                        }
                    }
                }

                // Select Drop Down
                else if (jsonObj[i].type == 3) {

                    // check for validation changed by dep_type = 0
                    var is_valid = $('#div_ddl_' + new_id + '').attr('valid');
                    if (is_valid == 'false') {
                        var dep_res = "invalid";
                        $('#div_ddl_' + new_id + '').css({ "border": "none" });
                    }
                    else {
                        var dep_res = "valid";
                    }

                    var answer = [];
                    // if element is hide then don't check validation
                    if ($('#div_ddl_' + new_id + '').is(':hidden')) {
                        dep_res = "invalid";
                        if (is_hide == "true" || autofill_parent_id != "") {
                            var ddl_answer = $("#ddl_" + new_id + " :selected").text();
                            if (ddl_answer == '' || ddl_answer == null || ddl_answer == undefined || ddl_answer == '--- Select Values ---' || ddl_answer == 'Select Value' || ddl_answer == '--- Select ---') {
                                ddl_answer = "";
                            }
                            answer.push(ddl_answer);

                            if (jsonObj[i].prop[0].valid == "true" && curr_btn_mode != "save") {
                                if (ddl_answer == '' || ddl_answer == null || ddl_answer == undefined) {
                                    validation = show_hidden_cntrl_alert(prop_name, validation, autofill_parent_id);
                                }
                            }
                        } else {
                            answer.push("");
                        }
                        $('#div_ddl_' + new_id + '').css({
                            "border": "none"
                        });
                    }

                    if (dep_res == "valid") {
                        var ddl_answer = $("#ddl_" + new_id + " :selected").text();
                        if (ddl_answer == '' || ddl_answer == null || ddl_answer == undefined || ddl_answer == '--- Select Values ---' || ddl_answer == 'Select Value' || ddl_answer == '--- Select ---') {
                            ddl_answer = "";
                        }
                        //else {
                        //    var ccd_options = $("#ddl_" + new_id + "").attr('name');
                        //    if (ccd_options == '' || ccd_options == null || ccd_options == undefined) {
                        //        answer.push(ddl_answer);
                        //    }
                        //    else {
                        //        ccd_options = JSON.parse(decodeURIComponent(ccd_options));
                        //        jsonObj[i].value = ccd_options;
                        //    //    answer.push(ddl_answer, JSON.stringify(ccd_options));
                        //        answer.push(ddl_answer);
                        //    }
                        //}
                        answer.push(ddl_answer);

                        if (jsonObj[i].prop[0].valid == "true" && curr_btn_mode != "save") {
                            if (ddl_answer == '' || ddl_answer == null || ddl_answer == undefined || ddl_answer == '--- Select Values ---' || ddl_answer == 'Select Value' || ddl_answer == '--- Select ---') {
                                mk_animate_border('#div_ddl_' + new_id + '', 0, 500, mand_border_color);
                                if (validation < 1) {
                                    autoscroll_form_on_submit("#div_ddl_" + new_id + "");
                                }
                                validation++;
                            } else {
                                filled_mand_count++;
                                $('#div_ddl_' + new_id + '').css({
                                    "border": "none"
                                });
                            }
                        }
                        else {
                            if (answer == '' || answer == null || answer == undefined) { }
                            else { filled_non_mand_count++; }
                        }
                    }
                }

                // Numeric Text Box
                else if (jsonObj[i].type == 4) {

                    // check for validation changed by dep_type = 0
                    var is_valid = $('#div_txtno_' + new_id + '').attr('valid');
                    if (is_valid == 'false') {
                        var dep_res = "invalid";
                        $('#div_txtno_' + new_id + '').css({ "border": "none" });
                    }
                    else {
                        var dep_res = "valid";
                    }

                    var answer = [];
                    // if element is hide then don't check validation
                    if ($('#div_txtno_' + new_id + '').is(':hidden')) {
                        dep_res = "invalid";
                        if (is_hide == "true" || autofill_parent_id != "") {
                            var txtno_answer = $("#txtno_" + new_id + "").val();
                            if (txtno_answer == '' || txtno_answer == null || txtno_answer == undefined) {
                                txtno_answer = '';
                            }
                            else {
                                var regex = misc_Array[0].regex;
                                //var regex = ["^[0-9]{10}$", "Please enter 10 numbers only!"];
                                if (regex == '' || regex == null || regex == undefined || regex.length == 0) {
                                    // no regular expression
                                }
                                else {
                                    var formula = regex[0];
                                    var error_msg = regex[1];
                                    var txtno_str = $("#txtno_" + new_id + "").val();
                                    var reg_exp_check = mk_check_RegExp(formula, txtno_str);
                                    if (reg_exp_check == false) {
                                        if (txtno_answer != "") {
                                            other_validation++;
                                        }

                                        txtno_answer = '';
                                    }
                                }
                            }
                            answer.push(txtno_answer);

                            if (jsonObj[i].prop[0].valid == "true" && curr_btn_mode != "save") {
                                if (answer == '' || answer == null || answer == undefined) {
                                    validation = show_hidden_cntrl_alert(prop_name, validation, autofill_parent_id);
                                }
                            }
                        } else {
                            answer.push("");
                        }
                        $('#div_txtno_' + new_id + '').css({
                            "border": "none"
                        });
                    }

                    if (dep_res == "valid") {
                        var txtno_answer = $("#txtno_" + new_id + "").val();

                        //// new decimal point check
                        //var prop_name = jsonObj[i].prop[0].name;
                        //var misc_Array = jsonObj[i].prop[0].misc_data;
                        //var value = misc_Array[0].value;
                        //if (value == '' || value == null || value == undefined) { }
                        //else {
                        //    value = JSON.parse(misc_Array[0].value);
                        //    var decimal_point = value[0].decimal_point;
                        //    var dec_check = check_decimal_point(decimal_point, txtno_answer, prop_name);
                        //    if (dec_check == false) {
                        //        txtno_answer = '';
                        //    }
                        //}

                        // new regex logic
                        if (txtno_answer == '' || txtno_answer == null || txtno_answer == undefined) {
                            txtno_answer = '';
                        }
                        else {
                            var regex = misc_Array[0].regex;
                            //var regex = ["^[0-9]{10}$", "Invalid String"];
                            if (regex == '' || regex == null || regex == undefined || regex.length == 0) {
                                // no regular expression
                            }
                            else {
                                var formula = regex[0];
                                var error_msg = regex[1];
                                var txtno_str = $("#txtno_" + new_id + "").val();
                                var reg_exp_check = mk_check_RegExp(formula, txtno_str);
                                if (reg_exp_check == false) {
                                    other_validation++;

                                    txtno_answer = '';
                                    if (txtno_str != '' && txtno_answer == '') {
                                        if (error_msg == '' || error_msg == null || error_msg == undefined) {
                                            alert1("Invalid input string for " + prop_name + "!");
                                        }
                                        else {
                                            alert1(error_msg);
                                        }
                                    }
                                }
                            }
                        }
                        answer.push(txtno_answer);
                        if (jsonObj[i].prop[0].valid == "true" && curr_btn_mode != "save") {
                            if (answer == '' || answer == null || answer == undefined) {
                                mk_animate_border('#div_txtno_' + new_id + '', 0, 500, mand_border_color);
                                if (validation < 1) {
                                    autoscroll_form_on_submit("#div_txtno_" + new_id + "");
                                }
                                validation++;
                            } else {
                                filled_mand_count++;
                                $('#div_txtno_' + new_id + '').css({
                                    "border": "none"
                                });
                            }
                        }
                        else {
                            if (answer == '' || answer == null || answer == undefined) { }
                            else { filled_non_mand_count++; }
                        }
                    }
                }

                // Label
                else if (jsonObj[i].type == 5) {
                    var answer = jsonObj[i].ans;
                }

                // Check Box
                else if (jsonObj[i].type == 6) {

                    // check for validation changed by dep_type = 0
                    var is_valid = $('#div_chk_' + new_id + '').attr('valid');
                    if (is_valid == 'false') {
                        var dep_res = "invalid";
                        $('#div_chk_' + new_id + '').css({ "border": "none" });
                    }
                    else {
                        var dep_res = "valid";
                    }

                    var answer = [];
                    // if element is hide then don't check validation
                    if ($('#div_chk_' + new_id + '').is(':hidden')) {
                        dep_res = "invalid";
                        if (is_hide == "true" || autofill_parent_id != "") {
                            var checkbox = document.getElementsByName('chkgroup_' + new_id + '');
                            var checked_box = 0;
                            for (j = 0; j < checkbox.length; j++) {
                                if (checkbox[j].checked) {
                                    answer.push(checkbox[j].value);
                                    checked_box++;
                                }
                            }

                            if (checked_box == 0) {
                                answer.push("");
                            }

                            if (jsonObj[i].prop[0].valid == "true" && curr_btn_mode != "save") {
                                if (answer == '' || answer == null || answer == undefined || checked_box < 1) {
                                    validation = show_hidden_cntrl_alert(prop_name, validation, autofill_parent_id);
                                }
                            }
                        } else {
                            answer.push("");
                        }
                        $('#div_chk_' + new_id + '').css({
                            "border": "none"
                        });
                    }

                    if (dep_res == "valid") {
                        var checkbox = document.getElementsByName('chkgroup_' + new_id + '');
                        var checked_box = 0;
                        for (j = 0; j < checkbox.length; j++) {
                            if (checkbox[j].checked) {
                                answer.push(checkbox[j].value);
                                checked_box++;
                            }
                        }

                        if (checked_box == 0) {
                            answer.push("");
                        }

                        if (jsonObj[i].prop[0].valid == "true" && curr_btn_mode != "save") {
                            if (checked_box < 1) {
                                mk_animate_border('#div_chk_' + new_id + '', 0, 500, mand_border_color);
                                if (validation < 1) {
                                    autoscroll_form_on_submit("#div_chk_" + new_id + "");
                                }
                                validation++;
                                answer.push("");
                            } else {
                                filled_mand_count++;
                                $('#div_chk_' + new_id + '').css({
                                    "border": "none"
                                });
                            }
                        }
                        else {
                            if (answer == '' || answer == null || answer == undefined) { }
                            else { filled_non_mand_count++; }
                        }
                    }
                }

                // Camera Button
                else if (jsonObj[i].type == 7) {

                    // check for validation changed by dep_type = 0
                    var is_valid = $('#div_cbtn_' + new_id + '').attr('valid');
                    if (is_valid == 'false') {
                        var dep_res = "invalid";
                        $('#div_cbtn_' + new_id + '').css({ "border": "none" });
                    }
                    else {
                        var dep_res = "valid";
                    }

                    var answer = [];
                    var ans_src = $("#cbtn_" + new_id + "").attr('src');                        //for delete media scenario

                    // if element is hide then don't check validation
                    if ($('#div_cbtn_' + new_id + '').is(':hidden')) {
                        dep_res = "invalid";
                        if (is_hide == "true" || autofill_parent_id != "") {
                            if (form_flag == 12) {
                                //get img answer from hidden input field for group task [09072021]
                                var cam_answer = $('#hdn_cbtn_ans_' + new_id + '').val();
                                cam_answer = decodeURIComponent(cam_answer);
                                if (cam_answer == "" || cam_answer == null || cam_answer == undefined) {
                                    cam_answer = ""
                                }
                                else {
                                    cam_answer = JSON.parse(cam_answer);
                                }
                            }
                            else {
                                var cam_answer = jsonObj[i].ans;
                            }

                            if (cam_answer == "" || cam_answer == null || cam_answer == undefined || ans_src == "images/no_network1.png" || ans_src == "images/ajax-loader.gif" || ans_src == "images/no_image.png") {
                                answer.push("");
                            } else {
                                answer = cam_answer;
                            }

                            if (jsonObj[i].prop[0].valid == "true" && curr_btn_mode != "save") {
                                if (answer == '' || answer == null || answer == undefined) {
                                    validation = show_hidden_cntrl_alert(prop_name, validation, autofill_parent_id);
                                }
                            }
                        } else {
                            answer.push("");
                        }
                        $('#div_cbtn_' + new_id + '').css({
                            "border": "none"
                        });
                    }

                    if (dep_res == "valid") {
                        if (form_flag == 12) {
                            //get img answer from hidden input field for group task [09072021]
                            var cam_answer = $('#hdn_cbtn_ans_' + new_id + '').val();
                            cam_answer = decodeURIComponent(cam_answer);
                            if (cam_answer == "" || cam_answer == null || cam_answer == undefined) {
                                cam_answer = ""
                            }
                            else {
                                cam_answer = JSON.parse(cam_answer);
                            }
                        }
                        else {
                            var cam_answer = jsonObj[i].ans;

                            let autofill = $("#cbtn_" + new_id + "").attr('autofill');
                            if (autofill == "true") {
                                let photo_id_avail = jsonObj[i].ans[4];
                                if (photo_id_avail == "" || photo_id_avail == null || photo_id_avail == undefined) {
                                    cam_answer = "";
                                }
                            }

                        }

                        if (cam_answer == "" || cam_answer == null || cam_answer == undefined) {
                            answer.push("");
                        } else {
                            answer = cam_answer;
                        }

                        if (jsonObj[i].prop[0].valid == "true" && curr_btn_mode != "save") {
                            if (answer == '' || answer == null || answer == undefined || ans_src == "images/no_network1.png" || ans_src == "images/ajax-loader.gif" || ans_src == "images/no_image.png") {
                                mk_animate_border('#div_cbtn_' + new_id + '', 0, 500, mand_border_color);
                                if (validation < 1) {
                                    autoscroll_form_on_submit("#div_cbtn_" + new_id + "");
                                }
                                validation++;
                            } else {
                                filled_mand_count++;
                                $('#div_cbtn_' + new_id + '').css({
                                    "border": "none"
                                });
                            }
                        }
                        else {
                            if (answer == '' || answer == null || answer == undefined) { }
                            else { filled_non_mand_count++; }
                        }
                    }
                }

                // Calendar
                else if (jsonObj[i].type == 8) {
                    // check for validation changed by dep_type = 0
                    var is_valid = $('#div_cal_' + new_id + '').attr('valid');
                    if (is_valid == 'false') {
                        var dep_res = "invalid";
                        $('#div_cal_' + new_id + '').css({ "border": "none" });
                    }
                    else {
                        var dep_res = "valid";
                    }

                    var value = misc_Array[0].value;
                    if (value == '' || value === null || value == undefined) {
                        var mode = "date";
                        var main_class = "";
                        var ref_class = "";
                        var restrict_time = "";
                        var tat_type = "none";
                        var before_days = "0";
                        var gap_days = "0";
                        var before_hours = "0";
                        var gap_hours = "0";
                        var minDate = "";
                        var maxDate = "";
                        var minTime = "";
                        var maxTime = "";
                        var target_on = 'date';
                    } else {
                        value = itemObj._checkStrObj(value);  		// check_item
                        var mode = value[0].mode;
                        var main_class = value[0].main_class;
                        var ref_class = value[0].ref_class;
                        var restrict_time = value[0].restrict_time;
                        var tat_type = value[0].tat_type; // include, exclude,
                        // greater, less, none
                        var before_days = value[0].before_days;
                        var gap_days = value[0].gap_days;
                        var before_hours = value[0].before_hours;
                        var gap_hours = value[0].gap_hours;
                        var minDate = value[0].minDate;
                        var maxDate = value[0].maxDate;
                        var minTime = value[0].minTime;
                        var maxTime = value[0].maxTime;
                        var target_on = value[0].target_on; // datetime, date, time,
                        // split
                    }

                    // set end step end time
                    var default_value = misc_Array[0].default_value;
                    if (default_value == '' || default_value == null || default_value == undefined) {
                        var default_val = "";
                    } else {
                        var default_val = default_value[0];
                        if (default_val == 'end') {
                            var d1 = new Date();
                            var dd1 = d1.getDate();
                            var mm1 = d1.getMonth() + 1; // January is 0!
                            var hour = d1.getHours()
                            var min = d1.getMinutes();
                            var yyyy1 = d1.getFullYear();

                            if (dd1 < 10) { dd1 = '0' + dd1; }
                            if (mm1 < 10) { mm1 = '0' + mm1; }
                            if (hour < 10) { hour = '0' + hour; }
                            if (min < 10) { min = '0' + min; }

                            if (mode == 'datetime') {
                                default_val = mm1 + '/' + dd1 + '/' + yyyy1 + ' ' + hour + ':' + min;
                            } else if (mode == 'date') {
                                default_val = mm1 + '/' + dd1 + '/' + yyyy1;
                            } else {
                                default_val = hour + ':' + min;
                            }

                            default_val = convert_datetime_by_format(default_val, mode);
                            $("#cal_" + new_id + "").val(default_val);
                        }
                    }
                    // set end step time

                    var answer = [];
                    // if element is hide then don't check validation
                    if ($('#div_cal_' + new_id + '').is(':hidden')) {
                        dep_res = "invalid";
                        if (is_hide == "true" || autofill_parent_id != "") {
                            var cal_answer = $("#cal_" + new_id + "").val();
                            if (cal_answer == '' || cal_answer == null || cal_answer == undefined) {
                                cal_answer = '';
                            }
                            else {
                                var cal_answer = convert_fix_format_date_on_submit(cal_answer, mode);
                                if (mode == 'date' || mode == 'datetime') {
                                    var check_date = new Date(cal_answer);
                                    if (check_date == "Invalid Date") {
                                        $("#cal_" + new_id + "").val("");
                                        cal_answer = "";
                                    }
                                }
                            }
                            answer.push(cal_answer);

                            if (jsonObj[i].prop[0].valid == "true" && curr_btn_mode != "save") {
                                if (answer == '' || answer == null || answer == undefined || cal_answer == '') {
                                    validation = show_hidden_cntrl_alert(prop_name, validation, autofill_parent_id);
                                }
                            }
                        } else {
                            answer.push("");
                        }
                        $('#div_cal_' + new_id + '').css({
                            "border": "none"
                        });
                    }

                    if (dep_res == "valid") {
                        var cal_answer = $("#cal_" + new_id + "").val();
                        if (cal_answer != '') {
                            if (tat_type == 'none') {
                                // No TAT
                                if (mode == 'datetime' && target_on == 'millisecond') {
                                    var mm1 = cal_answer.substring(0, 2);
                                    var dd1 = cal_answer.substring(3, 5);
                                    var yyyy1 = cal_answer.substring(6, 10);
                                    var hour = cal_answer.substring(11, 13);
                                    var min = cal_answer.substring(14, 16);
                                    var curr_datetime_str = mm1 + '/' + dd1 + '/' + yyyy1 + ' ' + hour + ':' + min;
                                    var curr_datetime = new Date(curr_datetime_str).getTime();
                                    cal_answer = curr_datetime.toString();
                                }
                            } else {
                                if (ref_class == '' || ref_class == null || ref_class == undefined) {
                                    // if first calender is depend on today's hour or day
                                    var new_d1 = new Date();
                                    var dd1 = new_d1.getDate();
                                    var mm1 = new_d1.getMonth() + 1; // January is 0!
                                    var hour = new_d1.getHours()
                                    var min = new_d1.getMinutes();
                                    var yyyy1 = new_d1.getFullYear();

                                    if (dd1 < 10) { dd1 = '0' + dd1; }
                                    if (mm1 < 10) { mm1 = '0' + mm1; }
                                    if (hour < 10) { hour = '0' + hour; }
                                    if (min < 10) { min = '0' + min; }

                                    if (restrict_time == '' || restrict_time == null || restrict_time == undefined) {
                                        var old_date = mm1 + '/' + dd1 + '/' + yyyy1 + ' ' + hour + ':' + min;
                                    }
                                    else {
                                        var old_date = mm1 + '/' + dd1 + '/' + yyyy1 + ' ' + restrict_time;
                                    }

                                    var ref_prop_name = "";
                                }
                                else {
                                    // if second calender is depend on first cal's hour or day
                                    var old_d_id = $("." + ref_class + "").find('input').attr("id");
                                    var old_date = $("#" + old_d_id + "").val();
                                    if (mode == 'time') {
                                        var new_d1 = new Date();
                                        var dd1 = new_d1.getDate();
                                        var mm1 = new_d1.getMonth() + 1; // January is 0!
                                        var yyyy1 = new_d1.getFullYear();

                                        if (dd1 < 10) { dd1 = '0' + dd1; }
                                        if (mm1 < 10) { mm1 = '0' + mm1; }

                                        old_date = mm1 + '/' + dd1 + '/' + yyyy1 + ' ' + old_date;
                                    }
                                    else {
                                        old_date = convert_fix_format_date_on_submit(old_date, mode);
                                    }

                                    // get reference calendar value from dropdown (used is atc ZTS)
                                    if (old_date == '' || old_date == null || old_date == undefined) {
                                        var old_date = $("#" + old_d_id + " :selected").text();
                                    }

                                    var ref_prop_name = $("." + ref_class + "").next('div.swipeout-actions-right').find('.icon-cntrl-cmnt').attr("cntrl_que_name");
                                }



                                /// ----  date range start ---- 12102020 (ATC) ///
                                var range_found = 0;

                                // set start date
                                var range_start = value[0].range_start;
                                if (range_start == "" || range_start == null || range_start == undefined) {
                                    var old_date_start = old_date;
                                }
                                else {
                                    range_found++;

                                    if (range_start == 'today') {
                                        var old_date_start = new Date().toString();
                                        old_date_start = convert_datetime_by_format(old_date_start, mode);
                                    }
                                    else if (range_start == 'previous_day') {
                                        let currentDate = new Date();
                                        currentDate.setDate(currentDate.getDate() - 1);
                                        var old_date_start = new Date(currentDate).toString();
                                        old_date_start = convert_datetime_by_format(old_date_start, mode);
                                    }
                                    else {
                                        var value_type = range_start.substring(2, 1);
                                        var sub_get_value = range_start.substring(2, range_start.length - 2);
                                        if (value_type == "#") {
                                            var old_date_start = curr_all_data_20[sub_get_value];
                                        }
                                        else {
                                            var where_box_id = $("." + sub_get_value + " :input[type=text]").attr("id");
                                            var old_date_start = $("#" + where_box_id + "").val();
                                        }
                                    }
                                    old_date_start = convert_fix_format_date_on_submit(old_date_start, "datetime");
                                }

                                // set end date
                                var range_end = value[0].range_end;
                                if (range_end == '' || range_end == null || range_end == undefined) {
                                    var old_date_end = old_date;
                                }
                                else {
                                    range_found++;

                                    if (range_end == 'today') {
                                        var old_date_end = new Date().toString();
                                        old_date_end = convert_datetime_by_format(old_date_end, mode);
                                    }
                                    else if (range_end == 'previous_day') {
                                        let currentDate = new Date();
                                        currentDate.setDate(currentDate.getDate() - 1);
                                        var old_date_end = new Date(currentDate).toString();
                                        old_date_end = convert_datetime_by_format(old_date_end, mode);
                                    }
                                    else {
                                        var value_type = range_end.substring(2, 1);
                                        var sub_get_value = range_end.substring(2, range_end.length - 2);
                                        if (value_type == "#") {
                                            var old_date_end = curr_all_data_20[sub_get_value];
                                        }
                                        else {
                                            var where_box_id = $("." + sub_get_value + " :input[type=text]").attr("id");
                                            var old_date_end = $("#" + where_box_id + "").val();
                                        }
                                    }
                                    old_date_end = convert_fix_format_date_on_submit(old_date_end, "datetime");
                                }
                                /// ----  date range end---- ///





                                var start_datetime_Array = get_formated_DateTime(old_date_start, before_days, before_hours, minDate, minTime, 'start');
                                var start_datetime_str = start_datetime_Array[0] + ' ' + start_datetime_Array[1];
                                var start_date_str = start_datetime_Array[0];
                                var start_time = start_datetime_Array[1];
                                var end_datetime_Array = get_formated_DateTime(old_date_end, gap_days, gap_hours, maxDate, maxTime, 'end');
                                var end_datetime_str = end_datetime_Array[0] + ' ' + end_datetime_Array[1];
                                var end_date_str = end_datetime_Array[0];
                                var end_time = end_datetime_Array[1];

                                // new logic 16032020 (solution for the issue after companywise date format change)
                                var t_cal_answer = convert_fix_format_date_on_submit(cal_answer, mode);

                                // fix form MM/dd/yyyy
                                //var mm1 = t_cal_answer.substring(0, 2);
                                //var dd1 = t_cal_answer.substring(3, 5);
                                //var yyyy1 = t_cal_answer.substring(6, 10);

                                // fix form YYYY/MM/dd
                                var yyyy1 = t_cal_answer.substring(0, 4);
                                var mm1 = t_cal_answer.substring(5, 7);
                                var dd1 = t_cal_answer.substring(8, 10);


                                var hour = t_cal_answer.substring(11, 13);
                                var min = t_cal_answer.substring(14, 16);

                                if (mode == 'time') {
                                    var hour = t_cal_answer.substring(0, 2);
                                    var min = t_cal_answer.substring(5, 3);
                                }

                                //                            var mm1 = cal_answer.substring(0, 2);
                                //                            var dd1 = cal_answer.substring(3, 5);
                                //                            var yyyy1 = cal_answer.substring(6, 10);

                                //                            if (mode == 'time') {
                                //                                var hour = cal_answer.substring(0, 2);
                                //                                var min = cal_answer.substring(3, 5);
                                //                            }
                                //                            else {
                                //                                var hour = cal_answer.substring(11, 13);
                                //                                var min = cal_answer.substring(14, 16);
                                //                            }

                                var curr_datetime_str = mm1 + '/' + dd1 + '/' + yyyy1 + ' ' + hour + ':' + min;
                                var curr_date_str = mm1 + '/' + dd1 + '/' + yyyy1;
                                var curr_time = hour + ':' + min;

                                var t_start_datetime_str = convert_fix_format_date_on_submit(start_datetime_str, "datetime");
                                var t_end_datetime_str = convert_fix_format_date_on_submit(end_datetime_str, "datetime");
                                var t_start_date_str = convert_fix_format_date_on_submit(start_date_str, "date");
                                var t_end_date_str = convert_fix_format_date_on_submit(end_date_str, "date");

                                // get milliseconds for check validation
                                var curr_datetime = new Date(curr_datetime_str).getTime();
                                var start_datetime = new Date(t_start_datetime_str).getTime();
                                var end_datetime = new Date(t_end_datetime_str).getTime();
                                var curr_date = new Date(curr_date_str).getTime();
                                var start_date = new Date(t_start_date_str).getTime();
                                var end_date = new Date(t_end_date_str).getTime();

                                // greater and today last ms
                                //var mid_night_ms = new Date().setHours(0, 0, 0, 0);
                                //var today_last_ms = new Date(mid_night_ms).getTime() + 24 * 60 * 60 * 1000;
                                var today_last_ms = new Date().getTime();
                                var new_d1 = new Date(today_last_ms);
                                var dd1 = new_d1.getDate();
                                var mm1 = new_d1.getMonth() + 1; // January is 0!
                                var hour = new_d1.getHours()
                                var min = new_d1.getMinutes();
                                var yyyy1 = new_d1.getFullYear();
                                if (dd1 < 10) { dd1 = '0' + dd1; }
                                if (mm1 < 10) { mm1 = '0' + mm1; }
                                if (hour < 10) { hour = '0' + hour; }
                                if (min < 10) { min = '0' + min; }
                                var todayLast_date_str = mm1 + '/' + dd1 + '/' + yyyy1;
                                var todayLast_time = hour + ':' + min;
                                var todayLast_datetime_str = todayLast_date_str + ' ' + todayLast_time;

                                var todayLast_datetime_string = convert_datetime_by_format(today_last_ms, "datetime");
                                var todayLast_date_string = convert_datetime_by_format(today_last_ms, "date");
                                var todayLast_time_string = convert_datetime_by_format(today_last_ms, "time");

                                if (end_date_str == "" || end_date_str == null || end_date_str == undefined) {
                                    end_date_str = end_datetime_str = '';
                                }
                                if (end_date_str == "NaN/NaN/NaN") {
                                    end_date_str = '';
                                }
                                if (end_datetime_str == "NaN/NaN/NaN NaN:NaN") {
                                    end_datetime_str = '';
                                }

                                // display label instead of blank if above parent calenadar is blank (myaims 24052023)
                                if (end_date_str == "" || end_datetime_str == "") {
                                    // get label from reference class
                                    end_date_str = end_datetime_str = $("#" + old_d_id + "").attr("placeholder");
                                    if (end_date_str == "" || end_date_str == null || end_date_str == undefined) {
                                        // get label from range class
                                        end_date_str = end_datetime_str = $("#" + where_box_id + "").attr("placeholder");
                                        if (end_date_str == "" || end_date_str == null || end_date_str == undefined) {
                                            end_date_str = end_datetime_str = '';
                                        }
                                    }
                                }

                                // var target_on = 'split';

                                var date_name = prop_name;

                                if (ref_prop_name != "" && ref_prop_name != date_name) {
                                    start_datetime_str = ref_prop_name + " (" + start_datetime_str + ") ";
                                    start_date_str = ref_prop_name + " (" + start_date_str + ") ";
                                    start_time = ref_prop_name + " (" + start_time + ") ";

                                    //end_datetime_str = ref_prop_name + " ( " + end_datetime_str + ") ";
                                    //end_date_str = ref_prop_name + " ( " + end_date_str + ") ";
                                    //end_time = ref_prop_name + " ( " + end_time + ") ";
                                }

                                if (target_on == 'datetime') {
                                    if (tat_type == "include") {
                                        if ((curr_datetime >= start_datetime) && (curr_datetime <= end_datetime)) {
                                            // valid
                                        }
                                        else {
                                            if (curr_btn_mode != "save") {
                                                if (before_days == 0 && gap_days == 0 && before_hours == 0 && gap_hours == 0) { }
                                                else {
                                                    range_found++;
                                                }

                                                if (range_found > 0) {
                                                    alert_and_ios("" + date_name + " must be >= " + start_datetime_str + " and <= " + end_datetime_str + "");
                                                }
                                                else {
                                                    alert_and_ios("" + date_name + " must be " + start_datetime_str + "");
                                                }
                                            }
                                            cal_answer = '';
                                        }
                                    } else if (tat_type == "exclude") {
                                        if ((curr_datetime <= start_datetime) || (curr_datetime >= end_date)) {
                                            // valid
                                        } else {
                                            if (curr_btn_mode != "save") {
                                                alert_and_ios("" + date_name + " must be <= " + start_datetime_str + " and >= " + end_datetime_str + "");
                                            }
                                            cal_answer = '';
                                        }
                                    } else if (tat_type == "greater") {
                                        if (curr_datetime >= end_datetime) {
                                            // valid
                                        } else {
                                            if (curr_btn_mode != "save") {
                                                alert_and_ios("" + date_name + " must be >= " + end_datetime_str + "");
                                            }

                                            cal_answer = '';
                                        }
                                    } else if (tat_type == "greater_today") {
                                        if ((curr_datetime >= end_datetime) && (curr_datetime <= today_last_ms)) {
                                            // valid
                                        } else {
                                            if (curr_btn_mode != "save") {
                                                alert_and_ios("" + date_name + " must be >= " + end_datetime_str + " and <= " + todayLast_datetime_string + "");
                                            }
                                            cal_answer = '';
                                        }
                                    } else if (tat_type == "greater_next_day") {
                                        if ((curr_datetime > end_datetime) && (curr_datetime > today_last_ms)) {
                                            // valid
                                        } else {
                                            if (curr_btn_mode != "save") {
                                                alert_and_ios("" + date_name + " must be > " + end_datetime_str + "");
                                            }
                                            cal_answer = '';
                                        }
                                    }
                                    else if (tat_type == "less") {
                                        if (curr_datetime <= end_datetime) {
                                            // valid
                                        } else {
                                            if (curr_btn_mode != "save") {
                                                alert_and_ios("" + date_name + " must be <= " + end_datetime_str + "");
                                            }
                                            cal_answer = '';
                                        }
                                    }
                                    else if (tat_type == "less_previous_day") {
                                        if ((curr_datetime < end_datetime) && (curr_datetime < today_last_ms)) {
                                            // valid
                                        } else {
                                            if (curr_btn_mode != "save") {
                                                alert_and_ios("" + date_name + " must be < " + end_datetime_str + "");
                                            }
                                            cal_answer = '';
                                        }
                                    }
                                } else if (target_on == 'date') {
                                    if (tat_type == "include") {
                                        if ((curr_date >= start_date) && (curr_date <= end_date)) {
                                            // valid
                                        } else {
                                            if (curr_btn_mode != "save") {
                                                if (before_days == 0 && gap_days == 0) { }
                                                else {
                                                    range_found++;
                                                }

                                                if (range_found > 0) {
                                                    alert_and_ios("" + date_name + " must be >= " + start_date_str + " and <= " + end_date_str + "");
                                                }
                                                else {
                                                    alert_and_ios("" + date_name + " must be " + start_date_str + "");
                                                }
                                            }
                                            cal_answer = '';
                                        }
                                    } else if (tat_type == "exclude") {
                                        if ((curr_date <= start_date) || (curr_date >= end_date)) {
                                            // valid
                                        } else {
                                            if (curr_btn_mode != "save") {
                                                alert_and_ios("" + date_name + " must be <= " + start_date_str + " and >= " + end_date_str + "");
                                            }
                                            cal_answer = '';
                                        }
                                    } else if (tat_type == "greater") {
                                        if (curr_date >= end_date) {
                                            // valid
                                        } else {
                                            if (curr_btn_mode != "save") {
                                                alert_and_ios("" + date_name + " must be >= " + end_date_str + "");
                                            }
                                            cal_answer = '';
                                        }
                                    } else if (tat_type == "greater_today") {
                                        if ((curr_date >= end_date) && (curr_date <= today_last_ms)) {
                                            // valid
                                        } else {
                                            if (curr_btn_mode != "save") {
                                                alert_and_ios("" + date_name + " must be >= " + end_date_str + " and <= " + todayLast_date_string + "");
                                            }
                                            cal_answer = '';
                                        }
                                    } else if (tat_type == "greater_next_day") {
                                        if ((curr_date > end_date) && (curr_date > today_last_ms)) {
                                            // valid
                                        } else {
                                            if (curr_btn_mode != "save") {
                                                alert_and_ios("" + date_name + " must be > " + end_date_str + "");
                                            }
                                            cal_answer = '';
                                        }
                                    } else if (tat_type == "less") {
                                        if (curr_date <= end_date) {
                                            // valid
                                        } else {
                                            if (curr_btn_mode != "save") {
                                                alert_and_ios("" + date_name + " must be <= " + end_date_str + "");
                                            }
                                            cal_answer = '';
                                        }
                                    }
                                    else if (tat_type == "less_previous_day") {
                                        if ((curr_date < end_date) && (curr_date < today_last_ms)) {
                                            // valid
                                        } else {
                                            if (curr_btn_mode != "save") {
                                                alert_and_ios("" + date_name + " must be < " + end_date_str + "");
                                            }
                                            cal_answer = '';
                                        }
                                    }
                                } else if (target_on == 'time') {
                                    if (tat_type == "include") {
                                        if ((curr_time >= start_time) && (curr_time <= end_time)) {
                                            // valid
                                        } else {
                                            if (curr_btn_mode != "save") {
                                                if (before_hours == 0 && gap_hours == 0) { }
                                                else {
                                                    range_found++;
                                                }

                                                if (range_found > 0) {
                                                    alert_and_ios("" + date_name + " must be >= " + start_time + " and <= " + end_time + "");
                                                }
                                                else {
                                                    alert_and_ios("" + date_name + " must be " + start_time + "");
                                                }
                                            }
                                            cal_answer = '';
                                        }
                                    } else if (tat_type == "exclude") {
                                        if ((curr_time <= start_time) || (curr_time >= end_time)) {
                                            // valid
                                        } else {
                                            if (curr_btn_mode != "save") {
                                                alert_and_ios("" + date_name + " must be <= " + start_time + " and >= " + end_time + "");
                                            }
                                            cal_answer = '';
                                        }
                                    } else if (tat_type == "greater") {
                                        if (curr_time >= end_time) {
                                            // valid
                                        } else {
                                            if (curr_btn_mode != "save") {
                                                alert_and_ios("" + date_name + " must be >= " + end_time + "");
                                            }
                                            cal_answer = '';
                                        }
                                    } else if (tat_type == "greater_today") {
                                        if ((curr_time >= end_time) && (curr_time <= todayLast_time)) {
                                            // valid
                                        } else {
                                            if (curr_btn_mode != "save") {
                                                alert_and_ios("" + date_name + " must be >= " + end_time + " and <= " + todayLast_time_string + "");
                                            }
                                            cal_answer = '';
                                        }
                                    } else if (tat_type == "greater_next_day") {
                                        if ((curr_time > end_time) && (curr_time > todayLast_time)) {
                                            // valid
                                        } else {
                                            if (curr_btn_mode != "save") {
                                                alert_and_ios("" + date_name + " must be > " + end_time + "");
                                            }
                                            cal_answer = '';
                                        }
                                    } else if (tat_type == "less") {
                                        if (curr_time <= end_time) {
                                            // valid
                                        } else {
                                            if (curr_btn_mode != "save") {
                                                alert_and_ios("" + date_name + " must be <= " + end_time + "");
                                            }
                                            cal_answer = '';
                                        }
                                    }
                                    else if (tat_type == "less_previous_day") {
                                        if ((curr_time < end_time) && (curr_time < todayLast_time)) {
                                            // valid
                                        } else {
                                            if (curr_btn_mode != "save") {
                                                alert_and_ios("" + date_name + " must be < " + end_time + "");
                                            }
                                            cal_answer = '';
                                        }
                                    }
                                } else if (target_on == 'split') {
                                    if (tat_type == "include") {
                                        if ((curr_date >= start_date) && (curr_date <= end_date)) {
                                            // valid
                                        } else {
                                            if (curr_btn_mode != "save") {
                                                if (before_days == 0 && gap_days == 0) { }
                                                else {
                                                    range_found++;
                                                }

                                                if (range_found > 0) {
                                                    alert_and_ios("" + date_name + " (date) must be >= " + start_date_str + " and <= " + end_date_str + "");
                                                }
                                                else {
                                                    alert_and_ios("" + date_name + " (date) must be " + start_date_str + "");
                                                }
                                            }
                                            cal_answer = '';
                                        }
                                        if ((curr_time >= start_time) && (curr_time <= end_time)) {
                                            // valid
                                        } else {
                                            if (curr_btn_mode != "save") {
                                                if (before_hours == 0 && gap_hours == 0) { }
                                                else {
                                                    range_found++;
                                                }

                                                if (range_found > 0) {
                                                    alert_and_ios("" + date_name + " (time) must be >= " + start_time + " and <= " + end_time + "");
                                                }
                                                else {
                                                    alert_and_ios("" + date_name + " (time) must be " + start_time + "");
                                                }
                                            }
                                            cal_answer = '';
                                        }
                                    } else if (tat_type == "exclude") {
                                        if ((curr_date <= start_date) || (curr_date >= end_date)) {
                                            // valid
                                        } else {
                                            if (curr_btn_mode != "save") {
                                                alert_and_ios("" + date_name + " (date) must be <= " + start_date_str + " and >= " + end_date_str + "");
                                            }
                                            cal_answer = '';
                                        }
                                        if ((curr_time <= start_time) || (curr_time >= end_time)) {
                                            // valid
                                        } else {
                                            if (curr_btn_mode != "save") {
                                                alert_and_ios("" + date_name + " (time) must be <= " + start_time + " and >= " + end_time + "");
                                            }
                                            cal_answer = '';
                                        }
                                    } else if (tat_type == "greater") {
                                        if (curr_date >= end_date) {
                                            // valid
                                        } else {
                                            if (curr_btn_mode != "save") {
                                                alert_and_ios("" + date_name + " (date) must be >= " + end_date_str + "");
                                            }
                                            cal_answer = '';
                                        }
                                        if (curr_time >= end_time) {
                                            // valid
                                        } else {
                                            if (curr_btn_mode != "save") {
                                                alert_and_ios("" + date_name + " (time) must be >= " + end_time + "");
                                            }
                                            cal_answer = '';
                                        }
                                    } else if (tat_type == "less") {
                                        if (curr_date <= end_date) {
                                            // valid
                                        } else {
                                            if (curr_btn_mode != "save") {
                                                alert_and_ios("" + date_name + " (date) must be <= " + end_date_str + "");
                                            }
                                            cal_answer = '';
                                        }
                                        if (curr_time <= end_time) {
                                            // valid
                                        } else {
                                            if (curr_btn_mode != "save") {
                                                alert_and_ios("" + date_name + " (time) must be <= " + end_time + "");
                                            }
                                            cal_answer = '';
                                        }

                                    }

                                }
                            }
                            if (cal_answer == '') {
                                other_validation++;
                            }
                        }

                        if (cal_answer == '' || cal_answer == null || cal_answer == undefined) { }
                        else {
                            var cal_answer = convert_fix_format_date_on_submit(cal_answer, mode);

                            if (mode == 'date' || mode == 'datetime') {
                                var check_date = new Date(cal_answer);
                                if (check_date == "Invalid Date") {
                                    //$("#cal_" + new_id + "").val("");            // commented due to issue - getting NAN alert in case of from-to date combination validation 20022023
                                    cal_answer = "";
                                }
                            }
                        }
                        answer.push(cal_answer);

                        // for filter
                        var checksheet_type_filter = JSON.parse(storage.getItem('checksheet_type_filter'));
                        if (checksheet_type_filter == '9' || checksheet_type_filter == '10') {
                            var que_id = jsonObj[i].que_id;

                            if (global_wcf_url == "https://securitywcf.easyform.in/EF_Service.svc/v1/") {
                                get_id_text_array_for_type_20_ans(new_id, que_id, cal_answer, '', "8", target_on);
                            }
                            else {
                                pass_required_values_to_filter_push_array(new_id, que_id, cal_answer, '', "8", target_on);
                            }
                        }

                        if (jsonObj[i].prop[0].valid == "true" && curr_btn_mode != "save") {
                            if (answer == '' || answer == null || answer == undefined || cal_answer == '') {
                                mk_animate_border('#div_cal_' + new_id + '', 0, 500, mand_border_color);
                                if (validation < 1) {
                                    autoscroll_form_on_submit("#div_cal_" + new_id + "");
                                }
                                validation++;
                            } else {
                                filled_mand_count++;
                                $('#div_cal_' + new_id + '').css({
                                    "border": "none"
                                });
                            }
                        }
                        else {
                            if (answer == '' || answer == null || answer == undefined) { }
                            else { filled_non_mand_count++; }
                        }
                    }
                }

                // Signature Button
                else if (jsonObj[i].type == 9) {

                    // check for validation changed by dep_type = 0
                    var is_valid = $('#div_sign_' + new_id + '').attr('valid');
                    if (is_valid == 'false') {
                        var dep_res = "invalid";
                        $('#div_sign_' + new_id + '').css({ "border": "none" });
                    }
                    else {
                        var dep_res = "valid";
                    }

                    var answer = [];
                    // if element is hide then don't check validation
                    if ($('#div_sign_' + new_id + '').is(':hidden')) {
                        dep_res = "invalid";
                        if (is_hide == "true" || autofill_parent_id != "") {
                            var sign_answer = jsonObj[i].ans;
                            if (sign_answer == "" || sign_answer == null || sign_answer == undefined) {
                                answer.push("");
                            } else {
                                answer = sign_answer;
                            }

                            if (jsonObj[i].prop[0].valid == "true" && curr_btn_mode != "save") {
                                if (answer == '' || answer == null || answer == undefined) {
                                    validation = show_hidden_cntrl_alert(prop_name, validation, autofill_parent_id);
                                }
                            }
                        } else {
                            answer.push("");
                        }
                        $('#div_sign_' + new_id + '').css({
                            "border": "none"
                        });
                    }

                    if (dep_res == "valid") {
                        var sign_answer = jsonObj[i].ans;
                        if (sign_answer == "" || sign_answer == null || sign_answer == undefined) {
                            answer.push("");
                        } else {
                            answer = sign_answer;
                        }
                        if (jsonObj[i].prop[0].valid == "true" && curr_btn_mode != "save") {
                            if (answer == '' || answer == null || answer == undefined) {
                                mk_animate_border('#div_sign_' + new_id + '', 0, 500, mand_border_color);
                                if (validation < 1) {
                                    autoscroll_form_on_submit("#div_sign_" + new_id + "");
                                }
                                validation++;
                            } else {
                                filled_mand_count++;
                                $('#div_sign_' + new_id + '').css({
                                    "border": "none"
                                });
                            }
                        }
                        else {
                            if (answer == '' || answer == null || answer == undefined) { }
                            else { filled_non_mand_count++; }
                        }
                    }
                }

                // Question End
                else if (jsonObj[i].type == 10) {
                    var answer = [""];
                }

                // Camera Button with Latlong
                else if (jsonObj[i].type == 11) {

                    // check for validation changed by dep_type = 0
                    var is_valid = $('#div_cbtnLL_' + new_id + '').attr('valid');
                    if (is_valid == 'false') {
                        var dep_res = "invalid";
                        $('#div_cbtnLL_' + new_id + '').css({ "border": "none" });
                    }
                    else {
                        var dep_res = "valid";
                    }

                    var answer = [];
                    // if element is hide then don't check validation
                    if ($('#div_cbtnLL_' + new_id + '').is(':hidden')) {
                        dep_res = "invalid";
                        if (is_hide == "true" || autofill_parent_id != "") {
                            var camLL_answer = jsonObj[i].ans;
                            if (camLL_answer == "" || camLL_answer == null || camLL_answer == undefined) {
                                answer.push("");
                            } else {
                                answer = camLL_answer;
                            }

                            if (jsonObj[i].prop[0].valid == "true" && curr_btn_mode != "save") {
                                if (answer == '' || answer == null || answer == undefined) {
                                    validation = show_hidden_cntrl_alert(prop_name, validation, autofill_parent_id);
                                }
                            }
                        } else {
                            answer.push("");
                        }
                        $('#div_cbtnLL_' + new_id + '').css({
                            "border": "none"
                        });
                    }

                    if (dep_res == "valid") {
                        var camLL_answer = jsonObj[i].ans;
                        if (camLL_answer == "" || camLL_answer == null || camLL_answer == undefined) {
                            answer.push("");
                        } else {
                            answer = camLL_answer;
                        }
                        if (jsonObj[i].prop[0].valid == "true" && curr_btn_mode != "save") {
                            if (answer == '' || answer == null || answer == undefined) {
                                mk_animate_border('#div_cbtnLL_' + new_id + '', 0, 500, mand_border_color);
                                if (validation < 1) {
                                    autoscroll_form_on_submit("#div_cbtnLL_" + new_id + "");
                                }
                                validation++;
                            } else {
                                filled_mand_count++;
                                $('#div_cbtnLL_' + new_id + '').css({
                                    "border": "none"
                                });
                            }
                        }
                        else {
                            if (answer == '' || answer == null || answer == undefined) { }
                            else { filled_non_mand_count++; }
                        }
                    }
                }

                // Range Validator (numeric box)
                else if (jsonObj[i].type == 12) {

                    // check for validation changed by dep_type = 0
                    var is_valid = $('#div_txtrange_' + new_id + '').attr('valid');
                    if (is_valid == 'false') {
                        var dep_res = "invalid";
                        $('#div_txtrange_' + new_id + '').css({ "border": "none" });
                    }
                    else {
                        var dep_res = "valid";
                    }

                    var answer = [];
                    // if element is hide then don't check validation
                    if ($('#div_txtrange_' + new_id + '').is(':hidden')) {
                        dep_res = "invalid";
                        if (is_hide == "true" || autofill_parent_id != "") {
                            var value = misc_Array[0].value;
                            if (value == '' || value == null || value == undefined) {
                                var textbox_type = "numeric";
                            } else {
                                value = itemObj._checkStrObj(value);  		// check_item
                                var textbox_type = value[0].box_type;
                            }

                            if (textbox_type == 'numeric') {
                                var txtrange_answer = $("#txtrange_" + new_id + "").val();
                            } else {
                                var txtrange_answer = $("#lblrange_" + new_id + "").text();
                                if (txtrange_answer == '0') {
                                    txtrange_answer = '';
                                }
                            }

                            if (txtrange_answer == '' || txtrange_answer == null || txtrange_answer == undefined) {
                                txtrange_answer = '';
                            }
                            else {
                                txtrange_answer = parseFloat(txtrange_answer);
                                var start_range = parseFloat(jsonObj[i].value[0]);
                                var end_range = parseFloat(jsonObj[i].value[1]);
                                if (txtrange_answer >= start_range && txtrange_answer <= end_range) {
                                    var regex = misc_Array[0].regex;
                                    if (regex == '' || regex == null || regex == undefined || regex.length == 0) {
                                        // no regular expression
                                    }
                                    else {
                                        var formula = regex[0];
                                        var error_msg = regex[1];
                                        var reg_exp_check = mk_check_RegExp(formula, txtrange_answer);
                                        if (reg_exp_check == false) {
                                            other_validation++;
                                            txtrange_answer = '';
                                        }
                                    }
                                } else {
                                    txtrange_answer = '';
                                }
                            }
                            answer.push(txtrange_answer);

                            if (jsonObj[i].prop[0].valid == "true" && curr_btn_mode != "save") {
                                if (answer == '' || answer == null || answer == undefined) {
                                    validation = show_hidden_cntrl_alert(prop_name, validation, autofill_parent_id);
                                }
                            }
                        } else {
                            answer.push("");
                        }
                        $('#div_txtrange_' + new_id + '').css({
                            "border": "none"
                        });
                    }

                    if (dep_res == "valid") {
                        var value = misc_Array[0].value;
                        if (value == '' || value == null || value == undefined) {
                            var textbox_type = "numeric";
                        } else {
                            value = itemObj._checkStrObj(value);  		// check_item
                            var textbox_type = value[0].box_type;
                        }

                        if (textbox_type == 'numeric') {
                            var txtrange_answer = $("#txtrange_" + new_id + "").val();
                        } else {
                            var txtrange_answer = $("#lblrange_" + new_id + "").text();
                            if (txtrange_answer == '0') {
                                txtrange_answer = '';
                            }
                        }

                        if (txtrange_answer == '' || txtrange_answer == null || txtrange_answer == undefined) {
                            txtrange_answer = '';
                        }
                        else {
                            txtrange_answer = parseFloat(txtrange_answer);
                            var start_range = parseFloat(jsonObj[i].value[0]);
                            var end_range = parseFloat(jsonObj[i].value[1]);
                            if (txtrange_answer >= start_range && txtrange_answer <= end_range) {
                                var regex = misc_Array[0].regex;
                                if (regex == '' || regex == null || regex == undefined || regex.length == 0) {
                                    // no regular expression
                                }
                                else {
                                    var formula = regex[0];
                                    var error_msg = regex[1];
                                    var reg_exp_check = mk_check_RegExp(formula, txtrange_answer);
                                    if (reg_exp_check == false) {
                                        if (txtrange_answer != "") {
                                            other_validation++;
                                        }

                                        txtrange_answer = '';
                                        if (error_msg == '' || error_msg == null || error_msg == undefined) {
                                            alert1("Invalid input string for " + prop_name + "!");
                                        }
                                        else {
                                            alert1(error_msg);
                                        }
                                    }
                                }
                            } else {
                                txtrange_answer = '';
                                if (curr_btn_mode != "save") {
                                    alert1("" + prop_name + " must be in range of " + start_range + " and " + end_range + "");
                                }
                            }
                        }
                        answer.push(txtrange_answer);

                        if (jsonObj[i].prop[0].valid == "true" && curr_btn_mode != "save") {
                            if (answer == '' || answer == null || answer == undefined) {
                                mk_animate_border('#div_txtrange_' + new_id + '', 0, 500, mand_border_color);
                                if (validation < 1) {
                                    autoscroll_form_on_submit("#div_txtrange_" + new_id + "");
                                }
                                validation++;
                            } else {
                                filled_mand_count++;
                                $('#div_txtrange_' + new_id + '').css({
                                    "border": "none"
                                });
                            }
                        }
                        else {
                            if (answer == '' || answer == null || answer == undefined) { }
                            else { filled_non_mand_count++; }
                        }
                    }
                }

                // Get Latlong Button (print it to numeric box)
                else if (jsonObj[i].type == 13) {

                    // check for validation changed by dep_type = 0
                    var is_valid = $('#div_LatLong_' + new_id + '').attr('valid');
                    if (is_valid == 'false') {
                        var dep_res = "invalid";
                        $('#div_LatLong_' + new_id + '').css({ "border": "none" });
                    }
                    else {
                        var dep_res = "valid";
                    }

                    var answer = [];
                    // if element is hide then don't check validation
                    if ($('#div_LatLong_' + new_id + '').is(':hidden')) {
                        dep_res = "invalid";
                        if (is_hide == "true" || autofill_parent_id != "") {
                            var camLL_answer = jsonObj[i].ans;
                            camLL_answer = camLL_answer.toString();
                            if (camLL_answer == "" || camLL_answer == null || camLL_answer == undefined) {
                                answer.push("");
                            } else {
                                camLL_answer = camLL_answer.replace("[", "");
                                camLL_answer = camLL_answer.replace("]", "");
                                answer.push(camLL_answer);
                            }

                            if (jsonObj[i].prop[0].valid == "true" && curr_btn_mode != "save") {
                                if (answer == '' || answer == null || answer == undefined) {
                                    validation = show_hidden_cntrl_alert(prop_name, validation, autofill_parent_id);
                                }
                            }
                        } else {
                            answer.push("");
                        }
                        $('#div_LatLong_' + new_id + '').css({
                            "border": "none"
                        });
                    }

                    if (dep_res == "valid") {
                        var camLL_answer = jsonObj[i].ans;
                        camLL_answer = camLL_answer.toString();
                        if (camLL_answer == "" || camLL_answer == null || camLL_answer == undefined) {
                            answer.push("");
                        } else {
                            camLL_answer = camLL_answer.replace("[", "");
                            camLL_answer = camLL_answer.replace("]", "");
                            answer.push(camLL_answer);
                        }
                        if (jsonObj[i].prop[0].valid == "true" && curr_btn_mode != "save") {
                            if (answer == '' || answer == null || answer == undefined) {
                                mk_animate_border('#div_LatLong_' + new_id + '', 0, 500, mand_border_color);
                                if (validation < 1) {
                                    autoscroll_form_on_submit("#div_LatLong_" + new_id + "");
                                }
                                validation++;
                            } else {
                                filled_mand_count++;
                                $('#div_LatLong_' + new_id + '').css({
                                    "border": "none"
                                });
                            }
                        }
                        else {
                            if (answer == '' || answer == null || answer == undefined) { }
                            else { filled_non_mand_count++; }
                        }
                    }
                }

                // Get Site Latlong Button (print it to numeric box)
                else if (jsonObj[i].type == 14) {
                    var answer = [""];
                }

                // Get MSL Button (print it to numeric box)
                else if (jsonObj[i].type == 15) {

                    // check for validation changed by dep_type = 0
                    var is_valid = $('#div_MSL_' + new_id + '').attr('valid');
                    if (is_valid == 'false') {
                        var dep_res = "invalid";
                        $('#div_MSL_' + new_id + '').css({ "border": "none" });
                    }
                    else {
                        var dep_res = "valid";
                    }

                    var answer = [];
                    // if element is hide then don't check validation
                    if ($('#div_MSL_' + new_id + '').is(':hidden')) {
                        dep_res = "invalid";
                        if (is_hide == "true" || autofill_parent_id != "") {
                            var MSL_answer = jsonObj[i].ans;
                            MSL_answer = MSL_answer.toString();

                            if (MSL_answer == "" || MSL_answer == null || MSL_answer == undefined) {
                                answer.push("");
                            } else {
                                MSL_answer = MSL_answer.replace("[", "");
                                MSL_answer = MSL_answer.replace("]", "");
                                answer.push(MSL_answer);
                            }

                            if (jsonObj[i].prop[0].valid == "true" && curr_btn_mode != "save") {
                                if (answer == '' || answer == null || answer == undefined) {
                                    validation = show_hidden_cntrl_alert(prop_name, validation, autofill_parent_id);
                                }
                            }
                        } else {
                            answer.push("");
                        }
                        $('#div_MSL_' + new_id + '').css({
                            "border": "none"
                        });
                    }

                    if (dep_res == "valid") {
                        var MSL_answer = jsonObj[i].ans;
                        MSL_answer = MSL_answer.toString();

                        if (MSL_answer == "" || MSL_answer == null || MSL_answer == undefined) {
                            answer.push("");
                        } else {
                            MSL_answer = MSL_answer.replace("[", "");
                            MSL_answer = MSL_answer.replace("]", "");
                            answer.push(MSL_answer);
                        }
                        if (jsonObj[i].prop[0].valid == "true" && curr_btn_mode != "save") {
                            if (answer == '' || answer == null || answer == undefined) {
                                mk_animate_border('#div_MSL_' + new_id + '', 0, 500, mand_border_color);
                                if (validation < 1) {
                                    autoscroll_form_on_submit("#div_MSL_" + new_id + "");
                                }
                                validation++;
                            } else {
                                filled_mand_count++;
                                $('#div_MSL_' + new_id + '').css({
                                    "border": "none"
                                });
                            }
                        }
                        else {
                            if (answer == '' || answer == null || answer == undefined) { }
                            else { filled_non_mand_count++; }
                        }
                    }
                }

                // Get Distance Button (print it to numeric box)
                else if (jsonObj[i].type == 16) {

                    // check for validation changed by dep_type = 0
                    var is_valid = $('#div_Dist_' + new_id + '').attr('valid');
                    if (is_valid == 'false') {
                        var dep_res = "invalid";
                        $('#div_Dist_' + new_id + '').css({ "border": "none" });
                    }
                    else {
                        var dep_res = "valid";
                    }

                    var answer = [];
                    // if element is hide then don't check validation
                    if ($('#div_Dist_' + new_id + '').is(':hidden')) {
                        dep_res = "invalid";
                        if (is_hide == "true" || autofill_parent_id != "") {
                            var Dist_answer = jsonObj[i].ans;
                            Dist_answer = Dist_answer.toString();
                            if (Dist_answer == "" || Dist_answer == null || Dist_answer == undefined) {
                                answer.push("");
                            } else {
                                Dist_answer = Dist_answer.replace("[", "");
                                Dist_answer = Dist_answer.replace("]", "");
                                answer.push(Dist_answer);
                            }

                            if (jsonObj[i].prop[0].valid == "true" && curr_btn_mode != "save") {
                                if (answer == '' || answer == null || answer == undefined) {
                                    validation = show_hidden_cntrl_alert(prop_name, validation, autofill_parent_id);
                                }
                            }
                        } else {
                            answer.push("");
                        }
                        $('#div_Dist_' + new_id + '').css({
                            "border": "none"
                        });
                    }

                    if (dep_res == "valid") {
                        var Dist_answer = jsonObj[i].ans;
                        Dist_answer = Dist_answer.toString();

                        if (Dist_answer == "" || Dist_answer == null || Dist_answer == undefined) {
                            answer.push("");
                        } else {
                            Dist_answer = Dist_answer.replace("[", "");
                            Dist_answer = Dist_answer.replace("]", "");
                            answer.push(Dist_answer);
                        }
                        if (jsonObj[i].prop[0].valid == "true"
                            && curr_btn_mode != "save") {
                            if (answer == '' || answer == null || answer == undefined) {
                                mk_animate_border('#div_Dist_' + new_id + '', 0, 500, mand_border_color);
                                if (validation < 1) {
                                    autoscroll_form_on_submit("#div_Dist_" + new_id + "");
                                }
                                validation++;
                            } else {
                                filled_mand_count++;
                                $('#div_Dist_' + new_id + '').css({
                                    "border": "none"
                                });
                            }
                        }
                        else {
                            if (answer == '' || answer == null || answer == undefined) { }
                            else { filled_non_mand_count++; }
                        }
                    }
                }

                // Get Calculate Button (print it to numeric box)
                else if (jsonObj[i].type == 17) {

                    // check for validation changed by dep_type = 0
                    var is_valid = $('#div_Calc_' + new_id + '').attr('valid');
                    if (is_valid == 'false') {
                        var dep_res = "invalid";
                        $('#div_Calc_' + new_id + '').css({ "border": "none" });
                    }
                    else {
                        var dep_res = "valid";
                    }

                    var answer = [];
                    // if element is hide then don't check validation
                    if ($('#div_Calc_' + new_id + '').is(':hidden')) {
                        dep_res = "invalid";
                        if (is_hide == "true" || autofill_parent_id != "") {
                            var Calc_answer = $("#txt_Calc_" + new_id + "").val();
                            if (Calc_answer == null || Calc_answer == undefined || Calc_answer == '') {
                                Calc_answer = '';
                            }

                            var regex = misc_Array[0].regex;
                            if (regex == '' || regex == null || regex == undefined || regex.length == 0) {
                                // no regular expression
                            } else {
                                var formula = regex[0];
                                var error_msg = regex[1];
                                var reg_exp_check = mk_check_RegExp(formula, Calc_answer);
                                if (reg_exp_check == false) {
                                    if (Calc_answer != "") {
                                        other_validation++;
                                    }

                                    Calc_answer = '';

                                    // customer change for metal for tes (04012019)
                                    if (error_msg == '' || error_msg == null || error_msg == undefined) {
                                        if (curr_btn_mode != "save") {
                                            alert1("Invalid input string for " + prop_name + "");
                                        }
                                    } else {
                                        if (curr_btn_mode != "save") {
                                            alert1(error_msg);
                                        }
                                    }
                                    validation++;
                                }
                            }

                            answer.push(Calc_answer);

                            if (jsonObj[i].prop[0].valid == "true" && curr_btn_mode != "save") {
                                if (answer == '' || answer == null || answer == undefined) {
                                    validation = show_hidden_cntrl_alert(prop_name, validation, autofill_parent_id);
                                }
                            }
                        } else {
                            answer.push("");
                        }
                        $('#div_Calc_' + new_id + '').css({
                            "border": "none"
                        });
                    }

                    if (dep_res == "valid") {
                        var Calc_answer = $("#txt_Calc_" + new_id + "").val();
                        if (Calc_answer == null || Calc_answer == undefined || Calc_answer == '') {
                            Calc_answer = '';
                        }

                        var regex = misc_Array[0].regex;
                        if (regex == '' || regex == null || regex == undefined || regex.length == 0) {
                            // no regular expression
                        } else {
                            var formula = regex[0];
                            var error_msg = regex[1];
                            var reg_exp_check = mk_check_RegExp(formula, Calc_answer);
                            if (reg_exp_check == false) {
                                if (Calc_answer != "") {
                                    other_validation++;
                                }

                                Calc_answer = '';
                                if (error_msg == '' || error_msg == null || error_msg == undefined) {
                                    if (curr_btn_mode != "save") {
                                        alert1("Invalid input string for " + prop_name + "");
                                    }
                                } else {
                                    if (curr_btn_mode != "save") {
                                        alert1(error_msg);
                                    }
                                }
                                mk_animate_border('#div_Calc_' + new_id + '', 0, 500, mand_border_color);
                                validation++;
                            } else {
                                $('#div_Calc_' + new_id + '').css({
                                    "border": "none"
                                });
                            }
                        }

                        answer.push(Calc_answer);
                        if (jsonObj[i].prop[0].valid == "true" && curr_btn_mode != "save") {
                            if (answer == '' || answer == null || answer == undefined) {
                                mk_animate_border('#div_Calc_' + new_id + '', 0, 500, mand_border_color);
                                if (validation < 1) {
                                    autoscroll_form_on_submit("#div_Calc_" + new_id + "");
                                }
                                validation++;
                            } else {
                                filled_mand_count++;
                                $('#div_Calc_' + new_id + '').css({
                                    "border": "none"
                                });
                            }
                        }
                        else {
                            if (answer == '' || answer == null || answer == undefined) { }
                            else { filled_non_mand_count++; }
                        }
                    }
                }
                // currently cascading drop down control type=18 is on hold

                // Get Invoice Button (print it to numeric box)
                else if (jsonObj[i].type == 19) {

                    // check for validation changed by dep_type = 0
                    var is_valid = $('#div_Inv_' + new_id + '').attr('valid');
                    if (is_valid == 'false') {
                        var dep_res = "invalid";
                        $('#div_Inv_' + new_id + '').css({ "border": "none" });
                    }
                    else {
                        var dep_res = "valid";
                    }

                    var answer = [];
                    // if element is hide then don't check validation
                    if ($('#div_Inv_' + new_id + '').is(':hidden')) {
                        dep_res = "invalid";
                        if (is_hide == "true" || autofill_parent_id != "") {
                            var inv_answer = jsonObj[i].ans;
                            if (inv_answer == "" || inv_answer == null || inv_answer == undefined) {
                                answer.push("");
                            } else {
                                answer.push(inv_answer);
                            }

                            if (jsonObj[i].prop[0].valid == "true" && curr_btn_mode != "save") {
                                if (answer == '' || answer == null || answer == undefined) {
                                    validation = show_hidden_cntrl_alert(prop_name, validation, autofill_parent_id);
                                }
                            }

                        } else {
                            answer.push("");
                        }
                        $('#div_Inv_' + new_id + '').css({
                            "border": "none"
                        });
                    }

                    if (dep_res == "valid") {
                        var inv_answer = jsonObj[i].ans;
                        if (inv_answer == "" || inv_answer == null || inv_answer == undefined) {
                            answer.push("");
                        } else {
                            answer.push(inv_answer);
                        }

                        if (jsonObj[i].prop[0].valid == "true" && curr_btn_mode != "save") {
                            if (answer == '' || answer == null || answer == undefined) {
                                mk_animate_border('#div_Inv_' + new_id + '', 0, 500, mand_border_color);
                                if (validation < 1) {
                                    autoscroll_form_on_submit("#div_Inv_" + new_id + "");
                                }
                                validation++;
                            } else {
                                filled_mand_count++;
                                $('#div_Inv_' + new_id + '').css({
                                    "border": "none"
                                });
                            }
                        }
                        else {
                            if (answer == '' || answer == null || answer == undefined) { }
                            else { filled_non_mand_count++; }
                        }
                    }
                }

                // Get Search Control
                else if (jsonObj[i].type == 20) {

                    // check for validation changed by dep_type = 0
                    var is_valid = $('#div_Search_' + new_id + '').attr('valid');
                    if (is_valid == 'false') {
                        var dep_res = "invalid";
                        $('#div_Search_' + new_id + '').css({ "border": "none" });
                    }
                    else {
                        var dep_res = "valid";
                    }

                    var value = itemObj._checkStrObj(misc_Array[0].value);

                    // check reference element has been changed or not (if changed then restrict current)
                    var ref_valid = 0;
                    var value_new = jsonObj[i].prop[0].value_new;
                    if (value_new == '' || value_new == null || value_new == undefined) {
                        var Fill_Data = value[0].Fill_Data;
                        var push_data = value[0].push_data;
                        if (push_data == '' || push_data == null || push_data == undefined) {
                            // no push data
                            var multi_select = "false";
                        } else {
                            var multi_select = push_data[0].multi_select;
                        }
                    }
                    else {
                        var Fill_Data = value_new[0].Fill_Data;
                        var push_data = value_new[0].push_data;
                        //var view_style = push_data[0].view_style;
                        var multi_select = push_data[0].multi_select;
                    }

                    var view_style = 'dropdownview';                   //searchable is displayed in dropdown view only(25112019)

                    var add_cust_from_search = push_data[0].add_cust_from_search;                       //added this key for ATC (add new customer from search string) [atc.bb - 03052021]
                    if (add_cust_from_search == "" || add_cust_from_search == null || add_cust_from_search == undefined || add_cust_from_search == "0") {
                        add_cust_from_search = "false";
                    }

                    var answer = [];
                    // if element is hide then don't check validation
                    if ($('#div_Search_' + new_id + '').is(':hidden')) {
                        dep_res = "invalid";
                        if (is_hide == "true" || autofill_parent_id != "") {
                            if (add_cust_from_search == "true") {
                                var cust_add_flag = $("#type20_txt_" + new_id + "").attr('cust_add_flag');
                                if (cust_add_flag == 1) {
                                    var search_answer = $("#type20_txt_" + new_id + "").val();
                                    var S_search_id = $("#type20_txt_" + new_id + "").attr('value1');
                                    var search_name = $("#type20_txt_" + new_id + "").attr('name');
                                }
                                else {
                                    var search_answer = $("#type20_txt_" + new_id + "").val();
                                    if (search_answer != "") {
                                        //if cell text is changed and + btn is not pressed...[haresh1.vt - 01062021]
                                        validation++;
                                        mk_animate_border('#div_Search_' + new_id + '', 0, 500, mand_border_color);
                                        alert1('"' + search_answer + '" cell is not found...');
                                    }
                                }
                            }
                            else {
                                if (view_style == 'dropdownview') {
                                    var search_answer = $("#ddl_search_type20_" + new_id + " :selected").text();
                                    var S_search_id = $("#ddl_search_type20_" + new_id + " :selected").attr('value1');            //value1 for duplicate user_id(1 user assigned to multiple circle)
                                    if (S_search_id == "" || S_search_id == null || S_search_id == undefined) {
                                        S_search_id = $("#ddl_search_type20_" + new_id + "").val();
                                    }
                                    var search_name = $("#ddl_search_type20_" + new_id + "").attr('name');
                                } else {
                                    var search_answer = $("#search_item_name_Search_" + new_id + "").val();
                                    var S_search_id = $("#search_item_name_Search_" + new_id + "").attr('title');
                                    var search_name = $("#search_item_name_Search_" + new_id + "").attr('name');
                                }
                            }

                            if (search_answer == "" || search_answer == null || search_answer == undefined || S_search_id == '0' || search_name == '0') {
                                answer.push("");
                            } else {
                                answer.push(search_answer, decodeURIComponent(S_search_id));
                            }

                            if (jsonObj[i].prop[0].valid == "true" && curr_btn_mode != "save") {
                                if (answer == '' || answer == null || answer == undefined) {
                                    validation = show_hidden_cntrl_alert(prop_name, validation, autofill_parent_id);
                                }
                            }
                        } else {
                            answer.push("");
                        }
                        $('#div_Search_' + new_id + '').css({
                            "border": "none"
                        });
                    }

                    if (dep_res == "valid") {
                        if (add_cust_from_search == "true") {
                            var cust_add_flag = $("#type20_txt_" + new_id + "").attr('cust_add_flag');
                            if (cust_add_flag == 1) {
                                var search_answer = $("#type20_txt_" + new_id + "").val();
                                var S_search_id = $("#type20_txt_" + new_id + "").attr('value1');
                                var search_name = $("#type20_txt_" + new_id + "").attr('name');
                            }
                            else {
                                var search_answer = $("#type20_txt_" + new_id + "").val();
                                if (search_answer != "") {
                                    //if cell text is changed and + btn is not pressed...[haresh1.vt - 01062021]
                                    validation++;
                                    mk_animate_border('#div_Search_' + new_id + '', 0, 500, mand_border_color);
                                    alert1('"' + search_answer + '" cell is not found...');
                                }
                            }
                        }
                        else {
                            if (view_style == 'dropdownview') {

                                var is_parent_type22 = $("#div_Search_" + new_id + "").parent('div[id^=div_singleInvoice_cntrl]').length;
                                if (is_parent_type22 > 0) {
                                    var search_answer = invoice_type20_selected_text;
                                    var S_search_id = invoice_type20_selected_val;
                                }
                                else {
                                    var search_answer = $("#ddl_search_type20_" + new_id + " :selected").text();
                                    var S_search_id = $("#ddl_search_type20_" + new_id + " :selected").attr('value1');            //value1 for duplicate user_id(1 user assigned to multiple circle)
                                }

                                if (S_search_id == "" || S_search_id == null || S_search_id == undefined) {
                                    S_search_id = $("#ddl_search_type20_" + new_id + "").val();
                                }
                                var search_name = $("#ddl_search_type20_" + new_id + "").attr('name');

                                // for filter
                                var checksheet_type_filter = JSON.parse(storage.getItem('checksheet_type_filter'));
                                if (checksheet_type_filter == '9' || checksheet_type_filter == '10') {
                                    var que_id = jsonObj[i].que_id;

                                    if (global_wcf_url == "https://securitywcf.easyform.in/EF_Service.svc/v1/") {
                                        get_id_text_array_for_type_20_ans(new_id, que_id, S_search_id, search_answer, "20", "");
                                    }
                                    else {
                                        pass_required_values_to_filter_push_array(new_id, que_id, S_search_id, search_answer, "20", "");
                                    }
                                }
                            } else {
                                var search_answer = $("#search_item_name_Search_" + new_id + "").val();
                                var S_search_id = $("#search_item_name_Search_" + new_id + "").attr('title');
                                var search_name = $("#search_item_name_Search_" + new_id + "").attr('name');
                            }
                        }

                        if (multi_select == "true") {
                            var search_answer = $("#ddl_search_type20_" + new_id + "").val();
                            var S_search_id = $("#ddl_search_type20_" + new_id + " option:selected").map(function () {
                                return $(this).attr("value1");
                            }).get();

                            search_answer = search_answer.toString();
                            search_answer = search_answer.trim();
                            search_answer = search_answer.replace(/, /g, ',');
                            search_answer = search_answer.replace(/%20/g, " ");
                            search_answer = search_answer.replace(/%26/g, "&");
                            S_search_id = S_search_id.toString();
                        }

                        if (search_answer == "" || search_answer == null || search_answer == undefined || S_search_id == '0' || search_name == '0') {
                            answer.push("");
                        } else {
                            answer.push(search_answer, decodeURIComponent(S_search_id));
                        }

                        if (jsonObj[i].prop[0].valid == "true" && curr_btn_mode != "save") {
                            if (answer == '' || answer == null || answer == undefined) {
                                mk_animate_border('#div_Search_' + new_id + '', 0, 500, mand_border_color);
                                if (validation < 1) {
                                    autoscroll_form_on_submit("#div_Search_" + new_id + "");
                                }
                                validation++;
                            } else {
                                filled_mand_count++;
                                $('#div_Search_' + new_id + '').css({
                                    "border": "none"
                                });
                            }
                        }
                        else {
                            if (answer == '' || answer == null || answer == undefined) { }
                            else { filled_non_mand_count++; }
                        }
                    }

                    if (global_wcf_url == "https://securitywcf.easyform.in/EF_Service.svc/v1/") {
                        var t_p3 = jsonObj[i].prop;
                    }
                    else {
                        var t_p1 = jsonObj[i].prop;
                        var t_p2 = JSON.stringify(t_p1);
                        var t_p3 = JSON.parse(t_p2);
                        t_p3[0].misc_data[0].value = "";

                        var value_new = jsonObj[i].prop[0].value_new;
                        if (value_new == '' || value_new == null || value_new == undefined) {
                            var Select = JSON.parse(value[0].ColumName[0].subdata[0].Select);
                            var primary_col = Select[0].Simple[0].Column_Name;
                            var field_name = Select[0].Simple[1].Column_Name;

                            value_new = [];
                            value_new.push({
                                push_data: push_data,
                                Target_Id: primary_col,
                                Target_Value: field_name,
                                Fill_Data: Fill_Data
                            });
                            t_p3[0]['value_new'] = value_new;
                        }
                    }
                }

                // Get Single Search Control
                else if (jsonObj[i].type == 21) {

                    // check for validation changed by dep_type = 0
                    var is_valid = $('#div_S_Search_' + new_id + '').attr('valid');
                    if (is_valid == 'false') {
                        var dep_res = "invalid";
                        $('#div_S_Search_' + new_id + '').css({ "border": "none" });
                    }
                    else {
                        var dep_res = "valid";
                    }

                    var answer = [];
                    // if element is hide then don't check validation
                    if ($('#div_S_Search_' + new_id + '').is(':hidden')) {
                        dep_res = "invalid";
                        if (is_hide == "true" || autofill_parent_id != "") {
                            var S_search_answer = $("#search_item_name_S_Search_" + new_id + "").val();
                            if (S_search_answer == "" || S_search_answer == null || S_search_answer == undefined) {
                                answer.push("");
                            } else {
                                answer.push(S_search_answer);
                            }

                            if (jsonObj[i].prop[0].valid == "true" && curr_btn_mode != "save") {
                                if (answer == '' || answer == null || answer == undefined) {
                                    validation = show_hidden_cntrl_alert(prop_name, validation, autofill_parent_id);
                                }
                            }

                        } else {
                            answer.push("");
                        }
                        $('#div_S_Search_' + new_id + '').css({
                            "border": "none"
                        });
                    }

                    if (dep_res == "valid") {
                        var S_search_answer = $("#search_item_name_S_Search_" + new_id + "").val();
                        var S_search_name = $("#search_item_name_S_Search_" + new_id + "").attr('name');
                        if (S_search_answer == "" || S_search_answer == null || S_search_answer == undefined) {
                            answer.push("");
                        } else {
                            answer.push(S_search_answer);
                        }

                        if (jsonObj[i].prop[0].valid == "true" && curr_btn_mode != "save") {
                            if (answer == '' || answer == null || answer == undefined || S_search_name == '0') {
                                mk_animate_border('#div_S_Search_' + new_id + '', 0, 500, mand_border_color);
                                if (validation < 1) {
                                    autoscroll_form_on_submit("#div_S_Search_" + new_id + "");
                                }
                                validation++;
                            } else {
                                filled_mand_count++;
                                $('#div_S_Search_' + new_id + '').css({
                                    "border": "none"
                                });
                            }
                        }
                        else {
                            if (answer == '' || answer == null || answer == undefined) { }
                            else { filled_non_mand_count++; }
                        }
                    }

                    if (global_wcf_url == "https://securitywcf.easyform.in/EF_Service.svc/v1/") {
                        var t_p3 = jsonObj[i].prop;
                    }
                    else {
                        var t_p1 = jsonObj[i].prop;
                        var t_p2 = JSON.stringify(t_p1);
                        var t_p3 = JSON.parse(t_p2);
                        t_p3[0].misc_data[0].value = "";
                    }
                }

                // // Get answer of any mathematics equation
                else if (jsonObj[i].type == 22) {

                    // check for validation changed by dep_type = 0
                    var is_valid = $('#div_Inv_Calculate_' + new_id + '').attr('valid');
                    if (is_valid == 'false') {
                        var dep_res = "invalid";
                        $('#div_Inv_Calculate_' + new_id + '').css({ "border": "none" });
                    }
                    else {
                        var dep_res = "valid";
                    }

                    var answer = [];
                    // if element is hide then don't check validation
                    if ($('#div_Inv_Calculate_' + new_id + '').is(':hidden')) {
                        dep_res = "invalid";
                        if (is_hide == "true" || autofill_parent_id != "") {
                            var inv_calc_answer = jsonObj[i].ans;
                            if (Array.isArray(inv_calc_answer)) {
                                inv_calc_answer = inv_calc_answer[0];
                            } else {
                                inv_calc_answer = inv_calc_answer;
                            }

                            if (inv_calc_answer == "" || inv_calc_answer == null || inv_calc_answer == undefined) {
                                answer.push("");
                            } else {

                                // check particular value string 15032023                         
                                if (typeof inv_calc_answer === 'string' || inv_calc_answer instanceof String) {
                                    inv_calc_answer = JSON.parse(inv_calc_answer);
                                }
                                answer.push(inv_calc_answer);
                            }

                            if (jsonObj[i].prop[0].valid == "true" && curr_btn_mode != "save") {
                                if (answer == '' || answer == null || answer == undefined) {
                                    validation = show_hidden_cntrl_alert(prop_name, validation, autofill_parent_id);
                                }
                            }

                        } else {
                            answer.push("");
                        }
                        $('#div_Inv_Calculate_' + new_id + '').css({
                            "border": "none"
                        });
                    }

                    if (dep_res == "valid") {
                        var collapse_Json1 = itemObj._checkStrObj(misc_Array[0].value);  		// check_item
                        
                        collapse_Json1[0].view_type = 1;               //default listview for mobile [22092021] ['0' means tableview & '1' means listview]

                        var inv_display_flag = collapse_Json1[0].view_type;

                        var inv_calc_answer = jsonObj[i].ans;
                        if (Array.isArray(inv_calc_answer)) {
                            inv_calc_answer = inv_calc_answer[0];
                        } else {
                            inv_calc_answer = inv_calc_answer;
                        }

                        if (inv_display_flag == "0") {
                            var rowCount = $('#tbl_row_data_' + new_id + ' tr:visible').length;
                        } else {
                            if (inv_calc_answer == "" || inv_calc_answer == null || inv_calc_answer == undefined || inv_calc_answer == '""') { }
                            else {

                                if (typeof inv_calc_answer === 'string' || inv_calc_answer instanceof String) {
                                    var t_inv_calc_answer = JSON.parse(inv_calc_answer);
                                }
                                else {
                                    var t_inv_calc_answer = inv_calc_answer;
                                }

                                var t_row_finaljson = t_inv_calc_answer[0].row_finaljson;
                                var row_finaljson_len = t_row_finaljson.length;
                                if (t_row_finaljson.length < 1) {
                                    inv_calc_answer = "";
                                }
                                else {
                                    var check_form_type = $("#div_Inv_Calculate_" + new_id + "").attr('form_mode');
                                    if (check_form_type == "readsurvey") {
                                        for (p = 0; p < t_row_finaljson.length; p++) {
                                            var t_edt_btn_json = t_row_finaljson[p].json_type_22[0].edt_btn_json;

                                            var new_edt_btn_json = [];
                                            for (t = 0; t < t_edt_btn_json.length; t++) {
                                                var type22_row_type = t_edt_btn_json[t].type;
                                                var type22_row_queid = t_edt_btn_json[t].que_id;
                                                var type22_row_ans = t_edt_btn_json[t].ans;

                                                // resolve duplicate answer in single searchable in invoice 03012022
                                                if (t_edt_btn_json.length == 1) {
                                                    var t_txt_row = t_row_finaljson[p].json_type_22[0].txt_row;
                                                    var t20_txt_row_value = t_txt_row[t].txt_row_value;

                                                    if (type22_row_ans[0] != t20_txt_row_value) {
                                                        var txt_row_id = t_txt_row[t].txt_row_id;
                                                        type22_row_ans[1] = txt_row_id;
                                                        type22_row_ans[0] = t20_txt_row_value;
                                                    }
                                                }

                                                new_edt_btn_json.push({
                                                    type: type22_row_type,
                                                    que_id: type22_row_queid,
                                                    ans: type22_row_ans
                                                });
                                            }

                                            t_row_finaljson[p].json_type_22[0].edt_btn_json = new_edt_btn_json;
                                        }

                                        t_inv_calc_answer[0].row_finaljson = t_row_finaljson;
                                        inv_calc_answer = JSON.stringify(t_inv_calc_answer);
                                    }
                                }
                            }
                        }


                        if ((curr_btn_mode == "savenexit" && server_call_flag == 0) || (curr_btn_mode == "savenexit" && server_call_flag == 1) ||
                            (curr_btn_mode == "saveonly" && server_call_flag == 0) || (curr_btn_mode == "saveonly" && server_call_flag == 1) ||
                            curr_btn_mode == "save") { }
                        else {
                            // check for minimum invoice records if configured - mk - 01042025
                            var tbl_length = $('#tbl_row_data_' + new_id + ' tr[id^=tr_row_for_delete_]:visible').length;
                            var li_length = $('#div_list_display_' + new_id + ' li[id^=tr_row_for_delete_]:visible').length;
                            var min_record = $("#hdn_btn_congfiure_" + new_id + "").attr('min_record');
                            if (min_record == '' || min_record == null || min_record == undefined) { }
                            else {
                                if (typeof min_record == "string") {
                                    min_record = parseInt(min_record);
                                }

                                if (inv_display_flag == "0") {
                                    // 0 means table view but fixed list view
                                    if (tbl_length < min_record) {
                                        inv_calc_answer = "";

                                        alert1("Minimum " + min_record + " records are required for " + prop_name);
                                    }
                                }
                                else {
                                    if (li_length < min_record) {
                                        inv_calc_answer = "";

                                        alert1("Minimum " + min_record + " records are required for " + prop_name);
                                    }
                                }
                            }
                        }

                        if (inv_calc_answer == "" || inv_calc_answer == null || inv_calc_answer == undefined || rowCount == "1" || row_finaljson_len == 0) {
                            answer.push("");
                        } else {

                            // check particular value string 15032023                          
                            if (typeof inv_calc_answer === 'string' || inv_calc_answer instanceof String) {
                                inv_calc_answer = JSON.parse(inv_calc_answer);
                            }
                            answer.push(inv_calc_answer);
                        }

                        if (jsonObj[i].prop[0].valid == "true" && curr_btn_mode != "save") {
                            if (answer == '' || answer == null || answer == undefined) {
                                mk_animate_border('#div_Inv_Calculate_' + new_id + '', 0, 500, mand_border_color);
                                if (validation < 1) {
                                    autoscroll_form_on_submit("#div_Inv_Calculate_" + new_id + "");
                                }
                                validation++;
                            } else {
                                filled_mand_count++;
                                $('#div_Inv_Calculate_' + new_id + '').css({
                                    "border": "none"
                                });
                            }
                        }
                        else {
                            if (answer == '' || answer == null || answer == undefined) { }
                            else { filled_non_mand_count++; }
                        }
                    }

                    if (global_wcf_url == "https://securitywcf.easyform.in/EF_Service.svc/v1/") {
                        var t_p3 = jsonObj[i].prop;
                    }
                    else {
                        var t_p1 = jsonObj[i].prop;
                        var t_p2 = JSON.stringify(t_p1);
                        var t_p3 = JSON.parse(t_p2);
                        t_p3[0].misc_data[0].value = "";

                        var value_new = jsonObj[i].prop[0].value_new;
                        if (value_new == '' || value_new == null || value_new == undefined) {
                            value_new = [];
                            value_new.push({
                                push_data: push_data
                            });
                            t_p3[0]['value_new'] = value_new;
                        }
                    }
                }

                // // Get old step collapsible step in current type div
                else if (jsonObj[i].type == 23) {
                    var answer = [""];
                }

                // // print
                else if (jsonObj[i].type == 24) {
                    var answer = [""];
                }

                // scanner
                else if (jsonObj[i].type == 25) {

                    // check for validation changed by dep_type = 0
                    var is_valid = $('#div_scn_' + new_id + '').attr('valid');
                    if (is_valid == 'false') {
                        var dep_res = "invalid";
                        $('#div_scn_' + new_id + '').css({ "border": "none" });
                    }
                    else {
                        var dep_res = "valid";
                    }

                    var answer = [];
                    // if element is hide then don't check validation
                    if ($('#div_scn_' + new_id + '').is(':hidden')) {
                        dep_res = "invalid";
                        if (is_hide == "true" || autofill_parent_id != "") {
                            var scan_answer = $("#scn_" + new_id + "").val();
                            if (scan_answer == null) {
                                scan_answer = '';
                            }
                            answer.push(scan_answer);

                            if (jsonObj[i].prop[0].valid == "true" && curr_btn_mode != "save") {
                                if (answer == '' || answer == null || answer == undefined) {
                                    validation = show_hidden_cntrl_alert(prop_name, validation, autofill_parent_id);
                                }
                            }
                        } else {
                            answer.push("");
                        }
                        $('#div_scn_' + new_id + '').css({
                            "border": "none"
                        });
                    }

                    if (dep_res == "valid") {
                        var scan_answer = $("#scn_" + new_id + "").val();
                        if (scan_answer == null) {
                            scan_answer = '';
                        }
                        answer.push(scan_answer);
                        if (jsonObj[i].prop[0].valid == "true" && curr_btn_mode != "save") {
                            if (answer == '' || answer == null || answer == undefined) {
                                mk_animate_border('#div_scn_' + new_id + '', 0, 500, mand_border_color);
                                if (validation < 1) {
                                    autoscroll_form_on_submit("#div_scn_" + new_id + "");
                                }
                                validation++;
                            } else {
                                filled_mand_count++;
                                $('#div_scn_' + new_id + '').css({
                                    "border": "none"
                                });
                            }
                        }
                        else {
                            if (answer == '' || answer == null || answer == undefined) { }
                            else { filled_non_mand_count++; }
                        }
                    }
                }

                // doc upload
                else if (jsonObj[i].type == 26) {

                    // check for validation changed by dep_type = 0
                    var is_valid = $('#div_upload_doc_' + new_id + '').attr('valid');
                    if (is_valid == 'false') {
                        var dep_res = "invalid";
                        $('#div_upload_doc_' + new_id + '').css({ "border": "none" });
                    }
                    else {
                        var dep_res = "valid";
                    }

                    var answer = [];
                    // if element is hide then don't check validation
                    if ($('#div_upload_doc_' + new_id + '').is(':hidden')) {
                        dep_res = "invalid";
                        if (is_hide == "true" || autofill_parent_id != "") {
                            var up_answer = $("#lbl_up_" + new_id + "").attr('for');
                            if (up_answer == '' || up_answer == null || up_answer == undefined) {
                                up_answer = '';
                                answer.push(up_answer);
                            }
                            else {
                                var up_obj = JSON.parse(up_answer);
                                var sys_file_name = up_obj[0].sys_file_name;
                                var file_path = up_obj[0].file_path;
                                var act_file_name = up_obj[0].act_file_name;
                                var sharepoint_link = up_obj[0].sharepoint_link;
                                var photo_id = up_obj[0].photo_id;
                                var photo_size = up_obj[0].photo_size;
                                answer.push(act_file_name, sys_file_name, file_path, sharepoint_link, photo_id, photo_size);
                            }

                            if (jsonObj[i].prop[0].valid == "true" && curr_btn_mode != "save") {
                                if (answer == '' || answer == null || answer == undefined) {
                                    validation = show_hidden_cntrl_alert(prop_name, validation, autofill_parent_id);
                                }
                            }
                        }
                        else {
                            answer.push("");
                        }
                        $('#div_upload_doc_' + new_id + '').css({
                            "border": "none"
                        });
                    }

                    if (dep_res == "valid") {
                        var up_answer = $("#lbl_up_" + new_id + "").attr('for');
                        if (up_answer == '' || up_answer == null || up_answer == undefined) {
                            up_answer = '';
                            answer.push(up_answer);
                        }
                        else {
                            up_answer = up_answer.replace(/'/g, '"');
                            var up_obj = JSON.parse(up_answer);
                            var act_file_name = up_obj[0].act_file_name;
                            var file_path = up_obj[0].file_path;
                            var sys_file_name = up_obj[0].sys_file_name;
                            var sharepoint_link = up_obj[0].sharepoint_link;
                            var photo_id = up_obj[0].photo_id;
                            var photo_size = up_obj[0].photo_size;
                            answer.push(act_file_name, file_path, sys_file_name, sharepoint_link, photo_id, photo_size);
                        }

                        if (jsonObj[i].prop[0].valid == "true" && curr_btn_mode != "save") {
                            if (answer == '' || answer == null || answer == undefined) {
                                mk_animate_border('#div_upload_doc_' + new_id + '', 0, 500, mand_border_color);
                                if (validation < 1) {
                                    autoscroll_form_on_submit("#div_upload_doc_" + new_id + "");
                                }
                                validation++;
                            } else {
                                filled_mand_count++;
                                $('#div_upload_doc_' + new_id + '').css({ "border": "none" });
                            }
                        }
                        else {
                            if (answer == '' || answer == null || answer == undefined) { }
                            else { filled_non_mand_count++; }
                        }
                    }
                }

                // pdf viewer
                else if (jsonObj[i].type == 27) {

                    // check for validation changed by dep_type = 0
                    var is_valid = $('#div_pdfviewer_' + new_id + '').attr('valid');
                    if (is_valid == 'false') {
                        var dep_res = "invalid";
                        $('#div_pdfviewer_' + new_id + '').css({ "border": "none" });
                    }
                    else {
                        var dep_res = "valid";
                    }

                    var answer = [];
                    // if element is hide then don't check validation
                    if ($('#div_pdfviewer_' + new_id + '').is(':hidden')) {
                        dep_res = "invalid";
                        if (is_hide == "true" || autofill_parent_id != "") {
                            var pdf_answer = jsonObj[i].ans;
                            if (pdf_answer == "" || pdf_answer == null || pdf_answer == undefined) {
                                answer.push("");
                            } else {
                                answer = pdf_answer;
                            }

                            if (jsonObj[i].prop[0].valid == "true" && curr_btn_mode != "save") {
                                if (answer == '' || answer == null || answer == undefined) {
                                    validation = show_hidden_cntrl_alert(prop_name, validation, autofill_parent_id);
                                }
                            }
                        } else {
                            answer.push("");
                        }
                        $('#div_pdfviewer_' + new_id + '').css({
                            "border": "none"
                        });
                    }

                    if (dep_res == "valid") {
                        var pdf_answer = jsonObj[i].ans;
                        if (pdf_answer == "" || pdf_answer == null || pdf_answer == undefined) {
                            answer.push("");
                        } else {
                            answer = pdf_answer;
                        }
                        if (jsonObj[i].prop[0].valid == "true" && curr_btn_mode != "save") {
                            if (answer == '' || answer == null || answer == undefined) {
                                mk_animate_border('#div_pdfviewer_' + new_id + '', 0, 500, mand_border_color);
                                if (validation < 1) {
                                    autoscroll_form_on_submit("#div_pdfviewer_" + new_id + "");
                                }
                                validation++;
                            } else {
                                filled_mand_count++;
                                $('#div_pdfviewer_' + new_id + '').css({
                                    "border": "none"
                                });
                            }
                        }
                        else {
                            if (answer == '' || answer == null || answer == undefined) { }
                            else { filled_non_mand_count++; }
                        }
                    }
                }

                // Video Capture
                else if (jsonObj[i].type == 28) {

                    // check for validation changed by dep_type = 0
                    var is_valid = $('#div_video_' + new_id + '').attr('valid');
                    if (is_valid == 'false') {
                        var dep_res = "invalid";
                        $('#div_video_' + new_id + '').css({ "border": "none" });
                    }
                    else {
                        var dep_res = "valid";
                    }

                    var answer = [];
                    // if element is hide then don't check validation
                    if ($('#div_video_' + new_id + '').is(':hidden')) {
                        dep_res = "invalid";
                        if (is_hide == "true" || autofill_parent_id != "") {
                            var video_answer = jsonObj[i].ans;
                            if (video_answer == "" || video_answer == null || video_answer == undefined) {
                                answer.push("");
                            } else {
                                answer = video_answer;
                            }

                            if (jsonObj[i].prop[0].valid == "true" && curr_btn_mode != "save") {
                                if (answer == '' || answer == null || answer == undefined) {
                                    validation = show_hidden_cntrl_alert(prop_name, validation, autofill_parent_id);
                                }
                            }
                        } else {
                            answer.push("");
                        }
                        $('#div_video_' + new_id + '').css({
                            "border": "none"
                        });
                    }

                    if (dep_res == "valid") {
                        var video_answer = jsonObj[i].ans;
                        if (video_answer == "" || video_answer == null || video_answer == undefined) {
                            answer.push("");
                        } else {
                            answer = video_answer;
                        }
                        if (jsonObj[i].prop[0].valid == "true" && curr_btn_mode != "save") {
                            if (answer == '' || answer == null || answer == undefined) {
                                mk_animate_border('#div_video_' + new_id + '', 0, 500, mand_border_color);
                                if (validation < 1) {
                                    autoscroll_form_on_submit("#div_video_" + new_id + "");
                                }
                                validation++;
                            } else {
                                filled_mand_count++;
                                $('#div_video_' + new_id + '').css({
                                    "border": "none"
                                });
                            }
                        }
                        else {
                            if (answer == '' || answer == null || answer == undefined) { }
                            else { filled_non_mand_count++; }
                        }
                    }
                }

                //Trip info
                else if (jsonObj[i].type == 29) {
                    var trip_ans = $("#trip_info_tbl > tbody > tr > td").html();              //actual distance of trip
                    if (trip_ans == "" || trip_ans == null || trip_ans == undefined) {
                        trip_ans = "";
                    }

                    var answer = [];
                    answer.push(trip_ans);
                }

                // dynamic dropdown
                else if (jsonObj[i].type == 30) {

                    // check for validation changed by dep_type = 0
                    var is_valid = $('#div_dynddl_' + new_id + '').attr('valid');
                    if (is_valid == 'false') {
                        var dep_res = "invalid";
                        $('#div_dynddl_' + new_id + '').css({ "border": "none" });
                    }
                    else {
                        var dep_res = "valid";
                    }

                    var answer = [];
                    var view_type = misc_Array[0].view_type;
                    if (view_type == '' || view_type == null || view_type == undefined) {
                        view_type = 'dropdownview';
                    }

                    // if element is hide then don't check validation
                    if ($('#div_dynddl_' + new_id + '').is(':hidden')) {
                        dep_res = "invalid";
                        if (is_hide == "true" || autofill_parent_id != "") {
                            if (view_type == 'dropdownview') {
                                var dynddl_answer = $("#dynddl_" + new_id + " :selected").text();
                                var dynddl_answer_val = $("#dynddl_" + new_id + "").val();
                            }
                            else if (view_type == 'textview' || view_type == 'numericview') {
                                var dynddl_answer = $('#dynddl_txt_' + new_id + '').val();
                            }
                            else {
                                var row_len = $('#tbl_dynddl_' + new_id + ' tr').length;
                                if (row_len > 0) {
                                    // putting whole table html in answer
                                    var dynddl_answer = document.getElementById('tbl_dynddl_' + new_id + '').innerHTML;
                                }
                                else {
                                    var dynddl_answer = '0';
                                }
                            }
                            if (dynddl_answer == '0') {
                                dynddl_answer = '';
                            }
                            answer.push(dynddl_answer);

                            if (jsonObj[i].prop[0].valid == "true" && curr_btn_mode != "save") {
                                if (answer == '' || answer == null || answer == undefined) {
                                    validation = show_hidden_cntrl_alert(prop_name, validation, autofill_parent_id);
                                }
                            }
                        } else {
                            answer.push("");
                        }
                        $('#div_dynddl_' + new_id + '').css({ "border": "none" });
                    }

                    if (dep_res == "valid") {
                        if (view_type == 'dropdownview') {
                            var dynddl_answer = $("#dynddl_" + new_id + " :selected").text();
                            var dynddl_answer_val = $("#dynddl_" + new_id + "").val();
                        }
                        else if (view_type == 'textview' || view_type == 'numericview') {
                            var dynddl_answer = $('#dynddl_txt_' + new_id + '').val();
                        }
                        else {
                            var row_len = $('#tbl_dynddl_' + new_id + ' tr').length;
                            if (row_len > 0) {
                                // putting whole table html in answer
                                var dynddl_answer = document.getElementById('tbl_dynddl_' + new_id + '').innerHTML;
                            }
                            else {
                                var dynddl_answer = '0';
                            }
                        }
                        if (dynddl_answer == '0' && view_type == 'dropdownview') {
                            dynddl_answer = '';
                        }

                        var dynddl_dependency = $("#div_dynddl_" + new_id + "").attr("name");
                        if ((dynddl_dependency == "" || dynddl_dependency == null || dynddl_dependency == undefined || dynddl_dependency == "[{") && view_type == 'dropdownview') {
                            dynddl_dependency = '';
                            dynddl_answer = "";
                        }

                        if (dynddl_answer == '' || dynddl_answer == null || dynddl_answer == undefined || dynddl_answer == ' ' || (dynddl_answer == '"--- Choose Value ---"' && view_type == 'dropdownview') || (dynddl_answer_val == '0' && view_type == 'dropdownview') || (dynddl_answer == '0' && view_type == 'dropdownview')) {
                            answer.push("");
                        }
                        else {
                            answer.push(dynddl_answer, dynddl_dependency, dynddl_answer_val);
                        }

                        if (jsonObj[i].prop[0].valid == "true" && curr_btn_mode != "save") {
                            if (answer == '' || answer == null || answer == undefined) {
                                mk_animate_border('#div_dynddl_' + new_id + '', 0, 500, mand_border_color);
                                if (validation < 1) {
                                    autoscroll_form_on_submit("#div_dynddl_" + new_id + "");
                                }
                                validation++;
                            } else {
                                filled_mand_count++;
                                $('#div_dynddl_' + new_id + '').css({ "border": "none" });
                            }
                        }
                        else {
                            if (answer == '' || answer == null || answer == undefined) { }
                            else { filled_non_mand_count++; }
                        }
                    }
                }

                // Note
                else if (jsonObj[i].type == 31) {
                    var answer = jsonObj[i].ans;
                }

                // Email SMS
                else if (jsonObj[i].type == 32) {
                    var answer = jsonObj[i].ans;
                }

                // Auto Incremental ID
                else if (jsonObj[i].type == 33) {

                    // check for validation changed by dep_type = 0
                    var is_valid = $('#div_AutoInc_' + new_id + '').attr('valid');
                    if (is_valid == 'false') {
                        var dep_res = "invalid";
                        $('#div_AutoInc_' + new_id + '').css({ "border": "none" });
                    }
                    else {
                        var dep_res = "valid";
                    }

                    var answer = [];
                    // if element is hide then don't check validation
                    if ($('#div_AutoInc_' + new_id + '').is(':hidden')) {
                        dep_res = "invalid";
                        if (is_hide == "true" || autofill_parent_id != "") {
                            var AI_answer = $("#txtAutoInc_" + new_id + "").val();
                            if (AI_answer == '' || AI_answer == null || AI_answer == undefined) {
                                AI_answer = "";
                            }
                            answer.push(AI_answer);

                            if (jsonObj[i].prop[0].valid == "true" && curr_btn_mode != "save") {
                                if (answer == '' || answer == null || answer == undefined) {
                                    validation = show_hidden_cntrl_alert(prop_name, validation, autofill_parent_id);
                                }
                            }
                        }
                        else {
                            answer.push("");
                        }
                        $('#div_AutoInc_' + new_id + '').css({
                            "border": "none"
                        });
                    }

                    if (dep_res == "valid") {
                        var AI_answer = $("#txtAutoInc_" + new_id + "").val();
                        if (AI_answer == '' || AI_answer == null || AI_answer == undefined) {
                            AI_answer = "";
                        }
                        answer.push(AI_answer);
                        if (jsonObj[i].prop[0].valid == "true" && curr_btn_mode != "save") {
                            if (answer == '' || answer == null || answer == undefined) {
                                mk_animate_border('#div_AutoInc_' + new_id + '', 0, 500, mand_border_color);
                                if (validation < 1) {
                                    autoscroll_form_on_submit("#div_AutoInc_" + new_id + "");
                                }
                                validation++;
                            } else {
                                $('#div_AutoInc_' + new_id + '').css({
                                    "border": "none"
                                });
                            }
                        }
                    }
                }

                // Event control
                else if (jsonObj[i].type == 34) {
                    var answer = jsonObj[i].ans;
                }

                // RF Tracking control
                else if (jsonObj[i].type == 35) {
                    var answer = jsonObj[i].ans;
                }

                // Checklist control
                else if (jsonObj[i].type == 36) {
                    var is_valid = $('#div_chklst_' + new_id + '').attr('valid');
                    if (is_valid == 'false') {
                        var dep_res = "invalid";
                        $('#div_chklst_' + new_id + '').css({ "border": "none" });
                    }
                    else {
                        var dep_res = "valid";
                    }

                    var answer = [];
                    var selected = [], value = [];

                    // if element is hide then don't check validation
                    if ($('#div_chklst_' + new_id + '').is(':hidden')) {
                        dep_res = "invalid";
                        if (is_hide == "true" || autofill_parent_id != "") {
                            // -------- selected checkbox DV-22042024
                            var checkbox = $('#items_' + new_id + '').find("input")
                            var checked_box = 0;
                            for (j = 0; j < checkbox.length; j++) {
                                if (checkbox[j].checked) {
                                    selected.push(checkbox[j].value);
                                    checked_box++;
                                }
                            }
                            if (checked_box == 0) {
                                selected.push("");
                            }

                            // -------- get label value DV-2202024
                            var chklst_li = $('#items_' + new_id + '').find("li");
                            var chklst_val_found = 0;
                            for (k = 0; k < chklst_li.length; k++) {
                                var chklst_val = chklst_li[k].innerText;
                                if (chklst_val == "" || chklst_val == null || chklst_val == undefined) { }
                                else {
                                    value.push(chklst_val);
                                    chklst_val_found++;
                                }
                            }
                            if (chklst_val_found == 0) {
                                selected.push("");
                            }

                            if (checked_box == 0) {
                                var ans_json = [];
                                ans_json[0] = [];
                                ans_json[1] = [];
                                answer = ans_json;
                            }
                            else {
                                var ans_json = [];
                                ans_json[0] = selected;
                                ans_json[1] = value;
                                answer = ans_json;
                            }
                        }
                        else {
                            var ans_json = [];
                            ans_json[0] = [];
                            ans_json[1] = [];
                            answer = ans_json;
                        }
                        $('#div_chklst_' + new_id + '').css({
                            "border": "none"
                        });
                    }

                    if (dep_res == "valid") {
                        var checked_box = 0;

                        // ---------- selected checkbox DV-22042024
                        var checkbox = $('#items_' + new_id + '').find("input")
                        for (j = 0; j < checkbox.length; j++) {
                            if (checkbox[j].checked) {
                                selected.push(checkbox[j].value);
                                checked_box++;
                            }
                        }
                        if (checked_box == 0) {
                            selected.push("");
                        }

                        // ----------- get label value DV-2202024
                        var chklst_li = $('#items_' + new_id + '').find("li");
                        var chklst_val_found = 0;
                        for (k = 0; k < chklst_li.length; k++) {
                            var chklst_val = chklst_li[k].innerText;
                            if (chklst_val == "" || chklst_val == null || chklst_val == undefined) { }
                            else {
                                value.push(chklst_val);
                                chklst_val_found++;
                            }
                        }
                        if (chklst_val_found == 0) {
                            selected.push("");
                        }

                        if (checked_box == 0) {
                            var ans_json = [];
                            ans_json[0] = [];
                            ans_json[1] = [];
                            answer = ans_json;
                        }
                        else {
                            var ans_json = [];
                            ans_json[0] = selected;
                            ans_json[1] = value;
                            answer = ans_json;
                        }

                        if (jsonObj[i].prop[0].valid == "true" && curr_btn_mode != "save") {
                            if (checked_box < 1) {
                                mk_animate_border('#checklist_' + new_id + '', 0, 500, mand_border_color);
                                if (validation < 1) {
                                    autoscroll_form_on_submit("#checklist_" + new_id + "");
                                }
                                validation++;
                            } else {
                                $('#checklist_' + new_id + '').css({
                                    "border": "none"
                                });
                            }
                        }
                        else {
                        }
                    }
                }

                // sub task control
                else if (jsonObj[i].type == 37) {
                    var answer = [""];
                }

                // Map view
                else if (jsonObj[i].type == 38) {
                    var answer = [""];
                }

                // Weather 
                else if (jsonObj[i].type == 39) {
                    let weather_str = $('#hdn_weather_card_view').val();
                    let weather_data = JSON.parse(decodeURIComponent(weather_str));
                    var answer = weather_data;
                }

                // Live link
                else if (jsonObj[i].type == 40) {

                    var is_valid = $('#div_livelink_' + new_id + '').attr('valid');
                    if (is_valid == 'false') {
                        var dep_res = "invalid";
                        $('#div_livelink_' + new_id + '').css({ "border": "none" });
                    }
                    else {
                        var dep_res = "valid";
                    }

                    var answer = [];
                    if (dep_res == "valid") {
                        var ll_answer = $("#livelink_video_" + new_id + "").attr("watched");
                        if (ll_answer == "" || ll_answer == null || ll_answer == undefined || ll_answer == "0") {
                            answer.push("");
                        } else {
                            let ll_src = $("#livelink_video_" + new_id + "").find("source").attr("src");
                            let ll_download_src = $("#livelink_video_" + new_id + "").attr("download_link");
                            answer.push(ll_src, ll_download_src);
                        }
                        if (jsonObj[i].prop[0].valid == "true" && curr_btn_mode != "save") {
                            if (answer == '' || answer == null || answer == undefined) {
                                mk_animate_border('#div_livelink_' + new_id + '', 0, 500, mand_border_color);
                                if (validation < 1) {
                                    autoscroll_form_on_submit("#div_livelink_" + new_id + "");
                                }
                                validation++;
                            } else {
                                filled_mand_count++;
                                $('#div_livelink_' + new_id + '').css({
                                    "border": "none"
                                });
                            }
                        }
                        else {
                            if (answer == '' || answer == null || answer == undefined) { }
                            else { filled_non_mand_count++; }
                        }
                    }
                }






                //---common json for all controls-------- [16062021]
                if (control_type == 500) { }
                else {

                    // check for character limitation 18022022
                    if (answer == "" || answer == null || answer == undefined) { }
                    else {
                        var ans_text = answer[0];
                        var char_len = ans_text.length;
                        if (control_type == 0 || control_type == 5 || control_type == 10 || control_type == 7 || control_type == 9 || control_type == 13 || control_type == 26 || control_type == 22 || control_type == 23 || control_type == 24 || control_type == 27 || control_type == 31) {
                            // don't check length
                        }
                        else {
                            if (control_type == 4 || control_type == 12) {
                                if (char_len > 20) {
                                    alert1("" + prop_name + " must not exceed 20 characters!");
                                    loading_hide();
                                    return false;
                                }
                            }
                            else {
                                if (char_len > 500) {
                                    alert1("" + prop_name + " must not exceed 500 characters!");
                                    loading_hide();
                                    return false;
                                }
                            }
                        }
                    }

                    json.push({
                        type: control_type,
                        que_id: control_que_id,
                        ans: answer
                    });
                }

                //------duplicate answer validation for ATC [26042021]
                if (control_type == 0 || control_type == 5 || control_type == 10 || control_type == 31 || control_type == 32 || control_type == 34 || control_type == 500) { }
                else {
                    if (check_duplicate == "true") {
                        if (control_type == 7 || control_type == 9 || control_type == 26 || control_type == 28) {
                            var final_ans = answer[4];
                        }
                        else {
                            var final_ans = answer[0];
                        }
                        if (final_ans == "" || final_ans == null || final_ans == undefined) {
                            final_ans = "";
                        }

                        if (final_ans != "") {
                            //var is_duplicate = check_dup_ans_ary.includes(final_ans);
                            //if (!is_duplicate) {
                            //    check_dup_ans_ary.push(final_ans);
                            //}
                            //else {
                            //    alert("[" + prop_name_str + "] answer should be unique !");
                            //    is_duplicate = 1;
                            //    break;
                            //}
                            check_dup_ans_ary.push({
                                ans: final_ans,
                                prop_name: prop_name
                            });

                        }
                    }
                    else {
                        if (control_type == 7 || control_type == 9 || control_type == 26) {
                            var final_ans = answer[4];
                        }
                        else {
                            var final_ans = answer[0];
                        }

                        if (final_ans == "" || final_ans == null || final_ans == undefined) {
                            final_ans = "";
                        }
                        else {
                            // get comment statement key  DV-24072023
                            var comment_statement_key = jsonObj[i].comment_statement;
                            if (comment_statement_key == "" || comment_statement_key == null || comment_statement_key == undefined) { }
                            else {

                                var self_val = comment_statement_key.search("<#");
                                if (self_val > -1) {
                                    // replace <#self#>
                                    comment_statement_key = comment_statement_key.replace("<#self#>", final_ans);
                                }

                                var class_val = comment_statement_key.search("<@");
                                if (class_val > -1) {
                                    //replace class <@class_val@>
                                    comment_statement_key = replace_classwith_ans_comment_statement(comment_statement_key);
                                }

                                let last_ans = jsonObj[i].ans[0];
                                if (last_ans == "" || last_ans == null || last_ans == undefined) { }
                                else {
                                    if (final_ans.toString() != last_ans.toString()) {
                                        comment_statement_key = "<span class='cls-cmnt-updated'>" + comment_statement_key + "</span>";
                                    }
                                }

                                comment_state_array.push(comment_statement_key);
                            }
                        }
                    }
                }
            }


            // /for loop end at below curly bracket of elements
        }


        //alert1("validation: " + validation);
        //validation = 0;

        //if (form_flag == 0) {
        //    validation = 10;
        //}

        var c_is_disabled = JSON.parse(storage.getItem('c_is_disabled'));

        // not to check validation for "gotowithoutsave" and "savenexit" action
        if (curr_btn_mode == 'calculate') {
            $("#curr_mand_filled_count").html(filled_mand_count);
            $("#total_mand_count").html(total_mand_count);
            $("#curr_non_mand_filled_count").html(filled_non_mand_count);
            $("#total_non_mand_filled_count").html(total_non_mand_count);
            loading_hide();
        }
        else if (validation < 1 || c_is_disabled == '1' || (other_validation > 0 && curr_btn_mode == "save") || (other_validation == 0 && (curr_btn_mode == "gotowithoutsave" ||
            (curr_btn_mode == "savenexit" && server_call_flag == 0) || (curr_btn_mode == "savenexit" && server_call_flag == 1 && validation < 1) ||
            (curr_btn_mode == "saveonly" && server_call_flag == 0) || (curr_btn_mode == "saveonly" && server_call_flag == 1 && validation < 1) ||
            curr_btn_mode == "save" || curr_btn_mode == "rf" || curr_btn_mode == 'autosave'))) {
            loading_hide();

            setTimeout(function () {
                $("#container_btn_div").find('a').css({ 'cursor': "initial", 'pointer-events': 'initial' });
                $("#container_btn_div").find('a').removeClass('active-state');
            }, 2000);

            //if (is_duplicate == 1) {
            //    var new_prop_name_str = prop_name_str.slice(0, -1);
            //    alert("[" + new_prop_name_str + "] answers are duplicate !");
            //}
            var duplicates_ans_list = [];
            if (check_dup_ans_ary.length > 0) {                         //Duplicate ans validation for ATC [11052021]
                for (i = 0; i < check_dup_ans_ary.length; i++) {
                    for (j = i + 1; j < check_dup_ans_ary.length; j++) {
                        if (check_dup_ans_ary[i].ans == check_dup_ans_ary[j].ans) {
                            if (!duplicates_ans_list.includes(check_dup_ans_ary[i].prop_name))
                                duplicates_ans_list.push(check_dup_ans_ary[i].prop_name);
                            if (!duplicates_ans_list.includes(check_dup_ans_ary[j].prop_name))
                                duplicates_ans_list.push(check_dup_ans_ary[j].prop_name);
                        }
                    }
                }
            }
            if (duplicates_ans_list.length > 0) {
                var new_prop_name_str = duplicates_ans_list.toString();
                alert1("[" + new_prop_name_str + "] answers are duplicate !");
            }
            else {
                if (form_flag == 0 || form_flag == 5) {
                    // normal form

                    if (curr_btn_mode == "check_validation_only" && form_flag == 0) {
                        // check validation only when press submit button where type37 control is exist in the checksheet - mk - 26052025
                        Validation_True = 0;
                        loading_hide();
                    }
                    else {
                        if (curr_btn_mode != "exit" && curr_btn_mode != "savenexit" && curr_btn_mode != "saveonly" && curr_btn_mode != "save" && curr_btn_mode != "autosave") {
                            step_Array.push(go_to_chk_no);
                        }

                        curr_survey_data["json"] = json;
                        localStorage.setItem('json', json);

                        if (curr_btn_mode == "save") {
                            var heading = curr_survey_data["heading"];
                            var step = curr_survey_data["step"];
                            var check_type = curr_survey_data["check_type"];
                            var cam_crash_data = [];
                            cam_crash_data.push({
                                heading: heading,
                                check_type: check_type,
                                step: step,
                                data: json,
                                buttons: btnJsonObj
                            });
                            storage.setItem('cam_crash_data', JSON.stringify(cam_crash_data));
                            check_camera_and_redirect();
                        }
                        else if (curr_btn_mode == "rf") {
                            var heading = curr_survey_data["heading"];
                            var step = curr_survey_data["step"];
                            var check_type = curr_survey_data["check_type"];
                            var rf_crash_data = [];
                            rf_crash_data.push({
                                heading: heading,
                                check_type: check_type,
                                step: step,
                                data: json,
                                buttons: btnJsonObj
                            });
                            storage.setItem('rf_crash_data', JSON.stringify(rf_crash_data));

                            var rf_mode_class = localStorage.getItem("rf_mode_class");
                            var rf_new_id = localStorage.getItem("rf_new_id");
                            get_RF_Tracking(rf_mode_class, rf_new_id);
                        }
                        else {
                            if (c_is_disabled == 1) {
                                // read only mode
                                if (curr_btn_mode == "goto" || curr_btn_mode == "gotowithoutsave") {
                                    storage.setItem('step_Array_to_read', JSON.stringify(step_Array.slice(0)));
                                    check_survey_entry_next_read();
                                }
                                else if (curr_btn_mode == "savenexit") {
                                    storage.setItem('step_Array_to_read', JSON.stringify(step_Array.slice(0)));
                                    check_flow_and_redirect();
                                }
                                else if (curr_btn_mode == "saveonly") {
                                    storage.setItem('step_Array_to_read', JSON.stringify(step_Array.slice(0)));
                                }
                                else if (curr_btn_mode == "updatetasknsubmit" || curr_btn_mode == "updatetasknredirect" || curr_btn_mode == "updatetasknautoopentaskform" || curr_btn_mode == "submit" || curr_btn_mode == "reject") {
                                    changeurl("viewsitelist_pm_grouplist.html");
                                }
                            }
                            else {
                                // read-write mode

                                if (curr_btn_mode == "updatetasknsubmit" || curr_btn_mode == "updatetasknredirect" || curr_btn_mode == "updatetasknautoopentaskform" || curr_btn_mode == "submit" || curr_btn_mode == "reject") {
                                    if (F7_device == 'ios') {
                                        var user_choice = true;
                                    }
                                    else {
                                        if (last_submit_button_Array.length > 0) {
                                            // dont confirm checksheet submit in case of sub task control + submit - mk - 18072024
                                            var user_choice = true;
                                        }
                                        else {

                                            if (curr_btn_mode == "updatetasknsubmit" || curr_btn_mode == "updatetasknredirect" || curr_btn_mode == "updatetasknautoopentaskform" || curr_btn_mode == "submit") {
                                                vibrate_device();
                                                //var user_choice = confirm("Are you sure, you want to submit this Checksheet?");
                                                var user_choice = true;
                                            }
                                            else {
                                                vibrate_device();
                                                var user_choice = confirm("Are you sure, you want to reject this task?");
                                            }
                                        }
                                    }
                                    if (user_choice == true) {
                                        cordova.exec(showValuesSuccessCallBack_latlong, showValuesFailCallBack_Temp, 'maulik', 'nck', ["ds"]);
                                    }
                                }
                                else {
                                    var user_choice = true;
                                    if (curr_btn_mode == "savenexit") {
                                        var data_json = JSON.parse(storage.getItem('list_json'));
                                        var list_data = JSON.parse(data_json);
                                        var savenexit_log_removal_hours = list_data[0].savenexit_log_removal_hours;
                                        if (savenexit_log_removal_hours == "" || savenexit_log_removal_hours == null || savenexit_log_removal_hours == undefined) { }
                                        else {
                                            vibrate_device();
                                            user_choice = confirm("Saved data will be available only for " + savenexit_log_removal_hours + " hours and will be erased post that, Do you want to continue?");
                                        }
                                    }
                                    if (user_choice == true) {
                                        cordova.exec(showValuesSuccessCallBack_latlong, showValuesFailCallBack_Temp, 'maulik', 'nck', ["ds"]);
                                    }
                                }
                            }
                        }
                    }
                }
                else if (form_flag == 1) {
                    // type 22
                    var inv_display_flag_1 = inv_display_flag_array[go_to_chk_no];
                    var inv_Calc_new_1 = inv_Calc_new_array[go_to_chk_no];

                    var last_index = $('#row_index_' + type22_new_id + '').val();
                    last_index = parseInt(last_index);
                    var t_row_index_no = last_index + 1;
                    $('#row_index_' + type22_new_id + '').val(t_row_index_no);

                    if (inv_display_flag_1 == 0) {

                        var max_record = $("#hdn_btn_congfiure_" + inv_Calc_new_1 + "").attr('max_record');
                        if (max_record == '' || max_record == null || max_record == undefined) {
                            add_row_to_table_by_popup(go_to_chk_no, json);
                        }
                        else {
                            if (typeof max_record == "string") {
                                max_record = parseInt(max_record);
                            }

                            var tbl_lng = $('#tbl_row_data_' + inv_Calc_new_1 + ' tr[id^=tr_row_for_delete_]:visible').length;
                            if (max_record <= tbl_lng) {
                                var hdn_json = $('#hdn_jsonObj_type22_' + inv_Calc_new_1 + '').val();
                                var hdn_json_parse = JSON.parse(hdn_json);
                                var excel_header = hdn_json_parse[1].Excel_Header;
                                alert1('You can add maximum ' + max_record + ' ' + excel_header);
                            }
                            else {
                                add_row_to_table_by_popup(go_to_chk_no, json);
                            }
                        }
                    }
                    else {
                        //from readchecksheet (fresh add)
                        add_row_to_listview_by_popup(go_to_chk_no, json);
                    }
                }
                else if (form_flag == 2) {
                    // type 22
                }
                else if (form_flag == 3) {
                    // type 23 popup div container
                    check_update_outer_element_flag(json);
                }
                else if (form_flag == 4) {
                    // type 22 popup div container

                    //dependency_array_count_type22 = 0;          //set default zero to remove dependency in type 22 popup in listview(Refer: https://trello.com/c/ORH0FQNn/912-add-new-dependancy-key-in-type22?menu=filter&filter=member:mukeshm2,member:foramsky1)

                    var inv_display_flag_1 = inv_display_flag_array[go_to_chk_no];
                    if (dependency_array_count_type22 > 0 && inv_display_flag_1 != 0) {
                        // if dependency in type 22 listview only======= //from readsurvey (edit mode)
                        display_edit_value_to_table_with_dependency(json, go_to_chk_no);
                    }
                    else {
                        display_edit_value_to_table(json, go_to_chk_no);
                    }
                }
                else if (form_flag == 6 || form_flag == 14) {
                    // create task

                    var heading = curr_survey_data["heading"];
                    var step = curr_survey_data["step"];
                    var check_type = curr_survey_data["check_type"];
                    var cam_crash_data = [];
                    cam_crash_data.push({
                        heading: heading,
                        check_type: check_type,
                        step: step,
                        data: json,
                        buttons: btnJsonObj
                    });
                    storage.setItem('cam_crash_data', JSON.stringify(cam_crash_data));

                    if (is_attendance_task == 1) {
                        // attendance task create through notification

                        var q_jsonobj = [];
                        q_jsonobj.push({
                            data: json,
                            Photo_Id_Array: Photo_Id_Array
                        });

                        cordova.exec(function (e) {
                            // successfull attendance task create

                            var AttendanceJson = JSON.parse(localStorage.getItem('AttendanceJson'));
                            var auto_trip = AttendanceJson[0].auto_trip;
                            if (auto_trip == "true") {
                                var myArray = JSON.parse(e);
                                var t_tid = myArray[0].tid;
                                auto_start_trip_on_attendane_task_create(t_tid);
                            }
                            else {
                                var uniqcode = storage.getItem('uniqcode');
                                if (uniqcode == "" || uniqcode == null || uniqcode == undefined) {
                                    changeurl("login.html");
                                }
                                else {
                                    changeurl("selection.html");
                                }
                            }

                        }, onfail, 'AttendanceTaskCreatePlugin', '', q_jsonobj);
                    }
                    else {
                        // normal task create
                        if (curr_btn_mode == "save") {
                            check_camera_and_redirect();
                        }
                        else {
                            var finaljsonObj = [];
                            finaljsonObj.push({
                                data: json
                            });

                            ap_json = finaljsonObj;

                            var data_json = JSON.parse(storage.getItem('list_json'));
                            var list_data = JSON.parse(data_json);
                            var survey_mode = list_data[0].survey_mode;
                            var redirect = list_data[0].redirect;

                            var task_mode = localStorage.getItem('task_mode');
                            if (task_mode == "edit") {
                                if (survey_mode == "online") {
                                    // update task online   (online then offline both)
                                    var btn_status = curr_survey_data["createtask"];
                                    update_online_task_servercall(btn_status);
                                }
                                else {
                                    //edit task locally
                                    update_online_offline_task();
                                }
                            }
                            else {
                                if (Type34_Event_Array.length > 0) {
                                    add_event_on_submit();
                                }
                                else {
                                    var auto_trip = list_data[0].auto_trip;
                                    if (auto_trip == 'true') {
                                        // Auto trip start
                                        myApp.showPreloader('Initializing Trip...');
                                        var locObj = new MkLocation();
                                        locObj._getLocation(function (e) {
                                            temp_location_Array = e;

                                            var t_tid = JSON.parse(storage.getItem('tid'));
                                            var t_ser_task_id = JSON.parse(storage.getItem('server_task_id'));
                                            localStorage.setItem('trip_status', '0');
                                            localStorage.setItem('trip_tid', t_tid);
                                            localStorage.setItem('trip_ser_task_id', t_ser_task_id);

                                            let vehicle_type = "";
                                            for (let vt = 0; vt < json.length; vt++) {
                                                let vt_qid = json[vt].que_id;
                                                if (vt_qid == "1109") {
                                                    let t_ans = json[vt].ans[0];
                                                    if (t_ans == "" || t_ans == null || t_ans == undefined) { }
                                                    else {
                                                        vehicle_type = t_ans; 
                                                    }
                                                    break;
                                                }
                                            }
                                            localStorage.setItem('trip_vehicle_type', vehicle_type);

                                            setTimeout(function () {
                                                start_stop_trip(0);
                                            }, 1000);
                                        });
                                    }
                                    else {

                                        // commented on 221124 - mk - quadra
                                        //if (redirect == "customer") {
                                        //    // make local task entry (customer listing + task create) 210923 
                                        //    // temporary considering survey_mode = offline afterwards it will get from backflow
                                        //    survey_mode = "offline";
                                        //}

                                        if (survey_mode == "online") {
                                            // create task online   (online then offline both)
                                            if (curr_btn_mode == "button_create_task") {
                                                var btn_status = curr_survey_data["createtask"];
                                                insert_online_n_offline_task(btn_status);
                                            }
                                            else {
                                                insert_online_n_offline_task(0);
                                            }
                                        }
                                        else {
                                            // create task offline
                                            get_user_latlong_offline_task();
                                        }
                                    }

                                }
                            }
                        }
                    }
                }
                else if (form_flag == 7) {
                    // type20 customer creation
                    if (curr_btn_mode == "save") {
                        var heading = curr_survey_data["heading"];
                        var step = curr_survey_data["step"];
                        var check_type = curr_survey_data["check_type"];
                        var cam_crash_data = [];
                        cam_crash_data.push({
                            heading: heading,
                            check_type: check_type,
                            step: step,
                            data: json,
                            buttons: btnJsonObj
                        });
                        storage.setItem('cam_crash_data', JSON.stringify(cam_crash_data));
                        check_camera_and_redirect();
                    }
                    else {
                        Validation_True = 0;
                        var finaljsonObj = [];
                        finaljsonObj.push({
                            data: json
                        });
                        ap_json = finaljsonObj;

                        var data_json = JSON.parse(storage.getItem('list_json'));
                        var list_data = JSON.parse(data_json);
                        var redirect = list_data[0].redirect;
                        if (redirect == 'customer') {
                            var is_new_cust_click = localStorage.getItem("is_new_customer_click");
                            if (is_new_cust_click == "true") {
                                add_new_customer_from_customer_listing(json);                      //customer creation from customer listing
                            }
                            else {
                                update_cutomer_edit_from_cust_listing(json);                         //customer edit update from customer listing
                            }
                        }
                        else {
                            add_new_item_by_type20(json);
                        }

                    }
                }
                else if (form_flag == 8) {
                    // user create

                    if (curr_btn_mode == "save") {
                        var heading = curr_survey_data["heading"];
                        var step = curr_survey_data["step"];
                        var check_type = curr_survey_data["check_type"];
                        var cam_crash_data = [];
                        cam_crash_data.push({
                            heading: heading,
                            check_type: check_type,
                            step: step,
                            data: json,
                            buttons: btnJsonObj
                        });
                        storage.setItem('cam_crash_data', JSON.stringify(cam_crash_data));
                        check_camera_and_redirect();
                    }
                    else {
                        Validation_True = 0;
                        var finaljsonObj = [];
                        finaljsonObj.push({
                            data: json
                        });
                        ap_json = finaljsonObj;

                        if (is_approval == '1') {
                            update_user_from_user_listing(json);
                        }
                        else {
                            add_new_user_from_user_listing(json);
                        }
                    }
                }
                else if (form_flag == 9) {
                    // filter
                    Validation_True = 0;
                    var finaljsonObj = [];
                    finaljsonObj.push({
                        data: json
                    });
                    ap_json = finaljsonObj;
                }
                else if (form_flag == 13) {
                    // bulk approval
                    Validation_True = 0;
                    curr_survey_data["json"] = json;

                    var finaljsonObj = [];
                    var data = json;
                    finaljsonObj.push({
                        data: data
                    });
                    var finaljsonObj_str = JSON.stringify(finaljsonObj);
                    ap_json = finaljsonObj;
                }
                // else if (form_flag == 5) {
                // // for capture photo in popup for type22
                // check_camera_and_redirect();
                // }

                //alert1("form_flag: " + form_flag);
                //alert1("check_type: " + check_type);
            }
        }
        else {
            // alert1("Please complete checksheet !");
            Validation_True = 1;
            setTimeout(function () {
                $("#container_btn_div").find('a').css({ 'cursor': "initial", 'pointer-events': 'initial' });
                $("#container_btn_div").find('a').removeClass('active-state');
            }, 2000);

            if (form_flag == 14) {
                // invoice task create from type37
                alert1(validation + " fields are blank while creating task via sub task control!");
            }
            loading_hide();
        }


        if (form_flag == 12) {
            // group task

            if (curr_btn_mode != "exit" && curr_btn_mode != "savenexit" && curr_btn_mode != "save") {
                var last_step = step_Array[step_Array.length - 1];
                if (last_step != go_to_chk_no) {
                    step_Array.push(go_to_chk_no);
                }
            }

            var group_task_array = JSON.parse(localStorage.getItem("group_task_array"));
            group_task_data_array.push({
                server_task_id: group_task_array[target_index],
                data: json,
                validation: validation
            });

        }

    } catch (e) {
        alert1(e + ': type = ' + jsonObj[i].type + ' of index = ' + i + ' validate_and_submit_surveydata()');
        loading_hide();
    }
    return false;
}

function showValuesSuccessCallBack_latlong(e) {
    try {
        var myArray = JSON.parse(e);

        // error while not getting current location
        if (myArray[0].gps == "" || myArray[0].gps == undefined || myArray[0].gps == null) {
            var gps = "0";
        } else {
            var gps = myArray[0].gps;
        }
        if (myArray[0].accuracy == "" || myArray[0].accuracy == undefined || myArray[0].accuracy == null) {
            var accuracy = "0";
        } else {
            var accuracy = myArray[0].accuracy;
        }
        if (myArray[0].diff_time == "" || myArray[0].diff_time == undefined || myArray[0].diff_time == null) {
            var diff_time = "0";
        } else {
            var diff_time = myArray[0].diff_time;
        }
        if (myArray[0].address == "" || myArray[0].address == undefined || myArray[0].address == null || myArray[0].address == 'null') {
            var address = "N/A";
        } else {
            var address = myArray[0].address;
            address = address.replace("null", "");
        }
        if (myArray[0].lat == "" || myArray[0].lat == undefined || myArray[0].lat == null) {
            var lat = "0";
        } else {
            var lat = myArray[0].lat;
        }
        if (myArray[0].lon == "" || myArray[0].lon == undefined || myArray[0].lon == null) {
            var long = "0";
        } else {
            var long = myArray[0].lon;
        }
        if (myArray[0].imei == "" || myArray[0].imei == undefined || myArray[0].imei == null) {
            var imei_no = imeino;
        } else {
            var imei_no = myArray[0].imei;
        }

        get_latlong(imei_no, address, lat, long, gps, accuracy, diff_time);

    } catch (e) {
        // alert1(e + '_showValuesSuccessCallBack_latlong()');
        // alert1("Current location is not saved due to GPS problem !");
        var imei_no = imeino;
        get_latlong(imei_no, "N/A", "0", "0", "0", "0", "0");
        loading_hide();
    }
}

function get_latlong(imei_no, address, lat, long, gps, accuracy, diff_time) {
    // Finalize jsonObj
    var date_s = new Date();
    var date = date_s.getTime();
    var heading = curr_survey_data["heading"];
    var step = curr_survey_data["step"];
    var check_type = curr_survey_data["check_type"];
    var task_id = curr_survey_data["task_id"];
    var server_task_id = curr_survey_data["server_task_id"];
    var site_id = curr_survey_data["siteid"];
    var data = curr_survey_data["json"];

    if (address == "" || address == null || address == undefined) { }
    else {
        address = address.replace(null, "");
        address = address.replace("null", "");
    }

    if (f_address == "" || f_address == null || f_address == undefined) { }
    else {
        f_address = f_address.replace(null, "");
        f_address = f_address.replace("null", "");
    }

    var user_id = JSON.parse(storage.getItem('user_id'));
    var udf_id = JSON.parse(storage.getItem('udf_id'));

    var company_id = JSON.parse(storage.getItem('company_id'));
    var flow_id = JSON.parse(storage.getItem('wayflow'));;
    var flow_name = JSON.parse(storage.getItem('wayflow_name'));
    var data_json = JSON.parse(storage.getItem('list_json'));
    var list_data = JSON.parse(data_json);
    var match_temp_id = list_data[0].match_temp_id;
    if (match_temp_id == "" || match_temp_id == null || match_temp_id == undefined) {
        match_temp_id = "";
    }

    var finaljsonObj = [];
    finaljsonObj.push({
        taskid: task_id,
        servertaskid: server_task_id,
        siteid: site_id,
        stepid: step,
        category: wayflow,
        imei: imei_no,
        User_Id: user_id,
        username: username,
        u_c: uniqcode,
        subcategory: heading,
        f_milli: f_milli,
        f_lat: f_lat,
        f_long: f_long,
        f_address: f_address,
        date: date,
        date_s: date_s,
        address: address,
        lat: lat,
        long1: long,
        gps: gps, // 0 = off, 1 = on
        accuracy: accuracy,
        diff_time: diff_time,
        check_type: check_type,
        data: data,
        buttons: btnJsonObj,
        udf_id: udf_id,
        CompanyId: company_id,
        FlowId: flow_id,
        FlowName: flow_name,
        match_temp_id: match_temp_id
    });
    //alert1(JSON.stringify(finaljsonObj));

    // ----- remove null validation (idrift issue) 03012018 ------ //

    //var finaljsonObj_str = JSON.stringify(finaljsonObj);
    //var n = finaljsonObj_str.search(/null/i);
    //if (n == -1) {
    // alert1("No null value found !");
    if (data == "" || data == null || data == undefined) {
        alert1("Survey contains blank data, please press submit button again !");
        alert1(JSON.stringify(finaljsonObj));
    } else {
        curr_survey_data["finaljsonObj"] = finaljsonObj;
        if (curr_btn_mode == 'savenexit' || curr_btn_mode == 'saveonly') {
            check_survey_entry();
        } else {
            var checksheet_trip = curr_survey_data["trip"];
            if (checksheet_trip == 'start' || checksheet_trip == 'stop') {
                check_survey_entry();
            }
            else {
                //save_global_variables();    // commented on 31032023 for wipro - online checksheet
                check_survey_entry();
            }
        }
    }
    //} else {
    //    alert1("Survey contains null value, please fill all the values !");
    //    find_null_position_in_survey(finaljsonObj);
    //}
}

// check survey for insert or update
function check_survey_entry() {
    var c_is_online = JSON.parse(storage.getItem('c_is_online'));
    if (c_is_online == 1) {
        // online checksheet
        Insert_Update_Question_Log();
    }
    else {
        // offline checksheet
        check_survey_entry_post();
    }
}

function check_survey_entry_post() {
    // alert1("Checking survey entry...");
    try {
        var t_id = curr_survey_data["t_id"];
        var step = curr_survey_data["step"];
        var check_type = curr_survey_data["check_type"];
        var query = "select fid from f_master where tid = '" + t_id + "' and f_value = '" + check_type + "' and step = '" + step + "'";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "0"
        });
        cordova.exec(showValuesSuccessCallBack_check_survey_entry, showValuesFailCallBack_check_survey_entry, 'SqlitePlugin', 'showValues', q_jsonobj);
    } catch (e) {
        alert1(e + '_check_survey_entry()');
        loading_hide();
    }
}

function showValuesSuccessCallBack_check_survey_entry(e) {
    // alert1("Old Entry Found ! - Update Checksheet details...");
    update_old_entry();
}
function showValuesFailCallBack_check_survey_entry(e) {
    // alert1("Old Entry Not Found ! Insert Checksheet details...");
    insert_new_entry();
}

function insert_new_entry() {
    // insert data to f_master table - goto action - Save & Next/Reject Buttons
    // alert1("inserting new entry...");
    try {
        var imei_no = curr_survey_data["finaljsonObj"][0].imei;
        var date_s = new Date();
        var time = date_s.getTime();
        var f_name = imei_no + "_" + time;
        var fileData = JSON.stringify(curr_survey_data["finaljsonObj"]);
        fileData = fileData.replace(/[']/g, "");
        var t_id = curr_survey_data["t_id"];
        var check_type = curr_survey_data["check_type"];
        var step = curr_survey_data["step"];
        var f_lat = curr_survey_data["finaljsonObj"][0].lat;
        var f_lon = curr_survey_data["finaljsonObj"][0].long1;
        var f_ms = curr_survey_data["finaljsonObj"][0].date;

        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var match_temp_id = list_data[0].match_temp_id;
        if (match_temp_id == "" || match_temp_id == null || match_temp_id == undefined) {
            match_temp_id = "";
        }

        var c_is_online = JSON.parse(storage.getItem('c_is_online'));
        if (curr_btn_mode == "savenexit" || c_is_online == 1) {
            var flag = "1";
        }
        else {
            var flag = "0";
        }

        if (curr_btn_mode == "autosave") {
            var t_curr_btn_mode = "savenexit";
            flag = "1";
        }
        else {
            var t_curr_btn_mode = curr_btn_mode;
        }

        if (fileData == '' || fileData == null || fileData == undefined) {
            alert1("Survey contains blank data, please press submit button again !");
            loading_hide();
        }
        else {
            var query = "INSERT INTO f_master (c_id, c_type, tid ,f_name, f_data, f_key, f_value, f_type, flag, step, lat, long, millisecond, match_temp_id) VALUES('"
                + check_type + "','1','" + t_id + "','" + f_name + "','" + fileData + "', '1','" + check_type + "','" + t_curr_btn_mode
                + "','" + flag + "','" + step + "', '" + f_lat + "', '" + f_lon + "', '" + f_ms + "', '" + match_temp_id + "');";
        }

        //alert1(query);
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            q: "0",
            tid: t_id
        });
        cordova.exec(save_global_variables, insertValuesFailCallBack, 'SqlitePlugin', 'insertValuse', q_jsonobj);
    } catch (e) {
        alert1(e + '_insert_new_entry()');
        loading_hide();
    }
}

function update_old_entry() {
    // update data to f_master table - goto action - Save & Next/Reject Buttons
    try {
        var date_s = new Date();
        var time = date_s.getTime();
        var t_id = curr_survey_data["t_id"];
        var step = curr_survey_data["step"];
        var fileData = JSON.stringify(curr_survey_data["finaljsonObj"]);
        fileData = fileData.replace(/[']/g, "");
        var check_type = curr_survey_data["check_type"];

        var c_is_online = JSON.parse(storage.getItem('c_is_online'));
        if (curr_btn_mode == "savenexit" || c_is_online == 1) {
            var flag = "1"
        }
        else {
            var flag = "0";
        }

        if (fileData == '' || fileData == null || fileData == undefined) {
            alert1("Survey contains blank data, please press submit button again !");
            loading_hide();
        }
        else {
            var query = "UPDATE f_master SET flag='" + flag + "', millisecond='" + time + "', f_data = '" + fileData + "', f_type='" + curr_btn_mode
                + "', f_key='1' where tid = '" + t_id + "' and f_value = '" + check_type + "' and step = '" + step + "'";
        }
        //alert1(query);
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            q: "0",
            tid: t_id
        });
        cordova.exec(save_global_variables, insertValuesFailCallBack, 'SqlitePlugin', 'insertValuse', q_jsonobj);
    } catch (e) {
        alert1(e + '_update_old_entry()');
        loading_hide();
    }
}

// save global variables for current task (site)
function save_global_variables() {
    try {

        if (curr_btn_mode == "autosave") {
            viewlist_checklist();
        }
        else {
            var t_id = curr_survey_data["t_id"];
            var checksheet_dependency = JSON.parse(storage.getItem('checksheet_dependency'));
            if (checksheet_dependency == null || checksheet_dependency == undefined || checksheet_dependency == "") {
                var checksheet_dependency = [];
            }

            var new_checksheet_list = JSON.parse(storage.getItem('new_checklist'));
            if (new_checksheet_list == null || new_checksheet_list == undefined || new_checksheet_list == "") {
                var new_checksheet_list = [];
            } else {
                if (curr_btn_mode == "updatetasknsubmit" || curr_btn_mode == "updatetasknredirect" || curr_btn_mode == "updatetasknautoopentaskform") {
                    // update checksheet is_submited on any checksheet submit

                    var c_start_status = JSON.parse(storage.getItem('c_start_status'));
                    var check_type = JSON.parse(storage.getItem('check_type'));
                    var role_id = JSON.parse(storage.getItem('role_id'));

                    for (i = 0; i < new_checksheet_list.length; i++) {
                        var checksheetid = new_checksheet_list[i].checksheetid;
                        var start_status = new_checksheet_list[i].start_status;
                        var c_role_id = new_checksheet_list[i].role_id;
                        if (c_role_id == '' || c_role_id == null || c_role_id == undefined) {
                            c_role_id = role_id;
                        }
                        if (checksheetid == check_type && start_status == c_start_status && role_id == c_role_id) {
                            if (validation < 1) {
                                new_checksheet_list[i].is_submited = 1;
                            } else {
                                new_checksheet_list[i].is_submited = 0;
                            }
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
                        storage.setItem('flow_Array', JSON.stringify(flow_Array));
                    }
                    // ///////////
                }
            }

            var global_var_Array = [];
            global_var_Array.push({
                'checksheet_dependency': checksheet_dependency,
                'new_checklist': new_checksheet_list,
                'step_Array_to_read': step_Array,
                't_id': curr_survey_data["t_id"],
                'task_id': curr_survey_data["task_id"],
                'server_task_id': curr_survey_data["server_task_id"]
            });
            var global_var_obj = JSON.stringify(global_var_Array);

            var query = "UPDATE task_master SET global_var = '" + global_var_obj + "' where tid = '" + t_id + "'";
            var q_jsonobj = [];
            q_jsonobj.push({
                data: query,
                q: "0",
                tid: "0"
            });
            cordova.exec(insertValuesSuccessCallBack_FM, onfail_save_global_variables, 'SqlitePlugin', 'insertValuse', q_jsonobj);
        }

    } catch (e) {
        alert1(e + '_save_global_variables');
        loading_hide();
    }
}

function insertValuesSuccessCallBack_FM(e) {
    try {
        // update status on submit status=1 means partially completed

        var c_is_online = JSON.parse(storage.getItem('c_is_online'));
        if (c_is_online == 1) {
            var q1 = "0";    // will remain flag = 0
        }
        else {
            var q1 = "1";    // will update flag = 1
        }

        storage.setItem('curr_btn_mode', JSON.stringify(curr_btn_mode));
        var t_id = curr_survey_data["t_id"];
        var step = curr_survey_data["step"];
        var end_status = JSON.parse(storage.getItem('end_status'));

        // for all flow
        if (curr_btn_mode == "save") {
            var q1 = "0";
            var query = "UPDATE task_master SET status = status where tid = '" + t_id + "'";
        }
        // for all flow
        else if (curr_btn_mode == "savenexit" || curr_btn_mode == "saveonly") {
            var query = "UPDATE task_master SET status = status where tid = '" + t_id + "' and step < '" + step + "'";
        }

        // for PMT flow
        else if (curr_btn_mode == "gotonchangecolor") {
            var query = "UPDATE task_master SET step = '0', status = status where tid = '" + t_id + "'";
        }
        // for all flow
        else {
            var query = "UPDATE task_master SET step = case when status < '" + end_status + "' then '" + step
                + "' else step end , status = status where tid = '" + t_id + "'";
        }

        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            q: q1, // 0 will not update flag 0 to 1 in table
            tid: t_id
        });
        cordova.exec(updateValuesSuccessCallBack_update_step_status, insertValuesFailCallBack, 'SqlitePlugin', 'insertValuse', q_jsonobj);
    } catch (e) {
        alert1(e + '_insertValuesSuccessCallBack_FM()');
        loading_hide();
    }
}

function updateValuesSuccessCallBack_update_step_status() {
    // alert1("Task status has been updated !");
    try {
        // insert data to f_master table - Save & Next Button
        if (curr_btn_mode == "goto") {
            storage.setItem('step_Array_to_read', JSON.stringify(step_Array.slice(0)));
            check_survey_entry_next_read();
        }
        // save current step and change color of current step button in first
        // step button array
        if (curr_btn_mode == "gotonchangecolor") {
            storage.setItem('step_Array_to_read', JSON.stringify(step_Array.slice(0)));
            get_target_step_survey();
        }
        // insert data to f_master table Reject Button (no validation check)
        else if (curr_btn_mode == "gotowithoutsave") {
            storage.setItem('step_Array_to_read', JSON.stringify(step_Array.slice(0)));
            check_survey_entry_next_read();
        }
        // goto site list with saving next checksheet (no validation check)
        else if (curr_btn_mode == "savenexit") {
            storage.setItem('step_Array_to_read', JSON.stringify(step_Array.slice(0)));
            // redirecting to dependent sitelist page
            check_flow_and_redirect();
        }
        // save current step only (no validation check)
        else if (curr_btn_mode == "saveonly") {
            storage.setItem('step_Array_to_read', JSON.stringify(step_Array.slice(0)));
        }
        // update task status on each checksheet submit
        else if (curr_btn_mode == "updatetasknsubmit" || curr_btn_mode == "updatetasknredirect" || curr_btn_mode == "updatetasknautoopentaskform") {
            update_current_checksheet_status();
        }
        // goto site list with saving next checksheet (no validation check)
        else if (curr_btn_mode == "save") {
            // redirecting to last camera function
            check_camera_and_redirect();
        }
        // Reject Task
        else if (curr_btn_mode == "reject") {
            // reject task by checksheet reject status (saving global var)
            update_current_checksheet_status();
        }
    } catch (e) {
        alert1(e + '_updateValuesSuccessCallBack_update_step_status()');
        loading_hide();
    }
}

// check survey for reading next checksheet from checksheet table or f_master
function check_survey_entry_next_read() {
    // alert1("Checking survey entry for reading next checksheet...");
    try {
        var t_id = curr_survey_data["t_id"];
        var step = step_Array[step_Array.length - 1];
        var check_type = curr_survey_data["check_type"];

        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var savenexit_log_removal_hours = list_data[0].savenexit_log_removal_hours;
        if (savenexit_log_removal_hours == "" || savenexit_log_removal_hours == null || savenexit_log_removal_hours == undefined) {
            // normal log
            var open_template_in_blue = list_data[0].open_template_in_blue;
            if (open_template_in_blue == "true") {

                var check_type = JSON.parse(storage.getItem('check_type'));
                var role_id = JSON.parse(storage.getItem('role_id'));
                var c_start_status = JSON.parse(storage.getItem('c_start_status'));
                var new_checksheet_list = JSON.parse(storage.getItem('new_checklist'));

                var ms = 0;
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

                var query = "select f_data from f_master where tid = '" + t_id + "' and f_value = '" + check_type + "' and step = '" + step + "' and millisecond > '" + ms + "'";
            }
            else {
                var query = "select f_data from f_master where tid = '" + t_id + "' and f_value = '" + check_type + "' and step = '" + step + "'";
            }

            var q_jsonobj = [];
            q_jsonobj.push({
                data: query,
                p: "0"
            });
        }
        else {
            // remove save n exit log after 1 days
            var prev_date = new Date();
            prev_date.setHours(prev_date.getHours() - parseInt(savenexit_log_removal_hours));
            prev_ms = prev_date.getTime();

            var query = "select f_data from f_master where tid = '" + t_id + "' and f_value = '" + check_type + "' and step = '" + step + "' and millisecond > '" + prev_ms + "'";
            var q_jsonobj = [];
            q_jsonobj.push({
                data: query,
                p: "0"
            });
        }
        cordova.exec(showValuesSuccessCallBack_check_survey_entry_next_read, showValuesFailCallBack_check_survey_entry_next_read, 'SqlitePlugin', 'showValues', q_jsonobj);
    } catch (e) {
        alert1(e + '_check_survey_entry_next_read()');
        loading_hide();
    }
}

function showValuesSuccessCallBack_check_survey_entry_next_read(e) {
    try {
        //alert1("Survey Found ! - Reading from file master table...");
        var myArray = JSON.parse(e);
        var heading = myArray[0].subcategory;
        var check_type = myArray[0].check_type;
        var step = myArray[0].stepid;
        var data = myArray[0].data;
        var buttons = myArray[0].buttons;
        var step_old = step_Array[step_Array.length - 1];
        if (data.length == 0 && step_old != 1) {
            // other step is duplicated with 1st step (get step data from checksheet) (red/green buttons)
            showValuesFailCallBack_check_survey_entry_next_read(e);
        } else {
            f_lat = myArray[0].f_lat;
            f_long = myArray[0].f_long;
            f_address = myArray[0].f_address;
            f_milli = myArray[0].f_milli;

            var c_is_online = JSON.parse(storage.getItem('c_is_online'));
            if (c_is_online == '1') {
                // survey found in local but get log from server and display (for online checksheet only)
                select_detail_for_back_survey();
            }
            else {
                read_dynamic_surveydata(heading, check_type, step, data, buttons, 0, 0);
            }
        }
    } catch (e) {
        loading_hide();
        // this is not a critical issue (go for blank form) (need to replicate scenario)
        showValuesFailCallBack_check_survey_entry_next_read(e);
    }
}

function showValuesFailCallBack_check_survey_entry_next_read(e) {
    try {
        //alert1("Survey Not Found ! - checking server call... ");

        //var c_is_online = JSON.parse(storage.getItem('c_is_online'));                      //commented for SB additional checksheet offline issue (TCTS:mk.rider) [28092020]
        //if (c_is_online == '1') {
        //    // get log from server forward side (online flow)
        //    select_detail_for_back_survey();
        //}
        //else {

        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var dynamic_checklist = list_data[0].dynamic_checklist;
        var server_call_flag = JSON.parse(storage.getItem('server_call_flag'));
        var check_old_log = list_data[0].check_old_log;

        if (check_old_log == 'true') {
            // if true found check_old_log key DV-27062023
            select_detail_for_back_survey();
        }
        else {
            if (server_call_flag == 0 || dynamic_checklist == 'true') {
                read_blank_checksheet();
            } else {
                select_detail_for_back_survey();
            }
        }

        //}
    } catch (e) {
        alert1(e + '_showValuesFailCallBack_check_survey_entry_next_read()');
        loading_hide();
    }
}

function read_blank_checksheet() {
    try {
        //alert1("Reading from checksheet table...");
        var step = step_Array[step_Array.length - 1];
        var selected_check_type = JSON.parse(storage.getItem('check_type'));
        var query = "select subcategory, checksheetid, step, data, buttons from checksheet where checksheetid = '" + selected_check_type + "' and step = '" + step + "'";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "1" // 1 for selecting values from table in json
        });
        cordova.exec(success_check_survey_entry_next_read, showValuesFailCallBack, 'SqlitePlugin', 'showValues', q_jsonobj);
    } catch (e) {
        alert1(e + '_read_blank_checksheet()');
        loading_hide();
    }
}

function success_check_survey_entry_next_read(e) {
    try {
        // alert1("Successfull next checksheet select !");
        //alert1(e);
        var myArray = JSON.parse(e);
        if (myArray.length > 0) {
            var heading = myArray[0].subcategory;
            var check_type = myArray[0].checksheetid;
            var step = myArray[0].step;
            var data = itemObj._checkStrObj(myArray[0].data);  		// check_item
            var buttons = itemObj._checkStrObj(myArray[0].buttons);  		// check_item
            read_dynamic_checksheet(heading, check_type, step, data, buttons, 0, 0);
        }
        else {
            var selected_check_type = JSON.parse(storage.getItem('check_type'));
            var step = step_Array[step_Array.length - 1];
            get_checksheet_from_server(selected_check_type, step);
        }
    } catch (e) {
        loading_hide();

        // when step is not exist for current checksheet
        if (step_Array.length > 1) {
            step_Array.pop();
        }
        check_survey_entry_next_read();
    }
}

function get_checksheet_from_server(selected_check_type, step) {
    try {
        // alert1("Reading from checksheet table...");

        loading();
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
            'step': step,
            'trip_id': trip_id
        });

        var getdata = new Webservicecall_REST(common_global_wcf_url + 'WCF_GetCheckSheetData_Port', JSON.stringify(param_obj), onsuccess_get_checksheet_from_server, onfail_get_checksheet_from_server);
        getdata.callOtherDomain();

    } catch (e) {
        alert1(e + '_get_checksheet_from_server()');
        loading_hide();
    }
}

function onsuccess_get_checksheet_from_server(e) {
    try {
        var responseText = JSON.parse(e.responseText);
        var status = responseText[0].status;

        if (status == 1) {
            //var myArray = JSON.parse(e);
            var myArray = JSON.parse(responseText[0].data);
            if (myArray.length > 0) {
                var heading = myArray[0].subcategory;
                var check_type = myArray[0].checksheetid;
                var step = myArray[0].step;
                var blank_data = itemObj._checkStrObj(myArray[0].data);  		// check_item
                var buttons = itemObj._checkStrObj(myArray[0].buttons);  		// check_item

                read_dynamic_checksheet(heading, check_type, step, blank_data, buttons, 0, 0);
            }
        }
        else {
            onfail_get_checksheet_from_server('');
        }
    } catch (e) {
        alert1(e + '_onsuccess_get_checksheet_from_server');
        loading_hide();
    }
}

function onfail_get_checksheet_from_server(e) {
    loading_hide();
    alert1("Network Error, Please Try Again !");
}

function showValuesFailCallBack(e) {
    // alert1(e + '_SubmitSurveyData_showValuesFailCallBack()');
    var step = step_Array[step_Array.length - 1];
    var selected_check_type = JSON.parse(storage.getItem('check_type'));
    alert1("Checksheet has not been downloaded ! Please refer checksheet mapping feature!\n Checksheet ID: " + selected_check_type + ", Step ID: " + step + "");
    loading_hide();
}

function failCallback_Survey(e) {
    alert1(e + '_SubmitSurveyData_failCallback_Survey()');
    loading_hide();
}

function showValuesFailCallBack_Temp(e) {
    alert1(e + '_SubmitSurveyData_showValuesFailCallBack_Temp()');
    loading_hide();
}

function insertValuesFailCallBack(e) {
    alert1(e + '_insertValuesFailCallBack()');
    loading_hide();
}

function onfail_save_global_variables(e) {
    alert1(e + '_onfail_save_global_variables()');
    loading_hide();
}

// replace class to ans DV-26072023
function replace_classwith_ans_comment_statement(comment_statement_key) {
    for (i = 0; i < comment_statement_key.length; i++) {
        var t_char = comment_statement_key[i];
        if (t_char == "<") {
            var start_at = comment_statement_key.indexOf("<@", i);
            var end_at = comment_statement_key.indexOf("@>", i);
            var inner_eq_class_str_all = comment_statement_key.substring(start_at, (end_at + 2));
            var sub_get_value = inner_eq_class_str_all.substring(2, inner_eq_class_str_all.length - 2);

            try {
                var ddl_found = $("." + sub_get_value + "").find("select");
                var ele_type = $("." + sub_get_value + "").find("div :nth-child(2)").prop('tagName');
                if (ele_type == 'SELECT' || ele_type == 'OPTION' || ddl_found.length > 0) {
                    var where_box_id = $("." + sub_get_value + "").find("select").attr("id");
                    var ans_id = $("#" + where_box_id + " :selected").attr('value1');
                    if (ans_id == "" || ans_id == null || ans_id == undefined) {
                        ans_id = $("#" + where_box_id + " :selected").val();
                    }

                    var ans_text = $("#" + where_box_id + " :selected").text();
                    if (ans_id == "All") {
                        // Select All (replace Value_1 with all options id/text)
                        var id_Array = [];
                        var text_Array = [];
                        $('#' + where_box_id + ' > option').each(function () {
                            var id = $(this).attr('value1');
                            if (id == "" || id == null || id == undefined) {
                                id = $(this).val();
                            }
                            var text = $(this).text();
                            if (id != '0' && id != 'All') {
                                id_Array.push(id);
                                text_Array.push(text);
                            }
                        });
                        var t_ans_id = JSON.stringify(id_Array);
                        var t_ans_text = JSON.stringify(text_Array);
                        var sub_t_ans_id = t_ans_id.substring(2, t_ans_id.length - 2);
                        var sub_t_ans_text = t_ans_text.substring(1, t_ans_text.length - 1);
                        ans_id = sub_t_ans_id.replace(/"/g, "'");
                        ans_text = sub_t_ans_text.replace(/"/g, "'");
                    }
                } else {
                    var where_box_id = $("." + sub_get_value + " :input[type=text]").attr("id");
                    $("#" + where_box_id + "").attr("onkeydown", "make_blank_type20_field(this)");
                    var ans_id = $("#" + where_box_id + "").attr('title');
                    var ans_text = $("#" + where_box_id + "").val();
                }

                if (ans_id == "" || ans_id == null || ans_id == undefined || ans_id == "0" || ans_id == "--- Select Values ---" || ans_id == "All" || ans_text == "" || ans_text == null || ans_text == undefined) {
                    //highlight div when no any value is selected for type 20 tableview
                    var where_box_id = $("." + sub_get_value + "").find("select").attr("id");
                    if (where_box_id == "" || where_box_id == null || where_box_id == undefined) {
                        where_box_id = $("." + sub_get_value + " :input[type='text']").attr("id");

                        if (where_box_id == "" || where_box_id == null || where_box_id == undefined) {
                            //check for type22 control
                            where_box_id = $("label." + sub_get_value + " ").attr("id");
                        }
                    }
                    var div_scroll = $('#Div_scroll_Task').parent();
                    try {
                        $(div_scroll).animate({ scrollTop: $('#' + where_box_id).offset().top - 300 }, 300);
                    }
                    catch (e) { }

                    if (where_box_id.indexOf('ddl_search_type20') > -1) {

                        var parent_invoice = $('#' + where_box_id + '').parents('div[id^="div_singleInvoice_cntrl_"]');
                        if (parent_invoice.length > 0) {
                            // single searchable in invoice
                            var parent_invoice_id = $('#' + where_box_id + '').parents('div[id^="div_singleInvoice_cntrl_"]').attr("id");
                            var postfix_id = parent_invoice_id.replace("div_singleInvoice_cntrl_", "");
                            var invoice_table_id = "tbl_row_data_" + postfix_id + "";

                            var text_Array = [];
                            $("#" + invoice_table_id + " tr").each(function () {
                                if ($(this).is(":visible")) {
                                    var text = $(this).find("label").html();
                                    if (text == "" || text == null || text == undefined) { }
                                    else {
                                        text_Array.push(text);
                                    }
                                }
                            });

                            if (text_Array.length > 0) {
                                var t_ans_text = JSON.stringify(text_Array);
                                var sub_t_ans_text = t_ans_text.substring(1, t_ans_text.length - 1);
                                ans_text = sub_t_ans_text.replace(/"/g, "'");
                            }
                            else {
                                ref_valid++;
                                break;
                            }
                        }
                        else {
                            // searchable in main form   

                            // remove red border because it is showing in page load 01062022
                            //where_box_id = where_box_id.replace('ddl_search_type20_', 'div_Search_');
                            //mk_animate_border('#' + where_box_id, 0, 500, '#FF0000');
                            ref_valid++;
                            break;
                        }
                    }
                }

                // check replace with id or text
                var pass_type = 'text';
                if (pass_type == 'id') {
                    new_get_value = ans_id;
                }
                else {
                    new_get_value = ans_text;
                }
            }
            catch (e) {
                alert(e);
                loading_hide();
            }

            comment_statement_key = comment_statement_key.replace(inner_eq_class_str_all, new_get_value);

            var n = comment_statement_key.search("<@");
            if (n == -1) {
                // required value not exist
                break;
            }
        }
    }

    return comment_statement_key;
}

function show_hidden_cntrl_alert(t_prop_name, t_validation, autofill_parent_id) {
    //alert1('"' + t_prop_name + '" is hidden with blank data...');

    if (autofill_parent_id == "" || autofill_parent_id == null || autofill_parent_id == undefined) {
        alert1('"' + t_prop_name + '" cannot be left empty.');
        t_validation++;
    }
    else {
        // dont validate current control if parent searchable is also hidden from which control is autofilled
        if ($('#' + autofill_parent_id + '').is(':visible')) {
            alert1('"' + t_prop_name + '" cannot be left empty.');
            t_validation++;
        }
    }

    return t_validation;
}

get_elem_data_by_object = (obj, new_id) => {

    let con_type = obj.type;
    if (con_type == 1) {
        var autofill_parent_id = $('#div_txt_' + new_id + '').attr('autofill_parent_id');
    }
    else if (con_type == 2) {
        var autofill_parent_id = $('#div_rdo_' + new_id + '').attr('autofill_parent_id');
    }
    else if (con_type == 3) {
        var autofill_parent_id = $('#div_ddl_' + new_id + '').attr('autofill_parent_id');
    }
    else if (con_type == 4) {
        var autofill_parent_id = $('#div_txtno_' + new_id + '').attr('autofill_parent_id');
    }
    else if (con_type == 6) {
        var autofill_parent_id = $('#div_chk_' + new_id + '').attr('autofill_parent_id');
    }
    else if (con_type == 7) {
        var autofill_parent_id = $('#div_cbtn_' + new_id + '').attr('autofill_parent_id');
    }
    else if (con_type == 8) {
        var autofill_parent_id = $('#div_cal_' + new_id + '').attr('autofill_parent_id');
    }
    else if (con_type == 9) {
        var autofill_parent_id = $('#div_sign_' + new_id + '').attr('autofill_parent_id');
    }
    else if (con_type == 12) {
        var autofill_parent_id = $('#div_txtrange_' + new_id + '').attr('autofill_parent_id');
    }
    else if (con_type == 17) {
        var autofill_parent_id = $('#div_Calc_' + new_id + '').attr('autofill_parent_id');
    }
    else if (con_type == 20) {
        var autofill_parent_id = $('#div_Search_' + new_id + '').attr('autofill_parent_id');
    }
    else if (con_type == 25) {
        var autofill_parent_id = $('#div_scn_' + new_id + '').attr('autofill_parent_id');
    }
    else if (con_type == 30) {
        var autofill_parent_id = $('#div_dynddl_' + new_id + '').attr('autofill_parent_id');
    }

    if (autofill_parent_id == "" || autofill_parent_id == null || autofill_parent_id == undefined) {
        autofill_parent_id = "";
    }

    return [autofill_parent_id]
}