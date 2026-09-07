
var reelsSwiper;

/* ===== Premium reels helpers ==================================== */
var ml_scrubbing = false;      // true while the user is dragging the progress bar
var ml_positions = {};         // Ml_id -> last playback position (resume after interruption)

function ml_haptic(ms) { try { if (navigator.vibrate) navigator.vibrate(ms || 10); } catch (e) { } }

function ml_pop($btn) {
    if (!$btn || !$btn.length) return;
    $btn.addClass('ml-pop');
    setTimeout(function () { $btn.removeClass('ml-pop'); }, 450);
}

function ml_rollCount($span, newVal) {
    if (!$span || !$span.length) return;
    $span.text(newVal);
    $span.removeClass('ml-roll');
    void $span[0].offsetWidth;   // reflow to restart the animation
    $span.addClass('ml-roll');
}

// Buffered-progress paint
function ml_updateBuffered(video, slide) {
    try {
        if (!video.duration || !video.buffered || !video.buffered.length) return;
        var end = video.buffered.end(video.buffered.length - 1);
        var buf = document.querySelector('.global-video-progress .video-progress-buffered');
        if (buf) buf.style.width = ((end / video.duration) * 100) + '%';
    } catch (e) { }
}

// Warm the previous/next videos so transitions are instant
function ml_preloadAdjacent() {
    if (!reelsSwiper || !reelsSwiper.slides) return;
    var idx = reelsSwiper.activeIndex;
    [idx - 1, idx + 1].forEach(function (i) {
        if (i >= 0 && reelsSwiper.slides[i]) {
            var v = reelsSwiper.slides[i].querySelector('.reel-video');
            if (v) {
                if (v.preload !== 'auto') v.preload = 'auto';
                if (v.readyState === 0) { try { v.load(); } catch (e) { } }
            }
        }
    });
}

// Tap-to-seek + drag-to-scrub on the slim bottom progress bar
function ml_seekStart(event, progressEl) {
    if (!reelsSwiper) return;
    var slide = reelsSwiper.slides[reelsSwiper.activeIndex];
    var video = slide && slide.querySelector('.reel-video');
    var track = progressEl.querySelector('.video-progress-track');
    var fill = progressEl.querySelector('.video-progress-fill');
    var handle = progressEl.querySelector('.video-progress-handle');
    if (!video || !video.duration || !track) return;

    ml_scrubbing = true;
    progressEl.classList.add('is-scrubbing');

    function pct(clientX) {
        var r = track.getBoundingClientRect();
        return Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    }
    function apply(clientX) {
        var p = pct(clientX);
        try { video.currentTime = p * video.duration; } catch (e) { }
        if (fill) fill.style.transform = 'scaleX(' + p + ')';
        if (handle) handle.style.left = (p * 100) + '%';
    }
    apply(event.clientX);

    function move(e) { apply(e.clientX); if (e.preventDefault) e.preventDefault(); }
    function up() {
        ml_scrubbing = false;
        progressEl.classList.remove('is-scrubbing');
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
        document.removeEventListener('pointercancel', up);
        ml_haptic(8);
        if (video.paused) video.play().catch(function () { });
    }
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
    document.addEventListener('pointercancel', up);
    if (event.preventDefault) event.preventDefault();
    if (event.stopPropagation) event.stopPropagation();
}

/* ================================================================ */

function bind_micro_learning_events() {
    //setTimeout(function () {
    
    let lastIdx = parseInt(localStorage.getItem('ml_last_index') || '0', 10);

    if (reelsSwiper) {
        //reelsSwiper.destroy(true, true);
        reelsSwiper.update();
        if (lastIdx >= reelsSwiper.slides.length) lastIdx = 0;
        reelsSwiper.slideTo(lastIdx, 0);

        setTimeout(function () {
            if ($('#tab-4').hasClass('tab-active')) {
                playVideo(reelsSwiper.slides[reelsSwiper.activeIndex]);
            }
        }, 100);
    }
    else {
        reelsSwiper = new Swiper('.reels-swiper', {
            initialSlide: lastIdx,
            direction: 'vertical',
            slidesPerView: 1,
            watchSlidesProgress: true,
            resistanceRatio: 0,
            // Swiper's default threshold (5px) treats almost any incidental
            // finger movement while tapping the video (adjusting grip, a light
            // touch that isn't a deliberate swipe) as the start of a real slide
            // change — which immediately pauses the current reel via
            // slideChangeTransitionStart below. Raising it means a genuine
            // swipe intent still works, but a near-stationary tap doesn't get
            // misread as one. mousewheel is dropped entirely: this is a
            // touch-only Cordova app, and wheel-like input events on some
            // Android devices could trigger the same false slide change.
            threshold: 10,
            rewind: true,
            // observer/observeParents removed: slide mutations (build, filter)
            // are followed by an explicit reelsSwiper.update(), so the
            // MutationObserver was pure per-mutation overhead during the build
            // loop and every search keystroke.
            noSwiping: true,
            noSwipingClass: 'swiper-no-swiping',
            on: {
                init: function () {
                    ml_update_preload();
                    // Autoplay the first video on load if tab is active
                    if ($('#tab-4').hasClass('tab-active')) {
                        playVideo(this.slides[this.activeIndex]);
                    }
                },
                sliderMove: function () {
                    // Hide chrome only after an actual drag. A simple tap must
                    // not change playback before the click handler runs.
                    $(".reel-actions, .reel-caption").css("visibility", "hidden");
                },
                touchEnd: function () {
                    // Playback is handled by slideChangeTransitionEnd. Keeping
                    // touchEnd free of play/pause logic avoids racing a tap.
                    $(".reel-actions, .reel-caption").css("visibility", "visible");
                },
                slideChangeTransitionStart: function () {
                    pauseAllVideos();
                },
                slideChangeTransitionEnd: function () {
                    localStorage.setItem('ml_last_index', this.activeIndex);
                    ml_update_preload();
                    // Play video in the active slide if tab is active
                    if ($('#tab-4').hasClass('tab-active')) {
                        playVideo(this.slides[this.activeIndex]);
                    }
                }
            }
        });

    }


    // Helper function to play video and handle errors
    //}, 2000);
}


// Every programmatic pause of a reel goes through here, never a bare
// v.pause(). A video whose play() is still in flight (just auto-started, or
// tapped a moment before) can throw "play() request was interrupted by
// pause()" on some Android WebViews and leave the element visibly stuck —
// the single biggest source of reel playback looking like it randomly died.
// Waiting for any pending promise first costs nothing in the common case
// (an already-settled promise resolves on the next microtask) and closes
// the race everywhere at once instead of one call site at a time.
function ml_safe_pause(v) {
    if (!v) return;
    var pending = v._lmsPlayPromise;
    if (pending && typeof pending.then === 'function') {
        pending.then(function () { try { v.pause(); } catch (e) { } });
    } else {
        try { v.pause(); } catch (e) { }
    }
}

function pauseAllVideos() {
    // Pause all videos
    document.querySelectorAll('.reel-video').forEach(v => {
        ml_safe_pause(v);
    });
}

// --- App lifecycle (Cordova) -------------------------------------------------
// When the app is backgrounded (screen lock / home / task switch) a WebView
// keeps <video> decoders and the network socket alive unless we intervene.
// Pause everything and release decoders; resume position is preserved in
// ml_positions and re-applied by playVideo().
function ml_on_app_pause() {
    try {
        pauseAllVideos();
        document.querySelectorAll('.reel-video').forEach(function (v) { ml_release_source(v); });
    } catch (e) { }
}

function ml_on_app_resume() {
    try {
        if (!reelsSwiper) return;
        ml_update_preload();   // re-attach active ± 1
        if ($('#tab-4').hasClass('tab-active')) {
            playVideo(reelsSwiper.slides[reelsSwiper.activeIndex]);
        }
    } catch (e) { }
}

// If a cached local file fails to load, fall back to the canonical remote URL
// once (fail-open so caching can never break playback).
function ml_on_video_error(v) {
    try {
        if (!v || v.dataset.mlFellBack === '1') return;
        var remote = v.getAttribute('data-remote');
        var s = v.querySelector('source');
        if (remote && s && s.getAttribute('src') !== remote) {
            v.dataset.mlFellBack = '1';
            s.setAttribute('src', remote);
            v.setAttribute('data-src', remote);
            try { v.load(); } catch (e) { }
        }
    } catch (e) { }
}

// Toggle sound across all reels; persist the choice so it sticks between reels.
function ml_toggle_mute(btn, e) {
    if (e) { e.stopPropagation(); }
    var muted = localStorage.getItem('ml_muted') === '1';
    muted = !muted;
    localStorage.setItem('ml_muted', muted ? '1' : '0');
    document.querySelectorAll('.reel-video').forEach(function (v) { v.muted = muted; });
    document.querySelectorAll('.ml-mute i').forEach(function (i) {
        i.className = muted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
    });
    document.querySelectorAll('.ml-mute').forEach(function (b) {
        b.setAttribute('aria-pressed', String(!muted));
    });
    return false;
}

// Apply the saved mute preference to every reel video (call after (re)render).
function ml_apply_saved_mute() {
    var muted = localStorage.getItem('ml_muted') === '1';
    document.querySelectorAll('.reel-video').forEach(function (v) { v.muted = muted; });
}

// Re-attach a previously released <source> so the video can buffer/play again.
// The URL lives on the <source> when active, or is stashed on data-src after a
// release; either way we restore it without losing the resume position (that is
// tracked separately in ml_positions and re-applied by playVideo()).
function ml_attach_source(v) {
    if (!v) return;
    var s = v.querySelector('source');
    if (!s) return;
    var want = s.getAttribute('src') || v.getAttribute('data-src');
    if (want && s.getAttribute('src') !== want) {
        s.setAttribute('src', want);
        try { v.load(); } catch (e) { }
    }
}

// Detach an off-window video's <source> and force the WebView to drop its
// decode buffers + decoder handle. Without this, every reel the user scrolls
// past stays resident (paused != released) and memory climbs until an OOM
// crash on low/mid Android WebViews. The URL is stashed on data-src so
// ml_attach_source() can bring it back instantly when the slide re-enters
// the active window.
function ml_release_source(v) {
    if (!v) return;
    var s = v.querySelector('source');
    if (!s) return;
    var cur = s.getAttribute('src');
    if (cur) {
        v.setAttribute('data-src', cur);
        s.removeAttribute('src');
        // load() alone both stops playback and releases the decoder — no
        // separate pause() first. A bare v.pause() here would race an
        // in-flight play() the same way every other direct pause() in this
        // file used to (see ml_safe_pause); load() doesn't have that problem,
        // it's the spec-defined way to abort a pending play() request.
        try { v.load(); } catch (e) { }   // releases decoder + buffered ranges
    }
}

// Windowing manager: only the active slide and its immediate neighbours keep a
// live <source> and buffer (preload="auto"); everything else is detached to
// reclaim memory. Runs on init and after every slide change.
function ml_update_preload() {
    if (!reelsSwiper || !reelsSwiper.slides) return;
    var active = reelsSwiper.activeIndex;
    reelsSwiper.slides.forEach(function (s, i) {
        var v = s.querySelector('.reel-video');
        if (!v) return;
        if (Math.abs(i - active) <= 1) {
            ml_attach_source(v);
            v.preload = 'auto';
        } else {
            v.preload = 'none';
            ml_release_source(v);
        }
    });
}

var playpause_Timer;
// Sync only the play/pause glyph + label (no show/hide side effects), so a new
// video starting does NOT flash the control.
function updateReelPlayPauseButton(slideElement, isPlaying) {
    if (!slideElement) return;
    var button = slideElement.querySelector('.reel-play-pause');
    if (!button) return;
    button.classList.toggle('is-playing', isPlaying);
    button.setAttribute('aria-label', isPlaying ? 'Pause video' : 'Play video');
    button.setAttribute('title', isPlaying ? 'Pause video' : 'Play video');
}

// Reveal the control — only on user tap or when paused. autoHide=true fades it
// after a short inactivity period for an uncluttered view.
function showReelControl(autoHide) {
    document.querySelectorAll('button.reel-play-pause').forEach(function (b) { b.classList.remove('is-hidden'); });
    clearTimeout(playpause_Timer);
    if (autoHide) { playpause_Timer = setTimeout(hideReelControl, 1400); }
}
function hideReelControl() {
    clearTimeout(playpause_Timer);
    document.querySelectorAll('button.reel-play-pause').forEach(function (b) { b.classList.add('is-hidden'); });
}

var ml_click_timer = null;
function toggleReelPlayback(control, event) {

    if (event) {
        event.preventDefault();
        event.stopPropagation();
        if (event.stopImmediatePropagation) {
            event.stopImmediatePropagation();
        }
    }

    var slideElement = control.closest('.swiper-slide');
    var video = slideElement && slideElement.querySelector('.reel-video');
    if (!video) return false;

    if (ml_click_timer === null) {
        // First tap - wait to see if it's a double tap
        ml_click_timer = setTimeout(function () {
            ml_click_timer = null;
            // Execute single tap (play/pause)
            ml_haptic(8);

            if (video.paused || video.ended) {
                if (video.ended) {
                    video.currentTime = 0;
                }

                video._lmsPlayPromise = video.play().catch(function (error) {
                    console.log("Video play prevented", error);
                });
                showReelControl(true);    // brief feedback on tap-to-play, then auto-hide
            }
            else {
                // ml_safe_pause waits out any in-flight play() first — see its
                // definition. A tap landing right after auto-start is exactly
                // the race it exists for: without it this looked like the reel
                // randomly refusing to play.
                ml_safe_pause(video);
                showReelControl(false);   // user paused → keep the control visible
            }
        }, 250);
    } else {
        // Second tap - double tap detected!
        clearTimeout(ml_click_timer);
        ml_click_timer = null;
        
        ml_haptic([40, 30, 40]); // haptic pattern for double tap
        
        var likeBtn = slideElement.querySelector('.action-item[aria-label="Like"]');
        if (likeBtn && !likeBtn.classList.contains('is-liked')) {
            likeBtn.click();
            // optionally animate a big heart over the video
        }
    }

    return false;
}

function playNextReelOrRestart() {
    if (!reelsSwiper || reelsSwiper.slides.length == 0) return;

    if (reelsSwiper.activeIndex < reelsSwiper.slides.length - 1) {
        reelsSwiper.slideNext();
    }
    else {
        // All reels played → loop back to the first, seamlessly.
        ml_positions = {};                         // clear saved positions so videos restart at 0
        document.querySelectorAll('.reel-video').forEach(function (v) {
            try { v.pause(); v.currentTime = 0; v.onended = null; } catch (e) { }
        });
        $(".video-progress-fill").css("transform", "scaleX(0)");
        $(".video-progress-handle").css("left", "0%");
        reelsSwiper.update();
        reelsSwiper.slideTo(0, 0);                  // instant, no visible scroll
        // play after the slide settles so the first video reliably restarts
        setTimeout(function () { playVideo(reelsSwiper.slides[0]); }, 30);
    }
}

// Shared search hook: filter reels by title. Non-matching slides are hidden.
function ml_filter_reels(q) {
    if (!reelsSwiper) return;
    q = (q || '').toString().toLowerCase().trim();
    var slides = document.querySelectorAll('#div_Reels .swiper-slide');
    var firstVisible = -1;
    slides.forEach(function (s, i) {
        var titleEl = s.querySelector('.video-overlay');
        var title = titleEl ? titleEl.textContent.toLowerCase() : '';
        var match = !q || title.indexOf(q) > -1;
        s.style.display = match ? '' : 'none';
        if (match && firstVisible === -1) firstVisible = i;
    });
    reelsSwiper.update();
    if (firstVisible > -1) {
        reelsSwiper.slideTo(firstVisible, 0);
        playVideo(reelsSwiper.slides[firstVisible]);
    } else {
        pauseAllVideos();
    }
}

function playVideo(slideElement) {
    if (!slideElement) return;

    // A new/active video always starts with the control hidden (no auto-flash).
    hideReelControl();

    // Pause all videos. Rapid swiping can call this again before a previous
    // slide's own play() has settled — ml_safe_pause (not a bare v.pause())
    // is what keeps that from throwing an interrupted-play error on it.
    document.querySelectorAll('.reel-video').forEach(v => {
        ml_safe_pause(v);
        //v.currentTime = 0;
        v.onended = null; // Remove previous event
    });

    var video = slideElement.querySelector('.reel-video');
    var progress = document.querySelector('.global-video-progress .video-progress-fill');
    var handle = document.querySelector('.global-video-progress .video-progress-handle');
    var mlId = slideElement.getAttribute('Ml_id');

    if (!video) return;

    if (video) {
        if (video.ended || (video.duration && video.currentTime >= video.duration)) {
            video.currentTime = 0;
            if (progress) { progress.style.transform = 'scaleX(0)'; }
            if (handle) { handle.style.left = '0%'; }
        } else if (mlId && ml_positions[mlId] > 0) {
            // Resume playback position after an interruption
            try { video.currentTime = ml_positions[mlId]; } catch (e) { }
        }
        //video.currentTime = 0;
        // Tracked so a near-immediate tap (toggleReelPlayback) can wait for this
        // to settle instead of calling pause() while it's still in flight — see
        // the comment there for why that matters.
        video._lmsPlayPromise = video.play().catch(function (error) {
            console.log("Auto-play prevented", error);
        });
    }

    // Warm adjacent videos for instant transitions
    ml_preloadAdjacent();

    video.onplay = function () {
        updateReelPlayPauseButton(slideElement, true);
    };

    video.onpause = function () {
        updateReelPlayPauseButton(slideElement, false);
        if (mlId) ml_positions[mlId] = video.currentTime;
    };

    video.onprogress = function () { ml_updateBuffered(video, slideElement); };

    // timeupdate can fire many times per second; coalesce all writes into a
    // single rAF-aligned paint and drive the fill with a compositor-only
    // transform (scaleX) instead of animating `width`, which would relayout
    // the bar on every tick and steal frames from the swipe gesture.
    var mlRafPending = false;
    video.ontimeupdate = function () {
        if (ml_scrubbing) return;           // don't fight the user while scrubbing
        if (!video.duration) return;
        if (mlId) ml_positions[mlId] = video.currentTime;   // cheap, keep in sync
        if (mlRafPending) return;
        mlRafPending = true;
        requestAnimationFrame(function () {
            mlRafPending = false;
            if (ml_scrubbing || !video.duration) return;
            var p = video.currentTime / video.duration;
            if (progress) progress.style.transform = 'scaleX(' + p + ')';
            if (handle) handle.style.left = (p * 100) + '%';
        });
    };

    video.onended = function () {
        updateReelPlayPauseButton(slideElement, false);
        //console.log("Video completed");

        // Use the slide captured by playVideo rather than whichever slide is
        // active a moment later; a fast swipe must never complete another reel.
        let Ml_id = slideElement.getAttribute("Ml_id");
        let watch_icon = $(slideElement).find('.action-item[aria-label="Views"] i.fa-eye');
        add_user_activitiy(Ml_id, 'WATCH', watch_icon);

        var answered = JSON.parse(localStorage.getItem('ml_answered_quizzes') || '[]');
        if (answered.includes(Ml_id)) {
            playNextReelOrRestart();
        } else {
            get_ML_question(Ml_id);
        }

        //if (reelsSwiper.activeIndex < reelsSwiper.slides.length - 1) {
        //    // Move to next reel (Next reel is available)
        //    reelsSwiper.slideNext();
        //} else {
        //    // Last reel is completed load more videos if required
        //}
    };
}




var user_activitiy_Array = [];

// Keep successful reel completions available while navigating/rebuilding the
// feed. The API remains authoritative on refresh; this local set bridges the
// interval between the WATCH save and the next activity-list response.
function ml_get_completed_reels() {
    try { return JSON.parse(localStorage.getItem('ml_completed_reels') || '[]'); }
    catch (e) { return []; }
}

function ml_is_reel_completed(mlId) {
    var id = String(mlId);
    for (var i = 0; i < user_activitiy_Array.length; i++) {
        if (String(user_activitiy_Array[i].Ml_Id) === id && Number(user_activitiy_Array[i].Watch_Count) > 0) return true;
    }
    return ml_get_completed_reels().map(String).indexOf(id) !== -1;
}

function ml_mark_reel_completed(mlId, $watchButton) {
    var id = String(mlId);
    var completed = ml_get_completed_reels().map(String);
    if (completed.indexOf(id) === -1) {
        completed.push(id);
        localStorage.setItem('ml_completed_reels', JSON.stringify(completed));
    }

    // Update only the matching activity row/reel so navigating away and back
    // cannot restore the stale pre-request icon state.
    var row = null;
    for (var i = 0; i < user_activitiy_Array.length; i++) {
        if (String(user_activitiy_Array[i].Ml_Id) === id) { row = user_activitiy_Array[i]; break; }
    }
    if (!row) {
        row = { Ml_Id: mlId };
        user_activitiy_Array.push(row);
    }
    row.Watch_Count = 1;

    if ($watchButton && $watchButton.length) {
        $watchButton.addClass('is-watched');
        $watchButton.find('i.fa-eye').removeClass('fa-regular').addClass('fa-solid');
    }
    update_ml_stat_badge();
}

function get_user_activities() {

    let user_id = JSON.parse(storage.getItem('user_id'));

    var Param_obj = [];
    Param_obj.push({
        "User_ID": user_id
    });

    loading();
    var getdata = new Webservicecall_REST(global_wcf_url_lms + 'LMS_Select_Micro_Learning_User_Activity', JSON.stringify(Param_obj), function (e) {
        var All_data = e.responseText;
        All_data = JSON.parse(All_data);
        let status = All_data[0]["status"];
        if (status == 1) {
            let data = JSON.parse(All_data[0]["data"]);

            user_activitiy_Array = data;
            update_ml_stat_badge();

            //for (let i = 0; i < data.length; i++) {
            //    let Activity_Id = data[i].Activity_Id;
            //    let Ml_Id = data[i].Ml_Id;
            //    let IsLiked = data[i].IsLiked;
            //    let IsDisliked = data[i].IsDisliked;
            //    let Share_Count = data[i].Share_Count;
            //    let Watch_Count = data[i].Watch_Count;
            //}
        }
        else if (status == 2) { }
        else {
            console.log(All_data[0]["message"]);
        }

        get_micro_learning_videos();

        loading_hide();
    }, onfail);
    getdata.callOtherDomain();
}

// Compact reels-feed overlay — total videos watched. The only real per-user ML
// metric available (Watch_Count on user_activitiy_Array); no watch-time or
// score field exists anywhere in this dataset.
function update_ml_stat_badge() {
    var el = document.getElementById('ml_stat_watched_count');
    if (el && typeof lms_count_distinct_ml === 'function') {
        el.textContent = lms_count_distinct_ml(user_activitiy_Array, 'Watch_Count');
    }

    var timeEl = document.getElementById('ml_stat_watch_time');
    if (timeEl && typeof lms_get_watch_seconds === 'function') {
        timeEl.textContent = lms_format_watch_time(lms_get_watch_seconds('lms_watch_seconds_ml'));
    }

    var totalEl = document.getElementById('ml_stat_total_time');
    if (totalEl) {
        var cached = {};
        try { cached = JSON.parse(localStorage.getItem('lms_video_durations_ml')) || {}; } catch (e) { cached = {}; }
        var total = 0;
        Object.keys(cached).forEach(function (id) { total += cached[id]; });
        totalEl.textContent = lms_format_watch_time(total);
    }
}

// Library-wide total reel length — real durations read directly off every
// reel's video file (no duration field exists anywhere in the ML data/API).
// Runs once per session; real bandwidth cost, accepted for a true total.
var lms_ml_total_time_started = false;
function lms_compute_ml_total_video_time(catalog) {
    if (lms_ml_total_time_started) return;
    if (!catalog || !catalog.length) return;
    lms_ml_total_time_started = true;

    lms_sum_video_durations('lms_video_durations_ml', catalog, 'Ml_id', 'Video_Link', function () {
        update_ml_stat_badge();
    });
}

// micro learning video listing
var total_reels = 0;
var ml_catalog_ml_ids = null; // { Ml_id: true, ... } for videos currently in the library
function get_micro_learning_videos() {

    let role_id = (typeof lms_get_listing_role_ids === 'function')
        ? lms_get_listing_role_ids()
        : localStorage.getItem('role_id_array');

    var Param_obj = [];
    Param_obj.push({
        'Role_Id': role_id
    });

    loading();
    var getdata = new Webservicecall_REST(global_wcf_url_lms + 'LMS_Select_Micro_Learning_Master_RoleWise', JSON.stringify(Param_obj), function (e) {
        var All_data = e.responseText;
        All_data = JSON.parse(All_data);
        let status = All_data[0]["status"];
        if (status == 1) {
            let data = JSON.parse(All_data[0]["data"]);

            // Track which Ml_Ids are actually in the current library — activity
            // log rows can outlive their video (content rotated/removed), so
            // "Watched"/"Liked" must be intersected with this or they can
            // exceed the real library size. See lms_count_distinct_ml.
            ml_catalog_ml_ids = {};
            data.forEach(function (v) { ml_catalog_ml_ids[v.Ml_id] = true; });

            // Re-entering tab-4 resumes the last reel almost immediately
            // (bind_micro_learning_events' own ~100ms timer), well before this
            // network response can land. If the library grew since the last
            // visit, wiping #div_Reels here would destroy that actively-playing
            // <video> out from under the user — the reel looks like it randomly
            // died mid-watch. A currently-playing video means it's genuinely
            // safe to defer: total_reels is only bumped on an actual rebuild, so
            // the next time this runs (next tab-4 entry, or once the user pauses/
            // finishes) the same "grew" condition is still true and the rebuild
            // still happens — nothing is lost, only postponed past the point
            // where it would be destructive.
            var reelActivelyPlaying = false;
            document.querySelectorAll('.reel-video').forEach(function (v) {
                if (!v.paused && !v.ended) reelActivelyPlaying = true;
            });

            if (total_reels == 0) {
                $('#div_Reels')[0].innerHTML = '';
                total_reels = data.length;
            }
            else {
                if (data.length > total_reels && !reelActivelyPlaying) {
                    $('#div_Reels')[0].innerHTML = '';
                    total_reels = data.length;
                }
            }
            if (typeof update_lms_kpi === 'function') update_lms_kpi();
            lms_compute_ml_total_video_time(data);

            let reelsContent = $('#div_Reels')[0].innerHTML;
            if (reelsContent == '') {
                // Build the whole list as one string and commit it in a single
                // innerHTML write instead of N jQuery .append() calls — one
                // reflow + one parse instead of one per reel.
                var reels_html = '';
                var ml_remote_links = [];
                for (let i = 0; i < data.length; i++) {
                    let Ml_id = data[i].Ml_id;
                    let Title = data[i].Title;
                    let Description = data[i].Description;
                    //let Video_Id = data[i].Video_Id;
                    let Video_Link = data[i].Video_Link;

                    let Total_Likes = data[i].Total_Likes;
                    let Total_Dislikes = data[i].Total_Dislikes;
                    let Total_Shares = data[i].Total_Shares;
                    let Total_Watch_Count = data[i].Total_Watch_Count;

                    let reel_str = '<div class="swiper-slide" Ml_id="' + Ml_id + '">';

                    // Optional poster (thumbnail) — instant first paint instead
                    // of a black frame while the first keyframe decodes. Emitted
                    // only when the API supplies one; harmless no-op otherwise.
                    var ml_poster = data[i].Poster_Link || data[i].Thumbnail || data[i].Poster || '';
                    // Serve from the local cache when available (see ml_video_cache.js);
                    // falls back to the remote URL when caching is disabled/absent.
                    var ml_src = (typeof ml_cache_url === 'function') ? ml_cache_url(Video_Link) : Video_Link;

                    reel_str += '<video class="reel-video" preload="none" playsinline' + (ml_poster ? ' poster="' + ml_poster + '"' : '') + ' data-remote="' + Video_Link + '" onerror="ml_on_video_error(this)" onclick="return toggleReelPlayback(this, event)"><source src="' + ml_src + '" type="video/mp4" /></video>';
                    reel_str += '<button type="button" class="reel-play-pause swiper-no-swiping is-hidden" aria-label="Play video" title="Play video" onclick="return toggleReelPlayback(this, event)"><span class="reel-play-pause-icon" aria-hidden="true"></span></button>';
                    reel_str += '<div class="reel-caption">';
                    reel_str += '<div class="video-overlay">' + Title + '</div>';
                    reel_str += '<div class="video-overlay-sub">' + Description + '</div>';
                    reel_str += '</div>';


                    let like_str = "add_user_activitiy('" + Ml_id + "','LIKE', this)";
                    let dislike_str = "add_user_activitiy('" + Ml_id + "','DISLIKE', this)";
                    let share_str = "share_video_link('" + Ml_id + "','SHARE', this, '" + Video_Link + "')";

                    reel_str += '<div class="reel-actions swiper-no-swiping">';

                    // Mute / unmute (sticky across reels via localStorage)
                    var ml_muted = localStorage.getItem('ml_muted') === '1';
                    reel_str += '<button type="button" class="action-item ml-mute swiper-no-swiping" aria-label="Toggle sound" aria-pressed="' + (ml_muted ? 'false' : 'true') + '" onclick="return ml_toggle_mute(this, event)"><i class="' + (ml_muted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high') + '"></i></button>';

                    var IsLiked = 0, IsDisliked = 0, Watch_Count = 0, Share_Count = 0;
                    if (user_activitiy_Array.length > 0) {
                        for (let a = 0; a < user_activitiy_Array.length; a++) {
                            let t_Ml_Id = user_activitiy_Array[a].Ml_Id;
                            if (t_Ml_Id == Ml_id) {
                                IsLiked = user_activitiy_Array[a].IsLiked;
                                IsDisliked = user_activitiy_Array[a].IsDisliked;
                                Watch_Count = user_activitiy_Array[a].Watch_Count;
                                Share_Count = user_activitiy_Array[a].Share_Count;
                                break;
                            }
                        }
                    }

                    if (IsLiked == 1) {
                        reel_str += '<button type="button" class="action-item swiper-no-swiping is-liked" aria-label="Like" aria-pressed="true" onclick="' + like_str + '"><i class="fa-solid fa-thumbs-up"></i><span>' + Total_Likes + '</span></button>';
                    }
                    else {
                        reel_str += '<button type="button" class="action-item swiper-no-swiping" aria-label="Like" aria-pressed="false" onclick="' + like_str + '"><i class="fa-regular fa-thumbs-up"></i><span>' + Total_Likes + '</span></button>';
                    }

                    // if (IsDisliked == 1) {
                    //     reel_str += '<div class="action-item"><i class="fa-solid fa-thumbs-down" onclick="' + dislike_str + '"></i><span>' + Total_Dislikes + '</span></div>';
                    // }
                    // else {
                    //     reel_str += '<div class="action-item"><i class="fa-regular fa-thumbs-down" onclick="' + dislike_str + '"></i><span>' + Total_Dislikes + '</span></div>';
                    // }

                    if (Share_Count == 1) {
                        reel_str += '<button type="button" class="action-item swiper-no-swiping" aria-label="Share" onclick="' + share_str + '"><i class="fa-solid fa-paper-plane"></i><span>' + Total_Shares + '</span></button>';
                    }
                    else {
                        reel_str += '<button type="button" class="action-item swiper-no-swiping" aria-label="Share" onclick="' + share_str + '"><i class="fa-regular fa-paper-plane"></i><span>' + Total_Shares + '</span></button>';
                    }

                    // Restore completion from the latest API activity or the
                    // successful local WATCH save for this exact Ml_Id.
                    if (Watch_Count == 1 || ml_is_reel_completed(Ml_id)) {
                        reel_str += '<div class="action-item is-watched" aria-label="Views"><i class="fa-solid fa-eye"></i><span>' + Total_Watch_Count + '</span></div>';
                    }
                    else {
                        reel_str += '<div class="action-item" aria-label="Views"><i class="fa-regular fa-eye"></i><span>' + Total_Watch_Count + '</span></div>';
                    }

                    reel_str += '</div>';   // close .reel-actions

                    reel_str += '</div>';   // close .swiper-slide

                    reels_html += reel_str;
                    ml_remote_links.push(Video_Link);
                }
                $('#div_Reels')[0].innerHTML = reels_html;   // single commit

                if (typeof lms_track_watch_time === 'function') {
                    document.querySelectorAll('.reel-video').forEach(function (v) {
                        lms_track_watch_time(v, 'lms_watch_seconds_ml');
                        $(v).on('pause ended', function () { update_ml_stat_badge(); });
                    });
                }

                // Warm the local cache in the background (no-op unless enabled).
                if (typeof ml_cache_warm === 'function') ml_cache_warm(ml_remote_links);
            }

            bind_micro_learning_events();
            ml_apply_saved_mute();
            ml_update_preload();
        }
        else {
            $('#div_Reels')[0].innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;width:100%;color:#888;text-align:center;"><i class="fa fa-video" style="font-size:48px;margin-bottom:12px;opacity:0.5;"></i><p style="font-size:16px;">No videos found</p></div>';
        }
        loading_hide();
    }, onfail);
    getdata.callOtherDomain();
}

// One reaction request per reel at a time. Like and Dislike share the same lock
// so rapid taps (or one tap on each action) cannot send competing API updates.
var ml_reaction_requests = {};

function add_user_activitiy(t_ML_id, activity_type, icon_ele) {

    // icon_ele may be the action button (LIKE/SHARE) or the <i> (WATCH). Normalize.
    var $ctx = $(icon_ele);
    var $btn = $ctx.hasClass('action-item') ? $ctx : $ctx.closest('.action-item');
    var $icon = $btn.length ? $btn.find('i').first() : $ctx;
    var $count = $btn.length ? $btn.find('span').first() : $ctx.next('span');

    var isReaction = activity_type === 'LIKE' || activity_type === 'DISLIKE';
    var reactionKey = String(t_ML_id);
    var $reactionButtons = $btn.closest('.swiper-slide').find(
        '.action-item[aria-label="Like"], .action-item[aria-label="Dislike"]'
    );
    if (isReaction) {
        // Ignore every repeated Like/Dislike invocation until the first request
        // reaches either its success or failure callback.
        if (ml_reaction_requests[reactionKey]) return false;
        ml_reaction_requests[reactionKey] = true;
        $reactionButtons.prop('disabled', true).attr('aria-busy', 'true');
    }

    function releaseReactionLock() {
        if (!isReaction) return;
        delete ml_reaction_requests[reactionKey];
        $reactionButtons.prop('disabled', false).removeAttr('aria-busy');
    }

    // LIKE keeps a thin outline icon and tracks state via the .is-liked class
    // (color only); WATCH/others use the solid/regular fill to signal state.
    let isActive = (activity_type == "LIKE") ? $btn.hasClass("is-liked") : $icon.hasClass("fa-solid");
    if (isActive) {
        // remove
        var action = "0";

        if (activity_type == "WATCH" || activity_type == "SHARE") {
            // do not call if user has already watched or share this video
            return false;
        }
    }
    else {
        // add
        var action = "1";
    }

    var user_id;
    try {
        user_id = JSON.parse(storage.getItem('user_id'));
    } catch (storageError) {
        // A malformed session value is also a failed action; never strand the
        // reaction controls in their temporary disabled state.
        releaseReactionLock();
        throw storageError;
    }

    var Param_obj = [];
    Param_obj.push({
        "Ml_Id": t_ML_id,
        "Flag": activity_type,
        "Value": action,
        "User_ID": user_id
    });

    var getdata;
    try {
        getdata = new Webservicecall_REST(global_wcf_url_lms + 'LMS_InsertUpdateDelete_Micro_Learning_User_Activity', JSON.stringify(Param_obj), function (e) {
        try {
            var responseText = e.responseText;
            var myArray = JSON.parse(responseText);
            var status = myArray[0].status;
            if (status == 1) {

                let curr_count = Math.max(0, parseInt($count.text(), 10) || 0);

                if (activity_type == "WATCH") {
                    // A reel becomes completed only after its end-triggered
                    // WATCH request succeeds; apply the blue state immediately.
                    ml_mark_reel_completed(t_ML_id, $btn);
                }

                if (action == "0") {
                    if (activity_type == "LIKE") { $btn.removeClass("is-liked"); }
                    else { $icon.removeClass("fa-solid").addClass("fa-regular"); }
                    // Defensive clamp: stale/invalid UI data must never display
                    // a negative reaction count after removing a reaction.
                    ml_rollCount($count, Math.max(0, curr_count - 1));
                }
                else {
                    if (activity_type == "LIKE") { $btn.addClass("is-liked"); ml_pop($btn); ml_haptic(15); }
                    else { $icon.removeClass("fa-regular").addClass("fa-solid"); }
                    ml_rollCount($count, curr_count + 1);
                }
            }
            else if (status == 2 || status == 3) {
                var message = myArray[0].message;
                alert(message);
            }
        } catch (responseError) {
            console.error('Unable to process Micro Learning activity response.', responseError);
        } finally {
            releaseReactionLock();
        }
        }, function (error) {
            releaseReactionLock();
            onfail(error);
        });
        getdata.callOtherDomain();
    } catch (requestError) {
        releaseReactionLock();
        throw requestError;
    }
    return false;
}


var glob_ML_Id, glob_ML_Que_Id;
function get_ML_question(Ml_Id) {

    glob_ML_Id = Ml_Id;

    var Param_obj = [];
    Param_obj.push({
        "Ml_Id": Ml_Id
    });

    loading();
    var getdata = new Webservicecall_REST(global_wcf_url_lms + 'LMS_Select_Micro_Learning_Questions_Master_by_Ml_Id', JSON.stringify(Param_obj), function (e) {
        var All_data = e.responseText;
        All_data = JSON.parse(All_data);
        let status = All_data[0]["status"];
        if (status == 1) {
            let data = JSON.parse(All_data[0]["data"]);
            let Question_Name = data[0].Question_Name;
            let Valid_Answer = data[0].Valid_Answer;
            let OptionText = data[0].OptionText;

            glob_ML_Que_Id = data[0].Ml_Que_Id;

            $("#ML_Question").html('<i class="fa-solid fa-lightbulb" style="color: #fbbc05; margin-right: 8px; font-size: 18px;"></i>' + Question_Name);
            $("#ML_Question").attr("valid_ans", Valid_Answer[0].trim());

            $("#option0").text(OptionText[0]);
            $("#option1").text(OptionText[1]);
            $("#option2").text(OptionText[2]);
            $("#option3").text(OptionText[3]);

            // Clear previous selection
            $("input[name='quizOption']").prop("checked", false);

            myApp.sheet.open("#pnl_ML_Question");

        }
        else if (status == 2) {
            playNextReelOrRestart();
        }
        else {
            alert(All_data[0]["message"]);
        }

        loading_hide();
    }, onfail);
    getdata.callOtherDomain();
}

function submit_ML_question() {
    let Param_obj = [];

    let user_id = JSON.parse(storage.getItem('user_id'));
    let user_name = JSON.parse(storage.getItem('user_name'));
    let circle_name = JSON.parse(storage.getItem('circle_name'));
    let questionName = $("#ML_Question").text();
    let selectedValue = $('#pnl_ML_Question').find('input[type="radio"][name="ML_Option"]:checked').val();

    if (selectedValue !== undefined) {
        var selectedAns = $("#option" + selectedValue).text();
    }
    else {
        alert("Please select answer!");
        return false;
    }

    Param_obj.push({
        "User_ID": user_id,
        "User_Name": user_name,
        "Ml_Id": glob_ML_Id,
        "Ml_Que_Id": glob_ML_Que_Id,
        "Question_Name": questionName,
        "Ans": selectedAns,
        "Circle": circle_name
    });

    loading();
    var getdata = new Webservicecall_REST(global_wcf_url_lms + 'LMS_InsertUpdateDelete_Micro_Learning_Question_Log_Master', JSON.stringify(Param_obj), function (e) {
        var responseText = e.responseText;
        var myArray = JSON.parse(responseText);
        var status = myArray[0].status;
        if (status == 1) {

            var answered = JSON.parse(localStorage.getItem('ml_answered_quizzes') || '[]');
            if (!answered.includes(glob_ML_Id)) {
                answered.push(glob_ML_Id);
                localStorage.setItem('ml_answered_quizzes', JSON.stringify(answered));
            }

            $("#btn_ML_Que_Submit").css("visibility", "hidden");

            // Remove previous classes
            $("#pnl_ML_Question .list li").removeClass("ml-correct-answer ml-incorrect-answer");

            let validAnswer = $("#ML_Question").attr("valid_ans");

            if (typeof lms_add_ml_quiz_result === 'function') {
                lms_add_ml_quiz_result(selectedAns.trim() === validAnswer);
            }

            $("input[name='ML_Option']").each(function () {

                var value = $(this).val();
                var option = $("#option" + value);

                if (option.text().trim() === validAnswer) {

                    // Highlight the correct answer
                    $(this).closest("li").addClass("ml-correct-answer");

                } else if ($(this).is(":checked")) {

                    // Highlight only the selected wrong answer
                    $(this).closest("li").addClass("ml-incorrect-answer");
                }
            });

            // Haptic feedback: success buzz vs. error double-buzz
            var wasCorrect = (selectedAns && validAnswer && selectedAns.trim() === validAnswer.trim());
            ml_haptic(wasCorrect ? 25 : [40, 30, 40]);

            setTimeout(function () {
                myApp.sheet.close("#pnl_ML_Question");

                $("#btn_ML_Que_Submit").css("visibility", "visible");

                playNextReelOrRestart();
            }, 3000);

        }
        else {
            var message = myArray[0].message;
            alert(message);
        }

        loading_hide();

    }, onfail);
    getdata.callOtherDomain();
}

function share_video_link(t_ML_id, activity_type, icon_ele, Video_Link) {
    try {

        // Share micro-interaction: haptic + scale pop
        ml_haptic(15);
        ml_pop($(icon_ele).closest('.action-item'));

        pauseAllVideos();

        var m_username = $("#txtusername").val();
        if (m_username == "" || m_username == null || m_username == undefined) {
            m_username = "";
        }

        Video_Link = encodeURI(Video_Link);

        var body_str = 'Dear Team,\n\n Please find the video link below for your review:\n\n Video Link:\n ' + Video_Link + '\n\n Kindly review the video and let me know if you encounter any issues or have any feedback.\n\n Thank you.';
        // var mail_str = ' , ' + body_str + ', Video Link for Review';
        // mail_str = encodeURIComponent(mail_str);

        // t_mail_details = decodeURIComponent(mail_str);
        // var mail_array = t_mail_details.split(',');
        // var email = mail_array[0];
        // var body = '';
        // var subject = '';
        // if (mail_array.length > 1) {
        //     body = mail_array[1];
        //     subject = mail_array[2];
        // }

        //body = 'Disclaimer : The content of this application is confidential and intended for the specified recipient only. No User has the authority to conclude any binding contract/inference from the contents of this application. The data contained herein only provides an information regarding the project but not on a real-time basis. The accuracy of the information Vis-à-vis the real-time project progress is not guaranteed. The application users are advised to seek help of the Project Director for any further query that they may have with regards to the project progress. Thank you for your cooperation and understanding.';
        //subject = '';

        var q_jsonobj = [];
        q_jsonobj.push({
            'email': " ",
            'body': body_str,
            'subject': "Video Link for Review"
        });
        cordova.exec(function (e) {
            // success

            playVideo(reelsSwiper.slides[reelsSwiper.activeIndex]);
            add_user_activitiy(t_ML_id, activity_type, icon_ele);

        }, function (e) {
            // onfail

            playVideo(reelsSwiper.slides[reelsSwiper.activeIndex]);
            add_user_activitiy(t_ML_id, activity_type, icon_ele);

        }, 'openMailComposerPlugin', 'anAction', q_jsonobj);

    }
    catch (e) {
        alert1(e + '_share_video_link()')
    }
}
