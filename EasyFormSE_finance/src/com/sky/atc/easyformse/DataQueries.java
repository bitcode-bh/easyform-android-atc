package com.sky.atc.easyformse;

import android.database.Cursor;
import net.sqlcipher.database.SQLiteDatabase;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

/**
 * Named, parameterised reads for the pages (the typed bridge).
 *
 * A page asks for {@code taskByTid} with {@code {"tid": "7"}}; it never sends SQL. Every query is declared here once,
 * its values are bound as parameters (so no value can change the statement), and each value is checked against the type
 * the query declares. Rows come back as strings, the way {@code SqlitePlugin.showValues} has always returned them, so a
 * page can move to a named call without changing how it reads the result.
 */
final class DataQueries {
    /** A value a query takes. */
    private static final int INT = 0, TEXT = 1;

    static final class Query {
        final String sql;
        final String[] names;
        final int[] types;

        Query(String sql, Object... arguments) {
            this.sql = sql;
            names = new String[arguments.length / 2];
            types = new int[arguments.length / 2];
            for (int i = 0; i < names.length; i++) {
                names[i] = (String) arguments[i * 2];
                types[i] = (Integer) arguments[i * 2 + 1];
            }
        }
    }

    private static final Map<String, Query> QUERIES;

    static {
        Map<String, Query> all = new HashMap<>();
        // The flow a module opens: its checksheet mapping.
        all.put("flowMapping", new Query("SELECT data FROM flow_master WHERE moduleid = ?", "moduleid", INT));
        // The task row a checksheet belongs to.
        all.put("taskByTid", new Query("SELECT tid, server_task_id, task_id, step FROM task_master WHERE tid = ?", "tid", INT));
        // How many tasks are in a given state (for example waiting to upload).
        all.put("taskCountByFlag", new Query("SELECT COUNT(*) AS n FROM task_master WHERE flag = ?", "flag", TEXT));
        // Reads the pages used to build by joining values into SQL text. Values are bound, so a page value can never change the statement.
        all.put("loginImei", new Query("SELECT imei FROM Login_Master"));
        all.put("loginUsername", new Query("SELECT username FROM Login_Master"));
        all.put("flowChecksheet", new Query("SELECT fm.checksheet_id FROM flow_master fm WHERE fm.moduleid = ?", "moduleid", INT));
        all.put("formDataByStep", new Query("SELECT f_data FROM f_master WHERE tid = ? AND c_id = ? AND step = ?", "tid", TEXT, "c_id", TEXT, "step", TEXT));
        all.put("formDataByValueStep", new Query("SELECT f_data FROM f_master WHERE tid = ? AND f_value = ? AND step = ?", "tid", TEXT, "f_value", TEXT, "step", TEXT));
        all.put("formDataByTypeOneStep", new Query("SELECT f_data FROM f_master WHERE tid = ? AND step = ? AND c_type = 1", "tid", TEXT, "step", TEXT));
        all.put("formDataByTypeFive", new Query("SELECT f_data FROM f_master WHERE tid = ? AND c_type = 5", "tid", TEXT));
        all.put("formAndChecksheetByTypeFive", new Query("SELECT fm.c_id, fm.f_data, ch.data FROM f_master fm JOIN checksheet ch ON fm.c_id = ch.checksheetid WHERE fm.tid = ? AND fm.c_type = 5", "tid", TEXT));
        all.put("checksheetStep", new Query("SELECT subcategory, checksheetid, step, data, buttons FROM checksheet WHERE checksheetid = ? AND step = ?", "checksheetid", TEXT, "step", TEXT));
        all.put("pendingLocationPoints", new Query("SELECT issend FROM lat_plug WHERE issend = 0"));
        all.put("lastDownloadVideo", new Query("SELECT _id FROM download_video ORDER BY _id DESC LIMIT 1"));
        all.put("downloadCounters", new Query("SELECT counter_name, status, counter, total_count, globalcounter FROM download_counter"));
        all.put("taskByServerId", new Query("SELECT tid FROM task_master WHERE server_task_id = ?", "server_task_id", TEXT));
        all.put("lastTaskByUser", new Query("SELECT tid, checksheetid, moduleid, task_id FROM task_master WHERE username = ? ORDER BY tid DESC LIMIT 1", "username", TEXT));
        all.put("lastTaskIdsByUser", new Query("SELECT tid, checksheetid FROM task_master WHERE username = ? ORDER BY tid DESC LIMIT 1", "username", TEXT));
        // What is still waiting to upload: forms (tasks and their files), photos and videos. These are the same
        // conditions the pending-status page counts; GPS points are left out because they queue all day by design.
        all.put("pendingUploads", new Query("SELECT "
                + "(SELECT COUNT(*) FROM task_master WHERE flag = 1 OR flag = 3) AS tasks, "
                + "(SELECT COUNT(*) FROM f_master WHERE flag = 0) AS files, "
                + "(SELECT COUNT(*) FROM p_master WHERE flag = 0) AS photos, "
                + "(SELECT COUNT(*) FROM video WHERE issend_track = 0) AS videos"));
        QUERIES = Collections.unmodifiableMap(all);
    }

    private DataQueries() {
    }

    static Query find(String name) {
        Query query = name == null ? null : QUERIES.get(name);
        if (query == null) throw new IllegalArgumentException("query");
        return query;
    }

    /** The values for the query's placeholders, in order. Anything the query does not declare is refused. */
    static String[] bind(Query query, JSONObject args) {
        return bind(query, args, true);
    }

    /**
     * With {@code strict} off a value of the wrong kind is still bound (never joined), so it simply matches nothing, as a page's
     * old SQL text would have. The typed API keeps strict checking.
     */
    static String[] bind(Query query, JSONObject args, boolean strict) {
        JSONObject given = args == null ? new JSONObject() : args;
        for (Iterator<String> keys = given.keys(); keys.hasNext(); ) {
            String key = keys.next();
            boolean known = false;
            for (String name : query.names) known |= name.equals(key);
            if (!known) throw new IllegalArgumentException("argument");
        }
        String[] values = new String[query.names.length];
        for (int i = 0; i < values.length; i++) {
            Object raw = given.opt(query.names[i]);
            if (raw == null || raw == JSONObject.NULL || raw instanceof JSONObject || raw instanceof JSONArray) throw new IllegalArgumentException("argument");
            String text = String.valueOf(raw);
            if ((strict && text.isEmpty()) || text.length() > 512) throw new IllegalArgumentException("argument");
            if (strict && query.types[i] == INT && !text.matches("-?[0-9]{1,18}")) throw new IllegalArgumentException("argument");
            values[i] = text;
        }
        return values;
    }

    /** Runs a request {@code {"name": ..., "args": {...}}} and returns {@code {"rows": [...]}}. */
    static JSONObject run(SQLiteDatabase database, JSONObject request) throws Exception {
        Query query = find(request.optString("name", null));
        // compat: the shape SqlitePlugin.showValues has always returned (nulls as "Unknown", the device id on every row),
        // so a page's existing handler can read the result unchanged.
        boolean compat = request.optBoolean("compat", false);
        String[] values = bind(query, request.optJSONObject("args"), !compat);
        String imei = compat ? DeviceEventsUtils.getImei() : null;
        JSONArray rows = new JSONArray();
        Cursor cursor = database.rawQuery(query.sql, values);
        try {
            String[] columns = cursor.getColumnNames();
            while (cursor.moveToNext()) {
                JSONObject row = new JSONObject();
                for (int i = 0; i < columns.length; i++) {
                    String value = cursor.getString(i);
                    row.put(columns[i], value == null ? (compat ? "Unknown" : "") : value);
                }
                if (compat) row.put("imei", imei);
                rows.put(row);
            }
        } finally {
            cursor.close();
        }
        return new JSONObject().put("rows", rows);
    }
}
