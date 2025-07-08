// call on Get Latlong button
function get_latlong_box_classes(item_id, lat_box_class, long_box_class, t_map_view, t_form_flag) {
    try {
        loading();
        form_flag = t_form_flag;
        curr_survey_data["btn_item_id"] = item_id;
        // $("." + lat_box_class + "").css("display", "block");
        // $("." + long_box_class + "").css("display", "block");
        var lat_box_id = $("." + lat_box_class + " :input").attr("id");
        var long_box_id = $("." + long_box_class + " :input").attr("id");
        curr_survey_data["txtno_lat"] = lat_box_id;
        curr_survey_data["txtno_long"] = long_box_id;
        get_user_latlong_and_print(t_map_view);
    } catch (e) {
        alert1(e + '_get_latlong_box_classes()');
        loading_hide();
    }
}

function get_user_latlong_and_print(t_map_view) {
    try {
        var q_jsonobj = [];
        q_jsonobj.push({
            map_view: t_map_view
        });

        cordova.exec(onsuccess_get_user_latlong_and_print, onfail_get_user_latlong_and_print, 'maulik', 'nck', q_jsonobj);
    } catch (e) {
        alert1(e + '_get_user_latlong_and_print()');
        loading_hide();
    }
}

function onsuccess_get_user_latlong_and_print(e) {
    try {
        var myArray = JSON.parse(e);
        // alert1(JSON.stringify(e));
        if (myArray.length > 0) {
            if (myArray[0].lat == "" || myArray[0].lat == undefined
                || myArray[0].lat == null) {
                var latitude = "0";
            } else {
                var latitude = myArray[0].lat;
            }
            if (myArray[0].lon == "" || myArray[0].lon == undefined
                || myArray[0].lon == null) {
                var longitude = "0";
            } else {
                var longitude = myArray[0].lon;
            }
        } else {
            var latitude = "0";
            var longitude = "0";
        }

        var txtno_lat = curr_survey_data["txtno_lat"];
        var txtno_long = curr_survey_data["txtno_long"];

        latitude = parseFloat(latitude);
        longitude = parseFloat(longitude);

        if (latitude.toString().length > 6) {
            latitude = latitude.toFixed(6);
        }

        if (longitude.toString().length > 6) {
            longitude = longitude.toFixed(6);
        }

        $("#" + txtno_lat + "").val(latitude);
        $("#" + txtno_long + "").val(longitude);

        var btn_item_id = curr_survey_data["btn_item_id"];
        var curr_form_flag = form_flag;
        //if (curr_form_flag == 0) {
        //	// normal form
        //	jsonObj_old[btn_item_id].ans = latitude + "_" + longitude;
        //} else if (curr_form_flag == 1 || curr_form_flag == 4
        //		|| curr_form_flag == 5) {
        //	// type22 form
        //	jsonObj_type22[btn_item_id].ans = latitude + "_" + longitude;
        //} else if (curr_form_flag == 2 || curr_form_flag == 3) {
        //	// type23 form
        //	jsonObj_type23[btn_item_id].ans = latitude + "_" + longitude;
        //}

        if (curr_form_flag == 0 || curr_form_flag == 6) {
            let task_create_popup = $('.popup-new-task-create.modal-in:visible');
            if (task_create_popup.length > 0) {
                //new task create popup [FT-08052025]
                jsonObj_task_add[item_id].ans = latitude + "_" + longitude;
            }
            else {
                // normal form
                jsonObj_old[btn_item_id].ans = latitude + "_" + longitude;
            }
        }
        else if (curr_form_flag == 7) {
            // customer form
            jsonObj_cust_add[btn_item_id].ans = latitude + "_" + longitude;
        }
        else if (curr_form_flag == 1 || curr_form_flag == 4 || curr_form_flag == 5) {
            // type22 form
            jsonObj_type22[btn_item_id].ans = latitude + "_" + longitude;
        }
        else if (curr_form_flag == 2 || curr_form_flag == 3) {
            // type23 form
            jsonObj_type23[btn_item_id].ans = latitude + "_" + longitude;
        }
        loading_hide();
    } catch (e) {
        alert1(e + '_onsuccess_get_user_latlong_and_print()');
        loading_hide();
    }
}

function onfail_get_user_latlong_and_print(e) {
    //alert1("Network Error, Latlong is not saved, Please try again !");
    loading_hide();
}
