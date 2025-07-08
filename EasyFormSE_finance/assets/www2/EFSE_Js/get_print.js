function get_data_for_print(temp_check_type, temp_new_id) {
	var Type24_Data_Str = $('#hdn_type24_data_' + temp_new_id + '').val();
	var Type24_Data_Array = JSON.parse(decodeURIComponent(Type24_Data_Str));
	var listData = Type24_Data_Array[0].list;
	var found_0 = 0;

	for (k = 0; k < listData.length; k++) {
		var type22_Count = 0;
		var columData = listData[k].colum;
		for (j = 0; j < columData.length; j++) {
			var header = columData[j].header;
			var footer = columData[j].footer;
			var check_type = columData[j].check_type;
			var checksheet_id = columData[j].checksheet_id;
			var targeted_que_id = columData[j].que_id;

			var jsonObj = [];
			jsonObj = jsonObj_old;
			var found = 0;
			for (i = 0; i < jsonObj.length; i++) {
				// alert1(JSON.stringify(jsonObj[i]));
				var new_id = temp_check_type + '_' + jsonObj[i].que_id;
				if (jsonObj[i].type == 1
						&& jsonObj[i].que_id == targeted_que_id) {
					var ans_value = $("#txt_" + new_id + "").val();
					found++;
					break;
				} else if (jsonObj[i].type == 2
						&& jsonObj[i].que_id == targeted_que_id) {
					var ans_value = $(
							'input[name=rdogroup_' + new_id + ']:checked')
							.val();
					found++;
					break;
				} else if (jsonObj[i].type == 4
						&& jsonObj[i].que_id == targeted_que_id) {
					var ans_value = $("#txtno_" + new_id + "").val();
					found++;
					break;
				} else if (jsonObj[i].type == 22
						&& jsonObj[i].que_id == targeted_que_id) {
					var type22_ans_Array = get_type22_ans(new_id,
							targeted_que_id, inner_que_id, row_type);
					found++;
					break;
				}
			}

			if (found == 0 || ans_value == "" || ans_value == null
					|| ans_value == undefined) {
				alert1("Please fill all required data for print");
				highlight_element_on_blank(jsonObj[i].type, new_id);
				k = listData.length;
				found_0++;
				break;
			} else {
				remove_red_border_on_fill(jsonObj[i].type, new_id);
				var type = columData[j].type;
				if (type == 22) {
					var subdata = columData[j].subdata;
					var inner_que_id = subdata[0].que_id;
					var row_type = subdata[0].type;

					if (row_type == "sum") {
						var sum_data_Array = type22_ans_Array[0].sum_finaljson;
						for (n = 0; n < sum_data_Array.length; n++) {
							if (sum_data_Array[n].sum_que_id == inner_que_id) {
								var ans_value = sum_data_Array[n].txt_sum_value;
								break;
							}
						}
						ans_value = header + ans_value + footer;
						if (type22_Count == 0) {
							listData[k].data[0].value.push(ans_value);
						} else {
							var data_length = listData[k].data.length;
							for (r = 0; r < data_length; r++) {
								listData[k].data[r].value.push(ans_value);
							}
						}
					} else {
						if (type22_Count == 0) {
							var row_data_Array = type22_ans_Array[0].row_finaljson[0].json_type_22[0].txt_row;
							for (n = 0; n < row_data_Array.length; n++) {
								if (row_data_Array[n].row_que_id == inner_que_id) {
									var ans_value = row_data_Array[n].txt_row_value;
									break;
								}
							}
							ans_value = header + ans_value + footer;
							listData[k].data[0].value.push(ans_value);
							var type22Data = listData[k].data[0].value;
							var total_row = type22_ans_Array[0].row_finaljson;

							for (m = 1; m < total_row.length; m++) {
								var row_data_Array = type22_ans_Array[0].row_finaljson[m].json_type_22[0].txt_row;
								for (n = 0; n < row_data_Array.length; n++) {
									if (row_data_Array[n].row_que_id == inner_que_id) {
										var ans_value = row_data_Array[n].txt_row_value;
										break;
									}
								}

								var value_Array = [];
								for (p = 0; p < (type22Data.length - 1); p++) {
									value_Array.push(type22Data[p]);
								}
								ans_value = header + ans_value + footer;
								value_Array.push(ans_value);
								listData[k].data.push({
									"type" : "string",
									"value" : value_Array
								});
								// listData[k].data[j].value.pop();
								// listData[k].data[j].value.push(ans_value);
							}
							type22_Count++;
						} else {
							var row_Array = type22_ans_Array[0].row_finaljson;
							for (q = 0; q < row_Array.length; q++) {
								var row_data_Array = row_Array[q].json_type_22[0].txt_row;
								for (n = 0; n < row_data_Array.length; n++) {
									if (row_data_Array[n].row_que_id == inner_que_id) {
										var ans_value = row_data_Array[n].txt_row_value;
										break;
									}
								}
								ans_value = header + ans_value + footer;
								listData[k].data[q].value.push(ans_value);
							}
						}

					}
				} else {
					// other types
					ans_value = header + ans_value + footer;
					// alert1(ans_value);
					if (type22_Count == 0) {
						listData[k].data[0].value.push(ans_value);
					} else {
						var data_length = listData[k].data.length;
						for (r = 0; r < data_length; r++) {
							listData[k].data[r].value.push(ans_value);
						}
					}
				}
			}
		}
	}
	if (found_0 == 0) {
		// alert1(JSON.stringify(Type24_Data_Array));
		$('#hdn_type24_data_ans_' + temp_new_id + '').val(
				encodeURIComponent(JSON.stringify(Type24_Data_Array)));
		var Type24_Data_Str = $('#hdn_type24_data_ans_' + temp_new_id + '')
				.val();
		var Type24_Data_Array = JSON.parse(decodeURIComponent(Type24_Data_Str));
		// alert1(JSON.stringify(Type24_Data_Array));

		try {
			var q_jsonobj = [];
			q_jsonobj.push({
				data : JSON.stringify(Type24_Data_Array)
			});
			cordova.exec(onsuccess_get_print, onfail_get_print, 'print_plug',
					'showValues', q_jsonobj);
		} catch (e) {
			alert1(e + '_check_survey_entry_next_read()');
			loading_hide();
		}
	}
}

function onsuccess_get_print(e) {
	alert1("print successfull !");
}

function onfail_get_print(e) {
	alert1(e + '_onfail_get_print()');
}

function get_type22_ans(btn_NewInv_Counter, targeted_que_id, inner_que_id,
		row_type) {
	// for store ans of individual row
	var json_data = $("#hdn_jsondata_" + btn_NewInv_Counter + "").val();
	var json_data = JSON.parse(json_data);
	var num_row = json_data.length;

	var row_finaljson = [];
	var sum_finaljson = [];
	var json_ans_type22 = [];

	for ( var z = 1; z <= row_counter; z++) {
		var json_store_sum = [];
		var json_store = [];
		var row_json = [];
		var json_store_row_counter = [];
		var json_store_row = [];

		for ( var w = 0; w < num_row; w++) {
			var ddl_datatype1 = json_data[w].type[1].type;
			var que_id = json_data[w].type[1].que_id;
			var row_name = json_data[w].type[1].prop[0].name;
			var display_row = json_data[w].display;

			if (ddl_datatype1 == '7' || ddl_datatype1 == '9'
					|| ddl_datatype1 == '11') {

				if (display_row == "1") {
					var get_row_value = $(
							"#hdn_hide_pass_value_" + btn_NewInv_Counter + '_'
									+ z + '_' + w + "").val();
				} else {
					var get_row_value = $(
							"#txt_add_row_" + btn_NewInv_Counter + '_' + z
									+ '_' + w + "").attr('src');
				}

				// $('.img1 img').attr('src');
				json_store_row.push({
					"row_name" : row_name,
					"row_que_id" : que_id,
					"txt_row_value" : get_row_value
				});

			} else {
				if (display_row == "1") {
					var get_row_value = $(
							"#hdn_hide_pass_value_" + btn_NewInv_Counter + '_'
									+ z + '_' + w + "").val();
				} else {
					var get_row_value = $(
							"#txt_add_row_" + btn_NewInv_Counter + '_' + z
									+ '_' + w + "").text();
				}

				json_store_row.push({
					"row_name" : row_name,
					"row_que_id" : que_id,
					"txt_row_value" : get_row_value
				});
			}

		}

		json_store.push({
			"txt_row" : json_store_row
		});
		// alert1("json_store:" + JSON.stringify(json_store));

		if (z == row_counter) {
			for ( var p = 0; p < num_row; p++) {
				var ddl_que_id = json_data[p].type[1].que_id;
				var td_sum = json_data[p].sum;
				var th_name = json_data[p].name;
				var display_sum = json_data[p].display;
				if (td_sum == 1) {
					var sum = $("#sum_" + btn_NewInv_Counter + "_" + p + "")
							.text();
					sum_finaljson.push({
						"sum_que_id" : ddl_que_id,
						"txt_sum_value" : sum
					});
				}
			}
		}
		row_finaljson.push({
			"json_type_22" : json_store
		});
	}
	json_ans_type22.push({
		"row_finaljson" : row_finaljson,
		"sum_finaljson" : sum_finaljson
	});
	return json_ans_type22;
}

function highlight_element_on_blank(temp_type, new_id) {
	if (temp_type == 1) {
		$('#div_txt_' + new_id + '').css({
			"border" : "solid 1px red"
		});
		$('html, body').animate({
			scrollTop : $("#div_txt_" + new_id + "").offset().top - 300
		}, 300);
	} else if (temp_type == 2) {
		$('#div_rdo_' + new_id + '').css({
			"border" : "solid 1px red"
		});
		$('html, body').animate({
			scrollTop : $("#div_rdo_" + new_id + "").offset().top - 300
		}, 300);
	} else if (temp_type == 3) {
		$('#div_ddl_' + new_id + '').css({
			"border" : "solid 1px red"
		});
		$('html, body').animate({
			scrollTop : $("#div_ddl_" + new_id + "").offset().top - 300
		}, 300);
	} else if (temp_type == 4) {
		$('#div_txtno_' + new_id + '').css({
			"border" : "solid 1px red"
		});
		$('html, body').animate({
			scrollTop : $("#div_txtno_" + new_id + "").offset().top - 300
		}, 300);
	} else if (temp_type == 8) {
		$('#div_cal_' + new_id + '').css({
			"border" : "solid 1px red"
		});
		$('html, body').animate({
			scrollTop : $("#div_cal_" + new_id + "").offset().top - 300
		}, 300);
	}
}

function remove_red_border_on_fill(temp_type, new_id) {
	if (temp_type == 1) {
		$('#div_txt_' + new_id + '').css({
			"border" : "none"
		});
	} else if (temp_type == 2) {
		$('#div_rdo_' + new_id + '').css({
			"border" : "none"
		});
	} else if (temp_type == 3) {
		$('#div_ddl_' + new_id + '').css({
			"border" : "none"
		});
	} else if (temp_type == 4) {
		$('#div_txtno_' + new_id + '').css({
			"border" : "none"
		});
	} else if (temp_type == 8) {
		$('#div_cal_' + new_id + '').css({
			"border" : "none"
		});
	}
}