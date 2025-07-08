

package com.sky.atc.easyformse;

import android.annotation.SuppressLint;
import android.app.ActivityManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationManager;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.PowerManager;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;

import com.commonsware.cwac.wakeful.WakefulIntentService;
import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GooglePlayServicesUtil;
import com.google.android.gms.common.api.GoogleApiClient;
import com.google.android.gms.common.api.PendingResult;
import com.google.android.gms.common.api.Status;
import com.google.android.gms.location.LocationListener;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationServices;
import com.sky.atc.easyformse.datautils.MySharedPreferences;

import net.sqlcipher.database.SQLiteDatabase;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.LinkedList;
import java.util.List;
import java.util.Timer;
import java.util.TimerTask;

import io.michaelrocks.paranoid.Obfuscate;

//For Calculation of acceleration ad Declaration
@Obfuscate
public class newfused_accel extends Service
//        implements LocationListener,
//        GoogleApiClient.ConnectionCallbacks,
//        GoogleApiClient.OnConnectionFailedListener
{
    @Nullable

//    private static final String LOCK_NAME_STATIC = "com.commonsware.cwac.locpoll.LocationPoller";
//
//    private static volatile PowerManager.WakeLock lockStatic = null;
//    LocationRequest mLocationRequest;
//    private PowerManager.WakeLock lock;
//
//    private SQLiteDatabase database;
//    private Location mLastLocation;
//
//    // meters
//    GoogleApiClient mGoogleApiClient;
//    private static final String TAG = "Fused_location";
//    MySharedPreferences pref;
//    float accel = 0;
//
//    long current_milli, last_milli;
//    float current_speed, last_speed;
//    int check = 0;
//    data d = new data();
//    LinkedList<GroupOfFourInts> linky = new LinkedList<>();
//    NotificationChannel mChannel = null;
//    String CHANNEL_ID = "my_channel_01";
//    private double threshold = 1.0f; // 5.0f this threshold value
//    private boolean isBraking = false;
//    private long startTime = 0;
//    private static final long FIVE_MINUTES =  1 * 60 * 1000; // 5 minutes in milliseconds
//    LocationManager locationManager;
//    private Timer haltTimer;
//    private static final String MY_PREFS_NAME = "MY_TRIP";
//
//    @SuppressLint("InvalidWakeLockTag")
//    synchronized private static PowerManager.WakeLock getLock(Context context) {
//        if (lockStatic == null) {
//            PowerManager mgr = (PowerManager) context.getApplicationContext()
//                    .getSystemService(Context.POWER_SERVICE);
//
//            lockStatic = mgr.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK,
//                    LOCK_NAME_STATIC);
//            lockStatic.setReferenceCounted(true);
//        }
//
//        return (lockStatic);
//    }
//
//    protected void createLocationRequest() {
//        mLocationRequest = new LocationRequest();
//        mLocationRequest.setPriority(LocationRequest.PRIORITY_HIGH_ACCURACY);
//        mLocationRequest.setInterval(1000);
//    }
//
    @Override
    public IBinder onBind(Intent i) {
        return (null);
    }
//
//    @SuppressLint("WrongConstant")
//    @Override
//    public int onStartCommand(Intent intent, int flags, int startId) {
//        lock = getLock(this.getApplicationContext());
//
//        pref = sqlitewraper.getSecureShared("MyPref");
//
//        if (!lock.isHeld() || (flags & START_FLAG_REDELIVERY) != 0) {
//            lock.acquire();
//        }
//
//
//        //-------------------ForGround-----------------------//
//        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
//            CharSequence name = "Easyform";// The user-visible name of the channel.
//            int importance = NotificationManager.IMPORTANCE_HIGH;
//            mChannel = new NotificationChannel(CHANNEL_ID, name, importance);
//
//        }
//        insert("newfused_accel_start");
//        Notification notification = new NotificationCompat.Builder(sqlitewraper.context)
//                .setSmallIcon(R.drawable.atc_logo)
//                .setContentTitle("Tracking")
//                .setContentText("Driver Behaviour Tracking")
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
//        startForeground(1024, notification);
//
//        LocationManager locationManager = (LocationManager) this
//                .getSystemService(Context.LOCATION_SERVICE);
//        ConnectivityManager conMgr = (ConnectivityManager) sqlitewraper.context
//                .getSystemService(Context.CONNECTIVITY_SERVICE);
//
//        if ((!(sqlitewraper.internetflag == 1))
//                && (!(conMgr.getNetworkInfo(0).getState() == NetworkInfo.State.CONNECTED || conMgr
//                .getNetworkInfo(1).getState() == NetworkInfo.State.CONNECTING))
//                && (!locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER))) {
//
//            getLocation();
//        } else {
//            getLocation();
//        }
//
//        return (START_STICKY);
//    }
//
//    public void getLocation() {
//        try {
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
//
//        } catch (Exception e) {
//            e.printStackTrace();
//        }
//
//    }
//
//    private boolean isGooglePlayServicesAvailable() {
//        int status = GooglePlayServicesUtil
//                .isGooglePlayServicesAvailable(sqlitewraper.context);
//        return ConnectionResult.SUCCESS == status;
//    }
//
//    @Override
//    public void onConnected(Bundle bundle) {
//        Log.d(TAG, "onConnected - isConnected ...............: "
//                + mGoogleApiClient.isConnected());
//        if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
//            return;
//        }
//        mLastLocation = LocationServices.FusedLocationApi
//                .getLastLocation(mGoogleApiClient);
//
//        try {
//
//            startLocationUpdates();
//
//            if (mLastLocation != null) {
//                double latitude = mLastLocation.getLatitude();
//                double longitude = mLastLocation.getLongitude();
//
//                Long time = mLastLocation.getTime();
//                Long device_time = System.currentTimeMillis();
//                if (device_time - time < 90000) {
//
//                    Intent i = new Intent();
//                    i.setAction("Location");
//                    i.putExtra("lat", latitude);
//                    i.putExtra("lon", longitude);
//                    i.putExtra("accuracy", mLastLocation.getAccuracy());
//                }
//
//            } else {
//                startLocationUpdates();
//            }
//        } catch (Exception ignored) {
//        }
//
//    }
//
//    protected void startLocationUpdates() {
//        try {
//            if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
//                return;
//            }
//            PendingResult<Status> pendingResult = LocationServices.FusedLocationApi
//                    .requestLocationUpdates(mGoogleApiClient, mLocationRequest,
//                            this);
//            Log.d(TAG, "Location update started ..............: ");
//        } catch (Exception ignored) {
//        }
//    }
//
//    @Override
//    public void onConnectionSuspended(int i) {
//
//    }
//
//    @Override
//    public void onConnectionFailed(ConnectionResult connectionResult) {
//        Log.d(TAG, "Connection failed: " + connectionResult.toString());
//    }
//
//    protected void stopLocationUpdates() {
//
//        if ( mGoogleApiClient !=null && mGoogleApiClient.isConnected()) {
//
//            LocationServices.FusedLocationApi.removeLocationUpdates(
//                    mGoogleApiClient, this);
//            mGoogleApiClient.disconnect();
//            Log.d("##ACT_NEWFUSED_ACCEL", "Location update stopped...");
//        }
//    }
//
//    @Override
//    public void onLocationChanged(Location location) {
//
//        try {
//            data d = new data();
//
//            //Calculation of Acc/DeAcc
//            if (check == 0) {
//                last_milli = location.getTime();
//                current_speed = location.getSpeed();
//                Log.d("##ACT_ACCEL1", String.valueOf(current_speed));
//                last_speed = location.getSpeed();
//                check++;
//            } else {
//
//                current_milli = location.getTime();
//                current_speed = location.getSpeed();
//
//                Log.d("##ACT_ACCEL2", String.valueOf(current_speed));
//
//                accel = (current_speed - last_speed)
//                        / (current_milli - last_milli);
//                last_milli = current_milli;
//                last_speed = current_speed;
//            }
//
//            GroupOfFourInts n = new GroupOfFourInts();
//
//            //Convert  to m/s2
//            n.x = accel * 1000;
//            n.milli = current_milli;
//            linked(n);
//
//
//        } catch (Exception ignored) {
//
//        }
//
//    }
//
//    void quite() {
//        if (lock.isHeld()) {
//            lock.release();
//        }
//    }
//
//    @Override
//    public void onDestroy() {
//        super.onDestroy();
//        final Handler handler = new Handler();
//        handler.postDelayed(() -> {
//            stopLocationUpdates();
//            stopSelf();
//        }, 2000);
//        stopForeground(true);
//        insert("new_fused_accel_end");
//        quite();
//    }
//
//
//    //Calculation for acc/deacc
//    void linked(GroupOfFourInts n) {
//
//        linky.add(n);
//
//        double avg_x = 0.0;
//        double avg_mag = 0.0;
//        int counter = 0, i = 0;
//        long detect_milli = 0;
//
//        //Define scope for average acc.(that is 3 seconds in past)
//        long diff_milli = n.milli - 3000;
//
//        detect_milli = n.milli;
//
//        //Define Thresold to reduce multiple entry
//        long thresold_milli = detect_milli + d.gap_milli();
//
//        Iterator<GroupOfFourInts> iterator = linky.iterator();
//        try {
//            while (iterator.hasNext()) {
//
//                GroupOfFourInts g = iterator.next();
//
//                //do avarage of acc based on defined scope(3 seconds)
//                if (g.milli > diff_milli) {
//                    avg_x += g.x;
//                    counter++;
//                } else {
//                    iterator.remove();
//                }
//
//            }
//        } catch (Exception e) {
//            e.printStackTrace();
//            // TODO: handle exception
//        }
//
//        String[] lat_lon;
//        lat_lon = d.getlatlon();
//
//        Log.d("##ACT_ACCEL3", String.valueOf(avg_x/counter));
//
//        //check with thresold to enter hard acc.
//        if (!d.getusername().equalsIgnoreCase("0")) {
//            if ((avg_x / counter) > d.hard_acc()) {
//
//                Log.d("##ACT_ACCEL4", String.valueOf(avg_x));
//
//                ArrayList<String> logindetails;
//                logindetails = DeviceEventsUtils.getLoginDetails();
//                String userid = logindetails.get(0);
//                String imei = logindetails.get(1);
//                String appid = logindetails.get(2);
//
//
//                ContentValues c = new ContentValues();
//                c.put("Event_strt", detect_milli);
//                c.put("Event_end", thresold_milli);
//                c.put("username", d.getusername());
//                c.put("Event_type", "ACC");
//                c.put("is_send", "0");
//                c.put("lat", lat_lon[0]);
//                c.put("lon", lat_lon[1]);
//                c.put("th_s", (avg_x / counter));
//
//                c.put("battery", DeviceEventsUtils.getBatteryInfo());
//                c.put("timezone", DeviceEventsUtils.getTimeZone());
//                c.put("utcstart", DeviceEventsUtils.utcCalculationOffset(detect_milli));
//                c.put("utcend", DeviceEventsUtils.utcCalculationOffset(thresold_milli));
//                c.put("imei", imei);
//                c.put("appid", appid);
//                c.put("userid", userid);
//                c.put("duration", 0);
//
//
//                //Avoid duplicate entry
//                if (d.gethardacc_time() < detect_milli) {
//
//                    long temp = database.insert("Events", null, c);
//                    d.sethard_time(thresold_milli);
//
//                } else {
//                    d.sethard_time(thresold_milli);
//
//                }
//
//            }
//
//            //For Deacc
//            if ((avg_x / counter) < d.hard_deacc()) {
//
//                ArrayList<String> logindetails = new ArrayList<>();
//                logindetails = DeviceEventsUtils.getLoginDetails();
//                String userid = logindetails.get(0);
//                String imei = logindetails.get(1);
//                String appid = logindetails.get(2);
//                String username1 = logindetails.get(3);
//
//                ContentValues c = new ContentValues();
//                c.put("Event_strt", detect_milli);
//                c.put("Event_end", thresold_milli);
//                c.put("username", d.getusername());
//                c.put("Event_type", "DEACC");
//                c.put("is_send", "0");
//                c.put("lat", lat_lon[0]);
//                c.put("lon", lat_lon[1]);
//                c.put("th_s", (avg_x / counter));
//
//
//                c.put("battery", DeviceEventsUtils.getBatteryInfo());
//                c.put("timezone", DeviceEventsUtils.getTimeZone());
//                c.put("utcstart", DeviceEventsUtils.utcCalculationOffset(detect_milli));
//                c.put("utcend", DeviceEventsUtils.utcCalculationOffset(thresold_milli));
//                c.put("imei", imei);
//                c.put("appid", appid);
//                c.put("userid", userid);
//                c.put("duration", 0);
//
//
//                //Avoid duplicate entry
//                if (d.getdeacc_time() < detect_milli) {
//
//                    long temp = database.insert("Events", null, c);
//                    d.setdeacc_time(thresold_milli);
//
//                } else {
//
//                    d.setdeacc_time(thresold_milli);
//
//                }
//
//                // }
//
//            }
//
//            //------------For testing purpose used at server side---------//
//            //--------------------normal_deacc-------------//
//
//            if ((avg_x / counter) < d.normal_deacc()) {
//
//                ArrayList<String> logindetails;
//                logindetails = DeviceEventsUtils.getLoginDetails();
//                String userid = logindetails.get(0);
//                String imei = logindetails.get(1);
//                String appid = logindetails.get(2);
//                String username1 = logindetails.get(3);
//
//                ContentValues c = new ContentValues();
//                c.put("Event_strt", detect_milli);
//                c.put("Event_end", thresold_milli);
//                c.put("username", d.getusername());
//                c.put("Event_type", "Normal_Deacc");
//                c.put("is_send", "0");
//                c.put("lat", lat_lon[0]);
//                c.put("lon", lat_lon[1]);
//                c.put("th_s", (avg_x / counter));
//
//                c.put("battery", DeviceEventsUtils.getBatteryInfo());
//                c.put("timezone", DeviceEventsUtils.getTimeZone());
//                c.put("utcstart", DeviceEventsUtils.utcCalculationOffset(detect_milli));
//                c.put("utcend", DeviceEventsUtils.utcCalculationOffset(thresold_milli));
//                c.put("imei", imei);
//                c.put("appid", appid);
//                c.put("userid", userid);
//                c.put("duration", 0);
//
//                //Avoid duplicate entry
//                if (d.getnormal_deacc_time() < detect_milli) {
//                    long temp = database.insert("Events", null, c);
//                    d.setnormal_deacc_time(thresold_milli);
//                } else {
//                    d.setnormal_deacc_time(thresold_milli);
//                }
//            }
//
//            //-----------------Normal_acc----------------//
//
//            if (!d.getusername().equalsIgnoreCase("0")) {
//                if ((avg_x / counter) > d.normal_acc()) {
//
//
//                    ArrayList<String> logindetails = new ArrayList<>();
//                    logindetails = DeviceEventsUtils.getLoginDetails();
//                    String userid = logindetails.get(0);
//                    String imei = logindetails.get(1);
//                    String appid = logindetails.get(2);
//                    String username1 = logindetails.get(3);
//
//
//                    ContentValues c = new ContentValues();
//                    c.put("Event_strt", detect_milli);
//                    c.put("Event_end", thresold_milli);
//                    c.put("username", d.getusername());
//                    c.put("Event_type", "NormalAcc");
//                    c.put("is_send", "0");
//                    c.put("lat", lat_lon[0]);
//                    c.put("lon", lat_lon[1]);
//                    c.put("th_s", (avg_x / counter));
//
//                    c.put("battery", DeviceEventsUtils.getBatteryInfo());
//                    c.put("timezone", DeviceEventsUtils.getTimeZone());
//                    c.put("utcstart", DeviceEventsUtils.utcCalculationOffset(detect_milli));
//                    c.put("utcend", DeviceEventsUtils.utcCalculationOffset(thresold_milli));
//                    c.put("imei", imei);
//                    c.put("appid", appid);
//                    c.put("userid", userid);
//                    c.put("duration", 0);
//
//                    //Avoid duplicate entry
//                    if (d.getnormal_acc_time() < detect_milli) {
//
//                        long temp = database.insert("Events", null, c);
//                        d.setnormal_acc_time(thresold_milli);
//
//                    } else {
//
//                        d.setnormal_acc_time(thresold_milli);
//
//                    }
//
//                }
//            }
//
//            // for harsh brake
//            if (avg_x >= threshold) {
//                Log.d("value avg_x", String.valueOf(avg_x));
//                if (!isBraking) {
//                    System.out.println("Harsh braking detected!");
//                    isBraking = true;
//                    startTime = System.currentTimeMillis();
//
//                    Location location = getLastKnownLocation();
//                    detectHalt(location,startTime);
//                   // Log.d("currentlocation", String.valueOf(location.getLatitude())+String.valueOf(location.getLongitude()));
//
//                }
//            }
//            } else {
//                isBraking = false;
//                startTime = 0;
//            }
//
//    }
//    private void detectHalt(Location initialLocation,long start_Time)
//    {
//       // Start a timer to check if the user halts for 5 minutes
//        haltTimer = new Timer();
//        haltTimer.schedule(new TimerTask() {
//            @Override
//            public void run() {
//                if(isBraking)
//                {
//                    Location currentLocation = getLastKnownLocation();
//                    if (currentLocation != null && currentLocation.distanceTo(initialLocation) < 10) { // Assuming 10 meters threshold for same location
//                        Log.d("currentlocation1", String.valueOf(currentLocation.getLatitude())+String.valueOf(currentLocation.getLongitude()));
//
//                        // Halt detected, insert event table
//                        String[] lat_lon;
//                        lat_lon = d.getlatlon();
//                        ArrayList<String> logindetails = new ArrayList<>();
//                        logindetails = DeviceEventsUtils.getLoginDetails();
//                        String userid = logindetails.get(0);
//                        String imei = logindetails.get(1);
//                        String appid = logindetails.get(2);
//                        String username1 = logindetails.get(3);
//
//
//                        ContentValues c = new ContentValues();
//                        c.put("Event_strt", start_Time);
//                        c.put("Event_end", System.currentTimeMillis());
//                        c.put("username", d.getusername());
//                        c.put("Event_type", "Harsh Brake");
//                        c.put("is_send", "0");
//                        c.put("lat", lat_lon[0]);
//                        c.put("lon", lat_lon[1]);
//                        c.put("th_s", "Harsh Brake");
//
//                        c.put("battery", DeviceEventsUtils.getBatteryInfo());
//                        c.put("timezone", DeviceEventsUtils.getTimeZone());
//                        c.put("utcstart", DeviceEventsUtils.utcCalculationOffset(startTime));
//                        c.put("utcend", DeviceEventsUtils.utcCalculationOffset(System.currentTimeMillis()));
//                        c.put("imei", imei);
//                        c.put("appid", appid);
//                        c.put("userid", userid);
//                        c.put("duration", 0);
//                        MySharedPreferences prefs = sqlitewraper.getSecureShared(MY_PREFS_NAME);
//                        String tid = prefs.getString("tid", null);
//
//                        c.put("tid",tid);
//                        long temp = database.insert("Events", null, c);
//                        if (temp > 0) {
//
//                            boolean check3 = isMyServiceRunning(sqlitewraper.context,
//                                    Event.class.getName());
//                            if (check3) {
//                            } else {
//                                Intent z_n12 = new Intent(sqlitewraper.context, Event.class);
//                                WakefulIntentService.sendWakefulWork(sqlitewraper.context,
//                                        z_n12);
//                            }
//                        }
//                        // Reset the timer and braking flag
//                        isBraking = false;
//                        startTime = 0;
//                        haltTimer.cancel();
//                    }
//                    else {
//                        // halt not detected,cancel the timer
//                        isBraking = false;
//                        startTime = 0;
//                        haltTimer.cancel();
//                    }
//                }
//                else {
//                    // Halt not detected, cancel the timer
//                    haltTimer.cancel();
//                    isBraking = false;
//                    startTime = 0;
//                }
//
//            }
//        }, FIVE_MINUTES,FIVE_MINUTES);
//    }
//    private Location getLastKnownLocation() {
//        locationManager = (LocationManager) sqlitewraper.context.getSystemService(LOCATION_SERVICE);
//        List<String> providers = locationManager.getProviders(true);
//        Location bestLocation = null;
//        for (String provider : providers) {
//            @SuppressLint("MissingPermission") Location l = locationManager.getLastKnownLocation(provider);
//            if (l == null) {
//                continue;
//            }
//            if (bestLocation == null || l.getAccuracy() < bestLocation.getAccuracy()) {
//                // Found best last known location: %s", l);
//                bestLocation = l;
//            }
//        }
//        return bestLocation;
//    }
//
//
//    private boolean isMyServiceRunning(Context context, String Myservice) {
//        ActivityManager manager = (ActivityManager) context
//                .getSystemService(Context.ACTIVITY_SERVICE);
//        for (ActivityManager.RunningServiceInfo service : manager
//                .getRunningServices(Integer.MAX_VALUE)) {
//            if (Myservice.equals(service.service.getClassName())) {
//
//                return true;
//            }
//        }
//        return false;
//    }
//
//    void insert(String type) {
//
//        database = sqlitewraper.getDatabase();
//        ContentValues t_i1 = new ContentValues();
//        t_i1.put("f_name", type);
//        t_i1.put("f_data", System.currentTimeMillis());
//        long task_c = database.insert("upload_file_clone", null, t_i1);
//
//    }
}
