package com.sky.atc.easyformse;


import static com.sky.atc.easyformse.sqlitewraper.context;

import android.annotation.SuppressLint;
import android.app.ActivityManager;
import android.app.Notification;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.content.pm.PackageManager;

import android.content.res.Resources;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.media.RingtoneManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;

import android.util.DisplayMetrics;
import android.util.Log;
import android.widget.RemoteViews;
import android.widget.Toast;

import androidx.core.app.NotificationCompat;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import com.sky.atc.easyformse.mapview.CurrentLocation;
import com.sky.atc.easyformse.trip.FloatingBubbleService;


/**
 * Created by NareshChocha on 9/12/2024.
 *
 * @author NareshChocha
 */
public class NotificationListener extends NotificationListenerService {
    String content;
    private PowerManager.WakeLock lock;
    private static final String LOCK_NAME_STATIC = "com.commonsware.cwac.locpoll.LocationPoller";

    private static volatile PowerManager.WakeLock lockStatic = null;
    private boolean isBound = false;
    String subtitle;
    String senderid;
    String receiverid;
    String Company_Id;
    private LocalBroadcastManager broadcaster;
    @SuppressLint("InvalidWakeLockTag")
    synchronized private static PowerManager.WakeLock getLock(Context context) {
        if (lockStatic == null) {
            PowerManager mgr = (PowerManager) context.getApplicationContext()
                    .getSystemService(Context.POWER_SERVICE);

            lockStatic = mgr.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK,
                    LOCK_NAME_STATIC);
            lockStatic.setReferenceCounted(true);
        }

        return (lockStatic);
    }


    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        tryReconnectService();
        return super.onStartCommand(intent, flags, startId);
    }

    @Override
    public void onCreate() {
        super.onCreate();
        tryReconnectService();
        broadcaster = LocalBroadcastManager.getInstance(this);
    }


    @Override
    public void onListenerConnected() {
        super.onListenerConnected();
    }

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        super.onNotificationPosted(sbn);

        PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        boolean isScreenOn = Build.VERSION.SDK_INT >= 20 ? pm.isInteractive() : pm.isScreenOn(); // check if screen is on
        if (!isScreenOn) {
            PowerManager.WakeLock wl = pm.newWakeLock(PowerManager.SCREEN_DIM_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP, "myApp:notificationLock");
            wl.acquire(); //set your time in milliseconds
            wl.release();
        }
        new Handler(Looper.getMainLooper()).post(new Runnable() {
            @Override
            public void run() {
                if (sbn.getPackageName().equalsIgnoreCase(sbn.getNotification().extras.getString("packagename"))) {

                    try {
                        Bundle mBundle = sbn.getNotification().extras;
                        if (mBundle != null) {

                            if(mBundle.getString("NotiType").equalsIgnoreCase("UserLatLong"))
                            {

                                subtitle =  mBundle.getString("body");
                                senderid = mBundle.getString("SenderId");
                                receiverid = mBundle.getString("ReceiverId");
                                Company_Id = mBundle.getString("CompanyId");
                                //This will send current location as reply to the request
                                //Initialize the service to send location continuously if body is blank
                                if (subtitle.equalsIgnoreCase("")) {

                                    Intent i = new Intent(sqlitewraper.context, CurrentLocation.class);
                                    i.putExtra("senderid", senderid);
                                    i.putExtra("receiverid", receiverid);
                                    i.putExtra("Company_Id", Company_Id);
                                    sqlitewraper.context.startService(i);

                                } else {
                                    //This will update the opponent location in map through broadcast
                                    //If body is available we are receiving location from opponent user
                                    String[] separated = subtitle.split(" ");
                                    String lat = separated[0];
                                    String lng = separated[1];
                                    Intent intent = new Intent("MyData");
                                    intent.putExtra("lat", lat);
                                    intent.putExtra("lng", lng);
                                    broadcaster.sendBroadcast(intent);

                                }
                            }
                            if (mBundle.getString("NotiType").equalsIgnoreCase("Redirect")) {
                                //if ((mBundle.getString("Readnoti").equalsIgnoreCase("yes"))) {
                                {
                                    String packageName = sbn.getPackageName();
                                    String ticker = sbn.getNotification().tickerText != null ? sbn.getNotification().tickerText.toString() : "";
                                    if (sbn.getNotification().extras.getCharSequence(Notification.EXTRA_TEXT) != null) {
                                        content = sbn.getNotification().extras.getCharSequence(Notification.EXTRA_TEXT).toString();
                                    }
                                    // notificationQueue.add(content);

                                    boolean check4 = isMyServiceRunning(context, FloatingBubbleService.class.getName());
                                    if (check4) {

                                        FloatingBubbleService bubbleService = FloatingBubbleService.getInstance();
                                        bubbleService.addNotificationContent(content,mBundle.getString("Readnoti"));
                                    } else {
                                        Intent activityIntent = new Intent(context, NotificationActivity.class);
                                        activityIntent.putExtra("notification_title", content);
                                        activityIntent.putExtra("readnoti", mBundle.getString("Readnoti"));
                                        activityIntent.putExtra("notification_list", "");
                                        activityIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                                        context.startActivity(activityIntent);
                                    }


                                    Log.d("NotificationListener", "Package: " + packageName);
                                    Log.d("NotificationListener", "Ticker: " + ticker);
                                    Log.d("NotificationListener", "Content: " + content);
                                }

                            }
                        }
                    } catch (Exception e) {
                        Log.d("Exception", e.toString());
                    }

                }            }
        });



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


    public void tryReconnectService() {
        toggleNotificationListenerService();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            ComponentName componentName =
                    new ComponentName(getApplicationContext(), NotificationListener.class);

            //It say to Notification Manager RE-BIND your service to listen notifications again inmediatelly!
            requestRebind(componentName);
        }
    }


    private void toggleNotificationListenerService() {
        PackageManager pm = getPackageManager();
        pm.setComponentEnabledSetting(new ComponentName(this, NotificationListener.class),
                PackageManager.COMPONENT_ENABLED_STATE_DISABLED, PackageManager.DONT_KILL_APP);
        pm.setComponentEnabledSetting(new ComponentName(this, NotificationListener.class),
                PackageManager.COMPONENT_ENABLED_STATE_ENABLED, PackageManager.DONT_KILL_APP);
    }
    void quite() {
        if (lock.isHeld()) {
            lock.release();
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
//        if (isBound) {
//            try {
//                unbindService(serviceConnection);
//                isBound = false; // Update the flag
//            } catch (IllegalArgumentException e) {
//                Log.e("YourNotificationListenerService", "Service not registered", e);
//            }
//        }
    }
    private final ServiceConnection serviceConnection = new ServiceConnection() {
        @Override
        public void onServiceConnected(ComponentName name, IBinder service) {
            // Service connected logic
            isBound = true;
        }

        @Override
        public void onServiceDisconnected(ComponentName name) {
            // Service disconnected logic
            isBound = false;
        }
    };

}
