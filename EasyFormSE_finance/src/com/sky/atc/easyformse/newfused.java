/***
 * Copyright (c) 2010 CommonsWare, LLC
 * <p>
 * Licensed under the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License. You may obtain
 * a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.sky.atc.easyformse;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.ActivityManager;
import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.os.StrictMode;
import android.os.SystemClock;
import android.provider.Settings;

import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import android.telephony.PhoneStateListener;
import android.telephony.TelephonyCallback;
import android.telephony.TelephonyManager;
import android.util.Log;

import com.commonsware.cwac.wakeful.WakefulIntentService;
import com.google.android.gms.common.api.GoogleApiClient;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.sky.atc.easyformse.datautils.DataUtils;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.location.SpeedCalculation;
import com.sky.atc.easyformse.trip.TripMapUtils;

import net.sqlcipher.Cursor;
import net.sqlcipher.database.SQLiteDatabase;

import org.json.JSONObject;

import java.util.Timer;
import java.util.TimerTask;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;

import java.util.Queue;
import java.util.concurrent.ConcurrentLinkedQueue;

/**
 * Service providing the guts of the location polling engine. Uses a WakeLock to
 * ensure the CPU stays on while the location lookup is going on. Handles both
 * successful and timeout conditions.
 * <p>
 * Those wishing to leverage this service should do so via the LocationPoller
 * class.
 */
@StringFogIgnore
public class newfused extends Service implements LocationListener {
    private static final String LOCK_NAME_STATIC = "com.commonsware.cwac.locpoll.LocationPoller";
    static int mockalert = 1;
    private static volatile PowerManager.WakeLock lockStatic = null;
    LocationRequest mLocationRequest;
    private PowerManager.WakeLock lock;
    LocationRequest request;
    data d = new data();
    private SQLiteDatabase database;
    // meters
    GoogleApiClient mGoogleApiClient;
    MySharedPreferences pref;
    String lat_check;
    //Editor editor;
    int check = 0;
    private BroadcastReceiver whatsappCallReceiver;

    NotificationChannel mChannel = null;
    String CHANNEL_ID = "my_channel_01";

    MySharedPreferences sharedPreferences;
    private final static int DELAY = 30000;
    private Timer timer = new Timer();

    //New Location Method
    private FusedLocationProviderClient fusedLocationClient;
    private static LocationCallback locationCallback;
    private LocationRequest locationRequest;
    /**
     * Lazy-initializes the WakeLock when we first use it. We use a partial
     * WakeLock since we only need the CPU on, not the screen.
     */

    private TelephonyManager telephonyManager;

    private PhoneStateListener phoneStateListener;
    private TelephonyCallback telephonyCallback;

//    private  boolean callActive = false;

    private  long callStartTime = 0;
    private  long callEndTime = 0;
    private Location latestLocation;

    private Location callStartLocation;
    private Location callEndLocation;
    private boolean isCallListenerRegistered = false;
    private int lastCallState = -1;

    private float callStartSpeed = 0f;
    private float maxSpeedDuringCall = 0f;
    private long maxSpeedMilli = 0L;
    private boolean speedViolation ;
    private boolean callEventInserted = false;
    private static float CALL_SPEED_LIMIT = 15;
    private boolean simCallActive = false;
    private boolean whatsappCallActive = false;

    // Sensor Fusion
    private SensorManager sensorManager;
    private Sensor accelerometer, gyroscope;
    private SensorEventListener sensorListener;
    private KalmanFilter2D kalmanFilter;
    private Handler fusionHandler = new Handler(Looper.getMainLooper());
    private Runnable fusionLoop;
    private final Queue<IMUSample> imuQueue = new ConcurrentLinkedQueue<>();
    private Location lastAcceptedLocation = null;
    private static Location lastvalidfortripend = null;
    private static final int MAX_IMU_QUEUE_SIZE = 500;
    @SuppressLint("InvalidWakeLockTag")
    synchronized private static PowerManager.WakeLock getLock(Context context) {
        if (lockStatic == null) {
            PowerManager mgr = (PowerManager) context.getApplicationContext()
                    .getSystemService(Context.POWER_SERVICE);

            if (mgr != null) {
                lockStatic = mgr.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK,
                        LOCK_NAME_STATIC);
            }
            lockStatic.setReferenceCounted(true);
        }

        return (lockStatic);
    }


    /**
     * No-op implementation as required by superclass
     */
    @Override
    public IBinder onBind(Intent i) {
        return (null);
    }

    @SuppressLint("WrongConstant")
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
        StrictMode.setThreadPolicy(policy);
        lock = getLock(this.getApplicationContext());
        database = sqlitewraper.getDatabase();
        Log.d("NITNEWFUSED", "onstartcommand");
        pref = sqlitewraper.getSecureShared("MyPref");

        //new service updatemilli
        checkServicemilli();
        startServUpdateTask();
        registerCallListener();
       // registerWhatsAppCallReceiver();
        initSensorFusion();
        boolean isuploadlastentry = pref.getBoolean("isuploadlastentry",false);
//        check location and upload in server
        if(!isuploadlastentry) {
            //new service updatemilli

            start_alaramManager();
        }

        sharedPreferences = sqlitewraper.getSecureShared("pre1");
        lat_check = pref.getString("lat_status_flag", "k2");

        if (!lock.isHeld() || (flags & START_FLAG_REDELIVERY) != 0) {
            lock.acquire();
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            CharSequence name = "Easyform";// The user-visible name of the channel.
            int importance = NotificationManager.IMPORTANCE_HIGH;
            mChannel = new NotificationChannel(CHANNEL_ID, name, importance);

        }

        insert("new_fused_start");
        Notification notification = new NotificationCompat.Builder(sqlitewraper.context)
                .setSmallIcon(R.drawable.atc_logo)
                .setContentTitle(DeviceEventsUtils.getPackagename().get(0))
                .setContentText(DeviceEventsUtils.getPackagename().get(2))
                .setAutoCancel(false)
                .setChannelId(CHANNEL_ID)
                .setOngoing(true)
                .build();

        NotificationManager notificationCompatManager =
                (NotificationManager) getSystemService(NOTIFICATION_SERVICE);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            notificationCompatManager.createNotificationChannel(mChannel);
        }
        startForeground(1025, notification);

        LocationManager locationManager = (LocationManager) this
                .getSystemService(Context.LOCATION_SERVICE);
        ConnectivityManager conMgr = (ConnectivityManager) sqlitewraper.context
                .getSystemService(Context.CONNECTIVITY_SERVICE);

        if ((!(sqlitewraper.internetflag == 1))
                && (!(conMgr.getNetworkInfo(0).getState() == NetworkInfo.State.CONNECTED || conMgr
                .getNetworkInfo(1).getState() == NetworkInfo.State.CONNECTING))
                && (!locationManager
                .isProviderEnabled(LocationManager.GPS_PROVIDER))

        ) {
            getLocation();
        } else {
            getLocation();
        }

        return (START_STICKY);
    }

    //create and start the location update
    public void getLocation() {
        try {
//            if (!isGooglePlayServicesAvailable()) {
//                System.out.print("Google play service not available");
//            } else {
//                createLocationRequest();
//                database = sqlitewraper.getDatabase();
//
//                mGoogleApiClient = new GoogleApiClient.Builder(
//                        sqlitewraper.context).addApi(LocationServices.API)
//                        .addConnectionCallbacks(this)
//                        .addOnConnectionFailedListener(this).build();
//
//                mGoogleApiClient.connect();
//
//            }

            //New Location Method

            fusedLocationClient = LocationServices.getFusedLocationProviderClient(this);
            locationRequest = createLocationRequestNew();
            onLocationChanged();
            startLocationUpdates();

        } catch (Exception e) {
            Log.d("NEWFUSED", e.getMessage());
        }

    }


    private void stopLocationUpdates() {
        if (fusedLocationClient != null && locationCallback != null) {
            fusedLocationClient.removeLocationUpdates(locationCallback);
        }
        if (locationManager != null) {
            try {
                locationManager.removeUpdates(newfused.this);
            } catch (Exception e) {
                Log.e("NEW_FUSED", "Error removing GPS updates", e);
            }
        }
    }

    public boolean isMockAvailable(Location location) {

        boolean mock = false;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR2) {
            mock = location.isFromMockProvider();
        } else {
            mock = !Settings.Secure.getString(getApplicationContext().getContentResolver(), "mock_location").equals("0");
        }

        if (mock) {

            new Handler(Looper.getMainLooper()).post(new Runnable() {
                public void run() {
//                        Toast toast = Toast.makeText(sqlitewraper.context, "You Are Using Fake Location", Toast.LENGTH_LONG);
//                        toast.show();
                    if (!B_new.isIsInBackgeound()) {
                        mockalert++;
                    }
                }
            });
        } else {

            new Handler(Looper.getMainLooper()).post(new Runnable() {
                public void run() {
//                        Toast toast = Toast.makeText(sqlitewraper.context, "Real Location :", Toast.LENGTH_LONG);
//                        toast.show();
                    mockalert = 0;
                }
            });
        }
        return mock;
    }

    void quite() {
        if (lock != null && lock.isHeld()) {
            lock.release();
        }
    }

    @Override
    public void onDestroy() {
        // TODO Auto-generated method stub
        super.onDestroy();
        insert("new_fused_stop");
        stopLocationUpdates();
        if (timer != null) {
            timer.cancel();
        }
        imuQueue.clear();
        quite();
        unregisterphonestate();
        if (whatsappCallReceiver != null) {

            try {
                unregisterReceiver(whatsappCallReceiver);
            } catch (Exception e) {
                Log.e("WHATSAPP_CALL", "Receiver unregister error", e);
            }

            whatsappCallReceiver = null;
        }

        if (fusionHandler != null && fusionLoop != null) {
            fusionHandler.removeCallbacks(fusionLoop);
        }
        if (sensorManager != null && sensorListener != null) {
            sensorManager.unregisterListener(sensorListener);
        }
    }

    private void initSensorFusion() {
        if (sensorManager != null && sensorListener != null) {
            return; // Prevent duplicate registration on multiple onStartCommand calls
        }
        sensorManager = (SensorManager) getSystemService(SENSOR_SERVICE);
        if (sensorManager == null) return;
        // Use LINEAR_ACCELERATION (gravity removed) if available, otherwise fallback to ACCELEROMETER
        accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_LINEAR_ACCELERATION);
        if (accelerometer == null) {
            accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
        }
        gyroscope = sensorManager.getDefaultSensor(Sensor.TYPE_GYROSCOPE);
        sensorListener = new SensorEventListener() {
            private float[] lastAccel = new float[3];
            private float[] lastGyro = new float[3];

            @Override
            public void onSensorChanged(SensorEvent event) {
                if (event.sensor.getType() == Sensor.TYPE_ACCELEROMETER ||
                        event.sensor.getType() == Sensor.TYPE_LINEAR_ACCELERATION) {
                    System.arraycopy(event.values, 0, lastAccel, 0, 3);
                } else if (event.sensor.getType() == Sensor.TYPE_GYROSCOPE) {
                    System.arraycopy(event.values, 0, lastGyro, 0, 3);
                }
                // Prevent memory leak if GPS is off: drop oldest if queue exceeds limit
                while (imuQueue.size() >= MAX_IMU_QUEUE_SIZE) {
                    imuQueue.poll();
                }
                imuQueue.offer(new IMUSample(lastAccel.clone(), lastGyro.clone(), event.timestamp));
            }
            @Override
            public void onAccuracyChanged(Sensor sensor, int accuracy) {}
        };
        if (accelerometer != null) {
            sensorManager.registerListener(sensorListener, accelerometer, SensorManager.SENSOR_DELAY_FASTEST);
        }
        if (gyroscope != null) {
            sensorManager.registerListener(sensorListener, gyroscope, SensorManager.SENSOR_DELAY_FASTEST);
        }
    }

    /**
     * IMU data is used as the Kalman prediction input when a new GPS/Fused
     * location arrives. We intentionally do NOT generate a synthetic
     * location every second from the Kalman state. Doing that can create
     * duplicate/artificial trip locations and incorrect speed calculations.
     */
    private void predictKalmanFromPendingImu() {
        if (kalmanFilter == null || !kalmanFilter.isInitialized() || imuQueue.isEmpty()) {
            return;
        }
        IMUSample sample;
        while ((sample = imuQueue.poll()) != null) {
            try {
                float[] gyroData = (sample.gyro != null && sample.gyro.length == 3) ? sample.gyro : new float[3];
                if (sample.accel != null && sample.accel.length == 3) {
                    kalmanFilter.predict(sample.accel, gyroData, sample.timestamp);
                }
            } catch (Exception e) {
                Log.e("KALMAN", "IMU prediction failed", e);
            }
        }
    }


    void insert(String type) {

        database = sqlitewraper.getDatabase();
        ContentValues t_i1 = new ContentValues();
        t_i1.put("f_name", type);
        t_i1.put("f_data", System.currentTimeMillis());
        long task_c = database.insert("upload_file_clone", null, t_i1);
        if (task_c > 0) {

        }
    }

    // Location callback used by the single active Fused Location pipeline.
    public void onLocationChanged() {
        locationCallback = new LocationCallback() {
            @Override
            public void onLocationResult(LocationResult locationResult) {
                if (locationResult == null) {
                    return;
                }

                for (Location location : locationResult.getLocations()) {
                    processLocation(location);
                }
            }
        };
    }

    /**
     * Single location processing pipeline:
     * raw GPS/Fused -> validation -> IMU prediction -> GPS Kalman correction
     * -> filtered location -> speed calculation -> trip processing.
     */
    void processLocation(Location location) {
        if (location == null) {
            return;
        }

        double rawLat = location.getLatitude();
        double rawLon = location.getLongitude();
        float accuracy = location.getAccuracy();


        try {
            boolean isMock = isMockAvailable(location);
            boolean mockLocationEnabled =
                    TripMapUtils.MOCKLOCATION.equalsIgnoreCase("true");

            if (!mockLocationEnabled && isMock) {
                Log.d("LOCATION_FILTER", "Rejected mock location");
                return;
            }
            if (kalmanFilter == null) {
                kalmanFilter = new KalmanFilter2D();
            }

            if (isBadTripLocation(location)) {

                return;
            }

            if (!kalmanFilter.isInitialized()) {
                kalmanFilter.init(rawLat, rawLon, location.getBearing());
                imuQueue.clear();
            } else {
                predictKalmanFromPendingImu();
                kalmanFilter.update(location);
            }
            Location filteredLocation = new Location(location);

            if (kalmanFilter != null && kalmanFilter.isInitialized()) {
                double[] pos = kalmanFilter.getPosition();

                if (pos != null && pos.length >= 2 &&
                        Double.isFinite(pos[0]) &&
                        Double.isFinite(pos[1]) &&
                        pos[0] >= -90.0 && pos[0] <= 90.0 &&
                        pos[1] >= -180.0 && pos[1] <= 180.0 &&
                        !(pos[0] == 0.0 && pos[1] == 0.0)) {

                    filteredLocation.setLatitude(pos[0]);
                    filteredLocation.setLongitude(pos[1]);
                }
            }


            float[] kalmanCorrection = new float[1];

            Location.distanceBetween(
                    rawLat,
                    rawLon,
                    filteredLocation.getLatitude(),
                    filteredLocation.getLongitude(),
                    kalmanCorrection
            );

            // Reject Kalman output if correction is implausibly large (> 100m)
            // Indicates filter state corruption (e.g., from mock locations)
            if (kalmanCorrection[0] > 100f) {
                Log.w("LOCATION_FILTER", "Kalman diverged (" + kalmanCorrection[0] + "m). Resetting.");
                filteredLocation.setLatitude(rawLat);
                filteredLocation.setLongitude(rawLon);
                // Re-initialize filter to clear corrupted state
                if (kalmanFilter != null) {
                    kalmanFilter.init(rawLat, rawLon, location.getBearing());
                    imuQueue.clear();
                }
            }
            // Initialize or update Kalman Filter


            lastAcceptedLocation = new Location(filteredLocation);
            lastvalidfortripend = new Location(filteredLocation); // use for trip end time
            latestLocation = new Location(filteredLocation);
            checkCallTimeSpeed(filteredLocation);


            float manualSpeed = SpeedCalculation.calculateSpeedBetweenPoints(filteredLocation);
            onLocationUpdate(filteredLocation, manualSpeed);

        } catch (Exception e) {
            Log.e("LOCATION_FILTER", "Location processing error", e);
        }
    }


    private boolean isBadTripLocation(Location location) {

        if (location == null) {
            return true;
        }

        double lat = location.getLatitude();
        double lng = location.getLongitude();

        // ---------------------------------------------
        // Invalid latitude / longitude
        // ---------------------------------------------

        if (lat == 0.0 || lng == 0.0 || lat < -90.0 || lat > 90.0 || lng < -180.0 ||
                lng > 180.0) {
            Log.d(
                    "LOCATION_FILTER",
                    "Reject invalid lat/lng"
            );

            return true;
        }



        // First location is OK
        if (lastAcceptedLocation == null) {
            return false;
        }


        long currentTime = location.getTime();

        long previousTime = lastAcceptedLocation.getTime();

        if (currentTime <= previousTime) {
            return true;
        }

        long timeDiff = currentTime - previousTime;

        if (timeDiff <= 0) {
            return true;
        }


        float[] distance =
                new float[1];

        Location.distanceBetween(
                lastAcceptedLocation.getLatitude(),
                lastAcceptedLocation.getLongitude(),
                lat,
                lng,
                distance
        );

        float distanceMeters =
                distance[0];


        if (distanceMeters < 3f) {

            Log.d("LOCATION_FILTER",
                    "Reject duplicate location: " +
                            distanceMeters +
                            " m"
            );

            return true;
        }

        return false;
    }

    public static Location getLatestValidLocation() {

        if (lastvalidfortripend == null) {
            return null;
        }

        return new Location(lastvalidfortripend);
    }

    LocationManager locationManager;

    @SuppressLint("MissingPermission")
    private void startLocationUpdates() {
        if (ActivityCompat.checkSelfPermission(
                this, Manifest.permission.ACCESS_FINE_LOCATION)
                != PackageManager.PERMISSION_GRANTED &&
                ActivityCompat.checkSelfPermission(
                        this, Manifest.permission.ACCESS_COARSE_LOCATION)
                        != PackageManager.PERMISSION_GRANTED) {
            Log.e("LOCATION", "Location permission not granted");
            return;
        }

        if (fusedLocationClient == null || locationCallback == null) {
            Log.e("LOCATION", "Fused location client/callback is null");
            return;
        }


        fusedLocationClient.requestLocationUpdates(
                locationRequest,
                locationCallback,
                Looper.getMainLooper()
        );

        Log.d("LOCATION", "Fused location updates started");
    }

    protected LocationRequest createLocationRequestNew() {
        LocationRequest locationRequest = LocationRequest.create();
        locationRequest.setInterval(5000);
        locationRequest.setFastestInterval(2000);
        locationRequest.setPriority(LocationRequest.PRIORITY_HIGH_ACCURACY);
        locationRequest.setSmallestDisplacement(10);

        return locationRequest;
    }

    private void checkCallTimeSpeed(Location location)
    {
        if (whatsappCallActive || simCallActive  )  {

            float currentSpeed = location.getSpeed() ;
//            Log.d("WHATSAPP_CALL",
//                    "simCallActive =" + simCallActive +  " whatsappCallActive =" + whatsappCallActive +
//                             " speedViolation=" + speedViolation +
//                            " speed=" + currentSpeed);
//            Log.d("WHATSAPP_CALL", "currentSpeed " + currentSpeed);
            String vehicaletype = pref.getString("vehicle_type","Private-2W");
            String call_event_speed_limit = "";
            android.database.Cursor a_t2 = database
                    .rawQuery(
                            "select call_event_speed_limit from Thresold_New WHERE vehicle_type =" + "'" + vehicaletype + "'" , null);


            if(a_t2.getCount() > 0)
            {
                a_t2.moveToFirst();
                call_event_speed_limit = a_t2.getString(0);
                a_t2.close();
            }

            if(call_event_speed_limit == null || call_event_speed_limit.equalsIgnoreCase("") || call_event_speed_limit.equalsIgnoreCase("null") || call_event_speed_limit.equalsIgnoreCase("0"))
            {
                CALL_SPEED_LIMIT = 15 ;  // call speed default is 15 km/h
            }
            else {
                CALL_SPEED_LIMIT = Float.parseFloat(call_event_speed_limit) ;
            }

            float fact = (float) 18 / 5;
            float ac_speed = currentSpeed * fact;

            if (ac_speed > CALL_SPEED_LIMIT) {
                Log.d("CALL", "speedViolation ");
                speedViolation = true;

            }
            if (currentSpeed > maxSpeedDuringCall) {
                maxSpeedDuringCall = currentSpeed;
                maxSpeedMilli = System.currentTimeMillis();
            }


        }
    }
    private void onLocationUpdate(Location location, float manualSpeed) {




        data d = new data();

        double lat1 = location.getLatitude();
        double lon1 = location.getLongitude();

        Log.d("NITNEWFUSED", String.valueOf(lat1));

        boolean mock = false;

        //avoid usage of mock location app
        if (TripMapUtils.MOCKLOCATION.equalsIgnoreCase("true")) {
            mock = isMockAvailable(location);
        }

        Log.d("##MOCKALERTUPPER_LATLON", String.valueOf(mockalert) + lat1 + ":" + lon1 + " MockLocationStatusNORMAL: " + mock);


        if (mock && !TripMapUtils.MOCKLOCATION.equalsIgnoreCase("true")) {
//            sqlitewraper.setFakeflag(1);
            Log.d("##MOCKALERTUPPER_NORMAL", String.valueOf(mockalert) + lat1 + ":" + lon1);

            //Brodcast to show alert dialog of fake location in ph_s.java
            Intent intent = new Intent("fake-location");
            LocalBroadcastManager.getInstance(sqlitewraper.context).sendBroadcast(intent);
            return;
        }

        Double lat = location.getLatitude();
        Double lon = location.getLongitude();
        float sd = (float) location.getAltitude();

        //----- For Testing Purpose---------------//
        float ac_speed = location.getSpeed();
        float fact = (float) ((float) 18 / 5);
        ac_speed = ac_speed * fact;

        //-------------Location insert----------------//
        String timemilli = String.valueOf(System.currentTimeMillis());

        Intent loc_change = new Intent(sqlitewraper.context, loc_change.class);

        //if manual speed is accurate than use manual speed instead of location provided speed
        if (manualSpeed != 10000) {
            location.setSpeed(manualSpeed);
            Log.d("##MY_SPEED_MANUAL :", String.valueOf(manualSpeed));
        }

        //  when mock location provider true, trip flag added 1 because fused location pot map not draw properly 07-04-2025
//        if(location.isFromMockProvider())
//        {
//            loc_change.putExtra("tripflag", "1");
//        }
//        else {
//            loc_change.putExtra("tripflag", "2");
//        }
        loc_change.putExtra("tripflag", "2");
        loc_change.putExtra("loc", location);
        loc_change.putExtra("address", "");
        loc_change.putExtra("speed", location.getSpeed());
        loc_change.putExtra("time", timemilli);

        //if speed is less than 118 km/h than process the location for further clculations
        if (location.getSpeed() < 33) {
            WakefulIntentService.sendWakefulWork(sqlitewraper.context, loc_change);
        }

        Intent i = new Intent();
        i.setAction("Location");
        i.putExtra("lat", lat);
        i.putExtra("lon", lon);
        i.putExtra("accuracy", location.getAccuracy());
        i.putExtra("speed", location.getSpeed());
        if (lat_check.equalsIgnoreCase("2")) {
            sqlitewraper.context.sendBroadcast(i);
        }

        pref.putString("lat_status_flag", "1");
        pref.putString("lat", String.valueOf(lat));
        pref.putLong("lat_status_out", System.currentTimeMillis());
        pref.putString("lon", String.valueOf(lon));
        pref.putString("accuracy", String.valueOf(location.getAccuracy()));
        pref.commit();

    }

    @Override
    public void onLocationChanged(@NonNull Location location) {
        // Kept for LocationListener compatibility. The service now uses the
        // Fused Location Provider as the single active location source.
        // If a GPS_PROVIDER callback is delivered by legacy code, process it
        // through the same single pipeline instead of duplicating logic.
        processLocation(location);
    }

    @Override
    public void onProviderDisabled(String provider) {
    }

    @Override
    public void onProviderEnabled(String provider) {
    }

    @Override
    public void onStatusChanged(String provider, int status, Bundle extras) {
        Log.d("checkIsFakeLocation sChanged: ", provider + " " + status + "" + extras.toString());

    }



    public void start_alaramManager()
    {
        AlarmManager alarmManager = (AlarmManager)sqlitewraper.context.getSystemService(Context.ALARM_SERVICE);
        PendingIntent pendingIntent;
        Intent intent = new Intent(sqlitewraper.context, newfused_recevier.class);
        // intent.setAction("Location_entry");
        int flags = PendingIntent.FLAG_CANCEL_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            flags = PendingIntent.FLAG_CANCEL_CURRENT | PendingIntent.FLAG_MUTABLE;
        }
        pendingIntent = PendingIntent.getBroadcast(sqlitewraper.context, 0, intent, flags);

        MySharedPreferences pref = sqlitewraper.getSecureShared("MyPref");
        pref.putBoolean("isuploadlastentry", true); // Saving string
        pref.commit();
        long intervalMillis = 10 * 60 * 1000; // 10 minutes
        long triggerTime = System.currentTimeMillis() + intervalMillis;

        alarmManager.setInexactRepeating(AlarmManager.RTC_WAKEUP, triggerTime, intervalMillis,pendingIntent);
    }

    private void updateServiceMilli() {

        pref = sqlitewraper.getSecureShared("MyPref");
//        editor = pref.edit();
        pref.putString("SERVICEUPDATE", String.valueOf(System.currentTimeMillis())); // Saving string
        pref.commit();
    }

    //to check if service is not running for specific period of time if trip is running
    private void checkServicemilli() {

        try{

            database = sqlitewraper.getDatabase();

            pref = sqlitewraper.getSecureShared("MyPref");
            String serviceupdate = pref.getString("SERVICEUPDATE", null);

            if (serviceupdate != null) {

                Log.d("####new_fused", "checkServicesmilli");
                Cursor tripflag = database.rawQuery(
                        "select * from lat_plug where trip_status = 0", null);
                tripflag.moveToFirst();
                int tripflagCount = tripflag.getCount();
                tripflag.close();

                if (tripflagCount > 0) {

                    if (!serviceupdate.equalsIgnoreCase("0")) {

                        long servicestart = System.currentTimeMillis();
                        long stopduration = servicestart - Long.valueOf(serviceupdate);

                        DataUtils.setServiceMilli(servicestart);

                        if (stopduration > 120000) {

                            boolean isInserted = DeviceEventsUtils.insertIntoEvents(serviceupdate, String.valueOf(servicestart), String.valueOf(stopduration), "Service_outage");
                            if (isInserted) {

                                pref = sqlitewraper.getSecureShared("MyPref");
                                pref.putString("SERVICEInsert","1");
                                pref.putString("SERVICEUPDATE", "0"); // Saving string
                                pref.commit();
                            }
                        }
                    }

                    //to check if trip service is running or not
                    Intent Autotripservice = new Intent(sqlitewraper.context,
                            AutoTripStopService.class);
                    WakefulIntentService.sendWakefulWork(sqlitewraper.context,
                            Autotripservice);
                }
            }
        }catch (Exception e){

            pref = sqlitewraper.getSecureShared("MyPref");
//                            editor = pref.edit();
            pref.putString("SERVICEUPDATE", "0"); // Saving string
            pref.commit();
        }
    }


    //timer for every 30 seconds to check if service is running or not
    private void startServUpdateTask() {

        if(timer != null) {
            timer.cancel();
        }
        timer = new Timer();
        final int counter = 0;

        timer.scheduleAtFixedRate(new TimerTask() {
            @Override
            public void run() {
                Log.d("NITNEWFUSED_GPS", String.valueOf(counter));
                checkServicemilli();
                updateServiceMilli();
            }
        }, DELAY, DELAY);
    }

    private boolean isMyServiceRunning(Context context, String Myservice) {
        ActivityManager manager = (ActivityManager) context
                .getSystemService(Context.ACTIVITY_SERVICE);
        for (ActivityManager.RunningServiceInfo service : manager
                .getRunningServices(Integer.MAX_VALUE)) {
            if (Myservice.equals(service.service.getClassName())) {

                return true;
            }
        }
        return false;
    }

    @SuppressLint("MissingPermission")
    private void registerCallListener() {

        if (isCallListenerRegistered) {
            Log.d("CALL", "Listener already registered");
            return;
        }


        telephonyManager = (TelephonyManager) getSystemService(Context.TELEPHONY_SERVICE);

        if (telephonyManager == null)
            return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {

            telephonyCallback = new MyTelephonyCallback();

            telephonyManager.registerTelephonyCallback(getMainExecutor(), telephonyCallback);

        } else {

            phoneStateListener =
                    new PhoneStateListener() {

                        @Override
                        public void onCallStateChanged(int state,
                                                       String phoneNumber) {

                            handleCallState(state);

                        }
                    };

            telephonyManager.listen(
                    phoneStateListener,
                    PhoneStateListener.LISTEN_CALL_STATE);

        }

        isCallListenerRegistered = true;

    }
    private  boolean isTripRunning() {

        try {

            Cursor tripCursor = database.rawQuery(
                    "select * from lat_plug where trip_status = 0",
                    null);

            boolean running = tripCursor.getCount() > 0;

            tripCursor.close();

            return running;

        } catch (Exception e) {

            return false;
        }
    }

    public  void handleCallState(int state) {
        Log.e("CALL_DEBUG", "State = " + state);
        if (state == lastCallState) {
            return;
        }

        lastCallState = state;

        if (!isTripRunning())
            return;

        switch (state) {

            case TelephonyManager.CALL_STATE_RINGING:

                Log.d("CALL", "Incoming Call");

                break;

            case TelephonyManager.CALL_STATE_OFFHOOK:

                if (!simCallActive) {

                    simCallActive = true;

                    callStartTime = System.currentTimeMillis();
                    callEventInserted = false;
                    speedViolation = false;
                    maxSpeedDuringCall = 0f;
                    maxSpeedMilli = 0L;

                    if (latestLocation != null) {
                        callStartLocation = new Location(latestLocation);
                       // callStartSpeed = callStartLocation.getSpeed();
//                        Log.d("CALL", "Start Time : " + callStartTime);
//                        Log.d("CALL", "Start Lat : " + callStartLocation.getLatitude());
//                        Log.d("CALL", "Start Lng : " + callStartLocation.getLongitude());
//                        Log.d("CALL", "callStartSpeed : " + callStartSpeed);
                    }

                }

                break;

            case TelephonyManager.CALL_STATE_IDLE:

                if (simCallActive) {

                    simCallActive = false;

                    callEndTime = System.currentTimeMillis();

                    if (latestLocation != null) {
                        callEndLocation = new Location(latestLocation);

//                        Log.d("CALL", "End Time : " + callEndTime);
//                        Log.d("CALL", "End Lat : " + callEndLocation.getLatitude());
//                        Log.d("CALL", "End Lng : " + callEndLocation.getLongitude());
                    }
                   // Log.d("CALL_DEBUG", "speedViolation at IDLE = " + speedViolation);
                    if (speedViolation && !callEventInserted)
                    {
                        long duration = (callEndTime - callStartTime) ;

//                    Log.d("CALL", "Duration : " + duration + " sec");
                        callEventInserted = true;
                        if (callStartLocation != null &&
                                callEndLocation != null) {

                            float meters =
                                    callStartLocation.distanceTo(callEndLocation);
                            double  distanceKm  = meters / 1000.0;
                        }

                         calleventinsert(
                                    callStartTime,
                                    String.valueOf(callEndTime),
                                    String.valueOf(duration),
                                    callEndLocation);

//                            Log.d("CALL","Start Speed : " + callStartSpeed);
//                            Log.d("CALL","Max Speed : " + maxSpeedDuringCall);
//                            Log.d("CALL","Max Speed Time : " + maxSpeedMilli);
//
//                            Log.d("CALL", "Distance : " + distanceKm  + " KM");


                        resetcalldata();
                        }
                        else {

                            Log.d("CALL","No speed violation during call.");
                        }



                }

                break;
        }

    }

 private void resetcalldata()
 {
     simCallActive = false;
     speedViolation = false;

     callStartLocation = null;
     callEndLocation = null;

     callStartTime = 0;
     callEndTime = 0;

     maxSpeedDuringCall = 0;
     maxSpeedMilli = 0;

     lastCallState = -1;
 }

    private boolean calleventinsert(long callstarttime, String callendtime, String duration,Location callEndLocation)
    {
        try{
            long currentTime = System.currentTimeMillis();
            ContentValues c = new ContentValues();
            c.put("username", d.getusername());
            c.put("Event_type", "Call");
            c.put("is_send", "0");
            c.put("lat", callEndLocation.getLatitude());
            c.put("lon", callEndLocation.getLongitude());
            //New added Code
            c.put("th_s", "Call");
            c.put("battery", DeviceEventsUtils.getBatteryInfo());
            c.put("timezone", DeviceEventsUtils.getTimeZone());
            c.put("utcstart", DeviceEventsUtils.utcCalculationOffset(callstarttime));
            c.put("utcend", DeviceEventsUtils.utcCalculationOffset(currentTime));
            c.put("imei", DeviceEventsUtils.getLoginDetails().get(1));
            c.put("appid", DeviceEventsUtils.getLoginDetails().get(2));
            c.put("userid", DeviceEventsUtils.getLoginDetails().get(0));
            c.put("Event_strt", callstarttime);
            c.put("Event_end", currentTime);
            c.put("duration", duration);

            JSONObject maxViolation = new JSONObject();
//            maxViolation.put("callStartSpeed", callStartSpeed);
            maxViolation.put("maxSpeedDuringCall", maxSpeedDuringCall);
            maxViolation.put("maxSpeedTime", maxSpeedMilli);

            c.put("maxviolation",maxViolation.toString());

            String tid = gettid();

            c.put("tid",tid);

//        Log.d("##SPEED_FINALDETECT", String.valueOf(ac_speed));
            long temp = database.insert("Events", null, c);
            if (temp > 0) {
                Intent z_n12 = new Intent(sqlitewraper.context, Event.class);
                WakefulIntentService.sendWakefulWork(sqlitewraper.context, z_n12);
                return true;

            }
            else {
                return false;
            }

        }
        catch (Exception e)
        {
            Log.d("Exception",e.toString());
        }
        return false;
    }

    public  String gettid(){

        android.database.Cursor tripflag = database.rawQuery("select tid from lat_plug where trip_status = 0", null);
        tripflag.moveToLast();
        int tripflagCount = tripflag.getCount();

        String tid = "0";

        if (tripflagCount>0){
            tid = tripflag.getString(0);
        }

        tripflag.close();
        return tid;
    }
    private void unregisterphonestate()
    {
        if (telephonyManager != null) {

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {

                if (telephonyCallback != null) {
                    telephonyManager.unregisterTelephonyCallback(telephonyCallback);
                }

            } else {

                if (phoneStateListener != null) {
                    telephonyManager.listen(phoneStateListener,
                            PhoneStateListener.LISTEN_NONE);
                }
            }
        }

        isCallListenerRegistered = false;
        lastCallState = -1;
    }

    @RequiresApi(api = Build.VERSION_CODES.S)
    private  class MyTelephonyCallback
            extends TelephonyCallback
            implements TelephonyCallback.CallStateListener {

        @Override
        public void onCallStateChanged(int state) {
            Log.e("CALL_STATE", "TelephonyCallback state = " + state);
            handleCallState(state);

        }
    }

    @SuppressLint("WrongConstant")
    private void registerWhatsAppCallReceiver() {

        if (whatsappCallReceiver != null) {
            return;
        }

        whatsappCallReceiver =
                new BroadcastReceiver() {

                    @Override
                    public void onReceive(
                            Context context,
                            Intent intent) {

                        if (intent == null) {
                            return;
                        }

                        String action = intent.getAction();
                        Log.d("WHATSAPP_CALL",
                                "action = "
                                        + action);
                        if (VoipNotificationService.ACTION_WHATSAPP_CALL.equals(action)) {
                            String state = intent.getStringExtra(VoipNotificationService.EXTRA_CALL_STATE);

                            Log.d("WHATSAPP_CALL",
                                    "newfused received = "
                                            + state);

                            if (VoipNotificationService.CALL_STARTED.equals(state)) {

                                handleWhatsAppCallStart();

                            } else if (VoipNotificationService.CALL_ENDED.equals(state)) {

                                handleWhatsAppCallEnd();
                            }
                        }

                        if (VoipNotificationService.ACTION_Teams_CALL.equals(action)) {
                            String state = intent.getStringExtra(VoipNotificationService.EXTRA_CALL_STATE);

                            Log.d("WHATSAPP_CALL",
                                    "newfused received = "
                                            + state);

                            if (VoipNotificationService
                                    .CALL_STARTED
                                    .equals(state)) {

                                handleWhatsAppCallStart();

                            } else if (VoipNotificationService
                                    .CALL_ENDED
                                    .equals(state)) {

                                handleWhatsAppCallEnd();
                            }
                        }




                    }
                };

        IntentFilter filter = new IntentFilter(VoipNotificationService.ACTION_WHATSAPP_CALL);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {

            registerReceiver(whatsappCallReceiver, filter, Context.RECEIVER_NOT_EXPORTED);

        } else {

            registerReceiver(whatsappCallReceiver, filter);
        }

//        Log.d("WHATSAPP_CALL",
//                "Receiver registered");
    }

    private void handleWhatsAppCallStart() {

        if (!isTripRunning()) {

            Log.d("WHATSAPP_CALL", "Trip not running - ignore START");

            return;
        }

        if (whatsappCallActive) {

            Log.d("WHATSAPP_CALL", "Call already active - ignore START");

            return;
        }

        whatsappCallActive = true;

        callStartTime = System.currentTimeMillis();

        callEndTime = 0;

        speedViolation = false;

        maxSpeedDuringCall = 0f;

        maxSpeedMilli = 0L;

        callStartLocation = null;

        callEndLocation = null;

        if (latestLocation != null) {

            callStartLocation =
                    new Location(latestLocation);
        }

        Log.d("WHATSAPP_CALL", "START");

        Log.d("WHATSAPP_CALL", "Start Time = " + callStartTime);

        if (callStartLocation != null) {

            Log.d("WHATSAPP_CALL", "Start Lat = " + callStartLocation.getLatitude());

            Log.d("WHATSAPP_CALL", "Start Lng = " + callStartLocation.getLongitude());

            Log.d("WHATSAPP_CALL", "Start Speed = " + callStartLocation.getSpeed());
        }
    }

    private void handleWhatsAppCallEnd() {

        if (!whatsappCallActive) {

            Log.d("WHATSAPP_CALL", "No active call - ignore END");

            return;
        }

        callEndTime = System.currentTimeMillis();

        if (latestLocation != null) {

            callEndLocation = new Location(latestLocation);
        }

        Log.d("WHATSAPP_CALL", "END");

        Log.d("WHATSAPP_CALL", "End Time = " + callEndTime);

        Log.d("WHATSAPP_CALL", "speedViolation = " + speedViolation);

        /*
         * Insert ONLY if speed exceeded
         * the configured call speed limit.
         */
        if (speedViolation
                && callStartLocation != null
                && callEndLocation != null) {

            long duration = callEndTime - callStartTime;

            float meters = callStartLocation.distanceTo(callEndLocation);

            double distanceKm = meters / 1000.0;

            Log.d("WHATSAPP_CALL", "Duration = " + duration);

            //Log.d("WHATSAPP_CALL", "Distance = " + distanceKm + " KM");

            boolean inserted = calleventinsert(callStartTime, String.valueOf(callEndTime), String.valueOf(duration), callEndLocation);

            Log.d("WHATSAPP_CALL", "Event inserted = " + inserted);
        } else {

            Log.d("WHATSAPP_CALL", "No speed violation - no event");
        }

        resetWhatsAppCallData();
    }

    private void resetWhatsAppCallData() {

        whatsappCallActive = false;

        speedViolation = false;

        callStartTime = 0L;

        callEndTime = 0L;

        callStartLocation = null;

        callEndLocation = null;

        maxSpeedDuringCall = 0f;

        maxSpeedMilli = 0L;
    }


    @Override
    public void onTaskRemoved(Intent rootIntent) {
        super.onTaskRemoved(rootIntent);

        try {
            boolean isTripRunning = isTripRunning();

            if (isTripRunning ) {
                scheduleServiceRestart();
            }
        } catch (Exception e) {
            Log.e("NEWFUSED", "Error in onTaskRemoved auto-restart: " + e.getMessage());
        }
    }

    private void scheduleServiceRestart() {
        Intent restartServiceIntent = new Intent(getApplicationContext(), ServiceRestarter.class);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        PendingIntent restartServicePendingIntent = PendingIntent.getBroadcast(
                getApplicationContext(),
                1,
                restartServiceIntent,
                flags
        );

        AlarmManager alarmManager = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
        if (alarmManager != null) {
            long triggerAtMillis = SystemClock.elapsedRealtime() + (15 * 60 * 1000);

            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(
                        AlarmManager.ELAPSED_REALTIME_WAKEUP,
                        triggerAtMillis,
                        restartServicePendingIntent
                );
            } else {
                alarmManager.setExact(
                        AlarmManager.ELAPSED_REALTIME_WAKEUP,
                        triggerAtMillis,
                        restartServicePendingIntent
                );
            }
        }
    }
}
