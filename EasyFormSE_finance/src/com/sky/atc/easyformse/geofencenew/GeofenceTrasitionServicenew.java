package com.sky.atc.easyformse.geofencenew;

import android.app.IntentService;
import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.TaskStackBuilder;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.graphics.Color;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import com.google.android.gms.location.Geofence;
import com.google.android.gms.location.GeofenceStatusCodes;
import com.google.android.gms.location.GeofencingEvent;
import com.sky.atc.easyformse.DeviceEventsUtils;
import com.sky.atc.easyformse.GeofenceDownlaod;
import com.sky.atc.easyformse.MainActivity;
import com.sky.atc.easyformse.R;
import com.sky.atc.easyformse.attendance.newattendanceutils.AttendanceUtil;
import com.sky.atc.easyformse.attendance.newattendanceutils.models.AttendanceData;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.sqlitewraper;
import com.sky.atc.easyformse.trip.LocationOutageUtils;
import com.sky.atc.easyformse.trip.TripBackgroundMapActivity;
import com.sky.atc.easyformse.trip.TripMapUtils;

import net.sqlcipher.database.SQLiteDatabase;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;


//New Service For Receive geofence enter/exit
@StringFogIgnore
public class GeofenceTrasitionServicenew extends IntentService {

    private static final String TAG = "GeoIntentService";
    SQLiteDatabase database;

    public GeofenceTrasitionServicenew() {
        super(TAG);
    }

    @Override
    protected void onHandleIntent(@Nullable Intent intent) {
        database = sqlitewraper.getDatabase();
        GeofencingEvent geofencingEvent = GeofencingEvent.fromIntent(intent);
        if (geofencingEvent.hasError()) {
            Log.d(TAG, "GeofencingEvent error " + geofencingEvent.getErrorCode());
        } else {
            int transaction = geofencingEvent.getGeofenceTransition();
            List<Geofence> geofences = geofencingEvent.getTriggeringGeofences();
           // Geofence geofence = geofences.get(0);

            Intent pipIntent = new Intent(sqlitewraper.context, TripBackgroundMapActivity.class);
            pipIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            if (transaction == Geofence.GEOFENCE_TRANSITION_ENTER) {
                Log.d(TAG, "You are inside Tacme");


                MySharedPreferences  pref = sqlitewraper.getSecureShared("MyPref");
                String ismapcheck;
                ismapcheck = pref.getString("IsMapcheck","false");
                if(LocationOutageUtils.isPiP)
                {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                        if (ismapcheck.equalsIgnoreCase("true"))
                        {
                            pref.putString("IsMapcheck","false");
                            pref.commit();
                            TripBackgroundMapActivity.mActivity.finish();
                        }
                    }
                }
            }
//            else {
//                Log.d(TAG, "You are outside Tacme");
//                String geofenceTransitionDetails = getGeofenceTrasitionDetails(transaction, geofences );
//
//                sendNotification( geofenceTransitionDetails );
//                insertIntoDatabase("OUT", geofenceId);
//            }
            if (transaction == Geofence.GEOFENCE_TRANSITION_EXIT) {
                // Get the geofence that were triggered
                Log.d(TAG, "You are outside Tacme");
                pipIntent.putExtra("IsOpenMAP","1");
                pipIntent.putExtra("enable_pip", true);

                MySharedPreferences pref = sqlitewraper.getSecureShared("MyPref");
                pref.putString("isTripPauseAfterTask","false");
                pref.commit();

                AttendanceData mAttendanceData = AttendanceUtil.getAttendanceDataList().get(0);
                String Duration ;
                boolean shouldStopTrip = false;
                if(mAttendanceData.getAuto_punchout_duration() != null) {
                    try {
                        Duration = mAttendanceData.getAuto_punchout_duration();
                        if (isAfterDuaration(Duration)) {
                            shouldStopTrip = true;
                        }
                    } catch (NumberFormatException e) {
                        // log warning if needed
                    }
                }

                if(shouldStopTrip)
                {
                    MySharedPreferences pref1 = sqlitewraper.getSecureShared("MyPref");
                    pref1.putBoolean("ISExitGeofence",true);
                    pref1.commit();
                }
                List<Geofence> triggeringGeofences = geofencingEvent.getTriggeringGeofences();
                ArrayList<String> geofenceTransitionDetails = getGeofenceTrasitionDetails(transaction, triggeringGeofences);
                // Send notification details as a String
                for (int i = 0; i < geofenceTransitionDetails.size(); i++) {

                    String geofenceId = geofenceTransitionDetails.get(i);
                    Log.d("###CUSTOMERID_GEO123", geofenceId);
                    if (!geofenceId.equalsIgnoreCase("BIG")) {
                        sendNotification(geofenceId);
                        insertIntoDatabase("OUT", geofenceId);
                    }

//                    if (geofenceId.equalsIgnoreCase("BIG")) {
//                        reDrawNewCircle();
//                    }
                }
                if(tripStatus() > 0 ) {
                    if (TripMapUtils.TRIPMAPBACK.equalsIgnoreCase("true")) {
                        sqlitewraper.context.startActivity(pipIntent);
                    }
                }
            }

        }
    }
    private boolean isAfterDuaration(String value) {
        if (value == null || value.isEmpty()) {
            return false; // Handle empty or null input safely
        }

        // Split the string value by ":"
        String[] timeParts = value.split(":");
        if (timeParts.length != 2) {
            return false; // If the string doesn't contain a valid hour:minute format, return false
        }

        try {
            int valueHour = Integer.parseInt(timeParts[0]); // Hour part (e.g., "14" -> 14)
            int valueMinute = Integer.parseInt(timeParts[1]); // Minute part (e.g., "00" -> 0)

            // Get the current time
            Calendar now = Calendar.getInstance();
            int currentHour = now.get(Calendar.HOUR_OF_DAY); // Current hour (0-23)
            int currentMinute = now.get(Calendar.MINUTE); // Current minute (0-59)

            // If the current time hour is greater than the input value hour
            if (currentHour > valueHour) {
                return true;
            }
            // If the current time hour is equal to the input value hour, compare minutes
            else if (currentHour == valueHour) {
                return currentMinute >= valueMinute; // If minutes are equal or after the specified minutes, return true
            }
            return false; // If the current time is before the input time
        } catch (NumberFormatException e) {
            return false; // If parsing fails, handle gracefully by returning false
        }
    }

    private boolean isAfter6PM() {
        Calendar now = Calendar.getInstance();
        int hour = now.get(Calendar.HOUR_OF_DAY);
        return hour >= 18;
    }
    private int tripStatus(){

        Cursor tripflag = database.rawQuery(
                "select * from lat_plug where trip_status = 0", null);
        tripflag.moveToFirst();
        int tripflagCount = tripflag.getCount();
        tripflag.close();
        return tripflagCount;
    }

    //    // Create a detail message with Geofences received
    private ArrayList<String> getGeofenceTrasitionDetails(int geoFenceTransition, List<Geofence> triggeringGeofences) {
        // get the ID of each geofence triggered

        String triggerId = "";

        ArrayList<String> triggeringGeofencesList = new ArrayList<>();
        ArrayList<String> triggeringGeofencesListID = new ArrayList<>();
        for (Geofence geofence : triggeringGeofences) {
            triggeringGeofencesList.add(geofence.getRequestId());
            triggerId = geofence.getRequestId();
            triggeringGeofencesListID.add(triggerId);
        }

        Log.d("####triggerid", triggerId);

        String status = null;
        if (geoFenceTransition == Geofence.GEOFENCE_TRANSITION_ENTER)
            status = "IN";
        else if (geoFenceTransition == Geofence.GEOFENCE_TRANSITION_EXIT)
            status = "OUT";

        return triggeringGeofencesListID;
    }

//    private String getGeofenceTrasitionDetails(int geoFenceTransition, List<Geofence> triggeringGeofences) {
//        // get the ID of each geofence triggered
//        ArrayList<String> triggeringGeofencesList = new ArrayList<>();
//        for ( Geofence geofence : triggeringGeofences ) {
//            triggeringGeofencesList.add( geofence.getRequestId() );
//        }
//
//        String status = null;
//        if ( geoFenceTransition == Geofence.GEOFENCE_TRANSITION_ENTER )
//            status = "Entering ";
//        else if ( geoFenceTransition == Geofence.GEOFENCE_TRANSITION_EXIT )
//            status = "Exiting ";
//        return status;
//    }

    // Send a notification
    private void sendNotification(String msg) {
        Log.i(TAG, "sendNotification: " + msg);

        // Intent to start the main Activity
        Intent notificationIntent = new Intent(this, MainActivity.class);

        TaskStackBuilder stackBuilder = TaskStackBuilder.create(this);
        stackBuilder.addParentStack(MainActivity.class);
        stackBuilder.addNextIntent(notificationIntent);
        PendingIntent notificationPendingIntent = stackBuilder.getPendingIntent(0, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        // Creating and sending Notification
        NotificationManager notificatioMng =
                (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        notificatioMng.notify(
                0,
                createNotification(msg, notificationPendingIntent));
    }

    // Create a notification
    private Notification createNotification(String msg, PendingIntent notificationPendingIntent) {
        NotificationCompat.Builder notificationBuilder = new NotificationCompat.Builder(this);
        notificationBuilder
                .setSmallIcon(R.drawable.atc_logo)
                .setColor(Color.RED)
                .setContentTitle(msg)
                .setContentText("Geofence Notification!")
                .setContentIntent(notificationPendingIntent)
                .setDefaults(Notification.DEFAULT_LIGHTS | Notification.DEFAULT_VIBRATE | Notification.DEFAULT_SOUND)
                .setAutoCancel(true);
        return notificationBuilder.build();
    }

    // Handle errors
    private static String getErrorString(int errorCode) {
        switch (errorCode) {
            case GeofenceStatusCodes.GEOFENCE_NOT_AVAILABLE:
                return "GeoFence not available";
            case GeofenceStatusCodes.GEOFENCE_TOO_MANY_GEOFENCES:
                return "Too many GeoFences";
            case GeofenceStatusCodes.GEOFENCE_TOO_MANY_PENDING_INTENTS:
                return "Too many pending intents";
            default:
                return "Unknown error.";

        }
    }

    private void insertIntoDatabase(String status, String geoId) {

        try {

//            if (status.equalsIgnoreCase("IN")) {
//                long time = System.currentTimeMillis();
//
//                Cursor c3 = database.rawQuery("select user_id,appid FROM Login_Master",
//                        null);
//                c3.moveToLast();
//                String appid = "";
//                String user_id = "";
//                if (c3.getCount() > 0) {
//                    user_id = c3.getString(0);
//                    appid = c3.getString(1);
//                    c3.close();
//                }
//
//
//                String flowid = "";
//                if (!geoId.equalsIgnoreCase("BIG")) {
//
//                    Cursor c4 = database.rawQuery("select flow_id FROM geofence_tracking where place_id='" + geoId + "'",
//                            null);
//                    c4.moveToLast();
//                    if (c4.getCount() > 0) {
//                        flowid = c4.getString(0);
//                        c4.close();
//                    }
//
//                }
////            long utcinTime= DeviceEventsUtils.utcCalculationOffset(time);
//
//                Cursor a_t = database.rawQuery(
//                        "SELECT out_time FROM geofence_user_tracking_detail where place_id='" + geoId + "'ORDER BY id desc LIMIT 1", null);
//                a_t.moveToFirst();
//                int j = a_t.getCount();
//                String out_time = null;
//
//                if (j > 0) {
//                    out_time = a_t.getString(0);
//
//                    if (!out_time.equals("0")) {
//                        ContentValues c = new ContentValues();
//                        c.put("user_id", user_id);
//                        c.put("place_id", geoId);
//                        c.put("in_time", time);
//                        c.put("out_time", "0");
//                        c.put("duration", "");
//                        c.put("is_send", "0");
//                        c.put("appid", appid);
//                        c.put("flowid", flowid);
//                        long temp = database.insert("geofence_user_tracking_detail", null, c);
//                        Log.d("####GeofenceInsert", String.valueOf(temp) + ": " + geoId);
//                        Log.d("####GEOMIlLLI_INSERT", String.valueOf(time));
//                    }
//                } else {
//
//                    ContentValues c = new ContentValues();
//                    c.put("user_id", user_id);
//                    c.put("place_id", geoId);
//                    c.put("in_time", time);
//                    c.put("out_time", "0");
//                    c.put("duration", "");
//                    c.put("is_send", "0");
//                    c.put("appid", appid);
//                    c.put("flowid", flowid);
//                    long temp = database.insert("geofence_user_tracking_detail", null, c);
//                    Log.d("####GeofenceInsert", String.valueOf(temp) + ": " + geoId);
//                    Log.d("####GEOMIlLLI_INSERT", String.valueOf(time));
//
//                }
//                a_t.close();
//            }
            if (status.equalsIgnoreCase("OUT")) {
                long time = System.currentTimeMillis();

                Cursor a_t = database.rawQuery(
                        "select id,place_id,in_time from geofence_user_tracking_detail where id = (SELECT MAX(id) FROM geofence_user_tracking_detail where  place_id='" + geoId + "')", null);
                a_t.moveToFirst();
                int j = a_t.getCount();

                String in_time = null;
                String id = null;
                if (j > 0) {

                    id = a_t.getString(0);
                    String placeid = a_t.getString(1);
                    in_time = a_t.getString(2);

                }
                a_t.close();

                long utcOutTime = DeviceEventsUtils.utcCalculationOffset(time);

                long duration = time - Long.parseLong(in_time);

                MySharedPreferences prefs = sqlitewraper.getSecureShared("mypre1");
                String restoredText = prefs.getString("geofencetime", "900000");
                long geofencetime = Long.parseLong(restoredText);

                Cursor a_t1 = database.rawQuery(
                        "SELECT out_time FROM geofence_user_tracking_detail where place_id='" + geoId + "'ORDER BY id desc LIMIT 1", null);
                a_t1.moveToFirst();
                int j1 = a_t1.getCount();
                String out_time = null;

                if (j1 > 0) {
                    out_time = a_t1.getString(0);

                    if (out_time.equals("0")) {
                        if (duration > geofencetime) {

                            String t = "id='" + id + "'";
                            ContentValues c1 = new ContentValues();
                            c1.put("duration", duration);
                            c1.put("out_time", time);
                            c1.put("is_send", "1");
                            new Handler(Looper.getMainLooper()).post(new Runnable() {
                                public void run() {
                                    Toast toast = Toast.makeText(sqlitewraper.context,geoId +"- Out ", Toast.LENGTH_LONG);
                                    toast.show();
                                }
                            });
                            long temp = database.update("geofence_user_tracking_detail", c1, t, null);

                            if (temp > 0) {
                                GeofenceDownlaod.uploadGeofenceTracking();
                            }


                        } else {

                            String t = "id='" + id + "'";
                            ContentValues c1 = new ContentValues();
                            c1.put("duration", duration);
                            c1.put("out_time", "1");
                            c1.put("is_send", "0");

                            long temp = database.update("geofence_user_tracking_detail", c1, t, null);


                        }
                    }
                } else {
                    if (duration > geofencetime) {

                        String t = "id='" + id + "'";
                        ContentValues c1 = new ContentValues();
                        c1.put("duration", duration);
                        c1.put("out_time", time);
                        c1.put("is_send", "1");
                        new Handler(Looper.getMainLooper()).post(new Runnable() {
                            public void run() {
                                Toast toast = Toast.makeText(sqlitewraper.context,geoId + "- Out ", Toast.LENGTH_LONG);
                                toast.show();
                            }
                        });
                        long temp = database.update("geofence_user_tracking_detail", c1, t, null);

                        if (temp > 0) {
                            GeofenceDownlaod.uploadGeofenceTracking();
                        }


                    } else {

                        String t = "id='" + id + "'";
                        ContentValues c1 = new ContentValues();
                        c1.put("duration", duration);
                        c1.put("out_time", "1");
                        c1.put("is_send", "0");

                        long temp = database.update("geofence_user_tracking_detail", c1, t, null);

                    }
                }

                a_t1.close();


                //     getOutageDuration(in_time, String.valueOf(utcOutTime), id);

            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}