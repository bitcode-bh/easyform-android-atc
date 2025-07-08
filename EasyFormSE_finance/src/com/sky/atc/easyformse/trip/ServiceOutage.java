package com.sky.atc.easyformse.trip;

import android.annotation.SuppressLint;
import android.app.AlertDialog;
import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import android.util.Log;

import com.sky.atc.easyformse.sqlitewraper;

import net.sqlcipher.database.SQLiteDatabase;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

import io.michaelrocks.paranoid.Obfuscate;

import static com.sky.atc.easyformse.sqlitewraper.context;

//Calculate service outage for trips
@Obfuscate
public class ServiceOutage {


    public static ArrayList<String> getserviceoutage(){
        ArrayList<java.lang.String> arrayList1 = new ArrayList<>();
        SQLiteDatabase database;
        String serviceduration = null;
        String tid = null;
        database = sqlitewraper.getDatabase();
            Cursor c2 = database
                    .rawQuery(
                            "select dv_eve,min_milli,max_milli,tid from lat_plug where sid!=0 and trip_shflag='1' and serviceoutage_flag='0' ", null);
            c2.moveToFirst();

            int j2 = c2.getCount();

            if (j2 > 0) {

                for (int j = 0; j < j2; j++) {

                    String deviceEvent = c2.getString(0);
                    String min_milli = c2.getString(1);
                    String max_milli = c2.getString(2);
                     tid = c2.getString(3);

                    if (deviceEvent != null && !deviceEvent.equalsIgnoreCase("")) {

                        JSONObject jsonObject;

                        try {

                            JSONArray jsonArray = new JSONArray(deviceEvent);

                            for (int i = 0; i < jsonArray.length(); i++) {

                                jsonObject = jsonArray.getJSONObject(i);

                                String eventtype = jsonObject.getString("Event_type");

                                if (eventtype.equalsIgnoreCase("Service_outage")) {

                                     serviceduration = jsonObject.getString("Event_duration");

                                     if(serviceduration==null){
                                         serviceduration = "0";
                                     }

                                   

//                                    if ((Float.parseFloat(serviceduration) > 300000)) {
//
//                                        return serviceduration;
//
//                                    }
                                }
                            }

                        } catch (JSONException e) {
                            e.printStackTrace();
                        }
                    }
                    c2.moveToNext();
                }
            }
            c2.close();

            if(serviceduration == null && tid == null){

                serviceduration = "0";
                tid = "0";

            }

         arrayList1.add(serviceduration);
         arrayList1.add(tid);

        return arrayList1;
    }

}
