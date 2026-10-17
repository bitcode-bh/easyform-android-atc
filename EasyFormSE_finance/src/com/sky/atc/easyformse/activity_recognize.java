package com.sky.atc.easyformse;

import static android.content.Context.LOCATION_SERVICE;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;

import android.Manifest;
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

import android.content.pm.PackageManager;
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


import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import com.commonsware.cwac.wakeful.WakefulIntentService;
import com.google.android.gms.location.ActivityRecognitionResult;
import com.google.android.gms.location.DetectedActivity;
import com.sky.atc.easyformse.trip.engine.DrivingContext;
import com.sky.atc.easyformse.trip.engine.HeldEventStore;
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

    private static long DRIVING_ALERT_TIME = 0;
    private static long DRIVING_RESET_GRACE_PERIOD = 0;

    private static final String KEY_DRIVING_START = "driving_start_time";
    private static final String KEY_DRIVING_LAST_VEHICLE = "driving_last_vehicle_time";
    private static final String KEY_DRIVING_ALERT = "driving_alert_sent";
    private static final boolean TEST_MODE = false;
    String normal_acc, normal_deacc, hard_acc, hard_deacc;
    String newspeed,speed_violation_time,  gap_milli,continuous_driving_alert_time,continuous_driving_reset_alert_time;

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


            String vehicaletype = pref.getString("vehicle_type","Private-2W");


            Cursor a_t2 = databse
                    .rawQuery(
                            "select speed,speed_violation_time,normal_acc,normal_deacc,hard_acc,hard_deacc,gap_milli,call_event_speed_limit,fall_detection,continuous_driving_alert_time,continuous_driving_reset_alert_time from Thresold_New WHERE vehicle_type =" + "'" + vehicaletype + "'" , null);


            if(a_t2.getCount() > 0)
            {
                a_t2.moveToFirst();
                newspeed = a_t2.getString(0);
                speed_violation_time = a_t2.getString(1);
                normal_acc = a_t2.getString(2);
                normal_deacc = a_t2.getString(3);
                hard_acc = a_t2.getString(4);
                hard_deacc = a_t2.getString(5);
                gap_milli = a_t2.getString(6);
                continuous_driving_alert_time = a_t2.getString(9);
                continuous_driving_reset_alert_time = a_t2.getString(10);



                a_t2.close();
            }

            // Extract the result from the Response
            ActivityRecognitionResult result = ActivityRecognitionResult
                    .extractResult(intent);
            DetectedActivity detectedActivity = result
                    .getMostProbableActivity();

            // Get the Confidence and Name of Activity
            int confidence = detectedActivity.getConfidence();
            String mostProbableName = getActivityName(detectedActivity
                    .getType());
            DrivingContext.onActivity(contextActivity(detectedActivity.getType()), confidence,
                    System.currentTimeMillis());

//            if (TEST_MODE && !mostProbableName.equalsIgnoreCase("V")) {
//                mostProbableName = "V";
//                confidence = 100;
//            }
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
                    checkContinuousDriving();
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
                                    // Start continuous driving session only once

                                    if (pref.getLong(KEY_DRIVING_START, 0) == 0) {

                                        pref.putLong(KEY_DRIVING_START, time_c);
                                        pref.putBoolean(KEY_DRIVING_ALERT, false);

                                        pref.putString("still_flag", "0");
                                        pref.putString("event_name", "V");
                                        pref.putString("eve_lat", d.getlatlon()[0]);
                                        pref.putString("eve_lon", d.getlatlon()[1]);

                                        pref.putString("vehicle_flag", "1");
                                        pref.putLong("event_start", time_c);
                                        pref.putInt("vehicleflag", 0);
                                        pref.commit();

                                        Log.d("DrivingAlert", "Continuous Driving Started");
                                    }

                                }

                            }
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                    }

                }
                //Check if user is not in Vehicle
                else if (mostProbableName.equalsIgnoreCase("Still")) {
                    resetDrivingTimer();
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



                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
                // if user walking
                else if (mostProbableName.equalsIgnoreCase("Walking")) {
                    resetDrivingTimer();
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



                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
//          if user Running
                else if (mostProbableName.equalsIgnoreCase("Running")) {
                    resetDrivingTimer();
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




                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
                else if (mostProbableName.equalsIgnoreCase("On Bicycle")) {
                    resetDrivingTimer();
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



                    } catch (Exception e) {

                    }
                }
                else if (mostProbableName.equalsIgnoreCase("On Foot")) {
                    resetDrivingTimer();
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
                                int flags = PendingIntent.FLAG_CANCEL_CURRENT;
                                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                                    flags = PendingIntent.FLAG_CANCEL_CURRENT | PendingIntent.FLAG_IMMUTABLE;
                                }
                                @SuppressLint("WrongConstant") PendingIntent pendingIntent = PendingIntent.getBroadcast(context, 0, mIntent1, flags);
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

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {

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
    private static DrivingContext.Activity contextActivity(int type) {
        switch (type) {
            case DetectedActivity.IN_VEHICLE: return DrivingContext.Activity.VEHICLE;
            case DetectedActivity.ON_BICYCLE: return DrivingContext.Activity.BICYCLE;
            case DetectedActivity.ON_FOOT:
            case DetectedActivity.WALKING:
            case DetectedActivity.RUNNING: return DrivingContext.Activity.ON_FOOT;
            case DetectedActivity.STILL: return DrivingContext.Activity.STILL;
            default: return DrivingContext.Activity.UNKNOWN;
        }
    }

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
            
            int flags = 0;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                flags = PendingIntent.FLAG_IMMUTABLE;
            }
            pendingIntent = (PendingIntent.getBroadcast(sqlitewraper.context, 0, intent, flags));

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

    private static final String KEY_DRIVING_ALERT_CONTEXT = "driving_alert_context";

    /**
     * Continuous driving. The alert fires once the drive reaches continuous_driving_alert_time;
     * the event is recorded when the drive ends (no vehicle for the reset time), so it carries
     * the real start, end and duration.
     */
    private void checkContinuousDriving() {

        long currentTime = System.currentTimeMillis();
        long drivingStart = pref.getLong(KEY_DRIVING_START, 0);
        boolean alertSent = pref.getBoolean(KEY_DRIVING_ALERT, false);
        long lastVehicle = pref.getLong(KEY_DRIVING_LAST_VEHICLE, 0);

        // A session left over from an earlier drive is over. Activity recognition only runs
        // during trips, so the reset in resetDrivingTimer() may never have run between trips;
        // without this the next trip inherited the old start time and alerted at once.
        DRIVING_RESET_GRACE_PERIOD = parseTimeToMillis(continuous_driving_reset_alert_time, 15 * 60 * 1000L);
        if (DRIVING_RESET_GRACE_PERIOD <= 0) DRIVING_RESET_GRACE_PERIOD = 15 * 60 * 1000L;   // "00:00" would reset every time
        if (drivingStart != 0 && (lastVehicle == 0 || currentTime - lastVehicle >= DRIVING_RESET_GRACE_PERIOD)) {
            Log.d("DrivingAlert", "Previous driving session ended");
            finishDrivingSession(lastVehicle);
            drivingStart = 0;
            alertSent = false;
        }

        // Always update the last seen vehicle timestamp when driving is detected
        pref.putLong(KEY_DRIVING_LAST_VEHICLE, currentTime);

        // First Vehicle Detection
        if (drivingStart == 0) {
            pref.putLong(KEY_DRIVING_START, currentTime);
            pref.putBoolean(KEY_DRIVING_ALERT, false);
            pref.commit();
            Log.d("DrivingAlert", "Continuous Driving Session Started");
            return;
        }

        long duration = currentTime - drivingStart;
        Log.d("DrivingAlert", "Duration: " + (duration / 1000) + "s, AlertSent: " + alertSent);

        DRIVING_ALERT_TIME = parseTimeToMillis(continuous_driving_alert_time, 2 * 60 * 60 * 1000L);
        if (!alertSent && duration >= DRIVING_ALERT_TIME) {
            // Only driving on a live trip counts. The context is kept for when the event is
            // recorded at the end of the drive, by which time the trip may have ended.
            DrivingContext.Context drivingContext = DrivingContext.current(tripStatus() > 0,
                    pref.getString("vehicle_type", "Private-2W"), currentTime);
            if (DrivingContext.counts(drivingContext)) {
                Show_Driving_Alert();
            }
            pref.putBoolean(KEY_DRIVING_ALERT, true);
            pref.putString(KEY_DRIVING_ALERT_CONTEXT, drivingContext.name());
            Log.d("DrivingAlert", "Continuous driving limit reached (" + DrivingContext.label(drivingContext) + ")");
        }
        pref.commit();
    }

    /**
     * Ends the current driving session at {@code endMs} (when a vehicle was last detected) and
     * records it if it reached the alert time.
     */
    private void finishDrivingSession(long endMs) {
        long drivingStart = pref.getLong(KEY_DRIVING_START, 0);
        boolean alertSent = pref.getBoolean(KEY_DRIVING_ALERT, false);
        if (drivingStart > 0 && alertSent && endMs > drivingStart) {
            DrivingContext.Context context;
            try {
                context = DrivingContext.Context.valueOf(pref.getString(KEY_DRIVING_ALERT_CONTEXT, "DRIVING"));
            } catch (IllegalArgumentException e) {
                context = DrivingContext.Context.DRIVING;
            }
            long duration = endMs - drivingStart;
            if (DrivingContext.counts(context)) {
                insertIntoEvents(String.valueOf(drivingStart), String.valueOf(endMs),
                        String.valueOf(duration), "continuous_driving");
                Log.d("DrivingAlert", "Continuous driving recorded: " + (duration / 60000) + " min");
            } else {
                HeldEventStore.hold(sqlitewraper.getDatabase(), "continuous_driving", context,
                        null, drivingStart, endMs, String.valueOf(duration));
            }
        }
        pref.putLong(KEY_DRIVING_START, 0);
        pref.putLong(KEY_DRIVING_LAST_VEHICLE, 0);
        pref.putBoolean(KEY_DRIVING_ALERT, false);
        pref.putString(KEY_DRIVING_ALERT_CONTEXT, "");
        pref.commit();
    }

    private long parseTimeToMillis(String timeValue, long defaultMillis) {

        try {
            if (timeValue == null || timeValue.trim().isEmpty()) {
                return defaultMillis;
            }

            String[] parts = timeValue.trim().split(":");

            long hours = Long.parseLong(parts[0]);
            long minutes = Long.parseLong(parts[1]);

            return (hours * 60 * 60 * 1000L)
                    + (minutes * 60 * 1000L);

        } catch (Exception e) {
            Log.e("DrivingAlert",
                    "Invalid time value: " + timeValue, e);

            return defaultMillis;
        }
    }
    private void resetDrivingTimer() {
        long currentTime = System.currentTimeMillis();
        long lastVehicleTime = pref.getLong(KEY_DRIVING_LAST_VEHICLE, 0);
        long drivingStart = pref.getLong(KEY_DRIVING_START, 0);

        if (drivingStart == 0) return;

        // Implement grace period: Only reset if user has been non-vehicle for > 15 minutes
        long idleDuration = currentTime - lastVehicleTime;
        DRIVING_RESET_GRACE_PERIOD =  parseTimeToMillis(continuous_driving_reset_alert_time, 15 * 60 * 1000L);
        if (DRIVING_RESET_GRACE_PERIOD <= 0) DRIVING_RESET_GRACE_PERIOD = 15 * 60 * 1000L;
        if (idleDuration >= DRIVING_RESET_GRACE_PERIOD) {
            // The drive is over: record it (if it reached the alert time) and reset.
            finishDrivingSession(lastVehicleTime);

            pref.putInt("vehicleflag", 0);
            pref.commit();

            Log.d("DrivingAlert", "Driving Session Reset after Grace Period");
        } else {
            Log.d("DrivingAlert", "Idle for " + (idleDuration / 1000) + "s. Within Grace Period.");
        }
    }

    @SuppressLint("WrongConstant")
    private void Show_Driving_Alert() {

        Uri sound = Uri.parse(
                ContentResolver.SCHEME_ANDROID_RESOURCE + "://"
                        + sqlitewraper.context.getPackageName()
                        + "/"
                        + R.raw.emergencytone);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {

            NotificationChannel channel =
                    new NotificationChannel(
                            "channel02",
                            "Driving Alert",
                            NotificationManager.IMPORTANCE_HIGH);

            channel.setDescription("Driving Alert");

            Ringtone r = RingtoneManager.getRingtone(sqlitewraper.context, sound);
            if (r != null) {
                r.play();
            }

            NotificationManager manager =
                    sqlitewraper.context.getSystemService(NotificationManager.class);

            manager.createNotificationChannel(channel);
        }
        String notificationMessage = "You have been driving continuously. Please take a break.";
        Notification notification =
                new NotificationCompat.Builder(sqlitewraper.context, "channel02")
                        .setSmallIcon(android.R.drawable.ic_dialog_info)
                        .setContentTitle("Driving Alert")
                        .setStyle(new NotificationCompat.BigTextStyle().bigText(notificationMessage)).setContentText(notificationMessage)
                        .setSound(sound)
                        .setPriority(NotificationCompat.PRIORITY_HIGH)
                        .build();

        if (ActivityCompat.checkSelfPermission(sqlitewraper.context,
                Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) {
            return;
        }

        NotificationManagerCompat.from(sqlitewraper.context)
                .notify(303, notification);
    }
}
