package com.sky.atc.easyformse.trip.engine;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Summary features of one short window of motion while driving, collected to train a small
 * bike-vs-car model later. Plain Java so it runs in unit tests.
 *
 * The signals that differ between a motorbike and a car:
 * <ul>
 *   <li>Lean: a rider leans into a turn, so the phone tilts and feels little sideways force
 *       (low {@code lean_ratio}); in a car the phone stays upright and feels the full force.</li>
 *   <li>Vibration: engine and road vibration reach a phone on a bike at higher frequencies
 *       (band energy shares).</li>
 *   <li>Speed pattern: quick bursts and frequent speed changes in traffic.</li>
 * </ul>
 */
@StringFogIgnore
public final class MotionFeatures {

    private static final double G = 9.80665;
    /** Gravity low-pass for about 50 Hz samples (time constant around 0.4 s). */
    private static final double GRAVITY_ALPHA = 0.05;
    /** Only turns with at least this much centripetal force say anything about lean. */
    private static final double MIN_TURN_MPS2 = 0.5;
    private static final int[][] BANDS = {{1, 3}, {4, 7}, {8, 12}, {13, 20}};

    private MotionFeatures() {
    }

    /**
     * @param ax,ay,az accelerometer (m/s², gravity included), {@code at} in ns, {@code na} samples
     * @param gx,gy,gz gyroscope (rad/s), {@code gt} in ns, {@code ng} samples
     * @param speedKmh,bearingDeg,gpsMs trusted GPS fixes in the window, {@code ngps} of them.
     *        {@code gpsMs} and the sensor times (ns) must be on the same clock.
     * @return feature name to value; NaN where the window can't say
     */
    public static Map<String, Double> compute(float[] ax, float[] ay, float[] az, long[] at, int na,
                                              float[] gx, float[] gy, float[] gz, long[] gt, int ng,
                                              double[] speedKmh, float[] bearingDeg, long[] gpsMs, int ngps) {
        Map<String, Double> f = new LinkedHashMap<>();
        double windowSec = na > 1 ? (at[na - 1] - at[0]) / 1e9 : 0;
        f.put("accel_hz", windowSec > 0 ? (na - 1) / windowSec : Double.NaN);

        // Mean gravity direction over the window.
        double mx = 0, my = 0, mz = 0;
        for (int i = 0; i < na; i++) { mx += ax[i]; my += ay[i]; mz += az[i]; }
        double mn = Math.sqrt(mx * mx + my * my + mz * mz);
        if (na == 0 || mn == 0) {
            putAllNaN(f);
            putGps(f, speedKmh, bearingDeg, gpsMs, ngps);
            f.put("lean_ratio", Double.NaN);
            return f;
        }
        double ux = mx / mn, uy = my / mn, uz = mz / mn;

        double[] mag = new double[na];
        double[] tilt = new double[na];
        double sumMag = 0, sumVert2 = 0, sumHoriz = 0;
        double[] horiz = new double[na];
        double ex = ux * G, ey = uy * G, ez = uz * G;   // smoothed gravity vector
        for (int i = 0; i < na; i++) {
            double x = ax[i], y = ay[i], z = az[i];
            mag[i] = Math.sqrt(x * x + y * y + z * z);
            sumMag += mag[i];
            ex += GRAVITY_ALPHA * (x - ex);
            ey += GRAVITY_ALPHA * (y - ey);
            ez += GRAVITY_ALPHA * (z - ez);
            double en = Math.sqrt(ex * ex + ey * ey + ez * ez);
            double gxu = ex / en, gyu = ey / en, gzu = ez / en;
            double cos = Math.max(-1, Math.min(1, gxu * ux + gyu * uy + gzu * uz));
            tilt[i] = Math.toDegrees(Math.acos(cos));
            double along = x * gxu + y * gyu + z * gzu;
            double vert = along - en;
            sumVert2 += vert * vert;
            double hx = x - along * gxu, hy = y - along * gyu, hz = z - along * gzu;
            horiz[i] = Math.sqrt(hx * hx + hy * hy + hz * hz);
            sumHoriz += horiz[i];
        }
        double meanMag = sumMag / na;
        f.put("accel_mag_mean", meanMag);
        f.put("accel_mag_std", std(mag, na, meanMag));
        f.put("vert_vib_rms", Math.sqrt(sumVert2 / na));
        double horizMean = sumHoriz / na;
        f.put("horiz_mean", horizMean);
        f.put("horiz_p90", percentile(horiz, na, 0.90));
        f.put("tilt_std_deg", std(tilt, na, mean(tilt, na)));
        f.put("tilt_p95_deg", percentile(tilt, na, 0.95));

        // Vibration spectrum of the acceleration magnitude, as shares of the energy in 1–20 Hz.
        double[] power = new double[21];
        double total = 0;
        for (int hz = 1; hz <= 20; hz++) {
            double re = 0, im = 0;
            for (int i = 0; i < na; i++) {
                double t = (at[i] - at[0]) / 1e9;
                double d = mag[i] - meanMag;
                re += d * Math.cos(2 * Math.PI * hz * t);
                im -= d * Math.sin(2 * Math.PI * hz * t);
            }
            power[hz] = (re * re + im * im) / ((double) na * na);
            total += power[hz];
        }
        f.put("vib_energy", total);
        for (int[] b : BANDS) {
            double e = 0;
            for (int hz = b[0]; hz <= b[1]; hz++) e += power[hz];
            f.put("vib_share_" + b[0] + "_" + b[1] + "hz", total > 0 ? e / total : Double.NaN);
        }

        // Rotation: overall, and about the gravity axis (turning).
        if (ng > 0) {
            double[] w = new double[ng];
            double sumW = 0, sumYaw = 0;
            for (int i = 0; i < ng; i++) {
                w[i] = Math.sqrt(gx[i] * gx[i] + gy[i] * gy[i] + gz[i] * gz[i]);
                sumW += w[i];
                sumYaw += Math.abs(gx[i] * ux + gy[i] * uy + gz[i] * uz);
            }
            double meanW = sumW / ng;
            f.put("gyro_mean_dps", Math.toDegrees(meanW));
            f.put("gyro_std_dps", Math.toDegrees(std(w, ng, meanW)));
            f.put("yaw_rate_dps", Math.toDegrees(sumYaw / ng));
        } else {
            f.put("gyro_mean_dps", Double.NaN);
            f.put("gyro_std_dps", Double.NaN);
            f.put("yaw_rate_dps", Double.NaN);
        }

        putGps(f, speedKmh, bearingDeg, gpsMs, ngps);
        f.put("lean_ratio", leanRatio(ax, ay, az, at, na, speedKmh, bearingDeg, gpsMs, ngps));
        return f;
    }

    private static final double STRAIGHT_DPS = 3.0;
    private static final double TURN_DPS = 5.0;
    private static final double MOVING_KMH = 10.0;

    /**
     * Sideways force the phone feels in turns, divided by the turn's centripetal acceleration from
     * GPS. "Down" is taken from the parts of the window driven straight, so a steady force in a
     * turn isn't mistaken for a tilted phone. About 1 in a car; near 0 on a leaning motorbike.
     * NaN unless the window has both straight and turning stretches.
     */
    static double leanRatio(float[] ax, float[] ay, float[] az, long[] at, int na,
                            double[] speedKmh, float[] bearingDeg, long[] gpsMs, int ngps) {
        if (na == 0 || ngps < 2) return Double.NaN;
        // Classify each GPS interval: straight, turning (with its centripetal force), or neither.
        int nI = ngps - 1;
        int[] kind = new int[nI];          // 0 neither, 1 straight, 2 turning
        double[] centripetal = new double[nI];
        for (int i = 1; i < ngps; i++) {
            double dt = (gpsMs[i] - gpsMs[i - 1]) / 1000.0;
            if (dt <= 0 || dt > 5 || speedKmh[i] < MOVING_KMH || speedKmh[i - 1] < MOVING_KMH
                    || Float.isNaN(bearingDeg[i]) || Float.isNaN(bearingDeg[i - 1])) continue;
            double d = Math.abs(bearingDeg[i] - bearingDeg[i - 1]) % 360;
            if (d > 180) d = 360 - d;
            double rate = d / dt;
            if (rate < STRAIGHT_DPS) kind[i - 1] = 1;
            else if (rate >= TURN_DPS) {
                kind[i - 1] = 2;
                double v = (speedKmh[i] + speedKmh[i - 1]) / 2 / 3.6;
                centripetal[i - 1] = v * Math.toRadians(rate);
            }
        }
        // Sensor samples by interval (both clocks in ms here).
        double rx = 0, ry = 0, rz = 0;
        int nStraight = 0;
        int[] sampleKind = new int[na];
        int[] sampleInterval = new int[na];
        int j = 0;
        for (int s = 0; s < na; s++) {
            double tMs = at[s] / 1e6;
            while (j < nI && tMs > gpsMs[j + 1]) j++;
            if (j >= nI || tMs < gpsMs[j]) { sampleKind[s] = 0; continue; }
            sampleKind[s] = kind[j];
            sampleInterval[s] = j;
            if (kind[j] == 1) { rx += ax[s]; ry += ay[s]; rz += az[s]; nStraight++; }
        }
        double rn = Math.sqrt(rx * rx + ry * ry + rz * rz);
        if (nStraight < 50 || rn == 0) return Double.NaN;
        rx /= rn; ry /= rn; rz /= rn;
        double sumSide = 0, sumCent = 0;
        int nTurn = 0;
        for (int s = 0; s < na; s++) {
            if (sampleKind[s] != 2) continue;
            double along = ax[s] * rx + ay[s] * ry + az[s] * rz;
            double hx = ax[s] - along * rx, hy = ay[s] - along * ry, hz = az[s] - along * rz;
            sumSide += Math.sqrt(hx * hx + hy * hy + hz * hz);
            sumCent += centripetal[sampleInterval[s]];
            nTurn++;
        }
        if (nTurn < 50) return Double.NaN;
        double cent = sumCent / nTurn;
        return cent >= MIN_TURN_MPS2 ? (sumSide / nTurn) / cent : Double.NaN;
    }

    private static void putGps(Map<String, Double> f, double[] speedKmh, float[] bearingDeg, long[] gpsMs,
                               int n) {
        if (n == 0) {
            for (String k : new String[]{"speed_mean_kmh", "speed_std_kmh", "speed_max_kmh",
                    "speed_change_p90_mps2", "heading_rate_dps", "centripetal_mps2"}) {
                f.put(k, Double.NaN);
            }
            return;
        }
        double sum = 0, max = 0;
        for (int i = 0; i < n; i++) { sum += speedKmh[i]; max = Math.max(max, speedKmh[i]); }
        double mean = sum / n;
        f.put("speed_mean_kmh", mean);
        f.put("speed_std_kmh", std(speedKmh, n, mean));
        f.put("speed_max_kmh", max);

        double[] dv = new double[Math.max(1, n - 1)];
        int ndv = 0;
        double sumRate = 0, sumCentripetal = 0;
        int nRate = 0;
        for (int i = 1; i < n; i++) {
            double dt = (gpsMs[i] - gpsMs[i - 1]) / 1000.0;
            if (dt <= 0 || dt > 5) continue;
            dv[ndv++] = Math.abs(speedKmh[i] - speedKmh[i - 1]) / 3.6 / dt;
            if (!Float.isNaN(bearingDeg[i]) && !Float.isNaN(bearingDeg[i - 1]) && speedKmh[i] >= 10) {
                double d = Math.abs(bearingDeg[i] - bearingDeg[i - 1]) % 360;
                if (d > 180) d = 360 - d;
                double rate = d / dt;
                sumRate += rate;
                sumCentripetal += (speedKmh[i] / 3.6) * Math.toRadians(rate);
                nRate++;
            }
        }
        f.put("speed_change_p90_mps2", ndv > 0 ? percentile(dv, ndv, 0.90) : Double.NaN);
        double centripetal = nRate > 0 ? sumCentripetal / nRate : Double.NaN;
        f.put("heading_rate_dps", nRate > 0 ? sumRate / nRate : Double.NaN);
        f.put("centripetal_mps2", centripetal);
    }

    private static void putAllNaN(Map<String, Double> f) {
        for (String k : new String[]{"accel_mag_mean", "accel_mag_std", "vert_vib_rms", "horiz_mean", "horiz_p90",
                "tilt_std_deg", "tilt_p95_deg", "vib_energy", "vib_share_1_3hz", "vib_share_4_7hz",
                "vib_share_8_12hz", "vib_share_13_20hz", "gyro_mean_dps", "gyro_std_dps", "yaw_rate_dps"}) {
            f.put(k, Double.NaN);
        }
    }

    private static double mean(double[] v, int n) {
        double s = 0;
        for (int i = 0; i < n; i++) s += v[i];
        return n > 0 ? s / n : Double.NaN;
    }

    private static double std(double[] v, int n, double mean) {
        if (n < 2) return 0;
        double s = 0;
        for (int i = 0; i < n; i++) s += (v[i] - mean) * (v[i] - mean);
        return Math.sqrt(s / (n - 1));
    }

    private static double percentile(double[] v, int n, double p) {
        double[] c = Arrays.copyOf(v, n);
        Arrays.sort(c);
        return c[Math.min(n - 1, (int) Math.floor(p * (n - 1)))];
    }
}
