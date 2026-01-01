package com.easyform.newjitsi.activitys.loading;

import static android.content.Context.MODE_PRIVATE;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import com.easyform.newjitsi.activitys.jitsimeet.CustomJitsiMeetViewModel;
import com.easyform.newjitsi.network.Models.ApiAuth;
import com.easyform.newjitsi.network.Models.OtherData;
import com.easyform.newjitsi.network.Models.UserData;
import com.easyform.newjitsi.network.Models.pluginArgs.PluginArgs;
import com.easyform.newjitsi.network.Models.pluginArgs.ZoomMeetingItem;
import com.easyform.newjitsi.network.RetrofitClient;
import com.easyform.newjitsi.network.requests.jwtToken.RoomNo;
import com.easyform.newjitsi.network.requests.notifcation.FirebaseRequest;
import com.easyform.newjitsi.network.requests.notifcation.FirebaseRequestData;
import com.easyform.newjitsi.network.response.jwtToken.JwtTokenResponse;
import com.easyform.newjitsi.network.response.notifcation.FirebaseResponse;
import com.easyform.newjitsi.utils.FCMNotificationApiCall;
import com.easyform.newjitsi.utils.Utils;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import org.json.JSONArray;
import org.json.JSONObject;

import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import retrofit2.Response;

public class LoadingViewModel extends ViewModel {

    private final MutableLiveData<Boolean> _allNotificationSend = new MutableLiveData<Boolean>();
    LiveData<Boolean> allNotificationSend = _allNotificationSend;


    private final MutableLiveData<JwtTokenResponse> _jwtTokenResponse = new MutableLiveData<JwtTokenResponse>();
    LiveData<JwtTokenResponse> jwtTokenResponse = _jwtTokenResponse;
    ExecutorService mExecutorService = Build.VERSION.SDK_INT >= Build.VERSION_CODES.N ? Executors.newWorkStealingPool(4) :
            Executors.newFixedThreadPool(4);
    Gson mGson = new Gson();
    String Roomname;
    SharedPreferences sharedPreferences;
    SharedPreferences.Editor editor;

    void sendNotification(Bundle extras, Context mContext) {
        mExecutorService.execute(() -> {
            String pluginArgsString = extras.getString(Utils.BroadcastActionExtrasKeys.JITSI_MEETING_PLUGIN_ARGS, "");
            String loginUserDataString = extras.getString(Utils.BroadcastActionExtrasKeys.LOGIN_USER_DATA, "");
            //  String apiAuthString = extras.getString(Utils.BroadcastActionExtrasKeys.API_AUTH, "");
            String otherDataString = extras.getString(Utils.BroadcastActionExtrasKeys.OTHER_DATA, "");

            Type listType = new TypeToken<List<PluginArgs>>() {
            }.getType();
            List<PluginArgs> pluginArgsList = mGson.fromJson(pluginArgsString, listType);
            UserData mUserData = mGson.fromJson(loginUserDataString, UserData.class);
//            ApiAuth mApiAuth = mGson.fromJson(apiAuthString, ApiAuth.class);
            OtherData mOtherData = mGson.fromJson(otherDataString, OtherData.class);

            List<String> fcmIosIds = new ArrayList<>();
            List<String> fcmIds = new ArrayList<>();
            ZoomMeetingItem zoomMeetingItem = null;
            for (int i = 0; i < pluginArgsList.get(0).getZoomMeeting().size(); i++) {
                zoomMeetingItem = pluginArgsList.get(0).getZoomMeeting().get(i);
                if (zoomMeetingItem.getDeviceType().matches("ios")) {
                    fcmIosIds.add(zoomMeetingItem.getFcmid());
                } else {
                    fcmIds.add(zoomMeetingItem.getFcmid());
                }
            }
            if (fcmIosIds.isEmpty() && fcmIds.isEmpty()) {
                return;
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

            Roomname = mUserData.getUserid() + "" + mUserData.getCompanyId() + "" +System.currentTimeMillis();

            sharedPreferences = mContext.getSharedPreferences("Jitsi_roomname", MODE_PRIVATE);
            editor = sharedPreferences.edit();
            editor.putString("Roomname",Roomname);
            editor.commit();
            FirebaseRequestData data = new FirebaseRequestData(mUserData.getUsername() + " is Inviting you for Meet!",
                    "EASYFORM CALL",
                    "call", mUserData.getUsername(), Roomname,
                    "jitsiMeet",
                    "0",
                    "",
                    mOtherData.getClickAction() + "",
                    mOtherData.getWebPush().toString() + "",
                    mUserData.getDeviceType() + "",
                    mUserData.getFCMToken() + "",
                    mUserData.getUserid() + "",mOtherData.getServer_task_id() + "", "jitsiMeet","","",false,"",mJsonArrayMain.toString()
            );
            callNotificationApi(data, false, fcmIds, fcmIosIds);

//            CustomJitsiMeetViewModel customJitsiMeetViewModel = new CustomJitsiMeetViewModel();
//             customJitsiMeetViewModel.Send_Email_Meeting_link(extras,mContext,mOtherData.getEmailId());
        });
    }

    void callNotificationApi(FirebaseRequestData data, Boolean isiOS, List<String> fcmIds, List<String> fcmIosIds) {
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
            else {
                _allNotificationSend.postValue(true);
            }

        } catch (Exception e) {
            _allNotificationSend.postValue(false);
        }
//        try {
//            if (!fcmIds.isEmpty() || isiOS) {
//                Response<FirebaseResponse> firebaseResponse = FCMNotificationApiCall.sendNotification(firebaseRequest).execute();
//                if (firebaseResponse.isSuccessful() && firebaseResponse.code() == 200) {
//                    if (!fcmIosIds.isEmpty() && !isiOS) {
//                        callNotificationApi(data, true, fcmIds, fcmIosIds);
//                    } else {
//                        _allNotificationSend.postValue(true);
//                    }
//                }
//            } else if (!fcmIosIds.isEmpty()) {
//                callNotificationApi(data, true, fcmIds, fcmIosIds);
//            }
//        } catch (Exception e) {
//            _allNotificationSend.postValue(false);
//        }
    }


    void getJwtToken(Bundle extras,Context mContext) {
        mExecutorService.execute(() -> {
            String loginUserDataString = extras.getString(Utils.BroadcastActionExtrasKeys.LOGIN_USER_DATA, "");
            String apiAuthString = extras.getString(Utils.BroadcastActionExtrasKeys.API_AUTH, "");
            String otherDataString = extras.getString(Utils.BroadcastActionExtrasKeys.OTHER_DATA, "");
            UserData mUserData = mGson.fromJson(loginUserDataString, UserData.class);
            OtherData mOtherData = mGson.fromJson(otherDataString, OtherData.class);
            List<RoomNo> roomNoList = new ArrayList<>();
            if (extras.containsKey(Utils.BroadcastActionExtrasKeys.NOTIFICATION_REMOTE_DATA) && extras.containsKey(Utils.BroadcastActionExtrasKeys.NOTIFICATION_ID)) {
                String notificationRemoteDataString = extras.getString(Utils.BroadcastActionExtrasKeys.NOTIFICATION_REMOTE_DATA, "");
                FirebaseRequestData mFirebaseRequestData = mGson.fromJson(notificationRemoteDataString, FirebaseRequestData.class);
                roomNoList.add(new RoomNo(mFirebaseRequestData.getRoomName(), ""));
            } else {
              //  Roomname = mUserData.getUserid() + "" + mUserData.getCompanyId();
                SharedPreferences sharedPreferences = mContext.getSharedPreferences("Jitsi_roomname", MODE_PRIVATE);
                String roomname = sharedPreferences.getString("Roomname","");
//                sharedPreferences = mContext.getSharedPreferences("Jitsi_roomname", MODE_PRIVATE);
//                editor = sharedPreferences.edit();
//                editor.putString("Roomname",Roomname);
//                editor.commit();
                roomNoList.add(new RoomNo(roomname, ""));
            }
            try {
                Response<List<JwtTokenResponse>> mJwtTokenResponse = RetrofitClient.getApiServices().getJwtToken(mOtherData.getWcfUrl(), apiAuthString, roomNoList).execute();
                if (mJwtTokenResponse.isSuccessful() && mJwtTokenResponse.code() == 200) {
                    _jwtTokenResponse.postValue(mJwtTokenResponse.body().get(0));
                }
            } catch (Exception e) {
                _jwtTokenResponse.postValue(null);
            }
        });
    }
}
