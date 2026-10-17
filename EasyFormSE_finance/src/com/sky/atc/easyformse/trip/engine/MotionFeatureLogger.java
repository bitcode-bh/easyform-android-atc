package com.sky.atc.easyformse.trip.engine;

import android.content.ContentValues;
import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.media.AudioDeviceInfo;
import android.media.AudioManager;
import android.os.Build;
import android.os.Handler;
import android.os.HandlerThread;
import android.util.Log;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

import net.sqlcipher.database.SQLiteDatabase;

import org.json.JSONObject;

import java.util.Map;

/**
 * Records motion features during live trips, for training a bike-vs-car model later. Data stays on
 * the phone (table trip_motion_features), labelled with the user's declared vehicle type; nothing
 * is uploaded.
 *
 * To keep battery use small, the accelerometer and gyroscope run at about 50 Hz for a
 * {@link #WINDOW_MS} window at most once every {@link #WINDOW_EVERY_MS} while driving on a live
 * trip, and once every {@link #WINDOW_NOT_DRIVING_EVERY_MS} while not driving (idle, walking, on
 * site) on a live trip.
 *
 * Each window is labelled with the rule-based motion state and terrain tags, so a small model can
 * later be trained on them (motion state, terrain type, vehicle type) and compared against them.
 */
@StringFogIgnore
public final class MotionFeatureLogger implements SensorEventListener {

    private static final String TAG = "TRIP_FEATURES";
    public static final long WINDOW_MS = 10_000L;
    public static final long WINDOW_EVERY_MS = 60_000L;
    public static final double MIN_SPEED_KMH = 10.0;
    public static final long WINDOW_NOT_DRIVING_EVERY_MS = 5 * 60_000L;
    private static final int MAX_SAMPLES = 2_500;
    private static final int MAX_GPS = 64;
    private static final int MAX_ROWS = 20_000;

    private final Context appContext;
    private final SensorManager sensors;
    // Shadow-mode models (assets/trip_ai/*.json from tools/trip_ai/train_forest.py), loaded once
    // on the sensor thread. Their answers are recorded next to the rule-based labels, never used.
    private java.util.List<TreeModel> models;
    private final AudioManager audio;
    private final SQLiteDatabase db;
    private final HandlerThread thread;
    private final Handler handler;
    // Same thread as onFix (the location callback runs on the main looper).
    private final Handler mainHandler = new Handler(android.os.Looper.getMainLooper());

    // Written on the sensor thread only.
    private final float[] ax = new float[MAX_SAMPLES], ay = new float[MAX_SAMPLES], az = new float[MAX_SAMPLES];
    private final long[] at = new long[MAX_SAMPLES];
    private final float[] gx = new float[MAX_SAMPLES], gy = new float[MAX_SAMPLES], gz = new float[MAX_SAMPLES];
    private final long[] gt = new long[MAX_SAMPLES];
    private int na, ng;
    private volatile long clockOffsetNs;

    // Written on the caller's thread, read on the sensor thread when the window closes.
    private final double[] gpsSpeed = new double[MAX_GPS];
    private final float[] gpsBearing = new float[MAX_GPS];
    private final long[] gpsMs = new long[MAX_GPS];
    private int ngps;

    private boolean collecting;
    private long windowStartMs;
    private long lastWindowEndMs;
    private String windowTid;
    private String windowVehicleType;
    private TerrainTracker terrain;
    private String windowMotionAtStart;

    /** The terrain tracker whose features label each window (read on the caller's thread). */
    public void setTerrain(TerrainTracker terrain) {
        this.terrain = terrain;
    }
    private static boolean tableReady = false;

    public MotionFeatureLogger(Context context, SQLiteDatabase db) {
        this.appContext = context.getApplicationContext();
        this.sensors = (SensorManager) context.getSystemService(Context.SENSOR_SERVICE);
        this.audio = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
        this.db = db;
        this.thread = new HandlerThread("TripFeatures");
        this.thread.start();
        this.handler = new Handler(thread.getLooper());
    }

    /**
     * Called on every fix. {@code tid} is null when no trip is live; {@code speedKmh} is -1 for an
     * untrusted fix.
     */
    public void onFix(String tid, String vehicleType, double speedKmh, float bearingDeg, long nowMs,
                      MotionTimeline.State motion) {
        if (tid == null) {
            if (collecting) abort();
            return;
        }
        if (!collecting) {
            boolean driving = speedKmh >= MIN_SPEED_KMH;
            long every = driving ? WINDOW_EVERY_MS : WINDOW_NOT_DRIVING_EVERY_MS;
            if (nowMs - lastWindowEndMs >= every) {
                windowMotionAtStart = motion == null ? null : MotionTimeline.label(motion);
                begin(tid, vehicleType, nowMs);
            }
            return;
        }
        currentMotion = motion;
        if (speedKmh >= 0) {
            synchronized (gpsMs) {
                if (ngps < MAX_GPS) {
                    gpsSpeed[ngps] = speedKmh;
                    gpsBearing[ngps] = bearingDeg;
                    gpsMs[ngps] = nowMs;
                    ngps++;
                }
            }
        }
        if (nowMs - windowStartMs >= WINDOW_MS) {
            finish(nowMs);
        }
    }

    private MotionTimeline.State currentMotion;

    public void stop() {
        if (collecting) abort();
        thread.quitSafely();
    }

    private void begin(String tid, String vehicleType, long nowMs) {
        if (sensors == null) return;
        Sensor acc = sensors.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
        if (acc == null) return;
        Sensor gyro = sensors.getDefaultSensor(Sensor.TYPE_GYROSCOPE);
        collecting = true;
        windowStartMs = nowMs;
        windowTid = tid;
        windowVehicleType = vehicleType;
        synchronized (gpsMs) { ngps = 0; }
        clockOffsetNs = System.currentTimeMillis() * 1_000_000L - android.os.SystemClock.elapsedRealtimeNanos();
        handler.post(new Runnable() {
            @Override public void run() { na = 0; ng = 0; }
        });
        // Close the window on time even if no fix arrives (parked or slow: few fixes come).
        final long startedAt = nowMs;
        mainHandler.postDelayed(new Runnable() {
            @Override public void run() {
                if (collecting && windowStartMs == startedAt) finish(System.currentTimeMillis());
            }
        }, WINDOW_MS + 1_000L);
        int latencyUs = 2_000_000;   // let the sensor hub batch samples
        sensors.registerListener(this, acc, SensorManager.SENSOR_DELAY_GAME, latencyUs, handler);
        if (gyro != null) sensors.registerListener(this, gyro, SensorManager.SENSOR_DELAY_GAME, latencyUs, handler);
    }

    private void abort() {
        collecting = false;
        if (sensors != null) sensors.unregisterListener(this);
    }

    private void finish(final long nowMs) {
        collecting = false;
        lastWindowEndMs = nowMs;
        if (sensors != null) sensors.unregisterListener(this);
        final String tid = windowTid;
        final String vehicleType = windowVehicleType;
        final long startMs = windowStartMs;
        final boolean btAudio = bluetoothAudioConnected();
        final String context = DrivingContext.label(DrivingContext.current(true, vehicleType, nowMs));
        // Labels, read here on the caller's thread: rule-based motion state and terrain.
        final String motionLabel = currentMotion != null ? MotionTimeline.label(currentMotion) : windowMotionAtStart;
        final Map<String, Double> terrainFeatures = terrain != null ? terrain.features() : null;
        final java.util.List<String> terrainTags = terrainFeatures != null ? TerrainTracker.tags(terrainFeatures) : null;
        handler.post(new Runnable() {
            @Override public void run() {
                try {
                    if (na < 50) return;   // too little sensor data to say anything
                    int n;
                    double[] s; float[] b; long[] t;
                    synchronized (gpsMs) {
                        n = ngps;
                        s = java.util.Arrays.copyOf(gpsSpeed, n);
                        b = java.util.Arrays.copyOf(gpsBearing, n);
                        t = java.util.Arrays.copyOf(gpsMs, n);
                    }
                    Map<String, Double> f = MotionFeatures.compute(ax, ay, az, at, na, gx, gy, gz, gt, ng, s, b, t, n);
                    if (terrainFeatures != null) f.putAll(terrainFeatures);
                    JSONObject json = new JSONObject();
                    json.put("label_motion", motionLabel == null ? JSONObject.NULL : motionLabel);
                    json.put("label_terrain", terrainTags == null ? JSONObject.NULL : new org.json.JSONArray(terrainTags));
                    for (TreeModel m : models()) {
                        double[] p = m.predict(f);
                        double best = 0;
                        for (double x : p) best = Math.max(best, x);
                        String key = "pred_" + m.target().replaceAll("[^A-Za-z0-9]", "_");
                        json.put(key, m.best(p));
                        json.put(key + "_p", Math.round(best * 1000) / 1000.0);
                    }
                    for (Map.Entry<String, Double> e : f.entrySet()) {
                        double v = e.getValue();
                        json.put(e.getKey(), Double.isNaN(v) || Double.isInfinite(v) ? JSONObject.NULL
                                : Math.round(v * 10000.0) / 10000.0);
                    }
                    store(tid, startMs, nowMs - startMs, vehicleType, context, btAudio, json.toString());
                } catch (Exception e) {
                    Log.e(TAG, "feature window failed", e);
                }
            }
        });
    }

    private java.util.List<TreeModel> models() {
        if (models != null) return models;
        models = new java.util.ArrayList<>();
        try {
            String[] files = appContext.getAssets().list("trip_ai");
            if (files != null) {
                for (String name : files) {
                    if (!name.endsWith(".json")) continue;
                    java.io.InputStream in = appContext.getAssets().open("trip_ai/" + name);
                    try {
                        java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();
                        byte[] buf = new byte[8192];
                        int r;
                        while ((r = in.read(buf)) > 0) out.write(buf, 0, r);
                        models.add(new TreeModel(new JSONObject(out.toString("UTF-8"))));
                    } finally {
                        in.close();
                    }
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "model load failed", e);
        }
        return models;
    }

    @Override
    public void onSensorChanged(SensorEvent e) {
        // Sensor time is on the boot clock; move it to wall-clock ns to line up with GPS times.
        long wallNs = e.timestamp + clockOffsetNs;
        if (e.sensor.getType() == Sensor.TYPE_ACCELEROMETER) {
            if (na < MAX_SAMPLES) {
                ax[na] = e.values[0]; ay[na] = e.values[1]; az[na] = e.values[2]; at[na] = wallNs; na++;
            }
        } else if (e.sensor.getType() == Sensor.TYPE_GYROSCOPE) {
            if (ng < MAX_SAMPLES) {
                gx[ng] = e.values[0]; gy[ng] = e.values[1]; gz[ng] = e.values[2]; gt[ng] = wallNs; ng++;
            }
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
    }

    /** A Bluetooth audio device (car kit or headset) is connected; no permission needed. */
    private boolean bluetoothAudioConnected() {
        if (audio == null || Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return false;
        try {
            for (AudioDeviceInfo d : audio.getDevices(AudioManager.GET_DEVICES_OUTPUTS)) {
                int type = d.getType();
                if (type == AudioDeviceInfo.TYPE_BLUETOOTH_A2DP || type == AudioDeviceInfo.TYPE_BLUETOOTH_SCO) {
                    return true;
                }
            }
        } catch (Exception ignored) {
        }
        return false;
    }

    private void store(String tid, long startMs, long durMs, String vehicleType, String context,
                       boolean btAudio, String features) {
        if (db == null) return;
        try {
            if (!tableReady) {
                db.execSQL("CREATE TABLE IF NOT EXISTS trip_motion_features ("
                        + "_id INTEGER PRIMARY KEY AUTOINCREMENT, tid TEXT, start_ms INTEGER, dur_ms INTEGER, "
                        + "vehicle_type TEXT, context TEXT, bt_audio INTEGER, features TEXT)");
                tableReady = true;
            }
            ContentValues v = new ContentValues();
            v.put("tid", tid);
            v.put("start_ms", startMs);
            v.put("dur_ms", durMs);
            v.put("vehicle_type", vehicleType);
            v.put("context", context);
            v.put("bt_audio", btAudio ? 1 : 0);
            v.put("features", features);
            long id = db.insert("trip_motion_features", null, v);
            if (id > MAX_ROWS && id % 500 == 0) {
                db.execSQL("delete from trip_motion_features where _id <= " + (id - MAX_ROWS));
            }
        } catch (Exception e) {
            Log.e(TAG, "store failed", e);
        }
    }
}
