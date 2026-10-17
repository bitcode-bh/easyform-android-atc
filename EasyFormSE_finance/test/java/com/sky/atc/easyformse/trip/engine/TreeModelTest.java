package com.sky.atc.easyformse.trip.engine;

import static org.junit.Assert.assertEquals;

import org.json.JSONObject;
import org.junit.Test;

import java.util.HashMap;
import java.util.Map;

public class TreeModelTest {

    // Two hand-written trees in train_forest.py's format: lean_ratio <= 0.5 -> bike.
    private static final String MODEL = "{\"target\":\"vehicle\",\"classes\":[\"Private-2W\",\"Private-4W\"],"
            + "\"features\":[\"lean_ratio\",\"speed_mean_kmh\"],\"trees\":["
            + "{\"f\":0,\"t\":0.5,\"nl\":true,\"l\":{\"p\":[1,0]},\"r\":{\"p\":[0,1]}},"
            + "{\"f\":0,\"t\":0.5,\"nl\":false,\"l\":{\"p\":[0.8,0.2]},\"r\":{\"p\":[0.1,0.9]}}]}";

    private static Map<String, Double> x(double lean) {
        Map<String, Double> m = new HashMap<>();
        m.put("lean_ratio", lean);
        m.put("speed_mean_kmh", 40.0);
        return m;
    }

    @Test
    public void forestAveragesItsTrees() throws Exception {
        TreeModel t = new TreeModel(new JSONObject(MODEL));
        double[] bike = t.predict(x(0.2));
        assertEquals(0.9, bike[0], 1e-9);
        assertEquals("Private-2W", t.best(bike));
        double[] car = t.predict(x(1.0));
        assertEquals("Private-4W", t.best(car));
        assertEquals(0.95, car[1], 1e-9);
    }

    @Test
    public void missingFeatureFollowsEachTreesMissingSide() throws Exception {
        TreeModel t = new TreeModel(new JSONObject(MODEL));
        double[] p = t.predict(new HashMap<String, Double>());
        // Tree 1 sends missing left (bike 1.0), tree 2 right (bike 0.1).
        assertEquals(0.55, p[0], 1e-9);
    }
}
