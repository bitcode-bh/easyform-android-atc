package com.sky.atc.easyformse;

import static com.sky.atc.easyformse.DeviceEventsUtils.VideoSizeConverter;
import static com.sky.atc.easyformse.sqlitewraper.context;

import android.annotation.SuppressLint;
import android.app.ActivityManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.widget.Toast;

import androidx.core.app.NotificationCompat;

import com.commonsware.cwac.wakeful.WakefulIntentService;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.upload.UploadLogDeleteUtils;
import com.sky.atc.easyformse.upload.UploadUtils;
import com.sky.atc.easyformse.utils.LogUtils;
import com.sky.atc.easyformse.utils.Utils;

import net.sqlcipher.database.SQLiteDatabase;

import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.client.ClientProtocolException;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.mime.MultipartEntity;
import org.apache.http.entity.mime.content.ByteArrayBody;
import org.apache.http.entity.mime.content.FileBody;
import org.apache.http.entity.mime.content.StringBody;
import org.apache.http.impl.client.DefaultHttpClient;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.RandomAccessFile;
import java.text.DecimalFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

import javax.net.ssl.HttpsURLConnection;

import io.michaelrocks.paranoid.Obfuscate;

import static com.sky.atc.easyformse.DeviceEventsUtils.VideoSizeConverter;
import static com.sky.atc.easyformse.sqlitewraper.context;

/**
 * updated by NareshChocha on 11/03/2022.
 *
 * @author NareshChocha
 */
//UPLOAD SERVICE
@Obfuscate
public class f_upload_new_structure extends WakefulIntentService {


    //for WCFURL
    private static final String WCFURL = sqlitewraper.context.getResources().getString(R.string.UPLOADWCFURL);
    private static final String METHOD_NAME_corner = "WCF_InsertQuestionMaster_Log_EF_1_0_0_0";
    //    private static final String METHOD_NAME_corner2 = "WCF_upload_technician_data_EF_0_4_0_0";
    private static final String METHOD_NAME_corner2 = "WCFTechnicianDataUpload";
    //    private static final String METHOD_NAME_corner3 = "Insert_Task_Master_And_Task_Sub_Master_Using_Mobile";
    private static final String METHOD_NAME_corner3 = "InsertUpdateDelete_MainAndSub_Task";
    private static final String METHOD_NAME_corner4 = "WCF_Insert_Update_Delete_Punch_Master";

    // upload still violation entry
     private static final String METHOD_NAME_corner13 = "Insert_Device_Event_Master";

    // for status change comment
    private static final String METHOD_NAME_corner7 = "WCF_Mobile_Notification_Master";
    // for get status name
    private static final String METHOD_NAME_corner8 = "WCF_Get_ddl_Data";


    //for Fake Location Entry
    private static final String NAMESPACE6 = "http://tempuri.org/";
    private static final String METHOD_NAME_corner6 = "Wcf_FakeLocationTracker";
    private static NotificationChannel mChannel = null;
    private static String CHANNEL_ID = "my_channel_01";

    TripUploadNew tripUploadNew;
    SQLiteDatabase database;
    com.sky.atc.easyformse.NewWebservicesCallEasyform NewWebservicesCallEasyform;



    Cursor c;
    Cursor c_sub;
    int p_f, f_f;

    int  bufferSize;
    String name_file;
    int ch_number, track_chnumber;
    double track_byte_g;
    double track_bytes;
    int track_offset = 0;
    int offset = 0;
    String Message_s = null;
    ArrayList<String> steparray = new ArrayList<>();
     // not using so comments
    // ArrayList<String> logsteparray = new ArrayList<>();
    ArrayList<String> deletesubjsonArray = new ArrayList<>();
    JSONArray jsonArray = new JSONArray();
     // not using so comments
    // JSONArray logjsonArray = new JSONArray();
    JSONArray deletesublogjsonArray = new JSONArray();
    HashMap<Integer, JSONArray> meMap = new HashMap<>();
    int tidcnt;
    int tidcntlog;
    int deletetidcntlog;
    int deletetidcntlog1;
    int isphotodel = 0;
     // not using so comments
    // int islogdel = 0;
    int isvideodel = 0;
    B_new b;
    private String  ph_id;
     String status1 = null;
     private static SharedPreferences sharedPreferences= sqlitewraper.context.getSharedPreferences("LogWrite",0);

    public f_upload_new_structure() {
        super("fupload_off_easyform");
        // TODO Auto-generated constructor stub
    }

    @Override
    protected void doWakefulWork(Intent arg0) {
        LogUtils.writeUploadLogToFile("INTERNET_FLAG :" + sqlitewraper.internetflag,"", "f_upload_new_structure");
        Log.d("####INTERNET_FLAG", String.valueOf(sqlitewraper.internetflag));
        if (sqlitewraper.internetflag == 1) {

            //upload if there is any FCM data upload to pending
            fcmDataUpload();

            generateNotification(5, null, 0, 0);

            database = sqlitewraper.getDatabase();
            NewWebservicesCallEasyform = new NewWebservicesCallEasyform();

            b = new B_new();

            //task create upload
            int ser_data = upload_task();

            //fake location upload
            int location_flag = upload_fakelocation();

            //pending Geofence upload
            int geofenceupload = GeofenceDownlaod.uploadGeofenceTracking();

            // upload still violation events 27-12-2023
            UploadStillViolation();

            //MAINTASK/SUBTASK UPLOAD START FROM HERE
            c = database
                    .rawQuery(
                            "select tid,siteid,checksheetid,height,tower_type,server_task_id,status,step,millisecond,edit_flag from task_master where ((server_task_id !='0' and (p_tid is null or p_tid is 'null' or p_tid is '')) or (p_server_task_id is not null and p_tid is not null and server_task_id!='0')) and flag='1'",
                            null);
            c.moveToFirst();
            int count = c.getCount();
            if (c.getCount() > 0) {
                for (int i = 0; i < c.getCount(); i++) {
                    try {
                        int tid = c.getInt(0);

                        generateNotification(4, String.valueOf(tid), c.getCount(), i + 1);

                        //take sub task of selected task
                        c_sub = database
                                .rawQuery(
                                        "select tid,siteid,checksheetid,height,tower_type,server_task_id,status,step,millisecond,edit_flag from task_master where ((p_server_task_id is not null and p_tid is not null and server_task_id!='0')) and flag='1' and p_tid=" + tid + " ",
                                        null);
                        c_sub.moveToFirst();

                        for (int j = 0; j < c_sub.getCount(); j++) {
                            try {
                                int tid_sub = c_sub.getInt(0);
                                String siteid = c_sub.getString(1);
                                int checksheetid = c_sub.getInt(2);
                                // not using so comments
                               // float height = (float) c_sub.getDouble(3);
                               // String tower_type = c_sub.getString(4);
                                int server_task_id = c_sub.getInt(5);
                                int status = c_sub.getInt(6);
                                int step = c_sub.getInt(7);
                                String task_milli = c_sub.getString(8);
                                String editFlag = c_sub.getString(9);
                                upload_task_master(tid_sub, server_task_id, siteid, checksheetid, step, status,
                                        task_milli, editFlag);

                            } catch (Exception e) {

                                LogUtils.writeUploadLogToFile(e.getMessage(), "","UPLOAD_TASK_SUB");

                            }
                            c_sub.moveToNext();

                        }

                        cursorClose(c_sub);

                        //parent task upload

                        c_sub = database
                                .rawQuery(
                                        "select tid,siteid,checksheetid,height,tower_type,server_task_id,status,step,millisecond from task_master where   flag='1' and p_tid=" + tid + " ",
                                        null);
                        c_sub.moveToFirst();


                        if (c_sub.getCount() == 0) {


                            try {
                                int tid_sub = c.getInt(0);
                                String siteid = c.getString(1);
                                int checksheetid = c.getInt(2);
                                // not using so comments
                                /* float height = (float) c.getDouble(3);
                                String tower_type = c.getString(4); */
                                int server_task_id = c.getInt(5);
                                int status = c.getInt(6);
                                int step = c.getInt(7);
                                String task_milli = c.getString(8);
                                String edtiFlag = c.getString(9);
                                upload_task_master(tid_sub, server_task_id, siteid, checksheetid, step, status, task_milli, edtiFlag);
                            } catch (Exception e) {
                                e.printStackTrace();
                                LogUtils.writeUploadLogToFile(e.getMessage(),"" ,"UPLOAD_TASK_MAIN");

                            }
                            cursorClose(c_sub);
                        }

                    } catch (Exception e) {
                        LogUtils.writeUploadLogToFile(e.toString(),"","f_upload_new_structure");
                        ////e.printStackTrace()();
                    }
                    c.moveToNext();
                }
            }
            cursorClose(c);
            //CHECK IF THERE ANY PENDING TASK
            check_f_and_p_master();
            generateNotification(7, null, 0, 0);
            // upload_path();
        }
    }

    public int upload_fakelocation() {

        int k = 0;
        Cursor c = database
                .rawQuery(
                        "select username,user_id,appid,appversion,milliseonds,id from fake_location where flag='0'", null);

        c.moveToFirst();
        int j = c.getCount();
        for (int i = 0; i < c.getCount(); i++) {
            try {
                String username = c.getString(0);
                String user_id = c.getString(1);
                String appid = c.getString(2);
                String appversion = c.getString(3);
                String milliseonds = c.getString(4);
                int id = c.getInt(5);

                // not using so comments
                // SoapObject data = new SoapObject(NAMESPACE6, METHOD_NAME_corner6);

                JSONObject data2 = new JSONObject();
                data2.put("username", username);
                data2.put("user_id", user_id);
                data2.put("appid", appid);
                data2.put("appversion", appversion);
                data2.put("milliseconds", milliseonds);

                String restext = NewWebservicesCallEasyform.ExecuteNetworkHTTPPostRequestfile(data2, WCFURL, METHOD_NAME_corner6, data2);
                JSONArray jsonArray = new JSONArray(restext);

                Log.d("##FAKE_LOCATION", restext);

                for (int k1 = 0; k1 < jsonArray.length(); k1++) {
                    JSONObject jsonObject = jsonArray.getJSONObject(0);
                    String status = jsonObject.getString("status");
                    if (status.equalsIgnoreCase("1")) {
                        update_fakelocation(id);
                    } else {
                        LogUtils.writeUploadLogToFile("server response: "+jsonArray.toString(), METHOD_NAME_corner6,"upload_fakelocation ");
                        k++;
                    }
                }
            } catch (final Exception e) {
                k++;

            }
            c.moveToNext();
        }
        cursorClose(c);
        return k;
    }

    public void update_fakelocation(int id) {
        String t1;
        t1 = "id=" + id;
        ContentValues v = new ContentValues();
        v.put("flag", "1");
        long temp = database.update("fake_location", v, t1, null);
        temp++;
    }


    void upload_task_master(int tid, int server_task_id, String siteid, int checksheetid, int step, int status, String task_milli, String editFlag) throws Exception {
        int p_flag, f_flag, v_flag, punch_flag;
        p_f = 0;
        f_f = 0;

        Cursor taskCursor = database.rawQuery(
                "select * from task_master where flag='1' and tid=" + tid + "", null);
        taskCursor.moveToLast();

        int taskcount = taskCursor.getCount();

        cursorClose(taskCursor);

        if (taskcount > 0) {


            update_task_hist(tid, server_task_id);
            Cursor c3 = database.rawQuery(
                    "SELECT username,u_c,appid,devicetype,appversion FROM Login_Master", null);
            c3.moveToLast();
            String username = c3.getString(0);
            //		String u_c = c3.getString(1);
            B_new b = new B_new();
            String u_c = b.GetValue();
            String appid = c3.getString(2);

            String devicetype = c3.getString(3);
            String appversion = c3.getString(4);


            cursorClose(c3);


            //Upload files
            f_flag = upload_files(tid, username, u_c,
                    server_task_id, appid, devicetype, appversion);

            //check if photo or video is deleted by User
            videoPhotoDelete(tid);

            //upload photo
            p_flag = upload_photo(tid, siteid, checksheetid, step,
                    server_task_id, username, u_c, appid, devicetype, appversion);

            //upload video
            v_flag = upload_video(tid, siteid, checksheetid, step,
                    server_task_id, username, u_c, appid, devicetype, appversion);
            //upload punch master
            punch_flag = upload_punch(tid, username, u_c,
                    server_task_id, appid, devicetype, appversion);

            //upload trip
            int tripflag = uploadTrip(tid);

            // Technician entry to the server
            if (p_flag == 0 && f_flag == 0 && v_flag == 0 && punch_flag == 0 && tripflag == 0) {


                Cursor f_data = database
                        .rawQuery(
                                "select fid,f_name,f_data,f_key,f_value,f_type,c_type,millisecond from f_master where flag='0' and  tid='"
                                        + tid + "'", null);

                f_data.moveToFirst();
                int ch = 0;

                if (f_data.getCount() == 0) {

                    // ----------task_master_history------//
                    ch = check_upload_taskhistory(tid, editFlag);

                    // ----------task_master_history------//

                    if (ch == 1) {

                        Cursor c_comp = database.rawQuery(
                                "select * from task_master_history where tid="
                                        + tid, null);
                        c_comp.moveToFirst();
                        int comp = c_comp.getCount();

                        cursorClose(c_comp);
                        Cursor c2 = database.rawQuery(
                                "select *  from task_master_history where flag='2' and tid="
                                        + tid, null);
                        c2.moveToFirst();
                        int comp_to = c2.getCount();

                        cursorClose(c2);

                        if (comp == comp_to) {
                            update_task_flag(tid, status, task_milli);
                            // c.moveToNext();

                        }
                    }
                }
                cursorClose(f_data);
            }
        }
    }

    private int uploadTrip(int tid) {

        Log.d("##uploadTrip", String.valueOf(tid));

        tripUploadNew = new TripUploadNew();
        String unique_trip_id = "";
        MySharedPreferences prefs = sqlitewraper.getSecureShared("MY_TRIP");
        String restoredText = prefs.getString("tid", null);
        if (restoredText != null) {
            unique_trip_id = prefs.getString("unique_trip_id", "");//"No name defined" is the default value.
        }

        int k = 0;
        Cursor c = database
                .rawQuery(
                        "select s_lat,s_lon,llat,llon,min_milli,max_milli,_id,way_point,isshort,isacc,isdv_eve,iseve from lat_plug where issend=0 and sid!=0 and trip_shflag=1 and tid='" + tid + "'", null);
        c.moveToFirst();
        int j = c.getCount();
        Log.d("##uploadTripcount", String.valueOf(j));

        if (j > 0) {
            for (int i = 0; i < c.getCount(); i++) {

                try {

                    generateNotification(8, null, j, i + 1);

                    String slat = c.getString(0);
                    String slon = c.getString(1);
                    String llat = c.getString(2);
                    String llon = c.getString(3);
                    String min_milli = c.getString(4);
                    String max_milli = c.getString(5);
                    int _id = c.getInt(6);
                    String way_point = c.getString(7);
                    String isshort = c.getString(8);
                    String isacc = c.getString(9);
                    String isdv_eve = c.getString(10);
                    String iseve = c.getString(11);


                    //shortest Path
                    //Temporary not used (Shortest path is passed as NA)
                    if (!isshort.equalsIgnoreCase("1")) {
                        tripUploadNew.shortestPathNew(slat, slon, llat, llon, String.valueOf(tid), _id, min_milli, max_milli, way_point);
                    }
                    //Actual Path
                    if (!isacc.equalsIgnoreCase("1")) {
                        tripUploadNew.actualPathNew(slat, slon, llat, llon, tid, min_milli, max_milli, _id);
                    }
                    //Device Events
                    if (!isdv_eve.equalsIgnoreCase("1")) {
                        tripUploadNew.device_event(_id, min_milli, max_milli);
                    }
                    //Events like speed acc deacc
                    if (!iseve.equalsIgnoreCase("1")) {
                        tripUploadNew.event(_id, min_milli, max_milli);
                    }

                    k = tripUploadNew.uploadTrip(tid);

                } catch (Exception e) {
                    k++;
                    LogUtils.writeUploadLogToFile(e.getMessage(), "","FUPLOAD_TRIP");
                    // e.printStackTrace();
                }
                c.moveToNext();
            }

        }
        c.close();

        Cursor c2 = database
                .rawQuery(
                        "select s_lat,s_lon,llat,llon from lat_plug where issend=0 and sid!=0 and trip_shflag=1 and tid='" + tid + "'", null);
        c2.moveToFirst();
        int j2 = c2.getCount();
        if (j2 > 0) {
            k++;
        }
        c2.close();
        return k;
    }

    public int upload_task() {
        int upload_task = 0;
        try {
            // need to change
            c = database
                    .rawQuery(
                            "select tid,checksheetid,step,username,server_task_id,status,millisecond,moduledef,p_server_task_id,initialstatus,lat,long,match_temp_id,p_match_temp_id from task_master where ((server_task_id='0' and p_tid is null or p_tid is 'null' or p_tid is '' and is_online != 1) or (p_server_task_id is not null and p_tid is not null and server_task_id='0' and is_online != 1) ) ",
                            null);
            c.moveToFirst();
            int count = c.getCount();
            if (c.getCount() > 0) {
                for (int i = 0; i < c.getCount(); i++) {
                    // not using so comments
                    // int p_flag, f_flag;
                    p_f = 0;
                    f_f = 0;
                    int tid = c.getInt(0);
                    int checksheetid = c.getInt(1);

                    int step = c.getInt(2);
                    String username = c.getString(3);
                    int server_task_id = c.getInt(4);
                    int status = c.getInt(5);
                    String millisecond = c.getString(6);
                    // not using so comments
                    //String moduledef = c.getString(7);
                    int p_server_task_id = c.getInt(8);
                    // not using so comments
                    // String initialstatus = c.getString(9);
                    String lat = c.getString(10);
                    String lng = c.getString(11);
                    String matchKeyId = c.getString(12);
                    String pmatchKeyId = c.getString(13);


                    if (username.equalsIgnoreCase("")) {

                        Cursor cuser = database.rawQuery(
                                "SELECT username,appid FROM Login_Master", null);

                        int count2 = cuser.getCount();
                        cuser.moveToLast();
                        username = cuser.getString(0);

                    }

                    Cursor cuser = database.rawQuery(
                            "SELECT f_data FROM f_master where c_type = 5 and tid =" + tid, null);

                    int count2 = cuser.getCount();
                    cuser.moveToLast();
                    String f_data = cuser.getString(0);

                    JSONArray jsonArray2 = new JSONArray(f_data);
                    JSONObject jsonObject1 = jsonArray2.getJSONObject(0);
                    String data = jsonObject1.getString("data");

                    cuser.close();

                    JSONArray j = new JSONArray(data);
                    Cursor c3 = database.rawQuery(
                            "SELECT username,company_id,appid,devicetype,appversion FROM Login_Master", null);
                    int count4 = c3.getCount();

                    c3.moveToLast();
                    // not using so comments
                    // String username1 = c3.getString(0);
                    B_new b = new B_new();
                    String u_c = b.GetValue();
                    int company_id = c3.getInt(1);
                    String appid = c3.getString(2);

                    String devicetype = c3.getString(3);
                    String appversion = c3.getString(4);

                    cursorClose(c3);

                    //utc
                    ArrayList<String> utcmi = new ArrayList<>();
                    utcmi = utcCalculationOffset(millisecond);
                    String timezone = utcmi.get(1);
                    String utcmilliseconds = utcmi.get(0);
                    database = sqlitewraper.getDatabase();


                    Cursor c4 = database.rawQuery(
                            "SELECT status,step FROM task_master where tid="
                                    + tid, null);
                    c4.moveToLast();
                    status = c4.getInt(0);
                    step = c4.getInt(1);
                    c4.close();

                    JSONObject data1 = new JSONObject();
                    data1.put("checksheet_id", checksheetid);
                    data1.put("StepNo", step);
                    data1.put("Company_id", company_id);
                    data1.put("check_type", checksheetid);
                    data1.put("createby", 0);
                    data1.put("UpdatedBy", 0);
                    data1.put("data", j);
                    data1.put("status", status);
                    data1.put("server_task_id", server_task_id);
                    data1.put("p_server_task_id", p_server_task_id);

                    data1.put("Millisecond", millisecond);
                    data1.put("utcmilliseconds", utcmilliseconds);
                    data1.put("timezone", timezone);
                    data1.put("appid", appid);
                    data1.put("mpkey", tid);
                    data1.put("lat", lat);
                    data1.put("lang", lng);
                    data1.put("call_type", "mobile");
                    data1.put("p_match_temp_id", pmatchKeyId);

                    JSONObject data2 = new JSONObject();
                    data2.put("username", username);
                    data2.put("u_c", u_c);
                    data2.put("appid", appid + "_" + tid);


                    data2.put("devicetype", devicetype);
                    data2.put("appversion", appversion);


                    String u_c1 = b.GetValue();

                    if (!u_c1.equalsIgnoreCase("NA")) {

                        String restext = com.sky.atc.easyformse.NewWebservicesCallEasyform.ExecuteNetworkHTTPPostRequestFilesAndPhotoUpload(data1, WCFURL, METHOD_NAME_corner3, matchKeyId, null);
                        JSONArray jsonArray = new JSONArray(restext);

                        String status1 = null;
                        JSONObject jsonObject = null;
                        String message = "You Are Logout!";
                        int Server_task_id = 0;
                        for (int k1 = 0; k1 < jsonArray.length(); k1++) {
                            jsonObject = jsonArray.getJSONObject(0);
                            status1 = jsonObject.getString("status");
                            Server_task_id = jsonObject.getInt("Server_task_id");
                            if (jsonObject.has("message")) {
                                message = jsonObject.getString("message");
                            }
                        }

                        //Pending to (Frontend)
                        try {
                            String t;
                            t = "tid='" + tid + "'";
                            ContentValues t_i = new ContentValues();
                            t_i.put("response_status", status1);
                            long task = database.update("task_master", t_i, t,
                                    null);
                        } catch (Exception e) {
                            e.printStackTrace();
                        }

                        if (status1.equalsIgnoreCase("1")) {
                            {
                                String t;
                                t = "tid='" + tid + "'";
                                ContentValues t_i = new ContentValues();
                                t_i.put("server_task_id", Server_task_id);
                                long task = database.update("task_master", t_i, t,
                                        null);

                                Cursor cuser2 = database.rawQuery(
                                        "SELECT sid FROM lat_plug", null);

                                if (cuser2.getCount() > 0) {
                                    cuser2.moveToLast();
                                    String sidlat = cuser2.getString(0);
                                    cuser2.close();

                                    //Need to change the logic from TID
                                    if (sidlat.equalsIgnoreCase("0")) {
                                        ContentValues t_i2 = new ContentValues();
                                        t_i2.put("sid", Server_task_id);
                                        long task2 = database.update("lat_plug", t_i2, t,
                                                null);
                                        Log.d("##LatplugUpdateF", String.valueOf(task2) + " SID: " + Server_task_id);
                                    }
                                }
                            }

                        } else if (status1.equalsIgnoreCase("4")) {
                            Utils.logoutUser(message);
                        }
                        //Invalid Log - Validation Error
                        else if (status1.equalsIgnoreCase("11")) {

                            if (jsonObject != null) {
                                String dataKEy = jsonObject.getString("data");
                                UploadUtils.isValidLog(tid, dataKEy, String.valueOf(checksheetid), "1");
                            }

                        } else {
                            LogUtils.writeUploadLogToFile("Status: " + status1, METHOD_NAME_corner3, "Upload Task");
                        }
                        c.moveToNext();

                    } else {

                        upload_task++;
                    }
                }

            }
            c.close();
        } catch (Exception e) {
            upload_task++;
            LogUtils.writeUploadLogToFile(e.getMessage(), METHOD_NAME_corner3,"Upload Task");
        }
        //Update Parent server task id of newly uploaded task
        update_p_id();

//		check_f_and_p_master();
        return upload_task;

    }


    // ------------------------update_query----------------

    //CHECK IF THERE ANY PENDING TASK
    void check_f_and_p_master() {
        try {


            database.execSQL("update task_master set flag='1' where tid IN (select distinct task_master.tid from task_master inner join f_master on f_master.tid=task_master.tid where f_master.flag='0') and flag!=3");


            database.execSQL("update task_master set flag='1' where tid IN (select distinct p_tid  from task_master where p_tid is not null and flag=1) and flag!=3");


            database.execSQL("update task_master set flag='1'where tid IN(select distinct task_master.tid  from task_master inner join p_master on p_master.tid=task_master.tid where p_master.flag='0') and flag!=3");

            database.execSQL("update task_master set flag='1'where tid IN(select distinct task_master.tid  from task_master inner join video on video.tid=task_master.tid where video.issend_track='0') and flag!=3");

            database.execSQL("update task_master set flag='1'where tid IN(select distinct tid  from task_master_history where task_master_history.flag='1') and flag!=3");
            database.execSQL("update task_master set flag='1'where tid IN(select distinct tid  from  lat_plug where issend='0' and trip_shflag=1) and flag!=3");

        } catch (Exception e) {
            e.printStackTrace();
            // TODO: handle exception
        }
    }

    // -----------------update_task_new-----------------------//

    void update_task_flag(int tid, int status, String millisecond) {
        String t;
        t = "tid=" + tid + " and status=" + status + " and  millisecond=" + "'" +millisecond + "'";
        ContentValues t_i = new ContentValues();
        t_i.put("flag", 2);

        //-------is_photo_delete------//

        t_i.put("is_delete_photo", "");
        t_i.put("is_delete_log", "");
        t_i.put("is_delete_sub", "");
        t_i.put("edit_flag", "2");
        long task = database.update("task_master", t_i, t, null);


        System.out.print("sdsd");

        generateNotification(6, null, 0, 0);

    }

    // upload all files of current t_id which has flag 0
    public int upload_files(int tid, String username, String u_c,
                            int server_task_id, String appid, String devicetype, String appversion) {
        int k = 0;

        Cursor c = database
                .rawQuery(
                        "select fid,f_name,f_data,f_key,f_value,f_type,c_type,millisecond,match_temp_id,c_id,step from f_master where flag='0' and  tid='"
                                + tid + "'", null);

        c.moveToFirst();

        int j = c.getCount();
        for (int i = 0; i < c.getCount(); i++) {
            try {

                generateNotification(1, null, j, i + 1);

                int fid = c.getInt(0);
                // not using so comments
                // String f_name = c.getString(1);
                String f_data = c.getString(2);

                f_data = check_fdata(f_data);

                // not using so comments
                /*String f_key = c.getString(3);
                String f_value = c.getString(4);*/
                String f_type = c.getString(5);

                int c_type = c.getInt(6);
                String millisecond = c.getString(7);
                String matchKeyID = c.getString(8);
                String checksheetID = c.getString(9);
                String step = c.getString(10);

                ArrayList<String> utcmi = new ArrayList<>();
                utcmi = utcCalculationOffset(millisecond);
                String timezone = utcmi.get(1);
                String utcmilliseconds = utcmi.get(0);
                database = sqlitewraper.getDatabase();


                JSONObject data2 = new JSONObject();
                data2.put("username", username);
                data2.put("u_c", u_c);
                data2.put("appid", appid);
                data2.put("devicetype", devicetype);
                data2.put("appversion", appversion);
                JSONObject data1 = new JSONObject();
                data1.put("q_data", f_data);
                data1.put("utcmilliseconds", utcmilliseconds);
                data1.put("timezone", timezone);
                data1.put("c_type", c_type);
                data1.put("server_task_id", server_task_id);
                String btn_action;
                if(f_type.equalsIgnoreCase("") || f_type == null)
                {
                    btn_action = "go to";
                }
                else {
                    btn_action = f_type;
                }
                data1.put("btn_action", btn_action);
                String u_c1 = b.GetValue();

                if (!u_c1.equalsIgnoreCase("NA")) {

                    String resString = com.sky.atc.easyformse.NewWebservicesCallEasyform.ExecuteNetworkHTTPPostRequestFilesAndPhotoUpload(data1, WCFURL, METHOD_NAME_corner, matchKeyID, null);
                    JSONArray jsonArray = new JSONArray(resString);

                    for (int k1 = 0; k1 < jsonArray.length(); k1++) {
                        JSONObject jsonObject = jsonArray.getJSONObject(0);
                        String status = jsonObject.getString("status");
                        String message = "";
                        if (jsonObject.has("message")) {
                            message = jsonObject.getString("message");
                        }
                        if (status.equalsIgnoreCase("1")) {
                            update_fid(fid, "f_master", tid, millisecond);
                        } else if (status.equalsIgnoreCase("4")) {
                            Utils.logoutUser(message);
                        } else if (status.equalsIgnoreCase("11")) {
                            //validation Error - Invalid log
                            String dataKey = jsonObject.getString("data");
                            UploadUtils.isValidLog(tid, dataKey, checksheetID, step);
                        } else {
                            k++;
                            LogUtils.writeUploadLogToFile("Response : "+jsonArray.toString(),  METHOD_NAME_corner,"Upload File");
                        }
                    }
                } else {
                    k++;
                }
            } catch (final Exception e) {

//                new Handler(Looper.getMainLooper()).post(new Runnable() {
//                    public void run() {
//                        Toast toast = Toast.makeText(sqlitewraper.context, e.getMessage(), Toast.LENGTH_LONG);
//                        toast.show();
//                    }
//                });

                k++;
                ////e.printStackTrace()();
                LogUtils.writeUploadLogToFile(e.getMessage(), "","UPLOAD_FILES");
            }
            c.moveToNext();
        }
        cursorClose(c);
        return k;

    }

    //-----------------upload_punch information---------------------------//
    public int upload_punch(int tid, String username, String u_c, int server_task_id, String appid, String devicetype, String appversion) {
        int k = 0;
        Cursor c = database
                .rawQuery(
                        "select pnid,tid,millisecond,UTCmillisecond,username,userid,appid,lat,lon,gprs,gps,address,punch_flag,match_temp_id from punch_master where punch_upload_flag='0' and  tid='"
                                + tid + "'", null);

        c.moveToFirst();

        int j = c.getCount();
        for (int i = 0; i < c.getCount(); i++) {
            try {
                int pnid = c.getInt(0);
                // not using so comments
                // int tid_n = c.getInt(1);
                String millisecond = c.getString(2);
                String UTCmillisecond = c.getString(3);
                String username_n = c.getString(4);
                String userid = c.getString(5);
                String appid_n = c.getString(6);
                String lat = c.getString(7);
                String lon = c.getString(8);
                String gprs = c.getString(9);
                String gps = c.getString(10);
                String add = c.getString(11);
                String punch_flag = c.getString(12);
                String matchKeyID = c.getString(13);


                //utc

                ArrayList<String> utcmi = new ArrayList<>();
                utcmi = utcCalculationOffset(millisecond);
                String timezone = utcmi.get(1);
                String utcmilliseconds = utcmi.get(0);
                database = sqlitewraper.getDatabase();


                JSONObject data2 = new JSONObject();
                data2.put("username", username_n);
                data2.put("u_c", u_c);
                data2.put("millisecond", millisecond);

                data2.put("appid", appid_n);
                data2.put("userid", userid);
                data2.put("UTCmillisecond", UTCmillisecond);
                data2.put("lat", lat);
                data2.put("lon", lon);
                data2.put("gprs", gprs);
                data2.put("gps", gps);
                data2.put("add", add);
                data2.put("punch_flag", punch_flag);
                data2.put("server_task_id", server_task_id);
                data2.put("timezone", timezone);
                data2.put("utcmilliseconds", utcmilliseconds);
                data2.put("c_type", 0);


                JSONObject data1 = new JSONObject();
                data1.put("username", username);
                data1.put("u_c", u_c);
                data1.put("appid", appid);
                data1.put("userid", userid);

                data1.put("devicetype", devicetype);
                data1.put("appversion", appversion);


                String u_c1 = b.GetValue();


                if (!u_c1.equalsIgnoreCase("NA")) {

                    String resString = com.sky.atc.easyformse.NewWebservicesCallEasyform.ExecuteNetworkHTTPPostRequestFilesAndPhotoUpload(data2, WCFURL, METHOD_NAME_corner4, matchKeyID, null);

                    JSONArray jsonArray = new JSONArray(resString);

                    for (int k1 = 0; k1 < jsonArray.length(); k1++) {
                        JSONObject jsonObject = jsonArray.getJSONObject(0);
                        String status = jsonObject.getString("status");
                        final String msg = jsonObject.getString("message");
                        if (status.equalsIgnoreCase("1")) {
                            update_pnid(pnid, "punch_master", tid, millisecond);
                        } else if (status.equalsIgnoreCase("4")) {
                            Utils.logoutUser(msg);
                        } else {
                            k++;
                            new Handler(Looper.getMainLooper()).post(new Runnable() {
                                public void run() {
                                    Toast toast = Toast.makeText(sqlitewraper.context, msg, Toast.LENGTH_LONG);
                                    toast.show();
                                }
                            });
                            LogUtils.writeUploadLogToFile("Status: " +status+" ( "+msg + " )", METHOD_NAME_corner4,"Upload punch");
                        }
                    }
                } else {

                    k++;
                }
            } catch (final Exception e) {
                k++;
                LogUtils.writeUploadLogToFile(e.getMessage(), "","UPLOAD_PUNCH");
            }
            c.moveToNext();
        }
        cursorClose(c);
        return k;
    }
//----------update_punch_flag------------------------//


    // --------------------------------update
    // task_history------------------------------------
    void update_task_hist(int tid, int sid) {
        String t;
        t = "tid=" + tid;
        ContentValues t_i = new ContentValues();
        t_i.put("server_task_id", sid);
        long task = database.update("task_master_history", t_i, t, null);
        task++;

    }

    //Method for Checking video//
    public void videoPhotoDelete(int tid) {

        isPhotoDelete(tid);
        isVideoDelete(tid);

        ContentValues cv = new ContentValues();
        cv.put("is_delete_photo", String.valueOf(jsonArray));

        String t2 = "tid=" + tid;

        long temp = database.update(
                "task_master", cv, t2, null);
        temp++;


        //deleted photo update task_master database status
        //status revert logic
        if (isphotodel == 1 || isvideodel == 1) {

            try {

                Cursor c2 = database
                        .rawQuery("SELECT status FROM task_master_history WHERE tid='" + tid + "' ORDER BY tid_n desc LIMIT 1, 1", null);

                c2.moveToFirst();

                String status = "0";

                if (c2.getCount() > 0) {

                    status = c2.getString(0);

                } else {

                    Cursor c3 = database
                            .rawQuery("SELECT status FROM task_master_history WHERE tid='" + tid + "' ORDER BY tid_n desc LIMIT 0, 1", null);
                    c3.moveToFirst();

                    if (c3.getCount() > 0) {
                        status = c3.getString(0);
                    }

                    cursorClose(c3);
                }
                cursorClose(c2);

                String statustask = compareStatuswithTaskmaster(tid);

                if (statustask.equalsIgnoreCase(status)) {
                    status = "0";
                }

                DeviceEventsUtils.insert_task_master_revert("is_delete_photo", status, tid);

                ContentValues cv2 = new ContentValues();
                cv2.put("status", status);
//                cv2.put("flag", 3);
                String t3 = "tid='" + tid + "'";

                long temp2 = database.update(
                        "task_master", cv2, t3, null);
                temp++;

                parentStatusUpdate(tid);


            } catch (Exception e) {

                ////e.printStackTrace()();
            }
        }
    }


     // not using so comments
    /*public void technicianDeleteLog(String checkshhetid, String servertaksid, String stepno) {


        int tid = 0;
        try {

            Cursor c3 = database
                    .rawQuery(
                            "select tid from task_master where server_task_id='"
                                    + servertaksid + "' ", null);
            c3.moveToFirst();
            int k = c3.getCount();

            if (k > 0) {

                tid = c3.getInt(0);
            }

            c3.close();


            islogdel = 0;
            if (tidcntlog != tid) {

                tidcntlog = tid;
                logjsonArray = new JSONArray(new ArrayList<String>());
                logsteparray.clear();
            }


            JSONObject data1 = new JSONObject();

            Cursor c1 = database
                    .rawQuery(
                            "select c_name,c_type from checksheet where checksheetid='"
                                    + checkshhetid + "' ", null);

            c1.moveToFirst();

            String c_name = c1.getString(0);
            String c_type = c1.getString(1);
            islogdel = 1;
            c1.close();

            Cursor c2 = database
                    .rawQuery(
                            "select subcategory from checksheet where checksheetid='"
                                    + checkshhetid + "' and step='" + stepno + "' ", null);

            c2.moveToFirst();
            String chstep = c2.getString(0);
            c2.close();
            if (!logsteparray.contains(chstep)) {
                data1.put("c_name", c_name);
                data1.put("s_name", chstep);
                data1.put("checksheet_type", c_type);
                logjsonArray.put(data1);
                logsteparray.add(c_name);
                logsteparray.add(chstep);
            }

            ContentValues cv = new ContentValues();
            cv.put("is_delete_log", String.valueOf(logjsonArray));

            String t2 = "tid=" + tid;

            long temp = database.update(
                    "task_master", cv, t2, null);
            temp++;


            Cursor c4 = database
                    .rawQuery("SELECT status FROM task_master_history WHERE tid='" + tid + "' ORDER BY tid_n desc LIMIT 1, 1", null);

            c4.moveToFirst();

            String status = "0";

            if (c4.getCount() > 0) {

                status = c4.getString(0);

            } else {

                Cursor c5 = database
                        .rawQuery("SELECT status FROM task_master_history WHERE tid='" + tid + "' ORDER BY tid_n desc LIMIT 0, 1", null);
                c5.moveToFirst();

                if (c5.getCount() > 0) {
                    status = c5.getString(0);
                }

                cursorClose(c5);
            }

            cursorClose(c3);

            String statustask = compareStatuswithTaskmaster(tid);

            if (statustask.equalsIgnoreCase(status)) {
                status = "0";
            }

            DeviceEventsUtils.insert_task_master_revert("is_delete_log", status, tid);

            ContentValues cv2 = new ContentValues();
            cv2.put("status", status);
//            cv2.put("flag", 3);
            String t3 = "tid='" + tid + "'";

            long temp2 = database.update(
                    "task_master", cv2, t3, null);
            temp2++;

            parentStatusUpdate(tid);


        } catch (Exception e) {

            e.printStackTrace();
        }
//        c.moveToNext();
//        cursour_close(c);
    }*/

    //New Logic for Parent task satus update for deleted photos
    public void parentStatusUpdate(int tid) {

        JSONArray deletedmediaarray = null;

        Cursor cstatus = database
                .rawQuery(
                        "select p_tid,moduleid,module_name from task_master where ((server_task_id !='0' and p_tid is not null)) and tid='"
                                + tid + "' ", null);
        cstatus.moveToFirst();
        int j = cstatus.getCount();

        if (j > 0) {

            int pid = cstatus.getInt(0);
            String moduleid = cstatus.getString(1);
            String module_name = cstatus.getString(2);

            cstatus.close();

            Cursor cstatus1 = database
                    .rawQuery("SELECT status FROM task_master_history WHERE tid='" + pid + "' ORDER BY tid_n desc LIMIT 1, 1", null);

            cstatus1.moveToFirst();

            String status1 = "0";
            if (cstatus1.getCount() > 0) {
                status1 = cstatus1.getString(0);
            } else {

                Cursor c4 = database
                        .rawQuery("SELECT status FROM task_master_history WHERE tid='" + pid + "' ORDER BY tid_n desc LIMIT 0, 1", null);
                c4.moveToFirst();
                if (c4.getCount() > 0) {
                    status1 = c4.getString(0);
                }
                cursorClose(c4);
            }
            cursorClose(cstatus1);

            String statustask = compareStatuswithTaskmaster(pid);

            if (statustask.equalsIgnoreCase(status1)) {
                status1 = "0";
            }


            deletedmediaarray = deletedmedia(moduleid, module_name, pid);
            String value = String.valueOf(deletedmediaarray).replaceAll("\\\\", "");

            DeviceEventsUtils.insert_task_master_revert("is_delete_sub", status1, tid);

            ContentValues cv2 = new ContentValues();
            cv2.put("status", status1);
            cv2.put("flag", 3);
            cv2.put("is_delete_sub", value);
            String t3 = "tid='" + pid + "'";

            long temp3 = database.update(
                    "task_master", cv2, t3, null);


        } else {

            ContentValues cv3 = new ContentValues();
            cv3.put("flag", 3);
            String t4 = "tid='" + tid + "'";

            long temp3 = database.update(
                    "task_master", cv3, t4, null);
        }
    }

    //-----------Checking Video Deleted OR Not---------------//

    public void isVideoDelete(int tid) {

        isvideodel = 0;

        if (tidcnt != tid) {
            tidcnt = tid;
            jsonArray = new JSONArray(new ArrayList<String>());
            steparray.clear();
        }

        Cursor c = database
                .rawQuery(
                        "select or_path,step_No,checksheetid,que_id,que_name from video where issend_track='0' and  tid='"
                                + tid + "' ", null);
        c.moveToFirst();

        int j = c.getCount();
        for (int i = 0; i < c.getCount(); i++) {

            try {
                JSONObject data1 = new JSONObject();
                String p_url = c.getString(0);
                String p_key = c.getString(1);
                int p_checksheetid = c.getInt(2);
                int que_id = c.getInt(3);
                String que_name = c.getString(4);

                File file = new File(p_url);
                if (file.exists()) {

                    Log.d("File Exists", "File Available");

                } else {

                    Cursor c1 = database
                            .rawQuery(
                                    "select c_name,c_type from checksheet where checksheetid='"
                                            + p_checksheetid + "' ", null);
                    c1.moveToFirst();

                    String c_name = c1.getString(0);
                    String c_type = c1.getString(1);

                    isvideodel = 1;

                    c1.close();
                    Cursor c2 = database
                            .rawQuery(
                                    "select subcategory from checksheet where checksheetid='"
                                            + p_checksheetid + "' and step='" + p_key + "' ", null);
                    c2.moveToFirst();
                    String chstep = c2.getString(0);
                    c2.close();
                    if (!steparray.contains(chstep)) {
                        data1.put("c_name", c_name);
                        data1.put("s_name", chstep);
                        data1.put("checksheet_type", c_type);
                        data1.put("que_name", que_name);
                        data1.put("que_id", que_id);
                        jsonArray.put(data1);
                        steparray.add(c_name);
                        steparray.add(chstep);
                    }
                }
            } catch (Exception e) {

                ////e.printStackTrace()();
            }
            c.moveToNext();
            tidcnt = tid;
        }
        cursorClose(c);
    }
    //----------Checking Photo Deleted Or Not--------------//

    public void isPhotoDelete(int tid) {


        isphotodel = 0;

        if (tidcnt != tid) {

            tidcnt = tid;
            jsonArray = new JSONArray(new ArrayList<String>());
            steparray.clear();
        }


        Cursor c = database
                .rawQuery(
                        "select pid,p_name,p_url,p_key,p_value,p_type,it_id,que_id,checksheetid,millisecond,Ph_id,que_name from p_master where flag='0' and  tid='"
                                + tid + "' ", null);
        c.moveToFirst();

        int j = c.getCount();

        for (int i = 0; i < c.getCount(); i++) {
            try {

                JSONObject data1 = new JSONObject();

                // not using so comments
                /*int pid = c.getInt(0);
                String p_name = c.getString(1);*/
                String p_url = c.getString(2);
                String p_key = c.getString(3);
                // not using so comments
                /*String p_value = c.getString(4);
                String p_type = c.getString(5);
                String it_id = c.getString(6);*/
                int que_id = c.getInt(7);
                int p_checksheetid = c.getInt(8);
                String que_name = c.getString(11);


                File file = new File(p_url);
                if (file.exists()) {

                    Log.d("File Exists", "File Available");

                } else {


                    Cursor c1 = database
                            .rawQuery(
                                    "select c_name,c_type from checksheet where checksheetid='"
                                            + p_checksheetid + "' ", null);

                    c1.moveToFirst();

                    String c_name = c1.getString(0);
                    String c_type = c1.getString(1);
                    isphotodel = 1;
                    c1.close();

                    Cursor c2 = database
                            .rawQuery(
                                    "select subcategory from checksheet where checksheetid='"
                                            + p_checksheetid + "' and step='" + p_key + "' ", null);

                    c2.moveToFirst();
                    String chstep = c2.getString(0);
                    c2.close();
                    if (!steparray.contains(chstep)) {
                        data1.put("c_name", c_name);
                        data1.put("s_name", chstep);
                        data1.put("checksheet_type", c_type);
                        data1.put("que_name", que_name);
                        data1.put("que_id", que_id);
                        jsonArray.put(data1);
                        steparray.add(c_name);
                        steparray.add(chstep);
                    }
                }
            } catch (Exception e) {

                ////e.printStackTrace()();
            }
            c.moveToNext();

        }
        cursorClose(c);
    }

    // upload all photos of current t_id which has flag 0
    public int upload_photo(int tid, String siteid, int checksheetid, int step,
                            int server_task_id, String username, String u_c, String appid, String devicetype, String appversion) {


        int k = 0;
        int pid = 0;
        String millisecond;
        Cursor c = database
                .rawQuery(
                        "select pid,p_name,p_url,p_key,p_value,p_type,it_id,que_id,checksheetid,millisecond,Ph_id,match_temp_id from p_master where flag='0' and  tid='"
                                + tid + "' ", null);
        c.moveToFirst();
        int j = c.getCount();
        for (int i = 0; i < c.getCount(); i++) {
            try {

                generateNotification(2, null, j, i + 1);
                pid = c.getInt(0);
                String p_name = c.getString(1);
                String p_url = c.getString(2);
                // not using so comments
                /*String p_key = c.getString(3);
                String p_value = c.getString(4);*/
                String p_type = c.getString(5);
                String it_id = c.getString(6);
                int que_id = c.getInt(7);
                int p_checksheetid = c.getInt(8);
                millisecond = c.getString(9);
                ph_id = c.getString(10);
                // not using so comments
                // String matchKeyID = c.getString(11);

                File file = new File(p_url);
                long length = file.length() / 1024;

                if (length > 1024) {
                    p_url = UploadUtils.compressImage(p_url);
                    Log.d("##IMGRESIZE", p_url);
                }

                String s_pname = p_name + ".jpg";

                File imageFile;

                if (p_type.equalsIgnoreCase("png")) {
                    imageFile = new File(p_url);

                    String p_name1 = p_url
                            .substring(p_url.lastIndexOf("/") + 1);

                    p_name1.charAt(0);

                } else {
                    String p_name1 = p_url
                            .substring(p_url.lastIndexOf("/") + 1);
                    imageFile = new File(p_url);

                }

                BitmapFactory.Options options = new BitmapFactory.Options();
                options.inInputShareable = true;
                options.inPurgeable = true;


                ArrayList<String> utcmi = new ArrayList<>();
                utcmi = utcCalculationOffset(millisecond);
                String timezone = utcmi.get(1);
                String utcmilliseconds = utcmi.get(0);
                database = sqlitewraper.getDatabase();


                FileInputStream fis = new FileInputStream(imageFile);
                Bitmap bitmap = BitmapFactory.decodeFileDescriptor(fis.getFD(),
                        null, options);
                ByteArrayOutputStream stream = new ByteArrayOutputStream();
                bitmap.compress(Bitmap.CompressFormat.JPEG, 90, stream);
                byte[] image = stream.toByteArray();
                String img_str = Base64.encodeBytes(image);

                JSONObject data1 = new JSONObject();
                data1.put("siteid", siteid);
                data1.put("stepid", step);
                data1.put("ques_id", que_id);
                data1.put("servertaskid", server_task_id);
                data1.put("inspectioncounter", 1);
                data1.put("check_type", p_checksheetid);
                data1.put("fileName", s_pname);
                data1.put("buffer", img_str);
                data1.put("Ph_id", ph_id);
                data1.put("it_id", it_id);
                data1.put("timezone", timezone);
                data1.put("utcmilliseconds", utcmilliseconds);

                JSONObject data2 = new JSONObject();
                data2.put("username", username);
                data2.put("u_c", u_c);
                data2.put("appid", appid);


                String u_c1 = b.GetValue();

                if (!u_c1.equalsIgnoreCase("NA")) {


                    //WCF PHOTO UPLOAD

//                    String resString = com.sky.atc.easyformse.NewWebservicesCallEasyform.ExecuteNetworkHTTPPostRequestFilesAndPhotoUpload(data1, WCFURL, METHOD_NAME_corner1, matchKeyID,null);
//
//                    JSONArray jsonArray = new JSONArray(resString);
//
//                    for (int k1 = 0; k1 < jsonArray.length(); k1++) {
//                        JSONObject jsonObject = jsonArray.getJSONObject(0);
//                        String status = jsonObject.getString("status");
//                        if (status.equalsIgnoreCase("1")) {
//                            generateNotification(2, null, j, i);
//                            update_pid(pid, "p_master", tid, millisecond);
//                        } else {
//                            k++;
//                            LogUtils.writeUploadLogToFile(status, METHOD_NAME_corner1);
//                        }
//                        // c.moveToNext();
//                    }

                    //RESUMABLE PHOTO UPLOAD

                    Cursor check = database
                            .rawQuery(
                                    "select server_task_id from task_master where  tid='" + tid + "'", null);
                    check.moveToFirst();
                    String sId = "";

                    if (check.getCount() > 0) {
                        sId = check.getString(0);
                    }
                    cursorClose(check);

                    String companyID = DeviceEventsUtils.getLoginDetails().get(4);

                    Log.d("##PHOTO_URL", "PHOTO PATH: " + p_url + " SIZEKB: " + length + " SID: " + sId);

                    //upload photo with resumable
                    int photoId = UploadUtils.uploadPhotoResumable(p_url, companyID, "0", String.valueOf(p_checksheetid), String.valueOf(que_id), String.valueOf(step), p_type, ph_id, it_id, p_url, sId);

                    if (photoId > 0) {
                        generateNotification(2, null, j, i);
                        update_pid(pid, "p_master", tid, millisecond);
                    } else {
                        k++;
                        LogUtils.writeUploadLogToFile("UPLOAD_FAILED:","" ,"PHOTO_UPLOAD_RESUMABLE");
                    }

                } else {

                    k++;
                }
            } catch (Exception e) {

                if (e instanceof FileNotFoundException) {
                    k++;

                } else {
                    k++;

                }
            }
            c.moveToNext();
        }

        cursorClose(c);
        return k;
    }

    // ----------check and upload taskhistory
    // (technician)-----------------------//

    int check_upload_taskhistory(int tid, String editFlag) throws Exception {

        int k = -1;

        int comp_count;
        Cursor c1 = database
                .rawQuery(
                        "select tid,siteid,checksheetid,height,tower_type,server_task_id,status,step,moduledef,global_var,tid_n,moduleid,millisecond,punch_flag,in_ms,out_ms,duration,match_temp_id,role_id,old_status from task_master_history where flag='1' and tid="
                                + tid, null);
        c1.moveToFirst();
        comp_count = c1.getCount();

        if (c1.getCount() > 0) {
            for (int i = 0; i < c1.getCount(); i++) {
                int tid_n = c1.getInt(0);
                // tid_n = tid;
                String siteid = c1.getString(1);
                int checksheetid = c1.getInt(2);
                float height = (float) c1.getDouble(3);
                String tower_type = c1.getString(4);
                int server_task_id = c1.getInt(5);
                int status = c1.getInt(6);
                int step = c1.getInt(7);
                String moduledef = c1.getString(8);
                String global_var = c1.getString(9);
                int tid_new = c1.getInt(10);
                String moduleid = c1.getString(11);
                String millisecond = c1.getString(12);


                //-----------punch----------//

                String punchFlag = c1.getString(13);
                String inMs = c1.getString(14);
                String outMs = c1.getString(15);
                String durationPunch = c1.getString(16);
                String matchKeyId = c1.getString(17);
                String roleID = c1.getString(18);
                String old_status = c1.getString(19);

                int f_count = query_p_f_master("f_master", tid, millisecond);
                int p_count = query_p_f_master("p_master", tid, millisecond);
                if (f_count == 0 && p_count == 0) {

                    String restext = upload_task_history(tid_n, siteid,
                            checksheetid, height, tower_type, server_task_id,
                            status, step, moduledef, global_var, "task2", tid_new,
                            moduleid, punchFlag, inMs, outMs, durationPunch, millisecond, editFlag, matchKeyId, roleID, old_status);

                    boolean isSuccess = update_history(tid_new, restext, millisecond, old_status, tid);
                    if (k != 0) {
                        k = 1;
                    }

                    if (!isSuccess) {
                        k = 0;
                        break;
                    }

                } else {
                    k = 0;

                }
                c1.moveToNext();

            }
        } else {
            k = 1;
        }
        cursorClose(c1);
        return k;
    }

    // ----------------------update_task_history------------------------------------//

    boolean update_history(int tid_new, String restext, String millisecond, String oldStatus, int t_id) throws JSONException {

        boolean isSuccess;

        JSONArray jsonArray = new JSONArray(restext);

        JSONObject jsonObject = null;

        for (int k1 = 0; k1 < jsonArray.length(); k1++) {
            jsonObject = jsonArray.getJSONObject(0);
            status1 = jsonObject.getString("status");
            Message_s = jsonObject.getString("message");

        }
        if (status1.equalsIgnoreCase("1")) {
            {
                isSuccess = true;

                String t;
                t = "tid_n='" + tid_new + "' and  millisecond=" + millisecond;
                ContentValues t_i = new ContentValues();
                t_i.put("flag", 2);
                long task = database
                        .update("task_master_history", t_i, t, null);

                String t1;
                t = "tid_n=" + tid_new;
                ContentValues t_i1 = new ContentValues();
                t_i1.put("ERROR", "Success");
                t_i1.put("SERVER_Error", Message_s);

                // long task_c = database.update("task_master_history", t_i1, t,
                // null);

                // for get status name by flow id and notification master api call 14072025
                GetDdlData(t_id);
                Mobile_Notification_Master(t_id);

                Cursor cuser2 = database.rawQuery(
                        "SELECT sid FROM lat_plug", null);

                if (cuser2.getCount() > 0) {
                    cuser2.moveToLast();
                    String sidlat = cuser2.getString(0);
                    cuser2.close();

                    //Need to change the logic from TID
                    if (!sidlat.equalsIgnoreCase("0")) {
                        boolean check2 = isMyServiceRunning(sqlitewraper.context,
                                TripService.class.getName());

                        if (check2) {
                            Intent tripservice = new Intent(sqlitewraper.context,
                                    TripService.class);
                            sqlitewraper.context.stopService(tripservice);
                        }
                    }
                }

            }

        } else if (status1.equalsIgnoreCase("10")) {


            //Checksheet mandotory validation

            int tid = 0;
            isSuccess = false;
            UploadLogDeleteUtils uploadLogDeleteUtils = new UploadLogDeleteUtils();

            try{
                JSONArray jsonArray2 = new JSONArray(Message_s);

                for (int k1 = 0; k1 < jsonArray2.length(); k1++) {

                    jsonObject = jsonArray2.getJSONObject(k1);
                    String servertaskid = jsonObject.getString("Task_id");
                    String checksheet_id = jsonObject.getString("Checksheet_id");
                    String stepno = jsonObject.getString("StepNo");

                    tid = uploadLogDeleteUtils.makeChecksheetTechnicianDeleteLog(checksheet_id, servertaskid, stepno);
                }

                uploadLogDeleteUtils.statusUpdateDeleteLog(tid, oldStatus);
            } catch (Exception e) {
                new Handler(Looper.getMainLooper()).post(new Runnable() {
                    public void run() {
                        Toast toast = Toast.makeText(sqlitewraper.context,"Api: "+ METHOD_NAME_corner2 +"\nStatus: "+ status1 + " Message: " +  Message_s, Toast.LENGTH_LONG);
                        toast.show();
                    }
                });
            }


        } else {
            isSuccess = false;

            new Handler(Looper.getMainLooper()).post(new Runnable() {
                public void run() {
                    Toast toast = Toast.makeText(sqlitewraper.context, Message_s, Toast.LENGTH_LONG);
                    toast.show();
                }
            });
        }
        return isSuccess;
    }

    int query_p_f_master(String table, int tid, String millisecond) {

        int k = 0;
        Cursor c = database.rawQuery("select * from  " + table + " where flag= 0 and tid=" + tid + " and millisecond < " + millisecond, null);
        c.moveToFirst();
        if (c.getCount() > 0) {
            k = 1;
        }
        c.close();
        return k;
    }

    // ---------------------------upload_task_history_webservice--------------------//

    String upload_task_history(int tid, String siteid, int checksheetid,
                               float height, String tower_type, int server_task_id, int status,
                               int step, String moduledef, String global_var, String type_c,
                               int tid_new, String moduleid, String punchFlag, String inMs, String outMs, String durationPunch, String millisecond, String editFlag, String matchKeyId, String roleID, String old_status) throws Exception {

        Cursor c3 = database.rawQuery("SELECT username,u_c,company_id,appid,devicetype,appversion FROM Login_Master",
                null);
        c3.moveToLast();
        String username = c3.getString(0);
        //		String u_c = c3.getString(1);
        B_new b = new B_new();
        String u_c = b.GetValue();
        int company_id = c3.getInt(2);
        String appid = c3.getString(3);
        String devicetype = c3.getString(4);
        String appversion = c3.getString(5);


        String restext = null;

        cursorClose(c3);

        //utc

        ArrayList<String> utcmi = new ArrayList<>();
        utcmi = utcCalculationOffset(millisecond);
        String timezone = utcmi.get(1);
        String utcmilliseconds = utcmi.get(0);
        database = sqlitewraper.getDatabase();


        try {

//            SoapObject data = new SoapObject(NAMESPACE2, METHOD_NAME_corner2);
            JSONObject data1 = new JSONObject();
            data1.put("username", username);
            data1.put("height", height);
            data1.put("tower", tower_type);
            data1.put("check_type", checksheetid);
            data1.put("u_c", u_c);
            data1.put("siteid", siteid);
            data1.put("servertaskid", server_task_id);
            data1.put("status", status);
            data1.put("step", step);
            data1.put("moduledef", "");
            data1.put("global_var", global_var);
            data1.put("flow_id", moduleid);
            data1.put("company_id", company_id);

            //-----------punch--------//

            data1.put("punch_flag", punchFlag);
            data1.put("in_ms", inMs);
            data1.put("out_ms", outMs);
            data1.put("duration", durationPunch);

            //------utc
            data1.put("utcmilliseconds", utcmilliseconds);
            data1.put("timezone", timezone);
            data1.put("mtid", tid);
            data1.put("old_status", old_status);
//            Log.d("##OLDSTATUS1",old_status);
//            Log.d("##OLDSTATUS4", String.valueOf(data1));

            //--------For Edit Task Scenario------//
            JSONObject dataString = new JSONObject();
            String restext1 = null;
            if (editFlag == null) {
                editFlag = "0";
            }
            if (editFlag.equalsIgnoreCase("1")) {

                //Edited task form submit
                dataString = editTaskData(tid, server_task_id, status, utcmilliseconds);
                restext1 = com.sky.atc.easyformse.NewWebservicesCallEasyform.ExecuteNetworkHTTPPostRequestFilesAndPhotoUpload(dataString, WCFURL, METHOD_NAME_corner3, matchKeyId, roleID);

                JSONArray responseArray = new JSONArray(restext1);
                JSONObject response = responseArray.getJSONObject(0);
                String Status = response.getString("status");

                if (Status.equals("1")) {
                    JSONObject data2 = new JSONObject();
                    data2.put("username", username);
                    data2.put("u_c", u_c);
                    data2.put("appid", appid);

                    data2.put("devicetype", devicetype);
                    data2.put("appversion", appversion);
//            restext = webservice(data1, data2, data, URL1, SOAP_ACTION_site2,
//                    server_task_id);
                    String u_c1 = b.GetValue();


                    //technician call - call for status update

                    if (!u_c1.equalsIgnoreCase("NA")) {
                        restext = com.sky.atc.easyformse.NewWebservicesCallEasyform.ExecuteNetworkHTTPPostRequestFilesAndPhotoUpload(data1, WCFURL, METHOD_NAME_corner2, matchKeyId, roleID);
                    }
                }

            } else {

                JSONObject data2 = new JSONObject();
                data2.put("username", username);
                data2.put("u_c", u_c);
                data2.put("appid", appid);

                data2.put("devicetype", devicetype);
                data2.put("appversion", appversion);
//            restext = webservice(data1, data2, data, URL1, SOAP_ACTION_site2,
//                    server_task_id);
                String u_c1 = b.GetValue();

                //technician call - call for status update
                if (!u_c1.equalsIgnoreCase("NA")) {
                    restext = com.sky.atc.easyformse.NewWebservicesCallEasyform.ExecuteNetworkHTTPPostRequestFilesAndPhotoUpload(data1, WCFURL, METHOD_NAME_corner2, matchKeyId, roleID);
                }

            }


        } catch (Exception e) {
            LogUtils.writeUploadLogToFile(e.toString(), METHOD_NAME_corner2,"upload_task_history");
            throw e;
            // TODO: handle exception
        }
//        Log.d("##OLDSTATUS5",restext);
        return restext;

    }

    // update flag with 1 on successful file upload
    void update_fid(int id, String t_name, int tid, String millisecond) {
        String t1;
        t1 = "fid='" + id + "' and tid='" + tid + "'and millisecond =" + millisecond;
        ContentValues v = new ContentValues();
        v.put("flag", "1");
        long temp = database.update(t_name, v, t1, null);
        temp++;
    }


    void update_pnid(int id, String t_name, int tid, String millisecond) {
        String t1;
        t1 = "pnid='" + id + "' and tid='" + tid + "'and millisecond =" + millisecond;
        ContentValues v = new ContentValues();
        v.put("punch_upload_flag", "1");
        long temp = database.update(t_name, v, t1, null);
        temp++;
    }

    // update flag with 1 on successful photo upload
    void update_pid(int id, String t_name, int tid, String millisecond) {
        String t1;
        t1 = "pid='" + id + "' and  tid='" + tid + "' and millisecond=" + millisecond;
        ContentValues v = new ContentValues();
        v.put("flag", "1");
        long temp = database.update(t_name, v, t1, null);
        temp++;
    }

    public void update(String value) {
        String t1;
        ContentValues args = new ContentValues();
        t1 = "fileid='" + value + "'";
        args.put("is_download", "1");
        database.update("total_file", args, t1, null);
    }

     // not using so comments
    /*public String getRealPathFromURI(Uri contentUri) {
        // can post image
        String[] proj = {MediaStore.Images.Media.DATA};
        Cursor cursor = context.getContentResolver().query(
                contentUri, proj, // Which columns to
                // return
                null, // WHERE clause; which rows to return (all rows)
                null, // WHERE clause selection arguments (none)
                null); // Order-by clause (ascending by name)
        int column_index = cursor
                .getColumnIndexOrThrow(MediaStore.Images.Media.DATA);
        cursor.moveToFirst();
        return cursor.getString(column_index);
    }*/

    public String value(String field) {
        try {
            // dbHelper = new MySQLiteHelper(context);
            // database = sqlitewraper.getDatabase();

            Cursor cursor = database.rawQuery(
                    "select VALUE from APP_states where ITEAM='" + field + "'",
                    null);
            cursor.moveToFirst();
            String t = "";

            t = cursor.getString(0);
            cursor.close();

            return t;
        } catch (Exception e) {
            return "";
        }
    }


    public void delete(String value) {
        database = sqlitewraper.getDatabase();
        String t1;

        t1 = "fileid='" + value + "'";
        Cursor cursor = database.rawQuery(
                "select fileid,lon,lat,radius from geofence where fileid='"
                        + value + "'", null);
        cursor.moveToFirst();
        int cnt = cursor.getCount();
        if (cnt > 0) {
            long temp = database.delete("geofence", t1, null);
            temp++;
            // geomain g = new geomain();
            // g.onUnregisterGeofence1Clicked(value);

        }
        cursorClose(cursor);
        Cursor cursor1 = database.rawQuery(
                "select fileid,d_url,filename from total_file where fileid='"
                        + value + "'", null);
        cursor.moveToFirst();
        int cnt1 = cursor.getCount();
        if (cnt1 > 0) {
            long temp1 = database.delete("total_file", t1, null);
            temp1++;
        }
        cursorClose(cursor1);
    }

    String check_fdata(String js) {
        String address = "NA";
        JSONArray jsonArray = null;
        try {

            // String js =
            // "[{\"taskid\":\"911380456342546_1450430921735\",\"servertaskid\":\"0\",\"siteid\":\"0\",\"stepid\":\"1\",\"category\":\"1335\",\"date_s\":\"2015-12-18T09:29:12.425Z\",\"address\":\"NA\",\"lat\":\"23.0747167\",\"long1\":\"72.5257818\"}]";

            // Get the instance of JSONArray that contains JSONObjects
            jsonArray = new JSONArray(js);

            for (int i = 0; i < jsonArray.length(); i++) {
                JSONObject jsonObject = jsonArray.getJSONObject(i);

                String name = jsonObject.optString("address").toString();
                if (name.equalsIgnoreCase("N/A") || name.equalsIgnoreCase("")) {

                    String lat = jsonObject.optString("lat").toString();
                    String long1 = jsonObject.optString("long1").toString();

//                    address = add(Double.valueOf(lat), Double.valueOf(long1));
                    address = AddressApi.getCompleteAddress(Double.valueOf(lat), Double.valueOf(long1));

                    if (address == null) {
                        JSONObject ret = getLocationInfo(Double.valueOf(lat),
                                Double.valueOf(long1));
                        JSONObject add1;
                        String location_string = null;

                        add1 = ret.getJSONArray("results").getJSONObject(0);

                        address = add1.getString("formatted_address");

                    }

                }
                jsonObject.put("address", address);
            }

        } catch (Exception e) {
            ////e.printStackTrace()();
        }
        return jsonArray.toString();
    }

    // --------------------address-------------------------

    public JSONObject getLocationInfo(Double lat, Double lng) {

        HttpGet httpGet = new HttpGet(
                "http://maps.google.com/maps/api/geocode/json?latlng=" + lat
                        + "," + lng + "&sensor=true");
        HttpClient client = new DefaultHttpClient();
        HttpResponse response;
        StringBuilder stringBuilder = new StringBuilder();

        try {
            response = client.execute(httpGet);
            HttpEntity entity = response.getEntity();
            java.io.InputStream stream = entity.getContent();
            int b;
            while ((b = stream.read()) != -1) {
                stringBuilder.append((char) b);
            }
        } catch (ClientProtocolException e) {
        } catch (IOException e) {
        }

        JSONObject jsonObject = new JSONObject();
        try {
            jsonObject = new JSONObject(stringBuilder.toString());
        } catch (JSONException e) {
            ////e.printStackTrace()();
        }
        return jsonObject;
    }

    // ----------------------------------------------------------------------
    // not using so comments
    /*String add(double lat, double lon) {

        String address = null;

        try {
            Geocoder gcd = new Geocoder(context,
                    Locale.getDefault());
            List<Address> addresses = gcd.getFromLocation(lat, lon, 1);
            if (addresses.size() > 0) {
                Address a = addresses.get(0);
                for (int k = 0; k < a.getMaxAddressLineIndex(); k++) {
                    if (address == null)
                        address = a.getAddressLine(k);
                    else
                        address = address + "," + a.getAddressLine(k);
                }
                address = address + "," + a.getCountryName();
            }

        } catch (Exception e) {
            ////e.printStackTrace()();
        }
        return address;

    }*/

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

    void cursorClose(Cursor c) {
        try {
            c.close();
        } catch (Exception e) {
            LogUtils.writeUploadLogToFile(e.getMessage(), "", "cursorClose");
        }
    }

    void update_p_id() {
        Cursor c = database
                .rawQuery(
                        "select tid,p_tid from task_master where  p_tid is not null and p_server_task_id is null",
                        null);
        c.moveToFirst();
        if (c.getCount() > 0) {
            for (int i = 0; i < c.getCount(); i++) {
                int tid = c.getInt(0);
                int p_tid = c.getInt(1);
                Cursor check = database
                        .rawQuery(
                                "select tid,p_tid,server_task_id from task_master where  tid='"
                                        + p_tid
                                        + "'and p_tid is null and server_task_id !='0'",
                                null);
                check.moveToFirst();

                if (check.getCount() > 0) {
                    int tid_n = check.getInt(0);
                    int p_sid = check.getInt(2);
                    String t = "p_tid=" + tid_n;
                    ContentValues v = new ContentValues();
                    v.put("p_server_task_id", p_sid);
                    database.update("task_master", v, t, null);
                }
                cursorClose(check);
                c.moveToNext();
            }
        }
        cursorClose(c);

    }


    //VIDEO OR DOCUMENT UPLOAD TO SERVER IN CHUNKS
    public int sendFileToServer1(String filename, String targetUrl,
                                 String file_name, int ch_number, String CompanyId, String CustomerUniq, int offset, double track_byte_g, int checksheetid_new, int que_id, String step_No, String type, String size, String Ph_id, String it_id, String th_path, int sid, String ext, String app_id, String username, String u_c, String devicetype, String appversion) throws IOException {
        HttpClient httpclient = new DefaultHttpClient();

        final int ret_err = 0;
        try {

            double totalbytes;
            double remaining_bytes;
            int final_total_ch;
            HttpPost httppost = new HttpPost(targetUrl);

            File f = new File(filename);
            if (f.exists()) {
                System.out.print("dsds");
            } else {
                return 1;
            }

            double f_legnth = f.length();
            int in_buffer_legnth = 1024 * 1024;
            double total_chunk = f_legnth / in_buffer_legnth;
            int total_ch = (int) f_legnth / in_buffer_legnth;
            totalbytes = f_legnth;
            if (total_chunk - total_ch > 0) {
                final_total_ch = total_ch + 1;
            } else {
                final_total_ch = total_ch;
            }

            if (track_byte_g > 0) {
                totalbytes = track_byte_g;
            }

            // not using so comments
            // FileBody bin = new FileBody(f);

            FileBody cbFile = new FileBody(f, "application/" + ext + "");
            cbFile.getMediaType();
            StringBody comment = new StringBody("A binary file of some kind");

            for (int i = ch_number; i < final_total_ch; i++) {

                if (CustomerUniq.equals("null") || CustomerUniq == null) {
                    CustomerUniq = "0";
                }

                String sizekb = VideoSizeConverter(size);

                MultipartEntity reqEntity = new MultipartEntity();
                reqEntity.addPart("flowChunkNumber",
                        new StringBody(String.valueOf(i + 1)));
                reqEntity.addPart("flowChunkSize",
                        new StringBody(String.valueOf(1024 * 1024)));
                reqEntity.addPart("flowCurrentChunkSize",
                        new StringBody(String.valueOf(1024 * 1024)));
                reqEntity.addPart("flowTotalSize",
                        new StringBody(String.valueOf(Math.round(f_legnth))));
                reqEntity.addPart("flowIdentifier",
                        new StringBody(String.valueOf(file_name)));
                reqEntity.addPart("flowFilename",
                        new StringBody(String.valueOf(file_name)));
                reqEntity.addPart("flowRelativePath",
                        new StringBody(String.valueOf(file_name)));
                reqEntity.addPart("flowTotalChunks",
                        new StringBody(String.valueOf(final_total_ch)));
                reqEntity.addPart("CompanyId",
                        new StringBody(CompanyId));
                reqEntity.addPart("CustomerUniq",
                        new StringBody(CustomerUniq));

                reqEntity.addPart("checksheetid",
                        new StringBody(String.valueOf(checksheetid_new)));
                reqEntity.addPart("que_id",
                        new StringBody(String.valueOf(que_id)));
                reqEntity.addPart("appid",
                        new StringBody(String.valueOf(app_id)));


                if (step_No == null) {
                    step_No = "0";
                }
                reqEntity.addPart("step_No",
                        new StringBody(step_No));
                reqEntity.addPart("type",
                        new StringBody(type));
                reqEntity.addPart("Ph_id",
                        new StringBody(Ph_id));
                reqEntity.addPart("it_id",
                        new StringBody(it_id));
//                reqEntity.addPart("size",     // change for offline login url upload issue 07-05-2024
//                        new StringBody("size"));
                reqEntity.addPart("size",
                        new StringBody("0"));
                reqEntity.addPart("size_kb",
                        new StringBody(sizekb));
                reqEntity.addPart("th_path",
                        new StringBody(th_path));
                reqEntity.addPart("sid",
                        new StringBody(String.valueOf(sid)));


                ByteArrayOutputStream bos = new ByteArrayOutputStream();
                byte[] data = bos.toByteArray();

                System.out.println("executing request "
                        + httppost.getRequestLine());


                // not using so comments
                // Writer writer = new StringWriter();
                // Reader reader;
                try {

                    FileInputStream fileInputStream = new FileInputStream(
                            new File(filename));


                    StringBuffer fileContent = new StringBuffer("");
                    // bufferSize = 1024 * 1024;
                    if (totalbytes > (1024 * 1024)) {
                        bufferSize = 1024 * 1024;
                        totalbytes = totalbytes - bufferSize;

                    } else {
                        bufferSize = (int) totalbytes;
                    }

                    byte[] buffer = new byte[bufferSize];

                    int n = fileInputStream.read(buffer);

                    if (i == 0) {

                        fileContent.append(new String(buffer, 0, n));
                        offset = +n;

                    } else if (i + 1 != final_total_ch) {
                        try {

                            RandomAccessFile raf = new RandomAccessFile(f,
                                    "r");
                            raf.seek(offset);
                            raf.readFully(buffer);
                            fileContent.append(new String(buffer));
                            offset = offset + (1024 * 1024);

                        } catch (Exception e) {

                            throw e;

                        }

                    } else if ((i + 1) == final_total_ch) {
                        RandomAccessFile raf = new RandomAccessFile(f, "r");
                        raf.seek(offset);
                        raf.readFully(buffer);
                        fileContent.append(new String(buffer));
                    }

                    ByteArrayBody imageByte = new ByteArrayBody(buffer,
                            name_file);
//                    reqEntity.addPart("FileData", imageByte); // change for offline login url upload issue 07-05-2024
                    reqEntity.addPart("file", imageByte);

                    String u_c1 = b.GetValue();

                    if (!u_c1.equalsIgnoreCase("NA")) {

                        httppost.setEntity(reqEntity);
                        // log write
                        try {
                            boolean mStringLogWrite = sharedPreferences.getBoolean("isLogWrite",false);
                            if (mStringLogWrite)
                                reqEntity.writeTo(new FileOutputStream(Utils.getRootFolderFile(sqlitewraper.context) + "/" + LogUtils.LogFolderName + "/" + "output.txt"));
                        } catch (Exception e) {
                            e.printStackTrace();
                        }
                        HttpResponse response = httpclient.execute(httppost);
                        if (response.getStatusLine().getStatusCode() == HttpsURLConnection.HTTP_OK) {
                            System.out.print("dsd");

                        } else {

                            LogUtils.writeUploadLogToFile(String.valueOf(response.getStatusLine().getStatusCode()),"", "UPLLOAD_VIDEO");
                            return 1;


                        }

                        HttpEntity resEntity = response.getEntity();
                        track_chnumber = i;
                        track_offset = offset;

                        track_bytes = totalbytes;
                    } else {

                        return 1;
                    }

                } catch (Exception e) {

                    throw e;

                }
            }
        } catch (Exception e) {
            throw e;
        }
        return ret_err;
    }


    protected int upload_video(int tid, String siteid, int checksheetid, int step,
                               int server_task_id, String username, String u_c, String appid, String devicetype, String appversion) {
        int ret_che = -1;
        Cursor c;

        try {

            if (sqlitewraper.internetflag == 1) {

                database = sqlitewraper.getDatabase();
                Cursor c3 = database.rawQuery("SELECT username,u_c,company_id,imei FROM Login_Master",
                        null);
                c3.moveToLast();
                // not using so comments
                /*int company_id = c3.getInt(2);
                String imei = c3.getString(3);*/
                cursorClose(c3);

                c = database
                        .rawQuery(
                                "select _id,con_path,tid,chunk_number,offset,totalbyte,CompanyId,CustomerUniq,que_id,checksheetid,type,Ph_id,it_id,millisecond,step_No,size,or_path from video where issend_track=0  and tid='"
                                        + tid + "' ", null);


                c.moveToFirst();

                if (c.getCount() > 0) {
                    ret_che = 0;
                    int id = 0;
                    String millisecond = null;

                    for (int i = 0; i < c.getCount(); i++) {
                        try {

                            generateNotification(3, null, c.getCount(), i + 1);

                            id = c.getInt(0);
//                    String path = "/storage/emulated/0/DCIM/Camera/test.mp4";
                            String th_path = c.getString(1);
                            String chunk_number = c.getString(3);
                            String offset_g = c.getString(4);
                            String track_byte = c.getString(5);

//                    String CompanyId = "Maulik";
//                    String CustomerUniq = "123";

                            String CompanyId = c.getString(6);
                            String CustomerUniq = c.getString(7);

                            if (CustomerUniq == "" || CustomerUniq.equalsIgnoreCase("")) {
                                CustomerUniq = "0";
                            }

                            int que_id = c.getInt(8);
                            int checksheetid_new = c.getInt(9);
                            String type = c.getString(10);
                            String Ph_id = c.getString(11);
                            String it_id = c.getString(12);
                            millisecond = c.getString(13);
                            String step_No = c.getString(14);
                            String size = c.getString(15);
                            String path = c.getString(16);

                            if (size == null || size.equals("")) {

                                size = getStringSizeLengthFile(path);

                            }

                            if (chunk_number == null) {
                                ch_number = 0;
                            } else {
                                ch_number = Integer.valueOf(chunk_number);
                            }

                            if (offset_g == null) {
                                offset = 0;

                            } else {

                                offset = Integer.valueOf(offset_g);
                                if (offset != 0) {
                                    offset = Integer.valueOf(offset_g);
                                    track_byte_g = Double.valueOf(track_byte);
                                }

                            }

                            name_file = changeFileName(path);
                            String l_name = path.substring(path.lastIndexOf("."));
                            name_file = name_file + l_name;
                            String extn = l_name.substring(l_name.lastIndexOf(".") + 1);

                            String appURL;
                            int k;
                            appURL = sqlitewraper.context.getResources().getString(R.string.App_URL).split("/")[2].trim();
                            if(appURL.equalsIgnoreCase("login.easyform.in"))
                            {
                                // for login url
                                 k = sendFileToServer1(path,
                                                context.getResources().getString(R.string.Resumable_URL) + "flowupload",
                                                name_file, ch_number, CompanyId, CustomerUniq, offset, track_byte_g, checksheetid_new, que_id, step_No, type, size, Ph_id, it_id, th_path, server_task_id, extn, appid, username, u_c, devicetype, appversion);

                            }
                            else {
                                // for other url
                                //txt file upload issue so change video url to use resumbale url 05-03-2024
                                 k= sendFileToServer1(path,
                                            context.getResources().getString(R.string.Video_URL) + "/api/flowupload",
                                            name_file, ch_number, CompanyId, CustomerUniq, offset, track_byte_g, checksheetid_new, que_id, step_No, type, size, Ph_id, it_id, th_path, server_task_id, extn, appid, username, u_c, devicetype, appversion);

                            }

                            //If no error than update upload flag
                            if (k == 0) {

                                String t = "_id='" + id + "' and  tid='" + tid + "' and millisecond=" + millisecond;
                                ContentValues c1 = new ContentValues();
                                c1.put("issend_track", "1");
                                long temp = database.update("video", c1, t, null);

                            } else {

                                //if error occured update last chunk details
                                String t = "_id='" + id + "' and  tid='" + tid + "' and millisecond=" + millisecond;
                                ContentValues c1 = new ContentValues();
                                c1.put("chunk_number", track_chnumber);
                                c1.put("offset", track_offset);
                                c1.put("totalbyte", track_bytes);
                                long temp = database.update("video", c1, t, null);

                                ret_che = 1;
                            }
                        } catch (Exception e) {

                            LogUtils.writeUploadLogToFile(e.getMessage(), "","UPLOAD_VIDEO");

                            String exception = String.valueOf(e);
                            if (exception.equals("java.io.EOFException")) {

                                String t = "_id='" + id + "' and  tid='" + tid + "' and millisecond=" + millisecond;
                                ContentValues c1 = new ContentValues();
                                c1.put("chunk_number", "0");
                                long temp = database.update("video", c1, t, null);
                            }

                            ret_che = 1;
                        }
                        c.moveToNext();
                    }
                    cursorClose(c);
                } else {
                    ret_che = 0;
                }
            }
        } catch (Exception e) {

            ret_che = 1;
            ////e.printStackTrace()();
            // TODO: handle exception
        }


        return ret_che;
        // add wake service here//

    }

    public String changeFileName(String path) {
        String changePath = "NA";
        try {
            Cursor c3 = database.rawQuery(
                    "SELECT imei FROM Login_Master",
                    null);
            c3.moveToLast();
            String imei = c3.getString(0);
            cursorClose(c3);
            final String timeStamp = new SimpleDateFormat("yyyyMMdd", Locale.US).format(new Date());
            String milli = String.valueOf(System.currentTimeMillis());
            String f_name = path.substring(
                    path.lastIndexOf("/") + 1, path.indexOf("."));


            changePath = "DOC_" + timeStamp + "_" + milli + "_" + imei + "-" + f_name;

        } catch (Exception e) {


        }
        return changePath;
    }


    public ArrayList utcCalculationOffset(String millisecond) {

        ArrayList<String> arrayList = new ArrayList<>();

        long milliseconds = Long.parseLong(millisecond);

        Calendar rightNow = Calendar.getInstance();

        long offset = rightNow.get(Calendar.ZONE_OFFSET) +
                rightNow.get(Calendar.DST_OFFSET);

        long utcmilliseconds = milliseconds - offset;
        long zoneOffset = rightNow.get(Calendar.ZONE_OFFSET);

        String timezone = String.valueOf((zoneOffset));
        arrayList.add(String.valueOf(utcmilliseconds));
        arrayList.add(timezone.toString());
        return arrayList;
    }


    private String compareStatuswithTaskmaster(int tid) {

        Cursor check = database
                .rawQuery(
                        "select status from task_master where  tid='" + tid + "'", null);
        check.moveToFirst();
        String status = "";

        if (check.getCount() > 0) {
            status = check.getString(0);
        }

        cursorClose(check);
        return status;
    }

    @SuppressLint("WrongConstant")
    private void generateNotification(int id, String moduleName, int currentCount, int totalCount) {

        database = sqlitewraper.getDatabase();

        String contentText = "Upload";
        String query = "";

        if (moduleName == null) {
            moduleName = "";
        }

        if (id == 1) {
            contentText = "Files Uploading...";
            query = "Select tid from f_master where flag=0";

        } else if (id == 2) {
            contentText = "Photos Uploading...";
            query = "Select tid from p_master where flag=0";
        } else if (id == 3) {
            contentText = "Videos Uploading...";
            query = "Select tid from video where issend_track=0";
        } else if (id == 4) {
            contentText = "Task Uploading...";
            query = "Select tid from task_master where tid = " + moduleName;
        } else if (id == 5) {
            contentText = "Uploading Start...";
            query = "Select tid from task_master where flag=1";
        } else if (id == 6) {
            contentText = "Uploading Finish...";
            query = "Select tid from task_master where flag=1";
        } else if (id == 7) {
            contentText = "Uploading Finish...";
            query = "Select tid from task_master where flag=1";
        } else if (id == 8) {
            contentText = "Uploading Trip...";
            query = "Select tid from task_master where flag=1";
        }


        Cursor c2_n = database.rawQuery(query, null);
        c2_n.moveToFirst();

        String tidValue = "";
        if (c2_n.getCount() > 0) {

            tidValue = c2_n.getString(0);

        }

        cursorClose(c2_n);

        int icon = R.drawable.atc_logo;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            CharSequence name = "Easyform";// The user-visible name of the channel.
            int importance = NotificationManager.IMPORTANCE_HIGH;
            mChannel = new NotificationChannel(CHANNEL_ID, name, NotificationManager.IMPORTANCE_LOW);
            mChannel.setSound(null, null);

        }

        Intent intent = new Intent(sqlitewraper.context, ph_s.class);
        PendingIntent contentIntent = PendingIntent.getActivity(sqlitewraper.context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        NotificationCompat.Builder b = new NotificationCompat.Builder(sqlitewraper.context);

        b.setAutoCancel(false)
                .setWhen(System.currentTimeMillis())
                .setSmallIcon(icon)
                .setContentTitle(getApplicationName(sqlitewraper.context) + " Upload")
                .setContentIntent(contentIntent)
                .setContentText("Id :" + tidValue + " - " + contentText)
                .setContentInfo(totalCount + "/" + currentCount)
                .setChannelId(CHANNEL_ID)
                .setOngoing(true);
//                .setProgress(maxcount, curcount, false);

        NotificationManager notificationManager = (NotificationManager) sqlitewraper.context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            mChannel.setSound(null, null);
            notificationManager.createNotificationChannel(mChannel);
        }
        notificationManager.notify(148, b.build());

        if (currentCount == totalCount) {
            if (id != 5) {
                notificationManager.cancel(148);
            }

        }
    }

    public String getApplicationName(Context context) {
        ApplicationInfo applicationInfo = context.getApplicationInfo();
        int stringId = applicationInfo.labelRes;
        return stringId == 0 ? applicationInfo.nonLocalizedLabel.toString() : context.getString(stringId);
    }

    public JSONArray deletedmedia(String module_id, String module_name, int p_id) {

        // not using so comments
        /*String maindeletejson = "";
        JSONObject obj = null;*/

        if (deletetidcntlog != p_id) {
            deletetidcntlog = p_id;
            deletesublogjsonArray = new JSONArray(new ArrayList<String>());
            deletesubjsonArray.clear();
        }

        JSONObject data2 = new JSONObject();

        if (!deletesubjsonArray.contains(module_id)) {

            try {
                data2.put("module_id", module_id);
                data2.put("module_name", module_name);
                deletesublogjsonArray.put(data2);
                deletesubjsonArray.add(module_id);
                deletesubjsonArray.add(module_name);

                JSONArray mapArray = null;
                if (meMap.containsKey(p_id)) {
                    mapArray = meMap.get(p_id);

                    if (deletetidcntlog1 != deletetidcntlog) {
                        deletetidcntlog1 = p_id;

                        if (!meMap.containsValue(deletesublogjsonArray)) {
                            deletesublogjsonArray.put(mapArray.toString());
                        }
                    }

                } else {
                    meMap.put(p_id, deletesublogjsonArray);
                }

            } catch (JSONException e) {
                e.printStackTrace();
            }

        }
        return deletesublogjsonArray;
    }

    private JSONObject editTaskData(int tid, int taskId, int status, String utcmilliseconds) {

        Cursor c = database
                .rawQuery(
                        "select f_data,c_id from f_master where c_type='5' and  tid='"
                                + tid + "'", null);

        c.moveToFirst();
        String dataString = "";
        JSONArray mainJsonArray = new JSONArray();
        JSONObject mainJsonObject = new JSONObject();
        try {
            String f_data = c.getString(0);
            String c_id = c.getString(1);
            JSONArray jsonArray = new JSONArray(f_data);
            JSONObject jsonObject = jsonArray.getJSONObject(0);
            dataString = jsonObject.getString("data");


            Cursor c1 = database
                    .rawQuery(
                            "select company_id,username,u_c from Login_Master", null);

            c1.moveToFirst();

            String company_id = c1.getString(0);
            String username = c1.getString(1);
            String u_c = c1.getString(2);


            JSONArray mainData = new JSONArray();
            JSONArray data = new JSONArray(dataString);

            JSONArray buttonArray = new JSONArray();
            JSONArray photoTemp = new JSONArray();
            JSONObject mainObject = new JSONObject();

            mainObject.put("Company_id", company_id);
            mainObject.put("task_id", taskId);
            mainObject.put("Subcategory", "");
            mainObject.put("Step_id", 0);
            mainObject.put("StepNo", 1);
            mainObject.put("checksheet_id", c_id);
            mainObject.put("Status", status);
            mainObject.put("Data", data);
            mainObject.put("button", buttonArray);
            mainObject.put("millisecond", utcmilliseconds);
            mainObject.put("createby", 0);
            mainObject.put("UpdatedBy", 0);
            mainObject.put("master", "");
            mainObject.put("sub", "");
            mainObject.put("type", "new");
            mainObject.put("photo_temp", photoTemp);
            mainObject.put("mpkey", tid);

            mainData.put(mainObject);

            JSONArray subData = new JSONArray();
            JSONObject subObject = new JSONObject();

            subObject.put("RequestFor", "");
            subObject.put("WhereCondition", "");
            subObject.put("TackAction", "Update");

            subData.put(subObject);

            JSONArray auth1 = new JSONArray();
            JSONObject authObject = new JSONObject();

            try {
                authObject.put("user_name", username);
                authObject.put("u_c", u_c);
            } catch (JSONException e) {
                // TODO Auto-generated catch block
                ////e.printStackTrace()();
            }

            auth1.put(authObject);

            mainJsonObject.put("MainData", mainData);
            mainJsonObject.put("SubData", subData);
            mainJsonObject.put("auth1", auth1);
            mainJsonObject.put("call_type", "web");

            mainJsonArray.put(mainJsonObject);

            cursorClose(c);
            cursorClose(c1);

        } catch (final Exception e) {
            e.printStackTrace();
        }

        return mainJsonObject;
    }


    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (Build.VERSION.SDK_INT >= 26) {
            String CHANNEL_ID = "my_channel_01";
            @SuppressLint("WrongConstant") NotificationChannel channel = new NotificationChannel(CHANNEL_ID,
                    "Channel human readable title",
                    NotificationManager.IMPORTANCE_DEFAULT);

            ((NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE)).createNotificationChannel(channel);

            Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                    .setContentTitle("")
                    .setContentText("").build();

            startForeground(148, notification);
        }
        return super.onStartCommand(intent, flags, startId);
    }

    public static String getStringSizeLengthFile(String path) {

        File file = new File(path);
        // Get the number of bytes in the
        long size = file.length();

        DecimalFormat df = new DecimalFormat("0.00");

        float sizeKb = 1024.0f;
        float sizeMb = sizeKb * sizeKb;
        float sizeGb = sizeMb * sizeKb;
        float sizeTerra = sizeGb * sizeKb;


        if (size < sizeMb)
            return df.format(size / sizeKb) + "KB";
        else if (size < sizeGb)
            return df.format(size / sizeMb) + "MB";

        return "";
    }

    private void fcmDataUpload() {

        boolean check4 = isMyServiceRunning(sqlitewraper.context,
                upload_clone.class.getName());
        if (!check4) {
            Intent i = new Intent(sqlitewraper.context,
                    upload_clone.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                sqlitewraper.context.startForegroundService(i);
            } else {
                sqlitewraper.context.startService(i);
            }
        }
    }
//upload stillviolation events 27-12-2023
    public void UploadStillViolation()
    {
        Cursor check = null;
        try {

            if (sqlitewraper.internetflag == 1) {

                database = sqlitewraper.getDatabase();

                check = database
                        .rawQuery(
                                "select _id,Event_strt,Event_end,username,Event_type,lat,lon,duration,battery,timezone,utcstart,utcend,imei,appid,userid,maxviolation,tid from Events where is_send=0 and Event_type IN ('StillViolation')",
                                null);
                check.moveToFirst();
                int id;
                String Event_strt, Event_end, username, Event_type, lat, lon;

                if (check.getCount() > 0) {

                    for (int i = 0; i < check.getCount(); i++) {
                        try {
                            id = check.getInt(0);
                            Event_strt = check.getString(1);
                            Event_end = check.getString(2);
                            username = check.getString(3);
                            Event_type = check.getString(4);
                            lat = check.getString(5);
                            lon = check.getString(6);
                            String duration = check.getString(7);
                            String battery = check.getString(8);
                            String timezone = check.getString(9);
                            String utcstart = check.getString(10);
                            String utcend = check.getString(11);
                            String imei = check.getString(12);
                            String appid = check.getString(13);
                            String userid = check.getString(14);
                            String maxVioData = check.getString(15);
                            String tid = check.getString(16);


                            String address = AddressApi.getCompleteAddress(Double.valueOf(lat), Double.valueOf(lon));


                            try {
                                if (address == null) {
                                    JSONObject ret = getLocationInfo(
                                            Double.valueOf(lat), Double.valueOf(lon));
                                    JSONObject add1;
                                    String location_string = null;
                                    add1 = ret.getJSONArray("results").getJSONObject(0);
                                    address = add1.getString("formatted_address");
                                }
                            } catch (Exception e) {
                            }


                            JSONObject data1 = new JSONObject();
                            data1.put("Event_strt", Event_strt);

                            data1.put("Event_end", Event_end);
                            data1.put("username", username);
                            data1.put("Event_type", Event_type);
                            data1.put("lat", lat);
                            data1.put("lon", lon);
                            if (address != null) {
                                data1.put("address", address);
                            } else {
                                data1.put("address", "NA");
                            }

                            data1.put("duration", duration);
                            data1.put("battery_level", battery);
                            data1.put("mobile_timezone", timezone);
                            data1.put("Event_Start_Milli_UTC", utcstart);
                            data1.put("Event_End_Milli_UTC", utcend);
                            data1.put("imei", imei);
                            data1.put("app_id", appid);
                            data1.put("userid", userid);
                            data1.put("mobile_primary_key", id);
                            data1.put("maxviolation", maxVioData);
                            data1.put("tid", tid);

                            //  if (Event_type.equalsIgnoreCase("speed")){

                            Cursor c3 = database.rawQuery(
                                    "SELECT server_task_id from task_master where tid=" + tid, null);
                            c3.moveToLast();
                            String sid = "0";
                            if (c3.getCount() > 0) {
                                sid = c3.getString(0);

                            }
                            data1.put("sid", sid);
                            c3.close();


                            String restext = NewWebservicesCallEasyform.ExecuteNetworkHTTPPostRequestfile(data1, WCFURL, METHOD_NAME_corner13, data1);
                            JSONArray jsonArray = new JSONArray(restext);
                            String status1 = null;

                            for (int k1 = 0; k1 < jsonArray.length(); k1++) {
                                JSONObject jsonObject = jsonArray
                                        .getJSONObject(0);

                                status1 = jsonObject.getString("status");
                                String message;

                                if (status1.equalsIgnoreCase("1")) {

                                    String cnd;
                                    cnd = "_id=" + id;
                                    ContentValues c_path = new ContentValues();
                                    c_path.put("is_send", "1");
                                    long temp = database.update("Events",
                                            c_path, cnd, null);

                                }

                            }

                        } catch (Exception e) {
                            ////e.printStackTrace()();
//							check.moveToNext();

                        }
                        check.moveToNext();
                    }

                }
                check.close();

            }

        } catch (Exception e) {
            ////e.printStackTrace()();

        }
    }

    Map<String, String> globStatusNameMap = new HashMap<>();

    //for get status name by flow id 14072025
    public void GetDdlData(int tid) {
        JSONObject data1 = new JSONObject();


        Cursor c3 = database.rawQuery(
                "SELECT appid,company_Id FROM Login_Master", null);
        c3.moveToFirst();
        String company_Id;
        int count = c3.getCount();
        try {
            if (count > 0) {

                company_Id = c3.getString(1);
                c3.close();

                data1.put("Company_id", company_Id);
            }

            String moduleid;
            Cursor c4 = database.rawQuery(
                    "SELECT moduleid FROM task_master where tid="
                            + tid, null);
            c4.moveToLast();
            moduleid = c4.getString(0);

            c4.close();

            data1.put("Flow_id", moduleid);
            data1.put("Flag", "get_data");

            String restext = NewWebservicesCallEasyform.ExecuteNetworkHTTPPostRequestfile(data1, WCFURL, METHOD_NAME_corner8, data1);
            JSONArray jsonArray = new JSONArray(restext);
            String status1 = null;

            for (int k1 = 0; k1 < jsonArray.length(); k1++) {
                JSONObject jsonObject = jsonArray
                        .getJSONObject(0);

                status1 = jsonObject.getString("status");
                String message;

                if (status1.equalsIgnoreCase("1")) {

                    JSONArray dataArray = new JSONArray(jsonObject.getString("data"));
                    JSONArray fsmDataArray = dataArray.getJSONObject(0).getJSONArray("FSM_Data");
                    Map<String, String> statusNameMap = new HashMap<>();

                    for (int i = 0; i < fsmDataArray.length(); i++) {
                        JSONObject fsmItem = fsmDataArray.getJSONObject(i);

                        String statusKey = fsmItem.optString("Status");       // e.g., "2"
                        String statusName = fsmItem.optString("Status_Name"); // e.g., "Completed"

                        statusNameMap.put(statusKey, statusName);
                    }

                    globStatusNameMap = statusNameMap; // Set globally
                }

            }
        } catch (Exception e) {
            e.printStackTrace();
        }

    }

    //     for status change comment:
    public void Mobile_Notification_Master(int tid) {
        JSONObject data1 = new JSONObject();
        Cursor c3 = database.rawQuery(
                "SELECT user_id,username,company_Id FROM Login_Master", null);
        c3.moveToFirst();
        String username;
        String user_id;
        String old_status = "";
        String new_status = "";
        int count = c3.getCount();

        try {
            if (count > 0) {

                user_id = c3.getString(0);
                username = c3.getString(1);
                c3.close();


                String client_id = user_id + "_" + System.currentTimeMillis();


                Cursor c5 = database.rawQuery(
                        "SELECT old_status,status FROM task_master_history where tid="
                                + tid, null);
                c5.moveToLast();
                old_status = c5.getString(0);
                new_status = c5.getString(1);
                c5.close();

                old_status = globStatusNameMap.getOrDefault(old_status, "Unknown");
                new_status = globStatusNameMap.getOrDefault(new_status, "Unknown");
                String message = username + " moved this task from " + old_status + " to " + new_status;

                String servertaskid;
                Cursor c4 = database.rawQuery(
                        "SELECT server_task_id FROM task_master where tid="
                                + tid, null);
                c4.moveToLast();
                servertaskid = c4.getString(0);

                c4.close();


                data1.put("subject", "");
                data1.put("message", message);
                data1.put("From", "");
                data1.put("email", "[]");
                data1.put("Cc", "[]");
                data1.put("Bcc", "[]");
                data1.put("contact", "[]");
                data1.put("server_task_id", servertaskid);
                data1.put("checksheet_id", "-1");
                data1.put("step_id", "-1");
                data1.put("que_id", "-1");
                data1.put("client_request_id", client_id);


                String restext = NewWebservicesCallEasyform.ExecuteNetworkHTTPPostRequestfile(data1, WCFURL, METHOD_NAME_corner7, data1);
                JSONArray jsonArray = new JSONArray(restext);
                String status1 = null;

                for (int k1 = 0; k1 < jsonArray.length(); k1++) {
                    JSONObject jsonObject = jsonArray
                            .getJSONObject(0);

                    status1 = jsonObject.getString("status");

                    if (status1.equalsIgnoreCase("1")) {

                    }

                }

            }

        } catch (Exception e) {

        }
    }
}
