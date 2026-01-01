package com.sky.atc.easyformse.plugins;

import android.content.Intent;
import android.content.IntentFilter;
import android.database.Cursor;
import android.util.Log;

import androidx.localbroadcastmanager.content.LocalBroadcastManager;


import com.sky.atc.easyformse.B_new;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.sqlitewraper;
import com.sky.atc.easyformse.zoom.firebase.ZoomBrodcastFromLibrary;

import net.sqlcipher.database.SQLiteDatabase;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

@StringFogIgnore
public class ZoomMeetingPlugin extends CordovaPlugin {

    CallbackContext callbackContext;
    public static JSONArray webAndroidOpponentArray;
    public static JSONArray iosAndroidOpponentArray;


    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        this.callbackContext = callbackContext;

        webAndroidOpponentArray = new JSONArray();
        iosAndroidOpponentArray = new JSONArray();


        try {
            String opponentList = args.getJSONObject(0).getString("zoom_meeting");

            seprateOpponentList(opponentList);
            Log.d("##ZOOM_PLUGIN", "1");
            setParameterToZoomSDK();
            Intent i = new Intent(sqlitewraper.context, Class.forName("com.example.easyformzoom.MainActivityZoom"));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            sqlitewraper.context.startActivity(i);
            this.callbackContext.success();
            Log.d("##ZOOM_PLUGIN", "2");


            ZoomBrodcastFromLibrary zoomReceiver = new ZoomBrodcastFromLibrary();

            LocalBroadcastManager.getInstance(sqlitewraper.context).registerReceiver(zoomReceiver,
                    new IntentFilter("zoom-event-receiver"));

        } catch (Exception e) {
            Log.d("##ZOOM_PLUGIN", "3: " + e.getMessage());
            this.callbackContext.error(e.getMessage());
        }
        return false;
    }

    private void seprateOpponentList(String opponentList) {

        try {
            JSONArray jsonArray = new JSONArray(opponentList);
            for (int i = 0; i < jsonArray.length(); i++) {

                JSONObject jsonObject = jsonArray.getJSONObject(i);
                String fcmid = jsonObject.getString("fcmid");
                String deviceType = jsonObject.getString("device_type");
                String username = jsonObject.getString("username");


                Log.d("##LIST_OF_USER", "USERNAME: " + username + " Device Type:" + deviceType + " FCM ID: " + fcmid);


                if (deviceType.equalsIgnoreCase("")) {
                    deviceType = "android";
                }
                if (deviceType.equalsIgnoreCase("web") || deviceType.equalsIgnoreCase("android")) {
                    webAndroidOpponentArray.put(fcmid);
                } else if (deviceType.equalsIgnoreCase("ios")) {
                    iosAndroidOpponentArray.put(fcmid);
                }

            }
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    private void setParameterToZoomSDK() {

        try {


            SQLiteDatabase database = sqlitewraper.getDatabase();
            Cursor c3 = database.rawQuery("SELECT username,company_id,appid,user_id FROM Login_Master",
                    null);
            c3.moveToLast();

            String username = c3.getString(0);
            int company_id = c3.getInt(1);
            String appid = c3.getString(2);
            String UserId = c3.getString(3);
            c3.close();
            B_new b = new B_new();
            String u_c = b.GetValue();

            MySharedPreferences prefs = sqlitewraper.getSecureShared("mypre2");
            String roleid = prefs.getString("authroleidn", "0");
            String companyFeatureid = prefs.getString("authcompanyfid", "0");
            Intent device = null;
            try {
                device = new Intent(cordova.getActivity(), Class.forName("com.example.easyformzoom.broadcast_receiver.Zoom_Broadcast"));
            } catch (ClassNotFoundException e) {
                e.printStackTrace();
            }
            if (device != null) {
                device.setAction("com.example.easyformzoom.DeviceEventsUtilsZoom");
                device.putExtra("username", username);
                device.putExtra("appid", appid);
                device.putExtra("company_id", String.valueOf(company_id));
                device.putExtra("UserId", UserId);
                device.putExtra("u_c", u_c);
                device.putExtra("roleid", roleid);
                device.putExtra("companyFeatureid", companyFeatureid);
                device.putExtra("iosAndroidOpponentArray", String.valueOf(iosAndroidOpponentArray));
                device.putExtra("webAndroidOpponentArray", String.valueOf(webAndroidOpponentArray));
                cordova.getActivity().sendBroadcast(device);
            }

//            DeviceEventsUtilsZoom.username = username;
//            DeviceEventsUtilsZoom.appid = appid;
//            DeviceEventsUtilsZoom.company_id = String.valueOf(company_id);
//            DeviceEventsUtilsZoom.UserId = UserId;
//            DeviceEventsUtilsZoom.u_c = u_c;
//            DeviceEventsUtilsZoom.roleid = roleid;
//            DeviceEventsUtilsZoom.companyFeatureid = companyFeatureid;
//            DeviceEventsUtilsZoom.iosAndroidOpponentArray = iosAndroidOpponentArray;
//            DeviceEventsUtilsZoom.webAndroidOpponentArray = webAndroidOpponentArray;

        } catch (Exception e) {
            Log.e("##ZOOM_PLUGIN", "4: " + e.getMessage());
        }

    }
}
