// call on capture button
function CaptureClick_sign(item_id, que_id, img_div, form_flag_temp, null_img) {
    try {
        storage.setItem('sign_id', JSON.stringify(item_id));
        storage.setItem('sign_que_id', JSON.stringify(que_id));
        storage.setItem('sign_div_id', JSON.stringify(img_div));
        storage.setItem('camera_type', JSON.stringify('9'));

        loading();
        var full_image_display = $("#popup_outer_div_type9").css("display");
        full_image_display = 'none';
        myApp.closeModal('.popover-type9');
        var src = $("#" + img_div + "").attr("src");
        if (null_img == 1 || null_img == 2 || (null_img == 0 && full_image_display == 'none' && src != 'images/signature_box.png')) {
            $('#light1_login').hide();
            $('#fade1_login').hide();
            loading_hide();

            // captured image exist
            if (curr_form_flag == 0 || curr_form_flag == 1 || curr_form_flag == 4 || curr_form_flag == 5) {
                curr_clps_new_id = 0;
            }
            $("#div_bottom_div_type9").css("height", "0%");
            $("#div_bottom_div_type9").empty();
            $("#popup_outer_div_type9").show();
            $("#popup_inner_div_type9").show();


            var param = "CaptureClick_sign('" + item_id + "', '" + que_id + "', '" + img_div + "','" + form_flag_temp + "', '3')";
            var clickedLink = $("#" + img_div + "");
            myApp.popover('.popover-type9', clickedLink);
            $("#popover_viewsign").attr("onclick", "get_full_view_image_type9_F7('" + src + "')");
            $("#popover_re_capture_sign").attr("onclick", param);

            if (null_img == 2) {
                // readonly image (in collapsible step)
                $("#popover_re_capture_sign").parent().hide();
            }
        } else {
            storage.setItem('crash_status', JSON.stringify('1'));
            curr_btn_mode = "save";
            var curr_form_flag = form_flag_temp;
            if (curr_form_flag == 0) {
                // normal form
                curr_clps_new_id = 0;
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
            }
        }

        // capture_Photo_sign();
    } catch (e) {
        alert1(e + '_CaptureClick()');
        loading_hide();
    }
}

// Open camera and take picture using device camera
function capture_Photo_sign() {
    try {
        loading();
        close_full_view_image_type9();
        var query = "select imei from Login_Master";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "1"
        });
        cordova.exec(check_photo_entry_sign, onFail_sign, 'signature', 'anAction', q_jsonobj);
    } catch (e) {
        alert1(e + '_capture_Photo_sign()');
        loading_hide();
    }
}

var curr_photo_id, curr_query_type;
// check photo for insert or update
function check_photo_entry_sign(imageData) {
    try {
        curr_survey_data["sign_path"] = imageData;

        var t_id = curr_survey_data["t_id"];
        var step = curr_survey_data["step"];
        var check_type = curr_survey_data["check_type"];
        var img_que_id = JSON.parse(storage.getItem('sign_que_id'));

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
        cordova.exec(onsuccess_check_photo_entry_sign, onfail_check_photo_entry_sign, 'SqlitePlugin', 'showValues', q_jsonobj);
    }
    catch (e) {
        alert1(e + '_check_photo_entry_sign()');
    }
}

function onsuccess_check_photo_entry_sign(e) {
    curr_photo_id = e;
    curr_query_type = 'update';
    onPhotoDataSuccess_sign();
}

function onfail_check_photo_entry_sign(e) {
    curr_query_type = 'insert';
    onPhotoDataSuccess_sign();
}

// Get base64 of photo captured by device successfully
function onPhotoDataSuccess_sign() {
    try {
        form_has_changed = "true";                      //to get confirmation on back btn while editing form
        var imageData = curr_survey_data["sign_path"];

        var curr_img_div_id = JSON.parse(storage.getItem('sign_div_id'));
        var smallImage = document.getElementById(curr_img_div_id);
        if (F7_device == 'ios') {
            //====photo thumbnail issue for iOS after cordove plugin updation [03062024]
            var iosDirectoryPath = localStorage.getItem('iosDirectoryPath');
            var localFile = iosDirectoryPath + imageData;
            var imageData_ios = window.WkWebView.convertFilePath(localFile);

            smallImage.src = imageData_ios;
        }
        else {
            smallImage.src = imageData;
        }

        var img_id = JSON.parse(storage.getItem('sign_id'));

        var date_s = new Date();
        var time = date_s.getTime();
        var company_id = JSON.parse(storage.getItem('company_id'));
        var user_id = JSON.parse(storage.getItem('user_id'));
        var siteid = JSON.parse(storage.getItem('siteid'));
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
        answer.push(imageData.toString(), p_name);

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
        cordova.exec(insert_photo_entry_sign, onfail_onPhotoDataSuccess_sign, 'SqlitePlugin', 'showValues', q_jsonobj);
    } catch (e) {
        alert1(e + '_onPhotoDataSuccess_sign()');
        loading_hide();
    }
}

function insert_photo_entry_sign(e) {
    try {
        // alert1(e);
        var myArray = JSON.parse(e);
        var date_s = new Date();
        var time = date_s.getTime();

        var p_name = JSON.parse(storage.getItem('p_name'));
        var t_id = curr_survey_data["t_id"];
        var img_que_id = JSON.parse(storage.getItem('sign_que_id'));
        var img_path = curr_survey_data["sign_path"];
        var check_type = curr_survey_data["check_type"];
        var type22_img_que_id = storage.getItem('img_id_type22');

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

        var img_div = JSON.parse(storage.getItem('sign_div_id'));
        var prop_name = $("#" + img_div + "").attr('name');

        if (curr_query_type == 'insert') {
            var query = "INSERT INTO p_master (tid, que_id, checksheetid, p_name, p_url, p_key, p_value ,p_type, flag, Ph_id, it_id, millisecond, match_temp_id, que_name) VALUES('"
                + t_id + "','" + img_que_id + "','" + check_type + "','" + p_name + "','" + img_path + "','" + step + "','image','image/jpg','0','"
                + type22_img_que_id + "', '" + t_row_index_no + "', '" + time + "', '" + match_temp_id + "', '" + prop_name + "');";
        }
        else {
            var query = "update p_master set p_url='" + img_path + "', p_name='" + p_name + "', millisecond='" + time + "', flag='0' where pid='" + curr_photo_id + "'";
        }

        //alert1(query);
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            q: "0",
            tid: ""
        });
        cordova.exec(onsuccess_insert_photo_entry_sign, onfail_insert_photo_entry_sign, 'SqlitePlugin', 'insertValuse', q_jsonobj);
    } catch (e) {
        alert1(e + '_insert_photo_entry_sign()');
        loading_hide();
    }
}

function onsuccess_insert_photo_entry_sign(e) {
    storage.setItem('crash_status', JSON.stringify('0'));
    curr_btn_mode = "";
    loading_hide();
}

function onfail_onPhotoDataSuccess_sign(e) {
    alert1(e + '_onfail_onPhotoDataSuccess_sign()');
    loading_hide();
}

// user press back/cancel button before/after capturing photo
function onFail_sign(e) {
    storage.setItem('crash_status', JSON.stringify('0'));
    curr_btn_mode = "";
    close_full_view_image_type9();
    loading_hide();
}

function onfail_insert_photo_entry_sign(e) {
    alert1(e + '_onfail_insert_photo_entry_sign()');
    loading_hide();
}

function get_full_view_image_type9(img_div) {
    $("#popup_outer_div_type9").show();
    $("#popup_inner_div_type9").show();
    var src = $("#" + img_div + "").attr('src');
    $("#img_full_type9").attr("src", src);
}

function close_full_view_image_type9() {
    storage.setItem('crash_status', JSON.stringify('0'));
    $("#img_full_type9").attr("src", "");
    $("#div_bottom_div_type9").empty();
    $("#popup_outer_div_type9").hide();
    $("#popup_inner_div_type9").hide();
}

// Framework 7
var myPhotoBrowser_sign;
function get_full_view_image_type9_F7(src) {
    try {
        myApp.closeModal('.popover-type9');

        if (glob_curr_form_flag == 7) {
            setTimeout(function () {
                $('.photo-browser-popup').find('a').removeAttr('class');
                $('.photo-browser-popup').find('a').addClass('link');
                $('.photo-browser-popup').find('a').on('click', function () {
                    myApp.closeModal('.photo-browser-popup');
                    $('.photo-browser-popup').hide();
                });
            }, 500);
        }

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

        myPhotoBrowser_sign = myApp.photoBrowser({
            //navbar: false,
            toolbar: false,
            zoom: false,
            photos: [{
                url: src,
                caption: 'Signature Captured'
            }],
            type: 'popup',
            theme: 'dark',
            captionsTheme: 'dark'
        });
        myPhotoBrowser_sign.open();

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
        //alert1(e + '_get_full_view_image_type9_F7');
    }
}

///customer signature click
var glob_curr_form_flag;
function CaptureClick_sign_Customer(item_id, que_id, img_div, form_flag_temp, null_img) {
    try {
        myApp.closeModal('.popover-type9');
        storage.setItem('sign_id', JSON.stringify(item_id));
        storage.setItem('sign_que_id', JSON.stringify(que_id));
        storage.setItem('sign_div_id', JSON.stringify(img_div));
        storage.setItem('camera_type', JSON.stringify('9'));
        glob_curr_form_flag = form_flag_temp;

        var company_id = JSON.parse(storage.getItem('company_id'));

        //var siteid = JSON.parse(storage.getItem('siteid'));
        //if (siteid == '' || siteid == null || siteid == undefined) {
        //    siteid = '0';
        //}
        var siteid = '0';

        if (form_flag_temp == 6) {
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

        var full_image_display = $("#popup_outer_div_type9").css("display");
        full_image_display = 'none';
        var src = $("#" + img_div + "").attr("src");
        if (null_img == 1 || null_img == 2 || (null_img == 0 && full_image_display == 'none' && src != 'images/signature_box.png')) {
            $('#light1_login').hide();
            $('#fade1_login').hide();
            loading_hide();

            // captured image exist
            if (form_flag_temp == 0 || form_flag_temp == 1 || form_flag_temp == 4 || form_flag_temp == 5) {
                curr_clps_new_id = 0;
            }
            $("#div_bottom_div_type9").css("height", "0%");
            $("#div_bottom_div_type9").empty();
            $("#popup_outer_div_type9").show();
            $("#popup_inner_div_type9").show();

            var param = "CaptureClick_sign_Customer('" + item_id + "', '" + que_id + "', '" + img_div + "','" + form_flag_temp + "', '3')";
            var clickedLink = $("#" + img_div + "");
            myApp.popover('.popover-type9', clickedLink);
            $("#popover_viewsign").attr("onclick", "get_full_view_image_type9_F7('" + src + "')");
            $("#popover_re_capture_sign").attr("onclick", param);

            if (null_img == 2) {
                // readonly image (in collapsible step)
                $("#popover_re_capture_sign").parent().hide();
            }
        }
        else {
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
                photo_type: "signature",
                flowParamData: flowParamData
            });
            //alert1('q_jsonobj: ' + JSON.stringify(q_jsonobj));

            loading();
            cordova.exec(check_customer_sign_entry, onfail_customer_sign, 'UploadPhotoPlugin', 'anAction', q_jsonobj);
        }
    }
    catch (e) {
        alert1(e + '_CaptureClick_sign_Customer()');
        loading_hide();
    }
}

function check_customer_sign_entry(e) {
    try {
        loading_hide();

        var curr_form_flag = glob_curr_form_flag;
        var response = JSON.parse(e);
        var photo_id = response[0].photo_id;
        var curr_file_size_mb = response[0].photo_size;
        var photo_path = response[0].photo_path;

        if (photo_id == '' || photo_id == null || photo_id == undefined) { }
        else {
            Photo_Id_Array.push({ "photo_id": photo_id });
        }

        var curr_img_div_id = JSON.parse(storage.getItem('sign_div_id'));
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

        var p_name = company_id + "_" + user_id + "_" + siteid + "_" + time + '_' + t_row_index_no;

        var answer = [];
        answer.push(photo_path, p_name, '', '', photo_id, curr_file_size_mb);

        var img_id = JSON.parse(storage.getItem('sign_id'));

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
    }
    catch (e) {
        loading_hide();
        alert1(e + '_check_customer_sign_entry');
    }
}

function onfail_customer_sign(e) {
    loading_hide();
}