package com.example.easyformzoom;

import android.content.Intent;
import android.graphics.Point;
import android.os.Bundle;
import android.util.Log;
import android.view.Display;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.example.easyformzoom.zoom.App;
import com.example.easyformzoom.zoom.firebase.RemoteUtils;
import com.example.easyformzoom.zoom.initsdk.InitAuthSDKCallback;
import com.example.easyformzoom.zoom.initsdk.InitAuthSDKHelper;
import com.example.easyformzoom.zoom.startjoinmeeting.UserLoginCallback;
import com.example.easyformzoom.zoom.ui.APIUserStartJoinMeetingActivity;

import us.zoom.sdk.MeetingParameter;
import us.zoom.sdk.MeetingServiceListener;
import us.zoom.sdk.MeetingStatus;
import us.zoom.sdk.ZoomApiError;
import us.zoom.sdk.ZoomError;
import us.zoom.sdk.ZoomSDK;

public class MainActivityZoom extends AppCompatActivity implements InitAuthSDKCallback, MeetingServiceListener, UserLoginCallback.ZoomDemoAuthenticationListener {

    private ZoomSDK mZoomSDK;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main_zoom);

        App.context = this;
        getRealSizeOfDisplay();
        if (ZoomSDK.getInstance().isInitialized()) {
            startMeetingJoinActivity();
        } else {
            initZoomSdk();
        }
        Log.d("##MainZoom", "onCreate");
    }

    void startMeetingJoinActivity() {
        Toast.makeText(this, "Initialize Zoom SDK successfully.", Toast.LENGTH_LONG).show();
        Intent i = new Intent(this, APIUserStartJoinMeetingActivity.class);
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        startActivity(i);
        this.finish();
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
                    startMeetingJoinActivity();
                }
            }
        } catch (Exception e) {
            Log.d("SDKADDError", e.toString());
        }


    }

    @Override
    public void onZoomSDKLoginResult(long result) {
        startMeetingJoinActivity();
    }

    @Override
    public void onZoomSDKLogoutResult(long result) {

    }

    @Override
    public void onZoomIdentityExpired() {

    }

    @Override
    public void onZoomAuthIdentityExpired() {
        Log.d("##MainZoom", "onZoomAuthIdentityExpired: ");

    }

    private void initZoomSdk() {
        try {
            mZoomSDK = ZoomSDK.getInstance();
            InitAuthSDKHelper.getInstance().initSDK(this, this);
        } catch (Exception e) {
            Log.d("SDKADDError", e.toString());
        }

    }

    private void getRealSizeOfDisplay() {
        Display display = getWindowManager().getDefaultDisplay();
        Point size = new Point();
        display.getRealSize(size);
        final int height = size.y;
        final int width = size.x;

        RemoteUtils.setRealSizeHeight(height);
        RemoteUtils.setRealSizeWidth(width);

//        pref = sqlitewraper.getSecureShared("SCREEN_SIZE");
//        pref.putString("MY_HEIGHT", String.valueOf(height)); // Saving string
//        pref.putString("MY_WIDTH", String.valueOf(width)); // Saving string
//        pref.commit();
    }


    @Override
    public void onMeetingStatusChanged(MeetingStatus meetingStatus, int i, int i1) {

    }

    @Override
    public void onMeetingParameterNotification(MeetingParameter meetingParameter) {

    }
}