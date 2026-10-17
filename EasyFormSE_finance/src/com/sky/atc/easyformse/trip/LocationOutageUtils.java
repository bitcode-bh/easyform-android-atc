package com.sky.atc.easyformse.trip;

import com.sky.atc.easyformse.DeviceEventsUtils;

import android.annotation.SuppressLint;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.ContentResolver;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;
import android.util.Log;

import com.sky.atc.easyformse.R;
import com.sky.atc.easyformse.sqlitewraper;

import net.sqlcipher.database.SQLiteDatabase;

import java.util.Timer;
import java.util.TimerTask;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

//Showing Location outage notification
@StringFogIgnore
public class LocationOutageUtils {


    private final static int DELAY = 10000;
    private Timer timer = new Timer();
    private static long millisecondsUpdated;
    public static boolean isPiP;

    public LocationOutageUtils() {
//        startServUpdateTask();
    }



    private void startServUpdateTask() {

        if (timer != null) {
            timer.cancel();
        }
        timer = new Timer();

        timer.scheduleAtFixedRate(new TimerTask() {
            @Override
            public void run() {
                if (DeviceEventsUtils.liveTripCount()>0) {

                    long currentTime = System.currentTimeMillis();
                    Log.d("##LocationOutage", String.valueOf(currentTime));
                    long duration = currentTime - millisecondsUpdated;

                    if (duration > 900000) {
                        Log.d("##LocationDuration", String.valueOf(duration));
                        locatiupdateAlert();
                        millisecondsUpdated=currentTime;
                    }
                }else {
                    timer.cancel();
                }

            }
        }, DELAY, DELAY);
    }


    //Showing Notification for location Outage for specific time from touch server
    @SuppressLint("WrongConstant")
    public static void locatiupdateAlert() {

        if (DeviceEventsUtils.liveTripCount() > 0) {


            Uri sound = Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE + "://" + sqlitewraper.context.getPackageName() + "/" + R.raw.glitchy);

            NotificationChannel channel;

            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {

                AudioAttributes attributes;
                attributes = new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                        .build();
                channel = new NotificationChannel("channel01", "name", NotificationManager.IMPORTANCE_HIGH);
                channel.setDescription("description");
//                channel.setSound(sound, attributes);
                //  notification play custom sound
                Ringtone r = RingtoneManager.getRingtone(sqlitewraper.context, sound);
                r.play();
                NotificationManager notificationManager = sqlitewraper.context.getSystemService(NotificationManager.class);
                notificationManager.createNotificationChannel(channel);
            }

// Register channel with system
            Notification notification = new NotificationCompat.Builder(sqlitewraper.context, "channel01")
                    .setSmallIcon(android.R.drawable.ic_dialog_info)
                    .setContentTitle("Location Fetcing")
                    .setStyle(new NotificationCompat.BigTextStyle()
                            .bigText("We are not able to fetch your location during trip please check your setting"))
                    .setSound(sound)
                    .setSound(sound)
                    .setPriority(NotificationCompat.PRIORITY_HIGH)   // heads-up
                    .build();

            NotificationManagerCompat notificationManager1 = NotificationManagerCompat.from(sqlitewraper.context);
            notificationManager1.notify(209, notification);
        }
    }


    public static void sendLocationToBackgrounMap(double lat, double lang) {

        if (DeviceEventsUtils.liveTripCount()>0) {

            Log.d("sender", "Broadcasting message");
            Intent intent = new Intent("trip-background-map");
            // You can also include some extra data.
            intent.putExtra("lat", String.valueOf(lat));
            intent.putExtra("long", String.valueOf(lang));
            LocalBroadcastManager.getInstance(sqlitewraper.context).sendBroadcast(intent);
        }
    }
}
