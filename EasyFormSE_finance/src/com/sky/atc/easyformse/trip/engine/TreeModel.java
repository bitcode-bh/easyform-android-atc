package com.sky.atc.easyformse.trip.engine;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Map;

/**
 * Runs a small random forest exported by tools/trip_ai/train_forest.py. Each tree node is either
 * a split {"f": feature index, "t": threshold, "nl": missing values go left, "l", "r"} or a leaf
 * {"p": class probabilities}. The forest's answer is the average of its trees.
 *
 * Used in shadow mode: predictions are recorded next to the rule-based labels, never acted on.
 */
@StringFogIgnore
public final class TreeModel {

    private final String target;
    private final String[] classes;
    private final String[] features;
    private final JSONArray trees;

    public TreeModel(JSONObject json) throws org.json.JSONException {
        target = json.getString("target");
        JSONArray c = json.getJSONArray("classes");
        classes = new String[c.length()];
        for (int i = 0; i < c.length(); i++) classes[i] = c.getString(i);
        JSONArray f = json.getJSONArray("features");
        features = new String[f.length()];
        for (int i = 0; i < f.length(); i++) features[i] = f.getString(i);
        trees = json.getJSONArray("trees");
    }

    public String target() {
        return target;
    }

    public String[] classes() {
        return classes;
    }

    /** Class probabilities for one window's features (missing features count as unknown). */
    public double[] predict(Map<String, Double> x) {
        double[] v = new double[features.length];
        for (int i = 0; i < features.length; i++) {
            Double d = x.get(features[i]);
            v[i] = d == null ? Double.NaN : d;
        }
        double[] probs = new double[classes.length];
        int n = trees.length();
        for (int t = 0; t < n; t++) {
            JSONArray leaf = walk(trees.optJSONObject(t), v);
            if (leaf == null) continue;
            for (int j = 0; j < probs.length && j < leaf.length(); j++) {
                probs[j] += leaf.optDouble(j, 0) / n;
            }
        }
        return probs;
    }

    /** The most likely class. */
    public String best(double[] probs) {
        int b = 0;
        for (int i = 1; i < probs.length; i++) if (probs[i] > probs[b]) b = i;
        return classes[b];
    }

    private static JSONArray walk(JSONObject node, double[] v) {
        int guard = 0;
        while (node != null && !node.has("p") && guard++ < 64) {
            int f = node.optInt("f", -1);
            if (f < 0 || f >= v.length) return null;
            double x = v[f];
            boolean left = Double.isNaN(x) ? node.optBoolean("nl", true) : x <= node.optDouble("t", 0);
            node = node.optJSONObject(left ? "l" : "r");
        }
        return node == null ? null : node.optJSONArray("p");
    }
}
