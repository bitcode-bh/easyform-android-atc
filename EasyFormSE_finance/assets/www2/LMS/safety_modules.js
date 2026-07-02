
var global_wcf_url_lms = 'https://mwfm-uat.altiusinfra.com/LMS/api/';

function loading() {
    //  loading_hide();

    try {
        var is_loading = $(".preloader-modal");
        if (is_loading.length == 0) {
            myApp.preloader.show();
        }
    }
    catch (e) {
        setTimeout(function () {
            myApp.preloader.show();
        }, 10)
    }
}

function loading_hide() {
    myApp.preloader.hide();

    setTimeout(function () {
        myApp.preloader.hide();
    }, 20)
}

function onfail(e) {
    loading_hide();
    alert(e);
}

function back_button_LMS() {
    var level4_popup = $('.popup-level-4.modal-in:visible');
    var level3_popup = $('.popup-level-3.modal-in:visible');
    var level2_popup = $('.popup-level-2.modal-in:visible');
    if (level4_popup.length > 0) {
        myApp.popup.close('.popup-level-4');
        return false;
    }
    else if (level3_popup.length > 0) {
        myApp.popup.close('.popup-level-3');
        return false;
    }
    else if (level2_popup.length > 0) {
        myApp.popup.close('.popup-level-2');
        return false;
    }
}

///////////// ---------------- ////////////////// ------------------ //////////////// ------------


// Level 1 (course listing + module listing by course)
function get_course() {
    var company_id = window.localStorage.getItem("company_id");
    var user_id = JSON.parse(storage.getItem('user_id'));

    $("#dv_Course_List").empty();

    var Param_obj = [];
    Param_obj.push({
        'Company_Id': company_id,
        'User_Id': user_id
    });

    loading();

    var getdata = new Webservicecall_REST(global_wcf_url_lms + 'LMS_Select_Course_Master', JSON.stringify(Param_obj), function (e) {
        var responseText = e.responseText;
        var myArray = JSON.parse(responseText);
        var status = myArray[0].status;
        if (status == 1) {
            let data = myArray[0]["data"];
            data = JSON.parse(data);

            for (let c = 0; c < data.length; c++) {
                let Course_Id = data[c].Course_Id;
                let Course_Name = data[c].Course_Name;
                let Thumbnail_link = data[c].Thumbnail_link;

                let onclick_str = "get_module_details_by_course_id('" + Course_Id + "')";

                let str = '<div class="course-card" Course_Id="' + Course_Id + '" onclick="' + onclick_str + '">';
                str += '<div class="course-inner">';

                if (Thumbnail_link == "" || Thumbnail_link == null || Thumbnail_link == undefined) {
                    str += '<div class="course-image"><img src="images/no_image.png" alt="Course 1" style="padding: 15px;"></div>';
                }
                else {
                    str += '<div class="course-image"><img src="' + Thumbnail_link + '" alt="Course 1"></div>';
                }

                str += '<div class="course-content">';
                str += '<div class="course-title">' + Course_Name + '</div>';
                // str += '<div class="module-pill">Module 1</div>';
                // str += '<div class="module-pill">Module 2</div>';
                str += '</div></div>';
                str += '<div id="course_progress_' + Course_Id + '" class="progress-line"></div>';
                str += '</div>';

                $("#dv_Course_List").append(str);

                let question_count = data[c].question_count;
                let question_log_count = data[c].question_log_count;
                let div_id = '#course_progress_' + Course_Id + '';

                if (question_count == "" || question_count == null || question_count == undefined || question_count == '0') {
                    $(div_id).css('width', '5%');
                }
                else {
                    let progress = (question_log_count / question_count) * 100;
                    progress = Math.round(progress);
                    $(div_id).css('width', progress + '%');
                }

                get_module_by_course(Course_Id);

            }
        }
        else if (status == 2 || status == 3) {
            var message = myArray[0].message;
            alert(message);
        }

        loading_hide();

    }, onfail);
    getdata.callOtherDomain();
}

function get_module_by_course(Course_Id) {
    var Param_obj = [];
    Param_obj.push({
        'Course_Id': Course_Id
    });
    loading();

    var getdata = new Webservicecall_REST(global_wcf_url_lms + 'LMS_Select_Module_Master_By_CourseId', JSON.stringify(Param_obj), function (e) {
        var responseText = e.responseText;
        var myArray = JSON.parse(responseText);
        var status = myArray[0].status;
        if (status == 1) {
            let data = myArray[0]["data"];
            data = JSON.parse(data);

            let str = '';

            for (let m = 0; m < data.length; m++) {
                let Module_Id = data[m].Module_Id;
                let Module_Name = data[m].Module_Name;
                let Module_Description = data[m].Module_Description;

                str += '<input id="hdn_module_id_' + Module_Id + '" type="hidden" value="' + Module_Description + '">';
                //let onclick_str = "get_module_details_by_course_id('" + Course_Id + "')";
                str += '<div class="module-pill">' + Module_Name + '</div>';
            }

            $("div[Course_Id='" + Course_Id + "']").find(".course-content").append(str);

        }
        else if (status == 3) {
            var message = myArray[0].message;
            alert(message);
        }

        loading_hide();

    }, onfail);
    getdata.callOtherDomain();
}


// Level 2 (module details by module id in popup)
//function get_module_details_by_module_id(Module_Id) {

//    myApp.popup.open('.popup-level-2');

//    let module_desc = $("#hdn_module_id_" + Module_Id + "").val();
//    if (module_desc == "" || module_desc == null || module_desc == undefined) {
//        module_desc = "";
//    }

//    //$(".popup-level-2").find(".page-content").empty().append(module_desc);
//}


function get_module_details_by_course_id() {
    //myApp.popup.open('.popup-level-2');
    $("#dv_Module_List").empty();

    let Course_Id = 0;

    var Param_obj = [];
    Param_obj.push({
        'Course_Id': Course_Id
    });

    loading();

    var getdata = new Webservicecall_REST(global_wcf_url_lms + 'LMS_Select_Module_Master_By_CourseId', JSON.stringify(Param_obj), function (e) {
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
                let Thumbnail_link = data[m].Thumbnail_link;

                let onclick_str = "get_target_skill_by_module_id('" + Module_Id + "','" + Course_Id + "')";
                let str = '<div class="module-card" Module_Id="' + Module_Id + '" onclick="' + onclick_str + '">';

                let score_id = 'score_' + Module_Id + '_' + Course_Id + '';
                str += '<div  id=' + score_id + ' class="module-overlay" style="display:none"><div class="overlay-text">Score</div></div>';

                str += '<div class="card-content">';
                str += '<div class="module-image">';

                if (Thumbnail_link == "" || Thumbnail_link == null || Thumbnail_link == undefined) {
                    str += '<img src="images/no_image.png" alt="Course 1" style="padding: 15px;">';
                }
                else {
                    str += '<img src="' + Thumbnail_link + '" alt="Course 1">';
                }

                //str += '<div class="skill-btn">Target Skill</div>';
                str += '</div>';

                str += '<div class="module-content">';
                str += '<div class="module-title">' + Module_Name + '</div>';
                str += '<div class="module-desc">' + Module_Description + '</div>';
                str += '</div></div>';

                let progress_id = 'progress_' + Module_Id + '_' + Course_Id + '';
                str += '<div id=' + progress_id + ' class="module-progress-line"></div>';
                str += '</div>';

                $("#dv_Module_List").append(str);

                get_target_skill_tag_by_module_id(Module_Id, Course_Id);
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
function get_target_skill_tag_by_module_id(Module_Id, Course_Id) {
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

            let onclick_str = "get_questionlog_by_skill_id('" + Skill_Id + "', '" + Video_Link + "', '" + Module_Id + "','" + Course_Id + "')";
            $("div[Module_Id='" + Module_Id + "']").attr("onclick", onclick_str);

            get_progess_by_module(Module_Id, Course_Id, Skill_Id)
        }
        else if (status == 3) {
            var message = myArray[0].message;
            alert(message);
        }

        loading_hide();

    }, onfail);
    getdata.callOtherDomain();
}


function get_progess_by_module(Module_Id, Course_Id, Skill_Id) {
    var user_id = JSON.parse(storage.getItem('user_id'));
    var Param_obj = [];
    Param_obj.push({
        "User_Id": user_id,
        "Module_Id": Module_Id,
        "Course_Id": Course_Id,
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
            let course_id = data[0].Course_Id
            let Score = data[0].Score;
            let total_score = data[0].Total_Score;
            let question_count = data[0].question_count;
            let question_log_count = data[0].question_log_count;

            if (question_count == question_log_count) {
                // score logic
                let score_percent = (Score / total_score) * 100;
                let score_id = '#score_' + module_id + '_' + course_id + '';
                $(score_id).show();
                $(score_id).find('.overlay-text').html(`Score ${score_percent}%`);

                // progress logic
                let progress = (question_log_count / question_count) * 100;
                progress = Math.round(progress);

                let div_id = '#progress_' + module_id + '_' + course_id + '';
                $(div_id).css('width', progress + '%');

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


// Level 3 (skill list by module id in popup) - currently cancelled

function get_target_skill_by_module_id(Module_Id) {

    myApp.popup.open('.popup-level-3');
    $("#dv_Skill_List").empty();

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

            for (let m = 0; m < data.length; m++) {
                let Skill_Id = data[m].Skill_Id;
                let Skill_Name = data[m].Skill_Name;
                let Video_Link = data[m].Video_Link;

                let onclick_str = "get_question_by_skill_id('" + Skill_Id + "', '" + Video_Link + "', '" + Module_Id + "')";

                let str = '<div class="module-card" Skill_Id="' + Skill_Id + '" onclick="' + onclick_str + '">';
                str += '<div class="card-content">';

                str += '<div class="module-image">';
                str += '<video id="preview_video_src" src="' + Video_Link + '" /></video>';
                str += '<div class="minute-pill ml-12">20 Min</div>';
                str += '</div>';

                str += '<div class="module-content">';
                str += '<div class="module-title">' + Skill_Name + '</div>';
                str += '</div></div>';

                str += '<div class="module-progress-line"></div>';

                str += '</div>';

                $("#dv_Skill_List").append(str);

            }


        }
        else {
            var message = myArray[0].message;
            alert(message);
            myApp.popup.close('.popup-level-3');
        }

        loading_hide();

    }, onfail);
    getdata.callOtherDomain();
}




// Level 4 (question list by module id in popup)


var log_data = [];
function get_questionlog_by_skill_id(Skill_Id, Video_Link, Module_Id, Course_Id) {

    myApp.popup.open('.popup-level-4');
    $("#dv_Question_List").empty();

    $("#vdo_Question").attr("src", Video_Link);
    $("#vdo_Question").attr("Course_Id", Course_Id);
    $("#vdo_Question").attr("skil_id", Skill_Id);
    $("#vdo_Question").attr("Module_Id", Module_Id);
    let vdo_Description = $("#dv_Module_List").find("div[Module_Id='" + Module_Id + "']").find("div.module-desc").html();
    $("#vdo_Description").html(vdo_Description);

    var user_id = JSON.parse(storage.getItem('user_id'));
    var Param_obj = [];
    Param_obj.push({
        'Skill_Id': Skill_Id,
        'User_ID': user_id
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
        get_question_by_skill_id(Skill_Id, Video_Link, Module_Id)

    }, onfail);
    getdata.callOtherDomain();
}

function get_question_by_skill_id(Skill_Id, Video_Link, Module_Id) {

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

                let ans_label = merge_array[i].ans;

                let str = '<div class="question-card">';
                str += '<div class="question-title" skill_que_id=' + skill_que_id + ' IsActive=' + IsActive + '>' + skill_que_name + '</div>';

                for (let j = 0; j < optionsArray.length; j++) {
                    let t_ans = optionsArray[j].trim()
                    str += '<div class="option">';

                    if (ans_label == t_ans) {
                        str += '<input type="checkbox" alt="' + weightage + '" id="' + skill_que_id + '_' + j + '" checked="checked">';
                    }
                    else {
                        str += '<input type="checkbox" alt="' + weightage + '" id="' + skill_que_id + '_' + j + '">';
                    }

                    str += '<label for="' + skill_que_id + '_' + j + '">' + t_ans + '</label>';
                    str += '</div>';
                }

                $("#dv_Question_List").append(str);

            }

            let btn_str = "";
            btn_str += '<div id="vdo_btn_div" class="buttons-row">'
            //btn_str += '<a href="#" class="button button-fill color-gray" onclick="get_video_skill_by_module_id()">Submit Video</a>'

            let onclick_str = "submit_question_by_skill_id('savenexit')";
            btn_str += '<a href="#" class="button button-fill color-gray" onclick="' + onclick_str + '">Save</a>';

            let on_submit = "submit_question_by_skill_id('submit')";
            btn_str += '<a href="#" class="button button-fill color-gray" onclick="' + on_submit + '">Submit</a>'
            btn_str += '</div>'
            $("#dv_Question_List").append(btn_str);

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
                "Circle": circle_name
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

$(document).on("click", ".link.popup-close", function () {
    $("#dv_Question_List").hide();
    set_progress_local();

    var video = $("#vdo_Question")[0];

    if (video) {
        video.pause();
    }

    // 2. Stop interval
    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }
    get_video_skill_by_module_id('');
});

$(document).ready(function () {

    var video = $("#vdo_Question")[0];
    var timeoutId = null;

    $(video).on("loadedmetadata", function () {
        var courseId = $(video).attr("course_id");
        var skillId = $(video).attr("skil_id");
        var moduleId = $(video).attr("module_id");
        var data = JSON.parse(localStorage.getItem('video_progress_' + skillId)) || [];

        if (data.length > 0) {
            var saved = data.find(item => item.Skill_Id == skillId);

            if (saved && saved.currentTime) {
                video.currentTime = saved.currentTime;
            }
        }

    });

    $(video).on("play", function () {
        if (this.currentTime < 0.5) {
            call_by_videolog('start'); // call api            
        }
        set_progress_local();
        set_progress();
    });

    // clear timer properly
    $(video).on("ended", function () {
        $("#dv_Question_List").show();
        set_progress_local();
        clearInterval(progressInterval);
        console.log("Interval cleared");
    });

});

var progressInterval = null;
set_progress = () => {
    progressInterval = setInterval(function () {
        set_progress_local();
        console.log("Saved after 10 sec");
    }, 10000);
}

set_progress_local = () => {
    var video = $("#vdo_Question")[0];

    var courseId = $(video).attr("course_id");
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
    var Course_Id = $("#vdo_Question").attr("Course_Id");

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
        "Course_Id": Course_Id,
        "Skill_Id": Skill_Id,
        "Status": status
    });

    loading();

    var getdata = new Webservicecall_REST(global_wcf_url_lms + 'LMS_InsertUpdate_User_Assessment_Rating', JSON.stringify(Param_obj), function (e) {
        var responseText = e.responseText;
        var myArray = JSON.parse(responseText);
        var status = myArray[0].status;
        if (status == 1) { }
        loading_hide();

    }, onfail);
    getdata.callOtherDomain();

}
