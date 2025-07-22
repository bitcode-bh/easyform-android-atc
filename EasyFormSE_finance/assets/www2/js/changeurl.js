function changeurl(url) {
    try {
        // alert1("" + url + "");
        window.location.href = url;
        // navigator.app.loadUrl("file:///android_asset/www2/" + url + "");

    } catch (e) {
        alert1(e)
    }
}

function toggle_profile_menu(click_flag) { }

function show_change_profile_photo_div() {
    $("#div_pro_pic_op").show();
    setTimeout(function () {
        $("#div_pro_pic_op").css("height", "5.5%");
    }, 100);
}

function hide_change_profile_photo_div() {
    $("#div_pro_pic_op").css("height", "0px");
    setTimeout(function () {
        $("#div_pro_pic_op").hide();
    }, 100);
}

function change_profile_pic(photo_type) {
    try {
        var date_s = new Date();
        var time = date_s.getTime();

        var camera_type = localStorage.getItem('Camera_Type');
        var camera_edit = localStorage.getItem('Camera_Edit');

        var query = "select imei from Login_Master";

        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "1",
            time: time,
            flag: "false",
            width: "1080",
            height: "720",
            quality: "100",
            camera_type: camera_type,
            camera_edit: camera_edit
        });

        if (photo_type == 'camera') {
            cordova.exec(upload_profile_pic_entry, onfail_cam, 'camera_new', 'anAction', q_jsonobj);
        } else {
            cordova.exec(upload_profile_pic_entry, onfail_cam, 'large_photo', 'anAction', q_jsonobj);
        }
    } catch (e) {
        alert1(e + '_change_profile_pic()');
    }
}

function upload_profile_pic_entry(imageData) {
    try {

        set_profile_pic(imageData);

        var profile_checksheetid = JSON.parse(localStorage.getItem('profile_checksheetid'));
        var date_s = new Date();
        var time = date_s.getTime();

        var company_id = JSON.parse(storage.getItem('company_id'));
        var user_id = JSON.parse(storage.getItem('user_id'));
        var pro_pic_name = company_id + "_" + user_id + "_" + time;


        var flowParamData = [];
        flowParamData.push({
            company_id: company_id,
            site_id: 0,
            sid: 0,
            que_id: 4008,
            checksheetid: profile_checksheetid,
            step_No: 1,
            Ph_id: 0,
            th_path: '',
            size: '',
            type: '',
            it_id: 0
        });

        var q_jsonobj = [];
        q_jsonobj.push({
            'tid': 0,
            'que_id': 0,
            'checksheetid': profile_checksheetid,
            'p_name': pro_pic_name,
            'p_url': imageData,
            'p_key': 1,
            'p_value': 'image',
            'p_type': 'image/jpg',
            'flag': 0,
            'Ph_id': 0,
            'it_id': 0,
            'millisecond': time,
            'flowParamData': flowParamData
        });
        //alert1('q_jsonobj: ' + JSON.stringify(q_jsonobj));

        loading();
        cordova.exec(get_user_data_profile_photo, onfail, 'ProfilePhotoPlugin', 'anAction', q_jsonobj);
    }
    catch (e) {
        alert1(e + '_upload_profile_pic_entry');
    }
}

set_profile_pic = (imageData) => {
    if (F7_device == 'ios') {
        //====photo thumbnail issue for iOS after cordove plugin updation [23092021]
        var iosDirectoryPath = localStorage.getItem('iosDirectoryPath');
        var localFile = iosDirectoryPath + imageData;
        var imageData_ios = window.WkWebView.convertFilePath(localFile);

        var smallImage = document.getElementById("img_profile_ios");
        smallImage.src = imageData_ios;
        var menuImage = document.getElementById("menu_img_profile");
        menuImage.src = imageData_ios;
        storage.setItem('profile_pic_path_ios', JSON.stringify(imageData_ios));
    }
    else {
        var smallImage = document.getElementById("img_profile");
        if (smallImage == "" || smallImage == null || smallImage == undefined) { }
        else {
            smallImage.src = imageData;
        }
        var menuImage = document.getElementById("menu_img_profile");
        menuImage.src = imageData;
        storage.setItem('profile_pic_path', JSON.stringify(imageData));
    }
}

// update user profile photo in user json
var Photo_Id_Array = [];
var Cust_Photo_Id_Array = [];
function get_user_data_profile_photo(e) {

    var response = JSON.parse(e);
    var photo_id = response[0].photo_id;
    var curr_file_size_mb = response[0].photo_size;
    var photo_path = response[0].photo_path;

    if (photo_id == '' || photo_id == null || photo_id == undefined) { }
    else {
        Photo_Id_Array.push({ "photo_id": photo_id });
    }

    var company_id = JSON.parse(storage.getItem('company_id'));
    var user_id = JSON.parse(storage.getItem('user_id'));

    var Param_obj = [];
    Param_obj.push({
        'User_Id': user_id,
        'Company_id': company_id,
    });

    var getdata1 = new Webservicecall_REST(global_wcf_url + 'WCF_select_user_master_by_userid', JSON.stringify(Param_obj), onsucess_get_user_data_profile_photo, onfail);
    getdata1.callOtherDomain();
}

function onsucess_get_user_data_profile_photo(invocation1) {
    try {
        var Search_data = invocation1.responseText;
        Search_data = eval('(' + Search_data + ')');
        var message = Search_data[0].message;
        var status = Search_data[0].status;
        if (status == 1) {
            message = message.replace('[[', '[');
            message = message.replace(']]', ']');
            message = eval('(' + Search_data[0].data + ')');

            Data = message[0].UserData;
            Data = eval('(' + Data + ')');

            var checksheet_id = message[0].checksheet_id;

            Autofill_Json_value_profile_photo(Data, checksheet_id);
        }
        else {
            alert1(message);
            loading_hide();
        }
    }
    catch (e) {
        loading_hide();
        alert1(e + '_onsucess_get_user_data_profile_photo()');
    }
}

var download_pro_pic_name;
function Autofill_Json_value_profile_photo(Data, checksheet_id) {

    //var pro_pic_path = JSON.parse(storage.getItem('profile_pic_path'));
    var pro_pic_path = get_profile_pic_path_android_ios();

    var company_id = JSON.parse(storage.getItem('company_id'));
    var user_id = JSON.parse(storage.getItem('user_id'));

    var date_s = new Date();
    var time = date_s.getTime();
    var pro_pic_name = company_id + "_" + user_id + "_" + time + ".jpeg";
    download_pro_pic_name = pro_pic_name;

    var photo_type = localStorage.getItem('Camera_Type');

    if (Photo_Id_Array.length > 0) {
        var photo_id = Photo_Id_Array[Photo_Id_Array.length - 1].photo_id;
    }
    else {
        var photo_id = "";
    }

    var answer = [];
    answer.push(pro_pic_path, pro_pic_name, '', '', photo_id, '', photo_type);

    for (k = 0; k < Data.length; k++) {
        var t_que_id = Data[k].que_id;
        t_que_id = parseInt(t_que_id);

        if (t_que_id == 4008) {
            Data[k].ans = answer;
            break;
        }
    }

    localStorage.setItem('profile_user_data', JSON.stringify(Data));

    Update_user_data_profile_photo(Data, checksheet_id);
}

function Update_user_data_profile_photo(Json_data, checksheet_id) {
    var company_id = JSON.parse(storage.getItem('company_id'));
    var user_id = JSON.parse(storage.getItem('user_id'));

    var Param_obj = [];
    Param_obj.push({
        'CustomerUniqId': "",
        'Company_id': company_id,
        'Subcategory': "User",
        'Step_id': 79071,
        'StepNo': 1,
        'checksheet_id': checksheet_id,
        'Status': 0,
        'Data': Json_data,
        'button': [],
        'createby': user_id,
        'UpdatedBy': user_id,
        "checksheet_type": 7,
        'photo_temp': Photo_Id_Array,
        'Check_User_Upadte_Or_Create': "Update"
    });

    var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_insert_Customer_Master_And_Sub_Type', JSON.stringify(Param_obj), onsucess_Update_Json_data_profile_photo, onfail);
    getdata.callOtherDomain();
}

function onsucess_Update_Json_data_profile_photo(invocation1) {
    var Suc_Message = invocation1.responseText;
    Suc_Message = eval('(' + Suc_Message + ')');
    var status = Suc_Message[0].status;
    var message = Suc_Message[0].message;
    if (status == 1) {

        // now download profile photo when new profile pic uploaded/ change old profile pic (for photo detection) 27092023

        var q_jsonobj = [];
        q_jsonobj.push({
            'tid': 0,
            'que_id': 0,
            'checksheetid': 0,
            'p_name': "",
            'p_url': "",
            'p_key': 1,
            'p_value': 'image',
            'p_type': 'image/jpg',
            'flag': 0,
            'Ph_id': 0,
            'it_id': 0,
            'millisecond': 0,
            'flowParamData': [],
            'is_photo_download': 1,
            'download_pro_pic_name': download_pro_pic_name
        });

        cordova.exec(function (e) {
            alert1("Profile photo has been updated successfully!");
            myApp.accordionClose("#change_photo");
        }, onfail, 'ProfilePhotoPlugin', 'anAction', q_jsonobj);

    }
    else {
        alert1(message);
    }
    loading_hide();
}


function set_detault_profile_pic() {
    var smallImage = document.getElementById("img_profile");
    smallImage.src = "images/profile_pic.png";
}

var myPhotoBrowser;
function get_full_view_profile_pic() {
    try {
        var src = get_profile_pic_path_android_ios();

        myPhotoBrowser = myApp.photoBrowser({
            // navbar: false,
            zoom: false,
            toolbar: false,
            photos: [{
                url: src,
                caption: 'Photo Captured'
            }],
            type: 'popup',
            theme: 'dark',
            captionsTheme: 'dark'
        });

        myPhotoBrowser.open();
    }
    catch (e) {
        //alert1(e + '_get_full_view_profile_pic');
    }
}

// click on image in task listing columndata 18032024 mk
function get_full_view_columndata_pic(src) {
    try {

        myPhotoBrowser = myApp.photoBrowser({
            // navbar: false,
            zoom: false,
            toolbar: false,
            photos: [{
                url: src,
                caption: 'Photo Captured'
            }],
            type: 'popup',
            theme: 'dark',
            captionsTheme: 'dark'
        });

        myPhotoBrowser.open();
    }
    catch (e) { }
}

//function set_selected_profile_pic() {
//    var pro_pic_path = JSON.parse(storage.getItem('profile_pic_path'));
//    if (pro_pic_path == '' || pro_pic_path == null || pro_pic_path == undefined) {
//        var smallImage = document.getElementById("img_profile");
//        smallImage.src = "images/profile_pic.png";
//    } else {
//        var smallImage = document.getElementById("img_profile");
//        smallImage.src = pro_pic_path;
//    }
//}

// convert date from system format to F7 formats
function convert_date_formats_for_F7(date_format) {
    if (date_format == 'MM-dd-yyyy') {
        date_format = 'mm/dd/yyyy';
    }
    else if (date_format == 'dd-MM-yyyy' || date_format == 'dd-MMM-y') {
        date_format = 'dd/mm/yyyy';
    }
    else if (date_format == 'yyyy-MM-dd') {
        date_format = 'yyyy/mm/dd';
    }
    else if (date_format == 'DD, d MM yyyy') {
        date_format = 'DD, d MM yyyy';
    }
    else if (date_format == 'EE-MMM-d-yyyy') {
        date_format = 'D, M d, yyyy';
    }
    else if (date_format == 'EE-d-MMM-yyyy') {
        date_format = 'D, d M yyyy';
    }
    else if (date_format == 'yyyy-MMM-d-EE') {
        date_format = 'yyyy M d, DD';
    }
    else {
        date_format = 'mm/dd/yyyy';
    }
    return date_format;
}

var shortcut_button_array;
var punchout_entry;
var punch_redirect;
// shortcut button click

function update_task_by_shortcut_button(btn_checksheet_id, btn_status, selected_site, selected_tid, selected_start_status, selected_moduleid,
    selected_modulename, selected_site_name, selected_server_task_id, sb_lat, sb_long, sb_survey_date, sb_millisecond, t_submit_message, t_sb_trip, sb_is_mandatory) {

    var button_click = true;
    var data_json = JSON.parse(storage.getItem('list_json'));
    var list_data = JSON.parse(data_json);

    var geofance_flag = list_data[0].geofence[0].value;

    // static geo fence off for syngery 10042024
    geofance_flag = "false";

    if (geofance_flag == "true") {
        // geofence is true

        let geofanceradius = parseInt(list_data[0].geofanceradius);
        var distance = getDistanceFromLatLonInMeter(user_lat, user_long, sb_lat, sb_long);
        distance = parseInt(distance);

        if (distance < (geofanceradius + user_accuracy)) {
            // site is in radius
        } else {
            // site is not in radius     
            button_click = false;
        }
    }

    if (button_click == false) {
        // red site due to geo fence restriction
        $("#lst_" + selected_server_task_id + " .item-content .item-inner").trigger("onclick");
    }
    else {

        // valid shortcut button click
        localStorage.setItem('is_shortcutbutton', 'true');
        localStorage.setItem('task_mode', 'click');

        shortcut_button_array = [];
        shortcut_button_array.push({
            "btn_checksheet_id": btn_checksheet_id,
            "btn_status": btn_status,
            "btn_submit_message": t_submit_message,
            "selected_site": selected_site,
            "selected_tid": selected_tid,
            "selected_start_status": selected_start_status,
            "selected_moduleid": selected_moduleid,
            "selected_modulename": selected_modulename,
            "selected_site_name": selected_site_name,
            "selected_server_task_id": selected_server_task_id,
            "selected_lat": sb_lat,
            "selected_long": sb_long,
            "selected_survey_date": sb_survey_date,
            "millisecond": sb_millisecond,
            "sb_trip": t_sb_trip,
            "sb_is_mandatory": sb_is_mandatory
        });
        localStorage.setItem('shortcut_button_array', JSON.stringify(shortcut_button_array));
        storage.setItem('start_status', JSON.stringify(selected_start_status));

        storage.setItem('server_task_id', JSON.stringify(selected_server_task_id));
        localStorage.setItem('ID_useType22', selected_server_task_id);

        if (btn_checksheet_id == 0) {
            var myArray = [{
                'tid': selected_server_task_id,
                'server_task_id': selected_server_task_id,
                'siteid': selected_site,
                'site_name': selected_site_name,
                'lat': sb_lat,
                'long': sb_long,
                'status': selected_start_status,
                'survey_date': sb_survey_date,
                'millisecond': sb_millisecond
            }];

            storage.setItem('online_task_details', JSON.stringify(myArray));
            check_task_entry(selected_server_task_id);                          //first insert/update task entry then start/stop trip on SB click [06082020]
        }
        else {
            check_action_for_shortcut_button();
        }

    }




    return false;
}

function check_action_for_shortcut_button() {
    try {
        var t_shortcut_button_array = JSON.parse(localStorage.getItem('shortcut_button_array'));
        var t_sb_trip = t_shortcut_button_array[0].sb_trip;
        var t_checksheet_id = t_shortcut_button_array[0].btn_checksheet_id;
        if (t_sb_trip == "start" && t_checksheet_id == "0") {
            myApp.showPreloader('Initializing Trip...');
            var locObj = new MkLocation();
            locObj._getLocation(function (e) {
                temp_location_Array = e;
                setTimeout(function () {
                    start_stop_trip_on_SB_click(0);
                }, 1000);
            });
        }
        else if (t_sb_trip == "stop" && t_checksheet_id == "0") {
            myApp.showPreloader('Finalizing Trip...');
            setTimeout(function () {
                start_stop_trip_on_SB_click(1);
            }, 1000);
        }
        else {
            var data_json = JSON.parse(storage.getItem('list_json'));
            var list_data = JSON.parse(data_json);
            var shortcut_button_mode = list_data[0].shortcut_button_mode;
            if (shortcut_button_mode == "" || shortcut_button_mode == null || shortcut_button_mode == undefined) {
                shortcut_button_mode = "online";
            }
            if (shortcut_button_mode == 'online') {
                check_shortcut_button_mode();
            }
            else {
                if (punchout_entry == '1') {
                    make_punch_out_entry_task();
                }
                else {
                    onsuccess_make_punch_out_entry_task('');
                }
            }
        }
    }
    catch (e) {
        alert1(e + '_check_action_for_shortcut_button');
    }
}

var SB_trip_status;
function start_stop_trip_on_SB_click(trip_status) {
    try {
        storage.setItem('crash_status', JSON.stringify('7'));               //when app is killed before start/stop trip
        localStorage.setItem('trip_status', trip_status);

        SB_trip_status = trip_status;
        //var sp_str = curr_survey_data["shortest_path"];

        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var t_ETA = list_data[0].ETA;
        if (t_ETA == "" || t_ETA == null || t_ETA == undefined) {
            t_ETA = "false";
        }

        try {
            var sp_str = localStorage.getItem('shortest_path');
            if (sp_str == '' || sp_str == null || sp_str == undefined) {
                var odometer_array = [];
            }
            else {
                var sp_array = JSON.parse(decodeURIComponent(sp_str));
                if (trip_status == 0 || sp_array.length == 0) {
                    var odometer_array = [];
                }
                else {
                    var odometer_array = sp_array[0].odometer_point;
                    if (odometer_array.length > 0) {
                        var que_id = odometer_array[0].que_id;
                        var data = curr_survey_data["json"];
                        for (i = 0; i < data.length; i++) {
                            var t_que_id = data[i].que_id;
                            if (t_que_id == que_id) {
                                odometer_array[0].answer = data[i].ans[0];
                                break;
                            }
                        }
                    }
                }
            }
        }
        catch (e) {
            var odometer_array = [];
        }

        var stillviolation_event = curr_survey_data["stillviolation_event"];
        if (stillviolation_event == "" || stillviolation_event == null || stillviolation_event == undefined) {
            stillviolation_event = "false";
        }

        var t_tid = JSON.parse(storage.getItem('tid'));
        var q_jsonobj = [];
        q_jsonobj.push({
            'trip_status': trip_status,
            'tid': t_tid,
            'odometer_point': odometer_array,
            'ETA': t_ETA,
            'stillviolation_event': stillviolation_event
        });
        //alert1(JSON.stringify(q_jsonobj));

        cordova.exec(onsuccess_start_stop_trip_on_SB_click, onfail_start_stop_trip_on_SB_click, 'TripPlugin', 'anAction', q_jsonobj);
    }
    catch (e) {
        alert1(e + '_start_stop_trip_on_SB_click()');
    }
}

function onsuccess_start_stop_trip_on_SB_click(e) {
    try {
        storage.setItem('crash_status', JSON.stringify('0'));
        myApp.hidePreloader();

        if (SB_trip_status == 0) {
            var t_tid = JSON.parse(storage.getItem('tid'));
            var t_ser_task_id = JSON.parse(storage.getItem('server_task_id'));
            localStorage.setItem('trip_status', SB_trip_status);
            localStorage.setItem('trip_tid', t_tid);
            localStorage.setItem('trip_ser_task_id', t_ser_task_id);
        }
        else {
            localStorage.setItem('trip_status', '1');
            localStorage.setItem('trip_tid', '');
            localStorage.setItem('trip_ser_task_id', '');
        }

        var t_shortcut_button_array = JSON.parse(localStorage.getItem('shortcut_button_array'));
        var t_checksheet_id = t_shortcut_button_array[0].btn_checksheet_id;
        if (t_checksheet_id == "0") {
            var data_json = JSON.parse(storage.getItem('list_json'));
            var list_data = JSON.parse(data_json);
            var shortcut_button_mode = list_data[0].shortcut_button_mode;
            if (shortcut_button_mode == "" || shortcut_button_mode == null || shortcut_button_mode == undefined) {
                shortcut_button_mode = "online";
            }
            if (shortcut_button_mode == 'online') {
                check_shortcut_button_mode();
            }
            else {
                if (punchout_entry == '1') {
                    make_punch_out_entry_task();
                }
                else {
                    onsuccess_make_punch_out_entry_task('');
                }
            }
        }
        else {
            //update checksheet status after stop trip
            update_task_status_on_pm_checksheet_submit();
        }
    }
    catch (e) {
        alert1(e + 'onsuccess_start_stop_trip_on_SB_click');
    }
}

function onfail_start_stop_trip_on_SB_click(e) {
    storage.setItem('crash_status', JSON.stringify('0'));
    myApp.hidePreloader();
}

function check_shortcut_button_mode() {
    try {
        var locObj = new MkLocation();
        locObj._getLocation(function (e) {
            var gprs = e[0].gprs;
            if (gprs == '1') {
                if (punchout_entry == '1') {
                    make_punch_out_entry_task();
                }
                else {
                    onsuccess_make_punch_out_entry_task('');
                }
            }
            else {
                alert1("Network is slow or not working, Please check your internet connection !");
            }
        });
    }
    catch (e) {
        alert1(e + '_check_shortcut_button_mode()');
    }
}

function make_punch_out_entry_task() {
    try {
        var t_id = JSON.parse(storage.getItem('tid'));
        var ms = new Date().getTime();

        var is_shortcutbutton = localStorage.getItem('is_shortcutbutton');
        if (is_shortcutbutton == 'true') {
            var t_in_ms = parseInt(in_ms);
            var t_duration = (ms - parseInt(in_ms)) + parseInt(duration);
            duration = t_duration;
            var total_working_time = parseMillisecondsIntoReadableTime(t_duration);
            $('#lbl_count').text(total_working_time);
            clearTimeout(cont_update_punch_ms);
        }
        else {
            punchout_entry = 1;
            var punchin_detail = localStorage.getItem('punchin_detail');
            punchin_detail = JSON.parse(punchin_detail);
            in_ms = punchin_detail[0].in_ms;
            duration = punchin_detail[0].duration;
            var t_in_ms = parseInt(in_ms);
            var t_duration = (ms - parseInt(in_ms)) + parseInt(duration);
            duration = t_duration;
        }

        var query = "UPDATE task_master SET punch_flag = '0', out_ms = '" + ms + "', duration = '" + t_duration + "' where tid = '" + t_id + "'";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            q: "0",
            tid: "0"
        });

        if (is_shortcutbutton == 'true') {
            cordova.exec(onsuccess_make_punch_out_entry_task, onfail_make_punch_out_entry_task, 'SqlitePlugin', 'insertValuse', q_jsonobj);
        }
        else {
            cordova.exec(onssuccess_update_task_outer_button_click, onfail_make_punch_out_entry_task, 'SqlitePlugin', 'insertValuse', q_jsonobj);
        }
    }
    catch (e) {
        alert1(e + '_make_punch_out_entry_task()');
    }
}

function onsuccess_make_punch_out_entry_task(e) {
    // btn_checksheet_id, btn_status, selected_site, selected_tid, selected_start_status, selected_moduleid,
    // selected_modulename, selected_site_name, selected_server_task_id
    try {
        var btn_checksheet_id = shortcut_button_array[0].btn_checksheet_id;
        var btn_status = shortcut_button_array[0].btn_status;
        //var selected_tid = JSON.parse(storage.getItem('tid'));
        var selected_tid = shortcut_button_array[0].selected_tid;
        var selected_site = shortcut_button_array[0].selected_site;
        var selected_start_status = shortcut_button_array[0].selected_start_status;
        var selected_moduleid = shortcut_button_array[0].selected_moduleid;
        var selected_modulename = shortcut_button_array[0].selected_modulename;
        var selected_site_name = shortcut_button_array[0].selected_site_name;
        var selected_server_task_id = shortcut_button_array[0].selected_server_task_id;
        var selected_lat = shortcut_button_array[0].selected_lat;
        var selected_long = shortcut_button_array[0].selected_long;
        var selected_survey_date = shortcut_button_array[0].selected_survey_date;
        var t_millisecond = shortcut_button_array[0].millisecond;

        if (selected_site_name == '' || selected_site_name == null || selected_site_name == undefined) {
            selected_site_name = '';
        }

        if (btn_checksheet_id == '0') {
            var data_json = JSON.parse(storage.getItem('list_json'));
            var list_data = JSON.parse(data_json);
            var survey_mode = list_data[0].survey_mode;
            if (survey_mode == 'online') {
                // update task directly button when no checksheet id is defined (server)
                update_server_task_entry_online_SB(selected_server_task_id);
            }
            else {
                // update task directly button when no checksheet id is defined (local)
                var d = new Date();
                var survey_ms = new Date().getTime();
                var curr_date = getFormattedDate(d);

                var data_json = JSON.parse(storage.getItem('list_json'));
                var list_data = JSON.parse(data_json);
                var match_temp_id = list_data[0].match_temp_id;
                if (match_temp_id == "" || match_temp_id == null || match_temp_id == undefined) {
                    match_temp_id = "";
                }

                if (btn_status == 2) {
                    var query = "UPDATE task_master SET survey_date='" + curr_date + "', step='0', rate='2', survey_ms='" + survey_ms + "', status = '" + btn_status + "', match_temp_id = '" + match_temp_id + "' where tid = '" + selected_tid + "'";
                }
                else {
                    var query = "UPDATE task_master SET survey_date='" + curr_date + "', step='0', rate='2', status = '" + btn_status + "', match_temp_id = '" + match_temp_id + "' where tid = '" + selected_tid + "'";
                }
                //alert1(query);
                var q_jsonobj = [];
                q_jsonobj.push({
                    data: query,
                    q: "2", // call upload task_master_history
                    tid: selected_tid,
                    old_status: selected_start_status
                });
                cordova.exec(onssuccess_update_task_outer_button_click, onfail_update_task_outer_button_click, 'SqlitePlugin', 'insertValuse', q_jsonobj);
            }
        }
        else {
            storage.setItem('tid', JSON.stringify(selected_tid));
            redirect_on_pm_site_click_online_POST(selected_site, selected_site_name, selected_server_task_id, selected_start_status, selected_moduleid, selected_modulename, 0, selected_lat, selected_long, selected_survey_date, t_millisecond);
        }
    }
    catch (e) {
        alert1(e + '_onsuccess_make_punch_out_entry_task()');
    }
}

function onfail_make_punch_out_entry_task(e) { }

function onssuccess_update_task_outer_button_click(e) {
    if (punchout_entry == '1') {
        punch_redirect = 'selection_survey';
        var locObj = new MkLocation();
        locObj._getLocation(function (e) {
            make_punch_out_entry(e);
        });
    }
    else {
        changeurl("selection_survey.html");
    }
}

function onfail_update_task_outer_button_click(e) { }

// make last punch out entry
function make_punch_out_entry(myArray) {
    try {
        var t_id = JSON.parse(storage.getItem('tid'));
        var user_id = JSON.parse(storage.getItem('user_id'));
        var appid = JSON.parse(storage.getItem('appid'));

        var now = new Date();
        var ms = now.getTime();
        var utc_now = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds());
        var utc_ms = utc_now.getTime();
        var lat = myArray[0].lat;
        var long = myArray[0].long;
        var address = myArray[0].address;
        var gprs = myArray[0].gprs;
        var gps = myArray[0].gps;

        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var match_temp_id = list_data[0].match_temp_id;
        if (match_temp_id == "" || match_temp_id == null || match_temp_id == undefined) {
            match_temp_id = "";
        }

        var query = "insert into punch_master(tid, millisecond, UTCmillisecond, username, userid, appid, lat, lon, gprs, gps, address, punch_flag, punch_upload_flag, match_temp_id) values('"
            + t_id + "', '" + ms + "', '" + utc_ms + "', '" + username + "', '" + user_id + "', '" + appid + "', '" + lat + "', '" + long + "', '" + gprs + "', '"
            + gps + "', '" + address + "', '0', '0', '" + match_temp_id + "');";

        //alert1("query: " + query);

        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            q: "0",
            tid: t_id
        });
        cordova.exec(onsuccess_make_punch_out_entry, onfail_make_punch_out_entry, 'SqlitePlugin', 'insertValuse', q_jsonobj);
    } catch (e) {
        alert1(e + '_make_punch_out_entry()');
        loading_hide();
    }
}

function onsuccess_make_punch_out_entry(e) {
    var is_shortcutbutton = localStorage.getItem('is_shortcutbutton');
    if (is_shortcutbutton == 'true') {
        if (punch_redirect == 'selection_survey') {
            changeurl("selection_survey.html");
        }
        else {
            changeurl("viewsitedata.html");
        }
    } else {
        update_task_status_on_pm_checksheet_submit();
    }
}

function onfail_make_punch_out_entry(e) { }


//// online task / sub task 
function open_additional_checksheet_on_SB_click() {
    try {
        var btn_checksheet_id = shortcut_button_array[0].btn_checksheet_id;
        var btn_status = shortcut_button_array[0].btn_status;
        var selected_site = shortcut_button_array[0].selected_site;
        var selected_tid = JSON.parse(storage.getItem('tid'));
        var selected_start_status = shortcut_button_array[0].selected_start_status;
        var selected_moduleid = shortcut_button_array[0].selected_moduleid;
        var selected_modulename = shortcut_button_array[0].selected_modulename;
        var selected_site_name = shortcut_button_array[0].selected_site_name;
        var selected_server_task_id = shortcut_button_array[0].selected_server_task_id;
        var sb_is_mandatory = shortcut_button_array[0].sb_is_mandatory;
        if (sb_is_mandatory == 0) {
            var server_call_flag = 1;
        }
        else {
            var server_call_flag = 0;
        }

        // update task after filling one step of additioal checksheet defined
        storage.setItem('curr_btn_mode', JSON.stringify(''));
        storage.setItem('task_click_mode', JSON.stringify('static'));
        storage.setItem('siteid', JSON.stringify(selected_site));
        storage.setItem('tid', JSON.stringify(selected_tid));
        storage.setItem('start_status', JSON.stringify(selected_start_status));
        storage.setItem('wayflow', JSON.stringify(selected_moduleid));
        storage.setItem('wayflow_name', JSON.stringify(selected_modulename));
        storage.setItem('sitename', JSON.stringify(selected_site_name));
        storage.setItem('type20_cust_id', JSON.stringify(selected_site));
        storage.setItem('type20_cust_name', JSON.stringify(selected_site_name));
        storage.setItem('loc_task_update', "false");

        var flow_Array = JSON.parse(storage.getItem('flow_Array'));
        flow_Array[flow_Array.length - 1].tid = selected_tid;
        flow_Array[flow_Array.length - 1].siteid = selected_site;
        flow_Array[flow_Array.length - 1].start_status = selected_start_status;
        storage.setItem('flow_Array', JSON.stringify(flow_Array));

        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var staticdata = list_data[0].staticdata;
        if (staticdata == "" || staticdata == null || staticdata == undefined) {
            var survey_mode = list_data[0].survey_mode;
            if (survey_mode == 'online') {
                var columndata_str = $('#lst_sys_var_' + selected_server_task_id + '').val();
            }
            else {
                var columndata_str = $('#lst_sys_var_' + selected_tid + '').val();
            }
            var columndata_Array = JSON.parse(decodeURIComponent(columndata_str));
            storage.setItem('type20_columndata', JSON.stringify(columndata_Array));
        }

        //  storage.setItem('check_type', JSON.stringify('4119'));
        storage.setItem('check_type', JSON.stringify(btn_checksheet_id));
        storage.setItem('server_call_flag', JSON.stringify(server_call_flag));
        storage.setItem('checksheet_name', JSON.stringify('reject temp'));
        storage.setItem('c_start_status', JSON.stringify(selected_start_status));
        storage.setItem('end_status', JSON.stringify(btn_status));
        storage.setItem('c_is_disabled', JSON.stringify('0'));
        //storage.setItem('c_is_online', JSON.stringify('0'));                                    //replaced c_is_online '1' to '0' for SB additional checksheet offline issue (TCTS:mk.rider) [28092020]
        storage.setItem('c_is_online', JSON.stringify('1'));                                    //replaced c_is_online '0' to '1' for ATC Transport 27072021

        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var shortcut_button_mode = list_data[0].shortcut_button_mode;
        if (shortcut_button_mode == "" || shortcut_button_mode == null || shortcut_button_mode == undefined) {
            shortcut_button_mode = "online";
        }
        if (shortcut_button_mode == "online") {
            storage.setItem('c_is_online', JSON.stringify('1'));
        }
        else {
            storage.setItem('c_is_online', JSON.stringify('0'));
        }

        var new_checksheet_list = [];
        new_checksheet_list.push({
            'checksheetid': btn_checksheet_id,
            'start_status': '0',
            'end_status': btn_status,
            'is_flow': '',
            'is_submited': '0',
            'sub_flow_id': '0'
        });
        storage.setItem('new_checklist', JSON.stringify(new_checksheet_list));

        var last_step = 1;
        var temp_step_Array = [];
        for (i = 1; i <= last_step; i++) {
            temp_step_Array.push(i); // push steps in array upto last step
        }

        //skipping viewsitelistgroulist.html
        storage.setItem('tid', JSON.stringify(selected_tid));
        storage.setItem('task_id', JSON.stringify(''));
        storage.setItem('server_task_id', JSON.stringify(selected_server_task_id));
        storage.setItem('step_Array_to_read', JSON.stringify(temp_step_Array));

        localStorage.setItem('server_task_id_SB', selected_server_task_id);
        if (punchout_entry == '1') {
            punch_redirect = 'viewsitedata';
            var locObj = new MkLocation();
            locObj._getLocation(function (e) {
                make_punch_out_entry(e);
            });
        }
        else {
            changeurl("viewsitedata.html");
        }
    }
    catch (e) {
        alert1(e + 'open_additional_checksheet_on_SB_click()');
    }
}


// update task status online on shortcut button click
function update_server_task_entry_online_SB(selected_server_task_id) {
    try {
        loading();
        var company_id = JSON.parse(storage.getItem('company_id'));
        var user_id = JSON.parse(storage.getItem('user_id'));

        var task_mode = localStorage.getItem('task_mode');
        if (task_mode == "delete") {
            var btn_status = '-1';                          //delete task issue [21072020]
        }
        else {
            var shortcut_button_array = JSON.parse(localStorage.getItem('shortcut_button_array'));
            if (shortcut_button_array == "" || shortcut_button_array == null || shortcut_button_array == undefined) {
                //to remove sub task from online task listing
                var btn_status = JSON.parse(storage.getItem('end_status'));
            }
            else {
                var btn_checksheet_id = shortcut_button_array[0].btn_checksheet_id;
                if (btn_checksheet_id == '0') {
                    var btn_status = shortcut_button_array[0].btn_status;
                }
                else {
                    var btn_status = JSON.parse(storage.getItem('end_status'));
                }
            }
        }

        var siteid = JSON.parse(storage.getItem('siteid'));
        var check_type = JSON.parse(storage.getItem('check_type'));
        var flow_id = JSON.parse(storage.getItem('wayflow'));
        var start_status = JSON.parse(storage.getItem('start_status'));

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
            'servertaskid': selected_server_task_id,
            'status': btn_status,
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

        var getdata = new Webservicecall_REST(global_wcf_url + 'WCFTechnicianDataUpload', JSON.stringify(param_obj), onsuccess_update_server_task_entry_online_SB, onfail_update_server_task_entry_online_SB);
        getdata.callOtherDomain();

    }
    catch (e) {
        alert1(e + '_update_server_task_entry_online_SB()');
    }
}

function onsuccess_update_server_task_entry_online_SB(e) {
    try {
        var res_text = e.responseText;
        var result = eval('(' + res_text + ')');
        var message = result[0].message;
        var status = result[0].status;
        if (status == 1) {
            loading_hide();

            var locObj = new MkLocation();
            locObj._addWaypoint("status_change");

            var shortcut_button_array = JSON.parse(localStorage.getItem('shortcut_button_array'));
            if (shortcut_button_array == "" || shortcut_button_array == null || shortcut_button_array == undefined) {
                //to remove sub task from online task listing
                changeurl("selection_survey.html");
            }
            else {
                var submit_message = shortcut_button_array[0].btn_submit_message;
                if (submit_message == '' || submit_message == null || submit_message == undefined) { }
                else {
                    alert1(submit_message);
                }
                var btn_checksheet_id = shortcut_button_array[0].btn_checksheet_id;
                if (btn_checksheet_id == '0') {
                    changeurl("selection_survey.html");
                }
                else {
                    back_button('viewsitelist_pm_grouplist');
                }
            }
        }
        else {
            alert1(message);
            loading_hide();
        }
    }
    catch (e) {
        alert1(e + '_onsuccess_update_server_task_entry_online_SB()');
    }
}

function onfail_update_server_task_entry_online_SB() {
    loading_hide();
    alert1("Network Error, Please Try Again !");
}

function save_global_variables_PV_online() {
    try {
        loading();

        var company_id = JSON.parse(storage.getItem('company_id'));
        var user_id = JSON.parse(storage.getItem('user_id'));
        var selected_server_task_id = JSON.parse(storage.getItem('server_task_id'));
        var global_var_obj = localStorage.getItem('global_var_obj');
        var param_obj = [];
        param_obj.push({
            'Company_Id': company_id,
            'User_Id': user_id,
            'server_task_id': selected_server_task_id,
            'global_var': global_var_obj
        });

        var sp_obj = [];
        sp_obj.push({
            'sp_name': "SaveGlobalVarAndStep_Port",
            'param': param_obj
        });

        var getdata = new webservice_inner_call(sp_obj, check_and_redirect_subflow_on_submit, onfail_save_global_variables_PV);
    }
    catch (e) {
        alert1(e + '_save_global_variables_PV_online()');
    }
}












/// unused code
////SB = shortcut buttons
//function check_local_task_entry_for_SB(selected_tid) {
//    try {
//        var query = "select global_var from task_master where tid = '" + selected_tid + "'";
//        alert1("query: " + query);
//        var q_jsonobj = [];
//        q_jsonobj.push({
//            data: query,
//            p: "0"
//        });
//        cordova.exec(onsuccess_check_local_task_entry_for_SB, onfail_check_local_task_entry_for_SB, 'SqlitePlugin', 'showValues', q_jsonobj);
//    } catch (e) {
//        alert1(e + 'check_local_task_entry_for_shortcut_buttons()');
//        loading_hide();
//    }
//}

//function onsuccess_check_local_task_entry_for_SB(e) {
//    alert1("Old Task Entry Found ! - Update Task details...");
//    try {
//        alert1(e);
//        if (e == '' || e == null || e == undefined || e == ' ') {
//            var global_var = '';
//        } else {
//            var global_var = JSON.parse(e);
//        }
//        update_server_task_entry_online_SB(global_var);
//    } catch (e) {
//        alert1(e + '_onsuccess_check_local_task_entry_for_SB()');
//    }
//}
//function onfail_check_local_task_entry_for_SB(e) {
//    alert1("Old Task Entry Not Found ! Insert Task details...");
//}
