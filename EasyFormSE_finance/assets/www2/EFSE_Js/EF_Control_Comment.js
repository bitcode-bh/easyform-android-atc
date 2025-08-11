
var glob_cntrl_que_id = '', glob_cntrl_que_name = '';
var cntrl_cmnt_popover = '';
var popover_scroll = 0;
function show_control_wise_comments_for_filled_form(curr_clps_new_id, checksheet_id) {
    try {
        for (var q = 0; q < uniq_cmnt_que_id_ary.length; q++) {
            var uniq_que_id = uniq_cmnt_que_id_ary[q];
            ////===fix comment icon if found any comment in pageload api response [FT - 03052024]
            //$(".cntrl_main_div[que_id=" + uniq_que_id + "]").find('.cls-cntrl-comment-outer').css('opacity', '1');
            //$(".cntrl_main_div[que_id=" + uniq_que_id + "]").find('.notification-counter').show();

            //$("div.cntrl_main_div[id$=" + checksheet_id + "_" + uniq_que_id + "]").find('.cls-cntrl-comment-outer').css('opacity', '1');
            //$("div.cntrl_main_div[id$=" + checksheet_id + "_" + uniq_que_id + "]").find('.notification-counter').show();

            ////===changes for swipe right comment icon [FT-12022025]
            $("div.cntrl_main_div[id$=" + checksheet_id + "_" + uniq_que_id + "]").siblings('.cls-cntrl-comment-outer').css('opacity', '1');
            $("div.cntrl_main_div[id$=" + checksheet_id + "_" + uniq_que_id + "]").siblings('.cls-cntrl-comment-outer').find('.notification-counter').show();

        }

        //var cls_cntrl_main_div = $(".cntrl_main_div");
        //$(cls_cntrl_main_div).each(function () {
        //    var cntrl_que_id = $(this).attr('que_id');
        //    var cntrl_que_name = $(this).find('label.lbl_type5').html();
        //    //$(this).find('.cls-cntrl-comment-outer .cls-cmnt-cntrl').attr('cntrl_checksheet_id', checksheet_id);
        //    $(this).find('.cls-cntrl-comment-outer .cls-cmnt-cntrl').attr('cntrl_que_id', cntrl_que_id);
        //    //$(this).find('.cls-cntrl-comment-outer .cls-cmnt-cntrl').attr('cntrl_que_name', cntrl_que_name);
        //});

        $('.icon-cntrl-cmnt.cls-cmnt-cntrl').on('click', function (e) {
            e.stopPropagation();

            var cntrl_que_id = $(this).attr('cntrl_que_id');
            glob_cntrl_que_id = cntrl_que_id;
            var cntrl_que_name = $(this).attr('cntrl_que_name');
            glob_cntrl_que_name = cntrl_que_name;

            var cntrl_checksheet_id = $(this).attr('cntrl_checksheet_id');

            //---set dynamic popover header
            $('.popup-control-comment').find('.popover-header').html(cntrl_que_name);

            get_control_wise_comments_for_filled_form(this, cntrl_checksheet_id, cntrl_que_id, cntrl_que_name);
        });

    }
    catch (e) {
        loading_hide();
        alert(e + '_show_control_wise_comments_for_filled_form');
    }
}

function get_control_wise_comments_for_filled_form(t_obj, check_type, cntrl_que_id, cntrl_que_name) {
    try {
        myApp.popup(".popup-control-comment");

        var server_task_id = JSON.parse(storage.getItem('server_task_id'));

        var param_obj = [];
        param_obj.push({
            "server_task_id": server_task_id,
            "checksheet_id": check_type,
            "step_id": 1,
            "que_id": cntrl_que_id
        });

        var getdata = new Webservicecall_REST(global_wcf_url + 'Select_comment', JSON.stringify(param_obj), function (e) {
            var responseText = JSON.parse(e.responseText);
            var status = responseText[0].status;
            if (status == 1) {
                var comment_data = responseText[0].data;
                comment_data = comment_data.reverse();
            }
            else {
                var comment_data = [];
            }

            var popoverHTML_str = append_cntrl_commnet_ui_on_btn_click(check_type, comment_data, cntrl_que_name);
            $("#container_control_comment").empty();
            $("#container_control_comment").append(popoverHTML_str);
            $('.popup-control-comment').find('.messages-content').scrollTop(9999);

            loading_hide();
        }, function (e) {
            loading_hide();
        });
        getdata.callOtherDomain();
    }
    catch (e) {
        loading_hide();
        alert(e + '_get_control_wise_comments_for_filled_form');
    }
}

var curr_cmnt_chksht_id = '';
function append_cntrl_commnet_ui_on_btn_click(checksheet_id, t_comment_data, cntrl_que_name) {
    try {
        var comment_data = t_comment_data;
        var popoverHTML = '';
        var username_clr_ary = [];
        curr_cmnt_chksht_id = checksheet_id;

        popoverHTML += '<div class="messages-content" style="height:91%;padding-top:10px;overflow:auto;">';
        popoverHTML += '<div class="messages">';

        for (var b = 0; b < comment_data.length; b++) {
            var message = comment_data[b].Message;
            var username_index = message.indexOf(' has commented');
            var username = message.substring(0, username_index);
            var txt_color = Math.floor(Math.random() * 16777215).toString(16);
            var user_check = username_clr_ary[username];
            if (user_check == "" || user_check == null || user_check == undefined) {
                username_clr_ary[username] = txt_color;
            }
        }

        for (var c = 0; c < comment_data.length; c++) {
            var message = comment_data[c].Message;
            //var message = 'Username has commented on Que Name: This is sample comment';
            var Inserted_DTTM = comment_data[c].Inserted_DTTM;
            var d = new Date(Inserted_DTTM)
            var h_modified_date = formatAMPM(d);

            var Que_id = comment_data[c].Que_id;
            var checksheet_id = comment_data[c].Checksheet_id;
            curr_cmnt_chksht_id = checksheet_id;

            var username_index = message.indexOf(' has commented');
            var username = message.substring(0, username_index);
            var curr_login_user = JSON.parse(storage.getItem('username'));

            var msg_data_index = message.indexOf(': ');
            var msg_data = message.substring(msg_data_index + 1);
            msg_data = msg_data.trim();

            var short_username = '';
            var comment_username = username;
            if (comment_username == '' || comment_username == null || comment_username == undefined) { }
            else {
                var name_Array = comment_username.split(".");
                for (n = 0; n < name_Array.length; n++) {
                    short_username += name_Array[n].charAt(0);
                }
            }

            short_username = short_username.substring(0, 2);
            //var txt_color = Math.floor(Math.random() * 16777215).toString(16);
            var txt_color = username_clr_ary[username];
            var cls_indent = "";
            if (curr_login_user == comment_username) {
                cls_indent = "cls-self-user-div";
            }

            if (glob_cntrl_que_id == Que_id) {
                if (curr_login_user == comment_username) {
                    popoverHTML += '<div class="message message-sent">';
                    popoverHTML += '<div class="message-text">';
                    popoverHTML += '<span class="cls-msg">' + msg_data + '</span>';
                    popoverHTML += '<div class="messages-date">' + h_modified_date + '</div>';
                    popoverHTML += '</div>';
                    popoverHTML += '</div>';
                }
                else {
                    popoverHTML += '<div class="message message-received message-with-avatar">';
                    popoverHTML += '<div class="message-text">';
                    popoverHTML += '<div class="message-name" style="color:#' + txt_color + ';">' + username + '</div>';
                    popoverHTML += '<span class="cls-msg">' + msg_data + '</span>';
                    popoverHTML += '<div class="messages-date">' + h_modified_date + '</div>';
                    popoverHTML += '</div>';
                    popoverHTML += '<div class="message-avatar"><span class="msg-user-initial" style="background-color: #' + txt_color + '">' + short_username + '</span></div>';
                    popoverHTML += '</div>';
                }
            }
        }

        popoverHTML += '</div>';
        popoverHTML += '</div>';

        //var param_click = "send_cntrl_comment_for_filled_form('" + checksheet_id + "')";

        return popoverHTML;
    }
    catch (e) {
        loading_hide();
        alert(e + '_append_cntrl_commnet_ui_on_btn_click');
    }
}

function send_cntrl_comment_for_filled_form_PRE(event) {
    try {
        var message_txt = $("#txt_cntrl_comment").val();
        if (message_txt == "" || message_txt == null || message_txt == undefined) {
            $("#btn_Send_Cntrl_Comment i").removeClass('fa-send');
            $("#btn_Send_Cntrl_Comment i").addClass('fa-microphone');
            $("#btn_Send_Cntrl_Comment").attr('title', 'Start Recording');
            if (event.keyCode == 13) {
                $("#txt_cntrl_comment").blur();
                $("#txt_cntrl_comment").css('border-color', 'red');
            }
        }
        else {
            $("#btn_Send_Cntrl_Comment i").removeClass('fa-microphone');
            $("#btn_Send_Cntrl_Comment i").addClass('fa-send');
            $("#btn_Send_Cntrl_Comment").attr('title', 'Add Comment');

            if (event.keyCode === 13) {
                //enter button press
                send_cntrl_comment_for_filled_form();
            }
        }
    }
    catch (e) {
        alert(e + '_send_cntrl_comment_for_filled_form_PRE');
    }
}
function send_cntrl_comment_for_filled_form() {
    try {
        var message_txt = $("#txt_cntrl_comment").val();
        if (message_txt == "" || message_txt == null || message_txt == undefined) {
            $("#btn_Send_Cntrl_Comment").removeClass('mkBtn');
            $("#btn_Send_Cntrl_Comment").addClass('btn-success');
            startDictation();
        }
        else {
            loading();

            var server_task_id = JSON.parse(storage.getItem('server_task_id'));
            var user_id = window.storage.getItem("user_id");
            var ms = new Date().getTime();
            var client_id = user_id + '_' + ms;

            var user_name = JSON.parse(storage.getItem("username"));
            var new_msg_str = user_name + ' has commented on ' + glob_cntrl_que_name + ': ' + message_txt;

            var param_obj = [];
            param_obj.push({
                "subject": '',
                "message": new_msg_str,
                "From": "",
                "email": [],
                "Cc": [],
                "Bcc": [],
                "contact": [],
                "server_task_id": server_task_id,
                "checksheet_id": curr_cmnt_chksht_id,
                "step_id": 1,
                "que_id": glob_cntrl_que_id,
                "client_request_id": client_id,
                "flag": "comment",
                "index": 0               // type22 new id - cannot be 0 in case of control inside invoice 080524 - mk
            });

            var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_Mobile_Notification_Master', JSON.stringify(param_obj), function (e) {
                var responseText = JSON.parse(e.responseText);
                var status = responseText[0].status;
                if (status == 1) {
                    $("#txt_cntrl_comment").val('');
                    $('.popup-control-comment').find('.messages-content').scrollTop(9999);
                }
                else {
                    loading_hide();
                    alert(responseText[0].message);
                }

                loading_hide();

                $(".cls-cmnt-cntrl[cntrl_checksheet_id=" + curr_cmnt_chksht_id + "][cntrl_que_id=" + glob_cntrl_que_id + "]").trigger('click');


            }, onfail);
            getdata.callOtherDomain();
        }
    }
    catch (e) {
        loading_hide();
        alert(e + '_send_cntrl_comment_for_filled_form');
    }
}

function formatAMPM(date) {
    var month_Array = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0' + minutes : minutes;
    var day = date.getDate();
    var month = month_Array[date.getMonth()];

    var strTime = day + ' ' + month + ' ' + hours + ':' + minutes + ' ' + ampm;
    return strTime;
}

function startDictation() {
    if (window.hasOwnProperty('webkitSpeechRecognition')) {
        var recognition = new webkitSpeechRecognition();

        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.lang = 'en-US';
        recognition.start();

        recognition.onresult = function (e) {
            document.getElementById('txt_cntrl_comment').value = e.results[0][0].transcript;
            recognition.stop();
            $("#btn_Send_Cntrl_Comment").removeClass('btn-success');
            $("#btn_Send_Cntrl_Comment").addClass('mkBtn');
            $("#btn_Send_Cntrl_Comment i").removeClass('fa-microphone');
            $("#btn_Send_Cntrl_Comment i").addClass('fa-send');
        };

        recognition.onerror = function (e) {
            recognition.stop();
        };
    }
}