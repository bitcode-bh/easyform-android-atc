

function autofill_account_number() {
    var user_data = localStorage.getItem('profile_user_data');
    if (user_data == "" || user_data == null || user_data == undefined) {
    }
    else {
        user_data = JSON.parse(user_data);
        let len = user_data.length;
        let account_found = 0;
        let ifsc_found = 0;
        for (f = 0; f < len; f++) {
            let qid = user_data[f].que_id;
            if (qid == 49) {
                let account_number = user_data[f].ans;
                if (account_number == "" || account_number == null || account_number == undefined) { }
                else {
                    $("#bank_account_num").val(account_number);
                    $("#bank_account_num").focus();
                    $("#bank_account_num").attr("disabled", "disabled");
                    account_found++;
                }
            }
            else if (qid == 50) {
                let ifsc_number = user_data[f].ans;
                if (ifsc_number == "" || ifsc_number == null || ifsc_number == undefined) { }
                else {
                    $("#bank_ifsc_code").val(ifsc_number);
                    $("#bank_ifsc_code").focus();
                    $("#bank_ifsc_code").attr("disabled", "disabled");
                    ifsc_found++;
                }
            }

            if (account_found > 0 && ifsc_found > 0) {
                break;
            }
        }

        //if (account_found == 0 || ifsc_found == 0) {
        //    $("#bank_account_num").attr("disabled", "disabled");
        //    $("#bank_ifsc_code").attr("disabled", "disabled");
        //    alert("Your bank details are not found in the system, please contact your manager to update it!");
        //    changeurl("Login.html");
        //}
    }
}

function bank_verification() {
    var bank_account_num = $("#bank_account_num").val();
    if (bank_account_num == "" || bank_account_num == null || bank_account_num == undefined) {
        alert1("Please enter account number!");
    }
    else {

        var bank_ifsc = $("#bank_ifsc_code").val();
        if (bank_ifsc == "" || bank_ifsc == null || bank_ifsc == undefined) {
            alert1("Please enter IFSC code!");
        }
        else {
            localStorage.setItem("Authorization", "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTY0ODE5Mjk5OCwianRpIjoiYWNjNmQwMDgtNDY2Ni00MTk4LThhN2ItNmNkMTI5YTNjN2MzIiwidHlwZSI6ImFjY2VzcyIsImlkZW50aXR5IjoiZGV2LnByYXRhcEBhYWRoYWFyYXBpLmlvIiwibmJmIjoxNjQ4MTkyOTk4LCJleHAiOjE5NjM1NTI5OTgsInVzZXJfY2xhaW1zIjp7InNjb3BlcyI6WyJyZWFkIl19fQ.H0Uaa_6qY3dbBDmPepFZIfsyn2aCXgIHLV2F1J9p8ko");

            var param_obj = {
                "id_number": bank_account_num,
                "ifsc": bank_ifsc
            };

            loading();
            var getdata = new Webservicecall_REST('https://kyc-api.aadhaarkyc.io/api/v1/bank-verification/', JSON.stringify(param_obj), onsuccess_bank_verification, onfail_bank_verification);
            getdata.callOtherDomain();
        }
    }
}

function onsuccess_bank_verification(e) {
    try {
        var responseText = JSON.parse(e.responseText);
        var message = responseText.message;
        var status_code = responseText.status_code;
        if (status_code == 200) {
            bank_data = responseText.data;

            alert1("Your bank details has been verified successfully!");
            loading_hide();

            localStorage.setItem("Authorization", "");

            $(".verify").hide();
            $(".updatedata").show();

            var name = bank_data.full_name;
            var account_number = $("#bank_account_num").val();
            var ifsc_details = $("#bank_ifsc_code").val();
            $("#td_number").html(account_number);
            $("#td_name").html(name);
            $("#td_ifsc").html(ifsc_details);
        }
        else {
            alert1(message);
            loading_hide();
        }
    }
    catch (e) {
        alert1(e + "_onsuccess_bank_verification()");
    }
}
function onfail_bank_verification(e) {
    alert1("Verification Failed.");
    loading_hide();
}

function get_user_data() {
    var company_id = JSON.parse(storage.getItem('company_id'));
    var aadhar_user_id = localStorage.getItem('aadhar_user_id');

    var Param_obj = [];
    Param_obj.push({
        'User_Id': aadhar_user_id,
        'Company_id': company_id
    });

    loading();
    var getdata1 = new Webservicecall_REST(global_wcf_url + 'WCF_select_user_master_by_userid', JSON.stringify(Param_obj), onsucess_get_user_data, onfail);
    getdata1.callOtherDomain();
}

function onsucess_get_user_data(invocation1) {
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

            Autofill_Json_value(Data);
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

function Autofill_Json_value(Data) {
    var name = bank_data.full_name;
    var account_number = $("#bank_account_num").val();
    var ifsc_details = $("#bank_ifsc_code").val();

    var queid_array = [4006, 49, 50,99];
    for (k = 0; k < Data.length; k++) {
        var t_que_id = Data[k].que_id;
        t_que_id = parseInt(t_que_id);

        var check_queid = queid_array.includes(t_que_id);
        if (check_queid == true) {
            if (t_que_id == 4006) {
                Data[k].ans[0] = name;
            }
            else if (t_que_id == 49) {
                Data[k].ans[0] = account_number;
            }
            else if (t_que_id == 50) {
                Data[k].ans[0] = ifsc_details;
            }
            else if (t_que_id == 99) {
                Data[k].ans[0] = "Verified";
            }
        }
    }
    Update_user_data(Data);
}

function Update_user_data(Json_data) {
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

    var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_insert_Customer_Master_And_Sub_Type', JSON.stringify(Param_obj), onsucess_Update_Json_data, onfail);
    getdata.callOtherDomain();
}

function onsucess_Update_Json_data(invocation1) {
    var Suc_Message = invocation1.responseText;
    Suc_Message = eval('(' + Suc_Message + ')');
    var status = Suc_Message[0].status;
    var message = Suc_Message[0].message;
    if (status == 1) {
        //alert1("User Updated successfully!");
        insert_bank_data();
    }
    else {
        alert1(message);
    }
    loading_hide();
}

function insert_bank_data() {
    var aadhar_user_id = localStorage.getItem('aadhar_user_id');

    var Param_obj = [];
    Param_obj.push({
        'user_id': aadhar_user_id,
        'adhar_data': "",
        'bank_data': JSON.stringify(bank_data),
        "flag": "bank"
    });

    loading();
    var getdata1 = new Webservicecall_REST(global_wcf_url + 'Insert_Adhar_and_bankdata', JSON.stringify(Param_obj), onsuccess_insert_aadhar_bank_data, onfail);
    getdata1.callOtherDomain();
}

function onsuccess_insert_aadhar_bank_data(invocation1) {
    var Search_data = invocation1.responseText;
    Search_data = eval('(' + Search_data + ')');
    var message = Search_data[0].message;
    var status = Search_data[0].status;
    if (status == 1) {
        alert1("Bank data has been updated on server sucessfully!");
        //changeurl("Login.html");
        changeurl("EF_User_Update.html");
    }
    else {
        alert1(message);
    }
    loading_hide();
}
