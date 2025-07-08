package com.sky.atc.easyformse.trip;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.media.AudioAttributes;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;

import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import com.commonsware.cwac.wakeful.WakefulIntentService;
import com.sky.atc.easyformse.DeviceEventsUtils;
import com.sky.atc.easyformse.Event;
import com.sky.atc.easyformse.R;
import com.sky.atc.easyformse.data;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.sqlitewraper;

import net.sqlcipher.database.SQLiteDatabase;

import org.json.JSONObject;

import java.util.Date;
import java.util.concurrent.TimeUnit;

import io.michaelrocks.paranoid.Obfuscate;

//Speed violation calculation
@Obfuscate
public class SpeedViolation {


    public static long getSpeedVioDur() {
        return speedVioDur;
    }

    public static void setSpeedVioDur(long speedVioDur) {
        SpeedViolation.speedVioDur = speedVioDur;
    }

    private static long speedVioDur;
    private static MySharedPreferences sharedPreferences;

    private static int flag = 0;
    private static data d = new data();
    private static long detectedMilli;
    private static SQLiteDatabase database = sqlitewraper.getDatabase();
    private static  float lastMaxSpeed;
    private static  float lastMaxMilli;
    private static  long savedMilli;

    public static void onSpeedViolationOccured(float speed, double lat, double lon, String provider, String tripflag, float acc,String timelocation) {


        //convert speed to m/s to km/h
        float fact = (float) 18 / 5;
        float ac_speed = speed * fact;

        Log.d("SPEED_PROVIDER", provider);
        Log.d("SPEED_DETECTEDMILLI", String.valueOf(detectedMilli));



        //-------------------Speed Violation-----------//
        if (!d.getusername().equalsIgnoreCase("0")) {

            Log.d("SPEED_ACSPEED", String.valueOf(ac_speed));

            //if trip is running
            if (tripStatus() > 0) {

                //if current speed is greater than speed limit and last speed is less than speed limit
                //than violation is started
                if ((d.getSpeedLimit() < ac_speed) && (d.getspeed_time() < d.getSpeedLimit())) {
                    Log.d("##SPEED_DETECT", String.valueOf(ac_speed));
                    detectedMilli = System.currentTimeMillis();
                    d.setspeed_time(ac_speed);
                    flag = 1;
                    lastMaxMilli=0;
                    lastMaxSpeed=0;
                    savedMilli = 0;
//                  insertIntoTrackMaster(lat, lon, provider, speed, timelocation, String.valueOf(acc));
                }
                d.setspeed_time(ac_speed);

                //current speed less than speed limit and violation is already started
                //than reset the detected speed violation
                if (ac_speed < d.getSpeedLimit() && flag == 1) {
                    flag = 0;
                    detectedMilli = System.currentTimeMillis();
                    lastMaxMilli=0;
                    lastMaxSpeed=0;
                }

                //speed violation in progress
                if (flag == 1) {

                    //max speed detection logic during speed violation
                    if (speed > lastMaxSpeed){
                        lastMaxSpeed=speed;
                        lastMaxMilli=System.currentTimeMillis();
                    }

                    sharedPreferences = sqlitewraper.getSecureShared("pre1");
                    long currentTime = System.currentTimeMillis();
                    long duration = currentTime - detectedMilli;

                    Log.d("##LAST_SPEED_DURATION", String.valueOf(duration));
                    String speedDuration = sharedPreferences.getString("speedviolation", "120000");
                    long speedDura = 0;
                    if(speedDuration != null && !speedDuration.equalsIgnoreCase(""))
                    {
                        speedDura = Long.parseLong(speedDuration);
                    }

                    if(savedMilli == 0){

                        savedMilli = currentTime;
                        Log.d("##VIOLATION_1ST", String.valueOf(savedMilli));
                        //insert location again in track _master with tripflag=3 to indicate speed violation location
                        insertIntoTrackMaster(lat, lon, provider, speed, currentTime, String.valueOf(acc));

                        //logically it will not execute after 45 seconds logic it will be
                        //executed in upper if's else condition
                        //speed violation is detected with duration greater than set limit
                        if (duration > speedDura && ac_speed > d.getSpeedLimit() && flag == 1) {

                            try {

                                new Handler(Looper.getMainLooper()).post(SpeedViolation::speedViolationAlert);
                                ContentValues c = new ContentValues();
                                c.put("username", d.getusername());
                                c.put("Event_type", "speed");
                                c.put("is_send", "0");
                                c.put("lat", lat);
                                c.put("lon", lon);
                                //New added Code
                                c.put("th_s", "Still");
                                c.put("battery", DeviceEventsUtils.getBatteryInfo());
                                c.put("timezone", DeviceEventsUtils.getTimeZone());
                                c.put("utcstart", DeviceEventsUtils.utcCalculationOffset(detectedMilli));
                                c.put("utcend", DeviceEventsUtils.utcCalculationOffset(currentTime));
                                c.put("imei", DeviceEventsUtils.getLoginDetails().get(1));
                                c.put("appid", DeviceEventsUtils.getLoginDetails().get(2));
                                c.put("userid", DeviceEventsUtils.getLoginDetails().get(0));
                                c.put("Event_strt", detectedMilli);
                                c.put("Event_end", currentTime);
                                c.put("duration", duration);

                                //
                                JSONObject maxViolation = new JSONObject();
                                maxViolation.put("maxspeed",lastMaxSpeed);
                                maxViolation.put("maxspeedmilli",lastMaxMilli);

                                c.put("maxviolation",maxViolation.toString());

                                String tid = gettid();

                                c.put("tid",tid);

                                Log.d("##SPEED_FINALDETECT", String.valueOf(ac_speed));
                                long temp1 = database.insert("Events", null, c);
                                flag = 0;

                                Log.d("##SPEED_LAST_VIOLATION", String.valueOf(lastMaxSpeed));

                                //upload the event to server for alert
                                Intent z_n12 = new Intent(sqlitewraper.context, Event.class);
                                WakefulIntentService.sendWakefulWork(sqlitewraper.context, z_n12);
                                lastMaxSpeed=0;
                                lastMaxMilli=0;
//                          insertIntoTrackMaster(lat, lon, provider, speed, timelocation, String.valueOf(acc));

                            } catch (Exception e) {
                                e.printStackTrace();
                                Log.d("SPEED_EXCEPTION", e.getMessage());
                            }
                        }

                    }else {

                        long newtimedur = currentTime - savedMilli;
                        long newseconds = TimeUnit.MILLISECONDS.toSeconds(newtimedur);
                        Log.d("##VIOLATION_SEC", String.valueOf(newseconds));

                        //if location received for speed violation are within 45 seconds duration
                        //than only consider them for speed violation event
                        if(newseconds > 45){

                            savedMilli = currentTime;
                            Log.d("##VIOLATION_MORETHAN45", String.valueOf(savedMilli));

                        }else {

                            insertIntoTrackMaster(lat, lon, provider, speed, currentTime, String.valueOf(acc));
                            if (duration > speedDura && ac_speed > d.getSpeedLimit() && flag == 1) {

                                try {
                                    new Handler(Looper.getMainLooper()).post(SpeedViolation::speedViolationAlert);
                                    ContentValues c = new ContentValues();
                                    c.put("username", d.getusername());
                                    c.put("Event_type", "speed");
                                    c.put("is_send", "0");
                                    c.put("lat", lat);
                                    c.put("lon", lon);
                                    //New added Code
                                    c.put("th_s", "Still");
                                    c.put("battery", DeviceEventsUtils.getBatteryInfo());
                                    c.put("timezone", DeviceEventsUtils.getTimeZone());
                                    c.put("utcstart", DeviceEventsUtils.utcCalculationOffset(detectedMilli));
                                    c.put("utcend", DeviceEventsUtils.utcCalculationOffset(currentTime));
                                    c.put("imei", DeviceEventsUtils.getLoginDetails().get(1));
                                    c.put("appid", DeviceEventsUtils.getLoginDetails().get(2));
                                    c.put("userid", DeviceEventsUtils.getLoginDetails().get(0));
                                    c.put("Event_strt", detectedMilli);
                                    c.put("Event_end", currentTime);
                                    c.put("duration", duration);

                                    JSONObject maxViolation = new JSONObject();
                                    maxViolation.put("maxspeed",lastMaxSpeed);
                                    maxViolation.put("maxspeedmilli",lastMaxMilli);

                                    c.put("maxviolation",maxViolation.toString());

                                    String tid = gettid();

                                    c.put("tid",tid);

                                    Log.d("##SPEED_FINALDETECT", String.valueOf(ac_speed));
                                    long temp1 = database.insert("Events", null, c);
                                    flag = 0;

                                    Log.d("##SPEED_LAST_VIOLATION", String.valueOf(lastMaxSpeed));

                                    Intent z_n12 = new Intent(sqlitewraper.context, Event.class);
                                    WakefulIntentService.sendWakefulWork(sqlitewraper.context, z_n12);
                                    lastMaxSpeed=0;
                                    lastMaxMilli=0;
//                          insertIntoTrackMaster(lat, lon, provider, speed, timelocation, String.valueOf(acc));

                                } catch (Exception e) {
                                    e.printStackTrace();
                                    Log.d("SPEED_EXCEPTION", e.getMessage());
                                }
                            }
                            savedMilli = currentTime;
                            Log.d("##VIOLATION_LESSTHAN45", String.valueOf(savedMilli));
                        }
                    }
                }
            }else {
                lastMaxSpeed=0;
                lastMaxMilli=0;
                flag=0;
                detectedMilli = System.currentTimeMillis();
                d.setspeed_time(0.0f);
            }
        }
    }

    private static int tripStatus() {

        SQLiteDatabase database = sqlitewraper.getDatabase();

        android.database.Cursor tripflag = database.rawQuery(
                "select * from lat_plug where trip_status = 0", null);
        tripflag.moveToFirst();
        int tripflagCount = tripflag.getCount();
        tripflag.close();
        return tripflagCount;
    }

    @SuppressLint("WrongConstant")
    private static void speedViolationAlert() {


        Uri sound = Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE + "://" + sqlitewraper.context.getPackageName() + "/" + R.raw.emergencytone);

        NotificationChannel channel;

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {

//            AudioAttributes attributes;
//            attributes = new AudioAttributes.Builder()
//                    .setUsage(AudioAttributes.USAGE_NOTIFICATION)
//                    .build();
            channel = new NotificationChannel("channel01", "name", NotificationManager.IMPORTANCE_HIGH);
            channel.setDescription("description");
//            channel.setSound(sound, attributes);
            //  notification play custom sound
            Ringtone r = RingtoneManager.getRingtone(sqlitewraper.context, sound);
            r.play();
            NotificationManager notificationManager = sqlitewraper.context.getSystemService(NotificationManager.class);
            notificationManager.createNotificationChannel(channel);
        }

// Register channel with system
        Notification notification = new NotificationCompat.Builder(sqlitewraper.context, "channel01")
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle("Speed Violation")
                .setContentText("You are currently violating Speed limit policy, decrease your speed")
                .setSound(sound)
                .setPriority(NotificationCompat.PRIORITY_HIGH)   // heads-up
                .build();

        NotificationManagerCompat notificationManager1 = NotificationManagerCompat.from(sqlitewraper.context);
        if (ActivityCompat.checkSelfPermission(sqlitewraper.context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            // TODO: Consider calling
            //    ActivityCompat#requestPermissions
            // here to request the missing permissions, and then overriding
            //   public void onRequestPermissionsResult(int requestCode, String[] permissions,
            //                                          int[] grantResults)
            // to handle the case where the user grants the permission. See the documentation
            // for ActivityCompat#requestPermissions for more details.
            return;
        }
        notificationManager1.notify(202, notification);
    }


    private static void insertIntoTrackMaster(double lat, double lon, String provider, float speed, long Milli, String acc) {


        if (provider.equalsIgnoreCase("gps")) {
            provider = "fused";
        }
        if (provider.equalsIgnoreCase("fused")) {
            provider = "gps";
        }

        Date now = new Date();
        String date_s = now.toString();

        ContentValues args = new ContentValues();
        args.put("cellid", "NA");
        args.put("lat", DeviceEventsUtils.LatlngRoundff(String.valueOf(lat)));
        args.put("date", String.valueOf(Milli));
        args.put("date_s", date_s);
        args.put("lon", DeviceEventsUtils.LatlngRoundff(String.valueOf(lon)));
        args.put("provider", provider);
        args.put("accuracy", acc);
        args.put("IS_SEND", 0);
        args.put("IS_LOC", String.valueOf(Milli));
        args.put("address", "NA");
        args.put("username", DeviceEventsUtils.getLoginDetails().get(0));
        args.put("speed", speed);
        args.put("tripflag", "3");
        args.put("locationtime", String.valueOf(Milli));
        long temp = database.insert("track_master", null, args);
        Log.d("SPEED_TRACKMASTER", String.valueOf(temp));

    }

    public static String gettid(){
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
}
