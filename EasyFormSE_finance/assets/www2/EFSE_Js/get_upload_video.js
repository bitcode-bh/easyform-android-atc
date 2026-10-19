function capture_video(item_id, que_id, img_div, t_form_flag) {
    try {
        storage.setItem('img_id', JSON.stringify(item_id));
        storage.setItem('img_que_id', JSON.stringify(que_id));
        storage.setItem('img_div_id', JSON.stringify(img_div));
        storage.setItem('camera_type', JSON.stringify('28'));

        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var survey_mode = list_data[0].survey_mode;

        var thumb_path = $('#' + img_div).attr('src');
        if (thumb_path == 'images/video-camera.png') {
            //storage.setItem('crash_status', JSON.stringify('1'));
            if (form_flag == 7 || (form_flag == 6 && survey_mode == "online") || (curr_page_flag == "viewsitedata_task" && survey_mode == "online")) {
                //upload live video for customer and task form
                capture_video_n_upload_live(item_id, que_id, img_div, t_form_flag);
            }
            else {
                capture_video_actual();
            }
        }
        else {
            if (F7_device == 'ios') {
                var user_choice = true;
            }
            else {
                vibrate_device();
                var user_choice = confirm('Video is already exist. Do you want to re-capture video?');
            }
            if (user_choice == true) {
                //storage.setItem('crash_status', JSON.stringify('1'));
                if (form_flag == 7 || (form_flag == 6 && survey_mode == "online") || (curr_page_flag == "viewsitedata_task" && survey_mode == "online")) {
                    //upload live video for customer and task form
                    capture_video_n_upload_live(item_id, que_id, img_div, t_form_flag);
                }
                else {
                    capture_video_actual();
                }
            }
        }
    } catch (e) {
        alert1(e + '_capture_video()');
    }
}

function capture_video_actual() {
    try {
        var date_s = new Date();
        var time = date_s.getTime();
        var query = "select imei from Login_Master";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "1",
            time: time
        });
        cordova.exec(check_video_entry, onFail_video, 'video_plugin', 'anAction', q_jsonobj);
    }
    catch (e) {
        alert1(e + '_capture_video_actual()');
    }
}

var curr_video_id, video_query_type;
// check photo for insert or update
function check_video_entry(e) {
    try {
        form_has_changed = "true";                      //to get confirmation on back btn while editing form
        var myArray = JSON.parse(e);
        var thumb_path = myArray[0].th_path;
        var video_path = myArray[0].video_path;
        var video_size = myArray[0].video_size;

        curr_survey_data["video_path"] = video_path;
        curr_survey_data["video_size"] = video_size;
        curr_survey_data["thumb_path"] = thumb_path;

        var t_id = curr_survey_data["t_id"];
        var step = curr_survey_data["step"];
        var check_type = curr_survey_data["check_type"];
        var img_que_id = JSON.parse(storage.getItem('img_que_id'));
        var query = "select _id from video where tid = '" + t_id + "' and checksheetid = '" + check_type + "' and step_No = '" + step + "' and que_id = '" + img_que_id + "'";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "0"
        });
        cordova.exec(onsuccess_check_video_entry, onfail_check_video_entry, 'SqlitePlugin', 'showValues', q_jsonobj);
    }
    catch (e) {
        alert1(e + '_check_video_entry()');
    }
}

function onsuccess_check_video_entry(e) {
    curr_video_id = e;
    video_query_type = 'update';
    onsuccess_capture_video();
}

function onfail_check_video_entry(e) {
    video_query_type = 'insert';
    onsuccess_capture_video();
}

// Get base64 of photo captured by device successfully
function onsuccess_capture_video() {
    try {
        // var myArray = JSON.parse(e);
        var thumb_path = curr_survey_data["thumb_path"];
        var video_path = curr_survey_data["video_path"];
        var video_size = curr_survey_data["video_size"];

        //curr_survey_data["video_path"] = video_path;
        //curr_survey_data["video_size"] = video_size;
        //curr_survey_data["thumb_path"] = thumb_path;

        var curr_img_div_id = JSON.parse(storage.getItem('img_div_id'));
        var smallImage = document.getElementById(curr_img_div_id);

        // smallImage.src = thumb_path;
        smallImage.src = 'images/edit_collapse.png';
        smallImage.style.cssFloat = 'right';
        smallImage.style.width = '20px';
        smallImage.style.height = '20px';
        smallImage.style.border = '1px solid gray';
        smallImage.style.borderRadius = '0';

        var video_exist = $("#div_" + curr_img_div_id + "").find("video");
        if (video_exist.length == 0) {
            var vdo_div = $('#' + curr_img_div_id + '').parent().find('div').attr("id");
            document.getElementById(vdo_div).innerHTML = '<video autoplay controls poster="' + thumb_path + '" style="margin-top:5px; height: 300px; width: 100%"><source src="' + video_path + '" type="video/mp4"></video>';
        }
        else {
            // recapture video case
            $(video_exist[0]).attr("poster", thumb_path);
            let source = $(video_exist[0]).find("source");
            $(source).attr("src", video_path);

            let new_video = $(video_exist[0]);
            new_video[0].load();
            new_video[0].play();
        }

        var new_id = curr_img_div_id.toString().replace('video_', '');
        $("#vdo_progress_" + new_id + "").hide();
        $("#vdo_stop_img_" + new_id + "").hide();
        $("#vdo_start_img_" + new_id + "").hide();
        $("#vdo_start_spn_" + new_id + "").hide();
        $("#vdo_main_" + new_id + "").hide();

        var img_id = JSON.parse(storage.getItem('img_id'));

        var answer = [];
        answer.push(video_path, thumb_path, video_size);

        //var curr_form_flag = form_flag;
        //if (curr_form_flag == 0) {
        //    // normal form
        //    jsonObj_old[img_id].ans = answer;
        //} else if (curr_form_flag == 1) {
        //    // type22 form
        //    jsonObj_type22[img_id].ans = answer;
        //} else if (curr_form_flag == 3) {
        //    // type23 form
        //    jsonObj_type23[img_id].ans = answer;
        //}

        var curr_form_flag = form_flag;
        if (curr_form_flag == 0 || curr_form_flag == 6 || curr_form_flag == 7) {
            let task_create_popup = $('.popup-new-task-create.modal-in:visible');
            if (task_create_popup.length > 0) {
                //new task create popup [FT-08052025]
                jsonObj_task_add[img_id].ans = answer;
            }
            else {
                // normal form
                jsonObj_old[img_id].ans = answer;
            }
        } else if (curr_form_flag == 1 || curr_form_flag == 4 || curr_form_flag == 5) {
            // type22 form
            jsonObj_type22[img_id].ans = answer;
        } else if (curr_form_flag == 2 || curr_form_flag == 3) {
            // type23 form
            jsonObj_type23[img_id].ans = answer;
        }

        var query = "select imei from Login_Master";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "1"
        });
        cordova.exec(insert_video_entry, onfail_insert_video, 'SqlitePlugin', 'showValues', q_jsonobj);
    } catch (e) {
        alert1(e + '_onPhotoDataSuccess_video()');
        loading_hide();
    }
}

function insert_video_entry(e) {
    try {
        // alert1(e);
        var myArray = JSON.parse(e);
        var IMEI_No = myArray[0].imei;
        var date_s = new Date();
        var time = date_s.getTime();

        var company_id = JSON.parse(storage.getItem('company_id'));
        var user_id = JSON.parse(storage.getItem('user_id'));
        var siteid = JSON.parse(storage.getItem('siteid'));
        var p_name = company_id + "_" + user_id + "_" + siteid + "_" + time;

        // var p_name = IMEI_No + "_" + time;
        var t_id = curr_survey_data["t_id"];
        var img_que_id = JSON.parse(storage.getItem('img_que_id'));
        var video_path = curr_survey_data["video_path"];
        var video_size = curr_survey_data["video_size"];
        var thumb_path = curr_survey_data["thumb_path"];
        var check_type = curr_survey_data["check_type"];

        var type22_img_que_id = storage.getItem('img_id_type22');
        var type22_popup = $('.popup-type22:visible');
        if (type22_popup.length > 0) {
            if (row_index_no == 0) {
                var row_length = $('#tbl_row_data_' + type22_new_id + '').find('img[id^="btn_edit_td_"]').length;
                var t_row_index_no = row_length + 1;
            }
            else {
                var t_row_index_no = row_index_no;
            }
        }
        else {
            var type22_img_que_id = 0;
            var t_row_index_no = 0;
        }
        p_name = p_name + '_' + t_row_index_no;

        var step = curr_survey_data["step"];
        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var match_temp_id = list_data[0].match_temp_id;
        if (match_temp_id == "" || match_temp_id == null || match_temp_id == undefined) {
            match_temp_id = "";
        }

        var img_div = JSON.parse(storage.getItem('img_div_id'));
        var prop_name = $("#" + img_div + "").attr('name');

        if (video_query_type == 'insert') {
            var query = "INSERT INTO video (tid, que_id, checksheetid, p_name, or_path, con_path, type, issend_track, CompanyId, CustomerUniq, Ph_id, it_id, millisecond, step_No, size, match_temp_id, que_name) VALUES('"
                + t_id + "','" + img_que_id + "','" + check_type + "','" + p_name + "','" + video_path + "', '" + thumb_path + "', 'video', '0', '" + company_id + "', '" + siteid + "','"
                + type22_img_que_id + "', '" + t_row_index_no + "', '" + time + "', '" + step + "', '" + video_size + "', '" + match_temp_id + "', '" + prop_name + "');";
        }
        else {
            var query = "update video set or_path='" + video_path + "', con_path='" + thumb_path + "', size='" + video_size + "', millisecond='" + time + "', issend_track='0' where _id='" + curr_video_id + "'";
        }

        //alert1(query);
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            q: "0",
            tid: ""
        });
        cordova.exec(onsuccess_insert_video_entry, onfail_insert_video_entry, 'SqlitePlugin', 'insertValuse', q_jsonobj);
    } catch (e) {
        alert1(e + '_insert_video_entry()');
        loading_hide();
    }
}

function onsuccess_insert_video_entry(e) {
    //alert1("Video has been saved successfully !");
    storage.setItem('crash_status', JSON.stringify('0'));
    curr_btn_mode = "";
    show_save_label();
    loading_hide();
}

function onfail_insert_video_entry(e) {
    alert1(e + '_onfail_insert_video_entry()');
    loading_hide();
}

function onFail_video(e) {
    // user press back/cancel button before/after capturing photo
    // alert1(e + '_onFail_video()');
    storage.setItem('crash_status', JSON.stringify('0'));
    loading_hide();
}

function onfail_insert_video(e) {
    alert1(e + '_onfail_insert_video()');
    loading_hide();
}

// Video Download Start
function bind_unavailable_videos(t_new_id) {
    $("#video_cont_" + t_new_id + " > video").attr("poster", "images/video-camera.png");
    $("#vdo_main_" + t_new_id + "").show();
}

function toggle_video_download(t_item_id, t_new_id, t_video_path, t_thumb_path, t_video_size, t_video_que_id) {
    try {
        var obj = {
            new_id: t_new_id,
            video_path: t_video_path,
            thumb_path: t_thumb_path,
            video_size: t_video_size,
            video_que_id: t_video_que_id
        }
        localStorage.setItem('img_id', t_item_id);

        var curr_state = $("#vdo_main_" + t_new_id + "").attr('name');
        if (curr_state == '0') {

            var queue_count = 0;
            var vdo_main_Array = $("[id^='vdo_main_']");
            for (v = 0; v < vdo_main_Array.length; v++) {
                var id = vdo_main_Array[v].id;
                var name = $("#" + id + "").attr('name');
                if (name == '1') {
                    queue_count++;
                    break;
                }
            }
            if (queue_count > 0) {
                alert1("Please wait...another downloading is under progress!");
            }
            else {
                // start download
                $("#vdo_main_" + t_new_id + "").css('width', '40px');
                $("#vdo_progress_" + t_new_id + "").show();
                $("#vdo_stop_img_" + t_new_id + "").show();
                $("#vdo_start_img_" + t_new_id + "").hide();
                $("#vdo_start_spn_" + t_new_id + "").hide();

                //var video_cont = document.getElementById('video_cont_' + t_new_id + '');
                //var player = video_cont.getElementsByTagName('video')[0];
                //var source = player.getElementsByTagName('source')[0];
                //player.poster = '/storage/emulated/0/video_easy/1482129927852.png';
                //source.src = "/storage/emulated/0/video_easy/20161216_200107_353508071028232.mp4";
                //player.load();
                //player.play();

                var vdo_obj = new MkVideoDownload(obj, function (e) { });
                vdo_obj.insert_video_download();
            }
        }
        else if (curr_state == '1') {
            // pause download
            if (F7_device == 'ios') {
                var user_choice = true;
            }
            else {
                vibrate_device();
                var user_choice = confirm('Are you sure, you want to cancel this downloading?');
            }
            if (user_choice == true) {
                $('#vdo_prg_' + t_new_id + '').val(0);
                var vdo_obj = new MkVideoDownload(obj, function (e) { });
                vdo_obj.stop_video_download();
            }
        }
        else {
            // resume download
            $("#vdo_main_" + t_new_id + "").css('width', '40px');
            $('#vdo_prg_' + t_new_id + '').val(0);
            $("#vdo_progress_" + t_new_id + "").show();
            $("#vdo_stop_img_" + t_new_id + "").show();
            $("#vdo_start_img_" + t_new_id + "").hide();
            $("#vdo_start_spn_" + t_new_id + "").hide();

            var vdo_obj = new MkVideoDownload(obj, function (e) { });
            vdo_obj.start_video_download();
        }
    }
    catch (e) {
        alert1(e + '_toggle_video_download()');
    }
}

var MkVideoDownload = function (obj, onsuccess_vdo_down) {
    var new_id = obj.new_id;
    var video_path = obj.video_path;
    var thumb_path = obj.thumb_path;
    var video_size = obj.video_size;
    var video_que_id = obj.video_que_id;

    // Insert Video
    this.insert_video_download = function () {
        try {
            var date_s = new Date();
            var time = date_s.getTime();

            var company_id = JSON.parse(storage.getItem('company_id'));
            var user_id = JSON.parse(storage.getItem('user_id'));
            var siteid = JSON.parse(storage.getItem('siteid'));
            var p_name = company_id + "_" + user_id + "_" + siteid + "_" + time;

            var t_id = curr_survey_data["t_id"];
            var check_type = curr_survey_data["check_type"];

            var type22_img_que_id = storage.getItem('img_id_type22');
            var type22_popup = $('.popup-type22:visible');
            if (type22_popup.length > 0) {
                if (row_index_no == 0) {
                    var row_length = $('#tbl_row_data_' + type22_new_id + '').find('img[id^="btn_edit_td_"]').length;
                    var t_row_index_no = row_length + 1;
                }
                else {
                    var t_row_index_no = row_index_no;
                }
            }
            else {
                var type22_img_que_id = 0;
                var t_row_index_no = 0;
            }
            p_name = p_name + '_' + t_row_index_no;

            var query = "INSERT INTO download_video (tid, que_id, checksheetid, p_name, or_path, con_path, isdown_track, CompanyId, CustomerUniq, Ph_id, it_id, millisecond) VALUES('"
                + t_id
                + "', '"
                + video_que_id
                + "','"
                + check_type
                + "','"
                + p_name
                + "','"
                + video_path
                + "', '" + thumb_path + "', '0', '" + company_id + "', '" + siteid + "','"
                + type22_img_que_id + "', '" + t_row_index_no + "', '" + time + "');";
            //alert1(query);
            var q_jsonobj = [];
            q_jsonobj.push({
                data: query,
                q: "0",
                tid: ""
            });
            cordova.exec(onsuccess_insert_video_download, onfail_insert_video_download, 'SqlitePlugin', 'insertValuse', q_jsonobj);
        }
        catch (e) {
            alert1(e + '_insert_video_download()');
        }
    }
    function onsuccess_insert_video_download(e) {
        try {
            var vdo_obj = new MkVideoDownload(obj, function (e) { });
            vdo_obj.get_video_download_id();
            onsuccess_vdo_down(e);
        }
        catch (e) {
            alert1(e);
        }
    }
    function onfail_insert_video_download(e) {
        alert1(e + '_insert_video_download()');
    }

    // Get Last Inserted Video Id
    this.get_video_download_id = function () {
        try {
            var query = "select _id from download_video ORDER BY _id desc limit 1";
            var q_jsonobj = [];
            q_jsonobj.push({
                data: query,
                p: "1"
            });
            cordova.exec(onsuccess_get_video_download_id, onfail_get_video_download_id, 'SqlitePlugin', 'showValues', q_jsonobj);
        }
        catch (e) {
            alert1(e + '_get_video_download_id()');
        }
    }
    function onsuccess_get_video_download_id(e) {
        try {
            //alert1(e);
            var myArray = JSON.parse(e);
            if (myArray.length > 0) {
                var _id = myArray[0]._id;
                var param = [];
                param.push({
                    _id: _id,
                    download_id: ''
                })
                $('#vdo_hdn_' + new_id + '').val(JSON.stringify(param));
                var vdo_obj = new MkVideoDownload(obj, function (e) { });
                vdo_obj.start_video_download();
            }
            onsuccess_vdo_down(e);
        }
        catch (e) {
            alert1(e);
        }
    }
    function onfail_get_video_download_id(e) {
        alert1(e + '_onfail_get_video_download_id()');
    }

    // Start Video Download
    this.start_video_download = function () {
        try {
            var query = "select imei from Login_Master";
            var q_jsonobj = [];
            q_jsonobj.push({
                data: query,
                p: "8" // start video download
            });
            cordova.exec(onsuccess_start_video_download, onfail_start_video_download, 'SqlitePlugin', 'showValues', q_jsonobj);
        }
        catch (e) {
            alert1(e + '_start_video_download()');
        }
    }
    function onsuccess_start_video_download(e) {
        try {
            var curr_state = $("#vdo_main_" + new_id + "").attr('name');
            if (curr_state == 2) {
                setTimeout(function () {
                    $("#vdo_main_" + new_id + "").attr('name', '1');
                    var vdo_obj = new MkVideoDownload(obj, function (e) { });
                    vdo_obj.check_video_progress();
                }, 500);
            }
            else {
                $("#vdo_main_" + new_id + "").attr('name', '1');
                var vdo_obj = new MkVideoDownload(obj, function (e) { });
                vdo_obj.check_video_progress();
            }
            onsuccess_vdo_down(e);
        }
        catch (e) {
            alert1(e + '_onsuccess_start_video_download()');
        }
    }
    function onfail_start_video_download(e) {
        alert1(e + '_onfail_start_video_download()');
    }

    // Check Video Progess
    this.check_video_progress = function () {
        try {
            var param = JSON.parse($('#vdo_hdn_' + new_id + '').val());
            var _id = param[0]._id;
            // var vdo_down_id = 2;
            var query = "select progress, or_path, con_path, download_id from download_video where _id= '" + _id + "'";
            // alert1(query);
            var q_jsonobj = [];
            q_jsonobj.push({
                data: query,
                p: "1"
            });
            cordova.exec(onsuccess_check_video_progress, onfail_check_video_progress, 'SqlitePlugin', 'showValues', q_jsonobj);
        }
        catch (e) {
            alert1(e + '_check_video_progress()');
        }
    }
    function onsuccess_check_video_progress(e) {
        try {
            var myArray = JSON.parse(e);
            //alert1(JSON.stringify(myArray));
            if (myArray.length > 0) {
                var progress = myArray[0].progress;
                if (progress == '' || progress == null || progress == undefined || progress == 'Unknown') {
                    progress = 0;
                }
                $('#vdo_prg_' + new_id + '').val(progress);

                if (progress > 0) {
                    var download_id = myArray[0].download_id;
                    var param = JSON.parse($('#vdo_hdn_' + new_id + '').val());
                    param[0].download_id = download_id;
                    $('#vdo_hdn_' + new_id + '').val(JSON.stringify(param));
                }

                if (progress == 100) {
                    var video_path = myArray[0].or_path;
                    var thumb_path = myArray[0].con_path;
                    $('#vdo_progress_' + new_id + '').hide();
                    $("#vdo_main_" + new_id + "").attr('name', '2');
                    $('#vdo_main_' + new_id + '').parent('div').hide();

                    var video_size = '';
                    var img_id = localStorage.getItem('img_id');
                    var answer = [];
                    answer.push(video_path, thumb_path, video_size);

                    var curr_form_flag = form_flag;
                    if (curr_form_flag == 0 || curr_form_flag == 6 || curr_form_flag == 7) {
                        let task_create_popup = $('.popup-new-task-create.modal-in:visible');
                        if (task_create_popup.length > 0) {
                            //new task create popup [FT-08052025]
                            jsonObj_task_add[img_id].ans = answer;
                        }
                        else {
                            // normal form
                            jsonObj_old[img_id].ans = answer;
                        }
                    } else if (curr_form_flag == 1 || curr_form_flag == 4 || curr_form_flag == 5) {
                        // type22 form
                        jsonObj_type22[img_id].ans = answer;
                    } else if (curr_form_flag == 2 || curr_form_flag == 3) {
                        // type23 form
                        jsonObj_type23[img_id].ans = answer;
                    }

                    var video_cont = document.getElementById('video_cont_' + new_id + '');
                    var player = video_cont.getElementsByTagName('video')[0];
                    var source = player.getElementsByTagName('source')[0];
                    player.poster = thumb_path;

                    if (F7_device == 'ios') {
                        //====photo thumbnail issue for iOS after cordove plugin updation [03062024]
                        var iosDirectoryPath = localStorage.getItem('iosDirectoryPath');
                        var localFile = iosDirectoryPath + video_path;
                        var video_path_ios = window.WkWebView.convertFilePath(localFile);

                        source.src = video_path_ios;
                    }
                    else {
                        source.src = video_path;
                    }

                    player.load();
                    player.play();
                }
                else {
                    var curr_state = $("#vdo_main_" + new_id + "").attr('name');
                    if (curr_state == 1) {
                        setTimeout(function () {
                            var vdo_obj = new MkVideoDownload(obj, function (e) { });
                            vdo_obj.check_video_progress();
                        }, 500);
                    }
                }
            }
            onsuccess_vdo_down(e);
        }
        catch (e) {
            alert1(e + '_onsuccess_check_video_progress()');
        }
    }
    function onfail_check_video_progress(e) {
        alert1(e + '_check_video_progress()');
    }

    // Stop Video
    this.stop_video_download = function () {
        try {
            var param = JSON.parse($('#vdo_hdn_' + new_id + '').val());
            var download_id = param[0].download_id;
            var query = "select _id from download_video";
            var q_jsonobj = [];
            q_jsonobj.push({
                data: query,
                p: "7",   // stop video download
                downloadid: download_id
            });
            cordova.exec(onsuccess_stop_video_download, onfail_stop_video_download, 'SqlitePlugin', 'showValues', q_jsonobj);
        }
        catch (e) {
            alert1(e + '_stop_video_download()');
        }
    }
    function onsuccess_stop_video_download(e) {
        try {
            $("#vdo_main_" + new_id + "").attr('name', '2');
            $("#vdo_main_" + new_id + "").css('width', '110px');
            $('#vdo_progress_' + new_id + '').hide();
            $("#vdo_stop_img_" + new_id + "").hide();
            $("#vdo_start_img_" + new_id + "").show();
            setTimeout(function () {
                $("#vdo_start_spn_" + new_id + "").show();
            }, 100);

            onsuccess_vdo_down(e);
        }
        catch (e) {
            alert1(e + '_onsuccess_stop_video_download()');
        }
    }
    function onfail_stop_video_download(e) {
        alert1(e + '_onfail_stop_video_download()');
    }

};

var g_form_flag;
function capture_video_n_upload_live(item_id, que_id, img_div, form_flag_t) {
    try {
        g_form_flag = form_flag_t;
        storage.setItem('img_id', JSON.stringify(item_id));
        storage.setItem('img_que_id', JSON.stringify(que_id));
        storage.setItem('img_div_id', JSON.stringify(img_div));
        storage.setItem('camera_type', JSON.stringify('28'));

        var company_id = JSON.parse(storage.getItem('company_id'));
        //var siteid = JSON.parse(storage.getItem('siteid'));
        //if (siteid == '' || siteid == null || siteid == undefined) {
        //    siteid = '0';
        //}
        var siteid = '0';

        if (form_flag == 6) {
            var check_type = JSON.parse(storage.getItem('check_type_task'));
        }
        else {
            var check_type = localStorage.getItem('check_type_customer');
        }

        if (check_type == '' || check_type == null || check_type == undefined) {
            check_type = curr_survey_data["check_type"]
        }

        var type22_popup = $('.popup-type22:visible');
        if (type22_popup.length > 0) {
            var type22_img_que_id = storage.getItem('img_id_type22');
            if (type22_edit_flag == '1') {
                // edit mode
                var t_row_index_no = row_index_no;
            }
            else {
                //  insert mode
                var row_counter = $("#hdn_inv_row_counter_" + type22_new_id + "").val();
                row_counter = parseInt(row_counter);
                var t_row_index_no = row_counter + 1;
            }
        }
        else {
            var type22_img_que_id = 0;
            var t_row_index_no = 0;
        }

        var step = curr_survey_data["step"];
        if (step == '' || step == null || step == undefined) {
            step = '1';
        }

        var task_mode = localStorage.getItem('task_mode');
        if (task_mode == "edit") {
            var sid = JSON.parse(storage.getItem('server_task_id'));
        }
        else {
            var sid = '0';
        }

        var flowParamData = [];
        flowParamData.push({
            company_id: company_id,
            site_id: siteid,
            sid: sid,
            que_id: que_id,
            checksheetid: check_type,
            step_No: step,
            Ph_id: type22_img_que_id,
            th_path: '',
            size: '',
            type: '',
            it_id: t_row_index_no
        });

        var query = "select imei from Login_Master";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "1",
            photo_type: "video",
            flowParamData: flowParamData
        });
        //alert1('q_jsonobj: ' + JSON.stringify(q_jsonobj));

        loading();
        cordova.exec(onsuccess_capture_video_n_upload_live, onfail_capture_video_n_upload_live, 'UploadPhotoPlugin', 'anAction', q_jsonobj);
    }
    catch (e) {
        alert1(e + '_capture_video_n_upload_live');
    }
}

function onsuccess_capture_video_n_upload_live(e) {
    try {
        loading_hide();

        var response = JSON.parse(e);
        var photo_id = response[0].photo_id;
        var photo_id = response[0].photo_id;
        var curr_file_size_mb = response[0].photo_size;

        var video_path_json = response[0].photo_path;
        video_path_json = JSON.parse(video_path_json);
        var thumb_path = video_path_json[0].th_path;
        var video_path = video_path_json[0].video_path;
        var video_size = video_path_json[0].video_size;

        curr_survey_data["video_path"] = video_path;
        curr_survey_data["video_size"] = video_size;
        curr_survey_data["thumb_path"] = thumb_path;

        if (photo_id == '' || photo_id == null || photo_id == undefined) { }
        else {
            Photo_Id_Array.push({ "photo_id": photo_id });
        }

        var curr_img_div_id = JSON.parse(storage.getItem('img_div_id'));
        var smallImage = document.getElementById(curr_img_div_id);
        smallImage.src = 'images/edit_collapse.png';
        smallImage.style.cssFloat = 'right';
        smallImage.style.width = '20px';
        smallImage.style.height = '20px';
        smallImage.style.padding = '2px';
        smallImage.style.border = '1px solid gray';
        smallImage.style.borderRadius = '0';

        var new_id = curr_img_div_id.toString().replace('video_', '');
        $("#div_video_" + new_id + "").css("position", "relative");
        $(smallImage).css({
            "position": "absolute",
            "top": "-20px",
            "right": "5px",
        })

        var is_vdo_avail = $("#vdo_autoply_" + new_id).length;
        if (is_vdo_avail > 0) {
            $("#vdo_autoply_" + new_id).remove();
        }

        var vdo_div = $('#' + curr_img_div_id + '').parent().find('div').attr("id");
        document.getElementById(vdo_div).innerHTML = '<video autoplay controls id="vdo_autoply_' + new_id + '" poster="' + thumb_path + '" style="margin-top:5px; height: 300px; width: 100%"><source src="' + video_path + '" type="video/mp4"></video>';


        //$("#vdo_autoply_" + new_id + "").show();
        //$("#vdo_autoply_" + new_id + "").attr("poster", thumb_path);
        //$("#vdo_autoply_" + new_id + " source").attr("src", video_path);
        //$("#vdo_autoply_" + new_id + "").load();
        ////$("#vdo_autoply_" + new_id + "")[0].autoplay = true;

        $("#vdo_progress_" + new_id + "").hide();
        $("#vdo_stop_img_" + new_id + "").hide();
        $("#vdo_start_img_" + new_id + "").hide();
        $("#vdo_start_spn_" + new_id + "").hide();
        $("#vdo_main_" + new_id + "").hide();

        var date_s = new Date();
        var time = date_s.getTime();
        var company_id = JSON.parse(storage.getItem('company_id'));
        var user_id = JSON.parse(storage.getItem('user_id'));

        //if (g_form_flag == 6) {
        //    var siteid = JSON.parse(storage.getItem('siteid'));
        //    if (siteid == '' || siteid == null || siteid == undefined) {
        //        siteid = '0';
        //    }
        //}
        //else {
        //    var siteid = 0;
        //}
        var siteid = 0;

        var type22_popup = $('.popup-type22:visible');
        if (type22_popup.length > 0) {
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
            var t_row_index_no = 0;
        }

        //var p_name = company_id + "_" + user_id + "_" + siteid + "_" + time + '_' + t_row_index_no;
        //var answer = [];
        //answer.push(p_name, p_name, '', '', photo_id, curr_file_size_mb);

        var answer = [];
        answer.push(video_path, thumb_path, video_size, "", photo_id);

        var img_id = JSON.parse(storage.getItem('img_id'));

        if (g_form_flag == 0 || g_form_flag == 6) {
            let task_create_popup = $('.popup-new-task-create.modal-in:visible');
            if (task_create_popup.length > 0) {
                //new task create popup [FT-08052025]
                jsonObj_task_add[img_id].ans = answer;
            }
            else {
                // normal form
                jsonObj_old[img_id].ans = answer;
            }
        } else if (g_form_flag == 1 || g_form_flag == 4 || g_form_flag == 5) {
            // type22 form
            jsonObj_type22[img_id].ans = answer;
        } else if (g_form_flag == 2 || g_form_flag == 3) {
            // type23 form
            jsonObj_type23[img_id].ans = answer;
        }
        else if (g_form_flag == 7) {
            // new customer form
            jsonObj_cust_add[img_id].ans = answer;
        }
    }
    catch (e) {
        loading_hide();
        alert1(e + '_onsuccess_capture_video_n_upload_live');
    }
}

function onfail_capture_video_n_upload_live(e) {
    loading_hide();
}

preview_video = (video_src) => {
    myApp.popup('.popup-preview-video');
    $('#preview_video_src').attr('src', video_src);
}