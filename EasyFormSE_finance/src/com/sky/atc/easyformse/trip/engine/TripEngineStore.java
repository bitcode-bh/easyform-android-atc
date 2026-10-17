package com.sky.atc.easyformse.trip.engine;

import android.content.ContentValues;
import android.util.Log;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

import net.sqlcipher.Cursor;
import net.sqlcipher.database.SQLiteDatabase;

/**
 * Keeps the measured distance of each trip on the phone, so it survives a service restart and the
 * Home trip card can show it. A table of its own, so nothing that uploads lat_plug changes.
 */
@StringFogIgnore
public final class TripEngineStore {

    private static final String TAG = "TRIP_ENGINE";
    private static boolean tableReady = false;

    private TripEngineStore() {
    }

    private static void ensureTable(SQLiteDatabase db) {
        if (tableReady) return;
        db.execSQL("CREATE TABLE IF NOT EXISTS trip_engine_state ("
                + "tid TEXT PRIMARY KEY, distance_m REAL NOT NULL DEFAULT 0, "
                + "gaps INTEGER NOT NULL DEFAULT 0, updated_ms INTEGER NOT NULL DEFAULT 0, "
                + "degraded_m REAL NOT NULL DEFAULT 0)");
        try {
            // Tables made by the first version have no degraded_m column.
            db.execSQL("ALTER TABLE trip_engine_state ADD COLUMN degraded_m REAL NOT NULL DEFAULT 0");
        } catch (Exception ignored) {
            // already there
        }
        tableReady = true;
    }

    /** Saved part of the distance measured from weaker fixes, in metres. */
    public static double loadDegraded(SQLiteDatabase db, String tid) {
        if (db == null || tid == null) return 0.0;
        Cursor c = null;
        try {
            ensureTable(db);
            c = db.rawQuery("select degraded_m from trip_engine_state where tid = ?", new String[]{tid});
            return c.moveToFirst() ? c.getDouble(0) : 0.0;
        } catch (Exception e) {
            return 0.0;
        } finally {
            if (c != null) c.close();
        }
    }

    /** Saved distance for a trip in metres, or 0 when there is none. */
    public static double loadDistance(SQLiteDatabase db, String tid) {
        if (db == null || tid == null) return 0.0;
        Cursor c = null;
        try {
            ensureTable(db);
            c = db.rawQuery("select distance_m from trip_engine_state where tid = ?", new String[]{tid});
            return c.moveToFirst() ? c.getDouble(0) : 0.0;
        } catch (Exception e) {
            Log.e(TAG, "load failed", e);
            return 0.0;
        } finally {
            if (c != null) c.close();
        }
    }

    /**
     * @param degradedMeters part of {@code meters} measured from weaker fixes (forest, deep
     *                       valleys), so it can be reported separately
     */
    public static void saveDistance(SQLiteDatabase db, String tid, double meters, int gaps, double degradedMeters) {
        if (db == null || tid == null) return;
        try {
            ensureTable(db);
            ContentValues v = new ContentValues();
            v.put("tid", tid);
            v.put("distance_m", meters);
            v.put("gaps", gaps);
            v.put("degraded_m", Math.round(degradedMeters * 10) / 10.0);
            v.put("updated_ms", System.currentTimeMillis());
            db.insertWithOnConflict("trip_engine_state", null, v, SQLiteDatabase.CONFLICT_REPLACE);
        } catch (Exception e) {
            Log.e(TAG, "save failed", e);
        }
    }
}
