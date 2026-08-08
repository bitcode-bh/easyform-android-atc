
// Safety module listing (level 1)
var glob_Module_Schedule_Id = 0;
var safety_module_data = [];
var selected_safety_tag = "All";
var selected_safety_sort = "recommended";
var safety_module_search_text = "";
var safety_module_listing_requested = false;

var safety_module_sort_options = {
    recommended: "Recommended",
    title_asc: "Title (A–Z)",
    title_desc: "Title (Z–A)",
    progress_desc: "Progress (High → Low)",
    progress_asc: "Progress (Low → High)"
};

// Shared by Safety Modules and Assessments; all filtering remains client-side.
function get_lms_item_tags(tag) {
    if (tag == null) {
        return [];
    }

    // A module can be returned with a comma-separated tag list; treat each value as a filterable tag.
    return String(tag).split(",").map(function (item) {
        return item.trim();
    }).filter(function (item) {
        return item !== "";
    });
}

function get_lms_item_progress(item) {
    var progress = Number(item.Progress);
    return isNaN(progress) ? 0 : progress;
}

function get_lms_visible_items(items, selected_tag, search_text, sort_option, title_field, description_field) {
    var normalized_search = String(search_text || "").trim().toLowerCase();
    return items.filter(function (item) {
        var tags = get_lms_item_tags(item.Tag != null ? item.Tag : item.tag);
        var matches_tag = selected_tag === "All" || tags.some(function (tag) {
            return tag.toLowerCase() === selected_tag.toLowerCase();
        });
        if (!matches_tag || normalized_search === "") {
            return matches_tag;
        }
        // Build a lowercase search index once per item and reuse it across
        // keystrokes instead of re-joining/-lowercasing on every filter pass.
        if (item._lms_search_index === undefined) {
            item._lms_search_index = [item[title_field], item[description_field], item.Tag != null ? item.Tag : item.tag]
                .filter(function (value) { return value != null; })
                .join(" ").toLowerCase();
        }
        return item._lms_search_index.indexOf(normalized_search) !== -1;
    }).sort(function (a, b) {
        if (sort_option === "title_asc") return String(a[title_field] || "").localeCompare(String(b[title_field] || ""));
        if (sort_option === "title_desc") return String(b[title_field] || "").localeCompare(String(a[title_field] || ""));
        if (sort_option === "progress_desc") return get_lms_item_progress(b) - get_lms_item_progress(a);
        if (sort_option === "progress_asc") return get_lms_item_progress(a) - get_lms_item_progress(b);
        return a._lms_item_order - b._lms_item_order;
    });
}

function get_safety_module_tags(tag) {
    return get_lms_item_tags(tag);
}

function get_safety_module_progress(module) {
    return get_lms_item_progress(module);
}

function render_safety_module_search() {
    var search = '<i class="fa fa-search"></i>';
    search += '<input type="search" class="sample-safety-search-input" placeholder="Search modules" aria-label="Search modules" value="' + safety_module_search_text.replace(/"/g, '&quot;') + '">';
    $(".sample-safety-search").not(".assessment-search").html(search);
}

function render_safety_module_tags() {
    var tags = [];
    var seen_tags = {};

    safety_module_data.forEach(function (module) {
        get_safety_module_tags(module.Tag != null ? module.Tag : module.tag).forEach(function (tag) {
            var tag_key = tag.toLowerCase();
            if (!seen_tags[tag_key]) {
                seen_tags[tag_key] = true;
                tags.push(tag);
            }
        });
    });

    var str = '<div class="sample-safety-chip' + (selected_safety_tag === "All" ? ' active' : '') + '" data-safety-tag="All">';
    str += '<span class="sample-safety-check"><i class="fa fa-check"></i></span><span>All</span></div>';
    tags.forEach(function (tag) {
        str += '<div class="sample-safety-chip' + (selected_safety_tag === tag ? ' active' : '') + '" data-safety-tag="' + tag.replace(/"/g, '&quot;') + '">';
        str += '<span class="sample-safety-check"><i class="fa fa-check"></i></span><span>' + tag + '</span></div>';
    });

    $(".sample-safety-tabs").not(".assessment-tabs").html(str);
}

function render_safety_module_sort_menu() {
    var str = '<div class="sample-safety-sort-menu" aria-hidden="true">';
    str += '<div class="sample-safety-sort-title">Sort by</div>';
    Object.keys(safety_module_sort_options).forEach(function (key) {
        str += '<a href="#" class="sample-safety-sort-option' + (selected_safety_sort === key ? ' active' : '') + '" data-safety-sort="' + key + '">';
        str += '<span>' + safety_module_sort_options[key] + '</span><i class="fa fa-check"></i></a>';
    });
    str += '</div>';

    $(".sample-safety-sort-menu").not(".assessment-sort-menu").remove();
    $(".sample-safety-search-row").not(".assessment-search-row").append(str);
}

function render_safety_module_cards() {
    var visible_modules = get_lms_visible_items(safety_module_data, selected_safety_tag, safety_module_search_text, selected_safety_sort, "Module_Name", "Module_Description");

    var str = '';
    if (visible_modules.length === 0) {
        str = '<div class="sample-safety-empty-state">No modules found</div>';
    }
    visible_modules.forEach(function (module) {
        var Module_Id = module.Module_Id;
        var Module_Name = module.Module_Name;
        var Module_Description = module.Module_Description;
        var Module_Schedule_Id = module.Module_Schedule_Id;
        var Thumbnail_link = module.Thumbnail_link;
        var Progress = Math.round(get_safety_module_progress(module));
        var Score = (module.Score === "" || module.Score == null) ? "0" : module.Score;
        var Tag = module.Tag != null ? module.Tag : module.tag;
        var TotalSkill = module.TotalSkill;
        var TotalQuestion = module.TotalQuestion;
        var SubmitedSkill = module.SubmitedSkill;

        if (Thumbnail_link === "" || Thumbnail_link == null) {
            Thumbnail_link = "images/bg2.jpg";
        }

        var onclick_str = "get_target_skill_by_module_id('" + Module_Id + "', '" + Progress + "', '" + SubmitedSkill + "', '" + Module_Schedule_Id + "')";
        str += '<div class="sample-module-card" Module_Id="' + Module_Id + '" onclick="' + onclick_str + '">';
        str += '<div class="sample-module-image"><img src="' + Thumbnail_link + '" alt="' + Module_Name + '" loading="lazy" onload="this.parentNode.classList.add(\'img-ready\')">';
        if (Tag !== "" && Tag != null) {
            str += '<span class="sample-module-tag">' + Tag + '</span>';
        }
        if (SubmitedSkill > 0) {
            str += '<span class="sample-score-tag">Score: ' + Score + '/' + TotalQuestion + '</span>';
        }
        str += '</div><div class="sample-module-card-body">';
        str += '<div class="sample-module-title">' + Module_Name + '</div>';
        str += '<div class="sample-module-desc">' + Module_Description + '</div>';
        str += '<div class="sample-module-meta"><div class="sample-module-lessons">';
        str += '<span class="sample-module-help"><i class="fa fa-book-open"></i></span>';
        str += '<span class="sample-lession-count">' + TotalSkill + ' lessons</span></div>';
        str += '<div class="sample-module-percent">' + Progress + '%</div></div>';
        str += '<div class="sample-module-progress"><span style="width:' + Progress + '%"></span></div>';
        str += '</div></div>';
    });

    $("#dv_Module_List").html(str);

    // Subtle staggered reveal (no overshoot on data-dense lists).
    document.querySelectorAll('#dv_Module_List .sample-module-card').forEach(function (c, i) {
        c.style.animationDelay = (i * 40) + 'ms';
    });
}

function bind_safety_module_controls() {
    $(document).off("input.safetyModules", ".sample-safety-search-input:not(.assessment-search-input)").on("input.safetyModules", ".sample-safety-search-input:not(.assessment-search-input)", function () {
        safety_module_search_text = $(this).val();
        render_safety_module_cards();
    });

    $(document).off("click.safetyModules", ".sample-safety-tabs:not(.assessment-tabs) .sample-safety-chip").on("click.safetyModules", ".sample-safety-tabs:not(.assessment-tabs) .sample-safety-chip", function () {
        selected_safety_tag = $(this).attr("data-safety-tag");
        render_safety_module_tags();
        render_safety_module_cards();
    });

    $(document).off("click.safetyModules", ".sample-safety-filter:not(.assessment-filter)").on("click.safetyModules", ".sample-safety-filter:not(.assessment-filter)", function (event) {
        event.preventDefault();
        var menu = $(".sample-safety-sort-menu").not(".assessment-sort-menu");
        menu.toggleClass("visible");
        menu.attr("aria-hidden", !menu.hasClass("visible"));
    });

    $(document).off("click.safetyModules", ".sample-safety-sort-menu:not(.assessment-sort-menu) .sample-safety-sort-option").on("click.safetyModules", ".sample-safety-sort-menu:not(.assessment-sort-menu) .sample-safety-sort-option", function (event) {
        event.preventDefault();
        selected_safety_sort = $(this).attr("data-safety-sort");
        render_safety_module_sort_menu();
        render_safety_module_cards();
    });
}

function apply_safety_modules(responseText, isRefresh) {
    var myArray;
    try { myArray = JSON.parse(responseText); } catch (e) { return; }
    var status = myArray[0].status;
    if (status == 1) {
        var data = JSON.parse(myArray[0]["data"]);
        safety_module_data = data.map(function (module, index) {
            module._lms_item_order = index;
            return module;
        });
        // On the silent background refresh, keep the user's active filter/sort/
        // search instead of resetting them mid-interaction.
        if (!isRefresh) {
            selected_safety_tag = "All";
            selected_safety_sort = "recommended";
            safety_module_search_text = "";
            render_safety_module_search();
            render_safety_module_tags();
            render_safety_module_sort_menu();
            bind_safety_module_controls();
        }
        render_safety_module_cards();
    }
    else if (!isRefresh) {
        safety_module_listing_requested = false;
        safety_module_data = [];
        render_safety_module_cards();
    }
}

function get_safety_module_listing(force_refresh) {
    if (safety_module_listing_requested && !force_refresh) {
        return;
    }
    safety_module_listing_requested = true;

    let role_id_array = localStorage.getItem('role_id_array');

    var Param_obj = [];
    Param_obj.push({
        'Role_Id': role_id_array
    });

    var lms_modules_url = global_wcf_url_lms + 'LMS_Select_Module_RoleWise';
    var lms_modules_cache_key = 'modules_' + role_id_array;

    // Cache-first: paint cached modules instantly (skeletons only on the very
    // first load), then refresh silently. Falls back to the original network-
    // only path if the LmsData layer is unavailable.
    if (typeof LmsData !== 'undefined') {
        var had_cache = LmsData.getCache(lms_modules_cache_key) != null;
        if (!had_cache) {
            LmsData.showSkeletons("#dv_Module_List", 4);
        }
        LmsData.fetch(lms_modules_cache_key, lms_modules_url, JSON.stringify(Param_obj),
            function (txt, source) {
                apply_safety_modules(txt, source === 'network' && had_cache);
            },
            function (err) {
                if (!had_cache) {
                    safety_module_listing_requested = false;
                    LmsData.showError("#dv_Module_List", "get_safety_module_listing(true)");
                }
            },
            { timeout: 15000, retries: 1 }
        );
        return;
    }

    $("#dv_Module_List").empty();
    loading();

    var getdata = new Webservicecall_REST(lms_modules_url, JSON.stringify(Param_obj), function (e) {
        var responseText = e.responseText;
        var myArray = JSON.parse(responseText);
        var status = myArray[0].status;
        if (status == 1) {
            let data = myArray[0]["data"];
            data = JSON.parse(data);

            safety_module_data = data.map(function (module, index) {
                module._lms_item_order = index;
                return module;
            });
            selected_safety_tag = "All";
            selected_safety_sort = "recommended";
            safety_module_search_text = "";
            render_safety_module_search();
            render_safety_module_tags();
            render_safety_module_sort_menu();
            bind_safety_module_controls();
            render_safety_module_cards();

            /*for (let m = 0; m < data.length; m++) {
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

                let Tag = data[m].Tag;

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


                if (Tag == "" || Tag == null || Tag == undefined) { }
                else {
                    str += '<span class="sample-module-tag">' + Tag + '</span>';
                }

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
            }*/
        }
        else {
            safety_module_listing_requested = false;
            safety_module_data = [];
            render_safety_module_cards();
            // myApp.popup.close('.popup-level-2'); // Optional: Do we really want to close the popup if it was open? Actually the modules are on the main tab now, not a popup.
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

    safetyModulePreviewActive = true;
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
        $(".module-preview-header").css("background-image", "linear-gradient(180deg, rgba(6, 18, 66, 0.20), rgba(4, 6, 20, 0.60)), url('" + module_bg + "')");

        let module_tag = $("#dv_Module_List").find("div[Module_Id='" + Module_Id + "']").find("span.sample-module-tag").html();
        $(".module-preview-tag").html(module_tag);

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
                let Video_Time = data[m].Video_Time;
                if (Video_Time == "" || Video_Time == null || Video_Time == undefined) {
                    Video_Time = "00:00";
                }
                let Thumbnail_link = data[m].Thumbnail_link;

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

                // Thumbnail opens the lesson directly; tapping the body toggles the
                // full description. Chevron + question count removed; duration moved
                // into the thumbnail overlay (clock icon removed).
                let str = '<div class="lesson-preview-card">';
                str += '<div class="lesson-preview-thumb" onclick="' + onclick_str + '">';

                if (Thumbnail_link == "" || Thumbnail_link == null || Thumbnail_link == undefined) {
                    str += '<img src="images/bg2.jpg">';
                }
                else {
                    str += '<img src="' + Thumbnail_link + '">';
                }

                if (Progress == "100") {
                    str += '<span class="lesson-preview-check" style="background: #2dbb72;"><i class="fa fa-check"></i></span>';
                }
                else {
                    str += '<span class="lesson-preview-check"><i class="fa fa-play" style="font-size: 14px"></i></span>';
                }

                str += '<span class="lesson-preview-duration">' + Video_Time + '</span>';
                str += '</div>';
                str += '<div class="lesson-preview-body" onclick="this.parentNode.classList.toggle(\'desc-expanded\')">';
                str += '<div class="lesson-preview-name">' + Skill_Name + '</div>';
                str += '<div class="lesson-preview-subtitle">' + Skill_Description + '</div>';
                str += '<div class="lesson-preview-footer">';

                if (Progress == "100") {
                    str += '<span class="lesson-preview-status completed">Completed</span>';
                }
                else {
                    str += '<span class="lesson-preview-status progress">Pending</span>';
                }

                str += '</div>';
                str += '</div>';
                str += '</div> ';

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

    safetyVideoPopupActive = true;
    safetyVideoReturnedFromFullscreen = false;
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
            safety_quiz_data = merge_array;
            safety_quiz_progress = String(Progress);

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

// ============================================================================
// Learning-video quiz — centered ML-style modal shown over the video (portrait
// and container full-screen). One question at a time with a "N of M" counter,
// local validation + correct/incorrect feedback, and a single batch submit at
// the end via the existing module API. Pauses the video (timestamp preserved)
// and resumes on completion/dismiss.
// ============================================================================
var safety_quiz_data = [];
var safety_quiz_progress = "0";
var safety_quiz_index = 0;
var safety_quiz_answers = {};
var safety_quiz_locked = false;

function safety_quiz_review() { return safety_quiz_progress == "100"; }

function safety_quiz_start() {
    if (!safety_quiz_data || !safety_quiz_data.length) { $("#dv_Question_List").show(); return; }
    safety_quiz_index = 0;
    safety_quiz_answers = {};
    var v = document.getElementById('vdo_Question');
    if (v) { try { set_progress_local(); v.pause(); } catch (e) { } } // pause; timestamp preserved
    safety_quiz_render();
    var m = document.getElementById('safety-quiz-modal');
    if (m) { m.style.display = 'flex'; m.setAttribute('aria-hidden', 'false'); requestAnimationFrame(function () { m.classList.add('open'); }); }
}

function safety_quiz_render() {
    var q = safety_quiz_data[safety_quiz_index];
    if (!q) return;
    var total = safety_quiz_data.length;
    var review = safety_quiz_review();
    var opts = q.OptionText || [];
    var valid = (q.Valid_Answer && q.Valid_Answer[0]) ? String(q.Valid_Answer[0]).trim() : '';

    document.getElementById('safety-quiz-counter').textContent = (safety_quiz_index + 1) + ' of ' + total;
    document.getElementById('safety-quiz-question').innerHTML =
        '<i class="fa-solid fa-lightbulb" style="color:#fbbc05;margin-right:8px;"></i>' + q.Skill_Question_Name;

    var html = '';
    for (var j = 0; j < opts.length; j++) {
        var txt = String(opts[j] || '').trim();
        var cls = '';
        var checked = '';
        var dis = '';
        if (review) {
            dis = ' disabled';
            if (txt === valid) cls = ' safety-correct';
            else if (q.ans && String(q.ans).trim() === txt) cls = ' safety-incorrect';
        }
        html += '<li class="' + cls.trim() + '"><label class="item-radio item-content">' +
            '<input type="radio" name="safety_quiz_opt" value="' + j + '"' + checked + dis + '>' +
            '<i class="icon icon-radio"></i>' +
            '<div class="item-inner"><div class="item-title">' + txt + '</div></div>' +
            '</label></li>';
    }
    document.getElementById('safety-quiz-options').innerHTML = html;

    safety_quiz_locked = false;
    var btn = document.getElementById('safety-quiz-submit');
    var last = (safety_quiz_index === total - 1);
    btn.style.visibility = 'visible';
    btn.textContent = review ? (last ? 'Done' : 'Next') : 'Submit';
}

// Single button handler: validates + shows feedback in normal mode, or advances
// in review mode.
function safety_quiz_action() {
    if (safety_quiz_review()) { safety_quiz_next(); return false; }
    if (safety_quiz_locked) { return false; } // feedback is animating; ignore taps

    var q = safety_quiz_data[safety_quiz_index];
    if (!q) return false;
    var opts = q.OptionText || [];
    var valid = (q.Valid_Answer && q.Valid_Answer[0]) ? String(q.Valid_Answer[0]).trim() : '';

    var sel = document.querySelector('#safety-quiz-options input[name="safety_quiz_opt"]:checked');
    if (!sel) { alert("Please select answer!"); return false; }

    var selIdx = parseInt(sel.value, 10);
    var selText = String(opts[selIdx] || '').trim();
    safety_quiz_answers[q.Skill_Que_Id] = { name: q.Skill_Question_Name, ans: selText };

    var lis = document.querySelectorAll('#safety-quiz-options li');
    for (var k = 0; k < opts.length; k++) {
        var t = String(opts[k] || '').trim();
        if (t === valid) lis[k].classList.add('safety-correct');
        else if (k === selIdx) lis[k].classList.add('safety-incorrect');
    }
    document.querySelectorAll('#safety-quiz-options input').forEach(function (inp) { inp.disabled = true; });
    try { vibrate_device(); } catch (e) { }

    safety_quiz_locked = true;
    document.getElementById('safety-quiz-submit').style.visibility = 'hidden';
    setTimeout(safety_quiz_next, 1600); // auto-advance (ML pattern)
    return false;
}

function safety_quiz_next() {
    safety_quiz_index++;
    if (safety_quiz_index < safety_quiz_data.length) {
        safety_quiz_render();
    } else {
        safety_quiz_finish();
    }
}

function safety_quiz_finish() {
    if (safety_quiz_review()) { safety_quiz_close(); return; }

    var user_id = JSON.parse(storage.getItem('user_id'));
    var user_name = JSON.parse(storage.getItem('user_name'));
    var circle_name = JSON.parse(storage.getItem('circle_name'));
    var Skill_Id = $("#vdo_Question").attr("skil_id");

    var Param_obj = [];
    for (var i = 0; i < safety_quiz_data.length; i++) {
        var q = safety_quiz_data[i];
        var rec = safety_quiz_answers[q.Skill_Que_Id];
        Param_obj.push({
            "User_ID": user_id,
            "User_Name": user_name,
            "Skill_Id": Skill_Id,
            "Skill_Que_Id": q.Skill_Que_Id,
            "Skill_Question_Name": q.Skill_Question_Name,
            "Ans": rec ? [rec.ans] : [],
            "Circle": circle_name,
            "Module_Schedule_Id": glob_Module_Schedule_Id
        });
    }

    loading();
    var g = new Webservicecall_REST(global_wcf_url_lms + 'LMS_InsertUpdateDelete_Skill_Question_Log_Master', JSON.stringify(Param_obj), function (e) {
        loading_hide();
        var arr;
        try { arr = JSON.parse(e.responseText); } catch (er) { arr = [{ status: 0, message: 'Error' }]; }
        if (arr[0].status == 1) {
            safety_quiz_close_modal();
            get_video_skill_by_module_id('submit');
            myApp.popup.close('.popup-level-4');
        } else {
            alert(arr[0].message);
        }
    }, onfail);
    g.callOtherDomain();
}

function safety_quiz_close_modal() {
    var m = document.getElementById('safety-quiz-modal');
    if (m) {
        m.classList.remove('open');
        m.setAttribute('aria-hidden', 'true');
        setTimeout(function () { m.style.display = 'none'; }, 240);
    }
}

function safety_quiz_close() {
    safety_quiz_close_modal();
    var v = document.getElementById('vdo_Question');
    if (v && !v.ended) { try { v.play(); } catch (e) { } } // resume from same timestamp
    return false;
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
                alert("All answers are required!");
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

    var videolog_success = function (e) {
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
    };

    // Offline-tolerant: online this behaves exactly as before; offline / on a
    // network drop the progress log is queued and replayed on reconnect.
    if (typeof LmsData !== 'undefined' && LmsData.postAction) {
        LmsData.postAction(global_wcf_url_lms + 'LMS_Skill_VideoLog_Master', JSON.stringify(Param_obj), 'skill_videolog', videolog_success, onfail);
    } else {
        var getdata = new Webservicecall_REST(global_wcf_url_lms + 'LMS_Skill_VideoLog_Master', JSON.stringify(Param_obj), videolog_success, onfail);
        getdata.callOtherDomain();
    }
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
                get_safety_module_listing(true);
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
