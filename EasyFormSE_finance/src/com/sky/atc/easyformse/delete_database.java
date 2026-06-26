package com.sky.atc.easyformse;

import android.app.ActivityManager;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.SharedPreferences.Editor;
import android.database.Cursor;

import net.sqlcipher.database.SQLiteDatabase;

import android.os.Environment;
import android.util.Log;
import android.widget.Toast;

import com.commonsware.cwac.wakeful.WakefulIntentService;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.download.DownloadListService;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;
import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.nio.channels.FileChannel;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

import static com.sky.atc.easyformse.sqlitewraper.context;

//plugin to delete the database during user swap
@StringFogIgnore
public class delete_database extends CordovaPlugin {

    private static final String TAG = "maulik";
    private static final String args1 = "nck";
    JSONObject json;
    int gps;
    Long diff_time;
    SharedPreferences pref;
    CallbackContext callback;
    int gprs;
    Editor editor;
    private SQLiteDatabase database;

    @Override
    public boolean execute(String action, org.apache.cordova.CordovaArgs args,
                           CallbackContext callbackContext)
            throws org.json.JSONException {
        int flag = 0;

        String packageName = cordova.getActivity().getPackageName();

        database = sqlitewraper.getDatabase();
        Intent downloadListServiceIntent = new Intent(context,DownloadListService.class);
        this.cordova.getActivity().stopService(downloadListServiceIntent);
        Cursor c = database
                .rawQuery(
                        "select tid,siteid,checksheetid,height,tower_type,server_task_id,status,step from task_master where flag='1' ",
                        null);

        if (c.getCount() > 0) {
            flag = 1;

            Log.e("task_master_flag", String.valueOf(flag));

        }

        cursour_close(c);

        c = database
                .rawQuery(
                        "select fid,f_name,f_data,f_key,f_value,f_type,c_type from f_master where flag='0'",
                        null);
        if (c.getCount() > 0) {
            flag = 1;
            Log.e("f_master_flag", String.valueOf(flag));
        }

        cursour_close(c);

        c = database
                .rawQuery(
                        "select pid,p_name,p_url,p_key,p_value,p_type,it_id,que_id,checksheetid from p_master where flag='0' ",
                        null);

        if (c.getCount() > 0) {
            flag = 1;
            Log.e("p_master_flag", String.valueOf(flag));
        }

        cursour_close(c);

        c = database
                .rawQuery(
                        "select tid,siteid,checksheetid,height,tower_type,server_task_id,status,step,moduledef,global_var,tid_n,moduleid from task_master_history where flag='1'",
                        null);

        if (c.getCount() > 0) {
            flag = 1;
            Log.e("history_flag", String.valueOf(flag));
        }

        cursour_close(c);

        if (flag == 1) {
            boolean check = isMyServiceRunning(sqlitewraper.context,
                    f_upload_new_structure.class.getName());
            if (!check) {
                Intent z_n12 = new Intent(sqlitewraper.context,
                        f_upload_new_structure.class);
                WakefulIntentService.sendWakefulWork(sqlitewraper.context,
                        z_n12);
            }

            callbackContext.sendPluginResult(new PluginResult(
                    PluginResult.Status.ERROR));

        }

        update_tables("1");
        update_tables("2");
        update_tables("3");
        update_tables("4");
        update_tables("5");
//For update username on GCM_master
        String t = "_id==1";
        ContentValues gcm = new ContentValues();
        gcm.put("flag", "0");
        long insert = database.update("gcm_server", gcm, t, null);
        if (flag == 0) {

            try {


                database.delete("Login_Master", null, null);
                database.execSQL("delete from sqlite_sequence where name='Login_Master'");
                database.delete("task_master", null, null);
                database.execSQL("delete from sqlite_sequence where name='task_master'");
                database.delete("flow_master", null, null);
                database.execSQL("delete from sqlite_sequence where name='flow_master'");
                database.delete("User_Define_Flow_Master", null, null);
                database.execSQL("delete from sqlite_sequence where name='User_Define_Flow_Master'");
                database.delete("download_counter", null, null);
                database.execSQL("delete from sqlite_sequence where name='download_counter'");
                database.delete("location_log", null, null);
                database.execSQL("delete from sqlite_sequence where name='location_log'");
                database.delete("total_file", null, null);
                database.execSQL("delete from sqlite_sequence where name='total_file'");
                database.delete("geofence", null, null);
                database.execSQL("delete from sqlite_sequence where name='geofence'");
                database.delete("checksheet", null, null);
                database.execSQL("delete from sqlite_sequence where name='checksheet'");
                database.delete("p_master", null, null);
                database.execSQL("delete from sqlite_sequence where name='p_master'");
                database.delete("f_master", null, null);
                database.execSQL("delete from sqlite_sequence where name='f_master'");
                database.delete("track_master", null, null);
                database.execSQL("delete from sqlite_sequence where name='track_master'");
                database.delete("task_master_history", null, null);
                database.execSQL("delete from sqlite_sequence where name='task_master_history'");
                database.delete("geoalert", null, null);
                database.execSQL("delete from sqlite_sequence where name='geoalert'");
                database.delete("lat_plug", null, null);
                database.execSQL("delete from sqlite_sequence where name='lat_plug'");
                database.delete("Events", null, null);
                database.execSQL("delete from sqlite_sequence where name='Events'");

                database.delete("geofence_user_tracking_detail", null, null);
                database.execSQL("delete from sqlite_sequence where name='geofence_user_tracking_detail'");
                database.delete("fake_location", null, null);
                database.execSQL("delete from sqlite_sequence where name='fake_location'");
                database.delete("geofence_tracking", null, null);
                database.execSQL("delete from sqlite_sequence where name='geofence_tracking'");
                database.delete("punch_master", null, null);
                database.execSQL("delete from sqlite_sequence where name='punch_master'");
                try {
                    database.delete("act_master", null, null);
                    database.execSQL("delete from sqlite_sequence where name='act_master'");
                } catch (Exception e) {
                    e.printStackTrace();
                }
                database.delete("upload_file_clone", null, null);
                database.execSQL("delete from sqlite_sequence where name='upload_file_clone'");
                database.delete("download_test", null, null);
                database.execSQL("delete from sqlite_sequence where name='download_test'");
                database.delete("download_video", null, null);
                database.execSQL("delete from sqlite_sequence where name='download_video'");
                database.delete("video", null, null);
                database.execSQL("delete from sqlite_sequence where name='video'");
                database.delete("Features", null, null);
                database.execSQL("delete from sqlite_sequence where name='Features'");
                database.delete("Thresold", null, null);
                database.execSQL("delete from sqlite_sequence where name='Thresold'");
                database.delete("Events_check", null, null);
                database.execSQL("delete from sqlite_sequence where name='Events_check'");
                database.delete("meterreading", null, null);
                database.execSQL("delete from sqlite_sequence where name='meterreading'");
                database.delete("geofence_user_tracking_In_Out", null, null);
                database.execSQL("delete from sqlite_sequence where name='geofence_user_tracking_In_Out'");
                database.delete("Thresold_New", null, null);
                database.execSQL("delete from sqlite_sequence where name='Thresold_New'");

            } catch (Exception e) {
                e.printStackTrace();
            }

            String versionName = "NA";
            try {
                versionName = context.getPackageManager()
                        .getPackageInfo(context.getPackageName(), 0).versionName;
                database.execSQL("INSERT INTO Login_Master VALUES('0','0','0','0','0',0,'0','0','android','" + versionName.toString() + "','0','0','0','0');");

            } catch (Exception e) {
                e.printStackTrace();
                Log.d("HELLO", e.getMessage());
            }

            database.execSQL("INSERT INTO download_counter VALUES(1,0,'1','chechsheet',0,0);");
            database.execSQL("INSERT INTO download_counter VALUES(2,0,'1','task_master',0,0);");
            database.execSQL("INSERT INTO download_counter VALUES(3,0,'1','user_define',0,0);");
            database.execSQL("INSERT INTO download_counter VALUES(4,0,'1','flow_master',0,0);");
            database.execSQL("INSERT INTO download_counter VALUES(5,0,'1','flow_counter',0,0);");

            update_tables("1");
            update_tables("2");
            update_tables("3");
            update_tables("4");

            try {
//                context.getSharedPreferences("AttendanceData", Context.MODE_PRIVATE).edit().clear().apply();
                sqlitewraper.getSecureShared("AttendanceData").clear();
               // context.getSharedPreferences("UPDATEPREF", Context.MODE_PRIVATE).edit().clear().apply();
               // context.getSharedPreferences("MyPref", Context.MODE_PRIVATE).edit().clear().apply();
               // context.getSharedPreferences("MY_PREFS_NAME", Context.MODE_PRIVATE).edit().clear().apply();
                //context.getSharedPreferences("pre1", Context.MODE_PRIVATE).edit().clear().apply();
               // context.getSharedPreferences("MY_TRIP", Context.MODE_PRIVATE).edit().clear().apply();

            }
            catch (Exception e)
            {
                Log.d("clear sharepre" , e.getMessage());
            }

            //To programmatically stop the Application
            /** stopping showing force stop dialog as per discussion 30/03/2022 */
           /* Intent intent = new Intent(this.cordova.getActivity(),
                    force_st.class);
            this.cordova.startActivityForResult(this, intent, 0);*/
            // this.cordova.getActivity().stopService(downloadListServiceIntent);

            callbackContext.success("done");


        }

        return true;

    }

    void cursour_close(Cursor c) {
        try {
            c.close();
        } catch (Exception e) {

        }

    }

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

    void update_tables(String id) {

        String t4 = "_id =" + id;
        ContentValues cv4 = new ContentValues();
        cv4.put("total_count", "0");
        cv4.put("globalcounter", "0");

        long temp4 = database.update("download_counter",
                cv4, t4, null);

    }


}
