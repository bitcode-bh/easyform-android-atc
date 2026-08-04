
var glob_Assessment_Schedule_Id = 0;
var assessment_data = [];
var selected_assessment_tag = "All";
var selected_assessment_sort = "recommended";
var assessment_search_text = "";
var assessment_listing_requested = false;

function render_assessment_search() {
    var search = '<i class="fa fa-search"></i>';
    search += '<input type="search" class="sample-safety-search-input assessment-search-input" placeholder="Search assessments" aria-label="Search assessments" value="' + assessment_search_text.replace(/"/g, '&quot;') + '">';
    $(".assessment-search").html(search);
}

function render_assessment_tags() {
    var tags = [];
    var seen_tags = {};
    assessment_data.forEach(function (assessment) {
        get_lms_item_tags(assessment.Tag != null ? assessment.Tag : assessment.tag).forEach(function (tag) {
            var key = tag.toLowerCase();
            if (!seen_tags[key]) {
                seen_tags[key] = true;
                tags.push(tag);
            }
        });
    });

    var str = '<div class="sample-safety-chip' + (selected_assessment_tag === "All" ? ' active' : '') + '" data-assessment-tag="All"><span class="sample-safety-check"><i class="fa fa-check"></i></span><span>All</span></div>';
    tags.forEach(function (tag) {
        str += '<div class="sample-safety-chip' + (selected_assessment_tag === tag ? ' active' : '') + '" data-assessment-tag="' + tag.replace(/"/g, '&quot;') + '"><span class="sample-safety-check"><i class="fa fa-check"></i></span><span>' + tag + '</span></div>';
    });
    $(".assessment-tabs").html(str);
}

function render_assessment_sort_menu() {
    var str = '<div class="sample-safety-sort-menu assessment-sort-menu" aria-hidden="true"><div class="sample-safety-sort-title">Sort by</div>';
    Object.keys(safety_module_sort_options).forEach(function (key) {
        str += '<a href="#" class="sample-safety-sort-option' + (selected_assessment_sort === key ? ' active' : '') + '" data-assessment-sort="' + key + '"><span>' + safety_module_sort_options[key] + '</span><i class="fa fa-check"></i></a>';
    });
    str += '</div>';
    $(".assessment-sort-menu").remove();
    $(".assessment-search-row").append(str);
}

function render_assessment_cards() {
    var visible_assessments = get_lms_visible_items(assessment_data, selected_assessment_tag, assessment_search_text, selected_assessment_sort, "Name", "Description");
    var str = '';
    if (visible_assessments.length === 0) {
        str = '<div class="sample-safety-empty-state">No assessments found</div>';
    }

    visible_assessments.forEach(function (assessment) {
        var Assessment_Id = assessment.Assessment_Id;
        var Name = assessment.Name;
        var Description = assessment.Description;
        var Assessment_Schedule_Id = assessment.Assessment_Schedule_Id;
        var Thumbnail_link = assessment.Thumbnail_link || "images/bg2.jpg";
        var Progress = Math.round(get_lms_item_progress(assessment));
        var Score = assessment.Score === "" || assessment.Score == null ? "0" : assessment.Score;
        var Tag = assessment.Tag != null ? assessment.Tag : assessment.tag;
        var TotalQuestion = assessment.TotalQuestion == null || assessment.TotalQuestion === "" ? 0 : assessment.TotalQuestion;
        var SubmitedQuestion = assessment.SubmitedQuestion == null || assessment.SubmitedQuestion === "" ? 0 : assessment.SubmitedQuestion;
        var onclick_str = "get_questionlog_by_assessment_id('" + Assessment_Id + "', '" + Assessment_Schedule_Id + "', '" + Progress + "')";

        str += '<div class="sample-module-card" Module_Id="' + Assessment_Id + '" onclick="' + onclick_str + '"><div class="sample-module-image"><img src="' + Thumbnail_link + '">';
        if (Tag !== "" && Tag != null) str += '<span class="sample-module-tag">' + Tag + '</span>';
        if (SubmitedQuestion > 0) str += '<span class="sample-score-tag">Score: ' + Score + '/' + TotalQuestion + '</span>';
        str += '</div><div class="sample-module-card-body"><div class="sample-module-title">' + Name + '</div><div class="sample-module-desc">' + Description + '</div>';
        str += '<div class="sample-module-meta"><div class="sample-module-lessons"><span class="sample-module-help"><i class="fa fa-book-open"></i></span><span class="sample-lession-count">' + TotalQuestion + ' Questions</span></div><div class="sample-module-percent">' + Progress + '%</div></div>';
        str += '<div class="sample-module-progress"><span style="width:' + Progress + '%"></span></div></div></div>';
    });
    $("#dv_Assessments_List").html(str);
}

function bind_assessment_controls() {
    $(document).off("input.assessments", ".assessment-search-input").on("input.assessments", ".assessment-search-input", function () {
        assessment_search_text = $(this).val();
        render_assessment_cards();
    });
    $(document).off("click.assessments", ".assessment-tabs .sample-safety-chip").on("click.assessments", ".assessment-tabs .sample-safety-chip", function () {
        selected_assessment_tag = $(this).attr("data-assessment-tag");
        render_assessment_tags();
        render_assessment_cards();
    });
    $(document).off("click.assessments", ".assessment-filter").on("click.assessments", ".assessment-filter", function (event) {
        event.preventDefault();
        var menu = $(".assessment-sort-menu");
        menu.toggleClass("visible").attr("aria-hidden", !menu.hasClass("visible"));
    });
    $(document).off("click.assessments", ".assessment-sort-menu .sample-safety-sort-option").on("click.assessments", ".assessment-sort-menu .sample-safety-sort-option", function (event) {
        event.preventDefault();
        selected_assessment_sort = $(this).attr("data-assessment-sort");
        render_assessment_sort_menu();
        render_assessment_cards();
    });
}

function get_assessments_listing(force_refresh) {
    if (assessment_listing_requested && !force_refresh) {
        return;
    }
    assessment_listing_requested = true;
    $("#dv_Assessments_List").empty();

    let role_id_array = localStorage.getItem('role_id_array');

    var Param_obj = [];
    Param_obj.push({
        'Role_Id': role_id_array
    });

    loading();

    var getdata = new Webservicecall_REST(global_wcf_url_lms + 'LMS_Select_Assessments_Master_RoleWise', JSON.stringify(Param_obj), function (e) {
        var responseText = e.responseText;
        var myArray = JSON.parse(responseText);
        var status = myArray[0].status;
        if (status == 1) {
            let data = myArray[0]["data"];
            data = JSON.parse(data);

            assessment_data = data.map(function (assessment, index) {
                assessment._lms_item_order = index;
                return assessment;
            });
            selected_assessment_tag = "All";
            selected_assessment_sort = "recommended";
            assessment_search_text = "";
            render_assessment_search();
            render_assessment_tags();
            render_assessment_sort_menu();
            bind_assessment_controls();
            render_assessment_cards();

            /*for (let m = 0; m < data.length; m++) {
                let Assessment_Id = data[m].Assessment_Id;
                let Name = data[m].Name;
                let Description = data[m].Description;
                let Assessment_Schedule_Id = data[m].Assessment_Schedule_Id;

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

                let Tag = data[m].Tag;

                let TotalQuestion = data[m].TotalQuestion;
                let SubmitedQuestion = data[m].SubmitedQuestion;

                if (TotalQuestion == "" || TotalQuestion == null || TotalQuestion == undefined) {
                    TotalQuestion = 0;
                }
                if (SubmitedQuestion == "" || SubmitedQuestion == null || SubmitedQuestion == undefined) {
                    SubmitedQuestion = 0;
                }

                let onclick_str = "get_questionlog_by_assessment_id('" + Assessment_Id + "', '" + Assessment_Schedule_Id + "', '" + Progress + "')";

                let str = '<div class="sample-module-card" Module_Id="' + Assessment_Id + '" onclick="' + onclick_str + '">';

                str += '<div class="sample-module-image" >';
                str += '<img src="' + Thumbnail_link + '">';

                if (Tag == "" || Tag == null || Tag == undefined) { }
                else {
                    str += '<span class="sample-module-tag">' + Tag + '</span>';
                }


                if (SubmitedQuestion > 0) {
                    str += '<span class="sample-score-tag">Score: ' + Score + '/' + TotalQuestion + '</span>';
                }
                str += '</div>';
                str += '<div class="sample-module-card-body">';
                str += '<div class="sample-module-title">' + Name + '</div>';
                str += '<div class="sample-module-desc">' + Description + '</div>';
                str += '<div class="sample-module-meta">';
                str += '<div class="sample-module-lessons">';
                str += '<span class="sample-module-help"><i class="fa fa-book-open"></i></span>';
                str += '<span class="sample-lession-count">' + TotalQuestion + ' Questions</span>';
                str += '</div>';
                str += '<div class="sample-module-percent">' + Progress + '%</div>';
                str += '</div>';
                str += '<div class="sample-module-progress"><span style="width:' + Progress + '%"></span></div>';
                str += '</div>';
                str += '</div>';

                $("#dv_Assessments_List").append(str);
            }*/
        }
        else {
            assessment_listing_requested = false;
            var message = myArray[0].message;
            alert(message);
        }

        loading_hide();

    }, onfail);
    getdata.callOtherDomain();
}

function get_questionlog_by_assessment_id(Assessment_Id, Assessment_Schedule_Id, Progress) {

    glob_Assessment_Schedule_Id = Assessment_Schedule_Id;

    myApp.popup.open('.popup-assessment-que');
    $("#dv_Assessment_Question_List").empty();

    $("#dv_Assessment_Question_List").attr("Assessment_Id", Assessment_Id);

    var user_id = JSON.parse(storage.getItem('user_id'));
    var Param_obj = [];
    Param_obj.push({
        'Assessment_Id': Assessment_Id,
        'User_ID': user_id,
        'Assessment_Schedule_Id': Assessment_Schedule_Id
    });
    loading();

    var getdata = new Webservicecall_REST(global_wcf_url_lms + 'LMS_Select_Assessment_Question_Log_Master_ByAssessmentId', JSON.stringify(Param_obj), function (e) {
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
        get_question_by_assessment_id(Assessment_Id, Progress)

    }, onfail);
    getdata.callOtherDomain();
}

function get_question_by_assessment_id(Assessment_Id, Progress) {

    var Param_obj = [];
    Param_obj.push({
        'Assessment_Id': Assessment_Id
    });
    loading();

    var getdata = new Webservicecall_REST(global_wcf_url_lms + 'LMS_Select_Assessments_Questions_Master_by_Assessment_Id', JSON.stringify(Param_obj), function (e) {
        var responseText = e.responseText;
        var myArray = JSON.parse(responseText);
        var status = myArray[0].status;
        if (status == 1) {
            let data = myArray[0]["data"];
            data = JSON.parse(data);

            let t_log_data = log_data;
            var merge_array = merge_question_data_assessments(data, t_log_data);

            for (let i = 0; i < merge_array.length; i++) {
                let Assessment_Que_Id = merge_array[i].Assessment_Que_Id;
                let Question_Name = merge_array[i].Question_Name;
                let optionsArray = merge_array[i].OptionText;
                let IsActive = merge_array[i].IsActive;
                let weightage = merge_array[i].Weightage;
                if (weightage == "" || weightage == null || weightage == undefined) {
                    weightage = 1;
                }
                let Valid_Answer = merge_array[i].Valid_Answer[0];
                let ans_label = merge_array[i].ans;

                let str = '<div class="question-card">';
                str += '<div class="question-title" Assessment_Que_Id=' + Assessment_Que_Id + ' IsActive=' + IsActive + '>' + Question_Name + '</div>';

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
                        str += '<input type="checkbox" alt="' + weightage + '" id="' + Assessment_Que_Id + '_' + j + '" checked="checked" style="font-weight: bold">';
                    }
                    else {
                        str += '<input type="checkbox" alt="' + weightage + '" id="' + Assessment_Que_Id + '_' + j + '">';
                    }

                    str += '<label for="' + Assessment_Que_Id + '_' + j + '">' + op_text + '</label>';
                    str += '</div>';
                }

                $("#dv_Assessment_Question_List").append(str);

            }

            if (Progress == "100") {
                $("#dv_Assessment_Question_List").find("input[type='checkbox']").attr("disabled", "disabled");
                $("#dv_Assessment_Question_List").show();
            }
            else {
                let btn_str = '<div id="vdo_btn_div" class="buttons-row">'
                btn_str += '<a href="#" class="button button-fill color-gray" onclick="submit_question_by_assessment_id()">Submit</a>'
                btn_str += '</div>'
                $("#dv_Assessment_Question_List").append(btn_str);
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
            myApp.popup.close('.popup-assessment-que');
        }

        loading_hide();

    }, onfail);
    getdata.callOtherDomain();
}

function merge_question_data_assessments(template_data, log_data) {
    for (i = 0; i < template_data.length; i++) {
        var bl_que_id = template_data[i].Assessment_Que_Id;
        for (j = 0; j < log_data.length; j++) {
            var rs_que_id = log_data[j].Assessment_Que_Id;
            if (rs_que_id == bl_que_id) {
                var rs_ans = log_data[j].Ans;
                template_data[i].ans = rs_ans;
                break;
            }
        }
    }

    return template_data;
}

function submit_question_by_assessment_id() {
    let Param_obj = [];
    let questionCards = $('#dv_Assessment_Question_List .question-card');

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
        if (selectedAns.length == 0) {
            is_valid = 0;
            alert("All answers are required!");
            return false;
        }

        if (is_valid == 1) {
            var Assessment_Id = $("#dv_Assessment_Question_List").attr("Assessment_Id");
            let Assessment_Que_Id = $(questionCard).find('.question-title').attr('Assessment_Que_Id');
            var user_id = JSON.parse(storage.getItem('user_id'));
            var user_name = JSON.parse(storage.getItem('user_name'));
            var circle_name = JSON.parse(storage.getItem('circle_name'));

            Param_obj.push({
                "User_ID": user_id,
                "User_Name": user_name,
                "Assessment_Id": Assessment_Id,
                "Assessment_Que_Id": Assessment_Que_Id,
                "Question_Name": questionName,
                "Ans": selectedAns,
                "Circle": circle_name,
                "Assessment_Schedule_Id": glob_Assessment_Schedule_Id
            });
        }
    }
    loading();
    var getdata = new Webservicecall_REST(global_wcf_url_lms + 'LMS_InsertUpdateDelete_Assessment_Question_Log_Master', JSON.stringify(Param_obj), function (e) {
        var responseText = e.responseText;
        var myArray = JSON.parse(responseText);
        var status = myArray[0].status;
        if (status == 1) {
            get_assessments_listing(true);
            myApp.popup.close('.popup-assessment-que')
        }
        else {
            var message = myArray[0].message;
            alert(message);
        }

        loading_hide();

    }, onfail);
    getdata.callOtherDomain();
}
