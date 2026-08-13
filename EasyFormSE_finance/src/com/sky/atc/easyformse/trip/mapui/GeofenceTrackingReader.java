package com.sky.atc.easyformse.trip.mapui;

import android.database.Cursor;

import com.sky.atc.easyformse.sqlitewraper;

import net.sqlcipher.database.SQLiteDatabase;

import org.json.JSONArray;
import org.json.JSONObject;

// Reads the geofences already downloaded to this device for IN/OUT tracking.
// SELECT only — this class must never write (PRD §2, "read-only data").
//
// PRD-designated source for the GEOFENCE_DOWNLOAD profile (§4.2, §11: "Map
// may read geofence_tracking for GEOFENCE_DOWNLOAD profile only") — and now
// the map's only native data source for every profile type, replacing the
// earlier task_master-first fallback chain (see TripTrackingMapPlugin). That
// chain was unusable in practice: task_master fills only once tasks are
// downloaded and was repeatedly found empty on real accounts, while this
// table — populated by its own download step (GeofenceDownlodService), not
// gated on a task list ever being opened — reliably held data.
public final class GeofenceTrackingReader {

    private GeofenceTrackingReader() {
    }

    // No username column exists on this table — whatever is downloaded here
    // already belongs to the current session on this device.
    //
    // Excludes latitude=21/longitude=61 unconditionally: a confirmed sentinel
    // placeholder found live on a real account (2266 of 3848 rows on one
    // test device shared this exact pair, radius=0). Plotting it as-is would
    // stack thousands of markers on one ocean point off Oman.
    private static final String SQL =
            "select place_id, latitude, longitude "
                    + "from geofence_tracking "
                    + "where latitude is not null and latitude <> '' and latitude <> '0' "
                    + "and longitude is not null and longitude <> '' and longitude <> '0' "
                    + "and not (latitude = '21' and longitude = '61')";

    public static JSONArray read() {
        JSONArray out = new JSONArray();
        Cursor c = null;
        try {
            SQLiteDatabase database = sqlitewraper.getDatabase();
            if (database == null) {
                return out;
            }
            c = database.rawQuery(SQL, null);
            while (c.moveToNext()) {
                String placeId = c.getString(0);
                JSONObject row = new JSONObject();
                row.put("site_id", placeId);
                // No name is stored locally against a geofence row — the id
                // is real and shown honestly rather than inventing a label.
                row.put("site_name", "Site " + placeId);
                row.put("lat", c.getString(1));
                row.put("lon", c.getString(2));
                out.put(row);
            }
        } catch (Exception e) {
            // A missing table or schema drift must not take the map down;
            // the caller simply gets no geofence rows.
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
