package com.sky.atc.easyformse.trip.engine;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

import java.util.Map;

public class DrivingContextAndFeaturesTest {

    private static final DrivingContext.Activity V = DrivingContext.Activity.VEHICLE;
    private static final DrivingContext.Activity FOOT = DrivingContext.Activity.ON_FOOT;
    private static final DrivingContext.Activity STILL = DrivingContext.Activity.STILL;
    private static final DrivingContext.Activity UNK = DrivingContext.Activity.UNKNOWN;

    // ---- DrivingContext ----

    @Test
    public void offTripNothingCounts() {
        assertEquals(DrivingContext.Context.NOT_ON_TRIP,
                DrivingContext.classify(false, "Private-2W", V, 90, 10_000, 60));
    }

    @Test
    public void declaredPassengerTypesDontCount() {
        assertEquals(DrivingContext.Context.PASSENGER_DECLARED,
                DrivingContext.classify(true, "Public", V, 90, 10_000, 60));
        assertEquals(DrivingContext.Context.PASSENGER_DECLARED,
                DrivingContext.classify(true, "ride-sharing", V, 90, 10_000, 60));
    }

    @Test
    public void vehicleActivityOrVehicleSpeedIsDriving() {
        assertEquals(DrivingContext.Context.DRIVING,
                DrivingContext.classify(true, "Private-2W", V, 80, 30_000, 5));
        assertEquals(DrivingContext.Context.DRIVING,
                DrivingContext.classify(true, "Private-4W", UNK, 0, -1, 40));
        // Speed wins over a stale or wrong walking reading.
        assertEquals(DrivingContext.Context.DRIVING,
                DrivingContext.classify(true, "Private-2W", FOOT, 90, 10_000, 30));
    }

    @Test
    public void walkingOrStillAtWalkingSpeedIsNotInVehicle() {
        assertEquals(DrivingContext.Context.NOT_IN_VEHICLE,
                DrivingContext.classify(true, "Private-2W", FOOT, 80, 20_000, 4));
        assertEquals(DrivingContext.Context.NOT_IN_VEHICLE,
                DrivingContext.classify(true, "Private-2W", STILL, 90, 20_000, -1));
    }

    @Test
    public void staleOrUnsureActivityIsUnknownAndDoesNotCount() {
        DrivingContext.Context stale = DrivingContext.classify(true, "Private-2W", V, 90, 10 * 60_000L, 8);
        DrivingContext.Context unsure = DrivingContext.classify(true, "Private-2W", V, 40, 10_000, 8);
        assertEquals(DrivingContext.Context.UNKNOWN, stale);
        assertEquals(DrivingContext.Context.UNKNOWN, unsure);
        assertFalse(DrivingContext.counts(stale));
        assertTrue(DrivingContext.counts(DrivingContext.Context.DRIVING));
    }

    // ---- MotionFeatures ----

    private static final int N = 500;   // 10 s at 50 Hz

    private static Map<String, Double> window(double vibHz, double vibAmp, double horizAccel,
                                              double speedKmh, double headingRateDps) {
        float[] ax = new float[N], ay = new float[N], az = new float[N];
        long[] at = new long[N];
        for (int i = 0; i < N; i++) {
            double t = i / 50.0;
            at[i] = (long) (t * 1e9);
            ax[i] = (float) horizAccel;
            ay[i] = 0f;
            az[i] = (float) (9.80665 + vibAmp * Math.sin(2 * Math.PI * vibHz * t));
        }
        int ngps = 11;
        double[] speed = new double[ngps];
        float[] bearing = new float[ngps];
        long[] ms = new long[ngps];
        for (int i = 0; i < ngps; i++) {
            speed[i] = speedKmh;
            bearing[i] = (float) ((i * headingRateDps) % 360);
            ms[i] = i * 1000L;
        }
        return MotionFeatures.compute(ax, ay, az, at, N, new float[0], new float[0], new float[0], new long[0], 0,
                speed, bearing, ms, ngps);
    }

    @Test
    public void vibrationLandsInTheRightBand() {
        Map<String, Double> f = window(15, 1.0, 0, 40, 0);
        assertTrue("15 Hz share " + f.get("vib_share_13_20hz"), f.get("vib_share_13_20hz") > 0.8);
        Map<String, Double> g = window(2, 1.0, 0, 40, 0);
        assertTrue("2 Hz share " + g.get("vib_share_1_3hz"), g.get("vib_share_1_3hz") > 0.8);
    }

    /** 5 s straight, then 5 s turning at 10 deg/s and 36 km/h (about 1.75 m/s² centripetal). */
    private static double leanRatio(double sidewaysInTurn) {
        float[] ax = new float[N], ay = new float[N], az = new float[N];
        long[] at = new long[N];
        for (int i = 0; i < N; i++) {
            double t = i / 50.0;
            at[i] = (long) (t * 1e9);
            ax[i] = (float) (t >= 5 ? sidewaysInTurn : 0);
            az[i] = 9.80665f;
        }
        int ngps = 11;
        double[] speed = new double[ngps];
        float[] bearing = new float[ngps];
        long[] ms = new long[ngps];
        for (int i = 0; i < ngps; i++) {
            speed[i] = 36;
            bearing[i] = i <= 5 ? 90f : 90f + (i - 5) * 10f;
            ms[i] = i * 1000L;
        }
        return MotionFeatures.compute(ax, ay, az, at, N, new float[0], new float[0], new float[0], new long[0], 0,
                speed, bearing, ms, ngps).get("lean_ratio");
    }

    @Test
    public void leanRatioSeparatesALeaningRiderFromACar() {
        // Car: the phone feels the turn's full sideways force. Bike: the rider leans, so it feels little.
        double car = leanRatio(1.75);
        double bike = leanRatio(0.1);
        assertTrue("car " + car, car > 0.8);
        assertTrue("bike " + bike, bike < 0.3);
    }

    @Test
    public void straightRoadHasNoLeanReading() {
        assertTrue(Double.isNaN(window(5, 0.2, 0.2, 60, 0).get("lean_ratio")));
    }

    @Test
    public void speedFeaturesAreComputed() {
        Map<String, Double> f = window(5, 0.2, 0, 50, 0);
        assertEquals(50.0, f.get("speed_mean_kmh"), 0.001);
        assertEquals(50.0, f.get("speed_max_kmh"), 0.001);
        assertEquals(0.0, f.get("speed_change_p90_mps2"), 0.001);
    }
}
