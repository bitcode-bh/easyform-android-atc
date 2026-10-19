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
            if (text.isEmpty() || text.length() > 512) throw new IllegalArgumentException("argument");
            if (query.types[i] == INT && !text.matches("-?[0-9]{1,18}")) throw new IllegalArgumentException("argument");
            values[i] = text;
        }
        return values;
    }

    /** Runs a request {@code {"name": ..., "args": {...}}} and returns {@code {"rows": [...]}}. */
    static JSONObject run(SQLiteDatabase database, JSONObject request) throws Exception {
        Query query = find(request.optString("name", null));
        String[] values = bind(query, request.optJSONObject("args"));
        JSONArray rows = new JSONArray();
        Cursor cursor = database.rawQuery(query.sql, values);
        try {
            String[] columns = cursor.getColumnNames();
            while (cursor.moveToNext()) {
                JSONObject row = new JSONObject();
                for (int i = 0; i < columns.length; i++) {
                    String value = cursor.getString(i);
                    row.put(columns[i], value == null ? "" : value);
                }
                rows.put(row);
            }
        } finally {
            cursor.close();
        }
        return new JSONObject().put("rows", rows);
    }
}
