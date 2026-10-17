package com.sky.atc.easyformse.trip.engine;

import android.content.ContentValues;
import android.util.Log;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

import net.sqlcipher.database.SQLiteDatabase;

import java.util.HashSet;
import java.util.Set;

/**
 * The trip engine's own tables (kept on the phone, never uploaded): each is created on first use
 * and, for logs, trimmed to its newest rows.
 */
@StringFogIgnore
public final class EngineTables {

    private static final String TAG = "TRIP_ENGINE";
    private static final Set<String> ready = new HashSet<>();

    private EngineTables() {
    }

    /** Runs {@code ddl} (and any follow-up statements, which may fail harmlessly) once per process. */
    static synchronized void ensure(SQLiteDatabase db, String table, String ddl, String... upgrades) {
        if (ready.contains(table)) return;
        db.execSQL(ddl);
        for (String u : upgrades) {
            try {
                db.execSQL(u);
            } catch (Exception ignored) {
                // already applied
            }
        }
        ready.add(table);
    }

    /** Creates the table if needed, inserts a row, and keeps only the newest {@code maxRows}. */
    public static void append(SQLiteDatabase db, String table, String ddl, ContentValues v, int maxRows) {
        if (db == null) return;
        try {
            ensure(db, table, ddl);
            long id = db.insert(table, null, v);
            if (id > maxRows && id % 500 == 0) {
                db.execSQL("delete from " + table + " where _id <= " + (id - maxRows));
            }
        } catch (Exception e) {
            Log.e(TAG, table + " insert failed", e);
        }
    }
}
