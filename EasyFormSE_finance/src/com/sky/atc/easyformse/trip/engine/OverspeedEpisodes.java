package com.sky.atc.easyformse.trip.engine;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

/**
 * Decides when speeding becomes one over-speed event. Fed every trusted fix of a live trip.
 *
 * <ul>
 *   <li>An episode starts only above the limit plus a margin: the larger of 5 km/h or 10%
 *       (OG Trip Tracker's rule), so driving at the limit doesn't start one.</li>
 *   <li>It ends only after {@link #END_BELOW_MS} in a row below the limit, so a brief dip doesn't
 *       split it.</li>
 *   <li>An episode starting less than {@link #MERGE_GAP_MS} after the last one ended continues it:
 *       one event, one alert.</li>
 *   <li>An event needs at least the configured duration of time over the limit, and never less
 *       than {@link #MIN_DURATION_MS}. A GPS gap adds no time.</li>
 * </ul>
 *
 * {@link Decision#EVENT} marks the moment the episode qualifies (for the alert on the phone).
 * The event itself is recorded at {@link Decision#FINISHED}, once the episode is over, so it
 * carries the real end, duration and top speed.
 */
@StringFogIgnore
public final class OverspeedEpisodes {

    public enum Decision {
        /** Not speeding. */
        NONE,
        /** A new episode began on this fix. */
        STARTED,
        /** Speeding continues; no event yet, or the event was already recorded. */
        ONGOING,
        /** Below the limit inside an episode, waiting to see if it ends. */
        DIPPING,
        /** The episode has just qualified as a violation: alert now. */
        EVENT,
        /** A qualified episode is over (no new speeding within the merge gap): record it now. */
        FINISHED
    }

    public static final double MARGIN_MIN_KMH = 5.0;
    public static final double MARGIN_PCT = 0.10;
    public static final long END_BELOW_MS = 5_000L;
    public static final long MERGE_GAP_MS = 2 * 60_000L;
    public static final long MIN_DURATION_MS = 10_000L;
    /** A longer wait between fixes is a GPS gap: it adds no time over the limit. */
    public static final long GPS_GAP_MS = 10_000L;

    private boolean inEpisode;
    private boolean eventRecorded;
    private boolean finished;
    private long lastOverMs;
    private long startMs;
    private long lastFixMs;
    private boolean hasLastFix;
    private long belowSinceMs;
    private long overMs;
    private long endedMs;
    private double maxKmh;
    private long maxMs;

    public static double startThresholdKmh(double limitKmh) {
        return limitKmh + Math.max(MARGIN_MIN_KMH, limitKmh * MARGIN_PCT);
    }

    public void reset() {
        inEpisode = false;
        eventRecorded = false;
        finished = false;
        lastOverMs = 0L;
        startMs = 0L;
        lastFixMs = 0L;
        hasLastFix = false;
        belowSinceMs = 0L;
        overMs = 0L;
        endedMs = 0L;
        maxKmh = 0.0;
        maxMs = 0L;
    }

    public Decision onFix(long nowMs, double speedKmh, double limitKmh, long configuredDurationMs) {
        if (limitKmh <= 0) return Decision.NONE;
        long minDuration = Math.max(MIN_DURATION_MS, configuredDurationMs);
        long dt = hasLastFix ? nowMs - lastFixMs : 0L;
        lastFixMs = nowMs;
        hasLastFix = true;
        boolean overLimit = speedKmh > limitKmh;

        if (!inEpisode) {
            if (eventRecorded && !finished && endedMs > 0 && nowMs - endedMs >= MERGE_GAP_MS) {
                finished = true;
                return Decision.FINISHED;
            }
            if (speedKmh < startThresholdKmh(limitKmh)) return Decision.NONE;
            inEpisode = true;
            belowSinceMs = 0L;
            boolean continuesLast = endedMs > 0 && nowMs - endedMs < MERGE_GAP_MS;
            if (!continuesLast) {
                // A fresh episode; a continued one keeps its start, time and event.
                startMs = nowMs;
                overMs = 0L;
                eventRecorded = false;
                finished = false;
                maxKmh = 0.0;
                maxMs = 0L;
            }
            lastOverMs = nowMs;
            noteMax(nowMs, speedKmh);
            return continuesLast ? Decision.ONGOING : Decision.STARTED;
        }

        if (overLimit) {
            belowSinceMs = 0L;
            lastOverMs = nowMs;
            if (dt > 0 && dt <= GPS_GAP_MS) overMs += dt;
            noteMax(nowMs, speedKmh);
            if (!eventRecorded && overMs >= minDuration) {
                eventRecorded = true;
                return Decision.EVENT;
            }
            return Decision.ONGOING;
        }

        if (belowSinceMs == 0L) belowSinceMs = nowMs;
        if (nowMs - belowSinceMs >= END_BELOW_MS) {
            inEpisode = false;
            endedMs = belowSinceMs;
            return Decision.NONE;
        }
        return Decision.DIPPING;
    }

    public boolean inEpisode() {
        return inEpisode;
    }

    /**
     * Closes a qualified episode that hasn't been recorded yet, e.g. when the trip ends. Returns
     * true when there is one to record now.
     */
    public boolean flush() {
        if (eventRecorded && !finished) {
            finished = true;
            inEpisode = false;
            return true;
        }
        return false;
    }

    /** When the speeding was last seen. */
    public long endMs() {
        return lastOverMs;
    }

    public long startMs() {
        return startMs;
    }

    public long overMs() {
        return overMs;
    }

    public double maxKmh() {
        return maxKmh;
    }

    public long maxMs() {
        return maxMs;
    }

    private void noteMax(long nowMs, double speedKmh) {
        if (speedKmh > maxKmh) {
            maxKmh = speedKmh;
            maxMs = nowMs;
        }
    }
}
