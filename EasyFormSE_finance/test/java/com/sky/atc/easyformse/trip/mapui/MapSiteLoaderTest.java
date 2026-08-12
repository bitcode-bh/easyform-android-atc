package com.sky.atc.easyformse.trip.mapui;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import com.google.android.gms.maps.model.LatLng;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.junit.Test;

import java.util.Calendar;
import java.util.List;

// Plain JVM unit tests (see EasyFormSE_finance/build.gradle testOptions —
// unitTests.returnDefaultValues makes android.location.Location.distanceBetween()
// a no-op instead of throwing). That no-op leaves every MapSite.distanceM at 0
// after measure(), so these tests verify the boolean/structural plumbing
// (radiusApplied, sortedByDistance, effectiveRadiusKm, filter counts) rather
// than real near/far distance filtering, which would need Robolectric or a
// mocked Location — not worth adding for this module's actual bug surface,
// which has all been in that plumbing, not in the distance math itself.
public class MapSiteLoaderTest {

    private static final LatLng USER = new LatLng(28.6, 77.2);

    private static JSONObject site(String id, double lat, double lon) throws JSONException {
        return site(id, lat, lon, "", 0L);
    }

    private static JSONObject site(String id, double lat, double lon, String clusterId, long surveyMs)
            throws JSONException {
        JSONObject o = new JSONObject();
        o.put("site_id", id);
        o.put("site_name", "Site " + id);
        o.put("lat", lat);
        o.put("lon", lon);
        if (clusterId.length() > 0) {
            o.put("cluster_id", clusterId);
        }
        if (surveyMs > 0) {
            o.put("survey_ms", surveyMs);
        }
        return o;
    }

    private static JSONArray sites(JSONObject... rows) throws JSONException {
        JSONArray a = new JSONArray();
        for (JSONObject row : rows) {
            a.put(row);
        }
        return a;
    }

    private static MapProfile profile(String json) throws JSONException {
        return MapProfile.fromJson(new JSONObject(json));
    }

    private static long todayMs() {
        Calendar c = Calendar.getInstance();
        c.set(Calendar.HOUR_OF_DAY, 12);
        return c.getTimeInMillis();
    }

    private static long daysAgoMs(int days) {
        Calendar c = Calendar.getInstance();
        c.set(Calendar.HOUR_OF_DAY, 12);
        c.add(Calendar.DAY_OF_YEAR, -days);
        return c.getTimeInMillis();
    }

    // --- null / empty inputs -------------------------------------------------

    @Test
    public void nullProfile_returnsEmptyNotNullResult() throws Exception {
        MapSiteLoader.Result result = MapSiteLoader.load(
                null, sites(site("1", 1, 1)), USER, null, null);
        assertNotNull(result.sites);
        assertTrue(result.sites.isEmpty());
        assertFalse(result.radiusApplied);
    }

    @Test
    public void emptyPayload_returnsEmptySites() throws Exception {
        MapProfile p = profile("{\"type\":\"ASSIGNED_LIST\"}");
        MapSiteLoader.Result result = MapSiteLoader.load(p, new JSONArray(), USER, null, null);
        assertTrue(result.sites.isEmpty());
        assertEquals(0, result.matchedBeforeLimit);
    }

    // --- ASSIGNED_LIST: no reordering, matches the pre-chip "showing" case ---

    @Test
    public void assignedList_defaultRange_isNotSortedByDistance() throws Exception {
        // This is the exact case the header used to mislabel "(nearest N of M)"
        // before sortedByDistance was tracked — ASSIGNED_LIST with no range
        // chip picked must never claim a distance sort happened.
        MapProfile p = profile("{\"type\":\"ASSIGNED_LIST\",\"limit\":100}");
        MapSiteLoader.Result result = MapSiteLoader.load(
                p, sites(site("1", 1, 1), site("2", 2, 2)), USER, null, null);
        assertFalse(result.sortedByDistance);
        assertFalse(result.radiusApplied);
        assertNull(result.effectiveRadiusKm);
    }

    @Test
    public void assignedList_limitTruncatesAfterCountingMatches() throws Exception {
        MapProfile p = profile("{\"type\":\"ASSIGNED_LIST\",\"limit\":2}");
        MapSiteLoader.Result result = MapSiteLoader.load(
                p, sites(site("1", 1, 1), site("2", 2, 2), site("3", 3, 3)), null, null, null);
        assertEquals(3, result.matchedBeforeLimit);
        assertEquals(2, result.sites.size());
    }

    // --- NEARBY_RADIUS / GEOFENCE_DOWNLOAD: defaultRadiusKm() -----------------
    // The bug: onMapReady() used to duplicate this logic inline and only
    // recognised NEARBY_RADIUS, so a configured GEOFENCE_DOWNLOAD radius_km
    // silently never applied. defaultRadiusKm() is now the single definition.

    @Test
    public void defaultRadiusKm_nearbyRadius_returnsConfiguredValue() throws Exception {
        MapProfile p = profile("{\"type\":\"NEARBY_RADIUS\",\"radius_km\":50}");
        assertEquals(Double.valueOf(50), MapSiteLoader.defaultRadiusKm(p));
    }

    @Test
    public void defaultRadiusKm_geofenceDownload_returnsConfiguredValue() throws Exception {
        MapProfile p = profile("{\"type\":\"GEOFENCE_DOWNLOAD\",\"radius_km\":50}");
        assertEquals(Double.valueOf(50), MapSiteLoader.defaultRadiusKm(p));
    }

    @Test
    public void defaultRadiusKm_nonRadiusBearingType_isNullEvenIfRadiusKmSet() throws Exception {
        // ASSIGNED_LIST has no inherent radius concept — a stray radius_km in
        // its config must not leak into a default.
        MapProfile p = profile("{\"type\":\"ASSIGNED_LIST\",\"radius_km\":50}");
        assertNull(MapSiteLoader.defaultRadiusKm(p));
    }

    @Test
    public void defaultRadiusKm_nullProfile_isNull() {
        assertNull(MapSiteLoader.defaultRadiusKm(null));
    }

    @Test
    public void radiusOverride_setsAppliedFlagsAndEffectiveRadius() throws Exception {
        MapProfile p = profile("{\"type\":\"NEARBY_RADIUS\"}");
        MapSiteLoader.Result result = MapSiteLoader.load(
                p, sites(site("1", 1, 1)), USER, null, 50d);
        assertTrue(result.radiusApplied);
        assertTrue(result.sortedByDistance);
        assertEquals(Double.valueOf(50), result.effectiveRadiusKm);
    }

    @Test
    public void radiusOverride_null_meansAllNoCapRegardlessOfProfileType() throws Exception {
        // "All" selected on the range chips: even a NEARBY_RADIUS profile must
        // not silently re-apply its own configured default here — the caller
        // (the activity) is the one that decides whether to seed the initial
        // radiusOverrideKm from defaultRadiusKm(); load() itself never does.
        MapProfile p = profile("{\"type\":\"NEARBY_RADIUS\",\"radius_km\":50}");
        MapSiteLoader.Result result = MapSiteLoader.load(
                p, sites(site("1", 1, 1)), USER, null, null);
        assertFalse(result.radiusApplied);
        assertFalse(result.sortedByDistance);
        assertNull(result.effectiveRadiusKm);
    }

    @Test
    public void radiusOverride_withoutKnownPosition_notApplied() throws Exception {
        MapProfile p = profile("{\"type\":\"NEARBY_RADIUS\"}");
        MapSiteLoader.Result result = MapSiteLoader.load(
                p, sites(site("1", 1, 1)), null, null, 50d);
        assertFalse(result.radiusApplied);
    }

    // --- ASSIGNED_CLUSTER ------------------------------------------------------

    @Test
    public void cluster_filtersToMatchingValueOnly() throws Exception {
        MapProfile p = profile("{\"type\":\"ASSIGNED_CLUSTER\"}");
        MapSiteLoader.Result result = MapSiteLoader.load(
                p,
                sites(site("1", 1, 1, "A", 0), site("2", 2, 2, "B", 0)),
                null, "A", null);
        assertTrue(result.clusterApplied);
        assertEquals(1, result.sites.size());
        assertEquals("1", result.sites.get(0).siteId);
    }

    @Test
    public void cluster_unknownValue_showsEverythingRatherThanNothing() throws Exception {
        MapProfile p = profile("{\"type\":\"ASSIGNED_CLUSTER\"}");
        MapSiteLoader.Result result = MapSiteLoader.load(
                p,
                sites(site("1", 1, 1, "A", 0), site("2", 2, 2, "B", 0)),
                null, null, null);
        assertFalse(result.clusterApplied);
        assertEquals(2, result.sites.size());
    }

    @Test
    public void cluster_withKnownPosition_isSortedByDistanceByDefault() throws Exception {
        // Unlike ASSIGNED_LIST, cluster profiles have always sorted
        // nearest-first once a position is known, even with no range picked.
        MapProfile p = profile("{\"type\":\"ASSIGNED_CLUSTER\"}");
        MapSiteLoader.Result result = MapSiteLoader.load(
                p, sites(site("1", 1, 1, "A", 0)), USER, "A", null);
        assertTrue(result.sortedByDistance);
        // But no cap was requested, so no radius filter/label applies.
        assertFalse(result.radiusApplied);
    }

    // --- ASSIGNED_CLUSTER_TODAY --------------------------------------------

    @Test
    public void clusterToday_keepsOnlyTodaysSurveyDate() throws Exception {
        MapProfile p = profile("{\"type\":\"ASSIGNED_CLUSTER_TODAY\"}");
        MapSiteLoader.Result result = MapSiteLoader.load(
                p,
                sites(
                        site("today", 1, 1, "", todayMs()),
                        site("yesterday", 2, 2, "", daysAgoMs(1)),
                        site("nodate", 3, 3, "", 0)),
                null, null, null);
        assertTrue(result.dateApplied);
        assertEquals(1, result.sites.size());
        assertEquals("today", result.sites.get(0).siteId);
    }

    // --- DATE_RANGE ----------------------------------------------------------

    @Test
    public void dateRange_keepsOnlySitesInsideHalfOpenRange() throws Exception {
        long start = daysAgoMs(5);
        long end = daysAgoMs(1);
        MapProfile p = profile("{\"type\":\"DATE_RANGE\",\"start_date\":" + start
                + ",\"end_date\":" + end + "}");
        MapSiteLoader.Result result = MapSiteLoader.load(
                p,
                sites(
                        site("inside", 1, 1, "", daysAgoMs(3)),
                        site("atStart", 2, 2, "", start),
                        site("atEnd", 3, 3, "", end),
                        site("before", 4, 4, "", daysAgoMs(10)),
                        site("after", 5, 5, "", daysAgoMs(0))),
                null, null, null);
        assertTrue(result.dateApplied);
        List<MapSite> kept = result.sites;
        assertEquals(2, kept.size());
        assertEquals("inside", kept.get(0).siteId);
        // end is exclusive, matching filterByToday()'s own convention.
        assertEquals("atStart", kept.get(1).siteId);
    }

    @Test
    public void dateRange_missingBound_skipsFilterInsteadOfExcludingEverything() throws Exception {
        MapProfile p = profile("{\"type\":\"DATE_RANGE\",\"start_date\":" + daysAgoMs(5) + "}");
        assertFalse(p.hasDateRange());
        MapSiteLoader.Result result = MapSiteLoader.load(
                p, sites(site("1", 1, 1, "", daysAgoMs(3))), null, null, null);
        assertFalse(result.dateApplied);
        assertEquals(1, result.sites.size());
    }

    @Test
    public void hasDateRange_requiresEndAfterStart() throws Exception {
        assertFalse(profile("{\"type\":\"DATE_RANGE\",\"start_date\":100,\"end_date\":100}")
                .hasDateRange());
        assertFalse(profile("{\"type\":\"DATE_RANGE\",\"start_date\":200,\"end_date\":100}")
                .hasDateRange());
        assertTrue(profile("{\"type\":\"DATE_RANGE\",\"start_date\":100,\"end_date\":200}")
                .hasDateRange());
    }
}
