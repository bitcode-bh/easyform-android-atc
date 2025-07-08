// call when change menu drop down value
function changeSelect(obj, item_id, inv_group_counter, selectCounter,
		ddl_length) {
	var SetSelect = document.getElementById("inv_item_ddl_"
			+ (selectCounter + 1));
	$("#div_Inv_Info_" + inv_group_counter + "").empty();

	// empty below dropdowns from selected dropdown
	for (i = (selectCounter + 1); i < ddl_length; i++) {
		$('#inv_item_ddl_' + i + '').empty();
	}

	// fill dropdown as per selected dropdown index
	if (selectCounter == 0) {
		// 1st dropdown change
		var inv_item_Array1 = inv_item_Array[obj.value];
	} else if (selectCounter == 1) {
		// 2nd dropdown change
		var valArray = [];
		for (i = 0; i < selectCounter; i++) {
			var selected_value = $('#inv_item_ddl_' + i + '').val();
			valArray.push(selected_value);
		}
		var inv_item_Array1 = inv_item_Array[valArray[0]][obj.value];
	} else if (selectCounter == 2) {
		// 3rd dropdown change
		var valArray = [];
		for (i = 0; i < selectCounter; i++) {
			var selected_value = $('#inv_item_ddl_' + i + '').val();
			valArray.push(selected_value);
		}
		var inv_item_Array1 = inv_item_Array[valArray[0]][valArray[1]][obj.value];
	} else if (selectCounter == 3) {
		// 4th dropdown change
		var valArray = [];
		for (i = 0; i < selectCounter; i++) {
			var selected_value = $('#inv_item_ddl_' + i + '').val();
			valArray.push(selected_value);
		}
		var inv_item_Array1 = inv_item_Array[valArray[0]][valArray[1]][valArray[2]][obj.value];
	}

	if (selectCounter == ddl_length) {
		var itemArray = [];
		if (inv_item_Array1.length == undefined) {
			for ( var item in inv_item_Array1) {
				itemArray.push(item);
			}
		} else {
			for ( var item in inv_item_Array1) {
				itemArray.push(inv_item_Array1[item]);
			}
		}
		var op_item = '';
		// finally append invoice information
		for (m = 0; m < itemArray.length; m++) {
			op_item += '<input type="checkbox" name="inv_chkgroup_'
					+ inv_group_counter
					+ '" id="inv_chk_'
					+ inv_group_counter
					+ '_'
					+ m
					+ '"value="'
					+ itemArray[m].item
					+ '" style="margin-right:20px; margin-bottom:5px; vertical-align: middle; width:23px; height: 23px; margin-right:0.5%">';
			op_item += '<input type="number" value="'
					+ itemArray[m].point
					+ '" id="inv_point_'
					+ inv_group_counter
					+ '_'
					+ m
					+ '" style="color:gray; background-color:#F0F0F0; margin-left:2%; width:20%; height: 20px; font-size: 10pt; font-family: calibri; border-radius:5px; text-align:center" disabled>';
			op_item += '<label style="width: 63%; height: 20px; margin-left:7px; margin-top:10px; display:inline-block; vertical-align:middle" id="inv_chk_lbl_'
					+ inv_group_counter
					+ '_'
					+ m
					+ '">'
					+ itemArray[m].item
					+ '</label><br/>';
			op_item += '<table style="width:100%; height:auto"><tr>';
			op_item += '<td style="width:33%; padding:5px"><input type="number" id="inv_qty_'
					+ inv_group_counter
					+ '_'
					+ m
					+ '" style="width:99%; height: 20px; color:gray; font-size: 10pt; font-family: calibri; border-radius:5px; text-align:center"></td>';
			op_item += '<td style="width:33%; padding:5px"><input type="number" id="inv_price_'
					+ inv_group_counter
					+ '_'
					+ m
					+ '" value="'
					+ itemArray[m].price
					+ '" style="width:99%; height: 20px; color:gray; font-size: 10pt; font-family: calibri; border-radius:5px; text-align:center" disabled></td>';
			op_item += '<td style="width:33%; padding:5px"><input type="number" id="inv_mul_ans_'
					+ inv_group_counter
					+ '_'
					+ m
					+ '" style="width:99%; height: 20px; color:gray; font-size: 10pt; font-family: calibri; border-radius:5px; text-align:center" disabled></td>';
			op_item += '</tr></table>';
		}
		op_item += '<hr noshade style="width:63%; margin-right:2%; float:right; border: solid 1px #505050"><br/>';
		op_item += '<table style="width:63%; height:auto; margin-left:33%">';
		op_item += '<tr><td style="width:50%; padding:5px"><label style="float:right; margin-top:4%">Total Items: </label></td><td style="width:50%; padding:5px"><input type="text" id="inv_item_ans_'
				+ inv_group_counter
				+ '"style="color:gray; background-color:#F0F0F0; width:99%; height:25px; font-size: 10pt; font-family: calibri; height: 100%; border-radius:5px; text-align:center" disabled/></td></tr>';
		op_item += '<tr><td style="width:50%; padding:5px"><label style="float:right; margin-top:4%">Total Points: </label></td><td style="width:50%; padding:5px"><input type="text" id="inv_point_ans_'
				+ inv_group_counter
				+ '"style="color:gray; background-color:#F0F0F0; width:99%; height:25px; font-size: 10pt; font-family: calibri; height: 100%; border-radius:5px; text-align:center" disabled/></td></tr>';
		op_item += '<tr><td style="width:50%; padding:5px"><label style="float:right; font-weight:bold; margin-top:4%">TOTAL: </label></td><td style="width:50%; padding:5px"><input type="text" id="inv_sum_ans_'
				+ inv_group_counter
				+ '"style="color:gray; background-color:#F0F0F0; width:99%; height:25px; font-size: 11pt; font-weight:bold; font-family: calibri; height: 100%; border-radius:5px; text-align:center" disabled/></td></tr>';
		op_item += '<tr><td style="width:50%"></td><td style="width:50%"><input type="button" style="width:99%; font-family: calibri; height: 25px; padding:1px; color:white; background-color:#337ab7; font-size:10pt; box-shadow:2px 2px 3px black; border:2px solid white; border-radius:20px" value="Get Invoice" onclick="get_item_price('
				+ item_id + ',' + inv_group_counter + ')"/></td></tr>';
		op_item += '</table>';

		$("#div_Inv_Info_" + inv_group_counter + "").append(op_item);
	} else {
		// when change other drop down
		for ( var item in inv_item_Array1) {
			SetSelect.options[SetSelect.options.length] = new Option(item, item);
		}
	}
}

function get_item_price(item_id, btnInv_Counter) {
	// alert1("hi");
	curr_survey_data["item_id_invoice"] = item_id;
	// var length = item_Array_length;
	var final_sumOf_multiplication = 0;
	var pointSum = 0;
	var totalItems = 0;
	var flag = 0;

	var Array = [ {
		"len" : "4",
		"inv_item_Array" : [ {
			"California" : {
				"Monterey" : {
					"Monterey1" : {
						"Monterey11" : [ {
							"item" : "item1",
							"point" : "5",
							"price" : "10"
						}, {
							"item" : "item1",
							"point" : "7",
							"price" : "8"
						} ],
						"Monterey12" : [ {
							"item" : "item1",
							"point" : "5",
							"price" : "10"
						}, {
							"item" : "item1",
							"point" : "7",
							"price" : "8"
						} ]
					},
					"Monterey2" : {
						"Monterey21" : [ {
							"item" : "item1",
							"point" : "5",
							"price" : "10"
						}, {
							"item" : "item1",
							"point" : "7",
							"price" : "8"
						} ],
						"Monterey22" : [ {
							"item" : "item1",
							"point" : "5",
							"price" : "10"
						}, {
							"item" : "item1",
							"point" : "7",
							"price" : "8"
						} ]
					}
				},
				"Alameda" : {
					"Alameda1" : {
						"Alameda11" : [ {
							"item" : "item1",
							"point" : "5",
							"price" : "10"
						}, {
							"item" : "item1",
							"point" : "7",
							"price" : "8"
						} ],
						"Alameda12" : [ {
							"item" : "item1",
							"point" : "5",
							"price" : "10"
						}, {
							"item" : "item1",
							"point" : "7",
							"price" : "8"
						} ]
					},
					"Alameda2" : {
						"Alameda21" : [ {
							"item" : "item1",
							"point" : "5",
							"price" : "10"
						}, {
							"item" : "item1",
							"point" : "7",
							"price" : "8"
						} ],
						"Alameda22" : [ {
							"item" : "item1",
							"point" : "5",
							"price" : "10"
						}, {
							"item" : "item1",
							"point" : "7",
							"price" : "8"
						} ]
					}
				}
			},
			"Oregon" : {
				"Douglas" : {
					"Douglas1" : {
						"Douglas11" : [ {
							"item" : "item1",
							"point" : "5",
							"price" : "10"
						}, {
							"item" : "item1",
							"point" : "7",
							"price" : "8"
						} ],
						"Douglas12" : [ {
							"item" : "item1",
							"point" : "5",
							"price" : "10"
						}, {
							"item" : "item1",
							"point" : "7",
							"price" : "8"
						} ]
					},
					"Douglas2" : {
						"Douglas21" : [ {
							"item" : "item1",
							"point" : "5",
							"price" : "10"
						}, {
							"item" : "item1",
							"point" : "7",
							"price" : "8"
						} ],
						"Douglas22" : [ {
							"item" : "item1",
							"point" : "5",
							"price" : "10"
						}, {
							"item" : "item1",
							"point" : "7",
							"price" : "8"
						} ]
					}
				},
				"Jackson" : {
					"Jackson1" : {
						"Jackson11" : [ {
							"item" : "item1",
							"point" : "5",
							"price" : "10"
						}, {
							"item" : "item1",
							"point" : "7",
							"price" : "8"
						} ],
						"Jackson12" : [ {
							"item" : "item1",
							"point" : "5",
							"price" : "10"
						}, {
							"item" : "item1",
							"point" : "7",
							"price" : "8"
						} ]
					},
					"Jackson2" : {
						"Jackson21" : [ {
							"item" : "item1",
							"point" : "5",
							"price" : "10"
						}, {
							"item" : "item1",
							"point" : "7",
							"price" : "8"
						} ],
						"Jackson22" : [ {
							"item" : "item1",
							"point" : "5",
							"price" : "10"
						}, {
							"item" : "item1",
							"point" : "7",
							"price" : "8"
						} ]
					}
				}
			}

		} ]
	} ];

	var length = Array[0].len;
	var inv_ddl_Array = [];
	var inv_info_Array = [];
	var ans_JSON = [];

	for (n = 0; n < length; n++) {
		var selected_value = $('#inv_item_ddl_' + n + '').val();
		inv_ddl_Array.push(selected_value);
	}

	var checkbox = document.getElementsByName("inv_chkgroup_" + btnInv_Counter
			+ "");
	for (i = 0; i < checkbox.length; i++) {
		var chk_val = $('#inv_chk_' + btnInv_Counter + '_' + i + '').val();
		var item_point = $('#inv_point_' + btnInv_Counter + '_' + i + '').val();
		var item_price = $('#inv_price_' + btnInv_Counter + '_' + i + '').val();
		var chk_status = $('#inv_chk_' + btnInv_Counter + '_' + i + '').prop(
		"checked");

		if (chk_status == true) {
			var item_quantity = $('#inv_qty_' + btnInv_Counter + '_' + i + '')
					.val();

			if (item_quantity == 0) {
				flag = 1;
				alert1('please enter item quantity !');
			}

			var multiplication_quantity_price = item_quantity * item_price;
			var point_multiplication = item_quantity * item_point;

			$('#inv_mul_ans_' + btnInv_Counter + '_' + i + '').val(
					multiplication_quantity_price);

			final_sumOf_multiplication += multiplication_quantity_price;
			pointSum += point_multiplication;

			inv_info_Array.push({
				check_flag : 1,
				check_box : chk_val,
				item_point : item_point,
				item_qty : item_quantity,
				item_price : item_price,
				item_mul : multiplication_quantity_price,
				final_sum : final_sumOf_multiplication
			});
			totalItems++;
		} else {
			inv_info_Array.push({
				check_flag : 0,
				check_box : chk_val,
				item_point : item_point,
				item_qty : '',
				item_price : item_price,
				item_mul : '',
				final_sum : ''
			});
		}
	}
	if (final_sumOf_multiplication == null || final_sumOf_multiplication == ''
			|| final_sumOf_multiplication == 0 || flag == 1) {
		$('#inv_sum_ans_' + btnInv_Counter + '').val('');
		var itm_id = curr_survey_data["item_id_invoice"];
		jsonObj[itm_id].ans = '';
	} else {
		$('#inv_item_ans_' + btnInv_Counter + '').val(totalItems);
		$('#inv_sum_ans_' + btnInv_Counter + '')
				.val(final_sumOf_multiplication);
		$('#inv_point_ans_' + btnInv_Counter + '').val(pointSum);
		ans_JSON.push({
			inv_ddl_Array : inv_ddl_Array,
			inv_info_Array : inv_info_Array
		});
		var itm_id = curr_survey_data["item_id_invoice"];
		jsonObj[itm_id].ans = JSON.stringify(ans_JSON);
	}
}