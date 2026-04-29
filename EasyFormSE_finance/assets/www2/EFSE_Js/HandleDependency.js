
// dep_type = 0 change validation basis on dep element ans (07092020)
function change_validation_by_dep_type_0(paramData) {
    var parsed_paramData = JSON.parse(decodeURIComponent(paramData));

    for (i = 0; i < parsed_paramData.length; i++) {
        var ele_id = parsed_paramData[i].ele_id;
        var ele_type = parsed_paramData[i].ele_type;
        var dep_ans = parsed_paramData[i].dep_ans;
        var dep_class = parsed_paramData[i].dep_class;

        if (ele_type == 2) {
            var ele_answer = $('input[name=rdogroup_' + ele_id + ']:checked').val();
            if (ele_answer == dep_ans) {
                $('.' + dep_class + '').attr('valid', 'true');
            }
            else {
                $('.' + dep_class + '').attr('valid', 'false');
            }
        } else if (ele_type == 3) {
            var ddl = document.getElementById(ele_id);
            var ele_answer = ddl.options[ddl.selectedIndex].value;
            if (ele_answer == dep_ans) {
                $('.' + dep_class + '').attr('valid', 'true');
            }
            else {
                $('.' + dep_class + '').attr('valid', 'false');
            }
        } else if (ele_type == 6) {
            var checkbox = document.getElementsByName('chkgroup_' + ele_id + '');
            for (j = 0; j < checkbox.length; j++) {
                if (checkbox[j].checked) {
                    if (checkbox[j].value == dep_ans) {
                        $('.' + dep_class + '').attr('valid', 'true');
                    }
                    else {
                        $('.' + dep_class + '').attr('valid', 'false');
                    }
                }
            }
        } else if (ele_type == 30) {
            var view_type = parsed_paramData[i].view_type;
            if (view_type == 'dropdownview') {
                var ele_answer = $('#dynddl_' + ele_id + ' :selected').text();
            }
            else if (view_type == 'textview' || view_type == 'numericview') {
                var ele_answer = $('#dynddl_txt_' + ele_id + '').val();
            }

            if (ele_answer == dep_ans) {
                $('.' + dep_class + '').attr('valid', 'true');
            }
            else {
                $('.' + dep_class + '').attr('valid', 'false');
            }
        } else if (ele_type == "task") {
            var ele_answer = parsed_paramData[i].ele_ans;
            if (ele_answer == dep_ans) {
                $('.' + dep_class + '').attr('valid', 'true');
            }
            else {
                $('.' + dep_class + '').attr('valid', 'false');
            }
        }

    }

}


// (dep_Type=1)function triggered on element event like onclick, onchange, onselect
var type17_flag = false;
function show_hide_Element(paramData, target_div, read_type) {
    try {
        // var parsed_paramData = JSON.parse(paramData);
        var parsed_paramData = JSON.parse(decodeURIComponent(paramData));
        // hide all element with number of class assigned to particular
        // (dependent) element

        if (read_type != "readsurvey") {
            for (i = 0; i < parsed_paramData.length; i++) {
                var ele_id = parsed_paramData[i].ele_id;
                var ele_type = parsed_paramData[i].ele_type;
                var dep_ans = parsed_paramData[i].dep_ans;
                var dep_class = parsed_paramData[i].dep_class;
                $("." + dep_class + "").css("display", "none");
                $('div .' + dep_class + ' *').removeClass('st_depen_hide'); // for_calculator

                if (ele_type == "task") {
                    $('.' + dep_class + '').addClass('force_hide');
                }
            }
        }

        // show all element on the basis of dependent answer
        for (i = 0; i < parsed_paramData.length; i++) {
            var ele_id = parsed_paramData[i].ele_id;
            var ele_type = parsed_paramData[i].ele_type;
            var dep_ans = parsed_paramData[i].dep_ans;
            var dep_class = parsed_paramData[i].dep_class;

            var dep_action = parsed_paramData[i].dep_action;
            if (dep_action == "" || dep_action == null || dep_action == undefined) {
                dep_action = "show";
            }

            // check and hide multilevel elements
            var id_array = document.getElementsByClassName(dep_class);
            var level_two_Array = [];
            var type37_subtask_ary = [];

            for (m = 0; m < id_array.length; m++) {
                var id = id_array[m].id;

                // get child id from main que
                var temp_id_array = [];
                var que_n = check_substring_consist(id, "div_que_");
                if (que_n == true) {
                    // class given to main que only
                    var temp_id = $("#" + id + "").children("div[id^='div_rdo_']").attr('id');
                    var temp_id_array = $("#" + id + "").children("div[id^='div_rdo_']");
                    if (temp_id == undefined) {
                        var temp_id = $("#" + id + "").children("div[id^='div_ddl_']").attr('id');
                    } else if (temp_id == undefined) {
                        var temp_id = $("#" + id + "").children("div[id^='div_chk_']").attr('id');
                    }

                    if (temp_id != undefined) {
                        id = temp_id;
                    }
                }

                var rdo_n = check_substring_consist(id, "div_rdo_");  // changed code (startWith() not worked in white big device)
                var ddl_n = check_substring_consist(id, "div_ddl_");
                var chk_n = check_substring_consist(id, "div_chk_");
                var is_subtask_cntrl = check_substring_consist(id, "div_subtask_");

                if (rdo_n == true) {
                    // radio button multilevel dependency
                    if (temp_id_array.length > 1) {
                        // applied for all radio in below radios inside type 0 new form 21032024
                        for (t = 0; t <= temp_id_array.length; t++) {
                            var div_id = $(temp_id_array[t]);
                            var radio_array = div_id.find("input[type='radio']");
                            if (radio_array.length > 0) {
                                var id1 = radio_array[0].id;
                                var eve = document.getElementById(id1).getAttribute("onchange");
                                if (eve == '' || eve == null || eve == undefined) {
                                    //
                                }
                                else {
                                    var start_at = eve.indexOf("(", 0);
                                    var end_at = eve.lastIndexOf(")");
                                    var rdo_inner_eve = eve.substring(start_at + 2, end_at - 1);
                                    level_two_Array.push([2, rdo_inner_eve]);
                                }
                            }
                        }
                    }
                    else {
                        // applied for first radio in below radios inside type 0 new form
                        var div_id = $('#' + id + '');
                        var radio_array = div_id.find("input[type='radio']");
                        if (radio_array.length > 0) {
                            var id1 = radio_array[0].id;
                            var eve = document.getElementById(id1).getAttribute("onchange");
                            if (eve == '' || eve == null || eve == undefined) {
                                //
                            }
                            else {
                                var start_at = eve.indexOf("(", 0);
                                var end_at = eve.lastIndexOf(")");
                                var rdo_inner_eve = eve.substring(start_at + 2, end_at - 1);
                                level_two_Array.push([2, rdo_inner_eve]);
                            }
                        }
                    }
                }
                else if (ddl_n == true) {
                    // dropdown multilevel dependency
                    var select_array = document.getElementById(id).getElementsByTagName('select');
                    if (select_array.length > 0) {
                        var id1 = select_array[0].id;
                        var eve = document.getElementById(id1).getAttribute("onChange");
                        if (eve == '' || eve == null || eve == undefined) { }
                        else {
                            var start_at = eve.indexOf("(", 0);
                            var end_at = eve.lastIndexOf(")");
                            var ddl_inner_eve = eve.substring(start_at + 2, end_at - 1);
                            level_two_Array.push([3, ddl_inner_eve]);
                        }
                    }
                }
                else if (chk_n == true) {
                    // checkbox button multilevel dependency
                    var div_id = $('#' + id + '');
                    var chk_array = div_id.find("input[type='checkbox']");
                    if (chk_array.length > 0) {
                        var id1 = chk_array[0].id;
                        var eve = document.getElementById(id1).getAttribute("onclick");
                        if (eve == '' || eve == null || eve == undefined) { }
                        else {
                            var start_at = eve.indexOf("(", 0);
                            var end_at = eve.lastIndexOf(")");
                            var chk_inner_eve = eve.substring(start_at + 2, end_at - 1);
                            level_two_Array.push([6, chk_inner_eve]);
                        }
                    }
                }
                else if (is_subtask_cntrl == true && dep_action == "show") {
                    var subtask_new_id = id.replace('div_subtask_', '');
                    type37_subtask_ary.push(subtask_new_id);
                }
            }

            // get current element value
            if (ele_type == 2) {
                var ele_answer = $('input[name=rdogroup_' + ele_id + ']:checked').val();

                let group_controls = $('input[name=rdogroup_' + ele_id + ']').attr("group_controls");
                if (group_controls == "" || group_controls == null || group_controls == undefined || group_controls == '""') {
                    // no group elements found
                }
                else {
                    // group elements found so group answer must be same as ele_answer
                    let t_ele = ele_id;
                    let group_controls_Array = JSON.parse(group_controls);
                    for (let g = 0; g < group_controls_Array.length; g++) {
                        let t_group_ele = t_ele.replace(/_(\d+)$/, "_" + group_controls_Array[g] + "");
                        let group_ele_answer = $('input[name=rdogroup_' + t_group_ele + ']:checked').val();
                        if (group_ele_answer != ele_answer) {
                            ele_answer = "";
                        }
                    }

                }

                if (ele_answer == dep_ans) {
                    if (dep_action == "show") {
                        $("." + dep_class + "").css("display", "block");
                        if (que_n == true) {
                            // class given to main que only (required for atc - 02012025)
                            $("." + dep_class + "").children("*").css("display", "block");
                        }
                    }
                    else {
                        $("." + dep_class + "").css("display", "none");
                        if (que_n == true) {
                            // class given to main que only (required for atc - 02012025)
                            $("." + dep_class + "").children("*").css("display", "none");
                        }
                    }
                } else {
                    $('div .' + dep_class + ' *').addClass('st_depen_hide'); // for_calculator
                }

                //// autocall second level dependecy (required for atc - 02012025)
                for (b = 0; b < level_two_Array.length; b++) {
                    var control_type = level_two_Array[b][0];
                    var onclick_inner_eve = level_two_Array[b][1];
                    show_hide_multilevel_dependency_ele(ele_answer, dep_ans, control_type, onclick_inner_eve);
                }
            }
            else if (ele_type == 3) {
                var ddl = document.getElementById(ele_id);
                var ele_answer = ddl.options[ddl.selectedIndex].value;
                if (ele_answer == dep_ans) {
                    if (dep_action == "show") {
                        //$("." + dep_class + "").css("display", "block");

                        // do not show is hide - true elements by dependency - mk - 26032025
                        $("." + dep_class + ":not([is_hide='true'])").css("display", "block");

                        let child_searchable_id = $("." + dep_class + "").find("select").attr("id");
                        if (child_searchable_id == "" || child_searchable_id == null || child_searchable_id == undefined) { }
                        else {
                            if (child_searchable_id.indexOf("ddl_search_type20_") > -1) {
                                // parent is normal dropdown with dependency string
                                $('#' + ele_id + '').trigger("ondrag");
                            }
                        }

                        // commented on 31012022 (vedang - having issue in displaying all child elements - some elements need to hide)
                        //if (que_n == true) {
                        //    // class given to main que only
                        //    $("." + dep_class + "").children("*").css("display", "block");
                        //}

                        //====to display show more for type37 subtask if subtask control is show/hide on dependency [FT-07052025]
                        if (type37_subtask_ary.length > 0) {
                            for (var s = 0; s < type37_subtask_ary.length; s++) {
                                var subtask_new_id = type37_subtask_ary[s];
                                $("#tbl_subtask_" + subtask_new_id + " li").each(function () {
                                    var li_height = $(this).height();
                                    if (li_height < 110) {  //130=max-height of li
                                        $('.readmore-link').hide();
                                    }
                                    else {
                                        $('.readmore-link').show();
                                    }
                                });
                            }
                        }
                    }
                    else {
                        $("." + dep_class + "").css("display", "none");

                        //if (que_n == true) {
                        //    // class given to main que only
                        //    $("." + dep_class + "").children("*").css("display", "none");
                        //}
                    }

                    // handle for dependency + collapsible control 19/05/2020  (for ele_type = 3 dropdown dependency only)
                    if (curr_clps_new_id != 0) {
                        if (form_flag == 0) {
                            if ($("#div_step_Col_" + curr_clps_new_id + "").is(":visible")) {
                                $("#lbl_collapse_" + curr_clps_new_id + "").attr("name", "0");
                                var item = $('#div_step_Col_' + curr_clps_new_id + ' > div > ul > li');
                                myApp.accordionOpen(item);
                                toggle_collapse_div(curr_clps_new_id);
                            }
                        }
                    }

                } else {
                    $('div .' + dep_class + ' *').addClass('st_depen_hide'); // for_calculator
                }

                if (form_flag == 6) {
                    // when all dynamic create task button is hide then display default - mk - 31032025
                    let btn_dis_len = $("#container_btn_div div.right .link:visible").length;
                    if (btn_dis_len == 0 && ele_answer != "Select Value") {
                        $("#container_btn_div div.right.normal_create_task").show();
                    }
                    else {
                        $("#container_btn_div div.right.normal_create_task").hide();
                    }
                }

                ////// autocall second level dependecy (commented on 01022022 having issue in cascading dependency in case of multiple times save n exit)
                //for (b = 0; b < level_two_Array.length; b++) {
                //    var control_type = level_two_Array[b][0];
                //    var onclick_inner_eve = level_two_Array[b][1];
                //    show_hide_multilevel_dependency_ele(ele_answer, dep_ans, control_type, onclick_inner_eve);
                //}
            } else if (ele_type == 6) {
                var checkbox = document.getElementsByName('chkgroup_' + ele_id + '');
                var checkbox_checked = $('input[name=chkgroup_' + ele_id + ']:checked').val();
                var checked_count = 0;
                for (j1 = 0; j1 < checkbox.length; j1++) {
                    if (checkbox[j1].checked) {
                        var ele_answer = checkbox[j1].value;
                        if (ele_answer == dep_ans) {
                            checked_count++;

                            if (dep_action == "show") {
                                $("." + dep_class + "").css("display", "block");
                                //if (que_n == true) {
                                //    // class given to main que only
                                //    $("." + dep_class + "").children("*").css("display", "block");
                                //}
                            }
                            else {
                                $("." + dep_class + "").css("display", "none");
                                //if (que_n == true) {
                                //    // class given to main que only
                                //    $("." + dep_class + "").children("*").css("display", "none");
                                //}
                            }
                        } else {
                            $('div .' + dep_class + ' *').addClass('st_depen_hide'); // for_calculator
                        }

                        // autocall second level dependecy
                        for (b = 0; b < level_two_Array.length; b++) {
                            var control_type = level_two_Array[b][0];
                            var onclick_inner_eve = level_two_Array[b][1];
                            show_hide_multilevel_dependency_ele(ele_answer, dep_ans, control_type, onclick_inner_eve);
                        }
                    }
                }
            }
            else if (ele_type == 30) {
                var view_type = parsed_paramData[i].view_type;
                if (view_type == 'dropdownview') {
                    var ele_answer = $('#dynddl_' + ele_id + ' :selected').text();
                }
                else if (view_type == 'textview' || view_type == 'numericview') {
                    var ele_answer = $('#dynddl_txt_' + ele_id + '').val();
                }

                if (ele_answer == dep_ans) {
                    if (dep_action == "show") {
                        $("." + dep_class + "").css("display", "block");
                        if (que_n == true) {
                            // class given to main que only
                            $("." + dep_class + "").children("*").css("display", "block");
                        }
                    }
                    else {
                        $("." + dep_class + "").css("display", "none");
                        if (que_n == true) {
                            // class given to main que only
                            $("." + dep_class + "").children("*").css("display", "none");
                        }
                    }
                } else {
                    $('div .' + dep_class + ' *').addClass('st_depen_hide'); // for_calculator
                }

                // autocall second level dependecy
                //for (b = 0; b < level_two_Array.length; b++) {
                //    var control_type = level_two_Array[b][0];
                //    var onclick_inner_eve = level_two_Array[b][1];
                //    show_hide_multilevel_dependency_ele(ele_answer, dep_ans, control_type, onclick_inner_eve);
                //}


                // display statis without confirm classes in case of filled type30 dropdown in readsurvey mode 06042021
                var t_new_id = ele_id;
                var confirm_text = $('#dynddl_' + t_new_id + ' :selected').attr('confirm_text');
                if (confirm_text == "" || confirm_text == null || confirm_text == undefined) {
                    var ans = $('#dynddl_' + t_new_id + '').val();
                    if (ans == "1" || ans == "2" || ans == "3" || ans == "4" || ans == "5" || ans == "6" || ans == "7" || ans == "8" || ans == "9" || ans == "10" || ans == "11" || ans == "12") {

                        var checksheet_id = curr_survey_data["check_type"];

                        type30_comoon_hide_show_elements(checksheet_id, t_new_id);

                    }
                }


            }
            else if (ele_type == "task") {
                var ele_answer = parsed_paramData[i].ele_ans;
                if (ele_answer == dep_ans) {
                    if (dep_action == "show") {
                        $("." + dep_class + "").css("display", "block");
                        $('.' + dep_class + '').removeClass('force_hide');

                        if (que_n == true) {
                            // class given to main que only
                            $("." + dep_class + "").children("*").css("display", "block");
                        }
                    }
                    else {
                        $("." + dep_class + "").css("display", "none");
                        if (que_n == true) {
                            // class given to main que only
                            $("." + dep_class + "").children("*").css("display", "none");
                        }
                    }
                } else {
                    $('div .' + dep_class + ' *').addClass('st_depen_hide'); // for_calculator
                }

                // autocall second level dependecy
                //for (b = 0; b < level_two_Array.length; b++) {
                //    var control_type = level_two_Array[b][0];
                //    var onclick_inner_eve = level_two_Array[b][1];
                //    show_hide_multilevel_dependency_ele(ele_answer, dep_ans, control_type, onclick_inner_eve);
                //}
            }
            else if (ele_type == 17) {
                //show/hide submit btn if total is (</>) than any value for ATC battery bank [atc.bbtest1 - 29042021]
                var dep_range = parsed_paramData[i].dep_range;
                var match_class = parsed_paramData[i].match_class;
                if (match_class == "" || match_class == null || match_class == undefined) {
                    match_class = "";
                }
                dep_ans = parseFloat(dep_ans);
                var ele_answer = $("#" + ele_id).val();
                ele_answer = parseFloat(ele_answer);

                //show/hide skip btn if any of one condition is true [atc.bbtest1 - 30042021]
                if (ele_answer <= dep_ans && dep_range == "less than") {
                    type17_flag = true;
                } else if (ele_answer > dep_ans && dep_range == "less than") {
                    type17_flag = false;
                }

                if (!type17_flag) {
                    if (ele_answer >= dep_ans && dep_range == "greater than") {
                        type17_flag = true;
                    } else if (ele_answer < dep_ans && dep_range == "greater than") {
                        type17_flag = false;
                    }
                }


                if (type17_flag) {
                    if (dep_action == "show") {
                        $("." + dep_class + "").css("display", "block");

                        if (que_n == true) {
                            // class given to main que only
                            $("." + dep_class + "").children("*").css("display", "block");
                        }

                        if (match_class != "") {                                        //if skip btn is show then hide next cycle btn and vice versa [atc.bb - 04052021]
                            $("." + match_class + "").css("display", "none");
                            $("." + match_class + "").children("*").css("display", "none");
                        }
                    }
                    else {
                        $("." + dep_class + "").css("display", "none");

                        if (que_n == true) {
                            // class given to main que only
                            $("." + dep_class + "").children("*").css("display", "none");
                        }

                        if (match_class != "") {                                        //if skip btn is show then hide next cycle btn and vice versa [atc.bb - 04052021]
                            $("." + match_class + "").css("display", "block");
                            $("." + match_class + "").children("*").css("display", "block");
                        }
                    }
                }
                else {
                    $('div .' + dep_class + ' *').addClass('st_depen_hide'); // for_calculator

                    if (match_class != "") {                                        //if skip btn is show then hide next cycle btn and vice versa [atc.bb - 04052021]
                        $("." + match_class + "").css("display", "block");
                        $("." + match_class + "").children("*").css("display", "block");
                    }
                }

                if (form_flag == 12) {
                    // group task calculator dependency (action by considering all forms calc answer) - 02072021
                    GT_17_dep_array[target_div] = type17_flag;

                    var group_task_array = JSON.parse(localStorage.getItem("group_task_array"));

                    var t_flag = false;
                    for (gt = 0; gt < group_task_array.length; gt++) {
                        var gt_target_div = "cd_" + group_task_array[gt] + "";
                        t_flag = GT_17_dep_array[gt_target_div];

                        if (t_flag == true) {
                            break;
                        }
                    }

                    if (t_flag) {
                        if (dep_action == "show") {
                            $("." + dep_class + "").css("display", "block");

                            if (que_n == true) {
                                // class given to main que only
                                $("." + dep_class + "").children("*").css("display", "block");
                            }

                            if (match_class != "") {
                                //if skip btn is show then hide next cycle btn and vice versa [atc.bb - 04052021]
                                $("." + match_class + "").css("display", "none");
                                $("." + match_class + "").children("*").css("display", "none");
                            }
                        }
                        else {
                            $("." + dep_class + "").css("display", "none");

                            if (que_n == true) {
                                // class given to main que only
                                $("." + dep_class + "").children("*").css("display", "none");
                            }

                            if (match_class != "") {                                        //if skip btn is show then hide next cycle btn and vice versa [atc.bb - 04052021]
                                $("." + match_class + "").css("display", "block");
                                $("." + match_class + "").children("*").css("display", "block");
                            }
                        }
                    }
                    else {
                        $('div .' + dep_class + ' *').addClass('st_depen_hide'); // for_calculator

                        if (match_class != "") {                                        //if skip btn is show then hide next cycle btn and vice versa [atc.bb - 04052021]
                            $("." + match_class + "").css("display", "block");
                            $("." + match_class + "").children("*").css("display", "block");
                        }
                    }


                    // group task form flag = 12 end


                }


            }
        }

    } catch (e) {
        alert1(e + '_show_hide_Element()');
        loading_hide();
    }
}

// check and show/hide multilevel dependency
function show_hide_multilevel_dependency_ele(ele_answer, dep_ans, control_type, onclick_inner_eve) {
    try {
        if (ele_answer == dep_ans) {
            if (control_type == 2) {
                var parsed_paramData = JSON.parse(decodeURIComponent(onclick_inner_eve));
                for (j = 0; j < parsed_paramData.length; j++) {
                    var ele_id = parsed_paramData[j].ele_id;
                    var dep_ans = parsed_paramData[j].dep_ans;
                    var dep_class = parsed_paramData[j].dep_class;

                    var ele_answer = $('input[name=rdogroup_' + ele_id + ']:checked').val();
                    if (ele_answer == dep_ans) {
                        $("." + dep_class + "").css("display", "block");
                    } else {
                        $('div .' + dep_class + ' *').addClass('st_depen_hide'); // for_calculator
                    }
                }
            }

            else if (control_type == 3) {
                var parsed_paramData = JSON.parse(decodeURIComponent(onclick_inner_eve));
                for (j = 0; j < parsed_paramData.length; j++) {
                    var ele_id = parsed_paramData[j].ele_id;
                    var dep_ans = parsed_paramData[j].dep_ans;
                    var dep_class = parsed_paramData[j].dep_class;

                    var ddl = document.getElementById(ele_id);
                    var ele_answer = ddl.options[ddl.selectedIndex].value;
                    if (ele_answer == dep_ans) {
                        $("." + dep_class + "").css("display", "block");
                    } else {
                        $('div .' + dep_class + ' *').addClass(
                            'st_depen_hide'); // for_calculator
                    }
                }
            }

            else if (control_type == 6) {
                var parsed_paramData = JSON.parse(decodeURIComponent(onclick_inner_eve));
                for (j = 0; j < parsed_paramData.length; j++) {
                    var ele_id = parsed_paramData[j].ele_id;
                    var dep_ans = parsed_paramData[j].dep_ans;
                    var dep_class = parsed_paramData[j].dep_class;

                    var checkbox = document.getElementsByName('chkgroup_' + ele_id + '');
                    for (j = 0; j < checkbox.length; j++) {
                        if (checkbox[j].checked) {
                            if (checkbox[j].value == dep_ans) {
                                $("." + dep_class + "").css("display", "block");
                            } else {
                                $('div .' + dep_class + ' *').addClass('st_depen_hide'); // for_calculator
                            }
                        }
                    }
                }
            }
        }
        else {
            var parsed_paramData = JSON.parse(decodeURIComponent(onclick_inner_eve));
            for (j = 0; j < parsed_paramData.length; j++) {
                var dep_class = parsed_paramData[j].dep_class;
                $("." + dep_class + "").css("display", "none");
                $('div .' + dep_class + ' *').removeClass('st_depen_hide'); // for_calculator
            }
        }
    } catch (e) {
        // alert1(e + '_show_hide_multilevel_dependency_ele()');
    }
}

// (dep_Type=2)function triggered on element event like onclick, onchange,
// onselect
function set_global_show_hide_class(paramData) {
    try {
        // put dep_ans and dep_class in global checksheet_dependency array
        // var parsed_paramData = JSON.parse(paramData);
        var parsed_paramData = JSON.parse(decodeURIComponent(paramData));
        for (i = 0; i < parsed_paramData.length; i++) {
            var ele_id = parsed_paramData[i].ele_id;
            var ele_type = parsed_paramData[i].ele_type;
            var dep_ans = parsed_paramData[i].dep_ans;
            var dep_class = parsed_paramData[i].dep_class;
            var glob_class = parsed_paramData[i].glob_class;

            // get current element value
            if (ele_type == 2) {
                var ele_answer = $('input[name=rdogroup_' + ele_id + ']:checked').val();
            } else if (ele_type == 3) {
                var ddl = document.getElementById(ele_id);
                var ele_answer = ddl.options[ddl.selectedIndex].value;
            } else if (ele_type == 6) {
                var checkbox = document.getElementsByName('chkgroup_' + ele_id + '');
                for (j = 0; j < checkbox.length; j++) {
                    if (checkbox[j].checked) {
                        if (checkbox[j].value == dep_ans) {
                            var ele_answer = checkbox[j].value;
                            break;
                        } else {
                            var ele_answer = checkbox[j].value;
                        }
                    }
                }
            } else if (ele_type == 20 || ele_type == "task") {
                var ele_answer = parsed_paramData[i].ele_ans;
            }
            else if (ele_type == 30) {
                var view_type = parsed_paramData[i].view_type;
                if (view_type == 'dropdownview') {
                    var ele_answer = $('#dynddl_' + ele_id + ' :selected').text();
                }
                else if (view_type == 'textview' || view_type == 'numericview') {
                    var ele_answer = $('#dynddl_txt_' + ele_id + '').val();
                }
            }

            var checksheet_dependency = JSON.parse(storage.getItem('checksheet_dependency'));
            var flag = 0;
            if (checksheet_dependency == null || checksheet_dependency == undefined || checksheet_dependency == "") {
                // alert1("no global checksheet class is defined");
                var checksheet_dependency = [];
            } else {
                for (j = 0; j < checksheet_dependency.length; j++) {
                    var old_glob_class = checksheet_dependency[j].glob_class;
                    if (glob_class == old_glob_class) {
                        checksheet_dependency[j].ele_answer = ele_answer;
                        flag++;
                    }
                }
            }

            if (flag == 0) {
                // alert1("push new class");
                for (k = 0; k < parsed_paramData.length; k++) {
                    var ele_id = parsed_paramData[k].ele_id;
                    var ele_type = parsed_paramData[k].ele_type;
                    var dep_ans = parsed_paramData[k].dep_ans;
                    var dep_class = parsed_paramData[k].dep_class;
                    var glob_class = parsed_paramData[k].glob_class;

                    var dep_action = parsed_paramData[k].dep_action;
                    if (dep_action == "" || dep_action == null || dep_action == undefined) {
                        dep_action = "show";
                    }

                    checksheet_dependency.push({
                        ele_id: ele_id,
                        ele_type: ele_type,
                        ele_answer: ele_answer,
                        dep_ans: dep_ans,
                        dep_action: dep_action,
                        dep_class: dep_class,
                        glob_class: glob_class
                    });
                }
            }

            storage.setItem('checksheet_dependency', JSON.stringify(checksheet_dependency));
        }
        show_hide_element_by_global_class();
        // alert1(JSON.stringify(checksheet_dependency));
    } catch (e) {
        alert1(e + '_set_global_show_hide_class()');
        loading_hide();
    }
}

function show_hide_element_by_global_class() {
    try {
        var checksheet_dependency = JSON.parse(storage.getItem('checksheet_dependency'));
        if (checksheet_dependency == null || checksheet_dependency == undefined || checksheet_dependency == "") {
            // alert1("no global checksheet class is defined");
        } else {
            // hide all element with number of class assigned to particular (dependent) element
            for (i = 0; i < checksheet_dependency.length; i++) {
                var dep_class = checksheet_dependency[i].dep_class;
                $("." + dep_class + "").css("display", "none");
            }

            // show all element on the basis of dependent answer
            for (j = 0; j < checksheet_dependency.length; j++) {
                var dep_class = checksheet_dependency[j].dep_class;
                var ele_answer = checksheet_dependency[j].ele_answer;
                var dep_ans = checksheet_dependency[j].dep_ans;

                if (ele_answer == dep_ans) {
                    var dep_action = checksheet_dependency[j].dep_action;
                    if (dep_action == "" || dep_action == null || dep_action == undefined) {
                        dep_action = "show";
                    }

                    if (dep_action == "show") {
                        $("." + dep_class + "").css("display", "block");
                    }
                    else {
                        $("." + dep_class + "").css("display", "none");
                    }

                }
            }
        }
    } catch (e) {
        alert1(e + '_show_hide_element_by_global_class()');
        loading_hide();
    }
}

function check_substring_consist(str, substr) {
    var n = str.indexOf(substr);
    if (n == -1) {
        return false;
    } else {
        return true;
    }
}

/// filling cascading dropdown through type=3 normal dropdown
function set_cascading_dependency(paramData) {
    try {
        var parsed_paramData = JSON.parse(decodeURIComponent(paramData));
        var ccd_ans = parsed_paramData[0].ccd_ans;
        var ele_id = parsed_paramData[0].ele_id;
        var dep_class = parsed_paramData[0].dep_class;
        var ccd_value = parsed_paramData[0].ccd_value;

        if (dep_class == '' || dep_class == null || dep_class == undefined) { }
        else {
            var id_array = document.getElementsByClassName(dep_class);
            var id = id_array[0].id;
            var que_n = check_substring_consist(id, "div_que_");
            if (que_n == true) {
                // class given to main que only
                var temp_id = $("#" + id + "").children("div[id^='div_ddl_']").attr('id');
                if (temp_id != undefined) {
                    id = temp_id;
                }
            }

            // class given to dropdown directly
            var select_array = document.getElementById(id).getElementsByTagName('select');
            if (select_array.length > 0) {
                var id1 = select_array[0].id;
                var selected_value = $("#" + id1 + " :selected").text();
                $("#" + id1 + " option:gt(0)").remove();
                var ddl = document.getElementById(ele_id);
                var ele_answer = ddl.options[ddl.selectedIndex].value;
                var ccd_value_Array = ccd_value[0][ele_answer];

                if (ccd_value_Array == '' || ccd_value_Array == null || ccd_value_Array == undefined) {
                    // no dependent values assigned for child dropdown

                    $("#" + id1 + "").trigger('onchange');
                    var parent_id = $("#" + id1 + "").parents(".cntrl_main_div").attr("id");
                    $("#" + parent_id + "").hide();

                }
                else {
                    for (c = 0; c < ccd_value_Array.length; c++) {
                        var selected_str = '';
                        //if (ccd_value_Array[c] == ccd_ans) {
                        if (ccd_value_Array[c] == selected_value || ccd_value_Array.length == 1) {                         //compare selected ans coz issue when normal n cascading dependency both applied in readsurvey (green1.tech) [05082020]
                            selected_str = "selected='checked'";
                        }
                        var option = '<option value="' + ccd_value_Array[c] + '" ' + selected_str + '>' + ccd_value_Array[c] + '</option>';
                        $("#" + id1 + "").append(option);
                    }
                    $("#" + id1 + "").attr('name', encodeURIComponent(JSON.stringify(ccd_value_Array)));

                    if (ccd_value_Array.length > 0) {
                        var parent_id = $("#" + id1 + "").parents(".cntrl_main_div").attr("id");
                        $("#" + parent_id + "").show();

                        if (ccd_value_Array.length == 1) {
                            $("#" + id1 + "").trigger('onchange');
                        }
                    }
                }
            }
        }
    }
    catch (e) {
        alert1(e + '_set_cascading_dependency()');
    }
}

// (dep_Type=3) fill child dropdown on parent dropdown change (only for type=3 dropdown)
function set_cascading_dependency_readsurvey(dependency_Array_CCD) {
    try {
        if (dependency_Array_CCD.length > 0) {
            var parsed_paramData = dependency_Array_CCD[0];
            var ccd_ans = parsed_paramData[0].ccd_ans;
            var ele_id = parsed_paramData[0].ele_id;
            var dep_class = parsed_paramData[0].dep_class;
            var ccd_value = parsed_paramData[0].ccd_value;

            if (dep_class == '' || dep_class == null || dep_class == undefined) { }
            else {

                var id_array = document.getElementsByClassName(dep_class);
                var id = id_array[0].id;
                var que_n = check_substring_consist(id, "div_que_");
                if (que_n == true) {
                    // class given to main que only
                    var temp_id = $("#" + id + "").children("div[id^='div_ddl_']").attr('id');
                    if (temp_id != undefined) {
                        id = temp_id;
                    }
                }

                // class given to dropdown directly
                var select_array = document.getElementById(id).getElementsByTagName('select');
                if (select_array.length > 0) {
                    var id1 = select_array[0].id;
                    var selected_value = $("#" + id1 + " :selected").text();
                    $("#" + id1 + " option:gt(0)").remove();
                    var ddl = document.getElementById(ele_id);
                    var ele_answer = ddl.options[ddl.selectedIndex].value;
                    var ccd_value_Array = ccd_value[0][ele_answer];

                    if (ccd_value_Array == '' || ccd_value_Array == null || ccd_value_Array == undefined) {
                        // no dependent values assigned for child dropdown
                    }
                    else {
                        for (c = 0; c < ccd_value_Array.length; c++) {
                            var selected_str = '';
                            if (ccd_value_Array[c] == selected_value) {
                                selected_str = "selected='checked'";
                            }
                            var option = '<option ' + selected_str + ' value=' + ccd_value_Array[c] + '>' + ccd_value_Array[c] + '</option>';
                            $("#" + id1 + "").append(option);
                        }
                        $("#" + id1 + "").attr('name', encodeURIComponent(JSON.stringify(ccd_value_Array)));
                    }
                }

            }

            dependency_Array_CCD.shift();
            if (dependency_Array_CCD.length > 0) {
                set_cascading_dependency_readsurvey(dependency_Array_CCD);
            }
        }
    }
    catch (e) {
        alert1(e + '_set_cascading_dependency_readsurvey()');
    }
}

// (dep_Type=4) hide dep class element if one of the element contains match_class is not matched dep_ans
function show_hide_element_by_match_class_element(paramData) {
    try {
        var company_id = JSON.parse(storage.getItem('company_id'));
        if (company_id == '157') {
            var parsed_paramData = JSON.parse(decodeURIComponent(paramData));
            var ele_id = parsed_paramData[0].ele_id;
            var ele_type = parsed_paramData[0].ele_type;
            var dep_ans = parsed_paramData[0].dep_ans;
            var dep_class = parsed_paramData[0].dep_class;
            var match_class = parsed_paramData[0].match_class;
            $("." + dep_class + "").css("display", "none");
            $('div .' + dep_class + ' *').removeClass('st_depen_hide'); // for_calculator

            var obj_array = $('.' + match_class + '');
            var show_dep_element = true;
            for (m = 0; m < obj_array.length; m++) {
                var div_id = obj_array[m].id;
                if (ele_type == 2) {
                    //                var ele_id = $('#' + div_id + ' > input[type="radio"]').attr('name');
                    //                var ele_answer = $('input[name=' + ele_id + ']:checked').val();

                    var t_div_id = $('#' + div_id + '');
                    var ele_answer = t_div_id.find('input[type="radio"]:checked').val();
                    if (ele_answer != dep_ans) {
                        show_dep_element = false;
                    }
                } else if (ele_type == 3) {
                    var ele_id = $('#' + div_id + ' > select').attr('id');
                    var ddl = document.getElementById(ele_id);
                    var ele_answer = ddl.options[ddl.selectedIndex].value;
                    if (ele_answer != dep_ans) {
                        show_dep_element = false;
                    }
                } else if (ele_type == 6) {
                    var checkbox = document.getElementsByName('chkgroup_' + ele_id + '');
                    for (j = 0; j < checkbox.length; j++) {
                        if (checkbox[j].checked) {
                            if (checkbox[j].value != dep_ans) {
                                show_dep_element = false;
                            }
                        }
                    }
                }
                if (show_dep_element == false) {
                    break;
                }
            }

            if (show_dep_element == true) {
                $('div .' + dep_class + ' *').addClass('st_depen_hide'); // for_calculator
            } else {
                $("." + dep_class + "").css("display", "block");
            }
        }
        else {
            var parsed_paramData = JSON.parse(decodeURIComponent(paramData));
            for (i = 0; i < parsed_paramData.length; i++) {
                var ele_id = parsed_paramData[i].ele_id;
                var ele_type = parsed_paramData[i].ele_type;
                var dep_ans = parsed_paramData[i].dep_ans;
                var dep_class = parsed_paramData[i].dep_class;
                var match_class = parsed_paramData[i].match_class;
                var req_match_count = parsed_paramData[i].match_count;
                if (req_match_count == '' || req_match_count == null || req_match_count == undefined) {
                    req_match_count = 0;
                }

                $("." + dep_class + "").css("display", "none");
                $('div .' + dep_class + ' *').removeClass('st_depen_hide'); // for_calculator

                var obj_array = $('.' + match_class + '');
                var matched_cnt = 0;
                for (m = 0; m < obj_array.length; m++) {
                    var div_id = obj_array[m].id;
                    if (ele_type == 2) {
                        //                var ele_id = $('#' + div_id + ' > input[type="radio"]').attr('name');
                        //                var ele_answer = $('input[name=' + ele_id + ']:checked').val();

                        var t_div_id = $('#' + div_id + '');
                        var ele_answer = t_div_id.find('input[type="radio"]:checked').val();
                        if (ele_answer == dep_ans) {
                            matched_cnt++
                        }
                    } else if (ele_type == 3) {
                        var ele_id = $('#' + div_id + ' select').attr('id');
                        var ddl = document.getElementById(ele_id);
                        var ele_answer = ddl.options[ddl.selectedIndex].value;
                        if (ele_answer == dep_ans) {
                            matched_cnt++;
                        }
                    }
                    //else if (ele_type == 6) {
                    //    var checkbox = document.getElementsByName('chkgroup_' + ele_id + '');
                    //    for (j = 0; j < checkbox.length; j++) {
                    //        if (checkbox[j].checked) {
                    //            if (checkbox[j].value == dep_ans) {
                    //                matched_cnt++;
                    //            }
                    //        }
                    //    }
                    //}

                    if (matched_cnt > 0 && req_match_count == 1) {
                        break;
                    }
                }

                //if (show_dep_element == true) {
                //     $('div .' + dep_class + ' *').addClass('st_depen_hide'); // for_calculator
                // } else {
                //     $("." + dep_class + "").css("display", "block");
                // 

                // logic changed on 18/06/2018 for bomabay gas (if all match class element's value match with dep_ans then show dep_class element)
                // may affected on ciat/vodafone logic
                // will not working in ATC

                if (req_match_count == 'All') {
                    if (matched_cnt == obj_array.length) {
                        $("." + dep_class + "").css("display", "block");
                    }
                }
                else {
                    req_match_count = parseInt(req_match_count);
                    if (matched_cnt >= req_match_count) {
                        $("." + dep_class + "").css("display", "block");
                    }
                }
            }
        }
    }
    catch (e) {
        alert1(e + '_show_hide_element_by_match_class_element()');
    }
}


// (dep_Type=5) copy value from copy class to paste class element (same as above functionality)
function copy_paste_value_by_class(paramData) {
    var parsed_paramData = JSON.parse(decodeURIComponent(paramData));
    for (i = 0; i < parsed_paramData.length; i++) {
        var checked = 0;
        var ele_id = parsed_paramData[i].ele_id;
        var ele_type = parsed_paramData[i].ele_type;

        if (ele_type == 3) {
            var ddl = document.getElementById(ele_id);
            var ele_answer = ddl.options[ddl.selectedIndex].value;
            if (ele_answer == '' || ele_answer == null || ele_answer == undefined || ele_answer == '--- Select Values ---') { }
            else {
                checked++;
            }

        } else if (ele_type == 6) {
            var checkbox = document.getElementsByName('chkgroup_' + ele_id + '');
            for (j = 0; j < checkbox.length; j++) {
                if (checkbox[j].checked) {
                    checked++;
                }
            }
        }

        var copy_array = parsed_paramData[i].copy_array;
        if (copy_array == '' || copy_array == null || copy_array == undefined) {
            copy_array = [];
        }
        for (c = 0; c < copy_array.length; c++) {
            var copy_class = copy_array[c].copy_class;
            var paste_class = copy_array[c].paste_class;
            var where_box_id = $("." + copy_class + "").find("select").attr("id");
            if (where_box_id == '' || where_box_id == null || where_box_id == undefined) {
                // textbox
                var copy_val = $("." + copy_class + "").find("input").val();

                if (checked > 0) {
                    $("." + paste_class + "").find("input").val(copy_val);
                }
                else {
                    $("." + paste_class + "").find("input").val('');
                }
            }
            else {
                // dropdown
                var copy_val = $("#" + where_box_id + " :selected").val();

                if (checked > 0) {
                    $("." + paste_class + "").find("select").val(copy_val);
                }
                else {
                    $("." + paste_class + "").find("select").prop("selectedIndex", 0);
                }
            }
        }

    }
}


//// type22 dependency show greater_class elements if ref_class grand total if greater than current element grand total
//function show_hide_element_by_type22_dependency(dependency_data) {
//    try {
//        var ref_class = dependency_data[0].ref_class;
//        var greater_class = dependency_data[0].greater_class;
//        var less_class = dependency_data[0].less_class;

//        if (show_dep_element == true) {
//            $('div .' + dep_class + ' *').addClass('st_depen_hide'); // for_calculator
//        } else {
//            $("." + dep_class + "").css("display", "block");
//        }
//    }
//    catch (e) {
//        alert1(e + '_show_hide_element_by_match_class_element()');
//    }
//}
