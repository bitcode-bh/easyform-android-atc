
function get_list_of_customer_online() {
    try {
        disable_back_button();
        $("#txtsearch").val("");
        $("#cust_tab").unbind('scroll');

        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var tab_name = list_data[0].tab_name;
        if (tab_name == '' || tab_name == null || tab_name == undefined) {
            tab_name = "Site Listing";
        }

        var param = "refresh_site_list_common()";                                                    //show tab in cust list (mobi.app1)[02042020]
        var tab_str = '<a id="cust_tab" class="tab-link" onclick=' + param + ' style="display: inline-block; width:100%; text-align:center; padding-top: 14px;color: #fff;">' + tab_name + '</a>';
        $("#cust_tab_bar").empty();
        $("#cust_tab_bar").append(tab_str);

        var selected_module_id = JSON.parse(storage.getItem('wayflow'));
        if (selected_module_id == 0) {
            alert1("Please select flow !");
        } else {
            var data_json = JSON.parse(storage.getItem('list_json'));
            var list_data = JSON.parse(data_json);
            var Condition_Data = list_data[0].condition;
            var status_array = list_data[0].status;
            var orderby = list_data[0].orderby;

            var customer_value = list_data[0].customer;
            if (customer_value == "" || customer_value == null || customer_value == undefined) {
                customer_value = "false";
            }

            if (customer_value == "true") {
                $('#btn_Create_Customer').show();
            }
            else {
                $('#btn_Create_Customer').hide();
            }

            var match_temp_id = list_data[0].match_temp_id;
            if (match_temp_id == "" || match_temp_id == null || match_temp_id == undefined) {
                match_temp_id = "";
            }
            localStorage.setItem('match_temp_id', match_temp_id);

            var company_id = JSON.parse(storage.getItem('company_id'));
            if (global_wcf_url == "https://securitywcf.easyform.in/EF_Service.svc/v1/") { }
            else {
                Condition_Data = [];
            }

            if (Condition_Data == '' || Condition_Data == null || Condition_Data == undefined) {
                //alert1("Please add condition from portal first for this flow!");
            } else {
                var user_id = JSON.parse(storage.getItem('user_id'));
                if (orderby == "distance") {
                    var order_by = Condition_Data[0].order_by;
                    if (order_by == undefined) {
                        Condition_Data[0].ORDER_BY[0].DATA[0].USER_LAT = user_lat;
                        Condition_Data[0].ORDER_BY[0].DATA[0].USER_LONG = user_long;
                    } else {
                        Condition_Data[0].order_by[0].data[0].user_lat = user_lat;
                        Condition_Data[0].order_by[0].data[0].user_long = user_long;
                    }
                }

                var where1 = Condition_Data[0].Where;
                var where2 = Condition_Data[0].where;
                var where3 = Condition_Data[0].WHERE;
                if (where1 == undefined && where2 == undefined) {
                    Condition_Data[0].STATIC_JOINS = user_id;
                    Condition_Data[0].LIMIT[0].OFFSET = limit_range - default_range;
                    Condition_Data[0].LIMIT[0].FETCH = increment_range;
                } else if (where2 == undefined && where3 == undefined) {
                    Condition_Data[0].Static_Joins = user_id;
                    Condition_Data[0].LIMIT[0].OFFSET = limit_range - default_range;
                    Condition_Data[0].LIMIT[0].FETCH = increment_range;
                } else {
                    Condition_Data[0].static_joins = user_id;
                    Condition_Data[0].limit[0].offset = limit_range - default_range;
                    Condition_Data[0].limit[0].fetch = increment_range;
                }
            }

            var udf_id = JSON.parse(storage.getItem('udf_id'));

            loading();

            var param_obj = [];
            param_obj.push({
                'Flow_Id': selected_module_id,
                'lat': user_lat,
                'long': user_long,
                'search': "",
                'limit': limit_range,
                'condition': Condition_Data,
                'searchValue': '',
                'offset': limit_range - default_range,
                'fetch': increment_range,
                'status': status_array,
                'udf_id': udf_id
            });

            var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_OnlineTaskList_temp', JSON.stringify(param_obj), onsuccess_get_list_of_customer_online, onfail_get_list_of_customer_online);
            getdata.callOtherDomain();
        }
    } catch (e) {
        alert1(e + '_get_list_of_customer_online()');
        loading_hide();
    }
}

function get_list_of_customer_by_search_online() {
    try {
        disable_back_button();
        var search_keyword = $("#txtsearch").val();
        if (search_keyword != "") {
            var selected_module_id = JSON.parse(storage.getItem('wayflow'));
            if (selected_module_id == 0) {
                alert1("Please select flow !")
            }
            else {

                $("#cust_list").empty();
                $("#cust_tab").unbind('scroll');

                var data_json = JSON.parse(storage.getItem('list_json'));
                var list_data = JSON.parse(data_json);
                var Condition_Data = list_data[0].condition;
                var status_array = list_data[0].status;
                var orderby = list_data[0].orderby;

                var company_id = JSON.parse(storage.getItem('company_id'));
                if (global_wcf_url == "https://securitywcf.easyform.in/EF_Service.svc/v1/") { }
                else {
                    Condition_Data = [];
                }

                var New_Condition_Data;
                if (Condition_Data == '' || Condition_Data == null || Condition_Data == undefined) {
                    //alert1("Please add condition from portal first for this flow!");
                } else {

                    // custom development for metal (when customer listing based on customer sub)
                    var user_id = JSON.parse(storage.getItem('user_id'));

                    var search_condition = [];
                    search_condition.push({
                        "Table_Name": "CUSTOMER_MASTER",
                        "Column_Name": "CUSTOMERUNIQ",
                        "Equation": "LIKE",
                        "Value_1": search_keyword,
                        "Value_2": "",
                        "Type": "STRING"
                    });

                    search_condition.push({
                        "Table_Name": "CUSTOMER_MASTER",
                        "Column_Name": "CUSTOMERNAME",
                        "Equation": "LIKE",
                        "Value_1": search_keyword,
                        "Value_2": "",
                        "Type": "STRING"
                    });

                    search_condition.push({
                        "Table_Name": "CUSTOMER_SUB_MASTER",
                        "Column_Name": "VALUESTRING",
                        "Equation": "LIKE",
                        "Value_1": search_keyword,
                        "Value_2": "",
                        "Type": "STRING"
                    });

                    search_condition.push({
                        "Table_Name": "TASK_SUB_MASTER",
                        "Column_Name": "VALUESTRING",
                        "Equation": "LIKE",
                        "Value_1": search_keyword,
                        "Value_2": "",
                        "Type": "STRING"
                    });

                    // alert1("Before: " + JSON.stringify(Condition_Data));

                    var udf_id = JSON.parse(storage.getItem('udf_id'));
                    if (orderby == "distance") {
                        var order_by = Condition_Data[0].order_by;
                        if (order_by == undefined) {
                            Condition_Data[0].ORDER_BY[0].DATA[0].USER_LAT = user_lat;
                            Condition_Data[0].ORDER_BY[0].DATA[0].USER_LONG = user_long;
                        } else {
                            Condition_Data[0].order_by[0].data[0].user_lat = user_lat;
                            Condition_Data[0].order_by[0].data[0].user_long = user_long;
                        }
                    }

                    var where1 = Condition_Data[0].Where;
                    var where2 = Condition_Data[0].where;
                    var where3 = Condition_Data[0].WHERE;
                    if (where1 == undefined && where2 == undefined) {
                        Condition_Data[0].WHERE[0].OR[0].TABLE.push(search_condition[0]);
                        Condition_Data[0].WHERE[0].OR[0].TABLE.push(search_condition[1]);
                        if (udf_id != 3736) {
                            // from customer sub  [Custom Development For Metal]
                            Condition_Data[0].WHERE[0].OR[0].TABLE.push(search_condition[2]);
                        }
                        else {
                            // from task sub
                            Condition_Data[0].WHERE[0].OR[0].TABLE.push(search_condition[3]);
                        }
                        Condition_Data[0].STATIC_JOINS = user_id;
                        Condition_Data[0].LIMIT[0].OFFSET = limit_range - default_range;
                        Condition_Data[0].LIMIT[0].FETCH = increment_range;
                    } else if (where2 == undefined && where3 == undefined) {
                        Condition_Data[0].Where[0].Or[0].Table.push(search_condition[0]);
                        Condition_Data[0].Where[0].Or[0].Table.push(search_condition[1]);
                        if (udf_id != 3736) {
                            // from customer sub  [Custom Development For Metal]
                            Condition_Data[0].Where[0].Or[0].Table.push(search_condition[2]);
                        }
                        else {
                            // from task sub
                            Condition_Data[0].Where[0].Or[0].Table.push(search_condition[3]);
                        }
                        Condition_Data[0].Static_Joins = user_id;
                        Condition_Data[0].LIMIT[0].OFFSET = limit_range - default_range;
                        Condition_Data[0].LIMIT[0].FETCH = increment_range;
                    } else {
                        Condition_Data[0].where[0].or[0].table.push(search_condition[0]);
                        Condition_Data[0].where[0].or[0].table.push(search_condition[1]);
                        if (udf_id != 3736) {
                            // from customer sub   [Custom Development For Metal]
                            Condition_Data[0].where[0].or[0].table.push(search_condition[2]);
                        }
                        else {
                            // from task sub
                            Condition_Data[0].where[0].or[0].table.push(search_condition[3]);
                        }
                        Condition_Data[0].static_joins = user_id;
                        Condition_Data[0].limit[0].offset = limit_range - default_range;
                        Condition_Data[0].limit[0].fetch = increment_range;
                    }
                    // alert1("After: " + JSON.stringify(Condition_Data));

                }

                var udf_id = JSON.parse(storage.getItem('udf_id'));

                loading();
                var param_obj = [];
                param_obj.push({
                    'Flow_Id': selected_module_id,
                    'lat': user_lat,
                    'long': user_long,
                    'search': "",
                    'limit': limit_range,
                    'condition': Condition_Data,
                    'searchValue': search_keyword,
                    'offset': limit_range - default_range,
                    'fetch': increment_range,
                    'status': status_array,
                    'udf_id': udf_id
                });

                var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_OnlineTaskList_temp', JSON.stringify(param_obj), onsuccess_get_list_of_customer_online, onfail_get_list_of_customer_online);
                getdata.callOtherDomain();

            }
        }
        else {
            alert1("Please enter search keyword !");
        }
    } catch (e) {
        alert1(e + '_get_list_of_customer_by_search_online()');
        loading_hide();
    }
}

function onsuccess_get_list_of_customer_online(e) {
    try {
        $(".norecord_cls").remove();
        var myArray_main = JSON.parse(e.responseText);
        var status = myArray_main[0].status;
        //$("#cust_list").empty();


        if (status == 1) {
            //$("#lbl_siteCount").html("Total : " + myArray_main.length + "");
            var data_json = JSON.parse(storage.getItem('list_json'));
            var list_data = JSON.parse(data_json);
            var geofance_flag = list_data[0].geofence[0].value;
            var geofanceradius = parseInt(list_data[0].geofanceradius);
            var geofance_distance = list_data[0].geofence[0].show_distance;
            var task_clickable = list_data[0].task_clickable;
            var clickable_param = "alert1('This is readonly site !')";
            var weather_display = list_data[0].weather_display;

            var customer_info = list_data[0].customer_info;
            if (customer_info == "" || customer_info == null || customer_info == undefined) {
                customer_info = "false";
            }

            var customer_edit = list_data[0].customer_edit;
            if (customer_edit == "" || customer_edit == null || customer_edit == undefined) {
                customer_edit = "false";
            }

            var data_str = myArray_main[0].data;
            if (data_str == "" || data_str == null || data_str == undefined) { }
            else {
                myArray_main = JSON.parse(data_str);
            }


            if (user_accuracy == "" || user_accuracy == null || user_accuracy == undefined) {
                user_accuracy = 0
            }
            else {
                if (isNaN(user_accuracy) == true) {
                    user_accuracy = 0;
                }
            }

            for (i = 0; i < myArray_main.length; i++) {
                var detail = myArray_main[i].detail;
                var cust_id = myArray_main[i].id;
                var customer_uniq = myArray_main[i].customer_uniq;
                var cust_lat = myArray_main[i].latitude;
                var cust_long = myArray_main[i].longitude;
                var myArray = myArray_main[i].columndata;
                var cust_task_count = myArray_main[i].total_task;

                if (typeof cust_lat == "string") {
                    cust_lat = parseFloat(cust_lat);
                }
                if (typeof cust_long == "string") {
                    cust_long = parseFloat(cust_long);
                }

                var list_item = '';
                var icon_str = '';

                var param2 = "get_user_latlong_for_map('" + cust_lat + "', '" + cust_long + "')";
                var distance = getDistanceFromLatLonInMeter(user_lat, user_long, cust_lat, cust_long);
                distance = parseInt(distance);
                //distance = 0;

                distance_desplay = distance;

                var param = "redirect_on_customer_click_geocheck('" + cust_id + "','" + customer_uniq + "','" + cust_lat + "','" + cust_long + "','" + encodeURIComponent(JSON.stringify(myArray)) + "')";
                var alert_param = "alert_task_distance('" + distance + "','" + geofanceradius + "','" + user_accuracy + "','" + user_lat + "','" + user_long + "','" + cust_lat + "','" + cust_long + "', '" + customer_uniq + "')";

                if (geofance_flag == "true") {
                    // geofence is true

                    if (distance < (geofanceradius + user_accuracy)) {
                        // site is in radius
                        var near_site = 1;
                    } else {
                        // site is not in radius
                        var near_site = 0;
                        param = "get_distance_confirmation_pm_cust('" + cust_id + "','" + customer_uniq + "','" + geofanceradius + "', '" + cust_lat + "', '" + cust_long + "')";
                    }

                    if (near_site == 1) {
                        icon_str += '<i class="fa fa-check-circle cls_task_ico" style="font-size: 30px; color: #4caf50 !important" onclick="' + alert_param + '"></i>';
                    } else {
                        icon_str += '<i class="fa fa-times-circle cls_task_ico" style="font-size: 30px; color: #f44336 !important" onclick="' + alert_param + '"></i>';
                    }
                } else {
                    // geofence is false
                }

                if (task_clickable == 'false') {
                    param = "alert1('This information is read only !')";
                }

                list_item += '<li class="swipeout" id ="lst_' + i + '" onclick ="' + param + '"><a href="#" class="item-link item-content">';

                var navigation_type = list_data[0].navigation;
                if (navigation_type == "true") {
                    icon_str += '<img class="cls_task_ico" onclick="' + param2 + '" src="images/map_view.png" style="width:27px; height:27px" />';
                }

                if (weather_display == 'true') {
                    var param_weather = "view_weather_for_site('" + cust_lat + "', '" + cust_long + "')";
                    icon_str += '<i class="fa fa-cloud cls_task_ico" style="font-size: 30px" onclick="' + param_weather + '"></i>';
                }

                if (task_clickable == 'false' || task_clickable == 'disable_all') {
                    param = clickable_param;
                }

                if (detail == '' || detail == null || detail == undefined) { }
                else {
                    if (customer_info == 'true') {
                        var param3 = "redirect_on_customer_data_click_online('" + cust_id + "','" + customer_uniq + "','" + encodeURIComponent(JSON.stringify(myArray)) + "')";
                        var details = JSON.stringify(detail);
                        list_item += "<input type='hidden' name='customer_detials'  id='customer_" + cust_id + "' value='" + details + "'/>";
                        icon_str += '<i class="fa fa-info-circle cls_task_ico" style="font-size: 32px; margin-bottom:4px" onclick="' + param3 + '"></i>';
                    }
                }

                list_item += '<div class="item-inner item-no-pad" style="margin-right: 7px;"><div class="item-title" style="width: 100%;">';
                list_item += '<table style="width: 100%;">';
                for (j = 0; j < myArray.length; j++) {
                    var header = myArray[j].header;
                    var ans_lable = myArray[j].ans;
                    var position = myArray[j].position;
                    var font_size = myArray[j].font_size;
                    var format = myArray[j].format;
                    var color = myArray[j].color;

                    if (ans_lable == "") {
                        ans_lable = "Data not available"
                    }

                    // list row start
                    if (format == 'italic') {
                        list_item += '<tr><td style="width: 50%;"><label style="font-weight: bold;font-size:' + font_size + 'pt; font-style:' + format + '; color:'
                            + color + '" >' + header + '</label></td><td style="width: 50%;text-align: right;"><label style="font-size:'
                            + font_size + 'pt; font-style:' + format + '; color:' + color + '" class="cls_search">' + ans_lable + '</label></td></tr>';

                    } else {
                        list_item += '<tr><td style="width: 50%;"><label style="font-weight: bold;font-size:' + font_size + 'pt; text-decoration:' + format + '; color:'
                            + color + '" >' + header + '</label></td><td style="width: 50%;text-align: right;"><label style="font-size:'
                            + font_size + 'pt; text-decoration:' + format + '; color:' + color + '" class="cls_search">' + ans_lable + '</label></td></tr>';
                    }
                }

                var geofance_flag = list_data[0].geofence[0].value;
                var geofance_distance = list_data[0].geofence[0].show_distance;
                if (geofance_distance == 'true') {

                    // custom development for telefonica
                    var company_id = JSON.parse(storage.getItem('company_id'));
                    if (company_id == '1238') {
                        var miles = distance_desplay / 1609.344;
                        distance_desplay = parseFloat(miles).toFixed(2) + ' miles';
                    }
                    else {
                        distance_desplay = distance_desplay + ' m';
                    }

                    list_item += '<tr><td style="width: 50%;"><label style="font-weight: bold;font-size:' + font_size + 'pt; font-style:' + format + '; color:'
                        + color + '">Distance</label></td><td style="width: 50%;text-align: right;"><label style="font-size:'
                        + font_size + 'pt; font-style:' + format + '; color:' + color + '" class="cls_search">' + distance_desplay + '</label></td></tr>';
                }

                if (cust_task_count == "" || cust_task_count == null || cust_task_count == undefined) { }
                else {
                    list_item += '<tr><td style="width: 50%;"><label style="font-weight: bold;font-size:' + font_size + 'pt; font-style:' + format + '; color:'
                        + color + '">Material Count</label></td><td style="width: 50%;text-align: right;"><label style="font-size:'
                        + font_size + 'pt; font-style:' + format + '; color:' + color + '" class="cls_search">' + cust_task_count + '</label></td></tr>';
                }

                list_item += '</table>';
                list_item += '</div><div class="item-after"><div class="item-icon">' + icon_str + '</div></div></div></a>';


                if (customer_edit == 'true') {
                    //var param_edit_customer = "get_edit_customer_checksheet('" + cust_id + "')";
                    var param_edit_customer = "redirect_to_edit_customer_form('" + cust_id + "')";
                    list_item += '<div class="swipeout-actions-right" style="right: 0% !important;">';
                    list_item += '<a id="btn_cust_edit_' + cust_id + '" class="cls_swipeBtn" onclick="' + param_edit_customer + '" style="transform: translate3d(0, 0px, 0px);">Edit</a>';
                    list_item += '</div>';
                }

                list_item += '</li>';
                $("#cust_list").append(list_item);
                $('.cls_task_ico').click(function (event) {
                    event.stopPropagation();
                });
                $('.cls_swipeBtn').click(function (event) {
                    event.stopPropagation();
                });
            }
            var crash_status = JSON.parse(storage.getItem('crash_status'));
            if (crash_status == null || crash_status == undefined || crash_status == '') {
                crash_status = 0;
            }
            if (crash_status == 2) {
                // application has been crashed
                storage.setItem('crash_status', JSON.stringify('0'));
            }

            var li_length = $("#cust_list li").length;
            //$("#lbl_siteCount").html("Total : " + li_length + "");

            if (li_length >= limit_range) {
                //$(".op-show-btns").show();
                $("#btn_SeeAll").show();
                $("#btn_SeeMore").show();

                $("#cust_tab").scroll(function () {
                    var offsetHeight = document.getElementById("cust_tab").offsetHeight;
                    var scrollTop = document.getElementById("cust_tab").scrollTop;
                    var scrollHeight = document.getElementById("cust_tab").scrollHeight;
                    if (parseInt(scrollTop) === (parseInt(scrollHeight) - parseInt(offsetHeight))) {
                        see_more_site_list_common();
                    }
                });
            }
            else {
                //$(".op-show-btns").hide();
                $("#btn_SeeAll").hide();
                $("#btn_SeeMore").hide();
            }
        }
        else if (status == 2) {
            var li_length = $("#cust_list li").length;
            if (li_length == 0) {
                //$("#lbl_siteCount").html("Total : 0");
                var list_item = '<li class="norecord_cls"><a href="#" class="item-link item-content"><div class="item-inner item-no-pad"><div class="item-title">No Record Found !</div></div></a></li>';
                $("#cust_list").append(list_item);
            }
        }
        else {
            //$("#lbl_siteCount").html("Total : 0");
            var message = myArray_main[0].message;
            alert1(message);
        }

        enable_back_button();
        loading_hide();
    } catch (e) {
        alert1(e + '_onsuccess_get_list_of_customer_online()')
        loading_hide();
    }
}

// geo check
function redirect_on_customer_click_geocheck(selected_customer_id, selected_customeruniq, t_site_lat, t_site_long, columndata_str) {
    try {
        localStorage.setItem('ID_useType22', selected_customer_id);

        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var geofance_flag = list_data[0].geofence[0].value;
        if (geofance_flag == "true") {
            // With geo fencing

            var locObj = new MkLocation();
            locObj._getLocation(function (e) {
                var user_lat = e[0].lat;
                var user_long = e[0].long;
                var user_accuracy = e[0].accuracy;

                var distance = getDistanceFromLatLonInMeter(user_lat, user_long, t_site_lat, t_site_long);
                distance = parseInt(distance);
                //distance = 0;

                var geofanceradius = parseInt(list_data[0].geofanceradius);
                if (distance < (geofanceradius + user_accuracy)) {
                    // site is in radius
                    redirect_on_customer_click_online(selected_customer_id, selected_customeruniq, columndata_str)
                } else {
                    // site is not in radius
                    alert1("You are far from site!");
                    $("#cust_list").empty();
                    get_list_of_customer_online();
                }
            });
        }
        else {
            // Without geo fencing
            redirect_on_customer_click_online(selected_customer_id, selected_customeruniq, columndata_str);
        }
    } catch (e) {
        alert1(e + '_redirect_on_customer_click_geocheck()');
        loading_hide();
    }
}

// redirect page on pm site click when user near from site
function redirect_on_customer_click_online(selected_customer_id, selected_customeruniq, columndata_str) {
    try {
        loading();
        localStorage.setItem("is_new_customer_click", "false");

        localStorage.setItem('is_shortcutbutton', 'false');
        var columndata_Array = JSON.parse(decodeURIComponent(columndata_str));
        storage.setItem('curr_btn_mode', JSON.stringify(''));
        storage.setItem('customer_columndata', JSON.stringify(columndata_Array));
        storage.setItem('edit_customer_id', JSON.stringify(selected_customer_id));
        storage.setItem('type20_cust_id', JSON.stringify(selected_customer_id));
        storage.setItem('type20_cust_name', JSON.stringify(selected_customeruniq));
        storage.setItem('sitename', JSON.stringify(selected_customeruniq));
        var checksheetid = storage.getItem('check_type_task');
        if (F7_device == 'ios') {
            checksheetid = checksheetid.substring(0, checksheetid.length - 0);
        }
        else {
            //checksheetid = checksheetid.substring(1, checksheetid.length - 1);
            checksheetid = checksheetid.replace(/['"]+/g, '');
        }
        localStorage.setItem('checksheetid', checksheetid);
        localStorage.setItem('redirect_on_module', 'true');

        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var customer_redirection = list_data[0].customer_redirection;
        if (customer_redirection == 'module') {
            //changeurl("selection.html");

            check_for_notification();
        }
        else {
            //changeurl("viewsitedata_task.html");
            check_last_dummy_entry();
        }
    } catch (e) {
        alert1(e + '_redirect_on_customer_click_online()');
        loading_hide();
    }
}

//customer information
function redirect_on_customer_data_click_online(selected_customer_id, selected_customeruniq, columndata_str) {
    try {
        var json_value = $('#customer_' + selected_customer_id + '').val();
        myApp.popup('.popup-cust_info');
        var json_parse = JSON.parse(json_value);
        var d_json_parse = JSON.parse(json_parse);
        var tr_len = d_json_parse.length;
        var myTableDiv = document.getElementById("myDynamicTable");
        myTableDiv.innerHTML = '';
        var table = document.createElement('TABLE');
        table.className = "table_ans";
        for (var i = 0; i < tr_len; i++) {
            var type = d_json_parse[i].type;
            if (type == 0 || type == 5 || type == 7 || type == 10) { }
            else {
                var tr = document.createElement('TR');
                tr.className = "tr_ans";
                table.appendChild(tr);
                var td1 = document.createElement('TD');
                td1.innerHTML = d_json_parse[i].prop[0].name;;
                td1.className = "td1_ans";
                var td2 = document.createElement('TD');
                if (type == 8) {
                    if (d_json_parse[i].ans.length > 1) {
                        td2.innerHTML = d_json_parse[i].ans[1];
                    }
                    else {
                        td2.innerHTML = d_json_parse[i].ans[0];
                    }
                }
                if (type == 20) {
                    td2.innerHTML = d_json_parse[i].ans[0];
                }
                else {
                    td2.innerHTML = d_json_parse[i].ans;
                }
                td2.className = "td2_ans";
                tr.appendChild(td1);
                tr.appendChild(td2);
            }
        }
        myTableDiv.appendChild(table);
    } catch (e) {
        alert1(e + '_redirect_on_customer_data_click_online()');
        loading_hide();
    }
}
//custmore info end

// when user far from site
function get_distance_confirmation_pm_cust(selected_customer_id, selected_customeruniq, t_user_radius, t_site_lat, t_site_long) {
    try {
        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var support = list_data[0].support;
        if (support == "" || support == null || support == undefined) {
            support = "false";
        }

        // support = "true";
        if (support == "false") {
            alert1("You are far from site, please change your position !");
        } else {
            if (F7_device == 'ios') {
                var user_choice = true;
            }
            else {
                vibrate_device();
                var user_choice = confirm("You are far from site. Are you sure, you want to go ahead ?");
            }
            if (user_choice == true) {
                storage.setItem('site_lat', JSON.stringify(t_site_lat));
                storage.setItem('site_long', JSON.stringify(t_site_long));
                storage.setItem('type20_cust_id', JSON.stringify(selected_customer_id));
                storage.setItem('type20_cust_name', JSON.stringify(selected_customeruniq));
                storage.setItem('siteid', JSON.stringify(selected_customer_id));
                storage.setItem('sitename', JSON.stringify(selected_customeruniq));
                storage.setItem('user_radius', JSON.stringify(t_user_radius));
                storage.setItem('support_type', JSON.stringify('customer'));

                var data_json = JSON.parse(storage.getItem('list_json'));
                var list_data = JSON.parse(data_json);
                var task_with_customer = list_data[0].task_with_customer;
                if (task_with_customer == "true") {
                    get_latlong_for_task_with_customer();
                }
                else {
                    changeurl('support_page.html');
                }
            }
        }
    } catch (e) {
        alert1(e + '_get_distance_confirmation_pm()');
        loading_hide();
    }
    return false;
}

function onfail_get_list_of_customer_online(e) {
    alert1(e + '_onfail_get_list_of_pm_sites()');
    $("#cust_list").empty();
    //$("#lbl_siteCount").html("Total : 0");
    var list_item = '<li><a href="#" class="item-link item-content"><div class="item-inner item-no-pad"><div class="item-title">Network Error! Slide Down To Refresh !</div></div></a></li>';
    $("#cust_list").append(list_item);
    loading_hide();
}

function create_new_customer() {
    try {
        localStorage.setItem("is_new_customer_click", "true");
        changeurl('viewsitedata_task.html');
    } catch (e) {
        alert1(e + '_create_new_customer');
        loading_hide();
    }
}

function redirect_to_customer_form() {
    try {
        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var cust_checksheet_id = list_data[0].customer_checksheet_id;
        if (cust_checksheet_id == "" || cust_checksheet_id == null || cust_checksheet_id == undefined) {
            cust_checksheet_id = "";
            alert1("Please add customer checksheet id...");
        }

        get_checksheet_details_new_customer(cust_checksheet_id);

    } catch (e) {
        alert1(e + '_redirect_to_customer_form');
        loading_hide();
    }
}

function get_checksheet_details_new_customer(t_checksheet_id) {
    try {
        loading();
        var company_id = JSON.parse(storage.getItem('company_id'));
        localStorage.setItem('check_type_customer', t_checksheet_id);
        var Param_obj = [];
        Param_obj.push({
            'checksheet_id': t_checksheet_id
        });

        var auth = [];
        auth.push({
            'username': username,
            'u_c': uniqcode
        });

        var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_Off_Download_Task_Master_checksheet', JSON.stringify(Param_obj), onsuccess_get_checksheet_details_new_customer, onfail_get_checksheet_details_new_customer);
        getdata.callOtherDomain();
    }
    catch (e) {
        alert1(e + '_get_checksheet_details_new_customer');
        loading_hide();
    }
}

function onsuccess_get_checksheet_details_new_customer(e) {
    try {
        var Task_json = e.responseText;
        Task_json = Task_json.replace('[ [', '[');
        Task_json = Task_json.replace('] ]', ']');
        Task_json = eval('(' + Task_json + ')');
        var status = Task_json[0].status;
        var message = Task_json[0].message;
        if (status == 1) {

            var data = Task_json[0].data;
            if (data == "" || data == null || data == undefined) {
                message = eval('(' + message + ')');
            }
            else {
                message = JSON.parse(data);
            }

            var Subcategory = message[0].Subcategory;
            var checksheet_id = message[0].checksheet_id;
            var Data = message[0].Data;
            Data = eval('(' + Data + ')');
            var button = message[0].button;
            button = eval('(' + button + ')');

            read_dynamic_checksheet(Subcategory, checksheet_id, 1, Data, button, 7, 0);
        }
    }
    catch (e) {
        alert1(e + '_onsuccess_get_checksheet_details_new_customer()');
        loading_hide();
    }
}

function onfail_get_checksheet_details_new_customer(e) {
    alert1(e + '_get_checksheet_details_new_customer()');
    loading_hide();
}

function submit_customer_form() {
    try {
        return validate_and_submit_surveydata_main(1, 7, jsonObj_old);
    } catch (e) {
        alert1(e + "_submit_customer_form");
    }
    return false;
}

var glob_cust_json;
function add_new_customer_from_customer_listing(t_jsonObj) {
    loading();
    var company_id = JSON.parse(storage.getItem('company_id'));
    var user_id = JSON.parse(storage.getItem('user_id'));
    var checksheet_id = localStorage.getItem('check_type_customer');

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

    var Param_obj = [];
    Param_obj.push({
        'CustomerUniqId': "",
        'Company_id': company_id,
        'Subcategory': "",
        'Step_id': 1,
        'StepNo': 1,
        'checksheet_id': checksheet_id,
        'Status': 0,
        'Data': t_jsonObj,
        'button': [],
        'createby': user_id,
        'UpdatedBy': user_id,
        "checksheet_type": 3,
        'photo_temp': Photo_Id_Array
    });

    var cust_data_json = t_jsonObj;
    for (var t = 0; t < cust_data_json.length; t++) {
        var que_id = cust_data_json[t].que_id;
        if (que_id == 1) {
            var cust_name = cust_data_json[t].ans[0];
            break;
        }
    }
    localStorage.setItem('type20_new_cust_name', cust_name);

    glob_cust_json = Param_obj;

    var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_Check_Customer_Or_User_Exists', JSON.stringify(Param_obj), check_new_customer_exist, onfail_insert_new_customer);
    getdata.callOtherDomain();
}

function check_new_customer_exist(invocation1) {
    try {
        var Suc_Message = invocation1.responseText;
        Suc_Message = eval('(' + Suc_Message + ')');
        var status = Suc_Message[0].status;
        if (status == 11) {
            // customer is not exist

            var auth = [];
            auth.push({
                'username': username,
                'u_c': uniqcode
            });

            var Param_obj = [];
            Param_obj = glob_cust_json;

            var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_insert_Customer_Master_And_Sub_Type', JSON.stringify(Param_obj), onsucess_insert_new_customer, onfail_insert_new_customer);
            getdata.callOtherDomain();
        }
        else {
            // customer exist
            var message = Suc_Message[0].message;
            loading_hide();
            alert1(message);
        }
    }
    catch (e) {
        loading_hide();
        alert1(e + '_check_new_customer_exist');
    }
}

function onsucess_insert_new_customer(invocation1) {
    try {
        var Suc_Message1 = invocation1.responseText;
        Suc_Message1 = eval('(' + Suc_Message1 + ')');
        var message1 = Suc_Message1[0].message;
        var status = Suc_Message1[0].status;

        loading_hide();

        if (status == 1) {
            var data_json = JSON.parse(storage.getItem('list_json'));
            var list_data = JSON.parse(data_json);
            var customer_create_msg = list_data[0].customer_create_msg;
            if (customer_create_msg == "" || customer_create_msg == null || customer_create_msg == undefined) {
                customer_create_msg = "Customer Inserted successfully";
            }
            alert1(customer_create_msg);
            changeurl("viewcustomerlist_on.html");
        }
        else {
            alert1(message1);
        }
    }
    catch (e) {
        loading_hide();
        alert1(e + '_onsucess_insert_new_customer');
    }
}

function onfail_insert_new_customer(e) {
    alert1(e + "_onfail_insert_new_customer");
    loading_hide();
}


//*****-----------customer list from task creation-----****////////
var glob_cust_list_data;
function get_udf_for_cust_list() {
    $("#popup_cust_list").empty();
    myApp.popup(".popup-customer-listing");

    var data_json = JSON.parse(storage.getItem('list_json'));
    var list_data_task = JSON.parse(data_json);
    var customer_udf_id = list_data_task[0].customer_udf_id;

    var query = "SELECT data FROM User_Define_Flow_Master WHERE id = " + customer_udf_id + " and (is_delete != 1 or is_delete IS NULL)";
    var q_jsonobj = [];
    q_jsonobj.push({
        data: query,
        p: "1"
    });

    cordova.exec(onsuccess_get_udf_for_cust_list, onfail_get_udf_for_cust_list, 'SqlitePlugin', 'showValues', q_jsonobj);
}

function onsuccess_get_udf_for_cust_list(e) {
    var myArray = JSON.parse(e);
    var data_count = myArray[0].data;

    var list_data = JSON.parse(data_count);
    glob_cust_list_data = list_data;
    get_customer_list_from_task_create();
}

function onfail_get_udf_for_cust_list(e) {
    loading_hide();
    alert1(e + '_onfail_get_udf_for_cust_list()');
}

function get_customer_list_from_task_create() {
    try {
        disable_back_button();
        $("#popup_cust_tab").unbind('scroll');
        $("#popup_cust_list").empty();
        var search_keyword = $("#cust_txtsearch").val();

        var list_data = glob_cust_list_data;

        var selected_module_id = JSON.parse(storage.getItem('wayflow'));
        if (selected_module_id == 0) {
            alert1("Please select flow !");
        } else {
            var Condition_Data = list_data[0].condition;
            var status_array = list_data[0].status;
            var orderby = list_data[0].orderby;

            var customer_value = list_data[0].customer;
            if (customer_value == "" || customer_value == null || customer_value == undefined) {
                customer_value = "false";
            }

            if (customer_value == "true") {
                $('#btn_Create_Customer').show();
            }
            else {
                $('#btn_Create_Customer').hide();
            }

            var match_temp_id = list_data[0].match_temp_id;
            if (match_temp_id == "" || match_temp_id == null || match_temp_id == undefined) {
                match_temp_id = "";
            }
            localStorage.setItem('match_temp_id', match_temp_id);

            var company_id = JSON.parse(storage.getItem('company_id'));
            if (global_wcf_url == "https://securitywcf.easyform.in/EF_Service.svc/v1/") { }
            else {
                Condition_Data = [];
            }

            if (Condition_Data == '' || Condition_Data == null || Condition_Data == undefined) {
                //alert1("Please add condition from portal first for this flow!");
            } else {
                var user_id = JSON.parse(storage.getItem('user_id'));
                if (orderby == "distance") {
                    var order_by = Condition_Data[0].order_by;
                    if (order_by == undefined) {
                        Condition_Data[0].ORDER_BY[0].DATA[0].USER_LAT = user_lat;
                        Condition_Data[0].ORDER_BY[0].DATA[0].USER_LONG = user_long;
                    } else {
                        Condition_Data[0].order_by[0].data[0].user_lat = user_lat;
                        Condition_Data[0].order_by[0].data[0].user_long = user_long;
                    }
                }

                var where1 = Condition_Data[0].Where;
                var where2 = Condition_Data[0].where;
                var where3 = Condition_Data[0].WHERE;
                if (where1 == undefined && where2 == undefined) {
                    Condition_Data[0].STATIC_JOINS = user_id;
                    Condition_Data[0].LIMIT[0].OFFSET = limit_range - default_range;
                    Condition_Data[0].LIMIT[0].FETCH = increment_range;
                } else if (where2 == undefined && where3 == undefined) {
                    Condition_Data[0].Static_Joins = user_id;
                    Condition_Data[0].LIMIT[0].OFFSET = limit_range - default_range;
                    Condition_Data[0].LIMIT[0].FETCH = increment_range;
                } else {
                    Condition_Data[0].static_joins = user_id;
                    Condition_Data[0].limit[0].offset = limit_range - default_range;
                    Condition_Data[0].limit[0].fetch = increment_range;
                }
            }

            var data_json = JSON.parse(storage.getItem('list_json'));
            var list_data_task = JSON.parse(data_json);
            var customer_udf_id = list_data_task[0].customer_udf_id;

            var increment_range_customer = list_data[0].show_task_limit;
            if (increment_range_customer == "" || increment_range_customer == null || increment_range_customer == undefined) {
                increment_range_customer = 20;
            }
            increment_range_customer = parseInt(increment_range_customer);
            var cust_limit_range = increment_range_customer;
            var cust_default_range = increment_range_customer

            loading();

            var param_obj = [];
            param_obj.push({
                'Flow_Id': selected_module_id,
                'lat': user_lat,
                'long': user_long,
                'search': "",
                'limit': cust_limit_range,
                'condition': Condition_Data,
                'searchValue': search_keyword,
                'offset': cust_limit_range - cust_default_range,
                'fetch': increment_range_customer,
                'status': status_array,
                'udf_id': customer_udf_id
            });

            var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_OnlineTaskList_temp', JSON.stringify(param_obj), onsuccess_get_customer_list_from_task_create, onfail_get_customer_list_from_task_create);
            getdata.callOtherDomain();
        }
    } catch (e) {
        alert1(e + '_get_customer_list_from_task_create()');
        loading_hide();
    }
}

function onsuccess_get_customer_list_from_task_create(e) {
    try {
        $(".norecord_cls").remove();
        var myArray_main = JSON.parse(e.responseText);
        var status = myArray_main[0].status;

        if (status == 1) {
            var list_data = glob_cust_list_data;
            var geofance_flag = list_data[0].geofence[0].value;
            var geofanceradius = parseInt(list_data[0].geofanceradius);
            var geofance_distance = list_data[0].geofence[0].show_distance;
            var task_clickable = list_data[0].task_clickable;
            var clickable_param = "alert1('This is readonly site !')";
            var weather_display = list_data[0].weather_display;

            var customer_info = list_data[0].customer_info;
            if (customer_info == "" || customer_info == null || customer_info == undefined) {
                customer_info = "false";
            }

            var data_str = myArray_main[0].data;
            if (data_str == "" || data_str == null || data_str == undefined) { }
            else {
                myArray_main = JSON.parse(data_str);
            }

            if (user_accuracy == "" || user_accuracy == null || user_accuracy == undefined) {
                user_accuracy = 0
            }
            else {
                if (isNaN(user_accuracy) == true) {
                    user_accuracy = 0;
                }
            }

            for (i = 0; i < myArray_main.length; i++) {
                var detail = myArray_main[i].detail;
                var cust_id = myArray_main[i].id;
                var customer_uniq = myArray_main[i].customer_uniq;
                var cust_lat = myArray_main[i].latitude;
                var cust_long = myArray_main[i].longitude;
                var myArray = myArray_main[i].columndata;
                var cust_task_count = myArray_main[i].total_task;

                if (typeof cust_lat == "string") {
                    cust_lat = parseFloat(cust_lat);
                }
                if (typeof cust_long == "string") {
                    cust_long = parseFloat(cust_long);
                }

                var list_item = '';
                var icon_str = '';

                var param2 = "get_user_latlong_for_map('" + cust_lat + "', '" + cust_long + "')";
                var distance = getDistanceFromLatLonInMeter(user_lat, user_long, cust_lat, cust_long);
                distance = parseInt(distance);
                //distance = 0;

                distance_desplay = distance;

                var param = "redirect_on_customer_click_geocheck('" + cust_id + "','" + customer_uniq + "','" + cust_lat + "','" + cust_long + "','" + encodeURIComponent(JSON.stringify(myArray)) + "')";
                var alert_param = "alert_task_distance('" + distance + "','" + geofanceradius + "','" + user_accuracy + "','" + user_lat + "','" + user_long + "','" + cust_lat + "','" + cust_long + "', '" + customer_uniq + "')";

                if (geofance_flag == "true") {
                    // geofence is true

                    if (distance < (geofanceradius + user_accuracy)) {
                        // site is in radius
                        var near_site = 1;
                    } else {
                        // site is not in radius
                        var near_site = 0;
                        param = "get_distance_confirmation_pm_cust('" + cust_id + "','" + customer_uniq + "','" + geofanceradius + "', '" + cust_lat + "', '" + cust_long + "')";
                    }

                    if (near_site == 1) {
                        icon_str += '<i class="fa fa-check-circle cls_task_ico" style="font-size: 30px; color: #4caf50 !important" onclick="' + alert_param + '"></i>';
                    } else {
                        icon_str += '<i class="fa fa-times-circle cls_task_ico" style="font-size: 30px; color: #f44336 !important" onclick="' + alert_param + '"></i>';
                    }
                } else {
                    // geofence is false
                }

                if (task_clickable == 'false') {
                    param = "alert1('This information is read only !')";
                }

                list_item += '<li id ="lst_' + i + '" onclick ="' + param + '"><a href="#" class="item-link item-content">';

                var navigation_type = list_data[0].navigation;
                if (navigation_type == "true") {
                    icon_str += '<img class="cls_task_ico" onclick="' + param2 + '" src="images/map_view.png" style="width:27px; height:27px" />';
                }

                if (weather_display == 'true') {
                    var param_weather = "view_weather_for_site('" + cust_lat + "', '" + cust_long + "')";
                    icon_str += '<i class="fa fa-cloud cls_task_ico" style="font-size: 30px" onclick="' + param_weather + '"></i>';
                }

                if (task_clickable == 'false' || task_clickable == 'disable_all') {
                    param = clickable_param;
                }

                if (detail == '' || detail == null || detail == undefined) { }
                else {
                    if (customer_info == 'true') {
                        var param3 = "redirect_on_customer_data_click_online('" + cust_id + "','" + customer_uniq + "','" + encodeURIComponent(JSON.stringify(myArray)) + "')";
                        var details = JSON.stringify(detail);
                        list_item += "<input type='hidden' name='customer_detials'  id='customer_" + cust_id + "' value='" + details + "'/>";
                        icon_str += '<i class="fa fa-info-circle cls_task_ico" style="font-size: 32px; margin-bottom:4px" onclick="' + param3 + '"></i>';
                    }
                }

                list_item += '<div class="item-inner item-no-pad" style="margin-right: 7px;"><div class="item-title" style="width: 100%;">';
                list_item += '<table style="width: 100%;">';
                for (j = 0; j < myArray.length; j++) {
                    var header = myArray[j].header;
                    var ans_lable = myArray[j].ans;
                    var position = myArray[j].position;
                    var font_size = myArray[j].font_size;
                    var format = myArray[j].format;
                    var color = myArray[j].color;

                    if (ans_lable == "") {
                        ans_lable = "Data not available"
                    }

                    // list row start
                    if (format == 'italic') {
                        list_item += '<tr><td style="width: 50%;"><label style="font-weight: bold;font-size:' + font_size + 'pt; font-style:' + format + '; color:'
                            + color + '" >' + header + '</label></td><td style="width: 50%;text-align: right;"><label style="font-size:'
                            + font_size + 'pt; font-style:' + format + '; color:' + color + '" class="cls_search">' + ans_lable + '</label></td></tr>';

                    } else {
                        list_item += '<tr><td style="width: 50%;"><label style="font-weight: bold;font-size:' + font_size + 'pt; text-decoration:' + format + '; color:'
                            + color + '" >' + header + '</label></td><td style="width: 50%;text-align: right;"><label style="font-size:'
                            + font_size + 'pt; text-decoration:' + format + '; color:' + color + '" class="cls_search">' + ans_lable + '</label></td></tr>';
                    }
                }

                var geofance_flag = list_data[0].geofence[0].value;
                var geofance_distance = list_data[0].geofence[0].show_distance;
                if (geofance_distance == 'true') {

                    // custom development for telefonica
                    var company_id = JSON.parse(storage.getItem('company_id'));
                    if (company_id == '1238') {
                        var miles = distance_desplay / 1609.344;
                        distance_desplay = parseFloat(miles).toFixed(2) + ' miles';
                    }
                    else {
                        distance_desplay = distance_desplay + ' m';
                    }

                    list_item += '<tr><td style="width: 50%;"><label style="font-weight: bold;font-size:' + font_size + 'pt; font-style:' + format + '; color:'
                        + color + '">Distance</label></td><td style="width: 50%;text-align: right;"><label style="font-size:'
                        + font_size + 'pt; font-style:' + format + '; color:' + color + '" class="cls_search">' + distance_desplay + '</label></td></tr>';
                }

                if (cust_task_count == "" || cust_task_count == null || cust_task_count == undefined) { }
                else {
                    list_item += '<tr><td style="width: 50%;"><label style="font-weight: bold;font-size:' + font_size + 'pt; font-style:' + format + '; color:'
                        + color + '">Material Count</label></td><td style="width: 50%;text-align: right;"><label style="font-size:'
                        + font_size + 'pt; font-style:' + format + '; color:' + color + '" class="cls_search">' + cust_task_count + '</label></td></tr>';
                }

                list_item += '</table>';
                list_item += '</div><div class="item-after"><div class="item-icon">' + icon_str + '</div></div></div></a>';

                list_item += '</li>';

                $("#popup_cust_list").append(list_item);
                $('.cls_task_ico').click(function (event) {
                    event.stopPropagation();
                });
            }
            var crash_status = JSON.parse(storage.getItem('crash_status'));
            if (crash_status == null || crash_status == undefined || crash_status == '') {
                crash_status = 0;
            }
            if (crash_status == 2) {
                // application has been crashed
                storage.setItem('crash_status', JSON.stringify('0'));
            }

            //var li_length = $("#popup_cust_list li").length;
            //if (li_length >= limit_range) {
            //    $("#popup_cust_tab").scroll(function () {
            //        var offsetHeight = document.getElementById("popup_cust_tab").offsetHeight;
            //        var scrollTop = document.getElementById("popup_cust_tab").scrollTop;
            //        var scrollHeight = document.getElementById("popup_cust_tab").scrollHeight;
            //        if (parseInt(scrollTop) === (parseInt(scrollHeight) - parseInt(offsetHeight))) {
            //            show_more_popup_cust_list();
            //        }
            //    });
            //}
        }
        else if (status == 2) {
            var li_length = $("#popup_cust_list li").length;
            if (li_length == 0) {
                var list_item = '<li class="norecord_cls"><a href="#" class="item-link item-content"><div class="item-inner item-no-pad"><div class="item-title">No Record Found !</div></div></a></li>';
                $("#popup_cust_list").append(list_item);
            }
        }
        else {
            var message = myArray_main[0].message;
            alert1(message);
        }

        enable_back_button();
        loading_hide();
    } catch (e) {
        alert1(e + '_onsuccess_get_customer_list_from_task_create()')
        loading_hide();
    }
}

function show_more_popup_cust_list() {
    limit_range = limit_range + increment_range;
    get_customer_list_from_task_create();
}

function back_from_cust_popup() {
    var search_bar_dis = $('.head-search').css('display');
    if (search_bar_dis != "none" && F7_view == 'true') {
        $('.head-search').hide();
        $('.head-title').show();
        $('.head-menu').show();
        if (F7_device == 'android') {
            $('.tabbar').slideDown(100);
            //$('#tab1').css('padding-top', '104px');
            //$('#tab2').css('padding-top', '104px');
            //$('#tab3').css('padding-top', '104px');
        }
    }
    else {
        myApp.closeModal(".popup-customer-listing");
    }
    loading_hide();
}

function get_latlong_for_task_with_customer() {
    cordova.exec(onsuccess_get_latlong_for_task_with_customer, onfail_get_latlong_for_task_with_customer, 'maulik', 'nck', ["ds"]);
}

function onsuccess_get_latlong_for_task_with_customer(e) {
    try {
        var myArray = JSON.parse(e);
        if (myArray[0].lat == "" || myArray[0].lat == undefined || myArray[0].lat == null) {
            var lat = 0;
        } else {
            var lat = myArray[0].lat;
        }
        if (myArray[0].lon == "" || myArray[0].lon == undefined || myArray[0].lon == null) {
            var long = 0;
        } else {
            var long = myArray[0].lon;
        }
        if (myArray[0].accuracy == "" || myArray[0].accuracy == undefined || myArray[0].accuracy == null) {
            var accuracy = 0;
        } else {
            var accuracy = myArray[0].accuracy;
        }

        try {
            lat = parseFloat(lat);
        } catch (e) {
            lat = 0;
        }
        try {
            long = parseFloat(long);
        } catch (e) {
            long = 0;
        }
        try {
            accuracy = parseFloat(accuracy);
        } catch (e) {
            accuracy = 0;
        }

        var radius = JSON.parse(storage.getItem('user_radius'));
        send_user_lat_long_customer(lat, long, accuracy, radius);
    }
    catch (e) {
        send_user_lat_long_customer(0, 0, 0, radius);
    }
}

function onfail_get_latlong_for_task_with_customer(e) { }

function onfail_get_customer_list_from_task_create(e) {
    alert1(e + '_onfail_get_list_of_pm_sites()');
    $("#popup_cust_list").empty();
    var list_item = '<li><a href="#" class="item-link item-content"><div class="item-inner item-no-pad"><div class="item-title">Network Error! Slide Down To Refresh !</div></div></a></li>';
    $("#popup_cust_list").append(list_item);
    loading_hide();
}

function redirect_to_edit_customer_form(t_cust_id) {
    localStorage.setItem('ID_useType22', t_cust_id);
    localStorage.setItem("is_new_customer_click", "false");
    localStorage.setItem("edit_customer_id", t_cust_id);
    changeurl('viewsitedata_task.html');
}

function get_edit_customer_checksheet() {
    try {
        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var cust_checksheet_id = list_data[0].customer_checksheet_id;
        localStorage.setItem('check_type_customer', cust_checksheet_id);
        if (cust_checksheet_id == "" || cust_checksheet_id == null || cust_checksheet_id == undefined) {
            cust_checksheet_id = "";
            alert1("Please add customer checksheet id...");
        }
        else {
            loading();
            var company_id = JSON.parse(storage.getItem('company_id'));
            var edit_cust_id = localStorage.getItem("edit_customer_id");

            var Param_obj = [];
            Param_obj.push({
                'CustomerId': edit_cust_id,
                'Company_id': company_id,
                'checksheet_id': cust_checksheet_id
            });

            var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_Search_Customer_Master_And_Sub', JSON.stringify(Param_obj), onsuccess_get_edit_customer_checksheet, onfail_get_edit_customer_checksheet);
            getdata.callOtherDomain();
        }

    }
    catch (e) {
        alert1(e + '_get_edit_customer_checksheet');
    }
}

function onsuccess_get_edit_customer_checksheet(e) {
    try {
        var Task_json = e.responseText;
        Task_json = Task_json.replace('[ [', '[');
        Task_json = Task_json.replace('] ]', ']');
        Task_json = eval('(' + Task_json + ')');
        var status = Task_json[0].status;
        var message = Task_json[0].message;

        if (status == 1) {
            var data = Task_json[0].data;
            if (data == "" || data == null || data == undefined) {
                message = eval('(' + message + ')');
            }
            else {
                message = JSON.parse(data);
            }

            var checksheet_id = message[0].checksheet_id;
            var Data = message[0].CustomerData;
            Data = eval('(' + Data + ')');

            read_dynamic_surveydata("", checksheet_id, 1, Data, "", 7, 0);
        }
    }
    catch (e) {
        loading_hide();
        alert1(e + '_onsuccess_get_edit_customer_checksheet');
    }
}

function onfail_get_edit_customer_checksheet(e) {
    loading_hide();
    alert1(e + '_get_edit_customer_checksheet');
}


function submit_customer_edited_data() {
    try {
        return validate_and_submit_surveydata(1, 7, jsonObj_cust_add);
    } catch (e) {
        alert1(e + "_submit_customer_edited_data");
    }
    return false;
}

function update_cutomer_edit_from_cust_listing(t_jsonObj) {
    try {
        var company_id = JSON.parse(storage.getItem('company_id'));
        var user_id = JSON.parse(storage.getItem('user_id'));
        var checksheet_id = localStorage.getItem('check_type_customer');

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

        var Param_obj = [];
        Param_obj.push({
            'CustomerUniqId': "",
            'Company_id': company_id,
            'Subcategory': "",
            'Step_id': 1,
            'StepNo': 1,
            'checksheet_id': checksheet_id,
            'Status': 0,
            'Data': t_jsonObj,
            'button': [],
            'createby': user_id,
            'UpdatedBy': user_id,
            "checksheet_type": 3,
            'photo_temp': Photo_Id_Array,
            'Check_User_Upadte_Or_Create': "Update"
        });

        loading();
        var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_insert_Customer_Master_And_Sub_Type', JSON.stringify(Param_obj), onsucess_update_cutomer_edit_from_cust_listing, onfail_update_cutomer_edit_from_cust_listing);
        getdata.callOtherDomain();
    } catch (e) {
        alert1(e + "_update_cutomer_edit_from_cust_listing");
    }
}

function onsucess_update_cutomer_edit_from_cust_listing(e) {
    try {
        var Suc_Message = e.responseText;
        Suc_Message = eval('(' + Suc_Message + ')');
        var status = Suc_Message[0].status;
        var message = Suc_Message[0].message;
        loading_hide();

        if (status == 1) {
            alert1("Customer Updated successfully !");
            changeurl("viewcustomerlist_on.html");
        }
        else {
            alert1(message);
        }
    }
    catch (e) {
        loading_hide();
        alert1(e + '_update_cutomer_edit_from_cust_listing');
    }
}

function onfail_update_cutomer_edit_from_cust_listing(e) {
    loading_hide();
    alert1(e + '_onfail_update_cutomer_edit_from_cust_listing');
}

//////////////////---------------customer photo upload using flow.js-----------/////////////////////
var flowParamData = [], Photo_Id_Array = [];
var selected_filename;


///------------***************-----------------
//function init_upload_doc(t_new_id, t_que_id, t_web_ext) {
//    try {
//        var date_s = new Date();
//        var time = date_s.getTime();
//        var company_id = JSON.parse(storage.getItem('company_id'));
//        var user_id = JSON.parse(storage.getItem('user_id'));
//        var file_name = company_id + "_" + user_id + "_" + time;

//        //var browser = get_browser_info();
//        //var browser_name = (browser.name).trim();
//        var browser_name = "Mobile App";

//        if (global_url == 'http://oneatcpv.skyproductivity.com/services/') {
//            var r = new Flow({ target: 'http://oneatcfileupload.skyproductivity.com/Api/FlowUpload', testChunks: true });
//        }
//        else if (global_url == 'http://oneatctesting.skyproductivity.com/App/Services/') {
//            var r = new Flow({ target: 'http://atcresumable.skyproductivity.com/Api/FlowUpload', testChunks: true });
//        }
//        else if (global_url == 'http://atcmultirole.skyproductivity.com/WEB/services/') {
//            var r = new Flow({ target: 'http://atcmultirole.skyproductivity.com/API/Api/FlowUpload', testChunks: true });
//        }
//        else if (global_url == 'https://metal.easyform.in/APP/services/') {
//            var r = new Flow({ target: 'https://metal.easyform.in/api/Api/FlowUpload', testChunks: true });
//        }
//        else {
//            //var r = new Flow({ target: 'http://wipro.resumable.easyform.in/Api/FlowUpload', testChunks: true });
//            var r = new Flow({ target: 'https://securityapp.easyform.in/api/Api/FlowUpload', testChunks: true });
//        }

//        //var r = new Flow({ target: global_resumable_url, testChunks: true });
//        var progressBar = new ProgressBar($('#up_progress_' + t_new_id + ''));

//        r.assignBrowse(document.getElementById('up_add_' + t_new_id + ''));
//        r.assignDrop(document.getElementById('div_drop_' + t_new_id + ''));

//        $('#up_resume_' + t_new_id + '').click(function () {
//            if (browser_name == "IE") {
//                var t_new_id = progressBar.thisEle[0].attributes[3].value;
//            }
//            else {
//                var t_new_id = progressBar.thisEle[0].attributes[2].value;
//            }

//            $('#up_pause_' + t_new_id + '').show();
//            $("#up_resume_" + t_new_id + "").hide();
//            r.resume();
//        });

//        $('#up_cancel_' + t_new_id + '').click(function () {
//            if (browser_name == "IE") {
//                var t_new_id = progressBar.thisEle[0].attributes[3].value;
//            }
//            else {
//                var t_new_id = progressBar.thisEle[0].attributes[2].value;
//            }

//            //$('#up_progress_' + t_new_id + '').find('.progressbar-infinite').css('width', '0%');
//            $('#up_progress_' + t_new_id + '').hide();
//            $("#lbl_up_info_" + t_new_id + "").html('');
//            $("#up_add_" + t_new_id + "").show();
//            $("#up_pause_" + t_new_id + "").hide();
//            $("#up_resume_" + t_new_id + "").hide();
//            $("#up_cancel_" + t_new_id + "").hide();
//            r.cancel();
//            r.removeFile();
//        });

//        $('#up_another_' + t_new_id + '').click(function () {
//            var user_choice = confirm("Are you sure you want to replace this file ?");
//            if (user_choice == true) {
//                if (browser_name == "IE") {
//                    var t_new_id = progressBar.thisEle[0].attributes[3].value;
//                }
//                else {
//                    var t_new_id = progressBar.thisEle[0].attributes[2].value;
//                }

//                $("#div_up_main_" + t_new_id + "").show();
//                $("#dv_up_done_" + t_new_id + "").hide();

//                //$('#up_progress_' + t_new_id + '').find('.progressbar-infinite').css('width', '0%');
//                $('#up_progress_' + t_new_id + '').hide();
//                $("#lbl_up_info_" + t_new_id + "").html('');
//                $("#up_add_" + t_new_id + "").show();
//                $("#up_pause_" + t_new_id + "").hide();
//                $("#up_resume_" + t_new_id + "").hide();
//                $("#up_cancel_" + t_new_id + "").hide();
//                $("#cbtn_" + t_new_id + "").hide();
//                r.cancel();
//                r.removeFile();
//            }
//        });

//        $('#up_pause_' + t_new_id + '').click(function () {
//            if (browser_name == "IE") {
//                var t_new_id = progressBar.thisEle[0].attributes[3].value;
//            }
//            else {
//                var t_new_id = progressBar.thisEle[0].attributes[2].value;
//            }

//            $("#up_pause_" + t_new_id + "").hide();
//            $("#up_resume_" + t_new_id + "").show();
//            if (r.files.length > 0) {
//                if (r.isUploading()) {
//                    return r.pause();
//                }
//                return r.upload();
//            }
//        });

//        r.on('filesSubmitted', function (file, event) {
//            try {
//                var old_file_name = file[0].name;
//                var ext = old_file_name.split('.').pop();

//                if (t_web_ext == '' || t_web_ext == null || t_web_ext == undefined) {
//                    var match = 1;
//                }
//                else {
//                    var ext_array = t_web_ext.split(",");
//                    var match = 0;
//                    for (i = 0; i < ext_array.length; i++) {
//                        var t_ext = "." + ext;
//                        var t_ext_act = "." + ext;
//                        if (t_ext == ".jpg" || t_ext == ".jpeg" || t_ext == ".png" || t_ext == ".PNG") {
//                            t_ext = 'image';
//                        }
//                        else if (t_ext == ".avi" || t_ext == ".flv" || t_ext == ".wmv" || t_ext == ".mov" || t_ext == ".mp4" || t_ext == ".3gp") {
//                            t_ext = 'video';
//                        }
//                        if (t_ext == ext_array[i] || t_ext_act == ext_array[i]) {
//                            match = match + 1;
//                            break;
//                        }
//                    }
//                }

//                if (match > 0) {
//                    r.upload();
//                }
//                else {
//                    r.cancel();
//                    r.removeFile();
//                }
//            }
//            catch (e) {
//                alert1(e + '_filesSubmitted');
//            }
//        });

//        r.on('fileAdded', function (file, event) {
//            try {
//                selected_filename = file.name;
//                var old_file_name = file.name;
//                var ext = old_file_name.split('.').pop();

//                if (t_web_ext == '' || t_web_ext == null || t_web_ext == undefined) {
//                    var match = 1;
//                }
//                else {
//                    var ext_array = t_web_ext.split(",");
//                    var match = 0;
//                    for (i = 0; i < ext_array.length; i++) {
//                        var t_ext = "." + ext;
//                        var t_ext_act = "." + ext;
//                        if (t_ext == ".jpg" || t_ext == ".jpeg" || t_ext == ".png" || t_ext == ".PNG") {
//                            t_ext = 'image';
//                        }
//                        else if (t_ext == ".avi" || t_ext == ".flv" || t_ext == ".wmv" || t_ext == ".mov" || t_ext == ".mp4" || t_ext == ".3gp") {
//                            t_ext = 'video';
//                        }
//                        if (t_ext == ext_array[i] || t_ext_act == ext_array[i]) {
//                            match = match + 1;
//                            break;
//                        }
//                    }
//                }

//                if (match > 0) {
//                    if (browser_name == "IE") {
//                        var t_new_id = progressBar.thisEle[0].attributes[3].value;
//                    }
//                    else {
//                        var t_new_id = progressBar.thisEle[0].attributes[2].value;
//                    }

//                    $("#up_add_" + t_new_id + "").hide();
//                    $("#up_pause_" + t_new_id + "").show();
//                    $("#up_cancel_" + t_new_id + "").show();
//                    $('#up_progress_' + t_new_id + '').show();

//                    var curr_file_size = file.size;                                     //file size in byte
//                    var curr_file_size_mb = (curr_file_size / 1048576);                    //byte to MB conversion

//                    var total_size = file.size;                                     //file size in byte
//                    total_size = formatBytes(total_size);
//                    var info_str = file.name + ' (' + total_size + ')';
//                    $("#lbl_up_info_" + t_new_id + "").text(info_str);

//                    var date_s = new Date();
//                    var time = date_s.getTime();
//                    var company_id = JSON.parse(storage.getItem('company_id'));
//                    var user_id = JSON.parse(storage.getItem('user_id'));
//                    file_name = company_id + "_" + user_id + "_" + time;

//                    file.name = file_name + "." + ext;
//                    file_name = file.name;

//                    progressBar.fileAdded();

//                    var siteid = JSON.parse(storage.getItem('siteid'));
//                    if (siteid == '' || siteid == null || siteid == undefined) {
//                        siteid = '0';
//                    }

//                    var server_task_id = JSON.parse(storage.getItem('server_task_id'));
//                    if (server_task_id == '' || server_task_id == null || server_task_id == undefined) {
//                        server_task_id = '0';
//                    }
//                    storage.setItem('server_task_id', JSON.stringify(server_task_id));

//                    if (curr_clps_new_id != 0) {
//                        check_type = collapse_Json[0].checksheet_id;
//                        if (check_type == '' || check_type == null || check_type == undefined) {
//                            var check_type = localStorage.getItem('check_type_customer');
//                            if (check_type == '' || check_type == null || check_type == undefined) {
//                                check_type = '0';
//                            }
//                        }
//                    }
//                    else {
//                        var check_type = localStorage.getItem('check_type_customer');
//                        if (check_type == '' || check_type == null || check_type == undefined) {
//                            check_type = '0';
//                        }
//                    }

//                    check_type = check_type.replace(/['"]+/g, '');
//                    check_type = parseInt(check_type);
//                    server_task_id = server_task_id.replace(/['"]+/g, '');
//                    server_task_id = parseInt(server_task_id);
//                    siteid = siteid.replace(/['"]+/g, '');
//                    siteid = parseInt(siteid);

//                    // added on 25032019
//                    var type22_popup = $('#popup_inner_div_type22:visible');
//                    if (type22_popup.length > 0) {
//                        //$("#popover_viewphoto").parent().hide();

//                        var type22_img_que_id = storage.getItem('img_id_type22');
//                        //if (type22_current_mode == 'edit') {
//                        if (type22_edit_flag == '1') {
//                            // edit mode
//                            var t_row_index_no = row_index_no;
//                        }
//                        else {
//                            //  insert mode
//                            var row_counter = $("#hdn_inv_row_counter_" + type22_new_id + "").val();
//                            row_counter = parseInt(row_counter);
//                            var t_row_index_no = row_counter + 1;
//                        }
//                    }
//                    else {
//                        var type22_img_que_id = 0;
//                        var t_row_index_no = 0;
//                    }

//                    var step = curr_survey_data["step"];
//                    if (step == '' || step == null || step == undefined) {
//                        step = '1';
//                    }

//                    flowParamData = [];
//                    flowParamData.push({
//                        company_id: company_id,
//                        site_id: siteid,
//                        sid: server_task_id,
//                        que_id: t_que_id,
//                        checksheetid: check_type,
//                        step_No: step,
//                        Ph_id: type22_img_que_id,
//                        th_path: '',
//                        // size: this.fileObjSize,
//                        size: total_size,
//                        type: ext,
//                        it_id: t_row_index_no
//                    });
//                    //////
//                }
//                else {
//                    alert1("This file is not accessible! Allowed extentions are " + t_web_ext + "");

//                    if (browser_name == "IE") {
//                        var t_new_id = progressBar.thisEle[0].attributes[3].value;
//                    }
//                    else {
//                        var t_new_id = progressBar.thisEle[0].attributes[2].value;
//                    }

//                    //$('#up_progress_' + t_new_id + '').find('.progressbar-infinite').css('width', '0%');
//                    $('#up_progress_' + t_new_id + '').hide();
//                    $("#lbl_up_info_" + t_new_id + "").html('');
//                    $("#up_add_" + t_new_id + "").show();
//                    $("#up_pause_" + t_new_id + "").hide();
//                    $("#up_resume_" + t_new_id + "").hide();
//                    $("#up_cancel_" + t_new_id + "").hide();
//                    r.cancel();
//                    r.removeFile();
//                }
//            }
//            catch (e) {
//                alert1(e + '_fileAdded');
//            }
//        });

//        r.on('fileSuccess', function (file, message) {
//            progressBar.finish();
//        });

//        r.on('progress', function () {
//            try {
//                if (browser_name == "IE") {
//                    var t_new_id = progressBar.thisEle[0].attributes[3].value;
//                }
//                else {
//                    var t_new_id = progressBar.thisEle[0].attributes[2].value;
//                }

//                var file_name = r.files[0].file.name;
//                var total_size = r.files[0].file.size;
//                total_size = formatBytes(total_size);
//                var speed = r.files[0].currentSpeed;
//                speed = formatBytes(speed);
//                var uploaded_size = r.sizeUploaded();
//                uploaded_size = formatBytes(uploaded_size);
//                var remaining_time = r.timeRemaining();

//                var info_str = '<b style="color:gray">' + file_name + '</b> ' + speed + '/s - ' + uploaded_size + ' of ' + total_size + ', ' + remaining_time + ' secs left';
//                $("#lbl_up_info_" + t_new_id + "").html(info_str);
//                progressBar.uploading(r.progress() * 100);
//            }
//            catch (e) {
//                alert1(e + '_progress');
//            }
//        });

//        r.on('pause', function () {
//            // $('#up_pause').find('.glyphicon').removeClass('glyphicon-pause').addClass('glyphicon-play');
//        });

//        function ProgressBar(ele) {
//            try {

//                this.thisEle = $(ele);
//                this.fileAdded = function () {
//                    (this.thisEle).removeClass('hide').find('.progress-bar').css('width', '0%');
//                },

//                    this.uploading = function (progress) {
//                        (this.thisEle).find('.progress-bar').attr('style', "width:" + progress + '%');
//                    },

//                    this.finish = function () {
//                        (this.thisEle).addClass('hide').find('.progress-bar').css('width', '0%');

//                        if (browser_name == "IE") {
//                            var t_new_id = progressBar.thisEle[0].attributes[3].value;
//                        }
//                        else {
//                            var t_new_id = progressBar.thisEle[0].attributes[2].value;
//                        }

//                        storage.setItem('up_new_id', JSON.stringify(t_new_id));
//                        $("#div_up_main_" + t_new_id + "").hide();
//                        $("#dv_up_done_" + t_new_id + "").show();

//                        var t_file_size = r.files[0].file.size;
//                        var t_file_size_mb = (t_file_size / 1048576);                     //byte to MB conversion
//                        var all_file_size_mb = all_file_size_mb + t_file_size_mb;

//                        var doc_type = $("#div_up_main_" + t_new_id + "").attr('type');
//                        if (doc_type == 7) {
//                            storage.setItem('siteid', 0);

//                            var ele_id = 'cbtn_' + t_new_id + '';
//                            var p_name = r.files[0].name;

//                            Unavailable_Img_Array = [];
//                            Unavailable_Img_Array.push({
//                                'ele_id': ele_id,
//                                'p_name': p_name
//                            });

//                            var thumb_img_str = selected_filename + " Successfully Uploaded!";

//                            $("#hdn_upload_cam_" + t_new_id + "").val(p_name);
//                            $("#hdn_upload_cam_" + t_new_id + "").attr('name', p_name);

//                            get_base64_from_server(Unavailable_Img_Array);
//                        }
//                        else {
//                            var thumb_img_str = selected_filename + " Successfully Uploaded!";

//                        }

//                        var file_name = r.files[0].file.name;
//                        $("#hdn_upload_doc_" + t_new_id + "").val(file_name);

//                        if (Photo_Id_Array.length > 0) {
//                            var curr_file_size = r.files[0].file.size;                               //file size in byte
//                            var curr_file_size_mb = (curr_file_size / 1048576);                    //byte to MB conversion
//                            var photo_id = Photo_Id_Array[Photo_Id_Array.length - 1].photo_id;
//                            $("#hdn_upload_doc_" + t_new_id + "").attr('photo_id', photo_id);
//                            $("#hdn_upload_doc_" + t_new_id + "").attr('photo_size', curr_file_size_mb);

//                            $("#hdn_upload_cam_" + t_new_id + "").attr('photo_id', photo_id);
//                            $("#hdn_upload_cam_" + t_new_id + "").attr('photo_size', curr_file_size_mb);
//                        }

//                        $("#dv_up_done_" + t_new_id + "").find("label").html(thumb_img_str);
//                    }

//            }
//            catch (e) {
//                alert1(e + '_ProgressBar');
//            }
//        }
//    }
//    catch (e) {
//        alert1(e + '_init_upload_doc()');
//    }
//}

//function formatBytes(bytes) {
//    if (bytes < 1024) return bytes + " Bytes";
//    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
//    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + " MB";
//    else return (bytes / 1073741824).toFixed(1) + " GB";
//};

//////////////////---------------customer photo upload using flow.js-----------/////////////////////
