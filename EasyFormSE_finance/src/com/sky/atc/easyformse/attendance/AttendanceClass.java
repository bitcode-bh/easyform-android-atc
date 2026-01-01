package com.sky.atc.easyformse.attendance;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.ContentValues;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;

import androidx.core.app.NotificationCompat;

import android.text.format.DateFormat;
import android.util.Log;
import android.widget.Toast;

import androidx.annotation.RequiresApi;

import com.commonsware.cwac.wakeful.WakefulIntentService;
//import com.sky.atc.easyformse.ActivityUtils;
import com.sky.atc.easyformse.DeviceEventsUtils;
import com.sky.atc.easyformse.R;
import com.sky.atc.easyformse.f_upload_new_structure;
import com.sky.atc.easyformse.sqlitewraper;
import com.sky.atc.easyformse.utils.LogUtils;

import net.sqlcipher.Cursor;
import net.sqlcipher.database.SQLiteDatabase;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.text.DecimalFormat;
import java.text.NumberFormat;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

import static android.content.Context.ALARM_SERVICE;
import static android.content.Context.MODE_PRIVATE;
import static android.content.Context.NOTIFICATION_SERVICE;

@StringFogIgnore
public class AttendanceClass {
    //Set alarm for Notification as per time slot
    public static void setAlarmNotification(String startTime, int dayCount, int timeSlot) {

        Calendar calendar = Calendar.getInstance();
        String[] separated = startTime.split(":");
        calendar.set(Calendar.HOUR_OF_DAY, Integer.parseInt(separated[0])); // hour 0
        calendar.set(Calendar.MINUTE, Integer.parseInt(separated[1])); // minute 1
        calendar.set(Calendar.DAY_OF_WEEK, dayCount);


        Intent intent = new Intent(sqlitewraper.context, NotificationReceiver.class);
        intent.putExtra("day", dayCount);
        intent.putExtra("timeslot", timeSlot);

        PendingIntent pendingIntent = PendingIntent.getBroadcast(sqlitewraper.context, dayCount, intent, PendingIntent.FLAG_UPDATE_CURRENT |
                PendingIntent.FLAG_IMMUTABLE);

        AlarmManager alarmManager = (AlarmManager) sqlitewraper.context.getSystemService(ALARM_SERVICE);
        if (alarmManager != null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, calendar.getTimeInMillis(), pendingIntent);
            } else {
                alarmManager.set(AlarmManager.RTC_WAKEUP, calendar.getTimeInMillis(), pendingIntent);
            }
        } else {
            LogUtils.writeAttendanceLogToFile("alarmManager : Null ", "NotificationReceiver");
        }
    }

    static void showNotification(int userGetDay, int timeSlot) {

        SQLiteDatabase database = sqlitewraper.getDatabase();

        Date c = Calendar.getInstance().getTime();
        SimpleDateFormat df = new SimpleDateFormat("dd-MMM-yyyy");
        String currentData = df.format(c);

        pref = sqlitewraper.context.getSharedPreferences("MyPref", 0);
        String moduleId = pref.getString("FLOWID", "");


        Cursor c1 = database
                .rawQuery("select tid,millisecond,notiflag from task_master where moduleid=" + moduleId, null);
        c1.moveToLast();
        int count = c1.getCount();
        if (count > 0) {
            String tid = c1.getString(0);
            String milliseconds = c1.getString(1);
            String notificationFlag = c1.getString(2);

            milliseconds = convertDate(milliseconds, "dd-MMM-yyyy");

            //Create Notification for checkout
            if (milliseconds.equalsIgnoreCase(currentData)) {
                if (notificationFlag.equalsIgnoreCase("1")) {
                    LogUtils.writeAttendanceLogToFile("notificationFlag : " + notificationFlag, "showNotification");
                    Log.d("showNotification1", "Count: " + count + " userGetday " + userGetDay + " timeSlot " + timeSlot);
                    createNotification("1", userGetDay, timeSlot);
                    setDelayCheckOut();
                } else {
                    LogUtils.writeAttendanceLogToFile("notificationFlag : " + notificationFlag, "showNotification");
                }
            } else {
                LogUtils.writeAttendanceLogToFile("Date is not currentData " + " Database Date: " + milliseconds + " currentData: " + currentData, "showNotification");

                //Create Notification for chek in
                pref = sqlitewraper.context.getSharedPreferences("MyNotPref", 0);
                String isAlreadyCreated = pref.getString("NOTSHARED", "0");
                if (!isAlreadyCreated.equalsIgnoreCase("1")) {
                    createNotification("0", userGetDay, timeSlot);
                } else {
                    cancleNotification();
                }
            }
        } else {
            LogUtils.writeAttendanceLogToFile("No task found ", "showNotification");
            //Create Notification for chek in
            pref = sqlitewraper.context.getSharedPreferences("MyNotPref", 0);
            String isAlreadyCreated = pref.getString("NOTSHARED", "0");
            if (!isAlreadyCreated.equalsIgnoreCase("1")) {
                createNotification("0", userGetDay, timeSlot);
            } else {
                cancleNotification();
            }
        }
        c1.close();
    }

    public static void createNotification(String notificationFlag, int userGetDay, int timeslot) {
        // Prepare intent which is triggered if the
        // notification is selected+

        pref = sqlitewraper.context.getSharedPreferences("MyPref", 0);

        String ischeckIN = pref.getString("ischeckin", "true");

        NotificationChannel mChannel = null;
        String CHANNEL_ID = "my_channel_01";

        String actionString;
        String title;
        String subLineText;


        if (ischeckIN.equalsIgnoreCase("false")) {
            notificationFlag = String.valueOf(timeslot);
        }

        //notiflag will indicate Syntax for check in check out
        if (notificationFlag.equalsIgnoreCase("1")) {
            actionString = "Check Out";
//            title = "Do you want to complete your work Day?";
            title = "Attendance of the day";
            subLineText = "End your day by CHECK OUT for today";
        } else {
//            title = "Your Today's Attendance is Pending.";
            title = "Attendance of the day";
            actionString = "Check In";
            subLineText = "Mark your attendance by CHECK IN for today";
        }


        // Build notification
        // Actions are just fake
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            CharSequence name = "Easyform";// The user-visible name of the channel.
            int importance = NotificationManager.IMPORTANCE_HIGH;
            mChannel = new NotificationChannel(CHANNEL_ID, name, importance);

        }

        NotificationCompat.Builder noti = null;
        //This is the intent of PendingIntent
        Intent intentAction = new Intent(sqlitewraper.context, NotificationClickReceiver.class);
        //This is optional if you have more than one buttons and want to differentiate between two
        intentAction.putExtra("action", Integer.parseInt(notificationFlag));
        intentAction.putExtra("lastday", userGetDay);


        //Show simple Notification without Button which open login page
        if (ischeckIN.equalsIgnoreCase("false")) {

            intentAction.putExtra("createtask", 2);
            PendingIntent pIntentlogin = PendingIntent.getBroadcast(sqlitewraper.context, 1, intentAction, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);//data to pass

            noti = new NotificationCompat.Builder(sqlitewraper.context)
                    .setContentTitle(title)
                    .setContentText(subLineText).setSmallIcon(R.drawable.atc_logo)
                    .setContentIntent(pIntentlogin)
                    .setChannelId(CHANNEL_ID)
                    .setAutoCancel(false)
                    .setOngoing(true)
                    .setPriority(NotificationCompat.PRIORITY_MAX)
                    .addAction(0, actionString, pIntentlogin);
        } else {

            //show notification with check in check out buttons
            intentAction.putExtra("createtask", 1);
            PendingIntent pIntentlogin = PendingIntent.getBroadcast(sqlitewraper.context, 1, intentAction, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);//data to pass


            noti = new NotificationCompat.Builder(sqlitewraper.context)
                    .setContentTitle(title)
                    .setContentText(subLineText).setSmallIcon(R.drawable.atc_logo)
                    .setContentIntent(pIntentlogin)
                    .setChannelId(CHANNEL_ID)
                    .setAutoCancel(false)
                    .setOngoing(true)
                    .setPriority(NotificationCompat.PRIORITY_MAX)
                    .addAction(0, actionString, pIntentlogin);
        }

        NotificationManager notificationCompatManager =
                (NotificationManager) sqlitewraper.context.getSystemService(NOTIFICATION_SERVICE);


        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (notificationCompatManager != null) {
                notificationCompatManager.createNotificationChannel(mChannel);
            }
        }
        // hide the notification after its selected
//        noti.flags |= Notification.FLAG_AUTO_CANCEL;
        if (notificationCompatManager != null) {
            if (noti != null) {
                notificationCompatManager.notify(1029, noti.build());
            }
        }

        if (!ischeckIN.equalsIgnoreCase("false")) {

            pref = sqlitewraper.context.getSharedPreferences("MyNotPref", 0);
            editor = pref.edit();
            editor.putString("NOTSHARED", "1"); // Saving string
            editor.apply();
        }
    }


    private static SharedPreferences pref;
    private static SharedPreferences.Editor editor;


    //To create Task
    public static void createTask(String detectionFilePath) {
//        Context context=null;

        try {
            SQLiteDatabase database = sqlitewraper.getDatabase();

            String moduleid = "";

            pref = sqlitewraper.context.getSharedPreferences("MyPref", 0);
            editor = pref.edit();
            moduleid = pref.getString("FLOWID", "");
            String checksheetid = pref.getString("Checksheet_id", "");

            Cursor c1 = database
                    .rawQuery("select checksheet_id,module_name from flow_master where moduleid=" + moduleid, null);
            c1.moveToFirst();
            int count = c1.getCount();

            if (count > 0) {

                checksheetid = c1.getString(0);
                String moduleName = c1.getString(1);

                Cursor c2 = database
                        .rawQuery("select data from checksheet where checksheetid='" + checksheetid + "'", null);
                c2.moveToFirst();
                int count2 = c2.getCount();

                if (count2 > 0) {

                    String data = c2.getString(0);
                    //insert in to task_master

                    insertIntoTaskmaster(data, Integer.parseInt(moduleid), checksheetid, moduleName, detectionFilePath);

                    pref = sqlitewraper.context.getSharedPreferences("MyNotPref", 0);
                    editor = pref.edit();
                    editor.putString("NOTSHARED", "0"); // Saving string
                    editor.apply();
                }
                c2.close();
            } else {

                String data = CheckSheetJsonConstant.getCheckSheetJSon();

                insertIntoTaskmaster(data, Integer.parseInt(moduleid), checksheetid, "null", detectionFilePath);

                pref = sqlitewraper.context.getSharedPreferences("MyNotPref", 0);
                editor = pref.edit();
                editor.putString("NOTSHARED", "0"); // Saving string
                editor.apply();

            }
            c1.close();
        } catch (Exception e) {
            e.printStackTrace();
            Log.d("##TASK", e.getLocalizedMessage());
        }
    }


    public static String convertDate(String dateInMilliseconds, String dateFormat) {
        return DateFormat.format(dateFormat, Long.parseLong(dateInMilliseconds)).toString();
    }


    //insert in to task master
    private static void insertIntoTaskmaster(String dataString, int moduleid, String checksheetid, String moduleName, String detectionFilePath) {


        SQLiteDatabase database = sqlitewraper.getDatabase();
        long milliseconds = System.currentTimeMillis();
        String task_id = DeviceEventsUtils.getLoginDetails().get(1) + "_" + milliseconds;

        String userName = DeviceEventsUtils.getLoginDetails().get(3);
        String userID = DeviceEventsUtils.getLoginDetails().get(0);

        String surveryDate = convertDate(String.valueOf(milliseconds), dataFormat);

        //replace json data with new values
        dataString = replacejsonData(dataString, userName, userID, moduleName, String.valueOf(milliseconds), detectionFilePath);
        Date d = new Date();
        CharSequence s = DateFormat.format("hh:mm:ss", d.getTime());
        String outtime = s.toString() + d.getTime();

        ContentValues cv1 = new ContentValues();

        cv1.put("task_id", task_id);
        cv1.put("server_task_id", 0);
        cv1.put("flag", "1");
        cv1.put("user_id", userID);
        cv1.put("username", userName);
        cv1.put("rate", "2");
        // cv1.put("p_server_task_id", "");
        cv1.put("siteid", 0);
        //  cv1.put("siteid", moduleid);
        // cv1.put("site_name", moduleName);
        cv1.put("site_name", "0");
        cv1.put("site_address", "");
        cv1.put("percentage", "0");
        cv1.put("survey_date", surveryDate);
        cv1.put("lat", DeviceEventsUtils.getCurrentLatLng().latitude);
        cv1.put("long", DeviceEventsUtils.getCurrentLatLng().longitude);
        cv1.put("inspect_count", "0");
        cv1.put("checksheetid", checksheetid);
        cv1.put("height", "0");
        cv1.put("display_siteid", "0");
        cv1.put("step", "0");
        cv1.put("status", "1");
        cv1.put("upload_date", "");
        cv1.put("updateddate", "");
        cv1.put("millisecond", milliseconds);
        cv1.put("end_of_date", "");
        cv1.put("data", dataString);
        cv1.put("tower_type", "16825");
        cv1.put("moduleid", moduleid);
        cv1.put("module_name", moduleName);
        // cv1.put("moduledef", dataString);
        cv1.put("srnumber", "");
        cv1.put("global_var", "");

        cv1.put("site_flag", "0");
        cv1.put("server_task_flag", "1");
        cv1.put("display_siteid", "0");

        cv1.put("is_down_complete", "1");
        //cv1.put("Dynamic_Globalvar", "");

        // cv1.put("punch_flag", "");

        cv1.put("in_ms", s.toString());
        // cv1.put("out_ms", "");

        // cv1.put("duration", "");
        cv1.put("notiflag", "1");
        cv1.put("islogdown", "0");
        cv1.put("match_temp_id", "37864");
        cv1.put("p_match_temp_id", "37864");


        //insert and update logic if task is available for the day
        Cursor c1 = database
                .rawQuery("select tid,notiflag from task_master where  notiflag=1", null);
        c1.moveToFirst();
        int count = c1.getCount();
        long temp = 0;

        if (count > 0) {

            String tid = c1.getString(0);
            String notiflag = c1.getString(1);

            String t2;
            t2 = "tid='" + tid + "'";

            ContentValues cv2 = new ContentValues();
            cv2.put("notiflag", notiflag);
            cv2.put("status", "2");
            cv2.put("flag", "0");
            temp = database.update("task_master", cv2, t2, null);
            insertTaskmasterHistory(Integer.parseInt(tid));
            insertIntoPunchMaster(Integer.parseInt(tid));
            insertIntoFmaster(Integer.parseInt(tid), dataString, userName, userID, moduleName, String.valueOf(milliseconds), checksheetid);
            insertIntoPmaster(Integer.parseInt(tid), checksheetid, dataString, moduleid, moduleName, userName, userID, String.valueOf(milliseconds));
        } else {
            temp = database.insert("task_master", null, cv1);
            insertTaskmasterHistory((int) temp);
            insertIntoFmaster((int) temp, dataString, userName, userID, moduleName, String.valueOf(milliseconds), checksheetid);
            insertIntoPunchMaster((int) temp);
            insertIntoPmaster((int) temp, checksheetid, dataString, moduleid, moduleName, userName, userID, String.valueOf(milliseconds));


        }

        //call upload service
        Intent z_n12 = new Intent(sqlitewraper.context, f_upload_new_structure.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            sqlitewraper.context.startForegroundService(z_n12);
        } else {
            WakefulIntentService.sendWakefulWork(sqlitewraper.context, z_n12);
        }
    }


    //Insert Data in to f_master
    private static void insertIntoFmaster(int tid, String dataJson, String userName, String userID, String moduleName, String millisecond, String checksheetid) {


        SQLiteDatabase database = sqlitewraper.getDatabase();

        long milliseconds = System.currentTimeMillis();
        String fName = DeviceEventsUtils.getLoginDetails().get(1) + "_" + milliseconds;

        try {
            JSONObject jsonData = new JSONObject();
            jsonData.put("taskid", "");
            jsonData.put("servertaskid", "");
            jsonData.put("siteid", "");
            jsonData.put("stepid", "");
            jsonData.put("category", "");
            jsonData.put("imei", DeviceEventsUtils.getLoginDetails().get(1));
            jsonData.put("username", DeviceEventsUtils.getLoginDetails().get(3));
            jsonData.put("u_c", "");
            jsonData.put("subcategory", "");
            jsonData.put("date", "");
            jsonData.put("date_s", "");
            jsonData.put("address", "");
            jsonData.put("lat", DeviceEventsUtils.getCurrentLatLng().latitude);
            jsonData.put("long1", DeviceEventsUtils.getCurrentLatLng().longitude);
            jsonData.put("gps", DeviceEventsUtils.getGPSandIternetStatus().get("gps"));
            jsonData.put("accuracy", "");
            jsonData.put("diff_time", "");
            jsonData.put("check_type", "");
            jsonData.put("data", dataJson);
            jsonData.put("buttons", "");
            JSONArray jsonArray = new JSONArray();
            jsonArray.put(jsonData);


            ContentValues cv1 = new ContentValues();
            cv1.put("c_id", checksheetid);
            cv1.put("c_type", 5);
            cv1.put("tid", tid);
            cv1.put("f_name", fName);
            cv1.put("f_data", jsonArray.toString());
            cv1.put("f_key", "5");
            cv1.put("f_value", checksheetid);
            /*cv1.put("f_type", "text/plain");*/
            cv1.put("flag", "1");
            cv1.put("step", "1");
            cv1.put("millisecond", System.currentTimeMillis());
            long temp = database.insert("f_master", null, cv1);

            if (temp > 0) {

                new Handler(Looper.getMainLooper()).post(new Runnable() {
                    public void run() {
                        Toast.makeText(sqlitewraper.context, "Task created successfully", Toast.LENGTH_SHORT).show();
                    }
                });


            }


        } catch (Exception e) {
            Log.d("DATAAA", e.getLocalizedMessage());
            e.printStackTrace();
        }
    }

    //Insert Data into p_master
    private static void insertIntoPmaster(int tid, String checksheetid, String dataJson, int moduleid, String modulename, String userName, String userID, String milliseconds) {

        try {
            JSONArray firstArray = null;

            firstArray = new JSONArray(dataJson);

            JSONObject firstObject = null;
            String questionId = null;
            for (int i = 0; i < firstArray.length(); i++) {

                firstObject = firstArray.getJSONObject(i);
                questionId = firstObject.getString("que_id");

                Log.d("##QUESTIONID", questionId);
//             if (questionId.equalsIgnoreCase("8")){
//                 JSONArray jsonArray = new JSONArray();
////                 jsonArray.put();
//                 firstObject.put("ans", jsonArray);
//                 Log.d("##QUESTIONIDANS", String.valueOf(firstObject));
//                 firstArray.put(i, firstObject);
//             }

            }


            SharedPreferences sharedPref = sqlitewraper.context.getSharedPreferences("myKey", MODE_PRIVATE);
            SharedPreferences.Editor editor = sharedPref.edit();
            editor.putString("temp", String.valueOf(tid));
            editor.putString("checksheetid", checksheetid);
            editor.putString("dataString", dataJson);
            editor.putString("moduleid", String.valueOf(moduleid));
            editor.putString("moduleName", modulename);
            editor.putString("que_id", "15");
            editor.putString("flag", "0");
            editor.apply();
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    //insert data in to task_master_history
    public static void insertTaskmasterHistory(int tid) {

        SQLiteDatabase database = sqlitewraper.getDatabase();


        Cursor c1_n = database
                .rawQuery(
                        "Select tid,task_id ,server_task_id ,flag ,user_id ,username ,rate ,siteid ,site_name ,site_address ,percentage ,survey_date ,lat ,long ,inspect_count ,checksheetid ,height ,display_siteid ,step ,status ,upload_date ,updateddate ,millisecond , end_of_date , data ,tower_type ,moduleid ,module_name ,moduledef,srnumber,global_var,punch_flag,in_ms,out_ms,duration from task_master where tid="
                                + tid, null);
        c1_n.moveToFirst();
        if (c1_n.getCount() > 0) {

            int tid_n = c1_n.getInt(0);
            String task_id = c1_n.getString(1);
            int server_task_id = c1_n.getInt(2);
            String flag = c1_n.getString(3);
            int user_id = c1_n.getInt(4);
            String username = c1_n.getString(5);
            float rate = c1_n.getFloat(6);
            String siteid = c1_n.getString(7);
            String site_name = c1_n.getString(8);
            String site_address = c1_n.getString(9);
            float percentage = c1_n.getFloat(10);
            String survey_date = c1_n.getString(11);
            float lat = c1_n.getFloat(12);
            float lon = c1_n.getFloat(13);

            int inspect_count = c1_n.getInt(14);
            int checksheetid = c1_n.getInt(15);
            float height = c1_n.getFloat(16);
            String display_siteid = c1_n.getString(17);
            int step = c1_n.getInt(18);
            int status = c1_n.getInt(19);
            String upload_date = c1_n.getString(20);
            String updateddate = c1_n.getString(21);
            String millisecond = c1_n.getString(22);

            String end_of_date = c1_n.getString(23);
            String data = c1_n.getString(24);
            String tower_type = c1_n.getString(25);
            String moduleid = c1_n.getString(26);
            String module_name = c1_n.getString(27);
            String moduledef = c1_n.getString(28);
            String srnumber = c1_n.getString(29);

            String global_var = c1_n.getString(30);


            String punchFlag = c1_n.getString(31);
            String inMs = c1_n.getString(32);
            String outMs = c1_n.getString(33);
            String durationPunch = c1_n.getString(34);
            if (punchFlag == null) {
                punchFlag = "0";

            }
            if (inMs == null) {
                inMs = "0";
            }
            if (outMs == null) {
                outMs = "0";

            }
            if (durationPunch == null) {
                durationPunch = "0";
            }

            ContentValues c = new ContentValues();
            c.put("tid", tid_n);
            c.put("task_id", task_id);
            c.put("server_task_id", server_task_id);
            c.put("flag", "1");
            c.put("user_id", user_id);
            c.put("username", username);
            c.put("rate", rate);
            c.put("siteid", siteid);
            c.put("site_name", site_name);
            c.put("site_address", site_address);
            c.put("percentage", percentage);
            c.put("survey_date", survey_date);
            c.put("lat", lat);
            c.put("long", lon);
            c.put("inspect_count", inspect_count);
            c.put("checksheetid", checksheetid);
            c.put("height", height);
            c.put("display_siteid", display_siteid);
            c.put("step", step);
            c.put("status", status);
            c.put("upload_date", upload_date);
            c.put("updateddate", updateddate);
            c.put("millisecond", millisecond);
            c.put("end_of_date", end_of_date);
            c.put("data", data);
            c.put("tower_type", tower_type);
            c.put("moduleid", moduleid);
            c.put("module_name", module_name);
            c.put("moduledef", moduledef);
            c.put("srnumber", srnumber);
            c.put("global_var", global_var);

            c.put("punch_flag", punchFlag);
            c.put("in_ms", inMs);
            c.put("out_ms", outMs);
            c.put("duration", durationPunch);
            c.put("old_status", "1");
            c1_n.close();


            Cursor c2_n = database.rawQuery(
                    "Select * from task_master_history where status= " + status
                            + "  and tid=" + tid, null);
            c2_n.moveToFirst();

            if (c2_n.getCount() > 0) {
                String t;
                int tid_new = c2_n.getInt(0);
                t = "tid_n=" + tid_new;
                long temp = database.update("task_master_history", c, t, null);
            } else {
                long temp = database.insert("task_master_history", null, c);
                temp++;
            }
            c2_n.close();
        }
    }

    //cancle Notification
    private static void cancleNotification() {

        NotificationManager manager = (NotificationManager) sqlitewraper.context.getSystemService(NOTIFICATION_SERVICE);
        if (manager != null) {

            manager.cancel(1029);
            pref = sqlitewraper.context.getSharedPreferences("MyNotPref", 0);
            editor = pref.edit();
            editor.putString("NOTSHARED", "0"); // Saving string
            editor.apply();
        }
    }

    private static void setDelayCheckOut() {
        Calendar cal = Calendar.getInstance(); // creates calendar
        cal.setTime(new Date()); // sets calendar time/date
        cal.add(Calendar.MINUTE, 10); // adds one hour

        Intent intent = new Intent(sqlitewraper.context, AutoCheckOutReceiver.class);
        PendingIntent sender = PendingIntent.getBroadcast(sqlitewraper.context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        AlarmManager am = (AlarmManager) sqlitewraper.context.getSystemService(ALARM_SERVICE);
        if (am != null) {
            am.set(AlarmManager.RTC_WAKEUP, cal.getTimeInMillis(), sender);
        }
    }

    // insert data in to punch master
    private static void insertIntoPunchMaster(int tid) {
        SharedPreferences sharedPref = sqlitewraper.context.getSharedPreferences("myKey1", MODE_PRIVATE);
        SharedPreferences.Editor editor = sharedPref.edit();
        editor.putString("tid", String.valueOf(tid));
        editor.apply();
    }

    final static String dataFormat = "yyyy/MM/dd HH:mm";

    //to replace data with new values for specific types
    private static String replacejsonData(String jsonDataString, String userName, String userId, String moduleName, String millisecond, String detectionFilePath) {

        JSONArray firstArray = null;
        try {
            firstArray = new JSONArray(jsonDataString);

            JSONObject firstObject = null;

            for (int i = 0; i < firstArray.length(); i++) {
                firstObject = firstArray.getJSONObject(i);
                String questionId = firstObject.getString("que_id");
                if (questionId.equalsIgnoreCase("4")) {
                    JSONArray jsonArray = new JSONArray();
                    jsonArray.put(userName);
                    jsonArray.put(userId);
                    firstObject.put("ans", jsonArray);
                    firstArray.put(i, firstObject);
                }
                if (questionId.equalsIgnoreCase("7")) {
                    JSONArray jsonArray = new JSONArray();
                    jsonArray.put(moduleName);
                    firstObject.put("ans", jsonArray);
                    firstArray.put(i, firstObject);
                }
                if (questionId.equalsIgnoreCase("10")) {
                    String assignDate = convertDate(millisecond, dataFormat);
                    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                        boolean validate = isValidFormat(dataFormat, assignDate, Locale.ENGLISH);
                        if (!validate)
                            assignDate = getTimeStamp(millisecond);
                        validate = isValidFormat(dataFormat, assignDate, Locale.ENGLISH);
                        if (!validate) {
                            Toast.makeText(sqlitewraper.context, "AssignDate Format is invalid", Toast.LENGTH_SHORT).show();
                        }

                    }
                  //  Date d = new Date();
                 //   CharSequence s = DateFormat.format("HH:mm", d.getTime());
                    JSONArray jsonArray = new JSONArray();
                    jsonArray.put(assignDate);
                    //   jsonArray.put(assignDate);
                  //  jsonArray.put(s.toString());
                    firstObject.put("ans", jsonArray);
                    firstArray.put(i, firstObject);
                }
                if (questionId.equalsIgnoreCase("15")) {
                  /* Context context = null;
                    File direct = new File(Utils.getDownloadPathFile(context).getAbsolutePath() + "/FaceDetection", "/EASYFORM_FACE");
                    if (!direct.exists()) {
                        direct.mkdirs();
                    } else {
                        Log.d("file", direct.getAbsolutePath() + " " + direct.exists());
                    } */
                    JSONArray jsonArray = new JSONArray();
                    jsonArray.put(detectionFilePath);
                    firstObject.put("ans", jsonArray);
                    firstArray.put(i, firstObject);
                }
            }
            return firstArray.toString();
        } catch (Exception e) {
            LogUtils.writeAttendanceLogToFile("Exception : " + e.toString(), "replacejsonData");
            return "";
        }
    }

    //to chec date format
    @RequiresApi(api = Build.VERSION_CODES.O)
    public static boolean isValidFormat(String format, String value, Locale locale) {
        LocalDateTime ldt = null;
        DateTimeFormatter fomatter = DateTimeFormatter.ofPattern(format, locale);
        try {
            ldt = LocalDateTime.parse(value, fomatter);
            String result = ldt.format(fomatter);
            return result.equals(value);
        } catch (DateTimeParseException e) {
            LogUtils.writeAttendanceLogToFile("DateTimeParseException1 : " + e.toString(), "isValidFormat");
            try {
                LocalDate ld = LocalDate.parse(value, fomatter);
                String result = ld.format(fomatter);
                return result.equals(value);
            } catch (DateTimeParseException exp) {
                LogUtils.writeAttendanceLogToFile("DateTimeParseException2 : " + exp.toString(), "isValidFormat");
                try {
                    LocalTime lt = LocalTime.parse(value, fomatter);
                    String result = lt.format(fomatter);
                    return result.equals(value);
                } catch (DateTimeParseException e2) {
                    LogUtils.writeAttendanceLogToFile("DateTimeParseException3 : " + e2.toString(), "isValidFormat");
                }
            }
        }
        return false;
    }

    //to get date with time
    public static String getTimeStamp(String timeinMillies) {
        String date = "";
        String finalmonth = "";
        String finalday = "";
        Calendar c = Calendar.getInstance();
        c.setTimeInMillis(Long.parseLong(timeinMillies));
        String mYear = String.valueOf(c.get(Calendar.YEAR));
        int mMonth = c.get(Calendar.MONTH) + 1;
        int mDay = c.get(Calendar.DAY_OF_MONTH);

        if (mMonth < 10) {
            NumberFormat f = new DecimalFormat("00");
            finalmonth = String.valueOf(f.format(mMonth));
        }

        if (mDay < 10) {
            NumberFormat f = new DecimalFormat("00");
            finalday = String.valueOf(f.format(mDay));
        }

        date = finalmonth + "/" + finalday + "/" + mYear;

        return date;
    }
}


