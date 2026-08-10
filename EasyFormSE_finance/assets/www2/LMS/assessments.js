
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

// Label-only chips — see the matching note in safety_modules.js
// render_safety_module_tags(); counts now live in .lms-filter-summary.
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

    if (typeof lms_render_filter_summary === 'function') {
        lms_render_filter_summary('lms_assessment_filter_summary', selected_assessment_tag, visible_assessments.length);
    }

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

        str += '<div class="sample-module-card" Module_Id="' + Assessment_Id + '" onclick="' + onclick_str + '"><div class="sample-module-image"><img src="' + Thumbnail_link + '" alt="' + Name + '" loading="lazy" onload="this.parentNode.classList.add(\'img-ready\'); if(typeof lms_apply_corner_contrast===\'function\') lms_apply_corner_contrast(this.src, this.parentNode);">';
        if (Tag !== "" && Tag != null) str += '<span class="sample-module-tag">' + Tag + '</span>';
        if (SubmitedQuestion > 0) {
            str += '<span class="sample-score-tag"><span class="sample-score-label">Score:</span> ';
            str += '<span class="sample-score-current">' + Score + '</span><span class="sample-score-sep">/</span>';
            str += '<span class="sample-score-total">' + TotalQuestion + '</span></span>';
        }
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

function apply_assessments(responseText, isRefresh) {
    var myArray;
    try { myArray = JSON.parse(responseText); } catch (e) { return; }
    var status = myArray[0].status;
    if (status == 1) {
        var data = JSON.parse(myArray[0]["data"]);
        assessment_data = data.map(function (assessment, index) {
            assessment._lms_item_order = index;
            return assessment;
        });
        if (typeof update_lms_kpi === 'function') update_lms_kpi();
        update_assessment_kpi();
        // Keep the user's active filter/sort/search on the silent refresh.
        if (!isRefresh) {
            selected_assessment_tag = "All";
            selected_assessment_sort = "recommended";
            assessment_search_text = "";
            render_assessment_search();
            render_assessment_tags();
            render_assessment_sort_menu();
            bind_assessment_controls();
        }
        render_assessment_cards();
    }
    else if (!isRefresh) {
        assessment_listing_requested = false;
        assessment_data = [];
        update_assessment_kpi();
        render_assessment_cards();
    }
}

// Summary cards at the top of the Assessments tab.
function update_assessment_kpi() {
    var completedEl = document.getElementById('kpi_assessment_completed_pct');
    var scoreEl = document.getElementById('kpi_assessment_avg_score');
    if (!completedEl && !scoreEl) return;
    var k = lms_compute_completion_kpi(assessment_data);
    if (completedEl) lms_set_info_value(completedEl, k.completedPct + '%');
    if (scoreEl) lms_set_info_value(scoreEl, k.avgScorePct + '%');
}

function get_assessments_listing(force_refresh) {
    if (typeof lms_reset_listings_if_role_changed === 'function' && lms_reset_listings_if_role_changed()) {
        force_refresh = true;
    }
    if (force_refresh) {
        assessment_listing_requested = false;
    }
    if (assessment_listing_requested && !force_refresh) {
        return;
    }
    assessment_listing_requested = true;

    let role_id = (typeof lms_get_listing_role_ids === 'function')
        ? lms_get_listing_role_ids()
        : localStorage.getItem('role_id_array');

    var Param_obj = [];
    Param_obj.push({
        'Role_Id': role_id
    });

    var lms_assess_url = global_wcf_url_lms + 'LMS_Select_Assessments_Master_RoleWise';
    var lms_assess_cache_key = (typeof lms_listing_cache_key === 'function')
        ? lms_listing_cache_key('assessments', role_id)
        : ('assessments_' + role_id);

    // Cache-first (see get_safety_module_listing); original path preserved as fallback.
    if (typeof LmsData !== 'undefined') {
        var had_cache = LmsData.getCache(lms_assess_cache_key) != null;
        if (!had_cache) {
            LmsData.showSkeletons("#dv_Assessments_List", 4);
        }
        LmsData.fetch(lms_assess_cache_key, lms_assess_url, JSON.stringify(Param_obj),
            function (txt, source) {
                apply_assessments(txt, source === 'network' && had_cache);
            },
            function (err) {
                if (!had_cache) {
                    assessment_listing_requested = false;
                    LmsData.showError("#dv_Assessments_List", "get_assessments_listing(true)");
                }
            },
            { timeout: 15000, retries: 1, force: !!force_refresh }
        );
        return;
    }

    $("#dv_Assessments_List").empty();
    loading();

    var getdata = new Webservicecall_REST(lms_assess_url, JSON.stringify(Param_obj), function (e) {
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
            if (typeof update_lms_kpi === 'function') update_lms_kpi();
        update_assessment_kpi();
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
            assessment_data = [];
            render_assessment_cards();
        }

        loading_hide();

    }, onfail);
    getdata.callOtherDomain();
}

// Replaces the old alert("All answers are required!") pattern: the button
// itself is disabled/enabled as the user answers, so an incomplete submit is
// simply not tappable rather than being caught after the fact with a popup.
function assessment_update_submit_enabled(answered, total) {
    var btn = document.getElementById('btn_assessment_submit');
    if (!btn) return;
    btn.classList.toggle('disabled', answered < total);
}

function get_questionlog_by_assessment_id(Assessment_Id, Assessment_Schedule_Id, Progress) {

    glob_Assessment_Schedule_Id = Assessment_Schedule_Id;

    if (typeof lms_start_assessment_watch === 'function') lms_start_assessment_watch(Assessment_Id);

    myApp.popup.open('.popup-assessment-que');
    $("#dv_Assessment_Question_List").empty();

    $("#dv_Assessment_Question_List").attr("Assessment_Id", Assessment_Id);

    // Submit footer is now a persistent element (see LMS_Dashboard.html) rather
    // than one freshly injected per assessment, so its state has to be reset
    // explicitly here — otherwise a previous assessment's "Submitting…"/disabled
    // state, or its visibility, would carry over into this one. Starts disabled
    // — nothing is answered yet — and assessment_update_submit_enabled() turns
    // it on once every question has a selection.
    $("#assessment_submit_footer").hide();
    var resetBtn = document.getElementById('btn_assessment_submit');
    if (resetBtn) {
        resetBtn.classList.add('disabled');
        resetBtn.textContent = 'Submit';
    }

    // Description at the top of the screen (replaces the old stepper/timer
    // header). Prefer the loaded record; fall back to the card's own text for
    // the module-wise list, which opens this popup without populating
    // assessment_data. Cleared first so a previous assessment's copy can't
    // linger if neither source has one.
    var assessment_desc = '';
    if (typeof assessment_data !== 'undefined' && assessment_data.length) {
        var match = assessment_data.filter(function (a) { return a.Assessment_Id == Assessment_Id; })[0];
        if (match) assessment_desc = match.Description || '';
    }
    if (!assessment_desc) {
        assessment_desc = $("#dv_Assessments_List").find("div[Module_Id='" + Assessment_Id + "']").find("div.sample-module-desc").html() || '';
    }
    $("#assessment_Description").html(assessment_desc);
    $("#assessment_Description").toggle(!!assessment_desc);

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
                        str += '<input type="radio" name="q_' + Assessment_Que_Id + '" alt="' + weightage + '" id="' + Assessment_Que_Id + '_' + j + '" checked="checked">';
                    }
                    else {
                        str += '<input type="radio" name="q_' + Assessment_Que_Id + '" alt="' + weightage + '" id="' + Assessment_Que_Id + '_' + j + '">';
                    }

                    str += '<label for="' + Assessment_Que_Id + '_' + j + '">' + op_text + '</label>';
                    str += '</div>';
                }

                $("#dv_Assessment_Question_List").append(str);

            }

            // Stepper values are still maintained (other code reads them) but the
            // header itself stays hidden — the assessment description now occupies
            // the top of this screen instead, matching the lesson video screen.
            var totalQ = document.querySelectorAll('#dv_Assessment_Question_List .question-card').length;
            var qTotalEl = document.getElementById('q_total');
            var qCurEl = document.getElementById('q_cur');
            var qHeader = document.getElementById('assessment_quiz_header');
            if (qTotalEl) qTotalEl.textContent = totalQ;
            if (qCurEl) qCurEl.textContent = (Progress == "100") ? totalQ : 0;
            if (qHeader) qHeader.style.display = 'none';

            // Highlight any pre-checked option (prior answer / review mode) —
            // covers WebViews without :has() and the disabled review state.
            document.querySelectorAll('#dv_Assessment_Question_List input[type="radio"]:checked').forEach(function (inp) {
                var opt = inp.closest('.option');
                if (opt) opt.classList.add('selected');
            });

            if (Progress == "100") {
                $("#dv_Assessment_Question_List").find("input[type='radio']").attr("disabled", "disabled");
                $("#dv_Assessment_Question_List").show();
            }
            else {
                // Button itself is static markup (#assessment_submit_footer, pinned
                // to the bottom of the popup) — just reveal it, rather than
                // injecting a fresh copy into the scrolling list each time.
                $("#assessment_submit_footer").show();

                function recomputeAnswered() {
                    var answered = 0;
                    document.querySelectorAll('#dv_Assessment_Question_List .question-card').forEach(function (c) {
                        if (c.querySelector('input[type="radio"]:checked')) answered++;
                    });
                    if (qCurEl) qCurEl.textContent = answered;
                    assessment_update_submit_enabled(answered, totalQ);
                }

                // Radios are single-select natively — just keep the "answered"
                // counter in the header current as the user picks options.
                // Also toggle a .selected class as a highlight fallback for
                // WebViews without :has() support (older Android devices).
                $("#dv_Assessment_Question_List").off('change.assessQ').on('change.assessQ', 'input[type="radio"]', function () {
                    var card = this.closest('.question-card');
                    if (card) {
                        card.querySelectorAll('.option').forEach(function (o) { o.classList.remove('selected'); });
                        var opt = this.closest('.option');
                        if (opt) opt.classList.add('selected');
                    }
                    recomputeAnswered();
                });

                // Setting `checked` in the rendered HTML (resuming an assessment with
                // prior answers) does NOT fire a 'change' event, so without this the
                // button stayed stuck disabled on load even when every question already
                // had an answer — confirmed live: it only started working after the
                // first tap touched *any* radio, since that tap's change handler was
                // the first time the count ever got recomputed. Runs once, immediately,
                // off whatever the server actually returned.
                recomputeAnswered();
            }

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
    // The button is disabled until every question is answered (see
    // assessment_update_submit_enabled(), driven off the change handler in
    // get_questionlog_by_assessment_id) and disabled buttons don't fire
    // onclick, so this is a defensive fallback, not the normal path — no
    // alert, just decline to submit silently.
    var btnGuard = document.getElementById('btn_assessment_submit');
    if (btnGuard && btnGuard.classList.contains('disabled')) return false;

    let Param_obj = [];
    let questionCards = $('#dv_Assessment_Question_List .question-card');

    for (let i = 0; i < questionCards.length; i++) {
        let questionCard = questionCards[i];
        let questionName = questionCard.querySelector('.question-title').textContent.trim();
        let options = questionCard.querySelectorAll('input[type="radio"]');

        let selectedAns = [];

        for (let j = 0; j < options.length; j++) {
            if (options[j].checked) {
                selectedAns.push(options[j].nextElementSibling.textContent.trim());
            }
        }

        let is_valid = 1;
        if (selectedAns.length == 0) {
            is_valid = 0;
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
    var submitBtn = document.getElementById('btn_assessment_submit');
    if (submitBtn) {
        submitBtn.dataset.label = submitBtn.textContent;
        submitBtn.classList.add('disabled');
        submitBtn.textContent = 'Submitting…';
    }
    var getdata = new Webservicecall_REST(global_wcf_url_lms + 'LMS_InsertUpdateDelete_Assessment_Question_Log_Master', JSON.stringify(Param_obj), function (e) {
        var responseText = e.responseText;
        var myArray = JSON.parse(responseText);
        var status = myArray[0].status;
        if (status == 1) {
            if (submitBtn) submitBtn.textContent = '✓ Submitted';
            if (typeof lms_flush_assessment_watch === 'function') lms_flush_assessment_watch();
            var submittedId = $("#dv_Assessment_Question_List").attr("Assessment_Id");
            get_assessments_listing(true);
            setTimeout(function () {
                if (!submittedId || typeof lms_log_assessment_completion !== 'function') return;
                var match = (typeof assessment_data !== 'undefined' && assessment_data)
                    ? assessment_data.filter(function (a) { return String(a.Assessment_Id) === String(submittedId); })[0]
                    : null;
                var pct = (typeof lms_assessment_score_pct === 'function' && match)
                    ? lms_assessment_score_pct(match) : 100;
                lms_log_assessment_completion(submittedId, pct);
                if (typeof update_lms_kpi === 'function') update_lms_kpi();
            }, 1600);
            myApp.popup.close('.popup-assessment-que')
        }
        else {
            var message = myArray[0].message;
            if (submitBtn) {
                submitBtn.textContent = submitBtn.dataset.label || 'Submit';
                submitBtn.classList.remove('disabled');
            }
            alert(message);
        }

        loading_hide();

    }, onfail);
    getdata.callOtherDomain();
}
