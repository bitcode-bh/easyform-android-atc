package com.easyform.jitsi.broadcasts;


import static android.content.Context.MODE_PRIVATE;
import static android.content.Context.NOTIFICATION_SERVICE;
import static com.easyform.jitsi.utils.drawing.RemoteUtils.getRealSizeHeight;
import static com.easyform.jitsi.utils.drawing.RemoteUtils.getRealSizeWidth;

import android.annotation.SuppressLint;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.os.Bundle;
import android.util.Log;

import androidx.annotation.Keep;
import androidx.annotation.NonNull;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import com.easyform.jitsi.R;
import com.easyform.jitsi.network.Apis;
import com.easyform.jitsi.network.Models.FirebaseResponse;
import com.easyform.jitsi.network.RetrofitClient;
import com.easyform.jitsi.network.requests.Args;
import com.easyform.jitsi.network.requests.AuthJson;
import com.easyform.jitsi.network.requests.LoginData;
import com.easyform.jitsi.network.requests.ZoomMeetingItem;
import com.easyform.jitsi.network.requests.notifcation.Data;
import com.easyform.jitsi.network.requests.notifcation.FirebaseRequest;
import com.easyform.jitsi.network.requests.usershow.AuthData;
import com.easyform.jitsi.ui.activitys.CameraPreviewActivity;
import com.easyform.jitsi.ui.activitys.MainActivityJitsi;
import com.easyform.jitsi.utils.LogUtils;
import com.easyform.jitsi.utils.NotificationUtils;
import com.easyform.jitsi.utils.drawing.App;
import com.easyform.jitsi.utils.drawing.NormalDrawingUtils;
import com.easyform.jitsi.utils.drawing.PaintViewNormal;
import com.easyform.jitsi.utils.drawing.EventUtils;
import com.easyform.jitsi.utils.drawing.RemoteUtils;
import com.google.ar.sceneform.samples.hellosceneform.HelloSceneformActivity;
import com.google.ar.sceneform.samples.hellosceneform.TouchEventAR;
import com.google.gson.Gson;

import org.jitsi.meet.sdk.BroadcastIntentHelper;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import timber.log.Timber;

/**
 * Created by SavanSolanki on 20/6/2022.
 */
@Keep
public class JitsiPluginBroadcast extends BroadcastReceiver {
    static final String TAG = "JitsiPluginBroadcast";

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        Bundle extras = intent.getExtras();
        App.setContext(context);
        if (action.matches("com.easyform.jitsi.JitsiPluginCall") && extras != null) {
            pluginCalled(context, extras);
        } else if (action.matches("com.easyform.jitsi.notification") && extras != null) {
            JoinMeetNow(context, extras);
        } else if (action.matches("com.easyform.jitsi.Reject") && extras != null) {
            int notificationId = extras.getInt("notificationId", -2);
            if (notificationId != -2) {
                rejectedUserNotification(extras, notificationId);
                NotificationManager mNotificationManager = (NotificationManager) context.getSystemService(NOTIFICATION_SERVICE);
                mNotificationManager.cancel(notificationId);
            }
        } else if (action.matches("com.easyform.jitsi.done") && extras != null) {
            int notificationid = extras.getInt("notificationId", -2);
            if (notificationid != -2) {
                NotificationManager mNotificationManager = (NotificationManager) context.getSystemService(NOTIFICATION_SERVICE);
                mNotificationManager.cancel(notificationid);
            }
        } else if (action.matches("com.easyform.jitsi.rejectnotification") && extras != null) {
            sendrejectnotification(context, extras);
        } else if (action.matches("com.easyform.jitsi.JitsiMeetCall") && extras != null) {
            JitsiMeetCall(extras);
        } else if (action.matches("com.easyform.jitsi.JitsiScreenShareNoti") && extras != null) {
            ScreenShareNoti(extras);
        } else if (action.matches("com.easyform.jitsi.ScreenshareAccept") && extras != null) {
            screenShareNoti(context, extras);
        } else if (action.matches("com.easyform.jitsi.Jitsi-event_broadcast") && extras != null) {
            screenshareDrawAR(extras);
        } else if (action.matches("com.easyform.jitsi.Jitsi-event_broadcast-noti") && extras != null) {
            ScreenARDraw(extras, context);
        } else if (action.matches("com.easyform.jitsi.size") && extras != null) {
            ScreenSize(extras);
        } else if (action.matches("com.easyform.jitsi.remoteSize") && extras != null) {
            RemoteSize(extras);

        } else if (action.matches("com.easyform.jitsi.sizeRemote") && extras != null) {
            remoteHeightwidth(extras);
        } else if (action.matches("com.easyform.jitsi.StopScreen") && extras != null) {
            RemotestopScreen(context, extras);
        } else {
            Timber.tag(TAG).e("No Action Found %s", action);
        }
    }

    private void RemotestopScreen(Context context, Bundle extras) {
        String ketType = extras.getString("keyType");
        String keyData = extras.getString("keyData");

        if (ketType.equalsIgnoreCase("StopScreen")) {
            if (HelloSceneformActivity.isArSupportedDevice) {

                Intent finishIntent = new Intent();
                finishIntent.setAction("com.jitsi.finish");
                context.sendBroadcast(finishIntent);
                Intent ScreenOnIntent = BroadcastIntentHelper.buildToggleScreenShareIntent(false);
                LocalBroadcastManager.getInstance(App.getContext()).sendBroadcast(ScreenOnIntent);
            } else {
                Intent finishIntent = new Intent();
                finishIntent.setAction("com.jitsi.finish");
                context.sendBroadcast(finishIntent);
                Intent ScreenOnIntent = BroadcastIntentHelper.buildToggleScreenShareIntent(false);
                LocalBroadcastManager.getInstance(App.getContext()).sendBroadcast(ScreenOnIntent);
            }
        }

    }

    @SuppressLint("LogNotTimber")
    private void remoteHeightwidth(Bundle extras) {
        String remoteMessageData = extras.getString("remoteMessageData");
        Log.d("remoteSize", remoteMessageData);
        Data RemoteSizeData = new Gson().fromJson(remoteMessageData, Data.class);
        int height;
        int width;

        try {
            JSONObject jsonObject = new JSONObject(RemoteSizeData.getJsonData());
            height = jsonObject.getInt("remoteHeight");
            width = jsonObject.getInt("remoteWidth");
            RemoteUtils.setRemoteHeight(height);
            RemoteUtils.setRemoteWidth(width);

        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    @SuppressLint("LogNotTimber")
    private void RemoteSize(Bundle extras) {
        int remoteHeight = extras.getInt("remoteHeight");
        int remoteWidth = extras.getInt("remotewidth");
        String logindata = extras.getString("loginJson");
        String args1 = extras.getString("Args");
        String senderFcmId = extras.getString("senderfcmId");

        String keyType = "Size";
        JSONObject jsonObject = new JSONObject();
        try {
            jsonObject.put("remoteHeight", remoteHeight);
            jsonObject.put("remoteWidth", remoteWidth);
        } catch (JSONException e) {
            Log.d("remotesize", jsonObject.toString());
            e.printStackTrace();
        }
        if (keyType.matches("Size")) {

            ArPushNotiWithKeyTypes(keyType, args1, logindata, jsonObject.toString(), senderFcmId);
        }

    }

    @SuppressLint("LogNotTimber")
    private void ArPushNotiWithKeyTypes(String keyType, String args1, String logindata, String jsonData, String senderFcmId) {
        Args args = null;
        try {
            args = new Gson().fromJson(args1.substring(1, args1.length() - 1), Args.class);
        } catch (IllegalStateException e) {
            Log.d(TAG, e.toString());
            e.printStackTrace();
        }

        LoginData loginData = new Gson().fromJson(logindata, LoginData.class);
        List<String> fcmIosIds = new ArrayList<>();
        List<String> fcmIds = new ArrayList<>();
        for (int i = 0; i < args.getZoomMeeting().size(); i++) {
            ZoomMeetingItem zoomMeetingItem = args.getZoomMeeting().get(i);
            if (zoomMeetingItem.getDeviceType().matches("ios")) {
                fcmIosIds.add(senderFcmId);
            } else {
                fcmIds.add(senderFcmId);
            }

        }
        Data data = new Data("selectedcolor", "EASYFORM",
                "call", loginData.getUsername(), loginData.getUserId() + "" + loginData.getCompanyId(),
                "remotesize", "0", "", args1, "", "webpush", "android", "", "Role_id", "companyFeatureid", "auth1", "userGetData", "participatId", loginData.getUc(), keyType, jsonData);
        sendPushMessageToSize(data, fcmIds);
    }

    private void sendPushMessageToSize(Data data, List<String> fcmIds) {
        FirebaseRequest firebaseRequest = new FirebaseRequest();
        firebaseRequest.setData(data);
        firebaseRequest.setRegistrationIds(fcmIds);

        RetrofitClient.getApiServices().sendNotification(Apis.FCMURL, "application/json",
                        Apis.authorization,
                        firebaseRequest)
                .enqueue(new Callback<FirebaseResponse>() {
                    @SuppressLint("LogNotTimber")
                    @Override
                    public void onResponse(@NonNull Call<FirebaseResponse> call, @NonNull Response<FirebaseResponse> response) {
                        if (response.code() == 200 && response.isSuccessful()) {
                            Log.d("##RESPONSE", response.message());
                        }
                    }

                    @SuppressLint("LogNotTimber")
                    @Override
                    public void onFailure(@NonNull Call<FirebaseResponse> call, @NonNull Throwable t) {
                        Log.e(TAG, t.toString());
                    }
                });
    }

    @SuppressLint("LogNotTimber")
    private void ScreenSize(Bundle extras) {


        int height = extras.getInt("height");
        int width = extras.getInt("width");
        RemoteUtils.setRealSizeHeight(height);
        RemoteUtils.setRealSizeWidth(width);
        Log.d("SIZEDATA", height + "==" + width);
    }

    @SuppressLint("LogNotTimber")
    private void ScreenARDraw(Bundle extras, Context context) {
        String rmotedata = extras.getString("remoteMessageData");
        Data dataKey = new Gson().fromJson(rmotedata, Data.class);
        TouchEventAR touchEventAR = EventUtils.touchEventAR;
        String JsonData = null;
        try {
            JSONObject jsonObject = new JSONObject(dataKey.getJsonData());
            JsonData = jsonObject.getString(dataKey.getKeyType());

        } catch (JSONException e) {
            e.printStackTrace();
        }
        Log.d("remoteDAtas", rmotedata);
        if (extras != null) {

            if (dataKey.getKeyType().equalsIgnoreCase("gestures")) {
                if (HelloSceneformActivity.isArSupportedDevice) {
                    touchEventAR.onTouchEventArClick("gestures", JsonData);
                } else {
                    NormalDrawingUtils.drawingNormal("gestures", JsonData);
                }
            } else if (dataKey.getKeyType().equalsIgnoreCase("Color")) {
                if (HelloSceneformActivity.isArSupportedDevice) {
                    touchEventAR.onTouchEventArClick("Color", JsonData);
                } else {
                    PaintViewNormal.currentColor = Color.parseColor(JsonData);
                }
            } else if (dataKey.getKeyType().equalsIgnoreCase("clear")) {
                if (HelloSceneformActivity.isArSupportedDevice) {
                    touchEventAR.onTouchEventArClick("delete", JsonData);
                } else {
                    NormalDrawingUtils.drawingNormal("delete", JsonData);
                }
            } else if (dataKey.getKeyType().equalsIgnoreCase("arrow")) {
                if (HelloSceneformActivity.isArSupportedDevice) {
                    touchEventAR.onTouchEventArClick("arrow", JsonData);
                } else {
                    NormalDrawingUtils.drawingNormal("arrow", JsonData);
                }
            } else if (dataKey.getKeyType().equalsIgnoreCase("textlable")) {
                if (HelloSceneformActivity.isArSupportedDevice) {
                    touchEventAR.onTouchEventArClick("textlable", JsonData);
                } else {
                    NormalDrawingUtils.drawingNormal("textlable", JsonData);
                }
            } else if (dataKey.getKeyType().equalsIgnoreCase("imagearrow")) {
                if (HelloSceneformActivity.isArSupportedDevice) {

                    touchEventAR.onTouchEventArClick("imagearrow", JsonData);
                } else {
                    NormalDrawingUtils.drawingNormal("imagearrow", JsonData);
                }

            } else if (dataKey.getKeyType().equalsIgnoreCase("touches")) {
                if (HelloSceneformActivity.isArSupportedDevice) {
                    touchEventAR.onTouchEventArClick("touches", JsonData);
                }
            } else if (dataKey.getKeyType().equalsIgnoreCase("StopScreen")) {
                if (HelloSceneformActivity.isArSupportedDevice) {
                    Intent finishIntent = new Intent();
                    finishIntent.setAction("com.jitsi.finish");
                    App.getContext().sendBroadcast(finishIntent);
                } else {
                    NormalDrawingUtils.drawingNormal("StopScreen", JsonData);

                }


            }

        }
    }

    @SuppressLint("LogNotTimber")
    private void screenshareDrawAR(Bundle extras) {
        String keyType = extras.getString("keytype");
        String jsonData = extras.getString("jsonData");
        LoginData logindata = (LoginData) extras.getSerializable("logindata");
        String args1 = extras.getString("Args");

        Log.d("##KEYTYPE", keyType + "=" + jsonData);
        Log.d("##KEYTYPE", args1 + "=" + logindata);

        if (keyType.equalsIgnoreCase("gestures")) {
            ArPushNotiWithKeyType(keyType, args1, logindata, jsonData);
        } else if (keyType.equalsIgnoreCase("imagearrow")) {
            ArPushNotiWithKeyType(keyType, args1, logindata, jsonData);
        } else if (keyType.equalsIgnoreCase("textlable")) {
            ArPushNotiWithKeyType(keyType, args1, logindata, jsonData);
        } else if (keyType.equalsIgnoreCase("Color")) {
            ArPushNotiWithKeyType(keyType, args1, logindata, jsonData);
        } else if (keyType.equalsIgnoreCase("clear")) {
            ArPushNotiWithKeyType(keyType, args1, logindata, jsonData);
        } else if (keyType.equalsIgnoreCase("arrow")) {
            ArPushNotiWithKeyType(keyType, args1, logindata, jsonData);
        } else if (keyType.equalsIgnoreCase("StopScreen")) {
            ArPushNotiWithKeyType(keyType, args1, logindata, jsonData);
            Intent ScreenOnIntent = BroadcastIntentHelper.buildToggleScreenShareIntent(false);
            LocalBroadcastManager.getInstance(App.getContext()).sendBroadcast(ScreenOnIntent);
        } else if (keyType.equalsIgnoreCase("OPPONENT_FCMID")) {

        }

//        }


    }

    @SuppressLint("LogNotTimber")
    private void screeSizes(String na) {
        try {
            JSONArray jsonArrayEvent = new JSONArray();

            Log.d("##SCREEN_SHARE_MANUAL", "deviceType");

            int sourceWidth;
            int sourceHeight;
            if (getRealSizeHeight() == 0) {

                SharedPreferences preferences = App.getContext().getSharedPreferences("SCREEN_SIZE", MODE_PRIVATE);
                sourceHeight = Integer.parseInt(preferences.getString("MY_HEIGHT", "1280"));
                sourceWidth = Integer.parseInt(preferences.getString("MY_WIDTH", "720"));

                Log.d("##SHARED_HEIGHT", String.valueOf(sourceHeight));

            } else {
                sourceWidth = getRealSizeWidth();
                sourceHeight = getRealSizeHeight();
            }
            JSONArray motionevent = new JSONArray();
            motionevent.put(sourceWidth);
            motionevent.put(sourceHeight);
            motionevent.put("android");
            jsonArrayEvent.put(motionevent);

            JSONObject jsonObject1 = new JSONObject();
            jsonObject1.put("screensize", jsonArrayEvent);
            if (na.equalsIgnoreCase("NA")) {

            } else {

            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @SuppressLint("LogNotTimber")
    private void ArPushNotiWithKeyType(String keyType, String args1, LoginData
            loginData, String jsonData) {
        Args args = null;
        try {
            args = new Gson().fromJson(args1.substring(1, args1.length() - 1), Args.class);
        } catch (IllegalStateException e) {
            Log.d(TAG, e.toString());
            e.printStackTrace();
        }

        List<String> fcmIosIds = new ArrayList<>();
        List<String> fcmIds = new ArrayList<>();
        for (int i = 0; i < args.getZoomMeeting().size(); i++) {
            ZoomMeetingItem zoomMeetingItem = args.getZoomMeeting().get(i);
            if (zoomMeetingItem.getDeviceType().matches("ios")) {
                fcmIosIds.add(zoomMeetingItem.getFcmid());
            } else {
                fcmIds.add(zoomMeetingItem.getFcmid());
            }

        }

        Data data = new Data("selectedcolor", "EASYFORM",
                "call", loginData.getUsername(), loginData.getUserId() + "" + loginData.getCompanyId(),
                "ARDAW", "0", "", args1, "", "webpush", "android", "", "Role_id", "companyFeatureid", "auth1", "userGetData", "participatId", loginData.getUc(), keyType, jsonData);
        sendPushMessageToAr(data, fcmIds);

    }

    private void sendPushMessageToAr(Data data, List<String> fcmIds) {
        FirebaseRequest firebaseRequest = new FirebaseRequest();
        firebaseRequest.setData(data);
        firebaseRequest.setRegistrationIds(fcmIds);

        RetrofitClient.getApiServices().sendNotification(Apis.FCMURL, "application/json",
                        Apis.authorization,
                        firebaseRequest)
                .enqueue(new Callback<FirebaseResponse>() {
                    @Override
                    public void onResponse(@NonNull Call<FirebaseResponse> call, @NonNull Response<FirebaseResponse> response) {
                        if (response.code() == 200 && response.isSuccessful()) {

                        }
                    }

                    @SuppressLint("LogNotTimber")
                    @Override
                    public void onFailure(@NonNull Call<FirebaseResponse> call, @NonNull Throwable t) {
                        Log.e(TAG, t.toString());
                    }
                });

    }


    @SuppressLint("LogNotTimber")
    private void screenShareNoti(Context context, Bundle extras) {
        String remoteMessageData = extras.getString("remoteMessageData", "");
        Log.d("Remote", remoteMessageData);
        Data remotedata = new Gson().fromJson(remoteMessageData, Data.class);

        Intent participateIntent = new Intent("com.jitsi.sendParticipateId")
                .putExtra("participateId", remotedata.getParticipatId());
        context.sendBroadcast(participateIntent);
//
//        RemoteUtils.setParticipateId(remotedata.getParticipatId());

        try {
            JSONObject jsonObject = new JSONObject(remotedata.getJsonData());
            String arrayKey = jsonObject.getString("screensize");
            JSONObject convertjson = new JSONObject(arrayKey);
            JSONArray jsonArray3 = new JSONArray();
            jsonArray3.put(convertjson);
            for (int size = 0; size < jsonArray3.length(); size++) {
                JSONObject jsonArray2 = jsonArray3.getJSONObject(size);
                int dWidth = (jsonArray2.getInt("width"));
                int dHeight = (jsonArray2.getInt("height"));
                String typeCall = jsonArray2.getString("deviceType");
                if (typeCall.equalsIgnoreCase("web")) {
                    //if screen share request on web
                } else {
                    SharedPreferences sharedpreferences = context.getSharedPreferences("REMOTERATIO", Context.MODE_PRIVATE);
                    SharedPreferences.Editor editor = sharedpreferences.edit();
                    editor.putString("Width", String.valueOf(dWidth));
                    editor.putString("Height", String.valueOf(dHeight));
                    editor.apply();
                    editor.commit();
                }
                RemoteUtils.setRemoteHeight(dHeight);
                RemoteUtils.setRemoteWidth(dWidth);


                RemoteUtils.setRealSizeHeight(dHeight);
                RemoteUtils.setRealSizeWidth(dWidth);
            }
        } catch (JSONException e) {
            Log.d("Heightexception", e.toString());
            e.printStackTrace();
        }


        Intent ScreenOnIntent = BroadcastIntentHelper.buildToggleScreenShareIntent(true);
        LocalBroadcastManager.getInstance(context).sendBroadcast(ScreenOnIntent);


    }


    @SuppressLint("LogNotTimber")
    private void ScreenShareNoti(Bundle extras) {
        String click_action = extras.getString("click_action", "");
        String userGetData = extras.getString("getUserData", "");
        String body = extras.getString("body", "");
        String Role_id = extras.getString("Role_id", "");
        String companyFeatureid = extras.getString("companyFeatureid", "");
        String auth1 = extras.getString("auth1", "");
        String webpush = extras.getString("webpush", "");
        String loginJson = extras.getString("loginJson", "");
        String arg = extras.getString("Args", "");
        String url = extras.getString("Url", "");
        String senderfcmid = extras.getString("senderfcmid", "");
        String participatId = extras.getString("participatId", "");
        String keyType = extras.getString("keyType", "");
        String jsonData = extras.getString("jsonData", "");
        int remoteHeight = extras.getInt("remoteHeight", 0);
        int remoteWidth = extras.getInt("remoteWidth", 0);


        JSONObject jsonObject = new JSONObject();
        try {
            jsonObject.put("remoteHeight", remoteHeight);
            jsonObject.put("remoteWidth", remoteWidth);
        } catch (JSONException e) {
            e.printStackTrace();
        }

        Log.d("participatId", participatId);
        Log.d("height", jsonObject.toString());
        LoginData loginData = new Gson().fromJson(loginJson, LoginData.class);
        Args args = null;
        try {
            args = new Gson().fromJson(arg.substring(1, arg.length() - 1), Args.class);
        } catch (IllegalStateException e) {
            Log.d(TAG, e.toString());
            e.printStackTrace();
        }
        AuthJson authJson = new AuthJson();
        authJson.setAppversion(loginData.getAppVersion());
        authJson.setAppid(loginData.getAppId());
        authJson.setDevicetype("android");//ios //Web
        authJson.setUserId(loginData.getUserId());
        authJson.setUsername(loginData.getUsername());
        authJson.setUC(loginData.getUc());
        List<String> fcmIosIds = new ArrayList<>();
        List<String> fcmIds = new ArrayList<>();
        for (int i = 0; i < args.getZoomMeeting().size(); i++) {
            ZoomMeetingItem zoomMeetingItem = args.getZoomMeeting().get(i);
            if (zoomMeetingItem.getDeviceType().matches("ios")) {
                fcmIosIds.add(zoomMeetingItem.getFcmid());
            } else {
                fcmIds.add(zoomMeetingItem.getFcmid());
            }

        }

        JSONObject jsonObject2;
        JSONObject jsonObject3 = null;
        JSONArray jsonArray3 = new JSONArray();
        if (keyType.equalsIgnoreCase("screensize")) {
            if (!jsonData.equalsIgnoreCase("NA")) {
                try {
                    jsonObject2 = new JSONObject(jsonData);
                    jsonObject3 = new JSONObject();
                    jsonObject3.put("screensize", jsonObject2);
                    jsonArray3.put(jsonObject3);
                } catch (JSONException e) {
                    e.printStackTrace();
                }
            } else {
                screeSizes("NA");
            }
        }
        Bitmap bitmap = null;
        Data data = new Data(loginData.getUsername() + " is Screen Share Request to you!", "EASYFORM ScreenShare",
                "call", loginData.getUsername(), loginData.getUserId() + "" + loginData.getCompanyId(),
                "jitsimeetScreenShare", "0", senderfcmid, arg, click_action, webpush, authJson.getDevicetype(), senderfcmid, Role_id, companyFeatureid, auth1, userGetData, participatId, loginData.getUc(), "screensize", jsonObject3.toString());
        sendNotificationShareScreen(fcmIds, data, fcmIosIds, false);

    }

    private void sendNotificationShareScreen(List<String> fcmIds, Data
            data, List<String> fcmIosIds, boolean isIos) {
        FirebaseRequest firebaseRequest = new FirebaseRequest();
        if (isIos) {
            firebaseRequest.setNotification(data);
            firebaseRequest.setRegistrationIds(fcmIosIds);
        } else {
            firebaseRequest.setData(data);
            firebaseRequest.setRegistrationIds(fcmIds);
        }

        RetrofitClient.getApiServices().sendNotification(Apis.FCMURL, "application/json",
                        Apis.authorization,
                        firebaseRequest)
                .enqueue(new Callback<FirebaseResponse>() {
                    @Override
                    public void onResponse(@NonNull Call<FirebaseResponse> call, @NonNull Response<FirebaseResponse> response) {
                        if (response.code() == 200 && response.isSuccessful()) {
                            //  Log.d(TAG, response.body().toString());
                            if (fcmIosIds.size() > 0 && !isIos) {
                                sendNotificationShareScreen(fcmIds, data, fcmIosIds, true);
                            } else {

                            }
                        }
                    }

                    @SuppressLint("LogNotTimber")
                    @Override
                    public void onFailure(@NonNull Call<FirebaseResponse> call, @NonNull Throwable t) {
                        Log.e(TAG, t.toString());
                    }
                });
    }

    @SuppressLint("LogNotTimber")
    private void JitsiMeetCall(Bundle extras) {
        String click_action = extras.getString("click_action", "");
        String userGetData = extras.getString("getUserData", "");
        String body = extras.getString("body", "");
        String Role_id = extras.getString("Role_id", "");
        String companyFeatureid = extras.getString("companyFeatureid", "");
        String auth1 = extras.getString("auth1", "");
        String webpush = extras.getString("webpush", "");
        String arg = extras.getString("Args", "");
        Log.d("TAG", arg);
        String url = extras.getString("Url", "");
        LoginData loginData = (LoginData) extras.getSerializable("loginJson");
        LogUtils.JitsiLogFile(loginData.toString(), "jitsimeetcall line97");
        String senderfcmid = extras.getString("senderfcmid", "");
        String participatId = extras.getString("participatId", "");
        String roomName = extras.getString("roomName", "");

        Args args = null;
        try {
            args = new Gson().fromJson(arg.substring(1, arg.length() - 1), Args.class);
        } catch (IllegalStateException e) {
            Log.d(TAG, e.toString());
            e.printStackTrace();
        }
        AuthJson authJson = new AuthJson();
        authJson.setAppversion(loginData.getAppVersion());
        authJson.setAppid(loginData.getAppId());
        authJson.setDevicetype("android");//ios //Web
        authJson.setUserId(loginData.getUserId());
        authJson.setUsername(loginData.getUsername());
        authJson.setUC(loginData.getUc());
        List<String> fcmIosIds = new ArrayList<>();
        List<String> fcmIds = new ArrayList<>();
        for (int i = 0; i < args.getZoomMeeting().size(); i++) {
            ZoomMeetingItem zoomMeetingItem = args.getZoomMeeting().get(i);
            if (zoomMeetingItem.getDeviceType().matches("ios")) {
                fcmIosIds.add(zoomMeetingItem.getFcmid());
            } else {
                fcmIds.add(zoomMeetingItem.getFcmid());
            }

        }


        Data data = new Data(loginData.getUsername() + " is calling to you!", "EASYFORM CALL",
                "call", loginData.getUsername(), roomName,
                "jitsiMeet", "0", senderfcmid, arg, click_action, webpush, authJson.getDevicetype(), senderfcmid, Role_id, companyFeatureid, auth1, userGetData, "", loginData.getUc(), "", "");

        sendNotificationcall(fcmIds, data, fcmIosIds, false);


    }

    private void sendNotificationcall(List<String> fcmIds, Data
            data, List<String> fcmIosIds, boolean isIos) {
        FirebaseRequest firebaseRequest = new FirebaseRequest();
        if (isIos) {
            firebaseRequest.setNotification(data);
            firebaseRequest.setRegistrationIds(fcmIosIds);
        } else {
            firebaseRequest.setData(data);
            firebaseRequest.setRegistrationIds(fcmIds);
        }

        RetrofitClient.getApiServices().sendNotification(Apis.FCMURL, "application/json",
                        Apis.authorization,
                        firebaseRequest)
                .enqueue(new Callback<FirebaseResponse>() {
                    @Override
                    public void onResponse(@NonNull Call<FirebaseResponse> call, @NonNull Response<FirebaseResponse> response) {
                        if (response.code() == 200 && response.isSuccessful()) {
                            //  Log.d(TAG, response.body().toString());
                            if (fcmIosIds.size() > 0 && !isIos) {
                                sendNotificationcall(fcmIds, data, fcmIosIds, true);
                            }
                        }
                    }

                    @SuppressLint("LogNotTimber")
                    @Override
                    public void onFailure(@NonNull Call<FirebaseResponse> call, @NonNull Throwable t) {
                        Log.e(TAG, t.toString());
                    }
                });
    }

    private void sendrejectnotification(Context context, Bundle extras) {
        String remoteMessageData = extras.getString("remoteMessageData", "");
        Data notificationData = new Gson().fromJson(remoteMessageData, Data.class);
        int NOTIFICATION_ID = (int) System.currentTimeMillis();
        NotificationUtils.rejectcallnotification(NOTIFICATION_ID, context,
                notificationData.getTitle(),
                notificationData.getBody(),
                R.drawable.atc_logo,
                getdoneNotiPendingIntent(NOTIFICATION_ID, context));
    }

    private PendingIntent getdoneNotiPendingIntent(int NOTIFICATION_ID, Context context) {
        Intent jitsiBroadcast = new Intent(context, JitsiPluginBroadcast.class);
        jitsiBroadcast.setAction("com.easyform.jitsi.done");
        jitsiBroadcast.putExtra("notificationId", NOTIFICATION_ID);


        return PendingIntent.getBroadcast(context, 4812, jitsiBroadcast, PendingIntent.FLAG_CANCEL_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }


    @SuppressLint("LogNotTimber")
    private void rejectedUserNotification(Bundle extras, int notificationId) {
        String remotedata = extras.getString("remoteMessagedata", "");
        Data remote = new Gson().fromJson(remotedata, Data.class);
        Log.d("remotedata", remotedata);
        String args = extras.getString("args", "");
        String senderfcmid = extras.getString("senderfcmid", "");
        Data remoteData = new Gson().fromJson(remotedata, Data.class);
        String url = extras.getString("url", "");
        String loginjson = extras.getString("loginjson", "");
        String webpush = extras.getString("webpush", "");
        String action_click = extras.getString("action_click", "");
        LoginData loginData = new Gson().fromJson(loginjson, LoginData.class);
        AuthJson authJson = new AuthJson();
        authJson.setAppversion(loginData.getAppVersion());
        authJson.setAppid(loginData.getAppId());
        authJson.setDevicetype("android");//ios //Web
        authJson.setUserId(loginData.getUserId());
        authJson.setUsername(loginData.getUsername());
        authJson.setUC(loginData.getUc());
        Args args1;


        List<String> fcmIosIds = new ArrayList<>();
        List<String> fcmIds = new ArrayList<>();

        try {
            args1 = new Gson().fromJson(args.substring(1, args.length() - 1), Args.class);


            for (int i = 0; i < args1.getZoomMeeting().size(); i++) {
                ZoomMeetingItem zoomMeetingItem = args1.getZoomMeeting().get(i);
                if (zoomMeetingItem.getDeviceType().matches("ios")) {
                    fcmIosIds.add(remoteData.getRemotetoken());
                } else {
                    fcmIds.add(remoteData.getRemotetoken());
                }
            }
        } catch (StringIndexOutOfBoundsException e) {
            Log.d("Exception", e.toString());
            e.printStackTrace();
        }
        Bitmap bitmap = null;
        Data data = new Data(loginData.getUsername() + " is Rejected Your Call!", "EASYFORM", "RejectedNotification", loginData.getUsername(), loginData.getUserId() + "" + loginData.getCompanyId(), "jitsiMeetreject", "", senderfcmid, args, action_click, webpush, remoteData.getDevice_type(), remoteData.getRemotetoken(), remote.getRole_id(), remote.getCompanyFeatureid(), remote.getAuth1(), remote.getUserGetData(), remote.getParticipatId(), remote.getUc(), "", "");

        rejectsendNotification(fcmIds, data, fcmIosIds, false);
    }

    private void rejectsendNotification(List<String> senderfcmIds, Data
            data, List<String> fcmIosIds, boolean isIos) {
        FirebaseRequest firebaseRequest = new FirebaseRequest();
        if (isIos) {
            firebaseRequest.setNotification(data);
            firebaseRequest.setRegistrationIds(fcmIosIds);
        } else {
            firebaseRequest.setData(data);
            firebaseRequest.setRegistrationIds(senderfcmIds);
        }
        RetrofitClient.getApiServices().sendNotification(Apis.FCMURL, "application/json",
                        Apis.authorization,
                        firebaseRequest)
                .enqueue(new Callback<FirebaseResponse>() {
                    @Override
                    public void onResponse(@NonNull Call<FirebaseResponse> call, @NonNull Response<FirebaseResponse> response) {
                        if (response.code() == 200 && response.isSuccessful()) {
                            //  Log.d(TAG, response.body().toString());
                            if (fcmIosIds.size() > 0 && !isIos) {
                                rejectsendNotification(senderfcmIds, data, fcmIosIds, true);
                            }
                        }
                    }

                    @SuppressLint("LogNotTimber")
                    @Override
                    public void onFailure(@NonNull Call<FirebaseResponse> call, @NonNull Throwable t) {
                        Log.e(TAG, t.toString());
                    }
                });

    }

    /**
     * @param context pass context
     * @param extras  pass extras
     * @author SavanSolanki
     */
    private void pluginCalled(Context context, Bundle extras) {
        String click_action = extras.getString("click_action", "");
        String userGetData = extras.getString("getUserData", "");
        String body = extras.getString("body", "");
        String Role_id = extras.getString("Role_id", "");
        String companyFeatureid = extras.getString("companyFeatureid", "");
        String auth1 = extras.getString("auth1", "");
        String webpush = extras.getString("webpush", "");
        String arg = extras.getString("Args", "");
        String url = extras.getString("Url", "");
        String loginjson = extras.getString("loginJson", "");
        LogUtils.JitsiLogFile(loginjson, "plugincallloginjson line172");
        String senderfcmid = extras.getString("senderfcmid", "");
        SharedPreferences sharedPreferences = context.getSharedPreferences("Plugin", MODE_PRIVATE);
        SharedPreferences.Editor myEdit = sharedPreferences.edit();
        myEdit.putString("isPlugin", "isPluginCall");
        myEdit.putString("loginjson", loginjson);
        myEdit.apply();
        LoginData loginData = new Gson().fromJson(loginjson, LoginData.class);
        Args args = new Gson().fromJson(arg.substring(1, arg.length() - 1), Args.class);
        AuthJson authJson = new AuthJson();
        authJson.setAppversion(loginData.getAppVersion());
        authJson.setAppid(loginData.getAppId());
        authJson.setDevicetype("android");//ios //Web
        authJson.setUserId(loginData.getUserId());
        authJson.setUsername(loginData.getUsername());
        authJson.setUC(loginData.getUc());
        List<String> fcmIosIds = new ArrayList<>();
        List<String> fcmIds = new ArrayList<>();
        for (int i = 0; i < args.getZoomMeeting().size(); i++) {
            ZoomMeetingItem zoomMeetingItem = args.getZoomMeeting().get(i);
            if (zoomMeetingItem.getDeviceType().matches("ios")) {
                fcmIosIds.add(zoomMeetingItem.getFcmid());
            } else {
                fcmIds.add(zoomMeetingItem.getFcmid());
            }

        }

        String participntId = null;
        Bitmap bitmap = null;
        Data data = new Data(loginData.getUsername() + " is calling to you!", "EASYFORM CALL",
                "call", loginData.getUsername(), loginData.getUserId() + "" + loginData.getCompanyId(),
                "jitsiMeet", "0", senderfcmid, arg, click_action, webpush, authJson.getDevicetype(), senderfcmid, Role_id, companyFeatureid, auth1, userGetData, participntId, loginData.getUc(), "", "");
        sendNotification(context, url, loginData, authJson, fcmIds, data, fcmIosIds, userGetData, auth1, Role_id, companyFeatureid, body, arg, senderfcmid, false);

    }

    private void sendNotification(Context context, String url, LoginData loginData, AuthJson
            authJson, List<String> fcmIds, Data data, List<String> fcmIosIds, String
                                          usergetdata, String auth1, String Rold_id, String companyFeatureid, String body, String
                                          args, String senderfcmid, boolean isIos) {
        FirebaseRequest firebaseRequest = new FirebaseRequest();
        if (isIos) {
            firebaseRequest.setNotification(data);
            firebaseRequest.setRegistrationIds(fcmIosIds);
        } else {
            firebaseRequest.setData(data);
            firebaseRequest.setRegistrationIds(fcmIds);
        }

        RetrofitClient.getApiServices().sendNotification(Apis.FCMURL, "application/json",
                        Apis.authorization,
                        firebaseRequest)
                .enqueue(new Callback<FirebaseResponse>() {
                    @Override
                    public void onResponse(@NonNull Call<FirebaseResponse> call, @NonNull Response<FirebaseResponse> response) {
                        if (response.code() == 200 && response.isSuccessful()) {

                            if (fcmIosIds.size() > 0 && !isIos) {
                                sendNotification(context, url, loginData, authJson, fcmIds, data, fcmIosIds, usergetdata, auth1, Rold_id, companyFeatureid, body, args, senderfcmid, true);
                            } else {
                                Intent mainActivityJitsi = new Intent(context, MainActivityJitsi.class);
                                mainActivityJitsi.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                                mainActivityJitsi.putExtra("Url", url);
                                mainActivityJitsi.putExtra("authJson", authJson);
                                mainActivityJitsi.putExtra("loginData", loginData);
                                mainActivityJitsi.putExtra("getUserData", usergetdata);
                                mainActivityJitsi.putExtra("auth1", auth1);
                                mainActivityJitsi.putExtra("Rold_id", Rold_id);
                                mainActivityJitsi.putExtra("companyFeatureid", companyFeatureid);
                                mainActivityJitsi.putExtra("body", body);
                                mainActivityJitsi.putExtra("Args", args);
                                mainActivityJitsi.putExtra("senderfcmid", senderfcmid);
                                context.startActivity(mainActivityJitsi);
                            }
                        }
                    }

                    @SuppressLint("LogNotTimber")
                    @Override
                    public void onFailure(@NonNull Call<FirebaseResponse> call, @NonNull Throwable t) {
                        Log.e(TAG, t.toString());
                    }
                });
    }

    /**
     * @param context pass context
     * @param extras  pass extras
     * @author SavanSolanki
     */
    private void JoinMeetNow(Context context, Bundle extras) {
        String remoteMessageData = extras.getString("remoteMessageData", "");
        Data notificationData = new Gson().fromJson(remoteMessageData, Data.class);
        String url = extras.getString("Url", "");
        String loginJson = extras.getString("loginJson", "");
        LoginData loginData = new Gson().fromJson(loginJson, LoginData.class);


        AuthJson authJson = new AuthJson();
        authJson.setAppversion(loginData.getAppVersion());
        authJson.setAppid(loginData.getAppId());
        authJson.setDevicetype("android");
        authJson.setUserId(loginData.getUserId());
        authJson.setUsername(loginData.getUsername());
        authJson.setUC(loginData.getUc());

        AuthData authData = new AuthData();
        authData.setUsername(loginData.getUsername());
        authData.setUc(loginData.getUc());
        authData.setUserId(loginData.getUserId());

        int NOTIFICATION_ID = (int) System.currentTimeMillis();

        NotificationUtils.createNotification(NOTIFICATION_ID, context,
                getAcceptCallPendingIntent(NOTIFICATION_ID, context, notificationData.getRoomName(), url, loginData, authJson, remoteMessageData, notificationData.getArgs(), notificationData.getWebpush(), notificationData.getClick_action(), notificationData.getAuth1(), notificationData.getUserGetData(), notificationData.getRole_id(), notificationData.getCompanyFeatureid(), authData, notificationData.getBody()),
                getRejectCallPendingIntent(NOTIFICATION_ID, context, notificationData.getSenderfcmid(), url, loginData, loginJson, authJson, notificationData.getArgs(), remoteMessageData, notificationData.getWebpush(), notificationData.getClick_action(), notificationData.getRemotetoken()),
                notificationData.getTitle(),
                notificationData.getBody(),
                R.drawable.atc_logo);
    }

    /**
     * @param NOTIFICATION_ID Notification id to use in show Notification
     * @param context         pass context
     * @return is returning pending intent is will call on user reject call on Notification
     * @author SavanSolanki
     */
    private PendingIntent getRejectCallPendingIntent(int NOTIFICATION_ID, Context
            context, String senderfcmid, String url, LoginData logindata, String loginjson, AuthJson
                                                             authjson, String args, String remoteMessagedata, String webpush, String action_click, String
                                                             remotetoken) {
        Intent jitsiBroadcast = new Intent(context, JitsiPluginBroadcast.class);
        jitsiBroadcast.setAction("com.easyform.jitsi.Reject");
        jitsiBroadcast.putExtra("notificationId", NOTIFICATION_ID);
        jitsiBroadcast.putExtra("senderfcmid", senderfcmid);
        jitsiBroadcast.putExtra("remotetoken", remotetoken);
        jitsiBroadcast.putExtra("url", url);
        jitsiBroadcast.putExtra("logindata", logindata);
        jitsiBroadcast.putExtra("loginjson", loginjson);
        jitsiBroadcast.putExtra("authjson", authjson);
        jitsiBroadcast.putExtra("args", args);
        jitsiBroadcast.putExtra("remoteMessagedata", remoteMessagedata);
        jitsiBroadcast.putExtra("webpush", webpush);
        jitsiBroadcast.putExtra("action_click", action_click);

        return PendingIntent.getBroadcast(context, 4812, jitsiBroadcast, PendingIntent.FLAG_CANCEL_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    /**
     * @param NOTIFICATION_ID Notification id to use in show Notification
     * @param context         pass context
     * @param roomName        roomName user join to meet
     * @param url             url to getKey form server
     * @param loginData       {@link LoginData} pass login data
     * @param authJson        {@link AuthJson} pass authJson
     * @return is returning pending intent is will call on user Accept call on Notification
     * @author SavanSolanki
     */
    private PendingIntent getAcceptCallPendingIntent(int NOTIFICATION_ID, Context
            context, String roomName, String url, LoginData loginData, AuthJson authJson, String
                                                             remoteMessageData, String args, String webpush, String click_action, String auth1, String
                                                             userGetData, String role_id, String companyFeatureid, AuthData authData, String body) {
        Intent mainActivityJitsi = new Intent(context, MainActivityJitsi.class);
        mainActivityJitsi.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        mainActivityJitsi.putExtra("Url", url);
        mainActivityJitsi.putExtra("authJson", authJson);
        mainActivityJitsi.putExtra("loginData", loginData);
        mainActivityJitsi.putExtra("roomName", roomName);
        mainActivityJitsi.putExtra("notificationId", NOTIFICATION_ID);
        mainActivityJitsi.putExtra("args", args);
        mainActivityJitsi.putExtra("webpush", webpush);
        mainActivityJitsi.putExtra("action_click", click_action);
        mainActivityJitsi.putExtra("auth1", auth1);
        mainActivityJitsi.putExtra("remoteMessageData", remoteMessageData);
        mainActivityJitsi.putExtra("userGetData", userGetData);
        mainActivityJitsi.putExtra("role_id", role_id);
        mainActivityJitsi.putExtra("companyFeatureid", companyFeatureid);
        mainActivityJitsi.putExtra("authData", authData);
        mainActivityJitsi.putExtra("body", body);
        return PendingIntent.getActivity(context, 4812, mainActivityJitsi, PendingIntent.FLAG_CANCEL_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

}
