package com.sky.atc.easyformse;

import android.annotation.SuppressLint;
import android.app.ActivityManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.media.RingtoneManager;
import android.os.Build;
import android.os.PowerManager;

import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import com.commonsware.cwac.wakeful.WakefulIntentService;
import com.sky.atc.easyformse.datautils.MySharedPreferences;

import java.util.Date;
import java.util.concurrent.TimeUnit;

/**
 * Created by NareshChocha on 12/9/2024.
 *
 * @author NareshChocha
 */
public class PowerSaveModeReceiver extends BroadcastReceiver {

    long PowersavingmodeOn;
    long PowerSavingmodeOff;
    long Duration;
    boolean isPowerSaving;
    MySharedPreferences pref;

    private static NotificationChannel mChannel = null;
    private static String CHANNEL_ID = "my_channel_01";
    @Override
    public void onReceive(Context context, Intent intent) {
        PowerManager powerManager = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        isPowerSaving = powerManager.isPowerSaveMode();
        Date now = new Date();
        Long time = now.getTime();
        pref = sqlitewraper.getSecureShared("MyPref");

        boolean check1 = isMyServiceRunning(sqlitewraper.context,
                f_upload_new_structure.class.getName());

        if (check1) {
        } else {

            Intent z_n12 = new Intent(sqlitewraper.context,
                    f_upload_new_structure.class);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                sqlitewraper.context.startForegroundService(z_n12);
            } else {
                WakefulIntentService.sendWakefulWork(sqlitewraper.context, z_n12);
            }
        }
        if (isPowerSaving) {
            PowersavingmodeOn = time;
            PowerSavingmodeOff = 0;
            pref.putLong("PowersavingmodeOn", PowersavingmodeOn); // Saving string
            pref.putLong("PowerSavingmodeOff", PowerSavingmodeOff);
            pref.commit();
        } else {
            PowerSavingmodeOff = time;

            pref.putLong("PowerSavingmodeOff", PowerSavingmodeOff);
            pref.commit();
            inser();
        }


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

    public void inser() {
        PowersavingmodeOn = pref.getLong("PowersavingmodeOn", 0);
        PowerSavingmodeOff = pref.getLong("PowerSavingmodeOff", 0);

        if (PowersavingmodeOn != 0 && PowerSavingmodeOff != 0) {
            Duration = PowerSavingmodeOff - PowersavingmodeOn;
            long minutes = TimeUnit.MILLISECONDS.toMinutes(Duration);

            if (Duration > 1000) {
                boolean isInserted = DeviceEventsUtils.insertIntoEvents(String.valueOf(PowersavingmodeOn), String.valueOf(PowerSavingmodeOff), String.valueOf(Duration), "PowerSavingMode");
                if (isInserted) {
                    sendalert();
                    pref.putLong("PowerSavingmodeOff", 0);
                    pref.putLong("PowersavingmodeOn", 0);
                    pref.commit();
                }
            }

        }
    }

    @SuppressLint("WrongConstant")
    public void sendalert() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            CharSequence name = "Easyform";// The user-visible name of the channel.
            int importance = NotificationManager.IMPORTANCE_HIGH;
            mChannel = new NotificationChannel(CHANNEL_ID, name, importance);

        }

        NotificationCompat.Builder mBuilder = new NotificationCompat.Builder(
                sqlitewraper.context);

        mBuilder.setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle("Power Saving Mode")
                .setContentText("Please Disable Power Saving Mode")
                .setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION))
                .setChannelId(CHANNEL_ID)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true);

        NotificationManager mNotificationManager = (NotificationManager)sqlitewraper.context. getSystemService(Context.NOTIFICATION_SERVICE);
        // mId allows you to update the notification later on.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            mNotificationManager.createNotificationChannel(mChannel);
        }
        mNotificationManager.notify(505, mBuilder.build());




    }
}
