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
 * Page reads keep the shape of the old SQL calls: read() gives the rows as the JSON string showValues returned (p=1), first() gives the
 * first column of the first row (p=0).
 *
 * Errors: 'bridge-unavailable' (no native side), 'bridge-timeout', 'bridge-retired' (the page was left), or the code
 * the native side sent ('data-invalid', 'data-unavailable'). Results are cancelled with retire() when a page is left.
 */
(function (w) {
    'use strict';
    if (w.AppBridge) return;

    function failure(code) { var error = new Error(code); error.code = code; return error; }
    var failure_ = failure;

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
        // For a page's existing handlers: runs a named query and gives success the string SqlitePlugin.showValues used to
        // return (rows as JSON, nulls as "Unknown", the device id on every row), so the handler does not change. Values are
        // sent as text, as they would have been inside the SQL string, and are bound natively, never joined into it.
        // A page handler that throws is reported as an uncaught error, as it was when native called it directly,
        // not swallowed by the promise and not mistaken for a failed read.
        function call(handler, value) {
            if (typeof handler !== 'function') return;
            try { handler(value); } catch (error) { setTimeout(function () { throw error; }, 0); }
        }
        function read(success, failure, name, args) {
            var given = {};
            Object.keys(args || {}).forEach(function (key) { given[key] = String(args[key]); });
            exec('DataBridge', 'query', [{ name: name, args: given, compat: true }]).then(function (value) {
                var result = parse(value);
                if (!result || !Array.isArray(result.rows)) throw failure_('bridge-bad-result');
                return JSON.stringify(result.rows);
            }).then(function (text) { call(success, text); },
                function (error) { call(failure, error && error.code || 'bridge-failed'); });
        }
        // The old p=0 read: success gets only the first column of the first row, as a plain string; no rows is the failure
        // "No data found", as it was.
        function first(success, failure, name, args) {
            var given = {};
            Object.keys(args || {}).forEach(function (key) { given[key] = String(args[key]); });
            exec('DataBridge', 'query', [{ name: name, args: given, compat: true, first: true }]).then(function (value) {
                var result = parse(value);
                if (!result || !Array.isArray(result.rows)) throw failure_('bridge-bad-result');
                if (!result.rows.length) throw failure_('no-data');
                return result.first;
            }).then(function (text) { call(success, text); },
                function (error) { call(failure, error && error.code === 'no-data' ? 'No data found' : (error && error.code || 'bridge-failed')); });
        }
        return {
            exec: exec, query: query, sql: sql, read: read, first: first,
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

    var shared, over = typeof WeakMap === 'function' ? new WeakMap() : null;
    w.AppBridge = {
        create: create,
        shared: function () { return shared || (shared = create(function () { return w.cordova; })); },
        // A bridge over the cordova object a script already uses, so a page-owned `cordova` (one that drops answers after
        // the page is left) keeps doing so. Pages write:  AppBridge.on(cordova).read(onSuccess, onFail, 'queryName', { ... })
        // where they used to write:  cordova.exec(onSuccess, onFail, 'SqlitePlugin', 'showValues', [{ data: sql, p: '1' }])
        on: function (host) {
            if (!host || typeof host.exec !== 'function') return create(host);
            var known = over && over.get(host);
            if (!known) { known = create(host); if (over) over.set(host, known); }
            return known;
        }
    };
})(window);
