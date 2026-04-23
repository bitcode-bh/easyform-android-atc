var subflow_udf_id = '', list_flow_id = '', list_flow_name = '';      // Global var for subflow advance filter
var glob_task_list_flag = "normal";                     //global variable for show more with search
var sub_task_Array = [], curr_type37_new_id;
var po_task_created = 0;

get_type37_udf_data_from_query = (udf_id_ary, t_new_id, listing_udf_id) => {
    //if (udf_id_ary.length > 0) {
    var udf_id = udf_id_ary[0];
    var udf_id = JSON.parse(udf_id);

    var role_id_array = localStorage.getItem('role_id_array');

    var query = "SELECT * FROM User_Define_Flow_Master WHERE id = " + udf_id + " and rollid in (" + role_id_array + ") and (is_delete != 1 or is_delete IS NULL) order by rollid";

    var q_jsonobj = [];
    q_jsonobj.push({
        data: query,
        p: "1"
    });
    cordova.exec(function (e) {
        var myArray = JSON.parse(e);
        if (myArray.length == 0) {
            // child flow not exist
        } else {
            // child flow exist
            var udf_data = myArray[0].data;
            var sub_udf_data_str = encodeURIComponent(udf_data);

            var input_str = '<input type="hidden" id="hdn_type37_udf_' + udf_id + '" value="' + sub_udf_data_str + '" />';
            $("#hidden_type37_udf_data").append(input_str);

            //udf_id_ary.shift();
            //get_type37_udf_data_from_query(udf_id_ary, t_new_id, listing_udf_id);

            var target_udf_id = myArray[0].id;
            var target_flow_id = myArray[0].flow_id;
            var target_flow_name = myArray[0].flow_name1;

            list_flow_id = target_flow_id;
            list_flow_name = target_flow_name;

            get_sub_task_listing(t_new_id, listing_udf_id, target_flow_id);

            // Advance filter for subtask listing 05072024 PG
            subflow_udf_id = target_udf_id;
            $("#btn_advanced_search").show();
            $('#btnAdvSearch').parent().show();
            advance_column_search('');
        }
    }, onfail_get_type37_udf_data_from_query, 'SqlitePlugin', 'showValues', q_jsonobj);
    //}
    //else {
    //    //get_udf_data_by_id(t_new_id, listing_udf_id);
    //    get_sub_task_listing(t_new_id, listing_udf_id, target_flow_id);

    //    // Advance filter for subtask listing 05072024 PG
    //    subflow_udf_id = target_udf_id;
    //    $('#btnAdvSearch').parent().show();
    //    advance_column_search('');
    //}
}

function onfail_get_type37_udf_data_from_query(e) {
    alert1(e + '_onfail_get_type37_udf_data_from_query');
    loading_hide();
}


get_udf_data_for_subflow = (udf_id) => {
    var udf_data = $("#hdn_type37_udf_" + udf_id + "").val();
    udf_data = decodeURIComponent(udf_data);
    return udf_data;
}

get_udf_data_by_id = (t_new_id, sub_udf_id) => {

    limit_range = default_range; // set default range limit

    //var flow_Array = JSON.parse(storage.getItem('flow_Array'));
    //var udf_id = flow_Array[flow_Array.length - 1].id;
    //var company_id = JSON.parse(storage.getItem('company_id'));
    //var user_id = window.storage.getItem("user_id");

    //param_obj.push({
    //    'Company_Id': company_id,
    //    'User_Id': user_id,
    //    'p_id': udf_id
    //});

    //api changes for independent udf data [FT-05052025] [users:chetan.lead/3d.kpce/3d.ae]
    var param_obj = [];
    param_obj.push(
        {
            "key": "IsDelete", "value": "0"
        },
        {
            "key": "user_define_flow_id", "value": sub_udf_id
        }
    );

    loading();
    //var getdata = new Webservicecall_REST(common_global_wcf_url + 'WCF_UserDefineFlowMaster_With_MultiRole_Port', JSON.stringify(param_obj), function (e) {
    var getdata = new Webservicecall_REST(common_global_wcf_url + 'Task/User_define_flow_master_data', JSON.stringify(param_obj), function (e) {
        let responseText = JSON.parse(e.responseText);
        let message = responseText[0].message;
        let status = responseText[0].status;
        if (status == 1) {
            let new_checksheet_list = JSON.parse(responseText[0].data);

            $("#tbl_subtask_selected_" + t_new_id + "").empty();

            let sub_flow_id = "";
            let sub_flow_name = "";
            for (var n = 0; n < new_checksheet_list.length; n++) {
                var type = new_checksheet_list[n].type;
                var t_subudf_id = new_checksheet_list[n].id;
                if (sub_udf_id == t_subudf_id && (type == "flow" || type == "Flow")) {
                    sub_flow_id = new_checksheet_list[n].flow_id;
                    sub_flow_name = new_checksheet_list[n].flow_name;
                    break;
                }
            }

            list_flow_id = sub_flow_id;
            list_flow_name = sub_flow_name;

            get_sub_task_listing(t_new_id, sub_udf_id, sub_flow_id);

            // Advance filter for subtask listing 05072024 PG
            subflow_udf_id = sub_udf_id;
            $("#btn_advanced_search").show();
            $('#btnAdvSearch').parent().show();
            advance_column_search('');
        }
        else {
            alert1(message);
            loading_hide();
        }
    }, onfail);
    getdata.callOtherDomain();

}


refresh_sub_task_listing = (t_new_id, sub_udf_id, sub_flow_id) => {
    limit_range = default_range;
    get_sub_task_listing(t_new_id, sub_udf_id, sub_flow_id);
}


get_sub_task_listing = (t_new_id, sub_udf_id, sub_flow_id) => {

    glob_task_list_flag = "normal";
    loading();
    curr_type37_new_id = t_new_id;

    var data_count = get_udf_data_for_subflow(sub_udf_id);
    var list_data = JSON.parse(data_count);

    if (limit_range == default_range) {
        $("#tbl_subtask_" + t_new_id + "").empty();
    }

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

    if (ref_valid > 0) {
        alert1("Please enter required element!");
    }
    else {
        var status_array = list_data[0].status;

        var flow_Array = JSON.parse(storage.getItem('flow_Array'));
        if (flow_Array.length == 1) {
            // 2 layer task structure (sales visit > create order from type37)
            var p_server_task_id = JSON.parse(storage.getItem('p_server_task_id'));
        }
        else {
            // 3 level task structure (Sales lead > sales visit > create order from type37)
            var p_server_task_id = JSON.parse(storage.getItem('server_task_id'));
        }

        var include_parent_task = list_data[0].include_parent_task;
        if (include_parent_task == "false") {                           //-------------for urbanJungle(23122019)----////
            p_server_task_id = "0";
        }

        //default sorting list
        var order_by_array = list_data[0].order_by_array;
        if (order_by_array == "" || order_by_array == null || order_by_array == undefined) {
            var list_order_by = list_data[0].orderby;
            var list_order_type = list_data[0].order_type;

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
            //Default filter column & value show in span
            var col_data = list_data[0].columndata;
            for (var a = 0; a < order_by_array.length; a++) {
                var order_by_val = order_by_array[a].column_name;
                if (order_by_val == null || order_by_val == '' || order_by_val == undefined) {
                    order_by_val = order_by_array[a].order_by;
                }

                var order_by_chktype = order_by_array[a].checksheet_type;
                if (order_by_chktype == null || order_by_chktype == '' || order_by_chktype == undefined) {
                    order_by_array[a].checksheet_type = "0";
                }

                for (c = 0; c < col_data.length; c++) {
                    if (col_data[c].header == order_by_val) {
                        var col_system_var = col_data[c].system_var;
                        if (col_system_var == "" || col_system_var == null || col_system_var == undefined) { }
                        else {
                            order_by_array[a].column_name = col_system_var;
                            break;
                        }
                    }
                }
            }
            var order_by_obj = order_by_array;
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

        //var tab_index = JSON.parse(storage.getItem('tab_index'));

        var param_obj = [];
        param_obj.push({
            'Flow_Id': sub_flow_id,
            'lat': user_lat,
            'long': user_long,
            'search': "",
            'limit': limit_range,
            'condition': [],
            'system_var': t_push_array,
            'searchValue': "",
            //'searchParticularColumn': searchCol_obj,
            'searchParticularColumn': [],
            'offset': limit_range - default_range,
            'fetch': increment_range,
            'status': status_array,
            'udf_id': sub_udf_id,
            'tab_index': 0,
            'Parent_Task_Id': p_server_task_id,
            'order_by': order_by_obj
        });

        var getdata = new Webservicecall_REST(global_wcf_url + 'OnlineTaskListing', JSON.stringify(param_obj), onsuccess_get_subtask_listing, onfail);
        getdata.callOtherDomain();
    }
}

get_sub_task_listing_by_search_online = (t_new_id, sub_udf_id, sub_flow_id) => {
    curr_type37_new_id = t_new_id;
    glob_task_list_flag = "filter";

    var data_count = get_udf_data_for_subflow(sub_udf_id);
    var list_data = JSON.parse(data_count);

    if (limit_range - default_range == 0) {

        $("#tbl_subtask_" + t_new_id + " tbody tr").each(function () {
            let checkbox_ele = $(this).find("input[type='checkbox']");
            if ($(checkbox_ele).prop('checked') == true) {
                let t_server_task_id = $(this).attr("id");
                let copy_tr = $("tr[id='" + t_server_task_id + "']");
                $("#tbl_subtask_selected_" + t_new_id + "").append(copy_tr);
                $("#tbl_subtask_selected_" + t_new_id + "").show();
            }
        });
        $("#tbl_subtask_" + t_new_id + "").empty();
    }

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

    if (ref_valid > 0) {
        alert1("Please enter required element!");
    }
    else {
        loading();

        var status_array = list_data[0].status;

        var flow_Array = JSON.parse(storage.getItem('flow_Array'));
        if (flow_Array.length == 1) {
            // 2 layer task structure (sales visit > create order from type37)
            var p_server_task_id = JSON.parse(storage.getItem('p_server_task_id'));
        }
        else {
            // 3 level task structure (Sales lead > sales visit > create order from type37)
            var p_server_task_id = JSON.parse(storage.getItem('server_task_id'));
        }

        var include_parent_task = list_data[0].include_parent_task;
        if (include_parent_task == "false") {                           //-------------for urbanJungle(23122019)----////
            p_server_task_id = "0";
        }

        var searchCol_obj = [];
        var search_popup_len = $(".popup-advance-search-online.modal-in").length;
        if (search_popup_len > 0 || glob_task_list_flag == 'filter') {
            search_keyword = '';
            var searchCol_obj = get_column_seach_obj();
            myApp.closeModal('.popup-advance-search-online');
            $('.popup-advance-search-online').hide();
        }

        //default sorting list
        var order_by_array = list_data[0].order_by_array;
        if (order_by_array == "" || order_by_array == null || order_by_array == undefined) {
            var list_order_by = list_data[0].orderby;
            var list_order_type = list_data[0].order_type;

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
            //Default filter column & value show in span
            var col_data = list_data[0].columndata;
            for (var a = 0; a < order_by_array.length; a++) {
                var order_by_val = order_by_array[a].column_name;
                if (order_by_val == null || order_by_val == '' || order_by_val == undefined) {
                    order_by_val = order_by_array[a].order_by;
                }

                var order_by_chktype = order_by_array[a].checksheet_type;
                if (order_by_chktype == null || order_by_chktype == '' || order_by_chktype == undefined) {
                    order_by_array[a].checksheet_type = "0";
                }

                for (c = 0; c < col_data.length; c++) {
                    if (col_data[c].header == order_by_val) {
                        var col_system_var = col_data[c].system_var;
                        if (col_system_var == "" || col_system_var == null || col_system_var == undefined) { }
                        else {
                            order_by_array[a].column_name = col_system_var;
                            break;
                        }
                    }
                }
            }
            var order_by_obj = order_by_array;
        }

        var param_obj = [];
        param_obj.push({
            'Flow_Id': sub_flow_id,
            'lat': 0,
            'long': 0,
            'search': "",
            'limit': limit_range,
            'condition': [],
            'system_var': t_push_array,
            'searchValue': "",
            'searchParticularColumn': searchCol_obj,
            'offset': limit_range - default_range,
            'fetch': increment_range,
            'status': status_array,
            'udf_id': sub_udf_id,
            'tab_index': 0,
            'Parent_Task_Id': p_server_task_id,
            'order_by': order_by_obj
        });

        var getdata = new Webservicecall_REST(global_wcf_url + 'OnlineTaskListing', JSON.stringify(param_obj), onsuccess_get_subtask_listing, onfail);
        getdata.callOtherDomain();
    }
}

onsuccess_get_subtask_listing = (e) => {
    try {
        var type20_columndata = [];
        let myArray_main = JSON.parse(e.responseText);
        let message = myArray_main[0].message;
        let status = myArray_main[0].status;
        var flow_Array = JSON.parse(storage.getItem('flow_Array'));
        var company_id = JSON.parse(storage.getItem('company_id'));
        var t_new_id = curr_type37_new_id;

        loading_hide();

        var data_count = get_udf_data_for_subflow(subflow_udf_id);
        var list_data = JSON.parse(data_count);

        var task_value = list_data[0].task;
        // targeted udf create button hide/ show DV-06082024            

        if (task_value == "true") {
            $("#btn_type_37_CreateTask_" + curr_type37_new_id + "").css('display', 'inline-block');
        }
        else {
            $("#btn_type_37_CreateTask_" + curr_type37_new_id + "").hide();
        }

        if (status == 1) {
            var site_route = list_data[0].site_route;
            if (site_route == "" || site_route == null || site_route == undefined) {
                site_route = "false";
            }

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

            var t_input_column_array = $("#div_aggr_data_" + curr_type37_new_id + "").attr("input-data");
            if (t_input_column_array == "" || t_input_column_array == null || t_input_column_array == undefined || t_input_column_array == "[]") {
                t_input_column_array = [];
            }
            else {
                t_input_column_array = JSON.parse(t_input_column_array);
            }

            var tooltip_qid = $("#div_aggr_data_" + curr_type37_new_id + "").attr("tooltip_qid");
            if (tooltip_qid == "" || tooltip_qid == null || tooltip_qid == undefined) {
                tooltip_qid = "";
            }

            var tooltip_udf_id = $("#div_aggr_data_" + curr_type37_new_id + "").attr("tooltip_udf_id");
            if (tooltip_udf_id == "" || tooltip_udf_id == null || tooltip_udf_id == undefined) {
                tooltip_udf_id = "";
            }

            var task_removable = list_data[0].task_removable;
            var task_editable = list_data[0].task_editable;



            // temporary hide create task button in sub task control 29102024
            //$("#btn_type_37_CreateTask_" + curr_type37_new_id + "").hide();

            for (i = 0; i < myArray_main.length; i++) {
                var ser_task_id = myArray_main[i].server_task_id;
                var myArray = myArray_main[i].columndata;
                var task_status = myArray_main[i].status1;

                var list_item = '';
                var icon_str = '';
                var back_color = 'white';
                var font_color = "color: #000;";
                var mar_btm = "margin-bottom: 2px;";

                var multiple_LatLong_ary = [{ 'Lat 1': "", 'Long 1': "", 'Lat 2': "", 'Long 2': "", }];
                var task_listing_url = list_data[0].task_listing_url;
                if (task_listing_url == "" || task_listing_url == null || task_listing_url == undefined) {
                    var default_columndata = list_data[0].columndata;
                    var d_len = default_columndata.length;
                    for (d = 0; d < d_len; d++) {
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
                }
                else {
                    //---when task listing url then user api columndata for listing [13072021]
                    var myArray = myArray_main[i].columndata;
                }

                list_item += '<li id ="lst_' + ser_task_id + '" class="' + cls_task_layout + '" style="background-color:' + back_color + ';' + font_color + mar_btm + '"><label class="label-checkbox item-content">';

                if (t_input_column_array.length > 0) {
                    list_item += '<input type="checkbox" name="li_chk" class="myChecksheet" data-task-id=' + ser_task_id + ' onchange="toggle_input(this)" ><div class="item-media"><i class="icon icon-form-checkbox"></i></div>';
                }
                else {
                    var bulk_approval_status = list_data[0].bulk_approval_status;
                    if (bulk_approval_status.length == 0) {
                        list_item += '';
                    }
                    else {
                        let update_status = bulk_approval_status[0].status;

                        //    let param = "check_n_take_action_on_task('" + ser_task_id + "','" + update_status + "', '" + curr_type37_new_id + "', '0')";
                        //    list_item += '<a class="task-icon-list" onclick="' + param + '" data-toggle="tooltip" data-placement="left" title="" data-original-title="Remove item"><i class="fa fa-trash-o m-0" style="font-size:20px;"></i></a>';
                    }
                }

                list_item += '<div class="item-inner item-no-pad" style="padding-right:7px!important; margin-right: 7px;padding-bottom:0 !important;"><div class="item-title" style="width: 100% !important;">';

                var colwise_align = list_data[0].colwise_align;
                if (colwise_align == '' || colwise_align == null || colwise_align == undefined) {
                    colwise_align = "false";
                }

                list_item += '<div class="readmore">';
                if (colwise_align == 'true') {
                    list_item += '<table style="width: 100% !important;vertical-align: top !important;">';
                }
                else {
                    list_item += '<table style="width: 100% !important;vertical-align: top !important;" class="rowwise-align">';
                }

                let Avl_Quantity = '';
                //let h_found = 0;
                for (j = 0; j < myArray.length; j++) {
                    var ctrl_type = myArray[j].ctrl_type;
                    var que_id = myArray[j].qid;
                    var header = myArray[j].header;
                    var ans_lable = myArray[j].ans;
                    var font_size = myArray[j].font_size;
                    var format = myArray[j].format;
                    var color = myArray[j].color;
                    var align = myArray[j].align;
                    if (align == "" || align == null || align == undefined) {
                        align = "left";
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

                    var taskview_label = list_data[0].taskview_label;
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

                    var t_header = myArray[j].header;
                    var header_sys_str = t_header.replace(': ', '');

                    type20_columndata.push({
                        header: header_sys_str,
                        ans: ans_lable
                    });

                    //if ((header_sys_str == "Available Qty" || header_sys_str == "Available Percentage") && t_input_column_array.length > 0) {
                    if (t_input_column_array.length > 0) {
                        if (t_input_column_array[0].columndata_que_id == que_id) {
                            Avl_Quantity = ans_lable;
                            let param1 = "open_task_form_for_po_line_item_single('this'," + i + ", '" + curr_type37_new_id + "', '" + ser_task_id + "')";
                            ans_lable = '<div class="item-input item-input-field form-div not-empty-state" style="min-height:20px;"><input type="number" class="form-ele w-100" avail_qty="' + Avl_Quantity + '" value="' + Avl_Quantity + '" style="height:20px;font-size:9pt;text-align:right;" disabled></div>';
                        }
                    }

                    var is_hide = myArray[j].is_hide;
                    if (is_hide == "true") { }
                    else {
                        var t_aggr_column_array = $("#div_aggr_data_" + curr_type37_new_id + "").attr("data");
                        if (t_aggr_column_array == "" || t_aggr_column_array == null || t_aggr_column_array == undefined) { }
                        else {
                            t_aggr_column_array = JSON.parse(t_aggr_column_array);
                            for (a = 0; a < t_aggr_column_array.length; a++) {
                                let a_header = t_aggr_column_array[a].header;
                                if (header_sys_str.toLowerCase() == a_header.toLowerCase()) {
                                    let aggr_data = encodeURIComponent(JSON.stringify(t_aggr_column_array[a]));
                                    header = '<span class="theme_type20_tableview" aggr_data="' + aggr_data + '">' + header + '</span>';
                                    //h_found++;
                                    break;
                                }
                            }
                        }
                    }

                    if (is_hide == "true") { }
                    else {
                        if (colwise_align == 'true') {
                            if ((j) % 2 == 0) {
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

                            if ((j) % 2 == 0) { }
                            else {
                                list_item += '</tr>';
                            }
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

                for (a = 0; a < t_input_column_array.length; a++) {
                    list_item += '<tr><td colspan="2" style="width: 173px; display: block">';

                    let param = "open_task_form_for_po_line_item(" + i + ", '" + curr_type37_new_id + "', '" + ser_task_id + "')";
                    list_item += '<input type="button" id="btn_Create_Task_' + ser_task_id + '" value="Create Invoice" class="button button-fill" style="visibility: hidden" onclick="' + param + '">';

                    list_item += '</td>';
                }

                list_item += '<input type="hidden" id="hdn_columndata_' + ser_task_id + '" value="' + encodeURIComponent(JSON.stringify(type20_columndata)) + '">';
                list_item += '</tr>';

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

                list_item += '<span class="readmore-link" onclick="show_more_task_data(this);" style="background-image: linear-gradient(to bottom, transparent, ' + showmore_back_color + ');display:none;"><div class="showmore-box">Show More <i class="fa fa-angle-down"></i></div></span>';
                list_item += '</div>';

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

                let t_global_var = myArray_main[i].global_var;
                list_item += '<input type="hidden" id="lst_global_var_' + ser_task_id + '" value="' + encodeURIComponent(t_global_var) + '">';
                list_item += '<input type="hidden" id="lst_sys_var_' + ser_task_id + '" value="' + encodeURIComponent(JSON.stringify(type20_columndata)) + '">';
                type20_columndata = [];

                var task_remove_str = '';
                if (task_removable == 'true') {
                    var param_remove_sub = "remove_last_subtask_cntrl_online('" + ser_task_id + "', '" + task_status + "','" + curr_type37_new_id + "')";
                    task_remove_str += '<a id="img_remove_' + i + '" href="#" class="swipeout-delete cls_remove" onclick ="' + param_remove_sub + '">Delete</a>';
                }

                var task_edit_str = '';
                if (task_editable == "true") {
                    var param_edit_task = "Task_Edit_Subtask(" + ser_task_id + ")";
                    task_edit_str += '<a id="btn_task_edit_' + ser_task_id + '"  onclick="' + param_edit_task + '" style="transform: translate3d(0, 0px, 0px);">Edit</a>';
                }

                if (task_editable == 'true' || task_removable == 'true') {
                    list_item += '<div class="swipeout-actions-right" style="right: 0% !important;">';
                    list_item += task_edit_str;
                    list_item += task_remove_str;
                    list_item += '</div>';
                }

                list_item += '</li>';
                $("#tbl_subtask_" + t_new_id + "").append(list_item);

                if (Avl_Quantity == 0) {
                    $("input[type='checkbox'][data-task-id='" + ser_task_id + "']").attr("disabled", "disabled");
                    $("#lst_" + ser_task_id + "").find('.icon-form-checkbox').addClass("disabled");
                }

                $("#tbl_subtask_" + t_new_id + " li").each(function () {
                    var li_height = $("#tbl_subtask_" + t_new_id + " li").height();
                    if (li_height < 110) {  //130=max-height of li
                        $('.readmore-link').hide();
                    }
                    else {
                        $('.readmore-link').show();
                    }
                })

                $("#tbl_subtask_" + t_new_id + " > li").last().addClass("swipeout");

                /*}*/
            }

            var ul_length = $("#tbl_subtask_" + t_new_id + " > li").length;
            if (ul_length == 0) {
                var list_item = '<li><a href="#" class="item-link item-content"><div class="item-inner item-no-pad"><div class="item-title">No Record Found !</div></div></a></li>';
                $("#tbl_subtask_" + t_new_id + "").append(list_item);
            }

            var crash_status = JSON.parse(storage.getItem('crash_status'));
            if (crash_status == null || crash_status == undefined || crash_status == '') {
                crash_status = 0;
            }
            if (crash_status == 2) {
                // application has been crashed
                storage.setItem('crash_status', JSON.stringify('0'));
            }

            var li_length = $("#tbl_subtask_" + t_new_id + " > li:not(:hidden)").length;
            var f_li_text = $("#tbl_subtask_" + t_new_id + " > li:first").text();
            if (li_length == 1 && f_li_text == 'No Record Found !') {
                li_length = 0;
            }

            $('.readmore-link, .task_cardview .item-inner').click(function (event) {
                event.stopImmediatePropagation();
                event.preventDefault();
            });

            calculate_aggregate_data(curr_type37_new_id);

            if (li_length >= limit_range) {
                $("#subtask_container").scroll(function () {
                    var offsetHeight = document.getElementById("subtask_container").offsetHeight;
                    var scrollTop = document.getElementById("subtask_container").scrollTop;
                    var scrollHeight = document.getElementById("subtask_container").scrollHeight;

                    // added 2nd or condition as show more not callled due to 1 pixel change 29112022
                    if (parseInt(scrollTop) === (parseInt(scrollHeight) - parseInt(offsetHeight)) || parseInt(scrollTop) === (parseInt(scrollHeight) - parseInt(offsetHeight) - 1)) {
                        $("#subtask_container").unbind('scroll');
                        let sub_flow_id = JSON.parse(storage.getItem('redirect_flow_id'));
                        see_more_site_list_common_subtask(curr_type37_new_id, subflow_udf_id, sub_flow_id);
                    }
                });
            }
            else {
            }
        }
        else {
            sub_task_Array = [];
        }

        loading_hide();
    }
    catch (e) {
        alert1(e + '_onsuccess_get_subtask_listing');
    }
}

check_n_create_invoice_task_pre = (t_new_id) => {

    let selected = 0;
    sub_task_Array = [];
    //$("#tbl_subtask_" + t_new_id + " tbody tr").each(function () {
    $("#tbl_subtask_" + t_new_id + " li").each(function () {
        let checkbox_ele = $(this).find("input[type='checkbox']");
        if ($(checkbox_ele).prop('checked') == true) {
            let t_server_task_id = $(this).attr("id");
            t_server_task_id = t_server_task_id.replace('lst_', '');
            sub_task_Array.push({
                "server_task_id": t_server_task_id
            });
            selected++;
        }
    });

    // in case of selected and filter sub task listing - mk - 17072024
    //$("#tbl_subtask_selected_" + t_new_id + " tbody tr").each(function () {
    $("#tbl_subtask_selected_" + t_new_id + " li").each(function () {
        let checkbox_ele = $(this).find("input[type='checkbox']");
        if ($(checkbox_ele).prop('checked') == true) {
            let t_server_task_id = $(this).attr("id");
            t_server_task_id = t_server_task_id.replace('lst_', '');
            sub_task_Array.push({
                "server_task_id": t_server_task_id
            });
            selected++;
        }
    });

    if (sub_task_Array.length > 0) {
        let check_validation = "true";
        var t_input_column_array = $("#div_aggr_data_" + t_new_id + "").attr("input-data");
        if (t_input_column_array == "" || t_input_column_array == null || t_input_column_array == undefined || t_input_column_array == "[]") { }
        else {
            t_input_column_array = JSON.parse(t_input_column_array);
            check_validation = t_input_column_array[0].check_validation;
            if (check_validation == "" || check_validation == null || check_validation == undefined) {
                check_validation = "true";
            }
        }

        if (check_validation == "true") {
            compare_available_qty(t_new_id);
        }
        else {
            check_n_create_main_task(t_new_id);
        }
    }
    else {
        alert1("Please select atleast 1 PO item!");
    }
}

compare_available_qty = (t_new_id) => {
    let invalid_qty_found = 0;
    for (let s = 0; s < sub_task_Array.length; s++) {
        let t_server_task_id = sub_task_Array[s].server_task_id;
        let avail_qty = $("li[id=lst_" + t_server_task_id + "]").find("input.w-100").attr("avail_qty");
        let input_qty = $("li[id=lst_" + t_server_task_id + "]").find("input.w-100").val();
        if (input_qty == "0") {
            alert1("Required quantity must be greater than 0!");
            invalid_qty_found++;
            break;
        }
        else if (parseInt(input_qty) > parseInt(avail_qty)) {
            alert1("Required quantity must be less than available quantity, it should not more than " + avail_qty + "!");
            invalid_qty_found++;
            break;
        }
    }

    if (invalid_qty_found == 0) {
        $("#container_btn_div a.link").attr("disabled", "disabled");
        $("#container_btn_div a.link").css("background-image", "none");
        check_n_create_main_task(t_new_id);
    }
}

check_n_create_main_task = (t_new_id) => {
    var t_main_column_array = $("#div_aggr_data_" + t_new_id + "").attr("main-data");
    if (t_main_column_array == "" || t_main_column_array == null || t_main_column_array == undefined || t_main_column_array == "[]") {
        t_main_column_array = [];

        // no main task creation
        check_n_create_invoice_task();
    }
    else {
        // main task creation
        t_main_column_array = JSON.parse(t_main_column_array);
        let flow_id = t_main_column_array[0].main_flow_id;
        let flow_name = t_main_column_array[0].main_flow_name;
        let t_checksheet_id = t_main_column_array[0].main_checksheet_id;

        curr_all_data_20["parent_task_id"] = 0;
        curr_all_data_20["invoice_flow_id"] = flow_id;
        curr_all_data_20["invoice_flow_name"] = flow_name;

        get_blank_task_checksheet(t_checksheet_id);

    }
}


check_n_create_invoice_task = () => {
    if (sub_task_Array.length > 0) {
        let server_task_id = sub_task_Array[0].server_task_id;
        //$(".grd_subtask  tr[id='" + server_task_id + "']").find("input").attr("data-change", "1");
        $("#btn_Create_Task_" + server_task_id + "").trigger("click");
    }
}

calculate_aggregate_data = (t_new_id) => {
    $("#div_aggr_data_" + t_new_id + "").empty();
    let row_count = 0;
    $("#tbl_subtask_" + t_new_id + " li:first-child").find('table tr').each(function () {
        row_count++;

        let aggr_data = $(this).find('td').find('span.theme_type20_tableview').attr("aggr_data");
        if (aggr_data == "" || aggr_data == null || aggr_data == undefined) { }
        else {
            aggr_data = JSON.parse(decodeURIComponent(aggr_data));
            let aggregate_fun = aggr_data.aggregate_fun;
            let target_class = aggr_data.target_class;

            // found aggregate function
            let result = get_aggregate_result_from_table("#tbl_subtask_" + t_new_id + "", row_count, aggregate_fun);
            $("." + target_class + "").show();
            $("." + target_class + " input").val(result);

            let header = $(this).find('td').find('span.theme_type20_tableview').html();
            $("#div_aggr_data_" + t_new_id + "").append("<b>" + header + ": </b> " + result + "<br>");
        }
    });


    if (po_task_created == 0) {
        po_task_created = 1;
        check_n_create_invoice_task();
    }
}

get_aggregate_result_from_table = (t_table_id, row_index, aggregate_fun) => {
    let result = 0;
    $("" + t_table_id + " li").each(function () {
        //let cellValue = $(this).find('table').find('tr:nth-child(' + row_index + ')').find('td span.theme_type20_tableview').parents('td').siblings('td.cls_search').text();                //aggr header cell value [FT-01082024]
        let cellValue = $(this).find('table').find('tr:nth-child(' + row_index + ')').find('td span.theme_type20_tableview').parents('td').find('.cls_search').text();                //aggr header cell value [FT-01082024]
        if (cellValue == "" || cellValue == null || cellValue == undefined) {
            cellValue = 0;
        }
        else {
            cellValue = parseFloat(cellValue);
        }

        if (aggregate_fun == "sum") {
            result = result + cellValue;
        }
    });

    return result;
}

function see_more_site_list_common_subtask(t_new_id, sub_udf_id, sub_flow_id) {
    limit_range = limit_range + increment_range;

    if (glob_task_list_flag == 'normal') {
        get_sub_task_listing(t_new_id, sub_udf_id, sub_flow_id);
    }
    else {
        get_sub_task_listing_by_search_online(t_new_id, sub_udf_id, sub_flow_id);
    }
}

var type37_input_Element;
set_value_change_flag = (t_elem) => {
    type37_input_Element = t_elem;
    //$(t_elem).attr("data-change", "1");
}

toggle_input = (t_elem) => {
    let t_server_task_id = $(t_elem).attr("data-task-id");
    let is_checked = $(t_elem).prop('checked');
    if (is_checked == true) {
        $("li[id=lst_" + t_server_task_id + "]").find("input.w-100").removeAttr("disabled");
    }
    else {
        $("li[id=lst_" + t_server_task_id + "]").find("input.w-100").attr("disabled", "disabled");
    }
    $("li[id=lst_" + t_server_task_id + "]").find(".readmore-link").trigger('onclick');

    return false
}

open_task_form_for_po_line_item_single = (t_elem, t_index, t_new_id, PO_LI_task_id) => {
    type37_input_Element = t_elem;
    sub_task_Array = [];
    open_task_form_for_po_line_item(t_index, t_new_id, PO_LI_task_id);
}

open_task_form_for_po_line_item = (t_index, t_new_id, PO_LI_task_id) => {
    let t_qty = $("#div_subtask_" + t_new_id + " #lst_" + PO_LI_task_id + "").find("input.w-100").val();
    if (t_qty == "" || t_qty == null || t_qty == undefined) {
        $("#container_btn_div a.link").removeAttr("disabled");
    }
    else {
        var t_input_column_array = $("#div_aggr_data_" + t_new_id + "").attr("input-data");
        if (t_input_column_array == "" || t_input_column_array == null || t_input_column_array == undefined || t_input_column_array == "[]") {
            t_input_column_array = [];
        }
        else {
            t_input_column_array = JSON.parse(t_input_column_array);
            let flow_id = t_input_column_array[0].input_flow_id;
            let flow_name = t_input_column_array[0].input_flow_name;
            let t_checksheet_id = t_input_column_array[0].input_checksheet_id;
            //let t_que_id = t_input_column_array[0].input_que_id;
            let columndata_header = t_input_column_array[0].columndata_header;

            var columndata_str = $("#hdn_columndata_" + PO_LI_task_id + "").val();
            if (columndata_str == "" || columndata_str == null || columndata_str == undefined) {
                var columndata_Array = [];
            }
            else {
                var columndata_Array = JSON.parse(decodeURIComponent(columndata_str));
            }

            for (c = 0; c < columndata_Array.length; c++) {
                let t_header = columndata_Array[c].header;
                if (t_header == "Available Quantity" || t_header == "Available Material (ml)" || t_header == "Available Qty" || t_header == "Available Percentage" || t_header == columndata_header) {
                    columndata_Array[c].ans = t_qty;
                    break;
                }
            }

            //store main and sub task columndata for type37 control new sub task creation on submit btn [FT-07082024]
            var flow_Array = JSON.parse(storage.getItem('flow_Array'));
            if (flow_Array.length == 1) {
                var main_task_columndata = JSON.parse(storage.getItem('type20_columndata'));
                storage.setItem('parent_type20_columndata', JSON.stringify(main_task_columndata));
                columndata_Array = columndata_Array.concat(main_task_columndata);                           //save parent n only 1 sub task columndata [26072021]
            }

            localStorage.setItem('type20_columndata', JSON.stringify(columndata_Array));
            storage.setItem('type20_columndata', JSON.stringify(columndata_Array));

            var p_server_task_id = JSON.parse(storage.getItem('p_server_task_id'));

            curr_all_data_20["invoice_flow_id"] = flow_id;
            curr_all_data_20["invoice_flow_name"] = flow_name;
            curr_all_data_20["parent_task_id"] = p_server_task_id;
            curr_all_data_20["po_server_task_id"] = PO_LI_task_id;

            flow_name = flow_name.replaceAll(" ", "%20");

            get_blank_task_checksheet(t_checksheet_id);
        }
    }
}

get_blank_task_checksheet = (t_checksheet_id) => {

    if (t_checksheet_id == "" || t_checksheet_id == null || t_checksheet_id == undefined) {
        alert1("Target task checksheet is not found in input column array!");
        loading_hide();
        return false;
    }

    $(".outer-invoice-task").show();

    var company_id = JSON.parse(storage.getItem('company_id'));
    var user_id = window.storage.getItem("user_id");

    var param_obj = [];
    param_obj.push({
        'Company_Id': company_id,
        'User_Id': user_id,
        'checksheetid': t_checksheet_id,
        'step': 1,
        'trip_id': 0
    });

    var getdata = new Webservicecall_REST(common_global_wcf_url + 'WCF_GetCheckSheetData_Port', JSON.stringify(param_obj), function (e) {
        var responseText = JSON.parse(e.responseText);
        var status = responseText[0].status;
        if (status == 1) {
            //var myArray = JSON.parse(e);
            var myArray = JSON.parse(responseText[0].data);
            if (myArray.length > 0) {
                var heading = myArray[0].subcategory;
                var check_type = myArray[0].checksheetid;
                var step = myArray[0].step;
                var data = JSON.parse(myArray[0].data);
                var buttons = JSON.parse(myArray[0].buttons);
                storage.setItem('check_type_task', check_type);
                read_dynamic_checksheet(heading, check_type, step, data, buttons, 14, 0);
            }
        }
        else {
            var message = responseText[0].message;
            mk_notify(message, "error");
        }
    }, onfail);
    getdata.callOtherDomain();
}

function validate_invoice_task_form() {
    // if (Type20_AutoFill_DDL_Array.length == 0) {
    curr_btn_mode = "static_create_task";
    validate_and_submit_surveydata(1, 14, jsonObj_old);
    if (Validation_True == 0) {
        // successfull task creation
    }
}

// Delete icon 
function remove_last_subtask_cntrl_online(ser_task_id, selected_start_status, curr_type37_new_id) {
    try {
        curr_type_37_new_id = curr_type37_new_id;
        var user_choice = confirm("Are you sure, you want to remove this task?");
        if (user_choice == true) {
            loading();

            var company_id = JSON.parse(storage.getItem('company_id'));
            var siteid = JSON.parse(storage.getItem('siteid'));
            //var flow_id = JSON.parse(storage.getItem('wayflow'));
            var flow_id = list_flow_id;

            var check_type = JSON.parse(storage.getItem('check_type'));
            if (check_type == '' || check_type == null || check_type == undefined) {
                check_type = 0;
            }

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
                'servertaskid': ser_task_id,
                'status': "-1",
                'old_status': selected_start_status,
                'step': 1,
                'moduledef': "",
                'global_var': '',
                'flow_id': flow_id,
                'company_id': company_id,
                'punch_flag': 0,
                'in_ms': 0,
                'out_ms': 0,
                'duration': 0,
                'utcmilliseconds': utcmilliseconds,
                'timezone': timezone
            });

            var getdata = new Webservicecall_REST(global_wcf_url + 'WCFTechnicianDataUpload', JSON.stringify(param_obj), function (e) {
                var res_text = e.responseText;
                var result = eval('(' + res_text + ')');
                var message = result[0].message;
                var status = result[0].status;
                if (status == 1) {
                    loading_hide();
                    /* subtask_tagret_list();*/
                    $("#btn_type_37_refresh_" + curr_type_37_new_id + "").trigger("click");
                }
                else {
                    alert(message);
                    loading_hide();
                }
            }, onfail);
            getdata.callOtherDomain();
        }
    }
    catch (e) {
        alert1(e + '_remove_last_subtask_cntrl_online');
    }
}


function Task_Edit_Subtask(server_task_id) {
    loading();
    myApp.popup('.popup-new-task-create');

    localStorage.setItem('task_mode', 'Update Task');
    storage.setItem('server_task_id', server_task_id);
    curr_all_data_20["parent_task_id"] = server_task_id;

    server_task_id = JSON.parse(server_task_id);

    var listing_udf_id = subflow_udf_id;
    storage.setItem('sub_udf_id', JSON.stringify(listing_udf_id));
    storage.setItem('wayflow', JSON.stringify(list_flow_id));
    storage.setItem('wayflow_name', JSON.stringify(list_flow_name));

    var data_count = get_udf_data_for_subflow(listing_udf_id);
    var list_data = JSON.parse(data_count);
    var f_list_data = JSON.stringify(list_data[0]);
    storage.setItem('list_json', JSON.stringify("[" + f_list_data + "]"));                      //list_json storage for invoice subtask udf id for new task creation [FT-27092024]

    var Param_obj = [];
    Param_obj.push({
        'task_id': server_task_id
    });
    var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_Select_TaskId_Wise_Task_Master_And_Sub', JSON.stringify(Param_obj), onsuccess_Task_Edit_Subtask, onfail);
    getdata.callOtherDomain();
}

function onsuccess_Task_Edit_Subtask(invocation1) {
    var Json_edit = invocation1.responseText;
    Json_edit = eval('(' + Json_edit + ')');
    var message = Json_edit[0].message;
    var Status = Json_edit[0].status;

    if (Status == 1) {
        message = eval('(' + Json_edit[0].data + ')');

        var checksheet_id = message[0].checksheet_id;
        var createby = message[0].createby;
        var subcategory = message[0].subcategory;
        var data = message[0].data;

        // if type 36 value array of array exist DV-10062024          
        var is_val_exist = type36_exist_json(data);
        if (is_val_exist == false) {
            data = data.replace('[[', '[');
            data = data.replace(']]', ']');
        }

        data = eval('(' + data + ')');

        storage.setItem('check_type_task', JSON.stringify(checksheet_id));

        read_dynamic_surveydata(subcategory, checksheet_id, 1, data, "", 6, 0);
    }
    else {
        loading_hide();
        alert(message + "_onsuccess_Task_Edit_Subtask");
    }
}

var curr_listing_udf = "";
function data_to_read_target_udf(listing_udf_id) {
    try {
        curr_listing_udf = listing_udf_id;
        storage.setItem('sub_udf_id', JSON.stringify(listing_udf_id));
        storage.setItem('wayflow', JSON.stringify(list_flow_id));
        storage.setItem('wayflow_name', JSON.stringify(list_flow_name));

        var data_count = get_udf_data_for_subflow(listing_udf_id);
        var list_data = JSON.parse(data_count);
        var f_list_data = JSON.stringify(list_data[0]);
        storage.setItem('list_json', JSON.stringify("[" + f_list_data + "]"));                      //list_json storage for invoice subtask udf id for new task creation [FT-27092024]

        var p_server_task_id = JSON.parse(storage.getItem('p_server_task_id'));
        curr_all_data_20["parent_task_id"] = p_server_task_id;

        var flow_Array = JSON.parse(storage.getItem('flow_Array'));
        if (flow_Array.length == 2) {
            //for 3rd layer subtask creation default value autofill issue
            storage.setItem('parent_type20_columndata', JSON.stringify(''));
        }

        create_new_task(listing_udf_id);
    }
    catch (e) {
        alert1(e + '_data_to_read_target_udf');
    }
}

function close_new_task_create_popup() {
    try {
        myApp.closeModal('.popup-new-task-create');

        //reset flow_id/flow_name/list_json on new task create popup close [FT-14052025]
        var flow_Array = JSON.parse(storage.getItem('flow_Array'));
        var index = flow_Array.length - 1;
        var id = flow_Array[index].id;
        var flow_id = flow_Array[index].wayflow;
        var flow_name = flow_Array[index].wayflow_name;
        var list_json = flow_Array[index].list_json;

        storage.setItem('udf_id', JSON.stringify(id));
        storage.setItem('wayflow', JSON.stringify(flow_id));
        storage.setItem('wayflow_name', JSON.stringify(flow_name));

        var task_checksheetid = flow_Array[index].task_checksheetid;
        storage.setItem('check_type_task', JSON.stringify(task_checksheetid));

        var tab_index = flow_Array[index].tab_index;
        if (tab_index == "" || tab_index == null || tab_index == undefined) {
            tab_index = 0;
        }
        list_json = JSON.parse(list_json);
        var f_list_data = JSON.stringify(list_json[tab_index]);
        storage.setItem('list_json', JSON.stringify("[" + f_list_data + "]"));

        var server_task_id = flow_Array[index].server_task_id;
        if (server_task_id == "" || server_task_id == null || server_task_id == undefined) { }
        else {
            storage.setItem('server_task_id', JSON.stringify(server_task_id));
        }
    }
    catch (e) {
        alert(e + '_close_new_task_create_popup');
    }
}