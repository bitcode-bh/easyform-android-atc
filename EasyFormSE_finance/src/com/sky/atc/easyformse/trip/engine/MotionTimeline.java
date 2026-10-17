package com.sky.atc.easyformse.trip.engine;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

/**
 * What the user is doing over time, as a sequence of segments:
 * <ul>
 *   <li>DRIVING: moving at vehicle speed (crawling in traffic stays DRIVING).</li>
 *   <li>IDLE: stopped during a drive, away from any site (traffic, waiting with the vehicle).</li>
 *   <li>ON_SITE: at a site from the site list: the user is working there.</li>
 *   <li>WALKING: on foot away from a site.</li>
 *   <li>STOPPED: not moving, away from any site and not mid-drive (office, home, break).</li>
 *   <li>NO_SIGNAL: Android reports no location for a while.</li>
 * </ul>
 * A new state only takes over once it has held for its {@link #holdMs} time, so a short stop or
 * a GPS blip doesn't split a segment; the new segment then starts from when it first appeared.
 * Plain Java so the rules can be unit-tested.
 */
@StringFogIgnore
public final class MotionTimeline {

    public enum State { DRIVING, IDLE, ON_SITE, WALKING, STOPPED, NO_SIGNAL }

    /** A finished stretch of one state. */
    public static final class Segment {
        public final State state;
        public final long startMs;
        public final long endMs;
        public final String siteId;
        public final double meters;
        public final double maxKmh;

        Segment(State state, long startMs, long endMs, String siteId, double meters, double maxKmh) {
            this.state = state;
            this.startMs = startMs;
            this.endMs = endMs;
            this.siteId = siteId;
            this.meters = meters;
            this.maxKmh = maxKmh;
        }
    }

    public static final double DRIVE_KMH = 10.0;
    public static final double STOP_KMH = 3.0;
    public static final double WALK_MAX_KMH = 7.0;
    /** Without a location this long, the state becomes NO_SIGNAL. */
    public static final long NO_SIGNAL_MS = 2 * 60_000L;

    static long holdMs(State s) {
        switch (s) {
            case DRIVING: return 20_000L;
            case IDLE: return 2 * 60_000L;
            case ON_SITE: return 5 * 60_000L;   // towers sit by roads: a traffic stop isn't a visit
            case WALKING: return 60_000L;
            case STOPPED: return 3 * 60_000L;
            default: return 0L;
        }
    }

    private State state;
    private long stateStartMs;
    private String stateSite;
    private double stateMeters;
    private double stateMaxKmh;

    private State candidate;
    private long candidateSinceMs;
    private String candidateSite;

    // Latest inputs, reused when time passes without a new fix.
    private double lastSpeedKmh = -1;
    private String lastSiteId;
    private DrivingContext.Activity lastActivity = DrivingContext.Activity.UNKNOWN;
    private boolean locationAvailable = true;
    private long unavailableSinceMs;

    public State state() {
        return state;
    }

    public long stateStartMs() {
        return stateStartMs;
    }

    /**
     * A new fix (speed -1 when unknown). {@code siteId} is the site the user is inside, or null.
     * {@code meters} is the distance this fix added to the trip. Returns the segment this
     * update closed, or null.
     */
    public Segment onFix(long nowMs, double speedKmh, String siteId, DrivingContext.Activity activity, double meters) {
        lastSpeedKmh = speedKmh;
        lastSiteId = siteId;
        lastActivity = activity == null ? DrivingContext.Activity.UNKNOWN : activity;
        locationAvailable = true;
        unavailableSinceMs = 0L;
        if (state != null) {
            stateMeters += Math.max(0, meters);
            if (speedKmh > stateMaxKmh) stateMaxKmh = speedKmh;
        }
        return evaluate(nowMs);
    }

    /** Android's report of whether a location can be had at all (no fix comes while still). */
    public Segment onAvailability(long nowMs, boolean available) {
        if (available) {
            locationAvailable = true;
            unavailableSinceMs = 0L;
        } else if (locationAvailable) {
            locationAvailable = false;
            unavailableSinceMs = nowMs;
        }
        return evaluate(nowMs);
    }

    /** Time passing without a fix (e.g. parked, where no new fixes arrive). */
    public Segment tick(long nowMs) {
        return evaluate(nowMs);
    }

    /** Closes the current segment, e.g. when the service stops. */
    public Segment close(long nowMs) {
        if (state == null) return null;
        Segment s = new Segment(state, stateStartMs, Math.max(nowMs, stateStartMs), stateSite, stateMeters, stateMaxKmh);
        state = null;
        candidate = null;
        return s;
    }

    State classify(long nowMs) {
        if (!locationAvailable && nowMs - unavailableSinceMs >= NO_SIGNAL_MS) return State.NO_SIGNAL;
        double v = lastSpeedKmh;
        boolean midDrive = state == State.DRIVING || state == State.IDLE;
        if (v >= DRIVE_KMH) return State.DRIVING;
        if (lastSiteId != null && v < WALK_MAX_KMH) return State.ON_SITE;
        if (lastActivity == DrivingContext.Activity.ON_FOOT) return State.WALKING;
        if (v >= STOP_KMH) return midDrive ? State.DRIVING : State.WALKING;
        // Stopped during a drive is idle; idle this long means parked.
        if (state == State.IDLE && nowMs - stateStartMs >= IDLE_TO_STOPPED_MS) return State.STOPPED;
        return midDrive ? State.IDLE : State.STOPPED;
    }

    /** Idle for this long (away from a site, not walking) counts as parked: STOPPED. */
    public static final long IDLE_TO_STOPPED_MS = 20 * 60_000L;

    private Segment evaluate(long nowMs) {
        State c = classify(nowMs);
        String site = c == State.ON_SITE ? lastSiteId : null;
        if (state == null) {
            startState(c, c == State.NO_SIGNAL ? unavailableSinceMs : nowMs, site);
            return null;
        }
        if (c == state && (c != State.ON_SITE || eq(site, stateSite))) {
            candidate = null;
            return null;
        }
        if (candidate != c || (c == State.ON_SITE && !eq(site, candidateSite))) {
            candidate = c;
            candidateSite = site;
            candidateSinceMs = c == State.NO_SIGNAL ? unavailableSinceMs : nowMs;
        }
        if (nowMs - candidateSinceMs < holdMs(c)) return null;
        long switchAt = Math.max(candidateSinceMs, stateStartMs);
        Segment closed = new Segment(state, stateStartMs, switchAt, stateSite, stateMeters, stateMaxKmh);
        startState(c, switchAt, site);
        return closed;
    }

    private void startState(State s, long startMs, String site) {
        state = s;
        stateStartMs = startMs;
        stateSite = site;
        stateMeters = 0;
        stateMaxKmh = 0;
        candidate = null;
    }

    private static boolean eq(String a, String b) {
        return a == null ? b == null : a.equals(b);
    }

    public static String label(State s) {
        switch (s) {
            case DRIVING: return "driving";
            case IDLE: return "idle";
            case ON_SITE: return "on_site";
            case WALKING: return "walking";
            case STOPPED: return "stopped";
            default: return "no_signal";
        }
    }
}
