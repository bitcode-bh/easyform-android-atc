// Home Operations Dashboard — feature_links widget.
// See docs/PRD-Home-Operations-Dashboard.md §6.12.
//
// Flags and onclick behavior copied verbatim from selection.html's own
// #menu_MISC list (localStorage.getItem('KYFF'|'Chart'|'Tech_Report'|
// 'Live_Alarm_Report'|'Scoreboard'), 'True' string literal) — NOT the
// menu_KYFF-style element ids the PRD's catalog table names, which are only
// DOM ids, not the actual gating source. menu_Attendance is deliberately
// excluded: its onchange handler in selection.html is empty (dead legacy
// toggle), and real attendance status is already covered by P2's
// attendance_chip widget.

(function (w) {
    'use strict';
    if (w.AppHomeWidgetFeatureLinksController) return;
    function create(options) {
        options = options || {};
        var $ = options.$ || function () { return w.jQuery.apply(w, arguments); };

    'use strict';

    var LINKS = [
        { flag: 'KYFF', match: 'True', label: 'Know Your Field Force', icon: 'fa-sitemap', reportName: 'KYFF', page: 'feature_filter.html' },
        { flag: 'Chart', match: 'True', label: 'Dashboard', icon: 'fa-dashboard', reportName: 'Chart', page: 'feature_chart.html' },
        { flag: 'Scoreboard', match: 'True', label: 'Scoreboard', icon: 'fa-star-half-o', reportName: 'Scoreboard', page: 'feature_chart.html' },
        { flag: 'Tech_Report', match: 'True', label: 'Technician Report', icon: 'fa-group', reportName: 'tech_rep', page: 'feature_filter.html' },
        { flag: 'Live_Alarm_Report', match: 'True', label: 'Live Alarm Report', icon: 'fa-dot-circle-o', reportName: 'live_alarm', page: 'feature_filter.html' }
    ];

    function enabledLinks() {
        var out = [];
        for (var i = 0; i < LINKS.length; i++) {
            var l = LINKS[i];
            var val = null;
            try { val = localStorage.getItem(l.flag); } catch (e) { val = null; }
            if (val === l.match) out.push(l);
        }
        return out;
    }

    function render(container, cfg) {
        var links = enabledLinks();
        if (links.length === 0) {
            return;
        }
        var rows = '';
        for (var i = 0; i < links.length; i++) {
            rows += '<div class="hd-link-row" data-report="' + links[i].reportName + '" data-page="' + links[i].page + '">'
                + '<i class="fa ' + links[i].icon + '"></i>'
                + '<span>' + links[i].label + '</span>'
                + '<i class="fa fa-chevron-right hd-link-chevron"></i>'
                + '</div>';
        }
        var html = '<div class="hd-widget hd-feature-links" data-widget="feature_links">'
            + '<div class="hd-card-title">More</div>'
            + rows
            + '</div>';
        container.append(html);

        var root = container.find('[data-widget="feature_links"]');
        root.find('.hd-link-row').off('click.hdFeatureLinks').on('click.hdFeatureLinks', function () {
            var reportName = $(this).attr('data-report');
            var page = $(this).attr('data-page');
            try {
                localStorage.setItem('report_name', reportName);
                if (typeof changeurl === 'function') {
                    changeurl(page);
                }
            } catch (e) { }
        });
    }

    // Flags come from login and don't change mid-session; nothing to refresh.
    function refresh(container) { }


        var api = { render: render, refresh: refresh };
        if (options.scope) Object.keys(api).forEach(function (key) { if (typeof api[key] === 'function') api[key] = (options.scope.own || options.scope.guard)(api[key]); });
        return api;
    }
    w.AppHomeWidgetFeatureLinksController = { create: create };
    if (!w.document.documentElement.hasAttribute || !w.document.documentElement.hasAttribute('data-app-shell')) w.HomeWidgetFeatureLinks = create();
})(window);
