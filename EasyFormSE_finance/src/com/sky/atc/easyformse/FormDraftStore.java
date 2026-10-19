package com.sky.atc.easyformse;

import android.database.Cursor;
import net.sqlcipher.database.SQLiteDatabase;
import org.json.JSONArray;
import org.json.JSONObject;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/** Field drafts live only in the application's existing encrypted database. */
final class FormDraftStore {
    private static final String FORMS = "CREATE TABLE IF NOT EXISTS ui_form_drafts (scope TEXT PRIMARY KEY, lease INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL)";
    private static final String FIELDS = "CREATE TABLE IF NOT EXISTS ui_form_draft_fields (scope TEXT NOT NULL, field TEXT NOT NULL, revision INTEGER NOT NULL, payload TEXT, PRIMARY KEY(scope,field))";

    static String scope(JSONObject context) throws Exception {
        String kind = context.getString("kind");
        if (!(kind.equals("form") || kind.equals("task"))) throw new IllegalArgumentException("kind");
        JSONArray identity = new JSONArray();
        for (String key : new String[]{"company", "user", "server", "flow", "task", "checksheet", "step"}) {
            String value = context.getString(key);
            if (value.isEmpty() || value.length() > 2048) throw new IllegalArgumentException("context");
            identity.put(value);
        }
        for (String name : new String[]{"company", "user", "flow", "checksheet", "step"}) {
            if (Long.parseLong(context.getString(name)) < 1) throw new IllegalArgumentException("context");
        }
        if (Long.parseLong(context.getString("task")) < 0 || !context.getString("server").matches("https?://.+")) throw new IllegalArgumentException("context");
        identity.put(kind);
        String schema = context.getString("schema");
        if (schema.isEmpty() || schema.length() > 2_000_000) throw new IllegalArgumentException("schema");
        identity.put(hash(schema));
        return hash(identity.toString());
    }

    private static String hash(String value) throws Exception {
        byte[] bytes = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
        StringBuilder out = new StringBuilder(64);
        for (byte b : bytes) out.append(String.format(java.util.Locale.ROOT, "%02x", b & 255));
        return out.toString();
    }

    static void validate(JSONArray fields, boolean acknowledgement) throws Exception {
        if (fields.length() > 4096 || fields.toString().length() > 4_000_000) throw new IllegalArgumentException("size");
        java.util.HashSet<String> seen = new java.util.HashSet<>();
        for (int i = 0; i < fields.length(); i++) {
            JSONObject field = fields.getJSONObject(i);
            String id = field.getString("field");
            long revision = field.getLong("revision");
            if (!id.matches("[A-Za-z0-9_.:-]{1,160}") || !seen.add(id) || revision < 1 || revision > 9_007_199_254_740_991L) throw new IllegalArgumentException("field");
            if (!acknowledgement && (!(field.get("data") instanceof JSONObject) || field.getJSONObject("data").toString().length() > 2_000_000)) throw new IllegalArgumentException("payload");
        }
    }

    static JSONObject run(SQLiteDatabase database, JSONObject request) throws Exception {
        String key = scope(request.getJSONObject("context"));
        String operation = request.getString("operation");
        if (!(operation.equals("open") || operation.equals("write") || operation.equals("ack") || operation.equals("discard"))) throw new IllegalArgumentException("operation");
        JSONArray fields = request.optJSONArray("fields");
        if (operation.equals("write") || operation.equals("ack")) { if (fields == null) throw new IllegalArgumentException("fields"); validate(fields, operation.equals("ack")); }
        JSONObject result = new JSONObject();
        database.beginTransaction();
        try {
            database.execSQL(FORMS); database.execSQL(FIELDS);
            database.execSQL("INSERT OR IGNORE INTO ui_form_drafts(scope,lease,updated_at) VALUES(?,0,?)", new Object[]{key, System.currentTimeMillis()});
            long lease;
            try (Cursor row = database.rawQuery("SELECT lease FROM ui_form_drafts WHERE scope=?", new String[]{key})) {
                if (!row.moveToFirst()) throw new IllegalStateException("missing");
                lease = row.getLong(0);
            }
            if (operation.equals("open")) {
                lease++;
                database.execSQL("UPDATE ui_form_drafts SET lease=?,updated_at=? WHERE scope=?", new Object[]{lease, System.currentTimeMillis(), key});
                JSONArray saved = new JSONArray(); long revision = 0;
                try (Cursor rows = database.rawQuery("SELECT field,revision,payload FROM ui_form_draft_fields WHERE scope=?", new String[]{key})) {
                    while (rows.moveToNext()) {
                        revision = Math.max(revision, rows.getLong(1));
                        if (!rows.isNull(2)) saved.put(new JSONObject().put("field", rows.getString(0)).put("revision", rows.getLong(1)).put("data", new JSONObject(rows.getString(2))));
                    }
                }
                result.put("lease", lease).put("revision", revision).put("fields", saved);
            } else if (request.getLong("lease") != lease) {
                // A newer page owns this form. Retired writes cannot resurrect it.
                result.put("retired", true);
            } else if (operation.equals("discard")) {
                database.execSQL("UPDATE ui_form_drafts SET lease=lease+1,updated_at=? WHERE scope=?", new Object[]{System.currentTimeMillis(), key});
                database.execSQL("DELETE FROM ui_form_draft_fields WHERE scope=?", new Object[]{key});
            } else {
                for (int i = 0; i < fields.length(); i++) {
                    JSONObject field = fields.getJSONObject(i); String id = field.getString("field"); long revision = field.getLong("revision");
                    if (operation.equals("ack")) {
                        // Keep the revision as a tombstone, so a delayed save cannot restore submitted data.
                        database.execSQL("UPDATE ui_form_draft_fields SET revision=?,payload=NULL WHERE scope=? AND field=? AND revision<=?", new Object[]{revision, key, id, revision});
                        database.execSQL("INSERT OR IGNORE INTO ui_form_draft_fields(scope,field,revision,payload) VALUES(?,?,?,NULL)", new Object[]{key, id, revision});
                    } else {
                        database.execSQL("INSERT OR IGNORE INTO ui_form_draft_fields(scope,field,revision,payload) VALUES(?,?,0,NULL)", new Object[]{key, id});
                        database.execSQL("UPDATE ui_form_draft_fields SET revision=?,payload=? WHERE scope=? AND field=? AND revision<?", new Object[]{revision, field.getJSONObject("data").toString(), key, id, revision});
                    }
                }
                database.execSQL("UPDATE ui_form_drafts SET updated_at=? WHERE scope=?", new Object[]{System.currentTimeMillis(), key});
            }
            database.setTransactionSuccessful(); return result;
        } finally { database.endTransaction(); }
    }
}
