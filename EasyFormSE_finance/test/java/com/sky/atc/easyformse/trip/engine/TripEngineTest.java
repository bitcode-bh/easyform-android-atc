package com.sky.atc.easyformse.trip.engine;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class TripEngineTest {

    // About 0.000009 degrees of latitude per metre.
    private static final double DEG_PER_M = 1.0 / 111_195.0;

    private static Fix fix(double northM, float acc, float speed, float bearing, long t) {
        return new Fix(23.0 + northM * DEG_PER_M, 72.5, acc, speed, bearing, t, 200L, 0);
    }

    // ---- FixValidator ----

    @Test
    public void goodFixPasses() {
        assertEquals(FixValidator.Reason.OK, FixValidator.validate(fix(0, 6f, 20f, 0f, 1000), null));
    }

    @Test
    public void poorAccuracyStaleAndFewSatellitesAreRejected() {
        assertEquals(FixValidator.Reason.ACCURACY, FixValidator.validateFix(fix(0, 25f, 20f, 0f, 1000)));
        Fix stale = new Fix(23, 72.5, 6f, 20f, 0f, 1000, 5_000L, 0);
        assertEquals(FixValidator.Reason.STALE, FixValidator.validateFix(stale));
        Fix fewSats = new Fix(23, 72.5, 6f, 20f, 0f, 1000, 200L, 3);
        assertEquals(FixValidator.Reason.SATELLITES, FixValidator.validateFix(fewSats));
    }

    @Test
    public void highwaySpeedIsKeptButImpossibleSpeedIsNot() {
        // 140 km/h used to be dropped before it reached the trip pipeline.
        assertEquals(FixValidator.Reason.OK, FixValidator.validateFix(fix(0, 5f, 140f / 3.6f, 0f, 1000)));
        assertEquals(FixValidator.Reason.IMPOSSIBLE_SPEED, FixValidator.validateFix(fix(0, 5f, 90f, 0f, 1000)));
    }

    @Test
    public void speedJumpAndHeadingFlipWithinASecondAreRejected() {
        Fix prev = fix(0, 5f, 20f, 0f, 1000);
        assertEquals(FixValidator.Reason.SPEED_JUMP, FixValidator.validate(fix(20, 5f, 40f, 0f, 2000), prev));
        assertEquals(FixValidator.Reason.HEADING, FixValidator.validate(fix(20, 5f, 20f, 180f, 2000), prev));
        // Hard braking (about 0.6 g for a second) is real, not a GPS fault.
        assertEquals(FixValidator.Reason.OK, FixValidator.validate(fix(20, 5f, 14f, 0f, 2000), prev));
    }

    @Test
    public void nonIncreasingTimeIsRejected() {
        Fix prev = fix(0, 5f, 20f, 0f, 2000);
        assertEquals(FixValidator.Reason.TIMESTAMP, FixValidator.validate(fix(20, 5f, 20f, 0f, 2000), prev));
    }

    // ---- TripDistanceMeter ----

    @Test
    public void straightDriveIsMeasuredExactly() {
        TripDistanceMeter m = new TripDistanceMeter();
        for (int i = 0; i <= 100; i++) {
            m.add(23.0 + i * 20 * DEG_PER_M, 72.5, 5f, i * 1000L, true);
        }
        assertEquals(2000.0, m.totalMeters(), 5.0);
    }

    @Test
    public void parkedJitterAddsNothing() {
        TripDistanceMeter m = new TripDistanceMeter();
        for (int i = 0; i < 600; i++) {
            double jitter = ((i % 5) - 2) * 2.0;   // within ±4 m, accuracy 10 m
            m.add(23.0 + jitter * DEG_PER_M, 72.5, 10f, i * 1000L, true);
        }
        assertEquals(0.0, m.totalMeters(), 0.001);
    }

    @Test
    public void parkedJitterWiderThanAccuracyAddsNothingAfterSmoothing() {
        // As in newfused: the position filter runs first, then the meter.
        PositionEstimator e = new PositionEstimator();
        TripDistanceMeter m = new TripDistanceMeter();
        for (int i = 0; i < 600; i++) {
            double jitter = ((i % 7) - 3) * 3.0;   // within ±9 m, accuracy 10 m
            e.predict(0, Float.NaN, 1f);
            e.correct(23.0 + jitter * DEG_PER_M, 72.5, 10f, 0, i * 1000L);
            m.add(e.latitude(), e.longitude(), 10f, i * 1000L, true);
        }
        assertEquals(0.0, m.totalMeters(), 0.001);
    }

    @Test
    public void untrustedFixesAreIgnored() {
        TripDistanceMeter m = new TripDistanceMeter();
        m.add(23.0, 72.5, 5f, 0, true);
        m.add(23.0 + 5_000 * DEG_PER_M, 72.5, 5f, 1000, false);
        m.add(23.0 + 100 * DEG_PER_M, 72.5, 5f, 10_000, true);
        assertEquals(100.0, m.totalMeters(), 1.0);
    }

    @Test
    public void gpsJumpAndLongBreakAreGapsNotDistance() {
        TripDistanceMeter m = new TripDistanceMeter();
        m.add(23.0, 72.5, 5f, 0, true);
        m.add(23.0 + 1_000 * DEG_PER_M, 72.5, 5f, 1000, true);          // 1 km in 1 s
        assertEquals(0.0, m.totalMeters(), 0.001);
        m.add(23.0 + 4_000 * DEG_PER_M, 72.5, 5f, 11 * 60_000L, true);   // 10 min later, 3 km on
        assertEquals(0.0, m.totalMeters(), 0.001);
        assertEquals(2, m.gaps());
    }

    @Test
    public void resumeKeepsTheSavedTotal() {
        TripDistanceMeter m = new TripDistanceMeter();
        m.resume(1500.0);
        m.add(23.0, 72.5, 5f, 0, true);
        m.add(23.0 + 50 * DEG_PER_M, 72.5, 5f, 5000, true);
        assertEquals(1550.0, m.totalMeters(), 1.0);
    }

    // ---- PositionEstimator ----

    @Test
    public void standstillJitterBarelyMovesTheEstimate() {
        PositionEstimator e = new PositionEstimator();
        e.correct(23.0, 72.5, 8f, 0, 0);
        for (int i = 1; i < 120; i++) {
            double jitter = ((i % 5) - 2) * 4.0;
            e.predict(0, Float.NaN, 1f);
            e.correct(23.0 + jitter * DEG_PER_M, 72.5, 8f, 0, i * 1000L);
        }
        double driftM = Math.abs(e.latitude() - 23.0) / DEG_PER_M;
        assertTrue("drift " + driftM, driftM < 3.0);
    }

    @Test
    public void followsAMovingVehicle() {
        PositionEstimator e = new PositionEstimator();
        e.correct(23.0, 72.5, 5f, 20, 0);
        for (int i = 1; i <= 60; i++) {
            e.predict(20, 0f, 1f);
            e.correct(23.0 + i * 20 * DEG_PER_M, 72.5, 5f, 20, i * 1000L);
        }
        double errM = Math.abs(e.latitude() - (23.0 + 1200 * DEG_PER_M)) / DEG_PER_M;
        assertTrue("error " + errM, errM < 3.0);
    }

    @Test
    public void singleOutlierIsRejectedButARealRelocationWins() {
        PositionEstimator e = new PositionEstimator();
        e.correct(23.0, 72.5, 5f, 0, 0);
        assertEquals(PositionEstimator.Result.REJECTED_OUTLIER,
                e.correct(23.0 + 500 * DEG_PER_M, 72.5, 5f, 0, 1000));
        assertEquals(PositionEstimator.Result.REJECTED_OUTLIER,
                e.correct(23.0 + 500 * DEG_PER_M, 72.5, 5f, 0, 2000));
        assertEquals(PositionEstimator.Result.FORCED,
                e.correct(23.0 + 500 * DEG_PER_M, 72.5, 5f, 0, 3000));
    }
}
