package com.sky.atc.easyformse.trip.engine;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Describes the road and surroundings from the last {@link #WINDOW_MS} of fixes: how good the GPS
 * is (trees, valleys, tall buildings), how winding the road is, how much it climbs, and whether
 * driving looks like city or highway.
 *
 * {@link #tags} is a first, rule-based answer. It labels the logged motion windows so a small
 * model can later be trained to do better; until then it is recorded, not acted on.
 * Plain Java so it runs in unit tests.
 */
@StringFogIgnore
public final class TerrainTracker {

    public static final long WINDOW_MS = 2 * 60_000L;

    // Rule-based thresholds for the first labels.
    public static final double HILL_CLIMB_M_PER_KM = 40;     // 4% average grade
    public static final double HILL_RANGE_M = 40;
    public static final double WINDING_DEG_PER_KM = 300;
    public static final double OBSTRUCTED_P90_ACC_M = 20;
    public static final double OBSTRUCTED_TRUSTED_RATIO = 0.6;
    public static final double HIGHWAY_MEAN_KMH = 60;
    public static final double CITY_MEAN_KMH = 30;
    public static final double CITY_STOPS_PER_KM = 1.0;

    private static final class Sample {
        final long t;
        final double lat, lng, alt, speedKmh;
        final float acc, bearing;
        final boolean trusted;
        final int sats;

        Sample(long t, double lat, double lng, double alt, double speedKmh, float acc, float bearing,
               boolean trusted, int sats) {
            this.t = t; this.lat = lat; this.lng = lng; this.alt = alt; this.speedKmh = speedKmh;
            this.acc = acc; this.bearing = bearing; this.trusted = trusted; this.sats = sats;
        }
    }

    private final ArrayDeque<Sample> samples = new ArrayDeque<>();

    public void add(Fix f, double speedKmh, boolean trusted) {
        samples.addLast(new Sample(f.timeMs, f.lat, f.lng, f.altitudeM, speedKmh, f.accuracyM,
                f.bearingDeg, trusted, f.satellites));
        long cutoff = f.timeMs - WINDOW_MS;
        while (!samples.isEmpty() && samples.peekFirst().t < cutoff) samples.removeFirst();
    }

    public void clear() {
        samples.clear();
    }

    /** Features over the window; NaN where it can't say. */
    public Map<String, Double> features() {
        Map<String, Double> f = new LinkedHashMap<>();
        int n = samples.size();
        f.put("terr_fixes", (double) n);
        if (n < 2) {
            for (String k : new String[]{"terr_acc_mean", "terr_acc_p90", "terr_trusted_ratio", "terr_sats_mean",
                    "terr_km", "terr_speed_mean_kmh", "terr_stops_per_km", "terr_turn_deg_per_km",
                    "terr_climb_m_per_km", "terr_alt_range_m"}) {
                f.put(k, Double.NaN);
            }
            return f;
        }
        double[] acc = new double[n];
        double sumAcc = 0, sumSats = 0, sumSpeed = 0, meters = 0, turn = 0, climb = 0;
        int trusted = 0, satsN = 0, speedN = 0, stops = 0;
        double altMin = Double.MAX_VALUE, altMax = -Double.MAX_VALUE;
        boolean moving = false;
        Sample prev = null;
        int i = 0;
        for (Iterator<Sample> it = samples.iterator(); it.hasNext(); i++) {
            Sample s = it.next();
            acc[i] = s.acc;
            sumAcc += s.acc;
            if (s.trusted) trusted++;
            if (s.sats > 0) { sumSats += s.sats; satsN++; }
            if (s.speedKmh >= 0) {
                sumSpeed += s.speedKmh;
                speedN++;
                if (s.speedKmh >= 15) moving = true;
                else if (s.speedKmh < 3 && moving) { stops++; moving = false; }
            }
            if (!Double.isNaN(s.alt) && s.trusted) {
                altMin = Math.min(altMin, s.alt);
                altMax = Math.max(altMax, s.alt);
            }
            if (prev != null) {
                double d = TripDistanceMeter.haversine(prev.lat, prev.lng, s.lat, s.lng);
                meters += d;
                if (!Float.isNaN(s.bearing) && !Float.isNaN(prev.bearing) && s.speedKmh >= 10 && prev.speedKmh >= 10) {
                    turn += FixValidator.headingDelta(prev.bearing, s.bearing);
                }
                if (!Double.isNaN(s.alt) && !Double.isNaN(prev.alt) && s.trusted && prev.trusted) {
                    climb += Math.abs(s.alt - prev.alt);
                }
            }
            prev = s;
        }
        java.util.Arrays.sort(acc);
        double km = meters / 1000.0;
        f.put("terr_acc_mean", sumAcc / n);
        f.put("terr_acc_p90", acc[Math.min(n - 1, (int) Math.floor(0.9 * (n - 1)))]);
        f.put("terr_trusted_ratio", (double) trusted / n);
        f.put("terr_sats_mean", satsN > 0 ? sumSats / satsN : Double.NaN);
        f.put("terr_km", km);
        f.put("terr_speed_mean_kmh", speedN > 0 ? sumSpeed / speedN : Double.NaN);
        f.put("terr_stops_per_km", km >= 0.2 ? stops / km : Double.NaN);
        f.put("terr_turn_deg_per_km", km >= 0.2 ? turn / km : Double.NaN);
        f.put("terr_climb_m_per_km", km >= 0.2 ? climb / km : Double.NaN);
        f.put("terr_alt_range_m", altMax >= altMin ? altMax - altMin : Double.NaN);
        return f;
    }

    /**
     * Rule-based terrain tags from {@link #features()}: any of hill, winding, obstructed (weak
     * GPS: trees, valleys, tall buildings), highway, city, or open when none apply. Climb from
     * GPS altitude is rough, so hill needs both climbing and a real height change.
     */
    public static List<String> tags(Map<String, Double> f) {
        List<String> t = new ArrayList<>();
        double climb = v(f, "terr_climb_m_per_km"), range = v(f, "terr_alt_range_m");
        double turn = v(f, "terr_turn_deg_per_km");
        double p90 = v(f, "terr_acc_p90"), trustedRatio = v(f, "terr_trusted_ratio");
        double speed = v(f, "terr_speed_mean_kmh"), stops = v(f, "terr_stops_per_km");
        if (climb >= HILL_CLIMB_M_PER_KM && range >= HILL_RANGE_M) t.add("hill");
        if (turn >= WINDING_DEG_PER_KM) t.add("winding");
        if (p90 >= OBSTRUCTED_P90_ACC_M || trustedRatio < OBSTRUCTED_TRUSTED_RATIO) t.add("obstructed");
        if (speed >= HIGHWAY_MEAN_KMH && !(turn >= WINDING_DEG_PER_KM)) t.add("highway");
        else if (speed < CITY_MEAN_KMH && stops >= CITY_STOPS_PER_KM) t.add("city");
        if (t.isEmpty()) t.add("open");
        return t;
    }

    /** NaN-safe read: a missing value never satisfies a threshold. */
    private static double v(Map<String, Double> f, String k) {
        Double d = f.get(k);
        return d == null || d.isNaN() ? Double.NaN : d;
    }
}
