

function check_child_flow_for_parent() {
    try {

        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var subflow_listview = list_data[0].subflow_listview;

        let t_udf_id = JSON.parse(storage.getItem('udf_id'));
        if (t_udf_id == "2391" || t_udf_id == "2392" || t_udf_id == "2559" || t_udf_id == "2561") {
            // required groupwise in landload module - mk - 05092025
            // (rahul.ce role - 2391, 2392)
            // (rahul.saq role - 2559, 2561)
        }
        else {
            // force listing with hybrid (same as web) - 05022024)
            subflow_listview = "hybrid";
        }

        if (subflow_listview == 'hybrid') {
            // new structure [subflow + checksheet] (sublow listing base on flow_master mapping) (SO Details Multiflow)
            get_checklist_data_for_subtask_hybrid();
        }
        else {
            // old structure [subflow + group] (sub flow listing base on udf)

            // sub_flow_Array = [];
            var flow_Array = JSON.parse(storage.getItem('flow_Array'));
            var udf_id = flow_Array[flow_Array.length - 1].id;
            if (udf_id == 0 || udf_id == '' || udf_id == null || udf_id == undefined) {
                alert1("No task checksheet is mapped to this flow!");
            } else {
                var role_id_array = localStorage.getItem('role_id_array');
                var query = "SELECT * FROM  User_Define_Flow_Master WHERE p_id = " + udf_id + " and rollid in (" + role_id_array + ") and (is_delete != 1 or is_delete IS NULL)";
                var q_jsonobj = [];
                q_jsonobj.push({
                    data: query,
                    p: "1"
                });
                cordova.exec(onsuccess_check_child_flow_for_parent, onfail_check_child_flow_for_parent, 'SqlitePlugin', 'showValues', q_jsonobj);
            }
        }
    } catch (e) {
        alert1(e + '_check_child_flow_for_parent()')
    }
}

function onsuccess_check_child_flow_for_parent(e) {
    try {
        var myArray = JSON.parse(e);
        if (myArray.length == 0) {
            // child flow not exist
            check_server_date();
        } else {
            // child flow exist
            // append_child_flows_to_list(myArray);
            storage.setItem('t_subflow_list', JSON.stringify(myArray));
            // get_global_var_sub_for_task();
            // get_sub_flowlist_data();
            get_checklist_data_for_subtask();
        }
    } catch (e) {
        alert1(e + "_onsuccess_check_child_flow_for_parent()");
    }
}

function onfail_check_child_flow_for_parent(e) {
    alert1(e + '_onfail_check_child_flow_for_parent()');
    loading_hide();
}

function get_checklist_data_for_subtask() {
    try {
        var flow_Array = JSON.parse(storage.getItem('flow_Array'));
        if (flow_Array.length === 1) {
            var moduleid = JSON.parse(storage.getItem('wayflow'));
        } else {
            var moduleid = flow_Array[flow_Array.length - 1].wayflow;
        }

        var query = "select data from flow_master where moduleid = '" + moduleid + "'";
        //alert1(query);
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "1"
        });
        cordova.exec(onsuccess_get_checklist_data_for_subtask, onfail_get_checklist_data_for_subtask, 'SqlitePlugin', 'showValues', q_jsonobj);
    } catch (e) {
        alert1(e + '_get_checklist_data_for_subtask()')
    }
}

function onsuccess_get_checklist_data_for_subtask(e) {
    try {
        var myArray = JSON.parse(e);
        if (myArray == '' || myArray == null || myArray == undefined || myArray.length == 0) {
            var flow_Array = JSON.parse(storage.getItem('flow_Array'));
            var flow_id = flow_Array[flow_Array.length - 1].wayflow;
            var flow_flowname = flow_Array[flow_Array.length - 1].wayflow_name;
            alert1(flow_flowname + " (" + flow_id + ") flow not found in flow master ! ");
            loading_hide();
        }
        else {

            var task_checklist_data = myArray[0].data;
            storage.setItem('task_data_column', task_checklist_data);
            //get_list_of_pm_subflow();

            // sitewise module listing change
            var data_json = JSON.parse(storage.getItem('list_json'));
            var list_data = JSON.parse(data_json);
            var multiflow_list = list_data[0].multiflow_list;
            var flow_id_found = 0;
            if (multiflow_list == '' || multiflow_list == null || multiflow_list == undefined) {
                get_list_of_pm_subflow();
            }
            else {
                var sub_flow_id_found = 0;
                var t_task_checklist_data = JSON.parse(task_checklist_data);
                for (var i = 0; i < t_task_checklist_data.length; i++) {
                    var sub_flow_id = t_task_checklist_data[i].sub_flow_id;
                    if (sub_flow_id == '' || sub_flow_id == null || sub_flow_id == undefined || sub_flow_id == 0) { } else {
                        sub_flow_id_found++;
                        break;
                    }
                }

                if (sub_flow_id_found == 0) {
                    // sub flow not found
                    check_server_date();
                }
                else {
                    // sub flow found
                    get_list_of_pm_subflow();
                }
            }
        }
    } catch (e) {
        alert1(e + '_get_checklist_data_for_subtask()');
    }
}

function onfail_get_checklist_data_for_subtask(e) {
    alert1(e + '_get_checklist_data_for_subtask()');
}

function get_list_of_pm_subflow() {
    try {
        var tid = JSON.parse(storage.getItem('tid'));
        var query = "SELECT status, global_var, is_delete_sub FROM task_master WHERE tid = " + tid + "";
        //alert1(query);
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "1"
        });
        cordova.exec(onsuccess_get_list_of_pm_subflow, onfail_get_list_of_pm_subflow, 'SqlitePlugin', 'showValues', q_jsonobj);
    } catch (e) {
        alert1(e + '_get_list_of_pm_subflow()')
    }
}

function onsuccess_get_list_of_pm_subflow(e) {
    try {
        var myArray = JSON.parse(e);
        var start_status = myArray[0].status;
        storage.setItem('start_status', JSON.stringify(start_status));

        var is_delete_sub = myArray[0].is_delete_sub;
        localStorage.setItem('is_delete_sub', is_delete_sub);

        var checksheet_list = JSON.parse(storage.getItem('task_data_column'));

        // /--- set global values in storage start ------/ //
        var global_var_obj = myArray[0].global_var;
        if (global_var_obj == null || global_var_obj == "null" || global_var_obj == undefined || global_var_obj == "" || global_var_obj == " " || global_var_obj == "Unknown") {
            // Creating new global var
            var checksheet_dependency = [];
            var new_checksheet_list = [];
            for (j = 0; j < checksheet_list.length; j++) {
                var is_mandatory = checksheet_list[j].is_mandatory;
                var is_disabled = checksheet_list[j].is_disabled;
                var is_submited = checksheet_list[j].is_submited;
                if (is_submited == 1 || is_mandatory == 0 || is_disabled == 1) {
                    is_submited = 1;
                }
                else {
                    is_submited = 0;
                }
                new_checksheet_list.push({
                    'role_id': checksheet_list[j].role_id,
                    'checksheetid': checksheet_list[j].checksheetid,
                    'start_status': checksheet_list[j].start_status,
                    'end_status': checksheet_list[j].end_status,
                    'is_flow': checksheet_list[j].is_flow,
                    'is_submited': is_submited,
                    'is_mandatory': is_mandatory,
                    'is_disabled': is_disabled,
                    'sub_flow_id': checksheet_list[j].sub_flow_id,
                    'reject_status': checksheet_list[j].reject_status,
                    'Checksheet_Icon': checksheet_list[j].Checksheet_Icon
                });
            }
        } else {
            var myArray1 = JSON.parse(global_var_obj);
            var new_checklist_obj = myArray1[0].new_checklist;
            if (new_checklist_obj == null || new_checklist_obj == undefined || new_checklist_obj == "" || new_checklist_obj == "Unknown") {
                var new_checksheet_list = [];
                for (j = 0; j < checksheet_list.length; j++) {
                    var is_mandatory = checksheet_list[j].is_mandatory;
                    var is_disabled = checksheet_list[j].is_disabled;
                    var is_submited = checksheet_list[j].is_submited;
                    if (is_submited == 1 || is_mandatory == 0 || is_disabled == 1) {
                        is_submited = 1;
                    }
                    else {
                        is_submited = 0;
                    }
                    new_checksheet_list.push({
                        'role_id': checksheet_list[j].role_id,
                        'checksheetid': checksheet_list[j].checksheetid,
                        'start_status': checksheet_list[j].start_status,
                        'end_status': checksheet_list[j].end_status,
                        'is_flow': checksheet_list[j].is_flow,
                        'is_submited': is_submited,
                        'is_mandatory': is_mandatory,
                        'is_disabled': is_disabled,
                        'sub_flow_id': checksheet_list[j].sub_flow_id,
                        'reject_status': checksheet_list[j].reject_status,
                        'Checksheet_Icon': checksheet_list[j].Checksheet_Icon
                    });
                }
            } else {
                var old_checksheet_list = new_checklist_obj;
                var new_checksheet_list = [];

                // removed unused object from global var
                old_checksheet_list = remove_unused_object_from_global_var(checksheet_list, old_checksheet_list);

                // merge global var/ second user login (on server 1st user global var saved (siklu))
                for (k = 0; k < checksheet_list.length; k++) {
                    var loc_checksheetid = checksheet_list[k].checksheetid;
                    var loc_start_status = checksheet_list[k].start_status;
                    var loc_sub_flow_id = checksheet_list[k].sub_flow_id;
                    var role_id = checksheet_list[k].role_id;
                    var loc_chk_found = 0;

                    for (m = 0; m < old_checksheet_list.length; m++) {
                        var ser_checksheetid = old_checksheet_list[m].checksheetid;
                        var ser_start_status = old_checksheet_list[m].start_status;
                        var ser_sub_flow_id = old_checksheet_list[m].sub_flow_id;
                        var ser_role_id = old_checksheet_list[m].role_id;

                        if (ser_checksheetid == loc_checksheetid && ser_start_status == loc_start_status && ser_sub_flow_id == loc_sub_flow_id && role_id == ser_role_id) {
                            old_checksheet_list[m].reject_status = checksheet_list[k].reject_status;
                            old_checksheet_list[m].Checksheet_Icon = checksheet_list[k].Checksheet_Icon;
                            loc_chk_found++;
                            break;
                        }
                    }

                    if (loc_chk_found > 0) {
                        // server checksheet found in local checklist
                        new_checksheet_list.push(old_checksheet_list[m]);
                    } else {
                        // server checksheet not found in local checklist

                        var is_mandatory = checksheet_list[k].is_mandatory;
                        var is_disabled = checksheet_list[k].is_disabled;
                        var is_submited = checksheet_list[k].is_submited;
                        if (is_submited == 1 || is_mandatory == 0 || is_disabled == 1) {
                            is_submited = 1;
                        }
                        else {
                            is_submited = 0;
                        }

                        new_checksheet_list.push({
                            'role_id': checksheet_list[k].role_id,
                            'checksheetid': checksheet_list[k].checksheetid,
                            'start_status': checksheet_list[k].start_status,
                            'end_status': checksheet_list[k].end_status,
                            'is_flow': checksheet_list[k].is_flow,
                            'is_submited': is_submited,
                            'is_mandatory': is_mandatory,
                            'is_disabled': is_disabled,
                            'sub_flow_id': checksheet_list[k].sub_flow_id,
                            'reject_status': checksheet_list[k].reject_status,
                            'Checksheet_Icon': checksheet_list[k].Checksheet_Icon
                        });
                    }
                }
            }
        }

        storage.setItem('new_checklist', JSON.stringify(new_checksheet_list));
        var flow_Array = JSON.parse(storage.getItem('flow_Array'));
        flow_Array[flow_Array.length - 1].checklist = new_checksheet_list;

        // new change
        var data_count = flow_Array[flow_Array.length - 1].list_json;
        storage.setItem('list_json_Array', JSON.stringify(data_count));

        storage.setItem('flow_Array', JSON.stringify(flow_Array));
        append_child_flows_to_list(new_checksheet_list, start_status);
    } catch (e) {
        alert1(e + '_onsuccess_get_list_of_pm_subflow()');
        loading_hide();
    }
}

function onfail_get_list_of_pm_subflow(e) {
    alert1(e + '_onfail_get_list_of_pm_subflow()');
}

function append_child_flows_to_list(new_checksheet_list, start_status) {
    try {
        $("#tbl_chk_details").hide();
        $("#checksheet_list").empty();
        var is_delete_sub = localStorage.getItem('is_delete_sub');

        var myArray = JSON.parse(storage.getItem('t_subflow_list'));
        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var status_array = list_data[0].status;

        var gb_by_status = list_data[0].gb_by_status;
        if (gb_by_status == 'true') {
            var gb_check = 'true';
        } else {
            var gb_check = 'false';
        }

        var bgr_found = 0;
        var blue_index = 0;
        var blue_flow_index = 0;
        var checksheet_displaying = 0;

        // sort json array in asc order 11032021
        var sorted_myArray = myArray.sort(function (a, b) {
            var a_flow_data = JSON.parse(a.data);
            var a_position = parseInt(a_flow_data[0].position);
            var b_flow_data = JSON.parse(b.data);
            var b_position = parseInt(b_flow_data[0].position);

            var x = a_position < b_position ? -1 : 1;
            return x;
        });
        myArray = sorted_myArray;
        ///

        for (var m = 0; m < myArray.length; m++) {
            var m_flow_id = myArray[m].flow_id;
            var m_role_id = myArray[m].rollid;
            for (var n = 0; n < new_checksheet_list.length; n++) {
                var n_flow_id = new_checksheet_list[n].sub_flow_id;
                var n_start_status = new_checksheet_list[n].start_status;
                var n_role_id = new_checksheet_list[n].role_id;
                if (n_flow_id == m_flow_id) {
                    //subflow
                    myArray[m].Checksheet_Icon = new_checksheet_list[n].Checksheet_Icon;
                    break;
                }

                if (start_status == n_start_status && m_role_id == n_role_id && n_flow_id == 0) {
                    //group
                    myArray[m].Checksheet_Icon = new_checksheet_list[n].Checksheet_Icon;
                    break;
                }
            }
        }

        for (var i = 0; i < myArray.length; i++) {
            var flow_id = myArray[i].flow_id;

            var flow_found = 0;
            for (j = 0; j < new_checksheet_list.length; j++) {
                var module_id = new_checksheet_list[j].sub_flow_id;
                var c_start_status = new_checksheet_list[j].start_status;
                var is_online = new_checksheet_list[j].is_online;
                if (is_online == '' || is_online == null || is_online == undefined) {
                    is_online = 0;
                }

                if (flow_id == module_id) {
                    var is_submited = new_checksheet_list[j].is_submited;
                    var reject_status = new_checksheet_list[j].reject_status;
                    var c_end_status = new_checksheet_list[j].end_status;

                    // new patch vodafone - multiple sub flows and dipsplaying 1 subflow only cr.admin (19062020)
                    var status_checksheet_only = list_data[0].status_checksheet_only;
                    if (status_checksheet_only == 'true') {
                        if (c_start_status == start_status) {
                            // checksheet status match with current status

                            var st_found = 0;
                            for (g = 0; g < status_array.length; g++) {
                                if (c_start_status == status_array[g]) {
                                    // checksheet belongs to flow status array
                                    st_found++;
                                    break;
                                }
                            }
                            if (st_found > 0) {
                                blue_flow_index = j;
                                flow_found++;
                                break;
                            }
                        }
                    }
                    else {
                        var st_found = 0;
                        for (g = 0; g < status_array.length; g++) {
                            if (c_start_status == status_array[g]) {
                                // checksheet belongs to flow status array
                                st_found++;
                                break;
                            }
                        }
                        if (st_found > 0) {
                            flow_found++;
                            blue_flow_index = j;
                            break;
                        }
                    }
                }
            }

            var group_found = 0;
            if (flow_found == 0) {
                for (j = 0; j < new_checksheet_list.length; j++) {
                    var c_start_status = new_checksheet_list[j].start_status;
                    if (start_status == c_start_status) {
                        var c_end_status = new_checksheet_list[j].end_status;
                        var is_submited = new_checksheet_list[j].is_submited;
                        group_found++;
                        break;
                    }
                }
            }

            var st_found = 0;
            var status_checksheet_only = list_data[0].status_checksheet_only;
            if (status_checksheet_only == 'true') {
                if (c_start_status == start_status) {
                    // checksheet status match with current status

                    for (g = 0; g < status_array.length; g++) {
                        if (c_start_status == status_array[g]) {
                            // checksheet belongs to flow status array
                            st_found = 1;
                            break;
                        }
                    }
                }
            }
            else {
                for (g = 0; g < status_array.length; g++) {
                    if (c_start_status == status_array[g]) {
                        // checksheet belongs to flow status array
                        st_found = 1;
                        break;
                    }
                }
            }

            // new code for setting up pv1 flow
            if (group_found == 1) {
                var blank_found = 0;
                for (k = 0; k < new_checksheet_list.length; k++) {
                    var c_start_status = new_checksheet_list[k].start_status;
                    var is_submited = new_checksheet_list[k].is_submited;
                    if (is_submited == '' || is_submited == null || is_submited == undefined) {
                        is_submited = 0;
                    }
                    var checksheetid = new_checksheet_list[k].checksheetid;
                    if (start_status == c_start_status && is_submited == 0 && checksheetid != '') {
                        blank_found++;
                        break;
                    }
                }
                if (blank_found > 0) {
                    is_submited = 0;
                } else {
                    is_submited = 1;
                }
            }
            // /////////

            // sitewise module listing changes
            var multiflow_list = list_data[0].multiflow_list;
            if (multiflow_list == '' || multiflow_list == null || multiflow_list == undefined) { }
            else {
                // dont show other childs of parent (only show selected flow's subflow)
                if (flow_found == 0) {
                    st_found = 0;
                }
            }
            ////////

            if (st_found == 1 && (group_found == 1 || flow_found == 1)) {
                // alert1("checksheet start status found in array");

                var id_count = myArray[i].id;
                var data_string = JSON.stringify(myArray[i].data);
                var counter_1 = JSON.parse(myArray[i].data);

                if (myArray[0].type == 'Flow') {
                    var flow_name = myArray[i].flow_name1;
                }
                else {
                    var flow_name = myArray[i].flow_name1;
                }

                if (is_submited == 1 || is_submited == 2 && gb_check == 'false') {
                    // green (for atc rejection)
                    var back_color = "green";
                    var param = "\"redirect_on_subflow_click('" + flow_name + "' , " + myArray[i].id + "," + myArray[i].flow_id + ",'" + myArray[i].type
                        + "', '" + c_start_status + "', '" + c_end_status + "', '" + reject_status + "','true', '" + myArray[i].rollid + "', '" + back_color + "', '" + is_online + "')\"";
                } else if (is_submited == 1 || is_submited == 2 || (start_status > c_start_status && gb_check == 'true')) {
                    // green (for atc rejection)
                    var back_color = "green";
                    var param = "\"redirect_on_subflow_click('" + flow_name + "' , " + myArray[i].id + "," + myArray[i].flow_id + ",'" + myArray[i].type
                        + "', '" + c_start_status + "', '" + c_end_status + "', '" + reject_status + "','true', '" + myArray[i].rollid + "', '" + back_color + "', '" + is_online + "')\"";
                }
                else {
                    // blue/gray
                    var back_color = "dodgerblue";
                    var param = "\"redirect_on_subflow_click('" + flow_name + "' , " + myArray[i].id + "," + myArray[i].flow_id + ",'" + myArray[i].type
                        + "', '" + c_start_status + "', '" + c_end_status + "', '" + reject_status + "','false', '" + myArray[i].rollid + "', '" + back_color + "', '" + is_online + "')\"";
                    bgr_found++;
                    blue_index = i;
                }

                if (back_color == "green") {
                    back_color = "#4caf50";
                }

                if (back_color == "dodgerblue") {
                    back_color = "#2196f3";
                }

                var Checksheet_Icon = myArray[i].Checksheet_Icon;
                if (group_found == 1) {
                    //var list_ico = '<i class="fa fa-object-ungroup"></i>';
                    if (Checksheet_Icon == "" || Checksheet_Icon == null || Checksheet_Icon == undefined) {
                        Checksheet_Icon = "object-ungroup";
                    }
                }
                else {
                    //var list_ico = 'class="fa fa-sitemap" style="font-size:20px"';
                    if (Checksheet_Icon == "" || Checksheet_Icon == null || Checksheet_Icon == undefined) {
                        Checksheet_Icon = "sitemap";
                    }
                }

                if (Checksheet_Icon.indexOf('data:image') > -1) {
                    var list_ico = '<img src="' + Checksheet_Icon + '" style="width:42px; height:42px; margin-right:8px">';
                }
                else {
                    var font_size = "30px;"
                    if (Checksheet_Icon == "object-ungroup") {
                        var font_size = "22px;"
                    }
                    var list_ico = '<i class="fa fa-' + Checksheet_Icon + '" style="font-size:' + font_size + ';margin-right:8px"></i>';
                }

                // check for deleted media files in sub task in sub flow
                var main_back_color = '';
                //var is_delete_sub = '[{ "module_id": "552", "module_name": "ELECTRICAL" }]';
                if (is_delete_sub == "[]" || is_delete_sub == "null" || is_delete_sub == "Unknown" || is_delete_sub == null || is_delete_sub == undefined || is_delete_sub == "") { }
                else {
                    var media_data = JSON.parse(is_delete_sub);
                    if (media_data.length > 0) {
                        for (dm = 0; dm < media_data.length; dm++) {
                            var del_module_id = media_data[dm].module_id;
                            if (myArray[i].flow_id == del_module_id) {
                                main_back_color = 'background-color: #ffcccc';
                                break;
                            }
                        }
                    }
                }

                var icon_base64 = counter_1[0].icon_base64;
                if (icon_base64 == '' || icon_base64 == null || icon_base64 == undefined) {
                    var list_item = '<li onclick =' + param + ' style="border-right: 8px solid ' + back_color + '; ' + main_back_color + '"><a href="#" class="item-content button"><div class="item-media">' + list_ico + '</div><div class="item-inner item-no-pad" style="padding-right:5px"><div class="item-title">' + myArray[i].flow_name + '</div>';
                }
                else {
                    var list_item = '<li onclick =' + param + ' style="border-right: 8px solid ' + back_color + '; ' + main_back_color + '"><a href="#" class="item-content button"><div class="item-media"><img src="' + icon_base64 + '" style="width:30px; height:30px; margin-top:-5px; margin-right:8px"></div><div class="item-inner item-no-pad" style="padding-right:5px"><div class="item-title">' + myArray[i].flow_name + '</div>';
                }
                list_item += '</div></a>';

                list_item += '<input type="hidden" id="hdn_' + myArray[i].id + '" value=\'' + myArray[i].data + '\'>';
                list_item += '</li>';
                $("#checksheet_list").append(list_item);
                checksheet_displaying++;
            }
        }

        var li_length = $("#checksheet_list li").length;
        if (li_length > 5) {
            $("#txtsearch").show();
        } else {
            $("#txtsearch").hide();
        }

        //localStorage.setItem('last_subflow_count', checksheet_displaying);
        set_common_localStorage('last_subflow_count', checksheet_displaying);

        var redirect_on_checksheet = get_common_localStorage('redirect_on_checksheet');
        var curr_btn_mode = JSON.parse(storage.getItem('curr_btn_mode'));
        if (curr_btn_mode != 'back' && redirect_on_checksheet == "true" && checksheet_displaying > 1) {
            set_common_localStorage('redirect_on_checksheet', 'false');
            changeurl("viewsitelist_pm_grouplist.html");
        }
        else {

            storage.setItem('all_green', JSON.stringify('false'));
            if (bgr_found == 0) {
                var data_json = JSON.parse(storage.getItem('list_json'));
                var list_data = JSON.parse(data_json);
                var completed_editable = list_data[0].completed_editable;
                var curr_btn_mode = JSON.parse(storage.getItem('curr_btn_mode'));
                if (curr_btn_mode == 'updatetasknsubmit') {
                    completed_editable = 'false';
                } else {
                    if (gb_by_status == 'true') {
                        storage.setItem('all_green', JSON.stringify('true'));
                    }
                }
                if (completed_editable == "" || completed_editable == null || completed_editable == undefined || completed_editable == "false") {
                    changeurl("selection_survey.html");
                }
                //else if (checksheet_displaying > 1 && (redirect_on_checksheet == "true" || curr_btn_mode == 'back')) {
                else if (checksheet_displaying > 1 && redirect_on_checksheet == "true") {
                    // task listing page
                    set_common_localStorage('redirect_on_checksheet', 'false');
                    storage.setItem('curr_btn_mode', JSON.stringify(""));           //don't backward skip for single green checksheet
                    changeurl("viewsitelist_pm_grouplist.html");
                }
                else if (curr_btn_mode != 'back' && checksheet_displaying == 1) {
                    //to skip single subflow checksheet(user: haresh.tse/oneatctesting)
                    storage.setItem('curr_btn_mode', JSON.stringify('subflow'));
                    $("#checksheet_list").append('<li><input type="hidden" id="hdn_' + myArray[blue_index].id + '" value=\'' + myArray[blue_index].data + '\'></li>');

                    if (myArray[blue_index].type == 'Flow') {
                        var flow_name = myArray[blue_index].flow_name1;
                    }
                    else {
                        var flow_name = myArray[blue_index].flow_name1;
                    }

                    var is_online_blue_index = new_checksheet_list[blue_flow_index].is_online;
                    if (is_online_blue_index == '' || is_online_blue_index == null || is_online_blue_index == undefined) {
                        is_online_blue_index = 0;
                    }

                    redirect_on_subflow_click(flow_name, myArray[blue_index].id, myArray[blue_index].flow_id, myArray[blue_index].type, new_checksheet_list[blue_flow_index].start_status, new_checksheet_list[blue_flow_index].end_status, new_checksheet_list[blue_flow_index].reject_status, 'true', myArray[blue_index].rollid, back_color, is_online_blue_index);
                }
                //else if (curr_btn_mode == 'back' && checksheet_displaying == 1) {
                //    // backward skip for single subflow checksheet
                //    storage.setItem('curr_btn_mode', JSON.stringify(""));
                //    back_button('viewsitelist_pm_grouplist');
                //}
            }
            else if (curr_btn_mode != 'back' && checksheet_displaying == 1) {
                //to skip single subflow checksheet(user: haresh.tse/oneatctesting)
                storage.setItem('curr_btn_mode', JSON.stringify('subflow'));
                $("#checksheet_list").append('<li><input type="hidden" id="hdn_' + myArray[blue_index].id + '" value=\'' + myArray[blue_index].data + '\'></li>');

                //< !--to skip single sub flow after new task creation(user: demoujc.sales)-- >
                $("#module_list").append('<li><input type="hidden" id="hdn_' + myArray[blue_index].id + '" value=\'' + encodeURIComponent(myArray[blue_index].data) + '\'></li>');

                if (myArray[blue_index].type == 'Flow') {
                    var flow_name = myArray[blue_index].flow_name1;
                }
                else {
                    var flow_name = myArray[blue_index].flow_name1;
                }

                var is_online_blue_index = new_checksheet_list[blue_flow_index].is_online;
                if (is_online_blue_index == '' || is_online_blue_index == null || is_online_blue_index == undefined) {
                    is_online_blue_index = 0;
                }

                redirect_on_subflow_click(flow_name, myArray[blue_index].id, myArray[blue_index].flow_id, myArray[blue_index].type, new_checksheet_list[blue_flow_index].start_status, new_checksheet_list[blue_flow_index].end_status, new_checksheet_list[blue_flow_index].reject_status, 'true', myArray[blue_index].rollid, back_color, is_online_blue_index);
            }
            //else if (curr_btn_mode == 'back' && checksheet_displaying == 1) {
            //    // backward skip for single subflow checksheet
            //    storage.setItem('curr_btn_mode', JSON.stringify(""));
            //    back_button('viewsitelist_pm_grouplist');
            //}
            //else if (curr_btn_mode == 'back' && checksheet_displaying > 1) {
            //    // don't backward skip for multiple subflow 
            //    set_common_localStorage('redirect_on_checksheet', 'false');
            //    storage.setItem('curr_btn_mode', JSON.stringify(""));
            //    changeurl("viewsitelist_pm_grouplist.html");
            //}
        }

        loading_hide();
        enable_back_button();

        //else if (curr_btn_mode != 'back' && myArray.length == 1) {
        //    redirect_on_subflow_click(myArray[0].flow_name, myArray[0].id, myArray[0].flow_id, myArray[0].type, new_checksheet_list[blue_index].start_status, new_checksheet_list[blue_index].end_status, new_checksheet_list[blue_index].reject_status, 'true');
        //}
    } catch (e) {
        alert1(e + '_append_child_flows_to_list()');
    }
}

function redirect_on_subflow_click(flow_name1, id, flow_id, type, selected_start_status, selected_end_status, reject_status, loc_task_update, role_id, back_color, is_online) {
    try {
        if (button_clicked_subflow != 1) {
            var user_choice = true;
            if (back_color == "green") {
                if (F7_device == 'ios') {
                    user_choice = true;
                }
                else {
                    vibrate_device();
                    user_choice = confirm("Are you sure you want to modify this sub flow?");
                }
            }

            if (user_choice == true) {
                invalidate_checksheet_open();
                button_clicked_subflow = 1;
                setTimeout(function () {
                    button_clicked_subflow = 0;
                }, 2000);

                storage.setItem('c_start_status', JSON.stringify(selected_start_status));
                storage.setItem('sub_flow_end_status', JSON.stringify(selected_end_status));
                storage.setItem('loc_task_update', JSON.stringify(loc_task_update));
                storage.setItem('c_is_online', JSON.stringify(is_online));


                storage.setItem('sub_flow_reject_status', JSON.stringify(reject_status));
                // redirect_on_module_click(flow_name1, id, flow_id, type);

                if (type == 'Flow' || type == 'MultiFlow') {
                    localStorage.setItem('is_subflow', 'true');
                    refresh_global_variables_subflow(flow_name1, id, flow_id, type, selected_start_status, role_id);
                } else {
                    localStorage.setItem('is_subflow', 'false');
                    redirect_on_module_click(flow_name1, id, flow_id, type, role_id);
                }
            }
        }
    } catch (e) {
        alert1(e + '_redirect_on_subflow_click()');
    }
}

function refresh_global_variables_subflow(flow_name1, id, flow_id, type, selected_start_status, role_id) {
    try {
        storage.setItem('redirect_flow_name1', JSON.stringify(flow_name1));
        storage.setItem('redirect_id', JSON.stringify(id));
        storage.setItem('redirect_flow_id', JSON.stringify(flow_id));
        storage.setItem('redirect_type', JSON.stringify(type));
        storage.setItem('redirect_role_id', JSON.stringify(role_id));

        var flow_Array = JSON.parse(storage.getItem('flow_Array'));
        var new_checksheet_list = flow_Array[flow_Array.length - 1].checklist;
        var c_start_status = flow_Array[flow_Array.length - 1].start_status;
        for (i = 0; i < new_checksheet_list.length; i++) {
            var s_flow_id = new_checksheet_list[i].sub_flow_id;
            var start_status = new_checksheet_list[i].start_status;
            if (s_flow_id == flow_id && selected_start_status == c_start_status) {
                new_checksheet_list[i].is_submited = 0;
            }
        }
        storage.setItem('new_checklist', JSON.stringify(new_checksheet_list));

        flow_Array[flow_Array.length - 1].checklist = new_checksheet_list;

        // new change
        var data_count = flow_Array[flow_Array.length - 1].list_json;
        storage.setItem('list_json_Array', JSON.stringify(data_count));

        storage.setItem('flow_Array', JSON.stringify(flow_Array));

        var t_id = JSON.parse(storage.getItem('tid'));
        var task_id = JSON.parse(storage.getItem('task_id'));
        var server_task_id = JSON.parse(storage.getItem('server_task_id'));
        var checksheet_dependency = JSON.parse(storage.getItem('checksheet_dependency'));
        if (checksheet_dependency == null || checksheet_dependency == undefined || checksheet_dependency == "") {
            var checksheet_dependency = [];
        }

        if (step_Array == undefined || step_Array == "" || step_Array == null) {
            var step_Array = [];
        }

        var new_checksheet_list = JSON.parse(storage.getItem('new_checklist'));
        if (new_checksheet_list == null || new_checksheet_list == undefined || new_checksheet_list == "") {
            var new_checksheet_list = [];
        }

        var global_var_Array = [];
        global_var_Array.push({
            'checksheet_dependency': checksheet_dependency,
            'new_checklist': new_checksheet_list,
            'step_Array_to_read': step_Array,
            't_id': t_id,
            'task_id': task_id,
            'server_task_id': server_task_id
        });

        var global_var_obj = JSON.stringify(global_var_Array);
        var query = "UPDATE task_master SET global_var = '" + global_var_obj + "', step='0' where tid = '" + t_id + "'";
        // alert1(query);
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            q: "0",
            tid: "0"
        });

        cordova.exec(guard_checksheet_open(function () {
            onsuccess_refresh_global_variables_subflow(flow_name1, id, flow_id, type, role_id);
        }), guard_checksheet_open(onfail_refresh_global_variables_subflow), 'SqlitePlugin', 'insertValuse', q_jsonobj);
    } catch (e) {
        alert1(e + '_refresh_global_variables_subflow()');
        loading_hide();
    }
}

function onsuccess_refresh_global_variables_subflow(flow_name1, id, flow_id, type, role_id) {
    redirect_on_module_click(flow_name1, id, flow_id, type, role_id);
}

function onfail_refresh_global_variables_subflow(e) {
    alert1(e + '_onfail_refresh_global_variables_subflow()');
}

// check and update subtask status if all subtasks are completed on subflow
// "Submit" button (center)
function check_subtask_and_submit_sub_flow() {
    try {
        localStorage.setItem('is_shortcutbutton', 'false');
        var flow_Array = JSON.parse(storage.getItem('flow_Array'));
        var new_checksheet_list = flow_Array[flow_Array.length - 2].checklist;
        $("#btn_Submit").attr('disabled', 'disabled');
        var all_count = $("#site_list > li").length;
        var completed_count = $("#site_list > li[value='2']").length;
        var diff_count = all_count - completed_count;
        var f_li_text = $('#site_list > li:first').text();

        //rejected task count
        var rejected_task_count = $('span[id^=rejected_icon]').children().length;
        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var task_value = list_data[0].task;
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

            var sub_task_pending_msg = list_data[0].sub_task_pending_msg;
            if (sub_task_pending_msg == '' || sub_task_pending_msg == null || sub_task_pending_msg == undefined) {
                if (sub_task_min_limit == 1) {
                    alert1("Minimum 1 sub task is required, please add sub task !");
                } else {
                    alert1("Minimum " + sub_task_min_limit + " sub tasks are required, please add sub tasks !");
                }
            }
            else {
                // add dynamic subtask pending messge DV-09082024
                alert(sub_task_pending_msg);
            }

            setTimeout(function () {
                $("#btn_Submit").removeAttr('disabled');
            }, 1000);

        } else {
            if (diff_count == 0 || (diff_count == 1 && f_li_text == 'No Record Found !')) {
                // all sub tasks are completed

                if (F7_device == 'ios') {
                    var user_choice = true;
                }
                else {
                    vibrate_device();
                    //var user_choice = confirm("Are you sure you want to submit this flow?");
                    var user_choice = true;
                }
                if (user_choice == true) {

                    // check for subflow object available in global var or not
                    var subflow_obj_found = 0;
                    var curr_module_id = JSON.parse(storage.getItem('wayflow'));

                    if (flow_Array.length > 2) {
                        //for 3rd layer subtask center submit btn [FT-15052025]
                        var f_index = flow_Array.length - 2
                    }
                    else {
                        var f_index = 0;
                    }

                    var new_checksheet_list = flow_Array[f_index].checklist;
                    var c_start_status = flow_Array[f_index].start_status;

                    for (i = 0; i < new_checksheet_list.length; i++) {
                        var flow_id = new_checksheet_list[i].sub_flow_id;
                        var start_status = new_checksheet_list[i].start_status;
                        if (flow_id == curr_module_id && start_status == c_start_status) {
                            subflow_obj_found++;
                            break;
                        }
                    }

                    if (subflow_obj_found == 0) {
                        alert1("Sub Flow is not found in global variable, Please submit again !");
                        setTimeout(function () {
                            $("#btn_Submit").removeAttr('disabled');
                        }, 1000);
                    }
                    else {
                        storage.setItem('curr_btn_mode', JSON.stringify('updatetasknsubmit'));
                        storage.setItem('all_green', JSON.stringify('false'));
                        //alert1("All sub tasks are completed !");

                        var sub_flow_end_status = JSON.parse(storage.getItem('sub_flow_end_status'));
                        storage.setItem('end_status', JSON.stringify(sub_flow_end_status));
                        var curr_module_id = JSON.parse(storage.getItem('wayflow'));

                        //var new_checksheet_list = flow_Array[0].checklist;
                        //var c_start_status = flow_Array[0].start_status;

                        var role_id = JSON.parse(storage.getItem('role_id'));

                        for (i = 0; i < new_checksheet_list.length; i++) {
                            var flow_id = new_checksheet_list[i].sub_flow_id;
                            var start_status = new_checksheet_list[i].start_status;
                            var c_role_id = new_checksheet_list[i].role_id;
                            if (c_role_id == '' || c_role_id == null || c_role_id == undefined) {
                                c_role_id = role_id;
                            }

                            if (flow_id == curr_module_id && rejected_task_count > 0 && role_id == c_role_id) {
                                //check if task is rejected
                                new_checksheet_list[i].is_submited = 2;
                                //break;
                            }
                            else if (flow_id == curr_module_id && start_status == c_start_status && role_id == c_role_id) {
                                new_checksheet_list[i].is_submited = 1;
                                break;
                            }
                        }


                        storage.setItem('new_checklist', JSON.stringify(new_checksheet_list));
                        flow_Array[f_index].checklist = new_checksheet_list;

                        //==========================

                        // new change
                        var data_count = flow_Array[flow_Array.length - 1].list_json;
                        storage.setItem('list_json_Array', JSON.stringify(data_count));
                        storage.setItem('flow_Array', JSON.stringify(flow_Array));

                        // ///-------new logic start--------////////
                        flow_Array.pop();
                        var id = flow_Array[f_index].id;
                        var flow_id = flow_Array[f_index].wayflow;
                        var flow_name = flow_Array[f_index].wayflow_name;
                        var list_json = flow_Array[f_index].list_json;
                        var new_checksheet_list = flow_Array[f_index].checklist;
                        var c_start_status = flow_Array[f_index].start_status;

                        storage.setItem('new_checklist', JSON.stringify(new_checksheet_list));
                        storage.setItem('udf_id', JSON.stringify(id));
                        storage.setItem('wayflow', JSON.stringify(flow_id));
                        storage.setItem('wayflow_name', JSON.stringify(flow_name));

                        // reset task checksheet on sub flow back
                        var task_checksheetid = flow_Array[f_index].task_checksheetid;
                        storage.setItem('check_type_task', JSON.stringify(task_checksheetid));

                        // multitab handling
                        var tab_index = flow_Array[f_index].tab_index;
                        storage.setItem('tab_index', JSON.stringify(tab_index));
                        list_json = JSON.parse(list_json);
                        var f_list_data = JSON.stringify(list_json[tab_index]);
                        storage.setItem('list_json', JSON.stringify("[" + f_list_data + "]"));

                        // new change
                        var data_count = flow_Array[f_index].list_json;
                        storage.setItem('list_json_Array', JSON.stringify(data_count));

                        storage.setItem('flow_Array', JSON.stringify(flow_Array));
                        storage.setItem('start_status', JSON.stringify(c_start_status));
                        storage.setItem('c_start_status', JSON.stringify(c_start_status));
                        localStorage.setItem('is_subflow', 'false');

                        var selected_tid = flow_Array[f_index].tid;                           //changes for ATC group task [14072021]
                        var selected_site = flow_Array[f_index].siteid;
                        var server_task_id = flow_Array[f_index].server_task_id;
                        storage.setItem('tid', JSON.stringify(selected_tid));
                        storage.setItem('siteid', JSON.stringify(selected_site));

                        if (server_task_id == "" || server_task_id == null || server_task_id == undefined) {
                            console.log("servertask id is not found for storage in flow_Array on center submit press");
                        }
                        else {
                            storage.setItem('server_task_id', JSON.stringify(server_task_id));
                        }

                        // /////---new logic end---////

                        // var loc_task_update = false;
                        // storage.setItem('loc_task_update', JSON
                        // .stringify(loc_task_update));

                        var new_checksheet_list = JSON.parse(storage.getItem('new_checklist'));
                        if (new_checksheet_list == null || new_checksheet_list == undefined || new_checksheet_list == "") {
                            alert1("Something goes wrong. Please submit again!");
                            changeurl("selection.html");
                        } else {
                            var c_is_online = JSON.parse(storage.getItem('c_is_online'));
                            if (c_is_online == 1) {
                                // update global var on server on every checksheet submit 11032024
                                save_global_variables_PV_online_new();
                            }
                            else {
                                save_global_variables_PV();
                            }
                        }
                    }
                }
                else {
                    $("#btn_Submit").removeAttr('disabled');
                }
            } else {
                // sub tasks are pending
                if (diff_count == 1) {
                    alert1("1 sub task is still pending, please complete all sub tasks !");
                } else {
                    alert1("" + diff_count + " sub tasks are still pending, please complete all sub tasks !");
                }

                setTimeout(function () {
                    $("#btn_Submit").removeAttr('disabled');
                }, 1000);
            }
        }
    } catch (e) {
        alert1(e + '_check_and_submit_sub_flow()');
    }
}
