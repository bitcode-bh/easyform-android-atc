package com.sky.atc.easyformse.trip.engine;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

import java.util.List;
import java.util.Map;

public class TerrainTrackerTest {

    private static final double DEG_PER_M = 1.0 / 111_195.0;

    /** 120 fixes, one per second, along a path; returns the tags. */
    private static List<String> drive(double kmh, double turnDegPerFix, double climbMPerFix, float acc,
                                      boolean trusted, int stopEvery) {
        TerrainTracker t = new TerrainTracker();
        double lat = 23.0, lng = 72.5, bearing = 0, alt = 100;
        for (int i = 0; i < 120; i++) {
            double v = (stopEvery > 0 && i % stopEvery >= stopEvery - 15) ? 0 : kmh;
            double step = v / 3.6;
            lat += step * Math.cos(Math.toRadians(bearing)) * DEG_PER_M;
            lng += step * Math.sin(Math.toRadians(bearing)) * DEG_PER_M / Math.cos(Math.toRadians(lat));
            bearing = (bearing + turnDegPerFix) % 360;
            alt += climbMPerFix * (v > 0 ? 1 : 0);
            t.add(new Fix(lat, lng, acc, (float) step, (float) bearing, i * 1000L, 100, 8, alt), v, trusted);
        }
        return TerrainTracker.tags(t.features());
    }

    @Test
    public void straightFastRoadIsHighway() {
        List<String> tags = drive(80, 0, 0, 5, true, 0);
        assertTrue(tags.toString(), tags.contains("highway"));
        assertFalse(tags.contains("winding"));
    }

    @Test
    public void ghatRoadIsHillAndWinding() {
        // 25 km/h, turning 3 deg per second, climbing 0.5 m per second (7% grade).
        List<String> tags = drive(25, 3, 0.5, 6, true, 0);
        assertTrue(tags.toString(), tags.contains("hill"));
        assertTrue(tags.toString(), tags.contains("winding"));
    }

    @Test
    public void weakGpsIsObstructed() {
        List<String> tags = drive(30, 0, 0, 28, false, 0);
        assertTrue(tags.toString(), tags.contains("obstructed"));
    }

    @Test
    public void stopGoTrafficIsCity() {
        List<String> tags = drive(25, 0, 0, 6, true, 40);
        assertTrue(tags.toString(), tags.contains("city"));
    }

    @Test
    public void tooFewFixesSaysNothingSure() {
        TerrainTracker t = new TerrainTracker();
        t.add(new Fix(23, 72.5, 5, 10, 0, 0, 100, 8, 100), 36, true);
        Map<String, Double> f = t.features();
        assertEquals(1.0, f.get("terr_fixes"), 0.001);
        assertEquals("[open]", TerrainTracker.tags(f).toString());
    }
}
