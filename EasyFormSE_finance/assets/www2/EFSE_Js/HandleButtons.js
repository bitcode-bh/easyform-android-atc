// All buttons handling code

// Back Button (step--)
function back_on_click() {
    try {
        loading();

        step_Array.pop();
        curr_btn_mode = "back";
        var step = step_Array[step_Array.length - 1];
        check_survey_entry_back_read(step);
    } catch (e) {
        alert1(e + '_back_on_click()');
        loading_hide();
    }
}

// Goto or Back Button - perform as goto or back action (dependent on previous
// step exist or not)
function goto_or_back_on_click(go_to_chk_no) {
    if (step_Array.length == 1) {
        goto_on_click(go_to_chk_no);
    } else {
        back_on_click();
    }
}

// Save & Next Button and Reject Button (Go to next step)
function goto_on_click(go_to_chk_no) {
    try {
        loading();

        curr_btn_mode = "goto";
        // validate_and_submit_surveydata(go_to_chk_no);
        // alert1(JSON.stringify(jsonobj_old));
        validate_and_submit_surveydata(go_to_chk_no, 0, jsonObj_old);
    } catch (e) {
        alert1(e + '_goto_on_click()');
        loading_hide();
    }
}

// Save & GoTo fixed step and Change step button color in fixed step button list
function gotonchangecolor_on_click(go_to_chk_no, updatebtnindex, updatestep) {
    try {
        loading();

        curr_survey_data["updatebtnindex"] = updatebtnindex;
        curr_survey_data["updatestep"] = updatestep;
        curr_btn_mode = "gotonchangecolor";
        // validate_and_submit_surveydata(go_to_chk_no);
        validate_and_submit_surveydata(go_to_chk_no, 0, jsonObj_old);
    } catch (e) {
        alert1(e + '_gotonchangecolor_on_click()');
        loading_hide();
    }
}

// GoTo without save (Change Status) Button - Go to fixed step without saving
// current step
function gotowithoutsave_on_click(go_to_chk_no) {
    try {
        loading();

        curr_btn_mode = "gotowithoutsave";
        // validate_and_submit_surveydata(go_to_chk_no);
        validate_and_submit_surveydata(go_to_chk_no, 0, jsonObj_old);
    } catch (e) {
        alert1(e + '_gotowithoutsave_on_click()');
        loading_hide();
    }
}

// Save and Exit Button - Save current step and goto site list (remember next step)
function savenexit_on_click(go_to_chk_no) {
    try {
        loading();

        curr_btn_mode = "savenexit";
        // validate_and_submit_surveydata(go_to_chk_no);
        validate_and_submit_surveydata(go_to_chk_no, 0, jsonObj_old);
    } catch (e) {
        alert1(e + '_savenexit_on_click()');
        loading_hide();
    }
}

// Save Only Button - save current step only no forward backward or exit
function saveonly_on_click(go_to_chk_no) {
    try {
        loading();

        curr_btn_mode = "saveonly";
        validate_and_submit_surveydata(go_to_chk_no, 0, jsonObj_old);
    } catch (e) {
        alert1(e + '_savenexit_on_click()');
        loading_hide();
    }
}

// Submit 2 - check all step status and color then submit
function checknsubmit_on_click(go_to_chk_no, updatestep) {
    try {
        if (F7_device == 'ios') {
            var user_choice = true;
        }
        else {
            var user_choice = confirm("Are you sure, you want to submit this flow?");
        }
        if (user_choice == true) {
            loading();

            curr_survey_data["updatestep"] = updatestep;
            curr_btn_mode = "checknsubmit";
            check_all_step_status();
        }
    } catch (e) {
        alert1(e + '_checknsubmit_on_click()');
        loading_hide();
    }
}

// Submit 3 - Update Task Status and Submit

function updatetasknsubmit_on_click(go_to_chk_no, t_shortest_path, t_status, t_dependency, t_trip, stillviolation_event, btn_check_type) {
    try {

        let sub_task_elem = $("button[id^='btn_type_37_add_invoice_']").length;
        if (sub_task_elem > 0) {

            curr_btn_mode = "check_validation_only";

            if (last_submit_button_Array.length > 0) {
                //if press 2nd time submit btn (in case of validation error[status 11 from api] then get mobile checksheet json from ary [FT-01072025]
                jsonObj_old = last_submit_button_Array[0].jsonObj_old;
            }

            validate_and_submit_surveydata(go_to_chk_no, 0, jsonObj_old);
            if (Validation_True == 1) {
                // do not create task if main checksheet is not fully submittable - mk - 26052025
                return false;
            }

            let type37_controls = $("button[id^='btn_type_37_add_invoice_']");
            let valid_img_vis = $(type37_controls[0]).parent().find("img[src='images/mendatory.gif']").css("visibility");
            if (valid_img_vis == "hidden") {
                // do not validate non mandatory type37 control - mk - 23052025
                sub_task_elem = 0;
            }
        }

        if (sub_task_elem > 0) {
            // type37 Generate All Invoice button is exist
            last_submit_button_Array = [];
            last_submit_button_Array.push({
                go_to_chk_no: go_to_chk_no,
                t_status: t_status,
                t_dependency: t_dependency,
                btn_check_type: btn_check_type,
                jsonObj_old: jsonObj_old
            });
            $("button[id^='btn_type_37_add_invoice_']").trigger("click");
        }
        else {
            loading();

            curr_survey_data["updatestatus"] = go_to_chk_no;
            curr_btn_mode = "updatetasknsubmit";
            //curr_survey_data["shortest_path"] = t_shortest_path;
            curr_survey_data["shortest_path"] = '';
            curr_survey_data["trip"] = t_trip;
            curr_survey_data["stillviolation_event"] = stillviolation_event;
            if (t_dependency == 'button') {
                storage.setItem('end_status', JSON.stringify(t_status));
            }

            localStorage.setItem('shortest_path', t_shortest_path);

            validate_and_submit_surveydata(go_to_chk_no, 0, jsonObj_old);
        }
    } catch (e) {
        alert1(e + '_updatetasknsubmit_on_click()');
        loading_hide();
    }
}

// Submit 3.1 - Update Task Status and Redirect
function updatetasknredirect_on_click(go_to_chk_no, t_shortest_path, t_status, t_dependency, t_trip, stillviolation_event) {
    try {
        loading();

        curr_survey_data["updatestatus"] = go_to_chk_no;
        curr_btn_mode = "updatetasknredirect";
        curr_survey_data["shortest_path"] = '';
        curr_survey_data["trip"] = t_trip;
        curr_survey_data["stillviolation_event"] = stillviolation_event;
        if (t_dependency == 'button') {
            storage.setItem('end_status', JSON.stringify(t_status));
        }

        localStorage.setItem('shortest_path', t_shortest_path);

        validate_and_submit_surveydata(go_to_chk_no, 0, jsonObj_old);
    } catch (e) {
        alert1(e + '_updatetasknredirect_on_click()');
        loading_hide();
    }
}

// Submit 3.2 - Update Task Status and Auto Open Task Form
function updatetasknautoopentaskform_on_click(go_to_chk_no, t_shortest_path, t_status, t_dependency, t_trip, stillviolation_event) {
    try {
        loading();

        curr_survey_data["updatestatus"] = go_to_chk_no;
        curr_btn_mode = "updatetasknautoopentaskform";
        curr_survey_data["shortest_path"] = '';
        curr_survey_data["trip"] = t_trip;
        curr_survey_data["stillviolation_event"] = stillviolation_event;
        if (t_dependency == 'button') {
            storage.setItem('end_status', JSON.stringify(t_status));
        }

        localStorage.setItem('shortest_path', t_shortest_path);

        validate_and_submit_surveydata(go_to_chk_no, 0, jsonObj_old);
    } catch (e) {
        alert1(e + '_updatetasknredirect_on_click()');
        loading_hide();
    }
}

// Submit 4 - Update Task status by Reject Status (kill task)
function reject_on_click(go_to_chk_no) {
    try {
        //if (F7_device == 'ios') {
        //    var user_choice = true;
        //}
        //else {
        //    var user_choice = confirm("Are you sure, you want to reject this task?");
        //}
        //if (user_choice == true) {
        loading();
        curr_btn_mode = "reject";
        validate_and_submit_surveydata(go_to_chk_no, 0, jsonObj_old);
        //}
    } catch (e) {
        alert1(e + '_updatetasknsubmit_on_click()');
        loading_hide();
    }
}

// create task dynamic buttons in task form
function create_task_on_click(t_status, t_redirect, stillviolation_event) {
    try {
        curr_survey_data["createtask"] = t_status;
        curr_survey_data["redirect"] = t_redirect;
        curr_survey_data["stillviolation_event"] = stillviolation_event;
        curr_btn_mode = "button_create_task";
        validate_and_submit_surveydata(1, 6, jsonObj_old);
    } catch (e) {
        alert(e + '_create_task_on_click()');
        loading_hide();
    }
}

function auto_savelog() {
    curr_btn_mode = "autosave";  // Autosave action is actually not exist taken for temparory basis
    validate_and_submit_surveydata('', 0, jsonObj_old);
}
