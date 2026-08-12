package com.sky.atc.easyformse.trip.mapui;

import android.database.Cursor;

import com.sky.atc.easyformse.sqlitewraper;

import net.sqlcipher.database.SQLiteDatabase;

import org.json.JSONArray;
import org.json.JSONObject;

// Reads downloaded tasks straight from the local task_master table. SELECT
// only — this class must never write (PRD §2, "read-only data").
//
// This is what lets the map work from the Home screen: the JS cache hook only
// fills once a site list has been opened, so a user who taps Map first would
// otherwise see an empty map. The same rows the list pages read are available
// locally, so the map falls back to them rather than depending on a screen
// having been visited.
public final class OfflineTaskReader {

    private OfflineTaskReader() {
    }

    // Mirrors the list pages' own task_master query, including the table alias:
    // `long` is a bare column name there too, and qualifying it is what keeps
    // it unambiguous.
    private static final String SQL =
            "select tm.siteid, tm.site_name, tm.lat, tm.long, tm.status, tm.server_task_id, "
                    + "tm.survey_ms, tm.moduleid "
                    + "from task_master tm where tm.username = ? and tm.is_down_complete = 1 "
                    + "and tm.lat is not null and tm.lat <> '' and tm.lat <> '0' "
                    + "and tm.long is not null and tm.long <> '' and tm.long <> '0'";

    // Distinguishes "nothing downloaded yet" from "downloaded but no
    // coordinates" so the map's empty state can say which one it is instead
    // of one generic message covering both.
    public static class Diagnosis {
        public final int total;
        public final int downloaded;
        public final int withCoords;

        Diagnosis(int total, int downloaded, int withCoords) {
            this.total = total;
            this.downloaded = downloaded;
            this.withCoords = withCoords;
        }
    }

    private static final String DIAGNOSE_SQL =
            "select count(*) as total, "
                    + "sum(case when is_down_complete = 1 then 1 else 0 end) as downloaded, "
                    + "sum(case when is_down_complete = 1 and lat is not null and lat <> '' "
                    + "and lat <> '0' and long is not null and long <> '' and long <> '0' "
                    + "then 1 else 0 end) as with_coords "
                    + "from task_master where username = ?";

    // Only called on an empty result, so this is one extra cheap aggregate
    // query, not a cost paid on every map open.
    public static Diagnosis diagnose(String username) {
        if (username == null || username.length() == 0) {
            return new Diagnosis(0, 0, 0);
        }
        Cursor c = null;
        try {
            SQLiteDatabase database = sqlitewraper.getDatabase();
            if (database == null) {
                return new Diagnosis(0, 0, 0);
            }
            c = database.rawQuery(DIAGNOSE_SQL, new String[]{username});
            if (c.moveToFirst()) {
                // SUM() over zero matching rows is SQL NULL; Android's cursor
                // reports that as 0 for getInt(), which is the right fallback
                // here too.
                return new Diagnosis(c.getInt(0), c.getInt(1), c.getInt(2));
            }
            return new Diagnosis(0, 0, 0);
        } catch (Exception e) {
            return new Diagnosis(0, 0, 0);
        } finally {
            if (c != null) {
                try {
                    c.close();
                } catch (Exception ignored) {
                }
            }
        }
    }

    public static JSONArray read(String username) {
        JSONArray out = new JSONArray();
        if (username == null || username.length() == 0) {
            return out;
        }
        Cursor c = null;
        try {
            SQLiteDatabase database = sqlitewraper.getDatabase();
            if (database == null) {
                return out;
            }
            c = database.rawQuery(SQL, new String[]{username});
            while (c.moveToNext()) {
                JSONObject row = new JSONObject();
                // Keys match the plugin payload shape the JS layer sends, so
                // MapSite.fromJson stays the single parser for both sources.
                row.put("site_id", c.getString(0));
                row.put("site_name", c.getString(1));
                row.put("lat", c.getString(2));
                row.put("lon", c.getString(3));
                row.put("status", c.getString(4));
                row.put("server_task_id", c.getString(5));
                row.put("survey_ms", c.getString(6));
                row.put("cluster_id", c.getString(7));
                out.put(row);
            }
        } catch (Exception e) {
            // A missing table or schema drift must not take the map down; the
            // caller simply gets no offline rows.
            return out;
        } finally {
            if (c != null) {
                try {
                    c.close();
                } catch (Exception ignored) {
                }
            }
        }
        return out;
    }
}
