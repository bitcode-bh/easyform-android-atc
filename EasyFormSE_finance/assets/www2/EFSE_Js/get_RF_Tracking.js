
function pre_get_RF_Tracking(mode_class, t_new_id) {
    curr_btn_mode = "rf";

    storage.setItem('crash_status', JSON.stringify('3'));     // rf crash

    localStorage.setItem("rf_mode_class", mode_class);
    localStorage.setItem("rf_new_id", t_new_id);

    curr_clps_new_id = 0;
    validate_and_submit_surveydata_main('', 5, jsonObj_old);
}

function get_RF_Tracking(mode_class, t_new_id) {
    try {

        var selected_mode = $("." + mode_class + " input").val();
        var q_jsonobj = [];
        q_jsonobj.push({
            'mode': selected_mode,
            'isOldLogs': false
        });

        loading();

        //var resObj = { "RfScreenShot": "https://jsonformatter.org/img/logo1.webp", "ChartScreenShot": "https://jsonformatter.org/img/logo2.webp", "CellId": "123456", "RxLevel": "45678" };
        //var con_autofill_data = $("#hdn_rf_" + t_new_id + "").val();
        //con_autofill_data = JSON.parse(con_autofill_data);

        //for (var key in resObj) {

        //    // configured autofill
        //    for (caf = 0; caf < con_autofill_data.length; caf++) {
        //        var fieldname = con_autofill_data[caf].fieldname;
        //        if (fieldname == key) {
        //            var classname = con_autofill_data[caf].classname;
        //            var ans = resObj[fieldname];

        //            if (ans == "" || ans == null || ans == undefined) { }
        //            else {
        //                autofill_data_by_class(classname, ans);
        //            }
        //            break;
        //        }
        //    }
        //}

        cordova.exec(function (e) {
            var resObj = e;
            var con_autofill_data = $("#hdn_rf_" + t_new_id + "").val();
            con_autofill_data = JSON.parse(con_autofill_data);

            for (var key in resObj) {

                // configured autofill
                for (caf = 0; caf < con_autofill_data.length; caf++) {
                    var fieldname = con_autofill_data[caf].fieldname;
                    if (fieldname == key) {
                        var classname = con_autofill_data[caf].classname;
                        var ans = resObj[fieldname];

                        if (ans == "" || ans == null || ans == undefined) { }
                        else {
                            autofill_data_by_class(classname, ans);
                        }
                        break;
                    }
                }
            }
            loading_hide();

        }, onfail_rf, 'RfTrackPlugin', 'anAction', q_jsonobj);

    } catch (e) {
        alert1(e + '_get_RF_Tracking()');
    }
}

function onfail_rf(e) {
    // back button press from plugin
    loading_hide();
}

// make photo entry for autofill
function check_photo_entry_for_autofill(imageData, img_id_type22, img_que_id, img_div_id) {
    try {
        var t_id = curr_survey_data["t_id"];
        var step = curr_survey_data["step"];
        var check_type = curr_survey_data["check_type"];

        var type22_popup = $('.popup-type22:visible');
        if (type22_popup.length > 0) {
            //$("#popover_viewphoto").parent().hide();

            var type22_img_que_id = img_id_type22;
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
        cordova.exec(function (img_div_id) {
            // success
            onPhotoDataSuccess_autofill('update', imageData, img_id_type22, img_que_id, img_div_id);
        }, function () {
            // fail
            onPhotoDataSuccess_autofill('insert', imageData, img_id_type22, img_que_id, img_div_id);
        }, 'SqlitePlugin', 'showValues', q_jsonobj);
    }
    catch (e) {
        alert1(e + '_check_photo_entry_for_autofill()');
    }
}

// Get base64 of photo captured by device successfully
function onPhotoDataSuccess_autofill(t_query_type, imageData, img_id_type22, img_que_id, img_div_id) {
    try {

        curr_query_type = t_query_type;

        var curr_form_flag = form_flag;
        form_has_changed = "true";                      //to get confirmation on back btn while editing form

        var photo_type = curr_survey_data["photo_type"];
        if (photo_type == "" || photo_type == null || photo_type == undefined) {
            photo_type = "";
        }

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
        p_name = p_name + '_' + t_row_index_no;

        storage.setItem('p_name', JSON.stringify(p_name));

        var answer = [];
        answer.push(imageData.toString(), p_name, '', '', '', '', photo_type);

        var index = find_index_by_que_id(curr_form_flag, img_que_id);
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

        var step = curr_survey_data["step"];
        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var match_temp_id = list_data[0].match_temp_id;
        if (match_temp_id == "" || match_temp_id == null || match_temp_id == undefined) {
            match_temp_id = "";
        }

        var prop_name = $("#" + img_div_id + "").attr('name');
        var img_path = imageData;
        var t_id = curr_survey_data["t_id"];
        var step = curr_survey_data["step"];
        var check_type = curr_survey_data["check_type"];

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
        cordova.exec(function () {
            // alert1("Photo has been saved successfully !");
            storage.setItem('crash_status', JSON.stringify('0'));
            curr_btn_mode = "";
            loading_hide();
        }, onfail_request, 'SqlitePlugin', 'insertValuse', q_jsonobj);
    } catch (e) {
        alert1(e + "_onPhotoDataSuccess_autofill()")
        storage.setItem('crash_status', JSON.stringify('0'));
        curr_btn_mode = "";
        loading_hide();
    }
}

function get_RF_Tracking_invoice(mode_class, t_new_id) {
    try {

        alert("RF data will recovered, if any.");

        var q_jsonobj = [];
        q_jsonobj.push({
            'mode': "",
            'isOldLogs': true
        });

        //var resObj = { "RfScreenShot": "https://jsonformatter.org/img/logo1.webp", "ChartScreenShot": "https://jsonformatter.org/img/logo2.webp", "CellId": "123456", "RxLevel": "45678" };
        //var con_autofill_data = $("#hdn_rf_" + t_new_id + "").val();
        //con_autofill_data = JSON.parse(con_autofill_data);

        //for (var key in resObj) {

        //    // configured autofill
        //    for (caf = 0; caf < con_autofill_data.length; caf++) {
        //        var fieldname = con_autofill_data[caf].fieldname;
        //        if (fieldname == key) {
        //            var classname = con_autofill_data[caf].classname;
        //            var ans = resObj[fieldname];

        //            if (ans == "" || ans == null || ans == undefined) { }
        //            else {
        //                autofill_data_by_class(classname, ans);
        //            }
        //            break;
        //        }
        //    }
        //}
       

        cordova.exec(function (e) {
            var resObj = e;
            var con_autofill_data = $("#hdn_rf_" + t_new_id + "").val();
            con_autofill_data = JSON.parse(con_autofill_data);

            for (var key in resObj) {

                // configured autofill
                for (caf = 0; caf < con_autofill_data.length; caf++) {
                    var fieldname = con_autofill_data[caf].fieldname;
                    if (fieldname == key) {
                        var classname = con_autofill_data[caf].classname;
                        var ans = resObj[fieldname];

                        if (ans == "" || ans == null || ans == undefined) { }
                        else {
                            autofill_data_by_class(classname, ans);
                        }
                        break;
                    }
                }
            }
            storage.setItem('crash_status', JSON.stringify('0'));

            loading_hide();

        }, onfail_rf, 'RfTrackPlugin', 'anAction', q_jsonobj);

    } catch (e) {
        alert1(e + '_get_RF_Tracking_invoice()');
    }
}

function onfail_rf() {
    storage.setItem('crash_status', JSON.stringify('0'));
    loading_hide();
}