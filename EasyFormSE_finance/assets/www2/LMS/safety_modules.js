
// Safety module listing (level 1)
var glob_Module_Schedule_Id = 0;
// Guards the hardware-Back watch-log request for the currently open lesson.
var safetyVideoWatchLogInProgress = false;
// True only after playback occurs during the currently open Safety video.
var safety_video_played = false;
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

// Chips carry the tag label only — the per-chip count badges were removed in
// favour of the single .lms-filter-summary line below the row (rendered from
// render_safety_module_cards(), where the real visible count lives).
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

    if (typeof lms_render_filter_summary === 'function') {
        lms_render_filter_summary('lms_module_filter_summary', selected_safety_tag, visible_modules.length);
    }

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
        str += '<div class="sample-module-image"><img src="' + Thumbnail_link + '" alt="' + Module_Name + '" loading="lazy" onload="this.parentNode.classList.add(\'img-ready\'); if(typeof lms_apply_corner_contrast===\'function\') lms_apply_corner_contrast(this.src, this.parentNode);">';
        if (Tag !== "" && Tag != null) {
            str += '<span class="sample-module-tag">' + Tag + '</span>';
        }
        if (SubmitedSkill > 0) {
            str += '<span class="sample-score-tag"><span class="sample-score-label">Score:</span> ';
            str += '<span class="sample-score-current">' + Score + '</span><span class="sample-score-sep">/</span>';
            str += '<span class="sample-score-total">' + TotalQuestion + '</span></span>';
        }
        if (typeof lms_format_clock_time === 'function') {
            var watchedSec = (typeof lms_get_module_watched_seconds === 'function')
                ? lms_get_module_watched_seconds(Module_Id)
                : ((typeof lms_get_watch_seconds_by_item === 'function') ? lms_get_watch_seconds_by_item('lms_watch_seconds_modules', Module_Id) : 0);
            var totalSec = 0;
            if (lms_module_video_totals) {
                totalSec = lms_module_video_totals[Module_Id] || lms_module_video_totals[String(Module_Id)] || 0;
            }
            str += '<span class="sample-module-watchtime">';
            str += '<span class="sample-watchtime-elapsed">' + lms_format_clock_time(watchedSec) + '</span>';
            str += '<span class="sample-watchtime-sep">/</span>';
            str += '<span class="sample-watchtime-total">' + lms_format_clock_time(totalSec) + '</span></span>';
        }
        str += '</div><div class="sample-module-card-body">';
        str += '<div class="sample-module-title">' + Module_Name + '</div>';
        str += '<div class="sample-module-desc">' + Module_Description + '</div>';
        str += '<div class="sample-module-meta"><div class="sample-module-lessons">';
        str += '<span class="sample-module-help"><i class="fa fa-book-open"></i></span>';
        str += '<span class="sample-lession-count">' + TotalSkill + ' lessons</span></div>';
        str += '<div class="sample-module-percent">' + Progress + '%</div></div>';
        str += '</div>';
        str += '<div class="sample-module-progress"><span style="width:' + Progress + '%"></span></div>';
        str += '</div>';
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
        update_module_kpi();
        if (isRefresh) {
            if (typeof lms_prune_module_catalog === 'function') lms_prune_module_catalog(safety_module_data);
            lms_module_total_time_started = false;
        }
        lms_compute_module_total_video_time();
    }
    else if (!isRefresh) {
        safety_module_listing_requested = false;
        safety_module_data = [];
        update_module_kpi();
        render_safety_module_cards();
    }
}

// Shared: Completed % (Progress >= 100) and Avg score % (Score/TotalQuestion) across
// attempted items — used by the Modules tab card, Assessments tab card, and the
// Dashboard tab's per-category card.
function lms_compute_completion_kpi(items) {
    var total = (items || []).length;
    var completed = 0;
    var scoreSum = 0, scoreCount = 0;

    (items || []).forEach(function (item) {
        if (get_lms_item_progress(item) >= 100) completed++;
        var totalQ = Number(item.TotalQuestion) || 0;
        var submitted = Number(item.SubmitedSkill) || Number(item.SubmitedQuestion) || 0;
        var score = Number(item.Score);
        if (submitted > 0 && totalQ > 0 && !isNaN(score)) {
            scoreSum += (score / totalQ) * 100;
            scoreCount++;
        }
    });

    return {
        completedPct: total > 0 ? Math.round((completed / total) * 100) : 0,
        avgScorePct: scoreCount > 0 ? Math.round(scoreSum / scoreCount) : 0
    };
}

// Summary cards at the top of the Modules tab.
function update_module_kpi() {
    var completedEl = document.getElementById('kpi_module_completed_pct');
    var scoreEl = document.getElementById('kpi_module_avg_score');
    var watchEl = document.getElementById('kpi_module_watch_time');
    var totalEl = document.getElementById('kpi_module_total_time');
    if (!completedEl && !scoreEl && !watchEl && !totalEl) return;
    var k = lms_compute_completion_kpi(safety_module_data);
    if (completedEl) lms_set_info_value(completedEl, k.completedPct + '%');
    if (scoreEl) lms_set_info_value(scoreEl, k.avgScorePct + '%');
    if (watchEl && typeof lms_format_watch_time === 'function') {
        var watchedSec = (typeof lms_sum_active_modules_watch_seconds === 'function')
            ? lms_sum_active_modules_watch_seconds()
            : ((typeof lms_get_watch_seconds === 'function') ? lms_get_watch_seconds('lms_watch_seconds_modules') : 0);
        lms_set_info_value(watchEl, lms_format_watch_time(watchedSec));
    }
    if (totalEl && typeof lms_format_watch_time === 'function') {
        var totalSec = (typeof lms_sum_active_modules_total_video_seconds === 'function')
            ? lms_sum_active_modules_total_video_seconds() : 0;
        if (totalSec <= 0) {
            try {
                var cached = JSON.parse(localStorage.getItem('lms_video_durations_modules')) || {};
                (safety_module_data || []).forEach(function (m) {
                    var d = cached[String(m.Module_Id)];
                    if (typeof d === 'number') totalSec += d;
                });
            } catch (e) { }
        }
        lms_set_info_value(totalEl, lms_format_watch_time(totalSec));
    }
}

// Library-wide total video length across every module — fetches each module's
// skill list (LMS_Select_Skill_Master_RoleWise), then real durations for every
// lesson video (see lms_sum_video_durations in LMS_Misc.js). Runs once per
// session; real network/bandwidth cost, accepted for a true course-wide total.
var lms_module_total_time_started = false;
function lms_fetch_all_module_skills(modules, onDone) {
    var allSkills = [];
    if (!modules || !modules.length) { onDone(allSkills); return; }

    var CONCURRENCY = 3;
    var nextIdx = 0;
    var pending = modules.length;

    function fetchOne(mod, cb) {
        var Param_obj = [{ 'Module_Id': mod.Module_Id }];
        var getdata = new Webservicecall_REST(global_wcf_url_lms + 'LMS_Select_Skill_Master_RoleWise', JSON.stringify(Param_obj), function (e) {
            try {
                var arr = JSON.parse(e.responseText);
                if (arr[0].status == 1) {
                    var skills = JSON.parse(arr[0].data);
                    // The response doesn't echo Module_Id back (it's already scoped
                    // by the request) — tag it here so per-module totals can be
                    // grouped back out after allSkills gets flattened below.
                    skills.forEach(function (s) { s._lms_module_id = mod.Module_Id; });
                    cb(skills);
                    return;
                }
            } catch (err) { }
            cb([]);
        }, function () { cb([]); });
        getdata.callOtherDomain();
    }

    function pump() {
        if (nextIdx >= modules.length) return;
        var mod = modules[nextIdx++];
        fetchOne(mod, function (skills) {
            allSkills = allSkills.concat(skills || []);
            pending--;
            if (pending <= 0) { onDone(allSkills); }
            else { pump(); }
        });
    }

    var starters = Math.min(CONCURRENCY, modules.length);
    for (var i = 0; i < starters; i++) pump();
}

// Module_Id -> total seconds across that module's lessons, derived from the
// same lms_video_durations_modules cache (keyed by Skill_Id) the library-wide
// KPI total already uses — powers the per-card "watched / total" row.
var lms_module_video_totals = {};

function lms_compute_module_total_video_time() {
    if (lms_module_total_time_started) return;
    if (!safety_module_data || !safety_module_data.length) return;
    lms_module_total_time_started = true;

    lms_fetch_all_module_skills(safety_module_data, function (allSkills) {
        // The background fetch is the only place that sees every assigned
        // lesson at once. Ingest its saved Watch_Video_Time values before
        // calculating Dashboard totals; opening a module must not be required.
        if (typeof LmsBackend !== 'undefined') LmsBackend.ingestSkillRows(allSkills);
        lms_sum_video_durations('lms_video_durations_modules', allSkills, 'Skill_Id', 'Video_Link', function () {
            var cached = {};
            try { cached = JSON.parse(localStorage.getItem('lms_video_durations_modules')) || {}; } catch (e) { cached = {}; }
            var totals = {};
            lms_module_skill_index = {};
            allSkills.forEach(function (s) {
                var modId = String(s._lms_module_id);
                var sid = String(s.Skill_Id);
                var dur = cached[sid];
                if (s._lms_module_id != null) {
                    if (!lms_module_skill_index[modId]) lms_module_skill_index[modId] = [];
                    if (lms_module_skill_index[modId].indexOf(sid) === -1) {
                        lms_module_skill_index[modId].push(sid);
                    }
                    if (typeof dur === 'number') {
                        totals[modId] = (totals[modId] || 0) + dur;
                        lms_skill_total_seconds[sid] = dur;
                    }
                }
            });
            lms_module_video_totals = totals;
            if (typeof lms_reconcile_all_module_watch === 'function') lms_reconcile_all_module_watch();
            update_module_kpi();
            // The Dashboard may have rendered before these asynchronous skill
            // rows arrived, so refresh its existing cards with API totals now.
            if (typeof update_lms_kpi === 'function') update_lms_kpi();
            // per-card watched/total row now has real totals to show
            if (typeof render_safety_module_cards === 'function') render_safety_module_cards();
        });
    });
}

function get_safety_module_listing(force_refresh) {
    if (typeof lms_reset_listings_if_role_changed === 'function' && lms_reset_listings_if_role_changed()) {
        force_refresh = true;
    }
    if (force_refresh) {
        safety_module_listing_requested = false;
        lms_module_total_time_started = false;
    }
    if (safety_module_listing_requested && !force_refresh) {
        return;
    }
    safety_module_listing_requested = true;

    let role_id = (typeof lms_get_listing_role_ids === 'function')
        ? lms_get_listing_role_ids()
        : localStorage.getItem('role_id_array');

    var Param_obj = [];
    Param_obj.push({
        'Role_Id': role_id
    });

    var lms_modules_url = global_wcf_url_lms + 'LMS_Select_Module_RoleWise';
    var lms_modules_cache_key = (typeof lms_listing_cache_key === 'function')
        ? lms_listing_cache_key('modules', role_id)
        : ('modules_' + role_id);

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
            { timeout: 15000, retries: 1, force: !!force_refresh }
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
            update_module_kpi();
            lms_compute_module_total_video_time();

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
            update_module_kpi();
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


// Monotonic preview request id. A response may only paint the popup when it
// still belongs to the most recently selected module.
var lms_module_preview_request_id = 0;

// get modulewise videos (level 2)
function get_target_skill_by_module_id(Module_Id, Progress, SubmitedSkill, Module_Schedule_Id) {

    var previewRequestId = ++lms_module_preview_request_id;
    glob_Module_Schedule_Id = Module_Schedule_Id;

    // Clear every module-bound field before opening/calling the API. The popup
    // must show the existing preloader over a blank state, never the last
    // module's title, artwork, progress, description, or lesson/watch data.
    $('.module-preview-header').css('background-image', 'none');
    $('.module-preview-tag, .module-preview-title, .module-preview-desc, .lession-count, .module-preview-percent').empty();
    $('.module-preview-progress').find('span').css('width', '0%');
    $('.lesson-preview-list').empty();

    safetyModulePreviewActive = true;
    myApp.popup.open('.lms-module-preview-popup');

    var Param_obj = [];
    Param_obj.push({
        'Module_Id': Module_Id
    });
    loading();

    var getdata = new Webservicecall_REST(global_wcf_url_lms + 'LMS_Select_Skill_Master_RoleWise', JSON.stringify(Param_obj), function (e) {
        // Ignore stale responses when another module was selected (or this
        // preview was closed) while the request was in flight.
        if (previewRequestId !== lms_module_preview_request_id || !safetyModulePreviewActive) return;
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

            // Hand the raw server rows to the integration seam before anything
            // renders. Today they carry no progress fields and this does
            // nothing; once the backend ships Watch_Seconds / Resume_Position
            // it starts serving them with no further client change.
            if (typeof LmsBackend !== 'undefined') LmsBackend.ingestSkillRows(data);

            $(".lession-count").html(data.length + " lessons - " + SubmitedSkill + " completed");

            let lms_video_durations_cache = {};
            try { lms_video_durations_cache = JSON.parse(localStorage.getItem('lms_video_durations_modules')) || {}; } catch (e) { }

            var lessonMeta = [];

            for (let m = 0; m < data.length; m++) {
                let Skill_Id = data[m].Skill_Id;
                let Skill_Name = data[m].Skill_Name;
                let Skill_Description = data[m].Skill_Description;
                let Video_Link = data[m].Video_Link;
                // The server's own Video_Time field is present in the schema but
                // empty in practice (see lms_sum_video_durations's own comment) —
                // prefer the real fetched duration this module's card total
                // already uses (lms_video_durations_modules, keyed by Skill_Id,
                // populated by lms_compute_module_total_video_time()) before
                // falling back to the raw field, then to a bare placeholder.
                // A module opened before that background fetch reaches it is
                // topped up by the lms_sum_video_durations call below.
                let Video_Time = data[m].Video_Time;
                let real_duration_sec = lms_video_durations_cache[String(Skill_Id)];
                if (typeof real_duration_sec === 'number' && typeof lms_format_clock_time === 'function') {
                    Video_Time = lms_format_clock_time(real_duration_sec);
                }
                else if (Video_Time == "" || Video_Time == null || Video_Time == undefined) {
                    Video_Time = "00:00";
                }
                // Bind each card to the watched time returned for that skill by
                // LMS_Select_Skill_Master_RoleWise; blank values retain 00:00.
                let Watch_Video_Time = data[m].Watch_Video_Time;
                if (Watch_Video_Time == null || String(Watch_Video_Time).trim() === "") {
                    Watch_Video_Time = "00:00";
                }
                else {
                    Watch_Video_Time = String(Watch_Video_Time).trim();
                }
                lessonMeta.push({
                    skillId: Skill_Id,
                    totalSec: (typeof real_duration_sec === 'number' && real_duration_sec > 0) ? real_duration_sec : 0
                });
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

                // Server Progress is only ever 0 or 100 here, so fold in local
                // playback progress to tell "part-watched" apart from "untouched".
                let eff_progress = (typeof lms_get_lesson_effective_progress === 'function')
                    ? lms_get_lesson_effective_progress(Skill_Id, Progress, Watch_Video_Time)
                    : Number(Progress) || 0;

                // Watched / total, e.g. "01:12/06:19". Watched time is supplied
                // per skill by the listing API rather than inferred locally.
                let elapsed_str = Watch_Video_Time;

                // Thumbnail opens the lesson directly; tapping the body toggles the
                // full description. Duration now sits under the thumbnail (it was an
                // overlay pill on top of it) so it never covers the artwork.
                // skill/module ids + video length live on the element so the row can
                // be refreshed in place (see refresh_lesson_preview_rows) without
                // re-fetching the whole lesson list.
                let str = '<div class="lesson-preview-card" data-skill-id="' + Skill_Id + '" data-module-id="' + Module_Id + '" data-module-schedule-id="' + glob_Module_Schedule_Id + '" data-video-time="' + Video_Time + '" data-watch-video-time="' + Watch_Video_Time + '" data-server-progress="' + Progress + '">';
                str += '<div class="lesson-preview-media">';
                str += '<div class="lesson-preview-thumb" onclick="' + onclick_str + '">';

                if (Thumbnail_link == "" || Thumbnail_link == null || Thumbnail_link == undefined) {
                    str += '<img src="images/bg2.jpg">';
                }
                else {
                    str += '<img src="' + Thumbnail_link + '">';
                }

                if (eff_progress >= 100) {
                    str += '<span class="lesson-preview-check" style="background: #2dbb72;"><i class="fa fa-check"></i></span>';
                }
                else {
                    str += '<span class="lesson-preview-check"><i class="fa fa-play" style="font-size: 14px"></i></span>';
                }

                str += '</div>';
                str += '<span class="lesson-preview-duration">';
                str += '<span class="lesson-preview-elapsed">' + elapsed_str + '</span>';
                str += '<span class="lesson-preview-time-sep">/</span>';
                str += '<span class="lesson-preview-total">' + Video_Time + '</span>';
                str += '</span>';
                str += '</div>';
                str += '<div class="lesson-preview-body" onclick="this.parentNode.classList.toggle(\'desc-expanded\')">';
                str += '<div class="lesson-preview-name">' + Skill_Name + '</div>';
                str += '<div class="lesson-preview-subtitle">' + Skill_Description + '</div>';
                str += '<div class="lesson-preview-footer">';

                // Three states, not two: a part-watched lesson used to be labelled
                // "Pending" exactly like an untouched one.
                str += lms_lesson_status_html(eff_progress);

                // Score placeholder only — the value is filled in asynchronously by
                // load_lesson_scores(). This listing's own `Score` field is NOT a
                // score: it mirrors SubmitedQuestion exactly (a fully-answered
                // 5-question lesson reports 5 whether or not any answer was right),
                // which is why it used to render as "5/5". The real per-lesson score
                // comes from LMS_Select_User_Assessment_Rating.
                if (eff_progress >= 100 && Number(TotalQuestion) > 0) {
                    str += '<span class="lesson-preview-score" style="display:none"></span>';
                }

                str += '</div>';
                str += '</div>';
                str += '</div> ';

                $(".lesson-preview-list").append(str);

            }

            if (typeof lms_register_module_skills === 'function') {
                lms_register_module_skills(Module_Id, lessonMeta);
            }
            if (typeof lms_reconcile_orphan_module_watch === 'function') {
                lms_reconcile_orphan_module_watch(Module_Id, lessonMeta);
                if (typeof refresh_lesson_preview_rows === 'function') refresh_lesson_preview_rows();
                if (typeof lms_refresh_module_card_watchtime === 'function') lms_refresh_module_card_watchtime(Module_Id);
            }

            load_lesson_scores(Module_Id);

            // Top up any durations this module's own background pass hasn't
            // reached yet (shares the same cache key as
            // lms_compute_module_total_video_time(), so nothing is fetched
            // twice) and patch the placeholders in place once real numbers
            // land — otherwise a module opened quickly after the list loads
            // is stuck showing "00:00" for its lessons' total time forever.
            if (typeof lms_sum_video_durations === 'function') {
                lms_sum_video_durations('lms_video_durations_modules', data, 'Skill_Id', 'Video_Link', function () {
                    if (previewRequestId !== lms_module_preview_request_id || !safetyModulePreviewActive) return;
                    var fresh_cache = {};
                    try { fresh_cache = JSON.parse(localStorage.getItem('lms_video_durations_modules')) || {}; } catch (e) { }
                    $(".lesson-preview-list .lesson-preview-card").each(function () {
                        var card = this;
                        var skillId = card.getAttribute('data-skill-id');
                        var dur = fresh_cache[skillId];
                        if (typeof dur !== 'number' || typeof lms_format_clock_time !== 'function') return;
                        card.setAttribute('data-video-time', lms_format_clock_time(dur));
                    });
                    if (typeof refresh_lesson_preview_rows === 'function') refresh_lesson_preview_rows();
                });
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

    }, function (error) {
        // A superseded request must not hide the current module's loader or
        // display an error belonging to the previous selection.
        if (previewRequestId !== lms_module_preview_request_id || !safetyModulePreviewActive) return;
        onfail(error);
    });
    getdata.callOtherDomain();
}


// Status chip markup for a lesson, from its effective (server + local) progress.
function lms_lesson_status_html(effProgress) {
    if (effProgress >= 100) return '<span class="lesson-preview-status completed">Completed</span>';
    if (effProgress > 0) return '<span class="lesson-preview-status inprogress">In Progress</span>';
    return '<span class="lesson-preview-status pending">Pending</span>';
}

// Real per-lesson score. LMS_Select_User_Assessment_Rating returns Score /
// Total_Score (e.g. 2/5) — verified against the module card's own "Score: 3/20",
// which is exactly the sum of its lessons' scores from this endpoint. Fired once
// per completed lesson after the list paints, so the rows appear immediately and
// scores fill in; deliberately no loading() spinner for a background top-up, and
// a failure just leaves the score hidden rather than showing a wrong number.
function load_lesson_scores(Module_Id) {
    var user_id = JSON.parse(storage.getItem('user_id'));

    $(".lesson-preview-card").each(function () {
        var card = this;
        var scoreEl = card.querySelector('.lesson-preview-score');
        if (!scoreEl) return; // not completed / no questions

        var Skill_Id = card.getAttribute('data-skill-id');
        var Param_obj = [{ "User_Id": user_id, "Module_Id": Module_Id, "Course_Id": 0, "Skill_Id": Skill_Id }];

        var call = new Webservicecall_REST(global_wcf_url_lms + 'LMS_Select_User_Assessment_Rating', JSON.stringify(Param_obj), function (e) {
            try {
                var arr = JSON.parse(e.responseText);
                if (arr[0].status != 1) return;
                var row = JSON.parse(arr[0].data)[0];
                if (!row || Number(row.Total_Score) <= 0) return;

                scoreEl.innerHTML = '<span class="lesson-preview-score-label">Score</span>' +
                                    '<span class="lesson-preview-score-value"></span>';
                scoreEl.querySelector('.lesson-preview-score-value').textContent = row.Score + '/' + row.Total_Score;
                scoreEl.style.display = '';
            } catch (err) { /* leave hidden */ }
        }, function () { /* leave hidden */ });
        call.callOtherDomain();
    });
}

// Update the open lesson list in place after the video popup closes, so watched
// time and status reflect the session that just happened. Previously these only
// refreshed when the module preview was reopened, which is why the play time
// appeared to update "only when the screen is switched back".
function refresh_lesson_preview_rows() {
    $(".lesson-preview-card").each(function () {
        var card = this;
        var Skill_Id = card.getAttribute('data-skill-id');
        if (!Skill_Id) return;

        var serverProgress = card.getAttribute('data-server-progress');
        var Video_Time = card.getAttribute('data-video-time') || '00:00';
        var Watch_Video_Time = card.getAttribute('data-watch-video-time') || '00:00';
        var eff = (typeof lms_get_lesson_effective_progress === 'function')
            ? lms_get_lesson_effective_progress(Skill_Id, serverProgress, Watch_Video_Time)
            : Number(serverProgress) || 0;

        // data-video-time is the source of truth for the displayed total — a
        // caller can update the attribute (e.g. once a real fetched duration
        // resolves, see the lms_sum_video_durations call in
        // get_target_skill_by_module_id) and this reflects it in the DOM.
        var totalEl = card.querySelector('.lesson-preview-total');
        if (totalEl) totalEl.textContent = Video_Time;

        var elapsedEl = card.querySelector('.lesson-preview-elapsed');
        if (elapsedEl) elapsedEl.textContent = Watch_Video_Time;

        var statusEl = card.querySelector('.lesson-preview-status');
        if (statusEl) {
            var tmp = document.createElement('div');
            tmp.innerHTML = lms_lesson_status_html(eff);
            statusEl.className = tmp.firstChild.className;
            statusEl.textContent = tmp.firstChild.textContent;
        }

        var checkEl = card.querySelector('.lesson-preview-check');
        if (checkEl && eff >= 100) {
            checkEl.style.background = '#2dbb72';
            checkEl.innerHTML = '<i class="fa fa-check"></i>';
        }
    });
}


// get videowise question listing (level 3)

var log_data = [];
function get_questionlog_by_skill_id(Skill_Id, Video_Link, Module_Id, Progress) {

    // Persist the outgoing lesson before src/skil_id are overwritten — otherwise
    // the module card's wall-clock tracker updates but video_progress_<Skill_Id>
    // never gets written and the lesson list stays at 00:00.
    var prevVideo = $("#vdo_Question")[0];
    if (prevVideo) {
        var prevSkill = prevVideo._lmsPlaySkillId || $(prevVideo).attr("skil_id");
        var prevTime = prevVideo.currentTime;
        if (prevSkill && isFinite(prevTime) && prevTime > 0) {
            set_progress_local(prevSkill, prevTime);
        }
        try { prevVideo.pause(); } catch (e) { }
    }

    // Keep resume state on the shared video element, scoped to the exact card
    // selected from the current module/schedule listing response.
    var selectedCard = findSafetyVideoCard(Skill_Id, Module_Id, glob_Module_Schedule_Id);
    var apiWatchTime = selectedCard ? selectedCard.getAttribute('data-watch-video-time') : '';

    safetyVideoPopupActive = true;
    safetyVideoReturnedFromFullscreen = false;
    // A newly opened lesson is a new opportunity to submit one Back-button log.
    safetyVideoWatchLogInProgress = false;
    safety_video_played = false;
    myApp.popup.open('.popup-level-4');
    $("#dv_Question_List").empty();

    // Submit footer is persistent markup now, so reset it per lesson — hidden
    // until we know the lesson isn't already completed, disabled until every
    // question is answered, and label restored in case the last submit left it
    // reading "Submitting…".
    $("#lesson_submit_footer").hide();
    var lessonBtn = document.getElementById('btn_lesson_submit');
    if (lessonBtn) {
        lessonBtn.classList.add('disabled');
        lessonBtn.textContent = 'Submit';
    }

    var safetyVideo = $("#vdo_Question")[0];
    if (safetyVideo) {
        $(safetyVideo).attr("skil_id", Skill_Id);
        $(safetyVideo).attr("module_id", Module_Id);
        $(safetyVideo).attr("Module_Id", Module_Id);
        safetyVideo._safetyResumeTimeSeconds = videoClockToSeconds(apiWatchTime);
        // Set src last so even a cached video's metadata cannot arrive before
        // the selected lesson's resume position has been attached.
        $(safetyVideo).attr("src", Video_Link);
    }
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

// Convert a finite video time in seconds to the API's MM:SS format.
function secondsToMMSS(seconds) {
    var value = Number(seconds);
    if (!isFinite(value) || value < 0) value = 0;
    value = Math.floor(value);

    var minutes = Math.floor(value / 60);
    var secs = value % 60;
    return (minutes < 10 ? '0' : '') + minutes + ':' +
        (secs < 10 ? '0' : '') + secs;
}

// Parse API video clocks in HH:mm:ss (and tolerate MM:SS for compatibility).
// Invalid/blank values deliberately resolve to the beginning of the video.
function videoClockToSeconds(clockValue) {
    if (clockValue == null || String(clockValue).trim() === '') return 0;
    var parts = String(clockValue).trim().split(':');
    if (parts.length !== 2 && parts.length !== 3) return 0;
    for (var i = 0; i < parts.length; i++) {
        if (!/^\d+$/.test(parts[i])) return 0;
    }

    var hours = parts.length === 3 ? Number(parts[0]) : 0;
    var minutes = Number(parts[parts.length - 2]);
    var seconds = Number(parts[parts.length - 1]);
    if (seconds >= 60 || (parts.length === 3 && minutes >= 60)) return 0;
    return (hours * 3600) + (minutes * 60) + seconds;
}

// Locate the selected lesson without relying on a global watch-time value.
function findSafetyVideoCard(skillId, moduleId, moduleScheduleId) {
    var cards = document.querySelectorAll('.lesson-preview-card');
    for (var i = 0; i < cards.length; i++) {
        if (String(cards[i].getAttribute('data-skill-id')) === String(skillId) &&
            String(cards[i].getAttribute('data-module-id')) === String(moduleId) &&
            String(cards[i].getAttribute('data-module-schedule-id')) === String(moduleScheduleId)) {
            return cards[i];
        }
    }
    return null;
}

// Log the active Safety Module video's resume/progress position before Back
// closes its popup. Existing LMS lesson progress is also currentTime-based, so
// seeking intentionally changes this value; it is not an accumulated-time field.
function logSafetyVideoWatchOnBack(done) {
    var finish = (typeof done === 'function') ? done : function () { };
    if (safetyVideoWatchLogInProgress) return false;

    // Seeking to the API resume position does not count as watching. Submit a
    // new watch log only when playback occurred during this open session.
    if (!safety_video_played) {
        finish();
        return false;
    }

    var video = document.getElementById('vdo_Question');
    if (!video) {
        finish();
        return false;
    }

    safetyVideoWatchLogInProgress = true;

    // Snapshot before the async request so playback cannot change submitted data.
    var duration = Number(video.duration);
    if (!isFinite(duration) || duration <= 0) duration = 0;
    var currentTime = Number(video.currentTime);
    if (!isFinite(currentTime) || currentTime < 0) currentTime = 0;
    if (duration > 0 && currentTime > duration) currentTime = duration;
    try { video.pause(); } catch (pauseError) { }

    var moduleId = $(video).attr('module_id');
    if (moduleId == null || moduleId === '') moduleId = $(video).attr('Module_Id');
    var skillId = $(video).attr('skil_id');
    var payload = [{
        "Module_Id": String(moduleId == null ? '' : moduleId),
        "Module_Schedule_Id": String(glob_Module_Schedule_Id == null ? '' : glob_Module_Schedule_Id),
        "Skill_Id": String(skillId == null ? '' : skillId),
        "Total_Video_Time": secondsToMMSS(duration),
        "Watch_Video_Time": secondsToMMSS(currentTime)
    }];

    var completed = false;
    var backFallbackTimer = null;
    function continueBack() {
        if (completed) return;
        completed = true;
        if (backFallbackTimer) clearTimeout(backFallbackTimer);
        finish();
    }

    // Never hold the existing Back navigation indefinitely on a slow network.
    backFallbackTimer = setTimeout(continueBack, 5000);

    try {
        var request = new Webservicecall_REST(
            global_wcf_url_lms + 'LMS_InsertUpdate_Video_Watch_Log',
            JSON.stringify(payload),
            function (response) {
                try {
                    var result = JSON.parse(response.responseText || '[]');
                    if (!result.length || Number(result[0].status) !== 1) {
                        console.error('Safety video watch log was not accepted by the server.');
                    } else {
                        // Refresh the same in-memory cumulative source consumed
                        // by the Dashboard; do not wait for another API listing.
                        if (typeof LmsBackend !== 'undefined') LmsBackend.ingestSkillRows(payload);
                        if (typeof update_lms_kpi === 'function') update_lms_kpi();
                        // Keep this open listing current after a successful save,
                        // so reopening the same lesson resumes from the new value.
                        var card = findSafetyVideoCard(payload[0].Skill_Id, payload[0].Module_Id, payload[0].Module_Schedule_Id);
                        if (card) {
                            card.setAttribute('data-watch-video-time', payload[0].Watch_Video_Time);
                            var elapsed = card.querySelector('.lesson-preview-elapsed');
                            if (elapsed) elapsed.textContent = payload[0].Watch_Video_Time;
                        }
                    }
                } catch (parseError) {
                    console.error('Unable to parse Safety video watch log response.', parseError);
                }
                continueBack();
            },
            function (error) {
                console.error('Unable to save Safety video watch log.', error);
                continueBack();
            },
            null,
            15000
        );
        request.callOtherDomain();
    } catch (requestError) {
        console.error('Unable to start Safety video watch log request.', requestError);
        continueBack();
    }

    return true;
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
                        str += '<input type="radio" name="skill_que_' + skill_que_id + '" alt="' + weightage + '" id="' + skill_que_id + '_' + j + '" checked="checked" style="font-weight: bold">';
                    }
                    else {
                        str += '<input type="radio" name="skill_que_' + skill_que_id + '" alt="' + weightage + '" id="' + skill_que_id + '_' + j + '">';
                    }

                    str += '<label for="' + skill_que_id + '_' + j + '">' + op_text + '</label>';
                    str += '</div>';
                }

                $("#dv_Question_List").append(str);

            }

            if (Progress == "100") {
                // Completed lesson: review mode, questions are visible immediately
                // and there's nothing to submit, so no footer.
                $("#dv_Question_List").find("input[type='radio']").attr("disabled", "disabled");
                $("#dv_Question_List").show();
                lms_sync_lesson_submit_footer(); // no-op visually (Progress 100 -> stays hidden), kept for consistency
            }
            // NOT shown here for an unanswered lesson. #dv_Question_List is
            // display:none until the video ends (safety_modules.css + the "ended"
            // handler in LMS_Misc.js), and the submit footer is a sibling OUTSIDE
            // that container — revealing it at load time put a Submit button on
            // screen before the video had even played. lms_sync_lesson_submit_footer()
            // ties the footer's visibility to the question list's instead.

            // Radios are single-select natively via the shared per-question `name`
            // above — no manual "uncheck the others" handler needed (that was only
            // required back when these were checkboxes).

            $("#dv_Question_List").off('change.lessonQuiz').on('change.lessonQuiz', 'input[type="radio"]', function () {
                lms_update_lesson_submit_enabled();
            });

            // A resumed lesson can render with prior answers already `checked` in
            // the HTML — that never fires a 'change' event, so without this initial
            // call the button stayed stuck disabled until the user touched any
            // radio. Same bug and same fix as the Assessments quiz (assessments.js).
            if (Progress != "100") lms_update_lesson_submit_enabled();

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
// Full-screen only: while true, the quiz is mandatory — back_button_LMS() and the
// popup's own backdrop-click-to-close are both blocked until the quiz is submitted.
var safety_quiz_mandatory_active = false;

function safety_quiz_review() { return safety_quiz_progress == "100"; }

function safety_quiz_start() {
    if (!safety_quiz_data || !safety_quiz_data.length) {
        // No quiz data to run the full-screen modal with — fall back to
        // whatever's in the inline list (there won't be any .question-card
        // either in practice, but keep the footer's visibility consistent
        // with the list's regardless).
        $("#dv_Question_List").show();
        lms_sync_lesson_submit_footer();
        return;
    }
    safety_quiz_index = 0;
    safety_quiz_answers = {};
    var v = document.getElementById('vdo_Question');
    if (v) {
        try {
            var sid = v._lmsPlaySkillId || v.getAttribute('skil_id');
            set_progress_local(sid, v.currentTime);
            v.pause();
        } catch (e) { }
    }
    safety_quiz_render();
    safety_quiz_mandatory_active = true;
    var popupEl = document.querySelector('.popup-level-4');
    if (popupEl && popupEl.f7Modal) { popupEl.f7Modal.params.closeByBackdropClick = false; }
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
    safety_quiz_mandatory_active = false;
    var popupEl = document.querySelector('.popup-level-4');
    if (popupEl && popupEl.f7Modal) { popupEl.f7Modal.params.closeByBackdropClick = true; }
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

// Companion to assessment_update_submit_enabled() (assessments.js) — same
// disabled-until-complete pattern, kept as a separate function since this
// button is freshly re-injected per lesson (assessments.js's is persistent).
function lms_update_lesson_submit_enabled() {
    var btn = document.getElementById('btn_lesson_submit');
    if (!btn) return;
    var allAnswered = true;
    document.querySelectorAll('#dv_Question_List .question-card').forEach(function (c) {
        if (!c.querySelector('input[type="radio"]:checked')) allAnswered = false;
    });
    btn.classList.toggle('disabled', !allAnswered);
}

// #lesson_submit_footer is a sibling of #dv_Question_List (pinned to the
// bottom of the popup, outside the scrolling content), so it has no CSS
// relationship to that container's own display:none/show() — it needs to be
// told to match. Call this everywhere #dv_Question_List's visibility changes,
// instead of showing/hiding the footer independently at each call site (that
// mismatch is exactly what let it appear before the video had played).
// Never shown in review mode (Progress 100 — nothing left to submit).
function lms_sync_lesson_submit_footer() {
    var visible = $("#dv_Question_List").is(':visible') && safety_quiz_progress != "100";
    $("#lesson_submit_footer").toggle(visible);
}

function submit_question_by_skill_id(flag) {
    // Defensive fallback: the button is disabled until every question is
    // answered, so a real tap can't reach here while incomplete. Only guards
    // the 'submit' flag — 'savenexit' intentionally allows a partial save.
    if (flag == 'submit') {
        var btnGuard = document.getElementById('btn_lesson_submit');
        if (btnGuard && btnGuard.classList.contains('disabled')) return false;
    }

    let Param_obj = [];
    let questionCards = $('#dv_Question_List .question-card');

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
        if (flag == 'submit') {
            if (selectedAns.length == 0) {
                is_valid = 0;
                return false;
            }
        }
        if (flag == 'savenexit') {
            if (selectedAns.length == 0) {
                is_valid = 0;
            }
        }

        if (is_valid == 1) {
            let firstId = options[0]?.id || "";
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

// Optional overrideSkillId / overrideCurrentTime: callers must pass these when
// the async "pause" event might fire after skil_id or src has already been
// swapped (lesson switch, popup close racing get_questionlog_by_skill_id).
set_progress_local = function (overrideSkillId, overrideCurrentTime) {
    var video = $("#vdo_Question")[0];
    if (!video) return;

    var skillId = overrideSkillId || video._lmsPlaySkillId || $(video).attr("skil_id");
    if (!skillId) return;

    var currentTime = (overrideCurrentTime != null && isFinite(overrideCurrentTime))
        ? Number(overrideCurrentTime)
        : (isFinite(video.currentTime) ? video.currentTime : 0);
    if (currentTime < 0) currentTime = 0;

    var duration = isFinite(video.duration) ? video.duration : 0;
    var progress = 0;
    if (duration > 0) {
        progress = (currentTime / duration) * 100;
    }
    progress = Number(progress.toFixed(0)) || 0;

    var existing = [];
    try {
        existing = JSON.parse(localStorage.getItem('video_progress_' + skillId)) || [];
    } catch (e) { existing = []; }
    if (!Array.isArray(existing)) existing = [];

    var found = false;
    existing.forEach(function (item) {
        if (item.Skill_Id == skillId) {
            item.Progress = progress;
            item.currentTime = currentTime;
            found = true;
        }
    });

    if (!found) {
        existing.push({
            Skill_Id: skillId,
            currentTime: currentTime,
            Progress: progress
        });
    }

    localStorage.setItem('video_progress_' + skillId, JSON.stringify(existing));
};

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

    // 'start' fires automatically the instant playback begins (see the "play"
    // handler in LMS_Misc.js) — it's a background telemetry ping, not a
    // user-initiated action, and there is nothing for the user to wait on.
    // Showing the full-screen preloader here mutates the DOM/layout at the
    // exact moment the video starts, which on Android WebView can visibly
    // stall or pause playback that just started — a real cause of "video
    // randomly pauses right after I hit play". 'log_save' and 'submit' are
    // genuine button presses where a blocking preloader is expected, so they
    // keep it.
    var showPreloader = flag !== 'start';
    if (showPreloader) loading();

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
        if (showPreloader) loading_hide();

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
