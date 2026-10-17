package com.sky.atc.easyformse.trip.engine;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

/**
 * What the user was doing when an event happened. Only events while DRIVING count as
 * violations; the rest are kept on the phone for review but not reported.
 *
 * Signals: whether a trip is live, the declared vehicle type, Android's activity detection
 * (once a minute) and the latest trusted GPS speed. A phone can't reliably tell a driver from a
 * passenger, so a passenger only shows up here when the vehicle type says so.
 */
@StringFogIgnore
public final class DrivingContext {

    public enum Context { DRIVING, NOT_IN_VEHICLE, PASSENGER_DECLARED, NOT_ON_TRIP, UNKNOWN }

    /** Android activity detection, reduced to what matters here. */
    public enum Activity { VEHICLE, BICYCLE, ON_FOOT, STILL, UNKNOWN }

    /** An activity reading older than this is ignored. Detection runs about once a minute. */
    public static final long ACTIVITY_FRESH_MS = 3 * 60_000L;
    public static final int MIN_CONFIDENCE = 60;
    /** Faster than this, the user is in a vehicle whatever the activity says. */
    public static final double VEHICLE_SPEED_KMH = 15.0;
    /** Slower than this, a walking or still reading is believed. */
    public static final double WALKING_SPEED_KMH = 7.0;
    /** A GPS speed older than this is ignored. */
    public static final long SPEED_FRESH_MS = 30_000L;

    private static volatile Activity lastActivity = Activity.UNKNOWN;
    private static volatile int lastConfidence = 0;
    private static volatile long lastActivityMs = 0L;
    private static volatile double lastSpeedKmh = -1;
    private static volatile long lastSpeedMs = 0L;

    private DrivingContext() {
    }

    /** From activity detection (activity_recognize). */
    public static void onActivity(Activity activity, int confidence, long nowMs) {
        lastActivity = activity;
        lastConfidence = confidence;
        lastActivityMs = nowMs;
    }

    /** The latest activity reading, or UNKNOWN when it is old or unsure. */
    public static Activity currentActivity(long nowMs) {
        boolean fresh = lastActivityMs > 0 && nowMs - lastActivityMs <= ACTIVITY_FRESH_MS
                && lastConfidence >= MIN_CONFIDENCE;
        return fresh ? lastActivity : Activity.UNKNOWN;
    }

    /** From the trip engine, on each trusted fix. */
    public static void onSpeed(double speedKmh, long nowMs) {
        lastSpeedKmh = speedKmh;
        lastSpeedMs = nowMs;
    }

    /** The context right now, from the latest readings. */
    public static Context current(boolean tripLive, String vehicleType, long nowMs) {
        long activityAge = lastActivityMs > 0 ? nowMs - lastActivityMs : -1;
        double speed = (lastSpeedMs > 0 && nowMs - lastSpeedMs <= SPEED_FRESH_MS) ? lastSpeedKmh : -1;
        return classify(tripLive, vehicleType, lastActivity, lastConfidence, activityAge, speed);
    }

    /**
     * @param activityAgeMs age of the activity reading, or -1 when there is none
     * @param speedKmh      latest trusted GPS speed, or -1 when unknown
     */
    public static Context classify(boolean tripLive, String vehicleType, Activity activity,
                                   int confidence, long activityAgeMs, double speedKmh) {
        if (!tripLive) return Context.NOT_ON_TRIP;
        if (isPassengerType(vehicleType)) return Context.PASSENGER_DECLARED;
        boolean fresh = activityAgeMs >= 0 && activityAgeMs <= ACTIVITY_FRESH_MS && confidence >= MIN_CONFIDENCE;
        if (speedKmh >= VEHICLE_SPEED_KMH) return Context.DRIVING;
        if (fresh && (activity == Activity.VEHICLE || activity == Activity.BICYCLE)) return Context.DRIVING;
        if (fresh && (activity == Activity.ON_FOOT || activity == Activity.STILL)
                && (speedKmh < 0 || speedKmh < WALKING_SPEED_KMH)) {
            return Context.NOT_IN_VEHICLE;
        }
        return Context.UNKNOWN;
    }

    /** Public transport and ride-sharing users ride as passengers. */
    public static boolean isPassengerType(String vehicleType) {
        if (vehicleType == null) return false;
        String v = vehicleType.trim();
        return v.equalsIgnoreCase("Public") || v.equalsIgnoreCase("Ride-Sharing");
    }

    /** Only events while driving count as violations. */
    public static boolean counts(Context c) {
        return c == Context.DRIVING;
    }

    public static String label(Context c) {
        switch (c) {
            case DRIVING: return "driving";
            case NOT_IN_VEHICLE: return "not_in_vehicle";
            case PASSENGER_DECLARED: return "passenger";
            case NOT_ON_TRIP: return "not_on_trip";
            default: return "unknown";
        }
    }
}
