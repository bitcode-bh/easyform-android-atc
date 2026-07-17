//var inv_tbl_counter = 0;
var row_counter = 0;
var sum_array = [];
var mandatory_array = [];

var row_index_no;
var type22_new_id;
var type22_current_mode = 'insert';

// add table header in blank table
function create_table_with_item(btn_NewInv_Counter) {
    try {
        var json_data1 = $("#hdn_jsondata_" + btn_NewInv_Counter + "").val();
        $("#hdn_inv_row_counter_" + btn_NewInv_Counter + "").val(0);
        var row_counter = 0;

        var validation = 0;
        var json_data = itemObj._checkStrObj(json_data1);  		// check_item
        var num_row = json_data.length;
        var display_form = 0;
        // if (create_data_table_flag == 0 && validation == 0) {
        var table_div_data = "<div id='div_sum_" + btn_NewInv_Counter + "' style='overflow-y: hidden; overflow-x: hidden; overflow: auto; max-width:100%; text-align:center'>";
        table_div_data += "<table id='tbl_row_data_" + btn_NewInv_Counter + "'><tr>";
        var sum_div = '';
        var control_type = get_search_ctrl_type(json_data);

        var type22_json_len = $("#hdn_type22_json_len_" + btn_NewInv_Counter + "").val();
        if (type22_json_len == 1 && control_type == '20') { }
        else {
            table_div_data += "<th style='padding:4px; background-color: #F0F0F0; border:1px solid #ccc'><b>Edit</b></th><th style='padding:4px; background-color: #F0F0F0; border:1px solid #ccc'><b>Delete</b></th>";

            for (i = 0; i < num_row; i++) {
                var th_column_id = json_data[i].id;
                var th_name = json_data[i].name;
                table_div_data += "<th id='th_txt_prduct_name_" + btn_NewInv_Counter + '_' + i
                    + "' style='background-color: #F0F0F0; width:100px; height:auto; margin-right:5px; margin-left:5px; text-align:center; padding:7px; border:1px solid #ccc'><b>"
                    + th_name + "</b></th>";
            }
        }
        table_div_data += "</tr>";
        table_div_data += '</table></div><br>';
        table_div_data += "<div id='div_list_display_sum_" + btn_NewInv_Counter + "' style='width:100%;'></div>";

        if (type22_json_len == 1 && control_type == '20') { }
        else {
            sum_div_data += '<hr style="margin:2px 0;">';
        }

        var sum_div_data = '<ul style="padding:0; margin:0;"><li style="padding-top:5px;border-radius:0px; list-style-type:none; width:100%;float:right;" ><div style="position:relative; height:auto;">';
        var sum_count = 0;
        for (var f = 0; f < num_row; f++) {
            var th_column_id = json_data[f].id;
            var th_name = json_data[f].name;
            var ddl_datatype = json_data[f].type;
            var ddl_auto = json_data[f].auto;
            var madatory = json_data[f].mandatory;
            var td_sum = json_data[f].sum;
            var ddl_equation = json_data[f].equation;
            var display_sum1 = json_data[f].display;
            var sum_class = json_data[f].sum_class;

            if (madatory == 1) {
                var th_name_madatory = th_name;
                mandatory_array.push({
                    'madatory_id': f,
                    'th_name_madatory': th_name_madatory
                });
            }
            if (td_sum > 0) {
                //NEW UI
                var bgcolor = json_data[f].bgcolor;
                if (bgcolor == undefined || bgcolor == null || bgcolor == "") {
                    var color = 'black';
                    var back_color = 'white';
                }
                else {
                    var color = 'white';
                    var back_color = bgcolor;
                }

                sum_div_data += '<div style="background-color:' + back_color + ';color:' + color + ';padding:5px"><table style="width: 100%;vertical-align: middle;">';
                sum_div_data += '<tr><td class="type22-sum-header">' + th_name + '</td>';
                sum_div_data += "<td id='sum_" + btn_NewInv_Counter + "_" + f + "' class='type22-sum-ans " + sum_class + "'>0</td></tr></table></div>";

                var sum_madatory = madatory;
                sum_array.push({
                    'sum_column_store': f,
                    'sum_madatory': sum_madatory
                });
                sum_count++;
            }
        }

        sum_div_data += "</div>";
        if (type22_json_len == 1 && control_type == '20') { }
        else {
            sum_div_data += "<hr style='border:1px solid #ccc'>";
        }
        sum_div_data += "</li></ul>";


        $("#div_display_" + btn_NewInv_Counter + "").append(table_div_data);
        $("#div_list_display_sum_" + btn_NewInv_Counter + "").append(sum_div_data);

        if (type22_json_len == 1 && control_type == '20') {
            setTimeout(function () {
                $("#btn_add_row_" + btn_NewInv_Counter + "").trigger('onclick');                 //single control UI changes [19112021]          
            }, 1000);
        }

        for (var p = 0; p < json_data.length; p++) {
            var display = json_data[p].display; // hide column in 22 table
            if (display == "1") {
                $('#th_txt_prduct_name_' + btn_NewInv_Counter + '_' + p + '').hide();
            }
        }

    } catch (e) {
        alert1(e + "_create_table_with_item");
    }
    return false;
}

// open popup on click add row button in form
function add_row_with_item(btn_NewInv_Counter, read_count_length) {
    try {

        var json_data = $("#hdn_jsondata_" + btn_NewInv_Counter + "").val();
        json_data = itemObj._checkStrObj(json_data);  		// check_item

        var num_row = json_data.length;
        // row_counter++;
        var data = [];
        for (i = 0; i < num_row; i++) {
            var column_name = json_data[i].name;
            var type_Array = json_data[i].type;
            for (j = 0; j < type_Array.length; j++) {
                data.push(type_Array[j]);
            }
        }
        var check_type = JSON.parse(storage.getItem('check_type')); // for checksheet id
        read_dynamic_checksheet(read_count_length, check_type, "", data, "", 1, 0);
    } catch (e) {
        alert1(e + "_add_row_with_item");
    }
    return false;
}

// after validation append new td to table
function add_row_to_table_by_popup(inv_test, json) {
    try {
        var display_form = 0;
        //var btn_NewInv_Counter = inv_Calc_new_array[inv_test];                            //commented coz incorrect btn_NewInv_Counter found when opens customer form from taskform and both have a type22 [20052021]
        var btn_NewInv_Counter = type22_new_id;
        inv_test = type22_new_id;

        // var btn_NewInv_Counter = inv_Calc_new;
        var valid_add_row = 0;
        var add_row = '';
        var json_data = $("#hdn_jsondata_" + btn_NewInv_Counter + "").val();
        json_data = itemObj._checkStrObj(json_data);  		// check_item
        var num_row = json_data.length;

        // row_counter++;

        var row_counter = $("#hdn_inv_row_counter_" + btn_NewInv_Counter + "").val();
        row_counter++;
        $("#hdn_inv_row_counter_" + btn_NewInv_Counter + "").val(row_counter);

        var flag_value = 1;
        var item_id_1 = storage.getItem('img_id_type22');

        var type22_json_len = $("#hdn_type22_json_len_" + btn_NewInv_Counter + "").val();
        var type22_snglCntrl_type = $("#hdn_type22_json_len_" + btn_NewInv_Counter + "").attr('type22_snglCntrl_type');
        if (type22_json_len == 1 && type22_snglCntrl_type == '20') {
            add_row = '<tr id="tr_row_for_delete_' + btn_NewInv_Counter + '_' + row_counter + '" it_id="' + row_counter + '" style="text-align:left;display:inline;">';
        }
        else {
            add_row = '<tr id="tr_row_for_delete_' + btn_NewInv_Counter + '_' + row_counter + '" it_id="' + row_counter + '" style="text-align:left;">';

            // edit button
            var param = 'return popup_search_items_show_type22("' + item_id_1 + '","' + inv_test + '","' + row_counter + '","' + flag_value + '","")';
            var param_delete = 'delete_row_from_table("' + item_id_1 + '","' + inv_test + '","' + row_counter + '","' + flag_value + '","")';

            // if ($('#collapse_container_div').css('display') == 'block') {
            // param = "";
            // if ($('#popup_outer_div_type23').css('display') == 'block') {
            // param = 'return popup_search_items_show_type22("' + item_id_1
            // + '","' + inv_test + '","' + row_counter + '","'
            // + flag_value + '","")';
            // }
            // }

            if (form_flag == 2) {
                param = "";
                if (form_flag == 3) {
                    param = 'return popup_search_items_show_type22("' + item_id_1 + '","' + inv_test + '","' + row_counter + '","' + flag_value + '","")';
                    param_delete = 'delete_row_from_table("' + item_id_1 + '","' + inv_test + '","' + row_counter + '","' + flag_value + '","")';
                }
            }

            var que_id_json = [];
            for (var q = 0; q < num_row; q++) {
                var display = json_data[q].display;
                if (display == "1") { // hide column
                    if (json_data[q].type[0].type == 5) {
                        var que_id_display = json_data[q].type[1].que_id;
                        var value_display = json_data[q].type[1].value;
                    }
                    else {
                        var que_id_display = json_data[q].type[0].que_id;
                        var value_display = json_data[q].type[0].value;
                    }
                    que_id_json.push({
                        "que_id_display": que_id_display,
                        "value_display": value_display
                    });
                }
            }

            add_row += "<td style='padding:7px 10px; border:1px solid #ccc'><i class='fa fa-pencil' id='btn_edit_td_" + btn_NewInv_Counter + '_' + row_counter + "' onclick='" + param + "'></i></td>";
            add_row += "<td style='padding:7px 10px; border:1px solid #ccc'><i class='fa fa-remove' id='btn_delete_td_"
                + btn_NewInv_Counter + '_' + row_counter + "' onclick='" + param_delete + "'></i><input type='hidden' id='hdn_tr_delete_" + btn_NewInv_Counter + "_" + row_counter + " value='0'></td>";
        }

        var count = 0;
        for (i = 0; i < json.length; i++) {
            if (json[i].type != '5') { // if label it wiil not append
                if (json[i].type == '20') {
                    var value = json[i].ans[0];
                    var type20_id = json[i].ans[1];
                } else if (json[i].type == '7' || json[i].type == '9' || json[i].type == '26' || json[i].type == '8') {
                    var value = json[i].ans[0];
                } else {
                    var value = json[i].ans;
                }

                for (var p = 0; p < que_id_json.length; p++) {
                    if (que_id_json[p].que_id_display == json[i].que_id) {
                        if (json[i].type == '20') {
                            add_row += "<input type='hidden' title='" + type20_id + "' id='hdn_hide_pass_value_" + btn_NewInv_Counter + '_' + row_counter + '_' + count + "' value=" + value + ">";
                            break;
                        } else {
                            var hide_value = json[i].ans;
                            add_row += "<input type='hidden' id='hdn_hide_pass_value_" + btn_NewInv_Counter + '_' + row_counter + '_' + count + "' value=" + hide_value + ">";
                            break;
                        }
                    }
                }

                var cntrl_type = json[i].type;
                if (type22_json_len == 1 && type22_snglCntrl_type == '20') {
                    if (cntrl_type == '7' || cntrl_type == '9' || cntrl_type == '11') {
                        add_row += "<span class='badge badge-secondary' style='display:inline-block;padding:3px;margin-top:3px;'>";
                        if (value == "" || value == null || value == undefined) {
                            add_row += "<img id='txt_add_row_" + btn_NewInv_Counter + "_" + row_counter + "_" + count + "' src='" + value + "' onerror='$(this).hide()' class='type22-list-item-img' /'></td>";
                        }
                        else {
                            if (F7_device == 'ios') {
                                //====photo thumbnail issue for iOS after cordove plugin updation [03062025]
                                var iosDirectoryPath = localStorage.getItem('iosDirectoryPath');
                                var localFile = iosDirectoryPath + value;
                                value = window.WkWebView.convertFilePath(localFile);
                            }

                            add_row += "<img id='txt_add_row_" + btn_NewInv_Counter + "_" + row_counter + "_" + count + "' src='" + value + "' class='type22-list-item-img' /'></td>";
                        }
                        add_row += "<span style=='vertical-align:middle; margin-left:5px;display:inline-block;'><i class='fa fa-times fa-2x mr-0' onclick='" + param_delete + "'></i></span>";
                        add_row += "</span>";
                    } else if (cntrl_type == '20') {
                        add_row += "<span class='badge badge-secondary' style='display:inline-block;padding:3px;margin-top:3px;'><label title='" + type20_id + "' id='txt_add_row_" + btn_NewInv_Counter + '_' + row_counter + '_' + count + "' disabled style='vertical-align:middle;font-size:12px;'>" + value + "</label><span style='vertical-align:middle; margin-left:5px;'><i class='fa fa-times fa-2x mr-0' onclick='" + param_delete + "'></i></span></span>";
                    } else {
                        add_row += "<span class='badge badge-secondary' style='display:inline-block;padding:3px;margin-top:3px;'><label title='" + type20_id + "' id='txt_add_row_" + btn_NewInv_Counter + '_' + row_counter + '_' + count + "' disabled style='vertical-align:middle;font-size:12px;'>" + value[0] + "</label><span style='vertical-align:middle; margin-left:5px;'><i class='fa fa-times fa-2x mr-0' onclick='" + param_delete + "'></i></span></span>";
                    }
                }
                else {
                    if (json[i].type == '7' || json[i].type == '9' || json[i].type == '11') {
                        add_row += "<td style='width:100px; padding:2px; border:1px solid #ccc; text-align:center'>";
                        if (value == "" || value == null || value == undefined) {
                            //add_row += "<label id='txt_add_row_" + btn_NewInv_Counter + '_' + row_counter + '_' + count + "' src=''></label>";
                            add_row += "<img id='txt_add_row_" + btn_NewInv_Counter + '_' + row_counter + '_'
                                + count + "'  src='" + value + "' onerror='$(this).hide();' style='vertical-align:middle; border-radius:7px; padding:5px; width:50px; height:50px;' /'>";                   //hide broken img onerror [21052021]
                        }
                        else {
                            add_row += "<img id='txt_add_row_" + btn_NewInv_Counter + '_' + row_counter + '_'
                                + count + "'  src='" + value + "' style='vertical-align:middle; border-radius:7px; padding:5px; width:50px; height:50px;' /'>";
                        }
                        add_row += "</td>";
                    } else if (json[i].type == '20') {
                        add_row += "<td style='width:100px; padding:2px; border:1px solid #ccc'><label title='" + type20_id + "' id='txt_add_row_" + btn_NewInv_Counter + '_'
                            + row_counter + '_' + count + "' style='width:100px; height:auto;max-height:30px; margin-right:5px; margin-left:5px;border:0px' disabled>" + value + "</label></td>";
                    } else {
                        add_row += "<td style='width:100px; padding:2px; border:1px solid #ccc'><label id='txt_add_row_" + btn_NewInv_Counter + '_' + row_counter + '_' + count
                            + "' style='width:100px; height:auto;max-height:30px; margin-right:5px; margin-left:5px;border:0px; word-wrap: break-word;' disabled>" + value + "</label></td>";
                    }
                }

                count++;
            }
        }
        add_row += '</tr>';
        $('#tbl_row_data_' + btn_NewInv_Counter + '').append(add_row);
        var json_ans_new = JSON.stringify(json);

        // dynamic hide td of column
        for (var h = 0; h < json_data.length; h++) {
            var display = json_data[h].display;
            if (display == "1") {
                let tagName = $('#txt_add_row_' + btn_NewInv_Counter + '_' + row_counter + '_' + h + '')[0].tagName;
                if (tagName == "IMG") {
                    $('#txt_add_row_' + btn_NewInv_Counter + '_' + row_counter + '_' + h + '').parent("td").parent("tr").hide();
                }
                else {
                    $('#txt_add_row_' + btn_NewInv_Counter + '_' + row_counter + '_' + h + '').parent().hide();
                }
            }
        }

        $('#btn_edit_td_' + btn_NewInv_Counter + '_' + row_counter + '').attr("alt", json_ans_new);

        $("#div_inv_form").empty();
        ckeck_mandatory(inv_test);
        popup_items_hide_type22(0);

        //Add new record as per config. max_record (For tableview) - mk - 01042025
        var max_record = $("#hdn_btn_congfiure_" + btn_NewInv_Counter + "").attr('max_record');
        if (max_record == null || max_record == '' || max_record == undefined) { }
        else {

            if (typeof max_record == "string") {
                max_record = parseInt(max_record);
            }

            var tbl_length = $('#tbl_row_data_' + btn_NewInv_Counter + ' tr[id^=tr_row_for_delete_]:visible').length;
            if (max_record == tbl_length) {
                $("#btn_add_row_" + btn_NewInv_Counter + "").css('display', 'none');
            }
        }

    } catch (e) {
        alert1(e + "_add_row_to_table_by_popup");
    }
    return false;
}

// open popup with filled data
function on_click_edit_open_popup(inv_id, row_counter1) {
    try {
        //var btn_NewInv_Counter = inv_Calc_new_array[inv_id];              //commented coz incorrect btn_NewInv_Counter found when opens customer form from taskform and both have a type22 [20052021]
        var btn_NewInv_Counter = type22_new_id;

        $("#div_inv_form").empty();
        var edit_div = "<input type='hidden' id='hdn_edit_row_" + btn_NewInv_Counter + "' value=" + row_counter1 + ">";
        $("#div_inv_form").append(edit_div);

        var json_data = $("#hdn_jsondata_" + btn_NewInv_Counter + "").val();
        json_data = itemObj._checkStrObj(json_data);  		// check_item
        var num_row = json_data.length;
        var data = [];

        var json_edit = $('#btn_edit_td_' + btn_NewInv_Counter + '_' + row_counter1 + '').attr("alt");
        json_edit = itemObj._checkStrObj(json_edit);  		// check_item
        var check_type = JSON.parse(storage.getItem('check_type')); // for checksheet id

        //-----merge template and log JSON [16082021]---
        var edit_type22_json = [];
        for (var i = 0; i < json_data.length; i++) {
            var type_json = json_data[i].type;
            for (var j = 0; j < type_json.length; j++) {
                var cntrl_type = type_json[j].type;
                if (cntrl_type == 5) { }
                else {
                    var temp_que_id = type_json[j].que_id;
                    for (var k = 0; k < json_edit.length; k++) {
                        var log_que_id = json_edit[k].que_id;
                        var log_ans = json_edit[k].ans;
                        if (temp_que_id == log_que_id) {
                            type_json[j].ans = log_ans;
                        }
                    }
                    edit_type22_json.push(type_json[j]);
                }
            }
        }

        //read_dynamic_surveydata_main(inv_id, check_type, "1", json_edit, "", 1, 0);
        read_dynamic_surveydata_main(inv_id, check_type, "1", edit_type22_json, "", 1, 0);
    } catch (e) {
        alert1(e + "_on_click_edit_open_popup");
    }
    return false;
}

// edit row after validation append existing td to table
function display_edit_value_to_table(new_json, inv_Calc_goto) {
    try {
        type22_filled_json_dependency = [];
        //var btn_NewInv_Counter = inv_Calc_new_array[inv_Calc_goto];           //commented coz incorrect btn_NewInv_Counter found when opens customer form from taskform and both have a type22 [20052021]
        var btn_NewInv_Counter = type22_new_id;

        var row_counter_hdn = $('#hdn_edit_row_' + btn_NewInv_Counter + '').val();

        // var row_counter_hdn = $('#hdn_edit_row_' + inv_Calc_new + '').val();
        // var btn_NewInv_Counter = inv_Calc_new;
        var valid_add_row = 0;
        var add_row = '';
        var json_data = $("#hdn_jsondata_" + btn_NewInv_Counter + "").val();
        json_data = itemObj._checkStrObj(json_data);  		// check_item
        var num_row = json_data.length;

        var que_id_json = [];
        for (var q = 0; q < num_row; q++) {
            var display = json_data[q].display;
            if (display == "1") {
                if (json_data[q].type[0].type == 5) {
                    var que_id_display = json_data[q].type[1].que_id;
                    var value_display = json_data[q].type[1].value;
                }
                else {
                    var que_id_display = json_data[q].type[0].que_id;
                    var value_display = json_data[q].type[0].value;
                }
                que_id_json.push({
                    "que_id_display": que_id_display,
                    "value_display": value_display
                });
            }
        }

        var count = 0;
        for (i = 0; i < new_json.length; i++) {
            if (new_json[i].type != '5') { // if label it wiil not append
                if (new_json[i].type == '7' || new_json[i].type == '9' || new_json[i].type == '11') {
                    var ans = new_json[i].ans[0];
                    $('#txt_add_row_' + btn_NewInv_Counter + '_' + row_counter_hdn + '_' + count + '').show();
                    $('#txt_add_row_' + btn_NewInv_Counter + '_' + row_counter_hdn + '_' + count + '').attr("src", ans);
                } else {
                    var hdn_flag = 0;
                    for (var p = 0; p < que_id_json.length; p++) {
                        // hdn_flag = 1;
                        if (que_id_json[p].que_id_display == new_json[i].que_id) {
                            if (new_json[i].type == '20') {
                                var row_value = new_json[i].ans[0];
                                var row_id = new_json[i].ans[1];
                                $('#hdn_hide_pass_value_' + btn_NewInv_Counter + '_' + row_counter_hdn + '_' + count + '').val(row_value);
                                $('#hdn_hide_pass_value_' + btn_NewInv_Counter + '_' + row_counter_hdn + '_' + count + '').attr('title', row_id);
                            } else if (new_json[i].type == '26' || new_json[i].type == '8') {
                                var ans = new_json[i].ans[0];
                                $('#hdn_hide_pass_value_' + btn_NewInv_Counter + '_' + row_counter_hdn + '_' + count + '').val(ans);
                            } else {
                                var ans = new_json[i].ans;
                                $('#hdn_hide_pass_value_' + btn_NewInv_Counter + '_' + row_counter_hdn + '_' + count + '').val(ans);
                            }
                            hdn_flag = 1;
                            break;
                        }
                    }
                    if (hdn_flag == 0) {
                        if (new_json[i].type == 20) {
                            var row_value = new_json[i].ans[0];
                            var row_id = new_json[i].ans[1];
                            $('#txt_add_row_' + btn_NewInv_Counter + '_' + row_counter_hdn + '_' + count + '').text(row_value);
                            $('#txt_add_row_' + btn_NewInv_Counter + '_' + row_counter_hdn + '_' + count + '').attr('title', row_id);
                        } else if (new_json[i].type == 26 || new_json[i].type == '8') {
                            var ans = new_json[i].ans[0];
                            $('#txt_add_row_' + btn_NewInv_Counter + '_' + row_counter_hdn + '_' + count + '').text(ans);
                        }
                        else {
                            var ans = new_json[i].ans;

                            var listview_prefix = json_data[count].prefix;
                            if (listview_prefix == "" || listview_prefix == null || listview_prefix == undefined) {
                                listview_prefix = '';
                            }
                            else {
                                ans = listview_prefix + ' ' + ans;
                            }

                            var listview_postfix = json_data[count].postfix;
                            if (listview_postfix == "" || listview_postfix == null || listview_postfix == undefined) {
                                listview_postfix = '';
                            }
                            else {
                                ans = ans + ' ' + listview_postfix;
                            }

                            $('#txt_add_row_' + btn_NewInv_Counter + '_' + row_counter_hdn + '_' + count + '').text(ans);
                        }

                    }
                }
                count++;
            }
        }
        var json_ans_new = JSON.stringify(new_json);
        $('#btn_edit_td_' + btn_NewInv_Counter + '_' + row_counter_hdn + '').attr("alt", json_ans_new);

        $("#div_inv_form").empty();
        // ckeck_mandatory();
        ckeck_mandatory(inv_Calc_goto);
        popup_items_hide_type22(0);
    } catch (e) {
        alert1(e + "_display_edit_value_to_table");
    }
    return false;
}


//var type22_filled_json_dependency = [];

function display_edit_value_to_table_with_dependency(json, inv_test) {
    try {
        //type22_filled_json_dependency = json;
        var display_form = 0;
        //var btn_NewInv_Counter = inv_Calc_new_array[inv_test];                //commented coz incorrect btn_NewInv_Counter found when opens customer form from taskform and both have a type22 [20052021]
        var btn_NewInv_Counter = type22_new_id;
        inv_test = type22_new_id;

        // var btn_NewInv_Counter = inv_Calc_new;
        var valid_add_row = 0;
        var add_row = '';
        var json_data = $("#hdn_jsondata_" + btn_NewInv_Counter + "").val();
        json_data = itemObj._checkStrObj(json_data);  		// check_item

        var num_row = json_data.length;
        // row_counter++;

        //var row_counter = $("#hdn_inv_row_counter_" + btn_NewInv_Counter + "").val();
        //row_counter++;

        var row_counter = $('#hdn_edit_row_' + btn_NewInv_Counter + '').val();

        add_row += '<li class="swipeout" id="tr_row_for_delete_' + btn_NewInv_Counter + '_' + row_counter + '" it_id="' + row_counter + '" style="padding-bottom: 5px; border-radius: 0px; list-style-type:none; width:100%" ><hr style="border:1px solid #ccc; margin-top: 0px;"><div style="padding: 0 5px !important;">';
        var flag_value = 1;
        var item_id_1 = storage.getItem('img_id_type22');

        var param = "return popup_search_items_show_type22('" + item_id_1 + "', '" + inv_test + "', '" + row_counter + "', '" + flag_value + "', '')";
        var param_delete = "delete_row_from_table('" + item_id_1 + "', '" + inv_test + "', '" + row_counter + "', '" + flag_value + "', '')";

        if (form_flag == 2) {
            param = "";
            if (form_flag == 3) {
                var param = "return popup_search_items_show_type22('" + item_id_1 + "', '" + inv_test + "', '" + row_counter + "', '" + flag_value + "', '')";
                var param_delete = "delete_row_from_table('" + item_id_1 + "', '" + inv_test + "', '" + row_counter + "', '" + flag_value + "', '')";
            }
        }

        var que_id_json = [];
        for (var q = 0; q < num_row; q++) {
            var display = json_data[q].display;
            var res_dup = json_data[q].res_dup;
            if (display == "1" || res_dup == 'true') { // hide column / restric duplicate
                if (json_data[q].type[0].type == 5) {
                    var que_id_display = json_data[q].type[1].que_id;
                    var value_display = json_data[q].type[1].value;
                }
                else {
                    var que_id_display = json_data[q].type[0].que_id;
                    var value_display = json_data[q].type[0].value;
                }
                que_id_json.push({
                    "que_id_display": que_id_display,
                    "value_display": value_display,
                    "display": display,
                    "res_dup": res_dup
                });
            }
        }

        var hide_blank = $("#hdn_hide_blank_" + btn_NewInv_Counter + "").val();
        var count = 0, dup_found = 0, dup_column;
        var cn = 0;// for column name
        var display_row = 0;// for odd & even row

        add_row += '<div class="readmore">';
        add_row += '<table class="swipeout-content" style="width: 100%;vertical-align: middle;">';

        var listview_label = $("#hdn_listview_label_" + btn_NewInv_Counter + "").val();    //type 22 listview UI (it displays with heading or not)
        if (listview_label == "false") {
            //New UI with invoice calculation
            for (i = 0; i < json.length; i++) {
                var answer = json[i].ans;
                if (hide_blank == 'true' && (answer == '' || answer == null || answer == undefined)) {
                    // hide blank fields
                    if (json[i].type != '5') { // if label it wiil not append
                        //if sum=1 and dependency with hidden field in listview
                        count++;
                    }
                }
                else {
                    if (json[i].type != '5') { // if label it wiil not append
                        if (json[i].type == '20') {
                            var value = json[i].ans[0];
                            var type20_id = json[i].ans[1];
                        }
                        else if (json[i].type == '7' || json[i].type == '9' || json[i].type == '8') {
                            var value = json[i].ans[0];
                        } else {
                            var value = json[i].ans;
                        }
                        if (value == '' || value == null || value == undefined) {
                            value = '';
                        }

                        //var column_name = json[i].prop[0].name;
                        var column_name = json_data[cn].name;

                        for (var p = 0; p < que_id_json.length; p++) {
                            if (que_id_json[p].que_id_display == json[i].que_id) {
                                if (json[i].type == '20') {
                                    add_row += "<tr><td colspan=2><input type='hidden' title='" + type20_id + "' id='hdn_hide_pass_value_" + btn_NewInv_Counter + '_' + row_counter + '_' + count + "' value=" + value + "></td></tr>";
                                    break;
                                } else {
                                    var hide_value = json[i].ans;
                                    add_row += "<tr><td colspan=2><input type='hidden' id='hdn_hide_pass_value_" + btn_NewInv_Counter + '_' + row_counter + '_' + count + "' value=" + hide_value + "></td></tr>";
                                    break;
                                }
                            }
                        }
                        var view_equation = json_data[cn].view_equation;
                        if (view_equation == "" || view_equation == undefined || view_equation == null) {
                            view_equation = "true";
                        }

                        var prev_align;
                        var align = json_data[cn].align;
                        if (align == "" || align == undefined || align == null) {
                            align = "left"
                        }

                        if (align == "left") {
                            var text_align = 'text-align: left;';
                        }
                        else {
                            var text_align = 'text-align: right;';
                        }

                        if (cn < num_row - 1) {
                            var next_align = json_data[cn + 1].align;
                        }
                        else {
                            var next_align = "";        //for last row
                        }

                        var equation_exist = json_data[count].equation;

                        if (equation_exist == "" || equation_exist == null || equation_exist == undefined) {
                            if (next_align == "left" || align == "left") {
                                add_row += '<tr>';
                            }
                        }
                        else {
                            if (view_equation == "true") {
                                add_row += '<tr>';
                            }
                        }

                        //if ((align == "right" && next_align == "right") || (align == "right" && cn == (num_row - 1))) {
                        //if (align == "right" && next_align == "right") {                  //for airspan
                        //    add_row += '<tr><td></td>';
                        //}
                        if ((align == "right" && next_align == "right") || (align == "right" && prev_align == "right")) {
                            add_row += '<tr><td></td>';
                        }

                        var listview_prefix = json_data[cn].prefix;
                        if (listview_prefix == "" || listview_prefix == null || listview_prefix == undefined) {
                            listview_prefix = '';
                        }
                        else {
                            value = listview_prefix + ' ' + value;
                        }

                        var listview_postfix = json_data[cn].postfix;
                        if (listview_postfix == "" || listview_postfix == null || listview_postfix == undefined) {
                            listview_postfix = '';
                        }
                        else {
                            value = value + ' ' + listview_postfix;
                        }

                        var eq_ans_str = '';
                        if (json[i].type == '7' || json[i].type == '9' || json[i].type == '11') {
                            add_row += "<td style='" + text_align + "'><img  id='txt_add_row_" + btn_NewInv_Counter + '_' + row_counter + "_" + count + "'src='" + value
                                + "' style='vertical-align:middle;margin-left:10px; width:50px; height:50px; border-radius: 7px' /'></td>";
                        } else if (json[i].type == '20') {
                            add_row += "<td pre='" + listview_prefix + "' post='" + listview_postfix + "' title='" + type20_id + "' id='txt_add_row_" + btn_NewInv_Counter + '_' + row_counter + "_" + count
                                + "' style='" + text_align + "word-break: break-all; margin-top:8px; font-size:11pt; margin-left:10px;vertical-align: middle ; width:45%;'>"
                                + value + "</td>";
                        } else {

                            if (equation_exist == "" || equation_exist == null || equation_exist == undefined) {
                                add_row += '<td pre="' + listview_prefix + '" post="' + listview_postfix + '" id="txt_add_row_' + btn_NewInv_Counter + '_' + row_counter + '_' + count + '" style="' + text_align + 'word-break: break-all; margin-top:8px; font-size:11pt; margin-left:10px;vertical-align: middle ; width:45%;">' + value + '</td>';
                                if (align == "left" && (next_align == "left" || next_align == '' || next_align == null || next_align == undefined)) {
                                    add_row += '<td></td>';
                                }
                            }
                            else {
                                var eq_ans_str = '';
                                for (var z = 0; z < equation_exist.length; z++) {
                                    var eq_val = equation_exist[z];

                                    if (eq_val == "+" || eq_val == "-" || eq_val == "*" || eq_val == "/" || eq_val == "(" || eq_val == ")" || eq_val == "$100") {
                                        eq_ans_str += ' ' + eq_val + ' ';
                                    }
                                    else {
                                        var ans_index = (parseInt(eq_val) * 2) - 1;
                                        eq_ans_str += json[ans_index].ans[0];
                                    }
                                }
                                if (view_equation == "true") {
                                    //display equation str
                                    add_row += '<td style="font-size:11pt; margin-left:10px; width:50%">' + eq_ans_str + '</td>';
                                    add_row += '<td pre="' + listview_prefix + '" post="' + listview_postfix + '" id="txt_add_row_' + btn_NewInv_Counter + '_' + row_counter + '_' + count + '" style="word-break: break-all; font-size:11pt; margin-left:10px; text-align: right; vertical-align: middle ; width:45%;">' + value + '</td>';
                                }
                                else {
                                    //not display equation str
                                    //add_row += '<td style="font-size:11pt; margin-left:10px; width:50%"></td>';
                                    add_row += '<td pre="' + listview_prefix + '" post="' + listview_postfix + '" id="txt_add_row_' + btn_NewInv_Counter + '_' + row_counter + '_' + count + '" style="' + text_align + 'word-break: break-all; font-size:11pt; margin-left:10px; vertical-align: middle ; width:45%;">' + value + '</td>';
                                }
                            }

                        }

                        //if (next_align == "left" || next_align == '' || next_align == null || next_align == undefined) {
                        //    add_row += '</tr>';
                        //}

                        if (equation_exist == "" || equation_exist == null || equation_exist == undefined) {
                            if (align == "right" || next_align == "left" || next_align == '' || next_align == null || next_align == undefined) {
                                add_row += '</tr>';
                            }
                        }
                        else {
                            if (view_equation == "true") {
                                add_row += '</tr>';
                            }
                        }

                        prev_align = align;


                        if (json_data[count].display == "0") {
                            display_row++;
                        }
                        count++;
                        cn++;// for display column name
                    }
                }
            }
        }
        else {
            //default UI without invoice calculation
            for (i = 0; i < json.length; i++) {
                var answer = json[i].ans;
                if (hide_blank == 'true' && (answer == '' || answer == null || answer == undefined)) {
                    // hide blank fields
                    if (json[i].type != '5') { // if label it wiil not append
                        //if sum=1 and dependency with hidden field in listview
                        count++;
                    }
                }
                else {
                    if (json[i].type != '5') { // if label it wiil not append
                        if (json[i].type == '20') {
                            var value = json[i].ans[0];
                            var type20_id = json[i].ans[1];
                        }
                        else if (json[i].type == '7' || json[i].type == '9' || json[i].type == '8') {
                            var value = json[i].ans[0];
                        } else {
                            var value = json[i].ans;
                        }
                        var column_name = json_data[cn].name;
                        //var column_name = json[i].prop[0].name;

                        if (value == "" || value == null || value == undefined) { }
                        else {
                            for (var p = 0; p < que_id_json.length; p++) {
                                if (que_id_json[p].que_id_display == json[i].que_id) {
                                    var res_dup = que_id_json[p].res_dup;
                                    var display = que_id_json[p].display;
                                    if (res_dup == 'true') {
                                        //var theTbl = document.getElementById('tbl_row_data_' + btn_NewInv_Counter + '');

                                        var tbl = '#div_list_display_' + btn_NewInv_Counter;
                                        var tbl_tr = $(tbl).find('table.swipeout-content').find('tr');

                                        if (tbl_tr.length > 0) {
                                            for (var j = 0; j < tbl_tr.length; j++) {
                                                //var tbl_tr_id = tbl_tr[j].id;
                                                var inner_td = $(tbl_tr[j]).find(".type22-list-item-ans");
                                                var cell_value = $(inner_td).text();
                                                if (value == cell_value) {
                                                    dup_column = que_id_json[p].value_display[0];
                                                    dup_found++;
                                                    break;
                                                }
                                            }
                                        }
                                    }

                                    if (display == '1') {
                                        if (json[i].type == '20') {
                                            add_row += "<tr><td colspan=2><input type='hidden' title='" + type20_id + "' id='hdn_hide_pass_value_" + btn_NewInv_Counter + '_' + row_counter + '_' + count + "' value=" + value + "></td></tr>";
                                            break;
                                        } else {
                                            var hide_value = json[i].ans;
                                            add_row += "<tr><td colspan=2><input type='hidden' id='hdn_hide_pass_value_" + btn_NewInv_Counter + '_' + row_counter + '_' + count + "' value=" + hide_value + "></td></tr>";
                                            break;
                                        }
                                    }
                                }
                            }
                        }

                        //if (display_row % 2 == 0) {} 
                        add_row += '<tr>';

                        add_row += '<td class="type22-list-item-label"><span class="list-ans" onclick="toggle_hidden_ans_data(this)">' + column_name + '</span></td>';

                        if (json[i].type == '7' || json[i].type == '9' || json[i].type == '11') {
                            //add_row += '<td style="word-wrap: break-word; font-size:11pt; font-weight:bold; margin-left:5px; width:45%;">' + column_name + '</td>';
                            if (F7_device == 'ios') {
                                //====photo thumbnail issue for iOS after cordove plugin updation [03062025]
                                var iosDirectoryPath = localStorage.getItem('iosDirectoryPath');
                                var localFile = iosDirectoryPath + value;
                                value = window.WkWebView.convertFilePath(localFile);
                            }

                            add_row += "<td><img id='txt_add_row_" + btn_NewInv_Counter + '_' + row_counter + "_" + count + "'src='" + value + "'  class='type22-list-item-img' /'></td>";
                        } else if (json[i].type == '20') {
                            //add_row += '<td style="word-wrap: break-word; margin-top:8px; font-size:11pt; font-weight:bold; margin-left:5px; width:45%;">' + column_name + '</td>';
                            add_row += "<td title='" + type20_id + "' id='txt_add_row_" + btn_NewInv_Counter + '_' + row_counter + "_" + count + "' class='type22-list-item-ans'><span class='list-ans' onclick='toggle_hidden_ans_data(this)'>"
                                + value + "</td>";
                        } else {
                            //add_row += '<td style="word-wrap: break-word; margin-top:8px; font-size:11pt; font-weight:bold; margin-left:5px; width:45%;">' + column_name + '</td>';
                            add_row += '<td id="txt_add_row_' + btn_NewInv_Counter + '_' + row_counter + '_' + count + '" class="type22-list-item-ans"><span class="list-ans" onclick="toggle_hidden_ans_data(this)">' + value + '</span></td>';
                        }

                        add_row += '</tr>';


                        if (json_data[count].display == "0") {
                            display_row++;
                        }
                        count++;
                        cn++;// for display column name
                    }
                }
            }
        }
        add_row += "</table>";

        add_row += '<span class="readmore-link" onclick="show_more_task_data(this);event.cancelBubble=true;" style="background-image: linear-gradient(to bottom, transparent, white);display:none;"><div class="showmore-box">Show More <i class="fa fa-angle-down"></i></div></span>';
        add_row += '</div>';

        //add_row += '<div class="swipeout-actions-right" style="right: -5% !important;">';
        //add_row += '<a id="btn_edit_td_' + btn_NewInv_Counter + '_' + row_counter + '"  onclick="' + param + '" style="transform: translate3d(0px, 0px, 0px);">Edit</a><input type="hidden" id="hdn_tr_delete_' + btn_NewInv_Counter + '_' + row_counter + '" value="0"/>';
        //add_row += '<a id="btn_delete_td_' + btn_NewInv_Counter + '_' + row_counter + '"  onclick="' + param_delete + '" style="background: #f44336; transform: translate3d(-84px, 0px, 0px);">Delete</a>';
        //add_row += '</div>';

        var edit_button = $("#hdn_btn_congfiure_" + btn_NewInv_Counter + "").attr('edit_button');
        var delete_button = $("#hdn_btn_congfiure_" + btn_NewInv_Counter + "").attr('delete_button');

        add_row += '<div class="swipeout-actions-right" style="right: -5% !important;">';

        if (edit_button == "false") {
            add_row += '<input type="hidden" id="btn_edit_td_' + btn_NewInv_Counter + '_' + row_counter + '">';
        }
        else {
            add_row += '<a id="btn_edit_td_' + btn_NewInv_Counter + '_' + row_counter + '"  onclick="' + param + '" style="transform: translate3d(0px, 0px, 0px);">Edit</a><input type="hidden" id="hdn_tr_delete_' + btn_NewInv_Counter + '_' + row_counter + '" value="0"/>';
        }

        if (delete_button == "false") { }
        else {
            //add_row += '<a id="btn_delete_td_' + btn_NewInv_Counter + '_' + row_counter + '"  onclick="' + param_delete + '" style="background: #f44336; transform: translate3d(-84px, 0px, 0px);">Delete</a>';
            add_row += '<a id="btn_delete_td_' + btn_NewInv_Counter + '_' + row_counter + '"  onclick="' + param_delete + '" style="background: #f44336;">Delete</a>';
        }
        add_row += '</div>';

        add_row += '</div></li>';

        //var li_index = parseInt(row_counter) - 1;
        //$('#div_list_display_' + btn_NewInv_Counter + ' li').eq(li_index).html(add_row);

        if (dup_found == 0) {
            $('#tr_row_for_delete_' + btn_NewInv_Counter + '_' + row_counter + '').html(add_row);
        }
        else {
            alert("You can't insert duplicate value for '" + dup_column + "' !");
            row_counter--;
            $("#hdn_inv_row_counter_" + btn_NewInv_Counter + "").val(row_counter);
        }

        check_n_apply_show_more_for_invoice_items(btn_NewInv_Counter);

        var json_ans_new = JSON.stringify(json);

        //hide element where display=1
        for (var h = 0; h < json_data.length; h++) {
            var display = json_data[h].display;
            if (display == "1") {
                $('#txt_add_row_' + btn_NewInv_Counter + '_' + row_counter + '_' + h + '').parent().hide();
            }
        }

        $('#btn_edit_td_' + btn_NewInv_Counter + '_' + row_counter + '').attr("alt", json_ans_new);

        $("#div_inv_form").empty();
        // ckeck_mandatory();
        ckeck_mandatory(inv_test);
        popup_items_hide_type22(0);

    } catch (e) {
        alert1(e + "display_edit_value_to_table_with_dependency");
    }
}


//-------------------------------------------------------- LIST VIEW -------------------------------------------------
// create basic ui on blank 22 in form with listview
function create_listview_with_item(btn_NewInv_Counter) {
    try {
        var json_data1 = $("#hdn_jsondata_" + btn_NewInv_Counter + "").val();
        $("#hdn_inv_row_counter_" + btn_NewInv_Counter + "").val(0);

        var row_counter = 0;
        var validation = 0;
        var json_data = itemObj._checkStrObj(json_data1);  		// check_item
        var num_row = json_data.length;
        var display_form = 0;
        var list_div_data = "<ul id='ul_outer_" + btn_NewInv_Counter + "'style='width:100%; background-color: white; text-align: left;'><div id='div_list_display_"
            + btn_NewInv_Counter + "' style='width:100%;'></div>";
        list_div_data += "<div id='div_list_display_sum_" + btn_NewInv_Counter + "' style='width:100%;'></div>";

        var sum_div_data = '';
        var type22_json_len = $("#hdn_type22_json_len_" + btn_NewInv_Counter + "").val();
        if (type22_json_len == 1 && control_type == '20') { }
        else {
            sum_div_data += '<hr style="border:1px solid #ccc;margin:10px 0;">';
        }

        sum_div_data += '<li style="padding-top:5px;border-radius:0px;list-style-type:none; width:100%;" ><div style="position:relative; height:auto;">';
        var sum_count = 0;

        var control_type = get_search_ctrl_type(json_data);

        for (i = 0; i < num_row; i++) {
            var th_column_id = json_data[i].id;
            var th_name = json_data[i].name;

            var ddl_datatype = json_data[i].type;
            var ddl_auto = json_data[i].auto;
            var madatory = json_data[i].mandatory;
            var td_sum = json_data[i].sum;
            var ddl_equation = json_data[i].equation;
            var sum_class = json_data[i].sum_class;
            var display_sum1 = json_data[i].display;

            if (madatory == 1) {
                var th_name_madatory = th_name;
                mandatory_array.push({
                    'madatory_id': i,
                    'th_name_madatory': th_name_madatory
                });
            }

            if (display_sum1 == '1') {
                var inv_dis = "display:none;"
            }
            else {
                var inv_dis = "";
            }

            if (td_sum > 0) {
                //NEW UI
                var bgcolor = json_data[i].bgcolor;
                if (bgcolor == undefined || bgcolor == null || bgcolor == "") {
                    var color = 'black';
                    var back_color = 'white';
                }
                else {
                    var color = 'white';
                    var back_color = bgcolor;
                }

                var listview_prefix = json_data[i].prefix;
                if (listview_prefix == "" || listview_prefix == null || listview_prefix == undefined) {
                    listview_prefix = '';
                }

                var listview_postfix = json_data[i].postfix;
                if (listview_postfix == "" || listview_postfix == null || listview_postfix == undefined) {
                    listview_postfix = '';
                }

                sum_div_data += '<div style="background-color:' + back_color + ';color:' + color + ';padding:5px;' + inv_dis + '"><table style="width: 100%;vertical-align: middle;">';
                sum_div_data += '<tr><td class="type22-sum-header"><span class="list-ans" onclick="toggle_hidden_ans_data(this)">' + th_name + '</span></td>';
                sum_div_data += "<td id='sum_" + btn_NewInv_Counter + "_" + i + "' class='type22-sum-ans " + sum_class + "'><span class='list-ans' onclick='toggle_hidden_ans_data(this)'><b>" + listview_prefix + "</b> 0 <b>" + listview_postfix + "</b></span></td></tr></table></div>";

                var sum_madatory = madatory;
                sum_array.push({
                    'sum_column_store': i,
                    'sum_madatory': sum_madatory
                });
                sum_count++;
            }
        }

        sum_div_data += "</div>";
        if (type22_json_len == 1 && control_type == '20') { }
        else {
            sum_div_data += "<hr style='border:1px solid #ccc'>";
        }
        sum_div_data += "</li>";

        list_div_data += "</ul>";

        $("#div_display_" + btn_NewInv_Counter + "").append(list_div_data);
        $("#div_list_display_sum_" + btn_NewInv_Counter + "").append(sum_div_data);

        if (type22_json_len == 1 && control_type == '20') {
            setTimeout(function () {
                $("#btn_add_row_" + btn_NewInv_Counter + "").trigger('onclick');                 //single control UI changes [19112021]
            }, 1000);
        }
    } catch (e) {
        alert1(e + "_create_listview_with_item");
    }
    return false;
}

// open popup on add row button listview
function add_row_with_listview_item(btn_NewInv_Counter, read_count_length) {
    try {
        var json_data = $("#hdn_jsondata_" + btn_NewInv_Counter + "").val();
        json_data = itemObj._checkStrObj(json_data);  		// check_item
        var num_row = json_data.length;
        // row_counter++;

        var data = [];
        for (i = 0; i < num_row; i++) {
            var column_name = json_data[i].name;
            var type_Array = json_data[i].type;
            for (j = 0; j < type_Array.length; j++) {
                data.push(type_Array[j]);
            }
        }

        var check_type = JSON.parse(storage.getItem('check_type')); // for checksheet id

        read_dynamic_checksheet(read_count_length, check_type, "", data, "", 1, 0);
    } catch (e) {
        alert1(e + "_add_row_with_listview_item");
    }
    return false;
}

function add_row_to_listview_by_popup(inv_test, json) {
    try {
        var display_form = 0;
        //var btn_NewInv_Counter = inv_Calc_new_array[inv_test];                //commented coz incorrect btn_NewInv_Counter found when opens customer form from taskform and both have a type22 [20052021]
        var btn_NewInv_Counter = type22_new_id;
        inv_test = type22_new_id;

        // var btn_NewInv_Counter = inv_Calc_new;
        var valid_add_row = 0;
        var add_row = '';
        var json_data = $("#hdn_jsondata_" + btn_NewInv_Counter + "").val();
        json_data = itemObj._checkStrObj(json_data);  		// check_item

        var num_row = json_data.length;
        // row_counter++;

        var row_counter = $("#hdn_inv_row_counter_" + btn_NewInv_Counter + "").val();
        row_counter++;
        $("#hdn_inv_row_counter_" + btn_NewInv_Counter + "").val(row_counter);
        var flag_value = 1;
        var item_id_1 = storage.getItem('img_id_type22');

        var type22_json_len = $("#hdn_type22_json_len_" + btn_NewInv_Counter + "").val();
        var type22_snglCntrl_type = $("#hdn_type22_json_len_" + btn_NewInv_Counter + "").attr('type22_snglCntrl_type');
        if (type22_json_len == 1 && type22_snglCntrl_type == '20') { }
        else {
            add_row += '<li class="swipeout" id="tr_row_for_delete_' + btn_NewInv_Counter + '_' + row_counter + '" it_id="' + row_counter + '" style="padding-bottom: 5px; border-radius: 0px; list-style-type:none; width:100%" ><hr style="border:1px solid #ccc; margin-top: 0px;"><div style="padding: 0 5px !important;">';

            var param = "return popup_search_items_show_type22('" + item_id_1 + "', '" + inv_test + "', '" + row_counter + "', '" + flag_value + "', '')";
            var param_delete = "delete_row_from_table('" + item_id_1 + "', '" + inv_test + "', '" + row_counter + "', '" + flag_value + "', '')";

            if (form_flag == 2) {
                param = "";
                if (form_flag == 3) {
                    param = "return popup_search_items_show_type22('" + item_id_1 + "', '" + inv_test + "', '" + row_counter + "', '" + flag_value + "', '')";
                    param_delete = "delete_row_from_table('" + item_id_1 + "', '" + inv_test + "', '" + row_counter + "', '" + flag_value + "', '')";
                }
            }
        }

        var que_id_json = [];
        for (var q = 0; q < num_row; q++) {
            var display = json_data[q].display;
            var res_dup = json_data[q].res_dup;
            if (display == "1" || res_dup == 'true') { // hide column / restric duplicate
                if (json_data[q].type[0].type == 5) {
                    var que_id_display = json_data[q].type[1].que_id;
                    var value_display = json_data[q].type[1].value;
                }
                else {
                    var que_id_display = json_data[q].type[0].que_id;
                    var value_display = json_data[q].type[0].value;
                }
                que_id_json.push({
                    "que_id_display": que_id_display,
                    "value_display": value_display,
                    "display": display,
                    "res_dup": res_dup
                });
            }
        }

        //add_row += "<i class='fa fa-remove' id='btn_delete_td_" + btn_NewInv_Counter + '_' + row_counter + "'  onclick='" + param_delete
        //        + "' style='margin:0px 10px 7px 10px; float:right'></i>";
        //add_row += "<i class='fa fa-pencil' id='btn_edit_td_" + btn_NewInv_Counter + '_' + row_counter + "'  onclick='" + param
        //        + "' style='margin:0px 5px 7px 10px; float:right'></i><input type='hidden' id='hdn_tr_delete_"
        //        + btn_NewInv_Counter + "_" + row_counter + " value='0'><br></div>";

        var hide_blank = $("#hdn_hide_blank_" + btn_NewInv_Counter + "").val();
        var count = 0, dup_found = 0, dup_column;;
        var cn = 0;// for column name                                      
        var display_row = 0;// for odd & even row

        if (type22_json_len == 1 && type22_snglCntrl_type == '20') {
            add_row += '<li id="tr_row_for_delete_' + btn_NewInv_Counter + '_' + row_counter + '" it_id="' + row_counter + '" style="padding-bottom: 5px; border-radius: 0px; list-style-type:none; width:100%;display:inline;"><div style="padding: 0 5px !important;display:inline;">';

            add_row += "<input type='hidden' id='btn_edit_td_" + btn_NewInv_Counter + "_" + row_counter + "'>";
            param_delete = 'delete_row_from_table("' + item_id_1 + '","' + inv_test + '","' + row_counter + '","' + flag_value + '","")';

            for (i = 0; i < json.length; i++) {
                var cntrl_type = json[i].type;
                var answer = json[i].ans;
                if (hide_blank == 'true' && (answer == '' || answer == null || answer == undefined)) {
                    // hide blank fields
                    if (json[i].type != '5') { // if label it wiil not append
                        //if sum=1 and dependency with hidden field in listview
                        count++;
                    }
                }
                else {
                    if (json[i].type != '5') { // if label it wiil not append
                        if (json[i].type == '20') {
                            var value = json[i].ans[0];
                            var type20_id = json[i].ans[1];
                        }
                        else if (json[i].type == '7' || json[i].type == '9' || json[i].type == '8') {
                            var value = json[i].ans[0];
                        } else {
                            var value = json[i].ans;
                        }

                        if (value == '' || value == null || value == undefined) {
                            value = '';
                        }
                        var column_name = json_data[cn].name;
                        //var column_name = json[i].prop[0].name;                       //commented as removed prop form ans JSON [16062021]


                        if (cntrl_type == '7' || cntrl_type == '9' || cntrl_type == '11') {
                            add_row += "<span class='badge badge-secondary' style='display:inline-block;padding:3px;margin-top:3px;'>";
                            if (value == "" || value == null || value == undefined) {
                                add_row += "<img id='txt_add_row_" + btn_NewInv_Counter + "_" + row_counter + "_" + count + "' src='" + value + "' onerror='$(this).hide()' class='type22-list-item-img' /'></td>";
                            }
                            else {
                                if (F7_device == 'ios') {
                                    //====photo thumbnail issue for iOS after cordove plugin updation [03062025]
                                    var iosDirectoryPath = localStorage.getItem('iosDirectoryPath');
                                    var localFile = iosDirectoryPath + value;
                                    value = window.WkWebView.convertFilePath(localFile);
                                }

                                add_row += "<img id='txt_add_row_" + btn_NewInv_Counter + "_" + row_counter + "_" + count + "' src='" + value + "' class='type22-list-item-img' /'></td>";
                            }
                            add_row += "<span style=='vertical-align:middle; margin-left:5px;display:inline-block;'><i class='fa fa-times fa-2x mr-0' onclick='" + param_delete + "'></i></span>";
                            add_row += "</span>";
                        } else if (cntrl_type == '20') {
                            add_row += "<span class='badge badge-secondary' style='display:inline-block;padding:3px;margin-top:3px;'><label title='" + type20_id + "' id='txt_add_row_" + btn_NewInv_Counter + '_' + row_counter + '_' + count + "' disabled style='vertical-align:middle;font-size:12px;'>" + value + "</label><span style='vertical-align:middle; margin-left:5px;'><i class='fa fa-times fa-2x mr-0' onclick='" + param_delete + "'></i></span></span>";
                        } else {
                            add_row += "<span class='badge badge-secondary' style='display:inline-block;padding:3px;margin-top:3px;'><label title='" + type20_id + "' id='txt_add_row_" + btn_NewInv_Counter + '_' + row_counter + '_' + count + "' disabled style='vertical-align:middle;font-size:12px;'>" + value[0] + "</label><span style='vertical-align:middle; margin-left:5px;'><i class='fa fa-times fa-2x mr-0' onclick='" + param_delete + "'></i></span></span>";
                        }

                        if (json_data[count].display == "0") {
                            display_row++;
                        }
                        count++;
                        cn++;// for display column name
                    }
                }
            }
        }
        else {
            add_row += '<div class="readmore">';
            add_row += '<table class="swipeout-content" style="width: 100%;vertical-align: middle;">';

            var listview_label = $("#hdn_listview_label_" + btn_NewInv_Counter + "").val();    //type 22 listview UI (it displays with heading or not)
            if (listview_label == "false") {
                //New UI with invoice calculation
                for (i = 0; i < json.length; i++) {
                    var answer = json[i].ans;
                    if (hide_blank == 'true' && (answer == '' || answer == null || answer == undefined)) {
                        // hide blank fields
                        if (json[i].type != '5') { // if label it wiil not append
                            //if sum=1 and dependency with hidden field in listview
                            count++;
                        }
                    }
                    else {
                        if (json[i].type != '5') { // if label it wiil not append
                            if (json[i].type == '20') {
                                var value = json[i].ans[0];
                                var type20_id = json[i].ans[1];
                            }
                            else if (json[i].type == '7' || json[i].type == '9' || json[i].type == '8') {
                                var value = json[i].ans[0];
                            } else {
                                var value = json[i].ans;
                            }

                            if (value == '' || value == null || value == undefined) {
                                value = '';
                            }
                            var column_name = json_data[cn].name;
                            //var column_name = json[i].prop[0].name;                       //commented as removed prop form ans JSON [16062021]

                            for (var p = 0; p < que_id_json.length; p++) {
                                if (que_id_json[p].que_id_display == json[i].que_id) {
                                    if (json[i].type == '20') {
                                        add_row += "<tr><td colspan=2><input type='hidden' title='" + type20_id + "' id='hdn_hide_pass_value_" + btn_NewInv_Counter + '_' + row_counter + '_' + count + "' value=" + value + "></td></tr>";
                                        break;
                                    }
                                    else {
                                        var hide_value = json[i].ans;
                                        add_row += "<tr><td colspan=2><input type='hidden' id='hdn_hide_pass_value_" + btn_NewInv_Counter + '_' + row_counter + '_' + count + "' value=" + hide_value + "></td></tr>";
                                        break;
                                    }

                                }
                            }

                            var view_equation = json_data[cn].view_equation;
                            if (view_equation == "" || view_equation == undefined || view_equation == null) {
                                view_equation = "true";
                            }

                            var prev_align;
                            var align = json_data[cn].align;
                            if (align == "" || align == undefined || align == null) {
                                align = "left"
                            }

                            if (align == "left") {
                                var text_align = 'text-align: left;';
                            }
                            else {
                                var text_align = 'text-align: right;';
                            }

                            if (cn < num_row - 1) {
                                var next_align = json_data[cn + 1].align;
                            }
                            else {
                                var next_align = "";        //for last row
                            }

                            var equation_exist = json_data[count].equation;

                            if (equation_exist == "" || equation_exist == null || equation_exist == undefined) {
                                //if (next_align == "left" || align == "left") {
                                if (align == "left" && next_align == "right") {
                                    add_row += '<tr>';
                                }
                            }
                            else {
                                if (view_equation == "true") {
                                    add_row += '<tr>';
                                }
                            }

                            //if ((align == "right" && next_align == "right") || (align == "right" && cn == (num_row - 1))) {
                            //if (align == "right" && next_align == "right") {                  //for airspan
                            //    add_row += '<tr><td></td>';
                            //}

                            var colspan = "";
                            if ((align == "right" && next_align == "right") || (align == "right" && prev_align == "right") || (align == "right" && next_align == "" && (cn == num_row - 1)) || (align == "left" && (next_align == "" || next_align == "left"))) {
                                //add_row += '<tr><td></td>';
                                add_row += '<tr>';
                                colspan = "2";
                            }

                            var listview_prefix = json_data[cn].prefix;
                            if (listview_prefix == "" || listview_prefix == null || listview_prefix == undefined) {
                                listview_prefix = '';
                            }
                            else {
                                value = listview_prefix + ' ' + value;
                            }

                            var listview_postfix = json_data[cn].postfix;
                            if (listview_postfix == "" || listview_postfix == null || listview_postfix == undefined) {
                                listview_postfix = '';
                            }
                            else {
                                value = value + ' ' + listview_postfix;
                            }

                            var eq_ans_str = '';
                            if (json[i].type == '7' || json[i].type == '9' || json[i].type == '11') {
                                if (F7_device == 'ios') {
                                    //====photo thumbnail issue for iOS after cordove plugin updation [03062025]
                                    var iosDirectoryPath = localStorage.getItem('iosDirectoryPath');
                                    var localFile = iosDirectoryPath + value;
                                    value = window.WkWebView.convertFilePath(localFile);
                                }

                                add_row += "<td colspan='" + colspan + "' style='" + text_align + "'><img  id='txt_add_row_" + btn_NewInv_Counter + '_' + row_counter + "_" + count + "' src='" + value + "' class='type22-list-item-img' /'></td>";
                            } else if (json[i].type == '20') {
                                add_row += "<td colspan='" + colspan + "' pre='" + listview_prefix + "' post='" + listview_postfix + "' title='" + type20_id + "' id='txt_add_row_" + btn_NewInv_Counter + "_" + row_counter + "_" + count + "' style='" + text_align + "' class='type22-list-item-ans'>" + value + "</td>";
                            } else {

                                if (equation_exist == "" || equation_exist == null || equation_exist == undefined) {
                                    if (align == "left" && (next_align == "left" || next_align == '' || next_align == null || next_align == undefined)) {
                                        //add_row += '<td></td>';
                                        colspan = "2";
                                    }
                                    add_row += '<td colspan="' + colspan + '" pre="' + listview_prefix + '" post="' + listview_postfix + '" id="txt_add_row_' + btn_NewInv_Counter + '_' + row_counter + '_' + count + '" style="' + text_align + '" class="type22-list-item-ans">' + value + '</td>';
                                }
                                else {
                                    //var eq_ans_str = '';
                                    //for (var z = 0; z < equation_exist.length; z++) {
                                    //    var eq_val = equation_exist[z];

                                    //    if (eq_val == "+" || eq_val == "-" || eq_val == "*" || eq_val == "/" || eq_val == "(" || eq_val == ")" || eq_val == "$100" || eq_val == "$6") {
                                    //        eq_ans_str += ' ' + eq_val + ' ';
                                    //    }
                                    //    else {
                                    //        var ans_index = (parseInt(eq_val) * 2) - 1;
                                    //        try {
                                    //            // dollar issue $6   (latteys)
                                    //            eq_ans_str += json[ans_index].ans[0];
                                    //        } catch (e) { }
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
                                                var temp_equ_ans = json[value1].ans[0];
                                                temp_equ_ans = parseFloat(temp_equ_ans);
                                                equation += temp_equ_ans;
                                            }
                                        }
                                    }

                                    if (view_equation == "true") {
                                        //display equation str
                                        add_row += '<td class="type22-list-item-ans">' + equation + '</td>';
                                        add_row += '<td pre="' + listview_prefix + '" post="' + listview_postfix + '" id="txt_add_row_' + btn_NewInv_Counter + '_' + row_counter + '_' + count + '" style="text-align: right;" class="type22-list-item-ans">' + value + '</td>';
                                    }
                                    else {
                                        //not display equation str
                                        //add_row += '<td style="font-size:11pt; margin-left:10px; width:50%"></td>';
                                        add_row += '<td colspan="' + colspan + '" pre="' + listview_prefix + '" post="' + listview_postfix + '" id="txt_add_row_' + btn_NewInv_Counter + '_' + row_counter + '_' + count + '" style="' + text_align + '" class="type22-list-item-ans">' + value + '</td>';
                                    }
                                }

                            }

                            if (equation_exist == "" || equation_exist == null || equation_exist == undefined) {
                                if (align == "right" || next_align == "left" || next_align == '' || next_align == null || next_align == undefined) {
                                    add_row += '</tr>';
                                }
                            }
                            else {
                                if (view_equation == "true") {
                                    add_row += '</tr>';
                                }
                            }

                            prev_align = align;

                            if (json_data[count].display == "0") {
                                display_row++;
                            }
                            count++;
                            cn++;// for display column name
                        }
                    }
                }
            }
            else {
                //default UI without invoice calculation
                for (i = 0; i < json.length; i++) {
                    var answer = json[i].ans;
                    if (hide_blank == 'true' && (answer == '' || answer == null || answer == undefined)) {
                        // hide blank fields
                        if (json[i].type != '5') { // if label it wiil not append
                            //if sum=1 and dependency with hidden field in listview
                            count++;
                        }
                    }
                    else {
                        if (json[i].type != '5') { // if label it wiil not append
                            if (json[i].type == '20') {
                                var value = json[i].ans[0];
                                var type20_id = json[i].ans[1];
                            }
                            else if (json[i].type == '7' || json[i].type == '9' || json[i].type == '8') {
                                var value = json[i].ans[0];
                            } else {
                                var value = json[i].ans;
                            }
                            var column_name = json_data[cn].name;
                            //var column_name = json[i].prop[0].name;                       //commented as removed prop form ans JSON [16062021]

                            if (value == "" || value == null || value == undefined) { }
                            else {
                                for (var p = 0; p < que_id_json.length; p++) {
                                    if (que_id_json[p].que_id_display == json[i].que_id) {

                                        // if duplicate found in list view  DV-06072023
                                        var res_dup = que_id_json[p].res_dup;
                                        var display = que_id_json[p].display;
                                        if (res_dup == 'true') {
                                            //var theTbl = document.getElementById('tbl_row_data_' + btn_NewInv_Counter + '');

                                            var tbl = '#div_list_display_' + btn_NewInv_Counter;
                                            var tbl_tr = $(tbl).find('table.swipeout-content').find('tr');

                                            if (tbl_tr.length > 0) {
                                                for (var j = 0; j < tbl_tr.length; j++) {
                                                    //var tbl_tr_id = tbl_tr[j].id;
                                                    var inner_td = $(tbl_tr[j]).find(".type22-list-item-ans");
                                                    var cell_value = $(inner_td).text();
                                                    if (value == cell_value) {
                                                        dup_column = que_id_json[p].value_display[0];
                                                        dup_found++;
                                                        break;
                                                    }
                                                }
                                            }
                                        }

                                        if (display == '1') {
                                            if (json[i].type == '20') {
                                                add_row += "<tr><td colspan=2><input type='hidden' title='" + type20_id + "' id='hdn_hide_pass_value_" + btn_NewInv_Counter + '_' + row_counter + '_' + count + "' value=" + value + "></td></tr>";
                                                break;
                                            } else {
                                                var hide_value = json[i].ans;
                                                add_row += "<tr><td colspan=2><input type='hidden' id='hdn_hide_pass_value_" + btn_NewInv_Counter + '_' + row_counter + '_' + count + "' value=" + hide_value + "></td></tr>";
                                                break;
                                            }
                                        }
                                    }
                                }
                            }

                            //if (display_row % 2 == 0) {} 
                            add_row += '<tr>';

                            add_row += '<td class="type22-list-item-label"><span class="list-ans" onclick="toggle_hidden_ans_data(this)">' + column_name + '</span></td>';

                            if (json[i].type == '7' || json[i].type == '9' || json[i].type == '11') {
                                //add_row += '<td class="type22-list-item-label"><span class="list-ans" onclick="toggle_hidden_ans_data(this)">' + column_name + '</span></td>';

                                if (value == "" || value == null || value == undefined) {
                                    add_row += '<td id="txt_add_row_' + btn_NewInv_Counter + '_' + row_counter + '_' + count + '"></td>';
                                }
                                else {
                                    if (F7_device == 'ios') {
                                        //====photo thumbnail issue for iOS after cordove plugin updation [03062025]
                                        var iosDirectoryPath = localStorage.getItem('iosDirectoryPath');
                                        var localFile = iosDirectoryPath + value;
                                        value = window.WkWebView.convertFilePath(localFile);
                                    }
                                    add_row += "<td><img id='txt_add_row_" + btn_NewInv_Counter + "_" + row_counter + "_" + count + "' src='" + value + "' class='type22-list-item-img' /'></td>";
                                }

                            } else if (json[i].type == '20') {
                                //add_row += '<td class="type22-list-item-label"><span class="list-ans" onclick="toggle_hidden_ans_data(this)">' + column_name + '</span></td>';
                                add_row += '<td title="' + type20_id + '" id="txt_add_row_' + btn_NewInv_Counter + '_' + row_counter + '_' + count + '" class="type22-list-item-ans"><span class="list-ans" onclick="toggle_hidden_ans_data(this)">' + value + '</span></td>';
                            } else {
                                //add_row += '<td class="type22-list-item-label"><span class="list-ans" onclick="toggle_hidden_ans_data(this)">' + column_name + '</span></td>';
                                add_row += '<td id="txt_add_row_' + btn_NewInv_Counter + '_' + row_counter + '_' + count + '" class="type22-list-item-ans"><span class="list-ans" onclick="toggle_hidden_ans_data(this)">' + value + '</span></td>';
                            }

                            add_row += '</tr>';


                            if (json_data[count].display == "0") {
                                display_row++;
                            }
                            count++;
                            cn++;// for display column name
                        }
                    }
                }
            }
            add_row += "</table>";

            add_row += '<span class="readmore-link" onclick="show_more_task_data(this);event.cancelBubble=true;" style="background-image: linear-gradient(to bottom, transparent, white);display:none;"><div class="showmore-box">Show More <i class="fa fa-angle-down"></i></div></span>';
            add_row += '</div>';

            var edit_button = $("#hdn_btn_congfiure_" + btn_NewInv_Counter + "").attr('edit_button');
            var delete_button = $("#hdn_btn_congfiure_" + btn_NewInv_Counter + "").attr('delete_button');

            add_row += '<div class="swipeout-actions-right" style="right: -5% !important;">';

            if (edit_button == "false") {
                add_row += '<input type="hidden" id="btn_edit_td_' + btn_NewInv_Counter + '_' + row_counter + '">';
            }
            else {
                add_row += '<a id="btn_edit_td_' + btn_NewInv_Counter + '_' + row_counter + '"  onclick="' + param + '" style="transform: translate3d(0px, 0px, 0px);">Edit</a><input type="hidden" id="hdn_tr_delete_' + btn_NewInv_Counter + '_' + row_counter + '" value="0"/>';
            }

            if (delete_button == "false") { }
            else {
                //add_row += '<a id="btn_delete_td_' + btn_NewInv_Counter + '_' + row_counter + '"  onclick="' + param_delete + '" style="background: #f44336; transform: translate3d(-84px, 0px, 0px);">Delete</a>';
                add_row += '<a id="btn_delete_td_' + btn_NewInv_Counter + '_' + row_counter + '"  onclick="' + param_delete + '" style="background: #f44336;">Delete</a>';
            }
            add_row += '</div>';
        }

        //add_row += "<i class='fa fa-remove' id='btn_delete_td_" + btn_NewInv_Counter + '_' + row_counter + "'  onclick='" + param_delete
        //        + "' style='margin:0px 10px 7px 10px; float:right'></i>";
        //add_row += "<i class='fa fa-pencil' id='btn_edit_td_" + btn_NewInv_Counter + '_' + row_counter + "'  onclick='" + param
        //        + "' style='margin:0px 5px 7px 10px; float:right'></i><input type='hidden' id='hdn_tr_delete_"
        //        + btn_NewInv_Counter + "_" + row_counter + " value='0'><br></div>";

        if (dup_found == 0) {
            add_row += '</div></li>';
            $('#div_list_display_' + btn_NewInv_Counter + '').append(add_row);
        }
        else {
            alert("You can't insert duplicate value for '" + dup_column + "' !");
            row_counter--;
            $("#hdn_inv_row_counter_" + btn_NewInv_Counter + "").val(row_counter);
        }

        check_n_apply_show_more_for_invoice_items(btn_NewInv_Counter);

        var json_ans_new = JSON.stringify(json);

        for (var h = 0; h < json_data.length; h++) {
            var display = json_data[h].display;
            if (display == "1") {
                $('#txt_add_row_' + btn_NewInv_Counter + '_' + row_counter + '_' + h + '').parent().hide();
            }
        }

        $('#btn_edit_td_' + btn_NewInv_Counter + '_' + row_counter + '').attr("alt", json_ans_new);
        $("#div_inv_form").empty();// make popup empty
        // ckeck_mandatory();
        ckeck_mandatory(inv_test);
        popup_items_hide_type22(0);

        //Add new record as per config. max_record (For listview) - mk - 01042025
        var max_record = $("#hdn_btn_congfiure_" + btn_NewInv_Counter + "").attr('max_record');
        if (max_record == null || max_record == '' || max_record == undefined) { }
        else {

            if (typeof max_record == "string") {

                // max_record = "<@Q820@>";
                if (max_record.indexOf("@") > -1) {
                    // get max record from above control

                    let ans_text = get_min_max_value_from_class(max_record);
                    if (ans_text == '' || ans_text == null || ans_text == undefined || ans_text == '--- Select Values ---' || ans_text == 'Select Value' || ans_text == '--- Select ---') {
                        alert("Maximum record value is not found!");
                    }
                    else {
                        max_record = ans_text;
                    }
                }

                max_record = parseInt(max_record);
            }

            var li_length = $('#div_list_display_' + btn_NewInv_Counter + ' li[id^=tr_row_for_delete_]:visible').length;
            if (max_record == li_length) {
                $("#btn_add_row_" + btn_NewInv_Counter + "").css('display', 'none');
            }
        }

    } catch (e) {
        alert1(e + "_add_row_to_listview_by_popup");
    }
}

// on click add control from popup
function submit_popup_data(json_inv_temp, btn_NewInv_Counter, form_mode) {
    try {
        auto_click_calc_type = "normal_submit";
        var type22_json_len = $("#hdn_type22_json_len_" + btn_NewInv_Counter + "").val();
        var type22_snglCntrl_type = $("#hdn_type22_json_len_" + btn_NewInv_Counter + "").attr('type22_snglCntrl_type');
        if (type22_json_len == 1 && type22_snglCntrl_type == '20') {
            var json_data = $("#hdn_jsonObj_type22_" + btn_NewInv_Counter + "").val();
            json_data = JSON.parse(json_data);
            jsonObj_type22 = json_data;
        }
        var type22_que_id = $("#hdn_type22_json_len_" + btn_NewInv_Counter + "").attr('type22_que_id');             //type22 single control UI changes [25112021]
        storage.setItem('img_id_type22', type22_que_id);
        glob_type22_flag = "";

        if (form_mode == "readsurvey") {
            return validate_and_submit_surveydata_main(jsonObj_type22, 4, '');
        }
        else {
            return validate_and_submit_surveydata(json_inv_temp, 1, jsonObj_type22);
        }
    } catch (e) {
        alert1(e + "_submit_popup_data");
    }
    return false;
}

// check mandatory value from equation (must be filled)
function ckeck_mandatory(inv_test) {
    try {
        //var btn_NewInv_Counter = inv_Calc_new_array[inv_test];            //commented coz incorrect btn_NewInv_Counter found when opens customer form from taskform and both have a type22 [20052021]
        var btn_NewInv_Counter = type22_new_id;

        // var btn_NewInv_Counter = inv_Calc_new;
        var item_id = storage.getItem('img_id_type22');
        var json_data = $("#hdn_jsondata_" + btn_NewInv_Counter + "").val();
        json_data = itemObj._checkStrObj(json_data);  		// check_item
        var num_row = json_data.length;
        var madatory_counter = 0;
        var c = 0;
        var length = mandatory_array.length;
        get_sum_column(btn_NewInv_Counter);
    } catch (e) {
        alert1(e + "_ckeck_mandatory");
    }
    return false;
}

// make sum and equation and fill final json
function get_sum_column(btn_NewInv_Counter) {
    try {
        var json_data = $("#hdn_jsondata_" + btn_NewInv_Counter + "").val();
        json_data = itemObj._checkStrObj(json_data);  		// check_item
        var num_row = json_data.length;
        var row_counter = $("#hdn_inv_row_counter_" + btn_NewInv_Counter + "").val();

        /*----- equation start------*/
        // column loop
        for (i = 0; i < num_row; i++) {
            var th_column_id = json_data[i].id;
            var th_name = json_data[i].name;
            var ddl_datatype = json_data[i].type;
            var ddl_auto = json_data[i].auto;
            var auto_type_array = json_data[i].auto_value;
            var madatory = json_data[i].mandatory;
            var td_sum = json_data[i].sum;
            var equation = json_data[i].equation;
            var display = json_data[i].display;
            var json_flag = 0;
            var json_equation_parse = json_data[i].equation;

            var display_id = [];
            for (var c = 0; c < num_row; c++) {
                var display_a = json_data[c].display;
                if (display_a == "1") {
                    var id_equation = json_data[c].id;
                    display_id.push(id_equation);
                }
            }

            // if (ddl_auto == "1") {
            // for ( var s = 1; s <= row_counter; s++) {
            // $(
            // "#txt_add_row_" + btn_NewInv_Counter + '_' + s
            // + '_' + i + "").text(s);
            // }
            // }
            // auto increment

            if (ddl_auto == "1") {
                if (auto_type_array.length == "0") { // auto fill in auto increment
                    if (display == "1") { // get value of hide column in equation
                        var del_auto_display1 = 1;
                        for (var s = 1; s <= row_counter; s++) {
                            var delete_auto_tr = $("#tr_row_for_delete_" + btn_NewInv_Counter + "_" + s + "").val();
                            if (delete_auto_tr == 0) {
                                $("#hdn_hide_pass_value_" + btn_NewInv_Counter + '_' + s + '_' + i + "").val(del_auto_display1);
                                del_auto_display1++;
                            }
                        }
                    } else {
                        var del_auto_display1 = 1;
                        for (var s = 1; s <= row_counter; s++) {
                            var delete_auto_tr = $("#tr_row_for_delete_" + btn_NewInv_Counter + "_" + s + "").val();
                            if (delete_auto_tr == 0) {
                                $("#txt_add_row_" + btn_NewInv_Counter + '_' + s + '_' + i + "").text(del_auto_display1);
                                del_auto_display1++;
                            }
                        }
                    }
                }
                else {
                    // auto increment in display column
                    if (display == "1") {
                        var del_auto_display2 = 1;
                        for (var s = 1; s <= row_counter; s++) {
                            var delete_auto_tr1 = $("#tr_row_for_delete_" + btn_NewInv_Counter + "_" + s + "").val();
                            if (delete_auto_tr1 == 0) {
                                $("#hdn_hide_pass_value_" + btn_NewInv_Counter + '_' + s + '_' + i + "").val(auto_type_array[s - 1]);
                                del_auto_display2++;
                            }
                        }
                    } else {
                        var del_auto_display2 = 1;
                        for (var s = 1; s <= row_counter; s++) {
                            var delete_auto_tr1 = $("#tr_row_for_delete_" + btn_NewInv_Counter + "_" + s + "").val();
                            if (delete_auto_tr1 == 0) {
                                $("#txt_add_row_" + btn_NewInv_Counter + '_' + s + '_' + i + "").text(auto_type_array[s - 1]);
                                del_auto_display2++;
                            }
                        }
                    }
                    var temp_show_arry_length = auto_type_array.length;
                    for (var del_chk_loop = 1; del_chk_loop <= row_counter; del_chk_loop++) {
                        var btn_hide_row_no_counter = $("#tr_row_for_delete_" + btn_NewInv_Counter + "_" + del_chk_loop + "").val();
                    }

                    if (temp_show_arry_length == btn_hide_row_no_counter) {
                        // hide button of add row in static array of auto increment for restrict add row
                        // $("#div_chkcchedule").css("display", "");
                        $("#btn_add_row_" + btn_NewInv_Counter + "").css("display", "none");
                    }
                }
            }

            if (json_equation_parse == "" || json_equation_parse == undefined) {
                // there is no equation in column
            } else {
                var length = json_equation_parse.length;
                var flag = 0;
                var temp_equ_ans = 0;
                for (j = 1; j <= row_counter; j++) {// row for loop
                    var equation = '';

                    // e.g a+b-c for this given equation is 1+2-3
                    // 1 st row a=50,b=89,c=60
                    // for calculation
                    // equation ==> 50+89-60
                    var delete_equ_chk1 = $("#tr_row_for_delete_" + btn_NewInv_Counter + "_" + j + "").val();
                    if (delete_equ_chk1 == 0) {
                        for (k = 0; k < length; k++) { // equation for loop
                            var value1 = json_equation_parse[k];
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
                                    temp_equ_ans = parseFloat(static_temp);
                                    equation += temp_equ_ans;
                                } else {
                                    // variable column
                                    value1 = value1 - 1;
                                    var display_equ_value = json_data[value1].display;
                                    if (display_equ_value == "1") { // take value from hidden
                                        temp_equ_ans = $("#hdn_hide_pass_value_" + btn_NewInv_Counter + '_' + j + '_' + value1 + "").val();
                                    } else {
                                        // take value from td
                                        temp_equ_ans = $("#txt_add_row_" + btn_NewInv_Counter + '_' + j + '_' + value1 + "").text();
                                    }

                                    var prefix = $("#txt_add_row_" + btn_NewInv_Counter + '_' + j + '_' + value1 + "").attr("pre");
                                    var postfix = $("#txt_add_row_" + btn_NewInv_Counter + '_' + j + '_' + value1 + "").attr("post");
                                    temp_equ_ans = temp_equ_ans.replace(prefix, '');                      //To remove prefix/postfix from string
                                    temp_equ_ans = temp_equ_ans.replace(postfix, '');                      //To remove prefix/postfix from string

                                    temp_equ_ans = parseFloat(temp_equ_ans);
                                    equation += temp_equ_ans;
                                }
                            }
                        }
                        var answer = eval(equation);
                        answer = answer.toFixed(2);
                        // store eq. answer in hidden filed // hide column

                        if (json_data[i].display == "1") {
                            $("#hdn_hide_pass_value_" + btn_NewInv_Counter + '_' + j + '_' + i + "").val(answer);
                        } else {
                            // store eq. answer in td

                            var prefix = $("#txt_add_row_" + btn_NewInv_Counter + '_' + j + '_' + i + "").attr("pre");
                            if (prefix == "" || prefix == null || prefix == undefined) {
                                prefix = '';
                            }
                            var postfix = $("#txt_add_row_" + btn_NewInv_Counter + '_' + j + '_' + i + "").attr("post");
                            if (postfix == "" || postfix == null || postfix == undefined) {
                                postfix = '';
                            }
                            answer = '' + prefix + ' ' + answer + ' ' + postfix;
                            $("#txt_add_row_" + btn_NewInv_Counter + '_' + j + '_' + i + "").text(answer);
                        }
                    }
                    // $(
                    // "#txt_add_row_" + btn_NewInv_Counter + '_' + j
                    // + '_' + i + "").css({
                    // "width" : "100px",
                    // "height" : "30px",
                    // "margin-right" : "2px",
                    // "margin-left" : "2px",
                    // "border" : "none",
                    // "background-color" : "white"
                    // });

                    /*
                     * $("#tbl_row_data_" + btn_NewInv_Counter + "").css({
                     * "box-shadow" : "3px 3px 10px blue", "border-radius" :
                     * "5px", "border" : "1px solid black" });
                     */
                }
            }
        }
        /*----- equation end------*/

        //*--------flag for 1=sum, 2=min, 3=max, 4=avg, 5=count------------*****//
        /*----- sum start------*/
        var sum = 0;
        var k = 0;
        for (a = 0; a < num_row; a++) {
            var th_column_id = json_data[a].id;
            var th_name = json_data[a].name;
            var ddl_datatype = json_data[a].type;
            var ddl_auto = json_data[a].auto;
            var madatory = json_data[a].mandatory;
            var td_sum = json_data[a].sum;
            var equation = json_data[a].equation;
            var listview_prefix = json_data[a].prefix;
            if (listview_prefix == "" || listview_prefix == null || listview_prefix == undefined) {
                listview_prefix = '';
            }

            var listview_postfix = json_data[a].postfix;
            if (listview_postfix == "" || listview_postfix == null || listview_postfix == undefined) {
                listview_postfix = '';
            }
            if (td_sum == 1) {
                //SUM
                for (var r = 1; r <= row_counter; r++) {
                    var delete_sum_chk1 = $("#tr_row_for_delete_" + btn_NewInv_Counter + "_" + r + "").val();
                    if (delete_sum_chk1 == 0) {
                        if (json_data[a].display == "1") {
                            var get_row_value = $("#hdn_hide_pass_value_" + btn_NewInv_Counter + '_' + r + '_' + a + "").val();
                        } else {
                            var get_row_value = $("#txt_add_row_" + btn_NewInv_Counter + '_' + r + '_' + a + "").text();
                        }

                        if (get_row_value == "") {
                            get_row_value = "0";
                        }

                        get_row_value = get_row_value.replace(listview_prefix, '');                      //To remove prefix/postfix from string
                        get_row_value = get_row_value.replace(listview_postfix, '');                      //To remove prefix/postfix from string

                        var get_row_value = parseFloat(get_row_value);
                        sum += get_row_value;
                    }
                }

                sum = sum.toFixed(2);
                sum = '<span class="list-ans" onclick="toggle_hidden_ans_data(this)"><b>' + listview_prefix + '</b>' + sum + '<b>' + listview_postfix + '</b></span>';
                $("#sum_" + btn_NewInv_Counter + "_" + a + "").attr('pre', listview_prefix);
                $("#sum_" + btn_NewInv_Counter + "_" + a + "").attr('post', listview_postfix);
                $("#sum_" + btn_NewInv_Counter + "_" + a + "").html(sum);
                sum = 0;
            }
            else if (td_sum == 2) {
                //MIN
                var min_ary = [];
                for (var r = 1; r <= row_counter; r++) {
                    var delete_sum_chk1 = $("#tr_row_for_delete_" + btn_NewInv_Counter + "_" + r + "").val();
                    if (delete_sum_chk1 == 0) {
                        if (json_data[a].display == "1") {
                            var get_row_value = $("#hdn_hide_pass_value_" + btn_NewInv_Counter + '_' + r + '_' + a + "").val();
                        } else {
                            var get_row_value = $("#txt_add_row_" + btn_NewInv_Counter + '_' + r + '_' + a + "").text();
                        }

                        if (get_row_value == "") {
                            get_row_value = "0";
                        }

                        get_row_value = get_row_value.replace(listview_prefix, '');                      //To remove prefix/postfix from string
                        get_row_value = get_row_value.replace(listview_postfix, '');                      //To remove prefix/postfix from string

                        var get_row_value = parseFloat(get_row_value);
                        min_ary.push(get_row_value);
                    }
                }

                var min_val = Math.min.apply(null, min_ary);                                    //find MIN val from array
                min_val = min_val.toFixed(2);
                min_val = '<span class="list-ans" onclick="toggle_hidden_ans_data(this)"><b>' + listview_prefix + '</b> ' + min_val + ' <b>' + listview_postfix + '</b></span>';
                $("#sum_" + btn_NewInv_Counter + "_" + a + "").attr('pre', listview_prefix);
                $("#sum_" + btn_NewInv_Counter + "_" + a + "").attr('post', listview_postfix);
                $("#sum_" + btn_NewInv_Counter + "_" + a + "").html(min_val);
            }
            if (td_sum == 3) {
                //MAX
                var max_ary = [];
                for (var r = 1; r <= row_counter; r++) {
                    var delete_sum_chk1 = $("#tr_row_for_delete_" + btn_NewInv_Counter + "_" + r + "").val();
                    if (delete_sum_chk1 == 0) {
                        if (json_data[a].display == "1") {
                            var get_row_value = $("#hdn_hide_pass_value_" + btn_NewInv_Counter + '_' + r + '_' + a + "").val();
                        } else {
                            var get_row_value = $("#txt_add_row_" + btn_NewInv_Counter + '_' + r + '_' + a + "").text();
                        }

                        if (get_row_value == "") {
                            get_row_value = "0";
                        }

                        get_row_value = get_row_value.replace(listview_prefix, '');                      //To remove prefix/postfix from string
                        get_row_value = get_row_value.replace(listview_postfix, '');                      //To remove prefix/postfix from string

                        var get_row_value = parseFloat(get_row_value);
                        max_ary.push(get_row_value);
                    }
                }

                var max_val = Math.max.apply(null, max_ary);                                    //find MAX val from array
                max_val = max_val.toFixed(2)
                max_val = '<span class="list-ans" onclick="toggle_hidden_ans_data(this)"><b>' + listview_prefix + '</b> ' + max_val + ' <b>' + listview_postfix + '</b></span>';
                $("#sum_" + btn_NewInv_Counter + "_" + a + "").attr('pre', listview_prefix);
                $("#sum_" + btn_NewInv_Counter + "_" + a + "").attr('post', listview_postfix);
                $("#sum_" + btn_NewInv_Counter + "_" + a + "").html(max_val);
            }
            if (td_sum == 4) {
                //AVG
                for (var r = 1; r <= row_counter; r++) {
                    var delete_sum_chk1 = $("#tr_row_for_delete_" + btn_NewInv_Counter + "_" + r + "").val();
                    if (delete_sum_chk1 == 0) {
                        if (json_data[a].display == "1") {
                            var get_row_value = $("#hdn_hide_pass_value_" + btn_NewInv_Counter + '_' + r + '_' + a + "").val();
                        } else {
                            var get_row_value = $("#txt_add_row_" + btn_NewInv_Counter + '_' + r + '_' + a + "").text();
                        }

                        if (get_row_value == "") {
                            get_row_value = "0";
                        }

                        get_row_value = get_row_value.replace(listview_prefix, '');                      //To remove prefix/postfix from string
                        get_row_value = get_row_value.replace(listview_postfix, '');                      //To remove prefix/postfix from string

                        var get_row_value = parseFloat(get_row_value);
                        sum += get_row_value;
                    }
                }

                var total_row = parseInt(row_counter);
                var avg_val = sum / total_row;
                avg_val = avg_val.toFixed(2);
                avg_val = '<span class="list-ans" onclick="toggle_hidden_ans_data(this)"><b>' + listview_prefix + '</b> ' + avg_val + ' <b>' + listview_postfix + '</b></span>';
                $("#sum_" + btn_NewInv_Counter + "_" + a + "").attr('pre', listview_prefix);
                $("#sum_" + btn_NewInv_Counter + "_" + a + "").attr('post', listview_postfix);
                $("#sum_" + btn_NewInv_Counter + "_" + a + "").html(avg_val);
                sum = 0;
            }
            if (td_sum == 5) {
                //COUNT
                var total_row_count = parseInt(row_counter);
                total_row_count = '<span class="list-ans" onclick="toggle_hidden_ans_data(this)"><b>' + listview_prefix + '</b> ' + total_row_count + ' <b>' + listview_postfix + '</b></span>';
                $("#sum_" + btn_NewInv_Counter + "_" + a + "").attr('pre', listview_prefix);
                $("#sum_" + btn_NewInv_Counter + "_" + a + "").attr('post', listview_postfix);
                $("#sum_" + btn_NewInv_Counter + "_" + a + "").html(total_row_count);
            }
        }
        /*----- sum end------*/
        /*----key up event----*/
        var row_finaljson = [];
        var sum_finaljson = [];
        var json_ans_type22 = [];
        // var json_rowans_type_22 = [];
        // for store ans of individual row
        for (var z = 1; z <= row_counter; z++) {
            var json_store_sum = [];
            var json_store = [];
            var row_json = [];
            var json_store_row_counter = [];
            var json_store_row = [];
            // var btn_json = $(
            // '#btn_edit_td_' + btn_NewInv_Counter + '_' + j + '').alt();
            var delete_json_fill = $("#tr_row_for_delete_" + btn_NewInv_Counter + "_" + z + "").val();
            if (delete_json_fill == 0) {
                var btn_json = $('#btn_edit_td_' + btn_NewInv_Counter + '_' + z + '').attr("alt");

                // var td_sum = json_data[i].sum;

                for (var w = 0; w < num_row; w++) {

                    var display_row = json_data[w].display;
                    var auto_inc = json_data[w].auto;

                    if (json_data[w].type[0].type == 5) {
                        var ddl_datatype1 = json_data[w].type[1].type;
                        var que_id = json_data[w].type[1].que_id;
                        var row_name = json_data[w].type[1].prop[0].name;
                    }
                    else {
                        var ddl_datatype1 = json_data[w].type[0].type;
                        var que_id = json_data[w].type[0].que_id;
                        var row_name = json_data[w].type[0].prop[0].name;
                    }
                    //var ddl_datatype1 = json_data[w].type[0].type;   //temporary
                    //var que_id = json_data[w].type[0].que_id;
                    //var row_name = json_data[w].type[0].prop[0].name;

                    //dependency_array_count_type22 = 0;                  //set default zero to remove dependency in type 22 popup in listview(Refer: https://trello.com/c/ORH0FQNn/912-add-new-dependancy-key-in-type22?menu=filter&filter=member:mukeshm2,member:foramsky1)

                    var company_id = JSON.parse(storage.getItem('company_id'));
                    if (company_id == 1833 || company_id == 1202 || company_id == 89) {
                        // set 0 for tej impex 08122018
                        dependency_array_count_type22 = 0;                  //set default zero to remove dependency in type 22 popup in listview(Refer: https://trello.com/c/ORH0FQNn/912-add-new-dependancy-key-in-type22?menu=filter&filter=member:mukeshm2,member:foramsky1)
                    }

                    if (dependency_array_count_type22 == 0) {
                        //type 22 without dependency
                        if (ddl_datatype1 == '7' || ddl_datatype1 == '9' || ddl_datatype1 == '11') {
                            if (display_row == "1") {
                                var get_row_value = $("#hdn_hide_pass_value_" + btn_NewInv_Counter + '_' + z + '_' + w + "").val();
                            } else {
                                var get_row_value = $("#txt_add_row_" + btn_NewInv_Counter + '_' + z + '_' + w + "").attr('src');
                            }
                            var get_row_id = '';
                        } else if (ddl_datatype1 == '20') {
                            if (display_row == "1") {
                                var get_row_value = $("#hdn_hide_pass_value_" + btn_NewInv_Counter + '_' + z + '_' + w + "").val();
                                var get_row_id = $("#hdn_hide_pass_value_" + btn_NewInv_Counter + '_' + z + '_' + w + "").attr("title");
                            } else {
                                var get_row_value = $("#txt_add_row_" + btn_NewInv_Counter + '_' + z + '_' + w + "").text();
                                var get_row_id = $("#txt_add_row_" + btn_NewInv_Counter + '_' + z + '_' + w + "").attr("title");
                            }
                        } else {
                            if (display_row == "1") {
                                var get_row_value = $("#hdn_hide_pass_value_" + btn_NewInv_Counter + '_' + z + '_' + w + "").val();
                            } else {
                                var get_row_value = $("#txt_add_row_" + btn_NewInv_Counter + '_' + z + '_' + w + "").text();
                            }
                            var get_row_id = '';
                        }
                        var prefix = $("#txt_add_row_" + btn_NewInv_Counter + '_' + z + '_' + w + "").attr("pre");
                        var postfix = $("#txt_add_row_" + btn_NewInv_Counter + '_' + z + '_' + w + "").attr("post");

                        if (get_row_value == "" || get_row_value == null || get_row_value == undefined) { }
                        else {
                            get_row_value = get_row_value.replace(prefix, '');                      //To remove prefix/postfix from string
                            get_row_value = get_row_value.replace(postfix, '');                      //To remove prefix/postfix from string
                        }

                    }
                    else {
                        //type 22 in dependency with edit mode
                        //var type22_filled_json_dependency = JSON.parse(btn_json);
                        btn_json = itemObj._checkStrObj(btn_json);
                        var type22_filled_json_dependency = btn_json;

                        for (var d = 0; d < type22_filled_json_dependency.length; d++) {
                            var d_type = type22_filled_json_dependency[d].type;
                            var d_que_id = type22_filled_json_dependency[d].que_id;

                            if (d_type != '5') {
                                if (que_id == d_que_id) {
                                    if (d_type == '20') {
                                        var get_row_value = type22_filled_json_dependency[d].ans[0];
                                        var get_row_id = type22_filled_json_dependency[d].ans[1];
                                    }
                                    else {
                                        var get_row_value = type22_filled_json_dependency[d].ans[0];
                                        var get_row_id = '';

                                        if (d_type == '4') {
                                            if (auto_inc == 1) {
                                                if (display_row == "1") {
                                                    get_row_value = $("#hdn_hide_pass_value_" + btn_NewInv_Counter + '_' + z + '_' + w + "").val();
                                                } else {
                                                    get_row_value = $("#txt_add_row_" + btn_NewInv_Counter + '_' + z + '_' + w + "").text();
                                                }
                                            }
                                        }
                                    }
                                    break;
                                }
                            }
                        }
                    }

                    // patch for tej impex for grand total blank (06122018)
                    if (get_row_value == '' || get_row_value == null || get_row_value == undefined) {
                        get_row_value = $("#hdn_hide_pass_value_" + btn_NewInv_Counter + '_' + z + '_' + w + "").val();

                        if (get_row_value == '' || get_row_value == null || get_row_value == undefined) {
                            //for AMOUNT (if display=0)
                            get_row_value = $("#txt_add_row_" + btn_NewInv_Counter + '_' + z + '_' + w + "").text();
                        }
                    }

                    json_store_row.push({
                        "row_name": row_name,
                        "row_que_id": que_id,
                        "txt_row_id": get_row_id,
                        "txt_row_value": get_row_value
                    });

                    if (row_name == 'Grand Total') {
                        btn_json = itemObj._checkStrObj(btn_json);
                        var len = btn_json.length;

                        for (b = 0; b < len; b++) {
                            var type = btn_json[b].type;
                            if (type != 0 && type != 5 && type != 10) {
                                var row_name1 = btn_json[b].prop[0].name;
                                if (row_name1 == 'Grand Total') {
                                    btn_json[b].ans[0] = get_row_value;
                                    break;
                                }
                            }
                        }
                    }

                    //assigned auto increment invoice ans to checksheet JSON(btn_json) ans for hidden numeric control, coz issue in PDF report invoice SR No. (User: tata.approval) [FT - 15022024]
                    var temp_btn_json = itemObj._checkStrObj(btn_json);
                    if (temp_btn_json == "" || temp_btn_json == null || temp_btn_json == undefined) {
                        temp_btn_json = [];
                    }
                    else {
                        for (var t = 0; t < temp_btn_json.length; t++) {
                            var t_que_id = temp_btn_json[t].que_id;
                            var btn_json_ans = temp_btn_json[t].ans[0];
                            var t_type = temp_btn_json[t].type;
                            if (t_type == 4 && (t_que_id == que_id)) {
                                if (btn_json_ans != get_row_value) {
                                    temp_btn_json[t].ans[0] = get_row_value;
                                }
                            }
                        }
                    }
                    var temp_btn_json_str = JSON.stringify(temp_btn_json);
                    btn_json = temp_btn_json_str;
                }

                json_store.push({
                    "edt_btn_json": itemObj._checkStrObj(btn_json),
                    "txt_row": json_store_row
                });
            }

            if (z == row_counter) {
                for (var p = 0; p < num_row; p++) {
                    if (json_data[p].type[0].type == 5) {
                        var ddl_que_id = json_data[p].type[1].que_id;
                    }
                    else {
                        var ddl_que_id = json_data[p].type[0].que_id;
                    }
                    //var ddl_que_id = json_data[p].type[0].que_id;  //temporary
                    var td_sum = json_data[p].sum;
                    var th_name = json_data[p].name;
                    var display_sum = json_data[p].display;
                    if (td_sum > 0) {
                        var sum = $("#sum_" + btn_NewInv_Counter + "_" + p + "").text();
                        var prefix = $("#sum_" + btn_NewInv_Counter + "_" + p + "").attr("pre");
                        var postfix = $("#sum_" + btn_NewInv_Counter + "_" + p + "").attr("post");

                        sum = sum.replace(prefix, '');                      //To remove prefix/postfix from string
                        sum = sum.replace(postfix, '');                      //To remove prefix/postfix from string

                        sum_finaljson.push({
                            "sum_que_id": ddl_que_id,
                            "txt_sum_value": sum
                        });
                    } else {
                        sum_finaljson.push({
                            "sum_que_id": ddl_que_id,
                            "txt_sum_value": ""
                        });
                    }
                }
            }

            var delete_final_json_fill = $("#tr_row_for_delete_" + btn_NewInv_Counter + "_" + z + "").val();
            var it_id = $("#tr_row_for_delete_" + btn_NewInv_Counter + "_" + z + "").attr('it_id');
            if (delete_final_json_fill == 0) {
                row_finaljson.push({
                    "json_type_22": json_store,
                    "it_id": it_id
                });
            }
        }

        var table_name = $("hdn_inv_tablename_" + btn_NewInv_Counter + "").val();
        var delete_count_number_row = 0;
        for (var del_loop_num_row = 1; del_loop_num_row <= row_counter; del_loop_num_row++) {
            var delete_final_json_fill = $("#tr_row_for_delete_" + btn_NewInv_Counter + "_" + del_loop_num_row + "").val();
            if (delete_final_json_fill == 0) {
                delete_count_number_row++;
            }
        }

        json_ans_type22.push({
            "Table_Name": table_name,
            "row_finaljson": row_finaljson,
            "sum_finaljson": sum_finaljson,
            "txt_row_counter": delete_count_number_row
        });

        var item_id = storage.getItem('img_id_type22');
        if (item_id == '' || item_id == null || item_id == undefined || item_id == 'null') { }
        else {

            var type20_cust_add_popup = $('#popup_container_type20_add:visible').length;
            var cust_popup_disp = $(".popup-type20-add").css('display');
            var type23_popup = $('.popup-type23.modal-in:visible');

            // find type22 obj index from main json
            //if ($('.popup-type23').css('display') == "block") {                                           //commented coz display found "block" even if popup is closed [FT-04062025]
            if (type23_popup.length > 0) {
                var t_jsonObj = jsonObj_type23;
            } else if (type20_cust_add_popup > 0 || cust_popup_disp == "block") {
                var t_jsonObj = jsonObj_cust_add;
            } else if (jsonObj_old == "" || jsonObj_old == null || jsonObj_old == undefined) {
                // user create
                var t_jsonObj = jsonObj_user_add;
            } else {

                let task_create_popup = $('.popup-new-task-create.modal-in:visible');
                if (task_create_popup.length > 0) {
                    var t_jsonObj = jsonObj_task_add;
                }
                else {
                    var t_jsonObj = jsonObj_old;
                }
            }

            var type22_index;
            for (t = 0; t < t_jsonObj.length; t++) {
                var que_id = t_jsonObj[t].que_id;
                if (que_id == item_id) {
                    type22_index = t;
                    break;
                }
            }

            //if ($('.popup-type23').css('display') == "block") {
            if (type23_popup.length > 0) {
                jsonObj_type23[type22_index].ans = JSON.stringify(json_ans_type22);
            }
            else if (type20_cust_add_popup > 0 || cust_popup_disp == "block") {
                try {
                    jsonObj_cust_add[type22_index].ans = JSON.stringify(json_ans_type22);
                }
                catch (e) { }
            }
            else if (jsonObj_old == "" || jsonObj_old == null || jsonObj_old == undefined) {
                // user create
                jsonObj_user_add[type22_index].ans = JSON.stringify(json_ans_type22);
            }
            else {
                try {

                    let task_create_popup = $('.popup-new-task-create.modal-in:visible');
                    if (task_create_popup.length > 0) {
                        jsonObj_task_add[type22_index].ans = JSON.stringify(json_ans_type22);
                    }
                    else {
                        jsonObj_old[type22_index].ans = JSON.stringify(json_ans_type22);
                    }

                }
                catch (e) { }
            }
        }
        //type22 dependency
        var type22_dep_data = $("#hdn_inv_dep_" + btn_NewInv_Counter + "").val();
        if (type22_dep_data == '' || type22_dep_data == null || type22_dep_data == undefined) { }
        else {
            type22_dep_data = itemObj._checkStrObj(type22_dep_data);  		// check_item
            var greater_class = type22_dep_data[0].greater_class;
            if (greater_class == '' || greater_class == null || greater_class == undefined) { }
            else {
                var ref_class = type22_dep_data[0].ref_class;
                var less_class = type22_dep_data[0].less_class;

                var ref_final_sum = parseInt($('.' + ref_class + '').find('label[id^="sum_"]').text());
                var curr_final_sum = parseInt($('label[id^="sum_' + btn_NewInv_Counter + '"').text());

                if (curr_final_sum > ref_final_sum) {
                    $('.' + greater_class + '').show();
                    $('.' + less_class + '').hide();
                }
                else {
                    $('.' + less_class + '').show();
                    $('.' + greater_class + '').hide();
                }
            }
        }

        //---------trigger for type20 tableview selectAll when add/edit/delete record from invoice(09122019: urbanJungle)---////
        var invoice_trigger_id = $("#div_Inv_Calculate_" + btn_NewInv_Counter + "").attr("type20_trigger_id");
        if (invoice_trigger_id == "" || invoice_trigger_id == null || invoice_trigger_id == undefined) { }
        else {
            var type20_view_style = $("#div_Inv_Calculate_" + btn_NewInv_Counter + "").attr("type20_view_style");
            if (type20_view_style == "dropdownview") {
                popup_search_items_show_type20(invoice_trigger_id, "", "", "", "popup", type20_view_style);
            }
        }
    } catch (e) {
        alert1(e + "_get_sum_column");
    }
    return false;
}

// type22 dependency show/hide in readsurvey
function show_hide_Element_Type22_Readsurvey(t_data_str) {
    try {
        setTimeout(function () {
            var type22_dep_data = itemObj._checkStrObj(t_data_str);  		// check_item
            var ref_class = type22_dep_data[0].ref_class;
            var greater_class = type22_dep_data[0].greater_class;
            var less_class = type22_dep_data[0].less_class;
            var new_id = type22_dep_data[0].new_id;

            var ref_final_sum = parseInt($('.' + ref_class + '').find('label[id^="sum_"]').text());
            var curr_final_sum = parseInt($('label[id^="sum_' + new_id + '"').text());

            if (curr_final_sum > ref_final_sum) {
                $('.' + greater_class + '').show();
                $('.' + less_class + '').hide();
            }
            else {
                $('.' + less_class + '').show();
                $('.' + greater_class + '').hide();
            }
        }, 300);
    }
    catch (e) {
        alert1(e);
    }
}

// close popup
function popup_items_hide_type22(counter_flag) {
    enable_popup = 0;
    $("#div_inv_form").empty();

    $('.foooter-type22').empty();
    myApp.closeModal('.popup-type22');

    if (F7_device == 'android') {
        //popup UI issue in iOS
        $('.popup-type22').hide();
    }

    form_flag = 0;
    if ($('#collapse_container_div').css('display') == 'block') {
        if ($('#popup_outer_div_type23').css('display') == 'block') {
            form_flag = 3;
        }
    }
    return false;
}

// show popup
var type22_edit_flag = 0;
function popup_search_items_show_type22(item_id_1, btn_NewInv_Counter1, row_counter_new, edit_flag, temp_inv_display_flag) {
    // new code mk
    try {
        row_index_no = row_counter_new;
        type22_new_id = btn_NewInv_Counter1;
        localStorage.setItem("last_invoice_id", btn_NewInv_Counter1);

        storage.setItem('img_id_type22', item_id_1);
        type22_edit_flag = edit_flag;

        // edit_flag 0 for add new row
        // temp_inv_display_flag = 0 --> table, 1--> listview

        // storage.setItem('img_id_type22', item_id_1);
        // var item_id_1 = storage.getItem('img_id_type22');

        // curr_btnSearch_Counter = temp_btnSearch_Counter;

        var type22_json_len = $("#hdn_type22_json_len_" + type22_new_id + "").val();            //single invoice control UI changes [18112021]
        var type22_snglCntrl_type = $("#hdn_type22_json_len_" + type22_new_id + "").attr('type22_snglCntrl_type');
        if (type22_json_len == 1 && type22_snglCntrl_type == '20') { }
        else {
            enable_popup = 1;
            myApp.popup('.popup-type22');
        }

        if (edit_flag == 0) {
            // new popup
            if (temp_inv_display_flag == 0) {
                add_row_with_item(btn_NewInv_Counter1, row_counter_new);
            } else {
                add_row_with_listview_item(btn_NewInv_Counter1, row_counter_new);
            }

        } else {
            // edit popup
            on_click_edit_open_popup(btn_NewInv_Counter1, row_counter_new);
        }
        return false;
    }
    catch (e) {
        alert(e + '_popup_search_items_show_type22');
    }
}

function delete_row_from_table(item_id_1, btn_NewInv_Counter1, row_counter_new, edit_flag, temp_inv_display_flag) {
    try {
        storage.setItem('img_id_type22', item_id_1);
        if (F7_device == 'ios') {
            var person = true;
        }
        else {
            vibrate_device();
            var person = confirm("You are deleteing the Current Row. Continue deleteing...?");
        }

        if (person == true) {
            //var btn_NewInv_Counter = inv_Calc_new_array[btn_NewInv_Counter1];
            type22_new_id = btn_NewInv_Counter1;

            $("#tr_row_for_delete_" + btn_NewInv_Counter1 + "_" + row_counter_new + "").css("display", "none");
            $("#tr_row_for_delete_" + btn_NewInv_Counter1 + "_" + row_counter_new + "").val(1);
            ckeck_mandatory(btn_NewInv_Counter1);

            //Add new record as per config. max_record - mk - 01042025
            var max_record = $("#hdn_btn_congfiure_" + btn_NewInv_Counter1 + "").attr('max_record');
            if (max_record == null || max_record == '' || max_record == undefined) { }
            else {

                if (typeof max_record == "string") {

                    if (max_record.indexOf("@") > -1) {
                        // get max record from above control

                        let ans_text = get_min_max_value_from_class(max_record);
                        if (ans_text == '' || ans_text == null || ans_text == undefined || ans_text == '--- Select Values ---' || ans_text == 'Select Value' || ans_text == '--- Select ---') {
                            alert("Maximum record value is not found!");
                        }
                        else {
                            max_record = ans_text;
                        }
                    }

                    max_record = parseInt(max_record);
                }

                var tbl_length = $('#tbl_row_data_' + btn_NewInv_Counter1 + ' tr[id^=tr_row_for_delete_]:visible').length;
                var li_length = $('#div_list_display_' + btn_NewInv_Counter1 + ' li[id^=tr_row_for_delete_]:visible').length;
                if (max_record > tbl_length || max_record > li_length) {
                    $("#btn_add_row_" + btn_NewInv_Counter1 + "").css('display', 'inline');
                }
            }

            // single invoice control
            if ($('#div_singleInvoice_cntrl_' + btn_NewInv_Counter1 + '')) {
                var curr_val = $("#tr_row_for_delete_" + btn_NewInv_Counter1 + "_" + row_counter_new + "").find('label[id^=txt_add_row]').text();
                var type20_opt_obj = $("#div_singleInvoice_cntrl_" + btn_NewInv_Counter1 + "").find("select[id^=ddl_search_type20] option");
                $(type20_opt_obj).each(function () {
                    if ($(this).is(":checked")) {
                        var selected_val = $(this).text();
                        if (curr_val == selected_val) {
                            $(this).removeAttr("checked");
                            $(this).prop("selected", false);
                            $("#tr_row_for_delete_" + btn_NewInv_Counter1 + "_" + row_counter_new + "").find('span.badge').remove();
                        }
                    }
                });
                $('#div_singleInvoice_cntrl_' + btn_NewInv_Counter1 + '').trigger("ondrag");

                // downgrade counter and reset row index in hidden 16022024
                let t_row_cnt = $('#row_index_' + btn_NewInv_Counter1 + '').val();
                if (t_row_cnt == "" || t_row_cnt == null || t_row_cnt == undefined) {
                    t_row_cnt = 0;
                }
                else {
                    t_row_cnt = parseInt(t_row_cnt);
                    t_row_cnt--;
                    $('#row_index_' + btn_NewInv_Counter1 + '').val(t_row_cnt);
                }

            }
        }
        else { }
    } catch (e) {
        alert1(e + "_delete_row_from_table")
    }
}

function toggle_hidden_ans_data(this_obj) {
    if ($(this_obj).hasClass('list-ans')) {
        $(this_obj).removeClass('list-ans');
        $(this_obj).addClass('list-ans-full');
    }
    else {
        $(this_obj).addClass('list-ans');
        $(this_obj).removeClass('list-ans-full');
    }
}

//get search type for add table header in blank table for other control 18052023 PG
function get_search_ctrl_type(json_data) {
    var json_data_type = json_data[0].type;
    if (json_data_type.length == 1) {
        var control_type = json_data_type[0].type;
    }
    else {
        var control_type = json_data_type[1].type;
    }
    return control_type;
}

check_n_apply_show_more_for_invoice_items = (t_inv_counter) => {
    $('#div_list_display_' + t_inv_counter + ' li').each(function () {
        var li_height = $('#div_list_display_' + t_inv_counter + ' li').height();
        if (li_height < 70) {  //120=max-height of li
            $('.readmore-link').hide();
        }
        else {
            $('.readmore-link').show();
        }
    });
}

// dynamic min_record / max_record addition in invoice control
get_min_max_value_from_class = (class_name) => {
    var value_type = class_name.substring(2, 1);
    var sub_get_value = class_name.substring(2, class_name.length - 2);

    var ddl_found = $("." + sub_get_value + "").find("select");
    var ele_type = $("." + sub_get_value + "").find("div :nth-child(2)").prop('tagName');

    if (ele_type == 'SELECT' || ele_type == 'OPTION' || ddl_found.length > 0) {
        // normal dropdown
        var where_box_id = $("." + sub_get_value + "").find("select").attr("id");
        var ans_text = $("#" + where_box_id + " :selected").text();
    }
    else {
        // radio
        var rdo_name = $("." + sub_get_value + " :input[type=radio]").attr("name");
        var ans_text = $('input[name=' + rdo_name + ']:checked').val();
    }
   
    return ans_text;
}