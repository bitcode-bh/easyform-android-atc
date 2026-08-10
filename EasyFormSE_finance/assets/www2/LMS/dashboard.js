

var dashboard_kpi_data = [];

// Which category feeds the context card above the Modules/Assessments/Micro
// Learning selector row.
var lms_dashboard_selected_category = 'Modules';

// Week / Month / Custom date-range filter driving the trend chart.
var lms_trend_range_type = 'week';
var lms_trend_custom_start = null;
var lms_trend_custom_end = null;
var lms_trend_chart_instance = null;
var lms_trend_chart_kind = null; // tracks which config is currently in #lms-trend-chart
var lms_ml_coverage_chart_instance = null;
var lms_trend_calendar_instance = null;

// #lms-trend-chart hosts three very different chart shapes depending on the
// selected category (Modules multi-line trend / Assessments bar / Micro
// Learning watch-time trend) — destroy + recreate on a kind change rather than
// risk ApexCharts.updateOptions() carrying over incompatible config (e.g. a
// multi-axis array) between them; reuse updateOptions only when re-rendering
// the same kind (filter change, data refresh).
function lms_render_apex_chart(elId, options, kind) {
    var el = document.getElementById(elId);
    if (!el || typeof ApexCharts === 'undefined') return;

    if (lms_trend_chart_instance && lms_trend_chart_kind === kind) {
        lms_trend_chart_instance.updateOptions(options, true, true);
        return;
    }
    if (lms_trend_chart_instance) {
        lms_trend_chart_instance.destroy();
        lms_trend_chart_instance = null;
    }
    el.innerHTML = ''; // clear the loading-skeleton/error placeholder before first render
    lms_trend_chart_instance = new ApexCharts(el, options);
    lms_trend_chart_kind = kind;
    lms_trend_chart_instance.render();
}

$(document).on('ptr:refresh', '.ptr-content', function (e) {
    try {
        if (typeof get_safety_module_listing === 'function') get_safety_module_listing(true);
        if (typeof get_assessments_listing === 'function') get_assessments_listing(true);
        if (typeof get_user_activities === 'function') get_user_activities();
        get_dashboard_data(true);
    } catch (err) { console.error(err); }

    setTimeout(function () {
        update_lms_kpi();
        if (e.detail) e.detail();
    }, 1500);
});

// Count-up tween for the KPI values (0 -> target). Cheap, rAF-based.
function lms_count_up(el, target) {
    if (!el) return;
    target = Number(target) || 0;
    var start = null, dur = 600;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        el.textContent = target;
        return;
    }
    function step(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        el.textContent = Math.round(target * (0.5 - Math.cos(p * Math.PI) / 2));
        if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

// ---- Trend chart -----------------------------------------------------------
// Three real, date-bucketed metrics drawn from the Modules activity log
// (dashboard_kpi_data / LMS_Select_Dashboard) — the only LMS dataset that
// carries a per-record date (SubmittedDate). Assessments and Micro Learning
// have no date field anywhere in their data (assessments.js / micro_learning.js),
// so there's nothing real to bucket by day for them; they stay as static
// totals in the summary cards below the chart instead of fabricated trend lines.

function lms_parse_submitted_date(str) {
    if (!str) return null;
    var d = new Date(str);
    if (!isNaN(d.getTime())) { d.setHours(0, 0, 0, 0); return d; }

    // Fallback for "DD-MM-YYYY" / "DD/MM/YYYY" / "YYYY-MM-DD" style strings
    // that some WebViews fail to parse natively.
    var parts = String(str).split(/[\/\- ]/).filter(Boolean);
    if (parts.length >= 3) {
        var a = parseInt(parts[0], 10), b = parseInt(parts[1], 10), c = parseInt(parts[2], 10);
        if (a > 31) { d = new Date(a, b - 1, c); }      // YYYY-MM-DD
        else { d = new Date(c, b - 1, a); }             // DD-MM-YYYY
        if (!isNaN(d.getTime())) { d.setHours(0, 0, 0, 0); return d; }
    }
    return null;
}

function lms_date_key(d) {
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
}

function lms_trend_range_dates() {
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var start, end;
    if (lms_trend_range_type === 'month') {
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else if (lms_trend_range_type === 'custom' && lms_trend_custom_start && lms_trend_custom_end) {
        start = new Date(lms_trend_custom_start); start.setHours(0, 0, 0, 0);
        end = new Date(lms_trend_custom_end); end.setHours(0, 0, 0, 0);
        if (start > end) { var t = start; start = end; end = t; }
    } else { // week — also the fallback before a custom range has been picked
        end = today;
        start = new Date(today); start.setDate(start.getDate() - 6);
    }
    return { start: start, end: end };
}

function lms_trend_label_fmt(d) {
    // "Days of the selected month" for Month; "D MMM" for Week/Custom, which
    // can span a month boundary and need the month for clarity.
    return (lms_trend_range_type === 'month')
        ? String(d.getDate())
        : (d.getDate() + ' ' + d.toLocaleString('en-US', { month: 'short' }));
}

// Stable per-module key for dashboard activity rows — rewatches and extra lesson
// submits for the same module must collapse to one completion.
function lms_dashboard_module_key(rec) {
    if (!rec) return null;
    if (rec.Module_Id != null && rec.Module_Id !== '') return String(rec.Module_Id);
    if (rec.Module_Schedule_Id != null && rec.Module_Schedule_Id !== '') return 'ms:' + rec.Module_Schedule_Id;
    if (rec.Module_Name) return 'n:' + String(rec.Module_Name).trim().toLowerCase();
    return null;
}

// Shared by the Modules chart AND its KPI cards so the two can never disagree —
// both read the same day-bucketed dashboard_kpi_data over the same range.
// Completions count UNIQUE modules per day (rewatches / extra lesson submits for
// the same module do not add another tick).
function lms_build_module_buckets(range) {
    var buckets = {};
    var cursor = new Date(range.start);
    while (cursor <= range.end) {
        buckets[lms_date_key(cursor)] = { moduleScores: {} };
        cursor.setDate(cursor.getDate() + 1);
    }
    (dashboard_kpi_data || []).forEach(function (rec) {
        var d = lms_parse_submitted_date(rec.SubmittedDate);
        if (!d || d < range.start || d > range.end) return;
        var b = buckets[lms_date_key(d)];
        if (!b) return;
        var modKey = lms_dashboard_module_key(rec);
        if (!modKey || !lms_is_active_dashboard_module(modKey)) return;
        var modScore = (typeof lms_get_module_score_pct_by_id === 'function')
            ? lms_get_module_score_pct_by_id(modKey) : null;
        if (modScore != null) {
            b.moduleScores[modKey] = modScore;
        }
    });
    Object.keys(buckets).forEach(function (key) {
        var b = buckets[key];
        var mods = Object.keys(b.moduleScores);
        b.count = mods.length;
        b.scoreSum = 0;
        b.scoreCount = 0;
        mods.forEach(function (mk) {
            b.scoreSum += b.moduleScores[mk];
            b.scoreCount++;
        });
    });
    return buckets;
}

// Totals for the CURRENT Week/Month/Custom range — same numbers the
// Completed/Avg score/Watch time cards show, so they always match whatever
// the chart is plotting for that same period.
function lms_compute_module_range_totals() {
    var range = lms_trend_range_dates();
    var uniqueModules = {};
    (dashboard_kpi_data || []).forEach(function (rec) {
        var d = lms_parse_submitted_date(rec.SubmittedDate);
        if (!d || d < range.start || d > range.end) return;
        var modKey = lms_dashboard_module_key(rec);
        if (!modKey || !lms_is_active_dashboard_module(modKey)) return;
        var prev = uniqueModules[modKey];
        if (!prev || d >= prev.date) {
            uniqueModules[modKey] = { date: d };
        }
    });

    var modKeys = Object.keys(uniqueModules);

    // Same Score/TotalQuestion average as the Modules tab header — not a
    // range-filtered lesson Achieve_Percentage rollup from dashboard rows.
    var moduleKpi = (typeof lms_compute_completion_kpi === 'function' && typeof safety_module_data !== 'undefined')
        ? lms_compute_completion_kpi(safety_module_data)
        : { avgScorePct: 0 };

    var watchSeconds = (typeof lms_sum_active_modules_watch_seconds_in_range === 'function')
        ? lms_sum_active_modules_watch_seconds_in_range(range)
        : 0;

    return {
        completions: modKeys.length,
        avgScorePct: moduleKpi.avgScorePct,
        watchSeconds: watchSeconds
    };
}

function lms_dashboard_assessment_key(rec) {
    if (!rec) return null;
    return rec.id != null && rec.id !== '' ? String(rec.id) : null;
}

function lms_build_assessment_buckets(range) {
    var buckets = {};
    var cursor = new Date(range.start);
    while (cursor <= range.end) {
        buckets[lms_date_key(cursor)] = { assessmentScores: {} };
        cursor.setDate(cursor.getDate() + 1);
    }
    (typeof lms_get_assessment_completion_log === 'function' ? lms_get_assessment_completion_log() : []).forEach(function (rec) {
        var d = lms_parse_submitted_date(rec.date);
        if (!d || d < range.start || d > range.end) return;
        var b = buckets[lms_date_key(d)];
        if (!b) return;
        var key = lms_dashboard_assessment_key(rec);
        if (!key || (typeof lms_is_active_dashboard_assessment === 'function' && !lms_is_active_dashboard_assessment(key))) return;
        b.assessmentScores[key] = Number(rec.scorePct) || 0;
    });
    Object.keys(buckets).forEach(function (key) {
        var b = buckets[key];
        var ids = Object.keys(b.assessmentScores);
        b.count = ids.length;
        b.scoreSum = 0;
        ids.forEach(function (id) { b.scoreSum += b.assessmentScores[id]; });
    });
    return buckets;
}

function lms_compute_assessment_range_totals() {
    var range = lms_trend_range_dates();
    var uniqueAssessments = {};
    (typeof lms_get_assessment_completion_log === 'function' ? lms_get_assessment_completion_log() : []).forEach(function (rec) {
        var d = lms_parse_submitted_date(rec.date);
        if (!d || d < range.start || d > range.end) return;
        var key = lms_dashboard_assessment_key(rec);
        if (!key || (typeof lms_is_active_dashboard_assessment === 'function' && !lms_is_active_dashboard_assessment(key))) return;
        var prev = uniqueAssessments[key];
        if (!prev || d >= prev.date) {
            uniqueAssessments[key] = { date: d, scorePct: Number(rec.scorePct) || 0 };
        }
    });

    var assKeys = Object.keys(uniqueAssessments);
    var scoreSum = 0, scoreCount = 0;
    assKeys.forEach(function (id) {
        scoreSum += uniqueAssessments[id].scorePct;
        scoreCount++;
    });

    var watchSeconds = 0;
    var cursor = new Date(range.start);
    while (cursor <= range.end) {
        watchSeconds += (typeof lms_get_watch_seconds_daily === 'function')
            ? lms_get_watch_seconds_daily('lms_watch_seconds_assessments_daily', cursor) : 0;
        cursor.setDate(cursor.getDate() + 1);
    }
    var globalTime = (typeof lms_get_watch_seconds === 'function')
        ? lms_get_watch_seconds('lms_watch_seconds_assessments') : 0;
    var activeTime = (typeof lms_sum_active_assessments_watch_seconds === 'function')
        ? lms_sum_active_assessments_watch_seconds() : globalTime;
    if (globalTime > 0 && activeTime < globalTime) {
        watchSeconds = watchSeconds * (activeTime / globalTime);
    }

    return {
        completions: assKeys.length,
        avgScorePct: scoreCount > 0 ? Math.round(scoreSum / scoreCount) : 0,
        timeSpentSeconds: watchSeconds,
        totalQuestions: (typeof lms_sum_active_assessments_total_questions === 'function')
            ? lms_sum_active_assessments_total_questions() : 0,
        answeredQuestions: (typeof lms_sum_active_assessments_answered_questions === 'function')
            ? lms_sum_active_assessments_answered_questions() : 0
    };
}

// Modules trend — mirrors its KPI cards: Completions (day count, same field as
// the old "Submissions"), Score (avg Achieve_Percentage/day), Watch time (real,
// locally day-bucketed — see lms_add_watch_seconds_daily). Total video time is
// a library-wide constant, not a daily trend, so it has no line/card selection.
// Shows exactly ONE line at a time, matching whichever metric card below the
// chart is selected (see select_lms_dashboard_metric).
var lms_module_chart_metric = 'completions'; // 'completions' | 'score' | 'watchtime'
var lms_assessment_chart_metric = 'completions';

function render_lms_trend_chart() {
    var chartEl = document.getElementById('lms-trend-chart');
    if (!chartEl) return;

    var range = lms_trend_range_dates();
    var buckets = lms_build_module_buckets(range);

    var categories = [];
    var cursor = new Date(range.start);
    while (cursor <= range.end) {
        categories.push(lms_trend_label_fmt(cursor));
        cursor.setDate(cursor.getDate() + 1);
    }

    var seriesName, data = [], tooltipSuffix = '';
    cursor = new Date(range.start);
    while (cursor <= range.end) {
        var b = buckets[lms_date_key(cursor)];
        if (lms_module_chart_metric === 'score') {
            data.push(b.scoreCount ? Math.round(b.scoreSum / b.scoreCount) : 0);
        } else if (lms_module_chart_metric === 'watchtime') {
            var daySeconds = (typeof lms_get_module_daily_watch_seconds === 'function')
                ? lms_get_module_daily_watch_seconds(cursor) : 0;
            data.push(Math.round(daySeconds / 60 * 10) / 10); // minutes, 1dp
        } else {
            data.push(b.count);
        }
        cursor.setDate(cursor.getDate() + 1);
    }

    var yMax;
    if (lms_module_chart_metric === 'score') { seriesName = 'Score'; tooltipSuffix = '%'; yMax = 100; }
    else if (lms_module_chart_metric === 'watchtime') { seriesName = 'Watch time (min)'; tooltipSuffix = ' min'; }
    else { seriesName = 'Completions'; }

    var rangeLabelEl = document.getElementById('lms_trend_range_label');
    if (rangeLabelEl) { rangeLabelEl.textContent = lms_trend_label_fmt(range.start) + ' – ' + lms_trend_label_fmt(range.end); }

    if (typeof ApexCharts === 'undefined') return;

    var options = {
        chart: { type: 'area', height: 260, toolbar: { show: false }, zoom: { enabled: false }, fontFamily: 'inherit', animations: { speed: 300 } },
        series: [{ name: seriesName, data: data }],
        xaxis: { categories: categories, labels: { rotate: 0, style: { fontSize: '11px' } }, tooltip: { enabled: false }, axisBorder: { show: false }, axisTicks: { show: false } },
        yaxis: { min: 0, max: yMax, forceNiceScale: !yMax, labels: { style: { fontSize: '11px' } } },
        colors: ['#215ba8'],
        stroke: { curve: 'smooth', width: 2.5 },
        fill: { type: 'gradient', gradient: { opacityFrom: 0.35, opacityTo: 0.02, shadeIntensity: 1 } },
        dataLabels: { enabled: false },
        legend: { show: false },
        grid: { borderColor: '#e3e6ea', strokeDashArray: 3, padding: { left: 4, right: 4 } },
        tooltip: { y: { formatter: function (v) { return v + tooltipSuffix; } } }
    };

    lms_render_apex_chart('lms-trend-chart', options, 'modules');
}

function render_lms_assessment_trend_chart() {
    var chartEl = document.getElementById('lms-trend-chart');
    if (!chartEl) return;

    var range = lms_trend_range_dates();
    var buckets = lms_build_assessment_buckets(range);

    var categories = [];
    var cursor = new Date(range.start);
    while (cursor <= range.end) {
        categories.push(lms_trend_label_fmt(cursor));
        cursor.setDate(cursor.getDate() + 1);
    }

    var seriesName, data = [], tooltipSuffix = '';
    cursor = new Date(range.start);
    while (cursor <= range.end) {
        var b = buckets[lms_date_key(cursor)];
        if (lms_assessment_chart_metric === 'score') {
            data.push(b.count ? Math.round(b.scoreSum / b.count) : 0);
        } else if (lms_assessment_chart_metric === 'timespent') {
            var daySeconds = (typeof lms_get_watch_seconds_daily === 'function')
                ? lms_get_watch_seconds_daily('lms_watch_seconds_assessments_daily', cursor) : 0;
            data.push(Math.round(daySeconds / 60 * 10) / 10);
        } else {
            data.push(b.count);
        }
        cursor.setDate(cursor.getDate() + 1);
    }

    var yMax;
    if (lms_assessment_chart_metric === 'score') { seriesName = 'Score'; tooltipSuffix = '%'; yMax = 100; }
    else if (lms_assessment_chart_metric === 'timespent') { seriesName = 'Time spent (min)'; tooltipSuffix = ' min'; }
    else { seriesName = 'Completions'; }

    var rangeLabelEl = document.getElementById('lms_trend_range_label');
    if (rangeLabelEl) { rangeLabelEl.textContent = lms_trend_label_fmt(range.start) + ' – ' + lms_trend_label_fmt(range.end); }

    if (typeof ApexCharts === 'undefined') return;

    var options = {
        chart: { type: 'area', height: 260, toolbar: { show: false }, zoom: { enabled: false }, fontFamily: 'inherit', animations: { speed: 300 } },
        series: [{ name: seriesName, data: data }],
        xaxis: { categories: categories, labels: { rotate: 0, style: { fontSize: '11px' } }, tooltip: { enabled: false }, axisBorder: { show: false }, axisTicks: { show: false } },
        yaxis: { min: 0, max: yMax, forceNiceScale: !yMax, labels: { style: { fontSize: '11px' } } },
        colors: ['#215ba8'],
        stroke: { curve: 'smooth', width: 2.5 },
        fill: { type: 'gradient', gradient: { opacityFrom: 0.35, opacityTo: 0.02, shadeIntensity: 1 } },
        dataLabels: { enabled: false },
        legend: { show: false },
        grid: { borderColor: '#e3e6ea', strokeDashArray: 3, padding: { left: 4, right: 4 } },
        tooltip: { y: { formatter: function (v) { return v + tooltipSuffix; } } }
    };

    lms_render_apex_chart('lms-trend-chart', options, 'assessments-trend');
}

function render_lms_assessment_question_coverage_chart() {
    var answered = (typeof lms_sum_active_assessments_answered_questions === 'function')
        ? lms_sum_active_assessments_answered_questions() : 0;
    var total = (typeof lms_sum_active_assessments_total_questions === 'function')
        ? lms_sum_active_assessments_total_questions() : 0;

    lms_render_coverage_bar('lms-ml-coverage-chart', answered, total, function (v) { return String(Math.round(v)); }, ['Answered', 'Total']);
}

// Shared 2-bar comparison ("Watched" vs "Total") — used instead of a
// pie/radial gauge everywhere in the LMS charts, per house style: graphs only.
function lms_render_coverage_bar(elId, watchedVal, totalVal, valueFormatter, categoryLabels) {
    var el = document.getElementById(elId);
    if (!el || typeof ApexCharts === 'undefined') return;
    var categories = categoryLabels || ['Watched', 'Total'];

    var options = {
        // Same height as every other chart in this dashboard (260) so switching
        // categories/metrics never resizes the container underneath it.
        chart: { type: 'bar', height: 260, toolbar: { show: false }, fontFamily: 'inherit', animations: { speed: 300 } },
        series: [{ name: '', data: [watchedVal, totalVal] }],
        plotOptions: { bar: { borderRadius: 4, columnWidth: '45%', distributed: true } },
        xaxis: { categories: categories, labels: { style: { fontSize: '11px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
        // Auto-generated tick values (not the raw data) come with float noise
        // (e.g. 18.900000000000002) — round before formatting, independent of
        // the data-label/tooltip formatter which gets the already-clean values.
        yaxis: { min: 0, labels: { style: { fontSize: '11px' }, formatter: function (v) { return valueFormatter(Math.round(v * 10) / 10); } } },
        colors: ['#215ba8', '#b26a00'],
        dataLabels: { enabled: true, formatter: valueFormatter, style: { fontSize: '12px', colors: ['#fff'] } },
        legend: { show: false },
        grid: { borderColor: '#e3e6ea', strokeDashArray: 3 },
        tooltip: { y: { formatter: valueFormatter } }
    };

    if (lms_ml_coverage_chart_instance) { lms_ml_coverage_chart_instance.destroy(); lms_ml_coverage_chart_instance = null; }
    el.innerHTML = '';
    lms_ml_coverage_chart_instance = new ApexCharts(el, options);
    lms_ml_coverage_chart_instance.render();
}

// Modules coverage — real all-time watch time vs the real all-time
// library-wide total video length (same numbers as the Watch time / Total
// video time cards). Shares the chart element + instance with Micro
// Learning's coverage view since only one category is shown at a time.
function render_lms_module_video_coverage_chart() {
    var watchSeconds = (typeof lms_sum_active_modules_watch_seconds === 'function')
        ? lms_sum_active_modules_watch_seconds()
        : ((typeof lms_get_watch_seconds === 'function') ? lms_get_watch_seconds('lms_watch_seconds_modules') : 0);
    var totalSeconds = (typeof lms_sum_active_modules_total_video_seconds === 'function')
        ? lms_sum_active_modules_total_video_seconds() : 0;
    if (totalSeconds <= 0) {
        try {
            var totalCache = JSON.parse(localStorage.getItem('lms_video_durations_modules')) || {};
            Object.keys(totalCache).forEach(function (id) { totalSeconds += totalCache[id]; });
        } catch (e) { }
    }

    var watchMin = Math.round(watchSeconds / 60 * 10) / 10;
    var totalMin = Math.round(totalSeconds / 60 * 10) / 10;
    lms_render_coverage_bar('lms-ml-coverage-chart', watchMin, totalMin, function (v) { return v + 'm'; });
}

// Week/Month/Custom is shared across Modules and Micro Learning (both have
// real daily data); Assessments has no date dimension so never shows this filter.
function lms_render_selected_category_chart() {
    // Modules' KPI cards are range-scoped (see lms_compute_module_range_totals) —
    // refresh them on every chart re-render (filter change, data refresh) so
    // they never drift from what the chart is currently plotting.
    render_lms_dashboard_context_kpi();

    if (lms_dashboard_selected_category === 'Modules') {
        lms_render_module_chart_view();
    } else if (lms_dashboard_selected_category === 'Micro Learning') {
        lms_render_ml_chart_view();
    } else if (lms_dashboard_selected_category === 'Assessments') {
        lms_render_assessment_chart_view();
    }
}

function lms_render_assessment_chart_view() {
    var chartEl = document.getElementById('lms-trend-chart');
    var coverageEl = document.getElementById('lms-ml-coverage-chart');
    if (chartEl) chartEl.style.display = '';
    if (coverageEl) coverageEl.style.display = 'none';
    render_lms_assessment_trend_chart();
}

// Modules shows one visualization at a time: the Completions/Score/Watch time
// trend line, or (tapping Total video time) a watched-vs-total coverage gauge.
function lms_render_module_chart_view() {
    var chartEl = document.getElementById('lms-trend-chart');
    var coverageEl = document.getElementById('lms-ml-coverage-chart');
    var isCoverage = lms_module_chart_metric === 'videocoverage';
    if (chartEl) chartEl.style.display = isCoverage ? 'none' : '';
    if (coverageEl) coverageEl.style.display = isCoverage ? '' : 'none';
    if (isCoverage) render_lms_module_video_coverage_chart();
    else render_lms_trend_chart();
}

// Micro Learning shows one visualization at a time too: the watch-time trend
// line, or the watched/total coverage gauge — picked by the metric card tap.
var lms_ml_chart_view = 'trend'; // 'trend' | 'coverage'

function lms_render_ml_chart_view() {
    var chartEl = document.getElementById('lms-trend-chart');
    var coverageEl = document.getElementById('lms-ml-coverage-chart');
    // 'trend'/'score' render into the main line-chart element; 'coverage'/
    // 'timecoverage' render into the bar-comparison element.
    var usesMainChart = lms_ml_chart_view === 'trend' || lms_ml_chart_view === 'score';
    if (chartEl) chartEl.style.display = usesMainChart ? '' : 'none';
    if (coverageEl) coverageEl.style.display = usesMainChart ? 'none' : '';

    if (lms_ml_chart_view === 'trend') render_lms_ml_watch_trend_chart();
    else if (lms_ml_chart_view === 'score') render_lms_ml_score_trend_chart();
    else if (lms_ml_chart_view === 'timecoverage') render_lms_ml_video_time_coverage_chart();
    else render_lms_ml_coverage_chart();
}

// Micro Learning's own "Total video time" — real all-time watch time vs the
// real all-time reel-library total length. Same shared bar + numbers as the
// Watch time / Total video time cards.
function render_lms_ml_video_time_coverage_chart() {
    var watchSeconds = (typeof lms_get_watch_seconds === 'function') ? lms_get_watch_seconds('lms_watch_seconds_ml') : 0;
    var totalCache = {};
    try { totalCache = JSON.parse(localStorage.getItem('lms_video_durations_ml')) || {}; } catch (e) { totalCache = {}; }
    var totalSeconds = 0;
    Object.keys(totalCache).forEach(function (id) { totalSeconds += totalCache[id]; });

    var watchMin = Math.round(watchSeconds / 60 * 10) / 10;
    var totalMin = Math.round(totalSeconds / 60 * 10) / 10;
    lms_render_coverage_bar('lms-ml-coverage-chart', watchMin, totalMin, function (v) { return v + 'm'; });
}

// Taps on the metric cards below the chart (slot 1-4, matching
// kpi_dashboard_metricN) — picks which single line/visualization the chart shows.
function select_lms_dashboard_metric(slot, el) {
    if (lms_dashboard_selected_category === 'Modules') {
        if (slot === 1) lms_module_chart_metric = 'completions';
        else if (slot === 2) lms_module_chart_metric = 'score';
        else if (slot === 3) lms_module_chart_metric = 'watchtime';
        else if (slot === 4) lms_module_chart_metric = 'videocoverage';
        else return false;
        lms_render_module_chart_view();
    } else if (lms_dashboard_selected_category === 'Micro Learning') {
        if (slot === 1) lms_ml_chart_view = 'coverage';
        else if (slot === 2) lms_ml_chart_view = 'score';
        else if (slot === 3) lms_ml_chart_view = 'trend';
        else if (slot === 4) lms_ml_chart_view = 'timecoverage';
        else return false;
        lms_render_ml_chart_view();
    } else if (lms_dashboard_selected_category === 'Assessments') {
        if (slot === 1) lms_assessment_chart_metric = 'completions';
        else if (slot === 2) lms_assessment_chart_metric = 'score';
        else return false;
        lms_render_assessment_chart_view();
    } else {
        return false;
    }
    $('#lms_dashboard_context_kpi .lms-kpi-card.is-metric-selectable').removeClass('is-active');
    if (el) $(el).addClass('is-active');
    return false;
}

function set_lms_trend_range(type, el) {
    lms_trend_range_type = type;
    $('.lms-trend-chip').removeClass('is-active');
    if (el) { $(el).addClass('is-active'); }

    if (type === 'custom') {
        open_lms_trend_custom_picker();
        return false;
    }
    lms_render_selected_category_chart();
    return false;
}

function open_lms_trend_custom_picker() {
    if (typeof myApp === 'undefined' || !myApp.calendar) { lms_render_selected_category_chart(); return; }
    if (lms_trend_calendar_instance) { lms_trend_calendar_instance.destroy(); lms_trend_calendar_instance = null; }

    lms_trend_calendar_instance = myApp.calendar.create({
        rangePicker: true,
        rangePickerMaxDays: 92,
        closeOnSelect: true,
        dateFormat: 'd MMM yyyy',
        value: (lms_trend_custom_start && lms_trend_custom_end) ? [lms_trend_custom_start, lms_trend_custom_end] : undefined,
        on: {
            change: function (calendar, value) {
                if (value && value.length === 2) {
                    lms_trend_custom_start = value[0];
                    lms_trend_custom_end = value[1];
                    lms_render_selected_category_chart();
                }
            },
            closed: function () {
                // Closed without completing a range pick — fall back so the
                // filter never gets stuck on an incomplete "Custom" state.
                if (!lms_trend_custom_start || !lms_trend_custom_end) {
                    set_lms_trend_range('week', document.querySelector('.lms-trend-chip[data-range="week"]'));
                }
            }
        }
    });
    lms_trend_calendar_instance.open();
}

// Assessments — no date field to chart a trend, so this shows a real per-item
// bar chart instead: score % for each assessment (Score/TotalQuestion), same
// numbers already used for the "Avg score" KPI card.
function render_lms_assessment_score_chart() {
    if (typeof ApexCharts === 'undefined') return;
    var items = (typeof assessment_data !== 'undefined' && assessment_data) ? assessment_data : [];

    var categories = [], scores = [];
    items.forEach(function (a) {
        var name = String(a.Name || 'Assessment');
        categories.push(name.length > 14 ? name.slice(0, 13) + '…' : name);
        var totalQ = Number(a.TotalQuestion) || 0;
        var score = Number(a.Score) || 0;
        scores.push(totalQ > 0 ? Math.round((score / totalQ) * 100) : 0);
    });

    var rangeLabelEl = document.getElementById('lms_trend_range_label');
    if (rangeLabelEl) { rangeLabelEl.textContent = items.length + ' assessment' + (items.length === 1 ? '' : 's'); }

    var options = {
        chart: { type: 'bar', height: 260, toolbar: { show: false }, fontFamily: 'inherit', animations: { speed: 300 } },
        series: [{ name: 'Score %', data: scores }],
        plotOptions: { bar: { borderRadius: 4, columnWidth: '55%' } },
        xaxis: { categories: categories, labels: { style: { fontSize: '10px' }, rotate: -35, trim: true }, axisBorder: { show: false }, axisTicks: { show: false } },
        yaxis: { min: 0, max: 100, labels: { style: { fontSize: '11px' } } },
        colors: ['#215ba8'],
        dataLabels: { enabled: false },
        legend: { show: false },
        grid: { borderColor: '#e3e6ea', strokeDashArray: 3, padding: { left: 4, right: 4 } },
        tooltip: { y: { formatter: function (v) { return v + '%'; } } }
    };

    lms_render_apex_chart('lms-trend-chart', options, 'assessments');
}

// Micro Learning — real day-bucketed watch time (local tracking, see
// lms_add_watch_seconds_daily) respects the same Week/Month/Custom filter as Modules.
function render_lms_ml_watch_trend_chart() {
    if (typeof ApexCharts === 'undefined') return;
    var range = lms_trend_range_dates();

    var categories = [], minutes = [];
    var cursor = new Date(range.start);
    while (cursor <= range.end) {
        categories.push(lms_trend_label_fmt(cursor));
        var seconds = (typeof lms_get_watch_seconds_daily === 'function')
            ? lms_get_watch_seconds_daily('lms_watch_seconds_ml_daily', cursor) : 0;
        minutes.push(Math.round(seconds / 60 * 10) / 10);
        cursor.setDate(cursor.getDate() + 1);
    }

    var rangeLabelEl = document.getElementById('lms_trend_range_label');
    if (rangeLabelEl) { rangeLabelEl.textContent = lms_trend_label_fmt(range.start) + ' – ' + lms_trend_label_fmt(range.end); }

    var options = {
        chart: { type: 'area', height: 260, toolbar: { show: false }, zoom: { enabled: false }, fontFamily: 'inherit', animations: { speed: 300 } },
        series: [{ name: 'Watch time (min)', data: minutes }],
        xaxis: { categories: categories, labels: { rotate: 0, style: { fontSize: '11px' } }, tooltip: { enabled: false }, axisBorder: { show: false }, axisTicks: { show: false } },
        yaxis: { min: 0, forceNiceScale: true, labels: { style: { fontSize: '11px' } } },
        colors: ['#215ba8'],
        stroke: { curve: 'smooth', width: 2.5 },
        fill: { type: 'gradient', gradient: { opacityFrom: 0.35, opacityTo: 0.02, shadeIntensity: 1 } },
        dataLabels: { enabled: false },
        legend: { show: false },
        grid: { borderColor: '#e3e6ea', strokeDashArray: 3, padding: { left: 4, right: 4 } },
        tooltip: { y: { formatter: function (v) { return v + ' min'; } } }
    };

    lms_render_apex_chart('lms-trend-chart', options, 'ml-trend');
}

// Micro Learning quiz score — real day-bucketed correct/total (local tracking,
// see lms_add_ml_quiz_result in LMS_Misc.js; no backend field persists this
// anywhere). Respects the same Week/Month/Custom filter as the other trends.
function render_lms_ml_score_trend_chart() {
    if (typeof ApexCharts === 'undefined') return;
    var range = lms_trend_range_dates();

    var categories = [], scores = [];
    var cursor = new Date(range.start);
    while (cursor <= range.end) {
        categories.push(lms_trend_label_fmt(cursor));
        var day = (typeof lms_get_ml_quiz_daily === 'function') ? lms_get_ml_quiz_daily(cursor) : { correct: 0, total: 0 };
        scores.push(day.total > 0 ? Math.round((day.correct / day.total) * 100) : 0);
        cursor.setDate(cursor.getDate() + 1);
    }

    var rangeLabelEl = document.getElementById('lms_trend_range_label');
    if (rangeLabelEl) { rangeLabelEl.textContent = lms_trend_label_fmt(range.start) + ' – ' + lms_trend_label_fmt(range.end); }

    var options = {
        chart: { type: 'area', height: 260, toolbar: { show: false }, zoom: { enabled: false }, fontFamily: 'inherit', animations: { speed: 300 } },
        series: [{ name: 'Score %', data: scores }],
        xaxis: { categories: categories, labels: { rotate: 0, style: { fontSize: '11px' } }, tooltip: { enabled: false }, axisBorder: { show: false }, axisTicks: { show: false } },
        yaxis: { min: 0, max: 100, labels: { style: { fontSize: '11px' } } },
        colors: ['#215ba8'],
        stroke: { curve: 'smooth', width: 2.5 },
        fill: { type: 'gradient', gradient: { opacityFrom: 0.35, opacityTo: 0.02, shadeIntensity: 1 } },
        dataLabels: { enabled: false },
        legend: { show: false },
        grid: { borderColor: '#e3e6ea', strokeDashArray: 3, padding: { left: 4, right: 4 } },
        tooltip: { y: { formatter: function (v) { return v + '%'; } } }
    };

    lms_render_apex_chart('lms-trend-chart', options, 'ml-score');
}

// Micro Learning coverage gauge — real watched-count vs total reels in the
// library (same fields as the "Watched" KPI card / tab-4 overlay badge).
function render_lms_ml_coverage_chart() {
    var arr = (typeof user_activitiy_Array !== 'undefined' && user_activitiy_Array) ? user_activitiy_Array : [];
    var watched = lms_count_distinct_ml(arr, 'Watch_Count');
    var total = (typeof total_reels !== 'undefined' && total_reels) ? total_reels : 0;

    lms_render_coverage_bar('lms-ml-coverage-chart', watched, total, function (v) { return String(v); });
}

function apply_dashboard(responseText) {
    var myArray;
    try { myArray = JSON.parse(responseText); } catch (e) { return; }
    var status = myArray[0].status;
    if (status != 1) return;

    var data = JSON.parse(myArray[0]["data"]);
    dashboard_kpi_data = data;

    update_lms_kpi();
    lms_render_selected_category_chart();
}

function get_dashboard_data(force_refresh) {
    var lms_dash_url = global_wcf_url_lms + 'LMS_Select_Dashboard';
    var lms_dash_cache_key = (typeof lms_listing_cache_key === 'function')
        ? lms_listing_cache_key('dashboard')
        : 'dashboard';
    var Param_obj = [];

    // Cache-first (see get_safety_module_listing); original path preserved as fallback.
    if (typeof LmsData !== 'undefined') {
        var had_cache = !force_refresh && LmsData.getCache(lms_dash_cache_key) != null;
        if (!had_cache) {
            LmsData.showSkeletons("#lms-trend-chart", 3);
        }
        LmsData.fetch(lms_dash_cache_key, lms_dash_url, JSON.stringify(Param_obj),
            function (txt, source) { apply_dashboard(txt); },
            function (err) {
                if (!had_cache) {
                    LmsData.showError("#lms-trend-chart", "get_dashboard_data(true)");
                }
            },
            { timeout: 15000, retries: 1, force: !!force_refresh }
        );
        return;
    }

    loading();
    var getdata = new Webservicecall_REST(lms_dash_url, JSON.stringify(Param_obj), function (e) {
        apply_dashboard(e.responseText);
        loading_hide();
    }, onfail);
    getdata.callOtherDomain();
}

function update_lms_kpi() {
    try {
        var modCount = (typeof safety_module_data !== 'undefined' && safety_module_data) ? safety_module_data.length : 0;
        var assCount = (typeof assessment_data !== 'undefined' && assessment_data) ? assessment_data.length : 0;
        var reelCount = (typeof total_reels !== 'undefined') ? total_reels : 0;

        lms_count_up(document.getElementById('kpi_mod_count'), modCount);
        lms_count_up(document.getElementById('kpi_ass_count'), assCount);
        lms_count_up(document.getElementById('kpi_reel_count'), reelCount);

        render_lms_dashboard_context_kpi();
    } catch(e) {
        console.error("Error updating LMS KPIs: ", e);
    }
}

// Context card above the Modules/Assessments/Micro Learning selector row.
// Modules/Assessments have a real Completed %/Avg score % (see
// lms_compute_completion_kpi in safety_modules.js). Micro Learning has no
// completion concept, but does have a real, locally-tracked quiz score (see
// lms_get_ml_quiz_score_pct) — Watched/Score are used there instead.
function select_lms_dashboard_category(category, el) {
    lms_dashboard_selected_category = category;
    $('#tab-3 .lms-category-card').removeClass('is-active').attr('aria-pressed', 'false');
    if (el) { $(el).addClass('is-active').attr('aria-pressed', 'true'); }

    // Reset to each category's default single-line view on every switch —
    // Modules/Micro Learning have a real chart; Assessments has the score bar
    // chart (no per-metric switching there, so no default to reset).
    lms_module_chart_metric = 'completions';
    lms_assessment_chart_metric = 'completions';
    lms_ml_chart_view = 'trend';

    // Week/Month/Custom applies to Modules, Assessments, and Micro Learning.
    var showsFilter = category === 'Modules' || category === 'Micro Learning' || category === 'Assessments';
    var filterPills = document.getElementById('lms_trend_filter');
    if (filterPills) filterPills.style.visibility = showsFilter ? '' : 'hidden';

    // Reset both chart slots to their default visible/hidden state on every
    // category switch. Modules/Micro Learning's view-functions will re-toggle
    // #lms-trend-chart if their default view is the coverage gauge, but
    // Assessments has no such wrapper — it always needs #lms-trend-chart
    // visible, and would otherwise inherit "hidden" if the previous category
    // left it that way (this was rendering the assessment bar chart into a
    // display:none container — invisible, not actually missing).
    var chartEl = document.getElementById('lms-trend-chart');
    if (chartEl) chartEl.style.display = '';
    var coverageEl = document.getElementById('lms-ml-coverage-chart');
    if (coverageEl) coverageEl.style.display = 'none';

    lms_render_selected_category_chart(); // also refreshes the context card
    return false;
}

function render_lms_dashboard_context_kpi() {
    var v1 = document.getElementById('kpi_dashboard_metric1');
    var l1 = document.getElementById('kpi_dashboard_metric1_label');
    var v2 = document.getElementById('kpi_dashboard_metric2');
    var l2 = document.getElementById('kpi_dashboard_metric2_label');
    var v3 = document.getElementById('kpi_dashboard_metric3');
    var l3 = document.getElementById('kpi_dashboard_metric3_label');
    var card3 = document.getElementById('kpi_dashboard_metric3_card');
    var div3 = document.getElementById('kpi_dashboard_metric3_divider');
    var v4 = document.getElementById('kpi_dashboard_metric4');
    var l4 = document.getElementById('kpi_dashboard_metric4_label');
    var card4 = document.getElementById('kpi_dashboard_metric4_card');
    var div4 = document.getElementById('kpi_dashboard_metric4_divider');
    if (!v1 || !v2 || typeof lms_compute_completion_kpi !== 'function') return;

    function totalFromCache(cacheKey) {
        var cached = {};
        try { cached = JSON.parse(localStorage.getItem(cacheKey)) || {}; } catch (e) { cached = {}; }
        var total = 0;
        Object.keys(cached).forEach(function (id) { total += cached[id]; });
        return total;
    }

    if (lms_dashboard_selected_category === 'Modules') {
        // Same range + same dashboard_kpi_data the chart plots from — these
        // numbers must always match what the Completions/Score/Watch time
        // line sums to for the current Week/Month/Custom selection.
        var mt = (typeof lms_compute_module_range_totals === 'function') ? lms_compute_module_range_totals() : { completions: 0, avgScorePct: 0, watchSeconds: 0 };
        l1.textContent = 'Completions'; v1.textContent = String(mt.completions);
        l2.textContent = 'Avg score'; v2.textContent = mt.avgScorePct + '%';
        if (card3) card3.style.display = '';
        if (div3) div3.style.display = '';
        if (card4) card4.style.display = '';
        if (div4) div4.style.display = '';
        if (v3 && l3) {
            l3.textContent = 'Watch time';
            v3.textContent = lms_format_watch_time(mt.watchSeconds);
        }
        if (l4) l4.textContent = 'Total video time';
        if (v4) {
            var totalSec = (typeof lms_sum_active_modules_total_video_seconds === 'function')
                ? lms_sum_active_modules_total_video_seconds() : totalFromCache('lms_video_durations_modules');
            v4.textContent = lms_format_watch_time(totalSec);
        }
    } else if (lms_dashboard_selected_category === 'Assessments') {
        var items = (typeof assessment_data !== 'undefined' ? assessment_data : []);
        var ak = lms_compute_completion_kpi(items);
        l1.textContent = 'Completed'; v1.textContent = ak.completedPct + '%';
        l2.textContent = 'Avg score'; v2.textContent = ak.avgScorePct + '%';
        if (card3) card3.style.display = 'none';
        if (div3) div3.style.display = 'none';
        if (card4) card4.style.display = 'none';
        if (div4) div4.style.display = 'none';
    } else { // Micro Learning
        var arr = (typeof user_activitiy_Array !== 'undefined' && user_activitiy_Array) ? user_activitiy_Array : [];
        var watched = lms_count_distinct_ml(arr, 'Watch_Count');
        var mlScorePct = (typeof lms_get_ml_quiz_score_pct === 'function') ? lms_get_ml_quiz_score_pct() : 0;
        l1.textContent = 'Watched'; v1.textContent = String(watched);
        l2.textContent = 'Score'; v2.textContent = mlScorePct + '%';

        if (card3) card3.style.display = '';
        if (div3) div3.style.display = '';
        if (card4) card4.style.display = '';
        if (div4) div4.style.display = '';
        if (v3 && l3 && typeof lms_get_watch_seconds === 'function') {
            l3.textContent = 'Watch time';
            v3.textContent = lms_format_watch_time(lms_get_watch_seconds('lms_watch_seconds_ml'));
        }
        if (l4) l4.textContent = 'Total video time';
        if (v4) {
            v4.textContent = lms_format_watch_time(totalFromCache('lms_video_durations_ml'));
        }
    }

    // Highlight whichever metric card matches the chart's current selection.
    var activeSlot = 1;
    if (lms_dashboard_selected_category === 'Modules') {
        activeSlot = lms_module_chart_metric === 'score' ? 2
            : lms_module_chart_metric === 'watchtime' ? 3
            : lms_module_chart_metric === 'videocoverage' ? 4
            : 1;
    } else if (lms_dashboard_selected_category === 'Assessments') {
        activeSlot = lms_assessment_chart_metric === 'score' ? 2 : 1;
    } else if (lms_dashboard_selected_category === 'Micro Learning') {
        activeSlot = lms_ml_chart_view === 'coverage' ? 1
            : lms_ml_chart_view === 'score' ? 2
            : lms_ml_chart_view === 'timecoverage' ? 4
            : 3;
    }
    $('#lms_dashboard_context_kpi .lms-kpi-card.is-metric-selectable').removeClass('is-active');
    if (activeSlot > 0) {
        var activeValEl = document.getElementById('kpi_dashboard_metric' + activeSlot);
        if (activeValEl) $(activeValEl).closest('.lms-kpi-card').addClass('is-active');
    }
}
