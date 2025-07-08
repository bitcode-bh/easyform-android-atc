package com.easyform.jitsi.ui.activitys;

import android.annotation.SuppressLint;
import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Bundle;
import android.util.Log;
import android.widget.ProgressBar;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.lifecycle.ViewModelProvider;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import com.easyform.jitsi.R;
import com.easyform.jitsi.databinding.ActivityMainJitsiBinding;
import com.easyform.jitsi.network.Apis;
import com.easyform.jitsi.network.Models.JwtTokenResponce;

import com.easyform.jitsi.network.RetrofitClient;
import com.easyform.jitsi.network.requests.AuthJson;
import com.easyform.jitsi.network.requests.LoginData;
import com.easyform.jitsi.network.requests.RoomNo;
import com.easyform.jitsi.utils.LogUtils;
import com.easyform.jitsi.viewModels.MainViewModel;
import com.facebook.react.modules.core.PermissionListener;
import com.github.ybq.android.spinkit.sprite.Sprite;
import com.github.ybq.android.spinkit.style.DoubleBounce;
import com.github.ybq.android.spinkit.style.FoldingCube;
import com.github.ybq.android.spinkit.style.MultiplePulseRing;
import com.github.ybq.android.spinkit.style.PulseRing;
import com.google.gson.Gson;

import org.jitsi.meet.sdk.BroadcastEvent;
import org.jitsi.meet.sdk.BroadcastIntentHelper;
import org.jitsi.meet.sdk.JitsiMeetActivityInterface;

import java.util.ArrayList;
import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import timber.log.Timber;

/**
 * Created by  SAVAN SOLANKI on 10/06/2022.
 *
 * @author Savan Solanki
 */
public class MainActivityJitsi extends AppCompatActivity {
    static final String TAG = "MainActivityJitsi";
    ActivityMainJitsiBinding activityMainJitsiBinding;
    MainViewModel mainViewModel;
    AuthJson authJson;
    LoginData loginData;
    String roomNameNoti = null;

    private final BroadcastReceiver broadcastReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            onBroadcastReceived(intent);
        }
    };

    @Override
    protected void onDestroy() {
        LocalBroadcastManager.getInstance(this).unregisterReceiver(broadcastReceiver);

        super.onDestroy();
    }

    @SuppressLint("LogNotTimber")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        activityMainJitsiBinding = ActivityMainJitsiBinding.inflate(getLayoutInflater());
        setContentView(activityMainJitsiBinding.getRoot());
        getSupportActionBar().hide();
        mainViewModel = new ViewModelProvider(this).get(MainViewModel.class);

        LogUtils.JitsiLogFile(mainViewModel.toString(), "onCreate");
        String url = getIntent().getExtras().getString("Url", "");
        LogUtils.JitsiLogFile("URL=> " + url, "onCreate");
        authJson = (AuthJson) getIntent().getExtras().getSerializable("authJson");
        LogUtils.JitsiLogFile("authJson=> " + authJson, "onCreate");
        loginData = (LoginData) getIntent().getExtras().getSerializable("loginData");
        LogUtils.JitsiLogFile("loginData=> " + loginData, "onCreate");
        String getUserData = getIntent().getExtras().getString("userGetData", "");
        String auth1 = getIntent().getExtras().getString("auth1", "");
        String Rold_id = getIntent().getExtras().getString("Rold_id", "");
        String companyFeatureid = getIntent().getExtras().getString("companyFeatureid", "");
        String body = getIntent().getExtras().getString("body", "");
        String Args = getIntent().getExtras().getString("Args", "");
        String senderfcmid = getIntent().getExtras().getString("senderfcmid", "");
        Boolean accept = getIntent().getExtras().getBoolean("accept", false);
        String remoteMessageData = getIntent().getExtras().getString("remoteMessageData", "");
        String authData = getIntent().getExtras().getString("authData", "");

        int notificationId = getIntent().getExtras().getInt("notificationId", -2);
        if (notificationId != -2) {
            NotificationManager mNotificationManager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            mNotificationManager.cancel(notificationId);
            mNotificationManager.cancelAll();
        }
        ProgressBar progressBar = (ProgressBar) findViewById(R.id.spin_kit);
        Sprite doubleBounce = new MultiplePulseRing();
        progressBar.setIndeterminateDrawable(doubleBounce);
        try {
            roomNameNoti = getIntent().getExtras().getString("roomName", "");
        } catch (Exception e) {
            roomNameNoti = null;
            LogUtils.JitsiLogFile(e.toString(), "roonamenNoti80Exception");
        }


//        mainViewModel.setJitsiMeetConference();
        registerForBroadcastMessages();
        List<RoomNo> roomNos = new ArrayList<>();
        String roomName;
        String Emailsend = "";
        if (roomNameNoti != null && !roomNameNoti.isEmpty()) {
            roomName = roomNameNoti;
        } else {
            roomName = loginData.getUserId() + "" + loginData.getCompanyId();
        }
        roomNos.add(new RoomNo(roomName, Emailsend));
        Log.d("Auth", new Gson().toJson(authJson));
        String UserDataURL = Apis.WCFURL + Apis.getuserdata;
        RetrofitClient.getApiServices().getJwtToken(url, new Gson().toJson(authJson), roomNos).enqueue(new Callback<List<JwtTokenResponce>>() {
            @Override
            public void onResponse(@NonNull Call<List<JwtTokenResponce>> call, @NonNull Response<List<JwtTokenResponce>> response) {
                LogUtils.JitsiLogFile(response.toString(), "Responseforserver99");
                if (response.isSuccessful()) {
                    if (response.body() != null) {
                        List<JwtTokenResponce> jwtTokenResponces = response.body();
//                        String token = "https://video.easyform.in/" + roomName + "?jwt=" + jwtTokenResponces.get(0).getData();
                        String token = roomName;
                        mainViewModel.joinJitsiMeet(MainActivityJitsi.this, token, UserDataURL, body, auth1, Rold_id, companyFeatureid, authJson, loginData, Args, senderfcmid, accept, remoteMessageData, getUserData, authData, roomName);
                    }
                }
            }

            @Override
            public void onFailure(@NonNull Call<List<JwtTokenResponce>> call, @NonNull Throwable t) {
                Log.e(TAG, t.toString());
//                LogUtils.JitsiLogFile(t.toString(), "onFailure119");

            }
        });
    }

    private void registerForBroadcastMessages() {
        IntentFilter intentFilter = new IntentFilter();
        for (BroadcastEvent.Type type : BroadcastEvent.Type.values()) {
            intentFilter.addAction(type.getAction());
        }
        LocalBroadcastManager.getInstance(this).registerReceiver(broadcastReceiver, intentFilter);
    }

    // Example for handling different JitsiMeetSDK events
    private void onBroadcastReceived(Intent intent) {
        if (intent != null) {
            BroadcastEvent event = new BroadcastEvent(intent);

            switch (event.getType()) {
                case CONFERENCE_JOINED:
                    Timber.i("Conference Joined with url%s", event.getData().get("url"));
                    break;
                case PARTICIPANT_JOINED:
                    Timber.i("Participant joined%s", event.getData().get("name"));
                    break;
            }
        }
    }

    boolean isFromBack = false;

    @Override
    protected void onResume() {
        super.onResume();
        if (isFromBack) {
            hangUp();
        } else {
            isFromBack = true;
        }
    }

    private void hangUp() {
        Intent hangupBroadcastIntent = BroadcastIntentHelper.buildHangUpIntent();
        LocalBroadcastManager.getInstance(getApplicationContext()).sendBroadcast(hangupBroadcastIntent);
        onBackPressed();
    }
}