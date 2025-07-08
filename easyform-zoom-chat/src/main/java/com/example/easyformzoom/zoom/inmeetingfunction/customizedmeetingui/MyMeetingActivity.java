package com.example.easyformzoom.zoom.inmeetingfunction.customizedmeetingui;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.AlertDialog;
import android.app.Dialog;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.graphics.Point;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.provider.Settings;
import android.text.Editable;
import android.text.TextUtils;
import android.text.TextWatcher;
import android.util.DisplayMetrics;
import android.util.Log;
import android.util.Size;
import android.view.Display;
import android.view.GestureDetector;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Filter;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ListView;
import android.widget.PopupWindow;
import android.widget.RelativeLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.fragment.app.FragmentActivity;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.easyformzoom.R;
import com.example.easyformzoom.zoom.App;
import com.example.easyformzoom.zoom.datautils.ListUsernameFId;
import com.example.easyformzoom.zoom.drawing.ArDrawingUtils;
import com.example.easyformzoom.zoom.drawing.CameraPreviewActivity;
import com.example.easyformzoom.zoom.drawing.CustomNormalDrawing;
import com.example.easyformzoom.zoom.drawing.DrawingEventListner;
import com.example.easyformzoom.zoom.drawing.ImageArrowUtils;
import com.example.easyformzoom.zoom.drawing.PaintView;
import com.example.easyformzoom.zoom.drawing.PaintViewNormal;
import com.example.easyformzoom.zoom.firebase.NetworkCallZoomChat;
import com.example.easyformzoom.zoom.firebase.RemoteUtils;
import com.example.easyformzoom.zoom.inmeetingfunction.customizedmeetingui.audio.MeetingAudioCallback;
import com.example.easyformzoom.zoom.inmeetingfunction.customizedmeetingui.audio.MeetingAudioHelper;
import com.example.easyformzoom.zoom.inmeetingfunction.customizedmeetingui.bo.BOEventCallback;
import com.example.easyformzoom.zoom.inmeetingfunction.customizedmeetingui.other.MeetingCommonCallback;
import com.example.easyformzoom.zoom.inmeetingfunction.customizedmeetingui.remotecontrol.MeetingRemoteControlHelper;
import com.example.easyformzoom.zoom.inmeetingfunction.customizedmeetingui.share.MeetingShareCallback;
import com.example.easyformzoom.zoom.inmeetingfunction.customizedmeetingui.share.MeetingShareHelper;
import com.example.easyformzoom.zoom.inmeetingfunction.customizedmeetingui.user.MeetingUserCallback;
import com.example.easyformzoom.zoom.inmeetingfunction.customizedmeetingui.video.MeetingVideoCallback;
import com.example.easyformzoom.zoom.inmeetingfunction.customizedmeetingui.video.MeetingVideoHelper;
import com.example.easyformzoom.zoom.inmeetingfunction.customizedmeetingui.view.MeetingOptionBar;
import com.example.easyformzoom.zoom.inmeetingfunction.customizedmeetingui.view.MeetingWindowHelper;
import com.example.easyformzoom.zoom.inmeetingfunction.customizedmeetingui.view.RealNameAuthDialog;
import com.example.easyformzoom.zoom.inmeetingfunction.customizedmeetingui.view.adapter.AttenderVideoAdapter;
import com.example.easyformzoom.zoom.inmeetingfunction.customizedmeetingui.view.share.AnnotateToolbar;
import com.example.easyformzoom.zoom.inmeetingfunction.customizedmeetingui.view.share.CustomShareView;
import com.example.easyformzoom.zoom.ui.APIUserStartJoinMeetingActivity;
import com.example.easyformzoom.zoom.ui.BreakoutRoomsAdminActivity;
import com.example.easyformzoom.zoom.ui.InitAuthSDKActivity;
import com.example.easyformzoom.zoom.ui.LoginUserStartJoinMeetingActivity;
import com.example.easyformzoom.zoom.ui.UIUtil;
import com.google.android.material.textfield.TextInputEditText;
import com.google.ar.core.ArCoreApk;
import com.google.ar.sceneform.samples.hellosceneform.HelloSceneformActivity;

import org.json.JSONArray;
import org.json.JSONObject;
import org.michaelbel.bottomsheet.BottomSheet;
import org.michaelbel.bottomsheet.BottomSheetCallback;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import us.zoom.sdk.BOControllerError;
import us.zoom.sdk.BOStatus;
import us.zoom.sdk.IBOAdmin;
import us.zoom.sdk.IBOAssistant;
import us.zoom.sdk.IBOAttendee;
import us.zoom.sdk.IBOAttendeeEvent;
import us.zoom.sdk.IBOData;
import us.zoom.sdk.IBODataEvent;
import us.zoom.sdk.IZoomRetrieveSMSVerificationCodeHandler;
import us.zoom.sdk.IZoomVerifySMSVerificationCodeHandler;
import us.zoom.sdk.InMeetingBOController;
import us.zoom.sdk.InMeetingEventHandler;
import us.zoom.sdk.InMeetingService;
import us.zoom.sdk.InMeetingUserInfo;
import us.zoom.sdk.InMeetingWaitingRoomController;
import us.zoom.sdk.MeetingService;
import us.zoom.sdk.MeetingStatus;
import us.zoom.sdk.MobileRTCRenderInfo;
import us.zoom.sdk.MobileRTCSDKError;
import us.zoom.sdk.MobileRTCSMSVerificationError;
import us.zoom.sdk.MobileRTCVideoUnitRenderInfo;
import us.zoom.sdk.MobileRTCVideoView;
import us.zoom.sdk.MobileRTCVideoViewManager;
import us.zoom.sdk.ReturnToMainSessionHandler;
import us.zoom.sdk.ShareSettingType;
import us.zoom.sdk.SmsListener;
import us.zoom.sdk.SmsService;
import us.zoom.sdk.ZoomSDK;
import us.zoom.sdk.ZoomSDKCountryCode;

import static us.zoom.sdk.MobileRTCSDKError.SDKERR_SUCCESS;

public class MyMeetingActivity extends FragmentActivity implements View.OnClickListener, MeetingVideoCallback.VideoEvent,
        MeetingAudioCallback.AudioEvent, MeetingShareCallback.ShareEvent,
        MeetingUserCallback.UserEvent, MeetingCommonCallback.CommonEvent, SmsListener, BOEventCallback.BOEvent, DrawingEventListner, MeetingShareHelperCallback, InMeetingWaitingRoomController.InMeetingWaitingRoomListener {

    private final static String TAG = "##MyMeetingActivity";

    public final static int REQUEST_PLIST = 1001;
    public final static int REQUEST_CAMERA_CODE = 1010;
    public final static int REQUEST_AUDIO_CODE = 1011;
    public final static int REQUEST_SHARE_SCREEN_PERMISSION = 1001;
    protected final static int REQUEST_SYSTEM_ALERT_WINDOW = 1002;
    protected final static int REQUEST_SYSTEM_ALERT_WINDOW_FOR_MINIWINDOW = 1003;
    private int from = 0;
    private int currentLayoutType = -1;
    private final int LAYOUT_TYPE_PREVIEW = 0;
    private final int LAYOUT_TYPE_WAITHOST = 1;
    private final int LAYOUT_TYPE_IN_WAIT_ROOM = 2;
    private final int LAYOUT_TYPE_ONLY_MYSELF = 3;
    private final int LAYOUT_TYPE_ONETOONE = 4;
    private final int LAYOUT_TYPE_LIST_VIDEO = 5;
    private final int LAYOUT_TYPE_VIEW_SHARE = 6;
    private final int LAYOUT_TYPE_SHARING_VIEW = 7;
    private final int LAYOUT_TYPE_WEBINAR_ATTENDEE = 8;

    private View mWaitJoinView;
    private View mWaitRoomView;
    private TextView mConnectingText;
    private Button mBtnJoinBo, mBtnRequestHelp;

    private LinearLayout videoListLayout;

    private boolean mMeetingFailed = false;

    public static long mCurShareUserId = -1;

    private MobileRTCVideoView mDefaultVideoView;
    private MobileRTCVideoViewManager mDefaultVideoViewMgr;

    private MeetingAudioHelper meetingAudioHelper;

    private MeetingVideoHelper meetingVideoHelper;

    private MeetingShareHelper meetingShareHelper;

    private MeetingRemoteControlHelper remoteControlHelper;

    private MeetingService mMeetingService;

    private InMeetingService mInMeetingService;

    private SmsService smsService;

    private Intent mScreenInfoData;

    private MeetingShareHelper mShareView;
    private AnnotateToolbar mDrawingView;
    private FrameLayout mMeetingVideoView;

    private View mNormalSenceView;

    private CustomShareView customShareView;

    private RecyclerView mVideoListView;

    private AttenderVideoAdapter mAdapter;

    MeetingOptionBar meetingOptionBar;

    private GestureDetector gestureDetector;

    public static final int JOIN_FROM_UNLOGIN = 1;

    public static final int JOIN_FROM_APIUSER = 2;

    public static final int JOIN_FROM_LOGIN = 3;
    private PaintView paintView;
    private SharedPreferences sharedPreferences;
    private JSONArray jsonArrayEvent = new JSONArray();
    private int layouType = 0;
    private PaintViewNormal paintViewNormal;
    String Password;
//    private ArFragment arFragment;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_HIDE_NAVIGATION);

        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                WindowManager.LayoutParams.FLAG_FULLSCREEN);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        this.getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN);

        App.context = this;


        mMeetingService = ZoomSDK.getInstance().getMeetingService();
        mInMeetingService = ZoomSDK.getInstance().getInMeetingService();
        if (mMeetingService == null || mInMeetingService == null) {
            finish();
            return;
        }
        MobileRTCSDKError error = mInMeetingService.getInMeetingShareController().lockShare(false);
        mInMeetingService.getInMeetingWaitingRoomController().addListener(this);

        if (null != getIntent().getExtras()) {
            from = getIntent().getExtras().getInt("from");
            Password = getIntent().getExtras().getString("password");
        }
        registerListener();
        setContentView(R.layout.my_meeting_layout);

//      arFragment = (ArFragment) getSupportFragmentManager().findFragmentById(R.id.ux_fragment_meeting);


        meetingAudioHelper = new MeetingAudioHelper(audioCallBack);
        meetingVideoHelper = new MeetingVideoHelper(this, videoCallBack);
        meetingShareHelper = new MeetingShareHelper(this, shareCallBack);


        gestureDetector = new GestureDetector(new GestureDetectorListener());
        meetingOptionBar = findViewById(R.id.meeting_option_contain);
        meetingOptionBar.setCallBack(callBack);
        mMeetingVideoView = findViewById(R.id.meetingVideoView);
        mShareView = findViewById(R.id.sharingView);
        mDrawingView = findViewById(R.id.drawingView);

        mWaitJoinView = findViewById(R.id.waitJoinView);
        mWaitRoomView = findViewById(R.id.waitingRoom);

        LayoutInflater inflater = getLayoutInflater();

        mNormalSenceView = inflater.inflate(R.layout.layout_meeting_content_normal, null);
        mDefaultVideoView = mNormalSenceView.findViewById(R.id.videoView);

        customShareView = mNormalSenceView.findViewById(R.id.custom_share_view);
        remoteControlHelper = new MeetingRemoteControlHelper(customShareView);

        FrameLayout.LayoutParams layoutParams = new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT);
        layoutParams.gravity = Gravity.CENTER;

        mMeetingVideoView.addView(mNormalSenceView, layoutParams);

        mConnectingText = findViewById(R.id.connectingTxt);
        mBtnJoinBo = findViewById(R.id.btn_join_bo);
        mBtnRequestHelp = findViewById(R.id.btn_request_help);

        mVideoListView = findViewById(R.id.videoList);
        mVideoListView.bringToFront();

        videoListLayout = findViewById(R.id.videoListLayout);

        mVideoListView.setLayoutManager(new LinearLayoutManager(this, LinearLayoutManager.HORIZONTAL, false));
        mAdapter = new AttenderVideoAdapter(this, getWindowManager().getDefaultDisplay().getWidth(), pinVideoListener);
        mVideoListView.setAdapter(mAdapter);

        mBtnJoinBo.setOnClickListener(this);
        mBtnRequestHelp.setOnClickListener(this);
        //remote share Handling
        refreshToolbar();

        initDrawing(paintView);
//        initNormalDrawing();

        CustomNormalDrawing customNormalDrawing = findViewById(R.id.Normalview);
        customNormalDrawing.init();


        LocalBroadcastManager.getInstance(this).registerReceiver(mMessageReceiver,
                new IntentFilter("custom-event-name"));

//      CustomNormalDrawing customNormalDrawing = new CustomNormalDrawing(this);
//      getSizeAdjustedToAspectRatio();
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
    }

    MeetingVideoHelper.VideoCallBack videoCallBack = new MeetingVideoHelper.VideoCallBack() {
        @Override
        public boolean requestVideoPermission() {

            if (Build.VERSION.SDK_INT >= 23 && checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(MyMeetingActivity.this, new String[]{Manifest.permission.CAMERA}, REQUEST_CAMERA_CODE);
                return false;
            }
            return true;
        }

        @Override
        public void showCameraList(PopupWindow popupWindow) {
            popupWindow.showAsDropDown(meetingOptionBar.getSwitchCameraView(), 0, 20);
        }
    };

    MeetingAudioHelper.AudioCallBack audioCallBack = new MeetingAudioHelper.AudioCallBack() {
        @Override
        public boolean requestAudioPermission() {
            if (Build.VERSION.SDK_INT >= 23 && checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(MyMeetingActivity.this, new String[]{Manifest.permission.RECORD_AUDIO}, REQUEST_AUDIO_CODE);
                return false;
            }
            return true;
        }

        @Override
        public void updateAudioButton() {
            try {
                meetingOptionBar.updateAudioButton();
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    };

    MeetingShareHelper.MeetingShareUICallBack shareCallBack = new MeetingShareHelper.MeetingShareUICallBack() {
        @Override
        public void showShareMenu(PopupWindow popupWindow) {
            popupWindow.showAtLocation((View) meetingOptionBar.getParent(), Gravity.BOTTOM | Gravity.CENTER, 0, 150);
        }

        @Override
        public MeetingShareHelper getShareView() {
            return mShareView;
        }
    };


    AttenderVideoAdapter.ItemClickListener pinVideoListener = new AttenderVideoAdapter.ItemClickListener() {
        @Override
        public void onItemClick(View view, int position, long userId) {
            if (currentLayoutType == LAYOUT_TYPE_VIEW_SHARE || currentLayoutType == LAYOUT_TYPE_SHARING_VIEW) {
                return;
            }
            mDefaultVideoViewMgr.removeAllVideoUnits();
            MobileRTCVideoUnitRenderInfo renderInfo = new MobileRTCVideoUnitRenderInfo(0, 0, 100, 100);
            mDefaultVideoViewMgr.addAttendeeVideoUnit(userId, renderInfo);
        }
    };

    @Override
    public void onClick(View v) {
        int id = v.getId();
        if (id == R.id.btn_join_bo) {
            InMeetingBOController boController = mInMeetingService.getInMeetingBOController();
            IBOAttendee boAttendee = boController.getBOAttendeeHelper();
            if (boAttendee != null)
                boAttendee.joinBo();
        } else if (id == R.id.btn_request_help) {
            attendeeRequestHelp();
        }
    }

    @Override
    public void onscreenShareMenuClick(String type) {

        if (type.equalsIgnoreCase("2")) {
//            ScreenARPushUtils.sendScreensizeRemote("NA");
            sendMessagetoBroadcast("screensize", "NA");

            setScreenSizeOfReciever(true);
        } else {
            ArDrawingUtils.isDrawingEnable = true;
            showBottomSheet();
        }
    }


    private void setScreenSizeOfReciever(boolean isSizeChanged) {

        Size size = getSizeAdjustedToAspectRatio();

//      RemoteUtils.calRatioHeight = size.getHeight();

        Log.d("##SIZEOFOPPONONT_HEGHT", String.valueOf(size.getHeight()));
        Log.d("##SIZEOFOPPONONT_WIDTH", String.valueOf(size.getWidth()));

        if (isSizeChanged) {
            FrameLayout.LayoutParams layoutParams = new FrameLayout.LayoutParams(size.getWidth(), size.getHeight());
            layoutParams.gravity = Gravity.CENTER;
            mNormalSenceView.setLayoutParams(layoutParams);

        }

//        if (isSizeChanged) {
//            FrameLayout.LayoutParams layoutParams = new FrameLayout.LayoutParams(size.getWidth(), size.getHeight());
//            layoutParams.gravity = Gravity.CENTER;
//            mNormalSenceView.setLayoutParams(layoutParams);
//        }else {
//
//            size= new Size(RemoteUtils.getRealSizeWidth(),RemoteUtils.getRealSizeHeight());
//
//            Log.d("##SIZEOF_HEGHT_R", String.valueOf(size.getHeight()));
//            Log.d("##SIZEOF_WIDTH_R", String.valueOf(size.getWidth()));
//
//
//            FrameLayout.LayoutParams layoutParams = new FrameLayout.LayoutParams(size.getWidth(), size.getHeight());
//            layoutParams.gravity = Gravity.CENTER;
//            mNormalSenceView.setLayoutParams(layoutParams);
//        }

    }

    @Override
    public void onWatingRoomUserJoin(long l) {
        MobileRTCSDKError error = mInMeetingService.getInMeetingShareController().lockShare(false);
        mInMeetingService.getInMeetingWaitingRoomController().enableWaitingRoomOnEntry(false);
        mInMeetingService.getInMeetingWaitingRoomController().admitToMeeting(l);
    }

    @Override
    public void onWatingRoomUserLeft(long l) {

    }

    class GestureDetectorListener extends GestureDetector.SimpleOnGestureListener {

        public GestureDetectorListener() {
            super();
        }

        @Override
        public boolean onSingleTapUp(MotionEvent e) {

            if (mDrawingView.isAnnotationStarted() || remoteControlHelper.isEnableRemoteControl()) {
                meetingOptionBar.hideOrShowToolbar(true);
                return true;
            }
            int orientation = getResources().getConfiguration().orientation;
            if (orientation == Configuration.ORIENTATION_LANDSCAPE) {
                if ((videoListLayout.getVisibility() == View.VISIBLE && (e.getX() >= videoListLayout.getLeft() || e.getY() <= meetingOptionBar.getTopBarHeight())) || e.getY() >= meetingOptionBar.getBottomBarTop()) {
                    return true;
                }
            } else {
                if ((videoListLayout.getVisibility() == View.VISIBLE && (e.getY() >= videoListLayout.getTop() || e.getY() <= meetingOptionBar.getTopBarHeight())) || e.getY() >= meetingOptionBar.getBottomBarTop()) {
                    return true;
                }
            }
            if (mMeetingService.getMeetingStatus() == MeetingStatus.MEETING_STATUS_INMEETING) {
                meetingOptionBar.hideOrShowToolbar(meetingOptionBar.isShowing());
            }
            return true;
        }
    }

    @Override
    public boolean dispatchTouchEvent(MotionEvent ev) {
        gestureDetector.onTouchEvent(ev);
        return super.dispatchTouchEvent(ev);
    }

    private void refreshToolbar() {
        if (mMeetingService.getMeetingStatus() == MeetingStatus.MEETING_STATUS_INMEETING) {
            mConnectingText.setVisibility(View.GONE);
            meetingOptionBar.updateMeetingNumber(mInMeetingService.getCurrentMeetingNumber() + "");
            meetingOptionBar.updateMeetingPassword(mInMeetingService.getMeetingPassword());
            meetingOptionBar.refreshToolbar();
        } else {
            if (mMeetingService.getMeetingStatus() == MeetingStatus.MEETING_STATUS_CONNECTING) {
                mConnectingText.setVisibility(View.VISIBLE);
            } else {
                mConnectingText.setVisibility(View.GONE);
            }
            meetingOptionBar.hideOrShowToolbar(true);
        }
    }


    private void updateAnnotationBar() {
        if (mCurShareUserId > 0 && !isMySelfWebinarAttendee()) {
            if (meetingShareHelper.isSenderSupportAnnotation(mCurShareUserId)) {
                if (mInMeetingService.isMyself(mCurShareUserId) && !meetingShareHelper.isSharingScreen()) {
                    mDrawingView.setVisibility(View.VISIBLE);
                } else {
                    if (currentLayoutType == LAYOUT_TYPE_VIEW_SHARE) {
                        mDrawingView.setVisibility(View.VISIBLE);
                    } else {
                        mDrawingView.setVisibility(View.GONE);
                    }
                }
            } else {
                mDrawingView.setVisibility(View.GONE);
            }

        } else {
            mDrawingView.setVisibility(View.GONE);
        }
    }

    private void checkShowVideoLayout(boolean forceRefresh) {

        mDefaultVideoViewMgr = mDefaultVideoView.getVideoViewManager();
        if (mDefaultVideoViewMgr != null) {
            int newLayoutType = getNewVideoMeetingLayout();
            if (currentLayoutType != newLayoutType || newLayoutType == LAYOUT_TYPE_WEBINAR_ATTENDEE || forceRefresh) {
                removeOldLayout(currentLayoutType);
                currentLayoutType = newLayoutType;
                addNewLayout(newLayoutType);
            } else {

                if (layouType == 6) {
                    removeOldLayout(currentLayoutType);
                    currentLayoutType = 6;
                    addNewLayout(6);
                }

            }
        }
        updateAnnotationBar();
    }

    private int getNewVideoMeetingLayout() {

        int newLayoutType = -1;
        if (mMeetingService.getMeetingStatus() == MeetingStatus.MEETING_STATUS_WAITINGFORHOST) {
            newLayoutType = LAYOUT_TYPE_WAITHOST;
            return newLayoutType;
        }

        if (mMeetingService.getMeetingStatus() == MeetingStatus.MEETING_STATUS_IN_WAITING_ROOM) {
            newLayoutType = LAYOUT_TYPE_IN_WAIT_ROOM;
            return newLayoutType;
        }

        if (mInMeetingService.isWebinarMeeting()) {
            if (isMySelfWebinarAttendee()) {
                newLayoutType = LAYOUT_TYPE_WEBINAR_ATTENDEE;
                return newLayoutType;
            }
        }

        if (meetingShareHelper.isOtherSharing()) {
            newLayoutType = LAYOUT_TYPE_VIEW_SHARE;
        } else if (meetingShareHelper.isSharingOut() && !meetingShareHelper.isSharingScreen()) {
            newLayoutType = LAYOUT_TYPE_SHARING_VIEW;
        } else {
            List<Long> userlist = mInMeetingService.getInMeetingUserList();
            int userCount = 0;
            if (userlist != null) {
                userCount = userlist.size();
            }

            if (userCount > 1) {
                int preCount = userCount;
                for (int i = 0; i < preCount; i++) {
                    InMeetingUserInfo userInfo = mInMeetingService.getUserInfoById(userlist.get(i));
                    if (mInMeetingService.isWebinarMeeting()) {
                        if (userInfo != null && userInfo.getInMeetingUserRole() == InMeetingUserInfo.InMeetingUserRole.USERROLE_ATTENDEE) {
                            userCount--;
                        }
                    }
                }
            }

            if (userCount == 0) {
                newLayoutType = LAYOUT_TYPE_PREVIEW;
            } else if (userCount == 1) {
                newLayoutType = LAYOUT_TYPE_ONLY_MYSELF;
            } else {
                newLayoutType = LAYOUT_TYPE_LIST_VIDEO;
            }
        }
        return newLayoutType;
    }

    private void removeOldLayout(int type) {
        if (type == LAYOUT_TYPE_WAITHOST) {
            mWaitJoinView.setVisibility(View.GONE);
            mMeetingVideoView.setVisibility(View.VISIBLE);
        } else if (type == LAYOUT_TYPE_IN_WAIT_ROOM) {
            mWaitRoomView.setVisibility(View.GONE);
            mMeetingVideoView.setVisibility(View.VISIBLE);
        } else if (type == LAYOUT_TYPE_PREVIEW || type == LAYOUT_TYPE_ONLY_MYSELF || type == LAYOUT_TYPE_ONETOONE) {
            mDefaultVideoViewMgr.removeAllVideoUnits();
        } else if (type == LAYOUT_TYPE_LIST_VIDEO || type == LAYOUT_TYPE_VIEW_SHARE) {
            mDefaultVideoViewMgr.removeAllVideoUnits();
            mDefaultVideoView.setGestureDetectorEnabled(false);
        } else if (type == LAYOUT_TYPE_SHARING_VIEW) {
            mShareView.setVisibility(View.GONE);
            mMeetingVideoView.setVisibility(View.VISIBLE);
        }

        if (type != LAYOUT_TYPE_SHARING_VIEW) {
            if (null != customShareView) {
                customShareView.setVisibility(View.INVISIBLE);
            }
        }
    }

    private void addNewLayout(int type) {
        if (type == LAYOUT_TYPE_WAITHOST) {
            mWaitJoinView.setVisibility(View.VISIBLE);
            refreshToolbar();
            mMeetingVideoView.setVisibility(View.GONE);
        } else if (type == LAYOUT_TYPE_IN_WAIT_ROOM) {
            mWaitRoomView.setVisibility(View.VISIBLE);
            videoListLayout.setVisibility(View.GONE);
            refreshToolbar();
            mMeetingVideoView.setVisibility(View.GONE);
            mDrawingView.setVisibility(View.GONE);
        } else if (type == LAYOUT_TYPE_PREVIEW) {
            showPreviewLayout();
        } else if (type == LAYOUT_TYPE_ONLY_MYSELF || type == LAYOUT_TYPE_WEBINAR_ATTENDEE) {
            showOnlyMeLayout();
        } else if (type == LAYOUT_TYPE_ONETOONE) {
            showOne2OneLayout();
        } else if (type == LAYOUT_TYPE_LIST_VIDEO) {
            showVideoListLayout();
        } else if (type == LAYOUT_TYPE_VIEW_SHARE) {
            showViewShareLayout();
        } else if (type == LAYOUT_TYPE_SHARING_VIEW) {
            showSharingViewOutLayout();
        }
    }

    private void showPreviewLayout() {
        MobileRTCVideoUnitRenderInfo renderInfo1 = new MobileRTCVideoUnitRenderInfo(0, 0, 100, 100);
        mDefaultVideoView.setVisibility(View.VISIBLE);
        mDefaultVideoViewMgr.addPreviewVideoUnit(renderInfo1);
        videoListLayout.setVisibility(View.GONE);
    }

    private void showOnlyMeLayout() {
        mDefaultVideoView.setVisibility(View.VISIBLE);
        videoListLayout.setVisibility(View.GONE);
        MobileRTCVideoUnitRenderInfo renderInfo = new MobileRTCVideoUnitRenderInfo(0, 0, 100, 100);
        InMeetingUserInfo myUserInfo = mInMeetingService.getMyUserInfo();
        if (myUserInfo != null) {
            mDefaultVideoViewMgr.removeAllVideoUnits();
            if (isMySelfWebinarAttendee()) {
                if (mCurShareUserId > 0) {
                    mDefaultVideoViewMgr.addShareVideoUnit(mCurShareUserId, renderInfo);
                } else {
                    mDefaultVideoViewMgr.addActiveVideoUnit(renderInfo);
                }
            } else {
                mDefaultVideoViewMgr.addAttendeeVideoUnit(myUserInfo.getUserId(), renderInfo);
            }
        }
    }


    private void showOne2OneLayout() {
        mDefaultVideoView.setVisibility(View.VISIBLE);
        videoListLayout.setVisibility(View.VISIBLE);

        MobileRTCVideoUnitRenderInfo renderInfo = new MobileRTCVideoUnitRenderInfo(0, 0, 100, 100);
        //options.aspect_mode = MobileRTCVideoUnitAspectMode.VIDEO_ASPECT_PAN_AND_SCAN;
        mDefaultVideoViewMgr.addActiveVideoUnit(renderInfo);

        mAdapter.setUserList(mInMeetingService.getInMeetingUserList());
        mAdapter.notifyDataSetChanged();

    }

    private void showVideoListLayout() {
        MobileRTCVideoUnitRenderInfo renderInfo = new MobileRTCVideoUnitRenderInfo(0, 0, 100, 100);
        //options.aspect_mode = MobileRTCVideoUnitAspectMode.VIDEO_ASPECT_PAN_AND_SCAN;
        mDefaultVideoViewMgr.addActiveVideoUnit(renderInfo);
        videoListLayout.setVisibility(View.VISIBLE);
        updateAttendeeVideos(mInMeetingService.getInMeetingUserList(), 0);
    }

    private void showSharingViewOutLayout() {
        mAdapter.setUserList(null);
        mAdapter.notifyDataSetChanged();
        videoListLayout.setVisibility(View.GONE);
        mMeetingVideoView.setVisibility(View.GONE);
        mShareView.setVisibility(View.VISIBLE);
    }


    private void updateAttendeeVideos(List<Long> userlist, int action) {
        if (action == 0) {
            mAdapter.setUserList(userlist);
            mAdapter.notifyDataSetChanged();
        } else if (action == 1) {
            mAdapter.addUserList(userlist);
        } else {

            Long userId = mAdapter.getSelectedUserId();
            if (userlist.contains(userId)) {
                List<Long> inmeetingUserList = mInMeetingService.getInMeetingUserList();
                if (inmeetingUserList.size() > 0) {
                    mDefaultVideoViewMgr.removeAllVideoUnits();
                    MobileRTCVideoUnitRenderInfo renderInfo = new MobileRTCVideoUnitRenderInfo(0, 0, 100, 100);
                    mDefaultVideoViewMgr.addAttendeeVideoUnit(inmeetingUserList.get(0), renderInfo);
                }
            }
            mAdapter.removeUserList(userlist);
        }
    }

    private void showViewShareLayout() {
        if (!isMySelfWebinarAttendee()) {
            mDefaultVideoView.setVisibility(View.VISIBLE);
            mDefaultVideoView.setOnClickListener(null);
            mDefaultVideoView.setGestureDetectorEnabled(true);
            long shareUserId = mInMeetingService.activeShareUserID();
            MobileRTCRenderInfo renderInfo1 = new MobileRTCRenderInfo(0, 0, 100, 100);
            mDefaultVideoViewMgr.addShareVideoUnit(shareUserId, renderInfo1);
            updateAttendeeVideos(mInMeetingService.getInMeetingUserList(), 0);
            customShareView.setMobileRTCVideoView(mDefaultVideoView);
            remoteControlHelper.refreshRemoteControlStatus();

        } else {
            mDefaultVideoView.setVisibility(View.VISIBLE);
            mDefaultVideoView.setOnClickListener(null);
            mDefaultVideoView.setGestureDetectorEnabled(true);
            long shareUserId = mInMeetingService.activeShareUserID();
            MobileRTCRenderInfo renderInfo1 = new MobileRTCRenderInfo(0, 0, 100, 100);
            mDefaultVideoViewMgr.addShareVideoUnit(shareUserId, renderInfo1);
        }

        mAdapter.setUserList(null);
        mAdapter.notifyDataSetChanged();
        videoListLayout.setVisibility(View.INVISIBLE);
    }

    private boolean isMySelfWebinarAttendee() {
        InMeetingUserInfo myUserInfo = mInMeetingService.getMyUserInfo();
        if (myUserInfo != null && mInMeetingService.isWebinarMeeting()) {
            return myUserInfo.getInMeetingUserRole() == InMeetingUserInfo.InMeetingUserRole.USERROLE_ATTENDEE;
        }
        return false;
    }

    private boolean isMySelfWebinarHostCohost() {
        InMeetingUserInfo myUserInfo = mInMeetingService.getMyUserInfo();
        if (myUserInfo != null && mInMeetingService.isWebinarMeeting()) {
            return myUserInfo.getInMeetingUserRole() == InMeetingUserInfo.InMeetingUserRole.USERROLE_HOST
                    || myUserInfo.getInMeetingUserRole() == InMeetingUserInfo.InMeetingUserRole.USERROLE_COHOST;
        }
        return false;
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        meetingVideoHelper.checkVideoRotation(this);
        updateVideoListMargin(!meetingOptionBar.isShowing());
    }

    @Override
    protected void onResume() {
        super.onResume();

        getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
                        View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);

//        if (!HelloSceneformActivity.isArSupportedDevice) {
//            paintViewNormal.setVisibility(View.VISIBLE);
//        }

        Log.d("##MY_MEETING", "ONRESUME");
        MeetingWindowHelper.getInstance().hiddenMeetingWindow(false);
        checkShowVideoLayout(false);
        meetingVideoHelper.checkVideoRotation(this);
        mDefaultVideoView.onResume();
//        ZoomSDK.getInstance().getInMeetingService().getInMeetingVideoController().muteMyVideo(false);

    }

    @Override
    protected void onPause() {
        super.onPause();
        mDefaultVideoView.onPause();
    }

    @Override
    protected void onStop() {
        super.onStop();
        clearSubscribe();
    }

    private void clearSubscribe() {
        if (null != mDefaultVideoViewMgr) {
            mDefaultVideoViewMgr.removeActiveVideoUnit();
        }
        if (null != mInMeetingService) {
            List<Long> userList = mInMeetingService.getInMeetingUserList();
            if (null != userList) {
                mAdapter.removeUserList(userList);
            }
        }
        currentLayoutType = -1;
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (null != remoteControlHelper) {
            remoteControlHelper.onDestroy();
        }
        unRegisterListener();
    }

    MeetingOptionBar.MeetingOptionBarCallBack callBack = new MeetingOptionBar.MeetingOptionBarCallBack() {
        @Override
        public void onClickBack() {
//            onClickMiniWindow();
            showUserList();
        }

        @Override
        public void onClickSwitchCamera() {
            meetingVideoHelper.switchCamera();
        }

        @Override
        public void onClickLeave() {
            showLeaveMeetingDialog();
        }

        @Override
        public void onClickAudio() {
            meetingAudioHelper.switchAudio();
        }

        @Override
        public void onClickVideo() {
            meetingVideoHelper.switchVideo();
        }

        @Override
        public void onClickShare() {
            meetingShareHelper.onClickShare();
        }

        @Override
        public void onClickChats() {
            mInMeetingService.showZoomParticipantsUI(MyMeetingActivity.this, REQUEST_PLIST);
        }

        @Override
        public void onClickDisconnectAudio() {
            meetingAudioHelper.disconnectAudio();
        }

        @Override
        public void onClickSwitchLoudSpeaker() {
            meetingAudioHelper.switchLoudSpeaker();
        }

        @Override
        public void onClickAdminBo() {
            Intent intent = new Intent(MyMeetingActivity.this, BreakoutRoomsAdminActivity.class);
            startActivity(intent);
        }

        @Override
        public void onClickLowerAllHands() {
            if (mInMeetingService.lowerAllHands(false) == SDKERR_SUCCESS)
                Toast.makeText(MyMeetingActivity.this, "Lower all hands successfully", Toast.LENGTH_SHORT).show();
        }

        @Override
        public void onClickReclaimHost() {
            if (mInMeetingService.reclaimHost() == SDKERR_SUCCESS)
                Toast.makeText(MyMeetingActivity.this, "Reclaim host successfully", Toast.LENGTH_SHORT).show();
        }

        @Override
        public void showMoreMenu(PopupWindow popupWindow) {
            popupWindow.showAtLocation((View) meetingOptionBar.getParent(), Gravity.BOTTOM | Gravity.RIGHT, 0, 150);
        }

        @Override
        public void onHidden(boolean hidden) {
            updateVideoListMargin(hidden);
        }
    };


    private void onClickMiniWindow() {
        if (mMeetingService.getMeetingStatus() == MeetingStatus.MEETING_STATUS_INMEETING) {
            //stop share
            if (currentLayoutType == LAYOUT_TYPE_VIEW_SHARE) {
                mDefaultVideoViewMgr.removeShareVideoUnit();
                currentLayoutType = -1;
            }

            List<Long> userList = ZoomSDK.getInstance().getInMeetingService().getInMeetingUserList();
            if (null == userList || userList.size() < 2) {
                showLeaveMeetingDialog();
                return;
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N && !Settings.canDrawOverlays(this)) {
                Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:" + this.getPackageName()));
                startActivityForResult(intent, REQUEST_SYSTEM_ALERT_WINDOW_FOR_MINIWINDOW);
            } else {
                showMainActivity();
            }
        } else {

            leave(true);

//            showLeaveMeetingDialog();
        }
    }

    @Override
    public void onBackPressed() {
        showLeaveMeetingDialog();
    }

    private void updateVideoListMargin(boolean hidden) {
        RelativeLayout.LayoutParams params = (RelativeLayout.LayoutParams) videoListLayout.getLayoutParams();
        params.bottomMargin = hidden ? 0 : meetingOptionBar.getBottomBarHeight();
        if (Configuration.ORIENTATION_LANDSCAPE == getResources().getConfiguration().orientation) {
            params.bottomMargin = 0;
        }
        videoListLayout.setLayoutParams(params);
        videoListLayout.bringToFront();
    }


    private void showMainActivity() {
        Class clz = LoginUserStartJoinMeetingActivity.class;
        if (from == JOIN_FROM_UNLOGIN) {
            clz = InitAuthSDKActivity.class;
        } else if (from == JOIN_FROM_APIUSER) {
            clz = APIUserStartJoinMeetingActivity.class;
        }
        Intent intent = new Intent(this, clz);
        intent.addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
        startActivity(intent);
        clearSubscribe();
    }

    Dialog builder;

    private void showPsswordDialog(final boolean needPassword, final boolean needDisplayName, final InMeetingEventHandler handler) {
        if (null != builder) {
            builder.dismiss();
        }
        builder = new Dialog(this, R.style.AppTheme);
        builder.setTitle("Need password or displayName");
        builder.setContentView(R.layout.layout_input_password_name);

        final EditText pwd = builder.findViewById(R.id.edit_pwd);
        final EditText name = builder.findViewById(R.id.edit_name);
        builder.findViewById(R.id.layout_pwd).setVisibility(needPassword ? View.VISIBLE : View.GONE);
        builder.findViewById(R.id.layout_name).setVisibility(needDisplayName ? View.VISIBLE : View.GONE);
        pwd.setText(Password);
        String password = pwd.getText().toString();
        String userName = name.getText().toString();
        if (needPassword && TextUtils.isEmpty(password) || (needDisplayName && TextUtils.isEmpty(userName))) {
            onMeetingNeedPasswordOrDisplayName(needPassword, needDisplayName, handler);
            return;
        }
        builder.dismiss();
        handler.setMeetingNamePassword(password, userName,false);

//        builder.findViewById(R.id.btn_leave).setOnClickListener(new View.OnClickListener() {
//            @Override
//            public void onClick(View view) {
//                builder.dismiss();
//                mInMeetingService.leaveCurrentMeeting(true);
//            }
//        });
//        builder.findViewById(R.id.btn_ok).setOnClickListener(new View.OnClickListener() {
//            @Override
//            public void onClick(View view) {
//                String password = pwd.getText().toString();
//                String userName = name.getText().toString();
//                if (needPassword && TextUtils.isEmpty(password) || (needDisplayName && TextUtils.isEmpty(userName))) {
//                    builder.dismiss();
//                    onMeetingNeedPasswordOrDisplayName(needPassword, needDisplayName, handler);
//                    return;
//                }
//                builder.dismiss();
//                handler.setMeetingNamePassword(password, userName,false);
//            }
//        });
//        builder.show();
//        pwd.requestFocus();
    }


    private void updateVideoView(List<Long> userList, int action) {
        if (currentLayoutType == LAYOUT_TYPE_LIST_VIDEO || currentLayoutType == LAYOUT_TYPE_VIEW_SHARE) {
            if (mVideoListView.getVisibility() == View.VISIBLE) {
                updateAttendeeVideos(userList, action);
            }
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        switch (requestCode) {
            case REQUEST_SHARE_SCREEN_PERMISSION:
                if (resultCode != RESULT_OK) {
                    Log.d(TAG, "onActivityResult REQUEST_SHARE_SCREEN_PERMISSION no ok ");
//                    ScreenARPushUtils.sendScreenShareDecline();
                    sendMessagetoBroadcast("sharedecline", "");

                    break;
                }
                startShareScreen(data);
                break;
            case 501:
                if (resultCode != RESULT_OK) {
                    Log.d(TAG, "onActivityResult REQUEST_SHARE_SCREEN_PERMISSION no ok ");
                    break;
                }
                startShareScreen(data);
                break;
            case REQUEST_SYSTEM_ALERT_WINDOW:
                meetingShareHelper.startShareScreenSession(mScreenInfoData);
                break;
            case REQUEST_SYSTEM_ALERT_WINDOW_FOR_MINIWINDOW: {
                if (resultCode == RESULT_OK) {
                    showMainActivity();
                } else {
                    showLeaveMeetingDialog();
                }
                break;
            }
        }
    }


    boolean finished = false;

    @Override
    public void finish() {
        if (!finished) {
            showMainActivity();
        }
        finished = true;
        super.finish();
    }

    private void showLeaveMeetingDialog() {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        if (mInMeetingService.isMeetingConnected()) {
            if (mInMeetingService.isMeetingHost()) {

                builder.setTitle("End or leave meeting")
                        .setPositiveButton("End", (dialog, which) -> leave(true)).setNeutralButton("Leave", new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        leave(false);
                    }
                });
            } else {
                builder.setTitle("Leave meeting")
                        .setPositiveButton("Leave", (dialog, which) -> leave(false));
            }
        } else {
            builder.setTitle("Leave meeting")
                    .setPositiveButton("Leave", (dialog, which) -> leave(false));
        }
        if (mInMeetingService.getInMeetingBOController().isInBOMeeting()) {
            builder.setNegativeButton("Leave BO", (dialog, which) -> leaveBo());
        } else {
            builder.setNegativeButton("Cancel", null);
        }
        builder.create().show();
    }

    private void leave(boolean end) {
        if (meetingShareHelper.isSharingOut()) {
            meetingShareHelper.stopShare();
        }
        finish();
        mInMeetingService.leaveCurrentMeeting(end);
    }

    private void leaveBo() {
        InMeetingBOController boController = mInMeetingService.getInMeetingBOController();
        IBOAssistant iboAssistant = boController.getBOAssistantHelper();
        if (iboAssistant != null) {
            iboAssistant.leaveBO();
        } else {
            IBOAttendee boAttendee = boController.getBOAttendeeHelper();
            if (boAttendee != null) {
                boAttendee.leaveBo();
            } else {
                leave(false);
            }
        }
    }

    private void showJoinFailDialog(int error) {
        AlertDialog dialog = new AlertDialog.Builder(this)
                .setCancelable(false)
                .setTitle("Meeting Fail")
                .setMessage("Error:" + error)
                .setPositiveButton("Ok", new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        finish();
                    }
                }).create();
        dialog.show();
    }

    private void showWebinarNeedRegisterDialog(final InMeetingEventHandler inMeetingEventHandler) {
        AlertDialog dialog = new AlertDialog.Builder(this)
                .setCancelable(false)
                .setTitle("Need register to join this webinar meeting ")
                .setNegativeButton("Cancel", new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        mInMeetingService.leaveCurrentMeeting(true);
                    }
                })
                .setPositiveButton("Ok", new DialogInterface.OnClickListener() {

                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        if (null != inMeetingEventHandler) {
                            long time = System.currentTimeMillis();
                            inMeetingEventHandler.setRegisterWebinarInfo("test", time + "@example.com", false);
                        }
                    }
                }).create();
        dialog.show();
    }

    private void showEndOtherMeetingDialog(final InMeetingEventHandler handler) {

        handler.endOtherMeeting();

        AlertDialog dialog = new AlertDialog.Builder(this)
                .setCancelable(false)
                .setTitle("Meeting Alert")
                .setMessage("You have a meeting that is currently in-progress. Please end it to start a new meeting.")
                .setPositiveButton("End Other Meeting", new DialogInterface.OnClickListener() {

                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        handler.endOtherMeeting();
                    }
                }).setNeutralButton("Leave", (dialog1, which) -> {
                    finish();
                    mInMeetingService.leaveCurrentMeeting(true);
                }).create();
//        dialog.show();
    }

    @SuppressLint("NewApi")
    protected void startShareScreen(Intent data) {
        if (data == null) {
            return;
        }
        if (Build.VERSION.SDK_INT >= 24 && !Settings.canDrawOverlays(this)) {
            Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + getPackageName()));
            mScreenInfoData = data;
            startActivityForResult(intent, REQUEST_SYSTEM_ALERT_WINDOW);
        } else {
            meetingShareHelper.startShareScreenSession(data);
        }
        statrtARActivity();
    }

    public int checkSelfPermission(String permission) {
        if (permission == null || permission.length() == 0) {
            return PackageManager.PERMISSION_DENIED;
        }
        try {
            return checkPermission(permission, android.os.Process.myPid(), android.os.Process.myUid());
        } catch (Throwable e) {
            return PackageManager.PERMISSION_DENIED;
        }
    }

    private void statrtARActivity() {
//        if (ZoomSDK.getInstance().getInMeetingService().getInMeetingVideoController().canSwitchCamera()) {
//            ZoomSDK.getInstance().getInMeetingService().getInMeetingVideoController().switchToNextCamera();
//        }

        ZoomSDK.getInstance().getInMeetingService().getInMeetingVideoController().muteMyVideo(true);

        Handler mainHandler = new Handler();
        mainHandler.postDelayed(() -> {
            try {
                if (null != mDefaultVideoViewMgr) {
                    mDefaultVideoViewMgr.removeActiveVideoUnit();
                }
                sharedPreferences = getSharedPreferences("REMOTERATIO", Context.MODE_PRIVATE);
                String dHeight = (sharedPreferences.getString("Height", "320"));
                String dWidth = (sharedPreferences.getString("Width", "240"));

//              String dHeightT = String.valueOf(RemoteUtils.getRemoteHeight());
//              String dWidthT  = String.valueOf(RemoteUtils.getRemoteWidth());

                Log.d("##HELLO_SIZE_HEIGHT", dHeight);
                Log.d("##HELLO_SIZE_WIDTH", dWidth);

//              changeLayoutSize(dWidth, dHeight);


                ArCoreApk.Availability availability = ArCoreApk.getInstance().checkAvailability(this);

                Log.d("##AR_AVAILABILITY", String.valueOf(availability));


                Log.d("##SS_HEIGHT", dHeight);
                Log.d("##SS_WIDTH", dWidth);

                String availabilityString = String.valueOf(availability);
                if (availabilityString.equalsIgnoreCase("SUPPORTED_INSTALLED")) {

                    Intent intent = new Intent(MyMeetingActivity.this, HelloSceneformActivity.class);
                    intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
                    intent.putExtra("width", dWidth);
                    intent.putExtra("height", dHeight);
                    startActivity(intent);


                } else {
                    Intent intent = new Intent(MyMeetingActivity.this, CameraPreviewActivity.class);
                    intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
                    intent.putExtra("width", dWidth);
                    intent.putExtra("height", dHeight);
                    startActivity(intent);
                }

            } catch (Exception e) {
                e.printStackTrace();
            }
        }, 2000);

    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);

        if (permissions == null || grantResults == null) {
            return;
        }

        for (int i = 0; i < permissions.length; i++) {
            if (Manifest.permission.RECORD_AUDIO.equals(permissions[i])) {
                if (grantResults[i] == PackageManager.PERMISSION_GRANTED) {
                    meetingAudioHelper.switchAudio();
                }
            } else if (Manifest.permission.CAMERA.equals(permissions[i])) {
                if (grantResults[i] == PackageManager.PERMISSION_GRANTED) {
                    meetingVideoHelper.switchVideo();
                }
            }
        }
    }


    @Override
    public void onUserAudioStatusChanged(long userId) {
        try {
            meetingAudioHelper.onUserAudioStatusChanged(userId);
        } catch (Exception e) {
            e.printStackTrace();
        }

    }

    @Override
    public void onUserAudioTypeChanged(long userId) {
        meetingAudioHelper.onUserAudioTypeChanged(userId);
    }

    @Override
    public void onMyAudioSourceTypeChanged(int type) {
        meetingAudioHelper.onMyAudioSourceTypeChanged(type);
    }

    @Override
    public void onUserVideoStatusChanged(long userId) {
        meetingOptionBar.updateVideoButton();
        meetingOptionBar.updateSwitchCameraButton();
    }

    @Override
    public void onShareActiveUser(long userId) {

        try {

            Log.d("##SHARE_SCREEN", String.valueOf(userId));
            meetingShareHelper.onShareActiveUser(mCurShareUserId, userId);
            mCurShareUserId = userId;
            meetingOptionBar.updateShareButton();
            checkShowVideoLayout(true);
            if (userId == -1) {
                ArDrawingUtils.isDrawingEnable = false;
                ZoomSDK.getInstance().getInMeetingService().getInMeetingVideoController().muteMyVideo(false);
            }
            if (userId != -1) {

                final Handler handler = new Handler();
                handler.postDelayed(new Runnable() {
                    @Override
                    public void run() {
                        setScreenSizeOfReciever(false);
                        InMeetingUserInfo userInfo = mInMeetingService.getUserInfoById(userId);

                        String userName = userInfo.getUserName();
                        ArrayList<ListUsernameFId> listUsernameFIds = NetworkCallZoomChat.getListOfUserAndFCMID();

                        for (int i = 0; i < listUsernameFIds.size(); i++) {
                            String usernameNew = listUsernameFIds.get(i).getUsername();
                            if (userName.equalsIgnoreCase(usernameNew)) {
//                                SendPushNotification.OpponentFCMID = String.valueOf(listUsernameFIds.get(i).getUserid());
                                sendMessagetoBroadcast("OPPONENT_FCM", listUsernameFIds.get(i).getUserid());
                            }
                        }
                    }
                }, 2000);

            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void onSilentModeChanged(boolean inSilentMode) {
        if (inSilentMode)
            meetingShareHelper.stopShare();
    }

    @Override
    public void onShareUserReceivingStatus(long userId) {

    }

    @Override
    public void onShareSettingTypeChanged(ShareSettingType shareSettingType) {

    }

    @Override
    public void onMeetingUserJoin(List<Long> userList) {
        try {
            checkShowVideoLayout(true);
            updateVideoView(userList, 1);
            ZoomSDK.getInstance().getInMeetingService().getInMeetingVideoController().muteMyVideo(false);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void onMeetingUserLeave(List<Long> userList) {
        checkShowVideoLayout(true);
        updateVideoView(userList, 2);
    }

    @Override
    public void onWebinarNeedRegister(String registerUrl) {
    }

    @Override
    public void onMeetingFail(int errorCode, int internalErrorCode) {
        mMeetingFailed = true;
        mMeetingVideoView.setVisibility(View.GONE);
        mConnectingText.setVisibility(View.GONE);
        showJoinFailDialog(errorCode);
    }

    @Override
    public void onMeetingLeaveComplete(long ret) {
        meetingShareHelper.stopShare();
        if (!mMeetingFailed)
            finish();
    }

    @Override
    public void onMeetingStatusChanged(MeetingStatus meetingStatus, int errorCode, int internalErrorCode) {

        try {
            checkShowVideoLayout(true);
            refreshToolbar();

            if (meetingStatus == MeetingStatus.MEETING_STATUS_INMEETING) {
                ZoomSDK.getInstance().getInMeetingService().getInMeetingVideoController().muteMyVideo(false);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

    }

    @Override
    public void onMeetingNeedPasswordOrDisplayName(boolean needPassword, boolean needDisplayName, InMeetingEventHandler handler) {
        showPsswordDialog(needPassword, needDisplayName, handler);
    }

    @Override
    public void onMeetingNeedColseOtherMeeting(InMeetingEventHandler inMeetingEventHandler) {
        showEndOtherMeetingDialog(inMeetingEventHandler);
    }

    @Override
    public void onJoinWebinarNeedUserNameAndEmail(InMeetingEventHandler inMeetingEventHandler) {
        long time = System.currentTimeMillis();
        showWebinarNeedRegisterDialog(inMeetingEventHandler);
//        inMeetingEventHandler.setRegisterWebinarInfo("test", time+"@example.com", false);
    }

    @Override
    public void onFreeMeetingReminder(boolean isOrignalHost, boolean canUpgrade, boolean isFirstGift) {
        Log.d(TAG, "onFreeMeetingReminder:" + isOrignalHost + " " + canUpgrade + " " + isFirstGift);
    }

    @Override
    public void onNeedRealNameAuthMeetingNotification(List<ZoomSDKCountryCode> supportCountryList, String privacyUrl, IZoomRetrieveSMSVerificationCodeHandler handler) {
        Log.d(TAG, "onNeedRealNameAuthMeetingNotification:" + privacyUrl);
        Log.d(TAG, "onNeedRealNameAuthMeetingNotification getRealNameAuthPrivacyURL:" + ZoomSDK.getInstance().getSmsService().getRealNameAuthPrivacyURL());
        RealNameAuthDialog.show(this, handler);
    }

    @Override
    public void onRetrieveSMSVerificationCodeResultNotification(MobileRTCSMSVerificationError result, IZoomVerifySMSVerificationCodeHandler handler) {
        Log.d(TAG, "onRetrieveSMSVerificationCodeResultNotification:" + result);
    }

    @Override
    public void onVerifySMSVerificationCodeResultNotification(MobileRTCSMSVerificationError result) {
        Log.d(TAG, "onVerifySMSVerificationCodeResultNotification:" + result);
    }

    @Override
    public void onHelpRequestReceived(final String strUserID) {
        InMeetingBOController boController = mInMeetingService.getInMeetingBOController();
        final IBOAdmin iboAdmin = boController.getBOAdminHelper();
        if (iboAdmin != null) {
            String[] boAndUser = UIUtil.getBoNameUserNameByUserId(boController, strUserID);
            if (boAndUser == null || boAndUser.length != 2)
                return;
            new AlertDialog.Builder(MyMeetingActivity.this)
                    .setMessage(boAndUser[1] + " in " + boAndUser[0] + " asked for help.")
                    .setCancelable(false)
                    .setNegativeButton("Later", new DialogInterface.OnClickListener() {
                        public void onClick(DialogInterface dialog, int which) {
                            iboAdmin.ignoreUserHelpRequest(strUserID);
                        }
                    })
                    .setPositiveButton("Join Breakout Room", new DialogInterface.OnClickListener() {
                        public void onClick(DialogInterface dialog, int which) {
                            iboAdmin.joinBOByUserRequest(strUserID);
                        }
                    }).create().show();
        }
    }

    @Override
    public void onStartBOError(BOControllerError boControllerError) {
        Log.d(TAG, "onStartBOError:" + boControllerError);

    }

    @Override
    public void onBOEndTimerUpdated(int i, boolean b) {
        Log.d(TAG, "onBOEndTimerUpdated: remaining: " + i + ",isTimesUpNotice: " + b);

    }

    private void unRegisterListener() {
        try {
            MeetingAudioCallback.getInstance().removeListener(this);
            MeetingVideoCallback.getInstance().removeListener(this);
            MeetingShareCallback.getInstance().removeListener(this);
            MeetingUserCallback.getInstance().removeListener(this);
            MeetingCommonCallback.getInstance().removeListener(this);
            BOEventCallback.getInstance().removeEvent(this);
            if (null != smsService) {
                smsService.removeListener(this);
            }
            ZoomSDK.getInstance().getInMeetingService().getInMeetingBOController().removeListener(mBOControllerListener);
        } catch (Exception e) {
        }
    }


    private void registerListener() {
        smsService = ZoomSDK.getInstance().getSmsService();
        if (null != smsService) {
            smsService.addListener(this);
        }
        ZoomSDK.getInstance().getInMeetingService().getInMeetingBOController().addListener(mBOControllerListener);
        MeetingAudioCallback.getInstance().addListener(this);
        MeetingVideoCallback.getInstance().addListener(this);
        MeetingShareCallback.getInstance().addListener(this);
        MeetingUserCallback.getInstance().addListener(this);
        MeetingCommonCallback.getInstance().addListener(this);

    }

    private final SimpleInMeetingBOControllerListener mBOControllerListener = new SimpleInMeetingBOControllerListener() {

        AlertDialog dialog;

        @Override
        public void onHasAttendeeRightsNotification(final IBOAttendee iboAttendee) {
            super.onHasAttendeeRightsNotification(iboAttendee);
            Log.d(TAG, "onHasAttendeeRightsNotification");
            iboAttendee.setEvent(iboAttendeeEvent);
            InMeetingBOController boController = mInMeetingService.getInMeetingBOController();
            if (boController.isInBOMeeting()) {
                mBtnJoinBo.setVisibility(View.GONE);
                mBtnRequestHelp.setVisibility(iboAttendee.isHostInThisBO() ? View.GONE : View.VISIBLE);
                meetingOptionBar.updateMeetingNumber(iboAttendee.getBoName());
            } else {
                mBtnRequestHelp.setVisibility(View.GONE);
                AlertDialog.Builder builder = new AlertDialog.Builder(MyMeetingActivity.this)
                        .setMessage("The host is inviting you to join Breakout Room: " + iboAttendee.getBoName())
                        .setNegativeButton("Later", new DialogInterface.OnClickListener() {
                            public void onClick(DialogInterface dialog, int which) {
                                mBtnJoinBo.setVisibility(View.VISIBLE);
                            }
                        })
                        .setPositiveButton("Join", new DialogInterface.OnClickListener() {
                            public void onClick(DialogInterface dialog, int which) {
                                iboAttendee.joinBo();
                            }
                        })
                        .setCancelable(false);
                dialog = builder.create();
                dialog.show();
            }
        }

        @Override
        public void onHasDataHelperRightsNotification(IBOData iboData) {
            Log.d(TAG, "onHasDataHelperRightsNotification");
            iboData.setEvent(iboDataEvent);
        }

        @Override
        public void onLostAttendeeRightsNotification() {
            super.onLostAttendeeRightsNotification();
            Log.d(TAG, "onLostAttendeeRightsNotification");
            if (null != dialog && dialog.isShowing()) {
                dialog.dismiss();
            }
            mBtnJoinBo.setVisibility(View.GONE);
        }

        @Override
        public void onHasAdminRightsNotification(IBOAdmin iboAdmin) {
            super.onHasAdminRightsNotification(iboAdmin);
            Log.d(TAG, "onHasAdminRightsNotification");
            BOEventCallback.getInstance().addEvent(MyMeetingActivity.this);
        }
    };

    private final IBODataEvent iboDataEvent = new IBODataEvent() {
        @Override
        public void onBOInfoUpdated(String strBOID) {
            InMeetingBOController boController = mInMeetingService.getInMeetingBOController();
            IBOData iboData = boController.getBODataHelper();
            if (iboData != null) {
                String boName = iboData.getCurrentBoName();
                if (!TextUtils.isEmpty(boName)) {
                    meetingOptionBar.updateMeetingNumber(boName);
                }
            }
        }

        @Override
        public void onUnAssignedUserUpdated() {

        }
    };

    private final IBOAttendeeEvent iboAttendeeEvent = new IBOAttendeeEvent() {
        @Override
        public void onHelpRequestHandleResultReceived(ATTENDEE_REQUEST_FOR_HELP_RESULT eResult) {
            if (eResult == ATTENDEE_REQUEST_FOR_HELP_RESULT.RESULT_IGNORE) {
                new AlertDialog.Builder(MyMeetingActivity.this)
                        .setMessage("The host is currently helping others. Please try again later.")
                        .setCancelable(false)
                        .setPositiveButton("OK", new DialogInterface.OnClickListener() {
                            public void onClick(DialogInterface dialog, int which) {
                            }
                        }).create().show();
            }
        }

        @Override
        public void onHostJoinedThisBOMeeting() {
            mBtnRequestHelp.setVisibility(View.GONE);
        }

        @Override
        public void onHostLeaveThisBOMeeting() {
            mBtnRequestHelp.setVisibility(View.VISIBLE);
        }
    };

    private void attendeeRequestHelp() {
        InMeetingBOController boController = mInMeetingService.getInMeetingBOController();
        final IBOAttendee boAttendee = boController.getBOAttendeeHelper();
        if (boAttendee != null) {
            new AlertDialog.Builder(this)
                    .setMessage("You can invite the host to this Breakout Room for assistance.")
                    .setCancelable(false)
                    .setNegativeButton("Cancel", new DialogInterface.OnClickListener() {
                        public void onClick(DialogInterface dialog, int which) {
                        }
                    })
                    .setPositiveButton("Ask for Help", new DialogInterface.OnClickListener() {
                        public void onClick(DialogInterface dialog, int which) {
                            boAttendee.requestForHelp();
                        }
                    }).create().show();
        }
    }

    private void initDrawing(View view) {

        FrameLayout.LayoutParams layoutParams = new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT);
        layoutParams.gravity = Gravity.CENTER;
        paintView = findViewById(R.id.paintview);
        paintView.setLayoutParams(layoutParams);
//      applyAspectRatio(paintView);
        DisplayMetrics metrics = new DisplayMetrics();
        getWindowManager().getDefaultDisplay().getMetrics(metrics);

        int normalHieght = metrics.heightPixels;

        Log.d("##HEIGHT_METR", String.valueOf(normalHieght));
        Log.d("##HEIGHT_REAL", String.valueOf(getRealSizeOfDisplay().getHeight()));

        paintView.init(getRealSizeOfDisplay(), this, paintView);
        paintView.normal();


    }

    private void initNormalDrawing() {

        FrameLayout.LayoutParams layoutParams = new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT);
        layoutParams.gravity = Gravity.CENTER;
        paintViewNormal = findViewById(R.id.paintviewNormal);
        paintViewNormal.setLayoutParams(layoutParams);
//      applyAspectRatio(paintView);

        paintViewNormal.init(getRealSizeOfDisplay());
        paintViewNormal.normal();
    }

    private Size getRealSizeOfDisplay() {
        Display display = getWindowManager().getDefaultDisplay();
        Point size = new Point();
        display.getRealSize(size);
        final int height = size.y;
        final int width = size.x;

        return new Size(width, height);
    }

    @Override
    public void touchPaintView(MotionEvent event) {

        if (event.getAction() == MotionEvent.ACTION_DOWN) {
            //isSend = false;
            sendTouchEventToscreenshare(event, false);
        }
        if (event.getAction() == MotionEvent.ACTION_MOVE) {
            sendTouchEventToscreenshare(event, false);
        }
        if (event.getAction() == MotionEvent.ACTION_UP) {
            sendTouchEventToscreenshare(event, true);
        }
        if (event.getAction() == MotionEvent.ACTION_MASK) {
            sendTouchEventToscreenshare(event, false);
        }
        if (event.getAction() == MotionEvent.ACTION_OUTSIDE) {
            sendTouchEventToscreenshare(event, false);
        }
    }

    @Override
    public void touchPaintView(MotionEvent event, String drawingText) {

        if (drawingText.equalsIgnoreCase("imagearrow")) {
            sendImageArrowToAR(event);
        } else {
            if (event.getAction() == MotionEvent.ACTION_DOWN) {
                JSONArray motionEventArray = makeJsonArrayText(event);
                showenterTextDialog(motionEventArray);
            }
        }
    }

    @Override
    public void showTouches(MotionEvent event, boolean isShowing) {

        if (isShowing) {
//            sendTouchPointToAR(event);
        }
    }

    private void sendTouchPointToAR(MotionEvent event) {

        try {
            JSONArray motionevent = new JSONArray();
            int resX = newResolution().get("getX");
            int resY = newResolution().get("getY");
            motionevent.put(resX);
            motionevent.put(resY);

            motionevent.put(event.getX());
            motionevent.put(event.getY());
            jsonArrayEvent.put(motionevent);

            JSONObject jsonObject = new JSONObject();
            jsonObject.put("touches", jsonArrayEvent);
            jsonArrayEvent = new JSONArray();
//            ScreenARPushUtils.sendGestureToRemote(jsonObject.toString());

        } catch (Exception e) {
            e.printStackTrace();
        }

    }


    private void sendTouchEventToscreenshare(MotionEvent event, boolean b) {
        try {
            JSONArray motionevent = new JSONArray();
            if (event.getAction() == 0) {
                int resX = newResolution().get("getX");
//              int resY = newResolution().get("getY");
                int resY = RemoteUtils.calRatioHeight;
                motionevent.put(resX);
                motionevent.put(resY);
                motionevent.put(event.getDownTime());
                motionevent.put(event.getEventTime());
            }
            motionevent.put(event.getX());
            motionevent.put(changedScreenPointY(event.getY()));
            motionevent.put(event.getAction());
            jsonArrayEvent.put(motionevent);

            Log.d("##REMOTEVIEW", jsonArrayEvent.toString());
            if (b) {
                JSONObject motionObject = new JSONObject();
                motionObject.put("gestures", jsonArrayEvent);
                jsonArrayEvent = new JSONArray();
//                ScreenARPushUtils.sendGestureToRemote(motionObject.toString());

                sendMessagetoBroadcast("gestures", motionObject.toString());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private float changedScreenPointY(float getY) {

        Size screenSize = getRealSizeOfDisplay();

        if (screenSize.getHeight() == RemoteUtils.calRatioHeight) {

            Log.d("##Y_NORMAL", String.valueOf(RemoteUtils.calRatioHeight));

            return getY;
        } else {
            float newDifference = (screenSize.getHeight() - RemoteUtils.calRatioHeight);
            newDifference = newDifference / 2;

            Log.d("##Y_CAL", String.valueOf(RemoteUtils.calRatioHeight));
            return getY - newDifference;
        }

    }

    private void sendImageArrowToAR(MotionEvent event) {

        try {
            JSONArray motionevent = new JSONArray();
            int resX = newResolution().get("getX");
//          int resY = newResolution().get("getY");
            int resY = RemoteUtils.calRatioHeight;
            motionevent.put(resX);
            motionevent.put(resY);

            motionevent.put(event.getX());
            motionevent.put(changedScreenPointY(event.getY()));
            motionevent.put(event.getAction());
            motionevent.put(event.getMetaState());
            motionevent.put(event.getEventTime());
            motionevent.put(event.getDownTime());
            motionevent.put(ImageArrowUtils.getArrowType());
            motionevent.put(ImageArrowUtils.getArrowColor());
            jsonArrayEvent.put(motionevent);

            Log.d("##REMOTEVIEW", jsonArrayEvent.toString());

            JSONObject jsonObject = new JSONObject();
            jsonObject.put("imagearrow", jsonArrayEvent);
            jsonArrayEvent = new JSONArray();
//            ScreenARPushUtils.sendGestureToRemote(jsonObject.toString());
            sendMessagetoBroadcast("imagearrow", jsonObject.toString());

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void sendTextLableToAR(JSONArray motionevent) {

        try {
            jsonArrayEvent.put(motionevent);
            JSONObject jsonObject = new JSONObject();
            jsonObject.put("textlable", jsonArrayEvent);
            jsonArrayEvent = new JSONArray();
//            ScreenARPushUtils.sendGestureToRemote(jsonObject.toString());
            sendMessagetoBroadcast("textlable", jsonObject.toString());

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private JSONArray makeJsonArrayText(MotionEvent event) {

        JSONArray motionevent = null;
        try {
            motionevent = new JSONArray();
            int resX = newResolution().get("getX");
//          int resY = newResolution().get("getY");
            int resY = RemoteUtils.calRatioHeight;

            motionevent.put(resX);
            motionevent.put(resY);
            motionevent.put(event.getX());
            motionevent.put(changedScreenPointY(event.getY()));
            motionevent.put(event.getAction());
            motionevent.put(event.getMetaState());
            motionevent.put(event.getEventTime());
            motionevent.put(event.getDownTime());

        } catch (Exception e) {
            e.printStackTrace();
        }
        return motionevent;
    }

    private void showenterTextDialog(JSONArray motionEventArray) {

        AlertDialog.Builder alertDialog = new AlertDialog.Builder(this, R.style.AlertDialogCustom);
        alertDialog.setMessage("Enter text here");

        final EditText input = new EditText(this);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.MATCH_PARENT);
        input.setLayoutParams(lp);
        alertDialog.setView(input);

        alertDialog.setPositiveButton("OK",
                (dialog, which) -> {
                    String drawingText12 = input.getText().toString();
                    motionEventArray.put(drawingText12);
                    sendTextLableToAR(motionEventArray);
                });
        alertDialog.setNegativeButton("Cancle",
                (dialog, which) -> dialog.cancel());
        alertDialog.show();

    }


    private HashMap<String, Integer> newResolution() {

        DisplayMetrics displayMetrics = new DisplayMetrics();
        WindowManager wm = (WindowManager) getApplicationContext().getSystemService(Context.WINDOW_SERVICE); // the results will be higher than using the activity context object or the getWindowManager() shortcut
        wm.getDefaultDisplay().getMetrics(displayMetrics);

        int screenWidth = paintView.getWidth();
        int screenHeight = paintView.getHeight();

        Size size = getRealSizeOfDisplay();
        Log.d("##BUG_SCREEN", "PHEIGHT :" + screenHeight + " PWIDTH :" + screenWidth + "RHEIGHT :" + size.getHeight() + "RWIDTH :" + screenWidth);

        HashMap<String, Integer> newResolution = new HashMap<>();
        newResolution.put("getX", screenWidth);
        newResolution.put("getY", screenHeight);
        return newResolution;
    }

    //ShowBottomSheet
    public void showBottomSheet() {

        int[] items = new int[]{
                R.string.ges,
                R.string.arrow,
                R.string.textfields,
                R.string.imagearrow,
        };

        int[] icons = new int[]{
                R.drawable.ic_draw_gesture_foreground,
                R.drawable.ic_draw_arrow_foreground,
                R.drawable.ic_draw_text_foreground,
                R.drawable.ic_draw_imagearrow_foreground,
        };

        BottomSheet.Builder builder = new BottomSheet.Builder(MyMeetingActivity.this);
        builder.setTitle("Please select drawing option");
        builder.setItems(items, icons, (dialogInterface, i) ->

                onToolsButtonClicked(i));
        builder.setFullWidth(true);
        builder.setCallback(new BottomSheetCallback() {
            @Override
            public void onShown() {

            }

            @Override
            public void onDismissed() {

            }
        });
        builder.getGridView();
        builder.show();
    }

    private void onToolsButtonClicked(int i) {


        String item = "";

        if (i == 0) {

            item = "gesture";
        }
        if (i == 1) {

            item = "arrow";
        }

        if (i == 2) {

            item = "Text Fields";
        }
        if (i == 3) {

            item = "imagearrow";
        }


        if (item.equalsIgnoreCase("gesture")) {

            ArDrawingUtils.setDrawingType("");

        } else if (item.equalsIgnoreCase("arrow")) {
            ArDrawingUtils.setDrawingType("arrow");

        } else if (item.equalsIgnoreCase("Text Fields")) {
            ArDrawingUtils.setDrawingType("text");
        } else if (item.equalsIgnoreCase("imagearrow")) {
            ArDrawingUtils.setDrawingType("imagearrow");
            showArrowAlertDialog();
        }
    }

    private void showArrowAlertDialog() {


        final String[] selectedImage = {""};
        final String[] selectedColor = {""};

        // custom dialog
        final Dialog dialog = new Dialog(MyMeetingActivity.this);
        dialog.setContentView(R.layout.alert_arrow);
        Button dialogButton = dialog.findViewById(R.id.btn_arrowselect);

        ImageView imageDown = dialog.findViewById(R.id.img_down);
        ImageView imageUp = dialog.findViewById(R.id.img_up);
        ImageView imageLeft = dialog.findViewById(R.id.img_left);
        ImageView imageRight = dialog.findViewById(R.id.img_right);

        ImageView colorBlue = dialog.findViewById(R.id.color_blue);
        ImageView colorGreen = dialog.findViewById(R.id.color_green);
        ImageView colorOrange = dialog.findViewById(R.id.color_orange);
        ImageView colorYellow = dialog.findViewById(R.id.color_yellow);


        imageDown.setOnClickListener(view -> {
            selectedImage[0] = "down";
//            setSelectedImage(imageDown);
            imageDown.setImageDrawable(getApplicationContext().getResources().getDrawable(R.drawable.ic_arrow_selected_foreground));
            imageDown.setBackground(getApplicationContext().getResources().getDrawable(R.drawable.backgound_alert_arrow));
            //
            imageUp.setImageDrawable(getApplicationContext().getResources().getDrawable(R.drawable.ic_arrow_up_foreground));
            imageLeft.setImageDrawable(getApplicationContext().getResources().getDrawable(R.drawable.ic_arrow_left_foreground));
            imageRight.setImageDrawable(getApplicationContext().getResources().getDrawable(R.drawable.ic_arrow_right));

        });

        imageUp.setOnClickListener(view -> {
            selectedImage[0] = "up";
//            setSelectedImage(imageDown);
            imageUp.setImageDrawable(getApplicationContext().getResources().getDrawable(R.drawable.ic_arrow_selected_foreground));
            imageUp.setBackground(getApplicationContext().getResources().getDrawable(R.drawable.backgound_alert_arrow));
            //
            imageLeft.setImageDrawable(getApplicationContext().getResources().getDrawable(R.drawable.ic_arrow_left_foreground));
            imageRight.setImageDrawable(getApplicationContext().getResources().getDrawable(R.drawable.ic_arrow_right));
            imageDown.setImageDrawable(getApplicationContext().getResources().getDrawable(R.drawable.ic_arrow_down_foreground));
        });

        imageLeft.setOnClickListener(view -> {
            selectedImage[0] = "left";
//            setSelectedImage(imageDown);
            imageLeft.setImageDrawable(getApplicationContext().getResources().getDrawable(R.drawable.ic_arrow_selected_foreground));
            imageLeft.setBackground(getApplicationContext().getResources().getDrawable(R.drawable.backgound_alert_arrow));

            //
            imageRight.setImageDrawable(getApplicationContext().getResources().getDrawable(R.drawable.ic_arrow_right));
            imageDown.setImageDrawable(getApplicationContext().getResources().getDrawable(R.drawable.ic_arrow_down_foreground));
            imageUp.setImageDrawable(getApplicationContext().getResources().getDrawable(R.drawable.ic_arrow_up_foreground));
        });

        imageRight.setOnClickListener(view -> {
            selectedImage[0] = "right";
//            setSelectedImage(imageDown);
            imageRight.setImageDrawable(getApplicationContext().getResources().getDrawable(R.drawable.ic_arrow_selected_foreground));
            imageRight.setBackground(getApplicationContext().getResources().getDrawable(R.drawable.backgound_alert_arrow));

            //
            imageDown.setImageDrawable(getApplicationContext().getResources().getDrawable(R.drawable.ic_arrow_down_foreground));
            imageUp.setImageDrawable(getApplicationContext().getResources().getDrawable(R.drawable.ic_arrow_up_foreground));
            imageLeft.setImageDrawable(getApplicationContext().getResources().getDrawable(R.drawable.ic_arrow_left_foreground));
        });
        //For Color
        colorBlue.setOnClickListener(view -> {
            selectedColor[0] = "blue";
            colorBlue.setImageDrawable(getApplicationContext().getResources().getDrawable(R.drawable.ic_arrow_selected_foreground));
            colorBlue.setBackgroundColor(getApplicationContext().getResources().getColor(R.color.blue));

            //
            colorOrange.setImageResource(R.color.orange);
            colorYellow.setImageResource(R.color.yellow);
            colorGreen.setImageResource(R.color.green);
        });

        colorGreen.setOnClickListener(view -> {
            selectedColor[0] = "green";
            colorGreen.setImageDrawable(getApplicationContext().getResources().getDrawable(R.drawable.ic_arrow_selected_foreground));
            colorGreen.setBackgroundColor(getApplicationContext().getResources().getColor(R.color.green));

            //Color
            colorBlue.setImageResource(R.color.blue);
            colorOrange.setImageResource(R.color.orange);
            colorYellow.setImageResource(R.color.yellow);
        });

        colorOrange.setOnClickListener(view -> {

            selectedColor[0] = "orange";
            colorOrange.setImageDrawable(getApplicationContext().getResources().getDrawable(R.drawable.ic_arrow_selected_foreground));
            colorOrange.setBackgroundColor(getApplicationContext().getResources().getColor(R.color.orange));

            colorYellow.setImageResource(R.color.yellow);
            colorBlue.setImageResource(R.color.blue);
            colorGreen.setImageResource(R.color.green);

        });

        colorYellow.setOnClickListener(view -> {

            selectedColor[0] = "yellow";
            colorYellow.setImageDrawable(getApplicationContext().getResources().getDrawable(R.drawable.ic_arrow_selected_foreground));
            colorYellow.setBackgroundColor(getApplicationContext().getResources().getColor(R.color.yellow));

            colorBlue.setImageResource(R.color.blue);
            colorGreen.setImageResource(R.color.green);
            colorOrange.setImageResource(R.color.orange);
        });


        // if button is clicked, close the custom dialog
        dialogButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                dialog.dismiss();
                Toast.makeText(getApplicationContext(), selectedImage[0] + " " + selectedColor[0], Toast.LENGTH_SHORT).show();
                ImageArrowUtils.setArrowType(selectedImage[0]);
                ImageArrowUtils.setArrowColor(selectedColor[0]);
            }
        });
        dialog.show();
    }


    public Size getSizeAdjustedToAspectRatio() {

        Log.d("##MEETING", "getSizeAdjustedToAspectRatio:" + "1");

//      ArDrawingUtils.isDrawingEnable=true;
        float newHeight;
        float newWidth;


        Size size = getRealSizeOfDisplay();

        int sourceWidth = size.getWidth();
        int sourceHeight = size.getHeight();

        Log.d("##MEETING", "getSizeAdjustedToAspectRatio:" + " SHEIGHT: " + sourceHeight + " SWIDTH: " + sourceWidth);

        sharedPreferences = getSharedPreferences("RATIO", Context.MODE_PRIVATE);
        float dHeight = Float.parseFloat(sharedPreferences.getString("Height", "320"));
        float dWidth = Float.parseFloat(sharedPreferences.getString("Width", "240"));
        final float srcAspect = (float) sourceWidth / (float) sourceHeight;
        final float dstAspect = dWidth / dHeight;
        boolean isLandscape = sourceWidth > sourceHeight;

        dHeight = RemoteUtils.getRemoteHeight();
        dWidth = RemoteUtils.getRemoteWidth();

        Log.d("##MEETING", "getSizeAdjustedToAspectRatio:" + " DHEIGHT: " + dHeight + " DWIDTH: " + dWidth);


        int newHeight1;
        int newWidth1;
        if (srcAspect < dstAspect) {

            if (isLandscape) {
                newHeight = dWidth * sourceHeight / sourceWidth;
                newWidth = dWidth;
                newWidth1 = (int) newWidth;
                newHeight1 = (int) newHeight;
            } else {
                newWidth = dHeight * sourceWidth / sourceHeight;
                newHeight = dHeight;
                newHeight1 = (int) newHeight;
                newWidth1 = (int) newWidth;
            }
        } else {
            newHeight1 = 320;
            newWidth1 = 240;
        }
        float newDRatio = dHeight / dWidth;
//      newWidth1= (int) (sourceWidth/newSRatio);
        newHeight1 = (int) (newDRatio * sourceWidth);

        SharedPreferences sharedpreferences = getApplicationContext().getSharedPreferences("NEWRATIO", Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = sharedpreferences.edit();
        editor.putString("Width", String.valueOf(sourceWidth));
        editor.putString("Height", String.valueOf(newHeight1));
        editor.apply();

        Log.d("##MEETING", "getSizeAdjustedToAspectRatio:2");


        if (dHeight > sourceHeight) {
            RemoteUtils.calRatioHeight = sourceHeight;
        } else {
            RemoteUtils.calRatioHeight = newHeight1;
        }

        Log.d("##DIMENSION", "HEIGHT: " + newHeight1 + "WIDTH: " + newWidth1);

        Log.d("##MEETING", "getSizeAdjustedToAspectRatio:" + " FHEIGHT: " + newHeight1 + " FWIDTH: " + sourceWidth);


        return new Size(sourceWidth, newHeight1);
    }


    private void changeLayoutSize(String newWidth, String newHeight) {

        int newW = Integer.parseInt(newWidth);
        int newH = Integer.parseInt(newHeight);

        int screenWidth = RemoteUtils.getRealSizeWidth();
        int screenHeight = RemoteUtils.getRealSizeHeight();
        float aspect_ratio = (float) newH / (float) newW;
        int newHeight1 = (int) (aspect_ratio * screenWidth);
        RemoteUtils.newNormalHeight = newHeight1;
        initNormalDrawing();

    }

    private final BroadcastReceiver mMessageReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            try {

                String message = intent.getStringExtra("message");
                meetingShareHelper.stopShare();
                ZoomSDK.getInstance().getInMeetingService().getInMeetingVideoController().muteMyVideo(false);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    };


    private void showUserList() {

        ArrayList<ListUsernameFId> listUsernameFIds = NetworkCallZoomChat.getListOfUserAndFCMID();

        ArrayList<String> nameList = new ArrayList<>();

        for (int i = 0; i < listUsernameFIds.size(); i++) {

            String userName = listUsernameFIds.get(i).getUsername();
            nameList.add(userName);
        }


        showUserList(this, nameList, listUsernameFIds);

       /* FilterableListDialog.create(this, nameList,
                item -> {
                    for (int i = 0; i < listUsernameFIds.size(); i++) {

                        String username = listUsernameFIds.get(i).getUsername();
                        if (username.equalsIgnoreCase(item)) {
                            String userId = listUsernameFIds.get(i).getUserid();
                            String deviceType = listUsernameFIds.get(i).getDeviceType();

                            ZoomSDK sdk = ZoomSDK.getInstance();
                            InMeetingService inMeetingService = sdk.getInMeetingService();

                            inMeetingService.getInMeetingShareController().lockShare(false);
                            inMeetingService.getInMeetingWaitingRoomController().enableWaitingRoomOnEntry(false);

                            String meetingId = String.valueOf(inMeetingService.getCurrentMeetingNumber());
                            String meetingPassword = inMeetingService.getMeetingPassword();

                            InMeetingUserInfo meetingUserInfo = inMeetingService.getMyUserInfo();
                            String userName = meetingUserInfo.getUserName();

//                            ScreenARPushUtils.sendNotificationToSingleUser(meetingId, meetingPassword,
//                                    MyMeetingActivity.this, userName, deviceType, userId);

                            try {
                                JSONObject jsonObject = new JSONObject();
                                jsonObject.put("meetingID", meetingId);
                                jsonObject.put("meetingPassword", meetingPassword);
                                jsonObject.put("userName", userName);
                                jsonObject.put("deviceType", deviceType);
                                jsonObject.put("userId", userId);

                                sendMessagetoBroadcast("showuser",jsonObject.toString());

                            }catch (Exception e){
                                e.printStackTrace();
                            }
                            break;
                        }
                    }
                }).show();*/

    }


    void showUserList(Context context
            , ArrayList<String> nameList, ArrayList<ListUsernameFId> listUsernameFIds) {

        final ArrayAdapter<String> arrayAdapter = new ArrayAdapter<>(context, R.layout.user_view, nameList);
        Dialog builderSingle = new Dialog(context);
        final View view = LayoutInflater.from(this).inflate(R.layout.users_list, null);
        final ListView lvUserList = view.findViewById(R.id.lvUserList);
        final TextInputEditText tiEtSearch = view.findViewById(R.id.tiEtSearch);
        tiEtSearch.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {

            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {

            }

            @Override
            public void afterTextChanged(Editable s) {
                if (!s.toString().equals("")) {
                    arrayAdapter.getFilter().filter(s);
                } else {
                    arrayAdapter.getFilter().filter("");
                }
            }
        });

        lvUserList.setOnItemClickListener((parent, view1, position, id) -> {
            builderSingle.dismiss();
            try {
                String username = listUsernameFIds.get(position).getUsername();
                if (username.equalsIgnoreCase(nameList.get(position))) {
                    String userId = listUsernameFIds.get(position).getUserid();
                    String deviceType = listUsernameFIds.get(position).getDeviceType();

                    ZoomSDK sdk = ZoomSDK.getInstance();
                    InMeetingService inMeetingService = sdk.getInMeetingService();

                    inMeetingService.getInMeetingShareController().lockShare(false);
                    inMeetingService.getInMeetingWaitingRoomController().enableWaitingRoomOnEntry(false);

                    String meetingId = String.valueOf(inMeetingService.getCurrentMeetingNumber());
                    String meetingPassword = inMeetingService.getMeetingPassword();

                    InMeetingUserInfo meetingUserInfo = inMeetingService.getMyUserInfo();
                    String userName = meetingUserInfo.getUserName();

//                            ScreenARPushUtils.sendNotificationToSingleUser(meetingId, meetingPassword,
//                                    MyMeetingActivity.this, userName, deviceType, userId);

                    try {
                        JSONObject jsonObject = new JSONObject();
                        jsonObject.put("meetingID", meetingId);
                        jsonObject.put("meetingPassword", meetingPassword);
                        jsonObject.put("userName", userName);
                        jsonObject.put("deviceType", deviceType);
                        jsonObject.put("userId", userId);

                        sendMessagetoBroadcast("showuser", jsonObject.toString());

                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            } catch (Exception e) {
                Log.e(TAG, e.toString());
            }

        });

        lvUserList.setAdapter(arrayAdapter);
        builderSingle.setContentView(view);
      /*  builderSingle.setAdapter(arrayAdapter, new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                String strName = arrayAdapter.getItem(which);
                for (int i = 0; i < listUsernameFIds.size(); i++) {

                    String username = listUsernameFIds.get(i).getUsername();
                    if (username.equalsIgnoreCase(strName)) {
                        String userId = listUsernameFIds.get(i).getUserid();
                        String deviceType = listUsernameFIds.get(i).getDeviceType();

                        ZoomSDK sdk = ZoomSDK.getInstance();
                        InMeetingService inMeetingService = sdk.getInMeetingService();

                        inMeetingService.getInMeetingShareController().lockShare(false);
                        inMeetingService.getInMeetingWaitingRoomController().enableWaitingRoomOnEntry(false);

                        String meetingId = String.valueOf(inMeetingService.getCurrentMeetingNumber());
                        String meetingPassword = inMeetingService.getMeetingPassword();

                        InMeetingUserInfo meetingUserInfo = inMeetingService.getMyUserInfo();
                        String userName = meetingUserInfo.getUserName();

//                            ScreenARPushUtils.sendNotificationToSingleUser(meetingId, meetingPassword,
//                                    MyMeetingActivity.this, userName, deviceType, userId);

                        try {
                            JSONObject jsonObject = new JSONObject();
                            jsonObject.put("meetingID", meetingId);
                            jsonObject.put("meetingPassword", meetingPassword);
                            jsonObject.put("userName", userName);
                            jsonObject.put("deviceType", deviceType);
                            jsonObject.put("userId", userId);

                            sendMessagetoBroadcast("showuser", jsonObject.toString());

                        } catch (Exception e) {
                            e.printStackTrace();
                        }
                        break;
                    }
                }
            }
        });*/
        builderSingle.show();
    }

    private void sendMessagetoBroadcast(String msgKey, String msgValue) {
        Log.d("sender", "Broadcasting message");
        Intent intent = new Intent("zoom-event-receiver");
        intent.putExtra("keytype", msgKey);
        intent.putExtra("jsonData", msgValue);
        LocalBroadcastManager.getInstance(this).sendBroadcast(intent);
    }

}

