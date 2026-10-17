package com.sky.atc.easyformse.trip.engine;

import android.content.ContentValues;
import android.util.Log;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

import net.sqlcipher.database.SQLiteDatabase;

/**
 * Events that happened while not driving (walking, declared passenger, off trip). They are not
 * reported as violations, but kept on the phone so the rule can be reviewed. Not uploaded.
 */
@StringFogIgnore
public final class HeldEventStore {

    private static final String TAG = "TRIP_ENGINE";
    private static final int MAX_ROWS = 5_000;
    private static boolean tableReady = false;

    private HeldEventStore() {
    }

    private static void ensureTable(SQLiteDatabase db) {
        if (tableReady) return;
        db.execSQL("CREATE TABLE IF NOT EXISTS held_events ("
                + "_id INTEGER PRIMARY KEY AUTOINCREMENT, event_type TEXT, context TEXT, tid TEXT, "
                + "start_ms INTEGER, end_ms INTEGER, details TEXT)");
        tableReady = true;
    }

    public static void hold(SQLiteDatabase db, String eventType, DrivingContext.Context context,
                            String tid, long startMs, long endMs, String details) {
        if (db == null) return;
        try {
            ensureTable(db);
            ContentValues v = new ContentValues();
            v.put("event_type", eventType);
            v.put("context", DrivingContext.label(context));
            v.put("tid", tid);
            v.put("start_ms", startMs);
            v.put("end_ms", endMs);
            v.put("details", details);
            long id = db.insert("held_events", null, v);
            if (id > MAX_ROWS && id % 500 == 0) {
                db.execSQL("delete from held_events where _id <= " + (id - MAX_ROWS));
            }
            Log.d(TAG, "Held " + eventType + " (" + DrivingContext.label(context) + ")");
        } catch (Exception e) {
            Log.e(TAG, "hold failed", e);
        }
    }
}
