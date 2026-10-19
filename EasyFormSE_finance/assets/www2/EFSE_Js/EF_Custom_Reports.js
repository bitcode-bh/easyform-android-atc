
function open_popup_osm_fr_id(t_name) {
    var search_val = $("#txt_" + t_name + "").val();
    if (search_val == "") {
        if (t_name == "OSM") {
            alert1("Please enter OSM ID...");
        }
        else {
            alert1("Please enter FR ID...");
        }
    }
    else if (search_val.length < 6) {
        alert1("Please enter atleast 6 characters to search...")
    }
    else {
        var clickedLink = $("[id^='popup_osm_fr']");
        myApp.popup('.popup-osm-fr', clickedLink);
        $("#lbl_popup").html(t_name + " ID");
        $("#list").empty();
        $("#txtsearch").val("");

        if (t_name == "OSM") {
            get_OSM_ID(search_val);
        }
        else {
            get_FR_ID(search_val);
        }
    }
}

// fill ddl
function get_OSM_ID(t_val) {
    $("#txt_OSM").val("");
    $("#txt_FR").val("");
    var RowQueryText = 'Vodafone-Metal-OSMID';
    var RowQueryData = [{ "key": "@osmid", "value": t_val }];

    var Param_obj = [];
    Param_obj.push({
        'RowQueryName': RowQueryText,
        'RowQueryWhere': RowQueryData,
        "CompanyId": company_id
    });

    var getdata = new Webservicecall_REST(global_wcf_url + 'rowquerydatafetch', JSON.stringify(Param_obj), onsuccess_get_OSM_ID, onfail_custom_report);
    getdata.callOtherDomain();
}

function onsuccess_get_OSM_ID(e) {
    try {
        var res_text = e.responseText;
        var result = eval('(' + res_text + ')');
        var message = result[0].message;
        var status = result[0].status;
        if (status == 1) {
            $("#list").empty();
            var OSM_json = result[0].data_array;
            var len = OSM_json.length;
            if (len == 1) {
                myApp.closeModal('.popup-osm-fr');
                get_OSM_data(OSM_json[0].CustomerUniq);
            }
            else {
                for (i = 0; i < len; i++) {
                    var Customer_id = OSM_json[i].Customer_id;
                    var CustomerUniq = OSM_json[i].CustomerUniq;

                    var param = "myApp.closeModal('.popup-osm-fr'); get_OSM_data('" + CustomerUniq + "')"
                    var li_str = '<li class="item-content" id="osm_' + i + '" value="' + Customer_id + '" onclick="' + param + '"><div class="item-inner cls_search"><div class="item-title">' + CustomerUniq + '</div></div></li>';
                    $("#list").append(li_str);

                    //var op_str = '<option value="' + Customer_id + '">' + CustomerUniq + '</option>';
                    //$("#ddl_OSM").append(op_str);
                }
            }
            //get_FR_ID('');
        }
        else {
            myApp.closeModal('.popup-osm-fr');
            alert1('No data found.')
            $('#ddl_OSM >option:eq(0)').prop('selected', true);
        }
    }
    catch (e) {
        alert1(e);
    }
}

function get_FR_ID(t_val) {
    $("#txt_OSM").val("");
    $("#txt_FR").val("");

    var RowQueryText = 'Vodafone-Metal-FRID';
    var RowQueryData = [{ "key": "@frid", "value": t_val }];

    var Param_obj = [];
    Param_obj.push({
        'RowQueryName': RowQueryText,
        'RowQueryWhere': RowQueryData,
        "CompanyId": company_id
    });

    var getdata = new Webservicecall_REST(global_wcf_url + 'rowquerydatafetch', JSON.stringify(Param_obj), onsuccess_get_FR_ID, onfail_custom_report);
    getdata.callOtherDomain();
}

function onsuccess_get_FR_ID(e) {
    try {
        var res_text = e.responseText;
        var result = eval('(' + res_text + ')');
        var message = result[0].message;
        var status = result[0].status;
        if (status == 1) {
            $("#list").empty();
            var OSM_json = result[0].data_array;
            var len = OSM_json.length;
            if (len == 1) {
                myApp.closeModal('.popup-osm-fr');
                get_FR_data(OSM_json[0].CustomerUniq);
            }
            else {
                for (i = 0; i < len; i++) {
                    var Customer_id = OSM_json[i].Customer_id;
                    var CustomerUniq = OSM_json[i].CustomerUniq;
                    //var op_str = '<option value="' + Customer_id + '">' + CustomerUniq + '</option>';
                    //$("#ddl_FR").append(op_str);

                    var param = "myApp.closeModal('.popup-osm-fr'); get_FR_data('" + CustomerUniq + "')"
                    var li_str = '<li class="item-content" id="fr_' + i + '" value="' + Customer_id + '" onclick="' + param + '"><div class="item-inner cls_search"><div class="item-title">' + CustomerUniq + '</div></div></li>';
                    $("#list").append(li_str);
                }
            }
        }
        else {
            myApp.closeModal('.popup-osm-fr');
            alert1('No data found.')
            $('#ddl_FR >option:eq(0)').prop('selected', true);
        }
    }
    catch (e) {
        alert1(e);
    }
}



// main grid
var last_changed_ddl = 'OSM';
function get_OSM_data(selected_OSM_ID) {
    last_changed_ddl = 'OSM';
    $("#mk_loader").show();
    $(".web_hidden_loader").show();
    $(".scroll_outer").parent().css("padding-bottom", "0px");
    $("#tbl_main").empty();
    $("#tbl_sub").empty();
    //var selected_OSM_ID = $("#ddl_OSM :selected").text();
    //$("#lbl_ddl_FR").html("Select FR ID");

    $("#lbl_fr_id").html("");
    $("#lbl_osm_id").html(selected_OSM_ID);
    $("#txt_OSM").val("");

    if (feature_id == 6830) {
        // full view
        var RowQueryText = 'Vodafone-Metal_Main_Grid_by_OSMID';   // full view
    }
    else if (feature_id == 6865) {
        // view 1
        var RowQueryText = 'Vodafone-Metal_Main_Grid_by_OSMID_till_GRN_DATA_VIEW-1';
    }
    else if (feature_id == 6866) {
        // view 2
        var RowQueryText = 'Vodafone-Metal_Main_Grid_by_OSMID_WITHOUT_GRN_DATA_VIEW-2';
    }
    else if (feature_id == 6872) {
        // view 3 
        var RowQueryText = 'Vodafone-Metal_Main_Grid_by_OSMID_Color_coding';
    }
    else if (feature_id == 6873) {
        // view 4
        var RowQueryText = 'Vodafone-Metal_Main_Grid_by_OSMID_accountable';
    }


    var RowQueryData = [{ "key": "@osmid", "value": selected_OSM_ID }];

    var Param_obj = [];
    Param_obj.push({
        'RowQueryName': RowQueryText,
        'RowQueryWhere': RowQueryData,
        "CompanyId": company_id
    });

    var getdata = new Webservicecall_REST(global_wcf_url + 'rowquerydatafetch', JSON.stringify(Param_obj), onsuccess_get_OSM_data, onfail_custom_report);
    getdata.callOtherDomain();

}

function get_FR_data(selected_FR_ID) {
    last_changed_ddl = 'FR';
    $("#mk_loader").show();
    $(".web_hidden_loader").show();
    $(".scroll_outer").parent().css("padding-bottom", "0px");
    $("#tbl_main").empty();
    $("#tbl_sub").empty();
    //var selected_FR_ID = $("#ddl_FR :selected").text();
    //$("#lbl_ddl_OSM").html("Select OSM ID");

    $("#lbl_osm_id").html("");
    $("#lbl_fr_id").html(selected_FR_ID);
    $("#txt_FR").val("");

    if (feature_id == 6830) {
        // full view
        var RowQueryText = 'Vodafone-Metal_Main_Grid_by_FRID';
    }
    else if (feature_id == 6865) {
        // view 1
        var RowQueryText = 'Vodafone-Metal_Main_Grid_by_FRID_till_GRN_DATA_VIEW-1';
    }
    else if (feature_id == 6866) {
        // view 2
        var RowQueryText = 'Vodafone-Metal_Main_Grid_by_FRID_WITHOUT_GRN_DATA_VIEW-2';
    }
    else if (feature_id == 6872) {
        // view 3 
        var RowQueryText = 'Vodafone-Metal_Main_Grid_by_FRID_Color_coding';
    }
    else if (feature_id == 6873) {
        //  view 4
        var RowQueryText = 'Vodafone-Metal_Main_Grid_by_FRID_accountable';
    }

    var RowQueryData = [{ "key": "@frid", "value": selected_FR_ID }];

    var Param_obj = [];
    Param_obj.push({
        'RowQueryName': RowQueryText,
        'RowQueryWhere': RowQueryData,
        "CompanyId": company_id
    });

    var getdata = new Webservicecall_REST(global_wcf_url + 'rowquerydatafetch', JSON.stringify(Param_obj), onsuccess_get_OSM_data, onfail_custom_report);
    getdata.callOtherDomain();

}

var main_grid_json;
function onsuccess_get_OSM_data(e) {
    try {
        var res_text = e.responseText;
        var result = eval('(' + res_text + ')');
        var message = result[0].message;
        var status = result[0].status;
        if (status == 1) {
            var FR_json = result[0].data_array;
            main_grid_json = FR_json;
            createtable(FR_json, "#tbl_main");

            fix_table_column_header();
        }
        else {
            //notify(message, 'danger');
            alert1('No data found.')
        }


        $("#grd_sub").attr("is_updated", "0");
        $("#mk_loader").hide();
        $(".web_hidden_loader").hide();
        $(".scroll_outer").parent().css("padding-bottom", "10px");
    }
    catch (e) {
        alert1(e);
    }
}



// sub grid
function get_sub_data(t_OSM_ID, t_MATCODE, t_CIRCLE) {
    Glob_OSM_ID = t_OSM_ID;
    Glob_MATCODE = t_MATCODE;
    Glob_CIRCLE = t_CIRCLE;
    $("#mk_loader1").show();
    $(".web_hidden_loader").show();
    $(".scroll_outer").parent().css("padding-bottom", "10px");
    var RowQueryText = 'Vodafone-Metal_Main_Grid_by_OSMID_AND_MATCODE';
    var RowQueryData = [{ "key": "@OSM_ID", "value": t_OSM_ID }, { "key": "@MAT_CODE", "value": t_MATCODE }, { "key": "@CIRCLE", "value": t_CIRCLE }]

    var Param_obj = [];
    Param_obj.push({
        'RowQueryName': RowQueryText,
        'RowQueryWhere': RowQueryData,
        "CompanyId": company_id
    });

    var getdata = new Webservicecall_REST(global_wcf_url + 'rowquerydatafetch', JSON.stringify(Param_obj), onsuccess_get_sub_data, onfail_custom_report);
    getdata.callOtherDomain();

}

function onsuccess_get_sub_data(e) {
    try {
        var res_text = e.responseText;
        var result = eval('(' + res_text + ')');
        var message = result[0].message;
        var status = result[0].status;
        if (status == 1) {
            $(".cls_fade").show();
            $("#grd_sub").show();
            var FR_json = result[0].data_array;
            createtable(FR_json, "#tbl_sub");
        }
        else {
            //notify(message, 'danger');
            if (feature_id != 6873) {
                alert1('No data found.');
            }
        }

        $("#mk_loader1").hide();
        $(".web_hidden_loader").hide();
        $(".scroll_outer").parent().css("padding-bottom", "10px");
    }
    catch (e) {
        alert1(e);
    }
}



// get log
function get_task_form_data(t_task_id) {
    Log_TaskID = t_task_id;

    var RowQueryText = 'Vodafone-Metal_QuestionLog_by_TaskId';
    var RowQueryData = [{ "key": "@TASK_ID", "value": t_task_id }]

    var Param_obj = [];
    Param_obj.push({
        'RowQueryName': RowQueryText,
        'RowQueryWhere': RowQueryData,
        "CompanyId": company_id
    });

    var getdata = new Webservicecall_REST(global_wcf_url + 'rowquerydatafetch', JSON.stringify(Param_obj), onsuccess_get_task_form_data, onfail_custom_report);
    getdata.callOtherDomain();

}

function onsuccess_get_task_form_data(e) {
    try {
        var res_text = e.responseText;
        var result = eval('(' + res_text + ')');
        var message = result[0].message;
        var status = result[0].status;
        if (status == 1) {
            var clickedLink = $("#sub_tbl_edit");
            myApp.popup('.popup-report-edit', clickedLink);

            var form_json = result[0].data_array;
            var check_type = form_json[0].checksheet_id;
            var data = form_json[0].DATA;
            data = JSON.parse(data);
            RS_data = data;
            localStorage.setItem('type20_columndata', JSON.stringify(''));

            var AllData = form_json[0].AllData;
            AllData = JSON.parse(AllData);
            Log_AllData = AllData;
            var step_data = AllData[0].step_data;
            var checksheet_name = step_data[0].Cust_form_Header;
            var step = step_data[0].step;
            var blank_data = step[0].data;
            for (i = 0; i < blank_data.length; i++) {
                var bl_que_id = blank_data[i].que_id;
                var bl_type = blank_data[i].type;
                for (j = 0; j < RS_data.length; j++) {
                    var rs_que_id = RS_data[j].que_id;
                    var rs_type = RS_data[j].type;
                    if (rs_que_id == bl_que_id && rs_type == bl_type) {
                        var rs_ans = RS_data[j].ans;
                        blank_data[i].ans = rs_ans;
                        break;
                    }
                }
            }

            //$('#grd_sub').css('opacity', '0.7');
            //$('#myModal').modal('show');

            var list_json = JSON.stringify([{ "site_detail": "false" }]);
            storage.setItem('list_json', JSON.stringify(list_json));
            storage.setItem('checksheet_name', JSON.stringify(checksheet_name));
            storage.setItem('check_type_task', JSON.stringify(check_type));

            storage.setItem('check_type', JSON.stringify(check_type));
            read_dynamic_surveydata_main('', check_type, 9, blank_data, [], 0, 0);
            setTimeout(function () {
                $("#btn_update_log").show();
            }, 500);
        }
        else {
            //notify(message, 'danger');
            alert1('No data found.')
        }
    }
    catch (e) {
        alert1(e);
    }
}



// update log
function submit_log() {
    validate_and_submit_surveydata(1, 9, []);
    var Json_data;
    if (Validation_True == 0) {
        Json_data = ap_json[0].data;
        update_log(Json_data);
    }
}

function update_log(t_Json_data) {
    try {
        var date_s = new Date();
        var date = date_s.getTime();
        var step_data = Log_AllData[0].step_data;
        var check_type = step_data[0].Checksheet_id;
        var site_id = step_data[0].Customerid;
        var step = step_data[0].step;
        var stepid = step[0].stepid;
        var heading = step[0].subcategory;
        var user_id = JSON.parse(storage.getItem('user_id'));
        var username = JSON.parse(storage.getItem('username'));
        var uniqcode = JSON.parse(storage.getItem('uniqcode'));

        var finaljsonObj = [];
        finaljsonObj.push({
            taskid: Log_TaskID,
            servertaskid: Log_TaskID,
            siteid: site_id,
            stepid: stepid,
            category: '',
            imei: '',
            User_Id: user_id,
            username: username,
            u_c: uniqcode,
            subcategory: heading,
            date: date,
            date_s: date_s,
            address: '',
            lat: 0,
            long1: 0,
            gps: 0, // 0 = off, 1 = on
            accuracy: 0,
            diff_time: 0,
            check_type: check_type,
            data: t_Json_data,
            buttons: []
        });

        var param_obj = [];
        param_obj.push({
            'utcmilliseconds': 0,
            'timezone': 0,
            'server_task_id': Log_TaskID,
            'q_data': JSON.stringify(finaljsonObj),
            'c_type': '1'
        });

        var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_InsertQuestionMaster_Log_EF_1_0_0_0', JSON.stringify(param_obj),
                    onsuccess_update_log, onfail_custom_report);
        getdata.callOtherDomain();
    } catch (e) {
        alert1(e + '_update_log()');
        loading_hide();
    }
}

function onsuccess_update_log(e) {
    var res_text = e.responseText;
    var result = eval('(' + res_text + ')');
    var message = result[0].message;
    var status = result[0].status;
    if (status == 1) {
        //notify('Update Successful !', 'success');
        alert1('Update Successful !');
        myApp.closeModal('.popup-report-edit');
        get_sub_data(Glob_OSM_ID, Glob_MATCODE, Glob_CIRCLE);
        $("#grd_sub").attr("is_updated", "1");
    }
    else {
        //notify(message, 'danger');
        alert1('No data found.')
    }

    //$('#myModal').modal('hide');
    //$('#grd_sub').css('opacity', '1');
}

function close_sub_grid() {
    myApp.closeModal('.popup-report-edit');
    $('#grd_sub').hide();
    $('.cls_fade').hide();
    var is_udpated = $("#grd_sub").attr("is_updated");
    if (is_udpated == '1') {
        //if (last_changed_ddl == 'OSM') {
        //    get_OSM_data();
        //}
        //else {
        //    get_FR_data();
        //}
        var lbl_OSM = $("#lbl_osm_id").html();
        if (lbl_OSM == '') {
            get_FR_data(lbl_FR);
        }
        else {
            get_OSM_data(lbl_OSM);
        }
    }
}

function refresh_data() {
    //var ddl_OSM = $("#ddl_OSM").val();
    //if (ddl_OSM == 'Select') {
    //    $('#ddl_FR').trigger("onchange");
    //}
    //else {
    //    $('#ddl_OSM').trigger("onchange");
    //}

    var lbl_OSM = $("#lbl_osm_id").html();
    var lbl_FR = $("#lbl_fr_id").html();
    if (lbl_OSM == "" && lbl_FR == "") {
        alert1("Please enter OSM ID or FR ID!");
    }
    else if (lbl_OSM == '') {
        get_FR_data(lbl_FR);
    }
    else {
        get_OSM_data(lbl_OSM);
    }
}


function fix_table_column_header() {
    try {

        var fixed_col = $("#ddl_fix_clm").val();
        for (var i = 0; i < fixed_col ; i++) {
            var col_no = i + 1;
            var pos_left = $('#tbl_main td:nth-child(' + col_no + ')').position().left - 11;
            $('.tableFixHead td:nth-child(' + col_no + ')').css({
                'position': 'sticky',
                'left': '' + pos_left + 'px'
            });
            $('.tableFixHead th:nth-child(' + col_no + ')').css({
                'position': 'sticky',
                'left': '' + pos_left + 'px',
                'z-index': '1'
            });
        }
    }
    catch (e) {
        alert1(e);
    }
}

function fix_table_column_header_onchange() {

    $(".tableFixHead").scrollLeft(0);

    $('.tableFixHead td').css({
        'position': 'initial',
    });
    $('.tableFixHead th').css({
        'left': 'initial',
        'z-index': '0'
    });

    fix_table_column_header();
}

//var check_Array = ['Pending Qty for approval', 'Accountable person for approval', 'Pending Qty for stock decision', 'Accountable person for stock decision', 'Pending Qty for PO Creation', 'Accountable person for PO Creation', 'Pending Qty for GRN', 'Accountable person for GRN', 'Pending Qty for MRN in SAP Data', 'Accountable person for MRN Creation', 'Pending Qty for Delivery challan in SAP', 'Pending Qty for Delivery challan in SAP', 'Accountable person for GI data Creation', 'Pending Qty for Update Docket Details', 'Accountable person for Docket data creation', 'Pending Qty to Update Actual date of Delivery', 'Accountable person for Delivery']

var check_Array = [];

function createtable(json, tbl_id) {
    $(tbl_id).empty();
    var table = $(tbl_id);
    var tbl_head = $('<thead></thead>');


    if (feature_id == 6873) {
        check_Array = ['Delay', 'Accountable person name-Request', 'Delay of SDE Action', 'Accountable person name-SDE Action', 'Delay of Stock decision', 'Accountable person name-Stock decision', 'Delay of PO Creation', 'Accountable person name-PO', 'Delay of GRN', 'Accountable person name-GRN	', 'Delay of MRN', '	Accountable person name-MRN', 'Delay of GI', 'Accountable person name-GI', 'Delay of Delivery Date', 'Accountable person name-Delivery'];
    }
    else {
        check_Array = ['Pending Qty for approval', 'Accountable person for approval', 'Pending Qty for stock decision', 'Accountable person for stock decision', 'Pending Qty for PO Creation', 'Accountable person for PO Creation', 'Pending Qty for GRN', 'Accountable person for GRN', 'Pending Qty for MRN in SAP Data', 'Accountable person for MRN Creation', 'Pending Qty for Delivery challan in SAP', 'Pending Qty for Delivery challan in SAP', 'Accountable person for GI data Creation', 'Pending Qty for Update Docket Details', 'Accountable person for Docket data creation', 'Pending Qty to Update Actual date of Delivery', 'Accountable person for Delivery'];
    }

    // HEADER

    var bgcolor = $(".navbar").css('background-color');

    header = $("<tr class='table_header'></tr>");
    $.each(Object.keys(json[0]), function (ind_header, val_header) {
        var have_bg = val_header.includes('_BG');
        if (have_bg == false) {
            if (val_header == 'EDITABLE') {
                val_header = 'Revise Qty';
            }
            col = $("<th class='theme_type20_tableview' style='text-align:center; padding: 8px; color:white; background-color: " + bgcolor + "'>" + val_header + "</th>");
            header.append(col);
        }
    });
    tbl_head.append(header);
    table.append(tbl_head);

    // BODY
    $.each(json, function (ind_row, val) {
        //row = $("<tr></tr>");

        if (tbl_id == '#tbl_main') {
            var osmid = val['OSM_ID'];
            var matcode = val['MAT_CODE'];
            var circle = val['Delivery CIRCLE'];
            if (osmid == '' || osmid == null || osmid == undefined) {
                row = $("<tr></tr>");
            }
            else {
                if (feature_id == 6873 || feature_id == 6872) {
                    var param = '';
                }
                else {
                    var param = 'get_sub_data("' + osmid + '","' + matcode + '", "' + circle + '")';
                }
                row = $("<tr onclick = '" + param + "'></tr>");
            }
        }
        else {
            var EDITABLE = val['EDITABLE'];
            EDITABLE = 0;                                   //for apk, edit functionality is not required
            //if (feature_id == 6866 || feature_id == 6872 || feature_id == 6873) {
            //    EDITABLE = 0;
            //}

            if (EDITABLE == 1) {
                var task_id = val['TASK_ID'];
                var param = 'get_task_form_data("' + task_id + '"); return false;';
                row = $("<tr></tr>");
                col = $("<td style='text-align:center;'><button id='sub_tbl_edit' class='shotcutbtn btn btn-primary btn-xs'onclick = '" + param + "' style='color: #fff;padding: 4px 8px;border: none;border-radius: 3px;background-color: " + bgcolor + "'>EDIT</button></td>");
                row.append(col);
            }
            else {
                row = $("<tr></tr>");
                col = $("<td style='text-align:left; padding: 8px;'></td>");
                row.append(col);
            }
        }

        $.each(val, function (ind_cell, val_cell) {
            if (ind_cell != 'EDITABLE') {
                if (val_cell == null) {
                    val_cell = '';
                }

                if (feature_id == 6872) {
                    // view 3 / view 4
                    var have_bg = ind_cell.includes('_BG');
                    if (have_bg == false) {
                        var cell_bg_value = val[ind_cell + '_BG'];
                        if (cell_bg_value == '' || cell_bg_value == null || cell_bg_value == undefined || cell_bg_value == "Reject" || val_cell == '' || val_cell == null || val_cell == undefined || val_cell == "Reject") {
                            var bg_color = 'white';
                            var color = 'initial';
                        }
                        else {
                            var bg_color = cell_bg_value;
                            if (bg_color == 'GREY' || bg_color == 'grey') {
                                bg_color = 'gray';
                            }
                            var color = 'white';
                        }
                        col = $("<td style='text-align:left; padding: 8px; color:" + color + "; background-color:" + bg_color + "'>" + val_cell + "</td>");
                        row.append(col);
                    }
                }
                else {
                    // view main , view 1 , view 2
                    var check_condition = check_Array.includes(ind_cell);
                    if (check_condition == true) {
                        if (val_cell > 0) {
                            var color = 'white';
                            var bg_color = 'red';
                        }
                        else if (val_cell < 0) {
                            var color = 'white';
                            var bg_color = 'orange';
                        }
                        else {
                            if (val_cell == '' || val_cell == ' ' || val_cell == 'N/A' || val_cell == 'NA' || val_cell == '0' || val_cell == 'Reject') {
                                var color = 'initial';
                                var bg_color = 'white';
                            }
                            else {
                                var color = 'white';
                                var bg_color = 'red';
                            }
                        }
                    }
                    else {
                        var color = 'initial';
                        var bg_color = 'white';
                    }
                    col = $("<td style='text-align:left; padding: 8px; color:" + color + "; background-color:" + bg_color + "'>" + val_cell + "</td>");
                    row.append(col);
                }
            }
        });
        table.append(row);
    });
}

function onfail_custom_report(e) {
    alert1('No data found.');
}


function createlistview() {
    try {
        var rowCount = $('#tbl_main').find('tr').length;
        if (rowCount > 0) {
            var lbl_name = $("#lbl_header").text()

            var list_item = '';
            list_item += '<div style="text-align: center"><label id="lbl_pdf_report" style="font-size: 20px;font-weight: bold;">' + lbl_name + '</label></div>';
            list_item += '<ul style="width: 100%;list-style-type: none;">';

            if (feature_id == 6873) {
                check_Array = ['Delay', 'Accountable person name-Request', 'Delay of SDE Action', 'Accountable person name-SDE Action', 'Delay of Stock decision', 'Accountable person name-Stock decision', 'Delay of PO Creation', 'Accountable person name-PO', 'Delay of GRN', 'Accountable person name-GRN	', 'Delay of MRN', '	Accountable person name-MRN', 'Delay of GI', 'Accountable person name-GI', 'Delay of Delivery Date', 'Accountable person name-Delivery'];
            }
            else {
                check_Array = ['Pending Qty for approval', 'Accountable person for approval', 'Pending Qty for stock decision', 'Accountable person for stock decision', 'Pending Qty for PO Creation', 'Accountable person for PO Creation', 'Pending Qty for GRN', 'Accountable person for GRN', 'Pending Qty for MRN in SAP Data', 'Accountable person for MRN Creation', 'Pending Qty for Delivery challan in SAP', 'Pending Qty for Delivery challan in SAP', 'Accountable person for GI data Creation', 'Pending Qty for Update Docket Details', 'Accountable person for Docket data creation', 'Pending Qty to Update Actual date of Delivery', 'Accountable person for Delivery'];
            }

            $.each(main_grid_json, function (ind_row, val) {
                list_item += '<li><table style="width: 100%;border: solid 2px #000;padding:10px 0px;">';
                $.each(val, function (ind_cell, val_cell) {
                    if (val_cell == null) {
                        val_cell = '';
                    }

                    if (feature_id == 6872) {
                        // view 3 / view 4
                        var have_bg = ind_cell.includes('_BG');
                        if (have_bg == false) {
                            var cell_bg_value = val[ind_cell + '_BG'];
                            if (cell_bg_value == '' || cell_bg_value == null || cell_bg_value == undefined || cell_bg_value == 'Reject' || val_cell == '' || val_cell == null || val_cell == undefined || val_cell == 'Reject') {
                                var bg_color = 'white';
                                var color = 'initial';
                            }
                            else {
                                var bg_color = cell_bg_value;
                                if (bg_color == 'GREY' || bg_color == 'grey') {
                                    bg_color = 'gray';
                                }
                                var color = 'white';
                            }
                            list_item += '<tr><td style="width: 50%;word-break: break-all;padding: 5px;"><b>' + ind_cell + '</b>:</td><td style="width: 50%;padding: 5px;word-break: break-all;color:' + color + '; background-color:' + bg_color + '">' + val_cell + '</td></tr>';
                        }
                    }
                    else {
                        // view main , view 1 , view 2
                        var check_condition = check_Array.includes(ind_cell);
                        if (check_condition == true) {
                            if (val_cell > 0) {
                                var color = 'white';
                                var bg_color = 'red';
                            }
                            else if (val_cell < 0) {
                                var color = 'white';
                                var bg_color = 'orange';
                            }
                            else {
                                if (val_cell == '' || val_cell == ' ' || val_cell == 'N/A' || val_cell == 'NA' || val_cell == '0' || val_cell == 'Reject') {
                                    var color = 'initial';
                                    var bg_color = 'white';
                                }
                                else {
                                    var color = 'white';
                                    var bg_color = 'red';
                                }
                            }
                        }
                        else {
                            var color = 'initial';
                            var bg_color = 'white';
                        }
                        list_item += '<tr><td style="width: 50%;padding: 5px;"><b>' + ind_cell + '</b>:</td><td style="width: 50%;padding: 5px;color:' + color + '; background-color:' + bg_color + '">' + val_cell + '</td></tr>';

                    }
                });
                list_item += '</table></li>';
            });

            list_item += '</ul>';

            loading();
            setTimeout(function () {
                download_pdf_report(list_item)
            }, 500);
        }
        else {
            loading_hide();
            alert1("No any table available to export pdf file...")
        }
    }
    catch (e) {
        alert1(e + '_createlistview()');
    }
}

function download_pdf_report(t_list_item) {
    try {
        if (F7_device == "ios") {
            var pdf_html = '<html style="width: 90%;"><body style="width: 100%;">';
        }
        else {
            var pdf_html = '<html style="width: 100%;"><body style="width: 100%;">';
        }
        pdf_html += t_list_item;
        pdf_html += '</body></html>';

        var q_jsonobj = [];
        q_jsonobj.push({
            type: 'pdf',
            datastring: pdf_html
        });
        cordova.exec(onsuccess_download_pdf_report, onfail_download_pdf_report, 'ExportExcelPlugin', 'anAction', q_jsonobj);
    }
    catch (e) {
        loading_hide();
        alert1(e + '_download_pdf_report()');
    }
}

function onsuccess_download_pdf_report(e) {
    loading_hide();
}

function onfail_download_pdf_report(e) {
    loading_hide();
    alert1('Network Error...!');
}






//function fnExcelReport() {
//    try {

//        if (c == 6830) {
//            var file_name = 'Single_Material_View_Report.xls';
//        }
//        else if (feature_id == 6865) {
//            var file_name = 'Procurement_View.xls';
//        }
//        else if (feature_id == 6866) {
//            var file_name = 'Material_Delivery_View.xls';
//        }
//        else if (feature_id == 6872) {
//            var file_name = 'Forecasting-Of_Material.xls';
//        }
//        else if (feature_id == 6873) {
//            var file_name = 'Accountibility_Log_View.xls';
//        }

//        var tab_text = "<table border='2px'><tr bgcolor='#87AFC6'>";
//        var textRange; var j = 0;
//        tab = document.getElementById('tbl_main'); // id of table


//        for (j = 0; j < tab.rows.length; j++) {
//            tab_text = tab_text + tab.rows[j].innerHTML + "</tr>";
//            //tab_text=tab_text+"</tr>";
//        }

//        tab_text = tab_text + "</table>";
//        tab_text = tab_text.replace(/<A[^>]*>|<\/A>/g, ""); //remove if u want links in your table
//        tab_text = tab_text.replace(/<img[^>]*>/gi, ""); // remove if u want images in your table
//        tab_text = tab_text.replace(/<input[^>]*>|<\/input>/gi, ""); // reomves input params

//        var ua = window.navigator.userAgent;
//        var msie = ua.indexOf("MSIE ");

//        if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./))      // If Internet Explorer
//        {
//            txtArea1.document.open("txt/html", "replace");
//            txtArea1.document.write(tab_text);
//            txtArea1.document.close();
//            txtArea1.focus();
//            sa = txtArea1.document.execCommand("SaveAs", true, file_name);
//        }
//        else                 //other browser not tested on IE 11
//            sa = window.open('data:application/vnd.ms-excel,' + encodeURIComponent(tab_text));
//        return (sa);
//    }
//    catch (e) {
//        alert1(e + "_fnExcelReport()");
//    }

//    return false;
//}


//function notify(t_message, t_type) {
//    if (t_type == 'success') {
//        var ico_str = 'fa fa-check';
//    }
//    else {
//        var ico_str = 'fa fa-info-circle';
//    }

//    $.notify({
//        icon: ico_str,
//        message: t_message
//    }, {
//        type: t_type,
//        animate: {
//            enter: 'animated bounceInDown',
//            exit: 'animated bounceOutUp'
//        },
//        delay: 2000,
//    });
//}





























//***************Un used code************
//function getParameterByName(name) {
//    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
//    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
//        results = regex.exec(location.search);
//    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
//}

//function add_search_btn(ddl_name) {
//    if (ddl_name == "OSM") {
//        var param = "search_OSM_ID()"
//    }
//    else if (ddl_name == "FR") {
//        var param = "search_FR_ID()"
//    }

//    var search_str = '<div class="right"><i class="fa fa-search" id="ddl_search_btn" onclick=' + param + ' style="color: #fff;font-size: 20px;margin-right: 25px;cursor: pointer;"></i></div>'
//    setTimeout(function () {
//        $('.smart-select-page').find('.navbar-inner').append(search_str);
//    }, 10);
//}

//function search_OSM_ID() {
//    //$("#btn_search_OSM").css("visibility", "hidden");
//    var search_val = $(".smart-select-page").find(':input[type="search"]').val();
//    get_OSM_ID(search_val);
//}

//function search_FR_ID() {
//    //$("#btn_search_FR").css("visibility", "hidden");
//    //var search_val = $("#ddl_FR").parent().find(':input[type="text"]').val();
//    var search_val = $(".smart-select-page").find(':input[type="search"]').val();
//    get_FR_ID(search_val);
//}
//***************Un used code************




//// ddl search
//function check_and_enable_OSM_search(ele) {
//    //var search_val = $(ele).val();

//    //var no_result_node = $("#ddl_OSM").parent().find("li.no-results");
//    var result_count = $("#ddl_OSM").parent().find("li:visible").length;
//    if (result_count < 10) {
//        $("#btn_search_OSM").css("visibility", "visible");
//    }
//    else {
//        $("#btn_search_OSM").css("visibility", "hidden");
//    }
//}

//function check_and_enable_FR_search(ele) {
//    //var search_val = $(ele).val();
//    //var no_result_node = $("#ddl_FR").parent().find("li.no-results");
//    var result_count = $("#ddl_FR").parent().find("li:visible").length;
//    if (result_count < 10) {
//        $("#btn_search_FR").css("visibility", "visible");
//    }
//    else {
//        $("#btn_search_FR").css("visibility", "hidden");
//    }
//}
