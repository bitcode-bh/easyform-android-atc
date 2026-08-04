
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

    $("#safety-video-expand")
        .off("pointerdown.safetyVideoExpand touchstart.safetyVideoExpand mousedown.safetyVideoExpand")
        .on("pointerdown.safetyVideoExpand touchstart.safetyVideoExpand mousedown.safetyVideoExpand", function (event) {
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
    if ($(this).closest('.popup-level-4').length > 0) {
        safetyVideoPopupActive = false;
        safetyVideoReturnedFromFullscreen = false;
    }
    if ($(this).closest('.lms-module-preview-popup').length > 0) {
        safetyModulePreviewActive = false;
    }
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

$(document).on("popup:closed", ".popup-level-4", function () {
    safetyVideoPopupActive = false;
    safetyVideoReturnedFromFullscreen = false;
});

$(document).on("popup:closed", ".lms-module-preview-popup", function () {
    safetyModulePreviewActive = false;
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

var safetyVideoLandscapeMode = false;
var safetyVideoReturnedFromFullscreen = false;
var safetyVideoPopupActive = false;
var safetyModulePreviewActive = false;

function setSafetyVideoOrientation(orientation) {
    var useWebOrientationFallback = function () {
        try {
            if (screen.orientation && typeof screen.orientation.lock === 'function') {
                var lockResult = screen.orientation.lock(orientation);
                if (lockResult && typeof lockResult.catch === 'function') {
                    lockResult.catch(function () { });
                }
            }
            else if (typeof screen.lockOrientation === 'function') {
                screen.lockOrientation(orientation);
            }
        }
        catch (error) { }
    };

    try {
        // The LMS host activity is portrait-locked in AndroidManifest.xml.
        // This native bridge deliberately overrides it only while the Safety
        // Module player is expanded.
        if (typeof cordova !== 'undefined' && cordova.exec) {
            cordova.exec(
                function () { },
                useWebOrientationFallback,
                'SafetyVideoOrientationPlugin',
                orientation,
                []
            );
            return;
        }

        useWebOrientationFallback();
    }
    catch (error) {
        useWebOrientationFallback();
    }
}

function finishSafetyVideoLandscape() {
    var wasLandscape = safetyVideoLandscapeMode;
    safetyVideoLandscapeMode = false;
    if (wasLandscape) {
        // The next native back press belongs to the still-open video popup,
        // even if Android's rotation briefly makes jQuery :visible unreliable.
        safetyVideoReturnedFromFullscreen = true;
    }
    $("#safety-video-container").removeClass("safety-video-landscape");
    $("#safety-video-expand i").removeClass("fa-compress").addClass("fa-expand");
    $("#safety-video-expand").attr({
        "aria-label": "Expand video in landscape",
        "title": "Expand video in landscape"
    });
    setSafetyVideoOrientation('portrait');
}

function expandSafetyVideo(button, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
        if (event.stopImmediatePropagation) {
            event.stopImmediatePropagation();
        }
    }

    var container = document.getElementById('safety-video-container');
    if (!container) return false;

    if (safetyVideoLandscapeMode) {
        exitSafetyVideoLandscape();
        return false;
    }

    safetyVideoReturnedFromFullscreen = false;
    safetyVideoLandscapeMode = true;
    container.classList.add('safety-video-landscape');
    $(button).find("i").removeClass("fa-expand").addClass("fa-compress");
    $(button).attr({ "aria-label": "Exit landscape video", "title": "Exit landscape video" });

    var fullscreenResult;
    if (container.requestFullscreen) {
        fullscreenResult = container.requestFullscreen();
    }
    else if (container.webkitRequestFullscreen) {
        fullscreenResult = container.webkitRequestFullscreen();
    }

    var lockLandscape = function () {
        setSafetyVideoOrientation('landscape');
    };

    if (fullscreenResult && typeof fullscreenResult.then === 'function') {
        fullscreenResult.then(lockLandscape).catch(function (error) {
            finishSafetyVideoLandscape();
            console.log("Safety video fullscreen prevented", error);
        });
    }
    else {
        lockLandscape();
    }

    return false;
}

function exitSafetyVideoLandscape() {
    if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen();
    }
    else if (document.webkitFullscreenElement && document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    }
    else {
        finishSafetyVideoLandscape();
    }
    return false;
}

document.addEventListener('fullscreenchange', function () {
    if (!document.fullscreenElement && safetyVideoLandscapeMode) {
        finishSafetyVideoLandscape();
    }
});

document.addEventListener('webkitfullscreenchange', function () {
    if (!document.webkitFullscreenElement && safetyVideoLandscapeMode) {
        finishSafetyVideoLandscape();
    }
});

function back_button_LMS() {
    if (safetyVideoLandscapeMode || document.fullscreenElement === document.getElementById('safety-video-container') || document.webkitFullscreenElement === document.getElementById('safety-video-container')) {
        exitSafetyVideoLandscape();
        return false;
    }

    if (safetyVideoPopupActive) {
        safetyVideoPopupActive = false;
        safetyVideoReturnedFromFullscreen = false;
        myApp.popup.close('.popup-level-4');
        return false;
    }

    if (safetyVideoReturnedFromFullscreen) {
        safetyVideoReturnedFromFullscreen = false;
        myApp.popup.close('.popup-level-4');
        return false;
    }

    if (safetyModulePreviewActive) {
        safetyModulePreviewActive = false;
        myApp.popup.close('.lms-module-preview-popup');
        return false;
    }

    var level4_popup = $('.popup-level-4.modal-in, .popup-level-4.popup-in, .popup-level-4.popup-opened');
    var level3_popup = $('.lms-module-preview-popup.modal-in, .lms-module-preview-popup.popup-in, .lms-module-preview-popup.popup-opened');
    var level2_popup = $('.popup-assessment-que.modal-in, .popup-assessment-que.popup-in, .popup-assessment-que.popup-opened');
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

    // Never classify a screen with an active Framework7 modal as the root,
    // including the short layout interval following an orientation change.
    if ($('.popup.modal-in, .popup.popup-in, .popup.popup-opened, .dialog.modal-in, .sheet-modal.modal-in').length > 0) {
        return false;
    }

    if (typeof mainView !== 'undefined' && mainView && mainView.history && mainView.history.length > 1 && mainView.router && mainView.router.back) {
        alert("back 1");
        mainView.router.back();
        return false;
    }

    var safetyTab = $('#tab-1');
    var isSafetyTabActive = safetyTab.hasClass('tab-active') ||
        safetyTab.hasClass('swiper-slide-active') ||
        $('a.tab-link[href="#tab-1"]').hasClass('tab-link-active');

    if (!isSafetyTabActive) {
        // Assessments, Dashboard and Micro Learning all return to the default
        // Safety Modules tab. This pauses only .reel-video elements.
        pauseAllVideos();
        myApp.tab.show('#tab-1');
        return false;
    }

    // The Safety Modules tab with no popup, fullscreen player or router
    // history is the sole LMS root state where exiting the app is allowed.
    return true;
}
