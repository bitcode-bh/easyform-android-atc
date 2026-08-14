// Home Operations Dashboard — upload_health widget.
// See docs/PRD-Home-Operations-Dashboard.md §6.6.
//
// SYNC NOW triggers the real upload service directly — the same
// SqlitePlugin/'step' action make_upload_call() (pending_status.js) uses —
// without going through make_upload_call() itself, since its success
// callback (onsuccess_make_upload_call -> onsuccess_delete_track_upload_table)
// re-enters pending_status.js's own get_pending_tasks() chain, which is
// hard-coupled to pending_status.html-only DOM ids and has an unbounded
// re-poll path on one branch. delete_track_upload_table() (skipped here)
// only clears pending_status.html's own "recently uploaded" display table,
// not anything the upload engine itself depends on.

var HomeWidgetUploadHealth = (function () {
    'use strict';

    function render(container, cfg) {
        var showSync = !cfg || cfg.show_sync_button !== false;
        var html = '<div class="hd-widget hd-upload-health" data-widget="upload_health">'
            + '<div class="hd-card-title">Uploads pending</div>'
            + '<div class="hd-upload-total"><span class="hd-count">&hellip;</span></div>'
            + '<div class="hd-upload-breakdown">'
            + '<div class="hd-upload-row"><span>Tasks</span><span class="hd-u-tasks">&hellip;</span></div>'
            + '<div class="hd-upload-row"><span>Trips</span><span class="hd-u-trips">&hellip;</span></div>'
            + '<div class="hd-upload-row"><span>Videos</span><span class="hd-u-videos">&hellip;</span></div>'
            + '<div class="hd-upload-row"><span>Files</span><span class="hd-u-files">&hellip;</span></div>'
            + '<div class="hd-upload-row"><span>Photos</span><span class="hd-u-photos">&hellip;</span></div>'
            + '</div>'
            + (showSync ? '<button type="button" class="hd-btn hd-btn-sync">SYNC NOW</button>' : '')
            + '</div>';
        container.append(html);

        var root = container.find('[data-widget="upload_health"]');
        if (showSync) {
            root.find('.hd-btn-sync').off('click.hdSync').on('click.hdSync', syncNow);
        }
        refresh(container);
    }

    function refresh(container) {
        var root = container.find('[data-widget="upload_health"]');
        if (root.length === 0) {
            return;
        }
        HomeDashboardData.getUploadCounts(function (counts) {
            root.find('.hd-count').text(counts.total);
            root.find('.hd-u-tasks').text(counts.tasks);
            root.find('.hd-u-trips').text(counts.trips);
            root.find('.hd-u-videos').text(counts.videos);
            root.find('.hd-u-files').text(counts.files);
            root.find('.hd-u-photos').text(counts.photos);
        });
    }

    function syncNow() {
        var q_jsonobj = [{ fid: '', tid: '', step: '' }];
        try {
            cordova.exec(function () { }, function () { }, 'SqlitePlugin', 'step', q_jsonobj);
        } catch (e) { }
    }

    return { render: render, refresh: refresh };
})();
