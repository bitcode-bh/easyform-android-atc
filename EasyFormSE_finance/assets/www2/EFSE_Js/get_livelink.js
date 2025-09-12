

function init_livelink(ll_new_id) {
    var video = document.getElementById("livelink_video_" + ll_new_id);
    var statusDisplay = document.getElementById("livelink_status_" + ll_new_id);

    var lastTime = 0;
    var watchTime = 0;

    video.onseeking = function () {
        // restrict seeking
        if (video.currentTime > watchTime + 0.5) {
            video.currentTime = watchTime;
        }
    };

    video.ontimeupdate = function () {
        var currentTimeFloored = Math.floor(video.currentTime);
        if (currentTimeFloored > lastTime) {
            watchTime++;
            lastTime = currentTimeFloored;
        }

        var totalDuration = Math.floor(video.duration);
        var percentWatched = 0;

        if (totalDuration > 0) {
            percentWatched = Math.floor((watchTime / totalDuration) * 100);
        }

        statusDisplay.textContent = `Status: (Watched ${percentWatched}%)`;
    };

    video.onended = function () {
        lastTime = 0;
        watchTime = 0;
        statusDisplay.textContent = "Status: Watched";
        $(video).attr("watched", "1");
        //let t_path = $(video).find("source").attr("src");
    };

    video.onplay = function () {
        statusDisplay.textContent = "Status: Watching...";
    };

    video.onpause = function () {
        statusDisplay.textContent = `Status: Paused at ${lastTime}s`;
    };

    video.onloadedmetadata = function () {
        lastTime = 0;
        watchTime = 0;

        let is_watched = $(this).attr("watched");
        if (is_watched != "1") {
            statusDisplay.textContent = "Status: Ready to watch";
        }
    };
}

function videoclick() {
    if (video.paused) {
        video.play();
        statusDisplay.textContent = "Status: Playing (Click to Pause)";
    } else {
        video.pause();
        statusDisplay.textContent = `Status: Paused at ${Math.floor(video.currentTime)}s (Click to Play)`;
    }
}

function download_livelink_doc(t_live_url) {
    var q_jsonobj = [];
    q_jsonobj.push({
        'video_url': t_live_url
    })
    cordova.exec(function (e) {
        // onsuccess

        alert(e);

    }, function (e) {
        // onfail
        alert(e);
    }, 'VideoDownloadPlugin', 'anAction', q_jsonobj);
}

reset_video_url_by_live_url = (t_video_ele) => {
    let live_url = $(t_video_ele).attr("live_url");
    $(t_video_ele).attr("src", live_url); 
}