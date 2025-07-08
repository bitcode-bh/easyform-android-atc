// call on Get Latlong button
function get_site_latlong_box_classes(item_id, S_lat_box_class, S_long_box_class) {
	try {
		loading();
		curr_survey_data["btn_item_id_site"] = item_id;
		$("." + S_lat_box_class + "").css("display", "block");
		$("." + S_long_box_class + "").css("display", "block");
		var S_lat_box_id = $("." + S_lat_box_class + " :input").attr("id");
		var S_long_box_id = $("." + S_long_box_class + " :input").attr("id");
		curr_survey_data["S_txtno_lat"] = S_lat_box_id;
		curr_survey_data["S_txtno_long"] = S_long_box_id;
		get_site_latlong_and_print();
	} catch (e) {
		alert1(e + '_get_site_latlong_box_classes()');
		loading_hide();
	}
}

function get_site_latlong_and_print() {
	try {
		var selected_tid = JSON.parse(storage.getItem('tid'));
		var query = "select lat, long from task_master where tid = '"
				+ selected_tid + "'";
		var q_jsonobj = [];
		q_jsonobj.push({
			data : query,
			p : "1"
		});
		cordova.exec(onsuccess_get_site_latlong_and_print, onfail_get_site_latlong_and_print,
				'SqlitePlugin', 'showValues', q_jsonobj);
	} catch (e) {
		alert1(e + '_get_site_latlong_and_print()');
		loading_hide();
	}
}

function onsuccess_get_site_latlong_and_print(e) {
	try {
		var myArray = JSON.parse(e);
//		alert1(JSON.stringify(myArray));
		if (myArray[0].lat == "" || myArray[0].lat == undefined
				|| myArray[0].lat == null) {
			var latitude = "0";
		} else {
			var latitude = myArray[0].lat;
		}
		if (myArray[0].long == "" || myArray[0].long == undefined
				|| myArray[0].long == null) {
			var longitude = "0";
		} else {
			var longitude = myArray[0].long;
		}

		var S_txtno_lat = curr_survey_data["S_txtno_lat"];
		var S_txtno_long = curr_survey_data["S_txtno_long"];

		$("#" + S_txtno_lat + "").val(latitude);
		$("#" + S_txtno_long + "").val(longitude);

		var btn_item_id_site = curr_survey_data["btn_item_id_site"];
		jsonObj[btn_item_id_site].ans = latitude + "_" + longitude;

		loading_hide();
	} catch (e) {
		alert1(e + '_onsuccess_get_site_latlong_and_print()');
		loading_hide();
	}
}

function onfail_get_site_latlong_and_print(e) {
	alert1(e + '_onfail_get_site_latlong_and_print');
	loading_hide();
}
