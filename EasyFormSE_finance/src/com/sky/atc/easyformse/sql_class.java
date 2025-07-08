package com.sky.atc.easyformse;

import android.app.ActivityManager;
import android.app.ActivityManager.RunningServiceInfo;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;

import net.sqlcipher.database.SQLiteDatabase;

import android.location.LocationManager;
import android.net.ConnectivityManager;
import android.os.Environment;

import androidx.core.app.ActivityCompat;

import android.util.Log;

import com.commonsware.cwac.wakeful.WakefulIntentService;
import com.sky.atc.easyformse.attendance.AttandanceUtils;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.download.DownloadListService;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaArgs;
import org.apache.cordova.PluginResult;
import org.apache.cordova.PluginResult.Status;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.util.ArrayList;
import java.util.LinkedHashMap;

import io.michaelrocks.paranoid.Obfuscate;

//Main plugin for different configuration
@Obfuscate
public class sql_class implements Runnable {

    private static String CREATE_DB_ACTION = "createDatabase";
    private static String SHOW_DB_VALUES_ACTION = "showValues";
    private static String insertValuse = "insertValuse";
    private SQLiteDatabase database;
    int gps;
    JSONObject json;
    MySharedPreferences pref;

    ArrayList<JSONObject> list = new ArrayList<JSONObject>();
    private String action;
    CordovaArgs args;
    Context c1;
    CallbackContext callbackContext;
    PluginResult result = null;
    data d = new data();
//    Editor editor;

    sql_class(String ac, CordovaArgs args1, Context c,
              CallbackContext callbackContext1) {
        this.action = ac;
        this.args = args1;
        this.c1 = c;
        this.callbackContext = callbackContext1;
        database = sqlitewraper.getDatabase();
    }

    public void run() {

        String K = null;
        pref = sqlitewraper.getSecureShared("MyPref");
//        editor = pref.edit();

        if (CREATE_DB_ACTION.equals(action)) {
            // Log.d(TAG, "CREATE_DB_ACTION");

        } else if (SHOW_DB_VALUES_ACTION.equals(action)) {

            String query = null, query1 = null;

            // Log.d(TAG, "SHOW_DB_VALUES_ACTION");

            JSONArray DBInfo = null;
            try {
                query = args.getJSONObject(0).getString("data");
                query1 = args.getJSONObject(0).getString("p");

                // ///// p=3 for user lat long entry and insert imei in
                // login_master table on login page load
                if (query1.equalsIgnoreCase("3")) {

                    String imei = DeviceEventsUtils.getImei();

                    ContentValues v = new ContentValues();
                    v.put("imei", imei);
                    long temp = database.update("Login_Master", v, null, null);
                    temp++;
                    DBInfo = getDBValuesListing(query);

                }

                // download latest site from server on refresh button click
                if (query1.equalsIgnoreCase("4")) {


                    // --------------Download------------//

                    Intent i_ch = new Intent(sqlitewraper.context,
                            DownloadListService.class);
                    WakefulIntentService.sendWakefulWork(sqlitewraper.context,
                            i_ch);
                }
                if (query1.equalsIgnoreCase("5")) {

                    //return the photo path saved in prefences
                    String path = pref.getString("photo_path", null);
                    LinkedHashMap<String, Object> lHashMap = new LinkedHashMap<String, Object>();
                    lHashMap.put("path", path);
                    json = new JSONObject(lHashMap);
                    list.add(json);
                    result = new PluginResult(Status.OK, list.toString());
                }

                // upload site on upload pending button click
                if (query1.equalsIgnoreCase("6")) {
                    Intent i_ch2 = new Intent(sqlitewraper.context,
                            f_upload_new_structure.class);
                    WakefulIntentService.sendWakefulWork(sqlitewraper.context,
                            i_ch2);
                }
                if (query1.equalsIgnoreCase("7")) {
                    //ID saved to variable for Document download used in resume_wake.java
                    String downloadid = args.getJSONObject(0).getString("downloadid");
                    data d = new data();
                    d.setDownloadid(downloadid);
                }
                if (query1.equalsIgnoreCase("8")) {

                    //start Document download service
                    boolean check = isMyServiceRunning(sqlitewraper.context,
                            resume_wake.class.getName());
                    if (!check) {
                        Intent fupload = new Intent(sqlitewraper.context,
                                resume_wake.class);
                        WakefulIntentService.sendWakefulWork(
                                sqlitewraper.context, fupload);
                    }
                }


                if (query1.equalsIgnoreCase("0")) {

                    //return query data

                    Cursor c1 = database.rawQuery(query, null);
                    c1.moveToFirst();
                    if (c1.getCount() > 0) {
                        String t_data = c1.getString(0);

                        // t_data.getBytes();
                        result = new PluginResult(Status.OK, t_data);
                    } else {
                        result = new PluginResult(Status.ERROR, "No data found");
                    }
                    c1.close();
                } else {

                    DBInfo = getDBValuesListing(query);

                }
                if (result == null) {
                    result = new PluginResult(Status.OK, DBInfo.toString());
                }

            } catch (Exception e) {
                result = new PluginResult(Status.ERROR, "exception occured");
            }
            try {

                callbackContext.sendPluginResult(result);
            } catch (Exception e) {
                String newline = System.getProperty("line.separator");
                String t = query + newline + query1;

                try {
                    File newFolder = new File(
                            Environment.getExternalStorageDirectory(),
                            "TestFolder");
                    if (!newFolder.exists()) {
                        newFolder.mkdir();
                    }
                    try {
                        File file = new File(newFolder, "MyTest" + ".txt");
                        file.createNewFile();

                        FileOutputStream fos = new FileOutputStream(file);
                        fos.write(t.getBytes());
                        fos.flush();
                        fos.close();

                    } catch (Exception ex) {
                        System.out.println("ex: " + ex);
                    }
                } catch (Exception ex) {
                    System.out.println("e: " + e);
                }

            }
            // return true;

        } else if (insertValuse.equals(action)) {

            String query = null;
            String q = null;
            try {

                int i = 0;

                query = args.getJSONObject(0).getString("data");
                q = args.getJSONObject(0).getString("q");
                K = query;
                String tid = args.getJSONObject(0).getString("tid");

                // DBInfo = getDBValuesListing(query);
                database.execSQL(query);
                Log.i("INSERT", query);
                Log.i("INSERT", q);
                result = new PluginResult(Status.OK, "done");

                //for Attendance Util
                try {
                    if (args.getJSONObject(0).has("task")) {
                        String taskCreate = args.getJSONObject(0).getString("task");
                        Log.d("##TASK_CREATE", taskCreate);
                        if (taskCreate.equalsIgnoreCase("update")) {
                            AttandanceUtils.aftertaskCreatedReg();
                        }
                    }

                } catch (Exception e) {
                    e.printStackTrace();
                }


                if (q.equalsIgnoreCase("1")) {

                    String t;
                    t = "tid='" + tid + "'";
                    ContentValues t_i = new ContentValues();
                    t_i.put("flag", 1);
                    long task = database.update("task_master", t_i, t, null);

                    // upload data on submit button (case"1")
                    Intent i_ch2 = new Intent(sqlitewraper.context,
                            f_upload_new_structure.class);
                    WakefulIntentService.sendWakefulWork(sqlitewraper.context,
                            i_ch2);

                } else if (q.equalsIgnoreCase("2")) {
                    String old_status;
                    if (args.getJSONObject(0).has("old_status")) {
                        old_status = args.getJSONObject(0).getString("old_status");
                    } else {
                        old_status = "";
                    }

                    //status update call
                    task_master_history(Integer.parseInt(tid), old_status);
                    String t;
                    t = "tid='" + tid + "'";
                    ContentValues t_i = new ContentValues();
                    t_i.put("flag", 1);
                    long task = database.update("task_master", t_i, t, null);

                    Intent i_ch2 = new Intent(sqlitewraper.context,
                            f_upload_new_structure.class);
                    WakefulIntentService.sendWakefulWork(sqlitewraper.context,
                            i_ch2);

                } else if (q.equalsIgnoreCase("3")) {

                    Cursor c2 = database.rawQuery("select username,company_id from Login_Master",
                            null);
                    c2.moveToFirst();
                    String nick1 = null;
                    int c_id = 0;
                    if (c2.getCount() > 0) {
                        nick1 = c2.getString(0);
                        c_id = c2.getInt(1);
                    }
                    c2.close();

                    String imei = DeviceEventsUtils.getImei();

                    try {

                        if (!nick1.equalsIgnoreCase("0")) {

                            String t = "_id==1";
                            ContentValues gcm = new ContentValues();
                            gcm.put("username", nick1);
                            gcm.put("imei", imei);
                            gcm.put("date", System.currentTimeMillis());

                            gcm.put("company_id", c_id);
                            long insert = database.update("gcm_server", gcm, t, null);
                        }
                    } catch (Exception ignored) {

                    }

                    //call for fcm data
                    Intent gcm = new Intent(sqlitewraper.context, gcm_server.class);
                    WakefulIntentService.sendWakefulWork(sqlitewraper.context,
                            gcm);

                    //GPS status
                    i = check();

                    pref.putString("flow_id", "");

                    pref.putString("flow_name1", "");
                    pref.putString("data", "");
                    pref.commit();
                    // --------------download__before_structure_change------------//

                    Intent i_ch = new Intent(sqlitewraper.context,
                            DownloadListService.class);
                    WakefulIntentService.sendWakefulWork(sqlitewraper.context,
                            i_ch);

                } else if (q.equalsIgnoreCase("4")) {
                    call();
                }

                // ---upload task at the time of creation (if internet
                // available-----/
                else if (q.equalsIgnoreCase("5")) {
                    boolean check = isMyServiceRunning(sqlitewraper.context,
                            f_upload_new_structure.class.getName());
                    if (!check) {
                        Intent fupload = new Intent(sqlitewraper.context,
                                f_upload_new_structure.class);
                        WakefulIntentService.sendWakefulWork(
                                sqlitewraper.context, fupload);
                    }
                } else if (q.equalsIgnoreCase("8")) {
//                    Cursor c = database.rawQuery("select appid,user_id from Login_Master", null);
//                    c.moveToFirst();
//                    if (c.getCount() > 0) {
//                        String appid = c.getString(0);
//                        String userid = c.getString(1);
//                        if ((appid.equals("0")) && (!userid.equals("0"))) {
//                            ContentValues v = new ContentValues();
//                            v.put("appid", userid+"_"+System.currentTimeMillis());
//                            long temp = database.update("Login_Master", v, null, null);
//
//                        }
//                    }


                }
                else if (q.equalsIgnoreCase("6"))
                {
                    // attendance photo/ face detection update task_master flag 1 and upload call 26-02-2025
                    String t;
                    t = "tid='" + tid + "'";
                    ContentValues t_i = new ContentValues();
                    t_i.put("flag", 1);
                    long task = database.update("task_master", t_i, t, null);

                    Intent fupload = new Intent(sqlitewraper.context,
                            f_upload_new_structure.class);
                    WakefulIntentService.sendWakefulWork(
                            sqlitewraper.context, fupload);
                }

                LinkedHashMap<String, Object> lHashMap = new LinkedHashMap<String, Object>();
                lHashMap.put("gps", i);

                json = new JSONObject(lHashMap);
                list.add(json);

                result = new PluginResult(Status.OK, list.toString());


            } catch (JSONException e) {
                result = new PluginResult(Status.INVALID_ACTION);
                callbackContext.sendPluginResult(result);
                //e.printStackTrace()();
            } catch (Exception e) {
                result = new PluginResult(Status.INVALID_ACTION);
                callbackContext.sendPluginResult(result);
                //e.printStackTrace()();
            }
        } else if (action.equalsIgnoreCase("shared")) {


            //get shared preferneces data and return

            String flow_id = pref.getString("flow_id", "");
            String udf_id = pref.getString("udf_id", "");
            String flow_name = pref.getString("flow_name", "");
            String flow_type = pref.getString("flow_type", "");
            String udf_data = pref.getString("udf_data", "");
            String task_checksheet_id = pref.getString("task_checksheet_id","");
            String photo_url = pref.getString("photo_url","");

            LinkedHashMap<String, Object> lHashMap = new LinkedHashMap<String, Object>();
            lHashMap.put("flow_id", flow_id);
            lHashMap.put("udf_id", udf_id);
            lHashMap.put("flow_name", flow_name);
            lHashMap.put("flow_type", flow_type);
            lHashMap.put("udf_data", udf_data);
            lHashMap.put("task_checksheet_id",task_checksheet_id);
            lHashMap.put("photo_url",photo_url);
            json = new JSONObject(lHashMap);
            list.add(json);

            pref.putString("flow_id", "");
            pref.putString("udf_id", "");
            pref.putString("flow_name", "");
            pref.putString("flow_type", "");
            pref.putString("udf_data", "");
            pref.putString("task_checksheet_id", "");
            pref.putString("photo_url","");
            pref.commit();


            result = new PluginResult(Status.OK, list.toString());

        } else {
            result = new PluginResult(Status.INVALID_ACTION);
            callbackContext.sendPluginResult(result);
            // Log.d(TAG, "Invalid action : " + action + " passed");
        }

        try {

            callbackContext.sendPluginResult(result);
        } catch (Exception e) {
            String newline = System.getProperty("line.separator");

            try {
                File newFolder = new File(
                        Environment.getExternalStorageDirectory(), "TestFolder");
                if (!newFolder.exists()) {
                    newFolder.mkdir();
                }
                try {
                    File file = new File(newFolder, "MyTest" + ".txt");
                    file.createNewFile();

                    FileOutputStream fos = new FileOutputStream(file);
                    fos.write(K.getBytes());
                    fos.flush();
                    fos.close();

                } catch (Exception ex) {
                    System.out.println("ex: " + ex);
                }
            } catch (Exception ex) {
                result = new PluginResult(Status.INVALID_ACTION);
                callbackContext.sendPluginResult(result);
                System.out.println("e: " + e);
            }
        }

        // System.out.println(message);
    }// --------------------------------------------------------------

    //get query return data
    public JSONArray getDBValuesListing(String query) throws JSONException {

        Cursor c = database.rawQuery(query, null);
        c.moveToFirst();
        String t = "";
        String t1 = "";
        ArrayList<JSONObject> list = new ArrayList<JSONObject>();

        String imei = DeviceEventsUtils.getImei();

        for (int i = 0; i < c.getCount(); i++) {
            JSONObject obj = new JSONObject();

            t = "";
            for (int j = 0; j < c.getColumnCount(); j++) {
                t1 = c.getString(j);
                if (t1 == null) {
                    obj.put(c.getColumnName(j), "Unknown");
                    t = t + " ";
                } else {

                    // t1 = t1.replace("\n", " ").replace(",", " ")
                    // .replace("'", " ");
                    t = t + t1;

                    obj.put(c.getColumnName(j), t1);

                } // Log.v(tag, c.getColumnName(i).toString());
            }
            obj.put("imei", imei);
            list.add(obj);

            c.moveToNext();
            // Log.v("sqlitePlugin", obj.toString() + " " + t);
        }
        c.close();

        JSONArray jsArray;
        jsArray = new JSONArray(list);

        return jsArray;

    }

    //to check gps status
    int check() {

        final ConnectivityManager connMgr = (ConnectivityManager) sqlitewraper.context
                .getSystemService(Context.CONNECTIVITY_SERVICE);
        final android.net.NetworkInfo mobile = connMgr
                .getNetworkInfo(ConnectivityManager.TYPE_MOBILE);
        LocationManager lm = (LocationManager) sqlitewraper.context
                .getSystemService(sqlitewraper.context.LOCATION_SERVICE);
        boolean isGPSEnabled = lm
                .isProviderEnabled(LocationManager.GPS_PROVIDER);

        if (isGPSEnabled == true) {
            gps = 1;

        } else {
            gps = 0;

        }
        return gps;

    }

    //insert into task master history
    void task_master_history(int tid, String oldstatus) {
        Cursor c1_n = database
                .rawQuery(
                        "Select tid,task_id ,server_task_id ,flag ,user_id ,username ,rate ,siteid ,site_name ,site_address ,percentage ,survey_date ,lat ,long ,inspect_count ,checksheetid ,height ,display_siteid ,step ,status ,upload_date ,updateddate ,millisecond , end_of_date , data ,tower_type ,moduleid ,module_name ,moduledef,srnumber,global_var,punch_flag,in_ms,out_ms,duration,is_delete_photo,is_delete_log,initialstatus,edit_global_var,is_delete_sub,list_html,islogdown,que_milli,que_id,edit_flag,p_udf_id,match_temp_id from task_master where tid="
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

            String is_delete_photo = c1_n.getString(35);
            String is_delete_log = c1_n.getString(36);
            String initialstatus = c1_n.getString(37);
            String edit_global_var = c1_n.getString(38);
            String is_delete_sub = c1_n.getString(39);
            String list_html = c1_n.getString(40);
            String islogdown = c1_n.getString(41);
            String que_milli = c1_n.getString(42);
            String que_id = c1_n.getString(43);
            String edit_flag = c1_n.getString(44);
            String p_udf_id = c1_n.getString(45);
            String match_temp_id = c1_n.getString(46);


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

            //-----------punch--------//

            c.put("punch_flag", punchFlag);
            c.put("in_ms", inMs);
            c.put("out_ms", outMs);

            c.put("is_delete_photo", is_delete_photo);
            c.put("is_delete_log", is_delete_log);
            c.put("initialstatus", initialstatus);
            c.put("edit_global_var", edit_global_var);
            c.put("is_delete_sub", is_delete_sub);
            c.put("list_html", list_html);
            c.put("islogdown", islogdown);
            c.put("que_milli", que_milli);
            c.put("que_id", que_id);
            c.put("edit_flag", edit_flag);
            c.put("p_udf_id", p_udf_id);
            c.put("match_temp_id", match_temp_id);
            c.put("local_milli", System.currentTimeMillis());
            c.put("entry_type", "and_plugin");
            c.put("old_status", oldstatus);

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
//                Log.d("##OLDSTATUS3", String.valueOf(temp));
                temp++;

            }
            c2_n.close();
        }
    }

    //check if location service is running or not
    void call() {
        database = sqlitewraper.getDatabase();

        Cursor a_t = database.rawQuery(
                "select value from APP_states where ITEAM ='nick'", null);
        a_t.moveToFirst();
        String j = a_t.getString(0);
        a_t.close();
        if (j.equalsIgnoreCase("0")) {

        } else {

            Cursor a_t12 = database.rawQuery(
                    "select value from APP_states where ITEAM ='gps'", null);
            a_t12.moveToFirst();
            int j1 = a_t12.getCount();
            String gps = null;
            if (a_t12.getCount() > 0) {

                gps = a_t12.getString(0);


                if (gps.equalsIgnoreCase("0")) {


                    boolean check_gps = isMyServiceRunning(sqlitewraper.context,
                            newfused_gps.class.getName());

                    boolean check = isMyServiceRunning(sqlitewraper.context,
                            newfused.class.getName());

                    if (check) {

                        Intent i = new Intent(sqlitewraper.context, newfused.class);
                        sqlitewraper.context.stopService(i);

                    }

                    if (check_gps) {

                        Intent i = new Intent(sqlitewraper.context, newfused_gps.class);
                        sqlitewraper.context.stopService(i);

                    }


                } else if (gps.equalsIgnoreCase("1") || gps.equalsIgnoreCase("2")) {

                    boolean check = isMyServiceRunning(sqlitewraper.context,
                            newfused.class.getName());
                    if (!check) {

                        Intent i = new Intent(sqlitewraper.context,
                                newfused.class);
                        sqlitewraper.context.startService(i);
                        // GPSTracker gps = new
                        // GPSTracker(sqlitewraper.context);

                    }


                } else if (gps.equalsIgnoreCase("2")) {

                    boolean check = isMyServiceRunning(sqlitewraper.context,
                            newfused.class.getName());
                    if (check) {

                    } else {

                        Intent i = new Intent(sqlitewraper.context,
                                newfused.class);
                        sqlitewraper.context.startService(i);
                        // GPSTracker gps = new
                        // GPSTracker(sqlitewraper.context);

                    }

                }

            }
            a_t12.close();

        }


        Cursor a_t1 = database.rawQuery(
                "select value from APP_states where ITEAM ='nick'", null);
        a_t1.moveToFirst();
        String username;
        if (a_t1.getCount() > 0) {
            username = a_t1.getString(0);
//            sqlitewraper.preferences.put("u_name", username);
//            editor.putString("u_name", username);
//            editor.commit();

            //for new Auth without Encryption
            MySharedPreferences pref12 = sqlitewraper.preferences;
            pref12.putString("u_name", username); // Saving string
            pref12.commit();

        }
        a_t1.close();


        //saving thresold value to sharedprefenes from table
        Cursor a_t2 = database
                .rawQuery(
                        "select speed,normal_acc,normal_deacc,hard_acc,hard_deacc,gap_milli from Thresold",
                        null);
        a_t2.moveToFirst();

        if (a_t2.getCount() > 0) {

            String speed, normal_acc, normal_deacc, hard_acc, hard_deacc, gap_milli;
            speed = a_t2.getString(0);
            normal_acc = a_t2.getString(1);
            normal_deacc = a_t2.getString(2);
            hard_acc = a_t2.getString(3);
            hard_deacc = a_t2.getString(4);
            gap_milli = a_t2.getString(5);

            // String isact_track = d.getFeatureFlag("isact_track");


            pref = sqlitewraper.getSecureShared("MyPref");
//            editor = pref.edit();

            pref.putString("speed_limit", speed);
            pref.putString("normal_acc", normal_acc);
            pref.putString("normal_deacc", normal_deacc);
            pref.putString("hard_acc", hard_acc);
            pref.putString("hard_deacc", hard_deacc);
            pref.putString("gap_milli", gap_milli);
            pref.commit();


        }
        a_t2.close();

        //start activity recognization service
        Cursor a_t3 = database.rawQuery(
                "select istrip,isact_track,isloc_track from Features", null);
        a_t3.moveToFirst();

        if (a_t3.getCount() > 0) {

            String istrip, isspeed, isact_track, isloc_track;
            istrip = a_t3.getString(0);

            isact_track = a_t3.getString(1);
            isloc_track = a_t3.getString(2);

            if (isact_track.equalsIgnoreCase("1")) {

                boolean check4 = isMyServiceRunning(sqlitewraper.context,
                        Activity_recognition.class.getName());
                if (!check4) {

                    Intent i = new Intent(sqlitewraper.context,
                            Activity_recognition.class);
                    sqlitewraper.context.startService(i);

                }
            }

            pref.putString("istrip", istrip);
            pref.putString("isact_track", isact_track);
            pref.putString("isloc_track", isloc_track);
            pref.commit();

        }
        a_t3.close();

    }

    //function for checking if service is running or not
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
}