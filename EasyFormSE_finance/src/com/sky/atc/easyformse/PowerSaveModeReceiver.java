package com.sky.atc.easyformse;

import android.annotation.SuppressLint;
import android.app.ActivityManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.media.RingtoneManager;
import android.os.Build;
import android.os.PowerManager;

import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import com.commonsware.cwac.wakeful.WakefulIntentService;
import com.sky.atc.easyformse.datautils.MySharedPreferences;

import net.sqlcipher.database.SQLiteDatabase;

import java.util.ArrayList;
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
    SQLiteDatabase database;
    String Event_strt;
    String Event_end;
    String Event_type;
    private static NotificationChannel mChannel = null;
    private static String CHANNEL_ID = "my_channel_01";
    @Override
    public void onReceive(Context context, Intent intent) {
        PowerManager powerManager = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        isPowerSaving = powerManager.isPowerSaveMode();
        Date now = new Date();
        Long time = now.getTime();
        database = sqlitewraper.getDatabase();
        pref = sqlitewraper.getSecureShared("MyPref");

        boolean check1 = DeviceEventsUtils.isMyServiceRunning(sqlitewraper.context,
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

            inser("On");

        } else {
            PowerSavingmodeOff = time;

            pref.putLong("PowerSavingmodeOff", PowerSavingmodeOff);
            pref.commit();
            inser("Off");
        }


    }


    public void inser(String powersavingmode) {
        PowersavingmodeOn = pref.getLong("PowersavingmodeOn", 0);
        PowerSavingmodeOff = pref.getLong("PowerSavingmodeOff", 0);

        Date now = new Date();
        Long time = now.getTime();
        ArrayList<String> logindetails = new ArrayList<>();
        logindetails = DeviceEventsUtils.getLoginDetails();
        String userid = logindetails.get(0);
        String imei = logindetails.get(1);
        String appid = logindetails.get(2);
        String username1 = logindetails.get(3);


        ContentValues c = new ContentValues();
        c.put("username", username1);
        c.put("lat", DeviceEventsUtils.getCurrentLatLng().latitude);
        c.put("lon", DeviceEventsUtils.getCurrentLatLng().longitude);
        c.put("th_s", "");
        c.put("is_send", "0");
        c.put("battery", DeviceEventsUtils.getBatteryInfo());
        c.put("timezone", DeviceEventsUtils.getTimeZone());
        c.put("imei", imei);
        c.put("appid", appid);
        c.put("userid", userid);
        String tid = DeviceEventsUtils.gettid();
        c.put("tid",tid);

        Cursor c2 = database.rawQuery("SELECT _id,Event_strt,Event_end,Event_type FROM  Events WHERE _id = " +
                "(SELECT MAX(_id) FROM Events where Event_type in('Still','StillViolation','Vehicle','Walking','On Bicycle','On Foot','Running','PowerSavingMode') )", null);
        c2.moveToFirst();



        if (c2.getCount() > 0) {
            String id = c2.getString(0);
            Event_strt = c2.getString(1);
            Event_end = c2.getString(2);
            Event_type = c2.getString(3);


            if(Event_type.equalsIgnoreCase("PowerSavingMode"))
            {
                if(Event_end.equalsIgnoreCase("0"))
                {
                    if(powersavingmode.equalsIgnoreCase("Off"))
                    {
                        Duration = time - Long.parseLong(Event_strt);

                        String cnd;
                        cnd = "_id=" + id;
                        ContentValues c_path = new ContentValues();
                        c_path.put("Event_end", time);
                        c_path.put("duration", Duration);
                        c_path.put("utcend", DeviceEventsUtils.utcCalculationOffset(time));

                        long temp = database.update("Events", c_path, cnd, null);

                        boolean check3 = DeviceEventsUtils.isMyServiceRunning(sqlitewraper.context,
                                Event.class.getName());
                        if (check3) {
                        } else {
                            Intent z_n12 = new Intent(sqlitewraper.context, Event.class);
                            WakefulIntentService.sendWakefulWork(sqlitewraper.context,
                                    z_n12);
                        }

                        pref.putLong("PowerSavingmodeOff", 0);
                        pref.putLong("PowersavingmodeOn", 0);
                        pref.commit();
                    }
                }
               else if (powersavingmode.equalsIgnoreCase("On"))
                {
                    c.put("Event_strt", time);
                    c.put("Event_end", "0");
                    c.put("Event_type", "PowerSavingMode");
                    c.put("duration", "0");
                    c.put("utcstart", DeviceEventsUtils.utcCalculationOffset(time));
                    c.put("utcend", DeviceEventsUtils.utcCalculationOffset(0));

                    long tempinsert = database.insert("Events", null, c);
                }
            }
        }

        else {

            if (powersavingmode.equalsIgnoreCase("On"))
            {
                c.put("Event_strt", time);
                c.put("Event_end", "0");
                c.put("Event_type", "PowerSavingMode");
                c.put("duration", "0");
                c.put("utcstart", DeviceEventsUtils.utcCalculationOffset(time));
                c.put("utcend", DeviceEventsUtils.utcCalculationOffset(0));

                long tempinsert = database.insert("Events", null, c);
            }
        }

//        if (PowersavingmodeOn != 0 && PowerSavingmodeOff != 0) {
//            Duration = PowerSavingmodeOff - PowersavingmodeOn;
//            long minutes = TimeUnit.MILLISECONDS.toMinutes(Duration);
//
//            if (Duration > 1000) {
//                boolean isInserted = DeviceEventsUtils.insertIntoEvents(String.valueOf(PowersavingmodeOn), String.valueOf(PowerSavingmodeOff), String.valueOf(Duration), "PowerSavingMode");
//                if (isInserted) {
//                    sendalert();
//                    pref.putLong("PowerSavingmodeOff", 0);
//                    pref.putLong("PowersavingmodeOn", 0);
//                    pref.commit();
//                }
//            }
//
//        }
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
