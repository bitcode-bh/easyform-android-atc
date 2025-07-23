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

import static com.sky.atc.easyformse.DeviceEventsUtils.utcCalculationOffset;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.location.Address;
import android.location.Geocoder;
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
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import android.util.Log;

import com.commonsware.cwac.wakeful.WakefulIntentService;
import com.google.android.gms.common.api.GoogleApiClient;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.location.SpeedCalculation;
import com.sky.atc.easyformse.trip.TripMapUtils;

import net.sqlcipher.database.SQLiteDatabase;

import org.apache.http.HttpEntity;
import org.apache.http.client.ClientProtocolException;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.DefaultHttpClient;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.Locale;

import io.michaelrocks.paranoid.Obfuscate;

/**
 * Service providing the guts of the location polling engine. Uses a WakeLock to
 * ensure the CPU stays on while the location lookup is going on. Handles both
 * successful and timeout conditions.
 * <p>
 * Those wishing to leverage this service should do so via the LocationPoller
 * class.
 */
@Obfuscate
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


    NotificationChannel mChannel = null;
    String CHANNEL_ID = "my_channel_01";

    MySharedPreferences sharedPreferences;


    //New Location Method
    private FusedLocationProviderClient fusedLocationClient;
    private LocationCallback locationCallback;
    private LocationRequest locationRequest;
    /**
     * Lazy-initializes the WakeLock when we first use it. We use a partial
     * WakeLock since we only need the CPU on, not the screen.
     */


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

        boolean isuploadlastentry = pref.getBoolean("isuploadlastentry",false);
//        check location and upload in server
        if(!isuploadlastentry) {
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
        fusedLocationClient.removeLocationUpdates(locationCallback);
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
        if (lock.isHeld()) {
            lock.release();
        }
    }

    @Override
    public void onDestroy() {
        // TODO Auto-generated method stub
        super.onDestroy();
        insert("new_fused_stop");
        quite();
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

    //Location Update will get HEre
    private void onLocationChanged() {

        locationCallback = new LocationCallback() {
            @Override
            public void onLocationResult(LocationResult locationResult) {
                if (locationResult == null) {
                    return;
                }
                for (Location location : locationResult.getLocations()) {
                    Log.d("##LOCATIONSERVIE", String.valueOf(location.getAccuracy()));
                    try {

                        //logic to avoid wrong location based on speed and accuracy(speed limit 118 km/h)
                        if (location.getSpeed() < 33 && location.getAccuracy() <= 60) {

                            //for manual speed calculation
                            float manualSpeed = SpeedCalculation.calculateSpeedBetweenPoints(location);

                            onLocationUpdate(location, manualSpeed);
                        }

                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            }
        };
    }
    LocationManager locationManager;

    private void startLocationUpdates() {
        /*if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            return;
        }
        fusedLocationClient.requestLocationUpdates(locationRequest,
                locationCallback,
                Looper.getMainLooper());*/

        locationManager = (LocationManager) this
                .getSystemService(Context.LOCATION_SERVICE);
        ConnectivityManager conMgr = (ConnectivityManager) sqlitewraper.context
                .getSystemService(Context.CONNECTIVITY_SERVICE);

        if ((locationManager
                .isProviderEnabled(LocationManager.GPS_PROVIDER))
        ) {
            if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            }
            // distance between new location and old location > 80 then location entry will be placed in location_log
            locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 2000, 80, this);

        } else {

        }


    }

    protected LocationRequest createLocationRequestNew() {
        LocationRequest locationRequest = LocationRequest.create();
        locationRequest.setInterval(10000);
        locationRequest.setFastestInterval(5000);
        locationRequest.setPriority(LocationRequest.PRIORITY_HIGH_ACCURACY);

        locationRequest.setSmallestDisplacement(100);
        return locationRequest;
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
        Log.d("##LOCATIONSERVIE", String.valueOf(location.getAccuracy()));
        try {
            //logic to avoid wrong location based on speed and accuracy(speed limit 118 km/h)
            if (location.getSpeed() < 33 && location.getAccuracy() <= 60) {

                //for manual speed calculation
                float manualSpeed = SpeedCalculation.calculateSpeedBetweenPoints(location);

                onLocationUpdate(location, manualSpeed);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
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
        pendingIntent = PendingIntent.getBroadcast(sqlitewraper.context, 0, intent, PendingIntent.FLAG_CANCEL_CURRENT);

        MySharedPreferences pref = sqlitewraper.getSecureShared("MyPref");
        pref.putBoolean("isuploadlastentry", true); // Saving string
        pref.commit();
        long intervalMillis = 10 * 60 * 1000; // 10 minutes
        long triggerTime = System.currentTimeMillis() + intervalMillis;

        alarmManager.setInexactRepeating(AlarmManager.RTC_WAKEUP, triggerTime, intervalMillis,pendingIntent);
    }

}
