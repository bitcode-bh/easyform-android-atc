// this part is for pmt flow

// check all step status by getting button array from survey
function check_all_step_status() {
	try {
		var t_id = curr_survey_data["t_id"];
		var updatestep = curr_survey_data["updatestep"];
		var query = "select f_data from f_master where tid = '" + t_id
				+ "' and step = '" + updatestep + "' and c_type='1'";
		// alert1(query);
		var q_jsonobj = [];
		q_jsonobj.push({
			data : query,
			p : "0"
		});
		AppBridge.on(cordova).read(onsuccess_check_all_step_status, onfail_check_all_step_status, 'formDataByTypeOneStep', { tid: t_id, step: updatestep });
	} catch (e) {
		alert1(e + '_check_all_step_status');
		loading_hide();
	}
}

// successful checking all step status
function onsuccess_check_all_step_status(e) {
	try {
		// alert1(e);
		var myArray = JSON.parse(e);
		var heading = myArray[0].subcategory;
		var check_type = myArray[0].check_type;
		var step = myArray[0].stepid;
		var data = myArray[0].data;
		var btnJsonObj = myArray[0].buttons;
		// alert1(JSON.stringify(btnJsonObj));
		var red_color = 0;
		for (j = 0; j < btnJsonObj.length; j++) {
			if (btnJsonObj[j].color != "green") {
				red_color++;
			}
		}
		if (red_color < 2) {
			// All the steps are completed
			// update_task_status_on_submit();
			update_current_checksheet_status();
		} else {
			alert1("Please complete all the steps before submit !");
		}
	} catch (e) {
		alert1(e + '_onsuccess_check_all_step_status');
		loading_hide();
	}
}

function onfail_check_all_step_status(e) {
	alert1("Please complete all the steps before submit !");
	loading_hide();
}
