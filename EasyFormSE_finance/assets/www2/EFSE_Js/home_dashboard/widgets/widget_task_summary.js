// Home Operations Dashboard — task_summary widget.
// See docs/PRD-Home-Operations-Dashboard.md §6.2.
//
// No pending/done/overdue split in P1 — no such status semantics exist
// anywhere in this codebase's task_master queries (checked every one before
// writing this), and the PRD's own OQ-3 marks the definition as still
// undecided by Product+Backend. Renders a single total (+ optional per-flow
// breakdown), matching the number the rest of the app already shows.

var HomeWidgetTaskSummary = (function () {
    'use strict';

    // Single-instance widget (only one dashboard on screen at a time), so
    // remembering cfg here is enough for refresh() to reuse it without the
    // caller (home_dashboard_entry.js) having to pass it through again.
    var _cfg = null;

    function render(container, cfg) {
        _cfg = cfg;
        var html = '<div class="hd-widget hd-task-summary" data-widget="task_summary">'
            + '<div class="hd-card-title">Tasks</div>'
            + '<div class="hd-task-total"><span class="hd-count">&hellip;</span><span class="hd-label">Pending</span></div>'
            + '<div class="hd-task-breakdown"></div>'
            + '</div>';
        container.append(html);
        fetchAndUpdate(container);
    }

    function refresh(container) {
        fetchAndUpdate(container);
    }

    function fetchAndUpdate(container) {
        HomeDashboardData.getTaskCounts(function (result) {
            var root = container.find('[data-widget="task_summary"]');
            root.find('.hd-count').text(result.total);

            if (_cfg && _cfg.show_per_flow_breakdown && result.byFlow.length > 0) {
                var rows = '';
                for (var i = 0; i < result.byFlow.length; i++) {
                    var f = result.byFlow[i];
                    if (!f.task_count) continue;
                    rows += '<div class="hd-flow-row" data-udf-id="' + f.udf_id + '">'
                        + '<span class="hd-flow-name">' + (f.flow_name || '') + '</span>'
                        + '<span class="hd-flow-count">' + f.task_count + '</span>'
                        + '</div>';
                }
                root.find('.hd-task-breakdown').html(rows);
                bindRowTaps(root);
            }
        });
    }

    // Delegates to the module_list's own row rather than reconstructing
    // redirect_on_module_click(...)'s args: the listview <li> already carries
    // udf_id="..." as a plain attribute and the real onclick built server-side
    // (selection.js). Only the listview (non-cardview) layout is wired —
    // #module_list li[udf_id] confirmed present; cardview's <td> has no
    // equivalent locatable attribute, so a row tap in cardview mode is a
    // silent no-op rather than a guess.
    function bindRowTaps(root) {
        root.find('.hd-flow-row').off('click.hdTaskSummary').on('click.hdTaskSummary', function () {
            var udfId = $(this).attr('data-udf-id');
            if (!udfId) return;
            var row = $('#module_list li[udf_id="' + udfId + '"]');
            if (row.length > 0) {
                row[0].click();
            }
        });
    }

    return { render: render, refresh: refresh };
})();
