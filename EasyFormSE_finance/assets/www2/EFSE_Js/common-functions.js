
var is_approval;
function alert1(alert_msg) {
    //if (alert_msg.includes("()") == true) {
    //    alert_msg = "Something went wrong!";
    //}
    alert(alert_msg);
}

function alert2(alert_msg) {
    if (F7_device == 'ios') {
        myApp.alert(alert_msg, 'Alert');
    }
    else {
        alert(alert_msg);
    }
}

// exit application
function exit_app() {
    var q_jsonobj = [];
    q_jsonobj.push({
        data: "",
        p: "23"
    });
    cordova.exec(onsuccess_exit_app, onfail_exit_app, 'SqlitePlugin', 'exitapp', q_jsonobj);
}

function onsuccess_exit_app() {
    //update_user_details();
}

function onfail_exit_app(e) { }

// redirect to login page on logout button click
function logout_on_click() {
    if (F7_device == 'ios') {
        var user_choice = true;
    }
    else {
        vibrate_device();
        var user_choice = confirm("Some data may get stuck in upload. Are you sure, you want to logout?");
    }
    if (user_choice == true) {
        changeurl("Login.html");
    }
}

// redirect to login page on logout button click
function logout_on_click_online() {
    if (F7_device == 'ios') {
        var user_choice = true;
    }
    else {
        vibrate_device();
        var user_choice = confirm("Some data may get stuck in upload. Are you sure, you want to logout?");
    }
    if (user_choice == true) {
        loading();
        var login_obj = [];
        login_obj.push({
            'log_flag': 'logout',
            'username_': username,
            'password_': '',
            'password1_': '',
            'uniq_code': uniqcode,
            'imeino': imeino,
            'appid': '',
            'version': '',
            'servermilli': 0,
            'otp': ''
        });
        cordova.exec(onsuccess_logout_on_click_online, onfail_logout_on_click_online, 'SqlitePlugin', 'login_detail_plug1', login_obj);
    }
}

function onsuccess_logout_on_click_online(e) {

    localStorage.setItem('view_biometric', 'false');
    changeurl("Login.html");
}

function onfail_logout_on_click_online(e) {
    loading_hide();
    alert1("Network Error! Please Check Your Internet Connection!");
}




var loading_timer;
function loading() {
    //  loading_hide();

    var is_loading = $(".preloader-indicator-modal");
    if (is_loading.length == 0) {
        myApp.showIndicator();

        var container = $$('body');
        myApp.showProgressbar(container);
    }
}

function loading_hide() {
    myApp.hideIndicator();
    myApp.hideProgressbar();
}

function loading1() {
    var is_loading = $(".preloader-indicator-modal");
    if (is_loading.length == 0) {
        myApp.showIndicator();
    }
}

function pre_init_F7() {
    try {
        //var F7_theme = JSON.parse(storage.getItem('F7_theme'));
        //document.body.className = F7_theme;

        //Create new script element and load a script into it
        var js = document.createElement("script");
        if (F7_device == 'android') {
            js.src = 'Framework7-1.4.2/kitchen-sink-material/js/kitchen-sink.js';
        }
        else {
            js.src = 'Framework7-1.4.2/kitchen-sink-ios/js/kitchen-sink.js';

            //custom css for ion only [FT-22052025]
            var link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = 'css/styles_low_ios.css';
            document.head.appendChild(link);
        }
        document.body.appendChild(js);
        //get_internet_status_F7();
        $('#lblusername').html(username);

        check_and_init_F7_theme();
    }
    catch (e) {
        //alert1(e + '_init_main()');
    }
}

function check_and_init_F7_theme() {
    $('.old-view').empty();
    $('.F7-view').show();
    //window.alert = function (str) {
    //    myApp.alert1(str, "Easy Form");
    //};
    //window.confirm = function (str) {
    //    myApp.confirm(str, "Easy Form", function () {
    //    });
    //};

    //window.confirm = function (str) {
    //    myApp.confirm('Are you ready to begin?', 
    //    function () {
    //      //  myApp.alert1('You clicked Ok button!!!');
    //        return true;
    //    }
    //    );
    //};

    //window.confirm = function (str) {
    //    myApp.confirm(str, 'Easy Form', function () { return true; }, function () { return false; });
    //};

    //window.alert = function (str) {
    //    myApp.addNotification({
    //        message: str
    //    });
    //};
}

function back_button(page) {
    beforeload = (new Date()).getTime();

    $(".div-delete-filter").hide();
    // show loading on every back press
    //if (page != 'selection') {
    //    loading();
    //}

    var popups = $('.photo-browser-popup.modal-in:visible');
    var cmnt_popup = $('.popup-control-comment.modal-in:visible');
    var search_listview_popup = $('.popup-type20.modal-in:visible');
    var inv_popup = $('.popup-type22.modal-in:visible');
    var notification_popup = $('.popup-notifications.modal-in:visible');
    var task_create_popup = $('.popup-new-task-create.modal-in:visible');
    var pinch_zoom_popup = $('.pinch-zoom-container:visible');

    if (popups.length > 0) {
        // profile photo from profile menu popup is open
        myApp.closeModal('.photo-browser-popup.modal-in');
        $('.photo-browser-popup').hide();
        return false;
    }
    else if (cmnt_popup.length > 0) {
        // comment popup is open
        myApp.closeModal('.popup-control-comment.modal-in');
        $('.popup-control-comment').hide();
        return false;
    }
    else if (search_listview_popup.length > 0) {
        // searchable listview popup is open
        popup_items_hide_type20();
        return false;
    }
    else if (inv_popup.length > 0) {
        // invoice popup is open
        popup_items_hide_type22();
        return false;
    }
    else if (notification_popup.length > 0) {
        // notification popup is open
        myApp.closeModal('.popup-notifications.modal-in');
        $('.popup-notifications').hide();
        return false;
    }
    else if (task_create_popup.length > 0) {
        // task create popup is open
        myApp.closeModal('.popup-new-task-create.modal-in');
        $('.popup-new-task-create').hide();
        return false;
    }
    else if (pinch_zoom_popup.length > 0) {
        // pinch zoom popup is open
        close_zoom();
        return false;
    }
    else {
        var side_panel = $('.panel-left.active:visible');
        if (side_panel.length > 0) {
            // left profile slider is open
            myApp.closePanel();
            return false;
        }
    }

    var flow_Array = JSON.parse(storage.getItem('flow_Array'));
    if (flow_Array == "" || flow_Array == null || flow_Array == undefined) {
        flow_Array = [];
    }
    var id_Array = JSON.parse(storage.getItem('id_Array'));
    if (id_Array == "" || id_Array == null || id_Array == undefined) {
        id_Array = [];
    }
    if (id_Array.length > 0 || flow_Array.length > 0) {
        loading();
    }

    if (page == 'selection') {
        if (id_Array.length == 0) {
            var cust_flow_Array = JSON.parse(storage.getItem('cust_flow_Array'));
            if (cust_flow_Array == '' || cust_flow_Array == null || cust_flow_Array == undefined) {
                cust_flow_Array = [];
            }

            if (cust_flow_Array.length > 0) {
                // for site wise multiflow listing
                var id = cust_flow_Array[0].id;
                var wayflow = cust_flow_Array[0].wayflow;
                var wayflow_name = cust_flow_Array[0].wayflow_name;
                var list_json = cust_flow_Array[0].list_json;

                storage.setItem('udf_id', JSON.stringify(id));
                storage.setItem('wayflow', JSON.stringify(wayflow));
                storage.setItem('wayflow_name', JSON.stringify(wayflow_name));
                storage.setItem('list_json', JSON.stringify(list_json));
                changeurl("viewcustomerlist_on.html");
            }
            else {

                let report_div_display = $('#div_vertical_dashboard').is(':visible');
                if (report_div_display == true) {
                    home_tab_click();
                }
                else {
                    loading_hide();

                    exit_app();
                    //changeurl("selection.html");

                    //if (F7_device == 'ios') {
                    //    var user_choice = true;
                    //}
                    //else {
                    //    var user_choice = confirm("You are redirecting to login page. Are you sure, you want to logout?");
                    //}
                    //if (user_choice == true) {
                    //    changeurl("Login.html");
                    //}
                }
            }

        } else {
            storage.setItem('curr_btn_mode', JSON.stringify("back"));
            id_Array.pop();
            storage.setItem('id_Array', JSON.stringify(id_Array));

            var level_Array = JSON.parse(storage.getItem('level_Array'));
            level_Array.pop();
            storage.setItem('level_Array', JSON.stringify(level_Array));
            if (level_Array.length > 0) {
                var module_bottom_image = level_Array[level_Array.length - 1].module_bottom_image;
            }
            else {
                var module_bottom_image = 'false';
            }
            localStorage.setItem('module_bottom_image', module_bottom_image);
            get_data_from_ufm();
            //get_list_of_modules();
        }
    }
    else if (page == 'selection_survey') {

        loading_hide();
        var type20_searchbar_popup = $('.popup-type20-dropdown:visible');
        var adv_filter_popup = $('.popup-advance-search-online:visible');
        if (type20_searchbar_popup.length > 0) {
            myApp.closeModal('.popup-type20-dropdown');
            $('.popup-type20-dropdown').hide();
        }
        else if (adv_filter_popup.length > 0) {
            myApp.closeModal('.popup-advance-search-online');
            $('.popup-advance-search-online').hide();
        }
        else {
            $("#btn_Submit").attr('disabled', 'disabled');
            var level_Array = JSON.parse(storage.getItem('level_Array'));
            level_Array.pop();
            storage.setItem('level_Array', JSON.stringify(level_Array));

            var flow_Array = JSON.parse(storage.getItem('flow_Array'));
            var columnwise_search_bar_dis = $('.columnwise-head-search').css('display');
            var search_bar_dis = $('.head-search').css('display');
            if (search_bar_dis != "none") {
                $('.head-search').hide();
                $('.head-title').show();
                $('.head-menu').show();
                var loc_flow_update = JSON.parse(storage.getItem('loc_flow_update'));
                if (flow_Array.length > 1 && loc_flow_update == "false") {
                    $("#btn_Submit").show();
                }
                if (F7_device == 'android') {
                    $('.tabbar').slideDown(100);
                    //$('#tab1').css('padding-top', '104px');
                    //$('#tab2').css('padding-top', '104px');
                    //$('#tab3').css('padding-top', '104px');
                }
                loading_hide();
            }
            else if (columnwise_search_bar_dis != "none") {
                $("#txt_maintask_search").val("");
                $('.columnwise-head-search').hide();
                $('.head-title').show();
                $('.head-menu').show();
                var loc_flow_update = JSON.parse(storage.getItem('loc_flow_update'));
                if (flow_Array.length > 1 && loc_flow_update == "false") {
                    $("#btn_Submit").show();
                }
                if (F7_device == 'android') {
                    $('.tabbar').slideDown(100);
                }
                loading_hide();
            }
            else {
                var wayflow = flow_Array[flow_Array.length - 1].wayflow;
                var wayflow_name = flow_Array[flow_Array.length - 1].wayflow_name;
                var list_json = flow_Array[flow_Array.length - 1].list_json;
                storage.setItem('wayflow', JSON.stringify(wayflow));
                storage.setItem('wayflow_name', JSON.stringify(wayflow_name));
                storage.setItem('list_json', JSON.stringify(list_json));

                if (flow_Array.length == 1) {
                    storage.setItem('curr_btn_mode', JSON.stringify("back"));

                    //var module_list_cnt = localStorage.getItem('last_modulelist_count');
                    //if (module_list_cnt == 1) {
                    //    localStorage.setItem('redirect_on_module', 'true');
                    //    //check_for_notification();
                    //    back_button('selection');
                    //}
                    //else {
                    changeurl("selection.html");
                    //}
                }
                else {
                    flow_Array.pop();
                    var index = flow_Array.length - 1;
                    var id = flow_Array[index].id;
                    var flow_id = flow_Array[index].wayflow;
                    var flow_name = flow_Array[index].wayflow_name;
                    var list_json = flow_Array[index].list_json;
                    storage.setItem('udf_id', JSON.stringify(id));
                    storage.setItem('wayflow', JSON.stringify(flow_id));
                    storage.setItem('wayflow_name', JSON.stringify(flow_name));

                    // multitab handling
                    var tab_index = flow_Array[index].tab_index;
                    storage.setItem('tab_index', JSON.stringify(tab_index));

                    // reset task checksheet on sub flow back
                    var task_checksheetid = flow_Array[index].task_checksheetid;
                    storage.setItem('check_type_task', JSON.stringify(task_checksheetid));

                    list_json = JSON.parse(list_json);
                    var f_list_data = JSON.stringify(list_json[tab_index]);
                    storage.setItem('list_json', JSON.stringify("[" + f_list_data + "]"));

                    // new change
                    var data_count = flow_Array[index].list_json;
                    storage.setItem('list_json_Array', JSON.stringify(data_count));

                    storage.setItem('flow_Array', JSON.stringify(flow_Array));
                    //changeurl("viewsitelist_pm_grouplist.html");
                    storage.setItem('curr_btn_mode', JSON.stringify("back"));
                    //check_child_flow_for_parent();                          //backward skip for single subflow checksheet

                    var selected_tid = flow_Array[index].tid;                           //changes for ATC group task [14072021]
                    var selected_site = flow_Array[index].siteid;
                    storage.setItem('tid', JSON.stringify(selected_tid));
                    storage.setItem('siteid', JSON.stringify(selected_site));

                    if (flow_Array.length == 2) {
                        //back from 3rd level task listing [FT-14052025]
                        changeurl("selection_survey.html");
                    }
                    else {
                        var redirect = list_json[index].redirect;
                        if (redirect == 'customer') {
                            // Insolare, VIU
                            changeurl("viewcustomerlist_on.html");
                        }
                        else {
                            //var chksheet_displaying = localStorage.getItem('last_subflow_count_' + flow_id);
                            var chksheet_displaying = get_common_localStorage('last_subflow_count');
                            if (chksheet_displaying == 1) {
                                back_button('viewsitelist_pm_grouplist');
                            }
                            else {
                                changeurl("viewsitelist_pm_grouplist.html");
                                //check_child_flow_for_parent();                          //backward skip for single subflow
                            }
                        }
                    }
                }
            }
        }
    }
    else if (page == 'viewcustomerlist_on') {
        var search_bar_dis = $('.head-search').css('display');
        if (search_bar_dis != "none" && F7_view == 'true') {
            $('.head-search').hide();
            $('.head-title').show();
            $('.head-menu').show();
            if (F7_device == 'android') {
                $('.tabbar').slideDown(100);
                //$('#tab1').css('padding-top', '104px');
                //$('#tab2').css('padding-top', '104px');
                //$('#tab3').css('padding-top', '104px');
            }
            loading_hide();
        }
        else {
            // sitewise module listing change
            storage.setItem('flow_Array', JSON.stringify(''));
            storage.setItem('cust_flow_Array', JSON.stringify(''));
            ///
            localStorage.setItem('redirect_on_module', 'false');
            changeurl("selection.html");
        }
    }
    else if (page == 'viewsitedata') {
        loading_hide();
        var popups = $('.photo-browser-popup:visible');
        var popups_control = $('.popup:visible');
        if (popups.length > 0) {
            loading_hide();
            myApp.closeModal('.photo-browser-popup');
            $('.photo-browser-popup').hide();
        }
        //else if (popups_control.length > 0) {
        //    loading_hide();
        //}
        else {
            var user_choice = true;
            if (form_has_changed == "true") {
                //vibrate_device();
                //user_choice = confirm("Your changes are not saved. Are you sure, you want to go back?");

                var company_id = JSON.parse(storage.getItem('company_id'));
                if (company_id == 157) {
                    // No Autosave functionality for ATC - mk - 10072025
                    btnNAS_counter = 1;
                }

                if (btnNAS_counter == 0) {
                    // auto save log
                    auto_savelog();
                }
                else {
                    // found no auto save button
                    user_choice = confirm("Your changes are not saved. Are you sure, you want to go ahead?");
                    if (user_choice == false) {
                        loading_hide();
                    }
                    else {
                        // no auto save log
                        viewlist_checklist();
                    }
                }
            }
            else {
                // no auto save log
                viewlist_checklist();
            }
        }
    }
    else if (page == 'viewsitelist_pm_grouplist') {
        var flow_Array = JSON.parse(storage.getItem('flow_Array'));
        if (flow_Array.length == 1) {
            changeurl("selection_survey.html");
            localStorage.setItem('is_subflow', 'false');
            set_common_localStorage('redirect_on_checksheet', 'true');
        } else {
            var selected_tid = flow_Array[flow_Array.length - 2].tid;
            var selected_site = flow_Array[flow_Array.length - 2].siteid;
            var selected_start_status = flow_Array[flow_Array.length - 2].start_status;
            //var selected_end_status = flow_Array[flow_Array.length - 2].end_status;
            storage.setItem('tid', JSON.stringify(selected_tid));
            storage.setItem('siteid', JSON.stringify(selected_site));
            storage.setItem('start_status', JSON.stringify(selected_start_status));
            //storage.setItem('end_status', JSON.stringify(selected_end_status));

            var type = flow_Array[flow_Array.length - 1].type;
            if (type == 'Module' || type == 'Flow' || type == 'MultiFlow') {
                changeurl("selection_survey.html");
            } else {
                // group
                flow_Array.pop();
                var id = flow_Array[0].id;
                var flow_id = flow_Array[0].wayflow;
                var flow_name = flow_Array[0].wayflow_name;
                var list_json = flow_Array[0].list_json;
                storage.setItem('udf_id', JSON.stringify(id));
                storage.setItem('wayflow', JSON.stringify(flow_id));
                storage.setItem('wayflow_name', JSON.stringify(flow_name));

                // multitab handling
                var tab_index = flow_Array[0].tab_index;
                list_json = JSON.parse(list_json);
                var f_list_data = JSON.stringify(list_json[tab_index]);
                storage.setItem('list_json', JSON.stringify("[" + f_list_data + "]"));

                // new change
                var data_count = flow_Array[0].list_json;
                storage.setItem('list_json_Array', JSON.stringify(data_count));

                storage.setItem('flow_Array', JSON.stringify(flow_Array));
                storage.setItem('curr_btn_mode', JSON.stringify(""));
                changeurl("viewsitelist_pm_grouplist.html");
            }
        }
    }
    else if (page == 'change_password') {
        var change_pwd_flag = localStorage.getItem('change_pwd_flag');
        if (change_pwd_flag == "login") {
            changeurl("Login.html");
        }
        else {
            changeurl("selection.html");
        }
    }
    else if (page == 'forgot_password') {
        changeurl("Login.html");
    }
    else if (page == 'pending_status') {
        var flag = JSON.parse(storage.getItem('pending_status_page'));
        if (flag == '1') {
            storage.setItem('pending_status_page', JSON.stringify('0'));
            changeurl("selection_survey.html");
        } else {
            storage.setItem('pending_status_page', JSON.stringify('0'));
            changeurl("Login.html");
        }
    }
    else if (page == 'support_page' || page == 'feature_filter' || page == 'feature_chart' || page == 'EF_Custome_Reports') {
        changeurl("selection.html");
    }
    else if (page == 'upload_pending_test') {
        changeurl("selection_survey.html");
    }
    else if (page == 'viewsitedata_task') {
        loading_hide();
        var popups = $('.photo-browser-popup:visible');
        var popups_control = $('.popup:visible');
        if (popups.length > 0) {
            loading_hide();
            myApp.closeModal('.photo-browser-popup');
            $('.photo-browser-popup').hide();
        }
        //else if (popups_control.length > 0) {
        //    loading_hide();
        //}
        else {
            var user_choice = true;
            if (form_has_changed == "true") {
                if (F7_device == 'ios') {
                    user_choice = true;
                }
                else {
                    vibrate_device();
                    user_choice = confirm("Your changes are not saved. Are you sure, you want to go back?");
                }
            }
            if (user_choice == true) {
                var data_json = JSON.parse(storage.getItem('list_json'));
                if (data_json == "" || data_json == null || data_json == undefined) {
                    // in case fill attendance directly from module listing add attendance button
                    changeurl("selection.html");
                    return false;
                }

                var list_data = JSON.parse(data_json);
                var redirect = list_data[0].redirect;
                if (redirect == 'customer') {
                    changeurl("viewcustomerlist_on.html");
                } else {
                    storage.setItem('curr_btn_mode', JSON.stringify("back"));

                    var flow_Array = JSON.parse(storage.getItem('flow_Array'));
                    if (flow_Array.length == 1) {
                        localStorage.setItem('is_subflow', 'false');
                    } else {
                        //when press back from sub task creation form [haresh1.vt - 20052021]
                        var selected_tid = flow_Array[flow_Array.length - 2].tid;
                        var selected_site = flow_Array[flow_Array.length - 2].siteid;
                        var selected_start_status = flow_Array[flow_Array.length - 2].start_status;
                        storage.setItem('tid', JSON.stringify(selected_tid));
                        storage.setItem('siteid', JSON.stringify(selected_site));
                        storage.setItem('start_status', JSON.stringify(selected_start_status));
                    }

                    changeurl("selection_survey.html");
                }
            }
        }
    }
    else if (page == 'change_password') {
        changeurl("selection.html");
    }
    else if (page == 'signup') {
        changeurl("Login.html");
    }
    else if (page == 'EF_User_List') {
        var zoom_popup = $('.zoom-img');
        if (zoom_popup.length > 0) {
            $(".zoom-bg, .zoom-img").remove();
            $("img.zoomable").removeClass("zoom-original--hidden");
        }
        else {
            var urlParams = new URLSearchParams(window.location.search);
            var is_approval = urlParams.get('is_approval');
            if (is_approval == "1") {
                var curr_page_name = localStorage.getItem('curr_html_page');
                if (curr_page_name == "" || curr_page_name == null || curr_page_name == undefined) {
                    curr_page_name = "selection.html";
                }
                changeurl(curr_page_name);
            }
            else {
                changeurl("selection.html");
            }
        }
    }
    //else if (page == 'selection') {
    //}
    //else if (page == 'selection') {
    //}
}

function viewlist_checklist() {
    if (enable_popup == 1) {
        //popup is enable
        clearTimeout(network_collapse_timer);
        $("#popup_inner_div_network_retry").removeClass("vibrate_stop");
        network_collapse_timer = setTimeout(function () {
            $("#popup_inner_div_network_retry").addClass("vibrate_stop");
        }, 500);
    } else {
        var is_shortcutbutton = localStorage.getItem('is_shortcutbutton');
        if (is_shortcutbutton == 'true') {
            // back from shortcutbutton checksheet
            localStorage.setItem('is_shortcutbutton', 'false');
            back_button('viewsitelist_pm_grouplist');
        }
        else {
            //popup is disable
            //var chksheet_displaying = localStorage.getItem('last_checklist_count_' + wayflow);
            var chksheet_displaying = get_common_localStorage('last_checklist_count');
            if (enable_back == 1) {
                //back button enable
                if (step_Array.length == 1) {
                    //changeurl("viewsitelist_pm_grouplist.html");
                    storage.setItem('curr_btn_mode', JSON.stringify("back"));

                    if (chksheet_displaying == 1) {
                        back_button('viewsitelist_pm_grouplist');
                    }
                    else {
                        changeurl("viewsitelist_pm_grouplist.html");
                        //check_child_flow_for_parent();                          //backward skip for single checksheet
                    }
                } else if (step_Array.length > 1) {
                    //alert1("getting previous step...");
                    back_on_click();
                }
                else {
                    // rare case back issue - mk - 15072025
                    storage.setItem('curr_btn_mode', JSON.stringify("back"));
                    changeurl("viewsitelist_pm_grouplist.html");
                }
            } else {
                //back button disable
                //changeurl("viewsitelist_pm_grouplist.html");
                storage.setItem('curr_btn_mode', JSON.stringify("back"));

                if (chksheet_displaying == 1) {
                    back_button('viewsitelist_pm_grouplist');
                }
                else {
                    changeurl("viewsitelist_pm_grouplist.html");
                    //check_child_flow_for_parent();                          //backward skip for single checksheet
                }
            }
        }
    }
}


function enable_back_button() {
    page_load_over = 1;
    $('#btn_page_back').css({ 'pointer-events': 'initial', 'visibility': 'visible' });
}

function disable_back_button() {
    page_load_over = 0;
    $('#btn_page_back').css({ 'pointer-events': 'none', 'visibility': 'hidden' });
}

// My Profile Start
function get_my_profile_details_F7() {
    $('#chartContainer').empty();
    myApp.popup('.popup-profile');

    $('.popup-profile .media-list').show();
    //$('#iframe_update_profile').hide();

    var company_id = JSON.parse(storage.getItem('company_id'));
    if (company_id == '157') {
        setTimeout(function () {
            cordova.exec(onsuccess_get_my_profile_details_F7, onfail_get_my_profile_details_F7, 'maulik', 'nck', ["ds"]);
        }, 300);
    }
    else {
        var js = document.createElement("script");
        js.src = 'https://canvasjs.com/assets/script/canvasjs.min.js';
        //js.src = 'https://code.highcharts.com/highcharts.js';

        document.body.appendChild(js);
        js.onload = function () {
            cordova.exec(onsuccess_get_my_profile_details_F7, onfail_get_my_profile_details_F7, 'maulik', 'nck', ["ds"]);
        };
    }
}

function onsuccess_get_my_profile_details_F7(e) {
    try {
        var myArray = JSON.parse(e);
        if (myArray[0].gps == "" || myArray[0].gps == undefined || myArray[0].gps == null) {
            var gps = "0";
        } else {
            var gps = myArray[0].gps;
        }
        if (myArray[0].accuracy == "" || myArray[0].accuracy == undefined || myArray[0].accuracy == null) {
            var accuracy = "0";
        } else {
            var accuracy = myArray[0].accuracy;
        }
        if (myArray[0].address == "" || myArray[0].address == undefined || myArray[0].address == null || myArray[0].address == "NA") {
            var address = "";
        } else {
            var address = myArray[0].address;
        }
        if (myArray[0].lat == "" || myArray[0].lat == undefined || myArray[0].lat == null) {
            var lat = "0";
        } else {
            var lat = myArray[0].lat;
        }
        if (myArray[0].lon == "" || myArray[0].lon == undefined || myArray[0].lon == null) {
            var long = "0";
        } else {
            var long = myArray[0].lon;
        }
        if (myArray[0].imei == "" || myArray[0].imei == undefined || myArray[0].imei == null) {
            var imei_no = imeino;
        } else {
            var imei_no = myArray[0].imei;
        }

        //if (F7_device == 'android') {
        //    var user_lat_long_str = lat + " | " + long;
        //}
        //else {
        var user_lat_long_str = lat + ", " + long;
        //}

        $("#lbl_pro_latlong").html(user_lat_long_str);
        $("#pro_address").html(address);
        $("#pro_imei").html('<b>IMEI:</b> ' + imei_no);

        var request = $.get({
            url: global_wcf_url + `LocationApi/aws/${lat}/${long}`, success(data) {
                let address = data.display_name;
                let area = address.split(',')[0];
                $("#pro_address").html(address);
            }
        });

        var gprs = myArray[0].gprs;
        var gps = myArray[0].gps;
        if (gprs == "1") {
            $("#pro_img_gprs").css("color", "lightgreen");
        } else {
            $("#pro_img_gprs").css("color", "gray");
        }

        //if (gps == "1") {
        //    $("#pro_img_gps").css("color", "lightgreen");
        //} else {
        //    $("#pro_img_gps").css("color", "gray");
        //}

        //var company_id = JSON.parse(storage.getItem('company_id'));
        //if (company_id != '157') {
        //    get_user_flow_sublflow_names();
        //}

        get_user_data_online();

    }
    catch (e) {
        alert1(e + '_onsuccess_get_my_profile_details_F7');
    }
}

//////////////----profile user detail tbl start-----/////////////////
function get_user_data_online() {

    loading();

    let user_id = JSON.parse(storage.getItem('user_id'));
    let company_id = JSON.parse(storage.getItem('company_id'));

    var Param_obj = [];
    Param_obj.push({
        'User_Id': user_id,
        'Company_id': company_id,
    });

    var getdata1 = new Webservicecall_REST(global_wcf_url + 'User_Data', JSON.stringify(Param_obj), function (e) {
        var Search_data = e.responseText;
        Search_data = eval('(' + Search_data + ')');
        var message = Search_data[0].message;
        var status = Search_data[0].status;
        if (status == 1) {
            message = message.replace('[[', '[');
            message = message.replace(']]', ']');
            message = eval('(' + Search_data[0].data + ')');
            var user_data = message;

            localStorage.setItem('profile_user_data', JSON.stringify(user_data));
        }
        else {
            var user_data = localStorage.getItem('profile_user_data');
            user_data = JSON.parse(user_data);
        }
        loading_hide();

        if (user_data == "" || user_data == null || user_data == undefined) {
            alert("User data is not available!");
        }
        else {

            $("#title_user_profile").show();

            var prop = user_data[0].prop;
            if (prop == "" || prop == null || prop == undefined) {
                // 3 key json
                get_blank_checksheet_profile(user_data);
            }
            else {
                // full json
                build_user_table(user_data);
            }
        }
    }, onfail);
    getdata1.callOtherDomain();
}

function onfail_get_my_profile_details_F7(e) {
    get_my_task();
}

var Approvalflag = "NO";
function get_blank_checksheet_profile(user_data) {
    try {

        var company_id = JSON.parse(storage.getItem('company_id'));
        var user_id = JSON.parse(storage.getItem('user_id'));
        var selected_check_type = localStorage.getItem('profile_checksheetid');

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

                    Approvalflag = myArray[0].Approvalflag;
                    if (Approvalflag == "" || Approvalflag == null || Approvalflag == undefined) {
                        Approvalflag = "NO";
                    }

                    var data = user_data;
                    for (i = 0; i < blank_data.length; i++) {
                        var bl_que_id = blank_data[i].que_id;
                        var bl_type = blank_data[i].type;
                        for (j = 0; j < data.length; j++) {
                            var rs_que_id = data[j].que_id;
                            var rs_type = data[j].type;
                            if (rs_que_id == bl_que_id) {
                                //allow all type conversion - 26052022 (due to aadhar user update)
                                var rs_ans = data[j].ans;
                                blank_data[i].ans = rs_ans;

                                break;
                            }
                        }
                    }
                    build_user_table(blank_data);
                }
            }
            else {
                loading_hide();
                alert(responseText[0].message);
            }
        }, onfail);
        getdata.callOtherDomain();
    }
    catch (e) {
        alert(e + '_get_blank_checksheet_profile()');
        loading_hide();
    }
}

function build_user_table(user_data) {

    var detail_str = '';
    var itemObj = new MKCheckItem();

    for (var i = 0; i < user_data.length; i++) {
        var type = user_data[i].type;
        var que_id = user_data[i].que_id;
        if (type == 0 || type == 5 || type == 10 || que_id == 5 || que_id == 10018 || que_id == 4008) { }
        else {
            var is_hide = user_data[i].prop[0].is_hide;
            if (is_hide != "true") {
                var header = user_data[i].prop[0].name;
                var value = user_data[i].ans[0];

                if (que_id == 3) {
                    // make username in small case in case of user created in Camel or Uppar case 16012023
                    value = value.toLowerCase();
                }

                if (value == "" || value == null || value == undefined) {
                    value = "";
                }
                else {
                    if (type == 22) {

                        var type22_table_str = "<table class='tbl-type22' border='0'>";

                        var row_final_json = user_data[i].ans[0];
                        if (row_final_json == "" || row_final_json == null || row_final_json == undefined || row_final_json == '""') {

                        }
                        else {
                            row_final_json = itemObj._checkStrObj(row_final_json);

                            var role_list_json = row_final_json[0].row_finaljson;
                            if (role_list_json.length > 0) {
                                var btn_json = role_list_json[0].json_type_22[0].edt_btn_json;

                                if (btn_json.length == 1) {
                                    // don't display header in case of single control/column
                                }
                                else {
                                    // display header in case of multiple controls/columns

                                    // header
                                    type22_table_str += "<tr>";
                                    for (e = 0; e < btn_json.length; e++) {
                                        var prop_obj = btn_json[e].prop;
                                        if (prop_obj == "" || prop_obj == null || prop_obj == undefined) {
                                            var txt_row = role_list_json[0].json_type_22[0].txt_row;
                                            var header = txt_row[e].row_name;
                                        }
                                        else {
                                            var header = btn_json[e].prop[0].name;
                                        }

                                        type22_table_str += "<th>" + header + "</th>";
                                    }
                                    type22_table_str += "</tr>";
                                }

                                for (var txtrow = 0; txtrow < role_list_json.length; txtrow++) {

                                    var btn_json = role_list_json[txtrow].json_type_22[0].edt_btn_json;

                                    // body
                                    type22_table_str += "<tr>";
                                    for (e = 0; e < btn_json.length; e++) {

                                        var type22_Type = btn_json[e].type;
                                        if (type22_Type == "6") {
                                            var type22_Ans = btn_json[e].ans;
                                            type22_table_str += "<td style='min-width: 50px'>" + type22_Ans + "</td>";
                                        }
                                        else if ((type22_Type == "7") || (type22_Type == "26") || (type22_Type == "28") || (type22_Type == "9")) {

                                            var type22_Ans = btn_json[e].ans;
                                            if (type22_Ans == "" || type22_Ans == null || type22_Ans == undefined || type22_Ans[0] == "" || type22_Ans[0] == null || type22_Ans[0] == undefined) {
                                                type22_table_str += "<td style='min-width: 50px'></td>";
                                            }
                                            else {
                                                // dynamic photo thumbnail by live url 25012021
                                                var type22_img_que_id = btn_json[e].que_id;
                                                var t_row_index_no = txtrow + 1;
                                                var user_id = window.localStorage.getItem("user_id");
                                                var uniqcode = JSON.parse(localStorage.getItem('uniqcode'));
                                                var random_str = "&random=" + new Date().getTime();

                                                //var img_Id = "" + global_resumable_url + "/api/GetFile/Select_File_Details?cid=" + check_type + "&t22id=" + que_id + "&t22i=" + t_row_index_no + "&id=" + primary_id + "&qd=" + type22_img_que_id + "&ctype=" + ctype + "&ud=" + user_id + "&uc=" + uniqcode + random_str + "";
                                                var img_Id = "" + global_resumable_url + "GetFile/Select_File_Details?cid=" + check_type + "&t22id=" + que_id + "&t22i=" + t_row_index_no + "&id=" + primary_id + "&qd=" + type22_img_que_id + "&ctype=" + ctype + "&ud=" + user_id + "&uc=" + uniqcode + random_str + "";

                                                var param_mouseover = 'get_zoom_img_onhover("' + img_Id + '", event)';
                                                var param_mouseout = 'remove_zoom_img_onout()';

                                                if (type22_Type == "7") {
                                                    type22_table_str += "<td><img class='img-thumb' id='img_thumb_type22_" + j + "' src=" + img_Id + " onmousemove='" + param_mouseover + "'  onmouseout='" + param_mouseout + "' style='width: 40px; height:40px' /></td>";
                                                }
                                                else if (type22_Type == "9") {
                                                    type22_table_str += "<td><img class='img-thumb' id='img_thumb_type22_" + j + "' src=" + img_Id + " onmousemove='" + param_mouseover + "'  onmouseout='" + param_mouseout + "' style='width: 40px; height:40px; border:1px solid #ccc' /></td>";
                                                }
                                                else if (type22_Type == "26") {
                                                    //type22_table_str += "<td style='vertical-align:middle'><a onclick='Open_popup_View(" + primary_id + "," + type_ + "," + que_id + ")'><i class='fa fa-file-text-o'></i></a></td>";

                                                    var param_doc = "window.open('" + img_Id + "')";
                                                    type22_table_str += '<td style="vertical-align:middle"><a class="btn" onclick="' + param_doc + '" title="View Document"><i class="fa fa-file-text-o"></i></a></td>';
                                                }
                                                else {
                                                    //type22_table_str += "<td style='vertical-align:middle'><a onclick='Open_popup_View(" + primary_id + "," + type_ + "," + que_id + ")'><i class='fa fa-file-video-o'></i></a></td>";

                                                    var param_video = "window.open('" + img_Id + "')";
                                                    type22_table_str += '<td style="vertical-align:middle"><a class="btn" onclick="' + param_video + '" title="View Video"><i class="fa fa-file-video-o"></i></a></td>';
                                                }
                                            }
                                        }
                                        else {
                                            var type22_Ans = btn_json[e].ans[0];
                                            type22_table_str += "<td style='min-width: 50px'>" + type22_Ans + "</td>";

                                        }
                                    }

                                    type22_table_str += "</tr>";
                                }
                            }
                        }

                        type22_table_str += "</table>";

                        value = type22_table_str;
                    }
                    else if (type == 1) {
                        var misc_Array = user_data[i].prop[0].misc_data;
                        var prop_value = misc_Array[0].value;
                        if (prop_value == '' || prop_value == null || prop_value == undefined) {
                            var box_type = "";
                        }
                        else {
                            prop_value = itemObj._checkStrObj(misc_Array[0].value);  // check_item
                            var box_type = prop_value[0].box_type;
                        }
                    }
                }

                if (type == 22) {
                    detail_str += '<tr><td style="font-weight:bold;padding: 3px 3px;widht: 50%;">' + header + '</td><td style="width: 50%;padding: 3px 5px;">' + value + '</td></tr>';
                }
                else {
                    detail_str += '<tr><td style="font-weight:bold;padding: 3px 5px;widht: 50%;">' + header + '</td><td style="width: 50%;padding: 3px 5px;">' + value + '</td></tr>';
                }
            }
        }
    }

    $("#profile_user_detail").empty();
    $("#profile_user_detail").html(detail_str);
    $('#btn_update_profile').show();
}

update_profile = () => {
    $('.popup-profile .page').hide();
    //$('#iframe_update_profile').show();
    //$('#iframe_update_profile').attr('src', 'EF_User_List.html?is_approval=1');

    var curr_pageName = window.location.href;
    var index = curr_pageName.indexOf('www2/');
    index = index + 5;
    var curr_html_page = curr_pageName.substring(index);
    localStorage.setItem('curr_html_page', curr_html_page);
    window.location.href = 'EF_User_List.html?is_approval=1';
}

///--------

var profile_flow_Array = [];
function get_user_flow_sublflow_names() {
    var role_id_array = localStorage.getItem('role_id_array');
    var query = "SELECT id, flow_id,flow_name FROM User_Define_Flow_Master WHERE type='Flow' and rollid in (" + role_id_array + ") and (is_delete != 1 or is_delete IS NULL)";
    var q_jsonobj = [];
    q_jsonobj.push({
        data: query,
        p: "1"
    });
    cordova.exec(onsuccess_get_user_flow_sublflow_names, onfail_get_user_flow_sublflow_names, 'SqlitePlugin', 'showValues', q_jsonobj);
}

function onsuccess_get_user_flow_sublflow_names(e) {

    // for those task which does not have udf_id (tower_type in task_master)
    profile_flow_Array.push({ 'udf_id': 0, 'flow_id': 0, 'flow_name': 'Not Visited', 'task_count': 0 });

    var myArray1 = JSON.parse(e);
    for (j = 0; j < myArray1.length; j++) {
        var udf_id = myArray1[j].id;
        var flow_id = myArray1[j].flow_id;
        var flow_name = myArray1[j].flow_name;
        profile_flow_Array.push({ 'udf_id': udf_id, 'flow_id': flow_id, 'flow_name': flow_name, 'task_count': 0 });
    }
    //alert1(JSON.stringify(profile_flow_Array));

    get_my_offline_task();
}

function onfail_get_user_flow_sublflow_names(e) { }

function get_my_offline_task() {
    var query = "select count(*) as cnt, tower_type as udf_id, moduleid, module_name from task_master where username = '" + username + "' group by udf_id";
    var q_jsonobj = [];
    q_jsonobj.push({
        data: query,
        p: "1"
    });
    cordova.exec(onsuccess_get_my_offline_task, onfail_get_my_offline_task, 'SqlitePlugin', 'showValues', q_jsonobj);
}

function onsuccess_get_my_offline_task(e) {
    var myArray = JSON.parse(e);
    //alert1(JSON.stringify(myArray));
    for (i = 0; i < myArray.length; i++) {
        var cnt = parseInt(myArray[i].cnt);
        var udf_id = myArray[i].udf_id;
        if (udf_id == '' || udf_id == null || udf_id == undefined) {
            udf_id = 0;
        }
        for (f = 0; f < profile_flow_Array.length; f++) {
            if (udf_id == profile_flow_Array[f].udf_id) {
                profile_flow_Array[f].task_count = cnt;
                break;
            }
        }
    }

    get_counter_for_online_flow_profile();
}

function onfail_get_my_offline_task(e) { }

function get_counter_for_online_flow_profile() {
    try {
        loading();
        var company_id = JSON.parse(storage.getItem('company_id'));
        var user_id = JSON.parse(storage.getItem('user_id'));
        var role_id = JSON.parse(storage.getItem('role_id'));

        var param_obj = [];
        param_obj.push({
            "company_id": company_id,
            "user_id": user_id,
            "user_lat": 0,
            "user_long": 0,
            "role_id": role_id
        });

        var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_OnlineTaskList_Native_Count', JSON.stringify(param_obj), onsuccess_get_counter_for_online_flow_profile, onfail_get_counter_for_online_flow_profile);
        getdata.callOtherDomain();
    }
    catch (e) {
        alert1(e);
    }
}

function onsuccess_get_counter_for_online_flow_profile(e) {
    try {
        var responseText = e.responseText;
        var myArray = JSON.parse(responseText);
        var status = myArray[0].status;
        if (status == 1) {

            var data = myArray[0].data;
            if (data == "" || data == null || data == undefined) {
                var message = myArray[0].message;
                message = JSON.parse(message);
            }
            else {
                var message = JSON.parse(data);
            }

            var dataPoints_Array = [];
            for (var i = 0; i < message.length; i++) {
                var udf_id = message[i].udf_id;
                var flow_id = message[i].flow_id;
                var task_count = message[i].task_count;
                var flow_label;
                for (f = 0; f < profile_flow_Array.length; f++) {
                    if (udf_id == profile_flow_Array[f].udf_id) {
                        flow_label = profile_flow_Array[f].flow_name;
                        task_count = task_count + profile_flow_Array[f].task_count;
                        break;
                    }
                }
                if (task_count != 0) {
                    dataPoints_Array.push({ 'label': flow_label, 'y': task_count });
                }
            }

            var not_visited_count = profile_flow_Array[0].task_count;
            if (not_visited_count != 0) {
                dataPoints_Array.push({ 'label': 'Not Visited', 'y': not_visited_count });
            }

            draw_my_task_chart(dataPoints_Array);
        }
        else {
            var message = myArray[0].message;
            alert1(message);
        }
        loading_hide();
    }
    catch (e) {
        alert1(e + '_onsuccess_get_counter_for_online_flow()');
    }
}

function onfail_get_counter_for_online_flow_profile(e) {
    alert1(e + '_onsuccess_get_counter_for_online_flow()');
}

function draw_my_task_chart(dataPoints_Array) {
    try {
        if (dataPoints_Array.length > 0) {
            dataPoints_Array[0]['exploded'] = true;
            var chart = new CanvasJS.Chart("chartContainer", {
                theme: "light2", // "light1", "light2", "dark1", "dark2"
                exportEnabled: true,
                animationEnabled: true,
                animationDuration: 500,
                title: {
                    text: "Pending Site Ratio",
                    fontSize: 17
                },
                legend: {
                    cursor: "pointer",
                    itemclick: explodePie
                    //   verticalAlign: "top"
                },
                data: [{
                    type: "pie",
                    click: explodePie,
                    radius: 80,   // custom radius of pie
                    startAngle: 25,
                    //toolTipContent: "<b>{label}</b>: {y}%",
                    //indexLabel: "{label} - {y}%",
                    indexLabel: "{label} - {y}",
                    toolTipContent: "{label}: <b>{y}</b>",
                    showInLegend: "true",
                    legendText: "{label}",
                    indexLabelFontSize: 10,
                    //dataPoints: [
                    //    { y: 51.08, label: "Chrome" },
                    //    { y: 27.34, label: "Internet Explorer" },
                    //    { y: 10.62, label: "Firefox" },
                    //    { y: 5.02, label: "Microsoft Edge" },
                    //    { y: 4.07, label: "Safari" },
                    //    { y: 1.22, label: "Opera" },
                    //    { y: 0.44, label: "Others" }
                    //]
                    dataPoints: dataPoints_Array
                }]
            });
            chart.render();
        }
        else {
            alert1("No Pending Task Found!");
            loading_hide();
        }
    }
    catch (e) {
        alert1(e + '_draw_my_task_chart()');
    }
}

function explodePie(e) {
    for (var i = 0; i < e.dataSeries.dataPoints.length; i++) {
        if (i !== e.dataPointIndex)
            e.dataSeries.dataPoints[i].exploded = false;
    }
}

//function draw_my_task_chart_highchart(dataPoints_Array) {
//    try {
//        Highcharts.chart('chartContainer', {
//            chart: {
//                plotBackgroundColor: null,
//                plotBorderWidth: null,
//                plotShadow: false,
//                type: 'pie'
//            },
//            title: {
//                text: 'Site Ratio'
//            },
//            tooltip: {
//                pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
//            },
//            plotOptions: {
//                pie: {
//                    allowPointSelect: true,
//                    cursor: 'pointer',
//                    dataLabels: {
//                        enabled: true,
//                        format: '<b>{point.name}</b>: {point.percentage:.1f} %',
//                        style: {
//                            color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
//                        }
//                    }
//                }
//            },
//            series: [{
//                name: 'Brands',
//                colorByPoint: true,
//                data: [{
//                    name: 'Chrome',
//                    y: 61.41,
//                    sliced: true,
//                    selected: true
//                }, {
//                    name: 'Internet Explorer',
//                    y: 11.84
//                }, {
//                    name: 'Firefox',
//                    y: 10.85
//                }, {
//                    name: 'Other',
//                    y: 2.61
//                }]
//            }]
//        });
//    }
//    catch (e) {
//        alert1(e + '_draw_my_task_chart()');
//    }
//}




//function draw_my_task_chart(dataPoints_Array) {
//    google.charts.load('current', { 'packages': ['corechart'] });
//    google.charts.setOnLoadCallback(drawChart);

//}
//function drawChart() {
//    var data = google.visualization.arrayToDataTable([
//      ['Task', 'Hours per Day'],
//      ['Work', 11],
//      ['Eat', 2],
//      ['Commute', 2],
//      ['Watch TV', 2],
//      ['Sleep', 7]
//    ]);

//    var options = {
//        title: 'My Daily Activities'
//    };

//    var chart = new google.visualization.PieChart(document.getElementById('chartContainer'));

//    chart.draw(data, options);
//}


// My Profile end

// notify in app
function mk_notify(str) {
    myApp.addNotification({
        message: str
    });

    setTimeout(function () {
        myApp.closeNotification('.notifications');
    }, 3000);
}

function alert_and_ios(str) {
    if (F7_device == 'android') {
        alert1(str);
    }
    else {
        myApp.addNotification({
            message: str
        });

        setTimeout(function () {
            myApp.closeNotification('.notifications');
        }, 3000);
    }
}

// show checksheet progress popup
function show_checksheet_progress_popup() {
    var clickedLink = $('.btn_progress');
    myApp.popover('.popover-chk-progress', clickedLink);
}


//toggle skip download flag
function toggle_skip_download_flag(chk) {
    var chk_skip_down = $(chk).is(':checked');
    storage.setItem('chk_skip_down', JSON.stringify(chk_skip_down));
}

function get_internet_status_F7() {
    setTimeout(function () {
        cordova.exec(onsuccess_get_internet_status_F7, onfail_get_internet_status_F7, 'maulik', 'nck', ["ds"]);
    }, 10);
}

function onsuccess_get_internet_status_F7(e) {
    var myArray = JSON.parse(e);
    var gprs = myArray[0].gprs;
    if (gprs == "1") {
        $("#menu_img_gprs").css("color", "lightgreen");
    } else {
        $("#menu_img_gprs").css("color", "gray");
    }
}

function onfail_get_internet_status_F7(e) {
    $("#menu_img_gprs").css("color", "gray");
}

// view date as per device setting
function convert_to_view_date_F7(date) {
    try {
        var dateFormat = localStorage.getItem("dateFormat");
        if (dateFormat == '' || dateFormat == null || dateFormat == undefined) {
            dateFormat = 'mm/dd/yyyy';
        }

        var d = new Date(date);
        var dd1 = d.getDate();
        var mm1 = d.getMonth() + 1;
        var yyyy1 = d.getFullYear();
        var day = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d.getDay()];
        var month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][mm1 - 1];
        var day_s = day.substr(0, 3);
        var month_s = month.substr(0, 3);

        if (dd1 < 10) {
            dd1 = '0' + dd1;
        }

        if (mm1 < 10) {
            mm1 = '0' + mm1;
        }

        if (dateFormat == 'mm/dd/yyyy') {
            // 12/31/2017
            var view_date = mm1 + '/' + dd1 + '/' + yyyy1;
        }
        else if (dateFormat == 'dd/mm/yyyy' || dateFormat == 'dd-MMM-y') {
            // 31/12/2017
            var view_date = dd1 + '/' + mm1 + '/' + yyyy1;
        }
        else if (dateFormat == 'yyyy-MM-dd') {
            // 2017/12/31
            var view_date = yyyy1 + '/' + mm1 + '/' + dd1;
        }
        else if (dateFormat == 'DD, d MM yyyy') {
            // Sunday, 31 December, 2017
            var view_date = day + ', ' + dd1 + ' ' + month + ', ' + yyyy1;
        }
        else if (dateFormat == 'D, M d, yyyy') {
            // Sun, Dec 31, 2017
            var view_date = day_s + ', ' + month_s + ' ' + mm1 + ', ' + yyyy1;
        }
        else if (dateFormat == 'D, d M yyyy' || dateFormat == 'yyyy M d, DD') {
            // Sun, 31 Dec 2017
            var view_date = day_s + ', ' + mm1 + ' ' + month_s + ' ' + yyyy1;
        }
        else {
            // 31/12/2017
            var view_date = dd1 + '/' + mm1 + '/' + yyyy1;
        }

        return view_date;
    }
    catch (e) {
        return "N/A";
    }
}

// //////// Weather View Part ///////////////////////////
function view_weather_for_site(temp_site_lat, temp_site_long) {
    try {
        storage.setItem('crash_status', JSON.stringify('2')); // crash status for map

        var d = new Date();
        var ms = d.getTime();

        var q_jsonobj = [];
        q_jsonobj.push({
            time: ms,
            lat: temp_site_lat,
            lon: temp_site_long
        });

        cordova.exec(onsuccess_view_weather_for_site, onfail_view_weather_for_site,
            'weather_plug', 'anAction', q_jsonobj);
    } catch (e) {
        alert1(e + '_get_user_latlong_for_map()');
        loading_hide();
    }
}

function onsuccess_view_weather_for_site(e) {
    // successfull weather display
}

function onfail_view_weather_for_site(e) {
    storage.setItem('crash_status', JSON.stringify('0')); // reset crash
}
////////


// //////// Map View Part ///////////////////////////
// Get user latlong
function get_user_latlong_for_map(temp_site_lat, temp_site_long) {
    try {
        storage.setItem('crash_status', JSON.stringify('2')); // crash status
        // for map
        site_lat = temp_site_lat;
        site_long = temp_site_long;
        cordova.exec(onsuccess_get_user_latlong_for_map,
            onfail_get_user_latlong_for_map, 'maulik', 'nck', ["ds"]);
    } catch (e) {
        alert1(e + '_get_user_latlong_for_map()');
        loading_hide();
    }
}

// successful getting user latlong
function onsuccess_get_user_latlong_for_map(e) {
    try {
        // alert1(e);
        var myArray = JSON.parse(e);
        var user_lat = myArray[0].lat;
        var user_long = myArray[0].lon;
        view_user_on_map(user_lat, user_long);
    } catch (e) {
        // alert1('Problem while getting GPS lat long, Please change your
        // position !');
        var user_lat = 0;
        var user_long = 0;
        view_user_on_map(user_lat, user_long);
        loading_hide();
    }
}

// view map on map click
function view_user_on_map(user_lat, user_long) {
    try {

        var q_jsonobj = [];
        q_jsonobj.push({
            user_lat: user_lat,
            user_long: user_long,
            site_lat: site_lat,
            site_long: site_long
        });
        // alert1(JSON.stringify(q_jsonobj));

        // old map view
        // cordova.exec(onsuccess_view_user_on_map, onfail_view_user_on_map,
        // 'map', 'anAction', q_jsonobj);

        // new map view(original google map)
        cordova.exec(onsuccess_view_user_on_map, onfail_view_user_on_map,
            'navigation_new_plug', 'anAction', q_jsonobj);
    } catch (e) {
        alert1(e + '_view_user_on_map()');
        loading_hide();
    }
}

function onfail_get_user_latlong_for_map(e) {
    // alert1(e + '_onfail_get_user_latlong_for_map()');
    // alert1('Problem while getting GPS lat long, Please change your position
    // !');
    var user_lat = 0;
    var user_long = 0;
    view_user_on_map(user_lat, user_long);
    loading_hide();
}

function onsuccess_view_user_on_map(e) {
    // alert1("sucessful map open...");
}

function onfail_view_user_on_map(e) {
    if (e == null || e == undefined || e == '') {
        // user press back button
        // alert1("back");
    } else {
        // when open map in offline
        alert1("Network is slow or not working, Please check your internet connection !")
    }
    storage.setItem('crash_status', JSON.stringify('0')); // reset crash
    // status for map
}

function open_dialpad(t_number) {
    var q_jsonobj = [];
    q_jsonobj.push({
        'mobilenumber': t_number
    });
    cordova.exec(onsuccess_plugin, onfail_plugin, 'openDialPadPlugin', 'anAction', q_jsonobj);
}

function open_mail(t_mail_details) {
    t_mail_details = decodeURIComponent(t_mail_details);
    var mail_array = t_mail_details.split(',');
    var email = mail_array[0];
    var body = '';
    var subject = '';
    if (mail_array.length > 1) {
        body = mail_array[1];
        subject = mail_array[2];
    }

    //body = 'Disclaimer : The content of this application is confidential and intended for the specified recipient only. No User has the authority to conclude any binding contract/inference from the contents of this application. The data contained herein only provides an information regarding the project but not on a real-time basis. The accuracy of the information Vis-à-vis the real-time project progress is not guaranteed. The application users are advised to seek help of the Project Director for any further query that they may have with regards to the project progress. Thank you for your cooperation and understanding.';
    //subject = '';

    var q_jsonobj = [];
    q_jsonobj.push({
        'email': email,
        'body': body,
        'subject': subject
    });
    cordova.exec(onsuccess_plugin, onfail_plugin, 'openMailComposerPlugin', 'anAction', q_jsonobj);
}

function onsuccess_plugin(e) { }
function onfail_plugin(e) { }

// bulk approval start

function show_bulk_approval_panel() {
    $("#site_list .item-inner").addClass('li_disabled');
    $("#site_list .item-media").removeClass('li_no_chk');
    $(".views #nav_main").hide();
    $("#nav_select_all").show();
    $('.tabbar').slideUp(100);
    //$('#tab1').css('padding-top', '57px');
    //$('#tab2').css('padding-top', '57px');
    //$('#tab3').css('padding-top', '57px');
}

function hide_bulk_approval_panel() {
    $("#site_list .item-inner").removeClass('li_disabled');
    $("#site_list .item-media").addClass('li_no_chk');
    $(".views #nav_main").show();
    $("#nav_select_all").hide();
    $('.tabbar').slideDown(100);
    //$('#tab1').css('padding-top', '104px');
    //$('#tab2').css('padding-top', '104px');
    //$('#tab3').css('padding-top', '104px');
}

function get_selected_chk_count() {
    var count = $('#site_list input[name="li_chk"]:checked').length;
    if (count > 0) {
        $('#lbl_select_cnt').html(count);
        $('#nav_select_all .right').show();
    }
    else {
        $('#lbl_select_cnt').html("0");
        $('#nav_select_all .right').hide();
    }
}

function select_all_tasks() {
    var checked = $('#chk_select_all').is(":checked");
    if (checked == true) {
        $('#site_list input[name="li_chk"]').prop('checked', true);
    }
    else {
        $('#site_list input[name="li_chk"]').prop('checked', false);
    }
    get_selected_chk_count();
}

function send_bulk_approval_online(t_status, bulk_approval_checksheet) {
    try {
        if (bulk_approval_checksheet == "" || bulk_approval_checksheet == null || bulk_approval_checksheet == undefined) {
            var task_ids = $("#site_list input[name='li_chk']:checked").map(function () { return this.value; }).get().join(",");
            var task_array = JSON.parse("[" + task_ids + "]");

            var appid = localStorage.getItem('appid');
            var auth = [];
            auth.push({
                "username": username,
                "uniqcode": uniqcode,
                "app_id": appid
            });

            var param_obj = [];
            param_obj.push({
                'servertaskid': task_array,
                'status': t_status
            });

            loading();
            var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_Bulk_approval', JSON.stringify(param_obj), onsuccess_send_bulk_approval_online, onfail);
            getdata.callOtherDomain();
        }
        else {
            //added new logic for bulk approval checksheet if button dependency=checksheet   [FT - 22042024] 
            var flow_Array = JSON.parse(storage.getItem('flow_Array'));
            if (flow_Array.length = 1) {
                var moduleid = JSON.parse(storage.getItem('wayflow'));
            } else {
                var moduleid = flow_Array[flow_Array.length - 1].wayflow;
            }

            var query = "select data from flow_master where moduleid = '" + moduleid + "'";
            var q_jsonobj = [];
            q_jsonobj.push({
                data: query,
                p: "1"
            });
            cordova.exec(function (e) {
                var myArray = JSON.parse(e);
                if (myArray == '' || myArray == null || myArray == undefined || myArray.length == 0) {
                    var flow_Array = JSON.parse(storage.getItem('flow_Array'));
                    var flow_id = flow_Array[flow_Array.length - 1].wayflow;
                    var flow_flowname = flow_Array[flow_Array.length - 1].wayflow_name;
                    alert1(flow_flowname + " (" + flow_id + ") flow not found in flow master ! ");
                }
                else {
                    var task_checklist_data = myArray[0].data;
                    task_checklist_data = JSON.parse(task_checklist_data);
                    for (var t = 0; t < task_checklist_data.length; t++) {
                        var t_chk_id = task_checklist_data[t].checksheetid;
                        var end_status = task_checklist_data[t].end_status;
                        var reject_status = task_checklist_data[t].reject_status;
                        if (t_chk_id == bulk_approval_checksheet) {
                            localStorage.setItem('bulk_approval_chksht_end_status', end_status);
                            localStorage.setItem('bulk_approval_chksht_reject_status', reject_status);
                            break;
                        }
                    }

                    open_additional_checksheet_for_bulk_approval(t_status, bulk_approval_checksheet);
                }
            }, onfail, 'SqlitePlugin', 'showValues', q_jsonobj);
        }
    }
    catch (e) {
        alert1(e + '_send_bulk_approval_online()');
    }
}

function onsuccess_send_bulk_approval_online(e) {
    var Data_Json = e.responseText;
    Data_Json = eval('(' + Data_Json + ')');
    var Status = Data_Json[0].status;
    if (Status == 1) {
        alert1("Tasks has been updated successfully !");
        hide_bulk_approval_panel();
        refresh_site_list_common();
    }
    else {
        var message = Data_Json[0].message;
        alert1(message);
    }
    loading_hide();
}

// bulk approval end


// show chat window
function show_chat_window() {
    try {
        var query = "select imei from Login_Master";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "1"
        });
        cordova.exec(onsuccess_show_chat_window, onfail_show_chat_window, 'wiprochat_plugin', 'anAction', q_jsonobj);
    }
    catch (e) {
        alert1(e + '_show_chat_window()');
    }
}

function onsuccess_show_chat_window(e) {
    //
}

function onfail_show_chat_window(e) {
    //
}


// start-stop trip from mobile checksheet button 
var t_trip_status;
function start_stop_trip(trip_status) {
    try {
        storage.setItem('crash_status', JSON.stringify('7'));               //when app is killed before start/stop trip
        localStorage.setItem('trip_status', trip_status);

        t_trip_status = trip_status;
        //var sp_str = curr_survey_data["shortest_path"];

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

        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var t_ETA = list_data[0].ETA;
        if (t_ETA == "" || t_ETA == null || t_ETA == undefined) {
            t_ETA = "false";
        }

        var stillviolation_event = curr_survey_data["stillviolation_event"];
        if (stillviolation_event == "" || stillviolation_event == null || stillviolation_event == undefined) {
            stillviolation_event = "false";
        }

        let trip_vehicle_type = localStorage.getItem('trip_vehicle_type');
        if (trip_vehicle_type == "" || trip_vehicle_type == null || trip_vehicle_type == undefined) {
            trip_vehicle_type = "";
        }

        var t_tid = JSON.parse(storage.getItem('tid'));
        var q_jsonobj = [];
        q_jsonobj.push({
            'trip_status': trip_status,
            'tid': t_tid,
            'odometer_point': odometer_array,
            'ETA': t_ETA,
            'stillviolation_event': stillviolation_event,
            'vehicle_type': trip_vehicle_type
        });
        //alert1(JSON.stringify(q_jsonobj));

        cordova.exec(onsuccess_start_stop_trip, onfail_start_stop_trip, 'TripPlugin', 'anAction', q_jsonobj);
    }
    catch (e) {
        alert1(e + '_start_stop_trip()');
    }
}

function onsuccess_start_stop_trip(e) {
    try {
        storage.setItem('crash_status', JSON.stringify('0'));
        myApp.hidePreloader();

        var t_ser_task_id = JSON.parse(storage.getItem('server_task_id'));
        if (t_trip_status == 0) {
            var t_tid = JSON.parse(storage.getItem('tid'));
            localStorage.setItem('trip_status', t_trip_status);
            localStorage.setItem('trip_tid', t_tid);
            localStorage.setItem('trip_ser_task_id', t_ser_task_id);

            let data_json = JSON.parse(storage.getItem('list_json'));
            let list_data = JSON.parse(data_json);
            let waypoint_dependency = list_data[0].waypoint_dependency;
            if (waypoint_dependency == "" || waypoint_dependency == null || waypoint_dependency == undefined) {
                waypoint_dependency = "trip_dependent";
            }

            localStorage.setItem('trip_waypoint_dependency', waypoint_dependency);
        }
        else {
            localStorage.setItem('trip_status', '1');
            localStorage.setItem('trip_tid', '');
            localStorage.setItem('trip_ser_task_id', '');
            localStorage.setItem('trip_waypoint_dependency', '');
        }

        try {
            var trip_Array = localStorage.getItem("trip_Array");
            if (trip_Array == "" || trip_Array == null || trip_Array == undefined) {
                trip_Array = {};
            }
            else {
                trip_Array = JSON.parse(trip_Array);
            }

            trip_Array[t_ser_task_id] = t_trip_status;
            localStorage.setItem("trip_Array", JSON.stringify(trip_Array));
        }
        catch (e) { }

        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var auto_trip = list_data[0].auto_trip;
        if (auto_trip == 'true') {
            var direct_task = list_data[0].direct_task;
            if (direct_task == "true") {
                if (t_trip_status == 0) {
                    //start trip
                    //changeurl("selection_survey.html");

                    //insert/update task entry once location get successfully----(issue when lat-long not found---14072020)
                    var survey_mode = list_data[0].survey_mode;
                    if (survey_mode == "online") {
                        // create task online   (online then offline both)
                        if (curr_btn_mode == "button_create_task") {
                            var btn_status = curr_survey_data["createtask"];
                            insert_online_n_offline_task(btn_status);
                        }
                        else {
                            insert_online_n_offline_task(0);
                        }
                    }
                    else {
                        // create task offline
                        get_user_latlong_offline_task();
                    }
                }
                else {
                    //stop trip
                    update_current_checksheet_status_post();
                }
            }
            else {
                if (t_trip_status == 0) {
                    // start trip

                    if (form_flag == 6) {
                        // task create
                        var survey_mode = list_data[0].survey_mode;
                        if (survey_mode == "online") {
                            // create task online   (online then offline both)
                            if (curr_btn_mode == "button_create_task") {
                                var btn_status = curr_survey_data["createtask"];
                                insert_online_n_offline_task(btn_status);
                            }
                            else {
                                insert_online_n_offline_task(0);
                            }
                        }
                        else {
                            // create task offline
                            get_user_latlong_offline_task();
                        }
                    }
                    else {
                        update_current_checksheet_status_post();
                    }
                }
                else {
                    // stop trip
                    if (form_flag == 6) {
                        changeurl("viewsitelist_pm_grouplist.html");
                    }
                    else {
                        update_current_checksheet_status_post();
                    }
                }
            }
        }
        else {
            update_current_checksheet_status_post();
        }
    }
    catch (e) {
        alert1(e + 'onsuccess_start_stop_trip');
    }
}

function onfail_start_stop_trip(e) {
    storage.setItem('crash_status', JSON.stringify('0'));
    myApp.hidePreloader();
}


// middle funcation to call webservice
function webservice_inner_call(jsonobj, sucesscallback, failcallback) {
    var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_ComanWebservice', JSON.stringify(jsonobj), localsuccess, localfail);
    getdata.callOtherDomain();

    function localsuccess(e) {
        var myArray = JSON.parse(e.responseText);
        var status = myArray[0].status;
        var message = myArray[0].message;
        if (status == "1") {
            if (jsonobj[0].sp_name == "GetLogData_Port") {
                var myArray = JSON.parse(e.responseText);

                var data = myArray[0].data;
                if (data == "" || data == null || data == undefined) { }
                else {
                    myArray = JSON.parse(data);
                }

                sucesscallback(myArray[0].f_data);
            }
            else {
                var myArray = JSON.parse(e.responseText);
                var data = myArray[0].data;
                if (data == "" || data == null || data == undefined) { }
                else {
                    myArray = JSON.parse(data);
                }
                sucesscallback(JSON.stringify(myArray));
            }
        }
        else {
            //window.location.href = "../LoginPage.aspx";
            failcallback(message);
        }
    }

    function localfail(e) {
        var myArray = JSON.parse(e.responseText);
        var message = myArray[0].message;
        failcallback(message);
    }

}

//--Restrict multiclick--///
// count page load seconds
var button_clicked = 0;
var button_clicked_subflow = 0;

var beforeload = (new Date()).getTime();
function getPageLoadTime() {
    var afterload = (new Date()).getTime();
    var t_seconds = (afterload - beforeload) / 1000;
    return t_seconds;
}


//view database in application
function view_database() {
    try {
        cordova.exec(onsuccess_view_database, onfail_view_database, 'ShowDbPlugin', 'database', []);
    }
    catch (e) {
        alert1(e + '_view_database');
    }
}

function onsuccess_view_database() { }

function onfail_view_database() { }

//resolve crash status issue
function resolve_crash_status_issue() {
    try {
        storage.setItem('crash_status', JSON.stringify('0'));
    }
    catch (e) {
        alert1(e + '_resolve_crash_status_issue');
    }
}

function pass_required_values_to_condition(Condition_Data) {
    try {

        // convert json to lowercase
        var json = JSON.stringify(Condition_Data);
        var newJson = json.replace(/"([\w]+)":/g, function ($0, $1) {
            return ('"' + $1.toLowerCase() + '":');
        });
        Condition_Data = JSON.parse(newJson);

        // get default system varaibles
        var company_id = JSON.parse(storage.getItem('company_id'));
        var user_id = JSON.parse(storage.getItem('user_id'));
        var user_name = JSON.parse(storage.getItem('user_name'));
        var module_id = JSON.parse(window.storage.getItem('wayflow'));
        var module_name = JSON.parse(window.storage.getItem('wayflow_name'));
        var role_id = JSON.parse(storage.getItem('role_id'));
        var role_name = JSON.parse(storage.getItem('role_name'));
        var circle_id = JSON.parse(storage.getItem('circle_id'));
        var circle_name = JSON.parse(storage.getItem('circle_name'));

        var server_task_id = JSON.parse(storage.getItem('server_task_id'));
        curr_all_data_20["task_id"] = server_task_id;

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

        var customer_columndata = JSON.parse(storage.getItem('customer_columndata'));
        if (customer_columndata == '' || customer_columndata == null || customer_columndata == undefined) { }
        else {
            for (c = 0; c < customer_columndata.length; c++) {
                var key = customer_columndata[c].header;
                var value = customer_columndata[c].ans;
                curr_all_data_20[key] = value;
            }
        }

        // AND
        try {
            var where_Json = Condition_Data[0].where[0].and[0].json;
            for (f = 0; f < where_Json.length; f++) {
                var get_value = where_Json[f].value_1;
                var value_type = get_value.substring(2, 1);
                var sub_get_value = get_value.substring(2, get_value.length - 2);
                if (value_type == "#") {
                    // system value
                    var new_get_value = curr_all_data_20[sub_get_value];
                    Condition_Data[0].where[0].and[0].json[f].value_1 = new_get_value;
                }
            }
        } catch (e) { }

        var where_Table = Condition_Data[0].where[0].and[0].table;
        for (h = 0; h < where_Table.length; h++) {
            var get_value = where_Table[h].value_1;
            var value_type = get_value.substring(2, 1);
            var sub_get_value = get_value.substring(2, get_value.length - 2);
            if (value_type == "#") {
                // system value
                var new_get_value = curr_all_data_20[sub_get_value];
                Condition_Data[0].where[0].and[0].table[h].value_1 = new_get_value;
            }
        }

        // OR
        try {
            var where_Json = Condition_Data[0].where[0].or[0].json;
            for (f = 0; f < where_Json.length; f++) {
                var get_value = where_Json[f].value_1;
                var value_type = get_value.substring(2, 1);
                var sub_get_value = get_value.substring(2, get_value.length - 2);
                if (value_type == "#") {
                    // system value
                    var new_get_value = curr_all_data_20[sub_get_value];
                    Condition_Data[0].where[0].or[0].json[f].value_1 = new_get_value;
                }
            }
        } catch (e) { }

        try {
            var where_Table = Condition_Data[0].where[0].or[0].table;
            for (h = 0; h < where_Table.length; h++) {
                var get_value = where_Table[h].value_1;
                var value_type = get_value.substring(2, 1);
                var sub_get_value = get_value.substring(2, get_value.length - 2);
                if (value_type == "#") {
                    // system value
                    var new_get_value = curr_all_data_20[sub_get_value];
                    Condition_Data[0].where[0].or[0].table[h].value_1 = new_get_value;
                }
            }
        } catch (e) { }




        // AND > OR
        try {
            var where_Json = Condition_Data[0].where[0].and[0].or[0].json;
            for (f = 0; f < where_Json.length; f++) {
                var get_value = where_Json[f].value_1;
                var value_type = get_value.substring(2, 1);
                var sub_get_value = get_value.substring(2, get_value.length - 2);
                if (value_type == "#") {
                    // system value
                    var new_get_value = curr_all_data_20[sub_get_value];
                    Condition_Data[0].where[0].and[0].or[0].json[f].value_1 = new_get_value;
                }
            }

            var where_Table = Condition_Data[0].where[0].and[0].or[0].table;
            for (h = 0; h < where_Table.length; h++) {
                var get_value = where_Table[h].value_1;
                var value_type = get_value.substring(2, 1);
                var sub_get_value = get_value.substring(2, get_value.length - 2);
                if (value_type == "#") {
                    // system value
                    var new_get_value = curr_all_data_20[sub_get_value];
                    Condition_Data[0].where[0].and[0].or[0].table[h].value_1 = new_get_value;
                }
            }
        } catch (e) { }


        return Condition_Data;
    } catch (e) {
        alert1(e + '_pass_required_values_to_condition()');
        loading_hide();
    }
}


function get_element_value_by_class(class_name) {
    var where_box_id = $("." + class_name + " :input[type=number]").attr("id");
    if (where_box_id == '' || where_box_id == null || where_box_id == undefined) {

        // check for text box
        where_box_id = $("." + class_name + " :input[type=text]").attr("id");

        if (where_box_id == '' || where_box_id == null || where_box_id == undefined) {
            // possible dropdown 
            where_box_id = $("." + class_name + " select").attr("id");

            if (where_box_id == '' || where_box_id == null || where_box_id == undefined) {

                // check for trip control
                where_box_id = $("." + class_name + " #trip_info_tbl").attr("id");

                if (where_box_id == '' || where_box_id == null || where_box_id == undefined) {
                    // type22 grand total
                    var ele_value = $("." + class_name + "").find("td[id^='sum_']").last().text();
                }
                else {
                    //trip actual distance
                    var ele_value = $("#trip_info_tbl > tbody > tr > td").html();
                    if (ele_value == "Actual Path is missing.") {
                        ele_value = "0.00";
                    }
                }
            }
            else {
                if (where_box_id.indexOf('dynddl') != -1) {
                    // type30 dropdown
                    var ele_value = $("#" + where_box_id + " :selected").text();
                }
                else {
                    // normal dropdown
                    var ele_value = $("#" + where_box_id + "").val();
                }
            }
        }
        else {
            if (where_box_id.indexOf('txt_') != -1) {
                // text box found
                var ele_value = $("#" + where_box_id + "").val();
            }
            else {
                // calendar found
                var ele_value = $("#" + where_box_id + "").val();
                var data_field = $("#" + where_box_id + "").attr("data-field");
                ele_value = convert_fix_format_date_on_submit(ele_value, data_field);

                var cal_date = new Date(ele_value);
                ele_value = cal_date.getTime();
                ans_type = 'date';
            }
        }
    }
    else {
        // numeric found
        var ele_value = $("#" + where_box_id + "").val();
    }

    return ele_value;
}

//convert Date/Time globally
function convert_datetime_by_format(datetime_str, mode) {

    //var date_format = "dd/mm/yyyy";
    //var date_format = "mm/dd/yyyy";
    //var date_format = "yyyy/mm/dd";
    //var date_format = "dd-mmm-yyyy";

    if (mode == 'time') {
        return datetime_str;
    }
    else {
        var datetime_format = localStorage.getItem("dateFormat");
        if (datetime_format == "" || datetime_format == null || datetime_format == undefined) {
            datetime_format = 'mm/dd/yyyy HH:mm';
        }

        var datetime_format_ary = datetime_format.split(" ");
        var date_format = datetime_format_ary[0];

        if (datetime_str == '' || datetime_str == null || datetime_str == undefined) {
            var d = new Date();
        }
        else {
            if (mode == "date" || mode == "datetime") {
                let temp_str = datetime_str.toString();
                if (temp_str.indexOf("/") > -1 || temp_str.length > 16) {
                    var d = new Date(datetime_str);
                }
                else {
                    // in case mode is datetime and ans is in time string only - mk - 02082024
                    var d = new Date();
                }
            }
            else {
                var d = new Date(datetime_str);
            }
        }

        var date_str = "";

        if (d == "Invalid Date") {
            //alert1("Invalid date format!")

            //---dd/MM/yyyy formate not supported in Date Object----
            if (mode == "datetime") {
                var t_date_str1 = datetime_str.substring(0, 10);
                var t_date_str2 = datetime_str.substring(10);
                if (F7_device == 'ios') {
                    //date with (-) is invalid for ios so replaced it with "/" instead of "-" [FT - 01062024]
                    t_date_str1 = t_date_str1.split("/").reverse().join("/");
                }
                else {
                    t_date_str1 = t_date_str1.split("/").reverse().join("-");
                }
                datetime_str = t_date_str1 + t_date_str2;
            }
            else {
                if (F7_device == 'ios') {
                    //date with (-) is invalid for ios so replaced it with "/" instead of "-" [FT - 01062024]
                    datetime_str = datetime_str.split("/").reverse().join("/");
                }
                else {
                    datetime_str = datetime_str.split("/").reverse().join("-");
                }
            }
            return datetime_str;
        }
        else {
            var date = d.getDate();
            var month = d.getMonth() + 1;
            var year = d.getFullYear();

            if (date < 10) {
                date = "0" + date;
            }
            if (month < 10) {
                month = "0" + month;
            }

            var month_name = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];

            if (date_format == "dd-M-yyyy") {
                date_str = date + "-" + month_name[month - 1] + "-" + year;
            }
            else if (date_format == "mm/dd/yyyy") {
                date_str = month + "/" + date + "/" + year;
            }
            else if (date_format == "yyyy/mm/dd") {
                date_str = year + "/" + month + "/" + date;
            }
            else if (date_format == "dd/mm/yyyy") {
                date_str = date + "/" + month + "/" + year;
            }
            else {
                date_str = "";
                alert1("Please Provide Proper format for date");
            }

            if (mode == "datetime") {
                if (date_str != "") {
                    var hour = d.getHours();
                    var min = d.getMinutes();
                    var second = d.getSeconds();

                    if (hour < 10) {
                        hour = "0" + hour;
                    }
                    if (min < 10) {
                        min = "0" + min;
                    }
                    if (second < 10) {
                        second = "0" + second;
                    }

                    var time_format = datetime_format_ary[2];
                    if (time_format == "AA") {
                        //12 hours format
                        var time_str = convertTo12Hour(hour + ":" + min);
                        date_str = date_str + " " + time_str;
                    }
                    else {
                        //24 hour format
                        //date_str = date_str + " " + hour + ":" + min;

                        var time_view = datetime_format_ary[1];
                        if (time_view == 'HH:mm:ss') {
                            date_str = date_str + " " + hour + ":" + min + ":" + second;
                        }
                        else {
                            date_str = date_str + " " + hour + ":" + min;
                        }
                    }
                }
            }
            return (date_str);
        }
    }
}

function convert_fix_format_date_on_submit(date_str, mode) {
    try {
        if (mode == 'time') {
            var new_date_str = date_str;
        }
        else {
            var datetime_format = localStorage.getItem("dateFormat");
            if (datetime_format == "" || datetime_format == null || datetime_format == undefined) {
                datetime_format = 'mm/dd/yyyy HH:mm';
            }
            var datetime_format_ary = datetime_format.split(" ");
            var date_format = datetime_format_ary[0];

            if (date_format == "dd/mm/yyyy" || date_format == "dd-mm-yyyy" || date_format == "dd.mm.yyyy") {
                //---dd/MM/yyyy formate not supported in Date Object----
                try {
                    if (mode == "datetime") {
                        //var t_date_str1 = date_str.substring(0, 10);
                        //var t_date_str2 = date_str.substring(10);
                        //t_date_str1 = t_date_str1.split("/").reverse().join("-");
                        //date_str = t_date_str1 + t_date_str2;

                        var str = date_str;
                        var d = str.split("/")[0];
                        var m = str.split("/")[1];
                        var get_year = str.split("/")[2];

                        if (get_year == "" || get_year == null || get_year == undefined) {
                            mode = "time";
                        }
                        else {
                            var y = get_year.split(" ")[0]

                            if (get_year.length == 4) {
                                // date string (no hours or minute found in string)
                                date_str = y + "/" + m + "/" + d;
                            }
                            else {
                                var get_hour = get_year.split(" ")[1];
                                var hour = get_hour.split(":")[0]
                                var min = get_hour.split(":")[1]

                                date_str = y + "/" + m + "/" + d + " " + hour + ":" + min;
                            }
                        }

                    }
                    else {
                        //date_str = date_str.split("/").reverse().join("-");

                        var str = date_str;
                        var d = str.split("/")[0];
                        var m = str.split("/")[1];
                        var get_year = str.split("/")[2];
                        var y = get_year.split(" ")[0];
                        date_str = y + "/" + m + "/" + d;
                    }
                }
                catch (e) { }
            }

            try {
                date_str = date_str.replace(" AA", "");
            }
            catch (e) { }

            var t_date = new Date(date_str);
            var date = t_date.getDate();
            var month = t_date.getMonth() + 1;
            var year = t_date.getFullYear();

            if (date < 10) {
                date = "0" + date;
            }
            if (month < 10) {
                month = "0" + month;
            }

            if (mode == "date") {
                //var new_date_str = month + "/" + date + "/" + year;
                var new_date_str = year + "/" + month + "/" + date;
            }
            else if (mode == "datetime") {
                var hour = t_date.getHours();
                var min = t_date.getMinutes();
                var second = t_date.getSeconds();

                if (hour < 10) {
                    hour = "0" + hour;
                }
                if (min < 10) {
                    min = "0" + min;
                }
                if (second < 10) {
                    second = "0" + second;
                }

                var time_view = datetime_format_ary[1];
                if (time_view == 'HH:mm:ss') {
                    //var new_date_str = month + "/" + date + "/" + year + " " + hour + ":" + min + ":" + second;
                    var new_date_str = year + "/" + month + "/" + date + " " + hour + ":" + min + ":" + second;
                }
                else {
                    //var new_date_str = month + "/" + date + "/" + year + " " + hour + ":" + min;
                    var new_date_str = year + "/" + month + "/" + date + " " + hour + ":" + min;
                }
            }
            else {
                var new_date_str = date_str;
            }
        }

        return new_date_str;
    }
    catch (e) {
        alert1(e + '_convert_fix_format_date_on_submit');
    }
}



// Take a time in 24 hour format and format it in 12 hour format
function convertTo12Hour(time) {
    try {
        var time_part_array = time.split(":");
        var ampm = 'AM';

        if (time_part_array[0] >= 12) {
            ampm = 'PM';
        }

        if (time_part_array[0] > 12) {
            time_part_array[0] = time_part_array[0] - 12;
        }

        var formatted_time = time_part_array[0] + ':' + time_part_array[1] + ' ' + ampm;
        return formatted_time;
    }
    catch (e) {
        alert1(e + '_convertTo12Hour');
    }
}

function convertTo24Hour(time) {
    try {
        var hours = parseInt(time.substr(0, 2));

        if (time.indexOf('AM') != -1 && hours == 12) {
            time = time.replace('12', '0');
        }
        if (time.indexOf('PM') != -1 && hours < 12) {
            time = time.replace(hours, (hours + 12));
        }
        time = time.replace(/(AM|PM)/, '');

        return time;
    }
    catch (e) {
        alert1(e + '_convertTo24Hour');
    }
}

function convert_meter_to_km(t_distance) {
    if (t_distance >= 1000) {
        var distance_str = (t_distance / 1000).toFixed(2) + ' km';
    }
    else {
        var distance_str = t_distance + ' m';
    }
    return distance_str;
}

var speech_id;
function convert_speech_to_text(eld_id) {
    speech_id = eld_id;

    var q_jsonobj = [];
    cordova.exec(onsucess_convert_speech_to_text, onfail, 'SpeechtotextPlugin', 'anAction', q_jsonobj);
}

function onsucess_convert_speech_to_text(e) {
    $(speech_id).val(e);
}

function onfail(e) {
    //alert1(e + '_onfail()');
    alert(e);
    loading_hide();
}

function onfail_cam() {
    // user press cancel button after capturing photo
    curr_btn_mode = "";
    close_full_view_image_type7();
    loading_hide();
}

function close_full_view_image_type7() {
    storage.setItem('crash_status', JSON.stringify('0'));
    $("#img_full_type7").attr("src", "");
    $("#div_bottom_div_type7").empty();
    $("#popup_outer_div_type7").hide();
    $("#popup_inner_div_type7").hide();
}

function find_index_by_que_id(curr_form_flag, f_que_id) {
    if (curr_form_flag == 0 || curr_form_flag == 6 || curr_form_flag == 7) {
        let task_create_popup = $('.popup-new-task-create.modal-in:visible');
        if (task_create_popup.length > 0) {
            //new task create popup [FT-08052025]
            var t_Array = jsonObj_task_add;
        }
        else {
            // normal form
            var t_Array = jsonObj_old;
        }
    } else if (curr_form_flag == 1 || curr_form_flag == 4 || curr_form_flag == 5) {
        // type22 form
        var t_Array = jsonObj_type22;
    } else if (curr_form_flag == 2 || curr_form_flag == 3) {
        // type23 form
        var t_Array = jsonObj_type23;
    }

    var index;
    var len = t_Array.length;
    for (f = 0; f < len; f++) {
        var t_que_id = t_Array[f].que_id;
        if (f_que_id == t_que_id) {
            index = f;
            break;
        }
    }

    return index;
}

//====read more click for task list card
function show_more_task_data(e) {
    // record if our text is expanded
    var isExpanded = $(e).hasClass("expand");

    //close all open cards
    $(".readmore.expand").removeClass("expand");
    $(".readmore-link.expand").removeClass("expand");
    $(e).html('<div class="showmore-box"><i class="fa fa-angle-down"></i></div>');

    // if target wasn't expand, then expand it
    if (!isExpanded) {
        $(e).parent(".readmore").addClass("expand");
        $(e).addClass("expand");
        $(e).html('<div class="showmore-box"><i class="fa fa-angle-up"></i></div>');
    }
}

// view full view photo
function mk_get_full_view_pic(src, photo_name) {
    var common_PhotoBrowser = myApp.photoBrowser({
        zoom: false,
        toolbar: false,
        photos: [{
            url: src,
            caption: photo_name
        }],
        type: 'popup',
        theme: 'dark',
        captionsTheme: 'dark'
    });

    common_PhotoBrowser.open();
}


// autofill data by class - to textbox, numeric box, dropdown, photo etc. (e.g. from type30 response - 18042022)
function autofill_data_by_class(box_class, answer) {
    try {

        if (Array.isArray(answer)) {
            var fieldvalue = answer[0];
        } else {
            var fieldvalue = answer;
        }

        var box_id = [];

        var ddl_found = $("." + box_class + "").find("select");
        if (ddl_found.length > 0) {
            // below dropdown found to fill
            var below_ddl_id = $("." + box_class + "").find("select").attr("id");
            $("#" + below_ddl_id + "").val(fieldvalue);

            // ignore case in normal drodown type 3 - 22032021
            $("#" + below_ddl_id + " option").each(function () {
                if ($(this).val().toLowerCase() == fieldvalue.toLowerCase()) $(this).attr("selected", "selected");
            });

            var onchange_avail = $("#" + below_ddl_id + "").attr("onchange");
            if (onchange_avail == '' || onchange_avail == null || onchange_avail == undefined) { }
            else {
                $("#" + below_ddl_id + "").trigger("onchange");
            }
        }
        else {
            // below text box found to fill
            $("." + box_class + " :input").each(function () {
                var box_id_temp = ($(this).attr('id'));
                if (box_id_temp.indexOf("hdn_") > -1) { }
                else {
                    box_id.push(box_id_temp);
                }
            });

            if (box_id.length == 0 || box_id[0] == undefined) {
                $("." + box_class + " label[id^='lbl_up_']").each(function () {
                    var box_id_temp = ($(this).attr('id'));
                    box_id.push(box_id_temp);
                });
            }

            if (box_id.length == 0 || box_id[0] == undefined) {
                $("." + box_class + " img[id^='cbtn_']").each(function () {
                    var box_id_temp = ($(this).attr('id'));
                    box_id.push(box_id_temp);
                });
            }

            for (fk = 0; fk < box_id.length; fk++) {
                var curr_box_id = box_id[fk];

                var tagName = $("#" + curr_box_id + "").prop("tagName");
                if (tagName == "TEXTAREA") {
                    $("#" + curr_box_id + "").attr("rows", "5")
                }

                if (curr_box_id.indexOf("cal_") > -1) {
                    var mode = $("#" + curr_box_id + "").attr("data-field");
                    fieldvalue = convert_datetime_by_format(fieldvalue, mode);
                }

                if (curr_box_id.indexOf("lbl_up_") > -1) {
                    // upload control
                    var act_file_name = answer[0];
                    var encrypted_file_name = answer[1];
                    var encrypted_file_path = answer[2];
                    var t_new_id = curr_box_id.replace("lbl_up_", "");
                    var t_que_id = $("#div_upload_doc_" + t_new_id + "").attr("que_id");
                    var t_checksheet_id = curr_survey_data["check_type"];
                    var param_view = "check_down_doc_entry('" + t_new_id + "','" + encrypted_file_path + "','" + t_que_id + "', '" + t_checksheet_id + "')";

                    $('#btn_select_' + t_new_id + '').text('Change File');
                    $('#lbl_up_' + t_new_id + '').html(act_file_name);
                    $('#lbl_up_' + t_new_id + '').attr("onclick", param_view);
                    $('#lbl_up_' + t_new_id + '').css("color", "blue");

                    var date_s = new Date();
                    var time = date_s.getTime();
                    var company_id = JSON.parse(storage.getItem('company_id'));
                    var user_id = JSON.parse(storage.getItem('user_id'));
                    var siteid = JSON.parse(storage.getItem('siteid'));
                    var p_name = company_id + "_" + user_id + "_" + siteid + "_" + time + "_0";

                    var up_obj = [];
                    up_obj.push({
                        'act_file_name': act_file_name,
                        'enc_file_name': encrypted_file_name,
                        'file_path': encrypted_file_path,
                        'sys_file_name': p_name,
                        'sharepoint_link': '',
                        'photo_id': "",
                        'photo_size': ""
                    });

                    $('#lbl_up_' + t_new_id + '').attr('for', JSON.stringify(up_obj));

                    var parent_task_id = JSON.parse(storage.getItem('p_server_task_id'));
                    var t_upload_type = "transport"
                    var param_down = "toggle_doc_download('" + t_new_id + "', '" + t_que_id + "', '" + t_upload_type + "', '" + act_file_name + "', '" + encrypted_file_path + "', '" + encrypted_file_name + "', '', '" + parent_task_id + "')";
                    var d_str = '<a id="doc_down_' + t_new_id + '" name="0" onclick="' + param_down + '" style="font-weight:bold; visibility:hidden">Download Document</a>';

                    $('#div_upload_doc_' + t_new_id + '').append(d_str);

                }
                else if (curr_box_id.indexOf("cbtn_") > -1) {
                    // img
                    var que_id = $("#" + curr_box_id + "").parents("div[id^='div_cbtn_']").attr("que_id");
                    var img_que_id = que_id;
                    var img_div_id = curr_box_id;
                    $("#" + curr_box_id + "").attr("src", fieldvalue);
                    var img_id_type22 = storage.getItem('img_id_type22');
                    check_photo_entry_for_autofill(fieldvalue, img_id_type22, img_que_id, img_div_id)
                }
                else {
                    // textbox/numeric fill
                    $("#" + curr_box_id + "").val(fieldvalue);
                }
            }
        }
    }
    catch (e) {
        alert1(e + '_autofill_data_by_class()');
    }
}








//////////////////////////// unused code
//function get_my_task() {
//    var query = "select status from task_master where username = '" + username + "'";
//    var q_jsonobj = [];
//    q_jsonobj.push({
//        data: query,
//        p: "1"
//    });
//    cordova.exec(onsuccess_get_my_task, onfail_get_my_task, 'SqlitePlugin', 'showValues', q_jsonobj);
//}

//function onsuccess_get_my_task(e) {
//    var myArray = JSON.parse(e);
//    if (myArray.length > 0) {
//        var comp_count = 0;
//        for (i = 0; i < myArray.length; i++) {
//            var status = myArray[i].status;
//            if (status == 2) {
//                comp_count++;
//            }
//        }

//        var pen_count = myArray.length - comp_count;
//        draw_my_task_chart(comp_count, pen_count);
//    }
//    else {
//        $("#pro_task").html('Completed Sites: 0 <br> Pending Sites: 0');
//        draw_my_task_chart(0, 0);
//    }
//}

//function onfail_get_my_task(e) {
//    $("#pro_task").html('Completed Sites: 0 <br> Pending Sites: 0');
//}

//function draw_my_task_chart1(comp_count, pen_count) {
//    try {
//        $("#pro_task_comp").html('(' + comp_count + ')');
//        $("#pro_task_pen").html('(' + pen_count + ')');

//        var canvas;
//        var ctx;
//        var lastend = 0;
//        var pieColor = ['#4caf50', '#f44336'];
//        var pieData = [comp_count, pen_count];
//        var pieTotal = comp_count + pen_count; // done manually for demo

//        canvas = document.getElementById("canvas");
//        ctx = canvas.getContext("2d");

//        ctx.clearRect(0, 0, canvas.width, canvas.height);

//        var hwidth = ctx.canvas.width / 2;
//        var hheight = ctx.canvas.height / 2;


//        for (var i = 0; i < pieData.length; i++) {
//            ctx.fillStyle = pieColor[i];
//            ctx.beginPath();
//            ctx.moveTo(hwidth, hheight);
//            ctx.arc(hwidth, hheight, hheight, lastend, lastend +
//              (Math.PI * 2 * (pieData[i] / pieTotal)), false);


//            ctx.lineTo(hwidth, hheight);
//            ctx.fill();

//            var radius = hheight / 1.5; //use suitable radius
//            var endAngle = lastend + (Math.PI * (pieData[i] / pieTotal));
//            var setX = hwidth + Math.cos(endAngle) * radius;
//            var setY = hheight + Math.sin(endAngle) * radius;
//            ctx.fillStyle = "#ffffff";
//            ctx.font = '14px Calibri';
//            ctx.fillText(pieData[i], setX, setY);
//            lastend += Math.PI * 2 * (pieData[i] / pieTotal);
//        }
//    }
//    catch (e) {
//        alert1(e + '_draw_my_task_chart()');
//    }
//}

function mk_get_order_by_obj(ddl_order_by, ddl_order_type) {
    try {

        var order_type = $(ddl_order_type).val();

        var col_name = $(ddl_order_by).val();
        if (col_name == "" || col_name == null || col_name == undefined || col_name == 'Select Order By') {
            var data_json = JSON.parse(storage.getItem('list_json'));
            var list_data = JSON.parse(data_json);
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
            if (col_name == "task_id" || col_name == "assigndate" || col_name == "distance") {
                var order_by_obj = [];
                order_by_obj.push({
                    "checksheet_type": 0,
                    "checksheet_id": 0,
                    "que_id": 0,
                    "data_type": "ValueString",
                    "order_by": col_name,
                    "order_type": order_type
                });
            }
            else {

                var coldata_obj = $(ddl_order_by + " option:selected").attr('name');
                coldata_obj = decodeURIComponent(coldata_obj);
                coldata_obj = JSON.parse(coldata_obj);

                var checksheet_type = coldata_obj.checksheet_type;
                var checksheetID = coldata_obj.checksheetID;
                var qid = coldata_obj.qid;
                var ctrl_type = coldata_obj.ctrl_type;

                var system_var = coldata_obj.system_var;
                if (system_var == "Status_Name") {
                    var value_Array = coldata_obj.value;
                    if (value_Array == "" || value_Array == null || value_Array == undefined) {
                        value_Array = [];
                    }
                }

                if (ctrl_type == 4 || ctrl_type == 12) {
                    var input_type = "int";
                }
                else if (ctrl_type == 13 || ctrl_type == 14 || ctrl_type == 15 || ctrl_type == 16 || ctrl_type == 17) {
                    var input_type = "float";
                }
                else if (ctrl_type == 8 || system_var == "CreateDTTM" || system_var == "survey_date") {
                    var input_type = "date";
                }
                else {
                    //other controls
                    var input_type = "ValueString";
                }

                if (checksheet_type == "" || checksheet_type == null || checksheet_type == undefined) {
                    checksheet_type = 0;
                }

                var order_by_obj = [];
                order_by_obj.push({
                    "checksheet_type": checksheet_type,
                    "checksheet_id": checksheetID,
                    "que_id": qid,
                    "data_type": input_type,
                    "order_by": "column",
                    "order_type": order_type,
                    "column_name": col_name
                });
            }
        }

        return order_by_obj;
    }
    catch (e) {
        alert(e + '_mk_get_order_by_obj()');
        loading_hide();
    }
}


function get_upload_media_live_link(que_id, check_type, t_checksheet_type_id) {
    try {

        var primary_id = JSON.parse(localStorage.getItem('ID_useType22'));
        if (primary_id == "" || primary_id == null || primary_id == undefined) {
            primary_id = JSON.parse(storage.getItem('server_task_id'));
        }

        var user_id = JSON.parse(storage.getItem('user_id'));
        var uniqcode = JSON.parse(storage.getItem('uniqcode'));
        var global_resumable_url = JSON.parse(storage.getItem('global_resumable_url'));

        if (t_checksheet_type_id == "" || t_checksheet_type_id == null || t_checksheet_type_id == undefined) {
            if (form_flag == 7) {
                var checksheet_type_filter = "3";
            } else if (form_flag == 6) {
                var checksheet_type_filter = "5";
            } else if (form_flag == 8) {
                var checksheet_type_filter = "7";
            }
            else {
                var checksheet_type_filter = "1";
            }
        }
        else {
            var checksheet_type_filter = t_checksheet_type_id;
        }

        var type22_popup = $('.popup-type22:visible');
        if (type22_popup.length > 0) {
            var type22_img_que_id = storage.getItem('img_id_type22');
            if (type22_current_mode == 'edit') {
                // edit mode
                var t_row_index_no = row_index_no;
            }
            else {
                //  insert mode
                var last_index = $('#row_index_' + type22_new_id + '').val();
                last_index = parseInt(last_index);
                var t_row_index_no = last_index + 1;
            }
        }
        else {
            var type22_img_que_id = 0;
            var t_row_index_no = 0;
        }

        var random_str = "&random=" + new Date().getTime();

        //var media_link = "" + global_resumable_url + "/api/GetFile/Select_File_Details?cid="
        //    + check_type + "&t22id=" + type22_img_que_id + "&t22i=" + t_row_index_no + "&id=" + primary_id + "&qd=" + que_id + "&ctype=" + checksheet_type_filter + "&ud=" + user_id + "&uc=" + uniqcode + random_str + "";

        var media_link = "" + global_resumable_url + "GetFile/Select_File_Details?cid="
            + check_type + "&t22id=" + type22_img_que_id + "&t22i=" + t_row_index_no + "&id=" + primary_id + "&qd=" + que_id + "&ctype=" + checksheet_type_filter + "&ud=" + user_id + "&uc=" + uniqcode + random_str + "";

        return media_link;
    }
    catch (e) {
        alert(e + '_get_upload_media_live_link');
    }
}

function vibrate_device() {
    try {
        var q_jsonobj = [];
        cordova.exec(function (e) { }, function (e) { }, 'VibrationPlugin', 'vibrate', q_jsonobj);
    }
    catch (e) { }
}


function get_profile_pic_path_android_ios(page) {
    let profile_user_name = JSON.parse(storage.getItem('username'));

    if (page == 'selection') {
        $("#menu_img_profile").parent("a").append("<span class='tabbar-label'>" + profile_user_name + "</span>")
    }
    else {
        $(".navbar-fixed .navbar-inner .right").append("<span style='display: block; position: absolute; right: 6px; bottom: 0; font-size: 12px;'>" + profile_user_name + "</span>")
    }

    $("#menu_img_profile").attr("onerror", "imageError()");

    if (F7_device == 'ios') {
        //set profile pic for ios [FT -30052024]
        var pro_pic_path = JSON.parse(storage.getItem('profile_pic_path_ios'));
    }
    else {
        var pro_pic_path = JSON.parse(storage.getItem('profile_pic_path'));
    }

    if (pro_pic_path == "" || pro_pic_path == null || pro_pic_path == undefined) {
        var user_checksheet = localStorage.getItem('profile_checksheetid');
        if (user_checksheet == "" || user_checksheet == null || user_checksheet == undefined) { }
        else {

            var user_id = JSON.parse(storage.getItem('user_id'));
            var primary_id = user_id;
            var uniqcode = JSON.parse(storage.getItem('uniqcode'));
            var global_resumable_url = JSON.parse(storage.getItem('global_resumable_url'));
            var random_str = "&random=" + new Date().getTime();

            pro_pic_path = "" + global_resumable_url + "GetFile/Select_File_Details?cid="
                + user_checksheet + "&t22id=0&t22i=0&id=" + primary_id + "&qd=4008&ctype=7&ud=" + user_id + "&uc=" + uniqcode + random_str + "";

        }
    }

    return pro_pic_path;
}

function imageError() {

    var pro_pic_path = "images/profile_pic.png";
    var user_checksheet = localStorage.getItem('profile_checksheetid');
    if (user_checksheet == "" || user_checksheet == null || user_checksheet == undefined) { }
    else {

        var user_id = JSON.parse(storage.getItem('user_id'));
        var primary_id = user_id;
        var uniqcode = JSON.parse(storage.getItem('uniqcode'));
        var global_resumable_url = JSON.parse(storage.getItem('global_resumable_url'));
        var random_str = "&random=" + new Date().getTime();

        pro_pic_path = "" + global_resumable_url + "GetFile/Select_File_Details?cid="
            + user_checksheet + "&t22id=0&t22i=0&id=" + primary_id + "&qd=4008&ctype=7&ud=" + user_id + "&uc=" + uniqcode + random_str + "";

    }

    $('#menu_img_profile').attr('src', pro_pic_path);
    $('#menu_img_profile').attr('onerror', "imageError_set_defualt()");

}

function imageError_set_defualt() {
    var pro_pic_path = "images/profile_pic.png";
    $('#menu_img_profile').attr('src', pro_pic_path);
    $("#menu_img_profile").removeAttr("onerror");
}

function redirect_page_pdf_preview(task_id, c_id, page_type) {
    try {

        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);

        var circlewise_pdf = list_data[0].circlewise_pdf;
        if (circlewise_pdf == "" || circlewise_pdf == null || circlewise_pdf == undefined) {
            var DynamicPdfTypeId = list_data[0].pdf_type;
        }
        else {
            var circle_column = circlewise_pdf[0].circle_column;
            var pdf_data = circlewise_pdf[0].pdf_data;

            var columndata_str = $('#lst_sys_var_' + task_id + '').val();
            var columndata_Array = JSON.parse(decodeURIComponent(columndata_str));
            var circle_name = '';
            for (c = 0; c < columndata_Array.length; c++) {
                var key = columndata_Array[c].header;
                if (key == circle_column) {
                    circle_name = columndata_Array[c].ans;
                    break;
                }
            }

            if (circle_name == "") {
                alert("Circle column not found in columndata!");
            }
            else {
                for (p = 0; p < pdf_data.length; p++) {
                    var circle = pdf_data[0].circle;
                    if (circle == circle_name) {
                        var DynamicPdfTypeId = pdf_data[p].pdf_type;
                        break;
                    }
                }
            }
        }

        var win_name = 'pages/EF_PDF_Report.aspx';
        var feature_id = localStorage.getItem('company_feature_id');
        var role_id = JSON.parse(storage.getItem('role_id'));

        if (c_id == "" || c_id == null || c_id == undefined || c_id == "undefined") {
            c_id = "0";
        }

        let domain_url = JSON.parse(storage.getItem('global_url'));
        domain_url = domain_url.replace('/services/', '');
        var company_id = JSON.parse(storage.getItem('company_id'));
        let user_id = JSON.parse(storage.getItem('user_id'));
        var user_name = JSON.parse(storage.getItem('username'));
        var u_c = JSON.parse(storage.getItem('uniqcode'));

        var PDF_path = domain_url + win_name + '?Dynamic_PDF_Type_Id=' + DynamicPdfTypeId + '&id=' + feature_id + '&hdrl=' + role_id + '&Task_id=' + task_id + '&cus_id=' + c_id + '&u_id=' + user_id + '&u_name=' + user_name + '&u_c=' + u_c + '&comp_id=' + company_id + '&menu=0&header=0?n=' + new Date().getTime() + ';';

        if (page_type == "checksheet") {
            var pdf_id = JSON.parse(storage.getItem('pdf_id'));
            var answer = [];
            answer.push(PDF_path);

            var curr_form_flag = form_flag;
            if (curr_form_flag == 0 || curr_form_flag == 6 || curr_form_flag == 7) {
                let task_create_popup = $('.popup-new-task-create.modal-in:visible');
                if (task_create_popup.length > 0) {
                    //new task create popup [FT-08052025]
                    jsonObj_task_add[pdf_id].ans = answer;
                }
                else {
                    // normal form
                    jsonObj_old[pdf_id].ans = answer;
                }
            } else if (curr_form_flag == 1 || curr_form_flag == 4 || curr_form_flag == 5) {
                // type22 form
                jsonObj_type22[pdf_id].ans = answer;
            } else if (curr_form_flag == 2 || curr_form_flag == 3) {
                // type23 form
                jsonObj_type23[pdf_id].ans = answer;
            }
        }

        if (F7_device == 'ios') {
            redirect_on_HTML_PDF_preview_ios(PDF_path);
        }
        else {
            window.open(PDF_path, '_blank');
        }
    }
    catch (e) {
        alert(e + '_redirect_page_pdf_preview');
    }
}

function redirect_on_HTML_PDF_preview_ios(t_path) {
    try {
        var q_jsonobj = [];
        q_jsonobj.push({
            'path': t_path,
            'id': 0
        });
        cordova.exec(onsuccess_redirect_on_HTML_PDF_preview_ios, onfail_redirect_on_HTML_PDF_preview_ios, 'openURLSafariPlug', 'anAction', q_jsonobj);

    }
    catch (e) {
        alert1(e + '_redirect_on_HTML_PDF_preview_ios');
    }
}

function onsuccess_redirect_on_HTML_PDF_preview_ios(e) {
    loading_hide();
}

function onfail_redirect_on_HTML_PDF_preview_ios(e) {
    loading_hide();
    alert1(e + '_onfail_redirect_on_HTML_PDF_preview_ios');
}

function millisecondsToDays(milliseconds) {
    return milliseconds / (24 * 60 * 60 * 1000);
}

function type36_exist_json(jsonObj) {
    var exists = false;
    jsonObj = JSON.parse(jsonObj);
    // Check if the key exists in the object       
    if (jsonObj.some(x => x['type'] == 36)) {
        exists = true;
    }
    return exists;
}

function merge_checksheet_template_n_log_form_json(template_json, log_json) {
    try {
        for (let i = 0; i < template_json.length; i++) {
            var temp_que_id = template_json[i].que_id;
            var temp_type = template_json[i].type;
            if (temp_type == 0 || temp_type == 5 || temp_type == 10 || temp_type == 500) { }
            else {
                for (j = 0; j < log_json.length; j++) {
                    var log_que_id = log_json[j].que_id;
                    var log_type = log_json[j].type;
                    if (log_type == 0 || log_type == 5 || log_type == 10 || log_type == 500) { }
                    else {
                        if (log_que_id == temp_que_id) {
                            var log_ans = log_json[j].ans;
                            template_json[i].ans = log_ans;
                            break;
                        }
                    }
                }
            }
        }
        return template_json;
    }
    catch (e) {
        alert(e + '_merge_checksheet_template_n_log_form_json');
    }
}

check_n_upload_clone_photo = (new_id) => {

    var autofill_photo_Array = $("img[autofill='true']");
    if (autofill_photo_Array.length > 0) {

        let img_obj = autofill_photo_Array[0];
        let param_obj = $(img_obj).attr("autofill_obj");
        param_obj = JSON.parse(param_obj);

        let old_id = param_obj[0].old_id;
        let old_cid = param_obj[0].old_cid;
        let old_qd = param_obj[0].old_qd;
        let new_ctype = param_obj[0].new_ctype;
        let new_cid = param_obj[0].new_cid;
        let new_qd = param_obj[0].new_qd;

        upload_autofill_photo(old_id, old_cid, old_qd, new_id, new_ctype, new_cid, new_qd);
    }
}


upload_autofill_photo = (old_id, old_cid, old_qd, new_id, new_ctype, new_cid, new_qd) => {
    try {
        var param_obj = [];
        param_obj.push({
            "old_id": old_id,
            "old_cid": old_cid,
            "old_qd": old_qd,
            "old_t22id": "0",
            "old_t22i": "0",
            "new_id": new_id,
            "new_ctype": new_ctype,
            "new_cid": new_cid,
            "new_qd": new_qd,
            "new_t22id": "0",
            "new_t22i": "0"
        });

        loading();
        var getdata = new Webservicecall_REST(global_wcf_url + 'Photo_Clone', JSON.stringify(param_obj), function (e) {
            var Suc_Message = e.responseText;
            Suc_Message = eval('(' + Suc_Message + ')');
            var message = Suc_Message[0].message;
            var status = Suc_Message[0].status;
            if (status == 1) {
                var data = Suc_Message[0].data;
                data = JSON.parse(data);

                // actual photo_master id
                let Photo_id = data[0].PHOTO_ID;

            }
            else {
                mk_notify(message, "danger");
                loading_hide();
            }
        }, onfail);
        getdata.callOtherDomain();
    }
    catch (e) {
        loading_hide();
        alert(e + '_upload_autofill_photo');
    }
}

function view_invoice_summary_photo(img_div) {
    try {
        var clickedLink = $("#" + img_div + "");
        var img_src = $("#" + img_div + "").attr('src');
        myApp.popover('.popover-type7', clickedLink);
        $("#popover_viewphoto").attr("onclick", "get_full_view_image_type7_F7('" + img_src + "')");
        $("#popover_re_capture").hide();
    }
    catch (e) {
        alert(e + '_view_invoice_summary_photo');
    }
}

function get_column_array_for_type8_as_per_dateFormat(datetime_format, display_value) {
    try {
        var datetime_format_ary = datetime_format.split(" ");
        var time_format = datetime_format_ary[1];

        var day_ary = [01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31];
        var year_ary = (function () {
            var arr = [];
            for (var i = 2000; i <= 2030; i++) { arr.push(i); }
            return arr;
        })();

        var hour_ary = (function () {
            var arr = [];
            for (var i = 0; i <= 23; i++) {
                if (i < 10) {
                    i = '0' + i;
                }
                arr.push(i);
            }
            return arr;
        })();

        var minute_ary = (function () {
            var arr = [];
            for (var i = 0; i <= 59; i++) {
                if (i < 10) {
                    i = '0' + i;
                }
                arr.push(i);
            }
            return arr;
        })();
        var seconds_ary = (function () {
            var arr = [];
            for (var i = 0; i <= 59; i++) {
                if (i < 10) {
                    i = '0' + i;
                }
                arr.push(i);
            }
            return arr;
        })();


        if (datetime_format.indexOf("dd/mm/yyyy") > -1) {
            if (time_format == "HH:mm:ss") {
                var column_ary = [
                    // Days
                    {
                        values: day_ary,
                    },
                    // Months
                    {
                        values: ('0 1 2 3 4 5 6 7 8 9 10 11').split(' '),
                        displayValues: display_value.split(' '),
                        textAlign: 'left'
                    },
                    // Years
                    {
                        values: year_ary,
                    },
                    // Space divider
                    {
                        divider: true,
                        content: '  '
                    },
                    // Hours
                    {
                        values: hour_ary,
                    },
                    // Divider
                    {
                        divider: true,
                        content: ':'
                    },
                    // Minutes
                    {
                        values: minute_ary,
                    },
                    // Divider
                    {
                        divider: true,
                        content: ':'
                    },
                    // Seconds
                    {
                        values: seconds_ary,
                    }
                ];
            }
            else {
                var column_ary = [
                    // Days
                    {
                        values: day_ary,
                    },
                    // Months
                    {
                        values: ('0 1 2 3 4 5 6 7 8 9 10 11').split(' '),
                        displayValues: display_value.split(' '),
                        textAlign: 'left'
                    },
                    // Years
                    {
                        values: year_ary,
                    },
                    // Space divider
                    {
                        divider: true,
                        content: '  '
                    },
                    // Hours
                    {
                        values: hour_ary,
                    },
                    // Divider
                    {
                        divider: true,
                        content: ':'
                    },
                    // Minutes
                    {
                        values: minute_ary,
                    }
                ];
            }
        }
        else {
            if (time_format == "HH:mm:ss") {
                var column_ary = [
                    // Months
                    {
                        values: ('0 1 2 3 4 5 6 7 8 9 10 11').split(' '),
                        displayValues: display_value.split(' '),
                        textAlign: 'left'
                    },
                    // Days
                    {
                        values: day_ary,
                    },
                    // Years
                    {
                        values: year_ary,
                    },
                    // Space divider
                    {
                        divider: true,
                        content: '  '
                    },
                    // Hours
                    {
                        values: hour_ary,
                    },
                    // Divider
                    {
                        divider: true,
                        content: ':'
                    },
                    // Minutes
                    {
                        values: minute_ary,
                    },
                    // Divider
                    {
                        divider: true,
                        content: ':'
                    },
                    // Seconds
                    {
                        values: seconds_ary,
                    }
                ];
            }
            else {
                var column_ary = [
                    // Months
                    {
                        values: ('0 1 2 3 4 5 6 7 8 9 10 11').split(' '),
                        displayValues: display_value.split(' '),
                        textAlign: 'left'
                    },
                    // Days
                    {
                        values: day_ary,
                    },
                    // Years
                    {
                        values: year_ary,
                    },
                    // Space divider
                    {
                        divider: true,
                        content: '  '
                    },
                    // Hours
                    {
                        values: hour_ary,
                    },
                    // Divider
                    {
                        divider: true,
                        content: ':'
                    },
                    // Minutes
                    {
                        values: minute_ary,
                    }
                ];
            }
        }


        return column_ary;
    }
    catch (e) {
        alert(e + '_get_column_array_for_type8_as_per_dateFormat');
    }
}

upload_autofill_photo_temp = (old_id, old_cid, old_qd, new_ctype, new_cid, new_qd, autofill_form_flag, t_curr_box_id) => {
    try {
        var param_obj = [];
        param_obj.push({
            "old_id": old_id,
            "old_cid": old_cid,
            "old_qd": old_qd,
            "old_t22id": "0",
            "old_t22i": "0",
            "new_ctype": new_ctype,
            "new_cid": new_cid,
            "new_qd": new_qd,
            "new_t22id": "0",
            "new_t22i": "0"
        });

        $("#" + t_curr_box_id + "").parent("div").find('i.fa-spinner').remove();
        $("#" + t_curr_box_id + "").parent("div").append('<i class="fa fa-spinner fa-pulse img-loading"></i>');
        //myApp.showPreloader('Fetching Image...');
        var getdata = new Webservicecall_REST(global_wcf_url + 'Photo_Temp_Clone', JSON.stringify(param_obj), function (e) {
            var Suc_Message = e.responseText;
            Suc_Message = eval('(' + Suc_Message + ')');
            var message = Suc_Message[0].message;
            var status = Suc_Message[0].status;
            if (status == 1) {
                var data = Suc_Message[0].data;
                data = JSON.parse(data);

                // actual photo_master id
                let Photo_id = data[0].PHOTO_TEMP_ID;
                if (Photo_id == '' || Photo_id == null || Photo_id == undefined) { }
                else {
                    Photo_Id_Array.push({ "photo_id": Photo_id });

                    if (autofill_form_flag == 0 || autofill_form_flag == 6) {
                        for (var j = 0; j < jsonObj_old.length; j++) {
                            var json_que_id = jsonObj_old[j].que_id;
                            if (new_qd == json_que_id) {
                                let task_create_popup = $('.popup-new-task-create.modal-in:visible');
                                if (task_create_popup.length > 0) {
                                    //replace new photo_id in ans json [FT-11072025]
                                    jsonObj_task_add[j].ans[4] = Photo_id;
                                }
                                else {
                                    jsonObj_old[j].ans[4] = Photo_id;
                                }
                                break;
                            }
                        }
                    }
                }
            }
            else {
                mk_notify(message, "danger");
                loading_hide();
            }

            setTimeout(function () {
                $("#" + t_curr_box_id + "").parent("div").find('i.fa-spinner').remove();
            }, 1000, t_curr_box_id);

            //myApp.hidePreloader();

        }, onfail);
        getdata.callOtherDomain();
    }
    catch (e) {
        loading_hide();
        alert(e + '_upload_autofill_photo_temp');
    }
}

rebind_autofill_photo_temp = (t_cam_id, t_src) => {
     setTimeout(function () {
        $(t_cam_id).attr("src", t_src);
    }, 2000, t_cam_id, t_src);
}

function get_common_localStorage(key_name) {
    try {
        //used this common localStorage for 3 later task listing (darshit.eng) [Ft-14052025]
        var curr_flow_id = JSON.parse(storage.getItem('wayflow'));
        var LS_value = localStorage.getItem(key_name + curr_flow_id);
        return LS_value;
    }
    catch (e) {
        alert(e + '_get_common_localStorage')
    }
}

function set_common_localStorage(key_name, key_value) {
    try {
        //used this common localStorage for 3 later task listing (darshit.eng) [Ft-14052025]
        var curr_flow_id = JSON.parse(storage.getItem('wayflow'));
        localStorage.setItem(key_name + curr_flow_id, key_value);
    }
    catch (e) {
        alert(e + '_set_common_localStorage')
    }
}
