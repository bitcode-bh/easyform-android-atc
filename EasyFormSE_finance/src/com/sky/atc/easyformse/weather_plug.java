package com.sky.atc.easyformse;

import java.io.File;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;

import android.content.BroadcastReceiver;

import android.content.Intent;


import net.sqlcipher.database.SQLiteDatabase;

import android.os.Bundle;

import com.nareshchocha.app.weatherapp.ui.activitys.EasyWeatherWeatherActivity;
import com.sky.atc.easyformse.datautils.MySharedPreferences;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;


/**
 * @author Tommy-Carlos Williams, Huge chunks lifted/adapted from the
 * NextworkManager core PhoneGap plugin
 */

// Open Weather application
@StringFogIgnore
public class weather_plug extends CordovaPlugin {

    public static final String TYPE_NONE = "NONE";
    private static final String LOG_TAG = "PhoneListener";

    private String phoneListenerCallbackId;

    BroadcastReceiver receiver;

    public CallbackContext callbackContext;
    MySharedPreferences pref;
    //    Editor editor;
    File f_file_new;
    SQLiteDatabase database;

    @Override
    public boolean execute(String action, JSONArray args,
                           CallbackContext callbackContext) throws JSONException {

        this.callbackContext = callbackContext;
        try{
            database = sqlitewraper.getDatabase();
            // to save storage key and value
            pref = sqlitewraper.getSecureShared("MyPref");

            String lat = args.getJSONObject(0).getString("lat");
            String lon = args.getJSONObject(0).getString("lon");
            String time = args.getJSONObject(0).getString("time");


            String time1 = pref.getString("time_weather", "k2");

            if (!time.equalsIgnoreCase(time1)) {
                this.callbackContext = callbackContext;
                pref.putString("time_weather", time); // Saving string
                pref.commit();
                Intent i = new Intent(this.cordova.getActivity(), Class.forName("com.nareshchocha.app.weatherapp.ui.activitys.EasyWeatherWeatherActivity"));
                i.putExtra("lat", Double.valueOf(lat));
                i.putExtra("lon", Double.valueOf(lon));
                if (this.cordova != null) {
                    this.cordova.startActivityForResult(this, i, 0);
                    return true;
                }
                return false;
            }
        }
        catch (Exception e)
        {
            return false;
        }

        return false;
    }

    public void onActivityResult(int requestCode, int resultCode, Intent intent) {
        switch (requestCode) {
            case 0:
                //                // retour de la version utilisant le sample de imense alpr
                if (resultCode == android.app.Activity.RESULT_OK) { // 0:ok
                    Bundle bundle = intent.getExtras();
                    String status = bundle.getString("status");
                    this.callbackContext.success(status);


                } else {

                    this.callbackContext.error("Error...");
                }

                break;
            default:
                break;
        }
    }
}