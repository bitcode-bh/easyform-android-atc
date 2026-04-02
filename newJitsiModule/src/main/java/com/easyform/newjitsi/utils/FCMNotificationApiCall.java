package com.easyform.newjitsi.utils;


import static android.content.ContentValues.TAG;

import android.os.StrictMode;
import android.util.Log;

import com.easyform.newjitsi.network.Apis;
import com.easyform.newjitsi.network.Models.AccessToken;
import com.easyform.newjitsi.network.RetrofitClient;
import com.easyform.newjitsi.network.requests.notifcation.FirebaseRequest;
import com.easyform.newjitsi.network.requests.notifcation.FirebaseRequestData;
import com.easyform.newjitsi.network.response.notifcation.FirebaseResponse;
import com.google.gson.Gson;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;

import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import retrofit2.Call;
import retrofit2.http.Headers;
import retrofit2.http.POST;

public class FCMNotificationApiCall {

//    public static Call<FirebaseResponse> sendNotification(FirebaseRequest firebaseRequest) {
//        return RetrofitClient.getApiServices().sendNotification(Apis.FCMURL, "application/json",
//                Apis.authorization,
//                firebaseRequest);
//    }

    public static void sendNotification(FirebaseRequestData data, String token, boolean isiOS) throws Exception {
        String jwtToken = null;
        String accessToken = null;
        try {
            StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
            StrictMode.setThreadPolicy(policy);
            jwtToken = AccessToken.generateJWT(AccessToken.keyWithoutHeaders, AccessToken.client_email);

            if (jwtToken != null && !jwtToken.isEmpty()) {
                accessToken = AccessToken.getAccessToken(jwtToken);
            }
        } catch (Exception e) {

            Log.e(TAG, "Error generating JWT or access token: " + e.getMessage());
            return;
        }

        if (accessToken == null || accessToken.isEmpty()) {
            Log.e(TAG, "Failed to get access token.");
            return;
        }


        Map<String, Object> message = new HashMap<>();
        Map<String, Object> messageContent = new HashMap<>();

        messageContent.put("token", token);  // from your FirebaseRequestData

        if (data.getDevice_type().equalsIgnoreCase("ios")) {
            Map<String, String> notification = new HashMap<>();
            notification.put("title", data.getTitle());
            notification.put("body", data.getBody());
            messageContent.put("notification", notification);
        }
        Map<String, String> dataPayload = new HashMap<>();
        dataPayload.put("title", data.getTitle());
        dataPayload.put("arjson", data.getArjson());
        dataPayload.put("body", data.getBody());
        dataPayload.put("keyType", data.getKeyType());
        if(data.getArgs() != null)
        {
            dataPayload.put("args", data.getArgs());
        }
        dataPayload.put("call_type", data.getCall_type());
        dataPayload.put("userId", data.getUserId());
        dataPayload.put("task_id", data.getTaskId());
        dataPayload.put("message", data.getMessage());
        dataPayload.put("callfrom", data.getCallfrom());
        dataPayload.put("roomName", data.getRoomName());
        dataPayload.put("remotetoken", data.getRemotetoken());
        dataPayload.put("videocallType", data.getVideocallType());
        dataPayload.put("role", data.getRole());
        dataPayload.put("senderfcmid", data.getSenderfcmid());
        dataPayload.put("click_action", data.getClick_action());
        dataPayload.put("webpush", data.getWebpush());
        dataPayload.put("devicetype", data.getDevice_type());
        dataPayload.put("actions", "[{ \"action\": \"accept\", \"title\": \"Accept\" }, { \"action\": \"reject\", \"title\": \"Reject\" }]");

        if(data.getVideocallType().equalsIgnoreCase("jitsimeetScreenShare"))
        {
            dataPayload.put("screenShear", data.getScreenShear().toString());
        }
        if(data.getVideocallType().equalsIgnoreCase("ARDAW") || data.getVideocallType().equalsIgnoreCase("jitsicallPhotoId") || data.getVideocallType().equalsIgnoreCase("screenshot"))
        {
            dataPayload.put("keytype", data.getKeyType());
            dataPayload.put("jsonData", data.getJsonData());
        }


        messageContent.put("data", dataPayload);

        message.put("message", messageContent);

        String json = new Gson().toJson(message);


        OkHttpClient client = new OkHttpClient();
        RequestBody body = RequestBody.create(json, MediaType.parse("application/json"));
        Request request = new Request.Builder()
                .url(Apis.FCMURL)
                .addHeader("Authorization", "Bearer " + accessToken)
                .addHeader("Content-Type", "application/json")
                .post(body)
                .build();

        Response response = client.newCall(request).execute();
        if (!response.isSuccessful()) {
            System.out.println("❌ Error sending notification: " + json + response.body().string());
        } else {
            System.out.println("✅ Notification sent: " + json + response.body().string());
        }
    }

}
