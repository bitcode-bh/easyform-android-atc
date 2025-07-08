package com.easyform.newjitsi.activitys;

import androidx.appcompat.app.AppCompatActivity;
import androidx.lifecycle.ViewModelProvider;

import android.content.Intent;
import android.os.Bundle;

import com.easyform.newjitsi.R;
import com.easyform.newjitsi.network.Apis;
import com.easyform.newjitsi.network.requests.AuthJson;
import com.easyform.newjitsi.network.requests.LoginData;
import com.easyform.newjitsi.network.requests.notifcation.NotificationData;
import com.easyform.newjitsi.utils.Utils;
import com.easyform.newjitsi.viewModels.ProgressViewModel;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import java.util.List;

public class ProgressActivity extends AppCompatActivity {

    ProgressViewModel mProgressViewModel = null;
    Gson mGson = new Gson();
    AuthJson mAuthJson = null;
    LoginData mLoginData = null;
    String url = null;
    String roomNameNoti = null;
    String roomName = null;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_progress);
        mProgressViewModel = new ViewModelProvider(this).get(ProgressViewModel.class);
        initObserves();
        getIntentExtra(getIntent().getExtras());


    }

    private void getIntentExtra(Bundle extras) {
        try {
            mAuthJson = (AuthJson) extras.getSerializable(Utils.BundleExtras.AUTHJSON_DATA);
            mLoginData = (LoginData) extras.getSerializable(Utils.BundleExtras.LOGIN_DATA);
            url = extras.getString(Utils.BundleExtras.URL);
            try {
                roomNameNoti = extras.getString(Utils.BundleExtras.ROOM_NAME, "");
            } catch (Exception e) {
                roomNameNoti = null;
            }

            if (extras.containsKey(Utils.BundleExtras.FCM_IOS_IDS_LIST) && extras.containsKey(Utils.BundleExtras.FCM_IDS_LIST)) {
                try {
                    NotificationData notificationData = (NotificationData) extras.getSerializable(Utils.BundleExtras.NOTIFICATION_DATA);
                    List<String> fcmIosIds = mGson.fromJson(extras.getString(Utils.BundleExtras.FCM_IOS_IDS_LIST), new TypeToken<List<String>>() {
                    }.getType());
                    List<String> fcmIds = mGson.fromJson(extras.getString(Utils.BundleExtras.FCM_IDS_LIST), new TypeToken<List<String>>() {
                    }.getType());
                    mProgressViewModel.sendNotification(fcmIds, notificationData, fcmIosIds, false);
                } catch (Exception e) {

                }
            } else {
                mProgressViewModel.getJwtToken(url, mAuthJson, mLoginData, roomNameNoti);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void initObserves() {
        mProgressViewModel.isNotificationAPIIsFinish.observe(this, aBoolean -> {
            if (aBoolean) {
                mProgressViewModel.getJwtToken(url, mAuthJson, mLoginData, roomNameNoti);
               /* Intent mIntent = new Intent(ProgressActivity.this, JitsiMeetCustomActivity.class);
                mIntent.putExtras(ProgressActivity.this.getIntent().getExtras());
                ProgressActivity.this.startActivity(mIntent);*/
            }
        });
        mProgressViewModel.jwtTokenResponceList.observe(this, jwtTokenResponces -> {
            if (!jwtTokenResponces.isEmpty()) {
                if (roomNameNoti != null && !roomNameNoti.isEmpty()) {
                    roomName = roomNameNoti;
                } else {
                    roomName = mLoginData.getUserId() + "" + mLoginData.getCompanyId();
                }
                // String token = "https://video.easyform.in/" + roomName + "?jwt=" + jwtTokenResponces.get(0).getData();
                String token = roomName;
                String UserDataURL = Apis.WCFURL + Apis.getuserdata;
                sendToJitsiCustomActivity(token, UserDataURL, mLoginData);
            }
        });
    }


    public void sendToJitsiCustomActivity(String JWTToken,
                                          String UserDataURL, LoginData mLoginData) {
        try {
            if (JWTToken.length() > 0) {
                Intent jitsiMeetView = new Intent(this, JitsiMeetCustomActivity.class);
                jitsiMeetView.setFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
                jitsiMeetView.putExtra(Utils.BundleExtras.JWT_TOKEN, JWTToken);
                jitsiMeetView.putExtra(Utils.BundleExtras.USER_DATA_URL, UserDataURL);
                jitsiMeetView.putExtra(Utils.BundleExtras.LOGIN_DATA, mLoginData);
                startActivity(jitsiMeetView);
                finish();
            }
        } catch (RuntimeException e) {
            e.printStackTrace();
        }
    }
}