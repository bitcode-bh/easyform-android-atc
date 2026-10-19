


var priority_found = 0;
var sub_acq_tid_Array = [];
function change_option_priority(ddl_id, selected_site, selected_priority_tid, tid_Array) {
    try {
        priority_found = 0;
        sub_acq_tid_Array = JSON.parse("[" + tid_Array + "]");

        priority_ddl_id = ddl_id;
        priority_tid = selected_priority_tid;

        var new_priority = $(ddl_id).val();
        if (new_priority == 'Select') {
            // always allow user to reset priority dropdown
            select_task_to_change_priority();
        }
        else {
            check_in_all_tasks(sub_acq_tid_Array);
        }
    } catch (e) {
        alert1(e + '_change_option_priority()');
    }
}

function check_in_all_tasks(t_sub_acq_tid_Array) {
    //if (t_sub_acq_tid_Array.length > 0) {
    //    check_in_task(t_sub_acq_tid_Array[0]);
    //}
    //else {

    // Same priority can be selected in multiple task - mk - 21072025
    // priority not found
    select_task_to_change_priority();

    //}
}


function check_in_task(tid) {
    //var query = "select f_data from f_master where tid = '" + tid + "' and c_type = '5'";
    var query = "select fm.c_id, fm.f_data, ch.data from f_master fm JOIN checksheet ch ON fm.c_id = ch.checksheetid where fm.tid = '" + tid + "' and fm.c_type = '5'";
    var q_jsonobj = [];
    q_jsonobj.push({
        data: query,
        p: "1"
    });
    AppBridge.on(cordova).read(onsuccess_check_in_task, onfail_check_in_task, 'formAndChecksheetByTypeFive', { tid: tid });
}

function onsuccess_check_in_task(e) {
    try {
        //var f_data = JSON.parse(e);
        //var myArrayData = itemObj._checkStrObj(f_data[0].data);

        // convert 3 key to full JSON - mk - 18072025
        var myArray = JSON.parse(e);
        let blank_data = myArray[0].data;
        blank_data = JSON.parse(blank_data);
        var f_data = myArray[0].f_data;
        f_data = JSON.parse(f_data);
        var myArrayData = itemObj._checkStrObj(f_data[0].data);
        myArrayData = merge_checksheet_template_n_log_form_json(blank_data, myArrayData);

        var new_priority = $(priority_ddl_id).val();
        for (i = 0; i < myArrayData.length; i++) {
            var name = myArrayData[i].prop[0].name;
            var type = myArrayData[i].type;
            if (name == 'Priority' && type == 3) {
                var ans = myArrayData[i].ans[0];
                if (new_priority == ans) {
                    priority_found++;
                }
                break;
            }
        }

        if (priority_found > 0) {
            // priority found
            onsuccess_change_option_priority();
        }
        else {
            sub_acq_tid_Array.shift();
            check_in_all_tasks(sub_acq_tid_Array);
        }
    }
    catch (e) {
        alert(e + '_onsuccess_check_in_task()');
    }
}

function onfail_check_in_task(e) {
    alet(e + '_check_in_task()');
}


function onsuccess_change_option_priority() {
    try {
        //alert1("Priority Found !");
        //var query = "select f_data from f_master where tid = '" + priority_tid + "' and c_type = '5'";
        var query = "select fm.c_id, fm.f_data, ch.data from f_master fm JOIN checksheet ch ON fm.c_id = ch.checksheetid where fm.tid = '" + priority_tid + "' and fm.c_type = '5'";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "1"
        });
        AppBridge.on(cordova).read(set_old_priority, onfail_onsuccess_change_option_priority, 'formAndChecksheetByTypeFive', { tid: priority_tid });
    } catch (e) {
        alert1(e + '_onsuccess_change_option_priority()');
    }
}

function set_old_priority(e) {
    try {
        alert1("This priority is already in use!");

        //var f_data = JSON.parse(e);
        //var myArrayData = itemObj._checkStrObj(f_data[0].data);

        // convert 3 key to full JSON - mk - 18072025
        var myArray = JSON.parse(e);
        let blank_data = myArray[0].data;
        blank_data = JSON.parse(blank_data);
        var f_data = myArray[0].f_data;
        f_data = JSON.parse(f_data);
        var myArrayData = itemObj._checkStrObj(f_data[0].data);
        myArrayData = merge_checksheet_template_n_log_form_json(blank_data, myArrayData);

        var old_priority;
        for (i = 0; i < myArrayData.length; i++) {
            var name = myArrayData[i].prop[0].name;
            var type = myArrayData[i].type;
            if (name == 'Priority' && type == 3) {
                old_priority = myArrayData[i].ans[0];
                break;
            }
        }

        if (old_priority == '' || old_priority == null || old_priority == undefined || old_priority == 'Select') {
            $(priority_ddl_id).val("Select");
        } else {
            $(priority_ddl_id).val(old_priority);
        }
    } catch (e) {
        alert1(e + '_set_old_priority()');
    }
}

function select_task_to_change_priority() {
    try {
        //alert1("Priority Not Found ! Updating task priority...");
        //var query = "select f_data from f_master where tid = '" + priority_tid + "' and c_type = '5'";
        var query = "select fm.c_id, fm.f_data, ch.data from f_master fm JOIN checksheet ch ON fm.c_id = ch.checksheetid where fm.tid = '" + priority_tid + "' and fm.c_type = '5'";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "1"
        });
        AppBridge.on(cordova).read(update_priority_of_task, onfail_select_task_to_change_priority, 'formAndChecksheetByTypeFive', { tid: priority_tid });
    } catch (e) {
        alert1(e + '_select_task_to_change_priority()');
    }
}

function update_priority_of_task(e) {
    try {
        //var myArray = JSON.parse(e);
        //var f_data = itemObj._checkStrObj(myArray[0].f_data);
        //var myArrayData = itemObj._checkStrObj(f_data[0].data);

        // convert 3 key to full JSON - mk - 18072025
        var myArray = JSON.parse(e);
        let blank_data = myArray[0].data;
        blank_data = JSON.parse(blank_data);
        var f_data = myArray[0].f_data;
        f_data = JSON.parse(f_data);
        var myArrayData = itemObj._checkStrObj(f_data[0].data);
        myArrayData = merge_checksheet_template_n_log_form_json(blank_data, myArrayData);

        var priority = $(priority_ddl_id).val();
        var old_priority;
        for (i = 0; i < myArrayData.length; i++) {
            var name = myArrayData[i].prop[0].name;
            var type = myArrayData[i].type;
            if (name == 'Priority' && type == 3) {
                if (priority == 'Select') {
                    priority = '';
                }
                myArrayData[i].ans[0] = priority;
                break;
            }
        }

        //var new_data = JSON.stringify(myArrayData);
        f_data[0].data = myArrayData;
        f_data = JSON.stringify(f_data);

        var date_s = new Date();
        var time = date_s.getTime();
        var query = "UPDATE f_master SET millisecond='" + time + "', flag='0', f_data = '" + f_data + "' where tid = '" + priority_tid + "' and c_type = '5'";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            q: "0",
            tid: ""
        });

        cordova.exec(update_task_flag_priority, onfail_update_priority_of_task, 'SqlitePlugin', 'insertValuse', q_jsonobj);
    }
    catch (e) {
        alert1(e + '_update_priority_of_task');
    }
}

function onfail_onsuccess_change_option_priority(e) {
    alert1(e + '_onfail_onsuccess_change_option_priority()');
}

function onfail_update_priority_of_task(e) {
    alert1(e + '_onfail_update_priority_of_task()');
}

function onfail_select_task_to_change_priority(e) {
    alert1(e + '_onfail_select_task_to_change_priority');
}

function update_task_flag_priority() {
    try {
        var query = "UPDATE task_master SET flag = '1' where tid = '" + priority_tid + "'";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            q: "1",
            tid: priority_tid
        });
        cordova.exec(onsuccess_update_task_flag_priority, onfail_update_task_flag_priority, 'SqlitePlugin', 'insertValuse', q_jsonobj);
    } catch (e) {
        alert1(e + '_update_task_flag_priority()');
    }
}

function onsuccess_update_task_flag_priority(e) {
    var priority = $(priority_ddl_id).val();
    var filter_ddl_Array = localStorage.getItem('filter_ddl_Array');
    filter_ddl_Array = JSON.parse(filter_ddl_Array);
    filter_ddl_Array.push({
        header: 'Priority',
        ans: priority
    });
    localStorage.setItem('filter_ddl_Array', JSON.stringify(filter_ddl_Array));
    alert1("Priority has been updated !");
}

function onfail_update_task_flag_priority(e) {
    alert1(e + '_onfail_update_task_flag_priority()');
}