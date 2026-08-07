
var value_counter = [];

function get_counter_for_online_flow() {
    try {
        var module_layout = localStorage.getItem('module_layout');
        if (module_layout == "cardview") {
            $("span[id^='circle_']").html('<img src="images/ajax-loader.gif" style="width:20px; height:20px">');
            $("span[id^='circle_']").removeClass("button-fill");
            $(".offline_loader").show();
            $(".offline_counter").hide();
        }
        else {
            $("span[id^='circle_']").html('<i class="fa fa-spinner fa-spin cls_task_ico"></i>');
            $("span[id^='circle_']").removeClass('button-fill');
            $("span[id^='circle_']").css('background-color', 'initial');

            //offline module
            $(".offline_loader").show();
            //$(".offline_counter").hide();
        }

        localStorage.setItem('udf_count_array', '');

        var locObj = new MkLocation();
        locObj._getLocation(function (e) {
            var lat = e[0].lat;
            var long = e[0].long;

            var company_id = JSON.parse(storage.getItem('company_id'));
            var user_id = JSON.parse(storage.getItem('user_id'));
            var user_name = JSON.parse(storage.getItem('user_name'));
            var role_id = JSON.parse(storage.getItem('role_id'));
            var role_name = JSON.parse(storage.getItem('role_name'));
            var circle_id = JSON.parse(storage.getItem('circle_id'));
            var circle_name = JSON.parse(storage.getItem('circle_name'));

            var sys_var_Array = [];
            sys_var_Array.push({ "key": "<'#company_id#'>", "value": company_id });
            sys_var_Array.push({ "key": "<'#user_id#'>", "value": user_id });
            sys_var_Array.push({ "key": "<'#user_name#'>", "value": user_name });
            sys_var_Array.push({ "key": "<'#role_id#'>", "value": role_id });
            sys_var_Array.push({ "key": "<'#role_name#'>", "value": role_name });
            sys_var_Array.push({ "key": "<'#circle_id#'>", "value": circle_id });
            sys_var_Array.push({ "key": "<'#circle_name#'>", "value": circle_name });

            var param_obj = [];
            param_obj.push({
                "company_id": company_id,
                "user_id": user_id,
                "user_lat": lat,
                "user_long": long,
                'system_var': sys_var_Array
            });

            var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_OnlineTaskList_Native_Count', JSON.stringify(param_obj), onsuccess_get_counter_for_online_flow, onfail_get_counter_for_online_flow);
            getdata.callOtherDomain();
        });
    }
    catch (e) {
        alert1(e);
    }
}

function onsuccess_get_counter_for_online_flow(e) {
    try {
        setTimeout(function () {
            var responseText = e.responseText;
            var myArray = JSON.parse(responseText);
            var status = myArray[0].status;
            //var counter_bgcolor = $('.navbar').css('background-color');
            var counter_bgcolor = "red";
            if (status == 1) {
                $(".offline_loader").hide();
                $(".offline_counter").show();

                var data = myArray[0].data;
                if (data == "" || data == null || data == undefined) {
                    var message = myArray[0].message;
                    localStorage.setItem('task_count_response', message);
                    message = JSON.parse(message);
                }
                else {
                    localStorage.setItem('task_count_response', data);
                    var message = JSON.parse(data);
                }

                localStorage.setItem('online_counter', 'true');

                var t_udf_count_array = [];

                for (var i = 0; i < message.length; i++) {
                    //var task_count = message[i].task_count;
                    var task_count = 0;
                    var cont_ = message[i].cont_;
                    var udf_id = message[i].udf_id;

                    if (cont_ == "" || cont_ == null || cont_ == undefined) { }
                    else {
                        for (var j = 0; j < cont_.length; j++) {
                            var tab_cont = cont_[j];
                            task_count = task_count + tab_cont;
                        }
                    }

                    t_udf_count_array[udf_id] = task_count;

                    if (task_count == -1) {
                        task_count = "E";
                    }

                    if (task_count != 'E') {
                        task_count = numFormatter(task_count);
                    }

                    //$("#circle_" + udf_id + "").css("background-color", "black");
                    $("#circle_" + udf_id + "").addClass("button-fill");
                    $("#circle_" + udf_id + "").html(task_count);

                    var module_layout = localStorage.getItem('module_layout');
                    if (module_layout != "cardview") {
                        $("#circle_" + udf_id + "").addClass('button-fill');
                        $("#circle_" + udf_id + "").addClass('cls_task_ico');
                        //$("#circle_" + udf_id + "").css('background-color', counter_bgcolor);
                    }
                }
                localStorage.setItem('udf_count_array', JSON.stringify(t_udf_count_array));

                var time = new Date();
                var counter_session_ms = time.getTime();
                localStorage.setItem('counter_session_ms', counter_session_ms);
            }
            else {
                //offline
                $(".offline_loader").hide();
                $(".offline_counter").show();
                $(".offline_counter").html('ER');

                //online
                $("span[id^='circle_']").html('ER');
                $("span[id^='circle_']").addClass('button-fill');
                $("span[id^='circle_']").css('background-color', counter_bgcolor);
            }

            loading_hide();
        }, 1000);
    }
    catch (e) {
        alert1(e + '_onsuccess_get_counter_for_online_flow()');
    }
}

function onfail_get_counter_for_online_flow(e) {
    $("span[id^='circle_']").remove();

    //offline module
    $(".offline_loader").hide();
    $(".offline_counter").show();
    //alert1(e);
}


function check_for_notification() {
    try {
        var query = "select username from Login_master";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "1"
        });

        cordova.exec(onsuccess_check_for_notification, onfail_check_for_notification, 'SqlitePlugin', 'shared', q_jsonobj);
    } catch (e) {
        //alert1(e + "_check_for_notification()");
        check_for_notification();
    }
}

function onsuccess_check_for_notification(e) {
    try {
        var myArray = JSON.parse(e);
        var flow_id = myArray[0].flow_id;
        if (flow_id == '' || flow_id == null || flow_id == undefined) {
            // notification not exist
            get_data_from_ufm();
        } else {
            // notification exist
            var flow_id = myArray[0].flow_id;
            var udf_id = myArray[0].udf_id;
            var flow_name = myArray[0].flow_name;
            var flow_type = myArray[0].flow_type;
            var udf_data = myArray[0].udf_data;
            var role_id = myArray[0].rollid;
            //var list_item = '<input type="hidden" id="hdn_' + udf_id + '" value=\'' + udf_data + '\'>';
            var list_item = "<input type='hidden' id='hdn_" + udf_id + "' value=\"" + encodeURIComponent(udf_data) + "\">";
            $("#divcontent").append(list_item);

            var data_count = $("#hdn_" + udf_id + "").val();
            data_count = decodeURIComponent(data_count);

            storage.setItem('wayflow', JSON.stringify(flow_id));
            storage.setItem('wayflow_name', JSON.stringify(flow_name));

            redirect_on_module_click(flow_name, udf_id, flow_id, flow_type, role_id);
        }
    } catch (e) {
        alert1(e + '_onsuccess_check_for_notification()')
    }
}

function onfail_check_for_notification(e) {
    alert1(e + '_onfail_check_for_notification()');
}

function get_udf_pid() {
    try {
        var id_Array = JSON.parse(storage.getItem('id_Array'));
        if (id_Array == '' || id_Array == undefined || id_Array == null) {
            var cust_flow_Array = JSON.parse(storage.getItem('cust_flow_Array'));
            if (cust_flow_Array == '' || cust_flow_Array == null || cust_flow_Array == undefined) { }
            if (cust_flow_Array.length > 0) {
                var p_id = cust_flow_Array[0].id;
            }
            else {
                var p_id = 0;
            }
        } else {
            var p_id = id_Array[id_Array.length - 1];
        }

        return p_id;
    } catch (e) {
        alert1(e + '_get_udf_pid()');
    }
}

function get_data_from_ufm() {
    try {
        var p_id = get_udf_pid();
        var role_id_array = localStorage.getItem('role_id_array');
        var query = "select id,data,type from User_Define_Flow_Master WHERE p_id = " + p_id + " and rollid in (" + role_id_array + ") and (is_delete != 1 or is_delete IS NULL)";
        //alert1("query: " + query);
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "1"
        });

        cordova.exec(SuccessCallBack_onload_get_data_from_ufm, get_data_from_ufm_FailCallBack, 'SqlitePlugin', 'showValues', q_jsonobj);
    } catch (e) {
        alert1(e + "get_data_from_ufm");
    }
}

function SuccessCallBack_onload_get_data_from_ufm(e) {
    try {
        var myArray = JSON.parse(e);
        var status_string = '';
        var status;
        if (myArray.length > 0) {
            status = '';
            var status_string = '(';
            for (var i = 0; i < myArray.length; i++) {
                var id = myArray[i].id;
                var type = myArray[i].type;
                if (type == "Flow") {
                    var data = JSON.parse(myArray[i].data);
                    status = data[0].status;
                    if (status == undefined) {
                        status = '-1';
                    }
                } else {
                    status = '-1';
                }

                if (i == myArray.length - 1) {
                    status_string += ' (ufm.id=' + id + ' and tm.status in(' + status + ')))';
                } else {
                    status_string += ' (ufm.id=' + id + ' and tm.status in(' + status + ')) or';
                }
            }
            onload_get_counter_of_module_flow_new(status_string);
        }
        else {

            // when no flow assign to app user (head role) will display only featured options
            var KYFF = localStorage.getItem('KYFF');
            var Chart = localStorage.getItem('Chart');
            var Tech_Report = localStorage.getItem('Tech_Report');
            var Live_Alarm_Report = localStorage.getItem('Live_Alarm_Report');
            var Scoreboard = localStorage.getItem('Scoreboard');
            var Attendance = localStorage.getItem('Attendance');
            if (KYFF == 'True' || Chart == 'True' || Tech_Report == 'True' || Live_Alarm_Report == 'True' || Scoreboard == 'True' || Attendance == 'true') {
                $("#menu_MISC").show();
                if (KYFF == 'True') {
                    $("#menu_KYFF").show();
                }
                if (Chart == 'True') {
                    $("#menu_Chart").show();
                }
                if (Tech_Report == 'True') {
                    $("#menu_tech_rep").show();
                }
                if (Live_Alarm_Report == 'True') {
                    $("#menu_live_alarm").show();
                }
                if (Scoreboard == 'True') {
                    $("#menu_Scoreboard").show();
                }
                if (Attendance == 'true') {
                    $("#menu_Attendance").show();
                }
            }
            else {
                // no udf to display

                let domain_url = JSON.parse(storage.getItem('global_url'));
                if (domain_url.indexOf("viu.vodafoneidea.com") > -1) {
                    // background database is not downloaded for VIU URL
                    get_list_of_modules_online();
                }
                else {
                    var user_list_feature = localStorage.getItem("user_list_feature_id");
                    if (user_list_feature == "" || user_list_feature == null || user_list_feature == undefined || user_list_feature == "0") {
                        changeurl("selection.html");
                    }
                    else {
                        //$("#card_module_list").empty();
                        //add_user_module_to_list();
                        changeurl("EF_User_List.html");
                    }
                }
            }

            enable_back_button();
        }
    } catch (e) {
        alert1(e + "SuccessCallBack_onload_get_data_from_ufm");
    }

}
function get_data_from_ufm_FailCallBack(e) {
    alert1(e + "get_data_from_ufm_FailCallBack");
}
function onload_get_counter_of_module_flow_new(status_string) {
    try {
        //var query = "select ufm.id,max(ufm.flow_id) as flow_id,max(ufm.p_id) as p_id ,ufm.type,ufm.flow_name,ufm.level_position, ufm.type, sum(case when (tm.tid is not null or tm.tid !=0) and "
        //		+ status_string
        //		+ " then 1 else 0 end ) as count,max(tm.moduleid) as 'testmodule' from User_Define_Flow_Master ufm left join task_master tm ON tm.moduleid = ufm.flow_id  group by ufm.id order by level_position desc";
        var p_id = get_udf_pid();
        var query = "select ufm.id,max(ufm.flow_id) as flow_id,max(ufm.p_id) as p_id ,ufm.type,ufm.flow_name,ufm.level_position, ufm.type, sum(case when ((tm.tid is not null or tm.tid !=0) and tm.is_down_complete = 1) and "
            + status_string + " then 1 else 0 end ) as count,max(tm.moduleid) as 'testmodule' from User_Define_Flow_Master ufm left join task_master tm ON tm.moduleid = ufm.flow_id WHERE ufm.p_id = " + p_id + " and (ufm.is_delete != 1 or ufm.is_delete IS NULL) group by ufm.id order by level_position desc";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "1"
        });

        cordova.exec(SuccessCallBack_onload_get_counter_of_module_flow,
            get_flow_counter_FailCallBack, 'SqlitePlugin', 'showValues',
            q_jsonobj);
    } catch (e) {
        alert1(e + "_onload_get_counter_of_module_flow_new");
    }
    return false;
}

function SuccessCallBack_onload_get_counter_of_module_flow(e) {
    try {
        var myArray = JSON.parse(e);
        if (myArray.length > 0) {
            for (var i = 0; i < myArray.length; i++) {
                var id = myArray[i].id;
                var count = myArray[i].count;
                var flow_id = myArray[i].flow_id;
                var p_id = myArray[i].p_id;
                var level_position = myArray[i].level_position;
                var flow_name = myArray[i].flow_name;
                var type = myArray[i].type;

                value_counter.push({
                    "id": id,
                    "count": count,
                    "flow_id": flow_id,
                    "p_id": p_id,
                    "level_position": level_position,
                    "flow_name": flow_name,
                    "type": type
                });

            }
            set_count_value_to_module();
        } else {
            alert1("No Module found ! Please go back...");
            onload_get_counter_of_module_flow_new("here");
        }
    } catch (e) {
        alert1(e + "SuccessCallBack_get_flow_module_counter");
    }
}

function set_count_value_to_module() {
    try {
        for (var i = 0; i < value_counter.length; i++) {
            var id = value_counter[i].id;
            var count = value_counter[i].count;
            var flow_id = value_counter[i].flow_id;
            var p_id = value_counter[i].p_id;
            var level_position = value_counter[i].level_position;
            var type = value_counter[i].type;
            var flow_name = value_counter[i].flow_name;
            count = parseInt(count);
            if (type == 'Module') {
                for (var j = 0; j < value_counter.length; j++) {
                    var id_temp = value_counter[j].id;
                    var count_temp = value_counter[j].count;
                    var flow_id_temp = value_counter[j].flow_id;
                    var p_id_temp = value_counter[j].p_id;
                    var level_position_temp = value_counter[j].level_position;
                    var type_temp = value_counter[j].type;
                    var flow_name_temp = value_counter[j].flow_name;
                    count_temp = parseInt(count_temp);
                    if (id == p_id_temp) {
                        count += count_temp;
                    }
                }
                value_counter[i].count = count;
            }
        }
        get_list_of_modules();
    } catch (e) {
        alert1(e + "_set_count_value_to_module");
    }
}

// get list of modules
var featured_options_display = 0;
function get_list_of_modules() {
    try {

        var id_Array = JSON.parse(storage.getItem('id_Array'));
        if (id_Array == '' || id_Array == undefined || id_Array == null) {

            // site wise module listing change 13/12/2018
            var cust_flow_Array = JSON.parse(storage.getItem('cust_flow_Array'));
            if (cust_flow_Array == '' || cust_flow_Array == null || cust_flow_Array == undefined) {
                cust_flow_Array = [];
            }
            if (cust_flow_Array.length > 0) {
                // for site wise multiflow listing
                var id = cust_flow_Array[0].id;
                var flow_id = cust_flow_Array[0].wayflow;
                var flow_name = cust_flow_Array[0].wayflow_name;
                var list_json = cust_flow_Array[0].list_json;
                storage.setItem('udf_id', JSON.stringify(id));
                storage.setItem('wayflow', JSON.stringify(flow_id));
                storage.setItem('wayflow_name', JSON.stringify(flow_name));

                var role_id_array = localStorage.getItem('role_id_array');
                var query = "SELECT * FROM  User_Define_Flow_Master WHERE p_id = " + id + " and rollid in (" + role_id_array + ") and (is_delete != 1 or is_delete IS NULL)";
            }
            else {
                // Featured options display
                setTimeout(function () {
                    var KYFF = localStorage.getItem('KYFF');
                    var Chart = localStorage.getItem('Chart');
                    var Tech_Report = localStorage.getItem('Tech_Report');
                    var Live_Alarm_Report = localStorage.getItem('Live_Alarm_Report');
                    var Scoreboard = localStorage.getItem('Scoreboard');
                    var Attendance = localStorage.getItem('Attendance');
                    if (KYFF == 'True' || Chart == 'True' || Tech_Report == 'True' || Live_Alarm_Report == 'True' || Scoreboard == 'True' || Attendance == 'true') {
                        featured_options_display = 1;

                        $("#menu_MISC").show();
                        if (KYFF == 'True') {
                            $("#menu_KYFF").show();
                        }
                        if (Chart == 'True') {
                            $("#menu_Chart").show();
                        }
                        if (Tech_Report == 'True') {
                            $("#menu_tech_rep").show();
                        }
                        if (Live_Alarm_Report == 'True') {
                            $("#menu_live_alarm").show();
                        }
                        if (Scoreboard == 'True') {
                            $("#menu_Scoreboard").show();
                        }
                        if (Attendance == 'true') {
                            $("#menu_Attendance").show();
                        }
                    }
                }, 300);

                var user_list_feature = localStorage.getItem("user_list_feature_id");
                if (user_list_feature == "" || user_list_feature == null || user_list_feature == undefined || user_list_feature == "0") { }
                else {
                    featured_options_display = featured_options_display + 1;
                }

                $("#lbl_last_flow").text('');
                $("#div_level").hide();
                $("#menu_Bottom_Image").hide();

                var role_id_array = localStorage.getItem('role_id_array');
                var query = "SELECT * FROM User_Define_Flow_Master WHERE p_id = 0 and rollid in (" + role_id_array + ") and (is_delete != 1 or is_delete IS NULL)";
            }
        } else {
            $("#menu_MISC").hide();

            setTimeout(function () {
                var module_bottom_image = localStorage.getItem('module_bottom_image');
                if (module_bottom_image == 'true') {
                    var bottom_img = localStorage.getItem('Login_Bottom_Image');
                    if (bottom_img == '' || bottom_img == null || bottom_img == undefined) { }
                    else {
                        $("#menu_Bottom_Image").show();
                        $("#menu_Bottom_Image img").attr("src", "data:image/png;base64," + bottom_img + "");
                    }
                }
                else {
                    $("#menu_Bottom_Image").hide();
                }
            }, 300);

            $("#div_level").show();
            var level_Array = JSON.parse(storage.getItem('level_Array'));
            if (level_Array.length > 0) {
                var last_flow_name = level_Array[level_Array.length - 1].last_flow_name;
                $("#lbl_last_flow").text(last_flow_name);
            }

            var role_id_array = localStorage.getItem('role_id_array');
            var query = "SELECT * FROM  User_Define_Flow_Master WHERE p_id = " + id_Array[id_Array.length - 1] + " and rollid in (" + role_id_array + ") and (is_delete != 1 or is_delete IS NULL)";
        }

        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "1"
        });
        //alert1("query: " + query);
        cordova.exec(SuccessCallBack_get_modules, showValuesFailCallBack, 'SqlitePlugin', 'showValues', q_jsonobj);

    } catch (e) {
        //alert1(e + '_get_list_of_modules()');
        get_list_of_modules();
        loading_hide();
    }
}

function SuccessCallBack_get_modules(e) {
    try {
        var myArray1 = JSON.parse(e);
        var geofance_counter = [];
        var navigation_counter = [];
        var redirect_on_module = localStorage.getItem('redirect_on_module');
        var id_Array = JSON.parse(storage.getItem('id_Array'));
        var module_count = 0;
        var module_layout = localStorage.getItem('module_layout');
        button_clicked = 0;                             //refresh button_clicked for issue of loading when click on flow(module-->flow) in ATC [28082020]

        $("#module_list").empty();
        $("#card_module_list").empty();

        //if (module_layout == "cardview" && myArray1[0].level_position == 0) {
        //    $("#module_list").hide();
        //    //$("#module_bg_div").show();
        //    $("#card_username").html(username);
        //}
        //else {
        //    //$("#module_bg_div").hide();
        //    $("#module_list").show();
        //}

        if (module_layout == "cardview") {
            $("#module_list").hide();
            $("#card_module_list").show();
        }
        else {
            $("#module_list").show();
            $("#card_module_list").hide();
        }

        if (myArray1.length > 5) {
            $("#txtsearch").show();
        }

        if ((myArray1.length > 1 || featured_options_display > 0) && redirect_on_module == "true") {
            localStorage.setItem('redirect_on_module', 'false');
            changeurl("selection.html");
        }
        else {
            var curr_btn_mode = JSON.parse(storage.getItem('curr_btn_mode'));

            if (myArray1.length == 1 && curr_btn_mode != 'back' && featured_options_display == 0) {
                //to skip single module list
                var data_array = JSON.parse(myArray1[0].data);
                var access_type = data_array[0].access_type;
                if (access_type == '' || access_type == null || access_type == undefined || access_type == "mobile" || access_type == "both") {
                    button_clicked = 0;
                    //$("#module_list").append('<li><input type="hidden" id="hdn_' + myArray1[0].id + '" value=\'' + myArray1[0].data + '\'></li>');
                    $("#module_list").append("<li><input type='hidden' id='hdn_" + myArray1[0].id + "' value=\"" + encodeURIComponent(myArray1[0].data) + "\"></li>");

                    module_count++;
                    localStorage.setItem('last_modulelist_count', module_count);
                    redirect_on_module_click(myArray1[0].flow_name1, myArray1[0].id, myArray1[0].flow_id, myArray1[0].type, myArray1[0].rollid);
                }
            }
            else if (myArray1.length == 1 && curr_btn_mode == 'back' && myArray1[0].level_position > 0 && featured_options_display == 0) {
                //to backward skip single module list
                back_button('selection');
            }
            else if (myArray1.length > 0) {
                // /// sort flow start
                var newmyArray = [];
                for (j = 0; j < myArray1.length; j++) {
                    var flow_data = JSON.parse(myArray1[j].data);
                    var position = parseInt(flow_data[0].position);
                    var data = myArray1[j].data;

                    newmyArray.push({
                        'position': position,
                        'data': myArray1[j]
                    })
                }

                // sort json array in asc order
                var sorted_myArray = newmyArray.sort(function (a, b) {
                    var x = a.position < b.position ? -1 : 1;
                    return x;
                });

                // Give background color of module list 16122024 PG
                var t_color_name = JSON.parse(storage.getItem('viewsite_btn_color'));
                //var light_theme_color = t_color_name.replace(')', ', 0.15)').replace('rgb', 'rgba');

                // static gray color
                var light_theme_color = "#ecedef";

                // /// sort flow end
                var tbl_str = "";
                var pm_flow_count = 0;
                for (var i = 0; i < sorted_myArray.length; i++) {
                    var myArray = [];
                    myArray.push(sorted_myArray[i].data);
                    var id_count = myArray[0].id;
                    var counter_1 = JSON.parse(myArray[0].data);
                    var access_type = counter_1[0].access_type;

                    //// always display geotracking module (new map view) 29092023
                    //if (myArray[0].type == "GeoTracking") {
                    //    access_type = "both"
                    //}

                    if (access_type == '' || access_type == null || access_type == undefined || access_type == "mobile" || access_type == "both") {
                        var data_string = JSON.stringify(myArray[0].data);
                        if (myArray[0].type == 'Flow') {
                            var param = "\"redirect_on_module_click('" + myArray[0].flow_name1 + "' , " + myArray[0].id + "," + myArray[0].flow_id + ",'" + myArray[0].type + "','" + myArray[0].rollid + "')\"";
                        }
                        else if (myArray[0].type == 'Chart') {
                            var company_feature_id = counter_1[0].company_feature_id;
                            var checksheet_id = counter_1[0].checksheet_id;
                            var support_details = counter_1[0].support;
                            var chart_collapse = counter_1[0].chart_collapse;
                            var chart_id = counter_1[0].chart_id;
                            var param = "\"redirect_on_chart_click('" + company_feature_id + "' , '" + checksheet_id + "', '" + support_details + "', '" + chart_collapse + "', '" + myArray[0].flow_name + "', '" + chart_id + "')\"";
                        }
                        else if (myArray[0].type == 'CustomReports') {
                            var company_feature_id = counter_1[0].company_feature_id;
                            var param = "\"redirect_on_custom_report_click('" + company_feature_id + "')\"";
                        }
                        else if (myArray[0].type == 'GeoTracking') {
                            var param = "\"redirect_on_geotracking_click()\"";
                        }
                        else {
                            var param = "\"redirect_on_module_click('" + myArray[0].flow_name + "' , " + myArray[0].id + "," + myArray[0].flow_id + ",'" + myArray[0].type + "','" + myArray[0].rollid + "')\"";
                        }

                        var survey_mode = counter_1[0].survey_mode;
                        if (survey_mode == "" || survey_mode == null || survey_mode == undefined) {
                            survey_mode = "offline";
                        }

                        let chart_click_json = [];
                        chart_click_json.push({
                            'flow_name': myArray[0].flow_name,
                            'flow_id': myArray[0].flow_id,
                            'type': myArray[0].type,
                            'role_id': myArray[0].rollid
                        });
                        chart_click_json = encodeURIComponent(JSON.stringify(chart_click_json));

                        if (module_layout == "cardview") {
                            //card layout

                            $("#div_page_content").addClass("cardview_bkcolor");

                            if (module_count % 2 == 0) {
                                if (module_count == 0) {
                                    tbl_str += '<tr>';
                                }
                                else {
                                    tbl_str += '</tr><tr>';
                                }
                            }

                            var t_color_name = JSON.parse(storage.getItem('viewsite_btn_color'));
                            //var light_color = t_color_name.replace(')', ', 0.50)').replace('rgb', 'rgba');

                            //tbl_str += '<td onclick=' + param + ' style="width: 50%;"><div class="card_td col" style="background:linear-gradient(90deg,' + light_color + ',' + t_color_name + ')">';
                            //tbl_str += '<img src="images/multicircle.svg" class="cloud-absolute">';

                            tbl_str += '<td onclick=' + param + ' style="width: 50%;"><div class="card_td col">';
                            var cloud_str = localStorage.getItem("cloud_str");
                            tbl_str += cloud_str;

                            var udf_count_array = localStorage.getItem('udf_count_array');

                            for (var c = 0; c < counter_1.length; c++) {
                                var counter = counter_1[c].counter;
                                if (counter == "true") {
                                    break;
                                }
                            }

                            if (counter == 'true') {
                                if (survey_mode != 'online') {
                                    for (var k = 0; k < value_counter.length; k++) {
                                        var id_temp = value_counter[k].id;
                                        if (id_count == id_temp) {
                                            var count = value_counter[k].count;
                                            break;
                                        }
                                    }
                                    tbl_str += '<span class="offline_counter badge mkbadge button button-fill" style="position: absolute; top: 10px; right: 4px; font-size:12px; width: 28px !important; height: 28px!important; line-height: 28px!important; color: white">' + count + '</span>';
                                    tbl_str += '<span class="offline_loader" style="position: absolute;top: 10px;right: 10px;display:none;"><img src="images/ajax-loader.gif" style="width:20px; height:20px"></span>';
                                }
                                else {
                                    if (myArray[0].type == 'Flow') {
                                        if (udf_count_array == '' || udf_count_array == null || udf_count_array == undefined) {
                                            var count = '';
                                        }
                                        else {
                                            udf_count_array = JSON.parse(udf_count_array);
                                            if (udf_count_array.length > 0) {
                                                var count = udf_count_array[id_count];
                                            }
                                            else {
                                                var count = '<img src="images/ajax-loader.gif" style="width:20px; height:20px">';
                                            }
                                        }
                                        tbl_str += '<span id="circle_' + id_count + '" class="badge mkbadge button button-fill" style="position: absolute; top: 10px; right: 4px; font-size:12px; width: 28px !important; height: 28px!important; line-height: 28px!important">' + count + '</span>';
                                    }
                                }
                            }

                            tbl_str += "<input type='hidden' id='hdn_" + myArray[0].id + "' value=\"" + encodeURIComponent(myArray[0].data) + "\">";

                            var icon_base64 = counter_1[0].icon_base64;
                            if (icon_base64 == '' || icon_base64 == null || icon_base64 == undefined) {
                                icon_base64 = "sitemap";
                            }

                            if (icon_base64.indexOf("data:image") > -1) {
                                //--base64 icon                              
                                tbl_str += '<img src="' + icon_base64 + '" style="width: 30px; height: 30px;display: block; word-break: break-all; margin-top: 5px; margin-bottom: 10px;">';
                            }
                            else {
                                //--FA icon
                                tbl_str += '<i class="fa fa-' + icon_base64 + ' cls_task_ico" style="font-size: 26px; display: block;margin-bottom: 15px"></i>';
                            }

                            if (sorted_myArray.length == 1) {
                                tbl_str += '<span class="mdl-name" style="font-size: 14px;font-weight: bold;display: block; width: 300px; overflow: auto; white-space: nowrap">' + myArray[0].flow_name + '</span></div></td>';
                            }
                            else {
                                tbl_str += '<span class="mdl-name" style="font-size: 14px;font-weight: bold;display: block; width: 145px; overflow: auto; white-space: nowrap">' + myArray[0].flow_name + '</span></div></td>';
                            }

                        }
                        else {
                            //list view

                            $("#div_page_content").removeClass("cardview_bkcolor");

                            var icon_base64 = counter_1[0].icon_base64;
                            if (icon_base64 == '' || icon_base64 == null || icon_base64 == undefined) {
                                icon_base64 = "sitemap";
                            }

                            let short_udf_name = '';
                            let udf_title = counter_1[0].udf_title;
                            let udf_name = myArray[0].flow_name;
                            if (udf_title == "" || udf_title == null || udf_title == undefined) {
                                let split_udf_name = udf_name.split(' ');
                                if (split_udf_name.length == 1) {
                                    short_udf_name = split_udf_name[0];
                                }
                                else {
                                    for (let s = 0; s < split_udf_name.length; s++) {
                                        if (split_udf_name[s].charAt(0) == '(') {
                                            short_udf_name += split_udf_name[s].charAt(1);
                                        }
                                        else {
                                            short_udf_name += split_udf_name[s].charAt(0);
                                        }
                                    }
                                }
                            }
                            else {
                                short_udf_name = udf_title;
                            }

                            if (icon_base64.indexOf("data:image") > -1) {
                                //--base64 icon                              
                                var list_item = '<li class="cls_task_ico" onclick=' + param + ' style="background-color:' + light_theme_color + '" udf_id="' + myArray[0].id + '" udf_name="' + udf_name + '" chart_click_json="' + chart_click_json + '"><a class="item-link item-content" style="padding-left:7px"><div class="item-media"><img src="' + icon_base64 + '"></div><div class="item-inner"><div class="item-title-row"><div class="item-title">' + short_udf_name + '</div>';
                            }
                            else {
                                //--FA icon
                                var list_item = '<li class="cls_task_ico" onclick=' + param + ' style="background-color:' + light_theme_color + '" udf_id="' + myArray[0].id + '" udf_name="' + udf_name + '" chart_click_json="' + chart_click_json + '"><a class="item-link item-content"><div class="item-media"><i class="fa fa-' + icon_base64 + ' cls_task_ico"></i></div><div class="item-inner"><div class="item-title-row"><div class="item-title">' + short_udf_name + '</div>';
                            }
                            list_item += '<div class="item-after">';

                            var udf_count_array = localStorage.getItem('udf_count_array');

                            for (var c = 0; c < counter_1.length; c++) {
                                var counter = counter_1[c].counter;
                                if (counter == "true") {
                                    break;
                                }
                            }

                            if (counter == 'true') {
                                if (survey_mode != 'online') {
                                    for (var k = 0; k < value_counter.length; k++) {
                                        var id_temp = value_counter[k].id;
                                        if (id_count == id_temp) {
                                            var count = value_counter[k].count;
                                            break;
                                        }
                                    }

                                    // put counter badge
                                    //list_item += '<span class="mkbadge button button-fill offline_counter">' + count + '</span><span class="offline_loader" style="display:none;"><img src="images/ajax-loader.gif" style="width:28px; height:28px"></span>';
                                    list_item += '<span class="mkbadge button button-fill offline_counter cls_task_ico">' + count + '</span>';
                                }
                                else {
                                    if (myArray[0].type == 'Flow') {
                                        if (udf_count_array == '' || udf_count_array == null || udf_count_array == undefined) {
                                            var count = '';
                                        }
                                        else {
                                            udf_count_array = JSON.parse(udf_count_array);
                                            var count = udf_count_array[id_count];
                                        }
                                    }

                                    // put counter badge
                                    //var counter_bgcolor = $('.navbar').css('background-color');
                                    var counter_bgcolor = "red";
                                    if (udf_count_array.length > 0) {
                                        list_item += '<span id="circle_' + id_count + '" class="mkbadge button button-fill" style="background-color: ' + counter_bgcolor + '">' + count + '</span>';
                                    }
                                    else {
                                        list_item += '<span id="circle_' + id_count + '" class="mkbadge button"><img src="images/ajax-loader.gif" style="width:28px; height:28px"></span>';
                                    }
                                }

                            }

                            var udf_subtitle = counter_1[0].udf_subtitle;
                            if (udf_subtitle == "" || udf_subtitle == null || udf_subtitle == undefined) {
                                udf_subtitle = udf_name;

                                if (user_language != 'en') {
                                    let language = myArray[0].language;
                                    if (language == "" || language == null || language == undefined || language == "null" || language == "Unknown") { }
                                    else {
                                        language = itemObj._checkStrObj(language);
                                        language = language[0];

                                        if (isEmpty(language)) { }
                                        else {
                                            udf_subtitle = language[user_language];
                                        }
                                    }
                                }
                            }

                            list_item += '</div></div></div><div class="item-text">' + udf_subtitle + '</div></a>';
                            //list_item += '<input type="hidden" id="hdn_' + myArray[0].id + '" value=\'' + myArray[0].data + '\'>';
                            list_item += "<input type='hidden' id='hdn_" + myArray[0].id + "' value=\"" + encodeURIComponent(myArray[0].data) + "\">";
                            list_item += '</li>';
                            $("#module_list").append(list_item);
                        }
                        module_count++;
                    }
                }
                tbl_str += '</tr>';
                $("#card_module_list").append(tbl_str);


                // user listing module 06042022
                var user_list_feature = localStorage.getItem("user_list_feature_id");
                if (user_list_feature == "" || user_list_feature == null || user_list_feature == undefined || user_list_feature == "0") { }
                else {
                    add_user_module_to_list();
                }
                ///////////


                if (module_count % 2 != 0) {
                    //if single last td then add colspan 
                    $("#card_module_list td").last().attr('colspan', '2');
                }
            }
            else {
                var list_item = '<li><input type="button" value="No Module Found !"class="theme_Selection_count"  style="min-width:150px; margin:5px; padding:5px 10px; font-size:13pt; border-radius:5px; box-shadow:3px 3px 3px black"></li>';
                $("#module_list").append(list_item);
            }

            compare_time_for_user_notification();
            //compare_time_for_online_count();
            get_today_attendance_for_notification();
        }

        localStorage.setItem('last_modulelist_count', module_count);

        //var flow_Array = JSON.parse(storage.getItem('flow_Array'));
        //var id_Array = JSON.parse(storage.getItem('id_Array'));
        //var cust_flow_Array = JSON.parse(storage.getItem('cust_flow_Array'));
        //if (id_Array.length > 0 || flow_Array.length > 0 || cust_flow_Array.length > 0) {
        //    enable_back_button();
        //}
        //else {
        //    disable_back_button();
        //}

        enable_back_button();

        $('.mdl-name').each(function (i, obj) {
            if (obj.offsetWidth < obj.scrollWidth) {
                var innerHTML = $(obj).html();
                $(obj).html('<marquee scrollamount="3">' + innerHTML + '</marquee>');
            }
        });

        //if (myArray1.length == 1 && curr_btn_mode == 'back' && myArray1[0].level_position > 0) {
        //    enable_back_button();
        //}

        loading_hide();
    } catch (e) {
        alert1(e + '_SuccessCallBack_get_modules()');
    }
}

function compare_time_for_online_count() {
    var online_counter = localStorage.getItem('online_counter');
    if (online_counter == 'false' || online_counter == '' || online_counter == null || online_counter == undefined) {
        get_counter_for_online_flow();
    }
    else {
        var counter_session_ms = localStorage.getItem('counter_session_ms');
        if (counter_session_ms == '' || counter_session_ms == null || counter_session_ms == undefined) { }
        else {
            var time = new Date();
            var curr_time = time.getTime();
            var time_diff = curr_time - counter_session_ms;

            // 15 minutes
            if (time_diff > 900000) {
                localStorage.setItem('online_counter', 'false');
                get_counter_for_online_flow();
            }
        }
    }
}



// module click
function redirect_on_module_click(flow_name, id, flow_id, type, role_id, flag_direction, tab_index) {
    try {
        loading();

        if (button_clicked != 1) {
            button_clicked = 1;
            setTimeout(function () {
                button_clicked = 0;
            }, 2000);

            if (flag_direction == 'redirect_on_chart') { }
            else {
                storage.setItem('av', JSON.stringify(''));
            }

            //store role_id for multi-role
            var login_company_feature_id = localStorage.getItem('login_company_feature_id');
            localStorage.setItem('company_feature_id', login_company_feature_id);
            storage.setItem('role_id', JSON.stringify(role_id));

            //storage.setItem('tab_index', JSON.stringify(0));

            //to skip single subflow checksheet
            var curr_btn_mode = JSON.parse(storage.getItem('curr_btn_mode'));
            if (curr_btn_mode == "subflow") {
                storage.setItem('curr_btn_mode', JSON.stringify('back'));
            }
            else {
                storage.setItem('curr_btn_mode', JSON.stringify(''));
            }

            storage.setItem('survey_type', JSON.stringify(''));

            if (form_flag == 14) {
                var data_count = get_udf_data_for_subflow(id);
            }
            else {
                var data_count = $("#hdn_" + id + "").val();
                data_count = decodeURIComponent(data_count);
                storage.setItem('type37_main_column_array', JSON.stringify(''));
            }

            storage.setItem('wayflow', JSON.stringify(flow_id));
            storage.setItem('wayflow_name', JSON.stringify(flow_name));
            storage.setItem('udf_id', JSON.stringify(id));
            var level_Array = JSON.parse(storage.getItem('level_Array'));    // for module leveling items
            if (level_Array == '' || level_Array == null || level_Array == undefined) {
                var level_Array = [];
            }

            var list_data = JSON.parse(data_count);
            var module_bottom_image = list_data[0].module_bottom_image;
            localStorage.setItem('module_bottom_image', module_bottom_image);
            level_Array.push({ 'last_flow_name': flow_name, 'module_bottom_image': module_bottom_image });
            storage.setItem('level_Array', JSON.stringify(level_Array));

            if (type == 'Module') {
                var id_Array = JSON.parse(storage.getItem('id_Array'));
                if (id_Array == '' || id_Array == undefined || id_Array == null) {
                    var id_Array = [];
                }
                id_Array.push(id);

                storage.setItem('id_Array', JSON.stringify(id_Array));
                storage.setItem('tab_index', JSON.stringify(0));
                //get_list_of_modules();
                get_data_from_ufm();
            } else if (type == 'Flow' || type == 'MultiFlow') {
                storage.setItem('list_json_Array', JSON.stringify(data_count));

                ////// new site wise module listing 13/12/2018
                var list_data = JSON.parse(data_count);
                var redirect = list_data[0].redirect;
                if (redirect == 'customer') {

                    var cust_flow_Array = [];
                    cust_flow_Array.push({
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
                    storage.setItem('cust_flow_Array', JSON.stringify(cust_flow_Array));
                }

                if (type == 'MultiFlow') {
                    //storage.setItem('flow_Array', JSON.stringify(''));
                    //localStorage.setItem('is_subflow', 'false');
                }
                /////////////////

                var flow_Array = JSON.parse(storage.getItem('flow_Array'));
                if (flow_Array == '' || flow_Array == null || flow_Array == undefined) {
                    var flow_Array = [];
                }
                else {
                    // make array length 1 to handle multi sub push ATC
                    //flow_Array.splice(1);                                                                     //commented for 3 layer task structure issue (jasmin.eng1) [FT-15052025]
                }

                if (flow_Array.length > 0) {
                    var tab_index = JSON.parse(storage.getItem('tab_index'));
                    flow_Array[flow_Array.length - 1]['tab_index'] = tab_index;
                }

                if (tab_index == '' || tab_index == null || tab_index == undefined) {
                    storage.setItem('tab_index', JSON.stringify(0));
                }
                else {
                    storage.setItem('tab_index', JSON.stringify(tab_index));
                }

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

                if (flow_Array.length == 1) {
                    localStorage.setItem("p_udf_id", id);
                }

                // getting issue in normal submit after submit from shortcut button checksheet 29062023
                localStorage.setItem('is_shortcutbutton', 'false');

                get_checksheet_id_for_task(flow_id);
            } else {
                // GROUP
                var tid = JSON.parse(storage.getItem('tid'));
                var siteid = JSON.parse(storage.getItem('siteid'));
                var start_status = JSON.parse(storage.getItem('start_status'));
                var end_status = JSON.parse(storage.getItem('end_status'));
                var flow_Array = JSON.parse(storage.getItem('flow_Array'));
                if (flow_Array == '' || flow_Array == null || flow_Array == undefined) {
                    var flow_Array = [];
                }

                if (flow_Array.length != 0) {
                    var tab_index = JSON.parse(storage.getItem('tab_index'));
                    flow_Array[flow_Array.length - 1]['tab_index'] = tab_index;
                }

                var data_count = flow_Array[flow_Array.length - 1].list_json;
                flow_Array.push({
                    'id': id,
                    'wayflow': flow_id,
                    'wayflow_name': flow_name,
                    'type': type,
                    'tid': tid,
                    'siteid': siteid,
                    'start_status': start_status,
                    'end_status': end_status,
                    'checklist': '',
                    'list_json': data_count
                });

                if (flow_Array.length != 0) {
                    var tab_index = JSON.parse(storage.getItem('tab_index'));
                    flow_Array[flow_Array.length - 1]['tab_index'] = tab_index;
                }

                storage.setItem('list_json_Array', JSON.stringify(data_count));
                storage.setItem('flow_Array', JSON.stringify(flow_Array));
                get_checksheet_id_for_task(flow_id);
            }
        }
    } catch (e) {
        alert1(e + '_redirect_on_module_click()');
        loading_hide();
    }
}

// plugin click
function redirect_on_plugin_click() {
    var q_jsonobj = [];
    cordova.exec(onsuccess_redirect_on_plugin_click, onfail_redirect_on_plugin_click, 'submitAnIdeaPlugin', 'anAction', q_jsonobj);
}

function onsuccess_redirect_on_plugin_click(e) { }

function onfail_redirect_on_plugin_click(e) { }

// chart click
function redirect_on_chart_click(t_company_feature_id, t_checksheet_id, t_support_details, t_chart_collapse, t_chart_circle_name, t_chart_id) {
    localStorage.setItem('company_feature_id', t_company_feature_id);
    localStorage.setItem('chart_checksheet_id', t_checksheet_id);
    localStorage.setItem('chart_support_details', t_support_details);
    localStorage.setItem('chart_collapse', t_chart_collapse);
    localStorage.setItem('chart_circle_name', t_chart_circle_name);
    localStorage.setItem('chart_id', t_chart_id);
    changeurl("feature_chart.html");
}

function redirect_on_custom_report_click(t_company_feature_id) {
    localStorage.setItem('company_feature_id', t_company_feature_id);
    changeurl("EF_Custom_Reports.html");
}

function redirect_on_user_module_click() {
    changeurl("EF_User_List.html");
}

function add_user_module_to_list() {
    var tbl_str = '';
    var last_row_td_count = $("#card_module_list tr:last-child td").length;
    if (last_row_td_count == 0 || last_row_td_count == 2) {
        tbl_str += '<tr>';
    }

    var param = "\"redirect_on_user_module_click()\"";
    tbl_str += '<td onclick=' + param + ' style="width: 50%;"><div class="card_td col">';
    var cloud_str = localStorage.getItem("cloud_str");
    tbl_str += cloud_str;
    tbl_str += '<i class="fa fa-credit-card cls_task_ico" style="font-size: 26px; display: block;margin-bottom: 15px"></i>';
    tbl_str += '<span class="mdl-name" style="font-size: 14px;font-weight: bold;display: block; width: 145px; overflow: auto; white-space: nowrap">User Listing</span></div></td>';

    if (last_row_td_count == 0 || last_row_td_count == 2) {
        tbl_str += '</tr>';
        $("#card_module_list").append(tbl_str);
    }
    else {
        $("#card_module_list tr:last-child").append(tbl_str);
    }

    loading_hide();
}

function get_checksheet_id_for_task(flow_id) {
    var query = "select fm.checksheet_id from flow_master fm where fm.moduleid=" + flow_id + "";
    var q_jsonobj = [];
    q_jsonobj.push({
        data: query,
        p: "1"
    });
    cordova.exec(SuccessCallBack_get_checksheetid_for_createtask, get_checksheetid_for_createtask_FailCallBack, 'SqlitePlugin', 'showValues', q_jsonobj);
}

function SuccessCallBack_get_checksheetid_for_createtask(e) {
    try {
        var myArray = JSON.parse(e);
        if (myArray == '' || myArray == null || myArray == undefined || myArray.length == 0) {
            var flow_Array = JSON.parse(storage.getItem('flow_Array'));
            var flow_id = flow_Array[flow_Array.length - 1].wayflow;
            var flow_flowname = flow_Array[flow_Array.length - 1].wayflow_name;
            //alert1(flow_flowname + " (" + flow_id + ") flow not found in flow master ! ");

            // get flow online 20102021
            get_checksheet_id_for_task_online(flow_id);

        }
        else {
            var checksheet_id = myArray[0].checksheet_id;
            var data_json = JSON.parse(storage.getItem('list_json_Array'));
            var list_data = JSON.parse(data_json);
            var f_list_data = JSON.stringify(list_data[0]);
            storage.setItem('list_json', JSON.stringify("[" + f_list_data + "]"));
            storage.setItem('check_type_task', JSON.stringify(checksheet_id));

            var flow_Array = JSON.parse(storage.getItem('flow_Array'));

            // set task checksheet
            flow_Array[flow_Array.length - 1]['task_checksheetid'] = checksheet_id;
            storage.setItem('flow_Array', JSON.stringify(flow_Array));

            if (flow_Array.length == 1) {
                var redirect = list_data[0].redirect;
                if (redirect == 'customer') {
                    changeurl("viewcustomerlist_on.html");
                } else {
                    changeurl("selection_survey.html");
                }
            } else {
                // sub flow available
                var type = flow_Array[flow_Array.length - 1].type;
                if (type == "Flow" || type == "MultiFlow" || type == "Module") {
                    changeurl("selection_survey.html");
                } else {
                    var tab_index = flow_Array[flow_Array.length - 1].tab_index;
                    var list_json = flow_Array[flow_Array.length - 1].list_json;
                    list_json = JSON.parse(list_json);
                    var f_list_data = JSON.stringify(list_json[tab_index]);
                    storage.setItem('list_json', JSON.stringify("[" + f_list_data + "]"));

                    changeurl("viewsitelist_pm_grouplist.html");
                }
            }
        }
    } catch (e) {
        alert1(e + '_SuccessCallBack_get_checksheetid_for_createtask()');
    }
}



function get_checksheetid_for_createtask_FailCallBack(e) {
    alert1(e + 'get_checksheetid_for_createtask_FailCallBack()');
}

function showValuesFailCallBack(e) {
    alert1(e + '_selection_showValuesFailCallBack()');
    loading_hide();
}
function get_flow_counter_FailCallBack(e) {
    alert1(e + '_get_flow_counter_FailCallBack()');
    loading_hide();
}




// get user notifications
function compare_time_for_user_notification() {
    var last_noti_ms = localStorage.getItem("last_notification_ms");
    if (last_noti_ms == '' || last_noti_ms == null || last_noti_ms == undefined || last_noti_ms == "undefined") {
        last_noti_ms = 0;
    }

    var time = new Date();
    var curr_time = time.getTime();
    var time_diff = curr_time - last_noti_ms;

    // 15 minutes
    if (time_diff > 900000) {
        var new_notification = localStorage.getItem('new_notification');
        if (new_notification == "true") {
            // notification popup may not be opened
            $(".notification-badge").css("opacity", "1");
        }
        else {
            // notification popup opened
            check_for_new_user_notifications();
        }
    }
    else {
        var new_notification = localStorage.getItem('new_notification');
        if (new_notification == "true") {
            $(".notification-badge").css("opacity", "1");
        }
        else {
            $(".notification-badge").css("opacity", "0");
        }
    }
}


function check_for_new_user_notifications() {
    var last_noti_ms = localStorage.getItem("last_notification_ms");
    if (last_noti_ms == '' || last_noti_ms == null || last_noti_ms == undefined || last_noti_ms == "undefined") {
        last_noti_ms = 0;
    }

    var param_obj = [];
    param_obj.push({
        "milisecond": last_noti_ms
    });

    loading();
    var getdata = new Webservicecall_REST(global_wcf_url + 'NotificationApiCheck', JSON.stringify(param_obj), onsuccess_check_for_new_user_notifications, onfail);
    getdata.callOtherDomain();
}
function onsuccess_check_for_new_user_notifications(e) {
    try {
        var responseText = e.responseText;
        var myArray = JSON.parse(responseText);
        var status = myArray[0].status;
        if (status == 1) {
            var data = myArray[0].data;
            $(".notification-badge").css("opacity", "1");
            localStorage.setItem('new_notification', 'true');
        }
        else if (status == 2) {
            $(".notification-badge").css("opacity", "0");
            localStorage.setItem('new_notification', 'false');
        }
        else {
            var message = myArray[0].message;
            alert1(message);
        }
        loading_hide();
    }
    catch (e) {
        alert1(e + '_onsuccess_check_for_new_user_notifications()');
    }
}

//function get_user_notifications() {
//    myApp.popup('.popup-notifications');

//    var user_id = JSON.parse(storage.getItem('user_id'));
//    //var len = $(".popup-notifications ul li").length;

//    var param_obj = [];
//    param_obj.push({
//        "user_id": user_id,
//        'offset': limit_range - default_range,
//        'fetch': increment_range
//    });

//    loading();
//    var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_GetAlaramNotification', JSON.stringify(param_obj), onsuccess_get_user_notifications, onfail);
//    getdata.callOtherDomain();
//}
//function onsuccess_get_user_notifications(e) {
//    try {
//        var responseText = e.responseText;
//        var myArray = JSON.parse(responseText);

//        localStorage.setItem('new_notification', 'false');
//        $(".notification-badge").css("opacity", "0");
//        $("#div_notification_container").empty();

//        var status = myArray[0].status;
//        if (status == 1) {
//            var data = myArray[0].data;
//            var message = JSON.parse(data);

//            var last_eve_time = message[0].EventTime;
//            var d = new Date(last_eve_time);
//            var ms = d.getTime();
//            localStorage.setItem("last_notification_ms", ms);

//            $(".no_record_found").remove();

//            for (var i = 0; i < message.length; i++) {
//                var msg = message[i].Message;
//                msg = msg.replace(/\r\n/g, "<br/>");
//                var time = message[i].EventTime;

//                //var str = '<li><a href="#" class="item-link item-content"><div class="item-inner">';
//                //str += '<div class="item-subtitle">' + msg + '</div>';
//                //str += '<div class="item-text">' + time + '</div>';
//                //str += '</div></a></li>';
//                //$(".popup-notifications ul").append(str);


//                var str = '<div class="card">';
//                str += '<div class="card-content card-content-padding">' + msg + '</div>';
//                str += '<div class="card-footer">' + time + '</div>';
//                str += '</div>';

//                $("#div_notification_container").append(str);
//                //div.insertAdjacentHTML('beforeend', str);
//            }
//        }
//        else if (status == 2) {
//            //var len = $(".popup-notifications ul li").length;
//            //if (len == 0) {
//            //    var str = '<li style="text-align:center" class="no_record_found"><a href="#" class="item-link item-content"><div class="item-inner">';
//            //    str += '<div class="item-text">No Record Found</div>';
//            //    str += '</div></a></li>';
//            //$(".popup-notifications ul").append(str);

//            var str = '<div class="card">';
//            str += '<div class="card-content card-content-padding">No Record Found</div>';
//            //str += '<div class="card-footer"></div>';
//            str += '</div>';
//            $("#div_notification_container").append(str);
//            //}
//        }
//        else {
//            var message = myArray[0].message;
//            alert1(message);
//        }
//        loading_hide();
//    }
//    catch (e) {
//        alert1(e + '_onsuccess_get_user_notifications()');
//    }
//}


function get_user_notifications() {
    myApp.popup('.popup-notifications');

    var user_id = JSON.parse(storage.getItem('user_id'));
    //var len = $(".popup-notifications ul li").length;

    var param_obj = [];
    param_obj.push({
        "user_id": user_id,
        'offset': limit_range - default_range,
        'fetch': increment_range
    });

    loading();
    var getdata = new Webservicecall_REST(global_wcf_url + 'Get_NotificationList_For_User', JSON.stringify(param_obj), onsuccess_get_user_notifications, onfail);
    getdata.callOtherDomain();
}
function onsuccess_get_user_notifications(e) {
    try {
        var responseText = e.responseText;
        var myArray = JSON.parse(responseText);

        localStorage.setItem('new_notification', 'false');
        $(".notification-badge").css("opacity", "0");

        var t_offset = limit_range - default_range;
        if (t_offset == 0) {
            $("#div_notification_container").empty();
        }
       
        var status = myArray[0].status;
        if (status == 1) {
            var data = myArray[0].data;
            var message = JSON.parse(data);

            $(".no_record_found").remove();

            for (var i = 0; i < message.length; i++) {
                var msg = message[i].Message_ || "";
                msg = msg.replace(/\r\n/g, "<br/>");
                var task_id = message[i].task_id || "";

                var title = message[i].title || message[i].Title || (task_id ? "Task " + task_id : "Notification");
                var time = message[i].EventTime || message[i].time || message[i].Time || "";
                
                // Format the time slightly if it looks like a raw datetime string
                if (time.length > 10 && !time.includes("AM") && !time.includes("PM")) {
                    try {
                        var d = new Date(time);
                        if (!isNaN(d.getTime())) {
                            time = d.toLocaleDateString() + " " + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                        }
                    } catch(e) {}
                }

                var isRead = message[i].is_read == 1 || message[i].status == "read" || message[i].status == 1;
                var readClass = isRead ? "read" : "unread";
                
                // Determine icon and color based on title/message content to match mockup variety
                var iconClass = "fa-solid fa-bell";
                var iconBgClass = "icon-grey";
                var contentLower = (title + " " + msg).toLowerCase();
                
                if (contentLower.includes("permit")) { iconClass = "fa-regular fa-clipboard"; iconBgClass = "icon-blue"; }
                else if (contentLower.includes("task") || contentLower.includes("assign")) { iconClass = "fa-solid fa-clipboard-list"; iconBgClass = "icon-green"; }
                else if (contentLower.includes("alert") || contentLower.includes("warn") || contentLower.includes("safety")) { iconClass = "fa-solid fa-triangle-exclamation"; iconBgClass = "icon-orange"; }
                else if (contentLower.includes("report")) { iconClass = "fa-regular fa-file-lines"; iconBgClass = "icon-purple"; }
                else if (contentLower.includes("sync") || contentLower.includes("upload")) { iconClass = "fa-solid fa-cloud-arrow-up"; iconBgClass = "icon-teal"; }
                else { iconClass = "fa-solid fa-circle-info"; iconBgClass = "icon-grey"; }

                var str = '<div class="notification-card ' + readClass + '" onclick="close_notification_popup(this)">';
                str += '  <div class="notification-indicator"></div>';
                str += '  <div class="notification-icon ' + iconBgClass + '"><i class="' + iconClass + '"></i></div>';
                str += '  <div class="notification-content">';
                str += '    <div class="notification-header">';
                str += '      <div class="notification-title">' + title + '</div>';
                str += '      <div class="notification-time">' + time + '</div>';
                str += '    </div>';
                str += '    <div class="notification-message">' + msg + '</div>';
                str += '  </div>';
                str += '  <div class="notification-chevron"><i class="fa-solid fa-chevron-right"></i></div>';
                str += '</div>';

                $("#div_notification_container").append(str);
            }
        }
        else if (status == 2) {
            if (t_offset != 0) {
                $("#div_notification_container").unbind('scroll');
            }
            else {
                var str = '<div class="notification-empty-state">';
                str += '<i class="fa-regular fa-bell"></i>';
                str += '<div class="title">No notifications yet</div>';
                str += '<div class="subtitle">You\'re all caught up!</div>';
                str += '</div>';
                $("#div_notification_container").append(str);
            }           
        }
        else {
            var message = myArray[0].message;
            alert1(message);
        }
        loading_hide();
    }
    catch (e) {
        alert1(e + '_onsuccess_get_user_notifications()');
    }
}

function numFormatter(num) {
    if (num > 999 && num < 1000000) {
        return (num / 1000).toFixed(1) + 'K'; // convert to K for number from > 1000 < 1 million 
    } else if (num > 1000000) {
        return (num / 1000000).toFixed(1) + 'M'; // convert to M for number from > 1 million 
    } else if (num < 900) {
        return num; // if value < 1000, nothing to do
    }
}









// online module listing 19102021

function check_table_availabililty() {

    // get fresh count on refresh button click 01122022
    localStorage.setItem('online_counter', 'false');

    var download_completed = localStorage.getItem('download_completed');
    if (download_completed == '1') {
        get_download_counter_selection();
    }
    else {
        update_status_in_download_table_selection();
    }
}

function update_status_in_download_table_selection() {
    try {
        var query = "UPDATE download_counter SET status = '0', counter = case when _id = 5 then 0 else counter end";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            q: "3", // check for GPS on/off and return flag (start download) 
            tid: "0"
        });
        cordova.exec(onsuccess_update_status_in_download_table_selection, onfail, 'SqlitePlugin', 'insertValuse', q_jsonobj);
    } catch (e) {
        alert1(e + '_update_status_in_download_table()');
    }
}

function onsuccess_update_status_in_download_table_selection(e) {
    try {
        localStorage.setItem('download_completed', '1');

        get_download_counter_selection();
    } catch (e) {
        alert1(e + '_onsuccess_update_status_in_download_table()');
    }
}

function get_download_counter_selection() {
    var query = "select counter_name, status, counter, total_count, globalcounter from download_counter";
    var q_jsonobj = [];
    q_jsonobj.push({
        data: query,
        p: "1"
    });
    cordova.exec(onsuccess_get_download_counter_selection, onfail, 'SqlitePlugin', 'showValues', q_jsonobj);
}

function onsuccess_get_download_counter_selection(e) {
    try {
        var myArray = JSON.parse(e);
        var status = 2;

        var s1 = parseInt(myArray[0].status);
        var s2 = parseInt(myArray[1].status);
        var s3 = parseInt(myArray[2].status);
        var s4 = parseInt(myArray[3].status);
        if (s1 == 0 || s2 == 0 || s3 == 0 || s4 == 0) {
            status = 0;
        }

        if (status == 2) {
            // alert1("download complete !");
            check_for_notification();
        } else {
            // alert1("download not complete !");
            get_list_of_modules_online();
        }

    } catch (e) {
        alert1(e + '_onsuccess_get_download_counter_selection()');
    }
}


function get_list_of_modules_online() {
    try {
        loading();

        var id_Array = JSON.parse(storage.getItem('id_Array'));
        var module_count = 0;
        var module_layout = localStorage.getItem('module_layout');
        // ---- Home module-list cache: paint instantly on return from LMS, refresh in background ----
        var _home_container = (module_layout == "cardview") ? "#card_module_list" : "#module_list";
        var _home_idArr0 = JSON.parse(storage.getItem('id_Array'));
        var _home_isTop = (_home_idArr0 == '' || _home_idArr0 == null || _home_idArr0 == undefined || (_home_idArr0.length || 0) === 0);
        var _home_cacheKey = 'home_modules_' + module_layout + '_' + JSON.parse(storage.getItem('company_id')) + '_' + storage.getItem('user_id');
        var _home_cached = _home_isTop ? localStorage.getItem(_home_cacheKey) : null;
        if (_home_cached) {
            // show cached list immediately; keep it visible while the fetch refreshes it silently (no blank, no spinner)
            $(_home_container).html(_home_cached).show();
            try { loading_hide(); } catch (e) { }
        }
        else {
            $(_home_container).empty().show();
        }

        $("#tab1").css("height", "auto");

        var id_Array = JSON.parse(storage.getItem('id_Array'));
        var company_id = JSON.parse(storage.getItem("company_id"));
        var user_id = storage.getItem("user_id");

        if (id_Array == '' || id_Array == undefined || id_Array == null) {

            // site wise module listing change 13/12/2018
            var cust_flow_Array = JSON.parse(storage.getItem('cust_flow_Array'));
            if (cust_flow_Array == '' || cust_flow_Array == null || cust_flow_Array == undefined) {
                cust_flow_Array = [];
            }
            if (cust_flow_Array.length > 0) {
                var id = cust_flow_Array[0].id;
                var flow_id = cust_flow_Array[0].wayflow;
                var flow_name = cust_flow_Array[0].wayflow_name;
                localStorage.setItem('wayflow', flow_id);
                localStorage.setItem('wayflow_name', flow_name);
                localStorage.setItem('udf_id', id);
            }
            else {
                var id = 0;
            }

            var param_obj = [];
            param_obj.push({
                'Company_Id': company_id,
                'User_Id': user_id,
                'p_id': id
            });

        } else {
            $("#div_level").show();
            var level_Array = JSON.parse(storage.getItem('level_Array'));
            if (level_Array.length > 0) {
                var last_flow_name = level_Array[level_Array.length - 1].last_flow_name;
                $("#lbl_last_flow").text(last_flow_name);
            }

            var param_obj = [];
            param_obj.push({
                'Company_Id': company_id,
                'User_Id': user_id,
                'p_id': id_Array[id_Array.length - 1]
            });
        }

        var common_global_wcf_url = JSON.parse(storage.getItem('common_global_wcf_url'));
        var getdata = new Webservicecall_REST(common_global_wcf_url + 'WCF_UserDefineFlowMaster_With_MultiRole_Port', JSON.stringify(param_obj), function (e) {

            try {
                var responseText = JSON.parse(e.responseText);
                var status = responseText[0].status;
                if (status == 1) {
                    loading_hide();

                    var myArray1 = JSON.parse(responseText[0].data);
                    var curr_btn_mode = JSON.parse(storage.getItem('curr_btn_mode'));

                    if (myArray1.length == 1 && curr_btn_mode != 'back' && featured_options_display == 0) {
                        //to skip single module list
                        var data_array = JSON.parse(myArray1[0].data);
                        var access_type = data_array[0].access_type;
                        if (access_type == '' || access_type == null || access_type == undefined || access_type == "mobile" || access_type == "both") {
                            button_clicked = 0;
                            $("#module_list").append("<li><input type='hidden' id='hdn_" + myArray1[0].id + "' value=\"" + encodeURIComponent(myArray1[0].data) + "\"></li>");
                            redirect_on_module_click(myArray1[0].flow_name1, myArray1[0].id, myArray1[0].flow_id, myArray1[0].type, myArray1[0].role_id);
                        }
                    }
                    else {
                        // clear the cached/old list, then rebuild synchronously below (no visible blank)
                        $(_home_container).empty();
                        // /// sort flow start
                        var newmyArray = [];
                        for (j = 0; j < myArray1.length; j++) {
                            var flow_data = JSON.parse(myArray1[j].data);
                            var position = parseInt(flow_data[0].position);
                            var data = myArray1[j].data;

                            newmyArray.push({
                                'position': position,
                                'data': myArray1[j]
                            })
                        }

                        // sort json array in asc order
                        var sorted_myArray = newmyArray.sort(function (a, b) {
                            var x = a.position < b.position ? -1 : 1;
                            return x;
                        });

                        // Give background color of module list 16122024 PG
                        var t_color_name = JSON.parse(storage.getItem('viewsite_btn_color'));
                        //var light_theme_color = t_color_name.replace(')', ', 0.15)').replace('rgb', 'rgba');

                        // static gray color
                        var light_theme_color = "#ecedef";

                        // /// sort flow end
                        var tbl_str = "";
                        var pm_flow_count = 0;
                        for (var i = 0; i < sorted_myArray.length; i++) {
                            var myArray = [];
                            myArray.push(sorted_myArray[i].data);
                            var id_count = myArray[0].id;
                            var counter_1 = JSON.parse(myArray[0].data);
                            var access_type = counter_1[0].access_type;
                            if (access_type == '' || access_type == null || access_type == undefined || access_type == "mobile" || access_type == "both") {
                                var data_string = JSON.stringify(myArray[0].data);
                                if (myArray[0].type == 'Flow') {
                                    var param = "\"redirect_on_module_click('" + myArray[0].flow_name1 + "' , " + myArray[0].id + "," + myArray[0].flow_id + ",'" + myArray[0].type + "','" + myArray[0].role_id + "')\"";
                                }
                                else if (myArray[0].type == 'Chart') {
                                    var company_feature_id = counter_1[0].company_feature_id;
                                    var checksheet_id = counter_1[0].checksheet_id;
                                    var support_details = counter_1[0].support;
                                    var chart_collapse = counter_1[0].chart_collapse;
                                    var chart_id = counter_1[0].chart_id;
                                    var param = "\"redirect_on_chart_click('" + company_feature_id + "' , '" + checksheet_id + "', '" + support_details + "', '" + chart_collapse + "', '" + myArray[0].flow_name + "', '" + chart_id + "')\"";
                                }
                                else if (myArray[0].type == 'CustomReports') {
                                    var company_feature_id = counter_1[0].company_feature_id;
                                    var param = "\"redirect_on_custom_report_click('" + company_feature_id + "')\"";
                                }
                                else {
                                    var param = "\"redirect_on_module_click('" + myArray[0].flow_name + "' , " + myArray[0].id + "," + myArray[0].flow_id + ",'" + myArray[0].type + "','" + myArray[0].role_id + "')\"";
                                }

                                var survey_mode = counter_1[0].survey_mode;
                                if (survey_mode == "" || survey_mode == null || survey_mode == undefined) {
                                    survey_mode = "offline";
                                }

                                let chart_click_json = [];
                                chart_click_json.push({
                                    'flow_name': myArray[0].flow_name,
                                    'flow_id': myArray[0].flow_id,
                                    'type': myArray[0].type,
                                    'role_id': myArray[0].role_id
                                });
                                chart_click_json = encodeURIComponent(JSON.stringify(chart_click_json));

                                if (module_layout == "cardview") {
                                    //card layout

                                    $("#div_page_content").addClass("cardview_bkcolor");

                                    if (module_count % 2 == 0) {
                                        if (module_count == 0) {
                                            tbl_str += '<tr>';
                                        }
                                        else {
                                            tbl_str += '</tr><tr>';
                                        }
                                    }

                                    tbl_str += '<td onclick=' + param + ' style="width: 50%;"><div class="card_td col">';
                                    var cloud_str = localStorage.getItem("cloud_str");
                                    tbl_str += cloud_str;

                                    var udf_count_array = localStorage.getItem('udf_count_array');

                                    for (var c = 0; c < counter_1.length; c++) {
                                        var counter = counter_1[c].counter;
                                        if (counter == "true") {
                                            break;
                                        }
                                    }

                                    if (counter == 'true') {
                                        if (survey_mode != 'online') {
                                            for (var k = 0; k < value_counter.length; k++) {
                                                var id_temp = value_counter[k].id;
                                                if (id_count == id_temp) {
                                                    var count = value_counter[k].count;
                                                    break;
                                                }
                                            }

                                            if (count == "" || count == null || count == undefined) {
                                                count = "";
                                            }
                                            tbl_str += '<span class="offline_counter badge mkbadge button button-fill" style="position: absolute; top: 10px; right: 4px; font-size:12px; width: 28px !important; height: 28px!important; line-height: 28px!important; color: white">' + count + '</span>';
                                            tbl_str += '<span class="offline_loader" style="position: absolute;top: 10px;right: 10px;display:none;"><img src="images/ajax-loader.gif" style="width:20px; height:20px"></span>';
                                        }
                                        else {
                                            if (myArray[0].type == 'Flow') {
                                                if (udf_count_array == '' || udf_count_array == null || udf_count_array == undefined) {
                                                    var count = '';
                                                }
                                                else {
                                                    udf_count_array = JSON.parse(udf_count_array);
                                                    if (udf_count_array.length > 0) {
                                                        var count = udf_count_array[id_count];
                                                    }
                                                    else {
                                                        var count = '<img src="images/ajax-loader.gif" style="width:20px; height:20px">';
                                                    }
                                                }

                                                tbl_str += '<span id="circle_' + id_count + '" class="badge mkbadge button button-fill" style="position: absolute; top: 10px; right: 4px; font-size:12px; width: 28px !important; height: 28px!important; line-height: 28px!important">' + count + '</span>';
                                            }
                                        }
                                    }

                                    tbl_str += "<input type='hidden' id='hdn_" + myArray[0].id + "' value=\"" + encodeURIComponent(myArray[0].data) + "\">";

                                    var icon_base64 = counter_1[0].icon_base64;
                                    if (icon_base64 == '' || icon_base64 == null || icon_base64 == undefined) {
                                        icon_base64 = "sitemap";
                                    }

                                    if (icon_base64.indexOf("data:image") > -1) {
                                        //--base64 icon                              
                                        tbl_str += '<img src="' + icon_base64 + '" style="width: 30px; height: 30px;display: block; word-break: break-all; margin-top: 5px; margin-bottom: 10px;">';
                                    }
                                    else {
                                        //--FA icon
                                        tbl_str += '<i class="fa fa-' + icon_base64 + ' cls_task_ico" style="font-size: 26px; display: block;margin-bottom: 15px;"></i>';
                                    }

                                    if (sorted_myArray.length == 1) {
                                        tbl_str += '<span class="mdl-name" style="font-size: 14px;font-weight: bold;display: block; width: 300px; overflow: auto; white-space: nowrap">' + myArray[0].flow_name + '</span></div></td>';
                                    }
                                    else {
                                        tbl_str += '<span class="mdl-name" style="font-size: 14px;font-weight: bold;display: block; width: 145px; overflow: auto; white-space: nowrap">' + myArray[0].flow_name + '</span></div></td>';
                                    }
                                }
                                else {
                                    //list view

                                    $("#div_page_content").removeClass("cardview_bkcolor");

                                    var icon_base64 = counter_1[0].icon_base64;
                                    if (icon_base64 == '' || icon_base64 == null || icon_base64 == undefined) {
                                        icon_base64 = "sitemap";
                                    }

                                    let udf_name = myArray[0].flow_name;
                                    let split_udf_name = udf_name.split(' ');
                                    let short_udf_name = '';
                                    if (split_udf_name.length == 1) {
                                        short_udf_name = split_udf_name[0];
                                    }
                                    else {
                                        for (let s = 0; s < split_udf_name.length; s++) {
                                            if (split_udf_name[s].charAt(0) == '(') {
                                                short_udf_name += split_udf_name[s].charAt(1);
                                            }
                                            else {
                                                short_udf_name += split_udf_name[s].charAt(0);
                                            }
                                        }
                                    }

                                    if (icon_base64.indexOf("data:image") > -1) {
                                        //--base64 icon                              
                                        var list_item = '<li class="cls_task_ico" onclick=' + param + ' style="background-color:' + light_theme_color + '" udf_id="' + myArray[0].id + '" udf_name="' + udf_name + '" chart_click_json="' + chart_click_json + '"><a class="item-link item-content" style="padding-left:7px"><div class="item-media"><img src="' + icon_base64 + '"></div><div class="item-inner"><div class="item-title-row"><div class="item-title">' + short_udf_name + '</div>';
                                    }
                                    else {
                                        //--FA icon
                                        var list_item = '<li class="cls_task_ico" onclick=' + param + ' style="background-color:' + light_theme_color + '" udf_id="' + myArray[0].id + '" udf_name="' + udf_name + '" chart_click_json="' + chart_click_json + '"><a class="item-link item-content"><div class="item-media"><i class="fa fa-' + icon_base64 + ' cls_task_ico"></i></div><div class="item-inner"><div class="item-title-row"><div class="item-title">' + short_udf_name + '</div>';
                                    }
                                    list_item += '<div class="item-after">';

                                    var udf_count_array = localStorage.getItem('udf_count_array');

                                    for (var c = 0; c < counter_1.length; c++) {
                                        var counter = counter_1[c].counter;
                                        if (counter == "true") {
                                            break;
                                        }
                                    }

                                    if (counter == 'true') {
                                        if (survey_mode != 'online') {
                                            for (var k = 0; k < value_counter.length; k++) {
                                                var id_temp = value_counter[k].id;
                                                if (id_count == id_temp) {
                                                    var count = value_counter[k].count;
                                                    break;
                                                }
                                            }

                                            if (count == "" || count == null || count == undefined) {
                                                count = 0;
                                            }

                                            // put counter badge
                                            list_item += '<span class="mkbadge button button-fill offline_counter cls_task_ico">0</span>';
                                        }
                                        else {
                                            if (myArray[0].type == 'Flow') {
                                                if (udf_count_array == '' || udf_count_array == null || udf_count_array == undefined) {
                                                    var count = '';
                                                }
                                                else {
                                                    udf_count_array = JSON.parse(udf_count_array);
                                                    var count = udf_count_array[id_count];
                                                }
                                            }

                                            // put counter badge
                                            //var counter_bgcolor = $('.navbar').css('background-color');
                                            var counter_bgcolor = "red";
                                            if (udf_count_array.length > 0) {
                                                list_item += '<span id="circle_' + id_count + '" class="mkbadge button button-fill" style="background-color: ' + counter_bgcolor + '">' + count + '</span>';
                                            }
                                            else {
                                                list_item += '<span id="circle_' + id_count + '" class="mkbadge button"><img src="images/ajax-loader.gif" style="width:28px; height:28px"></span>';
                                            }
                                        }

                                    }

                                    list_item += '</div></div></div><div class="item-text">' + myArray[0].flow_name + '</div></a>';
                                    //list_item += '<input type="hidden" id="hdn_' + myArray[0].id + '" value=\'' + myArray[0].data + '\'>';
                                    list_item += "<input type='hidden' id='hdn_" + myArray[0].id + "' value=\"" + encodeURIComponent(myArray[0].data) + "\">";
                                    list_item += '</li>';
                                    $("#module_list").append(list_item);
                                }
                                module_count++;
                            }
                        }
                        tbl_str += '</tr>';
                        $("#card_module_list").append(tbl_str);

                        // user listing module 06042022
                        var user_list_feature = localStorage.getItem("user_list_feature_id");
                        if (user_list_feature == "" || user_list_feature == null || user_list_feature == undefined || user_list_feature == "0") { }
                        else {
                            add_user_module_to_list();
                        }
                        ///////////

                        if (module_count % 2 != 0) {
                            //if single last td then add colspan
                            $("#card_module_list td").last().attr('colspan', '2');
                        }

                        // cache the freshly rendered top-level list for instant paint on next return from LMS
                        try { if (_home_isTop) localStorage.setItem(_home_cacheKey, $(_home_container).html()); } catch (e) { }
                    }
                }
                else if (status == 2) {

                    // user listing module 06042022
                    var user_list_feature = localStorage.getItem("user_list_feature_id");
                    if (user_list_feature == "" || user_list_feature == null || user_list_feature == undefined || user_list_feature == "0") { }
                    else {
                        //add_user_module_to_list();
                        changeurl("EF_User_List.html");
                    }
                }
                else {
                    var message = responseText[0].message;
                    alert1("Server: " + message);
                }

                enable_back_button();
                loading_hide();

                $('.mdl-name').each(function (i, obj) {
                    if (obj.offsetWidth < obj.scrollWidth) {
                        var innerHTML = $(obj).html();
                        $(obj).html('<marquee scrollamount="3">' + innerHTML + '</marquee>');
                    }
                });

                compare_time_for_user_notification();
                //compare_time_for_online_count();
                get_today_attendance_for_notification();

                localStorage.setItem('last_modulelist_count', module_count);

            }
            catch (e) {
                alert1(e + "_get_list_of_modules_online_inner()");
            }
        }, onfail);
        getdata.callOtherDomain();
    }
    catch (e) {
        alert1(e + '_get_list_of_modules_online()');
        loading_hide();
    }
}

function get_checksheet_id_for_task_online(flow_id) {
    loading();
    var company_id = JSON.parse(storage.getItem("company_id"));
    var param_obj = [];
    param_obj.push({
        'Company_Id': company_id,
        'flow_id': flow_id
    });

    var getdata = new Webservicecall_REST(common_global_wcf_url + 'WCF_GetChecksheetId_Port', JSON.stringify(param_obj), function (e) {
        var responseText = JSON.parse(e.responseText);
        var status = responseText[0].status;
        if (status == 1) {
            loading_hide();
            var myArray = JSON.parse(responseText[0].data);
            var data_str = myArray[0].data;
            if (data_str == "" || data_str == null || data_str == undefined) { }
            else {
                myArray = JSON.parse(data_str);
            }

            var checksheet_id = myArray[0].checksheet_id;

            var obj = [{ 'checksheet_id': checksheet_id }];

            SuccessCallBack_get_checksheetid_for_createtask(JSON.stringify(obj));
        }
        else {
            loading_hide();
            alert1(responseText[0].message);
        }
    }, onfail);
    getdata.callOtherDomain();
}

// check and notify user for today's attendance
function get_today_attendance_for_notification_old() {
    var Attendance = localStorage.getItem('Attendance');
    if (Attendance == "True") {
        var t_photo_url = $("#menu_img_profile").attr("src");
        //if (t_photo_url == "images/profile_pic.png") {
        //    //mk_notify("Profile picture is not set. It is used to fill attendance!");
        //    //$("#noti_Attendance1").css("display", "block");
        //}
        //else {

        var t_user_id = JSON.parse(storage.getItem('user_id'));
        var d = new Date();
        var today_date = d.getDate();
        var curr_month = d.getMonth();
        var curr_year = d.getFullYear();

        var AttendanceJson = JSON.parse(localStorage.getItem('AttendanceJson'));
        var attendance_flow_id = AttendanceJson[0].flow_id;

        if (attendance_flow_id == "" || attendance_flow_id == null || attendance_flow_id == undefined) {
            alert("Attendance flow id is not found in Attendance JSON!");
        }
        else {
            var param_obj = [];
            param_obj.push({
                "Flow_id": attendance_flow_id,
                "User_id": t_user_id,
                "Month": curr_month + 1,
                "Year": curr_year
            });

            loading();
            var getdata = new Webservicecall_REST(global_wcf_url + 'Get_Attendance', JSON.stringify(param_obj), function (e) {
                var res_text = e.responseText;
                var result = eval('(' + res_text + ')');
                var message = result[0].message;


                var status = result[0].status;
                if (status == 1) {
                    var data = result[0].data;
                    var d_Array = JSON.parse(data);

                    var today_atnd_found = 0;
                    for (i = 0; i < d_Array.length; i++) {
                        var d = new Date(d_Array[i].AssignDate).getDate();

                        if (d == today_date) {
                            today_atnd_found++;
                        }
                    }

                    if (today_atnd_found == 0) {
                        // display add attendance if not found for today
                        //mk_notify("Your attendance is pending!");

                        $("#noti_Attendance3").css("display", "none");

                        let id_Array = JSON.parse(storage.getItem('id_Array'));
                        if (id_Array == '' || id_Array == undefined || id_Array == null) {
                            $("#noti_Attendance2").css("display", "block");
                        }
                        else {
                            $("#noti_Attendance2").css("display", "none");
                        }
                    }
                    else {
                        var trip_status = localStorage.getItem('trip_status');
                        if (trip_status == '0') {
                            //$("#noti_Attendance3").css("display", "block");
                        }
                    }
                }
                else if (status == 2) {
                    // display add attendance if not found for today
                    //mk_notify("Your attendance is pending!");

                    let id_Array = JSON.parse(storage.getItem('id_Array'));
                    if (id_Array == '' || id_Array == undefined || id_Array == null) {
                        $("#noti_Attendance2").css("display", "block");
                    }
                    else {
                        $("#noti_Attendance2").css("display", "none");
                    }
                }
                else {
                    alert1("Server: " + message)
                }
                loading_hide();
            }, onfail);
            getdata.callOtherDomain();
        }
        //}
    }
}

function get_today_attendance_for_notification() {
    var Attendance = localStorage.getItem('Attendance');
    if (Attendance == "True") {
        var AttendanceJson = JSON.parse(localStorage.getItem('AttendanceJson'));
        var attendance_flow_id = AttendanceJson[0].flow_id;
        if (attendance_flow_id == "" || attendance_flow_id == null || attendance_flow_id == undefined) {
            alert("Attendance flow id is not found in Attendance JSON!");
        }
        else {

            let id_Array = JSON.parse(storage.getItem('id_Array'));
            if (id_Array == '' || id_Array == undefined || id_Array == null) {

                var trip_status = localStorage.getItem('trip_status');
                if (trip_status == '1' || trip_status == '' || trip_status == null || trip_status == undefined) {
                    // display trip start button
                    $("#noti_Attendance2").css("display", "block");
                    $("#noti_Attendance3").css("display", "none");
                }
                else {
                    // hide trip start button
                    $("#noti_Attendance2").css("display", "none");
                    $("#noti_Attendance3").css("display", "block");
                }

            }
            else {
                // hide trip start and end button at inner level
                $("#noti_Attendance2").css("display", "none");
                $("#noti_Attendance3").css("display", "none");
            }
        }
    }
    else {
        $("#module_list").css("margin-top", "12px");
    }
}


noti_Attendance_Click = () => {

    let user_id = JSON.parse(storage.getItem('user_id'));
    let user_name = JSON.parse(storage.getItem('user_name'));
    var q_jsonobj = [];

    cordova.exec(function (e) {
        // attendance notification related storage has been successfull
    }, onfail, 'AttendancePendingPlugin', '', q_jsonobj);
}

//redirect_on_module_click('Attendance' , 17718,4411,'Flow','6667')
//noti_Attendance_Click = () => {

//    var flow_name = 'Attendance', id = 17718, flow_id = 4411, type = 'Flow', role_id = '6667';

//    //store role_id for multi-role
//    var login_company_feature_id = localStorage.getItem('login_company_feature_id');
//    localStorage.setItem('company_feature_id', login_company_feature_id);
//    storage.setItem('role_id', JSON.stringify(role_id));

//    //storage.setItem('tab_index', JSON.stringify(0));

//    //to skip single subflow checksheet
//    var curr_btn_mode = JSON.parse(storage.getItem('curr_btn_mode'));
//    if (curr_btn_mode == "subflow") {
//        storage.setItem('curr_btn_mode', JSON.stringify('back'));
//    }
//    else {
//        storage.setItem('curr_btn_mode', JSON.stringify(''));
//    }

//    storage.setItem('survey_type', JSON.stringify(''));

//    var data_count = $("#hdn_" + id + "").val();
//    data_count = decodeURIComponent(data_count);

//    storage.setItem('wayflow', JSON.stringify(flow_id));
//    storage.setItem('wayflow_name', JSON.stringify(flow_name));
//    storage.setItem('udf_id', JSON.stringify(id));
//    var level_Array = JSON.parse(storage.getItem('level_Array'));    // for module leveling items
//    if (level_Array == '' || level_Array == null || level_Array == undefined) {
//        var level_Array = [];
//    }

//    var list_data = JSON.parse(data_count);
//    var module_bottom_image = list_data[0].module_bottom_image;
//    localStorage.setItem('module_bottom_image', module_bottom_image);
//    level_Array.push({ 'last_flow_name': flow_name, 'module_bottom_image': module_bottom_image });
//    storage.setItem('level_Array', JSON.stringify(level_Array));

//    var flow_Array = JSON.parse(storage.getItem('flow_Array'));
//    if (flow_Array == '' || flow_Array == null || flow_Array == undefined) {
//        var flow_Array = [];
//    }
//    else {
//        // make array length 1 to handle multi sub push ATC
//        flow_Array.splice(1);
//    }

//    if (flow_Array.length > 0) {
//        var tab_index = JSON.parse(storage.getItem('tab_index'));
//        flow_Array[flow_Array.length - 1]['tab_index'] = tab_index;
//    }

//    storage.setItem('tab_index', JSON.stringify(0));
//    flow_Array.push({
//        'id': id,
//        'wayflow': flow_id,
//        'wayflow_name': flow_name,
//        'type': type,
//        'tid': '',
//        'siteid': '',
//        'start_status': '',
//        'end_status': '',
//        'checklist': '',
//        'list_json': data_count
//    });

//    storage.setItem('flow_Array', JSON.stringify(flow_Array));

//    if (flow_Array.length == 1) {
//        localStorage.setItem("p_udf_id", id);
//    }

//    // getting issue in normal submit after submit from shortcut button checksheet 29062023
//    localStorage.setItem('is_shortcutbutton', 'false');

//    var query = "select fm.checksheet_id from flow_master fm where fm.moduleid=" + flow_id + "";
//    var q_jsonobj = [];
//    q_jsonobj.push({
//        data: query,
//        p: "1"
//    });
//    cordova.exec(function (e) {
//        var myArray = JSON.parse(e);
//        var checksheet_id = myArray[0].checksheet_id;
//        var data_json = JSON.parse(storage.getItem('list_json_Array'));
//        var list_data = JSON.parse(data_json);
//        var f_list_data = JSON.stringify(list_data[0]);
//        storage.setItem('list_json', JSON.stringify("[" + f_list_data + "]"));
//        storage.setItem('check_type_task', JSON.stringify(checksheet_id));

//        var flow_Array = JSON.parse(storage.getItem('flow_Array'));

//        // set task checksheet
//        flow_Array[flow_Array.length - 1]['task_checksheetid'] = checksheet_id;
//        storage.setItem('flow_Array', JSON.stringify(flow_Array));
//        //changeurl("selection_survey.html");

//        create_new_task();

//    }, onfail, 'SqlitePlugin', 'showValues', q_jsonobj);

//}

function redirect_on_geotracking_click() {
    var q_jsonobj = [];
    cordova.exec(onsuccess_redirect_on_geotracking_click, onfail, 'GeofenceTrackingPlugin', 'anAction', q_jsonobj);
}

function onsuccess_redirect_on_geotracking_click(e) { }

check_for_glob_notification = () => {
    var store_company_id = JSON.parse(storage.getItem('company_id'));
    var Param_obj = [];
    Param_obj.push({
        companyId: store_company_id
    });
    var getdata = new Webservicecall_REST(global_wcf_url + 'select_marquee', JSON.stringify(Param_obj), function (e) {
        var All_data = e.responseText;
        All_data = JSON.parse(All_data);
        var status = All_data[0].status;
        var message = All_data[0].message;
        if (status == 1) {

            var data = All_data[0]["data"];
            data = JSON.parse(data);

            var marquee_str = "", mar_count = 0;
            for (var i = 0; i < data.length; i++) {
                var MarqueeMSG = data[i].MarqueeMSG;
                var companyID = data[i].companyID;
                var role_id = data[i].role_id;
                var t_circlename = data[i].circlename;
                var user_id = data[i].user_id;

                var role_id = data[i].role_id;
                var is_noti_hide = 0;
                if (role_id == "" || role_id == null || role_id == undefined) { }
                else {
                    var curr_role_id = JSON.parse(storage.getItem('role_id'));
                    var curr_company_id = JSON.parse(storage.getItem('company_id'));
                    var curr_user_id = JSON.parse(storage.getItem('user_id'));

                    var circle_name = JSON.parse(storage.getItem('circle_array'));
                    if (circle_name == '' || circle_name == null || circle_name == undefined) {
                        var circle_name = JSON.parse(storage.getItem('circle_name'));
                    }

                    var is_circle_found = 0;
                    if (t_circlename == "" || t_circlename == null || t_circlename == undefined || t_circlename == "0") { }
                    else {
                        if (circle_name.indexOf(t_circlename) > -1) {
                            is_circle_found = 1;
                        }
                    }


                    var role_array = role_id.split(',');
                    for (var d = 0; d < role_array.length; d++) {
                        var t_role_id = role_array[d];
                        if (t_role_id == curr_role_id || companyID == curr_company_id || user_id == curr_user_id || is_circle_found == 1) {

                            var is_noti_hide = got_it_notification_hide(MarqueeMSG);
                            if (is_noti_hide == 0) {
                                marquee_str += '<div id="glob_notification_' + mar_count + '">';
                                marquee_str += '<marquee id="marquee_noti_' + mar_count + '" direction="left" behavior="scroll" loop="infinite" onmouseover="this.stop();" onmouseout="this.start();" MarqueeMSG = "' + MarqueeMSG + '"><i class="fa fa-bell m-1 blink"></i>' + MarqueeMSG + '</marquee>';
                                marquee_str += '<button type="button" class="btn btn-sm btn-light" onclick="got_it_notification(this)">Got it !</button>';
                                marquee_str += '</div>';
                            }
                            mar_count++
                        }
                    }
                }

                $("#glob_noti_container").html(marquee_str);

                //var last_notification = localStorage.getItem("last_notification");
                //if (last_notification == "" || last_notification == null || last_notification == undefined) { }
                //else {
                //    if (MarqueeMSG == last_notification) {
                //        // dont show notification as user got it once
                //        is_noti_hide = 1;
                //    }
                //}

                //if (is_noti_hide == 1) {
                //    $("#glob_notification").hide();
                //}
                //else {
                //    $("#glob_notification").show();
                //    $("#marquee_noti").html('<i class="fa fa-bell m-1 blink"></i>' + MarqueeMSG);
                //    $("#marquee_noti").attr("MarqueeMSG", MarqueeMSG);
                //    let marquee_obj = document.getElementById('marquee_noti');
                //    marquee_obj.start();
                //}

            }
        }
        else if (status == 2) { }
        else {
            mk_notify(message);
        }
        loading_hide();
    }, function (e) {
        // api not found in other urls
        loading_hide();
    });
    getdata.callOtherDomain();
}

got_it_notification_hide = (MarqueeMSG) => {
    var is_noti_hide = 0;

    var last_notification = localStorage.getItem("last_notification");
    if (last_notification == "" || last_notification == null || last_notification == undefined) { }
    else {
        let last_noti_array = last_notification.split(",");
        for (var dk = 0; dk < last_noti_array.length; dk++) {
            let last_not_str = last_noti_array[dk];

            if (MarqueeMSG == last_not_str) {
                // dont show notification as user got it once
                is_noti_hide = 1;
                break;
            }

        }
    }
    return is_noti_hide
}

got_it_notification = (obj) => {
    let last_noti_array = [];
    // $("#glob_notification").hide();
    // let last_notification = $("#marquee_noti").attr("MarqueeMSG");

    $(obj).parent().hide()

    let last_noti = localStorage.getItem("last_notification");
    if (last_noti == "" || last_noti == null || last_noti == undefined) { }
    else {
        // last storage value 
        let last_str = last_noti.split(",");
        last_noti_array = last_str;
    }

    let last_notification = $(obj).prev().attr('MarqueeMSG')
    last_noti_array.push(last_notification);
    localStorage.setItem("last_notification", last_noti_array);
}

home_tab_click = () => {
    storage.setItem('curr_btn_mode', JSON.stringify(''));
    storage.setItem('id_Array', JSON.stringify(''));
    storage.setItem('level_Array', JSON.stringify(''));

    storage.setItem('list_json', JSON.stringify(''));
    storage.setItem('cust_flow_Array', JSON.stringify(''));

    //changeurl('selection.html');
    $('#div_page_content').show();
    $('#div_vertical_dashboard').hide();
    pageload_main();
}

// stop trip manualy via module listing (task was created offline so get server task id)
stop_trip_manualy_from_module_listing = () => {
    let trip_tid = localStorage.getItem('trip_tid');
    var query = "select tid, server_task_id, status, moduleid, checksheetid, siteid from task_master where tid = '" + trip_tid + "'";
    var q_jsonobj = [];
    q_jsonobj.push({
        data: query,
        p: "1"
    });
    cordova.exec(function (e) {

        let myArray = JSON.parse(e);
        let trip_tid = myArray[0].tid;
        let server_task_id = myArray[0].server_task_id;
        let start_status = myArray[0].status;
        let flow_id = myArray[0].moduleid;
        let check_type = myArray[0].checksheetid;
        let siteid = myArray[0].siteid;

        let AttendanceJson = JSON.parse(localStorage.getItem('AttendanceJson'));
        let Punchout_Status = AttendanceJson[0].Punchout_Status;
        
        var company_id = JSON.parse(storage.getItem('company_id'));
       
        if (check_type == '' || check_type == null || check_type == undefined || check_type == "null") {
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
            'servertaskid': server_task_id,
            'status': Punchout_Status,
            'old_status': start_status,
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
        //alert1(JSON.stringify(param_obj));
        loading();

        var getdata = new Webservicecall_REST(global_wcf_url + 'WCFTechnicianDataUpload', JSON.stringify(param_obj), function (e) {
            var res_text = e.responseText;
            var result = eval('(' + res_text + ')');
            var message = result[0].message;
            var status = result[0].status;
            if (status == 1) {
                loading_hide();

                var q_jsonobj = [];
                q_jsonobj.push({
                    'trip_status': "1",
                    'tid': trip_tid,
                    'odometer_point': [],
                    'ETA': "false",
                    'stillviolation_event': "false",
                    'vehicle_type': ""
                });
                cordova.exec(function (e) {
                    // success

                    localStorage.setItem('trip_status', '1');
                    localStorage.setItem('trip_tid', '');
                    localStorage.setItem('trip_ser_task_id', '');
                    localStorage.setItem('trip_waypoint_dependency', '');

                    changeurl("selection.html");
                }, function (e) {
                    // fail
                    alert("Unable to end trip!")
                }, 'TripPlugin', 'anAction', q_jsonobj);

                
            }
            else {
                alert1(message);
                loading_hide();
            }
        }, onfail);
        getdata.callOtherDomain();



    }, function (e) {
        // tid not found
        alert("trip id is not found!");

    }, 'SqlitePlugin', 'showValues', q_jsonobj);

}




//open_end_trip_checksheet = () => {
//    let trip_tid = localStorage.getItem('trip_tid');
//    var query = "select * from task_master where tid = '" + trip_tid + "'";
//    var q_jsonobj = [];
//    q_jsonobj.push({
//        data: query,
//        p: "1"
//    });
//    cordova.exec(function (e) {

//        var myArray = JSON.parse(e);

//        var selected_site = myArray[0].siteid;
//        var selected_site_name = myArray[0].site_name;
//        var selected_server_task_id = myArray[0].ser_task_id;
//        var selected_start_status = myArray[0].task_status;
//        var selected_moduleid = myArray[0].module_id;
//        var selected_modulename = myArray[0].module_name;
//        var t_site_lat = myArray[0].site_lat;
//        var t_site_long = myArray[0].site_long;
//        var t_task_update = 1;

//        // task click logic (need to open end trip checksheet)

//        // clear system variables on main task click 06052022
//        var is_subflow = localStorage.getItem('is_subflow');
//        if (is_subflow == 'true') { }
//        else {
//            storage.setItem('type20_columndata', JSON.stringify(''));
//        }

//        storage.setItem('site_lat', JSON.stringify(t_site_lat));
//        storage.setItem('site_long', JSON.stringify(t_site_long));
//        storage.setItem('curr_btn_mode', JSON.stringify(''));
//        storage.setItem('siteid', JSON.stringify(selected_site));
//        storage.setItem('sitename', JSON.stringify(selected_site_name));
//        storage.setItem('type20_cust_id', JSON.stringify(selected_site));
//        storage.setItem('type20_cust_name', JSON.stringify(selected_site_name));
//        storage.setItem('server_task_id', JSON.stringify(selected_server_task_id));

//        storage.setItem('start_status', JSON.stringify(selected_start_status));
//        storage.setItem('wayflow', JSON.stringify(selected_moduleid));
//        storage.setItem('wayflow_name', JSON.stringify(selected_modulename));
//        storage.setItem('ser_task_update', JSON.stringify(t_task_update));
//        set_common_localStorage('redirect_on_checksheet', 'true');

//        storage.setItem('task_click_mode', JSON.stringify('static'));
//        storage.setItem('tid', JSON.stringify(trip_tid));
//        storage.setItem('type20_cust_id', JSON.stringify(selected_site));
//        storage.setItem('type20_cust_name', JSON.stringify(selected_site_name));
//        storage.setItem('loc_task_update', "false");

//        var flow_Array = [];
//        flow_Array.push({
//            'id': id,
//            'wayflow': flow_id,
//            'wayflow_name': flow_name,
//            'type': type,
//            'tid': '',
//            'siteid': '',
//            'start_status': '',
//            'end_status': '',
//            'checklist': '',
//            'list_json': data_count
//        });

//        var flow_Array = JSON.parse(storage.getItem('flow_Array'));
//        if (flow_Array.length == 1) {
//            storage.setItem('p_server_task_id', JSON.stringify(selected_server_task_id));
//        }

//        flow_Array[flow_Array.length - 1].tid = selected_tid;
//        flow_Array[flow_Array.length - 1].siteid = selected_site;
//        flow_Array[flow_Array.length - 1].start_status = selected_start_status;
//        storage.setItem('flow_Array', JSON.stringify(flow_Array));

//        changeurl("viewsitedata.html");

//    }, function (e) {
//        // tid not found
//        alert("trip id is not found!");

//    }, 'SqlitePlugin', 'showValues', q_jsonobj);

//    redirect_on_pm_site_click_online(selected_site, selected_site_name, selected_server_task_id, selected_start_status, selected_moduleid, selected_modulename, t_task_update, t_site_lat, t_site_long, t_survey_date, t_millisecond);
//}