//

// change search type by radio button
function change_search_type(search_type, temp_btnInv_Counter) {
	try {
		$("#product_list").empty();
		if (search_type == 0) {
			curr_search_type = 0; // code
			$('#inv_item_code_Search_' + temp_btnInv_Counter + '').show();
			$('#inv_item_code_Search_' + temp_btnInv_Counter + '').val('');
			$('#inv_item_name_Search_' + temp_btnInv_Counter + '').hide();
		} else {
			curr_search_type = 1; // name
			$('#inv_item_code_Search_' + temp_btnInv_Counter + '').hide();
			$('#inv_item_name_Search_' + temp_btnInv_Counter + '').show();
			$('#inv_item_name_Search_' + temp_btnInv_Counter + '').val('');
		}
		$('#inv_item_Search_' + temp_btnInv_Counter + '').focus();
	} catch (e) {
		alert1(e + '_change_search_type');
	}
}

// ///////////// popup div portion start //////////////////////////
// show popup items pop div on "Select All button
function popup_items_show(temp_btnInv_Counter, bucket_div_id) {
	$("#popup_outer_div").show();
	$('#popup_inner_div').show();
	$('#popup_outer_div').css({
		"z-index" : "2000"
	});
	$('#popup_inner_div').css({
		"left" : ($(window).width() - $('#popup_inner_div').outerWidth()) / 2,
		"top" : ($(window).height() - $('#popup_inner_div').outerHeight()) / 2
	});
	get_all_product_list(temp_btnInv_Counter, bucket_div_id)
}

// hide popup items pop div
function popup_items_hide() {
	$("#popup_outer_div").hide();
	$('#popup_inner_div').hide();
	$('#popup_inner_div').css({
		"left" : ($(window).width() - $('#popup_inner_div').outerWidth()) / 2,
		"top" : ($(window).height() - $('#popup_inner_div').outerHeight()) / 2
	});
}

// get products on popup div
function get_all_product_list(temp_btnInv_Counter, bucket_div_id) {
	try {
		curr_bucket_div_id = bucket_div_id;
		curr_btnInv_Counter = temp_btnInv_Counter;
		var query = "select prod_code, prod_name, prod_point, prod_price from product_master";
		var q_jsonobj = [];
		q_jsonobj.push({
			data : query,
			p : "1"
		});
		cordova.exec(onsuccess_get_all_product_list,
				onfail_get_all_product_list, 'SqlitePlugin', 'showValues',
				q_jsonobj);
	} catch (e) {
		alert1(e + '_get_all_product_list()');
	}
}

// onsucess get all products on popup div
function onsuccess_get_all_product_list(e) {
	try {
		var myArray = JSON.parse(e);
		// alert1(JSON.stringify(myArray));
		$("#popup_product_list").empty();
		if (myArray.length > 0) {
			for ( var i = 0; i < myArray.length; i++) {
				var data = [];
				data.push({
					prod_code : myArray[i].prod_code,
					prod_point : myArray[i].prod_point,
					prod_price : myArray[i].prod_price
				});
				var list_item = '<li style="padding:5px; padding-top:7px; list-style-type:none; border-style:solid; border-width:1px;" class="theme_viewsitepm_li">';
				list_item += '<input type="checkbox" name="inv_popup_chkgroup_'
						+ curr_btnInv_Counter
						+ '" id="inv_popup_chk_'
						+ curr_btnInv_Counter
						+ '_'
						+ i
						+ '" style="margin-right:20px; margin-bottom:5px; vertical-align: middle; width:23px; height: 23px; margin-right:0.5%">';
				list_item += '<label id="lbl_popup_items_'
						+ curr_btnInv_Counter
						+ '_'
						+ i
						+ '" for = '
						+ JSON.stringify(data)
						+ ' style="font-size:9pt; font-weight:bold; padding:5px">'
						+ myArray[i].prod_code + '</label> | ';
				list_item += '<label id="lbl_prod_name_'
						+ curr_btnInv_Counter
						+ '_'
						+ i
						+ '" style="font-size:9pt; font-weight:bold; padding:5px">'
						+ myArray[i].prod_name + '</label>';
				list_item += '</li>';
				$("#popup_product_list").append(list_item);
			}
			var btn_item = '<li style="padding:5px; text-align:center; padding-top:7px; list-style-type:none; border-style:solid; border-width:1px;" class="theme_viewsitepm_li">';
			btn_item += '<input type="button" value="Add To Bucket" class="theme_btn_color" style="margin:5px 0px; padding:4px 10px; font-size:10pt; box-shadow:2px 2px 3px black; border:2px solid white; border-radius:20px" onclick ="popup_add_all_item_to_bucket('
					+ curr_btnInv_Counter + ')">';
			btn_item += '<input type="button" value="Cancel" class="theme_btn_color" style="margin:5px 0px; margin-left:5px; padding:4px 10px;  font-size:10pt; box-shadow:2px 2px 3px black; border:2px solid white; border-radius:20px" onclick ="popup_items_hide()"></li>';
			$("#popup_product_list").append(btn_item);
		} else {
			var list_item = '<li style="padding:5px; list-style-type:none; border-style:solid; border-width:1px;  text-align:center" class="theme_viewsitepm_li"><label style="font-size:11pt; font-weight:bold">No Product Found !</label></li>';
			$("#popup_product_list").append(list_item);
		}
	} catch (e) {
		alert1(e + '_onsuccess_get_all_product_list()');
	}
}

// add selected items to bucket table from popup div
function popup_add_all_item_to_bucket(temp_btnInv_Counter) {
	var checkbox = document.getElementsByName('inv_popup_chkgroup_'
			+ temp_btnInv_Counter + '');
	for (i = 0; i < checkbox.length; i++) {
		var chk_status = $(
				'#inv_popup_chk_' + temp_btnInv_Counter + '_' + i + '').prop(
				"checked");
		if (chk_status == true) {
			var item_json = document.getElementById('lbl_popup_items_'
					+ temp_btnInv_Counter + '_' + i + '').htmlFor;
			var checked_item_data = JSON.parse(item_json);
			var prod_code = checked_item_data[0].prod_code;
			var prod_name = $(
					'#lbl_prod_name_' + temp_btnInv_Counter + '_' + i + '')
					.text();
			var prod_point = checked_item_data[0].prod_point;
			var prod_price = checked_item_data[0].prod_price;
			add_item_to_bucket(prod_code, prod_name, prod_point, prod_price);
		}
	}
	popup_items_hide(); // hide popup after adding all items to bucket
}

// ///////////// popup div portion end //////////////////////////

// get product list relative to search string
function get_product_list(key_code, temp_btnInv_Counter, bucket_div_id) {
	try {
		curr_bucket_div_id = bucket_div_id;
		curr_btnInv_Counter = temp_btnInv_Counter;
		if (key_code == 13) {
			// when press enter key
			var first_str = $('#hdn_first_item').val();
			if (first_str == '' || first_str == null || first_str == undefined) {
				// user entered unsearchable string
			} else {
				var first_item_Array = JSON.parse(first_str);
				var prod_code = first_item_Array[0].prod_code;
				var prod_name = $('#hdn_first_item_name').val();
				var prod_point = first_item_Array[0].prod_point;
				var prod_price = first_item_Array[0].prod_price;
				add_item_to_bucket(prod_code, prod_name, prod_point, prod_price);
			}
		} else {
			// when press numeric or char key
			if (curr_search_type == 0) {
				var search_val = $(
						'#inv_item_code_Search_' + curr_btnInv_Counter + '')
						.val();
			} else {
				var search_val = $(
						'#inv_item_name_Search_' + curr_btnInv_Counter + '')
						.val();
			}

			if (search_val == '' || search_val == null
					|| search_val == undefined) {
				search_val = 'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz';
			}
			if (curr_search_type == 0) {
				var query = "select prod_code, prod_name, prod_point, prod_price from product_master where prod_code like '%"
						+ search_val + "%'";
			} else {
				var query = "select prod_code, prod_name, prod_point, prod_price from product_master where prod_name like '%"
						+ search_val + "%'";
			}
			// alert1(query);
			var q_jsonobj = [];
			q_jsonobj.push({
				data : query,
				p : "1"
			});
			cordova.exec(onsuccess_get_product_list, onfail_get_product_list,
					'SqlitePlugin', 'showValues', q_jsonobj);
		}
	} catch (e) {
		alert1(e + '_get_product_list()');
	}
}

// onsucess get searched product list
function onsuccess_get_product_list(e) {
	try {
		var myArray = JSON.parse(e);
		// alert1(JSON.stringify(myArray));
		$("#product_list").empty();
		if (myArray.length > 0) {
			for ( var i = 0; i < myArray.length; i++) {
				var param = "add_item_to_bucket('" + myArray[i].prod_code
						+ "','" + myArray[i].prod_name + "','"
						+ myArray[i].prod_point + "','" + myArray[i].prod_price
						+ "' )";
				var data = [];
				data.push({
					prod_code : myArray[i].prod_code,
					prod_point : myArray[i].prod_point,
					prod_price : myArray[i].prod_price
				});
				var list_item = '<li onclick="'
						+ param
						+ '" style="padding:5px; padding-top:7px; list-style-type:none; border-style:solid; border-width:1px;" class="theme_viewsitepm_li">';
				if (i == 0) {
					// first item
					list_item += '<input id="hdn_first_item_name" type="hidden" value="'
							+ myArray[i].prod_name
							+ '"><input id="hdn_first_item" type="hidden" value='
							+ JSON.stringify(data) + '>';
				}
				list_item += '<label style="font-size:9pt; font-weight:bold; padding:5px">'
						+ myArray[i].prod_code + '</label> | ';
				list_item += '<label style="font-size:9pt; font-weight:bold; padding:5px">'
						+ myArray[i].prod_name + '</label>';
				list_item += '</li>';
				$("#product_list").append(list_item);
			}
		}
		// else {
		// var list_item = '<li style="padding:5px; list-style-type:none;
		// border-style:solid; border-width:1px; border-color:#337ab7;
		// text-align:center"><label style="font-size:11pt; font-weight:bold">No
		// Product Found !</label></li>';
		// $("#product_list").append(list_item);
		// }
	} catch (e) {
		alert1(e + '_onsuccess_get_product_list()');
	}
}

// add item to bucket table on particular list click
function add_item_to_bucket(prod_code, prod_name, prod_point, prod_price) {
	var table = document.getElementById('tbl_bucket_data_'
			+ curr_btnInv_Counter + '');
	var tr = table.insertRow(inv_item_Counter + 1);
	var td_check_box = tr.insertCell(0);
	var td_point = tr.insertCell(1);
	var td_name = tr.insertCell(2);
	var td_qty = tr.insertCell(3);
	var td_price = tr.insertCell(4);
	var td_total = tr.insertCell(5);

	var str_prod_chk = '<input type="checkbox" name="inv_chkgroup_'
			+ curr_btnInv_Counter + '" id="inv_chk_' + curr_btnInv_Counter
			+ '_' + inv_item_Counter + '"value="' + prod_name
			+ '" style="width:23px; height: 23px">';

	var str_prod_point = '<input type="number" value="'
			+ prod_point
			+ '" id="inv_point_'
			+ curr_btnInv_Counter
			+ '_'
			+ inv_item_Counter
			+ '" style="color:gray; background-color:#F0F0F0; width:80%; height: 20px; font-size: 10pt; font-family: calibri; border-radius:5px; text-align:center" disabled>';

	var str_prod_name = '<label id="inv_chk_lbl_' + curr_btnInv_Counter + '_'
			+ inv_item_Counter + '">' + prod_name + '</label>';

	var str_prod_qty = '<input type="number" id="inv_qty_'
			+ curr_btnInv_Counter
			+ '_'
			+ inv_item_Counter
			+ '" value="1" style="width:80%; height: 20px; color:gray; font-size: 10pt; font-family: calibri; border-radius:5px; text-align:center">';

	var str_prod_price = '<input type="number" id="inv_price_'
			+ curr_btnInv_Counter
			+ '_'
			+ inv_item_Counter
			+ '" value="'
			+ prod_price
			+ '" style="width:90%; height: 20px; color:gray; font-size: 10pt; font-family: calibri; border-radius:5px; text-align:center" disabled>';

	var str_prod_total = '<input type="number" id="inv_mul_ans_'
			+ curr_btnInv_Counter
			+ '_'
			+ inv_item_Counter
			+ '" style="width:90%; height: 20px; color:gray; font-size: 10pt; font-family: calibri; border-radius:5px; text-align:center" disabled>';

	td_check_box.innerHTML = str_prod_chk;
	td_point.innerHTML = str_prod_point;
	td_name.innerHTML = str_prod_name;
	td_qty.innerHTML = str_prod_qty;
	td_price.innerHTML = str_prod_price;
	td_total.innerHTML = str_prod_total;
	$('#inv_qty_' + curr_btnInv_Counter + '_' + inv_item_Counter + '').focus();
	inv_item_Counter++;
}

// calculate final total on Get Invoice button click
function get_item_price(item_id, btnInv_Counter) {
	$("#product_list").empty();
	var final_sumOf_multiplication = 0;
	var pointSum = 0;
	var totalItems = 0;
	var flag = 0;

	var length = bucket_item_Array.length;
	var inv_info_Array = [];
	var ans_JSON = [];
	var final_inv_JSON = [];

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
			});
			totalItems++;
		} else {
			// when checkbox is not checked
			inv_info_Array.push({
				check_flag : 0,
				check_box : chk_val,
				item_point : item_point,
				item_qty : '',
				item_price : item_price,
				item_mul : '',
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
		$('#inv_point_ans_' + btnInv_Counter + '').val(pointSum);
		$('#inv_sum_ans_' + btnInv_Counter + '')
				.val(final_sumOf_multiplication);
		ans_JSON.push({
			total_items : totalItems,
			total_points : pointSum,
			grand_total : final_sumOf_multiplication
		});

		final_inv_JSON.push({
			inv_info_Array : inv_info_Array,
			inv_ans_Array : ans_JSON
		});
		jsonObj[item_id].ans = JSON.stringify(final_inv_JSON);
	}
}

function onfail_get_product_list(e) {
	alert1(e + '_onfail_get_product_list()');
}

function onfail_get_all_product_list(e) {
	alert1(e + '_onfail_get_all_product_list()');
}
