// hide/show collapse div
function toggle_collapse_div(temp_new_id) {
    try {
        curr_clps_new_id = temp_new_id;
        toggle_collapse = $("#lbl_collapse_" + temp_new_id + "").attr("name");
        if (toggle_collapse == 0) {
            // show collapse div
            $("#lbl_collapse_" + temp_new_id + "").attr("name", "1");
            //$('#default_collapse_lbl_' + temp_new_id + '').hide();
            toggle_collapse = 1;
            collapse_Json = [];
            var Type23_Data_Str = $('#hdn_type23_data_' + temp_new_id + '').val();
            collapse_Json = itemObj._checkStrObj(decodeURIComponent(Type23_Data_Str));  		// check_item
            //loading();
            show_collapsible_div();
        } else {
            // hide collapse div
            $("#lbl_collapse_" + temp_new_id + "").attr("name", "0");
            //setTimeout(function () {
            //    $('#default_collapse_lbl_' + temp_new_id + '').show();
            //}, 500);
            form_flag = 0;
            curr_clps_new_id = 0;
            toggle_collapse = 0;
            clearTimeout(edit_collapse_timer);
            // $("#lbl_collapse").text(" Click To Show Step ");
            // $("#collapse_container_div").slideUp();
            // $("#img_edit_collapse").hide();

            //$("#lbl_collapse_" + temp_new_id + "").text(" Click To Show Step ");

            $("#collapse_container_div_" + temp_new_id + "").slideUp();

            $("#img_edit_collapse_" + temp_new_id + "").hide();

            $("#lbl_collapse_" + temp_new_id + "").attr("src", "images/maximize.png");
            $("#lbl_collapse_" + temp_new_id + "").css({
                'margin-bottom': '10px',
                'margin-right': '10px',
                'width': '22px',
                'height': '22px'
            })
        }
    } catch (e) {
        alert1(e + '_toggle_collapse_div()');
    }
}

// show collapse div
function show_collapsible_div() {
    try {
        $("#collapse_container_div_" + curr_clps_new_id + "").slideDown();
        var editable = collapse_Json[0].editable;
        if (editable == "true") {
            show_edit_img(curr_clps_new_id);
        }
        //$("#lbl_collapse_" + curr_clps_new_id + "").text(" Click To Hide Step ");

        $("#lbl_collapse_" + curr_clps_new_id + "").attr("src", "images/minimize.png");

        get_last_step_data();
    } catch (e) {
        alert1(e + '_show_collapsible_div()');
    }
}

// show edit image
function show_edit_img(temp_new_id) {
    edit_collapse_timer = setTimeout(function () {
        //$("#img_edit_collapse_" + temp_new_id + "").show();
        if (collapse_id_Array.length <= 1) {
            $("img[id^=img_edit_collapse_]").show();
        }
    }, 1000);
}

// ///////////// popup div portion start //////////////////////////
// show popup collapsible step div
function popup_collapse_div_show_type23(temp_new_id) {
    // $("#collapse_container_div").empty(); // empty collapsible form before create new form in popup to clear IDs
    curr_clps_new_id = temp_new_id;

    myApp.popup('.popup-type23');

    $("#collapse_container_div_" + curr_clps_new_id + "").empty();

    collapse_Json = [];
    var Type23_Data_Str = $('#hdn_type23_data_' + temp_new_id + '').val();
    collapse_Json = itemObj._checkStrObj(decodeURIComponent(Type23_Data_Str));  		// check_item

    enable_popup = 1;
    $("#img_edit_collapse_" + curr_clps_new_id + "").attr("alt", "1");
    get_last_step_data();
}

// hide popup collapsible step div
function popup_collapse_div_hide_type23() {
    enable_popup = 0;
    myApp.closeModal('.popup-type23');
    $("#img_edit_collapse_" + curr_clps_new_id + "").attr("alt", "0");
    show_collapsible_div(); // refresh collapse div form to view updated data from popup
}

// get last step data from native (or server)
function get_last_step_data() {
    try {
        storage.setItem('back_step_found', JSON.stringify('0'));

        //collapse_Json[0].collapsible_api = "WCF_TransportApp_GetTripDetails";
        var collapsible_api = collapse_Json[0].collapsible_api;
        if (collapsible_api == "" || collapsible_api == null || collapsible_api == undefined) {
            var get_data = collapse_Json[0].get_data;
            // var get_data = "server";
            if (get_data == "" || get_data == null || get_data == undefined || get_data == "hybrid") {
                // first local > if not found then server
                var t_id = JSON.parse(storage.getItem('tid'));
                var step = collapse_Json[0].clps_step;
                var check_type = collapse_Json[0].checksheet_id;
                var query = "select f_data from f_master where tid = '" + t_id + "' and c_id = '" + check_type + "' and step = '" + step + "'";
                var q_jsonobj = [];
                q_jsonobj.push({
                    data: query,
                    p: "0"
                });
                AppBridge.on(cordova).first(onsuccess_get_last_step_data, onfail_get_last_step_data, 'formDataByStep', { tid: t_id, c_id: check_type, step: step });
            } else {
                // from server
                select_detail_for_back_survey_collapse_form();
            }
        }
        else {
            var trip_id = localStorage.getItem("transport_trip_id");
            
            var param_obj = [];
            param_obj.push({
                'trip_id': trip_id
            });

            var getdata = new Webservicecall_REST(global_wcf_url + collapsible_api, JSON.stringify(param_obj), function (e) {
                var responseText = JSON.parse(e.responseText);
                //var responseText = [{ "Success": true, "Code": 200, "Message": "Get Trip Detail.", "data": { "code": "success", "message": "Get Trip Detail.", "data": { "tripDetail": { "trip_id": "TRPMP07062021360", "created_by_name": "Parth prabhakar ", "createdDate": "06/07/2021", "approved_by_name": "Manish Vijay ", "approvedDate": "06/07/2021", "tripPlanDate": "05/24/2021", "travel_plan_status": "TRIP CREATED", "travel_plan_type": "MRN", "count": 1, "noOfSiteCount": 1, "totalQuantity": 2, "warehouse_google_distance": "210.54", "tripAdditionalDistance": 0, "tripExtraDistance": 0, "tripTotalCost": 0, "from_sourceAddress": "713-ATCTIPL MADHYA PRADESH WAREHOUSE", "from_sourceCity": null, "from_sourceState": null, "from_sourceCircle": "IND Madhya Pradesh", "from_sourcePin": "462026", "from_sourceSiteID": "", "from_sourceSiteName": "", "to_destinationAddress": "MR MAHESH TIWARI S/O, MR KANHAIYALAL TIWARI, L4", "to_destinationCity": "Indore", "to_destinationState": "MADHYA PRADESH", "to_destinationCircle": "", "to_destinationPin": "", "to_destinationSiteID": "557552", "to_destinationSiteName": "SHIV SHAKTI NAGAR" }, "tripRequestData": [{ "requestID": "97013", "description": "Rectifier Emerson 4000W", "transactionID": "2130022593", "globalSiteId": "557552", "circle": "IND Madhya Pradesh", "entity": "607", "transactionType": "MRN", "itemCode": "IN.P706", "assetCode": null, "assetType": null, "assetSubtype": null, "quantity": "2", "sumOfQuantity": 2, "projectName": "557552_Maintenance", "projectDesc": "557552_Maintenance", "fromSubInv": null, "toSubInv": null, "createdBy": null, "creationDate": null, "status": "Approved", "requestStatus": "APPROVED", "requestStatusTxt": "", "weight": 0 }], "tripVechileData": { "id": "339", "tp_travel_plan_master_id": "360", "tp_vehicle_type_master_id": "11", "vehicle_type_name": "Hand Delivery", "vehicle_name": "Hand Delivery", "vehicle_capacity": "0", "vehicle_registration_no": "", "escort_applicable": "NO", "helper_name": "", "helper_mobile_no": "", "out_date_time": null, "in_date_time": "2021-06-07 02:45:00", "actual_in_date_time": null, "vehicle_odometer_reading_start": null, "vehicle_odometer_reading_end": null, "driver_name": "Mansi", "driver_phone_no": "6546564565", "license_number": "", "total_distance": null, "extra_distance": null, "additional_distance": null, "rate_per_km": null, "total_cost": null, "vehicle_assigned_by_id": null, "vehicle_assigned_by_name": null, "vehicle_assigned_status": "ASSIGNED", "vehicle_assign_date": "2021-06-07 10:07:20", "modified_date": null, "eway_bill_applicable": "NO", "eway_bill_no": "", "eway_bill_creation_date": null, "eway_bill_expiry_date": null, "error_message": null, "lr_number": null, "lr_date": null, "system_proposed_vehicle_id": "11", "system_proposed_vehicle_name": "Hand Delivery", "system_proposed_vehicle_capacity": "0", "puc_expiry_date": null, "fitness_expiry_date": null, "dl_expiry_date": null, "laden_weight": "250", "unladen_weight": "22", "revised_vehicle_comment": null, "trip_revised_vehicle_comment": null }, "googleMapData": { "originGmap": "23.095819000000, 77.508565000000", "destinationGmap": "22.741100000000, 75.889000000000", "waypnt": [], "centerTitleGmap": "23.095819000000, 77.508565000000", "geoCodeAddrGmap": "23.095819000000, 77.508565000000", "travelPlanMasterId": "360", "requestType": "MRN", "waypntAddress": ["713-ATCTIPL MADHYA PRADESH WAREHOUSE  ", "MR MAHESH TIWARI S/O, MR KANHAIYALAL TIWARI, L4 Indore MADHYA PRADESH"], "selectedGoogleIndex": "0", "type": ["warehouse", ""] }, "commentData": [{ "VendorTransportStatusTracking_id": "7294", "VendorTransportStatusTracking_request_id": "97013", "VendorTransportStatusTracking_assigned_to_id": null, "VendorTransportStatusTracking_assigned_to_name": null, "VendorTransportStatusTracking_assigned_to_role": null, "VendorTransportStatusTracking_assigned_by_id": "72", "VendorTransportStatusTracking_assigned_by_name": "B.P Logistics Pvt Ltd ", "VendorTransportStatusTracking_assigned_by_role": "Vendor", "VendorTransportStatusTracking_created_date": "07/06/2021", "VendorTransportStatusTracking_tp_remark_master_id": "0", "VendorTransportStatusTracking_remark": "", "VendorTransportStatusTracking_comment_id": "7338", "VendorTransportStatusTracking_request_status": "ACCEPTED", "VendorTransportStatusTracking_section_tag": "ASSIGNED REQUEST - UPDATE PLAN STATUS", "VendorTransportStatusTracking_module_tag": "VENDOR TRANPORT", "createDate": "2021-06-07 10:07:20", "authorname": "B.P Logistics Pvt Ltd ", "commenttext": "fine" }, { "VendorTransportStatusTracking_id": "7293", "VendorTransportStatusTracking_request_id": "97013", "VendorTransportStatusTracking_assigned_to_id": "72", "VendorTransportStatusTracking_assigned_to_name": "B.P Logistics Pvt Ltd", "VendorTransportStatusTracking_assigned_to_role": "Vendor", "VendorTransportStatusTracking_assigned_by_id": "32", "VendorTransportStatusTracking_assigned_by_name": "Parth prabhakar ", "VendorTransportStatusTracking_assigned_by_role": "Warehouse", "VendorTransportStatusTracking_created_date": "07/06/2021", "VendorTransportStatusTracking_tp_remark_master_id": "0", "VendorTransportStatusTracking_remark": null, "VendorTransportStatusTracking_comment_id": "7337", "VendorTransportStatusTracking_request_status": "ASSIGNED TO TRANSPORTER", "VendorTransportStatusTracking_section_tag": "ASSIGN REQUEST", "VendorTransportStatusTracking_module_tag": "TRANSPORTATION REQUEST", "createDate": "2021-06-07 10:05:43", "authorname": "Parth prabhakar ", "commenttext": "Assign" }, { "VendorTransportStatusTracking_id": "7292", "VendorTransportStatusTracking_request_id": "97013", "VendorTransportStatusTracking_assigned_to_id": null, "VendorTransportStatusTracking_assigned_to_name": null, "VendorTransportStatusTracking_assigned_to_role": null, "VendorTransportStatusTracking_assigned_by_id": "16", "VendorTransportStatusTracking_assigned_by_name": "Manish Vijay ", "VendorTransportStatusTracking_assigned_by_role": "SCM", "VendorTransportStatusTracking_created_date": "07/06/2021", "VendorTransportStatusTracking_tp_remark_master_id": "0", "VendorTransportStatusTracking_remark": null, "VendorTransportStatusTracking_comment_id": "7336", "VendorTransportStatusTracking_request_status": "TRIP CREATED", "VendorTransportStatusTracking_section_tag": "ASSIGNED REQUEST - CREATE PLAN", "VendorTransportStatusTracking_module_tag": "VENDOR TRANPORT", "createDate": "2021-06-07 10:04:54", "authorname": "Manish Vijay ", "commenttext": "Trip has been approved by SCM user" }, { "VendorTransportStatusTracking_id": "7291", "VendorTransportStatusTracking_request_id": "97013", "VendorTransportStatusTracking_assigned_to_id": null, "VendorTransportStatusTracking_assigned_to_name": null, "VendorTransportStatusTracking_assigned_to_role": null, "VendorTransportStatusTracking_assigned_by_id": "16", "VendorTransportStatusTracking_assigned_by_name": "Manish Vijay ", "VendorTransportStatusTracking_assigned_by_role": "SCM", "VendorTransportStatusTracking_created_date": "07/06/2021", "VendorTransportStatusTracking_tp_remark_master_id": "0", "VendorTransportStatusTracking_remark": null, "VendorTransportStatusTracking_comment_id": "7335", "VendorTransportStatusTracking_request_status": "TRIP VEHICLE CHANGE", "VendorTransportStatusTracking_section_tag": "TRIP VEHICLE CHANGE", "VendorTransportStatusTracking_module_tag": "VENDOR TRANPORT", "createDate": "2021-06-07 10:04:38", "authorname": "Manish Vijay ", "commenttext": "fine" }, { "VendorTransportStatusTracking_id": "7290", "VendorTransportStatusTracking_request_id": "97013", "VendorTransportStatusTracking_assigned_to_id": null, "VendorTransportStatusTracking_assigned_to_name": null, "VendorTransportStatusTracking_assigned_to_role": null, "VendorTransportStatusTracking_assigned_by_id": "16", "VendorTransportStatusTracking_assigned_by_name": "Manish Vijay ", "VendorTransportStatusTracking_assigned_by_role": "SCM", "VendorTransportStatusTracking_created_date": "07/06/2021", "VendorTransportStatusTracking_tp_remark_master_id": "0", "VendorTransportStatusTracking_remark": null, "VendorTransportStatusTracking_comment_id": "7334", "VendorTransportStatusTracking_request_status": "TRIP WareHouse Change", "VendorTransportStatusTracking_section_tag": "TRIP VEHICLE CHANGE", "VendorTransportStatusTracking_module_tag": "VENDOR TRANPORT", "createDate": "2021-06-07 10:04:29", "authorname": "Manish Vijay ", "commenttext": "ok" }, { "VendorTransportStatusTracking_id": "7289", "VendorTransportStatusTracking_request_id": "97013", "VendorTransportStatusTracking_assigned_to_id": null, "VendorTransportStatusTracking_assigned_to_name": null, "VendorTransportStatusTracking_assigned_to_role": null, "VendorTransportStatusTracking_assigned_by_id": "32", "VendorTransportStatusTracking_assigned_by_name": "Parth prabhakar ", "VendorTransportStatusTracking_assigned_by_role": "Warehouse", "VendorTransportStatusTracking_created_date": "07/06/2021", "VendorTransportStatusTracking_tp_remark_master_id": "0", "VendorTransportStatusTracking_remark": null, "VendorTransportStatusTracking_comment_id": "7333", "VendorTransportStatusTracking_request_status": "TRIP CREATED", "VendorTransportStatusTracking_section_tag": "ASSIGNED REQUEST - CREATE PLAN", "VendorTransportStatusTracking_module_tag": "VENDOR TRANPORT", "createDate": "2021-06-07 10:02:09", "authorname": "Parth prabhakar ", "commenttext": "Trip created" }], "tripFileData": [] } } }];
                var status = responseText[0].Code;
                var message = responseText[0].Message;
                if (status == 200) {
                    var myArray = responseText[0].data;
                    var data = myArray.data;
                    var tripDetail_obj = data.tripDetail;

                    //---convery obj to ary-----
                    var key_ary = Object.keys(tripDetail_obj);
                    var val_ary = Object.values(tripDetail_obj);
                    var tripDetail_ary = Object.entries(tripDetail_obj);

                    display_api_data_in_collapsible(tripDetail_ary);
                }
                else {
                    alert1(message + '_get_last_step_data');
                    loading_hide();
                }
            }, onfail_request);
            getdata.callOtherDomain();
        }
    } catch (e) {
        alert1(e + '_get_last_step_data()');
        loading_hide();
    }
}

// onsuccess get last step data
function onsuccess_get_last_step_data(e) {
    try {
        // alert1("Survey Found ! - Reading from file master table...");
        storage.setItem('back_step_found', JSON.stringify('1'));
        var myArray = JSON.parse(e);
        finaljsonObj_type23 = myArray;
        var heading = myArray[0].subcategory;
        var check_type = collapse_Json[0].checksheet_id;
        var step = myArray[0].stepid;
        var data = myArray[0].data;

        // parse again for customer and task json data
        var checksheet_type = collapse_Json[0].checksheet_type;
        if (checksheet_type == 3 || checksheet_type == 5) {
            data = itemObj._checkStrObj(data);  		// check_item
        }

        var buttons = myArray[0].buttons;
        f_lat = myArray[0].f_lat;
        f_long = myArray[0].f_long;
        f_address = myArray[0].f_address;
        f_milli = myArray[0].f_milli;

        var t_data = itemObj._checkStrObj(data);        // check_item
        var default_lbl = t_data[0].value;
        //$('#default_collapse_lbl_' + curr_clps_new_id + '').text(default_lbl);

        var edit_flag = $("#img_edit_collapse_" + curr_clps_new_id + "").attr("alt");

        if (edit_flag == 1) {
            // bind form to popup div
            if (checksheet_type == 3) {
                //for customer checksheet log, dont merge and create form with log json
                read_dynamic_surveydata_main(heading, check_type, step, data, buttons, 3, 0);
            }
            else {
                read_dynamic_surveydata(heading, check_type, step, data, buttons, 3, 0);
            }
        } else {
            // binding form to attached
            if (checksheet_type == 3) {
                //for customer checksheet log, dont merge and create form with log json
                read_dynamic_surveydata_main(heading, check_type, step, data, buttons, 2, 1);
            }
            else {
                read_dynamic_surveydata(heading, check_type, step, data, buttons, 2, 1);
            }
        }
    } catch (e) {
        alert1(e + '_onsuccess_get_last_step_data()');
        loading_hide();
    }
}

// onfail get last step data
function onfail_get_last_step_data(e) {
    try {
        // alert1("Survey Not Found ! - checking server call... ");
        // get survey data from server
        select_detail_for_back_survey_collapse_form();
    } catch (e) {
        alert1(e + '_onfail_get_last_step_data()');
        loading_hide();
    }
}

function display_api_data_in_collapsible(tripDetail_ary) {
    try {
        var str = '';
        str += '<div class="cntrl_main_div" style="margin:0; font-size: 10pt;">';
        str += '<label style="display:block; text-align:justify; margin-bottom:5px; font-size: 15px; font-weight:bold; font-family: calibri; border-bottom: 2px solid #989696; background-color: #f6f6f6;padding:45px 10px 10px;min-height: 20px;">Trip Details</label>';
        str += '</div>';

        for (var i = 0; i < tripDetail_ary.length; i++) {
            var label_str = tripDetail_ary[i][0];
            var ans = tripDetail_ary[i][1];
            if (ans == "" || ans == null || ans == undefined) {
                ans = "";
            }
            str += '<div class="cntrl_main_div" style="padding: 5px;" disabled>';
            str += '<table class="tbl_read_only">';
            str += '<tr>';
            str += '<td>';
            str += '<label class="lbl_read_only">' + label_str + '</label>';
            str += '</td>';
            str += '<td>';
            str += '<span class="cls-read-only">' + ans + '</span>';
            str += '</td>';
            str += '</tr>';
            str += '</table>';
            str += '</div>';
        }

        $("#collapse_container_div_" + curr_clps_new_id + "").append(str);
        loading_hide();

        if (collapse_id_Array.length > 0) {
            var clps_id = collapse_id_Array[0];
            collapse_id_Array.shift();
            var item = $('#div_step_Col_' + clps_id + ' > div > ul > li');
            myApp.accordionOpen(item);
            toggle_collapse_div(clps_id);
        }
    }
    catch (e) {
        alert1(e + '_display_api_data_in_collapsible');
    }
}

function update_collapse_form_data() {
    try {
        validate_and_submit_surveydata("", 3, jsonObj_type23);
    } catch (e) {
        alert1(e + '_update_collapse_form_data()');
    }
}

// check update_outer element flag
function check_update_outer_element_flag(data) {
    try {
        jsonObj_type23 = data; // updated json from popup
        var update_outer_ele = collapse_Json[0].update_outer_ele;
        if (update_outer_ele == "true") {
            // update outer elements
            // get current lat long address accuracy
            cordova.exec(onsuccess_get_lat_long_collapse_form, onfail_get_lat_long_collapse_form, 'maulik', 'nck', ["ds"]);
        } else {
            // do not update outer elements

            // stringify again for customer and task json data
            var checksheet_type = collapse_Json[0].checksheet_type;
            if (checksheet_type == 3 || checksheet_type == 5) {
                data = JSON.stringify(data);
            }

            finaljsonObj_type23[0].data = data;
            

            if (checksheet_type == 1) {
                curr_survey_data["json"] = finaljsonObj_type23[0].data  ;
                update_question_log();
            }
            else if (checksheet_type == 3) {
                Update_Json();
            }
            else if (checksheet_type == 5) {
                update_task();
            }
            else {
                update_old_entry_collapse_form();
            }             
        }

    } catch (e) {
        alert1(e + '_check_update_outer_element_flag()');
    }
}

function onsuccess_get_lat_long_collapse_form(e) {
    try {
        var myArray = JSON.parse(e);
        if (myArray[0].gps == "" || myArray[0].gps == undefined || myArray[0].gps == null) {
            var gps = "0";
        } else {
            var gps = myArray[0].gps;
        }
        if (myArray[0].accuracy == "" || myArray[0].accuracy == undefined || myArray[0].accuracy == null) {
            var accuracy = "0";
        } else {
            var accuracy = myArray[0].accuracy;
        }
        if (myArray[0].diff_time == "" || myArray[0].diff_time == undefined || myArray[0].diff_time == null) {
            var diff_time = "0";
        } else {
            var diff_time = myArray[0].diff_time;
        }
        if (myArray[0].address == "" || myArray[0].address == undefined || myArray[0].address == null) {
            var address = "N/A";
        } else {
            var address = myArray[0].address;
        }
        if (myArray[0].lat == "" || myArray[0].lat == undefined || myArray[0].lat == null) {
            var lat = "0";
        } else {
            var lat = myArray[0].lat;
        }
        if (myArray[0].lon == "" || myArray[0].lon == undefined || myArray[0].lon == null) {
            var long = "0";
        } else {
            var long = myArray[0].lon;
        }
        if (myArray[0].imei == "" || myArray[0].imei == undefined || myArray[0].imei == null) {
            var imei_no = imeino;
        } else {
            var imei_no = myArray[0].imei;
        }
        create_new_finaljson_collapse_form(imei_no, address, lat, long, gps, accuracy, diff_time);
    } catch (e) {
        // alert1("Current location is not saved due to GPS problem !");
        var imei_no = imeino;
        create_new_finaljson_collapse_form(imei_no, "N/A", "0", "0", "0", "0", "0");
    }
}

function create_new_finaljson_collapse_form(imei_no, address, lat, long, gps, accuracy, diff_time) {
    try {
        var date_s = new Date();
        var date = date_s.getTime();
        finaljsonObj_type23[0].date = date;
        finaljsonObj_type23[0].date_s = date_s;
        finaljsonObj_type23[0].lat = lat;
        finaljsonObj_type23[0].long1 = long;
        finaljsonObj_type23[0].address = address;
        finaljsonObj_type23[0].gps = gps;
        finaljsonObj_type23[0].accuracy = accuracy;
        finaljsonObj_type23[0].diff_time = diff_time;

        // stringify again for customer and task json data
        var data = jsonObj_type23;
        var checksheet_type = collapse_Json[0].checksheet_type;
        if (checksheet_type == 3 || checksheet_type == 5) {
            data = JSON.stringify(data);
        }       
        update_old_entry_collapse_form();
    } catch (e) {
        alert1(e + '_create_new_finaljson_collapse_form()');
    }
}

// update data to f_master table - goto action - Save & Next/Reject Buttons
function update_old_entry_collapse_form() {
    try {
        // alert1("Old Entry Found ! - Update Checksheet details...");
        var get_data = collapse_Json[0].get_data;
        // var get_data = "server";
        if (get_data == "" || get_data == null || get_data == undefined || get_data == "hybrid") {
            var date_s = new Date();
            var time = date_s.getTime();
            var t_id = curr_survey_data["t_id"];
            var step = collapse_Json[0].clps_step;
            var check_type = collapse_Json[0].checksheet_id;
            var Data = finaljsonObj_type23[0].data;
            finaljsonObj_type23[0].data = Data;
            var fileData = JSON.stringify(finaljsonObj_type23);
            var query = "UPDATE f_master SET millisecond='" + time + "', flag='0', f_data = '" + fileData + "' where tid = '" + t_id + "' and c_id = '" + check_type + "' and step = '" + step + "'";
            var q_jsonobj = [];
            q_jsonobj.push({
                data: query,
                q: "0",
                tid: t_id
            });
            cordova.exec(update_task_flag, onfail_update_old_entry_collapse_form, 'SqlitePlugin', 'insertValuse', q_jsonobj);
        }
        else {
            // server update
            var Data = finaljsonObj_type23[0].data;
            finaljsonObj_type23[0].data = Data;
            var fileData = JSON.stringify(finaljsonObj_type23); // update new json in table
            var company_id = JSON.parse(storage.getItem('company_id'));
            var user_id = JSON.parse(storage.getItem('user_id'));

            var s_servertaskid = curr_survey_data["server_task_id"];
            var s_check_type = collapse_Json[0].checksheet_type;
            var s_step = collapse_Json[0].clps_step;

            var auth_obj = [];
            auth_obj.push({
                'username': username,
                'u_c': uniqcode
            });

            var param_obj = [];
            param_obj.push({
                'Company_Id': company_id,
                'User_Id': user_id,
                'server_task_id': s_servertaskid,
                'f_data': fileData,
                'auth': auth_obj,
                'checksheet_type': s_check_type
            });

            //var sp_obj = [];
            //sp_obj.push({
            //    'sp_name': "InsertNewEntry_Port_Collapsible",  //updating old survey
            //    'param': param_obj
            //});

            loading();
            //var getdata = new webservice_inner_call(sp_obj, onsuccess_update_old_entry_collapse_form, onfail_update_old_entry_collapse_form);

            var getdata = new Webservicecall_REST(common_global_wcf_url + 'WCF_InsertNewEntry_Port_Collapsible', JSON.stringify(param_obj), onsuccess_update_old_entry_collapse_form, onfail_update_old_entry_collapse_form);
            getdata.callOtherDomain();

            //-- server webservice call end -----
        }
    } catch (e) {
        alert1(e + '_update_old_entry_collapse_form()');
        loading_hide();
    }
}

function onsuccess_update_old_entry_collapse_form(e) {
    try {
        var responseText = JSON.parse(e.responseText);
        var status = responseText[0].status;
        if (status == 1) {
            alert1("Your data has been saved successfully !");
            loading_hide();
            popup_collapse_div_hide_type23();
        }
        else {
            loading_hide();
            alert1(responseText[0].message);
        }
    } catch (e) {
        alert1(e + '_onsuccess_update_old_entry_collapse_form()');
    }
}

// getting data for getting back step survey data from server
function select_detail_for_back_survey_collapse_form() {
    try {
        //loading();
        var s_servertaskid = curr_survey_data["server_task_id"];
        var s_check_type = collapse_Json[0].checksheet_id;
        var s_step = collapse_Json[0].clps_step;
        var s_check_parent = collapse_Json[0].check_parent;
        if (s_check_parent == "" || s_check_parent == null || s_check_parent == undefined) {
            s_check_parent = "false";
        }

        if (s_servertaskid == "" || s_servertaskid == null || s_servertaskid == undefined) {
            s_servertaskid = JSON.parse(storage.getItem('p_server_task_id'));
        }

        var param_obj = [];
        param_obj.push({
            'servertaskid': s_servertaskid,
            'stepid': s_step,
            'check_type': s_check_type,
            'check_parent': s_check_parent
        });

        var appversion = JSON.parse(storage.getItem('appversion'));
        var auth = [];
        auth.push({
            "username": username,
            "devicetype": F7_device,
            "appid": "",
            "u_c": uniqcode,
            "appversion": appversion
        });

        var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_GetBackSurvey', JSON.stringify(param_obj), onsuccesss_select_detail_for_back_survey_collapse_form, onfail_select_detail_for_back_survey_collapse_form);
        getdata.callOtherDomain();
    } catch (e) {
        alert1(e + '_select_detail_for_back_survey_collapse_form()');
        loading_hide();
    }
}

// successful getting back step survey data from server
function onsuccesss_select_detail_for_back_survey_collapse_form(e) {
    try {
        var myArray = JSON.parse(e.responseText);
        var status = myArray[0].status;
        if (status == 1) {
            //var fileData = JSON.parse(myArray[0].message);

            var data = myArray[0].data;
            if (data == "" || data == null || data == undefined) {
                var fileData = JSON.parse(myArray[0].message);
            }
            else {
                var fileData = JSON.parse(data);
            }

            var checksheet_type = collapse_Json[0].checksheet_type;
            if (checksheet_type == 3 || checksheet_type == 5) {
                var parent_task_id = fileData[0].parent_taskid;
                collapse_Json[0]['parent_task_id'] = parent_task_id;
            }

            var get_data = collapse_Json[0].get_data;
            // var get_data = "server";
            if (get_data == "" || get_data == null || get_data == undefined || get_data == "hybrid") {
                // first local > if not found then server
                insert_new_back_survey_entry_collapse_form(fileData);
            } else {
                // from server
                show_collapsible_data_direct_from_server(fileData);
            }
        }
        else if (status == 2) {
            $("#div_step_Col_" + curr_clps_new_id + "").hide();

            let parent = $("#div_step_Col_" + curr_clps_new_id + "").parent("li.swipeout").parent("div[id^='div_que_']");
            let child_cnt = $(parent).find("div.cntrl_main_div").length;
            if (child_cnt == 1) {
                // hide parent main form type 0 if having only collapsible control only - mk - 20012026
                $(parent).hide();
            }

            if (collapse_id_Array.length > 0) {
                var clps_id = collapse_id_Array[0];
                collapse_id_Array.shift();

                var item = $('#div_step_Col_' + clps_id + ' > div > ul > li');
                myApp.accordionOpen(item);
                toggle_collapse_div(clps_id);
            }
            else {
                loading_hide();
            }
        }
        else {
            var message = myArray[0].message;
            alert1(message);
            loading_hide();
        }
    } catch (e) {
        alert1(e + '_onsuccesss_select_detail_for_back_survey_collapse_form()');
        loading_hide();
    }
}

function show_collapsible_data_direct_from_server(myArray) {
    try {
        storage.setItem('back_step_found', JSON.stringify('1'));
        finaljsonObj_type23 = myArray;
        var heading = myArray[0].subcategory;
        var check_type = collapse_Json[0].checksheet_id;
        var step = myArray[0].stepid;
        var data = myArray[0].data;

        // parse again for customer and task json data
        var checksheet_type = collapse_Json[0].checksheet_type;
        if (checksheet_type == 3 || checksheet_type == 5) {
            data = itemObj._checkStrObj(data);  		// check_item
        }

        var buttons = myArray[0].buttons;
        f_lat = myArray[0].f_lat;
        f_long = myArray[0].f_long;
        f_address = myArray[0].f_address;
        f_milli = myArray[0].f_milli;

        var t_data = itemObj._checkStrObj(data);        // check_item
        var default_lbl = t_data[0].value;
        //$('#default_collapse_lbl_' + curr_clps_new_id + '').text(default_lbl);

        var edit_flag = $("#img_edit_collapse_" + curr_clps_new_id + "").attr("alt");
        if (edit_flag == 1) {
            // bind form to popup div
            if (checksheet_type == 3) {
                //for customer checksheet log, dont merge and create form with log json
                read_dynamic_surveydata_main(heading, check_type, step, data, buttons, 3, 0);
            }
            else {
                read_dynamic_surveydata(heading, check_type, step, data, buttons, 3, 0);
            }
        } else {
            // binding form to attached
            if (checksheet_type == 3) {
                //for customer checksheet log, dont merge and create form with log json
                read_dynamic_surveydata_main(heading, check_type, step, data, buttons, 2, 1);
            }
            else {
                read_dynamic_surveydata(heading, check_type, step, data, buttons, 2, 1);
            }
        }
    } catch (e) {
        alert1(e + '_show_collapsible_data_direct_from_server()');
        loading_hide();
    }
}

// insert new back survey entry
// insert data to f_master table - goto action - Save & Next/Reject Buttons
function insert_new_back_survey_entry_collapse_form(fileData) {
    try {
        var imei_no = parseInt(fileData[0].imei);
        var date_s = new Date();
        var time = date_s.getTime();
        var f_name = imei_no + "_" + time;
        var s_fileData = JSON.stringify(fileData);
        var s_t_id = curr_survey_data["t_id"];
        var s_check_type = collapse_Json[0].checksheet_id;
        var s_servertaskid = curr_survey_data["server_task_id"];
        var s_step = collapse_Json[0].clps_step;

        var user_track_array = JSON.parse(storage.getItem('user_track_details'));
        var user_lat = user_track_array[0].user_lat;
        var user_long = user_track_array[0].user_long;

        var f_lat = fileData[0].lat;
        if (f_lat == "" || f_lat == null || f_lat == undefined) {
            f_lat = user_lat;
        }
        var f_lon = fileData[0].long1;
        if (f_lon == "" || f_lon == null || f_lon == undefined) {
            f_lon = user_long;
        }
        var f_ms = fileData[0].date;
        if (f_ms == "" || f_ms == null || f_ms == undefined) {
            f_ms = time;
        }

        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var match_temp_id = list_data[0].match_temp_id;
        if (match_temp_id == "" || match_temp_id == null || match_temp_id == undefined) {
            match_temp_id = "";
        }

        var query = "INSERT INTO f_master (c_id, c_type, tid ,f_name, f_data, f_key, f_value, f_type, flag, step, lat, long, millisecond, match_temp_id) VALUES("
            + s_check_type + ",1,'" + s_t_id + "','" + f_name + "','" + s_fileData + "', 's','" + s_check_type + "','text/plain','1','"
            + s_step + "', '" + f_lat + "', '" + f_lon + "', '" + f_ms + "', '" + match_temp_id + "');";
        // alert1(query);
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            q: "0",
            tid: s_t_id
        });
        cordova.exec(onsuccess_update_task_flag, onfail_insert_new_back_survey_entry_collapse_form, 'SqlitePlugin', 'insertValuse', q_jsonobj);
    } catch (e) {
        alert1(e + '_insert_new_back_survey_entry_collapse_form()');
        loading_hide();
    }
}

function update_task_flag() {
    try {
        var t_id = curr_survey_data["t_id"];
        var query = "UPDATE task_master SET flag = '1' where tid = '" + t_id
            + "'";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            q: "0",
            tid: t_id
        });
        cordova.exec(onsuccess_update_task_flag, onfail_update_task_flag, 'SqlitePlugin', 'insertValuse', q_jsonobj);
    } catch (e) {
        alert1(e + '_update_task_flag()');
    }
}

function onsuccess_update_task_flag(e) {
    show_save_label();
    popup_collapse_div_hide_type23();
}

function onfail_update_task_flag(e) {
    alert1(e + '_onfail_update_task_flag()');
}

function onfail_get_lat_long_collapse_form(e) {
    alert1(e + '_onfail_get_lat_long_collapse_form()');
}

function onfail_update_old_entry_collapse_form(e) {
    alert1(e + '_onfail_update_old_entry_collapse_form()');
}

function onfail_insert_new_back_survey_entry_collapse_form(e) {
    alert1(e + '_onfail_insert_new_back_survey_entry_collapse_form()');
    loading_hide();
}

function onfail_select_detail_for_back_survey_collapse_form(e) {
    loading_hide();
    clearTimeout(edit_collapse_timer);
    $("#collapse_container_div_" + curr_clps_new_id + "").empty();
    var newdiv = '';
    newdiv += '<div style="width:92%; height;20%;  text-align:center; margin:2%; margin-bottom:5%; padding:1%; box-shadow: 2px 2px 5px gray" class=""theme_rcs_border><img src="images/no_network.png" style="float:left"><label style="font-size:11pt"><b>NO DATA FOUND!</b><label/> <br/>Network is slow or not working, Please click retry button !<br/>';
    newdiv += '<input type="button" value="RETRY" onclick="select_detail_for_back_survey_collapse_form()" style="margin:5px 0px; padding:5px 10px;  font-size:10pt; font-weight:bold; box-shadow:2px 2px 3px black; border:2px solid white; border-radius:5px" class="theme_btn_color"></div>';
    $("#collapse_container_div_" + curr_clps_new_id + "").append(newdiv);
}

function get_blank_checksheet_from_server(selected_check_type, step) {
    try {
        // alert("Reading from checksheet table...");

        loading();
        var company_id = JSON.parse(storage.getItem('company_id'));
        var user_id = JSON.parse(storage.getItem('user_id'));
        var trip_id = localStorage.getItem("transport_trip_id");
        if (trip_id == "" || trip_id == null || trip_id == undefined) {
            trip_id = 0;
        }

        var param_obj = [];
        param_obj.push({
            'Company_Id': company_id,
            'User_Id': user_id,
            'checksheetid': selected_check_type,
            'step': step,
            'trip_id': trip_id
        });

        //var auth_obj = [];
        //auth_obj.push({
        //    'username': username,
        //    'u_c': uniqcode
        //});

        //var sp_obj = [];
        //sp_obj.push({
        //    'sp_name': "GetCheckSheetData_Port",
        //    'param': param_obj,
        //});

        //var getdata = new webservice_inner_call(sp_obj, onsuccess_get_blank_checksheet, onfail_get_blank_checksheet_from_server);

        common_global_wcf_url = JSON.parse(storage.getItem('common_global_wcf_url'));
        var getdata = new Webservicecall_REST(common_global_wcf_url + 'WCF_GetCheckSheetData_Port', JSON.stringify(param_obj), onsuccess_get_blank_checksheet_from_server, onfail_get_blank_checksheet_from_server);
        getdata.callOtherDomain();

    } catch (e) {
        alert1(e + '_get_blank_checksheet_from_server()');
        loading_hide();
    }
}

function onsuccess_get_blank_checksheet_from_server(e) {
    try {
        var responseText = JSON.parse(e.responseText);
        var status = responseText[0].status;

        if (status == 1) {
            //var myArray = JSON.parse(e);
            var myArray = JSON.parse(responseText[0].data);
            if (myArray.length > 0) {
                var heading = myArray[0].subcategory;
                var check_type = myArray[0].checksheetid;
                var step = myArray[0].step;
                var blank_data = itemObj._checkStrObj(myArray[0].data);  		// check_item
                var buttons = itemObj._checkStrObj(myArray[0].buttons);  		// check_item

                for (i = 0; i < blank_data.length; i++) {
                    var bl_que_id = blank_data[i].que_id;
                    var bl_type = blank_data[i].type;
                    for (j = 0; j < RS_data.length; j++) {
                        var rs_que_id = RS_data[j].que_id;
                        var rs_type = RS_data[j].type;
                        if (rs_que_id == bl_que_id && rs_type == bl_type) {
                            var rs_ans = RS_data[j].ans;
                            blank_data[i].ans = rs_ans;
                            break;
                        }
                    }
                }
                read_dynamic_surveydata_main(heading, check_type, step, blank_data, buttons, RS_form_flag_temp, RS_disabled_flag);
            }
        }
        else {
            onfail_get_blank_checksheet('');
        }
    } catch (e) {
        alert1(e + '_onsuccess_get_blank_checksheet_from_server');
        loading_hide();
    }
}

function onfail_get_blank_checksheet_from_server(e) {
    read_dynamic_surveydata_main(RS_heading, RS_check_type, RS_step, RS_data, RS_buttons, RS_form_flag_temp, RS_disabled_flag);
}


//function onsuccess_get_blank_checksheet_from_server(e) {
//    try {
//        var myArray = JSON.parse(e);
//        var status = myArray[0].status;

//        if (status == 1) {
//            var heading = myArray[0].subcategory;
//            var check_type = myArray[0].checksheetid;
//            var step = myArray[0].step;
//            var blank_data = JSON.stringify(myArray[0].data);  		// check_item
//            var buttons = JSON.stringify(myArray[0].buttons);  		// check_item

//            //var query = "INSERT INTO checksheet (subcategory, checksheetid, step, data, buttons) VALUES ('"+ heading + "', '" + check_type + "', '" + step + "', " + blank_data + ", " + buttons + ")";
//            var query = "INSERT INTO checksheet (subcategory, step, data, buttons) VALUES ('" + heading + "', '" + step + "', " + blank_data + ", " + buttons + ")";
//            alert1(query);

//            var q_jsonobj = [];
//            q_jsonobj.push({
//                data: query,
//                q: "0"
//            });
//            cordova.exec(function () { get_blank_checksheet(check_type, step) }, onfail_insert_checksheet_entry, 'SqlitePlugin', 'insertValuse', q_jsonobj);
//        }
//        else {
//            alert(myArray[0].message);
//        }
//    } catch (e) {
//        alert1(e + '_insert_new_back_survey_entry_collapse_form()');
//        loading_hide();
//    }
//}

//function onfail_insert_checksheet_entry(e) {
//    alert1(e + '_onfail_insert_checksheet_entry()');
//    loading_hide();
//}

function update_task() {
    try {       
        var data = finaljsonObj_type23[0].data;
        var Json_data = JSON.parse(data);
        var module_id = JSON.parse(storage.getItem('wayflow'));        
        var module_name = JSON.parse(storage.getItem('wayflow_name'));
        var server_task_id = JSON.parse(storage.getItem('server_task_id'));
        server_task_id = JSON.parse(server_task_id)

        var company_id = JSON.parse(storage.getItem('company_id'));
        company_id = JSON.parse(company_id)

        var user_id = JSON.parse(storage.getItem('user_id'));
        var step = curr_survey_data["step"];
        var check_type = collapse_Json[0].checksheet_id;
        check_type = JSON.parse(check_type);
        var c_name = collapse_Json[0].chk_name;

        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var status_data = list_data[0].status;
        if (status_data == "" || status_data == null || status_data == undefined) {
            var status = "";
        }
        else {
            var status = status_data[0]
        }

        var flow_Array = JSON.parse(storage.getItem('flow_Array'));
        if (flow_Array == "" || flow_Array == null || flow_Array == undefined) {
            // other page
            var RequestFor = "Single";
            var p_server_task_id = 0;
            var p_match_temp_id = 0;
        }
        else {
            // web app
            if (flow_Array.length == 1) {
                var RequestFor = "Single";
                var p_server_task_id = 0;
                var p_match_temp_id = 0;
            }
            else {
                //for sub task
                var RequestFor = "Sub";
                var p_server_task_id = JSON.parse(localStorage.getItem('p_server_task_id'));
                var p_match_temp_id = localStorage.getItem('p_match_temp_id');
            }
        }

        // remove duplicate photo ids
        if (Photo_Id_Array.length > 0) {
            Photo_Id_Array = Photo_Id_Array.reduce(function (item, e1) {
                var matches = item.filter(function (e2) { return e1.photo_id == e2.photo_id });
                if (matches.length == 0) {
                    item.push(e1);
                }
                return item;
            }, []);
        }

        var urlParams = new URLSearchParams(window.location.search);
        var map_where_condition = urlParams.get('mwc');

        var MainData = [];
        MainData.push({
            'task_id': server_task_id,
            'checksheet_id': check_type,
            'c_name': c_name,
            'module_name': module_name,
            'Company_id': company_id,
            'status': status,
            'moduleid': module_id,
            'subcategory': "",
            'data': Json_data,
            'stepid': 0,
            'User_Id': user_id,
            'millisecond': 0,
            'createby': user_id,
            'UpdatedBy': user_id,
            'photo_temp': Photo_Id_Array,
            'Parent_Task_ID': p_server_task_id,
            'p_match_temp_id': p_match_temp_id,
            'map_where_condition': map_where_condition
        });

        var SubData = [];
        SubData.push({
            'RequestFor': RequestFor,
            'WhereCondition': "",
            'TackAction': "Update"
        });

        var Param_obj = [];
        Param_obj.push({
            'MainData': MainData,
            'SubData': SubData,
            'call_type': "web"
        });
      
        var getdata = new Webservicecall_REST(global_wcf_url + 'InsertUpdateDelete_MainAndSub_Task', JSON.stringify(Param_obj), onsuccess_update_task, onfail_request);
        getdata.callOtherDomain();
    }
    catch (e) {
        alert(e + '_update_task');
    }
}
function onsuccess_update_task(e) {
    try {
        var Suc_Message = e.responseText;
        Suc_Message = eval('(' + Suc_Message + ')');
        var message = Suc_Message[0].message;
        var status = Suc_Message[0].status;
        if (status == 1) {
            if (message == "" || message == null || message == undefined) { }
            else {
                alert1(message);
            }
            popup_collapse_div_hide_type23();
        }
        else {
            alert1(message);
        }
        loading_hide();
    }
    catch (e) {
        alert(e + '_onsuccess_update_task');
    }
}

update_question_log = () => {
    var date_s = new Date();
    var date = date_s.getTime();
    var heading = curr_survey_data["heading"];
    var step = curr_survey_data["step"];

    var state = 'collapsible';

    if (state == 'collapsible') {
        var check_type = collapse_Json[0].checksheet_id;
    }
    else {
        var check_type = curr_survey_data["check_type"];

    }
    var task_id = curr_survey_data["task_id"];
    var server_task_id = curr_survey_data["server_task_id"];
    var site_id = curr_survey_data["siteid"];
    var data = curr_survey_data["json"];

    //var username = JSON.parse(localStorage.getItem('username'));
    //var uniqcode = JSON.parse(localStorage.getItem('uniqcode'));
    //var user_id = window.localStorage.getItem("user_id");

    var username = JSON.parse(storage.getItem('username'));
    var uniqcode = JSON.parse(storage.getItem('uniqcode'));
    var user_id = JSON.parse(storage.getItem("user_id"));

    var flow_id = JSON.parse(storage.getItem('wayflow'));
    var flow_name = JSON.parse(storage.getItem('wayflow_name'));
    var company_id = JSON.parse(storage.getItem('company_id'));
    var user_id = JSON.parse(storage.getItem('user_id'));
    var udf_id = JSON.parse(storage.getItem('udf_id'));
   
    var finaljsonObj = [];
    finaljsonObj.push({
        taskid: server_task_id,
        servertaskid: server_task_id,
        siteid: site_id,
        stepid: step,
        category: 0,
        imei: 0,
        User_Id: user_id,
        username: username,
        u_c: uniqcode,
        subcategory: heading,
        date: date,
        date_s: date_s,
        address: "",
        lat: 0,
        long1: 0,
        gps: 0, // 0 = off, 1 = on
        accuracy: 0,
        diff_time: 0,
        check_type: check_type,
        data: data,
        buttons: btnJsonObj,
        udf_id: udf_id,
        CompanyId: company_id,
        FlowId: flow_id,
        FlowName: flow_name,
        match_temp_id: 0
    });

    var fileData = JSON.stringify(finaljsonObj);

    var param_obj = [];
    param_obj.push({
        'q_data': fileData,
        'utcmilliseconds': date,
        'timezone': "",
        'c_type': '1',
        'server_task_id': server_task_id,
        'btn_action': "goto"
    })
    
    var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_InsertQuestionMaster_Log_EF_1_0_0_0', JSON.stringify(param_obj), function (e) {
        var myArray = JSON.parse(e.responseText);
        var status = myArray[0].status;
        var message = myArray[0].message;
        if (status == 1) {
            if (message == "" || message == null || message == undefined) { }
            else {
                alert1(message);
            }          
            popup_collapse_div_hide_type23();
        }
        else {           
            alert1(message);
        }
        loading_hide();
    }, onfail_request);
    getdata.callOtherDomain();

}

function Update_Json() {

    var checksheet_type = "Customer";// window.localStorage.getItem('target_ui');
    var checksheet_type_new = "3";
   /* var check_type = JSON.parse(localStorage.getItem('check_type'));*/

    var check_type = collapse_Json[0].checksheet_id;
    check_type = JSON.parse(check_type);
    var latitudeId = "txtno_0_" + check_type + "_4";
    var longitudeId = "txtno_0_" + check_type + "_7";
    var latitude = $("#" + latitudeId + "").val();
    var longitude = $("#" + longitudeId + "").val();
    //var regEx = /^(\+|-)?((\d((\.)|\.\d{1,6})?)|(0*?[0-8]\d((\.)|\.\d{1,50})?)|(0*?90((\.)|\.0{1,50})?))$/;

    if (latitude == "" || latitude == null || latitude == "undefined") { }
    else {
        if (latitude == 0) {
            alert("Latitude can not be 0!");
            loading_hide();
            return false;
        }
        else if (latitude >= -90 && latitude <= 90) { }
        else {
            alert("Latitude can be between -90 to +90 !");
            loading_hide();
            return false;
        }
    }
    if (longitude == "" || longitude == null || longitude == "undefined") { }
    else {
        if (longitude == 0) {
            alert("Longitude can not be 0 !");
            loading_hide();
            return false;
        }
        else if (longitude >= -180 && longitude <= 180) { }
        else {
            alert("Longitude can be between -180 to +180 !");
            loading_hide();
            return false;
        }
    }

    window.localStorage.setItem("check_type", check_type_New_Cust);

    if (state == 'collapsible') {
        validate_and_submit_surveydata(1, 3, JSON.parse(checksheet_data_Page_Customer_New));
    }
    else {
        validate_and_submit_surveydata(1, 7, JSON.parse(checksheet_data_Page_Customer_New));
    }

    var Json_data;
    if (Validation_True == 0) {
        Json_data = ap_json[0].data;
    }
    else {
        Validation_True = 0;
        loading_hide();
        return false;
    }

    // remove duplicate photo ids
    if (Photo_Id_Array.length > 0) {
        Photo_Id_Array = Photo_Id_Array.reduce(function (item, e1) {
            var matches = item.filter(function (e2) { return e1.photo_id == e2.photo_id });
            if (matches.length == 0) {
                item.push(e1);
            }
            return item;
        }, []);
    }

    //for (i in Json_data) { if (Json_data[i].que_id == 5) { Json_data[i].ans = [" "] } }

    //for (i in Json_data) { if (Json_data[i].que_id == 10018) { Json_data[i].ans = [" "] } }


    if (state == 'collapsible') {
        var cust_id = JSON.parse(localStorage.getItem('check_type_customer'));
    }
    else {
        var urlParams = new URLSearchParams(window.location.search);
        var cust_id = urlParams.get('cust_id');
    }

    if (cust_id == "" || cust_id == null || cust_id == undefined) {
        mk_notify("Customer Id is not found!", "danger");
        return false;
    }

    var Param_obj = [];
    Param_obj.push({
        'Primary_Id': cust_id,
        'CustomerUniqId': "",
        'Company_id': company_id,
        'Subcategory': "",
        'Step_id': 0,
        'StepNo': 1,
        'checksheet_id': Main_checksheet_id,// $("#ddl_Checksheet_Table").val(),
        'Status': 0,
        'Data': Json_data,
        'button': [],
        'createby': user_id,
        'UpdatedBy': user_id,
        "checksheet_type": 3,
        'photo_temp': Photo_Id_Array,
        'Check_User_Upadte_Or_Create': "Update"
    });

    loading_show("Updating Data");
    var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_insert_Customer_Master_And_Sub_Type', JSON.stringify(Param_obj), onsucess_Update_Json, onfail_request);
    getdata.callOtherDomain();
}
function onsucess_Update_Json(invocation1) {
    var Suc_Message = invocation1.responseText;
    Suc_Message = eval('(' + Suc_Message + ')');
    var status = Suc_Message[0].status;
    var message = Suc_Message[0].message;
   
    if (status == 1) {
        if (message == "" || message == null || message == undefined) { }
        else {
            alert1(message);
        } 
        popup_collapse_div_hide_type23();
    }
    else {
        alert1(message);
    }
    loading_hide();
}