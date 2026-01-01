package com.sky.atc.easyformse;

import static android.content.Context.LOCATION_SERVICE;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;

import android.annotation.SuppressLint;
import android.app.ActivityManager;
import android.app.ActivityManager.RunningServiceInfo;
import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;

import net.sqlcipher.database.SQLiteDatabase;

import android.database.Cursor;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.media.AudioAttributes;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.CountDownTimer;
import android.os.Handler;
import android.os.Looper;
import android.os.StrictMode;
import android.os.SystemClock;
import android.util.Log;
import android.widget.Toast;


import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import com.commonsware.cwac.wakeful.WakefulIntentService;
import com.google.android.gms.location.ActivityRecognitionResult;
import com.google.android.gms.location.DetectedActivity;
import com.sky.atc.easyformse.attendance.newattendanceutils.AttendanceUtil;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.trip.SpeedViolation;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

//Activity Recognizes the activity type and start the service for Acc Deacc
@StringFogIgnore
public class activity_recognize extends BroadcastReceiver {

    private SQLiteDatabase databse;
    MySharedPreferences pref = sqlitewraper.getSecureShared("MyPref");
    //    Editor editor = pref.edit();
    Long time_c;
    LocationManager locationManager;
    double mlat;
    double mlon;
    int vehicleflag = 0;
    int vehicleflag_check;
    int Eventflag = 0;
    long eve_time;
    String eve_lat;
    String eve_lon;
    String still_flag;
    String vehicle_flag;
    String event_name;
    data d;
    String userid;
    String imei;
    String appid;
    String username1;
    String Event_strt;
    String Event_end;
    String Event_type;
    PendingIntent pendingIntent;
    AlarmManager alarmManager;
    boolean IsCheckAlaraSet;
    int Eventflag_check;
    String isEvents;
    String ShowEventToast;
    long intervalMillis = 30 * 60 * 1000;   // 30 minutes
    private static final String MY_PREFS_NAME = "MY_TRIP";
    int StillUploadEventCount =0;
    MySharedPreferences Eventprefs = sqlitewraper.getSecureShared(MY_PREFS_NAME);
    @Override
    public void onReceive(Context context, Intent intent) {
        StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
        StrictMode.setThreadPolicy(policy);
        if (ActivityRecognitionResult.hasResult(intent)) {
            isEvents = sqlitewraper.context.getResources().getString(R.string.EVENTS);
            ShowEventToast = sqlitewraper.context.getResources().getString(R.string.EventToast);
            databse = sqlitewraper.getDatabase();
            d = new data();
            try {
                eve_time = pref.getLong("event_start", 0);
            } catch (Exception e) {
                eve_time = 0;
            }

            still_flag = pref.getString("still_flag", "0");
            vehicle_flag = pref.getString("vehicle_flag", "0");
            event_name = pref.getString("event_name", "NA");
            // String event_name = "V";
            eve_lat = pref.getString("eve_lat", "NA");
            eve_lon = pref.getString("eve_lon", "NA");
            IsCheckAlaraSet = pref.getBoolean("isAlarmSet", false);
            // Extract the result from the Response

            ActivityRecognitionResult result = ActivityRecognitionResult
                    .extractResult(intent);
            DetectedActivity detectedActivity = result
                    .getMostProbableActivity();

            // Get the Confidence and Name of Activity
            int confidence = detectedActivity.getConfidence();
            String mostProbableName = getActivityName(detectedActivity
                    .getType());
            Log.d("##confidence", String.valueOf(confidence));
            Log.d("##mostProbableName", mostProbableName);

            reqLocation();
            String mydate = java.text.DateFormat.getDateTimeInstance().format(
                    Calendar.getInstance().getTime());

           // if isevent tag true print toast msg and handle physical events(28-11-2023)
            if(isEvents.equalsIgnoreCase("true")) {
                if(tripStatus() > 0) {
                    // if ShowEventToast is true show toast msg other wise not show toast (13-02-2024)
                    if(ShowEventToast.equalsIgnoreCase("true")) {
                        Toast.makeText(context, "Current Activity: " + mostProbableName, Toast.LENGTH_LONG).show();
                    }
                    // when event type count store
                    StillUploadEventCount = pref.getInt("Eventupload", 0);
                    if (StillUploadEventCount == 0) {
                        StillUploadEventCount++;
                        pref.putInt("Eventupload", StillUploadEventCount);
                        pref.commit();
                    } else {

                        StillUploadEventCount++;
                        pref.putInt("Eventupload", StillUploadEventCount);
                        pref.commit();
                    }

                    if(StillUploadEventCount == 5)
                    {
                        // StillUploadEventCount 5 call still violation event
                        boolean check3 = isMyServiceRunning(sqlitewraper.context,
                                Event.class.getName());
                        if (check3) {
                        } else {
                            Intent z_n12 = new Intent(sqlitewraper.context, Event.class);
                            WakefulIntentService.sendWakefulWork(sqlitewraper.context,
                                    z_n12);
                        }
                        pref.putInt("Eventupload", 0);
                        pref.commit();
                    }
                //Check if user is in Vehicle
                if (mostProbableName.equalsIgnoreCase("V") && confidence > 60) {

                    try {
                        time_c = System.currentTimeMillis();

                        if (!d.getusername().equalsIgnoreCase("0")) {

                            vehicleflag_check = pref.getInt("vehicleflag", 0);
                            if (vehicleflag_check == 0) {
                                vehicleflag++;
                                pref.putInt("vehicleflag", vehicleflag);
                                pref.commit();
                            } else {

                                vehicleflag_check++;
                                pref.putInt("vehicleflag", vehicleflag_check);
                                pref.commit();
                            }

                            Double distnace = find_distance();

                            // check vehicle event get 3 time after insert value
                            if (vehicleflag_check >= 3) {
                                //insert vehicle event if the distance is more than 100 meter
                                if (distnace > 100) {
                                    insertIntoEvents(String.valueOf(eve_time), String.valueOf(time_c), "0", "vehicle");

                                    //save current time to use in next Event start time
                                    pref.putString("still_flag", "0");
                                    pref.putString("event_name", "V");
                                    pref.putString("eve_lat", d.getlatlon()[0]);
                                    pref.putString("eve_lon", d.getlatlon()[1]);

                                    pref.putString("vehicle_flag", "1");
                                    pref.putLong("event_start", time_c);
                                    pref.putInt("vehicleflag", 0);
                                    pref.commit();

                                    if (tripStatus() > 0) {
                                        boolean check1 = isMyServiceRunning(
                                                sqlitewraper.context,
                                                newfused_accel.class.getName());
                                        if (!check1) {
                                            //start the acc/deacc service for calculation
                                            Intent i = new Intent(sqlitewraper.context, newfused_accel.class);
                                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                                                sqlitewraper.context.startForegroundService(i);
                                            } else {
                                                sqlitewraper.context.startService(i);
                                            }
                                        }
                                    } else {
                                        //stop newfused_accel service if trip is stopped
                                        boolean check12 = isMyServiceRunning(sqlitewraper.context,
                                                newfused_accel.class.getName());
                                        if (check12) {
                                            Intent i12 = new Intent(sqlitewraper.context, newfused_accel.class);
                                            sqlitewraper.context.stopService(i12);
                                        }
                                    }
                                } else {
                                    pref.putInt("vehicleflag", 0);
                                    pref.commit();
                                }

                            }
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                    }

                }
                //Check if user is not in Vehicle
                else if (mostProbableName.equalsIgnoreCase("Still")) {

                    try {
                        time_c = System.currentTimeMillis();

                        if (!d.getusername().equalsIgnoreCase("0")) {

                            ContentValues c = new ContentValues();

                            c.put("username", d.getusername());
                            c.put("Event_type", "Still");
                            c.put("is_send", "0");
                            c.put("th_s", "Still");
                            c.put("lat", eve_lat);
                            c.put("lon", eve_lon);

                            c.put("battery", DeviceEventsUtils.getBatteryInfo());
                            c.put("timezone", DeviceEventsUtils.getTimeZone());
                            c.put("utcstart", DeviceEventsUtils.utcCalculationOffset(eve_time));
                            c.put("utcend", DeviceEventsUtils.utcCalculationOffset(time_c));
                            c.put("imei", imei);
                            c.put("appid", appid);
                            c.put("userid", userid);
                            c.put("duration", 0);


                            Cursor c2 = databse.rawQuery("SELECT _id,Event_strt,Event_end,Event_type FROM  Events WHERE _id = " +
                                    "(SELECT MAX(_id) FROM Events where Event_type in('Still','StillViolation','Vehicle','Walking','On Bicycle','On Foot','Running') )", null);
                            c2.moveToFirst();

                            if (c2.getCount() > 0) {
                                String id = c2.getString(0);
                                Event_strt = c2.getString(1);
                                Event_end = c2.getString(2);
                                Event_type = c2.getString(3);

                                if (Event_type.equalsIgnoreCase("Still")) {
                                    String cnd;
                                    cnd = "_id=" + id;
                                    ContentValues c_path = new ContentValues();
                                    c_path.put("Event_end", time_c);

                                    long temp = databse.update("Events", c_path, cnd, null);

                                    // found still entry in database 1 hours
                                    // find duration start_time and current time  >= 30 send notification and insert Still violationentry 26-12-2023

                                    String Stillviolation_event = Eventprefs.getString("stillviolation_event","false");
                                    if(Stillviolation_event.equalsIgnoreCase("true"))
                                    {
                                        IsCheckAlaraSet = pref.getBoolean("isAlarmSet", false);
                                        // checked timer stared or not
                                        if (IsCheckAlaraSet) {
                                            // timer star check duration and insert still violation entry
                                            long StillDuration = time_c - Long.parseLong(Event_strt);
                                            if(StillDuration >= intervalMillis) {
                                                Show_Still_Alert();
                                            }
                                        }
                                        else {
                                            // timer not star insert new entry
                                            if (eve_time == 0) {
                                                c.put("Event_strt", time_c);
                                                pref.putString("tblevent_start", String.valueOf(time_c));
                                            } else {
                                                c.put("Event_strt", eve_time);
                                                pref.putString("tblevent_start", String.valueOf(eve_time));
                                            }
                                            c.put("Event_end", time_c);
                                            long tempinsert = databse.insert("Events", null, c);

                                            pref.putString("still_flag", "1");
                                            pref.putString("event_name", "Still");
                                            pref.putString("eve_lat", d.getlatlon()[0]);
                                            pref.putString("eve_lon", d.getlatlon()[1]);

                                            pref.putString("vehicle_flag", "0");
                                            pref.putLong("event_start", time_c);
                                            pref.commit();
                                        }

                                    }


                                } else {
                                    // last entry event type not still insert still entry
                                    if (eve_time == 0) {
                                        c.put("Event_strt", time_c);
                                        pref.putString("tblevent_start", String.valueOf(time_c));
                                    } else {
                                        c.put("Event_strt", eve_time);
                                        pref.putString("tblevent_start", String.valueOf(eve_time));
                                    }
                                    c.put("Event_end", time_c);
                                    long temp = databse.insert("Events", null, c);

                                    pref.putString("still_flag", "1");
                                    pref.putString("event_name", "Still");
                                    pref.putString("eve_lat", d.getlatlon()[0]);
                                    pref.putString("eve_lon", d.getlatlon()[1]);

                                    pref.putString("vehicle_flag", "0");
                                    pref.putLong("event_start", time_c);

                                    pref.commit();
                                }


                            } else {
                                // last entry not still insert new
                                if (eve_time == 0) {
                                    c.put("Event_strt", time_c);
                                    pref.putString("tblevent_start", String.valueOf(time_c));
                                } else {
                                    c.put("Event_strt", eve_time);
                                    pref.putString("tblevent_start", String.valueOf(eve_time));
                                }
                                c.put("Event_end", time_c);
                                long temp = databse.insert("Events", null, c);

                                pref.putString("still_flag", "1");
                                pref.putString("event_name", "Still");
                                pref.putString("eve_lat", d.getlatlon()[0]);
                                pref.putString("eve_lon", d.getlatlon()[1]);

                                pref.putString("vehicle_flag", "0");
                                pref.putLong("event_start", time_c);
                                pref.commit();
                            }

                        }

//                stop the newfused_accel service as user is not in vehicle
//                        boolean check12 = isMyServiceRunning(sqlitewraper.context,
//                                newfused_accel.class.getName());
//                        if (check12) {
//                            Intent i12 = new Intent(sqlitewraper.context,
//                                    newfused_accel.class);
//                            sqlitewraper.context.stopService(i12);
//                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
                // if user walking
                else if (mostProbableName.equalsIgnoreCase("Walking")) {
                    try {
                        time_c = System.currentTimeMillis();

                        if (!d.getusername().equalsIgnoreCase("0")) {

                            if (eve_time == 0) {
                                eve_time = time_c;
                            }

                            insertIntoEvents(String.valueOf(eve_time), String.valueOf(time_c), "0", "Walking");
                        }
                        //save current time to use in next Event start time
                        pref.putString("event_name", "Walking");
                        pref.putString("eve_lat", d.getlatlon()[0]);
                        pref.putString("eve_lon", d.getlatlon()[1]);
                        pref.putLong("event_start", time_c);
                        pref.commit();

                        //stop the newfused_accel service as user is not in vehicle
                        boolean check12 = isMyServiceRunning(sqlitewraper.context,
                                newfused_accel.class.getName());
                        if (check12) {
                            Intent i12 = new Intent(sqlitewraper.context,
                                    newfused_accel.class);
                            sqlitewraper.context.stopService(i12);
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
//          if user Running
                else if (mostProbableName.equalsIgnoreCase("Running")) {
                    try {
                        time_c = System.currentTimeMillis();

                        if (!d.getusername().equalsIgnoreCase("0")) {
                            if (eve_time == 0) {
                                eve_time = time_c;
                            }
                            insertIntoEvents(String.valueOf(eve_time), String.valueOf(time_c), "0", "Running");
                        }
                        //save current time to use in next Event start time
                        pref.putString("event_name", "Running");
                        pref.putString("eve_lat", d.getlatlon()[0]);
                        pref.putString("eve_lon", d.getlatlon()[1]);
                        pref.putLong("event_start", time_c);
                        pref.commit();

                        //stop the newfused_accel service as user is not in vehicle

                        boolean check12 = isMyServiceRunning(sqlitewraper.context,
                                newfused_accel.class.getName());
                        if (check12) {
                            Intent i12 = new Intent(sqlitewraper.context,
                                    newfused_accel.class);
                            sqlitewraper.context.stopService(i12);
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
                else if (mostProbableName.equalsIgnoreCase("On Bicycle")) {
                    try {
                        time_c = System.currentTimeMillis();
                        if (eve_time == 0) {
                            eve_time = time_c;
                        }
                        if (!d.getusername().equalsIgnoreCase("0")) {

                            insertIntoEvents(String.valueOf(eve_time), String.valueOf(time_c), "0", "On Bicycle");
                        }
                        //save current time to use in next Event start time
                        pref.putString("event_name", "On Bicycle");
                        pref.putString("eve_lat", d.getlatlon()[0]);
                        pref.putString("eve_lon", d.getlatlon()[1]);
                        pref.putLong("event_start", time_c);
                        pref.commit();

                        //stop the newfused_accel service as user is not in vehicle
                        boolean check12 = isMyServiceRunning(sqlitewraper.context,
                                newfused_accel.class.getName());
                        if (check12) {
                            Intent i12 = new Intent(sqlitewraper.context,
                                    newfused_accel.class);
                            sqlitewraper.context.stopService(i12);
                        }
                    } catch (Exception e) {

                    }
                }
                else if (mostProbableName.equalsIgnoreCase("On Foot")) {
                    try {
                        time_c = System.currentTimeMillis();

                        if (!d.getusername().equalsIgnoreCase("0")) {
                            if (eve_time == 0) {
                                eve_time = time_c;
                            }
                            insertIntoEvents(String.valueOf(eve_time), String.valueOf(time_c), "0", "On Foot");
                        }
                        //save current time to use in next Event start time
                        pref.putString("event_name", "On Foot");
                        pref.putString("eve_lat", d.getlatlon()[0]);
                        pref.putString("eve_lon", d.getlatlon()[1]);
                        pref.putLong("event_start", time_c);
                        pref.commit();

                        //stop the newfused_accel service as user is not in vehicle

                        boolean check12 = isMyServiceRunning(sqlitewraper.context,
                                newfused_accel.class.getName());
                        if (check12) {
                            Intent i12 = new Intent(sqlitewraper.context,
                                    newfused_accel.class);
                            sqlitewraper.context.stopService(i12);
                        }
                    } catch (Exception e) {

                    }
                }

                // check and show still notification logic
                if (mostProbableName.equalsIgnoreCase("Still")) {
                    int tripstatus = tripStatus();
                    if (tripstatus == 1) {
                        // trip is started
                        // stillviolation_event flag true start timer other wise not start timer
                        String Stillviolation_event = Eventprefs.getString("stillviolation_event","false");
                        if(Stillviolation_event.equalsIgnoreCase("true"))
                        {
                            check_and_update_timer();
                        }
                        pref.putInt("Eventflag", 0);
                        pref.commit();
                    }
                } else {
                    if (!mostProbableName.equalsIgnoreCase("Unknown") && !mostProbableName.equalsIgnoreCase("Tilting")) {

                        Eventflag_check = pref.getInt("Eventflag", 0);
                        if (Eventflag_check == 0) {
                            Eventflag++;
                            pref.putInt("Eventflag", Eventflag);
                            pref.commit();
                        } else {

                            Eventflag_check++;
                            pref.putInt("Eventflag", Eventflag_check);
                            pref.commit();
                        }
                        // when event name same getting 3 times stop timer
                        if (Eventflag_check == 3) {
                            time_c = System.currentTimeMillis();
                            if (IsCheckAlaraSet) {
                                // timer is stared then stop it
                                Intent mIntent1 = new Intent(context, activity_recognize.class);
                                PendingIntent pendingIntent = PendingIntent.getBroadcast(context, 0, mIntent1, 0);
                                alarmManager = (AlarmManager) sqlitewraper.context.getSystemService(Context.ALARM_SERVICE);

                                alarmManager.cancel(pendingIntent);
                                pref.putBoolean("isAlarmSet", false); // Saving string
                                pref.putInt("Eventflag", 0);
                                pref.putLong("event_start", time_c);
                                pref.commit();
                            } else {
                                pref.putInt("Eventflag", 0);
                                pref.putLong("event_start", time_c);
                                pref.commit();
                            }

                        }
                    }

                }
                }
                else {
                    // trip is not running stop service
                    boolean check12 = isMyServiceRunning(sqlitewraper.context,
                            newfused_accel.class.getName());
                    if (check12) {
                        Intent i12 = new Intent(sqlitewraper.context,
                                newfused_accel.class);
                        sqlitewraper.context.stopService(i12);
                    }
                }
            }
        } else if (intent.getAction() != null && intent.getAction().equals("ALARM_ACTION")) {

            // timer is stared send notification
            String isEvents = sqlitewraper.context.getResources().getString(R.string.EVENTS);
            IsCheckAlaraSet = pref.getBoolean("isAlarmSet", false);
            if(isEvents.equalsIgnoreCase("true")) {
                if (IsCheckAlaraSet) {

                    if ( tripStatus() == 1) {
                        Event_strt = pref.getString("tblevent_start","0");
                        time_c = System.currentTimeMillis();
                        long duration = time_c - Long.parseLong(Event_strt);
                        String Stillviolation_event = Eventprefs.getString("stillviolation_event","false");
                        if(Stillviolation_event.equalsIgnoreCase("true"))
                        {
                            if(duration >= intervalMillis) {
                                Show_Still_Alert();
                            }
                        }

                    } else {
                        pref.putBoolean("isAlarmSet", false); // Saving string
                        pref.commit();
                    }
                }
            }
        }

    }
    //        user not moving specifics duration 30 min show alert notification
    @SuppressLint("WrongConstant")
    private void Show_Still_Alert() {

        Uri sound = Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE + "://" + sqlitewraper.context.getPackageName() + "/" + R.raw.samelocationalert);

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
                .setContentTitle("No Movement Alert")
                .setContentText("You haven't moved since last 30 minutes.")
                .setSound(sound)
                .setPriority(NotificationCompat.PRIORITY_HIGH)   // heads-up
                .build();

        NotificationManagerCompat notificationManager1 = NotificationManagerCompat.from(sqlitewraper.context);
        notificationManager1.notify(202, notification);
        still_violation_Entry();

    }

    private boolean isMyServiceRunning(Context context, String Myservice) {
        ActivityManager manager = (ActivityManager) context
                .getSystemService(Context.ACTIVITY_SERVICE);
        for (RunningServiceInfo service : manager
                .getRunningServices(Integer.MAX_VALUE)) {
            if (Myservice.equals(service.service.getClassName())) {

                return true;
            }
        }
        return false;
    }

    //define the activity
    private String getActivityName(int type) {
        switch (type) {
            case DetectedActivity.IN_VEHICLE:
                return "V";
            case DetectedActivity.ON_BICYCLE:
                return "On Bicycle";
            case DetectedActivity.ON_FOOT:
                return "On Foot";
            case DetectedActivity.WALKING:
                return "Walking";
            case DetectedActivity.STILL:
                return "Still";
            case DetectedActivity.TILTING:
                return "Tilting";
            case DetectedActivity.RUNNING:
                return "Running";
            case DetectedActivity.UNKNOWN:
                return "Unknown";
        }
        return "N/A";
    }

    // user not moving for specifics duration (30 min) then show alert notification after punch in
    public void still_violation_Entry() {

        databse = sqlitewraper.getDatabase();
        d = new data();

        try {
            eve_time = pref.getLong("event_start", 0);
        } catch (Exception e) {
            eve_time = 0;
        }

        still_flag = pref.getString("still_flag", "0");
        vehicle_flag = pref.getString("vehicle_flag", "0");
        event_name = pref.getString("event_name", "NA");
        // String event_name = "V";
        eve_lat = pref.getString("eve_lat", "NA");
        eve_lon = pref.getString("eve_lon", "NA");
        Event_strt = pref.getString("tblevent_start","0");
        time_c = System.currentTimeMillis();

        insertIntoEvents(String.valueOf(Event_strt),String.valueOf(time_c),"0","StillViolation");
//        Intent i = new Intent(sqlitewraper.context, Event.class);
//        WakefulIntentService.sendWakefulWork(sqlitewraper.context, i);
        pref.putBoolean("isAlarmSet", false); // Saving string
        pref.putString("still_flag", "1");
        pref.putString("eve_lat", d.getlatlon()[0]);
        pref.putString("eve_lon", d.getlatlon()[1]);

        pref.putString("vehicle_flag", "0");
        pref.putLong("event_start", time_c);

        pref.commit();

    }

    private int tripStatus() {

        SQLiteDatabase database = sqlitewraper.getDatabase();
        Cursor tripflag = database.rawQuery(
                "select * from lat_plug where trip_status = 0", null);
        tripflag.moveToFirst();
        int tripflagCount = tripflag.getCount();
        tripflag.close();
        return tripflagCount;
    }

    private double deg2rad(double deg) {
        return (deg * Math.PI / 180.0);
    }

    public void reqLocation() {

        LocationListener locationListener = new MyLocationListner();
        Location location1 = getLastKnownLocation();
        if (location1 != null) {
            locationListener.onLocationChanged(location1);
        } else {
            //Toast.makeText(sqlitewraper.context, "No Location Provider found", Toast.LENGTH_SHORT).show();
        }
    }

    private Location getLastKnownLocation() {
        locationManager = (LocationManager) sqlitewraper.context.getSystemService(LOCATION_SERVICE);
        List<String> providers = locationManager.getProviders(true);
        Location bestLocation = null;
        for (String provider : providers) {
            @SuppressLint("MissingPermission") Location l = locationManager.getLastKnownLocation(provider);
            if (l == null) {
                continue;
            }
            if (bestLocation == null || l.getAccuracy() < bestLocation.getAccuracy()) {
                // Found best last known location: %s", l);
                bestLocation = l;
            }
        }
        return bestLocation;
    }


    public class MyLocationListner implements LocationListener {
        @Override
        public void onLocationChanged(Location location) {

            mlat = (location.getLatitude());
            mlon = (location.getLongitude());

            Log.d("##lat :", String.valueOf(mlat) + "##lng :" + mlon);

        }

        @Override
        public void onStatusChanged(String provider, int status, Bundle extras) {
        }

        @Override
        public void onProviderEnabled(String provider) {
        }

        @Override
        public void onProviderDisabled(String provider) {

        }
    }

    double find_distance() {
        final int R = 6371; // Radius of the earth
        double distance = 0;
        if (eve_lat.equalsIgnoreCase("") || eve_lat.equalsIgnoreCase("NA")) {

        } else {
            Double latDistance = deg2rad((Double.parseDouble(eve_lat)) - ((double) (mlat)));
            Double lonDistance = deg2rad((Double.parseDouble(eve_lon)) - (double) (mlon));
            Double a = Math.sin(latDistance / 2)
                    * Math.sin(latDistance / 2)
                    + Math.cos(deg2rad(Double.parseDouble(eve_lat)))
                    * Math.cos(deg2rad((double) (mlat)))
                    * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
            Double dist_m = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            distance = R * dist_m * 1000; // convert to meters

        }
        return distance;
    }

    public void check_and_update_timer() {
        // timer is not stated then start new timer
        //timer start 30 min

        if (!IsCheckAlaraSet) {
            alarmManager = (AlarmManager) sqlitewraper.context.getSystemService(Context.ALARM_SERVICE);

            Intent intent = new Intent(sqlitewraper.context, activity_recognize.class);
            intent.setAction("ALARM_ACTION");
            pendingIntent = (PendingIntent.getBroadcast(sqlitewraper.context, 0, intent, 0));

             // 30 minutes
            long triggerTime = System.currentTimeMillis() + intervalMillis;

            pref.putBoolean("isAlarmSet", true); // Saving string
            pref.commit();

            alarmManager.set(AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent);
        }
    }
    // insert into events
    public boolean insertIntoEvents(String eventstart, String eventend, String eventduration, String eventType) {

        try {

            boolean isInserted = false;

            ArrayList<String> logindetails = new ArrayList<>();
            logindetails = DeviceEventsUtils.getLoginDetails();
            String userid = logindetails.get(0);
            String imei = logindetails.get(1);
            String appid = logindetails.get(2);
            String username1 = logindetails.get(3);


            ContentValues c = new ContentValues();
            c.put("Event_strt", eventstart);
            c.put("Event_end", eventend);
            c.put("username", username1);
            c.put("Event_type", eventType);
            c.put("lat", DeviceEventsUtils.getCurrentLatLng().latitude);
            c.put("lon", DeviceEventsUtils.getCurrentLatLng().longitude);
            c.put("th_s", eventType);
            c.put("is_send", "0");
            c.put("duration", eventduration);
            c.put("battery", DeviceEventsUtils.getBatteryInfo());
            c.put("timezone", DeviceEventsUtils.getTimeZone());
            c.put("utcstart", DeviceEventsUtils.utcCalculationOffset(Long.parseLong(eventstart)));
            c.put("utcend", DeviceEventsUtils.utcCalculationOffset(Long.parseLong(eventend)));
            c.put("imei", imei);
            c.put("appid", appid);
            c.put("userid", userid);
            MySharedPreferences prefs = sqlitewraper.getSecureShared(MY_PREFS_NAME);
            String tid = prefs.getString("tid", null);

            c.put("tid",tid);

            long temp = databse.insert("Events", null, c);

            if (temp > 0) {

                isInserted = true;

                boolean check3 = isMyServiceRunning(sqlitewraper.context,
                        Event.class.getName());
                if (check3) {
                } else {
                    Intent z_n12 = new Intent(sqlitewraper.context, Event.class);
                    WakefulIntentService.sendWakefulWork(sqlitewraper.context,
                            z_n12);
                }
            }
            return isInserted;
        } catch (Exception e) {
            return false;
        }
    }

}
