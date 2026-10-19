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

Done so far: the shell's list adapters (`js/app_pages.js`) read the flow mapping through `bridge.flowMapping`.

## Not done

Writes (`SqlitePlugin.insertValuse`, 61 call sites) and the remaining reads still go through `SqlitePlugin`. Moving them is mechanical but each needs its own named query and a page-by-page check on a phone, so it is done as each page is touched.
