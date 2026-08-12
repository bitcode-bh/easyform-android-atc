package com.sky.atc.easyformse.trip.mapui;

import android.location.Location;

import com.google.android.gms.maps.model.LatLng;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

// Turns a profile + payload into the markers to draw. See PRD §8.2.
//
// All profile types implemented so far are sourced from the listing the user
// already has on screen (use_cached_list), so none makes an API call. Later
// profile types add a branch here, not a change to any caller.
//
// radiusOverrideKm is the one piece of state the user can change at runtime
// (the map's own range chips), layered on top of whatever a profile computed:
// for NEARBY_RADIUS and GEOFENCE_DOWNLOAD it replaces the configured
// radius_km; for every other type there is no inherent radius, so an
// override is the only way one applies. null always means "no cap" —
// callers that want a type's built-in default (the pre-chip behaviour) call
// defaultRadiusKm() themselves before the first load().
public final class MapSiteLoader {

    private MapSiteLoader() {
    }

    // Outcome of a load, so the caller can describe honestly what it drew
    // instead of assuming the profile was fully honoured.
    public static class Result {
        public final List<MapSite> sites;
        public final boolean radiusApplied;
        public Double effectiveRadiusKm;
        public boolean clusterApplied;
        public boolean dateApplied;
        // Whether `sites` is ordered nearest-first. False whenever the list is
        // still in its source order (e.g. ASSIGNED_LIST with no range picked)
        // — the UI must not claim a truncated list is "the nearest N" when it
        // is really just "the first N in source order".
        public boolean sortedByDistance;
        // How many matched before profile.limit truncated the list, so the UI
        // can say the count is capped instead of silently under-reporting.
        public int matchedBeforeLimit;

        Result(List<MapSite> sites, boolean radiusApplied) {
            this.sites = sites;
            this.radiusApplied = radiusApplied;
        }
    }

    public static Result load(MapProfile profile, JSONArray payloadSites, LatLng user,
                              String clusterValue, Double radiusOverrideKm) {
        List<MapSite> parsed = parse(payloadSites);
        if (profile == null) {
            return new Result(new ArrayList<MapSite>(), false);
        }

        List<MapSite> kept = parsed;
        boolean clusterApplied = false;
        boolean dateApplied = false;

        if (profile.isCluster()) {
            // An unknown cluster value means the filter cannot be evaluated.
            // Showing everything and saying so beats silently returning nothing.
            if (clusterValue != null && clusterValue.length() > 0) {
                kept = filterByCluster(kept, clusterValue);
                clusterApplied = true;
            }
            if (MapProfile.TYPE_ASSIGNED_CLUSTER_TODAY.equals(profile.type)) {
                // surveyMs 0 = the listing gave no date; excluded rather than
                // assumed to be today.
                kept = filterByToday(kept);
                dateApplied = true;
            }
        }

        boolean radiusApplied = false;
        boolean sortedByDistance = false;
        if (radiusOverrideKm != null && radiusOverrideKm > 0 && user != null) {
            measure(kept, user);
            kept = filterByRadius(kept, radiusOverrideKm);
            sortByDistance(kept);
            radiusApplied = true;
            sortedByDistance = true;
        } else if (user != null) {
            // No cap requested, but still measure so the detail sheet can show
            // a distance, and keep each type's original ordering: cluster
            // profiles have always sorted nearest-first once a position is
            // known, ASSIGNED_LIST has never reordered the server's list.
            measure(kept, user);
            if (profile.isCluster()) {
                sortByDistance(kept);
                sortedByDistance = true;
            }
        }

        int matched = kept.size();
        Result result = new Result(applyLimit(kept, profile.limit), radiusApplied);
        result.clusterApplied = clusterApplied;
        result.dateApplied = dateApplied;
        result.effectiveRadiusKm = radiusApplied ? radiusOverrideKm : null;
        result.sortedByDistance = sortedByDistance;
        result.matchedBeforeLimit = matched;
        return result;
    }

    // The radius a profile implies before the user has touched a range chip.
    // Public so the caller can seed its own initial state with the same
    // answer load() would otherwise compute internally — there is exactly
    // one definition of "this profile's default radius" in the codebase.
    public static Double defaultRadiusKm(MapProfile profile) {
        if (profile == null) {
            return null;
        }
        boolean radiusBearingType = MapProfile.TYPE_NEARBY_RADIUS.equals(profile.type)
                || MapProfile.TYPE_GEOFENCE_DOWNLOAD.equals(profile.type);
        if (radiusBearingType && profile.hasRadius()) {
            return profile.radiusKm;
        }
        return null;
    }

    private static List<MapSite> filterByCluster(List<MapSite> sites, String clusterValue) {
        List<MapSite> out = new ArrayList<MapSite>();
        for (int i = 0; i < sites.size(); i++) {
            if (clusterValue.equals(sites.get(i).clusterId)) {
                out.add(sites.get(i));
            }
        }
        return out;
    }

    private static List<MapSite> filterByToday(List<MapSite> sites) {
        List<MapSite> out = new ArrayList<MapSite>();
        long start = startOfToday();
        long end = start + 86400000L;
        for (int i = 0; i < sites.size(); i++) {
            long ms = sites.get(i).surveyMs;
            if (ms >= start && ms < end) {
                out.add(sites.get(i));
            }
        }
        return out;
    }

    private static List<MapSite> filterByRadius(List<MapSite> sites, double radiusKm) {
        List<MapSite> out = new ArrayList<MapSite>();
        double radiusM = radiusKm * 1000d;
        for (int i = 0; i < sites.size(); i++) {
            if (sites.get(i).distanceM <= radiusM) {
                out.add(sites.get(i));
            }
        }
        return out;
    }

    private static List<MapSite> parse(JSONArray payloadSites) {
        List<MapSite> sites = new ArrayList<MapSite>();
        if (payloadSites == null) {
            return sites;
        }
        for (int i = 0; i < payloadSites.length(); i++) {
            JSONObject row = payloadSites.optJSONObject(i);
            MapSite site = MapSite.fromJson(row);
            if (site != null) {
                sites.add(site);
            }
        }
        return sites;
    }

    private static void measure(List<MapSite> sites, LatLng user) {
        float[] out = new float[1];
        for (int i = 0; i < sites.size(); i++) {
            MapSite site = sites.get(i);
            Location.distanceBetween(user.latitude, user.longitude, site.lat, site.lon, out);
            site.distanceM = out[0];
        }
    }

    private static void sortByDistance(List<MapSite> sites) {
        Collections.sort(sites, new Comparator<MapSite>() {
            @Override
            public int compare(MapSite a, MapSite b) {
                return Double.compare(a.distanceM, b.distanceM);
            }
        });
    }

    // Device-local midnight (FR-16 allows device or server TZ; the survey epoch
    // and the user's day are both device-local here).
    private static long startOfToday() {
        Calendar c = Calendar.getInstance();
        c.set(Calendar.HOUR_OF_DAY, 0);
        c.set(Calendar.MINUTE, 0);
        c.set(Calendar.SECOND, 0);
        c.set(Calendar.MILLISECOND, 0);
        return c.getTimeInMillis();
    }

    // FR-13 — always after any sort, never before.
    private static List<MapSite> applyLimit(List<MapSite> sites, int limit) {
        if (limit > 0 && sites.size() > limit) {
            return new ArrayList<MapSite>(sites.subList(0, limit));
        }
        return sites;
    }
}
