package com.sky.atc.easyformse.attendance.newattendanceutils.attendanceutils;

import static android.content.Context.LOCATION_SERVICE;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.text.format.DateFormat;
import android.util.Log;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;

import com.commonsware.cwac.wakeful.WakefulIntentService;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.sky.atc.easyformse.AddressApi;
import com.sky.atc.easyformse.DeviceEventsUtils;
import com.sky.atc.easyformse.attendance.newattendanceutils.AttendanceUtil;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.f_upload_new_structure;
import com.sky.atc.easyformse.location_server;
import com.sky.atc.easyformse.maulik;
import com.sky.atc.easyformse.sqlitewraper;
import com.sky.atc.easyformse.trip.LocationOutageUtils;
import com.sky.atc.easyformse.trip.TripBackgroundMapActivity;
import com.sky.atc.easyformse.utils.LogUtils;

import net.sqlcipher.Cursor;
import net.sqlcipher.database.SQLiteDatabase;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Date;
import java.util.List;


/**
 * Created by NareshChocha on 4/6/2022.
 *
 * @author NareshChocha
 */
public class AttendanceTaskUtil {

    public static void setDataFormat(String dataFormat) {
        AttendanceTaskUtil.dataFormat = dataFormat;
    }

    static String dataFormat = "yyyy/MM/dd HH:mm";
    static String dataFormatTaskCheck = "yyyy/MM/dd";
    private static final String MY_PREFS_NAME = "MY_TRIP";

    static LocationManager locationManager;

    static String latitude;
    static String longitude;
    static String Accuracy;
    static MySharedPreferences editor = sqlitewraper.getSecureShared(MY_PREFS_NAME);

    public static String getTaskCheckSheetJSon() {
        return "[{\"item_id\":0,\"que_id\":0,\"type\":0,\"Excel_Header\":\"Task Form\",\"value\":[\"Task Form\"],\"ans\":[\"\"],\"prop\":[{\"searchkey\":0,\"valid\":\"true\",\"is_deleted\":0,\"name\":\"\",\"class1\":[\"\"],\"misc_data\":[{\"type\":50,\"value\":\"\"}],\"reference_from_id\":0}],\"dependency\":[{\"dep_type\":\"\",\"dep_ans\":\"\",\"dep_item_id\":\"\",\"dep_class\":\"\"}]},{\"item_id\":1,\"que_id\":4,\"type\":20,\"Excel_Header\":\"UserName\",\"value\":[\"UserName\"],\"ans\":[\"\"],\"prop\":[{\"searchkey\":1,\"valid\":\"true\",\"is_deleted\":0,\"name\":\"UserName\",\"class1\":[\"\"],\"misc_data\":[{\"type\":6,\"value\":[]}],\"value_new\":[{\"push_data\":[{\"push_array\":[],\"window_style\":\"popup\",\"view_style\":\"tableview\"}],\"Checksheet_id\":59295,\"columndata\":[],\"Fill_Data\":[],\"Target_Id\":\"USER_ID\",\"Target_Value\":\"UserName\",\"SearchID\":15707,\"SearchName\":\"UserName-1\"}],\"reference_from_id\":0}],\"dependency\":[{\"dep_type\":\"\",\"dep_ans\":\"\",\"dep_item_id\":\"\",\"dep_class\":\"\"}]},{\"item_id\":2,\"que_id\":7,\"type\":21,\"Excel_Header\":\"FlowName\",\"value\":[\"FlowName\"],\"ans\":[\"\"],\"prop\":[{\"searchkey\":1,\"valid\":\"true\",\"is_deleted\":0,\"name\":\"FlowName\",\"class1\":[\"\"],\"misc_data\":[{\"type\":6,\"value\":[]}],\"reference_from_id\":0}],\"dependency\":[{\"dep_type\":\"\",\"dep_ans\":\"\",\"dep_item_id\":\"\",\"dep_class\":\"\"}]},{\"item_id\":3,\"que_id\":10,\"type\":8,\"Excel_Header\":\"\",\"value\":[\"AssignDate\"],\"ans\":[\"\"],\"prop\":[{\"searchkey\":1,\"valid\":\"true\",\"is_deleted\":0,\"name\":\"AssignDate\",\"class1\":[\"\"],\"misc_data\":[{\"type\":50,\"value\":\"\"}],\"reference_from_id\":0}],\"dependency\":[{\"dep_type\":\"\",\"dep_ans\":\"\",\"dep_item_id\":\"\",\"dep_class\":\"\"}]},{\"item_id\":4,\"que_id\":15,\"type\":7,\"Excel_Header\":\"Face Detection Photo\",\"value\":[\"Face Detection Photo\"],\"ans\":[\"\"],\"prop\":[{\"searchkey\":1,\"valid\":\"true\",\"is_deleted\":0,\"is_hide\":\"false\",\"trigger_class\":\"\",\"name\":\"Face Detection Photo\",\"class1\":[\"\"],\"reference_class\":[],\"is_disabled\":\"false\",\"misc_data\":[{\"type\":6,\"value\":\"[{\\\"photo_type\\\":\\\"camera\\\",\\\"latlong\\\":\\\"false\\\",\\\"quality\\\":\\\"0\\\",\\\"width\\\":\\\"480\\\",\\\"height\\\":\\\"640\\\",\\\"view_label\\\":\\\"true\\\",\\\"target_class\\\":\\\"\\\",\\\"burstmode\\\":\\\"false\\\",\\\"old_photo_class\\\":\\\"\\\",\\\"car_check\\\":\\\"false\\\",\\\"scan_mode\\\":\\\"false\\\"}]\"}],\"is_reset\":\"false\",\"TASK_CREATION_TRIGGER\":\"\",\"reference_from_id\":0}],\"objectclass\":\"Select\",\"objectname\":\"\",\"Category_Id\":\"0\",\"objectfill\":\"label\",\"old_log\":\"false\",\"check_duplicate\":\"false\"},{\"item_id\":5,\"que_id\":8,\"type\":10,\"Excel_Header\":\"\",\"value\":[\"\"],\"ans\":[\"\"],\"prop\":[{\"searchkey\":0,\"valid\":\"true\",\"is_deleted\":0,\"name\":\"\",\"class1\":[\"\"],\"misc_data\":[{\"type\":50,\"value\":\"\"}],\"reference_from_id\":0}],\"dependency\":[{\"dep_type\":\"\",\"dep_ans\":\"\",\"dep_item_id\":\"\",\"dep_class\":\"\"}]}]";
    }

    //
    public static String fillTaskCheckSheet(String taskCheckSheetJSonArray,
                                            String username,
                                            String userid,
                                            String moduleName,
                                            String millisecond,
                                            String detectionFilePath
    ) {
        JSONArray taskJsonArrayRoot = null;
        try {
            taskJsonArrayRoot = new JSONArray(taskCheckSheetJSonArray);
            for (int i = 0; i < taskJsonArrayRoot.length(); i++) {
                JSONObject queJsonObject = taskJsonArrayRoot.getJSONObject(i);
                String questionId = queJsonObject.getString("que_id");
                if (questionId.equalsIgnoreCase("4")) {
                    JSONArray jsonArray = new JSONArray();
                    jsonArray.put(username);
                    jsonArray.put(userid);
                    queJsonObject.put("ans", jsonArray);
                    taskJsonArrayRoot.put(i, queJsonObject);
                } else if (questionId.equalsIgnoreCase("7")) {
                    JSONArray jsonArray = new JSONArray();
                    jsonArray.put(moduleName);
                    queJsonObject.put("ans", jsonArray);
                    taskJsonArrayRoot.put(i, queJsonObject);
                } else if (questionId.equalsIgnoreCase("10")) {
                    String assignDate = convertDate(millisecond, dataFormat);
                    JSONArray jsonArray = new JSONArray();
                    jsonArray.put(assignDate);
                    queJsonObject.put("ans", jsonArray);
                    taskJsonArrayRoot.put(i, queJsonObject);
                } else if (questionId.equalsIgnoreCase("15")) {
                    JSONArray jsonArray = new JSONArray();
                    jsonArray.put(detectionFilePath);
                    queJsonObject.put("ans", jsonArray);
                    taskJsonArrayRoot.put(i, queJsonObject);
                }
            }
            return taskJsonArrayRoot.toString();
        } catch (Exception e) {
            LogUtils.writeAttendanceLogToFile("Exception : " + e.toString(), "fillTaskCheckSheet");
            return "";
        }
    }


    //insert in to task master
    public static void insertIntoTaskmaster(@NonNull SQLiteDatabase database, String taskCheckSheetJson,
                                            String username,
                                            String userid,
                                            int moduleId,
                                            String checkSheetId,
                                            String moduleName,
                                            String detectionFilePath, String detectionFileName ,String ischeckplugin,String checkoutbtn ,String Punchin_Status ,String Punchout_Status,String face_detatcion) {
        long milliseconds = System.currentTimeMillis();

        String task_id = DeviceEventsUtils.getLoginDetails().get(1) + "_" + milliseconds;

        String surveyDate = convertDate(String.valueOf(milliseconds), dataFormat);
        String filledTaskCheckSheetJson;
        // fillTaskCheckSheet Json
        if(ischeckplugin.equalsIgnoreCase("true"))
        {
//            coming attendancetaskcreateplugin with dynamic json - user's fill self attendance
             filledTaskCheckSheetJson = taskCheckSheetJson;
        }
        else {
            // coming facedeteaction activity with static json - pt.cksupervisor fills multiple attendance
             filledTaskCheckSheetJson = fillTaskCheckSheet(taskCheckSheetJson, username,
                    userid, moduleName, String.valueOf(milliseconds), detectionFilePath);
        }


        Date d = new Date();
        CharSequence s = DateFormat.format("hh:mm:ss", d.getTime());

        ContentValues TaskMasterValues = new ContentValues();

        TaskMasterValues.put("task_id", task_id);
        TaskMasterValues.put("server_task_id", 0);
        TaskMasterValues.put("flag", "1");
        TaskMasterValues.put("user_id", userid);
        TaskMasterValues.put("username", username);
        TaskMasterValues.put("rate", "2");
        TaskMasterValues.put("siteid", 0);
        TaskMasterValues.put("site_name", "0");
        TaskMasterValues.put("site_address", "");
        TaskMasterValues.put("percentage", "0");
        TaskMasterValues.put("survey_date", surveyDate);
        TaskMasterValues.put("lat", DeviceEventsUtils.getCurrentLatLng().latitude);
        TaskMasterValues.put("long", DeviceEventsUtils.getCurrentLatLng().longitude);
        TaskMasterValues.put("inspect_count", "0");
        TaskMasterValues.put("checksheetid", checkSheetId);
        TaskMasterValues.put("height", "0");
        TaskMasterValues.put("display_siteid", "0");
        TaskMasterValues.put("step", "0");
        TaskMasterValues.put("status", Punchin_Status);
        TaskMasterValues.put("upload_date", "");
        TaskMasterValues.put("updateddate", "");
        TaskMasterValues.put("millisecond", milliseconds);
        TaskMasterValues.put("end_of_date", "");
        TaskMasterValues.put("data", filledTaskCheckSheetJson);
        TaskMasterValues.put("tower_type", "16825");
        TaskMasterValues.put("moduleid", moduleId);
        TaskMasterValues.put("module_name", moduleName);
        TaskMasterValues.put("srnumber", "");
        TaskMasterValues.put("global_var", "");
        TaskMasterValues.put("site_flag", "0");
        TaskMasterValues.put("server_task_flag", "1");
        TaskMasterValues.put("display_siteid", "0");
        TaskMasterValues.put("is_down_complete", "1");
        TaskMasterValues.put("in_ms", s.toString());
        TaskMasterValues.put("notiflag", "1");
        TaskMasterValues.put("islogdown", "0");
        TaskMasterValues.put("match_temp_id", "37864");
        TaskMasterValues.put("p_match_temp_id", "37864");

        long insertedTid = database.insert("task_master", null, TaskMasterValues);
        MySharedPreferences pref = sqlitewraper.getSecureShared("MyPref");
        pref.putString("attendance_tid",String.valueOf(insertedTid));
        pref.commit();
        insertTaskmasterHistory(database, Integer.parseInt(insertedTid + ""),Punchin_Status,Punchout_Status);
        insertPunchMaster(database, username, insertedTid + "",
                DeviceEventsUtils.getLoginDetails().get(2), userid, 0,Punchout_Status);
        insertFMaster(database, insertedTid, filledTaskCheckSheetJson, username, checkSheetId);

        if(!face_detatcion.equalsIgnoreCase("false"))
        {
            insertPMaster(database, insertedTid + "", checkSheetId, detectionFileName, detectionFilePath, "15");
        }

        //call upload service
        Intent fUploadNewStructureIntent = new Intent(sqlitewraper.context, f_upload_new_structure.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            sqlitewraper.context.startForegroundService(fUploadNewStructureIntent);
        } else {
            WakefulIntentService.sendWakefulWork(sqlitewraper.context, fUploadNewStructureIntent);
        }

        // send for check out notification
//
//        Cursor c3 = database
//                .rawQuery(
//                        "SELECT username,company_id,user_id FROM  Login_Master",
//                        null);
//        c3.moveToLast();
//
//        username = c3.getString(0);
//        int company_id = c3.getInt(1);
//        int user_id = c3.getInt(2);
//
//        c3.close();

//        check out btn false hide checkout notification
          // hide check out notification , only punch out notification coming with set time 2606205
//        if(checkoutbtn == null|| checkoutbtn.equalsIgnoreCase("false"))
//        {
//        }
//        else {
////            show checkout notification
//            new Handler(Looper.getMainLooper()).postDelayed(() -> {
//                if (AttendanceUtil.getAttendanceDataList() != null) {
//                    AttendanceUtil.setAttendanceNotificationAlarm(AttendanceUtil.getAttendanceDataList().get(0));
//                }
//            }, 5000);
//        }

    }


    public static String convertDate(String dateInMilliseconds, String dateFormat) {
        return DateFormat.format(dateFormat, Long.parseLong(dateInMilliseconds)).toString();
    }

    public static void insertPMaster(SQLiteDatabase database,
                                     String tid,
                                     String checkSheetId,
                                     String pName,
                                     String detectionFilePath,
                                     String queId
    ) {
        try {
            ContentValues PMasterValues = new ContentValues();
            PMasterValues.put("tid", tid);
            PMasterValues.put("checksheetid", checkSheetId);
            PMasterValues.put("p_name", pName);
            PMasterValues.put("p_url", detectionFilePath);
            PMasterValues.put("millisecond", System.currentTimeMillis());
            PMasterValues.put("p_key", "1");
            PMasterValues.put("p_value", "image");
            PMasterValues.put("p_type", "image/jpg");
            PMasterValues.put("Ph_id", "0");
            PMasterValues.put("it_id", "0");
            PMasterValues.put("que_name", "Face Detection Photo");
            PMasterValues.put("que_id", queId);
            PMasterValues.put("match_temp_id", "37864");
            PMasterValues.put("flag", "0");
            long temp = database.insert("p_master", null, PMasterValues);
        } catch (Exception e) {
            LogUtils.writeAttendanceLogToFile("Exception : " + e.toString(), "insertPMaster");
        }
    }

    public static void insertPunchMaster(SQLiteDatabase database,
                                         String username,
                                         String tid,
                                         String appId,
                                         String userId,
                                         int punchFlag, // 0 and 1 only
                                         String punchoutstatus
    ) {
        try {
            long millisecond = System.currentTimeMillis();
            ContentValues punchMasterValues = new ContentValues();
            long UTCMillisecond = DeviceEventsUtils.utcCalculationOffset(millisecond);

            punchMasterValues.put("username", username);
            punchMasterValues.put("tid", tid);
            punchMasterValues.put("millisecond", millisecond);

            // punchMasterValues.put("appid", DeviceEventsUtils.getLoginDetails().get(2));
            punchMasterValues.put("appid", appId);
            //punchMasterValues.put("userid", DeviceEventsUtils.getLoginDetails().get(0));
            punchMasterValues.put("userid", userId);

            punchMasterValues.put("UTCmillisecond", UTCMillisecond);
            punchMasterValues.put("lat", DeviceEventsUtils.getCurrentLatLng().latitude);
            punchMasterValues.put("lon", DeviceEventsUtils.getCurrentLatLng().longitude);
            punchMasterValues.put("gprs", DeviceEventsUtils.getGPSandIternetStatus().get("gprs"));
            punchMasterValues.put("gps", DeviceEventsUtils.getGPSandIternetStatus().get("gps"));
            punchMasterValues.put("address", "");
            punchMasterValues.put("punch_upload_flag", "0");
            punchMasterValues.put("punch_flag", String.valueOf(punchFlag));
            database.insert("punch_master", null, punchMasterValues);
            if (punchFlag == 1) {
                updateTaskmaster(database, tid,punchoutstatus);
            }
        } catch (Exception e) {
            LogUtils.writeAttendanceLogToFile("Exception : " + e.toString(), "insertPunchMaster");
        }

    }


    public static void updateTaskmaster(SQLiteDatabase database, String tid,String  punchoutstatus) {
        try {
            String taskMasterWhere;
            taskMasterWhere = "tid=" + tid;
            ContentValues taskMasterValues = new ContentValues();
            taskMasterValues.put("notiflag", "2");
            taskMasterValues.put("flag", "1");
            taskMasterValues.put("status", punchoutstatus);
            String timeString = DateFormat.format("hh:mm:ss", new Date().getTime()).toString();
            taskMasterValues.put("out_ms", timeString);
            database.update("task_master", taskMasterValues, taskMasterWhere, null);
        } catch (Exception e) {
            LogUtils.writeAttendanceLogToFile("Exception : " + e.toString(), "updateTaskmaster");
        }
    }


    //insert data in to task_master_history
    public static void insertTaskmasterHistory(SQLiteDatabase database, int tid,String Punchin_Status,String Punchout_status) {
        try {

            Cursor taskCursor = database
                    .rawQuery(
                            "Select tid,task_id ,server_task_id ,flag ,user_id ,username ,rate ,siteid ,site_name ,site_address ,percentage ,survey_date ,lat ,long ,inspect_count ,checksheetid ,height ,display_siteid ,step ,status ,upload_date ,updateddate ,millisecond , end_of_date , data ,tower_type ,moduleid ,module_name ,moduledef,srnumber,global_var,punch_flag,in_ms,out_ms,duration from task_master where tid="
                                    + tid, null);
            taskCursor.moveToFirst();
            if (taskCursor.getCount() > 0) {

                int status = taskCursor.getInt(19);
                String punchFlag = taskCursor.getString(31);
                String inMs = taskCursor.getString(32);
                String outMs = taskCursor.getString(33);
                String durationPunch = taskCursor.getString(34);
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
                ContentValues taskHistoryValues = new ContentValues();
                taskHistoryValues.put("tid", taskCursor.getInt(0));
                taskHistoryValues.put("task_id", taskCursor.getString(1));
                taskHistoryValues.put("server_task_id", taskCursor.getInt(2));
                taskHistoryValues.put("flag", "1");
                taskHistoryValues.put("user_id", taskCursor.getInt(4));
                taskHistoryValues.put("username", taskCursor.getString(5));
                taskHistoryValues.put("rate", taskCursor.getFloat(6));
                taskHistoryValues.put("siteid", taskCursor.getString(7));
                taskHistoryValues.put("site_name", taskCursor.getString(8));
                taskHistoryValues.put("site_address", taskCursor.getString(9));
                taskHistoryValues.put("percentage", taskCursor.getFloat(10));
                taskHistoryValues.put("survey_date", taskCursor.getString(11));
                taskHistoryValues.put("lat", taskCursor.getFloat(12));
                taskHistoryValues.put("long", taskCursor.getFloat(13));
                taskHistoryValues.put("inspect_count", taskCursor.getInt(14));
                taskHistoryValues.put("checksheetid", taskCursor.getInt(15));
                taskHistoryValues.put("height", taskCursor.getFloat(16));
                taskHistoryValues.put("display_siteid", taskCursor.getString(17));
                taskHistoryValues.put("step", taskCursor.getInt(18));

                taskHistoryValues.put("status", status);

                taskHistoryValues.put("upload_date", taskCursor.getString(20));
                taskHistoryValues.put("updateddate", taskCursor.getString(21));
                taskHistoryValues.put("millisecond", taskCursor.getString(22));
                taskHistoryValues.put("end_of_date", taskCursor.getString(23));
                taskHistoryValues.put("data", taskCursor.getString(24));
                taskHistoryValues.put("tower_type", taskCursor.getString(25));
                taskHistoryValues.put("moduleid", taskCursor.getString(26));
                taskHistoryValues.put("module_name", taskCursor.getString(27));
                taskHistoryValues.put("moduledef", taskCursor.getString(28));
                taskHistoryValues.put("srnumber", taskCursor.getString(29));
                taskHistoryValues.put("global_var", taskCursor.getString(30));

                taskHistoryValues.put("punch_flag", punchFlag);
                taskHistoryValues.put("in_ms", inMs);
                taskHistoryValues.put("out_ms", outMs);
                taskHistoryValues.put("duration", durationPunch);

                taskHistoryValues.put("old_status", Punchin_Status);
                taskCursor.close();

                Cursor taskHistoryCursor = database.rawQuery(
                        "Select * from task_master_history where status= " + status
                                + "  and tid=" + tid, null);
                taskHistoryCursor.moveToFirst();

                if (taskHistoryCursor.getCount() > 0) {
                    String taskHistoryWhere;
                    int tid_new = taskHistoryCursor.getInt(0);
                    taskHistoryWhere = "tid_n=" + tid_new;
                    database.update("task_master_history", taskHistoryValues, taskHistoryWhere, null);
                } else {
                    database.insert("task_master_history", null, taskHistoryValues);
                }
                taskHistoryCursor.close();
            }
        } catch (Exception e) {
            LogUtils.writeAttendanceLogToFile("Exception : " + e.toString(), "insertTaskmasterHistory");
        }
    }


    //Insert Data in to f_master
    private static void insertFMaster(SQLiteDatabase database, long tid, String dataJson, String userName, String checkSheetId) {

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
            jsonData.put("username", userName);
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

            ContentValues fMasterValues = new ContentValues();
            fMasterValues.put("c_id", checkSheetId);
            fMasterValues.put("c_type", 5);
            fMasterValues.put("tid", tid);
            fMasterValues.put("f_name", fName);
            fMasterValues.put("f_data", jsonArray.toString());
            fMasterValues.put("f_key", "5");
            fMasterValues.put("f_value", checkSheetId);
            fMasterValues.put("flag", "1");
            fMasterValues.put("step", "1");
            fMasterValues.put("millisecond", System.currentTimeMillis());
            long temp = database.insert("f_master", null, fMasterValues);
            if (temp > 0) {
                new Handler(Looper.getMainLooper()).post(() -> Toast.makeText(sqlitewraper.context, "Task created successfully", Toast.LENGTH_SHORT).show());
            }
        } catch (Exception e) {
            LogUtils.writeAttendanceLogToFile("Exception : " + e.toString(), "insertFMaster");
        }
    }

    public static void updatelatplug(SQLiteDatabase database, String tid,String  punchoutstatus) {
        try {



            reqLocation();

            editor = sqlitewraper.getSecureShared(MY_PREFS_NAME);
            MySharedPreferences prefs = sqlitewraper.getSecureShared(MY_PREFS_NAME);
            String t;
            String siteLng = "0";
            String siteLat = "0";
            String sid = "0";
            String millisecond = "0";
            String step_id = "1";
            String checkid = "0";
            String s_lat = "0";
            String s_lon = "0";
            String status = "";

            String unique_trip_id = null;
            String site_name = null;
            String matchKeyID = null;

            Cursor c1 = database
                    .rawQuery(
                            "select lat,long,server_task_id,millisecond,checksheetid,site_name,match_temp_id,status from task_master where tid="
                                    + tid, null);
            c1.moveToFirst();
            int count = c1.getCount();

            if (count > 0) {
                for (int i = 0; i < c1.getCount(); i++) {

                    siteLat = c1.getString(0);
                    siteLng = c1.getString(1);
                    sid = c1.getString(2);
                    millisecond = c1.getString(3);
                    checkid = c1.getString(4);
                    site_name = c1.getString(5);
                    matchKeyID = c1.getString(6);
                    status = c1.getString(7);
                }
            }

            if (siteLat == null) {
                siteLat = "0";
            }

            if (siteLng == null) {
                siteLng = "0";
            }
            if (sid == null) {
                sid = "0";
            }
            if (checkid == null) {
                checkid = "0";
            }
            if (site_name == null) {
                site_name = "0";
            }
            if (matchKeyID == null) {
                matchKeyID = "0";
            }

            c1.close();

            Cursor c3 = database.rawQuery(
                    "SELECT appid FROM  Login_Master", null);

            c3.moveToFirst();
            int count3 = c3.getCount();

            if (count3 > 0) {
                unique_trip_id = c3.getString(0);
            }

            unique_trip_id = unique_trip_id + "_" + System.currentTimeMillis();
            c3.close();


            // s_lat = String.valueOf(pointOneLat);
            // s_lon = String.valueOf(pointOneLang);


            ContentValues latc = new ContentValues();

            latc.put("sid", Integer.valueOf(sid));
            latc.put("d_lat", siteLat);
            latc.put("d_lon", siteLng);
            latc.put("isacc", "0");
            latc.put("isshort", "0");
            latc.put("iseve", "0");
            latc.put("isdv_eve", "0");
            latc.put("issend", "0");
            latc.put("step", Integer.valueOf(step_id));
            latc.put("chkid", checkid);
            latc.put("tid", Integer.valueOf(tid));
            //latc.put("odometer_point", odometerpoint);
            // latc.put("trip_status", trip_status);
            latc.put("site_name", site_name);
            latc.put("sh_path", "");
            latc.put("ac_path", "");
            latc.put("Event", "");
            //latc.put("etaflag", etaFlag);
            latc.put("match_temp_id", matchKeyID);


            editor.putString("llat", latitude);
            editor.putString("llon", longitude);
            editor.commit();


            String restoredText = prefs.getString("tid", null);
            if (restoredText != null) {
                unique_trip_id = prefs.getString("unique_trip_id", "");//"No name defined" is the default value.
            }


            Cursor tidcursor = database.rawQuery(
                    "SELECT tid  FROM  lat_plug WHERE   _id = (SELECT MAX(_id) FROM lat_plug);", null);
            tidcursor.moveToFirst();

            int j = tidcursor.getCount();

            String tid1 = null;
            t = "tid='" + tid + "' and trip_status='" + 0 + "'";

            insertTrackmaster( database, latitude, longitude, Accuracy);
            insertLocation_log_Tbl(database ,latitude, longitude, Accuracy);


            latc.put("trip_status", "1");
            latc.put("trip_shflag", "1");
            latc.put("max_milli", System.currentTimeMillis());
            latc.put("llat", latitude);
            latc.put("llon", longitude);

            long temp = database.update("lat_plug", latc, t, null);
            Log.d("##TripUpdate", String.valueOf(temp));

            MySharedPreferences pref = sqlitewraper.getSecureShared("MyPref");
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
            else {
                TripBackgroundMapActivity.mActivity.finish();
            }


        }
        catch (Exception e)
        {
            Log.d("Exceptionautotrip",e.toString());
        }
    }

    public static void reqLocation() {

        LocationListener locationListener = new MyLocationListner();
        Location location1 = getLastKnownLocation();
        if (location1 != null) {
            locationListener.onLocationChanged(location1);
        }else {
            //Toast.makeText(sqlitewraper.context, "No Location Provider found", Toast.LENGTH_SHORT).show();
        }
    }

    private static Location getLastKnownLocation() {
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

    public static class MyLocationListner implements LocationListener {
        @Override
        public void onLocationChanged(Location location) {

            latitude = String.valueOf(location.getLatitude());
            longitude = String.valueOf(location.getLongitude());
            Accuracy =  String.valueOf(location.getAccuracy());

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


    public static void insertTrackmaster(SQLiteDatabase database, String lat, String lon, String accuracy1) {


        android.database.Cursor a_t = database.rawQuery(
                "select value from APP_states where ITEAM ='nick'", null);
        a_t.moveToFirst();
        int j = a_t.getCount();

        j++;

        String username = null;
        if (a_t.getCount() > 0) {

            username = a_t.getString(0);
        }

//        String add = getCompleteAddressString(Double.parseDouble(lat), Double.parseDouble(lon));
        String add = AddressApi.getCompleteAddress(Double.parseDouble(lat), Double.parseDouble(lon));
        Date now = new Date();

        Long time = now.getTime();
        String Date = now.toLocaleString();

        ContentValues args1 = new ContentValues();
        args1.put("cellid", add);
        args1.put("lat", lat);
        args1.put("date", time.toString());
        args1.put("date_s", Date);
        args1.put("lon", lon);
        args1.put("provider", "gps");
        args1.put("accuracy", accuracy1);
        args1.put("speed", "0.0");
        args1.put("IS_SEND", 0);
        args1.put("IS_LOC", time);
        args1.put("address", add);
        args1.put("username", username);
        args1.put("tripflag", "2");

        long temp_mast = database.insert("track_master", null, args1);

    }


    // trip start and end time insert entry in location_log tbl and upload
    public static void insertLocation_log_Tbl( SQLiteDatabase database, String lat, String lon, String accuracy1) {


        android.database.Cursor a_t = database.rawQuery(
                "select value from APP_states where ITEAM ='nick'", null);
        a_t.moveToFirst();
        int j = a_t.getCount();

        j++;

        String username = null;
        if (a_t.getCount() > 0) {

            username = a_t.getString(0);
        }

//        String add = getCompleteAddressString(Double.parseDouble(lat), Double.parseDouble(lon));
        String add = AddressApi.getCompleteAddress(Double.parseDouble(lat), Double.parseDouble(lon));
        Date now = new Date();

        Long time = now.getTime();
        String Date1 = now.toString();

        String imei1 = DeviceEventsUtils.getLoginDetails().get(1);
        ContentValues args = new ContentValues();
        args.put("cellid", imei1);
        args.put("lat", DeviceEventsUtils.LatlngRoundff(lat));
        args.put("date", time);
        args.put("date_s", Date1);
        args.put("lon", DeviceEventsUtils.LatlngRoundff(lon));
        args.put("provider", "gps");
        args.put("accuracy", accuracy1);
        args.put("IS_SEND", 0);
        args.put("IS_LOC", time);
        args.put("address", add);
        args.put("wait_time", time);
        args.put("wait_time_s", Date1);
        args.put("username", username);
        args.put("speed", 0);
        //lac column is use for check the trip status
        //true means trip start false means trip not start
        args.put("lac",DeviceEventsUtils.tripStatus());

        long temp = database.insert("location_log", null, args);

//            upload location entry into server
        Intent location = new Intent(sqlitewraper.context, location_server.class);
        WakefulIntentService.sendWakefulWork(sqlitewraper.context,
                location);

    }

    public static String getTaskMasterTid(@NonNull SQLiteDatabase database, int moduleId, String moduleName, String username, String userId) {
        Cursor taskMasterCursor = database
                .rawQuery("SELECT tid FROM task_master WHERE moduleid=" + moduleId + " AND username='" + username + "' AND user_id=" + userId, null);
        taskMasterCursor.moveToLast();
        int count = taskMasterCursor.getCount();
        if (count > 0) {
            String tid = taskMasterCursor.getString(0);
            taskMasterCursor.close();
            return tid;
        } else {
            taskMasterCursor.close();
            return "";
        }
    }

    public static String getTaskMasterStatus(@NonNull SQLiteDatabase database, int moduleId, String moduleName, String username, String userId,String taskid) {
        Cursor taskMasterCursor = database
                .rawQuery("SELECT status FROM task_master WHERE tid=" + taskid + " AND moduleid=" + moduleId +  " AND username='" + username + "' AND user_id=" + userId, null);
        taskMasterCursor.moveToLast();
        int count = taskMasterCursor.getCount();
        if (count > 0) {
            String status = taskMasterCursor.getString(0);
            taskMasterCursor.close();
            return status;
        } else {
            taskMasterCursor.close();
            return "";
        }
    }

    public static boolean isAttendanceDone(@NonNull SQLiteDatabase database, int moduleId, String moduleName, String username, String userId, String notiflag) {// notiflag olny 1 or 2
        Cursor taskMasterCursor = null;
        try{
            taskMasterCursor = database
                    .rawQuery("SELECT tid, millisecond FROM task_master WHERE moduleid=" + moduleId + " AND username='" + username + "' AND user_id=" + userId
                            , null);
            taskMasterCursor.moveToLast();
            int count = taskMasterCursor.getCount();
            if (count > 0) {
                String tid = taskMasterCursor.getString(0);
                String millisecond = taskMasterCursor.getString(1);
                taskMasterCursor.close();
                String todayDate = convertDate(String.valueOf(System.currentTimeMillis()), dataFormatTaskCheck);
                String taskFiledData = convertDate(String.valueOf(millisecond), dataFormatTaskCheck);
                return todayDate.equalsIgnoreCase(taskFiledData);
            } else {
                taskMasterCursor.close();
                return false;
            }
        }
        catch (Exception e)
        {
            taskMasterCursor.close();
            return false;
        }
     
      
    }
    public static int getTripRuningOrnot(@NonNull SQLiteDatabase database, String taskid) {
        Cursor taskMasterCursor = database
                .rawQuery("select * from lat_plug where trip_status = 0"  , null);
        taskMasterCursor.moveToLast();

         int count = taskMasterCursor.getCount();

        taskMasterCursor.close();
            return count;

    }

}
