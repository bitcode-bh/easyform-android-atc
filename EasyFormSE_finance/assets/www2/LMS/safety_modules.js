
// Safety module listing (level 1)
var glob_Module_Schedule_Id = 0;
function get_safety_module_listing() {
    $("#dv_Module_List").empty();

    let role_id_array = localStorage.getItem('role_id_array');

    var Param_obj = [];
    Param_obj.push({
        'Role_Id': role_id_array
    });

    loading();

    var getdata = new Webservicecall_REST(global_wcf_url_lms + 'LMS_Select_Module_RoleWise', JSON.stringify(Param_obj), function (e) {
        var responseText = e.responseText;
        var myArray = JSON.parse(responseText);
        var status = myArray[0].status;
        if (status == 1) {
            let data = myArray[0]["data"];
            data = JSON.parse(data);

            for (let m = 0; m < data.length; m++) {
                let Module_Id = data[m].Module_Id;
                let Module_Name = data[m].Module_Name;
                let Module_Description = data[m].Module_Description;
                let Module_Schedule_Id = data[m].Module_Schedule_Id;

                let Thumbnail_link = data[m].Thumbnail_link;
                if (Thumbnail_link == "" || Thumbnail_link == null || Thumbnail_link == undefined) {
                    Thumbnail_link = "images/bg2.jpg";
                }

                let Progress = data[m].Progress;
                if (Progress == "" || Progress == null || Progress == undefined) {
                    Progress = "0";
                }
                else {
                    Progress = Math.round(Progress);
                }

                let Score = data[m].Score;
                if (Score == "" || Score == null || Score == undefined) {
                    Score = "0"
                }

                let TotalSkill = data[m].TotalSkill;
                let TotalQuestion = data[m].TotalQuestion;
                let SubmitedQuestion = data[m].SubmitedQuestion;
                let SubmitedSkill = data[m].SubmitedSkill;

                let onclick_str = "get_target_skill_by_module_id('" + Module_Id + "', '" + Progress + "', '" + SubmitedSkill + "', '" + Module_Schedule_Id + "')";

                let str = '<div class="sample-module-card" Module_Id="' + Module_Id + '" onclick="' + onclick_str + '">';

                //let score_id = 'score_' + Module_Id + '';
                //str += '<div id=' + score_id + ' class="module-overlay" style="display:none"><div class="overlay-text">Score</div></div>';

                str += '<div class="sample-module-image" >';
                str += '<img src="' + Thumbnail_link + '">';
                str += '<span class="sample-module-tag">Safety</span>';

                if (SubmitedSkill > 0) {
                    str += '<span class="sample-score-tag">Score: ' + Score + '/' + TotalQuestion + '</span>';
                }
                str += '</div>';
                str += '<div class="sample-module-card-body">';
                str += '<div class="sample-module-title">' + Module_Name + '</div>';
                str += '<div class="sample-module-desc">' + Module_Description + '</div>';
                str += '<div class="sample-module-meta">';
                str += '<div class="sample-module-lessons">';
                str += '<span class="sample-module-help"><i class="fa fa-book-open"></i></span>';
                str += '<span class="sample-lession-count">' + TotalSkill + ' lessons</span>';
                str += '</div>';
                str += '<div class="sample-module-percent">' + Progress + '%</div>';
                str += '</div>';
                str += '<div class="sample-module-progress"><span style="width:' + Progress + '%"></span></div>';
                str += '</div>';
                str += '</div>';

                $("#dv_Module_List").append(str);

                //get_target_skill_tag_by_module_id(Module_Id);
            }
        }
        else {
            var message = myArray[0].message;
            alert(message);
            myApp.popup.close('.popup-level-2');
        }

        loading_hide();

    }, onfail);
    getdata.callOtherDomain();
}

var module_progress_array = [];

// adding skill tag in module listing (level 1)
function get_target_skill_tag_by_module_id(Module_Id) {
    var Param_obj = [];
    Param_obj.push({
        'Module_Id': Module_Id
    });
    loading();

    var getdata = new Webservicecall_REST(global_wcf_url_lms + 'LMS_Select_Skill_Master_By_ModuleId', JSON.stringify(Param_obj), function (e) {
        var responseText = e.responseText;
        var myArray = JSON.parse(responseText);
        var status = myArray[0].status;
        if (status == 1) {
            let data = myArray[0]["data"];
            data = JSON.parse(data);

            $("div[Module_Id='" + Module_Id + "']").find(".sample-lession-count").html(data.length + " lessons");

            let str = '';

            //for (let m = 0; m < data.length; m++) {
            //    let Skill_Id = data[m].Skill_Id;
            //    let Skill_Name = data[m].Skill_Name;
            //    let Video_Link = data[m].Video_Link;

            //    str += '<div class="module-pill">' + Skill_Name + '</div>';
            //}

            let Skill_Id = data[0].Skill_Id;
            let Skill_Name = data[0].Skill_Name;
            let Video_Link = data[0].Video_Link;

            let skill_Array = Skill_Name.split(",");
            for (let m = 0; m < skill_Array.length; m++) {
                let t_Skill_Name = skill_Array[m];
                str += '<div class="module-pill mr-1">' + t_Skill_Name + '</div>';
            }

            $("div[Module_Id='" + Module_Id + "']").find(".module-image").append(str);

            //let onclick_str = "get_question_by_skill_id('" + Skill_Id + "', '" + Video_Link + "', '" + Module_Id + "')";

            //  let onclick_str = "get_questionlog_by_skill_id('" + Skill_Id + "', '" + Video_Link + "', '" + Module_Id + "')";
            //$("div[Module_Id='" + Module_Id + "']").attr("onclick", onclick_str);

            get_progess_by_module(Module_Id, Skill_Id)
        }
        else if (status == 3) {
            $("div[Module_Id='" + Module_Id + "']").find(".sample-lession-count").html("0 lessons");
            var message = myArray[0].message;
            alert(message);
        }

        loading_hide();

    }, onfail);
    getdata.callOtherDomain();
}
function get_progess_by_module(Module_Id, Skill_Id) {
    var user_id = JSON.parse(storage.getItem('user_id'));
    var Param_obj = [];
    Param_obj.push({
        "User_Id": user_id,
        "Module_Id": Module_Id,
        "Course_Id": 0,
        "Skill_Id": Skill_Id
    });
    loading();

    var getdata = new Webservicecall_REST(global_wcf_url_lms + 'LMS_Select_User_Assessment_Rating', JSON.stringify(Param_obj), function (e) {
        var responseText = e.responseText;
        var myArray = JSON.parse(responseText);
        var status = myArray[0].status;
        if (status == 1) {

            let data = JSON.parse(myArray[0]["data"])
            let module_id = data[0].Module_Id;
            let Score = data[0].Score;
            let total_score = data[0].Total_Score;
            let question_count = data[0].question_count;
            let question_log_count = data[0].question_log_count;

            if (question_count == question_log_count) {
                // score logic
                let score_percent = (Score / total_score) * 100;
                let score_id = '#score_' + module_id + '';
                $(score_id).show();
                $(score_id).find('.overlay-text').html(`Score ${score_percent}%`);

                // progress logic
                let progress = (question_log_count / question_count) * 100;
                progress = Math.round(progress);

                let div_id = '#progress_' + module_id + '';
                $(div_id).css('width', progress + '%');

                $("div[Module_Id='" + Module_Id + "']").find(".sample-module-percent").html(progress + "%")
                $("div[Module_Id='" + Module_Id + "']").find(".sample-module-progress").find("span").css('width', progress + '%');

                let curr_card = $(score_id).closest(".module-card")[0];
                $(curr_card).addClass("disabled");
            }
        }
        else if (status == 3) {
            var message = myArray[0].message;
            alert(message);
        }

        loading_hide();

    }, onfail);
    getdata.callOtherDomain();
}


// get modulewise videos (level 2)
function get_target_skill_by_module_id(Module_Id, Progress, SubmitedSkill, Module_Schedule_Id) {

    glob_Module_Schedule_Id = Module_Schedule_Id;

    myApp.popup.open('.lms-module-preview-popup');
    $(".lesson-preview-list").empty();

    var Param_obj = [];
    Param_obj.push({
        'Module_Id': Module_Id
    });
    loading();

    var getdata = new Webservicecall_REST(global_wcf_url_lms + 'LMS_Select_Skill_Master_RoleWise', JSON.stringify(Param_obj), function (e) {
        var responseText = e.responseText;
        var myArray = JSON.parse(responseText);
        var status = myArray[0].status;

        let module_bg = $("#dv_Module_List").find("div[Module_Id='" + Module_Id + "']").find("div.sample-module-image").find("img").attr("src");
        $(".module-preview-header").css("background-image", "linear-gradient(180deg, rgba(6, 18, 66, 0.45), rgba(4, 6, 20, 0.82)), url('" + module_bg + "')");

        let module_title = $("#dv_Module_List").find("div[Module_Id='" + Module_Id + "']").find("div.sample-module-title").html();
        $(".module-preview-title").html(module_title);

        let module_description = $("#dv_Module_List").find("div[Module_Id='" + Module_Id + "']").find("div.sample-module-desc").html();
        $(".module-preview-desc").html(module_description);

        $(".module-preview-percent").html(Progress + "%");
        $(".module-preview-progress").find("span").css("width", "" + Progress + "%");


        if (status == 1) {
            let data = myArray[0]["data"];
            data = JSON.parse(data);

            $(".lession-count").html(data.length + " lessons - " + SubmitedSkill + " completed");

            for (let m = 0; m < data.length; m++) {
                let Skill_Id = data[m].Skill_Id;
                let Skill_Name = data[m].Skill_Name;
                let Skill_Description = data[m].Skill_Description;
                let Video_Link = data[m].Video_Link;

                let Progress = data[m].Progress;
                if (Progress == "" || Progress == null || Progress == undefined) {
                    Progress = "0";
                }
                else {
                    Progress = Math.round(Progress);
                }

                let Score = data[m].Score;
                if (Score == "" || Score == null || Score == undefined) {
                    Score = "0"
                }

                let TotalQuestion = data[m].TotalQuestion;
                let SubmitedQuestion = data[m].SubmitedQuestion;

                let onclick_str = "get_questionlog_by_skill_id('" + Skill_Id + "', '" + Video_Link + "', '" + Module_Id + "', '" + Progress + "')";

                let str = '<a href="#" class="lesson-preview-card" onclick="' + onclick_str + '">';
                str += '<div class="lesson-preview-thumb" >';
                str += '<img src="images/bg2.jpg">';
                str += '<span class="lesson-preview-check"><i class="fa fa-check"></i></span>';
                str += '</div>';
                str += '<div>';
                str += '<div class="lesson-preview-name">' + Skill_Name + '</div>';
                str += '<div class="lesson-preview-subtitle">' + Skill_Description + '</div>';
                str += '<div class="lesson-preview-footer">';
                str += '<span class="lesson-preview-time"><i class="fa-regular fa-clock"></i>6 min</span>';

                if (Progress == "100") {
                    str += '<span class="lesson-preview-status completed">Completed</span>';
                    str += '<span class="badge color-green">' + TotalQuestion + '</span>';
                }
                else {
                    str += '<span class="lesson-preview-status progress">Pending</span>';
                    str += '<span class="badge color-orange">' + TotalQuestion + '</span>';
                }

                str += '</div>';
                str += '</div>';
                str += '<div class="lesson-preview-next"><i class="fa fa-chevron-right"></i></div>';
                str += '</a> ';

                $(".lesson-preview-list").append(str);

            }
        }
        else {
            $(".lession-count").html("0 lessons - 0 completed");

            if (status == 2) {
                $(".lesson-preview-list").append("No lession found");
            }
            else {
                var message = myArray[0].message;
                $(".lesson-preview-list").append(message);
            }
            myApp.popup.close('.popup-level-3');
        }

        loading_hide();

    }, onfail);
    getdata.callOtherDomain();
}


// get videowise question listing (level 3)

var log_data = [];
function get_questionlog_by_skill_id(Skill_Id, Video_Link, Module_Id, Progress) {

    myApp.popup.open('.popup-level-4');
    $("#dv_Question_List").empty();

    $("#vdo_Question").attr("src", Video_Link);
    $("#vdo_Question").attr("skil_id", Skill_Id);
    $("#vdo_Question").attr("Module_Id", Module_Id);
    let vdo_Description = $("#dv_Module_List").find("div[Module_Id='" + Module_Id + "']").find("div.sample-module-desc").html();
    $("#vdo_Description").html(vdo_Description);

    //if (Progress == "100") {
    //    return false;
    //}

    var user_id = JSON.parse(storage.getItem('user_id'));
    var Param_obj = [];
    Param_obj.push({
        'Skill_Id': Skill_Id,
        'User_ID': user_id,
        'Module_Schedule_Id': glob_Module_Schedule_Id
    });
    loading();

    var getdata = new Webservicecall_REST(global_wcf_url_lms + 'LMS_Select_Skill_Question_Log_Master_BySkillId', JSON.stringify(Param_obj), function (e) {
        var responseText = e.responseText;
        var myArray = JSON.parse(responseText);
        var status = myArray[0].status;
        if (status == 1) {
            let data = myArray[0]["data"];
            log_data = JSON.parse(data);

        }
        else {
            var message = myArray[0].message;
            log_data = [];
        }


        loading_hide();
        get_question_by_skill_id(Skill_Id, Video_Link, Module_Id, Progress)

    }, onfail);
    getdata.callOtherDomain();
}

function get_question_by_skill_id(Skill_Id, Video_Link, Module_Id, Progress) {

    var Param_obj = [];
    Param_obj.push({
        'Skill_Id': Skill_Id
    });
    loading();

    var getdata = new Webservicecall_REST(global_wcf_url_lms + 'LMS_Select_Skill_Questions_Master_by_Skill_Id', JSON.stringify(Param_obj), function (e) {
        var responseText = e.responseText;
        var myArray = JSON.parse(responseText);
        var status = myArray[0].status;
        if (status == 1) {
            let data = myArray[0]["data"];
            data = JSON.parse(data);

            let t_log_data = log_data;
            var merge_array = merge_question_data(data, t_log_data);

            for (let i = 0; i < merge_array.length; i++) {
                let skill_que_id = merge_array[i].Skill_Que_Id;
                let skill_que_name = merge_array[i].Skill_Question_Name;
                let optionsArray = merge_array[i].OptionText;
                let IsActive = merge_array[i].IsActive;
                let weightage = merge_array[i].Weightage;
                if (weightage == "" || weightage == null || weightage == undefined) {
                    weightage = 1;
                }
                let Valid_Answer = merge_array[i].Valid_Answer[0];
                let ans_label = merge_array[i].ans;

                let str = '<div class="question-card">';
                str += '<div class="question-title" skill_que_id=' + skill_que_id + ' IsActive=' + IsActive + '>' + skill_que_name + '</div>';

                for (let j = 0; j < optionsArray.length; j++) {
                    let op_text = optionsArray[j].trim();

                    if (Progress == "100") {
                        // log found

                        if (op_text === Valid_Answer) {

                            // Highlight the correct answer
                             str += '<div class="option correct-answer">';

                        }
                        else {
                            str += '<div class="option">';
                        }
                    }
                    else {
                        // log not found
                        str += '<div class="option">';
                    }

                    if (ans_label == op_text) {
                        str += '<input type="checkbox" alt="' + weightage + '" id="' + skill_que_id + '_' + j + '" checked="checked" style="font-weight: bold">';
                    }
                    else {
                        str += '<input type="checkbox" alt="' + weightage + '" id="' + skill_que_id + '_' + j + '">';
                    }

                    str += '<label for="' + skill_que_id + '_' + j + '">' + op_text + '</label>';
                    str += '</div>';
                }

                $("#dv_Question_List").append(str);

            }

            if (Progress == "100") {
                $("#dv_Question_List").find("input[type='checkbox']").attr("disabled", "disabled");
                $("#dv_Question_List").show();
            }
            else {
                let on_submit = "submit_question_by_skill_id('submit')";
                let btn_str = '<div id="vdo_btn_div" class="buttons-row">'
                btn_str += '<a href="#" class="button button-fill color-gray" onclick="' + on_submit + '">Submit</a>'
                btn_str += '</div>'
                $("#dv_Question_List").append(btn_str);
            }

            document.querySelectorAll('.question-card').forEach(card => {
                const checkboxes = card.querySelectorAll('input[type="checkbox"]');
                // select only one option in checkbox
                checkboxes.forEach(cb => {
                    cb.addEventListener('change', function () {
                        if (this.checked) {
                            checkboxes.forEach(other => {
                                if (other !== this) other.checked = false;
                            });
                        }
                    });
                });
            });

        }
        else {
            var message = myArray[0].message;
            alert(message);
            myApp.popup.close('.popup-level-4');
        }

        loading_hide();

    }, onfail);
    getdata.callOtherDomain();
}

function merge_question_data(template_data, log_data) {
    for (i = 0; i < template_data.length; i++) {
        var bl_que_id = template_data[i].Skill_Que_Id;
        for (j = 0; j < log_data.length; j++) {
            var rs_que_id = log_data[j].Skill_Que_Id;
            if (rs_que_id == bl_que_id) {
                var rs_ans = log_data[j].Ans;
                template_data[i].ans = rs_ans;
                break;
            }
        }
    }

    return template_data;
}

function submit_question_by_skill_id(flag) {
    let Param_obj = [];
    let questionCards = $('#dv_Question_List .question-card');

    for (let i = 0; i < questionCards.length; i++) {
        let questionCard = questionCards[i];
        let questionName = questionCard.querySelector('.question-title').textContent.trim();
        let checkboxes = questionCard.querySelectorAll('input[type="checkbox"]');

        let selectedAns = [];

        for (let j = 0; j < checkboxes.length; j++) {
            if (checkboxes[j].checked) {
                selectedAns.push(checkboxes[j].nextElementSibling.textContent.trim());
            }
        }

        let is_valid = 1;
        if (flag == 'submit') {
            if (selectedAns.length == 0) {
                is_valid = 0;
                alert("Please select value.");
                return false;
            }
        }
        if (flag == 'savenexit') {
            if (selectedAns.length == 0) {
                is_valid = 0;
            }
        }

        if (is_valid == 1) {
            let firstId = checkboxes[0]?.id || "";
            let Skill_Que_Id = $(questionCard).find('.question-title').attr('skill_que_id');
            let is_active = $(questionCard).find('.question-title').attr('IsActive');

            var user_id = JSON.parse(storage.getItem('user_id'));
            var user_name = JSON.parse(storage.getItem('user_name'));
            var circle_name = JSON.parse(storage.getItem('circle_name'));
            var Skill_Id = $("#vdo_Question").attr("skil_id");

            Param_obj.push({
                "User_ID": user_id,
                "User_Name": user_name,
                "Skill_Id": Skill_Id,
                "Skill_Que_Id": Skill_Que_Id,
                "Skill_Question_Name": questionName,
                "Ans": selectedAns,
                "Circle": circle_name,
                "Module_Schedule_Id": glob_Module_Schedule_Id
            });
        }
    }
    loading();
    var getdata = new Webservicecall_REST(global_wcf_url_lms + 'LMS_InsertUpdateDelete_Skill_Question_Log_Master', JSON.stringify(Param_obj), function (e) {
        var responseText = e.responseText;
        var myArray = JSON.parse(responseText);
        var status = myArray[0].status;
        if (status == 1) {
            if (flag == "submit") {
                // submit button call
                get_video_skill_by_module_id(flag);
                myApp.popup.close('.popup-level-4')
            }
            else {
                // save button call 
                call_by_videolog('log_save');
            }
        }
        else {
            var message = myArray[0].message;
            alert(message);
        }

        loading_hide();

    }, onfail);
    getdata.callOtherDomain();
}

// video submit
function get_video_skill_by_module_id(flag) {
    var Skill_Id = $("#vdo_Question").attr("skil_id");
    var user_id = JSON.parse(storage.getItem('user_id'));
    var user_name = JSON.parse(storage.getItem('user_name'));
    var circle_name = JSON.parse(storage.getItem('circle_name'));

    var video = $("#vdo_Question")[0]; // DOM object

    var currentTime = video.currentTime;
    var duration = video.duration;

    var progress = 0;

    if (duration > 0) {
        progress = (currentTime / duration) * 100;
    }

    progress = progress.toFixed(0)

    var Param_obj = [];
    Param_obj.push({
        "Flag": "INSERT",
        "Skill_Id": Skill_Id,
        "Progress": progress,
        "User_ID": user_id,
        "User_Name": user_name,
        "Circle": circle_name
    });
    loading();

    var getdata = new Webservicecall_REST(global_wcf_url_lms + 'LMS_Skill_VideoLog_Master', JSON.stringify(Param_obj), function (e) {
        var responseText = e.responseText;
        var myArray = JSON.parse(responseText);
        var status = myArray[0].status;
        if (status == 1) {
            //myApp.popup.close('.popup-level-4');
        }
        else {
            var message = myArray[0].message;
            alert(message);
        }

        if (flag == 'submit') {
            // submit button call
            call_by_videolog(flag);
        }

        loading_hide();

    }, onfail);
    getdata.callOtherDomain();
}

// video related logic ------//// 
var progressInterval = null;
set_progress = () => {
    progressInterval = setInterval(function () {
        set_progress_local();
        console.log("Saved after 10 sec");
    }, 10000);
}

set_progress_local = () => {
    var video = $("#vdo_Question")[0];

    var skillId = $(video).attr("skil_id");
    var moduleId = $(video).attr("module_id");

    var currentTime = video.currentTime;
    var duration = video.duration;

    var progress = 0;
    if (duration > 0) {
        progress = (currentTime / duration) * 100;
    }

    progress = progress.toFixed(0)
    var currentProgress = progress;


    var existing = JSON.parse(localStorage.getItem('video_progress_' + skillId)) || [];
    var found = false;
    existing.forEach(function (item) {
        if (item.Skill_Id == skillId) {
            item.Progress = currentProgress;
            item.currentTime = currentTime;
            found = true;
        }
    });

    if (!found) {
        existing.push({
            Skill_Id: skillId,
            currentTime: currentTime,
            Progress: currentProgress
        });
    }

    localStorage.setItem('video_progress_' + skillId + '', JSON.stringify(existing));
}

function call_by_videolog(flag) {
    var user_id = JSON.parse(storage.getItem('user_id'));
    var Skill_Id = $("#vdo_Question").attr("skil_id");
    var Module_Id = $("#vdo_Question").attr("Module_Id");

    let status = "";
    if (flag == 'start') {
        status = '0';  // video start
    }
    else if (flag == 'log_save') {
        status = '1'; // save button
    }
    else if (flag == 'submit') {
        status = '2'; // submit button
    }

    var Param_obj = [];
    Param_obj.push({
        "User_Id": user_id,
        "Module_Id": Module_Id,
        "Course_Id": 0,
        "Skill_Id": Skill_Id,
        "Status": status
    });

    loading();

    var getdata = new Webservicecall_REST(global_wcf_url_lms + 'LMS_InsertUpdate_User_Assessment_Rating', JSON.stringify(Param_obj), function (e) {
        var responseText = e.responseText;
        var myArray = JSON.parse(responseText);
        var status = myArray[0].status;
        if (status == 1) {
            if (flag == 'log_save') {
                myApp.popup.close('.popup-level-4');
            }
            else if (flag == 'submit') {
                myApp.popup.close('.popup-level-4');
                myApp.popup.close('.lms-module-preview-popup');
                get_safety_module_listing();
            }
        }
        loading_hide();

    }, onfail);
    getdata.callOtherDomain();

}






















































// Un used code
//function get_safety_module_listing_old() {
//    $("#dv_Module_List").empty();

//    var Param_obj = [];
//    Param_obj.push({
//        'Course_Id': 0
//    });

//    loading();

//    var getdata = new Webservicecall_REST(global_wcf_url_lms + 'LMS_Select_Module_Master_By_CourseId', JSON.stringify(Param_obj), function (e) {
//        var responseText = e.responseText;
//        var myArray = JSON.parse(responseText);
//        var status = myArray[0].status;
//        if (status == 1) {
//            let data = myArray[0]["data"];
//            data = JSON.parse(data);

//            for (let m = 0; m < data.length; m++) {
//                let Module_Id = data[m].Module_Id;
//                let Module_Name = data[m].Module_Name;
//                let Module_Description = data[m].Module_Description;
//                let Thumbnail_link = data[m].Thumbnail_link;

//                let onclick_str = "get_target_skill_by_module_id('" + Module_Id + "')";
//                let str = '<div class="module-card" Module_Id="' + Module_Id + '" onclick="' + onclick_str + '">';

//                let score_id = 'score_' + Module_Id + '';
//                str += '<div  id=' + score_id + ' class="module-overlay" style="display:none"><div class="overlay-text">Score</div></div>';

//                str += '<div class="card-content">';
//                str += '<div class="module-image">';

//                if (Thumbnail_link == "" || Thumbnail_link == null || Thumbnail_link == undefined) {
//                    str += '<img src="images/no_image.png" alt="Course 1" style="padding: 15px;">';
//                }
//                else {
//                    str += '<img src="' + Thumbnail_link + '" alt="Course 1">';
//                }

//                //str += '<div class="skill-btn">Target Skill</div>';
//                str += '</div>';

//                str += '<div class="module-content">';
//                str += '<div class="module-title">' + Module_Name + '</div>';
//                str += '<div class="module-desc">' + Module_Description + '</div>';
//                str += '</div></div>';

//                let progress_id = 'progress_' + Module_Id + '';
//                str += '<div id=' + progress_id + ' class="module-progress-line"></div>';
//                str += '</div>';

//                $("#dv_Module_List").append(str);

//                get_target_skill_tag_by_module_id(Module_Id);
//            }
//        }
//        else {
//            var message = myArray[0].message;
//            alert(message);
//            myApp.popup.close('.popup-level-2');
//        }

//        loading_hide();

//    }, onfail);
//    getdata.callOtherDomain();
//}