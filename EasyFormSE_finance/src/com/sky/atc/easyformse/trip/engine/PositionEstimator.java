package com.sky.atc.easyformse.trip.engine;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

/**
 * Smooths GPS positions without letting them jump or drift at a standstill. Ported from OG Trip
 * Tracker's PositionEstimator: a 2-state Kalman filter in metres around a local anchor, where the
 * vehicle's speed along its heading is the prediction and each fix pulls the estimate towards it
 * with a weight set by the fix's accuracy.
 *
 * OG predicts at sensor rate along a sensor-fused heading. MWFM predicts once per fix along the
 * GPS course instead, so the phone's motion sensors can stay off; prediction is skipped below the
 * speed where the GPS course means anything.
 *
 * It replaces KalmanFilter2D, which integrated raw phone acceleration as if the phone lay flat
 * with its top facing forward.
 */
@StringFogIgnore
public final class PositionEstimator {

    public enum Result { SEEDED, ACCEPTED, FORCED, REJECTED_ACCURACY, REJECTED_OUTLIER }

    private static final double EARTH_RADIUS_M = 6_371_000.0;
    private static final double RAD_TO_DEG = 180.0 / Math.PI;

    private static final double Q_BASE = 0.5;
    private static final double Q_SPEED_FACTOR = 0.35;
    private static final double Q_STATIONARY = 0.05;
    private static final double INITIAL_VAR = 100.0;
    private static final double MAX_VAR = 10_000.0;
    private static final double MIN_R = 4.5;
    private static final double MAX_R = 5_000.0;
    private static final float DEFAULT_ACC_M = 20f;

    public static final double STATIONARY_MPS = 0.7;
    private static final double HEADING_TRUST_LO_MPS = 2.0;
    private static final double HEADING_TRUST_HI_MPS = 5.0;
    private static final float MAX_USABLE_ACC_M = 40f;
    private static final double GATE_SIGMA = 3.5;
    private static final double MIN_GATE_M = 15.0;
    private static final int REJECT_LIMIT = 3;
    private static final long STARVED_MS = 8_000L;
    private static final double HOLD_RADIUS_FACTOR = 2.0;
    private static final double MIN_HOLD_M = 10.0;
    private static final double STATIONARY_R_INFLATE = 25.0;
    /** OG caps a sensor-rate step at 0.5 s; one step per fix needs room for a 1–5 s fix interval. */
    private static final float MAX_DT_SEC = 6f;

    private double anchorLat = Double.NaN;
    private double anchorLng = Double.NaN;
    private double cosAnchorLat = 1.0;
    private double x = 0.0;
    private double y = 0.0;
    private double p = INITIAL_VAR;
    private long lastAcceptMs = 0L;
    private int consecutiveRejects = 0;

    public boolean isReady() {
        return !Double.isNaN(anchorLat);
    }

    public void reset() {
        anchorLat = Double.NaN;
        anchorLng = Double.NaN;
        x = 0.0;
        y = 0.0;
        p = INITIAL_VAR;
        lastAcceptMs = 0L;
        consecutiveRejects = 0;
    }

    /** Moves the estimate along the heading at the given speed and grows its uncertainty. */
    public void predict(double speedMps, float headingDeg, float dtSec) {
        if (!isReady() || dtSec <= 0f || dtSec > MAX_DT_SEC) return;
        if (speedMps >= STATIONARY_MPS && !Float.isNaN(headingDeg)) {
            double trust = clamp((speedMps - HEADING_TRUST_LO_MPS) / (HEADING_TRUST_HI_MPS - HEADING_TRUST_LO_MPS), 0.0, 1.0);
            double h = Math.toRadians(headingDeg);
            x += speedMps * trust * Math.sin(h) * dtSec;
            y += speedMps * trust * Math.cos(h) * dtSec;
            p += (Q_BASE + Q_SPEED_FACTOR * speedMps) * dtSec
                    + (1.0 - trust) * 2.0 * speedMps * speedMps * dtSec;
        } else if (speedMps >= STATIONARY_MPS) {
            // Moving with no usable heading: don't move, but let the next fix correct hard.
            p += (Q_BASE + Q_SPEED_FACTOR * speedMps) * dtSec + 2.0 * speedMps * speedMps * dtSec;
        } else {
            p += Q_STATIONARY * dtSec;
        }
        p = Math.min(p, MAX_VAR);
    }

    /** Applies one GPS fix. Rejected fixes leave the estimate unchanged. */
    public Result correct(double lat, double lng, float accuracyM, double speedMps, long nowMs) {
        float acc = accuracyM > 0f ? accuracyM : DEFAULT_ACC_M;
        boolean starved = lastAcceptMs != 0L && nowMs - lastAcceptMs > STARVED_MS;

        if (!isReady()) {
            anchorLat = lat;
            anchorLng = lng;
            cosAnchorLat = Math.max(0.01, Math.cos(Math.toRadians(lat)));
            x = 0.0;
            y = 0.0;
            p = (double) acc * acc;
            lastAcceptMs = nowMs;
            return Result.SEEDED;
        }

        if (acc > MAX_USABLE_ACC_M && !starved) return Result.REJECTED_ACCURACY;

        double gx = Math.toRadians(lng - anchorLng) * EARTH_RADIUS_M * cosAnchorLat;
        double gy = Math.toRadians(lat - anchorLat) * EARTH_RADIUS_M;
        double innovE = gx - x;
        double innovN = gy - y;
        double innovDist = Math.sqrt(innovE * innovE + innovN * innovN);

        double r = clamp((double) acc * acc / 2.0, MIN_R, MAX_R);
        double gate = Math.max(MIN_GATE_M, GATE_SIGMA * Math.sqrt(p + r));
        if (innovDist > gate && !starved) {
            consecutiveRejects++;
            if (consecutiveRejects < REJECT_LIMIT) return Result.REJECTED_OUTLIER;
            x = gx;
            y = gy;
            p = (double) acc * acc;
            consecutiveRejects = 0;
            lastAcceptMs = nowMs;
            return Result.FORCED;
        }
        consecutiveRejects = 0;

        if (speedMps < STATIONARY_MPS && innovDist < Math.max(MIN_HOLD_M, HOLD_RADIUS_FACTOR * acc)) {
            r *= STATIONARY_R_INFLATE;
        }

        double k = p / (p + r);
        x += k * innovE;
        y += k * innovN;
        p *= (1 - k);
        lastAcceptMs = nowMs;
        return Result.ACCEPTED;
    }

    public double latitude() {
        return isReady() ? anchorLat + (y / EARTH_RADIUS_M) * RAD_TO_DEG : 0.0;
    }

    public double longitude() {
        return isReady() ? anchorLng + (x / (EARTH_RADIUS_M * cosAnchorLat)) * RAD_TO_DEG : 0.0;
    }

    private static double clamp(double v, double lo, double hi) {
        return Math.max(lo, Math.min(hi, v));
    }
}
