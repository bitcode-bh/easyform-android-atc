/* ==========================================================================
   LMS_State — offline action queue (Phase 2)
   --------------------------------------------------------------------------
   SQLite-backed queue (via the existing custom SqlitePlugin) for write actions
   performed while offline / during a network drop. Actions are replayed when
   connectivity returns. Additive: nothing is affected until a write path opts
   in through LmsData.postAction.
   ========================================================================== */
var LMS_State = (function () {
    'use strict';

    var isReady = false;
    var pending = 0;
    var draining = false;
    var listeners = [];

    function write(sql, onOk, onErr) {
        if (typeof cordova === 'undefined' || !cordova.exec) { if (onErr) onErr('no-cordova'); return; }
        cordova.exec(function (r) { if (onOk) onOk(r); }, function (e) { if (onErr) onErr(e); },
            'SqlitePlugin', 'insertValuse', [{ data: sql, p: '1' }]);
    }
    function read(sql, onOk, onErr) {
        if (typeof cordova === 'undefined' || !cordova.exec) { if (onErr) onErr('no-cordova'); return; }
        cordova.exec(function (r) { if (onOk) onOk(r); }, function (e) { if (onErr) onErr(e); },
            'SqlitePlugin', 'showValues', [{ data: sql, p: '1' }]);
    }

    function notify() { for (var i = 0; i < listeners.length; i++) { try { listeners[i](pending); } catch (e) { } } }

    function refreshCount() {
        read("SELECT COUNT(*) AS c FROM lms_action_queue", function (res) {
            try {
                var rows = JSON.parse(res);
                var row = rows && rows[0] ? rows[0] : {};
                pending = parseInt(row.c != null ? row.c : (row.C != null ? row.C : 0), 10) || 0;
            } catch (e) { pending = 0; }
            notify();
        }, function () { });
    }

    function init() {
        write("CREATE TABLE IF NOT EXISTS lms_action_queue (id INTEGER PRIMARY KEY AUTOINCREMENT, action TEXT, payload TEXT, ts DATETIME DEFAULT CURRENT_TIMESTAMP)",
            function () { isReady = true; refreshCount(); flushQueue(); }, function () { });
    }

    function enqueueAction(actionType, payload, cb) {
        var p = JSON.stringify(payload).replace(/'/g, "''");
        write("INSERT INTO lms_action_queue (action, payload) VALUES ('" + actionType + "', '" + p + "')",
            function () { pending++; notify(); if (cb) cb(true); },
            function () { if (cb) cb(false); });
    }

    function removeAction(id, cb) {
        write("DELETE FROM lms_action_queue WHERE id = " + id,
            function () { if (pending > 0) pending--; notify(); if (cb) cb(true); },
            function () { if (cb) cb(false); });
    }

    function getQueue(cb) {
        read("SELECT id, action, payload FROM lms_action_queue ORDER BY id ASC",
            function (res) { try { cb(JSON.parse(res) || []); } catch (e) { cb([]); } },
            function () { cb([]); });
    }

    function flushQueue() {
        if (!isReady || draining) return;
        draining = true;
        getQueue(function (records) {
            if (!records || !records.length) { draining = false; return; }
            if (typeof LmsData !== 'undefined' && LmsData.processOfflineQueue) {
                LmsData.processOfflineQueue(records, function () { draining = false; });
            } else { draining = false; }
        });
    }

    function clearAll(cb) {
        write("DELETE FROM lms_action_queue", function () { pending = 0; notify(); if (cb) cb(); }, function () { if (cb) cb(); });
    }

    function onChange(fn) { if (typeof fn === 'function') { listeners.push(fn); try { fn(pending); } catch (e) { } } }
    function getPending() { return pending; }

    // Replay automatically when connectivity is restored.
    document.addEventListener('online', flushQueue, false);

    return {
        init: init,
        enqueueAction: enqueueAction,
        removeAction: removeAction,
        getQueue: getQueue,
        flushQueue: flushQueue,
        clearAll: clearAll,
        onChange: onChange,
        getPending: getPending
    };
})();
