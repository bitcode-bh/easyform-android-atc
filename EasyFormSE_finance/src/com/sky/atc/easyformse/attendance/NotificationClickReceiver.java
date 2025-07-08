package com.sky.atc.easyformse.attendance;

import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.text.format.DateFormat;
import android.util.Log;

import com.commonsware.cwac.wakeful.WakefulIntentService;
import com.sky.atc.easyformse.DeviceEventsUtils;
import com.sky.atc.easyformse.FaceDetactionActivity;
import com.sky.atc.easyformse.f_upload_new_structure;
import com.sky.atc.easyformse.sqlitewraper;
import com.sky.atc.easyformse.utils.LogUtils;

import java.util.Calendar;
import java.util.Date;

import io.michaelrocks.paranoid.Obfuscate;

import static android.content.Context.NOTIFICATION_SERVICE;

import net.sqlcipher.Cursor;
import net.sqlcipher.database.SQLiteDatabase;

//To handle Notification click event Handler
@Obfuscate
public class NotificationClickReceiver extends BroadcastReceiver {

    private static SharedPreferences pref;
    private static SharedPreferences.Editor editor;

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d("##NOTIFICATIONCLICK", "2");

        if (!DeviceEventsUtils.getLoginDetails().get(0).equalsIgnoreCase("0")) {

            pref = sqlitewraper.context.getSharedPreferences("MyPref", 0);
            editor = pref.edit();
            String daysstring = pref.getString("daysstring", "");
            String ischeckIN = pref.getString("ischeckin", "true");


            int timeSlot = 1;
            int getUserDay = 0;
            int createTask = 0;
            Calendar c = Calendar.getInstance();
            int dayOfWeek = c.get(Calendar.DAY_OF_WEEK);

            Bundle extras = intent.getExtras();
            int checkStatus = 0;
            if (extras != null) {
                checkStatus = extras.getInt("action");
                getUserDay = extras.getInt("lastday");
                createTask = extras.getInt("createtask");
            }

            if (createTask == 1) {
                //Create task or update task as user click check in check out button
                // AttendanceClass.createTask();

                // create new activity and get result and insert in database punchMaster table
                Intent faceRecognizerActivityIntent = new Intent(context, FaceDetactionActivity.class);
                faceRecognizerActivityIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(faceRecognizerActivityIntent);

            } else if (createTask == 2) {
                SharedPreferences sharedPreferences1 = context.getSharedPreferences("myKey1", Context.MODE_PRIVATE);
                String ptid = sharedPreferences1.getString("tid", "");
                punch_master(ptid);
                AttendanceClass.insertTaskmasterHistory(Integer.parseInt(ptid));
                cancleNotification();
                Intent i_ch2 = new Intent(sqlitewraper.context, f_upload_new_structure.class);
                WakefulIntentService.sendWakefulWork(sqlitewraper.context, i_ch2);
                //Show Login Page
                /*try {
                    Intent i = new Intent(sqlitewraper.context, ph_s.class);
                    i.setFlags(i.FLAG_ACTIVITY_CLEAR_TOP);
                    sqlitewraper.context.startActivity(i);
                } catch (Exception e) {
                    Intent i = new Intent(sqlitewraper.context, ph_s.class);
                    i.setFlags(i.FLAG_ACTIVITY_NEW_TASK);
                    sqlitewraper.context.startActivity(i);
                }*/

            } else {
                //Pending Dvelopment
                Intent i = new Intent(sqlitewraper.context, OpenChecksheet.class);
                sqlitewraper.context.startActivity(i);
            }

            if (ischeckIN.equalsIgnoreCase("false")) {

//                if (checkStatus==1){
//                    cancleNotification();
//                    timeSlot = 0;
//                    dayOfWeek = dayOfWeek + 1;
//                    if (dayOfWeek == 8) {
//                        dayOfWeek = 1;
//                    }
//                    CheckSheetJsonConstant.getNotificationTime(timeSlot, dayOfWeek, daysstring);
//                }

            } else {

                //Cancle Notification and generate new notification for next day
                cancleNotification();
                if (checkStatus == 1) {
                    timeSlot = 0;
                    dayOfWeek = dayOfWeek + 1;

                    if (dayOfWeek == 8) {
                        dayOfWeek = 1;
                    }
                }
                // CheckSheetJsonConstant.getNotificationTime(timeSlot, dayOfWeek, daysstring);
            }
        } else {
            cancleNotification();
        }

    }

    public static void punch_master(String tid) {
        try {


            SQLiteDatabase database = sqlitewraper.getDatabase();

            long millisecond = System.currentTimeMillis();

            ContentValues c = new ContentValues();

            long UTCmillisecond = DeviceEventsUtils.utcCalculationOffset(millisecond);

            c.put("username", DeviceEventsUtils.getLoginDetails().get(3));
            c.put("tid", tid);
            c.put("millisecond", millisecond);
            c.put("appid", DeviceEventsUtils.getLoginDetails().get(2));
            c.put("userid", DeviceEventsUtils.getLoginDetails().get(0));
            c.put("UTCmillisecond", UTCmillisecond);
            c.put("lat", DeviceEventsUtils.getCurrentLatLng().latitude);
            c.put("lon", DeviceEventsUtils.getCurrentLatLng().longitude);
            c.put("gprs", DeviceEventsUtils.getGPSandIternetStatus().get("gprs"));
            c.put("gps", DeviceEventsUtils.getGPSandIternetStatus().get("gps"));
            c.put("address", "");
            c.put("punch_upload_flag", "0");


            Cursor c2_n = database.rawQuery(
                    "Select * from punch_master where tid=" + tid, null);
            c2_n.moveToFirst();

            if (c2_n.getCount() > 0 && c2_n.getCount() % 2 != 0) {
                c.put("punch_flag", "1");
                String t;
                int tid_new = c2_n.getInt(0);
                t = "tid=" + tid;
                long temp = database.insert("punch_master", null, c);
                Log.d("##punchmaster", String.valueOf(temp));
                ContentValues task = new ContentValues();
                task.put("notiflag", "2");
                task.put("flag", "1");
                task.put("status", "2");
                Date d = new Date();
                CharSequence s = DateFormat.format("hh:mm:ss", d.getTime());
                task.put("out_ms", s.toString());
                // long temp = database.update("punch_master", c, t, null);
                long temp2 = database.update("task_master", task, t, null);
            } else {
                c.put("punch_flag", "0");
                long temp = database.insert("punch_master", null, c);
                Log.d("##punchmaster", String.valueOf(temp));
            }
            c2_n.close();
        } catch (Exception e) {
            LogUtils.writeAttendanceLogToFile(e.toString(),"punch_master");
        }

    }

    private void cancleNotification() {

        NotificationManager manager = (NotificationManager) sqlitewraper.context.getSystemService(NOTIFICATION_SERVICE);
        if (manager != null) {
            manager.cancel(1029);
        }
    }
}
