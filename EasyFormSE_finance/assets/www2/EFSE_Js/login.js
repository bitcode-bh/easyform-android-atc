/*-----start---------*/

function toHex(int) {
    var hex = int.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}
function RgbTohex(color) {
    var arr = []; color.replace(/[\d+\.]+/g, function (v) { arr.push(parseFloat(v)); });
    return {
        hex: "#" + arr.slice(0, 3).map(toHex).join(""),
        opacity: arr.length == 4 ? arr[3] : 1
    };
}

function get_support_detail() {
    try {
        let theme_color = $("#btn_login_theme").css("background-color");
        theme_color = RgbTohex(theme_color);
        theme_color = theme_color.hex;
        var q_jsonobj = [];
        q_jsonobj.push({
            "themecolor": theme_color
        });
        cordova.exec(success_get_support_detail, fail_get_support_detail, 'SqlitePlugin', 'cntct_info', q_jsonobj);
    } catch (e) {
        alert1(e + "_support_detail()");
    }
}

function success_get_support_detail(e) {
    try {
        var myArray = JSON.parse(e);
        var responseText = myArray[0].responseText;
        var app_url = myArray[0].url;
        var video_url = myArray[0].videourl;
        var wcf_url = myArray[0].wcfurl;

        var LOGINWCFURL = myArray[0].LOGINWCFURL;
        var DOWNLOADWCFURL = myArray[0].DOWNLOADWCFURL;
        var UPLOADWCFURL = myArray[0].UPLOADWCFURL;
        var GEOWCFURL = myArray[0].GEOWCFURL;
        var TASKDOWNLOADURL = myArray[0].TASKDOWNLOADURL;
        var packageName = myArray[0].packageName;
        var resumable_url = myArray[0].resumableurl;
        common_global_wcf_url = myArray[0].common_wcf_url;

        var SSL = myArray[0].SSL;
        var ADDRESSAPI = myArray[0].ADDRESSAPI;
        var TRIPMAPBACK = myArray[0].TRIPMAPBACK;
        var MOCKLOCATION = myArray[0].MOCKLOCATION;
        var Appinstalldate = myArray[0].Appinstalldate;
        var Appupgradedate = myArray[0].Appupgradedate;
        var EVENTS = myArray[0].EVENTS;

        //custom development for vodafone metal
        //var package_name = myArray[0].packageName;
        //if (package_name == "com.easyform.vodafone" || package_name == "com.easyform.viu") {
        //    $("#header_right_img_logo").show();
        //}

        if (app_url == '' || app_url == null || app_url == undefined) {
            var check_app_url = 0;
        }
        else {
            var check_app_url = 1;

            if (resumable_url == '' || resumable_url == null || resumable_url == undefined) {
                resumable_url = '';
            }
            if (common_global_wcf_url == '' || common_global_wcf_url == null || common_global_wcf_url == undefined) {
                common_global_wcf_url = '';
            }

            storage.setItem('global_url', JSON.stringify(app_url));
            storage.setItem('global_wcf_url', JSON.stringify(wcf_url));
            storage.setItem('global_resumable_url', JSON.stringify(resumable_url));
            storage.setItem('common_global_wcf_url', JSON.stringify(common_global_wcf_url));
            support_app_url = app_url;
            support_video_url = video_url;
            support_wcf_url = wcf_url;

            support_LOGINWCFURL = LOGINWCFURL;
            support_DOWNLOADWCFURL = DOWNLOADWCFURL;
            support_UPLOADWCFURL = UPLOADWCFURL;
            support_GEOWCFURL = GEOWCFURL;
            support_TASKDOWNLOADURL = TASKDOWNLOADURL;
            support_packageName = packageName;

            support_resumable_url = resumable_url;
            support_common_global_wcf_url = common_global_wcf_url;
            support_SSL = SSL;
            support_ADDRESSAPI = ADDRESSAPI;
            support_TRIPMAPBACK = TRIPMAPBACK;
            support_MOCKLOCATION = MOCKLOCATION;
            support_Appinstalldate = Appinstalldate;
            support_Appupgradedate = Appupgradedate;
            support_EVENTS = EVENTS;

        }
        responseText = JSON.parse(responseText);
        if (responseText[0].status == 1) {
            $("#test_support").css("white-space", "pre");
            var message_temp = responseText[0].message;
            var json_temp = JSON.parse(message_temp);
            var json_data = JSON.parse(json_temp);
            var skip_download = json_data[0].skip_download;
            support_skip_download = skip_download;

            ///////
            //var chk_skip_down = JSON.parse(storage.getItem('chk_skip_down'));
            //if ((chk_skip_down == '' || chk_skip_down == null || chk_skip_down == undefined) && chk_skip_down != false) {
            //    if (skip_download == 'true') {
            //        storage.setItem('chk_skip_down', JSON.stringify(true));
            //    }
            //    else {
            //        storage.setItem('chk_skip_down', JSON.stringify(false));
            //    }
            //}
            //var skip_button_str = json_data[0].skip_button_str;
            //localStorage.setItem('skip_button_str', skip_button_str);

            var profile_menu_alignment = json_data[0].profile_menu_alignment;
            localStorage.setItem('profile_menu_alignment', profile_menu_alignment);
            var profile_menu_hide = json_data[0].profile_menu_items;
            localStorage.setItem('profile_menu_hide', profile_menu_hide);
            //////////

            var support_code_new = json_data[0].loging_html_code;
            if (support_code_new == '' || support_code_new == null || support_code_new == undefined) {
                support_code_new = 'N/A';
            }
            if (check_app_url == 0) {
                var URL_app_portal = json_data[0].URL_app_portal;
                if (URL_app_portal == '' || URL_app_portal == null || URL_app_portal == undefined) {
                    alert1("App URL is not defined, Please add App URL in company details !");
                }
                else {
                    storage.setItem('global_url', JSON.stringify(URL_app_portal + "/services/"));
                }
            }

            storage.setItem('support_refrences1', JSON.stringify(support_code_new));
            //var t_support_code_new = JSON.parse(storage.getItem('support_refrences1'));

            //t_support_code_new = t_support_code_new.replace(/\(/g, '(\'');
            //t_support_code_new = t_support_code_new.replace(/\)/g, '\')');
            //document.getElementById("test_support").innerHTML = t_support_code_new;

            support_refrences = JSON.parse(storage.getItem('support_refrences1'));

            var bottom_img = json_data[0].App_Icon_login_Bottom_Show;
            if (bottom_img == '' || bottom_img == null || bottom_img == undefined || bottom_img == "data:,") {
                localStorage.setItem('Login_Bottom_Image', '');
            }
            else {
                //$("#img_bottom").show();
                //$("#img_bottom").attr("src", "data:image/png;base64," + bottom_img + "");

                //var param_onerror = "hide_bottom_image_onerror()";
                //$("#img_bottom").attr("onerror", param_onerror);
                //localStorage.setItem('Login_Bottom_Image', bottom_img);
            }

            //var idea_icon = json_data[0].idea_icon;
            //if (idea_icon == "" || idea_icon == null || idea_icon == undefined) {
            //    idea_icon = "false";
            //}
            //localStorage.setItem('idea_icon', idea_icon);


            //if (idea_icon == "true") {
            //    $("#header_right_img_logo").show();
            //}

            if (login_btn_clicked == 0) {
                display_support_details();
            }
            else {
                // login button clicked and call for support
                getButtonValue();
            }
        }
        //else {
        //    storage.setItem('chk_skip_down', JSON.stringify(false));
        //}

        var app_info_Array = [];
        app_info_Array.push({
            'version': version,
            'app_url': support_app_url,
            'video_url': support_video_url,
            'wcf_url': support_wcf_url,
            'appid': appid,
            'skip_download': skip_download,
            'LOGINWCFURL': LOGINWCFURL,
            'DOWNLOADWCFURL': DOWNLOADWCFURL,
            'UPLOADWCFURL': UPLOADWCFURL,
            'GEOWCFURL': GEOWCFURL,
            'TASKDOWNLOADURL': TASKDOWNLOADURL,
            'packageName': packageName,
            'resumable_url': resumable_url,
            'common_global_wcf_url': common_global_wcf_url,
            'SSL': SSL,
            'ADDRESSAPI': ADDRESSAPI,
            'TRIPMAPBACK': TRIPMAPBACK,
            'MOCKLOCATION': MOCKLOCATION,
            'Appinstalldate': Appinstalldate,
            'Appupgradedate': Appupgradedate,
            'EVENTS': EVENTS
        });

        localStorage.setItem('pre_app_info', JSON.stringify(app_info_Array));
        enable_back_button();

        if (F7_device == 'ios') {
            var ios_device = localStorage.getItem('ios_device');
            if (ios_device == '' || ios_device == null || ios_device == undefined) {
                check_iphone_ipad();
            }
        }
    } catch (e) {
        alert1(e + "_success_get_support_detail");
    }
}

function display_support_details() {
    try {
        var t_support_code_new = JSON.parse(storage.getItem('support_refrences1'));
        if (t_support_code_new == "" || t_support_code_new == null || t_support_code_new == undefined) {
            t_support_code_new = "N/A";
        }
        else {
            t_support_code_new = t_support_code_new.replace(/\(/g, '(\'');
            t_support_code_new = t_support_code_new.replace(/\)/g, '\')');
        }
        document.getElementById("test_support").innerHTML = t_support_code_new;

        //var bottom_img = localStorage.getItem('Login_Bottom_Image');
        //if (bottom_img == '' || bottom_img == null || bottom_img == undefined || bottom_img == "data:,") { }
        //else {
        //    $("#img_bottom").show();
        //    $("#img_bottom").attr("src", "data:image/png;base64," + bottom_img + "");

        //    var param_onerror = "hide_bottom_image_onerror()";
        //    $("#img_bottom").attr("onerror", param_onerror);
        //}

        //var idea_icon = localStorage.getItem('idea_icon');
        //if (idea_icon == "" || idea_icon == null || idea_icon == undefined) {
        //    idea_icon = "false";
        //}
        //if (idea_icon == "true") {
        //    $("#header_right_img_logo").show();
        //}
    }
    catch (e) {
        alert1(e + '_display_support_details()');
    }
}

//function hide_bottom_image_onerror() {
//    $("#img_bottom").hide();
//}

function fail_get_support_detail(e) { }

function check_iphone_ipad() {
    var q_jsonobj = [];
    cordova.exec(onsuccess_check_iphone_ipad, onfail_check_iphone_ipad, 'detectDeviceIphoneOrIpadPlugin', 'anAction', q_jsonobj);
}

function onsuccess_check_iphone_ipad(e) {
    var myArray = JSON.parse(e);
    var device = myArray[0].device;
    localStorage.setItem('ios_device', device);
}

function onfail_check_iphone_ipad(e) {
    loading_hide();
    alert1(e + '_onfail_check_iphone_ipad()');
}

/*-------end ----*/

function get_imei() {
    //storage.setItem('id_Array', JSON.stringify(''));
    //storage.setItem('level_Array', JSON.stringify(''));

    // Get IMEI Number
    try {
        var query = "select imei, appid, servermilli from Login_Master";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "3"	// p=3 for user lat long entry on login page load
        });
        cordova.exec(success_get_imei, fail_get_imei, 'SqlitePlugin', 'showValues', q_jsonobj);
    } catch (e) {
        //alert1(e + '_error_success_get_imei');
        alert1("Please swipe screen off and on...");
    }
}

function success_get_imei(e) {
    var myArray = JSON.parse(e);
    imeino = myArray[0].imei;

    // 3d.cksiteeng
    //imeino = 'e6ae1e49-b480-4ca2-8422-95e909bff238';

    // 3d.kpce
    //imeino = 'be838c85-d81f-44cc-83e7-a1106d19b7e7';

    // 3d.kprpm
    //imeino = 'e6ae1e49-b480-4ca2-8422-95e909bff238';

    $("#lbl_IMEI").html(imeino);

    appid = myArray[0].appid;
    servermilli = myArray[0].servermilli;

    // checking and resolving crash problem
    var crash_status = JSON.parse(storage.getItem('crash_status'));
    //alert1("crash_status: " + crash_status);
    if (crash_status == null || crash_status == undefined || crash_status == '' || crash_status == 0) {
        crash_status = 0;
        //check_remember_me();
        storage.setItem('curr_btn_mode', JSON.stringify(''));
        storage.setItem('id_Array', JSON.stringify(''));
        storage.setItem('level_Array', JSON.stringify(''));

        storage.setItem('list_json', JSON.stringify(''));
        storage.setItem('cust_flow_Array', JSON.stringify(''));

        get_version_details();
    } else if (crash_status == 1) {
        // application has been crashed when capture last photo
        var camera_type = JSON.parse(storage.getItem('camera_type'));
        if (camera_type == '28') {
            storage.setItem('crash_status', JSON.stringify('0'));
            get_version_details();
        }
        else {
            // photo crash redirect
            changeurl("viewsitedata.html");
        }
    } else if (crash_status == 2) {
        // application has been crashed when view map
        changeurl("selection_survey.html");
    } else if (crash_status == 3) {
        // application has been crashed during RF Tracking plugin call
        changeurl("viewsitedata.html");
    } else if (crash_status == 6) {
        // application has been crashed when capture last photo (in task form)
        changeurl("viewsitedata_task.html");
    } else if (crash_status == 7) {
        //when app is killed before start/stop trip
        curr_survey_data["shortest_path"] = localStorage.getItem('shortest_path');
        curr_survey_data["json"] = localStorage.getItem('json');
        form_flag = localStorage.getItem('form_flag');
        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var auto_trip = list_data[0].auto_trip;
        if (auto_trip == 'true') {
            //var trip_status = localStorage.getItem('trip_status');
            //if (trip_status == 0) {
            //    start_stop_trip(trip_status);
            //}
            //else {
            //    changeurl("viewsitedata.html");
            //}

            changeurl("viewsitedata_task.html");

        }
        else {
            changeurl("viewsitedata.html");
        }
    }
    ////
}

// get current version details
function get_version_details() {
    try {
        var q_jsonobj = [];
        cordova.exec(onsuccess_get_version_details, onfail_get_version_details, 'version_plug', 'nck', q_jsonobj);
    } catch (e) {
        alert1(e + '_get_version_details');
    }
}

// onsuccess get current version details
function onsuccess_get_version_details(e) {
    try {
        var myArray = JSON.parse(e);

        version = myArray[0].version;
        var internet = myArray[0].internet;

        localStorage.setItem("version", version);

        // store urls in login page load also (other than support success) 24032022
        //(unable to change urls in page load as support call is executed once in a day, hense it will update urls on the next day)

        var app_url = myArray[0].url;
        var video_url = myArray[0].videourl;
        var wcf_url = myArray[0].wcfurl;

        var LOGINWCFURL = myArray[0].LOGINWCFURL;
        var DOWNLOADWCFURL = myArray[0].DOWNLOADWCFURL;
        var UPLOADWCFURL = myArray[0].UPLOADWCFURL;
        var GEOWCFURL = myArray[0].GEOWCFURL;
        var TASKDOWNLOADURL = myArray[0].TASKDOWNLOADURL;
        var packageName = myArray[0].packageName;
        var resumable_url = myArray[0].resumableurl;
        common_global_wcf_url = myArray[0].common_wcf_url;

        var SSL = myArray[0].SSL;
        var ADDRESSAPI = myArray[0].ADDRESSAPI;
        var TRIPMAPBACK = myArray[0].TRIPMAPBACK;
        var MOCKLOCATION = myArray[0].MOCKLOCATION;
        var Appinstalldate = myArray[0].Appinstalldate;
        var Appupgradedate = myArray[0].Appupgradedate;
        var EVENTS = myArray[0].EVENTS;

        if (resumable_url == '' || resumable_url == null || resumable_url == undefined) {
            resumable_url = '';
        }
        if (common_global_wcf_url == '' || common_global_wcf_url == null || common_global_wcf_url == undefined) {
            common_global_wcf_url = '';
        }

        storage.setItem('global_url', JSON.stringify(app_url));
        storage.setItem('global_wcf_url', JSON.stringify(wcf_url));
        storage.setItem('global_resumable_url', JSON.stringify(resumable_url));
        storage.setItem('common_global_wcf_url', JSON.stringify(common_global_wcf_url));
        support_app_url = app_url;
        support_video_url = video_url;
        support_wcf_url = wcf_url;

        support_LOGINWCFURL = LOGINWCFURL;
        support_DOWNLOADWCFURL = DOWNLOADWCFURL;
        support_UPLOADWCFURL = UPLOADWCFURL;
        support_GEOWCFURL = GEOWCFURL;
        support_TASKDOWNLOADURL = TASKDOWNLOADURL;
        support_packageName = packageName;

        support_resumable_url = resumable_url;
        support_common_global_wcf_url = common_global_wcf_url;
        support_SSL = SSL;
        support_ADDRESSAPI = ADDRESSAPI;
        support_TRIPMAPBACK = TRIPMAPBACK;
        support_MOCKLOCATION = MOCKLOCATION
        support_Appinstalldate = Appinstalldate;
        support_Appupgradedate = Appupgradedate;
        support_EVENTS = EVENTS;

        var app_info = localStorage.getItem('pre_app_info');
        if (app_info == '' || app_info == null || app_info == undefined) {
            var skip_download = "true";
        }
        else {
            app_info = JSON.parse(app_info);
            var skip_download = app_info[0]["skip_download"];
        }

        var app_info_Array = [];
        app_info_Array.push({
            'version': version,
            'app_url': support_app_url,
            'video_url': support_video_url,
            'wcf_url': support_wcf_url,
            'appid': appid,
            'skip_download': skip_download,
            'LOGINWCFURL': LOGINWCFURL,
            'DOWNLOADWCFURL': DOWNLOADWCFURL,
            'UPLOADWCFURL': UPLOADWCFURL,
            'GEOWCFURL': GEOWCFURL,
            'TASKDOWNLOADURL': TASKDOWNLOADURL,
            'packageName': packageName,
            'resumable_url': resumable_url,
            'common_global_wcf_url': common_global_wcf_url,
            'SSL': SSL,
            'ADDRESSAPI': ADDRESSAPI,
            'TRIPMAPBACK': TRIPMAPBACK,
            'MOCKLOCATION': MOCKLOCATION,
            'Appinstalldate': Appinstalldate,
            'Appupgradedate': Appupgradedate,
            'EVENTS': EVENTS,
            'CHECKSHEET': myArray[0].CHECKSHEET,
            'COUNTERTASK': myArray[0].COUNTERTASK,
            'FLOWMASTER': myArray[0].FLOWMASTER,
            'InsertUpdtae_maintask': myArray[0].InsertUpdtae_maintask,
            'Insert_Update_Punchmaster': myArray[0].Insert_Update_Punchmaster,
            'QuestionMaster_log': myArray[0].QuestionMaster_log,
            'TASKDOWNLOAD_ATER_USERSWAP': myArray[0].TASKDOWNLOAD_ATER_USERSWAP,
            'TASKMASTERDOWNLOAD': myArray[0].TASKMASTERDOWNLOAD,
            'TASKUPDTAE_ATER_USERSWAP': myArray[0].TASKUPDTAE_ATER_USERSWAP,
            'TECHNICIAN_UPLOAD': myArray[0].TECHNICIAN_UPLOAD,
            'TOTALCOUNTDOWNLOAD': myArray[0].TOTALCOUNTDOWNLOAD,
            'USERDEFINEFLOWMASTER': myArray[0].USERDEFINEFLOWMASTER
        });
        localStorage.setItem('pre_app_info', JSON.stringify(app_info_Array));

        ///////////////////////////////////////////




        //$("#lbl_version").html(version);
        //var Contact_Number = JSON.parse(storage.getItem('contactno'));
        //if (Contact_Number == "" || Contact_Number == null || Contact_Number == undefined) {
        //    Contact_Number = "(Not Available)";
        //}
        //$("#lbl_contactno").html(Contact_Number);

        //var email_id = JSON.parse(storage.getItem('email_id'));
        //if (email_id == "" || email_id == null || email_id == undefined) {
        //    email_id = "easyformsupport@skyproductivity.com";
        //}
        //$("#lbl_email").html(email_id);

        check_remember_me(internet);
    } catch (e) {
        alert1(e + '_onsuccess_get_version_details()');
    }
}

function onfail_get_version_details(e) {
    loading_hide();
    alert1(e + '_onfail_get_version_details');
}

// check remember me feature
function check_remember_me(internet) {
    var rm_username = JSON.parse(storage.getItem('rm_username'));
    var rm_password = JSON.parse(storage.getItem('rm_password'));
    if (rm_username == null || rm_password == null) {
        //		alert1("remember me checkbox remains unchecked")

        var t_global_wcf_url = JSON.parse(storage.getItem('global_wcf_url'));
        if (t_global_wcf_url.indexOf("http://app.muvr.in/") > -1) {
            // display signup button for only development and login url 14112022
            $("#btnSignup").show();                                              // show signup button for valid user
        }

    } else {
        var rm_mili = JSON.parse(storage.getItem('rm_mili'));
        if (rm_mili == null || rm_mili == undefined || rm_mili == '') {
            // session is not exist

            // 30052023
            $('.floated').addClass('not-empty-state');
            $('#txtusername').val(rm_username);
            $('#txtpassword').val(rm_password);
            $('#chk_remember_me').prop('checked', true);
            $("#btnSignup").hide();                                              // hide signup button for valid user

        } else {
            // session is exist
            var d = new Date();
            var new_ms = d.getTime();
            var ms = new_ms - rm_mili;
            // check 24 hour session
            //if (ms >= 86400000) {
            //    //	alert1("Session Expired !")
            //    // clear username, password and tick checkbox while expire session
            //    $('#txtusername').val('');
            //    $('#txtpassword').val('');
            //    $('#chk_remember_me').prop('checked', false);
            //    storage.setItem('rm_mili', JSON.stringify(''));
            //} else {
            //alert1("Session Not Expired !")
            if (internet == 1) {
                // autofill username, password and tick checkbox
                // remember me & online

                $('.floated').addClass('not-empty-state');
                $('#txtusername').val(rm_username);
                $('#txtpassword').val(rm_password);
                $('#chk_remember_me').prop('checked', true);
                $("#btnSignup").hide();                                              // hide signup button for valid user

                $("#btn_login_biometric").show();
                show_biometric();
            } else {
                // remember me & offline
                changeurl("selection.html");
            }

            //   }
        }
    }

    //make support detail call once in day (when new day start)
    var d = new Date();
    var curr_date = d.toDateString();
    var last_supportCall_date = localStorage.getItem("supportCall_date");
    if (last_supportCall_date == "" || last_supportCall_date == null || last_supportCall_date == undefined) {
        localStorage.setItem("supportCall_date", curr_date);
        get_support_detail();
    }
    else {
        if (curr_date != last_supportCall_date) {
            localStorage.setItem("supportCall_date", curr_date);
            get_support_detail();
        }
        else {
            //display support details(help+bottomLogo) without support service call [03092020]
            display_support_details();
        }
    }

    loading_hide();
}

function fail_get_imei(e) {
    alert1(e + '_fail_get_imei');
}

//change downloading label automatically
//function starttimer() {
//    var wait_label = document.getElementById("lbl_logging");
//    wait_label.innerHTML = wait_label.innerHTML == "Logging In..." ? "Please Wait..." : "Logging In...";
//}

function mk_check_SpecialChar(input) {
    var alphanumers = /^[a-zA-Z0-9. ]+$/;
    return alphanumers.test(input);
    //	if(!alphanumers.test(input)){
    //	    return false;
    //	}
    //	else{
    //		return true;
    //	}
}

// login button click
function getButtonValue() {
    try {

        var clickedLink = $("#btn_login_theme");
        myApp.popover('.popover-login', clickedLink);


        if (version == '' || version == null || version == undefined || imeino == '' || imeino == null || imeino == undefined) {
            // version not set due to certain reason
            get_imei();
        } else {

            //flush all storage values
            //	$.jStorage.flush();

            // Remember me part
            //var chk_rm_status = $('#chk_remember_me').is(':checked');
            //if (chk_rm_status == true) {
            //    var rm_username = $('#txtusername').val();
            //    var rm_password = $('#txtpassword').val();
            //    storage.setItem('rm_username', JSON.stringify(rm_username));
            //    storage.setItem('rm_password', JSON.stringify(rm_password));

            //    // set start session time
            //    var rm_mili = JSON.parse(storage.getItem('rm_mili'));
            //    if (rm_mili == null || rm_mili == undefined || rm_mili == '') {
            //        var d = new Date();
            //        var ms = d.getTime();
            //        storage.setItem('rm_mili', JSON.stringify(ms));
            //    }
            //} else {
            //    // user unchecked remember me checkbox
            //    storage.setItem('rm_username', JSON.stringify(''));
            //    storage.setItem('rm_password', JSON.stringify(''));
            //    storage.setItem('rm_mili', JSON.stringify(''));
            //}
            ////////////

            uniqcode = Math.random().toString(36).substring(0, 8);
            storage.setItem('uniqcode', JSON.stringify(uniqcode));
            storage.setItem('imeino', JSON.stringify(imeino));

            user = $('#txtusername').val();
            user = user.toLowerCase();
            storage.setItem('username', JSON.stringify(user));
            password_valid = $('#txtpassword').val();

            if (user != '' && password_valid != '') {
                var t_global_wcf_url = JSON.parse(storage.getItem('global_wcf_url'));
                if (t_global_wcf_url == '' || t_global_wcf_url == null || t_global_wcf_url == undefined) {
                    login_btn_clicked = 1;
                    get_support_detail();
                }
                else {
                    loading();

                    myApp.setProgressbar('#login_progressbar', 0);
                    $("#lbl_progress_details").html("Authenticating user");

                    var rpass = $('#txtpassword').val();
                    //var hash = CryptoJS.SHA256(rpass);
                    //var pass = hash.toString(CryptoJS.enc.Base64);

                    // new encryption 05032021
                    var pass = EncryptData(rpass, "sky123");

                    if (servermilli == "" || servermilli == null || servermilli == undefined || servermilli == "null") {
                        servermilli = 0;
                    }

                    var last_user = JSON.parse(storage.getItem('last_username'));
                    username = JSON.parse(storage.getItem('username'));
                    if (username == last_user || last_user == '' || last_user == null || last_user == undefined) {
                        // current user & previous users are same
                    }
                    else {
                        // current user & previous users are not same (check for upload)
                        appid = 0;
                    }

                    let time_zone = Intl.DateTimeFormat().resolvedOptions().timeZone;

                    var login_obj = [];
                    login_obj.push({
                        'log_flag': 'login',
                        'username_': user,
                        'password_': pass,
                        // 'password1_': password_valid,     // commented on 08/03/2021
                        'uniq_code': uniqcode,
                        'imeino': imeino,
                        'appid': appid,
                        'version': version,
                        'servermilli': servermilli,
                        'otp': "",
                        'time_zone': time_zone
                    });
                    //alert1(JSON.stringify(login_obj));

                    localStorage.setItem('view_biometric', 'true');

                    cordova.exec(default_login_response, onfail, 'SqlitePlugin', 'login_detail_plug1', login_obj);
                }
            } else {
                if (F7_device == 'android') {
                    alert1('Please enter username or password !');
                }
                else {
                    mk_notify('Please enter username or password !');
                }
            }
        }
    } catch (e) {
        loading_hide();
        alert1(e);
    }
}

function default_login_response(invocation) {
    updateuniquecode_android(invocation, "default");
}

function updateuniquecode_android(invocation, res_type) {
    try {
        //alert1(invocation);
        //var result = eval('(' + invocation.responseText + ')');
        var response = eval('(' + invocation + ')');
        var result = eval('(' + response[0].responseText + ')');

        //alert1(JSON.stringify(result));

        //result[0].Threshold = "";
        //response[0].gps = 1;

        if (result[0].status == 1) {

            clear_localStorage();

            myApp.setProgressbar('#login_progressbar', 10);
            $("#lbl_progress_details").html("Check for required app");

            localStorage.setItem("last_login_function", "getButtonValue()");

            // Remember me part
            var chk_rm_status = $('#chk_remember_me').is(':checked');
            if (chk_rm_status == true) {
                var rm_username = $('#txtusername').val();
                var rm_password = $('#txtpassword').val();
                storage.setItem('rm_username', JSON.stringify(rm_username));
                storage.setItem('rm_password', JSON.stringify(rm_password));

                // set start session time
                var rm_mili = JSON.parse(storage.getItem('rm_mili'));
                if (rm_mili == null || rm_mili == undefined || rm_mili == '') {
                    var d = new Date();
                    var ms = d.getTime();
                    storage.setItem('rm_mili', JSON.stringify(ms));
                }
            } else {
                // user unchecked remember me checkbox
                storage.setItem('rm_username', JSON.stringify(''));
                storage.setItem('rm_password', JSON.stringify(''));
                storage.setItem('rm_mili', JSON.stringify(''));
            }
            ////////////

            // check GPS is enable or not
            var gps = response[0].gps;
            var url = response[0].url;
            storage.setItem('global_url', JSON.stringify(url));

            var iosDirectoryPath = response[0].iosDirectoryPath;
            if (iosDirectoryPath == "" || iosDirectoryPath == null || iosDirectoryPath == undefined) {
                iosDirectoryPath = "";
            }
            localStorage.setItem('iosDirectoryPath', iosDirectoryPath);

            var profileFilePath = response[0].profileFilePath;
            if (profileFilePath == "" || profileFilePath == null || profileFilePath == undefined) {
                storage.setItem('profile_pic_path', JSON.stringify(''));
                storage.setItem('profile_pic_path_ios', JSON.stringify(''));
            }
            else {
                if (F7_device == 'ios') {
                    //====photo thumbnail issue for iOS after cordove plugin updation [23092021]
                    var iosDirectoryPath = localStorage.getItem('iosDirectoryPath');
                    var localFile = iosDirectoryPath + profileFilePath;
                    var profileFilePath_ios = window.WkWebView.convertFilePath(localFile);

                    storage.setItem('profile_pic_path_ios', JSON.stringify(profileFilePath_ios));
                }
                else {
                    storage.setItem('profile_pic_path', JSON.stringify(profileFilePath));
                }

            }

            //var img = new Image();
            //img.onerror = function () {
            //    storage.setItem('profile_pic_path', JSON.stringify(''));
            //};
            //img.src = profileFilePath;

            ////////////---------old logic: system wise dateformat-----------////////////
            // store system datetime formats
            //var sys_format = response[0].dateFormat;
            //var dateFormat = convert_date_formats_for_F7(sys_format);
            //var dateFormat = 'DD, d MM yyyy';

            //if (dateFormat == 'dd/mm/yyyy') {
            //    dateFormat = 'mm/dd/yyyy';
            //}
            ////////////---------old logic: system wise dateformat-----------////////////



            ////////////---------new logic: company wise dateformat-----------////////////
            var dateFormat = result[0].dateformat;
            //dateFormat = "dd-MMM-yyyy";
            if (dateFormat == "" || dateFormat == null || dateFormat == undefined) {
                dateFormat = "mm/dd/yyyy HH:mm";
            }

            if (dateFormat.indexOf('MMM') > -1) {
                dateFormat = dateFormat.replace("MMM", "M");
            }
            else if (dateFormat.indexOf("dd-M-yyyy") > -1) { }
            else {
                dateFormat = dateFormat.replace(/M/g, "m");
            }

            localStorage.setItem("dateFormat", dateFormat);
            localStorage.setItem("timeFormat", "hh:mm");
            localStorage.setItem("dateTimeFormat", "MM/dd/yyyy hh:mm");

            //store server date and update login details in table on successfull login
            var server_date = result[0].Date;
            var user_id = result[0].user_id;
            var Company_id = result[0].Company_id;
            var Contact_Number = result[0].ContactNo;

            var Company_Email = result[0].Company_Email;
            var User_CircleId = result[0].User_CircleId;
            var User_CircleName = result[0].User_CircleName;

            var circle_array = result[0].circle_array;
            if (circle_array == '' || circle_array == null || circle_array == undefined) {
                var circle_array = '';
            }
            
            var KYFF = result[0].KYFF;
            var Chart = result[0].Chart;
            var Tech_Report = result[0].Tech_Report;
            var Live_Alarm_Report = result[0].Live_Alarm_Report;
            var Scoreboard = result[0].Scoreboard;
            var Camera_Type = result[0].Camera_Type;
            var Camera_Edit = result[0].Camera_Edit;
            var One_Time_Login = result[0].One_Time_Login;
            var Session_MS = result[0].Session_MS;
            var role_id_array = result[0].role_id_array;
            if (role_id_array == '' || role_id_array == null || role_id_array == undefined) {
                var role_id = parseInt(result[0].role_id);
                localStorage.setItem('role_id_array', role_id);
            }
            else {
                localStorage.setItem('role_id_array', role_id_array);
            }

            //var module_layout = result[0].module_layout;
            //if (module_layout == "" || module_layout == null || module_layout == undefined) {
            //    module_layout = "listview"
            //}
           // var module_layout = "cardview";
            var module_layout = "listview";
            localStorage.setItem('module_layout', module_layout);

            var Attendance = result[0].Attendance;
            if (Attendance == '' || Attendance == null || Attendance == undefined) {
                Attendance = "false";
            }
            
            var AttendanceJson = result[0].AttendanceJson;
            if (AttendanceJson == '' || AttendanceJson == null || AttendanceJson == undefined) {
                AttendanceJson = '';
            }
            else {
                let login_role_id = result[0].role_id;    // role_id in string comparission
                let attendance_role_id = AttendanceJson[0].role_id_array;
                if (attendance_role_id == "" || attendance_role_id == null || attendance_role_id == undefined) {
                    // old attendance json
                }
                else {
                    if (attendance_role_id.indexOf(login_role_id) !== -1) {
                        // role id exist
                    }
                    else {
                        // role id exist
                        AttendanceJson = '';
                        Attendance = "false";
                    }
                }
            }

            localStorage.setItem('Attendance', Attendance);
            localStorage.setItem('AttendanceJson', JSON.stringify(AttendanceJson));

            var profile_user_data = result[0].userdata;
            if (profile_user_data == "" || profile_user_data == null || profile_user_data == undefined) {
                profile_user_data = ""
            }
            localStorage.setItem('profile_user_data', profile_user_data);

            var profile_checksheetid = result[0].checksheet_id;
            if (profile_checksheetid == "" || profile_checksheetid == null || profile_checksheetid == undefined) {
                profile_checksheetid = ""
            }
            localStorage.setItem('profile_checksheetid', profile_checksheetid);

            Quickblox = result[0].Quickblox;
            if (Quickblox == "" || Quickblox == null || Quickblox == undefined) {
                Quickblox = "False";
            }
            localStorage.setItem('Quickblox', Quickblox);

            ZoomMeeting = result[0].Zoom;
            if (ZoomMeeting == "" || ZoomMeeting == null || ZoomMeeting == undefined) {
                ZoomMeeting = "False";
            }
            localStorage.setItem('Zoom', ZoomMeeting);


            var company_feature_id = result[0].company_feature_id;
            localStorage.setItem('company_feature_id', company_feature_id);
            localStorage.setItem('login_company_feature_id', company_feature_id);

            var adhar_feature = result[0].adhar_feature;
            var bank_feature = result[0].bank_feature;
            var adhar_verified = result[0].adhar_verified;
            var bank_verified = result[0].bank_verified;
            var user_list_feature_id = result[0].user_list_feature_id;

            localStorage.setItem('adhar_feature', adhar_feature);
            localStorage.setItem('bank_feature', bank_feature);
            localStorage.setItem('adhar_verified', adhar_verified);
            localStorage.setItem('bank_verified', bank_verified);
            localStorage.setItem('user_list_feature_id', user_list_feature_id);

            //localStorage.setItem("user_list_feature_id", 23166);

            appid = result[0].appid;
            servermilli = result[0].servermilli;
            uniqcode = result[0].Uniq_Code;
            storage.setItem('uniqcode', JSON.stringify(uniqcode));

            if (Company_id == 157) {
                KYFF = "false", Chart = "false", Tech_Report = "false", Live_Alarm_Report = "false", Scoreboard = "false";
            }

            localStorage.setItem("appid", appid);
            localStorage.setItem("KYFF", KYFF);
            localStorage.setItem("Chart", Chart);
            localStorage.setItem("Tech_Report", Tech_Report);
            localStorage.setItem("Live_Alarm_Report", Live_Alarm_Report);
            localStorage.setItem("Scoreboard", Scoreboard);
            localStorage.setItem("Camera_Type", Camera_Type);
            localStorage.setItem("Camera_Edit", Camera_Edit);
            localStorage.setItem("One_Time_Login", One_Time_Login);
            localStorage.setItem("Session_MS", Session_MS);
            //localStorage.setItem("Session_MS", 300000);

            var GPS_t = result[0].GPS;
            if (GPS_t == '' || GPS_t == null || GPS_t == undefined || GPS_t == 'True') {
                GPS_flag = 1;
            } else if (GPS_t == '2') {
                GPS_flag = 2;
            } else {
                GPS_flag = 0;
            }

            if (result[0].Threshold == '' || result[0].Threshold == null || result[0].Threshold == undefined) {
                Threshold = '';
                Barcode = '';
                Scanner = '';
                var role_id = 0;
                var role_name = '';
            } else {
                Threshold = JSON.parse(result[0].Threshold);
                Barcode = result[0].Barcode;
                Scanner = result[0].Scanner;
                Video = result[0].Video;
                Meter_Reading = result[0].Meter_Reading;
                RF_Tracking = result[0].RF_Tracking;
                var role_id = parseInt(result[0].role_id);
                var role_name = result[0].role_name;
            }

            loc_polling_time = result[0].loc_polling_time;
            loc_accuracy = result[0].loc_accuracy;

            if (loc_polling_time == '' || loc_polling_time == null || loc_polling_time == undefined) {
                loc_polling_time = '0';
                loc_accuracy = '0';
            }

            storage.setItem('contactno', JSON.stringify(Contact_Number));
            storage.setItem('server_date', JSON.stringify(server_date));
            storage.setItem('user_id', JSON.stringify(user_id));
            storage.setItem('user_name', JSON.stringify(user));
            storage.setItem('company_id', JSON.stringify(Company_id));
            storage.setItem('role_id', JSON.stringify(role_id));
            storage.setItem('role_name', JSON.stringify(role_name));
            storage.setItem('circle_id', JSON.stringify(User_CircleId));
            storage.setItem('circle_name', JSON.stringify(User_CircleName));
            storage.setItem('circle_array', JSON.stringify(circle_array));
            storage.setItem('email_id', JSON.stringify(Company_Email));

            var t_color_name = JSON.parse(storage.getItem('viewsite_btn_color'));
            var cloud_str = '<svg class="cloud-absolute" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Layer_1" x="0px" y="0px" viewBox="0 0 153 187" style="enable-background:new 0 0 153 187;" xml:space="preserve"><style type="text/css">.st0{opacity:0.2;fill:' + t_color_name + ';}</style><g><title>3</title><desc>CreatedwithSketch.</desc><g id="Mask-_x2B_-Mask-Mask" transform="translate(14.000000, 0.000000)"><g id="Mask"></g><g id="Mask_1_"><path class="st0" d="M138,141.2c-3.6,0.5-7.3,0.8-11,0.8c-29.6,0-55.4-16.5-68.6-40.9c-6-11-9.4-23.7-9.4-37.1 c0-26.5,13.2-49.9,33.4-64H138v129.5"/></g><g id="Mask_2_"><path class="st0" d="M138,141.2V187H-15c0.2-43.3,31.9-79.1,73.4-85.9c4.6-0.8,9.3-1.1,14.1-1.1c26.1,0,49.5,11.4,65.5,29.5"/></g></g></g></svg>';
            localStorage.setItem('cloud_str', cloud_str);

            var app_info_Array = [];
            app_info_Array.push({
                'version': version,
                'app_url': support_app_url,
                'video_url': support_video_url,
                'wcf_url': support_wcf_url,
                'LOGINWCFURL': support_LOGINWCFURL,
                'DOWNLOADWCFURL': support_DOWNLOADWCFURL,
                'UPLOADWCFURL': support_UPLOADWCFURL,
                'GEOWCFURL': support_GEOWCFURL,
                'TASKDOWNLOADURL': support_TASKDOWNLOADURL,
                'packageName': support_packageName,
                'resumable_url': support_resumable_url,
                'common_global_wcf_url': support_common_global_wcf_url,
                'SSL': support_SSL,
                'ADDRESSAPI': support_ADDRESSAPI,
                'TRIPMAPBACK': support_TRIPMAPBACK,
                'MOCKLOCATION': support_MOCKLOCATION,
                'Appinstalldate': support_Appinstalldate,
                'Appupgradedate': support_Appupgradedate,
                'EVENTS': support_EVENTS,
                'appid': appid,
                'company_id': Company_id,
                'user_id': user_id,
                'user_name': user,
                'role_id': role_id,
                'role_name': role_name,
                'circle_id': User_CircleId,
                'circle_name': User_CircleName,
                'Barcode': Barcode,
                'Scanner': Scanner,
                'Video': Video,
                'Meter_Reading': Meter_Reading,
                'RF_Tracking': RF_Tracking,
                'Quickblox': Quickblox,
                'Zoom': ZoomMeeting,
                'GPS': GPS_t,
                'Chart': Chart,
                'KYFF': KYFF,
                'Tech_Report': Tech_Report,
                'Live_Alarm_Report': Live_Alarm_Report,
                'Scoreboard': Scoreboard,
                'Camera_Type': Camera_Type,
                'Camera_Edit': Camera_Edit,
                'One_Time_Login': One_Time_Login,
                'Session_MS': Session_MS,
                'Skip_Download': support_skip_download,
                'Module_Layout': module_layout,
                'Attendance': Attendance,
                'company_feature_id': company_feature_id,
                'user_list_feature_id': user_list_feature_id,
                'adhar_feature': adhar_feature,
                'bank_feature': bank_feature,
                'adhar_verified': adhar_verified,
                'bank_verified': bank_verified
            });

            localStorage.setItem('app_info', JSON.stringify(app_info_Array));

            if (gps == 0 && (GPS_flag == 1 || GPS_flag == 2)) {
                myApp.setProgressbar('#login_progressbar', 0);
                myApp.closeModal('.popover-login');
                alert1("Please enable your device GPS before login !");
                loading_hide();
            } else {
                var last_user = JSON.parse(storage.getItem('last_username'));
                username = JSON.parse(storage.getItem('username'));
                if (username == last_user || last_user == '' || last_user == null || last_user == undefined) {
                    // current user & previous users are same
                    storage.setItem('last_username', JSON.stringify(username));

                    // static false because these 2 features are now inbuilt - mk - 28042025
                    Barcode = "False";
                    Video = "False";

                    if (Barcode == 'True') {
                        download_barcode_app();
                    }
                    else if (Video == 'True') {
                        download_video_app();
                    }
                    else if (Meter_Reading == 'True') {
                        download_meter_reading_app();
                    }
                    else if (RF_Tracking == 'True') {
                        download_rf_tracking_app();
                    }
                    else {

                        if (res_type == "after_valid_otp") {
                            update_user_details();
                        }
                        else {
                            // valid login
                            var otp_feature = result[0].otp_feature;
                            //otp_feature = "true";
                            if (otp_feature == "true") {
                                loading_hide();
                                myApp.closeModal('.popover-login');

                                $('.otp-verify input').val("");
                                $("#spn_OTPMessage").html(result[0].message);
                                myApp.popup('.popup-otp-verify');

                                var fiveMinutes = 60 * 5;
                                var display = document.querySelector('#time');
                                startTimer(fiveMinutes, display);

                            }
                            else {
                                update_user_details();
                            }
                        }


                    }
                }
                else {
                    // current user & previous users are not same (check for upload)

                    var otp_feature = result[0].otp_feature;
                    if (otp_feature == "true") {
                        loading_hide();
                        myApp.closeModal('.popover-login');

                        $('.otp-verify input').val("");
                        $("#spn_OTPMessage").html(result[0].message);
                        myApp.popup('.popup-otp-verify');

                        var fiveMinutes = 60 * 5;
                        var display = document.querySelector('#time');
                        startTimer(fiveMinutes, display);
                    }
                    else {
                        // valid login
                        storage.setItem('profile_pic_path', JSON.stringify(''));
                        storage.setItem('profile_pic_path_ios', JSON.stringify(''));
                        localStorage.setItem('trip_status', '');
                        localStorage.setItem('trip_tid', '');
                        localStorage.setItem('trip_ser_task_id', '');
                        check_for_last_user_upload_pending();
                    }

                }
            }
        }
        else if (result[0].status == 4) {
            // updating old app version
            alert1(result[0].message);
            update_app_version();
        }
        else if (result[0].status == 5000) {
            myApp.closeModal('.popover-login');
            loading_hide();
        }
        else if (result[0].status == 12) {
            // 5 times otp attempt or 10 minutes expiration
            alert1(result[0].message);
            $('.otp-verify input').val("");
            myApp.closeModal('.popup-otp-verify');
            myApp.closeModal('.popover-login');
        }
        else if (result[0].status == 15) {
            // forcefully password change
            loading_hide();

            uniqcode = result[0].Uniq_Code;
            storage.setItem('uniqcode', JSON.stringify(uniqcode));
            var user_id = result[0].user_id;
            storage.setItem('user_id', JSON.stringify(user_id));
            var company_feature_id = result[0].company_feature_id;
            localStorage.setItem('company_feature_id', company_feature_id);
            localStorage.setItem('login_company_feature_id', company_feature_id);

            //if (F7_device == 'ios') {
            //    var user_choice = true;
            //}
            //else {
            //    var user_choice = confirm("It's been long time since you have changed your password. You must have to change password.");
            //}
            //if (user_choice == true) {
            localStorage.setItem('change_pwd_flag', 'login');
            changeurl("change_password.html");
            //}
        }
        else {

            myApp.closeModal('.popover-login');

            loading_hide();
            alert1(result[0].message);
        }
    } catch (e) {
        loading_hide();
        alert1(e);
    }
}

function check_forgot_password() {
    try {
        var app_info = localStorage.getItem('pre_app_info');
        if (app_info == '' || app_info == null || app_info == undefined) {
            alert1("Pre app info is not available!");
        }
        else {
            app_info = JSON.parse(app_info);
            var t_support_packageName = app_info[0].packageName;
            if (t_support_packageName == "" || t_support_packageName == null || t_support_packageName == undefined) {
                alert1("Packgename is not available!");
            }
            else if (t_support_packageName == "com.easyform.vodafone") {
                alert1("Dear User, Please contact local IT team for password!");
            }
            else {
                var app_url = app_info[0].app_url;
                if (F7_device == 'ios') {
                    if (app_url == '' || app_url == null || app_url == undefined) {
                        var path = "https://login.easyform.in/WEB/Forgot_Password.aspx?type=mobile";
                    }
                    else {
                        app_url = app_url.replace('/Services/', '');
                        last_char = app_url.charAt(app_url.length - 1);
                        if (last_char == "/") {
                            path = app_url + "Forgot_Password.aspx?type=mobile";
                        }
                        else {
                            path = app_url + "/Forgot_Password.aspx?type=mobile";
                        }
                    }
                    redirect_on_forgot_password_ios(path);
                }
                else {
                    if (app_url == '' || app_url == null || app_url == undefined) {
                        changeurl("https://login.easyform.in/WEB/Forgot_Password.aspx?type=mobile");
                    }
                    else {
                        app_url = app_url.replace('/Services/', '');
                        var full_url = (new URL(app_url));
                        var domain = full_url.origin;
                        if (domain == "https://development.easyform.in") {
                            changeurl("https://development.easyform.in/WEB/Forgot_Password.aspx?type=mobile");
                        }
                        else if (domain == "https://login.easyform.in") {
                            changeurl("https://login.easyform.in/WEB/Forgot_Password.aspx?type=mobile");
                        }
                        else {
                            changeurl(domain + "/Forgot_Password.aspx?type=mobile");
                        }
                    }
                }
            }
        }

    }
    catch (e) {
        changeurl("https://login.easyform.in/WEB/Forgot_Password.aspx");
    }
}

function redirect_on_forgot_password_ios(t_path) {
    try {
        var q_jsonobj = [];
        q_jsonobj.push({
            'path': t_path,
            'id': 0
        });
        cordova.exec(onsuccess_redirect_on_forgot_password_ios, onfail_redirect_on_forgot_password_ios, 'openURLSafariPlug', 'anAction', q_jsonobj);

    }
    catch (e) {
        alert1(e + '_redirect_on_forgot_password_ios');
    }
}

function onsuccess_redirect_on_forgot_password_ios(e) {
    loading_hide();
}

function onfail_redirect_on_forgot_password_ios(e) {
    loading_hide();
    alert1(e + '_onfail_redirect_on_forgot_password_ios');
}

// update application version
function update_app_version() {
    try {
        //alert1("Updating old version !")
        username = $('#txtusername').val();
        var q_jsonobj = [];
        q_jsonobj.push({
            'username': username,
            'type': 'version'
        });
        cordova.exec(onsuccess_update_app_version, onfail_update_app_version, 'update_version', 'nck', q_jsonobj);
    } catch (e) {
        alert1(e + '_update_app_version()');
        loading_hide();
    }
}

function onsuccess_update_app_version() {
    // this function is never called
}

function onfail_update_app_version(e) {
    // this function is never called
}

function update_user_details() {
    try {      
        localStorage.setItem("last_login_function", "update_user_details()");

        var company_id = JSON.parse(storage.getItem('company_id'));
        var user_id = JSON.parse(storage.getItem('user_id'));
        //var query = "UPDATE Login_Master SET username = '" + user + "', password = '" + password_valid + "', u_c = '" + uniqcode + "', imei = '" + imeino + "', company_id = '" + company_id + "', user_id = '" + user_id + "', appid = '" + appid + "', servermilli = '" + servermilli + "' ";
        var query = "UPDATE Login_Master SET username = '" + user + "', u_c = '" + uniqcode + "', imei = '" + imeino + "', company_id = '" + company_id + "', user_id = '" + user_id + "', appid = '" + appid + "', servermilli = '" + servermilli + "' ";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            q: "0",
            tid: "0"
        });
        cordova.exec(update_app_state_gps, updateLoginFail, 'SqlitePlugin', 'insertValuse', q_jsonobj);
    } catch (e) {
        alert1(e);
    }
}

function update_app_state_gps() {
    try {
        localStorage.setItem("last_login_function", "update_app_state_gps()");

        myApp.setProgressbar('#login_progressbar', 20);
        $("#lbl_progress_details").html("Updating GPS state");

        var query = "UPDATE APP_states SET VALUE = '" + GPS_flag + "' where ITEAM='gps'";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            q: "8",  //get-set user_id in native
            tid: "0"
        });
        cordova.exec(update_app_state_nickname, onfail_update_app_state_gps, 'SqlitePlugin', 'insertValuse', q_jsonobj);
    } catch (e) {
        alert1(e);
    }
}

function onfail_update_app_state_gps(e) {
    loading_hide();
    alert1(e + "_update_app_state_gps()");
}

function update_app_state_nickname() {
    try {
        localStorage.setItem("last_login_function", "update_app_state_nickname()");

        myApp.setProgressbar('#login_progressbar', 40);
        $("#lbl_progress_details").html("Updating user state");

        var query = "UPDATE APP_states SET VALUE = '" + user + "' where ITEAM='nick'";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            q: "1",    // call for upload - 13042022 (due to download page removal)
            tid: "0"
        });
        cordova.exec(update_app_state_device_events, onfail_update_app_state_nickname, 'SqlitePlugin', 'insertValuse', q_jsonobj);
    } catch (e) {
        alert1(e);
    }
}

function onfail_update_app_state_nickname(e) {
    loading_hide();
    alert1(e + "_onfail_update_app_state_nickname");
}

function update_app_state_device_events() {
    try {
        localStorage.setItem("last_login_function", "update_app_state_device_events()");

        myApp.setProgressbar('#login_progressbar', 60);
        $("#lbl_progress_details").html("Updating user features");

        if (Threshold == '' || Threshold == null || Threshold == undefined) {
            var Location_Feature = 0;
            var Trip_Feature = 0;
            var Device_Events = 0;
        }
        else {
            var Location_Feature = Threshold[0].Location;
            var Trip_Feature = Threshold[0].Trip;
            var Device_Events = Threshold[0].Device_Events;
            if (Location_Feature == "True") {
                Location_Feature = 1;
            } else {
                Location_Feature = 0;
            }
            if (Trip_Feature == "True") {
                Trip_Feature = 1;
            } else {
                Trip_Feature = 0;
            }
            if (Device_Events == "True") {
                Device_Events = 1;
            } else {
                Device_Events = 0;
            }
        }

        var query = "UPDATE Features SET istrip = '" + Trip_Feature + "', isloc_track = '" + Location_Feature + "', isact_track = '" + Device_Events + "', loc_polling_time = '" + loc_polling_time + "', loc_accuracy = '" + loc_accuracy + "' ";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            q: "3", // start download
            tid: "0"
        });
        cordova.exec(update_app_state_speed_limit, onfail_update_app_state_device_events, 'SqlitePlugin', 'insertValuse', q_jsonobj);
    } catch (e) {
        alert1(e);
    }
}

function onfail_update_app_state_device_events(e) {
    loading_hide();
    alert1(e + "_update_app_state_device_events");
}

function update_app_state_speed_limit() {
    try {

        myApp.setProgressbar('#login_progressbar', 80);
        $("#lbl_progress_details").html("Updating threshold");

        if (Threshold == '' || Threshold == null || Threshold == undefined) {
            var normal_acc = 0;
            var normal_deacc = 0;
            var hard_acc = 0;
            var hard_deacc = 0;
            var speed = 0;
            var gap_milli = 0;
        }
        else {
            var normal_acc = Threshold[0].Normal_ACC;
            var normal_deacc = Threshold[0].Normal_DEACC;
            var hard_acc = Threshold[0].Hard_ACC;
            var hard_deacc = Threshold[0].Hard_DEACC;
            var speed = Threshold[0].Speed;
            var gap_milli = Threshold[0].Gap_Milli;

            if (normal_acc == '' || normal_acc == null || normal_acc == undefined) {
                normal_acc = 0;
            }
            if (normal_deacc == '' || normal_deacc == null || normal_deacc == undefined) {
                normal_deacc = 0;
            }
            if (hard_acc == '' || hard_acc == null || hard_acc == undefined) {
                hard_acc = 0;
            }
            if (hard_deacc == '' || hard_deacc == null || hard_deacc == undefined) {
                hard_deacc = 0;
            }
            if (speed == '' || speed == null || speed == undefined) {
                speed = 0;
            }
            if (gap_milli == '' || gap_milli == null || gap_milli == undefined) {
                gap_milli = 0;
            }
        }

        var query = "UPDATE Thresold SET speed = '" + speed + "', normal_acc = '" + normal_acc + "', normal_deacc = '" + normal_deacc + "', hard_acc = '" + hard_acc + "' , hard_deacc = '" + hard_deacc + "', gap_milli = '" + gap_milli + "'";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            q: "4", //accleo parameter
            tid: "0"
        });
        // alert1(JSON.stringify(q_jsonobj));
        cordova.exec(onsuccess_update_app_state_speed_limit, onfail_update_app_state_speed_limit, 'SqlitePlugin', 'insertValuse', q_jsonobj);
    } catch (e) {
        alert1(e);
    }
}

// redirect from login
function onsuccess_update_app_state_speed_limit(e) {
    try {
        localStorage.setItem("last_login_function", "update_app_state_speed_limit()");

        myApp.setProgressbar('#login_progressbar', 100);
        $("#lbl_progress_details").html("Fetching dashboard");

        storage.setItem('flow_Array', JSON.stringify(''));
        localStorage.setItem('is_subflow', 'false');
        var crash_status = JSON.parse(storage.getItem('crash_status'));
        if (crash_status == null || crash_status == undefined || crash_status == '' || crash_status == 0) {
            storage.setItem('curr_btn_mode', JSON.stringify(''));
            storage.setItem('list_json', JSON.stringify(''));
            storage.setItem('cust_flow_Array', JSON.stringify(''));
        }

        global_wcf_url = JSON.parse(storage.getItem('global_wcf_url'));
        common_global_wcf_url = JSON.parse(storage.getItem('common_global_wcf_url'));

        var user_id = JSON.parse(storage.getItem('user_id'));
        localStorage.setItem("aadhar_user_id", user_id);

        localStorage.setItem("last_page", "Login");

        var adhar_feature = localStorage.getItem('adhar_feature');
        if (adhar_feature == "True") {
            var adhar_verified = localStorage.getItem('adhar_verified');
            if (adhar_verified == "True") {
                var bank_verified = localStorage.getItem('bank_verified');
                if (bank_verified == "True") {
                    changeurl("selection.html");
                }
                else {
                    // For Bank
                    changeurl("EF_Account_Verification.html");
                }
            }
            else {
                // For Aadhar
                changeurl("EF_Aadhar_Verification.html");
            }
        }
        else {
           // changeurl("selection.html");

            get_blank_user_checksheet();
        }

    } catch (e) {
        alert1(e);
        loading_hide();
    }
}

function get_blank_user_checksheet() {
    try {

        var company_id = JSON.parse(storage.getItem('company_id'));
        var user_id = JSON.parse(storage.getItem('user_id'));
        var selected_check_type = localStorage.getItem('profile_checksheetid');
        if (selected_check_type == "" || selected_check_type == null || selected_check_type == undefined) {
            return false;
        }

        var param_obj = [];
        param_obj.push({
            'Company_Id': company_id,
            'User_Id': user_id,
            'checksheetid': selected_check_type,
            'step': 1,
            'trip_id': 0
        });

        loading();
        var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_GetCheckSheetData_Port', JSON.stringify(param_obj), function (e) {
            var responseText = JSON.parse(e.responseText);
            var status = responseText[0].status;
            if (status == 1) {

                loading_hide();

                var myArray = JSON.parse(responseText[0].data);
                if (myArray.length > 0) {
                    var blank_data = JSON.parse(myArray[0].data);

                    var allow_profile_change = 1;
                    for (i = 0; i < blank_data.length; i++) {
                        var bl_que_id = blank_data[i].que_id;
                        if (bl_que_id == 4008) {
                            // profile photo
                            let is_disabled = blank_data[i].prop[0].is_disabled;
                            if (is_disabled == "allow_once") {
                                allow_profile_change = 0;
                                break;
                            }
                        }
                    }

                    localStorage.setItem("allow_profile_change", allow_profile_change);
                    //changeurl("selection.html");
                    changeurl("download_status.html");
                }
            }
            else {
                loading_hide();
                alert(responseText[0].message);
                //changeurl("selection.html");
                changeurl("download_status.html");
            }
        }, onfail);
        getdata.callOtherDomain();
    }
    catch (e) {
        alert(e + '_get_blank_user_checksheet()');
        loading_hide();
    }
}

function onfail_update_app_state_speed_limit(e) {
    loading_hide();
    alert1(e + "_onfail_update_app_state_speed_limit");
}

// check for last user upload pending task
function check_for_last_user_upload_pending() {
    try {

        // for ios purpose (there is no force stop option) - there will no success or fail callback in ios
        if (F7_device == 'ios') {
            username = JSON.parse(storage.getItem('username'));
            storage.setItem('last_username', JSON.stringify(username));

            servermilli = 0;
            localStorage.setItem('download_completed', '0');
        }
        ////////

        var q_jsonobj = [];
        cordova.exec(onsuccess_check_for_last_user_upload_pending, onfail_check_for_last_user_upload_pending, 'delete_database', 'nck', q_jsonobj);
    } catch (e) {
        alert1(e + '_check_for_last_user_upload_pending()');
        loading_hide();
    }
}

// swap user
function onsuccess_check_for_last_user_upload_pending() {
    //alert1("upload not pending and previous database deleted");
    username = JSON.parse(storage.getItem('username'));
    storage.setItem('last_username', JSON.stringify(username));

    servermilli = 0;
    //appid = 0;
    //localStorage.setItem('appid', 0);
    localStorage.setItem('download_completed', '0');

    update_user_details();
    //loading_hide();
    //get_imei();

}

function onfail_check_for_last_user_upload_pending(e) {
    //alert1("upload pending");
    var last_user = JSON.parse(storage.getItem('last_username'));
    if (F7_device == 'ios') {
        var user_choice = true;
    }
    else {
        vibrate_device();
        var user_choice = confirm("Some data of previous user(" + last_user + ") are pending for upload, do you want to show upload pending status?");
    }
    if (user_choice == true) {
        changeurl("pending_status.html");
    } else {
        loading_hide();
    }
}

// download barcode application
function download_barcode_app() {
    try {
        username = $('#txtusername').val();
        var q_jsonobj = [];
        q_jsonobj.push({
            'username': username,
            'type': 'barcode'
        });
        cordova.exec(onsuccess_download_barcode_app, onfail_download_barcode_app, 'update_version', 'nck', q_jsonobj);
    } catch (e) {
        alert1(e + '_update_app_version()');
        loading_hide();
    }
}
function onsuccess_download_barcode_app() {
    if (Video == 'True') {
        download_video_app();
    }
    else if (Meter_Reading == 'True') {
        download_meter_reading_app();
    }
    else if (RF_Tracking == 'True') {
        download_rf_tracking_app();
    }
    else {
        update_user_details();
    }
}
function onfail_download_barcode_app(e) {
    loading_hide();
    alert1(e + '_onfail_download_barcode_app()');
}

// download video application
function download_video_app() {
    try {
        loading_hide();
        username = $('#txtusername').val();
        var q_jsonobj = [];
        q_jsonobj.push({
            'username': username,
            'type': 'video'
        });
        cordova.exec(onsuccess_download_video_app, onfail_download_video_app, 'update_version', 'nck', q_jsonobj);
    } catch (e) {
        alert1(e + '_download_video_app()');
        loading_hide();
    }
}
function onsuccess_download_video_app() {
    if (Meter_Reading == 'True') {
        download_meter_reading_app();
    }
    else if (RF_Tracking == 'True') {
        download_rf_tracking_app();
    }
    else {
        update_user_details();
    }
}
function onfail_download_video_app(e) {
    // back button press
    loading_hide();
}

// download meter reading application
function download_meter_reading_app() {
    try {
        loading_hide();
        username = $('#txtusername').val();
        var q_jsonobj = [];
        q_jsonobj.push({
            'username': username,
            'type': 'meter_reading'
        });
        cordova.exec(onsuccess_download_meter_reading_app, onfail_download_meter_reading_app, 'update_version', 'nck', q_jsonobj);
    } catch (e) {
        alert1(e + '_download_meter_reading_app()');
        loading_hide();
    }
}
function onsuccess_download_meter_reading_app() {
    if (RF_Tracking == 'True') {
        download_rf_tracking_app();
    }
    else {
        update_user_details();
    }
}
function onfail_download_meter_reading_app(e) {
    // back button press
    loading_hide();
}


// download rf tracking application
function download_rf_tracking_app() {
    try {
        loading_hide();
        username = $('#txtusername').val();
        var q_jsonobj = [];
        q_jsonobj.push({
            'username': username,
            'type': 'rftracking'
        });
        cordova.exec(onsuccess_download_rf_app, onfail_download_rf_app, 'update_version', 'nck', q_jsonobj);
    } catch (e) {
        alert1(e + '_download_rf_app()');
        loading_hide();
    }
}
function onsuccess_download_rf_app() {
    if (Meter_Reading == 'True') {
        download_meter_reading_app();
    }
    else {
        update_user_details();
    }
}
function onfail_download_rf_app(e) {
    // back button press
    loading_hide();
}


function updateLoginFail(e) {
    alert1("Login Update Failed !");
    alert1(e);
}

//Exit and close application
function ShowExitDialog() {
    var popups = $('.popup-otp-verify:visible');
    if (popups.length > 0) {
        vibrate_device();
        var user_choice = confirm("Are you sure, you want to go back?");
        if (user_choice == true) {
            myApp.closeModal('.popup-otp-verify');
        }
    }
    else {
        vibrate_device();
        var user_choice = confirm("Are you sure, you want to exit?");
        if (user_choice == true) {
            exit_app();
        }
    }
}



function alertexit(button) {
    if (button == "1" || button == 1) {
        device.exitApp();
    }
}

function onfail(e) {
    loading_hide();
    myApp.closeModal(".popover-login");
    alert1("Network Error! Please Check Your Internet Connection!");
}

//function show_pass(source) {
//    setTimeout(function () {
//        if (source[0].checked) {
//            $("#txtpassword").attr("type", "text");
//        } else {
//            $("#txtpassword").attr("type", "password");
//        }
//    }, 10);
//}

function show_pass() {
    var view_status = $("#btn_show_pass").attr("name");
    if (view_status == 0) {
        $("#btn_show_pass").attr("name", "1");
        $("#txtpassword").attr("type", "text");
        $("#btn_show_pass").removeClass('fa-eye-slash');
        $("#btn_show_pass").addClass('fa-eye');
    }
    else {
        $("#btn_show_pass").attr("name", "0");
        $("#txtpassword").attr("type", "password");
        $("#btn_show_pass").removeClass('fa-eye');
        $("#btn_show_pass").addClass('fa-eye-slash');
    }


    //setTimeout(function () {
    //    if (source[0].checked) {
    //        $("#txtpassword").attr("type", "text");
    //    } else {
    //        $("#txtpassword").attr("type", "password");
    //    }
    //}, 10);
}

function show_company_info() {
    var clickedLink = $("#btn_company_info");
    myApp.popover('.popover-menu', clickedLink);
}

function send_mail_for_imei() {
    try {
        var m_username = $("#txtusername").val();
        if (m_username == "" || m_username == null || m_username == undefined) {
            m_username = "";
        }
        var body_str = 'UserName: ' + m_username + '\n IMEI No.: ' + imeino + '';
        var mail_str = ' , ' + body_str + ', Add IMEI No.';
        mail_str = encodeURIComponent(mail_str);
        open_mail(mail_str);
    }
    catch (e) {
        alert1(e + '_send_mail_for_imei()')
    }
}

function send_mail_for_app_link() {
    try {

        let username = JSON.parse(storage.getItem('username'));
        let global_wcf_url = JSON.parse(storage.getItem('global_wcf_url'));

        var param_obj = [];
        param_obj.push({
            'version': version,
            'username': username,
            'Feature': 'version'
        });

        loading();
        var getdata = new Webservicecall_REST(global_wcf_url + 'Wcf_GetApplicationURL_New', JSON.stringify(param_obj), function (e) {
            var myArray = JSON.parse(e.responseText);
            var status = myArray[0].status;
            if (status == 1) {

                let download_url = myArray[0].url;

                var body_str = 'Download Link:\n ' + download_url + '';
                var mail_str = ' , ' + body_str + ', Application Download Link';
                mail_str = encodeURIComponent(mail_str);
                open_mail(mail_str);
                
            }
            else {
                var message = myArray[0].message;
                alert1(message);
                loading_hide();
            }
        }, onfail);
        getdata.callOtherDomain();

    }
    catch (e) {
        alert1(e + '_send_mail_for_app_link()')
    }
}



// show app info on 5 times click on hidden button
var btn_cliked = 0, timer;
function check_5_times_click() {
    btn_cliked++;
    if (btn_cliked >= 5) {
        btn_cliked = 0;
        clearTimeout(timer);
        var clickedLink = $("#btn_app_info");
        myApp.popover('.popover-app-info', clickedLink);
        fill_app_details();
    }
    if (btn_cliked == 1) {
        timer = setTimeout(function () {
            btn_cliked = 0;
        }, 4000);
    }
}

function fill_app_details() {
    try {
        var app_info = localStorage.getItem('app_info');
        if (app_info == '' || app_info == null || app_info == undefined) {
            var app_info = localStorage.getItem('pre_app_info');
            app_info = JSON.parse(app_info);

            var app_url = app_info[0].app_url;
            var video_url = app_info[0].video_url;
            var wcf_url = app_info[0].wcf_url;

            if (app_url == '' || app_url == null || app_url == undefined) {
                app_url = '';
            }
            else {
                app_url = app_url.replace('/Services/', '');
            }

            var LOGINWCFURL = app_info[0].LOGINWCFURL;
            var DOWNLOADWCFURL = app_info[0].DOWNLOADWCFURL;
            var UPLOADWCFURL = app_info[0].UPLOADWCFURL;
            var GEOWCFURL = app_info[0].GEOWCFURL;
            var TASKDOWNLOADURL = app_info[0].TASKDOWNLOADURL;
            var packageName = app_info[0].packageName;

            var resumable_url = app_info[0].resumable_url;
            var common_global_wcf_url = app_info[0].common_global_wcf_url;
            var SSL = app_info[0].SSL;
            var ADDRESSAPI = app_info[0].ADDRESSAPI;
            var TRIPMAPBACK = app_info[0].TRIPMAPBACK;
            var MOCKLOCATION = app_info[0].MOCKLOCATION;
            var Appinstalldate = app_info[0].Appinstalldate;
            var Appupgradedate = app_info[0].Appupgradedate;
            var EVENTS = app_info[0].EVENTS;

            var app_info_str = '';
            app_info_str += '<table style="width: 100%; height: 100%;white-space: nowrap;">';

            // App Details
            app_info_str += '<tr><td colspan="2">';
            app_info_str += '<div class="chip" style="border:1px solid #4caf50"><div class="chip-media" style="background-color: #4caf50">';
            app_info_str += '<i class="icon fa fa-globe" style="color:white; margin-top:1px"></i></div><div class="chip-label">App Details</div></div>';
            app_info_str += '</td></tr>';
            app_info_str += '<tr><td>Version</td><td>' + app_info[0].version + '</td></tr>';
            app_info_str += '<tr><td>App ID</td><td>' + app_info[0].appid + '</td></tr>';
            app_info_str += '<tr><td>Package Name</td><td>' + packageName + '</td></tr>';
            app_info_str += '<tr><td>App Install Date</td><td>' + Appinstalldate + '</td></tr>';
            app_info_str += '<tr><td>App Upgrade Date</td><td>' + Appupgradedate + '</td></tr>';
            app_info_str += '<tr><td>Events </td><td>' + EVENTS + '</td></tr>';
            app_info_str += '<tr><td>SSL</td><td>' + SSL + '</td></tr>';
            app_info_str += '<tr><td>ADDRESSAPI</td><td>' + ADDRESSAPI + '</td></tr>';
            app_info_str += '<tr><td>TRIPMAPBACK</td><td>' + TRIPMAPBACK + '</td></tr>';
            app_info_str += '<tr><td>MOCKLOCATION</td><td>' + MOCKLOCATION + '</td></tr>';
            app_info_str += '<tr><td colspan="2" style="height:10px"></td></tr>';


            // URL Details
            app_info_str += '<tr><td colspan="2">';
            app_info_str += '<div class="chip" style="border:1px solid ##cc3300"><div class="chip-media" style="background-color: #cc3300">';
            app_info_str += '<i class="icon fa fa-hashtag" style="color:white; margin-top:1px"></i></div><div class="chip-label">URL Details</div></div>';
            app_info_str += '</td></tr>';
            app_info_str += '<tr><td>URL</td><td>' + app_url + '</td></tr>';
            app_info_str += '<tr><td>Video URL</td><td>' + video_url + '</td></tr>';
            app_info_str += '<tr><td>WCF URL</td><td>' + wcf_url + '</td></tr>';
            app_info_str += '<tr><td>Login WCFURL</td><td>' + LOGINWCFURL + '</td></tr>';
            app_info_str += '<tr><td>Download WCFURL</td><td>' + DOWNLOADWCFURL + '</td></tr>';
            app_info_str += '<tr><td>Upload WCFURL</td><td>' + UPLOADWCFURL + '</td></tr>';
            app_info_str += '<tr><td>Geo WCFURL</td><td>' + GEOWCFURL + '</td></tr>';
            app_info_str += '<tr><td>Task Download URL</td><td>' + TASKDOWNLOADURL + '</td></tr>';
            app_info_str += '<tr><td>Resumable URL</td><td>' + resumable_url + '</td></tr>';
            app_info_str += '<tr><td>Common WCF URL</td><td>' + common_global_wcf_url + '</td></tr>';


            var last_login_fnctn = localStorage.getItem("last_login_function");
            app_info_str += '<tr><td>Last Login Function</td><td id="last_login_fnctn">' + last_login_fnctn + '</td></tr>';

            app_info_str += '<tr><td>Skip Download</td><td>' + app_info[0].skip_download + '</td></tr>';
            app_info_str += '<tr><td colspan="2" style="height:10px"></td></tr>';

            app_info_str += '</table>';

            $("#app_info").empty();
            $("#app_info").append(app_info_str);

        } else {
            app_info = JSON.parse(app_info);

            var pre_app_info = localStorage.getItem('pre_app_info');
            pre_app_info = JSON.parse(pre_app_info);
            var app_url = pre_app_info[0].app_url;
            var video_url = pre_app_info[0].video_url;
            var wcf_url = pre_app_info[0].wcf_url;
            app_url = app_url.replace('/Services/', '');

            var LOGINWCFURL = pre_app_info[0].LOGINWCFURL;
            var DOWNLOADWCFURL = pre_app_info[0].DOWNLOADWCFURL;
            var UPLOADWCFURL = pre_app_info[0].UPLOADWCFURL;
            var GEOWCFURL = pre_app_info[0].GEOWCFURL;
            var TASKDOWNLOADURL = pre_app_info[0].TASKDOWNLOADURL;
            var packageName = pre_app_info[0].packageName;

            var resumable_url = pre_app_info[0].resumable_url;
            var common_global_wcf_url = pre_app_info[0].common_global_wcf_url;
            var SSL = pre_app_info[0].SSL;
            var ADDRESSAPI = pre_app_info[0].ADDRESSAPI;
            var TRIPMAPBACK = pre_app_info[0].TRIPMAPBACK;
            var MOCKLOCATION = pre_app_info[0].MOCKLOCATION;
            var Appinstalldate = pre_app_info[0].Appinstalldate;
            var Appupgradedate = pre_app_info[0].Appupgradedate;
            var EVENTS = pre_app_info[0].EVENTS;

            var app_info_str = '';
            app_info_str += '<table style="width: 100%; height: 100%;white-space: nowrap;">';

            // App Details
            app_info_str += '<tr><td colspan="2">';
            app_info_str += '<div class="chip" style="border:1px solid #4caf50"><div class="chip-media" style="background-color: #4caf50">';
            app_info_str += '<i class="icon fa fa-globe" style="color:white; margin-top:1px"></i></div><div class="chip-label">App Details</div></div>';
            app_info_str += '</td></tr>';
            app_info_str += '<tr><td>Version</td><td>' + app_info[0].version + '</td></tr>';
            app_info_str += '<tr><td>App ID</td><td>' + app_info[0].appid + '</td></tr>';
            app_info_str += '<tr><td>Package Name</td><td>' + packageName + '</td></tr>';
            app_info_str += '<tr><td>App Install Date</td><td>' + Appinstalldate + '</td></tr>';
            app_info_str += '<tr><td>App Upgrade Date</td><td>' + Appupgradedate + '</td></tr>';
            app_info_str += '<tr><td>Events </td><td>' + EVENTS + '</td></tr>';
            app_info_str += '<tr><td>SSL</td><td>' + SSL + '</td></tr>';
            app_info_str += '<tr><td>Address API</td><td>' + ADDRESSAPI + '</td></tr>';
            app_info_str += '<tr><td>TRIP MAP BACK</td><td>' + TRIPMAPBACK + '</td></tr>';
            app_info_str += '<tr><td>MOCK LOCATION</td><td>' + MOCKLOCATION + '</td></tr>';
            app_info_str += '<tr><td colspan="2" style="height:10px"></td></tr>';


            // URL Details
            app_info_str += '<tr><td colspan="2">';
            app_info_str += '<div class="chip" style="border:1px solid ##cc3300"><div class="chip-media" style="background-color: #cc3300">';
            app_info_str += '<i class="icon fa fa-hashtag" style="color:white; margin-top:1px"></i></div><div class="chip-label">URL Details</div></div>';
            app_info_str += '</td></tr>';
            app_info_str += '<tr><td>URL</td><td>' + app_url + '</td></tr>';
            app_info_str += '<tr><td>Video URL</td><td>' + video_url + '</td></tr>';
            app_info_str += '<tr><td>WCF URL</td><td>' + wcf_url + '</td></tr>';
            app_info_str += '<tr><td>Login WCFURL</td><td>' + LOGINWCFURL + '</td></tr>';
            app_info_str += '<tr><td>Download WCFURL</td><td>' + DOWNLOADWCFURL + '</td></tr>';
            app_info_str += '<tr><td>Upload WCFURL</td><td>' + UPLOADWCFURL + '</td></tr>';
            app_info_str += '<tr><td>Geo WCFURL</td><td>' + GEOWCFURL + '</td></tr>';
            app_info_str += '<tr><td>Task Download URL</td><td>' + TASKDOWNLOADURL + '</td></tr>';
            app_info_str += '<tr><td>Resumable URL</td><td>' + resumable_url + '</td></tr>';
            app_info_str += '<tr><td>Common WCF URL</td><td>' + common_global_wcf_url + '</td></tr>';

            var last_login_fnctn = localStorage.getItem("last_login_function");
            app_info_str += '<tr><td>Last Login Function</td><td id="last_login_fnctn">' + last_login_fnctn + '</td></tr>';
            app_info_str += '<tr><td colspan="2" style="height:10px"></td></tr>';


            // Feature Access
            app_info_str += '<tr><td colspan="2">';
            app_info_str += '<div class="chip" style="border:1px solid #ff9800"><div class="chip-media" style="background-color: #ff9800">';
            app_info_str += '<i class="icon fa fa-check-square-o" style="color:white; margin-top:2px"></i></div><div class="chip-label">Feature Access</div></div>';
            app_info_str += '</td></tr>';
            app_info_str += '<tr><td>Company Feature ID</td><td>' + app_info[0].company_feature_id + '</td></tr>';
            app_info_str += '<tr><td>User List Feature ID</td><td>' + app_info[0].user_list_feature_id + '</td></tr>';
            app_info_str += '<tr><td>Chart</td><td>' + app_info[0].Chart + '</td></tr>';
            app_info_str += '<tr><td>Know Your Field Force</td><td>' + app_info[0].KYFF + '</td></tr>';
            app_info_str += '<tr><td>Tech Report</td><td>' + app_info[0].Tech_Report + '</td></tr>';
            app_info_str += '<tr><td>Live Alarm Report</td><td>' + app_info[0].Live_Alarm_Report + '</td></tr>';
            app_info_str += '<tr><td>Scoreboard</td><td>' + app_info[0].Scoreboard + '</td></tr>';
            app_info_str += '<tr><td>Attendance</td><td>' + app_info[0].Attendance + '</td></tr>';
            app_info_str += '<tr><td>Aadhar</td><td>' + app_info[0].adhar_feature + '</td></tr>';
            app_info_str += '<tr><td>Bank</td><td>' + app_info[0].bank_feature + '</td></tr>';
            app_info_str += '<tr><td colspan="2" style="height:10px"></td></tr>';


            // User Details
            app_info_str += '<tr><td colspan="2">';
            app_info_str += '<div class="chip" style="border:1px solid #2196f3"><div class="chip-media" style="background-color: #2196f3">';
            app_info_str += '<i class="icon fa fa-user" style="color:white"></i></div><div class="chip-label">User Details</div></div>';
            app_info_str += '</td></tr>';
            app_info_str += '<tr><td>User Name</td><td>' + app_info[0].user_name + '</td></tr>';
            app_info_str += '<tr><td>User ID</td><td>' + app_info[0].user_id + '</td></tr>';
            app_info_str += '<tr><td>Company ID</td><td>' + app_info[0].company_id + '</td></tr>';
            app_info_str += '<tr><td>Role ID</td><td>' + app_info[0].role_id + '</td></tr>';
            app_info_str += '<tr><td>Role Name</td><td>' + app_info[0].role_name + '</td></tr>';
            app_info_str += '<tr><td>Circle ID</td><td>' + app_info[0].circle_id + '</td></tr>';
            app_info_str += '<tr><td>Circle Name</td><td>' + app_info[0].circle_name + '</td></tr>';

            app_info_str += '<tr><td>Aadhar Verified</td><td>' + app_info[0].adhar_verified + '</td></tr>';
            app_info_str += '<tr><td>Bank Verified</td><td>' + app_info[0].bank_verified + '</td></tr>';
            app_info_str += '<tr><td colspan="2" style="height:10px"></td></tr>';


            // App Involvement
            app_info_str += '<tr><td colspan="2">';
            app_info_str += '<div class="chip" style="border:1px solid #f44336"><div class="chip-media" style="background-color: #f44336">';
            app_info_str += '<i class="icon fa fa-link" style="color:white; margin-top:3px"></i></div><div class="chip-label">App Involvement</div></div>';
            app_info_str += '</td></tr>';
            app_info_str += '<tr><td>Barcode</td><td>' + app_info[0].Barcode + '</td></tr>';
            app_info_str += '<tr><td>Scanner</td><td>' + app_info[0].Scanner + '</td></tr>';
            app_info_str += '<tr><td>Video</td><td>' + app_info[0].Video + '</td></tr>';
            app_info_str += '<tr><td>Meter Reading</td><td>' + app_info[0].Meter_Reading + '</td></tr>';
            app_info_str += '<tr><td>Quickblox</td><td>' + app_info[0].Quickblox + '</td></tr>';
            app_info_str += '<tr><td>Zoom</td><td>' + app_info[0].Zoom + '</td></tr>';

            var GPS_flag = app_info[0].GPS;
            if (GPS_flag == 0) {
                var GPS_str = GPS_flag + " (No Tracking)";
            }
            else if (GPS_flag == 1) {
                var GPS_str = GPS_flag + " (Continues Tracking)";
            }
            else {
                var GPS_str = GPS_flag + " (App Tracking)";
            }
            app_info_str += '<tr><td>GPS</td><td>' + GPS_str + '</td></tr>';
            app_info_str += '<tr><td colspan="2" style="height:10px"></td></tr>';


            // Cam Config
            app_info_str += '<tr><td colspan="2">';
            app_info_str += '<div class="chip" style="border:1px solid #e91e63"><div class="chip-media" style="background-color: #e91e63">';
            app_info_str += '<i class="icon fa fa-camera" style="color:white; margin-top:1px; font-size:15px"></i></div><div class="chip-label">Cam Config</div></div>';
            app_info_str += '</td></tr>';
            app_info_str += '<tr><td>Camera Type</td><td>' + app_info[0].Camera_Type + '</td></tr>';
            app_info_str += '<tr><td>Camera Editable</td><td>' + app_info[0].Camera_Edit + '</td></tr>';
            app_info_str += '<tr><td colspan="2" style="height:10px"></td></tr>';


            // API Details
            app_info_str += '<tr><td colspan="2">';
            app_info_str += '<div class="chip" style="border:1px solid #e91e63"><div class="chip-media" style="background-color: #e91e63">';
            app_info_str += '<i class="icon fa fa-camera" style="color:white; margin-top:1px; font-size:15px"></i></div><div class="chip-label">API Details</div></div>';
            app_info_str += '</td></tr>';
            app_info_str += '<tr><td>Total Count</td><td>' + pre_app_info[0].TOTALCOUNTDOWNLOAD + '</td></tr>';
            app_info_str += '<tr><td>Checksheet</td><td>' + pre_app_info[0].CHECKSHEET + '</td></tr>';
            app_info_str += '<tr><td>Flow Master</td><td>' + pre_app_info[0].FLOWMASTER + '</td></tr>';
            app_info_str += '<tr><td>User Define Flow Master</td><td>' + pre_app_info[0].USERDEFINEFLOWMASTER + '</td></tr>';
            app_info_str += '<tr><td>Flowwise Task Count</td><td>' + pre_app_info[0].COUNTERTASK + '</td></tr>';
            app_info_str += '<tr><td>Create Log</td><td>' + pre_app_info[0].QuestionMaster_log + '</td></tr>';
            app_info_str += '<tr><td>Create Task</td><td>' + pre_app_info[0].InsertUpdtae_maintask + '</td></tr>';
            app_info_str += '<tr><td>Technitian</td><td>' + pre_app_info[0].TECHNICIAN_UPLOAD + '</td></tr>';
            app_info_str += '<tr><td>Punch Master</td><td>' + pre_app_info[0].Insert_Update_Punchmaster + '</td></tr>';
            //app_info_str += '<tr><td>TASKDOWNLOAD_ATER_USERSWAP</td><td>' + pre_app_info[0].TASKDOWNLOAD_ATER_USERSWAP + '</td></tr>';
            //app_info_str += '<tr><td>TASKMASTERDOWNLOAD</td><td>' + pre_app_info[0].TASKMASTERDOWNLOAD + '</td></tr>';
            //app_info_str += '<tr><td>TASKUPDTAE_ATER_USERSWAP</td><td>' + pre_app_info[0].TASKUPDTAE_ATER_USERSWAP + '</td></tr>';
            app_info_str += '<tr><td colspan="2" style="height:10px"></td></tr>';


            // App Behaviour
            app_info_str += '<tr><td colspan="2">';
            app_info_str += '<div class="chip" style="border:1px solid #cc00cc"><div class="chip-media" style="background-color: #cc00cc">';
            app_info_str += '<i class="icon fa fa-send" style="color:white; margin-top:3px; margin-right:3px; font-size:15px"></i></div><div class="chip-label">App Behaviour</div></div>';
            app_info_str += '</td></tr>';
            app_info_str += '<tr><td>Module Layout</td><td>' + app_info[0].Module_Layout + '</td></tr>';
            app_info_str += '<tr><td>One Time Login</td><td>' + app_info[0].One_Time_Login + '</td></tr>';
            app_info_str += '<tr><td>Skip Download</td><td>' + app_info[0].Skip_Download + '</td></tr>';
            app_info_str += '<tr><td>Session Millisecond</td><td>' + app_info[0].Session_MS + '</td></tr>';


            app_info_str += '</table>';

            $("#app_info").empty();
            $("#app_info").append(app_info_str);
        }

        // table for showing current local storage values
        //var ls_info_str = '';
        //ls_info_str += '<table style="width: 100%; height: 100%;white-space: nowrap; margin-top:10px">';
        //ls_info_str += '<tr><td colspan="2">';
        //ls_info_str += '<div class="chip" style="border:1px solid #cc3300"><div class="chip-media" style="background-color: #cc3300">';
        //ls_info_str += '<i class="icon fa fa-hashtag" style="color:white; margin-top:1px; font-size:15px"></i></div><div class="chip-label">localStorage</div></div>';
        //ls_info_str += '</td></tr>';
        //for (var a in localStorage) {
        //    if (a != "cloud_str") {
        //        ls_info_str += '<tr><td>' + a + '</td><td>' + localStorage[a] + '</td></tr>';
        //    }
        //}

        //ls_info_str += '<tr><td colspan="2" style="height:10px"></td></tr>';
        //ls_info_str += '<tr><td colspan="2">';
        //ls_info_str += '<div class="chip" style="border:1px solid #000099"><div class="chip-media" style="background-color: #000099">';
        //ls_info_str += '<i class="icon fa fa-hashtag" style="color:white; margin-top:1px; font-size:15px"></i></div><div class="chip-label">storage</div></div>';
        //ls_info_str += '</td></tr>';

        //var index = $.jStorage.index();
        //var len = index.length
        //for (i = 0; i < len; i++) {
        //    var value = JSON.parse(storage.getItem(index[i]));
        //    var check = Array.isArray(value);
        //    if (check == true) {
        //        value = JSON.stringify(value);
        //    }
        //    ls_info_str += '<tr><td>' + index[i] + '</td><td>' + value + '</td></tr>';
        //}

        //$("#app_info").append(ls_info_str);
    }
    catch (e) {
        alert1(e);
    }
}

function fill_app_details_post() {

}




// Verify OTP

var lastkeycode;
let tabChange = function (val, elem, event) {
    let ele = document.querySelectorAll('.otp-verify input');

    var value = $(elem).val();
    if (value.length > 1) {
        var last_char = value.charAt(value.length - 1);
        $(elem).val(last_char);
    }

    if (value == "") {
        if (event.keyCode == lastkeycode) {
            ele[val - 2].focus();
            lastkeycode = "";
        }
        else {
            lastkeycode = event.keyCode;
        }
    }
    else {

        lastkeycode = "";

        if (ele[val - 1].value != '') {
            ele[val].focus()
        } else if (ele[val - 1].value == '') {
            ele[val - 2].focus()
        } else if (ele[val - 1].value == '') {
            ele[val - 3].focus()
        }
    }
}

function verify_otp() {

    var otp1 = $('.otp-verify input:nth-child(1)').val();
    var otp2 = $('.otp-verify input:nth-child(2)').val();
    var otp3 = $('.otp-verify input:nth-child(3)').val();
    var otp4 = $('.otp-verify input:nth-child(4)').val();
    var otp5 = $('.otp-verify input:nth-child(5)').val();
    var otp6 = $('.otp-verify input:nth-child(6)').val();

    if (otp1 == "" || otp2 == "" || otp3 == "" || otp4 == "" || otp5 == "" || otp6 == "") {
        alert("Please enter the OTP!");
    }
    else {
        var final_otp = otp1 + otp2 + otp3 + otp4 + otp5 + otp6;

        var rpass = $('#txtpassword').val();
        var pass = EncryptData(rpass, "sky123");

        uniqcode = Math.random().toString(36).substring(0, 8);
        storage.setItem('uniqcode', JSON.stringify(uniqcode));

        user = $('#txtusername').val();
        user = user.toLowerCase();
        storage.setItem('username', JSON.stringify(user));
        password_valid = $('#txtpassword').val();

        if (servermilli == "" || servermilli == null || servermilli == undefined || servermilli == "null") {
            servermilli = 0;
        }

        var login_obj = [];
        login_obj.push({
            'log_flag': 'login',
            'username_': user,
            'password_': pass,
            'uniq_code': uniqcode,
            'imeino': imeino,
            'appid': appid,
            'version': version,
            'servermilli': servermilli,
            'otp': final_otp
        });
        //alert1(JSON.stringify(login_obj));

        var clickedLink = $("#btn_login_theme");
        myApp.popover('.popover-login', clickedLink);
        myApp.setProgressbar('#login_progressbar', 0);
        $("#lbl_progress_details").html("Verifying OTP");

        cordova.exec(onsuccess_verify_otp, onfail, 'SqlitePlugin', 'login_detail_plug1', login_obj);
    }
}
function onsuccess_verify_otp(invocation) {
    try {

        updateuniquecode_android(invocation, "after_valid_otp");

    }
    catch (e) {
        alert(e + '_onsuccess_client_sign_in()');
    }
}

var otp_timer
function startTimer(duration, display) {
    var timer = duration, minutes, seconds;

    hourglassFill();
    setInterval(hourglassFill, 4500);

    if (otp_timer) {
        clearInterval(otp_timer);
    }

    otp_timer = setInterval(function () {
        minutes = parseInt(timer / 60, 10)
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        display.textContent = minutes + ":" + seconds;

        if (--timer < 0) {
            alert("OTP is expired, Please try again!");
            timer = duration;
            changeurl("Login.html");
        }
    }, 1000);
}

// Animation to fill the hourglass
function hourglassFill() {
    let hourglass = document.getElementById("hourglass");
    hourglass.innerHTML = "&#xf251";

    // half
    setTimeout(function () {
        hourglass.innerHTML = "&#xf252";
    }, 1000);

    // end
    setTimeout(function () {
        hourglass.innerHTML = "&#xf253";
    }, 2000);

    // rotate
    setTimeout(function () {
        hourglass.classList.toggle("rotated");
    }, 3000);

    // rotate again to the original position
    setTimeout(function () {
        hourglass.classList.toggle("rotated");
        hourglass.innerHTML = "&#xf251";
    }, 4000);
}

show_biometric = () => {
    // view biometric


    let view_biometric = localStorage.getItem("view_biometric");
    if (view_biometric != "false") {
        $("#btn_login_biometric").show();

        var q_jsonobj = [];
        cordova.exec(function (e) {
            // successfull bio
            $("#btn_login_theme").trigger("click");
        }, function (e) { }, 'BiometricLoginPlugin', 'LoginWithFingerprint', q_jsonobj);
    }
}


function clear_localStorage() {

    let global_url = JSON.parse(storage.getItem('global_url'));
    let global_wcf_url = JSON.parse(storage.getItem('global_wcf_url'));
    let global_resumable_url = JSON.parse(storage.getItem('global_resumable_url'));
    let common_global_wcf_url = JSON.parse(storage.getItem('common_global_wcf_url'));
    let username = JSON.parse(storage.getItem('username'));
    let last_username = JSON.parse(storage.getItem('last_username'));
    let crash_status = JSON.parse(storage.getItem('crash_status'));
    let data_json = JSON.parse(storage.getItem('list_json'));

    let viewsite_btn_color = JSON.parse(storage.getItem('viewsite_btn_color'));
    let viewsite_btn_text_color = JSON.parse(storage.getItem('viewsite_btn_text_color'));
    let theme_lbl_theme_header = JSON.parse(storage.getItem('theme_lbl_theme_header'));
    let theme_logo_base64 = JSON.parse(storage.getItem('theme_logo_base64'));
    let support_refrences1 = JSON.parse(storage.getItem('support_refrences1'));

    let shortest_path = localStorage.getItem('shortest_path');
    let json = localStorage.getItem('json');
    let version = localStorage.getItem("version");
    let udf_count_array = localStorage.getItem('udf_count_array');

    let last_supportCall_date = localStorage.getItem("supportCall_date");
    let app_info = localStorage.getItem('app_info');
    let pre_app_info = localStorage.getItem('pre_app_info');
    let theme_json = localStorage.getItem("theme_json");

    let ios_device = localStorage.getItem('ios_device');

    let trip_status = localStorage.getItem('trip_status');
    if (trip_status == "" || trip_status == null || trip_status == undefined || trip_status == "null") {
        trip_status = "";
    }
    let trip_tid = localStorage.getItem('trip_tid');
    let trip_ser_task_id = localStorage.getItem('trip_ser_task_id');
    let trip_Array = localStorage.getItem("trip_Array");
    if (trip_Array == "" || trip_Array == null || trip_Array == undefined) {
        trip_Array = {};
    }
    else {
        trip_Array = JSON.parse(trip_Array);
    }
    let trip_waypoint_dependency = localStorage.getItem('trip_waypoint_dependency');
    let last_notification = localStorage.getItem('last_notification');
    let download_completed = localStorage.getItem('download_completed');
    let redirect_on_module = localStorage.getItem('redirect_on_module');
    let user_list_feature_id = localStorage.getItem("user_list_feature_id");

    let livelink_watched_Array = localStorage.getItem('livelink_watched_Array');
    if (livelink_watched_Array == "" || livelink_watched_Array == null || livelink_watched_Array == undefined || livelink_watched_Array == "[]") {
        livelink_watched_Array = [];
    }
    else {
        livelink_watched_Array = JSON.parse(livelink_watched_Array);
    }

    window.localStorage.clear();
    $.jStorage.flush();

    // default
    var F7_view = 'true';
    var F7_device = 'android';
    storage.setItem('F7_view', JSON.stringify(F7_view));
    storage.setItem('F7_device', JSON.stringify(F7_device));


    storage.setItem('global_url', JSON.stringify(global_url));
    storage.setItem('global_wcf_url', JSON.stringify(global_wcf_url));
    storage.setItem('global_resumable_url', JSON.stringify(global_resumable_url));
    storage.setItem('common_global_wcf_url', JSON.stringify(common_global_wcf_url));
    storage.setItem('username', JSON.stringify(username));
    storage.setItem('last_username', JSON.stringify(last_username));
    storage.setItem('crash_status', JSON.stringify(crash_status));
    storage.setItem('data_json', JSON.stringify(data_json));

    storage.setItem('viewsite_btn_color', JSON.stringify(viewsite_btn_color));
    storage.setItem('viewsite_btn_text_color', JSON.stringify(viewsite_btn_text_color));
    storage.setItem('theme_lbl_theme_header', JSON.stringify(theme_lbl_theme_header));
    storage.setItem('theme_logo_base64', JSON.stringify(theme_logo_base64));
    storage.setItem('support_refrences1', JSON.stringify(support_refrences1));

    localStorage.setItem('shortest_path', shortest_path);
    localStorage.setItem('json', json);
    localStorage.setItem("version", version);
    localStorage.setItem("udf_count_array", udf_count_array);

    localStorage.setItem("supportCall_date", last_supportCall_date);
    localStorage.setItem("app_info", app_info);
    localStorage.setItem("pre_app_info", pre_app_info);
    localStorage.setItem("theme_json", theme_json);

    localStorage.setItem('ios_device', ios_device);

    localStorage.setItem('trip_status', trip_status);
    localStorage.setItem('trip_tid', trip_tid);
    localStorage.setItem('trip_ser_task_id', trip_ser_task_id);
    localStorage.setItem("trip_Array", JSON.stringify(trip_Array));
    localStorage.setItem('trip_waypoint_dependency', trip_waypoint_dependency);

    localStorage.setItem('download_completed', download_completed);
    localStorage.setItem('last_notification', last_notification);
    localStorage.setItem('redirect_on_module', redirect_on_module);
    localStorage.setItem('user_list_feature_id', user_list_feature_id);
    localStorage.setItem('livelink_watched_Array', JSON.stringify(livelink_watched_Array));
}