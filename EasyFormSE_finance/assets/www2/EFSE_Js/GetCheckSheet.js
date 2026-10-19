
// default function on page load for initial check read

function data_to_read() {
    return load_form_livelinks(data_to_read_post);
}

function data_to_read_post() {
    try {
        //loading();
        var crash_status = JSON.parse(storage.getItem('crash_status'));
        if (crash_status == 7) {
            //recover data when app is killed before start/stop trip
            var trip_status = localStorage.getItem('trip_status');
            curr_btn_mode = JSON.parse(storage.getItem('curr_btn_mode'));
            start_stop_trip(trip_status);
        }
        else if (crash_status == 1) {
            // recover data when application has been crashed when capture last photo
            var cam_crash_data = JSON.parse(storage.getItem('cam_crash_data'));
            var heading = cam_crash_data[0].heading;
            var check_type = cam_crash_data[0].check_type;
            var step = cam_crash_data[0].step;
            var data = cam_crash_data[0].data;
            var buttons = cam_crash_data[0].buttons;
            read_dynamic_surveydata(heading, check_type, step, data, buttons, 0, 0);
        }
        else if (crash_status == 3) {
            // recover data when application has been crashed during RF Tracking plugin call
            var rf_crash_data = JSON.parse(storage.getItem('rf_crash_data'));
            var heading = rf_crash_data[0].heading;
            var check_type = rf_crash_data[0].check_type;
            var step = rf_crash_data[0].step;
            var data = rf_crash_data[0].data;
            var buttons = rf_crash_data[0].buttons;
            read_dynamic_surveydata(heading, check_type, step, data, buttons, 0, 0);
        }
        else {
            var Background_Image = localStorage.getItem("c_back_image");
            if (Background_Image == '' || Background_Image == null || Background_Image == undefined) { }
            else {
                $('.form_bg').css({ 'background': 'url(' + Background_Image + ')  no-repeat', 'background-size': '100% 95%' });
            }

            var step_Array_to_read = JSON.parse(storage.getItem('step_Array_to_read'));
            if (step_Array_to_read == "" || step_Array_to_read == null) {
                // alert1("old task is complete");
                storage.setItem('crash_status', JSON.stringify('0'));
                curr_btn_mode = "";
                loading_hide();
                changeurl("Login.html");
            } else {
                // alert1("Task is pending !");
                curr_btn_mode = "";
                step_Array = [];
                step_Array = step_Array_to_read.slice(0);
                curr_survey_data["t_id"] = JSON.parse(storage.getItem('tid'));

                // change logic for getting tid for log insert/update
                //var is_subflow = localStorage.getItem('is_subflow');
                //if (is_subflow == 'true') {
                //    curr_survey_data["t_id"] = JSON.parse(storage.getItem('sub_tid'));
                //}
                //else {
                //    curr_survey_data["t_id"] = JSON.parse(storage.getItem('tid'));
                //}

                curr_survey_data["task_id"] = JSON.parse(storage.getItem('task_id'));
                curr_survey_data["server_task_id"] = JSON.parse(storage.getItem('server_task_id'));

                var data_json = JSON.parse(storage.getItem('list_json'));
                var list_data = JSON.parse(data_json);
                var group_task_column = list_data[0].group_task_column;
                if (group_task_column == "" || group_task_column == null || group_task_column == undefined) {
                    get_first_milli_lat_long();
                }
                else {
                    read_blank_checksheet_group();
                }

            }
        }
    } catch (e) {
        // alert1(e + '_data_to_read()');
        data_to_read();
        loading_hide();
    }
}

var f_milli, f_lat, f_long, f_address;
function get_first_milli_lat_long() {
    cordova.exec(onsuccess_get_first_milli_lat_long, onfail_get_first_milli_lat_long, 'maulik', 'nck', ["ds"]);
}

function onsuccess_get_first_milli_lat_long(e) {
    try {
        var myArray = JSON.parse(e);
        if (myArray[0].lat == "" || myArray[0].lat == undefined || myArray[0].lat == null) {
            f_lat = "0";
        } else {
            f_lat = myArray[0].lat;
        }
        if (myArray[0].lon == "" || myArray[0].lon == undefined || myArray[0].lon == null) {
            f_long = "0";
        } else {
            f_long = myArray[0].lon;
        }
        if (myArray[0].address == "" || myArray[0].address == undefined || myArray[0].address == null) {
            f_address = "N/A";
        } else {
            f_address = myArray[0].address;
        }

        var d = new Date();
        f_milli = d.getTime();
        check_survey_entry_next_read();
    } catch (e) {
        f_lat = "0";
        f_long = "0";
        f_address = "N/A";
        var d = new Date();
        f_milli = d.getTime();
        check_survey_entry_next_read();
    }
}

function onfail_get_first_milli_lat_long(e) {
    f_lat = "0";
    f_long = "0";
    f_address = "N/A";
    var d = new Date();
    f_milli = d.getTime();
    check_survey_entry_next_read();
}

function check_survey_entry_back_read(step) {
    // alert1("Getting previous survey data...");
    try {
        var t_id = curr_survey_data["t_id"];
        var check_type = curr_survey_data["check_type"];
        var query = "select f_data from f_master where tid = '" + t_id
            + "' and f_value = '" + check_type + "' and step = '" + step
            + "'";
        // alert1(query);
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "0"
        });
        cordova.exec(success_check_survey_entry_back_read,
            fail_check_survey_entry_back_read, 'SqlitePlugin',
            'showValues', q_jsonobj);
    } catch (e) {
        alert1(e + '_check_survey_entry_back_read()');
        loading_hide();
    }
}
// Getting values from survey data
function success_check_survey_entry_back_read(e) {
    try {
        // alert1("Getting survey data from f_master table...");
        // alert1(e);
        var myArray = JSON.parse(e);
        var heading = myArray[0].subcategory;
        var check_type = myArray[0].check_type;
        var step = myArray[0].stepid;
        var data = myArray[0].data;
        var buttons = myArray[0].buttons;
        read_dynamic_surveydata(heading, check_type, step, data, buttons, 0, 0);
    } catch (e) {
        // alert1(e + '_success_check_survey_entry_back_read()');
        loading_hide();

        // when back step is not exist for current checksheet
        if (step_Array.length > 1) {
            step_Array.pop();
        }
        var step = step_Array[step_Array.length - 1];
        check_survey_entry_back_read(step);
    }
}

function fail_check_survey_entry_back_read(e) {
    // back entry is not available in database because of re-installation of
    // application
    // alert1("Previous record is not available in database, requesting to the
    // server !");
    var c_is_disabled = JSON.parse(storage.getItem('c_is_disabled'));
    if (c_is_disabled == 1) {
        // read only mode
        read_blank_checksheet();
    }
    else {
        select_detail_for_back_survey();
    }
}

// getting data for getting back step survey data from server
function select_detail_for_back_survey() {
    try {
        // alert1("calling to server...")
        loading();
        var s_check_type = curr_survey_data["check_type"];
        var s_servertaskid = curr_survey_data["server_task_id"];
        var s_step = step_Array[step_Array.length - 1];
        if (s_step == '' || s_step == null || s_step == undefined) {
            s_step = 1;
        }
        if (curr_btn_mode == 'gotonchangecolor') {
            s_step = curr_survey_data["updatestep"];
        }
        var param_obj = [];
        param_obj.push({
            'servertaskid': s_servertaskid,
            'stepid': s_step,
            'check_type': s_check_type,
            'check_parent': "false"
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

        var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_GetBackSurvey', JSON.stringify(param_obj), SuccessCallBack_select_detail_for_back_survey, FailCallBack_select_detail_for_back_survey);
        getdata.callOtherDomain();

    } catch (e) {
        alert1(e + '_select_detail_for_back_survey()');
        loading_hide();
    }
}

// successful getting back step survey data from server
function SuccessCallBack_select_detail_for_back_survey(e) {
    try {
        var myArray = JSON.parse(e.responseText);
        // alert1(JSON.stringify(myArray));
        var status = myArray[0].status;
        if (status == 1) {
            // alert1("Successfull getting back step survey data from server !");
            //var fileData = JSON.parse(myArray[0].message);

            var data = myArray[0].data;
            if (data == "" || data == null || data == undefined) {
                var fileData = JSON.parse(myArray[0].message);
            }
            else {
                var fileData = JSON.parse(data);
            }

            var c_is_online = JSON.parse(storage.getItem('c_is_online'));
            if (c_is_online == '1') {
                // view online checksheet directly in without update log in local 11032024
                var heading = fileData[0].subcategory;
                var check_type = fileData[0].check_type;
                var step = myArray[0].stepid;
                if (step == "" || step == null || step == undefined) {
                    step = fileData[0].stepid;
                }
                var data = fileData[0].data;
                var buttons = fileData[0].buttons;
                read_dynamic_surveydata(heading, check_type, step, data, buttons, 0, 0);
            }
            else {
                // offline checksheet
                insert_new_back_survey_entry(fileData);
            }

        } else if (status == 2) {
            // bind blank checksheet (when no data found on server)
            read_blank_checksheet();
        } else if (status == 3) {
            // catch error on server
            var message = myArray[0].message;
            alert1(message);
        } else if (status == 4) {
            // authentication fail
            var message = myArray[0].message;
            alert1(message);
        } else {
            var message = myArray[0].message;
            alert1(message);
            popup_retry_div_hide();
        }
        loading_hide();
    } catch (e) {
        alert1(e + '_SuccessCallBack_select_detail_for_back_survey()');
        loading_hide();
    }

}

// insert new back survey entry
function insert_new_back_survey_entry(fileData) {
    // insert data to f_master table - goto action - Save & Next/Reject Buttons
    // alert1("inserting new entry...");
    try {

        var imei_no = parseInt(fileData[0].imei);
        var date_s = new Date();
        var time = date_s.getTime();
        var f_name = imei_no + "_" + time;
        var s_fileData = JSON.stringify(fileData);
        var s_t_id = curr_survey_data["t_id"];
        // var s_siteid = JSON.parse(storage.getItem('siteid'));
        var s_check_type = curr_survey_data["check_type"];
        var s_servertaskid = curr_survey_data["server_task_id"];
        var s_step = step_Array[step_Array.length - 1];

        var user_track_array = JSON.parse(storage.getItem('user_track_details'));
        var user_lat = user_track_array[0].user_lat;
        var user_long = user_track_array[0].user_long;

        var f_lat = fileData[0].lat;
        if (f_lat == "" || f_lat == null || f_lat == undefined) {
            f_lat = user_lat;
        }
        var f_lon = fileData[0].long1;
        if (f_lon == "" || f_lon == null || f_lon == undefined) {
            f_lon = user_long;
        }
        var f_ms = fileData[0].date;
        if (f_ms == "" || f_ms == null || f_ms == undefined) {
            f_ms = time;
        }

        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var match_temp_id = list_data[0].match_temp_id;
        if (match_temp_id == "" || match_temp_id == null || match_temp_id == undefined) {
            match_temp_id = "";
        }

        var query = "INSERT INTO f_master (c_id, c_type, tid ,f_name, f_data, f_key, f_value, f_type, flag, step, lat, long, millisecond, match_temp_id) VALUES("
            + s_check_type + ",1,'" + s_t_id + "','" + f_name + "','" + s_fileData + "', 's','" + s_check_type + "','text/plain','1','" + s_step + "', '" + f_lat + "', '"
            + f_lon + "', '" + f_ms + "', '" + match_temp_id + "');";

        // alert1(query);
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            q: "0",
            tid: s_t_id
        });
        cordova.exec(SuccessCallBack_insert_new_back_survey_entry,
            FailCallBack_insert_new_back_survey_entry, 'SqlitePlugin',
            'insertValuse', q_jsonobj);
    } catch (e) {
        alert1(e + '_insert_new_back_survey_entry()');
        loading_hide();
    }
}

// successfully insert new back survey entry
function SuccessCallBack_insert_new_back_survey_entry(e) {
    // back step survey data has been saved successfully
    // alert1("reading back step survey...");
    if (curr_btn_mode == 'gotonchangecolor') {
        get_target_step_survey();
    } else {
        var step = step_Array[step_Array.length - 1];
        popup_retry_div_hide();
        check_survey_entry_back_read(step);
    }
}

// error while getting back step survey data from server
function FailCallBack_select_detail_for_back_survey(e) {
    // alert1("Network is slow or not working. Please try again !");
    loading_hide();
    // redirecting to dependent sitelist page
    // check_flow_and_redirect();
    popup_retry_div_show();
}

// error while insertting new back survey entry
function FailCallBack_insert_new_back_survey_entry(e) {
    alert1(e + '_FailCallBack_insert_new_back_survey_entry()');
    loading_hide();
}

// /////////////// retry popup div portion start //////////////////////////
// show retry popup
function popup_retry_div_show() {
    enable_popup = 1;
    $("#popup_outer_div_general").show();
    $('#popup_inner_div_network_retry').show();
    $('#popup_outer_div_general').css({
        "z-index": "2000"
    });
    $('#popup_inner_div_network_retry').css(
        {
            "left": ($(window).width() - $(
                '#popup_inner_div_network_retry').outerWidth()) / 2,
            "top": ($(window).height() - $(
                '#popup_inner_div_network_retry').outerHeight()) / 2
        });

    $("#popup_inner_div_network_retry").addClass("vibrate_stop");
    // setTimeout(function() {
    // // alert1("stop");
    // $("#popup_inner_div_network_retry").addClass("vibrate_stop");
    // }, 500);

}

// hide popup retry div
function popup_retry_div_hide() {
    enable_popup = 0;
    $("#popup_outer_div_general").hide();
    $('#popup_inner_div_network_retry').hide();
    $('#popup_inner_div_network_retry').css(
        {
            "left": ($(window).width() - $(
                '#popup_inner_div_network_retry').outerWidth()) / 2,
            "top": ($(window).height() - $(
                '#popup_inner_div_network_retry').outerHeight()) / 2
        });
}
