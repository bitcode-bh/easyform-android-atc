// call on capture button
function CaptureClick_latlong(item_id, que_id, img_div, form_flag_temp) {
	try {
		// alert1("hello");
		storage.setItem('crash_status', JSON.stringify('1'));
		storage.setItem('img_id', JSON.stringify(item_id));
		storage.setItem('img_que_id', JSON.stringify(que_id));
		storage.setItem('img_div_id', JSON.stringify(img_div));
		storage.setItem('camera_type', JSON.stringify('11'));
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
		}

		// capture_Photo_latlong();
	} catch (e) {
		alert1(e + '_CaptureClick_latlong()');
		loading_hide();
	}
}

// Open camera and take picture using device camera
function capture_Photo_latlong() {
	try {
		loading();
		var query = "select imei from Login_Master";
		var q_jsonobj = [];
		q_jsonobj.push({
			data : query,
			p : "1"
		});
		cordova.exec(onPhotoDataSuccess_latlong, onFail_latlong, 'camera_new',
				'anAction', q_jsonobj);
	} catch (e) {
		alert1(e + '_capture_Photo_latlong()');
		loading_hide();
	}
}

// Get base64 of photo captured by device successfully
function onPhotoDataSuccess_latlong(imageData) {
	try {
		// alert1(imageData);
		// my_loading_show();
		curr_survey_data["img_path"] = imageData;
		var curr_img_div_id = JSON.parse(storage.getItem('img_div_id'));
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

		var img_id = JSON.parse(storage.getItem('img_id'));

		/* new logic */
		var date_s = new Date();
		var time = date_s.getTime();
		var company_id = JSON.parse(storage.getItem('company_id'));
		var user_id = JSON.parse(storage.getItem('user_id'));
		var siteid = JSON.parse(storage.getItem('siteid'));
		var p_name = company_id + "_" + user_id + "_" + siteid + "_" + time;
		storage.setItem('p_name', JSON.stringify(p_name));

		var answer = [];
		answer.push(imageData.toString(), p_name);

		var curr_form_flag = form_flag;
		if (curr_form_flag == 0) {
			let task_create_popup = $('.popup-new-task-create.modal-in:visible');
			if (task_create_popup.length > 0) {
				//new task create popup [FT-08052025]
				jsonObj_task_add[img_id].ans = answer;
			}
			else {
				// normal form
				jsonObj_old[img_id].ans = answer;
			}
		} else if (curr_form_flag == 1) {
			// type22 form
			jsonObj_type22[img_id].ans = answer;
		} else if (curr_form_flag == 3) {
			// type23 form
			jsonObj_type23[img_id].ans = answer;
		}
		// alert1(JSON.stringify(jsonObj));

		var query = "select imei from Login_Master";
		var q_jsonobj = [];
		q_jsonobj.push({
			data : query,
			p : "1"
		});
		AppBridge.on(cordova).read(insert_photo_entry_latlong, onfail_onPhotoDataSuccess_latlong, 'loginImei', {});
	} catch (e) {
		alert1(e + 'onPhotoDataSuccess_latlong()');
		loading_hide();
	}
}

function insert_photo_entry_latlong(e) {
	try {
		// alert1(e);
		var myArray = JSON.parse(e);
		var IMEI_No = myArray[0].imei;
		var date_s = new Date();
		var time = date_s.getTime();

		var p_name = JSON.parse(storage.getItem('p_name'));
		var t_id = curr_survey_data["t_id"];
		var img_que_id = JSON.parse(storage.getItem('img_que_id'));
		var img_path = curr_survey_data["img_path"];
		var img_id = JSON.parse(storage.getItem('img_id'));
        var check_type = curr_survey_data["check_type"];

        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var match_temp_id = list_data[0].match_temp_id;
        if (match_temp_id == "" || match_temp_id == null || match_temp_id == undefined) {
            match_temp_id = "";
        }

        var query = "INSERT INTO p_master (tid, que_id, checksheetid, p_name, p_url, p_key, p_value ,p_type, flag, it_id, millisecond, match_temp_id) VALUES('"
            + t_id + "','" + img_que_id + "','" + check_type + "','" + p_name + "','" + img_path + "','i','image','png','0','" + img_id + "', '" + time + "', '" + match_temp_id + "');";
		// alert1(query);
		var q_jsonobj = [];
		q_jsonobj.push({
			data : query,
			q : "0",
			tid : ""
		});
		cordova.exec(onsuccess_insert_photo_entry_latlong, onfail_insert_photo_entry_latlong, 'SqlitePlugin', 'insertValuse', q_jsonobj);
	} catch (e) {
		alert1(e + '_onsuccess_onPhotoDataSuccess_latlong()');
		loading_hide();
	}
}

function onsuccess_insert_photo_entry_latlong(e) {
	// alert1("Photo has been saved successfully with latlong !");
	storage.setItem('crash_status', JSON.stringify('0'));
	curr_btn_mode = "";
	show_save_label();
	loading_hide();
}

function onfail_onPhotoDataSuccess_latlong(e) {
	alert1(e + '_onfail_onPhotoDataSuccess_latlong()');
	loading_hide();
}

function onFail_latlong(e) {
	// user press back/cancel button before/after capturing photo
	// alert1(e + '_CapturePhoto_onFail()');
	storage.setItem('crash_status', JSON.stringify('0'));
	loading_hide();
}

function onfail_insert_photo_entry_latlong(e) {
	alert1(e + '_onfail_insert_photo_entry_latlong()');
	loading_hide();
}
