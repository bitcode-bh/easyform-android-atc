
var global_wcf_url_lms = 'https://dev.easyform.in/LMS/api/';

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
    $("#dv_Course_List").empty();

    var Param_obj = [];
    Param_obj.push({
        'Company_Id': company_id
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
                str += '<div class="progress-line"></div>';
                str += '</div>';

                $("#dv_Course_List").append(str);

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

function get_module_details_by_course_id(Course_Id) {
    myApp.popup.open('.popup-level-2');
    $("#dv_Module_List").empty();

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

                let onclick_str = "get_target_skill_by_module_id('" + Module_Id + "')";

                let str = '<div class="module-card" Module_Id="' + Module_Id + '" onclick="' + onclick_str + '")">';
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

                str += '<div class="module-progress-line"></div>';

                str += '</div>';

                $("#dv_Module_List").append(str);

                get_target_skill_tag_by_module_id(Module_Id);
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

            let str = '';

            for (let m = 0; m < data.length; m++) {
                let Skill_Id = data[m].Skill_Id;
                let Skill_Name = data[m].Skill_Name;
                let Video_Link = data[m].Video_Link;

                //let onclick_str = "get_module_details_by_course_id('" + Course_Id + "')";
                str += '<div class="module-pill">' + Skill_Name + '</div>';
            }

            $("div[Module_Id='" + Module_Id + "']").find(".module-image").append(str);

        }
        else if (status == 3) {
            var message = myArray[0].message;
            alert(message);
        }

        loading_hide();

    }, onfail);
    getdata.callOtherDomain();
}



// Level 3 (skill list by module id in popup)

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

function get_question_by_skill_id(Skill_Id, Video_Link, Module_Id) {

    myApp.popup.open('.popup-level-4');
    $("#dv_Question_List").empty();

    $("#vdo_Question").attr("src", Video_Link);
    let vdo_Description = $("#dv_Module_List").find("div[Module_Id='" + Module_Id + "']").find("div.module-desc").html();
    $("#vdo_Description").html(vdo_Description);

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

            for (let i = 0; i < data.length; i++) {
                let skill_que_id = data[i].Skill_Que_Id;
                let skill_que_name = data[i].Skill_Question_Name;
                let optionsArray = JSON.parse(data[i].OptionText);

                let str = '<div class="question-card">';
                str += '<div class="question-title">' + skill_que_name + '</div>';

                for (let j = 0; j < optionsArray.length; j++) {
                    str += '<div class="option">';
                    str += '<input type="checkbox" id="' + skill_que_id + '_' + j + '">';
                    str += '<label for="' + skill_que_id + '_' + j + '">' + optionsArray[j].trim() + '</label>';
                    str += '</div>';
                }

                $("#dv_Question_List").append(str);

            }
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