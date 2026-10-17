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
 * {@link #WINDOW_MS} window at most once every {@link #WINDOW_EVERY_MS}, and only while moving at
 * {@link #MIN_SPEED_KMH} or more on a live trip.
 */
@StringFogIgnore
public final class MotionFeatureLogger implements SensorEventListener {

    private static final String TAG = "TRIP_FEATURES";
    public static final long WINDOW_MS = 10_000L;
    public static final long WINDOW_EVERY_MS = 60_000L;
    public static final double MIN_SPEED_KMH = 10.0;
    private static final int MAX_SAMPLES = 2_500;
    private static final int MAX_GPS = 64;
    private static final int MAX_ROWS = 20_000;

    private final SensorManager sensors;
    private final AudioManager audio;
    private final SQLiteDatabase db;
    private final HandlerThread thread;
    private final Handler handler;

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
    private static boolean tableReady = false;

    public MotionFeatureLogger(Context context, SQLiteDatabase db) {
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
    public void onFix(String tid, String vehicleType, double speedKmh, float bearingDeg, long nowMs) {
        if (tid == null) {
            if (collecting) abort();
            return;
        }
        if (!collecting) {
            if (speedKmh >= MIN_SPEED_KMH && nowMs - lastWindowEndMs >= WINDOW_EVERY_MS) {
                begin(tid, vehicleType, nowMs);
            }
            return;
        }
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
                    JSONObject json = new JSONObject();
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
