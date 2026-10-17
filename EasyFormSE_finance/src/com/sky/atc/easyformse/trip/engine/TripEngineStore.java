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
    private static final String TABLE = "trip_engine_state";
    private static final String DDL = "CREATE TABLE IF NOT EXISTS trip_engine_state ("
            + "tid TEXT PRIMARY KEY, distance_m REAL NOT NULL DEFAULT 0, "
            + "gaps INTEGER NOT NULL DEFAULT 0, updated_ms INTEGER NOT NULL DEFAULT 0, "
            + "degraded_m REAL NOT NULL DEFAULT 0)";
    // Tables made by the first version have no degraded_m column.
    private static final String ADD_DEGRADED = "ALTER TABLE trip_engine_state ADD COLUMN degraded_m REAL NOT NULL DEFAULT 0";

    private TripEngineStore() {
    }

    /** {distance, of which weak-GPS} in metres for a trip; zeros when there is none. */
    public static double[] load(SQLiteDatabase db, String tid) {
        double[] out = {0.0, 0.0};
        if (db == null || tid == null) return out;
        Cursor c = null;
        try {
            EngineTables.ensure(db, TABLE, DDL, ADD_DEGRADED);
            c = db.rawQuery("select distance_m, degraded_m from trip_engine_state where tid = ?", new String[]{tid});
            if (c.moveToFirst()) {
                out[0] = c.getDouble(0);
                out[1] = c.getDouble(1);
            }
        } catch (Exception e) {
            Log.e(TAG, "load failed", e);
        } finally {
            if (c != null) c.close();
        }
        return out;
    }

    /**
     * @param degradedMeters part of {@code meters} measured from weaker fixes (forest, deep
     *                       valleys), so it can be reported separately
     */
    public static void saveDistance(SQLiteDatabase db, String tid, double meters, int gaps, double degradedMeters) {
        if (db == null || tid == null) return;
        try {
            EngineTables.ensure(db, TABLE, DDL, ADD_DEGRADED);
            ContentValues v = new ContentValues();
            v.put("tid", tid);
            v.put("distance_m", meters);
            v.put("gaps", gaps);
            v.put("degraded_m", Math.round(degradedMeters * 10) / 10.0);
            v.put("updated_ms", System.currentTimeMillis());
            db.insertWithOnConflict(TABLE, null, v, SQLiteDatabase.CONFLICT_REPLACE);
        } catch (Exception e) {
            Log.e(TAG, "save failed", e);
        }
    }
}
