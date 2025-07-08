package com.sky.atc.easyformse;

import android.app.Activity;
import android.content.ContentValues;
import android.content.Intent;
import android.content.SharedPreferences;
import android.database.Cursor;
import android.os.Build;
import android.util.Log;

import com.commonsware.cwac.wakeful.WakefulIntentService;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.trip.LocationOutageUtils;
import com.sky.atc.easyformse.trip.TripBackgroundMapActivity;

import net.sqlcipher.database.SQLiteDatabase;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaArgs;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;

import io.michaelrocks.paranoid.Obfuscate;

import static android.content.Context.MODE_PRIVATE;

//Trip plugin to start and end the trip
@Obfuscate
public class TripPlugin extends CordovaPlugin {


    private static final String MY_PREFS_NAME = "MY_TRIP";
    public CallbackContext callbackContext;
    SQLiteDatabase database;
    String action;
    CordovaArgs args;
    MySharedPreferences editor;
    String stillviolation_event;
    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {

        this.callbackContext = callbackContext;

        database = sqlitewraper.getDatabase();
        try {
            String tid = null;
            String status = null;
            String odometerpoint = null;
            String eta = "true";
            try {
                tid = args.getJSONObject(0).getString("tid");
                status = args.getJSONObject(0).getString("trip_status");
                odometerpoint = args.getJSONObject(0).getString("odometer_point");

                try{
                    stillviolation_event = args.getJSONObject(0).getString("stillviolation_event");
                }
                catch (Exception e)
                {
                    stillviolation_event = "false";
                }


                if (odometerpoint.equalsIgnoreCase("[]")) {
                    odometerpoint = "0";
                }

                try {
                    eta = args.getJSONObject(0).getString("ETA");
                }catch (Exception e){
                    eta="true";
                }


                Cursor c3 = database.rawQuery(
                        "SELECT tid from task_master where tid="+tid, null);
                c3.moveToLast();

                if(c3.getCount() == 0){
                    this.callbackContext.error("Invalid tid");
                }else {
                    editor = sqlitewraper.getSecureShared(MY_PREFS_NAME);
                    editor.putString("tid", tid);
                    editor.putString("stillviolation_event",stillviolation_event);
                    editor.commit();
//                latPlugUpdate(tid, status);
                    //Once trip is insertd from TripMapUi the result will be received onActivityResult
                    //ph_s.startmap = true;

                    MySharedPreferences pref;
                    pref = sqlitewraper.getSecureShared("CHECKFIRSTTIMEPERMISSION");
                    String checkpermissionfirstattempt = pref.getString("CHECKFIRSTTIMEPERMISSION", "0");
                    if(checkpermissionfirstattempt.equalsIgnoreCase("0"))
                    {
                        pref = sqlitewraper.getSecureShared("Firsttime_Xiaomi");
                        pref.putString("Firsttime_Xiaomi", "0"); // Saving string
                        pref.commit();
                    }
//                    when task delete and trip start handle status -1 update lat_plug and remove pip mode 01042025
                    if(status.equalsIgnoreCase("-1"))
                    {
                        if (tripStatus() > 0)
                        {
                            String t;
                            t = "tid='" + tid + "' and trip_status='" + 0 + "'";
                            ContentValues latc = new ContentValues();
                            latc.put("trip_status", "1");
                            latc.put("trip_shflag", "1");
                            latc.put("max_milli", System.currentTimeMillis());
                            latc.put("llat", "");
                            latc.put("llon", "");

                            long temp = database.update("lat_plug", latc, t, null);
                            Log.d("##TripUpdate", String.valueOf(temp));

                        }

                        pref = sqlitewraper.getSecureShared("MyPref");
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
                                    // System.exit(0);
                                }
                            }
                        }

                    }
                    else {

                        if(status.equalsIgnoreCase("0"))
                        {

                            String siteLng = "0";
                            String siteLat = "0";
                            String sid = "0";
                            String millisecond = "0";
                            String step_id = "1";
                            String checkid = "0";
                            String s_lat = "0";
                            String s_lon = "0";

                            String unique_trip_id = null;
                            String site_name = null;
                            String matchKeyID = null;

                            net.sqlcipher.Cursor c1 = database
                                    .rawQuery(
                                            "select lat,long,server_task_id,millisecond,checksheetid,site_name,match_temp_id from task_master where tid="
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

                            net.sqlcipher.Cursor c4 = database.rawQuery(
                                    "SELECT appid FROM  Login_Master", null);

                            c4.moveToFirst();
                            int count3 = c4.getCount();

                            if (count3 > 0) {
                                unique_trip_id = c4.getString(0);
                            }

                            unique_trip_id = unique_trip_id + "_" + System.currentTimeMillis();
                            c4.close();

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
                            latc.put("odometer_point", odometerpoint);
                            latc.put("trip_status", status);
                            latc.put("site_name", site_name);
                            latc.put("sh_path", "");
                            latc.put("ac_path", "");
                            latc.put("Event", "");
                            latc.put("etaflag", eta);
                            latc.put("match_temp_id", matchKeyID);
                            latc.put("min_milli", System.currentTimeMillis());


                            net.sqlcipher.Cursor c5 = database
                                    .rawQuery(
                                            "select s_lat,s_lon,llat,llon from lat_plug where trip_shflag=0 and tid='" + tid + "'", null);
                            c5.moveToFirst();
                            int j2 = c5.getCount();
                            // first insert lat_plug after open trip map ui
                            if (j2 > 0) {
                                String t;
                                t = "tid='" + tid + "' and trip_status='" + 0 + "'";
                                long temp = database.update("lat_plug", latc, t, null);
                            }
                            else {
                                long temp = database.insert("lat_plug", null, latc);
                            }
                            c5.close();
                        }

                        Intent i2 = new Intent(sqlitewraper.context, TripMapUi.class);
                        i2.putExtra("tid", tid);
                        i2.putExtra("tripstatus", status);
                        i2.putExtra("odometer_point", odometerpoint);
                        i2.putExtra("ETA", eta);
                        this.cordova.startActivityForResult(this, i2, 104);
                    }


                }
                c3.close();

            } catch (Exception e) {
                e.printStackTrace();
            }

        } catch (Exception e) {
            this.callbackContext.error(e.getMessage());
        }

        return true;

    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent intent) {
        super.onActivityResult(requestCode, resultCode, intent);
        if (requestCode == 104) {

            try {
                if (callbackContext != null) {

                    if (resultCode == Activity.RESULT_OK) {

                        this.callbackContext.success("sucess");

                    } else {

                        this.callbackContext.error("error");
                    }
                } else {

                    DeviceEventsUtils.isFinishActivitiesOptionEnabled(sqlitewraper.context);
                }
            } catch (Exception e) {

                DeviceEventsUtils.isFinishActivitiesOptionEnabled(sqlitewraper.context);
            }
        }
    }

    private int tripStatus(){

        Cursor tripflag = database.rawQuery(
                "select * from lat_plug where trip_status = 0", null);
        tripflag.moveToFirst();
        int tripflagCount = tripflag.getCount();
        tripflag.close();
        return tripflagCount;
    }
}
