/* The pages' typed link to the native side.
 *
 * Pages used to call cordova.exec(success, failure, 'SqlitePlugin', 'showValues', [{ data: "select ... '" + id + "'" }])
 * and parse a string in every handler. Here a call is a named promise: bridge.taskByTid(7). The query text lives in
 * the native DataQueries class, values are bound as parameters, and a result is always an array of rows or an Error
 * with a short code, so no page sees SQL, native error text or an empty string where JSON was expected.
 *
 *   bridge.query(name, args)  -> Promise<rows[]>      any query DataQueries declares
 *   bridge.exec(service, action, args) -> Promise<value>   any other plugin call, same error handling
 *   bridge.flowMapping(moduleId) / taskByTid(tid) / taskCountByFlag(flag) / outbox()   the named reads pages use
 *
 * Errors: 'bridge-unavailable' (no native side), 'bridge-timeout', 'bridge-retired' (the page was left), or the code
 * the native side sent ('data-invalid', 'data-unavailable'). Results are cancelled with retire() when a page is left.
 */
(function (w) {
    'use strict';
    if (w.AppBridge) return;

    function failure(code) { var error = new Error(code); error.code = code; return error; }

    function create(host, options) {
        options = options || {};
        var timeout = options.timeout || 15000, retired = false, open = 0;
        function exec(service, action, args) {
            return new Promise(function (resolve, reject) {
                var target = typeof host === 'function' ? host() : host;
                if (retired) return reject(failure('bridge-retired'));
                if (!target || typeof target.exec !== 'function') return reject(failure('bridge-unavailable'));
                var done = false, timer;
                function finish(error, value) {
                    if (done) return;
                    done = true; clearTimeout(timer); open--;
                    if (retired) error = failure('bridge-retired');
                    if (error) reject(error); else resolve(value);
                }
                open++;
                timer = setTimeout(function () { finish(failure('bridge-timeout')); }, timeout);
                try {
                    target.exec(function (value) { finish(null, value); },
                        function (reason) { finish(failure(typeof reason === 'string' && /^[a-z-]{3,40}$/.test(reason) ? reason : 'bridge-failed')); },
                        service, action, args || []);
                } catch (error) { finish(failure('bridge-failed')); }
            });
        }
        function parse(value) {
            if (typeof value !== 'string') return value;
            if (!value.trim()) return null;
            try { return JSON.parse(value); } catch (error) { throw failure('bridge-bad-result'); }
        }
        function query(name, args) {
            return exec('DataBridge', 'query', [{ name: name, args: args || {} }]).then(function (value) {
                var result = parse(value);
                if (!result || !Array.isArray(result.rows)) throw failure('bridge-bad-result');
                return result.rows;
            });
        }
        // Raw read of a SQL string, for code that has not moved to a named query yet. Rows are always an array.
        function sql(statement) {
            return exec('SqlitePlugin', 'showValues', [{ data: statement, p: '1' }]).then(function (value) {
                var rows = parse(value);
                return Array.isArray(rows) ? rows : [];
            });
        }
        return {
            exec: exec, query: query, sql: sql,
            flowMapping: function (moduleId) { return query('flowMapping', { moduleid: moduleId }); },
            taskByTid: function (tid) { return query('taskByTid', { tid: tid }); },
            taskCountByFlag: function (flag) { return query('taskCountByFlag', { flag: flag }).then(function (rows) { return rows.length ? Number(rows[0].n) || 0 : 0; }); },
            // What is waiting to upload, as numbers: { tasks, files, photos, videos, total }.
            outbox: function () {
                return query('pendingUploads', {}).then(function (rows) {
                    var row = rows[0] || {}, result = { tasks: Number(row.tasks) || 0, files: Number(row.files) || 0, photos: Number(row.photos) || 0, videos: Number(row.videos) || 0 };
                    result.total = result.tasks + result.files + result.photos + result.videos;
                    return result;
                });
            },
            pending: function () { return open; },
            retire: function () { retired = true; }
        };
    }

    w.AppBridge = { create: create, shared: function () { return create(function () { return w.cordova; }); } };
})(window);
