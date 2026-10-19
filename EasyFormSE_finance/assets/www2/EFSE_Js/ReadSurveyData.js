var RS_heading;
var RS_check_type;
var RS_step;
var RS_data;
var RS_buttons;
var RS_form_flag_temp;
var RS_disabled_flag;
var RS_target_div;

function read_dynamic_surveydata(heading, check_type, step, data, buttons, form_flag_temp, disabled_flag, target_div, target_index) {

    if (step == "" || step == null || step == undefined) {
        step = 1;
    }

    RS_heading = heading;
    RS_check_type = check_type;
    RS_step = step;
    RS_data = data;
    RS_buttons = buttons;
    RS_form_flag_temp = form_flag_temp;
    RS_disabled_flag = disabled_flag;
    RS_target_div = target_div;
    RS_target_index = target_index;

    var c_is_readchecksheet = JSON.parse(storage.getItem('c_is_readchecksheet'));
    if (c_is_readchecksheet == '1') {
        // 1 means dont merge and create form with log json
        read_dynamic_surveydata_main(heading, check_type, step, data, buttons, form_flag_temp, disabled_flag, target_div, target_index);
    }
    else {
        // 0 means merge blank and log json
        //get_blank_checksheet(check_type, step, RS_data, target_div, target_index);
        get_comments_queid_list_for_filled_form(check_type, step, RS_data, target_div, target_index);
    }
}

var uniq_cmnt_que_id_ary = [];
function get_comments_queid_list_for_filled_form(check_type, step, RS_data, target_div, target_index) {
    try {
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
                //alert(responseText[0].message);
            }

            get_blank_checksheet(check_type, step, RS_data, target_div, target_index);
            loading_hide();

        }, function (e) {
            // onfail

            get_blank_checksheet(check_type, step, RS_data, target_div, target_index);
            loading_hide();
        });
        getdata.callOtherDomain();
    }
    catch (e) {
        loading_hide();
        alert(e + '_get_comments_queid_list_for_filled_form');
    }
}

function get_blank_checksheet(selected_check_type, step, RS_data, target_div, target_index) {
    try {
        // alert1("Reading from checksheet table...");
        var query = "select subcategory, checksheetid, step, data, buttons from checksheet where checksheetid = '" + selected_check_type + "' and step = '" + step + "'";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "1" // 1 for selecting values from table in json
        });
        AppBridge.on(cordova).read(function (e) {
            var myArray = JSON.parse(e);
            if (myArray.length > 0) {
                var heading = myArray[0].subcategory;
                var check_type = myArray[0].checksheetid;
                var step = myArray[0].step;
                var blank_data = itemObj._checkStrObj(myArray[0].data);  		
                var buttons = itemObj._checkStrObj(myArray[0].buttons);  		

                let temp_RS_data = RS_data;
                for (i = 0; i < blank_data.length; i++) {
                    var bl_que_id = blank_data[i].que_id;
                    var bl_type = blank_data[i].type;
                    for (j = 0; j < temp_RS_data.length; j++) {
                        var rs_que_id = temp_RS_data[j].que_id;
                        var rs_type = temp_RS_data[j].type;
                        if (rs_que_id == bl_que_id && rs_type == bl_type) {
                            var rs_ans = temp_RS_data[j].ans;
                            blank_data[i].ans = rs_ans;
                            temp_RS_data.splice(j, 1);
                            break;
                        }
                    }
                }
                read_dynamic_surveydata_main(heading, check_type, step, blank_data, buttons, RS_form_flag_temp, RS_disabled_flag, target_div, target_index)
            } else {
                onfail_get_blank_checksheet('');
            }
        }, onfail_get_blank_checksheet, 'checksheetStep', { checksheetid: selected_check_type, step: step });
    } catch (e) {
        alert1(e + '_get_blank_checksheet()');
        loading_hide();
    }
}

function onfail_get_blank_checksheet(e) {
    //read_dynamic_surveydata_main(RS_heading, RS_check_type, RS_step, RS_data, RS_buttons, RS_form_flag_temp, RS_disabled_flag);

    //checksheet template not found locally then call server
    get_blank_checksheet_from_server(RS_check_type, RS_step);
}

var dependency_Array_CCD = [];
var dependency_array_count_type22 = 0;
var Type20_Dep_Array = [];
var act_form_flag;

// read survey data
function read_dynamic_surveydata_main(heading, check_type, step, data, buttons, form_flag_temp, disabled_flag, target_div, target_index) {
    if (typeof AppFormDrafts !== 'undefined' && AppFormDrafts.beforeRender(arguments, function (args) { read_dynamic_surveydata_main.apply(null, args); })) return;
    try {

        curr_target_div = target_div;

        set_system_variable();

        curr_all_data_20["current_checksheet_id"] = check_type;

        var c_is_online = JSON.parse(storage.getItem('c_is_online'));           // 1 = online checksheet, 0 = offline checksheet
        var c_is_disabled = JSON.parse(storage.getItem('c_is_disabled'));
        if (c_is_disabled == 1) { disabled_flag = 1 }
        localStorage.setItem('form_flag', form_flag_temp);

        if (c_is_disabled == '1') {
            var read_only = true;
        }
        else {
            var read_only = false;
        }

        form_flag = form_flag_temp;
        act_form_flag = form_flag_temp;

        var jsonObj = [];

        newdiv = "";

        var dependency_Array = [];
        dependency_Array_CCD = [];
        Type20_Dep_Array = [];
        var Show_class_Array = [];
        var LL_class_Array = []; // classes of site lat long numeric box
        var Type17_class_Array = []; // type17 classes
        var Type17_Adv_class_Array = []; // advanced type17 classes
        var Type20_class_Array = []; // type20 classes
        var Type8_data_Array = []; // calender classes
        var Type26_upload_Array = [];
        var Type30_dynddl_Array = [];
        Type30_dynddl_Array_Global = [];
        var Disable_class_Array = []; // disable classes
        var Type32_Array = [];
        var weather_cntrl_found = 0;
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
        //-------- get details from system var end -----------

        var data_json = JSON.parse(storage.getItem('list_json'));
        if (data_json == "" || data_json == null || data_json == undefined) { }
        else {
            var list_data = JSON.parse(data_json);
        }

        // --- check target container div start ---//////
        if (form_flag == 0) {

            setTimeout(function () {
                form_has_changed = "false";
            }, 1000);

            // normal form
            jsonObj_old = [];
            collapse_Json = []; // type23 inner data array
            collapse_id_Array = []; // type23 ids
            curr_clps_new_id = 0;
            Type20_AutoFill_DDL_Array = []; // type20 autofill dropdown
            Type20_AutoBind_Onchange_Array = []; // autofill by parent
            //Unavailable_Img_Array = [];

            inv_item_Array = [];
            // inv_item_Counter = 0; // items counter for single invoice
            inv_Calc_new_array = [];
            inv_display_flag_array = [];
            json_inv_array = [];
            //get_unavail_img = 0;                    //to restrict multiple call of get_base64_from_server()

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

            // create path view & step header
            btnJsonObj = buttons;
            var module_name = JSON.parse(storage.getItem('wayflow_name'));
            var checksheet_name = JSON.parse(storage.getItem('checksheet_name'));
            if (checksheet_name.length > 20) {
                checksheet_name = checksheet_name.substr(0, 18) + '...';
            }

            // newdiv += '<label class="theme_rcs_lbl_header" style="font-size:
            // 15px; font-weight:bold; font-family: calibri; display:block; "><b
            // style="color:black">Flow: </b>'
            // + module_name
            // + ' <b style="color:black"> >> </b> '
            // + checksheet_name
            // + ' <b style="color:black"> >> </b>Step_'
            // + step + '</label>';

            var lbl_str = '<b style="color:black">Flow: </b>' + module_name + ' <b style="color:black"> >> </b> ' + checksheet_name + ' <b style="color:black"> >> </b>Step_' + step + '';
            $("#lbl_flow_path").html(lbl_str);

            var progress_step = JSON.parse(storage.getItem('progress_step'));
            var max = JSON.parse(storage.getItem('last_step'));
            if (progress_step == '' || progress_step == null || progress_step == undefined) {
                if (max == step) {
                    progress_step = step;
                } else {
                    progress_step = step - 1;
                }
                storage.setItem('progress_step', JSON.stringify(progress_step));
            } else {
                //
            }

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
            dependency_array_count_type22 = 0;
            type22_current_mode = 'edit';
            //storage.setItem('json_inv', heading);                     //commented coz error in invoice edit btn click [21052020]
        } else if (form_flag == 2) {
            // collapsible step form (type 23)
            // $("#collapsible_top").empty();
            // $("#collapse_container_div").empty();
            //get_unavail_img = 0;                    //to restrict multiple call of get_base64_from_server()
            $("#collapse_container_div_" + curr_clps_new_id + "").empty();

            read_only = true;                                               //collapsible summary mode
        } else if (form_flag == 3) {
            // type 23 popup div container
            //get_unavail_img = 0;                    //to restrict multiple call of get_base64_from_server()
            $("#clps_popup_container_div").empty();
        }
        else if (form_flag == 6) {
            //var t_id = localStorage.getItem('tid');
            var t_id = JSON.parse(storage.getItem('tid'));
            var step = localStorage.getItem('p_key');
            //var check_type = localStorage.getItem('checksheetid');                        //commented for edit task form check_type issue [FT-20092024]
            //check_type = check_type.replace(/"/g, "");

            curr_survey_data["step"] = step;

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

            curr_clps_new_id = 0;
            inv_Calc_new_array = [];
            inv_display_flag_array = [];
            json_inv_array = [];

            Type20_AutoFill_DDL_Array = []; // type20 autofill dropdown
            Type20_AutoBind_Onchange_Array = []; // autofill by parent

            //Unavailable_Img_Array = [];
            //get_unavail_img = 0;                    //to restrict multiple call of get_base64_from_server()
        }
        else if (form_flag == 7) {
            check_type = localStorage.getItem('check_type_customer');
        }
        else if (form_flag == 12) {
            curr_survey_data["step"] = step;
        }
        // --------- check target container div end ---////

        jsonObj = data;

        ////added comment icon for every control on swipe right [FT - 12022025]
        if (form_flag == 0 || form_flag == 2 || form_flag == 3) {
            newdiv += '<div>';
        }

        var type0_ele_class = "false";
        for (i = 0; i < jsonObj.length; i++) {
            //alert1("i: " + i + ", data: " + JSON.stringify(jsonObj[i]));
            var cnrl_type = jsonObj[i].type;
            var prop_name = jsonObj[i].prop[0].name;

            if (user_language != 'en') {
                var language = jsonObj[i].language;
                if (language == "" || language == null || language == undefined || language == "null" || language == "Unknown" || language == "udenfined" || language == "[]") { }
                else {
                    language = language[0];

                    if (isEmpty(language)) { }
                    else {
                        prop_name = language[user_language];
                    }
                }
            }

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
                        if (is_disabled == "allow_once") {
                            var cnrl_ans = jsonObj[i].ans;
                            if (cnrl_ans == "" || cnrl_ans == null || cnrl_ans == undefined) {
                                var enable_disable = ""; // element enable
                                var cls_enable = "";
                            }
                            else {
                                var enable_disable = "disabled"; // element disabled
                                var cls_enable = "enable_cls"; // apply disbale class
                            }
                        }
                        else {
                            var enable_disable = ""; // element enable
                            var cls_enable = "";
                        }
                    } else {
                        var enable_disable = "disabled"; // element disabled
                        var cls_enable = "enable_cls"; // apply disbale class
                    }

                    if (target_div == "" || target_div == null || target_div == undefined) {
                        var new_id = curr_clps_new_id + "_" + check_type + '_' + jsonObj[i].que_id;
                    }
                    else {
                        var new_id = curr_clps_new_id + '_' + check_type + '_' + jsonObj[i].que_id + '_' + target_div;
                    }

                    var valid = jsonObj[i].prop[0].valid;

                    if (read_only == true) {
                        var mendatory_img = '';
                    }
                    else {
                        if (valid == "true") {
                            var mendatory_img = '<img src="images/mendatory.gif">';
                        }
                        else {
                            // var mendatory_img = '';
                            var mendatory_img = '<img src="images/mendatory.gif" style="visibility: hidden">';
                        }
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

                    if (jsonObj[i].prop[0].is_hide == "true") {
                        var disp_cntrl = 'display:none;';
                        ele_class += ' st_hdn ';
                    } else if (ele_class == "" || form_flag == 2) {
                        var disp_cntrl = '';
                        if (jsonObj[i].type == 20 && form_flag == 2) {                      //added this cndtn for collapsible show extra ele issue [27022023]
                            ele_class = "";
                        }
                    } else {
                        var disp_cntrl = 'display:none;';
                    }

                    ele_class += ' ' + ref_ele_class;

                    // Static Q class with que_id e.g. Q13
                    ele_class += ' Q' + que_id;

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
                                label_str += '<label class="lbl_type5" style="display:inline;word-break: break-word; font-size: 15px; font-family: calibri">' + prop_name + mendatory_img + '</label>';
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
                    var width_layout = jsonObj[i].width_layout;
                    if (form_flag == 0 || form_flag == 2 || form_flag == 3) {
                        if (cnrl_type != 0) {
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
                    else {
                        // for task/customer/user checksheets
                        if (width_layout == "" || width_layout == null || width_layout == undefined) { }
                        else {
                            if (width_layout == "50-50") {
                                // 50% 1st control - 50% 2nd control
                                ele_class += ' w-50-50 ';
                            }
                            else if (width_layout == "75-25") {
                                // 75% 1st control label - 25% 1st control ui
                                ele_class += ' w-75-25 ';
                            }
                        }
                    }

                    // Question Start
                    if (jsonObj[i].type == 0) {
                        if (form_flag == 2) {
                            //var block_css = 'margin:10px 0px; font-size: 10pt';
                            var min_height = 'min-height: 20px;'
                        }
                        else {
                            //var block_css = 'margin:10px 0px; box-shadow: 2px 2px 5px gray; font-size: 10pt; border-radius:4px; border:1px solid #ccc';
                            var min_height = ''
                        }

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

                        if (curr_clps_new_id == 0) {
                            // newdiv += '<hr style="border-top: 1px solid #B4B6BA; margin-bottom: 0px !important;" />';
                            var t_padding = "padding:10px 10px 10px;";
                        }
                        else {
                            var t_padding = "padding:5px 5px 5px;";
                        }

                        if (jsonObj[i].value == '' || jsonObj[i].value == null || jsonObj[i].value == undefined || jsonObj[i].value == ' ') { }
                        else {
                            newdiv += '<label style="display:block; text-align:justify; margin-bottom:5px; font-size: 15px; font-weight:bold; font-family: calibri; border-bottom: 1px solid #B4B6BA; background-color: #f6f6f6;' + t_padding + min_height + ' " id="qh_'
                                + new_id + '">' + jsonObj[i].value + '</label>';
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
                            var textbox_type = "";
                            var box_view = "";
                            var speech_btn = 'false';
                        } else {
                            value = itemObj._checkStrObj(value);  		// check_item
                            var textbox_type = value[0].box_type;
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

                        if (limit == '' || limit == null || limit == undefined) {
                            var param_limit = "";
                        } else {
                            limit = parseInt(limit);
                            var param_limit = 'onkeyup="mk_limitText(this,' + limit + ');"';
                        }

                        newdiv += '<div id="div_txt_' + new_id + '" class="cntrl_main_div ' + ele_class + '" style="' + disp_cntrl + '" ' + cls_enable + ' ' + common_str + '>';

                        var default_value = misc_Array[0].default_value;
                        if (jsonObj[i].prop[0].is_reset == 'true' && read_only == false) {
                            if (default_value == '' || default_value == null || default_value == undefined) {
                                var ans_str = [""];
                            }
                            else {
                                var default_val = default_value[0];
                                var value_type = default_val.substring(2, 1);
                                var sub_get_value = default_val.substring(2, default_val.length - 2);
                                if (value_type == "#") {
                                    default_val = curr_all_data_20[sub_get_value];
                                    if (default_val == '' || default_val == ' ' || default_val == null || default_val == undefined) {
                                        default_val = "N/A";
                                    }
                                }
                                var ans_str = default_val;
                            }
                        }
                        else {
                            var ans_str = jsonObj[i].ans[0];
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
                            }
                        }

                        var obj = {
                            read_type: 'readsurvey',
                            ans: ans_str,
                            new_id: new_id,
                            value: jsonObj[i].value,
                            default_val: default_val,
                            enable_disable: enable_disable,
                            param: param_limit,
                            textbox_type: textbox_type,
                            curr_clps_new_id: curr_clps_new_id,
                            box_view: box_view,
                            speech_btn: speech_btn
                        }

                        if (read_only == true) {

                            if (form_flag == 2) {
                                // clickable link DV-14072025                    
                                if (ans_str.startsWith("https://")) {
                                    ans_str = "<a target='_blank' href='" + ans_str + "' onclick='redirect_on_link_url(this)'>" + ans_str + "</a>";
                                }
                            }

                            let summary_str = get_summary_str(new_id, prop_name, ans_str, check_type, que_id);
                            newdiv += summary_str;
                        }
                        else {
                            newdiv += label_str;
                            var control = new MkControls(obj);
                            newdiv += control.build_type_1_text();
                        }
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
                                            dep_type: jsonObj[i].dependency[j].dep_type
                                        });

                                        if (form_flag == 1) {
                                            dependency_array_count_type22++;
                                        }

                                        if (t_dep_type == 0) {
                                            Show_class_Array.push(dep_class);
                                        } else if (t_dep_type == 4) {
                                            Show_class_Array.push(match_class);
                                        }

                                        var t_answer = jsonObj[i].ans;
                                        if (t_answer == '' || t_answer == null || t_answer == undefined) { }
                                        else {
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

                        //var selected_Value = jsonObj[i].ans;
                        var rdo_Array = jsonObj[i].value;
                        var weightage_Array = jsonObj[i].prop[0].weightage;
                        var misc_Array = jsonObj[i].prop[0].misc_data;
                        var view_type = misc_Array[0].view_type;

                        //var br_str = "<br />";
                        //if (view_type == '' || view_type == null || view_type == undefined) {
                        //} else {
                        //    if (view_type == "horizontal") {
                        //        br_str = "";
                        //    }
                        //}

                        var default_value = misc_Array[0].default_value;
                        if (jsonObj[i].prop[0].is_reset == 'true' && read_only == false) {
                            if (default_value == '' || default_value == null || default_value == undefined) {
                                var ans_str = [""];
                            }
                            else {
                                var ans_str = default_value;
                            }
                        }
                        else {
                            var ans_str = jsonObj[i].ans;
                        }

                        var obj = {
                            read_type: 'readsurvey',
                            ans: ans_str,
                            new_id: new_id,
                            value: jsonObj[i].value,
                            language_value: jsonObj[i].language_value,
                            default_val: default_value,
                            enable_disable: enable_disable,
                            param: param,
                            rdo_Array: rdo_Array,
                            weightage_Array: weightage_Array,
                            view_type: view_type,
                            misc_Array: misc_Array
                        }

                        if (read_only == true) {
                            let summary_str = get_summary_str(new_id, prop_name, ans_str, check_type, que_id);
                            newdiv += summary_str;
                        }
                        else {
                            newdiv += label_str;
                            var control = new MkControls(obj);
                            newdiv += control.build_type_2_radio();
                        }
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
                                                ccd_ans: jsonObj[i].ans[0],
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
                                                ccd_ans: jsonObj[i].ans[0],
                                                match_class: match_class,
                                                match_count: match_count,
                                                dep_type: t_dep_type,
                                                copy_array: copy_array
                                            });
                                        }

                                        if (form_flag == 1) {
                                            dependency_array_count_type22++;
                                        }

                                        if (t_dep_type == 0) {
                                            Show_class_Array.push(dep_class);
                                        } else if (t_dep_type == 3) {
                                            var t_answer = jsonObj[i].ans;
                                            if (t_answer == '' || t_answer == null || t_answer == undefined) { }
                                            else {
                                                Show_class_Array.push(dep_class);
                                            }

                                            dependency_Array_CCD.push(data3);
                                        }
                                        else if (t_dep_type == 4) {
                                            Show_class_Array.push(match_class);
                                        } else if (t_dep_type == 5) {
                                            for (c = 0; c < copy_array.length; c++) {
                                                var copy_class = copy_array[c].copy_class;
                                                var paste_class = copy_array[c].paste_class;
                                                Show_class_Array.push(copy_class);
                                                Show_class_Array.push(paste_class);
                                            }
                                        }
                                        else {
                                            var t_answer = jsonObj[i].ans;
                                            if (t_answer == '' || t_answer == null || t_answer == undefined) { }
                                            else {
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

                        var selected_Value = jsonObj[i].ans;
                        var ddl_Array = jsonObj[i].value;
                        var weightage_Array = jsonObj[i].prop[0].weightage;
                        if ($.inArray(jsonObj[i].ans[0], ddl_Array) > -1 || selected_Value == '' || selected_Value == null || selected_Value == undefined) {
                            // normal dropdown
                        }
                        else {
                            if (data3.length > 0) {
                                // cascading dropdown
                                ddl_Array = [jsonObj[i].ans[0]];
                            }
                        }
                        //if (selected_Value.length == 2) {
                        //    ddl_Array = [jsonObj[i].ans[0]];
                        //}

                        var misc_Array = jsonObj[i].prop[0].misc_data;
                        var default_value = misc_Array[0].default_value;
                        if (jsonObj[i].prop[0].is_reset == 'true' && read_only == false) {
                            if (default_value == '' || default_value == null || default_value == undefined) {
                                var ans_str = [""];
                            }
                            else {
                                var default_val = default_value[0];
                                var value_type = default_val.substring(2, 1);
                                if (value_type == "#") {
                                    var sub_get_value = default_val.substring(2, default_val.length - 2);
                                    default_value[0] = curr_all_data_20[sub_get_value];
                                    default_val = default_value[0];
                                }

                                //var ans_str = default_value;
                                var ans_str = [default_val];
                            }
                        }
                        else {
                            var ans_str = jsonObj[i].ans;
                        }

                        var obj = {
                            read_type: 'readsurvey',
                            ans: ans_str,
                            new_id: new_id,
                            default_val: '',
                            enable_disable: enable_disable,
                            param: param,
                            ddl_Array: ddl_Array,
                            weightage_Array: weightage_Array
                        }

                        if (read_only == true) {
                            let summary_str = get_summary_str(new_id, prop_name, ans_str, check_type, que_id);
                            newdiv += summary_str;
                        }
                        else {
                            newdiv += label_str;
                            var control = new MkControls(obj);
                            newdiv += control.build_type_3_dropdown();
                        }
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

                        if (jsonObj[i].prop[0].is_reset == 'true' && read_only == false) {
                            var ans_str = default_val;
                        }
                        else {
                            var ans_str = jsonObj[i].ans;
                        }

                        var obj = {
                            read_type: 'readsurvey',
                            ans: ans_str,
                            new_id: new_id,
                            value: jsonObj[i].value,
                            default_val: default_val,
                            enable_disable: enable_disable,
                            param: param_limit,
                            misc_Array: misc_Array
                        }

                        if (read_only == true) {
                            let summary_str = get_summary_str(new_id, prop_name, ans_str, check_type, que_id);
                            newdiv += summary_str;
                        }
                        else {
                            newdiv += label_str;
                            var control = new MkControls(obj);
                            newdiv += control.build_type_4_number();
                        }
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
                    //Check Box
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

                                        var t_answer = jsonObj[i].ans;
                                        if (t_answer == '' || t_answer == null || t_answer == undefined) { }
                                        else {
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

                        //var selected_Array = jsonObj[i].ans;
                        var chk_Array = jsonObj[i].value;
                        var weightage_Array = jsonObj[i].prop[0].weightage;
                        var option_valid = jsonObj[i].prop[0].option_valid;
                        var misc_Array = jsonObj[i].prop[0].misc_data;
                        var view_type = misc_Array[0].view_type;

                        var br_str = "<br />";
                        if (view_type == '' || view_type == null || view_type == undefined) {
                        } else {
                            if (view_type == "horizontal") {
                                br_str = "";
                            }
                        }

                        if (jsonObj[i].prop[0].is_reset == 'true' && read_only == false) {
                            if (default_value == '' || default_value == null || default_value == undefined) {
                                var ans_str = [""];
                            }
                            else {
                                var ans_str = default_value;
                            }
                        }
                        else {
                            var ans_str = jsonObj[i].ans;
                        }

                        var obj = {
                            read_type: 'readsurvey',
                            ans: ans_str,
                            new_id: new_id,
                            value: jsonObj[i].value,
                            default_val: '',
                            enable_disable: enable_disable,
                            param: param,
                            chk_Array: chk_Array,
                            weightage_Array: weightage_Array,
                            option_valid: option_valid,
                            br_str: br_str
                        }

                        if (read_only == true) {
                            let summary_str = get_summary_str(new_id, prop_name, ans_str, check_type, que_id);
                            newdiv += summary_str;
                        }
                        else {
                            newdiv += label_str;
                            var control = new MkControls(obj);
                            newdiv += control.build_type_6_checkbox();
                        }
                        newdiv += '</div>';
                    }

                    // Camera Button
                    else if (jsonObj[i].type == 7) {
                        var misc_Array = jsonObj[i].prop[0].misc_data;
                        var value, photo_type, latlong, quality, width, height, target_class, burstmode, old_photo_class, scan_mode, ref_class, model_name, prompt_text, prompt_text_array, group_photo_class, max_attempt;
                        for (h = 0; h < misc_Array.length; h++) {
                            var type = misc_Array[h].type;
                            if (type == 6) {
                                value = itemObj._checkStrObj(misc_Array[h].value);  		// check_item
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
                                max_attempt = value[0].max_attempt;
                            }
                        }
                        if (photo_type == '' || photo_type == null || photo_type == undefined) {
                            photo_type = "camera";
                            latlong = "false";
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
                        if (max_file_size == null || max_file_size == '' || max_file_size == undefined) {
                            max_file_size = 5;
                        }

                        if (target_class == '' || target_class == null || target_class == undefined) {
                            target_class = "";
                        }
                        else {
                            Show_class_Array.push(target_class);
                        }

                        var cam_ans = jsonObj[i].ans;
                        if (old_photo_class == '' || old_photo_class == null || old_photo_class == undefined) {
                            old_photo_class = "";
                        }
                        else {
                            if (cam_ans == "" || cam_ans == null || cam_ans == undefined) { }                       //display normal photo in filled form [12022021]
                            else {
                                Show_class_Array.push(old_photo_class);
                            }
                        }

                        Type7_old_photo_class_Array.push({
                            "old_photo_class": old_photo_class,
                            "cam_ans": cam_ans
                        });

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

                        var img_Id = jsonObj[i].ans[0];
                        var p_name = jsonObj[i].ans[1];
                        var detected_text = jsonObj[i].ans[7];             // OCR
                        var selected_text = jsonObj[i].ans[8];             // OCR

                        if (jsonObj[i].prop[0].is_reset == 'true' && read_only == false) {
                            img_Id = '';
                            p_name = '';
                        }

                        if (ref_class == '' || ref_class == null || ref_class == undefined) {
                            ref_class = "";
                        }


                        try {
                            var survey_mode = list_data[0].survey_mode;
                        }
                        catch {
                            var survey_mode = 'online';
                        }

                        var is_jitsi_plugin_call = checkCall();
                        if (is_jitsi_plugin_call == true) {
                            var param = 'capture_jitsi_screenshot("' + i + '", "' + check_type + '","' + jsonObj[i].que_id + '", "cbtn_' + new_id + '", "0")';
                            var src_str = 'images/camera.png';
                        }
                        else {
                            if (img_Id == "" || img_Id == null || img_Id == undefined) {
                                if (form_flag == 7 || form_flag == 8 || form_flag == 12 || (form_flag == 0 && c_is_online == 1) || (form_flag == 1 && c_is_online == 1) || (form_flag == 6 && survey_mode == "online") || (curr_page_flag == "viewsitedata_task" && survey_mode == "online")) {
                                    //upload photos online for customer/user/form/ online mobile checksheet

                                    if (ref_class == '' || ref_class == null || ref_class == undefined) {
                                        var param = 'CaptureClick_Customer("' + i + '", "' + jsonObj[i].que_id + '", "cbtn_' + new_id + '", "' + form_flag_temp + '","' + photo_type + '","' + latlong + '","' + width + '","' + height + '","' + quality + '","0", "' + burstmode + '", "' + target_div + '")';
                                    }
                                    else {
                                        photo_type = "Attendance";                      //for profile photo face detection camera plugin [FT - 01122023]

                                        // attendance offline plugin will call via online photo plugin - mk - 31102025
                                        var param = 'CaptureClick_Customer("' + i + '", "' + jsonObj[i].que_id + '", "cbtn_' + new_id + '", "' + form_flag_temp + '","' + photo_type + '","' + latlong + '","' + width + '","' + height + '","' + quality + '","0", "' + burstmode + '", "' + target_div + '", "' + ref_class + '")';
                                    }

                                }
                                else {
                                    // offline checksheet

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
                                var param1 = '';
                                var src_str = 'images/camera.png'
                            }
                            else {
                                if (form_flag == 7 || form_flag == 8 || form_flag == 12 || (form_flag == 0 && c_is_online == 1) || (form_flag == 6 && survey_mode == "online") || (curr_page_flag == "viewsitedata_task" && survey_mode == "online")) {
                                    //upload photos online for customer/user/form/ online mobile checksheet

                                    if (ref_class == '' || ref_class == null || ref_class == undefined) {
                                        var param = 'CaptureClick_Customer("' + i + '", "' + jsonObj[i].que_id + '", "cbtn_' + new_id + '", "' + form_flag_temp + '","' + photo_type + '","' + latlong + '","' + width + '","' + height + '","' + quality + '","1", "' + burstmode + '", "' + target_div + '")';
                                    }
                                    else {
                                        photo_type = "Attendance";                      //for profile photo face detection camera plugin [FT - 01122023]

                                        // attendance offline plugin will call via online photo plugin - mk - 31102025
                                        var param = 'CaptureClick_Customer("' + i + '", "' + jsonObj[i].que_id + '", "cbtn_' + new_id + '", "' + form_flag_temp + '","' + photo_type + '","' + latlong + '","' + width + '","' + height + '","' + quality + '","1", "' + burstmode + '", "' + target_div + '", "' + ref_class + '")';
                                    }

                                }
                                else {
                                    // offline checksheet

                                    if (ref_class == '' || ref_class == null || ref_class == undefined) {

                                        if (photo_type == "GroupAttendance") {
                                            var param = 'verify_group_photo_with_face_detection("' + i + '", "' + jsonObj[i].que_id + '", "cbtn_' + new_id + '", "' + form_flag_temp + '","' + photo_type + '","' + latlong + '","' + width + '","' + height + '","' + quality + '","0", "' + burstmode + '")';
                                        }
                                        else {
                                            var param = 'CaptureClick("' + i + '", "' + jsonObj[i].que_id + '", "cbtn_' + new_id + '", "' + form_flag_temp + '","' + photo_type + '","' + latlong + '","' + width + '","' + height + '","' + quality + '","1", "' + burstmode + '")';
                                        }

                                    }
                                    else {
                                        // compare attendance and print photo
                                        var param = 'verify_user_profile_photo("' + i + '", "' + jsonObj[i].que_id + '", "cbtn_' + new_id + '", "' + form_flag_temp + '","' + photo_type + '","' + latlong + '","' + width + '","' + height + '","' + quality + '","1", "' + burstmode + '", "' + ref_class + '")';
                                    }

                                }

                                var type22_popup = $('.popup-type22:visible');
                                if (type22_popup.length > 0) {
                                    var type22_img_que_id = storage.getItem('img_id_type22');
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
                                    var type22_img_que_id = 0;
                                    var t_row_index_no = 0;
                                }

                                var param1 = 'bind_unavailable_images("cbtn_' + new_id + '", "' + p_name + '","' + step + '", "' + check_type + '", "' + jsonObj[i].que_id + '", "' + type22_img_que_id + '", "' + t_row_index_no + '")';
                                var src_str = img_Id;
                            }
                        }

                        newdiv += '<div id="div_cbtn_' + new_id + '" class="cntrl_main_div ' + ele_class + '" style="' + disp_cntrl + '" ' + cls_enable + ' ' + common_str + '>';

                        if (enable_disable == "disabled") {
                            param = '';
                        }

                        if (curr_clps_new_id != 0) {
                            param = 'CaptureClick("' + i + '", "' + jsonObj[i].que_id + '", "cbtn_' + new_id + '", "' + form_flag_temp + '","' + photo_type + '","' + latlong + '","' + width + '","' + height + '","' + quality + '","2", "' + burstmode + '")';
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
                            param1: param1,
                            src_str: src_str,
                            detected_text: detected_text,
                            selected_text: selected_text
                        }

                        if (read_only == true) {
                            let summary_str = get_summary_str(new_id, prop_name, img_Id, check_type, que_id, jsonObj[i], obj);
                            newdiv += summary_str;
                        }
                        else {
                            newdiv += label_str;
                            var control = new MkControls(obj);
                            newdiv += control.build_type_7_camera();
                        }

                        var hdn_cam_ary = [];
                        hdn_cam_ary.push({
                            'scan_mode': scan_mode,
                            'max_file_size': max_file_size,
                            'model_name': model_name,
                            'prompt_text': prompt_text,
                            'prompt_text_array': prompt_text_array,
                            'group_photo_class': group_photo_class,
                            'max_attempt': max_attempt
                        });

                        var hdn_cam_ary_str = JSON.stringify(hdn_cam_ary);
                        hdn_cam_ary_str = encodeURIComponent(hdn_cam_ary_str);
                        newdiv += '<input type="hidden" id="hdn_cbtn_' + new_id + '" value="' + hdn_cam_ary_str + '" />';

                        var hdn_ans_str = jsonObj[i].ans;
                        hdn_ans_str = JSON.stringify(hdn_ans_str);
                        hdn_ans_str = encodeURIComponent(hdn_ans_str);
                        newdiv += '<input type="hidden" id="hdn_cbtn_ans_' + new_id + '" value="' + hdn_ans_str + '" />';

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
                            value = itemObj._checkStrObj(value);  		// check_item
                            var mode = value[0].mode;
                            var main_class = value[0].main_class;
                            var ref_class = value[0].ref_class;
                            Show_class_Array.push(ref_class);
                            var end_duration = value[0].duration;
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

                                var mm1 = d1.getMonth() + 1;
                                var dd1 = d1.getDate();
                                var hour = d1.getHours()
                                var min = d1.getMinutes();
                                var yyyy1 = d1.getFullYear();
                                var second = d1.getSeconds();

                                //var mm1 = d1.toLocaleString('en-us', { month: "long" });
                                if (mode == 'datetime') {
                                    if (time_format == "HH:mm:ss") {
                                        default_val = mm1 + '/' + dd1 + '/' + yyyy1 + ' ' + hour + ':' + min + ':' + second;
                                    }
                                    else {
                                        default_val = mm1 + '/' + dd1 + '/' + yyyy1 + ' ' + hour + ':' + min;
                                    }
                                    var t_default_val = convert_datetime_by_format(default_val, mode);
                                    default_val = t_default_val;
                                }
                                else if (mode == 'date') {
                                    default_val = mm1 + '/' + dd1 + '/' + yyyy1;
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

                        if (jsonObj[i].prop[0].is_reset == 'true' && read_only == false) {
                            if (default_value == '' || default_value == null || default_value == undefined) {
                                var ans_str = [""];
                            }
                            else {
                                var ans_str = default_val;
                            }
                        }
                        else {
                            if (jsonObj[i].ans[0] == "") {
                                var ans_str = [""];
                            }
                            else if (jsonObj[i].ans.length == 1) {
                                var ans_str = jsonObj[i].ans;
                                ans_str = convert_datetime_by_format(ans_str, mode);
                            }
                            else {
                                var ans_str = jsonObj[i].ans[1];
                                ans_str = convert_datetime_by_format(ans_str, mode);
                            }
                        }

                        var obj = {
                            read_type: 'readsurvey',
                            ans: ans_str,
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

                        if (read_only == true) {
                            let summary_str = get_summary_str(new_id, prop_name, ans_str, check_type, que_id);
                            newdiv += summary_str;
                        }
                        else {
                            newdiv += label_str;
                            var control = new MkControls(obj);
                            newdiv += control.build_type_8_calendar();
                        }
                        newdiv += '</div>';
                    }

                    // Signature Button
                    else if (jsonObj[i].type == 9) {
                        var img_Id = jsonObj[i].ans[0];
                        var p_name = jsonObj[i].ans[1];

                        if (jsonObj[i].prop[0].is_reset == 'true' && read_only == false) {
                            img_Id = '';
                            p_name = '';
                        }

                        var survey_mode = list_data[0].survey_mode;
                        if (img_Id == "" || img_Id == null || img_Id == undefined) {
                            if (form_flag == 7 || (form_flag == 6 && survey_mode == "online") || (curr_page_flag == "viewsitedata_task" && survey_mode == "online")) {
                                var param = 'CaptureClick_sign_Customer("' + i + '", "' + jsonObj[i].que_id + '", "sign_' + new_id + '","' + form_flag_temp + '", "0")';
                            }
                            else {
                                var param = 'CaptureClick_sign("' + i + '", "' + jsonObj[i].que_id + '", "sign_' + new_id + '","' + form_flag_temp + '", "0")';
                            }
                            var param1 = '';
                            var src_str = 'images/signature_box.png'
                        } else {
                            if (form_flag == 7 || (form_flag == 6 && survey_mode == "online") || (curr_page_flag == "viewsitedata_task" && survey_mode == "online")) {
                                var param = 'CaptureClick_sign_Customer("' + i + '", "' + jsonObj[i].que_id + '", "sign_' + new_id + '","' + form_flag_temp + '", "1")';
                            }
                            else {
                                var param = 'CaptureClick_sign("' + i + '", "' + jsonObj[i].que_id + '", "sign_' + new_id + '","' + form_flag_temp + '","1")';
                            }

                            var type22_popup = $('.popup-type22:visible');
                            if (type22_popup.length > 0) {
                                var type22_img_que_id = storage.getItem('img_id_type22');
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
                                var type22_img_que_id = 0;
                                var t_row_index_no = 0;
                            }

                            var param1 = 'bind_unavailable_images("sign_' + new_id + '", "' + p_name + '","' + step + '", "' + check_type + '", "' + jsonObj[i].que_id + '", "' + type22_img_que_id + '", "' + t_row_index_no + '")';
                            var src_str = img_Id;
                        }

                        newdiv += '<div id="div_sign_' + new_id + '" class="cntrl_main_div ' + ele_class + '" style="' + disp_cntrl + '" ' + cls_enable + ' ' + common_str + '>';

                        if (enable_disable == "disabled") {
                            param = '';
                        }

                        if (curr_clps_new_id != 0) {
                            var param = "CaptureClick_sign('" + i + "', '" + jsonObj[i].que_id + "', 'sign_" + new_id + "','" + form_flag_temp + "', '2')";
                        }

                        var obj = {
                            read_type: 'readsurvey',
                            new_id: new_id,
                            name: prop_name,
                            enable_disable: enable_disable,
                            param: param,
                            param1: param1,
                            src_str: src_str
                        }

                        if (read_only == true) {
                            let summary_str = get_summary_str(new_id, prop_name, img_Id, check_type, que_id, jsonObj[i], obj);
                            newdiv += summary_str;
                        }
                        else {
                            newdiv += label_str;
                            var control = new MkControls(obj);
                            newdiv += control.build_type_9_sign();
                        }
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

                        var img_Id = jsonObj[i].ans[0];
                        var p_name = jsonObj[i].ans[1];

                        if (jsonObj[i].prop[0].is_reset == 'true' && read_only == false) {
                            img_Id = '';
                            p_name = '';
                        }

                        if (read_only == true) {
                            let summary_str = get_summary_str(new_id, prop_name, ans_str, check_type, que_id);
                            newdiv += summary_str;
                        }
                        else {
                            if (img_Id == "" || img_Id == undefined) {
                                newdiv += '<img src="images/camera_latlong.png" id="cbtnLL_' + new_id + '" onclick = "' + param
                                    + '" style="height:50px; width:50px; margin-left: 5px; border-radius:7px" ' + enable_disable + '/></div>';
                            } else {
                                var type22_popup = $('.popup-type22:visible');
                                if (type22_popup.length > 0) {
                                    var type22_img_que_id = storage.getItem('img_id_type22');
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
                                    var type22_img_que_id = 0;
                                    var t_row_index_no = 0;
                                }

                                //var param_unavail = "bind_unavailable_images('cbtnLL_" + new_id + "', '" + p_name + "')";
                                var param_unavail = 'bind_unavailable_images("cbtnLL_' + new_id + '", "' + p_name + '","' + step + '", "' + check_type + '", "' + jsonObj[i].que_id + '", "' + type22_img_que_id + '", "' + t_row_index_no + '")';

                                newdiv += '<img src="' + img_Id + '" id="cbtnLL_' + new_id + '" ' + enable_disable + ' onclick = "'
                                    + param + '" onerror="' + param_unavail + '" style="height:50px; width:50px; margin-left: 5px; border-radius:7px"/>';
                            }
                        }
                        newdiv += '</div>';
                    }

                    // Range Validator (numeric box)
                    else if (jsonObj[i].type == 12) {
                        var start_range = jsonObj[i].value[0];
                        var end_range = jsonObj[i].value[1];
                        var placeholder_str = 'Enter value in between ' + start_range + ' and ' + end_range + '';

                        var misc_Array = jsonObj[i].prop[0].misc_data;
                        var value = misc_Array[0].value;
                        if (value == '' || value == null || value == undefined) {
                            var textbox_type = "numeric";
                        } else {
                            value = itemObj._checkStrObj(value);  		// check_item
                            var textbox_type = value[0].box_type;
                        }
                        var type12_is_hide = jsonObj[i].prop[0].is_hide;

                        newdiv += '<div id="div_txtrange_' + new_id + '" class="cntrl_main_div ' + ele_class + '" style="' + disp_cntrl + '" ' + cls_enable + ' ' + common_str + '>';

                        var default_value = misc_Array[0].default_value;
                        if (jsonObj[i].prop[0].is_reset == 'true' && read_only == false) {
                            if (default_value == '' || default_value == null || default_value == undefined) {
                                var ans_str = [""];
                            }
                            else {
                                var ans_str = default_value;
                            }
                        }
                        else {
                            var ans_str = jsonObj[i].ans;
                        }

                        var obj = {
                            read_type: 'readsurvey',
                            ans: ans_str,
                            new_id: new_id,
                            default_val: default_val,
                            enable_disable: enable_disable,
                            textbox_type: textbox_type,
                            start_range: start_range,
                            end_range: end_range,
                            is_hide: type12_is_hide
                        }

                        if (read_only == true) {
                            let summary_str = get_summary_str(new_id, prop_name, ans_str, check_type, que_id);
                            newdiv += summary_str;
                        }
                        else {
                            newdiv += label_str;
                            var control = new MkControls(obj);
                            newdiv += control.build_type_12_range();
                        }
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

                        var obj = {
                            new_id: new_id,
                            enable_disable: enable_disable,
                            param: param
                        }

                        if (read_only == true) {
                            let summary_str = get_summary_str(new_id, prop_name, jsonObj[i].ans, check_type, que_id);
                            newdiv += summary_str;
                        }
                        else {
                            newdiv += label_str;
                            var control = new MkControls(obj);
                            newdiv += control.build_type_13_user_latlong();
                        }
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

                    // Get MSL Button (print it to numeric box)
                    else if (jsonObj[i].type == 15) {
                        var lat_box_class = jsonObj[i].value[0];
                        var long_box_class = jsonObj[i].value[1];
                        var MSL_box_class = jsonObj[i].value[2];
                        Show_class_Array.push(lat_box_class);
                        Show_class_Array.push(long_box_class);
                        Show_class_Array.push(MSL_box_class);

                        var param = 'get_latlong_from_numericbox_MSL("' + i + '", "' + lat_box_class + '", "' + long_box_class + '", "' + MSL_box_class + '")';

                        newdiv += "<div id='div_MSL_" + new_id + "' class='cntrl_main_div " + ele_class + "' style='" + disp_cntrl + "' " + cls_enable + " " + common_str + ">";

                        var obj = {
                            new_id: new_id,
                            enable_disable: enable_disable,
                            param: param
                        }

                        if (read_only == true) {
                            let summary_str = get_summary_str(new_id, prop_name, jsonObj[i].ans, check_type, que_id);
                            newdiv += summary_str;
                        }
                        else {
                            newdiv += label_str;
                            var control = new MkControls(obj);
                            newdiv += control.build_type_15_MSL();
                        }
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

                        var obj = {
                            new_id: new_id,
                            enable_disable: enable_disable,
                            param: param
                        }

                        if (read_only == true) {
                            let summary_str = get_summary_str(new_id, prop_name, jsonObj[i].ans, check_type, que_id);
                            newdiv += summary_str;
                        }
                        else {
                            newdiv += label_str;
                            var control = new MkControls(obj);
                            newdiv += control.build_type_16_distance();
                        }
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
                            if (std_rng_test == "" || std_rng_test == null || std_rng_test == undefined) {

                            } else {
                                var range_json = itemObj._checkStrObj(std_rng_test);  		// check_item
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

                        //if (jsonObj[i].prop[0].is_hide == "true") {
                        //    newdiv += '<div id="div_Calc_' + new_id + '" style="display:none; padding:10px" class="st_hdn ' + ele_class + '">';
                        //} else if (ele_class == "" || form_flag == 2) {
                        //    newdiv += '<div id="div_Calc_' + new_id + '" style="padding:10px">';
                        //} else {
                        //    newdiv += '<div id="div_Calc_' + new_id + '" class="' + ele_class + '" style="display:none; padding:10px">';
                        //}

                        if (jsonObj[i].prop[0].is_hide == "true") {
                            newdiv += '<div id="div_Calc_' + new_id + '" class="cntrl_main_div st_hdn ' + ele_class + '" style="' + disp_cntrl + '" ' + cls_enable + ' ' + common_str + '>';
                        }
                        else {
                            newdiv += '<div id="div_Calc_' + new_id + '" class="cntrl_main_div ' + ele_class + '" style="' + disp_cntrl + '" ' + cls_enable + ' ' + common_str + '>';
                        }

                        var is_disabled = jsonObj[i].prop[0].is_disabled;
                        if (is_disabled == '' || is_disabled == null || is_disabled == undefined || is_disabled == "false") {
                            var enable_disable = ""; // element disabled
                        } else {
                            var enable_disable = "readonly"; // element enable
                        }

                        if (disabled_flag != 0) {
                            var enable_disable = "disabled"; // element disabled
                            param = '';
                        }

                        if (jsonObj[i].prop[0].is_reset == 'true' && read_only == false) {
                            jsonObj[i].ans = [""];
                        }

                        var obj = {
                            read_type: 'readsurvey',
                            ans: jsonObj[i].ans,
                            new_id: new_id,
                            enable_disable: enable_disable,
                            param: param,
                            btn_text: btn_text,
                            read_only: read_only
                        }

                        if (read_only == true) {
                            var cal_ans = jsonObj[i].ans;
                            cal_ans = parseFloat(cal_ans);
                            cal_ans = cal_ans.toFixed(2);

                            let summary_str = get_summary_str(new_id, prop_name, cal_ans, check_type, que_id);
                            newdiv += summary_str;
                        }
                        else {
                            newdiv += label_str;
                            var control = new MkControls(obj);
                            newdiv += control.build_type_17_calculator();
                        }
                        newdiv += '</div>';
                    }

                    // currently control type=18 is on hold (cascading drop down)

                    // Get Invoice Button - Native Product Control (print it to numeric
                    // box)
                    else if (jsonObj[i].type == 19) {
                        newdiv += '<div id="div_Inv_' + new_id + '" class="cntrl_main_div ' + ele_class + '" style="' + disp_cntrl + '" ' + cls_enable + ' ' + common_str + '>';

                        var answer = jsonObj[i].ans;
                        if (answer == '' || answer == null || answer == undefined) {
                            var ans_inv_Array = [];
                            var ans_info_Array = [];
                            var ans_ans_Array = [];
                        } else {
                            var ans_inv_Array = itemObj._checkStrObj(answer);  		// check_item
                            var ans_info_Array = ans_inv_Array[0].inv_info_Array;
                            var ans_ans_Array = ans_inv_Array[0].inv_ans_Array;
                        }

                        if (read_only == true) {
                            let summary_str = get_summary_str(new_id, prop_name, jsonObj[i].ans, check_type, que_id);
                            newdiv += summary_str;
                        }
                        else {
                            newdiv += label_str;
                            var param = "popup_items_show('" + new_id + "','#div_item_Bucket_" + new_id + "')";
                            newdiv += '<table style="width:100%; margin-bottom:2px">';
                            newdiv += '<tr><td><input type="radio" style="width:30px; height:30px; margin-right:10px" name="rdogroup_' + new_id + '" onclick="change_search_type(0,'
                                + new_id + ')"><label style="display:inline-block; vertical-align:top; margin-top:8px">Code</label></td>';
                            newdiv += '<td><input type="radio" checked="checked" style="width:30px; height:30px; margin-right:10px" name="rdogroup_' + new_id + '" onclick="change_search_type(1,'
                                + new_id + ')"><label style="display:inline-block; vertical-align:top; margin-top:8px">Name</label></td>';
                            newdiv += '<td style="text-align:right"><input type="button" value="Select All" style="margin:5px 0px; padding:4px 10px; color:white; background-color:#337ab7; font-size:10pt; box-shadow:2px 2px 3px black; border:2px solid white; border-radius:20px" onclick ="'
                                + param + '"></td></tr></table>';
                            newdiv += '<input type="text" style="width:97%; font-size:12pt; height: 30px; padding-left:5px; box-shadow:2px 2px 3px black; border:2px solid white; border-radius:0px 20px 20px 0px; background-image: url(images/search4.png); background-repeat:no-repeat; background-position: 99% center; background-size: 29px 29px" id="inv_item_Search_'
                                + new_id + '" placeholder="Enter product code or name...">';

                            // // Adding Bucket ////
                            newdiv += '<ul id="product_list" style="width: 90%; margin-bottom:5px; padding: 0; background-color: white; text-align: left; border-style: solid; border-width: 1px; border-color: #337ab7"></ul>';
                            newdiv += '<div style="width:99%; overflow:auto; border: 1px solid gray">';
                            newdiv += '<table class="cls_tbl_inv" id="tbl_bucket_data_' + new_id + '" border="1" style="width:200%; height:auto; text-align:center">';
                            newdiv += '<tr><td style="width:10%">Check</td><td style="width:10%">Point</td><td style="width:30%">Product Name</td><td style="width:10%">Qty</td><td style="width:20%">Price</td><td style="width:20%">Total</td></tr>';

                            for (e = 0; e < ans_info_Array.length; e++) {
                                var prod_point = ans_info_Array[e].item_point;
                                var prod_name = ans_info_Array[e].check_box;
                                var prod_qty = ans_info_Array[e].item_qty;
                                var prod_price = ans_info_Array[e].item_price;
                                var prod_total = ans_info_Array[e].item_mul;
                                newdiv += '<tr><td><input type="checkbox" checked="checked" name="inv_chkgroup_'
                                    + new_id
                                    + '" id="inv_chk_'
                                    + new_id
                                    + '_'
                                    + inv_item_Counter
                                    + '"value="'
                                    + prod_name
                                    + '" style="width:23px; height: 23px"></td>';
                                newdiv += '<td><input type="number" value="'
                                    + prod_point
                                    + '" id="inv_point_'
                                    + new_id
                                    + '_'
                                    + inv_item_Counter
                                    + '" style="color:gray; background-color:#F0F0F0; width:80%; height: 20px; font-size: 10pt; font-family: calibri; border-radius:5px; text-align:center" disabled></td>';
                                newdiv += '<td><label id="inv_chk_lbl_' + new_id + '_'
                                    + inv_item_Counter + '">' + prod_name
                                    + '</label></td>';
                                newdiv += '<td><input type="number" id="inv_qty_'
                                    + new_id
                                    + '_'
                                    + inv_item_Counter
                                    + '" value="'
                                    + prod_qty
                                    + '" style="width:80%; height: 20px; color:gray; font-size: 10pt; font-family: calibri; border-radius:5px; text-align:center"></td>';
                                newdiv += '<td><input type="number" id="inv_price_'
                                    + new_id
                                    + '_'
                                    + inv_item_Counter
                                    + '" value="'
                                    + prod_price
                                    + '" style="width:80%; height: 20px; color:gray; font-size: 10pt; font-family: calibri; border-radius:5px; text-align:center" disabled></td>';
                                newdiv += '<td><input type="number" id="inv_mul_ans_'
                                    + new_id
                                    + '_'
                                    + inv_item_Counter
                                    + '" value="'
                                    + prod_total
                                    + '" style="width:80%; height: 20px; color:gray; font-size: 10pt; font-family: calibri; border-radius:5px; text-align:center" disabled></td></tr>';
                            }

                            newdiv += '</table></div>';
                            // newdiv += '<div id="div_item_Bucket_' + btnInv_Counter
                            // + '" style="border:1px solid gray; padding:5px"></div>';

                            if (answer == '' || answer == null || answer == undefined) {
                                var total_items = '';
                                var total_points = '';
                                var grand_total = '';
                            } else {
                                var total_items = ans_ans_Array[0].total_items;
                                var total_points = ans_ans_Array[0].total_points;
                                var grand_total = ans_ans_Array[0].grand_total;
                            }

                            // /// Adding Get Invoice Button ////
                            newdiv += '<hr noshade style="width:63%; margin-right:2%; float:right; border: solid 1px #505050"><br/>';
                            newdiv += '<table style="width:63%; height:auto; margin-left:33%">';
                            newdiv += '<tr><td style="width:50%; padding:5px"><label style="float:right; margin-top:4%">Total Items: </label></td><td style="width:50%; padding:5px"><input type="text" id="inv_item_ans_'
                                + new_id
                                + '" value="'
                                + total_items
                                + '" style="color:black; background-color:#F0F0F0; width:99%; height:25px; font-size: 10pt; font-family: calibri; height: 100%; border-radius:5px; text-align:center" disabled/></td></tr>';
                            newdiv += '<tr><td style="width:50%; padding:5px"><label style="float:right; margin-top:4%">Total Points: </label></td><td style="width:50%; padding:5px"><input type="text" id="inv_point_ans_'
                                + new_id
                                + '" value="'
                                + total_points
                                + '" style="color:black; background-color:#F0F0F0; width:99%; height:25px; font-size: 10pt; font-family: calibri; height: 100%; border-radius:5px; text-align:center" disabled/></td></tr>';
                            newdiv += '<tr><td style="width:50%; padding:5px"><label style="float:right; font-weight:bold; margin-top:4%">TOTAL: </label></td><td style="width:50%; padding:5px"><input type="text" id="inv_sum_ans_'
                                + new_id
                                + '" value="'
                                + grand_total
                                + '" style="color:black; background-color:#F0F0F0; width:99%; height:25px; font-size: 11pt; font-weight:bold; font-family: calibri; height: 100%; border-radius:5px; text-align:center" disabled/></td></tr>';
                            newdiv += '<tr><td style="width:50%"></td><td style="width:50%"><input type="button" style="width:99%; font-family: calibri; height: 25px; padding:1px; color:white; background-color:#337ab7; font-size:10pt; box-shadow:2px 2px 3px black; border:2px solid white; border-radius:20px" value="Get Invoice" onclick="get_item_price('
                                + i
                                + ','
                                + new_id
                                + ')" '
                                + enable_disable
                                + '/></td></tr>';
                            newdiv += '</table>';
                        }

                        newdiv += '</div>';

                        // btnInv_Counter++;
                    }

                    // Get Search Button (print dependent values to multiple numeric box
                    // (e.g. customer details))
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

                                        if (jsonObj[i].ans == '') {
                                            var ele_ans = '';
                                        }
                                        else {
                                            var ele_ans = jsonObj[i].ans[0];
                                        }

                                        data.push({
                                            ele_id: new_id,
                                            ele_type: ele_type,
                                            ele_ans: ele_ans,
                                            dep_ans: dep_ans,
                                            dep_class: dep_class,
                                            glob_class: glob_class,
                                            dep_type: t_dep_type,
                                            dep_type20_checksheet_id: jsonObj[i].dependency[j].dep_type20_checksheet_id,
                                            dep_type20_que_id: jsonObj[i].dependency[j].dep_type20_que_id
                                        });




                                    }
                                }

                                if (data.length > 0) {
                                    // if answer is displaying and filled then fire type20 dependency
                                    if ($('#div_S_Search_' + new_id + '').is(':hidden')) { }
                                    else {
                                        if (jsonObj[i].ans == '') { }
                                        else {
                                            Type20_Dep_Array.push({ id: new_id, val: jsonObj[i].ans[0] });
                                        }
                                    }
                                }
                            }
                        }

                        var misc_Array = jsonObj[i].prop[0].misc_data;

                        if (misc_Array[0].value == "") {
                            misc_Array[0].value = [];
                        }
                        var value = itemObj._checkStrObj(misc_Array[0].value);

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

                        for (k = 0; k < Fill_Data.length; k++) {
                            var editable = Fill_Data[k].editable;
                            if (editable != 'hidden') {
                                Show_class_Array.push(Fill_Data[k].classname);
                            }
                            if (editable == 'false') {
                                Disable_class_Array.push(Fill_Data[k].classname);
                            }
                        }


                        //if (jsonObj[i].prop[0].is_hide == "true") {
                        //    newdiv += '<div id="div_Search_' + new_id + '" style="display:none; padding:10px" class="li_no_chk ' + ele_class + '">';
                        //} else if (ele_class == "" || form_flag == 2) {
                        //    newdiv += '<div id="div_Search_' + new_id + '" style="padding:10px">';
                        //} else {
                        //    newdiv += '<div id="div_Search_' + new_id + '" class="' + ele_class + '" style="display:none; padding:10px">';
                        //}

                        var add_cust_from_search = push_data[0].add_cust_from_search;                       //added this key for ATC (add new customer from search string) [atc.bb - 03052021]
                        if (add_cust_from_search == "" || add_cust_from_search == null || add_cust_from_search == undefined || add_cust_from_search == "0") {
                            add_cust_from_search = "false";
                        }

                        var type20_is_hide = jsonObj[i].prop[0].is_hide;
                        newdiv += '<div id="div_Search_' + new_id + '" class="cntrl_main_div ' + ele_class + '" is_hide="' + type20_is_hide + '" style="' + disp_cntrl + '" ' + cls_enable + ' ' + common_str + '>';
                        newdiv += label_str;

                        if (add_cust_from_search == "true") {

                            //new development for ATC battery bank [haresh1.vt - 01062021]
                            var param_keyup = "change_flag_for_text_cust_addition('" + new_id + "')";
                            var param_cust_add = "get_popup_to_add_item_online('" + customer_checksheetid + "', '" + add_cust_from_search + "', '" + new_id + "')";
                            var param_cust_search = "open_dropdown_popup_for_cust_search(this)";
                            newdiv += '<div class="item-input item-input-field form-div add-cust-outer" style="width:100% !important;">';

                            if (jsonObj[i].ans == '') {
                                newdiv += '<input type="text" id="type20_txt_' + new_id + '" onkeyup="' + param_keyup + '" style="width:75% !important;" class="form-ele" placeholder="Add New Cell...">';
                            }
                            else {
                                var ans_value = jsonObj[i].ans[0];
                                var ans_id = jsonObj[i].ans[1];
                                newdiv += '<input type="text" id="type20_txt_' + new_id + '" value="' + ans_value + '" value1="' + ans_id + '" name="1" cust_add_flag="1"  onkeyup="' + param_keyup + '" style="width:75% !important;" class="form-ele" placeholder="Add New Cell...">';
                            }

                            newdiv += '<i id="addCust_txtbox_' + new_id + '" class="fa form-ico fa-plus" onclick="' + param_cust_add + '" style="margin-right:30px;margin-top:5px;padding:0 10px;display:inline; visibility:visible"></i>';
                            newdiv += '<i id="searchCust_txtbox_' + new_id + '" class="fa form-ico fa-search" onclick="' + param_cust_search + '" style="padding-left:10px;margin-top:-8.5%;display:inline; visibility:visible"></i>';
                            newdiv += '</div>';
                            //newdiv += '</div>';
                        }

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
                                    var get_value = push_array[p];
                                    var value_type = get_value.substring(2, 1);
                                    var sub_get_value = get_value.substring(2, get_value.length - 2);
                                } else {
                                    var get_value = push_array[p].value;
                                    var value_type = get_value.substring(2, 1);
                                    var sub_get_value = get_value.substring(2, get_value.length - 2);
                                }
                                if (value_type == "@") {
                                    if (jsonObj[i].ans != '') {
                                        // blank searchable controls should not open if it is hidden with dependency in fillter form if ans is blank 12042024
                                        Type20_class_Array.push(sub_get_value);
                                    }
                                }
                            }
                        }

                        var customer_checksheetid = push_data[0].customer_checksheetid;

                        if (value_new == '' || value_new == null || value_new == undefined) {
                            var columndata_Array = value[0].columndata;
                            if (columndata_Array == '' || columndata_Array == null || columndata_Array == undefined) {
                                var sorted_columndata_Array = [];
                            } else {
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

                        if (read_only == true) {
                            let summary_str = get_summary_str(new_id, prop_name, jsonObj[i].ans[0], check_type, que_id);
                            newdiv += summary_str;
                            newdiv += '</div>';
                        }
                        else {

                            if (view_style == 'dropdownview') {
                                // dropdownview

                                if (jsonObj[i].ans == '') {
                                    ans_value = [];
                                    ans_id = [];

                                    if (default_value == '' || default_value == null || default_value == undefined) { }
                                    else {
                                        ans_id = default_value[0].id;
                                        ans_value = default_value[0].text;
                                    }
                                }
                                else {
                                    var ans_value = jsonObj[i].ans[0];
                                    var ans_id = jsonObj[i].ans[1];
                                }

                                if (search_box == 'true') { }
                                else {
                                    var is_reset = jsonObj[i].prop[0].is_reset;

                                    //if (is_reset == 'true') {
                                    //    ans_value = '';
                                    //    ans_id = '';
                                    //}

                                    //if (form_flag != 2 && form_flag != 3) {
                                    if (form_flag == 2) { }
                                    else {
                                        // don't want to fill type20 dropdown in collapsible step

                                        if (ans_value == "" || ans_value == null || ans_value == undefined) {
                                            var t_ans_value = "";
                                        }
                                        else {
                                            var t_ans_value = ans_value;
                                        }

                                        var ddl_obj = {
                                            'new_id': new_id,
                                            'TableName': TableName,
                                            'JoinTableName': JoinTableName,
                                            'Checksheet_id': Checksheet_id,
                                            'window_style': window_style,
                                            'view_style': view_style,
                                            'push_data': push_data,
                                            'que_id': jsonObj[i].que_id,
                                            'valid': jsonObj[i].prop[0].valid,
                                            'is_reset': is_reset,
                                            "value_new": value_new,
                                            "customer_checksheetid": customer_checksheetid,
                                            "answer": t_ans_value
                                        };

                                        Type20_AutoFill_DDL_Array.push(ddl_obj);

                                        // 24072019 - metal change
                                        //if (is_reset == 'true' || ans_value == "" || ans_value.length == 0) {                         //commented for invoice edit issue in UrbanJungle(26122019)
                                        //    Type20_AutoFill_DDL_Array.push(ddl_obj);
                                        //}
                                    }
                                }

                                if (enable_disable == 'disabled') {
                                    var ico_str = 'fa-ban';
                                }
                                else {
                                    var ico_str = 'fa-search';
                                }

                                if (search_box == 'true') {
                                    var onclick_str = "setclick('" + new_id + "')";
                                    newdiv += '<div class="item-input item-input-field" style="width:93%" ' + enable_disable + '>';
                                    newdiv += '<input type="text" id="ddd_search_type20_text_' + new_id + '" style="white-space: pre; word-break: break-word" class="form-ele" onclick="' + onclick_str + '">';

                                    var param_ddl_search = "get_data_by_dropdown_search('" + new_id + "', '" + TableName + "', '" + JoinTableName + "','" + Checksheet_id + "')";
                                    newdiv += '<i id="ddl_search_btn_' + new_id + '" class="fa fa-search form-ico" style="margin-top:6px" onclick="' + param_ddl_search + '" ' + enable_disable + '></i>';
                                    newdiv += '</div>';
                                }

                                if (customer_checksheetid == "" || customer_checksheetid == null || customer_checksheetid == undefined || customer_checksheetid == "0") {
                                    customer_checksheetid = "";
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

                                if (QR_Code == 'true') {
                                    var param_qr = "get_qr_and_search_data('" + new_id + "', '" + TableName + "', '" + JoinTableName + "','" + Checksheet_id + "')";
                                    var qr_ico_str = '<i id="btn20_QR_' + new_id + '" class="fa form-ico fa-qrcode selection-scanner" ' + enable_disable + ' style="margin-right:30px;margin-top:-10%;" onclick="event.stopPropagation(); ' + param_qr + '" ></i>';
                                    var ddl_width = ""
                                }
                                else if (Barcode == 'true') {
                                    var param_qr = "get_barcode_and_search_data('" + new_id + "', '" + TableName + "', '" + JoinTableName + "','" + Checksheet_id + "')";
                                    var qr_ico_str = '<i id="btn20_QR_' + new_id + '" class="fa form-ico fa-barcode selection-scanner" ' + enable_disable + ' style="margin-right:30px;margin-top:-10%;" onclick="event.stopPropagation(); ' + param_qr + '" ></i>';
                                    var ddl_width = ""
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
                                    var ddl_param = "get_filled_dropdown_data('" + new_id + "', '" + TableName + "', '" + JoinTableName + "','" + Checksheet_id + "', '" + customer_checksheetid + "', '" + ddl_info_view + "', '" + autofill + "', '" + add_cust_from_search + "')";
                                }

                                if (add_cust_from_search == "true") {
                                    var disp_type20_ddl = "display:none;"
                                }
                                else {
                                    var disp_type20_ddl = "";
                                }

                                newdiv += '<div class="item-input item-input-field form-div type20-ddl-outer" style="' + ddl_width + disp_type20_ddl + '" onclick="' + ddl_param + '" ' + enable_disable + '><img id="ddl_loading_' + new_id + '" src="images/loading_type20.gif" style="position: absolute; left: 50%; top: 7px; display:none">';

                                var multi_select = push_data[0].multi_select;
                                if (multi_select == "true") {
                                    newdiv += '<select multiple name="1" id="ddl_search_type20_' + new_id + '" style="width:96%; display:inline-block;color:#000;opacity:1;" disabled="disabled" '
                                        + enable_disable + '>';

                                    if (ans_id == "" || ans_id == null || ans_id == undefined) {
                                        newdiv += '<option value="0" selected="selected">Select Value</option>';
                                    }
                                    else {
                                        newdiv += '<option value="0">Select Value</option>';
                                        var ans_id_Array = ans_id.split(',');
                                        var ans_value_Array = ans_value.split(',');
                                        for (a = 0; a < ans_id_Array.length; a++) {
                                            newdiv += '<option selected = "selected" value = "' + ans_id_Array[a] + '" > ' + ans_value_Array[a] + '</option >';
                                        }
                                    }

                                    newdiv += '</select>' + (qr_ico_str || '<i class="fa ' + ico_str + ' form-ico"></i>') + '</div>';
                                }
                                else {
                                    var ios_device = localStorage.getItem('ios_device');
                                    if (ios_device == 'iphone' || F7_device == 'android') {
                                        var op_str = '<option value="0">Select Value</option>';
                                    }
                                    else {
                                        var op_str = '';
                                    }

                                    var view_style = push_data[0].view_style;
                                    newdiv += '<select name="1" id="ddl_search_type20_' + new_id + '" style="width:96%; display:inline-block;color:#000;opacity:1;" view_style="' + view_style + '" disabled="disabled" '
                                        + enable_disable + '>' + op_str + '<option selected="selected" value="' + ans_id + '" value1="' + ans_id + '">' + ans_value + '</option></select>' + (qr_ico_str || '<i class="fa ' + ico_str + ' form-ico"></i>') + '</div>';
                                }


                                //smart-select
                                //newdiv += '<a href="#" class="item-link smart-select" data-searchbar="true" data-back-on-select = "true" data-searchbar-placeholder="Search ' + prop_name + '..." style="text-decoration: none;">';
                                //newdiv += '<select class="form-control" name="1" id="ddl_search_type20_' + new_id + '" style="width:88%;" ' + enable_disable + '>' + op_str + '<option selected="selected" value="' + ans_id + '">' + ans_value + '</option></select>';
                                //newdiv += '<div class="item-content" style="padding-left: 0px !important;min-height:38px !important;"><div class="item-inner" style="min-height:38px !important;background-image: none;padding: 0px !important;">';
                                //newdiv += '<div class="item-after"  id="ddl_lbl_search_type20_' + new_id + '" style="color:#000 !important;font-size:16px !important;margin-left:0px !important;">' + ans_value + '</div><i class="fa ' + ico_str + ' form-ico"></i></div></div></a>';
                                //newdiv += '</div>';

                                newdiv += '<input id="hdn_target_id_array_' + new_id + '" type="hidden">';
                                newdiv += '<input id="hdn_multi_autobind_child_data_' + new_id + '" type="hidden">';
                                newdiv += '<input id="hdn_condition_data_' + new_id + '" type="hidden" value=' + encodeURIComponent(JSON.stringify(condition_data)) + '>';
                                newdiv += '<input id="hdn_select_all_fill_data_' + new_id + '" type="hidden" value=' + encodeURIComponent(JSON.stringify(Fill_Data)) + ' autofill_form_flag = "' + form_flag + '">';
                                newdiv += '</div>';
                            } else {
                                // tableview/listview
                                var param = "popup_search_items_show_type20('" + new_id + "', '" + TableName + "', '" + JoinTableName + "','" + Checksheet_id + "','" + window_style + "')";
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
                                    param1 = '';
                                    param = '';
                                    param_qr = '';
                                }

                                if (jsonObj[i].prop[0].is_reset == 'true' && read_only == false) {
                                    var ans_str = [""];
                                }
                                else {
                                    var ans_str = jsonObj[i].ans;
                                }

                                var customer_checksheetid = push_data[0].customer_checksheetid;
                                var obj = {
                                    read_type: 'readsurvey',
                                    ans: ans_str,
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
                        }
                    }

                    // // Get Single Search Button (print dependent values to ul li
                    // only)
                    // // (e.g. customer names)
                    else if (jsonObj[i].type == 21) {
                        var misc_Array = jsonObj[i].prop[0].misc_data;
                        if (misc_Array[0].value == "") {
                            misc_Array[0].value = [];
                        }
                        var value = itemObj._checkStrObj(misc_Array[0].value);  // check_item

                        newdiv += '<div id="div_S_Search_' + new_id + '" class="cntrl_main_div ' + ele_class + '" form_mode="readsurvey" style="' + disp_cntrl + '" ' + cls_enable + ' ' + common_str + '>';

                        if (value == '' || value == null || value == undefined) {
                        }
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

                        if (jsonObj[i].prop[0].is_reset == 'true' && read_only == false) {
                            var ans_str = [""];
                        }
                        else {
                            var ans_str = jsonObj[i].ans;
                        }

                        var obj = {
                            read_type: 'readsurvey',
                            ans: ans_str,
                            new_id: new_id,
                            value: jsonObj[i].value,
                            default_val: default_val,
                            enable_disable: enable_disable,
                            param1: param1,
                            clickcheck: clickcheck
                        }

                        if (read_only == true) {
                            let summary_str = get_summary_str(new_id, prop_name, ans_str, check_type, que_id);
                            newdiv += summary_str;
                        }
                        else {
                            newdiv += label_str;
                            var control = new MkControls(obj);
                            newdiv += control.build_type_21_s_search();

                            // // Adding UL List below search box ////
                            newdiv += '<ul id="S_Search_item_list_' + new_id
                                + '" style="width: 85%; margin-top:-2px; height:auto; max-height:140px; overflow:auto; margin-bottom:5px; padding: 0; background-color: white; text-align: left; position:absolute; z-index:50"></ul>';
                        }
                        newdiv += '</div>';
                    }

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
                        // // inv_display_flag = "1";
                        // json_inv = collapse_Json1[0].Fill_Data;
                        // var table_name_inv = collapse_Json1[0].Table_Name;
                        // var temp_inv_display_flag = inv_display_flag;
                        //					

                        collapse_Json1[0].view_type = 1;               //default listview for mobile [22092021] ['0' means tableview & '1' means listview]

                        var inv_display_flag = collapse_Json1[0].view_type;
                        var type22_button_str = collapse_Json1[0].btn_str;
                        if (type22_button_str == '' || type22_button_str == null || type22_button_str == undefined) {
                            type22_button_str = "Add Record";
                        }
                        json_inv = collapse_Json1[0].Fill_Data;

                        inv_display_flag_array.push(collapse_Json1[0].view_type);
                        json_inv_array.push(collapse_Json1[0].Fill_Data);
                        inv_Calc_new_array.push(new_id);
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

                        var table_name_inv = collapse_Json1[0].Table_Name;
                        var temp_inv_display_flag = inv_display_flag;
                        // var temp_inv_display_flag = 1;

                        // inv_Calc_new = new_id;

                        //type22 single control UI changes [26112021]
                        var control_type = get_search_ctrl_type(json_inv);
                        var inner_form_data = json_inv[0].type;
                        var type22_snglCntrl_type = 0;
                        var type22_json_len = json_inv.length;
                        if (type22_json_len == 1 && control_type == '20') {
                            if (json_inv[0].type.length == 1) {
                                type22_snglCntrl_type = json_inv[0].type[0].type;
                            }
                            else {
                                type22_snglCntrl_type = json_inv[0].type[1].type;
                            }
                        }

                        newdiv += '<div id="div_Inv_Calculate_' + new_id + '" class="cntrl_main_div ' + ele_class + '" form_mode="readsurvey" style="' + disp_cntrl + '" ' + cls_enable + ' ' + common_str + '>';
                        newdiv += label_str;

                        var ans = jsonObj[i].ans[0];
                        if (jsonObj[i].prop[0].is_reset == 'true' && read_only == false) {
                            ans = "";
                        }

                        if (ans == "" || ans == null || ans == undefined || ans == '""') {
                            row_counter = 0;
                            var json_inv_calc = [{ "row_finaljson": [] }];
                        }
                        else {
                            var json_inv_calc = itemObj._checkStrObj(jsonObj[i].ans[0]);  		// check_item

                            if (Array.isArray(json_inv_calc)) { }
                            else {
                                json_inv_calc = [json_inv_calc];
                            }

                            row_counter = json_inv_calc[0].txt_row_counter;
                            if (row_counter == "" || row_counter == null || row_counter == undefined) {
                                var row_counter = json_inv_calc[0].row_finaljson.length;
                            }
                            else {
                                //var row_finaljson_length = json_inv_calc[0].row_finaljson.length;
                                //if (row_counter != row_finaljson_length) {
                                //    row_counter = row_finaljson_length;
                                //}
                            }

                            row_counter = parseInt(row_counter);
                        }

                        newdiv += "<div id='div_singleInvoice_cntrl_" + new_id + "'></div>";
                        newdiv += "<input type='hidden' id='hdn_type22_json_len_" + new_id + "' value='" + json_inv.length + "' type22_snglCntrl_type='" + type22_snglCntrl_type + "' type22_que_id='" + jsonObj[i].que_id + "'>";

                        newdiv += "<div id='div_display_" + new_id + "' class='form-div'>";

                        newdiv += "<input type='hidden' id='hdn_hide_blank_" + new_id + "' value='" + hide_blank + "'>";
                        newdiv += "<input type='hidden' id='hdn_jsondata_" + new_id + "' value='" + JSON.stringify(json_inv) + "'>";
                        newdiv += "<input type='hidden' id='hdn_inv_row_counter_" + new_id + "' index='" + jsonObj[i].que_id + "' value=" + row_counter + ">";
                        newdiv += "<input type='hidden' id='hdn_inv_tablename_" + new_id + "' value='" + table_name_inv + "'>";
                        newdiv += '<input type="hidden" id="row_index_' + new_id + '" value="' + row_counter + '" />';

                        newdiv += "<input type='hidden' id='hdn_listview_label_" + new_id + "' value='" + listview_label + "'>";
                        newdiv += "<input type='hidden' id='hdn_btn_congfiure_" + new_id + "' add_button='" + add_button + "' edit_button='" + edit_button + "' delete_button='" + delete_button + "' max_record='" + max_record + "' min_record='" + min_record + "'>";

                        // Type22 dependency
                        var ref_class = collapse_Json1[0].ref_class;
                        if (ref_class == '' || ref_class == null || ref_class == undefined) { }
                        else {
                            Show_class_Array.push(ref_class);

                            var greater_class = collapse_Json1[0].greater_class;
                            if (greater_class == '' || greater_class == null || greater_class == undefined) { }
                            else {
                                var type22_dep_Data = [];
                                type22_dep_Data.push({
                                    'ref_class': collapse_Json1[0].ref_class,
                                    'greater_class': collapse_Json1[0].greater_class,
                                    'less_class': collapse_Json1[0].less_class,
                                    'new_id': new_id,
                                    'dep_type': '5'
                                });

                                var json_data = JSON.stringify(type22_dep_Data);
                                newdiv += "<input type='hidden' id='hdn_inv_dep_" + new_id + "' value='" + json_data + "'>";
                                dependency_Array.push(type22_dep_Data);
                            }
                        }
                        //////

                        var num_row = json_inv.length;
                        type22_new_id = new_id;
                        var invoice_action_data = '';

                        if (temp_inv_display_flag == 0) {
                            // Table View

                            var table_div_data = "<div id='div_sum_" + new_id + "' style='overflow-y: hidden; overflow-x: hidden; overflow: auto; max-width:100%; text-align:center'>";
                            table_div_data += "<table id='tbl_row_data_" + new_id + "'><tr>";

                            var sum_div = '';

                            if (form_flag != 2) {
                                table_div_data += "<th style='background-color: #F0F0F0; border:1px solid #ccc; width:25px'></th><th style='background-color: #F0F0F0; border:1px solid #ccc; width:25px'></th>";
                            }

                            for (var n = 0; n < num_row; n++) {
                                var th_column_id = json_inv[n].id;
                                var th_name = json_inv[n].name;
                                var th_display = json_inv[n].display;

                                var css_th = 'table-cell';
                                if (th_display == "1") {
                                    css_th = 'none';
                                }

                                // var td_sum = $("#ddl_sum" + i + "").val();
                                table_div_data += "<th id='th_txt_prduct_name_" + new_id + '_' + n
                                    + "' style='background-color: #F0F0F0; width:100px; height:auto; margin-right:5px;  display:" + css_th
                                    + "; margin-left:5px; text-align:center; padding:7px; border:1px solid #ccc'><b>" + th_name + "</b></th>";
                            }
                            table_div_data += "</tr>";

                            for (var j = 1; j <= json_inv_calc[0].row_finaljson.length; j++) {

                                // it_id is type22 index no
                                var it_id = json_inv_calc[0].row_finaljson[j - 1].it_id;
                                if (it_id == '' || it_id == null || it_id == undefined) {
                                    it_id = j;
                                }

                                if (type22_json_len == 1 && control_type == '20') {
                                    table_div_data += "<tr id=tr_row_for_delete_" + new_id + '_' + it_id + " it_id=" + it_id + " style='text-align:left;display: inline;'>";
                                }
                                else {
                                    table_div_data += "<tr id=tr_row_for_delete_" + new_id + '_' + it_id + " it_id=" + it_id + " style='text-align:left;'>";
                                }

                                var btn_json = json_inv_calc[0].row_finaljson[j - 1].json_type_22[0].edt_btn_json;
                                var flag_value = 1;

                                var read_count_length = json_inv_array.length - 1;

                                //var param1 = 'return popup_search_items_show_type22("' + jsonObj[i].que_id + '","' + read_count_length + '","' + it_id + '","' + flag_value + '","")';
                                var param1 = 'return popup_search_items_show_type22("' + jsonObj[i].que_id + '","' + new_id + '","' + it_id + '","' + flag_value + '","")';
                                var param_delete = 'delete_row_from_table("' + jsonObj[i].que_id + '","' + new_id + '","' + it_id + '","' + flag_value + '","")';

                                var img_view = "block";
                                var dis_none = "";

                                if (form_flag == 2) {
                                    param1 = "";
                                    img_view = "none";
                                    dis_none = "display:none";

                                    if (form_flag == 3) {
                                        //param1 = 'return popup_search_items_show_type22("' + jsonObj[i].que_id + '","' + read_count_length + '","' + it_id + '","' + flag_value + '","")';
                                        param1 = 'return popup_search_items_show_type22("' + jsonObj[i].que_id + '","' + new_id + '","' + it_id + '","' + flag_value + '","")';
                                        param_delete = 'delete_row_from_table("' + jsonObj[i].que_id + '","' + new_id + '","' + it_id + '","' + flag_value + '","")';
                                        img_view = "block";
                                        dis_none = "";
                                    }
                                }

                                table_div_data += "<td style='padding:7px 10px; border:1px solid #ccc; " + dis_none + "'><button type='button' class='button' aria-label='Edit item' id='btn_edit_td_"
                                    + new_id + '_' + it_id + "' onclick='" + param1 + "' alt='" + JSON.stringify(btn_json) + "' style='display:" + img_view + "' " + enable_disable + "><i class='fa fa-pencil' aria-hidden='true'></i></button></td>";
                                table_div_data += "<td style='padding:7px 10px; border:1px solid #ccc; " + dis_none + "'><button type='button' class='button color-red' aria-label='Remove item' id='btn_delete_td_"
                                    + new_id + '_' + it_id + "' onclick='" + param_delete + "' style='display:" + img_view
                                    + "' " + enable_disable + "><i class='fa fa-trash' aria-hidden='true'></i></button><input type='hidden' id='hdn_tr_delete_" + new_id + "_" + it_id + " value='0'></td>";

                                for (p = 0; p < num_row; p++) {
                                    var th_column_id = json_inv[p].id;
                                    var th_name = json_inv[p].name;
                                    var ddl_datatype = json_inv[p].type;
                                    var ddl_auto = json_inv[p].auto;
                                    var madatory = json_inv[p].mandatory;
                                    var td_sum = json_inv[p].sum;
                                    var ddl_equation = json_inv[p].equation;
                                    var display_value = json_inv[p].display;
                                    // var value = json_inv_calc[k].txt_row_value;

                                    //if (p >= txt_row_ary.length && num_row > txt_row_ary.length) {
                                    //    //when template and log were mis-matched
                                    //    var value = "";
                                    //    var txt_row_id = "";
                                    //}
                                    //else {
                                    //    var value = txt_row_ary[p].txt_row_value;
                                    //    var txt_row_id = txt_row_ary[p].txt_row_id;
                                    //}

                                    //match que_id in case of column exchange/mis-match [demo85.sales/demo85.mng ---(22072020)]
                                    if (json_inv[p].type[0].type == 5) {
                                        var template_que_id = json_inv[p].type[1].que_id;
                                    }
                                    else {
                                        var template_que_id = json_inv[p].type[0].que_id;
                                    }

                                    var txt_row_ary = json_inv_calc[0].row_finaljson[j - 1].json_type_22[0].txt_row;

                                    var value = "";
                                    var txt_row_id = "";
                                    for (var t = 0; t < txt_row_ary.length; t++) {
                                        var ans_que_id = txt_row_ary[t].row_que_id;
                                        if (template_que_id == ans_que_id) {
                                            var value = txt_row_ary[t].txt_row_value;
                                            var txt_row_id = txt_row_ary[t].txt_row_id;
                                            break;
                                        }
                                    }


                                    if (value == "" || value == null || value == undefined) {
                                        value = '';
                                    }

                                    var css_display_td = "table-cell";
                                    if (display_value == "1") {
                                        table_div_data += "<input type='hidden' id='hdn_hide_pass_value_" + new_id + '_' + it_id + '_' + p + "' value=" + value + ">";
                                        css_display_td = "none";
                                    }

                                    if (json_inv[p].type[0].type == 5) {
                                        var json_inv_type = json_inv[p].type[1].type;
                                        var filled_obj = json_inv[p].type[1];
                                    }
                                    else {
                                        var json_inv_type = json_inv[p].type[0].type;
                                        var filled_obj = json_inv[p].type[0];
                                    }


                                    if (json_inv_type == '7' || json_inv_type == '9' || json_inv_type == '11') {
                                        table_div_data += "<td style='width:100px; padding:2px; display:" + css_display_td + "; border:1px solid #ccc'>";
                                        if (value == "" || value == null || value == undefined) {
                                            table_div_data += "<label id='txt_add_row_" + new_id + '_' + it_id + '_' + p + "' src=''></label>";
                                        }
                                        else {

                                            let type22_img_que_id = filled_obj.que_id;
                                            let t_row_index_no = it_id;
                                            let p_name = filled_obj.ans[1];
                                            var param1 = 'bind_unavailable_images("txt_add_row_' + new_id + '_' + it_id + '_' + t_row_index_no + '", "' + p_name + '","' + step + '", "' + check_type + '", "' + jsonObj[i].que_id + '", "' + type22_img_que_id + '", "' + t_row_index_no + '")';

                                            table_div_data += "<img id='txt_add_row_" + new_id + '_' + it_id + '_' + p + "' src='" + value
                                                + "'  onerror='" + param1 + "' style='vertical-align:middle;border-radius:7px;padding:5px; width:50px; height:50px;' /'>";
                                        }
                                        table_div_data += "</td>";

                                    } else if (json_inv_type == '20') {
                                        table_div_data += "<td style='width:100px; padding:2px;display:" + css_display_td + "; border:1px solid #ccc'><label title='"
                                            + txt_row_id + "' id='txt_add_row_" + new_id + '_' + it_id + '_' + p
                                            + "' style='width:100px;height:auto; margin-right:5px; margin-left:5px;' disabled>" + value + "</label></td>";
                                    }
                                    else if (json_inv_type == '26') {
                                        var edt_btn_json = json_inv_calc[0].row_finaljson[j - 1].json_type_22[0].edt_btn_json;
                                        if (edt_btn_json[0].type == 5) {                        //handling for JSON with label and without label [20052021]
                                            var edt_btn_json_index = (p * 2) + 1;
                                        }
                                        else {
                                            var edt_btn_json_index = p;
                                        }

                                        var type23_popup = $('.popup-type23:visible');
                                        if (type23_popup.length > 0) {
                                            var down_checksheetid = collapse_Json[0].checksheet_id;
                                        }
                                        else {
                                            var down_checksheetid = check_type;
                                        }

                                        if (form_flag == 2 || form_flag == 3) {
                                            var parent_task_id = collapse_Json[0].parent_task_id;
                                        }
                                        else {
                                            var parent_task_id = JSON.parse(storage.getItem('server_task_id'));
                                        }

                                        var ans_str = edt_btn_json[edt_btn_json_index].ans;

                                        if (ans_str == '' || ans_str == null || ans_str == undefined) {
                                            var act_file_name = '';
                                            var file_path = '';
                                        }
                                        else {
                                            var act_file_name = ans_str[0];
                                            var file_path = ans_str[1];
                                        }

                                        if (file_path == '' || file_path == null || file_path == undefined) {
                                            var file_path = ans_str[0];
                                        }

                                        var str = '';
                                        if (file_path == '' || file_path == null || file_path == undefined) {
                                            file_path = 'N/A';
                                        }
                                        else {
                                            var param_view = "check_down_doc_entry_attached('" + new_id + "_" + it_id + "','" + file_path + "','" + edt_btn_json[edt_btn_json_index].que_id + "', '" + down_checksheetid + "', '" + it_id + "', '" + i + "')";
                                            str += '<label class="filled-file" onclick="' + param_view + '" id="lbl_up_' + new_id + '" style="font-size:14px; word-break: break-word; color:blue">' + act_file_name + '</label>';
                                        }

                                        if (json_inv[p].type[0].type == 5) {
                                            var type26_json = json_inv[p].type[1];
                                        }
                                        else {
                                            var type26_json = json_inv[p].type[0];
                                        }

                                        if (file_path == '' || file_path == null || file_path == undefined) { }
                                        else {
                                            var sharepoint_link = ans_str[3];
                                            //var t_jsonObj = edt_btn_json[edt_btn_json_index];
                                            var t_jsonObj = type26_json;
                                            var misc_Array = t_jsonObj.prop[0].misc_data;
                                            var inner_type = misc_Array[0].type;
                                            if (inner_type == 7) {
                                                var base_path = misc_Array[0].base_path;
                                            }
                                            else {
                                                var value = JSON.parse(misc_Array[0].value);
                                                var base_path = value[0].base_path;
                                            }

                                            var param_down = "toggle_doc_download('" + new_id + "_" + it_id + "', '" + edt_btn_json[edt_btn_json_index].que_id + "', '" + upload_type + "', '" + act_file_name + "', '" + file_path + "', '" + base_path + "', '" + sharepoint_link + "', '" + parent_task_id + "')";
                                            table_div_data += '<a id="doc_down_' + new_id + '_' + it_id + '" name="0" onclick="' + param_down + '" style="font-weight:bold; visibility:hidden">Download Document</a>';
                                        }

                                        table_div_data += "<td style='width:100px; padding:2px;display:" + css_display_td + "; border:1px solid #ccc'><label title='"
                                            + txt_row_id + "' id='txt_add_row_" + new_id + '_' + it_id + '_' + p
                                            + "' style='width:100px;height:auto; margin-right:5px; margin-left:5px;' >" + str + "</label></td>";
                                    }
                                    else {
                                        table_div_data += "<td style='width:100px; padding:2px;display:" + css_display_td
                                            + "; border:1px solid #ccc'><label id='txt_add_row_" + new_id + '_' + it_id + '_' + p
                                            + "' style='width:100px;height:auto; margin-right:5px; margin-left:5px;' disabled>" + value + "</label></td>";
                                    }

                                }
                                table_div_data += "</tr>";
                            }
                            table_div_data += '</table></div><br>';
                            table_div_data += "<div id='div_list_display_sum_" + new_id + "' style='width:100%'></div>";
                            table_div_data += '<hr style="border:1px solid #ccc"><li style="padding-top:5px;border-radius:0px;list-style-type:none; width:100%" ><div style="position:relative; height:auto; ">';

                            var sum_count = 0;
                            for (m = 0; m < num_row; m++) {
                                var sum_class = json_inv[m].sum_class;
                                var td_sum = json_inv[m].sum;
                                var th_name = json_inv[m].name;
                                var bgcolor = json_inv[m].bgcolor;
                                if (bgcolor == undefined || bgcolor == null || bgcolor == "") {
                                    var color = 'black';
                                    var back_color = 'white';
                                }
                                else {
                                    var color = 'white';
                                    var back_color = bgcolor;
                                }

                                if (td_sum > 0) {
                                    if (sum_count == 0) {
                                        //table_div_data += '<div style="background-color:#ffffff;padding:5px"><label style="margin-top:8px; font-size: 14px; font-weight:bold; margin-left:5px;  width:100%;">Final Sum:</label></div>';
                                    }
                                    if (sum_count % 2 == 0) {
                                        table_div_data += '<div style="background-color:' + back_color + ';color:' + color + ';padding:5px; margin-bottom:10px"><table style="width: 100%;vertical-align: middle;">';
                                    } else {
                                        table_div_data += '<div style="background-color:' + back_color + ';color:' + color + ';padding:5px; margin-bottom:10px"><table style="width: 100%;vertical-align: middle;">';
                                    }
                                    table_div_data += '<tr><td class="type22-sum-header"><span class="list-ans" onclick="toggle_hidden_ans_data(this)">' + th_name + '</span></td>';

                                    if (row_counter == 0) {
                                        table_div_data += "<td id='sum_" + new_id + "_" + m + "' class='type22-sum-ans " + sum_class + "'><span class='list-ans' onclick='toggle_hidden_ans_data(this)'>0</span></td>";
                                    }
                                    else {
                                        //var value_sum = json_inv_calc[0].sum_finaljson[m].txt_sum_value;
                                        var value_sum_ary = json_inv_calc[0].sum_finaljson;
                                        if (m >= value_sum_ary.length && num_row > value_sum_ary.length) {
                                            //when template and log were mis-matched
                                            var value_sum = "";
                                        }
                                        else {
                                            var value_sum = value_sum_ary[m].txt_sum_value;
                                        }

                                        table_div_data += "<td id='sum_" + new_id + "_" + m + "' class='type22-sum-ans " + sum_class + "'><span class='list-ans' onclick='toggle_hidden_ans_data(this)'>" + value_sum + "</span></td>";
                                    }
                                    table_div_data += "</tr></table></div>";
                                    sum_count++;
                                }
                            }

                            table_div_data += "</div></li>";
                            table_div_data += "</ul>";

                            var read_count_length = json_inv_array.length - 1;

                            var param2 = "return popup_search_items_show_type22('" + jsonObj[i].que_id + "','" + new_id + "','" + read_count_length + "','" + 0 + "','" + temp_inv_display_flag + "')";
                            var img_view = "block";

                            if (form_flag == 2) {
                                param2 = "";
                                img_view = "none";
                                if (form_flag == 3) {
                                    param2 = "return popup_search_items_show_type22('" + jsonObj[i].que_id + "','" + new_id + "','" + read_count_length + "','" + 0 + "','" + temp_inv_display_flag + "')";
                                    img_view = "block";
                                }
                            }

                            for (var y1 = 0; y1 < num_row; y1++) {
                                var auto_hide_1 = json_inv[y1].auto;
                                var auto_value_array_1 = json_inv[y1].auto_value;
                                if (auto_value_array_1 == "" || auto_value_array_1 == null || auto_value_array_1 == undefined) {
                                    // old json
                                } else {
                                    if (auto_value_array_1.length == json_inv_calc[0].txt_row_counter) {
                                        img_view = "none";
                                        break;
                                    }
                                }
                            }

                            if (form_flag != 2) {
                                var disp_btn = "";
                                if (json_inv.length == 1 && control_type == '20') {
                                    var disp_btn = "display:none;";
                                }

                                invoice_action_data += '<div class="item-input item-input-field form-div array-field" style="' + disp_btn + '">';
                                if (add_button == "false") { }              //hide add record button [21102021]
                                else {
                                    invoice_action_data += '<a id="btn_add_row_' + new_id + '" onclick="' + param2 + '" style="display:' + img_view
                                        + ', margin-bottom:10px; width:auto;" data-popup=".popup-type22" class="button button-fill button-raised form-btn open-popup" ' + enable_disable + '>' + type22_button_str + '</a>';
                                }
                                invoice_action_data += '</div>';
                            }

                            table_div_data = invoice_action_data + table_div_data;
                            $("#div_display_" + new_id + "").append(table_div_data);
                            newdiv += table_div_data;
                        }
                        else {
                            // list view
                            var list_div_data = "<ul id='ul_outer_" + new_id + "'style='width:100%; background-color: white; text-align: left;'>";

                            if (type22_json_len == 1 && control_type == '20') {
                                list_div_data += "<div id='div_list_display_" + new_id + "' style='display:inline;width:auto'>";
                            }
                            else {
                                list_div_data += "<div id='div_list_display_" + new_id + "' style='width:100%'>";
                            }

                            var sum_div_data = '';
                            var sum_div = '';

                            // un used code start 
                            var que_id_json = [];
                            for (var x = 0; x < num_row; x++) {
                                var display = json_inv[x].display;
                                if (display == "1") {

                                    if (json_inv[x].type.length == 1) {
                                        var que_id_display = json_inv[x].type[0].que_id;
                                        var value_display = json_inv[x].type[0].value;
                                    }
                                    else {
                                        var que_id_display = json_inv[x].type[1].que_id;
                                        var value_display = json_inv[x].type[1].value;
                                    }
                                    que_id_json.push({
                                        "que_id_display": que_id_display,
                                        "value_display": value_display
                                    });
                                }
                            }
                            // un used code end

                            var display_row = 0;
                            for (var n = 1; n <= json_inv_calc[0].row_finaljson.length; n++) {
                                // var json_store = json_inv_calc[n - 1].json_type_22;
                                // var btn_json = json_store[0].edt_btn_json;
                                var btn_json = json_inv_calc[0].row_finaljson[n - 1].json_type_22[0].edt_btn_json;
                                // var btn_json = json_store[0].edt_btn_json;

                                var flag_value = 1;
                                var read_count_length = json_inv_array.length - 1;

                                // it_id is type22 index no
                                var it_id = json_inv_calc[0].row_finaljson[n - 1].it_id;
                                if (it_id == '' || it_id == null || it_id == undefined) {
                                    it_id = n;
                                }

                                if (type22_json_len == 1 && control_type == '20') {
                                    //list_div_data += '<li id="tr_row_for_delete_' + new_id + '_' + n + '" style="margin-top:15px; list-style-type:none;display:inline; ">';
                                    list_div_data += '<li id="tr_row_for_delete_' + new_id + '_' + it_id + '"  it_id="' + it_id + '" style="padding-bottom: 5px; border-radius: 0px; list-style-type:none; width:100%;display:inline;">';
                                    list_div_data += '<div style="padding: 0 5px!important; display: inline; ">';

                                }
                                else {
                                    list_div_data += '<li class="swipeout" id="tr_row_for_delete_' + new_id + '_' + it_id + '" it_id="' + it_id + '" style="padding-bottom: 5px; margin-top:0; list-style-type:none; width:100%;"><hr style="border:1px solid #ccc;margin-top:0px;">';

                                    //var param1 = "return popup_search_items_show_type22('" + jsonObj[i].que_id + "', '" + read_count_length + "', '" + n + "', '" + flag_value + "', '')";
                                    var param1 = "return popup_search_items_show_type22('" + jsonObj[i].que_id + "', '" + new_id + "', '" + n + "', '" + flag_value + "', '')";
                                    var param_delete = "delete_row_from_table('" + jsonObj[i].que_id + "', '" + new_id + "', '" + n + "', '" + flag_value + "', '')";
                                    var img_view = "block";

                                    if (form_flag == 2) {
                                        param1 = "";
                                        img_view = "none";
                                        if (form_flag == 3) {
                                            var param1 = "return popup_search_items_show_type22('" + jsonObj[i].que_id + "', '" + new_id + "', '" + n + "', '" + flag_value + "', '')";
                                            var param_delete = "delete_row_from_table('" + jsonObj[i].que_id + "', '" + new_id + "', '" + n + "', '" + flag_value + "', '')";
                                            img_view = "block";
                                        }
                                    }
                                }


                                if (type22_json_len == 1 && control_type == '20') {
                                    for (var a = 0; a < num_row; a++) {
                                        var th_column_id = json_inv[a].id;
                                        var th_name = json_inv[a].name;
                                        var ddl_datatype = json_inv[a].type;
                                        var ddl_auto = json_inv[a].auto;
                                        var madatory = json_inv[a].mandatory;
                                        var td_sum = json_inv[a].sum;
                                        var ddl_equation = json_inv[a].equation;
                                        var display_hide = json_inv[a].display;

                                        //match que_id in case of column exchange/mis-match [demo85.sales/demo85.mng ---(22072020)]
                                        if (json_inv[a].type[0].type == 5) {
                                            var template_que_id = json_inv[a].type[1].que_id;
                                        }
                                        else {
                                            var template_que_id = json_inv[a].type[0].que_id;
                                        }

                                        var txt_row_ary = json_inv_calc[0].row_finaljson[n - 1].json_type_22[0].txt_row;

                                        var value = "";
                                        var txt_row_id = "";
                                        for (var t = 0; t < txt_row_ary.length; t++) {
                                            var ans_que_id = txt_row_ary[t].row_que_id;
                                            if (template_que_id == ans_que_id) {
                                                var value = txt_row_ary[t].txt_row_value;
                                                var txt_row_id = txt_row_ary[t].txt_row_id;
                                                break;
                                            }
                                        }


                                        if (value == "" || value == null || value == undefined) {
                                            value = '';
                                        }

                                        if (hide_blank == 'true' && (value == '' || value == null || value == undefined)) {
                                            // hide blank fields
                                        }
                                        else {

                                            var display_css = "block";
                                            if (display_hide == "1") {
                                                list_div_data += "<input type='hidden' id='hdn_hide_pass_value_" + new_id + '_' + n + '_' + a + "' value=" + value + ">";
                                                display_css = "none";
                                            }

                                            list_div_data += "<tr>";

                                            if (json_inv[a].type[0].type == 5) {
                                                var json_inv_type = json_inv[a].type[1].type;
                                                var filled_obj = json_inv[a].type[1];
                                            }
                                            else {
                                                var json_inv_type = json_inv[a].type[0].type;
                                                var filled_obj = json_inv[a].type[0];
                                            }

                                            list_div_data += "<input type='hidden' id='btn_edit_td_" + new_id + "_" + n + "' alt='" + JSON.stringify(btn_json) + "'>";

                                            var param_delete = 'delete_row_from_table("' + jsonObj[i].que_id + '", "' + new_id + '", "' + n + '", "' + flag_value + '", "")';

                                            if (json_inv_type == '7' || json_inv_type == '9' || json_inv_type == '11') {
                                                list_div_data += "<span class='badge badge-secondary' style='display:inline-block;padding:3px;margin-top:3px;margin-right:3px;'>";

                                                let type22_img_que_id = filled_obj.que_id;
                                                let t_row_index_no = n;
                                                let p_name = filled_obj.ans[1];
                                                let param_img = 'bind_unavailable_images("txt_add_row_' + new_id + '_' + t_row_index_no + '_' + a + '", "' + p_name + '","' + step + '", "' + check_type + '", "' + type22_img_que_id + '", "' + jsonObj[i].que_id + '", "' + t_row_index_no + '")';

                                                //view photo in collapsible invoice summury mode [FT-16042025]
                                                var img_click = 'view_invoice_summary_photo("txt_add_row_' + new_id + '_' + t_row_index_no + '_' + a + '")';

                                                if (F7_device == 'ios') {
                                                    //====photo thumbnail issue for iOS after cordove plugin updation [03062025]
                                                    var iosDirectoryPath = localStorage.getItem('iosDirectoryPath');
                                                    var localFile = iosDirectoryPath + value;
                                                    value = window.WkWebView.convertFilePath(localFile);
                                                }

                                                list_div_data += "<img id='txt_add_row_" + new_id + '_' + n + "_" + a + "' src='" + value + "' onerror='" + param_img + "' onclick='" + img_click + "' class='type22-list-item-img' style='vertical-align:middle;border-radius:7px;padding:5px; width:50px; height:50px; ' /'>";

                                                if (n == row_counter) {
                                                    // display delete option in last row only 16022024
                                                    list_div_data += "<span style=='vertical-align:middle; margin-left:5px;display:inline-block;><i class='fa fa-times fa-2x mr-0' onclick='" + param_delete + "'></i></span>";
                                                    list_div_data += "</span>";
                                                }

                                            }
                                            else if (json_inv_type == '26' || json_inv_type == '28') {

                                                var edt_btn_json = json_inv_calc[0].row_finaljson[j - 1].json_type_22[0].edt_btn_json;
                                                if (edt_btn_json[0].type == 5) {                        //handling for JSON with label and without label [20052021]
                                                    var edt_btn_json_index = (p * 2) + 1;
                                                }
                                                else {
                                                    var edt_btn_json_index = p;
                                                }

                                                var type23_popup = $('.popup-type23:visible');
                                                if (type23_popup.length > 0) {
                                                    var down_checksheetid = collapse_Json[0].checksheet_id;
                                                }
                                                else {
                                                    var down_checksheetid = check_type;
                                                }

                                                if (form_flag == 2 || form_flag == 3) {
                                                    var parent_task_id = collapse_Json[0].parent_task_id;
                                                }
                                                else {
                                                    var parent_task_id = JSON.parse(storage.getItem('server_task_id'));
                                                }

                                                var ans_str = edt_btn_json[edt_btn_json_index].ans;

                                                if (ans_str == '' || ans_str == null || ans_str == undefined) {
                                                    var act_file_name = '';
                                                    var file_path = '';
                                                }
                                                else {
                                                    var act_file_name = ans_str[0];
                                                    var file_path = ans_str[1];
                                                }

                                                if (file_path == '' || file_path == null || file_path == undefined) {
                                                    var file_path = ans_str[0];
                                                }

                                                var str = '';
                                                if (file_path == '' || file_path == null || file_path == undefined) {
                                                    file_path = 'N/A';
                                                }
                                                else {
                                                    var param_view = "check_down_doc_entry_attached('" + new_id + "_" + it_id + "','" + file_path + "','" + edt_btn_json[edt_btn_json_index].que_id + "', '" + down_checksheetid + "', '" + it_id + "', '" + i + "')";
                                                    str += '<label class="filled-file" onclick="' + param_view + '" id="lbl_up_' + new_id + '" style="font-size:14px; word-break: break-word; color:blue">' + act_file_name + '</label>';
                                                }

                                                if (json_inv[p].type[0].type == 5) {
                                                    var type26_json = json_inv[p].type[1];
                                                }
                                                else {
                                                    var type26_json = json_inv[p].type[0];
                                                }

                                                if (file_path == '' || file_path == null || file_path == undefined) { }
                                                else {
                                                    var sharepoint_link = ans_str[3];
                                                    //var t_jsonObj = edt_btn_json[edt_btn_json_index];
                                                    var t_jsonObj = type26_json;
                                                    var misc_Array = t_jsonObj.prop[0].misc_data;
                                                    var inner_type = misc_Array[0].type;
                                                    if (inner_type == 7) {
                                                        var base_path = misc_Array[0].base_path;
                                                    }
                                                    else {
                                                        var value = JSON.parse(misc_Array[0].value);
                                                        var base_path = value[0].base_path;
                                                    }

                                                    var param_down = "toggle_doc_download('" + new_id + "_" + it_id + "', '" + edt_btn_json[edt_btn_json_index].que_id + "', '" + upload_type + "', '" + act_file_name + "', '" + file_path + "', '" + base_path + "', '" + sharepoint_link + "', '" + parent_task_id + "')";
                                                }

                                                list_div_data += "<span class='badge badge-secondary' style='display:inline-block;padding:3px;margin-top:3px;margin-right:3px;'>";
                                                if (value == "" || value == null || value == undefined) {
                                                    list_div_data += "";
                                                }
                                                else {
                                                    list_div_data += "<label title='" + txt_row_id + "' id='txt_add_row_" + new_id + '_' + n + '_' + a + "' onclick='" + param_down + "' style='font-size:12px;vertical-align:middle;'>Download Document</label><span style='vertical-align:middle; margin-left:5px;'><i class='fa fa-times fa-2x mr-0' onclick='" + param_delete + "'></i></span>";
                                                }
                                                list_div_data += "</span>";
                                            }
                                            else if (json_inv_type == '20') {
                                                list_div_data += "<span class='badge badge-secondary' style='display:inline-block;padding:3px;margin-top:3px;margin-right:3px;'><label title='" + txt_row_id + "' id='txt_add_row_" + new_id + '_' + n + '_' + a + "' disabled style='font-size:12px;vertical-align:middle;'>" + value + "</label><span style='vertical-align:middle; margin-left:5px;'><i class='fa fa-times fa-2x mr-0' onclick='" + param_delete + "'></i></span></span>";
                                            }
                                            else {
                                                list_div_data += "<span class='badge badge-secondary' style='display:inline-block;padding:3px;margin-top:3px;margin-right:3px;'><label title='" + txt_row_id + "' id='txt_add_row_" + new_id + '_' + n + '_' + a + "' disabled style='font-size:12px;vertical-align:middle;'>" + value + "</label><span style='vertical-align:middle; margin-left:5px;'><i class='fa fa-times fa-2x mr-0' onclick='" + param_delete + "'></i></span></span>";
                                            }

                                            list_div_data += '</div>';

                                            if (display_hide == "0") {
                                                display_row++;
                                            }
                                        }
                                    }
                                }
                                else {

                                    // if collapsible summary mode found showmore class add dymanically DV-17072024
                                    if (form_flag == 2) {
                                        list_div_data += '<div class="readmore expand">';
                                    }
                                    else {
                                        list_div_data += '<div class="readmore">';
                                    }


                                    list_div_data += '<table class="swipeout-content" style="width: 100%;vertical-align: middle;padding: 5px 0;">';

                                    if (listview_label == "false") {
                                        //type 22 listview UI (it displays with heading or not)
                                        for (var a = 0; a < num_row; a++) {
                                            var th_column_id = json_inv[a].id;
                                            var th_name = json_inv[a].name;
                                            var ddl_datatype = json_inv[a].type;
                                            var ddl_auto = json_inv[a].auto;
                                            var madatory = json_inv[a].mandatory;
                                            var td_sum = json_inv[a].sum;
                                            var ddl_equation = json_inv[a].equation;
                                            var display_hide = json_inv[a].display;
                                            // var value = json_inv_calc[n -
                                            // 1].json_type_22[0].txt_row[a].txt_row_value;

                                            //var txt_row_ary = json_inv_calc[0].row_finaljson[n - 1].json_type_22[0].txt_row;
                                            //if (a >= txt_row_ary.length && num_row > txt_row_ary.length) {
                                            //    //when template and log were mis-matched
                                            //    var value = "";
                                            //    var txt_row_id = "";
                                            //}
                                            //else {
                                            //    var value = txt_row_ary[a].txt_row_value;
                                            //    var txt_row_id = txt_row_ary[a].txt_row_id;
                                            //}


                                            //match que_id in case of column exchange/mis-match [demo85.sales/demo85.mng ---(22072020)]
                                            if (json_inv[a].type[0].type == 5) {
                                                var template_que_id = json_inv[a].type[1].que_id;
                                            }
                                            else {
                                                var template_que_id = json_inv[a].type[0].que_id;
                                            }

                                            var txt_row_ary = json_inv_calc[0].row_finaljson[n - 1].json_type_22[0].txt_row;

                                            var value = "";
                                            var txt_row_id = "";
                                            for (var t = 0; t < txt_row_ary.length; t++) {
                                                var ans_que_id = txt_row_ary[t].row_que_id;
                                                if (template_que_id == ans_que_id) {
                                                    var value = txt_row_ary[t].txt_row_value;
                                                    var txt_row_id = txt_row_ary[t].txt_row_id;
                                                    break;
                                                }
                                            }


                                            if (value == '' || value == null || value == undefined) {
                                                value = '';
                                            }
                                            if (hide_blank == 'true' && (value == '' || value == null || value == undefined)) {
                                                // hide blank fields
                                            }
                                            else {
                                                var display_css = "block";
                                                if (display_hide == "1") {
                                                    list_div_data += "<tr><td><input type='hidden' id='hdn_hide_pass_value_" + new_id + '_' + n + '_' + a + "' value=" + value + "></td></tr>";
                                                    display_css = "display: none;";
                                                }

                                                var view_equation = json_inv[a].view_equation;
                                                if (view_equation == "" || view_equation == undefined || view_equation == null) {
                                                    view_equation = "true";
                                                }

                                                var prev_align;
                                                var align = json_inv[a].align;
                                                if (align == "" || align == undefined || align == null) {
                                                    align = "left"
                                                }

                                                if (align == "left") {
                                                    var text_align = 'text-align: left;';
                                                }
                                                else {
                                                    var text_align = 'text-align: right;';
                                                }

                                                if (a < num_row - 1) {
                                                    var next_align = json_inv[a + 1].align;
                                                }
                                                else {
                                                    var next_align = "";        //for last row
                                                }

                                                var equation_exist = json_inv[a].equation;

                                                if (equation_exist == "" || equation_exist == null || equation_exist == undefined) {
                                                    //if (next_align == "left" || align == "left") {
                                                    if (align == "left" && next_align == "right") {
                                                        list_div_data += '<tr>';
                                                    }
                                                }
                                                else {
                                                    if (view_equation == "true") {
                                                        list_div_data += '<tr>';
                                                    }
                                                }

                                                if ((align == "right" && next_align == "right") || (align == "right" && prev_align == "right") || (align == "right" && next_align == "" && (a == num_row - 1)) || (align == "left" && (next_align == "" || next_align == "left"))) {
                                                    //list_div_data += '<tr><td></td>';
                                                    list_div_data += '<tr>';
                                                    colspan = "2";
                                                }

                                                var listview_prefix = json_inv[a].prefix;
                                                if (listview_prefix == "" || listview_prefix == null || listview_prefix == undefined) {
                                                    listview_prefix = '';
                                                }
                                                else {
                                                    value = listview_prefix + ' ' + value;
                                                }

                                                var listview_postfix = json_inv[a].postfix;
                                                if (listview_postfix == "" || listview_postfix == null || listview_postfix == undefined) {
                                                    listview_postfix = '';
                                                }
                                                else {
                                                    value = value + ' ' + listview_postfix;
                                                }

                                                if (json_inv[a].type[0].type == 5) {
                                                    var json_inv_type = json_inv[a].type[1].type;
                                                    var filled_obj = json_inv[a].type[1];
                                                }
                                                else {
                                                    var json_inv_type = json_inv[a].type[0].type;
                                                    var filled_obj = json_inv[a].type[0];
                                                }

                                                if (json_inv_type == '7' || json_inv_type == '9' || json_inv_type == '11') {
                                                    list_div_data += "<td colspan='" + colspan + "' style='" + text_align + "'>";

                                                    let type22_img_que_id = filled_obj.que_id;
                                                    let t_row_index_no = n;
                                                    let p_name = filled_obj.ans[1];
                                                    let param_img = 'bind_unavailable_images("txt_add_row_' + new_id + '_' + t_row_index_no + '_' + a + '", "' + p_name + '","' + step + '", "' + check_type + '", "' + type22_img_que_id + '", "' + jsonObj[i].que_id + '", "' + t_row_index_no + '")';

                                                    //view photo in collapsible invoice summury mode [FT-16042025]
                                                    var img_click = 'view_invoice_summary_photo("txt_add_row_' + new_id + '_' + t_row_index_no + '_' + a + '")';

                                                    if (F7_device == 'ios') {
                                                        //====photo thumbnail issue for iOS after cordove plugin updation [03062025]
                                                        var iosDirectoryPath = localStorage.getItem('iosDirectoryPath');
                                                        var localFile = iosDirectoryPath + value;
                                                        value = window.WkWebView.convertFilePath(localFile);
                                                    }

                                                    list_div_data += "<img id='txt_add_row_" + new_id + ' _' + n + "_" + a + "' src = '" + value + "' onerror='" + param_img + "' onclick='" + img_click + "' class='type22-list-item-img' / '></td>";
                                                }
                                                else if (json_inv_type == '20') {
                                                    list_div_data += "<td colspan='" + colspan + "' pre='" + listview_prefix + "' post='" + listview_postfix + "' title='" + txt_row_id + "' id='txt_add_row_" + new_id + '_' + n + "_" + a + "' style='" + text_align + "' class='type22-list-item-ans'><span class='list-ans' onclick='toggle_hidden_ans_data(this)'>" + value + "</span></td>";
                                                }
                                                else {
                                                    if (equation_exist == "" || equation_exist == null || equation_exist == undefined) {
                                                        if (align == "left" && (next_align == "left" || next_align == '' || next_align == null || next_align == undefined)) {
                                                            //list_div_data += '<td></td>';
                                                            colspan = "2";
                                                        }

                                                        list_div_data += "<td colspan='" + colspan + "' pre='" + listview_prefix + "' post='" + listview_postfix + "' id='txt_add_row_" + new_id + '_' + n + "_" + a + "' style='" + text_align + "' class='type22-list-item-ans'><span class='list-ans' onclick='toggle_hidden_ans_data(this)'>" + value + "</span></td>";
                                                    }
                                                    else {
                                                        //var eq_ans_str = '';
                                                        //for (var z = 0; z < equation_exist.length; z++) {
                                                        //    var eq_val = equation_exist[z];

                                                        //    if (eq_val == "+" || eq_val == "-" || eq_val == "*" || eq_val == "/" || eq_val == "(" || eq_val == ")" || eq_val == "$100") {
                                                        //        eq_ans_str += ' ' + eq_val + ' ';
                                                        //    }
                                                        //    else {
                                                        //        var ans_index = (parseInt(eq_val) * 2) - 1;
                                                        //        eq_ans_str += json_inv_calc[0].row_finaljson[n - 1].json_type_22[0].edt_btn_json[ans_index].ans[0];
                                                        //    }
                                                        //}

                                                        var equation = '';
                                                        for (k = 0; k < equation_exist.length; k++) { // equation for loop
                                                            var value1 = equation_exist[k];
                                                            if (value1 == '+' || value1 == '-' || value1 == '*' || value1 == '/' || value1 == '%' || value1 == '(' || value1 == ')' || value1 == '=') {
                                                                // append operator
                                                                var op = value1;
                                                                op = String(op);
                                                                equation += op;
                                                            } else {
                                                                // append value
                                                                if (value1.charAt(0) == "$") {
                                                                    // static vlue
                                                                    var value1_temp = value1;
                                                                    var static_temp = '';

                                                                    // remove $ sign
                                                                    for (var h = 1; h < value1_temp.length; h++) {
                                                                        static_temp += value1_temp.charAt(h)

                                                                    }
                                                                    var temp_equ_ans = parseFloat(static_temp);
                                                                    equation += temp_equ_ans;
                                                                } else {
                                                                    // variable column
                                                                    value1 = value1 - 1;
                                                                    var temp_equ_ans = json_inv_calc[0].row_finaljson[n - 1].json_type_22[0].edt_btn_json[value1].ans[0];
                                                                    temp_equ_ans = parseFloat(temp_equ_ans);
                                                                    equation += temp_equ_ans;
                                                                }
                                                            }
                                                        }

                                                        if (view_equation == "true") {
                                                            list_div_data += '<td class="type22-list-item-ans">' + equation + '</td>';
                                                            list_div_data += '<td pre="' + listview_prefix + '" post="' + listview_postfix + '" id="txt_add_row_' + new_id + '_' + n + '_' + a + '" style="text-align: right;" class="type22-list-item-ans">' + value + '</td>';
                                                        }
                                                        else {
                                                            list_div_data += '<td colspan="' + colspan + '" pre="' + listview_prefix + '" post="' + listview_postfix + '" id="txt_add_row_' + new_id + '_' + n + '_' + a + '" style="' + text_align + '" class="type22-list-item-ans">' + value + '</td>';
                                                        }
                                                    }
                                                }

                                                if (equation_exist == "" || equation_exist == null || equation_exist == undefined) {
                                                    if (align == "right" || next_align == "left" || next_align == '' || next_align == null || next_align == undefined) {
                                                        list_div_data += '</tr>';
                                                    }
                                                }
                                                else {
                                                    if (view_equation == "true") {
                                                        list_div_data += '</tr>';
                                                    }
                                                }

                                                prev_align = align;

                                                if (display_hide == "0") {
                                                    display_row++;
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        for (var a = 0; a < num_row; a++) {
                                            var th_column_id = json_inv[a].id;
                                            var th_name = json_inv[a].name;
                                            var ddl_datatype = json_inv[a].type;
                                            var ddl_auto = json_inv[a].auto;
                                            var madatory = json_inv[a].mandatory;
                                            var td_sum = json_inv[a].sum;
                                            var ddl_equation = json_inv[a].equation;
                                            var display_hide = json_inv[a].display;
                                            // var value = json_inv_calc[n -
                                            // 1].json_type_22[0].txt_row[a].txt_row_value;

                                            //if (a >= txt_row_ary.length && num_row > txt_row_ary.length) {
                                            //    //when template and log were mis-matched
                                            //    var value = "";
                                            //    var txt_row_id = "";
                                            //}
                                            //else {
                                            //    var value = txt_row_ary[a].txt_row_value;
                                            //    var txt_row_id = txt_row_ary[a].txt_row_id;
                                            //}

                                            //match que_id in case of column exchange/mis-match [demo85.sales/demo85.mng ---(22072020)]
                                            if (json_inv[a].type[0].type == 5) {
                                                var template_que_id = json_inv[a].type[1].que_id;
                                            }
                                            else {
                                                var template_que_id = json_inv[a].type[0].que_id;
                                            }

                                            var txt_row_ary = json_inv_calc[0].row_finaljson[n - 1].json_type_22[0].txt_row;

                                            var value = "";
                                            var txt_row_id = "";
                                            for (var t = 0; t < txt_row_ary.length; t++) {
                                                var ans_que_id = txt_row_ary[t].row_que_id;
                                                if (template_que_id == ans_que_id) {
                                                    var value = txt_row_ary[t].txt_row_value;
                                                    var txt_row_id = txt_row_ary[t].txt_row_id;
                                                    break;
                                                }
                                            }


                                            if (value == "" || value == null || value == undefined) {
                                                value = '';
                                            }

                                            if (hide_blank == 'true' && (value == '' || value == null || value == undefined)) {
                                                // hide blank fields
                                            }
                                            else {
                                                var display_css = "block";
                                                if (display_hide == "1") {
                                                    list_div_data += "<tr><td><input type='hidden' id='hdn_hide_pass_value_" + new_id + '_' + n + '_' + a + "' value=" + value + "></td></tr>";
                                                    display_css = "none";
                                                }

                                                list_div_data += "<tr>";

                                                if (json_inv[a].type[0].type == 5) {
                                                    var json_inv_type = json_inv[a].type[1].type;
                                                    var filled_obj = json_inv[a].type[1];
                                                }
                                                else {
                                                    var json_inv_type = json_inv[a].type[0].type;
                                                    var filled_obj = json_inv[a].type[0];

                                                    if (user_language != 'en') {
                                                        var language = json_inv[a].type[0].language;
                                                        if (language == "" || language == null || language == undefined || language == "null" || language == "Unknown" || language == "udenfined" || language == "[]") { }
                                                        else {
                                                            language = language[0];

                                                            if (isEmpty(language)) { }
                                                            else {
                                                                th_name = language[user_language];
                                                            }
                                                        }
                                                    }
                                                }

                                                list_div_data += '<td class="type22-list-item-label"><span class="list-ans" onclick="toggle_hidden_ans_data(this)">' + th_name + '</span></td>';

                                                if (json_inv_type == '7' || json_inv_type == '9' || json_inv_type == '11') {
                                                    //list_div_data += '<td class="type22-list-item-label">' + th_name + ':' + '</td>';

                                                    let type22_img_que_id = filled_obj.que_id;
                                                    let t_row_index_no = n;
                                                    let p_name = filled_obj.ans[1];
                                                    let param_img = 'bind_unavailable_images("txt_add_row_' + new_id + '_' + t_row_index_no + '_' + a + '", "' + p_name + '","' + step + '", "' + check_type + '", "' + type22_img_que_id + '", "' + jsonObj[i].que_id + '", "' + t_row_index_no + '")';

                                                    //view photo in collapsible invoice summury mode [FT-16042025]
                                                    var img_click = 'view_invoice_summary_photo("txt_add_row_' + new_id + '_' + t_row_index_no + '_' + a + '")';

                                                    if (F7_device == 'ios') {
                                                        //====photo thumbnail issue for iOS after cordove plugin updation [03062025]
                                                        var iosDirectoryPath = localStorage.getItem('iosDirectoryPath');
                                                        var localFile = iosDirectoryPath + value;
                                                        value = window.WkWebView.convertFilePath(localFile);
                                                    }

                                                    list_div_data += "<td><img id='txt_add_row_" + new_id + '_' + n + "_" + a + "' src='" + value + "' onerror='" + param_img + "' onclick='" + img_click + "' class='type22-list-item-img' /'></td>";
                                                } else if (json_inv_type == '20') {
                                                    //list_div_data += '<td class="type22-list-item-label">' + th_name + ':' + '</td>';
                                                    list_div_data += "<td title='" + txt_row_id + "' id='txt_add_row_" + new_id + '_' + n + "_" + a
                                                        + "' class='type22-list-item-ans'><span class='list-ans' onclick='toggle_hidden_ans_data(this)'>" + value + "</span></td>";
                                                } else {
                                                    //list_div_data += '<td class="type22-list-item-label">' + th_name + ':' + '</td>';
                                                    list_div_data += "<td  id='txt_add_row_" + new_id + '_' + n + "_" + a
                                                        + "' class='type22-list-item-ans'><span class='list-ans' onclick='toggle_hidden_ans_data(this)'>" + value + "</span></td>";
                                                }

                                                list_div_data += '</tr>';

                                                if (display_hide == "0") {
                                                    display_row++;
                                                }
                                            }
                                        }
                                    }
                                    var t_alt = "alt='" + JSON.stringify(btn_json) + "'";

                                    list_div_data += "</table>";

                                    if (form_flag == 2) {
                                        // collapsible with summary mode not create show more button DV-17072024
                                    }
                                    else {
                                        list_div_data += '<span class="readmore-link" onclick="show_more_task_data(this);event.cancelBubble=true;" style="background-image: linear-gradient(to bottom, transparent, white);display:none;"><div class="showmore-box">Show More <i class="fa fa-angle-down"></i></div></span>';
                                    }

                                    list_div_data += '</div>';

                                    list_div_data += '<div class="swipeout-actions-right" style="right: -5% !important;">';

                                    if (edit_button == "false") {
                                        list_div_data += '<input type="hidden" id="btn_edit_td_' + new_id + '_' + n + '">';
                                    }
                                    else {
                                        list_div_data += '<a id="btn_edit_td_' + new_id + '_' + n + '" onclick="' + param1 + '" ' + t_alt + ' style="transform: translate3d(0px, 0px, 0px);display:' + img_view + ';">Edit</a><input type="hidden" id="hdn_tr_delete_' + new_id + '_' + n + '" value="0"/>';
                                    }

                                    if (delete_button == "false") { }
                                    else {
                                        list_div_data += '<a id="btn_delete_td_' + new_id + '_' + n + '" onclick="' + param_delete + '" value="0" style="background: #f44336; transform: translate3d(-84px, 0px, 0px);display:' + img_view + ';">Delete</a>';
                                    }

                                    list_div_data += '</div>';

                                }
                                //list_div_data += '</div></li>';
                                list_div_data += '</li>';

                                //hide element where display=1
                                //for (var h = 0; h < num_row; h++) {
                                //    var display = json_inv[h].display;
                                //    if (display == "1") {
                                //        $('#txt_add_row_' + new_id + '_' + n + '_' + h + '').parent().hide();
                                //    }
                                //}

                            }

                            list_div_data += "</div>";
                            list_div_data += "<div id='div_list_display_sum_" + new_id + "' style='width:100%'>"

                            if (type22_json_len == 1) { }
                            else {
                                list_div_data += '<hr style="border:1px solid #ccc; margin-top: 0px;">';
                            }

                            list_div_data += '<li style="padding-top:5px; list-style-type:none; width:100%;">';


                            var sum_count = 0;
                            for (var q = 0; q < num_row; q++) {
                                var td_sum = json_inv[q].sum;
                                var th_name = json_inv[q].name;

                                if (td_sum > 0) {
                                    //if (sum_count == 0) {
                                    //    list_div_data += '<div style="background-color:#ffffff;padding:5px"><label style="margin-top:8px; font-size:11pt; font-weight:bold; margin-left:10px;  width:100%;">Final Sum:</label></div>';
                                    //}
                                    //if (sum_count % 2 == 0) {
                                    //    list_div_data += '<div style="background-color:#efefef;padding:5px; margin-bottom:10px">';
                                    //} else {
                                    //    list_div_data += '<div style="background-color:#ffffff;padding:5px; margin-bottom:10px">';
                                    //}
                                    var bgcolor = json_inv[q].bgcolor;
                                    if (bgcolor == undefined || bgcolor == null || bgcolor == "") {
                                        var color = 'black';
                                        var back_color = 'white';
                                    }
                                    else {
                                        var color = 'white';
                                        var back_color = bgcolor;
                                    }

                                    if (row_counter == 0) {
                                        var value_sum1 = 0;
                                    } else {
                                        //var value_sum1 = json_inv_calc[0].sum_finaljson[q].txt_sum_value;
                                        var value_sum_ary = json_inv_calc[0].sum_finaljson;
                                        if (q >= value_sum_ary.length && num_row > value_sum_ary.length) {
                                            //when template and log were mis-matched
                                            var value_sum1 = "";
                                        }
                                        else {
                                            var value_sum1 = value_sum_ary[q].txt_sum_value;
                                        }
                                    }

                                    var listview_prefix = json_inv[q].prefix;
                                    if (listview_prefix == "" || listview_prefix == null || listview_prefix == undefined) {
                                        listview_prefix = '';
                                    }
                                    else {
                                        value_sum1 = listview_prefix + ' ' + value_sum1;
                                    }

                                    var listview_postfix = json_inv[q].postfix;
                                    if (listview_postfix == "" || listview_postfix == null || listview_postfix == undefined) {
                                        listview_postfix = '';
                                    }
                                    else {
                                        value_sum1 = value_sum1 + ' ' + listview_postfix;
                                    }

                                    let sum_class = json_inv[q].sum_class;

                                    list_div_data += '<div style="background-color:' + back_color + ';color:' + color + ';padding:5px"><table style="width: 100%;vertical-align: middle;">';
                                    list_div_data += '<tr><td class="type22-sum-header"><span class="list-ans" onclick="toggle_hidden_ans_data(this)">' + th_name + '</span></td>';
                                    list_div_data += "<td id='sum_" + new_id + "_" + q + "' class='type22-sum-ans " + sum_class + "' style='height:auto; min-height:20px; max-height:40px;'><span class='list-ans' onclick='toggle_hidden_ans_data(this)'>" + value_sum1 + "</td></tr></table></div>";
                                    sum_count++;
                                }

                            }
                            list_div_data += "<hr style='border:1px solid #ccc; margin-top: 0;'></li>";
                            list_div_data += "</div>";

                            list_div_data += "</ul>";
                            // for display in listview form

                            var read_count_length = json_inv_array.length - 1;

                            var param2 = "return popup_search_items_show_type22('" + jsonObj[i].que_id + "','" + new_id + "','" + read_count_length + "','" + 0 + "','" + temp_inv_display_flag + "')";
                            var img_view = "block";

                            if (form_flag == 2) {
                                img_view = "none";
                                var param3 = "";
                                param2 = param3;
                                if (form_flag == 3) {
                                    param2 = "return popup_search_items_show_type22('" + jsonObj[i].que_id + "','" + new_id + "','" + read_count_length + "','" + 0 + "','" + temp_inv_display_flag + "')";
                                    img_view = "block";
                                }
                            }

                            for (var y1 = 0; y1 < num_row; y1++) {
                                var auto_hide_1 = json_inv[y1].auto;
                                var auto_value_array_1 = json_inv[y1].auto_value;
                                if (auto_value_array_1 == "" || auto_value_array_1 == null || auto_value_array_1 == undefined) {    // old json
                                }
                                else {
                                    if (auto_value_array_1.length == json_inv_calc[0].txt_row_counter) {
                                        img_view = "none";
                                        break;
                                    }
                                }
                            }

                            if (form_flag != 2) {
                                var disp_btn = "";
                                if (json_inv.length == 1 && control_type == '20') {
                                    var disp_btn = "display:none;";
                                }

                                invoice_action_data += '<div class="item-input item-input-field form-div array-field" style="' + disp_btn + '">';
                                if (add_button == "false") { }              //hide add record button [21102021]
                                else {

                                    invoice_action_data += '<a id="btn_add_row_' + new_id + '" onclick="' + param2 + '" style="display:' + img_view
                                        + ', margin-bottom:10px; width:auto;" data-popup=".popup-type22" class="button button-fill button-raised form-btn open-popup" ' + enable_disable + '>' + type22_button_str + '</a>';
                                }
                                invoice_action_data += '</div>';
                            }

                            list_div_data = invoice_action_data + list_div_data;
                            $("#div_display_" + new_id + "").append(list_div_data);
                            newdiv += list_div_data;
                        }
                        newdiv += '</div></div>';
                    }

                    // // Get old step collapsible step in current type div
                    else if (jsonObj[i].type == 23) {

                        if (form_flag == 2 || form_flag == 3) { }
                        else {
                            var misc_Array = jsonObj[i].prop[0].misc_data;
                            var type = misc_Array[0].type;
                            if (type == 7) {
                                if (form_flag == 0) {
                                    collapse_Json = itemObj._checkStrObj(misc_Array[0].value);  		// check_item
                                }
                            }

                            newdiv += '<div id="div_step_Col_' + new_id + '" style="' + disp_cntrl + '" class="cntrl_main_div ' + ele_class + '" ' + cls_enable + ' ' + common_str + '>';
                            newdiv += label_str;

                            if (form_flag == 0) {
                                var is_open = collapse_Json[0].is_open;
                                if (is_open == "true") {
                                    collapse_id_Array.push(new_id);
                                }
                            }

                            var is_editable = collapse_Json[0].editable;

                            var param = "toggle_collapse_div('" + new_id + "')";
                            var param1 = "popup_collapse_div_show_type23('" + new_id + "')";

                            if (jsonObj[i - 1].type == 0) {
                                var lbl_name = "";
                            }
                            else {
                                var lbl_name = prop_name;
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
                    }

                    // print
                    else if (jsonObj[i].type == 24) {
                        var misc_Array = jsonObj[i].prop[0].misc_data;
                        var type = misc_Array[0].type;
                        if (type == 9) {
                            var type24_Array = [];
                            type24_Array = itemObj._checkStrObj(misc_Array[0].value);  		// check_item
                        }

                        newdiv += '<div id="div_print_' + new_id + '" class="cntrl_main_div ' + ele_class + '" style="' + disp_cntrl + '" ' + cls_enable + ' ' + common_str + '>';

                        var param = "get_data_for_print('" + check_type + "','" + new_id + "')";
                        if (enable_disable == "disabled") {
                            param = '';
                        }

                        if (read_only == true) {
                            let summary_str = get_summary_str(new_id, prop_name, ans_str, check_type, que_id);
                            newdiv += summary_str;
                        }
                        else {
                            newdiv += label_str;
                            newdiv += '<img src="images/print-icon.png" onclick = "' + param + '" style="height:50px; width:50px; margin-left: 5px; border-radius: 7px" ' + enable_disable + '/>';
                            newdiv += '<input id="hdn_type24_data_' + new_id + '" type="hidden" value=' + encodeURIComponent(JSON.stringify(type24_Array)) + '>';
                            newdiv += '<input id="hdn_type24_data_ans_' + new_id + '" type="hidden">';
                        }
                        newdiv += '</div>';
                    }
                    // scanner
                    else if (jsonObj[i].type == 25) {
                        var misc_Array = jsonObj[i].prop[0].misc_data;
                        var value = itemObj._checkStrObj(misc_Array[0].value);  		// check_item
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
                        }

                        newdiv += '<div id="div_scn_' + new_id + '" class="cntrl_main_div ' + ele_class + '" style="' + disp_cntrl + '" ' + cls_enable + ' ' + common_str + '>';

                        var answer = jsonObj[i].ans;
                        var Fill_class = value[0].classname;
                        if (Fill_class == '' || Fill_class == null || Fill_class == undefined) { }
                        else {
                            Show_class_Array.push(Fill_class);
                        }
                        var param = "get_scanner_and_print('" + i + "','" + jsonObj[i].que_id + "','scn_" + new_id + "','" + photo_type + "','" + Fill_class + "', '" + editable + "', '" + remember_me + "')";

                        if (enable_disable == "disabled") {
                            param = '';
                        }

                        if (jsonObj[i].prop[0].is_reset == 'true' && read_only == false) {
                            var ans_str = [""];
                        }
                        else {
                            var ans_str = jsonObj[i].ans;
                        }

                        var obj = {
                            read_type: 'readsurvey',
                            ans: ans_str,
                            new_id: new_id,
                            value: jsonObj[i].value,
                            enable_disable: enable_disable,
                            param: param,
                            photo_type: photo_type
                        }

                        if (read_only == true) {
                            let summary_str = get_summary_str(new_id, prop_name, ans_str, check_type, que_id);
                            newdiv += summary_str;
                        }
                        else {
                            newdiv += label_str;
                            var control = new MkControls(obj);
                            newdiv += control.build_type_25_scanner();
                        }
                        newdiv += '</div>';
                    }

                    // // doc upload
                    else if (jsonObj[i].type == 26) {
                        var misc_Array = jsonObj[i].prop[0].misc_data;

                        var inner_type = misc_Array[0].type;
                        if (inner_type == 7) {
                            var base_path = misc_Array[0].base_path;
                            var upload_type = misc_Array[0].upload_type;
                            if (upload_type == '' || upload_type == null || upload_type == undefined) {
                                upload_type = 'easyform';
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
                            if (base_path == '' || base_path == null || base_path == undefined) {
                                base_path = 'NA';
                            }

                            var upload_type = value[0].upload_type;
                            if (upload_type == '' || upload_type == null || upload_type == undefined) {
                                upload_type = 'easyform';
                            }

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
                        }

                        if (form_flag == 2) {
                            // enable doc download link in summary mode in collapsible
                            enable_disable = '';
                        }

                        newdiv += '<div id="div_upload_doc_' + new_id + '" class="cntrl_main_div ' + ele_class + '" style="' + disp_cntrl + '" ' + cls_enable + ' ' + common_str + ' name="' + prop_name + '">';

                        var type23_popup = $('.popup-type23:visible');
                        if (type23_popup.length > 0) {
                            var down_checksheetid = collapse_Json[0].checksheet_id;
                        }
                        else {
                            var down_checksheetid = check_type;
                        }

                        if (read_only == true) {
                            //newdiv += jsonObj[i].ans[0];

                            var act_file_name = jsonObj[i].ans[0];
                            if (act_file_name == '' || act_file_name == null || act_file_name == undefined) {
                                var act_file_name = 'NA';
                            }
                            //var file_path = jsonObj[i].ans[1];
                            //if (file_path == '' || file_path == null || file_path == undefined) {
                            //    var file_path = 'NA';
                            //}

                            //var sharepoint_link = jsonObj[i].ans[3];
                            //if (sharepoint_link == '' || sharepoint_link == null || sharepoint_link == undefined) {
                            //    var sharepoint_link = 'NA';
                            //}
                            //sharepoint_link = sharepoint_link.replace(/'/g, "qqqqq");

                            //if (form_flag == 2 || form_flag == 3) {
                            //    var parent_task_id = collapse_Json[0].parent_task_id;
                            //}
                            //else {
                            //    var parent_task_id = 0;
                            //}

                            //var param_view = "check_down_doc_entry('" + new_id + "','" + file_path + "','" + jsonObj[i].que_id + "', '" + down_checksheetid + "')";
                            var doc_path = get_upload_media_live_link(jsonObj[i].que_id, down_checksheetid);
                            //var param_view = "view_doc_in_browser_live_url('" + doc_path + "')";
                            var param_view = "Download_PDFFile('" + doc_path + "','" + act_file_name + "')";

                            //newdiv += '<label class="filled-file" onclick="' + param_view + '" style="word-break: break-word; color:blue">' + act_file_name + '</label>';
                            //var param_down = "toggle_doc_download('" + new_id + "', '" + jsonObj[i].que_id + "', '" + upload_type + "', '" + act_file_name + "', '" + file_path + "', '" + base_path + "', '" + sharepoint_link + "', '" + parent_task_id + "')";
                            //newdiv += '<a id="doc_down_' + new_id + '" name="0" onclick="' + param_down + '" style="font-weight:bold; visibility:hidden">D</a>';


                            newdiv += '<table class="tbl_read_only"><tr>';
                            newdiv += '<td><label class="lbl_read_only" style="color: gray">' + prop_name + '</label>';
                            newdiv += '</td>';
                            newdiv += '<td><span class="cls-read-only"><label class="filled-file" onclick="' + param_view + '" style="word-break: break-word; color:blue">' + act_file_name + '</label></span>';

                            ////commented as added comment icon on swipe right [FT-12022025]
                            //let comment_str = get_comment_str(new_id, check_type, prop_name, que_id);
                            //newdiv += comment_str;

                            newdiv += '</td>';

                            newdiv += '</tr></table>';
                        }
                        else {

                            newdiv += label_str;

                            var btn_str = jsonObj[i].value;
                            if (btn_str == '' || btn_str == null || btn_str == undefined) {
                                btn_str = "Upload Doc";
                            }

                            // temp code for choose file only
                            var answer = jsonObj[i].ans;
                            if (jsonObj[i].prop[0].is_reset == 'true' && read_only == false) {
                                answer = [""];
                            }

                            if (form_flag == 2 || form_flag == 3) {
                                var parent_task_id = collapse_Json[0].parent_task_id;
                            }
                            else {
                                var parent_task_id = 0;
                            }

                            var obj = {
                                read_type: 'readsurvey',
                                ans: answer,
                                que_id: jsonObj[i].que_id,
                                new_id: new_id,
                                checksheetid: down_checksheetid,
                                enable_disable: enable_disable,
                                btn_text: btn_str,
                                view_doc: view_doc,
                                upload_type: upload_type,
                                base_path: base_path,
                                parent_task_id: parent_task_id,
                                max_file_size: max_file_size
                            }

                            var control = new MkControls(obj);
                            newdiv += control.build_type_26_upload();
                        }
                        newdiv += '</div>';

                        Type26_upload_Array.push({
                            'new_id': new_id,
                            'que_id': jsonObj[i].que_id
                        });
                    }

                    // pdf viewer
                    else if (jsonObj[i].type == 27) {
                        var misc_Array = jsonObj[i].prop[0].misc_data;
                        var value = itemObj._checkStrObj(misc_Array[0].value);  		// check_item
                        var pdf_type = value[0].report_type;

                        //if (jsonObj[i].prop[0].is_hide == "true") {
                        //    newdiv += '<div id="div_pdfviewer_' + new_id + '" style="display:none; padding:10px; text-align:right" class="' + ele_class + '">';
                        //} else if (ele_class == "" || form_flag == 2) {
                        //    newdiv += '<div id="div_pdfviewer_' + new_id + '" style="padding:10px; text-align:right">';
                        //} else {
                        //    newdiv += '<div id="div_pdfviewer_' + new_id + '" class="' + ele_class + '" style="display:none; padding:10px; text-align:right">';
                        //}

                        newdiv += '<div id="div_pdfviewer_' + new_id + '" class="cntrl_main_div ' + ele_class + '" style="' + disp_cntrl + '" ' + cls_enable + ' ' + common_str + '>';

                        var btn_str = jsonObj[i].value;
                        if (btn_str == '' || btn_str == null || btn_str == undefined) {
                            btn_str = "Get PDF Report";
                        }

                        jsonObj[i].ans = '';

                        var param = "get_pdf_report(" + i + ",'" + new_id + "','" + pdf_type + "')";

                        var obj = {
                            new_id: new_id,
                            enable_disable: enable_disable,
                            param: param,
                            btn_text: btn_str
                        }

                        if (read_only == true) {
                            let summary_str = get_summary_str(new_id, prop_name, jsonObj[i].ans, check_type, que_id);
                            newdiv += summary_str;
                        }
                        else {
                            newdiv += label_str;
                            var control = new MkControls(obj);
                            newdiv += control.build_type_27_pdf();
                        }
                        newdiv += '</div>';
                    }

                    // Video Capture
                    else if (jsonObj[i].type == 28) {
                        newdiv += "<div id='div_video_" + new_id + "' class='cntrl_main_div " + ele_class + "' style='" + disp_cntrl + "' " + cls_enable + " " + common_str + ">";

                        var video_path = jsonObj[i].ans[0];
                        var thumb_path = jsonObj[i].ans[1];
                        var video_size = jsonObj[i].ans[2];

                        if (curr_clps_new_id != 0) { }
                        else {
                            if (enable_disable == "disabled") {
                                var param = '';
                            }
                            else {
                                var param = 'capture_video("' + i + '", "' + jsonObj[i].que_id + '", "video_' + new_id + '")';
                            }
                        }
                        if (thumb_path == 'images/video-camera.png') {
                            var param1 = '';
                            var btn_text = '';
                        }
                        else {
                            //video_path = '/storage/emulated/0/video_easy/20161216_200107_353508071028232.mp4';
                            //thumb_path = '/storage/emulated/0/video_easy/1482129927852.png';
                            var param_unavail = 'bind_unavailable_videos("' + new_id + '")';
                            var param1 = 'toggle_video_download("' + i + '", "' + new_id + '", "' + video_path + '","' + thumb_path + '", "' + video_size + '", "' + jsonObj[i].que_id + '")';
                            var btn_text = "<div id='video_cont_" + new_id + "'><video autoplay controls id='vdo_autoply_" + new_id + "' poster='" + thumb_path + "' style='margin-top:5px; height: 250px; width: 100%'><source src='" + video_path + "' onerror='" + param_unavail + "'></video></div>";
                        }

                        if (jsonObj[i].prop[0].is_reset == 'true' && read_only == false) {
                            var ans_str = [""];
                        }
                        else {
                            var ans_str = jsonObj[i].ans;
                        }

                        var obj = {
                            read_type: 'readsurvey',
                            ans: ans_str,
                            new_id: new_id,
                            name: prop_name,
                            enable_disable: enable_disable,
                            param: param,
                            param1: param1,
                            btn_text: btn_text,
                            curr_clps_new_id: curr_clps_new_id
                        }

                        if (read_only == true) {
                            let summary_str = get_summary_str(new_id, prop_name, ans_str, check_type, que_id, jsonObj[i]);
                            newdiv += summary_str;
                        }
                        else {
                            newdiv += label_str;
                            var control = new MkControls(obj);
                            newdiv += control.build_type_28_video();
                        }
                        newdiv += '</div>';
                    }

                    //Trip Info
                    else if (jsonObj[i].type == 29) {
                        newdiv += "<div id='div_trip_" + new_id + "' class='cntrl_main_div " + ele_class + "' style='" + disp_cntrl + "' " + cls_enable + " " + common_str + ">";
                        newdiv += label_str;

                        newdiv += '<table id="trip_info_tbl" style="width: 100%; margin-bottom: 0;font-size:12px;" border=1><thead><tr><th style="padding: 2px 4px !important; background: #f1f1f1 !important; font-weight: bold !important;">Actual Distance <sub>(km)</sub></th><th style="padding: 2px 4px; background: #f1f1f1; font-weight: bold;">Suggested Distance <sub>(km)</sub></th><th style="padding: 2px 4px; background: #f1f1f1; font-weight: bold;">Start Point</th><th style="padding: 2px 4px; background: #f1f1f1; font-weight: bold;">Destination Point</th></tr></thead></table>';

                        setTimeout(function () {
                            if (check_type == 91516) {
                                let search_elem = $(".task_cls").find("select");
                                let search_answer = $(search_elem).val();
                                if (search_answer == "" || search_answer == null || search_answer == undefined) {
                                    $(search_elem).attr("onchange", "get_trip_info(this)")
                                }
                                else {
                                    get_trip_info(search_elem);
                                }
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
                        if (jsonObj[i].prop[0].is_reset == 'true' && read_only == false) {
                            var answer_str = [""];
                        }
                        else {
                            var answer_str = jsonObj[i].ans[0];
                        }

                        if (view_type == "dropdownview") {
                            var onclick_str = " onclick=get_dynddl_data_onclick('" + new_id + "');";
                        }
                        else {
                            var onclick_str = "";
                        }

                        if (answer_str == '' || answer_str == null || answer_str == undefined) {
                            var old_ans = '';
                            var dependency_str = '';

                            newdiv += '<div id="div_dynddl_' + new_id + '" class="cntrl_main_div ' + ele_class + '" style="' + disp_cntrl + '" ' + cls_enable + ' ' + common_str + ' ' + onclick_str + '>';
                        }
                        else {
                            var old_ans = answer_str;

                            var dependency_str = jsonObj[i].ans[1];
                            if (dependency_str == '' || dependency_str == null || dependency_str == undefined || dependency_str == "[{") {
                                newdiv += '<div id="div_dynddl_' + new_id + '" class="cntrl_main_div ' + ele_class + '" style="' + disp_cntrl + '" ' + cls_enable + ' ' + common_str + ' ' + onclick_str + '>';
                            }
                            else {
                                var dep_array = JSON.parse(dependency_str);
                                dependency_Array.push(dep_array);

                                var name_str = "name='" + dependency_str + "'";
                                newdiv += '<div id="div_dynddl_' + new_id + '" class="cntrl_main_div ' + ele_class + '" style="' + disp_cntrl + '" ' + cls_enable + ' ' + common_str + ' ' + name_str + ' ' + onclick_str + '>';
                            }
                        }

                        if (url.indexOf('/') > -1) { }
                        else {
                            url = global_wcf_url + url;
                        }

                        if (url == "" || url == null || url == undefined) { }
                        else {
                            url = url.replace("atcmwfm.americantower.com", "mwfm.altiusinfra.com");
                        }

                        if (read_only == true) {
                            let summary_str = get_summary_str(new_id, prop_name, old_ans, check_type, que_id);
                            newdiv += summary_str;
                        }
                        else {
                            newdiv += label_str;

                            var T30_Obj = {
                                ans: old_ans,
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
                                read_type: 'readsurvey',
                                ans: old_ans,
                                new_id: new_id,
                                que_id: jsonObj[i].que_id,
                                enable_disable: enable_disable,
                                param: param_ddyddl,
                                view_type: view_type,
                                RowQueryWhere: RowQueryWhere,
                                param1: jsonObj[i].ans,
                                default_val: default_value
                            }

                            newdiv += "<input type='hidden' id='hdn_dynddl_" + new_id + "' value='" + JSON.stringify(T30_Obj) + "'>";

                            var control = new MkControls(obj);
                            if (view_type == 'dropdownview' || view_type == 'textview' || view_type == 'numericview') {
                                newdiv += control.build_type_30_dynddl();
                            }
                            else {
                                newdiv += '<div style="width:100%; overflow:auto" >';
                                newdiv += '<table id="tbl_dynddl_' + new_id + '" style="width:100%">' + old_ans + '</table>';
                                newdiv += '</div>';
                            }
                        }
                        newdiv += '</div>';
                    }
                    // Note
                    else if (jsonObj[i].type == 31) {
                        newdiv += '<div id="div_note_' + new_id + '" class="cntrl_main_div ' + ele_class + '" style="padding-top:5px;' + disp_cntrl + '" ' + cls_enable + ' ' + common_str + '>';

                        var obj = {
                            new_id: new_id,
                            value: prop_name
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
                        newdiv += "<div id='div_AutoInc_" + new_id + "' class='cntrl_main_div " + ele_class + "' style='overflow:auto; " + disp_cntrl + "' " + cls_enable + " " + common_str + ">";

                        if (read_only == true) {
                            let summary_str = get_summary_str(new_id, prop_name, jsonObj[i].ans[0], check_type, que_id);
                            newdiv += summary_str;
                        }
                        else {
                            newdiv += label_str;

                            newdiv += '<div class="item-input item-input-field form-div">';
                            newdiv += '<input type="text" style="white-space: pre; word-break: break-word" class="form-ele" id="txtAutoInc_' + new_id + '" value="' + jsonObj[i].ans[0] + '" disabled>';
                            newdiv += '<i class="fa fa-sort-amount-asc form-ico"></i></div>';
                        }

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

                        var param = 'pre_get_RF_Tracking("' + mode_class + '", "' + new_id + '")';

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

                        newdiv += '<div id="div_chklst_' + new_id + '" class="cntrl_main_div ' + ele_class + '" style="' + disp_cntrl + '" ' + cls_enable + ' ' + common_str + '>';
                        newdiv += label_str;
                        newdiv += '</div>';

                        var obj = {
                            read_type: 'readsurvey',
                            ans: ans_str,
                            new_id: new_id,
                            value: jsonObj[i].value,
                            default_val: '',
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

                        if (form_flag != 2) {
                            var misc_Array = jsonObj[i].prop[0].misc_data;

                            newdiv += '<div id="div_subtask_' + new_id + '" class="cntrl_main_div ' + ele_class + '" ' + cls_enable + ' ' + common_str + ' style="border-bottom: 1px solid #ccc; ' + disp_cntrl + '" >';
                            newdiv += label_str;

                            var obj = {
                                read_type: 'readsurvey',
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
                            read_type: 'readsurvey',
                            ans: jsonObj[i].ans,
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

                        let value = misc_Array[0].value;
                        value = itemObj._checkStrObj(value);  // check_item
                        let doc_type = value[0].doc_type;

                        if (doc_type == "video") {
                            Type40_ll_Array.push(new_id);
                        }

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

        if (form_flag == 0) {
            // normal form
            jsonObj_old = jsonObj;
            $("#container_div").append(newdiv);

            $("#container_div").find('.cntrl_main_div').addClass('swipeout-content');

            //hide element where display=1 in type 22
            for (var h = 0; h < json_inv_array.length; h++) {
                var t_json_data = json_inv_array[h];
                var t_new_id = inv_Calc_new_array[h];

                var row_counter = $("#hdn_inv_row_counter_" + t_new_id + "").val();
                for (var r = 1; r <= row_counter; r++) {
                    for (var g = 0; g < t_json_data.length; g++) {
                        var display = t_json_data[g].display;
                        if (display == "1") {
                            let t_tagname = $('#txt_add_row_' + t_new_id + '_' + r + '_' + g + '').prop("tagName");
                            if (t_tagname == "IMG") {
                                $('#txt_add_row_' + t_new_id + '_' + r + '_' + g + '').parent("td").parent("tr").hide();
                            }
                            else {
                                $('#txt_add_row_' + t_new_id + '_' + r + '_' + g + '').parent().hide();
                            }
                        }
                    }
                }

                // atc - 31102018
                var index = $("#hdn_inv_row_counter_" + t_new_id + "").attr('index');
                storage.setItem('img_id_type22', index);

                // display show more for invoice listview items - 07022025
                setTimeout(function () {
                    check_n_apply_show_more_for_invoice_items(t_new_id);
                }, 200, t_new_id);

                ckeck_mandatory(h);
            }

            //read_dynamic_surveydata_buttons(buttons, Show_class_Array, LL_class_Array, dependency_Array);
            read_dynamic_checksheet_buttons(buttons, Show_class_Array, LL_class_Array, dependency_Array, check_type, "readsurvey");
        }
        else if (form_flag == 1) {
            var new_json = JSON.stringify(jsonObj);
            jsonObj_type22 = jsonObj;

            var json_inv = storage.getItem('json_inv');
            var btn_add = inv_Calc_new_array[json_inv];

            var type22_json_len = $("#hdn_type22_json_len_" + btn_add + "").val();
            var type22_snglCntrl_type = $("#hdn_type22_json_len_" + btn_add + "").attr('type22_snglCntrl_type');
            if (type22_json_len == 1 && type22_snglCntrl_type == '20') {
                //single invoice control UI changes [18112021]
                var param = "return submit_popup_data('" + json_inv + "', '" + btn_add + "', 'readsurvey')";
                if (type22_snglCntrl_type == 20) { }
                else {
                    newdiv += '<span style="margin: 5px 25px;vertical-align:top;display:inline-block"><button type="button" id="btn_add_row_popup' + btn_add + '" value="Add Record" onclick="' + param + '" style="margin:0px;" class="button button-fill">Add</button>';
                    newdiv += '</span>';
                }

                var single_jsonObj_type22 = JSON.stringify(jsonObj_type22);
                newdiv += "<input type='hidden' id='hdn_jsonObj_type22_" + btn_add + "' value='" + single_jsonObj_type22 + "'>";
                $("#div_singleInvoice_cntrl_" + btn_add + "").empty();
                $("#div_singleInvoice_cntrl_" + btn_add + "").append(newdiv);

                //add default multiselect for single invoice type20 [13062022]                
                $("#ddl_search_type20_" + new_id + "").attr('multiple', 'multiple');
                $("#ddl_search_type20_" + new_id + "").attr('type22_array_index', json_inv);
            }
            else {
                var param = 'return validate_and_submit_surveydata_main("' + json_inv + '","4","' + "" + '")';

                var foot_str = "<div class='left'><a class='link button button-fill button-negative' onclick='popup_items_hide_type22(1)'>CANCEL</a></div>";
                foot_str += "<div class='right'><a class='link button button-fill' id='btn_add_row_popup" + btn_add + "' onclick='" + param + "'>ADD</a></div>";
                $('.foooter-type22').append(foot_str);

                $("#div_inv_form").append(newdiv);
            }

            read_dynamic_checksheet_checks(Show_class_Array, "", dependency_Array);
        }
        else if (form_flag == 2) {
            // collapsible step div type 23
            jsonObj_type23 = jsonObj;
            // $("#collapse_container_div").append(newdiv);
            $("#collapse_container_div_" + curr_clps_new_id + "").append(newdiv);
            $("#collapse_container_div_" + curr_clps_new_id + "").find('.cntrl_main_div').addClass('swipeout-content');

            form_flag = 0;

            //hide element where display=1 in type 22
            try {
                for (var h = 0; h < json_inv_array.length; h++) {
                    var t_json_data = json_inv_array[h];
                    var t_new_id = inv_Calc_new_array[h];

                    var row_counter = $("#hdn_inv_row_counter_" + t_new_id + "").val();
                    for (var r = 1; r <= row_counter; r++) {
                        for (var g = 0; g < t_json_data.length; g++) {
                            var display = t_json_data[g].display;
                            if (display == "1") {
                                $('#txt_add_row_' + t_new_id + '_' + r + '_' + g + '').parent().hide();
                            }
                        }
                    }

                    // atc - 31102018
                    var index = $("#hdn_inv_row_counter_" + t_new_id + "").attr('index');
                    storage.setItem('img_id_type22', index);

                    ckeck_mandatory(h);
                }
            }
            catch (e) { }

            check_collapse_json_to_show_hide_ele(check_type, jsonObj, Show_class_Array, LL_class_Array, dependency_Array);
        }
        else if (form_flag == 3) {
            // type 23 popup div container
            jsonObj_type23 = jsonObj;
            $("#clps_popup_container_div").append(newdiv);
            $("#clps_popup_container_div").find('.cntrl_main_div').addClass('swipeout-content');

            //hide element where display=1 in type 22
            try {
                for (var h = 0; h < json_inv_array.length; h++) {
                    var t_json_data = json_inv_array[h];
                    var t_new_id = inv_Calc_new_array[h];

                    var row_counter = $("#hdn_inv_row_counter_" + t_new_id + "").val();
                    for (var r = 1; r <= row_counter; r++) {
                        for (var g = 0; g < t_json_data.length; g++) {
                            var display = t_json_data[g].display;
                            if (display == "1") {
                                $('#txt_add_row_' + t_new_id + '_' + r + '_' + g + '').parent().hide();
                            }
                        }
                    }

                    // atc - 31102018
                    var index = $("#hdn_inv_row_counter_" + t_new_id + "").attr('index');
                    storage.setItem('img_id_type22', index);

                    ckeck_mandatory(h);
                }
            }
            catch (e) { }

            //====new devlopment for control wise comments for filled form [FT - 29042024]
            //show_control_wise_comments_for_filled_form(curr_clps_new_id, check_type);

            check_collapse_json_to_show_hide_ele(check_type, jsonObj, Show_class_Array, LL_class_Array, dependency_Array);
        }
        else if (form_flag == 6) {
            // task form

            var type37_len = $("div[id^='div_subtask_']").length;
            if (type37_len > 0) {
                $(".popup-new-task-create #container_div").append(newdiv);
                jsonObj_task_add = jsonObj;
            }
            else {
                $("#container_div").append(newdiv);
                jsonObj_old = jsonObj;
            }

            var task_button_text = list_data[0].task_button_text;

            if (task_button_text == '' || task_button_text == null || task_button_text == undefined) {
                var task_mode = localStorage.getItem('task_mode');
                if (task_mode == "edit") {
                    task_button_text = 'Update Task';
                }
                else {
                    task_button_text = 'Create Task';
                }
            }
            var param_task = "validate_and_submit_surveydata(1, 6, 'data')";
            var footer_btn_str = '<div class="left"></div><div class="right"><a class="link" onclick="' + param_task + '">' + task_button_text + '</a></div>';

            if (type37_len > 0) {
                $(".popup-new-task-create #container_btn_div").append(footer_btn_str);
            }
            else {
                $("#container_btn_div").append(footer_btn_str);
            }

            storage.setItem('crash_status', JSON.stringify('0'));

            // Disable flowname for task edit form
            var selected_modulename = JSON.parse(storage.getItem('wayflow_name'));
            $('#search_item_name_S_Search_' + curr_clps_new_id + '_' + check_type + '_7').val(selected_modulename);
            $('#search_item_name_S_Search_' + curr_clps_new_id + '_' + check_type + '_7').prop("disabled", true);
            $('#btn21_Search_' + curr_clps_new_id + '_' + check_type + '_7').attr('onclick', '');
            $('#search_item_name_S_Search_' + curr_clps_new_id + '_' + check_type + '_7').attr('name', '1');

            read_dynamic_checksheet_checks(Show_class_Array, "", dependency_Array);
        }
        else if (form_flag == 7) {
            // type20 customer creation           
            jsonObj_cust_add = jsonObj;
            try {
                var customer_edit = list_data[0].customer_edit;
            }
            catch {
                var customer_edit = 'true';
            }


            if (customer_edit == "true") {

                var cust_button_text = "UPDATE";
                var param_cust = 'submit_customer_edited_data()';
                var footer_btn_str = "<div class='left'></div><div class='right'><a class='link' onclick='" + param_cust + "'>" + cust_button_text + "</a></div>";

                if (is_approval == '1') {
                    // send user profile for approval 18022025 PG
                    $("#container_div_update_user").append(newdiv);
                    $("#container_btn_div_update_user").append(footer_btn_str);
                }
                else {
                    $("#container_div").append(newdiv);
                    $("#container_btn_div").append(footer_btn_str);
                }

                $("#txt_" + curr_clps_new_id + '_' + check_type + "_1").prop("disabled", true);                          //disable customeruniq textbox in edit form
                read_dynamic_checksheet_checks(Show_class_Array, "", dependency_Array);
            }
            else {
                var param = "return submit_popup_data_type20_add()";
                var foot_str = '<div class="left"><a href="#" class="link button button-fill button-negative" onclick="hide_type20_add_popup()">CANCEL</a></div>';
                foot_str += '<div class="right"><a href="#" class="link button button-fill" id="btn_type20_cust_add" onclick="' + param + '">ADD</a></div>';
                $('.footer-type20-add').append(foot_str);
                $("#popup_container_type20_add").empty();
                $("#popup_container_type20_add").append(newdiv);
            }
        }
        else if (form_flag == 8) {
            // User edit 19022025 PG
            jsonObj_user_add = jsonObj;

            curr_survey_data["heading"] = heading;
            curr_survey_data["check_type"] = check_type;
            curr_survey_data["siteid"] = JSON.parse(storage.getItem('siteid'));
            curr_survey_data["step"] = step;
            btnJsonObj = buttons;

            var cust_button_text = "UPDATE";
            var param_cust = 'submit_user_edited_data()';
            var footer_btn_str = "<div class='left'></div><div class='right'><a class='link' onclick='" + param_cust + "'>" + cust_button_text + "</a></div>";

            if (is_approval == '1') {
                // send user profile for approval 18022025 PG
                $("#container_div_update_user").append(newdiv);
                $("#container_btn_div_update_user").append(footer_btn_str);

                setTimeout(function () {
                    $('input[type="password"]').attr("disabled", "disabled");
                    $("#txt_" + curr_clps_new_id + "_" + check_type + "_3").prop("disabled", true);
                    $("#container_div_update_user").find("div[id^='div_Inv_Calculate_']").attr("disabled", "disabled");
                }, 100);
            }

            $("#txt_" + curr_clps_new_id + '_' + check_type + "_1").prop("disabled", true);                          //disable customeruniq textbox in edit form
            read_dynamic_checksheet_checks(Show_class_Array, "", dependency_Array);
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

            read_dynamic_surveydata_checks(Show_class_Array, LL_class_Array, dependency_Array);

        }
        // ////////////////////////////////////////////

        //---------show/hide checksheet control icon
        var c_is_icon_display = JSON.parse(storage.getItem('c_is_icon_display'));
        if (c_is_icon_display == "false") {
            $('.fa.form-ico').hide();
        }
        else {
            $('.fa.form-ico').show();
        }

        if (read_only == true) {
            $(".tbl_read_only").parent(".cntrl_main_div").css("padding", "3px");
        }

        //===show more UI for type22 listview
        setTimeout(function () {
            for (var n = 0; n < inv_Calc_new_array.length; n++) {
                var inv_new_id = inv_Calc_new_array[n];
                $('#div_list_display_' + inv_new_id + ' li').each(function () {
                    var li_height = $('#div_list_display_' + inv_new_id + ' li').height();
                    if (li_height < 70) {  //120=max-height of li
                        $('.readmore-link').hide();
                    }
                    else {
                        $('.readmore-link').show();
                    }
                });

                hide_add_record_button_by_max_record(inv_new_id);

            }
        }, 1000);
        //===show more UI for type22 listview

        // trigger cascading dropdown
        // replace length > 1 to length > 0   - 31072020
        //if (dependency_Array_CCD.length > 1) {

        if (dependency_Array_CCD.length > 0) {
            set_cascading_dependency_readsurvey(dependency_Array_CCD);
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
                //new development for ATC calc dependency [atc.bb - 03052021]
                type17_dep_obj = JSON.parse(t_type17_dep_obj);
                if (type17_dep_obj.length > 0) {
                    auto_calculation_for_multiple_calc(Type17_class_Array);
                    break;
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
                    //if (nobox_id == "" || nobox_id == null || nobox_id == undefined) { }
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

        if (act_form_flag != 2) {                                                                           //for collapsible summary mode hide que which is not in queid list [FT-09062025]
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

                if (datetime_format.indexOf("dd-M-yyyy") > -1) {
                    var display_value = ('Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec');
                    var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                }
                else {
                    var display_value = ('01 02 03 04 05 06 07 08 09 10 11 12');
                    var monthNames = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
                }

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

                    //var valueArray = [(mm1 - 1), dd1, yyyy1, hour, min];
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

                var today = new Date();
                var currMonth = monthNames[today.getMonth()];

                var dtpicker_obj =
                {
                    input: '#cal_' + T_divId + '',
                    //container: div,  // inline date-time
                    //toolbar: false,  // close button display
                    rotateEffect: false,

                    // for predefined datetime
                    //value: ['8', '13', '2017', '12', '10'],
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
                            if (val == '') {
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
                            }
                            else {
                                if (datetime_format.indexOf("dd/mm/yyyy") > -1) {
                                    if (time_format == "HH:mm:ss") {
                                        var default_value = monthNames[mm1 - 1] + '/' + values[0] + '/' + values[2] + ' ' + values[3] + ':' + values[4] + ':' + values[5];
                                    }
                                    else {
                                        var default_value = monthNames[mm1 - 1] + '/' + values[0] + '/' + values[2] + ' ' + values[3] + ':' + values[4];
                                    }
                                }
                                else {
                                    if (time_format == "HH:mm:ss") {
                                        var default_value = monthNames[mm1 - 1] + '/' + values[1] + '/' + values[2] + ' ' + values[3] + ':' + values[4] + ':' + values[5];
                                    }
                                    else {
                                        var default_value = monthNames[mm1 - 1] + '/' + values[1] + '/' + values[2] + ' ' + values[3] + ':' + values[4];
                                    }
                                }
                                var new_default_value = convert_datetime_by_format(default_value, 'datetime');
                                return new_default_value;
                            }
                        }
                        else {
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
                var datetimepicker = myApp.picker(dtpicker_obj);
            } else if (T_mode == 'date') {
                if (val == '' || val == null || val == undefined) {
                    var val_str = '';
                }
                else {
                    val = convert_datetime_by_format(val, T_mode);
                    var val_str = [val];
                }
                var date_format = datetime_format_ary[0];
                myApp.calendar({
                    input: '#cal_' + T_divId + '',
                    //dateFormat: 'mm/dd/yyyy',
                    dateFormat: date_format,
                    value: val_str
                });
            } else {
                // time mode
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

        // set onclick event for type20 dropdown filling
        if (Type20_AutoFill_DDL_Array.length > 0) {
            var Type20_Reset_AutoFill_DDL_Array = [];
            for (let z = 0; z < Type20_AutoFill_DDL_Array.length; z++) {
                var t_new_id = Type20_AutoFill_DDL_Array[z].new_id;
                var t_TableName = Type20_AutoFill_DDL_Array[z].TableName;
                var t_JoinTableName = Type20_AutoFill_DDL_Array[z].JoinTableName;
                var t_Checksheet_id = Type20_AutoFill_DDL_Array[z].Checksheet_id;
                var t_window_style = Type20_AutoFill_DDL_Array[z].window_style;
                var t_view_style = Type20_AutoFill_DDL_Array[z].view_style;

                var param = "popup_search_items_show_type20('" + t_new_id
                    + "', '" + t_TableName + "', '" + t_JoinTableName
                    + "','" + t_Checksheet_id + "','" + t_window_style
                    + "','" + t_view_style + "');";
                //$('#div_Search_' + t_new_id + '').attr('onclick', param);

                var t_is_reset = Type20_AutoFill_DDL_Array[z].is_reset;

                if (t_is_reset == 'true' && read_only == false) {
                    // reset type20 dropdown available
                    Type20_Reset_AutoFill_DDL_Array.push(Type20_AutoFill_DDL_Array[z]);
                }
                else if (t_is_reset == 'fixed') { }
                else {
                    // fill clicked type20 dropdown data
                    //$('#div_Search_' + t_new_id + '').attr('onclick', param);
                    var avial_onclick = $('#div_Search_' + t_new_id + '').find('div.item-input.item-input-field.form-div').attr('onclick');
                    var new_param = param + 'setTimeout(function () {' + avial_onclick + '}, 100);';
                    $('#div_Search_' + t_new_id + '').find('div.item-input.item-input-field.form-div').attr('onclick', new_param);

                    set_parent_child_dropdown_readsurvey(Type20_AutoFill_DDL_Array[z]);                         //bind onchange event only for parent (lead.meng--Order/Sales Visit)  [FT-11062025]
                }

                // handled searchable autofill for below controls in case of filled data - mk - 06012025
                var t_answer = Type20_AutoFill_DDL_Array[z].answer;
                if (t_answer == "" || t_answer == null || t_answer == undefined) { }
                else {
                    let Fill_Data = Type20_AutoFill_DDL_Array[z].value_new[0].Fill_Data;
                    for (let fj = 0; fj < Fill_Data.length; fj++) {
                        var box_class = Fill_Data[fj].classname;
                        $("." + box_class + "").attr("autofill_parent_id", "div_Search_" + t_new_id + "");
                    }
                }

            }
            if (Type20_Reset_AutoFill_DDL_Array.length > 0) {
                // autofill type20 dropdown on form load

                if (form_flag == 12) {
                    var group_task_array = JSON.parse(localStorage.getItem("group_task_array"));
                    var data_json = JSON.parse(storage.getItem('list_json'));
                    var list_data = JSON.parse(data_json);
                    var group_task_steps = list_data[0].group_task_steps;
                    var step = step_Array[step_Array.length - 1];
                    var check = group_task_steps.includes(step.toString());
                    if (check == true) {
                        // single task only
                        autofill_type20_dropdown_onload(Type20_Reset_AutoFill_DDL_Array);
                    }
                    else {
                        // multiple tasks
                        if (target_index == (group_task_array.length - 1)) {
                            autofill_type20_dropdown_onload(Type20_Reset_AutoFill_DDL_Array);
                        }
                    }
                }
                else {
                    autofill_type20_dropdown_onload(Type20_Reset_AutoFill_DDL_Array);
                }

            }
            else {
                if (Type20_AutoFill_DDL_Array.length > 1) {
                    //Type20_AutoFill_DDL_Array = [];              // commented on 04072019 - due to creating issue when there is collpsible and multiple type20 are available in single form

                    // pv revenue leakage 30 checksheets - mk - 20052025
                    var data_json = JSON.parse(storage.getItem('list_json'));
                    var list_data = JSON.parse(data_json);
                    var old_task_log = list_data[0].old_task_log;
                    if (old_task_log == "true") {
                        Type20_AutoFill_DDL_Array = [];
                    }

                }
                else {
                    Type20_AutoFill_DDL_Array = [];
                }
            }
        } else {
            loading_hide();
        }

        //handle blank type 22 in filled form
        if (form_flag != 1) {
            //single invoice control UI changes [11122023]
            for (ca = 0; ca < inv_Calc_new_array.length; ca++) {
                var invoice_new_id = inv_Calc_new_array[ca];
                var type22_json_len = $("#hdn_type22_json_len_" + invoice_new_id + "").val();
                var type22_snglCntrl_type = $("#hdn_type22_json_len_" + invoice_new_id + "").attr('type22_snglCntrl_type');
                if (type22_json_len == 1 && type22_snglCntrl_type == '20') {
                    $("#btn_add_row_" + invoice_new_id + "").trigger('onclick');                 //single control UI changes [19112021]
                }
            }
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

                    // 10955 = OCR checksheet ATC testing /  10498 = OCR checksheet ATC Live
                    if (check_type == '10955' || check_type == "10498") { }
                    else {
                        var Type30_dynddl_Array_New = [];
                        var len = Type30_dynddl_Array.length;
                        for (x = 0; x < len; x++) {

                            var t_new_id = Type30_dynddl_Array[x].new_id;
                            var ans = Type30_dynddl_Array[x].ans;
                            if (ans == "" || ans == null || ans == undefined || ans == " " || ans == "0") {
                                Type30_dynddl_Array_New.push(Type30_dynddl_Array[x]);
                            }
                            else {
                                var param = "get_dynddl_data_onclick('" + t_new_id + "', 'dynddl_" + t_new_id + "', '');";
                                $("#div_dynddl_" + t_new_id + "").attr('onclick', param);
                            }
                        }
                        Type30_dynddl_Array = Type30_dynddl_Array_New;
                        Type30_dynddl_Array_Global = Type30_dynddl_Array_New;
                        localStorage.setItem('Type30_dynddl_Array', JSON.stringify(Type30_dynddl_Array));
                    }

                    var hidden_Type30_Array = [];

                    for (x = 0; x < Type30_dynddl_Array.length; x++) {
                        var t_new_id = Type30_dynddl_Array[x].new_id;

                        if ($("#dynddl_" + t_new_id + "").is(":hidden")) {
                            hidden_Type30_Array.push(Type30_dynddl_Array[x]);
                        }

                        if ($("#div_dynddl_" + t_new_id + "").hasClass("force_hide")) { }
                        else {
                            var RowQueryWhere = Type30_dynddl_Array[x].RowQueryWhere;
                            if (RowQueryWhere == '' || RowQueryWhere == null || RowQueryWhere == undefined) { }
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
                        // call for hidden type30 dropdowns only 21012022
                        if (hidden_Type30_Array.length > 0) {
                            Type30_dynddl_Array_Global = hidden_Type30_Array;
                        }
                        localStorage.setItem('Type30_dynddl_Array', JSON.stringify(Type30_dynddl_Array_Global));

                        check_n_call_type30_service();
                    }

                }
            }


            check_set_end_date_by_duration();
        }, 2000)


        // disable elements
        for (f = 0; f < Disable_class_Array.length; f++) {
            var Disable_class = Disable_class_Array[f];
            $("." + Disable_class + " :input").prop("disabled", true);
        }

        //if (form_flag == 0 && toggle_collapse != 1) {
        if (act_form_flag == 0) {
            // var back_step_found = JSON
            // .parse(storage.getItem('back_step_found'));
            // opening collapsible step automatically
            if (collapse_id_Array.length > 0) {
                var clps_id = collapse_id_Array[0];
                collapse_id_Array.shift();

                var item = $('#div_step_Col_' + clps_id + ' > div > ul > li');
                myApp.accordionOpen(item);
                toggle_collapse_div(clps_id);
            }
            //else {
            //    check_set_end_date_by_duration();
            //}

            $('.page-content').animate({
                scrollTop: 0
            }, 10);
        }

        //-----display view photo opt for normal photo for metercrop [12022021]
        if (Type7_old_photo_class_Array.length > 0) {
            for (u = 0; u < Type7_old_photo_class_Array.length; u++) {
                var t_old_photo_class = Type7_old_photo_class_Array[u].old_photo_class;
                if (t_old_photo_class == "" || t_old_photo_class == null || t_old_photo_class == undefined) { }
                else {
                    var t_cam_ans = Type7_old_photo_class_Array[u].cam_ans;
                    var param_click = $("." + t_old_photo_class + " img[id^=cbtn_]").attr("onclick");
                    $("." + t_old_photo_class + " img[id^=cbtn_]").attr('click_action', param_click);
                    $("." + t_old_photo_class + " img[id^=cbtn_]").attr('old_photo_type', "original_photo");
                    if (t_cam_ans == "" || t_cam_ans == null || t_cam_ans == undefined) {
                        $("." + t_old_photo_class + " img[id^=cbtn_]").attr("onclick", "");
                    }
                }
                Type7_old_photo_class_Array.splice(u, 1);
            }
        }

        // check and highlight car question - atc 03032021
        if (Car_que_id_Array.length > 0) {
            highlight_car_que_group(Car_que_id_Array);
        }

        //if (glob_add_cust_from_search == "true" && form_flag == 7) {
        //    //----add new customer from search in type20 for ATC [atc.bb - 05052021]
        //    setTimeout(function () {
        //        $("#btn_type20_cust_add").trigger('click');
        //    }, 2000);
        //}

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

        //====new devlopment for control wise comments for filled form
        if (form_flag == 0 || form_flag == 2 || form_flag == 3) {
            show_control_wise_comments_for_filled_form(curr_clps_new_id, check_type);
        }

        loading_hide();
    } catch (e) {
        alert1(e + ': type = ' + jsonObj[i].type + ' of index = ' + i + ' read_dynamic_surveydata()');
        loading_hide();
    }
}

//// create button below form elments at bottom
//function read_dynamic_surveydata_buttons(buttons, Show_class_Array,
//    LL_class_Array, dependency_Array) {
//    try {
//        enable_back = 0; // disable back button
//        btnJsonObj = [];
//        var btnSN_counter = 0; // Save And Next
//        var btnGTNCC_counter = 0; // Save And Next (Go To And Change Color)
//        var btnGTWS_counter = 0; // Go To Without Save
//        var btnSNOB_counter = 0; // Save And Next Or Back
//        var btnSE_Counter = 0; // Save And Exit
//        var btnSO_Counter = 0; // Save Only
//        var btnSubmit_Counter = 0; // Submit
//        var btnCNS_Counter = 0; // Check And Submit
//        var btnUTNS_Counter = 0; // Update Task and Submit
//        var btnUTNRe_Counter = 0; // Update Task and Redirect
//        var btnReject_Counter = 0; // Reject Task
//        btnNAS_counter = 0; // NoAuto Save

//        newdiv = "";
//        btnJsonObj = buttons;


//        // define buttons
//        for (j = 0; j < btnJsonObj.length; j++) {
//            // save current step and goto next step
//            if (btnJsonObj[j].action == 'goto') {
//                var btnName = btnJsonObj[j].name;
//                var subaction = parseInt(btnJsonObj[j].subaction);
//                var btn_color = btnJsonObj[j].color;
//                if (btn_color == undefined) {
//                    // btn_color = '#337ab7';
//                    btn_color = color_btn;
//                }
//                var btn_class = "";
//                if (btnJsonObj[j].class1 != undefined) {
//                    var class_Array = btnJsonObj[j].class1;
//                    btn_class = class_Array[0];
//                    for (var c = 1; c < btnJsonObj[j].class1.length; c++) {
//                        btn_class += ' ' + class_Array[c] + '';
//                    }
//                }

//                var dis_style = '';
//                if (btn_class == "" || btn_class == null || btn_class == undefined) {
//                    btn_class = '';
//                    dis_style = '';
//                } else {
//                    dis_style = 'display:none;';
//                }

//                newdiv += '<div id="div_btnSN_' + btnSN_counter + '" class="right ' + btn_class + '"><a class="link '
//                    + btn_class + '" onclick="goto_on_click('
//                    + subaction + ')" style="' + dis_style + '">' + btnName + '</a></div>';
//                btnSN_counter++;
//            }

//            // save current step and change color of current step
//            if (btnJsonObj[j].action == 'gotonchangecolor') {
//                var btnName = btnJsonObj[j].name;
//                var subaction = parseInt(btnJsonObj[j].subaction);
//                var updatebtnindex = btnJsonObj[j].updatebtnindex;
//                var updatestep = btnJsonObj[j].updatestep;
//                var btn_color = btnJsonObj[j].color;
//                if (btn_color == undefined) {
//                    // btn_color = '#337ab7';
//                    btn_color = color_btn;
//                }
//                var btn_class = "";
//                if (btnJsonObj[j].class1 != undefined) {
//                    var class_Array = btnJsonObj[j].class1;
//                    btn_class = class_Array[0];
//                    for (var c = 1; c < btnJsonObj[j].class1.length; c++) {
//                        btn_class += ' ' + class_Array[c] + '';
//                    }
//                }

//                var dis_style = '';
//                if (btn_class == "" || btn_class == null || btn_class == undefined) {
//                    btn_class = '';
//                    dis_style = '';
//                } else {
//                    dis_style = 'display:none;';
//                }


//                newdiv += '<div id="div_btnGTNCC_' + btnGTNCC_counter + '" class="right ' + btn_class + '"><a class="link '
//                    + btn_class + '" onclick="gotonchangecolor_on_click('
//                    + subaction + ', ' + updatebtnindex + ', '
//                    + updatestep + ')" style="' + dis_style + '">' + btnName + '</a></div>';
//                btnGTNCC_counter++;
//            }

//            // direction is not defined, dependent on step array (if array size
//            // == 1 then act as back otherwise goto)
//            else if (btnJsonObj[j].action == 'goto_or_back') {
//                var btnName = btnJsonObj[j].name;
//                var subaction = parseInt(btnJsonObj[j].subaction);
//                var btn_color = btnJsonObj[j].color;
//                if (btn_color == undefined) {
//                    // btn_color = '#337ab7';
//                    btn_color = color_btn;
//                }
//                var btn_class = "";
//                if (btnJsonObj[j].class1 != undefined) {
//                    var class_Array = btnJsonObj[j].class1;
//                    btn_class = class_Array[0];
//                    for (var c = 1; c < btnJsonObj[j].class1.length; c++) {
//                        btn_class += ' ' + class_Array[c] + '';
//                    }
//                }


//                var dis_style = '';
//                if (btn_class == "" || btn_class == null || btn_class == undefined) {
//                    btn_class = '';
//                    dis_style = '';
//                } else {
//                    dis_style = 'display:none;';
//                }

//                newdiv += '<div id="div_btnSNOB_' + btnSNOB_counter + '" class="right ' + btn_class + '"><a class="link '
//                    + btn_class + '" onclick="goto_or_back_on_click('
//                    + subaction + ')" style="' + dis_style + '" >' + btnName + '</a></div>';
//                btnSNOB_counter++;
//            }

//            // goto back step without saving current step
//            else if (btnJsonObj[j].action == 'back') {
//                enable_back = 1; // 1= enable back button
//            }

//            // save current step and change status to '2' of flow
//            else if (btnJsonObj[j].action == 'submit') {
//                var btnName = btnJsonObj[j].name;
//                var subaction = parseInt(btnJsonObj[j].subaction);
//                var btn_color = btnJsonObj[j].color;
//                if (btn_color == undefined) {
//                    // btn_color = '#337ab7';
//                    btn_color = color_btn;
//                }
//                var btn_class = "";
//                if (btnJsonObj[j].class1 != undefined) {
//                    var class_Array = btnJsonObj[j].class1;
//                    btn_class = class_Array[0];
//                    for (var c = 1; c < btnJsonObj[j].class1.length; c++) {
//                        btn_class += ' ' + class_Array[c] + '';
//                    }
//                }

//                var dis_style = '';
//                if (btn_class == "" || btn_class == null || btn_class == undefined) {
//                    btn_class = '';
//                    dis_style = '';
//                } else {
//                    dis_style = 'display:none;';
//                }

//                newdiv += '<div id="div_btnSubmit_' + btnSubmit_Counter + '" class="right ' + btn_class + '"><a class="link '
//                    + btn_class + '" onclick="submit_on_click('
//                    + subaction + ')" style="' + dis_style + '" >' + btnName + '</a></div>';
//                btnSubmit_Counter++;
//            }

//            // check all step status and submit
//            else if (btnJsonObj[j].action == 'checknsubmit') {
//                var btnName = btnJsonObj[j].name;
//                var subaction = parseInt(btnJsonObj[j].subaction);
//                var updatestep = btnJsonObj[j].updatestep;
//                var btn_color = btnJsonObj[j].color;
//                if (btn_color == undefined) {
//                    // btn_color = '#337ab7';
//                    btn_color = color_btn;
//                }
//                var btn_class = "";
//                if (btnJsonObj[j].class1 != undefined) {
//                    var class_Array = btnJsonObj[j].class1;
//                    btn_class = class_Array[0];
//                    for (var c = 1; c < btnJsonObj[j].class1.length; c++) {
//                        btn_class += ' ' + class_Array[c] + '';
//                    }
//                }

//                var dis_style = '';
//                if (btn_class == "" || btn_class == null || btn_class == undefined) {
//                    btn_class = '';
//                    dis_style = '';
//                } else {
//                    dis_style = 'display:none;';
//                }

//                newdiv += '<div id="div_btnCNS_' + btnCNS_Counter + '" class="right ' + btn_class + '"><a class="link '
//                    + btn_class + '" onclick="checknsubmit_on_click('
//                    + subaction + ', ' + updatestep + ')" style="' + dis_style + '" >' + btnName + '</a></div>';
//                btnCNS_Counter++;
//            }

//            // Update task status and submit
//            else if (btnJsonObj[j].action == 'updatetasknsubmit') {
//                var btnName = btnJsonObj[j].name;
//                var subaction = parseInt(btnJsonObj[j].subaction);
//                var btn_color = btnJsonObj[j].color;
//                if (btn_color == undefined) {
//                    // btn_color = '#337ab7';
//                    btn_color = color_btn;
//                }
//                var btn_class = "";
//                if (btnJsonObj[j].class1 != undefined) {
//                    var class_Array = btnJsonObj[j].class1;
//                    btn_class = class_Array[0];
//                    for (var c = 1; c < btnJsonObj[j].class1.length; c++) {
//                        btn_class += ' ' + class_Array[c] + '';
//                    }
//                }

//                var shortest_path = btnJsonObj[j].shortest_path;
//                if (shortest_path == '' || shortest_path == null || shortest_path == undefined) {
//                    var shortest_path = "";
//                } else {
//                    var shortest_path = encodeURIComponent(JSON.stringify(shortest_path));
//                }

//                var status = btnJsonObj[j].status;
//                var dependency = btnJsonObj[j].dependency;
//                var trip = btnJsonObj[j].trip;

//                var stillviolation_event = btnJsonObj[j].stillviolation_event;
//                if (stillviolation_event == "" || stillviolation_event == null || stillviolation_event == undefined) {
//                    stillviolation_event = "";
//                }

//                var param = "updatetasknsubmit_on_click('" + subaction + "', '" + shortest_path + "','" + status + "', '" + dependency + "', '" + trip + "', '" + stillviolation_event + "')";

//                var dis_style = '';
//                if (btn_class == "" || btn_class == null || btn_class == undefined) {
//                    btn_class = '';
//                    dis_style = '';
//                } else {
//                    dis_style = 'display:none;';
//                }

//                newdiv += '<div id="div_btnUTNS_' + btnUTNS_Counter + '" class="right ' + btn_class + '"><a class="link '
//                    + btn_class + '" onclick="'
//                    + param + '" style="' + dis_style + '" >' + btnName + '</a></div>';
//                btnUTNS_Counter++;
//            }

//            // Update task status and redirect
//            else if (btnJsonObj[j].action == 'updatetasknredirect') {
//                var btnName = btnJsonObj[j].name;
//                var subaction = parseInt(btnJsonObj[j].subaction);
//                var btn_color = btnJsonObj[j].color;
//                if (btn_color == undefined) {
//                    // btn_color = '#337ab7';
//                    btn_color = color_btn;
//                }
//                var btn_class = "";
//                if (btnJsonObj[j].class1 != undefined) {
//                    var class_Array = btnJsonObj[j].class1;
//                    btn_class = class_Array[0];
//                    for (var c = 1; c < btnJsonObj[j].class1.length; c++) {
//                        btn_class += ' ' + class_Array[c] + '';
//                    }
//                }

//                var shortest_path = btnJsonObj[j].shortest_path;
//                if (shortest_path == '' || shortest_path == null || shortest_path == undefined) {
//                    var shortest_path = "";
//                } else {
//                    var shortest_path = encodeURIComponent(JSON.stringify(shortest_path));
//                }

//                var status = btnJsonObj[j].status;
//                var dependency = btnJsonObj[j].dependency;
//                var trip = btnJsonObj[j].trip;

//                var stillviolation_event = btnJsonObj[j].stillviolation_event;
//                if (stillviolation_event == "" || stillviolation_event == null || stillviolation_event == undefined) {
//                    stillviolation_event = "";
//                }

//                var param = "updatetasknredirect_on_click('" + subaction + "', '" + shortest_path + "','" + status + "', '" + dependency + "', '" + trip + "', '" + stillviolation_event + "')";

//                var dis_style = '';
//                if (btn_class == "" || btn_class == null || btn_class == undefined) {
//                    btn_class = '';
//                    dis_style = '';
//                } else {
//                    dis_style = 'display:none;';
//                }

//                newdiv += '<div id="div_btnUTNRe_' + btnUTNRe_Counter + '" class="right ' + btn_class + '"><a class="link '
//                    + btn_class + '" onclick="'
//                    + param + '" style="' + dis_style + '" >' + btnName + '</a></div>';
//                btnUTNRe_Counter++;
//            }

//            // save current step and goto sitelist
//            else if (btnJsonObj[j].action == 'savenexit') {
//                var btnName = btnJsonObj[j].name;
//                var subaction = parseInt(btnJsonObj[j].subaction);
//                var btn_color = btnJsonObj[j].color;
//                if (btn_color == undefined) {
//                    // btn_color = '#337ab7';
//                    btn_color = color_btn;
//                }
//                var btn_class = "";
//                if (btnJsonObj[j].class1 != undefined) {
//                    var class_Array = btnJsonObj[j].class1;
//                    btn_class = class_Array[0];
//                    for (var c = 1; c < btnJsonObj[j].class1.length; c++) {
//                        btn_class += ' ' + class_Array[c] + '';
//                    }
//                }


//                var dis_style = '';
//                if (btn_class == "" || btn_class == null || btn_class == undefined) {
//                    btn_class = '';
//                    dis_style = '';
//                } else {
//                    dis_style = 'display:none;';
//                }

//                newdiv += '<div id="div_btnSE_' + btnSE_Counter + '" class="right ' + btn_class + '"><a class="link '
//                    + btn_class + '" onclick="savenexit_on_click('
//                    + subaction + ')" style="' + dis_style + '" >' + btnName + '</a></div>';
//                btnSE_Counter++;
//            }

//            // save current step only no forward backward or exit
//            else if (btnJsonObj[j].action == 'saveonly') {
//                var btnName = btnJsonObj[j].name;
//                var subaction = parseInt(btnJsonObj[j].subaction);
//                var btn_color = btnJsonObj[j].color;
//                if (btn_color == undefined) {
//                    btn_color = color_btn;
//                }
//                var btn_class = "";
//                if (btnJsonObj[j].class1 != undefined) {
//                    var class_Array = btnJsonObj[j].class1;
//                    btn_class = class_Array[0];
//                    for (var c = 1; c < btnJsonObj[j].class1.length; c++) {
//                        btn_class += ' ' + class_Array[c] + '';
//                    }
//                }


//                var dis_style = '';
//                if (btn_class == "" || btn_class == null || btn_class == undefined) {
//                    btn_class = '';
//                    dis_style = '';
//                } else {
//                    dis_style = 'display:none;';
//                }

//                newdiv += '<div id="div_btnSO_' + btnSO_Counter + '" class="right ' + btn_class + '"><a class="link '
//                    + btn_class + '" onclick="saveonly_on_click('
//                    + subaction + ')" style="' + dis_style + '" >' + btnName + '</a></div>';
//                btnSO_Counter++;
//            }

//            // act as goto but without checking validation
//            else if (btnJsonObj[j].action == 'gotowithoutsave') {
//                var btnName = btnJsonObj[j].name;
//                var subaction = parseInt(btnJsonObj[j].subaction);
//                var btn_color = btnJsonObj[j].color;
//                if (btn_color == undefined) {
//                    // btn_color = '#337ab7';
//                    btn_color = color_btn;
//                }
//                var btn_class = "";
//                if (btnJsonObj[j].class1 != undefined) {
//                    var class_Array = btnJsonObj[j].class1;
//                    btn_class = class_Array[0];
//                    for (var c = 1; c < btnJsonObj[j].class1.length; c++) {
//                        btn_class += ' ' + class_Array[c] + '';
//                    }
//                }


//                var dis_style = '';
//                if (btn_class == "" || btn_class == null || btn_class == undefined) {
//                    btn_class = '';
//                    dis_style = '';
//                } else {
//                    dis_style = 'display:none;';
//                }

//                newdiv += '<div id="div_btnGTWS_' + btnGTWS_counter + '" class="right ' + btn_class + '"><a class="link '
//                    + btn_class + '" onclick="gotowithoutsave_on_click('
//                    + subaction + ')" style="' + dis_style + '" >' + btnName + '</a></div>';
//                btnGTWS_counter++;
//            }

//            // save current step and change status to reject status of current
//            // checksheet
//            else if (btnJsonObj[j].action == 'reject') {
//                var subaction = parseInt(btnJsonObj[j].subaction);
//                var btnName = btnJsonObj[j].name;
//                var btn_color = btnJsonObj[j].color;
//                if (btn_color == undefined) {
//                    // btn_color = '#337ab7';
//                    btn_color = color_btn;
//                }
//                var btn_class = "";
//                if (btnJsonObj[j].class1 != undefined) {
//                    var class_Array = btnJsonObj[j].class1;
//                    btn_class = class_Array[0];
//                    for (var c = 1; c < btnJsonObj[j].class1.length; c++) {
//                        btn_class += ' ' + class_Array[c] + '';
//                    }
//                }


//                var dis_style = '';
//                if (btn_class == "" || btn_class == null || btn_class == undefined) {
//                    btn_class = '';
//                    dis_style = '';
//                } else {
//                    dis_style = 'display:none;';
//                }

//                newdiv += '<div id="div_btnReject_' + btnReject_Counter + '" class="right ' + btn_class + '"><a class="link '
//                    + btn_class + '" onclick="reject_on_click('
//                    + subaction + ')" style="' + dis_style + '" >' + btnName + '</a></div>';
//                btnReject_Counter++;
//            }
//            // else if (btnJsonObj[j].action == 'exit') {
//            // var btnName = btnJsonObj[j].name;
//            // var subaction = parseInt(btnJsonObj[j].subaction);
//            // newdiv += '<div id="div_btnExit_' + btnExit_Counter
//            // + '" style="padding:10px"><input type="button" value="'
//            // + btnName + '" onclick="exit_on_click(' + subaction
//            // + ')" /></div>';
//            // btnExit_Counter++;
//            // }

//            // Create task / Create and Refresh Task
//            else if (btnJsonObj[j].action == 'create' || btnJsonObj[j].action == 'createandrefresh') {
//                var btnName = btnJsonObj[j].name;
//                var btn_color = btnJsonObj[j].color;
//                if (btn_color == undefined) {
//                    btn_color = color_btn;
//                }
//                var btn_class = "";
//                if (btnJsonObj[j].class1 != undefined) {
//                    var class_Array = btnJsonObj[j].class1;
//                    btn_class = class_Array[0];
//                    for (var c = 1; c < btnJsonObj[j].class1.length; c++) {
//                        btn_class += ' ' + class_Array[c] + '';
//                    }
//                }

//                var dis_style = '';
//                if (btn_class == "" || btn_class == null || btn_class == undefined) {
//                    btn_class = '';
//                    dis_style = '';
//                } else {
//                    dis_style = 'display:none;';
//                }

//                var status = btnJsonObj[j].status;
//                var redirect = btnJsonObj[j].redirect;

//                var param = "create_task_on_click('" + status + "','" + redirect + "')";
//                newdiv += '<div class="right ' + btn_class + '"><a class="link ' + btn_class + '" onclick="' + param + '" style="' + dis_style + '" >' + btnName + '</a></div>';
//            }
//            else if (btnJsonObj[j].action == 'noautosave') {
//                var subaction = parseInt(btnJsonObj[j].subaction);
//                var btnName = btnJsonObj[j].name;
//                var btn_color = btnJsonObj[j].color;
//                if (btn_color == undefined) {
//                    // btn_color = '#337ab7';
//                    btn_color = color_btn;
//                }
//                var btn_class = "";
//                if (btnJsonObj[j].class1 != undefined) {
//                    var class_Array = btnJsonObj[j].class1;
//                    btn_class = class_Array[0];
//                    for (var c = 1; c < btnJsonObj[j].class1.length; c++) {
//                        btn_class += ' ' + class_Array[c] + '';
//                    }
//                }

//                var dis_style = '';
//                if (btn_class == "" || btn_class == null || btn_class == undefined) {
//                    btn_class = '';
//                    dis_style = 'display:none;';
//                } else {
//                    dis_style = 'display:none;';
//                }

//                newdiv += '<div id="div_btnNAS_counter_' + btnNAS_counter + '" class="right ' + btn_class + '"><a class="link '
//                    + btn_class + '" onclick="reject_on_click('
//                    + subaction + ')" style="' + dis_style + '" >' + btnName + '</a></div>';
//                btnNAS_counter++;
//            }

//        }


//        /////shortcut buttons for checkheet form
//        var data_json = JSON.parse(storage.getItem('list_json'));
//        var list_data = JSON.parse(data_json);
//        var buttons = list_data[0].buttons;
//        if (buttons == '' || buttons == null || buttons == undefined || buttons.length == 0) { }
//        else {
//            var siteid = JSON.parse(storage.getItem('siteid'));
//            var tid = JSON.parse(storage.getItem('tid'));
//            var start_status = JSON.parse(storage.getItem('start_status'));
//            var wayflow = JSON.parse(storage.getItem('wayflow'));
//            var wayflow_name = JSON.parse(storage.getItem('wayflow_name'));
//            var sitename = JSON.parse(storage.getItem('sitename'));
//            var server_task_id = JSON.parse(storage.getItem('server_task_id'));
//            var site_lat = JSON.parse(storage.getItem('site_lat'));;
//            var site_long = JSON.parse(storage.getItem('site_long'));;
//            var curr_date = new Date();
//            var survey_date = curr_date.toUTCString();
//            var ser_milli = curr_date.getTime();

//            var btn_len = buttons.length;
//            var btn_count = 0;
//            var param_btn = '';
//            for (b = 0; b < btn_len; b++) {
//                var enabled = false;
//                var btn_checkssheetid = buttons[b].checksheet_id;
//                var btn_status = buttons[b].status;
//                var placement = buttons[b].placement;
//                if (placement == 'form' || placement == 'all') {
//                    var view_dependancy = buttons[b].view_dependancy;
//                    if (view_dependancy == 'always') { enabled = true; }
//                    else if (view_dependancy == 'status') {
//                        var dependancy_status = buttons[b].dependancy_status;
//                        var dlen = dependancy_status.length
//                        var t_status = myArray[0].status;
//                        for (s = 0; s < dlen; s++) {
//                            if (dependancy_status[s] == t_status) {
//                                enabled = true;
//                                break;
//                            }
//                        }
//                    }

//                    if (enabled == true) {
//                        var submit_message = buttons[b].submit_message;
//                        var param_btn = "update_task_by_shortcut_button('" + btn_checkssheetid + "','" + btn_status + "', '" + siteid + "', '" + tid + "', '" + start_status + "','" + wayflow + "', '" + wayflow_name + "', '" + sitename + "', '" + server_task_id + "', '" + site_lat + "', '" + site_long + "', '" + survey_date + "', '" + ser_milli + "', '" + submit_message + "')";
//                        btn_count++;

//                        var type20_columndata = JSON.parse(storage.getItem('type20_columndata'));
//                        if (type20_columndata == '' || type20_columndata == null || type20_columndata == undefined) {
//                            type20_columndata = [];
//                        }
//                        newdiv += '<input type="hidden" id="lst_sys_var_' + server_task_id + '" value="' + encodeURIComponent(JSON.stringify(type20_columndata)) + '">'
//                        if (btn_checkssheetid == 0) {
//                            var sb_icon = "fa-paper-plane";
//                        }
//                        else {
//                            var sb_icon = "fa-share-square-o";
//                        }

//                        newdiv += '<div style="text-align: center;"><i class="fa ' + sb_icon + '" style="font-size: 20px;display: inline-block; color: #fff !important;vertical-align: middle;"></i>';
//                        newdiv += '<a class="link" onclick="' + param_btn + '" style="display: inline-block;">' + buttons[b].name + '</a></div>';
//                    }
//                }
//            }
//        }
//        ///////////

//        if (btnJsonObj.length == 0) {
//            // customer form form flag 7
//        }
//        else {
//            $("#container_btn_div").empty();
//            var data_json = JSON.parse(storage.getItem('list_json'));
//            var list_data = JSON.parse(data_json);
//            var task_progress = list_data[0].task_progress;
//            if (task_progress == 'true' || task_progress == '' || task_progress == null || task_progress == undefined) {
//                var pro_str = '<a class="link btn_progress" onclick="show_checksheet_progress_popup()">PROGRESS</a>';
//                $("#container_btn_div").append('<div class="left">' + pro_str + '</div>' + newdiv);
//            }
//            else {
//                $("#container_btn_div").append(newdiv);
//                var btn_cnt = $("#container_btn_div a").length;
//                if (task_progress == 'false' && btn_cnt == 1) {
//                    $("#container_btn_div").css("display", "block");
//                    $("#container_btn_div .right").css("float", "right");
//                }
//                else {
//                    var btn_width = parseFloat(100 / btn_cnt) + '%';
//                    $("#container_btn_div div").css({
//                        'width': btn_width
//                    });
//                }
//            }
//        }

//        myApp.setProgressbar('#chk_progress', chk_progress_data[0].progress);

//        var site_name = JSON.parse(storage.getItem('sitename'));
//        if (site_name == '' || site_name == null || site_name == undefined) {
//            site_name = 'N/A';
//        }
//        $('#lbl_prg_per').text(chk_progress_data[0].progress + '%');
//        $('#lbl_prg_flow').text(chk_progress_data[0].flow);
//        $('#lbl_prg_site').text(site_name);
//        $('#lbl_prg_chk').text(chk_progress_data[0].checksheet);
//        $('#lbl_prg_step').text(chk_progress_data[0].step);
//        $('#lbl_prg_curr_step').text(chk_progress_data[0].curr_step);
//        $('#lbl_prg_com_step').text(chk_progress_data[0].com_step);
//        $('#lbl_prg_tot_step').text(chk_progress_data[0].tot_step);

//        read_dynamic_surveydata_checks(Show_class_Array, LL_class_Array,
//            dependency_Array);

//    } catch (e) {
//        alert1(e + '_read_dynamic_surveydata_buttons()');
//        loading_hide();
//    }

//}

// validate crashes and other checks
function read_dynamic_surveydata_checks(Show_class_Array, LL_class_Array,
    dependency_Array) {
    try {
        // retrieve last photo when crash in camera 7,9,11
        var crash_status = JSON.parse(storage.getItem('crash_status'));
        if (crash_status == null || crash_status == undefined
            || crash_status == '') {
            crash_status = 0;
        }
        if (crash_status == 1) {
            // application has been crashed
            var camera_type = JSON.parse(storage.getItem('camera_type'));
            if (camera_type == '28') {
                loading_hide();
            }
            else {
                get_last_photo_path();
            }
        }
        else if (crash_status == 3) {
            // application has been crashed during RF Tracking plugin call
            var last_invoice_id = localStorage.getItem("last_invoice_id");
            $("#btn_add_row_" + last_invoice_id + "").trigger("onclick");

            loading();
            setTimeout(function () {
                var rf_mode_class = localStorage.getItem("rf_mode_class");
                var rf_new_id = localStorage.getItem("rf_new_id");
                get_RF_Tracking_invoice(rf_mode_class, rf_new_id);
            }, 1000);
        }
        else {
            storage.setItem('crash_status', JSON.stringify('0'));
        }

        if (curr_clps_new_id == 0 || form_flag == 3) {

            // show latlong numeric box while reading survey
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

            //--type20 dependency for dropdown onchange--- for ATC(rahul.vt) [22102020]
            for (h = 0; h < Type20_Dep_Array.length; h++) {
                var t_new_id = Type20_Dep_Array[h].id;
                var t_val = Type20_Dep_Array[h].val;
                var type20_dependency_str = $('#hdn_type20_dependency_data_' + t_new_id + '').val();
                if (type20_dependency_str == '' || type20_dependency_str == null || type20_dependency_str == undefined) { }
                else {
                    var type20_dependency_data = JSON.parse(decodeURIComponent(type20_dependency_str));
                    if (type20_dependency_data.length > 0) {
                        for (d = 0; d < type20_dependency_data.length; d++) {
                            type20_dependency_data[d].ele_ans = t_val;
                        }
                        var paramData = JSON.stringify(type20_dependency_data);
                        set_global_show_hide_class(encodeURIComponent(paramData))
                        $('#hdn_type20_dependency_data_' + t_new_id + '').val(encodeURIComponent(JSON.stringify(type20_dependency_data)))

                    }
                }
            }

            // automatically calling for hide/show questions elements (classes used in dependency)
            // selected dependency has highest priority in case of readsurvey - 03032021 atclive
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
                else if (t_dep_type == 5) {
                    // Type22 dependency
                    show_hide_Element_Type22_Readsurvey(paramData);
                }
            }




        }

        // bind keyup event for invoice search box
        $('#inv_item_Search_0').keyup(
            function (e) {
                var invoice_counter = 0;
                get_product_list(e.keyCode, invoice_counter,
                    "#inv_item_Search_0", "#div_item_Bucket_0");
                // if (e.keyCode == 13) {
                // // Enter pressed... do anything here...
                // }
            });

        enable_back_button();

    } catch (e) {
        alert1(e + '_read_dynamic_surveydata_checks()')
        loading_hide();
    }
}

function check_collapse_json_to_show_hide_ele(check_type, jsonObjData,
    Show_class_Array, LL_class_Array, dependency_Array) {
    try {
        if (collapse_Json.length > 0) {
            var list_type = collapse_Json[0].list_type;
        }

        //if (form_flag == 3) {                                                         //commented coz issue in type20 in edit collapsible [FT-09062025]
        //    read_dynamic_surveydata_checks(Show_class_Array, LL_class_Array, dependency_Array);
        //}
        //else {
        //    show_hide_collapse_que_id(check_type, jsonObjData, Show_class_Array, LL_class_Array, dependency_Array);
        //}

        show_hide_collapse_que_id(check_type, jsonObjData, Show_class_Array, LL_class_Array, dependency_Array);

    } catch (e) {
        alert1(e + '_check_collapse_array_to_show_hide_ele()');
    }
}

// show/hide collapse que id as per list_type
function show_hide_collapse_que_id(check_type, jsonObjData, Show_class_Array,
    LL_class_Array, dependency_Array) {
    try {
        var que_id_list = collapse_Json[0].que_id_list;
        var list_type = collapse_Json[0].list_type;

        if (list_type == "hide_blank") {
            var display_type = "none";
        } else {
            if (list_type == "show" || list_type == "show_all") {
                var display_type = "block";
                var display_type_alt = "none";
            } else {
                var display_type = "none";
                var display_type_alt = "block";
            }
        }

        if (form_flag == 3 && (list_type == "show" || list_type == "show_all")) {
            // disable questions in case of collapsible edit mode 15112022
            for (y = 0; y < jsonObjData.length; y++) {
                var new_id = curr_clps_new_id + "_" + check_type + "_" + jsonObjData[y].que_id;

                if (list_type == "show_all") {
                    found = 1;
                }
                else {
                    var found = 0;
                    for (z = 0; z < que_id_list.length; z++) {
                        if (jsonObjData[y].que_id == que_id_list[z]) {
                            // element found in que list
                            found++;
                            break;     //new logic (not before)
                        }
                    }
                }

                if (found == 0) {
                    // disable those questions which are not exist in question list
                    var ele_divs = $("div[id$=" + new_id + "]");
                    for (e = 0; e < ele_divs.length; e++) {
                        if ($(ele_divs[e]).find("select[id^=ddl_search_type20]").length > 0) {
                            $(ele_divs[e]).find(".item-input.item-input-field.form-div").attr("disabled", "disabled");                      //disabled searchable div click [FT-09062025]
                        }
                        else {
                            $(ele_divs[e]).find("input, select, textarea").attr("disabled", "disabled");
                        }

                        //    var ele = $(ele_divs[e]);
                        //    setTimeout(function (ele) {
                        //        $(ele).find("button").attr("disabled", "disabled");
                        //        $(ele).removeAttr("onclick");
                        //        $(ele).find("button").removeAttr("onclick");

                        //        $(ele).find(".filter-option-inner-inner").css("color", "#000000e3");
                        //        $(ele).find("input, button").css("background-color", "#e9ecef");
                        //        $(ele).find("button").css("color", "gray");
                        //    }, 1000, ele);
                    }
                }
            }
        }
        else {
            // summary mode

            if (list_type == "" || list_type == undefined || list_type == null) {
                // show default form
            }
            else {
                // show filtered form
                for (y = 0; y < jsonObjData.length; y++) {
                    // var new_id = check_type + "_" + jsonObjData[y].que_id;
                    var new_id = curr_clps_new_id + "_" + check_type + "_"
                        + jsonObjData[y].que_id;

                    if (list_type == "hide_blank") {
                        // for list_type hide_blank"
                        // hide elements where answer is blank
                        var ans = jsonObjData[y].ans;
                        if (ans == "" || ans == undefined || ans == null) {
                            var answer = 0;
                        } else {
                            var answer = 1;
                        }

                        if (jsonObjData[y].type == 1 && answer == 0) {
                            $("#div_txt_" + new_id + "").css("display",
                                display_type);
                        } else if (jsonObjData[y].type == 2 && answer == 0) {
                            $("#div_rdo_" + new_id + "").css("display",
                                display_type);
                        } else if (jsonObjData[y].type == 3 && answer == 0) {
                            $("#div_ddl_" + new_id + "").css("display",
                                display_type);
                        } else if (jsonObjData[y].type == 4 && answer == 0) {
                            $("#div_txtno_" + new_id + "").css("display",
                                display_type);
                        } else if (jsonObjData[y].type == 6 && answer == 0) {
                            $("#div_chk_" + new_id + "").css("display",
                                display_type);
                        } else if (jsonObjData[y].type == 7 && answer == 0) {
                            $("#div_cbtn_" + new_id + "").css("display",
                                display_type);
                        } else if (jsonObjData[y].type == 8 && answer == 0) {
                            $("#div_cal_" + new_id + "").css("display",
                                display_type);
                        } else if (jsonObjData[y].type == 9 && answer == 0) {
                            $("#div_sign_" + new_id + "").css("display",
                                display_type);
                        } else if (jsonObjData[y].type == 11 && answer == 0) {
                            $("#div_cbtnLL_" + new_id + "").css("display",
                                display_type);
                        } else if (jsonObjData[y].type == 12 && answer == 0) {
                            $("#div_txtrange_" + new_id + "").css("display",
                                display_type);
                        } else if (jsonObjData[y].type == 13 && answer == 0) {
                            $("#div_LatLong_" + new_id + "").css("display",
                                display_type);
                        } else if (jsonObjData[y].type == 15 && answer == 0) {
                            $("#div_MSL_" + new_id + "").css("display",
                                display_type);
                        } else if (jsonObjData[y].type == 16 && answer == 0) {
                            $("#div_Dist_" + new_id + "").css("display",
                                display_type);
                        } else if (jsonObjData[y].type == 17 && answer == 0) {
                            $("#div_Calc_" + new_id + "").css("display",
                                display_type);
                        } else if (jsonObjData[y].type == 19 && answer == 0) {
                            $("#div_Inv_" + new_id + "").css("display",
                                display_type);
                        } else if (jsonObjData[y].type == 20 && answer == 0) {
                            $("#div_Search_" + new_id + "").css("display",
                                display_type);
                        } else if (jsonObjData[y].type == 21 && answer == 0) {
                            $("#div_S_Search_" + new_id + "").css("display",
                                display_type);
                        } else if (jsonObjData[y].type == 22 && answer == 0) {
                            $("#div_Inv_Calculate_" + new_id + "").css("display",
                                display_type);
                        } else if (jsonObjData[y].type == 23 && answer == 0) {
                            $("#div_step_Col_" + new_id + "").css("display",
                                display_type);
                        } else if (jsonObjData[y].type == 24 && answer == 0) {
                            $("#div_print_" + new_id + "").css("display",
                                display_type);
                        } else if (jsonObjData[y].type == 25 && answer == 0) {
                            $("#div_scn_" + new_id + "").css("display",
                                display_type);
                        } else if (jsonObjData[y].type == 26 && answer == 0) {
                            $("#div_upload_doc_" + new_id + "").css("display",
                                display_type);
                        } else if (jsonObjData[y].type == 27 && answer == 0) {
                            $("#div_pdfviewer_" + new_id + "").css("display",
                                display_type);
                        }
                        else if (jsonObjData[y].type == 28 && answer == 0) {
                            $("#div_video_" + new_id + "").css("display",
                                display_type);
                        }
                        else if (jsonObjData[y].type == 29 && answer == 0) {
                            $("#div_trip_" + new_id + "").css("display",
                                display_type);
                        }

                        if (jsonObjData[y].type == 0 || jsonObjData[y].type == 10) { }
                        else if (answer == 0) {
                            hide_lable_from_collapsible(check_type, jsonObjData, y);
                        }

                    } else {
                        // for list_type "show" & "hide"
                        if (list_type == "show_all") {
                            found = 1;
                        }
                        else {
                            // hide show list items as per list_type
                            var f7_type23_popup_dis = $('.popup-type23').css('display');
                            var found = 0;
                            for (z = 0; z < que_id_list.length; z++) {
                                if (jsonObjData[y].que_id == que_id_list[z]) {
                                    // element found in que list
                                    found++;
                                    break; // new logic (not before)
                                }
                            }
                        }
                        if (found > 0) {
                            if (jsonObjData[y].type == 0) {
                                $("#div_que_" + new_id + "").css("display",
                                    display_type);
                                if (F7_view == 'true' && f7_type23_popup_dis == 'none') {
                                    $("#div_que_" + new_id + "").css("box-shadow", "none");
                                }
                            } else if (jsonObjData[y].type == 1) {
                                $("#div_txt_" + new_id + "").css("display",
                                    display_type);
                            } else if (jsonObjData[y].type == 2) {
                                $("#div_rdo_" + new_id + "").css("display",
                                    display_type);
                            } else if (jsonObjData[y].type == 3) {
                                $("#div_ddl_" + new_id + "").css("display",
                                    display_type);
                            } else if (jsonObjData[y].type == 4) {
                                $("#div_txtno_" + new_id + "").css("display",
                                    display_type);
                            } else if (jsonObjData[y].type == 5) {
                                $("#div_lbl_" + new_id + "").css("display",
                                    display_type);
                            } else if (jsonObjData[y].type == 6) {
                                $("#div_chk_" + new_id + "").css("display",
                                    display_type);
                            } else if (jsonObjData[y].type == 7) {
                                $("#div_cbtn_" + new_id + "").css("display",
                                    display_type);
                            } else if (jsonObjData[y].type == 8) {
                                $("#div_cal_" + new_id + "").css("display",
                                    display_type);
                            } else if (jsonObjData[y].type == 9) {
                                $("#div_sign_" + new_id + "").css("display",
                                    display_type);
                            } else if (jsonObjData[y].type == 11) {
                                $("#div_cbtnLL_" + new_id + "").css("display",
                                    display_type);
                            } else if (jsonObjData[y].type == 12) {
                                $("#div_txtrange_" + new_id + "").css("display",
                                    display_type);
                            } else if (jsonObjData[y].type == 13) {
                                $("#div_LatLong_" + new_id + "").css("display",
                                    display_type);
                            } else if (jsonObjData[y].type == 15) {
                                $("#div_MSL_" + new_id + "").css("display",
                                    display_type);
                            } else if (jsonObjData[y].type == 16) {
                                $("#div_Dist_" + new_id + "").css("display",
                                    display_type);
                            } else if (jsonObjData[y].type == 17) {
                                $("#div_Calc_" + new_id + "").css("display",
                                    display_type);
                            } else if (jsonObjData[y].type == 19) {
                                $("#div_Inv_" + new_id + "").css("display",
                                    display_type);
                            } else if (jsonObjData[y].type == 20) {
                                $("#div_Search_" + new_id + "").css("display",
                                    display_type);
                            } else if (jsonObjData[y].type == 21) {
                                $("#div_S_Search_" + new_id + "").css("display",
                                    display_type);
                            } else if (jsonObjData[y].type == 22) {
                                $("#div_Inv_Calculate_" + new_id + "").css(
                                    "display", display_type);
                            } else if (jsonObjData[y].type == 23) {
                                $("#div_step_Col_" + new_id + "").css("display",
                                    display_type);
                            } else if (jsonObjData[y].type == 24) {
                                $("#div_print_" + new_id + "").css("display",
                                    display_type);
                            } else if (jsonObjData[y].type == 25) {
                                $("#div_scn_" + new_id + "").css("display",
                                    display_type);
                            } else if (jsonObjData[y].type == 26) {
                                $("#div_upload_doc_" + new_id + "").css("display",
                                    display_type);
                            } else if (jsonObjData[y].type == 27) {
                                $("#div_pdfviewer_" + new_id + "").css("display",
                                    display_type);
                            }
                            else if (jsonObjData[y].type == 28) {
                                $("#div_video_" + new_id + "").css("display",
                                    display_type);
                            }
                            else if (jsonObjData[y].type == 29) {
                                $("#div_trip_" + new_id + "").css("display",
                                    display_type);
                            }
                        } else {
                            if (jsonObjData[y].type == 0) {
                                $("#div_que_" + new_id + "").css("display",
                                    display_type_alt);
                                if (F7_view == 'true' && f7_type23_popup_dis == 'none') {
                                    $("#div_que_" + new_id + "").css("box-shadow", "none");
                                }
                            } else if (jsonObjData[y].type == 1) {
                                $("#div_txt_" + new_id + "").css("display",
                                    display_type_alt);
                            } else if (jsonObjData[y].type == 2) {
                                $("#div_rdo_" + new_id + "").css("display",
                                    display_type_alt);
                            } else if (jsonObjData[y].type == 3) {
                                $("#div_ddl_" + new_id + "").css("display",
                                    display_type_alt);
                            } else if (jsonObjData[y].type == 4) {
                                $("#div_txtno_" + new_id + "").css("display",
                                    display_type_alt);
                            } else if (jsonObjData[y].type == 5) {
                                $("#div_lbl_" + new_id + "").css("display",
                                    display_type_alt);
                            } else if (jsonObjData[y].type == 6) {
                                $("#div_chk_" + new_id + "").css("display",
                                    display_type_alt);
                            } else if (jsonObjData[y].type == 7) {
                                $("#div_cbtn_" + new_id + "").css("display",
                                    display_type_alt);
                            } else if (jsonObjData[y].type == 8) {
                                $("#div_cal_" + new_id + "").css("display",
                                    display_type_alt);
                            } else if (jsonObjData[y].type == 9) {
                                $("#div_sign_" + new_id + "").css("display",
                                    display_type_alt);
                            } else if (jsonObjData[y].type == 11) {
                                $("#div_cbtnLL_" + new_id + "").css("display",
                                    display_type_alt);
                            } else if (jsonObjData[y].type == 12) {
                                $("#div_txtrange_" + new_id + "").css("display",
                                    display_type_alt);
                            } else if (jsonObjData[y].type == 13) {
                                $("#div_LatLong_" + new_id + "").css("display",
                                    display_type_alt);
                            } else if (jsonObjData[y].type == 15) {
                                $("#div_MSL_" + new_id + "").css("display",
                                    display_type_alt);
                            } else if (jsonObjData[y].type == 16) {
                                $("#div_Dist_" + new_id + "").css("display",
                                    display_type_alt);
                            } else if (jsonObjData[y].type == 17) {
                                $("#div_Calc_" + new_id + "").css("display",
                                    display_type_alt);
                            } else if (jsonObjData[y].type == 19) {
                                $("#div_Inv_" + new_id + "").css("display",
                                    display_type_alt);
                            } else if (jsonObjData[y].type == 20) {
                                $("#div_Search_" + new_id + "").css("display",
                                    display_type_alt);
                            } else if (jsonObjData[y].type == 21) {
                                $("#div_S_Search_" + new_id + "").css("display",
                                    display_type_alt);
                            } else if (jsonObjData[y].type == 22) {
                                $("#div_Inv_Calculate_" + new_id + "").css(
                                    "display", display_type_alt);
                            } else if (jsonObjData[y].type == 23) {
                                $("#div_step_Col_" + new_id + "").css(
                                    "display", display_type_alt);
                            } else if (jsonObjData[y].type == 24) {
                                $("#div_print_" + new_id + "").css("display",
                                    display_type_alt);
                            } else if (jsonObjData[y].type == 25) {
                                $("#div_print_" + new_id + "").css("display",
                                    display_type_alt);
                            } else if (jsonObjData[y].type == 26) {
                                $("#div_upload_doc_" + new_id + "").css("display",
                                    display_type_alt);
                            } else if (jsonObjData[y].type == 27) {
                                $("#div_pdfviewer_" + new_id + "").css("display",
                                    display_type_alt);
                            }
                            else if (jsonObjData[y].type == 28) {
                                $("#div_video_" + new_id + "").css("display",
                                    display_type_alt);
                            }
                            else if (jsonObjData[y].type == 29) {
                                $("#div_trip_" + new_id + "").css("display",
                                    display_type_alt);
                            }
                        }
                    }
                }
            }
        }

        // opening collapsible step automatically and in sequence
        // enable again for Myaims (issue - multiple collapsible are not filled) - 23012024
        if (form_flag == 0) {
            var back_step_found = JSON.parse(storage.getItem('back_step_found'));
            if (back_step_found == 1) {
                if (collapse_id_Array.length > 0) {
                    var clps_id = collapse_id_Array[0];
                    collapse_id_Array.shift();
                    toggle_collapse_div(clps_id);
                }
            }
        }
        // ///////////////

        read_dynamic_surveydata_checks(Show_class_Array, LL_class_Array,
            dependency_Array);
    } catch (e) {
        alert1(e + '_show_hide_collapse_que_id()');
    }
}



//hide lable from collapsible when control is hidden(answer is blank)
function hide_lable_from_collapsible(check_type, jsonObjData, index) {
    if (jsonObjData[index - 1].type == 5) {
        //check if previous index is type 5 with blank control
        var lbl_new_id = curr_clps_new_id + "_" + check_type + "_" + jsonObjData[index - 1].que_id;
        $("#div_lbl_" + lbl_new_id + "").css("display", "none");
    }
}

get_summary_str = (t_new_id, t_name, ans_str, t_check_type, t_que_id, ctrl_json, build_obj) => {

    let summary_str = '';
    summary_str += '<table class="tbl_read_only"><tr>';
    summary_str += '<td><label class="lbl_read_only">' + t_name + '</label>';
    summary_str += '</td>';

    if (ctrl_json == '' || ctrl_json == null || ctrl_json == undefined) { }
    else {
        let ctrl_type = ctrl_json.type;
        if (ctrl_type == 7) {
            let str = '';
            if (ans_str == '' || ans_str == null || ans_str == undefined) { }
            else {
                let onclick_str = "onclick = '" + build_obj.param + "'";
                let onerror_str = "onerror = '" + build_obj.param1 + "'";

                str += '<img src="' + build_obj.src_str + '" id="cbtn_' + build_obj.new_id
                    + '" ' + onclick_str + ' ' + onerror_str + ' index="' + build_obj.index + '" style="height:50px; width:50px; border-radius: 7px" name="' + build_obj.name + '" target_class="' + build_obj.target_class + '" old_photo_class="' + build_obj.old_photo_class + '" que_id = "' + build_obj.que_id + '"/>';
            }
            ans_str = str;
        }
        else if (ctrl_type == 9) {
            let str = '';
            if (ans_str == '' || ans_str == null || ans_str == undefined) { }
            else {
                let onclick_str = "onclick = '" + build_obj.param + "'";
                let onerror_str = "onerror = '" + build_obj.param1 + "'";

                str += '<img src="' + build_obj.src_str + '" id="sign_' + build_obj.new_id
                    + '" ' + onclick_str + ' ' + onerror_str + ' style="height:50px; width:50px; border-radius: 7px" name="' + build_obj.name + '"/>';
            }
            ans_str = str;
        }
        else if (ctrl_type == 28) {
            let str = '';
            if (ans_str == '' || ans_str == null || ans_str == undefined) { }
            else {
                let video_path = ctrl_json.ans[0];
                let Photo_Name = video_path.split('/').pop().split('#')[0].split('?')[0];
                let video_url = get_upload_media_live_link(ctrl_json.que_id, check_type);
                let download_video_param = "Download_PDFFile('" + video_url + "','" + video_path + "')";
                str += '<label class="filled-file" onclick="' + download_video_param + '" title="Download Video" style="color:blue">' + Photo_Name + '</label>';

                let play_video_param = "preview_video('" + video_url + "')";
                str += '<button type="button" class="btn cls_preview_video" style="padding: 0px;width: 25px;height: 25px;" title="Play Video" onclick="' + play_video_param + '"><i class="fa fa-play-circle" aria-hidden="true" style="margin-right: 0px;font-size: 20px;"></i></button>';
            }
            ans_str = str;
        }
    }

    summary_str += '<td><span class="cls-read-only">' + ans_str + '</span>';

    ////commented as added comment icon on swipe right [FT-12022025]
    //let comment_str = get_comment_str(t_new_id, t_check_type, t_name, t_que_id);
    //summary_str += comment_str;

    summary_str += '</td>';

    summary_str += '</tr></table>';

    return summary_str;
}

////commented as added comment icon on swipe right [FT-12022025]
//get_comment_str = (t_new_id, check_type, t_name, que_id) => {

//    let comment_str = '';
//    comment_str += '<div class="cls-cntrl-comment-outer" id="container_cntrl_cmnt_' + t_new_id + '" style="display: inline;margin-left:5px;">';
//    comment_str += '<i class="fa fa-comments icon-cntrl-cmnt cls-cmnt-cntrl" cntrl_checksheet_id="' + check_type + '" cntrl_que_id="' + que_id + '" cntrl_que_name="' + t_name + '"></i>';
//    comment_str += '<span class="notification-counter" style="display:none;"></span>';
//    comment_str += '</div>';

//    return comment_str;
//}
