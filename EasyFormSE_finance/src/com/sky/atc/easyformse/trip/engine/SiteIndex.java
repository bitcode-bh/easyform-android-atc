package com.sky.atc.easyformse.trip.engine;

import android.content.ContentValues;
import android.util.Log;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

import net.sqlcipher.Cursor;
import net.sqlcipher.database.SQLiteDatabase;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * The user's sites (geofence_tracking) for telling when they are on site, plus the store for
 * finished motion segments (motion_segments, kept on the phone).
 */
@StringFogIgnore
public final class SiteIndex {

    private static final String TAG = "TRIP_ENGINE";
    private static final long RELOAD_MS = 15 * 60_000L;
    /** Used when neither the site nor its flow gives a radius. */
    private static final float DEFAULT_RADIUS_M = 100f;
    /** Inside once within radius plus this much of the fix's accuracy; stays inside with more. */
    private static final float ENTER_ACC_ALLOWANCE_M = 25f;
    private static final float STAY_ACC_ALLOWANCE_M = 50f;
    private static final float STAY_MARGIN_M = 20f;

    private static final class Site {
        final String id;
        final double lat, lng;
        final float radius;
        Site(String id, double lat, double lng, float radius) {
            this.id = id; this.lat = lat; this.lng = lng; this.radius = radius;
        }
    }

    private final List<Site> sites = new ArrayList<>();
    private long loadedMs = 0L;
    private String currentSite;
    private static boolean segmentTableReady = false;

    /** The site the user is inside now, or null. */
    public String siteAt(SQLiteDatabase db, double lat, double lng, float accuracyM, long nowMs) {
        if (nowMs - loadedMs > RELOAD_MS) load(db, nowMs);
        float acc = accuracyM > 0 ? accuracyM : 50f;
        Site best = null;
        double bestD = Double.MAX_VALUE;
        Site stay = null;
        for (Site s : sites) {
            double d = TripDistanceMeter.haversine(lat, lng, s.lat, s.lng);
            if (s.id.equals(currentSite) && d <= s.radius + Math.min(acc, STAY_ACC_ALLOWANCE_M) + STAY_MARGIN_M) {
                stay = s;
            }
            if (d <= s.radius + Math.min(acc, ENTER_ACC_ALLOWANCE_M) && d < bestD) {
                best = s;
                bestD = d;
            }
        }
        Site at = stay != null ? stay : best;
        currentSite = at == null ? null : at.id;
        return currentSite;
    }

    private void load(SQLiteDatabase db, long nowMs) {
        loadedMs = nowMs;
        sites.clear();
        if (db == null) return;
        Map<String, Float> flowRadius = new HashMap<>();
        Cursor c = null;
        try {
            c = db.rawQuery("select place_id, latitude, longitude, radius, flow_id from geofence_tracking "
                    + "where latitude is not null and latitude <> '' and latitude <> '0' "
                    + "and longitude is not null and longitude <> '' and longitude <> '0' "
                    + "and not (latitude = '21' and longitude = '61')", null);
            for (c.moveToFirst(); !c.isAfterLast(); c.moveToNext()) {
                try {
                    String id = c.getString(0);
                    double lat = Double.parseDouble(c.getString(1));
                    double lng = Double.parseDouble(c.getString(2));
                    float r = 0f;
                    try { r = Float.parseFloat(c.getString(3)); } catch (Exception ignored) { }
                    if (r <= 0) {
                        String flow = c.getString(4);
                        Float fr = flowRadius.get(flow);
                        if (fr == null) {
                            fr = flowRadius(db, flow);
                            flowRadius.put(flow, fr);
                        }
                        r = fr;
                    }
                    if (id != null) sites.add(new Site(id, lat, lng, r > 0 ? r : DEFAULT_RADIUS_M));
                } catch (Exception ignored) {
                    // One bad row must not drop the rest.
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "site load failed", e);
        } finally {
            if (c != null) c.close();
        }
    }

    // Same lookup as GeoFenceDraw.getRadiusfromFlowmaster(): data -> geotracking[0].radius.
    private static float flowRadius(SQLiteDatabase db, String flowId) {
        Cursor c = null;
        try {
            c = db.rawQuery("select data from User_Define_Flow_Master where id = ?", new String[]{flowId});
            if (c.moveToFirst()) {
                JSONObject first = new JSONArray(c.getString(0)).getJSONObject(0);
                JSONArray geo = new JSONArray(first.getString("geotracking"));
                return (float) geo.getJSONObject(0).getInt("radius");
            }
        } catch (Exception ignored) {
        } finally {
            if (c != null) c.close();
        }
        return 0f;
    }

    /** Saves a finished motion segment on the phone. */
    public static void saveSegment(SQLiteDatabase db, String tid, MotionTimeline.Segment s) {
        if (db == null || s == null || s.endMs <= s.startMs) return;
        try {
            if (!segmentTableReady) {
                db.execSQL("CREATE TABLE IF NOT EXISTS motion_segments ("
                        + "_id INTEGER PRIMARY KEY AUTOINCREMENT, tid TEXT, state TEXT, start_ms INTEGER, "
                        + "end_ms INTEGER, site_id TEXT, meters REAL, max_kmh REAL)");
                segmentTableReady = true;
            }
            ContentValues v = new ContentValues();
            v.put("tid", tid);
            v.put("state", MotionTimeline.label(s.state));
            v.put("start_ms", s.startMs);
            v.put("end_ms", s.endMs);
            v.put("site_id", s.siteId);
            v.put("meters", Math.round(s.meters * 10) / 10.0);
            v.put("max_kmh", Math.round(s.maxKmh * 10) / 10.0);
            long id = db.insert("motion_segments", null, v);
            if (id > 20_000 && id % 500 == 0) {
                db.execSQL("delete from motion_segments where _id <= " + (id - 20_000));
            }
        } catch (Exception e) {
            Log.e(TAG, "segment save failed", e);
        }
    }
}
