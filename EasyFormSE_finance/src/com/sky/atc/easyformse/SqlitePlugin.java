package com.sky.atc.easyformse;

import android.app.ActivityManager;
import android.app.ActivityManager.RunningServiceInfo;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;

import net.sqlcipher.database.SQLiteDatabase;

import android.util.Log;

import com.commonsware.cwac.wakeful.WakefulIntentService;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.download.ImageDownloadService;
import com.sky.atc.easyformse.trip.FloatingBubbleService;
import com.sky.atc.easyformse.trip.TripBackgroundMapActivity;
import com.sky.atc.easyformse.trip.TripMapUtils;

import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;
import org.apache.cordova.PluginResult.Status;
import org.json.JSONObject;

import java.util.ArrayList;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

@StringFogIgnore
public class SqlitePlugin extends CordovaPlugin {

    private static final String TAG = "SqlitePlugin";
    private static final String CREATE_DB_ACTION = "createDatabase";
    private static final String SHOW_DB_VALUES_ACTION = "showValues";
    private static final String insertValuse = "insertValuse";
    int gps;
    JSONObject json;
    MySharedPreferences pref;
    Context c1;
    //    Editor editor;
    SQLiteDatabase database;
    private String lat_status_flag = "k2";
    private long lat_status_in = 0;
    private long lat_status_out = 0;

    // JSONArray args;
    @Override
    public boolean execute(String action, org.apache.cordova.CordovaArgs args,
                           org.apache.cordova.CallbackContext callbackContext)
            throws org.json.JSONException {

        if ("formDraft".equals(action)) {
            final JSONObject request = args.getJSONObject(0);
            cordova.getThreadPool().execute(() -> {
                try {
                    callbackContext.success(FormDraftStore.run(sqlitewraper.getDatabase(), request));
                } catch (Exception error) {
                    // Never expose SQL, field contents or account identifiers in a popup/log.
                    callbackContext.error("draft-unavailable");
                }
            });
            return true;
        }

        c1 = this.cordova.getActivity();
        pref = sqlitewraper.getSecureShared("MyPref");
//        editor = pref.edit();


        //For the use of Brodcast the location from new_fused service with action "Location"
        try {
            lat_status_flag = pref.getString("lat_status_flag", "k2");
            lat_status_in = pref.getLong("lat_status_in", 0);
            lat_status_out = pref.getLong("lat_status_out", 0);
        } catch (Exception e) {
            e.printStackTrace();
        }

        Log.i(TAG, "Plugin Called");
        PluginResult result = null;
        ArrayList<JSONObject> list = new ArrayList<JSONObject>();
        // database = sqlitewraper.getDatabase();


        //To Exit from Application
        if (action.equalsIgnoreCase("exitapp")) {
            // trip start and check flag after open trip map exit app time
             if (DeviceEventsUtils.liveTripCount() > 0)
             {
                 if (TripMapUtils.TRIPMAPBACK.equalsIgnoreCase("true"))
                 {
                     boolean check = DeviceEventsUtils.isMyServiceRunning(sqlitewraper.context,
                             FloatingBubbleService.class.getName());

                     if(check)
                     {
                         cordova.getActivity().finish();
                     }
                     else {
                         cordova.getActivity().finish();
                         Intent mintent = new Intent(sqlitewraper.context, TripBackgroundMapActivity.class);
                         mintent.putExtra("IsOpenMAP","0");
                         cordova.getActivity().startActivity(mintent);
                     }

                 }
                 else {
                     Intent intent = new Intent(sqlitewraper.context, MainActivity.class);
                     intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
                     intent.putExtra("EXIT", true);
                     cordova.getActivity().startActivity(intent);
                 }
            }
            else {
            Intent intent = new Intent(sqlitewraper.context, MainActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
            intent.putExtra("EXIT", true);
            cordova.getActivity().startActivity(intent);
            }

        }

        //For the use of Brodcast the location from new_fused service with action "Location"
        if (lat_status_flag.equalsIgnoreCase("k2")) {
            pref.putString("lat_status_flag", "0");
            pref.putLong("lat_status_in", System.currentTimeMillis());
            pref.putLong("lat_status_out", System.currentTimeMillis());
            // Saving string
            pref.commit();

        }
        //start the newfused location service
        if (lat_status_flag.equalsIgnoreCase("0")) {
            database = sqlitewraper.getDatabase();

            Cursor a_t12 = database.rawQuery(
                    "select value from APP_states where ITEAM ='gps'", null);
            a_t12.moveToFirst();
            int j1 = a_t12.getCount();

            String gps = null;
            if (a_t12.getCount() > 0) {

                gps = a_t12.getString(0);

                if (gps.equalsIgnoreCase("1")) {

                    call();
                }
                a_t12.close();
            }

        } else if (System.currentTimeMillis() - lat_status_out > 30000) {
            pref.putString("lat_status_flag", "0");
            pref.commit();
            // call();

        }

        if (CREATE_DB_ACTION.equals(action)) {
            Log.d(TAG, "CREATE_DB_ACTION");

        } else if (SHOW_DB_VALUES_ACTION.equals(action)) {

            sql_class s = new sql_class(action, args, c1, callbackContext);
            cordova.getThreadPool().execute(s);

        } else if (insertValuse.equals(action)) {
            Log.i(TAG, "insert sql");
            sql_class s = new sql_class(action, args, c1, callbackContext);
            cordova.getThreadPool().execute(s);

        } else if (action.equalsIgnoreCase("step")) {

            Intent i_ch2 = new Intent(sqlitewraper.context, f_upload_new_structure.class);
            WakefulIntentService.sendWakefulWork(sqlitewraper.context, i_ch2);
            callbackContext.sendPluginResult(new PluginResult(
                    PluginResult.Status.OK, ""));


        } else if (action.equalsIgnoreCase("photo")) {


            Intent i_ch2 = new Intent(sqlitewraper.context, f_upload_new_structure.class);
            WakefulIntentService.sendWakefulWork(sqlitewraper.context, i_ch2);
            callbackContext.sendPluginResult(new PluginResult(
                    PluginResult.Status.OK, ""));

        } else if (action.equalsIgnoreCase("technician_data")) {

            //upload call
            Intent i_ch2 = new Intent(sqlitewraper.context, f_upload_new_structure.class);
            WakefulIntentService.sendWakefulWork(sqlitewraper.context, i_ch2);
            callbackContext.sendPluginResult(new PluginResult(
                    PluginResult.Status.OK, ""));

        } else if (action.equalsIgnoreCase("login_detail_plug1")) {
            //login
            login_plug l = new login_plug(action, args, c1, callbackContext);
            cordova.getThreadPool().execute(l);
        } else if (action.equalsIgnoreCase("shared")) {
            sql_class s = new sql_class(action, args, c1, callbackContext);
            cordova.getThreadPool().execute(s);

        } else if (action.equalsIgnoreCase("sh_path_plug")) {
            //Not in Use
//            sh_path_plug s = new sh_path_plug(action, args, c1, callbackContext);
//            cordova.getThreadPool().execute(s);

        } else if (action.equalsIgnoreCase("cntct_info")) {
            //Support Contact information from server
            cntct_info c12 = new cntct_info(action, args, c1, callbackContext);
            cordova.getThreadPool().execute(c12);

        } else {
            result = new PluginResult(Status.INVALID_ACTION);
            callbackContext.sendPluginResult(result);
            Log.d(TAG, "Invalid action : " + action + " passed");
        }

        return true;
    }

    //to service running or not

    void call() {

        database = sqlitewraper.getDatabase();

        Cursor a_t = database.rawQuery(
                "select value from APP_states where ITEAM ='nick'", null);
        a_t.moveToFirst();
        String username = null;
        if (a_t.getCount() > 0) {

            username = a_t.getString(0);
        }

        a_t.close();

        if (!username.equalsIgnoreCase("0")) {
            boolean check = DeviceEventsUtils.isMyServiceRunning(sqlitewraper.context,
                    newfused.class.getName());
            if (!check) {

                Intent i = new Intent(sqlitewraper.context, newfused.class);
                cordova.getActivity().startService(i);
            }

        }
    }


}
