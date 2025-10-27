// call on capture button
function CaptureClick(item_id, que_id, img_div, form_flag_temp, photo_type, img_latlong, width, height, quality, null_img, burstmode) {
    try {
        // storage.setItem('crash_status', JSON.stringify('1'));
        storage.setItem('img_id', JSON.stringify(item_id));
        storage.setItem('img_que_id', JSON.stringify(que_id));
        storage.setItem('img_div_id', JSON.stringify(img_div));
        storage.setItem('camera_type', JSON.stringify('7'));
        storage.setItem('photo_type', JSON.stringify(photo_type));
        storage.setItem('img_latlong', JSON.stringify(img_latlong));
        storage.setItem('img_width', JSON.stringify(width));
        storage.setItem('img_height', JSON.stringify(height));
        storage.setItem('img_quality', JSON.stringify(quality));
        storage.setItem('img_burstmode', JSON.stringify(burstmode));
        glob_curr_form_flag = form_flag_temp;

        var hdn_cam_ary = $("#hdn_" + img_div + "").val();
        hdn_cam_ary = decodeURIComponent(hdn_cam_ary);
        hdn_cam_ary = JSON.parse(hdn_cam_ary);
        var scan_mode = hdn_cam_ary[0].scan_mode;
        storage.setItem('img_scan_mode', JSON.stringify(scan_mode));

        if (photo_type == "camera_with_reading") {
            $("#popover_camera_with_reading").show();
        }
        else {
            $("#popover_camera_with_reading").hide();
        }

        if (photo_type == "metercrop") {
            $("#popover_metercrop").show();
        }
        else {
            $("#popover_metercrop").hide();
        }

        if (photo_type == "EntityDetection") {
            $("#popover_EntityDetection").show();
        }
        else {
            $("#popover_EntityDetection").hide();
        }

        if (photo_type == "AI") {
            $("#popover_AI").show();
        }
        else {
            $("#popover_AI").hide();
        }

        //  loading();
        var full_image_display = $("#popup_outer_div_type7").css("display");
        full_image_display = 'none';
        myApp.closeModal('.popover-type7');
        var src = $("#" + img_div + "").attr("src");
        if (null_img == 1 || null_img == 2 || (null_img == 0 && full_image_display == 'none' && src != 'images/camera.png')) {
            $('#light1_login').hide();
            $('#fade1_login').hide();
            loading_hide();

            // captured image exist
            if (curr_form_flag == 0 || curr_form_flag == 1 || curr_form_flag == 4 || curr_form_flag == 5) {
                curr_clps_new_id = 0;
            }

            $("#div_bottom_div_type7").css("height", "0%");
            $("#div_bottom_div_type7").empty();
            $("#popup_outer_div_type7").show();
            $("#popup_inner_div_type7").show();

            var param = "CaptureClick('" + item_id + "', '" + que_id + "', '" + img_div + "','" + form_flag_temp + "','" + photo_type
                + "','" + img_latlong + "','" + width + "','" + height + "','" + quality + "','3','" + burstmode + "')";

            var clickedLink = $("#" + img_div + "");
            myApp.popover('.popover-type7', clickedLink);
            $("#popover_viewphoto").attr("onclick", "get_full_view_image_type7_F7('" + src + "')");
            $("#popover_re_capture").attr("onclick", param);

            var old_photo_type = $("#" + img_div + "").attr('old_photo_type');
            if (null_img == 2 || old_photo_type == "original_photo") {
                // readonly image (in collapsible step)
                $("#popover_re_capture").parent().hide();
            }
            else {
                $("#popover_re_capture").parent().show();
            }
        } else {
            // re-captured/ image not exist
            storage.setItem('crash_status', JSON.stringify('1'));
            curr_btn_mode = "save";

            var curr_form_flag = form_flag_temp;
            if (curr_form_flag == 0) {
                // normal form
                curr_clps_new_id = 0;
                localStorage.setItem('cam_flag', 'normal');
                validate_and_submit_surveydata_main('', 5, jsonObj_old);
            } else if (curr_form_flag == 1 || curr_form_flag == 4 || curr_form_flag == 5) {
                // type22 form
                curr_clps_new_id = 0;
                validate_and_submit_surveydata_main('', 5, jsonObj_type22);
            } else if (curr_form_flag == 2 || curr_form_flag == 3) {
                // type23 form
                validate_and_submit_surveydata_main('', 5, jsonObj_type23);
            } else if (curr_form_flag == 6) {
                // task form
                curr_clps_new_id = 0;
                storage.setItem('crash_status', JSON.stringify('6'));
                localStorage.setItem('cam_flag', 'task');

                let task_create_popup = $('.popup-new-task-create.modal-in:visible');
                if (task_create_popup.length > 0) {
                    //new task create popup [FT-08052025]
                    validate_and_submit_surveydata_main('', 5, jsonObj_task_add);
                }
                else {
                    validate_and_submit_surveydata_main('', 5, jsonObj_old);
                }
            } else if (curr_form_flag == 7) {
                // customer form
                curr_clps_new_id = 0;
                localStorage.setItem('cam_flag', 'normal');
                validate_and_submit_surveydata_main('', 7, jsonObj_cust_add);
            } else if (curr_form_flag == 12) {
                // group task logic
                curr_clps_new_id = 0;
                capture_Photo();
            } else if (curr_form_flag == 8) {
                // user form
                curr_clps_new_id = 0;
                localStorage.setItem('cam_flag', 'user');
                validate_and_submit_surveydata_main('', 8, jsonObj_user_add);
            }
        }
    } catch (e) {
        alert1(e + '_CaptureClick()');
        loading_hide();
    }
}

// Open camera and take picture using device camera
function capture_Photo() {
    try {
        //loading();
        $("#img_full_type7").attr("src", "");
        $("#div_bottom_div_type7").empty();
        $("#popup_outer_div_type7").hide();
        $("#popup_inner_div_type7").hide();

        var date_s = new Date();
        var time = date_s.getTime();
        var photo_type = JSON.parse(storage.getItem('photo_type'));
        var img_latlong = JSON.parse(storage.getItem('img_latlong'));
        var img_width = JSON.parse(storage.getItem('img_width'));
        var img_height = JSON.parse(storage.getItem('img_height'));
        var img_quality = JSON.parse(storage.getItem('img_quality'));
        var img_burstmode = JSON.parse(storage.getItem('img_burstmode'));

        var camera_type = localStorage.getItem('Camera_Type');
        var camera_edit = localStorage.getItem('Camera_Edit');

        var img_div = JSON.parse(storage.getItem('img_div_id'));
        var hdn_cam_ary = $("#hdn_" + img_div + "").val();
        hdn_cam_ary = decodeURIComponent(hdn_cam_ary);
        hdn_cam_ary = JSON.parse(hdn_cam_ary);
        var max_file_size = hdn_cam_ary[0].max_file_size;
        var model_name = hdn_cam_ary[0].model_name;
        var prompt_text = hdn_cam_ary[0].prompt_text;
        var prompt_text_array = hdn_cam_ary[0].prompt_text_array;
        if (prompt_text_array.length > 0) {
            let combined_prompt_text = '';
            let combined_ans_text = ''
            for (let p = 0; p < prompt_text_array.length; p++) {
                let classname = prompt_text_array[p].classname;         // it combination of Q + que_id e.g. Q13
                let prompt = prompt_text_array[p].prompt;

                combined_prompt_text += classname + ' : ' + prompt + ' ';

                if (p == prompt_text_array.length) {
                    combined_ans_text += classname + ' : "Your Answer"';
                }
                else {
                    combined_ans_text += classname + ' : "Your Answer,"';
                }
            }

            combined_prompt_text += 'Give Response in Json : ' + combined_ans_text;

            prompt_text = combined_prompt_text;
        }



        // var photo_type = "browse";
        // var img_latlong = "true";
        //var photo_type = "both";

        if (photo_type == "metercrop") {
            var metercrop = "true";
            var img_scan_mode = JSON.parse(storage.getItem('img_scan_mode'));
        }
        else {
            var metercrop = "false";
            var img_scan_mode = "false";
        }

        var check_type = curr_survey_data["check_type"];
        var img_que_id = JSON.parse(storage.getItem('img_que_id'));
        var server_task_id = JSON.parse(storage.getItem('server_task_id'));

        // add system variable in value in camera photo 07042023      
        var info_arry = [];
        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var default_columndata = list_data[0].columndata;
        var d_len = default_columndata.length;
        for (d = 0; d < d_len; d++) {

            var get_dis_camera_key = default_columndata[d].dis_in_cam_photo;
            if (get_dis_camera_key == "" || get_dis_camera_key == null || get_dis_camera_key == undefined) { }
            else {
                if (get_dis_camera_key == "true") {
                    var key_name = default_columndata[d].header;
                    var key_val = curr_all_data_20[key_name];
                    var key_str = key_name + ': ' + key_val;
                    info_arry.push(key_str)
                }
            }
        }

        var query = "select imei from Login_Master";
        var q_jsonobj = [];
        if (photo_type == "camera" || photo_type == "metercrop") {
            q_jsonobj.push({
                data: query,
                p: "1",
                time: time,
                flag: img_latlong,
                width: img_width,
                height: img_height,
                quality: img_quality,
                burstmode: img_burstmode,
                metercrop: metercrop,
                scan_mode: img_scan_mode,
                camera_type: camera_type,
                camera_edit: camera_edit,
                questionID: img_que_id,
                checksheetID: check_type,
                serverTaskId: server_task_id,
                info: info_arry,
                max_file_size: max_file_size,
                model_name: model_name,
                prompt_text: prompt_text
            });
        }
        else {
            q_jsonobj.push({
                data: query,
                p: "1",
                time: time,
                flag: img_latlong,
                width: img_width,
                height: img_height,
                quality: img_quality,
                burstmode: img_burstmode,
                metercrop: metercrop,
                scan_mode: img_scan_mode,
                camera_type: camera_type,
                camera_edit: camera_edit,
                info: info_arry,
                max_file_size: max_file_size,
                model_name: model_name,
                prompt_text: prompt_text
            });
        }

        if (photo_type == "camera" || photo_type == "metercrop") {
            loading();
            cordova.exec(check_photo_entry, onfail_cam, 'camera_new', 'anAction', q_jsonobj);
        }
        else if (photo_type == "browse") {
            loading();
            cordova.exec(check_photo_entry, onfail_cam, 'large_photo', 'anAction', q_jsonobj);
        }
        else if (photo_type == "SafetyMeasure") {
            loading();
            cordova.exec(onsuccess_SafetyMeasure, onfail_SafetyMeasure, 'SafetyMeasurePlugin', 'anAction', q_jsonobj);
        }
        else if (photo_type == "camera_with_reading") {
            loading();
            cordova.exec(check_photo_entry_with_reading, onfail_cam, 'MeterReadingPlugin', 'anAction', q_jsonobj);
        }
        else if (photo_type == "EntityDetection") {
            loading();
            cordova.exec(check_photo_entry_with_reading, onfail_cam, 'EntityDetection', 'anAction', q_jsonobj);
        }
        else if (photo_type == "AI") {
            loading();
            cordova.exec(check_photo_entry_with_reading, onfail_cam, 'CameraAITextPlugin', 'anAction', q_jsonobj);
        }
        else {
            // both (user select)
            //   setTimeout(function () {
            var param = "camera_user_choice('camera', '" + JSON.stringify(q_jsonobj) + "')";
            var param1 = "camera_user_choice('browse', '" + JSON.stringify(q_jsonobj) + "')";
            var param2 = "camera_user_choice('camera_with_reading', '" + JSON.stringify(q_jsonobj) + "')";
            var param3 = "camera_user_choice('metercrop', '" + JSON.stringify(q_jsonobj) + "')";
            var param4 = "camera_user_choice('EntityDetection', '" + JSON.stringify(q_jsonobj) + "')";
            var param5 = "camera_user_choice('AI', '" + JSON.stringify(q_jsonobj) + "')";
            var img_div = JSON.parse(storage.getItem('img_div_id'));
            var clickedLink = $("#" + img_div + "");
            myApp.popover('.popover-type7-UserChoice', clickedLink);
            $("#popover_camera").attr("onclick", param);
            $("#popover_browse").attr("onclick", param1);
            $("#popover_camera_with_reading").attr("onclick", param2);
            $("#popover_metercrop").attr("onclick", param3);
            $("#popover_EntityDetection").attr("onclick", param4);
            $("#popover_AI").attr("onclick", param5);
            //   }, 300);
        }
    } catch (e) {
        alert1(e + '_capture_Photo()');
        loading_hide();
    }
}

function camera_user_choice(photo_type, t_q_jsonobj) {
    try {
        loading();
        var q_jsonobj = JSON.parse(t_q_jsonobj);
        if (photo_type == "camera" || photo_type == "metercrop") {
            cordova.exec(check_photo_entry, onfail_cam, 'camera_new', 'anAction', q_jsonobj);
        } else if (photo_type == "browse") {
            cordova.exec(check_photo_entry, onfail_cam, 'large_photo', 'anAction', q_jsonobj);
        } else if (photo_type == "camera_with_reading") {
            cordova.exec(check_photo_entry_with_reading, onfail_cam, 'MeterReadingPlugin', 'anAction', q_jsonobj);
        }
        else if (photo_type == "EntityDetection") {
            cordova.exec(check_photo_entry_with_reading, onfail_cam, 'EntityDetection', 'anAction', q_jsonobj);
        }
        else if (photo_type == "AI") {
            cordova.exec(check_photo_entry_with_reading, onfail_cam, 'CameraAITextPlugin', 'anAction', q_jsonobj);
        }
    }
    catch (e) {
        alert1(e + 'camera_user_choice()');
    }
}


function onsuccess_SafetyMeasure(e) {
    try {

        var myArray = JSON.parse(e);
        let imageData = myArray[0].photo_path;
        check_photo_entry(imageData);

        reset_SafetyMeasure_summary(e);
    }
    catch (e) {
        alert1(e + "_check_SafetyMeasure()");
        loading_hide();
    }
}

function reset_SafetyMeasure_summary(e) {
    try {

        var myArray = JSON.parse(e);
        let imageData = myArray[0].photo_path;
        check_photo_entry(imageData);

        let safety_str = "<div class='safety_summary' style='font-size: 14px; padding: 5px'>";

        let Helmet = myArray[0].Helmet;
        if (Helmet == "" || Helmet == null || Helmet == undefined) {
            Helmet = 0;
        }
        else {
            Helmet = parseFloat(Helmet);
        }

        let Harnessjacket = myArray[0].Harnessjacket;
        if (Harnessjacket == "" || Harnessjacket == null || Harnessjacket == undefined) {
            Harnessjacket = 0;
        }
        else {
            Harnessjacket = parseFloat(Harnessjacket);
        }

        let Reflectivejacket = myArray[0].Reflectivejacket;
        if (Reflectivejacket == "" || Reflectivejacket == null || Reflectivejacket == undefined) {
            Reflectivejacket = 0;
        }
        else {
            Reflectivejacket = parseFloat(Reflectivejacket);
        }

        let Safetyshoes = myArray[0].Safetyshoes;
        if (Safetyshoes == "" || Safetyshoes == null || Safetyshoes == undefined) {
            Safetyshoes = 0;
        }
        else {
            Safetyshoes = parseFloat(Safetyshoes);
        }

        let Handglows = myArray[0].Handglows;
        if (Handglows == "" || Handglows == null || Handglows == undefined) {
            Handglows = 0;
        }
        else {
            Handglows = parseFloat(Handglows);
        }

        if (Helmet >= 0.35) {
            safety_str += "<b>Helmet:</b> <span style='color:green'>Detected</span><br>";
        }
        else {
            safety_str += "<b>Helmet:</b> <span style='color:red'>Not Detected</span><br>";
        }

        if (Harnessjacket >= 0.35) {
            safety_str += "<b>Harness Jacket:</b> <span style='color:green'>Detected</span><br>";
        }
        else {
            safety_str += "<b>Harness Jacket:</b> <span style='color:red'>Not Detected</span><br>";
        }

        if (Reflectivejacket >= 0.35) {
            safety_str += "<b>Reflective Jacket:</b> <span style='color:green'>Detected</span><br>";
        }
        else {
            safety_str += "<b>Reflective Jacket:</b> <span style='color:red'>Not Detected</span><br>";
        }

        if (Safetyshoes >= 0.35) {
            safety_str += "<b>Safety Shoes:</b> <span style='color:green'>Detected</span><br>";
        }
        else {
            safety_str += "<b>Safety Shoes:</b> <span style='color:red'>Not Detected</span><br>";
        }

        if (Handglows >= 0.35) {
            safety_str += "<b>Hand Glows:</b> <span style='color:green'>Detected</span><br>";
        }
        else {
            safety_str += "<b>Hand Glows::</b> <span style='color:red'>Not Detected</span><br>";
        }

        safety_str += "</div>";

        let curr_img_div_id = JSON.parse(storage.getItem('img_div_id'));
        $("#" + curr_img_div_id + "").parent("div").find("div.safety_summary").remove();
        $("#" + curr_img_div_id + "").parent("div").append(safety_str);

    }
    catch (e) {
        alert1(e + "_check_SafetyMeasure()");
        loading_hide();
    }
}

function onfail_SafetyMeasure(e) {
    curr_btn_mode = "";
    close_full_view_image_type7();
    loading_hide();

    let curr_img_div_id = JSON.parse(storage.getItem('img_div_id'));
    $("#" + curr_img_div_id + "").parent("div").find("div.safety_summary").remove();
}

var curr_photo_id, curr_query_type;
// check photo for insert or update
function check_photo_entry(imageData) {
    try {
        curr_survey_data["img_path"] = imageData;

        var t_id = curr_survey_data["t_id"];
        var step = curr_survey_data["step"];
        var check_type = curr_survey_data["check_type"];
        var img_que_id = JSON.parse(storage.getItem('img_que_id'));

        var type22_popup = $('.popup-type22:visible');
        if (type22_popup.length > 0) {
            //$("#popover_viewphoto").parent().hide();

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

        var query = "select pid from p_master where tid = '" + t_id + "' and checksheetid = '" + check_type + "' and p_key = '" + step + "' and que_id = '" + img_que_id + "' and Ph_id = '" + type22_img_que_id + "' and it_id = '" + t_row_index_no + "'";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "0"
        });
        cordova.exec(onsuccess_check_photo_entry, onfail_check_photo_entry, 'SqlitePlugin', 'showValues', q_jsonobj);
    }
    catch (e) {
        alert1(e + '_check_photo_entry()');
    }
}

// camera with meter reading 07122020
function check_photo_entry_with_reading(e) {
    try {
        //----sample response--- e = '[{"path":"e:/abc","reading":"12434","photo_type":"EntityDetection"}]';
        var myArray = JSON.parse(e);
        var imageData = myArray[0].path;
        var reading = myArray[0].reading;
        var photo_type = myArray[0].photo_type;
        if (photo_type == "" || photo_type == null || photo_type == undefined) {
            photo_type = JSON.parse(storage.getItem('photo_type'));
        }
        curr_survey_data["photo_type"] = photo_type;

        if (photo_type == "AI") {

            imageData = myArray[0].photo_path;

            // autofill AI text to below textbox derived from image response - mk - 28072025
            var img_div = JSON.parse(storage.getItem('img_div_id'));
            var target_class = $("#" + img_div + "").attr('target_class');
            if (target_class == "" || target_class == null || target_class == undefined) { }
            else {
                let responsetext = myArray[0].responsetext;
                responsetext = responsetext.substring(0, 500);    // truncate string to 500 char

                let where_box_id = $("." + target_class + " :input").attr("id");
                let tagName = $("#" + where_box_id + "").prop("tagName");
                if (tagName == "TEXTAREA") {
                    $("#" + where_box_id + "").val(responsetext);
                }
                else {
                    // textbox found hence convert it to textarea run time - mk - 26072025
                    let $input = $("#" + where_box_id + "");
                    let $textarea = '<textarea cols="20" rows="2" class="form-ele" id="' + where_box_id + '" onkeydown="ResizeBox(event)" value=\'' + responsetext + '\' style="resize:vertical !important; width: 100% !important;" disabled="disabled">' + responsetext + '</textarea>';
                    $input.replaceWith($textarea);

                    let t_textarea = document.getElementById(where_box_id);
                    t_textarea.style.height = t_textarea.scrollHeight + "px";
                }
            }
        }

        var img_div = JSON.parse(storage.getItem('img_div_id'));
        var target_class = $("#" + img_div + "").attr('target_class');
        if (target_class == "" || target_class == null || target_class == undefined) { }
        else {
            var where_box_id = $("." + target_class + " :input[type=number]").attr("id");
            $("#" + where_box_id + "").val(reading);

            // check for type30 event
            var onfocusouot_event = $("#" + where_box_id + "").attr('onfocusout');
            if (onfocusouot_event == '' || onfocusouot_event == null || onfocusouot_event == undefined) { }
            else {
                $("#" + where_box_id + "").focus();
                $("#" + where_box_id + "").blur();
            }
        }

        if (photo_type == "EntityDetection") {
            curr_survey_data["img_path"] = e;
        }
        else {
            curr_survey_data["img_path"] = imageData;
        }

        var t_id = curr_survey_data["t_id"];
        var step = curr_survey_data["step"];
        var check_type = curr_survey_data["check_type"];
        var img_que_id = JSON.parse(storage.getItem('img_que_id'));


        var type22_popup = $('.popup-type22:visible');
        if (type22_popup.length > 0) {
            //$("#popover_viewphoto").parent().hide();

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

        var query = "select pid from p_master where tid = '" + t_id + "' and checksheetid = '" + check_type + "' and p_key = '" + step + "' and que_id = '" + img_que_id + "' and Ph_id = '" + type22_img_que_id + "' and it_id = '" + t_row_index_no + "'";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "0"
        });
        cordova.exec(onsuccess_check_photo_entry, onfail_check_photo_entry, 'SqlitePlugin', 'showValues', q_jsonobj);
    }
    catch (e) {
        alert1(e + '_check_photo_entry_with_reading()');
    }
}

function onsuccess_check_photo_entry(e) {
    curr_photo_id = e;
    curr_query_type = 'update';
    onPhotoDataSuccess();
}

function onfail_check_photo_entry(e) {
    curr_query_type = 'insert';
    onPhotoDataSuccess();
}

// Get base64 of photo captured by device successfully
function onPhotoDataSuccess() {
    try {
        var curr_form_flag = form_flag;
        form_has_changed = "true";                      //to get confirmation on back btn while editing form

        // display cropped and original photo 03022021
        var e = curr_survey_data["img_path"];

        var t_photo_type = JSON.parse(storage.getItem('photo_type'));
        var scan_mode = JSON.parse(storage.getItem('img_scan_mode'));
        var detected_text = '', selected_text = '', input_type = '';
        if (t_photo_type == "metercrop") {
            var myArray = JSON.parse(e);
            var imageData = myArray[0].crop_photo;
            if (scan_mode == "true") {
                detected_text = myArray[0].detected_text;
                selected_text = myArray[0].selected_text;
                input_type = myArray[0].input_type;


                // auto fill reading to the numeric box provided by native 23032021
                var img_div = JSON.parse(storage.getItem('img_div_id'));
                var target_class = $("#" + img_div + "").attr('target_class');
                if (target_class == "" || target_class == null || target_class == undefined) { }
                else {
                    var where_box_id = $("." + target_class + " :input[type=number]").attr("id");
                    $("#" + where_box_id + "").val(selected_text);

                    // check for type30 event
                    var onfocusouot_event = $("#" + where_box_id + "").attr('onfocusout');
                    if (onfocusouot_event == '' || onfocusouot_event == null || onfocusouot_event == undefined) { }
                    else {
                        $("#" + where_box_id + "").focus();
                        $("#" + where_box_id + "").blur();
                    }
                }

                // make blank if taken photo value in type30 numeric where (OCR) - 29122021
                var trigger_id = $("#" + img_div + "").attr('trigger_id');
                if (trigger_id == "" || trigger_id == null || trigger_id == undefined) { }
                else {
                    $(trigger_id).val('');
                }

                // display selected text besides photo 13122021
                $("#" + img_div + "").attr('detected_text', detected_text);
                $("#" + img_div + "").parent('div').find('.lbl_type5').remove();
                var selected_str = '<label class="lbl_type5 blink_me" style="display: inline; left: 60px; font-size: 13px; position: absolute;"><b>Reading: </b>' + selected_text + '</label>';
                $("#" + img_div + "").parent('div').append(selected_str);
                setTimeout(function () {
                    $("#" + img_div + "").parent('div').find(".blink_me").removeClass("blink_me");
                }, 5000);

            }
        }
        else if (t_photo_type == "EntityDetection") {
            var myArray = JSON.parse(e);
            var imageData = myArray[0].path;
            selected_text = myArray[0].reading;

            // auto fill reading to the numeric box provided by native [19082021]
            var img_div = JSON.parse(storage.getItem('img_div_id'));
            var target_class = $("#" + img_div + "").attr('target_class');
            if (target_class == "" || target_class == null || target_class == undefined) { }
            else {
                var where_box_id = $("." + target_class + " :input[type=number]").attr("id");
                $("#" + where_box_id + "").val(selected_text);
            }
        }
        else {
            var imageData = e;
        }

        var photo_type = curr_survey_data["photo_type"];
        if (photo_type == "" || photo_type == null || photo_type == undefined) {
            photo_type = "";
        }

        var curr_img_div_id = JSON.parse(storage.getItem('img_div_id'));
        var smallImage = document.getElementById(curr_img_div_id);

        if (F7_device == 'ios') {
            //====photo thumbnail issue for iOS after cordove plugin updation [23092021]
            var iosDirectoryPath = localStorage.getItem('iosDirectoryPath');
            var localFile = iosDirectoryPath + imageData;
            var imageData_ios = window.WkWebView.convertFilePath(localFile);

            smallImage.src = imageData_ios;
        }
        else {
            smallImage.src = imageData;
        }

        var img_id = JSON.parse(storage.getItem('img_id'));

        /* new logic */
        var date_s = new Date();
        var time = date_s.getTime();
        var company_id = JSON.parse(storage.getItem('company_id'));
        var user_id = JSON.parse(storage.getItem('user_id'));

        if (curr_form_flag == 7 || curr_form_flag == 8) {
            var siteid = 0;
        }
        else {
            var siteid = JSON.parse(storage.getItem('siteid'));
        }

        var p_name = company_id + "_" + user_id + "_" + siteid + "_" + time;

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
        p_name = p_name + '_' + t_row_index_no;

        storage.setItem('p_name', JSON.stringify(p_name));

        var answer = [];
        if (scan_mode == "true") {
            if (input_type == 'auto') {
                input_type = 1;
            }
            else if (input_type == 'LimitReached') {
                input_type = 2;
            }
            else {
                input_type = 0;
            }
            answer.push(imageData.toString(), p_name, '', '', '', '', photo_type, detected_text, selected_text, input_type);
        }
        else {
            answer.push(imageData.toString(), p_name, '', '', '', '', photo_type);
        }

        var img_div = JSON.parse(storage.getItem('img_div_id'));
        var hdn_ans_id = img_div.replace('cbtn_', '');

        if (curr_form_flag == 0 || curr_form_flag == 6 || curr_form_flag == 7) {
            let task_create_popup = $('.popup-new-task-create.modal-in:visible');
            if (task_create_popup.length > 0) {
                //new task create popup [FT-08052025]
                jsonObj_task_add[img_id].ans = answer;
            }
            else {
                // normal form // customer form
                jsonObj_old[img_id].ans = answer;
            }
        } else if (curr_form_flag == 1 || curr_form_flag == 4 || curr_form_flag == 5) {
            // type22 form
            jsonObj_type22[img_id].ans = answer;
        } else if (curr_form_flag == 2 || curr_form_flag == 3) {
            // type23 form
            jsonObj_type23[img_id].ans = answer;
        } else if (curr_form_flag == 12) {
            //group task
            var hdn_ans_str = JSON.stringify(answer);
            hdn_ans_str = encodeURIComponent(hdn_ans_str);
            $("#hdn_cbtn_ans_" + hdn_ans_id + "").val(hdn_ans_str);
        } else if (curr_form_flag == 8) {
            // user form
            jsonObj_user_add[img_id].ans = answer;
        }

        var query = "select imei from Login_Master";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "1"
        });
        cordova.exec(showValuesSuccessCallBack_AS, showValuesFailCallBack_AS, 'SqlitePlugin', 'showValues', q_jsonobj);
    } catch (e) {
        storage.setItem('crash_status', JSON.stringify('0'));
        curr_btn_mode = "";
        show_save_label();
        loading_hide();
    }
}

function showValuesSuccessCallBack_AS(e) {
    try {
        var myArray = JSON.parse(e);
        var IMEI_No = myArray[0].imei;
        var date_s = new Date();
        var time = date_s.getTime();

        var p_name = JSON.parse(storage.getItem('p_name'));
        var t_id = curr_survey_data["t_id"];
        var img_que_id = JSON.parse(storage.getItem('img_que_id'));
        var img_path = curr_survey_data["img_path"];
        if (img_path.indexOf("crop_photo") > -1) {
            img_path = JSON.parse(img_path);
            if (Array.isArray(img_path)) {                              //changes for delete log media issue in ATC [15022021]
                var img_path_ary = img_path;
                var t_img_path = img_path_ary[0].crop_photo;
                img_path = t_img_path
            }
        }

        var img_id = JSON.parse(storage.getItem('img_id'));
        var check_type = curr_survey_data["check_type"];

        var type22_popup = $('.popup-type22:visible');
        if (type22_popup.length > 0) {
            //$("#popover_viewphoto").parent().hide();

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

        var step = curr_survey_data["step"];
        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var match_temp_id = list_data[0].match_temp_id;
        if (match_temp_id == "" || match_temp_id == null || match_temp_id == undefined) {
            match_temp_id = "";
        }

        var img_div = JSON.parse(storage.getItem('img_div_id'));
        var prop_name = $("#" + img_div + "").attr('name');

        if (curr_query_type == 'insert') {
            var query = "INSERT INTO p_master (tid, que_id, checksheetid, p_name, p_url, p_key, p_value ,p_type, flag, Ph_id, it_id, millisecond, match_temp_id, que_name) VALUES('"
                + t_id + "','" + img_que_id + "','" + check_type + "','" + p_name + "','" + img_path + "','" + step + "','image','image/jpg','0','"
                + type22_img_que_id + "', '" + t_row_index_no + "', '" + time + "', '" + match_temp_id + "', '" + prop_name + "');";
        }
        else {
            var query = "update p_master set p_url='" + img_path + "', p_name='" + p_name + "', millisecond='" + time + "', flag='0' where pid='" + curr_photo_id + "'";
        }

        if (is_attendance_photo == 1) {
            // q = 6 (query execute + make task flag 1 + upload call)
            var q_jsonobj = [];
            q_jsonobj.push({
                data: query,
                q: "6",
                tid: t_id
            });
        }
        else {
            // normal photo
            var q_jsonobj = [];
            q_jsonobj.push({
                data: query,
                q: "0",
                tid: ""
            });
        }

        cordova.exec(insertValuesSuccessCallBack_PM, insertValuesFailCallBack_Photo, 'SqlitePlugin', 'insertValuse', q_jsonobj);
    } catch (e) {
        alert1(e + '_showValuesSuccessCallBack_AS()');
        loading_hide();
    }
}

function insertValuesSuccessCallBack_PM(e) {
    // alert1("Photo has been saved successfully !");

    is_attendance_photo = 0;

    // display cropped and original photo 03022021
    var t_photo_type = JSON.parse(storage.getItem('photo_type'));
    if (t_photo_type == "metercrop") {
        // cropped photo
        var img_div = JSON.parse(storage.getItem('img_div_id'));
        var old_photo_class = $("#" + img_div + "").attr('old_photo_class');
        if (old_photo_class == "" || old_photo_class == null || old_photo_class == undefined) {
            // cropped without old (original) photo
            storage.setItem('crash_status', JSON.stringify('0'));
            myApp.closeModal('.popover-type7-UserChoice');
            curr_btn_mode = "";
            loading_hide();
        }
        else {
            // cropped with old (original) photo
            var t_que_id = $("." + old_photo_class + "").find("img[id^=cbtn_]").attr("que_id");
            old_photo_que_id = t_que_id;
            check_photo_entry_old_photo();
        }
    }
    else {
        // normal inividual photo
        storage.setItem('crash_status', JSON.stringify('0'));
        myApp.closeModal('.popover-type7-UserChoice');
        curr_btn_mode = "";
        loading_hide();
    }
}

function showValuesFailCallBack_AS(e) {
    alert1(e + '_CapturePhoto_showValuesFailCallBack_AS()');
    loading_hide();
}

function onFail(e) {
    // user press cancel button after capturing photo
    // alert1(e + 'Photo Cancelled');
    storage.setItem('crash_status', JSON.stringify('0'));
    curr_btn_mode = "";
    close_full_view_image_type7();
    loading_hide();
}

function insertValuesFailCallBack_Photo(e) {
    alert1(e + '_insertValuesFailCallBack_Photo()');
    loading_hide();
}

//var Unavailable_Img_Array = [];
function bind_unavailable_images(ele_id, p_name, t_step, t_checksheet_id, t_que_id, t_typ22_que_id, t_row_index) {
    try {
        $("#" + ele_id + "").attr("src", "images/ajax-loader.gif");

        //Unavailable_Img_Array.push({
        //    'ele_id': ele_id,
        //    'p_name': p_name,
        //    'step': t_step,
        //    'checksheet_id': t_checksheet_id,
        //    'que_id': t_que_id,
        //    'typ22_que_id': t_typ22_que_id,
        //    'row_index': t_row_index
        //});

        var user_id = JSON.parse(storage.getItem('user_id'));
        var uniqcode = JSON.parse(storage.getItem('uniqcode'));
        //var server_task_id = JSON.parse(storage.getItem('server_task_id'));
        //var checksheet_type = "1";
        var resumable_url = JSON.parse(storage.getItem('global_resumable_url'));

        var primary_id = JSON.parse(localStorage.getItem('ID_useType22'));
        if (primary_id == "" || primary_id == null || primary_id == undefined) {
            primary_id = JSON.parse(storage.getItem('server_task_id'));
        }

        if (act_form_flag == 7) {
            var checksheet_type = "3";
        } else if (act_form_flag == 6) {
            var checksheet_type = "5";
        } else if (act_form_flag == 8) {
            var checksheet_type = "7";
            primary_id = user_id;
        }
        else {
            var checksheet_type = "1";
        }

        //var doc_path = "" + resumable_url + "/api/GetFile/Select_File_Details?cid=" + t_checksheet_id + "&t22id=" + t_typ22_que_id + "&t22i=" + t_row_index + "&id="
        //    + primary_id + "&qd=" + t_que_id + "&ctype=" + checksheet_type + "&ud=" + user_id + "&uc=" + uniqcode + "";
        var doc_path = "" + resumable_url + "GetFile/Select_File_Details?cid=" + t_checksheet_id + "&t22id=" + t_typ22_que_id + "&t22i=" + t_row_index + "&id="
            + primary_id + "&qd=" + t_que_id + "&ctype=" + checksheet_type + "&ud=" + user_id + "&uc=" + uniqcode + "";

        $("#" + ele_id + "").attr("onerror", "");                           //to restrict multiple call of onerror
        $("#" + ele_id + "").attr("src", doc_path);
    }
    catch (e) {
        alert1(e + '_bind_unavailable_images');
    }
}

function get_full_view_image_type7(img_div) {
    storage.setItem('crash_status', JSON.stringify('0'));
    $("#popup_outer_div_type7").show();
    $("#popup_inner_div_type7").show();
    var src = $("#" + img_div + "").attr('src');
    $("#img_full_type7").attr("src", src);
}

//function close_full_view_image_type7() {
//    storage.setItem('crash_status', JSON.stringify('0'));
//    $("#img_full_type7").attr("src", "");
//    $("#div_bottom_div_type7").empty();
//    $("#popup_outer_div_type7").hide();
//    $("#popup_inner_div_type7").hide();
//}


var myPhotoBrowser;
// Framework 7
function get_full_view_image_type7_F7(src) {
    try {
        myApp.closeModal('.popover-type7');

        if (glob_curr_form_flag == 7 || glob_curr_form_flag == 8) {
            setTimeout(function () {
                $('.photo-browser-popup').find('a').removeAttr('class');
                $('.photo-browser-popup').find('a').addClass('link');
                $('.photo-browser-popup').find('a').on('click', function () {
                    myApp.closeModal('.photo-browser-popup');
                    $('.photo-browser-popup').hide();
                });
            }, 500);
        }

        //native back functionality
        var type22_popup = $('.popup-type22:visible');
        if (type22_popup.length > 0) {
            setTimeout(function () {
                $('.photo-browser-popup').find('a').removeAttr('class');
                $('.photo-browser-popup').find('a').addClass('link');
                $('.photo-browser-popup').find('a').on('click', function () {
                    back_button('viewsitedata');
                });
            }, 500);
        }

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

        var type22_popup = $('.popup-type22:visible');
        if (type22_popup.length > 0) {
            setTimeout(function () {
                $('.photo-browser-popup').find('a').removeAttr('class');
                $('.photo-browser-popup').find('a').addClass('link');
                $('.photo-browser-popup').find('a').on('click', function () {
                    back_button('viewsitedata');
                });
            }, 500);
        }
    }
    catch (e) {
        //alert1(e + '_get_full_view_image_type7_F7');
    }
}


var glob_curr_form_flag;
///customer camera click

function CaptureClick_Customer(item_id, que_id, img_div, form_flag_temp, photo_type, img_latlong, width, height, quality, null_img, burstmode, target_div) {
    try {
        $("#img_full_type7").attr("src", "");
        $("#div_bottom_div_type7").empty();
        $("#popup_outer_div_type7").hide();
        $("#popup_inner_div_type7").hide();

        storage.setItem('img_div_id', JSON.stringify(img_div));
        storage.setItem('img_id', JSON.stringify(item_id));
        storage.setItem('photo_type', JSON.stringify(photo_type));
        glob_curr_form_flag = form_flag_temp;

        var c_is_online = JSON.parse(storage.getItem('c_is_online'));

        var date_s = new Date();
        var time = date_s.getTime();

        var camera_type = localStorage.getItem('Camera_Type');
        var camera_edit = localStorage.getItem('Camera_Edit');

        var company_id = JSON.parse(storage.getItem('company_id'));
        //var siteid = JSON.parse(storage.getItem('siteid'));
        //if (siteid == '' || siteid == null || siteid == undefined) {
        //    siteid = '0';
        //}

        var img_div = JSON.parse(storage.getItem('img_div_id'));
        var hdn_cam_ary = $("#hdn_" + img_div + "").val();
        hdn_cam_ary = decodeURIComponent(hdn_cam_ary);
        hdn_cam_ary = JSON.parse(hdn_cam_ary);
        var max_file_size = hdn_cam_ary[0].max_file_size;
        var model_name = hdn_cam_ary[0].model_name;
        var prompt_text = hdn_cam_ary[0].prompt_text;
        var prompt_text_array = hdn_cam_ary[0].prompt_text_array;
        if (prompt_text_array.length > 0) {
            let combined_prompt_text = '';
            let combined_ans_text = ''
            for (let p = 0; p < prompt_text_array.length; p++) {
                let classname = prompt_text_array[p].classname;         // it combination of Q + que_id e.g. Q13
                let prompt = prompt_text_array[p].prompt;

                combined_prompt_text += classname + ' : ' + prompt + ' ';

                if (p == (prompt_text_array.length - 1)) {
                    combined_ans_text += classname + ' : "Your Answer"';
                }
                else {
                    combined_ans_text += classname + ' : "Your Answer", ';
                }
            }

            combined_prompt_text += '. Give Response in JSON object : {' + combined_ans_text + '}';

            prompt_text = combined_prompt_text;
        }

        if (form_flag_temp == 6) {
            var check_type = JSON.parse(storage.getItem('check_type_task'));
            var siteid = 0;
        }
        else if (form_flag_temp == 12 || (form_flag_temp == 0 && c_is_online == 1)) {
            var check_type = JSON.parse(storage.getItem('check_type'));
            var siteid = JSON.parse(storage.getItem('siteid'));
        }
        else if (form_flag_temp == 8) {
            var check_type = localStorage.getItem('check_type_user');
            var siteid = 0;
        }
        else {
            var check_type = localStorage.getItem('check_type_customer');
            var siteid = 0;
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

        myApp.closeModal('.popover-type7');
        var full_image_display = $("#popup_outer_div_type7").css("display");
        full_image_display = 'none';
        var src = $("#" + img_div + "").attr("src");
        var curr_form_flag = form_flag_temp;

        if (null_img == 1 || null_img == 2 || (null_img == 0 && full_image_display == 'none' && src != 'images/camera.png')) {
            $('#light1_login').hide();
            $('#fade1_login').hide();
            loading_hide();

            $("#div_bottom_div_type7").css("height", "0%");
            $("#div_bottom_div_type7").empty();
            $("#popup_outer_div_type7").show();
            $("#popup_inner_div_type7").show();

            var param = "CaptureClick_Customer('" + item_id + "', '" + que_id + "', '" + img_div + "','" + form_flag_temp + "','" + photo_type
                + "','" + img_latlong + "','" + width + "','" + height + "','" + quality + "','3','" + burstmode + "', '" + target_div + "')";

            var clickedLink = $("#" + img_div + "");
            myApp.popover('.popover-type7', clickedLink);
            $("#popover_viewphoto").attr("onclick", "get_full_view_image_type7_F7('" + src + "')");
            $("#popover_re_capture").attr("onclick", param);

            if (null_img == 2) {
                // readonly image (in collapsible step)
                $("#popover_re_capture").parent().hide();
            }
        }
        else {
            if ((form_flag_temp == 0 || form_flag_temp == 1) && c_is_online == 1) {
                // normal online form
                var sid = JSON.parse(storage.getItem('server_task_id'));
            }
            else if (form_flag_temp == 12) {
                // group task
                var t_curr_cd_div = target_div;
                t_curr_cd_div = t_curr_cd_div.replace('cd_', '');
                t_curr_cd_div = t_curr_cd_div.trim();
                var sid = t_curr_cd_div;
            }
            else {
                var task_mode = localStorage.getItem('task_mode');
                if (task_mode == "edit") {
                    var sid = JSON.parse(storage.getItem('server_task_id'));
                }
                else {
                    var sid = '0';
                }
            }

            // add system variable in value in camera photo in online checksheet 27062023      
            var info_arry = [];
            var data_json = JSON.parse(storage.getItem('list_json'));
            if (data_json == "" || data_json == null || data_json == undefined) { }
            else {
                var list_data = JSON.parse(data_json);
                var default_columndata = list_data[0].columndata;
                var d_len = default_columndata.length;
                for (d = 0; d < d_len; d++) {

                    var get_dis_camera_key = default_columndata[d].dis_in_cam_photo;
                    if (get_dis_camera_key == "" || get_dis_camera_key == null || get_dis_camera_key == undefined) { }
                    else {
                        if (get_dis_camera_key == "true") {
                            var key_name = default_columndata[d].header;
                            var key_val = curr_all_data_20[key_name];
                            var key_str = key_name + ': ' + key_val;
                            info_arry.push(key_str)
                        }
                    }
                }
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
            //alert1(JSON.stringify(flowParamData));

            var query = "select imei from Login_Master";
            var q_jsonobj = [];
            q_jsonobj.push({
                data: query,
                p: "1",
                time: time,
                flag: img_latlong,
                width: width,
                height: height,
                quality: quality,
                burstmode: burstmode,
                camera_type: camera_type,
                camera_edit: camera_edit,
                photo_type: photo_type,
                flowParamData: flowParamData,
                info: info_arry,
                max_file_size: max_file_size,
                model_name: model_name,
                prompt_text: prompt_text
            });
            //alert1('q_jsonobj: ' + JSON.stringify(q_jsonobj));

            if (photo_type == "camera" || photo_type == "browse" || photo_type == "AI" || photo_type == "Attendance") {
                loading();
                cordova.exec(onsuccess_CaptureClick_Customer, onfail_customer_camera, 'UploadPhotoPlugin', 'anAction', q_jsonobj);
            }
            else if (photo_type == "SafetyMeasure") {
                loading();
                cordova.exec(onsuccess_CaptureClick_Customer, onfail_SafetyMeasure, 'UploadPhotoPlugin', 'anAction', q_jsonobj);
            }
            else if (photo_type == "GroupAttendance") {
                verify_group_photo_with_face_detection(item_id, que_id, img_div, form_flag_temp, photo_type, img_latlong, width, height, quality, null_img, burstmode, target_div, q_jsonobj);
            }
            else {

                // hide new options in task/customer form
                $("#popover_camera_with_reading").hide();
                $("#popover_metercrop").hide();
                $("#popover_EntityDetection").hide();
                $("#popover_AI").hide();

                // both (user select)
                var param = "customer_camera_user_choice('camera', '" + JSON.stringify(q_jsonobj) + "')";
                var param1 = "customer_camera_user_choice('browse', '" + JSON.stringify(q_jsonobj) + "')";
                var img_div = JSON.parse(storage.getItem('img_div_id'));
                var clickedLink = $("#" + img_div + "");
                myApp.popover('.popover-type7-UserChoice', clickedLink);
                $("#popover_camera").attr("onclick", param);
                $("#popover_browse").attr("onclick", param1);
            }
        }
    }
    catch (e) {
        alert1(e + '_CaptureClick_Customer()');
        loading_hide();
    }
}

function customer_camera_user_choice(photo_type, t_q_jsonobj) {
    try {
        loading();
        var q_jsonobj = JSON.parse(t_q_jsonobj);
        q_jsonobj[0].photo_type = photo_type;

        cordova.exec(onsuccess_CaptureClick_Customer, onfail_customer_camera, 'UploadPhotoPlugin', 'anAction', q_jsonobj);
    }
    catch (e) {
        alert1(e + '_customer_camera_user_choice');
    }
}

// online photo success
function onsuccess_CaptureClick_Customer(e) {

    form_has_changed = "true";                      //to get confirmation on back btn while editing form

    setTimeout(function () {
        loading_hide();
    }, 1000);

    //alert1('e: ' + JSON.stringify(e));
    myApp.closeModal('.popover-type7-UserChoice');

    var curr_form_flag = glob_curr_form_flag;
    var response = JSON.parse(e);
    var photo_id = response[0].photo_id;
    var curr_file_size_mb = response[0].photo_size;
    var photo_path = response[0].photo_path;

    if (photo_id == '' || photo_id == null || photo_id == undefined) { }
    else {
        let type20_cust_add_popup = $('#popup_container_type20_add:visible').length;
        if (type20_cust_add_popup > 0) {
            // Customer Form
            Cust_Photo_Id_Array.push({ "photo_id": photo_id });
        }
        else {
            // Task Form
            Photo_Id_Array.push({ "photo_id": photo_id });
        }
    }

    var curr_img_div_id = JSON.parse(storage.getItem('img_div_id'));
    var smallImage = document.getElementById(curr_img_div_id);

    if (F7_device == 'ios') {
        //====photo thumbnail issue for iOS after cordove plugin updation [03062024]
        var iosDirectoryPath = localStorage.getItem('iosDirectoryPath');
        var localFile = iosDirectoryPath + photo_path;
        var photo_path_ios = window.WkWebView.convertFilePath(localFile);

        smallImage.src = photo_path_ios;
    }
    else {
        smallImage.src = photo_path;
    }

    let photo_type = JSON.parse(storage.getItem('photo_type'));
    if (photo_type == "SafetyMeasure") {
        reset_SafetyMeasure_summary(e);
    }

    /* new logic */
    var date_s = new Date();
    var time = date_s.getTime();
    var company_id = JSON.parse(storage.getItem('company_id'));
    var user_id = JSON.parse(storage.getItem('user_id'));

    //if (curr_form_flag == 6) {
    //    var siteid = JSON.parse(storage.getItem('siteid'));
    //    if (siteid == '' || siteid == null || siteid == undefined) {
    //        siteid = '0';
    //    }
    //}
    //else {
    //    var siteid = 0;
    //}
    //var siteid = 0;

    var c_is_online = JSON.parse(storage.getItem('c_is_online'));
    if (curr_form_flag == 12 || (curr_form_flag == 0 && c_is_online == 1) || (curr_form_flag == 1 && c_is_online == 1)) {
        // group task || normal online checksheet
        var siteid = JSON.parse(storage.getItem('siteid'));
    }
    else {
        var siteid = 0;
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

    var p_name = company_id + "_" + user_id + "_" + siteid + "_" + time + '_' + t_row_index_no + '.jpeg';

    var answer = [];
    answer.push(photo_path, p_name, '', '', photo_id, curr_file_size_mb);

    var img_id = JSON.parse(storage.getItem('img_id'));
    var img_div = JSON.parse(storage.getItem('img_div_id'));
    var hdn_ans_id = img_div.replace('cbtn_', '');

    if (curr_form_flag == 0 || curr_form_flag == 6) {
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
    else if (curr_form_flag == 7) {
        // new customer form
        jsonObj_cust_add[img_id].ans = answer;
    }
    else if (curr_form_flag == 8) {
        // new user form
        jsonObj_user_add[img_id].ans = answer;

        set_common_localStorage('profile_user_path', photo_path);
    }
    else if (curr_form_flag == 12) {
        //group task
        var hdn_ans_str = JSON.stringify(answer);
        hdn_ans_str = encodeURIComponent(hdn_ans_str);
        $("#hdn_cbtn_ans_" + hdn_ans_id + "").val(hdn_ans_str);
    }


    // autofill AI text to below textbox derived from image response - mk - 28072025
    var img_div = JSON.parse(storage.getItem('img_div_id'));
    var target_class = $("#" + img_div + "").attr('target_class');
    if (target_class == "" || target_class == null || target_class == undefined) {
        if (photo_type == "AI") {
            let responsetext = response[0].responsetext;
            responsetext = responsetext.substring(0, 500);    // truncate string to 500 char
            alert(responsetext);
            try {
                let responsetext_new = responsetext.replaceAll('\n', '');
                responsetext_new = responsetext_new.match(/\{(.*?)\}/);     // extract inner string { }
                responsetext_new = responsetext_new[0];
                let responseJSON = JSON.parse(responsetext_new);

                // response is in JSON
                $.each(responseJSON, function (key, value) {
                    let qid_class = key;
                    let where_box_id = $("." + qid_class + " :input").attr("id");
                    let tagName = $("#" + where_box_id + "").prop("tagName");
                    if (tagName == "TEXTAREA") {
                        $("#" + where_box_id + "").val(value);
                    }
                    else {
                        let $input = $("#" + where_box_id + "");
                        let $textarea = '<textarea cols="20" rows="2" class="form-ele" id="' + where_box_id + '" onkeydown="ResizeBox(event)" value=\'' + value + '\' style="resize:vertical !important; width: 100% !important;" disabled="disabled">' + value + '</textarea>';
                        $input.replaceWith($textarea);

                        let t_textarea = document.getElementById(where_box_id);
                        t_textarea.style.height = t_textarea.scrollHeight + "px";
                    }
                });

            }
            catch (e) {
                alert("Response is not in JSON structure!" + responsetext);
            }
        }
    }
    else {
        let responsetext = response[0].responsetext;
        responsetext = responsetext.substring(0, 500);    // truncate string to 500 char
        let where_box_id = $("." + target_class + " :input").attr("id");
        let tagName = $("#" + where_box_id + "").prop("tagName");
        if (tagName == "TEXTAREA") {
            $("#" + where_box_id + "").val(responsetext);
        }
        else {
            // textbox found hence convert it to textarea run time - mk - 26072025
            let $input = $("#" + where_box_id + "");
            let $textarea = '<textarea cols="20" rows="2" class="form-ele" id="' + where_box_id + '" onkeydown="ResizeBox(event)" value=\'' + responsetext + '\' style="resize:vertical !important; width: 100% !important;" disabled="disabled">' + responsetext + '</textarea>';
            $input.replaceWith($textarea);

            let t_textarea = document.getElementById(where_box_id);
            t_textarea.style.height = t_textarea.scrollHeight + "px";
        }
    }

}

function onfail_customer_camera(e) {
    loading_hide();
    //alert1(e + "_onfail_customer_camera")
}






// old photo process (referenced with cropped photo) - for offline mode only
var old_photo_que_id;
function check_photo_entry_old_photo() {
    try {
        var t_id = curr_survey_data["t_id"];
        var step = curr_survey_data["step"];
        var check_type = curr_survey_data["check_type"];
        var img_que_id = old_photo_que_id;

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

        var query = "select pid from p_master where tid = '" + t_id + "' and checksheetid = '" + check_type + "' and p_key = '" + step + "' and que_id = '" + img_que_id + "' and Ph_id = '" + type22_img_que_id + "' and it_id = '" + t_row_index_no + "'";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "0"
        });
        cordova.exec(onsuccess_check_photo_entry_old_photo, onfail_check_photo_entry_old_photo, 'SqlitePlugin', 'showValues', q_jsonobj);
    }
    catch (e) {
        alert1(e + '_check_photo_entry()');
    }
}
function onsuccess_check_photo_entry_old_photo(e) {
    curr_photo_id = e;
    curr_query_type = 'update';
    onPhotoDataSuccess_old_photo();
}

function onfail_check_photo_entry_old_photo(e) {
    curr_query_type = 'insert';
    onPhotoDataSuccess_old_photo();
}

function onPhotoDataSuccess_old_photo() {
    try {
        var curr_form_flag = form_flag;

        // display cropped and original photo 03022021
        var e = curr_survey_data["img_path"];

        var myArray = JSON.parse(e);
        var imageData = myArray[0].original_photo;

        var img_div = JSON.parse(storage.getItem('img_div_id'));
        var old_photo_class = $("#" + img_div + "").attr('old_photo_class');
        var old_photo_id = $("." + old_photo_class + "").find("img[id^=cbtn_]").attr("id");
        $("#" + old_photo_id + "").attr("src", imageData);
        //$("#" + old_photo_id + "").attr("disabled", "disabled");
        $("#" + old_photo_id + "").attr('old_photo_type', "original_photo");

        $("." + old_photo_class + "").show();

        // readonly image (in collapsible step)
        $("#popover_re_capture").parent().hide();

        var click_action = $("#" + old_photo_id + "").attr('click_action');
        $("#" + old_photo_id + "").attr('onclick', click_action);

        var photo_type = curr_survey_data["photo_type"];
        if (photo_type == "" || photo_type == null || photo_type == undefined) {
            photo_type = "";
        }

        var date_s = new Date();
        var time = date_s.getTime();
        var company_id = JSON.parse(storage.getItem('company_id'));
        var user_id = JSON.parse(storage.getItem('user_id'));

        if (curr_form_flag == 7 || curr_form_flag == 8) {
            var siteid = 0;
        }
        else {
            var siteid = JSON.parse(storage.getItem('siteid'));
        }

        var p_name = company_id + "_" + user_id + "_" + siteid + "_" + time;

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
        p_name = p_name + '_' + t_row_index_no;

        storage.setItem('p_name', JSON.stringify(p_name));

        var answer = [];
        answer.push(imageData.toString(), p_name, '', '', '', '', photo_type);

        var index = find_index_by_que_id(curr_form_flag, old_photo_que_id);
        if (index == "" || index == null || index == undefined) {
            index = 0;
            alert1("Old photo index not found!");
        }

        if (curr_form_flag == 0 || curr_form_flag == 6 || curr_form_flag == 7) {
            let task_create_popup = $('.popup-new-task-create.modal-in:visible');
            if (task_create_popup.length > 0) {
                //new task create popup [FT-08052025]
                jsonObj_task_add[index].ans = answer;
            }
            else {
                // normal form // task form // customer form
                jsonObj_old[index].ans = answer;
            }
        } else if (curr_form_flag == 1 || curr_form_flag == 4 || curr_form_flag == 5) {
            // type22 form
            jsonObj_type22[index].ans = answer;
        } else if (curr_form_flag == 2 || curr_form_flag == 3) {
            // type23 form
            jsonObj_type23[index].ans = answer;
        } else if (curr_form_flag == 8) {
            // user form
            jsonObj_user_add[index].ans = answer;
        }

        var date_s = new Date();
        var time = date_s.getTime();

        var t_id = curr_survey_data["t_id"];
        var img_que_id = old_photo_que_id;
        var img_path = imageData;
        var check_type = curr_survey_data["check_type"];

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

        var step = curr_survey_data["step"];
        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var match_temp_id = list_data[0].match_temp_id;
        if (match_temp_id == "" || match_temp_id == null || match_temp_id == undefined) {
            match_temp_id = "";
        }

        var prop_name = $("." + old_photo_class + "").find("img[id^=cbtn_]").attr("name");

        if (curr_query_type == 'insert') {
            var query = "INSERT INTO p_master (tid, que_id, checksheetid, p_name, p_url, p_key, p_value ,p_type, flag, Ph_id, it_id, millisecond, match_temp_id, que_name) VALUES('"
                + t_id + "','" + img_que_id + "','" + check_type + "','" + p_name + "','" + img_path + "','" + step + "','image','image/jpg','0','"
                + type22_img_que_id + "', '" + t_row_index_no + "', '" + time + "', '" + match_temp_id + "', '" + prop_name + "');";
        }
        else {
            var query = "update p_master set p_url='" + img_path + "', p_name='" + p_name + "', millisecond='" + time + "', flag='0' where pid='" + curr_photo_id + "'";
        }

        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            q: "0",
            tid: ""
        });
        cordova.exec(insertValuesSuccessCallBack_PM_old_photo, onfail, 'SqlitePlugin', 'insertValuse', q_jsonobj);
    } catch (e) {
        storage.setItem('crash_status', JSON.stringify('0'));
        curr_btn_mode = "";
        show_save_label();
        loading_hide();
    }
}


function insertValuesSuccessCallBack_PM_old_photo() {
    storage.setItem('crash_status', JSON.stringify('0'));
    myApp.closeModal('.popover-type7-UserChoice');
    curr_btn_mode = "";
    loading_hide();
}





// for verify profile photo via camera control (username taken from above searachable) (24052023)

function reset_profle_photo_on_dropdown_change(item_id, img_div) {
    $("#" + img_div + "").attr("src", "images/camera.png");

    var img_id = item_id;
    var curr_form_flag = glob_curr_form_flag;
    if (curr_form_flag == 0 || curr_form_flag == 6) {
        let task_create_popup = $('.popup-new-task-create.modal-in:visible');
        if (task_create_popup.length > 0) {
            //new task create popup [FT-08052025]
            jsonObj_task_add[img_id].ans = [""];
        }
        else {
            // normal form
            jsonObj_old[img_id].ans = [""];
        }
    } else if (curr_form_flag == 1 || curr_form_flag == 4 || curr_form_flag == 5) {
        // type22 form
        jsonObj_type22[img_id].ans = [""];;
    } else if (curr_form_flag == 2 || curr_form_flag == 3) {
        // type23 form
        jsonObj_type23[img_id].ans = [""];;
    }
    else if (curr_form_flag == 7) {
        // new customer form
        jsonObj_cust_add[img_id].ans = [""];;
    }
    else if (curr_form_flag == 8) {
        // new user form
        jsonObj_user_add[img_id].ans = [""];;
    }
}

var is_attendance_photo = 0;
function verify_user_profile_photo(item_id, que_id, img_div, form_flag_temp, photo_type, img_latlong, width, height, quality, null_img, burstmode, ref_class) {

    var src = $("#" + img_div + "").attr("src");
    if (src != 'images/camera.png') {
        var clickedLink = $("#" + img_div + "");
        myApp.popover('.popover-type7', clickedLink);
        $("#popover_viewphoto").attr("onclick", "get_full_view_image_type7_F7('" + src + "')");
        $("#popover_re_capture").parent().hide();
        return false;
    }

    let img_len = $("." + ref_class + " img[id^=cbtn]").length;
    if (img_len > 0) {
        // above autofilled image control + below face detection photo

        storage.setItem('img_id', JSON.stringify(item_id));
        storage.setItem('img_que_id', JSON.stringify(que_id));
        storage.setItem('img_div_id', JSON.stringify(img_div));
        storage.setItem('camera_type', JSON.stringify('7'));
        storage.setItem('photo_type', JSON.stringify(photo_type));
        storage.setItem('img_latlong', JSON.stringify(img_latlong));
        storage.setItem('img_width', JSON.stringify(width));
        storage.setItem('img_height', JSON.stringify(height));
        storage.setItem('img_quality', JSON.stringify(quality));
        storage.setItem('img_burstmode', JSON.stringify(burstmode));
        glob_curr_form_flag = form_flag_temp;

        var hdn_cam_ary = $("#hdn_" + img_div + "").val();
        hdn_cam_ary = decodeURIComponent(hdn_cam_ary);
        hdn_cam_ary = JSON.parse(hdn_cam_ary);
        var scan_mode = hdn_cam_ary[0].scan_mode;
        storage.setItem('img_scan_mode', JSON.stringify(scan_mode));

        let t_user_id = JSON.parse(storage.getItem('user_id'));
        let t_username = JSON.parse(storage.getItem('user_name'));
        let above_img_id = $("." + ref_class + " img[id^=cbtn]").attr("id");
        let t_photo_url = $("." + ref_class + " img[id^=cbtn]").attr("src");
        verify_photo_with_face_detection(t_photo_url, t_username, t_user_id, above_img_id, item_id, img_div);
    }
    else {
        // above searchable control + below face detection photo

        var above_ddl_id = $("." + ref_class + "").find("select").attr("id");
        if (above_ddl_id == "" || above_ddl_id == null || above_ddl_id == undefined) {
            // use current user in case searchable not found with ref class - mk - 13092024
            let current_checksheet_id = curr_all_data_20["current_checksheet_id"]
            $("#div_Search_0_" + current_checksheet_id + "_4").addClass(ref_class);

            above_ddl_id = $("." + ref_class + "").find("select").attr("id");
        }

        var t_username = $("#" + above_ddl_id + "").val();
        var t_user_id = $("#" + above_ddl_id + " option:selected").attr('value1');

        if (t_username == "" || t_username == null || t_username == undefined || t_user_id == "0" || t_username == "0") {
            alert("Please select user from above dropdown first!");
        }
        else {

            storage.setItem('img_id', JSON.stringify(item_id));
            storage.setItem('img_que_id', JSON.stringify(que_id));
            storage.setItem('img_div_id', JSON.stringify(img_div));
            storage.setItem('camera_type', JSON.stringify('7'));
            storage.setItem('photo_type', JSON.stringify(photo_type));
            storage.setItem('img_latlong', JSON.stringify(img_latlong));
            storage.setItem('img_width', JSON.stringify(width));
            storage.setItem('img_height', JSON.stringify(height));
            storage.setItem('img_quality', JSON.stringify(quality));
            storage.setItem('img_burstmode', JSON.stringify(burstmode));
            glob_curr_form_flag = form_flag_temp;

            var hdn_cam_ary = $("#hdn_" + img_div + "").val();
            hdn_cam_ary = decodeURIComponent(hdn_cam_ary);
            hdn_cam_ary = JSON.parse(hdn_cam_ary);
            var scan_mode = hdn_cam_ary[0].scan_mode;
            storage.setItem('img_scan_mode', JSON.stringify(scan_mode));

            var hdn_id = $("." + ref_class + "").find("input[id^='hdn_condition_data_']").attr("id");
            var Condition_Data_Str = $("#" + hdn_id + "").val();
            var t_Condition_Data_Str = decodeURIComponent(Condition_Data_Str)
            var Condition_Data = JSON.parse(t_Condition_Data_Str);
            var value_new = Condition_Data[0].value_new;

            value_new[0]['OFFSET'] = '0';
            value_new[0]['FETCH'] = '0';
            value_new[0]['searchValue'] = t_user_id;

            var param_obj = [];
            param_obj.push({
                'flag': 2,
                "value_new": value_new
            });

            loading();
            var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_Type20Filter', JSON.stringify(param_obj), function (e) {

                var Data_Json = e.responseText;
                Data_Json = eval('(' + Data_Json + ')');
                var status = Data_Json[0].status;
                if (status == 1) {

                    var data = Data_Json[0].data;
                    if (data == "" || data == null || data == undefined) {
                        var message = eval('(' + Data_Json[0].message + ')');
                    }
                    else {
                        var message = JSON.parse(data);
                    }
                    var user_checksheet_id = message[0].checksheet_id;

                    var user_id = JSON.parse(storage.getItem('user_id'));
                    var random_str = "&random=" + new Date().getTime();

                    var global_resumable_url = JSON.parse(storage.getItem('global_resumable_url'));
                    var t_photo_url = "" + global_resumable_url + "GetFile/Select_File_Details?cid="
                        + user_checksheet_id + "&t22id=0&t22i=0&id=" + t_user_id + "&qd=4008&ctype=7&ud=" + user_id + "&uc=" + uniqcode + random_str + "";

                    verify_photo_with_face_detection(t_photo_url, t_username, t_user_id, above_ddl_id, item_id, img_div);

                } else {
                    alert1(Data_Json[0].message);
                    loading_hide();
                }
            }, onfail);
            getdata.callOtherDomain();
        }
    }
}

// face detection in offline checksheet
function verify_photo_with_face_detection(t_photo_url, t_username, t_user_id, above_ddl_id, item_id, img_div) {
    var q_jsonobj = [];
    q_jsonobj.push({
        "attendanceData": {
            "username": t_username,
            "userId": t_user_id,
            "moduleId": "0",
            "checkSheetId": "0",
            "moduleName": "0"
        },
        "photoUrl": t_photo_url,
        "photoName": "",
        "WithoutTaskAttendance": "true"
    });

    loading();
    cordova.exec(function (imageData) {
        alert1("Profile photo has been verified successfully!");
        loading_hide();

        $("#" + above_ddl_id + "").attr("onchange", "reset_profle_photo_on_dropdown_change(" + item_id + ",'" + img_div + "')");

        is_attendance_photo = 1;

        check_photo_entry(imageData);

        loading_hide();
    }, function (e) {
        // back from attendance camera back
        if (e == "" || e == null || e == undefined) { }
        else { alert1("Device: " + e); }
        loading_hide();
    }, 'AttendancePlugin', 'anAction', q_jsonobj);
}


function verify_group_photo_with_face_detection(item_id, que_id, img_div, form_flag_temp, photo_type, img_latlong, width, height, quality, null_img, burstmode, target_div, old_q_jsonobj) {
    try {

        var hdn_cam_ary = $("#hdn_" + img_div + "").val();
        hdn_cam_ary = decodeURIComponent(hdn_cam_ary);
        hdn_cam_ary = JSON.parse(hdn_cam_ary);
        var group_photo_class = hdn_cam_ary[0].group_photo_class;
        if (group_photo_class == "" || group_photo_class == null || group_photo_class == undefined) {
            alert("No group photo class is configured !");
        }
        else {
            let pending_found = 0, group_photo_url_Array = [];
            for (let g = 0; g < group_photo_class.length; g++) {
                let t_group_photo_class = group_photo_class[g];
                let img_len = $("." + t_group_photo_class + " img[id^=cbtn]").length;
                if (img_len > 0) {
                    let t_group_photo_id = $("." + t_group_photo_class + " img[id^=cbtn]").attr("id");
                    if ($('#' + t_group_photo_id + '').is(':hidden')) {
                        // image is hidden
                    }
                    else {
                        let t_group_photo_url = $("." + t_group_photo_class + " img[id^=cbtn]").attr("src");
                        if (t_group_photo_url == 'images/camera.png') {
                            let t_group_photo_name = $("." + t_group_photo_class + " img[id^=cbtn]").attr("name");
                            alert("Group photo is pending for " + t_group_photo_name + "!");
                            pending_found++;
                            break;
                        }
                        else {
                            group_photo_url_Array.push(t_group_photo_url);
                        }
                    }
                }
                else {
                    alert("Group photo is not found for class " + t_group_photo_class + "!");
                }
            }

            if (pending_found == 0) {
                // All group photos are available

                storage.setItem('img_id', JSON.stringify(item_id));
                storage.setItem('img_que_id', JSON.stringify(que_id));
                storage.setItem('img_div_id', JSON.stringify(img_div));
                storage.setItem('camera_type', JSON.stringify('7'));
                storage.setItem('photo_type', JSON.stringify(photo_type));
                storage.setItem('img_latlong', JSON.stringify(img_latlong));
                storage.setItem('img_width', JSON.stringify(width));
                storage.setItem('img_height', JSON.stringify(height));
                storage.setItem('img_quality', JSON.stringify(quality));
                storage.setItem('img_burstmode', JSON.stringify(burstmode));
                glob_curr_form_flag = form_flag_temp;

                let t_user_id = JSON.parse(storage.getItem('user_id'));
                let t_username = JSON.parse(storage.getItem('user_name'));

                var q_jsonobj = [];
                q_jsonobj.push({
                    "attendanceData": {
                        "username": t_username,
                        "userId": t_user_id,
                        "moduleId": "0",
                        "checkSheetId": "0",
                        "moduleName": "0"
                    },
                    "photoUrl": "",
                    "photoName": "",
                    "WithoutTaskAttendance": "true",
                    "group_photoUrl": group_photo_url_Array,
                });

        
                if (old_q_jsonobj == "" || old_q_jsonobj == null || old_q_jsonobj == undefined) {
                    // offline checksheet
                    loading();
                    cordova.exec(function (imageData) {
                        alert1("Group photo has been verified successfully!");
                        loading_hide();

                        check_photo_entry(imageData);

                        loading_hide();
                    }, function (e) {
                        // back from attendance camera back
                        if (e == "" || e == null || e == undefined) { }
                        else { alert1("Device: " + e); }
                        loading_hide();
                    }, 'GroupAttendancePlugin', 'anAction', q_jsonobj);

                }
                else {
                    // online checksheet

                    old_q_jsonobj[0]["attendanceData"] = q_jsonobj[0].attendanceData;
                    old_q_jsonobj[0]["photoUrl"] = q_jsonobj[0].photoUrl;;
                    old_q_jsonobj[0]["photoName"] = q_jsonobj[0].photoName;;
                    old_q_jsonobj[0]["WithoutTaskAttendance"] = q_jsonobj[0].WithoutTaskAttendance;
                    old_q_jsonobj[0]["attendanceData"] = q_jsonobj[0].group_photoUrl;

                    loading();
                    cordova.exec(onsuccess_CaptureClick_Customer, onfail_customer_camera, 'UploadPhotoPlugin', 'anAction', old_q_jsonobj);

                }

            }
        }
    }
    catch (e) {
        alert(e + '_verify_group_photo_with_face_detection()');
        loading_hide();
    }
}

