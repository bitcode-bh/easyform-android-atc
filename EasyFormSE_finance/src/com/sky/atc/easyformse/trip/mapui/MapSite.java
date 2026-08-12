package com.sky.atc.easyformse.trip.mapui;

import org.json.JSONObject;

// Normalized site marker. See PRD §9.1.
public class MapSite {

    public final String siteId;
    public final String siteName;
    public final double lat;
    public final double lon;
    public final String status;
    public final String serverTaskId;

    // Set by MapSiteLoader for distance-ranked profiles; negative = not computed.
    public double distanceM = -1;

    public String clusterId = "";
    // Epoch ms for the survey date; 0 means the listing did not supply one.
    public long surveyMs;
    // Informational only — lets the detail sheet say which module a site
    // belongs to. "" means unknown (e.g. geofence_tracking has no module
    // concept at all); never guessed from another field.
    public String moduleId = "";
    public String moduleName = "";

    private MapSite(String siteId, String siteName, double lat, double lon, String status, String serverTaskId) {
        this.siteId = siteId;
        this.siteName = siteName;
        this.lat = lat;
        this.lon = lon;
        this.status = status;
        this.serverTaskId = serverTaskId;
    }

    // Returns null for a row without usable coordinates; the JS normalizer
    // already filters these, so this is the boundary check for the payload.
    public static MapSite fromJson(JSONObject json) {
        if (json == null) {
            return null;
        }
        double lat = json.optDouble("lat", Double.NaN);
        double lon = json.optDouble("lon", Double.NaN);
        if (Double.isNaN(lat) || Double.isNaN(lon)) {
            return null;
        }
        if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
            return null;
        }
        MapSite site = new MapSite(
                json.optString("site_id", ""),
                json.optString("site_name", ""),
                lat,
                lon,
                json.optString("status", ""),
                json.optString("server_task_id", ""));
        site.clusterId = json.optString("cluster_id", "");
        site.moduleId = json.optString("module_id", "");
        site.moduleName = json.optString("module_name", "");
        site.surveyMs = parseMillis(json.opt("survey_ms"));
        return site;
    }

    // The app's own listing convention (viewsitelist_pm.js: `task_status == 2`
    // greys the row out): status 2 is the completed/submitted state, anything
    // else is still outstanding. Unknown/blank status is treated as NOT
    // completed — a site whose state we cannot read should not be shown as
    // done.
    public boolean isCompleted() {
        return "2".equals(status == null ? "" : status.trim());
    }

    // The field arrives as a number or a numeric string depending on the
    // listing. Anything unparseable stays 0, meaning "date unknown".
    private static long parseMillis(Object value) {
        if (value == null) {
            return 0L;
        }
        if (value instanceof Number) {
            return ((Number) value).longValue();
        }
        try {
            return Long.parseLong(String.valueOf(value).trim());
        } catch (NumberFormatException e) {
            return 0L;
        }
    }
}
