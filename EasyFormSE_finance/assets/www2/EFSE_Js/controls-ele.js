
//MkControls.prototype.build_type_1_text = function () {
//    try {
//        var str = '';
//        return str;
//    }
//    catch (e) {
//        alert1(e + '_build_type_1_text()');
//    }
//};

//var obj = {
//    new_id: new_id,
//    value: jsonObj[i].value,
//    default_val: default_val,
//    enable_disable: enable_disable,
//    param: param,
//    rdo_Array: rdo_Array,
//    weightage_Array: weightage_Array,
//    br_str: br_str
//}

//var control = new MkControls(obj);
//newdiv += control.build_type_1();
//newdiv += '</div>';

function focus_on_element(ele) {
    $('#' + ele).focus();
}

//not-empty-state   //filled class need to add

var MkControls = function (obj) {
    // ReadChecksheet
    // common 
    this.read_type = obj.read_type;
    this.ans = obj.ans;
    this.que_id = obj.que_id;
    this.name = obj.name;
    this.new_id = obj.new_id;
    this.value = obj.value;
    this.default_val = obj.default_val;
    this.enable_disable = obj.enable_disable;
    this.param = obj.param;
    this.weightage_Array = obj.weightage_Array;
    this.read_only = obj.read_only;
    this.label_name = obj.label_name;
    this.misc_Array = obj.misc_Array;

    // Type 1
    this.textbox_type = obj.textbox_type;
    this.box_view = obj.box_view;
    this.speech_btn = obj.speech_btn;

    // Type 2
    this.rdo_Array = obj.rdo_Array;
    //this.br_str = obj.br_str;

    // Type 3
    this.ddl_Array = obj.ddl_Array;

    // Type 4 / 12 / 17
    this.is_hide = obj.is_hide;

    // Type 6
    this.chk_Array = obj.chk_Array;

    // Type 7
    this.index = obj.index;
    this.src_str = obj.src_str;
    this.target_class = obj.target_class;
    this.old_photo_class = obj.old_photo_class;
    this.detected_text = obj.detected_text;
    this.selected_text = obj.selected_text;

    // Type 8
    this.main_class = obj.main_class;
    this.ref_class = obj.ref_class;
    this.dur_class = obj.dur_class;
    this.dur_type = obj.dur_type;
    this.duration = obj.duration;
    this.mode = obj.mode;
    this.current_datetime_btn = obj.current_datetime_btn;
    this.current_datetime_btn_text = obj.current_datetime_btn_text;

    // Type 12
    this.start_range = obj.start_range;
    this.end_range = obj.end_range;

    // Type 17
    this.btn_text = obj.btn_text;

    // Type 20
    this.param1 = obj.param1;
    this.param_qr = obj.param_qr;
    this.clickcheck = obj.clickcheck;
    this.window_style = obj.window_style;
    this.view_style = obj.view_style;
    this.customer_checksheetid = obj.customer_checksheetid;

    // Type 22
    this.add_button = obj.add_button;
    this.display_add_btn = obj.display_add_btn;

    // Type 23
    this.step = obj.step;
    this.is_editable = obj.is_editable;

    // Type 25
    this.photo_type = obj.photo_type;

    // Type 26
    this.mob_ext = obj.mob_ext;
    this.upload_type = obj.upload_type;
    this.parent_task_id = obj.parent_task_id;
    this.max_file_size = obj.max_file_size;

    // Type 30
    this.view_type = obj.view_type;
    this.RowQueryWhere = obj.RowQueryWhere;
    this.confirm_text = obj.confirm_text;

    /// ReadSurvey 
    // Type 1
    this.curr_clps_new_id = obj.curr_clps_new_id;
    this.old_ans = obj.old_ans;
    this.checksheetid = obj.checksheetid;

};

MkControls.prototype.build_type_1_text = function () {
    try {
        var str = '';
        var textarea = 0;
        if (this.enable_disable == 'disabled') {
            var ico_str = 'fa-ban';
        }
        else {
            var ico_str = 'fa-sort-alpha-asc';
        }

        if (this.read_type == "readchecksheet") {
            // readchecksheet
            var ans_str = this.default_val;
        }
        else {
            var ans_str = this.ans;
            if (ans_str == '' || ans_str == null || ans_str == undefined) {
                var ans_str = this.default_val;
            }
        }

        var readonly_str = '';
        if (this.enable_disable == 'disabled') {
            readonly_str = 'readonly';
        }

        var param_focus = "onclick=focus_on_element('txt_" + this.new_id + "');";
        str += '<div class="item-input item-input-field form-div" ' + this.enable_disable + '>';
        if (this.box_view == "textarea") {
            // textarea
            if (ans_str == "" || ans_str == null || ans_str == undefined) {
                var rows_len = "2";
            }
            else {
                var rows_len = ans_str.split("\n").length;
            }

            if (ans_str.includes('"') == true) {
                var t_quote_found = 1;
            }
            else {
                var t_quote_found = 0;
            }

            if (t_quote_found == 0) {
                str += '<textarea cols="20" rows="' + rows_len + '" ' + this.param + ' class="form-ele" id="txt_' + this.new_id + '" onkeydown="ResizeBox(event)" value="'
                    + ans_str + '" ' + readonly_str + 'style="resize:vertical !important;">' + ans_str + '</textarea><i class="fa ' + ico_str + ' form-ico" ' + this.enable_disable + ' ' + param_focus + '></i>';
            }
            else {
                str += '<textarea cols="20" rows="' + rows_len + '" ' + this.param + ' class="form-ele" id="txt_' + this.new_id + '" onkeydown="ResizeBox(event)" value=\'' + ans_str + '\' ' + readonly_str + 'style="resize:vertical !important;">' + ans_str + '</textarea><i class="fa ' + ico_str + ' form-ico" ' + this.enable_disable + ' ' + param_focus + '></i>';
            }
        }
        else {
            // textbox/password/email

            if (ans_str.includes('"') == true) {
                var t_quote_found = 1;
            }
            else {
                var t_quote_found = 0;
            }

            if (t_quote_found == 0) {
                str += '<input onkeydown="ResizeBox(event)" ' + this.param + ' style="white-space: pre; word-break: break-word" class="form-ele" type="'
                    + this.textbox_type + '" id="txt_' + this.new_id + '" value="' + ans_str + '" ' + readonly_str + ' ' + this.enable_disable + '>';
            }
            else {
                str += '<input onkeydown="ResizeBox(event)" ' + this.param + ' style="white-space: pre; word-break: break-word" class="form-ele" type="'
                    + this.textbox_type + '" id="txt_' + this.new_id + '" value=\'' + ans_str + '\' ' + readonly_str + ' ' + this.enable_disable + '>';
            }

            if (this.speech_btn == 'true') {
                var param_speech = "onclick=convert_speech_to_text('#txt_" + this.new_id + "');";
                str += '<i class="fa fa-microphone form-ico force_show" ' + this.enable_disable + ' ' + param_speech + '></i>';
            }
            else {

                if (this.textbox_type == 'password') {
                    var param_pass = "onclick='show_pass1(this)'";
                    str += '<i class="fa fa-eye-slash form-ico force_show" ' + this.enable_disable + ' ' + param_pass + ' ' + param_focus + '></i>';
                }
                else {
                    str += '<i class="fa ' + ico_str + ' form-ico" ' + this.enable_disable + ' ' + param_focus + '></i>';
                }
            }

        }
        str += '</div>'
        return str;
    }
    catch (e) {
        alert1(e + '_build_type_1_text()');
    }
};

MkControls.prototype.build_type_2_radio = function () {
    try {
        var str = '';

        if (this.view_type == "toggle" || this.view_type == "toggle_hidden") {

            // toggle switch
            if (this.view_type == "toggle") {
                str += '<div class="switch radio-count-' + this.rdo_Array.length + '">';
            }
            else {
                str += '<div class="switch radio-count-' + this.rdo_Array.length + ' switch-hidden">';
            }

            let switch_ans_str = '';
            for (var r = 0; r < this.rdo_Array.length; r++) {
                if (this.weightage_Array == '' || this.weightage_Array == null || this.weightage_Array == undefined) {
                    var weightage = 1;
                } else {
                    var weightage = this.weightage_Array[r];
                }

                var checked_str = '';
                var val_str = new String(this.rdo_Array[r]);
                val_str = val_str.trim().toLowerCase();
                if (this.read_type == "readchecksheet") {
                    // readchecksheet
                    var str2 = new String(this.default_val);
                    str2 = str2.trim().toLowerCase();
                }
                else {
                    // readsurvey
                    var str2 = new String(this.ans);
                    str2 = str2.trim().toLowerCase();

                    if (str2 == '' || str2 == null || str2 == undefined) {
                        str2 = new String(this.default_val);
                        str2 = str2.trim().toLowerCase();
                    }
                }

                if (val_str == str2) {
                    checked_str = 'checked="checked"';
                    switch_ans_str = this.rdo_Array[r];
                }

                str += '<input type="radio" ' + checked_str + ' class="switch-input" name="rdogroup_' + this.new_id + '" id="rdo_' + this.new_id + '_' + r + '" value="'
                    + this.rdo_Array[r] + '" ' + this.enable_disable + ' alt="' + weightage + '" onchange="' + this.param + '">';

                if (this.view_type == "toggle") {
                    str += '<label for="rdo_' + this.new_id + '_' + r + '" class="switch-label switch-label-' + r + '">' + this.rdo_Array[r] + '</label>';
                }
                else {
                    // toggle hidden
                    str += '<label for="rdo_' + this.new_id + '_' + r + '" class="switch-label switch-label-' + r + '" onclick="set_switch_hidden_ans(this)">' + this.rdo_Array[r] + '</label>';
                }
            }

            str += '<span class="switch-selector"></span>';

            if (this.view_type == "toggle_hidden") {
                str += '<span class="spn_hdn_switch">' + switch_ans_str + '</span>';
            }

            str += '</div>';
        }
        else {
            // normal radio
            if (this.view_type == "horizontal") {
                str += '<div class="list-block form-div horizontal-rdo"><ul>';
            }
            else {
                str += '<div class="list-block form-div"><ul>';
            }

            for (var r = 0; r < this.rdo_Array.length; r++) {
                if (this.weightage_Array == '' || this.weightage_Array == null
                    || this.weightage_Array == undefined) {
                    var weightage = 1;
                } else {
                    var weightage = this.weightage_Array[r];
                }

                str += '<li ' + this.enable_disable + '><label class="label-radio item-content">';

                var checked_str = '';
                var val_str = new String(this.rdo_Array[r]);
                val_str = val_str.trim().toLowerCase();
                if (this.read_type == "readchecksheet") {
                    // readchecksheet
                    var str2 = new String(this.default_val);
                    str2 = str2.trim().toLowerCase();
                }
                else {
                    // readsurvey
                    var str2 = new String(this.ans);
                    str2 = str2.trim().toLowerCase();

                    if (str2 == '' || str2 == null || str2 == undefined) {
                        str2 = new String(this.default_val);
                        str2 = str2.trim().toLowerCase();
                    }
                }

                if (val_str == str2) {
                    checked_str = 'checked="checked"';
                }
                str += '<input type="radio" ' + checked_str + ' name="rdogroup_' + this.new_id + '" id="rdo_' + this.new_id + '_' + r + '" value="'
                    + this.rdo_Array[r] + '" ' + this.enable_disable + ' alt="' + weightage + '" onchange="' + this.param + '">';

                if (F7_device == 'android') {
                    str += '<div class="item-media"><i class="icon icon-form-radio"></i></div>';
                }

                str += '<div class="item-inner"><div class="item-title">' + this.rdo_Array[r] + '</div></div></label></li>';
            }
            str += '</ul></div>';
        }


        return str;
    }
    catch (e) {
        alert1(e + '_build_type_2_radio()');
    }
};

MkControls.prototype.build_type_3_dropdown = function () {
    try {
        //var name_str = '';
        //if (this.ans.length == 2) {
        //    this.ddl_Array = JSON.parse(this.ans[1]);
        //    this.ans = this.ans[0];
        //    name_str = encodeURIComponent(JSON.stringify(this.ddl_Array));
        //}

        var str = '';
        str += '<div class="item-input item-input-field form-div" ' + this.enable_disable + '>';
        str += '<select id="ddl_' + this.new_id + '" class="margin" onChange="'
            + this.param + '" ' + this.enable_disable + ' style="width:93%; display:inline-block;height:auto !important;white-space:normal;margin-top:8px"><option>Select Value</option>';

        for (var j = 0; j < this.ddl_Array.length; j++) {
            if (this.weightage_Array == '' || this.weightage_Array == null || this.weightage_Array == undefined) {
                var weightage = 1;
            } else {
                var weightage = this.weightage_Array[j];
            }

            var selected_str = '';
            var val_str = new String(this.ddl_Array[j]);
            val_str = val_str.trim().toLowerCase();
            if (this.read_type == "readchecksheet") {
                // readchecksheet
                var str2 = new String(this.default_val);
                str2 = str2.trim().toLowerCase();
            }
            else {
                // readsurvey
                var str2 = new String(this.ans);
                str2 = str2.trim().toLowerCase();
            }

            if (val_str == str2) {
                selected_str = "selected='checked'";
            }

            str += "<option " + selected_str + " alt='" + weightage + "' value='" + this.ddl_Array[j] + "'>" + this.ddl_Array[j] + "</option>";
        }

        if (this.enable_disable == 'disabled') {
            var ico_str = 'fa-ban';
        }
        else {
            var ico_str = 'fa-chevron-circle-down';
        }
        str += '</select><i class="fa ' + ico_str + ' form-ico" ' + this.enable_disable + ' style="margin-left:-12%"></i></div>';
        return str;
    }
    catch (e) {
        alert1(e + '_build_type_3_dropdown()');
    }
};

MkControls.prototype.build_type_4_number = function () {
    try {
        var str = '';
        if (this.read_type == "readchecksheet") {
            // readchecksheet
            var ans_str = this.default_val;
        }
        else {
            // readsurvey
            var ans_str = this.ans;
            if (ans_str == '' || ans_str == null || ans_str == undefined) {
                ans_str = this.default_val;
            }
        }

        if (this.enable_disable == 'disabled') {
            var ico_str = '<i class="fa fa-ban form-ico" ' + this.enable_disable + '></i>';
        }
        else {

            var misc_Array = this.misc_Array;
            var value = misc_Array[0].value;
            if (value == '' || value == null || value == undefined) {
                var ar_measurement_type = "";
                var whatsapp_call = "false";
                var target_class = "";
            } else {
                value = itemObj._checkStrObj(misc_Array[0].value);
                var ar_measurement_type = value[0].ar_measurement_type;
                var whatsapp_call = value[0].whatsapp_call;
                var target_class = value[0].target_class;
            }

            if (ar_measurement_type == '' || ar_measurement_type == null || ar_measurement_type == undefined || ar_measurement_type == 'false') {
                var param_focus = "focus_on_element('txtno_" + this.new_id + "');";
                var ico_str = '<i class="fa fa-sort-numeric-asc form-ico" ' + this.enable_disable + ' onclick="' + param_focus + '"></i>';
            }
            else {
                // ar_measurement_type = "in/cm/ft/m"
                var param_click = "get_ar_measurement('txtno_" + this.new_id + "', '" + ar_measurement_type + "', '" + target_class + "');";
                var ico_str = '<i class="fa fa-cube form-ico force_show" ' + this.enable_disable + ' onclick="' + param_click + '" style="visibility: visible"></i>';
            }

            if (whatsapp_call == "true") {
                var param_click = "open_whatsapp('txtno_" + this.new_id + "');";
                var ico_str = '<i class="fa fa-whatsapp form-ico force_show" ' + this.enable_disable + ' onclick="' + param_click + '" style="font-size: 25px; margin-top: 5px"></i>';
            }
        }

        if (F7_device == 'ios') {
            var param_press = 'onkeypress="return isNumberKey(event)"';
        }
        else {
            var param_press = '';
        }

        str += '<div class="item-input item-input-field form-div" ' + this.enable_disable + '>';
        str += '<input type="number" onkeydown="ResizeBox(event)" ' + param_press + ' ' + this.param
            + ' style="white-space: pre; word-break: break-word" class="form-ele" id="txtno_' + this.new_id + '" is_hide="' + this.is_hide + '" value="'
            + ans_str + '" ' + this.enable_disable + '>' + ico_str + '</div>';
        return str;
    }
    catch (e) {
        alert1(e + '_build_type_4_number()');
    }
};

MkControls.prototype.build_type_5_label = function () {
    try {
        var str = '';
        str += '<label class="lbl_type5" style="display:block; width:92%; word-break: break-word; font-size: 15px; font-family: calibri">' + this.value + '</label>';
        return str;
    }
    catch (e) {
        alert1(e + '_build_type_5_label()');
    }
};

MkControls.prototype.build_type_6_checkbox = function () {
    try {
        var str = '';
        if (this.read_type == "readchecksheet") {
            // readchecksheet
            var temp_Array = this.default_val;
        }
        else {
            // readsurvey
            var temp_Array = this.ans;
        }

        str += '<div class="list-block form-div"><ul>';
        for (var c = 0; c < this.chk_Array.length; c++) {
            if (this.weightage_Array == '' || this.weightage_Array == null || this.weightage_Array == undefined) {
                var weightage = 1;
            } else {
                var weightage = this.weightage_Array[c];
            }

            str += '<li ' + this.enable_disable + '><label class="label-checkbox item-content">';

            var checked_str = '';
            if (temp_Array.length > 0) {
                for (c1 = 0; c1 < temp_Array.length; c1++) {
                    var val_str = new String(this.chk_Array[c]);
                    val_str = val_str.trim().toLowerCase();
                    var str2 = new String(temp_Array[c1]);
                    str2 = str2.trim().toLowerCase();

                    if (val_str == str2) {
                        checked_str = 'checked="checked"';
                        break;
                    }
                }
            }

            str += '<input type="checkbox" ' + checked_str + ' onchange="' + this.param + '" name="chkgroup_' + this.new_id + '" id="chk_' + this.new_id + '_' + c + '" alt="' + weightage
                + '" value="' + this.chk_Array[c] + '" ' + this.enable_disable + '>';
            str += '<div class="item-media"><i class="icon icon-form-checkbox"></i></div>';
            str += '<div class="item-inner"><div class="item-title">' + this.chk_Array[c] + '</div></div></label></li>';
        }
        str += '</ul></div>';
        return str;
    }
    catch (e) {
        alert1(e + '_build_type_6_checkbox()');
    }
};

MkControls.prototype.build_type_7_camera = function () {
    try {

        if (form_flag == 2) {
            this.enable_disable = "";
        }

        var str = '';
        str += '<div class="item-input item-input-field form-div" ' + this.enable_disable + '>';

        var onclick_str = "onclick = '" + this.param + "'";
        var onerror_str = "onerror = '" + this.param1 + "'";

        var detected_text = this.detected_text;
        if (detected_text == "" || detected_text == null || detected_text == undefined) {
            detected_text = '';
        }

        str += '<img src="' + this.src_str + '" id="cbtn_' + this.new_id
            + '" ' + onclick_str + ' ' + onerror_str + ' detected_text="' + detected_text + '" index="' + this.index + '" style="height:50px; width:50px; margin-left: 5px; border-radius: 7px" name="' + this.name + '" target_class="' + this.target_class + '" old_photo_class="' + this.old_photo_class + '" que_id = "' + this.que_id + '" ' + this.enable_disable + '/>';

        var selected_text = this.selected_text;
        if (selected_text == "" || selected_text == null || selected_text == undefined) { }
        else {
            str += '<label class="lbl_type5" style="display: inline; left: 60px; font-size: 13px; position: absolute;"><b>Reading:  </b>' + selected_text + '</label>';
        }

        str += '</div>';
        return str;
    }
    catch (e) {
        alert1(e + '_build_type_7_camera()');
    }
};

MkControls.prototype.build_type_8_calendar = function () {
    try {
        var str = '';
        var current_datetime_btn = this.current_datetime_btn;
        var current_datetime_btn_text = this.current_datetime_btn_text;

        if (this.read_type == "readchecksheet") {
            // readchecksheet
            var ans_str = this.default_val;
        }
        else {
            // readsurvey
            var ans_str = this.ans;
            //if (ans_str == '' || ans_str == null || ans_str == undefined) {
            //    ans_str = this.default_val;
            //}
            if (current_datetime_btn == "true") {
                if (ans_str == '' || ans_str == null || ans_str == undefined) { }                       //if save n exit mode then ans_str is blank so dont disable for that case [22072021]
                else {
                    this.enable_disable = 'disabled';
                }
            }
        }

        if (this.enable_disable == 'disabled') {
            var ico_str = 'fa-ban';
        }
        else {
            var ico_str = 'fa-calendar';
        }

        str += '<div class="item-input item-input-field form-div" ' + this.enable_disable + '>';

        if (current_datetime_btn == "true") {
            var param_datetime = "get_current_date_time_on_btn_click('" + this.new_id + "', '" + this.mode + "')";

            str += '<div class="group_' + this.new_id + '" style="position:relative;">';
            str += '<input id="cal_' + this.new_id + '" class="form-ele-med ' + this.main_class + '" type="text" data-field="'
                + this.mode + '" value="' + ans_str + '" dur_class="' + this.dur_class + '" ref_class="' + this.ref_class + '" duration_type="' + this.dur_type + '" duration="' + this.duration + '" disabled style="width:50% !important;" >';
            str += '<button type="button" id="btn_curr_dateTime_' + this.new_id + '" class="button button-fill form-ico force_show" onclick="' + param_datetime + '" style="width:3%;min-width:50px;height:25px;line-height:25px;margin-top:8px;margin-left:5px;font-size:11px;text-transform: capitalize;" ' + this.enable_disable + '>' + current_datetime_btn_text + '</button>';
            str += '<i class="fa ' + ico_str + ' form-ico" ' + this.enable_disable + '></i>';
        }
        else {
            str += '<div class="group_' + this.new_id + '">';
            str += '<input id="cal_' + this.new_id + '" class="form-ele ' + this.main_class + '" type="text" data-field="'
                + this.mode + '" value="' + ans_str + '" dur_class="' + this.dur_class + '" ref_class="' + this.ref_class + '" duration_type="' + this.dur_type + '" duration="' + this.duration + '" '
                + this.enable_disable + ' ><i class="fa ' + ico_str + ' form-ico" ' + this.enable_disable + '></i>';
        }
        str += '</div>';
        str += '<div id="dtBox_' + this.new_id + '"></div>';
        str += '</div>';
        return str;
    }
    catch (e) {
        alert1(e + '_build_type_8_calendar()');
    }
};

MkControls.prototype.build_type_9_sign = function () {
    try {
        var str = '';

        var onclick_str = "onclick = '" + this.param + "'";
        var onerror_str = "onerror = '" + this.param1 + "'";

        str += '<div class="item-input item-input-field form-div" ' + this.enable_disable + '>';

        str += '<img src="' + this.src_str + '" id="sign_' + this.new_id
            + '" ' + onclick_str + ' ' + onerror_str + ' style="height:50px; width:50px; margin-left:5px; border-radius: 7px" name="' + this.name + '" ' + this.enable_disable + ' />';
        str += '</div>';
        return str;
    }
    catch (e) {
        alert1(e + '_build_type_9_sign()');
    }
};

MkControls.prototype.build_type_12_range = function () {
    try {
        if (this.read_type == "readchecksheet") {
            // readchecksheet
            var ans_str = this.default_val;
        }
        else {
            // readsurvey
            var ans_str = this.ans;
        }
        var placeholder_str = 'Enter value in between ' + this.start_range + ' and ' + this.end_range + '';

        var str = '';
        if (this.textbox_type == 'numeric') {
            // range validation with numeric box
            if (this.enable_disable == 'disabled') {
                var ico_str = 'fa-ban';
            }
            else {
                var ico_str = 'fa-compress';
            }

            str += '<div class="item-input item-input-field form-div" ' + this.enable_disable + '>';
            str += '<input type="number" id="txtrange_' + this.new_id + '" is_hide="' + this.is_hide + '" placeholder="' + placeholder_str + '" value="'
                + ans_str + '" ' + this.enable_disable + ' class="form-ele"><i class="fa ' + ico_str + ' form-ico" ' + this.enable_disable + '></i></div>';
        } else {
            // range validation with range
            if (this.enable_disable == 'disabled') {
                var ico_str = 'fa-ban';
            }
            else {
                var ico_str = 'fa-sliders';
            }

            if (ans_str == '' || ans_str == null || ans_str == undefined) {
                ans_str = '0';
            }
            var param = "$('#lblrange_" + this.new_id + "').html(this.value);";
            str += '<div class="range-slider item-input item-input-field form-div" style="padding-top:3px"><table class="form-ele" style="padding-top:5px"><tr><td style="width:90%">';
            str += '<input type="range" style="width: 100%; vertical-align:middle" id="txtrange_' + this.new_id + '" min="' + this.start_range + '" max="'
                + this.end_range + '" value="' + ans_str + '" ' + this.enable_disable + ' oninput="' + param + '" is_hide="' + this.is_hide + '"></td><td style="width:10%"><span id="lblrange_' + this.new_id
                + '"class="mkbadge button button-fill" style="margin-left:5px" ' + this.enable_disable + '>' + ans_str + '</span></td></tr></table><i class="fa ' + ico_str + '  form-ico" ' + this.enable_disable + '></i></div>';
        }
        return str;
    }
    catch (e) {
        alert1(e + '_build_type_12_range()');
    }
};

MkControls.prototype.build_type_13_user_latlong = function () {
    try {
        var str = '';
        str += '<div class="item-input item-input-field form-div" ' + this.enable_disable + '>';
        str += "<a id='btnLatLong_" + this.new_id + "' onclick = '" + this.param
            + "' class='button button-fill button-raised form-btn' " + this.enable_disable + ">Get LatLong</a></div>";
        return str;
    }
    catch (e) {
        alert1(e + '_build_type_13_user_latlong()');
    }
};

MkControls.prototype.build_type_15_MSL = function () {
    try {
        var str = '';
        str += '<div class="item-input item-input-field form-div" ' + this.enable_disable + '>';
        str += "<a id='btnMSL_" + this.new_id + "' onclick = '" + this.param
            + "' style='width:50%' class='button button-fill button-raised form-btn' " + this.enable_disable + ">Get MSL</a></div>";
        return str;
    }
    catch (e) {
        alert1(e + '_build_type_15_MSL()');
    }
};

MkControls.prototype.build_type_16_distance = function () {
    try {
        var str = '';
        str += '<div class="item-input item-input-field form-div" ' + this.enable_disable + '>';
        str += "<a id='btnDist_" + this.new_id + "' onclick = '" + this.param
            + "' style='width:50%' class='button button-fill button-raised form-btn' " + this.enable_disable + ">Get Distance</a></div>";
        return str;
    }
    catch (e) {
        alert1(e + '_build_type_16_distance()');
    }
};

MkControls.prototype.build_type_17_calculator = function () {
    try {
        if (this.read_type == "readchecksheet") {
            // readchecksheet
            var ans_str = '';
        }
        else {
            // readsurvey
            var ans_str = this.ans;
        }

        var str = '';
        if (this.enable_disable == 'disabled') {
            var ico_str = 'fa-ban';
        }
        else {
            var ico_str = 'fa-calculator';
        }

        str += '<div class="item-input item-input-field form-div" ' + this.enable_disable + '>';

        if (this.read_only == true) {
            str += '<input type="number" class="form-ele" is_hide="' + this.is_hide + '" placeholder="' + this.btn_text + '" value="' + ans_str + '" '
                + this.enable_disable + '><i class="fa ' + ico_str + ' form-ico" ' + this.enable_disable + '></i></div>';
        }
        else {
            str += '<input id="txt_Calc_' + this.new_id + '" type="number" class="form-ele" is_hide="' + this.is_hide + '" placeholder="' + this.btn_text + '" value="' + ans_str + '" '
                + this.enable_disable + '><i class="fa ' + ico_str + ' form-ico" onclick="' + this.param + '" ' + this.enable_disable + '></i></div>';
        }
        return str;
    }
    catch (e) {
        alert1(e + '_build_type_17_calculator()');
    }
};

MkControls.prototype.build_type_20_search = function () {
    try {
        if (this.read_type == "readchecksheet") {
            // readchecksheet
            var ans_value = '';
            var ans_id = '';
            var name = '0';
        }
        else {
            // readsurvey
            if (this.ans == "" || this.ans == null || this.ans == undefined) {
                //for is_reset='true'
                var ans_value = '';
                var ans_id = '';
                var name = '0';
            }
            else {
                var ans_value = this.ans[0];
                var ans_id = this.ans[1];
                var name = '1';
            }
        }

        var str = '';
        if (this.view_style == 'listview') {
            var second_ico = 'fa-th-list';
        }
        else {
            var second_ico = 'fa-th';
        }
        if (this.enable_disable == 'disabled') {
            var ico_str = '';
            second_ico = 'fa-ban';
            var third_ico = '';
        }
        else {
            var ico_str = 'fa-search';
            third_ico = 'fa-plus';
        }

        // new option for qr code scan
        if (this.param_qr == '') {
            var qr_code = 'false';
        }
        else {
            var qr_code = 'true';
        }

        var is_barcode = this.param_qr.includes("barcode");

        if (qr_code == 'true') {
            if (is_barcode == true) {
                var qr_ico_str = '<i id="btn20_QR_' + this.new_id + '" class="fa form-ico fa-barcode force_show" ' + this.enable_disable + ' style="margin-left:6px" onclick="' + this.param_qr + '" ></i>';
            }
            else {
                var qr_ico_str = '<i id="btn20_QR_' + this.new_id + '" class="fa form-ico fa-qrcode force_show" ' + this.enable_disable + ' style="margin-left:6px" onclick="' + this.param_qr + '" ></i>';
            }
        }
        else {
            var qr_ico_str = '<i id="btn20_ShowAll_' + this.new_id + '" class="fa form-ico ' + second_ico + '" style="margin-left:5px" onclick="' + this.param + '" ' + this.enable_disable + '></i>';
        }

        var add_customer_str = '';
        if (this.view_style == 'tableview' || this.view_style == 'listview') {
            if (this.customer_checksheetid == '' || this.customer_checksheetid == null || this.customer_checksheetid == undefined || this.customer_checksheetid == "0") { }
            else {
                var add_customer_str = '<i class="fa ' + third_ico + ' form-ico force_show" style="margin-top:10px; margin-left:5px" onclick="get_popup_to_add_item_online(' + this.customer_checksheetid + ')" ' + this.enable_disable + '></i>';
            }
        }

        str += '<div class="item-input item-input-field form-div" ' + this.enable_disable + '>';
        //str += '<input type="text" value="' + ans_value + '" title="' + ans_id + '" class="form-ele-med" id="search_item_name_Search_'
        //        + this.new_id + '" placeholder="Enter search value..." name="' + name + '" onchange="' + this.clickcheck + '" ' + this.enable_disable
        //        + '>' + qr_ico_str + '<i id="btn20_Search_'
        //        + this.new_id + '" class="fa ' + ico_str + ' form-ico" style="margin-top:6px" onclick="' + this.param1 + '" ' + this.enable_disable + '></i>';
        str += '<input type="text" value="' + ans_value + '" title="' + ans_id + '" class="form-ele-med" style="width:74% !important" id="search_item_name_Search_'
            + this.new_id + '" placeholder="Enter search value..." name="' + name + '" onchange="' + this.clickcheck + '" ' + this.enable_disable
            + '>' + add_customer_str + qr_ico_str + '<i id="btn20_Search_'
            + this.new_id + '" class="fa ' + ico_str + ' form-ico" style="margin-top:6px" onclick="' + this.param1 + '" ' + this.enable_disable + '></i>';

        str += '</div>';

        // Adding UL List below search box //
        str += '<ul id="product_list_' + this.new_id
            + '" style="width: 82.5%; margin-top:-4px !important; height:auto; max-height:150px; overflow:auto; margin-bottom:5px; padding: 0; background-color: white; text-align: left; position:absolute; z-index:50;box-shadow: 0px 7px 15px 0px grey !important;"></ul>';

        if (this.window_style == 'attached') {
            if (this.view_style == 'listview') {
                // listview
                str += '<div id="tbl_search_div_' + this.new_id
                    + '" class="form-group" style="display:none; width:95%; max-width:95%; overflow:auto"><input type="button" value="X" onclick="popup_items_hide_type20()" style="position: relative; right: -88%; padding: 4px 10px; color: white; background-color: red;font-size: 10pt; box-shadow: -2px 2px 3px black; border: 2px solid white; border-radius: 20px"><ul id="ul_search_'
                    + this.new_id + '" style="top: -10px; width:100%"></ul></div>';
            } else {
                // tableview
                str += '<div id="tbl_search_div_' + this.new_id
                    + '" style="display:none; width:auto; max-width:208%; overflow:auto"><input type="button" value="X" onclick="popup_items_hide_type20()" style="position: relative; right: -1.2%; top: 29px; padding: 3px 8px; color: white; background-color: red;font-size: 10pt; box-shadow: -2px 2px 3px black; border: 2px solid white"><table border="1" id="tbl_search_'
                    + this.new_id + '" style="margin-left: 1%; width:98%; border:1px solid gray"></table></div>';
            }
        } else {
            // popupview
        }
        return str;
    }
    catch (e) {
        alert1(e + '_build_type_20_search()');
    }
};

MkControls.prototype.build_type_21_s_search = function () {
    try {
        if (this.read_type == "readchecksheet") {
            // readchecksheet
            var ans_str = '';
            var name = '0';
        }
        else {
            // readsurvey
            if (this.ans == "" || this.ans == null || this.ans == undefined) {
                //for is_reset='true'
                var ans_str = '';
                var name = '0';
            }
            else {
                var ans_str = this.ans[0];
                var name = '1';
            }
        }

        var str = '';
        if (this.enable_disable == 'disabled') {
            var ico_str = 'fa-ban';
        }
        else {
            var ico_str = 'fa-search';
        }

        str += '<div class="item-input item-input-field form-div" ' + this.enable_disable + '>';
        str += '<input type="text" value="' + ans_str + '" class="form-ele" id="search_item_name_S_Search_' + this.new_id
            + '" placeholder="Enter search value..." name="' + name + '" onchange="' + this.clickcheck + '" ' + this.enable_disable
            + '><i id="btn21_Search_' + this.new_id + '" class="fa ' + ico_str + ' form-ico" onclick="' + this.param1 + '" ' + this.enable_disable + '></i>';
        str += '</div>';
        return str;
    }
    catch (e) {
        alert1(e + '_build_type_21_s_search()');
    }
};

MkControls.prototype.build_type_22_invoice = function () {
    try {
        var str = '';
        str += '<div class="item-input item-input-field form-div" ' + this.enable_disable + ' style="' + this.display_add_btn + '">';
        if (this.add_button == "false") { }                      //hide add record button [21102021]
        else {
            str += '<a id="btn_add_row_' + this.new_id + '" onclick="' + this.param
                + '" style="width:auto;" data-popup=".popup-type22" class="button button-fill button-raised form-btn open-popup" ' + this.enable_disable + '>' + this.btn_text + '</a></div>';
        }
        return str;
    }
    catch (e) {
        alert1(e + '_build_type_22_invoice()');
    }
};

MkControls.prototype.build_type_23_collapse = function () {
    try {
        var str = '';
        str += '<div class="list-block"><ul><li class="accordion-item">';
        //str += '<a id="collapse_panel_' + this.new_id + '" href="#" class="item-link item-content button" onclick="' + this.param + '" style="background: #f6f6f6; color: #000;"><div class="item-media"><i class="fa fa-cog fa-spin" style="color:#000;"></i></div>';
        //str += '<div class="item-inner" style="margin-left: 0; background-image: none;"><div class="item-title"><label name="0" id="lbl_collapse_' + this.new_id + '" for="' + this.step + '"> Click To Show Step </label></div></div></a>';
        str += '<div class="accordion-item-content" style="height:100%;"><div class="content-block" style="padding:0px!important">';
        str += '<img name="0" id="lbl_collapse_' + this.new_id + '" onclick="' + this.param + '" alt="0" src="images/maximize.png" style="display:none; float:right; margin-right:5px; margin-top:5px; margin-bottom:5px; width:22px; height:22px">';

        if (this.is_editable == "true") {
            str += '<img id="img_edit_collapse_' + this.new_id + '" onclick="' + this.param1
                + '" alt="0" src="images/edit_collapse.png" style="display:none" ' + this.enable_disable + '>';
        }

        //if (this.label_name != "") {
        //    str += '<label id="default_collapse_lbl_' + this.new_id + '" style="width: 70%;white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 15px; font-weight:bold; float: left;padding:10px !important;">' + this.label_name + '</label>';
        //}
        str += '<div id="collapse_container_div_' + this.new_id + '" style="text-align: left"></div>';
        str += '</div></div></li></ul></div>';

        return str;
    }
    catch (e) {
        alert1(e + '_build_type_23_scanner()');
    }
};

MkControls.prototype.build_type_25_scanner = function () {
    try {
        var checked_str = '';
        var ans_str = this.ans;

        var str = '';
        if (this.photo_type == "barcode") {
            var ico_str = 'fa-barcode';
        }
        else {
            var ico_str = 'fa-qrcode';
        }

        if (this.enable_disable == 'disabled') {
            var ico_str = 'fa-ban';
        }

        str += '<div class="item-input item-input-field form-div" ' + this.enable_disable + '>';
        //str += '<input class="form-ele" type="text" id="scn_' + this.new_id + '" placeholder="' + this.value + '" value="' + ans_str + '" readonly="true" onclick="' + this.param + '" ' + this.enable_disable + '>';
        str += '<textarea class="form-ele" type="text" id="scn_' + this.new_id + '" readonly="true" onclick="' + this.param + '" ' + this.enable_disable + '>' + ans_str + '</textarea>';
        str += '<i id="scn_' + this.new_id + '" class="fa form-ico ' + ico_str + '" ' + this.enable_disable + ' ></i > ';
        str += '</div>';
        return str;
    }
    catch (e) {
        alert1(e + '_build_type_25_scanner()');
    }
};

MkControls.prototype.build_type_26_upload = function () {
    try {
        if (this.read_type == "readchecksheet") {
            var ans_str = '';
            var dis_file = '';
            var dis_lbl = ';display:none';
        }
        else {
            var ans_str = this.ans;
            var dis_file = '; display:none';
            var dis_lbl = '; display: inline-block';
        }

        if (ans_str == '' || ans_str == null || ans_str == undefined) {
            var btn_str = 'Select File';
            var act_file_name = '';
            var file_path = '';
            var p_name = '';
            var sharepoint_link = '';
            var base_path = '';
            var for_str = '';
        }
        else {
            var btn_str = 'Change File';
            var act_file_name = ans_str[0];
            var file_path = ans_str[1];
            var p_name = ans_str[2];
            var sharepoint_link = ans_str[3];
            var photo_id = ans_str[4];
            var photo_size = ans_str[5];
            var base_path = this.base_path;
            var up_obj = [];
            up_obj.push({
                'act_file_name': act_file_name,
                'file_path': file_path,
                'sys_file_name': p_name,
                'sharepoint_link': sharepoint_link,
                'photo_id': photo_id,
                'photo_size': photo_size
            });
            var for_str = JSON.stringify(up_obj);
            for_str = for_str.replace(/"/g, "'");
        }


        var str = '';
        if (F7_view == 'true') {
            if (file_path == '' || file_path == null || file_path == undefined) {
                var file_path = ans_str[0];
            }
            if (F7_device == 'ios') {
                // For IOS device
                var param = "select_file('" + this.new_id + "', '" + this.que_id + "', '" + this.upload_type + "', '" + this.base_path + "', '" + this.mob_ext + "')";
                str += '<div class="item-input item-input-field form-div" style="padding-bottom:10px">';
                //str += '<div class="item-input item-input-field form-div" style="padding-bottom:10px">';
                //str += '<a id="btn_select_' + this.new_id + '" class="button button-fill button-raised form-btn blank-file" ' + this.enable_disable + ' onclick="' + param + '">' + btn_str + '</a></div>';
                //str += '<label class="filled-file" style="font-weight:bold; font-size:14px">Selected File: </label><label class="filled-file" id="lbl_up_' + this.new_id + '" for="' + for_str + '" style="font-size:14px; word-break: break-word">' + act_file_name + '</label>';
            }
            else {
                // For Android device
                var param = "select_file_android('" + this.new_id + "', '" + this.que_id + "', '" + this.upload_type + "', '" + this.base_path + "', '" + this.mob_ext + "','" + this.max_file_size + "')";
                str += '<div class="item-input item-input-field form-div" style="padding-bottom:0px" ' + this.enable_disable + '>';
            }

            if (curr_clps_new_id == 0) {
                str += '<a id="btn_select_' + this.new_id + '" class="button button-fill button-raised form-btn blank-file" ' + this.enable_disable + ' onclick="' + param + '">' + btn_str + '</a></div>';
            }
            // str += '<label class="filled-file" style="font-weight:bold; font-size:14px">Selected File: </label><label class="filled-file" id="lbl_up_' + this.new_id + '" for="' + for_str + '" style="font-size:14px; word-break: break-word">' + act_file_name + '</label>';

            if (file_path == '' || file_path == null || file_path == undefined) {
                str += '<label class="filled-file" style="font-weight:bold; font-size:14px">Selected File: </label><label class="filled-file" id="lbl_up_' + this.new_id + '" for="' + for_str + '" style="font-size:14px; word-break: break-word">' + act_file_name + '</label>';
            }
            else {
                //var param_view = "check_down_doc_entry('" + this.new_id + "','" + file_path + "','" + this.que_id + "', '" + this.checksheetid + "')";
                var doc_path = get_upload_media_live_link(this.que_id, this.checksheetid);
                //var param_view = "view_doc_in_browser_live_url('" + doc_path + "')";
                var param_view = "Download_PDFFile('" + doc_path + "','" + act_file_name + "')";
                str += '<label class="filled-file" style="font-weight:bold; font-size:14px">Selected File: </label><label class="filled-file" onclick="' + param_view + '" id="lbl_up_' + this.new_id + '" for="' + for_str + '" style="font-size:14px; word-break: break-word; color:blue">' + act_file_name + '</label>';
            }

            //if (file_path == '' || file_path == null || file_path == undefined) { }
            //else {
            //    //var param_view = "view_doc_in_browser('" + this.new_id + "','" + file_path + "')";
            //    //str += '<br><a onclick="' + param_view + '" style="font-weight:bold; word-break: break-word">' + act_file_name + '</a>';

            //    var parent_task_id = JSON.parse(storage.getItem('p_server_task_id'));
            //    var param_down = "toggle_doc_download('" + this.new_id + "', '" + this.que_id + "', '" + this.upload_type + "', '" + act_file_name + "', '" + file_path + "', '" + this.base_path + "', '" + sharepoint_link + "', '" + parent_task_id + "')";
            //    //var param_down = "download_doc('" + file_path + "')";
            //    str += '<a id="doc_down_' + this.new_id + '" name="0" onclick="' + param_down + '" style="font-weight:bold; visibility:hidden">Download Document</a>';
            //}
        }
        return str;
    }
    catch (e) {
        alert1(e + '_build_type_26_upload()');
    }
};

MkControls.prototype.build_type_27_pdf = function () {
    try {
        var str = '';
        str += '<div class="item-input item-input-field form-div" style="text-align:left" ' + this.enable_disable + '>';
        str += '<a onclick="' + this.param
            + '" class="button button-fill button-raised form-btn" ' + this.enable_disable + '>' + this.btn_text + '</a></div>';
        return str;
    }
    catch (e) {
        alert1(e + '_build_type_27_pdf()');
    }
};

MkControls.prototype.build_type_28_video = function () {
    try {
        var str = '';
        if (this.read_type == "readchecksheet") {
            // readchecksheet
            var onclick_str = "onclick = '" + this.param + "'";
            str += "<img src='images/video-camera.png' id='video_" + this.new_id + "' " + onclick_str
                + " style='height:50px; width:50px; padding:5px; margin-left:5px; border:1px solid gray; border-radius: 7px' name='" + this.name + "' " + this.enable_disable + "/>";
            str += "<div id='video_cont_" + this.new_id + "'></div>";

            //str += '<video autoplay controls id="vdo_autoply_' + this.new_id + '" poster="" style="margin-top:5px; height: 250px; width: 100%;display:none;"><source src="" type="video/mp4"></video>';
        }
        else {
            // readsurvey
            var video_path = this.ans[0];
            var thumb_path = this.ans[1];
            var video_size = this.ans[2];

            if (this.curr_clps_new_id != 0) { }
            else {
                if (thumb_path == '' || thumb_path == null || thumb_path == undefined) {
                    thumb_path = 'images/video-camera.png';
                    str += "<img src='images/video-camera.png' id='video_" + this.new_id + "' onclick = '" + this.param
                        + "' style='height:50px; width:50px; padding:5px; margin-left:5px; border:1px solid gray; border-radius: 7px' name='" + this.name + "' " + this.enable_disable + "/>";
                }
                else {
                    str += "<img src='images/edit_collapse.png' id='video_" + this.new_id + "' onclick = '" + this.param
                        + "' style='float:right; background-color:white; height:20px; width:20px; padding:5px; border:1px solid gray' name='" + this.name + "' " + this.enable_disable + "/>";
                }
            }
            if (thumb_path == 'images/video-camera.png') {
                str += "<div id='video_cont_" + this.new_id + "'></div>";
            }
            else {
                str += this.btn_text;
                str += "<div style='width:88%; text-align:-webkit-center; position:absolute; margin-top:-180px'>";
                str += "<div id='vdo_main_" + this.new_id + "' onclick='" + this.param1 + "' name='0' style='display:none; transition:0.1s; width:100px; height:40px; border-radius:50px; opacity:0.6; background-color:#333333; color:white; border:0'>";
                str += "<img id='vdo_start_img_" + this.new_id + "' src='images/download_start.png' style='width:30px; height:30px; margin-top:5px; vertical-align:bottom' /><span id='vdo_start_spn_" + this.new_id + "' style='vertical-align:super; margin-left:3px'>" + video_size + "</span>";
                str += "<img id='vdo_stop_img_" + this.new_id + "' src='images/download_stop.png' style='display:none; width:20px; height:20px; margin-top:10px' />";
                str += "</div></div>";
                str += "<input type='hidden' id='vdo_hdn_" + this.new_id + "'>";
                str += "<table id='vdo_progress_" + this.new_id + "' style='display:none; width: 100%'><tr><td><progress id='vdo_prg_" + this.new_id + "' class='vdo_prg' value='0' max='100' style='width: 96%; margin-left: 1.5%; height: 12px'></progress></td></tr></table>";
            }
        }

        return str;
    }
    catch (e) {
        alert1(e + '_build_type_28_video()');
    }
};

MkControls.prototype.build_type_30_dynddl = function () {
    try {
        var str = '';

        //var clickcheck = "$(this).attr('name', '0')";
        //str += '<div class="item-input item-input-field form-div">';
        //str += '<div class="list-block"><ul>';
        //str += '<li class ="item-content" style="padding:0"><div class="item-input">';
        //str += '<input type="text" name="0" placeholder="Select Country" onkeydown="' + clickcheck + '" class="form-ele" id="dynddl_' + this.new_id + '">';

        //if (this.enable_disable == 'disabled') {
        //    var ico_str = 'fa-ban';
        //}
        //else {
        //    var ico_str = 'fa-sort';
        //}
        //str += '<i class="fa ' + ico_str + ' form-ico" ' + this.enable_disable + ' style="margin-left:-12%"></i>';
        //str += '</div></li></ul></div></div>';


        if (this.read_type == "readchecksheet" || this.enable_disable == 'disabled' || this.view_type == 'numericview' || this.view_type == 'textview') {
            str += '<div class="item-input item-input-field form-div">';
        }
        else {
            str += '<div class="item-input item-input-field form-div" onclick=get_dynddl_data_onclick("' + this.new_id + '") ' + this.enable_disable + '>';
        }

        if (this.view_type == 'dropdownview') {
            if (this.new_id == '0_5201_79') {
                var onchange_str = " onchange=get_dynddl_data_onclick('0_5201_108');";
            }
            else {
                var onchange_str = "";
            }

            if (this.read_type == "readchecksheet") {
                var dep_str = "";
            }
            else {
                var dep_str = "dependency='" + this.param1[1] + "'";
            }

            str += '<select id="dynddl_' + this.new_id + '" ' + this.enable_disable + ' ' + onchange_str + ' default_value="' + this.default_val + '" style="display:inline-block; padding-right:26px" ' + dep_str + '><option value="--- Choose Value ---">--- Choose Value ---</option>';

            if (this.ans == '' || this.ans == null || this.ans == undefined) {
                if (this.default_val == "" || this.default_val == null || this.default_val == undefined) { }
                else {
                    str += "<option selected='selected' value='" + this.default_val + "'>" + this.default_val + "</option>";
                }
            }
            else {
                str += "<option selected='selected' value='" + this.param1[2] + "'>" + this.ans + "</option>";
            }

            str += '</select>';
        }
        else if (this.view_type == 'numericview') {
            str += '<input type="number" onfocusout="setTimeout(function () {' + this.param + '}, 700);" style="white-space: pre; word-break: break-word" class="form-ele" id="dynddl_txt_' + this.new_id + '" value="'
                + this.ans + '" ' + this.enable_disable + '>';
        }
        else if (this.view_type == 'textview') {
            str += '<input type="text" onfocusout="setTimeout(function () {' + this.param + '}, 700);" style="white-space: pre; word-break: break-word" class="form-ele" id="dynddl_txt_' + this.new_id + '" value="'
                + this.ans + '" ' + this.enable_disable + '>';
        }

        //if (this.RowQueryWhere == '') {
        //    if (this.view_type == 'numericview' || this.view_type == 'textview') {
        //        str += '<i id="dynddl_btn_' + this.new_id + '" onclick="' + this.param + '" class="fa fa-check bg-f7" style="color:#fff;padding:10px;border-radius:16px;" ' + this.enable_disable + '></i></div>';
        //    }
        //    else {
        //        if (this.enable_disable == 'disabled') {
        //            var ico_str = 'fa-ban';
        //        }
        //        else {
        //            var ico_str = 'fa fa-arrow-circle-o-down';
        //        }
        //        str += '<i class="fa ' + ico_str + ' form-ico" ' + this.enable_disable + ' style="margin-left:-12%"></i></div>';
        //    }
        //}
        //else {
        //    str += '<i id="dynddl_btn_' + this.new_id + '" onclick="' + this.param + '" class="fa fa-check bg-f7" style="color:#fff;padding:10px;border-radius:16px;" ' + this.enable_disable + '></i></div>';
        //}

        if (this.view_type == 'numericview' || this.view_type == 'textview') {
            str += '<i id="dynddl_btn_' + this.new_id + '" onclick="' + this.param + '" class="fa fa-check bg-f7 form-ico" style="color:#fff;padding:4px;border-radius:16px; margin-top: 0px; margin-right: 0; " ' + this.enable_disable + '></i></div>';
        }
        else {
            if (this.enable_disable == 'disabled') {
                var ico_str = 'fa-ban';
            }
            else {
                var ico_str = 'fa fa-arrow-circle-o-down';
            }
            str += '<i class="fa ' + ico_str + ' form-ico" ' + this.enable_disable + ' style="margin-left:-12%"></i></div>';
        }


        return str;
    }
    catch (e) {
        alert1(e + '_build_type_30_dynddl()');
    }
};

MkControls.prototype.build_type_31_label = function () {
    try {
        var str = '';
        //str += '<label class="note_type31" style="display:block; width:92%; word-break: break-word; font-size: 15px; font-family: calibri" id="lbl_' + this.new_id + '"><i class="fa fa-info-circle" style="display: inline; font-size: 18px;"></i> ' + this.value + '</label>';
        //str += '<label class="note_type31" style="background-color: #e7f3fe;border: 0.5px solid #2196F3; border-radius: 3px;font-style: italic;padding: 3px 0; display:block; width:92%; word-break: break-word; font-size: 15px; font-family: calibri" id="lbl_' + this.new_id + '"> <i class="fa fa-info-circle" style="display: inline; font-size: 18px; margin: 0 3px; vertical-align: middle;"></i> Please read this Note.</label>';
        //this.value = 'Please read this note. Please read this note. Please read this note. Please read this note. Please read this note.'
        str += '<table style="width: 97%;background-color: #f7f7d6;border: 0.5px solid #c5c5bd; border-radius: 3px;"><tr>';
        str += '<td><img src="images/hint_bulb_info.png" style="height:20px; width:20px;display:inline;vertical-align:middle !important;margin:0 3px;"/></td>';
        str += '<td style="text-align: justify;padding: 3px 9px 3px 3px !important;"><label class="note_type31" style="font-style: italic;display:block; word-break: break-word; font-size: 13px; font-family: calibri"> ' + this.value + '</label></td>';
        str += '</tr></table>';

        return str;
    }
    catch (e) {
        alert1(e + '_build_type_31_label()');
    }
};

MkControls.prototype.build_type_35_RF = function () {
    try {
        var str = '';
        str += '<div class="item-input item-input-field form-div" ' + this.enable_disable + '>';
        str += "<a id='btnRF_" + this.new_id + "' onclick = '" + this.param
            + "' style='width:50%' class='button button-fill button-raised form-btn' " + this.enable_disable + ">RF Tracking</a></div>";
        return str;
    }
    catch (e) {
        alert1(e + '_build_type_35_RF()');
    }
};

MkControls.prototype.build_type_36_checkbox = function () {
    var str = '';

    if (this.read_type == 'readchecksheet') {
        var chk_style = 'width:88%;';
    }
    else {
        var chk_style = '';
    }

    str += '<div id="checklist_' + this.new_id + '"  style="' + chk_style + '" class="chk-control"><ul id="items_' + this.new_id + '" style="list-style: none;padding: 0;margin: 0;">';

    if (this.read_type == 'readchecksheet') {
        var chklst_array = this.ans;
        if (chklst_array == '' || chklst_array == null || chklst_array == undefined) {
            chklst_array = '';
        }
    }
    else {
        var chklst_array = this.ans;

        var selected = chklst_array[1];
        if (selected == '' || selected == null || selected == undefined) {
            selected = '';
        }

        var chk_Array = chklst_array[0];
        if (chk_Array == '' || chk_Array == null || chk_Array == undefined) {
            chk_Array = '';
        }
        else {
            var li_str = '';

            for (var k = 0; k < chk_Array.length; k++) {
                var found = 0;
                var chkls_label = chk_Array[k];
                for (var j = 0; j < selected.length; j++) {
                    if (chkls_label == selected[j]) {
                        found++;
                        break;
                    }
                }

                if (found == 0) {
                    var checked_str = '';
                }
                else {
                    var checked_str = 'checked="checked"';
                }

                li_str += '<li style="border-bottom: 1px solid #ccc;"><label class="label-checkbox item-content" style="height: 30px;width: 94%;min-height: 30px;">'
                li_str += '<input type="checkbox" ' + checked_str + ' name="item" value="' + chkls_label + '">';
                li_str += '<div class="item-media" style="margin-left: -10px;"><i class="icon icon-form-checkbox"></i></div>';
                li_str += '<div class="item-inner" style="margin-left: -6px;top: -8px;"><div class="item-title">' + chkls_label + '</div></div></label><i class="fa fa-times" style="color: #6d6d6d;font-size: 18px;float: right;margin-top: -23px;" onclick="$(this).parent().remove()"></i></li>';
            }
            str += li_str;
        }
    }

    if (chk_Array == '' || chk_Array == null || chk_Array == undefined) {
        var val_json = '';
    }
    else {
        var val_json = JSON.stringify(chklst_array)
    }

    str += '</ul>';
    var param_click = "add_chklist('" + this.new_id + "');return false";
    var param_keyup = "add_chklist_event(event, '" + this.new_id + "')";
    str += '<div id="new_item_form_' + this.new_id + '" style="display: flex;"><button id ="submit" onclick ="' + param_click + '" style="width: 20px;top: -10px;background: none;border: none;margin-left: 7px;"><i class="fa fa-plus" style="color: #6d6d6d;font-size: 20px;"></i></button><input type="text" id="new_item_' + this.new_id + '" onkeyup="' + param_keyup + '" placeholder="List item">';
    str += '</div></div>';
    return str;
}

var curr_type_37_new_id = '';
var type37_udf_ary = [];
MkControls.prototype.build_type_37_subtask = function () {
    var str = '';
    if (this.read_only == true) { }
    else {
        let this_obj = this;

        //str += '<div id="div_subtask_' + this.new_id + '" class="cntrl_main_div ' + this.ele_class + '" "' + this.common_str + '" style="border-bottom: 1px solid #ccc; ' + this.disp_cntrl + '">' + this.mendatory_img + '';
        str += '<div id="subtask_container" style="overflow:auto; max-height: 510px;">';

        str += '<ul class="lst_pen" id="tbl_subtask_selected_' + this.new_id + '" style="margin-top: 2px; margin-bottom: 10px"></ul>'

        str += '<ul class="lst_pen" id="tbl_subtask_' + this.new_id + '" style="margin-top: 2px; margin-bottom: 10px"></ul>';

        str += '</div>';

        var value = this.misc_Array[0].value;
        if (value == '' || value == null || value == undefined) {
            var listing_udf_id = 0;
            //var bulk_approval_udf_id = 0;
            var aggr_column_array = [];
            var input_column_array = [];
            var main_column_array = [];
        }
        else {
            value = itemObj._checkStrObj(value);  // check_item
            var listing_udf_id = value[0].udf_id;
            type37_udf_ary.push(listing_udf_id)

            var aggr_column_array = value[0].aggr_column_array;
            var input_column_array = value[0].input_column_array;
            if (input_column_array == "" || input_column_array == null || input_column_array == undefined) {
                input_column_array = [];
            }

            //var input_column_array = [{ "input_flow_id": "4796", "input_flow_name": "Invoice Line Item", "input_checksheet_id": "88336", "input_que_id": "27" }];

            var main_column_array = value[0].main_column_array;
            if (main_column_array == "" || main_column_array == null || main_column_array == undefined) {
                main_column_array = [];
            }
            else {
                storage.setItem('type37_main_column_array', JSON.stringify(main_column_array));
                var main_column_udf_id = main_column_array[0].main_udf_id;
                type37_udf_ary.push(main_column_udf_id);
            }
        }

        str += "<div id='div_aggr_data_" + this.new_id + "' data='" + JSON.stringify(aggr_column_array) + "' input-data='" + JSON.stringify(input_column_array) + "' main-data='" + JSON.stringify(main_column_array) + "' style='margin-top:5px;'></div>";

        // refresh button which will be hidden
        let param_click1 = "refresh_sub_task_listing('" + this_obj.new_id + "', '" + listing_udf_id + "', '')";
        str += '<button type="button" id="btn_type_37_refresh_' + this_obj.new_id + '" class="button button-fill" onclick="' + param_click1 + '" title="Refresh List" style="margin-top:5px;display:inline-block;"><i class="fa fa-refresh" style="margin-right:0;"></i></button>';

        let click_btn = "data_to_read_target_udf('" + listing_udf_id + "', '');"
        str += '<button type="button" id="btn_type_37_CreateTask_' + this_obj.new_id + '" class="button button-fill" onclick="' + click_btn + '" style="display:none;margin:5px 0 0 10px;"><i class="fa fa-plus" style="margin-right:0;"></i></button>';

        if (input_column_array.length > 0) {
            let param_click2 = "check_n_create_invoice_task_pre('" + this_obj.new_id + "')";
            str += '<button type="button" id="btn_type_37_add_invoice_' + this_obj.new_id + '" class="btn btn-primary btn-sm" style="visibility: hidden" onclick="' + param_click2 + '">Generate All Invoice</button>';
        }

        //get udf data using query for type37 udf [FT - 14082024]
        var role_id_array = localStorage.getItem('role_id_array');
        var query = "SELECT data FROM User_Define_Flow_Master WHERE id = " + listing_udf_id + " and rollid in (" + role_id_array + ") and (is_delete != 1 or is_delete IS NULL)";

        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "1"
        });
        cordova.exec(function (e) {
            var myArray = JSON.parse(e);
            if (myArray.length == 0) {
                // child flow not exist
            } else {
                // child flow exist
                var data_count = myArray[0].data;
                if (data_count == "" || data_count == null || data_count == undefined || data_count == "undefined") {
                    alert("Sub flow with udf id = " + listing_udf_id + " is not found!");
                }
                else {
                    var list_data = JSON.parse(data_count);

                    setTimeout(function () {
                        let t_new_id = this_obj.new_id;

                        var value = this_obj.misc_Array[0].value;
                        if (value == '' || value == null || value == undefined) {
                            var listing_udf_id = 0;
                        }
                        else {
                            value = itemObj._checkStrObj(value);  // check_item
                            var listing_udf_id = value[0].udf_id;
                        }


                        //store type 37 udf data to hidden field for futher usage [FT-13082024]
                        if (type37_udf_ary.length > 0) {
                            get_type37_udf_data_from_query(type37_udf_ary, t_new_id, listing_udf_id)
                        }
                        else {
                            get_udf_data_by_id(t_new_id, listing_udf_id);
                        }
                    }, 500, this_obj);
                }
            }
        }, onfail_get_type37_udf_data_from_query, 'SqlitePlugin', 'showValues', q_jsonobj);
    }
    return str;
}

// type - 38 Map View

MkControls.prototype.build_type_39_weather = function () {
    try {
        var str = '';

        str += '<div class="card">';
        str += '<div class="card-content">';
        str += '<div class="card-content-inner">';
        str += '<input id="hdn_weather_card_view" type="hidden" value="">';
        str += '<table id="weather_tbl"><tbody>';
        str += '<tr><td id="weather_icon" rowspan="3"><img src="images/Weather_icons/03d.png" style="width:60px;"></td><td id="weather_type"></td><td id="weather_time"></td></tr>';
        str += '<tr><td id="weather_temp"></td><td id="weather_con"></td></tr><tr><td id="weather_feels"></td><td id="weather_vis"></td></tr>';
        str += '</tbody></table>';

        var user_track_array = JSON.parse(storage.getItem('user_track_details'));
        var user_lat = user_track_array[0].user_lat;
        var user_long = user_track_array[0].user_long;
        var param_weather = "view_weather_for_site('" + user_lat + "', '" + user_long + "')";
        str += '<span class="readmore-link" onclick="' + param_weather + '" style="background-image: linear-gradient(transparent, white);"><div class="showmore-box">Show More</div></span>'

        str += '<div>'
        str += '</div>';
        str += '</div>';

        return str;
    }
    catch (e) {
        alert1(e + '_build_type_39_weather()');
    }
};


MkControls.prototype.build_type_40_livelink = function () {
    try {

        // video tag supports only .mp4, .webm, or .ogg file format

        let value = this.misc_Array[0].value;
        value = itemObj._checkStrObj(value);  // check_item
        let doc_type = value[0].doc_type;
        let doc_url = value[0].doc_url;      // configured live path

        if (doc_type == "image") {
            var str = '';
            str += '<div class="item-input item-input-field form-div" ' + this.enable_disable + '>';
            str += '<img src="' + doc_url + '" onclick="get_full_view_image_type40_F7(this)" id="livelink_image_' + this.new_id + '" style="height:50px; width:50px; margin-left: 5px; border-radius: 7px" que_id = "' + this.que_id + '" ' + this.enable_disable + '/>';
            str += '</div>';
        }
        else {
            // video

            let watched = 0;
            let watch_status = "Status: Not Watched";

            let video_path = value[0].doc_url;
            for (let g = 0; g < glob_livelink_Array.length; g++) {
                let live_url = glob_livelink_Array[g].live_url;     // configured live path
                if (doc_url == live_url) {
                    let download_url_path = glob_livelink_Array[g].download_url_path;    // local download folder path
                    if (download_url_path == "" || download_url_path == null || download_url_path == undefined) {
                        // downloading is in process
                    }
                    else {
                        // download completed

                        // set video by local path if downloaded to local
                        video_path = download_url_path;
                    }
                }
            }

            let livelink_watched_Array = localStorage.getItem('livelink_watched_Array');
            if (livelink_watched_Array == "" || livelink_watched_Array == null || livelink_watched_Array == undefined || livelink_watched_Array == "[]") {
                livelink_watched_Array = [];
            }
            else {
                livelink_watched_Array = JSON.parse(livelink_watched_Array);
            }

            let found = 0;
            for (let l = 0; l < livelink_watched_Array.length; l++) {
                let t_path = livelink_watched_Array[l];
                if (t_path == doc_url || t_path == video_path) {
                    found++;
                    break;
                }
            }
            if (found == 1) {
                watched = 1;
                watch_status = "Status: Watched";
            }

            var str = '';
            let onload_str = "init_livelink('livelink_video_" + this.new_id + "')";
            str += '<div class="video-container" onload="' + onload_str + '">';
            str += '<video id="livelink_video_' + this.new_id + '" onclick="videoclick()" watched="' + watched + '" width="100%" preload="auto" crossorigin="anonymous" controlslist="nodownload nofullscreen noremoteplayback"';
            str += 'controls playsinline disablepictureinpicture>';
            //str += 'controls muted autoplay loop playsinline disablepictureinpicture>';
            //str += '<source src="http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4" type="video/mp4">';
            str += '<source src="' + video_path + '" live_url="' + doc_url + '" type="video/mp4" onerror="reset_video_url_by_live_url(this)">';
            str += '</video>';
            str += '<p id="livelink_status_' + this.new_id + '">' + watch_status + '</p>';

            let download_str = "download_livelink_doc('" + doc_url + "')"
            str += '<p id="livelink_download_' + this.new_id + '" onclick="' + download_str + '" style="float:right"><i class="fa fa-download"></i> Download</p>';
            str += '</div>';
        }

        return str;
    }
    catch (e) {
        alert1(e + '_build_type_40_livelink()');
    }
};


var session_ms = 0;
var MkDocInits = function () { };
var allow_str = "Allowed special characters are { [ / ? . , ; : # @ & _ % ÷ * + - ] }";
MkDocInits.prototype = {

    _initF7: function (doc) {
        doc._bindNoAct("#img_profile_menu");
        doc._loadFile('panel-nav', 'f7_navbar.html');
        doc._loadFile('panel-pro', 'f7_myprofile.html');
        doc._loadFile('panel-faq', 'f7_faq.html');
        doc._loadFile('panel-sp', 'f7_safety_passport.html');
        $('body').click(function () {
            session_ms = 0;
            $('[id^=product_list]').empty();
        });

        var short_username = username.substr(0, 10);
        if (F7_device == 'ios') {
            $('.panel-overlay').on('click', function (e) { myApp.closePanel(); });
            $('#F7-popup_inner_div_type20').css('padding-top', '30px');
            $('.navbar:first').append('<div style="position: absolute; top: 47px; right: 6px; font-size: 11px;"><span id="navbar_usernm" style="margin-right: 12px; color:white">' + short_username + '</span></div>');
        }
        else {
            //$('.navbar:first').append('<div style="position: absolute; top: 40px; right: 6px; font-size: 11px;"><span id="navbar_usernm" style="margin-right: 12px; color:white">' + short_username + '</span></div>');
        }

        setTimeout(function () {
            var app_version = localStorage.getItem('version');
            $("#app_version").html('<b>Ver:</b> ' + app_version);

            //set version for ios [FT - 30052024]
            $("#app_version_ios").html('<b>Ver:</b> ' + app_version);

            // remove change password for metal (17092019)
            var company_id = JSON.parse(storage.getItem('company_id'));
            if (company_id == 1215) {
                $("#change_pass").remove();
            }

            let allow_profile_change = localStorage.getItem("allow_profile_change");
            if (allow_profile_change == 0) {
                let curr_prof_img = $("#img_profile").attr("src");
                if (curr_prof_img == "" || curr_prof_img == null || curr_prof_img == undefined || curr_prof_img == "images/profile_pic.png") { }
                else {
                    // hide change profile photo icon in case allow_once + profile photo configured - mk - 09102024
                    $("#change_photo").hide();
                }
            }

        }, 1000);

        //$('.modal-overlay').on('click', function (e) { alert1("hi") });

    },

    _bindBoxInput: function (docObj) {
        $(docObj).on('input', 'input', function () {
            //var tbox = this;
            //var act_value = $(tbox).val();
            //if (act_value == '' || act_value == null || act_value == undefined) {
            //    //
            //} else {
            //    var prevalue = act_value.replace(/[^a-zA-Z0-9.,/? #&{};:@_%÷*+-[\]]/g, '');
            //    var alphanumers = /^[a-zA-Z0-9.,/? #&{};:@_%÷*+-[\]]+$/;
            //    if (!alphanumers.test(act_value)) {
            //        prevalue = prevalue.trim();
            //        $(tbox).val(prevalue);
            //        alert1(allow_str);
            //    } else if (act_value.length > 500) {
            //        var prevalue = act_value.substr(0, 500);
            //        $(tbox).val(prevalue);
            //        alert1("Input string length can not be more than 500 characters !");
            //    }

            //    var lt_index = act_value.indexOf("<");
            //    if (lt_index > -1) {
            //        var pre = act_value.substr(0, lt_index);
            //        pre = pre.trim();
            //        $(tbox).val(pre);
            //        alert1(allow_str);
            //    }

            //    var gt_index = act_value.indexOf(">");
            //    if (gt_index > -1) {
            //        var pre = act_value.substr(0, gt_index);
            //        pre = pre.trim();
            //        $(tbox).val(pre);
            //        alert1(allow_str);
            //    }
            //}

        });

        if (F7_device == 'android') {
            $(docObj).on('input', 'input[type=number]', function () {
                $('.popup-type27').hide();
            });
        }
    },

    _bindTextAreaInput: function () {
        $("textarea").on('input', function () {
            var tbox = this;
            var act_value = $(tbox).val();
            if (act_value == '' || act_value == null || act_value == undefined) {
                //
            } else {
                var prevalue = act_value.replace(/[^a-zA-Z0-9.,/? #&{};:@_%÷*+-[\]]/g, '');
                var alphanumers = /^[a-zA-Z0-9.,/? #&{};:@_%÷*+-[\]]+$/;
                if (!alphanumers.test(act_value)) {
                    prevalue = prevalue.trim();
                    $(tbox).val(prevalue);
                    alert1(allow_str);
                } else if (act_value.length > 500) {
                    var prevalue = act_value.substr(0, 500);
                    $(tbox).val(prevalue);
                    alert1("Input string length can not be more than 500 characters !");
                }

                var lt_index = act_value.indexOf("<");
                if (lt_index > -1) {
                    var pre = act_value.substr(0, lt_index);
                    pre = pre.trim();
                    $(tbox).val(pre);
                    alert1(allow_str);
                }

                var gt_index = act_value.indexOf(">");
                if (gt_index > -1) {
                    var pre = act_value.substr(0, gt_index);
                    pre = pre.trim();
                    $(tbox).val(pre);
                    alert1(allow_str);
                }
            }

        });

    },

    _bindBoxCP: function (docObj) {
        if (global_wcf_url == 'https://ap.champs.vedangcellular.com/coreapi/api/') { }
        else {
            $(docObj).bind('copy paste', function (e) {
                alert1("Content copy paste is restricted !");
                e.preventDefault();
            });
        }
    },

    _bindNoAct: function (ele) {
        $(ele).click(function (e) {
            e.stopPropagation();
            return false;
        });
    },

    _bindChildNoAct: function (ele) {
        $(ele).children().click(function (e) {
            e.stopPropagation();
            return false;
        });
    },

    _loadFile: function (cls, file) {
        $('.' + cls + '').load(file);

        setTimeout(function () {
            if (cls == 'panel-nav') {
                $('#lblusername').html(username);

                if (F7_device == 'ios') {
                    //set profile pic for ios [FT -30052024]
                    var smallImage_ios = document.getElementById("img_profile_ios");
                    var pro_pic_path = JSON.parse(storage.getItem('profile_pic_path_ios'));
                    if (pro_pic_path == '' || pro_pic_path == null || pro_pic_path == undefined) {
                        smallImage_ios.src = "images/profile_pic.png";
                    } else {
                        smallImage_ios.src = pro_pic_path;
                    }
                }
                else {
                    var smallImage = document.getElementById("img_profile");
                    var pro_pic_path = JSON.parse(storage.getItem('profile_pic_path'));
                    if (pro_pic_path == '' || pro_pic_path == null || pro_pic_path == undefined) {
                        smallImage.src = "images/profile_pic.png";
                    } else {
                        smallImage.src = pro_pic_path;
                    }
                }

                //var chk_skip_down = JSON.parse(storage.getItem('chk_skip_down'));
                //if (chk_skip_down == false) { }
                //else {
                //    $('#chk_skip_down').prop('checked', true);
                //}

                var profile_menu_alignment = localStorage.getItem('profile_menu_alignment');
                if (profile_menu_alignment == 'right') {
                    $('#nav_sub1').attr('data-page', 'panel-right');
                    $('#nav_sub2').attr('data-page', 'panel-right');
                    $('#nav_main').addClass('panel-right');
                    $('#nav_main').removeClass('panel-left');
                }

                var profile_menu_hide = localStorage.getItem('profile_menu_hide');
                if (profile_menu_hide == "" || profile_menu_hide == null || profile_menu_hide == undefined) { }
                else {
                    var menu_hide_array = profile_menu_hide.split(",");
                    for (p = 0; p < menu_hide_array.length; p++) {
                        $('#' + menu_hide_array[p]).addClass('li_no_chk');
                    }
                }
            }
            else if (cls == 'panel-pro') {
                $('#lblusername_my').html(username);

                let role_name = JSON.parse(storage.getItem('role_name')); 
                $('#lbluserrole_my').html(role_name);

                var smallImage = document.getElementById("img_my_profile");
                if (F7_device == 'ios') {
                    //set profile pic for ios [FT -30052024]
                    var pro_pic_path = JSON.parse(storage.getItem('profile_pic_path_ios'));
                }
                else {
                    var pro_pic_path = JSON.parse(storage.getItem('profile_pic_path'));
                }

                if (pro_pic_path == '' || pro_pic_path == null || pro_pic_path == undefined) {
                    smallImage.src = "images/profile_pic.png";
                } else {
                    smallImage.src = pro_pic_path;
                }
            }
        }, 400);
    },

    _checkSession: function (docObj) {
        var dynamic_session_ms = localStorage.getItem("Session_MS");
        if (dynamic_session_ms == '' || dynamic_session_ms == null || dynamic_session_ms == undefined) {
            dynamic_session_ms = 86400000;          //1 day
        }
        else {
            dynamic_session_ms = parseInt(localStorage.getItem("Session_MS"));
        }
        if (dynamic_session_ms != 0) {
            if (session_ms >= dynamic_session_ms) {
                alert1("Session Expired !");
                changeurl("Login.html");
            }
            else {
                session_ms = session_ms + 120000; // 2 min
                setTimeout(function () {
                    docObj._checkSession(docObj);
                }, 120000);
            }
        }
    }
};

var MkLocation = function () { };
MkLocation.prototype = {
    _getLocation: function (fn) {
        cordova.exec(function (e) {
            var myArray = JSON.parse(e);
            var gprs = myArray[0].gprs;
            var gps = myArray[0].gps;
            if (myArray[0].lat == "" || myArray[0].lat == undefined || myArray[0].lat == null) {
                var lat = 0;
            } else {
                var lat = myArray[0].lat;
            }
            if (myArray[0].lon == "" || myArray[0].lon == undefined || myArray[0].lon == null) {
                var long = 0;
            } else {
                var long = myArray[0].lon;
            }
            if (myArray[0].accuracy == "" || myArray[0].accuracy == undefined || myArray[0].accuracy == null) {
                var accuracy = 0;
            } else {
                var accuracy = myArray[0].accuracy;
            }
            if (myArray[0].address == "" || myArray[0].address == undefined || myArray[0].address == null || myArray[0].address == 'null') {
                var address = "N/A";
            } else {
                var address = myArray[0].address;
                address = address.replace("null", "");
            }

            var obj = [];
            obj.push({
                'lat': lat,
                'long': long,
                'address': address,
                'gprs': gprs,
                'gps': gps,
                'accuracy': accuracy
            });
            fn(obj);
        }, function () { alert1(e) }, 'maulik', 'nck', ["ds"]);
    },

    _addWaypoint: function (waypoint_type) {

        // if last waypoint is 100m far from current position

        let trip_ser_task_id = localStorage.getItem('trip_ser_task_id');
        if (trip_ser_task_id == "" || trip_ser_task_id == null || trip_ser_task_id == undefined) { }
        else {

            let server_task_id = JSON.parse(storage.getItem('server_task_id'));
            let p_server_task_id = JSON.parse(storage.getItem('p_server_task_id'));

            let waypoint_dependency = localStorage.getItem('trip_waypoint_dependency');
            if (waypoint_dependency == "" || waypoint_dependency == null || waypoint_dependency == undefined) {
                waypoint_dependency = "trip_dependent";
            }

            let add_waypoint = false;
            if (waypoint_dependency == "trip_dependent") {
                if (trip_ser_task_id != server_task_id && trip_ser_task_id == p_server_task_id) {
                    // add new location as a waypoint in track_master for sub task only

                    // trip with main task is running matched
                    add_waypoint = true;
                }
            }
            else if (waypoint_dependency == "trip_independent") {
                if (trip_New_Array.length > 0) {
                    // a trip is running (any task)
                    add_waypoint = true;
                }
            }

            if (add_waypoint == true) {

                mk_notify("Waypoint added");

                var q_jsonobj = [];
                q_jsonobj.push({
                    waypoint_type: waypoint_type
                });

                cordova.exec(function (e) {
                    // success

                }, function (e) {
                    // fail
                }, 'InsertNewLatLngPlugin', 'nck', q_jsonobj);
            }

        }

    }
};

var MKCheckItem = function () { };
MKCheckItem.prototype = {
    _checkStrObj: function (item) {
        if (typeof item === 'string' || item instanceof String) {
            item = JSON.parse(item);
        }
        return item;
    },
    _isTripAvailable: function (fn) {
        // multiple trip possibility (start trip on submit button) 10102023

        var t_id = JSON.parse(storage.getItem('tid'));
        var query = "select * from lat_plug where tid = '" + t_id + "'";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "1"
        });
        cordova.exec(function (e) {
            var myArray = JSON.parse(e);
            if (myArray.length == 0) {
                var trip_available = "no";
            }
            else {
                var trip_available = "yes";
            }
            fn(trip_available);
        }, function () { alert1(e) }, 'SqlitePlugin', 'showValues', q_jsonobj);
    }
};

//show password 28032022
function show_pass1(id) {
    var txt_id = $(id).prev().attr("id");
    var div_id = '#' + txt_id;
    var txt_type = $(div_id).attr("type");

    if (txt_type == 'password') {

        $(div_id).attr("type", "text");
        $(id).removeClass('fa-eye-slash');
        $(id).addClass('fa-eye');
    }
    else {
        $(div_id).attr("type", "password");
        $(id).removeClass('fa-eye');
        $(id).addClass('fa-eye-slash');
    }
}




//function build_form_buttons(obj) {
//    try {
//        this.obj = obj;

//        var btnName = this.obj[0].name;
//        var subaction = parseInt(this.obj[0].subaction);
//        var btn_color = this.obj[0].color;
//        if (btn_color == undefined) {
//            btn_color = color_btn;
//        }
//        var btn_class = "";
//        if (this.obj[0].class1 != undefined) {
//            var class_Array = this.obj[0].class1;
//            btn_class = class_Array[0];
//            for (var c = 1; c < this.obj[0].class1.length; c++) {
//                btn_class += ' ' + class_Array[c] + '';
//            }
//        }

//        var dis_style = '';
//        if (btn_class == "" || btn_class == null || btn_class == undefined) {
//            btn_class = '';
//            dis_style = '';
//        } else {
//            dis_style = 'display:none;';
//        }

//        if (F7_view == 'true') {
//            // F7 View
//            newdiv += '<div id="div_btnSN_' + btnSN_counter + '" class="right ' + btn_class + '"><a class="link ' + btn_class + '" onclick="goto_on_click('
//                    + subaction + ')" style="' + dis_style + '">' + btnName + '</a></div>';
//        }
//        else {
//            // Old View
//            newdiv += '<div id="div_btnSN_'
//                     + btnSN_counter
//                     + '" style="padding:5px 0px">';
//            newdiv += '<input type="button" value="'
//                   + btnName
//                   + '" class="'
//                   + btn_class
//                   + '" onclick="goto_on_click('
//                   + subaction + ')" style="' + dis_style + ' width:100%; height:40px; color:'
//                   + font_color_button
//                   + '; background-color:'
//                   + btn_color
//                   + '; font-size:15pt; border-radius:15px" /></div>';
//        }

//    }
//    catch (e) {
//        alert1(e + '_build_form_buttons()');
//    }
//}

