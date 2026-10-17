package com.sky.atc.easyformse.trip.engine;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

public class OverspeedEpisodesTest {

    private static final double LIMIT = 60.0;          // km/h; start threshold 66
    private static final long CONFIGURED = 5_000L;      // below the 10 s floor

    /** Feeds one fix per second at the given speeds; returns how many events fired. */
    private static int drive(OverspeedEpisodes e, long startMs, double... speeds) {
        int events = 0;
        for (int i = 0; i < speeds.length; i++) {
            if (e.onFix(startMs + i * 1000L, speeds[i], LIMIT, CONFIGURED) == OverspeedEpisodes.Decision.EVENT) {
                events++;
            }
        }
        return events;
    }

    private static double[] repeat(double v, int n) {
        double[] out = new double[n];
        for (int i = 0; i < n; i++) out[i] = v;
        return out;
    }

    @Test
    public void marginIsTheLargerOfFiveKmhOrTenPercent() {
        assertEquals(66.0, OverspeedEpisodes.startThresholdKmh(60), 0.001);
        assertEquals(35.0, OverspeedEpisodes.startThresholdKmh(30), 0.001);
        assertEquals(110.0, OverspeedEpisodes.startThresholdKmh(100), 0.001);
    }

    @Test
    public void drivingJustOverTheLimitStartsNothing() {
        OverspeedEpisodes e = new OverspeedEpisodes();
        assertEquals(0, drive(e, 0, repeat(64, 120)));
    }

    @Test
    public void sustainedSpeedingGivesOneEventAfterTheTenSecondFloor() {
        OverspeedEpisodes e = new OverspeedEpisodes();
        long t = 0;
        int events = 0;
        int firedAt = -1;
        for (int i = 0; i < 120; i++) {
            if (e.onFix(t + i * 1000L, 72, LIMIT, CONFIGURED) == OverspeedEpisodes.Decision.EVENT) {
                events++;
                firedAt = i;
            }
        }
        assertEquals(1, events);
        assertEquals(10, firedAt);
    }

    @Test
    public void configuredDurationLongerThanTheFloorIsUsed() {
        OverspeedEpisodes e = new OverspeedEpisodes();
        int events = 0;
        for (int i = 0; i < 40; i++) {
            if (e.onFix(i * 1000L, 72, LIMIT, 30_000L) == OverspeedEpisodes.Decision.EVENT) events++;
        }
        assertEquals(0, drive(new OverspeedEpisodes(), 0, repeat(72, 9)));
        assertEquals(1, events);
    }

    @Test
    public void briefDipsDoNotSplitTheEpisode() {
        OverspeedEpisodes e = new OverspeedEpisodes();
        // 70, a 3 s dip to 58, 70 again, repeated for three minutes: one event.
        double[] pattern = {70, 70, 70, 70, 70, 58, 58, 58};
        double[] speeds = new double[180];
        for (int i = 0; i < speeds.length; i++) speeds[i] = pattern[i % pattern.length];
        assertEquals(1, drive(e, 0, speeds));
    }

    @Test
    public void episodesLessThanTwoMinutesApartMerge() {
        OverspeedEpisodes e = new OverspeedEpisodes();
        int events = drive(e, 0, repeat(72, 20));                 // event
        events += drive(e, 20_000, repeat(50, 30));               // ends after 5 s below
        events += drive(e, 50_000, repeat(72, 20));               // 25 s later: same episode
        assertEquals(1, events);
    }

    @Test
    public void episodesMoreThanTwoMinutesApartAreSeparate() {
        OverspeedEpisodes e = new OverspeedEpisodes();
        int events = drive(e, 0, repeat(72, 20));
        events += drive(e, 20_000, repeat(50, 150));
        events += drive(e, 170_000, repeat(72, 20));
        assertEquals(2, events);
    }

    @Test
    public void gpsGapAddsNoTime() {
        OverspeedEpisodes e = new OverspeedEpisodes();
        assertEquals(OverspeedEpisodes.Decision.STARTED, e.onFix(0, 72, LIMIT, CONFIGURED));
        // 60 s later with no fixes in between: the gap must not count as speeding.
        assertEquals(OverspeedEpisodes.Decision.ONGOING, e.onFix(60_000, 72, LIMIT, CONFIGURED));
        assertEquals(0, e.overMs());
    }

    @Test
    public void noLimitConfiguredMeansNoEvents() {
        OverspeedEpisodes e = new OverspeedEpisodes();
        int events = 0;
        for (int i = 0; i < 60; i++) {
            if (e.onFix(i * 1000L, 90, 0, CONFIGURED) == OverspeedEpisodes.Decision.EVENT) events++;
        }
        assertEquals(0, events);
    }
}
