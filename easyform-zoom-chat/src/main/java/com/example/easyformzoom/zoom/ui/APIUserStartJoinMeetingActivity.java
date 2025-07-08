package com.example.easyformzoom.zoom.ui;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.StrictMode;
import android.text.TextUtils;
import android.util.Base64;
import android.util.Log;
import android.view.View;
import android.widget.Toast;

import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import com.example.easyformzoom.R;
import com.example.easyformzoom.zoom.App;
import com.example.easyformzoom.zoom.firebase.DeviceEventsUtilsZoom;
import com.example.easyformzoom.zoom.initsdk.AuthConstants;
import com.example.easyformzoom.zoom.inmeetingfunction.customizedmeetingui.MyMeetingActivity;
import com.example.easyformzoom.zoom.inmeetingfunction.customizedmeetingui.SimpleZoomUIDelegate;
import com.example.easyformzoom.zoom.inmeetingfunction.customizedmeetingui.view.MeetingWindowHelper;
import com.example.easyformzoom.zoom.startjoinmeeting.apiuser.ApiUserStartMeetingHelper;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.UnsupportedEncodingException;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.concurrent.TimeUnit;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import javax.net.ssl.HttpsURLConnection;

import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import us.zoom.sdk.InMeetingService;
import us.zoom.sdk.InMeetingUserInfo;
import us.zoom.sdk.MeetingError;
import us.zoom.sdk.MeetingParameter;
import us.zoom.sdk.MeetingService;
import us.zoom.sdk.MeetingServiceListener;
import us.zoom.sdk.MeetingStatus;
import us.zoom.sdk.ZoomSDK;

public class APIUserStartJoinMeetingActivity extends Activity implements AuthConstants, MeetingServiceListener {

    private final static String TAG = "##ZoomSDKExample";

    ZoomSDK mZoomSDK = ZoomSDK.getInstance();
    MeetingService mMeetingService = mZoomSDK.getMeetingService();

    private boolean mbPendingStartMeeting = false;
    private boolean isResumed = false;

    //    private String API_KEY = "slCdZjKoFsbDeIxqNH8h2fHt5IyUMkyCHGzj";
    private String API_KEY = "zspxdNZAQRegt93GyX0kaA";
    // private String API_KEY = "JS4t5B9ZSOWEurOneCLLkg";
    private long EXPIRED_TIME = 30000;
    private String API_SECRET = "yq5c656ndKQ6KrKuR98bp83kKGqvX2uC8kaW";
    // private String API_SECRET = "RZwZ1jjdZyGORT02hTrXhSn4Ue9d8zHOKdrg";
//    private SendPushNotification sendNotificationToGroup;

    String password;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        App.context = this;
        StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
        StrictMode.setThreadPolicy(policy);
        Log.d("##API_USER", "ONCREATE");
        setContentView(R.layout.api_user_start_join);
        registerListener();
        onClickBtnStartMeeting();
    }

    private void registerListener() {
        if (mMeetingService != null) {
            mMeetingService.addListener(this);//register meetingServiceListener
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        isResumed = false;
    }

    @Override
    protected void onResume() {
        super.onResume();
        isResumed = true;
        refreshUI();
        mZoomSDK.getZoomUIService().setZoomUIDelegate(new SimpleZoomUIDelegate() {
            @Override
            public void afterMeetingMinimized(Activity activity) {
//                Intent intent = new Intent(activity, APIUserStartJoinMeetingActivity.class);
//                intent.addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
//                activity.startActivity(intent);
            }
        });
    }

    @Override
    protected void onDestroy() {
        mMeetingService.removeListener(this);//unregister meetingServiceListener
        MeetingWindowHelper.getInstance().removeOverlayListener();
        super.onDestroy();
    }


    public void onClickReturnMeeting(View view) {
        UIUtil.returnToMeeting(this);
    }

    public void onClickSettings(View view) {
        Intent intent = new Intent(this, MeetingSettingActivity.class);
        startActivity(intent);
    }

    public void onClickBtnJoinMeeting() {
        String meetingNo = "";
        String meetingPassword = "";
        String vanityId = "";
        String zak = "";


        try {
            String jwtToken = getJWTToken();

            //jwtToken = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOm51bGwsImlzcyI6IkpTNHQ1QjlaU09XRXVyT25lQ0xMa2ciLCJleHAiOjE2NzcwOTkzNjQsImlhdCI6MTY3NzA5Mzk2NH0.IHY842CGqkGHtsOr-1JKq-CEsCnUCK_91pMg6dzBap8";
            String accessToken = getZoomAccessToken("me", jwtToken);
            String zakToken = getZAKtoken("me", jwtToken);

            meetingNo = "1234567890";
            zak = zakToken;
        } catch (Exception e) {
            e.printStackTrace();
        }


        if (TextUtils.isEmpty(zak)) {
            Toast.makeText(this, "You need to enter zoom access token(zak)", Toast.LENGTH_LONG).show();
            return;
        }


        if (meetingNo.length() == 0 && vanityId.length() == 0) {
            Toast.makeText(this, "You need to enter a meeting number/ vanity id which you want to join.", Toast.LENGTH_LONG).show();
            return;
        }

        if (meetingNo.length() != 0 && vanityId.length() != 0) {
            Toast.makeText(this, "Both meeting number and vanity id have value,  just set one of them", Toast.LENGTH_LONG).show();
            return;
        }

        ZoomSDK zoomSDK = ZoomSDK.getInstance();

        if (!zoomSDK.isInitialized()) {
            Toast.makeText(this, "ZoomSDK has not been initialized successfully", Toast.LENGTH_LONG).show();
            return;
        }

        MeetingService meetingService = zoomSDK.getMeetingService();

        int ret = -1;
        if (vanityId.length() != 0) {
            ret = ApiUserStartMeetingHelper.getInstance().joinMeetingWithVanityId(this, vanityId, meetingPassword, zak);
        } else {
            ret = ApiUserStartMeetingHelper.getInstance().joinMeetingWithNumber(this, meetingNo, meetingPassword, zak);
        }
        Log.i(TAG, "onClickBtnJoinMeeting, ret=" + ret);
    }

    public void onClickBtnStartMeeting() {
        String meetingNo = "";
        String vanityId = "";
        String userId = DeviceEventsUtilsZoom.username;
        String zak = "";
        if (!mZoomSDK.isInitialized()) {
            Toast.makeText(this, "ZoomSDK has not been initialized successfully", Toast.LENGTH_LONG).show();
            return;
        }
        if (mMeetingService.getMeetingStatus() != MeetingStatus.MEETING_STATUS_IDLE) {
            long lMeetingNo = 0;
            try {
                lMeetingNo = Long.parseLong(meetingNo);
            } catch (NumberFormatException e) {
//                Toast.makeText(this, "Invalid meeting number: " + meetingNo, Toast.LENGTH_LONG).show();
                finish();
                return;
            }
            if (mMeetingService.getCurrentRtcMeetingNumber() == lMeetingNo) {
                mMeetingService.returnToMeeting(this);
                finish();
                return;
            }
            finish();
            return;
        }
        try {
            String response = executeNetworkCalltoGetApiCall();
            String meetingNumber = getResponseFrom(response);
            String zakToken = getZAKTokenResponseFrom(response);
            // vanityId = meetingNumber;
            password = getResponseFromPassword(response);
            Log.d("##ZAKTOKEN", zakToken);

            meetingNo = meetingNumber;
            zak = zakToken;

        } catch (Exception e) {
            e.printStackTrace();
        }
        if (TextUtils.isEmpty(userId)) {
            Toast.makeText(this, "You need to enter user id", Toast.LENGTH_LONG).show();
            return;
        }

        if (TextUtils.isEmpty(zak)) {
            Toast.makeText(this, "You need to enter zoom access token(zak)", Toast.LENGTH_LONG).show();
            return;
        }

        if (meetingNo.length() == 0 && vanityId.length() == 0) {
            Toast.makeText(this, "You need to enter a meeting number/ vanity  which you want to join.", Toast.LENGTH_LONG).show();
            return;
        }

       /* if (meetingNo.length() != 0 && vanityId.length() != 0) {
            Toast.makeText(this, "Both meeting number and vanity  have value,  just set one of them", Toast.LENGTH_LONG).show();
            return;
        }*/

        int ret = -1;
        if (vanityId.length() != 0) {
            ret = ApiUserStartMeetingHelper.getInstance().startMeetingWithVanityId(this, vanityId, userId, zak);
        } else {
            ret = ApiUserStartMeetingHelper.getInstance().startMeetingWithNumber(this, meetingNo, userId, zak);
        }

        Log.i(TAG, "onClickBtnStartMeeting, ret=" + ret);
    }

    @Override
    public void onMeetingStatusChanged(MeetingStatus meetingStatus, int errorCode,
                                       int internalErrorCode) {
        Log.i(TAG, "onMeetingStatusChanged, meetingStatus=" + meetingStatus + ", errorCode=" + errorCode
                + ", internalErrorCode=" + internalErrorCode);

//        sendpushNotificationToParticipant(meetingStatus);

        if (meetingStatus == MeetingStatus.MEETING_STATUS_FAILED && errorCode == MeetingError.MEETING_ERROR_CLIENT_INCOMPATIBLE) {
            Toast.makeText(this, "Version of ZoomSDK is too low!", Toast.LENGTH_LONG).show();
        }
        if (mbPendingStartMeeting && meetingStatus == MeetingStatus.MEETING_STATUS_IDLE) {
            mbPendingStartMeeting = false;
            onClickBtnStartMeeting();
        }
        if (meetingStatus == MeetingStatus.MEETING_STATUS_CONNECTING) {
            showMeetingUi();
            final Handler handler = new Handler(Looper.getMainLooper());
            handler.postDelayed(() -> {
                MeetingService meetingService = ZoomSDK.getInstance().getMeetingService();
                MeetingStatus meetingStatusNew = meetingService.getMeetingStatus();
                if (meetingStatusNew == MeetingStatus.MEETING_STATUS_INMEETING) {
                    sendpushNotificationToParticipant(meetingStatusNew);
                    finish();
                }
            }, 15000);
        }
        refreshUI();

//        if (meetingStatus == MeetingStatus.MEETING_STATUS_INMEETING) {
//            sendpushNotificationToParticipant(meetingStatus);
//        }
    }

    @Override
    public void onMeetingParameterNotification(MeetingParameter meetingParameter) {

    }

    private void refreshUI() {
        MeetingStatus meetingStatus = mMeetingService.getMeetingStatus();
        if (meetingStatus == MeetingStatus.MEETING_STATUS_CONNECTING || meetingStatus == MeetingStatus.MEETING_STATUS_INMEETING
                || meetingStatus == MeetingStatus.MEETING_STATUS_RECONNECTING) {

        } else {

        }
        if (mZoomSDK.getMeetingSettingsHelper().isCustomizedMeetingUIEnabled()) {
            if (meetingStatus == MeetingStatus.MEETING_STATUS_INMEETING && isResumed) {
                MeetingWindowHelper.getInstance().showMeetingWindow(this);
            } else {
                MeetingWindowHelper.getInstance().hiddenMeetingWindow(true);
            }
        }
    }

    private void showMeetingUi() {
        if (ZoomSDK.getInstance().getMeetingSettingsHelper().isCustomizedMeetingUIEnabled()) {
            Intent intent = new Intent(this, MyMeetingActivity.class);
            intent.putExtra("from", MyMeetingActivity.JOIN_FROM_APIUSER);
            intent.putExtra("password", password);
            intent.setFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
            this.startActivity(intent);
            this.finish();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, final Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        MeetingWindowHelper.getInstance().onActivityResult(requestCode, this);
    }


    private String getJWTToken() {

        long time = System.currentTimeMillis() / 1000 + EXPIRED_TIME;

        String header = "{\"alg\": \"HS256\", \"typ\": \"JWT\"}";
        String payload = "{\"iss\": \"" + API_KEY + "\"" + ", \"exp\": " + String.valueOf(time) + "}";
        try {
            String headerBase64Str = Base64.encodeToString(header.getBytes("utf-8"), Base64.NO_WRAP | Base64.NO_PADDING | Base64.URL_SAFE);
            String payloadBase64Str = Base64.encodeToString(payload.getBytes("utf-8"), Base64.NO_WRAP | Base64.NO_PADDING | Base64.URL_SAFE);
            final Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(API_SECRET.getBytes(), "HmacSHA256");
            mac.init(secretKeySpec);

            byte[] digest = mac.doFinal((headerBase64Str + "." + payloadBase64Str).getBytes());

            Log.d("##JWTTOKEN", headerBase64Str + "." + payloadBase64Str + "." + Base64.encodeToString(digest, Base64.NO_WRAP | Base64.NO_PADDING | Base64.URL_SAFE));

            return headerBase64Str + "." + payloadBase64Str + "." + Base64.encodeToString(digest, Base64.NO_WRAP | Base64.NO_PADDING | Base64.URL_SAFE);


        } catch (NoSuchAlgorithmException e) {
            e.printStackTrace();
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
        } catch (InvalidKeyException e) {
            e.printStackTrace();
        }
        return null;
    }

    private String getZoomAccessToken(String userId, String jwtAccessToken) throws IOException, JSONException {

        URL zoomTokenEndpoint = new URL("https://api.zoom.us/v2/users/" + userId + "/token?type=token&access_token=" + jwtAccessToken);
        HttpsURLConnection connection = (HttpsURLConnection) zoomTokenEndpoint.openConnection();
        String authorization = "Bearer " + jwtAccessToken;
        connection.setRequestProperty("Authorization", authorization);
        //connection.setRequestProperty("Content-Type", " application/json");

        Log.d("##ZOOMACCESS", String.valueOf(connection.getResponseCode()));

        if (connection.getResponseCode() == HttpURLConnection.HTTP_OK) {
            InputStream responseBody = connection.getInputStream();
            InputStreamReader responseBodyReader = new InputStreamReader(responseBody, "UTF-8");
            BufferedReader streamReader = new BufferedReader(responseBodyReader);
            StringBuilder responseStrBuilder = new StringBuilder();

            //get JSON String
            String inputStr;
            while ((inputStr = streamReader.readLine()) != null)
                responseStrBuilder.append(inputStr);

            connection.disconnect();
            JSONObject jsonObject = new JSONObject(responseStrBuilder.toString());
            return jsonObject.getString("token");
        } else {
            Log.d(TAG, "error in connection");
            return null;
        }

    }

    private String getZAKtoken(String userId, String jwtAccessToken) throws IOException, JSONException {

        URL zoomTokenEndpoint = new URL("https://api.zoom.us/v2/users/" + userId + "/token?type=zak&access_token=" + jwtAccessToken);
        HttpsURLConnection connection = (HttpsURLConnection) zoomTokenEndpoint.openConnection();
        String authorization = "Bearer " + jwtAccessToken;
        connection.setRequestProperty("Authorization", authorization);
        if (connection.getResponseCode() == HttpURLConnection.HTTP_OK) {
            InputStream responseBody = connection.getInputStream();
            InputStreamReader responseBodyReader = new InputStreamReader(responseBody, "UTF-8");
            BufferedReader streamReader = new BufferedReader(responseBodyReader);
            StringBuilder responseStrBuilder = new StringBuilder();

            //get JSON String
            String inputStr;
            while ((inputStr = streamReader.readLine()) != null)
                responseStrBuilder.append(inputStr);

            connection.disconnect();
            JSONObject jsonObject = new JSONObject(responseStrBuilder.toString());
            return jsonObject.getString("token");
        } else {
            Log.d(TAG, "error in connection");
            return null;
        }
    }

    public static String executeNetworkCalltoGetApiCall() {


        final OkHttpClient okHttpClient = new OkHttpClient.Builder()
                .connectTimeout(520, TimeUnit.SECONDS)
                .readTimeout(520, TimeUnit.SECONDS)
                .writeTimeout(520, TimeUnit.SECONDS)
                .build();


        String appUrl = "https://development.easyform.in/coreapi/api/meetings_create";

        String jsds = "[{\n" +
                "        \"topic\": \"Test Meeting 225\",\n" +
                "        \"type\": \"1\",\n" +
                "        \"password\": \"\",\n" +
                "        \"agenda\": \"Test Create Meeting\",\n" +
                "        \"settings\":\n" +
                "        {\n" +
                "            \"host_video\": false,\n" +
                "            \"participant_video\": false,\n" +
                "            \"cn_meeting\": false,\n" +
                "            \"in_meeting\": true,\n" +
                "            \"mute_upon_entry\": false,\n" +
                "            \"watermark\": false,\n" +
                "            \"approval_type\": 2,\n" +
                "            \"registration_type\": 1,\n" +
                "            \"audio\": \"both\",\n" +
                "            \"auto_recording\": \"none\",\n" +
                "            \"alternative_hosts\": \"\",\n" +
                "            \"close_registration\": false,\n" +
                "            \"waiting_room\": false,\n" +
                "            \"contact_name\": \"Sky\",\n" +
                "            \"contact_email\": \"appskypro@gmail.com\",\n" +
                "            \"registrants_email_notification\": true,\n" +
                "            \"meeting_authentication\": false\n" +
                "        }\n" +
                "    }]";


        String jsonResponse = null;

        try {

            jsds = jsds.replaceAll("(\r\n|\n)", "");

            MediaType JSON = MediaType.parse("application/json; charset=utf-8");
            RequestBody body1 = RequestBody.create(JSON, jsds);
            Request request = new Request.Builder()
                    .header("Accept", "application/json")
                    .header("Content-Type", "application/json; charset=utf-8")
                    .header("matchId", "0")
                    .post(body1)
                    .url(appUrl)
                    .build();

            Response response = okHttpClient.newCall(request).execute();
            Log.d("##WEBSERVICE2", response.toString());
            try {
                jsonResponse = response.body().string();
                Log.d("##WEBSERVICE...", jsonResponse);
                jsonResponse = jsonResponse.replaceAll("(\r\n|\n)", "");

            } catch (Exception e) {
                //e.printStackTrace()();
//                return null;
            }
            if (response.code() != 200) {
                return null;
            }


        } catch (Exception e) {
            e.getMessage();
            return null;
        }
        return jsonResponse;
    }

    private String getResponseFrom(String response) {

        String meetingID = null;
        JSONArray jsonArray;
        try {
            jsonArray = new JSONArray(response);
            for (int i = 0; i < jsonArray.length(); i++) {
                JSONObject jsonObject = jsonArray.getJSONObject(i);
                JSONObject jsonObject1 = jsonObject.getJSONObject("Data");

                meetingID = jsonObject1.getString("id");
                String password = jsonObject1.getString("password");
                Log.d("##ZOOMpassword", password);
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }
        return meetingID;
    }

    private String getZAKTokenResponseFrom(String response) {

        String meetingID = null;
        JSONArray jsonArray;
        try {
            jsonArray = new JSONArray(response);
            for (int i = 0; i < jsonArray.length(); i++) {
                JSONObject jsonObject = jsonArray.getJSONObject(i);
                JSONObject jsonObject1 = jsonObject.getJSONObject("Data");
                Uri mUrl = Uri.parse(jsonObject1.getString("start_url"));
                meetingID = mUrl.getQueryParameter("zak");

            }
        } catch (JSONException e) {
            e.printStackTrace();
        }
        return meetingID;
    }

    private String getResponseFromPassword(String response) {

        String password = null;
        JSONArray jsonArray;
        try {
            jsonArray = new JSONArray(response);
            for (int i = 0; i < jsonArray.length(); i++) {
                JSONObject jsonObject = jsonArray.getJSONObject(i);
                JSONObject jsonObject1 = jsonObject.getJSONObject("Data");

                password = jsonObject1.getString("password");
                Log.d("##ZOOMpassword", password);
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }
        return password;
    }


    private void sendpushNotificationToParticipant(MeetingStatus meetingStatus) {

        try {

            if (meetingStatus == MeetingStatus.MEETING_STATUS_INMEETING) {
                Toast.makeText(getApplicationContext(), "Meeting has started", Toast.LENGTH_LONG).show();
                ZoomSDK sdk = ZoomSDK.getInstance();
                InMeetingService inMeetingService = sdk.getInMeetingService();

                inMeetingService.getInMeetingShareController().lockShare(false);
                inMeetingService.getInMeetingWaitingRoomController().enableWaitingRoomOnEntry(false);

                String meetingId = String.valueOf(inMeetingService.getCurrentMeetingNumber());
                String meetingPassword = inMeetingService.getMeetingPassword();
                InMeetingUserInfo meetingUserInfo = inMeetingService.getMyUserInfo();
                String userName = meetingUserInfo.getUserName();
                Log.d("##MEETINGINFO_NAME", userName);
                inMeetingService.activeShareUserID();
//          startShareScreen();
//            temporary closed
                JSONObject jsonObject = new JSONObject();
                jsonObject.put("meetingId", meetingId);
                jsonObject.put("meetingPassword", meetingPassword);
                jsonObject.put("userName", userName);

                if (DeviceEventsUtilsZoom.iosAndroidOpponentArray.length() > 0) {
//                    sendNotificationToGroup.sendNotificationToGroup(meetingId, meetingPassword, APIUserStartJoinMeetingActivity.this, userName, "ios");
                    jsonObject.put("dtype", "ios");

                }
                if (DeviceEventsUtilsZoom.webAndroidOpponentArray.length() > 0) {
//                    sendNotificationToGroup.sendNotificationToGroup(meetingId, meetingPassword, APIUserStartJoinMeetingActivity.this, userName, "android");
                    jsonObject.put("dtype", "android");
                }
                sendMessagetoBroadcast("callpush", jsonObject.toString());
            }
        } catch (Exception e) {
            Log.e("##API_USER", "sendpushNotificationToParticipant: " + e.getMessage());
        }
    }

    private void sendMessagetoBroadcast(String msgKey, String msgValue) {
        Log.d("sender", "Broadcasting message");
        Intent intent = new Intent("zoom-event-receiver");
        intent.putExtra("keytype", msgKey);
        intent.putExtra("jsonData", msgValue);
        LocalBroadcastManager.getInstance(this).sendBroadcast(intent);
    }

}
