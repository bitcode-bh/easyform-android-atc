// dynamic single search control (e.g. customer name search)

// get single searched list relative to search string
function get_single_searched_item_list(temp_btnS_Search_Counter, TableName,
    Checksheet_id, ColumName) {
    try {
        curr_btnS_Search_Counter = temp_btnS_Search_Counter;
        Row_Count_Table = 10;
        var search_val = $(
            '#search_item_name_S_Search_' + temp_btnS_Search_Counter + '')
            .val();
        if (search_val == '' || search_val == null || search_val == undefined) {
            alert1("Please enter serch value !")
        } else {
            loading();
            var company_id = JSON.parse(storage.getItem('company_id'));
            var param_obj = [];
            param_obj.push({
                'TableName': TableName,
                'Checksheet_id': Checksheet_id,
                'Company_id': company_id,
                'RowNum': Row_Count_Table,
                'ColumName': ColumName,
                'Value': search_val
                // for all row 1= search from particular column
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

            var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_off_download_Dynamic_Table_Column', JSON.stringify(param_obj), onsuccess_get_single_searched_list, onfail_get_single_searched_list);
            getdata.callOtherDomain();
        }
    } catch (e) {
        alert1(e + '_get_single_searched_item_list()');
        loading_hide();
    }
}

// onsucess get single searched list
function onsuccess_get_single_searched_list(e) {
    try {
        var Data_Json = e.responseText;
        Data_Json = eval('(' + Data_Json + ')');
        var status = Data_Json[0].status;
        var myArray = [];
        $("#S_Search_item_list_" + curr_btnS_Search_Counter + "").empty();
        if (status == 1) {
            //var myArray = eval('(' + Data_Json[0].message + ')');

            var data = Data_Json[0].data;
            if (data == "" || data == null || data == undefined) {
                var myArray = eval('(' + Data_Json[0].message + ')');
            }
            else {
                var myArray = JSON.parse(data);
            }

            // binding customer name to ul list
            if (myArray.length > 0) {
                for (j = 0; j < myArray.length; j++) {
                    var cell_value = myArray[j].Columname;

                    var param = "\"fill_data_to_box_type21('" + j + "')\"";
                    var list_item = '<li onclick='
                        + param
                        + ' style="padding:7px 2px; list-style-type:none; border-style:solid; border-width:1px; border-color:grey">';

                    list_item += "<input type='hidden' id='hdn_type21_row_data_"
                        + j + "' value=\"" + cell_value + "\">";
                    list_item += '<label style="font-size:9pt; font-weight:bold; padding:5px">'
                        + cell_value + '</label>';
                    list_item += '</li>';
                    $("#S_Search_item_list_" + curr_btnS_Search_Counter + "")
                        .append(list_item);
                }
            } else {
                var list_item = '<li style="padding:5px; list-style-type:none; border-style:solid; border-width:1px; border-color:#ccc; text-align:center"><label style="font-size:11pt; font-weight:bold">No Data Found !</label></li>';
                $("#S_Search_item_list_" + curr_btnS_Search_Counter + "")
                    .append(list_item);
            }
        } else {
            var list_item = '<li style="padding:5px; list-style-type:none; border-style:solid; border-width:1px; border-color:#ccc; text-align:center"><label style="font-size:11pt; font-weight:bold">No Data Found !</label></li>';
            $("#S_Search_item_list_" + curr_btnS_Search_Counter + "").append(
                list_item);
        }
        loading_hide();
    } catch (e) {
        alert1(e + '_onsuccess_get_single_searched_list()');
        loading_hide();
    }
}

// put searched details to boxes on particular list click
function fill_data_to_box_type21(row_num) {
    try {
        var temp_cell_value = $("#hdn_type21_row_data_" + row_num + "").val();
        $('#search_item_name_S_Search_' + curr_btnS_Search_Counter + '').val(
            temp_cell_value);
        $('#search_item_name_S_Search_' + curr_btnS_Search_Counter + '').attr(
            'name', '1');
        $("#S_Search_item_list_" + curr_btnS_Search_Counter + "").empty();
    } catch (e) {
        alert1(e + '_fill_data_to_box_type21()')
    }
}

function onfail_get_single_searched_list(e) {
    alert1("Network Error Please try again !");
    loading_hide();
}
