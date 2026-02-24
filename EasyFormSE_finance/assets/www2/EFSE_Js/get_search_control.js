
var DEFAULT_TYPE20 = 0;                     //assigned dynamically from readchecksheet  [FT - 23012024]
var OFFSET_TYPE20 = 0; // from where to start
var FETCH_TYPE20 = 0; // how many from start
var TableName_G;
var JoinTableName_G;
var Checksheet_id_G;
var curr_type_G; // current type all/search
var ddl_search_type = "normal";                                 //---[ddl_search_type='normal'/'scanner'] = search_val is either from scanner or normal----
var invoice_type20_selected_text = '';
var invoice_type20_selected_val = '';
var invoice_type20_checked_flag = ''

// ///////////// popup div portion start //////////////////////////
// show popup search items pop div on "Select All" button
function popup_search_items_show_type20(temp_btnSearch_Counter, TableName,
    JoinTableName, Checksheet_id, window_style, view_style) {
    try {
        curr_btnSearch_Counter = temp_btnSearch_Counter;
        if (view_style == 'dropdownview') {
            // var filled_status = $("#ddl_search_type20_" +
            // curr_btnSearch_Counter
            // + "").attr("name");
            // if (filled_status == "0" || filled_status == undefined) {
            status_2_with_self_assign = 0;
            get_all_searched_list(TableName, JoinTableName, Checksheet_id);
            // }
        } else {
            $("#product_list_" + curr_btnSearch_Counter + "").empty();

            // window_style = 'attached';
            if (window_style == 'attached') {
                $("#tbl_search_div_" + curr_btnSearch_Counter + "").show();
            } else {
                myApp.popup('.popup-type20');
                $('#F7-popup_inner_div_type20').empty();
                if (view_style == 'listview') {
                    //setTimeout(function () {
                    //    $('#parentdiv_popup_inner_div_type20').css('overflow-x', 'hidden !important;');
                    //}, 3000);
                    var str = '<ul id="ul_search_' + curr_btnSearch_Counter + '" style="width: 97% !important; margin-left: 4px; padding: 0;"></ul>';
                }
                else {
                    //setTimeout(function () {
                    //    $('#parentdiv_popup_inner_div_type20').css('overflow-x', 'initial !important;');
                    //}, 3000);

                    $('#filter_search').hide();                 //hide filter for tableview
                    var str = '<table border="1" id="tbl_search_' + curr_btnSearch_Counter + '"></table>';
                }
                $('#F7-popup_inner_div_type20').append(str);
            }
            OFFSET_TYPE20 = 0; // from where to start
            curr_type_G = "all";
            status_2_with_self_assign = 0;

            get_all_searched_list(TableName, JoinTableName, Checksheet_id);
        }
    } catch (e) {
        alert1(e + '_popup_search_items_show_type20()');
        loading_hide();
    }
}

// hide popup items pop div
function popup_items_hide_type20() {
    $("#tbl_search_" + curr_btnSearch_Counter + " tr").remove();
    $("#ul_search_" + curr_btnSearch_Counter + " li").remove();
    $("#tbl_search_div_" + curr_btnSearch_Counter + "").hide();
    $("[id^='ddl_search_type20_']").css('color', '#000');

    myApp.closeModal('.popup-type20');
    hide_current_type_loading(new_id_G);

    if (ddl_listview == "true") {
        //while going back from listview data of dropdown
        ddl_listview = "false";
        OFFSET_TYPE20 = 0;                      // from where to start
        FETCH_TYPE20 = DEFAULT_TYPE20;          // how many from start
        $("#div_listview_data").unbind('scroll');
        clear_selected_filter_option_task();
    }
}

// get whole table on popup div
var status_2_with_self_assign = 0;
function get_all_searched_list(TableName, JoinTableName, Checksheet_id, no_searchValue) {
    try {
        if (ddl_listview == "false") {
            $("#ddl_list").unbind('scroll');
        }
        $("#div_listview_data").unbind('scroll');

        TableName_G = TableName;
        JoinTableName_G = JoinTableName;
        Checksheet_id_G = Checksheet_id;

        // $("#tbl_search_" + curr_btnSearch_Counter + " tr").remove();
        //$("#ul_search_" + curr_btnSearch_Counter + " li").remove();

        if (curr_type_G == "show_more" || curr_type_G == "dropdown_search" || curr_type_G == "ddl_list_select") { }
        else {
            $("#ddl_search_type20_" + curr_btnSearch_Counter + " option:gt(0)").remove();                  //*********commented for show_more
        }

        var company_id = JSON.parse(storage.getItem('company_id'));
        var user_id = JSON.parse(storage.getItem('user_id'));

        var Condition_Data_Str = $('#hdn_condition_data_' + curr_btnSearch_Counter + '').val();
        if (Condition_Data_Str == "" || Condition_Data_Str == null || Condition_Data_Str == undefined) {
            // in case child searchable is in invoice and parent in main form - 12022025 - mk
            return false;
        }

        var t_Condition_Data_Str = decodeURIComponent(Condition_Data_Str)
        var Condition_Data = JSON.parse(t_Condition_Data_Str);

        var value_new = Condition_Data[0].value_new;
        if (value_new == '' || value_new == null || value_new == undefined) {
            var qs_array = pass_required_values_to_querystring(Condition_Data_Str);
            Condition_Data_Str = qs_array[0];
            Condition_Data = JSON.parse(Condition_Data_Str);
            var columndata_Array = Condition_Data[0].columndata;
            var push_data = Condition_Data[0].push_data;
        }
        else {
            var push_data_str = JSON.stringify(value_new[0].push_data);
            var qs_array = pass_required_values_to_push_array(push_data_str);
            value_new[0].push_data = JSON.parse(qs_array[0]);
            var push_data = value_new[0].push_data;
            var columndata_Array = value_new[0].columndata;
        }

        var ref_valid = qs_array[1];
        show_current_type_loading(curr_btnSearch_Counter);

        if (ref_valid > 0) {
            popup_items_hide_type20();
            //alert1("Please enter required value!");     //removed due to pageload issue
            $("#ddl_loading_" + curr_btnSearch_Counter + "").hide();

            Type20_AutoFill_DDL_Array.shift();
            autofill_type20_dropdown_onload(Type20_AutoFill_DDL_Array);

        }
        else {
            //var Condition_Data = itemObj._checkStrObj(Condition_Data_Str);  		// check_item
            //var columndata_Array = Condition_Data[0].columndata;
            //var push_data = Condition_Data[0].push_data;

            if (push_data == '' || push_data == null || push_data == undefined) {
                push_data = [];
                //var view_style = 'tableview';
            }
            //else {
            //    if (ddl_listview == "true") {
            //        var view_style = 'listview';
            //    }
            //    else {
            //        var view_style = push_data[0].view_style;
            //    }
            //}

            if (ddl_listview == "true") {
                var view_style = 'listview';
            }
            else {
                var view_style = 'dropdownview';                   //searchable is displayed in dropdown view only(25112019)
            }

            if ((columndata_Array == '' || columndata_Array == null || columndata_Array == undefined) && view_style == 'listview') {
                alert1("Please add columndata to get detaiis in listview!");
                loading_hide();
                popup_items_hide_type20();
            } else {
                //if (ddl_listview == "true") {
                //    var view_style = 'listview';
                //}

                if (view_style == "dropdownview") {
                    // dropdown view

                    var checksheet_type_filter = JSON.parse(storage.getItem('checksheet_type_filter'));
                    var selected_val = $("#ddl_search_type20_" + curr_btnSearch_Counter + "").val();
                    if (selected_val != '0' && selected_val != 'All') {
                        selected_ans_G = selected_val;
                        if (checksheet_type_filter == '9' || checksheet_type_filter == '10') {
                            $("#ddl_search_type20_" + curr_btnSearch_Counter + " option:selected").remove();
                        }
                    }
                    var ddl_len = $("#ddl_search_type20_" + curr_btnSearch_Counter + " option").length;
                    //if (checksheet_type_filter == '9' || checksheet_type_filter == '10') {
                    //    if (ddl_len == 1) {
                    //        OFFSET_TYPE20 = ddl_len - 1;
                    //    }
                    //    else {
                    //        OFFSET_TYPE20 = ddl_len - 2;
                    //    }
                    //}
                    //else {
                    //    OFFSET_TYPE20 = ddl_len - 1;
                    //}

                    if (value_new == '' || value_new == null || value_new == undefined) {
                        var FROM = Condition_Data[0].FROM;
                        if (FROM == "" || FROM == null || FROM == undefined) {
                            var param_obj = [];
                            param_obj.push({
                                'TableName': TableName,
                                'JoinTableName': JoinTableName,
                                'Checksheet_id': Checksheet_id,
                                'Company_id': company_id,
                                'Condition': Condition_Data
                            });
                            var a = JSON.stringify(param_obj);
                            TableName_Row = TableName;
                            Checksheet_id_Row = Checksheet_id;

                            var appversion = JSON.parse(storage.getItem('appversion'));
                            var auth = [];
                            auth.push({
                                "username": username,
                                "devicetype": F7_device,
                                "appid": "",
                                "u_c": uniqcode,
                                "appversion": appversion
                            });

                            var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_Dynamic_Table_Data_N', JSON.stringify(param_obj), onsuccess_get_all_searched_list, onfail_get_all_searched_list);
                            getdata.callOtherDomain();
                        } else {
                            var ColumnNameType = Condition_Data[0].ColumName[0].type;
                            var ColumnNameSubData = Condition_Data[0].ColumName[0].subdata;
                            ColumnNameSubData[0].Value_1 = '!!!';
                            ColumnNameSubData[0].Equation = 'not like';
                            if (ColumnNameType == "Json") {
                                Condition_Data[0].where[0].And[0].Json.push(ColumnNameSubData[0]);
                            } else {
                                Condition_Data[0].where[0].And[0].Table.push(ColumnNameSubData[0]);
                            }

                            var limit1 = Condition_Data[0].limit1;
                            if (limit1 == "" || limit1 == null || limit1 == undefined) {
                                var limit1 = [{
                                    'OFFSET': '',
                                    'FETCH': ''
                                }];
                                Condition_Data[0]['limit1'] = limit1;
                            }
                            Condition_Data[0].limit1[0].OFFSET = OFFSET_TYPE20;
                            Condition_Data[0].limit1[0].FETCH = FETCH_TYPE20;


                            var ORDER_BY1 = Condition_Data[0].ORDER_BY;
                            if (ORDER_BY1 == "" || ORDER_BY1 == null || ORDER_BY1 == undefined) {
                                var TN = Condition_Data[0].FROM[0].Table_Name;
                                var CN = Condition_Data[0].orderby;
                                var OT = Condition_Data[0].order_type;

                                if (CN.toLowerCase() == 'valuestring') {
                                    if (TN.toLowerCase() == 'customer_master') {
                                        TN = 'customer_sub_master';
                                    }
                                    if (TN.toLowerCase() == 'user_master') {
                                        TN = 'user_sub_master';
                                    }
                                    if (TN.toLowerCase() == 'task_master') {
                                        TN = 'task_sub_master';
                                    }
                                    if (TN.toLowerCase() == 'questionlog_master') {
                                        TN = 'question_log_sub_master';
                                    }
                                }

                                var ORDER_BY1 = [{
                                    "TYPE": "SIMPLE",
                                    "DATA": [{
                                        "TABLE_NAME": TN,
                                        "COLUMN_NAME": CN,
                                        "TYPE": OT
                                    }]
                                }];
                                Condition_Data[0]['ORDER_BY'] = ORDER_BY1;
                            }

                            var param_obj = [];
                            param_obj.push({
                                'company_id': company_id,
                                'data': JSON.stringify(Condition_Data),
                                'flag': 1, // primary key and single data for (dropdownview)
                                'primary_key': '',
                                'table_name': ''
                            });

                            var a = JSON.stringify(param_obj);
                            TableName_Row = TableName;
                            Checksheet_id_Row = Checksheet_id;

                            var appversion = JSON.parse(storage.getItem('appversion'));
                            var auth = [];
                            auth.push({
                                "username": username,
                                "devicetype": F7_device,
                                "appid": "",
                                "u_c": uniqcode,
                                "appversion": appversion
                            });

                            loading();
                            var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_Dynamic_Filter_Table_Data_N', JSON.stringify(param_obj), onsuccess_get_all_searched_list_New, onfail_get_all_searched_list_New);
                            getdata.callOtherDomain();
                        }
                    }
                    else {
                        //  New Searchable with SearchID

                        var fetch_limit = push_data[0].fetch_limit;
                        if (fetch_limit == "" || fetch_limit == null || fetch_limit == undefined) {
                            fetch_limit = 50;
                        }
                        fetch_limit = parseInt(fetch_limit);
                        DEFAULT_TYPE20 = fetch_limit;

                        var popup_len = $('.popup-type20-dropdown:visible').length;
                        if (popup_len > 0) {
                            if (company_id == 157) {
                                //to resolve show more issue in dropdown which is in type20 dropdown UI in ATC [haresh1.vt - 18052021]
                                value_new[0]['OFFSET'] = 0;
                                value_new[0]['FETCH'] = 500;
                            }
                            else {
                                value_new[0]['OFFSET'] = OFFSET_TYPE20;
                                //value_new[0]['FETCH'] = FETCH_TYPE20;
                                value_new[0]['FETCH'] = fetch_limit;
                            }
                        }
                        else {
                            value_new[0]['OFFSET'] = OFFSET_TYPE20;
                            //value_new[0]['FETCH'] = FETCH_TYPE20;
                            value_new[0]['FETCH'] = fetch_limit;
                        }

                        var self_assignment = value_new[0].self_assignment;
                        if (self_assignment == "true") {
                            var search_val = JSON.parse(storage.getItem('user_name'));
                            value_new[0]['searchValue'] = search_val;
                        }
                        else {
                            value_new[0]['searchValue'] = '';
                        }

                        var popup_len = $('.popup-type20-dropdown:visible').length;
                        if (popup_len > 0) {
                            // possibe show more case 30122022
                        }
                        else {
                            var is_child = 0;
                            var push_array = push_data[0].push_array;
                            for (l = 0; l < push_array.length; l++) {
                                var get_value = push_array[l].value;
                                var value_type = get_value.substring(2, 1);
                                if (value_type == "@") {
                                    // class value 
                                    is_child = 1;
                                    break;
                                }
                            }

                            //var default_value = value_new[0].default_value;
                            //if (default_value == "" || default_value == null || default_value == undefined || TableName == "NO_DEFAULT" || is_child == 1) {
                            //    // don't add default value in case of dropdown click or dont add in case of child searchable 
                            //}
                            //else {
                            //    var default_val = default_value[0];
                            //    var value_type = default_val.substring(2, 1);
                            //    if (value_type == "#") {
                            //        var sub_get_value = default_val.substring(2, default_val.length - 2);
                            //        var search_val = curr_all_data_20[sub_get_value];
                            //        value_new[0]['searchValue'] = search_val;

                            //        var onclick_exist = $("#div_Search_" + curr_btnSearch_Counter + "").attr("onclick");;
                            //        if (onclick_exist == "" || onclick_exist == null || onclick_exist == undefined) { }
                            //        else {
                            //            // remove onclick event on parent change or click event
                            //            $('#div_Search_' + curr_btnSearch_Counter + '').attr('onclick', '');
                            //        }

                            //    }
                            //    $("#div_Search_" + curr_btnSearch_Counter + "").find("div.item-input-field").css("pointer-events", "initial");
                            //}

                        }

                        if (no_searchValue == "no_searchValue") {
                            value_new[0]['searchValue'] = '';
                        }

                        var param_obj = [];
                        param_obj.push({
                            'flag': 1,                       //primary key and single data for (dropdownview)
                            "value_new": value_new,
                            "searchable_id": "ddl_search_type20_" + curr_btnSearch_Counter
                        });

                        loading();
                        var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_Type20Filter', JSON.stringify(param_obj), onsuccess_get_all_searched_list_New, onfail_get_all_searched_list_New);
                        getdata.callOtherDomain();
                    }
                }
                else {
                    // tableview or listview
                    loading();
                    if (value_new == '' || value_new == null || value_new == undefined) {
                        var FROM = Condition_Data[0].FROM;
                        if (FROM == "" || FROM == null || FROM == undefined) {
                            var param_obj = [];
                            param_obj.push({
                                'TableName': TableName,
                                'JoinTableName': JoinTableName,
                                'Checksheet_id': Checksheet_id,
                                'Company_id': company_id,
                                'Condition': Condition_Data
                            });
                            var a = JSON.stringify(param_obj);
                            TableName_Row = TableName;
                            Checksheet_id_Row = Checksheet_id;

                            var appversion = JSON.parse(storage.getItem('appversion'));
                            var auth = [];
                            auth.push({
                                "username": username,
                                "devicetype": F7_device,
                                "appid": "",
                                "u_c": uniqcode,
                                "appversion": appversion
                            });

                            var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_Dynamic_Table_Data_N', JSON.stringify(param_obj), onsuccess_get_all_searched_list, onfail_get_all_searched_list);
                            getdata.callOtherDomain();
                        }
                        else {
                            var From_Table = Condition_Data[0].FROM[0].Table_Name;
                            var limit1 = Condition_Data[0].limit1;
                            if (limit1 != undefined) {
                                Condition_Data[0].limit1[0].OFFSET = OFFSET_TYPE20;
                                Condition_Data[0].limit1[0].FETCH = FETCH_TYPE20;
                            }

                            // temporary handling select all issue (useless data in array @ index 1)
                            if (Condition_Data.length > 1) {
                                Condition_Data.pop();
                            }

                            var param_obj = [];
                            param_obj.push({
                                'company_id': company_id,
                                'data': JSON.stringify(Condition_Data),
                                'flag': 3, // all data for (tableview/listview)
                                'primary_key': '',
                                'table_name': From_Table
                            });
                            var a = JSON.stringify(param_obj);
                            TableName_Row = TableName;
                            Checksheet_id_Row = Checksheet_id;

                            var appversion = JSON.parse(storage.getItem('appversion'));
                            var auth = [];
                            auth.push({
                                "username": username,
                                "devicetype": F7_device,
                                "appid": "",
                                "u_c": uniqcode,
                                "appversion": appversion
                            });

                            var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_Dynamic_Filter_Table_Data_N', JSON.stringify(param_obj), onsuccess_get_all_searched_list, onfail_get_all_searched_list);
                            getdata.callOtherDomain();
                        }
                    }
                    else {
                        // New Searchable with SearchID

                        let has_qr = $("#div_Search_" + curr_btnSearch_Counter + "").find("i.fa-qrcode");
                        if (has_qr.length > 0) {
                            value_new[0]['OFFSET'] = 0;
                            value_new[0]['FETCH'] = 500;
                        }
                        else {
                            value_new[0]['OFFSET'] = OFFSET_TYPE20;
                            value_new[0]['FETCH'] = FETCH_TYPE20;
                        }


                        var is_child = 0;
                        var push_array = push_data[0].push_array;
                        for (l = 0; l < push_array.length; l++) {
                            var get_value = push_array[l].value;
                            var value_type = get_value.substring(2, 1);
                            if (value_type == "@") {
                                // class value 
                                is_child = 1;
                                break;
                            }
                        }

                        var default_value = value_new[0].default_value;
                        if (default_value == "" || default_value == null || default_value == undefined || TableName == "NO_DEFAULT" || is_child == 1) {
                            // don't add default value in case of dropdown click or dont add in case of child searchable 
                            value_new[0]['searchValue'] = '';
                        }
                        else {
                            var default_val = default_value[0];
                            var value_type = default_val.substring(2, 1);
                            if (value_type == "#") {
                                var sub_get_value = default_val.substring(2, default_val.length - 2);
                                var search_val = curr_all_data_20[sub_get_value];
                                value_new[0]['searchValue'] = search_val;
                            }
                        }

                        var param_obj = [];
                        param_obj.push({
                            'flag': 3,                          //all data for (tableview/listview)
                            "value_new": value_new,
                            "searchable_id": "ddl_search_type20_" + curr_btnSearch_Counter
                        });

                        loading();
                        var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_Type20Filter', JSON.stringify(param_obj), onsuccess_get_all_searched_list, onfail_get_all_searched_list);
                        getdata.callOtherDomain();
                    }
                }
            }
        }
    } catch (e) {
        alert1(e + '_get_all_searched_list()');
        loading_hide();
    }
}

// onsuccess get whole table on popup div
function onsuccess_get_all_searched_list(e) {
    try {
        var count = 0; // temporary
        var Data_Json = e.responseText;
        Data_Json = eval('(' + Data_Json + ')');
        var TableName = Data_Json[0].TableName;
        //var message = Data_Json[0].message;

        try {
            var checksheet_json = JSON.parse(Data_Json[0].checksheet_json);
        } catch (e) {
            var checksheet_json = '';
        }
        var status = Data_Json[0].status;
        var table = document.getElementById("tbl_search_" + curr_btnSearch_Counter + "");

        var Condition_Data_Str = $('#hdn_condition_data_' + curr_btnSearch_Counter + '').val();
        var Condition_Data = itemObj._checkStrObj(decodeURIComponent(Condition_Data_Str));  		// check_item

        var value_new = Condition_Data[0].value_new;
        if (value_new == '' || value_new == null || value_new == undefined) {
            var col_type = Condition_Data[0].ColumName[0].type;
            if (col_type == 'Table') {
                var col_name = Condition_Data[0].ColumName[0].subdata[0].Column_Name;
            } else {
                var col_name = Condition_Data[0].ColumName[0].subdata[0].Header;
            }
            var JoinTableName = Condition_Data[0].JoinTableName;
            var push_data = Condition_Data[0].push_data;

            if (push_data == '' || push_data == null || push_data == undefined) {
                push_data = [];
                //var view_style = 'tableview';
            }
            //else {
            //    if (ddl_listview == "true") {
            //        var view_style = 'listview';
            //    }
            //    else {
            //        var view_style = push_data[0].view_style;
            //    }
            //}
        }
        else {
            var push_data = value_new[0].push_data;
            //var view_style = push_data[0].view_style;
            var col_name = value_new[0].Target_Value;
        }

        if (ddl_listview == "true") {
            var view_style = 'listview';
        }
        else {
            var view_style = 'dropdownview';                   //searchable is displayed in dropdown view only(25112019)
        }

        var type20_listview_label = push_data[0].listview_label;
        if (type20_listview_label == "" || type20_listview_label == null || type20_listview_label == undefined) {
            type20_listview_label = "true";
        }

        if (status == 1) {
            //message = eval('(' + message + ')');

            var data = Data_Json[0].data;
            if (data == "" || data == null || data == undefined) {
                var message = eval('(' + Data_Json[0].message + ')');
            }
            else {
                var message = JSON.parse(data);
            }

            // var view_style = 'listview';
            if (view_style == 'listview') {
                //$("#ul_search_" + curr_btnSearch_Counter + " li").remove();
                $("#ddl_search_type20_" + curr_btnSearch_Counter + "").attr('name', '1');
                $('#hdn_filter_popover').attr("blank_checksheet", JSON.stringify(checksheet_json));
            } else if (view_style == 'tableview') {
                var len = $(".cls_show_more").remove();
                if (OFFSET_TYPE20 == 0) {
                    $("#tbl_search_" + curr_btnSearch_Counter + " tr").remove();
                    var header = table.createTHead();
                    var que_tr = table.insertRow(0);
                    var item_tr = table.insertRow(1);
                    var first_tr = table.insertRow(2);
                }
            } else {
                $("#ddl_search_type20_" + curr_btnSearch_Counter + " option:gt(0)").remove();
                $("#ddl_search_type20_" + curr_btnSearch_Counter + "").attr('name', '1');
                var checksheet_type_filter = JSON.parse(storage.getItem('checksheet_type_filter'));
                if (checksheet_type_filter == '9') {
                    var listitem_All = "<option value='All'>Select All</option>";
                    $("#ddl_search_type20_" + curr_btnSearch_Counter + "").append(listitem_All);
                }
            }

            var total_td_Counter = 0;
            var header_Counter = 0;
            var item_Counter = 0;
            var Header_Count = 0;
            var row = 1;

            var myArray = [];
            // create customer data array before creating table to bind values
            // to clickable cell
            for (k = 0; k < message.length; k++) {
                var list_value;
                var obj_id = message[k].id;
                var log_json = message[k].detail;
                var fields_Array = [];
                var header_count = 0;

                var Data_Table_Json = merge_checksheet_template_n_log_form_json(checksheet_json, log_json);         //changes after 3key JSON [21062021]

                for (m = 0; m < Data_Table_Json.length; m++) {
                    if (Data_Table_Json[m].type != "0" && Data_Table_Json[m].type != "5" && Data_Table_Json[m].type != "10") {
                        var field_name = Data_Table_Json[m].prop[0].name;
                        var value = Data_Table_Json[m].ans[0];
                        fields_Array.push({
                            "fieldname": field_name,
                            "value": value
                        });

                        if (field_name.toLowerCase() == col_name.toLowerCase() || (Data_Table_Json[m].que_id == 1 && col_name.toLowerCase() == "customeruniq")) {
                            list_value = value;
                        }
                    }
                }
                myArray.push({
                    "id": obj_id,
                    "cell_value": list_value,
                    "fields": fields_Array
                });
            }


            // find max length JSON from all customers
            var max_Data_Table_Json_len = message[0].detail.length;
            var max_td_counter = 0;
            var max_Data_Table_Json = message[0].detail;
            for (var a = 0; a < message.length; a++) {
                var Data_Table_Json = message[a].detail;
                if (max_Data_Table_Json_len < message[a].detail.length) {
                    max_Data_Table_Json_len = message[a].detail.length;
                    max_Data_Table_Json = message[a].detail;
                }
            }

            for (var c = 0; c < max_Data_Table_Json_len; c++) {
                if (max_Data_Table_Json[c].type != "0" && max_Data_Table_Json[c].type != "5" && max_Data_Table_Json[c].type != "10") {
                    max_td_counter++;
                }
            }

            // all customers for loop
            for (i = 0; i < message.length; i++) {
                var obj_id = message[i].id;
                var log_json = message[i].detail;
                var Checksheet_id = message[i].checksheet_id;
                var Checksheet_type = message[i].checksheet_type_id;
                var name_Counter1 = 0;

                var Data_Table_Json = merge_checksheet_template_n_log_form_json(checksheet_json, log_json);         //changes after 3key JSON [21062021]

                if (view_style == 'listview') {
                    // ///////////--------List View----------*********/////
                    // particular customer for loop

                    var value_new = Condition_Data[0].value_new;
                    if (value_new == '' || value_new == null || value_new == undefined) {
                        var columndata_Array = Condition_Data[0].columndata;
                    }
                    else {
                        var columndata_Array = value_new[0].columndata;
                    }
                    var param = '';

                    $('#hdn_filter_popover').val(JSON.stringify(message[i]));

                    var scan_value = myArray[i].cell_value;

                    var option = '';
                    var listitem = '<li scan_value="' + scan_value + '" style="padding: 1% 2%;list-style-type:none; border:1px solid #ccc;"><table id="tbl_type20_listpopup" style="font-size:11pt;width:100%;white-space: initial; word-break: break-word;vertical-align:top;">';
                    for (p = 0; p < columndata_Array.length; p++) {
                        var row_qid = columndata_Array[p].qid;
                        var row_header = columndata_Array[p].header;
                        var row_format = columndata_Array[p].format;
                        if (row_format == 'italic') {
                            var f_style = 'font-style';
                        } else {
                            var f_style = 'text-decoration';
                        }
                        var row_font_size = columndata_Array[p].font_size;
                        var row_color = columndata_Array[p].color;

                        if (p % 2 == 0) {
                            var text_align = "text-align: left;"
                        }
                        else {
                            var text_align = "text-align: right;"
                        }


                        var qid_found = 0;
                        for (j = 0; j < Data_Table_Json.length; j++) {
                            var curr_qid = Data_Table_Json[j].que_id;
                            if (curr_qid == row_qid) {
                                qid_found = 1;
                                break;
                            }
                        }

                        //var type20_listview_label = "false"
                        if (type20_listview_label == "true") {
                            //listview with label
                            if (qid_found == 1) {
                                var field_name = Data_Table_Json[j].prop[0].name;
                                if (Data_Table_Json[j].type == "20") {
                                    var Answer = Data_Table_Json[j].ans[0];
                                } else if (Data_Table_Json[j].type == "22") {
                                    var Answer = "(Type22 ANS JSON)";
                                } else {
                                    var Answer = Data_Table_Json[j].ans;
                                }
                                if (Data_Table_Json[j].type != "0" && Data_Table_Json[j].type != "5" && Data_Table_Json[j].type != "10") {
                                    if (field_name.toLowerCase() == col_name.toLowerCase() || (Data_Table_Json[j].que_id == 1 && col_name.toLowerCase() == "customeruniq")) {
                                        // clickable column
                                        // find and bind customer details to
                                        // click-able cell
                                        for (n = 0; n < myArray.length; n++) {
                                            var id = myArray[n].id;
                                            var cell_value = myArray[n].cell_value;

                                            if (id == obj_id) {
                                                var field_Array = myArray[n].fields;
                                                var paramData = JSON.stringify(field_Array);
                                                if (ddl_listview == "true") {
                                                    var param = "set_dropdown_data('" + encodeURIComponent(cell_value) + "', '" + curr_btnSearch_Counter + "','', '','', this)";

                                                    var new_cell_value = encodeURIComponent(cell_value)
                                                    option += "<option value=" + new_cell_value + " value1=" + id + ">" + cell_value + "</option>";         //for listview filter show more selection issue(mobi.app1[14032020])
                                                }
                                                else {
                                                    param = 'get_data_to_fill("' + n + '", "' + id + '","' + curr_btnSearch_Counter + '")';
                                                }
                                                listitem += '<tr><td><input type="hidden" id="hdn_type20_popup_row_data_' + n + '" name=\'' + cell_value + '\' value=\'' + paramData
                                                    + '\'></td><td></td></tr>';
                                                listitem += '<tr><td style="text-align: left; width: 45%;font-weight:bold; color:#000;' + f_style + ':' + row_format + ';" > ' + row_header
                                                    + ':</td><td style="text-align: right; width: 45%;"><a style="font-weight:bold; text-decoration:underline; font-size:11pt" onclick='
                                                    + param + '>' + Answer + '</a></td></tr>';
                                                break;
                                            }
                                        }

                                        if (i == 0) {
                                            // set attribute to quick search from listview by which column search should be done
                                            $("#ul_search_" + curr_btnSearch_Counter + "").attr("clickable_header", field_name);
                                        }

                                    } else {
                                        // other columns
                                        listitem += '<tr style="vertical-align: top;"><td style="text-align: left; width: 45%;font-weight:bold; color: #000;' + f_style + ':' + row_format + ';">' + row_header + ':</td><td style="text-align: right; width: 45%;">' + Answer + '</td></tr>';
                                    }
                                }
                            } else {
                                // when qid is not found in json
                                listitem += '<tr><td style="text-align: left; width: 45%; font-weight:bold; color:#000" >' + row_header
                                    + ':</td><td style="text-align: right; width: 45%;">N/A</td></tr>';
                            }
                        }
                        else {
                            //listview without label
                            if (p % 2 == 0) {
                                listitem += '<tr style="vertical-align: top;">';
                            }

                            if (qid_found == 1) {
                                var field_name = Data_Table_Json[j].prop[0].name;
                                if (Data_Table_Json[j].type == "20") {
                                    var Answer = Data_Table_Json[j].ans[0];
                                } else if (Data_Table_Json[j].type == "22") {
                                    var Answer = "(Type22 ANS JSON)";
                                } else {
                                    var Answer = Data_Table_Json[j].ans;
                                }

                                if (Data_Table_Json[j].type != "0" && Data_Table_Json[j].type != "5" && Data_Table_Json[j].type != "10") {
                                    if (field_name.toLowerCase() == col_name.toLowerCase() || (Data_Table_Json[j].que_id == 1 && col_name.toLowerCase() == "customeruniq")) {
                                        // clickable column
                                        // find and bind customer details to
                                        // click-able cell
                                        for (n = 0; n < myArray.length; n++) {
                                            var id = myArray[n].id;
                                            var cell_value = myArray[n].cell_value;

                                            if (id == obj_id) {
                                                var field_Array = myArray[n].fields;
                                                var paramData = JSON.stringify(field_Array);
                                                param = 'get_data_to_fill("' + n + '", "' + id + '","' + curr_btnSearch_Counter + '")';
                                                listitem += '<input type="hidden" id="hdn_type20_popup_row_data_' + n + '" name=\'' + cell_value + '\' value=\'' + paramData + '\'>';
                                                listitem += '<td style="' + text_align + ' width: 45%;"><a style="font-weight:bold; text-decoration:none; color: #000; font-size:11pt" onclick='
                                                    + param + '>' + Answer + '</a></td>';
                                                break;
                                            }
                                        }
                                    } else {
                                        // other columns
                                        var param_ellipsis = "";
                                        //var param_ellipsis = 'onclick=type20_read_more(this)';
                                        listitem += "<td style='" + text_align + " width: 45%'><div " + param_ellipsis + " class='text_ellipsis'>" + Answer + "</div></td>";
                                    }
                                }
                            } else {
                                // when qid is not found in json
                                listitem += '<td style="' + text_align + ' width: 45%;">N/A</td>';
                            }
                            if (p % 2 == 0) { }
                            else {
                                listitem += '</tr>';
                            }

                        }
                    }
                    listitem += '</table></li>';

                    $("#ul_search_" + curr_btnSearch_Counter + "").append(listitem);
                    $("#ul_search_" + curr_btnSearch_Counter + " li:last-child").attr('onclick', param);

                    let val_exists = $("#ddl_search_type20_" + curr_btnSearch_Counter + " option").filter(function () { return $(this).text() == cell_value; }).length;
                    if (val_exists) {
                        // value already exist
                    }
                    else {
                        $("#ddl_search_type20_" + curr_btnSearch_Counter + "").append(option);
                    }
                }
                else if (view_style == 'tableview') {
                    // ///////////--------Table View----------/////
                    if (OFFSET_TYPE20 == 0) {
                        var value_tr = table.insertRow(i + 2);
                    } else {
                        var len = $("#tbl_search_" + curr_btnSearch_Counter + " tr").length;
                        var value_tr = table.insertRow(len - 1);
                        Header_Count = 1;
                    }
                    var param = '';

                    // particular customer for loop
                    for (j = 0; j < Data_Table_Json.length; j++) {
                        if (Data_Table_Json[j].type == "20") {
                            var Answer = Data_Table_Json[j].ans[0];
                        } else if (Data_Table_Json[j].type == "22") {
                            var Answer = "(Type22 ANS JSON)";
                        } else {
                            var Answer = Data_Table_Json[j].ans;
                        }

                        if (Data_Table_Json[j].type != "0" && Data_Table_Json[j].type != "5" && Data_Table_Json[j].type != "10") {
                            if (Header_Count == 0) {
                                // adding blue header
                                try {
                                    var Header_h_td = que_tr.insertCell(header_Counter);
                                }
                                catch (e) {
                                    alert1(e + 'header');
                                }
                                if (checksheet_json == '' || checksheet_json == null || checksheet_json == undefined) {
                                    var column_header = Data_Table_Json[j].Excel_Header;
                                } else {
                                    try {
                                        var column_header = checksheet_json[j].Excel_Header;
                                    } catch (e) {
                                        var column_header = Data_Table_Json[j].Excel_Header;
                                    }
                                }
                                if (column_header == '' || column_header == '' || column_header == undefined) {
                                    var column_header = Data_Table_Json[j].prop[0].name;
                                }


                                Header_h_td.innerHTML = "<center><span style='font-weight:bold'>" + column_header + "</span> </center><input type='hidden' id='spheader_"
                                    + curr_btnSearch_Counter + "_" + name_Counter1 + "' value='" + Data_Table_Json[j].prop[0].name + "'>";
                                Header_h_td.style.height = "30px";
                                Header_h_td.style.verticalAlign = "middle";
                                Header_h_td.style.background = color_btn;
                                Header_h_td.style.color = font_color_button;
                                header_Counter++;

                                var Values_user_td = item_tr.insertCell(name_Counter1);

                                // adding search box
                                var searchable = Data_Table_Json[j].prop[0].searchkey;
                                if (searchable == 1) {
                                    Values_user_td.innerHTML = "<input type='text' id='txt_popup_search_col_" + curr_btnSearch_Counter + "_" + name_Counter1
                                        + "' name='" + Data_Table_Json[j].que_id + "' style='margin:5px; padding:2px; text-align:center'/>";
                                } else {
                                    Values_user_td.innerHTML = "<input type='text' id='txt_popup_search_col_" + curr_btnSearch_Counter + "_" + name_Counter1
                                        + "' name='" + Data_Table_Json[j].que_id + "' style='margin:5px; padding:2px; text-align:center; background:lightgray' disabled/>";
                                }

                                Values_user_td.style.verticalAlign = "middle";
                            }
                            var field_name = Data_Table_Json[j].prop[0].name;
                            var Values_user_td = value_tr.insertCell(name_Counter1);
                            Values_user_td.style.padding = "7px";
                            Values_user_td.style.verticalAlign = "middle";

                            if (field_name.toLowerCase() == col_name.toLowerCase() || (Data_Table_Json[j].que_id == 1 && col_name.toLowerCase() == "customeruniq")) {
                                // clickable column

                                // find and bind customer details to click-able
                                // cell
                                for (n = 0; n < myArray.length; n++) {
                                    var id = myArray[n].id;
                                    var cell_value = myArray[n].cell_value;

                                    if (id == obj_id) {
                                        var field_Array = myArray[n].fields;
                                        var paramData = JSON.stringify(field_Array);
                                        param = 'get_data_to_fill("' + n + '", "' + id + '","' + curr_btnSearch_Counter + '")';
                                        Values_user_td.innerHTML = '<center><input type="hidden" id="hdn_type20_popup_row_data_' + n + '" name=\''
                                            + cell_value + '\' value=\'' + paramData + '\'><a style="font-weight:bold; text-decoration:underline" onclick='
                                            + param + '>' + Answer + '</a></center>';
                                        break;
                                    } else {
                                        Values_user_td.innerHTML = '<center><a>' + Answer + '</a></center>';
                                    }
                                }
                            } else {
                                Values_user_td.innerHTML = "<center>" + Answer + "</center>";
                            }
                            name_Counter1++;
                        }
                    }

                    //add new column
                    if (name_Counter1 != max_td_counter) {
                        if (name_Counter1 < max_td_counter) {
                            var add_extra_td = max_td_counter - name_Counter1;
                            for (var b = 0; b < add_extra_td; b++) {
                                if (Header_Count == 0) {
                                    //add new header td
                                    var new_header_td = que_tr.insertCell(header_Counter);
                                    header_Counter++;
                                    var new_column_header = max_Data_Table_Json[header_Counter * 2].prop[0].name;
                                    new_header_td.innerHTML = "<center><span style='font-weight:bold'>" + new_column_header + "</span> </center><input type='hidden' id='spheader_"
                                        + curr_btnSearch_Counter + "_" + name_Counter1 + "' value='" + new_column_header + "'>";


                                    // adding search box
                                    var Values_user_td = item_tr.insertCell(name_Counter1);

                                    var searchable = max_Data_Table_Json[header_Counter * 2].prop[0].searchkey;
                                    if (searchable == 1) {
                                        Values_user_td.innerHTML = "<input type='text' id='txt_popup_search_col_" + curr_btnSearch_Counter + "_" + name_Counter1
                                            + "' name='" + max_Data_Table_Json[header_Counter * 2].que_id + "' style='margin:5px; padding:2px; text-align:center'/>";
                                    } else {
                                        Values_user_td.innerHTML = "<input type='text' id='txt_popup_search_col_" + curr_btnSearch_Counter + "_" + name_Counter1
                                            + "' name='" + max_Data_Table_Json[header_Counter * 2].que_id + "' style='margin:5px; padding:2px; text-align:center; background:lightgray' disabled/>";
                                    }

                                    Values_user_td.style.verticalAlign = "middle";
                                }
                                //add blank td
                                var blank_td = value_tr.insertCell(name_Counter1);
                                blank_td.innerHTML = '';
                                name_Counter1++;
                            }
                            Header_Count = 1;
                        }
                        else {
                            Header_Count = 0;
                        }

                    }

                    $("#tbl_search_" + curr_btnSearch_Counter + " tr:eq(" + (i + 2) + ")").attr('onclick', param);

                    // put "search" button at the end
                    if (Header_Count == 0) {
                        var Header_h_td = que_tr.insertCell(header_Counter);
                        Header_h_td.innerHTML = "<center></center>";
                        Header_h_td.style.height = "30px";
                        Header_h_td.style.verticalAlign = "middle";
                        Header_h_td.style.background = color_btn;
                        Header_h_td.style.color = font_color_button;

                        var Values_user_td = item_tr.insertCell(header_Counter);
                        var param = "\"popup_column_search('0','" + TableName + "','" + JoinTableName + "','" + Checksheet_id + "', '" + Checksheet_type + "')\"";

                        Values_user_td.innerHTML = '<a class="button button-fill button-raised" onclick=' + param + ' style="margin:5px" >Search</a>';
                        Values_user_td.style.verticalAlign = "middle";
                        header_Counter++;
                        Header_Count = 1;
                    }
                    var Values_user_td = value_tr.insertCell(name_Counter1);
                    Values_user_td.innerHTML = "<center></center>";
                    Values_user_td.style.verticalAlign = "middle";



                }
                else {
                    // ////------ dropdownview ----------/
                    for (j = 0; j < Data_Table_Json.length; j++) {
                        if (Data_Table_Json[j].type == "20") {
                            var Answer = Data_Table_Json[j].ans[0];
                        } else if (Data_Table_Json[j].type == "22") {
                            var Answer = "(Type22 ANS JSON)";
                        } else {
                            var Answer = Data_Table_Json[j].ans;
                        }

                        if (Data_Table_Json[j].type != "0" && Data_Table_Json[j].type != "5" && Data_Table_Json[j].type != "10") {
                            var field_name = Data_Table_Json[j].prop[0].name;
                            if (field_name.toLowerCase() == col_name.toLowerCase() || (Data_Table_Json[j].que_id == 1 && col_name.toLowerCase() == "customeruniq")) {
                                // find and bind customer details to click-able cell
                                for (n = 0; n < myArray.length; n++) {
                                    var id = myArray[n].id;
                                    var cell_value = myArray[n].cell_value;

                                    if (id == obj_id) {
                                        var field_Array = myArray[n].fields;
                                        var paramData = JSON.stringify(field_Array);
                                        param = 'get_data_to_fill("' + n + '", "' + id + '","' + curr_btnSearch_Counter + '")';
                                        listitem = '';
                                        listitem += "<option value=" + id + ">" + Answer + "</option>";
                                        var listitem_new = '<input type="hidden" id="hdn_type20_popup_row_data_' + curr_btnSearch_Counter + '_' + n
                                            + '" name=\'' + cell_value + '\' value=\'' + paramData + '\'>';
                                        $("#ddl_search_type20_" + curr_btnSearch_Counter + "").append(listitem);
                                        $("#div_Search_" + curr_btnSearch_Counter + "").append(listitem_new);
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    // $("#ddl_search_type20_" + curr_btnSearch_Counter + "")
                    // .attr('size', 1);
                }
            }
            if (view_style == 'dropdownview') {
                Type20_AutoFill_DDL_Array.shift();
                hide_current_type_loading(curr_btnSearch_Counter);
                $('#div_Search_' + curr_btnSearch_Counter + '').attr('onclick', '');
                if (Type20_AutoFill_DDL_Array.length > 0) {
                    autofill_type20_dropdown_onload(Type20_AutoFill_DDL_Array);
                }
            }
            else if (view_style == "tableview") {
                if (curr_type_G == "all") {
                    if (message.length < FETCH_TYPE20) {
                        $(".cls_show_more").remove();
                    } else {
                        var len = $("#tbl_search_" + curr_btnSearch_Counter + " tr").length;
                        var Show_More_tr = table.insertRow(len - 1);
                        Show_More_tr.className = "cls_show_more";
                        var Show_More_td = Show_More_tr.insertCell(0);
                        Show_More_td.innerHTML = '<img style="cursor:pointer; width:22px; height:22px" onclick="Show_More()" src="images/show_more.gif" style="margin-top:2px">';
                        Show_More_td.style.paddingTop = "3px";
                        Show_More_td.style.paddingLeft = "10px";
                        Show_More_td.style.textAlign = "left";
                        var td_count = $("#tbl_search_" + curr_btnSearch_Counter + " tr:first > td").length;
                        Show_More_td.colSpan = td_count;
                    }
                }
            }
            else if (view_style == "listview") {
                if (message.length < FETCH_TYPE20) {

                    let listview_len = $("#ul_search_" + curr_btnSearch_Counter + " li").length;
                    if (listview_len == 1) {
                        //// autoselect first listview item in case single found - mk - 30042025
                        //$("#ul_search_" + curr_btnSearch_Counter + " li").find("a").trigger("click");
                    }

                }
                else {
                    $("#div_listview_data").scroll(function () {
                        var offsetHeight = document.getElementById("div_listview_data").offsetHeight;
                        var scrollTop = document.getElementById("div_listview_data").scrollTop;
                        var scrollHeight = document.getElementById("div_listview_data").scrollHeight;
                        if (parseInt(scrollTop) === (parseInt(scrollHeight) - parseInt(offsetHeight))) {
                            Show_More();
                        }
                    });
                }

                if (ddl_search_type == "scanner") {
                    // scan click
                    let scan_li = $("#ul_search_" + curr_btnSearch_Counter + " li[scan_value='" + searchable_scan_code + "']").length;
                    if (scan_li > 0) {
                        $("#ul_search_" + curr_btnSearch_Counter + " li[scan_value='" + searchable_scan_code + "']").trigger("click");
                    }
                    else {
                        // hide listview popup
                        alert("QR Code not found!")
                        popup_items_hide_type20();
                        $("#ddl_search_type20_" + curr_btnSearch_Counter + "").val("0");
                        $("#div_Search_" + curr_btnSearch_Counter + "").find("#tbl_type20_listpopup").remove();
                    }
                }
                searchable_scan_code = "";
            }

        } else {
            // var view_style = 'listview';
            if (view_style == 'listview') {
                $("#ul_search_" + curr_btnSearch_Counter + " li").remove();
                var listitem = '<li style="padding:1% 2%; list-style-type:none; border:1px solid #ccc">No Data Found !</li>';
                $("#ul_search_" + curr_btnSearch_Counter + "").append(listitem);

                // add create and create new option when search string is not found on server in listview
                if (glob_type20_cust_checksheetid == '' || glob_type20_cust_checksheetid == null || glob_type20_cust_checksheetid == undefined || glob_type20_cust_checksheetid == "0" || glob_type20_cust_checksheetid == "undefined") { }
                else {
                    // get customer name
                    var ddl_sys_search_val = $("#lst_filter li[alt='1']").find(".item-text").html();
                    if (ddl_sys_search_val == "" || ddl_sys_search_val == null || ddl_sys_search_val == undefined) {
                        ddl_sys_search_val = "";
                    }

                    var param = "get_popup_to_add_item_online(" + glob_type20_cust_checksheetid + ", '" + glob_add_cust_from_search + "', '', '" + ddl_sys_search_val + "', 'create_cust')";
                    var param_new = "get_popup_to_add_item_online(" + glob_type20_cust_checksheetid + ", '" + glob_add_cust_from_search + "', '', '" + ddl_sys_search_val + "', 'create_new_cust')";
                    let li_txt = '<li class="item-content li-new-cust" style="float:left; margin-top: 5px">';
                    li_txt += '<div class="div-type20-new-cust"><a id="ddl_cust_creation" onclick="' + param + '" class="back link icon-only cls-new-cust">Create</a></div>';
                    li_txt += '</li>';
                    li_txt += '<li class="item-content li-new-cust" style="float: right; margin-top: 5px;;display:none;">';                                 //---display:none for ATC coz added + btn for create new [FT-25072025]
                    li_txt += '<div class="div-type20-new-cust"><a id="ddl_new_cust_creation" onclick="' + param_new + '" class="back link icon-only cls-new-cust">Create New</a></div>';
                    li_txt += '</li>';

                    $(".li-new-cust").remove();
                    $("#ul_search_" + curr_btnSearch_Counter + "").append(li_txt);
                }

            } else if (view_style == 'tableview') {
                if (OFFSET_TYPE20 == 0) {
                    var tr_count = document.getElementById("tbl_search_" + curr_btnSearch_Counter + "").getElementsByTagName("tr").length;
                    if (tr_count == 0) {
                        $("#tbl_search_" + curr_btnSearch_Counter + "").attr("width", "100%");
                        $("#tbl_search_" + curr_btnSearch_Counter + " tr:gt(0)").remove();
                        var tr = table.insertRow(0);
                    } else {
                        $("#tbl_search_" + curr_btnSearch_Counter + " tr:gt(1)").remove();
                        var tr = table.insertRow(2);
                    }
                    var no_row = tr.insertCell(0);
                    var td_count = $("#tbl_search_" + curr_btnSearch_Counter + " tr:first > td").length;
                    no_row.colSpan = td_count;
                    no_row.style.height = "30px";
                    no_row.style.border = "1px solid gray";
                    no_row.innerHTML = "<center><b>No Data Found !</b></center>";
                } else {
                    var len = $(".cls_show_more").remove();
                }
            } else {
                $("#ddl_search_type20_" + curr_btnSearch_Counter + " option:gt(0)").remove();
                var listitem = '<option value="0">No Data Found !</option>';
                $("#ddl_search_type20_" + curr_btnSearch_Counter + "").append(listitem);
                Type20_AutoFill_DDL_Array.shift();
                hide_current_type_loading(curr_btnSearch_Counter);
                $('#div_Search_' + curr_btnSearch_Counter + '').attr('onclick', '');
            }
        }

        myApp.closeModal('.popup-type20-main-filter');
        //if (Type20_AutoFill_DDL_Array.length == 0) {
        loading_hide();
        //}
    } catch (e) {
        alert1(e + '_onsuccess_get_all_searched_list()');
        loading_hide();
    }
}


function type20_read_more(t_obj) {
    var white_space = $(t_obj).css('white-space');

    if (white_space == 'initial' || white_space == 'normal') {
        $(t_obj).css('white-space', 'nowrap');
    }
    else {
        $(t_obj).css('white-space', 'initial');
    }
}

// error
function onfail_get_all_searched_list(e) {
    try {
        alert1("Network Error Please try again !");
        popup_items_hide_type20();
        loading_hide();

        var Condition_Data_Str = $('#hdn_condition_data_' + curr_btnSearch_Counter + '').val();
        var Condition_Data = itemObj._checkStrObj(decodeURIComponent(Condition_Data_Str));  		// check_item
        var push_data = Condition_Data[0].push_data;
        if (push_data == '' || push_data == null || push_data == undefined) {
            push_data = [];
            //var view_style = 'tableview';
        }
        //else {
        //    if (ddl_listview == "true") {
        //        var view_style = 'listview';
        //    }
        //    else {
        //        var view_style = push_data[0].view_style;
        //    }
        //}

        if (ddl_listview == "true") {
            var view_style = 'listview';
        }
        else {
            var view_style = 'dropdownview';                   //searchable is displayed in dropdown view only(25112019)
        }

        if (view_style == 'listview') {
            $("#ul_search_" + curr_btnSearch_Counter + " li").remove();
            var listitem = '<li style="padding:1% 2%; list-style-type:none; border:1px solid #ccc">No Data Found !</li>';
            $("#ul_search_" + curr_btnSearch_Counter + "").append(listitem);
        } else if (view_style == 'tableview') {
            var table = document.getElementById("tbl_search_" + curr_btnSearch_Counter + "");
            if (OFFSET_TYPE20 == 0) {
                var tr_count = document.getElementById("tbl_search_" + curr_btnSearch_Counter + "").getElementsByTagName("tr").length;
                if (tr_count == 0) {
                    $("#tbl_search_" + curr_btnSearch_Counter + "").attr("width", "100%");
                    $("#tbl_search_" + curr_btnSearch_Counter + " tr:gt(0)").remove();
                    var tr = table.insertRow(0);
                } else {
                    $("#tbl_search_" + curr_btnSearch_Counter + " tr:gt(1)").remove();
                    var tr = table.insertRow(2);
                }
                var no_row = tr.insertCell(0);
                var td_count = $("#tbl_search_" + curr_btnSearch_Counter + " tr:first > td").length;
                no_row.colSpan = td_count;
                no_row.style.height = "30px";
                no_row.style.border = "1px solid gray";
                no_row.innerHTML = "<center><b>No Data Found !</b></center>";
            } else {
                var len = $(".cls_show_more").remove();
            }

        } else {
            $("#ddl_search_type20_" + curr_btnSearch_Counter + " option:gt(0)").remove();
            var listitem = '<option value="0">No Data Found !</option>';
            $("#ddl_search_type20_" + curr_btnSearch_Counter + "").append(listitem);
            hide_current_type_loading(curr_btnSearch_Counter);
        }

        if (Type20_AutoFill_DDL_Array.length > 0) {
            var t_new_id = Type20_AutoFill_DDL_Array[0].new_id;
            var t_TableName = Type20_AutoFill_DDL_Array[0].TableName;
            var t_JoinTableName = Type20_AutoFill_DDL_Array[0].JoinTableName;
            var t_Checksheet_id = Type20_AutoFill_DDL_Array[0].Checksheet_id;
            var t_window_style = Type20_AutoFill_DDL_Array[0].window_style;
            var t_view_style = Type20_AutoFill_DDL_Array[0].view_style;

            var param = "popup_search_items_show_type20('" + t_new_id + "', '" + t_TableName + "', '" + t_JoinTableName + "','"
                + t_Checksheet_id + "','" + t_window_style + "','" + t_view_style + "')";
            $('#div_Search_' + t_new_id + '').attr('onclick', param);
            Type20_AutoFill_DDL_Array.shift();
            hide_current_type_loading(t_new_id);
            autofill_type20_dropdown_onload(Type20_AutoFill_DDL_Array);
        }
    } catch (e) {
        alert1(e + '_onfail_get_all_searched_list()');
        loading_hide();
    }
}

//changes for advance filter searchable control [08042022]
function get_data_by_dropdown_search_PRE(temp_btnSearch_Counter, TableName, JoinTableName, Checksheet_id) {
    if (glob_type20_popup_flag == "adv_filter") {
        get_data_by_dropdown_search_adv_filter()
    }
    else {
        get_data_by_dropdown_search(temp_btnSearch_Counter, TableName, JoinTableName, Checksheet_id);
    }
}

// get data by dropdown search (for dropdown only)
function get_data_by_dropdown_search(temp_btnSearch_Counter, TableName, JoinTableName, Checksheet_id) {
    try {
        curr_type_G = "dropdown_search";
        curr_btnSearch_Counter = temp_btnSearch_Counter;
        TableName_G = TableName;
        JoinTableName_G = JoinTableName;
        Checksheet_id_G = Checksheet_id;
        $("#ddl_list").unbind('scroll');

        var search_val = $("#div_Search_" + curr_btnSearch_Counter + " :input[type='text']").val();

        var ddl_sys_search_val = $("#F7_type20_ddl_Search :input[type='search']").val();                    //system search in dropdown
        if (ddl_sys_search_val == '' || ddl_sys_search_val == null || ddl_sys_search_val == undefined) { }
        else {
            search_val = ddl_sys_search_val;
        }

        //if (search_val == '' || search_val == null || search_val == undefined) {
        //    alert1("Please enter search value!");
        //}
        //else {
        var val_exists = $("#ddl_search_type20_" + curr_btnSearch_Counter + " option").filter(function () { return $(this).text() == search_val; }).length;
        if (val_exists && ddl_search_type == "normal") {
            //alert1('Search value is already exist !');
        }
        else {
            var Condition_Data_Str = $('#hdn_condition_data_' + curr_btnSearch_Counter + '').val();

            var t_Condition_Data_Str = decodeURIComponent(Condition_Data_Str)
            var Condition_Data = JSON.parse(t_Condition_Data_Str);

            var value_new = Condition_Data[0].value_new;
            if (value_new == '' || value_new == null || value_new == undefined) {
                var qs_array = pass_required_values_to_querystring(Condition_Data_Str);
                Condition_Data_Str = qs_array[0];
                Condition_Data = JSON.parse(Condition_Data_Str);
            }
            else {
                var push_data_str = JSON.stringify(value_new[0].push_data);
                var qs_array = pass_required_values_to_push_array(push_data_str);
                value_new[0].push_data = JSON.parse(qs_array[0]);
            }

            var ref_valid = qs_array[1];

            show_current_type_loading(curr_btnSearch_Counter);
            if (ref_valid > 0) {
                popup_items_hide_type20();
                alert1("Please enter required value!");
                $("#ddl_loading_" + curr_btnSearch_Counter + "").hide();
            }
            else {

                //var selected_val = $("#ddl_search_type20_" + curr_btnSearch_Counter + "").val();
                //if (selected_val != '0' && selected_val != 'All') {
                //    selected_ans_G = selected_val;
                //    $("#ddl_search_type20_" + curr_btnSearch_Counter + " option:selected").remove();
                //}
                var ddl_len = $("#ddl_search_type20_" + curr_btnSearch_Counter + " option").length;
                var checksheet_type_filter = JSON.parse(storage.getItem('checksheet_type_filter'));
                //if (checksheet_type_filter == '9' || checksheet_type_filter == '10') {
                //    if (ddl_len == 1) {
                //        OFFSET_TYPE20 = ddl_len - 1;
                //    }
                //    else {
                //        OFFSET_TYPE20 = ddl_len - 2;
                //    }
                //}
                //else {
                //    OFFSET_TYPE20 = ddl_len - 1;
                //}

                if (value_new == '' || value_new == null || value_new == undefined) {
                    var ColumnNameType = Condition_Data[0].ColumName[0].type;
                    var ColumnNameSubData = Condition_Data[0].ColumName[0].subdata;
                    ColumnNameSubData[0].Value_1 = search_val;
                    if (ColumnNameType == "Json") {
                        //Condition_Data[0].where[0].And[0].Json.push(ColumnNameSubData[0]);
                        Condition_Data[0].where[0].And[0].Json.unshift(ColumnNameSubData[0]);
                    }
                    else {
                        //Condition_Data[0].where[0].And[0].Table.push(ColumnNameSubData[0]);
                        Condition_Data[0].where[0].And[0].Table.unshift(ColumnNameSubData[0]);
                    }

                    var limit1 = Condition_Data[0].limit1;
                    if (limit1 == "" || limit1 == null || limit1 == undefined) {
                        var limit1 = [{
                            'OFFSET': '',
                            'FETCH': ''
                        }];
                        Condition_Data[0]['limit1'] = limit1;
                    }
                    Condition_Data[0].limit1[0].OFFSET = 0;
                    Condition_Data[0].limit1[0].FETCH = DEFAULT_TYPE20;
                    var ORDER_BY1 = Condition_Data[0].ORDER_BY;
                    if (ORDER_BY1 == "" || ORDER_BY1 == null || ORDER_BY1 == undefined) {
                        var TN = Condition_Data[0].FROM[0].Table_Name;
                        var CN = Condition_Data[0].orderby;
                        var OT = Condition_Data[0].order_type;

                        if (CN.toLowerCase() == 'valuestring') {
                            if (TN.toLowerCase() == 'customer_master') {
                                TN = 'customer_sub_master';
                            }
                            if (TN.toLowerCase() == 'user_master') {
                                TN = 'user_sub_master';
                            }
                            if (TN.toLowerCase() == 'task_master') {
                                TN = 'task_sub_master';
                            }
                            if (TN.toLowerCase() == 'questionlog_master') {
                                TN = 'question_log_sub_master';
                            }
                        }

                        var ORDER_BY1 = [{
                            "TYPE": "SIMPLE",
                            "DATA": [{
                                "TABLE_NAME": TN,
                                "COLUMN_NAME": CN,
                                "TYPE": OT
                            }]
                        }];
                        Condition_Data[0]['ORDER_BY'] = ORDER_BY1;
                    }

                    var company_id = JSON.parse(storage.getItem('company_id'));
                    var param_obj = [];
                    param_obj.push({
                        'company_id': company_id,
                        'data': JSON.stringify(Condition_Data),
                        'flag': 1,     //primary key and single data for (dropdownview)
                        'primary_key': '',
                        'table_name': ''
                    });

                    loading();
                    var a = JSON.stringify(param_obj);
                    var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_Dynamic_Filter_Table_Data_N', JSON.stringify(param_obj), onsuccess_get_all_searched_list_New, onfail_get_all_searched_list_New);
                    getdata.callOtherDomain();
                }
                else {
                    // New Searchable with SearchID
                    //value_new[0]['OFFSET'] = 0;
                    value_new[0]['OFFSET'] = OFFSET_TYPE20;
                    value_new[0]['FETCH'] = DEFAULT_TYPE20;
                    value_new[0]['searchValue'] = search_val;

                    var param_obj = [];
                    param_obj.push({
                        'flag': 1,              //primary key and single data for (dropdownview)
                        "value_new": value_new,
                        "searchable_id": "ddl_search_type20_" + curr_btnSearch_Counter
                    });

                    loading();
                    var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_Type20Filter', JSON.stringify(param_obj), onsuccess_get_all_searched_list_New, onfail_get_all_searched_list_New);
                    getdata.callOtherDomain();
                }
            }
        }
        //}
    }
    catch (e) {
        alert1(e + '_get_data_by_dropdown_search()');
        loading_hide();
    }
}

var single_opt_onchange_ary = [];

// onsucess get all searched list new (FROM key is included) - for dropdown only
function onsuccess_get_all_searched_list_New(e) {
    try {
        $("#ddl_lbl_search_type20_" + curr_btnSearch_Counter + "").html('Select Value');
        var Data_Json = e.responseText;
        Data_Json = eval('(' + Data_Json + ')');
        var status = Data_Json[0].status;
        var ddl_len = $("#ddl_search_type20_" + curr_btnSearch_Counter + " option").length;

        var Condition_Data_Str = $('#hdn_condition_data_' + curr_btnSearch_Counter + '').val();
        var Condition_Data = itemObj._checkStrObj(decodeURIComponent(Condition_Data_Str));          // check_item
        var value_new = Condition_Data[0].value_new;
        var self_assignment = value_new[0].self_assignment;

        if (status == 1) {
            $("#ddd_search_type20_text_" + curr_btnSearch_Counter + "").val("");
            //mk_animate_border('#div_Search_' + curr_btnSearch_Counter + '', 0, 500, 'green', 'hide');

            //if (ddl_len == 1 || curr_type_G == 'dropdown_search') {

            //*********commented for show_more
            if (curr_type_G == "show_more" || curr_type_G == "dropdown_search") { }
            else {
                var ios_device = localStorage.getItem('ios_device');
                if (ios_device == 'iphone' || F7_device == 'android') {
                    $("#ddl_search_type20_" + curr_btnSearch_Counter + " option:gt(0)").remove();
                }
                else {
                    $("#ddl_search_type20_" + curr_btnSearch_Counter + "").empty();
                }
            }
            //*****

            //}

            $("#ddl_search_type20_" + curr_btnSearch_Counter + "").attr('name', '1');
            var checksheet_type_filter = JSON.parse(storage.getItem('checksheet_type_filter'));
            if (checksheet_type_filter == '9' || checksheet_type_filter == '10') {
                if (curr_type_G == "show_more" || curr_type_G == "dropdown_search") { }
                else {
                    var listitem_All = "<option value='All' selected='selected'>Select All</option>";
                    $("#ddl_search_type20_" + curr_btnSearch_Counter + "").append(listitem_All);
                }
            }

            if (value_new == '' || value_new == null || value_new == undefined) {
                var Select = itemObj._checkStrObj(Condition_Data[0].ColumName[0].subdata[0].Select);        // check_item
                var primary_col = Select[0].Simple[0].Column_Name;
                var field_name = Select[0].Simple[1].Column_Name;
                var Fill_Data_str = Condition_Data[0].fill_data;
            }
            else {
                var primary_col = value_new[0].Target_Id;
                var field_name = value_new[0].Target_Value;
                var Fill_Data_str = value_new[0].Fill_Data;
            }

            var autofill = value_new[0].autofill;
            if (autofill == "" || autofill == null || autofill == undefined) {
                autofill = "true";
            }
            var self_assignment = value_new[0].self_assignment;

            var data = Data_Json[0].data;
            if (data == "" || data == null || data == undefined) {
                var myArray = eval('(' + Data_Json[0].message + ')');
            }
            else {
                var myArray = JSON.parse(data);
            }

            //if (Fill_Data_str == "" || Fill_Data_str == null || Fill_Data_str == undefined) {
            //    // no data to fill
            //} else {
            //    // some data to fill
            //    var param = "get_data_from_selected_option('" + curr_btnSearch_Counter + "')";
            //    //  $("#ddl_search_type20_" + curr_btnSearch_Counter + "").attr("onchange", param);

            //    // temporary set other than onchange event to trigger afterwards (when fill child type20 dropdown and also fill below data at a time)
            //    //$("#ddl_search_type20_" + curr_btnSearch_Counter + "").attr("ondrag", param);

            //    //set onchange event if found more than 1 option -------------06052019
            //    var onchange_str = $("#ddl_search_type20_" + curr_btnSearch_Counter + "").attr("onchange");
            //    if (onchange_str == '' || onchange_str == null || onchange_str == undefined) {
            //        $("#ddl_search_type20_" + curr_btnSearch_Counter + "").attr("onchange", param);
            //    }
            //    else {
            //        $("#ddl_search_type20_" + curr_btnSearch_Counter + "").attr("ondrag", param);
            //    }
            //}

            // check for end date (in case of task form - project template - 05012022)
            var start_bracket = curr_btnSearch_Counter.lastIndexOf("_");
            var que_id = curr_btnSearch_Counter.substring(start_bracket + 1, curr_btnSearch_Counter.length);
            if (que_id == "1002") {
                var project_template_id = myArray[0][primary_col];
                get_nodes_by_template_id_from_searchable(project_template_id, curr_btnSearch_Counter);
            }


            var duplicate_opt_cnt = 0;
            // binding customer name to drop down
            for (j = 0; j < myArray.length; j++) {
                var cell_id = myArray[j][primary_col];
                var cell_value = myArray[j][field_name];
                if (cell_value == '' || cell_value == null || cell_value == undefined) { }
                else {
                    //----------commented for show more issue(duplicate data)--------[24012020]
                    var val_exists = $("#ddl_search_type20_" + curr_btnSearch_Counter + " option").filter(function () { return $(this).text() == cell_value; }).length;
                    if (val_exists && ddl_search_type == "normal") {
                        //alert1('Search value is already exist !');
                        duplicate_opt_cnt++;
                    }
                    else {
                        if (myArray.length == 1 && autofill == "true") {
                            var new_cell_value = encodeURIComponent(cell_value);

                            if (OFFSET_TYPE20 == 0) {
                                var option = "<option selected='selected' value=" + new_cell_value + " value1=" + cell_id + ">" + cell_value + "</option>";
                            }
                            else {
                                var option = "<option value=" + new_cell_value + " value1=" + cell_id + ">" + cell_value + "</option>";
                            }

                            if (curr_type_G == "show_more" || curr_type_G == "dropdown_search") {
                                $('.searchbar-not-found').hide();
                                $('.searchbar-found').show();

                                var param_info = "get_ddl_info_type20('" + cell_id + "', '" + new_cell_value + "', '" + curr_btnSearch_Counter + "')";
                                var param = "set_dropdown_data('" + new_cell_value + "', '" + curr_btnSearch_Counter + "','', '" + cell_id + "')";

                                var li_txt = '<li class="item-content" onclick="' + param + '" value="' + new_cell_value + '">';
                                li_txt += '<div class="item-inner"><div class="item-title">' + cell_value + '</div>';

                                if (cell_value == "Select Value" || cell_value == "Select All") { }
                                else {
                                    li_txt += '<div class="item-after"><div class="item-icon">';
                                    li_txt += '<i class="fa fa-info-circle cls_task_ico" style="font-size: 32px; vertical-align:middle;" onclick="' + param_info + '"></i></div></div>';
                                }

                                li_txt += '</div></li>';
                                $('#type20_ddl_list').append(li_txt);

                                if (OFFSET_TYPE20 == 0) {
                                    myApp.closeModal(".popup-type20-dropdown");
                                    if (F7_device == 'android' || F7_device == 'ios') {
                                        //popup UI issue in iOS
                                        $(".popup-type20-dropdown").hide();
                                    }
                                }

                                $('.cls_task_ico').click(function (event) {
                                    event.stopPropagation();
                                });
                            }

                            $("#ddl_lbl_search_type20_" + curr_btnSearch_Counter + "").html(cell_value);

                            //  autofill child when getting only 1 item in onsuccess of parent(current parent)
                            var t_ddl_counter = curr_btnSearch_Counter;
                            single_opt_onchange_ary.push(t_ddl_counter);

                            //setTimeout(function () {
                            $("#ddl_search_type20_" + t_ddl_counter + "").prop('disabled', true);
                            //    autofill_child_type20_dropdown_onload(t_ddl_counter);
                            //}, 1000, t_ddl_counter);
                        }
                        else {
                            //value1 for duplicate user_id (1 user assigned to multiple circle)
                            var new_cell_value = encodeURIComponent(cell_value);

                            if (self_assignment == "true") {
                                var user_id = JSON.parse(storage.getItem('user_id'));
                                if (cell_id == user_id) {
                                    // auto select current username 
                                    var option = "<option selected='selected' value=" + new_cell_value + " value1=" + cell_id + ">" + cell_value + "</option>";
                                }
                                else {
                                    var option = "<option value=" + new_cell_value + " value1=" + cell_id + ">" + cell_value + "</option>";
                                }
                            }
                            else {

                                try {
                                    var default_value = Condition_Data[0].value_new[0].default_value;
                                }
                                catch (e) {
                                    var default_value = "";
                                }

                                if (default_value == "" || default_value == null || default_value == undefined) {
                                    var option = "<option value=" + new_cell_value + " value1=" + cell_id + ">" + cell_value + "</option>";
                                }
                                else {

                                    var default_val = default_value[0];
                                    var value_type = default_val.substring(2, 1);
                                    var sub_get_value = default_val.substring(2, default_val.length - 2);
                                    var t_value = curr_all_data_20[sub_get_value];
                                    if (cell_value == t_value && value_type == "#") {
                                        // autoselect dropdown by system variable

                                        single_opt_onchange_ary.push(curr_btnSearch_Counter);

                                        var option = "<option selected='selected' value=" + new_cell_value + " value1=" + cell_id + ">" + cell_value + "</option>";
                                    }
                                    else {
                                        var option = "<option value=" + new_cell_value + " value1=" + cell_id + ">" + cell_value + "</option>";
                                    }

                                }

                            }


                            if (curr_type_G == "show_more" || curr_type_G == "dropdown_search") {
                                $('.searchbar-not-found').hide();
                                $('.searchbar-found').show();

                                var param_info = "get_ddl_info_type20('" + cell_id + "', '" + new_cell_value + "', '" + curr_btnSearch_Counter + "')";
                                var param = "set_dropdown_data('" + new_cell_value + "', '" + curr_btnSearch_Counter + "')";

                                var li_txt = '<li class="item-content" onclick="' + param + '" value="' + new_cell_value + '">';
                                li_txt += '<div class="item-inner"><div class="item-title">' + cell_value + '</div>';

                                if (cell_value == "Select Value" || cell_value == "Select All") { }
                                else {
                                    li_txt += '<div class="item-after"><div class="item-icon">';
                                    li_txt += '<i class="fa fa-info-circle cls_task_ico" style="font-size: 32px; margin-bottom:4px" onclick="' + param_info + '"></i></div></div>';
                                }

                                li_txt += '</div></li>';

                                $('#type20_ddl_list').append(li_txt);
                                $('.cls_task_ico').click(function (event) {
                                    event.stopPropagation();
                                });
                            }
                        }
                        $("#ddl_search_type20_" + curr_btnSearch_Counter + "").append(option);

                        if (self_assignment == "true") {
                            var user_id = JSON.parse(storage.getItem('user_id'));
                            if (cell_id == user_id) {
                                $("#div_Search_" + curr_btnSearch_Counter + "").attr("disabled", "disabled");
                            }
                        }
                    }
                }
            }



            //show_more img is displayed or not while click on show more 
            var ddl_len_new = $("#ddl_search_type20_" + curr_btnSearch_Counter + " option").length;
            var checksheet_type_filter = JSON.parse(storage.getItem('checksheet_type_filter'));
            var old_OFFSET_TYPE20 = OFFSET_TYPE20;
            //if (checksheet_type_filter == '9' || checksheet_type_filter == '10') {
            //    if (ddl_len_new == 1) {
            //        OFFSET_TYPE20 = ddl_len_new - 1;
            //        ddl_len_new = ddl_len_new - 1;
            //    }
            //    else {
            //        OFFSET_TYPE20 = ddl_len_new - 2;
            //        ddl_len_new = ddl_len_new - 2;
            //    }
            //}
            //else {
            //    OFFSET_TYPE20 = ddl_len_new - 1;
            //    ddl_len_new = ddl_len_new - 1;
            //}

            ddl_len_new = ddl_len_new + duplicate_opt_cnt;                  //when duplicate option found, that time issue in show more(29012020----[chetn44.dr])

            var possible_limit = old_OFFSET_TYPE20 + FETCH_TYPE20;
            //if (ddl_len_new >= (possible_limit - 1)) {
            $('.footer-type20-dropdown').parent().show();

            $("#ddl_list").scroll(function () {
                var offsetHeight = document.getElementById("ddl_list").offsetHeight;
                var scrollTop = document.getElementById("ddl_list").scrollTop;
                var scrollHeight = document.getElementById("ddl_list").scrollHeight;
                if (parseInt(scrollTop) === (parseInt(scrollHeight) - parseInt(offsetHeight))) {
                    Show_More_ddl(curr_btnSearch_Counter, TableName_G, JoinTableName_G, Checksheet_id_G);
                }
            });
            //}
            //else {
            //    $('.footer-type20-dropdown').find('.center').find('img').remove();
            //    $('.footer-type20-dropdown').parent().hide();
            //}
            ////////////

            //--type20 dependency for dropdown onchange when fill data is not available
            if (Fill_Data_str == "" || Fill_Data_str == null || Fill_Data_str == undefined) {
                var type20_dependency_str = $('#hdn_type20_dependency_data_' + curr_btnSearch_Counter + '').val();
                if (type20_dependency_str == '' || type20_dependency_str == null || type20_dependency_str == undefined) { }
                else {
                    var type20_dependency_data = JSON.parse(decodeURIComponent(type20_dependency_str));
                    if (type20_dependency_data.length > 0) {
                        var t_val = myArray[0][field_name];
                        for (d = 0; d < type20_dependency_data.length; d++) {
                            type20_dependency_data[d].ele_ans = t_val;
                        }
                        var paramData = JSON.stringify(type20_dependency_data);
                        set_global_show_hide_class(encodeURIComponent(paramData))
                        $('#hdn_type20_dependency_data_' + curr_btnSearch_Counter + '').val(encodeURIComponent(JSON.stringify(type20_dependency_data)))
                    }
                }
            }
            else {

                if (myArray.length == 1 && autofill == "true") {
                    // single option found + aufoill below textbox
                    //get_data_from_selected_option(curr_btnSearch_Counter);

                    const exists = single_opt_fill_data_ary.includes(curr_btnSearch_Counter);
                    if (exists == false) {
                        single_opt_fill_data_ary.push(curr_btnSearch_Counter);
                    }
                }
            }

            hide_current_type_loading(curr_btnSearch_Counter);
            //$('#div_Search_' + curr_btnSearch_Counter + '').attr('onclick', '');


            var default_value = Condition_Data[0].value_new[0].default_value;
            if (default_value == "" || default_value == null || default_value == undefined) {
                $('#div_Search_' + curr_btnSearch_Counter + '').attr('onclick', '');
            }
            else {
                var task_mode = localStorage.getItem('task_mode');
                if (form_flag == 3 || (form_flag == 6 && (task_mode == "edit" || task_mode == "Update Task"))) {
                    //dont auto fill default value in case collpasible edit mode and task/type37 subtask edit mode (lead.meng--Order/Sales Visit) [FT-11062025]
                }
                else {
                    var default_val = default_value[0];
                    var value_type = default_val.substring(2, 1);
                    if (value_type == "#") {

                        // check default value is avialable in dropdown or not (if not add new option) - mk - 15052025
                        if (self_assignment == "true") {
                            let sub_get_value = default_val.substring(2, default_val.length - 2);
                            let t_value = curr_all_data_20[sub_get_value];
                            if (t_value == "" || t_value == null || t_value == undefined) { }
                            else {
                                var val_exists = $("#ddl_search_type20_" + curr_btnSearch_Counter + " option").filter(function () { return $(this).text() == t_value; }).length;
                                if (!val_exists) {
                                    let cell_value = t_value;
                                    var new_cell_value = encodeURIComponent(cell_value);
                                    single_opt_onchange_ary.push(curr_btnSearch_Counter);
                                    let cell_id = curr_all_data_20['user_id'];
                                    var option = "<option selected='selected' value=" + new_cell_value + " value1=" + cell_id + ">" + cell_value + "</option>";
                                    $("#ddl_search_type20_" + curr_btnSearch_Counter + "").append(option);
                                }
                            }
                        }

                        // set onclick event in case of system variable default value
                        var onclick_exist = $("#div_Search_" + curr_btnSearch_Counter + "").attr("onclick");;
                        if (onclick_exist == "" || onclick_exist == null || onclick_exist == undefined) {

                            // commented after calling searchable onclick always - mk - 28042025

                            //var is_child = 0;
                            //var push_data = value_new[0].push_data
                            //var push_array = push_data[0].push_array;
                            //for (l = 0; l < push_array.length; l++) {
                            //    var get_value = push_array[l].value;
                            //    var value_type = get_value.substring(2, 1);
                            //    if (value_type == "@") {
                            //        // class value 
                            //        is_child = 1;
                            //        break;
                            //    }
                            //}

                            //if (is_child == 0) {
                            //    // set onclick event for paraent only
                            //    var default_value = value_new[0].default_value;
                            //    var Checksheet_id = value_new[0].Checksheet_id;
                            //    var param = "popup_search_items_show_type20('" + curr_btnSearch_Counter + "', 'NO_DEFAULT', '','" + Checksheet_id + "','popup', '')";
                            //    $("#div_Search_" + curr_btnSearch_Counter + "").attr("onclick", param);
                            //    $("#div_Search_" + curr_btnSearch_Counter + "").find("div.item-input-field").css("pointer-events", "none");
                            //}
                        }
                        else {
                            $('#div_Search_' + curr_btnSearch_Counter + '').attr('onclick', '');
                            $("#div_Search_" + curr_btnSearch_Counter + "").find("div.item-input-field").css("pointer-events", "initial");
                        }
                    }
                }
            }

            // for pageload autofill dropdown
            Type20_AutoFill_DDL_Array.shift();
            if (Type20_AutoFill_DDL_Array.length > 0) {
                autofill_type20_dropdown_onload(Type20_AutoFill_DDL_Array);
            }

            if (Type20_AutoFill_DDL_Array.length == 0) {
                var check_type = JSON.parse(storage.getItem('check_type_task'));
                if (check_type == '21275') {
                    //autofill username in task form(For Nokia Fault)
                    var fix_curr_btnSearch_Counter = curr_clps_new_id + '_' + check_type + '_4';                //for username fix que_id=4
                    var user_id = JSON.parse(storage.getItem('user_id'));
                    var username = JSON.parse(storage.getItem('username'));
                    //$("#ddl_search_type20_" + fix_curr_btnSearch_Counter + "").val(user_id);
                    $("#ddl_search_type20_" + fix_curr_btnSearch_Counter + "").val(username);
                    $("#ddl_lbl_search_type20_" + fix_curr_btnSearch_Counter + "").html(username);
                }

                //bind onchange event of single opt dropdown after all ddls are auto filled [conflict between auto fill and onchange event in ATC](12062020)

                Type20_AutoBind_Onchange_Array.shift();
                if (Type20_AutoBind_Onchange_Array.length > 0) {
                    call_multi_autobind_type20_child_dropdown(Type20_AutoBind_Onchange_Array);
                }
                else {
                    check_and_call_next_single_option();
                }

            }

            // for onchange of parent dropdown autofill child dropdown
            //Type20_AutoBind_Onchange_Array.shift();
            //if (Type20_AutoBind_Onchange_Array.length > 0) {
            //    call_multi_autobind_type20_child_dropdown(Type20_AutoBind_Onchange_Array);
            //}
            //else {
            //    // temporary set other than onchange event to trigger afterwards (when fill child type20 dropdown and also fill below data at a time)
            //    var onclick_str = "setclick('" + curr_btnSearch_Counter + "')";
            //    $("#ddl_search_type20_" + curr_btnSearch_Counter + "").attr('onclick', onclick_str);
            //    $("#ddl_search_type20_" + ddl_clicked_new_id + "").trigger("ondrag");
            //}

            //if (Type20_AutoFill_DDL_Array.length == 0) {
            loading_hide();
            //}

        }
        else if (status == 2 && self_assignment == "true" && OFFSET_TYPE20 == 0) {
            // get_all_searched_list("", "", "", "no_searchValue");

            if (status_2_with_self_assign == 0) {
                status_2_with_self_assign++;
                get_all_searched_list("", "", "", "no_searchValue");
            }
            else {
                var search_id = value_new[0].SearchID;
                //alert("No data found for search id (search name): " + search_id +", please check condition!");
                status_2_with_self_assign = 0;
                hide_current_type_loading(curr_btnSearch_Counter);

                Type20_AutoFill_DDL_Array.shift();
                if (Type20_AutoFill_DDL_Array.length > 0) {
                    autofill_type20_dropdown_onload(Type20_AutoFill_DDL_Array);
                }
                else {
                    check_and_call_next_single_option();
                }
            }
        }
        else {
            $('.no-record').remove();

            if (ddl_len == 1 || curr_type_G == "dropdown_search") {

                if (curr_type_G == "dropdown_search") {
                    $('.searchbar-not-found').hide();
                    $('.searchbar-found').show();
                }

                //$("#ddl_search_type20_" + curr_btnSearch_Counter + " option:gt(0)").remove();
                //var option = "<option value='0'>No Data Found !</option>";
                //$("#ddl_search_type20_" + curr_btnSearch_Counter + "").append(option);

                let quick_search_len = $("#type20_ddl_list li:visible").length;

                if (curr_type_G == 'dropdown_search' && OFFSET_TYPE20 == 0 && quick_search_len == 0) {
                    var li_txt = '<li class="item-content no-record" value="0">';
                    li_txt += '<div class="item-inner"><div class="item-title">No Data Found !</div>';
                    li_txt += '</div></li>';

                    if (glob_type20_cust_checksheetid == '' || glob_type20_cust_checksheetid == null || glob_type20_cust_checksheetid == undefined || glob_type20_cust_checksheetid == "0" || glob_type20_cust_checksheetid == "undefined") { }
                    else {
                        var ddl_sys_search_val = $("#F7_type20_ddl_Search :input[type='search']").val();                    //system search in dropdown
                        var param = "get_popup_to_add_item_online(" + glob_type20_cust_checksheetid + ", '" + glob_add_cust_from_search + "', '', '" + ddl_sys_search_val + "', 'create_cust')";
                        var param_new = "get_popup_to_add_item_online(" + glob_type20_cust_checksheetid + ", '" + glob_add_cust_from_search + "', '', '" + ddl_sys_search_val + "', 'create_new_cust')";
                        li_txt += '<li class="item-content li-new-cust" style="float:left;">';
                        li_txt += '<div class="div-type20-new-cust"><a id="ddl_cust_creation" onclick="' + param + '" class="back link icon-only cls-new-cust">Create</a></div>';
                        li_txt += '</li>';
                        li_txt += '<li class="item-content li-new-cust" style="float: right;display:none;">';                                                   //---display:none for ATC coz added + btn for create new [FT-25072025]
                        li_txt += '<div class="div-type20-new-cust"><a id="ddl_new_cust_creation" onclick="' + param_new + '" class="back link icon-only cls-new-cust">Create New</a></div>';
                        li_txt += '</li>';

                        $(".li-new-cust").remove();
                    }
                    $('#type20_ddl_list').append(li_txt);
                }
            }

            hide_current_type_loading(curr_btnSearch_Counter);
            $('#div_Search_' + curr_btnSearch_Counter + '').attr('onclick', '');

            Type20_AutoFill_DDL_Array.shift();
            if (Type20_AutoFill_DDL_Array.length > 0) {
                autofill_type20_dropdown_onload(Type20_AutoFill_DDL_Array);
            }
            else {
                loading_hide();
                //bind onchange event of single opt dropdown after all ddls are auto filled [conflict between auto fill and onchange event in ATC](12062020)
                check_and_call_next_single_option();
            }

            // for onchange of parent dropdown autofill child dropdown
            Type20_AutoBind_Onchange_Array.shift();
            if (Type20_AutoBind_Onchange_Array.length > 0) {
                call_multi_autobind_type20_child_dropdown(Type20_AutoBind_Onchange_Array);
            }

        }

        ddl_search_type = "normal";

        if (curr_type_G == "show_more" || curr_type_G == "dropdown_search") {
            curr_type_G = "";
        }
    } catch (e) {
        alert1(e + '_onsuccess_get_all_searched_list_New()')
        loading_hide();
    }
}

var last_single_trigger_ms = 0;
function check_and_call_next_single_option() {
    try {
        if (single_opt_onchange_ary.length > 0) {
            var len = single_opt_onchange_ary.length;
            var avail_index = [];
            for (var s = 0; s < len; s++) {
                var s_curr_btnSearch_Counter = single_opt_onchange_ary[s];
                var eve = $("#ddl_search_type20_" + s_curr_btnSearch_Counter + "").attr('onchange');
                if (eve == '' || eve == null || eve == undefined) {

                    let Condition_Data_Str = $('#hdn_condition_data_' + s_curr_btnSearch_Counter + '').val();
                    let Condition_Data = JSON.parse(decodeURIComponent(Condition_Data_Str));
                    let value_new = Condition_Data[0].value_new;
                    let Fill_Data_str = value_new[0].Fill_Data;

                    if (Fill_Data_str == '' || Fill_Data_str == null || Fill_Data_str == undefined) { }
                    else {
                        //commented on 12082025 as multiple call for autofill searchable with single option
                        //get_data_from_selected_option(s_curr_btnSearch_Counter);

                        let default_value = value_new[0].default_value;
                        if (default_value == "" || default_value == null || default_value == undefined) { }
                        else {
                            // call when searchble is single selected with default value - mk - 24092025
                            get_data_from_selected_option(s_curr_btnSearch_Counter);
                        }
                    }

                }
                else {
                    //creating new id array for available onchange event 15072020 (tested pt.driver/chetanp.dr90)
                    avail_index.push(s_curr_btnSearch_Counter);
                }
            }

            single_opt_onchange_ary = avail_index;

            //autofill_child_type20_dropdown_onload(s_curr_btnSearch_Counter);                        //bind onchange event for autofilled data in pageload
            if (single_opt_onchange_ary.length > 0) {
                //bind onchange event one by one (ATC issue - atcak.senew - 08072020/ pt.driver - 14072020)
                var s_curr_btnSearch_Counter = single_opt_onchange_ary[0];

                single_opt_onchange_ary.splice(0, 1);

                setTimeout(function () {
                    //$("#ddl_search_type20_" + s_curr_btnSearch_Counter + "").trigger("onchange");

                    if (last_single_trigger_ms == 0) {
                        let t_ms = new Date().getTime();
                        last_single_trigger_ms = t_ms;
                        $("#ddl_search_type20_" + s_curr_btnSearch_Counter + "").trigger("onchange");
                    }
                    else {
                        let t_ms = new Date().getTime();
                        let diff_ms = t_ms - last_single_trigger_ms;
                        if (diff_ms > 500) {
                            last_single_trigger_ms = t_ms;
                            $("#ddl_search_type20_" + s_curr_btnSearch_Counter + "").trigger("onchange");
                        }
                        else {
                            single_opt_onchange_ary.push(s_curr_btnSearch_Counter);
                        }
                    }

                }, 500);
            }
            else {
                // no onchange event found for single selected dropdown 20102021
                check_and_call_next_single_option();
            }
        }
        else {
            Type20_AutoBind_Onchange_Array.shift();
            if (Type20_AutoBind_Onchange_Array.length > 0) {
                call_multi_autobind_type20_child_dropdown(Type20_AutoBind_Onchange_Array);
            }
            else {

                // in case where parent is not selected and want to select child - mk - 16042025
                if (auto_open_id_text != "") {
                    auto_open_id_text = "";
                    $("#popover_edit_text").trigger("onclick");
                    $("#popover_edit_text").removeAttr("onclick");
                }
                if (auto_open_id_qr != "") {
                    $("#popover_scan_image").trigger("onclick");
                    $("#popover_scan_image").removeAttr("onclick");
                }

                check_and_call_next_single_fill_data_option();
            }
        }
    }
    catch (e) {
        alert1(e + '_check_and_call_next_single_option');
    }
}

var single_opt_fill_data_ary = [];
function check_and_call_next_single_fill_data_option() {
    try {
        if (single_opt_fill_data_ary.length > 0) {
            var t_new_id = single_opt_fill_data_ary[0];
            single_opt_fill_data_ary.shift();

            get_data_from_selected_option(t_new_id);
        }
        else {
            // temporary set other than onchange event to trigger afterwards (when fill child type20 dropdown and also fill below data at a time)
            var onclick_str = "setclick('" + curr_btnSearch_Counter + "')";
            $("#ddl_search_type20_" + curr_btnSearch_Counter + "").attr('onclick', onclick_str);
            /*$("#ddl_search_type20_" + ddl_clicked_new_id + "").trigger("ondrag");*/
            loading_hide();
            setTimeout(function () {
                loading_hide();
            }, 1000);

            setTimeout(function () {
                loading_hide();;
            }, 2000);
        }
    }
    catch (e) {
        alert1(e + '_check_and_call_next_single_fill_data_option');
    }
}

// immidiately auto fill child dropdown when getting only 1 item in parent dropdwon in page load
function autofill_child_type20_dropdown_onload(t_ddl_counter) {
    $("#ddl_search_type20_" + t_ddl_counter + "").trigger("onchange");
}

var ddl_clicked_new_id;
function setclick(t_ddl_click) {
    ddl_clicked_new_id = t_ddl_click;
}

function onfail_get_all_searched_list_New(e) {
    try {
        var curr_btn_mode = storage.getItem('curr_btn_mode');
        if (curr_btn_mode == "back" || curr_btn_mode == "\"back\"") { }
        else {
            if (Type20_AutoFill_DDL_Array.length == 1) {
                alert1("Network Error Please try again !");
            }
            loading_hide();
        }

        if (Type20_AutoFill_DDL_Array.length > 0) {
            var t_new_id = Type20_AutoFill_DDL_Array[0].new_id;
            var t_TableName = Type20_AutoFill_DDL_Array[0].TableName;
            var t_JoinTableName = Type20_AutoFill_DDL_Array[0].JoinTableName;
            var t_Checksheet_id = Type20_AutoFill_DDL_Array[0].Checksheet_id;
            var t_window_style = Type20_AutoFill_DDL_Array[0].window_style;
            var t_view_style = Type20_AutoFill_DDL_Array[0].view_style;

            var param = "popup_search_items_show_type20('" + t_new_id + "', '" + t_TableName + "', '" + t_JoinTableName + "','"
                + t_Checksheet_id + "','" + t_window_style + "','" + t_view_style + "')";
            $('#div_Search_' + t_new_id + '').attr('onclick', param);
            Type20_AutoFill_DDL_Array.shift();
            hide_current_type_loading(t_new_id);
            autofill_type20_dropdown_onload(Type20_AutoFill_DDL_Array);
        }

        // for onchange of parent dropdown autofill child dropdown
        if (Type20_AutoBind_Onchange_Array.length > 0) {
            var t_new_id = Type20_AutoBind_Onchange_Array[0].new_id;
            Type20_AutoBind_Onchange_Array.shift();
            hide_current_type_loading(t_new_id);
            call_multi_autobind_type20_child_dropdown(Type20_AutoBind_Onchange_Array);
        }
        loading_hide();
    } catch (e) {
        alert1(e + '_onfail_get_all_searched_list_New()');
        loading_hide();
    }
}

// individual column search (only for tableview)
function popup_column_search(count, TableName, JoinTableName, Checksheet_id,
    Checksheet_type) {
    try {
        curr_type_G = "search";
        var tbl = document.getElementById("tbl_search_" + curr_btnSearch_Counter + "");
        var headRow = tbl.rows[1];
        var arrayOfHTxt = new Array();
        var arrayOfHtxtCellIndex = new Array();
        var field_Array = [];
        var company_id = JSON.parse(storage.getItem('company_id'));

        var Condition_Data_Str = $('#hdn_condition_data_' + curr_btnSearch_Counter + '').val();

        var t_Condition_Data_Str = decodeURIComponent(Condition_Data_Str)
        var Condition_Data = JSON.parse(t_Condition_Data_Str);

        var value_new = Condition_Data[0].value_new;
        if (value_new == '' || value_new == null || value_new == undefined) {
            var qs_array = pass_required_values_to_querystring(Condition_Data_Str);
            Condition_Data_Str = qs_array[0];
            Condition_Data = JSON.parse(Condition_Data_Str);
        }
        else {
            var push_data_str = JSON.stringify(value_new[0].push_data);
            var qs_array = pass_required_values_to_push_array(push_data_str);
            value_new[0].push_data = JSON.parse(qs_array[0]);
        }

        var ref_valid = qs_array[1];

        if (ref_valid > 0) {
            popup_items_hide_type20();
            alert1("Please enter required value!");
        } else {
            //var Condition_Data = itemObj._checkStrObj(Condition_Data_Str);  		// check_item

            if (value_new == '' || value_new == null || value_new == undefined) {
                for (v = 0; v < headRow.cells.length - 1; v++) {
                    if (headRow.cells[v].getElementsByTagName('input')[0]) {
                        var Htxtbox = headRow.cells[v].getElementsByTagName('input')[0];
                        if (Htxtbox.value.replace(/^\s+|\s+$/g, '') != '') {
                            var Columname = $("#spheader_" + curr_btnSearch_Counter + "_" + v).val();
                            var search_val = $("#txt_popup_search_col_" + curr_btnSearch_Counter + "_" + v).val();
                            var que_id = $("#txt_popup_search_col_" + curr_btnSearch_Counter + "_" + v).attr('name');

                            var ColumnNameSubData = [];
                            ColumnNameSubData.push({
                                'Checksheet_Type': Checksheet_type,
                                'Checksheet_Id': Checksheet_id,
                                'Task_Id': "",
                                'Ques_Id': que_id,
                                'Header': Columname,
                                'Equation': "begin with",
                                'Value_1': search_val,
                                'Value_2': "",
                                'Type': "string"
                            });

                            Condition_Data[0].where[0].And[0].Json.push(ColumnNameSubData[0]);
                        }
                    }
                }

                loading();
                var company_id = JSON.parse(storage.getItem('company_id'));
                var FROM = Condition_Data[0].FROM;
                if (FROM == "" || FROM == null || FROM == undefined) {
                    var param_obj = [];
                    param_obj.push({
                        'TableName': TableName,
                        'JoinTableName': JoinTableName,
                        'Checksheet_id': Checksheet_id,
                        'Company_id': company_id,
                        'Condition': Condition_Data
                    });
                    var a = JSON.stringify(param_obj);
                    TableName_Row = TableName;
                    Checksheet_id_Row = Checksheet_id;

                    var appversion = JSON.parse(storage.getItem('appversion'));
                    var auth = [];
                    auth.push({
                        "username": username,
                        "devicetype": F7_device,
                        "appid": "",
                        "u_c": uniqcode,
                        "appversion": appversion
                    });

                    var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_Dynamic_Table_Data_N', JSON.stringify(param_obj), onsuccess_get_all_searched_list, onfail_popup_column_search);
                    getdata.callOtherDomain();
                } else {
                    var From_Table = Condition_Data[0].FROM[0].Table_Name;
                    OFFSET_TYPE20 = 0;
                    var param_obj = [];
                    param_obj.push({
                        'company_id': company_id,
                        'data': JSON.stringify(Condition_Data),
                        'flag': 3, // all data for (tableview/listview)
                        'primary_key': '',
                        'table_name': From_Table
                    });
                    var a = JSON.stringify(param_obj);
                    TableName_Row = TableName;
                    Checksheet_id_Row = Checksheet_id;

                    var appversion = JSON.parse(storage.getItem('appversion'));
                    var auth = [];
                    auth.push({
                        "username": username,
                        "devicetype": F7_device,
                        "appid": "",
                        "u_c": uniqcode,
                        "appversion": appversion
                    });

                    var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_Dynamic_Filter_Table_Data_N', JSON.stringify(param_obj), onsuccess_get_all_searched_list, onfail_popup_column_search);
                    getdata.callOtherDomain();
                }
            }
            else {

                var searchValueAll = [];
                for (v = 0; v < headRow.cells.length; v++) {
                    if (headRow.cells[v].getElementsByTagName('input')[0]) {
                        var Htxtbox = headRow.cells[v].getElementsByTagName('input')[0];
                        if (Htxtbox.value.replace(/^\s+|\s+$/g, '') != '') {
                            var Columname = $("#spheader_" + curr_btnSearch_Counter + "_" + v).val();
                            var search_val = $("#txt_popup_search_col_" + curr_btnSearch_Counter + "_" + v).val();
                            var que_id = $("#txt_popup_search_col_" + curr_btnSearch_Counter + "_" + v).attr('name');

                            searchValueAll.push({
                                'Header': Columname,
                                'Value': search_val,
                                'que_id': que_id
                            });
                        }
                    }
                }

                // New Searchable with SearchID
                value_new[0]['OFFSET'] = OFFSET_TYPE20;
                value_new[0]['FETCH'] = FETCH_TYPE20;
                value_new[0]['searchValue'] = '';
                value_new[0]['searchValueAll'] = searchValueAll;

                var param_obj = [];
                param_obj.push({
                    'flag': 3,                          //all data for (tableview/listview)
                    "value_new": value_new,
                    "searchable_id": "ddl_search_type20_" + curr_btnSearch_Counter
                });

                loading();
                var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_Type20Filter', JSON.stringify(param_obj), onsuccess_get_all_searched_list, onfail_popup_column_search);
                getdata.callOtherDomain();
            }
        }
    } catch (e) {
        alert1(e + '_popup_column_search()');
        loading_hide();
    }
}

// error
function onfail_popup_column_search(e) {
    alert1(e + '_onfail_popup_column_search()');
    loading_hide();
}
// ///////////// popup div portion end //////////////////////////

// get searched list relative to search string
function get_searched_item_list(temp_btnSearch_Counter, TableName,
    JoinTableName, Checksheet_id, ColumName) {
    try {
        popup_items_hide_type20();
        // Checksheet_id = "0";
        curr_btnSearch_Counter = temp_btnSearch_Counter;
        var company_id = JSON.parse(storage.getItem('company_id'));
        var user_id = JSON.parse(storage.getItem('user_id'));

        // fill required values to query
        var Condition_Data_Str = $('#hdn_condition_data_' + curr_btnSearch_Counter + '').val();

        var t_Condition_Data_Str = decodeURIComponent(Condition_Data_Str)
        var Condition_Data = JSON.parse(t_Condition_Data_Str);

        var value_new = Condition_Data[0].value_new;
        if (value_new == '' || value_new == null || value_new == undefined) {
            var qs_array = pass_required_values_to_querystring(Condition_Data_Str);
            Condition_Data_Str = qs_array[0];
            Condition_Data = JSON.parse(Condition_Data_Str);
        }
        else {
            var push_data_str = JSON.stringify(value_new[0].push_data);
            var qs_array = pass_required_values_to_push_array(push_data_str);
            value_new[0].push_data = JSON.parse(qs_array[0]);
        }

        var ref_valid = qs_array[1];

        var search_val = $('#search_item_name_Search_' + temp_btnSearch_Counter + '').val();

        if (search_val == '' || search_val == null || search_val == undefined) {
            alert1("Please enter search value!");
        } else if (ref_valid > 0) {
            alert1("Please enter required value!");
        } else {
            //var Condition_Data = itemObj._checkStrObj(Condition_Data_Str);  		// check_item

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
                    loading();
                    var param_obj = [];
                    param_obj.push({
                        'TableName': TableName,
                        'JoinTableName': JoinTableName,
                        'Checksheet_id': Checksheet_id,
                        'Company_id': company_id,
                        'Condition': Condition_Data
                    });
                    var a = JSON.stringify(param_obj);

                    var appversion = JSON.parse(storage.getItem('appversion'));
                    var auth = [];
                    auth.push({
                        "username": username,
                        "devicetype": F7_device,
                        "appid": "",
                        "u_c": uniqcode,
                        "appversion": appversion
                    });

                    var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_Dynamic_Table_Data_N', JSON.stringify(param_obj), onsuccess_get_searched_list, onfail_get_searched_list);
                    getdata.callOtherDomain();
                } else {
                    // call new webservice for relative to searh string
                    get_searched_item_list_New(Condition_Data, search_val);
                }
            }
            else {
                // New Searchable Service without condition pass
                get_searched_item_list_New(Condition_Data, search_val);
            }
        }
    } catch (e) {
        alert1(e + '_get_searched_item_list()');
        loading_hide();
    }
}

// onsucess get searched list
function onsuccess_get_searched_list(e) {
    try {
        var Data_Json = e.responseText;
        Data_Json = eval('(' + Data_Json + ')');
        var status = Data_Json[0].status;
        var myArray = [];
        $("#product_list_" + curr_btnSearch_Counter + "").empty();
        if (status == 1) {
            var Condition_Data_Str = $('#hdn_condition_data_' + curr_btnSearch_Counter + '').val();
            var Condition_Data = JSON.parse(decodeURIComponent(Condition_Data_Str));
            var col_type = Condition_Data[0].ColumName[0].type;
            if (col_type == 'Table') {
                var col_name = Condition_Data[0].ColumName[0].subdata[0].Column_Name;
            } else {
                var col_name = Condition_Data[0].ColumName[0].subdata[0].Header;
            }

            //var message = eval('(' + Data_Json[0].message + ')');

            var data = Data_Json[0].data;
            if (data == "" || data == null || data == undefined) {
                var message = eval('(' + Data_Json[0].message + ')');
            }
            else {
                var message = JSON.parse(data);
            }

            for (i = 0; i < message.length; i++) {
                var list_value;
                var obj_id = message[i].id;
                // var Data_Table_Json = message[i].detail[0].data;
                var Data_Table_Json = message[i].detail;
                var fields_Array = [];
                for (j = 0; j < Data_Table_Json.length; j++) {
                    if (Data_Table_Json[j].type != "0" && Data_Table_Json[j].type != "5" && Data_Table_Json[j].type != "10") {
                        var field_name = Data_Table_Json[j].prop[0].name;

                        var value = Data_Table_Json[j].ans[0];
                        fields_Array.push({
                            "fieldname": field_name,
                            "value": value
                        });

                        if (field_name.toLowerCase() == col_name.toLowerCase() || (Data_Table_Json[j].que_id == 1 && col_name.toLowerCase() == "customeruniq")) {
                            list_value = value;
                        }
                    }
                }

                myArray.push({
                    "id": obj_id,
                    "cell_value": list_value,
                    "fields": fields_Array
                });

            }

            // binding customer name to ul list
            if (myArray.length > 0) {
                for (j = 0; j < myArray.length; j++) {
                    var cell_id = myArray[j].id;
                    var cell_value = myArray[j].cell_value;
                    var field_Array = myArray[j].fields;

                    var paramData = JSON.stringify(field_Array);
                    var param = "get_data_to_fill_ul('" + j + "','" + cell_id + "','" + curr_btnSearch_Counter + "')";

                    var list_item = '<li onclick=' + param + ' style="padding:6px 2px; list-style-type:none; border:1px solid #ccc; cursor:pointer">';
                    list_item += '<input type="hidden" id="hdn_type20_row_data_' + j + '" name=\'' + cell_value + '\'  value=\'' + paramData + '\'>';
                    list_item += '<label style="font-size:9pt; font-weight:bold; padding:5px; margin:0; cursor:pointer">' + myArray[j].cell_value + '</label>';
                    list_item += '</li>';
                    $("#product_list_" + curr_btnSearch_Counter + "").append(list_item);
                }
            } else {
                var list_item = '<li style="padding:2px; list-style-type:none; border:1px solid #ccc; text-align:center"><label style="font-size:9pt; font-weight:bold; padding:5px; margin:0">No Data Found !</label></li>';
                $("#product_list_" + curr_btnSearch_Counter + "").append(list_item);
            }
        } else {
            var list_item = '<li style="padding:2px; list-style-type:none; border:1px solid #ccc; text-align:center"><label style="font-size:9pt; font-weight:bold; padding:5px; margin:0">No Data Found !</label></li>';
            $("#product_list_" + curr_btnSearch_Counter + "").append(list_item);
        }
        loading_hide();
    } catch (e) {
        alert1(e + '_onsuccess_get_searched_list()')
        loading_hide();
    }
}

function onfail_get_searched_list(e) {
    alert1("Network Error Please try again !");
    loading_hide();
}

// get selected dropdown option and fill below element
function get_data_from_selected_option(t_new_id) {
    try {
        var cell_id = $("#ddl_search_type20_" + t_new_id + " :selected").attr('value1');
        if (cell_id == "" || cell_id == null || cell_id == undefined) {
            cell_id = $("#ddl_search_type20_" + t_new_id + " :selected").val();
        }

        var cell_value = $("#ddl_search_type20_" + t_new_id + " :selected").text();
        if (cell_id == 0) {
            //alert1("Please select dropdown value!");
        } else {
            get_data_to_fill_ul_New(cell_id, cell_value, t_new_id);
        }
    } catch (e) {
        alert1(e + '_get_data_from_selected_option');
        loading_hide();
    }
}

// get searched list relative to search string
function get_searched_item_list_New(Condition_Data, t_search_val) {
    try {
        loading();

        // temporary handling select all issue (useless data in array @ index 1)
        if (Condition_Data.length > 1) {
            Condition_Data.pop();
        }

        var company_id = JSON.parse(storage.getItem('company_id'));
        var value_new = Condition_Data[0].value_new;
        if (value_new == '' || value_new == null || value_new == undefined) {
            var param_obj = [];
            param_obj.push({
                'company_id': company_id,
                'data': JSON.stringify(Condition_Data),
                'flag': 1,
                'primary_key': '',
                'table_name': ''
            });
            var a = JSON.stringify(param_obj);

            var appversion = JSON.parse(storage.getItem('appversion'));
            var auth = [];
            auth.push({
                "username": username,
                "devicetype": F7_device,
                "appid": "",
                "u_c": uniqcode,
                "appversion": appversion
            });

            var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_Dynamic_Filter_Table_Data_N', JSON.stringify(param_obj), onsuccess_get_searched_list_New, onfail_get_searched_list_New);
            getdata.callOtherDomain();
        }
        else {
            // New Searchable with SearchID
            value_new[0]['OFFSET'] = '0';
            value_new[0]['FETCH'] = '0';
            value_new[0]['searchValue'] = t_search_val;

            var param_obj = [];
            param_obj.push({
                'flag': 1,
                "value_new": value_new,
                "searchable_id": "ddl_search_type20_" + curr_btnSearch_Counter
            });

            loading();
            var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_Type20Filter', JSON.stringify(param_obj), onsuccess_get_searched_list_New, onfail_get_searched_list_New);
            getdata.callOtherDomain();
        }
    } catch (e) {
        alert1(e + '_get_searched_item_list_New()');
        loading_hide();
    }
}

// onsucess get searched list new
function onsuccess_get_searched_list_New(e) {
    try {
        var Data_Json = e.responseText;
        Data_Json = eval('(' + Data_Json + ')');
        var status = Data_Json[0].status;
        $("#product_list_" + curr_btnSearch_Counter + "").empty();
        if (status == 1) {
            //mk_animate_border('#div_Search_' + curr_btnSearch_Counter + '', 0, 500, 'green', 'hide');
            var Condition_Data_Str = $('#hdn_condition_data_' + curr_btnSearch_Counter + '').val();
            var Condition_Data = JSON.parse(decodeURIComponent(Condition_Data_Str));

            var col_type = Condition_Data[0].ColumName[0].type;
            if (col_type == 'Table') {
                var col_name = Condition_Data[0].ColumName[0].subdata[0].Column_Name;
            } else {
                var col_name = Condition_Data[0].ColumName[0].subdata[0].Header;
            }
            var From_Table = Condition_Data[0].FROM[0].Table_Name;

            var value_new = Condition_Data[0].value_new;
            if (value_new == '' || value_new == null || value_new == undefined) {
                var Select = JSON.parse(Condition_Data[0].ColumName[0].subdata[0].Select);
                var primary_col = Select[0].Simple[0].Column_Name;
                var field_name = Select[0].Simple[1].Column_Name;
            }
            else {
                var primary_col = value_new[0].Target_Id;
                var field_name = value_new[0].Target_Value;
            }

            //var myArray = eval('(' + Data_Json[0].message + ')');

            var data = Data_Json[0].data;
            if (data == "" || data == null || data == undefined) {
                var myArray = eval('(' + Data_Json[0].message + ')');
            }
            else {
                var myArray = JSON.parse(data);
            }

            if (myArray.length == 1) {
                var cell_id = myArray[0][primary_col];
                var cell_value = myArray[0][field_name];
                get_data_to_fill_ul_New(cell_id, cell_value, curr_btnSearch_Counter);
            }
            else {
                // binding customer name to ul list
                for (j = 0; j < myArray.length; j++) {
                    var keys = Object.keys(myArray[j]);
                    var cell_id = myArray[j][primary_col];
                    var cell_value = myArray[j][field_name];
                    var param = "get_data_to_fill_ul_New('" + cell_id + "','" + cell_value + "','" + curr_btnSearch_Counter + "')";
                    var list_item = '<li onclick="' + param
                        + '" style="padding:6px 2px; list-style-type:none; border:1px solid #ccc; cursor:pointer"><label style="font-size:9pt; font-weight:bold; padding:5px; margin:0; cursor:pointer">'
                        + cell_value + '</label>';
                    list_item += '</li>';
                    $("#product_list_" + curr_btnSearch_Counter + "").append(list_item);
                }
            }
        } else {
            //mk_animate_border('#div_Search_' + curr_btnSearch_Counter + '', 0, 500, 'red', 'hide');
            var list_item = '<li style="padding:2px; list-style-type:none; border:1px solid #ccc; text-align:center"><label style="font-size:9pt; font-weight:bold; padding:5px; margin:0">No Data Found !</label></li>';
            $("#product_list_" + curr_btnSearch_Counter + "").append(list_item);

            var t_ddl_counter = curr_btnSearch_Counter;
            setTimeout(function () {
                $("#product_list_" + t_ddl_counter + "").find("li").hide();
            }, 2000, t_ddl_counter);

            var Fill_Data_Str = $('#hdn_select_all_fill_data_' + curr_btnSearch_Counter + '').val();
            var Fill_Data = itemObj._checkStrObj(decodeURIComponent(Fill_Data_Str));  		// check_item

            for (j = 0; j < Fill_Data.length; j++) {
                var box_class = Fill_Data[j].classname;
                var ddl_found = $("." + box_class + "").find("select");
                if (ddl_found.length > 0) {
                    // remove options dynamically appended to below dropdown by upper type20 //cls_removable_op
                    var below_ddl_id = $("." + box_class + "").find("select").attr("id");
                    $('.cls_removable_op').remove();
                    $("#" + below_ddl_id + "").prop("disabled", false);
                }
            }
        }
        loading_hide();
    } catch (e) {
        alert1(e + '_onsuccess_get_searched_list_New()')
        loading_hide();
    }
}

function onfail_get_searched_list_New(e) {
    alert1("Network Error Please try again !");
    loading_hide();
}

// below ul list
var fill_btnSearch_Counter;
function get_data_to_fill_ul_New(obj_id, temp_cell_value, temp_btnSearch_Counter) {
    try {
        var fill_btnSearch_Counter = temp_btnSearch_Counter;

        //curr_btnSearch_Counter = temp_btnSearch_Counter;
        $("#product_list_" + temp_btnSearch_Counter + "").empty();
        var Fill_Data_Str = $('#hdn_select_all_fill_data_' + temp_btnSearch_Counter + '').val();
        var Fill_Data = itemObj._checkStrObj(decodeURIComponent(Fill_Data_Str));  		// check_item

        if (Fill_Data.length > 0 || ddl_item_info == "true") {
            // autofill values are available
            loading();
            var company_id = JSON.parse(storage.getItem('company_id'));
            var Condition_Data_Str = $('#hdn_condition_data_' + temp_btnSearch_Counter + '').val();

            var t_Condition_Data_Str = decodeURIComponent(Condition_Data_Str)
            var Condition_Data = JSON.parse(t_Condition_Data_Str);

            var value_new = Condition_Data[0].value_new;
            if (value_new == '' || value_new == null || value_new == undefined) {
                var qs_array = pass_required_values_to_querystring(Condition_Data_Str);
                Condition_Data_Str = qs_array[0];
                Condition_Data = JSON.parse(Condition_Data_Str);
                var checksheet_id = '';
            }
            else {
                var push_data_str = JSON.stringify(value_new[0].push_data);
                var qs_array = pass_required_values_to_push_array(push_data_str);
                value_new[0].push_data = JSON.parse(qs_array[0]);
                var checksheet_id = value_new[0].Checksheet_id;

                let is_template_required = 0;
                for (let fj = 0; fj < Fill_Data.length; fj++) {
                    let old_que_id = Fill_Data[fj].queid;
                    if (old_que_id == "" || old_que_id == null || old_que_id == undefined) {
                        is_template_required++;
                        break;
                    }
                }

                if (is_template_required > 0) {
                    if (checksheet_id == "" || checksheet_id == null || checksheet_id == undefined || checksheet_id == 0) { }
                    else {
                        get_template_checksheet_from_server(checksheet_id);
                    }
                }
            }

            var ref_valid = qs_array[1];
            if (ref_valid > 0) {
                alert1("Please enter required value!");
            } else {
                //var Condition_Data = itemObj._checkStrObj(decodeURIComponent(Condition_Data_Str));  		// check_item

                if (value_new == '' || value_new == null || value_new == undefined) {
                    var From_Table = Condition_Data[0].FROM[0].Table_Name;

                    var param_obj = [];
                    param_obj.push({
                        'company_id': company_id,
                        'data': JSON.stringify(Condition_Data),
                        'flag': 2,
                        'primary_key': obj_id,
                        'table_name': From_Table
                    });
                    var a = JSON.stringify(param_obj);

                    var appversion = JSON.parse(storage.getItem('appversion'));
                    var auth = [];
                    auth.push({
                        "username": username,
                        "devicetype": F7_device,
                        "appid": "",
                        "u_c": uniqcode,
                        "appversion": appversion
                    });

                    var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_Dynamic_Filter_Table_Data_N', JSON.stringify(param_obj), function (e) {
                        onsuccess_get_data_to_fill_ul_New(e, fill_btnSearch_Counter);
                    }, onfail);
                    getdata.callOtherDomain();
                }
                else {
                    // New Searchable with SearchID
                    value_new[0]['OFFSET'] = '0';
                    value_new[0]['FETCH'] = '0';
                    value_new[0]['searchValue'] = obj_id;    // primary key (will return single json only)

                    // make empty before fill
                    empty_data_to_box(fill_btnSearch_Counter);

                    var param_obj = [];
                    param_obj.push({
                        'flag': 2,
                        "value_new": value_new,
                        "searchable_id": "ddl_search_type20_" + temp_btnSearch_Counter
                    });

                    loading();
                    var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_Type20Filter', JSON.stringify(param_obj), function (e) {
                        onsuccess_get_data_to_fill_ul_New(e, fill_btnSearch_Counter);
                    }, onfail);
                    getdata.callOtherDomain();
                }
            }
        } else {
            // autofill values are not available
            $('#search_item_name_Search_' + temp_btnSearch_Counter + '').val(temp_cell_value);
            $('#search_item_name_Search_' + temp_btnSearch_Counter + '').attr('title', obj_id);
            $('#search_item_name_Search_' + temp_btnSearch_Counter + '').attr('name', '1');
        }
    } catch (e) {
        alert1(e + '_get_data_to_fill_ul_New()');
        loading_hide();
    }
}

var glob_template_json = [];
function onsuccess_get_data_to_fill_ul_New(e, fill_btnSearch_Counter) {
    try {
        var Data_Json = e.responseText;
        Data_Json = eval('(' + Data_Json + ')');
        var status = Data_Json[0].status;
        $("#product_list_" + fill_btnSearch_Counter + "").empty();

        if (status == 1) {
            var Condition_Data_Str = $('#hdn_condition_data_' + fill_btnSearch_Counter + '').val();
            var Condition_Data = itemObj._checkStrObj(decodeURIComponent(Condition_Data_Str));  		// check_item

            var value_new = Condition_Data[0].value_new;
            if (value_new == '' || value_new == null || value_new == undefined) {
                var col_type = Condition_Data[0].ColumName[0].type;
                if (col_type == 'Table') {
                    var col_name = Condition_Data[0].ColumName[0].subdata[0].Column_Name;
                } else {
                    var col_name = Condition_Data[0].ColumName[0].subdata[0].Header;
                }
            }
            else {
                var col_name = value_new[0].Target_Value;
            }

            // var Select =
            // JSON.parse(Condition_Data[0].ColumName[0].subdata[0].Select);
            // var col_name = Select[0].Simple[1].Column_Name;

            //var message = eval('(' + Data_Json[0].message + ')');

            var data = Data_Json[0].data;
            if (data == "" || data == null || data == undefined) {
                var message = eval('(' + Data_Json[0].message + ')');
            }
            else {
                var message = JSON.parse(data);
            }

            var list_value;
            var obj_id = message[0].id;
            var checksheet_type_id = message[0].checksheet_type_id;
            var Data_Table_Json = message[0].detail;
            var fields_Array = [];

            var Fill_Data_Str = $('#hdn_select_all_fill_data_' + fill_btnSearch_Counter + '').val();
            var Fill_Data = itemObj._checkStrObj(decodeURIComponent(Fill_Data_Str));  		// check_item

            let is_template_required = 0;
            for (let fj = 0; fj < Fill_Data.length; fj++) {
                let old_que_id = Fill_Data[fj].queid;
                if (old_que_id == "" || old_que_id == null || old_que_id == undefined) {
                    is_template_required++;
                    break;
                }
            }

            var cntrl_prop = Data_Table_Json[0].prop;
            if (cntrl_prop == "" || cntrl_prop == null || cntrl_prop == undefined) {
                is_template_required++;
            }

            if (is_template_required > 0) {

                var checksheet_json = Data_Json[0].checksheet_json;
                if (checksheet_json == "" || checksheet_json == null || checksheet_json == undefined) {
                    // in case data fetch from other than normal tables  
                    checksheet_json = [];
                }
                else {
                    checksheet_json = JSON.parse(checksheet_json);
                }

                var cntrl_prop = Data_Table_Json[0].prop;
                if (cntrl_prop == "" || cntrl_prop == null || cntrl_prop == undefined) {

                    // merge only if getting 3 keys 26032023
                    var blank_data = checksheet_json;
                    for (i = 0; i < blank_data.length; i++) {                       //added this logic for info tbl label issue [17022023]
                        var bl_que_id = blank_data[i].que_id;
                        var bl_type = blank_data[i].type;
                        for (j = 0; j < Data_Table_Json.length; j++) {
                            var rs_que_id = Data_Table_Json[j].que_id;
                            var rs_type = Data_Table_Json[j].type;
                            if (rs_que_id == bl_que_id && rs_type == bl_type) {
                                var rs_ans = Data_Table_Json[j].ans;
                                blank_data[i].ans = rs_ans;
                                break;
                            }
                        }
                    }

                    if (blank_data.length > 0) {
                        // in some case getting checksheet template may delay 05022025
                        Data_Table_Json = blank_data;
                    }
                }
            }

            for (j = 0; j < Data_Table_Json.length; j++) {
                if (Data_Table_Json[j].type != "0" && Data_Table_Json[j].type != "5" && Data_Table_Json[j].type != "10") {
                    var que_id = Data_Table_Json[j].que_id;
                    var value = Data_Table_Json[j].ans[0];
                    var cntrl_prop = Data_Table_Json[j].prop;
                    if (cntrl_prop == "" || cntrl_prop == null || cntrl_prop == undefined) {

                        var cntrl_type = Data_Table_Json[j].type;
                        if (cntrl_type == 8) {

                            var misc_Array = Data_Table_Json[j].prop[0].misc_data;
                            var value1 = misc_Array[0].value;
                            value1 = itemObj._checkStrObj(misc_Array[0].value);  // check_item
                            var mode = value1[0].mode;

                            fields_Array.push({
                                "queid": que_id,
                                "value": value,
                                "mode": mode
                            });
                        }
                        else if (cntrl_type == 7) {
                            //img autofill [FT-18022025]
                            fields_Array.push({
                                "queid": que_id,
                                "value": value,
                                "img_ary": Data_Table_Json[j].ans
                            });
                        }
                        else {
                            fields_Array.push({
                                "queid": que_id,
                                "value": value
                            });
                        }
                    }
                    else {
                        var field_name = Data_Table_Json[j].prop[0].name;
                        var type = Data_Table_Json[j].type;
                        if (type == 22) {
                            value = "(Invoice Control)";
                        }
                        else if (type == 1) {
                            var misc_Array = Data_Table_Json[j].prop[0].misc_data;
                            var prop_value = misc_Array[0].value;
                            if (prop_value == '' || prop_value == null || prop_value == undefined) {
                                var box_type = "";
                            }
                            else {
                                prop_value = itemObj._checkStrObj(misc_Array[0].value);  // check_item
                                var box_type = prop_value[0].box_type;
                            }

                            if (box_type == "password") {
                                value = "*****";
                            }
                        }

                        if (Data_Table_Json[j].type == 8) {
                            var misc_Array = Data_Table_Json[j].prop[0].misc_data;
                            var value1 = misc_Array[0].value;
                            value1 = itemObj._checkStrObj(misc_Array[0].value);  // check_item
                            var mode = value1[0].mode;

                            fields_Array.push({
                                "queid": que_id,
                                "fieldname": field_name,
                                "value": value,
                                "mode": mode
                            });
                        }
                        else if (Data_Table_Json[j].type == 7) {
                            //img autofill [FT-18022025]
                            fields_Array.push({
                                "queid": que_id,
                                "value": value,
                                "img_ary": Data_Table_Json[j].ans
                            });
                        }
                        else {
                            fields_Array.push({
                                "queid": que_id,
                                "fieldname": field_name,
                                "value": value
                            });
                        }

                        if (field_name.toLowerCase() == col_name.toLowerCase() || (Data_Table_Json[j].que_id == 1 && col_name.toLowerCase() == "customeruniq")) {
                            list_value = value;
                        }
                    }
                }
            }

            var myArray = [];
            myArray.push({
                "id": obj_id,
                "cell_value": list_value,
                "fields": fields_Array
            });


            // new type20 dependency logic on searchable table row selection (06/12/2019)
            var type20_dependency_str = $('#hdn_type20_dependency_data_' + fill_btnSearch_Counter + '').val();
            if (type20_dependency_str == '' || type20_dependency_str == null || type20_dependency_str == undefined) { }
            else {
                var is_que_id_blank = 0;
                var type20_dependency_data = JSON.parse(decodeURIComponent(type20_dependency_str));
                if (type20_dependency_data.length > 0) {
                    for (d = 0; d < type20_dependency_data.length; d++) {
                        var dep_type20_que_id = type20_dependency_data[d].dep_type20_que_id;
                        if (dep_type20_que_id == "" || dep_type20_que_id == null || dep_type20_que_id == undefined) {
                            type20_dependency_data[d].ele_ans = list_value;
                        }
                        else {
                            is_que_id_blank++;
                        }
                    }

                    if (is_que_id_blank == 0) {
                        //---if dep_type20_que_id is blank than call dep function from here otherwise call it from autofill function [urbanJungle - 17082021]
                        var paramData = JSON.stringify(type20_dependency_data);
                        set_global_show_hide_class(encodeURIComponent(paramData))
                        $('#hdn_type20_dependency_data_' + fill_btnSearch_Counter + '').val(encodeURIComponent(JSON.stringify(type20_dependency_data)))
                    }
                    else {
                        // type20 dependency found with dep_que_id
                        for (d = 0; d < type20_dependency_data.length; d++) {
                            var dep_type20_que_id = type20_dependency_data[d].dep_type20_que_id;

                            var logData = Data_Table_Json;
                            for (g = 0; g < logData.length; g++) {
                                var que_id = logData[g].que_id;
                                if (que_id == dep_type20_que_id) {
                                    var ans = logData[g].ans[0];
                                    type20_dependency_data[d].ele_ans = ans;

                                    $('#hdn_type20_dependency_data_' + fill_btnSearch_Counter + '').val(encodeURIComponent(JSON.stringify(type20_dependency_data)))
                                    set_global_show_hide_class(encodeURIComponent(JSON.stringify(type20_dependency_data)));
                                    break;
                                }
                            }
                        }
                    }
                }
            }

            ////--type20 dependency for dropdown onchange--- for ATC(rahul.vt) [09122020]       (commencted this logic for urbanJungle and set it to above [18082021])
            //var type20_dependency_str = $('#hdn_type20_dependency_data_' + fill_btnSearch_Counter + '').val();
            //if (type20_dependency_str == '' || type20_dependency_str == null || type20_dependency_str == undefined) { }
            //else {
            //    var type20_dependency_data = JSON.parse(decodeURIComponent(type20_dependency_str));
            //    if (type20_dependency_data.length > 0) {
            //        for (d = 0; d < type20_dependency_data.length; d++) {
            //            type20_dependency_data[d].ele_ans = list_value;
            //        }
            //        var paramData = JSON.stringify(type20_dependency_data);
            //        set_global_show_hide_class(encodeURIComponent(paramData))
            //        $('#hdn_type20_dependency_data_' + fill_btnSearch_Counter + '').val(encodeURIComponent(JSON.stringify(type20_dependency_data)))
            //    }
            //}

            var tempfieldArray = JSON.stringify(fields_Array);

            if (ddl_item_info == "true") {
                //when clicl on ddl info icon
                open_popup_for_ddl_item_info(tempfieldArray);
            }
            else {
                fill_data_to_box(obj_id, list_value, tempfieldArray, fill_btnSearch_Counter, checksheet_type_id);
            }
        } else {
            alert1(Data_Json[0].message);
        }
        loading_hide();
    } catch (e) {
        alert1(e + '_onsuccess_get_data_to_fill_ul_New()')
        loading_hide();
    }
}

function get_template_checksheet_from_server(checksheet_id) {
    try {
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
            'checksheetid': checksheet_id,
            'step': 1,
            'trip_id': trip_id
        });

        var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_GetCheckSheetData_Port', JSON.stringify(param_obj), function (e) {
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

                    glob_template_json = blank_data;
                    return blank_data;
                }
            }
            else {
                var message = responseText[0].message;
                alert1("Server: " + message);
            }
        }, onfail);
        getdata.callOtherDomain();
    } catch (e) {
        alert1(e + '_get_template_checksheet_from_server');
        loading_hide();
    }
}

// poopup table
function get_data_to_fill(row_count, obj_id, temp_btnSearch_Counter) {
    try {

        // new type20 dependency logic on searchable table row selection (06/12/2019)
        var type20_dependency_str = $('#hdn_type20_dependency_data_' + temp_btnSearch_Counter + '').val();
        if (type20_dependency_str == '' || type20_dependency_str == null || type20_dependency_str == undefined) { }
        else {
            var type20_dependency_data = JSON.parse(decodeURIComponent(type20_dependency_str));
            if (type20_dependency_data.length > 0) {
                // type20 dependency found
                var logData = $("#hdn_logData_" + row_count + "").attr('logData');
                if (logData == '' || logData == null || logData == undefined) { }
                else {
                    logData = JSON.parse(logData);

                    for (d = 0; d < type20_dependency_data.length; d++) {
                        var dep_type20_que_id = type20_dependency_data[d].dep_type20_que_id;

                        for (g = 0; g < logData.length; g++) {
                            var que_id = logData[g].que_id;
                            if (que_id == dep_type20_que_id) {
                                var ans = logData[g].ans[0];
                                type20_dependency_data[d].ele_ans = ans;

                                $('#hdn_type20_dependency_data_' + temp_btnSearch_Counter + '').val(encodeURIComponent(JSON.stringify(type20_dependency_data)))
                                set_global_show_hide_class(encodeURIComponent(JSON.stringify(type20_dependency_data)));
                                break;
                            }
                        }
                    }
                }

            }
        }

        curr_btnSearch_Counter = temp_btnSearch_Counter;
        var temp_cell_value = $("#hdn_type20_popup_row_data_" + row_count + "").attr("name");
        var tempfieldArray = $("#hdn_type20_popup_row_data_" + row_count + "").val();
        popup_items_hide_type20();
        fill_data_to_box(obj_id, temp_cell_value, tempfieldArray, temp_btnSearch_Counter);
    } catch (e) {
        alert1(e + '_get_data_to_fill()');
        loading_hide();
    }
}

// below ul list
function get_data_to_fill_ul(row_count, obj_id, temp_btnSearch_Counter) {
    try {
        form_has_changed = "true";                      //to get confirmation on back btn while editing form
        var fill_btnSearch_Counter = temp_btnSearch_Counter;
        var temp_cell_value = $("#hdn_type20_row_data_" + row_count + "").attr("name");
        var tempfieldArray = $("#hdn_type20_row_data_" + row_count + "").val();
        fill_data_to_box(obj_id, temp_cell_value, tempfieldArray, temp_btnSearch_Counter);
    } catch (e) {
        alert1(e + '_get_data_to_fill_ul');
        loading_hide();
    }
}

function empty_data_to_box(temp_btnSearch_Counter) {
    try {
        var Fill_Data_Str = $('#hdn_select_all_fill_data_' + temp_btnSearch_Counter + '').val();
        var Fill_Data = itemObj._checkStrObj(decodeURIComponent(Fill_Data_Str));  		// check_item
        for (fj = 0; fj < Fill_Data.length; fj++) {
            var box_class = Fill_Data[fj].classname;
            var objectfill = Fill_Data[fj].objectfill;
            if (objectfill != "label") {
                var ddl_found = $("." + box_class + "").find("select");
                var rdo_found = $("." + box_class + "").find("input[type='radio']");
                if (ddl_found.length > 0) {
                    var below_ddl_id = $("." + box_class + "").find("select").attr("id");
                    $("#" + below_ddl_id + " option").removeAttr("selected");
                    $("#" + below_ddl_id + "").val($("#" + below_ddl_id + " option:first").val());

                    var onchange_avail = $("#" + below_ddl_id + "").attr("onchange");
                    if (onchange_avail == '' || onchange_avail == null || onchange_avail == undefined) { }
                    else {
                        setTimeout(function () {
                            $("#" + below_ddl_id + "").trigger("onchange");
                        }, 1000);
                    }
                }
                else if (rdo_found.length > 0) {
                    $('div.' + box_class + ' input[type="radio"]').prop('checked', false);
                }
                else {
                    // below text box found to empty
                    var box_id = [];
                    $("." + box_class + " :input").each(function () {
                        var box_id_temp = ($(this).attr('id'));
                        if (box_id_temp.indexOf("_cbtn_") > -1) {
                            // do not emty camera hidden fields - mk - 10072025
                        }
                        else {
                            box_id.push(box_id_temp);
                        }
                    });

                    if (box_id.length == 0 || box_id[0] == undefined) {
                        $("." + box_class + " textarea").each(function () {
                            var box_id_temp = ($(this).attr('id'));
                            box_id.push(box_id_temp);
                        });
                    }

                    if (box_id.length == 0 || box_id[0] == undefined) {
                        $("." + box_class + " select").each(function () {
                            var box_id_temp = ($(this).attr('id'));
                            box_id.push(box_id_temp);
                        });
                    }

                    if (box_id.length == 0 || box_id[0] == undefined) {
                        $("." + box_class + " img[id^=cbtn]").each(function () {
                            var box_id_temp = ($(this).attr('id'));
                            box_id.push(box_id_temp);
                        });
                    }

                    for (fk = 0; fk < box_id.length; fk++) {
                        var curr_box_id = box_id[fk];
                        $("#" + curr_box_id + "").val("");

                        if ($("#" + curr_box_id + "").is("img")) {
                            $("#" + curr_box_id + "").attr("src", "images/camera.png");

                            // empty cam ans - mk - 28072025 - atc
                            var autofill_form_flag = $('#hdn_select_all_fill_data_' + temp_btnSearch_Counter + '').attr("autofill_form_flag");
                            if (autofill_form_flag == 0 || autofill_form_flag == 6) {
                                var new_que_id = $("#" + curr_box_id + "").parents("div[id^='div_cbtn_']").attr("que_id");
                                for (var j = 0; j < jsonObj_old.length; j++) {
                                    var json_que_id = jsonObj_old[j].que_id;
                                    if (new_que_id == json_que_id) {

                                        let task_create_popup = $('.popup-new-task-create.modal-in:visible');
                                        if (task_create_popup.length > 0) {
                                            //new task create popup [FT-08052025]
                                            jsonObj_task_add[j].ans = [""];
                                        }
                                        else {
                                            jsonObj_old[j].ans = [""];
                                        }
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    } catch (e) {
        alert1(e + '_empty_data_to_box()');
        loading_hide();
    }
}

// put searched details to boxes on particular list click
function fill_data_to_box(obj_id, temp_cell_value, tempfieldArray, temp_btnSearch_Counter, t_checksheet_type_id) {
    try {
        loading();
        var myArray = itemObj._checkStrObj(tempfieldArray);  		// check_item
        var autofill_form_flag = $('#hdn_select_all_fill_data_' + temp_btnSearch_Counter + '').attr("autofill_form_flag");
        var Fill_Data_Str = $('#hdn_select_all_fill_data_' + temp_btnSearch_Counter + '').val();
        $('#search_item_name_Search_' + temp_btnSearch_Counter + '').val(temp_cell_value);
        $('#search_item_name_Search_' + temp_btnSearch_Counter + '').attr('title', obj_id);
        $('#search_item_name_Search_' + temp_btnSearch_Counter + '').attr('name', '1');
        $("#product_list_" + temp_btnSearch_Counter + "").empty();

        mobile_log_clone_Array = [];
        var Fill_Data = itemObj._checkStrObj(decodeURIComponent(Fill_Data_Str));  		// check_item
        for (fj = 0; fj < Fill_Data.length; fj++) {
            var old_fieldname = Fill_Data[fj].fieldname;
            var old_que_id = Fill_Data[fj].queid;
            var col_found = 0;
            var box_class = Fill_Data[fj].classname;
            $("." + box_class + "").find('.cls_removable_op').remove();  // remove last filled additional field in drop down
            $("." + box_class + "").attr("autofill_parent_id", "div_Search_" + temp_btnSearch_Counter + "");

            for (fi = 0; fi < myArray.length; fi++) {
                var fieldname = myArray[fi].fieldname;
                var queid = myArray[fi].queid;
                var fieldvalue = myArray[fi].value;

                if (queid == "" || queid == null || queid == undefined) {

                    if (queid == "0") {
                        var curr_field = queid;
                        var old_field = old_que_id;
                    }
                    else {
                        //for quelog checksheet data autofill [27042021]
                        var curr_field = fieldname.toLowerCase();
                        var old_field = old_fieldname.toLowerCase();
                    }
                }
                else {
                    var curr_field = queid;
                    var old_field = old_que_id;
                }

                if (old_fieldname == '<#Target_Id#>') {
                    fieldvalue = obj_id;
                    curr_field = 0;  // set que id 0
                }
                else if (old_fieldname == '<#Target_Value#>') {
                    fieldvalue = temp_cell_value;
                    curr_field = 0;  // set que id 0
                }

                if (fieldname == "" || fieldname == null || fieldname == undefined) {
                    fieldname = "";
                }

                if (fieldvalue == "" || fieldvalue == null || fieldvalue == undefined) {
                    if ("img_ary" in myArray[fi]) {
                        // possible blacnk image object
                        fieldvalue = "test_image"
                        myArray[fi].img_ary[0] = "test_image_name";
                        myArray[fi].fieldvalue = "test_image";
                    }
                }

                //if (fieldname.toLowerCase() == old_fieldname.toLowerCase()) {
                if ((fieldname.toLowerCase() == old_fieldname.toLowerCase()) || (curr_field == old_field)) {
                    col_found++;
                    var box_id = [];
                    var box_class = Fill_Data[fj].classname;
                    var box_editable = Fill_Data[fj].editable;

                    var ddl_found = $("." + box_class + "").find("select");
                    if (ddl_found.length > 0) {
                        // below dropdown found to fill
                        var below_ddl_id = $("." + box_class + "").find("select").attr("id");
                        //var new_op_str = '<option class="cls_removable_op" selected="selected">' + fieldvalue + '</option>';
                        //$("#" + below_ddl_id + "").append(new_op_str);

                        if (below_ddl_id.indexOf("ddl_search_type20_") > -1) {
                            // searchabe control
                            fieldvalue = encodeURIComponent(fieldvalue);
                        }

                        $("#" + below_ddl_id + "").val(fieldvalue);

                        // ignore case in normal drodown type 3 - 22032021
                        $("#" + below_ddl_id + " option").each(function () {
                            if ($(this).val().toLowerCase() == fieldvalue.toLowerCase()) $(this).attr("selected", "selected");
                        });

                        var onchange_avail = $("#" + below_ddl_id + "").attr("onchange");
                        if (onchange_avail == '' || onchange_avail == null || onchange_avail == undefined) { }
                        else {
                            setTimeout(function () {
                                // 28042022 - delay dropdown onchange event - having issue when dropdown and below dependent text boxes both are autofill by top searchable control
                                $("#" + below_ddl_id + "").trigger("onchange");
                            }, 1000);
                        }

                        if (box_editable == "false") {
                            $("#" + below_ddl_id + "").prop("disabled", true);
                        }
                        else if (box_editable == "hidden") {
                            $("#div_" + below_ddl_id + "").css("display", "none");
                        }
                    }
                    else {
                        // below text box found to fill
                        $("." + box_class + " :input").each(function () {
                            var box_id_temp = ($(this).attr('id'));
                            if (box_id_temp.indexOf("_cbtn_") > -1) {
                                // do not emty camera hidden fields - mk - 10072025
                            }
                            else {
                                box_id.push(box_id_temp);
                            }
                        });

                        //img autofill [FT-18022025]
                        $("." + box_class + " img[id^=cbtn]").each(function () {
                            var box_id_temp = ($(this).attr('id'));
                            box_id.push(box_id_temp);
                        });

                        for (fk = 0; fk < box_id.length; fk++) {
                            var curr_box_id = box_id[fk];

                            var tagName = $("#" + curr_box_id + "").prop("tagName");
                            if (tagName == "TEXTAREA") {
                                $("#" + curr_box_id + "").attr("rows", "5")
                            }

                            if (curr_box_id.indexOf("cal_") > -1) {
                                var mode = myArray[fi].mode;
                                fieldvalue = convert_datetime_by_format(fieldvalue, mode);
                            }

                            var objectfill = Fill_Data[fj].objectfill;
                            if (objectfill == "label") {
                                // label fill
                                var box_class = Fill_Data[fj].classname;
                                var tar_div = $("div." + box_class + "");

                                if (form_flag == 12) {
                                    // group of forms
                                    var cd_index = temp_btnSearch_Counter.indexOf("cd_");
                                    var cd_div = temp_btnSearch_Counter.substring(cd_index, temp_btnSearch_Counter.length);
                                    var old_label = $("#" + cd_div + "").find(tar_div).find('.lbl_type5').html();
                                    var is_filled = $("#" + cd_div + "").find(tar_div).find('.lbl_type5').attr("is_filled");
                                    if (is_filled != "true") {
                                        var new_label = old_label + ' (' + fieldvalue + ')';
                                        $("#" + cd_div + "").find(tar_div).find('.lbl_type5').html(new_label);
                                        $("#" + cd_div + "").find(tar_div).find('.lbl_type5').attr("is_filled", "true");
                                    }
                                    //var filled_label = $("#" + cd_div + "").find("div." + box_class + "").find('.col-lg-6:first').find('div').find('.objectfilled');
                                    //if (filled_label.length == 0) {
                                    //    $("#" + cd_div + "").find("div." + box_class + "").find('.col-lg-6:first').find('div').append(label_str);
                                    //    $("#" + cd_div + "").find("div." + box_class + "").find('.col-lg-6:first').find('div').find('label:first').css({ 'right': '25px', 'bottom': '-10px' });
                                    //}
                                }
                                else {
                                    // single form
                                    var old_label = $(tar_div).find('.lbl_type5').html();
                                    var is_filled = $(tar_div).find('.lbl_type5').attr("is_filled");
                                    if (is_filled != "true") {
                                        var new_label = old_label + ' (' + fieldvalue + ')';
                                        $(tar_div).find('.lbl_type5').html(new_label);
                                        $(tar_div).find('.lbl_type5').attr("is_filled", "true");
                                    }
                                }
                            }
                            else {
                                if (curr_box_id.indexOf("rdo_") > -1) {
                                    // radio autoselect
                                    $('div.' + box_class + ' input[type="radio"][value="' + fieldvalue + '"]').prop('checked', true);
                                }
                                else if ($("#" + curr_box_id + "").is("img")) {
                                    //img autofill [FT-18022025]

                                    let img_onchange_str = $("#" + curr_box_id + "").attr("onchange");
                                    if (img_onchange_str == "" || img_onchange_str == null || img_onchange_str == undefined) { }
                                    else {
                                        $("#" + curr_box_id + "").trigger("onchange");
                                    }

                                    var img_new_id = curr_box_id.replace('cbtn_', '');
                                    let new_que_id = $("#div_cbtn_" + img_new_id).attr('que_id'); 
                                    var img_ary = myArray[fi].img_ary;
                                    
                                    if (img_ary == "" || img_ary == null || img_ary == undefined) {
                                        // livelinkg with image type 40
                                        $("#" + curr_box_id + "").attr("src", fieldvalue);
                                        $("#" + curr_box_id + "").attr('autofill', "true");

                                        img_ary = [fieldvalue,'','','',''];

                                        if (autofill_form_flag == 0 || autofill_form_flag == 6) {
                                            for (var j = 0; j < jsonObj_old.length; j++) {
                                                var json_que_id = jsonObj_old[j].que_id;
                                                if (new_que_id == json_que_id) {

                                                    if (autofill_form_flag == 0) {
                                                        // set dummy photo_id for images those are autofilled from mobile log checksheet - no need to call clone api in such case
                                                        img_ary[4] = "0";
                                                    }
                                                    else {
                                                        img_ary[4] = "";
                                                    }

                                                    img_ary[5] = "";

                                                    let task_create_popup = $('.popup-new-task-create.modal-in:visible');
                                                    if (task_create_popup.length > 0) {
                                                        //new task create popup [FT-08052025]
                                                        jsonObj_task_add[j].ans = img_ary;
                                                    }
                                                    else {
                                                        jsonObj_old[j].ans = img_ary;
                                                    }
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        var img_src = img_ary[0];
                                        if (img_src == "" || img_src == null || img_src == undefined || img_src == "test_image_name") {
                                            // photo is not exist in original entity - mk - 10072025
                                            $("#" + curr_box_id + "").attr("src", "images/camera.png");
                                        }
                                        else {
                                            var p_name = img_ary[1];
                                            var photo_id = img_ary[4];
                                            var curr_file_size_mb = img_ary[5];
                                            var img_que_id = myArray[fi].queid;

                                            var Condition_Data_Str = $('#hdn_condition_data_' + temp_btnSearch_Counter + '').val();

                                            var t_Condition_Data_Str = decodeURIComponent(Condition_Data_Str)
                                            var Condition_Data = JSON.parse(t_Condition_Data_Str);
                                            var value_new = Condition_Data[0].value_new;
                                            var type20_checksheet_id = value_new[0].Checksheet_id;

                                            if (autofill_form_flag == 6) {
                                                // Task checksheet
                                                var new_checksheet_type = "5";
                                            }
                                            else if (autofill_form_flag == 7) {
                                                // Customer checksheet
                                                var new_checksheet_type = "3";
                                            }
                                            else {
                                                // Mobile Log checksheet
                                                var new_checksheet_type = "1";
                                                obj_id = curr_all_data_20["task_id"];
                                            }

                                            localStorage.setItem('ID_useType22', obj_id);

                                            var img_src = get_upload_media_live_link(img_que_id, type20_checksheet_id, t_checksheet_type_id);

                                            let rebind_str = "rebind_autofill_photo_temp('#" + curr_box_id + "','" + img_src + "')";
                                            $("#" + curr_box_id + "").attr('src', img_src);
                                            $("#" + curr_box_id + "").attr('onerror', rebind_str);

                                     
                                            if (autofill_form_flag == 0 || autofill_form_flag == 6) {
                                                for (var j = 0; j < jsonObj_old.length; j++) {
                                                    var json_que_id = jsonObj_old[j].que_id;
                                                    if (new_que_id == json_que_id) {

                                                        img_ary[4] = "";        // make photo id blank - mk - 26112025
                                                        img_ary[5] = "";

                                                        let task_create_popup = $('.popup-new-task-create.modal-in:visible');
                                                        if (task_create_popup.length > 0) {
                                                            //new task create popup [FT-08052025]
                                                            jsonObj_task_add[j].ans = img_ary;
                                                        }
                                                        else {
                                                            jsonObj_old[j].ans = img_ary;
                                                        }
                                                        break;
                                                    }
                                                }
                                            }

                                            let old_primary_id = obj_id;
                                            let old_checksheet_id = type20_checksheet_id;
                                            let old_que_id = JSON.stringify(img_que_id);
                                            let new_checksheet_id = value_new[0].Current_Checksheet_id;

                                            let param_obj = [];
                                            param_obj.push({
                                                "old_id": old_primary_id,
                                                "old_cid": old_checksheet_id,
                                                "old_qd": old_que_id,
                                                "old_t22id": "0",
                                                "old_t22i": "0",
                                                "new_id": "",
                                                "new_ctype": new_checksheet_type,
                                                "new_cid": new_checksheet_id,
                                                "new_qd": new_que_id,
                                                "new_t22id": "0",
                                                "new_t22i": "0"
                                            });

                                            $("#" + curr_box_id + "").attr('autofill', "true");
                                            $("#" + curr_box_id + "").attr('autofill_obj', JSON.stringify(param_obj));

                                            if (new_checksheet_type != 1) {
                                                // task/customer/user
                                                upload_autofill_photo_temp(old_primary_id, old_checksheet_id, old_que_id, new_checksheet_type, new_checksheet_id, new_que_id, autofill_form_flag, curr_box_id);
                                            }
                                            else {
                                                //upload_autofill_photo_temp_mobile_checksheet(new_que_id, img_src);
                                                if (jsonObj_old[j].type == 7) {
                                                    mobile_log_clone_Array.push({
                                                        que_id: new_que_id,
                                                        src: img_src,
                                                        index: j
                                                    });
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    // textbox fill
                                    $("#" + curr_box_id + "").val(fieldvalue);

                                    var oninput_str = $("#" + curr_box_id + "").attr("oninput");
                                    if (oninput_str == '' || oninput_str == null || oninput_str == undefined) {
                                        var onchange_str = $("#" + curr_box_id + "").attr("onchange");
                                        if (onchange_str == '' || onchange_str == null || onchange_str == undefined) { }
                                        else {
                                            $("#" + curr_box_id + "").trigger('onchange');
                                        }
                                    }
                                    else {
                                        $("#" + curr_box_id + "").trigger('oninput');
                                    }
                                }
                            }

                            if (fieldvalue == '' || fieldvalue == null || fieldvalue == undefined) {
                                $("#" + curr_box_id + "").prop("disabled", false);

                                // commented with reference to Aseet Tagging >> PP Asset Test checksheet in Tower URL - mk - 09042025
                                //$("#div_" + curr_box_id + "").show();
                            }
                            else {
                                if (box_editable == "false") {
                                    $("#" + curr_box_id + "").prop("disabled", true);
                                }
                                else if (box_editable == "hidden") {
                                    $("#div_" + curr_box_id + "").css("display", "none");
                                }
                            }
                        }
                    }
                    break;
                }
            }
            if (col_found == 0) {
                //alert1(old_fieldname + " not found in details for autofill !");

                var img_box_id = [];

                //img autofill [FT-18022025]
                $("." + box_class + " img[id^=cbtn]").each(function () {
                    var box_id_temp = ($(this).attr('id'));
                    img_box_id.push(box_id_temp);
                });

                for (var i = 0; i < img_box_id.length; i++) {
                    var curr_img_box_id = img_box_id[i];
                    $("#" + curr_img_box_id + "").attr('src', 'images/camera.png');
                }
            }
        }

        var Condition_Data_Str = $('#hdn_condition_data_' + temp_btnSearch_Counter + '').val();
        var t_Condition_Data = JSON.parse(decodeURIComponent(Condition_Data_Str));
        var push_data = t_Condition_Data[0].push_data;
        if (push_data == '' || push_data == null || push_data == undefined) {
            push_data = [];
            var push_array = [];
        } else {
            var push_array = push_data[0].push_array;
        }

        var is_json = 0;
        if (push_array.length > 0) {
            var push_array_str = JSON.stringify(push_array);
            var json_check = push_array_str[1];
            if (json_check == '{') {
                is_json = 1;
            }
        }

        for (l = 0; l < push_array.length; l++) {
            if (is_json == 0) {
                var get_value = push_array[l];
                var value_type = get_value.substring(2, 1);
                var sub_get_value = get_value.substring(2, get_value.length - 2);
            } else {
                var get_value = push_array[l].value;
                var value_type = get_value.substring(2, 1);
                var sub_get_value = get_value.substring(2, get_value.length - 2);
            }
            if (value_type == "@") {
                // class value
                var where_box_id = $("." + sub_get_value + " :input").attr("id");
                $("#" + where_box_id + "").attr('name', '1');
            }
        }

        // custom devleopment for atc (ZTS)
        var check_type = JSON.parse(storage.getItem('check_type'));
        if (check_type == '4456' || check_type == '4458') {
            refresh_dyndll_type30_onchange();
        }

        // check for new dropdown onchange event fire with single option
        check_and_call_next_single_option();

        ///////-----auto click calc on type20 dd list-item click(05122019)--------////////////
        press_calc_Array = $("#div_inv_form").find("[id^='txt_Calc_']");
        if (press_calc_Array.length > 0) {
            auto_click_calc_type = "invoice_type20_autofill";
            call_calc_click(press_calc_Array);
        }

        // in case when 2 single option searchable dropdown remains - 1st searchable is not parent but it autofills some data only in this case 2nd single option searchable is not called- 19032021
        if (Type20_AutoFill_DDL_Array.length == 0) {
            check_and_call_next_single_option();
        }

        if (mobile_log_clone_Array.length > 0) {
            check_n_upload_mobile_checksheet_clone_photo(mobile_log_clone_Array);
        }

        loading_hide();

    } catch (e) {
        alert1(e + '_fill_data_to_box()');
        loading_hide();
    }
}


// rebuild searchable push array by getting required value
function pass_required_values_to_push_array(t_push_data_str) {
    var t_push_data = JSON.parse(t_push_data_str)
    if (t_push_data == '' || t_push_data == null || t_push_data == undefined) {
        t_push_data = [];
        var push_array = [];
        //var view_style = 'tableview';
    }
    else {
        var push_array = t_push_data[0].push_array;
        //var view_style = t_push_data[0].view_style;
    }
    var view_style = 'dropdownview';                   //searchable is displayed in dropdown view only(25112019)

    //check old push_array or new push_array(with json)
    var is_json = 0;
    if (push_array.length > 0) {
        var push_array_str = JSON.stringify(push_array);
        var json_check = push_array_str[1];
        if (json_check == '{') {
            is_json = 1;
        }
    }

    // group task
    if (form_flag == 12) {
        var cd_index = curr_btnSearch_Counter.indexOf("cd_");
        var cd_div = curr_btnSearch_Counter.substring(cd_index, curr_btnSearch_Counter.length);
        var t_server_task_id = cd_div.replace("cd_", "");
        var curr_all_data_20_Array = JSON.parse(localStorage.getItem("curr_all_data_20_Array"));

        var gt_columndata = [];
        for (gt1 = 0; gt1 < curr_all_data_20_Array.length; gt1++) {
            var server_task_id = curr_all_data_20_Array[gt1].server_task_id;
            if (server_task_id == t_server_task_id) {
                gt_columndata = curr_all_data_20_Array[gt1].columndata;
                break;
            }
        }
    }

    var ref_valid = 0;
    var pass_type = 'id';
    for (i = 0; i < push_array.length; i++) {
        if (is_json == 0) {
            var get_value = push_array[i];
            var value_type = get_value.substring(2, 1);
            var sub_get_value = get_value.substring(2, get_value.length - 2);
        }
        else {
            var get_value = push_array[i].value;
            pass_type = push_array[i].type;
            var value_type = get_value.substring(2, 1);
            var sub_get_value = get_value.substring(2, get_value.length - 2);
        }

        if (value_type == "#") {
            // system value

            var company_id = JSON.parse(storage.getItem('company_id'));
            var user_id = JSON.parse(storage.getItem('user_id'));
            var user_name = JSON.parse(storage.getItem('user_name'));
            var module_id = JSON.parse(window.storage.getItem('wayflow'));
            var module_name = JSON.parse(window.storage.getItem('wayflow_name'));
            var role_id = JSON.parse(storage.getItem('role_id'));
            var role_name = JSON.parse(storage.getItem('role_name'));
            var circle_id = JSON.parse(storage.getItem('circle_id'));

            var circle_name = JSON.parse(storage.getItem('circle_array'));
            if (circle_name == '' || circle_name == null || circle_name == undefined) {
                var circle_name = JSON.parse(storage.getItem('circle_name'));
            }

            try {
                var server_task_id = JSON.parse(storage.getItem('server_task_id'));
                curr_all_data_20["task_id"] = server_task_id;

                var p_server_task_id = JSON.parse(storage.getItem('p_server_task_id'));
                curr_all_data_20["parent_task_id"] = p_server_task_id;
            } catch (e) { }

            curr_all_data_20["company_id"] = company_id;
            curr_all_data_20["user_id"] = user_id;
            curr_all_data_20["user_name"] = user_name;
            curr_all_data_20["module_id"] = module_id;
            curr_all_data_20["module_name"] = module_name;
            curr_all_data_20["flow_id"] = module_id;
            curr_all_data_20["flow_name"] = module_name;
            curr_all_data_20["role_id"] = role_id;
            curr_all_data_20["role_name"] = role_name;
            curr_all_data_20["circle_id"] = circle_id;
            curr_all_data_20["circle_name"] = circle_name;

            var type20_columndata = JSON.parse(storage.getItem('type20_columndata'));
            if (type20_columndata == '' || type20_columndata == null || type20_columndata == undefined) { }
            else {
                for (c = 0; c < type20_columndata.length; c++) {
                    var key = type20_columndata[c].header;
                    var value = type20_columndata[c].ans;
                    curr_all_data_20[key] = value;
                }
            }

            try {
                var customer_columndata = JSON.parse(storage.getItem('customer_columndata'));
                if (customer_columndata == '' || customer_columndata == null || customer_columndata == undefined) { }
                else {
                    for (c = 0; c < customer_columndata.length; c++) {
                        var key = customer_columndata[c].header;
                        var value = customer_columndata[c].ans;
                        curr_all_data_20[key] = value;
                    }
                }
            } catch (e) { }

            if (form_flag == 12) {
                // group task
                for (c = 0; c < gt_columndata.length; c++) {
                    var key = gt_columndata[c].header;
                    if (sub_get_value == key) {
                        var new_get_value = gt_columndata[c].ans;
                        break;
                    }
                }
            }
            else {
                var new_get_value = curr_all_data_20[sub_get_value];
            }

            //new_get_value = new_get_value.replace(/"/g, "");
        }
        else {
            var select_avail = $("." + sub_get_value + "").find("select");
            if (select_avail.length > 0) {
                var where_box_id = $("." + sub_get_value + "").find("select").attr("id");
                var target_type20_ddl_id = 'ddl_search_type20_' + curr_btnSearch_Counter + '';

                // check for getting id value from type20 dropdown (numeric) - atc - 08062020
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
                        var id = $(this).val();
                        var text = $(this).text();
                        if (id != '0' && id != 'All') {
                            id_Array.push(id);
                            text_Array.push(text);
                        }
                    });

                    var t_ans_id = JSON.stringify(id_Array);
                    var t_ans_text = JSON.stringify(text_Array);
                    var sub_t_ans_id = '"' + t_ans_id.substring(2, t_ans_id.length - 2) + '"';
                    var sub_t_ans_text = t_ans_text.substring(1, t_ans_text.length - 1);
                    ans_id = sub_t_ans_id.replace(/"/g, "'");
                    ans_text = sub_t_ans_text.replace(/"/g, "'");
                }
                ////////////--- flush bottom type20 fields start ---- ///////////////
                if (view_style == 'tableview' || view_style == 'listview') {
                    set_blank_type20_field_by_dropdown(sub_get_value);
                }
                ////////////--- flush bottom type20 fields end ---- ///////////////
            }
            else {
                var where_box_id = $("." + sub_get_value + " :input[type='text']").attr("id");

                if (where_box_id == "" || where_box_id == null || where_box_id == undefined) {
                    //check for type22 control
                    where_box_id = $("td." + sub_get_value + "").attr("id");

                    if (where_box_id == "" || where_box_id == null || where_box_id == undefined) { }
                    else {
                        //type22 sum value
                        var ans_text = $("#" + where_box_id + "").text();

                        ///----invoice sum in where condition of type20 tableview (09122019: urbanJungle)----/////
                        var sum_parent_div = $("#" + where_box_id + "").parents("div[id^=div_Inv_Calculate]").attr('id');
                        $("#" + sum_parent_div).attr("type20_trigger_id", curr_btnSearch_Counter);
                        $("#" + sum_parent_div).attr("type20_view_style", view_style);
                    }
                }
                else {
                    $("#" + where_box_id + "").attr("onkeydown", "make_blank_type20_field(this)");
                    var ans_id = $("#" + where_box_id + "").attr('title');
                    var ans_text = $("#" + where_box_id + "").val();

                    if (where_box_id.indexOf('cal_') > -1) {
                        var mode = $("#" + where_box_id + "").attr("data-field");
                        ans_text = convert_fix_format_date_on_submit(ans_text, mode);
                    }

                }
                if (ans_id == "" || ans_id == null || ans_id == undefined) {
                    ans_id = "1";                           //for other controls...
                }
            }
            if (ans_id == "" || ans_id == null || ans_id == undefined || ans_id == "0" || ans_id == "--- Select Values ---" || ans_id == "All" || ans_text == "" || ans_text == null || ans_text == undefined) {
                //highlight div when no any value is selected for type 20 tableview
                var where_box_id = $("." + sub_get_value + "").find("select").attr("id");
                if (where_box_id == "" || where_box_id == null || where_box_id == undefined) {
                    where_box_id = $("." + sub_get_value + " :input[type='text']").attr("id");
                    if (where_box_id == "" || where_box_id == null || where_box_id == undefined) {
                        //check for type22 control
                        where_box_id = $("td." + sub_get_value + " ").attr("id");
                    }
                }
                var div_scroll = $('#Div_scroll_Task').parent();
                try {
                    $(div_scroll).animate({ scrollTop: $('#' + where_box_id).offset().top - 300 }, 300);
                }
                catch (e) { }

                //var type22_popup = $('.popup-type22:visible');
                //if (type22_popup.length > 0) {
                //    //don't show border in invoice type20 (UrbanJungle---30122019)
                //}
                //else {
                //    mk_animate_border('#' + where_box_id, 0, 500, '#FF0000');
                //}

                ref_valid++;
                break;
            }

            // check replace with id or text
            if (pass_type == 'id') {
                new_get_value = ans_id;
            }
            else {
                new_get_value = ans_text;
            }
        }

        t_push_data[0].push_array[i]['ans'] = new_get_value;
        //Condition_Data_Str = Condition_Data_Str.replace(get_value, new_get_value);
    }

    t_push_data_str = JSON.stringify(t_push_data);
    var p_array = [t_push_data_str, ref_valid];
    return p_array;
}

// replace required values in filter push array
function pass_required_values_to_filter_push_array(new_id, t_que_id, t_id, t_text, ele_type) {
    try {

        var flag_type = JSON.parse(storage.getItem('checksheet_type_filter'));
        if (flag_type == "10") {
            var filter_button_Data = JSON.parse(localStorage.getItem('checksheet_AllData_First'));
        } else {
            var filter_button_Data = JSON.parse(localStorage.getItem('checksheet_AllData'));
        }

        var push_array = filter_button_Data[0].Push_array;
        for (i = 0; i < push_array.length; i++) {
            var pass_type = push_array[i].type;
            var get_value = push_array[i].value;

            if (get_value == "(*10001*)") {
                var ans_id = $("#ddl_flow :selected").val();
                var ans_text = $("#ddl_flow :selected").text();
                if (ans_id == "" || ans_id == null || ans_id == undefined) {
                    var ans_id = $("#ddl_FlowName :selected").val();
                    var ans_text = $("#ddl_FlowName :selected").text();
                }

                // check replace with id or text
                if (pass_type == 'id') {
                    filter_button_Data[0].Push_array[i]['ans'] = ans_id;
                }
                else {
                    filter_button_Data[0].Push_array[i]['ans'] = ans_text;
                }
            }
            else {
                var que_id = get_value.substring(2, get_value.length - 2);
                if (que_id == t_que_id) {

                    var first_2char = get_value.substring(0, 2);
                    if (first_2char == "(*") {
                        if (ele_type == "8") {
                            // type 8
                            var ans_id = t_id;
                            var ans_text = t_text;
                        }
                        else {
                            // type 20
                            if (t_id == 'All') {
                                var id_Array = [];
                                var text_Array = [];
                                $('#ddl_search_type20_' + new_id + ' > option').each(function () {
                                    var id = $(this).val();
                                    var text = $(this).text();
                                    if (id != '0' && id != 'All') {
                                        id_Array.push(id);
                                        text_Array.push(text);
                                    }
                                });
                                var t_ans_id = JSON.stringify(id_Array);
                                var t_ans_text = JSON.stringify(text_Array);
                                var sub_t_ans_id = '"' + t_ans_id.substring(2, t_ans_id.length - 2) + '"';
                                var sub_t_ans_text = t_ans_text.substring(1,
                                    t_ans_text.length - 1);
                                var ans_id = sub_t_ans_id.replace(/"/g, "'");
                                var ans_text = sub_t_ans_text.replace(/"/g, "'");
                            }
                            else {
                                var ans_id = t_id;
                                var ans_text = t_text;
                            }
                        }
                    }

                    // check replace with id or text
                    if (pass_type == 'id') {
                        filter_button_Data[0].Push_array[i]['ans'] = ans_id;
                    }
                    else {
                        filter_button_Data[0].Push_array[i]['ans'] = ans_text;
                    }
                    break;
                }
            }


        }

        if (flag_type == "10") {
            localStorage.setItem('checksheet_AllData_First', JSON.stringify(filter_button_Data));
        } else {
            localStorage.setItem('checksheet_AllData', JSON.stringify(filter_button_Data));
        }

    } catch (e) {
        alert1(e + '_pass_required_values_to_filter_push_array()');
        loading_hide();
    }
}


// rebuild query string by getting required value
function pass_required_values_to_querystring(Condition_Data_Str) {
    try {
        Condition_Data_Str = decodeURIComponent(Condition_Data_Str)
        var t_Condition_Data = itemObj._checkStrObj(Condition_Data_Str);  		// check_item

        var push_data = t_Condition_Data[0].push_data;
        if (push_data == '' || push_data == null || push_data == undefined) {
            push_data = [];
            var push_array = [];
            //var view_style = 'tableview';
        }
        else {
            var push_array = push_data[0].push_array;
            //if (ddl_listview == "true") {
            //    var view_style = 'listview';
            //}
            //else {
            //    var view_style = push_data[0].view_style;
            //}
        }

        if (ddl_listview == "true") {
            var view_style = 'listview';
        }
        else {
            var view_style = 'dropdownview';                   //searchable is displayed in dropdown view only(25112019)
        }

        // check old push_array or new push_array(with json)
        var is_json = 0;
        if (push_array.length > 0) {
            var push_array_str = JSON.stringify(push_array);
            var json_check = push_array_str[1];
            if (json_check == '{') {
                is_json = 1;
            }
        }

        var ref_valid = 0;
        var pass_type = 'id';
        for (i = 0; i < push_array.length; i++) {
            if (is_json == 0) {
                var get_value = push_array[i];
                var value_type = get_value.substring(2, 1);
                var sub_get_value = get_value.substring(2, get_value.length - 2);
            } else {
                var get_value = push_array[i].value;
                pass_type = push_array[i].type;
                var value_type = get_value.substring(2, 1);
                var sub_get_value = get_value.substring(2, get_value.length - 2);
            }

            if (value_type == "#") {
                // system value
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
                    var server_task_id = JSON.parse(storage.getItem('server_task_id'));
                    curr_all_data_20["task_id"] = server_task_id;

                    var p_server_task_id = JSON.parse(storage.getItem('p_server_task_id'));
                    curr_all_data_20["parent_task_id"] = p_server_task_id;
                } catch (e) { }

                curr_all_data_20["company_id"] = company_id;
                curr_all_data_20["user_id"] = user_id;
                curr_all_data_20["user_name"] = user_name;
                curr_all_data_20["module_id"] = module_id;
                curr_all_data_20["module_name"] = module_name;
                curr_all_data_20["role_id"] = role_id;
                curr_all_data_20["role_name"] = role_name;
                curr_all_data_20["circle_id"] = circle_id;
                curr_all_data_20["circle_name"] = circle_name;

                var type20_columndata = JSON.parse(storage.getItem('type20_columndata'));
                if (type20_columndata == '' || type20_columndata == null || type20_columndata == undefined) { }
                else {
                    for (c = 0; c < type20_columndata.length; c++) {
                        var key = type20_columndata[c].header;
                        var value = type20_columndata[c].ans;
                        curr_all_data_20[key] = value;
                    }
                }

                try {
                    var customer_columndata = JSON.parse(storage.getItem('customer_columndata'));
                    if (customer_columndata == '' || customer_columndata == null || customer_columndata == undefined) { }
                    else {
                        for (c = 0; c < customer_columndata.length; c++) {
                            var key = customer_columndata[c].header;
                            var value = customer_columndata[c].ans;
                            curr_all_data_20[key] = value;
                        }
                    }
                } catch (e) { }

                var new_get_value = curr_all_data_20[sub_get_value];
            } else {
                var ddl_found = $("." + sub_get_value + "").find("select");
                var ele_type = $("." + sub_get_value + "").find("div :nth-child(2)").prop('tagName');

                if (ele_type == 'SELECT' || ele_type == 'OPTION' || ddl_found.length > 0) {
                    var where_box_id = $("." + sub_get_value + "").find("select").attr("id");
                    var target_type20_ddl_id = 'ddl_search_type20_' + curr_btnSearch_Counter + '';
                    // var param = 'reset_below_dropdown("' +
                    // target_type20_ddl_id +
                    // '")';
                    // $('#' + where_box_id + '').attr("onchange", param);

                    //var ans_id = $("#" + where_box_id + " :selected").val();
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
                        Condition_Data_Str = replace_sql_in_with_equal_to(Condition_Data_Str, sub_get_value);
                    }
                    // //////////--- flush bottom type20 fields start ----
                    // ///////////////
                    if (view_style == 'tableview' || view_style == 'listview') {
                        set_blank_type20_field_by_dropdown(sub_get_value);
                    }
                    // //////////--- flush bottom type20 fields end ----
                    // ///////////////
                } else {
                    var where_box_id = $("." + sub_get_value + " :input[type=text]").attr("id");
                    $("#" + where_box_id + "").attr("onkeydown", "make_blank_type20_field(this)");
                    var ans_id = $("#" + where_box_id + "").attr('title');
                    var ans_text = $("#" + where_box_id + "").val();
                }
                if (ans_id == "" || ans_id == null || ans_id == undefined || ans_id == "0" || ans_id == "--- Select Values ---"
                    || ans_id == "All" || ans_text == "" || ans_text == null || ans_text == undefined) {
                    ref_valid++;
                    break;
                }

                // check replace with id or text
                if (pass_type == 'id') {
                    new_get_value = ans_id;
                } else {
                    new_get_value = ans_text;
                }
            }

            Condition_Data_Str = Condition_Data_Str.replace(get_value, new_get_value);
        }
        var qs_array = [Condition_Data_Str, ref_valid];
        return qs_array;
    } catch (e) {
        alert1(e + '_pass_required_values_to_querystring()');
        loading_hide();
    }
}

// replace 'IN' in Equation key when dropdown selected value is "Select All"
function replace_sql_in_with_equal_to(Condition_Data_Str, sub_get_value) {
    try {
        var Condition_Data = itemObj._checkStrObj(Condition_Data_Str);  		// check_item

        var where_Json = Condition_Data[0].where[0].And[0].Json;
        var where_Table = Condition_Data[0].where[0].And[0].Table;

        var class_found = false;
        for (i = 0; i < where_Json.length; i++) {
            var Value_1 = where_Json[i].Value_1;
            var t_sub_get_value = Value_1.substring(2, Value_1.length - 2);
            if (t_sub_get_value == sub_get_value) {
                class_found = true;
                Condition_Data[0].where[0].And[0].Json[i].Equation = "IN";
                break;
            }
        }

        if (class_found == false) {
            for (j = 0; j < where_Table.length; j++) {
                var Value_1 = where_Table[j].Value_1;
                var t_sub_get_value = Value_1.substring(2, Value_1.length - 2);
                if (t_sub_get_value == sub_get_value) {
                    class_found = true;
                    Condition_Data[0].where[0].And[0].Table[j].Equation = "IN";
                    break;
                }
            }
        }
        Condition_Data_Str = JSON.stringify(Condition_Data);
        return Condition_Data_Str;
    } catch (e) {
        alert1(e + '_replace_sql_in_with_equal_to()');
        loading_hide();
    }
}

// reset below type20 restrict when upper text box is changed
function make_blank_type20_field(event) {
    $(event).attr('name', '0');
    $('#search_item_name_Search_' + curr_btnSearch_Counter + '').val('');
    $('#search_item_name_Search_' + curr_btnSearch_Counter + '').attr('title', '');
    $('#search_item_name_Search_' + curr_btnSearch_Counter + '').attr('name', '0');
    $("#product_list_" + curr_btnSearch_Counter + "").empty();
    popup_items_hide_type20();
}

// set below child type20 tableview when upper dropdown is changed
function set_blank_type20_field_by_dropdown(sub_get_value) {
    try {
        var where_box_id = $("." + sub_get_value + "").find("select").attr("id");
        var hdn_box_id = $("." + sub_get_value + "").find("input[type=hidden]").attr("id");
        var flush_id_Array = $("#" + hdn_box_id + "").val();
        if (flush_id_Array == '' || flush_id_Array == null || flush_id_Array == undefined) {
            flush_id_Array = [];
        } else {
            flush_id_Array = itemObj._checkStrObj(decodeURIComponent(flush_id_Array));  		// check_item
        }
        flush_id_Array.push(curr_btnSearch_Counter);
        var flush_id_Array_str = encodeURIComponent(JSON.stringify(flush_id_Array));
        $("#" + hdn_box_id + "").val(flush_id_Array_str);
        $("#" + where_box_id + "").attr("onchange", "make_blank_type20_field_by_dropdown('" + hdn_box_id + "','" + flush_id_Array_str + "')");
    } catch (e) {
        alert1(e + '_set_blank_type20_field_by_dropdown()');
        loading_hide();
    }
}

// make blank below type20 when upper dropdown is changed
function make_blank_type20_field_by_dropdown(hdn_box_id, flush_id_Array_str) {
    try {
        var flush_id_Array = itemObj._checkStrObj(decodeURIComponent(flush_id_Array_str));  		// check_item
        for (f = 0; f < flush_id_Array.length; f++) {
            var new_div_t = flush_id_Array[f];
            $('#search_item_name_Search_' + new_div_t + '').val('');
            $('#search_item_name_Search_' + new_div_t + '').attr('title', '');
            $('#search_item_name_Search_' + new_div_t + '').attr('name', '0');
            $("#product_list_" + new_div_t + "").empty();
        }
        $("#" + hdn_box_id + "").val('');
    } catch (e) {
        alert1(e + '_make_blank_type20_field_by_dropdown()');
        loading_hide();
    }
}

// disbale all & autofill type20 dropdown on parent change automatically
function assign_multi_autobind_type20_child_dropdown(multi_autobind_Array_str) {
    try {
        status_2_with_self_assign = 0;
        var multi_autobind_Array = itemObj._checkStrObj(decodeURIComponent(multi_autobind_Array_str));  		// check_item

        var parent_ddl = multi_autobind_Array[0].parent_id;

        var cell_id = $("#" + parent_ddl + " :selected").attr('value1');
        if (cell_id == "" || cell_id == null || cell_id == undefined) {
            cell_id = $("#" + parent_ddl + " :selected").val();
        }

        if (cell_id == 0) { }
        else {
            setTimeout(function () {
                $("#" + parent_ddl + "").trigger("ondrag");
            }, 500);

            Type20_AutoBind_Onchange_Array = multi_autobind_Array;
            for (z = 0; z < Type20_AutoBind_Onchange_Array.length; z++) {
                var t_new_id = Type20_AutoBind_Onchange_Array[z].new_id;
                $("#ddl_search_type20_" + t_new_id + "").prop("disabled", true);
            }
            call_multi_autobind_type20_child_dropdown(Type20_AutoBind_Onchange_Array);
        }
    } catch (e) {
        alert1(e + '_assign_multi_autobind_type20_child_dropdown()');
        loding_hide();
    }
}

function call_multi_autobind_type20_child_dropdown(multi_autobind_Array_t) {
    try {
        if (multi_autobind_Array_t.length > 0) {
            var t_new_id = multi_autobind_Array_t[0].new_id;
            fill_two_in_one_id = t_new_id;
            var t_TableName = multi_autobind_Array_t[0].TableName;
            var t_JoinTableName = multi_autobind_Array_t[0].JoinTableName;
            var t_Checksheet_id = multi_autobind_Array_t[0].Checksheet_id;
            var t_window_style = multi_autobind_Array_t[0].window_style;
            var t_view_style = multi_autobind_Array_t[0].view_style;

            OFFSET_TYPE20 = 0;
            popup_search_items_show_type20(t_new_id, t_TableName,
                t_JoinTableName, t_Checksheet_id, t_window_style,
                t_view_style);
        }
        else {
            check_and_call_next_single_option();
        }
    } catch (e) {
        alert1(e + '_call_multi_autobind_type20_child_dropdown()');
        loading_hide();
    }
}

// set below child type20 tableview when upper dropdown is changed
function set_autobind_type20_child_dropdown(sub_get_value, autobind_Data) {
    try {
        var where_box_id = $("." + sub_get_value + "").find("select").attr("id");
        var hdn_box_id = $("." + sub_get_value + "").find("input[type=hidden]:eq(1)").attr("id");
        var multi_autobind_Array = $("#" + hdn_box_id + "").val();
        if (multi_autobind_Array == '' || multi_autobind_Array == null || multi_autobind_Array == undefined) {
            multi_autobind_Array = [];
        } else {
            multi_autobind_Array = itemObj._checkStrObj(decodeURIComponent(multi_autobind_Array));  		// check_item
        }
        multi_autobind_Array.push(autobind_Data[0]);
        var multi_autobind_Array_str = encodeURIComponent(JSON.stringify(multi_autobind_Array));
        $("#" + hdn_box_id + "").val(multi_autobind_Array_str);

        var existing_onchange = $('#' + where_box_id + '').attr("onchange");
        if (existing_onchange == '' || existing_onchange == null || existing_onchange == undefined) {
            existing_onchange = '';
        }

        //$("#" + where_box_id + "").attr("onchange", "" + existing_onchange + " assign_multi_autobind_type20_child_dropdown('" + multi_autobind_Array_str + "');");

        try {
            var current_checksheet_id = curr_all_data_20["current_checksheet_id"];
        }
        catch (e) {
            current_checksheet_id = 0;
        }

        if (current_checksheet_id == '21275') {
            $("#" + where_box_id + "").attr("onchange", "" + existing_onchange + "; assign_multi_autobind_type20_child_dropdown('" + multi_autobind_Array_str + "');");
        }
        else {
            $("#" + where_box_id + "").attr("onchange", "assign_multi_autobind_type20_child_dropdown('" + multi_autobind_Array_str + "');");
        }
    } catch (e) {
        alert1(e + '_set_autobind_type20_child_dropdown()');
        loading_hide();
    }
}

// bind type20 dropdown on page load
function autofill_type20_dropdown_onload(Type20_AutoFill_DDL_Array_t) {
    try {
        if (Type20_AutoFill_DDL_Array_t.length > 0) {
            var t_new_id = Type20_AutoFill_DDL_Array_t[0].new_id;

            var skip = 0;
            if ($("#div_Search_" + t_new_id + "").hasClass("force_hide")) {
                skip = 1;
            }

            if (skip == 0) {
                var t_TableName = Type20_AutoFill_DDL_Array_t[0].TableName;
                var t_JoinTableName = Type20_AutoFill_DDL_Array_t[0].JoinTableName;
                var t_Checksheet_id = Type20_AutoFill_DDL_Array_t[0].Checksheet_id;
                var t_window_style = Type20_AutoFill_DDL_Array_t[0].window_style;
                var t_view_style = Type20_AutoFill_DDL_Array_t[0].view_style;

                var push_data = Type20_AutoFill_DDL_Array_t[0].push_data;
                var push_array = push_data[0].push_array;

                // check old push_array or new push_array(with json)
                var is_json = 0;
                if (push_array.length > 0) {
                    var push_array_str = JSON.stringify(push_array);
                    var json_check = push_array_str[1];
                    if (json_check == '{') {
                        is_json = 1;
                    }
                }

                var ref_valid = 0;
                for (i = 0; i < push_array.length; i++) {
                    if (is_json == 0) {
                        var get_value = push_array[i];
                        var value_type = get_value.substring(2, 1);
                        var sub_get_value = get_value.substring(2, get_value.length - 2);
                    } else {
                        var get_value = push_array[i].value;
                        var value_type = get_value.substring(2, 1);
                        var sub_get_value = get_value.substring(2, get_value.length - 2);
                    }
                    curr_sub_get_value = sub_get_value;
                    // alert1("sub_get_value: " + sub_get_value);
                    if (value_type == "@") {
                        // class value
                        var where_box_id = $("." + sub_get_value + "").find("select").attr("id");
                        var param = "popup_search_items_show_type20('" + t_new_id + "', '" + t_TableName + "', '" + t_JoinTableName
                            + "','" + t_Checksheet_id + "','" + t_window_style + "','" + t_view_style + "');";

                        var existing_onchange = $('#' + where_box_id + '').attr("onchange");
                        if (existing_onchange == '' || existing_onchange == null || existing_onchange == undefined) {
                            $('#' + where_box_id + '').attr("onchange", param);
                        }
                        else {
                            if (existing_onchange.indexOf("show_hide_Element") > -1) {
                                // parent is normal dropdown with dependency string
                                $('#' + where_box_id + '').attr("ondrag", param);
                                continue;
                            }
                        }

                        if (where_box_id == "" || where_box_id == null || where_box_id == undefined) {
                            where_box_id = $("." + sub_get_value + "").find("input").attr("id");
                            //var where_box_value = $('#' + where_box_id + '').val();

                            if (where_box_id == "" || where_box_id == null || where_box_id == undefined) {
                                //check for type22 control
                                where_box_id = $("td." + sub_get_value + "").attr("id");

                                if (where_box_id == "" || where_box_id == null || where_box_id == undefined) { }
                                else {
                                    //type22 sum value
                                    var where_box_value = $('#' + where_box_id + '').text();

                                    ///----invoice sum in where condition of type20 drodpwn (09122019: urbanJungle)----/////
                                    var sum_parent_div = $("#" + where_box_id + "").parents("div[id^=div_Inv_Calculate]").attr('id');
                                    $("#" + sum_parent_div).attr("type20_trigger_id", t_new_id);
                                    $("#" + sum_parent_div).attr("type20_view_style", t_view_style);
                                }
                            }
                            else {
                                var where_box_value = $('#' + where_box_id + '').val();

                                // apply onchange event to textbox 07022025 - mk
                                var existing_onchange = $('#' + where_box_id + '').attr("onchange");
                                if (existing_onchange == '' || existing_onchange == null || existing_onchange == undefined) {
                                    $('#' + where_box_id + '').attr("onchange", param);
                                }
                            }

                            if (where_box_value == "" || where_box_value == null || where_box_value == undefined) {
                                ref_valid++;
                            }
                        }
                        else {
                            if ($("." + sub_get_value + "").hasClass('force_hide')) {
                                // searchable is hidden with task dependency 17092020
                                var is_default_value = $('#' + where_box_id + '').attr('default_value');
                                if (is_default_value == "" || is_default_value == null || is_default_value == undefined) {
                                    ref_valid++;
                                }
                                else {
                                    if (i == (push_array.length - 1)) {
                                        popup_search_items_show_type20(t_new_id, t_TableName, t_JoinTableName, t_Checksheet_id, t_window_style, t_view_style);
                                        break;
                                    }
                                }
                            }
                            else {
                                // check for reference class 03082021
                                var has_reference_class = $("." + sub_get_value + "").attr("reference_class");
                                if (has_reference_class == "" || has_reference_class == null || has_reference_class == undefined || has_reference_class == "undefined") {
                                    ref_valid++;
                                }
                                else {
                                    // commented due to remove double call for same searchable 03072024 - mk
                                    // popup_search_items_show_type20(t_new_id, t_TableName, t_JoinTableName, t_Checksheet_id, t_window_style, t_view_style);
                                    //break;

                                    var existing_onchange = $('#' + where_box_id + '').attr("onchange");
                                    if (existing_onchange == '' || existing_onchange == null || existing_onchange == undefined) {
                                        break;
                                    }
                                }
                            }
                        }

                        if (where_box_id.indexOf("sum_") > -1) { }
                        else {
                            var Type20_AutoBind_Data = [];
                            Type20_AutoBind_Data.push({
                                'new_id': t_new_id,
                                'parent_id': where_box_id,
                                'TableName': t_TableName,
                                'JoinTableName': t_JoinTableName,
                                'Checksheet_id': t_Checksheet_id,
                                'window_style': t_window_style,
                                'view_style': t_view_style
                            });

                            if (where_box_id.indexOf("ddl_search_type20") > -1) {
                                $("#ddl_search_type20_" + t_new_id + "").attr("parent_ddl_id", where_box_id);
                            }
                            $("#ddl_search_type20_" + t_new_id + "").attr("ddl_type", "ddl_child");
                            set_autobind_type20_child_dropdown(sub_get_value, Type20_AutoBind_Data);
                        }
                    }
                }

                let act_view_style = push_data[0].view_style;
                if (act_view_style == "listview") {
                    // do not autofill listview searchables in page load - mk - 20052025
                    Type20_AutoFill_DDL_Array.shift();
                    autofill_type20_dropdown_onload(Type20_AutoFill_DDL_Array);
                }
                else {
                    if (ref_valid == 0) {
                        popup_search_items_show_type20(t_new_id, t_TableName, t_JoinTableName, t_Checksheet_id, t_window_style, t_view_style)
                    } else {
                        Type20_AutoFill_DDL_Array.shift();
                        autofill_type20_dropdown_onload(Type20_AutoFill_DDL_Array);
                    }
                }
            }
            else {
                // skip this searchable (default value will be preselected)
                Type20_AutoFill_DDL_Array.shift();
                autofill_type20_dropdown_onload(Type20_AutoFill_DDL_Array);
            }
        }
        else {
            //loading_hide();
            check_and_call_next_single_option();
        }
    } catch (e) {
        alert1(e + '_autofill_type20_dropdown_onload()');
        loading_hide();
    }
}

function set_parent_child_dropdown_readsurvey(Type20_AutoFill_DDL_Array_t) {
    try {
        var t_new_id = Type20_AutoFill_DDL_Array_t.new_id;
        var t_TableName = Type20_AutoFill_DDL_Array_t.TableName;
        var t_JoinTableName = Type20_AutoFill_DDL_Array_t.JoinTableName;
        var t_Checksheet_id = Type20_AutoFill_DDL_Array_t.Checksheet_id;
        var t_window_style = Type20_AutoFill_DDL_Array_t.window_style;
        var t_view_style = Type20_AutoFill_DDL_Array_t.view_style;

        var push_data = Type20_AutoFill_DDL_Array_t.push_data;
        var push_array = push_data[0].push_array;

        //check old push_array or new push_array(with json)
        var is_json = 0;
        if (push_array.length > 0) {
            var push_array_str = JSON.stringify(push_array);
            var json_check = push_array_str[1];
            if (json_check == '{') {
                is_json = 1;
            }
        }

        for (i = 0; i < push_array.length; i++) {
            if (is_json == 0) {
                var get_value = push_array[i];
                var value_type = get_value.substring(2, 1);
                var sub_get_value = get_value.substring(2, get_value.length - 2);
            }
            else {
                var get_value = push_array[i].value;
                var value_type = get_value.substring(2, 1);
                var sub_get_value = get_value.substring(2, get_value.length - 2);
            }
            curr_sub_get_value = sub_get_value;
            if (value_type == "@") {
                // class value
                var where_box_id = $("." + sub_get_value + "").find("select").attr("id");

                var param = "popup_search_items_show_type20('" + t_new_id + "', '" + t_TableName + "', '" + t_JoinTableName + "','" + t_Checksheet_id + "','" + t_window_style + "','" + t_view_style + "');";

                var existing_onchange = $('#' + where_box_id + '').attr("onchange");
                if (existing_onchange == '' || existing_onchange == null || existing_onchange == undefined) {
                    $('#' + where_box_id + '').attr("onchange", param);
                }
                $("#ddl_search_type20_" + t_new_id + "").attr("alt", where_box_id);  // for check out flag

                // in case parent dropdown have multiple child dropdown 11042023 
                if (where_box_id == "" || where_box_id == null || where_box_id == undefined) {
                    // possible text box
                }
                else {
                    if (where_box_id.indexOf("sum_") > -1) { }
                    else {
                        var Type20_AutoBind_Data = [];
                        Type20_AutoBind_Data.push({
                            'new_id': t_new_id,
                            'parent_id': where_box_id,
                            'TableName': t_TableName,
                            'JoinTableName': t_JoinTableName,
                            'Checksheet_id': t_Checksheet_id,
                            'window_style': t_window_style,
                            'view_style': t_view_style
                        });

                        if (where_box_id.indexOf("ddl_search_type20") > -1) {
                            $("#ddl_search_type20_" + t_new_id + "").attr("parent_ddl_id", where_box_id);
                        }
                        $("#ddl_search_type20_" + t_new_id + "").attr("ddl_type", "ddl_child");

                        set_autobind_type20_child_dropdown(sub_get_value, Type20_AutoBind_Data);
                    }
                }
            }
        }
    }
    catch (e) {
        alert(e + '_set_parent_child_dropdown_readsurvey');
    }
}

function show_current_type_loading(t_new_id) {
    $("#ddl_search_type20_" + t_new_id + "").css("color", "#eee");
    $("#ddl_loading_" + t_new_id + "").show();
    $("#ddl_search_type20_" + t_new_id + "").prop("disabled", true);
}

function hide_current_type_loading(t_new_id) {
    $("#ddl_search_type20_" + t_new_id + "").css("color", "#555");
    $("#ddl_loading_" + t_new_id + "").hide();

    var popup_len = $('.popup-type20-dropdown:visible').length;
    if (popup_len > 0) {
        $("#ddl_search_type20_" + t_new_id + "").prop("disabled", false);
    }

    // enable searchable dropdown in page load (treated as normal dropdown so enable it)
    if (glob_type20_cust_checksheetid == '' || glob_type20_cust_checksheetid == null || glob_type20_cust_checksheetid == undefined || glob_type20_cust_checksheetid == "0" || glob_type20_cust_checksheetid == "undefined") { }
    else {
        $("#ddl_search_type20_" + t_new_id + "").prop("disabled", false);
    }
}

function Show_More() {
    OFFSET_TYPE20 = OFFSET_TYPE20 + DEFAULT_TYPE20;
    get_all_searched_list(TableName_G, JoinTableName_G, Checksheet_id_G);
}


////////////////------------------///////////////////////////////////////////////

// get id/text array where found "Select All" in type20 dropdown (for SubmitSurveyData file only)
function get_id_text_array_for_type_20_ans(new_id, t_que_id, t_id, t_text, ele_type) {
    try {
        // var filter_button_Data = JSON.parse(localStorage.getItem('checksheet_AllData'));
        var flag_type = JSON.parse(storage.getItem('checksheet_type_filter'));
        if (flag_type == "10") {
            var filter_button_Data = JSON.parse(localStorage.getItem('checksheet_AllData_First'));
        } else {
            var filter_button_Data = JSON.parse(localStorage.getItem('checksheet_AllData'));
        }
        var where_Json = filter_button_Data[0].Filter_button[0].WHERE[0].AND[0].JSON;
        var where_Table = filter_button_Data[0].Filter_button[0].WHERE[0].AND[0].TABLE;

        var que_id_found = false;
        for (f = 0; f < where_Json.length; f++) {
            var Value_1 = where_Json[f].Value_1;
            var que_id = Value_1.substring(2, Value_1.length - 2);
            var first_2char = Value_1.substring(0, 2);
            var Value_2 = where_Json[f].Value_2;
            var que_id_2 = Value_2.substring(2, Value_2.length - 2);
            var first_2char_2 = Value_2.substring(0, 2);
            if (first_2char == "(*" || first_2char_2 == "(*") {
                // need to fill
                if (ele_type == "8") {
                    var first_2char = Value_1.substring(0, 2);
                    if (first_2char == "(*") {
                        var que_id = Value_1.substring(2, Value_1.length - 2);
                    }
                    else {
                        var Value_2 = where_Json[f].Value_2;
                        if (Value_2 == "" || Value_2 == null || Value_2 == undefined) {
                            que_id == "";
                        }
                        else {
                            var que_id = Value_2.substring(2, Value_2.length - 2);
                        }
                    }
                }
                if (que_id == t_que_id) {
                    que_id_found = true;
                    if (ele_type == "8") {
                        // type 8
                        var Value_1 = where_Json[f].Value_1;
                        var que_id_1 = Value_1.substring(2, Value_1.length - 2);
                        var Value_2 = where_Json[f].Value_2;
                        var que_id_2 = Value_2.substring(2, Value_2.length - 2);
                        if (que_id_1 == t_que_id) {
                            filter_button_Data[0].Filter_button[0].WHERE[0].AND[0].JSON[f].Value_1 = t_id;
                        }
                        else {
                            filter_button_Data[0].Filter_button[0].WHERE[0].AND[0].JSON[f].Value_2 = t_id;
                        }
                        break;
                    }
                    else {
                        // type 20
                        var In_or_Out = where_Json[f].In_or_Out;
                        if (In_or_Out == '' || In_or_Out == null || In_or_Out == undefined) {
                            var In_or_Out = 'in';
                        }

                        var parent_id = $('#ddl_search_type20_' + new_id + '').attr("alt");
                        if (parent_id == '' || parent_id == null || parent_id == undefined) {
                            // parent not exist
                            if (t_id != 'All') {
                                // if single selection then always add it
                                In_or_Out = 'in';
                                filter_button_Data[0].Filter_button[0].WHERE[0].AND[0].JSON[f].In_or_Out = "in";
                            }
                        }
                        else {
                            // parent exist
                            if (t_id == 'All') {
                                // if child all selection
                                In_or_Out = 'out';
                            }
                        }

                        if (In_or_Out == 'in') {
                            if (t_id == 'All') {
                                var id_Array = [];
                                var text_Array = [];
                                $('#ddl_search_type20_' + new_id + ' > option').each(function () {
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
                                var sub_t_ans_id = '"' + t_ans_id.substring(2, t_ans_id.length - 2) + '"';
                                var sub_t_ans_text = t_ans_text.substring(1, t_ans_text.length - 1);
                                var ans_id = sub_t_ans_id.replace(/"/g, "'");
                                var ans_text = sub_t_ans_text.replace(/"/g, "'");
                            }
                            else {
                                var ans_id = t_id;
                                var ans_text = t_text;
                            }
                            var Name_or_Id = where_Json[f].Name_or_Id;
                            if (Name_or_Id == '' || Name_or_Id == null || Name_or_Id == undefined) {
                                var Name_or_Id = 'id';
                            }
                            if (Name_or_Id == 'id') {
                                filter_button_Data[0].Filter_button[0].WHERE[0].AND[0].JSON[f].Value_1 = ans_id;
                            }
                            else {
                                filter_button_Data[0].Filter_button[0].WHERE[0].AND[0].JSON[f].Value_1 = ans_text;
                            }
                            if (t_id == 'All') {
                                filter_button_Data[0].Filter_button[0].WHERE[0].AND[0].JSON[f].Equation = "in";
                            }
                            break;
                        }
                        else {
                            // out (remove current index) from array
                            filter_button_Data[0].Filter_button[0].WHERE[0].AND[0].JSON.splice(f, 1);
                            break;
                        }
                    }
                }
            }
            else {
                // already filled
            }
        }

        if (que_id_found == false) {
            var que_id_found = false;
            for (h = 0; h < where_Table.length; h++) {
                // for replay route only
                if (where_Table[h].Column_Name == "UserName" && flag_type == 10) {
                    localStorage.setItem('replayrouteid_user_secondfilter_First', JSON.stringify(new_id));
                }

                var Value_1 = where_Table[h].Value_1;
                var que_id = Value_1.substring(2, Value_1.length - 2);
                var first_2char = Value_1.substring(0, 2);
                var Value_2 = where_Table[h].Value_2;
                var que_id_2 = Value_2.substring(2, Value_2.length - 2);
                var first_2char_2 = Value_2.substring(0, 2);
                if (first_2char == "(*" || first_2char_2 == "(*") {
                    // need to fill
                    var Table_Name = where_Table[h].Table_Name;
                    if (Table_Name == "Flow_Master") {
                        // flow_master table
                        var flow_id = $("#ddl_flow :selected").val();
                        var flow_text = $("#ddl_flow :selected").text();
                        if (flow_id == "" || flow_id == null || flow_id == undefined) {
                            var flow_id = $("#ddl_FlowName :selected").val();
                            var flow_text = $("#ddl_FlowName :selected").text();
                        }

                        if (flow_id == "" || flow_id == null || flow_id == undefined) {
                            // for chart logic (where flow dropdown is not available)
                            var In_or_Out = where_Table[h].In_or_Out;
                            if (In_or_Out == '' || In_or_Out == null || In_or_Out == undefined) {
                                var In_or_Out = 'in';
                            }

                            var parent_id = $('#ddl_search_type20_' + new_id + '').attr("alt");
                            if (parent_id == '' || parent_id == null || parent_id == undefined) {
                                // parent not exist
                                if (t_id != 'All') {
                                    // if single selection then always add it
                                    In_or_Out = 'in';
                                    filter_button_Data[0].Filter_button[0].WHERE[0].AND[0].TABLE[h].In_or_Out = "in";
                                }
                            }
                            else {
                                // parent exist
                                if (t_id == 'All') {
                                    // if child all selection
                                    In_or_Out = 'out';
                                }
                            }

                            if (In_or_Out == 'in') {
                                if (t_id == 'All') {
                                    var id_Array = [];
                                    var text_Array = [];
                                    $('#ddl_search_type20_' + new_id + ' > option').each(function () {
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
                                    var sub_t_ans_id = '"' + t_ans_id.substring(2, t_ans_id.length - 2) + '"';
                                    var sub_t_ans_text = t_ans_text.substring(1, t_ans_text.length - 1);
                                    var ans_id = sub_t_ans_id.replace(/"/g, "'");
                                    var ans_text = sub_t_ans_text.replace(/"/g, "'");
                                }
                                else {
                                    var ans_id = t_id;
                                    var ans_text = t_text;
                                }
                                var Name_or_Id = where_Table[h].Name_or_Id;
                                if (Name_or_Id == '' || Name_or_Id == null || Name_or_Id == undefined) {
                                    var Name_or_Id = 'id';
                                }
                                if (Name_or_Id == 'id') {
                                    filter_button_Data[0].Filter_button[0].WHERE[0].AND[0].TABLE[h].Value_1 = ans_id;
                                }
                                else {
                                    filter_button_Data[0].Filter_button[0].WHERE[0].AND[0].TABLE[h].Value_1 = ans_text;
                                }
                                if (t_id == 'All') {
                                    filter_button_Data[0].Filter_button[0].WHERE[0].AND[0].TABLE[h].Equation = "in";
                                }
                                break;
                            }
                            else {
                                // out (remove current index) from array
                                filter_button_Data[0].Filter_button[0].WHERE[0].AND[0].TABLE.splice(h, 1);
                                break;
                            }
                        }
                        else {
                            // other page where static flow dropdown available
                            var In_or_Out = where_Table[h].In_or_Out;
                            if (In_or_Out == '' || In_or_Out == null || In_or_Out == undefined) {
                                var In_or_Out = 'in';
                            }
                            if (In_or_Out == 'in') {
                                var Name_or_Id = where_Table[h].Name_or_Id;
                                if (Name_or_Id == 'id') {
                                    filter_button_Data[0].Filter_button[0].WHERE[0].AND[0].TABLE[h].Value_1 = flow_id;
                                }
                                else {
                                    filter_button_Data[0].Filter_button[0].WHERE[0].AND[0].TABLE[h].Value_1 = flow_text;
                                }
                            }
                            else {
                                filter_button_Data[0].Filter_button[0].WHERE[0].AND[0].TABLE.splice(h, 1);
                            }
                        }
                    }
                    else {
                        // other table
                        if (ele_type == "8") {
                            var first_2char = Value_1.substring(0, 2);
                            if (first_2char == "(*") {
                                var que_id = Value_1.substring(2, Value_1.length - 2);
                            }
                            else {
                                var Value_2 = where_Table[h].Value_2;
                                if (Value_2 == "" || Value_2 == null || Value_2 == undefined) {
                                    que_id == "";
                                }
                                else {
                                    var que_id = Value_2.substring(2, Value_2.length - 2);
                                }
                            }
                        }
                        if (que_id == t_que_id) {
                            que_id_found = true;
                            if (ele_type == "8") {
                                // type 8
                                var Value_1 = where_Table[h].Value_1;
                                var que_id_1 = Value_1.substring(2, Value_1.length - 2);
                                var Value_2 = where_Table[h].Value_2;
                                var que_id_2 = Value_2.substring(2, Value_2.length - 2);
                                if (que_id_1 == t_que_id) {
                                    filter_button_Data[0].Filter_button[0].WHERE[0].AND[0].TABLE[h].Value_1 = t_id;
                                }
                                else {
                                    filter_button_Data[0].Filter_button[0].WHERE[0].AND[0].TABLE[h].Value_2 = t_id;
                                }
                                break;
                            }
                            else {
                                // type 20
                                var In_or_Out = where_Table[h].In_or_Out;
                                if (In_or_Out == '' || In_or_Out == null || In_or_Out == undefined) {
                                    var In_or_Out = 'in';
                                }

                                var parent_id = $('#ddl_search_type20_' + new_id + '').attr("alt");
                                if (parent_id == '' || parent_id == null || parent_id == undefined) {
                                    // parent not exist
                                    if (t_id != 'All') {
                                        // if single selection then always add it
                                        In_or_Out = 'in';
                                        filter_button_Data[0].Filter_button[0].WHERE[0].AND[0].TABLE[h].In_or_Out = "in";
                                    }
                                }
                                else {
                                    // parent exist
                                    if (t_id == 'All') {
                                        // if child all selection
                                        In_or_Out = 'out';
                                    }
                                }

                                if (In_or_Out == 'in') {
                                    if (t_id == 'All') {
                                        var id_Array = [];
                                        var text_Array = [];
                                        $('#ddl_search_type20_' + new_id + ' > option').each(function () {
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
                                        var sub_t_ans_id = '"' + t_ans_id.substring(2, t_ans_id.length - 2) + '"';
                                        var sub_t_ans_text = t_ans_text.substring(1, t_ans_text.length - 1);
                                        var ans_id = sub_t_ans_id.replace(/"/g, "'");
                                        var ans_text = sub_t_ans_text.replace(/"/g, "'");
                                    }
                                    else {
                                        var ans_id = t_id;
                                        var ans_text = t_text;
                                    }
                                    var Name_or_Id = where_Table[h].Name_or_Id;
                                    if (Name_or_Id == '' || Name_or_Id == null || Name_or_Id == undefined) {
                                        var Name_or_Id = 'id';
                                    }
                                    if (Name_or_Id == 'id') {
                                        filter_button_Data[0].Filter_button[0].WHERE[0].AND[0].TABLE[h].Value_1 = ans_id;
                                    }
                                    else {
                                        filter_button_Data[0].Filter_button[0].WHERE[0].AND[0].TABLE[h].Value_1 = ans_text;
                                    }
                                    if (t_id == 'All') {
                                        filter_button_Data[0].Filter_button[0].WHERE[0].AND[0].TABLE[h].Equation = "in";
                                    }
                                    break;
                                }
                                else {
                                    // out (remove current index) from array
                                    filter_button_Data[0].Filter_button[0].WHERE[0].AND[0].TABLE.splice(h, 1);
                                    break;
                                }
                            }
                        }
                    }
                }
                else {
                    // already filled
                }
            }
        }

        /////////////////////////// WHERE AND ////////////////////////////




        /////////////////////// OR Start ////////////04042019//////////////////////

        var WHERE_OR_JSON = filter_button_Data[0].Filter_button[0].WHERE[0].OR[0].JSON;
        var WHERE_OR_TABLE = filter_button_Data[0].Filter_button[0].WHERE[0].OR[0].TABLE;

        var que_id_found = false;
        for (f = 0; f < WHERE_OR_JSON.length; f++) {
            var Value_1 = WHERE_OR_JSON[f].Value_1;
            var que_id = Value_1.substring(2, Value_1.length - 2);
            var first_2char = Value_1.substring(0, 2);
            var Value_2 = WHERE_OR_JSON[f].Value_2;
            var que_id_2 = Value_2.substring(2, Value_2.length - 2);
            var first_2char_2 = Value_2.substring(0, 2);
            if (first_2char == "(*" || first_2char_2 == "(*") {
                // need to fill
                if (ele_type == "8") {
                    var first_2char = Value_1.substring(0, 2);
                    if (first_2char == "(*") {
                        var que_id = Value_1.substring(2, Value_1.length - 2);
                    }
                    else {
                        var Value_2 = WHERE_OR_JSON[f].Value_2;
                        if (Value_2 == "" || Value_2 == null || Value_2 == undefined) {
                            que_id == "";
                        }
                        else {
                            var que_id = Value_2.substring(2, Value_2.length - 2);
                        }
                    }
                }
                if (que_id == t_que_id) {
                    que_id_found = true;
                    if (ele_type == "8") {
                        // type 8
                        var Value_1 = WHERE_OR_JSON[f].Value_1;
                        var que_id_1 = Value_1.substring(2, Value_1.length - 2);
                        var Value_2 = WHERE_OR_JSON[f].Value_2;
                        var que_id_2 = Value_2.substring(2, Value_2.length - 2);
                        if (que_id_1 == t_que_id) {
                            filter_button_Data[0].Filter_button[0].WHERE[0].OR[0].JSON[f].Value_1 = t_id;
                        }
                        else {
                            filter_button_Data[0].Filter_button[0].WHERE[0].OR[0].JSON[f].Value_2 = t_id;
                        }
                        break;
                    }
                    else {
                        // type 20
                        var In_or_Out = WHERE_OR_JSON[f].In_or_Out;
                        if (In_or_Out == '' || In_or_Out == null || In_or_Out == undefined) {
                            var In_or_Out = 'in';
                        }

                        var parent_id = $('#ddl_search_type20_' + new_id + '').attr("alt");
                        if (parent_id == '' || parent_id == null || parent_id == undefined) {
                            // parent not exist
                            if (t_id != 'All') {
                                // if single selection then always add it
                                In_or_Out = 'in';
                                filter_button_Data[0].Filter_button[0].WHERE[0].OR[0].JSON[f].In_or_Out = "in";
                            }
                        }
                        else {
                            // parent exist
                            if (t_id == 'All') {
                                // if child all selection
                                In_or_Out = 'out';
                            }
                        }

                        if (In_or_Out == 'in') {
                            if (t_id == 'All') {
                                var id_Array = [];
                                var text_Array = [];
                                $('#ddl_search_type20_' + new_id + ' > option').each(function () {
                                    var id = $(this).val();
                                    var text = $(this).text();
                                    if (id != '0' && id != 'All') {
                                        id_Array.push(id);
                                        text_Array.push(text);
                                    }
                                });
                                var t_ans_id = JSON.stringify(id_Array);
                                var t_ans_text = JSON.stringify(text_Array);
                                var sub_t_ans_id = '"' + t_ans_id.substring(2, t_ans_id.length - 2) + '"';
                                var sub_t_ans_text = t_ans_text.substring(1,
                                    t_ans_text.length - 1);
                                var ans_id = sub_t_ans_id.replace(/"/g, "'");
                                var ans_text = sub_t_ans_text.replace(/"/g, "'");
                            }
                            else {
                                var ans_id = t_id;
                                var ans_text = t_text;
                            }
                            var Name_or_Id = WHERE_OR_JSON[f].Name_or_Id;
                            if (Name_or_Id == '' || Name_or_Id == null || Name_or_Id == undefined) {
                                var Name_or_Id = 'id';
                            }
                            if (Name_or_Id == 'id') {
                                filter_button_Data[0].Filter_button[0].WHERE[0].OR[0].JSON[f].Value_1 = ans_id;
                            }
                            else {
                                filter_button_Data[0].Filter_button[0].WHERE[0].OR[0].JSON[f].Value_1 = ans_text;
                            }
                            if (t_id == 'All') {
                                filter_button_Data[0].Filter_button[0].WHERE[0].OR[0].JSON[f].Equation = "in";
                            }
                            break;
                        }
                        else {
                            // out (remove current index) from array
                            filter_button_Data[0].Filter_button[0].WHERE[0].OR[0].JSON.splice(f, 1);
                            break;
                        }
                    }
                }
            }
            else {
                // already filled
            }
        }

        if (que_id_found == false) {
            var que_id_found = false;
            for (h = 0; h < WHERE_OR_TABLE.length; h++) {
                // for replay route only
                if (WHERE_OR_TABLE[h].Column_Name == "UserName" && flag_type == 10) {
                    localStorage.setItem('replayrouteid_user_secondfilter_First', JSON.stringify(new_id));
                }

                var Value_1 = WHERE_OR_TABLE[h].Value_1;
                var que_id = Value_1.substring(2, Value_1.length - 2);
                var first_2char = Value_1.substring(0, 2);
                var Value_2 = WHERE_OR_TABLE[h].Value_2;
                var que_id_2 = Value_2.substring(2, Value_2.length - 2);
                var first_2char_2 = Value_2.substring(0, 2);
                if (first_2char == "(*" || first_2char_2 == "(*") {
                    // need to fill
                    var Table_Name = WHERE_OR_TABLE[h].Table_Name;
                    if (Table_Name == "Flow_Master") {
                        // flow_master table
                        var flow_id = $("#ddl_flow :selected").val();
                        var flow_text = $("#ddl_flow :selected").text();
                        if (flow_id == "" || flow_id == null || flow_id == undefined) {
                            var flow_id = $("#ddl_FlowName :selected").val();
                            var flow_text = $("#ddl_FlowName :selected").text();
                        }

                        if (flow_id == "" || flow_id == null || flow_id == undefined) {
                            // for chart logic (where flow dropdown is not available)
                            var In_or_Out = WHERE_OR_TABLE[h].In_or_Out;
                            if (In_or_Out == '' || In_or_Out == null || In_or_Out == undefined) {
                                var In_or_Out = 'in';
                            }

                            var parent_id = $('#ddl_search_type20_' + new_id + '').attr("alt");
                            if (parent_id == '' || parent_id == null || parent_id == undefined) {
                                // parent not exist
                                if (t_id != 'All') {
                                    // if single selection then always add it
                                    In_or_Out = 'in';
                                    filter_button_Data[0].Filter_button[0].WHERE[0].OR[0].TABLE[h].In_or_Out = "in";
                                }
                            }
                            else {
                                // parent exist
                                if (t_id == 'All') {
                                    // if child all selection
                                    In_or_Out = 'out';
                                }
                            }

                            if (In_or_Out == 'in') {
                                if (t_id == 'All') {
                                    var id_Array = [];
                                    var text_Array = [];
                                    $('#ddl_search_type20_' + new_id + ' > option').each(function () {
                                        var id = $(this).val();
                                        var text = $(this).text();
                                        if (id != '0' && id != 'All') {
                                            id_Array.push(id);
                                            text_Array.push(text);
                                        }
                                    });
                                    var t_ans_id = JSON.stringify(id_Array);
                                    var t_ans_text = JSON.stringify(text_Array);
                                    var sub_t_ans_id = '"' + t_ans_id.substring(2, t_ans_id.length - 2) + '"';
                                    var sub_t_ans_text = t_ans_text.substring(1,
                                        t_ans_text.length - 1);
                                    var ans_id = sub_t_ans_id.replace(/"/g, "'");
                                    var ans_text = sub_t_ans_text.replace(/"/g, "'");
                                }
                                else {
                                    var ans_id = t_id;
                                    var ans_text = t_text;
                                }
                                var Name_or_Id = WHERE_OR_TABLE[h].Name_or_Id;
                                if (Name_or_Id == '' || Name_or_Id == null || Name_or_Id == undefined) {
                                    var Name_or_Id = 'id';
                                }
                                if (Name_or_Id == 'id') {
                                    filter_button_Data[0].Filter_button[0].WHERE[0].OR[0].TABLE[h].Value_1 = ans_id;
                                }
                                else {
                                    filter_button_Data[0].Filter_button[0].WHERE[0].OR[0].TABLE[h].Value_1 = ans_text;
                                }
                                if (t_id == 'All') {
                                    filter_button_Data[0].Filter_button[0].WHERE[0].OR[0].TABLE[h].Equation = "in";
                                }
                                break;
                            }
                            else {
                                // out (remove current index) from array
                                filter_button_Data[0].Filter_button[0].WHERE[0].OR[0].TABLE.splice(h, 1);
                                break;
                            }
                        }
                        else {
                            // other page where static flow dropdown available
                            var In_or_Out = WHERE_OR_TABLE[h].In_or_Out;
                            if (In_or_Out == '' || In_or_Out == null || In_or_Out == undefined) {
                                var In_or_Out = 'in';
                            }
                            if (In_or_Out == 'in') {
                                var Name_or_Id = WHERE_OR_TABLE[h].Name_or_Id;
                                if (Name_or_Id == 'id') {
                                    filter_button_Data[0].Filter_button[0].WHERE[0].OR[0].TABLE[h].Value_1 = flow_id;
                                }
                                else {
                                    filter_button_Data[0].Filter_button[0].WHERE[0].OR[0].TABLE[h].Value_1 = flow_text;
                                }
                            }
                            else {
                                filter_button_Data[0].Filter_button[0].WHERE[0].OR[0].TABLE.splice(h, 1);
                            }
                        }
                    }
                    else {
                        // other table
                        if (ele_type == "8") {
                            var first_2char = Value_1.substring(0, 2);
                            if (first_2char == "(*") {
                                var que_id = Value_1.substring(2, Value_1.length - 2);
                            }
                            else {
                                var Value_2 = WHERE_OR_TABLE[h].Value_2;
                                if (Value_2 == "" || Value_2 == null || Value_2 == undefined) {
                                    que_id == "";
                                }
                                else {
                                    var que_id = Value_2.substring(2, Value_2.length - 2);
                                }
                            }
                        }
                        if (que_id == t_que_id) {
                            que_id_found = true;
                            if (ele_type == "8") {
                                // type 8
                                var Value_1 = WHERE_OR_TABLE[h].Value_1;
                                var que_id_1 = Value_1.substring(2, Value_1.length - 2);
                                var Value_2 = WHERE_OR_TABLE[h].Value_2;
                                var que_id_2 = Value_2.substring(2, Value_2.length - 2);
                                if (que_id_1 == t_que_id) {
                                    filter_button_Data[0].Filter_button[0].WHERE[0].OR[0].TABLE[h].Value_1 = t_id;
                                }
                                else {
                                    filter_button_Data[0].Filter_button[0].WHERE[0].OR[0].TABLE[h].Value_2 = t_id;
                                }
                                break;
                            }
                            else {
                                // type 20
                                var In_or_Out = WHERE_OR_TABLE[h].In_or_Out;
                                if (In_or_Out == '' || In_or_Out == null || In_or_Out == undefined) {
                                    var In_or_Out = 'in';
                                }

                                var parent_id = $('#ddl_search_type20_' + new_id + '').attr("alt");
                                if (parent_id == '' || parent_id == null || parent_id == undefined) {
                                    // parent not exist
                                    if (t_id != 'All') {
                                        // if single selection then always add it
                                        In_or_Out = 'in';
                                        filter_button_Data[0].Filter_button[0].WHERE[0].OR[0].TABLE[h].In_or_Out = "in";
                                    }
                                    else {
                                        // if Select All then display all
                                        In_or_Out = 'out';
                                        filter_button_Data[0].Filter_button[0].WHERE[0].OR[0].TABLE[h].In_or_Out = "out";
                                    }
                                }
                                else {
                                    // parent exist
                                    if (t_id == 'All') {
                                        // if child all selection

                                        // static change for insolare (18022019)
                                        if (new_id != '0_21122_7') {
                                            In_or_Out = 'out';
                                        }
                                    }
                                }

                                if (In_or_Out == 'in') {
                                    if (t_id == 'All') {
                                        var id_Array = [];
                                        var text_Array = [];
                                        $('#ddl_search_type20_' + new_id + ' > option').each(function () {
                                            var id = $(this).val();
                                            var text = $(this).text();
                                            if (id != '0' && id != 'All') {
                                                id_Array.push(id);
                                                text_Array.push(text);
                                            }
                                        });
                                        var t_ans_id = JSON.stringify(id_Array);
                                        var t_ans_text = JSON.stringify(text_Array);
                                        var sub_t_ans_id = '"' + t_ans_id.substring(2, t_ans_id.length - 2) + '"';
                                        var sub_t_ans_text = t_ans_text.substring(1,
                                            t_ans_text.length - 1);
                                        var ans_id = sub_t_ans_id.replace(/"/g, "'");
                                        var ans_text = sub_t_ans_text.replace(/"/g, "'");
                                    }
                                    else {
                                        var ans_id = t_id;
                                        var ans_text = t_text;
                                        if (Array.isArray(ans_id)) {
                                            ans_id = ans_id.toString();
                                        }
                                    }
                                    var Name_or_Id = WHERE_OR_TABLE[h].Name_or_Id;
                                    if (Name_or_Id == '' || Name_or_Id == null || Name_or_Id == undefined) {
                                        var Name_or_Id = 'id';
                                    }
                                    if (Name_or_Id == 'id') {
                                        filter_button_Data[0].Filter_button[0].WHERE[0].OR[0].TABLE[h].Value_1 = ans_id;
                                    }
                                    else {
                                        filter_button_Data[0].Filter_button[0].WHERE[0].OR[0].TABLE[h].Value_1 = ans_text;
                                    }
                                    if (t_id == 'All' || ans_id.indexOf(',') > -1) {
                                        filter_button_Data[0].Filter_button[0].WHERE[0].OR[0].TABLE[h].Equation = "in";
                                    }
                                    break;
                                }
                                else {
                                    // out (remove current index) from array
                                    filter_button_Data[0].Filter_button[0].WHERE[0].OR[0].TABLE.splice(h, 1);
                                    break;
                                }
                            }
                        }
                    }
                }
                else {
                    // already filled
                }
            }
        }

        /////////////////////////// OR End //////////////////////////

        var where_Json = filter_button_Data[0].Filter_button[0].WHERE[0].AND[0].JSON;
        var where_Table = filter_button_Data[0].Filter_button[0].WHERE[0].AND[0].TABLE;
        // localStorage.setItem('checksheet_AllData', JSON.stringify(filter_button_Data));

        var WHERE_OR_JSON = filter_button_Data[0].Filter_button[0].WHERE[0].OR[0].JSON;
        var WHERE_OR_TABLE = filter_button_Data[0].Filter_button[0].WHERE[0].OR[0].TABLE;

        if (flag_type == "10") {
            localStorage.setItem('checksheet_AllData_First', JSON.stringify(filter_button_Data));
        } else {
            localStorage.setItem('checksheet_AllData', JSON.stringify(filter_button_Data));
        }
    }
    catch (e) {
        alert1(e + '_get_id_text_array_for_type_20_ans()');
        loading_hide();
    }
}


// add new customer from type20 (tableview)
var glob_add_cust_from_search = "false";
function change_flag_for_text_cust_addition(t_new_id) {
    $("#type20_txt_" + t_new_id + "").attr('cust_add_flag', 0);
}

var glob_new_cust_flag = ''
function get_popup_to_add_item_online(t_checksheet_id, t_add_cust_from_search, t_new_id, search_str, flag) {
    glob_add_cust_from_search = t_add_cust_from_search;
    glob_new_cust_flag = flag;

    // upgrade zindex in case task create > searchable click > + button click for add customer > datetimepicker - mk - 06082025
    $("#temp_datetimepicker_style").remove();
    $("body").append("<style id='temp_datetimepicker_style'>.picker-columns { z-index: 14012; }</style>");

    if (t_add_cust_from_search == "true") {
        //----add new customer from search in type20 for ATC [atc.bb - 05052021]
        localStorage.setItem('type20_text_cust_id', t_new_id);
        myApp.popup('.popup-type20-add');
        myApp.closeModal('.popup-type20-add');
    }
    else {
        myApp.popup('.popup-type20-add');
    }

    if (search_str == "" || search_str == null || search_str == undefined) {
        // search from searchable listview
        search_str = $("#txt_search").val();
    }

    get_checksheet_details(t_checksheet_id, search_str);
}

function get_checksheet_details(t_checksheet_id, t_search_str) {
    try {
        loading();
        var company_id = JSON.parse(storage.getItem('company_id'));
        localStorage.setItem('check_type_customer', t_checksheet_id);
        localStorage.setItem('customer_search_str', t_search_str);

        var Param_obj = [];
        Param_obj.push({
            'checksheet_id': t_checksheet_id
        });

        var auth = [];
        auth.push({
            'username': username,
            'u_c': uniqcode
        });

        var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_Off_Download_Task_Master_checksheet', JSON.stringify(Param_obj), onsuccess_get_checksheet_details, onfail_get_checksheet_details);
        getdata.callOtherDomain();
    }
    catch (e) {
        alert1(e + '_get_checksheet_details()');
        loading_hide();
    }
}

function onsuccess_get_checksheet_details(e) {
    try {
        var Task_json = e.responseText;
        Task_json = Task_json.replace('[ [', '[');
        Task_json = Task_json.replace('] ]', ']');
        Task_json = eval('(' + Task_json + ')');
        var status = Task_json[0].status;
        //var message = Task_json[0].message;
        if (status == 1) {
            //message = eval('(' + message + ')');

            var data = Task_json[0].data;
            if (data == "" || data == null || data == undefined) {
                var message = JSON.parse(Task_json[0].message);
            }
            else {
                var message = JSON.parse(data);
            }

            var Subcategory = message[0].Subcategory;
            var checksheet_id = message[0].checksheet_id;
            var Data = message[0].Data;
            Data = eval('(' + Data + ')');
            var button = message[0].button;
            button = eval('(' + button + ')');

            read_dynamic_checksheet(Subcategory, checksheet_id, 1, Data, button, 7, 0);
        }
        else {
            alert1(message);
            loading_hide();
        }
    }
    catch (e) {
        alert1(e + '_onsuccess_get_checksheet_details()');
        loading_hide();
    }
}

function onfail_get_checksheet_details(e) {
    alert1(e + '_onfail_get_checksheet_details()');
    loading_hide();
}

function submit_popup_data_type20_add() {
    try {
        if (glob_add_cust_from_search == "true") {
            //----add new customer from search in type20 for ATC [atc.bb - 05052021]
            return validate_and_submit_surveydata_main(1, 7, jsonObj_cust_add);
        }
        else {
            return validate_and_submit_surveydata_main(1, 7, jsonObj_old);
        }
    } catch (e) {
        alert1(e + "_submit_popup_data_type20_add()");
    }
    return false;
}

var temp_cust_json;
function add_new_item_by_type20(t_jsonObj) {
    loading();
    var company_id = JSON.parse(storage.getItem('company_id'));
    var user_id = JSON.parse(storage.getItem('user_id'));
    var checksheet_id = localStorage.getItem('check_type_customer');

    // remove duplicate photo ids
    var t_Photo_Id_Array = [];
    let type20_cust_add_popup = $('#popup_container_type20_add:visible').length;
    if (type20_cust_add_popup > 0) {
        // Customer Form
        if (Cust_Photo_Id_Array.length > 0) {
            Cust_Photo_Id_Array = Cust_Photo_Id_Array.reduce(function (item, e1) {
                var matches = item.filter(function (e2) { return e1.photo_id == e2.photo_id });
                if (matches.length == 0) {
                    item.push(e1);
                }
                return item;
            }, []);

            t_Photo_Id_Array = Cust_Photo_Id_Array;
        }
    }
    else {
        // Task Form
        // remove duplicate photo ids
        if (Photo_Id_Array.length > 0) {
            Photo_Id_Array = Photo_Id_Array.reduce(function (item, e1) {
                var matches = item.filter(function (e2) { return e1.photo_id == e2.photo_id });
                if (matches.length == 0) {
                    item.push(e1);
                }
                return item;
            }, []);

            t_Photo_Id_Array = Photo_Id_Array;
        }
    }

    var Param_obj = [];
    Param_obj.push({
        'CustomerUniqId': "",
        'Company_id': company_id,
        'Subcategory': "",
        'Step_id': 1,
        'StepNo': 1,
        'checksheet_id': checksheet_id,
        'Status': 0,
        'Data': t_jsonObj,
        'button': [],
        'createby': user_id,
        'UpdatedBy': user_id,
        "checksheet_type": 3,
        'photo_temp': t_Photo_Id_Array
    });

    var cust_data_json = t_jsonObj;
    for (var t = 0; t < cust_data_json.length; t++) {
        var que_id = cust_data_json[t].que_id;
        if (que_id == 1) {
            var cust_name = cust_data_json[t].ans[0];
            break;
        }
    }
    localStorage.setItem('type20_new_cust_name', cust_name);

    temp_cust_json = Param_obj;

    var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_Check_Customer_Or_User_Exists', JSON.stringify(Param_obj), check_customer_exist, onfail_Insert_Json_1);
    getdata.callOtherDomain();
}

function check_customer_exist(invocation1) {
    var Suc_Message = invocation1.responseText;
    Suc_Message = eval('(' + Suc_Message + ')');
    var status = Suc_Message[0].status;
    if (status == 11) {
        // customer is not exist

        var Param_obj = temp_cust_json;
        var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_insert_Customer_Master_And_Sub_Type', JSON.stringify(Param_obj), onsucess_Insert_Json_1, onfail_Insert_Json_1);
        getdata.callOtherDomain();
    }
    else {
        // customer exist
        var message = Suc_Message[0].message;
        loading_hide();
        alert1(message);
        if (glob_add_cust_from_search == "true") {
            var type20_text_cust_id = localStorage.getItem('type20_text_cust_id');
            $("#type20_txt_" + type20_text_cust_id + "").val('');
        }
    }
}

function onsucess_Insert_Json_1(invocation1) {
    var Suc_Message1 = invocation1.responseText;
    Suc_Message1 = eval('(' + Suc_Message1 + ')');
    var message1 = Suc_Message1[0].message;
    var status = Suc_Message1[0].status;
    if (status == 1) {
        var data_json = JSON.parse(storage.getItem('list_json'));
        if (data_json == "" || data_json == null || data_json == undefined) {
            var customer_create_msg = "";
        }
        else {
            var list_data = JSON.parse(data_json);
            var customer_create_msg = list_data[0].customer_create_msg;
        }

        if (customer_create_msg == "" || customer_create_msg == null || customer_create_msg == undefined) {
            customer_create_msg = "Customer Inserted successfully";
        }
        alert1(customer_create_msg);

        hide_type20_add_popup();

        var new_cust_id = Suc_Message1[0].data;
        var new_cust_name = localStorage.getItem('type20_new_cust_name');

        if (glob_add_cust_from_search == "true") {
            var type20_text_cust_id = localStorage.getItem('type20_text_cust_id');
            $("#type20_txt_" + type20_text_cust_id + "").val(new_cust_name);
            $("#type20_txt_" + type20_text_cust_id + "").attr('value1', new_cust_id);
            $("#type20_txt_" + type20_text_cust_id + "").attr('name', 1);
            $("#type20_txt_" + type20_text_cust_id + "").attr('cust_add_flag', 1);
        }
        else {
            $("#F7_type20_ddl_Search :input[type='search']").val(new_cust_name);
            if (new_cust_name == "" || new_cust_name == null || new_cust_name == undefined) {
                // autofill data not exist but customeruniq not found at que_id = 1 due to other type 33 or other type
                get_customer_name(new_cust_id)
            }
            else {
                //get_data_by_dropdown_search(new_id_G, TableName_G, JoinTableName_G, Checksheet_id_G);

                let listview_popup = $('.popup-type20.modal-in:visible');
                if (listview_popup.length > 0) {
                    let listview_new_id = $("#div_listview_data ul").attr("listview_new_id");
                    if (listview_new_id == "" || listview_new_id == null || listview_new_id == undefined) { }
                    else {
                        new_id_G = listview_new_id;
                    }
                }

                // add newly created customer directly to the dropdown instead of search logic - 27072021
                var new_cell_value = encodeURIComponent(new_cust_name);
                var option = "<option value=" + new_cell_value + " value1=" + new_cust_id + ">" + new_cust_name + "</option>";
                $("#ddl_search_type20_" + new_id_G + "").append(option);

                $("#ddl_search_type20_" + new_id_G + "").attr('name', '1');

                set_dropdown_data(new_cust_name, new_id_G);

                // check searchable view and create html string for newly added customer below searchable dropdown
                create_listview_html_for_new_customer(new_id_G);

            }
        }
    }
    else {
        alert1(message1);
    }
    loading_hide();
}


function get_customer_name(t_cust_id) {
    try {
        var Param_obj = [];
        Param_obj.push({ 'key': 'isdelete', 'value': 0 }, { 'key': 'customerid', 'value': t_cust_id });

        var getdata = new Webservicecall_REST(global_wcf_url + 'Customer/GetCustomerIdAndCustomeruniq', JSON.stringify(Param_obj), onsuccess_get_customer_name, onfail_get_customer_name);
        getdata.callOtherDomain();
    }
    catch (e) {
        loading_hide();
        alert1(e + '_get_customer_name');
    }
}

function onsuccess_get_customer_name(e) {
    try {
        var result = e.responseText;
        var myData = eval('' + result + '');
        var status = myData[0].status;
        if (status == 1) {

            var data = myData[0].data;
            if (data == "" || data == null || data == undefined) {
                var myArray = JSON.parse(myData[0].message);
            }
            else {
                var myArray = JSON.parse(data);
            }

            var new_cust_id = myArray[0].id;
            var new_cust_name = myArray[0].name;

            $("#F7_type20_ddl_Search :input[type='search']").val(new_cust_name);

            get_data_by_dropdown_search(new_id_G, TableName_G, JoinTableName_G, Checksheet_id_G);
        }
    }
    catch (e) {
        loading_hide();
        alert1(e + '_onsuccess_get_customer_name');
    }
}

function onfail_get_customer_name(e) {
    loading_hide();
    alert1(e + '_onfail_get_customer_name');
}

function onfail_Insert_Json_1(e) {
    alert1("Network Error, Please Try Again !");
    loading_hide();
}

function hide_type20_add_popup() {
    $("#temp_datetimepicker_style").remove();
    $("#popup_container_type20_add").empty();
    $('.footer-type20-add').empty();
    myApp.closeModal('.popup-type20-add');
    if (F7_device == 'android') {
        //popup UI issue in iOS
        $(".popup-type20-add").hide();
    }
}


////////// - offline task filter ------ //////////

//type 20 listview filter search
function filter_search() {
    try {
        $("#txt_search").val("");

        var clickedLink = $("#filter_search");
        myApp.popup('.popup-type20-main-filter', clickedLink);
        var message = JSON.parse($('#hdn_filter_popover').val());

        var cust_json = message.detail;
        var Checksheet_id = message.checksheet_id;
        var Checksheet_type = message.checksheet_type_id;

        var ddl_cnt = 0;
        var check_lst_filter_ele = document.getElementById('lst_filter').children;
        if (check_lst_filter_ele.length == 0) {

            let checksheet_json = $('#hdn_filter_popover').attr("blank_checksheet");
            checksheet_json = JSON.parse(checksheet_json);
            cust_json = merge_checksheet_template_n_log_form_json(checksheet_json, cust_json);

            var opt = ""
            for (var c = 0; c < cust_json.length; c++) {
                var type = cust_json[c].type;
                //if (cust_json[c].type == 3 || cust_json[c].type == 2 || cust_json[c].type == 6) {
                if (type == 0 || type == 5 || type == 10) { }
                else {
                    var label = cust_json[c].prop[0].name;
                    var que_id = cust_json[c].que_id;
                    var ary_val = cust_json[c].value;
                    var param = "sub_filter_popup(" + ddl_cnt + ", '" + label + "', '" + type + "')";
                    opt += '<li id="ddl_filter_' + ddl_cnt + '" name="' + label + '" data="' + ary_val + '"  alt="' + que_id + '"><a onclick="' + param + '" href="#"class="item-link item-content"><div class="item-inner">';
                    opt += '<div class="item-title">' + label + '</div><div class="item-text" id="filter_sub_label_' + ddl_cnt + '"></div></div></a></li>';
                    ddl_cnt++;
                }
            }


            if (ddl_cnt == 0) {
                //if type 2, 3, 6 not available
                opt += '<li style="margin-top: 5px; list-style-type:none; border:1px solid #ccc">No Filter Available.</li>';
            }

            var param = "popup_column_search_listview(" + Checksheet_id + ", " + Checksheet_type + ", " + ddl_cnt + ")"
            $('#lst_filter').append(opt);
            $('#apply_filter').append('<a href="#" class="link" onclick="' + param + '">APPLY</a')
        }
    }
    catch (e) {
        alert1(e + '_filter_search')
    }
}


function sub_filter_popup(ddl_cnt, label, type) {
    try {
        myApp.popup('.popup-type20-filter');
        $('#sub_filter_item').text(label);

        var opt = '';
        opt += '<ul>';

        var ary_val = $('#ddl_filter_' + ddl_cnt + '').attr('data');
        ary_val = ary_val.split(',');

        var selected_ary_val = $('#filter_sub_label_' + ddl_cnt + '').text();
        if (selected_ary_val == '' || selected_ary_val == null || selected_ary_val == undefined) {
            selected_ary_val = [];
        }
        else {
            if (type == 2 || type == 3 || type == 6) {
                selected_ary_val = selected_ary_val.split(',');
            }
        }

        if (type == 2 || type == 3 || type == 6) {
            for (var o = 0; o < ary_val.length; o++) {
                var found = 0;
                for (var s = 0; s < selected_ary_val.length; s++) {
                    var s_val = selected_ary_val[s];
                    if (s_val == ary_val[o]) {
                        found++;
                        break;
                    }
                }
                if (found > 0) {
                    opt += '<li><label class="label-checkbox item-content"><input type="checkbox" onchange="update_checkbox_count()" name="filter-checkbox"  value="' + ary_val[o] + '" checked="checked">';
                }
                else {
                    opt += '<li><label class="label-checkbox item-content"><input type="checkbox" onchange="update_checkbox_count()" name="filter-checkbox"  value="' + ary_val[o] + '">';
                }
                opt += '<div class="item-media"><i class="icon icon-form-checkbox"></i></div><div class="item-inner">';
                opt += '<div class="item-title">' + ary_val[o] + '</div></div></label></li>';
            }
            $("#lbl_selected_chk").html(selected_ary_val.length + ' Selected');
        }
        else {
            var txt_placeholder = "Enter " + label + "";
            if (selected_ary_val != "") {
                opt += '<li style="padding: 5px;margin:0"><label class="label-checkbox item-content"><input type="text" value="' + selected_ary_val + '" name="filter-checkbox" placeholder="'
                    + txt_placeholder + '" style="border:solid 1px gray;border-radius:10px;width:100%;padding:10px;" checked="checked">';
            }
            else {
                opt += '<li style="padding: 10px;margin:0;"><label class="label-checkbox item-content" style="margin:0;padding:0;"><input type="text" name="filter-checkbox" placeholder="'
                    + txt_placeholder + '" style="border:solid 1px gray;border-radius:10px;width:100%;padding:10px;" checked="checked">';
            }

            opt += '</label></li>';

            $("#lbl_selected_chk").parent().html('<label id="lbl_selected_chk" style="margin-left: 16px"></label>');
        }

        opt += '</ul>';

        $('#div_filter_popup').empty();
        $('#div_filter_popup').append(opt);

        $('#div_filter_bottom').empty();
        var param_done = "get_selected_filter_option(" + ddl_cnt + ")";
        //$("#lbl_selected_chk").text(selected_ary_val.length);
        $('#div_filter_bottom').append('<a href="#" class="link" onclick="' + param_done + '">Select</a>');
    }
    catch (e) {
        alert1(e + '_sub_filter_popup');
    }
}

function update_checkbox_count() {
    var checked = 0;
    var checkbox = document.getElementsByName('filter-checkbox');
    for (j = 0; j < checkbox.length; j++) {
        if (checkbox[j].checked) {
            checked++;
        }
    }
    $("#lbl_selected_chk").text(checked + ' Selected');
}

function get_selected_filter_option(ddl_cnt) {
    var answer = [];
    var checkbox = document.getElementsByName('filter-checkbox');
    for (j = 0; j < checkbox.length; j++) {
        if (checkbox[j].checked) {
            answer.push(checkbox[j].value);
        }
    }
    answer = answer.toString();
    $('#filter_sub_label_' + ddl_cnt + '').text(answer);
    myApp.closeModal('.popup-type20-filter');
}

function clear_selected_filter_option_task() {
    $('div[id^="filter_sub_label_"]').empty();
}

//column with multi-option(type-2,3,6) filter search (only for listview)
function popup_column_search_listview(Checksheet_id, Checksheet_type, ddl_cnt) {
    try {
        $("#ul_search_" + curr_btnSearch_Counter + "").empty();                     //empty list data on filter APPLY click --- [25032020]
        $("#div_listview_data").unbind('scroll');

        var field_Array = [];
        var company_id = JSON.parse(storage.getItem('company_id'));

        var Condition_Data_Str = $('#hdn_condition_data_' + curr_btnSearch_Counter + '').val();
        Condition_Data_Str = decodeURIComponent(Condition_Data_Str);
        var Condition_Data = itemObj._checkStrObj(Condition_Data_Str);  		// check_item
        var value_new = Condition_Data[0].value_new;
        var push_data_str = JSON.stringify(value_new[0].push_data);
        var qs_array = pass_required_values_to_push_array(push_data_str);
        value_new[0].push_data = JSON.parse(qs_array[0]);

        var searchValueAll = [];

        for (v = 0; v < ddl_cnt; v++) {
            var search_val = $("#filter_sub_label_" + v).text();
            search_val = search_val.split(",").join("','");
            if (search_val == '' || search_val == null || search_val == undefined) { }
            else {
                var que_id = $("#ddl_filter_" + v).attr('alt');
                var Columname = $("#ddl_filter_" + v).attr('name');

                if (value_new == '' || value_new == null || value_new == undefined) {
                    var ColumnNameSubData = [];
                    ColumnNameSubData.push({
                        'Checksheet_Type': Checksheet_type,
                        'Checksheet_Id': Checksheet_id,
                        'Task_Id': "",
                        'Ques_Id': que_id,
                        'Header': Columname,
                        'Equation': "begin with",
                        'Value_1': search_val,
                        'Value_2': "",
                        'Type': "string"
                    });
                    Condition_Data[0].where[0].And[0].Json.push(ColumnNameSubData[0]);
                }
                else {
                    searchValueAll.push({
                        'Header': Columname,
                        'Value': search_val,
                        'que_id': que_id
                    });
                }
            }
        }

        if (value_new == '' || value_new == null || value_new == undefined) {
            var company_id = JSON.parse(storage.getItem('company_id'));
            var From_Table = Condition_Data[0].FROM[0].Table_Name;
            var param_obj = [];
            param_obj.push({
                'company_id': company_id,
                'data': JSON.stringify(Condition_Data),
                'flag': 3, // all data for (tableview/listview)
                'primary_key': '',
                'table_name': From_Table
            });
            var a = JSON.stringify(param_obj);

            var appversion = JSON.parse(storage.getItem('appversion'));
            var auth = [];
            auth.push({
                "username": username,
                "devicetype": F7_device,
                "appid": "",
                "u_c": uniqcode,
                "appversion": appversion
            });

            loading();
            var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_Dynamic_Filter_Table_Data_N', JSON.stringify(param_obj), onsuccess_get_all_searched_list, onfail_popup_column_search);
            getdata.callOtherDomain();

        }
        else {
            //  New Searchable with SearchID
            value_new[0]['OFFSET'] = OFFSET_TYPE20;
            value_new[0]['FETCH'] = FETCH_TYPE20;
            value_new[0]['searchValue'] = '';
            value_new[0]['searchValueAll'] = searchValueAll;

            var param_obj = [];
            param_obj.push({
                'flag': 3,                       //primary key and single data for (dropdownview)
                "value_new": value_new,
                "searchable_id": "ddl_search_type20_" + curr_btnSearch_Counter
            });

            loading();
            var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_Type20Filter', JSON.stringify(param_obj), onsuccess_get_all_searched_list, onfail_popup_column_search);
            getdata.callOtherDomain();

        }
    } catch (e) {
        alert1(e + '_popup_column_search_listview()');
        loading_hide();
    }
}


///////////////////////////////


///////// - type20 dropdown filter ------ //////////

var filled_dropdown_counter;
function get_filled_dropdown_data(t_new_id, TableName, JoinTableName, Checksheet_id, customer_checksheetid, ddl_info_view, autofill, add_cust_from_search) {
    try {
        clearTimeout(filled_dropdown_counter);
        filled_dropdown_counter = setTimeout(function () {
            get_dropdown_data(t_new_id, TableName, JoinTableName, Checksheet_id, customer_checksheetid, ddl_info_view, autofill, add_cust_from_search)
        }, 1000);
    }
    catch (e) {
        alert1(e + '_get_filled_dropdown_data');
    }
}

var new_id_G;
var glob_type20_cust_checksheetid = 0;

var auto_open_id_text = "";
var auto_open_id_qr = "";

function get_dropdown_data_edit_text(t_new_id, TableName, JoinTableName, Checksheet_id, customer_checksheetid, ddl_info_view, autofill, add_cust_from_search) {
    // Edit Text

    var ddl_type = $("#ddl_search_type20_" + t_new_id + "").attr("ddl_type");
    var parent_ddl_id = $("#ddl_search_type20_" + t_new_id + "").attr("parent_ddl_id");
    var parent_ddl_val = $("#" + parent_ddl_id).val();
    var ddl_len = $("#ddl_search_type20_" + t_new_id + " option").length;
    if (ddl_len == 1 && ddl_type == "ddl_child" && parent_ddl_val == 0) {
        auto_open_id_text = t_new_id;
    }
    else {
        auto_open_id_text = "";
    }

    ddl_search_type = "normal";
    get_dropdown_data(t_new_id, TableName, JoinTableName, Checksheet_id, customer_checksheetid, ddl_info_view, autofill, add_cust_from_search);
}

function get_dropdown_data(t_new_id, TableName, JoinTableName, Checksheet_id, customer_checksheetid, ddl_info_view, autofill, add_cust_from_search) {
    try {
        glob_type20_cust_checksheetid = customer_checksheetid;
        glob_add_cust_from_search = add_cust_from_search;

        $("#dd_listview_icon").show();    //show listview filter

        $("#ddl_list").unbind('scroll');
        ddl_item_info = "false";
        ddl_listview = "false";

        var is_type22_popup = $(".popup-type22:visible").length;
        if (is_type22_popup > 0) {
            //---set higher z-index when searchble is inside type22 [17082021]
            $(".popup-type20-dropdown").css('z-index', '14010');
        }

        var ddl_type = $("#ddl_search_type20_" + t_new_id + "").attr("ddl_type");
        var parent_ddl_id = $("#ddl_search_type20_" + t_new_id + "").attr("parent_ddl_id");
        var parent_ddl_val = $("#" + parent_ddl_id).val();
        var ddl_len = $("#ddl_search_type20_" + t_new_id + " option").length;
        var first_op_val = $("#ddl_search_type20_" + t_new_id + " option:first-child").val();

        if (ddl_len == 1 && ddl_type == "ddl_child" && parent_ddl_val == 0) {
            alert1("Please select parent dropdown first!");
        }
        //else if (ddl_len == 1 && first_op_val == 0 && (autofill == "" || autofill == null || autofill == undefined || autofill == "true")) {
        //    //autofill condition added for baterry bank cell id issue in pageload [27042021]
        //    //commented on 31052021 as there is a possibility of blank searchable (will add option by add customer)
        //    alert1("Options are not available, please tap again!");
        //}
        else {
            var checksheet_type_filter = JSON.parse(storage.getItem('checksheet_type_filter'));
            if (checksheet_type_filter == '9' || checksheet_type_filter == '10') {
                if (ddl_len == 1) {
                    ddl_len = ddl_len - 1;
                }
                else {
                    ddl_len = ddl_len - 2;
                }
            }
            else {
                ddl_len = ddl_len - 1;
            }

            //if (ddl_len == 1) { }                                     //don't disable type20 for single field-issue in customer creation for single field (srjna-21082019)
            //else {
            //DEFAULT_TYPE20 = 50;                                      commented for dynamic fetch_limit [FT - 24012024]
            //FETCH_TYPE20 = DEFAULT_TYPE20; // how many from start

            var Condition_Data_Str = $('#hdn_condition_data_' + t_new_id + '').val();
            var t_Condition_Data_Str = decodeURIComponent(Condition_Data_Str)
            var Condition_Data = JSON.parse(t_Condition_Data_Str);

            var value_new = Condition_Data[0].value_new;
            if (value_new == '' || value_new == null || value_new == undefined) {
                DEFAULT_TYPE20 = 50;
            }
            else {
                var push_data = value_new[0].push_data;
                var fetch_limit = push_data[0].fetch_limit;
                if (fetch_limit == "" || fetch_limit == null || fetch_limit == undefined) {
                    fetch_limit = 50;
                }
                fetch_limit = parseInt(fetch_limit);
                DEFAULT_TYPE20 = fetch_limit;
            }

            OFFSET_TYPE20 = 0; // from where to start
            TableName_G = TableName;
            JoinTableName_G = JoinTableName;
            Checksheet_id_G = Checksheet_id;
            new_id_G = t_new_id;

            var view_style = $("#ddl_search_type20_" + t_new_id + "").attr("view_style");
            if (view_style == "listview") {
                open_popup_for_listview_type20();
            }
            else {
                $('#type20_ddl_list').empty();
                $("#F7_type20_ddl_Search :input[type='search']").val('');
                $('.searchbar-not-found').hide();
                $('.searchbar-found').show();

                var li_txt = '';
                glob_type20_popup_flag = "normal";
                myApp.popup('.popup-type20-dropdown');

                var multiple = $("#ddl_search_type20_" + t_new_id + "").attr("multiple");
                $("#ddl_search_type20_" + t_new_id + " > option").each(function () {
                    var ddl_txt = $(this).text();
                    var ddl_val = $(this).val();

                    var ddl_value1 = $(this).attr('value1');
                    if (ddl_value1 == "" || ddl_value1 == null || ddl_value1 == undefined) {
                        ddl_value1 = ddl_val;
                    }

                    var param = "set_dropdown_data('" + ddl_val + "', '" + t_new_id + "', '" + add_cust_from_search + "', '" + ddl_value1 + "', '" + ddl_txt + "')";

                    var param_info = "get_ddl_info_type20('" + ddl_value1 + "', '" + ddl_val + "', '" + t_new_id + "')";

                    li_txt += '<li class="item-content" onclick="' + param + '" value="' + ddl_val + '">';
                    li_txt += '<div class="item-inner"><div class="item-title">' + ddl_txt + '</div>';

                    if (ddl_txt == "Select Value" || ddl_txt == "Select All" || ddl_txt == "No Data Found !") { }
                    else {
                        if (ddl_info_view == "false") { }
                        else {
                            li_txt += '<div class="item-after"><div class="item-icon" style="padding:0px;margin:0;">';

                            if (multiple == "" || multiple == null || multiple == undefined) {
                                // single selection
                                var li_ico = 'fa-info-circle';
                            }
                            else {
                                // multiple selection
                                var is_selected = $(this).attr('selected');
                                if (is_selected == "" || is_selected == null || is_selected == undefined) {
                                    var li_ico = 'fa-info-circle';
                                }
                                else {
                                    var li_ico = 'fa-check-square-o';
                                }

                            }
                            li_txt += '<i class="fa ' + li_ico + ' cls_task_ico" style="font-size: 32px;" onclick="' + param_info + '"></i></div></div>';
                        }
                    }

                    li_txt += '</div></li>';
                });
                $('#type20_ddl_list').append(li_txt);

                $('.cls_task_ico').click(function (event) {
                    event.stopPropagation();
                });

                var show_more_avail = $(".footer-type20-dropdown").find('center').find('img');
                var ddl_len = $("#ddl_search_type20_" + t_new_id + " option").length;
                var old_OFFSET_TYPE20 = OFFSET_TYPE20;
                var checksheet_type_filter = JSON.parse(storage.getItem('checksheet_type_filter'));
                //if (checksheet_type_filter == '9' || checksheet_type_filter == '10') {
                //    if (ddl_len == 1) {
                //        OFFSET_TYPE20 = ddl_len - 1;
                //        ddl_len = ddl_len - 1;
                //    }
                //    else {
                //        OFFSET_TYPE20 = ddl_len - 2;
                //        ddl_len = ddl_len - 2;
                //    }
                //}
                //else {
                //    OFFSET_TYPE20 = ddl_len - 1;
                //    ddl_len = ddl_len - 1;
                //}

                var possible_limit = old_OFFSET_TYPE20 + FETCH_TYPE20;
                //if (ddl_len >= (possible_limit - 1)) {
                $('.footer-type20-dropdown').parent().show();
                var param_ddl = "Show_More_ddl('" + t_new_id + "', '" + TableName_G + "', '" + JoinTableName_G + "', '" + Checksheet_id_G + "')";

                //var show_more_img = $(".footer-type20-dropdown").find('.center').find('.show_more');
                //if (show_more_img.length == 0) {
                //    $(".footer-type20-dropdown").find('.center').append('<img id="img1" style="cursor: pointer; width: 30px; height: 20px;margin-top:10px;" class="show_more" onclick="' + param_ddl + '" src="images/show_more.gif">');
                //}

                $("#ddl_list").scroll(function () {
                    var offsetHeight = document.getElementById("ddl_list").offsetHeight;
                    var scrollTop = document.getElementById("ddl_list").scrollTop;
                    var scrollHeight = document.getElementById("ddl_list").scrollHeight;
                    if (parseInt(scrollTop) === (parseInt(scrollHeight) - parseInt(offsetHeight))) {
                        Show_More_ddl(t_new_id, TableName_G, JoinTableName_G, Checksheet_id_G);
                    }
                });
                //}
                //else {
                //    $('.footer-type20-dropdown').find('.center').find('img').remove();
                //    $('.footer-type20-dropdown').parent().hide();
                //}
                //}

                if (customer_checksheetid == '' || customer_checksheetid == null || customer_checksheetid == undefined || customer_checksheetid == "0" || customer_checksheetid == "undefined") {
                    $("#ddl_cust_creation").hide();
                    //$("#btn_search_cust_add").hide();
                }
                else {
                    //$("#btn_search_cust_add").hide();
                    //var param = 'get_popup_to_add_item_online(' + customer_checksheetid + ', "' + add_cust_from_search + '")';
                    //if (add_cust_from_search == "true") {
                    //    //----add new customer from search in type20 for ATC [atc.bb - 05052021]
                    //    $("#ddl_cust_creation").hide();
                    //    $('#btn_search_cust_add').show();

                    //    $("#F7_type20_ddl_Search input[type='search']").focus();                        //auto focus search input textbox
                    //    $("#F7_type20_ddl_Search input[type='search']").off('input');                   //unbind auto search event for type20 [atc.bb - 05052021]
                    //    $('#btn_search_cust_add').attr('onclick', param);
                    //}
                    //else {
                    //    $("#ddl_cust_creation").show();
                    //    $("#ddl_cust_creation").attr('onclick', param)
                    //}

                    var param = 'get_popup_to_add_item_online(' + customer_checksheetid + ', "' + add_cust_from_search + '")';
                    $("#ddl_cust_creation").show();
                    $("#ddl_cust_creation").attr('onclick', param);
                }

                var json_inv = $("#ddl_search_type20_" + t_new_id + "").attr('type22_array_index');
                var btn_add = inv_Calc_new_array[json_inv];
                var type22_json_len = $("#hdn_type22_json_len_" + btn_add + "").val();
                if (type22_json_len == 1) {
                    if ($('#div_singleInvoice_cntrl_' + btn_add + '')) {
                        $("#type20_ddl_list li .item-icon > i").removeClass("fa-check-square-o").addClass("fa-info-circle");
                        $("#ddl_search_type20_" + t_new_id + " option").removeAttr('selected');

                        var type22_badge_obj = $("#div_list_display_" + btn_add + " li span.badge.badge-secondary");
                        var type20_opt_obj = $("#div_singleInvoice_cntrl_" + btn_add + "").find("select[id^=ddl_search_type20] option");
                        $(type20_opt_obj).each(function () {
                            var t_val = $(this).text();
                            if (t_val == "Select Value") {
                                $("#ddl_search_type20_" + t_new_id + " option[value='" + t_val + "']").removeAttr('selected');
                            }
                            else {
                                if (type22_badge_obj.length > 0) {
                                    $(type22_badge_obj).each(function () {
                                        var curr_val = $(this).find('label[id^=txt_add_row]').text();
                                        var temp_curr_val = curr_val.replace(/ /g, "%20");
                                        if (curr_val.toLowerCase() == t_val.toLowerCase()) {
                                            var curr_icon = $("#type20_ddl_list li[value='" + temp_curr_val + "'] .item-icon i.fa-info-circle");
                                            if (curr_icon.length > 0) {
                                                $("#type20_ddl_list li[value='" + temp_curr_val + "'] .item-icon > i").removeClass("fa-info-circle").addClass("fa-check-square-o")
                                                $("#ddl_search_type20_" + t_new_id + " option[value='" + temp_curr_val + "']").attr('selected', 'selected');
                                            }
                                        }
                                    });
                                }
                                else {
                                    $("#type20_ddl_list li .item-icon > i").removeClass("fa-check-square-o").addClass("fa-info-circle");
                                    $("#ddl_search_type20_" + t_new_id + " option").removeAttr('selected');
                                }
                            }
                        });

                        $('#div_singleInvoice_cntrl_' + btn_add + '').trigger("ondrag");
                    }
                }
            }
        }
    }
    catch (e) {
        alert1(e + '_get_dropdown_data');
    }
}

function Show_More_ddl(temp_btnSearch_Counter, TableName_t, JoinTableName_t, Checksheet_id_t) {
    loading();
    curr_type_G = "show_more";
    curr_btnSearch_Counter = temp_btnSearch_Counter;
    OFFSET_TYPE20 = OFFSET_TYPE20 + DEFAULT_TYPE20;
    var search_val = $("#F7_type20_ddl_Search input[type='search']").val();
    if (search_val == "" || search_val == null || search_val == undefined) {
        get_all_searched_list(TableName_t, JoinTableName_t, Checksheet_id_t);
    }
    else {
        get_data_by_dropdown_search(temp_btnSearch_Counter, TableName_t, JoinTableName_t, Checksheet_id_t);
    }
}

function set_dropdown_data(t_val, t_new_id, add_cust_from_search, t_val1, ddl_txt, list_ele) {

    var multiple = $("#ddl_search_type20_" + t_new_id + "").attr("multiple");
    if (multiple == "" || multiple == null || multiple == undefined) {
        // single selection


        var html_str = '';
        var view_style = $("#ddl_search_type20_" + t_new_id + "").attr("view_style");
        if (view_style == "listview") {
            html_str = $(list_ele).html();
            $("#div_Search_" + t_new_id + "").find("#tbl_type20_listpopup").remove();
            $("#div_Search_" + t_new_id + "").append(html_str);
        }

        //if (ddl_listview == "true") {
        popup_items_hide_type20();                      //hide listview popup on list-item click
        hide_current_type_loading(t_new_id);
        ddl_listview = "false";
        //}

        myApp.closeModal('.popup-type20-dropdown');

        if (F7_device == 'android' || F7_device == 'ios') {
            //popup UI issue in iOS
            $(".popup-type20-dropdown").hide();
        }

        //--type20 dependency for dropdown onchange--- for ATC(rahul.vt) [23092020]
        var type20_dependency_str = $('#hdn_type20_dependency_data_' + t_new_id + '').val();
        if (type20_dependency_str == '' || type20_dependency_str == null || type20_dependency_str == undefined) { }
        else {
            var type20_dependency_data = JSON.parse(decodeURIComponent(type20_dependency_str));
            if (type20_dependency_data.length > 0) {
                for (d = 0; d < type20_dependency_data.length; d++) {
                    let dep_t_val = decodeURIComponent(t_val);
                    type20_dependency_data[d].ele_ans = dep_t_val;
                }
                var paramData = JSON.stringify(type20_dependency_data);
                set_global_show_hide_class(encodeURIComponent(paramData))
                $('#hdn_type20_dependency_data_' + t_new_id + '').val(encodeURIComponent(JSON.stringify(type20_dependency_data)))
            }
        }

        if (add_cust_from_search == "true") {
            $("#type20_txt_" + t_new_id).val(t_val);
            $("#type20_txt_" + t_new_id + "").attr('cust_add_flag', 1);
            $("#type20_txt_" + t_new_id + "").parents('.add-cust-outer').siblings('.type20-ddl-outer').hide();
        }

        if (t_val == "0") {
            $("#ddl_search_type20_" + t_new_id + " option").each(function () {
                var cell_id = $(this).attr('value1');
                if (t_val1 == cell_id) {
                    $(this).attr('selected', 'selected');
                }
            });
        }
        else {
            $("#ddl_search_type20_" + t_new_id + "").val(t_val);

            let is_selected = $("#ddl_search_type20_" + t_new_id + "").val();
            if (is_selected == "" || is_selected == null || is_selected == undefined) {
                t_val = encodeURIComponent(t_val);
                $("#ddl_search_type20_" + t_new_id + "").val(t_val);
            }
        }

        $("#ddl_search_type20_" + t_new_id + "").css('color', '#000');
        $("#ddl_search_type20_" + t_new_id + "").prop("disabled", true);
        $("#ddl_search_type20_" + t_new_id + "").trigger("onchange");
        $("#ddl_search_type20_" + t_new_id + "").trigger("ondrag");

        setTimeout(function (e) {
            var Condition_Data_Str = $('#hdn_condition_data_' + t_new_id + '').val();
            var Condition_Data = itemObj._checkStrObj(decodeURIComponent(Condition_Data_Str));          // check_item
            var value_new = Condition_Data[0].value_new;
            if (value_new == '' || value_new == null || value_new == undefined) {
                var Fill_Data_str = Condition_Data[0].fill_data;
            }
            else {
                var Fill_Data_str = value_new[0].Fill_Data;
            }
            if (Fill_Data_str == "" || Fill_Data_str == null || Fill_Data_str == undefined) { }
            else {
                get_data_from_selected_option(t_new_id);
            }
        }, 500, t_new_id);

    }
    else {
        // multiple selection

        let curr_icon = $("#type20_ddl_list li[value='" + t_val + "'] .item-icon i.fa-info-circle");
        if (curr_icon.length > 0) {
            $("#type20_ddl_list li[value='" + t_val + "'] .item-icon > i").removeClass("fa-info-circle").addClass("fa-check-square-o")
            $("#ddl_search_type20_" + t_new_id + " option[value='" + t_val + "']").attr('selected', 'selected');
        }
        else {
            $("#type20_ddl_list li[value='" + t_val + "'] .item-icon > i").removeClass("fa-check-square-o").addClass("fa-info-circle")
            $("#ddl_search_type20_" + t_new_id + " option[value='" + t_val + "']").removeAttr('selected');
        }

        let selected_count = $("#type20_ddl_list li .item-icon i.fa-check-square-o");
        if (selected_count.length > 0) {
            $("#ddl_search_type20_" + t_new_id + " option[value='0']").removeAttr('selected');
        }
        else {
            $("#ddl_search_type20_" + t_new_id + " option[value='0']").attr('selected', 'selected');
        }

        //$("#ddl_search_type20_" + t_new_id + " option").each(function () {
        //    var cell_id = $(this).attr('value1');
        //    if (t_val1 == cell_id) {
        //        $(this).attr('selected', 'selected');
        //    }
        //});

        //invoice single searchable value selection [FT - 07122023]
        var json_inv = $("#ddl_search_type20_" + t_new_id + "").attr('type22_array_index');
        var btn_add = inv_Calc_new_array[json_inv];
        var type22_json_len = $("#hdn_type22_json_len_" + btn_add + "").val();
        if (type22_json_len == 1) {
            invoice_type20_selected_text = ddl_txt;
            invoice_type20_selected_val = t_val1;
            type22_new_id = btn_add;
            return submit_popup_data(json_inv, btn_add, 'readchecksheet');
        }
    }
}

function close_type20_dropdown_popup() {
    myApp.closeModal(".popup-type20-dropdown");

    if (F7_device == 'android' || F7_device == 'ios') {
        //popup UI issue in iOS
        $(".popup-type20-dropdown").hide();
    }

    $("select[id^=ddl_search_type20_]").prop("disabled", true);
}

//////////////////////
var ddl_item_info = "false";
function get_ddl_info_type20(ddl_value1, ddl_val, ddl_new_id) {
    try {
        ddl_item_info = "true";
        get_data_to_fill_ul_New(ddl_value1, ddl_val, ddl_new_id);
    }
    catch (e) {
        alert1(e + '_get_ddl_info_type20');
    }
}

function open_popup_for_ddl_item_info(fieldArray) {
    try {
        myApp.popup('.popup-ddl_info');
        fieldArray = JSON.parse(fieldArray);
        var info_tbl_str = '<table style="width:100%;" border=1><tbody>';

        for (var i = 0; i < fieldArray.length; i++) {
            var key = fieldArray[i].fieldname;
            var value = fieldArray[i].value;
            info_tbl_str += '<tr><td style="width:40%;font-weight:bold;padding:2px;">' + key + ':</td><td style="width:60%;padding:2px;">' + value + '</td></tr>'
        }
        info_tbl_str += '</tbody></table>';
        $('#container_info_div').html(info_tbl_str);
    }
    catch (e) {
        alert1(e + '_open_popup_for_ddl_item_info');
    }
}

var ddl_listview = "false";
function open_popup_for_listview_type20() {
    try {
        ddl_listview = "true";

        myApp.popup('.popup-type20');
        $('#F7-popup_inner_div_type20').empty();

        var str = '<ul id="ul_search_' + new_id_G + '" listview_new_id = "' + new_id_G + '" style="width: 97% !important; margin-left: 4px; padding: 0;"></ul>';
        $('#F7-popup_inner_div_type20').append(str);

        OFFSET_TYPE20 = 0; // from where to start
        curr_type_G = "ddl_list_select";

        curr_btnSearch_Counter = new_id_G;
        get_all_searched_list(TableName_G, JoinTableName_G, Checksheet_id_G);
    }
    catch (e) {
        alert1(e + '_open_popup_for_listview_type20');
    }
}

function get_scanner_option(t_new_id, TableName, JoinTableName, Checksheet_id, customer_checksheetid, ddl_info_view, qr_code, barcode, autofill, add_cust_from_search) {
    try {
        ddl_search_type = "scanner";

        var clickedLink = $("#div_Search_" + t_new_id + " .form-div");
        myApp.popover('.popover-type25', clickedLink);

        if (qr_code == "true") {
            var param = "get_qr_and_search_data('" + t_new_id + "', '" + TableName + "', '" + JoinTableName + "','" + Checksheet_id + "');close_scanner_option_popup()";
        }
        else if (barcode == "true") {
            var param = "get_barcode_and_search_data('" + t_new_id + "', '" + TableName + "', '" + JoinTableName + "','" + Checksheet_id + "');close_scanner_option_popup()";
        }

        var param1 = "get_dropdown_data_edit_text('" + t_new_id + "', '" + TableName + "', '" + JoinTableName + "','" + Checksheet_id + "', '" + customer_checksheetid + "', '" + ddl_info_view + "', '" + autofill + "', '" + add_cust_from_search + "');close_scanner_option_popup()";

        $("#popover_scan_image").attr("onclick", param);
        $("#popover_edit_text").attr("onclick", param1);
    }
    catch (e) {
        alert1(e + '_get_scanner_option');
    }
}

function close_scanner_option_popup() {
    myApp.closeModal('.popover-type25');
}

function open_dropdown_popup_for_cust_search(curr_obj) {
    try {
        //open type20 dropdown popup on search btn click for new customer add from textbox + [20082021]        
        $(curr_obj).parents('.add-cust-outer').siblings('.type20-ddl-outer').trigger('click');
        $("#ddl_cust_creation").hide();               //hide + btn inside type20 dropdown
    }
    catch (e) {
        alert1(e + '_open_dropdown_popup_for_cust_search');
    }
}

// get duration by project template id 05012021
function get_nodes_by_template_id_from_searchable(t_template_id, t_new_id) {

    var Param_obj = [];
    Param_obj.push({
        "projecttemplate_Id": t_template_id
    });

    loading();
    var getdata = new Webservicecall_REST(global_wcf_url + 'TemplateAction', JSON.stringify(Param_obj), function (e) {
        var myArray = JSON.parse(e.responseText);
        var message = myArray[0].data;
        var status = myArray[0].status;
        if (status == 1) {
            message = JSON.parse(message);

            var curr_flow_id = JSON.parse(storage.getItem('wayflow'));
            var len = message.length;
            for (i = 0; i < len; i++) {
                var Flow_Id = message[i].Flow_Id;
                if (curr_flow_id == Flow_Id) {
                    var Duration = message[i].Duration;

                    var end_bracket = t_new_id.lastIndexOf("_");
                    var cal_id = t_new_id.substring(0, end_bracket);
                    $("#cal_" + cal_id + "_1001").attr("duration", Duration);

                    break;
                }
            }
        }
        else {
            mk_notify(message, "danger");
            loading_hide();
        }
    }, onfail);
    getdata.callOtherDomain();
}

create_listview_html_for_new_customer = (new_id_G) => {

    try {

        var Condition_Data_Str = $('#hdn_condition_data_' + new_id_G + '').val();
        var Condition_Data = itemObj._checkStrObj(decodeURIComponent(Condition_Data_Str));

        var value_new = Condition_Data[0].value_new;
        if (value_new == '' || value_new == null || value_new == undefined) {
            var col_type = Condition_Data[0].ColumName[0].type;
            if (col_type == 'Table') {
                var col_name = Condition_Data[0].ColumName[0].subdata[0].Column_Name;
            } else {
                var col_name = Condition_Data[0].ColumName[0].subdata[0].Header;
            }
            var push_data = Condition_Data[0].push_data;
            if (push_data == '' || push_data == null || push_data == undefined) {
                push_data = [];
            }
            var view_style = "dropdownview";
        }
        else {
            var push_data = value_new[0].push_data;
            var view_style = push_data[0].view_style;
            var col_name = value_new[0].Target_Value;
        }

        if (view_style == "listview") {
            let cust_json = temp_cust_json[0].Data;

            let checksheet_json = $('#hdn_filter_popover').attr("blank_checksheet");
            checksheet_json = JSON.parse(checksheet_json);

            let Data_Table_Json = merge_checksheet_template_n_log_form_json(checksheet_json, cust_json);

            var type20_listview_label = push_data[0].listview_label;
            if (type20_listview_label == "" || type20_listview_label == null || type20_listview_label == undefined) {
                type20_listview_label = "true";
            }

            var value_new = Condition_Data[0].value_new;
            if (value_new == '' || value_new == null || value_new == undefined) {
                var columndata_Array = Condition_Data[0].columndata;
            }
            else {
                var columndata_Array = value_new[0].columndata;
            }

            var listitem = '<table id="tbl_type20_listpopup" style="font-size:11pt;width:100%;white-space: initial; word-break: break-word;vertical-align:top;">';
            for (p = 0; p < columndata_Array.length; p++) {
                var row_qid = columndata_Array[p].qid;
                var row_header = columndata_Array[p].header;
                var row_format = columndata_Array[p].format;
                if (row_format == 'italic') {
                    var f_style = 'font-style';
                } else {
                    var f_style = 'text-decoration';
                }

                if (p % 2 == 0) {
                    var text_align = "text-align: left;"
                }
                else {
                    var text_align = "text-align: right;"
                }

                var qid_found = 0;
                for (j = 0; j < Data_Table_Json.length; j++) {
                    var curr_qid = Data_Table_Json[j].que_id;
                    if (curr_qid == row_qid) {
                        qid_found = 1;
                        break;
                    }
                }

                //var type20_listview_label = "false"
                if (type20_listview_label == "true") {
                    //listview with label
                    if (qid_found == 1) {
                        var field_name = Data_Table_Json[j].prop[0].name;
                        if (Data_Table_Json[j].type == "20") {
                            var Answer = Data_Table_Json[j].ans[0];
                        } else if (Data_Table_Json[j].type == "22") {
                            var Answer = "(Type22 ANS JSON)";
                        } else {
                            var Answer = Data_Table_Json[j].ans;
                        }
                        if (Data_Table_Json[j].type != "0" && Data_Table_Json[j].type != "5" && Data_Table_Json[j].type != "10") {
                            if (field_name.toLowerCase() == col_name.toLowerCase() || (Data_Table_Json[j].que_id == 1 && col_name.toLowerCase() == "customeruniq")) {
                                listitem += '<tr><td style="text-align: left; width: 45%;font-weight:bold; color:#000;' + f_style + ':' + row_format + ';" > ' + row_header
                                    + ':</td><td style="text-align: right; width: 45%;"><a style="font-weight:bold; text-decoration:underline; font-size:11pt">' + Answer + '</a></td></tr>';
                            } else {
                                // other columns
                                listitem += '<tr style="vertical-align: top;"><td style="text-align: left; width: 45%;font-weight:bold; color: #000;' + f_style + ':' + row_format + ';">' + row_header + ':</td><td style="text-align: right; width: 45%;">' + Answer + '</td></tr>';
                            }
                        }
                    } else {
                        // when qid is not found in json
                        listitem += '<tr><td style="text-align: left; width: 45%; font-weight:bold; color:#000" >' + row_header
                            + ':</td><td style="text-align: right; width: 45%;">N/A</td></tr>';
                    }
                }
                else {
                    //listview without label
                    if (p % 2 == 0) {
                        listitem += '<tr style="vertical-align: top;">';
                    }

                    if (qid_found == 1) {
                        var field_name = Data_Table_Json[j].prop[0].name;
                        if (Data_Table_Json[j].type == "20") {
                            var Answer = Data_Table_Json[j].ans[0];
                        } else if (Data_Table_Json[j].type == "22") {
                            var Answer = "(Type22 ANS JSON)";
                        } else {
                            var Answer = Data_Table_Json[j].ans;
                        }

                        if (Data_Table_Json[j].type != "0" && Data_Table_Json[j].type != "5" && Data_Table_Json[j].type != "10") {
                            if (field_name.toLowerCase() == col_name.toLowerCase() || (Data_Table_Json[j].que_id == 1 && col_name.toLowerCase() == "customeruniq")) {
                                // clickable column
                                // find and bind customer details to
                                // click-able cell
                                listitem += '<td style="' + text_align + ' width: 45%;"><a style="font-weight:bold; text-decoration:none; color: #000; font-size:11pt">' + Answer + '</a></td>';
                            } else {
                                // other columns
                                var param_ellipsis = "";
                                //var param_ellipsis = 'onclick=type20_read_more(this)';
                                listitem += "<td style='" + text_align + " width: 45%'><div " + param_ellipsis + " class='text_ellipsis'>" + Answer + "</div></td>";
                            }
                        }
                    } else {
                        // when qid is not found in json
                        listitem += '<td style="' + text_align + ' width: 45%;">N/A</td>';
                    }
                    if (p % 2 == 0) { }
                    else {
                        listitem += '</tr>';
                    }

                }
            }
            listitem += '</table>';

            $("#div_Search_" + new_id_G + "").find("#tbl_type20_listpopup").remove();
            $("#div_Search_" + new_id_G + "").append(listitem);
        }
    }
    catch (e) {
        alert(e + '_create_listview_html_for_new_customer()');
        loading_hide();
    }
}