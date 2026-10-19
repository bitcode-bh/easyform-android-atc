// select target step survey (for color change)
function get_target_step_survey() {
	try {
		var t_id = curr_survey_data["t_id"];
		var updatestep = curr_survey_data["updatestep"];
		var query = "select f_data from f_master where tid = '" + t_id
				+ "' and step = '" + updatestep + "' and c_type='1'";
		//alert1(query);
		var q_jsonobj = [];
		q_jsonobj.push({
			data : query,
			p : "0"
		});
		AppBridge.on(cordova).first(onsuccess_get_target_step_survey, onfail_get_target_step_survey, 'formDataByTypeOneStep', { tid: t_id, step: updatestep });
	} catch (e) {
		alert1(e + '_get_target_step_survey');
		loading_hide();
	}
}

// successful getting target step survey
function onsuccess_get_target_step_survey(e) {
	try {
		// alert1(e);
		var myArray = JSON.parse(e);
		if (myArray.length > 0) {
			update_target_step_survey(myArray);
		}
		else{
			onfail_get_target_step_survey('');
		}
	} catch (e) {
		alert1(e + '_onsuccess_get_target_step_survey');
		loading_hide();
	}
}

// update target step survey (for color change)
function update_target_step_survey(myArray) {
	try {
		var date_s = new Date();
		var time = date_s.getTime();
		var updatebtnindex = curr_survey_data["updatebtnindex"];
		var updatestep = curr_survey_data["updatestep"];
		myArray[0].buttons[updatebtnindex].color = "green";
		var t_id = curr_survey_data["t_id"];
		var fileData = JSON.stringify(myArray);
		var query = "UPDATE f_master SET millisecond='" + time
				+ "', f_data = '" + fileData + "' where tid = '" + t_id
				+ "' and step = '" + updatestep + "' and c_type='1'";
		// alert1(query);
		var q_jsonobj = [];
		q_jsonobj.push({
			data : query,
			q : "0",
			tid : t_id
		});
		cordova.exec(onsuccess_update_target_step_survey,
				onfail_update_target_step_survey, 'SqlitePlugin',
				'insertValuse', q_jsonobj);
	} catch (e) {
		alert1(e + '_update_target_step_survey');
		loading_hide();
	}
}

// successful target step update
function onsuccess_update_target_step_survey(e) {
	// alert1("Step color updated successfully !")
	check_survey_entry_next_read();
}

function onfail_get_target_step_survey(e) {
	// alert1(e + '_onfail_get_target_step_survey');
	// first step is not exist for current site and getting first step from
	// server (O&M flow)
	select_detail_for_back_survey();
}

function onfail_update_target_step_survey(e) {
	alert1(e + '_onfail_update_target_step_survey');
	loading_hide();
}
