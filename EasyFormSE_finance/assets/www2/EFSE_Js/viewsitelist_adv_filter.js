function display_filter_condition_as_per_cntrl_type(coldata_obj, this_obj, index) {
    try {
        var field_checked = $(this_obj).is(":checked");
        if (field_checked) {
            var checked_header = $(this_obj).val();

            coldata_obj = decodeURIComponent(coldata_obj);
            coldata_obj = JSON.parse(coldata_obj);
            var coldata_obj_ary = [coldata_obj];

            var str = '';
            var cntrl_type = coldata_obj_ary[0].ctrl_type;
            var fltr_header = coldata_obj_ary[0].header;
            var checksheetID = coldata_obj_ary[0].checksheetID;
            var step = coldata_obj_ary[0].step;
            var qid = coldata_obj_ary[0].qid;
            var system_var = coldata_obj_ary[0].system_var;
            if (system_var == "Status_Name") {
                var value_Array = coldata_obj_ary[0].value;
                if (value_Array == "" || value_Array == null || value_Array == undefined) {
                    value_Array = [];
                }
            }

            if (cntrl_type == 2 || cntrl_type == 3 || cntrl_type == 6) {
                var Con_Array = coldata_obj_ary[0].value;
                if (Con_Array == "" || Con_Array == null || Con_Array == undefined) {
                    Con_Array = [];
                    cntrl_type = 1;             //if value key is blank in columndara then consider it as textbox
                }
            }
            else if (cntrl_type == 20) {
                var Con_Array = coldata_obj_ary[0].value_new;
                if (Con_Array == "" || Con_Array == null || Con_Array == undefined) {
                    Con_Array = [];
                    cntrl_type = 1;             //if value_new key is blank in columndara then consider it as textbox
                }
            }

            str += '<div class="cntrl_main_div">'
            if (cntrl_type == 8 || system_var == "CreateDTTM" || system_var == "survey_date") {
                var param_onchange = "set_label_as_per_time_period_condition('" + fltr_header + "', 'fltr_date_ddl_" + index + "', '" + index + "')";
                var Con_Array = ["today", "yesterday", "this_week", "last_week", "last_7_days", "this_month", "last_month", "last_30_days", "this_quarter", "last_quarter", "last_90_days", "this_year", "last_year", "is_before", "is_after", "is_between"];
                str += '<div class="fltr-cndtn-inner">';

                //str += '<select class="form-control mx-1 p-1 fltr-cndtn-eqn" id="fltr_date_ddl_' + index + '" onchange="' + param_onchange + '">';
                str += '<div class="item-input item-input-field form-div">';
                str += '<select class="margin fltr-cndtn-eqn" id="fltr_date_ddl_' + index + '" onChange="' + param_onchange + '" style="width:75%; display:inline-block;height:auto !important;white-space:normal;padding:5px;">';

                for (j = 0; j < Con_Array.length; j++) {
                    var condition = Con_Array[j];
                    str += "<option value='BETWEEN' name='" + condition + "'>" + condition.replace(/_/g, " ") + "</option>";
                }
                str += '</select>';
                str += '<i class="fa fa-chevron-down form-ico" style="margin-left:-12%;font-size:14px;"></i>';
                str += '</div>';

                str += '<label id="lbl_tp_info_' + index + '" style="font-weight:bold" style="display: none;"></label>';
                str += '</div>';
                str += '<div class="div-datepicker">';

                str += '<input id="dt_tp_Start_' + index + '" type="text" data-field="datetime" placeholder="Select Date" style="display: none;">';

                str += '<input id="dt_tp_End_' + index + '" type="text" data-field="datetime" placeholder="Select Date" style="display: none;">';

                str += '<div id="dtBox_' + index + '"></div>';

                str += '</div>';
            }
            else if (cntrl_type == 1 || cntrl_type == 4 || cntrl_type == 12) {
                if (cntrl_type == 1) {
                    var Con_Array = ["EQUAL TO", "DOES NOT EQUAL TO", "IS EMPTY", "IS NOT EMPTY", "CONTAINS"];
                    var Con_Val_Array = ["IN", "NOT IN", "IS NUL", "IS NOT NUL", "LIKE"];
                    var input_type = "text";
                    var cntrl_icon = "fa-pencil-square-o";
                }
                else if (cntrl_type == 4 || cntrl_type == 12) {
                    var Con_Array = ["EQUAL TO", "DOES NOT EQUAL TO", "IS GREATER THAN", "IS LESS THAN", "BETWEEN", "IS EMPTY", "IS NOT EMPTY"];
                    var Con_Val_Array = ["IN", "NOT IN", "IS GREATER THAN", "IS LESS THAN", "BETWEEN", "IS NUL", "IS NOT NUL"];
                    var input_type = "number";
                    var cntrl_icon = "fa-square-o";
                }

                str += '<div class="fltr-cndtn-inner">';
                var eqn_onchange = "hide_cndtn_box_onchange(this)";

                //str += '<select class="form-control w-75 mx-1 mb-2 p-1 fltr-cndtn-eqn" onchange="' + eqn_onchange + '">';
                str += '<div class="item-input item-input-field form-div">';
                str += '<select class="margin fltr-cndtn-eqn" onChange="' + eqn_onchange + '" style="width:75%; display:inline-block;height:auto !important;white-space:normal;padding:8px;">';

                for (j = 0; j < Con_Array.length; j++) {
                    var condition = Con_Array[j];
                    var condition_val = Con_Val_Array[j];
                    str += "<option value='" + condition_val + "'>" + condition.replace(/_/g, " ") + "</option>";
                }
                str += '</select>';
                str += '<i class="fa fa-chevron-down form-ico" style="margin-left:-12%;font-size:14px;"></i>';
                str += '</div>';

                str += '<div class="item-input item-input-field form-div">';
                //str += '<input type="' + input_type + '" class="form-control mx-1 p-1 cls-ctrl-ans" placeholder="Type here">';
                str += '<input type="' + input_type + '" class="form-ele cls-ctrl-ans" placeholder="Type here" onkeydown="ResizeBox(event)" style="white-space: pre; word-break: break-word;padding:8px;">';
                str += '<i class="fa ' + cntrl_icon + ' form-ico" style="margin-left:-12%;font-size:14px;"></i>';
                str += '</div>';

                str += '</div>';
            }
            else if (cntrl_type == 2 || cntrl_type == 3 || cntrl_type == 6 || (system_var == "Status_Name" && value_Array.length > 0)) {
                var Eqn_Array = ["EQUAL TO", "DOES NOT EQUAL TO", "IS EMPTY", "IS NOT EMPTY", "CONTAINS"];
                var Eqn_Val_Array = ["IN", "NOT IN", "IS NUL", "IS NOT NUL", "LIKE"];
                var Con_Array = coldata_obj_ary[0].value;
                if (typeof Con_Array === 'string' || Con_Array instanceof String) {
                    Con_Array = decodeURIComponent(Con_Array);
                    Con_Array = JSON.parse(Con_Array);
                }

                str += '<div class="fltr-cndtn-inner">';
                var eqn_onchange = "hide_cndtn_box_onchange(this)";

                //str += '<select class="form-control w-50 mx-2 p-1 fltr-cndtn-eqn" onchange="' + eqn_onchange + '">';
                str += '<div class="item-input item-input-field form-div">';
                str += '<select class="margin fltr-cndtn-eqn" onChange="' + eqn_onchange + '" style="width:75%; display:inline-block;height:auto !important;white-space:normal;padding:8px;">';
                for (j = 0; j < Eqn_Array.length; j++) {
                    var condition = Eqn_Array[j];
                    var condition_val = Eqn_Val_Array[j];
                    str += "<option value='" + condition_val + "'>" + condition.replace(/_/g, " ") + "</option>";
                }
                str += '</select>';
                str += '<i class="fa fa-chevron-down form-ico" style="margin-left:-12%;font-size:14px;"></i>';
                str += '</div>';

                var multiselect_onchange = "display_selected_opt_ddl('" + index + "', this)";
                var ddl_param = "get_dropdown_data_filter('" + index + "', '', '','', '', '', '', '')";

                str += '<div class="item-input item-input-field form-div" onclick="' + ddl_param + '">';

                //str += '<select class="form-control mx-1 p-1 selectpicker cls-ctrl-ans" id="fltr_val_ddl_' + index + '" onchange="' + multiselect_onchange + '" data-live-search="true" multiple title="None">';

                str += '<select id="fltr_val_ddl_' + index + '" class="margin cls-ctrl-ans" style="width:75%; display:inline-block;height:auto !important;white-space:normal;padding:8px;" disabled="disabled" ><option>--- Select ---</option>';

                if (system_var == "Status_Name" && checksheetID == "0" && step == "0" && qid == "0") {
                    for (j = 0; j < Con_Array.length; j++) {
                        var status_name = Con_Array[j].status_name;
                        var status_val = Con_Array[j].status_val;
                        str += "<option value='" + status_val + "'>" + status_name + "</option>";
                    }
                }
                else {
                    for (j = 0; j < Con_Array.length; j++) {
                        var condition = Con_Array[j];
                        str += "<option value='" + condition + "'>" + condition.replace(/_/g, " ") + "</option>";
                    }
                }

                str += '</select>';
                str += '<i class="fa fa-chevron-down form-ico" style="margin-left:-12%;font-size:14px;"></i>';
                str += '</div>';
                str += '<div id="fltr_div_multiselect_' + index + '" class="fltr-div-multiselect-outer"></div>';
                str += '</div>';
            }
            else if (cntrl_type == 20) {
                DEFAULT_TYPE20 = 50;
                OFFSET_TYPE20 = 0;                  // from where to start
                FETCH_TYPE20 = DEFAULT_TYPE20;      // how many from start

                var Eqn_Array = ["EQUAL TO", "DOES NOT EQUAL TO", "IS EMPTY", "IS NOT EMPTY", "CONTAINS"];
                var Eqn_Val_Array = ["IN", "NOT IN", "IS NUL", "IS NOT NUL", "LIKE"];
                var Con_Array = coldata_obj_ary[0].value_new;
                if (Array.isArray(Con_Array)) { }
                else {
                    Con_Array = decodeURIComponent(Con_Array);
                    Con_Array = JSON.parse(Con_Array);
                }

                Con_Array[0]["checksheetID"] = coldata_obj_ary[0].checksheetID;
                Con_Array[0]["checksheet_type"] = coldata_obj_ary[0].checksheet_type;
                Con_Array[0]["qid"] = coldata_obj_ary[0].qid;

                var push_data = Con_Array[0].push_data;
                var Checksheet_id = Con_Array[0].Checksheet_id;
                var customer_checksheetid = push_data[0].customer_checksheetid;
                if (customer_checksheetid == "" || customer_checksheetid == null || customer_checksheetid == undefined || customer_checksheetid == "0") {
                    customer_checksheetid = "";
                }
                var ddl_info_view = push_data[0].ddl_info_view;
                if (ddl_info_view == "" || ddl_info_view == null || ddl_info_view == undefined) {
                    ddl_info_view = "true";
                }
                var autofill = Con_Array[0].autofill;

                var add_cust_from_search = push_data[0].add_cust_from_search;
                if (add_cust_from_search == "" || add_cust_from_search == null || add_cust_from_search == undefined || add_cust_from_search == "0") {
                    add_cust_from_search = "false";
                }

                var Con_Array_str = JSON.stringify(Con_Array);
                Con_Array_str = encodeURIComponent(Con_Array_str);

                str += '<div class="fltr-cndtn-inner">';
                var eqn_onchange = "hide_cndtn_box_onchange(this)";
                //str += '<select class="form-control w-50 mx-2 p-1 fltr-cndtn-eqn" onchange="' + eqn_onchange + '">';
                str += '<div class="item-input item-input-field form-div">';
                str += '<select class="margin fltr-cndtn-eqn" onChange="' + eqn_onchange + '" style="width:75%; display:inline-block;height:auto !important;white-space:normal;padding:8px;">';

                for (j = 0; j < Eqn_Array.length; j++) {
                    var condition = Eqn_Array[j];
                    var condition_val = Eqn_Val_Array[j];
                    str += "<option value='" + condition_val + "'>" + condition.replace(/_/g, " ") + "</option>";
                }
                str += '</select>';
                str += '<i class="fa fa-chevron-down form-ico" style="margin-left:-12%;font-size:14px;"></i>';
                str += '</div>';

                var multiselect_onchange = "display_selected_opt_ddl('" + index + "', this)";
                var ddl_param = "get_dropdown_data_filter('" + index + "', '', '','" + Checksheet_id + "', '" + customer_checksheetid + "', '" + ddl_info_view + "', '" + autofill + "', '" + add_cust_from_search + "', '" + Con_Array_str + "')";

                //normal ddl
                str += '<div class="item-input item-input-field form-div" onclick="' + ddl_param + '">';
                str += '<select id="fltr_val_ddl_' + index + '" class="margin cls-ctrl-ans" style="width:75%; display:inline-block;height:auto !important;white-space:normal;padding:8px;" disabled="disabled" ><option>--- Select ---</option>';
                str += '</select>';
                str += '<i class="fa fa-chevron-down form-ico" style="margin-left:-12%;font-size:14px;"></i>';
                str += '</div>';

                //smartSelect ddl
                //str += '<div class="list-block">';
                //str += '<ul style="padding-left:0"><li>';
                //str += '<a href="#" id="smartSelect_' + index + '" class="item-link smart-select smart-select-init" data-open-in="popup" onclick="check_for_smartSelect_popup()">';
                //str += '<select id="fltr_val_ddl_' + index + '" name="Select Value" multiple>';
                //str += '</select>';
                //str += '<div class="item-content">';
                //str += '<div class="item-inner">';
                //str += '<div class="item-title">Select Value</div>';
                //str += '<div class="item-after">Honda</div>';
                //str += '</div>';
                //str += '</div></a>';
                //str += '</li></ul>';
                //str += '</div>';

                //var search_click = "get_fltr_optn_by_dropdown_search('" + index + "', '" + Con_Array_str + "')";

                str += '<div id="fltr_div_multiselect_' + index + '" class="fltr-div-multiselect-outer mx-2 p-1"></div>';
                str += '</div>';
            }
            else {
                //other controls
                var Con_Array = ["EQUAL TO", "DOES NOT EQUAL TO", "IS EMPTY", "IS NOT EMPTY", "CONTAINS"];
                var Con_Val_Array = ["IN", "NOT IN", "IS NUL", "IS NOT NUL", "LIKE"];
                str += '<div class="fltr-cndtn-inner">';
                var eqn_onchange = "hide_cndtn_box_onchange(this)";
                //str += '<select class="form-control w-50 mx-1 mb-2 p-1 fltr-cndtn-eqn" onchange="' + eqn_onchange + '">';

                str += '<div class="item-input item-input-field form-div">';
                str += '<select class="margin fltr-cndtn-eqn" onChange="' + eqn_onchange + '" style="width:75%; display:inline-block;height:auto !important;white-space:normal;padding:8px;">';
                for (j = 0; j < Con_Array.length; j++) {
                    var condition = Con_Array[j];
                    var condition_val = Con_Val_Array[j];
                    str += "<option value='" + condition_val + "'>" + condition.replace(/_/g, " ") + "</option>";
                }
                str += '</select>';
                str += '<i class="fa fa-chevron-down form-ico" style="margin-left:-12%;font-size:14px;"></i>';
                str += '</div>';

                //str += '<input type="text" class="form-control mx-1 p-1 cls-ctrl-ans" placeholder="Type here">';

                if (system_var == "task_id") {
                    str += '<input type="number" class="form-ele cls-ctrl-ans" placeholder="Type here" onkeydown="ResizeBox(event)" style="white-space: pre; word-break: break-word;padding:8px;">';
                    str += '<i class="fa fa-pencil-square-o form-ico" style="margin-left:-12%;font-size:14px;"></i>';
                }
                else {
                    str += '<input type="text" class="form-ele cls-ctrl-ans" placeholder="Type here" onkeydown="ResizeBox(event)" style="white-space: pre; word-break: break-word;padding:8px;">';
                    str += '<i class="fa fa-cube form-ico" style="margin-left:-12%;font-size:14px;"></i>';
                }

                str += '</div>';
            }
            str += '</div>';

            $("#div_fltr_cndtn_" + index + "").show();
            $("#div_fltr_cndtn_" + index + "").empty();
            $("#div_fltr_cndtn_" + index + "").append(str);

            if (cntrl_type == 20) {
                if (Array.isArray(Con_Array)) { }
                else {
                    Con_Array = JSON.parse(Con_Array);
                }
                glob_type20_flag = "normal";
                //setTimeout(function () {
                //    $("#fltr_ddl_search_btn_" + index + "").show();
                //}, 1000);
                get_type20_ddl_list_for_filter(Con_Array, index, '');
            }
            else if (cntrl_type == 8 || system_var == "CreateDTTM" || system_var == "survey_date") {

                var today = new Date();
                initialize_datepicker(today, '#dt_tp_Start_' + index + '');
                initialize_datepicker(today, '#dt_tp_End_' + index + '');

                $("#fltr_date_ddl_" + index + "").trigger('onchange');
            }
            else if (cntrl_type == 2 || cntrl_type == 3 || cntrl_type == 6 || (system_var == "Status_Name")) {
                //$(".selectpicker").selectpicker();
            }
        }
        else {
            $("#div_fltr_cndtn_" + index + "").empty();
            $("#div_fltr_cndtn_" + index + "").hide();
            if (cntrl_type == 8) {
                //$(".div-datepicker").hide();
            }
        }
    }
    catch (e) {
        alert1(e + '_display_filter_condition_as_per_cntrl_type');
    }
}

var glob_possible_limit = 0;
var fltr_auto_search_counter = 0;
var glob_type20_flag = "normal";
var glob_type20_popup_flag = "normal";
var glob_advFltr_value_new = "";
var glob_advFltr_type20_index = "";
function get_type20_ddl_list_for_filter(value_new_ary, index, search_val) {
    try {

        $("#dd_listview_icon").hide();

        if (search_val == "" || search_val == null || search_val == undefined) {
            value_new_ary[0]['OFFSET'] = OFFSET_TYPE20;
            value_new_ary[0]['FETCH'] = FETCH_TYPE20;
            value_new_ary[0]['searchValue'] = '';

            var t_offset = OFFSET_TYPE20;
            var t_fetch = FETCH_TYPE20;
        }
        else {
            //when press search btn
            value_new_ary[0]['OFFSET'] = 0;
            value_new_ary[0]['FETCH'] = DEFAULT_TYPE20;
            value_new_ary[0]['searchValue'] = search_val;

            var t_offset = 0;
            var t_fetch = DEFAULT_TYPE20;
        }

        var Query_type = value_new_ary[0].Query_type;
        if (Query_type == "RowQuery") {
            var checksheetID = value_new_ary[0].checksheetID;
            var checksheet_type = value_new_ary[0].checksheet_type;
            var qid = value_new_ary[0].qid;

            var primary_col = value_new_ary[0].Target_Id;
            var field_name = value_new_ary[0].Target_Value;

            var param_obj = [];
            param_obj.push({
                "Query_type": "Rawquery",
                "Checksheet_id": checksheetID,
                "Checksheet_type": checksheet_type,
                "Control_type": 20,
                "ques_id": qid,
                "offset": t_offset,
                "fetch": t_fetch,
                "Target_Id": primary_col,
                "Target_Value": field_name,
                "search_val": search_val
            });
            var type_20_api_url = global_wcf_url + 'Type_20_Advance_Filter';
        }
        else {
            var param_obj = [];
            param_obj.push({
                'flag': 1,                       //primary key and single data for (dropdownview)
                "value_new": value_new_ary,
                "searchable_id": "#fltr_val_ddl_" + index
            });

            var type_20_api_url = global_wcf_url + 'WCF_Type20Filter';
        }

        $(".content-block-inner").html("Fetching Data...");

        loading();
        var getdata = new Webservicecall_REST(type_20_api_url, JSON.stringify(param_obj), function (e) {
            var Data_Json = JSON.parse(e.responseText);
            var status = Data_Json[0].status;
            var message = Data_Json[0].message;
            if (status == 1) {

                var data = Data_Json[0].data;
                if (data == "" || data == null || data == undefined) {
                    var myArray = eval('(' + Data_Json[0].message + ')');
                }
                else {
                    var myArray = JSON.parse(data);
                }

                var primary_col = value_new_ary[0].Target_Id;
                var field_name = value_new_ary[0].Target_Value;
                for (j = 0; j < myArray.length; j++) {
                    var cell_id = myArray[j][primary_col];
                    var cell_value = myArray[j][field_name];
                    if (cell_value == undefined) { }
                    else {
                        var autofill = value_new_ary[0].autofill;
                        var new_cell_value = encodeURIComponent(cell_value);

                        var val_exists = $("#fltr_val_ddl_" + index + " option").filter(function () { return $(this).text() == cell_value; }).length;
                        if (val_exists) {
                            //alert1('Search value is already exist !');
                            //if single optn is available and press keyboard search then auto select that optn [FT - 10112023]
                            if (myArray.length == 1 && glob_type20_popup_flag == "adv_filter") {
                                var option = "<option selected='selected' value='" + new_cell_value + "' name='" + cell_id + "'>" + cell_value + "</option>";

                                var param = "set_dropdown_data_filter('" + new_cell_value + "', '" + index + "')";

                                var li_txt = '<li class="item-content" onclick="' + param + '" value="' + new_cell_value + '">';
                                li_txt += '<div class="item-inner"><div class="item-title">' + cell_value + '</div>';
                                li_txt += '</div></li>';

                                $('#type20_ddl_list').append(li_txt);
                                sync_type20_popup_selection();
                                myApp.closeModal(".popup-type20-dropdown");
                                if (F7_device == 'android' || F7_device == 'ios') {
                                    //popup UI issue in iOS
                                    $(".popup-type20-dropdown").hide();
                                }

                                $('.cls_task_ico').click(function (event) {
                                    event.stopPropagation();
                                });
                            }
                        }
                        else {
                            if (glob_type20_popup_flag == "adv_filter") {
                                // task listing advanced filter 06102023
                                autofill = "true";
                            }

                            if (autofill == "false") {
                                var option = "<option value='" + new_cell_value + "' name='" + cell_id + "'>" + cell_value + "</option>";
                            }
                            else {
                                if (myArray.length == 1) {
                                    var option = "<option selected='selected' value='" + new_cell_value + "' name='" + cell_id + "'>" + cell_value + "</option>";

                                    var param = "set_dropdown_data_filter('" + new_cell_value + "', '" + index + "')";

                                    var li_txt = '<li class="item-content" onclick="' + param + '" value="' + new_cell_value + '">';
                                    li_txt += '<div class="item-inner"><div class="item-title">' + cell_value + '</div>';
                                    li_txt += '</div></li>';

                                    $('#type20_ddl_list').append(li_txt);
                                    sync_type20_popup_selection();
                                    myApp.closeModal(".popup-type20-dropdown");
                                    if (F7_device == 'android' || F7_device == 'ios') {
                                        //popup UI issue in iOS
                                        $(".popup-type20-dropdown").hide();
                                    }

                                    $('.cls_task_ico').click(function (event) {
                                        event.stopPropagation();
                                    });

                                }
                                else {
                                    var option = "<option value='" + new_cell_value + "' name='" + cell_id + "'>" + cell_value + "</option>";

                                    var param = "set_dropdown_data_filter('" + new_cell_value + "', '" + index + "')";

                                    var li_txt = '<li class="item-content" onclick="' + param + '" value="' + new_cell_value + '">';
                                    li_txt += '<div class="item-inner"><div class="item-title">' + cell_value + '</div>';
                                    li_txt += '</div></li>';

                                    $('#type20_ddl_list').append(li_txt);
                                    sync_type20_popup_selection();
                                    $('.cls_task_ico').click(function (event) {
                                        event.stopPropagation();
                                    });
                                }
                            }

                            $("#fltr_val_ddl_" + index).append(option);
                            //$("#type20_ddl_list").append(option);

                        }
                    }
                }

                if (myArray.length == 1) {
                    set_dropdown_data_filter(new_cell_value, index);
                    $("#fltr_val_ddl_" + index).trigger('onchange');
                }
                else {
                    var search_val = $("#F7_type20_ddl_Search input[type='search']").val();
                    if (search_val == '' || search_val == null || search_val == undefined) {
                        search_val = "";
                    }
                    else {
                        // in case of search
                        $('.searchbar-not-found').hide();
                        $('.searchbar-found').show();
                    }
                }

                //var mySearchbar = myApp.searchbar('.searchbar');
                //mySearchbar.clear();

            }
            else if (status == 2) {
                $(".content-block-inner").html("No Record Found");
                //if (glob_type20_flag == "auto_search") { }
                //else {
                //    option += "<option value='0' name='no_data_found'>No Data Found !</option>";
                //    $("#fltr_val_ddl_" + index).empty();
                //    $("#fltr_val_ddl_" + index).append(option);
                //}
            }
            else {
                alert1(message);
                loading_hide();
            }

            //var old_OFFSET_TYPE20 = OFFSET_TYPE20;
            //var ddl_len = $("#fltr_val_ddl_" + index + " option").length;

            //if (search_val == "" || search_val == null || search_val == undefined) {
            //    var possible_limit = old_OFFSET_TYPE20 + FETCH_TYPE20;
            //    glob_possible_limit = possible_limit;
            //}
            //else {
            //    var possible_limit = glob_possible_limit;
            //    ddl_len = ddl_len - 1;
            //}

            //var value_new_str = JSON.stringify(value_new_ary);
            //value_new_str = encodeURIComponent(value_new_str);
            //if (ddl_len >= (possible_limit - 1)) {
            //    var param_ddl = "Show_More_ddl_filter('" + value_new_str + "', '" + index + "')";
            //    //var param_ddl = 'Show_More_ddl_filter("' + value_new_str + '", "' + ddl_id + '")';
            //    var show_more_img = $("#fltr_val_ddl_" + index + "").parents('.bootstrap-select').find('div.dropdown-menu').find('.img-fltr-showMore');
            //    if (show_more_img.length == 0) {
            //        $("#fltr_val_ddl_" + index + "").parents('.bootstrap-select').find('div.dropdown-menu').append('<img src="EF_Port_App1/images/show_more.gif" onclick="' + param_ddl + '" class="img-fltr-showMore" style="cursor:pointer; width:30px; height:20px; margin-left:45%;margin-top:2px">');
            //    }
            //}
            //else {
            //    $("#fltr_val_ddl_" + index + "").parents('.bootstrap-select').find('div.dropdown-menu').find('img').remove();
            //}

            //$("#fltr_val_ddl_" + index + "").parents('.bootstrap-select').find(".dropdown-menu .bs-searchbox input[type='search']").on('input', function (e) {
            //    var curr_ddl_id = $(this).parent().parent().siblings("button").attr('data-id');                     //changes after BS4 update [21102020]
            //    var search_new_id = curr_ddl_id.substring(13);
            //    var search_text = $(this).val();
            //    var no_record_len = $("#fltr_val_ddl_" + index + "").parents('.bootstrap-select').find('ul.dropdown-menu').find('.no-results').length;
            //   // if (search_text.length > 2 && no_record_len == 1) {
            //        clearTimeout(fltr_auto_search_counter);
            //        fltr_auto_search_counter = setTimeout(function () {
            //            glob_type20_flag = "auto_search";
            //            $("#fltr_ddl_search_btn_" + search_new_id + "").trigger('onclick');
            //        }, 3000);
            //    //}
            //});

            loading_hide();
        }, onfail_request);
        getdata.callOtherDomain();

    }
    catch (e) {
        alert1(e + '_get_type20_ddl_list_for_filter');
    }
}

function get_dropdown_data_filter(t_new_id, TableName, JoinTableName, Checksheet_id, customer_checksheetid, ddl_info_view, autofill, add_cust_from_search, value_new_str) {
    try {
        $("#dd_listview_icon").hide();    //show listview filter

        glob_adv_value_new = value_new_str;
        glob_advFltr_type20_index = t_new_id;

        $("#ddl_list").unbind('scroll');
        ddl_item_info = "false";
        ddl_listview = "false";

        var is_type22_popup = $(".popup-type22:visible").length;
        if (is_type22_popup > 0) {
            //---set higher z-index when searchble is inside type22 [17082021]
            $(".popup-type20-dropdown").css('z-index', '14010');
        }

        DEFAULT_TYPE20 = 50;
        OFFSET_TYPE20 = 0; // from where to start
        FETCH_TYPE20 = DEFAULT_TYPE20; // how many from start
        TableName_G = TableName;
        JoinTableName_G = JoinTableName;
        Checksheet_id_G = Checksheet_id;
        new_id_G = t_new_id;

        $('#type20_ddl_list').empty();
        reset_type20_popup_search();
        $('.searchbar-not-found').hide();
        $('.searchbar-found').show();

        var li_txt = '';
        glob_type20_popup_flag = "adv_filter";
        myApp.popup('.popup-type20-dropdown');
        $(".dd_listview_icon").hide();
        //var add_avail = $("#btn_add_multiselect").length;
        //if (add_avail == 0) {
        //    $('.popup-type20-dropdown .navbar-inner').append('<div class="right"><a id="btn_add_multiselect" class="back link icon-only" onclick="set_dropdown_data_filter()">Add</a></div>');
        //}

        var ddl_len = $("#fltr_val_ddl_" + t_new_id + " option").length;
        $("#fltr_val_ddl_" + t_new_id + " option").each(function () {
            var ddl_txt = $(this).text();
            var ddl_val = $(this).val();
            var param = "set_dropdown_data_filter('" + ddl_val + "', '" + t_new_id + "', '" + add_cust_from_search + "')";

            var ddl_value1 = $(this).attr('value1');
            if (ddl_value1 == "" || ddl_value1 == null || ddl_value1 == undefined) {
                ddl_value1 = ddl_val;
            }

            li_txt += '<li class="item-content" onclick="' + param + '" value="' + ddl_val + '">';
            li_txt += '<div class="item-inner"><div class="item-title">' + ddl_txt + '</div>';
            li_txt += '</div></li>';

            //li_txt += '<li class="item-content" value="' + ddl_val + '">';
            //li_txt += '<label class="label-checkbox item-content">';
            //li_txt += '<input type="checkbox" name="type20-multi-select" value1="' + ddl_val + '" value="' + ddl_txt + '">';
            //li_txt += '<div class="item-media">';
            //li_txt += '<i class="icon icon-form-checkbox"></i>';
            //li_txt += '</div>';
            //li_txt += '<div class="item-inner">';
            //li_txt += '<div class="item-title">' + ddl_txt + '</div>';
            //li_txt += '</div>';
            //li_txt += '</label>';
            //li_txt += '</li>';
        })
        $('#type20_ddl_list').append(li_txt);
        sync_type20_popup_selection();

        $('.cls_task_ico').click(function (event) {
            event.stopPropagation();
        });

        var show_more_avail = $(".footer-type20-dropdown").find('center').find('img');
        var ddl_len = $("#fltr_val_ddl_" + t_new_id + " option").length;
        var old_OFFSET_TYPE20 = OFFSET_TYPE20;

        var possible_limit = old_OFFSET_TYPE20 + FETCH_TYPE20;
        if (ddl_len >= (possible_limit - 1)) {
            $('.footer-type20-dropdown').parent().show();
            $("#ddl_list").scroll(function () {
                var offsetHeight = document.getElementById("ddl_list").offsetHeight;
                var scrollTop = document.getElementById("ddl_list").scrollTop;
                var scrollHeight = document.getElementById("ddl_list").scrollHeight;
                if (parseInt(scrollTop) === (parseInt(scrollHeight) - parseInt(offsetHeight)) || parseInt(scrollTop) === (parseInt(scrollHeight) - parseInt(offsetHeight) - 1)) {
                    Show_More_ddl_filter(value_new_str, t_new_id);
                }
            });
        }
        else {
            $('.footer-type20-dropdown').find('.center').find('img').remove();
            $('.footer-type20-dropdown').parent().hide();
        }
    }
    catch (e) {
        alert1(e + '_get_dropdown_data_filter');
    }
}

function set_dropdown_data_filter(t_val, t_new_id, add_cust_from_search) {
    try {
        myApp.closeModal('.popup-type20-dropdown');

        if (F7_device == 'android' || F7_device == 'ios') {
            //popup UI issue in iOS
            $(".popup-type20-dropdown").hide();
        }

        if (t_val == "" || t_val == null || t_val == undefined) { }
        else {
            $("#fltr_val_ddl_" + t_new_id + "").val(t_val);
            $("#fltr_val_ddl_" + t_new_id + "").css('color', '#000');
            $("#fltr_val_ddl_" + t_new_id + "").prop("disabled", true);

            $("#fltr_div_multiselect_" + t_new_id + "").empty();
            var str = '';
            var ddl_name = $("#fltr_val_ddl_" + t_new_id + " option:selected").text();
            str += '<span class="badge badge-dark mr-1">' + ddl_name + '</span>';
            $("#fltr_div_multiselect_" + t_new_id + "").append(str);

            $("#fltr_val_ddl_" + t_new_id + "").trigger("onchange");
        }

        //======multi select logic====
        //if (ddl_obj_len == 0) {
        //    $("#fltr_div_multiselect_" + t_new_id + "").empty();
        //}
        //else {
        //    $(this_obj).find("option:selected").each(function () {
        //        alert('1');
        //        var str = '';
        //        var ddl_name = $(this).text();
        //        str += '<span class="badge badge-dark mr-1">' + ddl_name + '</span>';
        //        alert('str: ' + str);
        //        $("#fltr_div_multiselect_" + t_new_id + "").append(str);
        //    });
        //}
    }
    catch (e) {
        alert1(e + '_set_dropdown_data_filter');
    }
}

function Show_More_ddl_filter(value_new_str, index) {
    OFFSET_TYPE20 = OFFSET_TYPE20 + DEFAULT_TYPE20;
    var value_new_ary = decodeURIComponent(value_new_str);
    value_new_ary = JSON.parse(value_new_ary);

    var search_val = $("#F7_type20_ddl_Search input[type='search']").val();
    if (search_val == '' || search_val == null || search_val == undefined) {
        search_val = "";
    }

    get_type20_ddl_list_for_filter(value_new_ary, index, search_val);
}

function get_data_by_dropdown_search_adv_filter() {
    if (glob_adv_value_new == "" || glob_adv_value_new == null || glob_adv_value_new == undefined) {
        // restrict system search in case of system variable dropdown (e.g. status search) 25042023
        $(".content-block-inner").html("Displaying quick search result only.");
    }
    else {
        get_fltr_optn_by_dropdown_search(glob_advFltr_type20_index, glob_adv_value_new)
    }
}

function get_fltr_optn_by_dropdown_search(t_index, value_new_str) {
    try {
        var search_val = $("#F7_type20_ddl_Search input[type='search']").val();
        //if (search_val == '' || search_val == null || search_val == undefined) {
        //    alert1("Please enter search value!");
        //}
        //else {
        //var val_exists = $("#fltr_val_ddl_" + t_index + " option").filter(function () { return $(this).text().toLowerCase() == search_val.toLowerCase(); }).length;
        //if (val_exists) {
        //    //alert1('Search value is already exist !');
        //}
        //else {
        value_new_str = decodeURIComponent(value_new_str);
        var value_new = JSON.parse(value_new_str);

        var ddl_len = $("#fltr_val_ddl_" + t_index + " option").length;
        OFFSET_TYPE20 = ddl_len;

        value_new[0]['OFFSET'] = 0;
        value_new[0]['FETCH'] = DEFAULT_TYPE20;
        value_new[0]['searchValue'] = search_val;

        get_type20_ddl_list_for_filter(value_new, t_index, search_val);

        //}
        //}
    }
    catch (e) {
        alert1(e + '_get_data_by_dropdown_search()');
        loading_hide();
    }
}

//multi select fields
function display_selected_opt_ddl(t_index, this_obj) {
    try {
        var ddl_val = $("#fltr_val_ddl_" + t_index + "").val();
        var ddl_obj = $("#fltr_val_ddl_" + t_index + "");
        var ddl_obj_len = $("#fltr_val_ddl_" + t_index + " option:selected").length;

        $("#fltr_div_multiselect_" + t_index + "").empty();
        $(".div-filtered-item").empty();

        if (ddl_obj_len == 0) {
            $("#fltr_div_multiselect_" + t_index + "").empty();
        }
        else {
            $(this_obj).find("option:selected").each(function () {
                var str = '';
                var ddl_name = $(this).text();
                str += '<span class="badge badge-dark mr-1">' + ddl_name + '</span>';
                $("#fltr_div_multiselect_" + t_index + "").append(str);
            });
        }
    }
    catch (e) {
        alert1(e + '_display_selected_fields_below_ddl');
    }
}

function check_for_smartSelect_popup() {
    var is_open = $(".popup.smart-select-popup").hasClass('modal-in');
    if (is_open) {
        $(".popup.smart-select-popup").removeClass('modal-in');
        $(".popup.smart-select-popup").addClass('modal-out');
        $(".popup.smart-select-popup").hide();
    }
    else {
        $(".popup.smart-select-popup").removeClass('modal-out');
        $(".popup.smart-select-popup").addClass('modal-in');
        $(".popup.smart-select-popup").show();
    }

    setTimeout(function () {
        $(".link.close-popup").unbind('click');
        $(".link.close-popup").click(function (e) {
            myApp.closeModal('.popup.smart-select-popup');
            return false;
        });
    }, 100);
}

function hide_cndtn_box_onchange(this_obj) {
    try {
        var selected_val = $(this_obj).val();
        $(".btwn-cntrl").remove();
        if (selected_val == "IS NUL" || selected_val == "IS NOT NUL") {
            $(this_obj).parent('.fltr-cndtn-inner').find('.cls-ctrl-ans').hide();
            $(this_obj).parent('.fltr-cndtn-inner').find('.fltr-div-multiselect').hide();
            $(this_obj).parent('.fltr-cndtn-inner').find('.cls-contains').hide();
        }
        else if (selected_val == "BETWEEN") {
            var str = '<input type="number" class="form-control w-50 mx-1 p-1 cls-ctrl-ans btwn-cntrl" placeholder="Type here">';
            $(this_obj).parent('.fltr-cndtn-inner').append(str);
        }
        else if (selected_val == "LIKE") {
            $(this_obj).parent('.fltr-cndtn-inner').find('.cls-ctrl-ans').hide();
            $(this_obj).parent('.fltr-cndtn-inner').find('.fltr-div-multiselect').hide();
            $(this_obj).parent('.fltr-cndtn-inner').find('.btn-circle').hide();
            var str = '<input type="text" class="form-control mx-2 p-1 cls-ctrl-ans cls-contains" placeholder="Type here">';
            $(this_obj).parent('.fltr-cndtn-inner').append(str);
        }
        else {
            $(this_obj).parent('.fltr-cndtn-inner').find('.cls-ctrl-ans').show();
            $(this_obj).parent('.fltr-cndtn-inner').find('.fltr-div-multiselect').show();
            $(this_obj).parent('.fltr-cndtn-inner').find('.cls-contains').hide();
        }
    }
    catch (e) {
        alert1(e + '_hide_cndtn_box_onchange');
    }
}

// ---   Time Period Part  ---- /////
function set_label_as_per_time_period_condition(time_column, type8_id, t_index) {
    try {
        var time_condition = $("#" + type8_id + " option:selected").attr('name');

        $("#dt_tp_Start_" + t_index + "").hide().parent().hide();
        $("#dt_tp_End_" + t_index + "").hide().parent().hide();

        if (time_condition == 'is_before' || time_condition == 'is_after') {
            $("#dt_tp_Start_" + t_index + "").show().parent().show();
            $("#dt_tp_End_" + t_index + "").hide()
            $("#lbl_tp_info_" + t_index + "").hide();
        }
        else if (time_condition == 'is_between') {
            $("#dt_tp_Start_" + t_index + "").show().parent().show();
            $("#dt_tp_End_" + t_index + "").show().parent().show();
            $("#lbl_tp_info_" + t_index + "").hide();
        }
        else if (time_condition == 'is_greater_than' || time_condition == 'is_less_than') {
            $("#lbl_tp_info_" + t_index + "").hide();
        }
        else if (time_condition == 'anytime') {
            $("#lbl_tp_info_" + t_index + "").hide();
        }
        else {
            $("#lbl_tp_info_" + t_index + "").show();
        }


        date_obj = get_date_obj_by_time_period_condition(time_column, time_condition, '#lbl_tp_info_' + t_index + '', '#dt_tp_Start_' + t_index + '', '#dt_tp_End_' + t_index + '', '');

    }
    catch (e) {
        alert1(e + '_set_date_as_per_time_period_type()');
    }

}

function get_date_obj_by_time_period_condition(time_column, time_condition, time_label, time_dt_Start, time_dt_End, time_number) {
    try {
        //EQUAL TO, DOES NOT EQUAL TO, IS LESS THEN, IS GREATER THEN,LIKE, NOT LIKE, BEGIN WITH, NOT IN, IN, IS NULL, IS NOT NULL, BETWEEN 

        var date_obj = {
            "Table_Name": "TASK_MASTER",
            "Column_Name": "",
            "Equation": "",
            "Value_1": "",
            "Value_2": "",
            "Type": ""     // STRING/INT/DATETIME
        }

        var today_dt_obj = new Date();
        var mode = "date";
        var today_dt = convert_datetime_by_format(today_dt_obj, mode);

        if (time_condition == 'select') { }
        else if (time_condition == 'anytime') { }
        else if (time_condition == 'today') {
            var value = convert_fix_format_date_on_submit(today_dt, mode);
            var value1 = value + " 00:00";
            var value2 = value + " 23:59";

            value1 = convert_datetime_by_format(value1, "datetime")
            value2 = convert_datetime_by_format(value2, "datetime")

            $(time_label).html(value1 + ' - ' + value2);
        }
        else if (time_condition == 'yesterday') {
            var yesterday_dt = today_dt_obj.setDate(today_dt_obj.getDate() - 1);
            yesterday_dt = new Date(yesterday_dt);
            var new_yesterday_dt = convert_datetime_by_format(yesterday_dt, mode);

            var value = convert_fix_format_date_on_submit(new_yesterday_dt, mode);

            var value1 = value + " 00:00";
            var value2 = value + " 23:59";

            value1 = convert_datetime_by_format(value1, "datetime")
            value2 = convert_datetime_by_format(value2, "datetime")

            $(time_label).html(value1 + ' - ' + value2);
        }
        else if (time_condition == 'this_week') {
            //new logic [02022022]
            var curr = new Date;
            var firstday = new Date(curr.setDate(curr.getDate() - curr.getDay() + 1));
            firstday = convert_datetime_by_format(firstday, mode);;
            var lastday = new Date(curr.setDate(curr.getDate() - curr.getDay() + 7));
            lastday = convert_datetime_by_format(lastday, mode);;

            var value = convert_fix_format_date_on_submit(firstday, mode);
            var value2 = convert_fix_format_date_on_submit(lastday, mode);

            value = value + " 00:00";
            value2 = value2 + " 23:59";

            value = convert_datetime_by_format(value, "datetime")
            value2 = convert_datetime_by_format(value2, "datetime")

            $(time_label).html(value + ' - ' + value2);
        }
        else if (time_condition == 'last_week') {
            //new logic [02022022]
            var d = new Date();
            var to = d.setTime(d.getTime() - (d.getDay() ? d.getDay() : 7) * 24 * 60 * 60 * 1000);
            var from = d.setTime(d.getTime() - 6 * 24 * 60 * 60 * 1000);

            var lastday = new Date(to);
            lastday = convert_datetime_by_format(lastday, mode);;
            var firstday = new Date(from);
            firstday = convert_datetime_by_format(firstday, mode);;

            var value = convert_fix_format_date_on_submit(firstday, mode);
            var value2 = convert_fix_format_date_on_submit(lastday, mode);

            value = value + " 00:00";
            value2 = value2 + " 23:59";


            value = convert_datetime_by_format(value, "datetime")
            value2 = convert_datetime_by_format(value2, "datetime")

            $(time_label).html(value + ' - ' + value2);
        }
        else if (time_condition == 'last_7_days') {
            var value2 = convert_fix_format_date_on_submit(today_dt, mode);

            var firstday = today_dt_obj.setDate(today_dt_obj.getDate() - 7);
            firstday = new Date(firstday);
            var new_firstday = convert_datetime_by_format(firstday, mode);

            var value = convert_fix_format_date_on_submit(new_firstday, mode);

            value = value + " 00:00";
            value2 = value2 + " 23:59";

            value = convert_datetime_by_format(value, "datetime")
            value2 = convert_datetime_by_format(value2, "datetime")

            $(time_label).html(value + ' - ' + value2);
        }
        else if (time_condition == 'this_month') {
            var firstday = new Date(today_dt_obj.getFullYear(), today_dt_obj.getMonth(), 1);
            firstday = convert_datetime_by_format(firstday, mode);
            var lastday = new Date(today_dt_obj.getFullYear(), today_dt_obj.getMonth() + 1, 0);
            lastday = convert_datetime_by_format(lastday, mode);

            var value = convert_fix_format_date_on_submit(firstday, mode);
            var value2 = convert_fix_format_date_on_submit(lastday, mode);

            value = value + " 00:00";
            value2 = value2 + " 23:59";

            value = convert_datetime_by_format(value, "datetime")
            value2 = convert_datetime_by_format(value2, "datetime")

            $(time_label).html(value + ' - ' + value2);
        }
        else if (time_condition == 'last_month') {
            var firstday = new Date(today_dt_obj.getFullYear(), today_dt_obj.getMonth() - 1, 1);
            firstday = convert_datetime_by_format(firstday, mode);
            var lastday = new Date(today_dt_obj.getFullYear(), today_dt_obj.getMonth(), 0);
            lastday = convert_datetime_by_format(lastday, mode);

            var value = convert_fix_format_date_on_submit(firstday, mode);
            var value2 = convert_fix_format_date_on_submit(lastday, mode);

            value = value + " 00:00";
            value2 = value2 + " 23:59";

            value = convert_datetime_by_format(value, "datetime")
            value2 = convert_datetime_by_format(value2, "datetime")

            $(time_label).html(value + ' - ' + value2);
        }
        else if (time_condition == 'last_30_days') {
            var value2 = convert_fix_format_date_on_submit(today_dt, mode);

            var firstday = today_dt_obj.setDate(today_dt_obj.getDate() - 30);
            firstday = new Date(firstday);
            var new_firstday = convert_datetime_by_format(firstday, mode);

            var value = convert_fix_format_date_on_submit(new_firstday, mode);

            value = value + " 00:00";
            value2 = value2 + " 23:59";

            value = convert_datetime_by_format(value, "datetime")
            value2 = convert_datetime_by_format(value2, "datetime")

            $(time_label).html(value + ' - ' + value2);
        }
        else if (time_condition == 'this_quarter') {
            var quarter = Math.floor((today_dt_obj.getMonth() / 3));
            var firstday_obj = new Date(today_dt_obj.getFullYear(), quarter * 3, 1);
            var firstday = convert_datetime_by_format(firstday_obj, mode);
            var lastday = new Date(firstday_obj.getFullYear(), firstday_obj.getMonth() + 3, 0);
            lastday = convert_datetime_by_format(lastday, mode);

            var value = convert_fix_format_date_on_submit(firstday, mode);
            var value2 = convert_fix_format_date_on_submit(lastday, mode);
            value = value + " 00:00";
            value2 = value2 + " 23:59";

            value = convert_datetime_by_format(value, "datetime")
            value2 = convert_datetime_by_format(value2, "datetime")

            $(time_label).html(value + ' - ' + value2);
        }
        else if (time_condition == 'last_quarter') {
            var quarter = Math.floor((today_dt_obj.getMonth() / 3));
            quarter = quarter - 1;
            var firstday_obj = new Date(today_dt_obj.getFullYear(), quarter * 3, 1);
            var firstday = convert_datetime_by_format(firstday_obj, mode);
            var lastday = new Date(firstday_obj.getFullYear(), firstday_obj.getMonth() + 3, 0);
            lastday = convert_datetime_by_format(lastday, mode);

            var value = convert_fix_format_date_on_submit(firstday, mode);
            var value2 = convert_fix_format_date_on_submit(lastday, mode);

            value = value + " 00:00";
            value2 = value2 + " 23:59";

            value = convert_datetime_by_format(value, "datetime")
            value2 = convert_datetime_by_format(value2, "datetime")

            $(time_label).html(value + ' - ' + value2);
        }
        else if (time_condition == 'last_90_days') {
            var value2 = convert_fix_format_date_on_submit(today_dt, mode);

            var firstday = today_dt_obj.setDate(today_dt_obj.getDate() - 90);
            firstday = new Date(firstday);
            var new_firstday = convert_datetime_by_format(firstday, mode);

            var value = convert_fix_format_date_on_submit(new_firstday, mode);
            value = value + " 00:00";
            value2 = value2 + " 23:59";

            value = convert_datetime_by_format(value, "datetime")
            value2 = convert_datetime_by_format(value2, "datetime")

            $(time_label).html(value + ' - ' + value2);
        }
        else if (time_condition == 'this_year') {
            var firstday = new Date(today_dt_obj.getFullYear(), 0, 1, 0, 0, 0);
            firstday = convert_datetime_by_format(firstday, mode);
            var lastday = new Date(today_dt_obj.getFullYear(), 11, 31, 0, 0, 0);
            lastday = convert_datetime_by_format(lastday, mode);

            var value = convert_fix_format_date_on_submit(firstday, mode);
            var value2 = convert_fix_format_date_on_submit(lastday, mode);

            value = value + " 00:00";
            value2 = value2 + " 23:59";

            value = convert_datetime_by_format(value, "datetime")
            value2 = convert_datetime_by_format(value2, "datetime")

            $(time_label).html(value + ' - ' + value2);
        }
        else if (time_condition == 'last_year') {
            var firstday = new Date(today_dt_obj.getFullYear() - 1, 0, 1, 0, 0, 0);
            firstday = convert_datetime_by_format(firstday, mode);
            var lastday = new Date(today_dt_obj.getFullYear() - 1, 11, 31, 0, 0, 0);
            lastday = convert_datetime_by_format(lastday, mode);

            var value = convert_fix_format_date_on_submit(firstday, mode);
            var value2 = convert_fix_format_date_on_submit(lastday, mode);

            value = value + " 00:00";
            value2 = value2 + " 23:59";

            value = convert_datetime_by_format(value, "datetime")
            value2 = convert_datetime_by_format(value2, "datetime")

            $(time_label).html(value + ' - ' + value2);
        }
        else if (time_condition == 'is_before') {
            var firstday = $(time_dt_Start).val();
            var value = convert_fix_format_date_on_submit(firstday, mode);
        }
        else if (time_condition == 'is_after') {
            var firstday = $(time_dt_Start).val();
            var value = convert_fix_format_date_on_submit(firstday, mode);
        }
        else if (time_condition == 'is_between') {
            var firstday = $(time_dt_Start).val();
            var lastday = $(time_dt_End).val();

            var value = convert_fix_format_date_on_submit(firstday, mode);
            var value2 = convert_fix_format_date_on_submit(lastday, mode);
        }
    }
    catch (e) {
        alert1(e + '_get_date_obj_by_time_period_condition()');
    }

}
//  ---- Time Period Part End ---------- /////


//=========Saved Filter Part===========
function display_saved_adv_filter() {
    try {
        get_saved_advanced_filter_data()
    }
    catch (e) {
        alert1(e + '_display_saved_adv_filter');
    }
}

function get_saved_advanced_filter_data() {
    try {
        //advance_column_search();


        var searchCol_obj = localStorage.getItem('searchCol_obj');
        if (searchCol_obj == "" || searchCol_obj == null || searchCol_obj == undefined) {
            // getting selected filter data

            var udf_id = JSON.parse(storage.getItem('udf_id'));
            var user_id = JSON.parse(storage.getItem('user_id'));
            var tab_index = JSON.parse(storage.getItem('tab_index'));

            var param_obj = [];
            param_obj.push({
                'Udf_ID': udf_id,
                'User_ID': user_id,
                'tab_index': tab_index,
                'Filter_Name': ''
            });

            //loading();
            var getdata = new Webservicecall_REST(global_wcf_url + 'Select_Default_Filter', JSON.stringify(param_obj), function (e) {
                var myArray = JSON.parse(e.responseText);
                var status = myArray[0].status;
                var message = myArray[0].message;
                if (status == 1) {
                    var data = myArray[0].data;
                    data = JSON.parse(data);

                    $("#ddl_saved_filter_list").show();
                    var opt_str = '<option value="0">Saved Filter</option>';
                    for (var i = 0; i < data.length; i++) {
                        var filter_id = data[i].ID;
                        var filter_json = data[i].JSON;
                        filter_json = JSON.parse(filter_json);
                        var filter_json_str = JSON.stringify(filter_json);
                        filter_json_str = encodeURIComponent(filter_json_str);
                        var filter_name = data[i].Filter_Name;
                        opt_str += '<option value="' + filter_name + '" filter_id="' + filter_id + '" name="' + filter_json_str + '">' + filter_name + '</option>';
                    }
                    $("#ddl_saved_filter_list").empty();
                    $("#ddl_saved_filter_list").append(opt_str);
                }
                else if (status == 2) {
                    var opt_str = '<option value="0">Saved Filter</option>';
                    $("#ddl_saved_filter_list").empty();
                    $("#ddl_saved_filter_list").append(opt_str);
                }
                else {
                    alert1(message);
                    loading_hide();
                }
            }, onfail_request);
            getdata.callOtherDomain();
        }
        else {
            // getting data from temporary stored filter
            searchCol_obj = JSON.parse(searchCol_obj);
            display_selected_filter_data_onchange_Post(searchCol_obj, "false");
        }


    }
    catch (e) {
        alert1(e + '_get_saved_advanced_filter_data');
    }
}

function open_popup_for_saved_filter_name() {
    myApp.popup('.popup-adv-filterName');
    setTimeout(function () {
        $("#txt_adv_filter").focus();
    }, 500);
}

function save_advanced_filtered_data(t_flag) {
    try {
        $("#lbl_filter_name").empty();
        var adv_filter_obj = [];
        $(".div-filtered-item span.badge").each(function () {
            var filter_obj_str = $(this).attr('data');
            filter_obj_str = decodeURIComponent(filter_obj_str);
            var filter_obj = JSON.parse(filter_obj_str);
            adv_filter_obj.push(filter_obj);
        })
        var adv_filter_obj_str = JSON.stringify(adv_filter_obj);
        adv_filter_obj_str = encodeURIComponent(adv_filter_obj_str);
        $(".save-filter-dropdown").hide();

        if (t_flag == "insert") {
            var saved_filter_name = $("#txt_adv_filter").val();
            if (saved_filter_name == "" || saved_filter_name == null || saved_filter_name == undefined) {
                alert1('Please add filter name !');
            }
            else {
                //$("#ddl_saved_filter_list").show();
                //$(".btn-save-filter").hide();
                //$(".btn-clear-filter").show();

                //var str = '<option value="' + saved_filter_name + '" name="' + adv_filter_obj_str + '">' + saved_filter_name + '</option>';
                //$("#ddl_saved_filter_list").append(str);
                //$("#ddl_saved_filter_list").val(saved_filter_name);

                $("#txt_adv_filter").val('');
                myApp.closeModal('.popup-adv-filterName');

                var company_feature_id = localStorage.getItem('company_feature_id');
                var udf_id = JSON.parse(storage.getItem('udf_id'));
                var user_id = JSON.parse(storage.getItem('user_id'));
                var tab_index = JSON.parse(storage.getItem('tab_index'));

                var param_obj = [];
                param_obj.push({
                    'Udf_ID': udf_id,
                    'tab_index': tab_index,
                    'User_ID': user_id,
                    'Company_Feature_Id': company_feature_id,
                    'JSON': adv_filter_obj,
                    'Filter_Name': saved_filter_name
                });

                loading();
                var getdata = new Webservicecall_REST(global_wcf_url + 'Default_Filter', JSON.stringify(param_obj), function (e) {
                    var myArray = JSON.parse(e.responseText);
                    var status = myArray[0].status;
                    var message = myArray[0].message;
                    if (status == 1) {

                        $(".save-filter-dropdown").hide();
                        var data = myArray[0].data;
                        data = JSON.parse(data);

                        var filter_id = data[0].ID;
                        var str = '<option value="' + saved_filter_name + '" filter_id="' + filter_id + '" name="' + adv_filter_obj_str + '">' + saved_filter_name + '</option>';

                        $("#ddl_saved_filter_list").append(str);
                        $("#ddl_saved_filter_list").val(saved_filter_name);

                        alert1("Filter has been saved successfully!");
                        loading_hide();
                    }
                    else {
                        alert1(message);
                        loading_hide();
                    }

                }, onfail_request);
                getdata.callOtherDomain();
            }
        }
        else {
            //update filter

            var selected_filter_id = $("#ddl_saved_filter_list option:selected").attr('filter_id');
            $("#ddl_saved_filter_list option:selected").attr('name', adv_filter_obj_str);

            var param_obj = [];
            param_obj.push({
                "ID": selected_filter_id,
                "JSON": adv_filter_obj
            });

            loading();
            var getdata = new Webservicecall_REST(global_wcf_url + 'Update_Default_Filter', JSON.stringify(param_obj), function (e) {
                var myArray = JSON.parse(e.responseText);
                var status = myArray[0].status;
                var message = myArray[0].message;

                $(".save-filter-dropdown .dropbtn").blur();
                if (status == 1) { }
                else {
                    alert1(message);
                }
                loading_hide();

            }, onfail_request);
            getdata.callOtherDomain();
        }
    }
    catch (e) {
        alert1(e + '_save_advanced_filtered_data');
    }
}

// saved filter dropdown onchange
function display_selected_filter_data_onchange() {
    try {
        $("#ddl_saved_filter_list :selected").attr('flag', 'onchange');
        //$("#ddl_saved_filter_list").blur();
        var selected_item = $("#ddl_saved_filter_list").val();
        if (selected_item == 0) {
            $(".div-filtered-item").empty();
        }
        else {
            //$(".div-delete-filter").show();
            //$(".btn-clear-filter").show();

            $(".div-delete-filter").show();
            var filter_field_obj_str = $("#ddl_saved_filter_list :selected").attr('name');
            filter_field_obj_str = decodeURIComponent(filter_field_obj_str);
            var filter_field_obj = JSON.parse(filter_field_obj_str);

            display_selected_filter_data_onchange_Post(filter_field_obj, "true");
        }
    }
    catch (e) {
        alert1(e + '_display_selected_filter_data_onchange');
    }
}

function display_selected_filter_data_onchange_Post(filter_field_obj, is_dropdown) {
    try {
        var search_obj = [];
        var str = '<span class="mr-1 align-middle text-dark">Filter By:</span>';

        for (var i = 0; i < filter_field_obj.length; i++) {
            var filtered_col_name = filter_field_obj[i].columnName;
            var filtered_col_val = filter_field_obj[i].value;
            var filtered_col_eqn = filter_field_obj[i].Equation;
            var type8_val = filter_field_obj[i].calendar_type;
            if (type8_val == "" || type8_val == null || type8_val == undefined) {
                type8_val = "";
            }

            search_obj.push({
                "columnName": filtered_col_name,
                "value": filtered_col_val,
                "Equation": filtered_col_eqn,
                "calendar_type": type8_val
            });

            //changes for saved filter [17122021]
            //var adv_search_obj = {
            //    "columnname": filtered_col_name,
            //    "value": filtered_col_val,
            //    "equation": filtered_col_eqn,
            //    "calendar_type": type8_val
            //};

            //var search_obj_str = json.stringify(adv_search_obj);
            //search_obj_str = encodeuricomponent(search_obj_str);
            //str += '<span class="badge badge-dark" data="' + search_obj_str + '" style="margin-right:5px;">' + filtered_col_name + '</span>';
        }

        //var ddl_filter_flag = $("#ddl_saved_filter_list :selected").attr('flag');

        $("#tbl_advance_colSearch li input.form-check-input").each(function () {
            var coldata_obj = $(this).attr('name');
            coldata_obj = decodeURIComponent(coldata_obj);
            coldata_obj = JSON.parse(coldata_obj);
            var coldata_index = $(this).attr('index');
            var col_name = $(this).val();
            for (var i = 0; i < filter_field_obj.length; i++) {
                var filtered_col_name = filter_field_obj[i].columnName;

                if (col_name == filtered_col_name) {
                    $(this).prop('checked', true);
                    $(this).trigger('onchange');

                    var filtered_col_id = filter_field_obj[i].id;
                    var filtered_col_val = filter_field_obj[i].value;
                    var filtered_col_Eqn = filter_field_obj[i].Equation;
                    $(this).parents('li').find(".fltr-cndtn-inner").find(".fltr-cndtn-eqn").val(filtered_col_Eqn);

                    var cntrl_type = coldata_obj.ctrl_type;
                    var system_var = coldata_obj.system_var;
                    if (system_var == "Status_Name") {
                        var value_Array = coldata_obj.value;
                        if (value_Array == "" || value_Array == null || value_Array == undefined) {
                            value_Array = [];
                        }
                    }

                    if (cntrl_type == 20 || cntrl_type == 2 || cntrl_type == 3 || cntrl_type == 6 || (system_var == "Status_Name" && value_Array.length > 0)) {
                        //setTimeout(function () {

                        for (f = 0; f < filtered_col_val.length; f++) {

                            if (filtered_col_id == '' || filtered_col_id == null || filtered_col_id == undefined) {
                                t_filtered_col_id = '';
                            }
                            else {
                                var t_filtered_col_id = filtered_col_id[f];
                            }

                            var t_filtered_col_val = filtered_col_val[f];
                            var option_exist = $("#fltr_val_ddl_" + coldata_index + "").find("option[value='" + t_filtered_col_val + "']");
                            if (option_exist.length == 0) {
                                // filtered answer is not found in searchable dropdown
                                var option = "<option value='" + t_filtered_col_val + "' name='" + t_filtered_col_id + "'>" + t_filtered_col_val + "</option>";
                                $("#fltr_val_ddl_" + coldata_index + "").append(option);
                                //$("#fltr_val_ddl_" + coldata_index + "").selectpicker('refresh');
                            }
                        }

                        //$("#fltr_val_ddl_" + coldata_index + "").selectpicker('val', filtered_col_val);
                        //$("#fltr_val_ddl_" + coldata_index + "").selectpicker('refresh');
                        $("#fltr_val_ddl_" + coldata_index + "").parent().trigger('onchange');

                        set_dropdown_data_filter(filtered_col_val[0], coldata_index, '');
                        //}, 500);
                    }
                    else if (cntrl_type == 8 || system_var == "CreateDTTM" || system_var == "survey_date") {
                        var filtered_calendar_type = filter_field_obj[i].calendar_type;
                        $("#fltr_date_ddl_" + coldata_index + " option[name='" + filtered_calendar_type + "']").prop('selected', true);
                        $("#dt_tp_Start_" + coldata_index + "").hide().parent().hide();
                        $("#dt_tp_End_" + coldata_index + "").hide().parent().hide();

                        if (filtered_calendar_type == "is_between") {
                            $("#dt_tp_Start_" + coldata_index + "").show().parent().show();
                            $("#dt_tp_End_" + coldata_index + "").show().parent().show();
                            var date1 = filtered_col_val[0];
                            date1 = date1.split(' ');
                            date1 = date1[0];
                            var final_date1 = convert_datetime_by_format(date1, "datetime");
                            var date2 = filtered_col_val[1];
                            date2 = date2.split(' ');
                            date2 = date2[0];
                            var final_date2 = convert_datetime_by_format(date2, "datetime");
                            $("#dt_tp_Start_" + coldata_index + "").val(final_date1);
                            $("#dt_tp_End_" + coldata_index + "").val(final_date2);
                            initialize_datepicker(final_date1, '#dt_tp_Start_' + coldata_index + '');
                            initialize_datepicker(final_date2, '#dt_tp_End_' + coldata_index + '');
                            $(this).parents('li').find(".fltr-cndtn-inner").find("#lbl_tp_info_" + coldata_index + "").text('');
                        }
                        else if (filtered_calendar_type == "is_before") {
                            $("#dt_tp_Start_" + coldata_index + "").show().parent().show();
                            var date1 = filtered_col_val[1];
                            date1 = date1.split(' ');
                            date1 = date1[0];
                            var final_date1 = convert_datetime_by_format(date1, "datetime");
                            $("#dt_tp_Start_" + coldata_index + "").val(final_date1);
                            initialize_datepicker(final_date1, '#dt_tp_Start_' + coldata_index + '');
                            $(this).parents('li').find(".fltr-cndtn-inner").find("#lbl_tp_info_" + coldata_index + "").text('');
                        }
                        else if (filtered_calendar_type == "is_after") {
                            $("#dt_tp_Start_" + coldata_index + "").show().parent().show();
                            var date1 = filtered_col_val[0];
                            date1 = date1.split(' ');
                            date1 = date1[0];
                            var final_date1 = convert_datetime_by_format(date1, "datetime");
                            $("#dt_tp_Start_" + coldata_index + "").val(final_date1);
                            initialize_datepicker(final_date1, '#dt_tp_Start_' + coldata_index + '');
                            $(this).parents('li').find(".fltr-cndtn-inner").find("#lbl_tp_info_" + coldata_index + "").text('');
                        }
                        else {
                            var final_date1 = '', final_date2 = '';
                            var date1 = filtered_col_val[0];
                            if (date1 == '' || date1 == null || date1 == undefined) { }
                            else {
                                var final_date1 = convert_datetime_by_format(date1, "datetime");
                            }

                            var date2 = filtered_col_val[1];
                            if (date2 == '' || date2 == null || date2 == undefined) { }
                            else {
                                final_date2 = convert_datetime_by_format(date2, "datetime");
                            }

                            filtered_col_val = final_date1 + ' - ' + final_date2;
                            $(this).parents('li').find(".fltr-cndtn-inner").find("#lbl_tp_info_" + coldata_index + "").text(filtered_col_val);
                        }
                    }
                    else {
                        $(this).parents('li').find(".fltr-cndtn-inner").find("input").val(filtered_col_val);
                    }

                    //changes for saved filter [17122021]
                    var adv_search_obj = {
                        "columnName": filtered_col_name,
                        "id": filtered_col_id,
                        "value": filtered_col_val,
                        "Equation": filtered_col_Eqn
                    };

                    var search_obj_str = JSON.stringify(adv_search_obj);
                    search_obj_str = encodeURIComponent(search_obj_str);
                    str += '<span class="badge badge-dark mr-1" data="' + search_obj_str + '">' + filtered_col_name + '</span>';
                }
            }
        });

        $(".div-filtered-item").empty();
        $(".div-filtered-item").append(str);

        if (is_dropdown == "true") {
            var saved_filter_name = $("#ddl_saved_filter_list :selected").val();
            get_list_of_pm_sites_by_search_online(search_obj, saved_filter_name);
        }
        else {
            get_list_of_pm_sites_by_search_online(search_obj, "");
        }
    }
    catch (e) {
        alert1(e + '_display_selected_filter_data_onchange_Post');
    }
}


function delete_selected_filter() {
    try {
        vibrate_device();
        var user_choice = confirm("Are you sure? You want to delete selected filter?");
        if (user_choice) {
            var selected_filter_name = $("#ddl_saved_filter_list").val();
            var selected_filter_id = $("#ddl_saved_filter_list option:selected").attr('filter_id');
            var selected_filter_json = $("#ddl_saved_filter_list option:selected").attr('name');
            selected_filter_json = decodeURIComponent(selected_filter_json);
            selected_filter_json = JSON.parse(selected_filter_json);

            var param_obj = [];
            param_obj.push({
                "ID": selected_filter_id,
                "JSON": selected_filter_json
            });

            //loading_show();
            var getdata = new Webservicecall_REST(global_wcf_url + 'Delete_Default_Filter', JSON.stringify(param_obj), function (e) {
                var myArray = JSON.parse(e.responseText);
                var status = myArray[0].status;
                var message = myArray[0].message;
                if (status == 1) {
                    //clear_filter();
                    reset_input_search_data()
                    get_saved_advanced_filter_data();

                }
                else {
                    alert1(message);
                    loading_hide();
                }

            }, onfail_request);
            getdata.callOtherDomain();
        }
    }
    catch (e) {
        alert1(e + '_delete_selected_filter');
    }
}

initialize_datepicker = (date_val, date_picker_id) => {
    var datetime_format = localStorage.getItem("dateFormat");
    if (datetime_format == "" || datetime_format == null || datetime_format == undefined) {
        datetime_format = 'mm/dd/yyyy HH:mm';
    }
    var T_mode = "datetime";

    var datetime_format_ary = datetime_format.split(" ");
    var date_format = datetime_format_ary[0];
    var time_format = datetime_format_ary[1];

    if (datetime_format.indexOf("dd-M-yyyy") > -1) {
        var display_value = ('Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec');
        var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    }
    else {
        var display_value = ('01 02 03 04 05 06 07 08 09 10 11 12');
        var monthNames = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
    }

    if (date_val instanceof Date) {
        // if date is  object
        var today = new Date(date_val);
        var currMonth = monthNames[today.getMonth()];
    }
    else {
        // if date is in string
        //var today = date_val;
        //if (date_format == "dd/mm/yyyy") {
        //    var m = today.split("/")[1];
        //}
        //var currMonth = m;

        var date_val_submit = convert_fix_format_date_on_submit(date_val, T_mode);
        var today = new Date(date_val_submit);
        var currMonth = monthNames[today.getMonth()];
    }

    if (time_format == "HH:mm:ss") {
        var column_array = [
            // Months
            {
                values: ('0 1 2 3 4 5 6 7 8 9 10 11').split(' '),
                displayValues: display_value.split(' '),
                textAlign: 'left'
            },
            // Days
            {
                values: [01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31],
            },
            // Years
            {
                values: (function () {
                    var arr = [];
                    for (var i = 2000; i <= 2030; i++) { arr.push(i); }
                    return arr;
                })(),
            },
            // Space divider
            {
                divider: true,
                content: '  '
            },
            // Hours
            {
                values: (function () {
                    var arr = [];
                    for (var i = 0; i <= 23; i++) {
                        if (i < 10) {
                            i = '0' + i;
                        }
                        arr.push(i);
                    }
                    return arr;
                })(),
            },
            // Divider
            {
                divider: true,
                content: ':'
            },
            // Minutes
            {
                values: (function () {
                    var arr = [];
                    for (var i = 0; i <= 59; i++) {
                        if (i < 10) {
                            i = '0' + i;
                        }
                        arr.push(i);
                    }
                    return arr;
                })(),
            },
            // Divider
            {
                divider: true,
                content: ':'
            },
            // Seconds
            {
                values: (function () {
                    var arr = [];
                    for (var i = 0; i <= 59; i++) {
                        if (i < 10) {
                            i = '0' + i;
                        }
                        arr.push(i);
                    }
                    return arr;
                })(),
            }
        ];
    }
    else {
        var column_array = [
            // Months
            {
                values: ('0 1 2 3 4 5 6 7 8 9 10 11').split(' '),
                displayValues: display_value.split(' '),
                textAlign: 'left'
            },
            // Days
            {
                values: [01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31],
            },
            // Years
            {
                values: (function () {
                    var arr = [];
                    for (var i = 2000; i <= 2030; i++) { arr.push(i); }
                    return arr;
                })(),
            },
            // Space divider
            {
                divider: true,
                content: '  '
            },
            // Hours
            {
                values: (function () {
                    var arr = [];
                    for (var i = 0; i <= 23; i++) {
                        if (i < 10) {
                            i = '0' + i;
                        }
                        arr.push(i);
                    }
                    return arr;
                })(),
            },
            // Divider
            {
                divider: true,
                content: ':'
            },
            // Minutes
            {
                values: (function () {
                    var arr = [];
                    for (var i = 0; i <= 59; i++) {
                        if (i < 10) {
                            i = '0' + i;
                        }
                        arr.push(i);
                    }
                    return arr;
                })(),
            }
        ];
    }

    var val = today;               //today's date
    if (val == "" || val == null || val == undefined) {
        var valueArray = [];
    }
    else {
        if (datetime_format.indexOf("dd/mm/yyyy") > -1) {
            if (val.length < 17) {
                var t_date_str1 = val.substring(0, 10);
                var t_date_str2 = val.substring(10);
                if (F7_device == 'ios') {
                    //date with (-) is invalid for ios so replaced it with "/" instead of "-"[FT - 01062024]
                    t_date_str1 = t_date_str1.split("/").reverse().join("/");
                }
                else {
                    t_date_str1 = t_date_str1.split("/").reverse().join("-");
                }
                val = t_date_str1 + t_date_str2;
            }
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

        //if (time_format == "HH:mm:ss") {
        //    var valueArray = [mm1, dd1, yyyy1, hour, min, second];
        //}
        //else {
        //    var valueArray = [mm1, dd1, yyyy1, hour, min];
        //}

        if (time_format == "HH:mm:ss") {
            var valueArray = [(mm1 - 1), dd1, yyyy1, hour, min, second];
        }
        else {
            var valueArray = [(mm1 - 1), dd1, yyyy1, hour, min];
        }

    }

    var dtpicker_obj_start =
    {
        input: date_picker_id,
        rotateEffect: false,
        //for current date time
        value: valueArray,
        onChange: function (picker, values, displayValues) {
            var daysInMonth = new Date(picker.value[2], picker.value[0] * 1 + 1, 0).getDate();
            if (values[1] > daysInMonth) {
                picker.cols[1].setValue(daysInMonth);
            }
        },
        formatValue: function (p, values, displayValues) {
            if (displayValues == '') {
                if (time_format == "HH:mm:ss") {
                    var default_value = currMonth + '/' + values[1] + '/' + values[2] + ' ' + values[3] + ':' + values[4] + ':' + values[5];
                }
                else {
                    var default_value = currMonth + '/' + values[1] + '/' + values[2] + ' ' + values[3] + ':' + values[4];
                }
                var new_default_value = convert_datetime_by_format(default_value, T_mode);
                return new_default_value;
            } else {
                if (time_format == "HH:mm:ss") {
                    var format_value = displayValues[0] + '/' + values[1] + '/' + values[2] + ' ' + values[3] + ':' + values[4] + ':' + values[5];
                }
                else {
                    var format_value = displayValues[0] + '/' + values[1] + '/' + values[2] + ' ' + values[3] + ':' + values[4];
                }
                var new_format_value = convert_datetime_by_format(format_value, T_mode);
                return new_format_value;
            }
        },
        cols: column_array
    };

    //var currMonth = monthNames[today.getMonth()];

    if (val == "" || val == null || val == undefined) {
        delete dtpicker_obj_start['value'];  // remove value key if cal value is blank (no default or answer value)
    }

    myApp.picker(dtpicker_obj_start);
}

