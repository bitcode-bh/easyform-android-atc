package com.sky.atc.easyformse.trip.engine;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

/**
 * Decides whether a fix can be trusted for distance and violations. Ported from OG Trip Tracker's
 * GpsValidator (field-checked against speed cameras and the car's meters), with one MWFM addition:
 * an absolute speed ceiling that replaces the old rule dropping every fix above 118 km/h.
 */
@StringFogIgnore
public final class FixValidator {

    public enum Reason { OK, ACCURACY, SATELLITES, STALE, TIMESTAMP, SPEED_JUMP, HEADING, IMPOSSIBLE_SPEED }

    public static final float MAX_ACCURACY_M = 15f;
    /** Rejected when fewer than this are reported; 0 means the provider doesn't say, so no check. */
    public static final int MIN_SATELLITES = 5;
    public static final long MAX_GPS_AGE_MS = 3_000L;
    /** About 1.2 g: beyond any real car's braking or acceleration. */
    public static final double MAX_PLAUSIBLE_ACCEL_MPS2 = 12.0;
    public static final double MIN_SPEED_JUMP_KMH = 5.0;
    public static final float MAX_HEADING_JUMP_DEG = 90f;
    public static final double HEADING_MIN_SPEED_MPS = 5.0;
    /** About 270 km/h. A reading above this is a GPS fault, not a vehicle. */
    public static final float MAX_SPEED_MPS = 75f;

    private FixValidator() {
    }

    /** Checks that need no previous fix: accuracy, satellites, freshness, speed ceiling. */
    public static Reason validateFix(Fix f) {
        if (f.ageMs > MAX_GPS_AGE_MS) return Reason.STALE;
        if (f.accuracyM <= 0f || f.accuracyM > MAX_ACCURACY_M) return Reason.ACCURACY;
        if (f.satellites > 0 && f.satellites < MIN_SATELLITES) return Reason.SATELLITES;
        if (f.hasSpeed() && f.speedMps > MAX_SPEED_MPS) return Reason.IMPOSSIBLE_SPEED;
        return Reason.OK;
    }

    /** Full check against the previous trusted fix ({@code prev} may be null). */
    public static Reason validate(Fix f, Fix prev) {
        Reason own = validateFix(f);
        if (own != Reason.OK) return own;
        if (prev == null) return Reason.OK;
        if (f.timeMs <= prev.timeMs) return Reason.TIMESTAMP;
        double dtSec = (f.timeMs - prev.timeMs) / 1000.0;
        if (dtSec <= 1.0 && f.hasSpeed() && prev.hasSpeed()) {
            double deltaKmh = Math.abs(f.speedMps - prev.speedMps) * 3.6;
            double maxDeltaKmh = Math.max(MIN_SPEED_JUMP_KMH, MAX_PLAUSIBLE_ACCEL_MPS2 * dtSec * 3.6);
            if (deltaKmh > maxDeltaKmh) return Reason.SPEED_JUMP;
            if (f.speedMps > HEADING_MIN_SPEED_MPS && prev.speedMps > HEADING_MIN_SPEED_MPS
                    && !Float.isNaN(f.bearingDeg) && !Float.isNaN(prev.bearingDeg)
                    && headingDelta(prev.bearingDeg, f.bearingDeg) > MAX_HEADING_JUMP_DEG) {
                return Reason.HEADING;
            }
        }
        return Reason.OK;
    }

    /** Smallest difference between two compass headings, 0–180 degrees. */
    public static float headingDelta(float a, float b) {
        float d = Math.abs(b - a) % 360f;
        return d > 180f ? 360f - d : d;
    }
}
