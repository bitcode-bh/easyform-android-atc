package com.sky.atc.easyformse.plugins;


import static android.content.Context.MODE_PRIVATE;

import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.provider.Settings;
import android.util.Log;

import com.sky.atc.easyformse.B_new;
import com.sky.atc.easyformse.BuildConfig;
import com.sky.atc.easyformse.DeviceEventsUtils;
import com.sky.atc.easyformse.R;
import com.sky.atc.easyformse.ToastUtil;
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
    public static final String JITSI_PLUGIN_BROADCAST_CLASS = "com.easyform.newjitsi.broadcasts.JitsiPluginBroadcast";
    public static final String JITSI_SCREEN_SHEAR_ACTION = "com.easyform.newjitsi.CustomJitsiMeetActivity.ScreenShear";

    public static final String JITSI_BASE_ACTION = "com.easyform.newjitsi.";
    SharedPreferences sharedPreferences;
    SharedPreferences.Editor editor;
    String task_id;
    String flow_id;
    String site_id;
    private static final int REQUEST_OVERLAY_PERMISSION = 1234;

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        Log.d("JitsiMeetingPlugin args", args.toString());


        Activity activity = cordova.getActivity();
        if (!Settings.canDrawOverlays(activity)) {
            Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + activity.getPackageName()));
            cordova.setActivityResultCallback(this); // Important for receiving result
            activity.startActivityForResult(intent, REQUEST_OVERLAY_PERMISSION);
        }
        else {


            sharedPreferences = this.cordova.getActivity().getSharedPreferences("Jitsiuser", MODE_PRIVATE);
            editor = sharedPreferences.edit();

            try {
                JSONArray jsonArray = new JSONArray(args.toString());
                JSONObject jsonObject = jsonArray.getJSONObject(0);
                JSONArray zoomMeetingArray = jsonObject.getJSONArray("zoom_meeting");
                JSONObject zoomMeetingObj = zoomMeetingArray.getJSONObject(0);
                String username = zoomMeetingObj.getString("username");
                task_id = zoomMeetingObj.getString("task_id");
                flow_id = zoomMeetingObj.getString("flow_id");
                site_id = zoomMeetingObj.getString("site_id");
                editor.putString("call_username", username);
                editor.putString("task_id", task_id);
                editor.commit();
            } catch (Exception e) {
                e.printStackTrace();
            }

            sharedPreferences = this.cordova.getActivity().getSharedPreferences("Jitsi_roomname", MODE_PRIVATE);
            SharedPreferences.Editor meditor = sharedPreferences.edit();
            meditor.clear().commit();

            MySharedPreferences prefs = sqlitewraper.getSecureShared("mypre2");
            String roleid = prefs.getString("authroleidn", "0");
            String companyFeatureid = prefs.getString("authcompanyfid", "0");
            String dateformate = prefs.getString("dateformate","0");
            ArrayList<String> loginDetails = DeviceEventsUtils.getLoginDetails();
            ArrayList<String> loginUserFcmDataList = DeviceEventsUtils.getFCMID();

            JSONObject apiAuth = new JSONObject();
            apiAuth.put("username", loginDetails.get(3));
            apiAuth.put("u_c", new B_new().GetValue());
            apiAuth.put("user_id", loginDetails.get(0));

            JSONObject loginUserData = new JSONObject();
            loginUserData.put("FCM_Token", loginUserFcmDataList.get(0));
            loginUserData.put("UNIQUE_KEY", new B_new().GetValue());
            loginUserData.put("COMPANY_FEATURE_ID", companyFeatureid);
            loginUserData.put("ROLE_ID", roleid);
            loginUserData.put("dateformate",dateformate);


            if (loginDetails.size() > 4) {
                loginUserData.put("USER_ID", loginDetails.get(0));
                loginUserData.put("USERNAME", loginDetails.get(3));
                loginUserData.put("IMEI", loginDetails.get(1));
                loginUserData.put("APP_ID", loginDetails.get(2));
                loginUserData.put("COMPANY_ID", loginDetails.get(4));
                loginUserData.put("APP_VERSION", BuildConfig.VERSION_NAME);
                // loginJson.put("servertaskid", servertaskid); get from arges;
            }

            // create webpush
            JSONObject linkObject = new JSONObject();
            linkObject.put("link", sqlitewraper.context.getResources().getString(R.string.App_URL));
            JSONObject fcmOptionsObject = new JSONObject();
            fcmOptionsObject.put("fcm_options", linkObject);
            JSONObject webpush = new JSONObject();
            webpush.put("webpush", fcmOptionsObject);

            JSONObject otherData = new JSONObject();
            otherData.put("WEB_PUSH", webpush);
            // otherData.put("CLICK_ACTION", "click_action: https://development.easyform.in/WEB,");
            otherData.put("CLICK_ACTION", sqlitewraper.context.getResources().getString(R.string.App_URL));
            otherData.put("WCFURL", sqlitewraper.context.getResources().getString(R.string.WCFURL) + "JwtToken/JwtToken_String");
            otherData.put("USERDATA_FROM_COMPANY_ID_URL", sqlitewraper.context.getResources().getString(R.string.WCFURL) + "WCF_Getuserdata_using_companyid");
            otherData.put("Common_Wcf_Url", sqlitewraper.context.getResources().getString(R.string.Common_Wcf_Url));
            JSONObject jsonObject = args.getJSONObject(0);
            JSONArray zoomMeetingArray = jsonObject.getJSONArray("zoom_meeting");
            otherData.put("server_task_id", zoomMeetingArray.getJSONObject(0).getString("task_id"));
            otherData.put("role_id", zoomMeetingArray.getJSONObject(0).getString("role_id"));
            otherData.put("flow_id", zoomMeetingArray.getJSONObject(0).getString("flow_id"));
            otherData.put("site_id", zoomMeetingArray.getJSONObject(0).getString("site_id"));
            otherData.put("EmailId", zoomMeetingArray.getJSONObject(0).getString("EmailId"));
            otherData.put("start_status", zoomMeetingArray.getJSONObject(0).getString("start_status"));
            otherData.put("user_id", zoomMeetingArray.getJSONObject(0).getString("user_id"));
            otherData.put("udf_id",zoomMeetingArray.getJSONObject(0).getString("udf_id"));

            Intent jitsiPluginBroadcast = null;
            try {
                jitsiPluginBroadcast = new Intent(cordova.getActivity(), Class.forName(JITSI_PLUGIN_BROADCAST_CLASS));
            } catch (ClassNotFoundException e) {
                ToastUtil.show(sqlitewraper.context, "Jitsi Module is Not Added");
                e.printStackTrace();
            }
            if (jitsiPluginBroadcast != null) {
                jitsiPluginBroadcast.setAction(JITSI_BASE_ACTION + "JitsiPluginCall");

                jitsiPluginBroadcast.putExtra("JITSI_MEETING_PLUGIN_ARGS", args.toString());
                jitsiPluginBroadcast.putExtra("API_AUTH", apiAuth.toString());
                jitsiPluginBroadcast.putExtra("LOGIN_USER_DATA", loginUserData.toString());
                jitsiPluginBroadcast.putExtra("OTHER_DATA", otherData.toString());

                Log.d("JitsiMeetingPlugin JITSI_MEETING_PLUGIN_ARGS", args.toString());
                Log.d("JitsiMeetingPlugin API_AUTH", apiAuth.toString());
                Log.d("JitsiMeetingPlugin LOGIN_USER_DATA", loginUserData.toString());
                Log.d("JitsiMeetingPlugin OTHER_DATA", otherData.toString());

                sqlitewraper.context.sendBroadcast(jitsiPluginBroadcast);
            }
        }
        return super.execute(action, args, callbackContext);
    }
}

