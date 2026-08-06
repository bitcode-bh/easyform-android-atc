/* ==========================================================================
   Micro Learning — local video cache (Cordova File API)
   --------------------------------------------------------------------------
   Caches reel MP4s on device so repeat views don't re-download over the
   network. DISABLED by default: it rewrites the <video> source to a file://
   path and depends on cordova-plugin-file + cordova-plugin-file-transfer
   behaving correctly on the target device/OS. Device-test first, then flip
   ML_CACHE_ENABLED to true.

   Design goals:
     - Fail-open: any error, missing plugin, or disabled flag → the remote URL
       is used, so caching can NEVER break playback. (micro_learning.js also
       adds an onerror fallback to the remote URL as a second safety net.)
     - Synchronous lookup on the build path via a small localStorage map, so a
       cache hit from a previous session swaps the source with zero latency.
     - Bounded footprint: only the first ML_CACHE_MAX reels are warmed, and a
       simple FIFO prune keeps the on-disk set at/under that many files.
   ========================================================================== */

var ML_CACHE_ENABLED = false;   // <-- set to true AFTER device testing
var ML_CACHE_MAX = 6;           // max reels to keep cached on disk
var ML_CACHE_DIR = 'ml_cache';  // subfolder under cordova.file.dataDirectory
var ML_CACHE_MAP_KEY = 'ml_video_cache_map';   // localStorage: {remote: localURL}
var ML_CACHE_ORDER_KEY = 'ml_video_cache_order'; // localStorage: [remote,...] FIFO

function ml_cache_available() {
    return ML_CACHE_ENABLED
        && typeof cordova !== 'undefined'
        && cordova.file && cordova.file.dataDirectory
        && typeof window.resolveLocalFileSystemURL === 'function';
}

function ml_cache_readMap() {
    try { return JSON.parse(localStorage.getItem(ML_CACHE_MAP_KEY)) || {}; }
    catch (e) { return {}; }
}
function ml_cache_writeMap(map) {
    try { localStorage.setItem(ML_CACHE_MAP_KEY, JSON.stringify(map)); } catch (e) { }
}
function ml_cache_readOrder() {
    try { return JSON.parse(localStorage.getItem(ML_CACHE_ORDER_KEY)) || []; }
    catch (e) { return []; }
}
function ml_cache_writeOrder(order) {
    try { localStorage.setItem(ML_CACHE_ORDER_KEY, JSON.stringify(order)); } catch (e) { }
}

// Synchronous: return the local file URL for a remote URL if we have one cached,
// otherwise the remote URL unchanged. Called on the reel build path.
function ml_cache_url(remote) {
    try {
        if (!ml_cache_available()) return remote;
        var map = ml_cache_readMap();
        return (map && map[remote]) ? map[remote] : remote;
    } catch (e) { return remote; }
}

function ml_cache_fileName(remote) {
    // Stable, filesystem-safe name derived from the URL.
    var base = remote.split('?')[0].split('#')[0];
    var name = base.substring(base.lastIndexOf('/') + 1) || 'video.mp4';
    name = name.replace(/[^a-zA-Z0-9._-]/g, '_');
    // Prefix with a short hash so different paths with the same file name differ.
    var h = 0;
    for (var i = 0; i < remote.length; i++) { h = ((h << 5) - h + remote.charCodeAt(i)) | 0; }
    return (h >>> 0).toString(36) + '_' + name;
}

// Warm the cache: download the first ML_CACHE_MAX not-yet-cached reels, one at a
// time (sequential so we never contend for bandwidth with the playing video).
function ml_cache_warm(remoteList) {
    if (!ml_cache_available() || !remoteList || !remoteList.length) return;

    var map = ml_cache_readMap();
    var order = ml_cache_readOrder();

    var pending = [];
    for (var i = 0; i < remoteList.length && pending.length < ML_CACHE_MAX; i++) {
        var url = remoteList[i];
        if (url && !map[url]) pending.push(url);
    }
    if (!pending.length) return;

    function ensureDir(cb) {
        window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function (dirEntry) {
            dirEntry.getDirectory(ML_CACHE_DIR, { create: true }, function (cacheDir) {
                cb(cacheDir);
            }, function () { /* dir error → give up quietly */ });
        }, function () { /* resolve error → give up quietly */ });
    }

    function prune(cacheDir) {
        // FIFO: while over the cap, delete the oldest cached file.
        while (order.length > ML_CACHE_MAX) {
            var oldest = order.shift();
            var localURL = map[oldest];
            delete map[oldest];
            if (localURL) {
                try {
                    window.resolveLocalFileSystemURL(localURL, function (fe) {
                        fe.remove(function () { }, function () { });
                    }, function () { });
                } catch (e) { }
            }
        }
        ml_cache_writeMap(map);
        ml_cache_writeOrder(order);
    }

    ensureDir(function (cacheDir) {
        var idx = 0;
        function next() {
            if (idx >= pending.length) return;
            var remote = pending[idx++];
            var target = cacheDir.nativeURL + ml_cache_fileName(remote);
            try {
                var ft = new FileTransfer();
                ft.download(
                    encodeURI(remote),
                    target,
                    function (entry) {
                        var localURL = entry.toURL();
                        map[remote] = localURL;
                        order.push(remote);
                        ml_cache_writeMap(map);
                        ml_cache_writeOrder(order);
                        prune(cacheDir);
                        next();
                    },
                    function () { next(); },   // download failed → skip, stay fail-open
                    false
                );
            } catch (e) { next(); }
        }
        next();
    });
}
