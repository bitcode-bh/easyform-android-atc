// read black checksheet
var task_creation_date;

// increase height of textbox automatically
function ResizeBox(e) {
    var ele = e.target;
    var t = ele.scrollTop;
    ele.scrollTop = 0
    if (t > 0) {
        ele.style.height = (ele.offsetHeight + t) + "px";
    }
}

function isNumberKey(evt) {
    var charCode = (evt.which) ? evt.which : event.keyCode
    if (charCode > 31 && charCode != 46 && (charCode < 48 || charCode > 57)) return false;
    return true;
}

var chk_progress_data = [];
var Type34_Event_Array = [];

var RC_heading;
var RC_check_type;
var RC_step;
var RC_data;
var RC_buttons;
var RC_form_flag_temp;
var RC_disabled_flag;

function read_dynamic_checksheet(heading, check_type, step, data, buttons, form_flag_temp, disabled_flag) {
    try {
        if (form_flag_temp == 0) {
            //normal form
            var data_json = JSON.parse(storage.getItem('list_json'));
            var list_data = JSON.parse(data_json);
            var old_task_log = list_data[0].old_task_log;
            if (old_task_log == "true") {
                var old_log = "true";
            }
            else {
                var old_log = "false";
            }
        }
        else {
            var old_log = "false";
        }

        if (old_log == "true") {
            if (step == '' || step == null || step == undefined) {
                step = 1;
            }

            RC_heading = heading;
            RC_check_type = check_type;
            RC_step = step;
            RC_data = data;
            RC_buttons = buttons;
            RC_form_flag_temp = form_flag_temp;
            RC_disabled_flag = disabled_flag;

            get_old_task_log(check_type, step);
        }
        else {
            read_dynamic_checksheet_main(heading, check_type, step, data, buttons, form_flag_temp, disabled_flag);
        }
    }
    catch (e) {
        alert1(e + '_read_dynamic_checksheet');
    }
}

function get_old_task_log(selected_check_type, step) {
    try {
        // don't show loading in collapsible control  09072020
        if (RC_form_flag_temp != 2) {
            loading();
        }
        var server_task_id = JSON.parse(storage.getItem('server_task_id'));
        var siteid = JSON.parse(storage.getItem('siteid'));
        var param_obj = [];
        param_obj.push({
            'taskid': server_task_id,
            'customerid': siteid,
            'checksheetid': selected_check_type,
            'stepid': step
        });

        var getdata = new Webservicecall_REST(global_wcf_url + 'CustomerIdPreviousTaskDetail', JSON.stringify(param_obj), onsuccess_get_old_task_log, onfail_get_old_task_log);
        getdata.callOtherDomain();
    }
    catch (e) {
        alert1(e + '_get_old_task_log()');
        loading_hide();
    }
}

function onsuccess_get_old_task_log(e) {
    try {
        var responseText = JSON.parse(e.responseText);
        var status = responseText[0].status;
        loading_hide();

        if (status == 1) {
            var RS_data = JSON.parse(responseText[0].data);
            var blank_data = RC_data;
            for (i = 0; i < blank_data.length; i++) {
                var bl_que_id = blank_data[i].que_id;
                var bl_type = blank_data[i].type;
                var bl_old_log = blank_data[i].old_log;
                if (bl_old_log == "true") {
                    for (j = 0; j < RS_data.length; j++) {
                        var rs_que_id = RS_data[j].que_id;
                        var rs_type = RS_data[j].type;
                        if (rs_que_id == bl_que_id) {
                            if (rs_type == 4 && bl_type == 1) {
                                // allow numeric to text box type conversion - atc - 10062020
                                var rs_ans = RS_data[j].ans;
                                blank_data[i].ans = rs_ans;
                            }
                            else {
                                if (rs_type == bl_type) {
                                    var rs_ans = RS_data[j].ans;
                                    blank_data[i].ans = rs_ans;
                                }
                            }
                            break;
                        }
                    }
                }
            }

            read_dynamic_surveydata_main(RC_heading, RC_check_type, RC_step, blank_data, RC_buttons, RC_form_flag_temp, RC_disabled_flag)
        }
        else if (status == 2) {
            read_dynamic_checksheet_main(RC_heading, RC_check_type, RC_step, RC_data, RC_buttons, RC_form_flag_temp, RC_disabled_flag);
        }
        else {
            var message = responseText[0].message;
            alert1(message);
            read_dynamic_checksheet_main(RC_heading, RC_check_type, RC_step, RC_data, RC_buttons, RC_form_flag_temp, RC_disabled_flag);
        }
    } catch (e) {
        alert1(e + '_onsuccess_get_old_task_log()');
        loading_hide();
    }
}

function onfail_get_old_task_log(e) {
    loading_hide();
    read_dynamic_checksheet_main(RC_heading, RC_check_type, RC_step, RC_data, RC_buttons, RC_form_flag_temp, RC_disabled_flag);
}

function read_dynamic_checksheet_main(heading, check_type, step, data, buttons, form_flag_temp, disabled_flag, target_div, target_index) {
    try {
        //api call to comment history que_id list
        var server_task_id = JSON.parse(storage.getItem('server_task_id'));
        uniq_cmnt_que_id_ary = [];

        var param_obj = [];
        param_obj.push({
            "server_task_id": server_task_id,
            "checksheet_id": check_type,
            "step_id": 1,
            "que_id": 0
        });

        var getdata = new Webservicecall_REST(global_wcf_url + 'Select_comment', JSON.stringify(param_obj), function (e) {
            var responseText = JSON.parse(e.responseText);
            var status = responseText[0].status;
            if (status == 1) {
                var comment_data = responseText[0].data
                uniq_cmnt_que_id_ary = comment_data.filter((v, i, a) => a.findIndex(v2 => (v2 === v)) === i);
            }
            else {
                loading_hide();
            }

            read_dynamic_checksheet_main_POST(heading, check_type, step, data, buttons, form_flag_temp, disabled_flag, target_div, target_index);
            loading_hide();

        }, function (e) {
            // onfail

            read_dynamic_checksheet_main_POST(heading, check_type, step, data, buttons, form_flag_temp, disabled_flag, target_div, target_index);
            loading_hide();
        });
        getdata.callOtherDomain();
    }
    catch (e) {
        alert1(e + 'read_dynamic_checksheet_main');
    }
}

function read_dynamic_checksheet_main_POST(heading, check_type, step, data, buttons, form_flag_temp, disabled_flag, target_div, target_index) {
    try {
        curr_target_div = target_div;
        set_system_variable();

        curr_all_data_20["current_checksheet_id"] = check_type;

        var c_is_online = JSON.parse(storage.getItem('c_is_online'));            // 1 = online checksheet, 0 = offline checksheet
        var c_is_disabled = JSON.parse(storage.getItem('c_is_disabled'));
        if (c_is_disabled == 1) { disabled_flag = 1 }

        localStorage.setItem('crash_heading', heading);
        localStorage.setItem('crash_check_type', check_type);
        localStorage.setItem('crash_step', step);
        localStorage.setItem('form_flag', form_flag_temp);

        form_flag = form_flag_temp;
        //alert1("form_flag" + form_flag);
        // var form_flag = control_flag;// for normal json
        //alert1("Readchecksheet JSON :" + JSON.stringify(data));
        // alert1("Form Flag:" + form_flag);

        // form_flag = 0; for read normal form
        // form_flag = 1; for type=22
        // form_flag = 2; for type=23 collapsible div
        // form_flag = 3; for type=23 popup div

        var jsonObj = [];

        newdiv = "";

        var dependency_Array = [];
        var Show_class_Array = [];
        var LL_class_Array = []; // classes of site lat long numeric box
        var Type17_class_Array = []; // type17 classes
        var Type17_Adv_class_Array = []; // advanced type17 classes
        var Type20_class_Array = []; // type20 classes
        var Type8_data_Array = []; // calender classes
        var Type26_upload_Array = [];
        var Type30_dynddl_Array = [];
        Type30_dynddl_Array_Global = [];
        var Type32_Array = [];
        var weather_cntrl_found = 0;
        var Type7_upload_Array = [];
        var Type7_old_photo_class_Array = [];
        var Type40_ll_Array = [];

        var Car_que_id_Array = [];

        //-------- get details from system var start -----------
        var p_type20_columndata = JSON.parse(storage.getItem('parent_type20_columndata'));
        if (p_type20_columndata == '' || p_type20_columndata == null || p_type20_columndata == undefined) { }
        else {
            // store all columndata keys in type20 global data
            for (c = 0; c < p_type20_columndata.length; c++) {
                var key = p_type20_columndata[c].header;
                var value = p_type20_columndata[c].ans;
                curr_all_data_20[key] = value;
            }
        }

        var type20_columndata = JSON.parse(storage.getItem('type20_columndata'));
        if (type20_columndata == '' || type20_columndata == null || type20_columndata == undefined) { }
        else {
            // store all columndata keys in type20 global data
            for (c = 0; c < type20_columndata.length; c++) {
                var key = type20_columndata[c].header;
                var value = type20_columndata[c].ans;
                curr_all_data_20[key] = value;
            }
        }

        var customer_columndata = JSON.parse(storage.getItem('customer_columndata'));
        if (customer_columndata == '' || customer_columndata == null || customer_columndata == undefined) { }
        else {
            for (c = 0; c < customer_columndata.length; c++) {
                var key = customer_columndata[c].header;
                var value = customer_columndata[c].ans;
                curr_all_data_20[key] = value;
            }
        }

        var user_track_array = storage.getItem('user_track_details');
        if (user_track_array == "" || user_track_array == null || user_track_array == undefined || user_track_array == "null") { }
        else {
            user_track_array = JSON.parse(user_track_array);
            var address = user_track_array[0].user_address;
            curr_all_data_20['address'] = address;
        }

        var data_json = JSON.parse(storage.getItem('list_json'));
        if (data_json == "" || data_json == null || data_json == undefined) {
            // user create
            var list_data = [];
            var survey_mode = "online";
            var redirect = "task";
        }
        else {
            var list_data = JSON.parse(data_json);
            var survey_mode = list_data[0].survey_mode;
            var redirect = list_data[0].redirect;
        }



        //-------- get details from system var end -----------

        // --- check target container div start ---//////
        if (form_flag == 0) {
            // normal form
            jsonObj_old = [];
            collapse_Json = []; // type23 inner data array
            collapse_id_Array = []; // type23 ids
            Type20_AutoFill_DDL_Array = []; // type20 autofill dropdown
            Type20_AutoBind_Onchange_Array = []; // autofill by parent
            // onchange

            curr_clps_new_id = 0;

            inv_item_Array = [];
            // inv_item_Counter = 0; // items counter for single invoice
            // inv_Calc_new = "";
            // inv_new_counter = 0;// type22 counter
            inv_Calc_new_array = [];
            inv_display_flag_array = [];
            json_inv_array = [];

            Type17_Autofill_Textbox_Array = [];

            curr_survey_data["finaljsonObj"] = "";
            curr_survey_data["json"] = "";
            curr_survey_data["siteid"] = "";
            curr_survey_data["check_type"] = "";
            curr_survey_data["server_task_id"] = "";
            curr_survey_data["step"] = "";
            curr_survey_data["heading"] = "";

            curr_survey_data["heading"] = heading;
            curr_survey_data["check_type"] = check_type;
            curr_survey_data["siteid"] = JSON.parse(storage.getItem('siteid'));
            curr_survey_data["server_task_id"] = JSON.parse(storage.getItem('server_task_id'));
            curr_survey_data["step"] = step;

            $("#container_div").empty();
            $("#collapsible_top").empty();
            $("#clps_popup_container_div").empty();

            btnJsonObj = buttons;
            var module_name = JSON.parse(storage.getItem('wayflow_name'));
            var checksheet_name = JSON.parse(storage.getItem('checksheet_name'));
            if (checksheet_name.length > 20) {
                checksheet_name = checksheet_name.substr(0, 18) + '...';
            }

            // create path view & step header
            // newdiv += '<label class="theme_rcs_lbl_header" style="font-size:
            // 15px; font-weight:bold; font-family: calibri; display:block;"><b
            // style="color:black">Flow: </b>'
            // + module_name
            // + ' <b style="color:black"> >> </b> '
            // + checksheet_name
            // + ' <b style="color:black"> >> </b>Step_'
            // + step + '</label>';

            var lbl_str = '<b style="color:black">Flow: </b>' + module_name + ' <b style="color:black"> >> </b> ' + checksheet_name + ' <b style="color:black"> >> </b>Step_' + step + '';
            $("#lbl_flow_path").html(lbl_str);

            var progress_step = step - 1;
            storage.setItem('progress_step', JSON.stringify(progress_step));
            var max = JSON.parse(storage.getItem('last_step'));
            var str1 = progress_step + '/' + max;
            var str2 = Math.round((100 / max) * progress_step);

            // newdiv += '<progress type="range" style="width:100%; height:17px"
            // name="points" min="0" max="'
            // + max + '" value="' + progress_step + '"></progress>';
            // newdiv += '<table style="width:100%"><tr><td style="width:50%;
            // font-size:10pt">'
            // + str1
            // + '</td><td style="width:50%; font-size:10pt; text-align:right">'
            // + str2 + '%</td></tr></table>';

            chk_progress_data = [];
            chk_progress_data.push({
                progress: str2,
                flow: module_name,
                checksheet: checksheet_name,
                step: heading,
                curr_step: step,
                com_step: progress_step,
                tot_step: max
            });

            //  progress_str = str1 + ' - ' + str2;
            var sitename = JSON.parse(storage.getItem('sitename'));
            $("#lbl_site_name").text(sitename);
            $("#lbl_step_name").text(heading);

            var site_detail = list_data[0].site_detail;
            if (site_detail != 'true') {
                newdiv += '<a class="button step-name" style="font-weight:bold; line-height:17px; height:17px; white-space:normal">' + heading + '</a>';
            }

        } else if (form_flag == 1) {
            // type 22
            glob_type20_cust_checksheetid = 0;
            dependency_array_count_type22 = 0;
            type22_current_mode = 'insert';
            storage.setItem("json_inv", heading);

            // commented on 25042024 getting issue in 3Desire - (case normal searchable and invoice with single searchable in single step)
            //Type20_AutoFill_DDL_Array = [];  

        } else if (form_flag == 2) {
            var disabled_flag = collapse_Json[0].update_outer_ele;

            // collapsible step form (type 23)
            // $("#collapsible_top").empty();
            // $("#collapse_container_div").empty();
        } else if (form_flag == 3) {
            // type 23 popup div container
            $("#clps_popup_container_div").empty();
        } else if (form_flag == 6 || form_flag == 14) {
            if (form_flag == 6) {
                // create task

                var check_type_task = localStorage.getItem('checksheetid');
                check_type = check_type_task;
                var t_id = JSON.parse(storage.getItem('tid'));
                var step = localStorage.getItem('p_key');

                var type37_len = $("div[id^='div_subtask_']").length;
                if (type37_len > 0) {
                    $(".popup-new-task-create #container_div").empty();
                    $(".popup-new-task-create #container_btn_div").empty();
                    curr_survey_data["check_type_37"] = check_type;                                 //checkshtid issue when create new type37 subtask thn submit main task [FT-09052025]
                    curr_survey_data["t_id_37"] = t_id;
                }
                else {
                    $("#container_div").empty();
                    $("#container_btn_div").empty();
                    curr_survey_data["check_type"] = check_type;
                    curr_survey_data["t_id"] = t_id;
                }

                curr_survey_data["step"] = step;

                ////added this for new invoice subtask(type37) creation [FT-297092024
                curr_all_data_20["parent_task_id"] = JSON.parse(storage.getItem('p_server_task_id'));
            }
            else if (form_flag == 14) {
                // invoice task create from type37
                $("#container_div_invoice").empty();
            }

            // inv_new_counter = 0;
            // type22 counter
            curr_clps_new_id = 0;           //for new task creation from type37
            inv_Calc_new_array = [];
            inv_display_flag_array = [];
            json_inv_array = [];

            Type20_AutoFill_DDL_Array = []; // type20 autofill dropdown
            Type20_AutoBind_Onchange_Array = []; // autofill by parent
            // onchange

            //var data_json = JSON.parse(storage.getItem('list_json'));
            //var list_data = JSON.parse(data_json);
            //var redirect = list_data[0].redirect;
            //if (redirect == 'customer') {
            //    var type20_columndata = JSON.parse(storage
            //			.getItem('type20_columndata'));

            //    // store all columndata keys in type20 global data
            //    for (c = 0; c < type20_columndata.length; c++) {
            //        var key = type20_columndata[c].header;
            //        var value = type20_columndata[c].ans;
            //        curr_all_data_20[key] = value;
            //    }
            //}

        }
        else if (form_flag == 7) {
            // only blank below var if main form doesn't contains any invoice [FT-30052025]
            if (inv_Calc_new_array.length == 0) {
                inv_Calc_new_array = [];                                    //display type22 table/list in customer form [01012021]
                inv_display_flag_array = [];
                json_inv_array = [];
            }

            check_type = localStorage.getItem('check_type_customer');
        }
        else if (form_flag == 8) {
            // user form
            jsonObj_old = [];

            inv_Calc_new_array = [];                                    //display type22 table/list in customer form [01012021]
            inv_display_flag_array = [];
            json_inv_array = [];

            check_type = localStorage.getItem('check_type_user');
            curr_survey_data["heading"] = heading;
            curr_survey_data["check_type"] = check_type;
            curr_survey_data["siteid"] = JSON.parse(storage.getItem('siteid'));
            curr_survey_data["step"] = step;
            btnJsonObj = buttons;

            $("#container_div_user").empty();
            $("#container_btn_div").empty();
        }
        else if (form_flag == 12) {
            curr_survey_data["step"] = step;
        }
        else if (form_flag == 13) {
            // bulk approval
            $("#container_div_bulk_approval").empty();

            jsonObj_old = [];
            collapse_Json = []; // type23 inner data array
            collapse_id_Array = []; // type23 ids
            Type20_AutoFill_DDL_Array = []; // type20 autofill dropdown
            Type20_AutoBind_Onchange_Array = []; // autofill by parent

            inv_item_Array = [];
            curr_clps_new_id = 0;
            inv_Calc_new_array = [];
            inv_display_flag_array = [];
            json_inv_array = [];
            Type17_Autofill_Textbox_Array = [];

            curr_survey_data["finaljsonObj"] = "";
            curr_survey_data["json"] = "";
            curr_survey_data["siteid"] = "";
            curr_survey_data["check_type"] = "";
            curr_survey_data["server_task_id"] = "";
            curr_survey_data["step"] = "";
            curr_survey_data["heading"] = "";

            curr_survey_data["heading"] = heading;
            curr_survey_data["check_type"] = check_type;
            curr_survey_data["siteid"] = JSON.parse(storage.getItem('siteid'));
            curr_survey_data["server_task_id"] = JSON.parse(storage.getItem('server_task_id'));
            curr_survey_data["step"] = step;

            $("#container_div").empty();

            btnJsonObj = buttons;
        }

        // --------- check target container div end ---////

        jsonObj = data;

        //jsonObj = JSON.stringify(jsonObj);
        //jsonObj = jsonObj.replace("\\", "");
        //jsonObj = JSON.parse(jsonObj);
        //alert1(JSON.stringify(jsonObj));

        //alert1("form_flag: " + form_flag);
        //alert1("check_type: " + check_type);

        ////added comment icon for every control on swipe right [FT - 12022025]
        if (form_flag == 0 || form_flag == 2 || form_flag == 3) {
            newdiv += '<div>';
        }

        var type0_ele_class = "false";
        var invoice_found = 0;
        for (i = 0; i < jsonObj.length; i++) {
            var cnrl_type = jsonObj[i].type;
            var prop_name = jsonObj[i].prop[0].name;

            if (cnrl_type == 10) { }
            else {
                // objectclass and objectname 09022021
                var objectclass = jsonObj[i].objectclass;
                var objectname = jsonObj[i].objectname;
                var objectfill = jsonObj[i].objectfill;
                var que_id = jsonObj[i].que_id;
                var reference_class = jsonObj[i].prop[0].reference_class;
                if (reference_class == "" || reference_class == null || reference_class == undefined) {
                    var ref_ele_class = "";
                }
                else {
                    var ref_ele_class = "";
                    if (jsonObj[i].prop[0].reference_class.length > 0) {
                        var class_Array = jsonObj[i].prop[0].reference_class;
                        ref_ele_class = class_Array[0];
                        for (var c = 1; c < jsonObj[i].prop[0].reference_class.length; c++) {
                            ref_ele_class += ' ' + class_Array[c] + '';
                        }
                    }
                }

                var cntrl_is_hide = jsonObj[i].prop[0].is_hide;
                if (objectclass == "" || objectclass == null || objectclass == undefined) {
                    var common_str = ' que_id="' + que_id + '" reference_class="' + reference_class + '" is_hide="' + cntrl_is_hide + '"';
                }
                else {
                    var common_str = ' objectclass="' + objectclass + '" objectname="' + objectname + '" que_id="' + que_id + '" reference_class="' + reference_class + '" is_hide="' + cntrl_is_hide + '"';
                }

                if (cnrl_type == 5) {                                   //replaced with type 500 to match with webapp functionality [16062021]
                    jsonObj[i].type = 500;
                }
                else {
                    // -- check enable disable flag --- /
                    var is_disabled = jsonObj[i].prop[0].is_disabled;
                    if (disabled_flag == 0 && (is_disabled == '' || is_disabled == null || is_disabled == undefined || is_disabled == "false" || is_disabled == "allow_once")) {
                        var enable_disable = ""; // element enable
                        var cls_enable = ""; // apply disbale class

                    } else {
                        var enable_disable = "disabled"; // element disabled
                        var cls_enable = "enable_cls"; // apply disbale class
                    }

                    if (target_div == "" || target_div == null || target_div == undefined) {
                        var new_id = curr_clps_new_id + '_' + check_type + '_' + jsonObj[i].que_id;
                    }
                    else {
                        var new_id = curr_clps_new_id + '_' + check_type + '_' + jsonObj[i].que_id + '_' + target_div;
                    }

                    var valid = jsonObj[i].prop[0].valid;
                    if (valid == "true") {
                        var mendatory_img = '<img src="images/mendatory.gif">';
                    } else {
                        // var mendatory_img = '';
                        var mendatory_img = '<img src="images/mendatory.gif" style="visibility: hidden">';
                    }

                    //***********remove label control changes start************

                    // Check for dependent element and apply class to current element
                    var ele_class = "";
                    if (jsonObj[i].prop[0].class1.length > 0) {
                        var class_Array = jsonObj[i].prop[0].class1;
                        ele_class = class_Array[0];
                        for (var c = 1; c < jsonObj[i].prop[0].class1.length; c++) {
                            ele_class += ' ' + class_Array[c] + '';
                        }
                    }

                    if (cntrl_is_hide == "true") {
                        var disp_cntrl = 'display:none;';
                        ele_class += ' st_hdn ';
                    } else if (ele_class == "") {
                        var disp_cntrl = '';
                    }
                    else {
                        var disp_cntrl = 'display:none;';
                    }

                    ele_class += ' ' + ref_ele_class;

                    var label_str = '';
                    var misc_Array = jsonObj[i].prop[0].misc_data;
                    var value = misc_Array[0].value;

                    var value_new = jsonObj[i].prop[0].value_new;
                    if (value_new == '' || value_new == null || value_new == undefined) { }
                    else {
                        value = value_new;
                    }

                    var view_label;
                    if (value == '' || value == null || value == undefined) {
                        view_label = "true";
                    } else {
                        if (jsonObj[i].type == 17) {
                            view_label = "false";            //for calc value is taken as equation
                            var eq_str = misc_Array[0].value;
                            if (eq_str == '' || eq_str == null || eq_str == undefined) {
                            }
                            else {
                                // new calculator
                                var myrow_for_misc = eq_str[0].myrow_for_misc;
                                if (myrow_for_misc == '' || myrow_for_misc == null || myrow_for_misc == undefined) { }
                                else {
                                    value = itemObj._checkStrObj(value);  // check_item
                                    view_label = value[0].view_label;
                                }
                            }
                        }
                        else {
                            value = itemObj._checkStrObj(value);  // check_item
                            var view_label = value[0].view_label;
                        }

                        if (view_label == '' || view_label == null || view_label == undefined) {
                            view_label = "true";
                        }

                        var car_check = value[0].car_check;
                        if (car_check == "true") {
                            Car_que_id_Array.push(jsonObj[i].que_id);
                        }
                    }

                    if (form_flag == 1 && jsonObj.length == 2) {
                        // invoice with single searchable
                        mendatory_img = '';
                        view_label = "false";
                    }


                    // for other than login url where label & control logic - mk - 09072025
                    if (i > 0) {
                        if (jsonObj[i - 1].type == 5 || jsonObj[i - 1].type == 500) {
                            view_label = "true";
                            prop_name = jsonObj[i - 1].prop[0].name;

                            if (prop_name == "" || prop_name == null || prop_name == undefined) {
                                prop_name = jsonObj[i].prop[0].name;
                            }
                        }
                    }

                    if (view_label == "true") {
                        var lbl_display = 1;
                        if (i != 0) {
                            if (jsonObj[i].type == 23 && jsonObj[i - 1].type == 0) {
                                // hide label in case of form and collapsible control combination
                                lbl_display = 0;
                            }
                        }
                        if (lbl_display == 1) {
                            if (prop_name == "" || prop_name == null || prop_name == undefined) { }
                            else {
                                label_str += '<div id="div_lbl_' + new_id + '">';
                                label_str += '<label class="lbl_type5" style="display:inline;word-break: break-word; font-size: 15px; font-family: calibri">' + prop_name + mendatory_img + ' </label>';
                                label_str += '</div>';

                                //////added comment icon for every control on hover [FT - 15072024]
                                //if (form_flag == 0 || form_flag == 2 || form_flag == 3) {
                                //    label_str += '<div class="cls-cntrl-comment-outer" id="container_cntrl_cmnt_' + new_id + '" style="display: inline;margin-left:5px;">';
                                //    label_str += '<i class="fa fa-comments icon-cntrl-cmnt cls-cmnt-cntrl" cntrl_checksheet_id="' + check_type + '" cntrl_que_id="' + que_id + '" cntrl_que_name="' + prop_name + '"></i>';
                                //    label_str += '<span class="notification-counter" style="display:none;"></span>';
                                //    label_str += '</div>';
                                //}

                            }
                        }
                    }
                    //***********remove label control changes end************

                    ////added comment icon for every control on swipe right [FT - 12022025]
                    if (form_flag == 0 || form_flag == 2 || form_flag == 3) {
                        if (cnrl_type != 0) {

                            var width_layout = jsonObj[i].width_layout;
                            if (width_layout == "" || width_layout == null || width_layout == undefined) {
                                newdiv += '<li class="swipeout ">';
                            }
                            else {
                                if (width_layout == "50-50") {
                                    // 50% 1st control - 50% 2nd control
                                    newdiv += '<li class="swipeout w-50-50 ">';
                                }
                                else if (width_layout == "75-25") {
                                    // 75% 1st control label - 25% 1st control ui
                                    newdiv += '<li class="swipeout w-75-25 ">';
                                }
                                else {
                                    newdiv += '<li class="swipeout ">';
                                }
                            }
                        }
                    }

                    // Question Start
                    if (jsonObj[i].type == 0) { // is_deleted
                        if (type0_ele_class == "true") {
                            //for type0 dependency (insolare(in.rt))
                            newdiv += '</div>';
                        }

                        if (ele_class != "") {
                            //for type0 dependency (insolare(in.rt))
                            type0_ele_class = "true";
                        }
                        else {
                            type0_ele_class = "false";
                        }

                        newdiv += '<div id="div_que_' + new_id + '" class="cntrl_main_div ' + ele_class + '" style="padding:0; margin:0; font-size: 10pt;' + disp_cntrl + '">';
                        newdiv += '<hr style="border-top: 1px solid #B4B6BA; margin-bottom: 0px !important;" />';

                        if (jsonObj[i].value == '' || jsonObj[i].value == null || jsonObj[i].value == undefined || jsonObj[i].value == ' ') { }
                        else {
                            newdiv += '<label id="qh_' + new_id + '" style="display:block; text-align:justify; margin-bottom:10px; font-size: 15px; font-weight:bold; font-family: calibri; padding:10px; border-bottom:  1px solid #B4B6BA; background-color: #f5f5f5">' + jsonObj[i].value + '</label>';
                        }

                        if (type0_ele_class == "true") { }
                        else {
                            newdiv += '</div>';
                        }
                    }
                    // Text Box
                    else if (jsonObj[i].type == 1) {
                        var misc_Array = jsonObj[i].prop[0].misc_data;
                        var limit = misc_Array[0].limit;
                        var textbox_type, defaul_value;
                        var value = misc_Array[0].value;
                        if (value == '' || value == null || value == undefined) {
                            var textbox_type = "", default_val = "";
                            var box_view = "";
                            var speech_btn = 'false';
                        } else {
                            value = itemObj._checkStrObj(misc_Array[0].value);  // check_item

                            var textbox_type = value[0].box_type;
                            var default_value = misc_Array[0].default_value;
                            var box_view = value[0].box_view;
                            var speech_btn = value[0].speech_btn;
                        }

                        if (box_view == '' || box_view == null || box_view == undefined) {
                            box_view = "textbox";
                        }
                        if (textbox_type == '' || textbox_type == null || textbox_type == undefined) {
                            textbox_type = "text";
                        }
                        if (speech_btn == '' || speech_btn == null || speech_btn == undefined) {
                            speech_btn = 'false';
                        }

                        if (default_value == '' || default_value == null || default_value == undefined) {
                            var default_val = "";
                        } else {
                            var default_val = default_value[0];
                            var value_type = default_val.substring(2, 1);
                            var sub_get_value = default_val.substring(2, default_val.length - 2);
                            if (value_type == "#") {
                                default_val = curr_all_data_20[sub_get_value];
                                if (default_val == '' || default_val == ' ' || default_val == null || default_val == undefined) {
                                    default_val = "N/A";
                                }
                                //if (sub_get_value != 'address') {
                                //    enable_disable = 'disabled';
                                //}
                            }
                        }

                        if (limit == '' || limit == null || limit == undefined) {
                            var param_limit = "";
                        } else {
                            limit = parseInt(limit);
                            var param_limit = 'onkeyup="mk_limitText(this,' + limit + ');"';
                        }

                        newdiv += '<div id="div_txt_' + new_id + '" class="cntrl_main_div ' + ele_class + '" que_id="' + jsonObj[i].que_id + '" style="' + disp_cntrl + '" ' + cls_enable + ' ' + common_str + '>';
                        newdiv += label_str;

                        var obj = {
                            read_type: 'readchecksheet',
                            ans: '',
                            new_id: new_id,
                            value: jsonObj[i].value,
                            default_val: default_val,
                            enable_disable: enable_disable,
                            param: param_limit,
                            textbox_type: textbox_type,
                            curr_clps_new_id: '',
                            old_ans: '',
                            box_view: box_view,
                            speech_btn: speech_btn
                        }

                        var control = new MkControls(obj);
                        newdiv += control.build_type_1_text();
                        newdiv += '</div>';
                    }
                    // Radio Button
                    else if (jsonObj[i].type == 2) {
                        // Check for dependency array and put event on current element
                        var param = "";
                        var data = [];
                        if (jsonObj[i].dependency.length > 0) {

                            if (jsonObj[i].dependency[0].dep_class == "") { }
                            else {
                                for (j = 0; j < jsonObj[i].dependency.length; j++) {
                                    var t_dep_type = jsonObj[i].dependency[j].dep_type;
                                    if (t_dep_type == 0 || t_dep_type == 1 || t_dep_type == 2 || t_dep_type == 4) {
                                        var ele_type = jsonObj[i].type;
                                        var dep_ans = jsonObj[i].dependency[j].dep_ans;
                                        var dep_class = jsonObj[i].dependency[j].dep_class;
                                        var step = curr_survey_data["step"];
                                        var glob_class = check_type + "_" + step + "_" + i;
                                        var match_class = jsonObj[i].dependency[j].match_class;
                                        var match_count = jsonObj[i].dependency[j].match_count;

                                        var dep_action = jsonObj[i].dependency[j].dep_action;
                                        if (dep_action == "" || dep_action == null || dep_action == undefined) {
                                            dep_action = "show";
                                        }

                                        data.push({
                                            ele_id: new_id,
                                            ele_type: ele_type,
                                            dep_ans: dep_ans,
                                            dep_class: dep_class,
                                            dep_action: dep_action,
                                            glob_class: glob_class,
                                            match_class: match_class,
                                            match_count: match_count,
                                            dep_type: t_dep_type
                                        });

                                        if (form_flag == 1) {
                                            dependency_array_count_type22++;
                                        }

                                        if (t_dep_type == 0) {
                                            Show_class_Array.push(dep_class);
                                        } else if (t_dep_type == 4) {
                                            Show_class_Array.push(match_class);
                                        }

                                        // if dependency + default value then autocall function
                                        var misc_Array = jsonObj[i].prop[0].misc_data;
                                        var default_value = misc_Array[0].default_value;
                                        if (default_value == '' || default_value == null || default_value == undefined) {
                                            var default_val = "";
                                        } else {
                                            //dependency_Array.push(data); // fill_array_for_show/hide_question
                                        }
                                        dependency_Array.push(data); // fill_array_for_show/hide_question
                                    }
                                }

                                var paramData = JSON.stringify(data);
                                if (jsonObj[i].dependency[0].dep_type == 0) {
                                    param = "change_validation_by_dep_type_0('" + encodeURIComponent(paramData) + "'); ";
                                } else if (jsonObj[i].dependency[0].dep_type == 1) {
                                    param = "show_hide_Element('" + encodeURIComponent(paramData) + "'); ";
                                } else if (jsonObj[i].dependency[0].dep_type == 2) {
                                    param = "set_global_show_hide_class('" + encodeURIComponent(paramData) + "'); ";
                                } else if (jsonObj[i].dependency[0].dep_type == 4) {
                                    param = "show_hide_element_by_match_class_element('" + encodeURIComponent(paramData) + "'); ";
                                }
                            }
                        }

                        newdiv += '<div id="div_rdo_' + new_id + '" class="cntrl_main_div ' + ele_class + '" style="height:100%; ' + disp_cntrl + '" ' + cls_enable + ' ' + common_str + '>';
                        newdiv += label_str;

                        var rdo_Array = jsonObj[i].value;
                        var weightage_Array = jsonObj[i].prop[0].weightage;
                        var misc_Array = jsonObj[i].prop[0].misc_data;
                        var default_value = misc_Array[0].default_value;
                        var view_type = misc_Array[0].view_type;

                        if (default_value == '' || default_value == null || default_value == undefined) {
                            var default_val = "";
                        } else {
                            var default_val = default_value[0];
                        }

                        //var br_str = "<br />";
                        //if (view_type == '' || view_type == null || view_type == undefined) {
                        //} else {
                        //    if (view_type == "horizontal") {
                        //        br_str = "";
                        //    }
                        //}

                        // view_type = "toggle"

                        var obj = {
                            read_type: 'readchecksheet',
                            ans: '',
                            new_id: new_id,
                            value: jsonObj[i].value,
                            default_val: default_val,
                            enable_disable: enable_disable,
                            param: param,
                            rdo_Array: rdo_Array,
                            weightage_Array: weightage_Array,
                            view_type: view_type
                        }

                        var control = new MkControls(obj);
                        newdiv += control.build_type_2_radio();
                        newdiv += '</div>';
                    }

                    // Select Drop Down
                    else if (jsonObj[i].type == 3) {
                        // Check for dependency array and put event on current element
                        var param = "";
                        var param3 = "";
                        var data = [];
                        var data3 = [];
                        if (jsonObj[i].dependency.length > 0) {

                            if (jsonObj[i].dependency[0].dep_class == "") { }
                            else {
                                for (j = 0; j < jsonObj[i].dependency.length; j++) {
                                    var t_dep_type = jsonObj[i].dependency[j].dep_type;
                                    if (t_dep_type == 0 || t_dep_type == 1 || t_dep_type == 2 || t_dep_type == 3 || t_dep_type == 4 || t_dep_type == 5) {
                                        var ele_type = jsonObj[i].type;
                                        var dep_ans = jsonObj[i].dependency[j].dep_ans;
                                        var dep_class = jsonObj[i].dependency[j].dep_class;
                                        var step = curr_survey_data["step"];
                                        var glob_class = check_type + "_" + step + "_" + i;
                                        var ccd_value = jsonObj[i].dependency[j].ccd_value;
                                        if (ccd_value == '' || ccd_value == null || ccd_value == undefined) { ccd_value = '' }
                                        var match_class = jsonObj[i].dependency[j].match_class;
                                        var match_count = jsonObj[i].dependency[j].match_count;
                                        var copy_array = jsonObj[i].dependency[j].copy_array;
                                        if (copy_array == '' || copy_array == null || copy_array == undefined) {
                                            copy_array = [];
                                        }

                                        var dep_action = jsonObj[i].dependency[j].dep_action;
                                        if (dep_action == "" || dep_action == null || dep_action == undefined) {
                                            dep_action = "show";
                                        }

                                        if (t_dep_type == 3) {
                                            data3.push({
                                                ele_id: "ddl_" + new_id + "",
                                                ele_type: ele_type,
                                                dep_ans: dep_ans,
                                                dep_class: dep_class,
                                                dep_action: dep_action,
                                                glob_class: glob_class,
                                                ccd_value: ccd_value,
                                                ccd_ans: '',
                                                match_class: match_class,
                                                match_count: match_count,
                                                dep_type: t_dep_type,
                                                copy_array: copy_array
                                            });
                                        }
                                        else {
                                            data.push({
                                                ele_id: "ddl_" + new_id + "",
                                                ele_type: ele_type,
                                                dep_ans: dep_ans,
                                                dep_class: dep_class,
                                                dep_action: dep_action,
                                                glob_class: glob_class,
                                                ccd_value: ccd_value,
                                                ccd_ans: '',
                                                match_class: match_class,
                                                match_count: match_count,
                                                dep_type: t_dep_type,
                                                copy_array: copy_array
                                            });
                                        }
                                        //dependency_Array.push(data); // fill_array_for_show/hide_question

                                        if (form_flag == 1) {
                                            dependency_array_count_type22++;
                                        }

                                        if (t_dep_type == 0) {
                                            Show_class_Array.push(dep_class);
                                        }
                                        else if (t_dep_type == 4) {
                                            Show_class_Array.push(match_class);
                                        }
                                        else if (t_dep_type == 5) {
                                            for (c = 0; c < copy_array.length; c++) {
                                                var copy_class = copy_array[c].copy_class;
                                                var paste_class = copy_array[c].paste_class;
                                                Show_class_Array.push(copy_class);
                                                Show_class_Array.push(paste_class);
                                            }
                                        }
                                        else {
                                            // if dependency + default value then autocall function
                                            var misc_Array = jsonObj[i].prop[0].misc_data;
                                            var default_value = misc_Array[0].default_value;
                                            if (default_value == '' || default_value == null || default_value == undefined) {
                                                var default_val = "";
                                            } else {
                                                //dependency_Array.push(data); // fill_array_for_show/hide_question
                                            }
                                            dependency_Array.push(data); // fill_array_for_show/hide_question
                                        }
                                    }
                                }

                                var paramData = JSON.stringify(data);
                                if (jsonObj[i].dependency[0].dep_type == 0) {
                                    param = "change_validation_by_dep_type_0('" + encodeURIComponent(paramData) + "'); ";
                                } else if (jsonObj[i].dependency[0].dep_type == 1) {
                                    param = "show_hide_Element('" + encodeURIComponent(paramData) + "'); ";
                                } else if (jsonObj[i].dependency[0].dep_type == 2) {
                                    param = "set_global_show_hide_class('" + encodeURIComponent(paramData) + "'); ";
                                } else if (jsonObj[i].dependency[0].dep_type == 4) {
                                    param = "show_hide_element_by_match_class_element('" + encodeURIComponent(paramData) + "'); ";
                                } else if (jsonObj[i].dependency[0].dep_type == 5) {
                                    param = "copy_paste_value_by_class('" + encodeURIComponent(paramData) + "'); ";
                                }
                            }
                        }

                        if (data3.length > 0) {
                            var paramData = JSON.stringify(data3);
                            param3 = "set_cascading_dependency('" + encodeURIComponent(paramData) + "'); ";
                            param = param + param3;
                        }

                        newdiv += '<div id="div_ddl_' + new_id + '" class="cntrl_main_div ' + ele_class + '" style="' + disp_cntrl + '" ' + cls_enable + ' ' + common_str + '>';
                        newdiv += label_str;

                        var ddl_Array = jsonObj[i].value;
                        var weightage_Array = jsonObj[i].prop[0].weightage;
                        var misc_Array = jsonObj[i].prop[0].misc_data;
                        var default_value = misc_Array[0].default_value;
                        if (default_value == '' || default_value == null || default_value == undefined) {
                            var default_val = "";
                        } else {
                            var default_val = default_value[0];
                            var value_type = default_val.substring(2, 1);
                            if (value_type == "#") {
                                var sub_get_value = default_val.substring(2, default_val.length - 2);
                                default_value[0] = curr_all_data_20[sub_get_value];
                                default_val = default_value[0];
                            }
                        }

                        var obj = {
                            read_type: 'readchecksheet',
                            ans: '',
                            new_id: new_id,
                            default_val: default_val,
                            enable_disable: enable_disable,
                            param: param,
                            ddl_Array: ddl_Array,
                            weightage_Array: weightage_Array
                        }

                        var control = new MkControls(obj);
                        newdiv += control.build_type_3_dropdown();
                        newdiv += '</div>';
                    }

                    // Numeric Text Box
                    else if (jsonObj[i].type == 4) {
                        var misc_Array = jsonObj[i].prop[0].misc_data;
                        var default_value = misc_Array[0].default_value;
                        var limit = misc_Array[0].limit;

                        if (default_value == '' || default_value == null || default_value == undefined) {
                            var default_val = "";
                        } else {
                            var default_val = default_value[0];
                            var value_type = default_val.substring(2, 1);
                            var sub_get_value = default_val.substring(2, default_val.length - 2);
                            if (value_type == "#") {
                                default_val = curr_all_data_20[sub_get_value];
                                if (default_val == '' || default_val == ' ' || default_val == null || default_val == undefined) {
                                    default_val = "N/A";
                                }
                            }
                        }

                        if (limit == '' || limit == null || limit == undefined) {
                            var param_limit = "";
                        } else {
                            limit = parseInt(limit);
                            var param_limit = 'onkeyup="mk_limitText(this,' + limit + ');"';
                        }

                        newdiv += '<div id="div_txtno_' + new_id + '" class="cntrl_main_div ' + ele_class + '" style="' + disp_cntrl + '" ' + cls_enable + ' ' + common_str + '>';
                        newdiv += label_str;
                        var cntrl_is_hide = jsonObj[i].prop[0].is_hide;

                        var obj = {
                            read_type: 'readchecksheet',
                            ans: '',
                            new_id: new_id,
                            value: jsonObj[i].value,
                            default_val: default_val,
                            enable_disable: enable_disable,
                            param: param_limit,
                            misc_Array: misc_Array,
                            is_hide: cntrl_is_hide
                        }
                        var control = new MkControls(obj);
                        newdiv += control.build_type_4_number();
                        newdiv += '</div>';
                    }
                    // Label
                    else if (jsonObj[i].type == 5) {
                        newdiv += '<div id="div_lbl_' + new_id + '" class="cntrl_main_div ' + ele_class + '" style="padding-left:10px;' + disp_cntrl + '">';

                        var obj = {
                            new_id: new_id,
                            value: jsonObj[i].value
                        }
                        var control = new MkControls(obj);
                        newdiv += control.build_type_5_label();
                        newdiv += '</div>';
                    }
                    // Check Box
                    else if (jsonObj[i].type == 6) {
                        // Check for dependency array and put event on current element
                        var param = "";
                        var data = [];
                        if (jsonObj[i].dependency.length > 0) {

                            if (jsonObj[i].dependency[0].dep_class == "") { }
                            else {
                                for (j = 0; j < jsonObj[i].dependency.length; j++) {
                                    var t_dep_type = jsonObj[i].dependency[j].dep_type;
                                    if (t_dep_type == 0 || t_dep_type == 1 || t_dep_type == 2 || t_dep_type == 4 || t_dep_type == 5) {
                                        var ele_type = jsonObj[i].type;
                                        var dep_ans = jsonObj[i].dependency[j].dep_ans;
                                        var dep_class = jsonObj[i].dependency[j].dep_class;
                                        var step = curr_survey_data["step"];
                                        var glob_class = check_type + "_" + step + "_" + i;
                                        var copy_array = jsonObj[i].dependency[j].copy_array;
                                        if (copy_array == '' || copy_array == null || copy_array == undefined) {
                                            copy_array = [];
                                        }

                                        var dep_action = jsonObj[i].dependency[j].dep_action;
                                        if (dep_action == "" || dep_action == null || dep_action == undefined) {
                                            dep_action = "show";
                                        }

                                        data.push({
                                            ele_id: new_id,
                                            ele_type: ele_type,
                                            dep_ans: dep_ans,
                                            dep_class: dep_class,
                                            dep_action: dep_action,
                                            glob_class: glob_class,
                                            dep_type: t_dep_type,
                                            copy_array: copy_array
                                        });

                                        if (t_dep_type == 0) {
                                            Show_class_Array.push(dep_class);
                                        } else if (t_dep_type == 5) {
                                            for (c = 0; c < copy_array.length; c++) {
                                                var copy_class = copy_array[c].copy_class;
                                                var paste_class = copy_array[c].paste_class;
                                                Show_class_Array.push(copy_class);
                                                Show_class_Array.push(paste_class);
                                            }
                                        }

                                        if (form_flag == 1) {
                                            dependency_array_count_type22++;
                                        }

                                        // if dependency + default value then autocall function
                                        var misc_Array = jsonObj[i].prop[0].misc_data;
                                        var default_value = misc_Array[0].default_value;
                                        if (default_value == '' || default_value == null || default_value == undefined) {
                                            var default_val = "";
                                        } else {
                                            dependency_Array.push(data); // fill_array_for_show/hide_question
                                        }
                                    }
                                }

                                var paramData = JSON.stringify(data);
                                if (jsonObj[i].dependency[0].dep_type == 0) {
                                    param = "change_validation_by_dep_type_0('" + encodeURIComponent(paramData) + "'); ";
                                } else if (jsonObj[i].dependency[0].dep_type == 1) {
                                    param = "show_hide_Element('" + encodeURIComponent(paramData) + "'); ";
                                } else if (jsonObj[i].dependency[0].dep_type == 2) {
                                    param = "set_global_show_hide_class('" + encodeURIComponent(paramData) + "'); ";
                                } else if (jsonObj[i].dependency[0].dep_type == 4) {
                                    param = "show_hide_element_by_match_class_element('" + encodeURIComponent(paramData) + "'); ";
                                } else if (jsonObj[i].dependency[0].dep_type == 5) {
                                    param = "copy_paste_value_by_class('" + encodeURIComponent(paramData) + "'); ";
                                }
                            }
                        }

                        newdiv += '<div id="div_chk_' + new_id + '" class="cntrl_main_div ' + ele_class + '" style="' + disp_cntrl + '" ' + cls_enable + ' ' + common_str + '>';
                        newdiv += label_str;

                        var chk_Array = jsonObj[i].value;
                        var weightage_Array = jsonObj[i].prop[0].weightage;
                        var misc_Array = jsonObj[i].prop[0].misc_data;
                        var default_value = misc_Array[0].default_value;
                        var view_type = misc_Array[0].view_type;

                        if (default_value == '' || default_value == null || default_value == undefined) {
                            var default_val = "";
                        } else {
                            var default_val = default_value;
                        }

                        var br_str = "<br />";
                        if (view_type == '' || view_type == null || view_type == undefined) {
                        } else {
                            if (view_type == "horizontal") {
                                br_str = "";
                            }
                        }

                        var obj = {
                            read_type: 'readchecksheet',
                            ans: '',
                            new_id: new_id,
                            value: jsonObj[i].value,
                            default_val: default_val,
                            enable_disable: enable_disable,
                            param: param,
                            chk_Array: chk_Array,
                            weightage_Array: weightage_Array,
                            br_str: br_str,
                        }

                        var control = new MkControls(obj);
                        newdiv += control.build_type_6_checkbox();
                        newdiv += '</div>';
                    }
                    // Camera Button
                    else if (jsonObj[i].type == 7) {
                        var misc_Array = jsonObj[i].prop[0].misc_data;
                        var value, photo_type, latlong, quality, width, height, target_class, burstmode, old_photo_class, scan_mode, ref_class, max_file_size, model_name, prompt_text, prompt_text_array, group_photo_class;
                        for (h = 0; h < misc_Array.length; h++) {
                            var type = misc_Array[h].type;
                            if (type == 6) {
                                value = itemObj._checkStrObj(misc_Array[0].value);  // check_item
                                photo_type = value[0].photo_type;
                                latlong = value[0].latlong;
                                quality = value[0].quality;
                                width = value[0].width;
                                height = value[0].height;
                                target_class = value[0].target_class;
                                burstmode = value[0].burstmode;
                                old_photo_class = value[0].old_photo_class;
                                scan_mode = value[0].scan_mode;
                                ref_class = value[0].ref_class;
                                max_file_size = value[0].max_file_size;
                                model_name = value[0].model_name;
                                prompt_text = value[0].prompt_text;
                                prompt_text_array = value[0].prompt_text_array;
                                group_photo_class = value[0].group_photo_class;
                            }
                        }
                        if (photo_type == '' || photo_type == null || photo_type == undefined) {
                            photo_type = "camera", latlong = "false";
                        }

                        if (quality == '' || quality == null || quality == undefined) {
                            quality = "50";
                        }
                        if (width == '' || width == null || width == undefined) {
                            width = "640";
                        }
                        if (height == '' || height == null || height == undefined) {
                            height = "480";
                        }
                        if (max_file_size == '' || max_file_size == null || max_file_size == undefined) {
                            max_file_size = 5;
                        }

                        if (target_class == '' || target_class == null || target_class == undefined) {
                            target_class = "";
                        }
                        else {
                            Show_class_Array.push(target_class);
                        }

                        if (old_photo_class == '' || old_photo_class == null || old_photo_class == undefined) {
                            old_photo_class = "";
                        }
                        else {
                            //Show_class_Array.push(old_photo_class);
                        }

                        Type7_old_photo_class_Array.push(old_photo_class);

                        if (burstmode == '' || burstmode == null || burstmode == undefined) {
                            burstmode = "false";
                        }

                        if (scan_mode == '' || scan_mode == null || scan_mode == undefined) {
                            scan_mode = "false";
                        }

                        if (model_name == "" || model_name == null || model_name == undefined) {
                            model_name = "";
                        }

                        if (prompt_text == "" || prompt_text == null || prompt_text == undefined) {
                            prompt_text = "";
                        }

                        if (prompt_text_array == "" || prompt_text_array == null || prompt_text_array == undefined) {
                            prompt_text_array = [];
                        }

                        if (group_photo_class == "" || group_photo_class == null || group_photo_class == undefined) {
                            group_photo_class = "";
                        }

                        newdiv += "<div id='div_cbtn_" + new_id + "' class='cntrl_main_div " + ele_class + "' style='color: #000; " + disp_cntrl + "' " + cls_enable + " " + common_str + ">";
                        newdiv += label_str;

                        if (ref_class == '' || ref_class == null || ref_class == undefined) {
                            ref_class = "";
                        }

                        if (form_flag == 7 || form_flag == 8 || form_flag == 12 || (form_flag == 0 && c_is_online == 1) || (form_flag == 1 && c_is_online == 1) || (form_flag == 6 && survey_mode == "online" && redirect == "task") || (curr_page_flag == "viewsitedata_task" && survey_mode == "online" && redirect == "task")) {
                            //upload photos online for customer/user and task form
                            if (ref_class == '' || ref_class == null || ref_class == undefined) {
                                var param = 'CaptureClick_Customer("' + i + '", "' + jsonObj[i].que_id + '", "cbtn_' + new_id + '", "' + form_flag_temp + '","' + photo_type + '","' + latlong + '","' + width + '","' + height + '","' + quality + '","0", "' + burstmode + '", "' + target_div + '")';
                            }
                            else {
                                photo_type = "Attendance";                      //for profile photo face detection camera plugin [FT - 01122023]

                                // compare attendance and print photo
                                var param = 'verify_user_profile_photo("' + i + '", "' + jsonObj[i].que_id + '", "cbtn_' + new_id + '", "' + form_flag_temp + '","' + photo_type + '","' + latlong + '","' + width + '","' + height + '","' + quality + '","0", "' + burstmode + '", "' + ref_class + '")';
                            }
                        }
                        else {


                            if (ref_class == '' || ref_class == null || ref_class == undefined) {

                                if (photo_type == "GroupAttendance") {
                                    var param = 'verify_group_photo_with_face_detection("' + i + '", "' + jsonObj[i].que_id + '", "cbtn_' + new_id + '", "' + form_flag_temp + '","' + photo_type + '","' + latlong + '","' + width + '","' + height + '","' + quality + '","0", "' + burstmode + '")';
                                }
                                else {
                                    var param = 'CaptureClick("' + i + '", "' + jsonObj[i].que_id + '", "cbtn_' + new_id + '", "' + form_flag_temp + '","' + photo_type + '","' + latlong + '","' + width + '","' + height + '","' + quality + '","0", "' + burstmode + '")';
                                }
                            }
                            else {
                                // compare attendance and print photo
                                var param = 'verify_user_profile_photo("' + i + '", "' + jsonObj[i].que_id + '", "cbtn_' + new_id + '", "' + form_flag_temp + '","' + photo_type + '","' + latlong + '","' + width + '","' + height + '","' + quality + '","0", "' + burstmode + '", "' + ref_class + '")';
                            }
                        }

                        var obj = {
                            index: i,
                            que_id: jsonObj[i].que_id,
                            new_id: new_id,
                            name: prop_name,
                            target_class: target_class,
                            old_photo_class: old_photo_class,
                            enable_disable: enable_disable,
                            param: param,
                            param1: '',
                            src_str: 'images/camera.png'
                        }

                        var control = new MkControls(obj);
                        newdiv += control.build_type_7_camera();

                        var hdn_cam_ary = [];
                        hdn_cam_ary.push({
                            'scan_mode': scan_mode,
                            'max_file_size': max_file_size,
                            'model_name': model_name,
                            'prompt_text': prompt_text,
                            'prompt_text_array': prompt_text_array,
                            'group_photo_class': group_photo_class
                        });

                        var hdn_cam_ary_str = JSON.stringify(hdn_cam_ary);
                        hdn_cam_ary_str = encodeURIComponent(hdn_cam_ary_str);
                        newdiv += '<input type="hidden" id="hdn_cbtn_' + new_id + '" value="' + hdn_cam_ary_str + '" />';
                        newdiv += '<input type="hidden" id="hdn_cbtn_ans_' + new_id + '" value="" />';

                        newdiv += '</div>';
                    }

                    // Calendar
                    else if (jsonObj[i].type == 8) {
                        var misc_Array = jsonObj[i].prop[0].misc_data;
                        var value = misc_Array[0].value;

                        if (value == '' || value === null || value == undefined) {
                            var mode = "date";
                            var main_class = "";
                            var ref_class = "";
                            var end_duration = "60";
                            var ref_duration_class = '';
                        } else {
                            value = itemObj._checkStrObj(misc_Array[0].value);  // check_item
                            var mode = value[0].mode;
                            var main_class = value[0].main_class;
                            var ref_class = value[0].ref_class;
                            Show_class_Array.push(ref_class);
                            var end_duration = value[0].duration;           //in minutes
                            var end_duration_type = value[0].duration_type;
                            var ref_duration_class = value[0].ref_duration_class;
                            if (ref_duration_class == '' || ref_duration_class == null || ref_duration_class == undefined) {
                                ref_duration_class = '';

                                // commented for getting duration from end date static duration 04012021 - project site construction
                                // ref_class = '';
                            }
                            else {
                                Show_class_Array.push(ref_duration_class);
                            }

                            /// ----  date range start ---- 12102020 (ATC) ///
                            var range_start = value[0].range_start;
                            if (range_start == "" || range_start == null || range_start == undefined) { }
                            else {
                                var value_type = range_start.substring(2, 1);
                                var sub_get_value = range_start.substring(2, range_start.length - 2);
                                if (value_type == "@") {
                                    Show_class_Array.push(sub_get_value);
                                }
                            }

                            var range_end = value[0].range_end;
                            if (range_end == '' || range_end == null || range_end == undefined) { }
                            else {
                                var value_type = range_end.substring(2, 1);
                                var sub_get_value = range_end.substring(2, range_end.length - 2);
                                if (value_type == "@") {
                                    Show_class_Array.push(sub_get_value);
                                }
                            }

                            //----new dev for ATC, to get current datetime on btn click [haresh1.vt - 05052021]
                            var current_datetime_btn = value[0].current_datetime_btn;
                            if (current_datetime_btn == "" || current_datetime_btn == null || current_datetime_btn == undefined) {
                                current_datetime_btn = "false";
                            }
                            var current_datetime_btn_text = value[0].current_datetime_btn_text;
                            if (current_datetime_btn_text == "" || current_datetime_btn_text == null || current_datetime_btn_text == undefined) {
                                current_datetime_btn_text = "Start";
                            }
                        }

                        if (end_duration == "" || end_duration == null || end_duration == undefined) {
                            end_duration = "60";                    //in minutes;
                        }

                        if (end_duration_type == '' || end_duration_type == null || end_duration_type == undefined) {
                            end_duration_type = 'days';
                        }

                        if (current_datetime_btn != "true") {
                            Type8_data_Array.push({
                                'mode': mode,
                                'divId': new_id,
                                'ref_class': ref_class,
                                'dur_class': ref_duration_class
                            });
                        }

                        var datetime_format = localStorage.getItem("dateFormat");
                        var datetime_format_ary = datetime_format.split(" ");
                        var time_format = datetime_format_ary[1];

                        var default_value = misc_Array[0].default_value;
                        if (default_value == '' || default_value == null || default_value == undefined) {
                            var default_val = "";
                        } else {
                            var default_val = default_value[0];
                            if (default_val == 'today' || default_val == 'first' || default_val == 'last') {
                                var d = new Date();

                                if (task_creation_date == "" || task_creation_date == null || task_creation_date == undefined) {
                                    var d = new Date();
                                    if (jsonObj[i].que_id == 10) {
                                        //start date or assign date
                                        task_creation_date = d;
                                    }
                                }
                                else {
                                    if (jsonObj[i].que_id == 1001) {
                                        // End Date
                                        var d = new Date(task_creation_date);

                                        if (end_duration_type == 'days') {
                                            d.setDate(d.getDate() + parseInt(end_duration));
                                        }
                                        else if (end_duration_type == 'hours') {
                                            d.setHours(d.getHours() + parseInt(end_duration));
                                        }
                                        else if (end_duration_type == 'minutes') {
                                            d.setMinutes(d.getMinutes() + parseInt(end_duration));
                                        }
                                        else {
                                            d.setSeconds(d.getSeconds() + parseInt(end_duration));
                                        }

                                    }
                                    else {
                                        // Assign Date
                                        var d = new Date(task_creation_date);
                                    }
                                }

                                if (default_val == 'today') {
                                    var d1 = d;
                                } else if (default_val == 'first') {
                                    var d1 = new Date(d.getFullYear(), d.getMonth(), 1);
                                } else {
                                    var d1 = new Date(d.getFullYear(), d.getMonth() + 1, 0);
                                }

                                var mm1 = d1.getMonth() + 1; // January is 0!
                                var dd1 = d1.getDate();
                                var hour = d1.getHours()
                                var min = d1.getMinutes();
                                var yyyy1 = d1.getFullYear();
                                var second = d1.getSeconds();

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
                                if (second < 10) {
                                    second = '0' + second;
                                }

                                if (mode == 'date') {
                                    default_val = mm1 + '/' + dd1 + '/' + yyyy1;
                                    var t_default_val = convert_datetime_by_format(default_val, mode);
                                    default_val = t_default_val;
                                }
                                else if (mode == 'datetime') {
                                    if (time_format == "HH:mm:ss") {
                                        default_val = mm1 + '/' + dd1 + '/' + yyyy1 + ' ' + hour + ':' + min + ':' + second;
                                    }
                                    else {
                                        default_val = mm1 + '/' + dd1 + '/' + yyyy1 + ' ' + hour + ':' + min;
                                    }
                                    var t_default_val = convert_datetime_by_format(default_val, mode);
                                    default_val = t_default_val;
                                }
                                else {
                                    default_val = hour + ':' + min;
                                }
                            } else {
                                var value_type = default_val.substring(2, 1);
                                var sub_get_value = default_val.substring(2, default_val.length - 2);
                                if (value_type == "#") {
                                    default_val = curr_all_data_20[sub_get_value];
                                }
                                else {
                                    var default_val = "";
                                }
                            }
                        }

                        newdiv += '<div id="div_cal_' + new_id + '" class="cntrl_main_div ' + ele_class + '" style="' + disp_cntrl + '" ' + cls_enable + ' ' + common_str + '>';
                        newdiv += label_str;

                        var obj = {
                            read_type: 'readchecksheet',
                            ans: '',
                            new_id: new_id,
                            value: jsonObj[i].value,
                            default_val: default_val,
                            enable_disable: enable_disable,
                            main_class: main_class,
                            ref_class: ref_class,
                            dur_class: ref_duration_class,
                            dur_type: end_duration_type,
                            duration: end_duration,
                            mode: mode,
                            current_datetime_btn: current_datetime_btn,
                            current_datetime_btn_text: current_datetime_btn_text
                        }
                        var control = new MkControls(obj);
                        newdiv += control.build_type_8_calendar();

                        newdiv += '</div>';
                    }

                    // Signature Button
                    else if (jsonObj[i].type == 9) {
                        if (form_flag == 7 || (form_flag == 6 && survey_mode == "online") || (curr_page_flag == "viewsitedata_task" && survey_mode == "online")) {
                            //upload signature online for customer and task form
                            var param = 'CaptureClick_sign_Customer("' + i + '", "' + jsonObj[i].que_id + '", "sign_' + new_id + '","' + form_flag_temp + '", "0")';
                        }
                        else {
                            var param = 'CaptureClick_sign("' + i + '", "' + jsonObj[i].que_id + '", "sign_' + new_id + '","' + form_flag_temp + '", "0")';
                        }

                        newdiv += "<div id='div_sign_" + new_id + "' class='cntrl_main_div " + ele_class + "' style='" + disp_cntrl + "' " + cls_enable + " " + common_str + ">";
                        newdiv += label_str;

                        var obj = {
                            read_type: 'readchecksheet',
                            new_id: new_id,
                            name: prop_name,
                            enable_disable: enable_disable,
                            param: param,
                            param1: '',
                            src_str: 'images/signature_box.png'
                        }
                        var control = new MkControls(obj);
                        newdiv += control.build_type_9_sign();
                        newdiv += '</div>';
                    }

                    // Question End
                    //else if (jsonObj[i].type == 10) {
                    //    newdiv += '</div>';
                    //}

                    // Camera Button with Latlong
                    else if (jsonObj[i].type == 11) {
                        var param = "CaptureClick_latlong('" + i + "', '" + jsonObj[i].que_id + "', 'cbtnLL_" + new_id + "','" + form_flag_temp + "')";

                        newdiv += '<div id="div_cbtnLL_' + new_id + '" class="cntrl_main_div ' + ele_class + '" style="' + disp_cntrl + '" ' + cls_enable + ' ' + common_str + '>';
                        newdiv += label_str;

                        newdiv += '<img src="images/camera_latlong.png" id="cbtnLL_' + new_id + '" onclick = "' + param + '" style="height:50px; width:50px; margin-left: 5px; border-radius:7px" '
                            + cls_enable + '/></div>';
                    }

                    // Range Validator (numeric box)
                    else if (jsonObj[i].type == 12) {
                        var start_range = jsonObj[i].value[0];
                        var end_range = jsonObj[i].value[1];

                        var misc_Array = jsonObj[i].prop[0].misc_data;
                        var value = misc_Array[0].value;
                        if (value == '' || value == null || value == undefined) {
                            var textbox_type = "numeric", default_val = "";
                        } else {
                            value = itemObj._checkStrObj(misc_Array[0].value);  // check_item
                            var textbox_type = value[0].box_type;
                            var default_value = misc_Array[0].default_value;
                        }

                        if (textbox_type == '' || textbox_type == null || textbox_type == undefined) {
                            textbox_type = "numeric";
                        }
                        if (default_value == '' || default_value == null || default_value == undefined) {
                            var default_val = "";
                        } else {
                            var default_val = default_value[0];
                        }
                        var type12_is_hide = jsonObj[i].prop[0].is_hide;

                        // start_range = 0;
                        // end_range = 99;
                        // textbox_type = 'range';

                        newdiv += '<div id="div_txtrange_' + new_id + '" class="cntrl_main_div ' + ele_class + '" style="' + disp_cntrl + '" ' + cls_enable + ' ' + common_str + '>';
                        newdiv += label_str;

                        var obj = {
                            read_type: 'readchecksheet',
                            ans: '',
                            new_id: new_id,
                            default_val: default_val,
                            enable_disable: enable_disable,
                            textbox_type: textbox_type,
                            start_range: start_range,
                            end_range: end_range,
                            is_hide: type12_is_hide
                        }

                        var control = new MkControls(obj);
                        newdiv += control.build_type_12_range();
                        newdiv += '</div>';
                    }

                    // Get User Latlong Button (print it to numeric box)
                    else if (jsonObj[i].type == 13) {
                        var lat_box_class = jsonObj[i].value[0]; // class of 1st numeric box
                        var long_box_class = jsonObj[i].value[1]; // class of 2nd numeric box
                        Show_class_Array.push(lat_box_class);
                        Show_class_Array.push(long_box_class);

                        var misc_Array = jsonObj[i].prop[0].misc_data;
                        var value = misc_Array[0].value;
                        if (value == '' || value == null || value == undefined) {
                            var map_view = "false";
                        }
                        else {
                            value = itemObj._checkStrObj(misc_Array[0].value);  // check_item
                            var map_view = value[0].map_view;
                            if (map_view == "" || map_view == null || map_view == undefined) {
                                map_view = "false";
                            }
                        }

                        if (map_view == "true") { }
                        else {
                            LL_class_Array.push({
                                type: 'user',
                                item_id: i,
                                lat_cls: lat_box_class,
                                long_cls: long_box_class,
                                map_view: map_view
                            });
                        }

                        var param = 'get_latlong_box_classes("' + i + '", "' + lat_box_class + '", "' + long_box_class + '", "' + map_view + '", "' + form_flag + '")';

                        newdiv += "<div id='div_LatLong_" + new_id + "' class='cntrl_main_div " + ele_class + "' style='" + disp_cntrl + "' " + cls_enable + " " + common_str + ">";
                        newdiv += label_str;

                        var obj = {
                            new_id: new_id,
                            enable_disable: enable_disable,
                            param: param
                        }

                        var control = new MkControls(obj);
                        newdiv += control.build_type_13_user_latlong();
                        newdiv += '</div>';
                    }

                    // Get Site Latlong Button (print it to numeric box)
                    else if (jsonObj[i].type == 14) {
                        var S_lat_box_class = jsonObj[i].value[0]; // class of 1st numeric box
                        var S_long_box_class = jsonObj[i].value[1]; // class of 2nd numeric box
                        Show_class_Array.push(S_lat_box_class);
                        Show_class_Array.push(S_long_box_class);

                        LL_class_Array.push({
                            type: 'site',
                            item_id: i,
                            lat_cls: S_lat_box_class,
                            long_cls: S_long_box_class
                        });
                    }

                    // Get   MSL Button (print it to numeric box)
                    else if (jsonObj[i].type == 15) {
                        var lat_box_class = jsonObj[i].value[0];
                        var long_box_class = jsonObj[i].value[1];
                        var MSL_box_class = jsonObj[i].value[2];
                        Show_class_Array.push(lat_box_class);
                        Show_class_Array.push(long_box_class);
                        Show_class_Array.push(MSL_box_class);

                        var param = 'get_latlong_from_numericbox_MSL("' + i + '", "' + lat_box_class + '", "' + long_box_class + '", "' + MSL_box_class + '")';

                        newdiv += "<div id='div_MSL_" + new_id + "' class='cntrl_main_div " + ele_class + "' style='" + disp_cntrl + "' " + cls_enable + " " + common_str + ">";
                        newdiv += label_str;

                        var obj = {
                            new_id: new_id,
                            enable_disable: enable_disable,
                            param: param
                        }

                        var control = new MkControls(obj);
                        newdiv += control.build_type_15_MSL();
                        newdiv += '</div>';
                    }

                    // Get Distance Button (print it to numeric box)
                    else if (jsonObj[i].type == 16) {
                        var lat_box_class = jsonObj[i].value[0];
                        var long_box_class = jsonObj[i].value[1];
                        var distance_box_class = jsonObj[i].value[2];
                        Show_class_Array.push(lat_box_class);
                        Show_class_Array.push(long_box_class);
                        Show_class_Array.push(distance_box_class);

                        var param = 'get_latlong_from_numericbox_distance("' + i + '", "' + lat_box_class + '", "' + long_box_class + '", "' + distance_box_class + '")';

                        newdiv += "<div id='div_Dist_" + new_id + "' class='cntrl_main_div " + ele_class + "' style='" + disp_cntrl + "' " + cls_enable + " " + common_str + ">";
                        newdiv += label_str;

                        var obj = {
                            new_id: new_id,
                            enable_disable: enable_disable,
                            param: param
                        }

                        var control = new MkControls(obj);
                        newdiv += control.build_type_16_distance();
                        newdiv += '</div>';
                    }

                    // Get Calculate Button (print it to numeric box)
                    else if (jsonObj[i].type == 17) {
                        var param_dep = "";
                        var type17_dep_obj = "";
                        var data = [];

                        //------show/hide submit btn if total is (</>) than any value for ATC battery bank [atc.bbtest1 - 29042021]
                        //jsonObj[i].dependency = [{ dep_ans: "5", dep_class: "skip_cls", dep_item_id: "", dep_type: "1", dep_range: "less than" }];
                        var type17_dependency = jsonObj[i].dependency;
                        if (type17_dependency == "" || type17_dependency == null || type17_dependency == undefined || type17_dependency.length == 0) { }
                        else {
                            if (jsonObj[i].dependency[0].dep_class == "") { }
                            else {
                                for (j = 0; j < jsonObj[i].dependency.length; j++) {
                                    var t_dep_type = jsonObj[i].dependency[j].dep_type;
                                    if (t_dep_type == 1) {
                                        var ele_type = jsonObj[i].type;
                                        var dep_ans = jsonObj[i].dependency[j].dep_ans;
                                        var dep_class = jsonObj[i].dependency[j].dep_class;
                                        var dep_action = jsonObj[i].dependency[j].dep_action;
                                        if (dep_action == "" || dep_action == null || dep_action == undefined) {
                                            dep_action = "show";
                                        }
                                        var dep_range = jsonObj[i].dependency[j].dep_range;
                                        var match_class = jsonObj[i].dependency[j].match_class;

                                        data.push({
                                            ele_id: "txt_Calc_" + new_id + "",
                                            ele_type: ele_type,
                                            dep_ans: dep_ans,
                                            dep_class: dep_class,
                                            match_class: match_class,
                                            dep_action: dep_action,
                                            dep_type: t_dep_type,
                                            dep_range: dep_range
                                        });
                                    }

                                    type17_dep_obj = JSON.stringify(data);
                                    //if (t_dep_type == 1) {
                                    //    param_dep = "show_hide_Element('" + encodeURIComponent(type17_dep_obj) + "'); ";
                                    //}
                                }
                            }
                        }

                        var btn_text = jsonObj[i].value[0];
                        var std_rng_test = jsonObj[i].value[1];
                        var misc_Array = jsonObj[i].prop[0].misc_data;
                        var eq_str = misc_Array[0].value;
                        // var eq_str = '2+[1, 6549,1,16]+{@endread@}';
                        if (eq_str == '' || eq_str == null || eq_str == undefined) {
                            // old calculator
                            var miscData = JSON.stringify(misc_Array);

                            if (type17_dep_obj == "" || type17_dep_obj == null || type17_dep_obj == undefined) {
                                type17_dep_obj = "";
                            }

                            var paramData = [];
                            paramData.push({
                                'new_id': new_id,
                                'miscData': miscData,
                                'dependency': type17_dep_obj
                            });
                            var param = "get_value_from_other_step('" + encodeURIComponent(JSON.stringify(paramData)) + "')";

                            var type17_classes = [];
                            var type4_found = 0
                            for (h = 0; h < misc_Array.length; h++) {
                                var type = misc_Array[h].type;
                                if (type == 1) {
                                    var numeric_box_class = misc_Array[h].value;
                                    type17_classes.push(numeric_box_class);
                                }
                                if (type == 4) {
                                    type4_found++;
                                }
                            }
                            if (type17_classes.length > 0 || type4_found > 0) {
                                Type17_class_Array.push([type4_found, type17_classes, new_id, miscData, type17_dep_obj]);
                            }

                        } else {
                            // new calculator
                            var myrow_for_misc = eq_str[0].myrow_for_misc;
                            if (myrow_for_misc == '' || myrow_for_misc == null || myrow_for_misc == undefined) { }
                            else {
                                eq_str = myrow_for_misc;
                            }

                            for (e = 0; e < eq_str.length; e++) {
                                var t_char = eq_str[e];
                                if (t_char == "{") {
                                    var start_at = eq_str.indexOf("{", e);
                                    var end_at = eq_str.indexOf("}", e);
                                    var inner_eq_class_str_all = eq_str.substring(start_at, (end_at + 1));
                                    var sub_get_value = inner_eq_class_str_all.substring(2, inner_eq_class_str_all.length - 2);
                                    Show_class_Array.push(sub_get_value);

                                    Type17_Adv_class_Array.push([sub_get_value, new_id, eq_str]);
                                }
                            }

                            /*--------Dynamic value fill in other element by class Start----------*/
                            if (std_rng_test == "" || std_rng_test == null || std_rng_test == undefined) { }
                            else {
                                var range_json = JSON.parse(std_rng_test);
                                var range1_json_target = range_json[0].target;
                                var range1_json_range = range_json[0].range;

                                if (range1_json_target.length == 1) {
                                    var str_class = range1_json_target[0];
                                    var str_class_temp = str_class.substring(1, str_class.length - 1);
                                    Show_class_Array.push(str_class_temp);
                                    Type17_Autofill_Textbox_Array.push(str_class_temp);
                                }
                            }
                            /*----------Dyanamic value fill in other element by class end-------*/

                            var paramData = [];
                            paramData.push({
                                'new_id': new_id,
                                'eq_str': eq_str,
                                'std_rng_test': std_rng_test
                            });
                            var param = "extract_calculator_data('" + encodeURIComponent(JSON.stringify(paramData)) + "')";
                        }

                        if (jsonObj[i].prop[0].is_hide == "true") {
                            newdiv += '<div id="div_Calc_' + new_id + '" class="cntrl_main_div st_hdn ' + ele_class + '" style="' + disp_cntrl + '" ' + cls_enable + ' ' + common_str + '>';
                        }
                        else {
                            newdiv += '<div id="div_Calc_' + new_id + '" class="cntrl_main_div ' + ele_class + '" style="' + disp_cntrl + '" ' + cls_enable + ' ' + common_str + '>';
                        }
                        newdiv += label_str;

                        var is_disabled = jsonObj[i].prop[0].is_disabled;
                        if (is_disabled == '' || is_disabled == null || is_disabled == undefined || is_disabled == "false") {
                            var enable_disable = ""; // element disabled
                        } else {
                            var enable_disable = "readonly"; // element enable
                        }

                        if (disabled_flag != 0) {
                            var enable_disable = "disabled"; // element disabled
                        }
                        var cntrl_is_hide = jsonObj[i].prop[0].is_hide;

                        var obj = {
                            read_type: 'readchecksheet',
                            ans: '',
                            new_id: new_id,
                            enable_disable: enable_disable,
                            param: param,
                            btn_text: btn_text,
                            read_only: "",
                            is_hide: cntrl_is_hide
                        }

                        var control = new MkControls(obj);
                        newdiv += control.build_type_17_calculator();
                        newdiv += '</div>';
                    }

                    // (Old) cascading Drop down (control on hold)
                    else if (jsonObj[i].type == 18) {
                        var length = Array[0].len;
                        inv_item_Array = Array[0].inv_item_Array[0];

                        newdiv += '<div id="div_Inv_' + new_id + '" class="cntrl_main_div ' + ele_class + '" style="' + disp_cntrl + '" ' + cls_enable + ' ' + common_str + '>';
                        newdiv += label_str;

                        // creating dropdown dynamically
                        newdiv += '<select style="margin-bottom:10px; width:99%; height:30px; border-radius:5px; background-color:#F0F0F0;" id="inv_item_ddl_0" onchange="changeSelect(this,'
                            + i + ',' + new_id + ',0,' + (length - 1) + ')">';
                        for (var item in inv_item_Array) {
                            newdiv += '<option value="' + item + '">' + item + '</option>';
                        }
                        newdiv += '</select><br/>';

                        for (n = 1; n < length; n++) {
                            newdiv += '<select style="margin-bottom:10px; width:99%; height:30px; border-radius:5px; background-color:#F0F0F0;" id="inv_item_ddl_'
                                + n + '" onchange="changeSelect(this,' + i + ',' + new_id + ',' + n + ',' + (length - 1) + ')"></select><br/>';
                        }
                        newdiv += '<div id="div_Inv_Info_' + new_id + '"></div>';
                        newdiv += '</div>';
                    }

                    // Get Invoice Button (print it to numeric box)
                    else if (jsonObj[i].type == 19) {
                        curr_search_type = 1; // default search type = prod_name

                        newdiv += '<div id="div_Inv_' + new_id + '" class="cntrl_main_div ' + ele_class + '" style="padding:5px; margin-left:5px;' + disp_cntrl + '" ' + cls_enable + ' ' + common_str + '>';
                        newdiv += label_str;

                        var param = "popup_items_show('" + new_id + "','#div_item_Bucket_" + new_id + "')";
                        newdiv += '<table style="width:100%; margin-bottom:2px">';
                        newdiv += '<tr><td><input type="radio" style="width:30px; height:30px; margin-right:10px" name="rdogroup_'
                            + new_id + '" onclick="change_search_type(0,' + new_id
                            + ')"><label style="display:inline-block; vertical-align:top; margin-top:8px">Code</label></td>';
                        newdiv += '<td><input type="radio" checked="checked" style="width:30px; height:30px; margin-right:10px" name="rdogroup_'
                            + new_id + '" onclick="change_search_type(1,' + new_id
                            + ')"><label style="display:inline-block; vertical-align:top; margin-top:8px">Name</label></td>';
                        newdiv += '<td style="text-align:right"><input type="button" value="Select All" style="margin:5px 0px; padding:4px 10px; color:white; background-color:#337ab7; font-size:10pt; box-shadow:2px 2px 3px black; border:2px solid white; border-radius:20px" onclick ="'
                            + param + '"></td></tr></table>';
                        newdiv += '<input type="text" style="width:97%; height: 30px; padding-left:5px; box-shadow:2px 2px 3px black; border:2px solid white; border-radius:0px 20px 20px 0px; background-image: url(images/search4.png); background-repeat:no-repeat; background-position: 99% center; background-size: 29px 29px" id="inv_item_name_Search_'
                            + new_id + '" placeholder="Enter product name...">';
                        newdiv += '<input type="number" style="display:none; width:97%; height: 30px; padding-left:5px; box-shadow:2px 2px 3px black; border:2px solid white; border-radius:0px 20px 20px 0px; background-image: url(images/search4.png); background-repeat:no-repeat; background-position: 99% center; background-size: 29px 29px" id="inv_item_code_Search_'
                            + new_id + '" placeholder="Enter product code...">';

                        // // Adding Bucket ////
                        newdiv += '<ul id="product_list" style="width: 90%; margin-bottom:5px; padding: 0; background-color: white; text-align: left; border-style: solid; border-width: 1px; border-color: #337ab7"></ul>';
                        newdiv += '<div style="width:99%; height:auto; max-height:200px; overflow:auto; border: 1px solid gray">';
                        newdiv += '<table class="cls_tbl_inv" id="tbl_bucket_data_' + new_id
                            + '" border="1" style="width:200%; height:auto; text-align:center">';
                        newdiv += '<tr><td style="width:10%">Check</td><td style="width:10%">Point</td><td style="width:30%">Product Name</td><td style="width:10%">Qty</td><td style="width:20%">Price</td><td style="width:20%">Total</td></tr>';
                        newdiv += '</table></div>';

                        // /// Adding Get Invoice Button ////
                        newdiv += '<hr noshade style="width:63%; margin-right:2%; float:right; border: solid 1px #505050"><br/>';
                        newdiv += '<table style="width:63%; height:auto; margin-left:33%">';
                        newdiv += '<tr><td style="width:50%; padding:5px"><label style="float:right; margin-top:4%">Total Items: </label></td><td style="width:50%; padding:5px"><input type="text" id="inv_item_ans_'
                            + new_id + '"style="color:black; background-color:#F0F0F0; width:99%; height:25px; font-size: 10pt; font-family: calibri; height: 100%; border-radius:5px; text-align:center" disabled/></td></tr>';
                        newdiv += '<tr><td style="width:50%; padding:5px"><label style="float:right; margin-top:4%">Total Points: </label></td><td style="width:50%; padding:5px"><input type="text" id="inv_point_ans_'
                            + new_id + '"style="color:black; background-color:#F0F0F0; width:99%; height:25px; font-size: 10pt; font-family: calibri; height: 100%; border-radius:5px; text-align:center" disabled/></td></tr>';
                        newdiv += '<tr><td style="width:50%; padding:5px"><label style="float:right; font-weight:bold; margin-top:4%">TOTAL: </label></td><td style="width:50%; padding:5px"><input type="text" id="inv_sum_ans_'
                            + new_id + '"style="color:black; background-color:#F0F0F0; width:99%; height:25px; font-size: 11pt; font-weight:bold; font-family: calibri; height: 100%; border-radius:5px; text-align:center" disabled/></td></tr>';
                        newdiv += '<tr><td style="width:50%"></td><td style="width:50%"><input type="button" style="width:99%; font-family: calibri; height: 25px; padding:1px; color:white; background-color:#337ab7; font-size:10pt; box-shadow:2px 2px 3px black; border:2px solid white; border-radius:20px" value="Get Invoice" onclick="get_item_price('
                            + i + ',' + new_id + ')" ' + enable_disable + '/></td></tr>';
                        newdiv += '</table>';
                        newdiv += '</div>';
                    }

                    // Get Search Button (print dependent values to multiple numeric box (e.g. customer details))
                    else if (jsonObj[i].type == 20) {
                        ddl_listview = "false";                 //reset view_style for listview of ddl popup

                        var data = [];
                        if (jsonObj[i].dependency.length > 0) {

                            if (jsonObj[i].dependency[0].dep_class == "") { }
                            else {
                                for (j = 0; j < jsonObj[i].dependency.length; j++) {
                                    var t_dep_type = jsonObj[i].dependency[j].dep_type;
                                    if (t_dep_type == 1 || t_dep_type == 2) {
                                        var ele_type = jsonObj[i].type;
                                        var dep_ans = jsonObj[i].dependency[j].dep_ans;
                                        var dep_class = jsonObj[i].dependency[j].dep_class;
                                        var step = curr_survey_data["step"];
                                        //var glob_class = step + "_" + jsonObj[i].item_id;
                                        var glob_class = check_type + "_" + step + "_" + i;

                                        data.push({
                                            ele_id: new_id,
                                            ele_type: ele_type,
                                            ele_ans: "",
                                            dep_ans: dep_ans,
                                            dep_class: dep_class,
                                            glob_class: glob_class,
                                            dep_type: t_dep_type,
                                            dep_type20_checksheet_id: jsonObj[i].dependency[j].dep_type20_checksheet_id,
                                            dep_type20_que_id: jsonObj[i].dependency[j].dep_type20_que_id
                                        });
                                    }
                                }
                            }
                        }

                        var misc_Array = jsonObj[i].prop[0].misc_data;
                        if (misc_Array[0].value == "") {
                            misc_Array[0].value = [];
                        }
                        var value = itemObj._checkStrObj(misc_Array[0].value);  // check_item

                        var value_new = jsonObj[i].prop[0].value_new;
                        if (value_new == '' || value_new == null || value_new == undefined) {
                            var Fill_Data = value[0].Fill_Data;
                            var push_data = value[0].push_data;
                            var TableName = value[0].TableName;
                            if (TableName == '' || TableName == null || TableName == undefined) {
                                var TableName = value[0].FROM[0].Table_Name;
                            }
                            var JoinTableName = value[0].JoinTableName;
                            var Checksheet_id = value[0].Checksheet_id;
                            var ColumName = value[0].ColumName;
                            var columndata_Array = value[0].columndata;
                            var groupby = value[0].GROUPBY;

                            var QR_Code = value[0].qr;
                            var Barcode = value[0].barcode;
                            var search_box = value[0].search;
                            var autofill = value[0].autofill;
                        }
                        else {
                            var Fill_Data = value_new[0].Fill_Data;
                            var push_data = value_new[0].push_data;

                            var QR_Code = value_new[0].qr;
                            var Barcode = value_new[0].barcode;
                            var search_box = value_new[0].search;
                            var autofill = value_new[0].autofill;
                            var default_value = value_new[0].default_value;
                        }

                        if (Fill_Data == '' || Fill_Data == null || Fill_Data == undefined) {
                            Fill_Data = [];
                        }

                        //if (form_flag == 1) {
                        //    // don't show controls those are autofilled by searchable control in invoice form 
                        //    // tower url - ac asset test - mk - 07022025
                        //}
                        //else {
                        for (k = 0; k < Fill_Data.length; k++) {
                            var editable = Fill_Data[k].editable;
                            if (editable != 'hidden') {
                                Show_class_Array.push(Fill_Data[k].classname);
                            }
                        }
                        //}

                        var customer_checksheetid = push_data[0].customer_checksheetid;
                        if (customer_checksheetid == "" || customer_checksheetid == null || customer_checksheetid == undefined || customer_checksheetid == "0") {
                            customer_checksheetid = "";
                        }

                        var add_cust_from_search = push_data[0].add_cust_from_search;                       //added this key for ATC (add new customer from search string) [atc.bb - 03052021]
                        if (add_cust_from_search == "" || add_cust_from_search == null || add_cust_from_search == undefined || add_cust_from_search == "0") {
                            add_cust_from_search = "false";
                        }

                        var ddl_info_view = push_data[0].ddl_info_view;
                        if (ddl_info_view == "" || ddl_info_view == null || ddl_info_view == undefined) {
                            ddl_info_view = "true";
                        }

                        var fetch_limit = push_data[0].fetch_limit;
                        if (fetch_limit == "" || fetch_limit == null || fetch_limit == undefined) {
                            fetch_limit = 50;
                        }
                        fetch_limit = parseInt(fetch_limit);
                        DEFAULT_TYPE20 = fetch_limit;
                        FETCH_TYPE20 = DEFAULT_TYPE20;

                        var type20_is_hide = jsonObj[i].prop[0].is_hide;
                        newdiv += '<div id="div_Search_' + new_id + '" class="cntrl_main_div ' + ele_class + '" is_hide="' + type20_is_hide + '" style="' + disp_cntrl + '" ' + cls_enable + ' ' + common_str + '>';
                        newdiv += label_str;

                        if (add_cust_from_search == "true") {
                            //new development for ATC battery bank [haresh1.vt - 01062021]
                            var param_keyup = "change_flag_for_text_cust_addition('" + new_id + "')";
                            var param_cust_add = "get_popup_to_add_item_online('" + customer_checksheetid + "', '" + add_cust_from_search + "', '" + new_id + "')";
                            var param_cust_search = "open_dropdown_popup_for_cust_search(this)";
                            newdiv += '<div class="item-input item-input-field form-div add-cust-outer" style="width:100% !important;">';
                            newdiv += '<input type="text" id="type20_txt_' + new_id + '" onkeyup="' + param_keyup + '" style="width:75% !important;" class="form-ele" placeholder="Add New Cell...">';
                            newdiv += '<i id="addCust_txtbox_' + new_id + '" class="fa form-ico fa-plus" onclick="' + param_cust_add + '" style="margin-right:30px;margin-top:5px;padding:0 10px;display:inline; visibility:visible"></i>';
                            newdiv += '<i id="searchCust_txtbox_' + new_id + '" class="fa form-ico fa-search" onclick="' + param_cust_search + '" style="padding-left:10px;margin-top:-10%;display:inline; visibility:visible"></i>';
                            newdiv += '</div>';
                            //newdiv += '</div>';
                        }
                        //else {
                        // new type20 dependency
                        newdiv += '<input id="hdn_type20_dependency_data_' + new_id + '" type="hidden" value=' + encodeURIComponent(JSON.stringify(data)) + '>';

                        var window_style = 'popup';                     //tableview is displayed in popup view only(after 4 column UI changes---04112019)
                        var view_style = 'dropdownview';                   //searchable is displayed in dropdown view only(25112019)

                        if (push_data == '' || push_data == null || push_data == undefined) {
                            push_data = [];
                            //var window_style = 'popup';
                            //var view_style = 'tableview';
                        } else {
                            //var window_style = push_data[0].window_style;
                            //var view_style = push_data[0].view_style;

                            var push_array = push_data[0].push_array;
                            var is_json = 0;
                            if (push_array.length > 0) {
                                var push_array_str = JSON.stringify(push_array);
                                var json_check = push_array_str[1];
                                if (json_check == '{') {
                                    is_json = 1;
                                }
                            }

                            for (p = 0; p < push_array.length; p++) {
                                if (is_json == 0) {
                                    // simple array
                                    var get_value = push_array[p];
                                    var value_type = get_value.substring(2, 1);
                                    var sub_get_value = get_value.substring(2, get_value.length - 2);
                                } else {
                                    // json array
                                    var get_value = push_array[p].value;
                                    var value_type = get_value.substring(2, 1);
                                    var sub_get_value = get_value.substring(2, get_value.length - 2);
                                }
                                if (value_type == "@") {
                                    Type20_class_Array.push(sub_get_value);
                                }
                            }
                        }

                        if (value_new == '' || value_new == null || value_new == undefined) {
                            var columndata_Array = value[0].columndata;
                            if (columndata_Array == '' || columndata_Array == null || columndata_Array == undefined) {
                                var sorted_columndata_Array = [];
                            } else {
                                // sort array by element position in list
                                var sorted_columndata_Array = columndata_Array
                                    .sort(function (a, b) {
                                        var x = a.position < b.position ? -1 : 1;
                                        return x;
                                    });
                            }

                            var groupby = value[0].GROUPBY;
                            if (groupby == "" || groupby == null || groupby == undefined) {
                                groupby = "";
                            }
                            else {
                                var Table_Name = value[0].GROUPBY[0].Table_Name;
                                if (Table_Name == '' || Table_Name == null || Table_Name == undefined) {
                                    groupby = "";
                                }
                                else {
                                    groupby = value[0].GROUPBY;
                                }
                            }

                            value_new[0]["ques_id"] = jsonObj[i].que_id;
                            value_new[0]["Current_Checksheet_id"] = check_type;

                            var condition_data = [];
                            condition_data.push({
                                "FROM": value[0].FROM,
                                "where": value[0].where,
                                "GROUPBY": groupby,
                                "orderby": value[0].orderby,
                                "order_type": value[0].order_type,
                                "limit": value[0].limit,
                                "limit1": value[0].limit1,
                                "ColumName": value[0].ColumName,
                                "JoinTableName": value[0].JoinTableName,
                                "push_data": push_data,
                                "columndata": sorted_columndata_Array,
                                "fill_data": Fill_Data,
                                "enable_disable": enable_disable,
                                "value_new": value_new
                            });
                        }
                        else {

                            value_new[0]["ques_id"] = jsonObj[i].que_id;
                            value_new[0]["Current_Checksheet_id"] = check_type;

                            // New Searchable with SearchId
                            var condition_data = [];
                            condition_data.push({
                                "value_new": value_new
                            });
                        }

                        if (view_style == 'dropdownview') {
                            // dropdownview
                            if (search_box == 'true') { }
                            else {
                                //if (autofill == '' || autofill == null || autofill == undefined || autofill == 'true') {                      //commented for UI issue when autofill is false [atc.bbtest1 - 26042021]

                                if (form_flag == 14 && push_data[0].view_style == "tableview") { }
                                else {
                                    Type20_AutoFill_DDL_Array.push({
                                        'new_id': new_id,
                                        'TableName': TableName,
                                        'JoinTableName': JoinTableName,
                                        'Checksheet_id': Checksheet_id,
                                        'window_style': window_style,
                                        'view_style': view_style,
                                        'push_data': push_data,
                                        'que_id': jsonObj[i].que_id,
                                        'valid': jsonObj[i].prop[0].valid,
                                        "value_new": value_new,
                                        "autofill": autofill
                                    });
                                }
                                //}

                            }


                            if (enable_disable == 'disabled') {
                                var ico_str = 'fa-ban';
                            }
                            else {
                                var ico_str = 'fa-arrow-circle-down';
                            }

                            if (search_box == 'true') {
                                var onclick_str = "setclick('" + new_id + "')";
                                newdiv += '<div class="item-input item-input-field" style="width:93%" ' + enable_disable + '>';
                                newdiv += '<input type="text" id="ddd_search_type20_text_' + new_id + '" style="white-space: pre; word-break: break-word" class="form-ele" onclick="' + onclick_str + '">';
                                var param_ddl_search = "get_data_by_dropdown_search('" + new_id + "', '" + TableName + "', '" + JoinTableName + "','" + Checksheet_id + "')";
                                newdiv += '<i id="ddl_search_btn_' + new_id + '" class="fa fa-search form-ico" style="margin-top:6px" onclick="' + param_ddl_search + '" ' + enable_disable + '></i>';
                                newdiv += '</div>';
                            }

                            if (QR_Code == 'true') {
                                var param_qr = "get_qr_and_search_data('" + new_id + "', '" + TableName + "', '" + JoinTableName + "','" + Checksheet_id + "')";
                                var qr_ico_str = '<i id="btn20_QR_' + new_id + '" class="fa form-ico fa-qrcode" ' + enable_disable + ' style="margin-left:0px;margin-top:-10%; visibility: visible" onclick="' + param_qr + '" ></i>';
                                var ddl_width = "width:95% !important;"
                            }
                            else if (Barcode == 'true') {
                                var param_qr = "get_barcode_and_search_data('" + new_id + "', '" + TableName + "', '" + JoinTableName + "','" + Checksheet_id + "')";
                                var qr_ico_str = '<i id="btn20_QR_' + new_id + '" class="fa form-ico fa-barcode" ' + enable_disable + ' style="margin-left:0px;margin-top:-10%; visibility: visible" onclick="' + param_qr + '" ></i>';
                                var ddl_width = "width:95% !important;"
                            }
                            else {
                                var param_qr = '';
                                var qr_ico_str = '';
                                var ddl_width = ""
                            }

                            var popup_len = $('.popup-type20-dropdown:visible').length;
                            if (popup_len > 0) {
                                var ddl_param = ""
                            }
                            else {
                                if (QR_Code == "true" || Barcode == "true") {
                                    var ddl_param = "get_scanner_option('" + new_id + "', '" + TableName + "', '" + JoinTableName + "','" + Checksheet_id + "', '" + customer_checksheetid + "', '" + ddl_info_view + "', '" + QR_Code + "', '" + Barcode + "', '" + autofill + "', '" + add_cust_from_search + "')";
                                }
                                else {
                                    var ddl_param = "get_dropdown_data('" + new_id + "', '" + TableName + "', '" + JoinTableName + "','" + Checksheet_id + "', '" + customer_checksheetid + "', '" + ddl_info_view + "', '" + autofill + "', '" + add_cust_from_search + "')";
                                }
                            }

                            if (add_cust_from_search == "true") {
                                var disp_type20_ddl = "display:none;"
                            }
                            else {
                                var disp_type20_ddl = "";
                            }

                            var multi_select = push_data[0].multi_select;
                            var multi_str = '';
                            if (multi_select == "true") {
                                var multi_str = 'multiple';
                            }

                            newdiv += '<div class="item-input item-input-field form-div type20-ddl-outer" style="' + ddl_width + disp_type20_ddl + '" onclick="' + ddl_param + '" ' + enable_disable + '><img id="ddl_loading_' + new_id + '" src="images/loading_type20.gif" style="position: absolute; left: 50%; top: 7px; display:none">';

                            var ios_device = localStorage.getItem('ios_device');
                            if (ios_device == 'iphone' || F7_device == 'android') {
                                var op_str = '<option value="0" selected="selected">Select Value</option>';
                            }
                            else {
                                var op_str = '';
                            }

                            var view_style = push_data[0].view_style;
                            if (default_value == '' || default_value == null || default_value == undefined) {
                                newdiv += '<select ' + multi_str + ' name="0" id="ddl_search_type20_' + new_id + '" style="width:96%; display:inline-block;color:#000 !important;opacity:1;" view_style="' + view_style + '" disabled="disabled" ' + enable_disable + '>' + op_str + '</select><i class="fa ' + ico_str + ' form-ico" style="margin-top:-10%;"></i></div>';
                            }
                            else {
                                var def_id = default_value[0].id;
                                var def_text = default_value[0].text;

                                if (def_text == "" || def_text == null || def_text == undefined) {
                                    // default value not found
                                    newdiv += '<select ' + multi_str + ' name="0" id="ddl_search_type20_' + new_id + '" style="width:96%; display:inline-block;color:#000 !important;opacity:1;" view_style="' + view_style + '" disabled="disabled" ' + enable_disable + '>' + op_str + '</select><i class="fa ' + ico_str + ' form-ico" style="margin-top:-10%;"></i></div>';
                                }
                                else {
                                    newdiv += '<select ' + multi_str + ' name="0" id="ddl_search_type20_' + new_id + '" style="width:96%; display:inline-block;color:#000 !important;opacity:1;" view_style="' + view_style + '" disabled="disabled" ' + enable_disable + ' default_value="1">' + op_str + '<option selected="selected" value="' + def_id + '">' + def_text + '</option></select><i class="fa ' + ico_str + ' form-ico" style="margin-top:-10%;"></i></div>';
                                }
                            }

                            newdiv += qr_ico_str;

                            //smart-select
                            //var prop_name = jsonObj[i].prop[0].name;
                            //newdiv += '<a href="#" class="item-link smart-select" data-searchbar="true" data-back-on-select = "true" data-searchbar-placeholder="Search ' + prop_name + '..." style="text-decoration: none;">';
                            //newdiv += '<select class="form-control" name="0" id="ddl_search_type20_' + new_id + '" style="width:88%;" ' + enable_disable + '>' + op_str + '</select>';
                            //newdiv += '<div class="item-content" style="padding-left: 0px !important;min-height:38px !important;"><div class="item-inner" style="min-height:38px !important;background-image: none;padding: 0px !important;">';
                            //newdiv += '<div class="item-after"  id="ddl_lbl_search_type20_' + new_id + '" style="color:#000 !important;font-size:16px !important;margin-left:0px !important;">Select Value</div><i class="fa ' + ico_str + ' form-ico"></i></div></div></a>';
                            //newdiv += '</div>';

                            newdiv += '<input id="hdn_target_id_array_' + new_id + '" type="hidden">';
                            newdiv += '<input id="hdn_multi_autobind_child_data_' + new_id + '" type="hidden">';
                            newdiv += '<input id="hdn_condition_data_' + new_id + '" type="hidden" value=' + encodeURIComponent(JSON.stringify(condition_data)) + '>';
                            newdiv += '<input id="hdn_select_all_fill_data_' + new_id + '" type="hidden" value=' + encodeURIComponent(JSON.stringify(Fill_Data)) + ' autofill_form_flag = "' + form_flag + '">';
                            newdiv += '</div>';
                        } else {
                            // tableview/listview
                            var param = "popup_search_items_show_type20('" + new_id + "', '" + TableName + "', '" + JoinTableName + "','" + Checksheet_id + "','" + window_style + "','" + view_style + "')";
                            var param1 = "get_searched_item_list('" + new_id + "', '" + TableName + "', '" + JoinTableName + "','" + Checksheet_id + "','" + ColumName + "')";

                            if (QR_Code == 'true') {
                                var param_qr = "get_qr_and_search_data('" + new_id + "', '" + TableName + "', '" + JoinTableName + "','" + Checksheet_id + "')";
                            }
                            else if (Barcode == 'true') {
                                var param_qr = "get_barcode_and_search_data('" + new_id + "', '" + TableName + "', '" + JoinTableName + "','" + Checksheet_id + "')";
                            }
                            else {
                                var param_qr = '';
                            }
                            newdiv += '<input id="hdn_select_all_fill_data_' + new_id + '" type="hidden" value=' + encodeURIComponent(JSON.stringify(Fill_Data)) + ' autofill_form_flag = "' + form_flag + '">';
                            newdiv += '<input id="hdn_condition_data_' + new_id + '" type="hidden" value=' + encodeURIComponent(JSON.stringify(condition_data)) + '>';

                            var clickcheck = "$(this).attr('name', '0')";
                            if (enable_disable == "disabled") {
                                param1 = '', param = '', param_qr = '';
                            }

                            var customer_checksheetid = push_data[0].customer_checksheetid;
                            var obj = {
                                read_type: 'readchecksheet',
                                ans: '',
                                new_id: new_id,
                                value: jsonObj[i].value,
                                enable_disable: enable_disable,
                                param: param,
                                param1: param1,
                                param_qr: param_qr,
                                clickcheck: clickcheck,
                                window_style: window_style,
                                view_style: view_style,
                                customer_checksheetid: customer_checksheetid
                            }

                            var control = new MkControls(obj);
                            newdiv += control.build_type_20_search();
                            newdiv += '</div>';
                        }
                        //}
                    }

                    // // Get Single Search Button (print dependent values to ul li only) (e.g. customer names)
                    else if (jsonObj[i].type == 21) {
                        var misc_Array = jsonObj[i].prop[0].misc_data;
                        if (misc_Array[0].value == "") {
                            misc_Array[0].value = [];
                        }
                        var value = itemObj._checkStrObj(misc_Array[0].value);  // check_item

                        newdiv += '<div id="div_S_Search_' + new_id + '" class="cntrl_main_div ' + ele_class + '" style="' + disp_cntrl + '" ' + cls_enable + ' ' + common_str + '>';
                        newdiv += label_str;

                        if (value == '' || value == null || value == undefined) { }
                        else {
                            var TableName = value[0].TableName
                            var Checksheet_id = value[0].Checksheet_id;
                            var ColumName = value[0].ColumName;
                        }

                        var param1 = "get_single_searched_item_list('" + new_id + "', '" + TableName + "','" + Checksheet_id + "','" + ColumName + "')";
                        var clickcheck = "$(this).attr('name', '0')";
                        if (enable_disable == "disabled") {
                            param1 = '';
                        }

                        var obj = {
                            read_type: 'readchecksheet',
                            ans: '',
                            new_id: new_id,
                            value: jsonObj[i].value,
                            default_val: default_val,
                            enable_disable: enable_disable,
                            param1: param1,
                            clickcheck: clickcheck
                        }

                        var control = new MkControls(obj);
                        newdiv += control.build_type_21_s_search();

                        // // Adding UL List below search box ////
                        newdiv += '<ul id="S_Search_item_list_' + new_id
                            + '" style="width: 85%; margin-top:-2px; height:auto; max-height:140px; overflow:auto; margin-bottom:5px; padding: 0; background-color: white; text-align: left; position:absolute; z-index:50"></ul>';
                        newdiv += '</div>';
                    }

                    // // Get answer of any mathematics equation
                    else if (jsonObj[i].type == 22) {
                        var json_inv = '';
                        var misc_Array = jsonObj[i].prop[0].misc_data;
                        if (misc_Array[0].value == "") {
                            misc_Array[0].value = [];
                        }
                        var hide_blank = '';

                        var value_new = misc_Array[0].value_new;
                        if (value_new == '' || value_new == null || value_new == undefined) {
                            var collapse_Json1 = itemObj._checkStrObj(misc_Array[0].value);  // check_item
                        }
                        else {
                            var collapse_Json1 = value_new;  // check_item
                        }

                        // inv_display_flag = collapse_Json1[0].view_type;
                        // json_inv = collapse_Json1[0].Fill_Data;
                        //collapse_Json1[0].view_type = "listview";

                        collapse_Json1[0].view_type = 1;               //default listview for mobile [22092021] ['0' means tableview & '1' means listview]

                        var inv_display_flag = collapse_Json1[0].view_type;
                        var type22_button_str = collapse_Json1[0].btn_str;
                        if (type22_button_str == '' || type22_button_str == null || type22_button_str == undefined) {
                            type22_button_str = "Add Record";
                        }
                        inv_display_flag_array.push(collapse_Json1[0].view_type);
                        json_inv_array.push(collapse_Json1[0].Fill_Data);
                        hide_blank = collapse_Json1[0].hide_blank;
                        var listview_label = collapse_Json1[0].listview_label;
                        if (listview_label == "" || listview_label == null || listview_label == undefined) {
                            listview_label = "true";
                        }

                        var add_button = collapse_Json1[0].add_button;
                        if (add_button == '' || add_button == null || add_button == undefined) {
                            add_button = "true";
                        }
                        var edit_button = collapse_Json1[0].edit_button;
                        if (edit_button == '' || edit_button == null || edit_button == undefined) {
                            edit_button = "true";
                        }
                        var delete_button = collapse_Json1[0].delete_button;
                        if (delete_button == '' || delete_button == null || delete_button == undefined) {
                            delete_button = "true";
                        }

                        var max_record = collapse_Json1[0].max_record;
                        if (max_record == '' || max_record == null || max_record == undefined) {
                            max_record = "";
                        }

                        var min_record = collapse_Json1[0].min_record;
                        if (min_record == '' || min_record == null || min_record == undefined) {
                            min_record = "";
                        }

                        // inv_display_flag_array.push(1);

                        var json_inv = collapse_Json1[0].Fill_Data;
                        var table_name_inv = collapse_Json1[0].Table_Name;
                        var temp_inv_display_flag = inv_display_flag;
                        // var temp_inv_display_flag = 1;

                        var json_length = json_inv.length;
                        var json_data = JSON.stringify(json_inv);

                        //type22 single control UI changes [04122023]
                        var type22_snglCntrl_type = 0;
                        var inner_form_data = json_inv[0].type;
                        if (json_inv.length == 1) {
                            if (inner_form_data.length == 1) {
                                type22_snglCntrl_type = inner_form_data[0].type;
                            }
                            else {
                                type22_snglCntrl_type = inner_form_data[1].type;
                            }
                        }

                        newdiv += '<div id="div_Inv_Calculate_' + new_id + '" class="cntrl_main_div ' + ele_class + '" form_mode="readchecksheet" style="' + disp_cntrl + '" ' + cls_enable + ' ' + common_str + '>';
                        newdiv += label_str;

                        newdiv += "<div id='div_singleInvoice_cntrl_" + new_id + "'></div>";
                        newdiv += "<input type='hidden' id='hdn_type22_json_len_" + new_id + "' value='" + json_inv.length + "' type22_snglCntrl_type='" + type22_snglCntrl_type + "' type22_que_id='" + jsonObj[i].que_id + "'>";

                        newdiv += "<div id='div_display_" + new_id + "' class='form-div'>";

                        newdiv += "<input type='hidden' id='hdn_hide_blank_" + new_id + "' value='" + hide_blank + "'></div>";
                        newdiv += "<input type='hidden' id='hdn_jsondata_" + new_id + "' value='" + json_data + "'>";
                        newdiv += "<input type='hidden' id='hdn_inv_row_counter_" + new_id + "' value='0'>";
                        newdiv += "<input type='hidden' id='hdn_inv_tablename_" + new_id + "' value='" + table_name_inv + "'>";
                        newdiv += '<input type="hidden" id="row_index_' + new_id + '" value="0">';

                        newdiv += "<input type='hidden' id='hdn_listview_label_" + new_id + "' value='" + listview_label + "'>";
                        newdiv += "<input type='hidden' id='hdn_btn_congfiure_" + new_id + "' add_button='" + add_button + "' edit_button='" + edit_button + "' delete_button='" + delete_button + "' max_record='" + max_record + "' min_record='" + min_record + "'>";

                        // Type22 dependency
                        var ref_class = collapse_Json1[0].ref_class;
                        if (ref_class == '' || ref_class == null || ref_class == undefined) { }
                        else {
                            Show_class_Array.push(ref_class);
                            var type22_dep_Data = [];
                            type22_dep_Data.push({
                                'ref_class': collapse_Json1[0].ref_class,
                                'greater_class': collapse_Json1[0].greater_class,
                                'less_class': collapse_Json1[0].less_class
                            });
                            var json_data = JSON.stringify(type22_dep_Data);
                            newdiv += "<input type='hidden' id='hdn_inv_dep_" + new_id + "' value='" + json_data + "'>";
                        }
                        //////

                        var read_count_length = json_inv_array.length - 1;

                        var param = "return popup_search_items_show_type22('" + jsonObj[i].que_id + "','" + new_id + "','" + read_count_length + "','" + 0 + "','" + temp_inv_display_flag + "')";

                        if (form_flag == 2) {
                            param = "";
                            if (form_flag == 3) {
                                param = "return popup_search_items_show_type22('" + jsonObj[i].que_id + "','" + new_id + "','" + read_count_length + "','" + 0 + "','" + temp_inv_display_flag + "')";
                            }
                        }

                        var control_type = get_search_ctrl_type(json_inv);
                        var disp_btn = "";
                        if (json_inv.length == 1 && control_type == '20') {
                            var disp_btn = "display:none;";
                        }

                        var obj = {
                            new_id: new_id,
                            enable_disable: enable_disable,
                            param: param,
                            btn_text: type22_button_str,
                            add_button: add_button,
                            display_add_btn: disp_btn
                        }

                        var control = new MkControls(obj);
                        newdiv += control.build_type_22_invoice();
                        newdiv += '</div>';

                        inv_Calc_new_array.push(new_id);
                        inv_new_counter++;                          //global var
                        invoice_found++;                                        //local var
                    }

                    // // Get old step collapsible step in current type div
                    else if (jsonObj[i].type == 23) {
                        var misc_Array = jsonObj[i].prop[0].misc_data;
                        var type = misc_Array[0].type;
                        if (type == 7) {
                            collapse_Json = itemObj._checkStrObj(misc_Array[0].value);  // check_item
                        }

                        newdiv += '<div id="div_step_Col_' + new_id + '" style="' + disp_cntrl + '" class="cntrl_main_div ' + ele_class + '">';
                        //newdiv += label_str;

                        var is_open = collapse_Json[0].is_open;
                        if (is_open == "true") {
                            collapse_id_Array.push(new_id);
                        }

                        var is_editable = collapse_Json[0].editable;

                        var param = "toggle_collapse_div('" + new_id + "')";
                        var param1 = "popup_collapse_div_show_type23('" + new_id + "')";

                        if (jsonObj[i - 1].type == 0) {
                            var lbl_name = "";
                        }
                        else {
                            var lbl_name = jsonObj[i].prop[0].name;
                        }

                        var obj = {
                            new_id: new_id,
                            enable_disable: enable_disable,
                            param: param,
                            param1: param1,
                            step: step,
                            label_name: lbl_name,
                            is_editable: is_editable
                        }

                        var control = new MkControls(obj);
                        newdiv += control.build_type_23_collapse();

                        newdiv += '<input id="hdn_type23_data_' + new_id + '" type="hidden" value="' + encodeURIComponent(JSON.stringify(collapse_Json)) + '">';
                        newdiv += '</div>';
                    }

                    // print
                    else if (jsonObj[i].type == 24) {
                        var misc_Array = jsonObj[i].prop[0].misc_data;
                        var type = misc_Array[0].type;
                        if (type == 9) {
                            var type24_Array = [];
                            type24_Array = itemObj._checkStrObj(misc_Array[0].value);  // check_item
                        }

                        newdiv += '<div id="div_print_' + new_id + '" class="cntrl_main_div ' + ele_class + '" style="' + disp_cntrl + '" ' + cls_enable + ' ' + common_str + '>';
                        newdiv += label_str;

                        var param = "get_data_for_print('" + check_type + "','" + new_id + "')";
                        newdiv += '<img src="images/print-icon.png" onclick = "' + param + '" style="height:50px; width:50px; margin-left: 5px; border-radius: 7px" ' + enable_disable + '/>';
                        newdiv += '<input id="hdn_type24_data_' + new_id + '" type="hidden" value=' + encodeURIComponent(JSON.stringify(type24_Array)) + '>';
                        newdiv += '<input id="hdn_type24_data_ans_' + new_id + '" type="hidden">';
                        newdiv += '</div>';
                    }
                    // scanner
                    else if (jsonObj[i].type == 25) {
                        var misc_Array = jsonObj[i].prop[0].misc_data;
                        var value = itemObj._checkStrObj(misc_Array[0].value);  // check_item
                        var photo_type = value[0].photo_type;
                        if (photo_type == '' || photo_type == null || photo_type == undefined) {
                            photo_type = "barcode";
                        }

                        var editable = value[0].editable;
                        if (editable == '' || editable == null || editable == undefined) {
                            editable = "true";
                        }

                        var remember_me = value[0].remember_me;
                        if (remember_me == '' || remember_me == null || remember_me == undefined) {
                            remember_me = "false";
                            var ans = '';
                        }
                        else {
                            var ans = '';
                            var qr_found = 0;
                            var type25_val_Array = JSON.parse(localStorage.getItem('type25_val_Array'));
                            if (type25_val_Array == '' || type25_val_Array == null || type25_val_Array == undefined) { }
                            else {
                                for (t = 0; t < type25_val_Array.length; t++) {
                                    var t_check_type = type25_val_Array[t].checksheet_id;
                                    var t_que_id = type25_val_Array[t].que_id;
                                    if (check_type == t_check_type && jsonObj[i].que_id == t_que_id) {
                                        ans = type25_val_Array[t].ans;
                                        break;
                                    }
                                }
                            }
                        }

                        var Fill_class = value[0].classname;
                        if (Fill_class == '' || Fill_class == null || Fill_class == undefined) { }
                        else {
                            Show_class_Array.push(Fill_class);
                        }
                        var param = "get_scanner_and_print('" + i + "','" + jsonObj[i].que_id + "','scn_" + new_id + "','" + photo_type + "','" + Fill_class + "', '" + editable + "', '" + remember_me + "')";

                        var name = jsonObj[i].prop[0].name;
                        if (name == 'Vehicle QR') {
                            var company_id = JSON.parse(storage.getItem('company_id'));
                            if (company_id == '92') {
                                $('#lbl_scan_vehicle').attr('onclick', param);
                            }
                        }

                        var height_str = '';
                        if (name == 'Vehicle QR') {
                            newdiv += '<div id="div_scn_' + new_id + '" style="height:0px" ' + cls_enable + ' ' + common_str + '>';
                        }
                        else {
                            newdiv += '<div id="div_scn_' + new_id + '" class="cntrl_main_div ' + ele_class + '" style="' + disp_cntrl + height_str + '" ' + cls_enable + ' ' + common_str + '>';
                        }

                        newdiv += label_str;

                        var obj = {
                            read_type: 'readchecksheet',
                            ans: ans,
                            new_id: new_id,
                            value: jsonObj[i].value,
                            enable_disable: enable_disable,
                            param: param,
                            photo_type: photo_type
                        }

                        var control = new MkControls(obj);
                        newdiv += control.build_type_25_scanner();
                        newdiv += '</div>';
                    }

                    // upload control
                    else if (jsonObj[i].type == 26) {
                        var misc_Array = jsonObj[i].prop[0].misc_data;
                        var inner_type = misc_Array[0].type;
                        if (inner_type == 7) {
                            var base_path = misc_Array[0].base_path;
                            var upload_type = misc_Array[0].upload_type;
                            if (upload_type == '' || upload_type == null || upload_type == undefined) {
                                upload_type == 'easyform';
                            }
                            var view_doc = misc_Array[0].view_doc;
                            if (view_doc == '' || view_doc == null || view_doc == undefined) {
                                view_doc = "true";
                            }
                        }
                        else {
                            var value = itemObj._checkStrObj(misc_Array[0].value);  // check_item
                            var view_doc = value[0].view_doc;
                            if (view_doc == '' || view_doc == null || view_doc == undefined) {
                                view_doc = "true";
                            }

                            var base_path = value[0].base_path;
                            var upload_type = value[0].upload_type;
                            if (upload_type == '' || upload_type == null || upload_type == undefined) {
                                upload_type == 'easyform';
                            }
                        }

                        var value = itemObj._checkStrObj(misc_Array[0].value);  // check_item
                        var mob_ext = value[0].mob_ext;
                        var max_file_size = value[0].max_file_size;

                        if (max_file_size == '' || max_file_size == null || max_file_size == undefined) {

                            let domain_url = JSON.parse(storage.getItem('global_url'));
                            if (domain_url.indexOf("myaims.vedangcellular.com") > -1) {
                                // myaims
                                max_file_size = 10;
                            }
                            else {
                                max_file_size = 5;
                            }

                        }

                        newdiv += '<div id="div_upload_doc_' + new_id + '" class="cntrl_main_div ' + ele_class + '" style="' + disp_cntrl + '" name="' + prop_name + '" ' + common_str + '>';
                        newdiv += label_str;

                        var btn_str = jsonObj[i].value;
                        if (btn_str == '' || btn_str == null || btn_str == undefined) {
                            btn_str = "Upload Doc";
                        }

                        var obj = {
                            read_type: 'readchecksheet',
                            ans: '',
                            que_id: jsonObj[i].que_id,
                            new_id: new_id,
                            enable_disable: enable_disable,
                            btn_text: btn_str,
                            view_doc: view_doc,
                            upload_type: upload_type,
                            base_path: base_path,
                            mob_ext: mob_ext,
                            max_file_size: max_file_size
                        }

                        var control = new MkControls(obj);
                        newdiv += control.build_type_26_upload();
                        newdiv += '</div>';

                        Type26_upload_Array.push({
                            'new_id': new_id,
                            'que_id': jsonObj[i].que_id
                        });
                    }

                    // pdf viewer
                    else if (jsonObj[i].type == 27) {
                        var misc_Array = jsonObj[i].prop[0].misc_data;
                        var value = itemObj._checkStrObj(misc_Array[0].value);  // check_item
                        var pdf_type = value[0].report_type;

                        newdiv += '<div id="div_pdfviewer_' + new_id + '" class="cntrl_main_div ' + ele_class + '" style="' + disp_cntrl + '" ' + cls_enable + ' ' + common_str + '>';
                        newdiv += label_str;

                        var btn_str = jsonObj[i].value;
                        if (btn_str == '' || btn_str == null || btn_str == undefined) {
                            btn_str = "Get PDF Report";
                        }

                        var param = "get_pdf_report('" + i + "','" + new_id + "','" + pdf_type + "')";

                        var obj = {
                            new_id: new_id,
                            enable_disable: enable_disable,
                            param: param,
                            btn_text: btn_str
                        }

                        var control = new MkControls(obj);
                        newdiv += control.build_type_27_pdf();
                        newdiv += '</div>';
                    }

                    // Video Capture
                    else if (jsonObj[i].type == 28) {
                        newdiv += "<div id='div_video_" + new_id + "' class='cntrl_main_div " + ele_class + "' style='" + disp_cntrl + "' " + cls_enable + " " + common_str + ">";
                        newdiv += label_str;

                        if (enable_disable == "disabled") {
                            var param = '';
                        }
                        else {
                            var param = 'capture_video("' + i + '", "' + jsonObj[i].que_id + '", "video_' + new_id + '", "' + form_flag + '")';
                        }

                        var obj = {
                            read_type: 'readchecksheet',
                            ans: '',
                            new_id: new_id,
                            name: prop_name,
                            enable_disable: enable_disable,
                            param: param,
                            param1: '',
                            btn_text: btn_text,
                            curr_clps_new_id: curr_clps_new_id
                        }

                        var control = new MkControls(obj);
                        newdiv += control.build_type_28_video();
                        newdiv += '</div>';
                    }

                    //Trip Info
                    else if (jsonObj[i].type == 29) {
                        newdiv += "<div id='div_trip_" + new_id + "' class='cntrl_main_div " + ele_class + "' style='" + disp_cntrl + "' " + common_str + ">";
                        newdiv += label_str;

                        newdiv += '<table id="trip_info_tbl" style="width: 100%; margin-bottom: 0;font-size:12px;" border=1><thead><tr><th style="padding: 2px 4px !important; background: #f1f1f1 !important; font-weight: bold !important;">Actual Distance <sub>(km)</sub></th><th style="padding: 2px 4px; background: #f1f1f1; font-weight: bold;">Suggested Distance <sub>(km)</sub></th><th style="padding: 2px 4px; background: #f1f1f1; font-weight: bold;">Start Point</th><th style="padding: 2px 4px; background: #f1f1f1; font-weight: bold;">Destination Point</th></tr></thead></table>';

                        setTimeout(function () {
                            if (check_type == 91516) {
                                $(".task_cls").find("select").attr("onchange", "get_trip_info(this)")
                            }
                            else {
                                get_trip_info();
                            }
                        }, 1000);

                        newdiv += '</div>';
                    }

                    // Dynamic Dropdown //
                    else if (jsonObj[i].type == 30) {

                        var misc_Array = jsonObj[i].prop[0].misc_data;
                        var url = misc_Array[0].url;
                        var param = misc_Array[0].param;
                        var method = misc_Array[0].method;
                        var outer_response = misc_Array[0].outer_response;
                        var inner_response = misc_Array[0].inner_response;
                        var view_type = misc_Array[0].view_type;
                        if (view_type == '' || view_type == null || view_type == undefined) {
                            view_type = 'dropdownview';
                        }
                        var default_value = misc_Array[0].default_value;

                        if (view_type == "dropdownview") {
                            var onclick_str = " onclick=get_dynddl_data_onclick('" + new_id + "');";
                        }
                        else {
                            var onclick_str = "";
                        }
                        newdiv += '<div id="div_dynddl_' + new_id + '" class="cntrl_main_div ' + ele_class + '" style="' + disp_cntrl + '" ' + cls_enable + ' ' + common_str + ' ' + onclick_str + '>';
                        newdiv += label_str;

                        var value = misc_Array[0].value;
                        if (value == '' || value == null || value == undefined) {
                            var RowQueryWhere = "";
                            var autofill_data = [];
                        } else {
                            value = itemObj._checkStrObj(value);
                            var RowQueryWhere = value[0].RowQueryWhere;
                            if (RowQueryWhere == '' || RowQueryWhere == null || RowQueryWhere == undefined) {
                                var RowQueryWhere = "";
                            }
                            else {

                                // if view_type is other than dropdownview then value will be taken from inbuilt numeric/text box
                                if (view_type == 'dropdownview') {
                                    for (e = 0; e < RowQueryWhere.length; e++) {
                                        var get_value = RowQueryWhere[e]['value'];
                                        if (get_value == '' || get_value == null || get_value == undefined) { }
                                        else {
                                            var value_type = get_value.substring(2, 1);
                                            var sub_get_value = get_value.substring(2, get_value.length - 2);
                                            if (value_type == "@") {
                                                Show_class_Array.push(sub_get_value);
                                            }
                                        }
                                    }
                                }

                            }
                            var autofill_data = value[0].autofill_data;
                            if (autofill_data == "" || autofill_data == null || autofill_data == undefined) {
                                autofill_data = [];
                            }
                            for (af = 0; af < autofill_data.length; af++) {
                                var classname = autofill_data[af].classname;
                                Show_class_Array.push(classname);
                            }
                        }

                        if (url.indexOf('/') > -1) { }
                        else {
                            url = global_wcf_url + url;
                        }

                        var T30_Obj = {
                            new_id: new_id,
                            que_id: jsonObj[i].que_id,
                            url: url,
                            param: param,
                            method: method,
                            outer_response: outer_response,
                            inner_response: inner_response,
                            view_type: view_type,
                            RowQueryWhere: RowQueryWhere,
                            autofill_data: autofill_data
                        };

                        if (view_type == 'dropdownview') {
                            Type30_dynddl_Array.push(T30_Obj);
                        }

                        var param_ddyddl = "get_dynddl_data_onclick('" + new_id + "')";

                        var obj = {
                            read_type: 'readchecksheet',
                            ans: '',
                            new_id: new_id,
                            que_id: jsonObj[i].que_id,
                            enable_disable: enable_disable,
                            param: param_ddyddl,
                            view_type: view_type,
                            RowQueryWhere: RowQueryWhere,
                            param1: '',
                            default_val: default_value
                        };

                        newdiv += "<input type='hidden' id='hdn_dynddl_" + new_id + "' value='" + JSON.stringify(T30_Obj) + "'>";

                        var control = new MkControls(obj);
                        if (view_type == 'dropdownview' || view_type == 'textview' || view_type == 'numericview') {
                            newdiv += control.build_type_30_dynddl();
                        }
                        else {
                            newdiv += '<div style="width:100%; overflow:auto" >';
                            newdiv += '<table id="tbl_dynddl_' + new_id + '" style="width:100%"></table>';
                            newdiv += '</div>';
                        }
                        newdiv += '</div>';
                    }

                    // Note
                    else if (jsonObj[i].type == 31) {
                        newdiv += '<div id="div_note_' + new_id + '" class="cntrl_main_div ' + ele_class + '" style="padding-top:5px;' + disp_cntrl + '" ' + cls_enable + ' ' + common_str + '>';

                        var obj = {
                            new_id: new_id,
                            value: jsonObj[i].value
                        }
                        var control = new MkControls(obj);
                        newdiv += control.build_type_31_label();
                        newdiv += '</div>';
                    }

                    // Email SMS
                    else if (jsonObj[i].type == 32) {
                        newdiv += "<div id='div_email_sms_" + new_id + "' class='cntrl_main_div " + ele_class + "' style='" + disp_cntrl + "' " + cls_enable + " " + common_str + ">";
                        newdiv += label_str;

                        newdiv += '<div style="padding:5px;">';
                        newdiv += '<label class="lbl_type5" style="display:block; width:92%; word-break: break-word; font-size: 15px; font-family: calibri;font-weight:bold;">Subject</label>';
                        newdiv += '</div>';
                        newdiv += '<div style="border:solid 1px #ccc;border-radius: 5px;padding:0 5px;margin-bottom: 5px;">';
                        newdiv += '<input class="form-ele" type="text" id="txt_subject" placeholder="Subject">';
                        newdiv += '</div>';

                        newdiv += '<div style="padding:5px;">';
                        newdiv += '<label class="lbl_type5" style="display:block; width:92%; word-break: break-word; font-size: 15px; font-family: calibri;font-weight:bold;">Message</label>';
                        newdiv += '</div>';
                        newdiv += '<div style="border:solid 1px #ccc;border-radius: 5px;padding:0 5px;margin-bottom: 5px;">';
                        newdiv += '<textarea rows="1" id="txt_message" placeholder="Message"></textarea>';
                        newdiv += '</div>';

                        //email
                        newdiv += '<table id="tbl_email" class="type_32_table" style="width:100%;"><thead><tr><th>';
                        newdiv += '<div style="padding:5px;">';
                        newdiv += '<label class="lbl_type5" style="display:inline; width:92%; word-break: break-word; font-size: 15px; font-family: calibri;font-weight:bold;">Email</label>';
                        newdiv += '<button type="button" title="Add new email id" class="button button-fill" onclick="add_email();" style="float:right;min-width: 25px;height: 25px;line-height: 30px;margin-bottom:5px;"><i class="fa fa-plus" style="margin:0;color: #fff;"></i></button></div>';
                        newdiv += '</th></tr></thead>';

                        newdiv += '<tbody><tr><td>';
                        newdiv += '<div style="border:solid 1px #ccc;border-radius: 5px;padding:0 5px;margin-bottom: 5px;">';
                        newdiv += '<input type="text" class="form-ele" placeholder="Email">';
                        newdiv += '<i class="fa fa-times-circle input_ico" title="remove this item" style="color:red;float:right;font-size:25px;margin-top:6px;" onclick="remove_item(this)"></i></div>';
                        newdiv += '</td></tr></tbody></table>';

                        //contact
                        newdiv += '<table id="tbl_contact" class="type_32_table" style="width:100%;"><thead><tr><th>';
                        newdiv += '<div style="padding:5px;">';
                        newdiv += '<label class="lbl_type5" style="display:inline; width:92%; word-break: break-word; font-size: 15px; font-family: calibri;font-weight:bold;">Contact</label>';
                        newdiv += '<button type="button" title="Add new emaAdd new contact number" class="button button-fill" onclick="add_contact();" style="float:right;min-width: 25px;height: 25px;line-height: 30px;margin-bottom:5px;"><i class="fa fa-plus" style="margin:0;color: #fff;"></i></button></div>';
                        newdiv += '</th></tr></thead>';

                        newdiv += '<tbody><tr><td>';
                        newdiv += '<div style="border:solid 1px #ccc;border-radius: 5px;padding:0 5px;margin-bottom: 5px;">';
                        newdiv += '<input type="number"class="form-ele" placeholder="Contact">';
                        newdiv += '<i class="fa fa-times-circle input_ico" title="remove this item" style="color:red;float:right;font-size:25px;margin-top:6px;" onclick="remove_item(this)"></i></div>';
                        newdiv += '</td></tr></tbody></table>';

                        newdiv += '<div style="margin-top: 10px;display:block;text-align: -webkit-right;"><button type="button" class="button button-fill" style="display:inline-block;border-radius:5px;padding:0 20px;" onclick="send_email_sms(' + check_type + ', ' + step + ', ' + jsonObj[i].que_id + ');"><i class="fa fa-mail-forward" style="margin:0;color:#fff;"></i> Send</button></div>';
                        newdiv += '</div>';

                        Type32_Array.push(check_type, step, jsonObj[i].que_id);
                    }


                    // Auto Incremental ID
                    else if (jsonObj[i].type == 33) {
                        newdiv += "<div id='div_AutoInc_" + new_id + "' class='cntrl_main_div " + ele_class + "' style='display:none; width:95%; overflow:auto;" + disp_cntrl + "' " + cls_enable + " " + common_str + ">";
                        newdiv += label_str;
                        newdiv += '</div>';
                    }

                    // Event control
                    else if (jsonObj[i].type == 34) {
                        newdiv += "<div id='div_Event_" + new_id + "' class='cntrl_main_div " + ele_class + "' style='display:none; width:95%; overflow:auto;" + disp_cntrl + "' " + cls_enable + " " + common_str + ">";
                        newdiv += label_str;
                        newdiv += '</div>';

                        var value_Array = jsonObj[i].value;
                        for (e = 0; e < value_Array.length; e++) {
                            var cls_name = value_Array[e];
                            Show_class_Array.push(cls_name);
                        }

                        Type34_Event_Array.push({
                            type_class: value_Array[0],
                            start_time_class: value_Array[1],
                            end_time_class: value_Array[2],
                            subject_class: value_Array[3],
                            description_class: value_Array[4],
                            attendee_class: value_Array[5],
                            trigger_class: value_Array[6]
                        });
                    }

                    // RF Tracking
                    else if (jsonObj[i].type == 35) {
                        var misc_Array = jsonObj[i].prop[0].misc_data;
                        var value = itemObj._checkStrObj(misc_Array[0].value);
                        if (value == '' || value == null || value == undefined) {
                            var RowQueryWhere = "";
                            var autofill_data = [];
                        } else {
                            value = itemObj._checkStrObj(value);
                            var RowQueryWhere = value[0].RowQueryWhere;
                            if (RowQueryWhere == '' || RowQueryWhere == null || RowQueryWhere == undefined) {
                                var mode_class = '';
                            }
                            else {
                                var mode_class = RowQueryWhere[0]['value'];
                            }
                            var autofill_data = value[0].autofill_data;
                            if (autofill_data == "" || autofill_data == null || autofill_data == undefined) {
                                autofill_data = [];
                            }
                            for (af = 0; af < autofill_data.length; af++) {
                                var classname = autofill_data[af].classname;
                                Show_class_Array.push(classname);
                            }
                        }

                        if (form_flag == 6) {
                            var param = 'get_RF_Tracking("' + mode_class + '", "' + new_id + '")';
                        }
                        else {
                            var param = 'pre_get_RF_Tracking("' + mode_class + '", "' + new_id + '")';
                        }

                        newdiv += "<div id='div_RF_" + new_id + "' class='cntrl_main_div " + ele_class + "' style='" + disp_cntrl + "' " + cls_enable + " " + common_str + ">";
                        newdiv += label_str;

                        var obj = {
                            new_id: new_id,
                            enable_disable: enable_disable,
                            param: param
                        }
                        newdiv += "<input type='hidden' id='hdn_rf_" + new_id + "' value='" + JSON.stringify(autofill_data) + "'>";

                        var control = new MkControls(obj);
                        newdiv += control.build_type_35_RF();
                        newdiv += '</div>';
                    }

                    // Checklist
                    else if (jsonObj[i].type == 36) {
                        var param = "";
                        var data = [];

                        var misc_Array = jsonObj[i].prop[0].misc_data;
                        var weightage_Array = jsonObj[i].prop[0].weightage;

                        newdiv += '<div id="div_chklst_' + new_id + '" class="cntrl_main_div ' + ele_class + '" style="' + disp_cntrl + '" ' + cls_enable + ' ' + common_str + '>';
                        newdiv += label_str;
                        newdiv += '</div>';

                        var obj = {
                            read_type: 'readchecksheet',
                            ans: '',
                            new_id: new_id,
                            value: jsonObj[i].value,
                            default_val: default_val,
                            enable_disable: enable_disable,
                            param: param,
                            weightage_Array: weightage_Array,
                            br_str: br_str
                        }


                        var control = new MkControls(obj);
                        newdiv += control.build_type_36_checkbox();
                    }

                    // Sub Task
                    else if (jsonObj[i].type == 37) {

                        var misc_Array = jsonObj[i].prop[0].misc_data;

                        newdiv += '<div id="div_subtask_' + new_id + '" class="cntrl_main_div ' + ele_class + '" ' + cls_enable + ' ' + common_str + ' style="border-bottom: 1px solid #ccc; ' + disp_cntrl + '" >';
                        newdiv += label_str;

                        var obj = {
                            read_type: 'readchecksheet',
                            new_id: new_id,
                            value: jsonObj[i].value,
                            misc_Array: misc_Array,
                            prop_name: prop_name,
                            que_id: jsonObj[i].que_id,
                            mendatory_img: mendatory_img,
                            disp_cntrl: disp_cntrl,
                            ele_class: ele_class,
                            common_str: common_str
                        }

                        var control = new MkControls(obj);
                        newdiv += control.build_type_37_subtask();

                        newdiv += '</div>';
                    }

                    // Map View
                    else if (jsonObj[i].type == 38) { }

                    // Weather
                    else if (jsonObj[i].type == 39) {

                        var misc_Array = jsonObj[i].prop[0].misc_data;

                        newdiv += '<div id="div_weather_' + new_id + '" class="cntrl_main_div ' + ele_class + '" ' + cls_enable + ' ' + common_str + ' style="border-bottom: 1px solid #ccc; ' + disp_cntrl + '" >';
                        newdiv += label_str;

                        var obj = {
                            new_id: new_id,
                            value: jsonObj[i].value,
                            misc_Array: misc_Array,
                            prop_name: prop_name,
                            que_id: jsonObj[i].que_id,
                            mendatory_img: mendatory_img,
                            disp_cntrl: disp_cntrl,
                            ele_class: ele_class,
                            common_str: common_str
                        }

                        var control = new MkControls(obj);
                        newdiv += control.build_type_39_weather();
                        weather_cntrl_found++;

                        newdiv += '</div>';
                    }

                    // Live link
                    else if (jsonObj[i].type == 40) {

                        var misc_Array = jsonObj[i].prop[0].misc_data;

                        newdiv += '<div id="div_livelink_' + new_id + '" class="cntrl_main_div ' + ele_class + '" ' + cls_enable + ' ' + common_str + ' style="border-bottom: 1px solid #ccc; ' + disp_cntrl + '" >';
                        newdiv += label_str;

                        var obj = {
                            read_type: 'readchecksheet',
                            ans: '',
                            new_id: new_id,
                            value: jsonObj[i].value,
                            misc_Array: misc_Array,
                            prop_name: prop_name,
                            que_id: jsonObj[i].que_id,
                            mendatory_img: mendatory_img,
                            disp_cntrl: disp_cntrl,
                            ele_class: ele_class,
                            common_str: common_str
                        }

                        Type40_ll_Array.push(new_id);

                        var control = new MkControls(obj);
                        newdiv += control.build_type_40_livelink();
                        newdiv += '</div>';
                    }

                    ////added comment icon for every control on swipe right [FT - 12022025]
                    if (form_flag == 0 || form_flag == 2 || form_flag == 3) {
                        if (cnrl_type != 0) {
                            newdiv += '<div class="swipeout-actions-right cls-cntrl-comment-outer" id="container_cntrl_cmnt_' + new_id + '">';
                            newdiv += '<a href="#" class=""><i class="fa fa-comments icon-cntrl-cmnt cls-cmnt-cntrl" cntrl_checksheet_id="' + check_type + '" cntrl_que_id="' + que_id + '" cntrl_que_name="' + prop_name + '"></i>';
                            newdiv += '<span class="notification-counter" style="display:none;"></span></a>';
                            newdiv += '</div>';

                            newdiv += '</li>';
                        }
                    }

                }
            }
            // /for loop end at below curly bracket of elements
        }
        if (type0_ele_class == "true") {
            //for type0 dependency (insolare(in.rt))
            newdiv += '</div>';
        }

        if (form_flag == 0 || form_flag == 2 || form_flag == 3) {
            newdiv += '</div>';
        }

        //alert1("newdiv" + newdiv);
        if (form_flag == 0) {
            // normal form
            jsonObj_old = jsonObj;
            $("#container_div").append(newdiv);

            $("#container_div").find('.cntrl_main_div').addClass('swipeout-content');

            // type 22 code
            // if (inv_new_counter > 0) {
            // var json_length = json_inv.length;
            // var json_data = JSON.stringify(json_inv);
            //
            // if (inv_display_flag == 0) {
            // create_table_with_item(inv_Calc_new);
            // } else {
            // create_listview_with_item(inv_Calc_new);
            // }
            // }

            for (ca = 0; ca < json_inv_array.length; ca++) {
                if (inv_display_flag_array[ca] == 0) {
                    create_table_with_item(inv_Calc_new_array[ca]);
                } else {
                    create_listview_with_item(inv_Calc_new_array[ca]);
                }
            }

            read_dynamic_checksheet_buttons(buttons, Show_class_Array, LL_class_Array, dependency_Array, check_type);
        }
        else if (form_flag == 1) {
            // for type 22 popup control json for validation in SumbitSurveyData
            jsonObj_type22 = jsonObj;

            var json_inv = storage.getItem('json_inv');
            var btn_add = inv_Calc_new_array[json_inv];

            //var param = "return submit_popup_data(" + json_inv + ")";
            var param = "return submit_popup_data('" + json_inv + "', '" + btn_add + "', 'readchecksheet')";
            var type22_json_len = $("#hdn_type22_json_len_" + btn_add + "").val();
            var type22_snglCntrl_type = $("#hdn_type22_json_len_" + btn_add + "").attr('type22_snglCntrl_type');
            if (type22_json_len == 1 && type22_snglCntrl_type == 20) {
                //single invoice control UI changes [18112021]
                if (type22_snglCntrl_type == 20) { }
                else {
                    newdiv += '<span class="align-top d-inline-block" style="margin: 5px 25px;"><button type="button" id="btn_add_row_popup' + btn_add + '" value="Add Record" onclick="' + param + '" style="margin:0px;" class="btn btn-primary">Add</button>';
                    newdiv += '</span>';
                }
                var single_jsonObj_type22 = JSON.stringify(jsonObj_type22);
                newdiv += "<input type='hidden' id='hdn_jsonObj_type22_" + btn_add + "' value='" + single_jsonObj_type22 + "'>";
                $("#div_singleInvoice_cntrl_" + btn_add + "").empty();
                $("#div_singleInvoice_cntrl_" + btn_add + "").append(newdiv);

                //if single invoice control is type20 then add record on onchange event

                if (type22_json_len == 1 && type22_snglCntrl_type == 20) {
                    //add default multiselect for single invoice type20 [13062022]

                    $("#ddl_search_type20_" + new_id + "").attr('multiple', 'multiple');
                    $("#ddl_search_type20_" + new_id + "").attr('type22_array_index', json_inv);
                }
            }
            else {
                var foot_str = '<div class="left"><a href="#" class="link" onclick="popup_items_hide_type22(1)">CANCEL</a></div>';
                foot_str += '<div class="right"><a href="#" class="link" id="btn_add_row_popup' + btn_add + '" onclick="' + param + '">ADD</a></div>';
                $('.foooter-type22').append(foot_str);
                $("#div_inv_form").append(newdiv);
            }

            read_dynamic_checksheet_checks(Show_class_Array, "", dependency_Array);
        }
        else if (form_flag == 2) {
            // collapsible step div type 23
            $("#collapse_container_div_" + curr_clps_new_id + "").append(newdiv);
            $("#collapse_container_div_" + curr_clps_new_id + "").find('.cntrl_main_div').addClass('swipeout-content');

            form_flag = 0;
        }
        else if (form_flag == 3) {
            // type 23 popup div container
            $("#clps_popup_container_div").append(newdiv);
            $("#clps_popup_container_div").find('.cntrl_main_div').addClass('swipeout-content');

        }
        else if (form_flag == 6 || form_flag == 14) {
            // task

            let task_create_popup = $('.popup-new-task-create.modal-in:visible');
            if (task_create_popup.length > 0) {
                jsonObj_task_add = jsonObj;
            }
            else {
                jsonObj_old = jsonObj;
            }

            if (form_flag == 6) {
                if (task_create_popup.length > 0) {
                    $(".popup-new-task-create #container_div").append(newdiv);
                }
                else {
                    $("#container_div").append(newdiv);
                }
            }
            else if (form_flag == 14) {
                $("#container_div_invoice").append(newdiv);
            }

            if (inv_new_counter > 0) {
                for (ca = 0; ca < json_inv_array.length; ca++) {
                    if (inv_display_flag_array[ca] == 0) {
                        create_table_with_item(inv_Calc_new_array[ca]);
                    } else {
                        create_listview_with_item(inv_Calc_new_array[ca]);
                    }
                }
            }

            if (form_flag == 6) {
                if (is_attendance_task == 1) {
                    // attendance task create through notification

                    if (buttons == "" || buttons == null || buttons == undefined) {
                        var param_task = "validate_and_submit_surveydata(1, 6, 'data')";
                        var footer_btn_str = '<div class="left"></div><div class="right"><a class="link" onclick="' + param_task + '">Add Attendance</a></div>';

                        if (type37_len > 0) {
                            $(".popup-new-task-create #container_btn_div").append(footer_btn_str);
                        }
                        else {
                            $("#container_btn_div").append(footer_btn_str);
                        }
                    }
                    else {
                        //build_task_buttons(buttons);
                        read_dynamic_checksheet_buttons(buttons, Show_class_Array, LL_class_Array, dependency_Array, check_type);
                    }

                    var selected_modulename = JSON.parse(storage.getItem('wayflow_name'));
                    $('#search_item_name_S_Search_' + curr_clps_new_id + '_' + check_type + '_7').val(selected_modulename);
                    $('#search_item_name_S_Search_' + curr_clps_new_id + '_' + check_type + '_7').prop("disabled", true);
                    $('#btn21_Search_' + curr_clps_new_id + '_' + check_type + '_7').attr('onclick', '');
                    $('#search_item_name_S_Search_' + curr_clps_new_id + '_' + check_type + '_7').attr('name', '1');

                    if (attendance_photo_url == "" || attendance_photo_url == null || attendance_photo_url == undefined) {
                        alert1("Profile photo is blank!");
                    }
                    else {
                        set_attendance_photo_in_task_form(check_type, attendance_photo_url)
                    }
                }
                else {
                    // normal task create
                    if (buttons == "" || buttons == null || buttons == undefined) {
                        var task_button_text = list_data[0].task_button_text;
                        if (task_button_text == '' || task_button_text == null || task_button_text == undefined) {
                            task_button_text = 'Create Task';
                        }
                        var param_task = "validate_and_submit_surveydata(1, 6, 'data')";
                        var footer_btn_str = '<div class="left"></div><div class="right"><a class="link" onclick="' + param_task + '">' + task_button_text + '</a></div>';

                        if (type37_len > 0) {
                            $(".popup-new-task-create #container_btn_div").append(footer_btn_str);
                        }
                        else {
                            $("#container_btn_div").append(footer_btn_str);
                        }
                    }
                    else {
                        //build_task_buttons(buttons);
                        read_dynamic_checksheet_buttons(buttons, Show_class_Array, LL_class_Array, dependency_Array, check_type);
                    }

                    // set UserName
                    var user_id = JSON.parse(storage.getItem('user_id'));
                    var user_name = JSON.parse(storage.getItem('username'));

                    // removed statis user fill logic - ATC - 08062020
                    ////tableview
                    //$('#search_item_name_Search_' + curr_clps_new_id + '_' + check_type + '_4').val(user_name);
                    //$('#search_item_name_Search_' + curr_clps_new_id + '_' + check_type + '_4').prop("disabled", true);
                    //$('#search_item_name_Search_' + curr_clps_new_id + '_' + check_type + '_4').attr('name', '1');
                    //$('#search_item_name_Search_' + curr_clps_new_id + '_' + check_type + '_4').attr('title', user_id);
                    //$('#btn20_ShowAll_' + curr_clps_new_id + '_' + check_type + '_4').attr('onclick', '');
                    //$('#btn20_Search_' + curr_clps_new_id + '_' + check_type + '_4').attr('onclick', '');

                    ////dropdownview
                    //var t_new_cell_value = encodeURIComponent(user_name);
                    //var opt = "<option value=" + t_new_cell_value + " selected='selected' value1=" + user_id + ">" + user_name + "</option>";
                    ////setTimeout(function () {
                    //$('#ddl_search_type20_' + curr_clps_new_id + '_' + check_type + '_4').prepend(opt);
                    //$('#ddl_search_type20_' + curr_clps_new_id + '_' + check_type + '_4').prop("disabled", true);
                    //$('#ddl_search_type20_' + curr_clps_new_id + '_' + check_type + '_4').attr('name', '1');
                    ////}, 1000);

                    // /////////

                    // set FlowName for online-offline both
                    var selected_modulename = JSON.parse(storage.getItem('wayflow_name'));
                    $('#search_item_name_S_Search_' + curr_clps_new_id + '_' + check_type + '_7').val(selected_modulename);
                    $('#search_item_name_S_Search_' + curr_clps_new_id + '_' + check_type + '_7').prop("disabled", true);
                    $('#btn21_Search_' + curr_clps_new_id + '_' + check_type + '_7').attr('onclick', '');
                    $('#search_item_name_S_Search_' + curr_clps_new_id + '_' + check_type + '_7').attr('name', '1');

                    // set AssignDate
                    var cal_val = $('#cal_' + curr_clps_new_id + '_' + check_type + '_10').val();
                    if (cal_val == '' || cal_val == null || cal_val == undefined) {
                        //var date = new Date();
                        //var month = (1 + date.getMonth()).toString();
                        //month = month.length > 1 ? month : '0' + month;
                        //var day = date.getDate().toString();
                        //day = day.length > 1 ? day : '0' + day;
                        //var year = date.getFullYear();
                        //var date_s = month + '/' + day + '/' + year;

                        let date_s = convert_datetime_by_format("", "date");
                        $('#cal_' + curr_clps_new_id + '_' + check_type + '_10').val(date_s);
                    }
                    //$('#cal_' + curr_clps_new_id + '_' + check_type + '_10').prop("disabled", true);

                    var data_json = JSON.parse(storage.getItem('list_json'));
                    var list_data = JSON.parse(data_json);
                    var auto_fill_task = list_data[0].auto_fill_task;// for auto fill
                    var redirect = list_data[0].redirect;
                    var task_with_customer = list_data[0].task_with_customer;

                    // redirect = 'customer';
                    if (redirect == 'customer' || task_with_customer == "true") {
                        // set CustomerUniq
                        var cust_id = JSON.parse(storage.getItem('type20_cust_id'));
                        var cust_name = JSON.parse(storage.getItem('type20_cust_name'));

                        $('#search_item_name_Search_' + curr_clps_new_id + '_' + check_type + '_1').val(cust_name);
                        $('#search_item_name_Search_' + curr_clps_new_id + '_' + check_type + '_1').prop("disabled", true);
                        $('#search_item_name_Search_' + curr_clps_new_id + '_' + check_type + '_1').attr('name', '1');
                        $('#search_item_name_Search_' + curr_clps_new_id + '_' + check_type + '_1').attr('title', cust_id);
                        $('#btn20_ShowAll_' + curr_clps_new_id + '_' + check_type + '_1').attr('onclick', '');
                        $('#btn20_Search_' + curr_clps_new_id + '_' + check_type + '_1').attr('onclick', '');

                        //-----commented coz found duplicate opt and onchanges event binding issue for searchable [haresh1.vt - 11062021]
                        //var new_cell_value = encodeURIComponent(cust_name);
                        //var option = "<option value=" + new_cell_value + " selected='selected' value1=" + cust_id + ">" + cust_name + "</option>";

                        ////setTimeout(function () {
                        //$('#ddl_search_type20_' + curr_clps_new_id + '_' + check_type + '_1').prepend(option);
                        //$('#ddl_search_type20_' + curr_clps_new_id + '_' + check_type + '_1').prop("disabled", true);
                        //$('#ddl_search_type20_' + curr_clps_new_id + '_' + check_type + '_1').attr('name', '1');
                        ////}, 1000);
                        //-----commented coz found duplicate opt and onchanges event binding issue for searchable [haresh1.vt - 11062021]

                    } else {
                        if (auto_fill_task == "true") {

                            // don't call type20 if auto_fill_task = "true" and it is
                            // not mendatory
                            if (Type20_AutoFill_DDL_Array.length > 0) {
                                for (z = 0; z < Type20_AutoFill_DDL_Array.length; z++) {
                                    var t_que_id = Type20_AutoFill_DDL_Array[z].que_id;
                                    var t_valid = Type20_AutoFill_DDL_Array[z].valid;
                                    if (t_que_id == '13' && t_valid == "false") {
                                        Type20_AutoFill_DDL_Array.splice(z, 1);
                                        break;
                                    }
                                }
                            }

                            // set CustomerUniq
                            var flow_Array = JSON.parse(storage.getItem('flow_Array'));
                            if (flow_Array.length == 1) {
                                $('#search_item_name_Search_' + curr_clps_new_id + '_' + check_type + '_1').val(0);
                                $('#search_item_name_Search_' + curr_clps_new_id + '_' + check_type + '_1').attr('title', '00');
                            } else {
                                // sub flow (TV)
                                var cust_id = JSON.parse(storage.getItem('type20_cust_id'));
                                var cust_name = JSON.parse(storage.getItem('type20_cust_name'));
                                $('#search_item_name_Search_' + curr_clps_new_id + '_' + check_type + '_1').val(cust_name);
                                $('#search_item_name_Search_' + curr_clps_new_id + '_' + check_type + '_1').attr('title', cust_id);

                                //-----commented coz found duplicate opt and onchanges event binding issue for searchable [haresh1.vt - 11062021]
                                //var new_cell_value = encodeURIComponent(cust_name);
                                //var option = "<option value=" + new_cell_value + " selected='selected' value1=" + cust_id + ">" + cust_name + "</option>";

                                ////setTimeout(function () {
                                //$('#ddl_search_type20_' + curr_clps_new_id + '_' + check_type + '_1').prepend(option);
                                //$('#ddl_search_type20_' + curr_clps_new_id + '_' + check_type + '_1').prop("disabled", true);
                                //$('#ddl_search_type20_' + curr_clps_new_id + '_' + check_type + '_1').attr('name', '1');
                                ////}, 1000);
                                //-----commented coz found duplicate opt and onchanges event binding issue for searchable [haresh1.vt - 11062021]

                                //// temporary set as main flow (above)
                                //$('#search_item_name_Search_' + curr_clps_new_id + '_' + check_type + '_1').val(0);
                                //$('#search_item_name_Search_' + curr_clps_new_id + '_' + check_type + '_1').attr('title', '00');

                                // print tenant number
                                var staticdata = list_data[0].staticdata;
                                var tenant_box_id = $(".static_increment").find("input").attr("id");
                                var tenant_count = JSON.parse(storage.getItem('tenant_count'));
                                tenant_count = parseInt(tenant_count);
                                tenant_count = tenant_count + 1;
                                var default_val = $("#" + tenant_box_id + "").attr("placeholder");
                                if (staticdata == '' || staticdata == null || staticdata == undefined) {
                                    var pre_text = default_val;
                                } else {
                                    var pre_text = staticdata;
                                }

                                if (default_val == '' || default_val == null || default_val == undefined) {
                                    var pre_text = "Site";
                                } else {
                                    var pre_text = default_val;
                                }

                                $("#" + tenant_box_id + "").val(pre_text + " " + tenant_count);
                            }

                            $('#search_item_name_Search_' + curr_clps_new_id + '_' + check_type + '_1').prop("disabled", true);
                            $('#search_item_name_Search_' + curr_clps_new_id + '_' + check_type + '_1').attr('name', '1');
                            $('#btn20_ShowAll_' + curr_clps_new_id + '_' + check_type + '_1').attr('onclick', '');
                            $('#btn20_Search_' + curr_clps_new_id + '_' + check_type + '_1').attr('onclick', '');

                            // need to bind type8 and type20 before calling submit
                            // function
                            // validate_and_submit_surveydata(1, 6, jsonObj_old);
                        }
                    }

                    enable_back_button();
                }
            }
            else if (form_flag == 14) {
                // invoice task create from type37
                var flow_name = curr_all_data_20["invoice_flow_name"];
                var flow_id = curr_all_data_20["invoice_flow_id"];

                $('#search_item_name_S_Search_' + curr_clps_new_id + '_' + check_type + '_7').val(flow_name);
                $('#search_item_name_S_Search_' + curr_clps_new_id + '_' + check_type + '_7').prop("disabled", true);
                $('#btn21_Search_' + curr_clps_new_id + '_' + check_type + '_7').attr('onclick', '');
                $('#search_item_name_S_Search_' + curr_clps_new_id + '_' + check_type + '_7').attr('name', '1');
                $('#search_item_name_S_Search_' + curr_clps_new_id + '_' + check_type + '_7').attr('title', flow_id);

                read_dynamic_checksheet_checks(Show_class_Array, "", dependency_Array);
            }
        }
        else if (form_flag == 7) {
            // type20 customer creation
            jsonObj_cust_add = jsonObj;

            var container_str = document.getElementById("container_div").innerHTML;
            if (container_str == null || container_str == undefined || container_str == '') {
                $("#container_div").append(newdiv);
                jsonObj_old = jsonObj;

                // if found current form invoice only [FT-30052025]
                if (invoice_found > 0) {
                    if (inv_new_counter > 0) {                                      //display type22 table/list in customer form [01012021]
                        for (ca = 0; ca < json_inv_array.length; ca++) {
                            if (inv_display_flag_array[ca] == 0) {
                                create_table_with_item(inv_Calc_new_array[ca]);
                            } else {
                                create_listview_with_item(inv_Calc_new_array[ca]);
                            }
                        }
                    }
                }

                if (buttons == "" || buttons == null || buttons == undefined) {
                    var data_json = JSON.parse(storage.getItem('list_json'));
                    var list_data = JSON.parse(data_json);
                    if (list_data == "" || list_data == null || list_data == undefined) {
                        var cust_button_text = '';
                    }
                    else {
                        var cust_button_text = list_data[0].customer_button_text;
                    }
                    if (cust_button_text == '' || cust_button_text == null || cust_button_text == undefined) {
                        cust_button_text = 'Create Customer';
                    }
                    var param_cust = "return submit_customer_form()";
                    var footer_btn_str = '<div class="left"></div><div class="right"><a class="link" onclick="' + param_cust + '">' + cust_button_text + '</a></div>';
                    read_dynamic_checksheet_checks(Show_class_Array, "", dependency_Array);
                    $("#container_btn_div").append(footer_btn_str);
                }
                else {
                    //build_task_buttons(buttons);
                    read_dynamic_checksheet_buttons(buttons, Show_class_Array, Site_LL_class_Array, dependency_Array, check_type);
                }
                enable_back_button();
            }
            else {
                var param = "return submit_popup_data_type20_add()";
                var foot_str = '<div class="left"><a href="#" class="link" onclick="hide_type20_add_popup()">CANCEL</a></div>';
                foot_str += '<div class="right"><a href="#" class="link" id="btn_type20_cust_add" onclick="' + param + '">ADD</a></div>';
                $('.footer-type20-add').append(foot_str);
                $("#popup_container_type20_add").empty();
                $("#popup_container_type20_add").append(newdiv);

                //auto select customer search string if no record found for new customer creation [FT - 31012024]
                if (glob_new_cust_flag == "create_cust") {
                    var cust_added_str = localStorage.getItem('customer_search_str');
                    var cntrl_id = $("#popup_container_type20_add").find(".cntrl_main_div[que_id='1']").attr('id');
                    $("#" + cntrl_id).find('input').val(cust_added_str);
                }

                // if found current form invoice only [FT-30052025]
                if (invoice_found > 0) {
                    if (inv_new_counter > 0) {                                      //display type22 table/list in customer form [01012021]
                        for (ca = 0; ca < json_inv_array.length; ca++) {
                            if (inv_display_flag_array[ca] == 0) {
                                create_table_with_item(inv_Calc_new_array[ca]);
                            } else {
                                create_listview_with_item(inv_Calc_new_array[ca]);
                            }
                        }
                    }
                }

                read_dynamic_checksheet_buttons(buttons, Show_class_Array, LL_class_Array, dependency_Array, check_type);
            }
        }
        else if (form_flag == 8) {
            // user create
            jsonObj_user_add = jsonObj;
            $("#container_div_user").append(newdiv);

            if (inv_new_counter > 0) {                                      //display type22 table/list in customer form [01012021]
                for (ca = 0; ca < json_inv_array.length; ca++) {
                    if (inv_display_flag_array[ca] == 0) {
                        create_table_with_item(inv_Calc_new_array[ca]);
                    } else {
                        create_listview_with_item(inv_Calc_new_array[ca]);
                    }
                }
            }

            var param_cust = "return submit_user_form()";
            var footer_btn_str = '<div class="left"></div><div class="right"><a class="link" onclick="' + param_cust + '">Create User</a></div>';
            read_dynamic_checksheet_checks(Show_class_Array, "", dependency_Array);
            $("#container_btn_div").append(footer_btn_str);
            enable_back_button();
        }
        else if (form_flag == 9) {
            // filter
            jsonObj_old = jsonObj;
            $("#container_div").append(newdiv);
        }
        else if (form_flag == 12) {
            // group task form binding (bind seprate step form to seprate task div)

            curr_survey_data["heading"] = heading;
            curr_survey_data["check_type"] = check_type;
            curr_survey_data["siteid"] = JSON.parse(storage.getItem('siteid'));
            curr_survey_data["server_task_id"] = JSON.parse(storage.getItem('server_task_id'));
            curr_survey_data["step"] = step;

            jsonObj_old = jsonObj;
            $("#" + target_div + "").append(newdiv);

            read_dynamic_checksheet_checks(Show_class_Array, LL_class_Array, dependency_Array);

        }
        else if (form_flag == 13) {
            // bulk approval
            jsonObj_old = jsonObj;
            $("#container_div_bulk_approval").append(newdiv);


            $("#container_btn_div_bulk_aprvl").empty();
            var btn_str = '';
            if (buttons == "" || buttons == null || buttons == undefined) {
                var param_close = "myApp.closeModal('.popup-bulk-approval-chksht')";
                btn_str += '<div class="left"><a href="#" class="link" onclick="' + param_close + '">Cancel</a></div>';
                btn_str += '<div class="right"><a href="#" id="btn_approval_submit" class="link" onclick="submit_bulk_approval_checksheet();">Submit</a></div>';
            }
            else {
                var btnUTNS_Counter = 0;
                for (var k = 0; k < buttons.length; k++) {
                    var btn_action = buttons[k].action;
                    if (btn_action == "updatetasknsubmit" || btn_action == "reject") {
                        var btnName = buttons[k].name;
                        var btn_class = "";
                        if (buttons[k].class1 != undefined) {
                            var class_Array = buttons[k].class1;
                            btn_class = class_Array[0];
                            for (var c = 1; c < buttons[k].class1.length; c++) {
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

                        var status = buttons[k].status;
                        var dependency = buttons[k].dependency;

                        if (status == "" || status == null || status == undefined || status == "--- Select Status ---") {
                            status = "";
                        }

                        if (dependency == "checksheet") {
                            if (btn_action == "reject") {
                                var chksht_end_status = localStorage.getItem('bulk_approval_chksht_reject_status');
                            }
                            else {
                                var chksht_end_status = localStorage.getItem('bulk_approval_chksht_end_status');
                            }
                            var param = "submit_bulk_approval_checksheet('" + chksht_end_status + "')";
                        }
                        else {
                            if (dependency == 'button' && status == "") {
                                var param = 'alert1("Please define status or change dependency=button to submit bulk approval checksheet...")';
                            }
                            else {
                                var param = "submit_bulk_approval_checksheet('" + status + "')";
                            }
                        }

                        btn_str += '<div id="div_btnUTNS_' + btnUTNS_Counter + '" class="right ' + btn_class + '"><a class="link ' + btn_class + '" onclick="' + param + '" style="' + dis_style + '" >' + btnName + '</a></div>';

                        btnUTNS_Counter++;
                    }
                }
            }
            $("#container_btn_div_bulk_aprvl").append(btn_str);

        }
        // ////////////////////////////////////

        //---------show/hide checksheet control icon
        var c_is_icon_display = JSON.parse(storage.getItem('c_is_icon_display'));
        if (c_is_icon_display == "false") {
            $('.fa.form-ico').hide();
        }
        else {
            $('.fa.form-ico').show();
        }


        // show & bind onchange event on element used in type17 equation
        for (c = 0; c < Type17_class_Array.length; c++) {
            var type4_found = Type17_class_Array[c][0];
            var type17_box_classes = Type17_class_Array[c][1];
            var t_new_id = Type17_class_Array[c][2];
            var t_paramData = Type17_class_Array[c][3];
            var t_type17_dep_obj = Type17_class_Array[c][4];

            var paramData = [];
            paramData.push({
                'new_id': t_new_id,
                'miscData': t_paramData,
                'dependency': t_type17_dep_obj
            });

            var type17_dep_obj = []
            if (t_type17_dep_obj != "") {
                type17_dep_obj = JSON.parse(t_type17_dep_obj);
                if (type17_dep_obj.length > 0) {
                    auto_calculation_for_multiple_calc(Type17_class_Array);
                }
            }
            else {
                if (type4_found > 0) {
                    get_value_from_other_step(encodeURIComponent(JSON.stringify(paramData)));
                    var event_str = 'focusout';
                }
                else {
                    var event_str = 'input';
                }
                for (c1 = 0; c1 < type17_box_classes.length; c1++) {
                    var type17_box_class = type17_box_classes[c1];

                    $("." + type17_box_class + "").css("display", "block");

                    var number_box_id = $("." + type17_box_class + " :input").attr("id");
                    //var nobox_id = document.getElementById(number_box_id);
                    //if (nobox_id == '' || nobox_id == null || nobox_id == undefined) { }
                    //else {
                    //    nobox_id.addEventListener(event_str, function () {
                    //        get_value_from_other_step(encodeURIComponent(JSON.stringify(paramData)));
                    //    }, false);
                    //}
                    $('#' + number_box_id + '').on('input', { param: paramData }, function (event) {
                        let paramData = event.data.param;
                        get_value_from_other_step(encodeURIComponent(JSON.stringify(paramData)));
                    });
                }
            }
        }

        // show & bind onchange event on element used in advacned type17 equation
        var Type17_Adv_class_Array_New = [];
        for (ac = 0; ac < Type17_Adv_class_Array.length; ac++) {
            var t_class = Type17_Adv_class_Array[ac][0];
            var t_new_id = Type17_Adv_class_Array[ac][1];
            var t_eq_str = Type17_Adv_class_Array[ac][2];

            var paramData = [];
            paramData.push({
                'new_id': t_new_id,
                'eq_str': t_eq_str
            });

            var found = 0;
            for (acn = 0; acn < Type17_Adv_class_Array_New.length; acn++) {
                var tn_class = Type17_Adv_class_Array_New[acn].class_name;
                if (tn_class == t_class) {
                    found++;
                    break;
                }
            }

            if (found == 0) {
                Type17_Adv_class_Array_New.push({
                    'class_name': t_class,
                    'paramArray': paramData
                });
            }
            else {
                Type17_Adv_class_Array_New[acn].paramArray.push(paramData[0]);
            }
        }

        for (var ac = 0; ac < Type17_Adv_class_Array_New.length; ac++) {
            var t_class = Type17_Adv_class_Array_New[ac].class_name;
            var t_paramarray = Type17_Adv_class_Array_New[ac].paramArray;

            var number_box_id = $("." + t_class + " :input").attr("id");
            var find_inputcal_id = $("." + t_class + "").find("input[id^=txt_Calc_]").attr("id");

            if (find_inputcal_id == null || find_inputcal_id == undefined || find_inputcal_id == "") { }
            else {
                if (number_box_id == find_inputcal_id) {
                    var oninput_event = $("." + t_class + " :input").attr("oninput");
                    if (oninput_event == "" || oninput_event == null || oninput_event == undefined) {
                        $("." + t_class + " :input").attr("oninput", "extract_calculator_data('" + encodeURIComponent(JSON.stringify(t_paramarray)) + "')");
                    }
                    else {
                        //in case of multiple child [FT-21052025]
                        var input_event_str = oninput_event + ";extract_calculator_data('" + encodeURIComponent(JSON.stringify(t_paramarray)) + "')";
                        $("." + t_class + " :input").attr("oninput", input_event_str);
                    }
                }
            }

            var nobox_id = document.getElementById(number_box_id);
            if (nobox_id == "" || nobox_id == null || nobox_id == undefined) { }
            else {
                nobox_id.t_paramarray = t_paramarray;
                nobox_id.addEventListener("input", function () {
                    extract_calculator_data(encodeURIComponent(JSON.stringify(this.t_paramarray)));
                }, false);
            }
        }

        ////----photo upload using flow.js----////
        //for (u = 0; u < Type7_upload_Array.length; u++) {
        //    var t_new_id = Type7_upload_Array[u].new_id;
        //    var t_que_id = Type7_upload_Array[u].que_id;
        //    var t_web_ext = Type7_upload_Array[u].web_ext;
        //    init_upload_doc(t_new_id, t_que_id, t_web_ext);
        //}
        ////----photo upload using flow.js----////

        // show & bind onchange event on element used in type20 condition
        for (t = 0; t < Type20_class_Array.length; t++) {
            var type20_box_class = Type20_class_Array[t];

            var is_hide = $("." + type20_box_class + "").attr("is_hide");
            if (is_hide == "true") { }
            else {
                $("." + type20_box_class + "").css("display", "block");
            }

            var ele_type = $("." + type20_box_class + " :nth-child(2)").prop('tagName');
            if (ele_type == "INPUT") {
                var where_box_id = $("." + type20_box_class + " :input").attr("id");
                $("#" + where_box_id + "").attr("onchange", "$(this).attr('name', '0');");
            }
        }

        // binding datetimepicker
        for (d = 0; d < Type8_data_Array.length; d++) {
            var T_mode = Type8_data_Array[d].mode;
            var T_divId = Type8_data_Array[d].divId;
            var div = '#dtBox_' + T_divId + '';
            var p_class = '.group_' + T_divId + '';
            var val = $('#cal_' + T_divId + '').val();

            $('#cal_' + T_divId + '').on('change', function (e) {
                var cal_id = this.id;

                var trigger_ele_str = $("#" + cal_id + "").attr('trigger_ele');
                if (trigger_ele_str == '' || trigger_ele_str == null || trigger_ele_str == undefined) {
                    var trigger_ele_Array = [];
                }
                else {
                    var trigger_ele_Array = trigger_ele_str.split(",");
                }
                for (t = 0; t < trigger_ele_Array.length; t++) {
                    var trigger_ele = trigger_ele_Array[t];
                    var duration_type = $("#cal_" + trigger_ele + "").attr('duration_type');
                    var T_mode = $("#cal_" + trigger_ele + "").attr('data-field');
                    var ref_class = $("#cal_" + trigger_ele + "").attr('ref_class');
                    if (ref_class == '' || ref_class == null || ref_class == undefined) { }
                    else {
                        var dur_class = $("#cal_" + trigger_ele + "").attr('dur_class');

                        setTimeout(function (T_mode, trigger_ele, ref_class, dur_class, duration_type) {
                            set_end_date_by_duration(T_mode, trigger_ele, ref_class, dur_class, duration_type);
                        }, 300, T_mode, trigger_ele, ref_class, dur_class, duration_type)
                    }
                }
            });

            //var dateFormat = 'mm/dd/yyyy';
            //var timeFormat = localStorage.getItem("timeFormat");
            //var dateTimeFormat = localStorage.getItem("dateTimeFormat");

            var datetime_format = localStorage.getItem("dateFormat");
            var datetime_format_ary = datetime_format.split(" ");
            var time_format = datetime_format_ary[1];


            if (T_mode == 'datetime') {

                var today = new Date();
                //var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                //var monthNames = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];

                if (datetime_format.indexOf("dd-M-yyyy") > -1) {
                    var display_value = ('Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec');
                    var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                }
                else {
                    var display_value = ('01 02 03 04 05 06 07 08 09 10 11 12');
                    var monthNames = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
                }

                var currMonth = monthNames[today.getMonth()];

                //common fun for column_array as per company dateFormat in picker [FT-17042025]
                var column_array = get_column_array_for_type8_as_per_dateFormat(datetime_format, display_value);

                if (val == "" || val == null || val == undefined) {
                    var valueArray = [];
                }
                else {
                    if (datetime_format.indexOf("dd/mm/yyyy") > -1) {
                        var t_date_str1 = val.substring(0, 10);
                        var t_date_str2 = val.substring(10);
                        if (F7_device == 'ios') {
                            //date with (-) is invalid for ios so replaced it with "/" instead of "-" [FT - 01062024]
                            t_date_str1 = t_date_str1.split("/").reverse().join("/");
                        }
                        else {
                            t_date_str1 = t_date_str1.split("/").reverse().join("-");
                        }
                        val = t_date_str1 + t_date_str2;
                    }

                    var date = new Date(val);
                    var mm1 = date.getMonth() + 1;
                    var dd1 = date.getDate();
                    var yyyy1 = date.getFullYear();
                    var hour = date.getHours();
                    var min = date.getMinutes();
                    var second = date.getSeconds();

                    if (hour < 10) {
                        hour = "0" + hour;
                    }
                    if (min < 10) {
                        min = "0" + min;
                    }
                    if (second < 10) {
                        second = "0" + second;
                    }

                    //var start = val.lastIndexOf(" ");
                    //var time = val.substr(start, val.length);
                    //var start1 = time.indexOf(":");
                    //var hour = time.substr(1, start1 - 1);
                    //var min = time.substr(start1 + 1, time.length);

                    if (datetime_format.indexOf("dd/mm/yyyy") > -1) {
                        if (time_format == "HH:mm:ss") {
                            var valueArray = [dd1, (mm1 - 1), yyyy1, hour, min, second];
                        }
                        else {
                            var valueArray = [dd1, (mm1 - 1), yyyy1, hour, min];
                        }

                    }
                    else {
                        if (time_format == "HH:mm:ss") {
                            var valueArray = [(mm1 - 1), dd1, yyyy1, hour, min, second];
                        }
                        else {
                            var valueArray = [(mm1 - 1), dd1, yyyy1, hour, min];
                        }
                    }

                }

                var dtpicker_obj =
                {
                    input: '#cal_' + T_divId + '',
                    //container: div,  // inline date-time
                    //toolbar: false,  // close button display
                    rotateEffect: false,

                    //for current date time
                    //value: [today.getMonth(), today.getDate(), today.getFullYear(), today.getHours(), (today.getMinutes() < 10 ? '0' + today.getMinutes() : today.getMinutes())],
                    value: valueArray,


                    onChange: function (picker, values, displayValues) {
                        var daysInMonth = new Date(picker.value[2], picker.value[0] * 1 + 1, 0).getDate();
                        if (datetime_format.indexOf("dd/mm/yyyy") > -1) {
                            if (values[0] > daysInMonth) {
                                picker.cols[1].setValue(daysInMonth);
                            }
                        }
                        else {
                            if (values[1] > daysInMonth) {
                                picker.cols[1].setValue(daysInMonth);
                            }
                        }
                    },
                    formatValue: function (p, values, displayValues) {
                        if (displayValues == '') {
                            if (datetime_format.indexOf("dd/mm/yyyy") > -1) {
                                if (time_format == "HH:mm:ss") {
                                    var default_value = currMonth + '/' + values[0] + '/' + values[2] + ' ' + values[3] + ':' + values[4] + ':' + values[5];
                                }
                                else {
                                    var default_value = currMonth + '/' + values[0] + '/' + values[2] + ' ' + values[3] + ':' + values[4];
                                }
                            }
                            else {
                                if (time_format == "HH:mm:ss") {
                                    var default_value = currMonth + '/' + values[1] + '/' + values[2] + ' ' + values[3] + ':' + values[4] + ':' + values[5];
                                }
                                else {
                                    var default_value = currMonth + '/' + values[1] + '/' + values[2] + ' ' + values[3] + ':' + values[4];
                                }
                            }
                            var new_default_value = convert_datetime_by_format(default_value, 'datetime');
                            return new_default_value;
                        } else {
                            if (datetime_format.indexOf("dd/mm/yyyy") > -1) {
                                if (time_format == "HH:mm:ss") {
                                    var format_value = displayValues[1] + '/' + values[0] + '/' + values[2] + ' ' + values[3] + ':' + values[4] + ':' + values[5];
                                }
                                else {
                                    var format_value = displayValues[1] + '/' + values[0] + '/' + values[2] + ' ' + values[3] + ':' + values[4];
                                }
                            }
                            else {
                                if (time_format == "HH:mm:ss") {
                                    var format_value = displayValues[0] + '/' + values[1] + '/' + values[2] + ' ' + values[3] + ':' + values[4] + ':' + values[5];
                                }
                                else {
                                    var format_value = displayValues[0] + '/' + values[1] + '/' + values[2] + ' ' + values[3] + ':' + values[4];
                                }
                            }
                            var new_format_value = convert_datetime_by_format(format_value, 'datetime');
                            return new_format_value;
                        }
                    },
                    cols: column_array
                };

                if (val == "" || val == null || val == undefined) {
                    delete dtpicker_obj['value'];  // remove value key if cal value is blank (no default or answer value)
                }
                myApp.picker(dtpicker_obj);

            }
            else if (T_mode == 'date') {
                var date_format = datetime_format_ary[0];
                myApp.calendar({
                    input: '#cal_' + T_divId + '',
                    //dateFormat: 'mm/dd/yyyy'
                    dateFormat: date_format
                });
            }
            else {
                // time
                if (val == '' || val == null || val == undefined) {
                    val = '';
                }
                var start1 = val.indexOf(":");
                var hour = val.substr(0, start1);
                var min = val.substr(start1 + 1, val.length);
                if (hour == "" || min == "") {
                    myApp.picker({
                        input: '#cal_' + T_divId + '',
                        rotateEffect: true,
                        formatValue: function (p, values, displayValues) {
                            return values[0] + ':' + values[1];
                        },
                        cols: [
                            {
                                textAlign: 'left',
                                values: ('00 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16 17 18 19 20 21 22 23').split(' ')
                            },
                            {
                                divider: true,
                                content: ':'
                            },
                            {
                                values: ('00 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36 37 38 39 40 41 42 43 44 45 46 47 48 49 50 51 52 53 54 55 56 57 58 59').split(' ')
                            },
                        ]
                    });
                }
                else {
                    myApp.picker({
                        input: '#cal_' + T_divId + '',
                        rotateEffect: false,
                        formatValue: function (p, values, displayValues) {
                            return values[0] + ':' + values[1];
                        },

                        // for predefined time
                        value: [hour, min],
                        cols: [
                            {
                                textAlign: 'left',
                                values: ('00 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16 17 18 19 20 21 22 23').split(' ')
                            },
                            {
                                divider: true,
                                content: ':'
                            },
                            {
                                values: ('00 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36 37 38 39 40 41 42 43 44 45 46 47 48 49 50 51 52 53 54 55 56 57 58 59').split(' ')
                            },
                        ]
                    });
                }

            }
        }

        // Type32 get email sms
        if (Type32_Array.length > 0) {
            get_email_sms(Type32_Array[0], Type32_Array[1], Type32_Array[2]);
        }

        // autofull type20 dropdown on page load automatically
        if (Type20_AutoFill_DDL_Array.length > 0) {
            for (z = 0; z < Type20_AutoFill_DDL_Array.length; z++) {
                var t_new_id = Type20_AutoFill_DDL_Array[z].new_id;
                $("#ddl_search_type20_" + t_new_id + "").prop("disabled", true);
            }

            if (form_flag == 12) {
                var group_task_array = JSON.parse(localStorage.getItem("group_task_array"));
                var data_json = JSON.parse(storage.getItem('list_json'));
                var list_data = JSON.parse(data_json);
                var group_task_steps = list_data[0].group_task_steps;
                var step = step_Array[step_Array.length - 1];
                var check = group_task_steps.includes(step.toString());
                if (check == true) {
                    // single task only
                    autofill_type20_dropdown_onload(Type20_AutoFill_DDL_Array);
                }
                else {
                    // multiple tasks
                    if (target_index == (group_task_array.length - 1)) {
                        autofill_type20_dropdown_onload(Type20_AutoFill_DDL_Array);
                    }
                }
            }
            else if (form_flag == 14) {
                // invoice task create (searchable will not be initiated as all searchable must be filled with default value)
                for (z = 0; z < Type20_AutoFill_DDL_Array.length; z++) {
                    var value_new = Type20_AutoFill_DDL_Array[z].value_new;
                    var t_new_id = Type20_AutoFill_DDL_Array[z].new_id;
                    document.getElementById("ddl_search_type20_" + t_new_id + "").options.length = 1;

                    var default_value = value_new[0].default_value;
                    if (default_value == "" || default_value == null || default_value == undefined) {
                        var push_data_str = JSON.stringify(value_new[0].push_data);
                        var qs_array = pass_required_values_to_push_array(push_data_str);
                        value_new[0].push_data = JSON.parse(qs_array[0]);
                        var push_data = value_new[0].push_data;

                        alert("Default value is not configured in searchable for invoice task checksheet!")
                    }
                    else {
                        var default_val = default_value[0];
                        var value_type = default_val.substring(2, 1);
                        if (value_type == "#") {
                            var sub_get_value = default_val.substring(2, default_val.length - 2);
                            var search_val = curr_all_data_20[sub_get_value];

                            var option = "<option selected='selected' value='1' name='" + search_val + "'>" + search_val + "</option>";
                        }
                    }

                    $("#ddl_search_type20_" + t_new_id + "").append(option);
                    $("#ddl_search_type20_" + t_new_id + "").attr('name', '1');
                }
                Type20_AutoFill_DDL_Array = [];

                validate_invoice_task_form();
            }
            else {
                autofill_type20_dropdown_onload(Type20_AutoFill_DDL_Array);
            }
        } else {
            loading_hide();
        }

        // open popup for type30 dropdown 19012022
        $("select[id^='dynddl_']").on('mousedown', function (e) {
            e.preventDefault();

            myApp.popup('.popup-type30-dropdown');
            $('#type30_ddl_list').empty();

            var id = $(this).attr("id");
            id = id.replace("dynddl_", "");
            get_dynddl_data_onclick(id);
        });

        setTimeout(function () {

            // autofill type30 dropdown on page load automatically
            if (check_type == '4456') {
                if (Type30_dynddl_Array.length > 0) {
                    Type30_dynddl_Array_Global = Type30_dynddl_Array;
                    localStorage.setItem('Type30_dynddl_Array', JSON.stringify(Type30_dynddl_Array));
                }
            }
            else {
                if (Type30_dynddl_Array.length > 0) {

                    Type30_dynddl_Array_Global = Type30_dynddl_Array;

                    var hidden_Type30_Array = [];

                    for (x = 0; x < Type30_dynddl_Array.length; x++) {
                        var t_new_id = Type30_dynddl_Array[x].new_id;

                        if ($("#dynddl_" + t_new_id + "").is(":hidden")) {
                            hidden_Type30_Array.push(Type30_dynddl_Array[x]);
                        }

                        if ($("#div_dynddl_" + t_new_id + "").hasClass("force_hide")) { }
                        else {
                            var RowQueryWhere = Type30_dynddl_Array[x].RowQueryWhere;
                            if (RowQueryWhere == '' || RowQueryWhere == null || RowQueryWhere == undefined) {
                                // autofill type30 dropdown on page load automatically
                            }
                            else {
                                // bind type30 call [with class value required]
                                for (e = 0; e < RowQueryWhere.length; e++) {
                                    var get_value = RowQueryWhere[e]['value'];
                                    if (get_value == '' || get_value == null || get_value == undefined) { }
                                    else {
                                        var value_type = get_value.substring(2, 1);
                                        var sub_get_value = get_value.substring(2, get_value.length - 2);
                                        if (value_type == "@") {
                                            var where_box_id = $("." + sub_get_value + " :input[type=number]").attr("id");
                                            if (where_box_id == '' || where_box_id == null || where_box_id == undefined) {
                                                // check for text box
                                                where_box_id = $("." + sub_get_value + " :input[type=text]").attr("id");
                                                if (where_box_id == '' || where_box_id == null || where_box_id == undefined) {
                                                    // possible dropdown
                                                    where_box_id = $("." + sub_get_value + " select").attr("id");
                                                    if (where_box_id == '' || where_box_id == null || where_box_id == undefined) { }
                                                    else {
                                                        //var onchange_str = $("#" + where_box_id + "").attr("onchange");
                                                        //if (onchange_str == "" || onchange_str == null || onchange_str == undefined) {
                                                        //    $("#" + where_box_id + "").attr("onchange", "get_dynddl_data_onclick('" + t_new_id + "','" + where_box_id + "');");
                                                        //}

                                                        // add child elements to parent attribute 20012022
                                                        var childArray = $("#" + where_box_id + "").attr("childArray");
                                                        if (childArray == "" || childArray == null || childArray == undefined) {
                                                            childArray = [];
                                                        }
                                                        else {
                                                            childArray = JSON.parse(childArray);
                                                        }

                                                        childArray.push(t_new_id);
                                                        $("#" + where_box_id + "").attr("childArray", JSON.stringify(childArray));
                                                    }
                                                }
                                                else {
                                                    // text box found
                                                    $("#" + where_box_id + "").attr("onfocusout", "get_dynddl_data_onclick('" + t_new_id + "');");
                                                }
                                            }
                                            else {
                                                // numeric found
                                                $("#" + where_box_id + "").attr("onfocusout", "get_dynddl_data_onclick('" + t_new_id + "');");
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // 10955 = OCR checksheet ATC testing /  10498 = OCR checksheet ATC Live
                    if (check_type == '10955' || check_type == "10498") {
                        // don't call for type30 in page load though it is hidden 21012022

                        Type30_dynddl_Array_Global = [];
                        localStorage.setItem('Type30_dynddl_Array', JSON.stringify(Type30_dynddl_Array_Global));
                    }
                    else {
                        // check and highlight car question - atc 03032021
                        if (hidden_Type30_Array.length > 0) {
                            Type30_dynddl_Array_Global = hidden_Type30_Array;
                        }
                        localStorage.setItem('Type30_dynddl_Array', JSON.stringify(Type30_dynddl_Array_Global));

                        check_n_call_type30_service();
                    }

                }
            }





            check_set_end_date_by_duration();
        }, 2000);

        // Automatically fill site latlong in correspondent numeric box
        for (g = 0; g < LL_class_Array.length; g++) {
            var type = LL_class_Array[g].type;
            var item_id = LL_class_Array[g].item_id;
            var S_lat_box_class = LL_class_Array[g].lat_cls;
            var S_long_box_class = LL_class_Array[g].long_cls;
            var S_map_view = LL_class_Array[g].map_view;
            if (type == 'site') {
                get_site_latlong_box_classes(item_id, S_lat_box_class, S_long_box_class);
            }
            else {
                get_latlong_box_classes(item_id, S_lat_box_class, S_long_box_class, S_map_view, form_flag);
            }
        }

        // after binding type8 and type20 create task
        if (form_flag == 6) {

            // show elements while reading blank checksheet
            for (f = 0; f < Show_class_Array.length; f++) {
                var Show_class = Show_class_Array[f];
                if (Show_class == '' || Show_class == null || Show_class == undefined) { }
                else {
                    var has_is_hide = $("." + Show_class).hasClass("st_hdn");
                    if (has_is_hide == false) {
                        $("." + Show_class + "").css("display", "block");
                    }
                }
            }

            setTimeout(function () {
                for (d = 0; d < dependency_Array.length; d++) {
                    var t_dep_type = dependency_Array[d][0].dep_type;
                    var paramData = JSON.stringify(dependency_Array[d]);
                    if (t_dep_type == 1) {
                        show_hide_Element(encodeURIComponent(paramData));
                    }
                    else if (t_dep_type == 2) {
                        set_global_show_hide_class(encodeURIComponent(paramData));
                    }
                    else if (t_dep_type == 4) {
                        show_hide_element_by_match_class_element(encodeURIComponent(paramData));
                    }
                }
            }, 100);

            // validate_and_submit_surveydata(1, 6, jsonObj_old);
            if (auto_fill_task == 'true') {

                // disabled create task button in case auto fill task is true
                $("#container_btn_div a.link").attr("disabled", "disabled");
                setTimeout(function () {
                    $("#container_btn_div a.link").removeAttr("disabled");
                }, 10000);

                if (Type20_AutoFill_DDL_Array.length == 0) {
                    setTimeout(function () {
                        validate_and_submit_surveydata(1, 6, jsonObj_old);
                    }, 1000);
                } else {
                    auto_create_task_after_type20_bind();
                }
            }
        }

        if (form_flag == 0 || form_flag == 6) {
            // opening collapsible step automatically
            if (collapse_id_Array.length > 0) {
                var clps_id = collapse_id_Array[0];
                collapse_id_Array.shift();

                var item = $('#div_step_Col_' + clps_id + ' > div > ul > li');
                myApp.accordionOpen(item);
                toggle_collapse_div(clps_id);
            }

            $('.page-content').animate({
                scrollTop: 0
            }, 10);
        }

        //-----disable normal photo for metercrop in pageload [12022021]
        if (Type7_old_photo_class_Array.length > 0) {
            for (u = 0; u < Type7_old_photo_class_Array.length; u++) {
                var t_old_photo_class = Type7_old_photo_class_Array[u];
                if (t_old_photo_class == "" || t_old_photo_class == null || t_old_photo_class == undefined) { }
                else {
                    var param_click = $("." + t_old_photo_class + " img[id^=cbtn_]").attr("onclick");
                    $("." + t_old_photo_class + " img[id^=cbtn_]").attr('click_action', param_click);
                    $("." + t_old_photo_class + " img[id^=cbtn_]").attr('old_photo_type', "original_photo");

                    $("." + t_old_photo_class + " img[id^=cbtn_]").attr("onclick", "");
                }
                Type7_old_photo_class_Array.splice(u, 1);
            }
        }

        // check and highlight car question - atc 03032021
        if (Car_que_id_Array.length > 0) {
            highlight_car_que_group(Car_que_id_Array);
        }

        if (glob_add_cust_from_search == "true" && form_flag == 7) {
            //----add new customer from search in type20 for ATC [atc.bb - 05052021]
            loading();
            setTimeout(function () {
                $("#btn_type20_cust_add").trigger('click');
            }, 2000);
        }

        if (weather_cntrl_found > 0) {

            var user_track_array = JSON.parse(storage.getItem('user_track_details'));
            var user_lat = user_track_array[0].user_lat;
            var user_long = user_track_array[0].user_long;

            get_weather_detail(user_lat, user_long);
        }

        for (let l = 0; l < Type40_ll_Array.length; l++) {
            let ll_new_id = Type40_ll_Array[l];
            init_livelink(ll_new_id);
        }

        //====new devlopment for control wise comments for filled form - web app only [FT - 29042024]
        if (form_flag == 0 || form_flag == 2 || form_flag == 3) {
            show_control_wise_comments_for_filled_form(curr_clps_new_id, check_type);
        }
    }
    catch (e) {
        alert1(e + ': type = ' + jsonObj[i].type + ' of index = ' + i + ' read_dynamic_checksheet_main_POST');
        loading_hide();
    }
}

function auto_create_task_after_type20_bind() {
    //loading();
    if (Type20_AutoFill_DDL_Array.length == 0) {
        validate_and_submit_surveydata(1, 6, jsonObj_old);
    } else {
        setTimeout(function () {
            auto_create_task_after_type20_bind();
        }, 2000);
    }
}

var btnNAS_counter = 0; // NoAuto Save 
function read_dynamic_checksheet_buttons(buttons, Show_class_Array, LL_class_Array, dependency_Array, btn_check_type) {
    try {
        enable_back = 0; // disable back button
        btnJsonObj = [];
        var btnSN_counter = 0; // Save And Next
        var btnGTNCC_counter = 0; // Save And Next (Go To And Change Color)
        var btnGTWS_counter = 0; // Go To Without Save
        var btnSNOB_counter = 0; // Save And Next Or Back
        var btnSE_Counter = 0; // Save And Exit
        var btnSO_Counter = 0; // Save Only     
        var btnCNS_Counter = 0; // Check And Submit
        var btnUTNS_Counter = 0; // Update Task and Submit
        var btnUTNRe_Counter = 0; // Update Task and Redirect
        var btnUTNAOTF_Counter = 0; // Update Task and Auto Open Task Form
        var btnReject_Counter = 0; // Reject Task
        btnNAS_counter = 0; // NoAuto Save

        newdiv = "";
        btnJsonObj = buttons;

        var data_json = JSON.parse(storage.getItem('list_json'));
        if (data_json == "" || data_json == null || data_json == undefined) { }
        else {
            var list_data = JSON.parse(data_json);
            var task_button_text = list_data[0].task_button_text;
            if (task_button_text == '' || task_button_text == null || task_button_text == undefined) {
                task_button_text = 'Create Task';
            }
            var param_task = "validate_and_submit_surveydata(1, 6, 'data')";
            newdiv += '<div class="right normal_create_task" style="display: none"><a class="link" onclick="' + param_task + '">' + task_button_text + '</a></div>';
        }

        //alert1(JSON.stringify(btnJsonObj))
        // define buttons

        for (j = 0; j < btnJsonObj.length; j++) {

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

            // save current step and goto next step
            if (btnJsonObj[j].action == 'goto') {
                newdiv += '<div id="div_btnSN_' + btnSN_counter + '" class="right ' + btn_class + '"><a class="link ' + btn_class + '" onclick="goto_on_click(' + subaction + ')" style="' + dis_style + '">' + btnName + '</a></div>';
                btnSN_counter++;
            }

            // save current step and change color of current step
            if (btnJsonObj[j].action == 'gotonchangecolor') {
                var updatebtnindex = btnJsonObj[j].updatebtnindex;
                var updatestep = btnJsonObj[j].updatestep;

                newdiv += '<div id="div_btnGTNCC_' + btnGTNCC_counter + '" class="right ' + btn_class + '"><a class="link ' + btn_class + '" onclick="gotonchangecolor_on_click(' + subaction + ', ' + updatebtnindex + ', ' + updatestep + ')" style="' + dis_style + '">' + btnName + '</a></div>';
                btnGTNCC_counter++;
            }

            // direction is not defined, dependent on step array (if array size
            // == 1 then act as back otherwise goto)
            else if (btnJsonObj[j].action == 'goto_or_back') {
                newdiv += '<div id="div_btnSNOB_' + btnSNOB_counter + '" class="right ' + btn_class + '"><a class="link ' + btn_class + '" onclick="goto_or_back_on_click(' + subaction + ')" style="' + dis_style + '" >' + btnName + '</a></div>';
                btnSNOB_counter++;
            }

            //    // goto back step without saving current step
            else if (btnJsonObj[j].action == 'back') {
                enable_back = 1; // 1= enable back button
            }

            // check all step status and submit
            else if (btnJsonObj[j].action == 'checknsubmit') {
                var updatestep = btnJsonObj[j].updatestep;

                newdiv += '<div id="div_btnCNS_' + btnCNS_Counter + '" class="right ' + btn_class + '"><a class="link ' + btn_class + '" onclick="checknsubmit_on_click(' + subaction + ', ' + updatestep + ')" style="' + dis_style + '" >' + btnName + '</a></div>';
                btnCNS_Counter++;
            }

            // Update task status and submit
            else if (btnJsonObj[j].action == 'updatetasknsubmit') {

                var shortest_path = btnJsonObj[j].shortest_path;
                if (shortest_path == '' || shortest_path == null || shortest_path == undefined) {
                    var shortest_path = "";
                } else {
                    var shortest_path = encodeURIComponent(JSON.stringify(shortest_path));
                }

                var status = btnJsonObj[j].status;
                var dependency = btnJsonObj[j].dependency;
                var trip = btnJsonObj[j].trip;

                var stillviolation_event = btnJsonObj[j].stillviolation_event;
                if (stillviolation_event == "" || stillviolation_event == null || stillviolation_event == undefined) {
                    stillviolation_event = "";
                }

                var param = "updatetasknsubmit_on_click('" + subaction + "', '" + shortest_path + "','" + status + "', '" + dependency + "', '" + trip + "', '" + stillviolation_event + "', '" + btn_check_type + "')";

                newdiv += '<div id="div_btnUTNS_' + btnUTNS_Counter + '" class="right ' + btn_class + '"><a class="link ' + btn_class + '" onclick="' + param + '" style="' + dis_style + '" >' + btnName + '</a></div>';
                btnUTNS_Counter++;
            }

            // Update task status and redirect
            else if (btnJsonObj[j].action == 'updatetasknredirect') {

                var shortest_path = btnJsonObj[j].shortest_path;
                if (shortest_path == '' || shortest_path == null || shortest_path == undefined) {
                    var shortest_path = "";
                } else {
                    var shortest_path = encodeURIComponent(JSON.stringify(shortest_path));
                }

                var status = btnJsonObj[j].status;
                var dependency = btnJsonObj[j].dependency;
                var trip = btnJsonObj[j].trip;

                var stillviolation_event = btnJsonObj[j].stillviolation_event;
                if (stillviolation_event == "" || stillviolation_event == null || stillviolation_event == undefined) {
                    stillviolation_event = "";
                }

                var param = "updatetasknredirect_on_click('" + subaction + "', '" + shortest_path + "','" + status + "', '" + dependency + "', '" + trip + "', '" + stillviolation_event + "')";

                newdiv += '<div id="div_btnUTNRe_' + btnUTNRe_Counter + '" class="right ' + btn_class + '"><a class="link ' + btn_class + '" onclick="' + param + '" style="' + dis_style + '" >' + btnName + '</a></div>';
                btnUTNRe_Counter++;
            }

            // Update task status and redirect
            else if (btnJsonObj[j].action == 'updatetasknautoopentaskform') {

                var shortest_path = btnJsonObj[j].shortest_path;
                if (shortest_path == '' || shortest_path == null || shortest_path == undefined) {
                    var shortest_path = "";
                } else {
                    var shortest_path = encodeURIComponent(JSON.stringify(shortest_path));
                }

                var status = btnJsonObj[j].status;
                var dependency = btnJsonObj[j].dependency;
                var trip = btnJsonObj[j].trip;

                var stillviolation_event = btnJsonObj[j].stillviolation_event;
                if (stillviolation_event == "" || stillviolation_event == null || stillviolation_event == undefined) {
                    stillviolation_event = "";
                }

                var param = "updatetasknautoopentaskform_on_click('" + subaction + "', '" + shortest_path + "','" + status + "', '" + dependency + "', '" + trip + "', '" + stillviolation_event + "')";

                newdiv += '<div id="div_btnUTNAOTF' + btnUTNAOTF_Counter + '" class="right ' + btn_class + '"><a class="link ' + btn_class + '" onclick="' + param + '" style="' + dis_style + '" >' + btnName + '</a></div>';
                btnUTNAOTF_Counter++;
            }

            // save current step and goto sitelist
            else if (btnJsonObj[j].action == 'savenexit') {
                newdiv += '<div id="div_btnSE_' + btnSE_Counter + '" class="right ' + btn_class + '"><a class="link ' + btn_class + '" onclick="savenexit_on_click(' + subaction + ')" style="' + dis_style + '" >' + btnName + '</a></div>';
                btnSE_Counter++;
            }

            // save current step only no forward backward or exit
            else if (btnJsonObj[j].action == 'saveonly') {
                newdiv += '<div id="div_btnSO_' + btnSO_Counter + '" class="right ' + btn_class + '"><a class="link ' + btn_class + '" onclick="saveonly_on_click(' + subaction + ')" style="' + dis_style + '" >' + btnName + '</a></div>';
                btnSO_Counter++;
            }

            // act as goto but without checking validation
            else if (btnJsonObj[j].action == 'gotowithoutsave') {
                newdiv += '<div id="div_btnGTWS_' + btnGTWS_counter + '" class="right ' + btn_class + '"><a class="link ' + btn_class + '" onclick="gotowithoutsave_on_click(' + subaction + ')" style="' + dis_style + '" >' + btnName + '</a></div>';
                btnGTWS_counter++;
            }

            // save current step and change status to reject status of current
            // checksheet
            else if (btnJsonObj[j].action == 'reject') {
                newdiv += '<div id="div_btnReject_' + btnReject_Counter + '" class="right ' + btn_class + '"><a class="link ' + btn_class + '" onclick="reject_on_click(' + subaction + ')" style="' + dis_style + '" >' + btnName + '</a></div>';
                btnReject_Counter++;
            }

            // Create task / Create and Refresh Task
            else if (btnJsonObj[j].action == 'create' || btnJsonObj[j].action == 'createandrefresh') {
                var status = btnJsonObj[j].status;
                var redirect = btnJsonObj[j].redirect;

                var stillviolation_event = btnJsonObj[j].stillviolation_event;
                if (stillviolation_event == "" || stillviolation_event == null || stillviolation_event == undefined) {
                    stillviolation_event = "";
                }

                var param = "create_task_on_click('" + status + "','" + redirect + "', '" + stillviolation_event + "')";
                newdiv += '<div class="right ' + btn_class + '"><a class="link ' + btn_class + '" onclick="' + param + '" style="' + dis_style + '" >' + btnName + '</a></div>';
            }

            else if (btnJsonObj[j].action == 'noautosave') {
                newdiv += '<div id="div_btnNAS_' + btnNAS_counter + '" class="right ' + btn_class + '" style="display:none"><a class="link ' + btn_class + '" onclick="reject_on_click(' + subaction + ')" style="display:none">' + btnName + '</a></div>';
                btnNAS_counter++;
            }

            // else if (btnJsonObj[j].action == 'exit') {
            // var btnName = btnJsonObj[j].name;
            // var subaction = parseInt(btnJsonObj[j].subaction);
            // newdiv += '<div id="div_btnExit_' + btnExit_Counter
            // + '" style="padding:10px"><input type="button" value="'
            // + btnName + '" onclick="exit_on_click(' + subaction
            // + ')" /></div>';
            // btnExit_Counter++;
            // }
        }
        //alert1("newdiv" + newdiv);

        /////shortcut buttons for checkheet form
        var data_json = JSON.parse(storage.getItem('list_json'));
        if (data_json == "" || data_json == null || data_json == undefined) {
            // very first time create task via notification (without clicking any module)
            var buttons = "";
            var task_progress = "";
        }
        else {
            var list_data = JSON.parse(data_json);
            var buttons = list_data[0].buttons;
            var task_progress = list_data[0].task_progress;
        }
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

            var btn_len = buttons.length;
            var btn_count = 0;
            var param_btn = '';
            for (b = 0; b < btn_len; b++) {
                var enabled = false;
                var btn_checkssheetid = buttons[b].checksheet_id;
                var btn_status = buttons[b].status;
                var placement = buttons[b].placement;
                if (placement == 'form' || placement == 'all') {
                    var view_dependancy = buttons[b].view_dependancy;
                    if (view_dependancy == 'always') { enabled = true; }
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
                        var submit_message = buttons[b].submit_message;
                        var param_btn = "update_task_by_shortcut_button('" + btn_checkssheetid + "','" + btn_status + "', '" + siteid + "', '" + tid + "', '" + start_status + "','" + wayflow + "', '" + wayflow_name + "', '" + sitename + "', '" + server_task_id + "', '" + site_lat + "', '" + site_long + "', '" + survey_date + "', '" + ser_milli + "', '" + submit_message + "')";
                        btn_count++;

                        var type20_columndata = JSON.parse(storage.getItem('type20_columndata'));
                        if (type20_columndata == '' || type20_columndata == null || type20_columndata == undefined) {
                            type20_columndata = [];
                        }
                        newdiv += '<input type="hidden" id="lst_sys_var_' + server_task_id + '" value="' + encodeURIComponent(JSON.stringify(type20_columndata)) + '">'
                        if (btn_checkssheetid == 0) {
                            var sb_icon = "fa-paper-plane";
                        }
                        else {
                            var sb_icon = "fa-share-square-o";
                        }

                        newdiv += '<div style="text-align: center;"><i class="fa ' + sb_icon + '" style="font-size: 20px;display: inline-block; color: #fff !important;vertical-align: middle;"></i>';
                        newdiv += '<a class="link" onclick="' + param_btn + '" style="display: inline-block;">' + buttons[b].name + '</a></div>';
                    }
                }
            }
        }
        ///////////

        if (btnJsonObj.length == 0) {
            // customer form form flag 7
        }
        else {

            let control_count = $(".cntrl_main_div").length;
            if (control_count == 1) {
                // ATC 1st step case - all buttons in 1st step - mk - 12092024
                $("#container_div").append(newdiv);
                $(".cntrl_main_div").css("margin-bottom", "10px");
                $("#container_div .link").removeClass("link").addClass("button button-fill button-round");
                $("#container_div .button.button-fill.button-round").css("margin", "0px 10px 10px 10px");
            }
            else {
                // normal form
                $("#container_btn_div").empty();
                if (task_progress == 'true' || task_progress == '' || task_progress == null || task_progress == undefined) {
                    var pro_str = '<a class="link btn_progress" onclick="show_checksheet_progress_popup()">PROGRESS</a>';
                    $("#container_btn_div").append('<div class="left">' + pro_str + '</div>' + newdiv);
                }
                else {
                    $("#container_btn_div").append(newdiv);
                    var btn_cnt = $("#container_btn_div a:visible").length;
                    if (task_progress == 'false' && btn_cnt == 1) {
                        $("#container_btn_div").css("display", "block");
                        $("#container_btn_div .right").css("float", "right");
                    }
                    else {
                        var btn_width = parseFloat(100 / btn_cnt) + '%';
                        $("#container_btn_div div").css({
                            'width': btn_width
                        });
                    }
                }
            }
        }

        try {
            myApp.setProgressbar('#chk_progress', chk_progress_data[0].progress);

            var site_name = JSON.parse(storage.getItem('sitename'));
            if (site_name == '' || site_name == null || site_name == undefined) {
                site_name = 'N/A';
            }
            $('#lbl_prg_per').text(chk_progress_data[0].progress + '%');
            $('#lbl_prg_flow').text(chk_progress_data[0].flow);
            $('#lbl_prg_site').text(site_name);
            $('#lbl_prg_chk').text(chk_progress_data[0].checksheet);
            $('#lbl_prg_step').text(chk_progress_data[0].step);
            $('#lbl_prg_curr_step').text(chk_progress_data[0].curr_step);
            $('#lbl_prg_com_step').text(chk_progress_data[0].com_step);
            $('#lbl_prg_tot_step').text(chk_progress_data[0].tot_step);
        } catch (e) { }

        read_dynamic_checksheet_checks(Show_class_Array, LL_class_Array,
            dependency_Array);
    } catch (e) {
        // TODO: handle exception
        alert1(e + "_read_dynamic_checksheet_buttons()");
    }
}

function read_dynamic_checksheet_checks(Show_class_Array, LL_class_Array,
    dependency_Array) {
    try {// retrieve last photo when crash in camera 7,9,11
        var crash_status = JSON.parse(storage.getItem('crash_status'));
        if (crash_status == null || crash_status == undefined
            || crash_status == '') {
            crash_status = 0;
        }
        if (crash_status == 1) {
            // application has been crashed
            get_last_photo_path();
        } else {
            storage.setItem('crash_status', JSON.stringify('0'));
        }

        // show elements while reading blank checksheet
        for (f = 0; f < Show_class_Array.length; f++) {
            var Show_class = Show_class_Array[f];
            if (Show_class == '' || Show_class == null || Show_class == undefined) { }
            else {
                var has_is_hide = $("." + Show_class).hasClass("st_hdn");
                if (has_is_hide == false) {
                    $("." + Show_class + "").css("display", "block");
                }
            }
        }

        // automatically calling for hide/show questions elements (classes used
        // in dependency)
        //var step = curr_survey_data["step"];
        //if (step != 1) {

        setTimeout(function () {
            for (d = 0; d < dependency_Array.length; d++) {
                var t_dep_type = dependency_Array[d][0].dep_type;
                var paramData = JSON.stringify(dependency_Array[d]);
                if (t_dep_type == 1) {
                    show_hide_Element(encodeURIComponent(paramData));
                }
                else if (t_dep_type == 2) {
                    set_global_show_hide_class(encodeURIComponent(paramData));
                }
                else if (t_dep_type == 4) {
                    show_hide_element_by_match_class_element(encodeURIComponent(paramData));
                }
            }
        }, 100)
        //}

        // Automatically fill site latlong in correspondent numeric box
        for (g = 0; g < LL_class_Array.length; g++) {
            var type = LL_class_Array[g].type;
            var item_id = LL_class_Array[g].item_id;
            var S_lat_box_class = LL_class_Array[g].lat_cls;
            var S_long_box_class = LL_class_Array[g].long_cls;
            var S_map_view = LL_class_Array[g].map_view;
            if (type == 'site') {
                get_site_latlong_box_classes(item_id, S_lat_box_class, S_long_box_class);
            }
            else {
                get_latlong_box_classes(item_id, S_lat_box_class, S_long_box_class, S_map_view, form_flag);
            }
        }

        // show dep_type=2 elements
        show_hide_element_by_global_class();

        // task dependency 14092020
        var task_Dependency_str = localStorage.getItem('task_Dependency');
        if (task_Dependency_str == '' || task_Dependency_str == null || task_Dependency_str == undefined) { }
        else {
            var task_Dependency = JSON.parse(task_Dependency_str);
            if (task_Dependency.length > 0) {
                var paramData = JSON.stringify(task_Dependency);
                if (task_Dependency[0].dep_type == 0) {
                    change_validation_by_dep_type_0(encodeURIComponent(paramData));
                } else if (task_Dependency[0].dep_type == 1) {
                    show_hide_Element(encodeURIComponent(paramData));
                } else if (task_Dependency[0].dep_type == 2) {
                    set_global_show_hide_class(encodeURIComponent(paramData));
                }
            }
        }

        // bind keyup event for invoice numeric and text search box - type19
        $('#inv_item_name_Search_0').keyup(
            function (e) {
                var temp_btnInv_Counter = 0;
                get_product_list(e.keyCode, temp_btnInv_Counter,
                    "#div_item_Bucket_0");
            });

        $("#inv_item_code_Search_0").on('input', function (e) {
            var temp_btnInv_Counter = 0;
            get_product_list(0, temp_btnInv_Counter, "#div_item_Bucket_0");
        });

        $("#inv_item_code_Search_0").on('focusout', function (e) {
            var temp_btnInv_Counter = 0;
            get_product_list(13, temp_btnInv_Counter, "#div_item_Bucket_0");
        });

        enable_back_button();

    } catch (e) {
        // TODO: handle exception
        alert1(e + "_read_dynamic_checksheet_checks()");
    }
}



// check and set end date by adding duration days
function check_set_end_date_by_duration() {
    try {
        var Cal_Array = $("input[id^='cal']:visible");
        for (d = 0; d < Cal_Array.length; d++) {
            var cal_id = Cal_Array[d].id;
            var ref_class = $("#" + cal_id + "").attr('ref_class');
            if (ref_class == '' || ref_class == null || ref_class == undefined) { }
            else {
                var T_divId = cal_id.replace("cal_", "");
                //$('.' + ref_class + '').show();

                // do not show is_hide - true elements - mk - 26032025
                $('.' + ref_class + ':not([is_hide="true"]').show();

                var trigger_ele_str = $('.' + ref_class + ' input').attr('trigger_ele');
                if (trigger_ele_str == '' || trigger_ele_str == null || trigger_ele_str == undefined) {
                    var trigger_ele_Array = [];
                }
                else {
                    var trigger_ele_Array = trigger_ele_str.split(",");
                }
                trigger_ele_Array.push(T_divId);
                $('.' + ref_class + ' input').attr('trigger_ele', trigger_ele_Array.toString());

                var dur_class = $("#" + cal_id + "").attr('dur_class');
                var T_mode = $("#" + cal_id + "").attr('data-field');
                var duration_type = $("#" + cal_id + "").attr('duration_type');

                if (dur_class == "" || dur_class == null || dur_class == undefined) {
                    dur_class = "";

                    // trigger from end date static configured duration
                }
                else {
                    // trigger from duration box (numeric)
                    var where_box_id = $("." + dur_class + " :input").attr("id");
                    var param = "set_end_date_by_duration('" + T_mode + "', '" + T_divId + "', '" + ref_class + "', '" + dur_class + "', '" + duration_type + "')";
                    $("#" + where_box_id + "").attr("oninput", param);
                }

                set_end_date_by_duration(T_mode, T_divId, ref_class, dur_class, duration_type);
            }
        }
    }
    catch (e) {
        //alert1(e + '_check_set_end_date_by_duration()');
    }
}

function set_end_date_by_duration(mode, T_divId, ref_class, dur_class, duration_type) {
    try {

        if (duration_type == '' || duration_type == null || duration_type == undefined) {
            duration_type = 'days';
        }

        if (dur_class == "" || dur_class == null || dur_class == undefined) {
            // getting duration from end date static configured duration

            var number = $("#cal_" + T_divId + "").attr('duration');
        }
        else {
            //check for type22 sum value
            var where_box_id = $("td." + dur_class + "").attr("id");
            if (where_box_id == '' || where_box_id == null || where_box_id == undefined) {

                // check for numeric box
                where_box_id = $("." + dur_class + " input").attr("id");
                if (where_box_id == '' || where_box_id == null || where_box_id == undefined) {

                    // check from collapsible summary
                    var div_obj = $("." + dur_class + "").find('div.cls-read-only');
                    if (div_obj.length > 0) {
                        var number = $(div_obj)[0].innerHTML;
                    }

                }
                else {
                    var number = $("#" + where_box_id + "").val();
                }
            }
            else {
                var number = $("#" + where_box_id + "").text();
            }
        }

        if (number == '' || number == null || number == undefined) { }
        else {
            number = parseInt(number);

            var start_id = $("." + ref_class + " input").attr("id");
            var start_dt = $("#" + start_id + "").val();

            if (start_dt == '' || start_dt == null || start_dt == undefined) { }
            else {
                start_dt = convert_fix_format_date_on_submit(start_dt, mode);

                var d1 = new Date(start_dt);

                if (duration_type == 'years') {
                    d1.setFullYear(d1.getFullYear() + number);
                }
                else if (duration_type == 'months') {
                    d1.setMonth(d1.getMonth() + number);
                }
                else if (duration_type == 'days') {
                    d1.setDate(d1.getDate() + number);
                }
                else if (duration_type == 'hours') {
                    d1.setHours(d1.getHours() + number);
                }
                else if (duration_type == 'minutes') {
                    d1.setMinutes(d1.getMinutes() + number);
                }
                else {
                    d1.setSeconds(d1.getSeconds() + number);
                }

                var dd1 = d1.getDate();
                var mm1 = d1.getMonth() + 1; //January is 0!
                var hour = d1.getHours()
                var min = d1.getMinutes();
                var yyyy1 = d1.getFullYear();
                var second = d1.getSeconds();

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
                if (second < 10) {
                    second = '0' + second;
                }

                if (mode == 'datetime') {
                    var datetime_format = localStorage.getItem("dateFormat");
                    if (datetime_format == "" || datetime_format == null || datetime_format == undefined) {
                        datetime_format = 'mm/dd/yyyy HH:mm';
                    }

                    var datetime_format_ary = datetime_format.split(" ");
                    var time_format = datetime_format_ary[1];
                    if (time_format == "HH:mm:ss") {
                        var default_val = mm1 + '/' + dd1 + '/' + yyyy1 + ' ' + hour + ':' + min + ':' + second;
                    }
                    else {
                        var default_val = mm1 + '/' + dd1 + '/' + yyyy1 + ' ' + hour + ':' + min;
                    }
                    var new_date = convert_datetime_by_format(default_val, mode);
                }
                else if (mode == 'date') {
                    var default_val = mm1 + '/' + dd1 + '/' + yyyy1;
                    var new_date = convert_datetime_by_format(default_val, mode);
                }
                else {
                    if (d1 == "Invalid Date") {
                        var new_date = start_dt;
                    }
                    else {
                        var new_date = hour + ':' + min;
                    }
                }

                $("#cal_" + T_divId + "").val(new_date);
            }
        }
    }
    catch (e) {
        //alert1(e + '_set_end_date_by_duration()');
    }
}

// hightlight car questions 04032021 - atc
function highlight_car_que_group(t_Car_que_id_Array) {
    loading();

    var server_task_id = JSON.parse(storage.getItem('server_task_id'));
    var checksheet_id = JSON.parse(storage.getItem('check_type'));

    var Param_obj = [];
    Param_obj.push({
        'task_id': server_task_id,
        'que_id': t_Car_que_id_Array,
        'checksheet_id': checksheet_id
    });

    var getdata = new Webservicecall_REST(global_wcf_url + 'GetdataForQueidUsingTaskid', JSON.stringify(Param_obj), onsuccess_highlight_car_que_group, onfail);
    getdata.callOtherDomain();
}
function onsuccess_highlight_car_que_group(e) {
    var responseText = JSON.parse(e.responseText);
    var status = responseText[0].status;
    if (status == 1) {
        var Car_que_id_Array = JSON.parse(responseText[0].data);
        var len = Car_que_id_Array.length;
        for (c = 0; c < len; c++) {
            var is_car_available = Car_que_id_Array[c].is_car_available;
            if (is_car_available == "true") {
                var c_que_id = Car_que_id_Array[c].que_id;
                $("div[que_id=" + c_que_id + "]").css({ "color": "white", "background-color": "#aaa" });
            }
        }
    }
    else {
        var message = responseText[0].message;
        alert1("Server: " + message);
    }
    loading_hide();
}

function get_current_date_time_on_btn_click(t_new_id, mode) {
    try {
        $("#btn_curr_dateTime_" + t_new_id + "").prop('disabled', true);

        var date = new Date();
        var curr_datetime_str = convert_datetime_by_format(date, mode);

        $("#cal_" + t_new_id + "").val(curr_datetime_str);
        $("#cal_" + t_new_id + "").prop('disabled', true);
    }
    catch (e) {
        alert1(e + '_get_current_date_time_on_btn_click');
    }
}

function set_system_variable() {
    var company_id = JSON.parse(storage.getItem('company_id'));
    var user_id = JSON.parse(storage.getItem('user_id'));
    var user_name = JSON.parse(storage.getItem('user_name'));
    var module_id = JSON.parse(window.storage.getItem('wayflow'));
    var module_name = JSON.parse(window.storage.getItem('wayflow_name'));
    var role_id = JSON.parse(storage.getItem('role_id'));
    var role_name = JSON.parse(storage.getItem('role_name'));
    var circle_id = JSON.parse(storage.getItem('circle_id'));
    var circle_name = JSON.parse(storage.getItem('circle_name'));

    try {
        var server_task_id = window.storage.getItem('server_task_id');
        server_task_id = server_task_id.replace(/"/g, "");
        curr_all_data_20["task_id"] = server_task_id;
    }
    catch (e) { }

    try {
        var flow_Array = JSON.parse(storage.getItem('flow_Array'));
        if (flow_Array.length == 1) { }
        else {
            var p_server_task_id = storage.getItem('p_server_task_id');
            p_server_task_id = p_server_task_id.replace(/"/g, "");
            curr_all_data_20["parent_task_id"] = p_server_task_id;
        }
    }
    catch (e) { }

    curr_all_data_20["company_id"] = company_id;
    curr_all_data_20["user_id"] = user_id;
    curr_all_data_20["user_name"] = user_name;
    curr_all_data_20["module_id"] = module_id;
    curr_all_data_20["module_name"] = module_name;
    curr_all_data_20["role_id"] = role_id;
    curr_all_data_20["role_name"] = role_name;
    curr_all_data_20["circle_id"] = circle_id;
    curr_all_data_20["circle_name"] = circle_name;
}

set_switch_hidden_ans = (t_obj) => {
    let text = $(t_obj).html();
    $(t_obj).parent(".switch-hidden").find(".spn_hdn_switch").text(text);
}