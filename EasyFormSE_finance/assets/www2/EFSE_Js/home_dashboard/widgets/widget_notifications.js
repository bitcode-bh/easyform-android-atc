// Home Operations Dashboard — notifications_summary widget.
// See docs/PRD-Home-Operations-Dashboard.md §6.9.
//
// Tap delegates to the real get_user_notifications() (selection.js) — the
// exact function the navbar bell icon already calls, which opens the actual
// .popup-notifications panel and fetches. This card is a read-only preview
// of the same data, not a second notification UI.

(function (w) {
    'use strict';
    if (w.AppHomeWidgetNotificationsController) return;
    function create(options) {
        options = options || {};
        var actions = options.actions || w;
        var HomeDashboardData = options.data || w.HomeDashboardData;

    'use strict';

    var _limit = 3;

    function render(container, cfg) {
        _limit = (cfg && cfg.limit) || 3;
        var html = '<div class="hd-widget hd-notifications" data-widget="notifications_summary">'
            + '<div class="hd-card-title">Notifications</div>'
            + '<div class="hd-noti-list"><div class="hd-noti-empty">&hellip;</div></div>'
            + '</div>';
        container.append(html);

        var root = container.find('[data-widget="notifications_summary"]');
        root.off('click.hdNoti').on('click.hdNoti', function () {
            try {
                if (typeof actions.get_user_notifications === 'function') {
                    actions.get_user_notifications();
                }
            } catch (e) { }
        });

        refresh(container);
    }

    function refresh(container) {
        var root = container.find('[data-widget="notifications_summary"]');
        if (root.length === 0) {
            return;
        }
        HomeDashboardData.getNotificationsSummary(_limit, function (result) {
            var list = root.find('.hd-noti-list');
            if (!result.items || result.items.length === 0) {
                list.html('<div class="hd-noti-empty">No notifications yet</div>');
                return;
            }
            var rows = '';
            for (var i = 0; i < result.items.length; i++) {
                var item = result.items[i];
                rows += '<div class="hd-noti-row' + (item.isRead ? '' : ' hd-noti-unread') + '">'
                    + '<span class="hd-noti-dot"></span>'
                    + '<span class="hd-noti-title">' + item.title + '</span>'
                    + '</div>';
            }
            list.html(rows);
        });
    }


        var api = { render: render, refresh: refresh };
        if (options.scope) Object.keys(api).forEach(function (key) { if (typeof api[key] === 'function') api[key] = (options.scope.own || options.scope.guard)(api[key]); });
        return api;
    }
    w.AppHomeWidgetNotificationsController = { create: create };
    if (!w.document.documentElement.hasAttribute || !w.document.documentElement.hasAttribute('data-app-shell')) w.HomeWidgetNotifications = create();
})(window);
