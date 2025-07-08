// check module and redirect to correspondent site list
function check_flow_and_redirect() {
    // changeurl("viewsitelist_pm.html");
    //changeurl("selection_survey.html");
    var flow_Array = JSON.parse(storage.getItem('flow_Array'));
    if (flow_Array.length == 1) {
        changeurl("selection_survey.html");
    } else {
        var selected_tid = flow_Array[flow_Array.length - 2].tid;
        var selected_site = flow_Array[flow_Array.length - 2].siteid;
        var selected_start_status = flow_Array[flow_Array.length - 2].start_status;
        storage.setItem('tid', JSON.stringify(selected_tid));
        storage.setItem('siteid', JSON.stringify(selected_site));
        storage.setItem('start_status', JSON.stringify(selected_start_status));

        var type = flow_Array[flow_Array.length - 1].type;
        if (type == 'Module' || type == 'Flow') {
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
            storage.setItem('list_json', JSON.stringify(list_json));
            storage.setItem('flow_Array', JSON.stringify(flow_Array));
            changeurl("viewsitelist_pm_grouplist.html");
        }
    }
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

// animate element border
function mk_animate_border(element, x, time, t_color_name, after_effect) {
    var company_id = JSON.parse(storage.getItem('company_id'));
    if (company_id == 157) {
        var color_name = "#0033ff";
        //var color_name = 'rgba(' + hexToRgb("#0033ff").r + ',' + hexToRgb("#0033ff").g + ',' + hexToRgb("#0033ff").b + ', 1)';
        var light_color = 'rgba(' + hexToRgb("#0033ff").r + ',' + hexToRgb("#0033ff").g + ',' + hexToRgb("#0033ff").b + ', 0.5)';
    }
    else {
        var color_name = t_color_name;
        //var color_name = 'rgba(' + hexToRgb(t_color_name).r + ',' + hexToRgb(t_color_name).g + ',' + hexToRgb(t_color_name).b + ', 1)';
        var light_color = 'rgba(' + hexToRgb(t_color_name).r + ',' + hexToRgb(t_color_name).g + ',' + hexToRgb(t_color_name).b + ', 0.5)';
    }
    var colors = [color_name, 'white', color_name, 'white', color_name, 'white', color_name];
    if (x >= colors.length) {
        x = 0;
    } else {
        x++;
        var color = 'solid 2px ' + colors[x];
        $(element).css('border', color);
        setTimeout(function () {
            mk_animate_border(element, x, time, color_name);
        }, time);
        if (after_effect == '' || after_effect == null || after_effect == undefined) {
            setTimeout(function () {
                $(element).css('border-color', light_color);
            }, time * 10);
        }
        else if (after_effect == 'hide') {
            setTimeout(function () {
                $(element).css('border', 'none');
            }, time * 10);
        }
    }
}

//limit characters in input type text/number
function mk_limitText(ele, maxlength) {
    if (ele.value.length > maxlength) {
        ele.value = ele.value.substring(0, maxlength);
    }
}

//validate regular expression
function mk_check_RegExp(pattern, input) {
    var regex = new RegExp(pattern);
    return regex.test(input);
}

// find null position from survey json
function find_null_position_in_survey(finaljsonObj_t) {
    var data = JSON.stringify(finaljsonObj_t[0].data);
    var buttons = JSON.stringify(finaljsonObj_t[0].buttons);
    var address = finaljsonObj_t[0].address;
    var username = finaljsonObj_t[0].username;
    var u_c = finaljsonObj_t[0].u_c;
    var subcategory = finaljsonObj_t[0].subcategory;

    var data_s = data.search(/null/i);
    var buttons_s = buttons.search(/null/i);
    var address_s = address.search(/null/i);
    var username_s = username.search(/null/i);
    var u_c_s = u_c.search(/null/i);
    var subcategory_s = subcategory.search(/null/i);

    if (data_s != -1) {
        alert1("Data contains null value, please replace Data value !");
        data = JSON.parse(data);
        for (d = 0; d < data.length; d++) {
            var ele = JSON.stringify(data[d]);
            var ele_s = ele.search(/null/i);
            if (ele_s != -1) {
                alert1(ele);
                break;
            }
        }
    } else if (buttons_s != -1) {
        alert1("Buttons contains null value, please replace Buttons value !");
        buttons = JSON.parse(buttons);
        for (d = 0; d < buttons.length; d++) {
            var ele = JSON.stringify(buttons[d]);
            var ele_s = ele.search(/null/i);
            if (ele_s != -1) {
                alert1(ele);
                break;
            }
        }
    } else if (address_s != -1) {
        alert1("Address contains null value, please replace Address value !");
        alert1(address);
    } else if (username_s != -1) {
        alert1("Username contains null value, please replace Username value !");
        alert1(username);
    } else if (u_c_s != -1) {
        alert1("Unique Code contains null value, please replace Unique Code value !");
        alert1(u_c);
    } else if (subcategory_s != -1) {
        alert1("Subcategory contains null value, please replace Subcategory value !");
        alert1(subcategory);
    }
}

// check camera button and redirect to correspondent function
function check_camera_and_redirect() {
    var camera_type = JSON.parse(storage.getItem('camera_type'));
    // alert1("Camera Type: "+ camera_type);
    if (camera_type == 7) {// normal camera
        capture_Photo();
    } else if (camera_type == 9) {// signature camera
        capture_Photo_sign();
    } else if (camera_type == 11) {// latlong camera
        capture_Photo_latlong();
    } else if (camera_type == 26.1) {// pdf camera
        capture_pdf();
    } else if (camera_type == 26.2) {// video camera
        capture_video();
    }
}

// getting last photo path when crash application
function get_last_photo_path() {
    try {
        var query = "select username from Login_Master";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "5" // call for getting last photo path
        });
        cordova.exec(onsuccess_get_last_photo_path, onfail_get_last_photo_path,
				'SqlitePlugin', 'showValues', q_jsonobj);
    } catch (e) {
        alert1(e + '_get_last_photo_path');
        loading_hide();
    }
}

// successful getting last photo path
function onsuccess_get_last_photo_path(e) {
    try {
        // alert1(e);
        var myArray = JSON.parse(e);
        var last_photo_path = myArray[0].path;
        if (last_photo_path == "" || last_photo_path == " "
				|| last_photo_path == undefined || last_photo_path == null) {
            // last photo path is not found
            // camera crash before saving photo to device local storage
            storage.setItem('crash_status', JSON.stringify('0'));
            curr_btn_mode = "";
            show_save_label();
            loading_hide();
        } else {
            var camera_type = JSON.parse(storage.getItem('camera_type'));
            if (camera_type == 7) {// normal camera
                curr_survey_data["img_path"] = last_photo_path;
                onPhotoDataSuccess(last_photo_path);
            } else if (camera_type == 9) {// signature camera
                curr_survey_data["sign_path"] = last_photo_path;
                onPhotoDataSuccess_sign(last_photo_path);
            } else if (camera_type == 11) {// latlong camera
                onPhotoDataSuccess_latlong(last_photo_path);
            } else {
                // vdo/document
                loading_hide();
            }
        }
    } catch (e) {
        alert1(e + '_onsuccess_get_last_photo_path');
        loading_hide();
    }
}

function onfail_get_last_photo_path(e) {
    alert1(e + '_onfail_get_last_photo_path');
    loading_hide();
}

function check_decimal_point(decimal_point, answer, prop_name) {
    // new decimal point check
    if (decimal_point == '' || decimal_point == null || decimal_point == undefined) {
        // decimal point not required
        return true;
    }
    else {
        // decimal point required
        var decimal_exist = answer % 1;
        if (decimal_exist == 0 && decimal_point != 0) {
            // decimal point not exist in answer
            if (curr_btn_mode != "save") {
                alert1(decimal_point + ' decimal point value required for ' + prop_name + ' !');
                return false;
            }
        }
        else {
            // decimal point exist in answer
            var decimal_ans = answer.toString().split(".")[1];
            if (decimal_ans == undefined) {
                decimal_len = 0;
            }
            else if (decimal_ans == '') {
                decimal_len = -1;
            }
            else {
                var decimal_len = decimal_ans.length;
            }
            if (decimal_len != decimal_point) {
                if (curr_btn_mode != "save") {
                    alert1(decimal_point + ' decimal point value required for ' + prop_name + ' !');
                    return false;
                }
            }
        }
    }
}