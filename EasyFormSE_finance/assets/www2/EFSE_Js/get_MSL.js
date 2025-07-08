// call on MSL button
function get_latlong_from_numericbox_MSL(item_id, lat_box_class,
		long_box_class, MSL_box_class) {
    try {
        loading();
        $('a.button-fill').addClass('li_disabled');
        curr_survey_data["btn_item_id_MSL"] = item_id;

        // $("." + lat_box_class + "").css("display", "block");
        // $("." + long_box_class + "").css("display", "block");
        // $("." + MSL_box_class + "").css("display", "block");

        var lat_box_id = $("." + lat_box_class + " :input").attr("id");
        var long_box_id = $("." + long_box_class + " :input").attr("id");
        var MSL_box_id = $("." + MSL_box_class + " :input").attr("id");

        curr_survey_data["txtno_MSL"] = MSL_box_id;

        var latitude = $("#" + lat_box_id + "").val();
        var longitude = $("#" + long_box_id + "").val();
        
        if (latitude == "" || latitude == undefined || latitude == null
				|| longitude == "" || longitude == undefined
				|| longitude == null) {
            alert1("Please enter lat long before getting MSL !");
            // $("." + MSL_box_class + "").css("display", "none");
            loading_hide();
        } else {
            send_latlong_and_get_MSL(latitude, longitude);
        }
    } catch (e) {
        alert1(e + '_get_latlong_from_numericbox_MSL()');
        loading_hide();
    }
}

function send_latlong_and_get_MSL(latitude, longitude) {
    try {
        var q_jsonobj = [];
        q_jsonobj.push({
            lat: latitude,
            long: longitude
        });
        cordova.exec(onsuccess_send_latlong_and_get_MSL,
				onfail_send_latlong_and_get_MSL, 'elevation', 'nck', q_jsonobj);
    } catch (e) {
        alert1(e + '_send_latlong_and_get_MSL()');
        loading_hide();
    }
}

function onsuccess_send_latlong_and_get_MSL(e) {
    try {
        $('a.button-fill').removeClass('li_disabled');
        form_has_changed = "true";                      //to get confirmation on back btn while editing form
        var myArray = JSON.parse(e);
        // alert1(JSON.stringify(myArray));
        var MSL = myArray[0].altitude;
        if (MSL == '' || MSL == null || MSL == undefined) {
            // when internet is off
            alert1("Network Error, MSL is not saved, Please try again !");
        } else {
            var txtno_MSL = curr_survey_data["txtno_MSL"];
            $("#" + txtno_MSL + "").val(MSL);
            var btn_item_id_MSL = curr_survey_data["btn_item_id_MSL"];

            //jsonObj[btn_item_id_MSL].ans = MSL;

            var curr_form_flag = form_flag;
            if (curr_form_flag == 0 || curr_form_flag == 6 || curr_form_flag == 7) {
                let task_create_popup = $('.popup-new-task-create.modal-in:visible');
                if (task_create_popup.length > 0) {
                    //new task create popup [FT-08052025]
                    jsonObj_task_add[btn_item_id_MSL].ans = MSL;
                }
                else {
                    // normal form
                    jsonObj_old[btn_item_id_MSL].ans = MSL;
                }
            } else if (curr_form_flag == 1 || curr_form_flag == 4 || curr_form_flag == 5) {
                // type22 form
                jsonObj_type22[btn_item_id_MSL].ans = MSL;
            } else if (curr_form_flag == 2 || curr_form_flag == 3) {
                // type23 form
                jsonObj_type23[btn_item_id_MSL].ans = MSL;
            }
        }
        loading_hide();
    } catch (e) {
        alert1(e + '_onsuccess_send_latlong_and_get_MSL()');
        loading_hide();
    }
}

function onfail_send_latlong_and_get_MSL(e) {
    alert1("Network Error, MSL is not saved, Please try again !");
    loading_hide();
}
