
function get_scanner_and_print(item_id, que_id, img_div, photo_type, Fill_class, editable, remember_me) {
    try {

        storage.setItem('img_id', JSON.stringify(item_id));
        storage.setItem('img_que_id', JSON.stringify(que_id));
        storage.setItem('img_div_id', JSON.stringify(img_div));
        storage.setItem('type25_Fill_class', JSON.stringify(Fill_class));
        localStorage.setItem('type25_remember_me', remember_me);

        if (editable == 'false') {
            get_scanner_and_print_scan_image(item_id, que_id, img_div, photo_type);
        }
        else {
            var readonly = $('#' + img_div + '').attr('readonly');
            if (readonly == 'readonly') {
                var param = "get_scanner_and_print_scan_image('" + item_id + "','" + que_id + "','" + img_div + "','" + photo_type + "')";
                var param1 = "get_scanner_and_print_edit_text('" + img_div + "')";
                var clickedLink = $("#" + img_div + "");
                myApp.popover('.popover-type25', clickedLink);
                $("#popover_scan_image").attr("onclick", param);
                $("#popover_edit_text").attr("onclick", param1);
            }
            else {
                myApp.closeModal('.popover-type25');
                $('#' + img_div + '').focus();
                $('#' + img_div + '').prop('readonly', false);
                $('#' + img_div + '').focusout(function () {
                    $(this).prop('readonly', true);
                });
            }
        }
    } catch (e) {
        alert1(e + '_get_scanner_and_print()');
    }
}


function get_scanner_and_print_scan_image(item_id, que_id, img_div, photo_type) {
    try {
        var q_jsonobj = [];
        q_jsonobj.push({
            'photo_type': photo_type
        })
        cordova.exec(onsuccess_get_scanner_and_print, onfail_get_scanner_and_print, 'scanner_plug', 'anAction', q_jsonobj);
    } catch (e) {
        alert1(e + '_get_scanner_and_print_scan_image()');
    }
}

function get_scanner_and_print_edit_text(img_div) {
    try {
        myApp.closeModal('.popover-type25');
        $('#' + img_div + '').focus();
        $('#' + img_div + '').prop('readonly', false);
        $('#' + img_div + '').trigger('click');
        $('#' + img_div + '').focusout(function () {
            $(this).prop('readonly', true);
        });
    } catch (e) {
        alert1(e + '_get_scanner_and_print_edit_text()');
    }
}


function onsuccess_get_scanner_and_print(e) {
    try {
        form_has_changed = "true";                      //to get confirmation on back btn while editing form
        var myArray = JSON.parse(e);
        var code = myArray[0].code;

        var curr_img_div_id = JSON.parse(storage.getItem('img_div_id'));
        var smallImage = document.getElementById(curr_img_div_id);
        smallImage.value = code;
        var img_id = JSON.parse(storage.getItem('img_id'));

        var answer = [];
        answer.push(code);

        // store scanner history if remember_me is true
        var remember_me = localStorage.getItem('type25_remember_me');
        if (remember_me == 'true') {
            var qr_found = 0;
            var check_type = JSON.parse(storage.getItem('check_type'));
            var que_id = JSON.parse(storage.getItem('img_que_id'));
            var type25_val_Array = JSON.parse(localStorage.getItem('type25_val_Array'));
            if (type25_val_Array == '' || type25_val_Array == null || type25_val_Array == undefined) {
                type25_val_Array = [];
            }
            else {
                for (t = 0; t < type25_val_Array.length; t++) {
                    var t_check_type = type25_val_Array[t].checksheet_id;
                    var t_que_id = type25_val_Array[t].que_id;
                    if (check_type == t_check_type && que_id == t_que_id) {
                        type25_val_Array[t].ans = code;
                        localStorage.setItem('type25_val_Array', JSON.stringify(type25_val_Array));
                        qr_found++;
                    }
                }
            }

            if (qr_found == 0) {
                type25_val_Array.push({
                    'checksheet_id': check_type,
                    'que_id': que_id,
                    'ans': code
                });

                localStorage.setItem('type25_val_Array', JSON.stringify(type25_val_Array));
            }
        }

        //var curr_form_flag = form_flag;
        //if (curr_form_flag == 0) {
        //    // normal form
        //    jsonObj_old[img_id].ans = answer;
        //} else if (curr_form_flag == 1 || curr_form_flag == 4 || curr_form_flag == 5) {
        //    // type22 form
        //    jsonObj_type22[img_id].ans = answer;
        //} else if (curr_form_flag == 2 || curr_form_flag == 3) {
        //    // type23 form
        //    jsonObj_type23[img_id].ans = answer;
        //}

        var curr_form_flag = form_flag;
        if (curr_form_flag == 0 || curr_form_flag == 6 || curr_form_flag == 7) {
            let task_create_popup = $('.popup-new-task-create.modal-in:visible');
            if (task_create_popup.length > 0) {
                //new task create popup [FT-08052025]
                jsonObj_task_add[img_id].ans = answer;
            }
            else {
                // normal form
                jsonObj_old[img_id].ans = answer;
            }
        } else if (curr_form_flag == 1 || curr_form_flag == 4 || curr_form_flag == 5) {
            // type22 form
            jsonObj_type22[img_id].ans = answer;
        } else if (curr_form_flag == 2 || curr_form_flag == 3) {
            // type23 form
            jsonObj_type23[img_id].ans = answer;
        }

        myApp.closeModal('.popover-type25');

        var Fill_class = JSON.parse(storage.getItem('type25_Fill_class'));
        if (Fill_class == '' || Fill_class == null || Fill_class == undefined) { }
        else {
            var ddl_found = $("." + Fill_class + "").find("select");
            if (ddl_found.length > 0) {
                // below dropdown found to fill
                var below_ddl_id = $("." + Fill_class + "").find("select").attr("id");
                var new_op_str = '<option selected="selected">' + code + '<option>';
                $("#" + below_ddl_id + "").append(new_op_str);
            }
            else {
                // below text box found to fill
                var box_id = $("." + Fill_class + "").find("input[type=text]").attr('id');
                $("#" + box_id + "").val(code);
                var search_i_id = $("." + Fill_class + "").find("i[id^='btn20_Search_']").attr('id')
                if (search_i_id == "" || search_i_id == null || search_i_id == undefined) { }
                else {
                    // if found type20 table view(textbox) then auto-click search button
                    document.getElementById(search_i_id).onclick();
                }
            }
        }
    } catch (e) {
        alert1(e + '_onsuccess_get_scanner_and_print()');
    }

}

function onfail_get_scanner_and_print(e) {
    // back pressed from scanner ui
    myApp.closeModal('.popover-type25');
}


// QR code and type20 combination
function get_qr_and_search_data(t_new_id, TableName, JoinTableName, Checksheet_id) {
    try {
        ddl_search_type = "scanner";
        TableName_G = TableName;
        JoinTableName_G = JoinTableName;
        Checksheet_id_G = Checksheet_id;

        var param_obj = [];
        param_obj.push({
            't_new_id': t_new_id,
            'TableName': TableName,
            'JoinTableName': JoinTableName,
            'Checksheet_id': Checksheet_id
        });
        storage.setItem('type20_qr_data', JSON.stringify(param_obj));

        var q_jsonobj = [];
        q_jsonobj.push({
            'photo_type': 'qr'
        })
        cordova.exec(onsuccess_get_qr_and_search_data, onfail_get_qr_and_search_data, 'scanner_plug', 'anAction', q_jsonobj);
    } catch (e) {
        alert1(e + '_get_qr_and_search_data()');
    }
}

// barcode and type20 combination
function get_barcode_and_search_data(t_new_id, TableName, JoinTableName, Checksheet_id) {
    try {
        ddl_search_type = "scanner";
        TableName_G = TableName;
        JoinTableName_G = JoinTableName;
        Checksheet_id_G = Checksheet_id;

        var param_obj = [];
        param_obj.push({
            't_new_id': t_new_id,
            'TableName': TableName,
            'JoinTableName': JoinTableName,
            'Checksheet_id': Checksheet_id
        });
        storage.setItem('type20_qr_data', JSON.stringify(param_obj));

        var q_jsonobj = [];
        q_jsonobj.push({
            'photo_type': 'barcode'
        })
        cordova.exec(onsuccess_get_qr_and_search_data, onfail_get_qr_and_search_data, 'scanner_plug', 'anAction', q_jsonobj);
    } catch (e) {
        alert1(e + '_get_barcode_and_search_data()');
    }
}

var searchable_scan_code = '';
function onsuccess_get_qr_and_search_data(e) {
    try {
        var myArray = JSON.parse(e);
        var code = myArray[0].code;
        var type20_qr_data = JSON.parse(storage.getItem('type20_qr_data'));
        var t_new_id = type20_qr_data[0].t_new_id;

        //$('#search_item_name_Search_' + t_new_id + '').val(code);
        //get_searched_item_list_QR(code);

        var view_style = $("#ddl_search_type20_" + t_new_id + "").attr("view_style");
        if (view_style == "listview") {
            // searchable dropdown + listview + scanner - 07112024
            searchable_scan_code = code;
            get_dropdown_data(t_new_id, TableName_G, JoinTableName_G, Checksheet_id_G, '0', '', '', '');
            close_scanner_option_popup();
        }
        else {
            // dropdown view
            $("#F7_type20_ddl_Search :input[type='search']").val(code);
            get_data_by_dropdown_search(t_new_id, TableName_G, JoinTableName_G, Checksheet_id_G);
        }
    } catch (e) {
        alert1(e + '_onsuccess_get_qr_and_search_data()');
    }
}

function onfail_get_qr_and_search_data(e) {
    // back pressed from scanner ui
}

// get searched list relative to search string
function get_searched_item_list_QR(search_val) {
    try {
        var type20_qr_data = JSON.parse(storage.getItem('type20_qr_data'));
        var t_new_id = type20_qr_data[0].t_new_id;
        curr_btnSearch_Counter = t_new_id;
        var company_id = JSON.parse(storage.getItem('company_id'));
        var user_id = JSON.parse(storage.getItem('user_id'));

        // fill required values to query
        var Condition_Data_Str = $('#hdn_condition_data_' + t_new_id + '').val();
        var qs_array = pass_required_values_to_querystring(Condition_Data_Str);
        Condition_Data_Str = qs_array[0];
        var ref_valid = qs_array[1];

        var Condition_Data = itemObj._checkStrObj(Condition_Data_Str);  		// check_item
        var value_new = Condition_Data[0].value_new;

        //var search_val = $('#search_item_name_Search_' + t_new_id + '').val();
        if (search_val == '' || search_val == null || search_val == undefined) {
            alert1("QR Code returns blank value!");
        }
        else if (ref_valid > 0) {
            alert1("Please enter required value for QR Code!");
        }
        else {
            if (value_new == '' || value_new == null || value_new == undefined) {

                var ColumnNameType = Condition_Data[0].ColumName[0].type;
                var ColumnNameSubData = Condition_Data[0].ColumName[0].subdata;

                ColumnNameSubData[0].Value_1 = search_val;

                if (ColumnNameType == "Json") {
                    Condition_Data[0].where[0].And[0].Json.push(ColumnNameSubData[0]);
                } else {
                    Condition_Data[0].where[0].And[0].Table.push(ColumnNameSubData[0]);
                }

                var FROM = Condition_Data[0].FROM;
                if (FROM == "" || FROM == null || FROM == undefined) {
                    // old webservice for relative to searh string
                    alert1("FROM key is not found in condition!");
                }
                else {
                    // call new webservice for relative to searh string
                    get_searched_item_list_New(Condition_Data, search_val);
                }
            }
            else {
                get_searched_item_list_New(Condition_Data, search_val);
            }
        }
    }
    catch (e) {
        alert1(e + '_get_searched_item_list_QR()');
        loading_hide();
    }
}

