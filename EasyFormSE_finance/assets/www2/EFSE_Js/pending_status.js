var last_file_count = 0;
var last_photo_count = 0;
var last_video_count = 0;
var last_trip_count = 0;
var pending_last_task_count = 0;

// change downloading label autmatically
function update_upload_wait_label() {
    var wait_label = document.getElementById("lbl_uploading");
    wait_label.innerHTML = wait_label.innerHTML == "Uploading..." ? "Please Wait..."
			: "Uploading...";
}

function make_upload_call() {
    try {
        delete_track_upload_table();

        var q_jsonobj = [];
        q_jsonobj.push({
            "fid": '',
            "tid": '',
            "step": ''
        });

        cordova.exec(onsuccess_make_upload_call, onfail_make_upload_call, 'SqlitePlugin', 'step', q_jsonobj);
    } catch (e) {
        alert1(e + "Upload_pending_task_step_uploaded");
    }
}

function onsuccess_make_upload_call(e) {
    // get_pending_files();
    // get_pending_tasks();
    //delete_track_upload_table();
}
function onfail_make_upload_call(e) {
    // get_pending_files();
    // get_pending_tasks();
    // delete_track_upload_table();
}

function delete_track_upload_table() {
    var query = "delete from track_upload";
    var q_jsonobj = [];
    q_jsonobj.push({
        data: query,
        q: "0",
        tid: "0"
    });
    cordova.exec(onsuccess_delete_track_upload_table, onfail_delete_track_upload_table, 'SqlitePlugin', 'insertValuse', q_jsonobj);
}

function onsuccess_delete_track_upload_table(e) {
    get_pending_tasks();
}

function onfail_delete_track_upload_table(e) {
    get_pending_tasks();
}

// getting pending tasks
function get_pending_tasks() {
    // alert1("getting pending files...");
    try {
        $("#progressbar1").show();
        var query = "select flag from task_master where flag = 1 or flag = 3";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "1"
        });
        cordova.exec(get_pending_trips, onfail_get_pending_data, 'SqlitePlugin', 'showValues', q_jsonobj);
    } catch (e) {
        alert1(e + '_get_pending_tasks()');
        loading_hide();
    }
}

//getting pending trips
function get_pending_trips(e) {
    // alert1("getting pending files...");
    try {
        var myArray = JSON.parse(e);
        $('#lbl_pen_t_counter').text(myArray.length);
        if (pending_last_task_count != myArray.length) {
            pending_last_task_count = myArray.length;
            $("#lbl_pen_t_counter").addClass('mk_vibrate');
            setTimeout(function () {
                $("#lbl_pen_t_counter").removeClass('mk_vibrate');
            }, 500);
        }

        var query = "select issend from lat_plug where issend = 0";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "1"
        });
        cordova.exec(get_pending_videos, onfail_get_pending_data, 'SqlitePlugin', 'showValues', q_jsonobj);
    } catch (e) {
        alert1(e + '_get_pending_trips()');
        loading_hide();
    }
}

//getting pending videos
function get_pending_videos(e) {
    try {
        var myArray = JSON.parse(e);
        $('#lbl_pen_trip_counter').text(myArray.length);
        if (last_trip_count != myArray.length) {
            last_trip_count = myArray.length;
            $("#lbl_pen_trip_counter").addClass('mk_vibrate');
            setTimeout(function () {
                $("#lbl_pen_trip_counter").removeClass('mk_vibrate');
            }, 500);
        }

        var query = "select issend_track from video where issend_track = 0";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "1"
        });
        cordova.exec(get_pending_files, onfail_get_pending_data, 'SqlitePlugin', 'showValues', q_jsonobj);
    } catch (e) {
        alert1(e + '_get_pending_videos()');
        loading_hide();
    }
}

// getting pending files
function get_pending_files(e) {
    try {
        var myArray = JSON.parse(e);
        $('#lbl_pen_v_counter').text(myArray.length);
        if (last_video_count != myArray.length) {
            last_video_count = myArray.length;
            $("#lbl_pen_v_counter").addClass('mk_vibrate');
            setTimeout(function () {
                $("#lbl_pen_v_counter").removeClass('mk_vibrate');
            }, 500);
        }

        var query = "select flag from f_master where flag = 0";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "1"
        });
        cordova.exec(get_pending_photos, onfail_get_pending_data, 'SqlitePlugin', 'showValues', q_jsonobj);
    } catch (e) {
        alert1(e + '_get_pending_files()');
        loading_hide();
    }
}

// getting pending photos
function get_pending_photos(e) {
    try {
        var myArray = JSON.parse(e);
        $('#lbl_pen_f_counter').text(myArray.length);
        if (last_file_count != myArray.length) {
            last_file_count = myArray.length;
            $("#lbl_pen_f_counter").addClass('mk_vibrate');
            setTimeout(function () {
                $("#lbl_pen_f_counter").removeClass('mk_vibrate');
            }, 500);
        }

        var query = "select flag from p_master where flag = 0";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "1"
        });
        cordova.exec(onsucess_get_pending_data, onfail_get_pending_data, 'SqlitePlugin', 'showValues', q_jsonobj);
    } catch (e) {
        alert1(e + '_get_pending_photos()');
        loading_hide();
    }
}

// calculate total pending data
function onsucess_get_pending_data(e) {
    try {
        // alert1(e);
        var myArray = JSON.parse(e);
        $('#lbl_pen_p_counter').text(myArray.length);
        if (last_photo_count != myArray.length) {
            last_photo_count = myArray.length;
            $("#lbl_pen_p_counter").addClass('mk_vibrate');
            setTimeout(function () {
                $("#lbl_pen_p_counter").removeClass('mk_vibrate');
            }, 500);
        }

        var pending_files = parseInt($('#lbl_pen_f_counter').text());
        var pending_photos = parseInt($('#lbl_pen_p_counter').text());
        var pending_videos = parseInt($('#lbl_pen_v_counter').text());
        var pending_tasks = parseInt($('#lbl_pen_t_counter').text());
        var pending_trips = parseInt($('#lbl_pen_trip_counter').text());
        $('#lbl_total_pending_counter').text(pending_files + pending_photos + pending_videos);

        enable_back_button();

        var total_pending = $('#lbl_total_pending_counter').text();
        if (total_pending == 0 && pending_tasks == 0 && pending_trips == 0) {
            // upload complete
            //clearInterval(label_timer); // stop_uploading_label_change_timer
            $("#progressbar1").hide();

            var flag = JSON.parse(storage.getItem('pending_status_page'));
            if (flag == '1') {
                storage.setItem('pending_status_page', JSON.stringify('0'));
                changeurl("selection_survey.html");
            } else {
                storage.setItem('pending_status_page', JSON.stringify('0'));
                changeurl("Login.html");
            }
        } else {
            // alert1("upload not complete !");
            // setTimeout(function() {
            // // get_pending_files();
            // //get_pending_tasks();
            // }, 300);
            get_details_of_uploaded_photo_file();
        }
    } catch (e) {
        alert1(e + '_onsucess_get_pending_data');
        loading_hide();
    }
}

function onfail_get_pending_data(e) {
    //alert1(e + '_onfail_get_pending_data()');
    setTimeout(function () {
        get_pending_tasks();
    }, 300);
    loading_hide();
}

/*---------------START------------ */

function get_details_of_uploaded_photo_file() {
    try {
        var query = "select * from track_upload";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "1"
        });
        cordova.exec(SuccessCallBack_get_details_of_uploaded_photo_file, get_details_of_uploaded_photo_file_FailCallBack, 'SqlitePlugin', 'showValues', q_jsonobj);
    } catch (e) {
        alert1(e + "_get_details_of_uploaded_photo_file()");
    }
}

function SuccessCallBack_get_details_of_uploaded_photo_file(e) {
    try {
        $("#uploaded_list_grid").empty();
        var myArray = JSON.parse(e);
        if (myArray.length > 0) {
            var up_li_str = '';
            for (j = 0; j < myArray.length; j++) {
                var task_id_1 = myArray[j].tid;
                var f_id = myArray[j].fid;
                var p_id = myArray[j].pid;
                var sitename = myArray[j].sitename;
                var error = myArray[j].error;
                var flag = myArray[j].flag;

                if (flag == 1) {
                    var fore_color = "green";
                    if (p_id == 0) {
                        var content = "<label>Step has been successfully uploaded!</label>";
                    } else {
                        var content = "<label>Photo has been successfully uploaded!</label>";
                    }
                } else {
                    var fore_color = "red";
                    var content = "<label>Error: " + error + "</label><br>";
                }

                if (sitename == '' || sitename == null || sitename == undefined) {
                    sitename = '< not available >'
                }
                up_li_str += '<li style="color: ' + fore_color + '; border: 1px solid #aaa">';
                up_li_str += "<label>Site Name: " + sitename + "</label><br>";
                up_li_str += "<label>" + content + "</label></li>";
            }
            $("#uploaded_list_grid").append(up_li_str);
        }
        setTimeout(function () {
            get_pending_tasks();
        }, 300);
    } catch (e) {
        alert1(e + "_SuccessCallBack_get_details_of_uploaded_photo_file()");
    }
}

function get_details_of_uploaded_photo_file_FailCallBack(e) {
    // table flushed 
    get_pending_tasks();
}
/*--------------END----------------*/