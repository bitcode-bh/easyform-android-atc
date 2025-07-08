
//// get user lat long
function get_user_details() {
    try {
        var selected_module = JSON.parse(storage.getItem('wayflow_name'));
        var selected_sitename = JSON.parse(storage.getItem('sitename'));
        if (selected_sitename == '' || selected_sitename == null
            || selected_sitename == undefined || selected_sitename == "0") {
            alert1("Something goes wrong ! Please go back and click again on customer !")
        } else {
            document.getElementById('prob_category').innerHTML = selected_module;
            document.getElementById('prob_site_id').innerHTML = selected_sitename;
            var Contact_Number = JSON.parse(storage.getItem('contactno'));
            if (Contact_Number == "" || Contact_Number == null
                || Contact_Number == undefined) {
                Contact_Number = "(Not Available)";
            }
            $("#lbl_contactno").html(Contact_Number);

            var email_id = JSON.parse(storage.getItem('email_id'));
            if (email_id == "" || email_id == null || email_id == undefined) {
                email_id = "(Not Available)";
            }
            $("#lbl_email").html(email_id);

            // from page load
            $("#support_new_details").css("white-space", "pre");
            var support_refrences_a = JSON.parse(storage.getItem('support_refrences1'));
            document.getElementById("support_new_details").innerHTML = support_refrences_a;

            cordova.exec(onsuccess_get_user_latlong_support, onfail_get_user_latlong_support,
                'maulik', 'nck', ["ds"]);
        }
    } catch (e) {
        alert1(e + '_get_user_details()');
        loading_hide();
    }
}

// successful getting user latlong
function onsuccess_get_user_latlong_support(e) {
    try {
        var myArray = JSON.parse(e);
        if (myArray[0].lat == "" || myArray[0].lat == undefined
            || myArray[0].lat == null) {
            var lat = 0;
        } else {
            var lat = myArray[0].lat;
        }
        if (myArray[0].lon == "" || myArray[0].lon == undefined
            || myArray[0].lon == null) {
            var long = 0;
        } else {
            var long = myArray[0].lon;
        }
        if (myArray[0].accuracy == "" || myArray[0].accuracy == undefined
            || myArray[0].accuracy == null) {
            var accuracy = 0;
        } else {
            var accuracy = myArray[0].accuracy;
        }

        try {
            lat = parseFloat(lat);
        } catch (e) {
            lat = 0;
        }
        try {
            long = parseFloat(long);
        } catch (e) {
            long = 0;
        }
        try {
            accuracy = parseFloat(accuracy);
        } catch (e) {
            accuracy = 0;
        }

        var radius = JSON.parse(storage.getItem('user_radius'));
        var support_type = JSON.parse(storage.getItem('support_type'));
        if (support_type == 'checksheet') {
            send_user_lat_long_checksheet(lat, long, accuracy, radius);
        } else if (support_type == 'customer') {
            send_user_lat_long_customer(lat, long, accuracy, radius);
        } else {
            //send_user_lat_long(lat, long, accuracy, radius);
            send_user_lat_long_native();
        }
    } catch (e) {
        var radius = JSON.parse(storage.getItem('user_radius'));
        var support_type = JSON.parse(storage.getItem('support_type'));
        if (support_type == 'checksheet') {
            send_user_lat_long_checksheet(0, 0, 0, radius);
        } else if (support_type == 'customer') {
            send_user_lat_long_customer(0, 0, 0, radius);
        } else {
            //send_user_lat_long(0, 0, 0, radius);
            send_user_lat_long_native();
        }
    }
}

function onfail_get_user_latlong_support(e) {
    var radius = JSON.parse(storage.getItem('user_radius'));
    var support_type = JSON.parse(storage.getItem('support_type'));
    if (support_type == 'checksheet') {
        send_user_lat_long_checksheet(0, 0, 0, radius);
    } else if (support_type == 'customer') {
        send_user_lat_long_customer(0, 0, 0, radius);
    } else {
        //send_user_lat_long(0, 0, 0, radius);
        send_user_lat_long_native();
    }
}

/// user native map for support
function send_user_lat_long_native() {
    try {
        loading();

        var selected_sitename = JSON.parse(storage.getItem('sitename'));
        var server_task_id = JSON.parse(storage.getItem('server_task_id'));
        var company_id = JSON.parse(storage.getItem('company_id'));
        var site_lat = JSON.parse(storage.getItem('site_lat'));
        var site_long = JSON.parse(storage.getItem('site_long'));
        var accuracy = JSON.parse(storage.getItem('user_accuracy'));
        var radius = JSON.parse(storage.getItem('user_radius'));
        var Support_Details = JSON.parse(storage.getItem('support_refrences1'));

        let data_json = JSON.parse(storage.getItem('list_json'));
        let list_data = JSON.parse(data_json);
        let geofence_by = list_data[0].geofence_by;
        if (geofence_by == "" || geofence_by == null || geofence_by == undefined) {
            geofence_by = "customer";
        }

        var param_obj = [];
        param_obj.push({
            'IMEI': imeino,
            'Company_Id': company_id,
            'Username': username,
            'Customer_Unique': selected_sitename,
            'Task_Id': server_task_id,
            'site_lat': site_lat,
            'site_long': site_long,
            'Accuracy': accuracy,
            'Radius': radius,
            'Support_Details': Support_Details,
            'geofence_by': geofence_by
        });
        //alert1(JSON.stringify(param_obj));
        cordova.exec(SuccessCallBack_send_user_lat_long, FailCallBack_send_user_lat_long, 'SupportPageMapsPlugin', 'anAction', param_obj);

    } catch (e) {
        alert1(e + '_send_user_lat_long_native()');
        loading_hide();
    }
}

var support_new_lat, support_new_long;

// successful sending user lat long to server
function SuccessCallBack_send_user_lat_long(e) {
    try {
        // alert1(e);
        // alert1(JSON.stringify(e));
        //var myArray = JSON.parse(e.responseText);   // from javascript webservice call
        var myArray = JSON.parse(e);    // from native webservice call
        // alert1(JSON.stringify(myArray));
        var status = myArray[0].Status;
        if (status == 1) {
            var distance = myArray[0].Distance; // in_out_flag_of_distance
            if (distance == 1) // in radius
            {
                // alert1("user is in site radius...");
                //document.getElementById('site_status').innerHTML = 'You are near by site ! <br/> Please press refresh button !';
                //document.getElementById('site_status').style.color = 'green';
                var new_lat = myArray[0].Lat;
                var new_long = myArray[0].Long;

                support_new_lat = new_lat;
                support_new_long = new_long;

                update_site_lat_long(new_lat, new_long);
            } else {
                // distance = 2
                // alert1("user is out of site radius...");
                //document.getElementById('site_status').innerHTML = 'You are still far from site ! <br/> Please contact to Easy Form support team and then press refresh button !';
                //document.getElementById('site_status').style.color = 'red';
            }
        } else {
            var message = myArray[0].message;
            alert1(message);
        }

        enable_back_button();
        loading_hide();
    } catch (e) {
        alert1(e + '_SuccessCallBack_send_user_lat_long');
        loading_hide();
    }
}

// update site lat long natively by server site lat long
function update_site_lat_long(new_lat, new_long) {
    try {
        var selected_site = JSON.parse(storage.getItem('siteid'));
        var selected_module_id = JSON.parse(storage.getItem('wayflow'));
        var query = "UPDATE task_master SET lat = '" + new_lat + "', long = '" + new_long + "' where siteid = '" + selected_site
            + "' and moduleid = '" + selected_module_id + "' and username = '" + username + "'";
        // alert1(query);
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            q: "1", // 0 will not update flag 0 to 1 in table
            tid: "0"
        });
        cordova.exec(SuccessCallBack_update_site_lat_long, FailCallBack_update_site_lat_long, 'SqlitePlugin', 'insertValuse', q_jsonobj);
    } catch (e) {
        alert1(e + '_update_site_lat_long');
        loading_hide();
    }
}

// successful update lat long natively
function SuccessCallBack_update_site_lat_long(e) {
    try {
        // alert1("Site lat long has been refreshed !");
        // update_site_defualt_distance();
        //changeurl("selection_survey.html");
        //loading_hide();

        loading();
        var selected_site = glob_taskclick_ary[0].site_id;
        var selected_site_name = glob_taskclick_ary[0].site_name;
        var selected_server_task_id = glob_taskclick_ary[0].server_task_id;
        var selected_start_status = glob_taskclick_ary[0].start_status;
        var selected_moduleid = glob_taskclick_ary[0].moduleid;
        var selected_modulename = glob_taskclick_ary[0].modulename;
        var t_task_update = glob_taskclick_ary[0].task_update;

        //var t_site_lat = glob_taskclick_ary[0].site_lat;
        //var t_site_long = glob_taskclick_ary[0].site_long;
        var t_site_lat = support_new_lat;
        var t_site_long = support_new_long;

        var t_survey_date = glob_taskclick_ary[0].survey_date;
        var t_millisecond = glob_taskclick_ary[0].millisecond;
        var t_accuracy = glob_taskclick_ary[0].accuracy;
        var t_radius = glob_taskclick_ary[0].radius;

        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var survey_mode = list_data[0].survey_mode;
        if (survey_mode == "online") {
            //redirect_on_pm_site_click_online_POST_geofence(selected_site, selected_site_name, selected_server_task_id, selected_start_status, selected_moduleid, selected_modulename, t_task_update, t_site_lat, t_site_long, t_survey_date, t_millisecond, t_accuracy, t_radius);
            redirect_on_pm_site_click_online(selected_site, selected_site_name, selected_server_task_id, selected_start_status, selected_moduleid, selected_modulename, t_task_update, t_site_lat, t_site_long, t_survey_date, t_millisecond);
        }
        else {
            var selected_tid = glob_taskclick_ary[0].tid;
            var t_p_tid = glob_taskclick_ary[0].p_tid;
            var t_index = glob_taskclick_ary[0].index;
            var t_is_delete_photo = encodeURIComponent("[]")
            redirect_on_pm_site_click(selected_site, selected_tid, selected_start_status, selected_moduleid, selected_modulename, selected_site_name, t_site_lat, t_site_long, t_index, t_is_delete_photo, t_p_tid);
        }


    } catch (e) {
        alert1(e + '_SuccessCallBack_update_site_lat_long');
        loading_hide();
    }
}

function FailCallBack_send_user_lat_long(e) {
    //document.getElementById('site_status').innerHTML = 'Network Error !<br/> Please Check Your Internet Connection !';
    //document.getElementById('site_status').style.color = 'red';
    //changeurl("selection_survey.html");
    //loading_hide();

    // user press back button
    loading_hide();
    refresh_site_list_common();
}

function FailCallBack_update_site_lat_long(e) {
    alert1(e + '_FailCallBack_update_site_lat_long');
    loading_hide();
}

var glob_user_col_obj;
function get_current_user_latlong(t_geofence_flag, t_radius, t_user_col_obj) {
    try {
        t_user_col_obj = decodeURIComponent(t_user_col_obj);
        glob_user_col_obj = JSON.parse(t_user_col_obj);

        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var user_column = list_data[0].user_column;
        var another_user_name = '';
        var survey_mode = list_data[0].survey_mode;
        if (survey_mode == "online") {
            var selected_server_task_id = glob_user_col_obj.ser_task_id;
            var columndata_str = $('#lst_sys_var_' + selected_server_task_id + '').val();
        }
        else {
            var selected_tid = glob_user_col_obj.tid;
            var columndata_str = $('#lst_sys_var_' + selected_tid + '').val();
        }

        var columndata_Array = JSON.parse(decodeURIComponent(columndata_str));
        if (columndata_Array == '' || columndata_Array == null || columndata_Array == undefined) { }
        else {
            for (c = 0; c < columndata_Array.length; c++) {
                var key = columndata_Array[c].header;
                var value = columndata_Array[c].ans;
                if (key == user_column) {
                    another_user_name = value;
                    break
                }
            }
        }

        var company_id = JSON.parse(storage.getItem('company_id'));

        var param_obj = [];
        param_obj.push({
            'Company_Id': company_id,
            'Username': another_user_name,
            'Radius': t_radius,
            'isgeofence': t_geofence_flag
        });

        //alert1(JSON.stringify(param_obj));
        loading();
        cordova.exec(onsuccess_get_current_user_latlong, onfail_get_current_user_latlong, 'UserMapViewPlugin', 'anAction', param_obj);
    }
    catch (e) {
        loading_hide();
        alert1(e + '_get_current_user_latlong');
    }
}

function onsuccess_get_current_user_latlong(e) {
    try {
        loading_hide();
        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var survey_mode = list_data[0].survey_mode;
        if (survey_mode == "offline") {
            redirect_on_pm_site_click(glob_user_col_obj.myArray[i].siteid, glob_user_col_obj.myArray[i].tid, glob_user_col_obj.task_status, glob_user_col_obj.myArray[i].moduleid, glob_user_col_obj.myArray[i].module_name, glob_user_col_obj.myArray[i].site_name, glob_user_col_obj.myArray[i].lat, glob_user_col_obj.myArray[i].long, glob_user_col_obj.index, glob_user_col_obj.is_delete_photo, glob_user_col_obj.myArray[i].p_tid);
        }
        else {
            redirect_on_pm_site_click_online(glob_user_col_obj.siteid, glob_user_col_obj.site_name, glob_user_col_obj.ser_task_id, glob_user_col_obj.task_status, glob_user_col_obj.module_id, glob_user_col_obj.module_name, glob_user_col_obj.task_update, glob_user_col_obj.site_lat, glob_user_col_obj.site_long, glob_user_col_obj.survey_date, glob_user_col_obj.ser_milli);
        }
    }
    catch (e) {
        loading_hide();
        alert1(e + '_onsuccess_get_current_user_latlong');
    }
}

function onfail_get_current_user_latlong(e) {
    loading_hide();
    //alert1(e + '_onfail_get_current_user_latlong');
}