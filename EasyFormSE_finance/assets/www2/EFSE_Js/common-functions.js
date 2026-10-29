
var is_approval;
// Form controls and submit/recovery callbacks deliberately share these arrays.
// One owner prevents another page script from resetting them during lazy load.
var glob_livelink_Array = [];
var last_submit_button_Array = [];
var form_livelink_generation = 0;
function load_form_livelinks(onReady) {
    var request = ++form_livelink_generation;
    glob_livelink_Array = [];
    last_submit_button_Array = [];
    function finish(rows) {
        if (request !== form_livelink_generation) return;
        glob_livelink_Array = rows;
        onReady();
    }
    cordova.exec(function (response) {
        var rows = [];
        try {
            var data = typeof response === 'string' ? JSON.parse(response) : response;
            if (Array.isArray(data)) rows = data.map(function (row) {
                return { live_url: row.live_url, download_url_path: row.download_url_path };
            });
        } catch (error) { console.error('Unable to read local form links'); }
        finish(rows);
    }, function () { finish([]); }, 'SqlitePlugin', 'showValues', [{ data: 'select * from download_live_url', p: '1' }]);
    return function () { if (request === form_livelink_generation) form_livelink_generation++; };
}
// Filtering a picker does not change an answer; real popup/array edits still do.
function mark_form_answer_changed(control) {
    if (control.type === 'search' || $(control).closest('.searchbar').length) return;
    form_has_changed = "true";
    if (window.AppFormDrafts) AppFormDrafts.changed();
    $(control).closest("div.cntrl_main_div").css("border", "none");
}
// Expanding details inside a checkbox label must not select the task.
document.addEventListener('click', function (event) {
    if (event.target.closest && event.target.closest('.readmore-link')) event.preventDefault();
}, true);
if (document.readyState === 'loading') {
    // A form page running in a shell frame (see js/app_frame_pages.js) needs the notices and press
    // feedback but not a second shell: the one in the parent window does the navigating.
    var inShellFrame = false;
    try { inShellFrame = !!(window.frameElement && window.frameElement.classList.contains('app-frame')); } catch (e) { }
    document.write('<script src="js/phase1_ui.js"><\/script><script src="js/app_bridge.js"><\/script>' + (inShellFrame ? '' :
        '<script src="js/app_shell.js"><\/script><script src="js/app_pages.js"><\/script><script src="js/app_chrome.js"><\/script><script src="js/app_frame_pages.js"><\/script>'));
}
// Reload the page that holds this one (the profile popup is a frame inside Home). When Home itself
// runs in a shell frame, reloading its own address would load it without Cordova, so ask the shell
// to open it again instead.
function reload_parent_page() {
    var holder = window.parent;
    try {
        if (holder.frameElement && holder.frameElement.classList.contains('app-frame') && holder.parent.changeurl) {
            holder.parent.changeurl(holder.location.pathname.split('/').pop() + holder.location.search);
            return;
        }
    } catch (e) { }
    holder.location.reload();
}
// Back to Home lands on its top level, with the hero card, not on the module level the user came
// through. The same reset the Home tab does (see home_tab_click in selection.js).
function go_home_top() {
    ['curr_btn_mode', 'id_Array', 'level_Array', 'list_json', 'cust_flow_Array'].forEach(function (key) {
        try { storage.setItem(key, JSON.stringify('')); } catch (e) { }
    });
    changeurl("selection.html", 'back');
}
function alert1(alert_msg) {
    if (window.AppPhase1 && AppPhase1.enabled('notices')) {
        AppPhase1.notice(alert_msg);
        return;
    }
    alert(alert_msg);
}

function alert2(alert_msg) {
    if (F7_device == 'ios') {
        myApp.alert(alert_msg, 'Alert');
    }
    else {
        alert(alert_msg);
    }
}

// exit application
function exit_app() {
    var q_jsonobj = [];
    q_jsonobj.push({
        data: "",
        p: "23"
    });
    cordova.exec(onsuccess_exit_app, onfail_exit_app, 'SqlitePlugin', 'exitapp', q_jsonobj);
}

function onsuccess_exit_app() {
    //update_user_details();
}

function onfail_exit_app(e) { }

// VAPT: wipe the LMS offline action queue + cached reel videos on logout.
function lms_clear_vapt_cache() {
    try {
        if (typeof cordova !== 'undefined' && cordova.exec) {
            cordova.exec(null, null, 'SqlitePlugin', 'insertValuse', [{ data: "DELETE FROM lms_action_queue", p: "1" }]);
            if (cordova.file && window.resolveLocalFileSystemURL) {
                window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function (dirEntry) {
                    dirEntry.getDirectory('ml_cache', { create: false }, function (cacheDir) {
                        cacheDir.removeRecursively(function () { }, function () { });
                    }, function () { });
                }, function () { });
            }
        }
        // Cached SERVER CONTENT only. The user's own locally-measured progress
        // (lms_watch_seconds_*, lms_ml_quiz_*, video_progress_*) has no server
        // copy to re-fetch, so it is left alone here; login decides whether to
        // keep it, and only does so for the same user/company/server.
        localStorage.removeItem('ml_video_cache_map');
        localStorage.removeItem('ml_video_cache_order');
        if (typeof LmsData !== 'undefined' && LmsData.clearAll) LmsData.clearAll();
    } catch (e) { }
}

// Fresh read-only queue counts, shared by Home upload status and logout.
function get_pending_upload_counts(onDone, forLogout) {
    var queues = {
        tasks: 'task_master where flag = 1 or flag = 3',
        trips: 'lat_plug where issend = 0', videos: 'video where issend_track = 0',
        files: 'f_master where flag = 0', photos: 'p_master where flag = 0'
    };
    if (forLogout) queues.history = 'task_master_history where flag = 1';
    var settled = false;
    var timer = setTimeout(function () { finish(null, false); }, 5000);
    function finish(row, known) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        var counts = { total: 0, known: known };
        Object.keys(queues).forEach(function (key) {
            var n = row && row[key] != null ? Number(row[key]) : NaN;
            if (!isFinite(n) || n < 0) { counts.known = false; n = 0; }
            counts[key] = n;
            counts.total += n;
        });
        onDone(counts);
    }
    function read(query, success, failure) {
        try { cordova.exec(success, failure, 'SqlitePlugin', 'showValues', [{ data: query, p: '1' }]); }
        catch (error) { failure(); }
    }
    function count(known) {
        if (settled) return;
        var query = 'select ' + Object.keys(queues).map(function (key) {
            return '(select count(*) from ' + queues[key] + ') as ' + key;
        }).join(', ');
        read(query, function (e) {
            try { finish(JSON.parse(e)[0], known); }
            catch (error) { finish(null, false); }
        }, function () { finish(null, false); });
    }
    if (forLogout) {
        // The learning outbox is created only after the LMS has been used.
        read("select name from sqlite_master where type = 'table' and name = 'lms_action_queue'", function (e) {
            try {
                var tables = JSON.parse(e);
                if (!Array.isArray(tables)) throw new Error('Invalid queue response');
                if (tables.length) queues.learning = 'lms_action_queue';
                count(true);
            } catch (error) { count(false); }
        }, function () { count(false); });
    } else count(true);
}

function confirm_logout(onConfirm) {
    if (F7_device == 'ios') { onConfirm(); return; }
    if (confirm_logout.checking) return;
    confirm_logout.checking = true;
    get_pending_upload_counts(function (counts) {
        confirm_logout.checking = false;
        var message = 'Are you sure you want to logout?';
        if (counts.total > 0) message = 'Some data is waiting to sync. Do you want to logout?';
        else if (!counts.known) message = 'Sync status could not be checked. Do you want to logout?';
        vibrate_device();
        if (confirm(message)) onConfirm();
    }, true);
}

// Keep the existing logout actions behind the same state-aware confirmation.
function logout_on_click() {
    confirm_logout(function () {
        lms_clear_vapt_cache();
        if (typeof HomeDashboard !== 'undefined' && HomeDashboard.destroy) HomeDashboard.destroy();
        changeurl("Login.html");
    });
}

function logout_on_click_online() {
    confirm_logout(function () {
        loading();
        var login_obj = [];
        login_obj.push({
            'log_flag': 'logout',
            'username_': username,
            'password_': '',
            'password1_': '',
            'uniq_code': uniqcode,
            'imeino': imeino,
            'appid': '',
            'version': '',
            'servermilli': 0,
            'otp': ''
        });
        cordova.exec(onsuccess_logout_on_click_online, onfail_logout_on_click_online, 'SqlitePlugin', 'login_detail_plug1', login_obj);
    });
}

function onsuccess_logout_on_click_online(e) {

    // Saved task and checksheet rows must not stay readable on the phone after logout.
    localStorage.removeItem('mwfm_phase1_lists');
    localStorage.setItem('view_biometric', 'false');
    lms_clear_vapt_cache();
    if (typeof HomeDashboard !== 'undefined' && HomeDashboard.destroy) HomeDashboard.destroy();
    changeurl("Login.html");
}

function onfail_logout_on_click_online(e) {
    loading_hide();
    show_request_failure(e);
}

// Login and logout share one failure popup and the existing modal styling.
function show_request_failure(error) {
    if (typeof error === 'string') {
        try { error = JSON.parse(error); } catch (ignored) { error = {}; }
    }
    error = error || {};
    var title = 'Server Communication Error';
    var messages = {
        offline: 'No internet connection is available. Connect to Wi-Fi or mobile data and try again.',
        dns: 'Your network could not find the server. Check your connection and try again.',
        connection: 'The connection to the server was interrupted. Check your connection and try again.',
        timeout: 'The server connection timed out. Please try again shortly.',
        tls: 'A secure connection to the server could not be established. Please try again later or contact support.',
        response: 'The server returned an empty or invalid response. Please try again shortly.'
    };
    var message = messages[error.reason] || 'Unable to communicate with the server. Please try again shortly.';
    if (error.type === 'network') title = 'Network Error';
    else if (error.type === 'authentication') {
        title = 'Login Error';
        message = 'The server\'s sign-in confirmation could not be verified. Please try again.';
    } else if (error.type === 'request') {
        title = 'Request Error';
        message = 'The request could not be completed. Please try again.';
    }
    var status = Number(error.httpStatus);
    if (error.reason === 'http' && status >= 100 && status <= 599) {
        message = 'The server could not complete the request (HTTP ' + status + '). Please try again shortly.';
    }
    if (typeof myApp !== 'undefined' && myApp.alert) myApp.alert(message, title);
    else alert1(title + '\n' + message);
}




// Every page that loads this file gets the app's loading animation
// (EFSE_Js/app_loader.js), so loading() below never falls back to the
// progress line at the top of the screen.
if (typeof AppLoader === 'undefined' && document.readyState === 'loading') {
    document.write('<link href="css/app_loader.css" rel="stylesheet" /><script src="EFSE_Js/app_loader.js"><\/script>');
}
// Likewise the top bar's line icons (css/topbar_icons.css).
// One set of corners for fields, buttons, cards and pop-ups (css/app_radius.css).
if (document.readyState === 'loading') document.write('<link href="css/topbar_icons.css" rel="stylesheet" /><link href="css/app_radius.css" rel="stylesheet" /><link href="css/side_menu.css" rel="stylesheet" /><link href="css/shared_listing.css" rel="stylesheet" /><script src="EFSE_Js/shared_listing.js"><\/script>');

var loading_timer;
function loading() {
    //  loading_hide();

    // Pages that carry the app's loading animation (EFSE_Js/app_loader.js)
    // show that, in a small tile, instead of the progress line at the top.
    if (typeof AppLoader !== 'undefined' && AppLoader.busy) { AppLoader.busy(); return; }

    var is_loading = $(".preloader-indicator-modal");
    if (is_loading.length == 0) {
        // Round spinner (showIndicator) removed — keep only the top progress bar.
        var container = $$('body');
        myApp.showProgressbar(container);
    }
}

function loading_hide() {
    if (typeof AppLoader !== 'undefined' && AppLoader.idle) AppLoader.idle();
    myApp.hideIndicator();
    myApp.hideProgressbar();
}

function loading1() {
    var is_loading = $(".preloader-indicator-modal");
    if (is_loading.length == 0) {
        myApp.showIndicator();
    }
}

// Index a native/server result once, keeping source order and the legacy ==
// ID matching (SQLite/server IDs can arrive as numbers or strings). Candidate
// buckets are narrowed before equality checks; unusual object IDs fall back.
function index_list_rows(rows, fields, page) {
    fields = Array.isArray(fields) ? fields : [fields];
    var config = page && window.AppShell && AppShell.settings();
    var fallback = !!page && !(config && config.enabled && config.pages[page] === true);
    var buckets = new Map(), ids = [], firstIndices = [];
    function values(index) { return fields.map(function (field) { return rows[index][field]; }); }
    function key(query) {
        var parts = query.map(function (value) {
            if (value == null) return 'null';
            var type = typeof value;
            if (type !== 'string' && type !== 'number' && type !== 'boolean') return null;
            return isNaN(Number(value)) ? 's:' + value : 'n:' + Number(value);
        });
        return parts.indexOf(null) < 0 ? JSON.stringify(parts) : null;
    }
    function matches(index, query) {
        return fields.every(function (field, i) { return rows[index][field] == query[i]; });
    }
    if (!fallback) rows.forEach(function (row, index) {
        var query = values(index), token = key(query);
        if (token === null) { fallback = true; return; }
        var bucket = buckets.get(token);
        if (!bucket) { bucket = { indices: [], first: [] }; buckets.set(token, bucket); }
        if (!bucket.first.some(function (i) { return matches(i, query); })) {
            bucket.first.push(index); firstIndices.push(index);
        }
        bucket.indices.push(index);
    });
    if (fallback) {
        firstIndices = [];
        rows.forEach(function (row, index) {
            var query = values(index);
            if (!firstIndices.some(function (i) { return matches(i, query); })) firstIndices.push(index);
        });
    }
    ids = firstIndices.map(function (index) { return fields.length === 1 ? rows[index][fields[0]] : values(index); });
    return { indexed: !fallback, ids: ids, firstIndices: firstIndices, indices: function (value) {
        var query = fields.length === 1 ? [value] : value;
        var token = key(query), bucket = buckets.get(token);
        var candidates = fallback || token === null ? rows.map(function (row, i) { return i; }) : bucket ? bucket.indices : [];
        return candidates.filter(function (index) { return matches(index, query); });
    } };
}

// Framework7 1.4 listens for key/change events, but mobile IMEs, paste and
// speech input can update the value with only an input event. Keep its native
// filter and existing server-search debounce; do not synthesize another input.
document.addEventListener('input', function (event) {
    var input = event.target;
    if (!input.matches || !input.matches('.searchbar-init input[type="search"]')) return;
    var form = input.closest('.searchbar-init');
    if (form.f7Searchbar) form.f7Searchbar.handleInput();
});

// A fast open/close can be coalesced into one paint, so F7's transitionEnd
// callback never runs. Let F7 perform its own cleanup after the transition's
// deadline; reopening cancels the fallback for the previous close.
(function () {
    var pending = new WeakMap();
    function cancel(event) {
        var popup = event.target;
        if (!popup.classList || !popup.classList.contains('popup')) return;
        clearTimeout(pending.get(popup)); pending.delete(popup);
    }
    document.addEventListener('open', cancel);
    document.addEventListener('closed', cancel);
    document.addEventListener('close', function (event) {
        var popup = event.target;
        if (!popup.classList || !popup.classList.contains('popup')) return;
        cancel(event);
        var style = getComputedStyle(popup);
        var durations = style.transitionDuration.split(',').map(parseFloat);
        var delays = style.transitionDelay.split(',').map(parseFloat);
        var seconds = Math.max.apply(Math, durations.map(function (value, i) { return value + delays[i % delays.length]; }));
        pending.set(popup, setTimeout(function () {
            pending.delete(popup);
            if (popup.isConnected && popup.classList.contains('modal-out') && !popup.classList.contains('modal-in')) {
                popup.dispatchEvent(new Event('transitionend', { bubbles: true }));
            }
        }, (isFinite(seconds) ? seconds * 1000 : 0) + 50));
    });
})();

function pre_init_F7() {
    try {
        //var F7_theme = JSON.parse(storage.getItem('F7_theme'));
        //document.body.className = F7_theme;

        //Create new script element and load a script into it
        var js = document.createElement("script");
        if (F7_device == 'android') {
            js.src = 'Framework7-1.4.2/kitchen-sink-material/js/kitchen-sink.js';
        }
        else {
            js.src = 'Framework7-1.4.2/kitchen-sink-ios/js/kitchen-sink.js';

            //custom css for ion only [FT-22052025]
            var link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = 'css/styles_low_ios.css';
            document.head.appendChild(link);
        }
        if (window.AppPhase1 && AppPhase1.enabled('lazyScripts')) {
            js.src = 'js/framework7_app.js';
        }
        document.body.appendChild(js);
        //get_internet_status_F7();
        $('#lblusername').html(username);

        check_and_init_F7_theme();
    }
    catch (e) {
        //alert1(e + '_init_main()');
    }
}

function check_and_init_F7_theme() {
    $('.old-view').empty();
    $('.F7-view').show();
    //window.alert = function (str) {
    //    myApp.alert1(str, "Easy Form");
    //};
    //window.confirm = function (str) {
    //    myApp.confirm(str, "Easy Form", function () {
    //    });
    //};

    //window.confirm = function (str) {
    //    myApp.confirm('Are you ready to begin?', 
    //    function () {
    //      //  myApp.alert1('You clicked Ok button!!!');
    //        return true;
    //    }
    //    );
    //};

    //window.confirm = function (str) {
    //    myApp.confirm(str, 'Easy Form', function () { return true; }, function () { return false; });
    //};

    //window.alert = function (str) {
    //    myApp.addNotification({
    //        message: str
    //    });
    //};
}

function back_button(page) {
    beforeload = (new Date()).getTime();

    $(".div-delete-filter").hide();
    // show loading on every back press
    //if (page != 'selection') {
    //    loading();
    //}

    var popups = $('.photo-browser-popup.modal-in:visible');
    var cmnt_popup = $('.popup-control-comment.modal-in:visible');
    var search_listview_popup = $('.popup-type20.modal-in:visible');
    var inv_popup = $('.popup-type22.modal-in:visible');
    var notification_popup = $('.popup-notifications.modal-in:visible');
    var task_create_popup = $('.popup-new-task-create.modal-in:visible');
    var pinch_zoom_popup = $('.pinch-zoom-container:visible');
    var safety_passport_popup = $('.popup-safety-passport:visible');
    var profile_popup = $('.popup-profile.modal-in:visible');
    var privacy_popup = $('.popup-privacy-policy.modal-in:visible');

    if (popups.length > 0) {
        // Let Framework7 finish animated cleanup and release the photo browser.
        var photoTransition = parseFloat(window.getComputedStyle(popups[0]).transitionDuration) > 0;
        myApp.closeModal('.photo-browser-popup.modal-in');
        if (!photoTransition) popups.hide();
        return false;
    }
    else if (privacy_popup.length > 0) {
        close_info_popup('.popup-privacy-policy');
        return false;
    }
    else if (cmnt_popup.length > 0) {
        // comment popup is open
        myApp.closeModal('.popup-control-comment.modal-in');
        $('.popup-control-comment').hide();
        return false;
    }
    else if (search_listview_popup.length > 0) {
        // searchable listview popup is open
        popup_items_hide_type20();
        return false;
    }
    else if ($('.popup-type20-dropdown:visible').length > 0 && typeof close_type20_dropdown_popup === 'function') {
        // searchable dropdown is open: back closes it, and only it
        loading_hide();
        close_type20_dropdown_popup();
        return false;
    }
    else if (inv_popup.length > 0) {
        // invoice popup is open
        popup_items_hide_type22();
        return false;
    }
    else if (typeof TripListSheet !== 'undefined' && TripListSheet.isOpen && TripListSheet.isOpen()) {
        TripListSheet.close();
        return false;
    }
    else if (notification_popup.length > 0) {
        // notification popup is open
        myApp.closeModal('.popup-notifications.modal-in');
        $('.popup-notifications').hide();
        return false;
    }
    else if (task_create_popup.length > 0) {
        // task create popup is open
        myApp.closeModal('.popup-new-task-create.modal-in');
        $('.popup-new-task-create').hide();
        return false;
    }
    else if (pinch_zoom_popup.length > 0) {
        // pinch zoom popup is open
        close_zoom();
        return false;
    }
    else if (safety_passport_popup.length > 0) {
        // safety passport popup is open
        close_info_popup('.popup-safety-passport');
        return false;
    }
    else if (profile_popup.length > 0) {
        close_my_profile();
        return false;
    }
    else {
        var side_panel = $('.panel-left.active:visible');
        if (side_panel.length > 0) {
            // left profile slider is open
            myApp.closePanel();
            return false;
        }
    }

    var flow_Array = JSON.parse(storage.getItem('flow_Array'));
    if (flow_Array == "" || flow_Array == null || flow_Array == undefined) {
        flow_Array = [];
    }
    var id_Array = JSON.parse(storage.getItem('id_Array'));
    if (id_Array == "" || id_Array == null || id_Array == undefined) {
        id_Array = [];
    }
    if (id_Array.length > 0 || flow_Array.length > 0) {
        loading();
    }

    if (page == 'selection') {
        if (id_Array.length == 0) {
            var cust_flow_Array = JSON.parse(storage.getItem('cust_flow_Array'));
            if (cust_flow_Array == '' || cust_flow_Array == null || cust_flow_Array == undefined) {
                cust_flow_Array = [];
            }

            if (cust_flow_Array.length > 0) {
                // for site wise multiflow listing
                var id = cust_flow_Array[0].id;
                var wayflow = cust_flow_Array[0].wayflow;
                var wayflow_name = cust_flow_Array[0].wayflow_name;
                var list_json = cust_flow_Array[0].list_json;

                storage.setItem('udf_id', JSON.stringify(id));
                storage.setItem('wayflow', JSON.stringify(wayflow));
                storage.setItem('wayflow_name', JSON.stringify(wayflow_name));
                storage.setItem('list_json', JSON.stringify(list_json));
                changeurl("viewcustomerlist_on.html", 'back');
            }
            else {

                let report_div_display = $('#div_vertical_dashboard').is(':visible');
                if (report_div_display == true) {
                    home_tab_click();
                }
                else {
                    loading_hide();

                    exit_app();
                    //changeurl("selection.html");

                    //if (F7_device == 'ios') {
                    //    var user_choice = true;
                    //}
                    //else {
                    //    var user_choice = confirm("You are redirecting to login page. Are you sure, you want to logout?");
                    //}
                    //if (user_choice == true) {
                    //    changeurl("Login.html");
                    //}
                }
            }

        } else {
            storage.setItem('curr_btn_mode', JSON.stringify("back"));
            id_Array.pop();
            storage.setItem('id_Array', JSON.stringify(id_Array));

            var level_Array = JSON.parse(storage.getItem('level_Array'));
            level_Array.pop();
            storage.setItem('level_Array', JSON.stringify(level_Array));
            if (level_Array.length > 0) {
                var module_bottom_image = level_Array[level_Array.length - 1].module_bottom_image;
            }
            else {
                var module_bottom_image = 'false';
            }
            localStorage.setItem('module_bottom_image', module_bottom_image);
            get_data_from_ufm();
            //get_list_of_modules();
        }
    }
    else if (page == 'selection_survey') {

        loading_hide();
        var type20_searchbar_popup = $('.popup-type20-dropdown:visible');
        var adv_filter_popup = $('.popup-advance-search-online:visible');
        if (type20_searchbar_popup.length > 0) {
            myApp.closeModal('.popup-type20-dropdown');
            $('.popup-type20-dropdown').hide();
        }
        else if (adv_filter_popup.length > 0) {
            myApp.closeModal('.popup-advance-search-online');
            $('.popup-advance-search-online').hide();
        }
        else {
            $("#btn_Submit").attr('disabled', 'disabled');
            var level_Array = JSON.parse(storage.getItem('level_Array'));
            level_Array.pop();
            storage.setItem('level_Array', JSON.stringify(level_Array));

            var flow_Array = JSON.parse(storage.getItem('flow_Array'));
            var columnwise_search_bar_dis = $('.columnwise-head-search').css('display');
            var search_bar_dis = $('.head-search').css('display');
            if (search_bar_dis != "none") {
                $('.head-search').hide();
                $('.head-title').show();
                $('.head-menu').show();
                var loc_flow_update = JSON.parse(storage.getItem('loc_flow_update'));
                if (flow_Array.length > 1 && loc_flow_update == "false") {
                    $("#btn_Submit").show();
                }
                if (F7_device == 'android') {
                    $('.tabbar').slideDown(100);
                    //$('#tab1').css('padding-top', '104px');
                    //$('#tab2').css('padding-top', '104px');
                    //$('#tab3').css('padding-top', '104px');
                }
                loading_hide();
            }
            else if (columnwise_search_bar_dis != "none") {
                $("#txt_maintask_search").val("");
                $('.columnwise-head-search').hide();
                $('.head-title').show();
                $('.head-menu').show();
                var loc_flow_update = JSON.parse(storage.getItem('loc_flow_update'));
                if (flow_Array.length > 1 && loc_flow_update == "false") {
                    $("#btn_Submit").show();
                }
                if (F7_device == 'android') {
                    $('.tabbar').slideDown(100);
                }
                loading_hide();
            }
            else {
                var wayflow = flow_Array[flow_Array.length - 1].wayflow;
                var wayflow_name = flow_Array[flow_Array.length - 1].wayflow_name;
                var list_json = flow_Array[flow_Array.length - 1].list_json;
                storage.setItem('wayflow', JSON.stringify(wayflow));
                storage.setItem('wayflow_name', JSON.stringify(wayflow_name));
                storage.setItem('list_json', JSON.stringify(list_json));

                if (flow_Array.length == 1) {
                    storage.setItem('curr_btn_mode', JSON.stringify("back"));

                    //var module_list_cnt = localStorage.getItem('last_modulelist_count');
                    //if (module_list_cnt == 1) {
                    //    localStorage.setItem('redirect_on_module', 'true');
                    //    //check_for_notification();
                    //    back_button('selection');
                    //}
                    //else {
                    go_home_top();
                    //}
                }
                else {
                    flow_Array.pop();
                    var index = flow_Array.length - 1;
                    var id = flow_Array[index].id;
                    var flow_id = flow_Array[index].wayflow;
                    var flow_name = flow_Array[index].wayflow_name;
                    var list_json = flow_Array[index].list_json;
                    storage.setItem('udf_id', JSON.stringify(id));
                    storage.setItem('wayflow', JSON.stringify(flow_id));
                    storage.setItem('wayflow_name', JSON.stringify(flow_name));

                    // multitab handling
                    var tab_index = flow_Array[index].tab_index;
                    storage.setItem('tab_index', JSON.stringify(tab_index));

                    // reset task checksheet on sub flow back
                    var task_checksheetid = flow_Array[index].task_checksheetid;
                    storage.setItem('check_type_task', JSON.stringify(task_checksheetid));

                    list_json = JSON.parse(list_json);
                    var f_list_data = JSON.stringify(list_json[tab_index]);
                    storage.setItem('list_json', JSON.stringify("[" + f_list_data + "]"));

                    // new change
                    var data_count = flow_Array[index].list_json;
                    storage.setItem('list_json_Array', JSON.stringify(data_count));

                    storage.setItem('flow_Array', JSON.stringify(flow_Array));
                    //changeurl("viewsitelist_pm_grouplist.html");
                    storage.setItem('curr_btn_mode', JSON.stringify("back"));
                    //check_child_flow_for_parent();                          //backward skip for single subflow checksheet

                    var selected_tid = flow_Array[index].tid;                           //changes for ATC group task [14072021]
                    var selected_site = flow_Array[index].siteid;
                    storage.setItem('tid', JSON.stringify(selected_tid));
                    storage.setItem('siteid', JSON.stringify(selected_site));

                    if (flow_Array.length == 2) {
                        //back from 3rd level task listing [FT-14052025]
                        changeurl("selection_survey.html", 'back');
                    }
                    else {
                        var redirect = list_json[index].redirect;
                        if (redirect == 'customer') {
                            // Insolare, VIU
                            changeurl("viewcustomerlist_on.html", 'back');
                        }
                        else {
                            //var chksheet_displaying = localStorage.getItem('last_subflow_count_' + flow_id);
                            var chksheet_displaying = get_common_localStorage('last_subflow_count');
                            if (chksheet_displaying == 1) {
                                back_button('viewsitelist_pm_grouplist');
                            }
                            else {
                                changeurl("viewsitelist_pm_grouplist.html", 'back');
                                //check_child_flow_for_parent();                          //backward skip for single subflow
                            }
                        }
                    }
                }
            }
        }
    }
    else if (page == 'viewcustomerlist_on') {
        var search_bar_dis = $('.head-search').css('display');
        if (search_bar_dis != "none" && F7_view == 'true') {
            $('.head-search').hide();
            $('.head-title').show();
            $('.head-menu').show();
            if (F7_device == 'android') {
                $('.tabbar').slideDown(100);
                //$('#tab1').css('padding-top', '104px');
                //$('#tab2').css('padding-top', '104px');
                //$('#tab3').css('padding-top', '104px');
            }
            loading_hide();
        }
        else {
            // sitewise module listing change
            storage.setItem('flow_Array', JSON.stringify(''));
            storage.setItem('cust_flow_Array', JSON.stringify(''));
            ///
            localStorage.setItem('redirect_on_module', 'false');
            go_home_top();
        }
    }
    else if (page == 'viewsitedata') {
        loading_hide();
        var popups = $('.photo-browser-popup:visible');
        var popups_control = $('.popup:visible');
        if (popups.length > 0) {
            loading_hide();
            myApp.closeModal('.photo-browser-popup');
            $('.photo-browser-popup').hide();
        }
        //else if (popups_control.length > 0) {
        //    loading_hide();
        //}
        else {
            var user_choice = true;
            if (form_has_changed == "true") {
                //vibrate_device();
                //user_choice = confirm("Discard unsaved changes?");

                var company_id = JSON.parse(storage.getItem('company_id'));
                if (company_id == 157) {
                    // No Autosave functionality for ATC - mk - 10072025
                    btnNAS_counter = 1;
                }

                if (btnNAS_counter == 0) {
                    // auto save log
                    auto_savelog();
                }
                else {
                    // found no auto save button
                    user_choice = confirm("Discard unsaved changes?");
                    if (user_choice == false) {
                        loading_hide();
                    }
                    else {
                        // Explicitly confirmed discard also removes the encrypted draft.
                        if (window.AppFormDrafts) AppFormDrafts.discard();
                        viewlist_checklist('back');
                    }
                }
            }
            else {
                // no auto save log
                viewlist_checklist('back');
            }
        }
    }
    else if (page == 'viewsitelist_pm_grouplist') {
        var flow_Array = JSON.parse(storage.getItem('flow_Array'));
        if (flow_Array.length == 1) {
            changeurl("selection_survey.html", 'back');
            localStorage.setItem('is_subflow', 'false');
            set_common_localStorage('redirect_on_checksheet', 'true');
        } else {
            var selected_tid = flow_Array[flow_Array.length - 2].tid;
            var selected_site = flow_Array[flow_Array.length - 2].siteid;
            var selected_start_status = flow_Array[flow_Array.length - 2].start_status;
            //var selected_end_status = flow_Array[flow_Array.length - 2].end_status;
            storage.setItem('tid', JSON.stringify(selected_tid));
            storage.setItem('siteid', JSON.stringify(selected_site));
            storage.setItem('start_status', JSON.stringify(selected_start_status));
            //storage.setItem('end_status', JSON.stringify(selected_end_status));

            var type = flow_Array[flow_Array.length - 1].type;
            if (type == 'Module' || type == 'Flow' || type == 'MultiFlow') {
                changeurl("selection_survey.html", 'back');
            } else {
                // group
                flow_Array.pop();
                var id = flow_Array[0].id;
                var flow_id = flow_Array[0].wayflow;
                var flow_name = flow_Array[0].wayflow_name;
                var list_json = flow_Array[0].list_json;
                storage.setItem('udf_id', JSON.stringify(id));
                storage.setItem('wayflow', JSON.stringify(flow_id));
                storage.setItem('wayflow_name', JSON.stringify(flow_name));

                // multitab handling
                var tab_index = flow_Array[0].tab_index;
                list_json = JSON.parse(list_json);
                var f_list_data = JSON.stringify(list_json[tab_index]);
                storage.setItem('list_json', JSON.stringify("[" + f_list_data + "]"));

                // new change
                var data_count = flow_Array[0].list_json;
                storage.setItem('list_json_Array', JSON.stringify(data_count));

                storage.setItem('flow_Array', JSON.stringify(flow_Array));
                storage.setItem('curr_btn_mode', JSON.stringify(""));
                changeurl("viewsitelist_pm_grouplist.html", 'back');
            }
        }
    }
    else if (page == 'change_password') {
        var change_pwd_flag = localStorage.getItem('change_pwd_flag');
        if (change_pwd_flag == "login") {
            changeurl("Login.html", 'back');
        }
        else {
            go_home_top();
        }
    }
    else if (page == 'forgot_password') {
        changeurl("Login.html", 'back');
    }
    else if (page == 'pending_status') {
        var flag = JSON.parse(storage.getItem('pending_status_page'));
        if (flag == '1') {
            storage.setItem('pending_status_page', JSON.stringify('0'));
            changeurl("selection_survey.html", 'back');
        } else {
            storage.setItem('pending_status_page', JSON.stringify('0'));
            changeurl("Login.html", 'back');
        }
    }
    else if (page == 'support_page' || page == 'feature_filter' || page == 'feature_chart' || page == 'EF_Custome_Reports') {
        go_home_top();
    }
    else if (page == 'upload_pending_test') {
        changeurl("selection_survey.html", 'back');
    }
    else if (page == 'viewsitedata_task') {
        loading_hide();
        var popups = $('.photo-browser-popup:visible');
        var popups_control = $('.popup:visible');
        if (popups.length > 0) {
            loading_hide();
            myApp.closeModal('.photo-browser-popup');
            $('.photo-browser-popup').hide();
        }
        //else if (popups_control.length > 0) {
        //    loading_hide();
        //}
        else {
            var user_choice = true;
            if (form_has_changed == "true") {
                if (F7_device == 'ios') {
                    user_choice = true;
                }
                else {
                    vibrate_device();
                    user_choice = confirm("Discard unsaved changes?");
                }
            }
            if (user_choice == true) {
                if (form_has_changed == 'true' && window.AppFormDrafts) AppFormDrafts.discard();
                var data_json = JSON.parse(storage.getItem('list_json'));
                if (data_json == "" || data_json == null || data_json == undefined) {
                    // in case fill attendance directly from module listing add attendance button
                    go_home_top();
                    return false;
                }

                var list_data = JSON.parse(data_json);
                var redirect = list_data[0].redirect;
                if (redirect == 'customer') {
                    changeurl("viewcustomerlist_on.html", 'back');
                } else {
                    storage.setItem('curr_btn_mode', JSON.stringify("back"));

                    var flow_Array = JSON.parse(storage.getItem('flow_Array'));
                    if (flow_Array == "" || flow_Array == null || flow_Array == undefined) {
                        // start trip from module listing >> task form open > press back button
                        go_home_top();
                    }
                    else {
                        if (flow_Array.length == 1) {
                            localStorage.setItem('is_subflow', 'false');
                        } else {
                            //when press back from sub task creation form [haresh1.vt - 20052021]
                            var selected_tid = flow_Array[flow_Array.length - 2].tid;
                            var selected_site = flow_Array[flow_Array.length - 2].siteid;
                            var selected_start_status = flow_Array[flow_Array.length - 2].start_status;
                            storage.setItem('tid', JSON.stringify(selected_tid));
                            storage.setItem('siteid', JSON.stringify(selected_site));
                            storage.setItem('start_status', JSON.stringify(selected_start_status));
                        }
                        changeurl("selection_survey.html", 'back');
                    }


                }
            }
        }
    }
    else if (page == 'change_password') {
        go_home_top();
    }
    else if (page == 'signup') {
        changeurl("Login.html", 'back');
    }
    else if (page == 'EF_User_List') {
        var zoom_popup = $('.zoom-img');
        if (zoom_popup.length > 0) {
            $(".zoom-bg, .zoom-img").remove();
            $("img.zoomable").removeClass("zoom-original--hidden");
        }
        else {
            var urlParams = new URLSearchParams(window.location.search);
            var is_approval = urlParams.get('is_approval');
            if (is_approval == "1") {
                var curr_page_name = localStorage.getItem('curr_html_page');
                if (curr_page_name == "" || curr_page_name == null || curr_page_name == undefined) {
                    curr_page_name = "selection.html";
                }
                changeurl(curr_page_name, 'back');
            }
            else {
                go_home_top();
            }
        }
    }
    //else if (page == 'selection') {
    //}
    //else if (page == 'selection') {
    //}
}

function viewlist_checklist(direction) {
    if (enable_popup == 1) {
        //popup is enable
        clearTimeout(network_collapse_timer);
        $("#popup_inner_div_network_retry").removeClass("vibrate_stop");
        network_collapse_timer = setTimeout(function () {
            $("#popup_inner_div_network_retry").addClass("vibrate_stop");
        }, 500);
    } else {
        var is_shortcutbutton = localStorage.getItem('is_shortcutbutton');
        if (is_shortcutbutton == 'true') {
            // back from shortcutbutton checksheet
            localStorage.setItem('is_shortcutbutton', 'false');
            back_button('viewsitelist_pm_grouplist');
        }
        else {
            //popup is disable
            //var chksheet_displaying = localStorage.getItem('last_checklist_count_' + wayflow);
            var chksheet_displaying = get_common_localStorage('last_checklist_count');
            if (enable_back == 1) {
                //back button enable
                if (step_Array.length == 1) {
                    //changeurl("viewsitelist_pm_grouplist.html");
                    storage.setItem('curr_btn_mode', JSON.stringify("back"));

                    if (chksheet_displaying == 1) {
                        back_button('viewsitelist_pm_grouplist');
                    }
                    else {
                        changeurl("viewsitelist_pm_grouplist.html", direction);
                        //check_child_flow_for_parent();                          //backward skip for single checksheet
                    }
                } else if (step_Array.length > 1) {
                    //alert1("getting previous step...");
                    back_on_click();
                }
                else {
                    // rare case back issue - mk - 15072025
                    storage.setItem('curr_btn_mode', JSON.stringify("back"));
                    changeurl("viewsitelist_pm_grouplist.html", direction);
                }
            } else {
                //back button disable
                //changeurl("viewsitelist_pm_grouplist.html");
                storage.setItem('curr_btn_mode', JSON.stringify("back"));

                if (chksheet_displaying == 1) {
                    back_button('viewsitelist_pm_grouplist');
                }
                else {
                    changeurl("viewsitelist_pm_grouplist.html", direction);
                    //check_child_flow_for_parent();                          //backward skip for single checksheet
                }
            }
        }
    }
}


function enable_back_button() {
    page_load_over = 1;
    $('#btn_page_back').css({ 'pointer-events': 'initial', 'visibility': 'visible' });
}

function disable_back_button() {
    page_load_over = 0;
    $('#btn_page_back').css({ 'pointer-events': 'none', 'visibility': 'hidden' });
}

// My Profile Start
function close_my_profile() {
    myApp.closeModal('.popup-profile');
    $('.popup-profile').hide();
}

function get_my_profile_details_F7() {
    $('#chartContainer').empty();
    bind_profile_pull();
    // Last known position and address at once; the device's current reading
    // replaces them a moment later in the same place.
    if (!$('#lbl_pro_latlong').text()) {
        try {
            var last_loc = JSON.parse(localStorage.getItem('profile_last_location')) || {};
            if (last_loc.latlong) $('#lbl_pro_latlong').text(last_loc.latlong);
            if (last_loc.address) $('#pro_address').text(last_loc.address);
        } catch (err) { }
    }
    // Until the details arrive, the popup shows grey placeholders where they
    // will sit, so nothing moves when they fill in (css/styles_low.css).
    // Profile details rarely change: show the last saved copy at once and let
    // the server refresh it. Only a first-ever open shows placeholders.
    // Redrawn from the saved copy on every open, so an edit made on the
    // profile update screen shows at once.
    {
        var saved = null;
        try { saved = JSON.parse(localStorage.getItem('profile_user_data')); } catch (err) { }
        if (saved && saved.length) {
            try { render_profile_user_data(saved); } catch (err) { set_profile_loading(true); }
        } else {
            set_profile_loading(true);
        }
    }
    myApp.popup('.popup-profile');

    $('.popup-profile .media-list').show();
    //$('#iframe_update_profile').hide();

    // The details come straight from the device. (They used to wait for a
    // chart script from canvasjs.com that the profile no longer draws, which
    // left the profile empty with a slow or no connection.)
    var company_id = JSON.parse(storage.getItem('company_id'));
    setTimeout(function () {
        cordova.exec(onsuccess_get_my_profile_details_F7, onfail_get_my_profile_details_F7, 'maulik', 'nck', ["ds"]);
    }, company_id == '157' ? 300 : 0);
}

var profile_loading_timer;
function set_profile_loading(on) {
    clearTimeout(profile_loading_timer);
    $('.popup-profile').toggleClass('is-loading', on);
    // Never leave placeholders up if a request never answers.
    if (on) profile_loading_timer = setTimeout(function () { set_profile_loading(false); }, 15000);
    else profile_pull_done();
}

// Pull down on the profile to fetch it again. A small handler of its own:
// Home's pull-to-refresh code binds to every .pull-to-refresh-content, so the
// profile does not use that class.
var profile_pull = { y0: null, dist: 0, busy: false };
function profile_pull_indicator() {
    var content = document.querySelector('.popup-profile .profile-content');
    if (!content) return null;
    var el = content.querySelector('.profile-pull');
    if (!el) {
        el = document.createElement('div');
        el.className = 'profile-pull';
        el.innerHTML = '<span class="profile-pull-ring"></span>';
        content.insertBefore(el, content.firstChild);
    }
    return el;
}
function profile_pull_done() {
    if (!profile_pull.busy) return;
    profile_pull.busy = false;
    var el = profile_pull_indicator();
    if (el) { el.classList.remove('is-busy'); el.style.height = '0px'; }
}
// Bound when the profile first opens: this file loads before jQuery.
function bind_profile_pull() {
    if (profile_pull.bound) return;
    profile_pull.bound = true;
    $(document).on('touchstart', '.popup-profile .profile-content', function (e) {
        if (profile_pull.busy || this.scrollTop > 0) { profile_pull.y0 = null; return; }
        profile_pull.y0 = e.originalEvent.touches[0].clientY;
        profile_pull.dist = 0;
    });
    $(document).on('touchmove', '.popup-profile .profile-content', function (e) {
        if (profile_pull.y0 === null) return;
        var d = e.originalEvent.touches[0].clientY - profile_pull.y0;
        if (d <= 0 || this.scrollTop > 0) { profile_pull.dist = 0; return; }
        profile_pull.dist = Math.min(d * 0.5, 72);
        var el = profile_pull_indicator();
        if (!el) return;
        el.style.transition = 'none';
        el.style.height = profile_pull.dist + 'px';
        el.querySelector('.profile-pull-ring').style.transform = 'rotate(' + (profile_pull.dist * 5) + 'deg)';
        el.classList.toggle('is-ready', profile_pull.dist >= 56);
    });
    $(document).on('touchend touchcancel', '.popup-profile .profile-content', function () {
        if (profile_pull.y0 === null) return;
        profile_pull.y0 = null;
        var el = profile_pull_indicator();
        if (!el) return;
        el.style.transition = '';
        el.classList.remove('is-ready');
        if (profile_pull.dist >= 56) {
            profile_pull.busy = true;
            el.classList.add('is-busy');
            el.style.height = '48px';
            refresh_my_profile();
        } else {
            el.style.height = '0px';
        }
        profile_pull.dist = 0;
    });
}
function refresh_my_profile() {
    clearTimeout(profile_loading_timer);
    profile_loading_timer = setTimeout(function () { set_profile_loading(false); }, 15000);
    cordova.exec(onsuccess_get_my_profile_details_F7, onfail_get_my_profile_details_F7, 'maulik', 'nck', ["ds"]);
}

function onsuccess_get_my_profile_details_F7(e) {
    try {
        var myArray = JSON.parse(e);
        if (myArray[0].gps == "" || myArray[0].gps == undefined || myArray[0].gps == null) {
            var gps = "0";
        } else {
            var gps = myArray[0].gps;
        }
        if (myArray[0].accuracy == "" || myArray[0].accuracy == undefined || myArray[0].accuracy == null) {
            var accuracy = "0";
        } else {
            var accuracy = myArray[0].accuracy;
        }
        if (myArray[0].address == "" || myArray[0].address == undefined || myArray[0].address == null || myArray[0].address == "NA") {
            var address = "";
        } else {
            var address = myArray[0].address;
        }
        if (myArray[0].lat == "" || myArray[0].lat == undefined || myArray[0].lat == null) {
            var lat = "0";
        } else {
            var lat = myArray[0].lat;
        }
        if (myArray[0].lon == "" || myArray[0].lon == undefined || myArray[0].lon == null) {
            var long = "0";
        } else {
            var long = myArray[0].lon;
        }
        if (myArray[0].imei == "" || myArray[0].imei == undefined || myArray[0].imei == null) {
            var imei_no = imeino;
        } else {
            var imei_no = myArray[0].imei;
        }

        //if (F7_device == 'android') {
        //    var user_lat_long_str = lat + " | " + long;
        //}
        //else {
        var user_lat_long_str = lat + ", " + long;
        //}

        $("#lbl_pro_latlong").html(user_lat_long_str);
        // Keep the last street address on screen until the new one arrives.
        if (address) $("#pro_address").html(address);
        /*$("#pro_imei").html('<b>IMEI:</b> ' + imei_no);*/

        // The street address is looked up only when the position has moved
        // about 100 m from where the saved address was found (or on
        // pull-down). Meanwhile its line keeps a placeholder so nothing jumps.
        var saved_loc = {};
        try { saved_loc = JSON.parse(localStorage.getItem('profile_last_location')) || {}; } catch (err) { }
        var moved_m = profile_distance_m(saved_loc.lat, saved_loc.lng, lat, long);
        if (saved_loc.address && moved_m < 100 && !profile_pull.busy) {
            $("#pro_address").html(saved_loc.address);
            profile_save_location(lat, long);
        } else {
        $("#pro_address").addClass('addr-pending');
        var request = $.get({
            url: global_wcf_url + `LocationApi/aws/${lat}/${long}`, success(data) {
                let address = data.display_name;
                let area = address.split(',')[0];
                $("#pro_address").html(address);
                profile_save_location(lat, long);
            }
        }).always(function () { $("#pro_address").removeClass('addr-pending'); });
        }

        var gprs = myArray[0].gprs;
        var gps = myArray[0].gps;
        if (gprs == "1") {
            $("#pro_img_gprs").css("color", "lightgreen");
        } else {
            $("#pro_img_gprs").css("color", "gray");
        }

        //if (gps == "1") {
        //    $("#pro_img_gps").css("color", "lightgreen");
        //} else {
        //    $("#pro_img_gps").css("color", "gray");
        //}

        //var company_id = JSON.parse(storage.getItem('company_id'));
        //if (company_id != '157') {
        //    get_user_flow_sublflow_names();
        //}

        // Profile details rarely change: the saved copy (already on screen) is
        // fetched again once a day, or on pull-down.
        var saved_at = Number(localStorage.getItem('profile_user_data_at')) || 0;
        var have_saved = !!localStorage.getItem('profile_user_data') && $('#profile_user_detail').children().length;
        if (!have_saved || profile_pull.busy || Date.now() - saved_at > 24 * 60 * 60 * 1000) {
            get_user_data_online();
        } else {
            set_profile_loading(false);
        }

        create_table_by_device_info();

    }
    catch (e) {
        //alert1(e + '_onsuccess_get_my_profile_details_F7');
    }
}

//////////////----profile user detail tbl start-----/////////////////
function get_user_data_online() {

    // No busy indicator when the saved profile is already on screen.
    if (!$('#profile_user_detail').children().length) loading();

    let user_id = JSON.parse(storage.getItem('user_id'));
    let company_id = JSON.parse(storage.getItem('company_id'));

    var Param_obj = [];
    Param_obj.push({
        'User_Id': user_id,
        'Company_id': company_id,
    });

    var getdata1 = new Webservicecall_REST(global_wcf_url + 'User_Data', JSON.stringify(Param_obj), function (e) {
        var Search_data = e.responseText;
        Search_data = eval('(' + Search_data + ')');
        var message = Search_data[0].message;
        var status = Search_data[0].status;
        if (status == 1) {
            message = message.replace('[[', '[');
            message = message.replace(']]', ']');
            message = eval('(' + Search_data[0].data + ')');
            var user_data = message;

            localStorage.setItem('profile_user_data', JSON.stringify(user_data));
            localStorage.setItem('profile_user_data_at', String(Date.now()));
        }
        else {
            var user_data = localStorage.getItem('profile_user_data');
            user_data = JSON.parse(user_data);
        }
        loading_hide();

        if (user_data == "" || user_data == null || user_data == undefined) {
            set_profile_loading(false);
            alert("User data is not available!");
        }
        else {
            render_profile_user_data(user_data);
        }
    }, onfail_request);
    getdata1.callOtherDomain();
}

// Saves the position shown, and where its street address was looked up.
function profile_save_location(lat, lng) {
    try {
        localStorage.setItem('profile_last_location', JSON.stringify({
            latlong: $('#lbl_pro_latlong').text(), address: $('#pro_address').text(),
            lat: Number(lat), lng: Number(lng)
        }));
    } catch (err) { }
}

// Metres between two positions; Infinity when either is unknown.
function profile_distance_m(lat1, lng1, lat2, lng2) {
    lat1 = Number(lat1); lng1 = Number(lng1); lat2 = Number(lat2); lng2 = Number(lng2);
    if (!lat1 || !lng1 || !lat2 || !lng2) return Infinity;
    var r = Math.PI / 180, dLat = (lat2 - lat1) * r, dLng = (lng2 - lng1) * r;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
        + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function render_profile_user_data(user_data) {
    $("#title_user_profile").show();
    var prop = user_data[0].prop;
    if (prop == "" || prop == null || prop == undefined) {
        // 3 key json
        get_blank_checksheet_profile(user_data);
    }
    else {
        // full json
        build_user_table(user_data);
    }
}

function onfail_get_my_profile_details_F7(e) {
    set_profile_loading(false);
    get_my_task();
}

var Approvalflag = "NO";
function get_blank_checksheet_profile(user_data, safety_passport) {
    try {

        var company_id = JSON.parse(storage.getItem('company_id'));
        var user_id = JSON.parse(storage.getItem('user_id'));
        var selected_check_type = localStorage.getItem('profile_checksheetid');

        var param_obj = [];
        param_obj.push({
            'Company_Id': company_id,
            'User_Id': user_id,
            'checksheetid': selected_check_type,
            'step': 1,
            'trip_id': 0
        });

        // The profile form (its labels) rarely changes: kept for a day, or
        // until pull-down on the profile. The answers merged into it come
        // from user_data.
        var template_key = 'profile_template_' + company_id + '_' + selected_check_type;
        var template_at = Number(localStorage.getItem(template_key + '_at')) || 0;
        var template_saved = localStorage.getItem(template_key);
        if (template_saved && !profile_pull.busy && Date.now() - template_at < 24 * 60 * 60 * 1000) {
            show_profile_template(template_saved);
            return;
        }

        loading();
        var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_GetCheckSheetData_Port', JSON.stringify(param_obj), function (e) {
            try {
                if (JSON.parse(e.responseText)[0].status == 1) {
                    localStorage.setItem(template_key, e.responseText);
                    localStorage.setItem(template_key + '_at', String(Date.now()));
                }
            } catch (err) { }
            show_profile_template(e.responseText);
        }, onfail_request);
        getdata.callOtherDomain();
    }
    catch (e) {
        alert(e + '_get_blank_checksheet_profile()');
        loading_hide();
    }

    function show_profile_template(templateText) {
            var responseText = JSON.parse(templateText);
            var status = responseText[0].status;

            if (status == 1) {

                loading_hide();

                var myArray = JSON.parse(responseText[0].data);
                if (myArray.length > 0) {
                    var blank_data = JSON.parse(myArray[0].data);

                    Approvalflag = myArray[0].Approvalflag;
                    if (Approvalflag == "" || Approvalflag == null || Approvalflag == undefined) {
                        Approvalflag = "NO";
                    }

                    var data = user_data;
                    for (i = 0; i < blank_data.length; i++) {
                        var bl_que_id = blank_data[i].que_id;
                        var bl_type = blank_data[i].type;
                        for (j = 0; j < data.length; j++) {
                            var rs_que_id = data[j].que_id;
                            var rs_type = data[j].type;
                            if (rs_que_id == bl_que_id) {
                                //allow all type conversion - 26052022 (due to aadhar user update)
                                var rs_ans = data[j].ans;
                                blank_data[i].ans = rs_ans;

                                break;
                            }
                        }
                    }

                    if (safety_passport == "safety_passport") {
                        // safety passport card
                        build_user_safety_passport(blank_data);
                    }
                    else {
                        // My profile
                        build_user_table(blank_data);
                    }

                }
            }
            else {
                loading_hide();
                alert(responseText[0].message);
            }
    }
}

function build_user_table(user_data) {

    var detail_str = '';

    user_language = localStorage.getItem("user_language");
    if (user_language == "" || user_language == null || user_language == undefined) {
        user_language = "en";
    }

    var itemObj = new MKCheckItem();

    for (var i = 0; i < user_data.length; i++) {
        var type = user_data[i].type;
        var que_id = user_data[i].que_id;
        if (type == 0 || type == 5 || type == 10 || que_id == 5 || que_id == 10018 || que_id == 4008) { }
        else {
            var is_hide = user_data[i].prop[0].is_hide;
            if (is_hide != "true") {
                var header = user_data[i].prop[0].name;
                var value = user_data[i].ans[0];

                if (header == "Profile Photo" || header == "IMEI Number 2" || header == "Model" || header == "Handset Make" || header == "Operating System" || header == "OS Version if any") {
                    // don't show these controls in user info table
                    continue;
                }

                if (que_id == 3) {
                    // make username in small case in case of user created in Camel or Uppar case 16012023
                    value = value.toLowerCase();
                }

                if (value == "" || value == null || value == undefined) {
                    value = "";
                }
                else {
                    if (type == 22) {

                        var type22_table_str = "<table class='tbl-type22' border='0'>";

                        var row_final_json = user_data[i].ans[0];
                        if (row_final_json == "" || row_final_json == null || row_final_json == undefined || row_final_json == '""') {

                        }
                        else {
                            row_final_json = itemObj._checkStrObj(row_final_json);

                            var role_list_json = row_final_json[0].row_finaljson;
                            if (role_list_json.length > 0) {
                                var btn_json = role_list_json[0].json_type_22[0].edt_btn_json;

                                if (btn_json.length == 1) {
                                    // don't display header in case of single control/column
                                }
                                else {
                                    // display header in case of multiple controls/columns

                                    // header
                                    type22_table_str += "<tr>";
                                    for (e = 0; e < btn_json.length; e++) {
                                        var prop_obj = btn_json[e].prop;
                                        if (prop_obj == "" || prop_obj == null || prop_obj == undefined) {
                                            var txt_row = role_list_json[0].json_type_22[0].txt_row;
                                            var header = txt_row[e].row_name;
                                        }
                                        else {
                                            var header = btn_json[e].prop[0].name;
                                        }

                                        type22_table_str += "<th>" + header + "</th>";
                                    }
                                    type22_table_str += "</tr>";
                                }

                                for (var txtrow = 0; txtrow < role_list_json.length; txtrow++) {

                                    var btn_json = role_list_json[txtrow].json_type_22[0].edt_btn_json;

                                    // body
                                    type22_table_str += "<tr>";
                                    for (e = 0; e < btn_json.length; e++) {

                                        var type22_Type = btn_json[e].type;
                                        if (type22_Type == "6") {
                                            var type22_Ans = btn_json[e].ans;
                                            type22_table_str += "<td style='min-width: 50px'>" + type22_Ans + "</td>";
                                        }
                                        else if ((type22_Type == "7") || (type22_Type == "26") || (type22_Type == "28") || (type22_Type == "9")) {

                                            var type22_Ans = btn_json[e].ans;
                                            if (type22_Ans == "" || type22_Ans == null || type22_Ans == undefined || type22_Ans[0] == "" || type22_Ans[0] == null || type22_Ans[0] == undefined) {
                                                type22_table_str += "<td style='min-width: 50px'></td>";
                                            }
                                            else {
                                                // dynamic photo thumbnail by live url 25012021
                                                var type22_img_que_id = btn_json[e].que_id;
                                                var t_row_index_no = txtrow + 1;
                                                var user_id = window.localStorage.getItem("user_id");
                                                var uniqcode = JSON.parse(localStorage.getItem('uniqcode'));
                                                var random_str = "&random=" + new Date().getTime();

                                                //var img_Id = "" + global_resumable_url + "/api/GetFile/Select_File_Details?cid=" + check_type + "&t22id=" + que_id + "&t22i=" + t_row_index_no + "&id=" + primary_id + "&qd=" + type22_img_que_id + "&ctype=" + ctype + "&ud=" + user_id + "&uc=" + uniqcode + random_str + "";
                                                var img_Id = "" + global_resumable_url + "GetFile/Select_File_Details?cid=" + check_type + "&t22id=" + que_id + "&t22i=" + t_row_index_no + "&id=" + primary_id + "&qd=" + type22_img_que_id + "&ctype=" + ctype + "&ud=" + user_id + "&uc=" + uniqcode + random_str + "";

                                                var param_mouseover = 'get_zoom_img_onhover("' + img_Id + '", event)';
                                                var param_mouseout = 'remove_zoom_img_onout()';

                                                if (type22_Type == "7") {
                                                    type22_table_str += "<td><img class='img-thumb' id='img_thumb_type22_" + j + "' src=" + img_Id + " onmousemove='" + param_mouseover + "'  onmouseout='" + param_mouseout + "' style='width: 40px; height:40px' /></td>";
                                                }
                                                else if (type22_Type == "9") {
                                                    type22_table_str += "<td><img class='img-thumb' id='img_thumb_type22_" + j + "' src=" + img_Id + " onmousemove='" + param_mouseover + "'  onmouseout='" + param_mouseout + "' style='width: 40px; height:40px; border:1px solid #ccc' /></td>";
                                                }
                                                else if (type22_Type == "26") {
                                                    //type22_table_str += "<td style='vertical-align:middle'><a onclick='Open_popup_View(" + primary_id + "," + type_ + "," + que_id + ")'><i class='fa fa-file-text-o'></i></a></td>";

                                                    var param_doc = "window.open('" + img_Id + "')";
                                                    type22_table_str += '<td style="vertical-align:middle"><a class="btn" onclick="' + param_doc + '" title="View Document"><i class="fa fa-file-text-o"></i></a></td>';
                                                }
                                                else {
                                                    //type22_table_str += "<td style='vertical-align:middle'><a onclick='Open_popup_View(" + primary_id + "," + type_ + "," + que_id + ")'><i class='fa fa-file-video-o'></i></a></td>";

                                                    var param_video = "window.open('" + img_Id + "')";
                                                    type22_table_str += '<td style="vertical-align:middle"><a class="btn" onclick="' + param_video + '" title="View Video"><i class="fa fa-file-video-o"></i></a></td>';
                                                }
                                            }
                                        }
                                        else {
                                            var type22_Ans = btn_json[e].ans[0];
                                            type22_table_str += "<td style='min-width: 50px'>" + type22_Ans + "</td>";

                                        }
                                    }

                                    type22_table_str += "</tr>";
                                }
                            }
                        }

                        type22_table_str += "</table>";

                        value = type22_table_str;
                    }
                    else if (type == 1) {
                        var misc_Array = user_data[i].prop[0].misc_data;
                        var prop_value = misc_Array[0].value;
                        if (prop_value == '' || prop_value == null || prop_value == undefined) {
                            var box_type = "";
                        }
                        else {
                            prop_value = itemObj._checkStrObj(misc_Array[0].value);  // check_item
                            var box_type = prop_value[0].box_type;
                        }
                    }
                }

                if (type == 22) {
                    detail_str += '<tr><td style="widht: 50%;">' + header + '</td><td style="width: 50%">' + value + '</td></tr>';
                }
                else {
                    detail_str += '<tr><td style="widht: 50%;">' + header + '</td><td style="width: 50%">' + value + '</td></tr>';
                }
            }
        }
    }

    $("#profile_user_detail").empty();
    $("#profile_user_detail").html(detail_str);
    arrange_my_profile_rows();
    $('#btn_update_profile').show();
}


// Display labels only; keep server keys, identifiers and answers unchanged.
function profile_label(label) {
    var labels = {
        preferredlanguage: 'Preferred language', safetypassportid: 'Safety passport ID',
        username: 'Username', fullname: 'Full name', rolelist: 'Role list',
        circlemap: 'Circle map', vendorname: 'Vendor name',
        emergencycontactnumber: 'Emergency contact number', bloodgroup: 'Blood group',
        emailid: 'Email address', contactno: 'Contact number',
        locationcluster: 'Location / cluster', imeinumber: 'IMEI number',
        jobtitle: 'Job title', function: 'Function', smartphone: 'Smartphone',
        osversion: 'Android version', brand: 'Brand', model: 'Model',
        arcore: 'ARCore', accelerometer: 'Accelerometer', gyroscope: 'Gyroscope'
    };
    return labels[String(label).toLowerCase().replace(/[^a-z0-9]/g, '')] || label;
}

// Reuse the existing rendered values, including links and nested array tables.
function arrange_my_profile_rows() {
    var work = document.getElementById('profile_user_detail');
    var contact = document.getElementById('profile_contact_detail');
    if (!work || !contact) return;
    contact.innerHTML = '';
    var body = contact.createTBody();
    var device = document.getElementById('tbl_deviceInfo');
    $(device).find('tr.profile-user-device').remove();
    var deviceBody = device && (device.tBodies[0] || device.createTBody());
    $('#profile_full_name').empty();
    Array.from(work.rows).forEach(function (row) {
        if (row.cells.length !== 2) return;
        var label = row.cells[0].textContent.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        var value = row.cells[1].textContent.trim();
        row.cells[0].textContent = profile_label(row.cells[0].textContent.trim());
        if (label === 'smartphone' && /^(yes|no|true|false)$/i.test(value)) {
            row.cells[1].textContent = /^(yes|true)$/i.test(value) ? 'Yes' : 'No';
        }
        if (label === 'preferredlanguage') {
            row.remove();
        } else if (label === 'fullname' && value) {
            $('#profile_full_name').text(value);
            row.remove();
        } else if (label === 'username' && value === $('#lblusername_my').text().trim()) {
            row.remove();
        } else if (deviceBody && /^(imeinumber|smartphone)$/.test(label)) {
            row.classList.add('profile-user-device');
            deviceBody.appendChild(row);
        } else if (/contact|phone|mobile|email|blood|passport/.test(label)) {
            body.appendChild(row);
        }
    });
    var languageRow = body.insertRow();
    languageRow.insertCell().textContent = 'Preferred language';
    var languageCell = languageRow.insertCell();
    languageCell.id = 'pro_language';
    languageCell.textContent = languages[user_language] || languages.en;
    $('#profile_work_card').toggle(work.rows.length > 0);
    $('#profile_contact_card').toggle(contact.rows.length > 0);
    set_profile_loading(false);
}

update_profile = () => {
    $('.popup-profile .page').hide();
    //$('#iframe_update_profile').show();
    //$('#iframe_update_profile').attr('src', 'EF_User_List.html?is_approval=1');

    var curr_pageName = window.location.href;
    var index = curr_pageName.indexOf('www2/');
    index = index + 5;
    var curr_html_page = curr_pageName.substring(index);
    localStorage.setItem('curr_html_page', curr_html_page);
    window.location.href = 'EF_User_List.html?is_approval=1';
}

///--------

var profile_flow_Array = [];
function get_user_flow_sublflow_names() {
    var role_id_array = localStorage.getItem('role_id_array');
    var query = "SELECT id, flow_id,flow_name FROM User_Define_Flow_Master WHERE type='Flow' and rollid in (" + role_id_array + ") and (is_delete != 1 or is_delete IS NULL)";
    var q_jsonobj = [];
    q_jsonobj.push({
        data: query,
        p: "1"
    });
    cordova.exec(onsuccess_get_user_flow_sublflow_names, onfail_get_user_flow_sublflow_names, 'SqlitePlugin', 'showValues', q_jsonobj);
}

function onsuccess_get_user_flow_sublflow_names(e) {

    // for those task which does not have udf_id (tower_type in task_master)
    profile_flow_Array.push({ 'udf_id': 0, 'flow_id': 0, 'flow_name': 'Not Visited', 'task_count': 0 });

    var myArray1 = JSON.parse(e);
    for (j = 0; j < myArray1.length; j++) {
        var udf_id = myArray1[j].id;
        var flow_id = myArray1[j].flow_id;
        var flow_name = myArray1[j].flow_name;
        profile_flow_Array.push({ 'udf_id': udf_id, 'flow_id': flow_id, 'flow_name': flow_name, 'task_count': 0 });
    }
    //alert1(JSON.stringify(profile_flow_Array));

    get_my_offline_task();
}

function onfail_get_user_flow_sublflow_names(e) { }

function get_my_offline_task() {
    var query = "select count(*) as cnt, tower_type as udf_id, moduleid, module_name from task_master where username = '" + username + "' group by udf_id";
    var q_jsonobj = [];
    q_jsonobj.push({
        data: query,
        p: "1"
    });
    cordova.exec(onsuccess_get_my_offline_task, onfail_get_my_offline_task, 'SqlitePlugin', 'showValues', q_jsonobj);
}

function onsuccess_get_my_offline_task(e) {
    var myArray = JSON.parse(e);
    //alert1(JSON.stringify(myArray));
    for (i = 0; i < myArray.length; i++) {
        var cnt = parseInt(myArray[i].cnt);
        var udf_id = myArray[i].udf_id;
        if (udf_id == '' || udf_id == null || udf_id == undefined) {
            udf_id = 0;
        }
        for (f = 0; f < profile_flow_Array.length; f++) {
            if (udf_id == profile_flow_Array[f].udf_id) {
                profile_flow_Array[f].task_count = cnt;
                break;
            }
        }
    }

    //get_counter_for_online_flow_profile();
}

function onfail_get_my_offline_task(e) { }

function get_counter_for_online_flow_profile() {
    try {
        loading();
        var company_id = JSON.parse(storage.getItem('company_id'));
        var user_id = JSON.parse(storage.getItem('user_id'));
        var role_id = JSON.parse(storage.getItem('role_id'));

        var param_obj = [];
        param_obj.push({
            "company_id": company_id,
            "user_id": user_id,
            "user_lat": 0,
            "user_long": 0,
            "role_id": role_id
        });

        var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_OnlineTaskList_Native_Count', JSON.stringify(param_obj), onsuccess_get_counter_for_online_flow_profile, onfail_get_counter_for_online_flow_profile);
        getdata.callOtherDomain();
    }
    catch (e) {
        alert1(e);
    }
}

function onsuccess_get_counter_for_online_flow_profile(e) {
    try {
        var responseText = e.responseText;
        var myArray = JSON.parse(responseText);
        var status = myArray[0].status;
        if (status == 1) {

            var data = myArray[0].data;
            if (data == "" || data == null || data == undefined) {
                var message = myArray[0].message;
                message = JSON.parse(message);
            }
            else {
                var message = JSON.parse(data);
            }

            var dataPoints_Array = [];
            for (var i = 0; i < message.length; i++) {
                var udf_id = message[i].udf_id;
                var flow_id = message[i].flow_id;
                var task_count = message[i].task_count;
                var flow_label;
                for (f = 0; f < profile_flow_Array.length; f++) {
                    if (udf_id == profile_flow_Array[f].udf_id) {
                        flow_label = profile_flow_Array[f].flow_name;
                        task_count = task_count + profile_flow_Array[f].task_count;
                        break;
                    }
                }
                if (task_count != 0) {
                    dataPoints_Array.push({ 'label': flow_label, 'y': task_count });
                }
            }

            var not_visited_count = profile_flow_Array[0].task_count;
            if (not_visited_count != 0) {
                dataPoints_Array.push({ 'label': 'Not Visited', 'y': not_visited_count });
            }

            draw_my_task_chart(dataPoints_Array);
        }
        else {
            var message = myArray[0].message;
            alert1(message);
        }
        loading_hide();
    }
    catch (e) {
        alert1(e + '_onsuccess_get_counter_for_online_flow()');
    }
}

function onfail_get_counter_for_online_flow_profile(e) {
    alert1(e + '_onsuccess_get_counter_for_online_flow()');
}

function draw_my_task_chart(dataPoints_Array) {
    try {
        if (dataPoints_Array.length > 0) {
            dataPoints_Array[0]['exploded'] = true;
            var chart = new CanvasJS.Chart("chartContainer", {
                theme: "light2", // "light1", "light2", "dark1", "dark2"
                exportEnabled: true,
                animationEnabled: true,
                animationDuration: 500,
                title: {
                    text: "Pending Site Ratio",
                    fontSize: 17
                },
                legend: {
                    cursor: "pointer",
                    itemclick: explodePie
                    //   verticalAlign: "top"
                },
                data: [{
                    type: "pie",
                    click: explodePie,
                    radius: 80,   // custom radius of pie
                    startAngle: 25,
                    //toolTipContent: "<b>{label}</b>: {y}%",
                    //indexLabel: "{label} - {y}%",
                    indexLabel: "{label} - {y}",
                    toolTipContent: "{label}: <b>{y}</b>",
                    showInLegend: "true",
                    legendText: "{label}",
                    indexLabelFontSize: 10,
                    //dataPoints: [
                    //    { y: 51.08, label: "Chrome" },
                    //    { y: 27.34, label: "Internet Explorer" },
                    //    { y: 10.62, label: "Firefox" },
                    //    { y: 5.02, label: "Microsoft Edge" },
                    //    { y: 4.07, label: "Safari" },
                    //    { y: 1.22, label: "Opera" },
                    //    { y: 0.44, label: "Others" }
                    //]
                    dataPoints: dataPoints_Array
                }]
            });
            chart.render();
        }
        else {
            alert1("No Pending Task Found!");
            loading_hide();
        }
    }
    catch (e) {
        alert1(e + '_draw_my_task_chart()');
    }
}

function explodePie(e) {
    for (var i = 0; i < e.dataSeries.dataPoints.length; i++) {
        if (i !== e.dataPointIndex)
            e.dataSeries.dataPoints[i].exploded = false;
    }
}

//function draw_my_task_chart_highchart(dataPoints_Array) {
//    try {
//        Highcharts.chart('chartContainer', {
//            chart: {
//                plotBackgroundColor: null,
//                plotBorderWidth: null,
//                plotShadow: false,
//                type: 'pie'
//            },
//            title: {
//                text: 'Site Ratio'
//            },
//            tooltip: {
//                pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
//            },
//            plotOptions: {
//                pie: {
//                    allowPointSelect: true,
//                    cursor: 'pointer',
//                    dataLabels: {
//                        enabled: true,
//                        format: '<b>{point.name}</b>: {point.percentage:.1f} %',
//                        style: {
//                            color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
//                        }
//                    }
//                }
//            },
//            series: [{
//                name: 'Brands',
//                colorByPoint: true,
//                data: [{
//                    name: 'Chrome',
//                    y: 61.41,
//                    sliced: true,
//                    selected: true
//                }, {
//                    name: 'Internet Explorer',
//                    y: 11.84
//                }, {
//                    name: 'Firefox',
//                    y: 10.85
//                }, {
//                    name: 'Other',
//                    y: 2.61
//                }]
//            }]
//        });
//    }
//    catch (e) {
//        alert1(e + '_draw_my_task_chart()');
//    }
//}




//function draw_my_task_chart(dataPoints_Array) {
//    google.charts.load('current', { 'packages': ['corechart'] });
//    google.charts.setOnLoadCallback(drawChart);

//}
//function drawChart() {
//    var data = google.visualization.arrayToDataTable([
//      ['Task', 'Hours per Day'],
//      ['Work', 11],
//      ['Eat', 2],
//      ['Commute', 2],
//      ['Watch TV', 2],
//      ['Sleep', 7]
//    ]);

//    var options = {
//        title: 'My Daily Activities'
//    };

//    var chart = new google.visualization.PieChart(document.getElementById('chartContainer'));

//    chart.draw(data, options);
//}


// My Profile end

// notify in app
function mk_notify(str) {
    myApp.addNotification({
        message: str
    });

    setTimeout(function () {
        myApp.closeNotification('.notifications');
    }, 3000);
}

function alert_and_ios(str) {
    if (F7_device == 'android') {
        alert1(str);
    }
    else {
        myApp.addNotification({
            message: str
        });

        setTimeout(function () {
            myApp.closeNotification('.notifications');
        }, 3000);
    }
}

// show checksheet progress popup
function show_checksheet_progress_popup() {
    var clickedLink = $('.btn_progress');
    myApp.popover('.popover-chk-progress', clickedLink);
}


//toggle skip download flag
function toggle_skip_download_flag(chk) {
    var chk_skip_down = $(chk).is(':checked');
    if (chk_skip_down == true) {
        storage.setItem('chk_skip_down', JSON.stringify('true'));
    }
    else {
        storage.setItem('chk_skip_down', JSON.stringify('false'));
    }
}

function get_internet_status_F7() {
    setTimeout(function () {
        cordova.exec(onsuccess_get_internet_status_F7, onfail_get_internet_status_F7, 'maulik', 'nck', ["ds"]);
    }, 10);
}

function onsuccess_get_internet_status_F7(e) {
    var myArray = JSON.parse(e);
    var gprs = myArray[0].gprs;
    if (gprs == "1") {
        $("#menu_img_gprs").css("color", "lightgreen");
        $("#menu_net_status").text("Online");
    } else {
        $("#menu_img_gprs").css("color", "gray");
        $("#menu_net_status").text("Offline");
    }
}

function onfail_get_internet_status_F7(e) {
    $("#menu_img_gprs").css("color", "gray");
    $("#menu_net_status").text("Offline");
}

// view date as per device setting
function convert_to_view_date_F7(date) {
    try {
        var dateFormat = localStorage.getItem("dateFormat");
        if (dateFormat == '' || dateFormat == null || dateFormat == undefined) {
            dateFormat = 'mm/dd/yyyy';
        }

        var d = new Date(date);
        var dd1 = d.getDate();
        var mm1 = d.getMonth() + 1;
        var yyyy1 = d.getFullYear();
        var day = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d.getDay()];
        var month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][mm1 - 1];
        var day_s = day.substr(0, 3);
        var month_s = month.substr(0, 3);

        if (dd1 < 10) {
            dd1 = '0' + dd1;
        }

        if (mm1 < 10) {
            mm1 = '0' + mm1;
        }

        if (dateFormat == 'mm/dd/yyyy') {
            // 12/31/2017
            var view_date = mm1 + '/' + dd1 + '/' + yyyy1;
        }
        else if (dateFormat == 'dd/mm/yyyy' || dateFormat == 'dd-MMM-y') {
            // 31/12/2017
            var view_date = dd1 + '/' + mm1 + '/' + yyyy1;
        }
        else if (dateFormat == 'yyyy-MM-dd') {
            // 2017/12/31
            var view_date = yyyy1 + '/' + mm1 + '/' + dd1;
        }
        else if (dateFormat == 'DD, d MM yyyy') {
            // Sunday, 31 December, 2017
            var view_date = day + ', ' + dd1 + ' ' + month + ', ' + yyyy1;
        }
        else if (dateFormat == 'D, M d, yyyy') {
            // Sun, Dec 31, 2017
            var view_date = day_s + ', ' + month_s + ' ' + mm1 + ', ' + yyyy1;
        }
        else if (dateFormat == 'D, d M yyyy' || dateFormat == 'yyyy M d, DD') {
            // Sun, 31 Dec 2017
            var view_date = day_s + ', ' + mm1 + ' ' + month_s + ' ' + yyyy1;
        }
        else {
            // 31/12/2017
            var view_date = dd1 + '/' + mm1 + '/' + yyyy1;
        }

        return view_date;
    }
    catch (e) {
        return "N/A";
    }
}

// //////// Weather View Part ///////////////////////////
function view_weather_for_site(temp_site_lat, temp_site_long) {
    try {
        storage.setItem('crash_status', JSON.stringify('2')); // crash status for map

        var d = new Date();
        var ms = d.getTime();

        var q_jsonobj = [];
        q_jsonobj.push({
            time: ms,
            lat: temp_site_lat,
            lon: temp_site_long
        });

        cordova.exec(onsuccess_view_weather_for_site, onfail_view_weather_for_site,
            'weather_plug', 'anAction', q_jsonobj);
    } catch (e) {
        alert1(e + '_get_user_latlong_for_map()');
        loading_hide();
    }
}

function onsuccess_view_weather_for_site(e) {
    // successfull weather display
}

function onfail_view_weather_for_site(e) {
    storage.setItem('crash_status', JSON.stringify('0')); // reset crash
}
////////


// //////// Map View Part ///////////////////////////
// Get user latlong
function get_user_latlong_for_map(temp_site_lat, temp_site_long) {
    try {
        storage.setItem('crash_status', JSON.stringify('2')); // crash status
        // for map
        site_lat = temp_site_lat;
        site_long = temp_site_long;
        cordova.exec(onsuccess_get_user_latlong_for_map,
            onfail_get_user_latlong_for_map, 'maulik', 'nck', ["ds"]);
    } catch (e) {
        alert1(e + '_get_user_latlong_for_map()');
        loading_hide();
    }
}

// successful getting user latlong
function onsuccess_get_user_latlong_for_map(e) {
    try {
        // alert1(e);
        var myArray = JSON.parse(e);
        var user_lat = myArray[0].lat;
        var user_long = myArray[0].lon;
        view_user_on_map(user_lat, user_long);
    } catch (e) {
        // alert1('Problem while getting GPS lat long, Please change your
        // position !');
        var user_lat = 0;
        var user_long = 0;
        view_user_on_map(user_lat, user_long);
        loading_hide();
    }
}

// view map on map click
function view_user_on_map(user_lat, user_long) {
    try {

        var q_jsonobj = [];
        q_jsonobj.push({
            user_lat: user_lat,
            user_long: user_long,
            site_lat: site_lat,
            site_long: site_long
        });
        // alert1(JSON.stringify(q_jsonobj));

        // old map view
        // cordova.exec(onsuccess_view_user_on_map, onfail_view_user_on_map,
        // 'map', 'anAction', q_jsonobj);

        // new map view(original google map)
        cordova.exec(onsuccess_view_user_on_map, onfail_view_user_on_map,
            'navigation_new_plug', 'anAction', q_jsonobj);
    } catch (e) {
        alert1(e + '_view_user_on_map()');
        loading_hide();
    }
}

function onfail_get_user_latlong_for_map(e) {
    // alert1(e + '_onfail_get_user_latlong_for_map()');
    // alert1('Problem while getting GPS lat long, Please change your position
    // !');
    var user_lat = 0;
    var user_long = 0;
    view_user_on_map(user_lat, user_long);
    loading_hide();
}

function onsuccess_view_user_on_map(e) {
    // alert1("sucessful map open...");
}

function onfail_view_user_on_map(e) {
    if (e == null || e == undefined || e == '') {
        // user press back button
        // alert1("back");
    } else {
        // when open map in offline
        alert1("Network is slow or not working, Please check your internet connection !")
    }
    storage.setItem('crash_status', JSON.stringify('0')); // reset crash
    // status for map
}

function open_dialpad(t_number) {
    var q_jsonobj = [];
    q_jsonobj.push({
        'mobilenumber': t_number
    });
    cordova.exec(onsuccess_plugin, onfail_plugin, 'openDialPadPlugin', 'anAction', q_jsonobj);
}

function open_mail(t_mail_details) {
    t_mail_details = decodeURIComponent(t_mail_details);
    var mail_array = t_mail_details.split(',');
    var email = mail_array[0];
    var body = '';
    var subject = '';
    if (mail_array.length > 1) {
        body = mail_array[1];
        subject = mail_array[2];
    }

    //body = 'Disclaimer : The content of this application is confidential and intended for the specified recipient only. No User has the authority to conclude any binding contract/inference from the contents of this application. The data contained herein only provides an information regarding the project but not on a real-time basis. The accuracy of the information Vis-à-vis the real-time project progress is not guaranteed. The application users are advised to seek help of the Project Director for any further query that they may have with regards to the project progress. Thank you for your cooperation and understanding.';
    //subject = '';

    var q_jsonobj = [];
    q_jsonobj.push({
        'email': email,
        'body': body,
        'subject': subject
    });
    cordova.exec(onsuccess_plugin, onfail_plugin, 'openMailComposerPlugin', 'anAction', q_jsonobj);
}

function onsuccess_plugin(e) { }
function onfail_plugin(e) { }

// bulk approval start

function show_bulk_approval_panel() {
    $("#site_list .item-inner").addClass('li_disabled');
    $("#site_list .item-media").removeClass('li_no_chk');
    $(".views #nav_main").hide();
    $("#nav_select_all").show();
    $('.tabbar').slideUp(100);
    //$('#tab1').css('padding-top', '57px');
    //$('#tab2').css('padding-top', '57px');
    //$('#tab3').css('padding-top', '57px');
}

function hide_bulk_approval_panel() {
    $("#site_list .item-inner").removeClass('li_disabled');
    $("#site_list .item-media").addClass('li_no_chk');
    $(".views #nav_main").show();
    $("#nav_select_all").hide();
    $('.tabbar').slideDown(100);
    //$('#tab1').css('padding-top', '104px');
    //$('#tab2').css('padding-top', '104px');
    //$('#tab3').css('padding-top', '104px');
}

function get_selected_chk_count() {
    var count = $('#site_list input[name="li_chk"]:checked').length;
    if (count > 0) {
        $('#lbl_select_cnt').html(count);
        $('#nav_select_all .right').show();
    }
    else {
        $('#lbl_select_cnt').html("0");
        $('#nav_select_all .right').hide();
    }
}

function select_all_tasks() {
    var checked = $('#chk_select_all').is(":checked");
    if (checked == true) {
        $('#site_list input[name="li_chk"]').prop('checked', true);
    }
    else {
        $('#site_list input[name="li_chk"]').prop('checked', false);
    }
    get_selected_chk_count();
}

function send_bulk_approval_online(t_status, bulk_approval_checksheet) {
    try {
        if (bulk_approval_checksheet == "" || bulk_approval_checksheet == null || bulk_approval_checksheet == undefined) {
            var task_ids = $("#site_list input[name='li_chk']:checked").map(function () { return this.value; }).get().join(",");
            var task_array = JSON.parse("[" + task_ids + "]");

            var appid = localStorage.getItem('appid');
            var auth = [];
            auth.push({
                "username": username,
                "uniqcode": uniqcode,
                "app_id": appid
            });

            var param_obj = [];
            param_obj.push({
                'servertaskid': task_array,
                'status': t_status
            });

            loading();
            var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_Bulk_approval', JSON.stringify(param_obj), onsuccess_send_bulk_approval_online, onfail_request);
            getdata.callOtherDomain();
        }
        else {
            //added new logic for bulk approval checksheet if button dependency=checksheet   [FT - 22042024] 
            var flow_Array = JSON.parse(storage.getItem('flow_Array'));
            if (flow_Array.length === 1) {
                var moduleid = JSON.parse(storage.getItem('wayflow'));
            } else {
                var moduleid = flow_Array[flow_Array.length - 1].wayflow;
            }

            var query = "select data from flow_master where moduleid = '" + moduleid + "'";
            var q_jsonobj = [];
            q_jsonobj.push({
                data: query,
                p: "1"
            });
            AppBridge.on(cordova).read(function (e) {
                var myArray = JSON.parse(e);
                if (myArray == '' || myArray == null || myArray == undefined || myArray.length == 0) {
                    var flow_Array = JSON.parse(storage.getItem('flow_Array'));
                    var flow_id = flow_Array[flow_Array.length - 1].wayflow;
                    var flow_flowname = flow_Array[flow_Array.length - 1].wayflow_name;
                    alert1(flow_flowname + " (" + flow_id + ") flow not found in flow master ! ");
                }
                else {
                    var task_checklist_data = myArray[0].data;
                    task_checklist_data = JSON.parse(task_checklist_data);
                    for (var t = 0; t < task_checklist_data.length; t++) {
                        var t_chk_id = task_checklist_data[t].checksheetid;
                        var end_status = task_checklist_data[t].end_status;
                        var reject_status = task_checklist_data[t].reject_status;
                        if (t_chk_id == bulk_approval_checksheet) {
                            localStorage.setItem('bulk_approval_chksht_end_status', end_status);
                            localStorage.setItem('bulk_approval_chksht_reject_status', reject_status);
                            break;
                        }
                    }

                    open_additional_checksheet_for_bulk_approval(t_status, bulk_approval_checksheet);
                }
            }, onfail_request, 'flowMapping', { moduleid: moduleid });
        }
    }
    catch (e) {
        alert1(e + '_send_bulk_approval_online()');
    }
}

function onsuccess_send_bulk_approval_online(e) {
    var Data_Json = e.responseText;
    Data_Json = eval('(' + Data_Json + ')');
    var Status = Data_Json[0].status;
    if (Status == 1) {
        alert1("Tasks has been updated successfully !");
        hide_bulk_approval_panel();
        refresh_site_list_common();
    }
    else {
        var message = Data_Json[0].message;
        alert1(message);
    }
    loading_hide();
}

// bulk approval end


// show chat window
function show_chat_window() {
    try {
        var query = "select imei from Login_Master";
        var q_jsonobj = [];
        q_jsonobj.push({
            data: query,
            p: "1"
        });
        cordova.exec(onsuccess_show_chat_window, onfail_show_chat_window, 'wiprochat_plugin', 'anAction', q_jsonobj);
    }
    catch (e) {
        alert1(e + '_show_chat_window()');
    }
}

function onsuccess_show_chat_window(e) {
    //
}

function onfail_show_chat_window(e) {
    //
}


// start-stop trip from mobile checksheet button 
var t_trip_status;
function start_stop_trip(trip_status) {
    try {
        storage.setItem('crash_status', JSON.stringify('7'));               //when app is killed before start/stop trip
        localStorage.setItem('trip_status', trip_status);

        t_trip_status = trip_status;
        //var sp_str = curr_survey_data["shortest_path"];

        try {
            var sp_str = localStorage.getItem('shortest_path');
            if (sp_str == '' || sp_str == null || sp_str == undefined) {
                var odometer_array = [];
            }
            else {
                var sp_array = JSON.parse(decodeURIComponent(sp_str));
                if (trip_status == 0 || sp_array.length == 0) {
                    var odometer_array = [];
                }
                else {
                    var odometer_array = sp_array[0].odometer_point;
                    if (odometer_array.length > 0) {
                        var que_id = odometer_array[0].que_id;
                        var data = curr_survey_data["json"];
                        for (i = 0; i < data.length; i++) {
                            var t_que_id = data[i].que_id;
                            if (t_que_id == que_id) {
                                odometer_array[0].answer = data[i].ans[0];
                                break;
                            }
                        }
                    }
                }
            }
        }
        catch (e) {
            var odometer_array = [];
        }

        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var t_ETA = list_data[0].ETA;
        if (t_ETA == "" || t_ETA == null || t_ETA == undefined) {
            t_ETA = "false";
        }

        var stillviolation_event = curr_survey_data["stillviolation_event"];
        if (stillviolation_event == "" || stillviolation_event == null || stillviolation_event == undefined) {
            stillviolation_event = "false";
        }

        let trip_vehicle_type = localStorage.getItem('trip_vehicle_type');
        if (trip_vehicle_type == "" || trip_vehicle_type == null || trip_vehicle_type == undefined) {
            trip_vehicle_type = "";
        }

        var t_tid = JSON.parse(storage.getItem('tid'));
        var q_jsonobj = [];
        q_jsonobj.push({
            'trip_status': trip_status,
            'tid': t_tid,
            'odometer_point': odometer_array,
            'ETA': t_ETA,
            'stillviolation_event': stillviolation_event,
            'vehicle_type': trip_vehicle_type
        });
        //alert1(JSON.stringify(q_jsonobj));

        cordova.exec(onsuccess_start_stop_trip, onfail_start_stop_trip, 'TripPlugin', 'anAction', q_jsonobj);
    }
    catch (e) {
        alert1(e + '_start_stop_trip()');
    }
}

function onsuccess_start_stop_trip(e) {
    try {
        storage.setItem('crash_status', JSON.stringify('0'));
        myApp.hidePreloader();

        var t_ser_task_id = JSON.parse(storage.getItem('server_task_id'));
        if (t_trip_status == 0) {
            var t_tid = JSON.parse(storage.getItem('tid'));
            localStorage.setItem('trip_status', t_trip_status);
            localStorage.setItem('trip_tid', t_tid);
            localStorage.setItem('trip_ser_task_id', t_ser_task_id);

            let data_json = JSON.parse(storage.getItem('list_json'));
            let list_data = JSON.parse(data_json);
            let waypoint_dependency = list_data[0].waypoint_dependency;
            if (waypoint_dependency == "" || waypoint_dependency == null || waypoint_dependency == undefined) {
                waypoint_dependency = "trip_dependent";
            }

            localStorage.setItem('trip_waypoint_dependency', waypoint_dependency);
        }
        else {
            localStorage.setItem('trip_status', '1');
            localStorage.setItem('trip_tid', '');
            localStorage.setItem('trip_ser_task_id', '');
            localStorage.setItem('trip_waypoint_dependency', '');
        }

        try {
            var trip_Array = localStorage.getItem("trip_Array");
            if (trip_Array == "" || trip_Array == null || trip_Array == undefined) {
                trip_Array = {};
            }
            else {
                trip_Array = JSON.parse(trip_Array);
            }

            trip_Array[t_ser_task_id] = t_trip_status;
            localStorage.setItem("trip_Array", JSON.stringify(trip_Array));
        }
        catch (e) { }

        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var auto_trip = list_data[0].auto_trip;
        if (auto_trip == 'true') {
            var direct_task = list_data[0].direct_task;
            if (direct_task == "true") {
                if (t_trip_status == 0) {
                    //start trip
                    //changeurl("selection_survey.html");

                    //insert/update task entry once location get successfully----(issue when lat-long not found---14072020)
                    var survey_mode = list_data[0].survey_mode;
                    if (survey_mode == "online") {
                        // create task online   (online then offline both)
                        if (curr_btn_mode == "button_create_task") {
                            var btn_status = curr_survey_data["createtask"];
                            insert_online_n_offline_task(btn_status);
                        }
                        else {
                            insert_online_n_offline_task(0);
                        }
                    }
                    else {
                        // create task offline
                        get_user_latlong_offline_task();
                    }
                }
                else {
                    //stop trip
                    update_current_checksheet_status_post();
                }
            }
            else {
                if (t_trip_status == 0) {
                    // start trip

                    if (form_flag == 6) {
                        // task create
                        var survey_mode = list_data[0].survey_mode;
                        if (survey_mode == "online") {
                            // create task online   (online then offline both)
                            if (curr_btn_mode == "button_create_task") {
                                var btn_status = curr_survey_data["createtask"];
                                insert_online_n_offline_task(btn_status);
                            }
                            else {
                                insert_online_n_offline_task(0);
                            }
                        }
                        else {
                            // create task offline
                            get_user_latlong_offline_task();
                        }
                    }
                    else {
                        update_current_checksheet_status_post();
                    }
                }
                else {
                    // stop trip
                    if (form_flag == 6) {
                        changeurl("viewsitelist_pm_grouplist.html");
                    }
                    else {
                        update_current_checksheet_status_post();
                    }
                }
            }
        }
        else {
            update_current_checksheet_status_post();
        }
    }
    catch (e) {
        alert1(e + 'onsuccess_start_stop_trip');
    }
}

function onfail_start_stop_trip(e) {
    storage.setItem('crash_status', JSON.stringify('0'));
    myApp.hidePreloader();
}


// middle funcation to call webservice
function webservice_inner_call(jsonobj, sucesscallback, failcallback) {
    var getdata = new Webservicecall_REST(global_wcf_url + 'WCF_ComanWebservice', JSON.stringify(jsonobj), localsuccess, localfail);
    getdata.callOtherDomain();

    function localsuccess(e) {
        var myArray = JSON.parse(e.responseText);
        var status = myArray[0].status;
        var message = myArray[0].message;
        if (status == "1") {
            if (jsonobj[0].sp_name == "GetLogData_Port") {
                var myArray = JSON.parse(e.responseText);

                var data = myArray[0].data;
                if (data == "" || data == null || data == undefined) { }
                else {
                    myArray = JSON.parse(data);
                }

                sucesscallback(myArray[0].f_data);
            }
            else {
                var myArray = JSON.parse(e.responseText);
                var data = myArray[0].data;
                if (data == "" || data == null || data == undefined) { }
                else {
                    myArray = JSON.parse(data);
                }
                sucesscallback(JSON.stringify(myArray));
            }
        }
        else {
            //window.location.href = "../LoginPage.aspx";
            failcallback(message);
        }
    }

    function localfail(e) {
        var myArray = JSON.parse(e.responseText);
        var message = myArray[0].message;
        failcallback(message);
    }

}

//--Restrict multiclick--///
// count page load seconds
var button_clicked = 0;
var button_clicked_subflow = 0;

var beforeload = (new Date()).getTime();
function getPageLoadTime() {
    var afterload = (new Date()).getTime();
    var t_seconds = (afterload - beforeload) / 1000;
    return t_seconds;
}


//view database in application
function view_database() {
    try {
        cordova.exec(onsuccess_view_database, onfail_view_database, 'ShowDbPlugin', 'database', []);
    }
    catch (e) {
        alert1(e + '_view_database');
    }
}

function onsuccess_view_database() { }

function onfail_view_database() { }

//resolve crash status issue
function resolve_crash_status_issue() {
    try {
        storage.setItem('crash_status', JSON.stringify('0'));
    }
    catch (e) {
        alert1(e + '_resolve_crash_status_issue');
    }
}

function pass_required_values_to_condition(Condition_Data) {
    try {

        // convert json to lowercase
        var json = JSON.stringify(Condition_Data);
        var newJson = json.replace(/"([\w]+)":/g, function ($0, $1) {
            return ('"' + $1.toLowerCase() + '":');
        });
        Condition_Data = JSON.parse(newJson);

        // get default system varaibles
        var company_id = JSON.parse(storage.getItem('company_id'));
        var user_id = JSON.parse(storage.getItem('user_id'));
        var user_name = JSON.parse(storage.getItem('user_name'));
        var module_id = JSON.parse(window.storage.getItem('wayflow'));
        var module_name = JSON.parse(window.storage.getItem('wayflow_name'));
        var role_id = JSON.parse(storage.getItem('role_id'));
        var role_name = JSON.parse(storage.getItem('role_name'));
        var circle_id = JSON.parse(storage.getItem('circle_id'));
        var circle_name = JSON.parse(storage.getItem('circle_name'));

        var server_task_id = JSON.parse(storage.getItem('server_task_id'));
        curr_all_data_20["task_id"] = server_task_id;

        curr_all_data_20["company_id"] = company_id;
        curr_all_data_20["user_id"] = user_id;
        curr_all_data_20["user_name"] = user_name;
        curr_all_data_20["module_id"] = module_id;
        curr_all_data_20["module_name"] = module_name;
        curr_all_data_20["role_id"] = role_id;
        curr_all_data_20["role_name"] = role_name;
        curr_all_data_20["circle_id"] = circle_id;
        curr_all_data_20["circle_name"] = circle_name;

        var type20_columndata = JSON.parse(storage.getItem('type20_columndata'));
        if (type20_columndata == '' || type20_columndata == null || type20_columndata == undefined) { }
        else {
            for (c = 0; c < type20_columndata.length; c++) {
                var key = type20_columndata[c].header;
                var value = type20_columndata[c].ans;
                curr_all_data_20[key] = value;
            }
        }

        var customer_columndata = JSON.parse(storage.getItem('customer_columndata'));
        if (customer_columndata == '' || customer_columndata == null || customer_columndata == undefined) { }
        else {
            for (c = 0; c < customer_columndata.length; c++) {
                var key = customer_columndata[c].header;
                var value = customer_columndata[c].ans;
                curr_all_data_20[key] = value;
            }
        }

        // AND
        try {
            var where_Json = Condition_Data[0].where[0].and[0].json;
            for (f = 0; f < where_Json.length; f++) {
                var get_value = where_Json[f].value_1;
                var value_type = get_value.substring(2, 1);
                var sub_get_value = get_value.substring(2, get_value.length - 2);
                if (value_type == "#") {
                    // system value
                    var new_get_value = curr_all_data_20[sub_get_value];
                    Condition_Data[0].where[0].and[0].json[f].value_1 = new_get_value;
                }
            }
        } catch (e) { }

        var where_Table = Condition_Data[0].where[0].and[0].table;
        for (h = 0; h < where_Table.length; h++) {
            var get_value = where_Table[h].value_1;
            var value_type = get_value.substring(2, 1);
            var sub_get_value = get_value.substring(2, get_value.length - 2);
            if (value_type == "#") {
                // system value
                var new_get_value = curr_all_data_20[sub_get_value];
                Condition_Data[0].where[0].and[0].table[h].value_1 = new_get_value;
            }
        }

        // OR
        try {
            var where_Json = Condition_Data[0].where[0].or[0].json;
            for (f = 0; f < where_Json.length; f++) {
                var get_value = where_Json[f].value_1;
                var value_type = get_value.substring(2, 1);
                var sub_get_value = get_value.substring(2, get_value.length - 2);
                if (value_type == "#") {
                    // system value
                    var new_get_value = curr_all_data_20[sub_get_value];
                    Condition_Data[0].where[0].or[0].json[f].value_1 = new_get_value;
                }
            }
        } catch (e) { }

        try {
            var where_Table = Condition_Data[0].where[0].or[0].table;
            for (h = 0; h < where_Table.length; h++) {
                var get_value = where_Table[h].value_1;
                var value_type = get_value.substring(2, 1);
                var sub_get_value = get_value.substring(2, get_value.length - 2);
                if (value_type == "#") {
                    // system value
                    var new_get_value = curr_all_data_20[sub_get_value];
                    Condition_Data[0].where[0].or[0].table[h].value_1 = new_get_value;
                }
            }
        } catch (e) { }




        // AND > OR
        try {
            var where_Json = Condition_Data[0].where[0].and[0].or[0].json;
            for (f = 0; f < where_Json.length; f++) {
                var get_value = where_Json[f].value_1;
                var value_type = get_value.substring(2, 1);
                var sub_get_value = get_value.substring(2, get_value.length - 2);
                if (value_type == "#") {
                    // system value
                    var new_get_value = curr_all_data_20[sub_get_value];
                    Condition_Data[0].where[0].and[0].or[0].json[f].value_1 = new_get_value;
                }
            }

            var where_Table = Condition_Data[0].where[0].and[0].or[0].table;
            for (h = 0; h < where_Table.length; h++) {
                var get_value = where_Table[h].value_1;
                var value_type = get_value.substring(2, 1);
                var sub_get_value = get_value.substring(2, get_value.length - 2);
                if (value_type == "#") {
                    // system value
                    var new_get_value = curr_all_data_20[sub_get_value];
                    Condition_Data[0].where[0].and[0].or[0].table[h].value_1 = new_get_value;
                }
            }
        } catch (e) { }


        return Condition_Data;
    } catch (e) {
        alert1(e + '_pass_required_values_to_condition()');
        loading_hide();
    }
}


function get_element_value_by_class(class_name) {
    var where_box_id = $("." + class_name + " :input[type=number]").attr("id");
    if (where_box_id == '' || where_box_id == null || where_box_id == undefined) {

        // check for text box
        where_box_id = $("." + class_name + " :input[type=text]").attr("id");

        if (where_box_id == '' || where_box_id == null || where_box_id == undefined) {
            // possible dropdown 
            where_box_id = $("." + class_name + " select").attr("id");

            if (where_box_id == '' || where_box_id == null || where_box_id == undefined) {

                // check for trip control
                where_box_id = $("." + class_name + " #trip_info_tbl").attr("id");

                if (where_box_id == '' || where_box_id == null || where_box_id == undefined) {
                    // type22 grand total
                    var ele_value = $("." + class_name + "").find("td[id^='sum_']").last().text();
                }
                else {
                    //trip actual distance
                    var ele_value = $("#trip_info_tbl > tbody > tr > td").html();
                    if (ele_value == "Actual Path is missing.") {
                        ele_value = "0.00";
                    }
                }
            }
            else {
                if (where_box_id.indexOf('dynddl') != -1) {
                    // type30 dropdown
                    var ele_value = $("#" + where_box_id + " :selected").text();
                }
                else {
                    // normal dropdown
                    var ele_value = $("#" + where_box_id + "").val();
                }
            }
        }
        else {
            if (where_box_id.indexOf('txt_') != -1) {
                // text box found
                var ele_value = $("#" + where_box_id + "").val();
            }
            else {
                // calendar found
                var ele_value = $("#" + where_box_id + "").val();
                var data_field = $("#" + where_box_id + "").attr("data-field");
                ele_value = convert_fix_format_date_on_submit(ele_value, data_field);

                var cal_date = new Date(ele_value);
                ele_value = cal_date.getTime();
                ans_type = 'date';
            }
        }
    }
    else {
        // numeric found
        var ele_value = $("#" + where_box_id + "").val();
    }

    return ele_value;
}

//convert Date/Time globally
function convert_datetime_by_format(datetime_str, mode) {

    //var date_format = "dd/mm/yyyy";
    //var date_format = "mm/dd/yyyy";
    //var date_format = "yyyy/mm/dd";
    //var date_format = "dd-mmm-yyyy";

    if (mode == 'time') {
        return datetime_str;
    }
    else {
        var datetime_format = localStorage.getItem("dateFormat");
        if (datetime_format == "" || datetime_format == null || datetime_format == undefined) {
            datetime_format = 'mm/dd/yyyy HH:mm';
        }

        var datetime_format_ary = datetime_format.split(" ");
        var date_format = datetime_format_ary[0];

        if (datetime_str == '' || datetime_str == null || datetime_str == undefined) {
            var d = new Date();
        }
        else {
            if (mode == "date" || mode == "datetime") {
                let temp_str = datetime_str.toString();
                if (temp_str.indexOf("/") > -1 || temp_str.length > 16) {
                    var d = new Date(datetime_str);
                }
                else {
                    // in case mode is datetime and ans is in time string only - mk - 02082024
                    var d = new Date();
                }
            }
            else {
                var d = new Date(datetime_str);
            }
        }

        var date_str = "";

        if (d == "Invalid Date") {
            //alert1("Invalid date format!")

            //---dd/MM/yyyy formate not supported in Date Object----
            if (mode == "datetime") {
                var t_date_str1 = datetime_str.substring(0, 10);
                var t_date_str2 = datetime_str.substring(10);
                if (F7_device == 'ios') {
                    //date with (-) is invalid for ios so replaced it with "/" instead of "-" [FT - 01062024]
                    t_date_str1 = t_date_str1.split("/").reverse().join("/");
                }
                else {
                    t_date_str1 = t_date_str1.split("/").reverse().join("-");
                }
                datetime_str = t_date_str1 + t_date_str2;
            }
            else {
                if (F7_device == 'ios') {
                    //date with (-) is invalid for ios so replaced it with "/" instead of "-" [FT - 01062024]
                    datetime_str = datetime_str.split("/").reverse().join("/");
                }
                else {
                    datetime_str = datetime_str.split("/").reverse().join("-");
                }
            }
            return datetime_str;
        }
        else {
            var date = d.getDate();
            var month = d.getMonth() + 1;
            var year = d.getFullYear();

            if (date < 10) {
                date = "0" + date;
            }
            if (month < 10) {
                month = "0" + month;
            }

            var month_name = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];

            if (date_format == "dd-M-yyyy") {
                date_str = date + "-" + month_name[month - 1] + "-" + year;
            }
            else if (date_format == "mm/dd/yyyy") {
                date_str = month + "/" + date + "/" + year;
            }
            else if (date_format == "yyyy/mm/dd") {
                date_str = year + "/" + month + "/" + date;
            }
            else if (date_format == "dd/mm/yyyy") {
                date_str = date + "/" + month + "/" + year;
            }
            else {
                date_str = "";
                alert1("Please Provide Proper format for date");
            }

            if (mode == "datetime") {
                if (date_str != "") {
                    var hour = d.getHours();
                    var min = d.getMinutes();
                    var second = d.getSeconds();

                    if (hour < 10) {
                        hour = "0" + hour;
                    }
                    if (min < 10) {
                        min = "0" + min;
                    }
                    if (second < 10) {
                        second = "0" + second;
                    }

                    var time_format = datetime_format_ary[2];
                    if (time_format == "AA") {
                        //12 hours format
                        var time_str = convertTo12Hour(hour + ":" + min);
                        date_str = date_str + " " + time_str;
                    }
                    else {
                        //24 hour format
                        //date_str = date_str + " " + hour + ":" + min;

                        var time_view = datetime_format_ary[1];
                        if (time_view == 'HH:mm:ss') {
                            date_str = date_str + " " + hour + ":" + min + ":" + second;
                        }
                        else {
                            date_str = date_str + " " + hour + ":" + min;
                        }
                    }
                }
            }
            return (date_str);
        }
    }
}

function convert_fix_format_date_on_submit(date_str, mode) {
    try {
        if (mode == 'time') {
            var new_date_str = date_str;
        }
        else {
            var datetime_format = localStorage.getItem("dateFormat");
            if (datetime_format == "" || datetime_format == null || datetime_format == undefined) {
                datetime_format = 'mm/dd/yyyy HH:mm';
            }
            var datetime_format_ary = datetime_format.split(" ");
            var date_format = datetime_format_ary[0];

            if (date_format == "dd/mm/yyyy" || date_format == "dd-mm-yyyy" || date_format == "dd.mm.yyyy") {
                //---dd/MM/yyyy formate not supported in Date Object----
                try {
                    if (mode == "datetime") {
                        //var t_date_str1 = date_str.substring(0, 10);
                        //var t_date_str2 = date_str.substring(10);
                        //t_date_str1 = t_date_str1.split("/").reverse().join("-");
                        //date_str = t_date_str1 + t_date_str2;

                        var str = date_str;
                        var d = str.split("/")[0];
                        var m = str.split("/")[1];
                        var get_year = str.split("/")[2];

                        if (get_year == "" || get_year == null || get_year == undefined) {
                            mode = "time";
                        }
                        else {
                            var y = get_year.split(" ")[0]

                            if (get_year.length == 4) {
                                // date string (no hours or minute found in string)
                                date_str = y + "/" + m + "/" + d;
                            }
                            else {
                                var get_hour = get_year.split(" ")[1];
                                var hour = get_hour.split(":")[0]
                                var min = get_hour.split(":")[1]

                                date_str = y + "/" + m + "/" + d + " " + hour + ":" + min;
                            }
                        }

                    }
                    else {
                        //date_str = date_str.split("/").reverse().join("-");

                        var str = date_str;
                        var d = str.split("/")[0];
                        var m = str.split("/")[1];
                        var get_year = str.split("/")[2];
                        var y = get_year.split(" ")[0];
                        date_str = y + "/" + m + "/" + d;
                    }
                }
                catch (e) { }
            }

            try {
                date_str = date_str.replace(" AA", "");
            }
            catch (e) { }

            var t_date = new Date(date_str);
            var date = t_date.getDate();
            var month = t_date.getMonth() + 1;
            var year = t_date.getFullYear();

            if (date < 10) {
                date = "0" + date;
            }
            if (month < 10) {
                month = "0" + month;
            }

            if (mode == "date") {
                //var new_date_str = month + "/" + date + "/" + year;
                var new_date_str = year + "/" + month + "/" + date;
            }
            else if (mode == "datetime") {
                var hour = t_date.getHours();
                var min = t_date.getMinutes();
                var second = t_date.getSeconds();

                if (hour < 10) {
                    hour = "0" + hour;
                }
                if (min < 10) {
                    min = "0" + min;
                }
                if (second < 10) {
                    second = "0" + second;
                }

                var time_view = datetime_format_ary[1];
                if (time_view == 'HH:mm:ss') {
                    //var new_date_str = month + "/" + date + "/" + year + " " + hour + ":" + min + ":" + second;
                    var new_date_str = year + "/" + month + "/" + date + " " + hour + ":" + min + ":" + second;
                }
                else {
                    //var new_date_str = month + "/" + date + "/" + year + " " + hour + ":" + min;
                    var new_date_str = year + "/" + month + "/" + date + " " + hour + ":" + min;
                }
            }
            else {
                var new_date_str = date_str;
            }
        }

        return new_date_str;
    }
    catch (e) {
        alert1(e + '_convert_fix_format_date_on_submit');
    }
}



// Take a time in 24 hour format and format it in 12 hour format
function convertTo12Hour(time) {
    try {
        var time_part_array = time.split(":");
        var ampm = 'AM';

        if (time_part_array[0] >= 12) {
            ampm = 'PM';
        }

        if (time_part_array[0] > 12) {
            time_part_array[0] = time_part_array[0] - 12;
        }

        var formatted_time = time_part_array[0] + ':' + time_part_array[1] + ' ' + ampm;
        return formatted_time;
    }
    catch (e) {
        alert1(e + '_convertTo12Hour');
    }
}

function convertTo24Hour(time) {
    try {
        var hours = parseInt(time.substr(0, 2));

        if (time.indexOf('AM') != -1 && hours == 12) {
            time = time.replace('12', '0');
        }
        if (time.indexOf('PM') != -1 && hours < 12) {
            time = time.replace(hours, (hours + 12));
        }
        time = time.replace(/(AM|PM)/, '');

        return time;
    }
    catch (e) {
        alert1(e + '_convertTo24Hour');
    }
}

function convert_meter_to_km(t_distance) {
    if (t_distance >= 1000) {
        var distance_str = (t_distance / 1000).toFixed(2) + ' km';
    }
    else {
        var distance_str = t_distance + ' m';
    }
    return distance_str;
}

var speech_id;
function convert_speech_to_text(eld_id) {
    speech_id = eld_id;

    var q_jsonobj = [];
    cordova.exec(onsucess_convert_speech_to_text, onfail_request, 'SpeechtotextPlugin', 'anAction', q_jsonobj);
}

function onsucess_convert_speech_to_text(e) {
    $(speech_id).val(e);
}

function onfail_request(e) {
    alert1(e);
    loading_hide();
}

function onfail_cam() {
    // user press cancel button after capturing photo
    curr_btn_mode = "";
    close_full_view_image_type7();
    loading_hide();
    hide_AI_loader();
}

function close_full_view_image_type7() {
    storage.setItem('crash_status', JSON.stringify('0'));
    $("#img_full_type7").attr("src", "");
    $("#div_bottom_div_type7").empty();
    $("#popup_outer_div_type7").hide();
    $("#popup_inner_div_type7").hide();
}

function find_index_by_que_id(curr_form_flag, f_que_id) {
    if (curr_form_flag == 0 || curr_form_flag == 6 || curr_form_flag == 7) {
        let task_create_popup = $('.popup-new-task-create.modal-in:visible');
        if (task_create_popup.length > 0) {
            //new task create popup [FT-08052025]
            var t_Array = jsonObj_task_add;
        }
        else {
            // normal form
            var t_Array = jsonObj_old;
        }
    } else if (curr_form_flag == 1 || curr_form_flag == 4 || curr_form_flag == 5) {
        // type22 form
        var t_Array = jsonObj_type22;
    } else if (curr_form_flag == 2 || curr_form_flag == 3) {
        // type23 form
        var t_Array = jsonObj_type23;
    }

    var index;
    var len = t_Array.length;
    for (f = 0; f < len; f++) {
        var t_que_id = t_Array[f].que_id;
        if (f_que_id == t_que_id) {
            index = f;
            break;
        }
    }

    return index;
}

//====read more click for task list card
// Expands or collapses a task card (only one stays open). The card's height
// limit is animated to and from the card's real height (--readmore-h, read
// by .readmore.expand in styles_low.css). It used to animate to a fixed
// 5000px: opening was over in the first few frames, and closing did nothing
// visible for most of its half second and then snapped shut.
function readmore_set_height(card, open) {
    if (!card) return;
    if (open) {
        card.style.setProperty('--readmore-h', card.offsetHeight + 'px');
        card.classList.add('expand');
        card.style.setProperty('--readmore-h', card.scrollHeight + 'px');
        // Once open, no limit: the card may still grow (late photos, text).
        setTimeout(function () {
            if (card.classList.contains('expand')) card.style.setProperty('--readmore-h', 'none');
        }, 300);
    } else {
        card.style.setProperty('--readmore-h', card.offsetHeight + 'px');
        void card.offsetHeight;   // start the close from the height it has now
        card.classList.remove('expand');
        card.style.removeProperty('--readmore-h');
    }
}

function show_more_task_data(e) {
    // record if our text is expanded
    var isExpanded = $(e).hasClass("expand");

    //close all open cards
    $(".readmore.expand").each(function () { readmore_set_height(this, false); });
    $(".readmore-link.expand").removeClass("expand").html('<div class="showmore-box"><i class="fa fa-angle-down"></i></div>');
    $(e).html('<div class="showmore-box"><i class="fa fa-angle-down"></i></div>');

    // if target wasn't expand, then expand it
    if (!isExpanded) {
        $(e).addClass("expand");
        $(e).html('<div class="showmore-box"><i class="fa fa-angle-up"></i></div>');
        readmore_set_height($(e).parent(".readmore")[0], true);
    }
}

// view full view photo
function mk_get_full_view_pic(src, photo_name) {
    var common_PhotoBrowser = myApp.photoBrowser({
        zoom: false,
        toolbar: false,
        photos: [{
            url: src,
            caption: photo_name
        }],
        type: 'popup',
        theme: 'dark',
        captionsTheme: 'dark'
    });

    common_PhotoBrowser.open();
}


// autofill data by class - to textbox, numeric box, dropdown, photo etc. (e.g. from type30 response - 18042022)
function autofill_data_by_class(box_class, answer) {
    try {

        if (Array.isArray(answer)) {
            var fieldvalue = answer[0];
        } else {
            var fieldvalue = answer;
        }

        var box_id = [];

        var ddl_found = $("." + box_class + "").find("select");
        if (ddl_found.length > 0) {
            // below dropdown found to fill
            var below_ddl_id = $("." + box_class + "").find("select").attr("id");
            $("#" + below_ddl_id + "").val(fieldvalue);

            // ignore case in normal drodown type 3 - 22032021
            $("#" + below_ddl_id + " option").each(function () {
                if ($(this).val().toLowerCase() == fieldvalue.toLowerCase()) $(this).attr("selected", "selected");
            });

            var onchange_avail = $("#" + below_ddl_id + "").attr("onchange");
            if (onchange_avail == '' || onchange_avail == null || onchange_avail == undefined) { }
            else {
                $("#" + below_ddl_id + "").trigger("onchange");
            }
        }
        else {
            // below text box found to fill
            $("." + box_class + " :input").each(function () {
                var box_id_temp = ($(this).attr('id'));
                if (box_id_temp.indexOf("hdn_") > -1) { }
                else {
                    box_id.push(box_id_temp);
                }
            });

            if (box_id.length == 0 || box_id[0] == undefined) {
                $("." + box_class + " label[id^='lbl_up_']").each(function () {
                    var box_id_temp = ($(this).attr('id'));
                    box_id.push(box_id_temp);
                });
            }

            if (box_id.length == 0 || box_id[0] == undefined) {
                $("." + box_class + " img[id^='cbtn_']").each(function () {
                    var box_id_temp = ($(this).attr('id'));
                    box_id.push(box_id_temp);
                });
            }

            for (fk = 0; fk < box_id.length; fk++) {
                var curr_box_id = box_id[fk];

                var tagName = $("#" + curr_box_id + "").prop("tagName");
                if (tagName == "TEXTAREA") {
                    $("#" + curr_box_id + "").attr("rows", "5")
                }

                if (curr_box_id.indexOf("cal_") > -1) {
                    var mode = $("#" + curr_box_id + "").attr("data-field");
                    fieldvalue = convert_datetime_by_format(fieldvalue, mode);
                }

                if (curr_box_id.indexOf("lbl_up_") > -1) {
                    // upload control
                    var act_file_name = answer[0];
                    var encrypted_file_name = answer[1];
                    var encrypted_file_path = answer[2];
                    var t_new_id = curr_box_id.replace("lbl_up_", "");
                    var t_que_id = $("#div_upload_doc_" + t_new_id + "").attr("que_id");
                    var t_checksheet_id = curr_survey_data["check_type"];
                    var param_view = "check_down_doc_entry('" + t_new_id + "','" + encrypted_file_path + "','" + t_que_id + "', '" + t_checksheet_id + "')";

                    $('#btn_select_' + t_new_id + '').text('Change File');
                    $('#lbl_up_' + t_new_id + '').html(act_file_name);
                    $('#lbl_up_' + t_new_id + '').attr("onclick", param_view);
                    $('#lbl_up_' + t_new_id + '').css("color", "blue");

                    var date_s = new Date();
                    var time = date_s.getTime();
                    var company_id = JSON.parse(storage.getItem('company_id'));
                    var user_id = JSON.parse(storage.getItem('user_id'));
                    var siteid = JSON.parse(storage.getItem('siteid'));
                    var p_name = company_id + "_" + user_id + "_" + siteid + "_" + time + "_0";

                    var up_obj = [];
                    up_obj.push({
                        'act_file_name': act_file_name,
                        'enc_file_name': encrypted_file_name,
                        'file_path': encrypted_file_path,
                        'sys_file_name': p_name,
                        'sharepoint_link': '',
                        'photo_id': "",
                        'photo_size': ""
                    });

                    $('#lbl_up_' + t_new_id + '').attr('for', JSON.stringify(up_obj));

                    var parent_task_id = JSON.parse(storage.getItem('p_server_task_id'));
                    var t_upload_type = "transport"
                    var param_down = "toggle_doc_download('" + t_new_id + "', '" + t_que_id + "', '" + t_upload_type + "', '" + act_file_name + "', '" + encrypted_file_path + "', '" + encrypted_file_name + "', '', '" + parent_task_id + "')";
                    var d_str = '<a id="doc_down_' + t_new_id + '" name="0" onclick="' + param_down + '" style="font-weight:bold; visibility:hidden">Download Document</a>';

                    $('#div_upload_doc_' + t_new_id + '').append(d_str);

                }
                else if (curr_box_id.indexOf("cbtn_") > -1) {
                    // img
                    var que_id = $("#" + curr_box_id + "").parents("div[id^='div_cbtn_']").attr("que_id");
                    var img_que_id = que_id;
                    var img_div_id = curr_box_id;
                    $("#" + curr_box_id + "").attr("src", fieldvalue);
                    var img_id_type22 = storage.getItem('img_id_type22');
                    check_photo_entry_for_autofill(fieldvalue, img_id_type22, img_que_id, img_div_id)
                }
                else {
                    // textbox/numeric fill
                    $("#" + curr_box_id + "").val(fieldvalue);
                }
            }
        }
    }
    catch (e) {
        alert1(e + '_autofill_data_by_class()');
    }
}








//////////////////////////// unused code
//function get_my_task() {
//    var query = "select status from task_master where username = '" + username + "'";
//    var q_jsonobj = [];
//    q_jsonobj.push({
//        data: query,
//        p: "1"
//    });
//    cordova.exec(onsuccess_get_my_task, onfail_get_my_task, 'SqlitePlugin', 'showValues', q_jsonobj);
//}

//function onsuccess_get_my_task(e) {
//    var myArray = JSON.parse(e);
//    if (myArray.length > 0) {
//        var comp_count = 0;
//        for (i = 0; i < myArray.length; i++) {
//            var status = myArray[i].status;
//            if (status == 2) {
//                comp_count++;
//            }
//        }

//        var pen_count = myArray.length - comp_count;
//        draw_my_task_chart(comp_count, pen_count);
//    }
//    else {
//        $("#pro_task").html('Completed Sites: 0 <br> Pending Sites: 0');
//        draw_my_task_chart(0, 0);
//    }
//}

//function onfail_get_my_task(e) {
//    $("#pro_task").html('Completed Sites: 0 <br> Pending Sites: 0');
//}

//function draw_my_task_chart1(comp_count, pen_count) {
//    try {
//        $("#pro_task_comp").html('(' + comp_count + ')');
//        $("#pro_task_pen").html('(' + pen_count + ')');

//        var canvas;
//        var ctx;
//        var lastend = 0;
//        var pieColor = ['#4caf50', '#f44336'];
//        var pieData = [comp_count, pen_count];
//        var pieTotal = comp_count + pen_count; // done manually for demo

//        canvas = document.getElementById("canvas");
//        ctx = canvas.getContext("2d");

//        ctx.clearRect(0, 0, canvas.width, canvas.height);

//        var hwidth = ctx.canvas.width / 2;
//        var hheight = ctx.canvas.height / 2;


//        for (var i = 0; i < pieData.length; i++) {
//            ctx.fillStyle = pieColor[i];
//            ctx.beginPath();
//            ctx.moveTo(hwidth, hheight);
//            ctx.arc(hwidth, hheight, hheight, lastend, lastend +
//              (Math.PI * 2 * (pieData[i] / pieTotal)), false);


//            ctx.lineTo(hwidth, hheight);
//            ctx.fill();

//            var radius = hheight / 1.5; //use suitable radius
//            var endAngle = lastend + (Math.PI * (pieData[i] / pieTotal));
//            var setX = hwidth + Math.cos(endAngle) * radius;
//            var setY = hheight + Math.sin(endAngle) * radius;
//            ctx.fillStyle = "#ffffff";
//            ctx.font = '14px Calibri';
//            ctx.fillText(pieData[i], setX, setY);
//            lastend += Math.PI * 2 * (pieData[i] / pieTotal);
//        }
//    }
//    catch (e) {
//        alert1(e + '_draw_my_task_chart()');
//    }
//}

function mk_get_order_by_obj(ddl_order_by, ddl_order_type) {
    try {

        var order_type = $(ddl_order_type).val();

        var col_name = $(ddl_order_by).val();
        if (col_name == "" || col_name == null || col_name == undefined || col_name == 'Select Order By') {
            var data_json = JSON.parse(storage.getItem('list_json'));
            var list_data = JSON.parse(data_json);
            var order_by_array = list_data[0].order_by_array;
            if (order_by_array == "" || order_by_array == null || order_by_array == undefined) {
                var order_by_obj = [];
                order_by_obj.push({
                    "checksheet_type": 0,
                    "checksheet_id": 0,
                    "que_id": 0,
                    "data_type": "ValueString",
                    "order_by": list_order_by,
                    "order_type": list_order_type
                });
            }
            else {
                var order_by_obj = order_by_array;
            }
        }
        else {
            if (col_name == "task_id" || col_name == "assigndate" || col_name == "distance") {
                var order_by_obj = [];
                order_by_obj.push({
                    "checksheet_type": 0,
                    "checksheet_id": 0,
                    "que_id": 0,
                    "data_type": "ValueString",
                    "order_by": col_name,
                    "order_type": order_type
                });
            }
            else {

                var coldata_obj = $(ddl_order_by + " option:selected").attr('name');
                coldata_obj = decodeURIComponent(coldata_obj);
                coldata_obj = JSON.parse(coldata_obj);

                var checksheet_type = coldata_obj.checksheet_type;
                var checksheetID = coldata_obj.checksheetID;
                var qid = coldata_obj.qid;
                var ctrl_type = coldata_obj.ctrl_type;

                var system_var = coldata_obj.system_var;
                if (system_var == "Status_Name") {
                    var value_Array = coldata_obj.value;
                    if (value_Array == "" || value_Array == null || value_Array == undefined) {
                        value_Array = [];
                    }
                }

                if (ctrl_type == 4 || ctrl_type == 12) {
                    var input_type = "int";
                }
                else if (ctrl_type == 13 || ctrl_type == 14 || ctrl_type == 15 || ctrl_type == 16 || ctrl_type == 17) {
                    var input_type = "float";
                }
                else if (ctrl_type == 8 || system_var == "CreateDTTM" || system_var == "survey_date") {
                    var input_type = "date";
                }
                else {
                    //other controls
                    var input_type = "ValueString";
                }

                if (checksheet_type == "" || checksheet_type == null || checksheet_type == undefined) {
                    checksheet_type = 0;
                }

                var order_by_obj = [];
                order_by_obj.push({
                    "checksheet_type": checksheet_type,
                    "checksheet_id": checksheetID,
                    "que_id": qid,
                    "data_type": input_type,
                    "order_by": "column",
                    "order_type": order_type,
                    "column_name": col_name
                });
            }
        }

        return order_by_obj;
    }
    catch (e) {
        alert(e + '_mk_get_order_by_obj()');
        loading_hide();
    }
}


function get_upload_media_live_link(que_id, check_type, t_checksheet_type_id) {
    try {

        var primary_id = JSON.parse(localStorage.getItem('ID_useType22'));
        if (primary_id == "" || primary_id == null || primary_id == undefined) {
            primary_id = JSON.parse(storage.getItem('server_task_id'));
        }

        var user_id = JSON.parse(storage.getItem('user_id'));
        var uniqcode = JSON.parse(storage.getItem('uniqcode'));
        var global_resumable_url = JSON.parse(storage.getItem('global_resumable_url'));

        if (t_checksheet_type_id == "" || t_checksheet_type_id == null || t_checksheet_type_id == undefined) {
            if (form_flag == 7) {
                var checksheet_type_filter = "3";
            } else if (form_flag == 6) {
                var checksheet_type_filter = "5";
            } else if (form_flag == 8) {
                var checksheet_type_filter = "7";
            }
            else {
                var checksheet_type_filter = "1";
            }
        }
        else {
            var checksheet_type_filter = t_checksheet_type_id;
        }

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

        var random_str = "&random=" + new Date().getTime();

        //var media_link = "" + global_resumable_url + "/api/GetFile/Select_File_Details?cid="
        //    + check_type + "&t22id=" + type22_img_que_id + "&t22i=" + t_row_index_no + "&id=" + primary_id + "&qd=" + que_id + "&ctype=" + checksheet_type_filter + "&ud=" + user_id + "&uc=" + uniqcode + random_str + "";

        var media_link = "" + global_resumable_url + "GetFile/Select_File_Details?cid="
            + check_type + "&t22id=" + type22_img_que_id + "&t22i=" + t_row_index_no + "&id=" + primary_id + "&qd=" + que_id + "&ctype=" + checksheet_type_filter + "&ud=" + user_id + "&uc=" + uniqcode + random_str + "";

        return media_link;
    }
    catch (e) {
        alert(e + '_get_upload_media_live_link');
    }
}

function vibrate_device() {
    try {
        var q_jsonobj = [];
        cordova.exec(function (e) { }, function (e) { }, 'VibrationPlugin', 'vibrate', q_jsonobj);
    }
    catch (e) { }
}


function get_profile_pic_path_android_ios(page) {
    let profile_user_name = JSON.parse(storage.getItem('username'));

    if (page == 'selection') {
        // $("#menu_img_profile").parent("a").append("<span class='tabbar-label'>" + profile_user_name + "</span>");
        // $(".navbar-fixed .navbar-inner .right").append("<span style='display: block; width: max-content; position: absolute; right: 6px; bottom: 0; font-size: 12px;'>" + profile_user_name + "</span>")
        $(".view-main .navbar-fixed .navbar-inner .left").append("<span id='spn_Username' style='display: block; width: max-content; position: absolute; left: 10px; bottom: 0; font-size: 12px;'>" + profile_user_name + "</span>")
    }
    else {
        //$(".navbar-fixed .navbar-inner .right").append("<span style='display: block; position: absolute; right: 6px; bottom: 0; font-size: 12px;'>" + profile_user_name + "</span>")
    }

    $("#menu_img_profile").attr("onerror", "imageError()");

    if (F7_device == 'ios') {
        //set profile pic for ios [FT -30052024]
        var pro_pic_path = JSON.parse(storage.getItem('profile_pic_path_ios'));
    }
    else {
        var pro_pic_path = JSON.parse(storage.getItem('profile_pic_path'));
    }

    if (pro_pic_path == "" || pro_pic_path == null || pro_pic_path == undefined) {
        var user_checksheet = localStorage.getItem('profile_checksheetid');
        if (user_checksheet == "" || user_checksheet == null || user_checksheet == undefined) { }
        else {

            var user_id = JSON.parse(storage.getItem('user_id'));
            var primary_id = user_id;
            var uniqcode = JSON.parse(storage.getItem('uniqcode'));
            var global_resumable_url = JSON.parse(storage.getItem('global_resumable_url'));
            var random_str = "&random=" + new Date().getTime();

            pro_pic_path = "" + global_resumable_url + "GetFile/Select_File_Details?cid="
                + user_checksheet + "&t22id=0&t22i=0&id=" + primary_id + "&qd=4008&ctype=7&ud=" + user_id + "&uc=" + uniqcode + random_str + "";

        }
    }

    return pro_pic_path;
}

function imageError() {

    var pro_pic_path = "images/profile_pic.png";
    var user_checksheet = localStorage.getItem('profile_checksheetid');
    if (user_checksheet == "" || user_checksheet == null || user_checksheet == undefined) { }
    else {

        var user_id = JSON.parse(storage.getItem('user_id'));
        var primary_id = user_id;
        var uniqcode = JSON.parse(storage.getItem('uniqcode'));
        var global_resumable_url = JSON.parse(storage.getItem('global_resumable_url'));
        var random_str = "&random=" + new Date().getTime();

        pro_pic_path = "" + global_resumable_url + "GetFile/Select_File_Details?cid="
            + user_checksheet + "&t22id=0&t22i=0&id=" + primary_id + "&qd=4008&ctype=7&ud=" + user_id + "&uc=" + uniqcode + random_str + "";

    }

    $('#menu_img_profile').attr('src', pro_pic_path);
    $('#menu_img_profile').attr('onerror', "imageError_set_defualt('#menu_img_profile')");

}

function imageError_set_defualt(img_ele) {
    var pro_pic_path = "images/profile_pic.png";
    $(img_ele).attr('src', pro_pic_path);
    $(img_ele).removeAttr("onerror");
}

function redirect_page_pdf_preview(task_id, c_id, page_type) {
    try {

        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);

        var circlewise_pdf = list_data[0].circlewise_pdf;
        if (circlewise_pdf == "" || circlewise_pdf == null || circlewise_pdf == undefined) {
            var DynamicPdfTypeId = list_data[0].pdf_type;
        }
        else {
            var circle_column = circlewise_pdf[0].circle_column;
            var pdf_data = circlewise_pdf[0].pdf_data;

            var columndata_str = $('#lst_sys_var_' + task_id + '').val();
            var columndata_Array = JSON.parse(decodeURIComponent(columndata_str));
            var circle_name = '';
            for (c = 0; c < columndata_Array.length; c++) {
                var key = columndata_Array[c].header;
                if (key == circle_column) {
                    circle_name = columndata_Array[c].ans;
                    break;
                }
            }

            if (circle_name == "") {
                alert("Circle column not found in columndata!");
            }
            else {
                for (p = 0; p < pdf_data.length; p++) {
                    var circle = pdf_data[0].circle;
                    if (circle == circle_name) {
                        var DynamicPdfTypeId = pdf_data[p].pdf_type;
                        break;
                    }
                }
            }
        }

        var win_name = 'pages/EF_PDF_Report.aspx';
        var feature_id = localStorage.getItem('company_feature_id');
        var role_id = JSON.parse(storage.getItem('role_id'));

        if (c_id == "" || c_id == null || c_id == undefined || c_id == "undefined") {
            c_id = "0";
        }

        let domain_url = JSON.parse(storage.getItem('global_url'));
        domain_url = domain_url.replace('/services/', '');
        var company_id = JSON.parse(storage.getItem('company_id'));
        let user_id = JSON.parse(storage.getItem('user_id'));
        var user_name = JSON.parse(storage.getItem('username'));
        var u_c = JSON.parse(storage.getItem('uniqcode'));

        var PDF_path = domain_url + win_name + '?Dynamic_PDF_Type_Id=' + DynamicPdfTypeId + '&id=' + feature_id + '&hdrl=' + role_id + '&Task_id=' + task_id + '&cus_id=' + c_id + '&u_id=' + user_id + '&u_name=' + user_name + '&u_c=' + u_c + '&comp_id=' + company_id + '&menu=0&header=0?n=' + new Date().getTime() + ';';

        if (page_type == "checksheet") {
            var pdf_id = JSON.parse(storage.getItem('pdf_id'));
            var answer = [];
            answer.push(PDF_path);

            var curr_form_flag = form_flag;
            if (curr_form_flag == 0 || curr_form_flag == 6 || curr_form_flag == 7) {
                let task_create_popup = $('.popup-new-task-create.modal-in:visible');
                if (task_create_popup.length > 0) {
                    //new task create popup [FT-08052025]
                    jsonObj_task_add[pdf_id].ans = answer;
                }
                else {
                    // normal form
                    jsonObj_old[pdf_id].ans = answer;
                }
            } else if (curr_form_flag == 1 || curr_form_flag == 4 || curr_form_flag == 5) {
                // type22 form
                jsonObj_type22[pdf_id].ans = answer;
            } else if (curr_form_flag == 2 || curr_form_flag == 3) {
                // type23 form
                jsonObj_type23[pdf_id].ans = answer;
            }
        }

        if (F7_device == 'ios') {
            redirect_on_HTML_PDF_preview_ios(PDF_path);
        }
        else {
            window.open(PDF_path, '_blank');
        }
    }
    catch (e) {
        alert(e + '_redirect_page_pdf_preview');
    }
}

function redirect_on_HTML_PDF_preview_ios(t_path) {
    try {
        var q_jsonobj = [];
        q_jsonobj.push({
            'path': t_path,
            'id': 0
        });
        cordova.exec(onsuccess_redirect_on_HTML_PDF_preview_ios, onfail_redirect_on_HTML_PDF_preview_ios, 'openURLSafariPlug', 'anAction', q_jsonobj);

    }
    catch (e) {
        alert1(e + '_redirect_on_HTML_PDF_preview_ios');
    }
}

function onsuccess_redirect_on_HTML_PDF_preview_ios(e) {
    loading_hide();
}

function onfail_redirect_on_HTML_PDF_preview_ios(e) {
    loading_hide();
    alert1(e + '_onfail_redirect_on_HTML_PDF_preview_ios');
}

function millisecondsToDays(milliseconds) {
    return milliseconds / (24 * 60 * 60 * 1000);
}

function type36_exist_json(jsonObj) {
    var exists = false;
    jsonObj = JSON.parse(jsonObj);
    // Check if the key exists in the object       
    if (jsonObj.some(x => x['type'] == 36)) {
        exists = true;
    }
    return exists;
}

function merge_checksheet_template_n_log_form_json(template_json, log_json) {
    try {
        for (let i = 0; i < template_json.length; i++) {
            var temp_que_id = template_json[i].que_id;
            var temp_type = template_json[i].type;
            if (temp_type == 0 || temp_type == 5 || temp_type == 10 || temp_type == 500) { }
            else {
                for (j = 0; j < log_json.length; j++) {
                    var log_que_id = log_json[j].que_id;
                    var log_type = log_json[j].type;
                    if (log_type == 0 || log_type == 5 || log_type == 10 || log_type == 500) { }
                    else {
                        if (log_que_id == temp_que_id) {
                            var log_ans = log_json[j].ans;
                            template_json[i].ans = log_ans;
                            break;
                        }
                    }
                }
            }
        }
        return template_json;
    }
    catch (e) {
        alert(e + '_merge_checksheet_template_n_log_form_json');
    }
}

check_n_upload_clone_photo = (new_id) => {

    var autofill_photo_Array = $("img[autofill='true']");
    if (autofill_photo_Array.length > 0) {

        let img_obj = autofill_photo_Array[0];
        let param_obj = $(img_obj).attr("autofill_obj");
        param_obj = JSON.parse(param_obj);

        let old_id = param_obj[0].old_id;
        let old_cid = param_obj[0].old_cid;
        let old_qd = param_obj[0].old_qd;
        let new_ctype = param_obj[0].new_ctype;
        let new_cid = param_obj[0].new_cid;
        let new_qd = param_obj[0].new_qd;

        upload_autofill_photo(old_id, old_cid, old_qd, new_id, new_ctype, new_cid, new_qd);
    }
}


upload_autofill_photo = (old_id, old_cid, old_qd, new_id, new_ctype, new_cid, new_qd) => {
    try {
        var param_obj = [];
        param_obj.push({
            "old_id": old_id,
            "old_cid": old_cid,
            "old_qd": old_qd,
            "old_t22id": "0",
            "old_t22i": "0",
            "new_id": new_id,
            "new_ctype": new_ctype,
            "new_cid": new_cid,
            "new_qd": new_qd,
            "new_t22id": "0",
            "new_t22i": "0"
        });

        loading();
        var getdata = new Webservicecall_REST(global_wcf_url + 'Photo_Clone', JSON.stringify(param_obj), function (e) {
            var Suc_Message = e.responseText;
            Suc_Message = eval('(' + Suc_Message + ')');
            var message = Suc_Message[0].message;
            var status = Suc_Message[0].status;
            if (status == 1) {
                var data = Suc_Message[0].data;
                data = JSON.parse(data);

                // actual photo_master id
                let Photo_id = data[0].PHOTO_ID;

            }
            else {
                mk_notify(message, "danger");
                loading_hide();
            }
        }, onfail_request);
        getdata.callOtherDomain();
    }
    catch (e) {
        loading_hide();
        alert(e + '_upload_autofill_photo');
    }
}

function view_invoice_summary_photo(img_div) {
    try {
        var clickedLink = $("#" + img_div + "");
        var img_src = $("#" + img_div + "").attr('src');
        myApp.popover('.popover-type7', clickedLink);
        $("#popover_viewphoto").attr("onclick", "get_full_view_image_type7_F7('" + img_src + "')");
        $("#popover_re_capture").hide();
    }
    catch (e) {
        alert(e + '_view_invoice_summary_photo');
    }
}

function get_column_array_for_type8_as_per_dateFormat(datetime_format, display_value) {
    try {
        var datetime_format_ary = datetime_format.split(" ");
        var time_format = datetime_format_ary[1];

        var day_ary = [01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31];
        var year_ary = (function () {
            var arr = [];
            for (var i = 2000; i <= 2030; i++) { arr.push(i); }
            return arr;
        })();

        var hour_ary = (function () {
            var arr = [];
            for (var i = 0; i <= 23; i++) {
                if (i < 10) {
                    i = '0' + i;
                }
                arr.push(i);
            }
            return arr;
        })();

        var minute_ary = (function () {
            var arr = [];
            for (var i = 0; i <= 59; i++) {
                if (i < 10) {
                    i = '0' + i;
                }
                arr.push(i);
            }
            return arr;
        })();
        var seconds_ary = (function () {
            var arr = [];
            for (var i = 0; i <= 59; i++) {
                if (i < 10) {
                    i = '0' + i;
                }
                arr.push(i);
            }
            return arr;
        })();


        if (datetime_format.indexOf("dd/mm/yyyy") > -1) {
            if (time_format == "HH:mm:ss") {
                var column_ary = [
                    // Days
                    {
                        values: day_ary,
                    },
                    // Months
                    {
                        values: ('0 1 2 3 4 5 6 7 8 9 10 11').split(' '),
                        displayValues: display_value.split(' '),
                        textAlign: 'left'
                    },
                    // Years
                    {
                        values: year_ary,
                    },
                    // Space divider
                    {
                        divider: true,
                        content: '  '
                    },
                    // Hours
                    {
                        values: hour_ary,
                    },
                    // Divider
                    {
                        divider: true,
                        content: ':'
                    },
                    // Minutes
                    {
                        values: minute_ary,
                    },
                    // Divider
                    {
                        divider: true,
                        content: ':'
                    },
                    // Seconds
                    {
                        values: seconds_ary,
                    }
                ];
            }
            else {
                var column_ary = [
                    // Days
                    {
                        values: day_ary,
                    },
                    // Months
                    {
                        values: ('0 1 2 3 4 5 6 7 8 9 10 11').split(' '),
                        displayValues: display_value.split(' '),
                        textAlign: 'left'
                    },
                    // Years
                    {
                        values: year_ary,
                    },
                    // Space divider
                    {
                        divider: true,
                        content: '  '
                    },
                    // Hours
                    {
                        values: hour_ary,
                    },
                    // Divider
                    {
                        divider: true,
                        content: ':'
                    },
                    // Minutes
                    {
                        values: minute_ary,
                    }
                ];
            }
        }
        else {
            if (time_format == "HH:mm:ss") {
                var column_ary = [
                    // Months
                    {
                        values: ('0 1 2 3 4 5 6 7 8 9 10 11').split(' '),
                        displayValues: display_value.split(' '),
                        textAlign: 'left'
                    },
                    // Days
                    {
                        values: day_ary,
                    },
                    // Years
                    {
                        values: year_ary,
                    },
                    // Space divider
                    {
                        divider: true,
                        content: '  '
                    },
                    // Hours
                    {
                        values: hour_ary,
                    },
                    // Divider
                    {
                        divider: true,
                        content: ':'
                    },
                    // Minutes
                    {
                        values: minute_ary,
                    },
                    // Divider
                    {
                        divider: true,
                        content: ':'
                    },
                    // Seconds
                    {
                        values: seconds_ary,
                    }
                ];
            }
            else {
                var column_ary = [
                    // Months
                    {
                        values: ('0 1 2 3 4 5 6 7 8 9 10 11').split(' '),
                        displayValues: display_value.split(' '),
                        textAlign: 'left'
                    },
                    // Days
                    {
                        values: day_ary,
                    },
                    // Years
                    {
                        values: year_ary,
                    },
                    // Space divider
                    {
                        divider: true,
                        content: '  '
                    },
                    // Hours
                    {
                        values: hour_ary,
                    },
                    // Divider
                    {
                        divider: true,
                        content: ':'
                    },
                    // Minutes
                    {
                        values: minute_ary,
                    }
                ];
            }
        }


        return column_ary;
    }
    catch (e) {
        alert(e + '_get_column_array_for_type8_as_per_dateFormat');
    }
}

upload_autofill_photo_temp = (old_id, old_cid, old_qd, new_ctype, new_cid, new_qd, autofill_form_flag, t_curr_box_id) => {
    try {
        var param_obj = [];
        param_obj.push({
            "old_id": old_id,
            "old_cid": old_cid,
            "old_qd": old_qd,
            "old_t22id": "0",
            "old_t22i": "0",
            "new_ctype": new_ctype,
            "new_cid": new_cid,
            "new_qd": new_qd,
            "new_t22id": "0",
            "new_t22i": "0"
        });

        $("#" + t_curr_box_id + "").parent("div").find('i.fa-spinner').remove();
        $("#" + t_curr_box_id + "").parent("div").append('<i class="fa fa-spinner fa-pulse img-loading"></i>');
        //myApp.showPreloader('Fetching Image...');
        var getdata = new Webservicecall_REST(global_wcf_url + 'Photo_Temp_Clone', JSON.stringify(param_obj), function (e) {
            var Suc_Message = e.responseText;
            Suc_Message = eval('(' + Suc_Message + ')');
            var message = Suc_Message[0].message;
            var status = Suc_Message[0].status;
            if (status == 1) {
                var data = Suc_Message[0].data;
                data = JSON.parse(data);

                // actual photo_master id
                let Photo_id = data[0].PHOTO_TEMP_ID;
                if (Photo_id == '' || Photo_id == null || Photo_id == undefined) { }
                else {
                    Photo_Id_Array.push({ "photo_id": Photo_id });

                    if (autofill_form_flag == 0 || autofill_form_flag == 6) {
                        for (var j = 0; j < jsonObj_old.length; j++) {
                            var json_que_id = jsonObj_old[j].que_id;
                            if (new_qd == json_que_id) {
                                let task_create_popup = $('.popup-new-task-create.modal-in:visible');
                                if (task_create_popup.length > 0) {
                                    //replace new photo_id in ans json [FT-11072025]
                                    jsonObj_task_add[j].ans[4] = Photo_id;
                                }
                                else {
                                    jsonObj_old[j].ans[4] = Photo_id;
                                }
                                break;
                            }
                        }
                    }
                }
            }
            else {
                mk_notify(message, "danger");
                loading_hide();
            }

            setTimeout(function () {
                $("#" + t_curr_box_id + "").parent("div").find('i.fa-spinner').remove();
            }, 1000, t_curr_box_id);

            //myApp.hidePreloader();

        }, onfail_request);
        getdata.callOtherDomain();
    }
    catch (e) {
        loading_hide();
        alert(e + '_upload_autofill_photo_temp');
    }
}

rebind_autofill_photo_temp = (t_cam_id, t_src) => {
    setTimeout(function () {
        $(t_cam_id).attr("src", t_src);

        let attempt_count = $(t_cam_id).attr("attempt");
        if (attempt_count == "" || attempt_count == null || attempt_count == undefined) {
            $(t_cam_id).attr("attempt", 0);
        }
        else {
            attempt_count = parseInt(attempt_count);
            if (attempt_count > 2) {
                $(t_cam_id).removeAttr("onerror");
            }
            else {
                $(t_cam_id).attr("attempt", attempt_count + 1);
            }
        }
    }, 2000, t_cam_id, t_src);
}

function get_common_localStorage(key_name) {
    try {
        //used this common localStorage for 3 later task listing (darshit.eng) [Ft-14052025]
        var curr_flow_id = JSON.parse(storage.getItem('wayflow'));
        var LS_value = localStorage.getItem(key_name + curr_flow_id);
        return LS_value;
    }
    catch (e) {
        alert(e + '_get_common_localStorage')
    }
}

function set_common_localStorage(key_name, key_value) {
    try {
        //used this common localStorage for 3 later task listing (darshit.eng) [Ft-14052025]
        var curr_flow_id = JSON.parse(storage.getItem('wayflow'));
        localStorage.setItem(key_name + curr_flow_id, key_value);
    }
    catch (e) {
        alert(e + '_set_common_localStorage')
    }
}

bind_scroll_to_bottom_event = (t_div_obj) => {
    $(t_div_obj).unbind('scroll');
    $(t_div_obj).scroll(function () {
        var offsetHeight = $(t_div_obj)[0].offsetHeight;
        var scrollTop = $(t_div_obj)[0].scrollTop;
        var scrollHeight = $(t_div_obj)[0].scrollHeight;

        let result = (parseInt(scrollHeight) - parseInt(offsetHeight) - 1);
        let margin = result - parseInt(scrollTop);
        //console.log(margin);

        // added 2nd or condition as show more not callled due to 1 pixel change 29112022
        if (margin < 20) {
            $("#btn_ScrollToBottom").css("visibility", "hidden");
        }
        else {
            $("#btn_ScrollToBottom").css("visibility", "visible");
        }
    });

    $("#btn_ScrollToBottom").css("visibility", "hidden");
}

scroll_to_bottom = (t_div_obj) => {
    $('.view-main .page-content').animate({
        scrollTop: $(t_div_obj)[0].scrollHeight
    }, 500);
}

// These pages return to the existing form or Settings panel that opened them.
function open_info_popup(selector) {
    var popup = $(selector);
    if (!popup.hasClass('modal-in')) {
        popup.data('return-to-settings', $('.panel-left.active:visible').length > 0);
    }
    myApp.popup(selector);
}

function close_info_popup(selector) {
    var popup = $(selector);
    var returnToSettings = popup.data('return-to-settings');
    popup.removeData('return-to-settings');
    myApp.closeModal(selector);
    popup.hide();
    if (returnToSettings) myApp.openPanel('left');
}

function get_safety_passport() {
    open_info_popup('.popup-safety-passport');

    // dynamic url in case domain is changed in future - mk - 25022026
    $(".popup-safety-passport .passport-card img").not("#img_sp_profilephoto").each(function () {
        var src = $(this).attr("src");
        let hostname = new URL(global_wcf_url).hostname;

        // Images bundled with the app (relative paths) stay local.
        if (src && /^https?:\/\//i.test(src)) {
            var url = new URL(src);
            url.hostname = hostname;

            $(this).attr("src", url.toString());
        }
    });

    loading();

    let user_id = JSON.parse(storage.getItem('user_id'));
    let company_id = JSON.parse(storage.getItem('company_id'));

    var Param_obj = [];
    Param_obj.push({
        'User_Id': user_id,
        'Company_id': company_id,
    });

    var getdata1 = new Webservicecall_REST(global_wcf_url + 'User_Data', JSON.stringify(Param_obj), function (e) {
        var Search_data = e.responseText;
        Search_data = eval('(' + Search_data + ')');
        var message = Search_data[0].message;
        var status = Search_data[0].status;
        if (status == 1) {
            message = message.replace('[[', '[');
            message = message.replace(']]', ']');
            message = eval('(' + Search_data[0].data + ')');
            var user_data = message;
        }
        else {
            var user_data = localStorage.getItem('profile_user_data');
            user_data = JSON.parse(user_data);
        }
        loading_hide();

        if (user_data == "" || user_data == null || user_data == undefined) {
            alert("User data is not available!");
        }
        else {

            var prop = user_data[0].prop;
            if (prop == "" || prop == null || prop == undefined) {
                // 3 key json
                get_blank_checksheet_profile(user_data, "safety_passport");
            }
            else {
                // full json
                build_user_safety_passport(user_data);
            }
        }
    }, onfail_request);
    getdata1.callOtherDomain();
}

function build_user_safety_passport(user_data) {

    var itemObj = new MKCheckItem();

    let sp_id = name = role_name = circle_name = partner_name = contact_numner = blood_group = '';

    for (var i = 0; i < user_data.length; i++) {
        var type = user_data[i].type;
        var que_id = user_data[i].que_id;
        if (type == 0 || type == 5 || type == 10 || que_id == 5 || que_id == 10018 || que_id == 4008) { }
        else {

            var header = user_data[i].prop[0].name;
            var value = user_data[i].ans[0];

            if (que_id == 3) {
                // make username in small case in case of user created in Camel or Uppar case 16012023
                value = value.toLowerCase();
            }

            if (value == "" || value == null || value == undefined) {
                value = "";
            }
            else {
                if (type == 22) {

                    var type22_table_str = "<table class='tbl-type22' border='0'>";

                    var row_final_json = user_data[i].ans[0];
                    if (row_final_json == "" || row_final_json == null || row_final_json == undefined || row_final_json == '""') {

                    }
                    else {
                        row_final_json = itemObj._checkStrObj(row_final_json);

                        var role_list_json = row_final_json[0].row_finaljson;
                        if (role_list_json.length > 0) {
                            var btn_json = role_list_json[0].json_type_22[0].edt_btn_json;

                            if (btn_json.length == 1) {
                                // don't display header in case of single control/column
                            }
                            else {
                                // display header in case of multiple controls/columns

                                // header
                                type22_table_str += "<tr>";
                                for (e = 0; e < btn_json.length; e++) {
                                    var prop_obj = btn_json[e].prop;
                                    if (prop_obj == "" || prop_obj == null || prop_obj == undefined) {
                                        var txt_row = role_list_json[0].json_type_22[0].txt_row;
                                        var header = txt_row[e].row_name;
                                    }
                                    else {
                                        var header = btn_json[e].prop[0].name;
                                    }

                                    type22_table_str += "<th>" + header + "</th>";
                                }
                                type22_table_str += "</tr>";
                            }

                            for (var txtrow = 0; txtrow < role_list_json.length; txtrow++) {

                                var btn_json = role_list_json[txtrow].json_type_22[0].edt_btn_json;

                                // body
                                type22_table_str += "<tr>";
                                for (e = 0; e < btn_json.length; e++) {

                                    var type22_Type = btn_json[e].type;
                                    if (type22_Type == "6") {
                                        var type22_Ans = btn_json[e].ans;
                                        type22_table_str += "<td style='min-width: 50px'>" + type22_Ans + "</td>";
                                    }
                                    else if ((type22_Type == "7") || (type22_Type == "26") || (type22_Type == "28") || (type22_Type == "9")) {

                                        var type22_Ans = btn_json[e].ans;
                                        if (type22_Ans == "" || type22_Ans == null || type22_Ans == undefined || type22_Ans[0] == "" || type22_Ans[0] == null || type22_Ans[0] == undefined) {
                                            type22_table_str += "<td style='min-width: 50px'></td>";
                                        }
                                        else {
                                            // dynamic photo thumbnail by live url 25012021
                                            var type22_img_que_id = btn_json[e].que_id;
                                            var t_row_index_no = txtrow + 1;
                                            var user_id = window.localStorage.getItem("user_id");
                                            var uniqcode = JSON.parse(localStorage.getItem('uniqcode'));
                                            var random_str = "&random=" + new Date().getTime();

                                            //var img_Id = "" + global_resumable_url + "/api/GetFile/Select_File_Details?cid=" + check_type + "&t22id=" + que_id + "&t22i=" + t_row_index_no + "&id=" + primary_id + "&qd=" + type22_img_que_id + "&ctype=" + ctype + "&ud=" + user_id + "&uc=" + uniqcode + random_str + "";
                                            var img_Id = "" + global_resumable_url + "GetFile/Select_File_Details?cid=" + check_type + "&t22id=" + que_id + "&t22i=" + t_row_index_no + "&id=" + primary_id + "&qd=" + type22_img_que_id + "&ctype=" + ctype + "&ud=" + user_id + "&uc=" + uniqcode + random_str + "";

                                            var param_mouseover = 'get_zoom_img_onhover("' + img_Id + '", event)';
                                            var param_mouseout = 'remove_zoom_img_onout()';

                                            if (type22_Type == "7") {
                                                type22_table_str += "<td><img class='img-thumb' id='img_thumb_type22_" + j + "' src=" + img_Id + " onmousemove='" + param_mouseover + "'  onmouseout='" + param_mouseout + "' style='width: 40px; height:40px' /></td>";
                                            }
                                            else if (type22_Type == "9") {
                                                type22_table_str += "<td><img class='img-thumb' id='img_thumb_type22_" + j + "' src=" + img_Id + " onmousemove='" + param_mouseover + "'  onmouseout='" + param_mouseout + "' style='width: 40px; height:40px; border:1px solid #ccc' /></td>";
                                            }
                                            else if (type22_Type == "26") {
                                                //type22_table_str += "<td style='vertical-align:middle'><a onclick='Open_popup_View(" + primary_id + "," + type_ + "," + que_id + ")'><i class='fa fa-file-text-o'></i></a></td>";

                                                var param_doc = "window.open('" + img_Id + "')";
                                                type22_table_str += '<td style="vertical-align:middle"><a class="btn" onclick="' + param_doc + '" title="View Document"><i class="fa fa-file-text-o"></i></a></td>';
                                            }
                                            else {
                                                //type22_table_str += "<td style='vertical-align:middle'><a onclick='Open_popup_View(" + primary_id + "," + type_ + "," + que_id + ")'><i class='fa fa-file-video-o'></i></a></td>";

                                                var param_video = "window.open('" + img_Id + "')";
                                                type22_table_str += '<td style="vertical-align:middle"><a class="btn" onclick="' + param_video + '" title="View Video"><i class="fa fa-file-video-o"></i></a></td>';
                                            }
                                        }
                                    }
                                    else {
                                        var type22_Ans = btn_json[e].ans[0];
                                        type22_table_str += "<td style='min-width: 50px'>" + type22_Ans + "</td>";

                                    }
                                }

                                type22_table_str += "</tr>";
                            }
                        }
                    }

                    type22_table_str += "</table>";

                    value = type22_table_str;
                }
                else if (type == 1) {
                    var misc_Array = user_data[i].prop[0].misc_data;
                    var prop_value = misc_Array[0].value;
                    if (prop_value == '' || prop_value == null || prop_value == undefined) {
                        var box_type = "";
                    }
                    else {
                        prop_value = itemObj._checkStrObj(misc_Array[0].value);  // check_item
                        var box_type = prop_value[0].box_type;
                    }
                }
            }

            //if (type == 22) {
            //    detail_str += '<tr><td style="color:blue; widht: 50%;">' + header + '</td><td style="width: 50%">' + value + '</td></tr>';
            //}

            if (que_id == 10044) {
                // Safety Passport ID
                sp_id = value;
            }
            else if (que_id == 20) {
                // Full Name
                name = value;
            }
            else if (que_id == 10021) {
                // Role List
                value = value.replaceAll("Vender Technician", "Vendor Technician");
                role_name = value;
            }
            else if (que_id == 42) {
                // Circle Map
                circle_name = value;
            }
            else if (que_id == 10016) {
                // Vendor Name
                partner_name = value;
            }
            else if (que_id == 10036) {
                // Emergency Contact Number
                contact_numner = value;
            }
            else if (que_id == 10037) {
                // Blood Group
                blood_group = value;
            }


        }
    }

    if (sp_id == "" || sp_id == null || sp_id == undefined) {
        // do not fill safety passport data if safety passport id is not available 
    }
    else {

        let t_bottom_pro_img = $("#menu_img_profile").attr("src");
        $("#img_sp_profilephoto").attr("src", t_bottom_pro_img)

        $("#lbl_sp_empid").html(sp_id);
        $("#lbl_sp_name").html(name);
        $("#lbl_sp_userrole").html(role_name);
        $("#lbl_sp_circle").html(circle_name);
        $("#lbl_sp_partnername").html(partner_name);
        $("#lbl_sp_contactnumber").html(contact_numner);
        $("#lbl_sp_bloodgroup").html(blood_group);
    }

}

// share safety passport part
download_n_share_safety_passport_pdf = () => {
    let container = $(".popup-safety-passport .page-content")

    convertAndReplaceImages(container, function () {
        // success
        let element_html = $(".popup-safety-passport .page-content").html();
        element_html = element_html.replace(/(\r\n|\n|\r)/gm, '');
        element_html = element_html.replace(/(\r\n|\n|\r|\t)/gm, ' ').replace(/\s+/g, ' ');

        let custom_style = '<style>.passport-card{margin:16px;border-radius:14px;background:linear-gradient(135deg,#0a3d91,#06275e);color:#fff;}.passport-header{display:flex;align-items:center;margin-bottom:5px;}.passport-photo img{width:50px;height:50px;border-radius:4px;/*border:2pxsolid#fff;*/}.passport-title{margin-left:35px;text-align:center;}.passport-title .country{font-size:13px;font-weight:bold;letter-spacing:1px;opacity:0.7;text-transform:uppercase;}.passport-title .doctype{font-size:18px;margin-top:4px;font-weight:bold;}.passport-badge{position:absolute;top:16px;right:16px;}.passport-badge img{width:50px;height:50px;}.passport-body .label{font-size:10px;opacity:0.7;text-transform:uppercase;}.passport-body .value, .tbl-type22 td{font-size:12px;font-weight:600;margin-bottom:7px;}.passport-body .value span, .tbl-type22 td{min-height:14px;display:block; color: white}.passport-body .row:last-child .value{margin-bottom:0px;}.passport-back img{width:100%;height:75px;margin:5px0px;}.card{width:400px;font-family:Roboto,Noto,Helvetica,Arial,sans-serif;position:relative;font-size:14px;}.card-content{position:relative;}.card-content-inner{padding:16px;position:relative;}.row{display:flex;-webkit-box-pack:justify;-ms-flex-pack:justify;justify-content:space-between;-moz-box-lines:multiple;-ms-flex-wrap:wrap;flex-wrap:wrap;-webkit-box-align:start;-ms-flex-align:start;align-items:flex-start;}.col-50{width:50%;}.row > [class*=col-]{box-sizing:border-box;}</style>';

        element_html = custom_style + element_html;

        var q_jsonobj = [];
        q_jsonobj.push({
            html_string: element_html
        });
        cordova.exec(function (e) {
            // success
        }, function (e) {
            // fail
        }, 'HtmlToPdfEmailPlugin', 'anAction', q_jsonobj);
    });
}


function imgToBase64(img) {
    var canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    canvas.getContext("2d").drawImage(img, 0, 0);
    let base64_str = canvas.toDataURL("image/png");
    $(img).attr("src", base64_str);
}

function convertAndReplaceImages(containerSelector, done) {

    var $imgs = $(containerSelector).find('#img_sp_profilephoto');
    var total = $imgs.length;
    var completed = 0;

    if (total === 0) {
        done();
        return;
    }

    $imgs.each(function () {
        var img = this;
        var src = img.src;

        if (src.startsWith('data:image')) {
            // in case of 2nd time share
        }
        else {
            imgToBase64(img);
        }

        completed++;

        if (completed === total) {
            done();
            return;
        }
    });
}


function checkCall() {
    // Call the native Android interface
    var is_jitsi_plugin_call = AndroidCallChecker.isJitsiCallRunning();
    return is_jitsi_plugin_call;
}

function open_pinch_zoom_div_safety_passport() {

    if (typeof html2canvas === 'undefined') {
        // script is not loaded

        loadScriptOnce('Plugin_Js/pinch-zoom.umd.js', () => {
            // script loaded

            loadScriptOnce('js/html2canvas.js', () => {
                // script loaded
                open_pinch_zoom_div_safety_passport();
            });
        });

    }

    if (typeof html2canvas !== 'undefined') {
        // scripts are loaded

        let element_html = $(".popup-safety-passport .page-content");
        //const originalBg = element_html.style.background;
        //element_html.style.background = '#0b3a7e'; // solid blue
        $(".passport-body .fa.fa-share-alt").hide();

        html2canvas(element_html, {
            useCORS: true,
            allowTaint: false,
            scale: 2,
            backgroundColor: 'white',
            removeContainer: true,
            logging: false
        }).then(canvas => {
            //element_html.style.background = originalBg;
            $(".passport-body .fa.fa-share-alt").show();

            const imgSrc = canvas.toDataURL('image/png');

            open_pinch_zoom_div(imgSrc);

        });
    }



}

var imageViewerZoom = null;
function open_pinch_zoom_div(t_src) {
    if (imageViewerZoom) imageViewerZoom.destroy();
    $(".pinch-zoom-container").remove();
    $(".pinch_close").remove();
    let zoom_str = '<div class="pinch-zoom"><button id="pinch_close" type="button" aria-label="Back" onclick="close_zoom()"><span class="app-back-icon" aria-hidden="true"></span></button><img src = "' + t_src + '" /></div>';
    $("body").prepend(zoom_str);
    try {
        cordova.exec(function () { }, function () { }, 'SystemBarPlugin', 'imageViewer',
            [true, '#080C18']);
    } catch (e) { }

    imageViewerZoom = new PinchZoom.default(document.querySelector('.pinch-zoom'), {
        minZoom: 1,
        maxZoom: 4
    });

    let image = $(".pinch-zoom img");
    function centerImage() {
        let middle_height = ($(".pinch-zoom-container").height() - image.height()) / 2;
        image.css({ 'position': 'absolute', 'top': middle_height + 'px' });
    }
    image.on('load', centerImage);
    if (image[0].complete) centerImage();

}

function close_zoom() {
    if (imageViewerZoom) imageViewerZoom.destroy();
    imageViewerZoom = null;
    $(".pinch-zoom-container").remove();
    $(".pinch-zoom").hide();
    try {
        cordova.exec(function () { }, function () { }, 'SystemBarPlugin', 'imageViewer', [false]);
    } catch (e) { }
}

// for safety passport view from profile menu
function loadScriptOnce(src, callback) {
    if (document.querySelector(`script[src*="${src}"]`)) {
        //console.log('Already loaded');
        callback && callback();
        return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;

    script.onload = () => {
        //console.log('Script loaded ✅', src);
        callback && callback();
    };

    script.onerror = () => {
        //console.error('Failed to load ❌', src);
    };

    document.head.appendChild(script);
}

function isCurrentTimeInSlot(startTime, hoursToAdd) {

    const now = new Date();

    const start = new Date();
    const [h, m] = startTime.split(":");
    start.setHours(h, m, 0);

    const end = new Date(start);
    end.setHours(end.getHours() + hoursToAdd);

    return now >= start && now <= end;
}


// privacy policy
function get_privacy_policy() {

    open_info_popup('.popup-privacy-policy');

    let user_consent = localStorage.getItem("user_consent");
    if (user_consent != "true") {
        // consent pending
    }
    else {
        // user has consent privacy policy
        $(".cls_consent_button").hide();
        $("input[type='checkbox'][name='consent']").prop("checked", true).prop("disabled", true);;
    }
    if (typeof pp_prepare === 'function') pp_prepare();
}

// change language from checksheet page
change_user_language = (lang) => {

    var Param_obj = [];
    Param_obj.push({
        'Language': lang
    });

    loading();
    var getdata1 = new Webservicecall_REST(global_wcf_url + 'Update_User_Language', JSON.stringify(Param_obj), function (e) {
        var Search_data = e.responseText;
        Search_data = eval('(' + Search_data + ')');
        var message = Search_data[0].message;
        var status = Search_data[0].status;
        if (status == 1) {
            localStorage.setItem("user_language", lang);
            location.reload();
        }
        else {
            alert(message);
        }
        loading_hide();
    }, onfail_request);
    getdata1.callOtherDomain();
}

// change language from profile menu
change_user_language_menu = (lang) => {
    
    var Param_obj = [];
    Param_obj.push({
        'Language': lang
    });

    loading();
    var getdata1 = new Webservicecall_REST(global_wcf_url + 'Update_User_Language', JSON.stringify(Param_obj), function (e) {
        var Search_data = e.responseText;
        Search_data = eval('(' + Search_data + ')');
        var message = Search_data[0].message;
        var status = Search_data[0].status;
        if (status == 1) {
            localStorage.setItem("user_language", lang);
            myApp.closeModal('.popover-language.modal-in');
            $("#pro_language").html(languages[lang]);
        }
        else {
            alert(message);
        }
        loading_hide();
    }, onfail_request);
    getdata1.callOtherDomain();
}

// create table by device info json
function create_table_by_device_info() {

    var device_info = localStorage.getItem("deviceinfo");
    if (device_info == "" || device_info == null || device_info == undefined || device_info == '""') {
        // Device info is not found
    }
    else {
        
        var json = JSON.parse(device_info);

        var table = $("#tbl_deviceInfo");

        var profileRows = table.find('tr.profile-user-device').detach();
        $(table).empty();


        //var table = $(table);
        //$(table).addClass('mk_table');

        var td_val = Array.isArray(json);
        if (td_val == true) {
        }
        else {
            json = JSON.parse(json);
        }

        $.each(json, function (ind_row, val) {
            $.each(val, function (ind_cell, val_cell) {
                if (ind_cell == "icon_base64") {

                }
                else {
                    var displayLabel = profile_label(ind_cell);
                    if (/^(ACCELEROMETER|GYROSCOPE)$/.test(ind_cell) && /^(true|false)$/i.test(String(val_cell))) {
                        val_cell = String(val_cell).toLowerCase() === 'true' ? 'Yes' : 'No';
                    } else if (ind_cell === 'ARCORE') {
                        val_cell = {
                            SUPPORTED_INSTALLED: 'Supported, installed',
                            SUPPORTED_APK_TOO_OLD: 'Update required',
                            SUPPORTED_NOT_INSTALLED: 'Supported, not installed',
                            UNSUPPORTED_DEVICE_NOT_CAPABLE: 'Not supported',
                            UNKNOWN_CHECKING: 'Checking', UNKNOWN_TIMED_OUT: 'Check timed out', UNKNOWN_ERROR: 'Unavailable'
                        }[val_cell] || val_cell;
                    } else if ((ind_cell === 'BRAND' || ind_cell === 'MODEL') && typeof val_cell === 'string') {
                        val_cell = val_cell.charAt(0).toUpperCase() + val_cell.slice(1);
                    }
                    var td_val = Array.isArray(val_cell);
                    if (td_val == true) {
                        // array
                        var firstElem = val_cell[0];
                        if (typeof firstElem == "object") {
                            //Json
                            var json1 = JSON.stringify(val_cell);

                            var str = "build_innert_table('" + ind_cell + "')";
                            var param_str = "hide_plus_btn('" + ind_cell + "')";

                            col = $("<tr><td>" + displayLabel + "</td><td style='word-wrap: break-word;overflow:auto;width: 227px;'><table id='tbl_" + ind_cell + "' class='mk_table'></table><button type='button' class='fn_btn' onclick=" + str + " value='Add Push Array' id='plus_" + ind_cell + "'><img src='Images/EF_Images/add_new_rdo.png' style='height: 20px; width: 20px;'></button><button type='button' class='fn_btn' onclick=" + param_str + " style='display: none; margin-left:1px;margin-top: 3px;' value='Add Push Array' id='minus_" + ind_cell + "''><i class='fa fa-minus-circle' aria-hidden='true'></i></button><input type='hidden'id='hdn_" + ind_cell + "' value='" + JSON.stringify(json1) + "'></td></tr>");
                        } else {
                            //Not Json
                            if (val_cell.length == 0) {
                                col = $("<tr><td>" + displayLabel + "</td><td></td></tr>");
                            }
                            else {
                                col = $("<tr><td>" + displayLabel + "</td><td style='word-wrap: break-word;overflow:auto;width: 227px;'>" + val_cell.toString() + "</td></tr>");
                            }
                        }
                        table.append(col);

                    } else {
                        // string
                        if (val_cell == "" || val_cell == null || val_cell == undefined) {
                            col = $("<tr><td>" + displayLabel + "</td><td></td></tr>");
                        }
                        else {
                            col = $("<tr><td>" + displayLabel + "</td><td style='word-wrap: break-word;overflow:auto;width: 227px;'>" + val_cell + "</td></tr>");
                            table.append(col);
                        }
                    }
                }
            })

            // display only first row details only (mobile info)
            return false;
        })
        table.append(profileRows);
    }

}
/* ==========================================================================
   Keyboard-aware bottom bar (app-wide).

   The WebView host activity (ph_s in AndroidManifest.xml) declares no
   windowSoftInputMode, so Android defaults to resizing the window when the
   soft keyboard opens. A bottom tab bar therefore gets re-laid-out against
   the shrunken viewport and visibly rides up to sit on top of the keyboard.

   Rather than change the Activity's resize behaviour (adjustNothing/adjustPan
   would stop the bar moving, but would also stop a focused input low on a
   long form from being scrolled into view -- a bad trade in a forms-heavy
   app), we keep the resize and simply hide the bar while the keyboard is up.
   The bar never appears to move; it is absent while typing and back
   immediately after.

   Detection is by viewport height rather than any keyboard plugin, so it
   needs no new dependency: the largest height seen for this page is treated
   as the no-keyboard baseline, and a drop of >150px means the keyboard is
   open. The threshold is absolute (not a ratio) so it behaves the same on
   tall and short devices, and comfortably clears browser-chrome jitter.
   ========================================================================== */
(function () {
    var kbBaselineHeight = 0;

    function updateKeyboardState() {
        var h = window.innerHeight;
        if (h > kbBaselineHeight) {
            kbBaselineHeight = h;
        }
        var isOpen = kbBaselineHeight > 0 && (kbBaselineHeight - h) > 150;
        var root = document.documentElement;
        if (!root) return;
        if (isOpen) {
            if (root.className.indexOf('keyboard-open') === -1) {
                root.className += ' keyboard-open';
            }
        } else {
            root.className = root.className.replace(/\s*keyboard-open\b/g, '');
        }
    }

    if (typeof window !== 'undefined' && window.addEventListener) {
        window.addEventListener('resize', updateKeyboardState);
        window.addEventListener('load', updateKeyboardState);
        if (document.readyState === 'complete') {
            updateKeyboardState();
        }
    }
})();

function isEmpty(obj) {
    return (
        obj &&
        typeof obj === "object" &&
        !Array.isArray(obj) &&
        Object.keys(obj).length === 0
    );
}

// Shared negative-action variant; callbacks and native disabled states are retained.
(function () {
    var buttons = '.button, .modal-button, button, input[type="button"], a.link, .swipeout-actions-right a';
    function style(root) {
        var nodes = root.matches && root.matches(buttons) ? [root] : [];
        if (root.querySelectorAll) nodes = nodes.concat(Array.prototype.slice.call(root.querySelectorAll(buttons)));
        nodes.forEach(function (button) {
            if (button.closest('.searchbar') || button.hasAttribute('data-action-positive')) return;
            var label = (button.value || button.textContent || button.getAttribute('aria-label') || '').trim();
            if (!/^(cancel|delete|remove|reject|discard)\b/i.test(label)) return;
            button.classList.add('button-negative');
            if (!button.closest('.swipeout-actions-right')) button.classList.add('button', 'button-fill');
        });
    }
    function init() {
        style(document.body);
        new MutationObserver(function (records) { records.forEach(function (record) { record.addedNodes.forEach(function (node) { if (node.nodeType === 1) style(node); else if (node.parentElement && node.parentElement.matches(buttons)) style(node.parentElement); }); }); })
            .observe(document.body, {childList: true, subtree: true});
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once: true}); else init();
})();

// Distance in metres between two points (haversine). The one copy for every
// page; site lists, calculators and the Home dashboard all use it.
function getDistanceFromLatLonInMeter(lat1, lon1, lat2, lon2) {
    var dLat = deg2rad(lat2 - lat1);
    var dLon = deg2rad(lon2 - lon1);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
        + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

// Shared date formatter used by checklist and flow navigation.
function getFormattedDate(date) {
    var year = date.getFullYear();
    var month = (1 + date.getMonth()).toString();
    month = month.length > 1 ? month : '0' + month;
    var day = date.getDate().toString();
    day = day.length > 1 ? day : '0' + day;
    return year + '/' + month + '/' + day;
}

// Form accents (--app-action-blue, which form_style.css and task_list_theme.css paint with) follow the site colour
// from the server (viewsite_btn_color), whatever it is, instead of staying the fixed default blue. Inline on <html>,
// so it wins over the :root defaults in styles_low.css / app_tokens.css.
(function () {
    try {
        var store = window.storage || window.localStorage, color = JSON.parse(store.getItem('viewsite_btn_color'));
        if (typeof color !== 'string' || !(window.CSS && CSS.supports('color', color))) return;
        document.documentElement.style.setProperty('--app-action-blue', color);
    } catch (e) { }
})();
