# Trip AI: motion, terrain and vehicle models

Small random forests that learn from the motion windows the app logs on live trips, then run on
the phone in shadow mode (recorded next to the rule-based labels, never acted on).

## What the phone collects

`MotionFeatureLogger` writes one row per 10-second window to `trip_motion_features` (on the phone
only): one window a minute while driving, one every 5 minutes while idle, walking or on site.
Each row has the motion-sensor features, the terrain features from the last 2 minutes
(`terr_*`), and two rule-based labels:

- `label_motion`: driving, idle, on_site, walking, stopped or no_signal (from `MotionTimeline`)
- `label_terrain`: hill, winding, obstructed, highway, city or open (from `TerrainTracker.tags`)

The declared vehicle type (Private-2W or Private-4W) labels the bike-vs-car target.

## Train

```bash
python3 export_windows.py --serial ZA223MDVR8 --out windows.jsonl
python3 train_forest.py windows.jsonl --target vehicle --out vehicle.json
python3 train_forest.py windows.jsonl --target motion --out motion.json
python3 train_forest.py windows.jsonl --target terrain:hill --out terrain_hill.json
```

`export_windows.py` needs a debug build with MWFM open. Accuracy is reported on held-out trips
(no trip is in both training and test). Plain Python, no libraries.

## Ship in shadow mode

Copy model files into `EasyFormSE_finance/assets/trip_ai/`. Each window then also records
`pred_<target>` and `pred_<target>_p` (the model's answer and confidence). Compare those with the
labels and with what really happened before letting any model drive a decision.

## Notes

- Terrain models train on motion-sensor features only; the `terr_*` features made the labels,
  so learning them back would teach nothing.
- Motion and terrain labels start as rule-based guesses. Corrected labels (what the user really
  did) are what will let a model beat the rules.
