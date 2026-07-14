
$(document).ready(function () {

    get_safety_module_listing();

    $(document).on('tab:show', '.tab', function () {

        pauseAllVideos();

        if (this.id == "tab-1") {
            $(".sample-safety-titlebar").html("Safety Modules");
            get_safety_module_listing();
        }
        else if (this.id == "tab-2") {
            $(".sample-safety-titlebar").html("Assessments");
            get_assessments_listing();
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
    var level3_popup = $('.popup-level-3.modal-in:visible');
    var level2_popup = $('.popup-level-2.modal-in:visible');
    if (level4_popup.length > 0) {
        myApp.popup.close('.popup-level-4');
        return false;
    }
    else if (level3_popup.length > 0) {
        myApp.popup.close('.popup-level-3');
        return false;
    }
    else if (level2_popup.length > 0) {
        myApp.popup.close('.popup-level-2');
        return false;
    }
}