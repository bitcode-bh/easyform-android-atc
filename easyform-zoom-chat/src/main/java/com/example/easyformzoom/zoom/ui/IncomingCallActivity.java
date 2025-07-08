package com.example.easyformzoom.zoom.ui;

import static android.content.ContentValues.TAG;
import static com.example.easyformzoom.zoom.App.context;

import android.app.KeyguardManager;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.os.CountDownTimer;
import android.util.Log;
import android.view.View;
import android.view.WindowManager;
import android.view.animation.Animation;
import android.view.animation.AnimationUtils;
import android.widget.ImageButton;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.NotificationManagerCompat;

//import com.example.easyformzoom.DeviceEventsUtils;
import com.example.easyformzoom.R;
import com.example.easyformzoom.zoom.App;
import com.example.easyformzoom.zoom.firebase.DeviceEventsUtilsZoom;
import com.example.easyformzoom.zoom.initsdk.InitAuthSDKCallback;
import com.example.easyformzoom.zoom.initsdk.InitAuthSDKHelper;
import com.example.easyformzoom.zoom.inmeetingfunction.zoommeetingui.ZoomMeetingUISettingHelper;
import com.example.easyformzoom.zoom.startjoinmeeting.UserLoginCallback;


import us.zoom.sdk.InMeetingService;
import us.zoom.sdk.InMeetingShareController;
import us.zoom.sdk.InMeetingUserInfo;
import us.zoom.sdk.JoinMeetingOptions;
import us.zoom.sdk.JoinMeetingParams;
import us.zoom.sdk.MeetingParameter;
import us.zoom.sdk.MeetingService;
import us.zoom.sdk.MeetingServiceListener;
import us.zoom.sdk.MeetingStatus;
import us.zoom.sdk.ZoomApiError;
import us.zoom.sdk.ZoomError;
import us.zoom.sdk.ZoomSDK;
import us.zoom.sdk.ZoomSDKInitParams;
import us.zoom.sdk.ZoomSDKInitializeListener;


public class IncomingCallActivity extends AppCompatActivity implements MeetingServiceListener, InitAuthSDKCallback ,UserLoginCallback.ZoomDemoAuthenticationListener{

    ImageButton btnAccept;
    ImageButton btnReject;
    TextView txtCallfrom;
    private String meetingId;
    private String meetingPass;
    private String callFrom;
    private ZoomSDK mZoomSDK;
    Intent intent;
    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_incomingcall);

        App.context = this;

        DeviceEventsUtilsZoom.retriveDataFromSharedPreferences();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            // For newer than Android Oreo: call setShowWhenLocked, setTurnScreenOn
            setShowWhenLocked(true);
            setTurnScreenOn(true);
            // If you want to display the keyguard to prompt the user to unlock the phone:
            KeyguardManager keyguardManager = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
            keyguardManager.requestDismissKeyguard(this, null);
            keyguardManager.inKeyguardRestrictedInputMode();
        } else {
            // For older versions, do it as you did before.
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        }

        int flags = WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                | WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
                | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
                | WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH
                | WindowManager.LayoutParams.FLAG_FULLSCREEN;
        getWindow().addFlags(flags);

        final Animation myAnim = AnimationUtils.loadAnimation(this, R.anim.bounce);

        btnAccept = findViewById(R.id.takeBtn);
        btnReject = findViewById(R.id.rejectBtn);
        txtCallfrom = findViewById(R.id.type_inc_call);
        btnReject.setAnimation(myAnim);
        btnAccept.setAnimation(myAnim);

//      MyBounceInterpolator interpolator = new MyBounceInterpolator(0.2, 5);
//      myAnim.setInterpolator(interpolator);

        btnAccept.startAnimation(myAnim);

        new CountDownTimer(30000, 3000) {
            public void onTick(long millisUntilFinished) {
                btnAccept.startAnimation(myAnim);
                btnReject.startAnimation(myAnim);
            }
            public void onFinish() {
            }
        }.start();
        intent = getIntent();
        if (intent != null) {

            callFrom = intent.getStringExtra("callfrom");

            if (intent.getAction().equals("open")) {
                meetingId = intent.getStringExtra("meetingid");
                meetingPass = intent.getStringExtra("meetingpass");
                callFrom = intent.getStringExtra("callfrom");
            }

            txtCallfrom.setText(callFrom + " is calling...");
        }
        if (ZoomSDK.getInstance().isInitialized()) {
            StartJoinActivity();
        } else {
            initZoomSdk();
        }

        btnAccept.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {

                dismissNotification();
                joinMeeting(IncomingCallActivity.this, meetingId, meetingPass);
                Intent i = new Intent(IncomingCallActivity.this,LoginUserStartJoinMeetingActivity.class);
                i.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
                startActivity(i);
                finish();
//                final Handler handler = new Handler(Looper.getMainLooper());
//                handler.postDelayed(new Runnable() {
//                    @Override
//                    public void run() {
//                        //Do something after 100ms
////                        joinMeeting(IncomingCallActivity.this, meetingId, meetingPass);
////                        finish();
//                    }
//                }, 2000);
            }
        });
        btnReject.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                dismissNotification();
                finish();
            }
        });

    }

    public void StartJoinActivity()
    {
        if (intent.getAction().equals("join")) {
            meetingId = intent.getStringExtra("meetingid");
            meetingPass = intent.getStringExtra("meetingpass");
            callFrom = intent.getStringExtra("callfrom");
                if (meetingId != null || meetingPass != null) {
                    Intent i = new Intent(IncomingCallActivity.this,InitAuthSDKActivity.class);
                    i.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
                    startActivityForResult(i,101);
                    joinMeeting(this, meetingId, meetingPass);
//                  finish();
                }
        }
    }
    private void initZoomSdk() {
        try {
            mZoomSDK = ZoomSDK.getInstance();
            InitAuthSDKHelper.getInstance().initSDK(this, this);
        } catch (Exception e) {
            Log.d("SDKADDError", e.toString());
        }

    }

    @Override
    protected void onResume() {
        super.onResume();
//        if (!ZoomSDK.getInstance().isInitialized()) {
//            initializeSdk(this);
//        }
    }

    @Override
    protected void onStart() {
        super.onStart();
    }

    MeetingServiceListener meetingServiceListener = new MeetingServiceListener() {
        @Override
        public void onMeetingStatusChanged(MeetingStatus meetingStatus, int i, int i1) {
            Log.d("##ONMEETING", meetingStatus.name());
            if (meetingStatus == MeetingStatus.MEETING_STATUS_INMEETING) {
                Toast.makeText(getApplicationContext(), "Meeting joined successfully", Toast.LENGTH_LONG).show();
                ZoomSDK sdk = ZoomSDK.getInstance();
                InMeetingService inMeetingService = sdk.getInMeetingService();
                String meetingId = String.valueOf(inMeetingService.getCurrentMeetingNumber());
                String meetingPassword = inMeetingService.getMeetingPassword();

                InMeetingUserInfo meetingUserInfo=inMeetingService.getMyUserInfo();
                String userName = meetingUserInfo.getUserName();

                InMeetingShareController inMeetingShareController=inMeetingService.getInMeetingShareController();
                inMeetingShareController.startShareScreenContent();

                Log.d("##MEETINGINFO_NAME",userName);
            }
        }

        @Override
        public void onMeetingParameterNotification(MeetingParameter meetingParameter) {

        }
    };

    public void joinMeeting(Context context, String meetingNumber, String password) {

        try {
            Log.d("##JOINMEETING", "NUMER: " + meetingNumber);

            if (DeviceEventsUtilsZoom.username.equalsIgnoreCase("")){
                DeviceEventsUtilsZoom.retriveDataFromSharedPreferences();
            }

            MeetingService meetingService = ZoomSDK.getInstance().getMeetingService();

            meetingService.addListener(meetingServiceListener);
            JoinMeetingOptions options = new JoinMeetingOptions();
            JoinMeetingParams params = new JoinMeetingParams();
            params.displayName = DeviceEventsUtilsZoom.username; // TODO: Enter your name
            params.meetingNo = meetingNumber;
            params.password = password;
            meetingService.joinMeetingWithParams(context, params, options);
        }catch (Exception e){
//            Toast.makeText(getApplicationContext(),e.getMessage(),Toast.LENGTH_SHORT).show();
        }
    }

//    public void initializeSdk(Context context) {
//        ZoomSDK sdk = ZoomSDK.getInstance();
//        //TODO: Do not use hard-coded values for your key/secret in your app in production!
//        ZoomSDKInitParams params = new ZoomSDKInitParams();
//        params.appKey = "xaE725k7gJvxoAfPlVjz3APEBnFyVpw7sevC"; // TODO: Retrieve your SDK key and enter it here
//        params.appSecret = "UyrlWZLicibCCQCCM8a4GYgOrBayBdQUQyeF"; // TODO: Retrieve your SDK secret and enter it here
//        params.domain = "zoom.us";
//        params.enableLog = true;
//        //TODO: Add functionality to this listener (e.g. logs for debugging)
//        ZoomSDKInitializeListener listener = new ZoomSDKInitializeListener() {
//            /**
//             * @param errorCode {@link us.zoom.sdk.ZoomError#ZOOM_ERROR_SUCCESS} if the SDK has been initialized successfully.
//             */
//            @Override
//            public void onZoomSDKInitializeResult(int errorCode, int internalErrorCode) {
//                Log.d("##SDKINTILIZE", String.valueOf(errorCode));
//            }
//
//            @Override
//            public void onZoomAuthIdentityExpired() {
//                Log.d("##SDKINTILIZE", "Authenticity Expired");
//            }
//        };
//        sdk.initialize(context, listener, params);
//    }

    public void dismissNotification() {
        NotificationManagerCompat notificationManager1 = NotificationManagerCompat.from(getApplicationContext());
        notificationManager1.cancel(202);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        finish();
    }

    @Override
    public void onZoomSDKLoginResult(long result) {
        joinMeeting(this, meetingId, meetingPass);
    }

    @Override
    public void onZoomSDKLogoutResult(long result) {

    }

    @Override
    public void onZoomIdentityExpired() {

    }

    @Override
    public void onMeetingStatusChanged(MeetingStatus meetingStatus, int i, int i1) {

    }

    @Override
    public void onMeetingParameterNotification(MeetingParameter meetingParameter) {

    }

    @Override
    public void onZoomSDKInitializeResult(int errorCode, int internalErrorCode) {
        try {
            Log.i("##ZOOM", "onZoomSDKInitializeResult, errorCode=" + errorCode + ", internalErrorCode=" + internalErrorCode);

            if (errorCode != ZoomError.ZOOM_ERROR_SUCCESS) {
                Toast.makeText(this, "Failed to initialize Zoom SDK. Error: " + errorCode + ", internalErrorCode=" + internalErrorCode, Toast.LENGTH_LONG).show();
            } else {
                ZoomSDK.getInstance().getZoomUIService().enableMinimizeMeeting(false);
//            ZoomSDK.getInstance().getZoomUIService().setMiniMeetingViewSize(new CustomizedMiniMeetingViewSize(0, 0, 360, 540);
//            setMiniWindows();
                ZoomSDK.getInstance().getMeetingSettingsHelper().enable720p(false);
                ZoomSDK.getInstance().getMeetingSettingsHelper().enableShowMyMeetingElapseTime(true);
                ZoomSDK.getInstance().getMeetingService().addListener(this);
                ZoomSDK.getInstance().getMeetingSettingsHelper().setCustomizedMeetingUIEnabled(true);
//            ZoomSDK.getInstance().getMeetingSettingsHelper().setCustomizedNotificationData(null, handle);

                if (mZoomSDK.tryAutoLoginZoom() == ZoomApiError.ZOOM_API_ERROR_SUCCESS) {
                    UserLoginCallback.getInstance().addListener(this);
                } else {
                    StartJoinActivity();
                }
            }
        } catch (Exception e) {
            Log.d("SDKADDError", e.toString());
        }
    }

    @Override
    public void onZoomAuthIdentityExpired() {

    }
}
