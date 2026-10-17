package com.sky.atc.easyformse.trip.engine;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

/**
 * Distance driven on a trip, measured from every trusted fix. Ported from OG Trip Tracker's
 * TripDistance.Accumulator, which agrees with the car's meters over thousands of kilometres.
 *
 * Distance is added only once the position moves beyond the GPS noise floor from a held anchor,
 * so jitter while parked never adds up. A jump at an impossible speed, or a long time gap with
 * real movement, re-anchors without adding anything: that stretch is a gap to be filled later
 * from the road network, never a straight line counted as driven.
 */
@StringFogIgnore
public final class TripDistanceMeter {

    /** A segment implying more than this (about 270 km/h) is a GPS jump, not motion. */
    public static final double MAX_PLAUSIBLE_MPS = 75.0;
    /** Movement below the fixes' accuracy is noise; never count less than this either. */
    public static final double MIN_JITTER_FLOOR_M = 5.0;
    /** Beyond this, consecutive fixes are no longer continuous recording. */
    public static final long LARGE_TIME_GAP_MS = 5 * 60 * 1000L;
    /** A time gap only counts as a gap when the position also moved at least this far. */
    public static final double MIN_GAP_DISTANCE_M = 50.0;

    private double anchorLat;
    private double anchorLng;
    private float anchorAcc;
    private long anchorTimeMs;
    private boolean hasAnchor;
    private double totalMeters;
    private int gaps;

    public double totalMeters() {
        return totalMeters;
    }

    /** Gaps found so far (jumps or long breaks with movement), for diagnostics. */
    public int gaps() {
        return gaps;
    }

    /** Starts from a saved total, e.g. after the service restarts mid-trip. */
    public void resume(double savedMeters) {
        totalMeters = Math.max(0.0, savedMeters);
        hasAnchor = false;
    }

    public void reset() {
        totalMeters = 0.0;
        gaps = 0;
        hasAnchor = false;
    }

    /**
     * Feeds the next fix. Untrusted fixes are ignored. Returns the metres this fix added.
     */
    public double add(double lat, double lng, float accuracyM, long timeMs, boolean trusted) {
        if (!trusted) return 0.0;
        if (!hasAnchor) {
            setAnchor(lat, lng, accuracyM, timeMs);
            return 0.0;
        }
        double d = haversine(anchorLat, anchorLng, lat, lng);
        long dtMs = timeMs - anchorTimeMs;
        double dtSec = dtMs / 1000.0;
        boolean jump = dtSec > 0 && d / dtSec > MAX_PLAUSIBLE_MPS;
        boolean longBreak = dtMs > LARGE_TIME_GAP_MS && d >= MIN_GAP_DISTANCE_M;
        if (jump || longBreak) {
            if (d >= MIN_GAP_DISTANCE_M) gaps++;
            setAnchor(lat, lng, accuracyM, timeMs);
            return 0.0;
        }
        double floor = Math.max(MIN_JITTER_FLOOR_M, Math.max(anchorAcc, accuracyM));
        if (d < floor) return 0.0;
        totalMeters += d;
        setAnchor(lat, lng, accuracyM, timeMs);
        return d;
    }

    private void setAnchor(double lat, double lng, float acc, long timeMs) {
        anchorLat = lat;
        anchorLng = lng;
        anchorAcc = acc;
        anchorTimeMs = timeMs;
        hasAnchor = true;
    }

    public static double haversine(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double h = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return 6_371_000.0 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    }
}
