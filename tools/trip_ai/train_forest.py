#!/usr/bin/env python3
"""
Train a small random forest on MWFM's motion feature windows and export it as JSON for the
phone (com.sky.atc.easyformse.trip.engine.TreeModel). Plain Python, no libraries.

Input: JSON Lines, one window per line, as exported by export_windows.py:
    {"tid": "5", "vehicle_type": "Private-2W", "context": "driving",
     "features": {"label_motion": "driving", "label_terrain": ["hill"], "lean_ratio": 0.2, ...}}

Targets:
    motion           the rule-based motion state (label_motion)
    vehicle          Private-2W vs Private-4W (declared vehicle type)
    terrain:<tag>    one terrain tag (hill, winding, obstructed, highway, city) yes/no

Accuracy is measured on trips held out from training (split by trip, so windows from one trip
never sit on both sides).

    python3 train_forest.py windows.jsonl --target vehicle --out vehicle_model.json
"""
import argparse
import json
import math
import random
import sys
from collections import Counter

LABEL_KEYS = {"label_motion", "label_terrain"}


def load(path, target):
    rows = []
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            w = json.loads(line)
            feats = w.get("features") or {}
            if target == "motion":
                y = feats.get("label_motion")
            elif target == "vehicle":
                vt = (w.get("vehicle_type") or "").strip()
                y = vt if vt in ("Private-2W", "Private-4W") else None
            elif target.startswith("terrain:"):
                tags = feats.get("label_terrain") or []
                y = "yes" if target.split(":", 1)[1] in tags else "no"
            else:
                sys.exit("unknown target " + target)
            if y is None:
                continue
            x = {k: (float(v) if v is not None else float("nan"))
                 for k, v in feats.items() if k not in LABEL_KEYS and not isinstance(v, (list, dict, str))}
            if target.startswith("terrain:"):
                # Terrain tags are computed from terr_* features; learning them back is circular.
                # Use only the motion-sensor features so the model learns to see terrain itself.
                x = {k: v for k, v in x.items() if not k.startswith("terr_")}
            rows.append((w.get("tid") or "", x, y))
    return rows


def gini(counts, n):
    return 1.0 - sum((c / n) ** 2 for c in counts.values()) if n else 0.0


def best_split(X, y, idx, feats, min_leaf):
    n = len(idx)
    parent = Counter(y[i] for i in idx)
    base = gini(parent, n)
    best = None
    for f in feats:
        present = [i for i in idx if not math.isnan(X[i][f])]
        missing = [i for i in idx if math.isnan(X[i][f])]
        if len(present) < 2 * min_leaf:
            continue
        present.sort(key=lambda i: X[i][f])
        left = Counter()
        right = Counter(y[i] for i in present)
        miss = Counter(y[i] for i in missing)
        for k in range(len(present) - 1):
            i = present[k]
            left[y[i]] += 1
            right[y[i]] -= 1
            a, b = X[i][f], X[present[k + 1]][f]
            if a == b or k + 1 < min_leaf or len(present) - k - 1 < min_leaf:
                continue
            nl, nr = k + 1, len(present) - k - 1
            for miss_left in (True, False):
                l, r = (left + miss, right) if miss_left else (left, right + miss)
                tl = nl + (len(missing) if miss_left else 0)
                tr = nr + (0 if miss_left else len(missing))
                score = base - (tl / n) * gini(l, tl) - (tr / n) * gini(r, tr)
                if best is None or score > best[0]:
                    best = (score, f, (a + b) / 2.0, miss_left)
    return best


def build(X, y, idx, feat_names, classes, depth, max_depth, min_leaf, rng):
    counts = Counter(y[i] for i in idx)
    leaf = {"p": [round(counts.get(c, 0) / len(idx), 4) for c in classes]}
    if depth >= max_depth or len(counts) == 1 or len(idx) < 2 * min_leaf:
        return leaf
    k = max(1, int(math.sqrt(len(feat_names))))
    feats = rng.sample(range(len(feat_names)), min(k, len(feat_names)))
    split = best_split(X, y, idx, feats, min_leaf)
    if split is None or split[0] <= 1e-6:
        return leaf
    _, f, thr, miss_left = split
    L = [i for i in idx if (X[i][f] <= thr) or (math.isnan(X[i][f]) and miss_left)]
    R = [i for i in idx if not ((X[i][f] <= thr) or (math.isnan(X[i][f]) and miss_left))]
    if not L or not R:
        return leaf
    return {"f": f, "t": round(thr, 6), "nl": miss_left,
            "l": build(X, y, L, feat_names, classes, depth + 1, max_depth, min_leaf, rng),
            "r": build(X, y, R, feat_names, classes, depth + 1, max_depth, min_leaf, rng)}


def predict_tree(node, x):
    while "p" not in node:
        v = x[node["f"]]
        go_left = node["nl"] if math.isnan(v) else v <= node["t"]
        node = node["l"] if go_left else node["r"]
    return node["p"]


def predict(model, x):
    probs = [0.0] * len(model["classes"])
    for t in model["trees"]:
        for j, p in enumerate(predict_tree(t, x)):
            probs[j] += p / len(model["trees"])
    return probs


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("windows")
    ap.add_argument("--target", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--trees", type=int, default=25)
    ap.add_argument("--depth", type=int, default=7)
    ap.add_argument("--min-leaf", type=int, default=5)
    ap.add_argument("--holdout", type=float, default=0.25)
    ap.add_argument("--seed", type=int, default=7)
    a = ap.parse_args()
    rng = random.Random(a.seed)

    rows = load(a.windows, a.target)
    if len(rows) < 30:
        sys.exit("only %d labelled windows; collect more trips first" % len(rows))
    feat_names = sorted({k for _, x, _ in rows for k in x})
    classes = sorted({y for _, _, y in rows})
    trips = sorted({t for t, _, _ in rows})
    rng.shuffle(trips)
    test_trips = set(trips[:max(1, int(len(trips) * a.holdout))]) if len(trips) > 1 else set()

    def vec(x):
        return [x.get(f, float("nan")) for f in feat_names]

    train = [(vec(x), y) for t, x, y in rows if t not in test_trips]
    test = [(vec(x), y) for t, x, y in rows if t in test_trips]
    X = [v for v, _ in train]
    y = [c for _, c in train]

    trees = []
    for _ in range(a.trees):
        boot = [rng.randrange(len(X)) for _ in range(len(X))]
        trees.append(build(X, y, boot, feat_names, classes, 0, a.depth, a.min_leaf, rng))
    model = {"target": a.target, "classes": classes, "features": feat_names, "trees": trees,
             "trained_windows": len(train), "trips": len(trips)}

    if test:
        conf = Counter()
        right = 0
        for v, truth in test:
            p = predict(model, v)
            guess = classes[max(range(len(classes)), key=lambda j: p[j])]
            conf[(truth, guess)] += 1
            right += guess == truth
        model["holdout_accuracy"] = round(right / len(test), 4)
        print("held-out trips: %d, windows: %d, accuracy: %.1f%%" % (len(test_trips), len(test), 100.0 * right / len(test)))
        for truth in classes:
            print("  %-12s -> %s" % (truth, {g: conf[(truth, g)] for g in classes if conf[(truth, g)]}))
    else:
        print("only one trip: no held-out accuracy")

    with open(a.out, "w") as f:
        json.dump(model, f, separators=(",", ":"))
    print("wrote %s (%d trees, %d features, classes %s)" % (a.out, len(trees), len(feat_names), classes))


if __name__ == "__main__":
    main()
