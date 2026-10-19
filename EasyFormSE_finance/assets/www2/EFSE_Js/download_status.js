var last_step_count = 0;
var last_navigation_count = 0;
var last_module_count = 0;
var download_last_task_count = 0;
var last_flow_count = 0;

// update start download flag
function update_start_download_flag() {
    try {
        var query = "UPDATE APP_states SET VALUE = '1' where ITEAM='download_flag'";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            q: "1", // 0 will not update flag 0 to 1 in table
            tid: "0"
        });
        cordova.exec(SuccessCallBack_update_start_download_flag,
            FailCallBack_update_start_download_flag, 'SqlitePlugin',
            'insertValuse', q_jsonobj);
    } catch (e) {
        alert1(e + '_update_site_defualt_distance');
        $("#progressbar1").hide();
    }
}

// successful update default distance with server response distance
function SuccessCallBack_update_start_download_flag(e) {
    try {
        // alert1("Start download flag set to 0 !");
        // get_download_counter();
        update_status_in_download_table();
    } catch (e) {
        alert1(e + '_SuccessCallBack_update_start_download_flag');
        $("#progressbar1").hide();
    }
}

// update start download flag
function update_status_in_download_table() {
    try {
        var query = "UPDATE download_counter SET status = '0', counter = case when _id = 5 then 0 else counter end";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            q: "3", // check for GPS on/off and return flag (start download) 
            tid: "0"
        });
        cordova.exec(onsuccess_update_status_in_download_table, onfail_update_status_in_download_table, 'SqlitePlugin', 'insertValuse', q_jsonobj);
    } catch (e) {
        alert1(e + '_update_status_in_download_table()');
    }
}

function onsuccess_update_status_in_download_table(e) {
    try {
        get_download_counter();
    } catch (e) {
        alert1(e + '_onsuccess_update_status_in_download_table()');
    }
}

function onfail_update_status_in_download_table(e) {
    alert1(e + '_onfail_update_status_in_download_table()');
}

// change downloading label autmatically
function update_download_wait_label() {
    var wait_label = document.getElementById("lbl_downloading");
    wait_label.innerHTML = wait_label.innerHTML == "Collecting Data..." ? "Please Wait..." : "Collecting Data...";
}

// get current download counter
function get_download_counter() {
    // alert1("getting counter...");
    try {
        $("#progressbar1").show();
        $("#btn_retry").hide();
        $("#btn_go_ahead").hide();

        var query = "select counter_name, status, counter, total_count, globalcounter from download_counter";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "1"
        });
        AppBridge.on(cordova).read(onsuccess_get_download_counter, download_fail_callback, 'downloadCounters', {});
    } catch (e) {
        alert1(e + '_get_download_counter()');
        $("#progressbar1").hide();
        $("#btn_retry").show();
        $("#btn_go_ahead").show()
    }
}

// assign counter values to labels
function onsuccess_get_download_counter(e) {
    try {
        //alert1(e);
        var myArray = JSON.parse(e);
        var status = 2;
        var total_curr_count = 0;
        var grand_count = 0;

        // grand_count = parseInt(myArray[0].globalcounter); // global count
        // will
        // be
        // same for all row
        var curr_c_count = parseInt(myArray[0].counter);
        var max_c_count = parseInt(myArray[0].total_count);
        var curr_t_a_count = parseInt(myArray[1].counter);
        var max_t_a_count = parseInt(myArray[1].total_count);
        var curr_n_count = parseInt(myArray[2].counter);
        var max_n_count = parseInt(myArray[2].total_count);
        var curr_m_count = parseInt(myArray[3].counter);
        var max_m_count = parseInt(myArray[3].total_count);
        var curr_f_a_count = parseInt(myArray[4].counter);
        var max_f_a_count = parseInt(myArray[4].total_count);

        grand_count = parseInt(max_c_count + max_n_count + max_m_count);
        total_curr_count = parseInt(curr_c_count + curr_n_count + curr_m_count);

        $('#lbl_curr_c_counter').text(curr_c_count);
        $('#lbl_max_c_counter').text(max_c_count);
        $('#lbl_curr_n_counter').text(curr_n_count);
        $('#lbl_max_n_counter').text(max_n_count);
        $('#lbl_curr_m_counter').text(curr_m_count);
        $('#lbl_max_m_counter').text(max_m_count);
        $('#lbl_grand_counter').text(grand_count);

        if (last_step_count != curr_c_count) {
            last_step_count = curr_c_count;
            $("#lbl_curr_c_counter").addClass('mk_vibrate');
            setTimeout(function () {
                $("#lbl_curr_c_counter").removeClass('mk_vibrate');
            }, 500);
        }

        if (last_navigation_count != curr_n_count) {
            last_navigation_count = curr_n_count;
            $("#lbl_curr_n_counter").addClass('mk_vibrate');
            setTimeout(function () {
                $("#lbl_curr_n_counter").removeClass('mk_vibrate');
            }, 500);
        }

        if (last_module_count != curr_m_count) {
            last_module_count = curr_m_count;
            $("#lbl_curr_m_counter").addClass('mk_vibrate');
            setTimeout(function () {
                $("#lbl_curr_m_counter").removeClass('mk_vibrate');
            }, 500);
        }

        // for (i = 0; i < myArray.length; i++) {
        // var current_status = parseInt(myArray[i].status);
        // if (current_status == 1 && i != 4) {
        // status = 0;
        // }
        // }

        var s1 = parseInt(myArray[0].status);
        var s2 = parseInt(myArray[1].status);
        var s3 = parseInt(myArray[2].status);
        var s4 = parseInt(myArray[3].status);
        if (s1 == 0 || s2 == 0 || s2 == 0 || s3 == 0) {
            status = 0;
        }

        var chk_downloaded_per = parseInt($('#lbl_pb_counter').text());
        if (chk_downloaded_per >= 100) {

            //// for demo company (temporary base)
            //if ($('#img_demo').css('display') == 'inline') {
            //    changeurl("selection.html");
            //}

            $("#btn_skip").show();
            $('#refresh_chk').css('visibility', 'hidden');
            $('#refresh_task').css('visibility', 'visible');

            //var chk_skip_down = JSON.parse(storage.getItem('chk_skip_down'));
            //if (chk_skip_down == true) {
            //    update_end_download_flag();
            //}
        }
        else {
            //$("#btn_skip").hide();
            $("#btn_skip").show();
            $('#refresh_chk').css('visibility', 'visible');
            $('#refresh_task').css('visibility', 'hidden');
        }

        if (grand_count == 0 && total_curr_count == 0) {
            var pro_value = 0;
            var task_pro_value = 0;
            var flow_pro_value = 100;
        } else if (status == 2) {
            var pro_value = 100;
            var task_pro_value = 100;
            var flow_pro_value = 100;
            if (curr_t_a_count != max_t_a_count) {
                task_pro_value = (100 / max_t_a_count) * curr_t_a_count;
            }
            if (curr_f_a_count != max_f_a_count) {
                flow_pro_value = (100 / max_f_a_count) * curr_f_a_count;
            }
        } else {
            var pro_value = (100 / grand_count) * total_curr_count;

            // task
            var task_pro_value = 0;
            if (max_t_a_count > 0) {
                task_pro_value = (100 / max_t_a_count) * curr_t_a_count;
            }

            // flow
            var flow_pro_value = 0;
            if (max_f_a_count > 0) {
                flow_pro_value = (100 / max_f_a_count) * curr_f_a_count;
            }
        }
        pro_value = Math.round(pro_value);
        task_pro_value = Math.round(task_pro_value);
        flow_pro_value = Math.round(flow_pro_value);

        if (total_curr_count > grand_count) {
            total_curr_count = grand_count;
        }
        if (pro_value > 100) {
            pro_value = 100;
        }
        if (curr_t_a_count > max_t_a_count) {
            curr_t_a_count = max_t_a_count;
        }
        if (task_pro_value > 100) {
            task_pro_value = 100;
        }
        if (curr_f_a_count > max_f_a_count) {
            curr_f_a_count = max_f_a_count;
        }
        if (flow_pro_value > 100) {
            flow_pro_value = 100;
        }

        // checksheet
        $('#lbl_total_curr_counter').text(total_curr_count);
        $('#lbl_total_max_counter').text(grand_count);
        myApp.setProgressbar('#download_progressbar', pro_value);
        $('#lbl_pb_counter').text(pro_value + '%');

        // task
        $('#lbl_curr_t_a_counter').text(curr_t_a_count);
        $('#lbl_max_t_a_counter').text(max_t_a_count);
        $('#task_lbl_total_curr_counter').text(curr_t_a_count);
        $('#task_lbl_total_max_counter').text(max_t_a_count);
        if (max_t_a_count > 0) {
            myApp.setProgressbar('#task_download_progressbar', task_pro_value);
            $('#task_lbl_pb_counter').text(task_pro_value + '%');
        }
        if (download_last_task_count != curr_t_a_count) {
            download_last_task_count = curr_t_a_count;
            $("#lbl_curr_t_a_counter").addClass('mk_vibrate');
            setTimeout(function () {
                $("#lbl_curr_t_a_counter").removeClass('mk_vibrate');
            }, 500);
        }

        // flow
        $('#lbl_curr_f_a_counter').text(curr_f_a_count);
        $('#lbl_max_f_a_counter').text(max_f_a_count);
        $('#flow_lbl_total_curr_counter').text(curr_f_a_count);
        $('#flow_lbl_total_max_counter').text(max_f_a_count);
        if (max_f_a_count > 0) {
            myApp.setProgressbar('#flow_download_progressbar', flow_pro_value);
            $('#flow_lbl_pb_counter').text(flow_pro_value + '%');
        }
        if (last_flow_count != curr_f_a_count) {
            last_flow_count = curr_f_a_count;
            $("#lbl_curr_f_a_counter").addClass('mk_vibrate');
            setTimeout(function () {
                $("#lbl_curr_f_a_counter").removeClass('mk_vibrate');
            }, 500);
        }

        enable_back_button();
        if (status == 2) {
            // alert1("download complete !");
            $("#btn_skip").show();
            update_end_download_flag();
        } else {
            // alert1("download not complete !");
            setTimeout(function () {
                get_download_counter();
            }, 300);
        }
    } catch (e) {
        alert1(e + '_onsuccess_get_download_counter()');
        $("#progressbar1").hide();
    }
}

function go_ahead_with_current_data() {
    try {
        if (F7_device == 'ios') {
            var user_choice = true;
        }
        else {
            vibrate_device();
            var user_choice = confirm("Some data may not be available. Are you sure want to go ahead with current data?");
        }
        if (user_choice == true) {
            $("#progressbar1").hide();
            $("#btn_retry").hide();
            $("#btn_go_ahead").hide()
            changeurl("selection.html");
        } else {
            alert1("Press retry to download more data !");
        }
    } catch (e) {
        alert1(e + '_go_ahead_with_current_data()');
        $("#progressbar1").hide();
    }
}

function download_fail_callback(e) {
    alert1(e + '_download_fail_callback()');
    $("#progressbar1").hide();
    $("#btn_retry").show();
    $("#btn_go_ahead").show();
}

// update end download flag
function update_end_download_flag() {
    try {
        var query = "UPDATE APP_states SET VALUE = '2' where ITEAM='download_flag'";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            q: "1", // 0 will not update flag 0 to 1 in table
            tid: "0"
        });
        cordova.exec(SuccessCallBack_update_end_download_flag, FailCallBack_update_end_download_flag, 'SqlitePlugin', 'insertValuse', q_jsonobj);
    } catch (e) {
        alert1(e + '_update_site_defualt_distance');
        $("#progressbar1").hide();
    }
}

var pageload_timer;
var skip_flag = "normal";
// successful update default distance with server response distance
function SuccessCallBack_update_end_download_flag(e) {
    try {
        // alert1("End download flag set to 2 !");
        pageload_timer = setTimeout(function () {
            $("#progressbar1").hide();
            $("#btn_retry").hide();
            $("#btn_go_ahead").hide();
            // stop_downloading_label_change_timer
            clearInterval(label_timer);

            //changeurl("selection.html");

            if (skip_flag == "normal") {
                // pageload code of selection.html
                storage.setItem('flow_Array', JSON.stringify(''));
                localStorage.setItem('is_subflow', 'false');

                check_for_notification();               //to skip single module list
                localStorage.setItem('download_completed', '1');
            }

        }, 00);

    } catch (e) {
        alert1(e + '_SuccessCallBack_update_start_download_flag');
        $("#progressbar1").hide();
    }
}

function FailCallBack_update_start_download_flag() {
    alert1(e + '_FailCallBack_update_start_download_flag');
    $("#progressbar1").hide();
}

function FailCallBack_update_end_download_flag() {
    alert1(e + '_FailCallBack_update_end_download_flag');
    $("#progressbar1").hide();
}

function skip_download() {
    try {
        if (F7_device == 'ios') {
            var user_choice = true;
        }
        else {
            vibrate_device();
            var user_choice = confirm("Are you sure, you want to skip download?");
        }
        if (user_choice == true) {
            clearTimeout(pageload_timer);                                   //single module download skip issue (green1.tech) [27072020]
            skip_flag = "skip";

            localStorage.setItem('download_completed', '1');
            
            //changeurl("selection.html");

            
            // pageload code of selection.html
            storage.setItem('flow_Array', JSON.stringify(''));
            localStorage.setItem('is_subflow', 'false');

            check_for_notification();
        }
    }
    catch (e) {
        alert1(e + '_skip_download');
    }
}
