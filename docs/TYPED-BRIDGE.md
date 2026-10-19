# Typed bridge (Phase 7)

Pages used to send SQL text to the native side and parse whatever string came back:

```js
cordova.exec(function (e) { var rows = JSON.parse(e); ... }, onfail, 'SqlitePlugin', 'showValues',
    [{ data: "select tid from task_master where tid = '" + tid + "'", p: '1' }]);
```

There are 344 `cordova.exec` calls in 71 files; about 140 are SQL. The typed bridge replaces them one at a time.

## What exists

| Piece | File | Job |
|---|---|---|
| Named queries | `src/com/sky/atc/easyformse/DataQueries.java` | Every query is declared once: fixed text, one `?` per declared value, a type per value. Values are bound, never joined into the text. Unknown names and undeclared or mistyped values are refused. |
| Plugin | `src/com/sky/atc/easyformse/DataBridge.java` | `cordova.exec(ok, fail, 'DataBridge', 'query', [{ name, args }])` runs a named query off the main thread. Errors are only `data-invalid` or `data-unavailable`; no SQL or values are ever returned. |
| Client | `js/app_bridge.js` | `AppBridge.create(host)` gives promises: `taskByTid(7)`, `flowMapping(id)`, `taskCountByFlag(flag)`, `query(name, args)`, and `exec(service, action, args)` for other plugins. Always resolves to rows or rejects with a short code. A page's bridge is retired when the page is left. |
| Contract | `tests/native-contract.test.cjs` | Every `cordova.exec` service a page calls must be a native feature. Nine services that never existed on this app are listed as known-missing; the list can only shrink. |

Rows come back as strings, as `showValues` always did, so a page can move to a named call without changing how it reads fields.

## Moving a call

1. Add the query to `DataQueries.java` (`all.put("name", new Query("SELECT ... WHERE x = ?", "x", INT))`) and to `DataQueriesTest`.
2. Add a one-line method to `js/app_bridge.js` (`name: function (x) { return query('name', { x: x }); }`). The contract test checks that every query the client asks for is declared natively.
3. Replace the page's `cordova.exec(...)` with `bridge.name(x).then(rows => ...)`.

Done so far: the shell's list adapters (`js/app_pages.js`) read the flow mapping through `bridge.flowMapping`, and `tools/ui_phase7/migrate_reads.py` moved 33 page reads in 12 queries (branch `typed-bridge-migration`, not yet on `main`: it needs a walk through forms, checksheets and downloads on a phone).

### What `showValues` really does (why the codemod reads `p`)

| `p` | Old behaviour | Now |
|---|---|---|
| `1` | all rows as a JSON string; nulls as `"Unknown"`, the device id on every row | `AppBridge.on(cordova).read(...)` returns the same string |
| `0` | only the first column of the first row, as a plain string; no rows is the error `No data found` | `AppBridge.on(cordova).first(...)` |
| `3` | also rewrites the device id in `Login_Master` | not migrated |
| `4`, `6`, `8` | also start the download, upload or document service | not migrated |
| `5` | ignores the SQL and returns the saved photo path | not migrated |
| `7` | stores a download id | not migrated |

The codemod rewrites a call only when its SQL matches a named query exactly, its `p` is `1` or `0`, and the call runs the array the query was pushed into. `tests/native-contract.test.cjs` checks each migrated call against `DataQueries.java` (the query exists and takes exactly the values given) and that the codemod finds nothing left to rewrite.

## Not done

Writes (`SqlitePlugin.insertValuse`, 61 call sites) and the remaining reads still go through `SqlitePlugin`. A write is more than SQL: its `q` code also marks a task as ready to upload and starts the uploader, and some carry attendance hooks. Each needs its own typed action (for example `submitTask(tid)`), not a generic write, and a phone check. The reads left are the ones with `p` codes that do more than read, or SQL assembled in ways the codemod does not recognise (about 29 sites).
