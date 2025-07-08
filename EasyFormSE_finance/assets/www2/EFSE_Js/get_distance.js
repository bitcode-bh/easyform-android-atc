// call on Get Distance button

function get_latlong_from_numericbox_distance(item_id, lat_box_class,
		long_box_class, distance_box_class) {
    try {
        loading();
        curr_survey_data["btn_item_id_distance"] = item_id;

        // $("." + lat_box_class + "").css("display", "block");
        // $("." + long_box_class + "").css("display", "block");
        //$("." + distance_box_class + "").css("display", "block");

        var lat_box_id = $("." + lat_box_class + " :input").attr("id");
        var long_box_id = $("." + long_box_class + " :input").attr("id");
        var distance_box_id = $("." + distance_box_class + " :input").attr("id");

        curr_survey_data["txtno_distance"] = distance_box_id;

        var latitude = $("#" + lat_box_id + "").val();
        var longitude = $("#" + long_box_id + "").val();

        if (latitude == "" || latitude == undefined || latitude == null || longitude == "" || longitude == undefined || longitude == null) {
            alert1("Please enter lat long before getting distance !");
            //			$("." + distance_box_class + "").css("display", "none");
            loading_hide();
        } else {
            send_latlong_and_get_distance(latitude, longitude);
        }
    } catch (e) {
        alert1(e + '_get_latlong_from_numericbox_distance()');
        loading_hide();
    }
}

function send_latlong_and_get_distance(latitude, longitude) {
    try {
        var selected_tid = JSON.parse(storage.getItem('tid'));
        var q_jsonobj = [];
        q_jsonobj.push({
            lat: latitude,
            long: longitude,
            tid: selected_tid
        });
        //		alert1(JSON.stringify(q_jsonobj));
        cordova.exec(onsuccess_send_latlong_and_get_distance, onfail_send_latlong_and_get_distance, 'distance', 'nck', q_jsonobj);
    } catch (e) {
        alert1(e + '_send_latlong_and_get_distance()');
        loading_hide();
    }
}

function onsuccess_send_latlong_and_get_distance(e) {
    try {
        form_has_changed = "true";                      //to get confirmation on back btn while editing form
        var myArray = JSON.parse(e);
        //		alert1(JSON.stringify(myArray));
        var distance = myArray[0].distance;
        distance = Math.round(distance);
        var txtno_distance = curr_survey_data["txtno_distance"];

        $("#" + txtno_distance + "").val(distance);

        var btn_item_id_distance = curr_survey_data["btn_item_id_distance"];

        //jsonObj[btn_item_id_distance].ans = distance;

        var curr_form_flag = form_flag;
        if (curr_form_flag == 0 || curr_form_flag == 6 || curr_form_flag == 7) {
            let task_create_popup = $('.popup-new-task-create.modal-in:visible');
            if (task_create_popup.length > 0) {
                //new task create popup [FT-08052025]
                jsonObj_task_add[btn_item_id_distance].ans = distance;
            }
            else {
                // normal form
                jsonObj_old[btn_item_id_distance].ans = distance;
            }
        } else if (curr_form_flag == 1 || curr_form_flag == 4 || curr_form_flag == 5) {
            // type22 form
            jsonObj_type22[btn_item_id_distance].ans = distance;
        } else if (curr_form_flag == 2 || curr_form_flag == 3) {
            // type23 form
            jsonObj_type23[btn_item_id_distance].ans = distance;
        }

        loading_hide();
    } catch (e) {
        alert1(e + '_onsuccess_send_latlong_and_get_distance()');
        loading_hide();
    }
}

function onfail_send_latlong_and_get_distance(e) {
    alert1("Network Error, Distance is not saved, Please try again !");
    loading_hide();
}
