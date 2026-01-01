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

import java.util.Timer;
import java.util.TimerTask;

import android.annotation.SuppressLint;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.pm.PackageManager;
import android.location.Location;
import android.app.Service;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;

import net.sqlcipher.Cursor;
import net.sqlcipher.database.SQLiteDatabase;

import android.location.LocationListener;
import android.location.LocationManager;
import android.net.ConnectivityManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.os.StrictMode;
import android.provider.Settings;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import android.util.Log;

import com.commonsware.cwac.wakeful.WakefulIntentService;
import com.google.android.gms.common.api.GoogleApiClient;
import com.sky.atc.easyformse.datautils.DataUtils;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.trip.TripMapUtils;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;


/**
 * Service providing the guts of the location polling engine. Uses a WakeLock to
 * ensure the CPU stays on while the location lookup is going on. Handles both
 * successful and timeout conditions.
 * <p>
 * Those wishing to leverage this service should do so via the LocationPoller
 * class.
 */
@StringFogIgnore
public class newfused_gps extends Service {
//    private static final String LOCK_NAME_STATIC = "com.commonsware.cwac.locpoll.LocationPoller";
//
//    private static volatile PowerManager.WakeLock lockStatic = null;
//    private Handler handler = new Handler();
//    private Runnable onTimeout = null;
//    private Intent bintent;
//
//    private PowerManager.WakeLock lock;
//    Location mCurrentLocation;
//    LocationManager locationManager;
//
//    data d = new data();
//    static String m12;
//    private SQLiteDatabase database;
//    private Location mLastLocation;
//    private boolean running = true;
//
//    private static final long INTERVAL = 60000;
//    private static final long FASTEST_INTERVAL = 120000;
//
//    private static final long millis = 130000;
//    private static final long MIN_DISTANCE_CHANGE_FOR_UPDATES = 800; // 10
//    // meters
//    GoogleApiClient mGoogleApiClient;
//    private static final String TAG = "Fused_location";
//
//    static int mockalert = 0;
//
//    private static int TIMEOUT = 25000;
//
//    // meters
//
//    MySharedPreferences pref;
//    String lat_check;
//
////    Editor editor;
//    int check = 0;
//    int apiLevel;
//
//    private int resflag = 0;
//    private int alertflag = 0;
//
//    //For Timer
//
//    private final static int DELAY = 30000;
//    private Timer timer = new Timer();
//
//    NotificationChannel mChannel = null;
//    String CHANNEL_ID = "my_channel_01";


    /**
     * Lazy-initializes the WakeLock when we first use it. We use a partial
     * WakeLock since we only need the CPU on, not the screen.
     */
//    @SuppressLint("InvalidWakeLockTag")
//    synchronized private static PowerManager.WakeLock getLock(Context context) {
//        if (lockStatic == null) {
//            PowerManager mgr = (PowerManager) context.getApplicationContext()
//                    .getSystemService(Context.POWER_SERVICE);
//
//            if (mgr != null) {
//                lockStatic = mgr.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK,
//                        LOCK_NAME_STATIC);
//            }
//            lockStatic.setReferenceCounted(true);
//        }
//
//        return (lockStatic);
//    }

    @Override
    public IBinder onBind(Intent i) {
        return (null);
    }


    /**
     * Validates the required extras (EXTRA_PROVIDER and EXTRA_INTENT). If
     * valid, updates the Intent to be broadcast with the application's own
     * package (required to keep the broadcast within this application, so we do
     * not leak security information). Then, forks a PollerThread to do the
     * actual location lookup.
     *
     * @return START_REDELIVER_INTENT to ensure we get the last request again
     */
//    @SuppressLint("WrongConstant")
//    @Override
//    public int onStartCommand(Intent intent, int flags, int startId) {
//        lock = getLock(this.getApplicationContext());
//        StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
//        StrictMode.setThreadPolicy(policy);
//        pref = sqlitewraper.getSecureShared("MyPref");
////        editor = pref.edit();
//        lat_check = pref.getString("lat_status_flag", "k2");
//
//        if (!lock.isHeld() || (flags & START_FLAG_REDELIVERY) != 0) {
//            lock.acquire();
//        }
//
//        Log.d("NITNEWFUSED_GPS", "onstartcommand");
//
//        //new service updatemilli
//        checkServicemilli();
//        startServUpdateTask();
//
//        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
//            CharSequence name = "Easyform";// The user-visible name of the channel.
//            int importance = NotificationManager.IMPORTANCE_HIGH;
//            mChannel = new NotificationChannel(CHANNEL_ID, name, importance);
//
//        }
//
//
//        insert("new_fused_start");
//        Notification notification = new NotificationCompat.Builder(sqlitewraper.context)
//                .setSmallIcon(R.drawable.atc_logo)
//                .setContentTitle(DeviceEventsUtils.getPackagename().get(0))
//                .setContentText(DeviceEventsUtils.getPackagename().get(1))
//                .setAutoCancel(false)
//                .setOngoing(true)
//                .setChannelId(CHANNEL_ID)
//                .build();
//
//        NotificationManager notificationCompatManager =
//                (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
//
//        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
//            notificationCompatManager.createNotificationChannel(mChannel);
//        }
//
//        startForeground(1026, notification);
//
//
//        // --------------------check whether gps or wi-fi start
//        // -----------------------------//
//        locationManager = (LocationManager) this
//                .getSystemService(Context.LOCATION_SERVICE);
//        ConnectivityManager conMgr = (ConnectivityManager) sqlitewraper.context
//                .getSystemService(Context.CONNECTIVITY_SERVICE);
//
//        if ((locationManager
//                .isProviderEnabled(LocationManager.GPS_PROVIDER))
//
//                ) {
//
//            LocationListener locationListener = new MyLocationListener();
//            if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
//            }
//
//            locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 5000, 80, locationListener);
//
//
//        } else {
//
//        }
//
//        return (START_STICKY);
//    }
//
//
//
//    void quite() {
//        if (lock.isHeld()) {
//            lock.release();
//        }
//        if (d.getGplay_ser() == 1) {
//            d.setGplay_ser(0);
//        }
//    }
//
//
//    private class MyLocationListener implements LocationListener {
//
//        @Override
//        public void onLocationChanged(Location location) {
//
//            // toBroadcast.setAction("maddy");
//            data d = new data();
//
//            boolean mock=false;
//
//            //to check if fake location is true or not
//            if (TripMapUtils.MOCKLOCATION.equalsIgnoreCase("true")){
//                mock = isMockAvailable(location);
//            }
//
//
//            if (mock) {
//                return;
//            } else {
//
//
//                if (location.getSpeed() < 33 && location.getAccuracy() <= 60) {
//
//                    Double lat = location.getLatitude();
//                    Double lon = location.getLongitude();
//                    float sd = (float) location.getAltitude();
//
//                    //----- For Testing Purpose---------------//
//                    float ac_speed = location.getSpeed();
//
//                    float fact = (float) ((float) 18 / 5);
//                    ac_speed = ac_speed * fact;
//
//                    Log.d("####newfused_gps", String.valueOf(lat));
//
//                    //-------------Location insert----------------//
//
//                    Intent loc_change = new Intent(sqlitewraper.context, loc_change.class);
//
//                    loc_change.putExtra("loc", location);
//
//                    String timemilli = String.valueOf(System.currentTimeMillis());
//
//                    loc_change.putExtra("address", "");
//                    loc_change.putExtra("speed", location.getSpeed());
//                    loc_change.putExtra("tripflag", "1");
//                    loc_change.putExtra("time", timemilli);
//
//                    WakefulIntentService.sendWakefulWork(sqlitewraper.context, loc_change);
//
//                    //send live location to plugin once using lat_status_flag
//                    Intent i = new Intent();
//                    i.setAction("Location");
//                    i.putExtra("lat", lat);
//                    i.putExtra("lon", lon);
//                    i.putExtra("accuracy", location.getAccuracy());
//                    i.putExtra("speed", location.getSpeed());
//                    if (lat_check.equalsIgnoreCase("2")) {
//                        sqlitewraper.context.sendBroadcast(i);
//                    }
//
//
//                    pref.putString("lat_status_flag", "1");
//                    pref.putString("lat", String.valueOf(lat)); // Saving
//                    // string
//                    pref.putLong("lat_status_out", System.currentTimeMillis());
//                    pref.putString("lon", String.valueOf(lon));
//                    pref.putString("accuracy", String.valueOf(location.getAccuracy()));
//
//                    pref.commit();
//
//                }
//            }
//        }
//
//
//        public boolean isMockAvailable(Location location) {
//
//            boolean mock = false;
//
//            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR2) {
//                mock = location.isFromMockProvider();
//            } else {
//                mock = !Settings.Secure.getString(getApplicationContext().getContentResolver(), "mock_location").equals("0");
//            }
//            if (mock) {
//
//                new Handler(Looper.getMainLooper()).post(new Runnable() {
//                    public void run() {
////                        Toast toast = Toast.makeText(sqlitewraper.context, "You Are Using Fake Location", Toast.LENGTH_LONG);
////                        toast.show();
//                        if (!B_new.isIsInBackgeound()) {
//                            mockalert++;
//                        }
//                    }
//                });
//            } else {
//
//                new Handler(Looper.getMainLooper()).post(new Runnable() {
//                    public void run() {
////                        Toast toast = Toast.makeText(sqlitewraper.context, "Real Location :", Toast.LENGTH_LONG);
////                        toast.show();
//                        mockalert = 0;
//                    }
//                });
//            }
//            return mock;
//        }
//
//        @Override
//        public void onProviderDisabled(String provider) {
//        }
//
//        @Override
//        public void onProviderEnabled(String provider) {
//        }
//
//        @Override
//        public void onStatusChanged(String provider, int status, Bundle extras) {
//        }
//    }
//
//
//    @Override
//    public void onDestroy() {
//        // TODO Auto-generated method stub
//        super.onDestroy();
//        insert("new_fused_stop");
//        quite();
//
//    }
//
//
//    void insert(String type) {
//
//        database = sqlitewraper.getDatabase();
//        ContentValues t_i1 = new ContentValues();
//        t_i1.put("f_name", type);
//        t_i1.put("f_data", System.currentTimeMillis());
//        long task_c = database.insert("upload_file_clone", null, t_i1);
//        if (task_c > 0) {
//
//        }
//    }
//
//    @Override
//    public void onTaskRemoved(Intent rootIntent) {
//        super.onTaskRemoved(rootIntent);
//        Log.d("####newfused_gps", "ontaskremoved");
//
//    }
//
//    private void updateServiceMilli() {
//
//        pref = sqlitewraper.getSecureShared("MyPref");
////        editor = pref.edit();
//        pref.putString("SERVICEUPDATE", String.valueOf(System.currentTimeMillis())); // Saving string
//        pref.commit();
//    }
//
//    //to check if service is not running for specific period of time if trip is running
//    private void checkServicemilli() {
//
//        try{
//
//            database = sqlitewraper.getDatabase();
//
//            pref = sqlitewraper.getSecureShared("MyPref");
//            String serviceupdate = pref.getString("SERVICEUPDATE", null);
//
//            if (serviceupdate != null) {
//
//                Log.d("####new_fused", "checkServicesmilli");
//                Cursor tripflag = database.rawQuery(
//                        "select * from lat_plug where trip_status = 0", null);
//                tripflag.moveToFirst();
//                int tripflagCount = tripflag.getCount();
//                tripflag.close();
//
//                if (tripflagCount > 0) {
//
//                    if (!serviceupdate.equalsIgnoreCase("0")) {
//
//                        long servicestart = System.currentTimeMillis();
//                        long stopduration = servicestart - Long.valueOf(serviceupdate);
//
//                        DataUtils.setServiceMilli(servicestart);
//
//                        if (stopduration > 120000) {
//
//                            boolean isInserted = DeviceEventsUtils.insertIntoEvents(serviceupdate, String.valueOf(servicestart), String.valueOf(stopduration), "Service_outage");
//                            if (isInserted) {
//
//                                pref = sqlitewraper.getSecureShared("MyPref");
//                                pref.putString("SERVICEInsert","1");
//                                pref.putString("SERVICEUPDATE", "0"); // Saving string
//                                pref.commit();
//                            }
//                        }
//                    }
//                }
//            }
//        }catch (Exception e){
//
//            pref = sqlitewraper.getSecureShared("MyPref");
////                            editor = pref.edit();
//            pref.putString("SERVICEUPDATE", "0"); // Saving string
//            pref.commit();
//        }
//    }
//
//    //timer for every 30 seconds to check if service is running or not
//    private void startServUpdateTask() {
//
//        if(timer != null) {
//            timer.cancel();
//        }
//        timer = new Timer();
//        final int counter = 0;
//
//        timer.scheduleAtFixedRate(new TimerTask() {
//            @Override
//            public void run() {
//                Log.d("NITNEWFUSED_GPS", String.valueOf(counter));
//                checkServicemilli();
//                updateServiceMilli();
//            }
//        }, DELAY, DELAY);
//    }
}
