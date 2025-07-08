package com.sky.atc.easyformse.zoom.firebase;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;
import android.widget.Toast;

import com.android.volley.AuthFailureError;
import com.android.volley.Response;
import com.android.volley.VolleyError;
import com.android.volley.toolbox.JsonObjectRequest;
import com.sky.atc.easyformse.DeviceEventsUtils;
import com.sky.atc.easyformse.datautils.CheckAuthOfApplication;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.plugins.ZoomMeetingPlugin;
import com.sky.atc.easyformse.sqlitewraper;
import com.sky.atc.easyformse.zoom.screenshare.Utils;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;

import io.michaelrocks.paranoid.Obfuscate;

@Obfuscate
public class SendPushNotification {

    private static final String TOPIC = "/topics/sky";
    final private String FCM_API = "https://fcm.googleapis.com/fcm/send";
    //final private String serverKey = "key=" + "AAAArctrOK4:APA91bF_aE3AU5ixZ49YBKp2wmuC1qOjHZrfwyWgKicKwm9tkGYl1Du__9pDzl4dGV48nHmKn9APjEc1TZ1iWR8oCg_qqIA7tjgN-NGJuRUR6CLdYMHImoCX09Yf8ahiy3-g3n_KWOHx";
    //final private String serverKey = "key=" + "AAAACTDfIOY:APA91bGT3-Xo0MkYVhEfsGLtFSovEwlPdYZ13MtNoMRSWGBp0y3-kBXH6PZyAGc1AlM93gQ9Ofw2Ya_LY_6uvdDC_7k3WO1Rvfbm20U-A80AvtnImTKy9uWb0AG8j1wKzeuQgkrirg7P";
    final private String serverKey = "key=" + "AAAAzs0z1Fo:APA91bHl4ku7oBt27uTU1MoZtYydISYKUs_vacBFjwCJB945CMqpUgmdYDif-6TwK17HMHil3P1vNl6t3BRi1nlsmYoe599mgO2esvclcb8l-MounhIa8bUJTuMQx2Yebc1XK_cUlbbr";
    final private String contentType = "application/json";
    //  public static String OpponentFCMID = "fI7vMR4_RgWMMNZAC9kwbB:APA91bGTemt_HsRFn_rM9fUHELIPD46022zghXnOv2XZ6m4WckERBFvGPEbrJnrCimkocFKyW3W4BJlQBbgXx5fKBJtlCOzytykNY7iJypcW32qLTCOAZQpQ5yvfB_AG_-HX1ha9T0uD";
    public static String OpponentFCMID;
    final private String opponetType = "";

    private JSONArray opponentList;

    public void sendNotification(JSONObject notification, final Context context) {

        JsonObjectRequest jsonObjectRequest = new JsonObjectRequest(FCM_API, notification,
                new Response.Listener<JSONObject>() {
                    @Override
                    public void onResponse(JSONObject response) {
                        Log.i("##FIREBASE", "onResquste: " + notification.toString());
                        Log.i("##FIREBASE", "onResponse: " + response.toString());
                    }
                },
                new Response.ErrorListener() {
                    @Override
                    public void onErrorResponse(VolleyError error) {
                        Toast.makeText(context, "Request error", Toast.LENGTH_LONG).show();
                        Log.i("##FIREBASE", "onErrorResponse: " + notification.toString());
                        Log.i("##FIREBASE", "onErrorResponse: Didn't work" + error.getMessage());
                    }
                }) {
            @Override
            public Map<String, String> getHeaders() throws AuthFailureError {
                Map<String, String> params = new HashMap<>();
                params.put("Authorization", serverKey);
                params.put("Content-Type", contentType);
                return params;
            }
        };
        MySingleton.getInstance(context).addToRequestQueue(jsonObjectRequest);
    }

    public void sendNotificationToGroup(String meetingId, String meetingPassword, Context context, String userName, String deviceType) {

        //topic must match with what the receiver subscribed to

//        listOfOpponentToken.add(OpponentFCMID);


        if (deviceType.equalsIgnoreCase("ios")) {
            opponentList = ZoomMeetingPlugin.iosAndroidOpponentArray;
        } else {
            opponentList = ZoomMeetingPlugin.webAndroidOpponentArray;
        }

        JSONObject notification = new JSONObject();
        JSONObject notifcationBody = new JSONObject();
        try {
            notifcationBody.put("title", "Easyform call");
            notifcationBody.put("message", "call");
            notifcationBody.put("id", meetingId);
            notifcationBody.put("password", meetingPassword);
            notifcationBody.put("callfrom", userName);
            notifcationBody.put("email", CheckAuthOfApplication.getEmail());
            notifcationBody.put("role", "0");
            notifcationBody.put("devicetype", "android");

            SharedPreferences sharedPreferences = sqlitewraper.context.getSharedPreferences("FCMTOKEN", Context.MODE_PRIVATE);
            String remoteToken = (sharedPreferences.getString("fcmtoken", "NA"));
            notifcationBody.put("remotetoken", remoteToken);

//            for (int i = 0; i < listOfOpponentToken.size(); i++) {
            notification.put("registration_ids", opponentList);
//                notification.put("collapse_key", "type-a");
            if (deviceType.equalsIgnoreCase("ios")) {
                notification.put("notification", notifcationBody);
            }
            notification.put("data", notifcationBody);
            Log.i("##FIREBASE", "sendNotificationToGroup: " + notification.toString());
            sendNotification(notification, context);
//            }

        } catch (JSONException e) {
            Log.e("TAG", "onCreate: " + e.getMessage());
        }

    }

    public void sendPushToArScreen(String arJson) {

        JSONObject notification = new JSONObject();
        JSONObject notifcationBody = new JSONObject();
        try {
            notifcationBody.put("title", "Easyform message");
            notifcationBody.put("message", "ar");
            notifcationBody.put("arjson", arJson);
            // notification.put("to", OpponentFCMID);
            JSONArray jsonArray = new JSONArray();
            jsonArray.put(OpponentFCMID);
            notification.put("registration_ids", jsonArray);

            notification.put("collapse_key", "type-a");
            if (Utils.screenDeviceType.equalsIgnoreCase("ios")) {
                notification.put("notification", notifcationBody);
            } else {
                notification.put("data", notifcationBody);
            }
        } catch (JSONException e) {
            Log.e("TAG", "onCreate: " + e.getMessage());
        }
        sendNotification(notification, sqlitewraper.context);
    }

    public static int getRealSizeHeight() {
        MySharedPreferences pref = sqlitewraper.getSecureShared("SCREEN_SIZE");
        return Integer.parseInt(pref.getString("MY_HEIGHT", "1280"));
    }

    public static int getRealSizeWidth() {
        MySharedPreferences pref = sqlitewraper.getSecureShared("SCREEN_SIZE");
        return Integer.parseInt(pref.getString("MY_WIDTH", "720"));
    }

    public void sendPushToArScreenToAll(String arJson, String deviceType, String remoteToken) {

        Log.d("##SCREEN_SHARE_MANUAL", arJson);

        JSONObject notification = new JSONObject();
        JSONObject notifcationBody = new JSONObject();
        try {
            notifcationBody.put("title", "Easyform message");
            notifcationBody.put("message", "ar");
            notifcationBody.put("arjson", arJson);
            // notification.put("to", remoteToken);
            JSONArray jsonArray = new JSONArray();
            jsonArray.put(remoteToken);
            notification.put("registration_ids", jsonArray);
            notification.put("data", notifcationBody);
            notification.put("collapse_key", "type-a");
            if (deviceType.equalsIgnoreCase("ios")) {
                notification.put("notification", notifcationBody);
            }
        } catch (JSONException e) {
            Log.e("TAG", "onCreate: " + e.getMessage());
        }
        sendNotification(notification, sqlitewraper.context);
    }

    public void sendPushToArScreen(String arJson, String remoteToken) {

        JSONObject notification = new JSONObject();
        JSONObject notifcationBody = new JSONObject();
        try {
            notifcationBody.put("title", "Easyform message");
            notifcationBody.put("message", "ar");
            notifcationBody.put("arjson", arJson);
            JSONArray jsonArray = new JSONArray();
            jsonArray.put(remoteToken);
            notification.put("registration_ids", jsonArray);
            // notification.put("to", remoteToken);

            notification.put("collapse_key", "type-a");
            if (Utils.screenDeviceType.equalsIgnoreCase("ios")) {
                notification.put("notification", notifcationBody);
            } else {
                notification.put("data", notifcationBody);
            }
        } catch (JSONException e) {
            Log.e("TAG", "onCreate: " + e.getMessage());
        }
        sendNotification(notification, sqlitewraper.context);
    }


    public void sendPushToArScreen(String remoteToken, String deviceType, String aa) {

        JSONObject notification = new JSONObject();
        JSONObject notifcationBody = new JSONObject();
        try {
            notifcationBody.put("title", "Easyform message");
            notifcationBody.put("message", "decline");
            notifcationBody.put("username", DeviceEventsUtils.getLoginDetails().get(3));
            JSONArray jsonArray = new JSONArray();
            jsonArray.put(remoteToken);
            notification.put("registration_ids", jsonArray);
            ;
            // notification.put("to", remoteToken);

            notification.put("collapse_key", "type-a");
            if (deviceType.equalsIgnoreCase("ios")) {
                notification.put("notification", notifcationBody);
            }
            notification.put("data", notifcationBody);
        } catch (JSONException e) {
            Log.e("TAG", "onCreate: " + e.getMessage());
        }
        sendNotification(notification, sqlitewraper.context);
    }


    public void declineScreenShareReq() {

        JSONObject notification = new JSONObject();
        JSONObject notifcationBody = new JSONObject();
        try {
            notifcationBody.put("title", "Easyform message");
            notifcationBody.put("message", "ssharedecline");
            notifcationBody.put("username", DeviceEventsUtils.getLoginDetails().get(3));
            JSONArray jsonArray = new JSONArray();
            jsonArray.put(Utils.screenRemoteToken);
            notification.put("registration_ids", jsonArray);
            // notification.put("to", RemoteUtils.screenRemoteToken);
            String deviceType = Utils.screenDeviceType;

            notification.put("collapse_key", "type-a");
            if (deviceType.equalsIgnoreCase("ios")) {
                notification.put("notification", notifcationBody);
            }
            notification.put("data", notifcationBody);
        } catch (JSONException e) {
            Log.e("TAG", "onCreate: " + e.getMessage());
        }
        sendNotification(notification, sqlitewraper.context);
    }

    public void sendNotificationToSingleUser(String meetingId, String meetingPassword, Context context, String userName, String deviceType, String userToken) {


        JSONObject notification = new JSONObject();
        JSONObject notifcationBody = new JSONObject();
        try {
            notifcationBody.put("title", "Easyform call");
            notifcationBody.put("message", "call");
            notifcationBody.put("id", meetingId);
            notifcationBody.put("password", meetingPassword);
            notifcationBody.put("callfrom", userName);
            notifcationBody.put("email", CheckAuthOfApplication.getEmail());
            notifcationBody.put("role", "0");
            notifcationBody.put("devicetype", "android");

            SharedPreferences sharedPreferences = sqlitewraper.context.getSharedPreferences("FCMTOKEN", Context.MODE_PRIVATE);
            String remoteToken = (sharedPreferences.getString("fcmtoken", "NA"));
            notifcationBody.put("remotetoken", remoteToken);

            //notification.put("to", userToken);
            JSONArray jsonArray = new JSONArray();
            jsonArray.put(userToken);
            notification.put("registration_ids", jsonArray);
            if (deviceType.equalsIgnoreCase("ios")) {
                notification.put("notification", notifcationBody);
            }
            notification.put("data", notifcationBody);
            sendNotification(notification, context);

        } catch (JSONException e) {
            Log.e("TAG", "onCreate: " + e.getMessage());
        }

    }


}
