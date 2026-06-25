package com.sky.atc.easyformse.geofencenew;

import android.app.IntentService;
import android.app.Notification;
import android.app.PendingIntent;
import android.app.TaskStackBuilder;
import android.content.ContentValues;
import android.content.Intent;
import android.content.SharedPreferences;
import android.database.Cursor;
import android.graphics.Color;
import androidx.core.app.NotificationCompat;

import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.widget.Toast;

import com.google.android.gms.location.Geofence;
import com.google.android.gms.location.GeofenceStatusCodes;
import com.google.android.gms.location.GeofencingEvent;
import com.sky.atc.easyformse.AddressApi;
import com.sky.atc.easyformse.DeviceEventsUtils;
import com.sky.atc.easyformse.GeofenceDownlaod;
import com.sky.atc.easyformse.MainActivity;
import com.sky.atc.easyformse.R;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.sqlitewraper;

import net.sqlcipher.database.SQLiteDatabase;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

//To receive Geofence event occurence enter/exit
@StringFogIgnore
public class GeofenceTrasitionService extends IntentService {

    public static final int GEOFENCE_NOTIFICATION_ID = 0;
    private static final String TAG = GeofenceTrasitionService.class.getSimpleName();
    private static final String KEY_ENTERTIME = "entertime";
    private static final String KEY_GEOFENCEID = "geofenceid";
    SQLiteDatabase database;


    public GeofenceTrasitionService() {
        super(TAG);
    }

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

    @Override
    protected void onHandleIntent(Intent intent) {

        database = sqlitewraper.getDatabase();


        GeofencingEvent geofencingEvent = GeofencingEvent.fromIntent(intent);
        // Handling errors
        if (geofencingEvent.hasError()) {
            String errorMsg = getErrorString(geofencingEvent.getErrorCode());
            Log.e(TAG, errorMsg);
            return;
        }

        int geoFenceTransition = geofencingEvent.getGeofenceTransition();
        // Check if the transition type is of interest
//        if (geoFenceTransition == Geofence.GEOFENCE_TRANSITION_ENTER)  // remove transition enter and use dwell 24062026
        if (geoFenceTransition == Geofence.GEOFENCE_TRANSITION_DWELL)
        {
            // Get the geofence that were triggered
            List<Geofence> triggeringGeofences = geofencingEvent.getTriggeringGeofences();
            ArrayList<String> geofenceTransitionDetails = getGeofenceTrasitionDetails(geoFenceTransition, triggeringGeofences);
            // Send notification details as a String

            for (int i=0;i<geofenceTransitionDetails.size();i++) {

                String geofenceId=geofenceTransitionDetails.get(i);
                sendNotification(geofenceTransitionDetails.get(i));
                //insert Into Database
                if (!geofenceId.equalsIgnoreCase("BIG")) {
                    sendNotification(geofenceId);
                    insertIntoDatabase("IN", geofenceId);
                    // geofence in time check trip running or not and out time not check trip running or not 18-03-2026
                    if(DeviceEventsUtils.tripStatus().equalsIgnoreCase("true"))
                    {
                        insertInto_In_Out_Database("IN", geofenceId);
                    }
                }
            }
        }
        if (geoFenceTransition == Geofence.GEOFENCE_TRANSITION_EXIT) {
            // Get the geofence that were triggered
            List<Geofence> triggeringGeofences = geofencingEvent.getTriggeringGeofences();
            ArrayList<String> geofenceTransitionDetails = getGeofenceTrasitionDetails(geoFenceTransition, triggeringGeofences);
            // Send notification details as a String
            for (int i=0;i<geofenceTransitionDetails.size();i++) {

                String geofenceId=geofenceTransitionDetails.get(i);

                if (!geofenceId.equalsIgnoreCase("BIG")) {
                    sendNotification(geofenceId);
                    insertIntoDatabase("OUT", geofenceId);
                    insertInto_In_Out_Database("OUT", geofenceId);

                }

                if (geofenceId.equalsIgnoreCase("BIG")) {
                    reDrawNewCircle();
                }
            }
        }
    }

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
        if (geoFenceTransition == Geofence.GEOFENCE_TRANSITION_DWELL)
            status = "IN";
        else if (geoFenceTransition == Geofence.GEOFENCE_TRANSITION_EXIT)
            status = "OUT";

        return triggeringGeofencesListID;
    }

    private void sendNotification(String msg) {
        Log.i(TAG, "sendNotification: " + msg);

        // Intent to start the main Activity
        Intent notificationIntent = MainActivity.makeNotificationIntent(
                getApplicationContext(), msg
        );

        TaskStackBuilder stackBuilder = TaskStackBuilder.create(this);
        stackBuilder.addParentStack(MainActivity.class);
        stackBuilder.addNextIntent(notificationIntent);
        PendingIntent notificationPendingIntent = stackBuilder.getPendingIntent(0, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);


        // Creating and sending Notification

        if (!msg.equalsIgnoreCase("BIG")) {
//            NotificationManager notificatioMng =
//                    (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
//            notificatioMng.notify(
//                    GEOFENCE_NOTIFICATION_ID,
//                    createNotification(msg, notificationPendingIntent));
        }
    }

    // Create notification
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

    private void insertIntoDatabase(String status, String geoId) {

        try {
            // is_send 0 = in , is_send 1 = out , is_send 2 = server upload
            if (status.equalsIgnoreCase("IN")) {
                long time = System.currentTimeMillis();

                Cursor c3 = database.rawQuery("select user_id,appid FROM Login_Master",
                        null);
                c3.moveToLast();
                String appid = "";
                String user_id = "";
                if (c3.getCount() > 0) {
                    user_id = c3.getString(0);
                    appid = c3.getString(1);
                    c3.close();
                }


                String flowid = "";
                if (!geoId.equalsIgnoreCase("BIG")) {

                    Cursor c4 = database.rawQuery("select flow_id FROM geofence_tracking where place_id='" + geoId + "'",
                            null);
                    c4.moveToLast();
                    if (c4.getCount() > 0) {
                        flowid = c4.getString(0);
                        c4.close();
                    }

                }
//            long utcinTime= DeviceEventsUtils.utcCalculationOffset(time);

                Cursor a_t = database.rawQuery(
                        "SELECT out_time FROM geofence_user_tracking_detail where place_id='" + geoId + "'ORDER BY id desc LIMIT 1", null);
                a_t.moveToFirst();
                int j = a_t.getCount();
                String out_time = null;

                if (j > 0) {
                    out_time = a_t.getString(0);

                    if (!out_time.equals("0")) {
                        ContentValues c = new ContentValues();
                        c.put("user_id", user_id);
                        c.put("place_id", geoId);
                        c.put("in_time", time);
                        c.put("out_time", "0");
                        c.put("duration", "");
                        c.put("is_send", "0");
                        c.put("appid", appid);
                        c.put("flowid", flowid);
//                        new Handler(Looper.getMainLooper()).post(new Runnable() {
//                            public void run() {
//                                Toast toast = Toast.makeText(sqlitewraper.context,geoId + "- In ", Toast.LENGTH_LONG);
//                                toast.show();
//                            }
//                        });

                        long temp = database.insert("geofence_user_tracking_detail", null, c);
                        Log.d("####GeofenceInsert", String.valueOf(temp) + ": " + geoId);
                        Log.d("####GEOMIlLLI_INSERT", String.valueOf(time));
                    }
                } else {

                    ContentValues c = new ContentValues();
                    c.put("user_id", user_id);
                    c.put("place_id", geoId);
                    c.put("in_time", time);
                    c.put("out_time", "0");
                    c.put("duration", "");
                    c.put("is_send", "0");
                    c.put("appid", appid);
                    c.put("flowid", flowid);
//                    new Handler(Looper.getMainLooper()).post(new Runnable() {
//                        public void run() {
//                            Toast toast = Toast.makeText(sqlitewraper.context,geoId + "- In ", Toast.LENGTH_LONG);
//                            toast.show();
//                        }
//                    });

                    long temp = database.insert("geofence_user_tracking_detail", null, c);
                    Log.d("####GeofenceInsert", String.valueOf(temp) + ": " + geoId);
                    Log.d("####GEOMIlLLI_INSERT", String.valueOf(time));

                }
                a_t.close();
            }
//            if status getting out update out_time and is_send 1
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

                if(j1>0){
                    out_time = a_t1.getString(0);

                    if (out_time.equals("0")) {
                        if (duration > geofencetime) {

                            String t = "id='" + id + "'";
                            ContentValues c1 = new ContentValues();
                            c1.put("duration", duration);
                            c1.put("out_time", time);
                            c1.put("is_send", "1");

//                            new Handler(Looper.getMainLooper()).post(new Runnable() {
//                                public void run() {
//                                    Toast toast = Toast.makeText(sqlitewraper.context, geoId +"- Out ", Toast.LENGTH_LONG);
//                                    toast.show();
//                                }
//                            });

                            long temp = database.update("geofence_user_tracking_detail", c1, t, null);
                            Log.d("####GeofenceUpdate", String.valueOf(temp) + ":" + geoId);
                            Log.d("####GEOMILLI_UPDATE", String.valueOf(time));

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
                            Log.d("####GeoDuration", String.valueOf(temp) + ":" + geoId);
                            Log.d("####GEODuration", String.valueOf(duration));

                        }
                    }
                }else {
                    if (duration > geofencetime) {

                        String t = "id='" + id + "'";
                        ContentValues c1 = new ContentValues();
                        c1.put("duration", duration);
                        c1.put("out_time", time);
                        c1.put("is_send", "1");

//                        new Handler(Looper.getMainLooper()).post(new Runnable() {
//                            public void run() {
//                                Toast toast = Toast.makeText(sqlitewraper.context,geoId +"- Out ", Toast.LENGTH_LONG);
//                                toast.show();
//                            }
//                        });
                        long temp = database.update("geofence_user_tracking_detail", c1, t, null);
                        Log.d("####GeofenceUpdate", String.valueOf(temp) + ":" + geoId);
                        Log.d("####GEOMILLI_UPDATE", String.valueOf(time));

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
                        Log.d("####GeoDuration", String.valueOf(temp) + ":" + geoId);
                        Log.d("####GEODuration", String.valueOf(duration));
                    }
                }

                a_t1.close();




                //     getOutageDuration(in_time, String.valueOf(utcOutTime), id);

            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void reDrawNewCircle() {
        GeoFenceDraw geoFenceDraw = new GeoFenceDraw();
        geoFenceDraw.clearGeofence(1);
    }

    public void getOutageDuration(String min_milli, String max_milli, String id) {

        Cursor check = database.rawQuery(
                "select _id,Event_strt,Event_end,Event_type,lat,lon,th_s,duration,battery from Events where Event_strt>="
                        + min_milli + " and Event_end <=" + max_milli
                        + " and Event_type IN ('Gps_outage','Gprs_outage','Phone_outage','App_outage','Service_outage')", null);

        JSONArray di_n = new JSONArray();
        check.moveToFirst();
        if ((check.getCount() > 0)) {
            for (int i = 0; i < check.getCount(); i++)
                try {
                    JSONObject jObjd = new JSONObject();
                    if (check.getCount() > 0) {

                        String Event_strt = check.getString(1);
                        String Event_end = check.getString(2);
                        String Event_type = check.getString(3);

                        String lat = check.getString(4);
                        String lon = check.getString(5);
                        String th_s = check.getString(6);
                        String duration = check.getString(7);
                        String battery = check.getString(8);

                        String address = AddressApi.getCompleteAddress(Double.valueOf(lat), Double.valueOf(lon));


                        jObjd.put("Event_strt", Event_strt);
                        jObjd.put("Event_end", Event_end);
                        jObjd.put("Event_type", Event_type);
                        jObjd.put("Event_duration", duration);
                        jObjd.put("battery", battery);
                        di_n.put(jObjd);
                        check.moveToNext();
                    }

                } catch (Exception e) {
                    e.printStackTrace();
                }

            String t = "id='" + id + "'";
            ContentValues c1 = new ContentValues();
            c1.put("service_outage", di_n.toString());
            long temp = database.update("geofence_user_tracking_detail", c1, t, null);
            Log.d("####Outage_Duration", String.valueOf(temp) + ":" + id);

        } else {
            try {
                String t = "id='" + id + "'";
                ContentValues c1 = new ContentValues();
                c1.put("service_outage", "");
                long temp = database.update("geofence_user_tracking_detail", c1, t, null);
                Log.d("##outage_Duration", String.valueOf(temp) + ":" + id);

            } catch (Exception e) {
            }
        }
    }


    private void insertInto_In_Out_Database(String status,String geoId)
    {
        if (status.equalsIgnoreCase("IN"))
        {
            long time = System.currentTimeMillis();

            Cursor cursor = database.rawQuery(
                    "SELECT id,place_id,event FROM geofence_user_tracking_In_Out ORDER BY id DESC LIMIT 1",
                    null
            );

            String flowid = "";
            if (!geoId.equalsIgnoreCase("BIG")) {

                Cursor c4 = database.rawQuery("select flow_id FROM geofence_tracking where place_id='" + geoId + "'",
                        null);
                c4.moveToLast();
                if (c4.getCount() > 0) {
                    flowid = c4.getString(0);
                    c4.close();
                }

            }

            if (cursor.moveToFirst()) {
                // Row already exists → UPDATE
                String id = cursor.getString(0);
                String place_id = cursor.getString(1);
                String event = cursor.getString(2);

                if(place_id.equalsIgnoreCase(geoId) && event.equalsIgnoreCase(status))
                {
                    cursor.close();
                    return;
                }

                ContentValues cv = new ContentValues();
                cv.put("place_id", geoId);
                cv.put("in_time", time);
                cv.put("out_time", "0");
                cv.put("duration", "");
                cv.put("is_send", "0");
                cv.put("flowid",flowid);
                cv.put("event", "IN");
                int updated =  database.update("geofence_user_tracking_In_Out", cv, id, null);

                Log.d("###GEO", "ENTER UPDATE row: " + updated);

                if (updated > 0) {
                    GeofenceDownlaod.uploadGeofenceINOutTracking();
                }

            } else {
                //  First time → INSERT

                Cursor c3 = database.rawQuery("select user_id,username,appid FROM Login_Master", null);

                String user_id = "";
                String appid = "";
                String username = "";

                if (c3.moveToLast()) {
                    user_id = c3.getString(0);
                    username = c3.getString(1);
                    appid = c3.getString(2);
                }
                c3.close();



                ContentValues c = new ContentValues();
                c.put("user_id", user_id);
                c.put("place_id", geoId);
                c.put("in_time", time);
                c.put("out_time", "0");
                c.put("duration", "");
                c.put("is_send", "0");
                c.put("appid", appid);
                c.put("flowid",flowid);
                c.put("event", "IN");

                long result = database.insert("geofence_user_tracking_In_Out", null, c);

                Log.d("###GEO", "FIRST INSERT: " + result);

                if (result > 0) {
                     GeofenceDownlaod.uploadGeofenceINOutTracking();
                }
            }

            cursor.close();
        }

        else if(status.equalsIgnoreCase("OUT"))
        {
            long time = System.currentTimeMillis();

            Cursor cursor = database.rawQuery(
                    "SELECT id,in_time,place_id FROM geofence_user_tracking_In_Out ORDER BY id DESC LIMIT 1",
                    null
            );

            if (cursor.moveToFirst()) {

                String id = cursor.getString(0);
                String in_time = cursor.getString(1);
                String place_id = cursor.getString(2);

                if (!geoId.equalsIgnoreCase(place_id)) {
                    Log.d("###GEO", "EXIT ignored (different geofence)");
                    cursor.close();
                    return;
                }

                long duration = time - Long.parseLong(in_time);

                // GET geofencetime
                MySharedPreferences prefs = sqlitewraper.getSecureShared("mypre1");
                String restoredText = prefs.getString("geofencetime", "900000"); // default 15 min 900000
                long geofencetime = Long.parseLong(restoredText);

                ContentValues cv = new ContentValues();

               // if (duration > geofencetime) // remove 15 min duration  07052026
                 {
                    cv.put("in_time", "0");
                    cv.put("out_time", time);
                    cv.put("duration", duration);
                    cv.put("is_send", "0");
                    cv.put("event", "OUT");

                    database.update("geofence_user_tracking_In_Out", cv, id,null);

                    Log.d("###GEO", "EXIT VALID → API");

                     GeofenceDownlaod.uploadGeofenceINOutTracking();

                 }
            }

            cursor.close();
        }
    }
}
