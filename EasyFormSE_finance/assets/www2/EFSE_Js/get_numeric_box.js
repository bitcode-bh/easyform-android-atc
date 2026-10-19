
function get_ar_measurement(t_ele_id, t_type, t_target_class) {
    storage.setItem('ar_measure_ele_id', JSON.stringify(t_ele_id));

    if (t_type == 'in' || t_type == 'cm' || t_type == 'ft' || t_type == 'm') {
        // old plugin for indoor ar measurement

        var q_jsonobj = [];
        q_jsonobj.push({
            'ar_measurement_type': t_type,
        });
        //cordova.exec(onsuccess_get_measurement, onfail_plugin, 'ARMeasure', 'anAction', q_jsonobj);
        cordova.exec(function (e) {
                                 var myArray = JSON.parse(e);
                                 var code = myArray[0].code;
                                 var curr_img_div_id = JSON.parse(storage.getItem('ar_measure_ele_id'));
                                 var smallImage = document.getElementById(curr_img_div_id);
                                 smallImage.value = code;
                             }, onfail_numeric_plugin, 'ARMeasure', 'anAction', q_jsonobj);
    }
    else {
        // new plugin for outdoor tower height measurement
        t_type = t_type.replace("c_", "");
  
        if (t_target_class == "" || t_target_class == null || t_target_class == undefined) {
            var img_array = [];
        }
        else {
            var img_array = get_image_param_for_upload(t_target_class);
        }

        var q_jsonobj = [];
        q_jsonobj.push({
            'ar_measurement_type': t_type,
            'img_array': img_array
        });
        cordova.exec(function (e) {
            var myArray = JSON.parse(e);
            var code = myArray[0].code;
            var curr_img_div_id = JSON.parse(storage.getItem('ar_measure_ele_id'));
            var smallImage = document.getElementById(curr_img_div_id);
            smallImage.value = code;

            if (img_array.length > 0) {
                // autofill ar image in below image 
                var imageData = myArray[0].photo_path;
                fill_ar_photo_to_bottom_img(imageData, t_target_class);
            }
        }, onfail_numeric_plugin, 'ArMeasurePlugin', 'anAction', q_jsonobj);
    }
}

// if mobile number is saved in the mobile then video call will be initiated otherwise chat window will be open
function open_whatsapp(num_id) {
    var mob_number = $("#" + num_id + "").val();
    if (mob_number == "" || mob_number == null || mob_number == undefined || mob_number == "N/A") {
        alert("Please enter contact number first!");
    }
    else {
        if (mob_number.length != 10) {
            alert("Contact Number must be 10 digit long!");
        }
        else {
            var q_jsonobj = [];
            q_jsonobj.push({
                'mob_number': mob_number
            });

            cordova.exec(onsuccess_numeric_plugin, onfail_numeric_plugin, 'openWhatsappPlugin', 'anAction', q_jsonobj);
        }
    }
}

function onsuccess_numeric_plugin(e) { }
function onfail_numeric_plugin(e) { }

get_image_param_for_upload = (t_target_class) => {

    var q_jsonobj = [];

    var img_id = $("." + t_target_class + " .item-input-field img").attr("id");
    if (img_id == "" || img_id == null || img_id == undefined) {
        // no image found with target class
    }
    else {
        var que_id = $("#" + img_id + "").attr("que_id");
        var company_id = JSON.parse(storage.getItem('company_id'));
        var user_id = JSON.parse(storage.getItem('user_id'));
        var c_is_online = JSON.parse(storage.getItem('c_is_online'));

        let form_flag_temp = form_flag;
        if (form_flag_temp == 6) {
            var check_type = JSON.parse(storage.getItem('check_type_task'));
            var siteid = 0;
        }
        else if (form_flag_temp == 0 && c_is_online == 1) {
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

        if ((form_flag_temp == 0 || form_flag_temp == 1) && c_is_online == 1) {
            // normal online form
            var sid = JSON.parse(storage.getItem('server_task_id'));
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

        var step = curr_survey_data["step"];
        if (step == '' || step == null || step == undefined) {
            step = '1';
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

        var date_s = new Date();
        var time = date_s.getTime();
        var camera_type = localStorage.getItem('Camera_Type');
        var camera_edit = localStorage.getItem('Camera_Edit');

        var query = "select imei from Login_Master";
        q_jsonobj.push({
            data: query,
            p: "1",
            time: time,
            flag: "false",
            width: "640",
            height: "480",
            quality: "50",
            burstmode: "false",
            camera_type: camera_type,
            camera_edit: camera_edit,
            photo_type: "camera",
            flowParamData: flowParamData,
            info: [],
            max_file_size: 5
        });
    }

    return q_jsonobj;
}

fill_ar_photo_to_bottom_img = (imageData, t_target_class) => {

    var img_id = $("." + t_target_class + " .item-input-field img").attr("id");
    if (img_id == "" || img_id == null || img_id == undefined) {
        // no image found with target class
    }
    else {
        $("#" + img_id + "").attr("src", imageData);
        var img_index = $("." + t_target_class + " img").attr("index");
        img_index = parseInt(img_index);

        var date_s = new Date();
        var time = date_s.getTime();
        var company_id = JSON.parse(storage.getItem('company_id'));
        var user_id = JSON.parse(storage.getItem('user_id'));

        let curr_form_flag = form_flag;
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
        answer.push(imageData.toString(), p_name, '', '', '', '', "");

        if (curr_form_flag == 0 || curr_form_flag == 6 || curr_form_flag == 7) {
            let task_create_popup = $('.popup-new-task-create.modal-in:visible');
            if (task_create_popup.length > 0) {
                //new task create popup [FT-08052025]
                jsonObj_task_add[img_index].ans = answer;
            }
            else {
                // normal form // task form // customer form
                jsonObj_old[img_index].ans = answer;
            }
        } else if (curr_form_flag == 1 || curr_form_flag == 4 || curr_form_flag == 5) {
            // type22 form
            jsonObj_type22[img_index].ans = answer;
        } else if (curr_form_flag == 2 || curr_form_flag == 3) {
            // type23 form
            jsonObj_type23[img_index].ans = answer;
        } else if (curr_form_flag == 12) {
            //group task
            var hdn_ans_str = JSON.stringify(answer);
            hdn_ans_str = encodeURIComponent(hdn_ans_str);
            $("#hdn_cbtn_ans_" + hdn_ans_id + "").val(hdn_ans_str);
        } else if (curr_form_flag == 8) {
            // user form
            jsonObj_user_add[img_index].ans = answer;
        }
    }   
}
