
var aadhar_otp_timer, otp_sent_count = 0;

function autofill_aadhar_number() {
    var user_data = localStorage.getItem('profile_user_data');
    if (user_data == "" || user_data == null || user_data == undefined) {
    }
    else {
        user_data = JSON.parse(user_data);
        let len = user_data.length;
        let aadhar_found = 0;
        for (f = 0; f < len; f++) {
            let qid = user_data[f].que_id;
            if (qid == 47) {
                let aadhar_number = user_data[f].ans;
                if (aadhar_number == "" || aadhar_number == null || aadhar_number == undefined) { }
                else {
                    $("#aadhar_num").val(aadhar_number);
                    $("#aadhar_num").focus();
                    $("#aadhar_num").attr("disabled", "disabled");
                    aadhar_found++;
                }
                break;
            }
        }

        if (aadhar_found == 0) {
            $("#aadhar_num").attr("disabled", "disabled");
            alert("Your aadhar number is not found in the system, please contact your manager to update it!");
            changeurl("EF_User_List.html");
        }
    }
}

function get_otp() {
    if (otp_sent_count > 2) {
        alert1("You have reached maximum limit for get OTP!");
        changeurl("Login.html");
    }
    else {
        var aadhar_no = $("#aadhar_num").val();
        if (aadhar_no == "" || aadhar_no == null || aadhar_no == undefined) {
            alert1("Please enter aadhar number!");
        }
        else {
            var len = aadhar_no.length;
            if (len != 12) {
                alert1("Aadhar number must be 12 digit long!");
            }
            else {

                if (aadhar_no.indexOf('.') !== -1) {
                    alert1("Please enter valid aadhar number!");
                }
                else {
                    var param_obj = {
                        'id_number': aadhar_no
                    };

                    loading();

                    localStorage.setItem("Authorization", "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTY0ODE5Mjk5OCwianRpIjoiYWNjNmQwMDgtNDY2Ni00MTk4LThhN2ItNmNkMTI5YTNjN2MzIiwidHlwZSI6ImFjY2VzcyIsImlkZW50aXR5IjoiZGV2LnByYXRhcEBhYWRoYWFyYXBpLmlvIiwibmJmIjoxNjQ4MTkyOTk4LCJleHAiOjE5NjM1NTI5OTgsInVzZXJfY2xhaW1zIjp7InNjb3BlcyI6WyJyZWFkIl19fQ.H0Uaa_6qY3dbBDmPepFZIfsyn2aCXgIHLV2F1J9p8ko");
                    var getdata = new Webservicecall_REST('https://kyc-api.aadhaarkyc.io/api/v1/aadhaar-v2/generate-otp', JSON.stringify(param_obj), onsuccess_get_otp, onfail_get_otp);

                    //localStorage.setItem("mock-response-name", "Generate OTP V2");
                    //var getdata = new Webservicecall_REST('https://1c674262-b495-47d5-a536-81a449706d35.mock.pstmn.io/api/v1/aadhaar-v2/generate-otp', JSON.stringify(param_obj), onsuccess_get_otp, onfail_get_otp);

                    getdata.callOtherDomain();
                }
            }
        }
    }
}
function onsuccess_get_otp(e) {
    try {
        var responseText = JSON.parse(e.responseText);
        var message = responseText.message;
        var status_code = responseText.status_code;
        if (status_code == 200) {
            var data = responseText.data;
            client_id = data.client_id;

            localStorage.setItem("mock-response-name", "");
            localStorage.setItem("Authorization", "");

            alert1(message);
            loading_hide();

            $(".getotp").hide();
            $(".submitotp").show();

            otp_sent_count = otp_sent_count + 1;

            // Resend button
            $("#btn_Resend_OTP").hide();
            $("#spn_timer").show();
            $("#spn_timer").html(0);
            aadhar_otp_timer = setInterval(function () {
                var sec = parseInt($("#spn_timer").html());
                sec = sec + 1;
                $("#spn_timer").html(sec);
                if (sec == 60) {
                    $("#spn_timer").hide();
                    $("#btn_Resend_OTP").show();
                    clearInterval(aadhar_otp_timer);
                }
            }, 1000);

        }
        else {
            alert1(message);
            loading_hide();
        }
    }
    catch (e) {
        alert1(e + "_onsuccess_get_otp()");
        loading_hide();
    }
}

function onfail_get_otp(e) {
    alert1("Verification Failed.");
    loading_hide();
}

function submit_otp() {
    var aadhar_no = $("#aadhar_num").val();
    if (aadhar_no == "" || aadhar_no == null || aadhar_no == undefined) {
        alert1("Please enter aadhar number!");
    }
    else {
        var len = aadhar_no.length;
        if (len != 12) {
            alert1("Aadhar number must be 12 digit long!");
        }
        else {
            var aadhar_otpnum = $("#aadhar_otp").val();
            if (aadhar_otpnum == "" || aadhar_otpnum == null || aadhar_otpnum == undefined) {
                alert1("Please enter otp!");
            }
            else {

                var param_obj = {
                    "client_id": client_id,
                    "otp": aadhar_otpnum
                };

                loading();

                localStorage.setItem("Authorization", "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTY0ODE5Mjk5OCwianRpIjoiYWNjNmQwMDgtNDY2Ni00MTk4LThhN2ItNmNkMTI5YTNjN2MzIiwidHlwZSI6ImFjY2VzcyIsImlkZW50aXR5IjoiZGV2LnByYXRhcEBhYWRoYWFyYXBpLmlvIiwibmJmIjoxNjQ4MTkyOTk4LCJleHAiOjE5NjM1NTI5OTgsInVzZXJfY2xhaW1zIjp7InNjb3BlcyI6WyJyZWFkIl19fQ.H0Uaa_6qY3dbBDmPepFZIfsyn2aCXgIHLV2F1J9p8ko");
                var getdata = new Webservicecall_REST('https://kyc-api.aadhaarkyc.io/api/v1/aadhaar-v2/submit-otp', JSON.stringify(param_obj), onsuccess_submit_otp, onfail_submit_otp);

                //localStorage.setItem("mock-response-name", "Submit OTP v2");
                //var getdata = new Webservicecall_REST('https://1c674262-b495-47d5-a536-81a449706d35.mock.pstmn.io/api/v1/aadhaar-v2/submit-otp', JSON.stringify(param_obj), onsuccess_submit_otp, onfail_submit_otp);

                getdata.callOtherDomain();
            }
        }
    }
}

function onsuccess_submit_otp(e) {
    try {
        var responseText = JSON.parse(e.responseText);
        var message = responseText.message;
        var status_code = responseText.status_code;
        if (status_code == 200) {

            alert1("Your aadhar details has been verified successfully!");
            loading_hide();

            localStorage.setItem("mock-response-name", "");
            localStorage.setItem("Authorization", "");

            $(".submitotp").hide();
            $(".updatedata").show();

            aadhar_data = responseText.data;

            // display details in card
            var name = aadhar_data.full_name;
            var d_o_b = aadhar_data.dob;
            d_o_b = convert_datetime_by_format(d_o_b, "date");
            var gender = aadhar_data.gender;
            var aadhaar_num = aadhar_data.aadhaar_number;

            var add_house = aadhar_data.address['house'];
            var add_street = aadhar_data.address['street'];
            var add_local = aadhar_data.address['loc'];
            var add_dist = aadhar_data.address['dist'];
            var add_state = aadhar_data.address['state'];
            var add_country = aadhar_data.address['country'];
            var address = add_house + add_street + " " + add_local + " " + add_dist + " " + add_state + "" + add_country;

            if (gender == "M") {
                var gender = "Male";
            }
            else {
                var gender = "Female";
            }

            $("#td_number").html(aadhaar_num);
            $("#td_name").html(name);
            $("#td_address").html(address);
            $("#td_gender").html(gender);
            $("#td_dob").html(d_o_b);

        }
        else {
            alert1(message);
            loading_hide();
        }
    }
    catch (e) {
        alert1(e + "_onsuccess_submit_otp()");
        loading_hide();
    }
}
function onfail_submit_otp(e) {
    var responseText = JSON.parse(e.responseText);
    var message = responseText.message;
    alert1(message);
    loading_hide();
}

function get_aadhar_user_data() {
    var company_id = JSON.parse(storage.getItem('company_id'));
    var aadhar_user_id = localStorage.getItem('aadhar_user_id');

    var Param_obj = [];
    Param_obj.push({
        'User_Id': aadhar_user_id,
        'Company_id': company_id,
    });

    loading();
    var getdata1 = new Webservicecall_REST(global_wcf_url + 'WCF_select_user_master_by_userid', JSON.stringify(Param_obj), onsuccess_get_aadhar_user_data, onfail_request);
    getdata1.callOtherDomain();
}

function onsuccess_get_aadhar_user_data(invocation1) {
    try {
        var Search_data = invocation1.responseText;
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

            autofill_aadhar_user_values(Data);

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

function autofill_aadhar_user_values(Data) {

    var name = aadhar_data.full_name;
    var d_o_b = aadhar_data.dob;
    d_o_b = convert_datetime_by_format(d_o_b, "date");
    d_o_b = convert_fix_format_date_on_submit(d_o_b, "date");
    var gender = aadhar_data.gender;
    //var aadhaar_num = aadhar_data.aadhaar_number;                         //commented due to "XXXX" issue in aadhar no [FT-17042025]
    var aadhaar_num = $("#aadhar_num").val();

    var add_house = aadhar_data.address['house'];
    var add_street = aadhar_data.address['street'];
    var add_local = aadhar_data.address['loc'];
    var add_dist = aadhar_data.address['dist'];
    var add_state = aadhar_data.address['state'];
    var add_country = aadhar_data.address['country'];
    var address = add_house + add_street + " " + add_local + " " + add_dist + " " + add_state + "" + add_country;

    if (gender == "M") {
        var gender = "Male";
    }
    else {
        var gender = "Female";
    }

    var queid_array = [4005, 21, 32, 47, 66];

    for (k = 0; k < Data.length; k++) {
        var t_que_id = Data[k].que_id;
        t_que_id = parseInt(t_que_id);

        var check_queid = queid_array.includes(t_que_id);
        if (check_queid == true) {
            if (t_que_id == 4005) {
                Data[k].ans[0] = name;
            }
            else if (t_que_id == 21) {
                Data[k].ans[0] = d_o_b;
            }
            else if (t_que_id == 32) {
                Data[k].ans[0] = gender;
            }
            else if (t_que_id == 47) {
                Data[k].ans[0] = aadhaar_num;
            }
            else if (t_que_id == 66) {
                Data[k].ans[0] = address;
            }
        }
    }

    update_aadhar_user_data(Data);
}

function update_aadhar_user_data(Json_data) {
    var company_id = JSON.parse(storage.getItem('company_id'));
    var aadhar_user_id = localStorage.getItem('aadhar_user_id');

    //for (i in Json_data) { if (Json_data[i].que_id == 5) { Json_data[i].ans = [" "] } }

    //for (i in Json_data) { if (Json_data[i].que_id == 10018) { Json_data[i].ans = [" "] } }

    var Param_obj = [];
    Param_obj.push({
        'CustomerUniqId': "",
        'Company_id': company_id,
        'Subcategory': "User",
        'Step_id': 79071,
        'StepNo': 1,
        'checksheet_id': checksheet_id,// $("#ddl_Checksheet_Table").val(),
        'Status': 0,
        'Data': Json_data,
        'button': [],
        'createby': aadhar_user_id,
        'UpdatedBy': aadhar_user_id,
        "checksheet_type": 7,
        'photo_temp': [],
        'Check_User_Upadte_Or_Create': "Update"
    });

    var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_insert_Customer_Master_And_Sub_Type', JSON.stringify(Param_obj), onsuccess_update_aadhar_user_data, onfail_request);
    getdata.callOtherDomain();
}

function onsuccess_update_aadhar_user_data(invocation1) {
    var Suc_Message = invocation1.responseText;
    Suc_Message = eval('(' + Suc_Message + ')');
    var status = Suc_Message[0].status;
    var message = Suc_Message[0].message;
    if (status == 1) {
        //alert1("User updated successfully!");
        insert_aadhar_data();
    }
    else {
        alert1(message);
    }
    loading_hide();
}


function insert_aadhar_data() {
    var aadhar_user_id = localStorage.getItem('aadhar_user_id');

    var Param_obj = [];
    Param_obj.push({
        'user_id': aadhar_user_id,
        'adhar_data': JSON.stringify(aadhar_data),
        'bank_data': "",
        "flag": "adhar"
    });

    loading();
    var getdata1 = new Webservicecall_REST(global_wcf_url + 'Insert_Adhar_and_bankdata', JSON.stringify(Param_obj), onsuccess_insert_aadhar_verification, onfail_request);
    getdata1.callOtherDomain();
}

function onsuccess_insert_aadhar_verification(invocation1) {
    var Search_data = invocation1.responseText;
    Search_data = eval('(' + Search_data + ')');
    var message = Search_data[0].message;
    var status = Search_data[0].status;
    if (status == 1) {
        alert1("Aadhar data has been updated on server sucessfully!");

        var bank_verified = localStorage.getItem('bank_verified');
        if (bank_verified == "True") {
            changeurl("Login.html");
        }
        else {
            changeurl("EF_Account_Verification.html");
        }

    }
    else {
        alert1(message);
    }
    loading_hide();
}




















//function Autofill_value() {
//    var name = user_data.full_name;
//    var d_o_b = user_data.dob;
//    d_o_b = convert_datetime_by_format(d_o_b, "date");
//    var gender = user_data.gender;
//    var aadhaar_num = user_data.aadhaar_number;

//    var add_house = user_data.address['house'];
//    var add_street = user_data.address['street'];
//    var add_local = user_data.address['loc'];
//    var add_dist = user_data.address['dist'];
//    var add_state = user_data.address['state'];
//    var add_country = user_data.address['country'];
//    var address = add_house + add_street + " " + add_local + " " + add_dist + " " + add_state + "" + add_country;

//    var profile_name = user_data.profile_image;

//    $('#txt_0_' + check_type_New_Cust + '_4005').val(name);
//    $('#txt_0_' + check_type_New_Cust + '_66').val(address);
//    $('#cal_0_' + check_type_New_Cust + '_21').val(d_o_b);
//    if (gender == "M") {
//        var gender = "Male";
//    }

//    //var path = 'https://development.easyform.in/api/api/GetFile/Select_File_Details?cid=59295&t22id=0&t22i=0&id=25843&qd=4008&ctype=7&ud=24368&uc=e2qDZPl8xJ&random=1647234282489'

//    $('#ddl_0_' + check_type_New_Cust + '_32').val(gender).trigger('change');
//    $('#txtno_0_' + check_type_New_Cust + '_47').val(aadhaar_num);
//    $('#hdn_upload_cam_0_' + check_type_New_Cust + '_4008').attr("value", path);
//    $('#hdn_upload_cam_0_' + check_type_New_Cust + '_4008').attr("name", profile_name);
//    $('#div_up_main_0_' + check_type_New_Cust + '_4008').empty();
//    $('#dv_up_done_0_' + check_type_New_Cust + '_4008').css("display", "inherit");
//    //$('#dv_up_done_0_' + check_type_New_Cust + '_4008').empty();
//    //$('#dv_up_done_0_' + check_type_New_Cust + '_4008').append('<label style="margin-right:4% ;font-family:monospace !important; font-size:13px !important; white space:initial!important;color:gray;">' + profile_name + '</label>');
//    //$('#dv_up_done_0_71543_4008').append('<button type="button" id="up_another_0_59295_4008" title="Replace existing file" class="btn btn-info btn-circle" style="width:30px; height:30px; border-radius:50px; font-size:12px; padding:6px 0; background-color: grey;cursor:pointer"><i class="fa fa-exchange" style="margin:0; font-size:17px"></i></button>');


//    var id_name = 'cbtn_0_' + check_type_New_Cust + '_4008';

//    //  var param_str = '"get_zoom_img_onhover(' + path + ', event)"';

//    var param_str = "get_zoom_img_onhover1('" + path + "', event)";
//    var str = '<img src=' + path + ' id=' + id_name + ' onclick="" onmousemove="' + param_str + '" onmouseout="remove_zoom_img_onout()" class="" style="height: 50px; width: 50px; margin-left: 5px; margin-top: 10px; border-radius: 7px; ">';

//    $('#div_cbtn_0_' + check_type_New_Cust + '_4008 table td:nth-of-type(2)').append(str);

//}

//function Update_Json_data() {

//    var checksheet_type = "User";
//    if (checksheet_type == "User") {
//        var checksheet_type_new = "7";
//    }

//    window.localStorage.setItem("check_type", check_type_New_Cust);

//    validate_and_submit_surveydata(1, 7, JSON.parse(checksheet_data_Page_Customer_New));

//    var Validation_True = 0;
//    if (Validation_True == 0) {
//        Json_data = ap_json[0].data;
//    }
//    else {
//        Validation_True = 0;
//        $("#fade11").css("display", "none");
//        $("#light3").css("display", "none");
//        loading_hide();
//        return false;
//    }

//    // remove duplicate photo ids
//    if (Photo_Id_Array.length > 0) {
//        Photo_Id_Array = Photo_Id_Array.reduce(function (item, e1) {
//            var matches = item.filter(function (e2) { return e1.photo_id == e2.photo_id });
//            if (matches.length == 0) {
//                item.push(e1);
//            }
//            return item;
//        }, []);
//    }

//    var auth = [];
//    auth.push({
//        'username': window.localStorage.getItem('user_name'),
//        'u_c': window.localStorage.getItem('glob_u_c')
//    });

//    for (i in Json_data) { if (Json_data[i].que_id == 5) { Json_data[i].ans = [" "] } }

//    for (i in Json_data) { if (Json_data[i].que_id == 10018) { Json_data[i].ans = [" "] } }

//    var CustomerUniq = "";
//    var button = [];
//    var Photo_Id = [];

//    var Param_obj = [];
//    Param_obj.push({
//        'CustomerUniqId': CustomerUniq,
//        'Company_id': Session_companyid,
//        'Subcategory': "HareshPatel User",
//        'Step_id': 79071,
//        'StepNo': 1,
//        'checksheet_id': checksheet_id,// $("#ddl_Checksheet_Table").val(),
//        'Status': 0,
//        'Data': Json_data,
//        'button': button,
//        'createby': User_id,
//        'UpdatedBy': User_id,
//        "checksheet_type": 7,
//        'photo_temp': Photo_Id,
//        'Check_User_Upadte_Or_Create': "Update"
//    });

//   loading_show();

//    var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_insert_Customer_Master_And_Sub_Type', JSON.stringify(Param_obj), onsucess_Update_Json_data, onfail);
// getdata.callOtherDomain();
//}

//function get_zoom_img_onhover1(img_src, event) {
//    try {
//        $('#zoom_img').show();
//        $('#zoom_img').attr('src', img_src);

//        $(".pop-div").show();

//        var top = event.clientY;
//        var left = event.clientX;

//        if (top > 410) {
//            top = 410
//        }
//        if (left > 1060) {
//            left = left - 350
//        }


//        $(".pop-div").css({
//            'top': top - 220,
//            'left': left + 20,
//        });
//    }
//    catch (e) {
//        alert(e + "_get_zoom_img_onhover");
//    }
//}
