
// This page is only for F7

var upload_pending_Array = [];

function get_list_of_task_for_compare_online1() {
    get_list_of_pm_sites_online();
}

function get_list_of_task_for_compare_online() {
    try {
        $("#txtsearch").val("");

        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var search_value = list_data[0].search;
        if (search_value == "true") {
            $('#btn_Search').show();
        }

        var selected_module_id = JSON.parse(storage.getItem('wayflow'));
        if (selected_module_id == 0) {
            alert1("Please select flow !")
        } else {
            var data_json = JSON.parse(storage.getItem('list_json'));
            var list_data = JSON.parse(data_json);
            var status_array = list_data[0].status;
            var query = "select server_task_id, millisecond, is_delete_photo, is_delete_log, is_delete_sub, is_valid_log from task_master where (flag=1 or flag=3) and moduleid = '" + selected_module_id + "' and username='"
                + username + "' and status != -1 and (status not in(" + status_array + ") or (is_delete_photo is not null and is_delete_photo != ''))";

            //alert1(query);
            var q_jsonobj = [];
            q_jsonobj.push({
                data: query,
                p: "1"
            });
            cordova.exec(onsuccess_get_list_of_task_for_compare_online, onfail_get_list_of_task_for_compare_online, 'SqlitePlugin', 'showValues', q_jsonobj);
        }
    } catch (e) {
        alert1(e + '_get_list_of_task_for_compare_online()');
    }
}

function onsuccess_get_list_of_task_for_compare_online(e) {
    try {
        var myArray = JSON.parse(e);
        upload_pending_Array = [];
        for (i = 0; i < myArray.length; i++) {
            var loc_server_task_id = myArray[i].server_task_id;
            var loc_mili = myArray[i].millisecond;
            var is_delete_photo = myArray[i].is_delete_photo;
            var is_delete_log = myArray[i].is_delete_log;
            var is_delete_sub = myArray[i].is_delete_sub;
            var is_valid_log = myArray[i].is_valid_log;
            //if (is_delete_photo == "Unknown" || is_delete_photo == null || is_delete_photo == undefined || is_delete_photo == "") {
            //    // if local task in upload pending then only compare with online task (without media delete)
            //    upload_pending_Array.push([loc_server_task_id, loc_mili]);
            //}
            upload_pending_Array.push([loc_server_task_id, loc_mili, is_delete_photo, is_delete_log, is_delete_sub, is_valid_log]);
        }

        var searchCol_obj = localStorage.getItem('searchCol_obj');

        // make blank filter in case of sub flow - mk - 08052025
        var flow_Array = JSON.parse(storage.getItem('flow_Array'));
        if (flow_Array.length > 1) {
            searchCol_obj = "";
        }

        if (searchCol_obj == "" || searchCol_obj == null || searchCol_obj == undefined) {
            // New logic for redirection from chart onclick - 31122024 PG
            let aggregate_val = JSON.parse(storage.getItem('av'));
            if (aggregate_val == '' || aggregate_val == null || aggregate_val == undefined) {
                // default listing
                get_list_of_pm_sites_online();
            }
            else {
                // Advance filter 
                var searchCol_obj = [];
                advance_column_search('btn_click', 'dashboard_fltr');    // Fill advance filter popup

                for (i = 0; i < aggregate_val.length; i++) {
                    var header = Object.keys(aggregate_val[i])[0];
                    var val = aggregate_val[i][header];

                    var equation = aggregate_val[i].Equation;
                    if (equation == '' || equation == null || equation == undefined) {
                        equation = 'IN';
                    }

                    var search_Array = [];
                    for (let v = 0; v < val.length; v++) {
                        let def_val = val[v];
                        search_Array.push(def_val);
                    }

                    let calendar_type;
                    if (equation == 'BETWEEN') {
                        calendar_type = 'is_between';
                    }
                    else {
                        calendar_type = '';
                    }

                    searchCol_obj.push({
                        "columnName": header,
                        "id": '',
                        "value": search_Array,
                        "Equation": equation,
                        "calendar_type": calendar_type
                    });
                }
                setTimeout(function () {
                    display_selected_filter_data_onchange_Post(searchCol_obj, 'true');
                }, 500);
            }
        }
        else {
            // new logic with forward backard - task clicked from filtered task listing 23012023


            // set order by dropdown as per columndata
            $("#ddl_OrderBy").empty();
            var orderby_str = '';
            orderby_str += '<option value="task_id">Task ID</option>';
            orderby_str += '<option value="assigndate">Assign Date</option>';
            orderby_str += '<option value="distance">Distance</option>';

            var data_json = JSON.parse(storage.getItem('list_json'));
            var list_data = JSON.parse(data_json);
            var columndata_Array = list_data[0].columndata;
            for (k = 0; k < columndata_Array.length; k++) {
                var header = columndata_Array[k].header;

                // order by
                var coldata_obj = columndata_Array[k];
                coldata_obj = JSON.stringify(coldata_obj);
                coldata_obj = encodeURIComponent(coldata_obj);
                var ctrl_type = columndata_Array[k].ctrl_type;
                var system_var = columndata_Array[k].system_var;
                if (system_var == "Status_Name") {
                    var value_Array = columndata_Array[k].value;
                    if (value_Array == "" || value_Array == null || value_Array == undefined) {
                        value_Array = [];
                    }
                }
                if (ctrl_type != 22) {
                    orderby_str += '<option value="' + header + '" name="' + coldata_obj + '">' + header + '</option>';
                }
            }
            $("#ddl_OrderBy").append(orderby_str);

            ddl_orderby = list_data[0].orderby;
            ddl_order_type = list_data[0].order_type;

            $("#ddl_OrderBy").val(ddl_orderby);
            $('#ddl_OrderType').val(ddl_order_type);

            $("#lbl_filter_name").html('<i class="fa fa-filter" style="color:#fff;"></i> Save Filter?');
            var param_save = "open_popup_for_saved_filter_name()";
            $("#lbl_filter_name").attr('onclick', param_save);

            advance_column_search("btn_click");
            //searchCol_obj = JSON.parse(searchCol_obj);
            //display_selected_filter_data_onchange_Post(searchCol_obj, "false");

            //get_list_of_pm_sites_by_search_online(adv_search_obj, "");
        }
    } catch (e) {
        alert1(e + '_onsuccess_get_list_of_task_for_compare_online()')
    }
}

function onfail_get_list_of_task_for_compare_online() {
    alert1(e + '_get_list_of_task_for_compare_online()');
}

// Get list of pm sites without checking user distance
var ddl_orderby, ddl_order_type;
function get_list_of_pm_sites_online() {
    try {
        disable_back_button();
        $("#txtsearch").val("");
        $("#tab1").unbind('scroll');
        $("#tasklist_loader").hide();
        $("#btn_Create_Task").hide();
        $("#lbl_filter_name").empty();

        var selected_module_id = JSON.parse(storage.getItem('wayflow'));
        if (selected_module_id == 0) {
            alert1("Please select flow !")
        } else {
            var data_json = JSON.parse(storage.getItem('list_json'));
            var list_data = JSON.parse(data_json);

            //commented on 12042024, removed filter checksheet from task listing as we are using new advanced filter
            //var checksheet_id = list_data[0].checksheet_id;                                               
            //if (checksheet_id == '' || checksheet_id == null || checksheet_id == undefined) { }
            //else {
            //    $("#div_tab_bar").css("width", "90%");
            //    $("#op_filter").show();
            //}

            var Condition_Data = list_data[0].condition;
            var status_array = list_data[0].status;
            var orderby = list_data[0].orderby;
            var multiflow_list = list_data[0].multiflow_list;
            var include_parent_task = list_data[0].include_parent_task;

            var flow_Array = JSON.parse(storage.getItem('flow_Array'));
            if (flow_Array.length == 1) {
                var p_server_task_id = 0;
                $("#btn_advanced_search").show();
                $(".advancedSearch-list").show();
            }
            else {
                if (flow_Array.length > 2) {
                    ///for  3 layer subtask listing issue [FT-16052025]
                    var p_server_task_id = flow_Array[flow_Array.length - 2].server_task_id;
                }
                else {
                    var p_server_task_id = JSON.parse(storage.getItem('p_server_task_id'));
                }

                //hide filter btn for subtask listing [08112023]-DV
                $("#btn_advanced_search").hide();
                $(".advancedSearch-list").hide();
            }

            if (include_parent_task == "false") {                           //-------------for urbanJungle(23122019)----////
                p_server_task_id = "0";
            }

            var company_id = JSON.parse(storage.getItem('company_id'));
            if (global_wcf_url == "https://securitywcf.easyform.in/EF_Service.svc/v1/") { }
            else {
                Condition_Data = [];
            }

            // var New_Condition_Data;
            if (Condition_Data == '' || Condition_Data == null || Condition_Data == undefined) {
                //alert1("Please add condition from portal first for this flow!");

                // after removing condition json
                var Push_array = list_data[0].Push_array;
                if (Push_array == "" || Push_array == null || Push_array == undefined) {
                    var t_push_data = "";
                }
                else {
                    var t_push_data = [];
                    t_push_data.push({
                        'push_array': Push_array
                    });
                }

                var qs_array = pass_required_values_to_push_array(JSON.stringify(t_push_data));
                var t_push_array = JSON.parse(qs_array[0]);
                var ref_valid = qs_array[1];

            }
            else {
                var ref_valid = 0;
                var t_push_array = [];

                // check and set system variable to condition
                Condition_Data = pass_required_values_to_condition(Condition_Data);

                var user_id = JSON.parse(storage.getItem('user_id'));

                if (multiflow_list == '' || multiflow_list == null || multiflow_list == undefined) {
                    multiflow_list = []

                    var status_condition = [];
                    status_condition.push({
                        "Table_Name": "TASK_MASTER",
                        "Column_Name": "STATUS",
                        "Equation": "IN",
                        "Value_1": status_array.toString(),
                        "Value_2": "",
                        "Type": "INT"
                    });

                    var flowid_condition = [];
                    flowid_condition.push({
                        "Table_Name": "TASK_MASTER",
                        "Column_Name": "FLOW_ID",
                        "Equation": "EQUAL TO",
                        "Value_1": selected_module_id,
                        "Value_2": "",
                        "Type": "INT"
                    });
                }
                else {
                    var status_condition = [];
                    var flowid_condition = [];
                    for (m = 0; m < multiflow_list.length; m++) {
                        var mf_flow_id = multiflow_list[m].flow_id;
                        var mf_status = multiflow_list[m].status;

                        var table_Array = [];
                        table_Array.push({
                            "Table_Name": "TASK_MASTER",
                            "Column_Name": "FLOW_ID",
                            "Equation": "EQUAL TO",
                            "Value_1": mf_flow_id,
                            "Value_2": "",
                            "Type": "INT"
                        });

                        table_Array.push({
                            "Table_Name": "TASK_MASTER",
                            "Column_Name": "STATUS",
                            "Equation": "IN",
                            "Value_1": mf_status.toString(),
                            "Value_2": "",
                            "Type": "INT"
                        });

                        var table_obj = [{ "table": table_Array }];
                        var and_obj = { "and": table_obj };
                        Condition_Data[0].where[0].or.push(and_obj);
                    }

                    // add customer obj on customer select and online task listing
                    //var cust_name = JSON.parse(storage.getItem('type20_cust_name'));
                    //if (cust_name == '' || cust_name == null || cust_name == undefined || cust_name == "undefined") {
                    //    var online_task_details = JSON.parse(storage.getItem('online_task_details'));
                    //    cust_name = online_task_details[0].site_name;
                    //}
                    //var search_condition = [];
                    //search_condition.push({
                    //    "Table_Name": "CUSTOMER_MASTER",
                    //    "Column_Name": "CUSTOMERUNIQ",
                    //    "Equation": "LIKE",
                    //    "Value_1": cust_name,
                    //    "Value_2": "",
                    //    "Type": "STRING"
                    //});

                    //search_condition.push({
                    //    "Table_Name": "CUSTOMER_MASTER",
                    //    "Column_Name": "CUSTOMERNAME",
                    //    "Equation": "LIKE",
                    //    "Value_1": cust_name,
                    //    "Value_2": "",
                    //    "Type": "STRING"
                    //});


                }

                //alert1("Before: " + JSON.stringify(Condition_Data));
                if (orderby == "distance") {
                    var order_by = Condition_Data[0].order_by;
                    if (order_by == undefined) {
                        Condition_Data[0].ORDER_BY[0].DATA[0].USER_LAT = user_lat;
                        Condition_Data[0].ORDER_BY[0].DATA[0].USER_LONG = user_long;
                    } else {
                        Condition_Data[0].order_by[0].data[0].user_lat = user_lat;
                        Condition_Data[0].order_by[0].data[0].user_long = user_long;
                    }
                }

                if (flow_Array.length == 1) { }
                else {
                    var parent_task_condition = [];
                    parent_task_condition.push({
                        "Table_Name": "TASK_MASTER",
                        "Column_Name": "Parent_Task_Id",
                        "Equation": "EQUAL TO",
                        "Value_1": p_server_task_id,
                        "Value_2": "",
                        "Type": "INT"
                    });
                }

                var where1 = Condition_Data[0].Where;
                var where2 = Condition_Data[0].where;
                var where3 = Condition_Data[0].WHERE;
                if (where1 == undefined && where2 == undefined) {
                    Condition_Data[0].WHERE[0].AND[0].TABLE.push(status_condition[0]);
                    Condition_Data[0].WHERE[0].AND[0].TABLE.push(flowid_condition[0]);
                    if (flow_Array.length == 1) { } else {
                        Condition_Data[0].WHERE[0].AND[0].TABLE.push(parent_task_condition[0]);
                    }

                    //if (multiflow_list == '' || multiflow_list == null || multiflow_list == undefined) {
                    //    //Condition_Data[0].where[0].or[0].table.push(search_condition[0]);
                    //    //Condition_Data[0].where[0].or[0].table.push(search_condition[1]);
                    //}
                    //else {
                    //    var table_obj = [{ "table": search_condition }];
                    //    var and_obj = { "or": table_obj };
                    //    Condition_Data[0].where[0].and.push(and_obj);
                    //}

                    Condition_Data[0].STATIC_JOINS = user_id;
                    Condition_Data[0].LIMIT[0].OFFSET = limit_range - default_range;
                    //Condition_Data[0].LIMIT[0].OFFSET = 0;
                    Condition_Data[0].LIMIT[0].FETCH = increment_range;
                } else if (where2 == undefined && where3 == undefined) {
                    Condition_Data[0].Where[0].And[0].Table.push(status_condition[0]);
                    Condition_Data[0].Where[0].And[0].Table.push(flowid_condition[0]);
                    if (flow_Array.length == 1) { } else {
                        Condition_Data[0].Where[0].And[0].Table.push(parent_task_condition[0]);
                    }

                    //if (multiflow_list == '' || multiflow_list == null || multiflow_list == undefined) {
                    //    //Condition_Data[0].where[0].or[0].table.push(search_condition[0]);
                    //    //Condition_Data[0].where[0].or[0].table.push(search_condition[1]);
                    //}
                    //else {
                    //    var table_obj = [{ "table": search_condition }];
                    //    var and_obj = { "or": table_obj };
                    //    Condition_Data[0].where[0].and.push(and_obj);
                    //}

                    Condition_Data[0].Static_Joins = user_id;
                    Condition_Data[0].LIMIT[0].OFFSET = limit_range - default_range;
                    //Condition_Data[0].LIMIT[0].OFFSET = 0;
                    Condition_Data[0].LIMIT[0].FETCH = increment_range;
                } else {
                    Condition_Data[0].where[0].and[0].table.push(status_condition[0]);
                    Condition_Data[0].where[0].and[0].table.push(flowid_condition[0]);
                    if (flow_Array.length == 1) { } else {
                        Condition_Data[0].where[0].and[0].table.push(parent_task_condition[0]);
                    }

                    //if (multiflow_list == '' || multiflow_list == null || multiflow_list == undefined) {

                    //    // need to check this logic for vision infosys
                    //    //Condition_Data[0].where[0].or[0].table.push(search_condition[0]);
                    //    //Condition_Data[0].where[0].or[0].table.push(search_condition[1]);
                    //}
                    //else {
                    //    var table_obj = [{ "table": search_condition }];
                    //    var and_obj = { "or": table_obj };
                    //    Condition_Data[0].where[0].and.push(and_obj);
                    //}

                    Condition_Data[0].static_joins = user_id;
                    Condition_Data[0].limit[0].offset = limit_range - default_range;
                    //Condition_Data[0].limit[0].offset = 0;
                    Condition_Data[0].limit[0].fetch = increment_range;
                }

                //alert1(JSON.stringify(Condition_Data));

            }

            if (ref_valid > 0) { }
            else {
                var searchCol_obj = [];

                var udf_id = JSON.parse(storage.getItem('udf_id'));
                var tab_index = JSON.parse(storage.getItem('tab_index'));

                // set order by dropdown as per columndata
                $("#ddl_OrderBy").empty();
                var orderby_str = '';
                orderby_str += '<option value="task_id">Task ID</option>';
                orderby_str += '<option value="assigndate">Assign Date</option>';
                orderby_str += '<option value="distance">Distance</option>';

                var customer_column_found = 0;
                var columndata_Array = list_data[0].columndata;
                for (k = 0; k < columndata_Array.length; k++) {
                    var header = columndata_Array[k].header;

                    var checksheet_type = columndata_Array[k].checksheet_type;
                    if (checksheet_type == 3) {
                        customer_column_found = 1;
                    }

                    // order by
                    var coldata_obj = columndata_Array[k];
                    coldata_obj = JSON.stringify(coldata_obj);
                    coldata_obj = encodeURIComponent(coldata_obj);
                    var ctrl_type = columndata_Array[k].ctrl_type;
                    var system_var = columndata_Array[k].system_var;
                    if (system_var == "Status_Name") {
                        var value_Array = columndata_Array[k].value;
                        if (value_Array == "" || value_Array == null || value_Array == undefined) {
                            value_Array = [];
                        }
                    }
                    if (ctrl_type != 22) {
                        orderby_str += '<option value="' + header + '" name="' + coldata_obj + '">' + header + '</option>';
                    }
                }
                $("#ddl_OrderBy").append(orderby_str);

                ddl_orderby = list_data[0].orderby;
                ddl_order_type = list_data[0].order_type;

                //$("#ddl_OrderBy").val(ddl_orderby);
                $('#ddl_OrderType').val(ddl_order_type);

                // remove order by distance option in case of no customer column found in columndata 07122022
                if (customer_column_found == 0) {
                    $("#ddl_OrderBy option[value='distance']").remove();
                }

                var list_order_by = list_data[0].orderby;
                var list_order_type = list_data[0].order_type;

                // order by array key check   02022023
                var order_by_array = list_data[0].order_by_array;
                if (order_by_array == "" || order_by_array == null || order_by_array == undefined) {
                    var order_by_obj = [];
                    order_by_obj.push({
                        "checksheet_type": 0,
                        "checksheet_id": 0,
                        "que_id": 0,
                        "data_type": "ValueString",
                        "order_by": list_order_by,
                        "order_type": list_order_type
                    });
                }
                else {
                    var order_by_obj = order_by_array;
                }
                last_obj_search = JSON.stringify(order_by_obj);



                var order_by_val = "";
                if (order_by_array == null || order_by_array == '' || order_by_array == undefined) {
                    order_by_val = list_data[0].orderby;
                }
                else {
                    for (var a = 0; a < order_by_array.length; a++) {
                        order_by_val = order_by_array[a].column_name;

                        var order_by_chktype = order_by_array[a].checksheet_type;
                        if (order_by_chktype == null || order_by_chktype == '' || order_by_chktype == undefined) {
                            order_by_array[a].checksheet_type = "0";
                        }

                        if (order_by_val == null || order_by_val == '' || order_by_val == undefined) {
                            order_by_val = order_by_array[a].order_by;
                        }

                        // set sysvar in column name DV-29022024
                        var columndata_Array = list_data[0].columndata;
                        for (k = 0; k < columndata_Array.length; k++) {
                            var header = columndata_Array[k].header;

                            if (header == order_by_val) {
                                var col_system_var = columndata_Array[k].system_var
                                if (col_system_var == "" || col_system_var == null || col_system_var == undefined) { }
                                else {
                                    order_by_array[a].column_name = col_system_var;
                                    break;
                                }
                            }

                        }
                    }
                }
                $("#ddl_OrderBy").val(order_by_val);

                // check and add default filter by object 
                var columndata_Array = list_data[0].columndata;
                for (k = 0; k < columndata_Array.length; k++) {
                    var header = columndata_Array[k].header;
                    var ctrl_type = columndata_Array[k].ctrl_type;
                    var default_listing_filter_by = columndata_Array[k].default_listing_filter_by;
                    let def_fltr_start_val = columndata_Array[k].def_fltr_start_val;
                    let def_fltr_end_val = columndata_Array[k].def_fltr_end_val;
                    if (default_listing_filter_by == "" || default_listing_filter_by == null || default_listing_filter_by == undefined || default_listing_filter_by == "0") { }
                    else {
                        searchCol_obj = get_default_param(default_listing_filter_by, def_fltr_start_val, def_fltr_end_val, header, searchCol_obj, ctrl_type)
                    }
                }

                loading();
                var param_obj = [];
                param_obj.push({
                    'Flow_Id': selected_module_id,
                    'lat': user_lat,
                    'long': user_long,
                    'search': "",
                    'limit': limit_range,
                    'condition': Condition_Data,
                    'system_var': t_push_array,
                    'searchValue': '',
                    'searchParticularColumn': searchCol_obj,
                    'offset': limit_range - default_range,
                    'fetch': increment_range,
                    'status': status_array,
                    'udf_id': udf_id,
                    'tab_index': tab_index,
                    'Parent_Task_Id': p_server_task_id,
                    'order_by': order_by_obj
                });
                //alert1(JSON.stringify(param_obj));

                var appversion = JSON.parse(storage.getItem('appversion'));
                var auth = [];
                auth.push({
                    "username": username,
                    "devicetype": F7_device,
                    "appid": "",
                    "u_c": uniqcode,
                    "appversion": appversion
                });

                var task_listing_url = list_data[0].task_listing_url;
                if (task_listing_url == "" || task_listing_url == null || task_listing_url == undefined) {
                    var getdata = new Webservicecall_REST(global_wcf_url + 'OnlineTaskListing', JSON.stringify(param_obj), onsuccess_get_list_of_pm_sites_online, onfail_get_list_of_pm_sites_online);
                    getdata.callOtherDomain();
                }
                else {
                    var getdata = new Webservicecall_REST(global_wcf_url + task_listing_url, JSON.stringify(param_obj), onsuccess_get_list_of_pm_sites_online, onfail_get_list_of_pm_sites_online);
                    getdata.callOtherDomain();
                }
            }
        }
    } catch (e) {
        alert1(e + '_get_list_of_pm_sites_online()');
        loading_hide();
    }
}

// fresh advanced search filter
function get_list_of_pm_sites_by_search_online_filter() {
    limit_range = default_range; // set default range limit
    if (subflow_udf_id == '' || subflow_udf_id == null || subflow_udf_id == undefined) {
        glob_task_list_flag = "filter";
        get_list_of_pm_sites_by_search_online();

    }
    else {
        let t_new_id = curr_type37_new_id;
        let sub_flow_id = localStorage.getItem('redirect_flow_id');
        get_sub_task_listing_by_search_online(t_new_id, subflow_udf_id, sub_flow_id);
    }
}

// Get list of pm sites by search
function get_list_of_pm_sites_by_search_online(t_adv_search_obj, t_saved_filter_name) {
    // alert1("Getting site list by search...");
    try {
        let type37_len = $("div[id^='div_subtask_']").length;
        if (type37_len == 0) {
            disable_back_button();
        }

        $("#btn_Clear_Filter").hide();

        var search_keyword = $("#txtsearch").val();

        var selected_module_id = JSON.parse(storage.getItem('wayflow'));
        if (selected_module_id == 0) {
            alert1("Please select flow !")
        }
        else {

            $("#tab1").unbind('scroll');

            var data_json = JSON.parse(storage.getItem('list_json'));
            var list_data = JSON.parse(data_json);
            var Condition_Data = list_data[0].condition;
            var status_array = list_data[0].status;
            var orderby = list_data[0].orderby;
            var multiflow_list = list_data[0].multiflow_list;
            var include_parent_task = list_data[0].include_parent_task;

            var udf_id = JSON.parse(storage.getItem('udf_id'));
            var user_id = JSON.parse(storage.getItem('user_id'));

            var flow_Array = JSON.parse(storage.getItem('flow_Array'));
            if (flow_Array.length == 1) {
                var p_server_task_id = 0;
            }
            else {
                var p_server_task_id = JSON.parse(storage.getItem('p_server_task_id'));
            }

            if (include_parent_task == "false") {                           //-------------for urbanJungle(23122019)----////
                p_server_task_id = "0";
            }

            var company_id = JSON.parse(storage.getItem('company_id'));
            if (global_wcf_url == "https://securitywcf.easyform.in/EF_Service.svc/v1/") { }
            else {
                Condition_Data = [];
            }

            // var New_Condition_Data;
            if (Condition_Data == '' || Condition_Data == null || Condition_Data == undefined) {
                //alert1("Please add condition from portal first for this flow!");


                // after removing condition json
                var Push_array = list_data[0].Push_array;
                if (Push_array == "" || Push_array == null || Push_array == undefined) {
                    var t_push_data = "";
                }
                else {
                    var t_push_data = [];
                    t_push_data.push({
                        'push_array': Push_array
                    });
                }

                var qs_array = pass_required_values_to_push_array(JSON.stringify(t_push_data));
                var t_push_array = JSON.parse(qs_array[0]);
                var ref_valid = qs_array[1];
            }
            else {
                var ref_valid = 0;
                var t_push_array = [];

                // check and set system variable to condition
                Condition_Data = pass_required_values_to_condition(Condition_Data);

                if (multiflow_list == '' || multiflow_list == null || multiflow_list == undefined) {
                    multiflow_list = []

                    var status_condition = [];
                    status_condition.push({
                        "Table_Name": "TASK_MASTER",
                        "Column_Name": "STATUS",
                        "Equation": "IN",
                        "Value_1": status_array.toString(),
                        "Value_2": "",
                        "Type": "INT"
                    });

                    var flowid_condition = [];
                    flowid_condition.push({
                        "Table_Name": "TASK_MASTER",
                        "Column_Name": "FLOW_ID",
                        "Equation": "EQUAL TO",
                        "Value_1": selected_module_id,
                        "Value_2": "",
                        "Type": "INT"
                    });
                }
                else {
                    var status_condition = [];
                    var flowid_condition = [];
                    for (m = 0; m < multiflow_list.length; m++) {
                        var mf_flow_id = multiflow_list[m].flow_id;
                        var mf_status = multiflow_list[m].status;

                        var table_Array = [];
                        table_Array.push({
                            "Table_Name": "TASK_MASTER",
                            "Column_Name": "FLOW_ID",
                            "Equation": "EQUAL TO",
                            "Value_1": mf_flow_id,
                            "Value_2": "",
                            "Type": "INT"
                        });

                        table_Array.push({
                            "Table_Name": "TASK_MASTER",
                            "Column_Name": "STATUS",
                            "Equation": "IN",
                            "Value_1": mf_status.toString(),
                            "Value_2": "",
                            "Type": "INT"
                        });

                        var table_obj = [{ "table": table_Array }];
                        var and_obj = { "and": table_obj };
                        Condition_Data[0].where[0].or.push(and_obj);
                    }
                }

                var search_condition = [];
                search_condition.push({
                    "Table_Name": "CUSTOMER_MASTER",
                    "Column_Name": "CUSTOMERUNIQ",
                    "Equation": "LIKE",
                    "Value_1": search_keyword,
                    "Value_2": "",
                    "Type": "STRING"
                });

                search_condition.push({
                    "Table_Name": "CUSTOMER_MASTER",
                    "Column_Name": "CUSTOMERNAME",
                    "Equation": "LIKE",
                    "Value_1": search_keyword,
                    "Value_2": "",
                    "Type": "STRING"
                });

                search_condition.push({
                    "Table_Name": "TASK_MASTER",
                    "Column_Name": "TASK_ID",
                    "Equation": "LIKE",
                    "Value_1": search_keyword,
                    "Value_2": "",
                    "Type": "STRING"
                });

                /// custom development for ATC customer sub search 07062019
                if (udf_id == 1944) {
                    search_condition.push({
                        "Table_Name": "CUSTOMER_SUB_MASTER",
                        "Column_Name": "VALUESTRING",
                        "Equation": "LIKE",
                        "Value_1": search_keyword,
                        "Value_2": "",
                        "Type": "STRING"
                    });

                    var search_sub_condition = [];
                    search_sub_condition.push({
                        "Checksheet_Type": "3",
                        "Checksheet_Id": 1299,
                        "Task_Id": "",
                        "Ques_Id": "43",
                        "Header": "CIRCLE",
                        "Equation": "LIKE",
                        "Value_1": search_keyword,
                        "Value_2": "",
                        "Type": "string",
                        "Name_or_Id": "name",
                        "In_or_Out": "in",
                        "Static_Or_Filter": "2",
                        "Temp_checksheet_id": 1299,
                        "Temp_counter": 1,
                        "Temp_flow": "CIRCLE",
                        "Temp_ch_name": "Customer Checksheet",
                        "Table_Name": "Customer_Sub_Master",
                        "Temp_ch_Json": [
                            {
                                "Checksheet_type_id": 3,
                                "Company_id": "157",
                                "Checksheet_id": 1299
                            }
                        ],
                        "Temp_flow_Json": {
                            "Checksheet_Type": "3",
                            "Checksheet_Id": "1299",
                            "Task_Id": "",
                            "Ques_Id": "43",
                            "Header": "CIRCLE",
                            "Equation": "",
                            "Value_1": "",
                            "Value_2": "",
                            "Type": "string"
                        }
                    });
                }
                /////

                // alert1("Before: " + JSON.stringify(Condition_Data));

                if (orderby == "distance") {
                    var order_by = Condition_Data[0].order_by;
                    if (order_by == undefined) {
                        Condition_Data[0].ORDER_BY[0].DATA[0].USER_LAT = user_lat;
                        Condition_Data[0].ORDER_BY[0].DATA[0].USER_LONG = user_long;
                    } else {
                        Condition_Data[0].order_by[0].data[0].user_lat = user_lat;
                        Condition_Data[0].order_by[0].data[0].user_long = user_long;
                    }
                }

                if (flow_Array.length == 1) { } else {
                    var parent_task_condition = [];
                    parent_task_condition.push({
                        "Table_Name": "TASK_MASTER",
                        "Column_Name": "Parent_Task_Id",
                        "Equation": "EQUAL TO",
                        "Value_1": p_server_task_id,
                        "Value_2": "",
                        "Type": "INT"
                    });
                }

                var where1 = Condition_Data[0].Where;
                var where2 = Condition_Data[0].where;
                var where3 = Condition_Data[0].WHERE;
                if (where1 == undefined && where2 == undefined) {
                    Condition_Data[0].WHERE[0].AND[0].TABLE.push(status_condition[0]);
                    Condition_Data[0].WHERE[0].AND[0].TABLE.push(flowid_condition[0]);
                    if (flow_Array.length == 1) { } else {
                        Condition_Data[0].WHERE[0].AND[0].TABLE.push(parent_task_condition[0]);
                    }

                    if (multiflow_list == '' || multiflow_list == null || multiflow_list == undefined) {
                        //Condition_Data[0].WHERE[0].OR[0].TABLE.push(search_condition[0]);
                        //Condition_Data[0].WHERE[0].OR[0].TABLE.push(search_condition[1]);
                        //Condition_Data[0].WHERE[0].OR[0].TABLE.push(search_condition[2]);

                        //changes for SRJNA(04092019)
                        var table_obj = [{ "TABLE": search_condition }];
                        var and_obj = { "OR": table_obj };
                        Condition_Data[0].WHERE[0].AND.push(and_obj);
                    }
                    else {
                        var table_obj = [{ "TABLE": search_condition }];
                        var and_obj = { "OR": table_obj };
                        Condition_Data[0].WHERE[0].AND.push(and_obj);
                    }

                    Condition_Data[0].STATIC_JOINS = user_id;
                    Condition_Data[0].LIMIT[0].OFFSET = limit_range - default_range;
                    //Condition_Data[0].LIMIT[0].OFFSET = 0;
                    Condition_Data[0].LIMIT[0].FETCH = increment_range;
                } else if (where2 == undefined && where3 == undefined) {
                    Condition_Data[0].Where[0].And[0].Table.push(status_condition[0]);
                    Condition_Data[0].Where[0].And[0].Table.push(flowid_condition[0]);
                    if (flow_Array.length == 1) { } else {
                        Condition_Data[0].Where[0].And[0].Table.push(parent_task_condition[0]);
                    }

                    if (multiflow_list == '' || multiflow_list == null || multiflow_list == undefined) {
                        //Condition_Data[0].Where[0].Or[0].Table.push(search_condition[0]);
                        //Condition_Data[0].Where[0].Or[0].Table.push(search_condition[1]);
                        //Condition_Data[0].Where[0].Or[0].Table.push(search_condition[2]);

                        //changes for SRJNA(04092019)
                        var table_obj = [{ "Table": search_condition }];
                        var and_obj = { "Or": table_obj };
                        Condition_Data[0].Where[0].And.push(and_obj);
                    }
                    else {
                        var table_obj = [{ "Table": search_condition }];
                        var and_obj = { "Or": table_obj };
                        Condition_Data[0].Where[0].And.push(and_obj);
                    }

                    Condition_Data[0].Static_Joins = user_id;
                    Condition_Data[0].LIMIT[0].OFFSET = limit_range - default_range;
                    //Condition_Data[0].LIMIT[0].OFFSET = 0;
                    Condition_Data[0].LIMIT[0].FETCH = increment_range;
                } else {
                    Condition_Data[0].where[0].and[0].table.push(status_condition[0]);
                    Condition_Data[0].where[0].and[0].table.push(flowid_condition[0]);
                    if (flow_Array.length == 1) { } else {
                        Condition_Data[0].where[0].and[0].table.push(parent_task_condition[0]);
                    }

                    if (multiflow_list == '' || multiflow_list == null || multiflow_list == undefined) {
                        //Condition_Data[0].where[0].or[0].table.push(search_condition[0]);
                        //Condition_Data[0].where[0].or[0].table.push(search_condition[1]);
                        //Condition_Data[0].where[0].or[0].table.push(search_condition[2]);

                        //changes for SRJNA(04092019)
                        var table_obj = [{ "table": search_condition }];
                        var and_obj = { "or": table_obj };
                        Condition_Data[0].where[0].and.push(and_obj);
                    }
                    else {
                        var table_obj = [{ "table": search_condition }];
                        var and_obj = { "or": table_obj };
                        Condition_Data[0].where[0].and.push(and_obj);


                        /// custom development ATC customer sub search 07062019
                        if (udf_id == 1944) {
                            Condition_Data[0].where[0].and[0].json.push(search_sub_condition[0]);
                        }



                    }

                    Condition_Data[0].static_joins = user_id;
                    Condition_Data[0].limit[0].offset = limit_range - default_range;
                    //Condition_Data[0].limit[0].offset = 0;
                    Condition_Data[0].limit[0].fetch = increment_range;
                }
                // alert1("After: " + JSON.stringify(Condition_Data));
            }

            var search_popup_len = $(".popup-advance-search-online.modal-in").length;
            if (search_popup_len > 0) {
                //myApp.closeModal('.popup-advance-search-online');
                //$("#site_list").empty();

                if (t_adv_search_obj == "" || t_adv_search_obj == null || t_adv_search_obj == undefined) {
                    search_keyword = '';
                    var searchCol_obj = get_column_seach_obj();

                    if (searchCol_obj == "" || searchCol_obj == null || searchCol_obj == undefined) {
                        // checkbox tick button search string is blank
                        searchCol_obj = [];
                        return false;
                    }

                    $("#lbl_filter_name").empty();
                    if (t_saved_filter_name == "clear_filter") {
                        // filter with forward backward 23012023
                        limit_range = default_range; // set default range limit
                        localStorage.setItem('searchCol_obj', "");
                    }
                    else {
                        $("#lbl_filter_name").html('<i class="fa fa-filter" style="color:#fff;"></i> Save Filter?');
                        var param_save = "open_popup_for_saved_filter_name()";
                        $("#lbl_filter_name").attr('onclick', param_save);
                        localStorage.setItem('searchCol_obj', JSON.stringify(searchCol_obj));
                        $("#btn_Clear_Filter").show();
                    }
                }
                else {
                    //edit filter for advance search
                    var searchCol_obj = [];
                    //searchCol_obj.push(t_adv_search_obj);    // Commented for multiple search 09012025 PG
                    searchCol_obj = t_adv_search_obj;

                    if (t_saved_filter_name == "" || t_saved_filter_name == null || t_saved_filter_name == undefined) {
                        // filter with forward backward 23012023
                        $("#lbl_filter_name").html('<i class="fa fa-filter" style="color:#fff;"></i> Save Filter?');
                        var param_save = "open_popup_for_saved_filter_name()";
                        $("#lbl_filter_name").attr('onclick', param_save);
                        $("#btn_Clear_Filter").show();
                    }
                    else {
                        $("#lbl_filter_name").empty();
                        $("#lbl_filter_name").html('<i class="fa fa-filter" style="color:#fff;"></i> ' + t_saved_filter_name);
                        $("#lbl_filter_name").attr('onclick', '');

                        // select saved filter
                        $("#btn_Clear_Filter").show();
                    }
                }

                myApp.closeModal('.popup-advance-search-online');
                $('.popup-advance-search-online').hide();
                $("#site_list").empty();
            }
            else {
                if (t_saved_filter_name == "clear_filter") {
                    // clear filter via floating red button in task listing
                    limit_range = default_range; // set default range limit
                    localStorage.setItem('searchCol_obj', "");
                    var searchCol_obj = [];
                    $("#lbl_filter_name").empty();

                    myApp.closeModal('.popup-advance-search-online');
                    $('.popup-advance-search-online').hide();
                    $("#site_list").empty();
                }
            }


            if (ref_valid > 0) { }
            else {
                var tab_index = JSON.parse(storage.getItem('tab_index'));

                if (t_saved_filter_name == "clear_filter") {
                    var list_order_by = list_data[0].orderby;
                    var list_order_type = list_data[0].order_type;

                    // order by array key check   02022023
                    var order_by_array = list_data[0].order_by_array;
                    if (order_by_array == "" || order_by_array == null || order_by_array == undefined) {
                        var order_by_obj = [];
                        order_by_obj.push({
                            "checksheet_type": 0,
                            "checksheet_id": 0,
                            "que_id": 0,
                            "data_type": "ValueString",
                            "order_by": list_order_by,
                            "order_type": list_order_type
                        });
                    }
                    else {
                        var order_by_obj = order_by_array;
                    }
                }
                else {
                    var order_by_obj = mk_get_order_by_obj("#ddl_OrderBy", "#ddl_OrderType");
                }

                // check and add default filter by object 
                var columndata_Array = list_data[0].columndata;
                for (k = 0; k < columndata_Array.length; k++) {
                    var header = columndata_Array[k].header;
                    var ctrl_type = columndata_Array[k].ctrl_type;
                    var default_listing_filter_by = columndata_Array[k].default_listing_filter_by;
                    let def_fltr_start_val = columndata_Array[k].def_fltr_start_val;
                    let def_fltr_end_val = columndata_Array[k].def_fltr_end_val;
                    if (default_listing_filter_by == "" || default_listing_filter_by == null || default_listing_filter_by == undefined || default_listing_filter_by == "0") { }
                    else {
                        searchCol_obj = get_default_param(default_listing_filter_by, def_fltr_start_val, def_fltr_end_val, header, searchCol_obj, ctrl_type)
                    }
                }

                loading();
                var param_obj = [];
                param_obj.push({
                    'Flow_Id': selected_module_id,
                    'lat': user_lat,
                    'long': user_long,
                    'search': "",
                    'limit': limit_range,
                    'condition': Condition_Data,
                    'system_var': t_push_array,
                    'searchValue': search_keyword,
                    'searchParticularColumn': searchCol_obj,
                    'offset': limit_range - default_range,
                    'fetch': increment_range,
                    'status': status_array,
                    'udf_id': udf_id,
                    'tab_index': tab_index,
                    'Parent_Task_Id': p_server_task_id,
                    'order_by': order_by_obj
                });

                var appversion = JSON.parse(storage.getItem('appversion'));
                var auth = [];
                auth.push({
                    "username": username,
                    "devicetype": F7_device,
                    "appid": "",
                    "u_c": uniqcode,
                    "appversion": appversion
                });

                var task_listing_url = list_data[0].task_listing_url;
                if (task_listing_url == "" || task_listing_url == null || task_listing_url == undefined) {
                    var getdata = new Webservicecall_REST(global_wcf_url + 'OnlineTaskListing', JSON.stringify(param_obj), onsuccess_get_list_of_pm_sites_online, onfail_get_list_of_pm_sites_online);
                    getdata.callOtherDomain();
                }
                else {
                    var getdata = new Webservicecall_REST(global_wcf_url + task_listing_url, JSON.stringify(param_obj), onsuccess_get_list_of_pm_sites_online, onfail_get_list_of_pm_sites_online);
                    getdata.callOtherDomain();
                }
            }
        }
    } catch (e) {
        alert1(e + '_get_list_of_pm_sites_by_search_online()');
        loading_hide();
    }
}

var online_task_refresh_timer;
function onsuccess_get_list_of_pm_sites_online(e) {
    try {
        var type20_columndata = [];
        var myArray_main = JSON.parse(e.responseText);
        var status = myArray_main[0].status;
        var flow_Array = JSON.parse(storage.getItem('flow_Array'));

        //if (flow_Array.length == 1) {
        //    $("#btn_Submit").hide();
        //} else {
        //    $("#btn_Submit").show();
        //}

        var company_id = JSON.parse(storage.getItem('company_id'));
        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var create_task = list_data[0].task;
        var curr_btn_mode = JSON.parse(storage.getItem('curr_btn_mode'));

        //list_data[0].geofence[0].value = 'false';
        //storage.setItem('list_json', JSON.stringify(list_data));

        var upload_pending_count = 0;
        active_Tab = JSON.parse(storage.getItem('tab_index'));

        if (status == 1) {
            //alert1('list_data: ' + JSON.stringify(list_data));

            //list_data[0].geofence[0].value = 'true';
            //list_data[0].navigation = 'true';
            //list_data[0].site_route = 'true';
            //list_data[0].pdf_site_list = 'true';
            //list_data[0].weather_display = 'true';
            //list_data[0].CommentUI = 'true';
            //list_data[0].task_removable = "true";
            //list_data[0].task_editable = "true";

            var staticdata = list_data[0].staticdata;
            var status_array = list_data[0].status;
            var geofance_flag = list_data[0].geofence[0].value;
            var geofanceradius = parseInt(list_data[0].geofanceradius);
            var geofance_distance = list_data[0].geofence[0].show_distance;
            var task_clickable = list_data[0].task_clickable;
            var weather_display = list_data[0].weather_display;
            var task_removable = list_data[0].task_removable;
            var task_editable = list_data[0].task_editable;
            var upload_pending_display = list_data[0].upload_pending_display;

            // always display upload pending green panel - mk - 16072025 05:39
            upload_pending_display = "true";

            var customer_info = list_data[0].customer_info;
            var CommentUI = list_data[0].CommentUI;
            var site_route = list_data[0].site_route;
            var latlong_api = list_data[0].latlong_api;
            var task_listing_url = list_data[0].task_listing_url;

            var navigation_type = list_data[0].navigation;
            var alternate_list_color = list_data[0].alternate_list_color;
            alternate_list_color = '';     // having issue in some udf - task listing become black earlier
            if (alternate_list_color == '' || alternate_list_color == null || alternate_list_color == undefined) { }
            else {
                var back_color_even = alternate_list_color[1];
                var back_color_odd = alternate_list_color[0];
            }

            var approve_status = list_data[0].approval_status;
            var rejected_status = list_data[0].rejection_status;
            var restricted_status = list_data[0].restricted_status;
            if (restricted_status == "" || restricted_status == null || restricted_status == undefined) {
                restricted_status = "";
            }

            // setting task list icons alignment start
            var geofance_flag = list_data[0].geofence[0].value;
            var pdf_site_list = list_data[0].pdf_site_list;
            if (pdf_site_list == '' || pdf_site_list == null || pdf_site_list == undefined) {
                pdf_site_list = "false";
            }

            var pdf_mar_top = '30px';
            var li_min_height = '28px';
            if (geofance_flag == 'true' && pdf_site_list == 'true') {
                li_min_height = '90px';
                pdf_mar_top = '60px';
            } else if (geofance_flag == 'true' && pdf_site_list == 'false') {
                li_min_height = '57px';
            } else if (geofance_flag == 'false' && pdf_site_list == 'true') {
                li_min_height = '62px';
                pdf_mar_top = '30px';
            } else if (geofance_flag == 'false' && pdf_site_list == 'false') {
                li_min_height = '20px';
            }
            // setting task list icons alignment end

            var task_layout = list_data[0].task_layout;
            if (task_layout == "" || task_layout == null || task_layout == undefined) {
                task_layout = "cardview";
            }

            if (task_layout == "cardview") {
                var cls_task_layout = "task_cardview";
            }
            else {
                var cls_task_layout = "";
            }

            if (customer_info == "" || customer_info == null || customer_info == undefined) {
                customer_info = "true";
            }

            if (CommentUI == "" || CommentUI == null || CommentUI == undefined) {
                CommentUI = "true";
            }

            if (site_route == "" || site_route == null || site_route == undefined) {
                site_route = "false";
            }

            if (F7_device == 'ios') {
                var upload_param = "mk_notify('Task is uploading, please wait... !')";
            }
            else {
                var upload_param = "alert1('Task is uploading, please wait... !')";
            }

            var clickable_param = "";

            //var buttons = list_data[0].buttons;
            //if (buttons == '' || buttons == null || buttons == undefined || buttons.length == 0) {
            //    if (F7_device == 'ios') {
            //        var clickable_param = "mk_notify('This information is read only !')";
            //    }
            //    else {
            //        var clickable_param = "alert1('This information is read only !')";
            //    }
            //}
            //else {
            //    var clickable_param = "";
            //}

            var colwise_align = list_data[0].colwise_align;
            var taskview_label = list_data[0].taskview_label;
            var user_column = list_data[0].user_column;
            var color_column = list_data[0].color_column;
            var buttons = list_data[0].buttons;
            var bulk_approval = list_data[0].bulk_approval;
            var bulk_approval_status = list_data[0].bulk_approval_status;
            var default_columndata = list_data[0].columndata;

            let visible_column_len = default_columndata.length;
            for (let dc = 0; dc < default_columndata.length; dc++) {
                var is_hide = default_columndata[dc].is_hide;
                if (is_hide == "true") {
                    visible_column_len--;
                }
            }


            for (i = 0; i < myArray_main.length; i++) {
                //alert1('myArray_main: ' + JSON.stringify(myArray_main[i]));

                var is_upload_pending = 0; // default no upload pending
                var task_update = 1; // default update
                //var tid = myArray_main[i].server_task_id;
                var tid = '';
                var ser_task_id = myArray_main[i].server_task_id;
                var siteid = myArray_main[i].Customer_id;
                var site_name = myArray_main[i].siteid;             // its customeruniq
                //var site_address = myArray_main[i].site_address;
                var site_lat = myArray_main[i].lat;
                var site_long = myArray_main[i].long1;
                var survey_date = myArray_main[i].survey_date;
                var ser_milli = myArray_main[i].millisecond;
                var module_id = myArray_main[i].moduleid;
                var module_name = myArray_main[i].module_name;
                var task_setting = myArray_main[i].task_setting;
                if (task_setting == '' || task_setting == null || task_setting == undefined || task_setting == " ") {
                    var is_grey = 0;
                }
                else {
                    task_setting = JSON.parse(task_setting);
                    var is_grey = task_setting.is_grey;
                }

                if (site_lat == "" || site_lat == null || site_lat == undefined || site_lat == "0") {
                    site_lat = user_lat;
                }
                if (site_long == "" || site_long == null || site_long == undefined || site_long == "0") {
                    site_long = user_long;
                }

                //check if sub-task is approved or rejected
                var task_status = myArray_main[i].status1;
                //alert1("task status: " + task_status + ", approve_status: " + approve_status + ", rejected_status: " + rejected_status);

                var is_approved = false;
                if ($.isArray(approve_status)) {
                    if (approve_status.indexOf(task_status.toString()) > -1) {
                        is_approved = true;
                    }
                }
                else {
                    if (task_status == approve_status) {
                        is_approved = true;
                    }
                }

                var is_rejected = false;
                if ($.isArray(rejected_status)) {
                    if (rejected_status.indexOf(task_status.toString()) > -1) {
                        is_rejected = true;
                    }
                }
                else {
                    if (task_status == rejected_status) {
                        is_rejected = true;
                    }
                }

                if (is_grey == 1 || is_approved == true || is_rejected == true) {
                    var rate = 2;
                }
                else {
                    var rate = 0;
                }

                var is_delete_photo = "";
                var is_delete_log = "";
                var is_delete_sub = "";
                var is_valid_log = "";

                var del_media_str = '';
                for (j = 0; j < upload_pending_Array.length; j++) {
                    var loc_server_task_id = upload_pending_Array[j][0];
                    if (loc_server_task_id == ser_task_id) {
                        // server_task_id exist in local and upload pending task)
                        is_delete_photo = upload_pending_Array[j][2];
                        is_delete_log = upload_pending_Array[j][3];
                        is_delete_sub = upload_pending_Array[j][4];
                        is_valid_log = upload_pending_Array[j][5];
                        //if (is_delete_photo == "[]" || is_delete_photo == "null" || is_delete_photo == "Unknown" || is_delete_photo == null || is_delete_photo == undefined || is_delete_photo == "") {
                        //    is_display = 0;
                        //}
                        is_upload_pending = 1;
                        break;
                    }
                }

                //if (is_display == 1) {
                if (staticdata == '' || staticdata == null || staticdata == undefined) {
                    var myArray = myArray_main[i].columndata;
                    var multiple_LatLong_ary = [{ 'Lat 1': "", 'Long 1': "", 'Lat 2': "", 'Long 2': "", }];

                    if (task_listing_url == "" || task_listing_url == null || task_listing_url == undefined) {
                        var d_len = default_columndata.length;
                        for (d = 0; d < d_len; d++) {
                            // old structure
                            //var t_ans = myArray[d].ans;

                            // new structure 06092021
                            var t_header = default_columndata[d].header;
                            var t_ans = myArray[0][t_header];

                            default_columndata[d]["ans"] = t_ans;

                            var d_header = default_columndata[d].header;
                            if (site_route == "true") {                             //display site route on map [23042021]
                                if (latlong_api == "" || latlong_api == null || latlong_api == undefined) {
                                    if (d_header == "Lat 1") {
                                        var lat1 = t_ans;
                                        multiple_LatLong_ary[0]['Lat 1'] = lat1;
                                    }
                                    else if (d_header == "Lat 2") {
                                        var lat2 = t_ans;
                                        multiple_LatLong_ary[0]['Lat 2'] = lat2;
                                    }
                                    else if (d_header == "Long 1") {
                                        var long1 = t_ans;
                                        multiple_LatLong_ary[0]['Long 1'] = long1;
                                    }
                                    else if (d_header == "Long 2") {
                                        var long2 = t_ans;
                                        multiple_LatLong_ary[0]['Long 2'] = long2;
                                    }
                                }
                            }
                        }

                        myArray = default_columndata;

                        //var new_myArray = [];
                        //for (var m = 0; m < myArray.length; m++) {
                        //    var is_hide = myArray[m].is_hide;
                        //    if (is_hide == "true") { }                          //hide columndata element when is_hide is true in task listing [22042021]
                        //    else {
                        //        new_myArray.push(myArray[m]);
                        //    }
                        //}
                        //myArray = new_myArray;
                    }
                    else {
                        //---when task listing url then user api columndata for listing [13072021]
                        var myArray = myArray_main[i].columndata;
                    }


                    var list_item = '';
                    var icon_str = '';
                    var param2 = "get_user_latlong_for_map('" + site_lat + "', '" + site_long + "')";
                    var distance = getDistanceFromLatLonInMeter(user_lat, user_long, site_lat, site_long);
                    distance = parseInt(distance);
                    distance_desplay = distance;
                    //distance = 0;

                    if (task_status == 2 || ((is_grey == 1 || rate == 2) && flow_Array.length > 1) || is_upload_pending == 1) {
                        var back_color = '#e6e6e6';
                    } else {
                        if (alternate_list_color == '' || alternate_list_color == null || alternate_list_color == undefined) {
                            var back_color = 'white';
                        }
                        else {
                            var li_length = $("#site_list > li:not(:hidden)").length;
                            if (li_length % 2 == 0) {
                                var back_color = back_color_odd;
                            }
                            else {
                                var back_color = back_color_even;
                            }
                        }
                    }

                    // check for deleted media for task
                    var dlt_media_chksht_type = '';
                    if (is_delete_photo == "[]" || is_delete_photo == "null" || is_delete_photo == "Unknown" || is_delete_photo == null || is_delete_photo == undefined || is_delete_photo == "") { }
                    else {
                        var media_data = JSON.parse(is_delete_photo);
                        if (media_data.length > 0) {
                            var checksheet_name = media_data[0].c_name;
                            dlt_media_chksht_type = media_data[0].checksheet_type;
                            if (checksheet_name == '' || checksheet_name == null || checksheet_name == undefined) { }
                            else {
                                del_media_str += '<a style="width:97%"><details class="cls_remove">';
                                if (media_data.length == 1) {
                                    del_media_str += '<summary>media files missing in 1 step - Tap to view</summary><ul class="media_ui">';
                                }
                                else {
                                    del_media_str += '<summary>media files missing in ' + media_data.length + ' steps - Tap to view</summary><ul class="media_ui">';
                                }
                                for (dm = 0; dm < media_data.length; dm++) {
                                    var checksheet_name = media_data[dm].c_name;
                                    var step_name = media_data[dm].s_name;
                                    var que_name = media_data[dm].que_name;
                                    del_media_str += '<li class="media_li"><span class="mk_rounded_number theme_login_info_div_content">' + (dm + 1) + '</span> ' + checksheet_name + ' > ' + step_name + ' > ' + que_name + '</li>';
                                }
                                del_media_str += '</ul></details></a>';
                            }
                        }
                    }

                    // check for deleted log for task
                    var del_log_str = '';
                    //var is_delete_log = '[{ "c_name": "Fuel Data", "s_name": "Fuel Data" }, { "c_name": "Demo Checksheet", "s_name": "Demo Step" }]';
                    if (is_delete_log == "[]" || is_delete_log == "null" || is_delete_log == "Unknown" || is_delete_log == null || is_delete_log == undefined || is_delete_log == "") { }
                    else {
                        var log_data = JSON.parse(is_delete_log);
                        if (log_data.length > 0) {
                            var checksheet_name = log_data[0].c_name;
                            if (checksheet_name == '' || checksheet_name == null || checksheet_name == undefined) { }
                            else {
                                del_log_str += '<a style="width:97%"><details class="cls_remove">';
                                if (log_data.length == 1) {
                                    del_log_str += '<summary>log file missing in 1 step - Tap to view</summary><ul class="media_ui">';
                                }
                                else {
                                    del_log_str += '<summary>log files missing in ' + log_data.length + ' steps - Tap to view</summary><ul class="media_ui">';
                                }
                                for (dm = 0; dm < log_data.length; dm++) {
                                    var checksheet_name = log_data[dm].c_name;
                                    var step_name = log_data[dm].s_name;
                                    del_log_str += '<li class="media_li"><span class="mk_rounded_number theme_login_info_div_content">' + (dm + 1) + '</span> ' + checksheet_name + ' > ' + step_name + '</li>';
                                }
                                del_log_str += '</ul></details></a>';
                            }
                        }
                    }

                    // check for deleted sub task in sub flow
                    var del_subflow_str = '';
                    //var is_delete_sub = '[{ "module_id": "552", "module_name": "ELECTRICAL" }]';
                    if (is_delete_sub == "[]" || is_delete_sub == "null" || is_delete_sub == "Unknown" || is_delete_sub == null || is_delete_sub == undefined || is_delete_sub == "") { }
                    else {
                        var sub_data = JSON.parse(is_delete_sub);
                        if (sub_data.length > 0) {
                            var module_name = sub_data[0].module_name;
                            if (module_name == '' || module_name == null || module_name == undefined) { }
                            else {
                                del_subflow_str += '<a style="width:97%"><details class="cls_remove">';
                                if (sub_data.length == 1) {
                                    del_subflow_str += '<summary>media files missing in 1 sub flow - Tap to view</summary><ul class="media_ui">';
                                }
                                else {
                                    del_subflow_str += '<summary>media files missing in ' + sub_data.length + ' sub flows - Tap to view</summary><ul class="media_ui">';
                                }
                                for (dm = 0; dm < sub_data.length; dm++) {
                                    var module_name = sub_data[dm].module_name;
                                    del_subflow_str += '<li class="media_li"><span class="mk_rounded_number theme_login_info_div_content">' + (dm + 1) + '</span> ' + module_name + '</li>';
                                }
                                del_subflow_str += '</ul></details></a>';
                            }
                        }
                    }

                    // check for invalid log for task
                    var valid_log_str = '';
                    //var is_valid_log = '[{"c_name":"Demo Checksheet Name","s_name":"Demo Step Name","type":2,"que_id":91,"name":"Modules Fan"}, {"c_name":"Demo Checksheet Name1","s_name":"Demo Step Name1","type":2,"que_id":92,"name":"Modules Fan1"}]';
                    if (is_valid_log == "[]" || is_valid_log == "null" || is_valid_log == "Unknown" || is_valid_log == null || is_valid_log == undefined || is_valid_log == "") { }
                    else {
                        var log_data = JSON.parse(is_valid_log);
                        if (log_data.length > 0) {
                            var checksheet_name = log_data[0].c_name;
                            dlt_media_chksht_type = log_data[0].checksheet_type;
                            if (checksheet_name == '' || checksheet_name == null || checksheet_name == undefined) { }
                            else {
                                valid_log_str += '<a style="width:97%;"><details class="cls_remove">';
                                if (log_data.length == 1) {
                                    valid_log_str += '<summary>1 invalid log found - Tap to view</summary><ul class="media_ui">';
                                }
                                else {
                                    valid_log_str += '<summary>' + log_data.length + ' invalid logs found - Tap to view</summary><ul class="media_ui">';
                                }
                                for (dm = 0; dm < log_data.length; dm++) {
                                    var checksheet_name = log_data[dm].c_name;
                                    var step_name = log_data[dm].s_name;
                                    var cntrl_name = log_data[dm].name;
                                    var que_id = log_data[dm].que_id;

                                    valid_log_str += '<li class="media_li"><span class="mk_rounded_number theme_login_info_div_content">' + (dm + 1) + '</span> ' + checksheet_name + ' > ' + step_name + '</li>';
                                    valid_log_str += '<li class="media_li" style="margin-left: 25px;padding:0 0 5px;line-height:14px;">' + ' > (' + que_id + ') ' + cntrl_name + '</li>';
                                }
                                valid_log_str += '</ul></details></a>';
                            }
                        }
                    }


                    var upload_pending_str = '';
                    if (upload_pending_display != "false") {
                        if (is_upload_pending == 1) {
                            // upload pending task
                            upload_pending_str += "<div style='border:1px solid black; margin-top:8px; padding:2px; width:100%; background-color:white; color:#32cd32; border-top: 1px solid #32cd32; border-bottom: 1px solid #32cd32; text-align:center'>Task is uploading...</div>";
                            upload_pending_count++;
                        }
                    }

                    if (user_column == "" || user_column == null || user_column == undefined) {
                        if (geofance_flag == "true") {
                            // geofence is true

                            var SitewiseRadius = get_sitewise_radius_from_columndata(myArray);
                            if (SitewiseRadius == "" || SitewiseRadius == null || SitewiseRadius == undefined || SitewiseRadius == 0) {
                                geofanceradius = geofanceradius;
                            }
                            else {
                                geofanceradius = parseInt(SitewiseRadius);
                            }

                            var alert_param = "alert_task_distance('" + distance + "','" + geofanceradius + "','" + user_accuracy + "','" + user_lat + "','" + user_long + "','" + site_lat + "','" + site_long + "', '" + site_name + "')";
                            if (distance < (geofanceradius + user_accuracy)) {
                                var near_site = 1; // site is in radius

                                if (task_listing_url == "" || task_listing_url == null || task_listing_url == undefined) {
                                    var param = "redirect_on_pm_site_click_online('" + siteid + "','" + site_name + "', '" + ser_task_id + "', '" + task_status + "','" + module_id + "', '" + module_name + "','" + task_update + "', '" + site_lat + "', '" + site_long + "', '" + survey_date + "', '" + ser_milli + "')";
                                }
                                else {
                                    var param = "redirect_on_transport_site_click('" + siteid + "','" + site_name + "', '" + ser_task_id + "', '" + task_status + "','" + module_id + "', '" + module_name + "','" + task_update + "', '" + site_lat + "', '" + site_long + "', '" + survey_date + "', '" + ser_milli + "')";
                                }

                            } else {

                                var new_column_obj = {
                                    "siteid": siteid,
                                    "site_name": site_name,
                                    "ser_task_id": ser_task_id,
                                    "start_status": task_status,
                                    "module_id": module_id,
                                    "module_name": module_name,
                                    "task_update": task_update,
                                    "site_lat": site_lat,
                                    "site_long": site_long,
                                    "survey_date": survey_date,
                                    "ser_milli": ser_milli
                                };
                                new_column_obj = JSON.stringify(new_column_obj);
                                var t_new_column_obj = encodeURIComponent(new_column_obj);

                                near_site = 0; // site is not in radius                           
                                var param = "get_distance_confirmation_pm('" + siteid + "', '','" + module_id + "', '" + module_name + "', '" + ser_task_id + "', '" + site_name + "','" + user_lat + "','" + user_long + "','" + user_accuracy + "','" + geofanceradius + "','" + site_lat + "','" + site_long + "', '" + t_new_column_obj + "')";
                            }

                            if (near_site == 1) {
                                icon_str += '<i class="fa fa-check-circle cls_task_ico" style="font-size: 30px; color: #4caf50 !important" onclick="' + alert_param + '"></i>';
                            } else {
                                icon_str += '<i class="fa fa-times-circle cls_task_ico" style="font-size: 30px; color: #f44336 !important" onclick="' + alert_param + '"></i>';
                            }
                            distance_desplay = distance;
                        } else {
                            //if (del_media_str != "" && task_editable == "true") {
                            if (dlt_media_chksht_type == "5") {
                                //editable task for task form only
                                var param = "get_tid_for_task_edit_onlline(" + ser_task_id + ", '" + task_status + "')";
                            }
                            else {
                                // geofence is false

                                if (task_listing_url == "" || task_listing_url == null || task_listing_url == undefined) {
                                    var param = "redirect_on_pm_site_click_online('" + siteid + "','" + site_name + "', '" + ser_task_id + "', '" + task_status + "','" + module_id + "', '" + module_name + "','" + task_update + "', '" + site_lat + "', '" + site_long + "', '" + survey_date + "', '" + ser_milli + "')";
                                }
                                else {
                                    var param = "redirect_on_transport_site_click('" + siteid + "','" + site_name + "', '" + ser_task_id + "', '" + task_status + "','" + module_id + "', '" + module_name + "','" + task_update + "', '" + site_lat + "', '" + site_long + "', '" + survey_date + "', '" + ser_milli + "')";
                                }
                            }
                        }
                    }
                    else {
                        //when user_column is defined to get another user lat long
                        var user_column_obj = {
                            "siteid": siteid,
                            "site_name": site_name,
                            "ser_task_id": ser_task_id,
                            "task_status": task_status,
                            "module_id": module_id,
                            "module_name": module_name,
                            "task_update": task_update,
                            "site_lat": site_lat,
                            "site_long": site_long,
                            "survey_date": survey_date,
                            "siteid": ser_milli
                        };
                        user_column_obj = JSON.stringify(user_column_obj);
                        var t_user_column_obj = encodeURIComponent(user_column_obj);
                        var param = "get_current_user_latlong('" + geofance_flag + "', '" + geofanceradius + "', '" + t_user_column_obj + "')";
                    }

                    var bgcolor = myArray_main[i].bgcolor;
                    if (color_column == "" || color_column == null || color_column == undefined) { }
                    else {
                        var curr_date = new Date();
                        var temp_columndata = myArray_main[i].columndata;
                        var due_date = temp_columndata[0][color_column];
                        var datetime_format = localStorage.getItem("dateFormat");
                        if (datetime_format.indexOf('dd/MM/yyyy') > -1 || due_date == "Invalid Date") {
                            if (due_date.length > 10) {
                                var t_date_str1 = due_date.substring(0, 10);
                                var t_date_str2 = due_date.substring(10);
                                if (F7_device == 'ios') {
                                    //date with (-) is invalid for ios so replaced it with "/" instead of "-" [FT - 01062024]
                                    t_date_str1 = t_date_str1.split("/").reverse().join("/");
                                }
                                else {
                                    t_date_str1 = t_date_str1.split("/").reverse().join("-");
                                }
                                due_date = t_date_str1 + t_date_str2;
                            }
                            else {
                                if (F7_device == 'ios') {
                                    //date with (-) is invalid for ios so replaced it with "/" instead of "-" [FT - 01062024]
                                    due_date = due_date.split("/").reverse().join("/");
                                }
                                else {
                                    due_date = due_date.split("/").reverse().join("-");
                                }
                            }
                        }

                        due_date = new Date(due_date);
                        var milliseconds = due_date - curr_date;
                        var hours_diff = Math.floor(milliseconds / (60 * 60 * 1000));

                        if (hours_diff < 0) {
                            bgcolor = "red";
                        }
                        else if (hours_diff > 0 && hours_diff < 3) {
                            bgcolor = "orange";
                        }
                        else if (hours_diff > 3 && hours_diff < 9) {
                            bgcolor = "yellow";
                        }
                        else if (hours_diff > 9) {
                            bgcolor = "green";
                        }
                    }

                    if (bgcolor == '' || bgcolor == null || bgcolor == undefined) {
                        var font_color = "";
                        var mar_btm = "";
                    }
                    else {
                        back_color = bgcolor;
                        if (bgcolor == "yellow") {
                            var font_color = "color: #000;";
                        }
                        else {
                            var font_color = "color: #fff;";
                        }
                        var mar_btm = "margin-bottom: 2px;";
                    }

                    list_item += '<li value="' + rate + '" id ="lst_' + ser_task_id + '" class="' + cls_task_layout + '" style="background-color:' + back_color + ';' + font_color + mar_btm + '">' + upload_pending_str + ' ' + del_media_str + ' ' + del_log_str + ' ' + del_subflow_str + ' ' + valid_log_str + '<label class="label-checkbox item-content">';

                    //list_item += '<img src="images/multicircle.svg" class="cloud-absolute">';
                    //list_item += '<svg class="cloud-absolute" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Layer_1" x="0px" y="0px" viewBox="0 0 153 187" style="enable-background:new 0 0 153 187;" xml:space="preserve"><style type="text/css">.st0{opacity:0.2;fill:' + t_color_name + ';}</style><g><title>3</title><desc>CreatedwithSketch.</desc><g id="Mask-_x2B_-Mask-Mask" transform="translate(14.000000, 0.000000)"><g id="Mask"></g><g id="Mask_1_"><path class="st0" d="M138,141.2c-3.6,0.5-7.3,0.8-11,0.8c-29.6,0-55.4-16.5-68.6-40.9c-6-11-9.4-23.7-9.4-37.1 c0-26.5,13.2-49.9,33.4-64H138v129.5"/></g><g id="Mask_2_"><path class="st0" d="M138,141.2V187H-15c0.2-43.3,31.9-79.1,73.4-85.9c4.6-0.8,9.3-1.1,14.1-1.1c26.1,0,49.5,11.4,65.5,29.5"/></g></g></g></svg>';

                    var cloud_str = localStorage.getItem("cloud_str");
                    list_item += cloud_str;

                    if (navigation_type == "true") {
                        icon_str += '<i class="fa fa-street-view cls_task_ico" style="font-size: 32px; margin-bottom:6px" onclick="' + param2 + '"></i>';
                    }

                    if (site_route == "true") {
                        var latlong_str = JSON.stringify(multiple_LatLong_ary);
                        latlong_str = encodeURIComponent(latlong_str);
                        var param_site_route = "display_site_route_on_map('" + latlong_api + "', '" + ser_task_id + "', '" + latlong_str + "')";
                        icon_str += '<i class="fa fa-map-marker cls_task_ico" style="font-size: 32px; margin-bottom:6px" onclick="' + param_site_route + '"></i>';
                    }

                    var is_restricted = restricted_status.indexOf(task_status.toString());

                    if (dlt_media_chksht_type == "5") {
                        //editable task for task form only
                        var param = "get_tid_for_task_edit_onlline(" + ser_task_id + ", '" + task_status + "')";
                    }
                    else if (task_clickable == 'false' || task_clickable == 'disable_all' || is_restricted > -1) {
                        param = clickable_param;
                    }

                    // allow click for upload pending task 28032022
                    //if (is_upload_pending == 1 && flow_Array.length == 1) {
                    //    // if status is not allowed then restrict click
                    //    param = upload_param;
                    //}

                    // check for pdf download option
                    if (pdf_site_list == 'true') {

                        let domain_url = JSON.parse(storage.getItem('global_url'));

                        var check_pdf = check_type_for_pdf_report();                   //check if PDF report should be old or new [FT-24072024]
                        if (check_pdf == "new") {
                            // login url (pdf preview pdf)
                            var param_pdf = "redirect_page_pdf_preview('" + ser_task_id + "', '" + siteid + "', 'task')";
                            icon_str += '<i class="fa fa-file-pdf-o cls_task_ico" style="font-size: 30px; margin-bottom:4px" onclick="' + param_pdf + '"></i>';
                        }
                        else {
                            // other urls (server side pdf)
                            var param_pdf = "Generate_PDFFile('" + ser_task_id + "')";
                            icon_str += '<i class="fa fa-file-pdf-o cls_task_ico" style="font-size: 30px; margin-bottom:4px" onclick="' + param_pdf + '"></i>';
                        }

                    }

                    if (weather_display == 'true') {
                        var param_weather = "view_weather_for_site('" + site_lat + "', '" + site_long + "')";
                        icon_str += '<i class="fa fa-cloud cls_task_ico" style="font-size: 28px" onclick="' + param_weather + '"></i>';
                    }

                    // static false as it is not working due to 3 key issue in log 08052024

                    if (customer_info == 'true') {
                        if (siteid == 0) { }
                        else {
                            var param_cust_info = "view_customer_detail_task('" + siteid + "')";
                            icon_str += '<i class="fa fa-info-circle cls_task_ico" style="font-size: 32px" onclick="' + param_cust_info + '"></i>';
                        }
                    }

                    if (CommentUI == 'true') {
                        var param_commentUI = "get_sub_tasks('" + ser_task_id + "')";
                        icon_str += '<i class="fa fa-comments cls_task_ico" style="font-size: 30px; margin-bottom:4px" onclick="' + param_commentUI + '"></i>';
                    }

                    //if (flow_Array.length > 1) {
                    if (is_approved == true) {
                        icon_str += '<span><i class="fa fa-check-square" style="font-size: 30px; color: green"></i></span>';
                    }
                    else if (is_rejected == true) {
                        icon_str += '<span id="rejected_icon_' + ser_task_id + '"><i class="fa fa-check-square" style="font-size: 30px; color: red"></i></span>';
                        //icon_str += '<i class="fa fa-times-rectangle" style="font-size: 30px; color: red"></i>';
                    }
                    //}


                    list_item += '<input type="checkbox" id="check_box_' + ser_task_id + '" name="li_chk" class="myChecksheet" value="' + ser_task_id + '" task_status="' + task_status + '"onchange="get_selected_chk_count()"><div class="item-media li_no_chk"><i class="icon icon-form-checkbox"></i></div>';
                    list_item += '<div class="item-inner item-no-pad" style="padding-bottom:0 !important;" onclick ="' + param + '"><div class="item-title" style="width: 100% !important;">';

                    if (colwise_align == '' || colwise_align == null || colwise_align == undefined) {
                        colwise_align = "false";
                    }

                    list_item += '<div class="readmore">';
                    if (colwise_align == 'true') {
                        list_item += '<table style="width: 100% !important;vertical-align: top !important;">';
                    }
                    else {
                        list_item += '<table style="width: 98% !important;vertical-align: top !important;" class="rowwise-align">';
                    }

                    var prev_align = "";
                    var colwise_align_cnt = 0;
                    for (j = 0; j < myArray.length; j++) {
                        var ctrl_type = myArray[j].ctrl_type;
                        var header = myArray[j].header;
                        var ans_lable = myArray[j].ans;
                        var font_size = myArray[j].font_size;
                        var format = myArray[j].format;
                        var color = myArray[j].color;
                        if (color == "#ffff") {
                            color = "";
                        }

                        var align = myArray[j].align;
                        if (align == "" || align == null || align == undefined) {
                            align = "left";
                        }

                        //Date conversion done from server side 23062023
                        //var ctrl_type = myArray[j].ctrl_type;
                        //if (ctrl_type == "8") {
                        //    if (ans_lable == "" || ans_lable == null || ans_lable == undefined) { }
                        //    else {
                        //        ans_lable = ans_lable.replace(" 00:00", "");
                        //        ans_lable = ans_lable.replace(" 00:00:00", "");

                        //        //ans_lable = convert_fix_format_date_on_submit(ans_lable.trim(), 'datetime');
                        //    }
                        //}

                        // calculate_aging true found for type8 DV-26032024
                        var ctrl_type = myArray[j].ctrl_type;
                        var calculate_aging = myArray[j].calculate_aging;
                        if (calculate_aging == 'true' && ctrl_type == 8) {
                            if (ans_lable == "" || ans_lable == null || ans_lable == undefined || ans_lable == 'undefined') { }
                            else {
                                var curr_date_str = "";
                                var pre_text_found = 0, post_text_found = 0;
                                var aging_pre_text = myArray[j].aging_pre_text;
                                if (aging_pre_text == "" || aging_pre_text == null || aging_pre_text == undefined || aging_pre_text == 'undefined') { }
                                else {
                                    pre_text_found = 1;
                                    curr_date_str = ans_lable;
                                }

                                var aging_post_text = myArray[j].aging_post_text;
                                if (aging_post_text == "" || aging_post_text == null || aging_post_text == undefined || aging_post_text == 'undefined') { }
                                else {
                                    post_text_found = 1;
                                    curr_date_str = ans_lable;
                                }

                                ans_lable = convert_fix_format_date_on_submit(ans_lable, "datetime");
                                var fixed_format_str = ans_lable;
                                var d_date = new Date(ans_lable); // some mock date
                                var time_str = format_AMPM(d_date);
                                ans_lable = time_str;

                                if (pre_text_found == 1 || post_text_found == 1) {
                                    var get_post_text = checkDate(fixed_format_str);
                                    if (get_post_text == 'past') {
                                        ans_lable = ans_lable + ' ' + aging_post_text;
                                    }
                                    else if (get_post_text == 'future') {
                                        ans_lable = ans_lable + ' ' + aging_pre_text;
                                    }
                                }
                            }
                        }

                        var system_var = myArray[j].system_var;
                        if (system_var == "static_data") {
                            ans_lable = "<b>" + (i + 1) + "</b>";
                        }

                        if (ans_lable == "" || ans_lable == null || ans_lable == undefined) {
                            ans_lable = "N/A"
                        }
                        else {
                            ans_lable = ans_lable.trim();
                        }

                        if (taskview_label == '' || taskview_label == null || taskview_label == undefined) {
                            taskview_label = "true";
                        }

                        if (taskview_label == "false") {
                            header = '';
                            font_size = '11';
                        }
                        else {
                            if (colwise_align == 'true') { }
                            else {
                                header = header + ': ';
                            }
                            font_size = '9';
                        }

                        //var header_sys_str = header.replace(': ', '');
                        var t_header = myArray[j].header;
                        var header_sys_str = t_header.replace(': ', '');
                        type20_columndata.push({
                            header: header_sys_str,
                            ans: ans_lable
                        });

                        var is_hide = myArray[j].is_hide;
                        if (is_hide == "true") { }
                        else {
                            if (taskview_label == "false") {
                                //set dynamic alignment if taskview_label is false [30092021]
                                var text_align = "text-align: " + align + ";";

                                var font_format = "";
                                if (format == "italic") {
                                    var font_format = "font-style: italic";
                                }

                                if (j < (myArray.length - 1)) {
                                    var next_align = myArray[j + 1].align;
                                    if (next_align == "" || next_align == null || next_align == undefined) {
                                        next_align = "left";
                                    }
                                }
                                else {
                                    var next_align = "left";
                                }

                                var colspan = "";
                                var td_width = "50%";
                                if (align == "left" && next_align == "right") {
                                    list_item += '<tr>';
                                }
                                else if ((align == "left" && next_align == "left") || (align == "right" && prev_align == "right") || (align == "right" && next_align == "left" && prev_align == "") || (j == 0 && align == "right")) {
                                    list_item += '<tr>';
                                    colspan = "2";
                                    td_width = "100%";
                                }

                                if (colwise_align == 'true') {
                                    //colwise true
                                    list_item += '<td colspan="' + colspan + '" style="' + text_align + 'width: ' + td_width + '; vertical-align: top;"><div class="item-title cls_disp_blk" style="font-size:' + font_size + 'pt;"><b>' + header + '</b><div class="text-break cls_search cls_disp_blk">' + ans_lable + '</div></div></td>';
                                }
                                else {
                                    //colwise false
                                    list_item += '<td colspan="' + colspan + '" style="width: ' + td_width + '; display:inline-block; overflow: hidden;text-overflow: ellipsis; word-break: break-all; vertical-align:top; ' + text_align + ' font-size:' + font_size + 'pt; ' + font_format + ' color:' + color + '" class="cls_search">' + ans_lable + '</td>';
                                }

                                if ((align == "right" && next_align == "left") || (align == "right" && next_align == "") || (align == "left" && next_align == "left") || (align == "right" && next_align == "right") || (align == "right" && prev_align == "right")) {
                                    list_item += '</tr>';
                                }
                                prev_align = align;
                            }
                            else {
                                if (colwise_align == 'true') {
                                    if ((colwise_align_cnt) % 2 == 0) {
                                        var text_align = "text-align: left;";
                                        list_item += '<tr>';
                                    }
                                    else {
                                        if (taskview_label == "true") {
                                            var text_align = "text-align: left;";
                                        }
                                        else {
                                            var text_align = "text-align: right;";
                                        }
                                    }

                                    list_item += '<td style="' + text_align + 'width: 50%; vertical-align: top;"><div class="item-title cls_disp_blk" style="font-size:' + font_size + 'pt;"><b>' + header + '</b><div class="text-break cls_search cls_disp_blk">' + ans_lable + '</div></div></td>';

                                    if ((colwise_align_cnt) % 2 == 0) { }
                                    else {
                                        list_item += '</tr>';
                                    }

                                    colwise_align_cnt++;
                                }
                                else {
                                    // list row start
                                    list_item += '<tr>';

                                    if (format == 'italic') {
                                        list_item += '<td style="font-size:' + font_size + 'pt; font-style:' + format + '; color:' + color + '" ><b>' + header
                                            + '</b></td><td style="text-align: right;font-size:' + font_size + 'pt; font-style:' + format + '; color:' + color + '" class="cls_search">' + ans_lable
                                            + '</td>';
                                    } else {
                                        list_item += '<td style="width: 50%; display:inline-block; overflow: hidden;text-overflow: ellipsis; word-break: break-all; vertical-align:top; font-size:' + font_size + 'pt; text-decoration:' + format + '; color:' + color + '" ><b>' + header
                                            + '</b></td>';

                                        if (ctrl_type == "7" || ctrl_type == "9") {
                                            // dynamic photo thumbnail by live url 10082022
                                            var user_id = user_id = JSON.parse(storage.getItem('user_id'));
                                            var random_str = "&random=" + new Date().getTime();

                                            var checksheetID = myArray[j].checksheetID;
                                            var que_id = myArray[j].qid;
                                            var ctype = myArray[j].checksheet_type;
                                            var resumable_url = JSON.parse(storage.getItem('global_resumable_url'));

                                            var img_Id = "" + resumable_url + "GetFile/Select_File_Details?cid=" + checksheetID + "&t22id=0&t22i=0&id=" + ser_task_id + "&qd=" + que_id + "&ctype=" + ctype + "&ud=" + user_id + "&uc=" + uniqcode + random_str + "";
                                            var param_onclick = 'get_full_view_columndata_pic("' + img_Id + '")';
                                            ans_lable = "<img id='img_thumb_main_" + ser_task_id + "' class='cls_task_img' src=" + img_Id + " style='height: 50px; width: 50px;' onclick='" + param_onclick + "' />"
                                        }

                                        list_item += '<td style="width: 50%; display:inline-block; overflow: hidden;text-overflow: ellipsis; word-break: break-all; vertical-align:top; text-align: right !important; font-size:' + font_size + 'pt; text-decoration:' + format + '; color:' + color + '" class="cls_search">'
                                            + ans_lable + '</td>';
                                    }
                                    list_item += '</tr>';
                                }
                            }
                        }
                    }

                    if (geofance_distance == 'true') {

                        // custom development for telefonica
                        if (company_id == '1238') {
                            var miles = distance_desplay / 1609.344;
                            distance_desplay = parseFloat(miles).toFixed(2) + ' miles';
                        }
                        else {
                            distance_desplay = distance_desplay + ' m';
                        }

                        if (taskview_label == "false" || taskview_label == "hybrid") {
                            var dist_header = '';
                            font_size = '11';
                        }
                        else {
                            var dist_header = 'Distance: ';
                            font_size = '9';
                        }

                        if (taskview_label == "false") {
                            //===display distance left side (by default) [30092021]
                            var text_align = "text-align: left;";
                            var font_format = "";
                            if (format == "italic") {
                                var font_format = "font-style: italic";
                            }

                            list_item += '<tr>';
                            if (colwise_align == 'true') {
                                list_item += '<td colspan="2" style="' + text_align + 'width: 50%; vertical-align: top;"><div class="item-title cls_disp_blk" style="font-size:' + font_size + 'pt;"><b>' + dist_header + '</b><div class="text-break cls_search cls_disp_blk" style="color:' + color + ';font-size:' + font_size + 'pt;">' + distance_desplay + '</div></div></td>';
                            }
                            else {
                                list_item += '<td colspan="2" style="width: 50%;display:inline-block;overflow: hidden;text-overflow: ellipsis;vertical-align:top;' + text_align + 'font-size:' + font_size + 'pt; ' + font_format + ' color:' + color + '" class="cls_search">' + distance_desplay + '</td>';
                            }
                            list_item += '</tr>';
                        }
                        else {
                            if (colwise_align == 'true') {
                                if (visible_column_len % 2 == 0) {
                                    var text_align = "text-align: left;";
                                    list_item += '<tr>'
                                }
                                else {
                                    if (taskview_label == "true") {
                                        var text_align = "text-align: left;";
                                    }
                                    else {
                                        var text_align = "text-align: right;";
                                    }
                                }
                                list_item += '<td style="' + text_align + 'width: 50%; vertical-align: top;"><div class="item-title cls_disp_blk" style="font-size:' + font_size + 'pt;"><b>' + dist_header + '</b><div class="text-break cls_search cls_disp_blk" style="color:' + color + ';font-size:' + font_size + 'pt;">' + distance_desplay + '</div></div></td></tr>';
                            }
                            else {
                                list_item += '<tr>';
                                list_item += '<td style="width: 50%;display:inline-block;overflow: hidden;text-overflow: ellipsis;vertical-align:top;font-size:' + font_size + 'pt; text-decoration:' + format + '; color:' + color + ';"><b>' + dist_header + '</b></td><td style="width: 50%;display:inline-block;overflow: hidden;text-overflow: ellipsis;vertical-align:top;text-align: right;font-size:' + font_size + 'pt; text-decoration:' + format + '; color:' + color + '" class="cls_search">' + distance_desplay + '</td>';
                                list_item += '</tr>';
                            }
                        }
                    }

                    if (colwise_align == 'true') {
                        list_item += '</table>';
                    }
                    else {
                        list_item += '</table>';
                    }

                    if (back_color == "" || back_color == null || back_color == undefined) {
                        back_color = "white";
                    }
                    var showmore_back_color = back_color.replace(/['"]+/g, '');

                    list_item += '<span class="readmore-link" onclick="show_more_task_data(this);event.cancelBubble=true;" style="background-image: linear-gradient(to bottom, transparent, ' + showmore_back_color + ');display:none;"><div class="showmore-box">Show More <i class="fa fa-angle-down"></i></div></span>';
                    list_item += '</div>';

                    var trip_str = '';

                    var trip_ico_dis = false;
                    if (trip_New_Array.length > 0) {
                        let trip_found = 0;
                        for (let t = 0; t < trip_New_Array.length; t++) {
                            let sid = trip_New_Array[t].sid;                              // trip from notification
                            let lp_server_task_id = trip_New_Array[t].server_task_id;     // trip manually
                            if (sid == ser_task_id || lp_server_task_id == ser_task_id) {
                                trip_found = 1;
                                break;
                            }
                        }

                        if (trip_found == 1) {
                            trip_ico_dis = true;
                        }
                    }

                    if (trip_ico_dis == true) {
                        if (company_id == 1502) {
                            trip_str = '<i class="fa fa-motorcycle fa-flip-horizontal cls_task_ico" style="font-size: 22px"></i>';
                        }
                        else {
                            trip_str = '<i class="fa fa-car cls_task_ico" style="font-size: 22px"></i>';
                        }
                        icon_str += trip_str;
                    }

                    if (icon_str == "" || icon_str == null || icon_str == undefined) {
                        list_item += '</div></div>';
                        list_item += '</label>';
                    }
                    else {
                        if (task_layout == "cardview") {
                            list_item += '</div></div>';
                            list_item += '</label><div class="item-after" style="padding-top: 15px;width:95%;"><div class="item-icon task-icon" style="width:95%;text-align:center !important;">' + icon_str + '</div></div>';
                        }
                        else {
                            list_item += '</div><div class="item-after" style="padding-top: 6px;"><div class="item-icon">' + icon_str + '</div></div></div>';
                            list_item += '</label>';
                        }
                    }
                    //list_item += '</div><div class="item-after" style="padding-top:5px"><div class="item-icon">' + icon_str + '</div></div></div></label>';


                    //list_item += '</div><div class="item-after" style="padding-top:5px"><div class="item-icon">' + icon_str + '</div></div></div></label>';

                    /////////---shortcut buttons---//////////
                    //alert1(JSON.stringify(buttons));
                    var btn_count = 0;
                    if (buttons == '' || buttons == null || buttons == undefined || buttons.length == 0) { }
                    else {
                        var task_btn_str = '<div class="buttons-row" style="margin: 0px 15px; padding-bottom: 0px !important;width:90% !important;display:block;">';
                        var btn_len = buttons.length;

                        task_btn_str += '<table style="width: 100%;"><tr>';

                        if (bgcolor == '' || bgcolor == null || bgcolor == undefined) {
                            //var back_clr = "background:grey !important;";
                            var back_clr = "";                                  //default theme color as background
                            var font_clr = "color: #fff !important;";
                        }
                        else {
                            var back_clr = "background:#fff !important;";
                            var font_clr = "color: " + bgcolor + " !important;";
                        }

                        for (b = 0; b < btn_len; b++) {
                            var enabled = false;
                            var placement = buttons[b].placement;
                            if (placement == 'task' || placement == 'all') {
                                var view_dependancy = buttons[b].view_dependancy;
                                if (view_dependancy == 'always') { enabled = true; }
                                else if (view_dependancy == 'status') {
                                    var dependancy_status = buttons[b].dependancy_status;
                                    var dlen = dependancy_status.length
                                    var t_status = task_status;
                                    for (s = 0; s < dlen; s++) {
                                        if (dependancy_status[s] == t_status) {
                                            enabled = true;
                                            break;
                                        }
                                    }
                                }

                                if (enabled == true) {
                                    var submit_message = buttons[b].submit_message;
                                    var sb_trip = buttons[b].trip;

                                    // add is_mandatory key in shortcut button - ATC - UAT 200721
                                    var sb_is_mandatory = buttons[b].is_mandatory;
                                    if (sb_is_mandatory == "" || sb_is_mandatory == null || sb_is_mandatory == undefined) {
                                        sb_is_mandatory = 1;
                                    }

                                    if (task_clickable == 'disable_all') {
                                        var param_btn = clickable_param;
                                    }
                                    else {

                                        if (buttons[b].checksheet_id == "" || buttons[b].checksheet_id == null || buttons[b].checksheet_id == undefined) {
                                            buttons[b].checksheet_id = "0";
                                        }

                                        if (task_listing_url == "" || task_listing_url == null || task_listing_url == undefined) {
                                            var param_btn = "update_task_by_shortcut_button('" + buttons[b].checksheet_id + "','" + buttons[b].status + "','" + siteid + "', '" + tid + "', '" + task_status + "','"
                                                + module_id + "', '" + module_name + "', '" + site_name + "', '" + ser_task_id + "', '" + site_lat + "', '" + site_long + "', '" + survey_date + "', '" + ser_milli + "', '" + submit_message + "', '" + sb_trip + "', '" + sb_is_mandatory + "')";
                                        }
                                        else {
                                            var param_btn = "update_task_by_shortcut_button_transport('" + buttons[b].checksheet_id + "','" + buttons[b].status + "','" + siteid + "', '" + tid + "', '" + task_status + "','"
                                                + module_id + "', '" + module_name + "', '" + site_name + "', '" + ser_task_id + "', '" + site_lat + "', '" + site_long + "', '" + survey_date + "', '" + ser_milli + "', '" + submit_message + "', '" + sb_trip + "', '" + sb_is_mandatory + "')";
                                        }

                                    }

                                    if (buttons[b].checksheet_id == 0) {
                                        var sb_icon = "fa-paper-plane";
                                    }
                                    else {
                                        var sb_icon = "fa-share-square-o";
                                    }

                                    if (btn_count % 2 == 0) {
                                        var margin_left = "margin-left: 0px;";

                                    }
                                    else {
                                        var margin_left = "margin-left: 10px !important;"
                                    }

                                    if (btn_count % 2 == 0 && btn_count != 0) {
                                        task_btn_str += '</tr><tr>';
                                    }

                                    //display SB with full width [07092020]
                                    task_btn_str += '<td style="width:50%;"><a class="button button-fill button-raised cls_fence" onclick="' + param_btn + '" style="margin:0;display: inline-block;' + margin_left + back_clr + font_clr + '">';
                                    //task_btn_str += '<i class="fa ' + sb_icon + '" style="font-size: 20px;display: inline-block; ' + font_clr + 'vertical-align: middle;margin-right: 10px !important;"></i>' + buttons[b].name + '</a>';
                                    task_btn_str += buttons[b].name + '</a></td>';
                                    btn_count++;
                                }
                            }
                        }
                        task_btn_str += '</tr><table>';
                        task_btn_str += '</div>';
                        if (btn_count > 0) {
                            list_item += task_btn_str;
                        }
                    }
                    //////////////


                    let t_global_var = myArray_main[i].global_var;
                    list_item += '<input type="hidden" id="lst_global_var_' + ser_task_id + '" value="' + encodeURIComponent(t_global_var) + '">';

                    // store system var
                    list_item += '<input type="hidden" id="lst_sys_var_' + ser_task_id + '" value="' + encodeURIComponent(JSON.stringify(type20_columndata)) + '">';
                    type20_columndata = [];
                    /////

                    var task_remove_str = '';
                    var flow_Array = JSON.parse(storage.getItem('flow_Array'));
                    if (task_removable == 'true') {
                        var param_remove_sub = "remove_last_subtask_online('" + ser_task_id + "', '" + task_status + "')";
                        //var param_remove_sub = "update_server_task_entry_online_SB('" + ser_task_id + "')";
                        //list_item += '<div style="display:none" class="swipeout-actions-right" id="img_remove_' + i + '"><a href="#" class="swipeout-delete cls_remove" onclick ="' + param_remove_sub + '">Delete</a></div>';
                        task_remove_str += '<a id="img_remove_' + i + '" href="#" class="swipeout-delete cls_remove" onclick ="' + param_remove_sub + '">Delete</a>';
                    }

                    var task_edit_str = '';
                    if (task_editable == "true") {
                        var param_edit_task = "get_tid_for_task_edit_onlline(" + ser_task_id + ", '" + task_status + "')";
                        task_edit_str += '<a id="btn_task_edit_' + ser_task_id + '"  onclick="' + param_edit_task + '" style="transform: translate3d(0, 0px, 0px);">Edit</a>';
                    }

                    if (task_editable == 'true' || task_removable == 'true') {
                        list_item += '<div class="swipeout-actions-right" style="right: 0% !important;">';
                        list_item += task_edit_str;
                        list_item += task_remove_str;
                        list_item += '</div>';
                    }

                    // display task info on swipe to right
                    var info_param = "view_task_details_from_task_master(" + ser_task_id + ", '')";
                    list_item += '<div class="swipeout-actions-left">';
                    list_item += '<a href="#" class="action1" onclick="' + info_param + '">Details</a>';
                    list_item += '</div>';

                    list_item += '</li>';
                    $("#site_list").append(list_item);

                    if (bgcolor == "red" || bgcolor == "green" || bgcolor == "orange") {
                        $(".cls_task_ico").addClass('font-white');
                        $(".cls_task_ico").removeClass('font-black');
                    }
                    else if (bgcolor == "yellow") {
                        $(".cls_task_ico").addClass('font-black');
                        $(".cls_task_ico").removeClass('font-white');
                    }
                    else {
                        $(".cls_task_ico").removeClass('font-white');
                        $(".cls_task_ico").removeClass('font-black');
                    }

                    $("#site_list li").each(function () {
                        var li_height = $("#site_list li").height();
                        if (li_height < 110) {  //130=max-height of li
                            $('.readmore-link').hide();
                        }
                        else {
                            $('.readmore-link').show();
                        }
                    })

                    $('.cls_task_ico').click(function (event) {
                        event.stopPropagation();
                    });

                    $('.cls_task_img').click(function (event) {
                        event.stopPropagation();
                    });
                    $('.cls_remove').click(function (event) {
                        event.stopPropagation();
                    });

                    var count = i + 1;
                    //if (count == myArray_main.length) {
                    $("#img_remove_" + i + "").show();
                    $("#site_list > li").last().addClass("swipeout");
                    //}

                }
                else {
                    // static data available
                    if (task_status == 2 || ((is_grey == 1 || rate == 2) && flow_Array.length > 1) || is_upload_pending == 1) {
                        var back_color = '#e6e6e6';
                    } else {
                        var back_color = 'white';
                    }

                    // check for deleted media for task
                    var dlt_media_chksht_type = '';
                    if (is_delete_photo == "[]" || is_delete_photo == "null" || is_delete_photo == "Unknown" || is_delete_photo == null || is_delete_photo == undefined || is_delete_photo == "") { }
                    else {
                        var media_data = JSON.parse(is_delete_photo);
                        if (media_data.length > 0) {
                            var checksheet_name = media_data[0].c_name;
                            dlt_media_chksht_type = media_data[0].checksheet_type;
                            if (checksheet_name == '' || checksheet_name == null || checksheet_name == undefined) { }
                            else {
                                del_media_str += '<a style="width:97%"><details class="cls_remove">';
                                if (media_data.length == 1) {
                                    del_media_str += '<summary>1 media file is missing - Tap to view</summary><ul class="media_ui">';
                                }
                                else {
                                    del_media_str += '<summary>' + media_data.length + ' media files are missing - Tap to view</summary><ul class="media_ui">';
                                }
                                for (dm = 0; dm < media_data.length; dm++) {
                                    var checksheet_name = media_data[dm].c_name;
                                    var step_name = media_data[dm].s_name;
                                    var que_name = media_data[dm].que_name;
                                    del_media_str += '<li class="media_li"><span class="mk_rounded_number theme_login_info_div_content">' + (dm + 1) + '</span> ' + checksheet_name + ' > ' + step_name + ' > ' + que_name + '</li>';
                                }
                                del_media_str += '</ul></details></a>';
                            }
                        }
                    }


                    // check for deleted log for task
                    var del_log_str = '';
                    //var is_delete_log = '[{ "c_name": "Fuel Data", "s_name": "Fuel Data" }, { "c_name": "Demo Checksheet", "s_name": "Demo Step" }]';
                    if (is_delete_log == "[]" || is_delete_log == "null" || is_delete_log == "Unknown" || is_delete_log == null || is_delete_log == undefined || is_delete_log == "") { }
                    else {
                        var log_data = JSON.parse(is_delete_log);
                        if (log_data.length > 0) {
                            var checksheet_name = log_data[0].c_name;
                            if (checksheet_name == '' || checksheet_name == null || checksheet_name == undefined) { }
                            else {
                                del_log_str += '<a style="width:97%"><details class="cls_remove">';
                                if (log_data.length == 1) {
                                    del_log_str += '<summary>log file missing in 1 step - Tap to view</summary><ul class="media_ui">';
                                }
                                else {
                                    del_log_str += '<summary>log files missing in ' + log_data.length + ' steps - Tap to view</summary><ul class="media_ui">';
                                }
                                for (dm = 0; dm < log_data.length; dm++) {
                                    var checksheet_name = log_data[dm].c_name;
                                    var step_name = log_data[dm].s_name;
                                    del_log_str += '<li class="media_li"><span class="mk_rounded_number theme_login_info_div_content">' + (dm + 1) + '</span> ' + checksheet_name + ' > ' + step_name + '</li>';
                                }
                                del_log_str += '</ul></details></a>';
                            }
                        }
                    }

                    // check for deleted sub task in sub flow
                    var del_subflow_str = '';
                    //var is_delete_sub = '[{ "module_id": "552", "module_name": "ELECTRICAL" }]';
                    if (is_delete_sub == "[]" || is_delete_sub == "null" || is_delete_sub == "Unknown" || is_delete_sub == null || is_delete_sub == undefined || is_delete_sub == "") { }
                    else {
                        var sub_data = JSON.parse(is_delete_sub);
                        if (sub_data.length > 0) {
                            var module_name = sub_data[0].module_name;
                            if (module_name == '' || module_name == null || module_name == undefined) { }
                            else {
                                del_subflow_str += '<a style="width:97%"><details class="cls_remove">';
                                if (sub_data.length == 1) {
                                    del_subflow_str += '<summary>media files missing in 1 sub flow - Tap to view</summary><ul class="media_ui">';
                                }
                                else {
                                    del_subflow_str += '<summary>media files missing in ' + sub_data.length + ' sub flows - Tap to view</summary><ul class="media_ui">';
                                }
                                for (dm = 0; dm < sub_data.length; dm++) {
                                    var module_name = sub_data[dm].module_name;
                                    del_subflow_str += '<li class="media_li"><span class="mk_rounded_number theme_login_info_div_content">' + (dm + 1) + '</span> ' + module_name + '</li>';
                                }
                                del_subflow_str += '</ul></details></a>';
                            }
                        }
                    }

                    // check for invalid log for task
                    var valid_log_str = '';
                    //var is_valid_log = '[{"c_name":"Demo Checksheet Name","s_name":"Demo Step Name","type":2,"que_id":91,"name":"Modules Fan"}, {"c_name":"Demo Checksheet Name1","s_name":"Demo Step Name1","type":2,"que_id":92,"name":"Modules Fan1"}]';
                    if (is_valid_log == "[]" || is_valid_log == "null" || is_valid_log == "Unknown" || is_valid_log == null || is_valid_log == undefined || is_valid_log == "") { }
                    else {
                        var log_data = JSON.parse(is_valid_log);
                        if (log_data.length > 0) {
                            var checksheet_name = log_data[0].c_name;
                            dlt_media_chksht_type = log_data[0].checksheet_type;
                            if (checksheet_name == '' || checksheet_name == null || checksheet_name == undefined) { }
                            else {
                                valid_log_str += '<a style="width:97%;"><details class="cls_remove">';
                                if (log_data.length == 1) {
                                    valid_log_str += '<summary>1 invalid log found - Tap to view</summary><ul class="media_ui">';
                                }
                                else {
                                    valid_log_str += '<summary>' + log_data.length + ' invalid logs found - Tap to view</summary><ul class="media_ui">';
                                }
                                for (dm = 0; dm < log_data.length; dm++) {
                                    var checksheet_name = log_data[dm].c_name;
                                    var step_name = log_data[dm].s_name;
                                    var cntrl_name = log_data[dm].name;
                                    var que_id = log_data[dm].que_id;

                                    valid_log_str += '<li class="media_li"><span class="mk_rounded_number theme_login_info_div_content">' + (dm + 1) + '</span> ' + checksheet_name + ' > ' + step_name + '</li>';
                                    valid_log_str += '<li class="media_li" style="margin-left: 25px;padding:0 0 5px;line-height:14px;">' + ' > (' + que_id + ') ' + cntrl_name + '</li>';
                                }
                                valid_log_str += '</ul></details></a>';
                            }
                        }
                    }

                    //if (del_media_str != "" && task_editable == "true") {
                    if (dlt_media_chksht_type == "5") {
                        //editable task for task form only
                        var param = "get_tid_for_task_edit_onlline(" + ser_task_id + ", '" + task_status + "')"
                    }
                    else {

                        if (task_listing_url == "" || task_listing_url == null || task_listing_url == undefined) {
                            var param = "redirect_on_pm_site_click_online('" + siteid + "','" + site_name + "', '" + ser_task_id + "', '" + task_status + "','" + module_id + "', '" + module_name + "','" + task_update + "', '" + site_lat + "', '" + site_long + "', '" + survey_date + "', '" + ser_milli + "')";
                        }
                        else {
                            var param = "redirect_on_transport_site_click('" + siteid + "','" + site_name + "', '" + ser_task_id + "', '" + task_status + "','" + module_id + "', '" + module_name + "','" + task_update + "', '" + site_lat + "', '" + site_long + "', '" + survey_date + "', '" + ser_milli + "')";
                        }

                    }

                    if (task_clickable == 'false' || task_clickable == 'disable_all') {
                        param = clickable_param;
                    }

                    var upload_pending_str = '';
                    if (upload_pending_display != "false") {
                        if (is_upload_pending == 1) {
                            // upload pending task
                            upload_pending_str += "<div style='border:1px solid black; margin-top:8px; padding:2px; width:100%; background-color:white; color:#32cd32; border-top: 1px solid #32cd32; border-bottom: 1px solid #32cd32; text-align:center'>Task is uploading...</div>";
                            upload_pending_count++;
                        }
                    }

                    var list_item = '<li value="' + rate + '" id ="lst_' + tid + '" onclick ="' + param + '" class="' + cls_task_layout + '" style="background-color:'
                        + back_color + '">' + upload_pending_str + ' ' + del_media_str + ' ' + del_log_str + ' ' + del_subflow_str + ' ' + valid_log_str + '<a class="item-link item-content swipeout-content"><div class="item-inner item-no-pad"><div class="item-title">';

                    list_item += '<label style="font-size:10pt; font-weight:bold" class="cls_search">' + staticdata + ' : ' + (i + 1) + '</label>';

                    list_item += '</div></div></a>';

                    //delete sub task
                    var task_remove_str = '';
                    var flow_Array = JSON.parse(storage.getItem('flow_Array'));
                    if (flow_Array.length > 1 && task_removable == 'true') {
                        var param_remove_sub = "remove_last_subtask_online('" + ser_task_id + "', '" + task_status + "')";
                        //var param_remove_sub = "update_server_task_entry_online_SB('" + ser_task_id + "')";
                        //list_item += '<div style="display:none" class="swipeout-actions-right" id="img_remove_' + i + '"><a href="#" class="swipeout-delete cls_remove" onclick ="' + param_remove_sub + '">Delete</a></div>';
                        task_remove_str += '<a id="img_remove_' + i + '" href="#" class="swipeout-delete cls_remove" onclick ="' + param_remove_sub + '">Delete</a>';
                    }

                    var task_edit_str = '';
                    if (task_editable == "true") {
                        var param_edit_task = "get_tid_for_task_edit_onlline(" + ser_task_id + ", '" + task_status + "')"
                        task_edit_str += '<a id="btn_task_edit_' + ser_task_id + '"  onclick="' + param_edit_task + '" style="transform: translate3d(0, 0px, 0px);">Edit</a>';
                    }

                    if (task_editable == 'true' || task_removable == 'true') {
                        list_item += '<div class="swipeout-actions-right" style="right: 0% !important;">';
                        list_item += task_edit_str;
                        list_item += task_remove_str;
                        list_item += '</div>';
                    }

                    // display task info on swipe to right
                    var info_param = "view_task_details_from_task_master(" + ser_task_id + ", '')";
                    list_item += '<div class="swipeout-actions-left">';
                    list_item += '<a href="#" class="action1" onclick="' + info_param + '">Details</a>';
                    list_item += '</div>';

                    list_item += '</li>';
                    $("#site_list").append(list_item);

                    $('.cls_remove').click(function (event) {
                        event.stopPropagation();
                    });

                    var count = i + 1;
                    //if (count == myArray_main.length) {
                    $("#img_remove_" + i + "").show();
                    $("#site_list > li").last().addClass("swipeout");
                    //}
                }
                //}
            }

            var ul_length = $("#site_list > li").length;
            if (ul_length == 0) {
                //$("#survey_td_1").html("Total : 0");
                var list_item = '<li><a href="#" class="item-link item-content"><div class="item-inner item-no-pad"><div class="item-title">No Record Found !</div></div></a></li>';
                $("#site_list").append(list_item);
            }

            if (bulk_approval == 'true') {
                //$("#site_list li").on('taphold', function () {
                //    $(this).find('input[name="li_chk"]').prop('checked', true);
                //    get_selected_chk_count();
                //    show_bulk_approval_panel();
                //});

                $("#site_list li").on('touchstart', function () {
                    var count = 0;
                    touchCounter = setInterval(function () {
                        count++;
                        if (count == 1) {
                            //alert('touch lasted 3 seconds');
                            $(this).find('input[name="li_chk"]').prop('checked', true);
                            get_selected_chk_count();
                            show_bulk_approval_panel();
                        }
                    }, 1000);
                });

                $("#site_list li").on('touchend', function () {
                    clearInterval(touchCounter);
                    touchCounter = null;
                });

                var len = bulk_approval_status.length;
                var btn_str = '';
                if (buttons == '' || buttons == null || buttons == undefined || buttons.length == 0) {
                    var len = bulk_approval_status.length;
                    for (b = 0; b < len; b++) {
                        var name = bulk_approval_status[b].name;
                        var status = bulk_approval_status[b].status;
                        btn_str += '<a href="#" class="link" onclick="send_bulk_approval_online(' + status + ')">' + name + '</a>';
                    }
                }
                else {
                    var bulk_approval_status = buttons;
                    var len = bulk_approval_status.length;
                    for (b = 0; b < len; b++) {
                        var name = bulk_approval_status[b].name;
                        var status = bulk_approval_status[b].status;
                        var bulk_approval_checksheet = bulk_approval_status[b].checksheet_id;
                        btn_str += '<a href="#" id="btn_' + name + '" class="link" onclick="send_bulk_approval_online(' + status + ', ' + bulk_approval_checksheet + ')">' + name + '</a>';
                    }
                }

                $("#div_bulk_btn").empty();
                $("#div_bulk_btn").append(btn_str);
            }

            var crash_status = JSON.parse(storage.getItem('crash_status'));
            if (crash_status == null || crash_status == undefined || crash_status == '') {
                crash_status = 0;
            }
            if (crash_status == 2) {
                // application has been crashed
                storage.setItem('crash_status', JSON.stringify('0'));
            }

            var li_length = $("#site_list > li:not(:hidden)").length;
            var f_li_text = $('#site_list > li:first').text();
            if (li_length == 1 && f_li_text == 'No Record Found !') {
                li_length = 0;
            }
            $(".op-show-btns").show();
            $("#tabCount_" + active_Tab + "").html(li_length);
            $("#tabCount_" + active_Tab + "").addClass('numberCircle');
            if (li_length > 99) {
                $("#tabCount_" + active_Tab + "").css('width', '22px');
            }
            //$("#survey_td_1").html("Total : " + li_length + "");

            if (li_length >= limit_range) {
                $("#btn_SeeAll").show();
                $("#btn_SeeMore").show();

                $("#tab1").scroll(function () {
                    var offsetHeight = document.getElementById("tab1").offsetHeight;
                    var scrollTop = document.getElementById("tab1").scrollTop;
                    var scrollHeight = document.getElementById("tab1").scrollHeight;

                    // added 2nd or condition as show more not callled due to 1 pixel change 29112022
                    if (parseInt(scrollTop) === (parseInt(scrollHeight) - parseInt(offsetHeight)) || parseInt(scrollTop) === (parseInt(scrollHeight) - parseInt(offsetHeight) - 1)) {
                        see_more_site_list_common();
                    }
                });
            }
            else {
                $("#btn_SeeAll").hide();
                $("#btn_SeeMore").hide();
            }

            if (curr_btn_mode == "updatetasknautoopentaskform" && create_task == "true") {

            }
        }
        else if (status == 2) {
            $("#tab1").unbind('scroll');
            var li_length = $("#site_list > li:not(:hidden)").length;
            if (li_length == 0) {
                //$("#survey_td_1").html("Total : 0");
                $("#tabCount_" + active_Tab + "").html(0);
                $("#tabCount_" + active_Tab + "").addClass('numberCircle');
                var list_item = '<li><a href="#" class="item-link item-content"><div class="item-inner item-no-pad"><div class="item-title">No Record Found !</div></div></a></li>';
                $("#site_list").append(list_item);

                var auto_open_task_form_no_task = list_data[0].auto_open_task_form_no_task;
                if (auto_open_task_form_no_task == "" || auto_open_task_form_no_task == null || auto_open_task_form_no_task == undefined) {
                    auto_open_task_form_no_task = "false;"
                }

                if (auto_open_task_form_no_task == 'true' && create_task == "true") {
                    create_new_task();
                }
            }
        }
        else {
            $("#tab1").unbind('scroll');
            var li_length = $("#site_list > li:not(:hidden)").length;
            if (li_length == 0) {
                //$("#survey_td_1").html("Total : 0");
                $("#tabCount_" + active_Tab + "").html(0);
                $("#tabCount_" + active_Tab + "").addClass('numberCircle');
                var list_item = '<li><a href="#" class="item-link item-content"><div class="item-inner item-no-pad"><div class="item-title">No Record Found !</div></div></a></li>';
                $("#site_list").append(list_item);
            }
            var message = myArray_main[0].message;
            alert1(message);
        }

        var sub_task_limit = list_data[0].sub_task_limit;
        if (sub_task_limit == '' || sub_task_limit == null || sub_task_limit == undefined) {
            sub_task_limit = 1000;
        }

        var main_task_limit = list_data[0].main_task_limit;
        if (main_task_limit == '' || main_task_limit == null || main_task_limit == undefined) {
            main_task_limit = 1000;
        }

        var flag = 0;
        var f_li_text = $('#site_list > li:first').text();
        if (sub_task_limit == 1 && f_li_text == 'No Record Found !' || main_task_limit == 1 && f_li_text == 'No Record Found !') {
            flag = 1;
        }

        if ((li_length >= sub_task_limit || li_length >= main_task_limit) && flag == 0) {
            $("#btn_Create_Task").hide();
        }
        else {
            setTimeout(function () {
                var data_json = JSON.parse(storage.getItem('list_json'));
                var list_data = JSON.parse(data_json);
                var task_value = list_data[0].task;
                if (task_value == "true") {
                    $("#btn_Create_Task").show();
                }
            }, 500);
        }

        var is_subflow = localStorage.getItem('is_subflow');
        if (is_subflow == 'true' && flow_Array.length > 1) {

            // custom development for telefonica
            var loc_flow_update = JSON.parse(storage.getItem('loc_flow_update'));
            if (company_id == '1238') {
                if (loc_flow_update == "false" || loc_flow_update == "" || loc_flow_update == null || loc_flow_update == undefined) {
                    var view_submit_button = list_data[0].view_submit_button;
                    if (view_submit_button == 'false') { }
                    else {
                        $("#btn_Submit").show();
                    }
                }
            }
            else {
                var view_submit_button = list_data[0].view_submit_button;
                if (view_submit_button == 'false') { }
                else {
                    // add dynamic Submit button text pending messge DV-09082024
                    var view_submit_button_text = list_data[0].view_submit_button_text;
                    if (view_submit_button_text == '' || view_submit_button_text == null || view_submit_button_text == undefined) {
                        view_submit_button_text = 'Submit';
                    }
                    $('#btn_Submit').html(view_submit_button_text);

                    // center submit button logic in sub task listing - mk - 28032025  
                    var all_count = $("#site_list > li").length;
                    var completed_count = $("#site_list > li[value='2']").length;
                    var diff_count = all_count - completed_count;

                    var sub_task_min_limit = list_data[0].sub_task_min_limit;
                    if (sub_task_min_limit == '' || sub_task_min_limit == null || sub_task_min_limit == undefined) {
                        sub_task_min_limit = 0;
                    }
                    else {
                        var value_type = sub_task_min_limit.substring(2, 1);
                        if (value_type == "#") {
                            // get sub_task_min_limit from system var
                            var req_key = sub_task_min_limit.substring(2, sub_task_min_limit.length - 2);
                            var type20_columndata = JSON.parse(storage.getItem('type20_columndata'));
                            for (c = 0; c < type20_columndata.length; c++) {
                                var key = type20_columndata[c].header;
                                if (key == req_key) {
                                    sub_task_min_limit = type20_columndata[c].ans;
                                    break;
                                }
                            }
                        }
                    }

                    if ((sub_task_min_limit == 1 && f_li_text == 'No Record Found !') || (sub_task_min_limit > 1 && all_count < sub_task_min_limit)) {
                        // minimum sub tasks are required

                        $("#btn_Submit").hide();
                    } else {
                        if (diff_count == 0 || (diff_count == 1 && f_li_text == 'No Record Found !')) {
                            // all sub tasks are completed

                            $("#btn_Submit").show();

                        } else {
                            // sub tasks are pending
                            $("#btn_Submit").hide();
                        }
                    }
                }
            }
        }

        loading_hide();
        clearInterval(label_timer); // stop_refreshing_label_change_timer
        storage.setItem('ref_flow_status', JSON.stringify('0'));

        clearTimeout(online_task_refresh_timer);
        online_task_refresh_timer = setTimeout(function () {
            if (upload_pending_count > 0) {
                //for upload pending task, refresh task-listing
                $("#site_list").empty();
                get_list_of_task_for_compare_online();
            }
        }, 60000);

        if (F7_device == 'ios') {
            setTimeout(function () {
                if (bgcolor == '' || bgcolor == null || bgcolor == undefined) {
                    $(".cls_search a").css("color", "black");
                }
                else {
                    $(".cls_search a").css("color", "white");
                }
            }, 3000);
        }

        if (curr_btn_mode == 'updatetasknsubmit') {
            var auto_open_task_form = list_data[0].auto_open_task_form;
            if (auto_open_task_form == 'true') {
                var auto_open_confirm_msg = list_data[0].auto_open_confirm_msg;
                if (auto_open_confirm_msg == "" || auto_open_confirm_msg == null || auto_open_confirm_msg == undefined) {
                    auto_open_confirm_msg = "Are you sure, you want to create new task?";
                }
                vibrate_device();
                var user_choice = confirm(auto_open_confirm_msg);
                if (user_choice == true) {
                    // auto open task form
                    select_network_for_create_task();
                }
                else {
                    get_list_of_UP_sites_count();
                }
            }
            else {
                get_list_of_UP_sites_count();
            }
        }
        else if (curr_btn_mode == 'updatetasknautoopentaskform') {
            storage.setItem('curr_btn_mode', JSON.stringify(''));
            var auto_open_confirm_msg = list_data[0].auto_open_confirm_msg;
            if (auto_open_confirm_msg == "" || auto_open_confirm_msg == null || auto_open_confirm_msg == undefined) {
                auto_open_confirm_msg = "Are you sure, you want to create new task?";
            }
            vibrate_device();
            var user_choice = confirm(auto_open_confirm_msg);
            if (user_choice == true) {
                // auto open task form
                select_network_for_create_task();
            }
            else {
                get_list_of_UP_sites_count();
            }
        }
        else {

            let type37_len = $("div[id^='div_subtask_']").length;
            if (type37_len == 0) {
                get_list_of_UP_sites_count();
            }
        }
    } catch (e) {
        alert1(e + '_onsuccess_get_list_of_pm_sites_online()');

        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var task_value = list_data[0].task;
        if (task_value == "true") {
            $("#btn_Create_Task").show();
        }
        loading_hide();
    }
}

function remove_last_subtask_online(ser_task_id, selected_start_status) {
    try {
        if (F7_device == 'ios') {
            var user_choice = true;
        }
        else {
            vibrate_device();
            var user_choice = confirm("Are you sure, you want to remove this task ?");
        }
        if (user_choice == true) {
            loading();
            localStorage.setItem('task_mode', 'delete');
            storage.setItem('start_status', JSON.stringify(selected_start_status));
            storage.setItem('end_status', JSON.stringify('-1'));
            //update_server_task_entry_online_SB(ser_task_id);      
            stop_trip_on_task_delete(ser_task_id);
        }
    }
    catch (e) {
        alert1(e + '_remove_last_subtask_online');
    }
}

stop_trip_on_task_delete = (ser_task_id) => {
    var query = "select tid from task_master where server_task_id = '" + ser_task_id + "'";
    var q_jsonobj = [];
    q_jsonobj.push({
        data: query,
        p: "1"
    });
    cordova.exec(function (e) {

        update_server_task_entry_online_SB(ser_task_id);

        var myArray = JSON.parse(e);
        var trip_tid = myArray[0].tid;
        var q_jsonobj = [];
        q_jsonobj.push({
            'trip_status': "-1",
            'tid': trip_tid,
            'odometer_point': [],
            'ETA': "",
            'stillviolation_event': ""
        });
        cordova.exec(function (e) { }, function (e) { }, 'TripPlugin', 'anAction', q_jsonobj);

    }, function (e) {
        // tid not found
        update_server_task_entry_online_SB(ser_task_id);

    }, 'SqlitePlugin', 'showValues', q_jsonobj);
}



function view_customer_detail_task(cust_id) {
    try {
        var Param_obj = [];
        Param_obj.push({ 'customer_id': cust_id });

        var getdata = new Webservicecall_REST(global_wcf_url + 'GetCustomerData', JSON.stringify(Param_obj), onsuccess_view_customer_detail_task, onfail_view_customer_detail_task);
        getdata.callOtherDomain();
    }
    catch (e) {
        alert1(e + '_view_customer_detail_task');
    }
}

function onsuccess_view_customer_detail_task(e) {
    try {
        var Data_Json = e.responseText;
        Data_Json = eval('(' + Data_Json + ')');
        var status = Data_Json[0].status;

        if (status == 1) {
            var data = Data_Json[0].data;
            if (data == "" || data == null || data == undefined) { }
            else {
                var json = data;
                if (json == "" || json == null || json == undefined) { }
                else {
                    myApp.popup('.popup-cust_info');
                    $('#myDynamicTable').empty();

                    var info_tbl_str = '<table id= "view_detail" style="width:100% !important;word-break: break-all;" border=1><tbody>';
                    info_tbl_str += '</tbody></table>';
                    $('#myDynamicTable').html(info_tbl_str);

                    var table = $('#view_detail');
                    $(table).addClass('mk_table');

                    var td_val = Array.isArray(json);
                    if (td_val == true) { }
                    else {
                        json = JSON.parse(json);
                    }
                    $.each(json, function (ind_row, val) {
                        $.each(val, function (ind_cell, val_cell) {
                            if (ind_cell == "icon_base64") { }
                            else {
                                var td_val = Array.isArray(val_cell);
                                if (td_val == true) {
                                    // array
                                    var firstElem = val_cell[0];
                                    if (typeof firstElem == "object") {
                                        //Json
                                        var json1 = JSON.stringify(val_cell);
                                        var str = "build_innert_table('" + ind_cell + "')";
                                        var param_str = "hide_plus_btn('" + ind_cell + "')";
                                        col = $("<tr><td style='font-weight:bold;padding: 3px 5px;widht: 50%;'>" + ind_cell + "</td><td style='width: 50%;padding: 3px 5px;'><table id='tbl_" + ind_cell + "' class='mk_table'></table><button type='button' class='fn_btn' onclick=" + str + " value='Add Push Array' id='plus_" + ind_cell + "'><img src='Images/EF_Images/add_new_rdo.png' style='height: 20px; width: 20px;'></button><button type='button' class='fn_btn' onclick=" + param_str + " style='display: none; margin-left:1px;margin-top: 3px;' value='Add Push Array' id='minus_" + ind_cell + "''><i class='fa fa-minus-circle' aria-hidden='true'></i></button><input type='hidden'id='hdn_" + ind_cell + "' value='" + JSON.stringify(json1) + "'></td></tr>");
                                    } else {
                                        //Not Json
                                        if (val_cell.length == 0) {
                                            col = $("<tr><td>" + ind_cell + "</td><td></td></tr>");
                                        }
                                        else {
                                            col = $("<tr><td style='font-weight:bold;padding: 3px 5px;widht: 50%;'>" + ind_cell + "</td><td style='width: 50%;padding: 3px 5px;'>" + val_cell.toString() + "</td></tr>");
                                        }
                                    }
                                    table.append(col);
                                } else {
                                    // string
                                    if (val_cell == "" || val_cell == null || val_cell == undefined) {
                                        col = $("<tr><td>" + ind_cell + "</td><td></td></tr>");
                                    }
                                    else {
                                        col = $("<tr><td style='font-weight:bold;padding: 3px 5px;widht: 50%;'>" + ind_cell + "</td><td style='width: 50%;padding: 3px 5px;'>" + val_cell + "</td></tr>");
                                        table.append(col);
                                    }
                                }
                            }
                        })
                    })


                }
            }

            /// ------------- Old code structure--------------///

            //if (data == "" || data == null || data == undefined) {
            //    var myArray = eval('(' + Data_Json[0].message + ')');
            //}
            //else {
            //    var myArray = JSON.parse(data);
            //}

            //var customer_data = JSON.parse(myArray[0].customerdata);
            //if (customer_data == "" || customer_data == null || customer_data == undefined) { }
            //else {
            //    myApp.popup('.popup-cust_info');
            //    $('#myDynamicTable').empty();
            //    var info_tbl_str = '<table style="width:100% !important;word-break: break-all;" border=1><tbody>';

            //    for (var i = 0; i < customer_data.length; i++) {
            //        var type = customer_data[i].type;
            //        if (type == 0 || type == 5 || type == 10) { }
            //        else {
            //            var header = customer_data[i].prop[0].name;
            //            var value = customer_data[i].ans[0];

            //            if (type == 22) {
            //                value = "[Invoice Data]";
            //            }
            //            else if (type == 1) {
            //                var misc_Array = customer_data[i].prop[0].misc_data;
            //                var prop_value = misc_Array[0].value;
            //                if (prop_value == '' || prop_value == null || prop_value == undefined) {
            //                    var box_type = "";
            //                }
            //                else {
            //                    prop_value = itemObj._checkStrObj(misc_Array[0].value);  // check_item
            //                    var box_type = prop_value[0].box_type;
            //                }

            //                if (box_type == "password") {
            //                    value = "*****";
            //                }

            //            }
            //            info_tbl_str += '<tr><td style="font-weight:bold;padding: 3px 5px;widht: 50%;">' + header + '</td><td style="width: 50%;padding: 3px 5px;">' + value + '</td></tr>';
            //        }
            //    }

            //    info_tbl_str += '</tbody></table>';
            //    $('#myDynamicTable').html(info_tbl_str);
            //}           
        }
        else {
            alert1(Data_Json[0].message);
        }
    }
    catch (e) {
        alert1(e + '_onsuccess_view_customer_detail_task');
    }
}

function onfail_view_customer_detail_task(e) {
    alert1(e + '_onfail_view_customer_detail_task');
}

// redirect page on pm site click when user near from site
function redirect_on_pm_site_click_online(selected_site, selected_site_name, selected_server_task_id, selected_start_status, selected_moduleid, selected_modulename, t_task_update, t_site_lat, t_site_long, t_survey_date, t_millisecond) {
    localStorage.setItem('ID_useType22', selected_server_task_id);
    localStorage.setItem('task_mode', 'click');

    //if (selected_start_status == '2') {
    //    alert1("This task is already submitted !");
    //}
    //else {
    var data_json = JSON.parse(storage.getItem('list_json'));
    var list_data = JSON.parse(data_json);
    var check_max_site_survey = list_data[0].check_max_site_survey;
    if (check_max_site_survey == "true") {

        var max_site_survey_count = list_data[0].max_site_survey_count;

        var param_obj = [];
        param_obj.push({
            "Count_": max_site_survey_count,
            "Flow_id": selected_moduleid,
            "customer_id": selected_site,
            "status": selected_start_status
        });

        loading();
        var getdata = new Webservicecall_REST(global_wcf_url + 'Task_Restriction', JSON.stringify(param_obj), function (e) {
            var responseText = JSON.parse(e.responseText);
            var status = responseText[0].status;
            var message = responseText[0].message;

            if (status == 1) {
                redirect_on_pm_site_click_online_new(selected_site, selected_site_name, selected_server_task_id, selected_start_status, selected_moduleid, selected_modulename, t_task_update, t_site_lat, t_site_long, t_survey_date, t_millisecond);
            }
            else {
                alert1(message);
                loading_hide();
            }
        }, onfail);
        getdata.callOtherDomain();
    }
    else {
        redirect_on_pm_site_click_online_new(selected_site, selected_site_name, selected_server_task_id, selected_start_status, selected_moduleid, selected_modulename, t_task_update, t_site_lat, t_site_long, t_survey_date, t_millisecond);
    }
    //}
}

function redirect_on_pm_site_click_online_new(selected_site, selected_site_name, selected_server_task_id, selected_start_status, selected_moduleid, selected_modulename, t_task_update, t_site_lat, t_site_long, t_survey_date, t_millisecond) {
    var data_json = JSON.parse(storage.getItem('list_json'));
    var list_data = JSON.parse(data_json);
    var geofance_flag = list_data[0].geofence[0].value;
    if (geofance_flag == "true") {
        // With geo fencing

        var locObj = new MkLocation();
        locObj._getLocation(function (e) {
            var user_lat = e[0].lat;
            var user_long = e[0].long;
            var user_accuracy = e[0].accuracy;
            user_accuracy = parseInt(user_accuracy);

            var distance = getDistanceFromLatLonInMeter(user_lat, user_long, t_site_lat, t_site_long);
            distance = parseInt(distance);

            var survey_mode = list_data[0].survey_mode;
            if (survey_mode == "online") {
                var columndata_str = $('#lst_sys_var_' + selected_server_task_id + '').val();
            }
            else {
                var selected_tid = JSON.parse(storage.getItem('tid'));
                var columndata_str = $('#lst_sys_var_' + selected_tid + '').val();
            }
            var columndata_Array = JSON.parse(decodeURIComponent(columndata_str));

            var SitewiseRadius = get_sitewise_radius_from_columndata(columndata_Array);
            if (SitewiseRadius == "" || SitewiseRadius == null || SitewiseRadius == undefined || SitewiseRadius == 0) {
                var geofanceradius = parseInt(list_data[0].geofanceradius);
            }
            else {
                var geofanceradius = parseInt(SitewiseRadius);
            }

            if (distance < (geofanceradius + user_accuracy)) {
                // site is in radius

                localStorage.setItem('is_shortcutbutton', 'false');
                loading();

                //redirect_on_pm_site_click_online_POST(selected_site, selected_site_name, selected_server_task_id, selected_start_status, selected_moduleid, selected_modulename, t_task_update, t_site_lat, t_site_long, t_survey_date, t_millisecond);
                redirect_on_pm_site_click_online_POST_geofence(selected_site, selected_site_name, selected_server_task_id, selected_start_status, selected_moduleid, selected_modulename, t_task_update, t_site_lat, t_site_long, t_survey_date, t_millisecond, user_accuracy, geofanceradius);
            } else {
                // site is not in radius
                // in case when user 
                alert1("You are far from site!");
                $("#site_list").empty();
                get_list_of_task_for_compare_online();
            }
        });
    }
    else {
        // Without geo fencing
        localStorage.setItem('is_shortcutbutton', 'false');
        loading();

        redirect_on_pm_site_click_online_POST(selected_site, selected_site_name, selected_server_task_id, selected_start_status, selected_moduleid, selected_modulename, t_task_update, t_site_lat, t_site_long, t_survey_date, t_millisecond);
    }
}

var glob_taskclick_ary = [];
function redirect_on_pm_site_click_online_POST_geofence(selected_site, selected_site_name, selected_server_task_id, selected_start_status, selected_moduleid, selected_modulename, t_task_update, t_site_lat, t_site_long, t_survey_date, t_millisecond, accuracy, radius) {
    try {
        var company_id = JSON.parse(storage.getItem('company_id'));
        var Support_Details = JSON.parse(storage.getItem('support_refrences1'));

        storage.setItem('user_accuracy', JSON.stringify(accuracy));
        storage.setItem('user_radius', JSON.stringify(radius));

        glob_taskclick_ary = [];
        glob_taskclick_ary.push({
            'site_id': selected_site,
            'site_name': selected_site_name,
            'server_task_id': selected_server_task_id,
            'start_status': selected_start_status,
            'moduleid': selected_moduleid,
            'modulename': selected_modulename,
            'task_update': t_task_update,
            'site_lat': t_site_lat,
            'site_long': t_site_long,
            'survey_date': t_survey_date,
            'millisecond': t_millisecond,
            'accuracy': accuracy,
            'radius': radius
        });

        var param_obj = [];
        param_obj.push({
            'IMEI': imeino,
            'Company_Id': company_id,
            'Username': username,
            'Customer_Unique': selected_site_name,
            'Task_Id': selected_server_task_id,
            'site_lat': t_site_lat,
            'site_long': t_site_long,
            'Accuracy': accuracy,
            'Radius': radius,
            'Support_Details': Support_Details,
            'customer_id': selected_site
        });

        cordova.exec(onsuccess_get_green_site_data_online, onfail_get_green_site_data_online, 'SupportPageMapsPlugin_Green', 'anAction', param_obj);
    }
    catch (e) {
        alert1(e + '_redirect_on_pm_site_click_online_POST_geofence');
    }
}

function onsuccess_get_green_site_data_online(e) {
    try {
        var myArray = JSON.parse(e);
        var site_result = myArray[0].site_result;

        var selected_site = glob_taskclick_ary[0].site_id;
        var selected_site_name = glob_taskclick_ary[0].site_name;
        var selected_server_task_id = glob_taskclick_ary[0].server_task_id;
        var selected_start_status = glob_taskclick_ary[0].start_status;
        var selected_moduleid = glob_taskclick_ary[0].moduleid;
        var selected_modulename = glob_taskclick_ary[0].modulename;
        var t_task_update = glob_taskclick_ary[0].task_update;
        var t_site_lat = glob_taskclick_ary[0].site_lat;
        var t_site_long = glob_taskclick_ary[0].site_long;
        var t_survey_date = glob_taskclick_ary[0].survey_date;
        var t_millisecond = glob_taskclick_ary[0].millisecond;

        if (site_result == "green") {

            // add click waypoint if user click on any green task from geo fence task listing - mk - 30062025
            var locObj = new MkLocation();
            locObj._addWaypoint("task_click");

            redirect_on_pm_site_click_online_POST(selected_site, selected_site_name, selected_server_task_id, selected_start_status, selected_moduleid, selected_modulename, t_task_update, t_site_lat, t_site_long, t_survey_date, t_millisecond);
        }
        else {
            //------red-----
            var accuracy = JSON.parse(storage.getItem('user_accuracy'));
            var radius = JSON.parse(storage.getItem('user_radius'));

            var t_glob_taskclick_ary = JSON.stringify(glob_taskclick_ary);
            var t_new_column_obj = encodeURIComponent(t_glob_taskclick_ary);

            get_distance_confirmation_pm(selected_site, '', selected_moduleid, selected_modulename, selected_server_task_id, selected_site_name, user_lat, user_long, accuracy, radius, t_site_lat, t_site_long, t_new_column_obj);
        }
        loading_hide();
    } catch (e) {
        alert1(e + '_onsuccess_get_green_site_data_online');
        loading_hide();
    }
}

function onfail_get_green_site_data_online(e) {
    alert1(e + '_onfail_get_green_site_data_online');
    loading_hide();
}


// redirect page on pm site click when user near from site
var group_task_array = [];
function redirect_on_pm_site_click_online_POST(selected_site, selected_site_name, selected_server_task_id, selected_start_status, selected_moduleid, selected_modulename, t_task_update, t_site_lat, t_site_long, t_survey_date, t_millisecond) {
    try {

        // clear system variables on main task click 06052022
        var is_subflow = localStorage.getItem('is_subflow');
        if (is_subflow == 'true') { }
        else {
            storage.setItem('type20_columndata', JSON.stringify(''));
        }

        storage.setItem('site_lat', JSON.stringify(t_site_lat));
        storage.setItem('site_long', JSON.stringify(t_site_long));
        storage.setItem('curr_btn_mode', JSON.stringify(''));
        storage.setItem('siteid', JSON.stringify(selected_site));
        storage.setItem('sitename', JSON.stringify(selected_site_name));
        storage.setItem('type20_cust_id', JSON.stringify(selected_site));
        storage.setItem('type20_cust_name', JSON.stringify(selected_site_name));
        storage.setItem('server_task_id', JSON.stringify(selected_server_task_id));
        var flow_Array = JSON.parse(storage.getItem('flow_Array'));
        if (flow_Array.length == 1) {
            storage.setItem('p_server_task_id', JSON.stringify(selected_server_task_id));
        }
        //for 3 layer task structure [FT-16052025]
        flow_Array[flow_Array.length - 1].server_task_id = selected_server_task_id;
        storage.setItem('flow_Array', JSON.stringify(flow_Array));

        storage.setItem('start_status', JSON.stringify(selected_start_status));
        storage.setItem('wayflow', JSON.stringify(selected_moduleid));
        storage.setItem('wayflow_name', JSON.stringify(selected_modulename));
        storage.setItem('ser_task_update', JSON.stringify(t_task_update));
        set_common_localStorage('redirect_on_checksheet', 'true');

        var task_Dependency = [];
        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var staticdata = list_data[0].staticdata;
        if (staticdata == "" || staticdata == null || staticdata == undefined) {
            var survey_mode = list_data[0].survey_mode;
            if (survey_mode == "online") {
                var columndata_str = $('#lst_sys_var_' + selected_server_task_id + '').val();
            }
            else {
                var selected_tid = JSON.parse(storage.getItem('tid'));
                var columndata_str = $('#lst_sys_var_' + selected_tid + '').val();
            }
            var columndata_Array = JSON.parse(decodeURIComponent(columndata_str));

            if (flow_Array.length == 1) {
                storage.setItem('parent_type20_columndata', JSON.stringify(columndata_Array));
            }

            // mutfiflow as subflow 01122020
            var is_subflow = localStorage.getItem('is_subflow');
            if (is_subflow == 'true') {
                //var old_type20_columndata = JSON.parse(storage.getItem('type20_columndata'));
                //if (old_type20_columndata == '' || old_type20_columndata == null || old_type20_columndata == undefined) { }
                //else {
                //    columndata_Array = columndata_Array.concat(old_type20_columndata);
                //}

                var parent_type20_columndata = JSON.parse(storage.getItem('parent_type20_columndata'));
                columndata_Array = columndata_Array.concat(parent_type20_columndata);                           //save parent n only 1 sub task columndata [26072021]
            }

            storage.setItem('type20_columndata', JSON.stringify(columndata_Array));

            // store task dependency 14092020
            var columndata = list_data[0].columndata;
            for (c = 0; c < columndata.length; c++) {
                var col_dependency = columndata[c].dependency;
                if (col_dependency == "" || col_dependency == null || col_dependency == undefined) { }
                else {
                    var header = columndata[c].header;
                    for (h = 0; h < columndata_Array.length; h++) {
                        var t_header = columndata_Array[h].header;
                        if (header == t_header) {
                            var ele_ans = columndata_Array[h].ans;
                            break;
                        }
                    }

                    for (d = 0; d < col_dependency.length; d++) {
                        var dep_type = col_dependency[d].dep_type;
                        var dep_ans = col_dependency[d].dep_ans;
                        var dep_class = col_dependency[d].dep_class;
                        task_Dependency.push({
                            ele_type: "task",
                            ele_ans: ele_ans,
                            dep_type: dep_type,
                            dep_ans: dep_ans,
                            dep_class: dep_class
                        });
                    }
                }
            }
        }

        localStorage.setItem('task_Dependency', JSON.stringify(task_Dependency));

        var multiflow_list = list_data[0].multiflow_list;
        if (multiflow_list == '' || multiflow_list == null || multiflow_list == undefined) { }
        else {
            flow_Array[0].wayflow = selected_moduleid;
            storage.setItem('flow_Array', JSON.stringify(flow_Array));
        }

        // group task
        var group_task_column = list_data[0].group_task_column;
        if (group_task_column == "" || group_task_column == null || group_task_column == undefined) {
            group_task_array = [];
        }
        else {

            group_task_array = [];

            // find group column and value
            var group_value = '';
            var columndata_str = $('#lst_sys_var_' + selected_server_task_id + '').val();
            var columndata_Array = JSON.parse(decodeURIComponent(columndata_str));
            for (i = 0; i < columndata_Array.length; i++) {
                var header = columndata_Array[i].header;
                if (header == group_task_column) {
                    group_value = columndata_Array[i].ans;
                    break;
                }
            }

            // find tasks with same group value
            curr_all_data_20_Array = [];
            $("#site_list li").each(function () {
                var id_str = $(this).attr("id");
                var server_task_id = id_str.replace("lst_", "");
                var columndata_str = $('#lst_sys_var_' + server_task_id + '').val();
                var columndata_Array = JSON.parse(decodeURIComponent(columndata_str));
                for (i = 0; i < columndata_Array.length; i++) {
                    var header = columndata_Array[i].header;
                    if (header == group_task_column) {
                        var cell_val = columndata_Array[i].ans;
                        if (cell_val == group_value) {

                            group_task_array.push(server_task_id);

                            curr_all_data_20_Array.push({
                                'server_task_id': server_task_id,
                                'columndata': columndata_Array
                            });

                        }
                        break;
                    }
                }
            });


            localStorage.setItem("curr_all_data_20_Array", JSON.stringify(curr_all_data_20_Array));
            localStorage.setItem("group_task_array", JSON.stringify(group_task_array));
        }


        // new logic (online task will possible for single user and will never update - 20122018 [remove update process])
        var myArray = [{
            'server_task_id': selected_server_task_id,
            'siteid': selected_site,
            'site_name': selected_site_name,
            'lat': t_site_lat,
            'long': t_site_long,
            'status': selected_start_status,
            'survey_date': t_survey_date,
            'millisecond': t_millisecond
        }];
        //alert1("myArray: " + JSON.stringify(myArray));
        storage.setItem('online_task_details', JSON.stringify(myArray));

        check_task_entry(selected_server_task_id);
    } catch (e) {
        alert1(e + '_redirect_on_pm_site_click_online_POSt()');
        loading_hide();
    }
}

function onfail_get_list_of_pm_sites_online(e) {
    $("#site_list").empty();
    //$("#survey_td_1").html("Total : 0");
    $("#tabCount_" + active_Tab + "").html(0);
    $("#tabCount_" + active_Tab + "").addClass('numberCircle');
    //var list_item = '<li><a href="#" class="item-link item-content"><div class="item-inner item-no-pad"><div class="item-title">Network Error! Press Refresh Button !</div></div></a></li>';
    var list_item = '<li><a href="#" class="item-link item-content"><div class="item-inner item-no-pad"><div class="item-title">Your internet connection is poor or disconnected . Please re-try once you back online.</div></div></a></li>';

    $("#site_list").append(list_item);

    var data_json = JSON.parse(storage.getItem('list_json'));
    var list_data = JSON.parse(data_json);
    var task_value = list_data[0].task;
    if (task_value == "true") {
        $("#btn_Create_Task").show();
    }
    get_list_of_UP_sites_count();
    loading_hide();
}



function check_task_entry(server_task_id) {
    try {
        var query = "select status, srnumber, global_var from task_master where server_task_id = '" + server_task_id + "'";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "1"
        });
        cordova.exec(onsuccess_check_task_entry, onfail_check_task_entry, 'SqlitePlugin', 'showValues', q_jsonobj);
    } catch (e) {
        alert1(e + '_check_survey_entry()');
        loading_hide();
    }
}
function onsuccess_check_task_entry(e) {
    //alert1("Old Task Entry Found ! - Update Task details...");
    //update_online_task(e);

    var myArray = JSON.parse(e);
    if (myArray.length > 0) {
        //alert1("Old Task Entry Found ! - Update Task details...");
        update_online_task(e);
    }
    else {
        //alert1("Old Task Entry Not Found ! Insert Task details...");
        insert_online_task();
    }
}
function onfail_check_task_entry(e) {
    //alert1("Old Task Entry Not Found ! Insert Task details...");
    insert_online_task();
}

function insert_online_task() {
    try {
        var task_details = JSON.parse(storage.getItem('online_task_details'));
        var user_id = JSON.parse(storage.getItem('user_id'));
        var user_name = JSON.parse(storage.getItem('username'));

        var assign_date = task_details[0].survey_date;
        var survey_date = task_details[0].survey_date;
        var millisecond = task_details[0].millisecond;
        var task_id = imeino + "_" + millisecond;
        var server_task_id = task_details[0].server_task_id;
        var site_id = task_details[0].siteid;
        var site_name = task_details[0].site_name;
        var lat = task_details[0].lat;
        var long = task_details[0].long;
        var status = task_details[0].status;

        var check_type_str = storage.getItem('check_type_task');
        if (F7_device == 'ios') {
            checksheetid = check_type_str;
        }
        else {
            checksheetid = check_type_str.substring(1, check_type_str.length - 1);
        }
        var moduleid = JSON.parse(storage.getItem('wayflow'));
        var module_name = JSON.parse(storage.getItem('wayflow_name'));

        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var match_temp_id = list_data[0].match_temp_id;
        if (match_temp_id == "" || match_temp_id == null || match_temp_id == undefined) {
            match_temp_id = "";
        }
        var p_match_temp_id = localStorage.getItem('p_match_temp_id');
        var columndata = $("#lst_sys_var_" + server_task_id + "").val();
        columndata = decodeURIComponent(columndata);

        // in case any answer inside columndata consist single quotes from string - mk - 16102024
        columndata = columndata.replace(/'/g, "");

        let t_global_var = $("#lst_global_var_" + server_task_id + "").val();
        t_global_var = decodeURIComponent(t_global_var);

        var query = "INSERT INTO task_master (task_id ,server_task_id, flag, user_id, username, rate, siteid, site_name, percentage, survey_date,lat,long,inspect_count,checksheetid,height,step,status,upload_date,millisecond,moduleid,module_name,srnumber, is_down_complete, match_temp_id, p_match_temp_id, columndata, global_var) VALUES('"
            + task_id + "','" + server_task_id + "','2','" + user_id + "','" + user_name + "','0','" + site_id + "','" + site_name + "','0','" + survey_date + "','" + lat + "','" + long + "','0','" + checksheetid + "','0','0','"
            + status + "','" + assign_date + "','" + millisecond + "','" + moduleid + "','" + module_name + "','1', '1','" + match_temp_id + "','" + p_match_temp_id + "','" + columndata + "','" + t_global_var + "');";

        //alert1(query);
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            q: "0",
            tid: "" // simple insert
        });
        cordova.exec(get_site_details_from_task_master, onfail_insert_online_task, 'SqlitePlugin', 'insertValuse', q_jsonobj);
    } catch (e) {
        alert1(e + '_insert_online_task()');
        loading_hide();
    }
}
function update_online_task(e) {
    try {

        var myArray = JSON.parse(e);
        var loc_status = myArray[0].status;
        var loc_srnumber = myArray[0].srnumber;

        var server_task_id = JSON.parse(storage.getItem('server_task_id'));
        var task_details = JSON.parse(storage.getItem('online_task_details'));
        var survey_date = task_details[0].survey_date;
        var millisecond = task_details[0].millisecond;
        var site_id = task_details[0].siteid;
        var site_name = task_details[0].site_name;
        var lat = task_details[0].lat;
        var long = task_details[0].long;
        var status = task_details[0].status;
        var columndata = $("#lst_sys_var_" + server_task_id + "").val();
        columndata = decodeURIComponent(columndata);

        if (status != loc_status) {
            // for fresh rejected task
            var sr_nmbr = 1;
        }
        else {
            // in case where task is downloaded by android (11042019)
            var sr_nmbr = loc_srnumber;
        }

        let loc_global_var = myArray[0].global_var;
        if (loc_global_var == "" || loc_global_var == null || loc_global_var == undefined || loc_global_var == " ") {
            var new_global_var = "";
        }
        else {
            loc_global_var = JSON.parse(loc_global_var);
            let loc_new_checklist = loc_global_var[0].new_checklist;
            let updated_new_checklist = overwrite_server_global_var_to_local(loc_new_checklist);
            loc_global_var[0].new_checklist = updated_new_checklist;
            var new_global_var = JSON.stringify(loc_global_var);
        }

        // status update
        var query = "UPDATE task_master set siteid='" + site_id + "', site_name='" + site_name + "', lat='" + lat + "', long='" + long
            + "', status='" + status + "', srnumber='" + sr_nmbr + "', columndata='" + columndata + "', global_var='" + new_global_var + "' where server_task_id = '" + server_task_id + "'";

        //alert1("query: " + query);
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            q: "0",
            tid: "0"
        });
        cordova.exec(get_site_details_from_task_master, onfail_update_online_task, 'SqlitePlugin', 'insertValuse', q_jsonobj);
    } catch (e) {
        alert1(e + '_update_online_task()');
    }
}

function overwrite_server_global_var_to_local(loc_new_checklist) {
    try {

        let server_task_id = JSON.parse(storage.getItem('server_task_id'));
        let ser_global_var = $("#lst_global_var_" + server_task_id + "").val();
        ser_global_var = decodeURIComponent(ser_global_var);
        ser_global_var = JSON.parse(ser_global_var);
        let ser_new_checklist = ser_global_var[0].new_checklist;

        var task_role_id = JSON.parse(storage.getItem('role_id'));
        var task_start_status = JSON.parse(storage.getItem('start_status'));


        for (let l = 0; l < loc_new_checklist.length; l++) {
            let l_role_id = loc_new_checklist[l].role_id;
            let l_start_status = loc_new_checklist[l].start_status;

            if (task_start_status == l_start_status && task_role_id == l_role_id) {
                // check for current status objects

                let l_checksheetid = loc_new_checklist[l].checksheetid;
                let l_sub_flow_id = loc_new_checklist[l].sub_flow_id;
                let l_is_online = loc_new_checklist[l].is_online;
                if (l_is_online == "" || l_is_online == null || l_is_online == undefined) {
                    l_is_online = 1;
                }

                for (let s = 0; s < ser_new_checklist.length; s++) {
                    let s_role_id = ser_new_checklist[s].role_id;
                    let s_start_status = ser_new_checklist[s].start_status;
                    let s_checksheetid = ser_new_checklist[s].checksheetid;
                    let s_sub_flow_id = ser_new_checklist[s].sub_flow_id;
                    if (s_start_status == l_start_status && s_role_id == l_role_id && l_checksheetid == s_checksheetid && l_sub_flow_id == s_sub_flow_id && l_is_online == 1) {
                        let s_is_submited = ser_new_checklist[s].is_submited;
                        if (s_is_submited === "" || s_is_submited === null || s_is_submited === undefined) { }
                        else {
                            // replace server is_submitted to local object (make local green if server has green)
                            loc_new_checklist[l].is_submited = s_is_submited;
                        }
                        break;
                    }
                }
            }
        }

        return loc_new_checklist;

    }
    catch (e) {
        //alert(e + "_overwrite_server_global_var_to_local()");
        return loc_new_checklist;
    }
}


function get_site_details_from_task_master() {
    try {
        // alert1("get_site_details_from_task_master....")
        var server_task_id = JSON.parse(storage.getItem('server_task_id'));
        var query = "select tid, server_task_id, checksheetid, moduleid, module_name, siteid, site_name, lat, long, data, site_address, status, is_delete_photo, list_html, columndata from task_master where server_task_id='" + server_task_id + "'";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "1"
        });
        cordova.exec(onsuccess_get_site_details_from_task_master, onfail_get_site_details_from_task_master, 'SqlitePlugin', 'showValues', q_jsonobj);
    } catch (e) {
        alert1(e + '_get_site_details_from_task_master()');
    }
}
function onsuccess_get_site_details_from_task_master(e) {
    try {
        var myArray = JSON.parse(e);
        var selected_site = myArray[0].siteid;
        var selected_checksheetid = myArray[0].checksheetid;
        var selected_tid = myArray[0].tid;
        var selected_server_task_id = myArray[0].server_task_id;
        var selected_start_status = myArray[0].status;
        var selected_moduleid = myArray[0].moduleid;
        var selected_modulename = myArray[0].module_name;
        var selected_list_html = myArray[0].list_html
        var selected_columndata = myArray[0].columndata;

        storage.setItem('siteid', JSON.stringify(selected_site));
        storage.setItem('tid', JSON.stringify(selected_tid));
        storage.setItem('start_status', JSON.stringify(selected_start_status));
        storage.setItem('wayflow', JSON.stringify(selected_moduleid));
        storage.setItem('wayflow_name', JSON.stringify(selected_modulename));

        var flow_Array = JSON.parse(storage.getItem('flow_Array'));
        flow_Array[flow_Array.length - 1].tid = selected_tid;
        flow_Array[flow_Array.length - 1].server_task_id = selected_server_task_id;
        flow_Array[flow_Array.length - 1].siteid = selected_site;
        flow_Array[flow_Array.length - 1].start_status = selected_start_status;
        storage.setItem('flow_Array', JSON.stringify(flow_Array));

        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var survey_mode = list_data[0].survey_mode;
        var server_task_id = JSON.parse(storage.getItem('server_task_id'));

        if (selected_list_html == "" || selected_list_html == null || selected_list_html == undefined || selected_list_html == "Unknown" || selected_list_html == "null" || selected_list_html == "undefined") {
            update_task_list_html_online(server_task_id, selected_tid);
        }
        else {
            var is_shortcutbutton = localStorage.getItem('is_shortcutbutton');
            if (is_shortcutbutton == 'true') {
                // shorcut button click in online flow
                var shortcut_button_array = JSON.parse(localStorage.getItem('shortcut_button_array'));
                var btn_checksheet_id = shortcut_button_array[0].btn_checksheet_id;
                if (btn_checksheet_id == '0') {
                    check_action_for_shortcut_button();                             //first insert/update task entry then start/stop trip on SB [06082020]
                }
                else {
                    curr_survey_data["t_id"] = selected_tid;
                    open_additional_checksheet_on_SB_click();
                }
            }
            else {
                redirect_to_checksheet_grouplist();
            }
        }
    } catch (e) {
        alert1(e + '_onsuccess_get_site_details_from_task_master()');
    }
}

function update_task_list_html_online(t_server_task_id, t_tid) {
    try {
        try {
            var list_HTML = document.getElementById("lst_" + t_server_task_id + "").outerHTML;
        } catch (e) {
            var list_HTML = document.getElementById("lst_" + t_tid + "").outerHTML;
        }

        list_HTML = encodeURIComponent(list_HTML);
        var query = 'UPDATE task_master set list_html="' + list_HTML + '" where server_task_id="' + t_server_task_id + '"';

        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            q: "0",
            tid: t_server_task_id
        });
        cordova.exec(onsuccess_update_task_list_html_online, onfail_update_task_list_html_online, 'SqlitePlugin', 'insertValuse', q_jsonobj);
    }
    catch (e) {
        //alert1(e + '_update_task_list_html_online');
        onsuccess_update_task_list_html_online('');
    }
}

function onsuccess_update_task_list_html_online(e) {
    try {
        var selected_tid = JSON.parse(storage.getItem('tid'));
        var is_shortcutbutton = localStorage.getItem('is_shortcutbutton');
        if (is_shortcutbutton == 'true') {
            // shorcut button click in online flow
            var shortcut_button_array = JSON.parse(localStorage.getItem('shortcut_button_array'));
            var btn_checksheet_id = shortcut_button_array[0].btn_checksheet_id;
            if (btn_checksheet_id == '0') {
                check_action_for_shortcut_button();                             //first insert/update task entry then start/stop trip on SB [06082020]
            }
            else {
                curr_survey_data["t_id"] = selected_tid;
                open_additional_checksheet_on_SB_click();
            }
        }
        else {
            redirect_to_checksheet_grouplist();
        }
    }
    catch (e) {
        alert1(e + '_onsuccess_update_task_list_html_online');
        loading_hide();
    }
}

function onfail_update_task_list_html_online(e) {
    alert1(e + '_onfail_update_task_list_html_online()');
    loading_hide();
}


function check_task_json_entry_online(t_id) {
    try {
        var check_type_str = storage.getItem('check_type_task');
        if (F7_device == 'ios') {
            check_type = check_type_str;
        }
        else {
            check_type = check_type_str.substring(1, check_type_str.length - 1);
        }

        var query = "select fid, tid from f_master where tid = '" + t_id + "' and f_value = '" + check_type + "'";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "1"
        });
        cordova.exec(onsuccess_check_task_json_entry_online, onfail_check_task_json_entry_online, 'SqlitePlugin', 'showValues', q_jsonobj);
    } catch (e) {
        alert1(e + '_check_task_json_entry_online()');
        loading_hide();
    }
}

function onsuccess_check_task_json_entry_online(e) {
    // alert1("Old Entry Found ! - Update task json details...");
    var myArray = JSON.parse(e);
    if (myArray.length > 0) {
        var f_id = myArray[0].fid;
        var t_id = myArray[0].tid;
        update_task_json_log_for_online_task(f_id, t_id);
    } else {
        onfail_check_task_json_entry_online("e");
    }
}

function onfail_check_task_json_entry_online(e) {
    // alert1("Old Entry Not Found ! Insert task json details...");
    insert_task_json_log_for_online_task();
}

function insert_task_json_log_for_online_task() {
    try {
        // alert1("inserting task");
        var selected_tid = JSON.parse(storage.getItem('tid'));
        var imei_no = JSON.parse(storage.getItem('imeino'));
        var date_s = new Date();
        var time = date_s.getTime();
        var f_name = imei_no + "_" + time;
        var on_task_details = JSON.parse(storage.getItem('online_task_details'));
        var jsonData = on_task_details[0].task_json[0].task_json;
        var check_type_str = storage.getItem('check_type_task');
        if (F7_device == 'ios') {
            check_type = check_type_str;
        }
        else {
            check_type = check_type_str.substring(1, check_type_str.length - 1);
        }
        var finaljsonObj = [];
        finaljsonObj.push({
            taskid: "",
            servertaskid: "",
            siteid: "",
            stepid: "",
            category: "",
            imei: "",
            username: "",
            u_c: "",
            subcategory: "",
            date: "",
            date_s: "",
            address: "",
            lat: "",
            long1: "",
            gps: "", // 0 = off, 1 = on
            accuracy: "",
            diff_time: "",
            check_type: "",
            data: jsonData,
            buttons: ""
        });
        var fileData = JSON.stringify(finaljsonObj);

        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var match_temp_id = list_data[0].match_temp_id;
        if (match_temp_id == "" || match_temp_id == null || match_temp_id == undefined) {
            match_temp_id = "";
        }

        var query = "INSERT INTO f_master (c_id, c_type, tid ,f_name, f_data, f_key, f_value, f_type, flag, step, match_temp_id) VALUES('"
            + check_type + "','5','" + selected_tid + "','" + f_name + "','" + fileData + "', 's','" + check_type + "','text/plain','1','1','" + match_temp_id + "');";

        // alert1(query);
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            q: "0",
            tid: selected_tid
        });
        cordova.exec(check_customer_json_entry_online, onfail_insert_task_json_log_for_online_task, 'SqlitePlugin', 'insertValuse', q_jsonobj);
    } catch (e) {
        alert1(e + '_insert_task_json_log_for_online_task()');
    }
}

function update_task_json_log_for_online_task(f_id, t_id) {
    try {
        // alert1("updating task json....");
        var on_task_details = JSON.parse(storage.getItem('online_task_details'));
        var jsonData = on_task_details[0].task_json[0].task_json;
        var finaljsonObj = [];
        finaljsonObj.push({
            taskid: "",
            servertaskid: "",
            siteid: "",
            stepid: "",
            category: "",
            imei: "",
            username: "",
            u_c: "",
            subcategory: "",
            date: "",
            date_s: "",
            address: "",
            lat: "",
            long1: "",
            gps: "", // 0 = off, 1 = on
            accuracy: "",
            diff_time: "",
            check_type: "",
            data: jsonData,
            buttons: ""
        });
        var fileData = JSON.stringify(finaljsonObj);
        var date_s = new Date();
        var time = date_s.getTime();
        var query = "UPDATE f_master SET millisecond='" + time + "', f_data = '" + fileData + "' where fid = '" + f_id + "'";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            q: "0",
            tid: t_id
        });
        cordova.exec(check_customer_json_entry_online, onfail_update_task_json_log_for_online_task, 'SqlitePlugin', 'insertValuse', q_jsonobj);
    } catch (e) {
        alert1(e + '_update_task_json_log_for_online_task()');
    }
}

function check_customer_json_entry_online() {
    // alert1("Checking customer json entry...");
    try {
        var on_task_details = JSON.parse(storage.getItem('online_task_details'));
        var t_id = JSON.parse(storage.getItem('tid'));
        var check_type = on_task_details[0].customer_json[0].customer_checksheet;
        var query = "select fid, tid from f_master where tid = '" + t_id + "' and f_value = '" + check_type + "'";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "1"
        });
        cordova.exec(onsuccess_check_customer_json_entry_online, onfail_check_customer_json_entry_online, 'SqlitePlugin', 'showValues', q_jsonobj);
    } catch (e) {
        alert1(e + '_check_customer_json_entry_online()');
        loading_hide();
    }
}

function onsuccess_check_customer_json_entry_online(e) {
    // alert1("Old Entry Found ! - Update customer json details...");
    var myArray = JSON.parse(e);
    if (myArray.length > 0) {
        var f_id = myArray[0].fid;
        var t_id = myArray[0].tid;
        update_customer_json_log_for_online_task(f_id, t_id);
    } else {
        onfail_check_customer_json_entry_online("e");
    }
}

function onfail_check_customer_json_entry_online(e) {
    // alert1("Old Entry Not Found ! Insert customer json details...");
    insert_customer_json_log_for_online_task();
}

function insert_customer_json_log_for_online_task() {
    try {
        var selected_tid = JSON.parse(storage.getItem('tid'));
        var imei_no = JSON.parse(storage.getItem('imeino'));
        var date_s = new Date();
        var time = date_s.getTime();
        var f_name = imei_no + "_" + time;
        var on_task_details = JSON.parse(storage.getItem('online_task_details'));
        var jsonData = on_task_details[0].customer_json[0].customer_json;
        var check_type = on_task_details[0].customer_json[0].customer_checksheet;
        if (check_type == '' || check_type == null || check_type == undefined) {
            check_type = 0;
        }
        var finaljsonObj = [];
        finaljsonObj.push({
            taskid: "",
            servertaskid: "",
            siteid: "",
            stepid: "",
            category: "",
            imei: "",
            username: "",
            u_c: "",
            subcategory: "",
            date: "",
            date_s: "",
            address: "",
            lat: "",
            long1: "",
            gps: "", // 0 = off, 1 = on
            accuracy: "",
            diff_time: "",
            check_type: "",
            data: jsonData,
            buttons: ""
        });
        var fileData = JSON.stringify(finaljsonObj);

        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var match_temp_id = list_data[0].match_temp_id;
        if (match_temp_id == "" || match_temp_id == null || match_temp_id == undefined) {
            match_temp_id = "";
        }

        var query = "INSERT INTO f_master (c_id, c_type, tid ,f_name, f_data, f_key, f_value, f_type, flag, step, match_temp_id) VALUES("
            + check_type + ",'3','" + selected_tid + "','" + f_name + "','" + fileData + "', 's'," + check_type + ",'text/plain','1','1'," + match_temp_id + ");";

        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            q: "0",
            tid: selected_tid
        });
        cordova.exec(redirect_to_checksheet_grouplist, onfail_insert_customer_json_log_for_online_task, 'SqlitePlugin', 'insertValuse', q_jsonobj);
    } catch (e) {
        alert1(e + '_insert_customer_json_log_for_online_task()');
    }
}

function update_customer_json_log_for_online_task(f_id) {
    try {
        var on_task_details = JSON.parse(storage.getItem('online_task_details'));
        var t_id = JSON.parse(storage.getItem('tid'));
        var jsonData = on_task_details[0].customer_json[0].customer_json;
        var finaljsonObj = [];
        finaljsonObj.push({
            taskid: "",
            servertaskid: "",
            siteid: "",
            stepid: "",
            category: "",
            imei: "",
            username: "",
            u_c: "",
            subcategory: "",
            date: "",
            date_s: "",
            address: "",
            lat: "",
            long1: "",
            gps: "", // 0 = off, 1 = on
            accuracy: "",
            diff_time: "",
            check_type: "",
            data: jsonData,
            buttons: ""
        });
        var fileData = JSON.stringify(finaljsonObj);
        var date_s = new Date();
        var time = date_s.getTime();
        var query = "UPDATE f_master SET millisecond='" + time + "', f_data = '" + fileData + "' where fid = '" + f_id + "'";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            q: "0",
            tid: t_id
        });
        cordova.exec(redirect_to_checksheet_grouplist, onfail_update_task_json_log_for_online_task, 'SqlitePlugin', 'insertValuse', q_jsonobj);
    } catch (e) {
        alert1(e + '_update_customer_json_log_for_online_task()');
    }
}








function redirect_to_checksheet_grouplist() {
    try {
        // alert1("Customer JSON has been added/updated successfully to f_master!")
        var is_shortcutbutton = localStorage.getItem('is_shortcutbutton');
        if (is_shortcutbutton == 'true') {
            // shorcut button click in online flow
            var shortcut_button_array = JSON.parse(localStorage.getItem('shortcut_button_array'));
            var btn_checksheet_id = shortcut_button_array[0].btn_checksheet_id;
            if (btn_checksheet_id == '0') {
                var server_task_id = JSON.parse(storage.getItem('server_task_id'));
                update_server_task_entry_online_SB(server_task_id);
            }
        }
        else {
            // new code for making checksheets blue in global var
            var data_json = JSON.parse(storage.getItem('list_json'));
            var list_data = JSON.parse(data_json);
            var edit_globalvar = list_data[0].edit_globalvar;
            if (edit_globalvar == "true") {
                var selected_tid = JSON.parse(storage.getItem('tid'));
                check_task_n_update_globalvar(selected_tid);
            } else {
                //changeurl("viewsitelist_pm_grouplist.html");
                check_child_flow_for_parent()                   //to skip single checksheet list
            }
        }
    } catch (e) {
        alert1(e + "_redirect_to_checksheet_grouplist()");
    }
}




function onfail_insert_online_task(e) {
    alert1(e + '_onfail_insert_online_task()');
    loading_hide();
}

function onfail_update_task_json_log_for_online_task(e) {
    alert1(e + '_onfail_update_task_json_log_for_online_task()');
    loading_hide();
}

function onfail_update_online_task(e) {
    alert1(e + '_onfail_update_online_task()');
    loading_hide();
}

function onfail_get_site_details_from_task_master(e) {
    alert1(e + '_onfail_get_site_details_from_task_master()');
    loading_hide();
}

function onfail_insert_task_json_log_for_online_task(e) {
    alert1(e + '_onfail_insert_task_json_log_for_online_task()');
    loading_hide();
}

function onfail_insert_customer_json_log_for_online_task(e) {
    alert1(e + '_onfail_insert_customer_json_log_for_online_task()');
    loading_hide();
}




// check and merge chcksheet is_submited in global var
// (while 2 users filling checksheets with same start status)
function check_n_merge_global_var(t_global_var_obj, loc_new_checksheet_list) {
    try {
        t_global_var_obj = JSON.parse(t_global_var_obj);
        var ser_new_checksheet_list = t_global_var_obj[0].new_checklist;
        for (i = 0; i < loc_new_checksheet_list.length; i++) {
            var loc_checksheetid = loc_new_checksheet_list[i].checksheetid;
            var loc_is_submited = loc_new_checksheet_list[i].is_submited;
            for (j = 0; j < ser_new_checksheet_list.length; j++) {
                var ser_checksheetid = ser_new_checksheet_list[j].checksheetid;
                if (ser_checksheetid == loc_checksheetid) {
                    var ser_is_submited = ser_new_checksheet_list[j].is_submited;
                    if (ser_is_submited == 1 && loc_is_submited == 0) {
                        loc_new_checksheet_list[i].is_submited = 1;
                        break;
                    }
                    break;
                }
            }
        }
        t_global_var_obj[0].new_checklist = loc_new_checksheet_list;
        var global_var_obj = JSON.stringify(t_global_var_obj);
        return global_var_obj;
    } catch (e) {
        alert1(e + '_check_n_merge_global_var()');
    }
}


// edit global var online
function edit_global_var_main_task_online() {
    try {
        var server_task_id = JSON.parse(storage.getItem('server_task_id'));
        var online_task_details = JSON.parse(storage.getItem('online_task_details'));

        var global_var = online_task_details[0].task[0].global_var;
        var start_status = online_task_details[0].task[0].start_status;
        if (global_var == '' || global_var == null || global_var == undefined) {
        }
        else {
            global_var = JSON.parse(global_var);
            var new_checksheet_list = global_var[0].new_checklist;
            var role_id = JSON.parse(storage.getItem('role_id'));
            for (i = 0; i < new_checksheet_list.length; i++) {
                var c_role_id = new_checksheet_list[i].role_id;
                var c_start_status = new_checksheet_list[i].start_status;
                if (start_status == c_start_status) {
                    new_checksheet_list[i].is_submited = 0;
                }
            }
        }
    }
    catch (e) {
        alert1(e + '_edit_global_var_main_task_online()');
    }
}


function get_tid_for_task_edit_onlline(t_ser_task_id, t_start_status) {
    try {
        localStorage.setItem('ID_useType22', t_ser_task_id);
        storage.setItem('start_status', JSON.stringify(t_start_status));
        storage.setItem('server_task_id', JSON.stringify(t_ser_task_id));

        var query = "select tid from task_master where server_task_id = '" + t_ser_task_id + "'";

        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "1"
        });

        //alert1('query: ' + query);
        cordova.exec(onsuccess_get_tid_for_task_edit_onlline, onfail_get_tid_for_task_edit_onlline, 'SqlitePlugin', 'showValues', q_jsonobj);
    }
    catch (e) {
        alert1(e + '_redirect_on_task_edit_form_online');
        loading_hide();
    }

}

function onsuccess_get_tid_for_task_edit_onlline(e) {
    try {
        var myArray = e;
        if (myArray == "" || myArray == "[]" || myArray == null || myArray == undefined) {
            // task not found in local
            localStorage.setItem('task_mode', 'edit');                  //for task form (create mode/edit mode)
            changeurl("viewsitedata_task.html");
        }
        else {
            myArray = JSON.parse(myArray);
            var selected_tid = myArray[0].tid;
            var start_status = JSON.parse(storage.getItem('start_status'));
            redirect_on_task_edit_form(selected_tid, start_status, '');
        }
    } catch (e) {
        alert1(e + '_onsuccess_get_tid_for_task_edit_onlline');
        loading_hide();
    }
}

function onfail_get_tid_for_task_edit_onlline(e) {
    loading_hide();
    alert1("Please click the task before edit !");
}

function view_task_details_from_task_master(t_server_task_id, t_id) {
    if (t_id == '') {
        var query = "select * from task_master where server_task_id = '" + t_server_task_id + "'";
    }
    else {
        var query = "select * from task_master where tid = '" + t_id + "'";
    }

    var q_jsonobj = [];
    q_jsonobj.push({
        data: query,
        p: "1"
    });
    cordova.exec(onsuccess_view_task_details_from_task_master, onfail_view_task_details_from_task_master, 'SqlitePlugin', 'showValues', q_jsonobj);
}

function onsuccess_view_task_details_from_task_master(e) {
    var myArray = JSON.parse(e);
    if (myArray.length == 0) {
        alert1("No details available, please tap on the task first!")
    }
    else {
        myApp.popup('.popup-cust_info');
        var myTableDiv = document.getElementById("myDynamicTable");
        myTableDiv.innerHTML = '';
        var table = document.createElement('TABLE');
        table.className = "table_ans";

        var p = myArray[0];
        for (var key in p) {
            if (key == 'task_id' || key == 'rate' || key == 'site_flag' || key == 'server_task_flag' || key == 'site_address' || key == 'percentage' || key == 'inspect_count' || key == 'height'
                || key == 'display_siteid' || key == 'end_of_date' || key == 'tower_type' || key == 'moduledef' || key == 'is_down_complete' || key == 'list_html' || key == 'user_id' || key == 'lat' || key == 'long' || key == 'data') {

            }
            else {
                var tr = document.createElement('TR');
                tr.className = "tr_ans";
                table.appendChild(tr);

                var td1 = document.createElement('TD');
                td1.innerHTML = key;
                td1.className = "td1_ans";

                var td2 = document.createElement('TD');
                td2.innerHTML = p[key];
                td2.className = "td2_ans";

                tr.appendChild(td1);
                tr.appendChild(td2);
            }
        }

        myTableDiv.appendChild(table);
    }
}

function onfail_view_task_details_from_task_master(e) {
    alert1(e + '_onfail_view_task_details_from_task_master()');
}


//// Draw 2 site route on map
function display_site_route_on_map(latlong_api, ser_task_id, t_site_latlong_str) {
    try {
        if (latlong_api == "" || latlong_api == null || latlong_api == undefined) {
            var site_latlong_str = decodeURIComponent(t_site_latlong_str);
            var latlong_ary = JSON.parse(site_latlong_str);
            var lat1 = latlong_ary[0]['Lat 1'];
            var long1 = latlong_ary[0]['Long 1'];
            var lat2 = latlong_ary[0]['Lat 2'];
            var long2 = latlong_ary[0]['Long 2'];

            plugin_call_for_site_route_map(lat1, long1, lat2, long2);
        }
        else {
            get_siteRoute_latlong_from_API(latlong_api, ser_task_id);
        }
    } catch (e) {
        alert1(e + '_get_user_latlong_for_map()');
        loading_hide();
    }
}

function get_siteRoute_latlong_from_API(latlong_api, ser_task_id) {
    try {

        var param_obj = [];
        param_obj.push({
            'trip_id': ser_task_id
        });

        var getdata = new Webservicecall_REST(global_wcf_url + latlong_api, JSON.stringify(param_obj), onsuccess_get_siteRoute_latlong_from_API, onfail_get_siteRoute_latlong_from_API);
        getdata.callOtherDomain();
    }
    catch (e) {
        alert1(e + '_get_siteRoute_latlong_from_API');
    }
}

function onsuccess_get_siteRoute_latlong_from_API(e) {
    try {
        //var responseText = [{ "str":null, "status":1, "message":"Success", "id":0, "Data":"{\"originGmap\":\"23.095819000000, 77.508565000000\",\"destinationGmap\":\"22.741100000000, 75.889000000000\",\"centerTitleGmap\":\"23.095819000000, 77.508565000000\",\"geoCodeAddrGmap\":\"23.095819000000, 77.508565000000\"}"}];
        var responseText = JSON.parse(e.responseText);
        var status = responseText[0].status;
        var message = responseText[0].message;

        if (status == 1) {
            var data = responseText[0].Data;
            data = JSON.parse(data);
            var originGmap = data.originGmap;
            originGmap = originGmap.split(',');
            var lat1 = originGmap[0];
            var long1 = originGmap[1];

            var destinationGmap = data.destinationGmap;
            destinationGmap = destinationGmap.split(',');
            var lat2 = destinationGmap[0];
            var long2 = destinationGmap[1];

            plugin_call_for_site_route_map(lat1, long1, lat2, long2);
        }
        else {
            alert1(message);
        }
        loading_hide();
    } catch (e) {
        loading_hide();
        alert1(e + '_onsuccess_plugin_call_for_site_route_map');
    }
}

function onfail_get_siteRoute_latlong_from_API(e) {
    loading_hide();
    //alert1(e + '_onfail_get_siteRoute_latlong_from_API');
}

function plugin_call_for_site_route_map(lat1, long1, lat2, long2) {
    try {
        var param_obj = [];
        param_obj.push({
            site1_lat: lat1,
            site1_long: long1,
            site2_lat: lat2,
            site2_long: long2
        });

        loading();
        cordova.exec(onsuccess_plugin_call_for_site_route_map, onfail_plugin_call_for_site_route_map, 'SiteRoutePlugin', 'anAction', param_obj);
    } catch (e) {
        alert1(e + '_get_user_latlong_for_map()');
        loading_hide();
    }
}

function onsuccess_plugin_call_for_site_route_map(e) {
    try {
        //alert1("onsuccess_plugin_call_for_site_route_map");
        loading_hide();
    } catch (e) {
        loading_hide();
        alert1(e + '_onsuccess_plugin_call_for_site_route_map');
    }
}

function onfail_plugin_call_for_site_route_map(e) {
    loading_hide();
}


// Transpot site logic

// redirect page on pm site click when user near from site
function redirect_on_transport_site_click(selected_site, selected_site_name, selected_server_task_id, selected_start_status, selected_moduleid, selected_modulename, t_task_update, t_site_lat, t_site_long, t_survey_date, t_millisecond) {
    try {
        localStorage.setItem("transport_trip_id", selected_server_task_id);

        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var status_array = list_data[0].status;

        var flow_Array = JSON.parse(storage.getItem('flow_Array'));
        if (flow_Array.length == 1) {
            var p_server_task_id = 0;
        }
        else {
            var p_server_task_id = JSON.parse(storage.getItem('p_server_task_id'));
        }

        var param_obj = [];
        param_obj.push({
            'flow_id': selected_moduleid,
            'trip_master_id': selected_server_task_id,
            'status': status_array[0],
            'Paranet_taskid': p_server_task_id
        });

        loading();
        var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_CreateTaskForThirdparty', JSON.stringify(param_obj), function (e) {
            var myArray = JSON.parse(e.responseText);
            var status = myArray[0].status;
            var message = myArray[0].message;
            if (status == 1) {
                var transport_id = selected_server_task_id;
                $('#lst_sys_var_' + transport_id + '').attr("id", 'lst_sys_var_' + message + '');
                selected_server_task_id = message;
                redirect_on_pm_site_click_online(selected_site, selected_site_name, selected_server_task_id, selected_start_status, selected_moduleid, selected_modulename, t_task_update, t_site_lat, t_site_long, t_survey_date, t_millisecond);
            }
            else {
                alert1(message + '_redirect_on_transport_site_click()');
                loading_hide();
            }

        }, onfail);
        getdata.callOtherDomain();
    }
    catch (e) {
        alert1(e + "_redirect_on_transport_site_click()");
    }
}

function update_task_by_shortcut_button_transport(btn_checksheet_id, btn_status, selected_site, selected_tid, selected_start_status, selected_moduleid, selected_modulename, selected_site_name, selected_server_task_id, sb_lat, sb_long, sb_survey_date, sb_millisecond, t_submit_message, t_sb_trip, sb_is_mandatory) {

    localStorage.setItem("transport_trip_id", selected_server_task_id);

    var data_json = JSON.parse(storage.getItem('list_json'));
    var list_data = JSON.parse(data_json);
    var status_array = list_data[0].status;

    var flow_Array = JSON.parse(storage.getItem('flow_Array'));
    if (flow_Array.length == 1) {
        var p_server_task_id = 0;
    }
    else {
        var p_server_task_id = JSON.parse(storage.getItem('p_server_task_id'));
    }

    var param_obj = [];
    param_obj.push({
        'flow_id': selected_moduleid,
        'trip_master_id': selected_server_task_id,
        'status': status_array[0],
        'Paranet_taskid': p_server_task_id
    });

    loading();
    var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_CreateTaskForThirdparty', JSON.stringify(param_obj), function (e) {
        var myArray = JSON.parse(e.responseText);
        var status = myArray[0].status;
        var message = myArray[0].message;
        if (status == 1) {
            var transport_id = selected_server_task_id;
            $('#lst_sys_var_' + transport_id + '').attr("id", 'lst_sys_var_' + message + '');
            selected_server_task_id = message;
            update_task_by_shortcut_button(btn_checksheet_id, btn_status, selected_site, selected_tid, selected_start_status, selected_moduleid, selected_modulename, selected_site_name, selected_server_task_id, sb_lat, sb_long, sb_survey_date, sb_millisecond, t_submit_message, t_sb_trip, sb_is_mandatory);
        }
        else {
            alert1(message + '_update_task_by_shortcut_button_transport()');
            loading_hide();
        }

    }, onfail);
    getdata.callOtherDomain();
}

get_sitewise_radius_from_columndata = (t_myArray) => {

    var rad_found = 0, t_radius = 0;
    for (r = 0; r < t_myArray.length; r++) {
        var t_header = t_myArray[r].header;
        if (t_header == "Radius") {
            t_radius = t_myArray[r].ans;
            rad_found++;
            break;
        }
    }

    if (rad_found == 0) {
        return "";
    }
    else {
        return t_radius;
    }
}

//================additional checksheet for Bulk Approval [FT - 08042024]==============

function open_additional_checksheet_for_bulk_approval(t_status, bulk_approval_checksheet) {
    try {
        var btn_status = t_status;
        localStorage.setItem('check_type', JSON.stringify(bulk_approval_checksheet));
        localStorage.setItem('server_call_flag', JSON.stringify('0'));
        localStorage.setItem('checksheet_name', JSON.stringify('reject temp'));
        localStorage.setItem('c_start_status', JSON.stringify('0'));
        localStorage.setItem('end_status', JSON.stringify(btn_status));
        localStorage.setItem('c_is_disabled', JSON.stringify('0'));
        localStorage.setItem('c_is_online', JSON.stringify('1'));
        localStorage.setItem('checksheet_type_filter', JSON.stringify('1'));

        var new_checksheet_list = [];
        new_checksheet_list.push({
            'checksheetid': bulk_approval_checksheet,
            'start_status': '0',
            'end_status': btn_status,
            'is_flow': '',
            'is_submited': '0',
            'sub_flow_id': '0'
        });
        localStorage.setItem('new_checklist', JSON.stringify(new_checksheet_list));

        var last_step = 1;
        var temp_step_Array = [];
        for (i = 1; i <= last_step; i++) {
            temp_step_Array.push(i);
        }

        var task_array = [];

        var checkboxes_single = document.getElementsByClassName('myChecksheet');
        for (var i = 0; i < checkboxes_single.length; i++) {
            var chk_task_id = checkboxes_single[i].value;
            if (checkboxes_single[i].checked) {
                task_array.push(chk_task_id);
            }
        }
        curr_survey_data["task_id"] = JSON.parse(localStorage.getItem('task_id'));
        curr_survey_data["server_task_id"] = task_array;
        curr_survey_data["check_type"] = JSON.parse(localStorage.getItem('check_type'));

        get_bulk_upload_checksheet_form(bulk_approval_checksheet);
    }
    catch (e) {
        alert(e + '_open_additional_checksheet_for_bulk_approval');
    }
}

function get_bulk_upload_checksheet_form(bulk_approval_checksheet) {
    try {
        myApp.popup('.popup-bulk-approval-chksht');

        var company_id = window.localStorage.getItem("company_id");
        var user_id = window.localStorage.getItem("user_id");
        var trip_id = localStorage.getItem("transport_trip_id");
        if (trip_id == "" || trip_id == null || trip_id == undefined) {
            trip_id = 0;
        }

        var param_obj = [];
        param_obj.push({
            'Company_Id': company_id,
            'User_Id': user_id,
            'checksheetid': bulk_approval_checksheet,
            'step': 1,
            'trip_id': trip_id
        });

        loading();
        var getdata = new Webservicecall_REST(common_global_wcf_url + 'WCF_GetCheckSheetData_Port', JSON.stringify(param_obj), onsuccess_get_bulk_upload_checksheet_form, onfail_get_bulk_upload_checksheet_form);
        getdata.callOtherDomain();
    }
    catch (e) {
        loading_hide();
        alert(e + '_get_bulk_upload_checksheet_form');
    }
}

function onsuccess_get_bulk_upload_checksheet_form(e) {
    try {
        //var myArray = JSON.parse(e);
        var responseText = JSON.parse(e.responseText);
        var status = responseText[0].status;
        if (status == 1) {
            var myArray = JSON.parse(responseText[0].data);
            var heading = myArray[0].subcategory;
            var check_type = myArray[0].checksheetid;
            var step = myArray[0].step;
            var data = JSON.parse(myArray[0].data);
            var buttons = JSON.parse(myArray[0].buttons);
            localStorage.setItem('check_type', JSON.stringify(check_type));

            ////display total & current bulk approval task count on pop-up 10072023 PG 
            var selected = $('input[type="checkbox"][class="myChecksheet"]:checked').length;
            $('#lbl_task_count').text('0 / ' + selected);

            // store first selected task columndata while open bulk approval checksheet 10102023
            var checkboxes_single = document.getElementsByClassName('myChecksheet');
            let chk_task_id = 0;
            for (var i = 0; i < checkboxes_single.length; i++) {
                var t_task_id = checkboxes_single[i].value;
                if (checkboxes_single[i].checked) {
                    chk_task_id = t_task_id;
                    break;
                }
            }

            let columndata_str = $('#lst_sys_var_' + chk_task_id + '').val();
            if (columndata_str == "" || columndata_str == null || columndata_str == undefined) {
                // in case shortcut button with additional checksheet at checksheet listing level 30112021
                var columndata_Array = [];
            }
            else {
                var columndata_Array = JSON.parse(decodeURIComponent(columndata_str));
            }
            localStorage.setItem('type20_columndata', JSON.stringify(columndata_Array));

            read_dynamic_checksheet(heading, check_type, step, data, buttons, 13, 0);

            //    if (punchout_entry == '1') {
            //        punch_redirect = 'viewsitedata';
            //        var locObj = new MkLocation();
            //        locObj._getLocation(function (e) {
            //            make_punch_out_entry(e);
            //        });
            //    }
            //    else {
            //        changeurl("viewsitedata.html");
            //    }
        }
        else {
            loading_hide();
            alert(responseText[0].message);
        }
    }
    catch (e) {
        alert(e + '_onsuccess_get_bulk_upload_checksheet_form()');
        loading_hide();
    }
}

function onfail_get_bulk_upload_checksheet_form(e) {
    alert(e + '_onfail_get_bulk_upload_checksheet_form');
    loading_hide();
}

var checkboxes_single_ary = [];
function submit_bulk_approval_checksheet(btn_status) {
    try {
        validate_and_submit_surveydata_main(1, 13, jsonObj_old);

        if (Validation_True == 0) {

            storage.setItem('end_status', JSON.stringify(btn_status));                                      //store dynamic btn status on bulk aprvl checksheet btn click [FT - 18042024]

            var data_json = JSON.parse(storage.getItem('list_json'));;
            var list_data = JSON.parse(data_json);
            var buttons = list_data[0].buttons;
            if (buttons == '' || buttons == null || buttons == undefined || buttons.length == 0) {
                var bulk_approval_ary = list_data[0].bulk_approval_status;
            }
            else {
                var bulk_approval_ary = buttons;
            }
            var len = bulk_approval_ary.length;

            checkboxes_single_ary = [];
            var checkboxes_single = document.getElementsByClassName('myChecksheet');
            var checkboxes_single = $('input.myChecksheet');
            for (var i = 0; i < checkboxes_single.length; i++) {
                var chk_task_id = checkboxes_single[i].value;
                var task_status = checkboxes_single[i].getAttribute('task_status');
                var is_checked = checkboxes_single[i].checked;
                if (checkboxes_single[i].checked) {
                    for (b = 0; b < len; b++) {
                        var enabled = false;
                        var dependancy_status = bulk_approval_ary[b].dependancy_status;
                        for (s = 0; s < dependancy_status.length; s++) {
                            if (task_status == dependancy_status[s]) {
                                //if task_status and bulk approval status are same then submit that task, o/w skip other task [25012022]
                                enabled = true;
                                checkboxes_single_ary.push({
                                    "task_id": chk_task_id,
                                    "status": task_status
                                });
                                break;
                            }
                        }
                    }
                }
            }


            ////======remove duplicated from array
            var uniq_checkboxes_single_ary = checkboxes_single_ary.filter((v, i, a) => a.findIndex(v2 => (v2.task_id === v.task_id)) === i)
            checkboxes_single_ary = uniq_checkboxes_single_ary;

            //delete first element from the array & synchronized the code
            if (checkboxes_single_ary.length > 0) {
                var chk_task_id = checkboxes_single_ary[0].task_id;
                var task_status = checkboxes_single_ary[0].status;
                Insert_Update_Question_Log_BulkApproval(chk_task_id, task_status);
            }
        }
    }
    catch (e) {
        alert(e + '_submit_bulk_approval_checksheet');
    }
}


function Insert_Update_Question_Log_BulkApproval(chk_task_id, task_status) {
    try {
        var date_s = new Date();
        var date = date_s.getTime();
        var heading = curr_survey_data["heading"];
        var step = curr_survey_data["step"];
        var check_type = curr_survey_data["check_type"];
        var task_id = curr_survey_data["task_id"];
        var site_id = curr_survey_data["siteid"];
        var data = curr_survey_data["json"];

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

        var server_task_id = chk_task_id;
        var flow_id = JSON.parse(storage.getItem('wayflow'));
        var flow_name = JSON.parse(storage.getItem('wayflow_name'));

        var finaljsonObj = [];
        finaljsonObj.push({
            taskid: task_id,
            servertaskid: server_task_id,
            siteid: site_id,
            stepid: step,
            category: flow_id,
            imei: 0,
            User_Id: user_id,
            username: username,
            u_c: uniqcode,
            subcategory: heading,
            f_milli: "",
            f_lat: 0,
            f_long: 0,
            f_address: "",
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
        //alert1(JSON.stringify(finaljsonObj));

        curr_survey_data["finaljsonObj"] = finaljsonObj;
        var fileData = JSON.stringify(finaljsonObj);

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
                submit_selected_task_for_bulk_approval(chk_task_id, task_status);
            }
            else {
                var message = myArray[0].message;
                alert(message);
                loading_hide();
            }
        }, onfail);
        getdata.callOtherDomain();
    }
    catch (e) {
        loading_hide();
        alert(e + '_Insert_Update_Question_Log_BulkApproval');
    }
}

function submit_selected_task_for_bulk_approval(chk_task_id, task_status) {
    try {
        var task_array = [];
        task_array.push(chk_task_id);

        var status = JSON.parse(storage.getItem('end_status'));;

        var param_obj = [];
        param_obj.push({
            'servertaskid': task_array,
            'status': status
        });

        loading();
        var getdata = new Webservicecall_REST(common_global_wcf_url + 'WCF_Bulk_approval', JSON.stringify(param_obj), onsuccess_submit_selected_task_for_bulk_approval, onfail);
        getdata.callOtherDomain();
    }
    catch (e) {
        loading_hide();
        alert(e + '_submit_selected_task_for_bulk_approval()');
    }
}
function onsuccess_submit_selected_task_for_bulk_approval(e) {
    try {
        var Data_Json = e.responseText;
        Data_Json = eval('(' + Data_Json + ')');
        var Status = Data_Json[0].status;
        if (Status == 1) {

            checkboxes_single_ary.shift();

            if (checkboxes_single_ary.length == 0) {
                var total_chk_task = $('input[type="checkbox"][class="myChecksheet"]:checked').length;
                total_chk_task = parseInt(total_chk_task);
                $('#lbl_task_count').text(total_chk_task + ' / ' + total_chk_task);
                myApp.closeModal('.popup-bulk-approval-chksht')
            }

            if (checkboxes_single_ary.length == 0) {
                var data_json = JSON.parse(storage.getItem('list_json'));
                var list_data = JSON.parse(data_json);
                var buttons = list_data[0].buttons;
                if (buttons == '' || buttons == null || buttons == undefined || buttons.length == 0) { }
                else {
                    var ba_checksheet_id = curr_survey_data["check_type"];
                    var ba_status = JSON.parse(localStorage.getItem('end_status'));
                    var btn_len = buttons.length;
                    for (b = 0; b < btn_len; b++) {
                        var checksheet_id = buttons[b].checksheet_id;
                        var status = buttons[b].status;
                        if (ba_checksheet_id == checksheet_id && ba_status == status) {
                            var submit_message = buttons[b].submit_message;
                            break;
                        }
                    }
                }

                if (submit_message == "" || submit_message == null || submit_message == undefined) {
                    submit_message = "Tasks have been approved successfully !";
                }

                alert(submit_message);
            }

            //get_counter_for_online_flow();
            if (checkboxes_single_ary.length > 0) {
                var total_chk_task = $('input[type="checkbox"][class="myChecksheet"]:checked').length;
                total_chk_task = parseInt(total_chk_task);
                var approved_task = total_chk_task - checkboxes_single_ary.length;
                $('#lbl_task_count').text(approved_task + ' / ' + total_chk_task);

                var chk_task_id = checkboxes_single_ary[0].task_id;
                var task_status = checkboxes_single_ary[0].status;
                Insert_Update_Question_Log_BulkApproval(chk_task_id, task_status);
            }
            else {
                hide_bulk_approval_panel();
                refresh_site_list_common();
            }
        }
        else {
            var message = Data_Json[0].message;
            alert(message);
            loading_hide();
        }
    }
    catch (e) {
        loading_hide();
        alert(e + '_onsuccess_submit_selected_task_for_bulk_approval');
    }
}


function get_default_param(default_listing_filter_by, def_fltr_start_val, def_fltr_end_val, header, searchCol_obj, ctrl_type) {
    try {
        if (searchCol_obj == "" || searchCol_obj == null || searchCol_obj == undefined) {
            var searchCol_obj = [];
        }

        if (ctrl_type == 8) {
            var time_condition = default_listing_filter_by
            var today_dt_obj = new Date();
            var mode = "date";
            var today_dt = convert_datetime_by_format(today_dt_obj, mode);

            if (time_condition == 'select') { }
            else if (time_condition == 'anytime') { }
            else if (time_condition == 'today') {
                var value = convert_fix_format_date_on_submit(today_dt, mode);
                var value1 = value + " 00:00";
                var value2 = value + " 23:59";

                value = convert_datetime_by_format(value1, "datetime")
                value2 = convert_datetime_by_format(value2, "datetime")

                var val_date1 = convert_fix_format_date_on_submit(value, 'datetime');
                var val_date2 = convert_fix_format_date_on_submit(value2, 'datetime');
            }
            else if (time_condition == 'yesterday') {
                var yesterday_dt = today_dt_obj.setDate(today_dt_obj.getDate() - 1);
                yesterday_dt = new Date(yesterday_dt);
                var new_yesterday_dt = convert_datetime_by_format(yesterday_dt, mode);

                var value = convert_fix_format_date_on_submit(new_yesterday_dt, mode);

                var value1 = value + " 00:00";
                var value2 = value + " 23:59";

                value = convert_datetime_by_format(value1, "datetime")
                value2 = convert_datetime_by_format(value2, "datetime")

                var val_date1 = convert_fix_format_date_on_submit(value, 'datetime');
                var val_date2 = convert_fix_format_date_on_submit(value2, 'datetime');
            }
            else if (time_condition == 'this_week') {

                var curr = new Date;
                var firstday = new Date(curr.setDate(curr.getDate() - curr.getDay() + 1));
                var lastday = new Date(curr.setDate(curr.getDate() - curr.getDay() + 7));

                var value = convert_fix_format_date_on_submit(firstday, mode);
                var value2 = convert_fix_format_date_on_submit(lastday, mode);

                value = value + " 00:00";
                value2 = value2 + " 23:59";

                value = convert_datetime_by_format(value, "datetime")
                value2 = convert_datetime_by_format(value2, "datetime")

                var val_date1 = convert_fix_format_date_on_submit(value, 'datetime');
                var val_date2 = convert_fix_format_date_on_submit(value2, 'datetime');
            }
            else if (time_condition == 'last_week') {

                //new logic [02022022]
                var d = new Date();
                var to = d.setTime(d.getTime() - (d.getDay() ? d.getDay() : 7) * 24 * 60 * 60 * 1000);
                var from = d.setTime(d.getTime() - 6 * 24 * 60 * 60 * 1000);

                var lastday = new Date(to);
                var firstday = new Date(from);

                var value = convert_fix_format_date_on_submit(firstday, mode);
                var value2 = convert_fix_format_date_on_submit(lastday, mode);

                value = value + " 00:00";
                value2 = value2 + " 23:59";

                value = convert_datetime_by_format(value, "datetime")
                value2 = convert_datetime_by_format(value2, "datetime")

                var val_date1 = convert_fix_format_date_on_submit(value, 'datetime');
                var val_date2 = convert_fix_format_date_on_submit(value2, 'datetime');
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

                var val_date1 = convert_fix_format_date_on_submit(value, 'datetime');
                var val_date2 = convert_fix_format_date_on_submit(value2, 'datetime');
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

                var val_date1 = convert_fix_format_date_on_submit(value, 'datetime');
                var val_date2 = convert_fix_format_date_on_submit(value2, 'datetime');
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

                var val_date1 = convert_fix_format_date_on_submit(value, 'datetime');
                var val_date2 = convert_fix_format_date_on_submit(value2, 'datetime');
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

                var val_date1 = convert_fix_format_date_on_submit(value, 'datetime');
                var val_date2 = convert_fix_format_date_on_submit(value2, 'datetime');
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

                var val_date1 = convert_fix_format_date_on_submit(value, 'datetime');
                var val_date2 = convert_fix_format_date_on_submit(value2, 'datetime');
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

                var val_date1 = convert_fix_format_date_on_submit(value, 'datetime');
                var val_date2 = convert_fix_format_date_on_submit(value2, 'datetime');

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

                var val_date1 = convert_fix_format_date_on_submit(value, 'datetime');
                var val_date2 = convert_fix_format_date_on_submit(value2, 'datetime');
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

                var val_date1 = convert_fix_format_date_on_submit(value, 'datetime');
                var val_date2 = convert_fix_format_date_on_submit(value2, 'datetime');
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

                var val_date1 = convert_fix_format_date_on_submit(value, 'datetime');
                var val_date2 = convert_fix_format_date_on_submit(value2, 'datetime');
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

            get_json_str = [
                val_date1,
                val_date2
            ];

            searchCol_obj.push({
                "columnName": header,
                "id": "",
                "value": get_json_str,
                "Equation": "BETWEEN",
                "calendar_type": default_listing_filter_by
            });
        }
        else {
            var col_name = header;
            var eqn_str = "IN";

            var id_str = default_listing_filter_by;
            var type8_val = default_listing_filter_by;
            var search_str = default_listing_filter_by;

            if (Array.isArray(search_str)) { }
            else {
                search_str = [search_str];
            }

            if (id_str == "" || id_str == null || id_str == undefined || id_str == "undefined") {
                id_str = "";
            }
            else {
                if (Array.isArray(id_str)) { }
                else {
                    id_str = [id_str];
                }
            }

            searchCol_obj.push({
                "columnName": col_name,
                "id": id_str,
                "value": search_str,
                "Equation": eqn_str,
                "calendar_type": type8_val
            });

        }
        return searchCol_obj;
    }
    catch (e) {
        alert(e + '_get_default_param()');
    }
}

function check_type_for_pdf_report() {
    try {
        var company_id = JSON.parse(storage.getItem('company_id'));
        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var pdf_view_type = list_data[0].pdf_view_type;

        let domain_url = JSON.parse(storage.getItem('global_url'));
        var check_pdf = "old";
        if (company_id == 1842 || pdf_view_type == "server_pdf" || pdf_view_type == "" || pdf_view_type == null || pdf_view_type == undefined) {
            //old pdf
        }
        else {
            //new pdf
            check_pdf = "new";

            //if (domain_url.indexOf("login.easyform.in") > -1 || domain_url.indexOf("azr-easyform.aviatnet.com") > -1 || domain_url.indexOf("uatpms.aerialtelecom.in") > -1 || domain_url.indexOf("pms.aerialtelecom.in") > -1) {
            //    //new pdf
            //    check_pdf = "new";
            //}
            //else {
            //    //old
            //}
        }
        return check_pdf;
    }
    catch (e) {
        alert(e + 'check_type_for_pdf_report');
    }
}

// date to convert days DV-27032024
function format_AMPM(date) {

    //var hours = date.getHours();
    //var minutes = date.getMinutes();
    //var seconds = date.getSeconds();
    //hours = hours % 12;
    //hours = hours ? hours : 12; // the hour '0' should be '12'
    //minutes = minutes < 10 ? '0' + minutes : minutes;
    //seconds = seconds < 10 ? '0' + seconds : seconds;

    var ms = date.getTime();
    var curr_ms = new Date().getTime();

    if (ms > curr_ms) {
        // target date is greater than current time (future date)
        var diff_ms = ms - curr_ms;

        let nextMidnight = new Date(ms);
        nextMidnight.setDate(nextMidnight.getDate() + 1); // Move to the next day
        nextMidnight.setHours(0, 0, 0, 0);
        let nextMidnight_MS = nextMidnight.getTime();
        diff_ms = nextMidnight_MS - curr_ms;

    }
    else {
        // target date is less than current time (past date)
        var diff_ms = curr_ms - ms;

        if (diff_ms < 86400000) {
            // difference is less than 1 day than consider it as future date
            let now = new Date();
            let nextMidnight = new Date(now);
            nextMidnight.setDate(now.getDate() + 1); // Move to the next day
            nextMidnight.setHours(0, 0, 0, 0);
            let nextMidnight_MS = nextMidnight.getTime();
            diff_ms = nextMidnight_MS - curr_ms;
        }

    }

    if (diff_ms > 86400000) {
        // > 1 days
        var milliseconds = diff_ms;
        var days = millisecondsToDays(milliseconds);
        var t_day = Math.floor(days);
        var d = 'day'

        if (t_day > 10) {
            d = 'days';
        }

        var strTime = t_day + ' ' + d;
    }
    else {
        // < 1 day (i.e. in hours, minutes, seconds)
        var hours = Math.floor(diff_ms / 3600000);
        if (hours > 1) {
            var strTime = hours + ' hours';
        }
        else if (hours == 1) {
            var strTime = hours + ' hour';
        }
        else {
            var minutes = Math.floor(diff_ms / 60000);
            if (minutes > 1) {
                var strTime = minutes + ' minutes';
            }
            else if (minutes == 1) {
                var strTime = '1 minute';
            }
            else {
                var seconds = ((diff_ms % 60000) / 1000).toFixed(0);
                if (seconds < 1) {
                    seconds = 1;
                }
                var strTime = seconds + ' seconds';
            }
        }
    }
    return strTime;
}

function checkDate(dateString) {
    const inputDate = new Date(dateString).getTime();
    const currentDate = new Date().getTime();

    if (inputDate < currentDate) {
        var diff_ms = currentDate - inputDate;
        if (diff_ms < 86400000) {
            // if difference is less than 1 day than consider it as future
            return 'future';
        }
        else {
            return 'past';
        }
    } else if (inputDate > currentDate) {
        return 'future';
    } else {
        return 'Today';
    }
}