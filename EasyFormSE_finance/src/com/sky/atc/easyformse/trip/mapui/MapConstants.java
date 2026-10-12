package com.sky.atc.easyformse.trip.mapui;

import android.graphics.Color;

// Universal Trip & Site Map — shared constants.
// See docs/PRD-Trip-Site-Map-v2.md
public final class MapConstants {

    private MapConstants() {
    }

    public static final String EXTRA_PROFILE = "trip_map_profile";
    public static final String EXTRA_SITES = "trip_map_sites";
    public static final String EXTRA_CLUSTER_VALUE = "trip_map_cluster_value";
    public static final String EXTRA_FROM_GEOFENCE = "trip_map_from_geofence";
    public static final String EXTRA_PATH_MIN_MS = "trip_map_path_min_ms";
    public static final String EXTRA_PATH_MAX_MS = "trip_map_path_max_ms";
    public static final String EXTRA_ROUTE_OVERLAY = "trip_map_route_overlay";
    public static final String EXTRA_ROUTE_TITLE = "trip_map_route_title";
    // Optional: the path itself, as a JSON array of [lat, lon, tripflag], for a
    // trip downloaded from the server that has no rows in track_master.
    public static final String EXTRA_PATH_POINTS = "trip_map_path_points";

    // Emitted by the existing engine (LocationOutageUtils); this module only listens.
    public static final String ACTION_TRIP_LOCATION = "trip-background-map";
    public static final String EXTRA_BROADCAST_LAT = "lat";
    public static final String EXTRA_BROADCAST_LON = "long";

    // §10 — path poll interval, deliberately slow; no GPS client of our own.
    public static final long PATH_POLL_MS = 45000L;

    // track_master.tripflag values written by the engine.
    public static final String TRIPFLAG_FUSED = "2";
    public static final String TRIPFLAG_VIOLATION = "3";

    public static final int COLOR_COVERED = Color.parseColor("#2E7D32");
    public static final int COLOR_VIOLATION = Color.parseColor("#D84315");
    public static final int COLOR_PLANNED = Color.parseColor("#1565C0");
    public static final int COLOR_RADIUS_STROKE = Color.parseColor("#66215BA8");
    public static final int COLOR_RADIUS_FILL = Color.parseColor("#14215BA8");

    public static final float SITE_ZOOM = 12.0f;
}
