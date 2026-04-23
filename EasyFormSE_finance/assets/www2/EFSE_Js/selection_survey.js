
function create_tabs_by_status() {
    try {
        $('#div_tab_bar').empty();
        storage.setItem('checksheet_type_filter', JSON.stringify('1'));

        let t_curr_btn_mode = JSON.parse(storage.getItem('curr_btn_mode'));
        if (t_curr_btn_mode != "updatetasknautoopentaskform") {
            storage.setItem('curr_btn_mode', JSON.stringify(''));
        }
        localStorage.setItem('shortcut_button_array', JSON.stringify(""));
        localStorage.setItem('is_shortcutbutton', 'false');

        var tab_str = '';

        var selection_type = JSON.parse(storage.getItem('survey_type'));
        var tab_index = JSON.parse(storage.getItem('tab_index'));
        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var tab_name = list_data[0].tab_name;
        if (tab_name == '' || tab_name == null || tab_name == undefined) {
            var param = "select_survey_type_tab('1','0')";
            tab_str += '<a href="#tab1" id="f7_survey_td_0" class="tab-link" onclick=' + param + ' style="text-decoration: none; display: inline-table; width:50%; text-align:center; padding-top: 14px">PENDING<div id="tabCount_0" class="numberCircle">0</div></a>';
            var param = "select_survey_type_tab('2','1')";
            tab_str += '<a href="#tab2" id="f7_survey_td_1" class="tab-link" onclick=' + param + ' style="text-decoration: none; display: inline-table; width:50%; text-align:center; padding-top: 14px">COMPLETED<div id="tabCount_Comp" class="numberCircle">0</div></a>';
            var param = "select_survey_type_tab('3','2')";
            tab_str += '<a href="#tab3" id="f7_survey_td_2" class="tab-link tab-upload" onclick=' + param + ' style="text-decoration: none; display: none; width:50%; text-align:center; padding-top: 14px">UPLOAD<div id="tabCount_Up" class="numberCircle">0</div></a>';
            tab_str += '<span class="tab-link-highlight" style="display:none !important; width: 50% !important; transform: translate3d(0%, 0px, 0px);"></span>';
            $('#div_tab_bar').append(tab_str);
        }
        else {
            var list_data_Array = JSON.parse(storage.getItem('list_json_Array'));
            list_data_Array = JSON.parse(list_data_Array);

            if (selection_type == 3) {
                var f_list_data = JSON.stringify(list_data_Array[0]);
                storage.setItem('tab_index', JSON.stringify(0));
            }
            else {
                var json_len = list_data_Array.length;
                if (tab_index > json_len - 1) {
                    // set tab index 23012023-DV
                    tab_index = 0;
                    storage.setItem('tab_index', JSON.stringify(0));
                }

                var f_list_data = JSON.stringify(list_data_Array[tab_index]);
            }

            storage.setItem('list_json', JSON.stringify("[" + f_list_data + "]"));
            var t_list_data = JSON.parse(f_list_data);
            var completed_value = t_list_data.complete;
            var len = list_data_Array.length;
            if (len == 1) {
                if (completed_value == "" || completed_value == null || completed_value == undefined || completed_value == "true") {
                    var tab_per = '50%';
                }
                else {
                    var ios_device = localStorage.getItem('ios_device');
                    if (ios_device == 'iphone' || F7_device == 'android') {
                        var tab_per = '100%';
                    }
                    else {
                        var tab_per = '10%';
                    }
                }
            }
            else {
                var ios_device = localStorage.getItem('ios_device');
                if (ios_device == 'iphone' || F7_device == 'android') {
                    var tab_per = '50%';
                }
                else {
                    var tab_per = '10%';
                }
            }

            var tab_cnt_color = $('.navbar').css('background-color');

            for (i = 0; i < len; i++) {
                var access_type = list_data_Array[i].access_type;
                if (access_type == '' || access_type == null || access_type == undefined || access_type == "mobile" || access_type == "both") {
                    var param = "select_survey_type_tab('1','" + i + "')";
                    tab_str += '<a href="#tab1" id="f7_survey_td_' + i + '" class="tab-link" onclick=' + param + ' style="text-decoration: none; display: inline-table; width:' + tab_per + '; min-width:' + tab_per + '; padding:0 10px; text-align:center; padding-top: 14px">' + list_data_Array[i].tab_name + '<div id="tabCount_' + i + '" style="color: ' + tab_cnt_color + ' !important;"></div></a>';
                }
            }

            if (completed_value == "" || completed_value == null || completed_value == undefined || completed_value == "true") {
                var param = "select_survey_type_tab('2','" + len + "')";
                //tab_str += '<a href="#tab2" id="f7_survey_td_' + len + '" class="tab-link" onclick=' + param + ' style="text-decoration: none; display: inline-table; width:' + tab_per + '; text-align:center; padding-top: 14px">COMPLETED<div id="tabCount_Comp" class="numberCircle">0</div></a>';
                //tab_str += '<a href="#tab2" id="f7_survey_td_' + len + '" class="tab-link" onclick=' + param + ' style="text-decoration: none; display: inline-table; width:' + tab_per + '; min-width:' + tab_per + '; text-align:center; padding-top: 14px">COMPLETED</a>';
                tab_str += '<a href="#tab2" id="f7_survey_td_' + len + '" class="tab-link" onclick=' + param + ' style="text-decoration: none; display: inline-table; width:' + tab_per + '; min-width:' + tab_per + '; padding:0 10px; text-align:center; padding-top: 14px">COMPLETED<div id="tabCount_Comp" style="color: ' + tab_cnt_color + ' !important;"></div></a>';
            }
            var param = "select_survey_type_tab('3','" + (len + 1) + "')";
            //tab_str += '<a href="#tab3" id="f7_survey_td_' + (len + 1) + '" class="tab-link" onclick=' + param + ' style="text-decoration: none; display: inline-table; width:' + tab_per + '; text-align:center; padding-top: 14px">UPLOAD<div id="tabCount_Up" class="numberCircle">0</div></a>';
            //tab_str += '<a href="#tab3" id="f7_survey_td_' + (len + 1) + '" class="tab-link tab-upload" onclick=' + param + ' style="text-decoration: none; display: none; width:' + tab_per + '; min-width:' + tab_per + '; text-align:center; padding-top: 14px">UPLOAD</a>';
            tab_str += '<a href="#tab3" id="f7_survey_td_' + (len + 1) + '" class="tab-link tab-upload" onclick=' + param + ' style="text-decoration: none; display: none; width:' + tab_per + '; min-width:' + tab_per + '; padding:0 10px; text-align:center; padding-top: 14px">UPLOAD<div id="tabCount_Up" style="color: ' + tab_cnt_color + ' !important;"></div></a>';
            tab_str += '<span class="tab-link-highlight" style="display:none !important; width: 120px !important; transform: translate3d(0%, 0px, 0px);"></span>';
            $('#div_tab_bar').append(tab_str);

            if (len == 1) {
                $("#btn_Create_Task").css("left", "85%");
                $("#div_tab_bar").parent("div.tabbar").hide();
            }
            else if (len > 2) {
                // Scroll to the rightmost position in case of > 2 tabs
                var scrollContainer = document.querySelector('#div_tab_bar');
                scrollContainer.scrollLeft = scrollContainer.scrollWidth;

                if (tab_index == 0) {
                    setTimeout(function () {
                        scrollContainer.scrollTo({
                            left: 0,
                            behavior: 'smooth'
                        });
                    }, 1000);
                }
                else {
                    scrollContainer.scrollLeft = 0;

                    var act_tab_left = $('#f7_survey_td_' + tab_index + '').offset().left;
                    setTimeout(function () {
                        scrollContainer.scrollTo({
                            left: act_tab_left,
                            behavior: 'smooth'
                        });
                    }, 1000);
                }


            }
        }

        var match_temp_id = list_data[0].match_temp_id;
        if (match_temp_id == "" || match_temp_id == null || match_temp_id == undefined) {
            match_temp_id = "";
        }
        localStorage.setItem('match_temp_id', match_temp_id);

        var flow_Array = JSON.parse(storage.getItem('flow_Array'));
        if (flow_Array.length == 1) {
            localStorage.setItem('p_match_temp_id', match_temp_id);
        }

        if (selection_type == 3) {
            $("#refresh_btn").css("visibility", "hidden");
            $('#f7_survey_td_' + (len + 1) + '').addClass('active');
            $('#f7_survey_td_' + (len + 1) + '').css('border-bottom', '6px solid rgba(255, 255, 255, .5)');
            $("#btn_Submit").hide();

            $('.tab-upload').css("display", "inline-table");
            $('#div_tab_bar a').css("width", "50%");

            get_list_of_UP_sites();
        }
        else {
            $("#refresh_btn").css("visibility", "visible");
            $('#f7_survey_td_' + tab_index + '').addClass('active');
            $('#f7_survey_td_' + tab_index + '').css('border-bottom', '6px solid rgba(255, 255, 255, .5)');
            get_user_latlong_pm();
        }

    }
    catch (e) {
        //alert1(e + '_create_tabs_by_status()');
        back_button('selection_survey');
    }
}

var active_Tab = 0;
function select_survey_type_tab(selection_type, tab_index) {
    try {
        disable_back_button();
        storage.setItem('tab_index', JSON.stringify(tab_index));
        storage.setItem('checksheet_type_filter', JSON.stringify('1'));
        storage.setItem('curr_btn_mode', JSON.stringify(''));
        localStorage.setItem('shortcut_button_array', JSON.stringify(""));
        localStorage.setItem('is_shortcutbutton', 'false');

        storage.setItem('av', JSON.stringify(''));

        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var survey_mode = list_data[0].survey_mode;
        if (survey_mode == "online") {
            get_saved_filter_data(tab_index);
        }

        active_Tab = tab_index;
        $("#site_list").empty();
        $('.tab-link').removeClass('active');
        $('#f7_survey_td_' + tab_index + '').addClass('active');
        $('.tab-link').css('border-bottom', 'none');
        $('#f7_survey_td_' + tab_index + '').css('border-bottom', '6px solid rgba(255, 255, 255, .5)');

        //if (tab_index > 0) {
        //    //var leftPos = $('#f7_survey_td_' + tab_index + '').scrollLeft();
        //    var tab_width = $('#f7_survey_td_' + tab_index + '').css('width');
        //    $("#div_tab_bar").animate({ scrollLeft: tab_width });
        //}
        /////////////////////----------------/////////////////

        $('.lst_pen').attr('id', '');
        $('.lst_com').attr('id', '');
        $('.lst_upl').attr('id', '');

        if (selection_type == 1) {
            var data_json = JSON.parse(storage.getItem('list_json_Array'));
            var list_data = JSON.parse(data_json);
            var f_list_data = JSON.stringify(list_data[tab_index]);
            storage.setItem('list_json', JSON.stringify("[" + f_list_data + "]"));

            var match_temp_id = list_data[tab_index].match_temp_id;
            if (match_temp_id == "" || match_temp_id == null || match_temp_id == undefined) {
                match_temp_id = "";
            }
            localStorage.setItem('match_temp_id', match_temp_id);

            var flow_Array = JSON.parse(storage.getItem('flow_Array'));
            if (flow_Array.length == 1) {
                localStorage.setItem('p_match_temp_id', match_temp_id);
            }

            var task_value = list_data[tab_index].task;
            var search_value = list_data[tab_index].search;
            if (search_value == "true") {
                $('#btn_Search').show();
            }
            else { $('#btn_Search').hide(); }
            //if (task_value == "true") { $('#btn_Create_Task').show(); }
            //else { $('#btn_Create_Task').hide(); }

            var view_calendar_task = list_data[tab_index].view_calendar_task;
            if (view_calendar_task == "true") {
                $('#btn_Calender_Task').show();
            }
            else {
                $('#btn_Calender_Task').hide();
            }

            $('.lst_pen').attr('id', 'site_list');
            $(".op-show-btns").hide();
        }
        else if (selection_type == 2) {
            $('.lst_com').attr('id', 'site_list');
            $(".op-show-btns").hide();
        }
        else {
            $('.lst_upl').attr('id', 'site_list');
        }
        clearTimeout(up_Timer1);
        storage.setItem('survey_type', JSON.stringify(selection_type));

        // default listing
        limit_range = default_range; // set default range limit
        query_type = 1; // regular site listing
        aggregate_sum = 0;
        aggregate_min = 0;
        aggregate_max = 0;
        // //

        if (selection_type == 1) {
            // pending
            get_user_latlong_pm();
        } else if (selection_type == 2) {
            // completed
            $("#btn_Submit").hide();
            get_list_of_completed_sites();
        } else if (selection_type == 3) {
            // upload pending
            $("#btn_Submit").hide();
            get_list_of_UP_sites();
        }
    } catch (e) {
        alert1(e + '_select_survey_type_tab()');
    }
}


function create_new_task() {
    try {
        //var data_json = JSON.parse(storage.getItem('list_json'));
        //var list_data = JSON.parse(data_json);
        //var task_with_customer = list_data[0].task_with_customer;

        //if (task_with_customer == "true") {
        //    //open popup of cust-list on task create(+) btn click
        //   get_udf_for_cust_list();
        //}
        //else {
        //    select_network_for_create_task()
        //}

        var flow_Array = JSON.parse(storage.getItem('flow_Array'));
        if (flow_Array.length == 1) {
            storage.setItem('parent_type20_columndata', JSON.stringify(''));
        }

        localStorage.setItem('task_Dependency', '');
        select_network_for_create_task();
    }
    catch (e) {
        alert1(e + '_create_new_task');
    }
}

// check network for for create task on "Task" Button
function select_network_for_create_task() {
    try {
        // get data from list_json from selection.js
        //var trip_task_allow = true;
        localStorage.setItem('task_mode', 'create');                            //for task form (create mode/edit mode)

        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);

        var auto_trip = list_data[0].auto_trip;
        if (auto_trip == 'true') {
            var locObj = new MkLocation();
            locObj._getLocation(function (e) {
                var gprs = e[0].gprs;                   //internet: 1 for on and 0 for off 
                if (gprs == '0') {
                    alert1("Network is slow or not working, Please check your internet connection before start trip!");
                }
                else {
                    select_network_for_create_task_POST();
                }
            });
        }
        else {
            select_network_for_create_task_POST();
        }
    } catch (e) {
        //alert1(e + '_select_network_for_create_task()');
        select_network_for_create_task();
    }
}

function select_network_for_create_task_POST() {
    try {
        // get data from list_json from selection.js

        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);

        var add_task = list_data[0].task;

        // override task key when auto open task form
        var auto_open_task_form = list_data[0].auto_open_task_form;
        if (auto_open_task_form == 'true') {
            add_task = "true";
        }

        if (add_task == "true") {
            var li_length = $("#survey_td_1").find("span").text();
            if (li_length == '' || li_length == null || li_length == undefined) {
                var survey_type = JSON.parse(storage.getItem('survey_type'));
                if (survey_type == 1) {
                    var li_length = $("#site_list > li").length;
                    var f_li_text = $('#site_list > li:first').text();
                    if (li_length == 1 && f_li_text == 'No Record Found !') {
                        storage.setItem('tenant_count', JSON.stringify(0));
                    } else {
                        storage.setItem('tenant_count', JSON
                            .stringify(li_length));
                    }
                }
            } else {
                storage.setItem('tenant_count', JSON.stringify(li_length));
            }

            check_last_dummy_entry();

        } else {
            alert1("limited access !");
        }
    } catch (e) {
        //alert1(e + '_select_network_for_create_task_POST()');
        select_network_for_create_task_POST();
    }
}

function check_last_dummy_entry() {
    try {
        //var query = "select tid, checksheetid, moduleid, task_id from task_master where username = '" + username + "' ORDER BY tid desc limit 1";

        var selected_module_id = JSON.parse(storage.getItem('wayflow'));
        var query = "select tid, checksheetid, moduleid, task_id from task_master where username = '" + username + "' and moduleid='" + selected_module_id + "' and server_task_id=0 ORDER BY tid desc limit 1";

        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "1"
        });

        cordova.exec(onsuccess_check_last_dummy_entry, onfail_check_last_dummy_entry, 'SqlitePlugin', 'showValues', q_jsonobj);
    } catch (e) {
        alert1(e + '_check_last_dummy_entry()');
    }
}

function onsuccess_check_last_dummy_entry(e) {
    try {
        var myArray = JSON.parse(e);
        if (myArray.length > 0) {
            var task_id = myArray[0].task_id;
            if (task_id == '' || task_id == null || task_id == undefined || task_id == 'Unknown') {
                // last entry is dummy

                var moduleid = myArray[0].moduleid;
                var selected_module_id = JSON.parse(storage.getItem('wayflow'));

                if (selected_module_id == moduleid) {
                    // last dummy entry is with same moduleid
                    onsuccess_get_tid_from_task(e);     // use this dummy task for creation
                }
                else {
                    // last dummy entry is with different moduleid
                    insert_new_dummy_entry();
                }

            }
            else {
                // last entry is not dummy
                insert_new_dummy_entry();
            }
        }
        else {
            // task_master is blank (no row found)
            insert_new_dummy_entry();
        }
    }
    catch (e) {
        alert1(e + '_onsuccess_check_last_dummy_entry()');
    }
}

function onfail_check_last_dummy_entry(e) {
    alert1(e + '_onfail_check_last_dummy_entry()');
}


function insert_new_dummy_entry() {

    if (typeof curr_listing_udf == "undefined") {
        curr_listing_udf = "";
    }

    if (curr_listing_udf == "" || curr_listing_udf == null || curr_listing_udf == undefined) {
        //normal task creation
        insert_new_dummy_entry_post();
    }
    else {
        //type37 invoice new sub task creation [FT-27092024]
        get_checksheet_id_from_flow_id();
    }
}

function get_checksheet_id_from_flow_id() {
    try {
        loading();
        var company_id = JSON.parse(storage.getItem('company_id'));
        var selected_module_id = JSON.parse(storage.getItem('wayflow'));

        var param_obj = [];
        param_obj.push({
            'Company_Id': company_id,
            'flow_id': selected_module_id
        });

        var getdata = new Webservicecall_REST(common_global_wcf_url + 'WCF_GetChecksheetId_Port', JSON.stringify(param_obj), onsuccess_get_checksheet_id_from_flow_id, onfail_get_checksheet_id_from_flow_id);
        getdata.callOtherDomain();
    }
    catch (e) {
        loading_hide();
        alert(e + '_get_checksheet_id_from_flow_id');
    }
}
function onsuccess_get_checksheet_id_from_flow_id(e) {
    try {
        var responseText = JSON.parse(e.responseText);
        var status = responseText[0].status;

        if (status == 1) {
            //var myArray = JSON.parse(e);
            var myArray = JSON.parse(responseText[0].data);

            var data_str = myArray[0].data;
            if (data_str == "" || data_str == null || data_str == undefined) { }
            else {
                myArray = JSON.parse(data_str);
            }

            var checksheet_id = myArray[0].checksheet_id;
            storage.setItem('check_type_task', JSON.stringify(checksheet_id));

            insert_new_dummy_entry_post();
        }
        else {
            loading_hide();
            alert(responseText[0].message);
        }
    }
    catch (e) {
        loading_hide();
        alert(e + '_onsuccess_get_checksheet_id_from_flow_id');
    }
}

function onfail_get_checksheet_id_from_flow_id(e) {
    loading_hide();
    alert(e + 'onfail_get_checksheet_id_from_flow_id');
}

function insert_new_dummy_entry_post() {
    var user_id = JSON.parse(storage.getItem('user_id'));
    var user_name = JSON.parse(storage.getItem('username'));

    var checksheetid = storage.getItem('check_type_task');

    var p_match_temp_id = localStorage.getItem('p_match_temp_id');
    if (p_match_temp_id == "" || p_match_temp_id == null || p_match_temp_id == undefined) {
        p_match_temp_id = "";
    }

    var data_json = JSON.parse(storage.getItem('list_json'));
    var list_data = JSON.parse(data_json);

    var match_temp_id = list_data[0].match_temp_id;
    if (match_temp_id == "" || match_temp_id == null || match_temp_id == undefined) {
        match_temp_id = "";
    }

    if (F7_device == 'ios') {
        checksheetid = checksheetid.substring(0, checksheetid.length - 0);
    }
    else {
        //checksheetid = checksheetid.substring(1, checksheetid.length - 1);
        checksheetid = checksheetid.replace(/['"]+/g, '');
    }

    var selected_module_id = JSON.parse(storage.getItem('wayflow'));
    var server_task_id = 0;                             //static server_task_id=0 for dummy task entry

    var query = "INSERT INTO task_master (user_id, username, checksheetid, moduleid, match_temp_id, p_match_temp_id, server_task_id) VALUES('" + user_id + "','" + user_name + "','" + checksheetid + "', '" + selected_module_id + "','" + match_temp_id + "','" + p_match_temp_id + "','" + server_task_id + "');";
    var q_jsonobj = [];
    q_jsonobj.push({
        data: query,
        q: "5",
        tid: ""
    });

    cordova.exec(onsuccess_insert_task, onfail_insert_task, 'SqlitePlugin', 'insertValuse', q_jsonobj);
}

function onsuccess_insert_task(e) {
    try {
        var selected_module_id = JSON.parse(storage.getItem('wayflow'));

        //var query = "select tid, checksheetid from task_master where username = '" + username + "' ORDER BY tid desc limit 1";

        var query = "select tid, checksheetid from task_master where username = '" + username + "' and moduleid ='" + selected_module_id + "'  ORDER BY tid desc limit 1";

        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "1"
        });

        cordova.exec(onsuccess_get_tid_from_task, onfail_get_tid_from_task, 'SqlitePlugin', 'showValues', q_jsonobj);
    } catch (e) {
        alert1(e + '_onsuccess_insert_task()');
    }
}
function onfail_insert_task() {
    alert1('onfail_insert_task');
}

function onsuccess_get_tid_from_task(e) {
    try {
        var myArray = JSON.parse(e);
        if (myArray.length > 0) {
            var check_type = parseInt(myArray[0].checksheetid);
            var t_id = myArray[0].tid;
            var step = 1;

            storage.setItem('tid', JSON.stringify(t_id));
            localStorage.setItem('tid', t_id);
            localStorage.setItem('checksheetid', check_type);
            localStorage.setItem('p_key', step);
            storage.setItem('check_type_task', JSON.stringify(check_type));

            var data_json = JSON.parse(storage.getItem('list_json'));
            var list_data = JSON.parse(data_json);
            var task_with_customer = list_data[0].task_with_customer;
            if (task_with_customer == "true") {
                //open popup of cust-list on task create(+) btn click
                get_udf_for_cust_list();
            }
            else {
                var type37_len = $("div[id^='div_subtask_']").length;
                if (type37_len > 0) {
                    myApp.popup('.popup-new-task-create');
                    data_to_read_task();
                }
                else {
                    changeurl("viewsitedata_task.html");
                }
            }
        }
        else {
            // rare issue handling
            select_network_for_create_task();
        }
    }
    catch (e) {
        alert1(e + '_onsuccess_get_tid_from_task()');

        // rare issue handling
        select_network_for_create_task();
    }
}
function onfail_get_tid_from_task() {
    alert1('onfail_get_tid_from_task');
}



// hide/show search div
function toggle_search_div() {
    var data_json = JSON.parse(storage.getItem('list_json'));
    var list_data = JSON.parse(data_json);
    var search_value = list_data[0].search;
    // if true user can show
    if (search_value == "true") {
        if (toggle_search == 0) {
            // show search div
            $("#div_Search").slideDown();
            toggle_search = 1;
        } else {
            // hide search div
            $("#div_Search").slideUp();
            toggle_search = 0;
        }
    } else {
        alert1("access limited !");
    }
}

// F7 show search bar
function show_search_bar() {
    $('.head-title').hide();
    $('.head-menu').hide();
    $('.head-search').show();
    if (F7_device == 'android') {
        $('.tabbar').slideUp(100);
        $('#tab1').css('padding-top', '57px');
        $('#tab2').css('padding-top', '57px');
        $('#tab3').css('padding-top', '57px');
    }
}

function show_columnwise_search_bar() {
    $('.head-title').hide();
    $('.head-menu').hide();
    $('.columnwise-head-search').show();
    if (F7_device == 'android') {
        $('.tabbar').slideUp(100);
        $('#tab1').css('padding-top', '57px');
        $('#tab2').css('padding-top', '57px');
        $('#tab3').css('padding-top', '57px');
    }
}

function onfail_get_list_of_modules(e) {
    alert1(e + '_onfail_get_list_of_modules()');
    loading_hide();
}

// common selection survey function
function search_site_list_common() {
    limit_range = default_range; // set default range limit
    query_type = 2; // search site listing
    $("#btn_SeeAll").show();
    $("#btn_SeeMore").show();

    var selected_survey_type = JSON.parse(storage.getItem('survey_type'));

    // alert1(selected_survey_type);
    if (selected_survey_type == 1) {
        // pending list
        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var survey_mode = list_data[0].survey_mode;
        if (survey_mode == "" || survey_mode == null
            || survey_mode == undefined) {
            survey_mode = "offline";
        }
        if (survey_mode == "online") {
            var redirect = list_data[0].redirect;
            if (redirect == 'customer') {
                get_list_of_customer_by_search_online();
            } else {
                get_list_of_pm_sites_by_search_online();
            }
        } else {
            get_list_of_pm_sites_by_search();
        }
    } else if (selected_survey_type == 2) {
        // completed list
        get_list_of_completed_sites_by_search();
    } else if (selected_survey_type == 3) {
        // upload pending list
        get_list_of_UP_sites_by_search();
    }
}

// call on click of pm see all button
function see_all_site_list_common() {
    limit_range = 1000; // set max limit
    see_more_n_see_all_common();
}

// call on click of pm show more button
function see_more_site_list_common() {
    limit_range = limit_range + increment_range;
    var checksheet_type_filter = JSON.parse(storage.getItem('checksheet_type_filter'));
    if (checksheet_type_filter == '9' || checksheet_type_filter == '10') {
        get_list_of_pm_sites_by_filter_online();
    }
    else {
        see_more_n_see_all_common();
    }
}

function see_more_n_see_all_common() {
    try {
        var selected_survey_type = JSON.parse(storage.getItem('survey_type'));
        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var survey_mode = list_data[0].survey_mode;
        if (survey_mode == "" || survey_mode == null
            || survey_mode == undefined) {
            survey_mode = "offline";
        }

        if (query_type == 1 || query_type == 3) {
            if (selected_survey_type == 1) {
                if (survey_mode == "online") {
                    var redirect = list_data[0].redirect;
                    if (redirect == 'customer') {
                        get_list_of_customer_online();
                    } else {
                        get_list_of_task_for_compare_online();
                    }
                } else {
                    get_list_of_pm_sites();
                }
            } else if (selected_survey_type == 2) {
                get_list_of_completed_sites();
            } else if (selected_survey_type == 3) {
                get_list_of_UP_sites();
            }
        } else {
            if (selected_survey_type == 1) {
                if (survey_mode == "online") {
                    var redirect = list_data[0].redirect;
                    if (redirect == 'customer') {
                        get_list_of_customer_by_search_online();
                    } else {
                        get_list_of_pm_sites_by_search_online();
                    }
                } else {
                    get_list_of_pm_sites_by_search();
                }
            } else if (selected_survey_type == 2) {
                get_list_of_completed_sites_by_search();
            } else if (selected_survey_type == 3) {
                get_list_of_UP_sites_by_search();
            }
        }
    } catch (e) {
        alert1(e + '_see_more_n_see_all_common()');
    }
}

// refresh site list common
function refresh_site_list_common() {
    storage.setItem('av', JSON.stringify(''));

    $("#refresh_btn").attr("disabled", "disabled");
    setTimeout(function () {
        $("#refresh_btn").removeAttr("disabled");
    }, 2000);

    $(".div-delete-filter").hide();
    var selected_survey_type = JSON.parse(storage.getItem('survey_type'));
    if (selected_survey_type == 1) {
        try {
            refresh_pm_site_list();
        }
        catch (e) {
            // in case background sub task submit from checksheet page

            var flow_Array = JSON.parse(storage.getItem('flow_Array'));
            var index = flow_Array.length - 1;
            var task_checksheetid = flow_Array[index].task_checksheetid;
            storage.setItem('check_type_task', JSON.stringify(task_checksheetid));                                          //restore main task creation checksheet_id after background subtask submit (sagent.customer) [FT-26062025]

            changeurl("selection_survey.html");
        }
    } else if (selected_survey_type == 2) {
        refresh_completed_site_list();
    } else if (selected_survey_type == 3) {
        refresh_UP_site_list();
    }
}

// filter checksheet (for online flow)
var checksheet_AllData_fix;
function get_checksheet_details_filter() {
    try {
        myApp.popup('.popup-filter');
        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var checksheet_id = list_data[0].checksheet_id;
        if (checksheet_id == '' || checksheet_id == null || checksheet_id == undefined) {
            alert1("Filter checksheet id is not assigned for this flow !");
        }
        else {
            var company_id = JSON.parse(storage.getItem('company_id'));
            var Getchecksheetdata = [];
            Getchecksheetdata.push({
                Checksheet_type_id: 9,
                Company_id: company_id,
                Checksheet_id: checksheet_id
            })
            var auth1 = [];
            auth1.push({
                'username': '',
                'u_c': ''
            });

            loading();
            var Getchecksheetdata_json = JSON.stringify(Getchecksheetdata);
            var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_GetdataForEditChecksheet', JSON.stringify(Getchecksheetdata_json), onsuccess_get_checksheet_details_filter, onfail_get_checksheet_details_filter);
            getdata.callOtherDomain();
        }
    }
    catch (e) {
        alert1(e + '_get_checksheet_details_filter()');
        loading_hide();
    }
}
function onsuccess_get_checksheet_details_filter(e) {
    try {
        var result = e.responseText;
        var myData = eval('' + result + '');
        var status = myData[0].status;
        if (status == 1) {
            //var myArray = myData[0].str[0].AllData;
            //myArray = JSON.parse(myArray);

            var data = myData[0].data;
            if (data == "" || data == null || data == undefined) {
                var myArray = myData[0].str[0].AllData;
                myArray = JSON.parse(myArray);
            }
            else {
                myData = JSON.parse(data);
                var myArray = myData[0].AllData;
                myArray = JSON.parse(myArray);
            }

            var check_type = myArray[0].step_data[0].Checksheet_id;
            var data = myArray[0].step_data[0].step[0].data;
            localStorage.setItem("check_type", check_type);
            localStorage.setItem("checksheet_data", JSON.stringify(data));
            localStorage.setItem("checksheet_AllData", JSON.stringify(myArray));
            localStorage.setItem("checksheet_type_filter", '9');
            storage.setItem('checksheet_type_filter', JSON.stringify('9'));

            checksheet_AllData_fix = JSON.stringify(myArray);
            $("#container_div").empty();
            storage.setItem('check_type', JSON.stringify(check_type));
            read_dynamic_checksheet("", check_type, "", data, "", 9, 0);
        }
        else {
            var message = myData[0].message;
            alert1(message);
            loading_hide();
        }
    }
    catch (e) {
        alert1(e + '_onsuccess_get_checksheet_details_filter');
        loading_hide();
    }
}
function onfail_get_checksheet_details_filter(e) {
    alert1(e + '_onfail_get_checksheet_details_filter()');
    loading_hide();
}

function get_survey_json() {
    try {
        $("#site_list").empty();
        limit_range = default_range; // set default range limit

        var arr = localStorage.getItem('checksheet_data');
        var AllData = localStorage.getItem('checksheet_AllData');
        var filter_button_Data = JSON.parse(checksheet_AllData_fix);
        localStorage.setItem('checksheet_AllData', JSON.stringify(filter_button_Data));

        validate_and_submit_surveydata(1, 9, JSON.parse(arr));

        if (Validation_True == 0) {
            myApp.closeModal('.popup-filter');
            //var filter_button_Data = JSON.parse(localStorage.getItem('checksheet_AllData'));
            //var where_Json = filter_button_Data[0].Filter_button[0].WHERE[0].AND[0].JSON;
            //var where_Table = filter_button_Data[0].Filter_button[0].WHERE[0].AND[0].TABLE;
            //var where_Or_Json = filter_button_Data[0].Filter_button[0].WHERE[0].OR[0].JSON;
            //var where_Or_Table = filter_button_Data[0].Filter_button[0].WHERE[0].OR[0].TABLE;
            //var where_Match_And = filter_button_Data[0].Filter_button[0].WHERE[0].MATCH_QUERY;
            //get_list_of_pm_sites_by_filter_online(where_Table, where_Json, where_Or_Json, where_Or_Table, where_Match_And);
            get_list_of_pm_sites_by_filter_online();
        }
    }
    catch (e) {
        alert1(e + '_get_survey_json()');
        loading_hide();
    }
}

function get_list_of_pm_sites_by_filter_online() {
    try {

        var filter_button_Data = JSON.parse(localStorage.getItem('checksheet_AllData'));
        var t_where_Json = filter_button_Data[0].Filter_button[0].WHERE[0].AND[0].JSON;
        var t_where_Table = filter_button_Data[0].Filter_button[0].WHERE[0].AND[0].TABLE;
        var t_where_Or_Json = filter_button_Data[0].Filter_button[0].WHERE[0].OR[0].JSON;
        var t_where_Or_Table = filter_button_Data[0].Filter_button[0].WHERE[0].OR[0].TABLE;
        var t_where_Match_And = filter_button_Data[0].Filter_button[0].WHERE[0].MATCH_QUERY;

        var selected_module_id = JSON.parse(storage.getItem('wayflow'));
        if (selected_module_id == 0) {
            alert1("Please select flow !")
        } else {
            //$("#site_list").empty();
            $("#txtsearch").val("");
            $("#tab1").unbind('scroll');
            $("#tasklist_loader").hide();

            var data_json = JSON.parse(storage.getItem('list_json'));
            var list_data = JSON.parse(data_json);
            var Condition_Data = list_data[0].condition;
            var status_array = list_data[0].status;
            var orderby = list_data[0].orderby;
            var multiflow_list = list_data[0].multiflow_list;

            var company_id = JSON.parse(storage.getItem('company_id'));
            if (global_wcf_url == "https://securitywcf.easyform.in/EF_Service.svc/v1/") { }
            else {
                Condition_Data = [];
            }

            // var New_Condition_Data;
            if (Condition_Data == '' || Condition_Data == null || Condition_Data == undefined) {
                //alert1("Please add condition from portal first for this flow!");

                // after removing condition json
                var Push_array = filter_button_Data[0].Push_array;
                if (Push_array == "" || Push_array == null || Push_array == undefined) {
                    var t_push_data = "";
                }
                else {
                    var t_push_data = [];
                    t_push_data.push({
                        'push_array': Push_array
                    });
                }

                var t_push_array = t_push_data;
            } else {
                var t_push_array = [];
                Condition_Data = pass_required_values_to_condition(Condition_Data);

                // check and set system variable to condition
                var user_id = JSON.parse(storage.getItem('user_id'));

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

                var flow_Array = JSON.parse(storage.getItem('flow_Array'));
                if (flow_Array.length == 1) { } else {
                    var p_server_task_id = JSON.parse(storage.getItem('p_server_task_id'));
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
                    Condition_Data[0].static_joins = user_id;
                    Condition_Data[0].limit[0].offset = limit_range - default_range;
                    //Condition_Data[0].limit[0].offset = 0;
                    Condition_Data[0].limit[0].fetch = increment_range;
                }

                for (f = 0; f < t_where_Table.length; f++) {
                    var Value_1 = t_where_Table[f].Value_1;
                    if (Value_1 == '' || Value_1 == null || Value_1 == undefined || Value_1 == '0') {
                        // not in selection
                    }
                    else {
                        var where1 = Condition_Data[0].Where;
                        var where2 = Condition_Data[0].where;
                        var where3 = Condition_Data[0].WHERE;
                        var Table_Name = t_where_Table[0].Table_Name;
                        var Value_1 = t_where_Table[0].Value_1;
                        if (where1 == undefined && where2 == undefined) {
                            if (Table_Name == 'User_Master') {
                                Condition_Data[0].STATIC_JOINS = Value_1;
                            }
                            else {
                                Condition_Data[0].WHERE[0].AND[0].TABLE.push(t_where_Table[f]);
                            }
                            Condition_Data[0].WHERE[0].match_query = '';
                        }
                        else if (where2 == undefined && where3 == undefined) {
                            if (Table_Name == 'User_Master') {
                                Condition_Data[0].Static_Joins = Value_1;
                            }
                            else {
                                Condition_Data[0].Where[0].And[0].Table.push(t_where_Table[f]);
                            }
                            Condition_Data[0].Where[0].match_query = '';
                        }
                        else {
                            if (Table_Name == 'User_Master' && t_where_Table[f].Column_Name == "user_id") {
                                Condition_Data[0].where[0].and[0].table.push(t_where_Table[f]);
                                //Condition_Data[0].where[0].match_query[0].and[0].match[0].case[0].when[0].and[0].table.push(t_where_Table[f]);
                            }
                            else {
                                Condition_Data[0].where[0].and[0].table.push(t_where_Table[f]);
                            }
                            Condition_Data[0].where[0].match_query = '';
                        }
                    }
                }

                for (f = 0; f < t_where_Json.length; f++) {
                    var Value_1 = t_where_Json[f].Value_1;
                    if (Value_1 == '' || Value_1 == null || Value_1 == undefined || Value_1 == '0') {
                        // not in selection
                    }
                    else {
                        var where1 = Condition_Data[0].Where;
                        var where2 = Condition_Data[0].where;
                        var where3 = Condition_Data[0].WHERE;
                        var Table_Name = t_where_Json[0].Table_Name;
                        var Value_1 = t_where_Json[0].Value_1;
                        if (where1 == undefined && where2 == undefined) {
                            if (Table_Name == 'User_Master') {
                                Condition_Data[0].STATIC_JOINS = Value_1;
                            }
                            else {
                                Condition_Data[0].WHERE[0].AND[0].JSON.push(t_where_Json[f]);
                            }
                            Condition_Data[0].WHERE[0].match_query = '';
                        }
                        else if (where2 == undefined && where3 == undefined) {
                            if (Table_Name == 'User_Master') {
                                Condition_Data[0].Static_Joins = Value_1;
                            }
                            else {
                                Condition_Data[0].Where[0].And[0].Json.push(t_where_Json[f]);
                            }
                            Condition_Data[0].Where[0].match_query = '';
                        }
                        else {
                            if (Table_Name == 'User_Master' && t_where_Json[f].Column_Name == "user_id") {
                                Condition_Data[0].where[0].and[0].json.push(t_where_Json[f]);
                                // Condition_Data[0].where[0].match_query[0].and[0].match[0].case[0].when[0].and[0].json.push(t_where_Json[f]);
                            }
                            else {
                                Condition_Data[0].where[0].and[0].json.push(t_where_Json[f]);
                            }
                            Condition_Data[0].where[0].match_query = '';
                        }
                    }
                }

                for (f = 0; f < t_where_Or_Table.length; f++) {
                    var Value_1 = t_where_Or_Table[f].Value_1;
                    if (Value_1 == '' || Value_1 == null || Value_1 == undefined || Value_1 == '0') {
                        // not in selection
                    }
                    else {
                        var where1 = Condition_Data[0].Where;
                        var where2 = Condition_Data[0].where;
                        var where3 = Condition_Data[0].WHERE;
                        if (where1 == undefined && where2 == undefined) {
                            Condition_Data[0].WHERE[0].OR[0].TABLE.push(t_where_Or_Table[f]);
                        }
                        else if (where2 == undefined && where3 == undefined) {
                            Condition_Data[0].Where[0].Or[0].Table.push(t_where_Or_Table[f]);
                        }
                        else {
                            Condition_Data[0].where[0].or[0].table.push(t_where_Or_Table[f]);
                        }
                    }
                }

                for (f = 0; f < t_where_Or_Json.length; f++) {
                    var Value_1 = t_where_Or_Json[f].Value_1;
                    if (Value_1 == '' || Value_1 == null || Value_1 == undefined || Value_1 == '0') {
                        // not in selection
                    }
                    else {
                        var where1 = Condition_Data[0].Where;
                        var where2 = Condition_Data[0].where;
                        var where3 = Condition_Data[0].WHERE;
                        if (where1 == undefined && where2 == undefined) {
                            Condition_Data[0].WHERE[0].OR[0].JSON.push(t_where_Or_Json[f]);
                        }
                        else if (where2 == undefined && where3 == undefined) {
                            Condition_Data[0].Where[0].Or[0].Json.push(t_where_Or_Json[f]);
                        }
                        else {
                            Condition_Data[0].where[0].or[0].json.push(t_where_Or_Json[f]);
                        }
                    }
                }

                if (t_where_Match_And.length > 0) {
                    var where1 = Condition_Data[0].Where;
                    var where2 = Condition_Data[0].where;
                    var where3 = Condition_Data[0].WHERE;
                    if (where1 == undefined && where2 == undefined) {
                        Condition_Data[0].WHERE[0].MATCH_QUERY[0].TABLE.push(t_where_Match_And[0]);
                    }
                    else if (where2 == undefined && where3 == undefined) {
                        Condition_Data[0].Where[0].Match_Query[0].Table.push(t_where_Match_And[0]);
                    }
                    else {
                        Condition_Data[0].where[0].match_query.push(t_where_Match_And[0]);
                    }
                }
                //alert1(JSON.stringify(Condition_Data));
            }

            var udf_id = JSON.parse(storage.getItem('udf_id'));
            var tab_index = JSON.parse(storage.getItem('tab_index'));
            var checksheet_id = filter_button_Data[0].step_data[0].Checksheet_id;

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
                'offset': limit_range - default_range,
                'fetch': increment_range,
                'checksheet_id': checksheet_id,
                'status': status_array,
                'udf_id': udf_id,
                'tab_index': tab_index
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

            if (global_wcf_url == "https://securitywcf.easyform.in/EF_Service.svc/v1/") {
                //Security URL
                var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_OnlineTaskList_Native_colour_coding', JSON.stringify(param_obj), onsuccess_get_list_of_pm_sites_online, onfail_get_list_of_pm_sites_online);
            }
            else {
                //other URL
                var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_OnlineTaskList_colour_coding', JSON.stringify(param_obj), onsuccess_get_list_of_pm_sites_online, onfail_get_list_of_pm_sites_online);
            }
            getdata.callOtherDomain();
        }
    } catch (e) {
        alert1(e + '_get_list_of_pm_sites_by_filter_online()');
        loading_hide();
    }
}

// filter checksheet for online end





/////////////////////////////////////----------- offline task listing filter -------------------------
// filter task listing (offline task listing)
function filter_search_task() {
    try {
        $('li[name^="ddl_filter_"]').attr('data', '');

        var clickedLink = $("#filter_search_task");
        myApp.popup('.popup-task-main-filter', clickedLink);

        var filter_ddl_Array = localStorage.getItem('filter_ddl_Array');
        filter_ddl_Array = JSON.parse(filter_ddl_Array);
        var len = filter_ddl_Array.length;

        for (f = 0; f < len; f++) {
            var header = filter_ddl_Array[f].header;
            var ddl_header = header.replace(/ /g, "__");
            var ans = filter_ddl_Array[f].ans;
            //var data_val = $('#ddl_filter_' + ddl_header + '').attr('data');
            var data_val = $('li[name="ddl_filter_' + ddl_header + '"]').attr('data');
            if (data_val == '' || data_val == null || data_val == undefined) {
                var t_data_val = ans;
            }
            else {
                var t_data_val = data_val + ',' + ans;
            }

            t_data_val = t_data_val.toString();
            t_data_val = t_data_val.replace(/ /g, "__");

            //$('#ddl_filter_' + ddl_header + '').attr('data', t_data_val);
            $('li[name="ddl_filter_' + ddl_header + '"]').attr('data', t_data_val);
        }

        var param = "get_filtered_task_listing()";
        $('#apply_filter').empty().append('<a href="#" class="link" onclick="' + param + '">APPLY</a>');
    }
    catch (e) {
        alert1(e + '_filter_search_task()')
    }
}

function sub_filter_popup_task(label) {
    try {
        myApp.popup('.popup-task-filter');
        var filter_top_label = label;
        filter_top_label = filter_top_label.replace(/__/g, ' ');
        $('#sub_filter_item').text(filter_top_label);

        var opt = '';
        opt += '<ul>';

        var t_ary_val = $('li[name="ddl_filter_' + label + '"]').attr('data');
        t_ary_val = t_ary_val.split(',');
        var filter = function (t_ary_val, index) { return this.indexOf(t_ary_val) == index };
        var ary_val = t_ary_val.filter(filter, t_ary_val);

        var selected_ary_val = $('div[name="filter_sub_label_' + label + '"]').text();
        if (selected_ary_val == '' || selected_ary_val == null || selected_ary_val == undefined) {
            selected_ary_val = [];
        }
        else {
            selected_ary_val = selected_ary_val.split(',');
        }

        for (var o = 0; o < ary_val.length; o++) {
            var found = 0;
            for (var s = 0; s < selected_ary_val.length; s++) {
                var s_val = selected_ary_val[s];
                s_val = s_val.toString();
                s_val = s_val.replace(/ /g, "__");
                if (s_val == ary_val[o]) {
                    found++;
                    break;
                }
            }

            var disp_val = ary_val[o];
            disp_val = disp_val.replace(/__/g, ' ');

            if (disp_val == "" || disp_val == null || disp_val == undefined) { }
            else {
                if (found > 0) {
                    opt += '<li><label class="label-checkbox item-content"><input type="checkbox" onchange="update_checkbox_count()" name="filter-checkbox"  value="' + disp_val + '" checked="checked">';
                }
                else {
                    opt += '<li><label class="label-checkbox item-content"><input type="checkbox" onchange="update_checkbox_count()" name="filter-checkbox"  value="' + disp_val + '">';
                }
                opt += '<div class="item-media"><i class="icon icon-form-checkbox"></i></div><div class="item-inner">';
                opt += '<div class="item-title">' + disp_val + '</div></div></label></li>';
            }
        }

        opt += '</ul>';

        $('#div_filter_popup').empty();
        $('#div_filter_popup').append(opt);
        $('#div_filter_bottom').empty();
        var param_done = "get_selected_filter_option_task('" + label + "')";
        $("#lbl_selected_chk").text(selected_ary_val.length);
        $('#div_filter_bottom').append('<a href="#" class="link" onclick="' + param_done + '">Select</a>');
    }
    catch (e) {
        alert1(e + '_sub_filter_popup_task()');
    }
}

function get_selected_filter_option_task(label) {
    var answer = [];
    var checkbox = document.getElementsByName('filter-checkbox');
    for (j = 0; j < checkbox.length; j++) {
        if (checkbox[j].checked) {
            answer.push(checkbox[j].value);
        }
    }
    answer = answer.toString();
    $('div[name="filter_sub_label_' + label + '"]').text(answer);
    myApp.closeModal('.popup-task-filter');
}

function clear_selected_filter_option_offline_task() {
    $('div[name^="filter_sub_label_"]').empty();
}

function get_filtered_task_listing() {
    try {
        $('.no_record').remove();
        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var Columndata_json = list_data[0].columndata;
        var selected_columns_Count = 0;
        var selected_ans_Array = [];
        for (c = 0; c < Columndata_json.length; c++) {
            var header = Columndata_json[c].header;
            var header_view = Columndata_json[c].header_view;
            var ddl_header = header.replace(/ /g, "__");
            var selected_ary_val = $('div[name="filter_sub_label_' + ddl_header + '"]').text();
            if (selected_ary_val == '' || selected_ary_val == null || selected_ary_val == undefined) {
                selected_ary_val = [];
            }
            else {
                selected_columns_Count++;
                selected_ary_val = selected_ary_val.split(',');
                for (s = 0; s < selected_ary_val.length; s++) {
                    //if (header_view == 'false') {
                    //    selected_ans_Array.push(selected_ary_val[s]);
                    //}
                    //else {
                    selected_ans_Array.push(header + ': ' + selected_ary_val[s]);
                    //}
                }
            }
        }

        var li_array = document.getElementById("site_list").getElementsByTagName("li");
        for (i = 0; i < li_array.length; i++) {
            var id = li_array[i].id;
            if (id == '' || id == null || id == undefined) {
                //
            } else {
                var search_found = 0;
                //var data_array = document.getElementById(id).getElementsByClassName("cls_search");
                //var data_array = $('#' + id + '').find('td');
                var tid = id.replace('lst_', '');
                var columndata_str = $('#lst_sys_var_' + tid + '').val();
                var type20_columndata = JSON.parse(decodeURIComponent(columndata_str));
                if (type20_columndata == '' || type20_columndata == null || type20_columndata == undefined) { }
                else {
                    // store all columndata keys in type20 global data
                    for (c = 0; c < type20_columndata.length; c++) {
                        var key = type20_columndata[c].header;
                        var value = type20_columndata[c].ans;
                        //var data_value = data_array[j].textContent;
                        //var data_value = $(data_array[j]).text();
                        var data_value = key + ': ' + value;
                        for (v = 0; v < selected_ans_Array.length; v++) {
                            var search_str = (selected_ans_Array[v]).toLowerCase();
                            data_value = data_value.toLowerCase();
                            if (data_value.indexOf(search_str) > -1) {
                                search_found++;
                                break;
                            }
                        }
                        if (search_found == selected_columns_Count) {
                            break;
                        }
                    }
                }

                //for (j = 0; j < data_array.length; j++) {
                //    //var data_value = data_array[j].textContent;
                //    var data_value = $(data_array[j]).text();
                //    for (v = 0; v < selected_ans_Array.length; v++) {
                //        var search_str = (selected_ans_Array[v]).toLowerCase();
                //        data_value = data_value.toLowerCase();
                //        if (data_value.indexOf(search_str) > -1) {
                //            search_found++;
                //            break;
                //        }
                //    }
                //    if (search_found == selected_columns_Count) {
                //        break;
                //    }
                //}

                if (search_found == selected_columns_Count) {
                    $('#site_list > li').eq(i).css('display', 'block');
                } else {
                    $('#site_list > li').eq(i).css('display', 'none');
                }
            }
        }

        var li_length = $("#site_list > li:not(:hidden)").length;
        var f_li_text = $('#site_list > li:first').text();
        if (li_length == 1 && f_li_text == 'No Record Found !') {
            li_length = 0;
        }
        var selected_survey_type = JSON.parse(storage.getItem('survey_type'));
        if (selected_survey_type == 1) {
            $("#survey_td_1").html("Total : " + li_length + "");
            $("#tabCount_" + active_Tab + "").html(li_length);
            $("#tabCount_" + active_Tab + "").addClass('numberCircle');
        } else if (selected_survey_type == 2) {
            $("#survey_td_2").html("Total : " + li_length + "");
            $("#tabCount_Comp").html(li_length);
            $("#tabCount_Comp").addClass('numberCircle');
        } else {
            $("#survey_td_3").html("Total : " + li_length + "");
            $("#tabCount_Up").html(li_length);
            $("#tabCount_Up").addClass('numberCircle');
        }
        if (li_length == 0) {
            $("#btn_Submit").hide();
            if (f_li_text != 'No Record Found !') {
                var list_item = '<li class="no_record"><a href="#" class="item-link item-content"><div class="item-inner item-no-pad"><div class="item-title">No Record Found !</div></div></a></li>';
                $("#site_list").append(list_item);
            }
        }
        else {
            var flow_Array = JSON.parse(storage.getItem('flow_Array'));
            if (flow_Array.length > 1) {
                $("#btn_Submit").show();
            }
        }

        myApp.closeModal('.popup-task-main-filter');
    }
    catch (e) {
        alert1(e + '_get_filtered_task_listing()');
    }
}
// filter task listing end (offline)


function advance_column_search(t_flag, fltr_type) {
    try {
        if (t_flag == "btn_click") {
            myApp.popup('.popup-advance-search-online');

            if (fltr_type == "dashboard_fltr") {
                //dashboard filter------dont display fltr ui when click on dashboard chart [FT-17062025]
                $('.popup-advance-search-online').css('height', '0');
            }
            else {
                // default fltr btn click
                $('.popup-advance-search-online').css('height', '100%');
            }
        }

        var dis_save_filter = $("#lbl_filter_name").html();
        if (dis_save_filter == "" || dis_save_filter == null || dis_save_filter == undefined || dis_save_filter.indexOf("Save Filter?") > -1) {
            $("#tbl_advance_colSearch").empty();

            if (subflow_udf_id == '' || subflow_udf_id == null || subflow_udf_id == undefined) {
                // Get maintask columndata
                var data_json = JSON.parse(storage.getItem('list_json'));
                var list_data = JSON.parse(data_json);
            }
            else {
                // Get subtask columndata                
                var data_count = get_udf_data_for_subflow(subflow_udf_id);
                var list_data = JSON.parse(data_count);

            }

            var columndata_Array = list_data[0].columndata;
            var str = '';

            //for (var c = 0; c < columndata_Array.length; c++) {
            //    var header = columndata_Array[c].header;
            //    str += '<tr>';
            //    str += '<td style="width:100%;padding:5px;"><label class="cls_col_lbl">' + header + '</label>';
            //    str += '<div class="form-div" style="font-size:12px;width: 100% !important;">';
            //    str += '<input type="text" class="form-ele cls_search_txt" placeholder="Search ' + header + '..." style="border:solid 1px grey;border-radius:10px;padding:5px 10px;box-shadow:1px 2px 4px 0px grey !important;width:100% !important;">';
            //    str += '</div>';
            //    str += '</td>';
            //    str += '</tr>';
            //}

            for (var c = 0; c < columndata_Array.length; c++) {
                var is_hide = columndata_Array[c].is_hide;
                if (is_hide == "true") { }
                else {
                    var header = columndata_Array[c].header;
                    var coldata_obj = columndata_Array[c];
                    coldata_obj = JSON.stringify(coldata_obj);
                    coldata_obj = encodeURIComponent(coldata_obj);
                    var param_onchange = "display_filter_condition_as_per_cntrl_type('" + coldata_obj + "', this, '" + c + "')";

                    var ctrl_type = columndata_Array[c].ctrl_type;
                    var system_var = columndata_Array[c].system_var;
                    if (system_var == "Status_Name") {
                        var value_Array = columndata_Array[c].value;
                        if (value_Array == "" || value_Array == null || value_Array == undefined) {
                            value_Array = [];
                        }
                    }

                    var type_icon_str = "fa-pencil-square-o";
                    if (ctrl_type == 1) {
                        type_icon_str = "fa-pencil-square-o";
                    }
                    else if (ctrl_type == 4) {
                        type_icon_str = "fa-square-o";
                    }
                    else if (ctrl_type == 8 || system_var == "CreateDTTM" || system_var == "survey_date") {
                        type_icon_str = "fa-calendar";
                    }
                    else if (ctrl_type == 2 || ctrl_type == 3 || ctrl_type == 6 || (system_var == "Status_Name" && value_Array.length > 0)) {
                        type_icon_str = "fa-chevron-circle-down";
                    }
                    else if (ctrl_type == 20) {
                        type_icon_str = "fa-arrow-circle-down";

                        var Query_type = columndata_Array[c].Query_type;
                        //var value_new = columndata_Array[c].value_new;
                        //var push_data = value_new[0].push_data;
                        //var push_array = push_data[0].push_array;
                        //if (push_array.length > 0 || Query_type == "RowQuery") {
                        //    continue;
                        //}

                        if (Query_type == "RowQuery") {
                            continue;
                        }
                    }

                    //str += '<tr>';
                    //str += '<td style="padding:5px;">';
                    //str += '<div class="form-check">';
                    //str += '<label class="form-check-label"><input type="checkbox" class="form-check-input" value="' + header + '" onchange="' + param_onchange + '" name="' + coldata_obj + '" index="' + c + '"><span class="filter-header">' + header + '</span></label>';
                    //str += '</div>';
                    //str += '<div class="fltr-cndtn-outer m-1" id="div_fltr_cndtn_' + c + '">';
                    //str += '</div>';
                    //str += '<td style="padding:5px;"><div class="div-cntrl-icon"><i class="fa ' + type_icon_str + ' fltr-cntrl-icon mr-0"></i></div></td>';
                    //str += '</td>';
                    //str += '</tr>';

                    str += '<li>';
                    str += '<label class="label-checkbox item-content">';
                    str += '<input type="checkbox" class="form-check-input" value="' + header + '" onchange="' + param_onchange + '" name="' + coldata_obj + '" index="' + c + '">';
                    str += '<div class="item-media">';
                    str += '<i class="icon icon-form-checkbox"></i>';
                    str += '</div>';
                    str += '<div class="item-inner">';
                    str += '<div class="item-title">' + header + '</div>';
                    str += '</div>';
                    str += '<div class="div-cntrl-icon"><i class="fa ' + type_icon_str + ' fltr-cntrl-icon"></i></div>';
                    str += '</label>';
                    str += '<div class="fltr-cndtn-outer" id="div_fltr_cndtn_' + c + '" style="display:block;">';
                    str += '</div>';
                    str += '</li>';
                }
            }

            $("#tbl_advance_colSearch").append(str);
            display_saved_adv_filter();
        }

    }
    catch (e) {
        alert1(e + '_advance_column_search()');
    }
}

function get_column_seach_obj() {
    try {
        var search_obj = [];
        var str = '<span class="mr-1 align-middle text-dark">Filter By:</span>';

        //var len = $("#tbl_advance_colSearch td input.form-check-input:checked").length;
        $("#tbl_advance_colSearch li input[type='checkbox']:checked").each(function () {
            var coldata_obj = $(this).attr('name');
            coldata_obj = decodeURIComponent(coldata_obj);
            coldata_obj = JSON.parse(coldata_obj);
            var coldata_index = $(this).attr('index');
            var eqn_str = $(this).parents('li').find(".fltr-cndtn-inner").find(".fltr-cndtn-eqn").val();
            eqn_str = eqn_str.toUpperCase();

            var cntrl_type = coldata_obj.ctrl_type;
            var system_var = coldata_obj.system_var;
            if (system_var == "Status_Name") {
                var value_Array = coldata_obj.value;
                if (value_Array == "" || value_Array == null || value_Array == undefined) {
                    value_Array = [];
                }
            }

            if (cntrl_type == 2 || cntrl_type == 3 || cntrl_type == 6) {
                var Con_Array = coldata_obj.value;
                if (Con_Array == "" || Con_Array == null || Con_Array == undefined) {
                    Con_Array = [];
                    cntrl_type = 1;             //if value key is blank in columndara then consider it as textbox
                }
            }
            else if (cntrl_type == 20) {
                var Con_Array = coldata_obj.value_new;
                if (Con_Array == "" || Con_Array == null || Con_Array == undefined) {
                    Con_Array = [];
                    cntrl_type = 1;             //if value_new key is blank in columndara then consider it as textbox
                }
            }

            if (cntrl_type == 20 || cntrl_type == 2 || cntrl_type == 3 || cntrl_type == 6 || (system_var == "Status_Name" && value_Array.length > 0)) {
                var search_str = $(this).parents('li').find(".fltr-cndtn-inner").find("#fltr_val_ddl_" + coldata_index + "").val();

                if (cntrl_type == 20) {
                    try {
                        search_str = decodeURIComponent(search_str);
                    }
                    catch (e) {
                        search_str = $(this).parents('li').find(".fltr-cndtn-inner").find("#fltr_val_ddl_" + coldata_index + "").val();
                    }
                }

            }
            else if (cntrl_type == 8 || system_var == "CreateDTTM" || system_var == "survey_date") {
                var type8_val = $("#fltr_date_ddl_" + coldata_index + " option:selected").attr('name');
                if (type8_val == "is_between") {
                    var start_date = $("#dt_tp_Start_" + coldata_index + "").val();
                    start_date = convert_fix_format_date_on_submit(start_date, 'date');
                    var end_date = $("#dt_tp_End_" + coldata_index + "").val();
                    end_date = convert_fix_format_date_on_submit(end_date, 'date');
                    var search_str = [start_date + ' 00:00', end_date + ' 23:59'];
                }
                else if (type8_val == "is_before") {
                    var date_range = $("#dt_tp_Start_" + coldata_index + "").val();
                    date_range = convert_fix_format_date_on_submit(date_range, 'date');
                    var search_str = ['01/01/1920 00:00', date_range + ' 23:59'];
                }
                else if (type8_val == "is_after") {
                    var date_range = $("#dt_tp_Start_" + coldata_index + "").val();
                    date_range = convert_fix_format_date_on_submit(date_range, 'date');
                    var search_str = [date_range + ' 00:00', '3020/01/01 23:59'];
                }
                else {
                    var search_str = $(this).parents('li').find(".fltr-cndtn-inner").find("#lbl_tp_info_" + coldata_index + "").text();
                    search_str = search_str.split(' - ');
                    var date1 = search_str[0];
                    date1 = convert_fix_format_date_on_submit(date1, 'datetime');
                    var date2 = search_str[1];
                    date2 = convert_fix_format_date_on_submit(date2, 'datetime');
                    search_str[0] = date1;
                    search_str[1] = date2;
                }
            }
            else if (cntrl_type == 4 && eqn_str == "BETWEEN") {
                var search_str = [];
                var numeric_cntrl = $(this).parents('li').find(".fltr-cndtn-inner").find(".cls-ctrl-ans");
                $(numeric_cntrl).each(function () {
                    var num_val = $(this).val();
                    search_str.push(num_val);
                })
            }
            else {
                var search_str = $(this).parents('li').find(".fltr-cndtn-inner").find(".cls-ctrl-ans").val();
            }

            if (search_str == "" || search_str == null || search_str == undefined || search_str == "--- Select ---") { // for filter textbox or dropdown value str 30092022
                alert("Please Select Value or Enter value");
                return false;
            }

            if (Array.isArray(search_str)) { }
            else {
                search_str = [search_str];
            }

            if (type8_val == "" || type8_val == null || type8_val == undefined) {
                type8_val = "";
            }

            var col_name = $(this).val();
            search_obj.push({
                "columnName": col_name,
                "value": search_str,
                "Equation": eqn_str,
                "calendar_type": type8_val
            });

            //changes for saved filter [17122021]
            var adv_search_obj = {
                "columnName": col_name,
                "value": search_str,
                "Equation": eqn_str,
                "calendar_type": type8_val
            };
            var search_obj_str = JSON.stringify(adv_search_obj);
            search_obj_str = encodeURIComponent(search_obj_str);
            //str += '<span class="badge badge-dark mr-1" data="' + search_obj_str + '">' + col_name + ': ' + search_str + '</span>'
            str += '<span class="badge badge-dark mr-1" data="' + search_obj_str + '">' + col_name + '</span>'
        });

        $(".div-filtered-item").empty();
        $(".div-filtered-item").append(str);

        return search_obj;
    }
    catch (e) {
        alert1(e + '_get_column_seach_obj()');
    }
}

// clear filter
function reset_input_search_data() {
    try {
        //$("#tbl_advance_colSearch td").each(function () {
        //    $(this).find(".cls_search_txt").val('');
        //});
        $("#tbl_advance_colSearch li input[type='checkbox']").each(function () {
            $(this).prop('checked', false);
        });
        $(".fltr-cndtn-outer").hide();
        $(".div-delete-filter").hide();
        $("#ddl_OrderBy").val(ddl_orderby);
        $("#ddl_OrderType").val(ddl_order_type);

        // filter with forward backward 23012023
        localStorage.setItem('searchCol_obj', "");

        get_list_of_pm_sites_by_search_online('', 'clear_filter');
    }
    catch (e) {
        alert1(e + '_reset_input_search_data()');
    }
}

// get saved filter for selected tab 01122022
function get_saved_filter_data(tab_index) {
    try {
        // clear filter
        $("#tbl_advance_colSearch li input[type='checkbox']").each(function () {
            $(this).prop('checked', false);
        });
        localStorage.setItem('searchCol_obj', "");
        $(".fltr-cndtn-outer").hide();
        $("#lbl_filter_name").empty();
        $("#btn_Clear_Filter").hide();
        $(".div-delete-filter").hide();

        var user_id = JSON.parse(storage.getItem('user_id'));
        var udf_id = JSON.parse(storage.getItem('udf_id'));
        var tab_index = JSON.parse(storage.getItem('tab_index'));

        var param_obj = [];
        param_obj.push({
            'Udf_ID': udf_id,
            'User_ID': user_id,
            'tab_index': tab_index,
            'Filter_Name': ''
        });

        var getdata = new Webservicecall_REST(global_wcf_url + 'Select_Default_Filter', JSON.stringify(param_obj), function (e) {
            var myArray = JSON.parse(e.responseText);
            var status = myArray[0].status;
            var message = myArray[0].message;
            if (status == 1) {
                var data = myArray[0].data;
                data = JSON.parse(data);

                $("#ddl_saved_filter_list").show();
                var opt_str = '<option value="0">Saved Filter</option>';
                for (var i = 0; i < data.length; i++) {
                    var filter_id = data[i].ID;
                    var filter_json = data[i].JSON;
                    filter_json = JSON.parse(filter_json);
                    var filter_json_str = JSON.stringify(filter_json);
                    filter_json_str = encodeURIComponent(filter_json_str);
                    var filter_name = data[i].Filter_Name;
                    opt_str += '<option value="' + filter_name + '" filter_id="' + filter_id + '" name="' + filter_json_str + '">' + filter_name + '</option>';
                }
                $("#ddl_saved_filter_list").empty();
                $("#ddl_saved_filter_list").append(opt_str);
            }
            else if (status == 2) {
                $("#ddl_saved_filter_list").empty();
                var opt_str = '<option value="0">Saved Filter</option>';
                $("#ddl_saved_filter_list").append(opt_str);
            }
            else {
                alert1(message + '_get_saved_advanced_filter_data');
                loading_hide();
            }
        }, onfail);
        getdata.callOtherDomain();
    }
    catch (e) {
        alert(e + '_get_saved_filter_data');
    }
}




//Initilization of calendar event 06102023

//-----------Task View by Native Calender--------------
function view_calendar_task() {
    try {

        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var survey_mode = list_data[0].survey_mode;

        if (survey_mode == "online") {
            //  online task listing (view online tasks in full view calendar)
            init_calendar_default();
        }
        else {
            // offline task listing (view offline tasks in native calendar)
            var selected_udf_id = JSON.parse(storage.getItem('udf_id'));
            var selected_module_id = JSON.parse(storage.getItem('wayflow'));

            var q_jsonobj = [];
            q_jsonobj.push({
                'udf_id': selected_udf_id,
                'module_id': selected_module_id
            });

            cordova.exec(onsuccess_view_calendar_task, onfail, 'ViewTaskByCalendar', 'anAction', q_jsonobj);
        }
    }
    catch (e) {
        alert1(e + '_view_calendar_task()');
    }
}

function onsuccess_view_calendar_task(e) {
    try {
        var myArray = JSON.parse(e);

        var selected_site = myArray[0].siteid;
        var selected_site_name = myArray[0].site_name;
        var selected_server_task_id = myArray[0].ser_task_id;
        var selected_start_status = myArray[0].task_status;
        var selected_moduleid = myArray[0].module_id;
        var selected_modulename = myArray[0].module_name;
        var t_site_lat = myArray[0].site_lat;
        var t_site_long = myArray[0].site_long;
        var t_survey_date = myArray[0].survey_date;
        var t_millisecond = myArray[0].ser_milli;
        var t_task_update = 1;

        redirect_on_pm_site_click_online(selected_site, selected_site_name, selected_server_task_id, selected_start_status, selected_moduleid, selected_modulename, t_task_update, t_site_lat, t_site_long, t_survey_date, t_millisecond);
    }
    catch (e) {
        alert1(e + '_onsuccess_view_calendar_task');
    }
}
///-------------------------------------------------------------------------

var glob_Calendar, g_event_array = [], last_obj_search;
function convert_date_for_fullcalendar(t_date) {
    var date = new Date(t_date);
    var dd = date.getDate();
    var mm = date.getMonth() + 1;
    var yy = date.getFullYear();

    if (dd < 10) {
        dd = '0' + dd;
    }
    if (mm < 10) {
        mm = '0' + mm;
    }

    var t_date = yy + '-' + mm + '-' + dd;
    return t_date;
}

function init_calendar_default() {
    init_calendar(g_event_array);
}

function init_calendar(event_array) {
    $('.fc-today-button').text('');
    $('#ddl_cal').empty();
    //$('#mdl_calendar').modal('show');
    myApp.popup('.popup-task-calendar');

    var data_json = JSON.parse(storage.getItem('list_json'));
    var list_data = JSON.parse(data_json);
    var col_data = list_data[0].columndata;
    for (i = 0; i < col_data.length; i++) {
        var ctrl_type = col_data[i].ctrl_type
        if (ctrl_type == '8') {
            var header = col_data[i].header;
            var ele_ddl = '<option value="' + header + '"> ' + header + ' </option>';
            $('#ddl_cal').append(ele_ddl);
        }
    }

    var date = new Date();
    var today_date = convert_date_for_fullcalendar(date);

    g_start_date = new Date(date.getFullYear(), date.getMonth(), 1);
    //g_start_date = convert_datetime_by_format(g_start_date, 'date');
    g_start_date = convert_fix_format_date_on_submit(g_start_date, 'datetime');

    g_end_date = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    //g_end_date = convert_datetime_by_format(g_end_date, 'date');
    g_end_date = convert_fix_format_date_on_submit(g_end_date, 'date');
    g_end_date = g_end_date + " 23:59";

    setTimeout(function () {

        var calendarEl = document.getElementById('calendar');
        glob_Calendar = new FullCalendar.Calendar(calendarEl, {
            height: '100%',
            expandRows: true,
            slotMinTime: '08:00',
            slotMaxTime: '20:00',
            headerToolbar: {
                left: '',
                center: 'title',
                right: 'prev,next today'
            },
            initialView: 'dayGridMonth',
            initialDate: today_date,
            editable: true,
            selectable: true,
            nowIndicator: true,
            dayMaxEvents: true, // allow "more" link when too many events
            events: g_event_array
        });
        glob_Calendar.render();

        get_task_for_calendar(g_start_date, g_end_date);

        //change today button's text change as par click on month/week/day btn
        var current_text = '';
        $(".fc-button-primary").click(function () {
            current_text = $('.fc-toolbar-chunk .fc-button-group').find('.fc-button-active').text();
            $('.fc-today-button').text('This Month');
        });

        $("#ddl_cal").change(function () {
            get_task_for_calendar(g_start_date, g_end_date);
        });

        if (cal_flag == 0) {
            $('.fc-button-group .fc-prev-button').click(function () {
                // Previous click
                var d_array = get_prev_next_btnval('prev')
                get_task_for_calendar(d_array[0], d_array[1]);
            });

            $('.fc-button-group .fc-next-button').click(function () {
                // Next click
                var d_array = get_prev_next_btnval('next');
                get_task_for_calendar(d_array[0], d_array[1]);
            });

            $('.fc-today-button').click(function () {
                // Today button click
                var date = new Date();
                var today_date = convert_date_for_fullcalendar(date);
                g_start_date = new Date(date.getFullYear(), date.getMonth(), 1);
                //g_start_date = convert_datetime_by_format(g_start_date, 'date');
                g_start_date = convert_fix_format_date_on_submit(g_start_date, 'datetime');

                g_end_date = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                //g_end_date = convert_datetime_by_format(g_end_date, 'date');
                g_end_date = convert_fix_format_date_on_submit(g_end_date, 'date');
                g_end_date = g_end_date + " 23:59";
                get_task_for_calendar(g_start_date, g_end_date);
            });
            cal_flag = 1;
        }
    }, 300);
}

var cal_date = [], cal_flag = 0, current_view = 'Month';
function get_task_for_calendar(t_start_date, t_end_date) {

    var selected_module_id = JSON.parse(storage.getItem('wayflow'));
    var data_json = JSON.parse(storage.getItem('list_json'));
    var list_data = JSON.parse(data_json);
    var status_array = list_data[0].status;
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

    var udf_id = JSON.parse(storage.getItem('udf_id'));
    var tab_index = JSON.parse(storage.getItem('tab_index'));

    var flow_Array = JSON.parse(storage.getItem('flow_Array'));
    if (flow_Array.length == 1) {
        var p_server_task_id = 0;
    }
    else {
        var p_server_task_id = JSON.parse(storage.getItem('p_server_task_id'));
        var include_parent_task = list_data[0].include_parent_task;
        if (include_parent_task == "false") {
            p_server_task_id = "0";
        }
    }
    var order_by_obj = JSON.parse(last_obj_search);
    var ddl_val = $('#ddl_cal option:selected').val();

    var param_obj = [];
    param_obj.push({
        'Flow_Id': selected_module_id,
        'lat': 0,
        'long': 0,
        'search': "",
        'limit': 0,
        'condition': [],
        'system_var': t_push_array,
        'searchValue': "",
        'searchParticularColumn': [
            {
                "columnName": ddl_val,
                "id": "",
                "value": [
                    t_start_date,
                    t_end_date
                ],
                "Equation": "BETWEEN",
                "calendar_type": "is_between"
            }
        ],
        'offset': 0,
        'fetch': 500,
        'status': status_array,
        'udf_id': udf_id,
        'tab_index': tab_index,
        'Parent_Task_Id': p_server_task_id,
        'order_by': order_by_obj
    });

    loading();
    var getdata = new Webservicecall_REST(global_wcf_url + 'OnlineTaskListing', JSON.stringify(param_obj), function (e) {
        var responseText = e.responseText;
        var data = JSON.parse(responseText);
        var status = data[0]["status"];
        if (status == 1) {

            g_event_array = [];

            //get calculator label name dynamically columndata key DV-08112023
            var cal_col_name, cal_view_found = 0;
            var data_json = JSON.parse(storage.getItem('list_json'));
            var list_data = JSON.parse(data_json);
            var columndata = list_data[0].columndata;
            if (columndata == "" || columndata == null || columndata == undefined) { }
            else {
                for (k = 0; k < columndata.length; k++) {
                    var dis_in_cal_view = columndata[k].dis_in_cal_view;
                    if (dis_in_cal_view == "true") {
                        var col_header = columndata[k].header;
                        cal_col_name = col_header;
                        cal_view_found = 1;
                        break;
                    }
                }
            }

            for (i = 0; i < data.length; i++) {
                if (cal_view_found == 1) {
                    var col_data = data[i].columndata;
                    for (d = 0; d < col_data.length; d++) {
                        var cal_title = col_data[d][cal_col_name];
                    }
                }
                else {
                    var cal_title = data[i].siteid;
                    if (cal_title == "" || cal_title == null || cal_title == undefined) {
                        cal_title = data[i].server_task_id;
                    }
                }

                var cal_start_date = data[i].columndata[0][ddl_val];
                cal_start_date = cal_start_date.split(" ")[0];
                if (cal_start_date.indexOf("-") > -1) {
                    // company date formate has -
                    cal_start_date = cal_start_date.split("-");
                }
                else {
                    // company date formate has /
                    cal_start_date = cal_start_date.split("/");
                }

                cal_start_date = cal_start_date[1] + '/' + cal_start_date[0] + '/' + cal_start_date[2];
                var s_date = new Date(cal_start_date);
                cal_start_date = convert_date_for_fullcalendar(s_date);

                var e_date = s_date;
                e_date.setDate(e_date.getDate() + 1);
                var cal_end_date = convert_date_for_fullcalendar(e_date);

                if (cal_title == "" || cal_title == null || cal_title == undefined) {
                    cal_title = data[i].server_task_id;
                }

                g_event_array.push({
                    title: cal_title,
                    start: cal_start_date,
                    end: cal_end_date
                });
            }
            glob_Calendar.removeAllEvents();
            glob_Calendar.addEventSource(g_event_array);
        }
        else if (status == 2) {
            if (glob_Calendar) {
                glob_Calendar.removeAllEvents();
            }
        }
        else {
            if (glob_Calendar) {
                glob_Calendar.removeAllEvents();
            }
            alert(data[0].message);
        }
        loading_hide();
    }, onfail);
    getdata.callOtherDomain();
}

var g_start_date, g_end_date;
function get_prev_next_btnval(datetxt) {

    var start_date, end_date;
    if (datetxt == 'prev') {
        //Previous
        if (current_view == "Month") {
            var t_start_date = new Date(g_start_date);
            t_start_date = new Date(t_start_date.getFullYear(), t_start_date.getMonth(), 1);
            t_start_date.setMonth(t_start_date.getMonth() - 1);
            var t_end_date = new Date(t_start_date);
            t_end_date = new Date(t_end_date.getFullYear(), t_end_date.getMonth() + 1, 0);

            //t_start_date = convert_datetime_by_format(t_start_date, 'date');
            start_date = convert_fix_format_date_on_submit(t_start_date, 'datetime');

            //t_end_date = convert_datetime_by_format(t_end_date, 'date');
            end_date = convert_fix_format_date_on_submit(t_end_date, 'date');
            end_date = end_date + " 23:59";
        }
    }
    else {
        // next
        if (current_view == "Month") {
            var t_start_date = new Date(g_start_date);
            t_start_date.setMonth(t_start_date.getMonth() + 1);
            t_start_date = new Date(t_start_date.getFullYear(), t_start_date.getMonth(), 1);
            var t_end_date = new Date(t_start_date.getFullYear(), t_start_date.getMonth() + 1, 0);

            //t_start_date = convert_datetime_by_format(t_start_date, 'date');
            start_date = convert_fix_format_date_on_submit(t_start_date, 'datetime');

            //t_end_date = convert_datetime_by_format(t_end_date, 'date');
            end_date = convert_fix_format_date_on_submit(t_end_date, 'date');
            end_date = end_date + " 23:59";
        }
    }

    g_start_date = start_date;
    g_end_date = end_date;

    return [start_date, end_date];
}