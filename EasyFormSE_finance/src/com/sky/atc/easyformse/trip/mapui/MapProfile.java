package com.sky.atc.easyformse.trip.mapui;

import org.json.JSONObject;

// Resolved map profile as delivered by the JS layer. See PRD §4.2.
public class MapProfile {

    public static final String TYPE_ASSIGNED_LIST = "ASSIGNED_LIST";
    public static final String TYPE_NEARBY_RADIUS = "NEARBY_RADIUS";
    public static final String TYPE_ASSIGNED_CLUSTER = "ASSIGNED_CLUSTER";
    public static final String TYPE_ASSIGNED_CLUSTER_TODAY = "ASSIGNED_CLUSTER_TODAY";
    public static final String TYPE_GEOFENCE_DOWNLOAD = "GEOFENCE_DOWNLOAD";
    public static final String TYPE_DATE_RANGE = "DATE_RANGE";

    public final String type;
    public final int limit;
    public final boolean markerCluster;
    public final double radiusKm;
    // Epoch ms bounds for DATE_RANGE, [startMs, endMs) — same representation
    // as MapSite.surveyMs, so no date-string parsing/timezone ambiguity is
    // introduced. 0 means not configured.
    public final long startMs;
    public final long endMs;

    private MapProfile(String type, int limit, boolean markerCluster, double radiusKm,
                       long startMs, long endMs) {
        this.type = type;
        this.limit = limit;
        this.markerCluster = markerCluster;
        this.radiusKm = radiusKm;
        this.startMs = startMs;
        this.endMs = endMs;
    }

    public boolean isCluster() {
        return TYPE_ASSIGNED_CLUSTER.equals(type) || TYPE_ASSIGNED_CLUSTER_TODAY.equals(type);
    }

    public static MapProfile fromJson(JSONObject json) {
        if (json == null) {
            return null;
        }
        String type = json.optString("type", "");
        if (type.length() == 0) {
            return null;
        }
        int limit = json.optInt("site_limit", json.optInt("limit", 100));
        // show_radius_circle is intentionally not read: the range is now a
        // user-facing control on the map, and the circle is how the active
        // range is shown, so it is drawn whenever a range is applied.
        return new MapProfile(
                type,
                limit,
                json.optBoolean("marker_cluster", false),
                json.optDouble("radius_km", 0),
                json.optLong("start_date", 0),
                json.optLong("end_date", 0));
    }

    public boolean hasRadius() {
        return radiusKm > 0;
    }

    // Both bounds must be present and ordered — a half-configured range is
    // treated the same as no range (filter skipped, not silently misapplied).
    public boolean hasDateRange() {
        return startMs > 0 && endMs > 0 && endMs > startMs;
    }
}
