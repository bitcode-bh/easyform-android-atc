
// user_activitiy_Array can carry more than one row per Ml_Id (one per activity
// event, not one per video — see the first-match/break lookup in
// micro_learning.js's reel-render loop, which already assumes this). Always
// count DISTINCT videos here, never raw rows, or "watched"/"liked" totals
// overcount against the real size of the library.
function lms_count_distinct_ml(arr, field) {
    // Also intersect with the current reel catalog (see micro_learning.js) —
    // activity rows can outlive their video (content rotated/removed since the
    // activity happened), so counting them without this can exceed the real
    // library size (e.g. "9 watched" out of 3 actual videos).
    var validIds = (typeof ml_catalog_ml_ids !== 'undefined') ? ml_catalog_ml_ids : null;
    var seen = {};
    (arr || []).forEach(function (a) {
        if (Number(a[field]) > 0 && (!validIds || validIds[a.Ml_Id])) seen[a.Ml_Id] = true;
    });
    return Object.keys(seen).length;
}

// ---- Local on-device watch-time tracking ------------------------------------
// No backend field exists for "watch time" anywhere in the LMS API (checked
// Modules' video-log call and every dashboard/listing response) — this
// accumulates real wall-clock seconds while a video element is actually
// playing, stored in localStorage. It's genuine measured data, just kept
// on-device rather than server-side, so it resets on reinstall/cache-clear.
function lms_add_watch_seconds(storageKey, seconds) {
    if (!seconds || seconds <= 0) return;
    var total = Number(localStorage.getItem(storageKey)) || 0;
    total += seconds;
    localStorage.setItem(storageKey, String(total));
}

// Day-bucketed companion to lms_add_watch_seconds — powers watch-time trend
// charts. Only buckets from the point this shipped forward (nothing retroactive).
function lms_add_watch_seconds_daily(dailyKey, seconds) {
    if (!seconds || seconds <= 0) return;
    var daily = {};
    try { daily = JSON.parse(localStorage.getItem(dailyKey)) || {}; } catch (e) { daily = {}; }
    var d = new Date();
    var key = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
    daily[key] = (daily[key] || 0) + seconds;
    localStorage.setItem(dailyKey, JSON.stringify(daily));
}

function lms_get_watch_seconds_daily(dailyKey, day) {
    var daily = {};
    try { daily = JSON.parse(localStorage.getItem(dailyKey)) || {}; } catch (e) { daily = {}; }
    var key = day.getFullYear() + '-' + (day.getMonth() + 1) + '-' + day.getDate();
    return daily[key] || 0;
}

// ---- Local Micro Learning quiz score tracking -------------------------------
// Same situation as watch time: the submit call (LMS_InsertUpdateDelete_
// Micro_Learning_Question_Log_Master) only logs the answer text — the server
// never returns or stores a score/correctness anywhere. Correctness IS known
// client-side at answer time (compared against valid_ans for the highlight
// UI), so this persists it locally, both all-time and day-bucketed for a trend.
function lms_add_ml_quiz_result(isCorrect) {
    var correct = Number(localStorage.getItem('lms_ml_quiz_correct')) || 0;
    var total = Number(localStorage.getItem('lms_ml_quiz_total')) || 0;
    total += 1;
    if (isCorrect) correct += 1;
    localStorage.setItem('lms_ml_quiz_correct', String(correct));
    localStorage.setItem('lms_ml_quiz_total', String(total));

    var daily = {};
    try { daily = JSON.parse(localStorage.getItem('lms_ml_quiz_daily')) || {}; } catch (e) { daily = {}; }
    var d = new Date();
    var key = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
    if (!daily[key]) daily[key] = { correct: 0, total: 0 };
    daily[key].total += 1;
    if (isCorrect) daily[key].correct += 1;
    localStorage.setItem('lms_ml_quiz_daily', JSON.stringify(daily));
}

function lms_get_ml_quiz_score_pct() {
    var correct = Number(localStorage.getItem('lms_ml_quiz_correct')) || 0;
    var total = Number(localStorage.getItem('lms_ml_quiz_total')) || 0;
    return total > 0 ? Math.round((correct / total) * 100) : 0;
}

function lms_get_ml_quiz_daily(day) {
    var daily = {};
    try { daily = JSON.parse(localStorage.getItem('lms_ml_quiz_daily')) || {}; } catch (e) { daily = {}; }
    var key = day.getFullYear() + '-' + (day.getMonth() + 1) + '-' + day.getDate();
    return daily[key] || { correct: 0, total: 0 };
}

function lms_get_watch_seconds(storageKey) {
    return Number(localStorage.getItem(storageKey)) || 0;
}

// Per-item companion to lms_add_watch_seconds — same total, broken out by
// module/lesson id so a listing card can show its own watched time instead
// of just the category-wide sum.
function lms_add_watch_seconds_by_item(storageKey, itemId, seconds) {
    if (!seconds || seconds <= 0 || itemId == null || itemId === '') return;
    var key = storageKey + '_by_item';
    var map = {};
    try { map = JSON.parse(localStorage.getItem(key)) || {}; } catch (e) { map = {}; }
    map[itemId] = (Number(map[itemId]) || 0) + seconds;
    localStorage.setItem(key, JSON.stringify(map));
}

function lms_get_watch_seconds_by_item(storageKey, itemId) {
    var key = storageKey + '_by_item';
    var map = {};
    try { map = JSON.parse(localStorage.getItem(key)) || {}; } catch (e) { map = {}; }
    return Number(map[itemId]) || Number(map[String(itemId)]) || 0;
}

function lms_format_watch_time(totalSeconds) {
    totalSeconds = Math.round(totalSeconds || 0);
    if (totalSeconds < 60) return totalSeconds + 's';
    var totalMinutes = Math.round(totalSeconds / 60);
    if (totalMinutes < 60) return totalMinutes + 'm';
    var hours = Math.floor(totalMinutes / 60);
    var mins = totalMinutes % 60;
    return hours + 'h ' + mins + 'm';
}

// Clock-style mm:ss (vs. lms_format_watch_time's compact "4m"/"1h 4m") — used
// on listing cards showing "watched / total" for a single item.
function lms_format_clock_time(totalSeconds) {
    totalSeconds = Math.max(0, Math.round(totalSeconds || 0));
    var m = Math.floor(totalSeconds / 60);
    var s = totalSeconds % 60;
    return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
}

function lms_parse_clock_to_seconds(clock) {
    if (typeof clock === 'number' && isFinite(clock)) return Math.max(0, clock);
    if (!clock) return 0;
    var parts = String(clock).split(':');
    if (parts.length !== 2) return 0;
    return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
}

// Lesson rows and module cards must read from the same elapsed source — never
// substitute full Video_Time just because the quiz was submitted.
function lms_format_lesson_elapsed_display(skillId, totalSecOrClock) {
    var totalSec = (typeof totalSecOrClock === 'number')
        ? totalSecOrClock
        : lms_parse_clock_to_seconds(totalSecOrClock);
    var elapsed = (typeof lms_get_lesson_elapsed_seconds === 'function')
        ? lms_get_lesson_elapsed_seconds(skillId) : 0;
    if (totalSec > 0) elapsed = Math.min(elapsed, totalSec);
    return lms_format_clock_time(elapsed);
}

function lms_refresh_module_card_watchtime(moduleId) {
    if (!moduleId) return;
    var card = document.querySelector('.sample-module-card[Module_Id="' + moduleId + '"]');
    if (!card || typeof lms_format_clock_time !== 'function') return;
    var elapsedEl = card.querySelector('.sample-watchtime-elapsed');
    if (!elapsedEl || typeof lms_get_module_watched_seconds !== 'function') return;
    elapsedEl.textContent = lms_format_clock_time(lms_get_module_watched_seconds(moduleId));
}

// Module_Id -> [Skill_Id, ...] and Skill_Id -> duration (seconds), built when
// module skill lists are fetched — lets module-card watch time be the sum of
// its lessons so the card and lesson list can never disagree.
var lms_module_skill_index = {};
var lms_skill_total_seconds = {};

// Seconds already watched for a lesson. Wall-clock (lms_track_watch_time) and
// resume position (video_progress_*) are both valid; take the higher so a
// partial save in one store never reads as 00:00 while the other has data.
function lms_get_lesson_elapsed_seconds(skillId) {
    var wall = 0;
    if (typeof lms_get_watch_seconds_by_item === 'function') {
        wall = lms_get_watch_seconds_by_item('lms_watch_seconds_skills', skillId);
    }
    var saved = lms_get_lesson_local_record(skillId);
    var fromResume = (saved && saved.currentTime) ? (Number(saved.currentTime) || 0) : 0;
    return Math.max(wall, fromResume);
}

function lms_sum_module_lesson_watched(moduleId) {
    var mid = String(moduleId);
    var skills = lms_module_skill_index[mid] || [];
    if (!skills.length) {
        return lms_get_watch_seconds_by_item('lms_watch_seconds_modules', moduleId);
    }
    var sum = 0;
    skills.forEach(function (sid) {
        sum += lms_get_lesson_elapsed_seconds(sid);
    });
    return sum;
}

// Module cards always show the sum of their lessons' watched time — same source
// the lesson list uses — not the independent module-level bucket alone.
function lms_get_module_watched_seconds(moduleId) {
    return lms_sum_module_lesson_watched(moduleId);
}

// Spread legacy module-only watch seconds across lessons that have no per-skill
// record yet, weighted by video duration so multi-lesson modules get a fair
// split instead of dumping everything onto one lesson.
function lms_distribute_orphan_watch(lessons, orphanSec) {
    if (orphanSec <= 0 || !lessons || !lessons.length) return;
    if (typeof lms_add_watch_seconds_by_item !== 'function') return;

    var recipients = lessons.filter(function (les) {
        return lms_get_lesson_elapsed_seconds(les.skillId) < 0.5;
    });
    if (!recipients.length) recipients = lessons.slice();

    var weights = recipients.map(function (les) { return Math.max(les.totalSec || 1, 1); });
    var totalWeight = weights.reduce(function (a, b) { return a + b; }, 0);
    var distributed = 0;

    recipients.forEach(function (les, i) {
        var share = (i === recipients.length - 1)
            ? Math.round(orphanSec - distributed)
            : Math.round(orphanSec * weights[i] / totalWeight);
        if (share > 0) {
            lms_add_watch_seconds_by_item('lms_watch_seconds_skills', les.skillId, share);
            distributed += share;
        }
    });
}

// When the module-level bucket has more watch time than the sum of per-lesson
// records (legacy tracking gap), distribute the gap across lessons.
function lms_reconcile_orphan_module_watch(moduleId, lessons) {
    if (!moduleId || !lessons || !lessons.length) return;
    if (typeof lms_get_watch_seconds_by_item !== 'function') return;

    var moduleWatched = lms_get_watch_seconds_by_item('lms_watch_seconds_modules', moduleId);
    if (moduleWatched <= 0) return;

    var sumLesson = 0;
    lessons.forEach(function (les) {
        sumLesson += lms_get_lesson_elapsed_seconds(les.skillId);
    });
    if (sumLesson >= moduleWatched - 0.5) return;

    lms_distribute_orphan_watch(lessons, moduleWatched - sumLesson);
}

function lms_reconcile_all_module_watch() {
    Object.keys(lms_module_skill_index).forEach(function (moduleId) {
        var lessons = lms_module_skill_index[moduleId].map(function (sid) {
            return {
                skillId: sid,
                totalSec: lms_skill_total_seconds[sid] || 0
            };
        });
        lms_reconcile_orphan_module_watch(moduleId, lessons);
    });
}

function lms_register_module_skills(moduleId, lessons) {
    var mid = String(moduleId);
    if (!lms_module_skill_index[mid]) lms_module_skill_index[mid] = [];
    (lessons || []).forEach(function (les) {
        var sid = String(les.skillId);
        if (lms_module_skill_index[mid].indexOf(sid) === -1) {
            lms_module_skill_index[mid].push(sid);
        }
        if (les.totalSec > 0) lms_skill_total_seconds[sid] = les.totalSec;
    });
    try {
        localStorage.setItem('lms_module_skill_index', JSON.stringify(lms_module_skill_index));
        localStorage.setItem('lms_skill_total_seconds', JSON.stringify(lms_skill_total_seconds));
    } catch (e) { }
}

function lms_load_module_skill_index() {
    try {
        var idx = JSON.parse(localStorage.getItem('lms_module_skill_index') || '{}');
        var secs = JSON.parse(localStorage.getItem('lms_skill_total_seconds') || '{}');
        if (idx && Object.keys(idx).length) lms_module_skill_index = idx;
        if (secs) lms_skill_total_seconds = secs;
    } catch (e) { }
}

// ---- Local assessment activity tracking -------------------------------------
var lms_assessment_watch_session = { id: null, start: null };

function lms_start_assessment_watch(assessmentId) {
    if (typeof lms_flush_assessment_watch === 'function') lms_flush_assessment_watch();
    lms_assessment_watch_session = { id: String(assessmentId), start: Date.now() };
}

function lms_flush_assessment_watch() {
    var sess = lms_assessment_watch_session;
    if (!sess || !sess.start || !sess.id) return;
    var elapsed = Math.round((Date.now() - sess.start) / 1000);
    lms_assessment_watch_session = { id: null, start: null };
    if (elapsed <= 0) return;
    lms_add_watch_seconds('lms_watch_seconds_assessments', elapsed);
    lms_add_watch_seconds_daily('lms_watch_seconds_assessments_daily', elapsed);
    lms_add_watch_seconds_by_item('lms_watch_seconds_assessments', sess.id, elapsed);
}

function lms_get_assessment_completion_log() {
    try { return JSON.parse(localStorage.getItem('lms_assessment_completion_log') || '[]'); }
    catch (e) { return []; }
}

function lms_log_assessment_completion(assessmentId, scorePct) {
    if (!assessmentId) return;
    var id = String(assessmentId);
    var todayKey = new Date().toISOString().slice(0, 10);
    var log = lms_get_assessment_completion_log().filter(function (e) {
        return !(String(e.id) === id && String(e.date).slice(0, 10) === todayKey);
    });
    log.push({
        id: id,
        date: new Date().toISOString(),
        scorePct: Math.round(Number(scorePct) || 0)
    });
    localStorage.setItem('lms_assessment_completion_log', JSON.stringify(log));
}

function lms_assessment_score_pct(item) {
    if (!item) return null;
    var totalQ = Number(item.TotalQuestion) || 0;
    var score = Number(item.Score);
    if (totalQ > 0 && !isNaN(score)) return (score / totalQ) * 100;
    return null;
}

function lms_get_active_assessment_ids() {
    var set = {};
    (typeof assessment_data !== 'undefined' && assessment_data ? assessment_data : []).forEach(function (a) {
        if (a && a.Assessment_Id != null && a.Assessment_Id !== '') set[String(a.Assessment_Id)] = true;
    });
    return set;
}

function lms_is_active_dashboard_assessment(assessmentKey) {
    var active = lms_get_active_assessment_ids();
    if (!Object.keys(active).length) return true;
    return !!active[assessmentKey];
}

function lms_sum_active_assessments_watch_seconds() {
    var sum = 0;
    (typeof assessment_data !== 'undefined' && assessment_data ? assessment_data : []).forEach(function (a) {
        if (typeof lms_get_watch_seconds_by_item === 'function') {
            sum += lms_get_watch_seconds_by_item('lms_watch_seconds_assessments', a.Assessment_Id);
        }
    });
    return sum;
}

// Total questions across assigned assessments (no video content).
function lms_sum_active_assessments_total_questions() {
    var sum = 0;
    (typeof assessment_data !== 'undefined' && assessment_data ? assessment_data : []).forEach(function (a) {
        sum += Number(a.TotalQuestion) || 0;
    });
    return sum;
}

function lms_sum_active_assessments_answered_questions() {
    var sum = 0;
    (typeof assessment_data !== 'undefined' && assessment_data ? assessment_data : []).forEach(function (a) {
        sum += Number(a.SubmitedQuestion) || 0;
    });
    return sum;
}

// Active role for LMS RoleWise APIs — after a multi-role switch in Home the
// session role_id updates but role_id_array (set once at login) does not.
var lms_listing_role_key = null;

function lms_get_storage_user_id() {
    try {
        var id = JSON.parse(storage.getItem('user_id'));
        if (id != null && id !== '' && id !== 0) return String(id);
    } catch (e) { }
    return '';
}

// LmsData cache keys must include user id — otherwise a different login on the
// same device reuses another user's module/assessment/dashboard listings.
function lms_listing_cache_key(kind, roleId) {
    var uid = lms_get_storage_user_id() || '0';
    if (kind === 'dashboard') return 'dashboard_' + uid;
    var rid = roleId != null ? String(roleId) : lms_get_active_role_id();
    return kind + '_' + uid + '_' + rid;
}

var LMS_PERSISTED_KEYS = [
    'lms_watch_seconds_modules',
    'lms_watch_seconds_modules_daily',
    'lms_watch_seconds_modules_by_item',
    'lms_watch_seconds_skills',
    'lms_watch_seconds_skills_by_item',
    'lms_watch_seconds_skills_daily',
    'lms_watch_seconds_ml',
    'lms_watch_seconds_ml_daily',
    'lms_watch_seconds_assessments',
    'lms_watch_seconds_assessments_daily',
    'lms_watch_seconds_assessments_by_item',
    'lms_assessment_completion_log',
    'lms_module_skill_index',
    'lms_skill_total_seconds',
    'lms_video_durations_modules',
    'lms_video_durations_ml',
    'lms_ml_quiz_correct',
    'lms_ml_quiz_total',
    'lms_ml_quiz_daily',
    'lms_owner_user_id',
    'ml_last_index',
    'ml_muted',
    'ml_answered_quizzes'
];

function lms_collect_login_backup() {
    var backup = { _userId: lms_get_storage_user_id(), _video_progress: {} };
    LMS_PERSISTED_KEYS.forEach(function (key) {
        var val = localStorage.getItem(key);
        if (val !== null) backup[key] = val;
    });
    for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf('video_progress_') === 0) {
            backup._video_progress[k] = localStorage.getItem(k);
        }
    }
    return backup;
}

function lms_restore_login_backup(backup) {
    if (!backup) return;
    LMS_PERSISTED_KEYS.forEach(function (key) {
        if (backup[key] != null) localStorage.setItem(key, backup[key]);
    });
    Object.keys(backup._video_progress || {}).forEach(function (k) {
        localStorage.setItem(k, backup._video_progress[k]);
    });
}

function lms_clear_all_local_state() {
    try {
        if (typeof LmsData !== 'undefined' && LmsData.clearAll) LmsData.clearAll();
    } catch (e) { }
    var toRemove = [];
    for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (!k) continue;
        if (k.indexOf('lms_') === 0 || k.indexOf('video_progress_') === 0 ||
            k.indexOf('ml_answered') === 0 || k === 'ml_last_index' || k === 'ml_muted' ||
            k === 'ml_video_cache_map' || k === 'ml_video_cache_order') {
            toRemove.push(k);
        }
    }
    toRemove.forEach(function (k) { localStorage.removeItem(k); });
    lms_reset_runtime_listings();
}

function lms_reset_runtime_listings() {
    lms_listing_role_key = null;
    if (typeof safety_module_listing_requested !== 'undefined') safety_module_listing_requested = false;
    if (typeof assessment_listing_requested !== 'undefined') assessment_listing_requested = false;
    if (typeof lms_module_total_time_started !== 'undefined') lms_module_total_time_started = false;
    if (typeof lms_ml_total_time_started !== 'undefined') lms_ml_total_time_started = false;
    if (typeof safety_module_data !== 'undefined') safety_module_data = [];
    if (typeof assessment_data !== 'undefined') assessment_data = [];
    if (typeof dashboard_kpi_data !== 'undefined') dashboard_kpi_data = [];
    lms_module_skill_index = {};
    lms_skill_total_seconds = {};
    if (typeof lms_module_video_totals !== 'undefined') lms_module_video_totals = {};
    if (typeof ml_catalog_ml_ids !== 'undefined') ml_catalog_ml_ids = null;
    if (typeof user_activitiy_Array !== 'undefined') user_activitiy_Array = [];
}

function lms_finalize_login_user(newUserId) {
    var backup = window._lmsLoginBackup || null;
    window._lmsLoginBackup = null;
    var prev = backup && backup._userId ? String(backup._userId) : '';
    var next = newUserId != null && newUserId !== '' ? String(newUserId) : '';
    if (prev && next && prev === next) {
        lms_restore_login_backup(backup);
    } else {
        lms_clear_all_local_state();
    }
    if (next) localStorage.setItem('lms_owner_user_id', next);
}

function lms_prune_module_catalog(activeModules) {
    var active = {};
    (activeModules || []).forEach(function (m) {
        if (m && m.Module_Id != null) active[String(m.Module_Id)] = true;
    });
    Object.keys(lms_module_skill_index).forEach(function (mid) {
        if (!active[mid]) delete lms_module_skill_index[mid];
    });
    try {
        localStorage.setItem('lms_module_skill_index', JSON.stringify(lms_module_skill_index));
    } catch (e) { }
}

function lms_get_active_role_id() {
    try {
        var active = JSON.parse(storage.getItem('role_id'));
        if (active != null && active !== '' && active !== 0) return String(active);
    } catch (e) { }
    var roleArray = localStorage.getItem('role_id_array');
    return (roleArray != null && roleArray !== '') ? String(roleArray) : '';
}

function lms_reset_listings_if_role_changed() {
    var key = lms_get_active_role_id();
    if (!key) return false;
    if (lms_listing_role_key !== null && lms_listing_role_key !== key) {
        if (typeof safety_module_listing_requested !== 'undefined') safety_module_listing_requested = false;
        if (typeof assessment_listing_requested !== 'undefined') assessment_listing_requested = false;
        if (typeof lms_module_total_time_started !== 'undefined') lms_module_total_time_started = false;
        lms_module_skill_index = {};
        lms_skill_total_seconds = {};
        try {
            localStorage.removeItem('lms_module_skill_index');
            localStorage.removeItem('lms_skill_total_seconds');
        } catch (e) { }
        if (typeof safety_module_data !== 'undefined') safety_module_data = [];
        if (typeof assessment_data !== 'undefined') assessment_data = [];
        lms_listing_role_key = key;
        return true;
    }
    if (lms_listing_role_key === null) lms_listing_role_key = key;
    return false;
}

// Module ids currently assigned to this user (safety_module_data). Dashboard
// metrics must ignore historical activity for modules no longer in the list.
function lms_get_active_module_ids() {
    var set = {};
    (typeof safety_module_data !== 'undefined' && safety_module_data ? safety_module_data : []).forEach(function (m) {
        if (m && m.Module_Id != null && m.Module_Id !== '') set[String(m.Module_Id)] = true;
    });
    return set;
}

function lms_is_active_dashboard_module(modKey) {
    var active = lms_get_active_module_ids();
    if (!Object.keys(active).length) return true;
    return !!active[modKey];
}

function lms_sum_active_modules_watch_seconds() {
    var sum = 0;
    (typeof safety_module_data !== 'undefined' && safety_module_data ? safety_module_data : []).forEach(function (m) {
        if (typeof lms_get_module_watched_seconds === 'function') {
            sum += lms_get_module_watched_seconds(m.Module_Id);
        }
    });
    return sum;
}

function lms_sum_active_modules_total_video_seconds() {
    var sum = 0;
    (typeof safety_module_data !== 'undefined' && safety_module_data ? safety_module_data : []).forEach(function (m) {
        var mid = m.Module_Id;
        var t = (typeof lms_module_video_totals !== 'undefined' && lms_module_video_totals)
            ? (lms_module_video_totals[mid] || lms_module_video_totals[String(mid)] || 0) : 0;
        sum += t;
    });
    return sum;
}

function lms_get_module_record_by_id(moduleId) {
    var mods = (typeof safety_module_data !== 'undefined' && safety_module_data) ? safety_module_data : [];
    for (var i = 0; i < mods.length; i++) {
        if (String(mods[i].Module_Id) === String(moduleId)) return mods[i];
    }
    return null;
}

function lms_get_module_score_pct_by_id(moduleId) {
    var mod = lms_get_module_record_by_id(moduleId);
    return (typeof lms_module_score_pct === 'function') ? lms_module_score_pct(mod) : null;
}

function lms_sum_daily_watch_in_range(dailyKey, range) {
    if (!range) return 0;
    var sum = 0;
    var cursor = new Date(range.start);
    while (cursor <= range.end) {
        sum += lms_get_watch_seconds_daily(dailyKey, cursor);
        cursor.setDate(cursor.getDate() + 1);
    }
    return sum;
}

// Range watch for the dashboard — same lesson-sum total the module cards use,
// apportioned across days via per-skill daily buckets (falls back to legacy
// module-level daily when skill buckets predate this fix).
function lms_sum_active_modules_watch_seconds_in_range(range) {
    if (!range) return lms_sum_active_modules_watch_seconds();

    var activeWatch = lms_sum_active_modules_watch_seconds();
    var skillsDaily = lms_sum_daily_watch_in_range('lms_watch_seconds_skills_daily', range);
    var skillsGlobal = lms_get_watch_seconds('lms_watch_seconds_skills');

    if (skillsGlobal > 0 && activeWatch > 0) {
        return Math.round(activeWatch * (skillsDaily / skillsGlobal));
    }
    if (skillsDaily > 0) return skillsDaily;

    var modulesDaily = lms_sum_daily_watch_in_range('lms_watch_seconds_modules_daily', range);
    var modulesGlobal = lms_get_watch_seconds('lms_watch_seconds_modules');
    if (modulesGlobal > 0 && activeWatch > 0) {
        return Math.round(activeWatch * (modulesDaily / modulesGlobal));
    }
    return modulesDaily;
}

function lms_get_module_daily_watch_seconds(day) {
    var activeWatch = lms_sum_active_modules_watch_seconds();
    var skillsGlobal = lms_get_watch_seconds('lms_watch_seconds_skills');
    var daySec = lms_get_watch_seconds_daily('lms_watch_seconds_skills_daily', day);

    if (skillsGlobal > 0 && activeWatch > 0) {
        return Math.round(activeWatch * (daySec / skillsGlobal));
    }
    if (daySec > 0) return daySec;

    var modulesGlobal = lms_get_watch_seconds('lms_watch_seconds_modules');
    var modDaySec = lms_get_watch_seconds_daily('lms_watch_seconds_modules_daily', day);
    if (modulesGlobal > 0 && activeWatch > 0) {
        return Math.round(activeWatch * (modDaySec / modulesGlobal));
    }
    return modDaySec;
}

function lms_module_score_pct(item) {
    if (!item) return null;
    var totalQ = Number(item.TotalQuestion) || 0;
    var submitted = Number(item.SubmitedSkill) || Number(item.SubmitedQuestion) || 0;
    var score = Number(item.Score);
    if (submitted > 0 && totalQ > 0 && !isNaN(score)) {
        return (score / totalQ) * 100;
    }
    return null;
}

function lms_get_lesson_local_record(skillId) {
    try {
        var data = JSON.parse(localStorage.getItem('video_progress_' + skillId)) || [];
        return data.find(function (item) { return item.Skill_Id == skillId; }) || null;
    } catch (e) {
        return null;
    }
}

// The skill-listing API only ever reports Progress as 0 or 100 — it flips to 100
// on quiz submit and stays 0 until then, so a part-watched lesson is
// indistinguishable from an untouched one and could never show "In Progress".
// Local playback progress fills that gap, but it must never be able to signal
// 100 on its own: "Completed" has to mean the quiz was submitted, not that the
// video was watched to the end. video_progress_<id>.Progress is
// (currentTime/duration)*100 — a viewer who watches the whole video without
// ever touching the quiz would otherwise read as Completed (checkmark, status,
// and load_lesson_scores() would fetch a score for a lesson never submitted).
// Capped at 99 so it can only ever push the lesson into "In Progress".
function lms_get_lesson_effective_progress(skillId, serverProgress) {
    var server = Number(serverProgress) || 0;
    if (server >= 100) return 100;
    var rec = lms_get_lesson_local_record(skillId);
    var local = rec ? Math.min(Number(rec.Progress) || 0, 99) : 0;
    if (local === 0 && typeof lms_get_watch_seconds_by_item === 'function') {
        var wall = lms_get_watch_seconds_by_item('lms_watch_seconds_skills', skillId);
        if (wall > 0) local = 1;
    }
    return Math.max(server, local);
}

// ---- Adaptive corner-badge contrast (Tag/Score on card thumbnails) ----------
// The reference design is plain black text on a flat white background — no
// pill, no scrim. Our thumbnails are real photos, so instead of a fixed
// color we sample each corner's actual pixel brightness and flip that badge
// to dark text (light corner) or light text (dark corner), per-corner since
// one photo can be bright top-left and dark bottom-left at once.
//
// The visible <img> is never given crossOrigin (that can make the browser
// refuse to even display it if the asset host doesn't send CORS headers) —
// sampling instead uses a throwaway probe Image() at the same URL. If the
// host isn't CORS-enabled the probe's canvas read throws and this silently
// leaves the badge at its default (light-text) styling; no visible harm.
function lms_apply_corner_contrast(srcUrl, cardEl) {
    if (!srcUrl || !cardEl || typeof document === 'undefined') return;
    var probe = new Image();
    probe.crossOrigin = 'anonymous';
    probe.onload = function () {
        try {
            var w = probe.naturalWidth, h = probe.naturalHeight;
            if (!w || !h) return;
            var cw = Math.max(1, Math.round(w * 0.3));
            var ch = Math.max(1, Math.round(h * 0.22));
            var canvas = document.createElement('canvas');
            canvas.width = 12;
            canvas.height = 12;
            var ctx = canvas.getContext('2d');
            var corners = [
                { sel: '.sample-module-tag', right: false, bottom: false },
                { sel: '.sample-score-tag', right: true, bottom: false },
                { sel: '.sample-module-watchtime', right: false, bottom: true }
            ];
            corners.forEach(function (c) {
                var el = cardEl.querySelector(c.sel);
                if (!el) return;
                var sx = c.right ? (w - cw) : 0;
                var sy = c.bottom ? (h - ch) : 0;
                // Some thumbnails are PNGs with mostly-transparent regions
                // (icons, logos) — an unfilled canvas reads those pixels back
                // as (0,0,0,0), which would score as pure black even though
                // they visually show whatever sits behind them. Pre-fill with
                // the real .sample-module-image background color so alpha
                // compositing lands on the actual visible color, not black.
                ctx.clearRect(0, 0, 12, 12);
                ctx.fillStyle = '#d7e1ec';
                ctx.fillRect(0, 0, 12, 12);
                ctx.drawImage(probe, sx, sy, cw, ch, 0, 0, 12, 12);
                var data = ctx.getImageData(0, 0, 12, 12).data;
                var sum = 0, n = 0;
                for (var i = 0; i < data.length; i += 4) {
                    sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                    n++;
                }
                el.classList.toggle('on-light-bg', (sum / n) > 165);
            });
        } catch (e) { /* CORS-tainted canvas — keep default light-text styling */ }
    };
    probe.src = srcUrl;
}

// Compact "<selected filter> · <count>" line under the filter chips (Modules /
// Assessments). Replaces the per-chip count badges, which cluttered the pills.
//
// `count` is passed in by the card renderers as the length of the list they are
// about to paint, deliberately rather than re-tallying tags here: that keeps the
// number honest when tag + search + sort are combined, and means it can never
// disagree with the cards actually on screen. Nothing is hardcoded — the label
// is the live selected tag and the count is the live result set.
function lms_render_filter_summary(elId, tagName, count) {
    var el = document.getElementById(elId);
    if (!el) return;
    if (!el.firstChild) {
        el.innerHTML = '<span class="lms-filter-summary-name"></span>' +
                       '<span class="lms-filter-summary-sep">·</span>' +
                       '<span class="lms-filter-summary-count"></span>';
    }
    // textContent, not string-concatenated HTML — tag names come from the
    // server and would otherwise be an injection point.
    el.querySelector('.lms-filter-summary-name').textContent = tagName;
    el.querySelector('.lms-filter-summary-count').textContent = count;
}

// Info-bar value updates fade rather than snap (150-250ms, per design spec) —
// no-op if the text isn't actually changing, so re-renders don't flash.
function lms_set_info_value(el, text) {
    if (!el || el.textContent === text) return;
    el.style.opacity = '0';
    setTimeout(function () {
        el.textContent = text;
        el.style.opacity = '1';
    }, 120);
}

// Attach once per <video> element — accumulates the wall-clock gap between
// "play" and the next "pause"/"ended", regardless of which code path called
// .play()/.pause() (native controls, custom buttons, or programmatic).
// itemIdAttr (optional): a DOM attribute name (e.g. "module_id") whose value is
// captured AT PLAY-START, so the elapsed seconds are also credited to that
// item's own per-item bucket (see lms_add_watch_seconds_by_item).
//
// Captured at play-start rather than read at flush time because the "pause"
// event is ASYNCHRONOUS (verified live: pause() followed by an immediate
// attribute reassignment fires the handler AFTER the reassignment). This
// element is shared across every lesson, and closing one lesson to open
// another does exactly that — pause(), then get_questionlog_by_skill_id()
// overwrites skil_id/module_id. Reading at flush therefore credited the
// just-watched seconds to the NEXT lesson's module: the module card showed
// watch time its own lessons never accounted for.
function lms_track_watch_time(videoEl, storageKey, itemIdAttr, extraByItem) {
    if (!videoEl || videoEl._lmsWatchTracked) return;
    videoEl._lmsWatchTracked = true;
    var playStartedAt = null;
    var playStartedItemId = null;
    var playStartedExtraId = null;

    function flush() {
        if (playStartedAt === null) return;
        var elapsed = (Date.now() - playStartedAt) / 1000;
        var itemId = playStartedItemId;
        var extraId = playStartedExtraId;
        playStartedAt = null;
        playStartedItemId = null;
        playStartedExtraId = null;
        lms_add_watch_seconds(storageKey, elapsed);
        lms_add_watch_seconds_daily(storageKey + '_daily', elapsed);
        if (itemIdAttr && itemId) {
            lms_add_watch_seconds_by_item(storageKey, itemId, elapsed);
        }
        if (extraByItem && extraByItem.key && extraId) {
            lms_add_watch_seconds_by_item(extraByItem.key, extraId, elapsed);
            lms_add_watch_seconds_daily(extraByItem.key + '_daily', elapsed);
        }
    }

    $(videoEl).on('play', function () {
        playStartedAt = Date.now();
        playStartedItemId = itemIdAttr ? videoEl.getAttribute(itemIdAttr) : null;
        if (extraByItem && extraByItem.attr) {
            playStartedExtraId = videoEl.getAttribute(extraByItem.attr);
            videoEl._lmsPlaySkillId = playStartedExtraId;
        } else {
            videoEl._lmsPlaySkillId = videoEl.getAttribute('skil_id');
        }
    });
    $(videoEl).on('pause ended', flush);
}

// ---- Library-wide total video time ------------------------------------------
// No API field reliably carries video duration (Modules' Video_Time is present
// in the schema but empty in practice; Micro Learning has no duration field at
// all), so this reads real durations directly off each video file via
// preload="metadata" (fetches just enough of the file for the browser to know
// its length, not the whole video) and sums them. Per-item durations are
// cached by id in localStorage so repeat runs only fetch videos not seen
// before — still a real bandwidth cost on first encounter, by design (user-
// approved tradeoff for a true library-wide total).
function lms_sum_video_durations(cacheKey, items, idField, urlField, onDone) {
    var cache = {};
    try { cache = JSON.parse(localStorage.getItem(cacheKey)) || {}; } catch (e) { cache = {}; }

    var validIds = {};
    var toFetch = [];
    (items || []).forEach(function (item) {
        var id = String(item[idField] || '');
        var url = item[urlField];
        if (!id || !url) return;
        validIds[id] = true;
        if (typeof cache[id] !== 'number') toFetch.push({ id: id, url: url });
    });

    function finish() {
        localStorage.setItem(cacheKey, JSON.stringify(cache));
        var total = 0;
        Object.keys(cache).forEach(function (id) { if (validIds[id]) total += cache[id]; });
        if (onDone) onDone(total);
    }

    if (toFetch.length === 0) { finish(); return; }

    var CONCURRENCY = 3;
    var nextIdx = 0;
    var pending = toFetch.length;

    function loadOne(entry, cb) {
        var v = document.createElement('video');
        v.preload = 'metadata';
        v.muted = true;
        var settled = false;
        function done(duration) {
            if (settled) return;
            settled = true;
            v.removeAttribute('src');
            try { v.load(); } catch (e) { }
            cb(duration);
        }
        v.addEventListener('loadedmetadata', function () { done(v.duration); });
        v.addEventListener('error', function () { done(null); });
        v.src = entry.url;
    }

    function pump() {
        if (nextIdx >= toFetch.length) return;
        var entry = toFetch[nextIdx++];
        loadOne(entry, function (duration) {
            if (typeof duration === 'number' && isFinite(duration) && duration > 0) {
                cache[entry.id] = duration;
            }
            pending--;
            if (pending <= 0) { finish(); }
            else { pump(); }
        });
    }

    var starters = Math.min(CONCURRENCY, toFetch.length);
    for (var i = 0; i < starters; i++) pump();
}

$(document).ready(function () {

    // Server-driven site colour (`viewsite_btn_color`) — chrome only: the top
    // bar, title bar and primary buttons.
    //
    // The LMS *content* accent is deliberately NOT this. It is --c-primary
    // (#215ba8), the same blue as the bottom tab bar's active highlight, and it
    // covers the selected filter chip, the card progress bars, the card percent
    // label and the filter-summary count so they all read as one accent.
    // Those four used to be in the lists below, where this !important rule
    // forced them to the site colour (a grey on the current site) and overrode
    // the #215ba8 already written for them in LMS_Misc.css — .sample-module-percent
    // in particular was authored blue and silently painted grey. They were
    // removed from here rather than fought with a louder rule in the CSS; do not
    // add them back without moving the accent definition too.
    let t_color_name = JSON.parse(storage.getItem('viewsite_btn_color'));
    let style_str = "<style>.navbar-bg, .sample-safety-titlebar,.sample-module-btn{background: " + t_color_name + " !important;}";
    style_str += ".sample-safety-filter,.sample-safety-sort-option.active{color:" + t_color_name + " !important;}</style>";
    $("head").append(style_str);

    // tab-3 (Dashboard) is the initially-active tab, and has no top bar — hide
    // it immediately rather than waiting for the first tab:show, which only
    // fires on a subsequent switch, not for the pre-active tab on page load.
    $(".navbar").hide();

    if (typeof lms_load_module_skill_index === 'function') lms_load_module_skill_index();

    var lmsOwner = localStorage.getItem('lms_owner_user_id');
    var lmsCurrent = (typeof lms_get_storage_user_id === 'function') ? lms_get_storage_user_id() : '';
    if (lmsOwner && lmsCurrent && lmsOwner !== lmsCurrent) {
        if (typeof lms_clear_all_local_state === 'function') lms_clear_all_local_state();
    } else if (lmsCurrent) {
        localStorage.setItem('lms_owner_user_id', lmsCurrent);
    }

    if (typeof lms_reset_runtime_listings === 'function') lms_reset_runtime_listings();

    get_safety_module_listing(true);
    get_assessments_listing(true);
    get_user_activities();
    get_dashboard_data(true);

    window.addEventListener('pageshow', function (ev) {
        if (typeof lms_reset_listings_if_role_changed === 'function') {
            lms_reset_listings_if_role_changed();
        }
        // Home -> LMS (bfcache restore) must refetch assigned/removed modules.
        if (!ev.persisted) return;
        if (typeof get_safety_module_listing === 'function') get_safety_module_listing(true);
        if (typeof get_assessments_listing === 'function') get_assessments_listing(true);
        if (typeof get_dashboard_data === 'function') get_dashboard_data(true);
    });

    $(document).on('tab:show', '.tab', function () {

        pauseAllVideos();

        // Keep the top/bottom bar theme + active-tab state in sync on EVERY tab
        // change — swipe and hardware-back included, not just tabbar taps. Only
        // the Micro Learning (tab-4) reels screen uses the dark bars; all others
        // are light, so switching away from it must clear the dark classes.
        var _isML = (this.id == "tab-4");
        var _tabbar = document.querySelector('.toolbar.tabbar');
        if (_tabbar) _tabbar.classList.toggle('tabbar-dark', _isML);
        var _navbar = document.querySelector('.navbar');
        if (_navbar) _navbar.classList.toggle('navbar-dark', _isML);
        try {
            lms_active_tab = this.id == "tab-1" ? 'Modules'
                : this.id == "tab-2" ? 'Assessments'
                : this.id == "tab-3" ? 'Dashboard'
                : this.id == "tab-4" ? 'Micro Learning' : lms_active_tab;
        } catch (e) { }

        if (this.id == "tab-1") {
            $(".navbar").hide();
            $(".sample-safety-titlebar").html("Safety Modules");
            if (typeof lms_reset_listings_if_role_changed === 'function') lms_reset_listings_if_role_changed();
            get_safety_module_listing(true);
        }
        else if (this.id == "tab-2") {
            $(".navbar").hide();
            $(".sample-safety-titlebar").html("Assessments");
            if (typeof lms_reset_listings_if_role_changed === 'function') lms_reset_listings_if_role_changed();
            get_assessments_listing(true);
        }
        else if (this.id == "tab-3") {
            $(".navbar").hide();
            get_dashboard_data(true);
        }
        else if (this.id == "tab-4") {
            $(".navbar").hide();
            if (typeof lms_ml_total_time_started !== 'undefined') lms_ml_total_time_started = false;
            get_user_activities();
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

    var lastProgressSaveAt = 0;

    $(video).on("play", function () {
        video._lmsPlaySkillId = $(video).attr("skil_id");
        if (this.currentTime < 0.5) {
            call_by_videolog('start'); // call api
        }
        set_progress_local(video._lmsPlaySkillId, video.currentTime);
        set_progress();
    });

    // Otherwise a manual seek/scrub only gets captured by the 10s interval
    // (set_progress()) or on pause/close — up to a 10s window where the
    // resume position and effective-progress ("In Progress" vs "Completed")
    // don't reflect where the user actually dragged to. "seeked" (not
    // "seeking") fires once the scrub settles, so this doesn't fire on every
    // intermediate frame while dragging.
    //
    // "pause" is bound here too — this is the ONLY save path that fires on a
    // bare native pause (tapping the native control, or the WebView auto-
    // pausing when the app is backgrounded/screen-locked/interrupted by a
    // call). Every other save point (play-start, seeked, ended, the explicit
    // popup-close handlers) requires an app-level route that a background
    // interruption bypasses entirely. lms_track_watch_time already binds its
    // own flush to raw "pause ended" for the same reason (see its comment
    // above) — the module card's watch-time badge was updating correctly
    // while this per-lesson resume position stayed stuck at 0 until this was
    // added, because only the former was actually listening for a bare pause.
    $(video).on("pause seeked", function () {
        var skillId = video._lmsPlaySkillId || $(video).attr("skil_id");
        set_progress_local(skillId, video.currentTime);
    });

    // Belt-and-suspenders: persist resume position during playback, not only on
    // pause/close — covers the async-pause race when switching lessons.
    $(video).on("timeupdate", function () {
        var now = Date.now();
        if (now - lastProgressSaveAt < 2000) return;
        lastProgressSaveAt = now;
        var skillId = video._lmsPlaySkillId || $(video).attr("skil_id");
        if (skillId && video.currentTime > 0) {
            set_progress_local(skillId, video.currentTime);
        }
    });

    lms_track_watch_time(video, 'lms_watch_seconds_modules', 'module_id', {
        key: 'lms_watch_seconds_skills',
        attr: 'skil_id'
    });

    // clear timer properly
    $(video).on("ended", function () {
        // Full-screen: mandatory quiz popup. Minimized/normal mode (or an
        // already-completed lesson): existing inline question-list behaviour.
        if (safety_quiz_progress != "100" && safetyVideoLandscapeMode && typeof safety_quiz_start === 'function') {
            safety_quiz_start();
        } else {
            $("#dv_Question_List").show();
            if (typeof lms_sync_lesson_submit_footer === 'function') lms_sync_lesson_submit_footer();
        }
        set_progress_local();
        clearInterval(progressInterval);
        console.log("Interval cleared");
    });

    // Native <video> full-screen: some WebViews fire these on the element instead
    // of a document fullscreenchange — drive the same landscape rotation.
    $(video).on("webkitbeginfullscreen", function () { enterSafetyVideoLandscape(); });
    $(video).on("webkitendfullscreen", function () { if (safetyVideoLandscapeMode) finishSafetyVideoLandscape(); });

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
    $("#lesson_submit_footer").hide();
    var video = $("#vdo_Question")[0];

    if (video) {
        var sid = video._lmsPlaySkillId || $(video).attr("skil_id");
        var ct = video.currentTime;
        set_progress_local(sid, ct);
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

// Pause + persist the lesson video and stop its progress timer whenever the
// video popup closes by ANY route (hardware back, swipe, programmatic close) —
// not just the "Close" link. Fixes: (1) the video kept playing in the background
// after navigating back, and (2) the still-running 10s timer overwriting the
// saved resume position with 0 on reopen, which made the video restart from the
// beginning instead of resuming.
$(document).on("popup:close", ".popup-level-4", function () {
    try {
        if (typeof safety_quiz_close_modal === 'function') safety_quiz_close_modal();
        // Any close route, not just the "Close" link's own handler below —
        // matches this handler's own reason for existing (hardware back, swipe,
        // programmatic close all bypass a plain click handler).
        $("#dv_Question_List").hide();
        $("#lesson_submit_footer").hide();
        var v = $("#vdo_Question")[0];
        if (v) {
            var sid = v._lmsPlaySkillId || $(v).attr("skil_id");
            var ct = v.currentTime;
            set_progress_local(sid, ct); // capture before pause; pause is async
            v.pause(); // flushes this session into lms_watch_seconds_modules (see lms_track_watch_time)
        }
        if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
        }
        if (typeof update_module_kpi === 'function') update_module_kpi();
        if (typeof lms_reconcile_all_module_watch === 'function') lms_reconcile_all_module_watch();
        // refresh the just-watched module's card (watched-time row) with the
        // seconds flushed by v.pause() above
        if (typeof render_safety_module_cards === 'function') render_safety_module_cards();
        var closedSkill = sid;
        var closedModule = v ? ($(v).attr('module_id') || $('.lesson-preview-card[data-skill-id="' + closedSkill + '"]').attr('data-module-id')) : null;
        if (closedModule && typeof lms_refresh_module_card_watchtime === 'function') {
            lms_refresh_module_card_watchtime(closedModule);
        }
        // ...and the lesson list still open behind this popup, so its watched
        // time and status update right away instead of only on reopen.
        if (typeof refresh_lesson_preview_rows === 'function') refresh_lesson_preview_rows();
    } catch (e) { }
});

$(document).on("popup:close", ".popup-assessment-que", function () {
    try {
        if (typeof lms_flush_assessment_watch === 'function') lms_flush_assessment_watch();
        if (typeof update_lms_kpi === 'function') update_lms_kpi();
    } catch (e) { }
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

// The single expand control is now the native video-player full-screen button.
// Rotate to landscape when the safety video enters full-screen (by any route)
// and restore portrait on exit.
function enterSafetyVideoLandscape() {
    if (safetyVideoLandscapeMode) return;
    safetyVideoReturnedFromFullscreen = false;
    safetyVideoLandscapeMode = true;
    setSafetyVideoOrientation('landscape');
}

function isSafetyVideoFsElement(el) {
    if (!el) return false;
    if (el.id === 'vdo_Question' || el.id === 'safety-video-container') return true;
    var c = document.getElementById('safety-video-container');
    return !!(c && c.contains(el));
}

document.addEventListener('fullscreenchange', function () {
    var el = document.fullscreenElement;
    if (isSafetyVideoFsElement(el)) enterSafetyVideoLandscape();
    else if (!el && safetyVideoLandscapeMode) finishSafetyVideoLandscape();
});

document.addEventListener('webkitfullscreenchange', function () {
    var el = document.webkitFullscreenElement;
    if (isSafetyVideoFsElement(el)) enterSafetyVideoLandscape();
    else if (!el && safetyVideoLandscapeMode) finishSafetyVideoLandscape();
});

function back_button_LMS() {
    // Mandatory full-screen quiz in progress — swallow back until it's submitted.
    if (typeof safety_quiz_mandatory_active !== 'undefined' && safety_quiz_mandatory_active) {
        return false;
    }

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

    var ml_quiz_popup = $('#pnl_ML_Question.modal-in');
    if (ml_quiz_popup.length > 0) {
        myApp.sheet.close('#pnl_ML_Question');
        if (typeof playNextReelOrRestart === 'function') {
            playNextReelOrRestart();
        }
        return false;
    }

    // Never classify a screen with an active Framework7 modal as the root,
    // including the short layout interval following an orientation change.
    if ($('.popup.modal-in, .popup.popup-in, .popup.popup-opened, .dialog.modal-in, .sheet-modal.modal-in').length > 0) {
        return false;
    }

    if (typeof mainView !== 'undefined' && mainView && mainView.history && mainView.history.length > 1 && mainView.router && mainView.router.back) {
        // mainView.router.back();
        // return false;
    }

    var dashboardTab = $('#tab-3');
    var isDashboardTabActive = dashboardTab.hasClass('tab-active') ||
        dashboardTab.hasClass('swiper-slide-active') ||
        $('a.tab-link[href="#tab-3"]').hasClass('tab-link-active');

    if (!isDashboardTabActive) {
        // Modules, Assessments and Micro Learning all return to the Dashboard
        // tab — the screen the LMS opens on. This pauses only .reel-video elements.
        pauseAllVideos();
        myApp.tab.show('#tab-3');
        return false;
    }

    // The Dashboard tab with no popup, fullscreen player or router history is
    // the sole LMS root state where exiting the app is allowed.
    return true;
}
