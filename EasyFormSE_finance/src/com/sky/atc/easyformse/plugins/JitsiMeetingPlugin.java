package com.sky.atc.easyformse.plugins;


import android.content.Intent;
import android.content.IntentFilter;
import android.util.Log;


import com.sky.atc.easyformse.B_new;
import com.sky.atc.easyformse.BuildConfig;
import com.sky.atc.easyformse.DeviceEventsUtils;
import com.sky.atc.easyformse.R;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.sqlitewraper;


import net.sqlcipher.database.SQLiteDatabase;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;

/**
 * Created by NareshChocha on 7/30/2021.
 */
public class JitsiMeetingPlugin extends CordovaPlugin {
    static SQLiteDatabase database = sqlitewraper.getDatabase();
    public static final String JitsiPluginBroadcastClass = "com.easyform.jitsi.broadcasts.JitsiPluginBroadcast";

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        //  Log.d("action :: ", action + "");
/*
        IntentFilter filter = new IntentFilter();
        cordova.getActivity().registerReceiver(mLogReceiver, filter);*/


        Intent jitsiPluginBroadcast = null;
        try {
            jitsiPluginBroadcast = new Intent(cordova.getActivity(), Class.forName(JitsiPluginBroadcastClass));
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        }
        android.database.Cursor a_t = database
                .rawQuery(
                        "select server_task_id from task_master where flag=0",
                        null);
        a_t.moveToLast();
        String servertaskid = null;
        if (a_t.getCount() > 0) {
            servertaskid = a_t.getString(0);
            a_t.close();
        }
        if (servertaskid == null) {

            JSONObject jsonObject = args.getJSONObject(0);
            JSONArray jsonArray = jsonObject.getJSONArray("zoom_meeting");
//            JSONObject jsonObject1=jsonObject.getJSONObject("zoom_meeting");
            for (int i = 0; i < jsonArray.length(); i++) {
                JSONObject jsonObject1 = jsonArray.getJSONObject(i);
                servertaskid = jsonObject1.getString("task_id");
            }

//
//
////                servertaskid = args.getJSONObject(0).getString("task_id");
//                servertaskid = args.getJSONObject(0).getString("task_id");
//            } catch (JSONException e) {
//                e.printStackTrace();
//            }
        }
        MySharedPreferences prefs = sqlitewraper.getSecureShared("mypre2");
        String roleid = prefs.getString("authroleidn", "0");
        String companyFeatureid = prefs.getString("authcompanyfid", "0");
        ArrayList<String> loginDetails = DeviceEventsUtils.getLoginDetails();
        ArrayList<String> getfcmdata = DeviceEventsUtils.getFCMID();
        JSONObject userdata = new JSONObject();
        JSONObject auth1 = new JSONObject();
        JSONArray autharray = new JSONArray();
        JSONArray body = new JSONArray();
        JSONObject loginJson = new JSONObject();
        JSONObject webpush = null;
        String link = "https://development.easyform.in/WEB";

        try {
            JSONObject object = new JSONObject();
            object.put("link", link);
            JSONObject jsonObject1 = new JSONObject();
            jsonObject1.put("fcm_options", object);
            webpush = new JSONObject();
            webpush.put("webpush", jsonObject1);
            Log.d("web", String.valueOf(webpush));
        } catch (JSONException e) {
            e.printStackTrace();
        }
        auth1.put("username", loginDetails.get(3));
        auth1.put("u_c", new B_new().GetValue());
        auth1.put("user_id", loginDetails.get(0));
        autharray.put(auth1);
        //GetUserData Json
        userdata.put("company_id", loginDetails.get(4));
        userdata.put("task_id", servertaskid);
        userdata.put("auth1", autharray);
        body.put(userdata);
        if (loginDetails.size() > 4) {
            loginJson.put("appVersion", BuildConfig.VERSION_NAME);
            loginJson.put("userId", loginDetails.get(0));
            loginJson.put("imei", loginDetails.get(1));
            loginJson.put("appId", loginDetails.get(2));
            loginJson.put("username", loginDetails.get(3));
            loginJson.put("companyId", loginDetails.get(4));
            loginJson.put("uc", new B_new().GetValue());
            loginJson.put("servertaskid", servertaskid);
            // Log.d("loginDetails :: ", loginJson.toString() + "");
        }
        String click_action = "click_action: https://development.easyform.in/WEB,";

        String WCFURL = sqlitewraper.context.getResources().getString(R.string.WCFURL) + "JwtToken/JwtToken_String";
        if (jitsiPluginBroadcast != null) {
            jitsiPluginBroadcast.setAction("com.easyform.jitsi.JitsiPluginCall");
            jitsiPluginBroadcast.putExtra("Args", args.toString());
            jitsiPluginBroadcast.putExtra("Url", WCFURL);
            jitsiPluginBroadcast.putExtra("loginJson", loginJson.toString());
            jitsiPluginBroadcast.putExtra("click_action", click_action);
            jitsiPluginBroadcast.putExtra("webpush", String.valueOf(webpush));
            jitsiPluginBroadcast.putExtra("senderfcmid", getfcmdata.get(0));
            jitsiPluginBroadcast.putExtra("getUserData", body.toString());
            jitsiPluginBroadcast.putExtra("auth1", auth1.toString());
            jitsiPluginBroadcast.putExtra("Role_id", loginDetails.get(0));
            jitsiPluginBroadcast.putExtra("companyFeatureid", companyFeatureid);
            jitsiPluginBroadcast.putExtra("body", body.toString());
            Log.d("JSONJITSI", body.toString());
            Log.d("JSONJITSI", autharray.toString());
            Log.d("JSONJITSI", args.toString());

            sqlitewraper.context.sendBroadcast(jitsiPluginBroadcast);
        }
        Log.d("args :: ", args.toString());
        return super.execute(action, args, callbackContext);
    }
}
