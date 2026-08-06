package com.sky.atc.easyformse.sensordetection;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.location.Location;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;

import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.sky.atc.easyformse.R;
import com.sky.atc.easyformse.sqlitewraper;

import net.sqlcipher.database.SQLiteDatabase;


public class SafetyDetectionService extends Service implements SensorEventListener {


    private SensorManager sensorManager;
    private Sensor accelerometer;
    private Sensor gyroscope;

    private FusedLocationProviderClient fusedLocationClient;
    private LocationCallback locationCallback;

    private double speed = 0;
    private double lastSpeed = 0;

    private Double lat = null;
    private Double lng = null;

    private Handler handler;

    private Vibrator vibrator;

    private boolean freeFallDetected = false;
    private boolean fallImpactDetected = false;

    private long freeFallTime = 0;
    private long fallImpactTime = 0;
    private boolean crashImpactDetected = false;

    private long crashImpactTime = 0;

    private float gyroMag = 0f;
    private float lastAccel = 0f;
    private boolean alertSent = false;
    private static final String CHANNEL_ID =
            "SafetyDetectionChannel";

    // Fall Detection

    private static final float FREE_FALL_THRESHOLD = 3.0f;
    private static final float INACTIVITY_THRESHOLD = 1.5f;
    private static final long IMPACT_WINDOW = 1000;
    private static final long INACTIVITY_TIME = 5000;
    // Crash Detection
    float IMPACT_THRESHOLD ; // 22f
    private static final float GYRO_THRESHOLD = 3.0f;
    private static final double MOVING_SPEED = 25.0;
    private static final double STOPPED_SPEED = 1.5;
    private static SQLiteDatabase database = sqlitewraper.getDatabase();
    String fall_detection_value;
    @Override
    public void onCreate() {

        super.onCreate();

        handler = new Handler(Looper.getMainLooper());

        createNotificationChannel();

        startForeground(9991, createNotification());

        sensorManager = (SensorManager) getSystemService(SENSOR_SERVICE);

        accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);

        gyroscope = sensorManager.getDefaultSensor(Sensor.TYPE_GYROSCOPE);


        Cursor a_t3 = database
                .rawQuery(
                        "select fall_detection from Thresold",
                        null);
        a_t3.moveToFirst();

        if (a_t3.getCount() > 0) {
         fall_detection_value = a_t3.getString(0);


        }
        a_t3.close();

        if(fall_detection_value == null || fall_detection_value.equalsIgnoreCase("null") || fall_detection_value.equalsIgnoreCase("") || fall_detection_value.equalsIgnoreCase("0"))
        {
            IMPACT_THRESHOLD = 22f;
        }
        else {
            IMPACT_THRESHOLD = Float.parseFloat(fall_detection_value);
        }

        if (accelerometer != null) {

            sensorManager.registerListener(
                    this,
                    accelerometer,
                    SensorManager.SENSOR_DELAY_GAME
            );
        }

        if (gyroscope != null) {

            sensorManager.registerListener(
                    this,
                    gyroscope,
                    SensorManager.SENSOR_DELAY_GAME
            );
        }

        fusedLocationClient =
                LocationServices
                        .getFusedLocationProviderClient(this);

        startLocationUpdates();
    }

    @Override
    public void onSensorChanged(SensorEvent event) {

        if (event.sensor.getType()
                == Sensor.TYPE_ACCELEROMETER) {

            handleFallDetection(event);

            handleCrashDetection(event);
        }

        if (event.sensor.getType()
                == Sensor.TYPE_GYROSCOPE) {

            handleGyroscope(event);
        }
    }

    private void handleGyroscope(SensorEvent event) {

        float gx = event.values[0];
        float gy = event.values[1];
        float gz = event.values[2];

        gyroMag = (float) Math.sqrt(gx * gx + gy * gy + gz * gz);
    }


    private void handleFallDetection(
            SensorEvent event
    ) {

        float x = event.values[0];
        float y = event.values[1];
        float z = event.values[2];

        float acceleration = (float) Math.sqrt(x * x + y * y + z * z);

        long now = System.currentTimeMillis();

        if (acceleration > 40f) {

            resetFallDetection();

            return;
        }

        // Free fall

        if (!freeFallDetected &&
                acceleration < FREE_FALL_THRESHOLD) {

            freeFallDetected = true;

            freeFallTime = now;
        }

        // Impact after free fall

        if (freeFallDetected &&
                acceleration > IMPACT_THRESHOLD &&
                (now - freeFallTime) < IMPACT_WINDOW) {

            fallImpactDetected = true;

            fallImpactTime = now;

            freeFallDetected = false;
        }

        // Inactivity after impact

        if (fallImpactDetected) {

            long inactivityDuration =
                    now - fallImpactTime;

            float movement =
                    Math.abs(acceleration - 9.8f);

            if (inactivityDuration >
                    INACTIVITY_TIME &&
                    movement < INACTIVITY_THRESHOLD) {

                triggerAlert("Fall Detected");

                resetFallDetection();
            }
        }
    }

    private void handleCrashDetection(
            SensorEvent event
    ) {

        float x = event.values[0];
        float y = event.values[1];
        float z = event.values[2];

        double acceleration =
                Math.sqrt(
                        x * x +
                                y * y +
                                z * z
                );

        lastAccel = (float) acceleration;

        if (acceleration > IMPACT_THRESHOLD) {

            crashImpactDetected = true;

            crashImpactTime =
                    System.currentTimeMillis();
        }

        evaluateCrash();
    }

    private void evaluateCrash() {

        if (!crashImpactDetected || alertSent) {
            return;
        }

        boolean rotation =
                gyroMag > GYRO_THRESHOLD;

        boolean speedDrop =
                lastSpeed > MOVING_SPEED &&
                        speed < STOPPED_SPEED;

        boolean stopped =
                speed < STOPPED_SPEED;

        boolean stillness =
                lastAccel < 1.2f;

        int score = 40;

        if (rotation) score += 20;

        if (speedDrop) score += 25;

        if (stopped) score += 10;

        if (stillness) score += 10;

        // Phone drop filter

        if (speed < 5 && !speedDrop) {

            crashImpactDetected = false;

            return;
        }

        if (score >= 70) {

            crashImpactDetected = false;

            triggerAlert("Crash Detected");
        }
    }

    private void triggerAlert(String type) {

        if (alertSent) {
            return;
        }

        alertSent = true;

        startVibration();

        Toast.makeText(
                this,
                type + "! Sending alert...",
                Toast.LENGTH_LONG
        ).show();

        Intent intent =
                new Intent(
                        this,
                        FallAlertActivity.class
                );

        intent.putExtra("alert_type", type);

        intent.addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK |
                        Intent.FLAG_ACTIVITY_CLEAR_TOP
        );

        startActivity(intent);

        handler.postDelayed(() -> {

            alertSent = false;

        }, 10000);
    }

    private void startVibration() {

        vibrator =
                (Vibrator) getSystemService(
                        Context.VIBRATOR_SERVICE
                );

        if (vibrator == null) {
            return;
        }

        if (Build.VERSION.SDK_INT
                >= Build.VERSION_CODES.O) {

            VibrationEffect effect =
                    VibrationEffect.createWaveform(
                            new long[]{
                                    0,
                                    500,
                                    500
                            },
                            0
                    );

            vibrator.vibrate(effect);

        } else {

            vibrator.vibrate(
                    new long[]{
                            0,
                            500,
                            500
                    },
                    0
            );
        }
    }


    private void startLocationUpdates() {

        LocationRequest request =
                LocationRequest.create()
                        .setInterval(2000)
                        .setFastestInterval(1000)
                        .setPriority(
                                LocationRequest
                                        .PRIORITY_HIGH_ACCURACY
                        );

        if (ActivityCompat.checkSelfPermission(
                this,
                Manifest.permission.ACCESS_FINE_LOCATION
        ) != PackageManager.PERMISSION_GRANTED
                &&
                ActivityCompat.checkSelfPermission(
                        this,
                        Manifest.permission.ACCESS_COARSE_LOCATION
                ) != PackageManager.PERMISSION_GRANTED) {

            return;
        }

        locationCallback =
                new LocationCallback() {

                    @Override
                    public void onLocationResult(
                            @NonNull LocationResult result
                    ) {

                        for (Location location
                                : result.getLocations()) {

                            lastSpeed = speed;

                            speed =
                                    location.getSpeed() * 3.6;

                            lat =
                                    location.getLatitude();

                            lng =
                                    location.getLongitude();
                        }
                    }
                };

        fusedLocationClient.requestLocationUpdates(
                request,
                locationCallback,
                Looper.getMainLooper()
        );
    }



    private void resetFallDetection() {

        freeFallDetected = false;

        fallImpactDetected = false;

        freeFallTime = 0;

        fallImpactTime = 0;
    }



    private Notification createNotification() {

        return new NotificationCompat.Builder(
                this,
                CHANNEL_ID
        )
                .setContentTitle(
                        "Safety Detection Active"
                )
                .setContentText(
                        "Monitoring crashes and falls..."
                )
                .setSmallIcon(R.drawable.atc_logo)
                .setPriority(
                        NotificationCompat.PRIORITY_LOW
                )
                .setOngoing(true)
                .setSilent(true)
                .build();
    }



    private void createNotificationChannel() {

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {

            @SuppressLint("WrongConstant") NotificationChannel channel =
                    new NotificationChannel(CHANNEL_ID,
                            "Safety Detection",
                            NotificationManager.IMPORTANCE_MIN);

            channel.setDescription("Foreground service for crash and fall detection");

            NotificationManager manager = getSystemService(NotificationManager.class);

            if (manager != null) {

                manager.createNotificationChannel(
                        channel
                );
            }
        }
    }


    @Override
    public int onStartCommand(
            Intent intent,
            int flags,
            int startId
    ) {

        return START_STICKY;
    }


    @Override
    public void onDestroy() {

        super.onDestroy();

        if (sensorManager != null) {

            sensorManager.unregisterListener(this);
        }

        if (fusedLocationClient != null
                &&
                locationCallback != null) {

            fusedLocationClient.removeLocationUpdates(
                    locationCallback
            );
        }
    }


    @Nullable
    @Override
    public IBinder onBind(Intent intent) {

        return null;
    }

    @Override
    public void onAccuracyChanged(
            Sensor sensor,
            int accuracy
    ) {

    }
}

