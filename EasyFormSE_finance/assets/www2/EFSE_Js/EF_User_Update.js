

function get_user_update_data() {
    var company_id = JSON.parse(storage.getItem('company_id'));
    var aadhar_user_id = localStorage.getItem('aadhar_user_id');

    var Param_obj = [];
    Param_obj.push({
        'User_Id': aadhar_user_id,
        'Company_id': company_id
    });

    loading();
    var getdata1 = new Webservicecall_REST(global_wcf_url + 'WCF_select_user_master_by_userid', JSON.stringify(Param_obj), onsuccess_get_user_update_data, onfail_request);
    getdata1.callOtherDomain();
}

function onsuccess_get_user_update_data(invocation1) {
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

            autofill_user_update_user_values(Data);
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

function autofill_user_update_user_values(Data) {
    var txt_GST_number = $("#txt_GST_number").val();
    var txt_PAN = $("#txt_PAN").val();
    var txt_father_name = $("#txt_father_name").val();

    if (txt_GST_number == "" || txt_GST_number == null || txt_GST_number == undefined) {
        alert("Please enter GST number!");
        loading_hide();
        return false;
    }
    else if (txt_PAN == "" || txt_PAN == null || txt_PAN == undefined) {
        alert("Please enter PAN!");
        loading_hide();
        return false;
    }
    else if (txt_father_name == "" || txt_father_name == null || txt_father_name == undefined) {
        alert("Please enter father's name!");
        loading_hide();
        return false;
    }

    var queid_array = [73, 46, 76];
    for (k = 0; k < Data.length; k++) {
        var t_que_id = Data[k].que_id;
        t_que_id = parseInt(t_que_id);

        var check_queid = queid_array.includes(t_que_id);
        if (check_queid == true) {
            if (t_que_id == 73) {
                Data[k].ans[0] = txt_GST_number;
            }
            else if (t_que_id == 46) {
                Data[k].ans[0] = txt_PAN;
            }
            else if (t_que_id == 76) {
                Data[k].ans[0] = txt_father_name;
            }
        }
    }
    update_user_update_user_data(Data);
}

function update_user_update_user_data(Json_data) {
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

    var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_insert_Customer_Master_And_Sub_Type', JSON.stringify(Param_obj), onsuccess_update_user_update_user_data, onfail_request);
    getdata.callOtherDomain();
}

function onsuccess_update_user_update_user_data(invocation1) {
    var Suc_Message = invocation1.responseText;
    Suc_Message = eval('(' + Suc_Message + ')');
    var status = Suc_Message[0].status;
    var message = Suc_Message[0].message;
    if (status == 1) {
        alert1("User data has been updated on server sucessfully!");
        changeurl("Login.html");
    }
    else {
        alert1(message);
    }
    loading_hide();
}
