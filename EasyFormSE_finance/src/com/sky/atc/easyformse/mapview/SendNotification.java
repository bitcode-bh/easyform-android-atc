package com.sky.atc.easyformse.mapview;

import android.content.Context;
import android.os.StrictMode;
import android.util.Log;

import com.sky.atc.easyformse.utils.JsonPost;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;


@StringFogIgnore
public class SendNotification {

//    private static final String FCM_API = "https://fcm.googleapis.com/fcm/send";
    private static final String FCM_API = "https://fcm.googleapis.com/v1/projects/wipro-86aed/messages:send";
    private static final String serverKey = "key=" + "AAAAzs0z1Fo:APA91bHl4ku7oBt27uTU1MoZtYydISYKUs_vacBFjwCJB945CMqpUgmdYDif-6TwK17HMHil3P1vNl6t3BRi1nlsmYoe599mgO2esvclcb8l-MounhIa8bUJTuMQx2Yebc1XK_cUlbbr";
    private static final String contentType = "application/json";
    private static String TAG = "NOTIFICATION TAG";
    private  static String  jwtToken = null;
    private static String  accessToken = null;
    static  Map<String, String> params;
    private static final ExecutorService  threadPool = Executors.newSingleThreadExecutor();
    public static String notification(Context context, String lat, String lng, String value, String senderid, String receiverid, String companyid) {

        String NOTIFICATION_TITLE;
        String NOTIFICATION_MESSAGE = "";

        NOTIFICATION_TITLE = "EASYFORM NOTIFICATION";
        //send request for new location
        if (value.equalsIgnoreCase("1")) {
            NOTIFICATION_MESSAGE = "";
        }
        //send current LOCATION as reply
        if (value.equalsIgnoreCase("2")) {
            NOTIFICATION_MESSAGE = lat + " " + lng;
        }

        JSONObject notificationMessage = new JSONObject();
        JSONObject notification = new JSONObject();
        JSONObject notifcationBody = new JSONObject();
        JSONObject notifcationandroid = new JSONObject();
        try {
            notifcationBody.put("title", NOTIFICATION_TITLE);
            notifcationBody.put("body", NOTIFICATION_MESSAGE);
            notifcationBody.put("query", "");
            notifcationBody.put("message", "UserLatLong");
            notifcationBody.put("CompanyId", companyid);
            notifcationBody.put("SenderId", senderid);
            notifcationBody.put("ReceiverId", receiverid);

            if (value.equalsIgnoreCase("2"))
            {
                notifcationBody.put("IssendCurrent", "true");
            }
            else {
                notifcationBody.put("IssendCurrent", "false");

            }

            notification.put("token", receiverid);
            notifcationandroid.put("priority", "high");
            notification.put("android",notifcationandroid);
            notification.put("data", notifcationBody);
//            notification.put("priority", "high");
//            notification.put("notification", notifcationBody);
            notificationMessage.put("message",notification);
        } catch (JSONException e) {
            Log.e(TAG, "onCreate: " + e.getMessage());
        }
        sendNotification(notificationMessage, context);
        return "";
    }


    private static void sendNotification(JSONObject notification, Context myContext) {
        // Step 1: Generate JWT token and get access token
        String jwtToken = null;
        String accessToken = null;
        try {
            StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
            StrictMode.setThreadPolicy(policy);
            // Generate JWT token
            jwtToken = AccessToken.generateJWT(AccessToken.keyWithoutHeaders, AccessToken.client_email);

            // Get access token
            if (jwtToken != null && !jwtToken.isEmpty()) {
                accessToken = AccessToken.getAccessToken(jwtToken);
            }
        } catch (Exception e) {

            Log.e(TAG, "Error generating JWT or access token: " + e.getMessage());
            return;  // Exit the method if there's an error generating tokens
        }

        // Step 2: Check if access token is successfully obtained
        if (accessToken == null || accessToken.isEmpty()) {
            Log.e(TAG, "Failed to get access token.");
            return;  // Exit if no access token is available
        }

        // Step 3: Prepare the JSON request headers with access token
        Map<String, String> params = new HashMap<>();
        params.put("Authorization", "Bearer " + accessToken);
        params.put("Content-Type", "application/json");

        // Step 4: Create and send the notification request
        JsonPost.async(FCM_API, params, notification, TAG, null);
    }
}
