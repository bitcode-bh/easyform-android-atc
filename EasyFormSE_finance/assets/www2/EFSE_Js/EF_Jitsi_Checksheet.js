
function check_last_dummy_entry_jitsi() {
    try {
        //var query = "select tid, checksheetid, moduleid, task_id from task_master where username = '" + username + "' ORDER BY tid desc limit 1";

        var query = "select tid, checksheetid, moduleid, task_id from task_master where server_task_id = '" + jitsi_server_task_id + "'";

        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "1"
        });

        cordova.exec(onsuccess_check_last_dummy_entry_jitsi, onfail_check_last_dummy_entry_jitsi, 'SqlitePlugin', 'showValues', q_jsonobj);
    } catch (e) {
        alert1(e + '_check_last_dummy_entry_jitsi()');
    }
}

function onsuccess_check_last_dummy_entry_jitsi(e) {
    try {
        var myArray = JSON.parse(e);
        if (myArray.length > 0) {
            onsuccess_get_tid_from_task_jitsi(e);     // use this dummy task for creation
        }
        else {
            // task_master is blank (no row found)
            insert_new_dummy_entry_jitsi();
        }
    }
    catch (e) {
        alert1(e + '_onsuccess_check_last_dummy_entry_jitsi()');
    }
}

function onfail_check_last_dummy_entry_jitsi(e) {
    alert1(e + '_onfail_check_last_dummy_entry_jitsi()');
}


function insert_new_dummy_entry_jitsi() {

    if (typeof curr_listing_udf == "undefined") {
        curr_listing_udf = "";
    }

    if (curr_listing_udf == "" || curr_listing_udf == null || curr_listing_udf == undefined) {
        //normal task creation
        insert_new_dummy_entry_post_jitsi();
    }
    //else {
    //    //type37 invoice new sub task creation [FT-27092024]
    //    get_checksheet_id_from_flow_id();
    //}
}


function insert_new_dummy_entry_post_jitsi() {
    var user_id = JSON.parse(storage.getItem('user_id'));
    var user_name = JSON.parse(storage.getItem('username'));

    //var checksheetid = storage.getItem('check_type_task');
    var checksheetid = storage.getItem('check_type');

    var p_match_temp_id = localStorage.getItem('p_match_temp_id');
    if (p_match_temp_id == "" || p_match_temp_id == null || p_match_temp_id == undefined) {
        p_match_temp_id = "";
    }

    var data_json = JSON.parse(storage.getItem('list_json'));
    var list_data = JSON.parse(data_json);

    var match_temp_id = list_data[0].match_temp_id;
    if (match_temp_id == "" || match_temp_id == null || match_temp_id == undefined) {
        match_temp_id = "";
    }

    if (F7_device == 'ios') {
        checksheetid = checksheetid.substring(0, checksheetid.length - 0);
    }
    else {
        //checksheetid = checksheetid.substring(1, checksheetid.length - 1);
        checksheetid = checksheetid.replace(/['"]+/g, '');
    }

    var selected_module_id = JSON.parse(storage.getItem('wayflow'));
    var server_task_id = jitsi_server_task_id;                             //static server_task_id=0 for dummy task entry

    //var status_array = list_data[0].status;
    //if (status_array.length == 1) {
    //    var status_t = status_array[0];
    //} else {
    //    var status_t = 0;
    //}

    var status_t = jitsi_task_status;

    var query = "INSERT INTO task_master (user_id, username, checksheetid, moduleid, match_temp_id, p_match_temp_id, server_task_id, status) VALUES('" + user_id + "','" + user_name + "','" + checksheetid + "', '" + selected_module_id + "','" + match_temp_id + "','" + p_match_temp_id + "','" + server_task_id + "','" + status_t + "');";
    var q_jsonobj = [];
    q_jsonobj.push({
        data: query,
        q: "5",
        tid: ""
    });

    cordova.exec(onsuccess_insert_task_jitsi, onfail_insert_task_jitsi, 'SqlitePlugin', 'insertValuse', q_jsonobj);
}

function onsuccess_insert_task_jitsi(e) {
    try {
        var selected_module_id = JSON.parse(storage.getItem('wayflow'));

        //var query = "select tid, checksheetid from task_master where username = '" + username + "' ORDER BY tid desc limit 1";

        var query = "select tid, checksheetid from task_master where username = '" + username + "' and moduleid ='" + selected_module_id + "'  ORDER BY tid desc limit 1";

        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "1"
        });

        cordova.exec(onsuccess_get_tid_from_task_jitsi, onfail_get_tid_from_task_jitsi, 'SqlitePlugin', 'showValues', q_jsonobj);
    } catch (e) {
        alert1(e + '_onsuccess_insert_task_jitsi()');
    }
}
function onfail_insert_task_jitsi() {
    alert1('onfail_insert_task');
}

function onsuccess_get_tid_from_task_jitsi(e) {
    try {
        var myArray = JSON.parse(e);
        if (myArray.length > 0) {
            var check_type = parseInt(myArray[0].checksheetid);
            var t_id = myArray[0].tid;
            var step = 1;

            storage.setItem('tid', JSON.stringify(t_id));
            localStorage.setItem('tid', t_id);
            localStorage.setItem('checksheetid', check_type);
            localStorage.setItem('p_key', step);
            storage.setItem('check_type', JSON.stringify(check_type));
            storage.setItem('server_task_id', JSON.stringify(jitsi_server_task_id));

            var data_json = JSON.parse(storage.getItem('list_json'));
            var list_data = JSON.parse(data_json);
            //var task_with_customer = list_data[0].task_with_customer;
            //if (task_with_customer == "true") {
            //    //open popup of cust-list on task create(+) btn click
            //    get_udf_for_cust_list();
            //}
            //else {
            //    var type37_len = $("div[id^='div_subtask_']").length;
            //    if (type37_len > 0) {
            //        myApp.popup('.popup-new-task-create');
            //        data_to_read_task();
            //    }
            //    else {
            //        changeurl("viewsitedata_task.html");
            //    }
            //}
            check_child_flow_for_parent();
        }
        //else {
        //    // rare issue handling
        //    select_network_for_create_task();
        //}
    }
    catch (e) {
        alert1(e + '_onsuccess_get_tid_from_task_jitsi)');

        // rare issue handling
        //select_network_for_create_task();
    }
}
function onfail_get_tid_from_task_jitsi() {
    alert1('onfail_get_tid_from_task_jitsi');
}
