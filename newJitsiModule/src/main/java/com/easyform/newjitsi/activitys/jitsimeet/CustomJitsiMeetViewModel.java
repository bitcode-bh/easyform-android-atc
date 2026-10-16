package com.easyform.newjitsi.activitys.jitsimeet;

import static android.content.Context.MODE_PRIVATE;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.widget.Toast;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import com.easyform.newjitsi.R;
import com.easyform.newjitsi.activitys.call.JitsiScreenShotPlugin;
import com.easyform.newjitsi.activitys.chat.WebApiCallJitsiMeet;
import com.easyform.newjitsi.activitys.drawing.AR.ARDrawActivity;
import com.easyform.newjitsi.activitys.drawing.AR.EventUtils;
import com.easyform.newjitsi.activitys.drawing.AR.TouchEventAR;
import com.easyform.newjitsi.network.Apis;
import com.easyform.newjitsi.network.Models.ApiAuth;
import com.easyform.newjitsi.network.Models.OtherData;
import com.easyform.newjitsi.network.Models.UserData;
import com.easyform.newjitsi.network.Models.pluginArgs.PluginArgs;
import com.easyform.newjitsi.network.Models.pluginArgs.ZoomMeetingItem;
import com.easyform.newjitsi.network.RetrofitClient;
import com.easyform.newjitsi.network.requests.jwtToken.RoomNo;
import com.easyform.newjitsi.network.requests.notifcation.FirebaseRequest;
import com.easyform.newjitsi.network.requests.notifcation.FirebaseRequestData;
import com.easyform.newjitsi.network.requests.users.EasyFromUserRequest;
import com.easyform.newjitsi.network.response.notifcation.FirebaseResponse;
import com.easyform.newjitsi.network.response.users.EasyFromUser;
import com.easyform.newjitsi.network.response.users.EasyFromUserItem;
import com.easyform.newjitsi.utils.FCMNotificationApiCall;
import com.easyform.newjitsi.utils.NotificationUtils;
import com.easyform.newjitsi.utils.Utils;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import retrofit2.Response;
import timber.log.Timber;

public class CustomJitsiMeetViewModel extends ViewModel {

    private static final MutableLiveData<List<EasyFromUserItem>> _easyFromUserItemList = new MutableLiveData<List<EasyFromUserItem>>();
   public static LiveData<List<EasyFromUserItem>> easyFromUserItemList = _easyFromUserItemList;
    private static final ExecutorService mExecutorService = Build.VERSION.SDK_INT >= Build.VERSION_CODES.N ? Executors.newWorkStealingPool(4) :
            Executors.newFixedThreadPool(4);
    private static final Gson mGson = new Gson();

    void sendNotificationInviteToCall(Bundle extras, List<EasyFromUser> easyFromUserList, Context mContext) {
        mExecutorService.execute(() -> {

            String loginUserDataString = extras.getString(Utils.BroadcastActionExtrasKeys.LOGIN_USER_DATA, "");
            String otherDataString = extras.getString(Utils.BroadcastActionExtrasKeys.OTHER_DATA, "");

            UserData mUserData = mGson.fromJson(loginUserDataString, UserData.class);

            OtherData mOtherData = mGson.fromJson(otherDataString, OtherData.class);

            List<String> fcmIosIds = new ArrayList<>();
            List<String> fcmIds = new ArrayList<>();
            String EmailId = "";
            for (int i = 0; i < easyFromUserList.size(); i++) {
                EasyFromUser zoomMeetingItem = easyFromUserList.get(i);
                if (zoomMeetingItem.getDeviceType().matches("ios")) {
                    fcmIosIds.add(zoomMeetingItem.getFcmid());
                } else {
                    fcmIds.add(zoomMeetingItem.getFcmid());
                }
                EmailId = zoomMeetingItem.getEmailId();
            }
            if (fcmIosIds.isEmpty() && fcmIds.isEmpty()) {
                return;
            }

            String roomName = "";
            String args = "";
            if (extras.containsKey(Utils.BroadcastActionExtrasKeys.NOTIFICATION_REMOTE_DATA) && extras.containsKey(Utils.BroadcastActionExtrasKeys.NOTIFICATION_ID)) {
                String notificationRemoteDataString = extras.getString(Utils.BroadcastActionExtrasKeys.NOTIFICATION_REMOTE_DATA, "");
                FirebaseRequestData mFirebaseRequestData = mGson.fromJson(notificationRemoteDataString, FirebaseRequestData.class);
                roomName = mFirebaseRequestData.getRoomName();
                args = mFirebaseRequestData.getArgs();
            } else {
                SharedPreferences sharedPreferences = mContext.getSharedPreferences("Jitsi_roomname", MODE_PRIVATE);
                String roomname = sharedPreferences.getString("Roomname","");
                roomName = roomname;
                String pluginArgsString = extras.getString(Utils.BroadcastActionExtrasKeys.JITSI_MEETING_PLUGIN_ARGS, "");
                Type listType = new TypeToken<List<PluginArgs>>() {}.getType();
                List<PluginArgs> pluginArgsList = mGson.fromJson(pluginArgsString, listType);
                args = mGson.toJson(pluginArgsList);
            }

            JSONArray mJsonArrayMain = new JSONArray();
            try{
                JSONObject mJsonObject = new JSONObject();
                JSONArray mJsonArrayPassData = new JSONArray();
                mJsonObject.put("username",mUserData.getUsername());
                mJsonObject.put("fcmid",mUserData.getFCMToken());
                mJsonObject.put("device_type",mUserData.getDeviceType());
                mJsonObject.put("user_id",mUserData.getUserid());
                mJsonObject.put("task_id",mOtherData.getServer_task_id());
                mJsonObject.put("flow_id",mOtherData.getFlow_id());
                mJsonObject.put("role_id",mOtherData.getRole_id());
                mJsonObject.put("site_id",mOtherData.getSite_id());
                mJsonObject.put("EmailId","");
                mJsonObject.put("start_status",mOtherData.getStart_status());
                mJsonObject.put("udf_id",mOtherData.getUdf_id());
                mJsonObject.put("feature_id",mUserData.getCompanyFeatureId());

                JSONObject mJsonObject1 = new JSONObject();
                mJsonArrayPassData.put(mJsonObject);
                mJsonObject1.put("zoom_meeting",mJsonArrayPassData);

                mJsonArrayMain.put(mJsonObject1);
                Log.d("mJsonArrayPassData", mJsonArrayMain.toString());

            }
            catch (Exception e)
            {

            }

            FirebaseRequestData data = new FirebaseRequestData(mUserData.getUsername() + " is Inviting you for Meet!",
                    "EASYFORM CALL",
                    "call", mUserData.getUsername(), roomName,
                    "jitsiMeet",
                    "0",
                    "",
                    mOtherData.getClickAction() + "",
                    mOtherData.getWebPush().toString() + "",
                    mUserData.getDeviceType() + "",
                    mUserData.getFCMToken() + "",
                    mUserData.getUserid() + "",mOtherData.getServer_task_id() + "", "jitsiMeet", "", "", false,"",mJsonArrayMain.toString()

            );
            callNotificationApi(data, false, fcmIds, fcmIosIds);

//            CustomJitsiMeetViewModel customJitsiMeetViewModel = new CustomJitsiMeetViewModel();
//            customJitsiMeetViewModel.Send_Email_Meeting_link(extras,mContext,EmailId);
        });
    }


    void sendNotificationScreenShear(Bundle extras, List<EasyFromUser> easyFromUserList, Boolean screenShear ,Context mContext) {
        mExecutorService.execute(() -> {

            String loginUserDataString = extras.getString(Utils.BroadcastActionExtrasKeys.LOGIN_USER_DATA, "");
            String otherDataString = extras.getString(Utils.BroadcastActionExtrasKeys.OTHER_DATA, "");

            UserData mUserData = mGson.fromJson(loginUserDataString, UserData.class);

            OtherData mOtherData = mGson.fromJson(otherDataString, OtherData.class);

            List<String> fcmIosIds = new ArrayList<>();
            List<String> fcmIds = new ArrayList<>();
            for (int i = 0; i < easyFromUserList.size(); i++) {
                EasyFromUser zoomMeetingItem = easyFromUserList.get(i);
                if (zoomMeetingItem.getDeviceType().matches("ios")) {
                    fcmIosIds.add(zoomMeetingItem.getFcmid());
                } else {
                    fcmIds.add(zoomMeetingItem.getFcmid());
                }
            }
            if (fcmIosIds.isEmpty() && fcmIds.isEmpty()) {
                return;
            }
            SharedPreferences sharedPreferences = mContext.getSharedPreferences("Jitsi_roomname", MODE_PRIVATE);
            String roomname = sharedPreferences.getString("Roomname","");

            FirebaseRequestData data = new FirebaseRequestData(mUserData.getUsername() + " is Screen Share Request to you!",
                    "EASYFORM ScreenShare",
                    "call", mUserData.getUsername(), roomname,
                    "jitsimeetScreenShare",
                    "0",
                    "",
                    mOtherData.getClickAction() + "",
                    mOtherData.getWebPush().toString() + "",
                    mUserData.getDeviceType() + "",
                    mUserData.getFCMToken() + "",
                    mUserData.getUserid() + "",mOtherData.getServer_task_id() + "", "jitsiMeet", "", "", screenShear,"",""
            );
            callNotificationApi(data, false, fcmIds, fcmIosIds);
        });
    }


    void sendDrewData(Bundle extras, List<EasyFromUser> easyFromUserList, String keyType, JSONArray motionevent) {
        try {
            JSONArray jsonArrayEvent = new JSONArray();
            jsonArrayEvent.put(motionevent);
            JSONObject jsonObject = new JSONObject();
            jsonObject.put(keyType, jsonArrayEvent);
           // Timber.tag("##REMOTEVIEW").d(jsonArrayEvent.toString());
            // sendNotificationScreenShearDrawData(extras, easyFromUserList, keyType, jsonObject.toString(),m);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    void sendNotificationScreenShearDrawData(Bundle extras, List<EasyFromUser> easyFromUserList, String keyType, String jsonData,Context mContext) {
        if (easyFromUserList.isEmpty()) {
            return;
        }
        mExecutorService.execute(() -> {
            String loginUserDataString = extras.getString(Utils.BroadcastActionExtrasKeys.LOGIN_USER_DATA, "");
            String otherDataString = extras.getString(Utils.BroadcastActionExtrasKeys.OTHER_DATA, "");

            UserData mUserData = mGson.fromJson(loginUserDataString, UserData.class);

            OtherData mOtherData = mGson.fromJson(otherDataString, OtherData.class);

            List<String> fcmIosIds = new ArrayList<>();
            List<String> fcmIds = new ArrayList<>();
            for (int i = 0; i < easyFromUserList.size(); i++) {
                EasyFromUser zoomMeetingItem = easyFromUserList.get(i);
                if (zoomMeetingItem.getDeviceType().matches("ios")) {
                    fcmIosIds.add(zoomMeetingItem.getFcmid());
                } else {
                    fcmIds.add(zoomMeetingItem.getFcmid());
                }
            }
            if (fcmIosIds.isEmpty() && fcmIds.isEmpty()) {
                return;
            }

            SharedPreferences sharedPreferences = mContext.getSharedPreferences("Jitsi_roomname", MODE_PRIVATE);
            String roomname = sharedPreferences.getString("Roomname","");

            FirebaseRequestData data = new FirebaseRequestData("selectedcolor",
                    "EASYFORM ScreenShare",
                    "call", mUserData.getUsername(), roomname,
                    "ARDAW",
                    "0",
                    "",
                    mOtherData.getClickAction() + "",
                    mOtherData.getWebPush().toString() + "",
                    mUserData.getDeviceType() + "",
                    mUserData.getFCMToken() + "",
                    mUserData.getUserid() + "", mOtherData.getServer_task_id() + "","jitsiMeet", keyType, jsonData, false,"",""
            );
            callNotificationApi(data, false, fcmIds, fcmIosIds);
        });
    }

    public void sendNotificationforviewcapture(Bundle extras, String keyType, String jsonData, Context mContext) {

        mExecutorService.execute(() -> {
            String loginUserDataString = extras.getString(Utils.BroadcastActionExtrasKeys.LOGIN_USER_DATA, "");
            String otherDataString = extras.getString(Utils.BroadcastActionExtrasKeys.OTHER_DATA, "");
            //   String pluginArgsString = extras.getString(Utils.BroadcastActionExtrasKeys.JITSI_MEETING_PLUGIN_ARGS, "");

            UserData mUserData = mGson.fromJson(loginUserDataString, UserData.class);

            OtherData mOtherData = mGson.fromJson(otherDataString, OtherData.class);

            List<String> fcmIosIds = new ArrayList<>();
            List<String> fcmIds = new ArrayList<>();


            String notificationRemoteDataString = extras.getString(Utils.BroadcastActionExtrasKeys.NOTIFICATION_REMOTE_DATA, "");
            if(!notificationRemoteDataString.equalsIgnoreCase("")) {
                FirebaseRequestData mFirebaseRequestData = mGson.fromJson(notificationRemoteDataString, FirebaseRequestData.class);

                if (mFirebaseRequestData.getDevice_type().matches("ios")) {
                    fcmIosIds.add(mFirebaseRequestData.getRemotetoken());
                } else {
                    fcmIds.add(mFirebaseRequestData.getRemotetoken());
                }
            }

            String pluginArgsString = extras.getString(Utils.BroadcastActionExtrasKeys.JITSI_MEETING_PLUGIN_ARGS, "");
            if(!pluginArgsString.equalsIgnoreCase("")) {
                Type listType = new TypeToken<List<PluginArgs>>() {
                }.getType();
                List<PluginArgs> pluginArgsList = mGson.fromJson(pluginArgsString, listType);
                for (int i = 0; i < pluginArgsList.get(0).getZoomMeeting().size(); i++) {
                    ZoomMeetingItem zoomMeetingItem = pluginArgsList.get(0).getZoomMeeting().get(i);
                    if (zoomMeetingItem.getDeviceType().matches("ios")) {
                        fcmIosIds.add(zoomMeetingItem.getFcmid());
                    } else {
                        fcmIds.add(zoomMeetingItem.getFcmid());
                    }
                }

            }

            if (fcmIosIds.isEmpty() && fcmIds.isEmpty()) {
                return;
            }


            SharedPreferences sharedPreferences = mContext.getSharedPreferences("Jitsi_roomname", MODE_PRIVATE);
            String roomname = sharedPreferences.getString("Roomname", "");
            Log.d("jsonData",jsonData);
            FirebaseRequestData data = new FirebaseRequestData("EASYFORM  screenshot",
                    "EASYFORM screenshot",
                    "call", mUserData.getUsername(), roomname,
                    "screenshot",
                    "0",
                    "",
                    mOtherData.getClickAction() + "",
                    mOtherData.getWebPush().toString() + "",
                    mUserData.getDeviceType() + "",
                    mUserData.getFCMToken() + "",
                    mUserData.getUserid() + "", mOtherData.getServer_task_id() + "", "jitsiMeet", keyType, jsonData, false, "",""
            );
            callNotificationApi(data, false, fcmIds, fcmIosIds);
        });
    }

    private void callNotificationApi(FirebaseRequestData data, Boolean isiOS, List<String> fcmIds, List<String> fcmIosIds) {

        FirebaseRequest firebaseRequest = new FirebaseRequest();
        if (isiOS) {
            firebaseRequest.setNotification(data);
            firebaseRequest.setRegistrationIds(fcmIosIds);
        } else {
            firebaseRequest.setData(data);
            firebaseRequest.setRegistrationIds(fcmIds);
        }

        try {
            List<String> targetTokens = isiOS ? fcmIosIds : fcmIds;

            for (String token : targetTokens) {
                FCMNotificationApiCall.sendNotification(data, token, isiOS);
            }

            // If we just sent Android notifications, send iOS next
            if (!isiOS && !fcmIosIds.isEmpty()) {
                callNotificationApi(data, true, fcmIds, fcmIosIds);
            }

        } catch (Exception e) {
            e.printStackTrace(); // Always log errors
        }
//        try {
//            if (!fcmIds.isEmpty() || isiOS) {
//                Response<FirebaseResponse> firebaseResponse = FCMNotificationApiCall.sendNotification(firebaseRequest).execute();
//                if (firebaseResponse.isSuccessful() && firebaseResponse.code() == 200) {
//                    if (!fcmIosIds.isEmpty() && !isiOS) {
//                        callNotificationApi(data, true, fcmIds, fcmIosIds);
//                    } else {
//
//                    }
//                }
//            } else if (!fcmIosIds.isEmpty()) {
//                callNotificationApi(data, true, fcmIds, fcmIosIds);
//            }
//        } catch (Exception e) {
//
//        }
    }

   public static void getUserDataFromCompanyId(Bundle extras, int offset, int fetch) {
        mExecutorService.execute(() -> {
            String loginUserDataString = extras.getString(Utils.BroadcastActionExtrasKeys.LOGIN_USER_DATA, "");
            String apiAuthString = extras.getString(Utils.BroadcastActionExtrasKeys.API_AUTH, "");
            String otherDataString = extras.getString(Utils.BroadcastActionExtrasKeys.OTHER_DATA, "");

            UserData mUserData = mGson.fromJson(loginUserDataString, UserData.class);
            OtherData mOtherData = mGson.fromJson(otherDataString, OtherData.class);
            ApiAuth mApiAuth = mGson.fromJson(apiAuthString, ApiAuth.class);


            try {
                List<ApiAuth> mApiAuthList = new ArrayList();
                mApiAuthList.add(mApiAuth);
                List<EasyFromUserRequest> mEasyFromUserRequestList = new ArrayList();
                mEasyFromUserRequestList.add(new EasyFromUserRequest(Integer.parseInt(mUserData.getCompanyId()),offset,fetch, mApiAuthList));

                Response<List<EasyFromUserItem>> mJwtTokenResponse = RetrofitClient.getApiServices().getUserDataFromCompanyId(
                        mOtherData.getUserDataFromCompanyIdUrl(),
                        apiAuthString, mUserData.getCompanyFeatureId(),
                        mUserData.getRoleId(), "0", "0"
                        , mEasyFromUserRequestList).execute();
                if (mJwtTokenResponse.isSuccessful() && mJwtTokenResponse.body() != null) {
//                    _easyFromUserItemList.postValue(mJwtTokenResponse.body());
                    List<EasyFromUserItem> body = mJwtTokenResponse.body();

                    if (body.isEmpty()) {
                        return;
                    }
                    EasyFromUserItem first = body.get(0);

                    if (first.getStatus() == 2) {
                        _easyFromUserItemList.postValue(null);
                        CustomJitsiMeetActivity.hasMoreData = false;  // stop pagination
                        return;
                    }
                    if (first.getData() != null && !first.getData().isEmpty()) {
                        _easyFromUserItemList.postValue(body);
                    }
                }
            } catch (Exception e) {
                _easyFromUserItemList.postValue(null);
            }
        });
    }


    void sendNotificationScreenSize(Bundle extras, String remoteHeight, String remoteWidth,Context mContext) {
        if (easyFromUserItemList.getValue() == null || easyFromUserItemList.getValue().isEmpty()) {
            return;
        }
        mExecutorService.execute(() -> {
            String loginUserDataString = extras.getString(Utils.BroadcastActionExtrasKeys.LOGIN_USER_DATA, "");
            String otherDataString = extras.getString(Utils.BroadcastActionExtrasKeys.OTHER_DATA, "");

            UserData mUserData = mGson.fromJson(loginUserDataString, UserData.class);

            OtherData mOtherData = mGson.fromJson(otherDataString, OtherData.class);

            List<String> fcmIosIds = new ArrayList<>();
            List<String> fcmIds = new ArrayList<>();

            if (extras.containsKey(Utils.BroadcastActionExtrasKeys.NOTIFICATION_REMOTE_DATA) && extras.containsKey(Utils.BroadcastActionExtrasKeys.NOTIFICATION_ID)) {
                String notificationRemoteDataString = extras.getString(Utils.BroadcastActionExtrasKeys.NOTIFICATION_REMOTE_DATA, "");
                FirebaseRequestData mFirebaseRequestData = mGson.fromJson(notificationRemoteDataString, FirebaseRequestData.class);

                if (mFirebaseRequestData.getDevice_type().matches("ios")) {
                    fcmIosIds.add(mFirebaseRequestData.getRemotetoken());
                } else {
                    fcmIds.add(mFirebaseRequestData.getRemotetoken());
                }

            } else {

                String pluginArgsString = extras.getString(Utils.BroadcastActionExtrasKeys.JITSI_MEETING_PLUGIN_ARGS, "");
                Type listType = new TypeToken<List<PluginArgs>>() {}.getType();
                List<PluginArgs> pluginArgsList = mGson.fromJson(pluginArgsString, listType);
                for (int i = 0; i < pluginArgsList.get(0).getZoomMeeting().size(); i++) {
                    ZoomMeetingItem zoomMeetingItem = pluginArgsList.get(0).getZoomMeeting().get(i);
                    if (zoomMeetingItem.getDeviceType().matches("ios")) {
                        fcmIosIds.add(zoomMeetingItem.getFcmid());
                    } else {
                        fcmIds.add(zoomMeetingItem.getFcmid());
                    }
                }
            }

            if (fcmIosIds.isEmpty() && fcmIds.isEmpty()) {
                return;
            }
            JSONObject jsonObject = new JSONObject();
            try {
                jsonObject.put("remoteHeight", remoteHeight);
                jsonObject.put("remoteWidth", remoteWidth);
            } catch (JSONException e) {
                Log.d("remotesize", jsonObject.toString());
                e.printStackTrace();
            }
            JSONArray jsonObject1 = new JSONArray();
            JSONObject mJsonObject1 = new JSONObject();
            JSONArray mJsonArrayPassData = new JSONArray();
            try {
                jsonObject1.put(remoteWidth);
                jsonObject1.put(remoteHeight);
                jsonObject1.put("android");
                mJsonArrayPassData.put(jsonObject1);
                mJsonObject1.put("screensize",mJsonArrayPassData);
            } catch (JSONException e) {
                Log.d("remotesize", jsonObject1.toString());
                e.printStackTrace();
            }

            SharedPreferences sharedPreferences = mContext.getSharedPreferences("Jitsi_roomname", MODE_PRIVATE);
            String roomname = sharedPreferences.getString("Roomname","");
            FirebaseRequestData data = new FirebaseRequestData("screensize",
                    "EASYFORM",
                    "call", mUserData.getUsername(), roomname,
                    "remotesize",
                    "0",
                    "",
                    mOtherData.getClickAction() + "",
                    mOtherData.getWebPush().toString() + "",
                    mUserData.getDeviceType() + "",
                    mUserData.getFCMToken() + "",
                    mUserData.getUserid() + "",mOtherData.getServer_task_id() + "", "jitsiMeet", "screensize", jsonObject.toString(), false,mJsonObject1.toString(),""
            );
            callNotificationApi(data, false, fcmIds, fcmIosIds);
        });
    }


    void sendNotificationScreenShearStop (Bundle extras, Boolean screenShear,Context mContext) {

        if (easyFromUserItemList.getValue() == null || easyFromUserItemList.getValue().isEmpty()) {
            return;
        }
        mExecutorService.execute(() -> {
            String loginUserDataString = extras.getString(Utils.BroadcastActionExtrasKeys.LOGIN_USER_DATA, "");
            String otherDataString = extras.getString(Utils.BroadcastActionExtrasKeys.OTHER_DATA, "");

            UserData mUserData = mGson.fromJson(loginUserDataString, UserData.class);

            OtherData mOtherData = mGson.fromJson(otherDataString, OtherData.class);

            List<String> fcmIosIds = new ArrayList<>();
            List<String> fcmIds = new ArrayList<>();

            if (extras.containsKey(Utils.BroadcastActionExtrasKeys.NOTIFICATION_REMOTE_DATA) && extras.containsKey(Utils.BroadcastActionExtrasKeys.NOTIFICATION_ID)) {
                String notificationRemoteDataString = extras.getString(Utils.BroadcastActionExtrasKeys.NOTIFICATION_REMOTE_DATA, "");
                FirebaseRequestData mFirebaseRequestData = mGson.fromJson(notificationRemoteDataString, FirebaseRequestData.class);

                if (mFirebaseRequestData.getDevice_type().matches("ios")) {
                    fcmIosIds.add(mFirebaseRequestData.getRemotetoken());
                } else {
                    fcmIds.add(mFirebaseRequestData.getRemotetoken());
                }

            } else {

                String pluginArgsString = extras.getString(Utils.BroadcastActionExtrasKeys.JITSI_MEETING_PLUGIN_ARGS, "");
                Type listType = new TypeToken<List<PluginArgs>>() {}.getType();
                List<PluginArgs> pluginArgsList = mGson.fromJson(pluginArgsString, listType);
                for (int i = 0; i < pluginArgsList.get(0).getZoomMeeting().size(); i++) {
                    ZoomMeetingItem zoomMeetingItem = pluginArgsList.get(0).getZoomMeeting().get(i);
                    if (zoomMeetingItem.getDeviceType().matches("ios")) {
                        fcmIosIds.add(zoomMeetingItem.getFcmid());
                    } else {
                        fcmIds.add(zoomMeetingItem.getFcmid());
                    }
                }
            }

            if (fcmIosIds.isEmpty() && fcmIds.isEmpty()) {
                return;
            }
            JSONObject mJsonObject1 = new JSONObject();
            JSONObject mJsonObject = new JSONObject();
            JSONArray mJsonArray = new JSONArray();
            try {
                mJsonObject.put("screenshare","stop");
                mJsonArray.put(mJsonObject);
                mJsonObject1.put("stoparevent",mJsonArray);
            } catch (JSONException e) {
                Log.d("remotesize", mJsonObject1.toString());
                e.printStackTrace();
            }
            SharedPreferences sharedPreferences = mContext.getSharedPreferences("Jitsi_roomname", MODE_PRIVATE);
            String roomname = sharedPreferences.getString("Roomname","");

            FirebaseRequestData data = new FirebaseRequestData("screenstop",
                    "EASYFORM",
                    "call", mUserData.getUsername(), roomname,
                    "jitsimeetScreenShare",
                    "0",
                    "",
                    mOtherData.getClickAction() + "",
                    mOtherData.getWebPush().toString() + "",
                    mUserData.getDeviceType() + "",
                    mUserData.getFCMToken() + "",
                    mUserData.getUserid() + "",mOtherData.getServer_task_id() + "", "jitsiMeet", "stoparevent", mJsonObject1.toString(), false,mJsonObject1.toString(),""
            );
            callNotificationApi(data, false, fcmIds, fcmIosIds);
        });

    }

    public void sendNotificationforstopcall(Bundle extras, Context mContext) {

        mExecutorService.execute(() -> {
            String loginUserDataString = extras.getString(Utils.BroadcastActionExtrasKeys.LOGIN_USER_DATA, "");
            String otherDataString = extras.getString(Utils.BroadcastActionExtrasKeys.OTHER_DATA, "");
            //   String pluginArgsString = extras.getString(Utils.BroadcastActionExtrasKeys.JITSI_MEETING_PLUGIN_ARGS, "");

            UserData mUserData = mGson.fromJson(loginUserDataString, UserData.class);

            OtherData mOtherData = mGson.fromJson(otherDataString, OtherData.class);

            List<String> fcmIosIds = new ArrayList<>();
            List<String> fcmIds = new ArrayList<>();

            if (extras.containsKey(Utils.BroadcastActionExtrasKeys.NOTIFICATION_REMOTE_DATA) && extras.containsKey(Utils.BroadcastActionExtrasKeys.NOTIFICATION_ID)) {
                String notificationRemoteDataString = extras.getString(Utils.BroadcastActionExtrasKeys.NOTIFICATION_REMOTE_DATA, "");
                FirebaseRequestData mFirebaseRequestData = mGson.fromJson(notificationRemoteDataString, FirebaseRequestData.class);

                if (mFirebaseRequestData.getDevice_type().matches("ios")) {
                    fcmIosIds.add(mFirebaseRequestData.getRemotetoken());
                } else {
                    fcmIds.add(mFirebaseRequestData.getRemotetoken());
                }

            } else {

                String pluginArgsString = extras.getString(Utils.BroadcastActionExtrasKeys.JITSI_MEETING_PLUGIN_ARGS, "");
                Type listType = new TypeToken<List<PluginArgs>>() {}.getType();
                List<PluginArgs> pluginArgsList = mGson.fromJson(pluginArgsString, listType);
                for (int i = 0; i < pluginArgsList.get(0).getZoomMeeting().size(); i++) {
                    ZoomMeetingItem zoomMeetingItem = pluginArgsList.get(0).getZoomMeeting().get(i);
                    if (zoomMeetingItem.getDeviceType().matches("ios")) {
                        fcmIosIds.add(zoomMeetingItem.getFcmid());
                    } else {
                        fcmIds.add(zoomMeetingItem.getFcmid());
                    }
                }
            }

            if (fcmIosIds.isEmpty() && fcmIds.isEmpty()) {
                return;
            }

            SharedPreferences sharedPreferences = mContext.getSharedPreferences("Jitsi_roomname", MODE_PRIVATE);
            String roomname = sharedPreferences.getString("Roomname", "");

            FirebaseRequestData data = new FirebaseRequestData("Meeting End",
                    mUserData.getUsername() + " is End Meeting !",
                    "call", mUserData.getUsername(), roomname,
                    "jitsicallstop",
                    "0",
                    "",
                    mOtherData.getClickAction() + "",
                    mOtherData.getWebPush().toString() + "",
                    mUserData.getDeviceType() + "",
                    mUserData.getFCMToken() + "",
                    mUserData.getUserid() + "", mOtherData.getServer_task_id() + "", "jitsiMeet", "stopcall", "", false, "",""
            );
            callNotificationApi(data, false, fcmIds, fcmIosIds);
        });
    }


    public void sendNotificationforPhotoId(Bundle extras, Context mContext) {

        mExecutorService.execute(() -> {
            String loginUserDataString = extras.getString(Utils.BroadcastActionExtrasKeys.LOGIN_USER_DATA, "");
            String otherDataString = extras.getString(Utils.BroadcastActionExtrasKeys.OTHER_DATA, "");
            //   String pluginArgsString = extras.getString(Utils.BroadcastActionExtrasKeys.JITSI_MEETING_PLUGIN_ARGS, "");

            UserData mUserData = mGson.fromJson(loginUserDataString, UserData.class);

            OtherData mOtherData = mGson.fromJson(otherDataString, OtherData.class);

            List<String> fcmIosIds = new ArrayList<>();
            List<String> fcmIds = new ArrayList<>();


                String notificationRemoteDataString = extras.getString(Utils.BroadcastActionExtrasKeys.NOTIFICATION_REMOTE_DATA, "");
                if(!notificationRemoteDataString.equalsIgnoreCase("")) {
                    FirebaseRequestData mFirebaseRequestData = mGson.fromJson(notificationRemoteDataString, FirebaseRequestData.class);

                    if (mFirebaseRequestData.getDevice_type().matches("ios")) {
                        fcmIosIds.add(mFirebaseRequestData.getRemotetoken());
                    } else {
                        fcmIds.add(mFirebaseRequestData.getRemotetoken());
                    }
                }

                String pluginArgsString = extras.getString(Utils.BroadcastActionExtrasKeys.JITSI_MEETING_PLUGIN_ARGS, "");
                if(!pluginArgsString.equalsIgnoreCase("")) {
                    Type listType = new TypeToken<List<PluginArgs>>() {
                    }.getType();
                    List<PluginArgs> pluginArgsList = mGson.fromJson(pluginArgsString, listType);
                    for (int i = 0; i < pluginArgsList.get(0).getZoomMeeting().size(); i++) {
                        ZoomMeetingItem zoomMeetingItem = pluginArgsList.get(0).getZoomMeeting().get(i);
                        if (zoomMeetingItem.getDeviceType().matches("ios")) {
                            fcmIosIds.add(zoomMeetingItem.getFcmid());
                        } else {
                            fcmIds.add(zoomMeetingItem.getFcmid());
                        }
                    }

            }

            if (fcmIosIds.isEmpty() && fcmIds.isEmpty()) {
                return;
            }
            JSONObject mJsonObject = new JSONObject();
            JSONArray mJsonArray = new JSONArray();
            try{
                mJsonObject.put("PhotoId",extras.getInt("Photo_Id"));
                mJsonObject.put("task_id",extras.getString("task_id"));
                mJsonObject.put("file_name",extras.getString("Photo_name"));
                mJsonObject.put("photo_path",extras.getString("Photo_path"));
                mJsonObject.put("photo_size",extras.getString("Photo_size"));
                mJsonObject.put("checksheet_id",extras.getString("checksheet_id"));
                mJsonObject.put("que_id",extras.getString("que_id"));
                mJsonObject.put("LOGIN_USER_DATA",loginUserDataString);
                mJsonObject.put("OTHER_DATA",otherDataString);
                mJsonObject.put("JITSI_MEETING_PLUGIN_ARGS",pluginArgsString);
                mJsonArray.put(mJsonObject);
            }
            catch (Exception e)
            {

            }

            SharedPreferences sharedPreferences = mContext.getSharedPreferences("Jitsi_roomname", MODE_PRIVATE);
            String roomname = sharedPreferences.getString("Roomname", "");

            FirebaseRequestData data = new FirebaseRequestData("Photo upload success ",
                    mUserData.getUsername() + " Photo upload successfully !",
                    "call", mUserData.getUsername(), roomname,
                    "jitsicallPhotoId",
                    "0",
                    "",
                    mOtherData.getClickAction() + "",
                    mOtherData.getWebPush().toString() + "",
                    mUserData.getDeviceType() + "",
                    mUserData.getFCMToken() + "",
                    mUserData.getUserid() + "", mOtherData.getServer_task_id() + "", "jitsiMeet", "PhotoId", mJsonArray.toString(), false, "",""
            );
            callNotificationApi(data, false, fcmIds, fcmIosIds);
        });
    }

    String METHOD_NAME_UPDATE_TASK_CUSTOMER_LOG_USER = "update_Task_Customer_Log_user";
    public void Get_photoid(Bundle bundle,Context context)
    {
        mExecutorService.execute(() -> {
            // comment notification recevie code becuse photo capture proceess changes 21072026
//            String notificationRemoteDataString = bundle.getString(Utils.BroadcastActionExtrasKeys.NOTIFICATION_REMOTE_DATA, "");
//            FirebaseRequestData mFirebaseRequestData = mGson.fromJson(notificationRemoteDataString, FirebaseRequestData.class);
//
//
//            int notificationId = (int) System.currentTimeMillis();
//
//            NotificationUtils.rejectCallNotification(notificationId, context,
//                    mFirebaseRequestData.getTitle(),
//                    mFirebaseRequestData.getBody(),
//                    R.drawable.atc_logo);
            JSONObject mJsonObject = new JSONObject();
            JSONArray mJsonArray = new JSONArray();
            try {


                mJsonObject.put("PhotoId",bundle.getInt("Photo_Id"));
                mJsonObject.put("task_id",bundle.getString("task_id"));
                mJsonObject.put("file_name",bundle.getString("Photo_name"));
                mJsonObject.put("photo_path",bundle.getString("Photo_path"));
                mJsonObject.put("photo_size",bundle.getString("Photo_size"));
                mJsonObject.put("checksheet_id",bundle.getString("checksheet_id"));
                mJsonObject.put("que_id",bundle.getString("que_id"));
                mJsonObject.put("LOGIN_USER_DATA",bundle.getString("LOGIN_USER_DATA"));
                mJsonObject.put("OTHER_DATA",bundle.getString("OTHER_DATA"));
                mJsonObject.put("JITSI_MEETING_PLUGIN_ARGS",bundle.getString("JITSI_MEETING_PLUGIN_ARGS"));
                mJsonArray.put(mJsonObject);

//                JSONArray mJsonArray = new JSONArray(mFirebaseRequestData.getJsonData());
//                JSONObject mJsonObject = mJsonArray.getJSONObject(0);

                JitsiScreenShotPlugin.sendSuccessToJS(mJsonArray.toString());
                String loginUserDataString = mJsonObject.getString("LOGIN_USER_DATA");
                String otherDataString = mJsonObject.getString("OTHER_DATA");

                UserData mUserData = mGson.fromJson(loginUserDataString, UserData.class);
                OtherData mOtherData = mGson.fromJson(otherDataString, OtherData.class);


                String ChecksheetId = mJsonObject.getString("checksheet_id");
                String question_id = mJsonObject.getString("que_id");
                String task_id = mJsonObject.getString("task_id");
                String Photo_Id = mJsonObject.getString("PhotoId");
                String Photo_name = mJsonObject.getString("file_name");
                String Photo_size = mJsonObject.getString("photo_size");
                Photo_size = Photo_size.replace("KB", "").trim();
                float photosize = Float.parseFloat(Photo_size);

                photosize = photosize * 1000;       // KB → Bytes
                photosize = photosize / 1048576f; //byte to MB conversion

                ArrayList<Object> myArray = new ArrayList<>();
                myArray.add(Photo_name);
                myArray.add(Photo_name);
                myArray.add("");
                myArray.add("");
                myArray.add(Photo_Id);
                myArray.add(photosize);

                JSONObject JsonObject = new JSONObject();
                JsonObject.put("id", task_id);
                JsonObject.put("StepNo", "1");
                JsonObject.put("Checksheet_type_id", "1");
                JsonObject.put("Checksheet_Id", ChecksheetId);
                JsonObject.put("Que_Id", question_id);
                JsonObject.put("Answer", new JSONArray(myArray));
                JsonObject.put("Type", "7");
                JsonObject.put("Mode", "date");

                String responsetxt = WebApiCallJitsiMeet.ExecuteNetworkRequest(JsonObject, mOtherData.getCommon_Wcf_Url(), METHOD_NAME_UPDATE_TASK_CUSTOMER_LOG_USER, mUserData);
                if (responsetxt != null) {
                    String status = null;
                    String message = null;
                    JSONArray jsonArray1 = new JSONArray(responsetxt);

                    for (int k = 0; k < jsonArray1.length(); k++) {
                        JSONObject jsonObject1 = jsonArray1.getJSONObject(0);
                        status = jsonObject1.getString("status");
                        message = jsonObject1.getString("message");

                        if (status.equalsIgnoreCase("1")) {
                            Handler leftHandler = new Handler(Looper.getMainLooper());
                            leftHandler.post(new Runnable() {
                                @Override
                                public void run() {
                                    Toast.makeText(context, "photo uploaded successfully", Toast.LENGTH_SHORT).show();
                                }
                            });

                        }
                        if (status.equalsIgnoreCase("3") || status.equalsIgnoreCase("5")) {
                            Handler leftHandler = new Handler(Looper.getMainLooper());
                            String finalMessage = message;
                            leftHandler.post(new Runnable() {
                                @Override
                                public void run() {
                                    Toast.makeText(context, "APi : " + METHOD_NAME_UPDATE_TASK_CUSTOMER_LOG_USER + "\n" + finalMessage, Toast.LENGTH_SHORT).show();

                                }
                            });


                        }
                    }
                }

            } catch (JSONException e) {
                e.printStackTrace();
            }
        });

    }

    private static final String METHOD_NAME_SendMsg = "WCF_Mobile_Notification_Master";
    public void Send_Email_Meeting_link(Bundle extras,Context context,String EmailId )
    {

        try{
            String loginUserDataString  = extras.getString(Utils.BroadcastActionExtrasKeys.LOGIN_USER_DATA, "");
            String otherDataString  = extras.getString(Utils.BroadcastActionExtrasKeys.OTHER_DATA, "");

            UserData  mUserData = mGson.fromJson(loginUserDataString, UserData.class);
            OtherData mOtherData = mGson.fromJson(otherDataString, OtherData.class);
            SharedPreferences sharedPreferences = context.getSharedPreferences("Jitsi_roomname", MODE_PRIVATE);
            String roomname = sharedPreferences.getString("Roomname","");
            String meeting_link =  Apis.JITSI_URL + "/"+roomname ;
            String Message = "Hi," + mUserData.getUsername() + "is inviting you to a meeting.<br>Join the meeting from below link:" + meeting_link + "'";

            List<String> emailList = Arrays.asList(EmailId);


            JSONObject mJsonObject = new JSONObject();
            mJsonObject.put("subject","Invitation For Meeting");
            mJsonObject.put("message",Message);
//            mJsonObject.put("From","");
            mJsonObject.put("email",emailList);
            mJsonObject.put("Cc","[]");
            mJsonObject.put("Bcc","[]");
            mJsonObject.put("contact","[]");
            mJsonObject.put("server_task_id",mOtherData.getServer_task_id());
            mJsonObject.put("checksheet_id","0");
            mJsonObject.put("step_id","0");
            mJsonObject.put("que_id","0");
            mJsonObject.put("client_request_id",mUserData.getUserid()+"_"+System.currentTimeMillis());

            String Responsetext =  WebApiCallJitsiMeet.ExecuteNetworkRequest(mJsonObject,mOtherData.getCommon_Wcf_Url(),METHOD_NAME_SendMsg,mUserData);
            if(Responsetext != null)
            {
                String status = null;
                String message = null;
                JSONArray jsonArray1 = new JSONArray(Responsetext);
                for (int k = 0; k < jsonArray1.length(); k++) {
                    JSONObject jsonObject = jsonArray1.getJSONObject(0);
                    status = jsonObject.getString("status");
                    message = jsonObject.getString("message");

                    if (status.equalsIgnoreCase("3") || status.equalsIgnoreCase("5")){

                        Handler leftHandler = new Handler(Looper.getMainLooper());
                        String finalMessage = message;
                        String finalStatus = status;
                        leftHandler.post(new Runnable() {
                            @Override
                            public void run() {
                                Toast.makeText(context, "Status: " + finalStatus +"APi : " + METHOD_NAME_SendMsg + "\n" + finalMessage, Toast.LENGTH_SHORT).show();
                            }
                        });
                    }
                }

            }
            else {

            }
        }
        catch (Exception e)
        {

        }
    }

    public void sendNotificationforphotosave(Bundle extras, Context mContext) {

        mExecutorService.execute(() -> {
            String loginUserDataString = extras.getString(Utils.BroadcastActionExtrasKeys.LOGIN_USER_DATA, "");
            String otherDataString = extras.getString(Utils.BroadcastActionExtrasKeys.OTHER_DATA, "");
            //   String pluginArgsString = extras.getString(Utils.BroadcastActionExtrasKeys.JITSI_MEETING_PLUGIN_ARGS, "");

            UserData mUserData = mGson.fromJson(loginUserDataString, UserData.class);

            OtherData mOtherData = mGson.fromJson(otherDataString, OtherData.class);

            List<String> fcmIosIds = new ArrayList<>();
            List<String> fcmIds = new ArrayList<>();


            String notificationRemoteDataString = extras.getString(Utils.BroadcastActionExtrasKeys.NOTIFICATION_REMOTE_DATA, "");
            if(!notificationRemoteDataString.equalsIgnoreCase("")) {
                FirebaseRequestData mFirebaseRequestData = mGson.fromJson(notificationRemoteDataString, FirebaseRequestData.class);

                if (mFirebaseRequestData.getDevice_type().matches("ios")) {
                    fcmIosIds.add(mFirebaseRequestData.getRemotetoken());
                } else {
                    fcmIds.add(mFirebaseRequestData.getRemotetoken());
                }
            }

            String pluginArgsString = extras.getString(Utils.BroadcastActionExtrasKeys.JITSI_MEETING_PLUGIN_ARGS, "");
            if(!pluginArgsString.equalsIgnoreCase("")) {
                Type listType = new TypeToken<List<PluginArgs>>() {
                }.getType();
                List<PluginArgs> pluginArgsList = mGson.fromJson(pluginArgsString, listType);
                for (int i = 0; i < pluginArgsList.get(0).getZoomMeeting().size(); i++) {
                    ZoomMeetingItem zoomMeetingItem = pluginArgsList.get(0).getZoomMeeting().get(i);
                    if (zoomMeetingItem.getDeviceType().matches("ios")) {
                        fcmIosIds.add(zoomMeetingItem.getFcmid());
                    } else {
                        fcmIds.add(zoomMeetingItem.getFcmid());
                    }
                }

            }

            if (fcmIosIds.isEmpty() && fcmIds.isEmpty()) {
                return;
            }


            SharedPreferences sharedPreferences = mContext.getSharedPreferences("Jitsi_roomname", MODE_PRIVATE);
            String roomname = sharedPreferences.getString("Roomname", "");

            FirebaseRequestData data = new FirebaseRequestData("Photo save success ",
                    mUserData.getUsername() + " Photo save successfully !",
                    "call", mUserData.getUsername(), roomname,
                    "photosave",
                    "0",
                    "",
                    mOtherData.getClickAction() + "",
                    mOtherData.getWebPush().toString() + "",
                    mUserData.getDeviceType() + "",
                    mUserData.getFCMToken() + "",
                    mUserData.getUserid() + "", mOtherData.getServer_task_id() + "", "jitsiMeet", "jitsiMeet", "photosave", false, "",""
            );
            callNotificationApi(data, false, fcmIds, fcmIosIds);
        });
    }

    public void SavePhoto(Bundle bundle,Context context)
    {
        mExecutorService.execute(() -> {
            String notificationRemoteDataString = bundle.getString(Utils.BroadcastActionExtrasKeys.NOTIFICATION_REMOTE_DATA, "");
            FirebaseRequestData mFirebaseRequestData = mGson.fromJson(notificationRemoteDataString, FirebaseRequestData.class);


            int notificationId = (int) System.currentTimeMillis();

//            NotificationUtils.rejectCallNotification(notificationId, context,
//                    mFirebaseRequestData.getTitle(),
//                    mFirebaseRequestData.getBody(),
//                    R.drawable.atc_logo);

            Handler leftHandler = new Handler(Looper.getMainLooper());
            leftHandler.post(new Runnable() {
                @Override
                public void run() {
                    Toast.makeText(context, "Photo saved", Toast.LENGTH_SHORT).show();
                }
            });

        });
    }
}

