
$(document).ready(function () {

    let t_color_name = JSON.parse(storage.getItem('viewsite_btn_color'));
    let style_str = "<style>.navbar-bg, .sample-safety-titlebar,.sample-module-btn, .sample-module-progress span,.sample-safety-chip.active{background: " + t_color_name + " !important;}";
    style_str += ".sample-safety-filter,.sample-module-percent,.sample-safety-sort-option.active{color:" + t_color_name + " !important;} }</style>";
    $("head").append(style_str);

    get_safety_module_listing();

    $(document).on('tab:show', '.tab', function () {

        pauseAllVideos();

        if (this.id == "tab-1") {
            $(".navbar").show();
            $(".sample-safety-titlebar").html("Safety Modules");
            get_safety_module_listing();
        }
        else if (this.id == "tab-2") {
            $(".navbar").show();
            $(".sample-safety-titlebar").html("Assessments");
            get_assessments_listing();
        }
        else if (this.id == "tab-3") {
            $(".navbar").show();
            $(".sample-safety-titlebar").html("My Dashboard");
            get_dashboard_data();
        }
        else if (this.id == "tab-4") {
            $(".navbar").hide();

            get_user_activities();
            //get_micro_learning_videos();
        }
        else {
            $(".navbar").show();
        }
    });

    var video = $("#vdo_Question")[0];
    var timeoutId = null;

    // Keep taps on the native video controls inside the player. Framework7's
    // fast-click handling and parent gesture handlers must not turn the same
    // tap into a second navigation/playback action.
    $(video)
        .off("pointerdown.videoPlaybackIsolation pointerup.videoPlaybackIsolation touchstart.videoPlaybackIsolation touchend.videoPlaybackIsolation mousedown.videoPlaybackIsolation click.videoPlaybackIsolation")
        .on("pointerdown.videoPlaybackIsolation pointerup.videoPlaybackIsolation touchstart.videoPlaybackIsolation touchend.videoPlaybackIsolation mousedown.videoPlaybackIsolation click.videoPlaybackIsolation", function (event) {
            event.stopPropagation();
        });

    $(video).on("loadedmetadata", function () {
        var skillId = $(video).attr("skil_id");
        var moduleId = $(video).attr("module_id");
        var data = JSON.parse(localStorage.getItem('video_progress_' + skillId)) || [];

        if (data.length > 0) {
            var saved = data.find(item => item.Skill_Id == skillId);

            if (saved && saved.currentTime) {
                video.currentTime = saved.currentTime;
            }
        }

    });

    $(video).on("play", function () {
        if (this.currentTime < 0.5) {
            call_by_videolog('start'); // call api            
        }
        set_progress_local();
        set_progress();
    });

    // clear timer properly
    $(video).on("ended", function () {
        $("#dv_Question_List").show();
        set_progress_local();
        clearInterval(progressInterval);
        console.log("Interval cleared");
    });

});

$(document).on("click", ".link.popup-close", function () {
    $("#dv_Question_List").hide();
    set_progress_local();

    var video = $("#vdo_Question")[0];

    if (video) {
        video.pause();
    }

    // 2. Stop interval
    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }
    get_video_skill_by_module_id('');
});
function loading() {
    //  loading_hide();

    try {
        var is_loading = $(".preloader-modal");
        if (is_loading.length == 0) {
            myApp.preloader.show();
        }
    }
    catch (e) {
        setTimeout(function () {
            myApp.preloader.show();
        }, 10)
    }
}

function loading_hide() {
    myApp.preloader.hide();

    setTimeout(function () {
        myApp.preloader.hide();
    }, 10)
}
function onfail(e) {
    safety_module_listing_requested = false;
    assessment_listing_requested = false;
    loading_hide();
    alert(e);
}
function vibrate_device() {
    try {
        var q_jsonobj = [];
        cordova.exec(function (e) { }, function (e) { }, 'VibrationPlugin', 'vibrate', q_jsonobj);
    }
    catch (e) { }
}

function back_button_LMS() {
    var level4_popup = $('.popup-level-4.modal-in:visible');
    var level3_popup = $('.lms-module-preview-popup.modal-in:visible');
    var level2_popup = $('.popup-assessment-que.modal-in:visible');
    if (level4_popup.length > 0) {
        myApp.popup.close('.popup-level-4');
        return false;
    }
    else if (level3_popup.length > 0) {
        myApp.popup.close('.lms-module-preview-popup');
        return false;
    }
    else if (level2_popup.length > 0) {
        myApp.popup.close('.popup-assessment-que');
        return false;
    }
}
