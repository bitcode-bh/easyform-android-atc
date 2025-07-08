
// for ios only
function select_file(t_new_id, t_que_id, t_upload_type, t_basepath, t_mob_ext) {
    try {
        storage.setItem('up_new_id', JSON.stringify(t_new_id));
        storage.setItem('up_que_id', JSON.stringify(t_que_id));
        storage.setItem('up_upload_type', JSON.stringify(t_upload_type));
        storage.setItem('up_base_path', JSON.stringify(t_basepath));

        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var survey_mode = list_data[0].survey_mode;

        if (form_flag == 7 || (form_flag == 6 && survey_mode == "online") || (curr_page_flag == "viewsitedata_task" && survey_mode == "online")) {
            //upload live doc for customer and task form
            select_file_n_upload_live();
        }
        else {
            var q_jsonobj = [];
            q_jsonobj.push({
                ext: t_mob_ext
            });
            cordova.exec(onsuccess_select_file, onfail_select_file, 'choose_file_plug', 'anAction', q_jsonobj);
        }
    }
    catch (e) {
        alert1(e + '_select_file()');
    }
}

function onsuccess_select_file(e) {
    try {
        form_has_changed = "true";                      //to get confirmation on back btn while editing form
        var myArray = JSON.parse(e);
        var file_name = myArray[0].file_name;
        var path = myArray[0].path;
        var t_new_id = JSON.parse(storage.getItem('up_new_id'));
        $("#lbl_up_" + t_new_id + "").text(file_name);
        check_doc_entry(path);
    }
    catch (e) {
        alert1(e + '_onsuccess_select_file()');
    }
}

function onfail_select_file(e) {
    // back button pressed
}

function select_file_android(t_new_id, t_que_id, t_upload_type, t_basepath, t_mob_ext, t_max_file_size) {
    storage.setItem('up_new_id', JSON.stringify(t_new_id));
    storage.setItem('up_que_id', JSON.stringify(t_que_id));
    storage.setItem('up_upload_type', JSON.stringify(t_upload_type));
    storage.setItem('up_base_path', JSON.stringify(t_basepath));

    var max_file_size = t_max_file_size;

    var data_json = JSON.parse(storage.getItem('list_json'));
    var list_data = JSON.parse(data_json);
    var survey_mode = list_data[0].survey_mode;
    var c_is_online = JSON.parse(storage.getItem('c_is_online'));  

    if (form_flag == 7 || (form_flag == 0 && c_is_online == 1) || (form_flag == 1 && c_is_online == 1) || (form_flag == 6 && survey_mode == "online") || (curr_page_flag == "viewsitedata_task" && survey_mode == "online")) {
        //upload live doc for customer and task form
        select_file_n_upload_live();
    }
    else {
        var query = "select imei from Login_Master";
        var q_jsonobj = [];
        if (t_mob_ext == "" || t_mob_ext == null || t_mob_ext == undefined || t_mob_ext == "undefined") {
            q_jsonobj.push({
                data: '',
                time: '',
                p: "2",
                flag: "false",
                width: "0",
                height: "0",
                quality: "0",
                max_file_size: max_file_size
            });
        }
        else {
            q_jsonobj.push({
                data: '',
                time: '',
                p: "2",
                flag: "false",
                width: "0",
                height: "0",
                quality: "0",
                mob_ext: t_mob_ext,
                max_file_size: max_file_size
            });
        }
        cordova.exec(check_doc_entry, onfail_select_file_android, 'large_photo', 'anAction', q_jsonobj);
    }
}


// check doc for insert or update
function check_doc_entry(imageData) {
    try {
        form_has_changed = "true";                      //to get confirmation on back btn while editing form
        curr_survey_data["doc_path"] = imageData;

        var t_id = curr_survey_data["t_id"];
        var step = curr_survey_data["step"];
        var check_type = curr_survey_data["check_type"];
        var doc_que_id = JSON.parse(storage.getItem('up_que_id'));

        var type22_popup = $('.popup-type22:visible');
        if (type22_popup.length > 0) {
            //$("#popover_viewphoto").parent().hide();

            var type22_img_que_id = storage.getItem('img_id_type22');
            if (type22_current_mode == 'edit') {
                // edit mode
                var t_row_index_no = row_index_no;
            }
            else {
                //  insert mode
                var last_index = $('#row_index_' + type22_new_id + '').val();
                last_index = parseInt(last_index);
                var t_row_index_no = last_index + 1;
            }
        }
        else {
            var type22_img_que_id = 0;
            var t_row_index_no = 0;
        }

        var query = "select _id from video where tid = '" + t_id + "' and checksheetid = '" + check_type + "' and step_No = '" + step + "' and que_id = '" + doc_que_id + "' and Ph_id = '" + type22_img_que_id + "' and it_id = '" + t_row_index_no + "'";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "0"
        });
        cordova.exec(onsuccess_check_doc_entry, onfail_check_doc_entry, 'SqlitePlugin', 'showValues', q_jsonobj);
    }
    catch (e) {
        alert1(e + '_check_doc_entry()');
    }
}

var curr_doc_id;
function onsuccess_check_doc_entry(e) {
    curr_doc_id = e;
    curr_query_type = 'update';
    onsuccess_select_file_android();
}

function onfail_check_doc_entry(e) {
    curr_query_type = 'insert';
    onsuccess_select_file_android();
}

function onsuccess_select_file_android() {
    try {
        var doc_path = curr_survey_data["doc_path"];

        var date_s = new Date();
        var time = date_s.getTime();

        var company_id = JSON.parse(storage.getItem('company_id'));
        var user_id = JSON.parse(storage.getItem('user_id'));
        var siteid = JSON.parse(storage.getItem('siteid'));
        var p_name = company_id + "_" + user_id + "_" + siteid + "_" + time;

        var t_id = curr_survey_data["t_id"];
        var up_new_id = JSON.parse(storage.getItem('up_new_id'));

        //        var last_n = doc_path.lastIndexOf("/");
        //        var file_name = doc_path.substr(last_n+1, doc_path.length);
        //        if(file_name.length > 35){
        //             file_name = file_name.substr(0,35) + '';
        //        }

        var last_brack = doc_path.lastIndexOf("/");
        var file_name = doc_path.substr(last_brack + 1, doc_path.length);
        //$('#lbl_up_' + up_new_id + '').html(file_name);
        //$('#lbl_up_' + up_new_id + '').attr('for', doc_path);

        $('#btn_select_' + up_new_id + '').text('Change File');

        var up_que_id = JSON.parse(storage.getItem('up_que_id'));
        var check_type = curr_survey_data["check_type"];

        var type22_popup = $('.popup-type22:visible');
        if (type22_popup.length > 0) {
            var type22_img_que_id = storage.getItem('img_id_type22');
            if (type22_current_mode == 'edit') {
                // edit mode
                var t_row_index_no = row_index_no;
            }
            else {
                //  insert mode
                var last_index = $('#row_index_' + type22_new_id + '').val();
                last_index = parseInt(last_index);
                var t_row_index_no = last_index + 1;
            }
        }
        else {
            var type22_img_que_id = 0;
            var t_row_index_no = 0;
        }

        p_name = p_name + '_' + t_row_index_no;
        var step = curr_survey_data["step"];

        // upload with additional keys
        var actual_name = file_name;
        var sharepoint_link = '';
        var upload_type = JSON.parse(storage.getItem('up_upload_type'));
        if (upload_type == 'easyform') {
            var base_path = '';
        }
        else {
            var base_path = JSON.parse(storage.getItem('up_base_path'));
        }

        $('#lbl_up_' + up_new_id + '').html(file_name);
        var up_obj = [];
        up_obj.push({
            'act_file_name': actual_name,
            'file_path': doc_path,
            'sys_file_name': p_name,
            'sharepoint_link': '',
            'photo_id': "",
            'photo_size': ""
        });

        $('#lbl_up_' + up_new_id + '').attr('for', JSON.stringify(up_obj));
        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var match_temp_id = list_data[0].match_temp_id;
        if (match_temp_id == "" || match_temp_id == null || match_temp_id == undefined) {
            match_temp_id = "";
        }

        var up_new_id = JSON.parse(storage.getItem('up_new_id'));
        var prop_name = $("#div_upload_doc_" + up_new_id + "").attr('name');

        if (curr_query_type == 'insert') {
            var query = "INSERT INTO video (tid, que_id, checksheetid, p_name, or_path, con_path, type, issend_track, CompanyId, CustomerUniq, Ph_id, it_id, millisecond, step_No, size, upload_type, base_path, actual_name, sharepoint_url, match_temp_id, que_name) VALUES('"
                + t_id + "','" + up_que_id + "','" + check_type + "','" + p_name + "','" + doc_path + "', '', 'doc', '0', '"
                + company_id + "', '" + siteid + "','" + type22_img_que_id + "', '" + t_row_index_no + "', '" + time + "', '" + step + "', '', '" + upload_type + "', '" + base_path + "', '" + actual_name + "', '" + sharepoint_link + "', '" + match_temp_id + "', '" + prop_name + "');";
        }
        else {
            var query = "update video set p_name= '" + p_name + "', or_path= '" + doc_path + "', issend_track= '0', CustomerUniq= '"
                + siteid + "',  Ph_id= '" + type22_img_que_id + "', it_id= '" + t_row_index_no + "', millisecond= '" + time + "', upload_type= '"
                + upload_type + "', base_path='" + base_path + "', actual_name='" + actual_name + "', sharepoint_url='" + sharepoint_link + "' where _id= '" + curr_doc_id + "'";
        }

        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            q: "0",
            tid: ""
        });
        cordova.exec(onsuccess_insert_doc_entry, onfail_insert_doc_entry, 'SqlitePlugin', 'insertValuse', q_jsonobj);
    } catch (e) {
        alert1(e + '_onsuccess_select_file_android()');
    }
}

function onfail_select_file_android(e) {
    // user pressed back button 
}

function onsuccess_insert_doc_entry(e) {
    if (type22_current_mode == 'edit') {
        alert1('Document updated successfully');
    }
    else {
        alert1('Document added successfully');
    }

    form_has_changed = "true";                      //to get confirmation on back btn while editing form
}

function onfail_insert_doc_entry(e) {
    alert1(e + '_onfail_insert_doc_entry');
}

function check_selected_file_extension(obj, ext_str) {
    var val = $(obj).val().toLowerCase();
    var regex = new RegExp("(.*?)\.(" + ext_str + ")$");
    if (!(regex.test(val))) {
        $(obj).val('');
        alert1('Please select correct file format. Allowed file format: [' + ext_str.replace(/\|/g, ", ") + ']');
    }
}



function check_down_doc_entry(t_new_id, t_path, t_que_id, down_checksheetid) {
    loading();
    setTimeout(function () {
        loading_hide();
    }, 2000);
    storage.setItem('up_new_id', JSON.stringify(t_new_id));
    storage.setItem('up_que_id', JSON.stringify(t_que_id));
    storage.setItem('up_doc_path', JSON.stringify(t_path));
    localStorage.setItem('up_down_checksheetid', down_checksheetid);

    var t_id = curr_survey_data["t_id"];
    //var check_type = curr_survey_data["check_type"];
    var up_que_id = JSON.parse(storage.getItem('up_que_id'));
    var type22_img_que_id = storage.getItem('img_id_type22');

    var type22_popup = $('.popup-type22:visible');
    if (type22_popup.length > 0) {
        var type22_img_que_id = storage.getItem('img_id_type22');
        if (type22_current_mode == 'edit') {
            // edit mode
            var t_row_index_no = row_index_no;
        }
        else {
            //  insert mode
            var last_index = $('#row_index_' + type22_new_id + '').val();
            last_index = parseInt(last_index);
            var t_row_index_no = last_index + 1;
        }
    }
    else {
        var type22_img_que_id = 0;
        var t_row_index_no = 0;
    }

    var query = "select _id, or_path from download_video where tid= '" + t_id + "' and checksheetid = '" + down_checksheetid + "' and que_id='"
        + up_que_id + "' and Ph_id = '" + type22_img_que_id + "' and it_id = '" + t_row_index_no + "'";
    //alert1(query);
    var q_jsonobj = [];
    q_jsonobj.push({
        data: query,
        p: "1"
    });
    cordova.exec(onsuccess_check_down_doc_entry, onfail_check_down_doc_entry, 'SqlitePlugin', 'showValues', q_jsonobj);
}

var type22_link = 'inside';
function check_down_doc_entry_attached(t_new_id, t_path, t_que_id, down_checksheetid, t_row_index_no, type22_img_que_id) {
    try {
        loading();
        setTimeout(function () {
            loading_hide();
        }, 2000);
        type22_link = 'outside';
        row_index_no = t_row_index_no;
        storage.setItem('up_new_id', JSON.stringify(t_new_id));
        storage.setItem('up_que_id', JSON.stringify(t_que_id));
        storage.setItem('up_doc_path', JSON.stringify(t_path));
        localStorage.setItem('up_down_checksheetid', down_checksheetid);
        storage.setItem('img_id_type22', type22_img_que_id);

        var t_id = curr_survey_data["t_id"];
        var up_que_id = JSON.parse(storage.getItem('up_que_id'));

        var query = "select _id, or_path from download_video where tid= '" + t_id + "' and checksheetid = '" + down_checksheetid + "' and que_id='"
            + up_que_id + "' and Ph_id = '" + type22_img_que_id + "' and it_id = '" + t_row_index_no + "'";
        //alert1(query);
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "1"
        });
        cordova.exec(onsuccess_check_down_doc_entry, onfail_check_down_doc_entry, 'SqlitePlugin', 'showValues', q_jsonobj);
    }
    catch (e) {
        alert1(e + '_check_down_doc_entry_attached()');
    }
}

function onsuccess_check_down_doc_entry(e) {
    try {
        var myArray = JSON.parse(e);
        if (myArray.length > 0) {
            var path_id = myArray[0]._id;
            var t_path = myArray[0].or_path;
            localStorage.setItem('down_doc_entry', '1');
        }
        else {
            var path_id = 0;
            var t_path = storage.getItem('up_doc_path');
            localStorage.setItem('down_doc_entry', '0');
        }
        var t_new_id = JSON.parse(storage.getItem('up_new_id'));
        view_doc_in_browser(t_new_id, t_path, path_id);
    }
    catch (e) {
        alert1(e + '_onsuccess_check_down_doc_entry()');
    }
}

function onfail_check_down_doc_entry(e) {
    alert1(e + '_onfail_check_down_doc_entry()');
}

function view_doc_in_browser(t_new_id, t_path, path_id) {
    try {
        if (F7_device == 'ios') {
            var q_jsonobj = [];
            q_jsonobj.push({
                'path': t_path,
                'id': path_id
            });
            cordova.exec(onsuccess_view_doc_in_browser, onfail_view_doc_in_browser, 'openURLSafariPlug', 'anAction', q_jsonobj);
        }
        else {
            var q_jsonobj = [];
            q_jsonobj.push({
                'url': t_path,
                'id': path_id
            });
            cordova.exec(onsuccess_view_doc_in_browser, onfail_view_doc_in_browser, 'webview_plugin', 'sharepoint', q_jsonobj);
        }
    }
    catch (e) {
        alert1(e + '_view_doc_in_browser()');
    }
}

function onsuccess_view_doc_in_browser(e) {
    loading_hide();
}

function onfail_view_doc_in_browser(e) {
    var down_doc_entry = localStorage.getItem('down_doc_entry');
    if (down_doc_entry == '0') {
        var up_new_id = JSON.parse(storage.getItem('up_new_id'));
        $('#doc_down_' + up_new_id + '').trigger('onclick');
    }
    else {
        // call for doc download
        alert1("Your file is currently downloading, please wait...!");
        var obj = {};
        var vdo_obj = new MkDocDownload(obj, function (e) { });
        vdo_obj.start_doc_download();
    }
}



// download document
function toggle_doc_download(t_new_id, t_que_id, t_upload_type, t_act_file_name, t_doc_path, t_base_path, t_sharepoint_link, t_parent_task_id) {
    try {
        t_sharepoint_link = t_sharepoint_link.replace(/qqqqq/g, "\'");
        var obj = {
            new_id: t_new_id,
            doc_path: t_doc_path,
            doc_que_id: t_que_id,
            upload_type: t_upload_type,
            actual_name: t_act_file_name,
            base_path: t_base_path,
            sharepoint_link: t_sharepoint_link,
            parent_task_id: t_parent_task_id
        }
        var vdo_obj = new MkDocDownload(obj, function (e) { });
        vdo_obj.insert_doc_download();
    }
    catch (e) {
        alert1(e + '_toggle_doc_download()');
    }
}

var MkDocDownload = function (obj, onsuccess_doc_down) {
    var new_id = obj.new_id;
    var doc_path = obj.doc_path;
    var doc_que_id = obj.doc_que_id;
    var upload_type = obj.upload_type;
    var base_path = obj.base_path;
    var actual_name = obj.actual_name;
    var sharepoint_link = obj.sharepoint_link;
    var parent_task_id = obj.parent_task_id;

    // Insert Document
    this.insert_doc_download = function () {
        try {
            //var myArray = JSON.parse(e);
            var date_s = new Date();
            var time = date_s.getTime();

            var company_id = JSON.parse(storage.getItem('company_id'));
            var user_id = JSON.parse(storage.getItem('user_id'));
            var siteid = JSON.parse(storage.getItem('siteid'));
            var p_name = company_id + "_" + user_id + "_" + siteid + "_" + time;

            var t_id = curr_survey_data["t_id"];
            //var check_type = curr_survey_data["check_type"];
            var down_checksheetid = localStorage.getItem('up_down_checksheetid');

            var type22_img_que_id = storage.getItem('img_id_type22');

            if (type22_link == 'inside') {
                // type22 popup opened
                var type22_popup = $('.popup-type22:visible');
                if (type22_popup.length > 0) {
                    var type22_img_que_id = storage.getItem('img_id_type22');
                    if (type22_current_mode == 'edit') {
                        // edit mode
                        var t_row_index_no = row_index_no;
                    }
                    else {
                        //  insert mode
                        var last_index = $('#row_index_' + type22_new_id + '').val();
                        last_index = parseInt(last_index);
                        var t_row_index_no = last_index + 1;
                    }
                }
                else {
                    var type22_img_que_id = 0;
                    var t_row_index_no = 0;
                }
            }
            else {
                // type22 popup closed
                var t_row_index_no = row_index_no;
            }

            p_name = p_name + '_' + t_row_index_no;

            sharepoint_link = sharepoint_link.replace(/'/g, "''");
            var query = "INSERT INTO download_video (tid, que_id, checksheetid, p_name, or_path, con_path, isdown_track, CompanyId, CustomerUniq, Ph_id, it_id, millisecond, upload_type, base_path, actual_name, sharepoint_url, parent_task_id) VALUES('"
                + t_id + "', '" + doc_que_id + "','" + down_checksheetid + "','" + p_name + "','" + doc_path + "', '', '0', '" + company_id + "', '" + siteid + "','"
                + type22_img_que_id + "', '" + t_row_index_no + "', '" + time + "', '" + upload_type + "', '" + base_path + "', '" + actual_name + "', '" + sharepoint_link + "', '" + parent_task_id + "');";
            //alert1(query);
            var q_jsonobj = [];
            q_jsonobj.push({
                data: query,
                q: "0",
                tid: ""
            });
            cordova.exec(onsuccess_insert_doc_download, onfail_insert_doc_download, 'SqlitePlugin', 'insertValuse', q_jsonobj);
        }
        catch (e) {
            alert1(e + '_insert_doc_download()');
        }
    }
    function onsuccess_insert_doc_download(e) {
        try {
            var doc_obj = new MkDocDownload(obj, function (e) { });
            doc_obj.get_doc_download_id();
            onsuccess_doc_down(e);
        }
        catch (e) {
            alert1(e);
        }
    }
    function onfail_insert_doc_download(e) {
        alert1(e + '_onfail_insert_doc_download()');
    }

    // Get Last Inserted doc Id
    this.get_doc_download_id = function () {
        try {
            var query = "select _id from download_video ORDER BY _id desc limit 1";
            var q_jsonobj = [];
            q_jsonobj.push({
                data: query,
                p: "1"
            });
            cordova.exec(onsuccess_get_doc_download_id, onfail_get_doc_download_id, 'SqlitePlugin', 'showValues', q_jsonobj);
        }
        catch (e) {
            alert1(e + '_get_doc_download_id()');
        }
    }
    function onsuccess_get_doc_download_id(e) {
        try {
            var myArray = JSON.parse(e);
            if (myArray.length > 0) {
                var _id = myArray[0]._id;
                var param = [];
                param.push({
                    _id: _id,
                    download_id: ''
                })
                //$('#vdo_hdn_' + new_id + '').val(JSON.stringify(param));
                var vdo_obj = new MkDocDownload(obj, function (e) { });
                vdo_obj.start_doc_download();
            }
            onsuccess_doc_down(e);
        }
        catch (e) {
            alert1(e);
        }
    }
    function onfail_get_doc_download_id(e) {
        alert1(e + '_onfail_get_doc_download_id()');
    }

    // Start Doc Download
    this.start_doc_download = function () {
        try {
            var query = "select imei from Login_Master";
            var q_jsonobj = [];
            q_jsonobj.push({
                data: query,
                p: "8" // start document download
            });
            cordova.exec(onsuccess_start_doc_download, onfail_start_doc_download, 'SqlitePlugin', 'showValues', q_jsonobj);
        }
        catch (e) {
            alert1(e + '_start_doc_download()');
        }
    }
    function onsuccess_start_doc_download(e) {
        try {
            onsuccess_doc_down(e);
            loading_hide();
        }
        catch (e) {
            alert1(e + '_onsuccess_start_video_download()');
        }
    }
    function onfail_start_doc_download(e) {
        alert1(e + '_onfail_start_video_download()');
    }



};
































































































// unused code
function init_upload_doc(t_new_id, t_que_id) {
    storage.setItem('up_new_id', JSON.stringify(t_new_id));
    var date_s = new Date();
    var time = date_s.getTime();
    var company_id = storage.getItem('company_id');
    var user_id = storage.getItem('user_id');
    var server_task_id = JSON.parse(storage.getItem('server_task_id'));
    var file_name = company_id + "_" + user_id + "_" + server_task_id + "_"
        + time;

    var r = new Flow({
        target: 'http://skyresumable.easyform.in/Api/FlowUpload',
        testChunks: true
    });

    var progressBar = new ProgressBar($('#upload-progress'));

    r.assignBrowse(document.getElementById('add-file-btn'));

    $('#start-upload-btn').click(function () {
        r.upload();
    });

    $('#resume-upload-btn').click(function () {
        r.resume();
    });

    $('#cancel-upload-btn').click(function () {
        r.cancel();
        $('#upload-progress').find('.progress-bar').css('width', '0%');
    });

    $('#pause-upload-btn').click(function () {
        if (r.files.length > 0) {
            if (r.isUploading()) {
                return r.pause();
            }
            return r.upload();
        }
    });

    r.on('fileAdded', function (file, event) {
        var old_file_name = file.name;
        var ext = old_file_name.split('.').pop();
        file.name = file_name + "." + ext;
        file_name = file.name;
        progressBar.fileAdded();
    });

    r.on('fileSuccess', function (file, message) {
        progressBar.finish();
    });

    r.on('progress', function () {
        progressBar.uploading(r.progress() * 100);
        $('#pause-upload-btn').find('.glyphicon').removeClass('glyphicon-play')
            .addClass('glyphicon-pause');
    });

    r.on('pause', function () {
        $('#pause-upload-btn').find('.glyphicon')
            .removeClass('glyphicon-pause').addClass('glyphicon-play');
    });

    function ProgressBar(ele) {
        this.thisEle = $(ele);

        this.fileAdded = function () {
            (this.thisEle).removeClass('hide').find('.progress-bar').css(
                'width', '0%');
        },

            this.uploading = function (progress) {
                (this.thisEle).find('.progress-bar').attr('style',
                    "width:" + progress + '%');
            },

            this.finish = function () {
                (this.thisEle).addClass('hide').find('.progress-bar').css('width',
                    '0%');
                make_doc_entry(file_name, server_task_id, t_que_id);
            }

    }
}

// currently disabled (document entry made by server now)
function make_doc_entry(file_name, server_task_id, t_que_id) {
    try {
        var checksheet_id = JSON.parse(storage.getItem('check_type'));
        var username = JSON.parse(storage.getItem('username'));
        var uniqcode = JSON.parse(storage.getItem('uniqcode'));

        var option = [];
        option.push({
            'file_name': file_name,
            'server_task_id': server_task_id,
            'checksheet_id': checksheet_id,
            'que_id': t_que_id
        });

        var appversion = JSON.parse(storage.getItem('appversion'));
        var auth = [];
        auth.push({
            "username": username,
            "devicetype": F7_device,
            "appid": "",
            "u_c": uniqcode,
            "appversion": appversion
        });

        var nj = JSON.stringify(option);
        // alert1(nj);
        loading();

        var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_InsertDocument', JSON.stringify(option), onsuccess_make_doc_entry, onfail_make_doc_entry);
        getdata.callOtherDomain();
    } catch (e) {
        alert1(e + '_make_doc_entry()');
        loading_hide();
    }
}

function onsuccess_make_doc_entry(e) {
    try {
        var result = e.responseText;
        result = eval('(' + result + ')');
        var status = result[0].status;
        if (status == 1) {
            //var up_doc_path = result[0].message;

            var data = result[0].data;
            if (data == "" || data == null || data == undefined) {
                var up_doc_path = result[0].message;
            }
            else {
                var up_doc_path = JSON.parse(data);
            }

            var t_new_id = JSON.parse(storage.getItem('up_new_id'));
            $("#hdn_upload_doc_" + t_new_id + "").val(up_doc_path);
            $("#div_up_main_" + t_new_id + "").hide();
            $("#lbl_up_" + t_new_id + "").show();
        } else {
            var message = result[0].message;
            alert1(message);
        }
        loading_hide();
    } catch (e) {
        alert1(e + '_onsuccess_make_doc_entry()');
        loading_hide();
    }
}

function onfail_make_doc_entry(e) {
    alert1(e + '_onfail_make_doc_entry()');
    loading_hide();
}


function select_file_n_upload_live() {
    try {
        var t_que_id = JSON.parse(storage.getItem('up_que_id'));

        var company_id = JSON.parse(storage.getItem('company_id'));
        //var siteid = JSON.parse(storage.getItem('siteid'));
        //if (siteid == '' || siteid == null || siteid == undefined) {
        //    siteid = '0';
        //}
        var siteid = '0';

        var c_is_online = JSON.parse(storage.getItem('c_is_online'));

        if (form_flag == 6) {
            var check_type = JSON.parse(storage.getItem('check_type_task'));
        }
        else if (form_flag == 12 || (form_flag == 0 && c_is_online == 1)) {
            var check_type = JSON.parse(storage.getItem('check_type'));
            siteid = JSON.parse(storage.getItem('siteid'));
        }
        else if (form_flag == 8) {
            var check_type = localStorage.getItem('check_type_user');
        }
        else {
            var check_type = localStorage.getItem('check_type_customer');
        }

        if (check_type == '' || check_type == null || check_type == undefined) {
            check_type = curr_survey_data["check_type"]
        }

        var type22_popup = $('.popup-type22:visible');
        if (type22_popup.length > 0) {
            var type22_img_que_id = storage.getItem('img_id_type22');
            if (type22_edit_flag == '1') {
                // edit mode
                var t_row_index_no = row_index_no;
            }
            else {
                //  insert mode
                var row_counter = $("#hdn_inv_row_counter_" + type22_new_id + "").val();
                row_counter = parseInt(row_counter);
                var t_row_index_no = row_counter + 1;
            }
        }
        else {
            var type22_img_que_id = 0;
            var t_row_index_no = 0;
        }

        var step = curr_survey_data["step"];
        if (step == '' || step == null || step == undefined) {
            step = '1';
        }

        if ((form_flag == 0 || form_flag == 1) && c_is_online == 1) {
            // normal online form
            var sid = JSON.parse(storage.getItem('server_task_id'));
        }
        else if (form_flag == 12) {
            // group task
            var t_curr_cd_div = target_div;
            t_curr_cd_div = t_curr_cd_div.replace('cd_', '');
            t_curr_cd_div = t_curr_cd_div.trim();
            var sid = t_curr_cd_div;
        }
        else {
            var task_mode = localStorage.getItem('task_mode');
            if (task_mode == "edit") {
                var sid = JSON.parse(storage.getItem('server_task_id'));
            }
            else {
                var sid = '0';
            }
        }     

        var flowParamData = [];
        flowParamData.push({
            company_id: company_id,
            site_id: siteid,
            sid: sid,
            que_id: t_que_id,
            checksheetid: check_type,
            step_No: step,
            Ph_id: type22_img_que_id,
            th_path: '',
            size: '',
            type: '',
            it_id: t_row_index_no
        });

        var query = "select imei from Login_Master";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "2",                             // p2 - browse all files / p1 - browse photo only
            photo_type: "browse",
            flowParamData: flowParamData
        });

        //alert1('q_jsonobj: ' + JSON.stringify(q_jsonobj));

        loading();
        cordova.exec(onsuccess_select_file_n_upload_live, onfail_select_file_n_upload_live, 'UploadPhotoPlugin', 'anAction', q_jsonobj);
    }
    catch (e) {
        alert1(e + '_select_file_n_upload_live');
    }
}

function onsuccess_select_file_n_upload_live(e) {
    try {
        loading_hide();

        form_has_changed = "true";                      //to get confirmation on back btn while editing form

        var curr_form_flag = form_flag;
        var response = JSON.parse(e);
        var photo_id = response[0].photo_id;
        var curr_file_size_mb = response[0].photo_size;
        var doc_path = response[0].photo_path;

        if (photo_id == '' || photo_id == null || photo_id == undefined) { }
        else {
            Photo_Id_Array.push({ "photo_id": photo_id });
        }

        var up_new_id = JSON.parse(storage.getItem('up_new_id'));
        var curr_mode_text = $('#btn_select_' + up_new_id + '').text();
        if (curr_mode_text == 'Change File') {
            alert1('Document updated successfully');
        }
        else {
            alert1('Document added successfully');
        }

        var last_brack = doc_path.lastIndexOf("/");
        var file_name = doc_path.substr(last_brack + 1, doc_path.length);

        $('#lbl_up_' + up_new_id + '').html(file_name);
        $('#btn_select_' + up_new_id + '').text('Change File');

        var date_s = new Date();
        var time = date_s.getTime();
        var company_id = JSON.parse(storage.getItem('company_id'));
        var user_id = JSON.parse(storage.getItem('user_id'));

        //if (curr_form_flag == 6) {
        //    var siteid = JSON.parse(storage.getItem('siteid'));
        //    if (siteid == '' || siteid == null || siteid == undefined) {
        //        siteid = '0';
        //    }
        //}
        //else {
        //    var siteid = 0;
        //}
        var siteid = 0;

        var type22_popup = $('.popup-type22:visible');
        if (type22_popup.length > 0) {
            if (type22_current_mode == 'edit') {
                // edit mode
                var t_row_index_no = row_index_no;
            }
            else {
                //  insert mode
                var last_index = $('#row_index_' + type22_new_id + '').val();
                last_index = parseInt(last_index);
                var t_row_index_no = last_index + 1;
            }
        }
        else {
            var t_row_index_no = 0;
        }

        var p_name = company_id + "_" + user_id + "_" + siteid + "_" + time + '_' + t_row_index_no;
        //var answer = [];
        //answer.push(p_name, p_name, '', '', photo_id, curr_file_size_mb);

        // upload with additional keys
        var actual_name = file_name;
        var sharepoint_link = '';
        var upload_type = JSON.parse(storage.getItem('up_upload_type'));
        if (upload_type == 'easyform') {
            var base_path = '';
        }
        else {
            var base_path = JSON.parse(storage.getItem('up_base_path'));
        }

        $('#lbl_up_' + up_new_id + '').html(file_name);

        var up_obj = [];
        up_obj.push({
            'act_file_name': actual_name,
            'file_path': doc_path,
            'sys_file_name': p_name,
            'sharepoint_link': '',
            'photo_id': photo_id,
            'photo_size': curr_file_size_mb
        });

        $('#lbl_up_' + up_new_id + '').attr('for', JSON.stringify(up_obj));

        //var img_id = JSON.parse(storage.getItem('img_id'));

        //if (curr_form_flag == 0 || curr_form_flag == 6) {
        //    // normal form
        //    jsonObj_old[img_id].ans = answer;
        //} else if (curr_form_flag == 1 || curr_form_flag == 4 || curr_form_flag == 5) {
        //    // type22 form
        //    jsonObj_type22[img_id].ans = answer;
        //} else if (curr_form_flag == 2 || curr_form_flag == 3) {
        //    // type23 form
        //    jsonObj_type23[img_id].ans = answer;
        //}
        //else if (curr_form_flag == 7) {
        //    // new customer form
        //    jsonObj_cust_add[img_id].ans = answer;
        //}
    }
    catch (e) {
        loading_hide();
        alert1(e + '_onsuccess_select_file_n_upload_live');
    }
}

function onfail_select_file_n_upload_live(e) {
    //alert1(e + '_onfail_select_file_n_upload_live');
    loading_hide();
}

// open document with live url (no background download) 03022023
function view_doc_in_browser_live_url(t_path) {
    try {
        if (F7_device == 'ios') {
            var q_jsonobj = [];
            q_jsonobj.push({
                'path': t_path,
                'id': 0
            });
            cordova.exec(function () { }, function () { }, 'openURLSafariPlug', 'anAction', q_jsonobj);
        }
        else {
            var q_jsonobj = [];
            q_jsonobj.push({
                'url': t_path,
                'id': 0
            });
            cordova.exec(function () { }, function () { }, 'webview_plugin', 'anAction', q_jsonobj);
        }
    }
    catch (e) {
        alert1(e + '_view_doc_in_browser()');
    }
}