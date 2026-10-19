

// get page details
function get_target_ui_for_same_page() {
    var company_id = JSON.parse(storage.getItem('company_id'));

    var Param_obj = [];
    Param_obj.push({
        'Page_Name': "Customer_User_Page.aspx",
        'Company_id': company_id,
        'feature_id': feature_id
    });

    loading();
    var getdata = new Webservicecall_REST(global_wcf_url + 'Wcf_Get_Page_Detail_info_Feature_WithId', JSON.stringify(Param_obj), onsuccess_get_target_ui_for_same_page, onfail_request);
    getdata.callOtherDomain();

    function onsuccess_get_target_ui_for_same_page(e) {
        var myArray = JSON.parse(e.responseText);
        var status = myArray[0].status;
        if (status == 1) {
            var data_Str = JSON.parse(myArray[0].data)
            var message = JSON.parse(data_Str[0].str);
            for (i = 0; i < message.length; i++) {
                var key = message[i].Key;
                var Value = message[i].Value;
                if (key == "Target_UI") {
                    var target_ui = message[i].Value;
                    if (target_ui == "User") {
                        get_user_checksheet();
                    }
                }
                else if (key == "Delete") {
                    Delete_Button = Value;
                }
                else if (key == "Edit") {
                    Edit_Button = Value;
                }
                else if (key == "Map") {
                    Map_Button = Value;
                }

                else if (key == "UnBlock") {
                    UnBlock_Button = Value;
                }

                else if (key == "ViewForm") {
                    View_form = Value;

                    // display create user button
                    if (View_form.toLowerCase() == "create" || View_form.toLowerCase() == "both") {
                        $("#btn_AddUser").show();
                    }
                }
                else if (key == "FlowData") {
                    attendance_flow_id = Value[0];
                    attendance_flow_name = Value[1];
                    attendance_checksheet_id = Value[2];
                }
            }

        }
        else {
            loading_hide();
        }
    }
}

// get user checksheet
function get_user_checksheet() {
    var company_id = JSON.parse(storage.getItem('company_id'));

    var Param_obj = [];
    Param_obj.push(
        {
            'key': 'cm_IsDelete',
            'value': 0
        },
        {
            'key': 'ffm_IsDelete',
            'value': 0
        },
        {
            'key': 'ffm_flow_id',
            'value': 0
        },
        {
            'key': 'cm_company_id',
            'value': company_id
        },
        {
            'key': 'cfm_company_feature_id',
            'value': feature_id
        });

    loading();
    var getdata = new Webservicecall_REST(global_wcf_url + 'Common/ChecksheetWithNormal', JSON.stringify(Param_obj), function (e) {
        var checksheet_Master = e.responseText;
        checksheet_Master = eval('(' + checksheet_Master + ')');
        var message = checksheet_Master[0].data;
        var status = checksheet_Master[0].status;
        if (status == 1) {
            message = eval('(' + message + ')');
            checksheet_id = message[0].id;           // user checksheet
            storage.setItem('check_type', JSON.stringify(checksheet_id));
            localStorage.setItem('check_type_user', checksheet_id);

            get_filter_checksheet();
        }
        else {
            alert1(message);
            loading_hide();
        }
    }, onfail_request);
    getdata.callOtherDomain();
}

// get filter checksheet
function get_filter_checksheet() {
    var company_id = JSON.parse(storage.getItem('company_id'));

    var Param_obj = [];
    Param_obj.push(
        {
            'key': 'cm_IsDelete',
            'value': 0
        },
        {
            'key': 'ffm_IsDelete',
            'value': 0
        },
        {
            'key': 'ffm_flow_id',
            'value': 0
        },
        {
            'key': 'cm_company_id',
            'value': company_id
        },
        {
            'key': 'cm_checksheet_type_id',
            'value': 9
        },
        {
            'key': 'cfm_company_feature_id',
            'value': feature_id
        });

    loading();
    var getdata = new Webservicecall_REST(global_wcf_url + 'Common/ChecksheetWithFilter', JSON.stringify(Param_obj), function (e) {
        var checksheet_Master = e.responseText;
        checksheet_Master = eval('(' + checksheet_Master + ')');
        var message = checksheet_Master[0].data;
        var status = checksheet_Master[0].status;
        if (status == 1) {
            message = eval('(' + message + ')');
            filter_checksheet_id = message[0].id;              // filter checksheet

            //get_filter_condition();

            get_user_list_by_supervisor();
        }
        else {
            alert1(message);
            loading_hide();
        }
    }, onfail_request);
    getdata.callOtherDomain();
}

// get filter condition
var user_filter_checksheet_data;
function get_filter_condition() {
    try {
        myApp.popup('.popup-filter-user');

        var company_id = JSON.parse(storage.getItem('company_id'));

        var Getchecksheetdata = [];
        Getchecksheetdata.push({
            Checksheet_type_id: 9,
            Company_id: company_id,
            Checksheet_id: filter_checksheet_id
        });

        loading();
        var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_GetdataForEditChecksheet', JSON.stringify(Getchecksheetdata), onsuccess_get_filter_condition, onfail_request);
        getdata.callOtherDomain();
    } catch (e) {
        alert1(e + '_view_user_filter_checksheet()');
        loading_hide();
    }
}
function onsuccess_get_filter_condition(e) {
    try {
        var result = e.responseText;
        var myData = eval('' + result + '');
        var status = myData[0].status;
        if (status == 1) {
            var data = myData[0].data;
            if (data == "" || data == null || data == undefined) {
                var myArray = myData[0].str[0].AllData;
                myArray = JSON.parse(myArray);
            }
            else {
                myData = JSON.parse(data);
                var myArray = myData[0].AllData;
                myArray = JSON.parse(myArray);
            }

            var check_type = myArray[0].step_data[0].Checksheet_id;
            var data = myArray[0].step_data[0].step[0].data;
            localStorage.setItem("checksheet_data", JSON.stringify(data));
            localStorage.setItem("checksheet_AllData", JSON.stringify(myArray));
            localStorage.setItem("checksheet_type_filter", '9');
            storage.setItem('checksheet_type_filter', JSON.stringify('9'));

            user_filter_checksheet_data = JSON.stringify(myArray);
            $("#container_div").empty();

            storage.setItem('check_type', JSON.stringify(check_type));
            read_dynamic_checksheet_main("", check_type, "", data, "", 9, 0);
        }
        else {
            var message = myData[0].message;
            alert1(message);
            loading_hide();
        }
    } catch (e) {
        alert1(e + '_onsuccess_view_user_filter_checksheet()');
        loading_hide();
    }
}
function submit_user_filter_form() {
    try {
        var arr = localStorage.getItem('checksheet_data');
        var AllData = localStorage.getItem('checksheet_AllData');
        var filter_button_Data = JSON.parse(user_filter_checksheet_data);
        localStorage.setItem('checksheet_AllData', JSON.stringify(filter_button_Data));

        validate_and_submit_surveydata_main(1, 9, JSON.parse(arr));

        if (Validation_True == 0) {
            myApp.closeModal('.popup-filter-user');
            var filter_button_Data = JSON.parse(localStorage.getItem('checksheet_AllData'));
            var Push_array = filter_button_Data[0].Push_array;
            get_user_list_data(Push_array);
        }
    } catch (e) {
        alert1(e + "_submit_user_filter_form()");
    }
}


// user listing
function get_user_list_by_supervisor() {
    var Push_array = [{ "value": "(*4*)", "type": "name", "sys_param": "", "ans": username }];
    get_user_list_data(Push_array);
}
function get_user_list_data(Push_array) {
    var company_id = JSON.parse(storage.getItem('company_id'));
    localStorage.setItem('company_feature_id', 23166);          //static for user listing

    //var Push_array = [{ "value": "(*7*)", "type": "name", "sys_param": "", "ans": "'bh.camp','ck.aadhar','ck.aadhar1','EMP_test002','EMP001','surbhitest','TESTCK001','TESTCK002','TESTCK003','TESTCK005','TESTCK006','TESTEMP001'" }]
    //var Push_array = [];

    var Param_obj = [];
    Param_obj.push({
        'Company_Id': company_id,
        "Checksheet_Id": filter_checksheet_id,
        "OFFSET": 0,
        "FETCH": 500,
        "Condition_Json": Push_array
    });

    loading();
    var getdata1 = new Webservicecall_REST(global_wcf_url + 'WCF_Find_ViewUser_SearchCondition', JSON.stringify(Param_obj), onsuccess_get_user_list_data, onfail_request);
    getdata1.callOtherDomain();
}
function onsuccess_get_user_list_data(invocation1) {
    try {
        var Search_data = invocation1.responseText;
        Search_data = eval('(' + Search_data + ')');
        var message = Search_data[0].message;
        var status = Search_data[0].status;
        if (status == 1) {
            message = message.replace('[[', '[');
            message = message.replace(']]', ']');
            message = eval('(' + Search_data[0].data + ')');

            var user_id = JSON.parse(storage.getItem('user_id'));
            $("#ul_UserList").empty();
            for (i = 0; i < message.length; i++) {
                var primary_id = message[i].UserID;
                var UserData = JSON.parse(message[i].UserData);

                var photo_name = '';
                for (j = 0; j < UserData.length; j++) {
                    var que_id = UserData[j].que_id;
                    if (que_id == 4008) {
                        var ans = UserData[j].ans;
                        if (ans == "" || ans == null || ans == undefined) {
                            // media_link = 'images/profile_pic.png';
                        }
                        else {
                            photo_name = ans[1];
                            //var random_str = "&random=" + new Date().getTime();
                            //media_link = "" + global_resumable_url + "api/GetFile/Select_File_Details?cid="
                            //    + checksheet_id + "&t22id=0&t22i=0&id=" + primary_id + "&qd=" + que_id + "&ctype=7&ud=" + user_id + "&uc=" + uniqcode + random_str + "";
                        }

                        break;
                    }
                }

                var random_str = "&random=" + new Date().getTime();
                //var media_link = "" + global_resumable_url + "api/GetFile/Select_File_Details?cid="
                //    + checksheet_id + "&t22id=0&t22i=0&id=" + primary_id + "&qd=4008&ctype=7&ud=" + user_id + "&uc=" + uniqcode + random_str + "";
                var media_link = "" + global_resumable_url + "GetFile/Select_File_Details?cid="
                    + checksheet_id + "&t22id=0&t22i=0&id=" + primary_id + "&qd=4008&ctype=7&ud=" + user_id + "&uc=" + uniqcode + random_str + "";

                var username = message[i].UserName;
                var adhar_verified = message[i].adhar_verified;
                var bank_verified = message[i].bank_verified;
                if (adhar_verified == "True") {
                    var aadhar_str = "Aadhar: <span style='color:green'>Verified</span>";
                }
                else {
                    var aadhar_str = "Aadhar: <span style='color:red'>Not Verified</span>";
                }
                if (bank_verified == "True") {
                    var bank_str = "Bank: <span style='color:green'>Verified</span>";
                }
                else {
                    var bank_str = "Bank: <span style='color:red'>Not Verified</span>";
                }


                var list_item = '<li id="user_' + primary_id + '" class="swipeout"><div class="swipeout-content item-content">';

                //var param = "mk_get_full_view_pic('" + media_link + "', '" + username + "')";
                var onerror_str = "onerror=this.src='images/profile_pic.png'";
                var param = "view_user_photo('" + media_link + "', '" + username + "')";
                list_item += '<div class="item-media"><img class="zoomable" src="' + media_link + '" ' + onerror_str + ' /></div>';

                var param = "select_user_for_verification('" + primary_id + "', '" + adhar_verified + "', '" + bank_verified + "')";
                list_item += '<div class="item-inner" onclick="' + param + '">';
                list_item += '<div class="item-title">' + username + '</div>';

                var param_remove_sub = "User_Delete_Popup('" + primary_id + "')";
                var param_info = "view_user_info('" + primary_id + "')";
                //list_item += '<div class="item-after"><input id="cal_' + primary_id + '" class="calendar" type="text" readonly><i class="fa fa-calendar"></i><i class="fa fa-times-circle" onclick ="' + param_remove_sub + '"></i></div>';
                list_item += '<div class="item-after"><table><tr><td><input id="cal_' + primary_id + '" class="calendar" type="text" readonly></td><td><i class="fa fa-info-circle" onclick ="' + param_info + '"></i></td><td><i class="fa fa-times-circle" onclick ="' + param_remove_sub + '"></i></td></tr></table></div>';
                list_item += '<div class="item-text">' + aadhar_str + ' <br> ' + bank_str + '</div>';
                list_item += '</div></div>';

                var remove_str = '<a href="#" class="swipeout-delete" onclick ="' + param_remove_sub + '">Delete</a>';
                list_item += '<div class="swipeout-actions-right" style="right: 0% !important;">';
                list_item += remove_str;
                list_item += '</div>';

                var info_str = '<a href="#" onclick ="' + param_info + '">Info</a>';
                list_item += '<div class="swipeout-actions-left">';
                list_item += info_str;
                list_item += '</div>';

                var t_json = JSON.stringify(UserData);
                t_json = encodeURIComponent(t_json);
                list_item += '<input type="hidden" id="hdn_' + primary_id + '" value="' + t_json + '" >';

                list_item += '</li>';
                $("#ul_UserList").append(list_item);

                //var today = new Date();
                //var weekLater = new Date().setDate(today.getDate() + 7);
                //myApp.calendar({
                //    input: 'cal_' + primary_id + '',
                //    dateFormat: 'M dd yyyy',
                //    events: {
                //        from: today,
                //        to: weekLater
                //    }
                //});

                myApp.calendar({
                    id: primary_id,
                    username: username,
                    photo_name: photo_name,
                    photo_url: media_link,
                    input: '#cal_' + primary_id + '',
                    dateFormat: 'mm/dd/yyyy',
                    onOpen: function (cal) {
                        var curr_month = cal.currentMonth;
                        var curr_year = cal.currentYear;
                        var t_user_id = cal.params.id;
                        var t_username = cal.params.username;
                        var t_photo_name = cal.params.photo_name;
                        var t_photo_url = cal.params.photo_url;

                        if (t_photo_url == "images/profile_pic.png") {
                            cal.close();
                            alert1("Required profile picture for this user to fill attendance!");
                        }
                        else {
                            get_user_attendance(t_user_id, t_username, t_photo_name, t_photo_url, curr_month, curr_year);
                        }
                    },
                    onMonthYearChangeStart: function (cal) {
                        var curr_month = cal.currentMonth;
                        var curr_year = cal.currentYear;
                        var t_user_id = cal.params.id;
                        var t_username = cal.params.username;
                        var t_photo_name = cal.params.photo_name;
                        var t_photo_url = cal.params.photo_url;
                        get_user_attendance(t_user_id, t_username, t_photo_name, t_photo_url, curr_month, curr_year);
                    }
                });
            }

            $('.swipeout-delete').click(function (event) {
                event.stopPropagation();
            });

            $('.fa-info-circle').click(function (event) {
                event.stopPropagation();
            });

            $('.calendar').click(function (event) {
                event.stopPropagation();
            });

            $('.fa-calendar').click(function (event) {
                event.stopPropagation();
            });

            $('.fa-times-circle').click(function (event) {
                event.stopPropagation();
            });

            Zoom(".zoomable");
            enable_back_button();

            setTimeout(function () {
                myApp.swipeoutOpen($('#ul_UserList li.swipeout').eq(0));

                setTimeout(function () {
                    myApp.swipeoutClose($('#ul_UserList li.swipeout').eq(0));
                }, 700);
            }, 1000);

            loading_hide();
        }
        else {
            alert1(message);
            loading_hide();
        }
    }
    catch (e) {
        loading_hide();
        alert1(e + '_onsucess_get_user_data()');
    }
}

// view user info
function view_user_info(t_user_id) {
    myApp.popup('.popup-user-info');

    var d_json_parse = $("#hdn_" + t_user_id + "").val();
    d_json_parse = JSON.parse(decodeURIComponent(d_json_parse));
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
}


// redirection to aadhar & bank
function select_user_for_verification(u_id, adhar_verified, bank_verified) {
    localStorage.setItem("aadhar_user_id", u_id);
    localStorage.setItem('adhar_verified', adhar_verified);
    localStorage.setItem('bank_verified', bank_verified);

    if (adhar_verified == "True") {
        if (bank_verified == "True") {
            alert1("Aadhar and bank details are already verified.");
        }
        else {
            // For Bank
            changeurl("EF_Account_Verification.html");
        }
    }
    else {
        // For Aadhar
        changeurl("EF_Aadhar_Verification.html");
    }
}


// View Attendanace in calendar
function get_user_attendance(t_user_id, t_username, t_photo_name, t_photo_url, curr_month, curr_year) {

    if (t_photo_url == "images/profile_pic.png") {
        alert1("Required profile picture for this user to fill attendance!");
    }
    else {
        $("div").removeClass("picker-calendar-day-has-events");

        $("#btn_Add_Attendance").remove();

        if (attendance_flow_id == "" || attendance_flow_id == null || attendance_flow_id == undefined) {
            alert("Attendance flow id is not found in Attendance JSON!");
        }
        else {
            var param_obj = [];
            param_obj.push({
                "Flow_id": attendance_flow_id,
                "User_id": t_user_id,
                "Month": curr_month + 1,
                "Year": curr_year
            });

            loading();
            var getdata = new Webservicecall_REST(global_wcf_url + 'Get_Attendance', JSON.stringify(param_obj), function (e) {
                var res_text = e.responseText;
                var result = eval('(' + res_text + ')');
                var message = result[0].message;

                var d = new Date();
                var today_date = d.getDate();
                var t_curr_month = d.getMonth();
                var t_curr_year = d.getFullYear();

                var status = result[0].status;
                if (status == 1) {
                    var data = result[0].data;
                    var d_Array = JSON.parse(data);


                    var today_atnd_found = 0;
                    for (i = 0; i < d_Array.length; i++) {
                        var d = new Date(d_Array[i].AssignDate).getDate();
                        $("div[data-year=" + curr_year + "][data-month=" + curr_month + "][data-day=" + d + "]").addClass("picker-calendar-day-has-events");

                        if (d == today_date) {
                            today_atnd_found++;
                        }
                    }

                    if (today_atnd_found == 0 && curr_month == t_curr_month && curr_year == t_curr_year) {
                        // display add attendance if not found for today
                        var param_attendance = "add_attendance('" + t_user_id + "', '" + t_username + "', '" + t_photo_name + "', '" + t_photo_url + "', '" + curr_month + "')";
                        $(".picker-footer").append('<a id="btn_Add_Attendance" onclick ="' + param_attendance + '" href="#" class="button">Add Attendance</a>');
                    }

                }
                else if (status == 2) {
                    if (curr_month == t_curr_month && curr_year == t_curr_year) {
                        // display add attendance if not found for today
                        var param_attendance = "add_attendance('" + t_user_id + "', '" + t_username + "', '" + t_photo_name + "', '" + t_photo_url + "', '" + curr_month + "')";
                        $(".picker-footer").append('<a id="btn_Add_Attendance" onclick ="' + param_attendance + '" href="#" class="button">Add Attendance</a>');
                    }
                }
                else {
                    alert1("Server: " + message)
                }
                loading_hide();
            }, onfail_request);
            getdata.callOtherDomain();
        }
    }
}

// add today's attendance
function add_attendance(t_user_id, t_username, t_photo_name, t_photo_url, curr_month) {
    var q_jsonobj = [];
    q_jsonobj.push({
        "attendanceData": {
            "username": t_username,
            "userId": t_user_id,
            "moduleId": attendance_flow_id,
            "checkSheetId": attendance_checksheet_id,
            "moduleName": attendance_flow_name
        },
        "photoUrl": t_photo_url,
        "photoName": t_photo_name
    });

    loading();
    cordova.exec(function (e) {

        alert1("Attendance has been added successfully!");
        var d = new Date().getDate();
        $("div[data-month=" + curr_month + "][data-day=" + d + "]").addClass("picker-calendar-day-has-events");
        loading_hide();

    }, function (e) {
        // back from attendance camera back
        if (e == "" || e == null || e == undefined) { }
        else {
            alert1("Device: " + e);
        }
        loading_hide();
    }, 'AttendancePlugin', 'anAction', q_jsonobj);
}


// create user
var glob_user_json;
function get_blank_checksheet_from_server_create_user() {
    try {
        myApp.popup('.popup-create-user');

        loading();
        var company_id = JSON.parse(storage.getItem('company_id'));
        var user_id = JSON.parse(storage.getItem('user_id'));

        var param_obj = [];
        param_obj.push({
            'Company_Id': company_id,
            'User_Id': user_id,
            'checksheetid': checksheet_id,
            'step': 1,
            'trip_id': 0
        });

        var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_GetCheckSheetData_Port', JSON.stringify(param_obj), onsuccess_get_blank_checksheet_from_server_create_user, onfail_request);
        getdata.callOtherDomain();
    } catch (e) {
        alert1(e + '_get_blank_checksheet_from_server_create_user()');
        loading_hide();
    }
}
function onsuccess_get_blank_checksheet_from_server_create_user(e) {
    try {
        var responseText = JSON.parse(e.responseText);
        var status = responseText[0].status;
        if (status == 1) {
            var myArray = JSON.parse(responseText[0].data);
            if (myArray.length > 0) {
                var heading = myArray[0].subcategory;
                var check_type = myArray[0].checksheetid;
                var step = myArray[0].step;
                var data = itemObj._checkStrObj(myArray[0].data);
                var buttons = itemObj._checkStrObj(myArray[0].buttons);

                storage.setItem('checksheet_type_filter', JSON.stringify('1'));

                storage.setItem('check_type', JSON.stringify(check_type));
                read_dynamic_checksheet_main(heading, check_type, step, data, buttons, 8, 0);
            }
        }
        else {
            var message = responseText[0].message;
            alert1(message);
            loading_hide();
        }
    } catch (e) {
        alert1(e + '_onsuccess_get_blank_checksheet_from_server_create_user');
        loading_hide();
    }
}
function submit_user_form() {
    try {
        var password = document.getElementById('txt_0_' + checksheet_id + '_5').value;
        var retype_password = document.getElementById('txt_0_' + checksheet_id + '_10018').value;
        if (password == retype_password) {
            return validate_and_submit_surveydata(1, 8, jsonObj_user_add);
        }
        else {
            alert1("Password and Retype-password are not matched!");
            loading_hide();
        }
    } catch (e) {
        alert1(e + "_submit_user_form");
    }
    return false;
}
function add_new_user_from_user_listing(t_jsonObj) {
    loading();
    var company_id = JSON.parse(storage.getItem('company_id'));
    var user_id = JSON.parse(storage.getItem('user_id'));
    var checksheet_id = localStorage.getItem('check_type_user');

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
        "checksheet_type": 7,
        'photo_temp': Photo_Id_Array
    });

    var user_data_json = t_jsonObj;
    for (var t = 0; t < user_data_json.length; t++) {
        var que_id = user_data_json[t].que_id;
        if (que_id == 1) {
            var user_name = user_data_json[t].ans[0];
            break;
        }
    }

    glob_user_json = Param_obj;

    var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_Check_Customer_Or_User_Exists', JSON.stringify(Param_obj), check_new_user_exist, onfail_request);
    getdata.callOtherDomain();
}
function check_new_user_exist(invocation1) {
    try {
        var Suc_Message = invocation1.responseText;
        Suc_Message = eval('(' + Suc_Message + ')');
        var status = Suc_Message[0].status;
        if (status == 11) {
            // user is not exist

            var auth = [];
            auth.push({
                'username': username,
                'u_c': uniqcode
            });

            var Param_obj = [];
            Param_obj = glob_user_json;

            var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_insert_Customer_Master_And_Sub_Type', JSON.stringify(Param_obj), onsucess_insert_new_user, onfail_request);
            getdata.callOtherDomain();
        }
        else {
            // user exist
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
function onsucess_insert_new_user(invocation1) {
    try {
        var Suc_Message1 = invocation1.responseText;
        Suc_Message1 = eval('(' + Suc_Message1 + ')');
        var message1 = Suc_Message1[0].message;
        var status = Suc_Message1[0].status;
        if (status == 1) {
            alert1("User added successfully.");
            myApp.closeModal(".popup-create-user");
            get_user_checksheet();
        }
        else {
            alert1(message1);
        }
        loading_hide();
    }
    catch (e) {
        loading_hide();
        alert1(e + '_onsucess_insert_new_customer');
    }
}


// delete user via update leaving date
function User_Delete_Popup(delete_user_id) {
    myApp.popup('.popup-delete-user');
    $("#cal_delete").val("");

    var onclick_str = "get_user_data_for_delete(" + delete_user_id + ")";
    $("#btn_delete").attr("onclick", onclick_str);
}

function get_user_data_for_delete(delete_user_id) {
    var t_cal_answer = $("#cal_delete").val();
    if (t_cal_answer == '' || t_cal_answer == null || t_cal_answer == undefined) {
        alert("Please select date!");
    }
    else {
        var company_id = JSON.parse(storage.getItem('company_id'));

        var Param_obj = [];
        Param_obj.push({
            'User_Id': delete_user_id,
            'Company_id': company_id
        });

        loading();
        var getdata1 = new Webservicecall_REST(global_wcf_url + 'WCF_select_user_master_by_userid', JSON.stringify(Param_obj), function (e) {
            var Search_data = e.responseText;
            Search_data = eval('(' + Search_data + ')');
            var message = Search_data[0].message;
            var status = Search_data[0].status;
            if (status == 1) {
                message = message.replace('[[', '[');
                message = message.replace(']]', ']');
                message = eval('(' + Search_data[0].data + ')');

                Data = message[0].UserData;
                Data = eval('(' + Data + ')');

                checksheet_id = message[0].checksheet_id;

                autofill_user_list_user_values(Data, delete_user_id);
            }
            else {
                alert1(message);
                loading_hide();
            }
        }, onfail_request);
        getdata1.callOtherDomain();
    }
}

function autofill_user_list_user_values(Data, delete_user_id) {
    var t_cal_answer = $("#cal_delete").val();
    var cal_answer = convert_fix_format_date_on_submit(t_cal_answer, "date");

    var queid_array = [28, 43];
    for (k = 0; k < Data.length; k++) {
        var t_que_id = Data[k].que_id;
        t_que_id = parseInt(t_que_id);

        var check_queid = queid_array.includes(t_que_id);
        if (check_queid == true) {
            if (t_que_id == 28) {
                Data[k].ans[0] = "Inactive";
            }
            else if (t_que_id == 43) {
                Data[k].ans[0] = cal_answer;
            }
        }
    }
    update_user_list_user_data(Data, delete_user_id);
}

function update_user_list_user_data(Json_data, delete_user_id) {
    var company_id = JSON.parse(storage.getItem('company_id'));

    var Param_obj = [];
    Param_obj.push({
        'CustomerUniqId': "",
        'Company_id': company_id,
        'Subcategory': "User",
        'Step_id': 1,
        'StepNo': 1,
        'checksheet_id': checksheet_id,// $("#ddl_Checksheet_Table").val(),
        'Status': 0,
        'Data': Json_data,
        'button': [],
        'createby': delete_user_id,
        'UpdatedBy': delete_user_id,
        "checksheet_type": 7,
        'photo_temp': [],
        'Check_User_Upadte_Or_Create': "Update"
    });

    var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_insert_Customer_Master_And_Sub_Type', JSON.stringify(Param_obj), function (e) {
        var Suc_Message = e.responseText;
        Suc_Message = eval('(' + Suc_Message + ')');
        var status = Suc_Message[0].status;
        var message = Suc_Message[0].message;
        if (status == 1) {
            $("#user_" + delete_user_id + "").remove();
            myApp.closeModal('.popup-delete-user');
            alert1("User removed successfully!");
        }
        else {
            alert1(message);
        }
        loading_hide();
    }, onfail_request);
    getdata.callOtherDomain();
}


// Send user profile for approval 17022025 PG 
update_user_profile = () => {
    myApp.popup('.popup-update-user');

    $("#container_div").empty();
    $("#container_btn_div").empty();

    var check_type = localStorage.getItem('profile_checksheetid');
    var data = localStorage.getItem('profile_user_data');
    if (data == '' || data == null || data == undefined) { }
    else {
        data = JSON.parse(data);
    }

    //read_dynamic_surveydata('', check_type, '', data, '', 7, 0);
    RS_heading = '';
    RS_check_type = check_type;
    RS_step = 1;
    RS_data = data;
    RS_buttons = '';
    RS_form_flag_temp = 8;
    RS_disabled_flag = 0;
    RS_target_div = '';
    RS_target_index = '';

    localStorage.setItem('check_type_user', check_type);
    storage.setItem('check_type', JSON.stringify(check_type));

    get_blank_checksheet_from_server(check_type, 1);

    $('#btn_update_user_close').unbind('click');
    $('#btn_update_user_close').on('click', function () {
        //myApp.closeModal('.popup-update-user');
        //$('#iframe_update_profile').attr('src', '');
        //window.parent.$('#iframe_update_profile').hide()
        //window.parent.$('.popup-profile .page').show();

        if (is_approval == "1") {
            back_button('EF_User_List');
        }
        else {
            setTimeout(function () {
                window.parent.location.reload();
            }, 100);
        }
    });
}

function submit_user_edited_data() {
    try {
        return validate_and_submit_surveydata(1, 8, jsonObj_user_add);
    } catch (e) {
        alert1(e + "_submit_user_edited_data");
    }
    return false;
}

function update_user_from_user_listing(t_jsonObj) {
    try {
        var company_id = JSON.parse(storage.getItem('company_id'));
        var user_id = JSON.parse(storage.getItem('user_id'));
        var Main_checksheet_id = localStorage.getItem('check_type_user');

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

        Json_data = ap_json[0].data;

        var Param_obj = [];
        Param_obj.push({
            'Primary_Id': user_id,
            'CustomerUniqId': "",
            'Company_id': company_id,
            'Subcategory': "",
            'Step_id': 0,
            'StepNo': 1,
            'checksheet_id': Main_checksheet_id,
            'Status': 0,
            'Data': Json_data,
            'button': [],
            'createby': user_id,
            'UpdatedBy': user_id,
            "checksheet_type": 7,
            'photo_temp': Photo_Id_Array,
            'Check_User_Upadte_Or_Create': "Update"
        });


        loading();

        if (Approvalflag == 'YES') {
            // send for user approval
            var getdata = new Webservicecall_REST(global_wcf_url + 'User_Approval_from_task', JSON.stringify(Param_obj), onsucess_update_user_from_user_listing, onfail_update_user_from_user_listing);
            getdata.callOtherDomain();
        }
        else {
            // normal user update without approval
            var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_insert_Customer_Master_And_Sub_Type', JSON.stringify(Param_obj), onsucess_update_user_from_user_listing, onfail_update_user_from_user_listing);
            getdata.callOtherDomain();
        }
    } catch (e) {
        alert1(e + "_update_user_from_user_listing");
    }
}

function onsucess_update_user_from_user_listing(e) {
    try {
        var Suc_Message = e.responseText;
        Suc_Message = eval('(' + Suc_Message + ')');
        var status = Suc_Message[0].status;
        var message = Suc_Message[0].message;
        loading_hide();

        if (status == 1) {
            if (is_approval == '1') {
                // profile user update

                // no comment statement logic for user checksheet - mk - 13062025
                comment_state_array = [];

                if (comment_state_array.length == 0) {

                    if (Approvalflag == "YES") {
                        alert1("Your request to update your user details sent for approval for review.");
                    }
                    else {
                        let updated_profile_user_data = ap_json[0].data;
                        localStorage.setItem('profile_user_data', JSON.stringify(updated_profile_user_data));
                        // The profile fetches its details from the server again on next open.
                        localStorage.removeItem('profile_user_data_at');
                        alert1("User Updated successfully !");

                        if (is_approval == "1") {
                            var user_profile_path = get_common_localStorage("profile_user_path");
                            set_profile_pic(user_profile_path);
                            back_button('EF_User_List');
                        }
                        else {
                            window.parent.location.reload();
                        }
                    }

                    //myApp.closeModal('.popup-update-user');
                    //$('#iframe_update_profile').attr('src', '');
                    //window.parent.$('#iframe_update_profile').attr('src', '');
                    ////window.parent.$('#iframe_update_profile').hide();
                    //window.parent.$('.popup-profile .page').show();

                    //if (Approvalflag == "NO") {
                    //    get_my_profile_details_F7()
                    //}
                }
                else {
                    let data = Suc_Message[0].data;
                    data = JSON.parse(data);
                    let t_server_task_id = data[0].Server_task_id;
                    if (t_server_task_id == "" || t_server_task_id == null || t_server_task_id == undefined) {

                        if (Approvalflag == "YES") {
                            alert1("Task id is not created for user approval!");
                        }
                        else {
                            alert1("User Updated successfully !");
                        }

                        if (is_approval == "1") {
                            back_button('EF_User_List');
                        }
                        else {
                            myApp.closeModal('.popup-update-user');
                            //$('#iframe_update_profile').attr('src', '');
                            //window.parent.$('#iframe_update_profile').hide();
                            window.parent.$('.popup-profile .page').show();
                        }
                    }
                    else {
                        // comment statement found
                        var arrayto_str = comment_state_array.join('</br>');
                        comment_state_array = [];
                        comment_state_array.push(arrayto_str);
                        check_n_autocall_send_comment(t_server_task_id);
                    }
                }
            }
            else {
                alert1("User Updated successfully!");
                changeurl("viewcustomerlist_on.html");
            }
        }
        else {
            alert1(message);
        }
    }
    catch (e) {
        loading_hide();
        alert1(e + '_update_user_from_user_listing');
    }
}

onfail_update_user_from_user_listing = (e) => {
    loading_hide();
    alert1(e + '_onfail_update_user_from_user_listing');
}

//// delete user
//function User_Delete(delete_user_id) {
//    var user_id = JSON.parse(storage.getItem('user_id'));

//    if (F7_device == 'ios') {
//        var user_choice = true;
//    }
//    else {
//        var user_choice = confirm("Are you sure, you want to remove this user?");
//    }
//    if (user_choice == true) {
//        var Param_obj = [];
//        Param_obj.push({
//            'User_Id': delete_user_id,
//            'createby': user_id,
//            'UpdatedBy': user_id
//        });

//        loading();
//        var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_Delete_User_Master_And_Sub', JSON.stringify(Param_obj), function (e) {
//            var Data_json = e.responseText;
//            Data_json = eval('(' + Data_json + ')');
//            var status = Data_json[0].status;
//            if (status == 1) {
//                $("#user_" + delete_user_id + "").remove();
//                alert1("User removed successfully.");
//                loading_hide();
//            }
//            else {
//                var message = Data_json[0].message;
//                alert1(message);
//                loading_hide();
//            }
//        }, onfail);
//        getdata.callOtherDomain();
//    }
//}









// view user photo
//var pinch_init = 0;
//function view_user_photo(t_src, t_username) {
//    $("#pinch_img").attr("src", t_src);
//    $("#lbl_user_photo").html(t_username);
//    myApp.popup('.popup-photo-view');

//    if (pinch_init == 0) {
//        //var el = document.querySelector('div.pinch-zoom');
//        //new PinchZoom.default(el, {});
//        //pinch_init++;
//        Zoom("#pinch_img");
//    }

//    //setTimeout(function () {
//    //    scale2fit();
//    //}, 100);
//}
//function scale2fit() {
//    const margin = 0;
//    requestAnimationFrame(function fitToParentOnResize() {
//        fitToParent(document.getElementById('element_to_scale'), margin);
//    });
//}
//(function (global) {
//    function scaleAmountNeededToFit(el, margin = 0) {
//        const parentSize = {
//            width: el.parentElement.clientWidth - margin * 2,
//            height: el.parentElement.clientHeight - margin * 2
//        };

//        return Math.min(parentSize.width / el.clientWidth,
//            parentSize.height / el.clientHeight);
//    }

//    function fitToParent(element, margin) {
//        const scale = scaleAmountNeededToFit(element, margin);
//        element.style.transformOrigin = "0 0";
//        element.style.transform = `translate(${margin}px, ${margin}px) scale(${scale})`;
//    }

//    global.fitToParent = fitToParent;
//})(this);

