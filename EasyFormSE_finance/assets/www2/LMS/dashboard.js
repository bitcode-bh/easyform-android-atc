

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
        if (typeof get_safety_module_data === 'function') get_safety_module_data();
        if (typeof get_assessment_data === 'function') get_assessment_data();
        if (typeof get_micro_learning_data === 'function') get_micro_learning_data();
        get_dashboard_data();
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

// Modules trend — mirrors its KPI cards: Completions (day count, same field as
// the old "Submissions"), Score (avg Achieve_Percentage/day), Watch time (real,
// locally day-bucketed — see lms_add_watch_seconds_daily). Total video time is
// a library-wide constant, not a daily trend, so it has no line/card selection.
// Shows exactly ONE line at a time, matching whichever metric card below the
// chart is selected (see select_lms_dashboard_metric).
var lms_module_chart_metric = 'completions'; // 'completions' | 'score' | 'watchtime'

function render_lms_trend_chart() {
    var chartEl = document.getElementById('lms-trend-chart');
    if (!chartEl) return;

    var range = lms_trend_range_dates();

    var buckets = {};
    var categories = [];
    var cursor = new Date(range.start);
    while (cursor <= range.end) {
        buckets[lms_date_key(cursor)] = { count: 0, scoreSum: 0 };
        categories.push(lms_trend_label_fmt(cursor));
        cursor.setDate(cursor.getDate() + 1);
    }

    (dashboard_kpi_data || []).forEach(function (rec) {
        var d = lms_parse_submitted_date(rec.SubmittedDate);
        if (!d || d < range.start || d > range.end) return;
        var b = buckets[lms_date_key(d)];
        if (!b) return;
        b.count += 1;
        b.scoreSum += Number(rec.Achieve_Percentage) || 0;
    });

    var seriesName, data = [], tooltipSuffix = '';
    cursor = new Date(range.start);
    while (cursor <= range.end) {
        var b = buckets[lms_date_key(cursor)];
        if (lms_module_chart_metric === 'score') {
            data.push(b.count ? Math.round(b.scoreSum / b.count) : 0);
        } else if (lms_module_chart_metric === 'watchtime') {
            var daySeconds = (typeof lms_get_watch_seconds_daily === 'function')
                ? lms_get_watch_seconds_daily('lms_watch_seconds_modules_daily', cursor) : 0;
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
        chart: { type: 'area', height: 260, toolbar: { show: false }, zoom: { enabled: false }, fontFamily: 'inherit', animations: { speed: 350 } },
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

// Week/Month/Custom is shared across Modules and Micro Learning (both have
// real daily data); Assessments has no date dimension so never shows this filter.
function lms_render_selected_category_chart() {
    if (lms_dashboard_selected_category === 'Modules') {
        render_lms_trend_chart();
    } else if (lms_dashboard_selected_category === 'Micro Learning') {
        lms_render_ml_chart_view();
    } else if (lms_dashboard_selected_category === 'Assessments') {
        render_lms_assessment_score_chart();
    }
}

// Micro Learning shows one visualization at a time too: the watch-time trend
// line, or the watched/total coverage gauge — picked by the metric card tap.
var lms_ml_chart_view = 'trend'; // 'trend' | 'coverage'

function lms_render_ml_chart_view() {
    var chartEl = document.getElementById('lms-trend-chart');
    var coverageEl = document.getElementById('lms-ml-coverage-chart');
    var isTrend = lms_ml_chart_view === 'trend';
    if (chartEl) chartEl.style.display = isTrend ? '' : 'none';
    if (coverageEl) coverageEl.style.display = isTrend ? 'none' : '';
    if (isTrend) render_lms_ml_watch_trend_chart();
    else render_lms_ml_coverage_chart();
}

// Taps on the metric cards below the chart (slot 1-4, matching
// kpi_dashboard_metricN) — picks which single line/visualization the chart
// shows. Only metrics with a real per-day (or comparable) chart are wired;
// Total video time (a static library-wide total) and Micro Learning's Liked
// count have no associated chart view, so those slots are left non-interactive.
function select_lms_dashboard_metric(slot, el) {
    if (lms_dashboard_selected_category === 'Modules') {
        if (slot === 1) lms_module_chart_metric = 'completions';
        else if (slot === 2) lms_module_chart_metric = 'score';
        else if (slot === 3) lms_module_chart_metric = 'watchtime';
        else return false;
        render_lms_trend_chart();
    } else if (lms_dashboard_selected_category === 'Micro Learning') {
        if (slot === 1) lms_ml_chart_view = 'coverage';
        else if (slot === 3) lms_ml_chart_view = 'trend';
        else return false;
        lms_render_ml_chart_view();
    } else {
        return false; // Assessments has one fixed view (the score bar chart)
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
        chart: { type: 'bar', height: 260, toolbar: { show: false }, fontFamily: 'inherit' },
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
        chart: { type: 'area', height: 220, toolbar: { show: false }, zoom: { enabled: false }, fontFamily: 'inherit', animations: { speed: 350 } },
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

// Micro Learning coverage gauge — real watched-count vs total reels in the
// library (same fields as the "Watched" KPI card / tab-4 overlay badge).
function render_lms_ml_coverage_chart() {
    var el = document.getElementById('lms-ml-coverage-chart');
    if (!el || typeof ApexCharts === 'undefined') return;

    var arr = (typeof user_activitiy_Array !== 'undefined' && user_activitiy_Array) ? user_activitiy_Array : [];
    var watched = arr.filter(function (a) { return Number(a.Watch_Count) > 0; }).length;
    var total = (typeof total_reels !== 'undefined' && total_reels) ? total_reels : 0;
    var pct = total > 0 ? Math.round((watched / total) * 100) : 0;

    var options = {
        chart: { type: 'radialBar', height: 200, toolbar: { show: false }, fontFamily: 'inherit' },
        series: [pct],
        labels: [watched + ' of ' + total + ' watched'],
        colors: ['#215ba8'],
        plotOptions: {
            radialBar: {
                hollow: { size: '62%' },
                track: { background: '#e3e6ea' },
                dataLabels: {
                    name: { fontSize: '12px', color: '#5b6470', offsetY: 22 },
                    value: { fontSize: '26px', fontWeight: 800, color: '#1c2430', offsetY: -12, formatter: function (v) { return v + '%'; } }
                }
            }
        },
        stroke: { lineCap: 'round' }
    };

    if (lms_ml_coverage_chart_instance) { lms_ml_coverage_chart_instance.destroy(); lms_ml_coverage_chart_instance = null; }
    el.innerHTML = '';
    lms_ml_coverage_chart_instance = new ApexCharts(el, options);
    lms_ml_coverage_chart_instance.render();
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

function get_dashboard_data() {
    var lms_dash_url = global_wcf_url_lms + 'LMS_Select_Dashboard';
    var lms_dash_cache_key = 'dashboard';
    var Param_obj = [];

    // Cache-first (see get_safety_module_listing); original path preserved as fallback.
    if (typeof LmsData !== 'undefined') {
        var had_cache = LmsData.getCache(lms_dash_cache_key) != null;
        if (!had_cache) {
            LmsData.showSkeletons("#lms-trend-chart", 3);
        }
        LmsData.fetch(lms_dash_cache_key, lms_dash_url, JSON.stringify(Param_obj),
            function (txt, source) { apply_dashboard(txt); },
            function (err) {
                if (!had_cache) {
                    LmsData.showError("#lms-trend-chart", "get_dashboard_data()");
                }
            },
            { timeout: 15000, retries: 1 }
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
// completion or score concept in its data — Watched/Liked are the real
// engagement metrics used there instead (same fields as the reels-feed badge).
function select_lms_dashboard_category(category, el) {
    lms_dashboard_selected_category = category;
    $('#tab-3 .lms-category-card').removeClass('is-active').attr('aria-pressed', 'false');
    if (el) { $(el).addClass('is-active').attr('aria-pressed', 'true'); }

    // Reset to each category's default single-line view on every switch —
    // Modules/Micro Learning have a real chart; Assessments has the score bar
    // chart (no per-metric switching there, so no default to reset).
    lms_module_chart_metric = 'completions';
    lms_ml_chart_view = 'trend';

    // Week/Month/Custom only makes sense where there's a real per-day trend
    // (Modules, Micro Learning's watch-time line) — hidden for Assessments.
    var showsFilter = category === 'Modules' || category === 'Micro Learning';
    var filterRow = document.getElementById('lms_trend_filter_row');
    if (filterRow) filterRow.style.display = showsFilter ? '' : 'none';

    var coverageEl = document.getElementById('lms-ml-coverage-chart');
    if (coverageEl) coverageEl.style.display = 'none'; // lms_render_ml_chart_view() re-shows it if needed

    render_lms_dashboard_context_kpi();
    lms_render_selected_category_chart();
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
    var v4 = document.getElementById('kpi_dashboard_metric4');
    var card4 = document.getElementById('kpi_dashboard_metric4_card');
    var container = document.getElementById('lms_dashboard_context_kpi');
    if (!v1 || !v2 || typeof lms_compute_completion_kpi !== 'function') return;

    // 4 real metrics for Modules/Micro Learning (force one line); Assessments
    // only has 2 (no video), so it falls back to a clean 2-up auto-fit instead
    // of leaving two empty column tracks in a forced 4-column grid.
    if (container) {
        container.classList.toggle('cols-4', lms_dashboard_selected_category !== 'Assessments');
    }

    function totalFromCache(cacheKey) {
        var cached = {};
        try { cached = JSON.parse(localStorage.getItem(cacheKey)) || {}; } catch (e) { cached = {}; }
        var total = 0;
        Object.keys(cached).forEach(function (id) { total += cached[id]; });
        return total;
    }

    if (lms_dashboard_selected_category === 'Modules' || lms_dashboard_selected_category === 'Assessments') {
        var isModules = lms_dashboard_selected_category === 'Modules';
        var items = isModules
            ? (typeof safety_module_data !== 'undefined' ? safety_module_data : [])
            : (typeof assessment_data !== 'undefined' ? assessment_data : []);
        var k = lms_compute_completion_kpi(items);
        l1.textContent = 'Completed'; v1.textContent = k.completedPct + '%';
        l2.textContent = 'Avg score'; v2.textContent = k.avgScorePct + '%';

        // Watch time / total video time only apply to Modules (has a lesson
        // video); Assessments has no video concept, so its context card stays 2-wide.
        if (card3) card3.style.display = isModules ? '' : 'none';
        if (card4) card4.style.display = isModules ? '' : 'none';
        if (isModules && v3 && l3 && typeof lms_get_watch_seconds === 'function') {
            l3.textContent = 'Watch time';
            v3.textContent = lms_format_watch_time(lms_get_watch_seconds('lms_watch_seconds_modules'));
        }
        if (isModules && v4) {
            v4.textContent = lms_format_watch_time(totalFromCache('lms_video_durations_modules'));
        }
    } else { // Micro Learning
        var arr = (typeof user_activitiy_Array !== 'undefined' && user_activitiy_Array) ? user_activitiy_Array : [];
        var watched = arr.filter(function (a) { return Number(a.Watch_Count) > 0; }).length;
        var liked = arr.filter(function (a) { return Number(a.IsLiked) > 0; }).length;
        l1.textContent = 'Watched'; v1.textContent = String(watched);
        l2.textContent = 'Liked'; v2.textContent = String(liked);

        if (card3) card3.style.display = '';
        if (card4) card4.style.display = '';
        if (v3 && l3 && typeof lms_get_watch_seconds === 'function') {
            l3.textContent = 'Watch time';
            v3.textContent = lms_format_watch_time(lms_get_watch_seconds('lms_watch_seconds_ml'));
        }
        if (v4) {
            v4.textContent = lms_format_watch_time(totalFromCache('lms_video_durations_ml'));
        }
    }

    // Highlight whichever metric card matches the chart's current selection.
    var activeSlot = 1;
    if (lms_dashboard_selected_category === 'Modules') {
        activeSlot = lms_module_chart_metric === 'score' ? 2 : (lms_module_chart_metric === 'watchtime' ? 3 : 1);
    } else if (lms_dashboard_selected_category === 'Micro Learning') {
        activeSlot = lms_ml_chart_view === 'coverage' ? 1 : 3;
    } else {
        activeSlot = 0; // Assessments — nothing selectable, one fixed chart
    }
    $('#lms_dashboard_context_kpi .lms-kpi-card.is-metric-selectable').removeClass('is-active');
    if (activeSlot > 0) {
        var activeValEl = document.getElementById('kpi_dashboard_metric' + activeSlot);
        if (activeValEl) $(activeValEl).closest('.lms-kpi-card').addClass('is-active');
    }
}
