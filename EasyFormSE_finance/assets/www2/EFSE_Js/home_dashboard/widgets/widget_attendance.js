// Home Operations Dashboard — attendance_chip widget.
// See docs/PRD-Home-Operations-Dashboard.md §6.7.
//
// Two signals, cheapest first: trip_status (local, instant, same source the
// Start Trip tab reads) short-circuits the network call whenever a trip is
// already active. Otherwise falls back to Get_Attendance to see whether a
// record exists for today. Tap always delegates to the same
// noti_Attendance_Click() the Start Trip tab already uses to punch in --
// this card is an additional read-only status surface, not a second
// implementation of the punch flow.
//
// Deliberately does not revive the old noti_Attendance1 profile-photo
// warning the PRD's table mentions merging in: that logic is dead/commented
// code (selection.js's get_today_attendance_for_notification_old(), never
// called) with no live trigger condition to port faithfully.

(function (w) {
    'use strict';
    if (w.AppHomeWidgetAttendanceController) return;
    function create(options) {
        options = options || {};
        var actions = options.actions || w;
        var HomeDashboardData = options.data || w.HomeDashboardData;

    'use strict';

    function render(container, cfg) {
        var html = '<div class="hd-widget hd-attendance" data-widget="attendance_chip">'
            + '<div class="hd-card-title">Attendance</div>'
            + '<div class="hd-attendance-status">&hellip;</div>'
            + '</div>';
        container.append(html);

        var root = container.find('[data-widget="attendance_chip"]');
        root.off('click.hdAttendance').on('click.hdAttendance', function () {
            try {
                if (typeof actions.noti_Attendance_Click === 'function') {
                    actions.noti_Attendance_Click();
                }
            } catch (e) { }
        });

        refresh(container);
    }

    function refresh(container) {
        var root = container.find('[data-widget="attendance_chip"]');
        if (root.length === 0) {
            return;
        }
        var statusEl = root.find('.hd-attendance-status');

        HomeDashboardData.getTripStatus(function (tripResult) {
            if (tripResult.active) {
                statusEl.text('On trip — tap to view');
                root.removeClass('hd-attendance-unmarked').addClass('hd-attendance-marked');
                return;
            }
            HomeDashboardData.getAttendanceToday(function (attResult) {
                if (!attResult.available) {
                    statusEl.text('Attendance unavailable offline');
                    root.removeClass('hd-attendance-marked hd-attendance-unmarked');
                    return;
                }
                if (attResult.checkedIn) {
                    statusEl.text('Marked for today');
                    root.removeClass('hd-attendance-unmarked').addClass('hd-attendance-marked');
                } else {
                    statusEl.text('Not marked yet — tap to mark');
                    root.removeClass('hd-attendance-marked').addClass('hd-attendance-unmarked');
                }
            });
        });
    }


        var api = { render: render, refresh: refresh };
        if (options.scope) Object.keys(api).forEach(function (key) { if (typeof api[key] === 'function') api[key] = (options.scope.own || options.scope.guard)(api[key]); });
        return api;
    }
    w.AppHomeWidgetAttendanceController = { create: create };
    if (!w.document.documentElement.hasAttribute || !w.document.documentElement.hasAttribute('data-app-shell')) w.HomeWidgetAttendance = create();
})(window);
