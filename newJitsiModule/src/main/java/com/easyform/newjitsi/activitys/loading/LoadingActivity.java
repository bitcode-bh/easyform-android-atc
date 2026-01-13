package com.easyform.newjitsi.activitys.loading;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.lifecycle.ViewModelProvider;

import android.Manifest;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.widget.Toast;

import com.easyform.newjitsi.App;
import com.easyform.newjitsi.R;
import com.easyform.newjitsi.activitys.jitsimeet.CustomJitsiMeetActivity;
import com.easyform.newjitsi.databinding.ActivityLoadingBinding;
import com.easyform.newjitsi.fragments.MultiChoiceDialogFragment;
import com.easyform.newjitsi.network.Models.OtherData;
import com.easyform.newjitsi.network.Models.UserData;
import com.easyform.newjitsi.network.requests.notifcation.FirebaseRequestData;
import com.easyform.newjitsi.utils.NotificationUtils;
import com.easyform.newjitsi.utils.Utils;
import com.google.gson.Gson;

public class LoadingActivity extends AppCompatActivity {
    ActivityLoadingBinding mActivityLoadingBinding = null;
    LoadingViewModel mLoadingViewModel;
    SharedPreferences sharedPreferences;
    SharedPreferences.Editor editor;
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        mActivityLoadingBinding = ActivityLoadingBinding.inflate(getLayoutInflater());
        setContentView(mActivityLoadingBinding.getRoot());
        mLoadingViewModel = new ViewModelProvider(this).get(LoadingViewModel.class);

        if (!hasPermissions()) {
            requestPermissions();
            return;
        }

        init();
    }

    Gson mGson = new Gson();
    String action = null;
    Bundle extras = null;

    void init() {
        App.setContext(getApplicationContext());
        action = getIntent().getAction();
        extras = getIntent().getExtras();
        MultiChoiceDialogFragment.inviteListItems.clear();
        MultiChoiceDialogFragment.adapter = null;
        String loginUserDataString = extras.getString(Utils.BroadcastActionExtrasKeys.LOGIN_USER_DATA, "");
        UserData mUserData = mGson.fromJson(loginUserDataString, UserData.class);
        String otherDataString = extras.getString(Utils.BroadcastActionExtrasKeys.OTHER_DATA, "");
        OtherData mOtherData = mGson.fromJson(otherDataString, OtherData.class);
        if (action.matches(Utils.BroadcastAction.JITSI_PLUGIN_CALL)) {
            mLoadingViewModel.sendNotification(extras,LoadingActivity.this);
        } else if (action.matches(Utils.BroadcastAction.JITSI_CALL_ACCEPT)) {
            NotificationUtils.stopRingtone();
            sharedPreferences = getApplicationContext().getSharedPreferences("jitsicall", MODE_PRIVATE);
            editor = sharedPreferences.edit();
            editor.putString("isclick","true");
            editor.commit();
            mLoadingViewModel.getJwtToken(extras,LoadingActivity.this);
        }
        mLoadingViewModel.allNotificationSend.observe(this, aBoolean -> {
            mLoadingViewModel.getJwtToken(extras,LoadingActivity.this);
        });
        mLoadingViewModel.jwtTokenResponse.observe(this, jwtTokenResponse -> {
            if (jwtTokenResponse != null) {
                if (extras.containsKey(Utils.BroadcastActionExtrasKeys.NOTIFICATION_REMOTE_DATA) && extras.containsKey(Utils.BroadcastActionExtrasKeys.NOTIFICATION_ID)) {
                    String notificationRemoteDataString = extras.getString(Utils.BroadcastActionExtrasKeys.NOTIFICATION_REMOTE_DATA, "");
                    FirebaseRequestData mFirebaseRequestData = mGson.fromJson(notificationRemoteDataString, FirebaseRequestData.class);

                    Utils.clearNotification(LoadingActivity.this, extras.getInt(Utils.BroadcastActionExtrasKeys.NOTIFICATION_ID, -2));

                    CustomJitsiMeetActivity.customLaunch(LoadingActivity.this, mFirebaseRequestData.getRoomName(), mUserData,mOtherData, extras);
                    LoadingActivity.this.finish();
                } else {
                    SharedPreferences sharedPreferences = getApplicationContext().getSharedPreferences("Jitsi_roomname", MODE_PRIVATE);
                    String roomname = sharedPreferences.getString("Roomname","");
                    CustomJitsiMeetActivity.customLaunch(LoadingActivity.this, roomname, mUserData,mOtherData, extras);
                    LoadingActivity.this.finish();
                }
            } else {
              //  Toast.makeText(LoadingActivity.this, "jwtToken is Null", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private static final int PERMISSIONS_REQUEST_CODE = 1001;

    private boolean hasPermissions() {
        return ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED &&
                ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;
    }

    private void requestPermissions() {
        ActivityCompat.requestPermissions(this,
                new String[]{Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO},
                PERMISSIONS_REQUEST_CODE);
    }


    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);

        if (requestCode == PERMISSIONS_REQUEST_CODE) {
            boolean allGranted = true;
            for (int result : grantResults) {
                if (result != PackageManager.PERMISSION_GRANTED) {
                    allGranted = false;
                    break;
                }
            }

            if (allGranted) {
                init();
            } else {
                Toast.makeText(this, "Camera and Microphone permissions are required", Toast.LENGTH_LONG).show();
                finish();
            }
        }
    }


}