package com.sky.atc.easyformse.trip.engine;

import android.content.ContentValues;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

import net.sqlcipher.database.SQLiteDatabase;

/**
 * Events that happened while not driving (walking, declared passenger, off trip). They are not
 * reported as violations, but kept on the phone so the rule can be reviewed. Not uploaded.
 */
@StringFogIgnore
public final class HeldEventStore {

    private HeldEventStore() {
    }

    public static void hold(SQLiteDatabase db, String eventType, DrivingContext.Context context,
                            String tid, long startMs, long endMs, String details) {
        ContentValues v = new ContentValues();
        v.put("event_type", eventType);
        v.put("context", DrivingContext.label(context));
        v.put("tid", tid);
        v.put("start_ms", startMs);
        v.put("end_ms", endMs);
        v.put("details", details);
        EngineTables.append(db, "held_events", "CREATE TABLE IF NOT EXISTS held_events ("
                + "_id INTEGER PRIMARY KEY AUTOINCREMENT, event_type TEXT, context TEXT, tid TEXT, "
                + "start_ms INTEGER, end_ms INTEGER, details TEXT)", v, 5_000);
    }
}
