

var dashboard_kpi_data = [];
var lms_kpi_chart_instance = null;

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

function select_kpi(metric, el) {
    $('.lms-kpi-card').removeClass('is-active').attr('aria-pressed', 'false');
    if (el) {
        $(el).addClass('is-active').attr('aria-pressed', 'true');
    }
    render_lms_kpi_chart(metric);
}

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

function render_lms_kpi_chart(metric) {
    if (!document.getElementById("lms-kpi-chart")) return;
    if (typeof ApexCharts === 'undefined') return;
    
    var data = [];
    var categories = [];
    
    if (metric === 'Modules') {
        if (dashboard_kpi_data && dashboard_kpi_data.length > 0) {
            for (var i = 0; i < dashboard_kpi_data.length; i++) {
                categories.push((i + 1).toString());
                var score = Number(dashboard_kpi_data[i].Achieve_Percentage || 0);
                data.push(score);
            }
        }
    } else if (metric === 'Assessments') {
        if (typeof assessment_data !== 'undefined' && assessment_data && assessment_data.length > 0) {
            for (var i = 0; i < assessment_data.length; i++) {
                categories.push((i + 1).toString());
                var score = Number(assessment_data[i].Progress || assessment_data[i].Score || 0);
                data.push(score);
            }
        }
    } else if (metric === 'Micro Learning') {
        if (typeof user_activitiy_Array !== 'undefined' && user_activitiy_Array && user_activitiy_Array.length > 0) {
            for (var i = 0; i < user_activitiy_Array.length; i++) {
                categories.push((i + 1).toString());
                var score = Number(user_activitiy_Array[i].Watch_Count || 0) * 10; 
                data.push(score > 100 ? 100 : score);
            }
        }
    }

    // Overall completion for the active metric -> a single brand gauge.
    // A % of a whole reads far clearer than a line over row indices.
    var avg = data.length ? Math.round(data.reduce(function (a, b) { return a + b; }, 0) / data.length) : 0;

    var options = {
        series: [avg],
        chart: {
            height: 250,
            type: 'radialBar',
            toolbar: { show: false }
        },
        labels: [metric + ' completion'],
        colors: ['#215ba8'],
        plotOptions: {
            radialBar: {
                hollow: { size: '62%' },
                track: { background: '#e3e6ea' },
                dataLabels: {
                    name: { fontSize: '13px', color: '#5b6470', offsetY: 22 },
                    value: {
                        fontSize: '30px', fontWeight: 800, color: '#1c2430', offsetY: -12,
                        formatter: function (v) { return v + '%'; }
                    }
                }
            }
        },
        stroke: { lineCap: 'round' }
    };

    if (lms_kpi_chart_instance) {
        lms_kpi_chart_instance.destroy();
    }
    
    lms_kpi_chart_instance = new ApexCharts(document.querySelector("#lms-kpi-chart"), options);
    lms_kpi_chart_instance.render();
}

function apply_dashboard(responseText) {
    var myArray;
    try { myArray = JSON.parse(responseText); } catch (e) { return; }
    var status = myArray[0].status;
    if (status != 1) return;

    var data = JSON.parse(myArray[0]["data"]);
    dashboard_kpi_data = data;

    // Build the whole list as one string and commit it in a single write so the
    // silent cache->network refresh doesn't flash an empty list.
    var html = '';
    if (!data || data.length === 0) {
        html = '<div class="lms-dashboard-empty">No recent activity yet. Complete a lesson to see your progress here.</div>';
    }
    for (var m = 0; m < data.length; m++) {
        var Module_Name = data[m].Module_Name;
        var Skill_Name = data[m].Skill_Name;
        var SubmittedDate = data[m].SubmittedDate;

        var Achieve_Percentage = data[m].Achieve_Percentage;
        if (Achieve_Percentage == "" || Achieve_Percentage == null || Achieve_Percentage == undefined) {
            Achieve_Percentage = "0";
        }
        else {
            Achieve_Percentage = Math.round(Achieve_Percentage);
        }

        var Achieve_Score = data[m].Achieve_Score;
        var Total_Score = data[m].Total_Score;
        var Rank = data[m].Rank;

        html += '<div class="lms-activity-card">';
        html += '<div class="act-main">';
        html += '<div class="act-title">' + Module_Name + '</div>';
        html += '<div class="act-sub">' + Skill_Name + ' &middot; Score ' + Achieve_Score + '/' + Total_Score + ' &middot; ' + SubmittedDate + '</div>';
        html += '<div class="sample-module-progress"><span style="width:' + Achieve_Percentage + '%"></span></div>';
        html += '</div>';
        html += '<div class="act-side">';
        html += '<span class="act-rank">Rank ' + Rank + '</span>';
        html += '<span class="act-pct">' + Achieve_Percentage + '%</span>';
        html += '</div>';
        html += '</div>';
    }
    $("#dv_Dashboard_List").html(html);

    update_lms_kpi();
    setTimeout(function () {
        var activeMetric = $('.is-active').find('.kpi-label').text().trim() || 'Modules';
        render_lms_kpi_chart(activeMetric);
    }, 500);
}

function get_dashboard_data() {
    var lms_dash_url = global_wcf_url_lms + 'LMS_Select_Dashboard';
    var lms_dash_cache_key = 'dashboard';
    var Param_obj = [];

    // Cache-first (see get_safety_module_listing); original path preserved as fallback.
    if (typeof LmsData !== 'undefined') {
        var had_cache = LmsData.getCache(lms_dash_cache_key) != null;
        if (!had_cache) {
            LmsData.showSkeletons("#dv_Dashboard_List", 3);
        }
        LmsData.fetch(lms_dash_cache_key, lms_dash_url, JSON.stringify(Param_obj),
            function (txt, source) { apply_dashboard(txt); },
            function (err) {
                if (!had_cache) {
                    $("#dv_Dashboard_List").empty();
                    if (typeof onfail === 'function') onfail(err);
                }
            },
            { timeout: 15000, retries: 1 }
        );
        return;
    }

    $("#dv_Dashboard_List").empty();
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
    } catch(e) {
        console.error("Error updating LMS KPIs: ", e);
    }
}