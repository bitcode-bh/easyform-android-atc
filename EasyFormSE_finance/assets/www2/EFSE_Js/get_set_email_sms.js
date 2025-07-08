
function add_email() {
    var email_rows = $("#tbl_email tbody tr").length;
    if (email_rows == 0) {
        var param = "remove_item(this)";
        //var new_row = '<tr><td><input type="text"><i class="fa fa-times-circle input_ico" title="remove this item" style="color:red" onclick=' + param + '></i></td></tr>';

        var new_row = '';
        new_row += '<tr><td>';
        new_row += '<div style="border:solid 1px #ccc;border-radius: 5px;padding:0 5px;margin-bottom: 5px;">';
        new_row += '<input type="text" class="form-ele" placeholder="Email">';
        new_row += '<i class="fa fa-times-circle input_ico" title="remove this item" style="color:red;float:right;font-size:25px;margin-top:6px;" onclick="remove_item(this)"></i></div>';
        new_row += '</td></tr>';

        $("#tbl_email").append(new_row);
    }
    else {
        var last_emil = $("#tbl_email tr:last td input").val();
        if (last_emil == '') {
            alert1("Please enter email id !");
        }
        else {
            var email_check = IsEmail(last_emil);
            if (email_check == false) {
                alert1("Invalid email id, please enter valid email id !");
            }
            else {
                var param = "remove_item(this)";
                //var new_row = '<tr><td><input type="text"><i class="fa fa-times-circle input_ico" title="remove this item" style="color:red" onclick=' + param + '></i></td></tr>';

                var new_row = '';
                new_row += '<tr><td>';
                new_row += '<div style="border:solid 1px #ccc;border-radius: 5px;padding:0 5px;margin-bottom: 5px;">';
                new_row += '<input type="text" class="form-ele" placeholder="Email">';
                new_row += '<i class="fa fa-times-circle input_ico" title="remove this item" style="color:red;float:right;font-size:25px;margin-top:6px;" onclick="remove_item(this)"></i></div>';
                new_row += '</td></tr>';

                $("#tbl_email").append(new_row);
            }
        }
    }
}

function add_contact() {
    var contact_rows = $("#tbl_contact tbody tr").length;
    if (contact_rows == 0) {
        var param = "remove_item(this)";
        //var new_row = '<tr><td><input type="number"><i class="fa fa-times-circle input_ico" style="color:red" onclick=' + param + '></i></td></tr>';

        var new_row = '';
        new_row += '<tr><td>';
        new_row += '<div style="border:solid 1px #ccc;border-radius: 5px;padding:0 5px;margin-bottom: 5px;">';
        new_row += '<input type="number" class="form-ele" placeholder="Contact">';
        new_row += '<i class="fa fa-times-circle input_ico" title="remove this item" style="color:red;float:right;font-size:25px;margin-top:6px;" onclick="remove_item(this)"></i></div>';
        new_row += '</td></tr>';

        $("#tbl_contact").append(new_row);
    }
    else {
        var last_contact = $("#tbl_contact tr:last td input").val();
        if (last_contact == '') {
            alert1("Please enter contact number !");
        }
        else {
            var param = "remove_item(this)";
            //var new_row = '<tr><td><input type="number"><i class="fa fa-times-circle input_ico" style="color:red" onclick=' + param + '></i></td></tr>';

            var new_row = '';
            new_row += '<tr><td>';
            new_row += '<div style="border:solid 1px #ccc;border-radius: 5px;padding:0 5px;margin-bottom: 5px;">';
            new_row += '<input type="number" class="form-ele" placeholder="Contact">';
            new_row += '<i class="fa fa-times-circle input_ico" title="remove this item" style="color:red;float:right;font-size:25px;margin-top:6px;" onclick="remove_item(this)"></i></div>';
            new_row += '</td></tr>';

            $("#tbl_contact").append(new_row);
        }
    }
}

function remove_item(obj) {
    var curr_rows = $(obj).closest('table tr').length;
    $(obj).closest('tr').remove();
}

function send_email_sms(t_checksheet_id, t_step, t_que_id) {
    var email_Array = [], contact_Array = [];
    var email_rows = $("#tbl_email tbody tr").length;
    for (i = 0 ; i < email_rows ; i++) {
        var email = $("#tbl_email tbody tr:nth-child(" + (i + 1) + ") td input").val();
        if (email == '' || email == null || email == undefined) {
            break;
        }
        else {
            email_Array.push(email);
        }
    }

    if (email_Array.length != email_rows) {
        alert1("Please fill all emails !");
    }
    else {
        var contact_rows = $("#tbl_contact tbody tr").length;
        for (j = 0 ; j < contact_rows ; j++) {
            var contact = $("#tbl_contact tbody tr:nth-child(" + (j + 1) + ") td input").val();
            if (contact == '' || contact == null || contact == undefined) {
                break;
            }
            else {
                contact_Array.push(contact);
            }
        }

        if (contact_Array.length != contact_rows) {
            alert1("Please fill all contacts !");
        }
        else {

            var subject = $("#txt_subject").val();
            if (subject == '' || subject == null || subject == undefined) {
                alert1("Please enter subject line !");
            }
            else {
                var message = $("#txt_message").val();
                if (message == '' || message == null || message == undefined) {
                    alert1("Please enter message text !");
                }
                else {
                    var server_task_id = JSON.parse(storage.getItem('server_task_id'));
                    var user_id = JSON.parse(storage.getItem('user_id'));
                    var ms = new Date().getTime();
                    var client_id = user_id + '_' + ms;

                    var param_obj = [];
                    param_obj.push({
                        "subject": subject,
                        "message": message,
                        "email": email_Array,
                        "contact": contact_Array,
                        "server_task_id": server_task_id,
                        "checksheet_id": t_checksheet_id,
                        "step_id": t_step,
                        "que_id": t_que_id,
                        "client_request_id": client_id
                    });
                    //alert1(JSON.stringify(param_obj));

                    var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_Mobile_Notification_Master', JSON.stringify(param_obj),
                          onsuccess_send_email_sms, onfail_send_email_sms);
                    getdata.callOtherDomain();
                }
            }
        }
    }
}

function onsuccess_send_email_sms(e) {
    try {
        var Suc_Message = e.responseText;
        Suc_Message = eval('(' + Suc_Message + ')');
        var message = Suc_Message[0].message;
        var status = Suc_Message[0].status;
        if (status == 1) {
            alert1("Action Completed Successfully !");
        }
        else {
            alert1(message);
        }
    }
    catch (e) {
        alert1(e + '_onssuccess_send_email_sms()');
    }
}

function onfail_send_email_sms(e) {
    alert1(e + '_onfail_send_email_sms()');
}




// getting rows from table - Mobile_Notification_Master
function get_email_sms(t_checksheet_id, t_step, t_que_id) {
    var server_task_id = JSON.parse(storage.getItem('server_task_id'));

    var param_obj = [];
    param_obj.push({
        "server_task_id": server_task_id,
        "checksheet_id": t_checksheet_id,
        "step_id": t_step,
        "que_id": t_que_id
    });
    //alert1(JSON.stringify(param_obj));

    var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_Get_Data_From_Mobile_Notification_Master', JSON.stringify(param_obj),
          onsuccess_get_email_sms, onfail_get_email_sms);
    getdata.callOtherDomain();
}

function onsuccess_get_email_sms(e) {
    try {
        var Suc_Message = e.responseText;
        Suc_Message = eval('(' + Suc_Message + ')');
        var message = Suc_Message[0].message;
        var status = Suc_Message[0].status;
        if (status == 1) {
            var data = Suc_Message[0].data;
            data = JSON.parse(data);
            var subject = data[0].subject;
            var body = data[0].body;
            var email_json = data[0].email_json;
            var sms_json = data[0].sms_json;

            $("#txt_subject").val(subject);
            $("#txt_message").val(body);

            var param = "remove_item(this)";

            if (email_json == '[]') { }
            else {
                $("#tbl_email tbody").empty();
                for (e = 0; e < email_json.length; e++) {
                    //var new_row = '<tr><td><input type="text" value="' + email_json[e] + '"><i class="fa fa-times-circle input_ico" title="remove this item" style="color:red" onclick=' + param + '></i></td></tr>';

                    var new_row = '';
                    new_row += '<tr><td>';
                    new_row += '<div style="border:solid 1px #ccc;border-radius: 5px;padding:0 5px;margin-bottom: 5px;">';
                    new_row += '<input type="text" value="' + email_json[e] + '" class="form-ele" placeholder="Email">';
                    new_row += '<i class="fa fa-times-circle input_ico" title="remove this item" style="color:red;float:right;font-size:25px;margin-top:6px;" onclick="remove_item(this)"></i></div>';
                    new_row += '</td></tr>';

                    $("#tbl_email").prepend(new_row);
                }
            }

            if (sms_json == '[]') { }
            else {
                $("#tbl_contact tbody").empty();
                for (s = 0; s < sms_json.length; s++) {
                    //var new_row = '<tr><td><input type="number" value="' + sms_json[s] + '"><i class="fa fa-times-circle input_ico" title="remove this item" style="color:red" onclick=' + param + '></i></td></tr>';

                    var new_row = '';
                    new_row += '<tr><td>';
                    new_row += '<div style="border:solid 1px #ccc;border-radius: 5px;padding:0 5px;margin-bottom: 5px;">';
                    new_row += '<input type="number" value="' + sms_json[s] + '" class="form-ele" placeholder="Contact">';
                    new_row += '<i class="fa fa-times-circle input_ico" title="remove this item" style="color:red;float:right;font-size:25px;margin-top:6px;" onclick="remove_item(this)"></i></div>';
                    new_row += '</td></tr>';

                    $("#tbl_contact").prepend(new_row);
                }
            }

        }
    }
    catch (e) {
        alert1(e + '_onssuccess_get_email_sms()');
    }
}

function onfail_get_email_sms(e) {
    alert1(e + '_onfail_get_email_sms()');
}

