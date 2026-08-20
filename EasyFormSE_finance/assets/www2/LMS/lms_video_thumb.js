/* ==========================================================================
   LMS — local video thumbnail generation
   --------------------------------------------------------------------------
   CMS currently requires a separate thumbnail upload for every video. When
   Thumbnail_link / Poster is missing, the app grabs one JPEG frame from the
   video on-device (native MediaMetadataRetriever, canvas fallback in Chrome)
   and caches it. No extra image is stored or served by the LMS API.
   ========================================================================== */

var LMS_THUMB_PLACEHOLDER = 'images/bg2.jpg';
var LMS_THUMB_CONCURRENCY = 2;
var lms_thumb_mem = {};
var lms_thumb_inflight = {};
var lms_thumb_queue = [];
var lms_thumb_active = 0;
var lms_thumb_io = null;

function lms_is_missing_cms_thumb(url) {
    return url == null || url === '' || url === LMS_THUMB_PLACEHOLDER;
}

function lms_thumb_apply(el, src) {
    if (!el || !src) return;
    try {
        if (el.tagName === 'VIDEO') {
            el.setAttribute('poster', src);
        } else {
            el.src = src;
            var parent = el.parentNode;
            if (parent && parent.classList) {
                parent.classList.add('img-ready');
                if (typeof lms_apply_corner_contrast === 'function' && parent.classList.contains('sample-module-image')) {
                    lms_apply_corner_contrast(src, parent);
                }
            }
        }
    } catch (e) { }
}

function lms_bind_video_thumb(el, id, videoUrl) {
    if (!el || !id || !videoUrl) return;
    if (lms_thumb_mem[id]) {
        lms_thumb_apply(el, lms_thumb_mem[id]);
        return;
    }
    try {
        el.setAttribute('data-gen-thumb-id', id);
        el.setAttribute('data-gen-thumb-url', videoUrl);
    } catch (e) { }

    if (typeof IntersectionObserver === 'function') {
        if (!lms_thumb_io) {
            lms_thumb_io = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;
                    var t = entry.target;
                    lms_thumb_io.unobserve(t);
                    lms_thumb_enqueue(t,
                        t.getAttribute('data-gen-thumb-id'),
                        t.getAttribute('data-gen-thumb-url'));
                });
            }, { rootMargin: '120px' });
        }
        lms_thumb_io.observe(el);
        return;
    }
    lms_thumb_enqueue(el, id, videoUrl);
}

function lms_thumb_enqueue(el, id, videoUrl) {
    if (!el || !id || !videoUrl) return;
    if (lms_thumb_mem[id]) {
        lms_thumb_apply(el, lms_thumb_mem[id]);
        return;
    }
    lms_thumb_queue.push({ el: el, id: id, url: videoUrl });
    lms_thumb_pump();
}

function lms_thumb_pump() {
    while (lms_thumb_active < LMS_THUMB_CONCURRENCY && lms_thumb_queue.length) {
        var job = lms_thumb_queue.shift();
        lms_thumb_active++;
        lms_get_video_thumb(job.id, job.url, function (src) {
            lms_thumb_active--;
            if (src) lms_thumb_apply(job.el, src);
            lms_thumb_pump();
        });
    }
}

function lms_get_video_thumb(id, videoUrl, cb) {
    if (lms_thumb_mem[id]) {
        cb(lms_thumb_mem[id]);
        return;
    }
    if (lms_thumb_inflight[id]) {
        lms_thumb_inflight[id].push(cb);
        return;
    }
    lms_thumb_inflight[id] = [cb];

    function done(src) {
        if (src) lms_thumb_mem[id] = src;
        var waiters = lms_thumb_inflight[id] || [];
        delete lms_thumb_inflight[id];
        waiters.forEach(function (fn) { try { fn(src); } catch (e) { } });
    }

    if (typeof cordova !== 'undefined' && typeof cordova.exec === 'function'
            && typeof window.cordova !== 'undefined' && window.cordova.platformId !== 'browser') {
        try {
            cordova.exec(
                function (src) { done(src); },
                function () { lms_thumb_from_canvas(videoUrl, done); },
                'LmsVideoThumb',
                'getThumb',
                [{ id: id, url: videoUrl }]
            );
            return;
        } catch (e) { }
    }
    lms_thumb_from_canvas(videoUrl, done);
}

function lms_thumb_from_canvas(videoUrl, cb) {
    var v = document.createElement('video');
    v.muted = true;
    v.playsInline = true;
    v.preload = 'auto';
    v.setAttribute('crossorigin', 'anonymous');
    var settled = false;
    function finish(src) {
        if (settled) return;
        settled = true;
        try { v.removeAttribute('src'); v.load(); } catch (e) { }
        cb(src || null);
    }
    function capture() {
        try {
            if (!v.videoWidth) { finish(null); return; }
            var maxW = 480;
            var w = v.videoWidth;
            var h = v.videoHeight;
            if (w > maxW) {
                h = Math.max(1, Math.round(h * maxW / w));
                w = maxW;
            }
            var canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            canvas.getContext('2d').drawImage(v, 0, 0, w, h);
            finish(canvas.toDataURL('image/jpeg', 0.7));
        } catch (e) {
            finish(null);
        }
    }
    v.addEventListener('error', function () { finish(null); });
    v.addEventListener('seeked', capture);
    v.addEventListener('loadeddata', function () {
        var t = 1;
        if (v.duration && isFinite(v.duration)) t = Math.min(1, Math.max(0.1, v.duration * 0.05));
        try { v.currentTime = t; } catch (e) { capture(); }
    });
    setTimeout(function () { finish(null); }, 12000);
    v.src = videoUrl;
}
