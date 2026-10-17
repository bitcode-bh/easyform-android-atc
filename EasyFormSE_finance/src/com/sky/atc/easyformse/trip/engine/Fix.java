package com.sky.atc.easyformse.trip.engine;

import android.location.Location;
import android.os.Build;
import android.os.SystemClock;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

/**
 * One location fix reduced to the values the trip engine needs, so the engine's rules are plain
 * Java that unit tests can run without Android.
 */
@StringFogIgnore
public final class Fix {
    public final double lat;
    public final double lng;
    /** Reported 68% radius in metres; 0 when the provider gave none. */
    public final float accuracyM;
    /** GPS (Doppler) speed in m/s, or -1 when the provider gave none. */
    public final float speedMps;
    /** Course over ground in degrees, or NaN when unknown. */
    public final float bearingDeg;
    /** Fix time (UTC ms). */
    public final long timeMs;
    /** How old the fix was when it reached us, in ms. */
    public final long ageMs;
    /** Satellites used, or 0 when the provider doesn't say. */
    public final int satellites;

    public Fix(double lat, double lng, float accuracyM, float speedMps, float bearingDeg,
               long timeMs, long ageMs, int satellites) {
        this.lat = lat;
        this.lng = lng;
        this.accuracyM = accuracyM;
        this.speedMps = speedMps;
        this.bearingDeg = bearingDeg;
        this.timeMs = timeMs;
        this.ageMs = ageMs;
        this.satellites = satellites;
    }

    public boolean hasSpeed() {
        return speedMps >= 0f;
    }

    public static Fix from(Location l) {
        long ageMs = 0L;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR1 && l.getElapsedRealtimeNanos() > 0) {
            ageMs = Math.max(0L, (SystemClock.elapsedRealtimeNanos() - l.getElapsedRealtimeNanos()) / 1_000_000L);
        }
        int satellites = 0;
        if (l.getExtras() != null) {
            satellites = l.getExtras().getInt("satellites", 0);
        }
        return new Fix(
                l.getLatitude(),
                l.getLongitude(),
                l.hasAccuracy() ? l.getAccuracy() : 0f,
                l.hasSpeed() ? l.getSpeed() : -1f,
                l.hasBearing() ? l.getBearing() : Float.NaN,
                l.getTime(),
                ageMs,
                satellites);
    }
}
