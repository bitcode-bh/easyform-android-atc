

// comment section

// get sub tasks (for activity history only)
function get_sub_tasks(t_server_task_id) {

    if (t_server_task_id == '0') {
        alert1("Parent task id is 0!");
    }
    else {
        view_full_task_id = t_server_task_id;

        loading();

        enable_popup = 1;
        myApp.popup('.popup-commentUI');
        $("#ul_task_history").empty();

        activity_Array = [];

        var flow_id = JSON.parse(storage.getItem('wayflow'));

        var Param_obj = [];
        Param_obj.push({ 'key': 'isdelete', 'value': 0 }, { 'key': 'parenttaskid', 'value': view_full_task_id }, { 'key': 'flow_id', 'value': flow_id });

        var getdata = new Webservicecall_REST(global_wcf_url + 'Task/GetTaskBasicDataWithJson', JSON.stringify(Param_obj), onsuccess_get_sub_tasks, onfail);
        getdata.callOtherDomain();
    }
}
function onsuccess_get_sub_tasks(e) {
    try {
        var res_data = e.responseText;
        res_data = eval('(' + res_data + ')');
        var status = res_data[0].status;

        var data = res_data[0].data;
        if (data == "" || data == null || data == undefined) {
            var message = res_data[0].message;
        }
        else {
            var message = data;
        }

        if (status == 1) {
            var sub_task_array = eval('(' + message + ')');
            for (s = 0; s < sub_task_array.length; s++) {
                var customerid = sub_task_array[s].customerid;
                var sub_task_id = sub_task_array[s].id;
                var sub_status = sub_task_array[s].Status;
                var create_date = sub_task_array[s].CreateDTTM;
                var assign_date = sub_task_array[s].AssignDate;
                var sub_task_data = sub_task_array[s].taskdata;

                var row_str = "<input type='hidden' id='hdn_sub_task_" + sub_task_id + "' value='" + sub_task_data + "' >";
                $("#tbl_sub_tasks").append(row_str);

                var d = new Date(create_date)
                var sub_task_ms = d.getTime();

                activity_Array.push({
                    'activity_type': 'sub_task',
                    'millisecond': sub_task_ms,
                    'customerid': customerid,
                    'Status': sub_status,
                    'id': sub_task_id,
                    'AssignDate': assign_date,
                    'CreateDTTM': create_date,
                    'taskdata': sub_task_data
                });
            }

        }
        else if (status == 2) {
            //$("#tbl_sub_tasks").append("<tr><td>No visit found</td></tr>");
        }
        else {
            alert1(message);
        }

        get_comment();
    }
    catch (e) {
        loading_hide();
        alert1(e + '_onsuccess_Bind_Status()');
    }
}

function get_comment() {

    var param_obj = [];
    param_obj.push({
        "server_task_id": view_full_task_id,
        "checksheet_id": 0,
        "step_id": 0,
        "que_id": 0
    });

    var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_Get_Data_From_Mobile_Notification_Master', JSON.stringify(param_obj), onsuccess_get_comment, onfail);
    getdata.callOtherDomain();
}
function onsuccess_get_comment(e) {
    try {

        var Suc_Message = e.responseText;
        Suc_Message = eval('(' + Suc_Message + ')');
        var message = Suc_Message[0].message;
        var status = Suc_Message[0].status;

        //activity_Array.push({
        //    'activity_type': 'email',
        //    'millisecond': '1582781168315',
        //    'UserName': 'Foram Pansuriya',
        //    'comment': 'This is body text...!!! This is Body Text...!!! This is Body Text...!!!',
        //    'date': '02/27/2020',
        //    'From': 'Test &lt;test@gmail.com&gt;',
        //    'To': ['to1@gmail.com'],
        //    'Cc': ['cc1@gmail.com'],
        //    'Bcc': ['bcc1@gmai.com'],
        //    'Subject': 'Subject Text Subject Text Subject Text Subject Text'
        //});

        if (status == 1) {

            var data = Suc_Message[0].data;
            data = JSON.parse(data);


            for (c = 0; c < data.length; c++) {
                var comment_user = data[c].subject;
                var comment_text = data[c].body;
                var createdate = data[c].createdate;
                var mail_from = data[c].from;
                var mail_to = data[c].email_json;
                var checksheet_id = data[c].checksheet_id;
                var que_id = data[c].que_id;
                var step_id = data[c].step_id;

                var d = new Date(createdate)
                var comment_ms = d.getTime();

                //if (mail_to == "" || mail_to == null || mail_to == undefined) {
                //    var activity_type = "comment";
                //}
                //else {
                //    var activity_type = "email";
                //}

                var From = data[c].from;
                if (From == '' || From == null || From == undefined) {
                    var activity_type = 'comment';
                }
                else {
                    if (checksheet_id == 0 && que_id == 0 && step_id == 0) {
                        var activity_type = 'email';
                    }
                    else {
                        var activity_type = 'control_comment';
                    }
                    comment_user = From.split('@')[0];
                }

                let t_UserName = data[c].UserName;
                if (t_UserName == "" || t_UserName == null || t_UserName == undefined) {
                    t_UserName = comment_user;
                }

                if (checksheet_id == -1 && que_id == -1 && step_id == -1) {
                    var status_millisecond = d.getTime();

                    activity_Array.push({
                        'activity_type': 'status_change',
                        'millisecond': status_millisecond,
                        'UserName': t_UserName,
                        'Status_Name': "",
                        'Prev_Status_Name': "",
                        "Status_Message": comment_text,
                        'date': createdate
                    });
                }
                else {
                    var Attachment = data[c].json_path;

                    activity_Array.push({
                        'activity_type': activity_type,
                        'millisecond': comment_ms,
                        'UserName': t_UserName,
                        'comment': comment_text,
                        'date': createdate,
                        'Subject': data[c].subject,
                        'Body': comment_text,
                        'From': mail_from,
                        'To': data[c].email_json,
                        'Cc': data[c].json_cc,
                        'Bcc': data[c].json_bcc,
                        'Attachment': Attachment,
                        'contact': data[c].sms_json
                    });
                }
            }

            //get_task_history();
            append_comment_history();
        }
        else if (status == 2) {
            //get_task_history();
            loading_hide();
        }
        else {
            alert(message);
            loading_hide();
        }
    }
    catch (e) {
        loading_hide();
        alert1(e + '_onsuccess_get_comment()');
    }
}


// get main tasks
function get_task_history() {

    loading();
    var param_obj = [];
    param_obj.push({
        "task_id": view_full_task_id
    });

    var getdata = new Webservicecall_REST(global_wcf_url + 'Wcf_Get_task_history', JSON.stringify(param_obj), onsuccess_get_task_history, onfail);
    getdata.callOtherDomain();
}
function onsuccess_get_task_history(e) {
    try {
        var res_text = e.responseText;
        var result = eval('(' + res_text + ')');
        var message = result[0].message;
        var status = result[0].status;
        //var response_data = result[0].data_array;
        if (status == 1) {

            var response_data = result[0].data;
            response_data = JSON.parse(response_data);

            for (i = 0; i < response_data.length; i++) {
                var h_username = response_data[i].UserName;
                var h_status_name = response_data[i].Status_Name;
                var h_modified_date = response_data[i].date;
                var d = new Date(h_modified_date)
                h_modified_date = formatAMPM(d);

                if (i == response_data.length - 1) {
                    var prev_status_name = "";
                }
                else {
                    var prev_status_name = response_data[i + 1].Status_Name;
                }

                var status_millisecond = d.getTime();
                activity_Array.push({
                    'activity_type': 'status_change',
                    'millisecond': status_millisecond,
                    'UserName': h_username,
                    'Status_Name': h_status_name,
                    'Prev_Status_Name': prev_status_name,
                    'date': h_modified_date
                });
            }

            append_comment_history();
        }
        else {
            alert1(message);
        }

        loading_hide();
    }
    catch (e) {
        loading_hide();
        alert1(e);
    }
}

function append_comment_history() {
    try {

        activity_Array = sort_by_key(activity_Array, 'millisecond');
        activity_Array.reverse();

        for (a = 0; a < activity_Array.length; a++) {
            var activity_type = activity_Array[a].activity_type;
            if (activity_type == 'sub_task') {
                // sub task creation

                //var customerid = activity_Array[a].customerid;
                //var sub_task_id = activity_Array[a].id;
                //var sub_status = activity_Array[a].Status;
                //var sub_task_ms = activity_Array[a].millisecond;
                var create_date = activity_Array[a].CreateDTTM;
                var assign_date = activity_Array[a].AssignDate;
                var sub_task_data = activity_Array[a].taskdata;
                sub_task_data = JSON.parse(sub_task_data);

                var user_found = 0, purpose_found = 0;
                var sub_task_username, sub_task_purpose;
                for (s = 0; s < sub_task_data.length; s++) {
                    var type = sub_task_data[s].type;
                    if (type == 0 || type == 5 || type == 7 || type == 10) { }
                    else {
                        var que_id = sub_task_data[s].que_id;
                        if (que_id == 4) {
                            sub_task_username = sub_task_data[s].ans[0];
                            user_found++;
                        }
                        else if (que_id == 18) {
                            sub_task_purpose = sub_task_data[s].ans[0];
                            purpose_found++;
                        }

                        if (user_found > 0 && purpose_found > 0) {
                            break;
                        }

                    }
                }

                var d = new Date(create_date);
                h_modified_date = formatAMPM(d);

                var n = h_modified_date.indexOf("ago");
                if (n > -1) {
                    var time_str = h_modified_date.replace(' ago', '');
                    var datetime_str = '<small>' + time_str + ' ago</small>';
                }
                else {
                    var t = getPosition(h_modified_date, ' ', 2);
                    var date_str = h_modified_date.substring(0, t);
                    var time_str = h_modified_date.substring(t, h_modified_date.length);
                    var datetime_str = '<small>' + date_str + ' ' + time_str + '</small>';
                }

                var list_item = '<div class="timeline-item">';
                list_item += '<div class="timeline-item-date">' + datetime_str + '</div>';
                list_item += '<div class="timeline-item-divider"></div>';
                list_item += '<div class="timeline-item-content"><div class="timeline-item-inner">';
                list_item += '<div class="mail-icon"><i class="fa fa-plus cls_task_ico"></i></div>';
                list_item += '<div class="timeline-item-time"><b>' + sub_task_username + '</b> had planned visit on ' + assign_date + '</div>';
                list_item += '</div></div></div>';
                history_append(list_item, a);
            }
            else if (activity_type == 'status_change') {
                // status change
                var Status_Message = activity_Array[a].Status_Message;
                var h_username = activity_Array[a].UserName;
                var h_status_name = activity_Array[a].Status_Name;
                var h_prev_status_name = activity_Array[a].Prev_Status_Name;
                var h_modified_date = activity_Array[a].date;

                var n = h_modified_date.indexOf("ago");
                if (n > -1) {
                    var time_str = h_modified_date.replace(' ago', '');
                    var datetime_str = '<small>' + time_str + ' ago</small>';
                }
                else {
                    var t = getPosition(h_modified_date, ' ', 2);
                    var date_str = h_modified_date.substring(0, t);
                    var time_str = h_modified_date.substring(t, h_modified_date.length);
                    var datetime_str = '<small>' + date_str + ' ' + time_str + '</small>';
                }

                var list_item = '<div class="timeline-item">';
                list_item += '<div class="timeline-item-date">' + datetime_str + '</div>';
                list_item += '<div class="timeline-item-divider"></div>';
                list_item += '<div class="timeline-item-content"><div class="timeline-item-inner">';

                if (Status_Message == "" || Status_Message == null || Status_Message == undefined) {
                    if (h_prev_status_name == "") {
                        var str = '<b>' + h_username + '</b> added this task to ' + h_status_name;
                        list_item += '<div class="mail-icon"><i class="fa fa-cube cls_task_ico"></i></div>';
                    }
                    else {
                        var str = '<b>' + h_username + '</b> moved this task from ' + h_prev_status_name + ' to ' + h_status_name;
                        list_item += '<div class="mail-icon"><i class="fa fa-random cls_task_ico"></i></div>';
                    }
                }
                else {
                    var str = Status_Message;
                    list_item += '<div class="mail-icon"><i class="fa fa-random cls_task_ico"></i></div>';
                }

                list_item += '<div class="timeline-item-time">' + str + '</div>';
                list_item += '</div></div></div>';

                history_append(list_item, a);
            }
            else if (activity_type == 'comment') {
                var comment_date = activity_Array[a].date;
                var comment_username = activity_Array[a].UserName;
                var comment_text = activity_Array[a].comment;

                var d = new Date(comment_date)
                h_modified_date = formatAMPM(d);

                var n = h_modified_date.indexOf("ago");
                if (n > -1) {
                    var time_str = h_modified_date.replace(' ago', '');
                    var datetime_str = '<small>' + time_str + ' ago</small>';
                }
                else {
                    var t = getPosition(h_modified_date, ' ', 2);
                    var date_str = h_modified_date.substring(0, t);
                    var time_str = h_modified_date.substring(t, h_modified_date.length);
                    var datetime_str = '<small>' + date_str + ' ' + time_str + '</small>';
                }

                var list_item = '<div class="timeline-item">';
                list_item += '<div class="timeline-item-date">' + datetime_str + '</div>';
                list_item += '<div class="timeline-item-divider"></div>';
                list_item += '<div class="timeline-item-content"><div class="timeline-item-inner">';
                list_item += '<div class="mail-icon"><i class="fa fa-comment cls_task_ico"></i></div>';
                //list_item += '<div class="timeline-item-time"><b>' + comment_username + '</b> commented:</div>';
                list_item += '<div class="timeline-item-text"><b>' + comment_username + '</b> commented: </div>';

                var html = isHTML(comment_text);
                if (html == true) {
                    var comment_html = comment_text;
                }
                else {
                    var comment_html = htmlDecode(comment_text);
                }

                list_item += '<div class="timeline-item-text">' + comment_html + '</div>';
                list_item += '</div></div></div>';

                history_append(list_item, a);

            }
            else if (activity_type == 'email') {
                var comment_date = activity_Array[a].date;
                var comment_username = activity_Array[a].UserName;
                var comment_text = activity_Array[a].Body;
                var subject_text = activity_Array[a].Subject;
                var from_text = activity_Array[a].From;
                from_text = from_text.toLowerCase();

                var d = new Date(comment_date)
                h_modified_date = formatAMPM(d);

                var n = h_modified_date.indexOf("ago");
                if (n > -1) {
                    var time_str = h_modified_date.replace(' ago', '');
                    var datetime_str = '<small>' + time_str + ' ago</small>';
                }
                else {
                    var t = getPosition(h_modified_date, ' ', 2);
                    var date_str = h_modified_date.substring(0, t);
                    var time_str = h_modified_date.substring(t, h_modified_date.length);
                    var datetime_str = '<small>' + date_str + ' ' + time_str + '</small>';
                }

                var html = isHTML(comment_text);
                if (html == true) {
                    var comment_html = comment_text;
                }
                else {
                    var comment_html = htmlDecode(comment_text);
                }

                var count = '';
                if (comment_html.indexOf('<p>', 1) > -1) {
                    end_index = comment_html.indexOf('<details', 1);
                    var comment_html = comment_html.substring(0, end_index);
                    count = (comment_text.match(/<details/g) || []).length;
                }

                var obj = JSON.stringify(activity_Array[a]);
                obj = encodeURIComponent(obj);
                var param = "open_mail_reply_popup('" + obj + "', '" + datetime_str + "')";

                var list_item = '<div class="timeline-item" onclick="' + param + '">';
                list_item += '<div class="timeline-item-date">' + datetime_str + '</div>';
                list_item += '<div class="timeline-item-divider"></div>';
                list_item += '<div class="timeline-item-content"><div class="timeline-item-inner">';
                list_item += '<div class="timeline-item-title"><div class="text-limit-title"><b>' + from_text + '</b></div><div class="mail-icon"><i class="fa fa-envelope cls_task_ico"></i></div></div>';
                list_item += '<div class="timeline-item-subtitle text-limit">' + subject_text + '<div class="mail-icon" style="color:blue;margin-right:2px;"><b>' + count + '</b></div></div>';

                list_item += '<div class="timeline-item-text text-limit">' + comment_html + '</div>';
                list_item += '</div></div>';

                history_append(list_item, a);

            }
        }

        setTimeout(function () {
            $("textarea").each(function () {
                this.style.height = (this.scrollHeight + 0) + 'px';
            });
        }, 100 * a);

        loading_hide();

    }
    catch (e) {
        loading_hide();
        alert1(e + '_append_comment_history');
    }
}

function history_append(listItem, i) {
    setTimeout(function () {
        $("#ul_task_history").append(listItem);
        var obj = $("#ul_task_history .timeline-item").eq(i).find('.timeline-item-inner')[0];
        oncommentload(obj);
    }, 200 * i);
}

////-------mail part start---------//////////////
var glob_activity_obj;
function open_mail_reply_popup(t_obj, t_datetime_str) {
    try {
        enable_popup = 1;
        myApp.popup('.popup-mail-reply');

        var mail_info = [];
        var obj = decodeURIComponent(t_obj);
        obj = JSON.parse(obj);
        glob_activity_obj = obj;

        var subject = obj.Subject;
        var from = obj.From;
        var to = obj.To;
        var body_text = obj.comment;
        var str = '';

        str += '<div class="block-title block-title-medium"><h2><b>' + subject + '</b></h2><hr/></div>';

        str += '<div class="block">';
        str += '<table style="width:100%;"><tr>';
        str += '<td class="block-left"><i class="fa fa-user user-icon"></i></td>';
        str += '<td class="block-right">';
        str += '<h4><b>' + from + '</b></h4>';
        str += '<h5>to ' + to + '</h5>';
        str += '<h5>' + t_datetime_str + '</h5>';
        str += '</td>';
        str += '</tr></table>';
        str += '</div>';

        str += '<div class="block cls-mail-body"><p>' + body_text + '</p></div>';

        $("#mail_body").empty();
        $("#mail_body").append(str);
    }
    catch (e) {
        loading_hide();
        alert1(e + '_open_mail_reply_popup');
    }
}

var glob_mail_type;
function open_popup_new_mail(mail_type) {
    try {
        enable_popup = 1;
        myApp.popup('.popup-new-mail');
        glob_mail_type = mail_type;

        //var app = new Framework7({
        //    textEditor: {
        //        buttons: ['bold', 'italic'],
        //    }
        //});

        if (mail_type == "reply") {
            $("#mail_type_text").html("Reply");
            var value_to = glob_activity_obj.From;
            var value_subject = glob_activity_obj.Subject;
        }
        else {
            $("#mail_type_text").html("Compose");
            var value_to = "";
            var value_subject = "";
        }

        //var value_from = "foram.thummar@skyproductivity.com";
        var param = "$('.cls-bcc').show();$('.cls-down-arrow').hide();";

        var mail_str = '<div class="block">';
        mail_str += '<table style="width:100%;">';
        //mail_str += '<tr>';
        //mail_str += '<td style="width:15%;" class="brdr-btm" ><label>From:</label></td>';
        //mail_str += '<td style="width:85%;" class="brdr-btm" ><input type="text" id="txt_from" /></td>';
        //mail_str += '</tr>';
        mail_str += '<tr>';
        mail_str += '<td style="width:15%;" class="brdr-btm"><label>To:</label></td>';
        mail_str += '<td style="width:85%;" class="brdr-btm">';
        mail_str += '<input type="text" id="txt_to" value="' + value_to + '" style="width:90%;display:inline-block;"/>';
        mail_str += '<div class="cls-down-arrow" style="width:9%;display:inline-block;float:right;"><i class="fa fa-angle-down" onclick="' + param + '" style="font-size:24px;vertical-align:middle;margin-top:8px;"></i></div>';
        mail_str += '</td>';
        mail_str += '</tr>';

        mail_str += '<tr class="cls-bcc">';
        mail_str += '<td style="width:15%;" class="brdr-btm"><label>Cc:</label></td>';
        mail_str += '<td style="width:85%;" class="brdr-btm" ><input type="text" id="txt_cc" /></td>';
        mail_str += '</tr>';
        mail_str += '<tr class="cls-bcc">';
        mail_str += '<td style="width:15%;" class="brdr-btm"><label>Bcc:</label></td>';
        mail_str += '<td style="width:85%;" class="brdr-btm" ><input type="text" id="txt_bcc" /></td>';
        mail_str += '</tr>';

        mail_str += '<tr>';
        mail_str += '<td colspan="2" class="brdr-btm"><input type="text" id="txt_subject" value="' + value_subject + '" placeholder="Subject"/></td>';
        mail_str += '</tr>';

        if (mail_type == "reply") {
            var time_str = glob_activity_obj.date;
            var body_msg = glob_activity_obj.comment

            mail_str += '<tr>';
            mail_str += '<td colspan="2" style="padding: 8px 0;"><textarea rows="2" cols="50" id="text_body" placeholder="Compose email" style="height:100%;"></textarea></td>';
            mail_str += '</tr>';
            //mail_str += '<tr>';
            //mail_str += '<td colspan="2" style="padding: 8px 0;"><div class="text-editor text-editor-init" data-placeholder="Compose email"><div class="text-editor-content" contenteditable></div></div></td>';
            //mail_str += '</tr>';
            mail_str += '<tr>';
            mail_str += '<td colspan="2" style="padding: 8px 0;"><div id="text_body_reply"><details style="border:none;">';
            mail_str += '<summary style="background:#fff !important;text-align:left !important;"><i class="fa fa-ellipsis-h" style="font-size:26px;"></i></summary>';
            mail_str += '<p>On ' + time_str + ' ' + value_to + ' wrote:</p>';
            mail_str += '<p style="margin-left:10px;">' + body_msg + '</p>'
            mail_str += '</details></div></td>';
            mail_str += '</tr>';
        }
        else {
            mail_str += '<tr>';
            mail_str += '<td colspan="2" style="padding: 8px 0;"><textarea rows="2" cols="50" id="text_body" placeholder="Compose email" style="height:100%;"></textarea></td>';
            mail_str += '</tr>';
        }

        mail_str += '</table>';
        mail_str += '</div>';


        $("#mail_container_div").empty();
        $("#mail_container_div").append(mail_str);
    }
    catch (e) {
        loading_hide();
        alert1(e + '_open_popup_new_mail');
    }
}

function send_new_mail() {
    try {
        var user_name = JSON.parse(storage.getItem('username'));
        var user_id = JSON.parse(storage.getItem('user_id'));
        var ms = new Date().getTime();
        var client_id = user_id + '_' + ms;

        if (glob_mail_type == "reply") {
            var msg1 = $("#text_body").val();
            var msg2 = $("#text_body_reply").html();
            var message = '<p>' + msg1 + '</p>' + msg2;
        }
        else {
            var message = $("#text_body").val();
        }
        if (message == undefined || message == "" || message == null) {
            message = "";
        }
        else {
            message = htmlEncode(message);
        }

        var subject = $("#txt_subject").val();
        var to_email_str = $("#txt_to").val();
        //var from_email_str = $("#txt_from").val();
        var cc_email_str = $("#txt_cc").val();
        var bcc_email_str = $("#txt_bcc").val();

        if (to_email_str == "") {
            alert1("Add at least one recipient mail ID...");
        }
        else if (IsEmail(to_email_str) == false) {
            alert1("Please enter valid Email Id !");
        }
        else if (cc_email_str != "" && validateEmails(cc_email_str) == false) {
            alert1("Please enter valid Email Id in 'Cc' field !");
        }
        else if (bcc_email_str != "" && validateEmails(bcc_email_str) == false) {
            alert1("Please enter valid Email Id in 'Bcc' field !");
        }
        else if (subject == "" || subject == null || subject == undefined) {
            alert1("Mail can not send without text in the body !");
        }
        else {
            var email_Array = to_email_str.split(",");
            var Cc_Array = cc_email_str.split(",");
            var Bcc_Array = bcc_email_str.split(",");

            var param_obj = [];
            param_obj.push({
                "subject": subject,
                "message": message,
                "email": email_Array,               // To Array
                //"From": from_email_str,             // From str
                "Cc": Cc_Array,                     // Cc Array
                "Bcc": Bcc_Array,                   // Bcc Array
                "contact": [],
                "server_task_id": view_full_task_id,
                "checksheet_id": 0,
                "step_id": 0,
                "que_id": 0,
                "client_request_id": client_id
            });
            //alert1('param_obj: ' + JSON.stringify(param_obj));

            loading();
            var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_Mobile_Notification_Master', JSON.stringify(param_obj), onsuccess_send_new_mail, onfail);
            getdata.callOtherDomain();
        }
    }
    catch (e) {
        loading_hide();
        alert1(e + '_send_new_mail');
    }
}
function onsuccess_send_new_mail(e) {
    try {
        var Suc_Message = e.responseText;
        Suc_Message = eval('(' + Suc_Message + ')');
        var message = Suc_Message[0].message;
        var status = Suc_Message[0].status;
        loading_hide();

        if (status == 1) {
            alert1("Mail sent successfully !");
            $("#text_body").val('');

            myApp.closeModal('.popup-new-mail');
            myApp.closeModal('.popup-mail-reply');

            loading();
            get_sub_tasks(view_full_task_id);
        }
        else {
            alert1(message);
        }
    }
    catch (e) {
        loading_hide();
        alert1(e + '_onsuccess_send_new_mail()');
    }
}

function IsEmail(email) {
    var regex = /^([a-zA-Z0-9_\.\-\+])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    if (!regex.test(email)) {
        return false;
    } else {
        return true;
    }

}
function validateEmails(string) {
    try {
        var result = string.replace(/\s/g, "").split(/,|;/);
        var errors = [];
        for (var i = 0; i < result.length; i++) {
            if (!IsEmail(result[i])) {
                errors[i] = result[i] + ' is not valid.';
            }
        }
        if (errors.length > 0) {
            //alert1(errors.join('\n'));
            return false;
        } else {
            return true;
        }
    }
    catch (e) {
        alert1(e + '_validateEmails');
    }
}
////-------mail part end---------//////////////



function send_comment() {
    var user_id = JSON.parse(storage.getItem('user_id'));
    var ms = new Date().getTime();
    var client_id = user_id + '_' + ms;

    var message = $("#Commentdata").val();
    if (message == undefined || message == "" || message == null) {
    }
    else if (message == "<p><br></p>") {
        message = "";
    }
    else {
        //var dom_obj = new DOMParser();
        //dom_obj = dom_obj.parseFromString(message, "text/html");
        //$(dom_obj).find("table").each(function () {
        //    $(this).attr("border", "1");
        //});
        //message = $(dom_obj).find("body").html();
        message = htmlEncode(message);
    }

    var param_obj = [];
    param_obj.push({
        "subject": "",
        "message": message,
        "email": [],
        'From': "",
        'Cc': [],
        'Bcc': [],
        "contact": [],
        "server_task_id": view_full_task_id,
        "checksheet_id": 0,
        "step_id": 0,
        "que_id": 0,
        "client_request_id": client_id
    });

    loading();
    var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_Mobile_Notification_Master', JSON.stringify(param_obj), onsuccess_send_comment, onfail);
    getdata.callOtherDomain();
}
function onsuccess_send_comment(e) {
    try {
        var Suc_Message = e.responseText;
        Suc_Message = eval('(' + Suc_Message + ')');
        var message = Suc_Message[0].message;
        var status = Suc_Message[0].status;
        if (status == 1) {
            //alert1("Action Completed Successfully !");
            $("#Commentdata").val('');

            get_sub_tasks(view_full_task_id);
        }
        else {
            alert1(message);
            loading();
        }
    }
    catch (e) {
        loading_hide();
        alert1(e + '_onsuccess_send_comment()');
    }
}

function oncommentload(obj) {
    obj.style.height = "30px";
    obj.style.height = obj.scrollHeight + "px";
    $(obj).blur();
}

//encode and decode html
function htmlEncode(value) {
    return $('<div/>').text(value).html();
}
function htmlDecode(value) {
    return $('<div/>').html(value).text();
}

//content is html 
function isHTML(str) {
    var a = document.createElement('div');
    a.innerHTML = str;
    for (var c = a.childNodes, i = c.length; i--;) {
        if (c[i].nodeType == 1) return true;
    }
    return false;
}

function formatAMPM(date) {
    var month_Array = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0' + minutes : minutes;

    var ms = date.getTime();
    var today_ms = new Date().getTime();
    var diff_ms = today_ms - ms;
    if (diff_ms > 86400000) {
        var day = date.getDate();
        var month = month_Array[date.getMonth()];

        var strTime = day + ' ' + month + ' ' + hours + ':' + minutes + ' ' + ampm;
    }
    else {
        var hours = Math.floor(diff_ms / 3600000);
        if (hours > 1) {
            var strTime = hours + ' hours ago';
        }
        else if (hours == 1) {
            var strTime = hours + ' hour ago';
        }
        else {
            var minutes = Math.floor(diff_ms / 60000);
            if (minutes > 1) {
                var strTime = minutes + ' min ago';
            }
            else if (minutes == 1) {
                var strTime = '1 min ago';
            }
            else {
                var seconds = ((diff_ms % 60000) / 1000).toFixed(0);
                if (seconds < 1) {
                    seconds = 1;
                }
                var strTime = seconds + ' seconds ago';
            }
        }

    }
    return strTime;
}

function sort_by_key(array, key) {
    return array.sort(function (a, b) {
        var x = a[key]; var y = b[key];
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
}

function getPosition(string, subString, index) {
    return string.split(subString, index).join(subString).length;
}

function onfail(e) {
    alert1(e + '_onfail()');
}

function open_popup_for_chatuser_list() {
    try {
        var Quickblox = localStorage.getItem('Quickblox');
        var Zoom = localStorage.getItem('Zoom');

        //if (Quickblox != "True" && Zoom != "True") {
        //    alert1("Calling feature is not allowed for this user !");
        //}
        //else {
        $(".popup-chat-user-bottom").empty();
        myApp.popup('.popup-chat-user');

        var q_btm_str = ''; var z_btm_str = ''; var j_btm_str = '';
        if (Quickblox == "True") {
            var audio_param = "get_users_for_video_call('audio')";
            var video_param = "get_users_for_video_call('video')";
            q_btm_str += '<div class="left"><a href="#" class="link" onclick="' + audio_param + '"><i class="fa fa-phone" style="color: white;font-size: 26px;"></i></a></div>';
            q_btm_str += '<div class="right"><a href="#" class="link" onclick="' + video_param + '"><i class="fa fa-video-camera" style="color: white;font-size: 26px;"></i></a></div>';
        }

        Zoom = "True";
        if (Zoom == "True") {
            var zoom_param = "plugin_call_for_zoom_meeting()";
            z_btm_str += '<div class="right"><a href="#" class="link" onclick="' + zoom_param + '"><i class="fa fa-video-camera" style="color: white;font-size: 16px;background: #2da5ff; padding:8px;border-radius:50%;"></i></a></div>';
        }

        //var jitsi_param = "plugin_call_for_jitsi_meeting()";
        //j_btm_str += '<div class="right"><a href="#" class="link" onclick="' + jitsi_param + '"><i class="fa fa-video-camera" style="color: white;font-size: 16px;background: #0cad0c; padding:8px;border-radius:6px;"></i></a></div>';

        var btm_str = q_btm_str + z_btm_str + j_btm_str;
        $(".popup-chat-user-bottom").append(btm_str);

        var Param_obj = [];
        Param_obj.push({
            'servertaskid': view_full_task_id
        });

        loading();

        var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_get_userlist_for_chat_using_taskid', JSON.stringify(Param_obj), onsuccess_chatuser_list, onfail_chatuser_list);
        getdata.callOtherDomain();
    }
    catch (e) {
        alert1(e + '_open_popup_for_chatuser_list');
    }
}

var task_users_list = [];
function onsuccess_chatuser_list(e) {
    try {
        var Data_Json = e.responseText;
        Data_Json = eval('(' + Data_Json + ')');
        var status = Data_Json[0].status;
        task_users_list = [];

        var login_user_found = 0;

        if (status == 1) {
            loading_hide();
            var data = Data_Json[0].data;
            data = JSON.parse(data);

            var str = '';
            var curr_login_user = JSON.parse(storage.getItem('username'));

            var email = Data_Json[0].Emailid;
            var email_Array = JSON.parse(email);
            for (e = 0; e < email_Array.length; e++) {
                var email_id = email_Array[e];
                var lt_index = email_id.indexOf("<");
                if (lt_index != -1) {
                    email_id = email_id.substring(lt_index + 1, email_id.length - 1);
                }
                var at_index = email_id.indexOf("@");
                var full_name = email_id.substring(0, at_index);

                data.push({
                    'full_name': full_name,
                    'login': email_id
                });
            }

            for (var i = 0; i < data.length; i++) {
                var id = data[i].id;
                //var user_id = data[i].userid;
                var full_name = data[i].full_name;
                var fcmid = data[i].fcmid;
                var device_type = data[i].DeviceType;

                if (curr_login_user == full_name.toLowerCase()) {
                    login_user_found = 1;
                }

                if (fcmid == "" || fcmid == null || fcmid == undefined) {
                    var cls_disabled = 'disabled';
                }
                else {
                    var cls_disabled = '';
                }

                str += '<li><label class="label-checkbox item-content ' + cls_disabled + '" style="min-height:20px;">';
                str += "<input type='checkbox' id='user_chk_" + id + "' title='" + id + "' name='" + full_name + "' fcmid='" + fcmid + "' device_type='" + device_type + "'>";
                str += '<div class="item-media"><i class="icon icon-form-checkbox"></i></div>';
                str += '<div class="item-inner" style="min-height:20px;padding:2px;"><div class="item-title">' + full_name + '</div></div></label></li>';

                task_users_list.push(data[i]);
            }

            $("#list_chatuser").empty();
            $("#list_chatuser").append(str);

            $("#list_chatuser li input:checkbox").change(function () {
                var checked_len = $("#list_chatuser li input[type=checkbox]:checked").length;
                if (checked_len > 4) {
                    alert1("No more than 4 users are allowed !");
                    $(this).attr("checked", false);
                }
            });
            loading_hide();
        }
        else if (status == 2) {
            loading_hide();

            var str = '';
            str += '<li><label class="label-checkbox item-content">';
            str += '<div class="item-inner"><div class="item-title">No Record Found !</div></div></label></li>';

            $("#list_chatuser").empty();
            $("#list_chatuser").append(str);
        }
        else {
            loading_hide();
            alert1(Data_Json[0].message);
        }

        // mk self assignment of current user 25102022 
        if (login_user_found == 0) {
            add_login_user_to_task();
        }

    }
    catch (e) {
        loading_hide();
        alert1(e + '_onsuccess_chatuser_list');
    }
}

function add_login_user_to_task() {

    var t_userid = JSON.parse(storage.getItem('user_id'));

    var Param_obj = [];
    Param_obj.push({
        'servertaskid': view_full_task_id,
        'user_id': t_userid,
        'flag': 'add'
    });

    loading();
    var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_Add_Remove_Userlist_for_Chat', JSON.stringify(Param_obj), function (e) {
        var res_data = e.responseText;
        res_data = eval('(' + res_data + ')');
        var status = res_data[0].status;

        var data = res_data[0].data;
        if (data == "" || data == null || data == undefined) {
            var message = res_data[0].message;
        }
        else {
            var message = data;
        }

        if (status == 1) {
            var curr_login_user = JSON.parse(localStorage.getItem('username'));
            console.log(curr_login_user + " is mapped with Task ID - " + view_full_task_id + ".");

            // refresh list
            var Param_obj = [];
            Param_obj.push({
                'servertaskid': view_full_task_id
            });

            loading();

            var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_get_userlist_for_chat_using_taskid', JSON.stringify(Param_obj), onsuccess_chatuser_list, onfail_chatuser_list);
            getdata.callOtherDomain();
        }
        else if (status == 2) {
            alert1("This user does not have calling access, please edit this user to give permission!", "danger");
        }
        else {
            alert1(message, "danger");
        }
        loading_hide();
    }, onfail);
    getdata.callOtherDomain();
}

function onfail_chatuser_list(e) {
    loading_hide();
    alert1(e + '_onfail_chatuser_list');
}

function get_users_for_video_call(call_type) {
    try {
        var user_count = $("#list_chatuser input[type=checkbox]:checked").length;
        if (user_count == 0) {
            alert1("Please select atleast one user !");
        }
        else if (user_count > 4) {
            alert1("No more than 4 users are allowed !");
        }
        else {
            var user_ary = [];
            $("#list_chatuser input[type=checkbox]:checked").each(function () {
                var user_id = $(this).attr('title');
                var user_name = $(this).attr('name');
                user_ary.push({
                    'id': user_id,
                    'name': user_name
                });
            });

            var q_jsonobj = [];
            q_jsonobj.push({
                "users": user_ary,
                "call_type": call_type
            });

            loading();
            cordova.exec(onsuccess_get_users_for_video_call, onfail_get_users_for_video_call, 'DynamicChatPlugin', 'anAction', q_jsonobj);
        }
    }
    catch (e) {
        loading_hide();
        alert1(e + '_open_video_call_plugin');
    }
}

function onsuccess_get_users_for_video_call(e) {
    try {
        loading_hide();
        //alert1('success');
    }
    catch (e) {
        loading_hide();
        alert1(e + '_onsuccess_get_users_for_video_call');
    }
}

function onfail_get_users_for_video_call(e) {
    loading_hide();
    //alert1(e + '_onfail_get_users_for_video_call');
}

function get_users_data_using_companyid() {
    try {
        myApp.popup(".popup-users-company");

        var company_id = JSON.parse(storage.getItem('company_id'));

        var Param_obj = [];
        Param_obj.push({
            'company_id': company_id,
            'task_id': view_full_task_id
        });

        loading();

        var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_Getuserdata_using_companyid', JSON.stringify(Param_obj), onsuccess_get_users_data_using_companyid, onfail_get_users_data_using_companyid);
        getdata.callOtherDomain();
    }
    catch (e) {
        alert1(e + '_get_users_data_using_companyid');
    }
}

function onsuccess_get_users_data_using_companyid(e) {
    try {
        loading_hide();
        var Data_Json = e.responseText;
        Data_Json = eval('(' + Data_Json + ')');
        var status = Data_Json[0].status;
        var data = Data_Json[0].data;

        if (data == "" || data == null || data == undefined) {
            var message = res_data[0].message;
        }
        else {
            var message = data;
        }

        if (status == 1) {
            loading_hide();

            message = eval('(' + message + ')');
            var tbl_str = '';
            var checked_str;

            var curr_login_user = JSON.parse(storage.getItem('username'));
            var meeting_users_list = [];

            var email = Data_Json[0].Emailid;
            var email_Array = JSON.parse(email);
            for (e = 0; e < email_Array.length; e++) {
                var email_id = email_Array[e];
                var at_index = email_id.indexOf("@");
                var full_name = email_id.substring(0, at_index);
                message.push({
                    'username': full_name,
                    'login': email_id
                });
            }

            for (var j = 0; j < message.length; j++) {
                var id = message[j].id;
                var user_name = message[j].username;

                if (curr_login_user == user_name) { }
                else {
                    meeting_users_list.push(message[j]);
                }
            }

            for (i = 0; i < meeting_users_list.length; i++) {
                var userid = meeting_users_list[i].user_id;
                var user_name = meeting_users_list[i].username;

                checked_str = "";
                for (var j = 0; j < task_users_list.length; j++) {
                    var task_userid = task_users_list[j].userid;
                    if (userid == task_userid) {
                        checked_str = "checked='checked'";
                        break;
                    }
                }

                if (i % 2 == 0) {
                    tbl_str += '<tr>';
                }

                tbl_str += '<td style="width: 50% !important;"><label class="label-checkbox item-content" style="min-height:15px;padding-left:5px;">';
                tbl_str += "<input type='checkbox' id='chk_" + userid + "' title='" + userid + "' name='" + user_name + "' " + checked_str + " />";
                tbl_str += '<div class="item-media" style="padding: 3px;"><i class="icon icon-form-checkbox" style="width:18px;height:18px;margin-right:0px;"></i></div>';
                tbl_str += '<div class="item-inner" style="min-height:15px;padding:0;margin-left:0px;"><div class="item-title">' + user_name + '</div></div></label></td>';

                if (i % 2 == 0) { }
                else {
                    tbl_str += '</tr>';
                }
            }

            $("#tbl_userList_company").empty();
            $("#tbl_userList_company").append(tbl_str);

            $("#tbl_userList_company td input:checkbox").change(function () {
                var user_id = $(this).attr('title');
                var user_name = $(this).attr('name');
                var ischecked = $(this).is(':checked');
                if (ischecked) {
                    assign_selected_user_to_task(user_id, user_name);
                }
                else {
                    unassign_user_from_task(user_id, user_name);
                }
            });
        }
        else if (status == 2) {
            loading_hide();

            var tbl_str = '';
            tbl_str += '<tr><td><label class="label-checkbox item-content">';
            tbl_str += '<div class="item-inner"><div class="item-title">No Record Found !</div></div></label></td></tr>';

            $("#tbl_userList_company").empty();
            $("#tbl_userList_company").append(tbl_str);
        }
        else {
            loading_hide();
            alert1(Data_Json[0].message);
        }
    }
    catch (e) {
        loading_hide();
        alert1(e + '_onsuccess_get_users_data_using_companyid');
    }
}

function onfail_get_users_data_using_companyid(e) {
    loading_hide();
    alert1(e + '_onfail_get_users_data_using_companyid');
}

//new logic for checksheet wise user for commentUI [270220203]
function get_checksheet_list() {
    try {
        myApp.popup(".popup-users-company");

        var company_id = JSON.parse(storage.getItem('company_id'));

        var Param_obj = [];
        Param_obj.push({ 'key': 'isdelete', 'value': 0 },
            { 'key': 'Checksheet_type_id', 'value': 7 },
            { 'key': 'company_id', 'value': company_id },
            { 'key': 'flag', 'value': 'InUse' });


        loading();
        var getdata = new Webservicecall_REST(global_wcf_url + 'EF_Js/GetCustomerCheckSheet', JSON.stringify(Param_obj), function (exe) {
            try {
                var Company_Data = exe.responseText;
                Company_Data = eval('(' + Company_Data + ')');
                var status = Company_Data[0].status;
                if (status == 1) {
                    var message1 = JSON.parse(Company_Data[0].data);
                    var op_str = '<option value="">Select Checksheet</option>';
                    $("#ddl_Checklist").append(op_str);

                    loading_hide();
                    if (message1.length == 1) {

                        var AllData = message1[0].AllData;
                        AllData = JSON.parse(AllData);
                        var step_data = AllData[0].step_data[0].step[0].data;
                        step_data = JSON.stringify(step_data);
                        var encode_step_data = encodeURIComponent(step_data);

                        //var t_str = "obj = '" + encode_step_data + "'";
                        var t_str = 'obj = "' + encode_step_data + '"';

                        var op_str = '<option value="' + message1[0].id + '" obj = "' + encode_step_data + '" selected="selected">' + message1[0].name + '</option>';
                        $("#ddl_Checklist").append(op_str);

                        get_users_by_checksheet_id();
                    }
                    else {
                        for (var i = 0; i < message1.length; i++) {
                            var AllData = message1[i].AllData;
                            AllData = JSON.parse(AllData);
                            var step_data = AllData[0].step_data[0].step[0].data;
                            step_data = JSON.stringify(step_data);
                            var encode_step_data = encodeURIComponent(step_data);

                            //var t_str = "obj = '" + encode_step_data + "'";
                            var t_str = 'obj = "' + encode_step_data + '"';

                            var webapp_user_checksheet = localStorage.getItem('webapp_user_checksheet');
                            var op_str = "";
                            if (webapp_user_checksheet == message1[i].id) {
                                op_str += '<option value="' + message1[i].id + '"  obj="' + encode_step_data + '" selected="selected">' + message1[i].name + '</option>';
                            }
                            else {
                                op_str += '<option value="' + message1[i].id + '" obj="' + encode_step_data + '">' + message1[i].name + '</option>';
                            }
                            $("#ddl_Checklist").append(op_str);
                        }

                        get_users_by_checksheet_id();
                    }
                }
                else {
                    loading_hide();
                    alert1(Company_Data[0].message);
                }
            } catch (e) {
                alert1(e);
                loading_hide();
            }
        }, onfail);
        getdata.callOtherDomain();
    }
    catch (e) {
        alert1(e + '_get_checksheet_list');
    }
}

function get_users_by_checksheet_id() {
    try {
        myApp.popup(".popup-users-company");

        var checksheet_id = $("#ddl_Checklist").val();
        if (checksheet_id == "" || checksheet_id == null || checksheet_id == undefined) { }
        else {
            var webapp_user_checksheet = $("#ddl_Checklist").find(':selected').val();
            localStorage.setItem('webapp_user_checksheet', webapp_user_checksheet);

            var Param_obj = [];
            Param_obj.push({
                'checksheetId': checksheet_id,
                'offset': 0,
                'fetch': 500,
                'searchParticularColumn': []
            });

            loading();

            var getdata = new Webservicecall_REST(global_wcf_url + 'GetUsersData', JSON.stringify(Param_obj), onsuccess_get_users_by_checksheet_id, onfail_get_users_by_checksheet_id);
            getdata.callOtherDomain();
        }
    }
    catch (e) {
        alert1(e + '_get_users_by_checksheet_id');
    }
}

function onsuccess_get_users_by_checksheet_id(e) {
    try {
        loading_hide();

        var Data_Json = e.responseText;
        Data_Json = eval('(' + Data_Json + ')');
        var status = Data_Json[0].status;
        var data = Data_Json[0].data;

        if (data == "" || data == null || data == undefined) {
            var message = Data_Json[0].message;
        }
        else {
            var message = data;
        }

        if (status == 1) {
            loading_hide();

            message = eval('(' + message + ')');
            var tbl_str = '';
            var checked_str;

            var curr_login_user = JSON.parse(storage.getItem('username'));
            var meeting_users_list = [];

            //var email = message[11];
            //var email_Array = JSON.parse(email);
            //for (e = 0; e < email_Array.length; e++) {
            //    var email_id = email_Array[e];
            //    var at_index = email_id.indexOf("@");
            //    var full_name = email_id.substring(0, at_index);
            //    message.push({
            //        'username': full_name,
            //        'login': email_id
            //    });
            //}

            for (var j = 0; j < message.length; j++) {
                var data = message[j];
                var id = message[j].id;
                var user_name = data[3];

                if (curr_login_user == user_name) { }
                else {
                    meeting_users_list.push(message[j]);
                }
            }

            for (i = 0; i < meeting_users_list.length; i++) {
                var data = meeting_users_list[i];
                var email = data[11];
                var userid = meeting_users_list[i].userId;
                var user_name = data[3];

                checked_str = "";
                for (var j = 0; j < task_users_list.length; j++) {
                    var task_userid = task_users_list[j].userid;
                    if (userid == task_userid) {
                        checked_str = "checked='checked'";
                        break;
                    }
                }

                if (i % 2 == 0) {
                    tbl_str += '<tr>';
                }

                tbl_str += '<td style="width: 50% !important;"><label class="label-checkbox item-content" style="min-height:15px;padding-left:5px;">';
                tbl_str += "<input type='checkbox' id='chk_" + userid + "' title='" + userid + "' name='" + user_name + "' " + checked_str + " />";
                tbl_str += '<div class="item-media" style="padding: 3px;"><i class="icon icon-form-checkbox" style="width:18px;height:18px;margin-right:0px;"></i></div>';
                tbl_str += '<div class="item-inner" style="min-height:15px;padding:0;margin-left:0px;"><div class="item-title">' + user_name + '</div></div></label></td>';

                if (i % 2 == 0) { }
                else {
                    tbl_str += '</tr>';
                }
            }

            $("#tbl_userList_company").empty();
            $("#tbl_userList_company").append(tbl_str);

            $("#tbl_userList_company td input:checkbox").change(function () {
                var user_id = $(this).attr('title');
                var user_name = $(this).attr('name');
                var ischecked = $(this).is(':checked');
                if (ischecked) {
                    assign_selected_user_to_task(user_id, user_name);
                }
                else {
                    unassign_user_from_task(user_id, user_name);
                }
            });
        }
        else if (status == 2) {
            loading_hide();

            var tbl_str = '';
            tbl_str += '<tr><td><label class="label-checkbox item-content">';
            tbl_str += '<div class="item-inner"><div class="item-title">No Record Found !</div></div></label></td></tr>';

            $("#tbl_userList_company").empty();
            $("#tbl_userList_company").append(tbl_str);
        }
        else {
            loading_hide();
            alert1(Data_Json[0].message);
        }
    }
    catch (e) {
        loading_hide();
        alert1(e + '_onsuccess_get_users_by_checksheet_id');
    }
}

function onfail_get_users_by_checksheet_id(e) {
    loading_hide();
    alert1(e + '_onfail_get_users_by_checksheet_id');
}

var glob_new_userid, glob_new_username;
function assign_selected_user_to_task(t_user_id, t_user_name) {
    try {
        glob_new_userid = t_user_id;
        glob_new_username = t_user_name;

        var Param_obj = [];
        Param_obj.push({
            'servertaskid': view_full_task_id,
            'user_id': t_user_id,
            'flag': 'add'
        });

        loading();

        var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_Add_Remove_Userlist_for_Chat', JSON.stringify(Param_obj), onsuccess_assign_selected_user_to_task, onfail_assign_selected_user_to_task);
        getdata.callOtherDomain();
    }
    catch (e) {
        alert1(e + '_assign_selected_user_to_task');
    }
}

function onsuccess_assign_selected_user_to_task(e) {
    try {
        var res_data = e.responseText;
        res_data = eval('(' + res_data + ')');
        var status = res_data[0].status;

        var data = res_data[0].data;
        if (data == "" || data == null || data == undefined) {
            var message = res_data[0].message;
        }
        else {
            var message = data;
        }

        var str = '';
        if (status == 1) {
            str += '<li><label class="label-checkbox item-content">';
            str += "<input type='checkbox' id='user_chk_" + glob_new_userid + "' title='" + glob_new_userid + "' name='" + glob_new_username + "'>";
            str += '<div class="item-media"><i class="icon icon-form-checkbox"></i></div>';
            str += '<div class="item-inner"><div class="item-title">' + glob_new_username + '</div></div></label></li>';

            $("#list_chatuser").append(str);
        }
        else if (status == 2) {
            $("#chk_" + glob_new_userid).attr("checked", false);
            alert1("This user does not have calling access, please edit this user to give permission!");
        }
        else {
            $("#chk_" + glob_new_userid).attr("checked", false);
            alert1(message);
        }
        loading_hide();
    }
    catch (e) {
        loading_hide();
        alert1(e + '_assign_selected_user_to_task');
    }
}

function onfail_assign_selected_user_to_task(e) {
    loading_hide();
    $("#chk_" + glob_new_userid).attr("checked", false);
    alert1(e + '_onfail_assign_selected_user_to_task');
}

function unassign_user_from_task(t_user_id, t_user_name) {
    try {
        glob_new_userid = t_user_id;
        glob_new_username = t_user_name;


        var Param_obj = [];
        Param_obj.push({
            'servertaskid': view_full_task_id,
            'user_id': t_user_id,
            'flag': 'remove'
        });


        loading();

        var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_Add_Remove_Userlist_for_Chat', JSON.stringify(Param_obj), onsuccess_unassign_user_from_task, onfail_unassign_user_from_task);
        getdata.callOtherDomain();
    }
    catch (e) {
        loading_hide();
        alert1(e + '_unassign_user_from_task');
    }
}

function onsuccess_unassign_user_from_task(e) {
    try {
        var res_data = e.responseText;
        res_data = eval('(' + res_data + ')');
        var status = res_data[0].status;

        var data = res_data[0].data;
        if (data == "" || data == null || data == undefined) {
            var message = res_data[0].message;
        }
        else {
            var message = data;
        }

        if (status == 1) {
            $("#user_chk_" + glob_new_userid).parents("li").remove();
        }
        else {
            $("#chk_" + glob_new_userid).attr("checked", true);
            alert1(message);
        }
        loading_hide();
    }
    catch (e) {
        loading_hide();
        alert1(e + '_unassign_user_from_task');
    }
}

function onfail_unassign_user_from_task(e) {
    loading_hide();
    alert1(e + '_onfail_unassign_user_from_task');
    setTimeout(function () {
        $("#chk_" + glob_new_userid).attr('checked', true);
        $("#chk_" + glob_new_userid).prop('checked', true);
    }, 100);
}

function add_selected_company_users_to_task() {
    try {
        myApp.closeModal(".popup-users-company");
        open_popup_for_chatuser_list();
    }
    catch (e) {
        loading_hide();
        alert1(e + '_add_selected_company_users_to_task');
    }
}

function plugin_call_for_zoom_meeting() {
    try {
        var user_count = $("#list_chatuser input[type=checkbox]:checked").length;
        if (user_count == 0) {
            alert1("Please select atleast one user !");
        }
        else if (user_count > 4) {
            alert1("No more than 4 users are allowed !");
        }
        else {
            var zoom_meeting = [];
            $("#list_chatuser input[type=checkbox]:checked").each(function () {
                var fcmid = $(this).attr('fcmid');
                var device_type = $(this).attr('device_type');
                var username = $(this).attr('name');
                zoom_meeting.push({
                    username: username,
                    fcmid: fcmid,
                    device_type: device_type
                });
            });

            var q_jsonobj = [];
            q_jsonobj.push({
                zoom_meeting: zoom_meeting
            });

            loading();
            cordova.exec(onsuccess_plugin_call_for_zoom_meeting, onfail_plugin_call_for_zoom_meeting, 'ZoomMeetingPlugin', 'anAction', q_jsonobj);
        }
    }
    catch (e) {
        loading_hide();
        alert1(e + '_plugin_call_for_zoom_meeting');
    }
}

function onsuccess_plugin_call_for_zoom_meeting(e) {
    try {
        loading_hide();
        //alert1('ZoomMeetingPlugin success');
    }
    catch (e) {
        loading_hide();
        alert1(e + '_onsuccess_plugin_call_for_zoom_meeting');
    }
}

function onfail_plugin_call_for_zoom_meeting(e) {
    loading_hide();
    //alert1(e + '_onfail_plugin_call_for_zoom_meeting');
}

function plugin_call_for_jitsi_meeting() {
    try {
        var user_count = $("#list_chatuser input[type=checkbox]:checked").length;
        if (user_count == 0) {
            alert1("Please select atleast one user !");
        }
        else if (user_count > 4) {
            alert1("No more than 4 users are allowed !");
        }
        else {
            var jitsi_meeting = [];
            $("#list_chatuser input[type=checkbox]:checked").each(function () {
                var fcmid = $(this).attr('fcmid');
                var device_type = $(this).attr('device_type');
                var username = $(this).attr('name');
                jitsi_meeting.push({
                    username: username,
                    fcmid: fcmid,
                    device_type: device_type,
                    task_id: view_full_task_id
                });
            });

            var q_jsonobj = [];
            q_jsonobj.push({
                zoom_meeting: jitsi_meeting
            });

            loading();
            cordova.exec(onsuccess_plugin_call_for_jitsi_meeting, onfail_plugin_call_for_jitsi_meeting, 'JitsiMeetingPlugin', 'anAction', q_jsonobj);
        }
    }
    catch (e) {
        loading_hide();
        alert1(e + '_plugin_call_for_jitsi_meeting');
    }
}

function onsuccess_plugin_call_for_jitsi_meeting(e) {
    try {
        loading_hide();
        //alert1('JitsiMeetingPlugin success');
    }
    catch (e) {
        loading_hide();
        alert1(e + '_onsuccess_plugin_call_for_jitsi_meeting');
    }
}

function onfail_plugin_call_for_jitsi_meeting(e) {
    loading_hide();
    //alert1(e + '_onfail_plugin_call_for_jitsi_meeting');
}

var glob_statusName_ary = [];
get_statusName_from_numericStatus = () => {
    try {
        var company_id = JSON.parse(storage.getItem('company_id'));
        company_id = company_id.replace(/"/g, "");
        var flow_id = JSON.parse(storage.getItem('wayflow'));

        var Company_data = [];
        Company_data.push({
            "Company_id": company_id,
            "Flow_id": flow_id,
            "Flag": "get_data"
        });

        var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_Get_ddl_Data', JSON.stringify(Company_data), function (e) {
            var response = JSON.parse(e.responseText);
            var status = response[0].status;
            var message = response[0].message;
            if (status == 1) {
                var Data = response[0]["data"];
                Data = JSON.parse(Data);
                var FSM_Data = Data[0]["FSM_Data"];

                var status_name_ary = [];
                for (i = 0; i < FSM_Data.length; i++) {
                    var Status_Name = FSM_Data[i].Status_Name;
                    var Status = FSM_Data[i].Status;
                    status_name_ary[Status] = Status_Name;
                }

                glob_statusName_ary = status_name_ary;
            }
            else {
                alert1(message);
            }


            loading_hide();

        }, onfail);
        getdata.callOtherDomain();
    }
    catch (e) {
        loading_hide();
        alert1(e + '_get_statusName_from_numericStatus');
    }
}

function send_comment_for_status_change(s_task_id, s_old_status, s_new_status) {
    try {
        var user_name = JSON.parse(storage.getItem('username'));
        var user_id = JSON.parse(storage.getItem('user_id'));
        var ms = new Date().getTime();
        var client_id = user_id + '_' + ms;

        var old_status = glob_statusName_ary[s_old_status];
        var new_status = glob_statusName_ary[s_new_status];

        var message = '<b style="font-family: sans-serif; font-size: 14px;">' + user_name + '</b> moved this task from ' + old_status + ' to ' + new_status + '.';

        var param_obj = [];
        param_obj.push({
            "subject": "",
            "message": message,
            "From": "",
            "email": [],
            "Cc": [],
            "Bcc": [],
            "contact": [],
            "server_task_id": s_task_id,
            "checksheet_id": -1,
            "step_id": -1,
            "que_id": -1,
            "client_request_id": client_id
        });

        var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_Mobile_Notification_Master', JSON.stringify(param_obj), function (e) {
            var Suc_Message = e.responseText;
            Suc_Message = eval('(' + Suc_Message + ')');
            var message = Suc_Message[0].message;
            var status = Suc_Message[0].status;
            if (status == 1) {
                $("#Commentdata").val('');

                get_sub_tasks(s_task_id);
            }
            else {
                mk_notify(message, "danger");
            }
        }, onfail);
        getdata.callOtherDomain();
    }
    catch (e) {
        loading_hide();
        alert1(e + '_send_comment_for_status_change');
    }
}

