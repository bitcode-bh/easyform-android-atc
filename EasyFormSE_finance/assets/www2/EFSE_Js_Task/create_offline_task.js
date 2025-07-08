var task_history_array = [];
var new_task_user;

function insert_online_n_offline_task(t_status) {
    try {
        loading();
        var company_id = JSON.parse(storage.getItem('company_id'));
        var user_id = JSON.parse(storage.getItem('user_id'));
        var user_name = JSON.parse(storage.getItem('user_name'));
        var checksheet_id = JSON.parse(storage.getItem('check_type_task'));
        var Json_data = ap_json[0].data;

        var flow_Array = JSON.parse(storage.getItem('flow_Array'));
        if (flow_Array.length == 1) {
            var p_server_task_id = 0;
        } else {
            var p_server_task_id = JSON.parse(storage.getItem('p_server_task_id'));
        }

        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var direct_task = list_data[0].direct_task;
        if (direct_task == "true") {
            if (curr_btn_mode == "button_create_task") {
                // overwrite status taken from dynamic create task button
                var status = curr_survey_data["createtask"];
            }
            else {
                var status = list_data[0].direct_task_status;
            }
            if (status == '' || status == null || status == undefined) {
                status = 0;
            }
        }
        else {
            //var status = 0;
            var status = t_status;                        //t_status taken from task creation checksheet btn with action 'create' task in webapp
        }

        var flow_Array = JSON.parse(storage.getItem('flow_Array'));
        if (flow_Array.length == 1) {
            if (form_flag == 14) {
                // create vendor invoice main task create from purchase order udf
                var t_main_column_array = $("#div_aggr_data_" + curr_type37_new_id + "").attr("main-data");
                if (t_main_column_array == "" || t_main_column_array == null || t_main_column_array == undefined || t_main_column_array == "[]") {
                    // po sub task creation
                    var RequestFor = "Sub";
                    var p_server_task_id = JSON.parse(storage.getItem('p_server_task_id'));
                    var p_match_temp_id = localStorage.getItem('p_match_temp_id');
                }
                else {
                    // main task creation
                    var RequestFor = "Single";
                    var p_server_task_id = 0;
                    var p_match_temp_id = 0;
                }
            }
            else {
                var RequestFor = "Single";
                var p_server_task_id = 0;
                var p_match_temp_id = 0;
            }
        }
        else {
            //for sub task
            var RequestFor = "Sub";
            var p_server_task_id = JSON.parse(storage.getItem('p_server_task_id'));
            var p_match_temp_id = localStorage.getItem('p_match_temp_id');
        }

        // send current tid and app id 06072020
        //var t_id = localStorage.getItem('tid');
        if (form_flag == 14) {
            var t_id = "";
            var appid = "";
        }
        else {
            var t_id = JSON.parse(storage.getItem('tid'));
            var appid = localStorage.getItem('appid');
        }

        var sub_udf_id = JSON.parse(storage.getItem('sub_udf_id'));
        if (sub_udf_id == "" || sub_udf_id == null || sub_udf_id == undefined) { }
        else {
            //for sub task
            var RequestFor = "Sub";

            if (flow_Array.length == 1) {
                // 2 layer task structure (sales visit > create order from type37)
                var p_server_task_id = JSON.parse(storage.getItem('p_server_task_id'));
                var p_match_temp_id = localStorage.getItem('p_match_temp_id');
            }
            else {
                // 3 level task structure (Sales lead > sales visit > create order from type37)
                var p_server_task_id = JSON.parse(storage.getItem('server_task_id'));
                var p_match_temp_id = localStorage.getItem('match_temp_id');
            }
        }

        // remove duplicate photo ids
        if (Photo_Id_Array.length > 0) {
            Photo_Id_Array = Photo_Id_Array.reduce(function (item, e1) {
                var matches = item.filter(function (e2) { return e1.photo_id == e2.photo_id });
                if (matches.length == 0) {
                    item.push(e1);
                }
                return item;
            }, []);
        }
        var ms = (new Date).getTime();
        var MainData = [];
        MainData.push({
            'Company_id': company_id,
            'Subcategory': "",
            'Step_id': 1,
            'StepNo': 0,
            'checksheet_id': checksheet_id,
            'Status': status,
            'Data': Json_data,
            'button': [],
            'millisecond': 0,
            'createby': user_id,
            'UpdatedBy': user_id,
            'master': "",
            'sub': "[]",
            'type': "new",
            'photo_temp': Photo_Id_Array,
            "Parent_Task_ID": p_server_task_id,
            'p_match_temp_id': p_match_temp_id,
            'APPID': appid,
            'MPKEY': t_id
        });

        var SubData = [];
        SubData.push({
            'RequestFor': RequestFor,
            'WhereCondition': "1"
        });

        var param_obj = [];
        param_obj.push({
            'MainData': JSON.stringify(MainData),
            'SubData': JSON.stringify(SubData),
            'call_type': 'web'
        });
        //alert1("JSON data:" + JSON.stringify(param_obj));

        loading();
        var getdata = new Webservicecall_REST(global_wcf_url + 'InsertUpdateDelete_MainAndSub_Task', JSON.stringify(param_obj),
            onssuccess_insert_online_n_offline_task, onfail_insert_online_n_offline_task);
        getdata.callOtherDomain();
    } catch (e) {
        alert1(e + '_insert_online_main_sub_task()');
    }
}

function onssuccess_insert_online_n_offline_task(e) {
    try {
        var Suc_Message = e.responseText;
        Suc_Message = eval('(' + Suc_Message + ')');
        var message = Suc_Message[0].message;
        var status = Suc_Message[0].status;
        if (status == '1') {

            var locObj = new MkLocation();
            locObj._addWaypoint("task_create");

            if (form_flag == 14) {
                var t_main_column_array = $("#div_aggr_data_" + curr_type37_new_id + "").attr("main-data");
                if (t_main_column_array == "" || t_main_column_array == null || t_main_column_array == undefined || t_main_column_array == "[]") {
                    // po sub task has been created
                    sub_task_Array.shift();
                    if (sub_task_Array.length > 0) {
                        check_n_create_invoice_task();
                    }
                    else {

                        $(".outer-invoice-task").hide();

                        let sub_task_elem = $("button[id^='btn_type_37_add_invoice_']").length;
                        if (sub_task_elem > 0) {
                            $("button[id^='btn_type_37_add_invoice_']").remove();

                            if (last_submit_button_Array) {
                                // call for updatetasknsubmit button click
                                let go_to_chk_no = last_submit_button_Array[0].go_to_chk_no;
                                let t_status = last_submit_button_Array[0].t_status;
                                let t_dependency = last_submit_button_Array[0].t_dependency;
                                let btn_check_type = last_submit_button_Array[0].btn_check_type;
                                let t_jsonObj_old = last_submit_button_Array[0].jsonObj_old;
                                jsonObj_old = t_jsonObj_old;
                                updatetasknsubmit_on_click(go_to_chk_no, t_status, t_dependency, btn_check_type)
                            }
                        }
                        else {
                            //mk_notify("Invoice has been generated successfully", "success");
                            $("button[id^='btn_type_37_']").trigger("click");
                        }
                    }
                }
                else {
                    // main task has been created
                    let Server_task_id = Suc_Message[0].Server_task_id;
                    storage.setItem('p_server_task_id', JSON.stringify(Server_task_id));

                    var t_main_column_array = $("#div_aggr_data_" + curr_type37_new_id + "").attr("main-data");
                    if (t_main_column_array == "" || t_main_column_array == null || t_main_column_array == undefined || t_main_column_array == "[]") {
                    }
                    else {
                        t_main_column_array = JSON.parse(t_main_column_array);
                        let main_udf_id = t_main_column_array[0].main_udf_id;
                        $("#div_aggr_data_" + curr_type37_new_id + "").attr("main_udf_id", main_udf_id);
                        $("#div_aggr_data_" + curr_type37_new_id + "").attr("main_udf_data", JSON.stringify(t_main_column_array));
                    }

                    $("#div_aggr_data_" + curr_type37_new_id + "").attr("main-data", "");
                    check_n_create_invoice_task();
                }
            }
            else {

                var sub_udf_id = JSON.parse(storage.getItem('sub_udf_id'));
                if (sub_udf_id == "" || sub_udf_id == null || sub_udf_id == undefined) {
                    //normal task creation
                    //var Server_task_id = myArray[0].Server_task_id;
                    var Server_task_id = Suc_Message[0].Server_task_id;
                    storage.setItem('server_task_id', JSON.stringify(Server_task_id));
                    localStorage.setItem('ID_useType22', Server_task_id);

                    var flow_Array = JSON.parse(storage.getItem('flow_Array'));
                    if (flow_Array.length == 1) {
                        storage.setItem('p_server_task_id', JSON.stringify(Server_task_id));
                    }

                    var data_json = JSON.parse(storage.getItem('list_json'));
                    var list_data = JSON.parse(data_json);
                    var survey_mode = list_data[0].survey_mode;
                    if (survey_mode == "online") {
                        if (message == "Task has been created successfully.") { }
                        else {
                            alert1(message);
                        }
                    }

                    check_n_upload_clone_photo(Server_task_id);

                    var data_json = JSON.parse(storage.getItem('list_json'));
                    var list_data = JSON.parse(data_json);

                    var auto_trip = list_data[0].auto_trip;
                    if (auto_trip == 'true') {
                        localStorage.setItem('trip_ser_task_id', Server_task_id);

                        var trip_Array = localStorage.getItem("trip_Array");
                        if (trip_Array == "" || trip_Array == null || trip_Array == undefined) {
                            trip_Array = {};
                        }
                        else {
                            trip_Array = JSON.parse(trip_Array);
                        }

                        var t_trip_status = localStorage.getItem('trip_status')
                        trip_Array[Server_task_id] = t_trip_status;
                        localStorage.setItem("trip_Array", JSON.stringify(trip_Array));
                    }

                    var redirect = list_data[0].redirect;
                    if (redirect == 'customer') {
                        // task create through customer listing selection

                        storage.setItem('cust_flow_Array', JSON.stringify(''));

                        var back_flow = list_data[0].back_flow;
                        get_data_for_back_flow(back_flow);
                    }
                    else {
                        // normal task creation

                        if (concat_statement_found == 0) {
                            // no concate statement found in 
                            get_user_latlong_offline_task();
                        }
                        else {
                            get_task_log_from_server(Server_task_id);
                        }
                    }
                }
                else {
                    //task creation from sub task control(type37);
                    var data_json = JSON.parse(storage.getItem('list_json'));
                    var list_data = JSON.parse(data_json);
                    var survey_mode = list_data[0].survey_mode;
                    if (survey_mode == "online") {
                        if (message == "Task has been created successfully.") { }
                        else {
                            alert1(message);
                        }
                    }
                    storage.setItem('sub_udf_id', JSON.stringify(""));

                    var flow_Array = JSON.parse(storage.getItem('flow_Array'));
                    var wayflow = flow_Array[0].wayflow;
                    var wayflow_name = flow_Array[0].wayflow_name;
                    var task_checksheetid = flow_Array[0].task_checksheetid;

                    var list_json = flow_Array[0].list_json;
                    list_json = JSON.parse(list_json);
                    var f_list_data = JSON.stringify(list_json[0]);
                    storage.setItem('list_json', JSON.stringify("[" + f_list_data + "]"));

                    storage.setItem('wayflow', JSON.stringify(wayflow));
                    storage.setItem('wayflow_name', JSON.stringify(wayflow_name));
                    storage.setItem('check_type_task', JSON.stringify(task_checksheetid));
                    //changeurl("selection_survey.html");

                    get_user_latlong_offline_task();

                    //after sub task creation redirect to checksheet page and refresh subtask list [FT-07052025]
                    //setTimeout(function () {
                    //    myApp.closeModal('.popup-new-task-create');
                    //    $("#btn_type_37_refresh_" + curr_type37_new_id).trigger('click');
                    //}, 1000);
                }

            }
        }
        else {
            //var message = myArray[0].message;
            if (form_flag == 14) {
                $(".outer-invoice-task").hide();
            }

            if (message == "Task has been created successfully.") { }
            else {
                alert1(message);
            }
            loading_hide();
        }
    }
    catch (e) {
        alert1(e + '_onssuccess_insert_online_n_offline_task()');
        loading_hide();
    }
}

function onfail_insert_online_n_offline_task(e) {
    alert1(e);
    loading_hide();
}



get_task_log_from_server = (selected_server_task_id) => {

    loading();
    var param_obj = [];
    param_obj.push({
        'server_task_id': selected_server_task_id
    });

    var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_Get_Task_Data_For_Online', JSON.stringify(param_obj), function (e) {
        var myArray = JSON.parse(e.responseText);
        var status = myArray[0].status;
        if (status == 1) {
            var data_new = JSON.parse(myArray[0].data);
            if (data_new == "" || data_new == null || data_new == undefined) {
                var data = myArray[0].task_json[0].task_json;
                data = JSON.parse(data);
            }
            else {
                var data = data_new[0].task_json[0].task_json;
                data = JSON.parse(data);
            }

            ap_json[0].data = data;

            get_user_latlong_offline_task();
        }
        else {
            alert(myArray[0].message);
            loading_hide();

            get_user_latlong_offline_task();
        }
    }, onfail);
    getdata.callOtherDomain();
}



// Get user latlong
function get_user_latlong_offline_task() {
    cordova.exec(onsuccess_get_user_latlong_offline_task, onfail_get_user_latlong_offline_task, 'maulik', 'nck', ["ds"]);
}

// successful getting user latlong
function onsuccess_get_user_latlong_offline_task(e) {
    try {
        var myArray = JSON.parse(e);
        task_user_lat = parseFloat(myArray[0].lat);
        task_user_long = parseFloat(myArray[0].lon);
        get_data_for_task();
    } catch (e) {
        // alert1('Problem while getting GPS lat long, Please change your position !');
        task_user_lat = 0;
        task_user_long = 0;
        get_data_for_task();
    }
}

// get data(checklist) from for task from flow_master
function get_data_for_task() {
    try {
        var moduleid = JSON.parse(storage.getItem('wayflow'));
        if (moduleid == 0 || moduleid == '' || moduleid == null || moduleid == undefined) {
            alert1("No task checksheet is mapped to this flow!");
        } else {
            var query = "select data from flow_master where moduleid = '" + moduleid + "'";
            var q_jsonobj = [];
            q_jsonobj.push({
                data: query,
                p: "1"
            });
            cordova.exec(onsuccess_get_data_for_task, onfail_get_data_for_task, 'SqlitePlugin', 'showValues', q_jsonobj);
        }
    } catch (e) {
        alert1(e + "_get_data_for_task()");
        loading_hide();
    }
}

// successful get data for task
function onsuccess_get_data_for_task(e) {
    try {
        var myArray = JSON.parse(e);
        if (myArray == '' || myArray == null || myArray == undefined || myArray.length == 0) {
            onsuccess_get_data_for_task_online();
        }
        else {
            var task_checklist_data = myArray[0].data;
            insert_offline_task(task_checklist_data);
        }
    } catch (e) {
        alert1(e + "_onsuccess_get_data_for_task()");
        loading_hide();
    }
}


function onsuccess_get_data_for_task_online() {
    try {

        loading();
        var moduleid = JSON.parse(storage.getItem('wayflow'));
        var company_id = JSON.parse(storage.getItem('company_id'));
        var user_id = JSON.parse(storage.getItem('user_id'));
        var role_id = JSON.parse(storage.getItem('role_id'));
        var selected_site = JSON.parse(storage.getItem('siteid'));
        var selected_server_task_id = JSON.parse(storage.getItem('server_task_id'));

        if (selected_site == "" || selected_site == null || selected_site == undefined) {
            selected_site = "0";
        }

        var param_obj = [];
        param_obj.push({
            'Company_Id': company_id,
            'User_Id': user_id,
            'moduleid': moduleid,
            'siteid': selected_site,
            'server_task_id': selected_server_task_id,
            'role_id': role_id
        });

        var getdata = new Webservicecall_REST(common_global_wcf_url + 'WCF_GetCustomerWithGlobalVar_With_Role_Port', JSON.stringify(param_obj), function (e) {
            var responseText = JSON.parse(e.responseText);
            var status = responseText[0].status;
            if (status == 1) {
                loading_hide();
                var myArray = JSON.parse(responseText[0].data);
                var task_checklist_data = myArray[0].data;
                insert_offline_task(task_checklist_data);
            }
            else {
                loading_hide();
                //alert1(responseText[0].message);
            }

        }, onfail);
        getdata.callOtherDomain();

    } catch (e) {
        alert1(e + '_onsuccess_get_data_for_task_online()');
        loading_hide();
    }
}


// insert offline task entry
var last_query;
function insert_offline_task(task_checklist_data) {
    try {
        loading();
        // formatting date to mm/dd/yyyy
        var date = new Date();
        var month = (1 + date.getMonth()).toString();
        month = month.length > 1 ? month : '0' + month;
        var day = date.getDate().toString();
        day = day.length > 1 ? day : '0' + day;
        var year = date.getFullYear();
        var survey_date = month + '/' + day + '/' + year;

        var millisecond = date.getTime();
        var task_id = imeino + "_" + millisecond;
        var user_id = JSON.parse(storage.getItem('user_id'));
        var user_name = JSON.parse(storage.getItem('username'));
        var lat = task_user_lat;
        var long = task_user_long;
        var data = task_checklist_data;
        var checksheetid = storage.getItem('check_type_task');
        var udf_id = JSON.parse(storage.getItem('udf_id'));
        var moduleid = JSON.parse(storage.getItem('wayflow'));
        var module_name = JSON.parse(storage.getItem('wayflow_name'));
        //var moduledef = JSON.stringify(ap_json[0].data);

        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var server_task_id = 0;
        var p_server_task_id = null;

        var survey_mode = list_data[0].survey_mode;
        if (survey_mode == 'online') {
            server_task_id = JSON.parse(storage.getItem('server_task_id'));
        }

        var flow_Array = JSON.parse(storage.getItem('flow_Array'));
        if (flow_Array.length == 1) {
            var p_udf_id = "0";

            // set parent tid when sub task listed in main task listing and auto open task form is true (lead project)
            var auto_open_task_form = list_data[0].auto_open_task_form;
            if (auto_open_task_form == 'true') {
                var p_tid = JSON.parse(storage.getItem('p_tid'));
            }
            else {
                var p_tid = null;
            }

            var redirect = list_data[0].redirect;

            var is_new_cust_click = localStorage.getItem("is_new_customer_click");
            if (redirect == 'customer' && is_new_cust_click == "true") {
                var siteid = JSON.parse(storage.getItem('type20_cust_id'));
                var sitename = JSON.parse(storage.getItem('type20_cust_name'));
            } else {
                var ap_json_data = ap_json[0].data;
                for (a = 0; a < ap_json_data.length; a++) {
                    var ap_que_id = ap_json_data[a].que_id;
                    if (ap_que_id == 1) {
                        var sitename = ap_json_data[a].ans[0];
                        var siteid = ap_json_data[a].ans[1];
                    }
                }
                if (siteid == "" || siteid == null || siteid == undefined) {
                    var siteid = 0;
                    var sitename = 0;
                }
            }
        } else {
            //var p_tid = JSON.parse(storage.getItem('tid'));
            //var siteid = JSON.parse(storage.getItem('siteid'));
            var p_tid = flow_Array[0].tid;
            var siteid = flow_Array[0].siteid;
            var sitename = JSON.parse(storage.getItem('sitename'));

            if (survey_mode == 'online') {
                p_server_task_id = JSON.parse(storage.getItem('p_server_task_id'));
            }

            var p_udf_id = localStorage.getItem("p_udf_id");
        }

        var status_array = list_data[0].status;
        status_array = status_array.filter(function (elem) {
            return elem != 2;
        });

        if (curr_btn_mode == "button_create_task") {
            var status_t = curr_survey_data["createtask"];
        }
        else {
            if (status_array.length == 1) {
                var status_t = status_array[0];
            } else {
                var status_t = 0;
            }
        }

        var direct_task = list_data[0].direct_task;
        var direct_task_status = list_data[0].direct_task_status;
        if (direct_task == "true") {
            status_t = direct_task_status;
            var rate = '2';
        }
        else {
            var rate = '0';
        }

        checksheetid = checksheetid.split('"').join('');

        // dynamic redirection after task creation (15072019)
        var Json_data = JSON.stringify(ap_json[0].data);
        Json_data = JSON.parse(Json_data);
        var len = Json_data.length;
        for (i = 0; i < len; i++) {
            var que_id = Json_data[i].que_id;
            if (que_id == 4) {
                new_task_user = (Json_data[i].ans[0]).toLowerCase();
                break;
            }
        }

        if (new_task_user == '' || new_task_user == null || new_task_user == undefined) { }
        else {
            user_name = new_task_user;
        }

        var match_temp_id = list_data[0].match_temp_id;
        if (match_temp_id == "" || match_temp_id == null || match_temp_id == undefined) {
            match_temp_id = "";
        }
        var p_match_temp_id = localStorage.getItem('p_match_temp_id');

        //json for task_master_history
        task_history_array = [{
            'p_tid': p_tid,
            'p_server_task_id': p_server_task_id,
            'task_id': task_id,
            'server_task_id': server_task_id,
            'flag': '1',
            'user_id': user_id,
            'username': user_name,
            'rate': rate,
            'siteid': siteid,
            'site_name': sitename,
            'site_address': '',
            'percentage': '0',
            'upload_date': survey_date,
            'survey_date': survey_date,
            'lat': lat,
            'long': long,
            'inspect_count': '0',
            'checksheetid': checksheetid,
            'height': '0',
            'display_siteid': '',
            'step': '0',
            'status': status_t,
            'updateddate': '',
            'millisecond': millisecond,
            'end_of_date': '',
            'data': data,
            'tower_type': udf_id,
            'moduleid': moduleid,
            'module_name': module_name,
            'moduledef': "",
            'srnumber': '',
            'global_var': '',
            'is_down_complete': '1',
            'match_temp_id': match_temp_id
        }];

        var survey_mode = list_data[0].survey_mode;
        if (survey_mode == "online") {
            var is_online = "1";
        }
        else {
            var is_online = "0";
        }

        var redirect = list_data[0].redirect;
        if (redirect == 'customer') {
            server_task_id = 0;

            // update local task entry with is_online = 0 (customer listing + task create) 210923 
            // temporary considering survey_mode = offline afterwards it will get from backflow
            is_online = 0;
        }

        var query_type = 'update';
        //var t_id = localStorage.getItem('tid');
        var t_id = JSON.parse(storage.getItem('tid'));
        var query = "UPDATE task_master set p_tid ='" + p_tid + "', p_server_task_id = " + p_server_task_id + ", task_id = '" + task_id + "', server_task_id = '" + server_task_id + "', flag = '1', user_id = '" + user_id + "', username = '" + user_name + "', rate = '" + rate + "', siteid = '" + siteid + "', site_name =  '" + sitename + "', site_address = ' ', percentage = '0', upload_date = '" + survey_date + "', survey_date = '" + survey_date + "', lat = '" + lat + "', long = '" + long + "', inspect_count = '0', checksheetid = " + checksheetid + ", height = '0', display_siteid = ' ', step = '0', status = '" + status_t + "', updateddate = ' ', millisecond = '" + millisecond + "', end_of_date = ' ', data= '" + data + "', tower_type = '" + udf_id + "', moduleid = '" + moduleid + "', module_name = '"
            + module_name + "', srnumber = ' ', global_var = ' ', is_down_complete = '1', p_udf_id = '" + p_udf_id + "', match_temp_id = '" + match_temp_id + "', is_online = '" + is_online + "' where tid = '" + t_id + "'";

        //alert1("query: " + query);

        last_query = query;

        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            q: "0",
            tid: "", // simple insert
            task: query_type
        });
        cordova.exec(onsuccess_insert_offline_task, onfail_insert_offline_task, 'SqlitePlugin', 'insertValuse', q_jsonobj);

    } catch (e) {
        alert1("Task is not added due to " + e + "");
        storage.setItem('flow_Array', JSON.stringify(''));
        localStorage.setItem('is_subflow', 'false');
        changeurl("selection.html");
    }
}

// successful insert offline task
function onsuccess_insert_offline_task(e) {
    try {
        //alert1("Task has been added successfully !")
        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var survey_mode = list_data[0].survey_mode;

        if (survey_mode == "offline") {
            var task_create_msg = list_data[0].task_create_msg;
            if (task_create_msg == "" || task_create_msg == null || task_create_msg == undefined) { }
            else {
                //alert1(task_create_msg);
            }
        }

        get_last_offline_site();
    } catch (e) {
        alert1(e + "_onsuccess_insert_offline_task()");
        loading_hide();
    }
}

// Get last site without checking user distance
function get_last_offline_site() {
    try {
        //var t_id = localStorage.getItem('tid');
        var t_id = JSON.parse(storage.getItem('tid'));
        var query = "select tid, moduleid, module_name, siteid, site_name, lat, long, data, site_address, status, server_task_id from task_master where tid = '" + t_id + "'";                   //username commented for task creation issue(mobi.app-->asset verificaion[16032020])
        //alert1(query);

        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "1"
        });
        cordova.exec(onsuccess_get_last_offline_site, onfail_get_last_offline_site, 'SqlitePlugin', 'showValues', q_jsonobj);
    } catch (e) {
        alert1(e + '_get_last_offline_site()');
        loading_hide();
    }
}

// successful getting last offline site details
function onsuccess_get_last_offline_site(e) {
    try {
        var myArray = JSON.parse(e);
        //alert1(JSON.stringify(myArray));
        var selected_tid = myArray[0].tid;
        var selected_site = myArray[0].siteid;
        var selected_start_status = myArray[0].status;
        var selected_moduleid = myArray[0].moduleid;
        var selected_modulename = myArray[0].module_name;

        storage.setItem('siteid', JSON.stringify(selected_site));
        storage.setItem('tid', JSON.stringify(selected_tid));
        storage.setItem('start_status', JSON.stringify(selected_start_status));

        // commented 15/07/2019 issue in flow 2071 and 2081
        //storage.setItem('wayflow', JSON.stringify(selected_moduleid));
        //storage.setItem('wayflow_name', JSON.stringify(selected_modulename));

        var flow_Array = JSON.parse(storage.getItem('flow_Array'));
        flow_Array[flow_Array.length - 1].tid = selected_tid;
        flow_Array[flow_Array.length - 1].siteid = selected_site;
        flow_Array[flow_Array.length - 1].start_status = selected_start_status;

        var selected_server_task_id = myArray[0].server_task_id;

        if (flow_Array.length == 1) {
            // set key whil create new main task (asset tagging 2.0 - 22012025 - mk)
            if (selected_server_task_id == "" || selected_server_task_id == null || selected_server_task_id == undefined || selected_server_task_id == "0") { }
            else {
                var task_mode = localStorage.getItem('task_mode');
                if (task_mode == "Update Task") {
                    //if 2 layer and edit type37 sub task then dont update flow_array task_id [FT-18062025]
                }
                else {
                    flow_Array[flow_Array.length - 1].server_task_id = selected_server_task_id;
                }
            }
        }
        else {
            //for 3 layer 
            flow_Array[flow_Array.length - 1].server_task_id = selected_server_task_id;
        }

        storage.setItem('flow_Array', JSON.stringify(flow_Array));

        //insert_task_json_log_for_last_task(selected_tid);
        insert_task_master_history(selected_tid);
    } catch (e) {
        alert1(e + '_onsuccess_get_last_offline_site()');
        loading_hide();
    }
}

function insert_task_master_history(t_id) {
    try {
        var date = new Date();
        var local_milli = date.getTime();
        var obj = task_history_array[0];
        var role_id = JSON.parse(storage.getItem('role_id'));

        var query = "INSERT INTO task_master_history (tid, p_tid, p_server_task_id, task_id ,server_task_id, flag, user_id, username, rate, siteid, site_name, site_address, percentage, upload_date, survey_date,lat,long,inspect_count,checksheetid,height,display_siteid,step,status,updateddate,millisecond,end_of_date,data,tower_type,moduleid,module_name,srnumber,global_var, entry_type, local_milli, role_id) VALUES("
            + t_id + ",'" + obj.p_tid + "'," + obj.p_server_task_id + ", '" + obj.task_id + "','" + obj.server_task_id + "','2','" + obj.user_id + "','" + obj.username
            + "','" + obj.rate + "','" + obj.siteid + "','" + obj.site_name + "','','0','" + obj.survey_date + "','" + obj.survey_date + "','" + obj.lat + "','" + obj.long
            + "','0'," + obj.checksheetid + ",'0','','0','" + obj.status + "','','" + obj.millisecond + "','','" + obj.data
            + "','" + obj.tower_type + "','" + obj.moduleid + "','" + obj.module_name + "','','', 'js_insert', '" + local_milli + "', '" + role_id + "');";
        //alert1("query: " + query);

        last_query = query;

        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            q: "5",
            tid: "" // simple insert
        });
        cordova.exec(insert_task_json_log_for_last_task, onfail_insert_offline_task, 'SqlitePlugin', 'insertValuse', q_jsonobj);
    }
    catch (e) {
        alert1(e + '_insert_task_master_history()');
        loading_hide();
    }
}


// insert form_json to f_master for recently created task type=5
function insert_task_json_log_for_last_task() {
    // insert data to f_master table - goto action - Save & Next/Reject Buttons
    // alert1("inserting new entry...");
    try {
        var selected_tid = JSON.parse(storage.getItem('tid'));
        var imei_no = JSON.parse(storage.getItem('imeino'));
        var date_s = new Date();
        var time = date_s.getTime();
        var f_name = imei_no + "_" + time;
        var jsonData = JSON.stringify(ap_json[0].data);
        // jsonData = JSON.stringify(jsonData);
        var check_type = storage.getItem('check_type_task');
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

        localStorage.setItem('task_log_data', jsonData);

        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var match_temp_id = list_data[0].match_temp_id;
        if (match_temp_id == "" || match_temp_id == null || match_temp_id == undefined) {
            match_temp_id = "";
        }

        var query = "INSERT INTO f_master (c_id, c_type, tid ,f_name, f_data, f_key, f_value, f_type, flag, step, match_temp_id) VALUES("
            + check_type + ",'5','" + selected_tid + "','" + f_name + "','" + fileData + "', 's'," + check_type + ",'text/plain','1','1','" + match_temp_id + "');";
        //alert1(query);
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            q: "0",
            tid: selected_tid
        });
        cordova.exec(onsuccess_insert_task_json_log_for_last_task, onfail_insert_task_json_log_for_last_task, 'SqlitePlugin', 'insertValuse', q_jsonobj);
    } catch (e) {
        alert1(e + '_insert_task_json_log_for_last_task()');
        loading_hide();
    }
}

// successful insert offline task
function onsuccess_insert_task_json_log_for_last_task(e) {
    try {
        // alert1("Task JSON has been added successfully to f_master!")


        let task_create_popup = $('.popup-new-task-create.modal-in:visible');
        if (task_create_popup.length > 0) {
            // type37 task create
            setTimeout(function () {
                //myApp.closeModal('.popup-new-task-create');
                close_new_task_create_popup();
                $("#btn_type_37_refresh_" + curr_type37_new_id).trigger('click');
            }, 1000);
        }
        else {
            // normal task create
            var data_json = JSON.parse(storage.getItem('list_json'));
            var list_data = JSON.parse(data_json);
            var redirect = list_data[0].redirect;
            if (redirect == 'customer') {
                storage.setItem('cust_flow_Array', JSON.stringify(''));

                var back_flow = list_data[0].back_flow;
                get_data_for_back_flow(back_flow);

            } else {
                //var auto_trip = list_data[0].auto_trip;
                //if (auto_trip == 'true') {
                //    // Auto trip start
                //    myApp.showPreloader('Initializing Trip...');
                //    var locObj = new MkLocation();
                //    locObj._getLocation(function (e) {
                //        temp_location_Array = e;

                //        var t_tid = JSON.parse(storage.getItem('tid'));
                //        var t_ser_task_id = JSON.parse(storage.getItem('server_task_id'));
                //        localStorage.setItem('trip_status', '0');
                //        localStorage.setItem('trip_tid', t_tid);
                //        localStorage.setItem('trip_ser_task_id', t_ser_task_id);
                //        start_stop_trip(0);
                //    });
                //}
                //else {

                var direct_task = list_data[0].direct_task;
                if (direct_task == "true") {
                    var is_subflow = localStorage.getItem('is_subflow');
                    if (is_subflow == 'true') {
                        var flow_Array = JSON.parse(storage.getItem('flow_Array'));
                        var selected_tid = flow_Array[0].tid;
                        storage.setItem('tid', JSON.stringify(selected_tid));
                    }

                    changeurl("selection_survey.html");
                }
                else {
                    var redirect = curr_survey_data['redirect'];
                    if (redirect == '' || redirect == null || redirect == undefined) {
                        // redirect is not defined
                        if (username == new_task_user) {
                            localStorage.setItem('is_shortcutbutton', 'false');
                            set_common_localStorage('redirect_on_checksheet', 'true');
                            store_system_variables();
                        }
                        else {
                            changeurl("selection_survey.html");
                        }
                    }
                    else {
                        // redirect is defined
                        if (redirect == 'checksheet') {
                            set_common_localStorage('redirect_on_checksheet', 'true');
                            store_system_variables();
                        }
                        else {
                            changeurl("selection_survey.html");
                        }
                    }
                }

                //}
            }
        }       
    } catch (e) {
        alert1(e + "_onsuccess_insert_offline_task()");
    }
}

function get_data_for_back_flow(back_flow) {
    var query = "SELECT flow_id, flow_name1, data, id, type FROM  User_Define_Flow_Master WHERE id = " + back_flow + " and (is_delete != 1 or is_delete IS NULL)";
    var q_jsonobj = [];
    q_jsonobj.push({
        data: query,
        p: "1"
    });
    cordova.exec(onsuccess_get_data_for_back_flow, onfail_get_data_for_back_flow, 'SqlitePlugin', 'showValues', q_jsonobj);
}

function onsuccess_get_data_for_back_flow(e) {
    var myArray = JSON.parse(e);
    var id = myArray[0].id;
    var type = myArray[0].type;
    var flow_id = myArray[0].flow_id;
    var flow_name = myArray[0].flow_name1;
    var data_count = myArray[0].data;
    storage.setItem('wayflow', JSON.stringify(flow_id));
    storage.setItem('wayflow_name', JSON.stringify(flow_name));
    storage.setItem('udf_id', JSON.stringify(id));
    //storage.setItem('list_json', JSON.stringify(data_count));

    // new logic for customer list and task redirection 0th level
    storage.setItem('tab_index', JSON.stringify(0));
    localStorage.setItem('is_subflow', 'false');
    storage.setItem('list_json_Array', JSON.stringify(data_count));

    var list_data = JSON.parse(data_count);
    var module_bottom_image = list_data[0].module_bottom_image;
    localStorage.setItem('module_bottom_image', module_bottom_image);

    var level_Array = JSON.parse(storage.getItem('level_Array'));    // for module leveling items
    level_Array.pop();
    level_Array.push({ 'last_flow_name': flow_name, 'module_bottom_image': module_bottom_image });
    storage.setItem('level_Array', JSON.stringify(level_Array));

    var flow_Array = [];
    flow_Array.push({
        'id': id,
        'wayflow': flow_id,
        'wayflow_name': flow_name,
        'type': type,
        'tid': '',
        'siteid': '',
        'start_status': '',
        'end_status': '',
        'checklist': '',
        'list_json': data_count
    });
    storage.setItem('flow_Array', JSON.stringify(flow_Array));

    var data_json = JSON.parse(storage.getItem('list_json_Array'));
    var list_data = JSON.parse(data_json);
    var f_list_data = JSON.stringify(list_data[0]);
    storage.setItem('list_json', JSON.stringify("[" + f_list_data + "]"));

    var direct_task = list_data[0].direct_task;
    if (direct_task == "true") {
        // create task and back to task listing
        var is_subflow = localStorage.getItem('is_subflow');
        if (is_subflow == 'true') {
            var flow_Array = JSON.parse(storage.getItem('flow_Array'));
            var selected_tid = flow_Array[0].tid;
            storage.setItem('tid', JSON.stringify(selected_tid));
        }

        changeurl("selection_survey.html");
    }
    else {
        // create task and fill this task
        store_system_variables();
    }
}

function onfail_get_data_for_back_flow(e) {
    alert1(e + '_onfail_get_data_for_back_flow()');
    loading_hide();
}

// store system variables for task-list and customer-list
function store_system_variables() {
    try {
        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var Columndata_json = list_data[0].columndata;
        var type20_columndata = [];

        //var data = JSON.parse(jsonData);
        var data = localStorage.getItem('task_log_data');
        data = JSON.parse(data);

        var t_check_type = JSON.parse(storage.getItem('check_type_task'));
        for (p = 0; p < Columndata_json.length; p++) {
            var header = Columndata_json[p].header;
            var checksheet_id = parseInt(Columndata_json[p].checksheetID);
            if (checksheet_id == t_check_type) {
                var qid = Columndata_json[p].qid;
                for (var q = 0; q < data.length; q++) {
                    var que_id = data[q].que_id;
                    if (qid == que_id) {
                        if (data[q].type == "20" || data[q].type == "21") {
                            var ans_lable = data[q].ans[0];
                        }
                        else if (data[q].type == "8") {
                            var ans_lable = data[q].ans[0];
                            ans_lable = convert_datetime_by_format(ans_lable, "datetime");
                        }
                        else if (data[q].type == "22") {
                            var json_inv_calc = itemObj._checkStrObj(data[q].ans[0]);  		// check_item
                            var sum_finaljson = json_inv_calc[0].sum_finaljson;
                            for (m = 0; m < sum_finaljson.length; m++) {
                                var ans_lable = sum_finaljson[m].txt_sum_value;
                                if (ans_lable == "" || ans_lable == null || ans_lable == undefined) {
                                    var ans_lable = "Sum Not Available!";
                                } else {
                                    break;
                                }
                            }
                        } else {
                            var ans_lable = data[q].ans[0];                                 //take ans[0] for columndata array issue in OlaTech[olatech.aksales]----(15042020)
                        }

                        type20_columndata.push({
                            header: header,
                            ans: ans_lable
                        });
                        break;
                    }
                }
            }
        }

        var flow_Array = JSON.parse(storage.getItem('flow_Array'));
        if (flow_Array.length > 1) {
            // store main task sys var
            var main_task_columndata = JSON.parse(storage.getItem('type20_columndata'));
            if (main_task_columndata == '' || main_task_columndata == null || main_task_columndata == undefined) { }
            else {
                for (c = 0; c < main_task_columndata.length; c++) {
                    var key = main_task_columndata[c].header;
                    var value = main_task_columndata[c].ans;
                    type20_columndata.push({
                        header: key,
                        ans: value
                    });
                }
            }
        }

        storage.setItem('type20_columndata', JSON.stringify(type20_columndata));

        // store task dependency 15092020
        var task_Dependency = [];
        var columndata = list_data[0].columndata;
        for (c = 0; c < columndata.length; c++) {
            var col_dependency = columndata[c].dependency;
            if (col_dependency == "" || col_dependency == null || col_dependency == undefined) { }
            else {
                var header = columndata[c].header;
                for (h = 0; h < type20_columndata.length; h++) {
                    var t_header = type20_columndata[h].header;
                    if (header == t_header) {
                        var ele_ans = type20_columndata[h].ans;
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
        localStorage.setItem('task_Dependency', JSON.stringify(task_Dependency));

        storage.setItem('curr_btn_mode', JSON.stringify(''));

        loading();
        //setTimeout(function () {
        check_child_flow_for_parent();                   //to skip single checksheet list
        //}, 3000);         //commented for loading issue after new task creation [19102021] (ck.audit)
    }
    catch (e) {
        alert1(e + '_store_system_variables()');
        loading_hide();
    }
}


// //////onfail part
function onfail_get_user_latlong_offline_task(e) {
    alert1(e + '_onfail_get_user_latlong_offline_task()');
    loading_hide();
}

function onfail_get_data_for_task(e) {
    alert1(e + '_onfail_get_data_for_task()');
    loading_hide();
}

function onfail_insert_offline_task(e) {
    alert1(last_query + '_onfail_insert_offline_task()');
    loading_hide();
}

function onfail_get_last_offline_site(e) {
    alert1(e + '_onfail_get_last_offline_site()');
    loading_hide();
}

function onfail_insert_task_json_log_for_last_task(e) {
    alert1(e + '_onfail_insert_task_json_log_for_last_task()');
    loading_hide();
}



