/***
 Copyright (c) 2010 CommonsWare, LLC

 Licensed under the Apache License, Version 2.0 (the "License"); you may
 not use this file except in compliance with the License. You may obtain
 a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

package com.sky.atc.easyformse;

import static com.sky.atc.easyformse.sqlitewraper.context;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.ActivityManager;
import android.app.ActivityManager.RunningServiceInfo;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.SharedPreferences.Editor;
import android.content.pm.PackageManager;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.location.Location;
import android.os.Build;
import android.os.Bundle;
import android.os.IBinder;
import android.os.PowerManager;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;

import android.util.Log;

import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GooglePlayServicesUtil;
import com.google.android.gms.common.api.GoogleApiClient;
import com.google.android.gms.common.api.PendingResult;
import com.google.android.gms.common.api.Status;
import com.google.android.gms.location.ActivityRecognition;
import com.google.android.gms.location.ActivityRecognitionApi;
import com.google.android.gms.location.ActivityRecognitionClient;
import com.google.android.gms.location.ActivityTransitionRequest;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.OnSuccessListener;

import net.sqlcipher.database.SQLiteDatabase;

import java.util.Timer;
import java.util.TimerTask;

import io.michaelrocks.paranoid.Obfuscate;

//to start the activity recognization service
@Obfuscate
public class Activity_recognition extends Service implements
        ActivityRecognitionApi, GoogleApiClient.ConnectionCallbacks,
        GoogleApiClient.OnConnectionFailedListener {
    private static final String LOCK_NAME_STATIC = "com.commonsware.cwac.locpoll.LocationPoller1";
    private static final String TAG = "Fused_location";
    static String m12;
    private static volatile PowerManager.WakeLock lockStatic = null;
    private static int TIMEOUT = 25000;
    LocationRequest mLocationRequest;
    Location mCurrentLocation;
    LocationRequest request;
    // meters
    GoogleApiClient mGoogleApiClient;
    SharedPreferences pref;
    String lat_check;
    float accel = 0;
    Editor editor;
    int check = 0;
    private PowerManager.WakeLock lock;
    private SQLiteDatabase database;
    private Location mLastLocation;
    private boolean running = true;
    private BroadcastReceiver receiver;
    ActivityRecognitionClient activityRecognitionClient;
    PendingIntent pendingIntent;
    private Timer timer;
    static final long DETECTION_INTERVAL_IN_MILLISECONDS = 60 * 1000;
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
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (Build.VERSION.SDK_INT >= 26) {

            activityRecognitionClient = new ActivityRecognitionClient(this);
            startactivity_recognition();

            // Initialize the proximity sensor

            Log.d("####ACTIVITY_RECOGNITIO", "HELLO");
            String CHANNEL_ID = "my_channel_01";
            NotificationChannel mChannel = null;
            int icon = R.drawable.atc_logo;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                CharSequence name = "Easyform";// The user-visible name of the channel.
                int importance = NotificationManager.IMPORTANCE_HIGH;
                mChannel = new NotificationChannel(CHANNEL_ID, name, importance);

            }

            NotificationCompat.Builder b = new NotificationCompat.Builder(sqlitewraper.context, CHANNEL_ID);

            b.setAutoCancel(false)
                    .setWhen(System.currentTimeMillis())
                    .setSmallIcon(icon)
                    .setContentTitle("Tracking")
                    .setContentText("Events")
                    .setContentInfo("")
                    .setOngoing(true);
            startForeground(222, b.build());
            NotificationManager notificationManager = (NotificationManager) sqlitewraper.context.getSystemService(Context.NOTIFICATION_SERVICE);
            notificationManager.createNotificationChannel(mChannel);
            notificationManager.notify(222, b.build());

            notificationManager.cancel(222);
        }
        try {
            lock = getLock(this.getApplicationContext());

            if (!lock.isHeld() || (flags & START_FLAG_REDELIVERY) != 0) {
                lock.acquire();
            }
            getLocation();

        } catch (Exception e) {

        }

        return (START_STICKY);
    }

    public void getLocation() {
        try {
            if (!isGooglePlayServicesAvailable()) {
                System.out.print("lay service not available");
            } else {
                // createLocationRequest();
                database = sqlitewraper.getDatabase();

                mGoogleApiClient = new GoogleApiClient.Builder(this)
                        .addApi(ActivityRecognition.API)
                        .addConnectionCallbacks(this)
                        .addOnConnectionFailedListener(this).build();

                mGoogleApiClient.connect();

            }

        } catch (Exception e) {
            //e.printStackTrace();
        }

    }

    private boolean isGooglePlayServicesAvailable() {
        int status = GooglePlayServicesUtil
                .isGooglePlayServicesAvailable(sqlitewraper.context);
        if (ConnectionResult.SUCCESS == status) {
            return true;
        } else {
            // GooglePlayServicesUtil.getErrorDialog(status, this, 0).show();
            return false;
        }
    }

    @Override
    public void onConnected(Bundle bundle) {
        Log.d(TAG, "onConnected - isConnected ...............: "
                + mGoogleApiClient.isConnected());
        startLocationUpdates();

    }

    protected void startLocationUpdates() {
        try {

        //  requestForUpdates();

        } catch (Exception e) {
            //e.printStackTrace();
        }
    }

    @Override
    public void onConnectionSuspended(int i) {

    }

    @Override
    public void onConnectionFailed(ConnectionResult connectionResult) {
        Log.d(TAG, "Connection failed: " + connectionResult.toString());
    }

    /**
     * A WakefulThread subclass that knows how to look up the current location,
     * plus handle the timeout scenario.
     */

    void quite() {
        if (lock.isHeld()) {
            lock.release();
        }

    }

    @Override
    public void onDestroy() {
        // TODO Auto-generated method stub
        super.onDestroy();
        if (mGoogleApiClient != null) {
            mGoogleApiClient.disconnect();
        }
        Removeupdates();
        quite();
    }
    @Override
    public PendingResult<Status> removeActivityUpdates(GoogleApiClient arg0,
                                                       PendingIntent arg1) {

        // TODO Auto-generated method stub
        return null;
    }


    public PendingResult<Status> zza(GoogleApiClient googleApiClient, ActivityTransitionRequest activityTransitionRequest, PendingIntent pendingIntent) {
        return null;
    }

    public PendingResult<Status> zza(GoogleApiClient googleApiClient, PendingIntent pendingIntent) {
        return null;
    }


    @Override
    public PendingResult<Status> requestActivityUpdates(GoogleApiClient arg0,
                                                        long arg1, PendingIntent arg2) {
        // TODO Auto-generated method stub

        return null;
    }


    private void Removeupdates()
    {
        activityRecognitionClient.removeActivityUpdates(pendingIntent)
                .addOnSuccessListener(new OnSuccessListener<Void>() {
                    @Override
                    public void onSuccess(Void aVoid) {
                        Log.i(TAG, "Transitions successfully unregistered.");
                    }
                })
                .addOnFailureListener(new OnFailureListener() {
                    @Override
                    public void onFailure(@NonNull Exception e) {
                        Log.e(TAG, "Transitions could not be unregistered: " + e);
                    }
                });

    }

    private void requestForUpdates() {

        Intent intent = new Intent(this, activity_recognize.class);
        //   intent.setAction("result");
        pendingIntent = PendingIntent.getBroadcast(this, 0, intent,
                PendingIntent.FLAG_CANCEL_CURRENT);

        activityRecognitionClient.requestActivityUpdates(DETECTION_INTERVAL_IN_MILLISECONDS, pendingIntent)
                .addOnSuccessListener(new OnSuccessListener<Void>() {
                    @Override
                    public void onSuccess(Void aVoid) {
                        Log.i(TAG, "Transitions successfully unregistered.");
                    }
                })
                .addOnFailureListener(new OnFailureListener() {
                    @Override
                    public void onFailure(@NonNull Exception e) {
                        Log.e(TAG, "Transitions could not be unregistered: " + e);
                    }
                });

    }


    //timer for every 60 seconds to check if service is running or not
    private void startactivity_recognition() {

        if(timer != null) {
            timer.cancel();
        }
//        if isevent tag true start timer (28-11-2023)
        String isEvents = sqlitewraper.context.getResources().getString(R.string.EVENTS);
        if(isEvents.equalsIgnoreCase("true")) {
            timer = new Timer();
            timer.schedule(new TimerTask() {
                @Override
                public void run() {
                    requestForUpdates();
                }
            }, DETECTION_INTERVAL_IN_MILLISECONDS, DETECTION_INTERVAL_IN_MILLISECONDS);
        }
    }

}
