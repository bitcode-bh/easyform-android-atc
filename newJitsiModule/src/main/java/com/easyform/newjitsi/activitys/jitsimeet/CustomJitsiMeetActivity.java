package com.easyform.newjitsi.activitys.jitsimeet;

import static com.easyform.newjitsi.App.context;
import static com.easyform.newjitsi.App.getContext;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.ActivityManager;
import android.app.AlertDialog;
import android.app.Dialog;
import android.app.PictureInPictureParams;
import android.content.BroadcastReceiver;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Insets;
import android.graphics.Point;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.MediaScannerConnection;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkInfo;
import android.net.NetworkRequest;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.os.StrictMode;
import android.provider.MediaStore;
import android.util.DisplayMetrics;
import android.util.Log;
import android.util.Rational;
import android.util.Size;
import android.util.TypedValue;
import android.view.Display;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.PixelCopy;
import android.view.SurfaceView;
import android.view.TextureView;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.view.WindowManager;
import android.view.WindowMetrics;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;


import androidx.annotation.NonNull;
import androidx.annotation.Nullable;


import androidx.annotation.RequiresApi;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentManager;
import androidx.lifecycle.ViewModelProvider;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;


import com.easyform.newjitsi.R;
import com.easyform.newjitsi.activitys.call.IncomingCallActivity;
import com.easyform.newjitsi.activitys.chat.ChatActivity;
import com.easyform.newjitsi.activitys.chat.WebApiCallJitsiMeet;
import com.easyform.newjitsi.activitys.drawing.AR.ARDrawActivity;

import com.easyform.newjitsi.activitys.drawing.ArDrawingUtils;
import com.easyform.newjitsi.activitys.drawing.CameraPreviewActivity;
import com.easyform.newjitsi.activitys.drawing.ChecklistItem;
import com.easyform.newjitsi.activitys.drawing.DrawingEventListner;
import com.easyform.newjitsi.activitys.drawing.ImageArrowUtils;
import com.easyform.newjitsi.activitys.drawing.PaintView;
import com.easyform.newjitsi.activitys.drawing.models.RemoteUtils;
import com.easyform.newjitsi.broadcasts.JitsiPluginBroadcast;
import com.easyform.newjitsi.databinding.ActivityCustomJitsiMeetBinding;
import com.easyform.newjitsi.fragments.InviteListItem;
import com.easyform.newjitsi.fragments.InviteUserAdapter;
import com.easyform.newjitsi.fragments.MultiChoiceDialogFragment;
import com.easyform.newjitsi.network.Apis;
import com.easyform.newjitsi.network.Models.OtherData;
import com.easyform.newjitsi.network.Models.UserData;
import com.easyform.newjitsi.network.Models.participant.Participant;
import com.easyform.newjitsi.network.response.users.EasyFromUser;
import com.easyform.newjitsi.network.response.users.EasyFromUserItem;
import com.easyform.newjitsi.utils.JitsiMeetBroadcastUtils;
import com.easyform.newjitsi.utils.NotificationUtils;
import com.easyform.newjitsi.utils.Utils;
import com.google.ar.core.ArCoreApk;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import org.jitsi.meet.sdk.BroadcastEvent;
import org.jitsi.meet.sdk.JitsiMeetActivity;
import org.jitsi.meet.sdk.JitsiMeetActivityDelegate;
import org.jitsi.meet.sdk.JitsiMeetConferenceOptions;
import org.jitsi.meet.sdk.JitsiMeetUserInfo;
import org.jitsi.meet.sdk.JitsiMeetView;
import org.jitsi.meet.sdk.log.JitsiMeetLogger;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.michaelbel.bottomsheet.BottomSheet;
import org.michaelbel.bottomsheet.BottomSheetCallback;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.lang.reflect.Type;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.Executors;


import timber.log.Timber;

public class CustomJitsiMeetActivity extends JitsiMeetActivity implements DrawingEventListner {
    ActivityCustomJitsiMeetBinding mActivityCustomJitsiMeetBinding = null;
    ArCoreApk.Availability availability;
    CustomJitsiMeetViewModel mCustomJitsiMeetViewModel;
    private JSONArray jsonArrayEvent = new JSONArray();
    JitsiMeetView jitsiMeetView;
    IncomingCallActivity mIncomingCallActivity;
    private boolean isScreenSharingActive = false;
    WebDialogFragment webDialogFragment;
    private List<InviteListItem> inviteListItems = new ArrayList<>();
    static String task_id;
    private MediaPlayer chatSound;
    private String localParticipantId = null;
    private static final String METHOD_NAME_GetCheekshet = "WCF_GetCustomerWithGlobalVar_With_Role_Port";
    private static final String METHOD_NAME_GetCheckSheetData = "WCF_GetCheckSheetData_Port";
    public static boolean isCallRunning = false;

    private static CustomJitsiMeetActivity instance;


// JITSI CONNECTION QUALITY
    private Handler connectionQualityHandler;

    private Runnable connectionQualityRunnable;

    private boolean connectionQualityMonitoring = false;

    private long lastPoorConnectionToastTime = 0;

    private static final long POOR_CONNECTION_TOAST_INTERVAL = 10_000;

    // Number of consecutive poor checks before Toast.
// This prevents Toast because of one temporary bad packet.
    private int poorConnectionCount = 0;

    private static final int REQUIRED_POOR_COUNT = 2;

    private String currentConnectionQuality = "unknown";
    public static final String ACTION_CONNECTION_QUALITY = "org.jitsi.meet.CONNECTION_QUALITY";

    public static final String EXTRA_CONNECTION_QUALITY = "quality";

    public static CustomJitsiMeetActivity getInstance() {
        return instance;
    }

    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);

        if (intent.getAction() != null &&
                intent.getAction().equals("org.jitsi.meet.CONFERENCE_RESTART")) {
            // Reload Jitsi UI
            JitsiMeetActivityDelegate.onNewIntent(intent);
        }
    }
    private final BroadcastReceiver connectionQualityReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(
                Context context,
                Intent intent) {

            if (!ACTION_CONNECTION_QUALITY.equals(intent.getAction())) {
                return;
            }

            String quality = intent.getStringExtra(EXTRA_CONNECTION_QUALITY);

//            Log.d(
//                    "JitsiConnectionQuality",
//                    "Quality = " + quality
//            );

            if ("poor".equalsIgnoreCase(quality)) {

                showPoorConnectionToast();
            }
        }
    };


    private final BroadcastReceiver commentReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            String textType = intent.getStringExtra("textType");
            String task_id = intent.getStringExtra("task_id");
//            if ("Comment".equals(textType)) {
//                if (webDialogFragment != null && webDialogFragment.isVisible()) {
//                    webDialogFragment.reload_webview();
//                } else {
//                    webDialogFragment = new WebDialogFragment("", task_id,"","","");
//                    webDialogFragment.show(getSupportFragmentManager(), "webDialog");
//                    Log.d("Broadcast", "WebDialogFragment reference is null or not visible.");
//                }
//            }
        }
    };

    private final BroadcastReceiver broadcastReceiver = new BroadcastReceiver() {
        public void onReceive(Context context, Intent intent) {
            CustomJitsiMeetActivity.this.onBroadcastReceived(intent);
        }
    };
    private PaintView paintView;

    private final BroadcastReceiver broadcastScreenShearReceiver = new BroadcastReceiver() {
        public void onReceive(Context context, Intent intent) {
            if (intent.getExtras().containsKey(Utils.BroadcastActionExtrasKeys.SHARE_TOGGLE)) {
                Boolean shareToggle = intent.getBooleanExtra(Utils.BroadcastActionExtrasKeys.SHARE_TOGGLE, false);
                if (!shareToggle) {
                    stopScreenShearCameraActivitys();
                }
                if (isScreenSharingActive) {

                    Log.d("JitsiScreenShare", "Ignored duplicate screen share request");
                    return;
                } else {
                    exitPipAndShowFullScreen();
                    JitsiMeetBroadcastUtils.screenShareToggle(context, shareToggle);
                }
            }
        }
    };


    int width = 0;
    int height = 0;
    private final BroadcastReceiver broadcastScreenShearRemoteSizeReceiver = new BroadcastReceiver() {
        public void onReceive(Context context, Intent intent) {
            if (intent.getAction().matches(Utils.BroadcastAction.JITSI_SCREEN_SIZE_REMOTE_ACTIVITY)) {
                width = RemoteUtils.getRemoteWidth();
                height = RemoteUtils.getRemoteHeight();
                if (screenShearEasyFromUserList != null && !screenShearEasyFromUserList.isEmpty()) {
                    setScreenSizeOfReciever(true);
                }

            }
        }
    };

    private void initDrawing() {
        paintView = mActivityCustomJitsiMeetBinding.paintview;

//      applyAspectRatio(paintView);
        DisplayMetrics metrics = new DisplayMetrics();
        getWindowManager().getDefaultDisplay().getMetrics(metrics);

        int normalHieght = metrics.heightPixels;

        Log.d("##HEIGHT_METR", String.valueOf(normalHieght));
        Log.d("##HEIGHT_REAL", String.valueOf(getRealSizeOfDisplay().getHeight()));

        paintView.init(getRealSizeOfDisplay(), this, paintView);
        paintView.normal();

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

    private void sendTouchEventToscreenshare(MotionEvent event, boolean b) {
        try {
            JSONArray motionevent = new JSONArray();
            if (event.getAction() == 0) {
                int resX = newResolution().get("getX");
                //    int resY = newResolution().get("getY");
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

            Timber.tag("##REMOTEVIEW").d(jsonArrayEvent.toString());
            if (b) {
                JSONObject jsonObject = new JSONObject();
                jsonObject.put("gestures", jsonArrayEvent);
                jsonArrayEvent = new JSONArray();
                mCustomJitsiMeetViewModel.sendNotificationScreenShearDrawData(extras, screenShearEasyFromUserList, "gestures", jsonObject.toString(),CustomJitsiMeetActivity.this);
                //  mCustomJitsiMeetViewModel.sendDrewData(extras, screenShearEasyFromUserList, "gestures", jsonArrayEvent);
            }
        } catch (Exception e) {
            e.printStackTrace();
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

            Timber.tag("##REMOTEVIEW").d(jsonArrayEvent.toString());

            JSONObject jsonObject = new JSONObject();
            jsonObject.put("imagearrow", jsonArrayEvent);
            jsonArrayEvent = new JSONArray();
            mCustomJitsiMeetViewModel.sendNotificationScreenShearDrawData(extras, screenShearEasyFromUserList, "imagearrow", jsonObject.toString(),CustomJitsiMeetActivity.this);
//            mCustomJitsiMeetViewModel.sendDrewData(extras, screenShearEasyFromUserList, "imagearrow", motionevent);


        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void showTouches(MotionEvent event, boolean isShowing) {

        if (isShowing) {
//            sendTouchPointToAR(event);
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
            mActivityCustomJitsiMeetBinding.flPaintView.setLayoutParams(layoutParams);
        }
    }

    private SharedPreferences sharedPreferences;

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

    private void showenterTextDialog(JSONArray motionEventArray) {

        AlertDialog.Builder alertDialog = new AlertDialog.Builder(this);
        alertDialog.setMessage("Enter text here");

        final EditText input = new EditText(this);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.MATCH_PARENT);
        lp.setMargins(50, 20, 50, 20);
        input.setLayoutParams(lp);
        alertDialog.setView(input);

        alertDialog.setPositiveButton("OK",
                (dialog, which) -> {
                    String drawingText12 = input.getText().toString();
                    motionEventArray.put(drawingText12);
//                    mCustomJitsiMeetViewModel.sendDrewData(extras, screenShearEasyFromUserList, "textlable", motionEventArray);
                    sendTextLableToAR(motionEventArray);
                });
        alertDialog.setNegativeButton("Cancle",
                (dialog, which) -> dialog.cancel());
        alertDialog.show();

    }

    @SuppressLint("LogNotTimber")
    private void sendTextLableToAR(JSONArray motionevent) {

        try {
            jsonArrayEvent.put(motionevent);
            JSONObject jsonObject = new JSONObject();
            jsonObject.put("textlable", jsonArrayEvent);
            jsonArrayEvent = new JSONArray();
            mCustomJitsiMeetViewModel.sendNotificationScreenShearDrawData(extras, screenShearEasyFromUserList, "textlable", jsonObject.toString(),CustomJitsiMeetActivity.this);
        } catch (Exception e) {
            Log.d("#TEXTLABLE", e.toString());
            e.printStackTrace();
        }
    }

    private Size getRealSizeOfDisplay() {
        Display display = getWindowManager().getDefaultDisplay();
        Point size = new Point();
        display.getRealSize(size);
        final int height = size.y;
        final int width = size.x;

        return new Size(width, height);
    }


    boolean isNotificationSent = false;

    void stopScreenShearCameraActivitys() {

        if (!isNotificationSent) {
            setDrawOptionsClicks();
            isScreenSharingActive = false;
            mCustomJitsiMeetViewModel.sendNotificationScreenShearStop(extras, false,CustomJitsiMeetActivity.this);

            mActivityCustomJitsiMeetBinding.llUserActions.setVisibility(View.VISIBLE);
            Intent jitsiPluginBroadcast = new Intent();
            jitsiPluginBroadcast.setAction(Utils.BroadcastAction.JITSI_SCREEN_SHEAR_ACTION_DRAW);
            LocalBroadcastManager.getInstance(getApplicationContext()).sendBroadcast(jitsiPluginBroadcast);
            isNotificationSent = true;

        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

//        StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
//        StrictMode.setThreadPolicy(policy);

        getWindow().setFlags(
                WindowManager.LayoutParams.FLAG_FULLSCREEN,
                WindowManager.LayoutParams.FLAG_FULLSCREEN
        );

        getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
        );

        registerForBroadcastMessages();
        jitsiMeetView = new JitsiMeetView(this);
        instance = this;
//        WebRTCModuleOptions options = WebRTCModuleOptions.getInstance();
//        options.loggingSeverity = Logging.Severity.LS_ERROR;

        //availability = ArCoreApk.getInstance().checkAvailability(this);
        ArCoreApk.getInstance().checkAvailabilityAsync(this, availabilityStatus -> {
            availability = availabilityStatus;
        });
        mCustomJitsiMeetViewModel = new ViewModelProvider(this).get(CustomJitsiMeetViewModel.class);
        if (getIntent().getAction().matches("org.jitsi.meet.CONFERENCE")) {
            mActivityCustomJitsiMeetBinding = ActivityCustomJitsiMeetBinding.inflate(getLayoutInflater());
            initDrawing();
            setUserActionClicks();
            setDrawOptionsClicks();
            FrameLayout.LayoutParams layoutParams = new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT);
            ((FrameLayout) findViewById(android.R.id.content)).addView(mActivityCustomJitsiMeetBinding.getRoot(), layoutParams);

            mActivityCustomJitsiMeetBinding.loading.setVisibility(View.VISIBLE);
        }
        iniUi();
    }


    Bundle extras = null;
   static Bundle mBundle = null;
   public static List<EasyFromUserItem> easyFromUserItemList;
    List<EasyFromUser> screenShearEasyFromUserList;

    public static int offset = 0;
    public static final int fetch = 50;
   public static boolean hasMoreData = true;

    private void iniUi() {
        extras = getIntent().getExtras();
        mBundle = getIntent().getExtras();
        mCustomJitsiMeetViewModel.easyFromUserItemList.observe(this, easyFromUserItems -> {
            this.easyFromUserItemList = easyFromUserItems;
        });


        mCustomJitsiMeetViewModel.getUserDataFromCompanyId(extras, offset, fetch);
    }


    public static void launch(Context context, JitsiMeetConferenceOptions options, Bundle extras) {
        Intent intent = new Intent(context, CustomJitsiMeetActivity.class);
        intent.setAction("org.jitsi.meet.CONFERENCE");
        intent.putExtra("JitsiMeetConferenceOptions", options);
        intent.putExtras(extras);

        if (!(context instanceof Activity)) {

            intent.setFlags(268435456);
        }
        context.startActivity(intent);
    }


    public static void customLaunch(Context context, String roomOrJetToken, UserData mUserData,OtherData mOtherData, Bundle extras) {

        Executors.newSingleThreadExecutor().execute(() ->
        {
            URL serverURL;
            try {
                serverURL = new URL(Apis.JITSI_URL);
            } catch (MalformedURLException e) {
                e.printStackTrace();
                throw new RuntimeException("Invalid server URL!");
            }
            JitsiMeetUserInfo mJitsiMeetUserInfo = new JitsiMeetUserInfo();
            mJitsiMeetUserInfo.setDisplayName(mUserData.getUsername());
            task_id = mOtherData.getServer_task_id();
            JitsiMeetConferenceOptions options = new JitsiMeetConferenceOptions.Builder()
                    .setServerURL(serverURL)
                    .setRoom(roomOrJetToken)
                    .setUserInfo(mJitsiMeetUserInfo)
                    .setFeatureFlag("notifications.enabled", true)
                    .setFeatureFlag("invite.enabled", false)
                    .setFeatureFlag("video-share.enabled", false)
                    .setFeatureFlag("pip-while-screen-sharing.enabled", true)
                    .setFeatureFlag("prejoinpage.enabled", false)
                    .setFeatureFlag("callstats.enabled", false)
                    .setFeatureFlag("chat.enabled", true)
                    .setFeatureFlag("welcomepage.enabled", false)
                    .setFeatureFlag("desktop-sharing.enabled", true)
                    .setFeatureFlag("android.screensharing.enabled", true)
                    .setFeatureFlag("pip.enabled", false)
                    .setFeatureFlag("pinSelf",true)
//                .setFeatureFlag("tile-view.enabled", true)
//                .setFeatureFlag("filmstrip.enabled", false)
                    .setAudioMuted(false)
                    .setVideoMuted(false)
                    .build();

            new android.os.Handler(android.os.Looper.getMainLooper()).post(() -> {
                CustomJitsiMeetActivity.launch(context, options, extras);
            });

        });

    }

    private void registerForBroadcastMessages() {
        IntentFilter intentFilter = new IntentFilter();
        BroadcastEvent.Type[] var2 = BroadcastEvent.Type.values();
        int var3 = var2.length;

        for (BroadcastEvent.Type type : var2) {
            intentFilter.addAction(type.getAction());
        }
        LocalBroadcastManager.getInstance(this).registerReceiver(this.broadcastReceiver, intentFilter);
        IntentFilter intentScreenShearFilter = new IntentFilter();
        intentScreenShearFilter.addAction(Utils.BroadcastAction.JITSI_SCREEN_SHEAR_ACTION);
        LocalBroadcastManager.getInstance(this).registerReceiver(this.broadcastScreenShearReceiver, intentScreenShearFilter);

        IntentFilter intentScreenShearRemoteSizeFilter = new IntentFilter();
        intentScreenShearRemoteSizeFilter.addAction(Utils.BroadcastAction.JITSI_SCREEN_SIZE_REMOTE_ACTIVITY);
        LocalBroadcastManager.getInstance(this).registerReceiver(this.broadcastScreenShearRemoteSizeReceiver, intentScreenShearRemoteSizeFilter);

// JITSI CONNECTION QUALITY
        IntentFilter connectionQualityFilter =
                new IntentFilter(
                        ACTION_CONNECTION_QUALITY
                );

        LocalBroadcastManager
                .getInstance(this)
                .registerReceiver(
                        connectionQualityReceiver,
                        connectionQualityFilter
                );
    }


    @Override
    public void onDestroy() {
        this.leave();
        instance = null;
        // JitsiMeetOngoingConferenceService.abort(this);
        LocalBroadcastManager.getInstance(this).unregisterReceiver(broadcastReceiver);
        LocalBroadcastManager.getInstance(this).unregisterReceiver(broadcastScreenShearReceiver);
        LocalBroadcastManager.getInstance(this).unregisterReceiver(broadcastScreenShearRemoteSizeReceiver);
        LocalBroadcastManager.getInstance(this).unregisterReceiver(connectionQualityReceiver);
        unregisterReceiver(commentReceiver);
        NotificationUtils.stopOutgoingRing();
        // JitsiMeetBroadcastUtils.endMeeting(this);
        // JitsiMeetActivityDelegate.onHostDestroy(this);
        //  jitsiMeetView.dispose();
        super.onDestroy();
    }


    void getParticipantsInfoRetrievedBroadcast() {
        Intent mIntent = new Intent("org.jitsi.meet.RETRIEVE_PARTICIPANTS_INFO");
        mIntent.putExtra("requestId", System.currentTimeMillis() + "");
        LocalBroadcastManager.getInstance(this).sendBroadcast(mIntent);
    }

    private void onBroadcastReceived(Intent intent) {
        if (intent != null) {
            BroadcastEvent event = new BroadcastEvent(intent);
            switch (event.getType()) {
                case CONFERENCE_WILL_JOIN:
                {
                    if (mActivityCustomJitsiMeetBinding != null) {
                        mActivityCustomJitsiMeetBinding.loading.setVisibility(View.GONE);
                    }
                    break;
                }
                case CONFERENCE_JOINED: {

                    new Handler(Looper.getMainLooper()).postDelayed(() -> {
                        getParticipantsInfoRetrievedBroadcast();
                        mActivityCustomJitsiMeetBinding.llUserActions.setVisibility(View.VISIBLE);
                        this.onConferenceJoined(event.getData());
                        isCallRunning = true;

                        // ==========================================
                        // START CONNECTION QUALITY MONITORING
                        // ==========================================
                        startConnectionQualityMonitoring();

                        sharedPreferences = getApplicationContext().getSharedPreferences("Jitsiuser", MODE_PRIVATE);
                        String IspluginClick = sharedPreferences.getString("IsPluginClick","false");
                        if(!IspluginClick.equalsIgnoreCase("true"))
                        {
                            new Handler(Looper.getMainLooper()).postDelayed(() -> {
                                forceSelfViewFullScreen();
                                mActivityCustomJitsiMeetBinding.jitsiRequestChecklist.setVisibility(View.GONE);
                            }, 5000);
                        }
                    }, 1000);



                    break;
                }
                case CONFERENCE_TERMINATED: {

                    // ==========================================
                    // STOP CONNECTION QUALITY MONITORING
                    // ==========================================
                    stopConnectionQualityMonitoring();


                    isCallRunning = false;
                    mActivityCustomJitsiMeetBinding.llUserActions.setVisibility(View.GONE);
                    JitsiMeetBroadcastUtils.endMeeting(this);
                    this.onConferenceTerminated(event.getData());
                    isScreenSharingActive = false;
                    sharedPreferences = getApplicationContext().getSharedPreferences("Jitsiuser", MODE_PRIVATE);
                    SharedPreferences.Editor  editor = sharedPreferences.edit();
                    editor.clear().commit();

                    break;
                }
                case PARTICIPANTS_INFO_RETRIEVED: {
                    this.onParticipantsInfoRetrieved(event.getData());

                    break;
                }
                case PARTICIPANT_JOINED: {
                    NotificationUtils.stopOutgoingRing();
                    getParticipantsInfoRetrievedBroadcast();
                    this.onParticipantJoined(event.getData());
                    break;
                }
                case PARTICIPANT_LEFT: {
                    // getParticipantsInfoRetrievedBroadcast();
                    this.onParticipantLeft(event.getData());
                    break;
                }
                case SCREEN_SHARE_TOGGLED: {
                    boolean isSharing = Boolean.parseBoolean(String.valueOf(event.getData().get("sharing")));
                    isScreenSharingActive = isSharing;
                    this.onScreenShareToggled(event.getData());
                    break;
                }
                case  CONFERENCE_BLURRED: {
                    mActivityCustomJitsiMeetBinding.llUserActions.setVisibility(View.GONE);
                    break;
                }
                case  CONFERENCE_FOCUSED: {
                    mActivityCustomJitsiMeetBinding.llUserActions.setVisibility(View.VISIBLE);
                    break;
                }

                case CHAT_MESSAGE_RECEIVED: {
                    Map<String, Object> data = event.getData();

                    if (data != null) {
                        String senderId = (String) data.get("senderId");

                        if (senderId != null && !senderId.equals(localParticipantId)) {
                            startRingtone(CustomJitsiMeetActivity.this);
                        }
                    }
                    break;
                }
                case READY_TO_CLOSE: {
                    isCallRunning = false;
                    JitsiMeetBroadcastUtils.endMeeting(this);
                    NotificationUtils.stopOutgoingRing();
                    this.onReadyToClose();
                    mIncomingCallActivity = new IncomingCallActivity();
                    mIncomingCallActivity.finishActivity();
                    isScreenSharingActive = false;
                    sharedPreferences = getApplicationContext().getSharedPreferences("Jitsiuser", MODE_PRIVATE);
                    SharedPreferences.Editor  editor = sharedPreferences.edit();
                    editor.clear().commit();

                    sharedPreferences = getApplicationContext().getSharedPreferences("Jitsi_roomname", MODE_PRIVATE);
                    SharedPreferences.Editor  meditor = sharedPreferences.edit();
                    meditor.clear().commit();

                    sharedPreferences = getApplicationContext().getSharedPreferences("Jitsiscreen",MODE_PRIVATE);
                    SharedPreferences.Editor mEditor1 = sharedPreferences.edit();
                    mEditor1.clear().commit();

                    Intent rejectIntent = new Intent(CustomJitsiMeetActivity.this, JitsiPluginBroadcast.class);
                    rejectIntent.setAction(Utils.BroadcastAction.JITSI_CALL_STOP_Action);
                    rejectIntent.putExtras(extras);
                    sendBroadcast(rejectIntent);

                }

            }
        }
    }
    private void forceSelfViewFullScreen() {
        try {
            View root = getWindow().getDecorView();

            View target = findSelfView(root);

            if (target != null) {
                Log.d("JITSI_FIX", "Self view found, clicking...");
                target.performClick();
            } else {
                Log.e("JITSI_FIX", "Self view NOT found");
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private View findSelfView(View view) {

        if (view == null) return null;

        // 🔥 More flexible condition
        if (view.getWidth() > 100 && view.getWidth() < 500
                && view.getHeight() > 100 && view.getHeight() < 500
                && view.isClickable()) {

            return view;
        }

        if (view instanceof ViewGroup) {
            ViewGroup group = (ViewGroup) view;
            for (int i = 0; i < group.getChildCount(); i++) {
                View result = findSelfView(group.getChildAt(i));
                if (result != null) return result;
            }
        }

        return null;
    }
    public void startRingtone(Context context) {
        if (chatSound != null && chatSound.isPlaying()) return;

        try {
            Uri soundUri = Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE + "://" +
                    context.getPackageName() + "/" + R.raw.msgtone);

            chatSound = new MediaPlayer();
            chatSound.setDataSource(context, soundUri);
            chatSound.prepare();
            chatSound.start();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
    protected void onParticipantLeft(HashMap<String, Object> extraData) {
        try {
            JSONObject info = new JSONObject(extraData);
            String id = info.getString("participantId");
            String username = null;

            // Step 1: Remove from participantList and get username
            Iterator<Participant> iterator = participantList.iterator();
            while (iterator.hasNext()) {
                Participant participant = iterator.next();
                if (participant.getParticipantId().equals(id)) {
                    username = participant.getName(); // Save username for later
                    iterator.remove(); // Remove from list
                    break;
                }
            }

            if (username != null && MultiChoiceDialogFragment.inviteListItems != null) {
                for (InviteListItem item : MultiChoiceDialogFragment.inviteListItems) {
                    if (item.getUser() != null &&
                            item.getUser().getUsername().equalsIgnoreCase(username) &&
                            item.isAlreadyInvited()) {
                        item.setStatus("Not Joined");
                        break;
                    }
                }

                if (MultiChoiceDialogFragment.adapter != null) {
                    MultiChoiceDialogFragment.adapter.notifyDataSetChanged();
                }

            }

        } catch (Exception e) {
            JitsiMeetLogger.w("Invalid participant left extraData", new Object[]{e});
        }
    }

//    @Override
//    public void onBackPressed() {
//      //  JitsiMeetBroadcastUtils.endMeeting(this);
//        super.onBackPressed();
//    }

    Participant requiredParticipant = null;

    protected void onScreenShareToggled(HashMap<String, Object> extraData) {
        try {
            JSONObject info = new JSONObject(extraData);
            String id = info.getString("participantId");
            String screenSharing = info.getString("sharing");
            Participant checkLocalParticipant = null;
            for (Participant participant : participantList) {
                if (participant.getParticipantId().matches(id)) {
                    checkLocalParticipant = participant;
                    break;
                }
            }
            if (checkLocalParticipant != null) {
                if (checkLocalParticipant.getIsLocal().matches("true") && screenSharing.matches("true")) {
                    mActivityCustomJitsiMeetBinding.llUserActions.setVisibility(View.GONE);
                    startActivityForDraw();
//                    OpeActivity opeActivity = new OpeActivity();
//                    opeActivity.execute();
                } else if (checkLocalParticipant.getIsLocal().matches("true") && !screenSharing.matches("true")) {
                    mActivityCustomJitsiMeetBinding.llUserActions.setVisibility(View.VISIBLE);
                } else if (screenSharing.matches("true") && requiredParticipant != null && screenShearEasyFromUserList != null) {
                    mActivityCustomJitsiMeetBinding.llUserActions.setVisibility(View.GONE);
                    ArDrawingUtils.isDrawingEnable = true;
                    mActivityCustomJitsiMeetBinding.flDrawOptions.setVisibility(View.VISIBLE);
                } else if (!screenSharing.matches("true")) {
                    mActivityCustomJitsiMeetBinding.llUserActions.setVisibility(View.VISIBLE);
                    ArDrawingUtils.isDrawingEnable = false;
                    mActivityCustomJitsiMeetBinding.flDrawOptions.setVisibility(View.GONE);
                    requiredParticipant = null;
                    screenShearEasyFromUserList = null;
                }
            }
            Timber.tag("ScreenShareToggled: ").d("id::: " + id + "  screenSharing::: " + screenSharing);
        } catch (Exception var3) {
            JitsiMeetLogger.w("ScreenShareToggled", new Object[]{var3});
        }
    }

    void startActivityForDraw() {
        String availabilityString = String.valueOf(availability);
        DisplayMetrics displayMetrics = new DisplayMetrics();
        getWindowManager().getDefaultDisplay().getMetrics(displayMetrics);
        int height = displayMetrics.heightPixels;
        int width = displayMetrics.widthPixels;
        int screenWidthIncludingNavBarPx;
        int screenHeightIncludingNavBarPx;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR1) {
            Point realScreenSize = new Point();
            getWindowManager().getDefaultDisplay().getRealSize(realScreenSize);

            int statusBarHeight = 0;
            int resourceId = getResources().getIdentifier("status_bar_height", "dimen", "android");
            if (resourceId > 0) {
                statusBarHeight = getResources().getDimensionPixelSize(resourceId);
            }

            screenWidthIncludingNavBarPx = realScreenSize.x;
            screenHeightIncludingNavBarPx = realScreenSize.y;

            // Print the screen resolution including the navigation bar
            Log.d("Screen Resolution", "Width: " + screenWidthIncludingNavBarPx + "px, Height: " + screenHeightIncludingNavBarPx + "px");
        } else {
            // For devices with lower versions, the screen size is the same as the display metrics
            screenWidthIncludingNavBarPx = width;
            screenHeightIncludingNavBarPx = height;

            // Print the screen resolution including the navigation bar
            Log.d("Screen Resolution", "Width: " + screenWidthIncludingNavBarPx + "px, Height: " + screenHeightIncludingNavBarPx + "px");
        }


        String dHeight = screenHeightIncludingNavBarPx + "";//(sharedPreferences.getString("Height", "320"));
        String dWidth = screenWidthIncludingNavBarPx + "";// (sharedPreferences.getString("Width", "240"));

        boolean isNotificationSent = false;
        if (!isNotificationSent) {
            mCustomJitsiMeetViewModel.sendNotificationScreenSize(extras, dHeight, dWidth,CustomJitsiMeetActivity.this);
            isNotificationSent = true;

        }
        Handler mainHandler = new Handler();
        mainHandler.postDelayed(() -> {
            if (availabilityString.equalsIgnoreCase("SUPPORTED_INSTALLED")) {
//                Intent ArDrawIntent = new Intent(this, ARDrawActivity.class)
//                        .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
//                        .putExtra("width", dWidth)
//                        .putExtra("height", dHeight);
//                startActivity(ArDrawIntent);
                Intent cameraIntent = new Intent(this, CameraPreviewActivity.class)
                        .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
                        .putExtra("width", dWidth)
                        .putExtra("height", dHeight)
                        .putExtra("Bundle_extras", extras);
                startActivity(cameraIntent);

            } else {
                Intent cameraIntent = new Intent(this, CameraPreviewActivity.class)
                        .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
                        .putExtra("width", dWidth)
                        .putExtra("height", dHeight)
                        .putExtra("Bundle_extras", extras);
                startActivity(cameraIntent);
            }
        }, 1000);
    }


    protected void onParticipantsInfoRetrieved(HashMap<String, Object> extraData) {
        try {
            JSONObject info = new JSONObject(extraData);
            String data = info.getString("participantsInfo");
            String listData = data;
            JSONArray participantsInfoArr = new JSONArray();

            while (!listData.isEmpty()) {
                int startIndex = listData.indexOf("{");
                if (startIndex == -1) break;

                int endIndex = listData.indexOf("}") + 1;
                JSONObject jsonObject = new JSONObject();
                String substring = listData.substring(startIndex, endIndex);
                String[] keyValue = substring.substring(1, substring.length() - 1).split(",");

                for (String item : keyValue) {
                    String[] itemData = item.split("=");
                    if (itemData.length == 2) {
                        jsonObject.put(itemData[0].trim(), itemData[1].trim());
                    }
                }

                participantsInfoArr.put(jsonObject);

                if (endIndex != (listData.length())) {
                    listData = listData.substring(endIndex);
                } else {
                    listData = "";
                }
            }

            Type listType = new TypeToken<List<Participant>>() {}.getType();
            List<Participant> participantList  = mGson.fromJson(participantsInfoArr.toString(), listType);

            for (Participant participant : participantList ) {
                if (!this.participantList.contains(participant)) {
                    this.participantList.add(participant);
                }
            }
            localParticipantId = participantList .get(0).getParticipantId();
            Timber.tag("ParticipantsInfo").d("Retrieved:===>  " + participantList .toString());


            if (MultiChoiceDialogFragment.inviteListItems != null) {
                for (InviteListItem item : MultiChoiceDialogFragment.inviteListItems) {
                    if (item.getType() == InviteListItem.TYPE_USER) {
                        for (Participant participant : participantList ) {
                            String joinedUsername = participant.getName();

                            if (joinedUsername.equalsIgnoreCase(item.getUser().getUsername())) {


                                Runnable timeoutRunnable = MultiChoiceDialogFragment.pendingTimeoutTasks.get(joinedUsername);
                                if (timeoutRunnable != null) {
                                    MultiChoiceDialogFragment.handler.removeCallbacks(timeoutRunnable);
                                    MultiChoiceDialogFragment.pendingTimeoutTasks.remove(joinedUsername);
                                }


                                item.setStatus("Joined");
                                item.setAlreadyInvited(true);
                                break;
                            }
                        }
                    }
                }

                if (MultiChoiceDialogFragment.adapter != null) {
                    MultiChoiceDialogFragment.adapter.notifyDataSetChanged();
                }
            }

        } catch (Exception e) {
            JitsiMeetLogger.w("ParticipantsInfoRetrieved", e);
        }
    }


    public void pinSelf(String participantId) {
        Bundle data = new Bundle();
        data.putString("participantId", participantId);

        Intent intent = new Intent("org.jitsi.meet.EXECUTE_COMMAND");
        intent.putExtra("command", "pinParticipant");
        intent.putExtra("data", data);

        LocalBroadcastManager.getInstance(this).sendBroadcast(intent);
    }

    Gson mGson = new Gson();

    List<Participant> participantList = new ArrayList<>();

    void setDrawOptionsClicks() {
        mActivityCustomJitsiMeetBinding.stopShare.setOnClickListener(view -> {
            mActivityCustomJitsiMeetBinding.llUserActions.setVisibility(View.VISIBLE);
            ArDrawingUtils.isDrawingEnable = false;
            mActivityCustomJitsiMeetBinding.flDrawOptions.setVisibility(View.GONE);
            if (CustomJitsiMeetActivity.this.screenShearEasyFromUserList != null && !CustomJitsiMeetActivity.this.screenShearEasyFromUserList.isEmpty()) {
                mCustomJitsiMeetViewModel.sendNotificationScreenShear(extras, CustomJitsiMeetActivity.this.screenShearEasyFromUserList, false,CustomJitsiMeetActivity.this);
                CustomJitsiMeetActivity.this.screenShearEasyFromUserList = null;
            }
        });
        isScreenSharingActive = false;
        mActivityCustomJitsiMeetBinding.drawMenu.setOnClickListener(view -> showBottomSheet());
    }

    void setUserActionClicks() {

            mActivityCustomJitsiMeetBinding.jitsiInvite.setOnClickListener(view -> {

                if (easyFromUserItemList == null || easyFromUserItemList.isEmpty()) {
                    offset = 0;
                    hasMoreData = true;
                    CustomJitsiMeetViewModel.getUserDataFromCompanyId(extras, offset, fetch);
                }

                Handler handler = new Handler(Looper.getMainLooper());
                handler.postDelayed(() -> {
                    if (easyFromUserItemList != null && !easyFromUserItemList.isEmpty()) {

                        List<EasyFromUser> allEasyFromUserList = new ArrayList<>();
                        for (EasyFromUser easyFromUser : easyFromUserItemList.get(0).getData()) {
                            boolean isOnmeeting = false;
                            for (Participant participant : participantList) {
                                if (participant.getName().equalsIgnoreCase(easyFromUser.getUsername()) && participant.getIsLocal().matches("true") ) {
                                    isOnmeeting = true;
                                    break;
                                }
                            }
                            if (!isOnmeeting) {
                                if (!allEasyFromUserList.contains(easyFromUser)) {
                                    allEasyFromUserList.add(easyFromUser);
                                }
                            }
                        }
                        MultiChoiceDialogFragment multiChoiceDialogFragment = new MultiChoiceDialogFragment("Invite", allEasyFromUserList,participantList, true,extras, new MultiChoiceDialogFragment.MultiChoiceDialogFragmentResult() {
                            @Override
                            public void onMultiChoiceResult(List<EasyFromUser> easyFromUserList) {
                                CustomJitsiMeetActivity.this.screenShearEasyFromUserList = allEasyFromUserList;
                                mCustomJitsiMeetViewModel.sendNotificationInviteToCall(extras, easyFromUserList,CustomJitsiMeetActivity.this);
                            }

                            @Override
                            public void onDismissed() {

                            }
                        });
                        multiChoiceDialogFragment.show(getSupportFragmentManager(), "MultiChoiceDialogFragment");
                    }
                }, 500);


            });

            mActivityCustomJitsiMeetBinding.jitsiRequestScreenShare.setOnClickListener(view -> {
                if (easyFromUserItemList != null && !easyFromUserItemList.isEmpty()) {

                    List<EasyFromUser> allEasyFromUserList = new ArrayList<>();
                    for (EasyFromUser easyFromUser : easyFromUserItemList.get(0).getData()) {
                        boolean isOnmeeting = false;
                        for (Participant participant : participantList) {
                            if (participant.getName().equalsIgnoreCase(easyFromUser.getUsername()) && !participant.getIsLocal().matches("true") && !easyFromUser.getDeviceType().matches("Web")) {
                                isOnmeeting = true;
                                break;
                            }
                        }
                        if (isOnmeeting) {
                            if (!allEasyFromUserList.contains(easyFromUser)) {
                                allEasyFromUserList.add(easyFromUser);
                            }
                        }
                    }
                    if (allEasyFromUserList.isEmpty()) {
                        new Handler(Looper.getMainLooper()).post(() -> {
                            Toast.makeText(getApplicationContext(), "No users for screen sharing.", Toast.LENGTH_SHORT).show();
                        });

                    } else {
                        for (Participant participant : participantList) {
                            if (participant.getIsLocal().matches("true")) {
                                requiredParticipant = participant;
                                break;
                            }
                        }

                        MultiChoiceDialogFragment multiChoiceDialogFragment = new MultiChoiceDialogFragment("ScreenShare Request", allEasyFromUserList,participantList, false,extras, new MultiChoiceDialogFragment.MultiChoiceDialogFragmentResult() {
                            @Override
                            public void onMultiChoiceResult(List<EasyFromUser> easyFromUserList) {
                                Timber.tag("multiChoiceDialogFragment").d("Seleted data:===>  " + easyFromUserList.toString());
                                CustomJitsiMeetActivity.this.screenShearEasyFromUserList = allEasyFromUserList;
                                mCustomJitsiMeetViewModel.sendNotificationScreenShear(extras, allEasyFromUserList, true,CustomJitsiMeetActivity.this);

                                mActivityCustomJitsiMeetBinding.llUserActions.setVisibility(View.GONE);
                                ArDrawingUtils.isDrawingEnable = true;
                                mActivityCustomJitsiMeetBinding.flDrawOptions.setVisibility(View.VISIBLE);
                            }

                            @Override
                            public void onDismissed() {

                                requiredParticipant = null;
                            }
                        });
                        multiChoiceDialogFragment.show(getSupportFragmentManager(), "MultiChoiceDialogFragment");
                    }
                }
            });


        mActivityCustomJitsiMeetBinding.jitsiRequestPiP.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {

                    PictureInPictureParams.Builder builder =
                            new PictureInPictureParams.Builder();

                    // Optional: set aspect ratio (16:9)
                    builder.setAspectRatio(new Rational(16, 9));

                    enterPictureInPictureMode(builder.build());
                }
            }
        });



        mActivityCustomJitsiMeetBinding.jitsiRequestChecklist.setVisibility(View.VISIBLE);
        mActivityCustomJitsiMeetBinding.jitsiRequestChecklist.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                String loginUserDataString = extras.getString(Utils.BroadcastActionExtrasKeys.LOGIN_USER_DATA, "");
                String otherDataString = extras.getString(Utils.BroadcastActionExtrasKeys.OTHER_DATA, "");
                OtherData mOtherData = mGson.fromJson(otherDataString, OtherData.class);
                UserData mUserData= mGson.fromJson(loginUserDataString,UserData.class);

                show_CheecksheetList(mUserData,mOtherData);
               // capturePhoto();
            }
        });

    }


    //ShowBottomSheet
    public void showBottomSheet() {

        int[] items = new int[]{
                R.string.ges,
                R.string.arrow,
                R.string.textfields,
                R.string.imagearrow,
                R.string.screenshot,
                R.string.videorecording,
                R.string.flash,
                R.string.switchcamera,
                R.string.camerazoomout,
                R.string.camerazoomIn,
                R.string.zoomclear,
        };

        int[] icons = new int[]{
                R.drawable.ic_draw_gesture_foreground,
                R.drawable.ic_draw_arrow_foreground,
                R.drawable.ic_draw_text_foreground,
                R.drawable.ic_draw_imagearrow_foreground,
                R.drawable.screenshot,
                R.drawable.video_on,
                R.drawable.flash_on,
                R.drawable.front_camera,
                R.drawable.zoom_out,
                R.drawable.zoom_in,
                R.drawable.zoom_clear,

        };

        BottomSheet.Builder builder = new BottomSheet.Builder(CustomJitsiMeetActivity.this);
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

        sharedPreferences = getApplicationContext().getSharedPreferences("Jitsiscreen", MODE_PRIVATE);
        SharedPreferences.Editor  editor = sharedPreferences.edit();
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
        if (i == 4) {

            item = "Screen shot";
        }
        if (i == 5) {

            item = "Video Recording Start";
        }

        if(i == 6)
        {
            item = "Flash On";
        }

        if(i == 7)
        {
            item = "Switch Camera";
        }
        if(i == 8)
        {
            item = "Camera zoom out";
        }
        if(i == 9)
        {
            item = "Camera zoom In";
        }
        if(i == 10)
        {
            item = "zoom clear";
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
        else if(item.equalsIgnoreCase("Screen shot"))
        {
            String loginUserDataString = extras.getString(Utils.BroadcastActionExtrasKeys.LOGIN_USER_DATA, "");
            String otherDataString = extras.getString(Utils.BroadcastActionExtrasKeys.OTHER_DATA, "");
            OtherData mOtherData = mGson.fromJson(otherDataString, OtherData.class);
            UserData mUserData= mGson.fromJson(loginUserDataString,UserData.class);

            if(mOtherData.getServer_task_id().equalsIgnoreCase("") || mOtherData.getServer_task_id().equalsIgnoreCase("0"))
            {
                String JsonData = "";
                CameraPreviewActivity.takescreenshot(JsonData);
            }
            else {
                show_CheecksheetList(mUserData,mOtherData);
            }
        }
        else if(item.equalsIgnoreCase("Flash On"))
        {
            String flash = sharedPreferences.getString("flash","On");
            if(flash.equalsIgnoreCase("On"))
            {
                try{
                    JSONArray mJsonArray = new JSONArray();
                    mJsonArray.put("On");
                    JSONObject jsonObject = new JSONObject();
                    jsonObject.put("flash", mJsonArray);

                    mCustomJitsiMeetViewModel.sendNotificationScreenShearDrawData(extras, screenShearEasyFromUserList, "flash", jsonObject.toString(),CustomJitsiMeetActivity.this);
                    editor.putString("flash","off");
                    editor.apply();
                }
                catch (Exception e)
                {

                }
            }
            else {
                try{
                    JSONArray mJsonArray = new JSONArray();
                    mJsonArray.put("off");
                    JSONObject jsonObject = new JSONObject();
                    jsonObject.put("flash", mJsonArray);

                    mCustomJitsiMeetViewModel.sendNotificationScreenShearDrawData(extras, screenShearEasyFromUserList, "flash", jsonObject.toString(),CustomJitsiMeetActivity.this);
                    editor.putString("flash","on");
                    editor.apply();
                }
                catch (Exception e)
                {

                }
            }

        }



        else if(item.equalsIgnoreCase("Video Recording Start"))
        {
            String video_recording = sharedPreferences.getString("video_recording","start");
            if(video_recording.equalsIgnoreCase("start"))
            {
                try{
                    JSONArray mJsonArray = new JSONArray();
                    mJsonArray.put("start");
                    JSONObject jsonObject = new JSONObject();
                    jsonObject.put("video_recording", mJsonArray);

                    mCustomJitsiMeetViewModel.sendNotificationScreenShearDrawData(extras, screenShearEasyFromUserList, "video_recording", jsonObject.toString(),CustomJitsiMeetActivity.this);
                    editor.putString("video_recording","stop");
                    editor.apply();
                }
                catch (Exception e)
                {

                }
            }
            else {
                try{
                    JSONArray mJsonArray = new JSONArray();
                    mJsonArray.put("stop");
                    JSONObject jsonObject = new JSONObject();
                    jsonObject.put("video_recording", mJsonArray);

                    mCustomJitsiMeetViewModel.sendNotificationScreenShearDrawData(extras, screenShearEasyFromUserList, "video_recording", jsonObject.toString(),CustomJitsiMeetActivity.this);
                    editor.putString("video_recording","start");
                    editor.apply();
                }
                catch (Exception e)
                {

                }
            }

        }

        else if(item.equalsIgnoreCase("Switch Camera"))
        {
            String flip_camera = sharedPreferences.getString("flip_camera","front");
            if(flip_camera.equalsIgnoreCase("front"))
            {
                try{
                    JSONArray mJsonArray = new JSONArray();
                    mJsonArray.put("front");
                    JSONObject jsonObject = new JSONObject();
                    jsonObject.put("flip_camera", mJsonArray);

                    mCustomJitsiMeetViewModel.sendNotificationScreenShearDrawData(extras, screenShearEasyFromUserList, "flip_camera", jsonObject.toString(),CustomJitsiMeetActivity.this);
                    editor.putString("flip_camera","back");
                    editor.apply();

                }
                catch (Exception e)
                {

                }
            }
            else {
                try{
                    JSONArray mJsonArray = new JSONArray();
                    mJsonArray.put("back");
                    JSONObject jsonObject = new JSONObject();
                    jsonObject.put("flip_camera", mJsonArray);

                    mCustomJitsiMeetViewModel.sendNotificationScreenShearDrawData(extras, screenShearEasyFromUserList, "flip_camera", jsonObject.toString(),CustomJitsiMeetActivity.this);
                    editor.putString("flip_camera","front");
                    editor.apply();

                }
                catch (Exception e)
                {

                }
            }

        }

        else if(item.equalsIgnoreCase("Camera zoom out"))
        {
            try{
                JSONArray mJsonArray = new JSONArray();
                mJsonArray.put("");
                JSONObject jsonObject = new JSONObject();
                jsonObject.put("zoom_out", mJsonArray);

                mCustomJitsiMeetViewModel.sendNotificationScreenShearDrawData(extras, screenShearEasyFromUserList, "zoom_out", jsonObject.toString(),CustomJitsiMeetActivity.this);

            }
            catch (Exception e)
            {

            }
        }

        else if(item.equalsIgnoreCase("Camera zoom In"))
        {
            try{
                JSONArray mJsonArray = new JSONArray();
                mJsonArray.put("");
                JSONObject jsonObject = new JSONObject();
                jsonObject.put("zoom_in", mJsonArray);

                mCustomJitsiMeetViewModel.sendNotificationScreenShearDrawData(extras, screenShearEasyFromUserList, "zoom_in", jsonObject.toString(),CustomJitsiMeetActivity.this);

            }
            catch (Exception e)
            {

            }
        }
        else if(item.equalsIgnoreCase("zoom clear"))
        {
            try{
                JSONArray mJsonArray = new JSONArray();
                mJsonArray.put("");
                JSONObject jsonObject = new JSONObject();
                jsonObject.put("zoom_original", mJsonArray);

                mCustomJitsiMeetViewModel.sendNotificationScreenShearDrawData(extras, screenShearEasyFromUserList, "zoom_original", jsonObject.toString(),CustomJitsiMeetActivity.this);

            }
            catch (Exception e)
            {

            }
        }
    }

    private void showArrowAlertDialog() {


        final String[] selectedImage = {""};
        final String[] selectedColor = {""};

        // custom dialog
        final Dialog dialog = new Dialog(CustomJitsiMeetActivity.this);
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

//    @Override
//    public void onStop() {
//        super.onStop();
//        JitsiMeetActivityDelegate.onHostPause(this);
//
//    }

    @RequiresApi(api = Build.VERSION_CODES.TIRAMISU)
    @SuppressLint({"UnspecifiedRegisterReceiverFlag", "WrongConstant"})
    public void onResume() {
        super.onResume();
        JitsiMeetActivityDelegate.onHostResume(this);

        mActivityCustomJitsiMeetBinding.jitsiRequestScreenShare.setVisibility(View.GONE);
        mActivityCustomJitsiMeetBinding.jitsiInvite.setVisibility(View.GONE);
        registerReceiver(commentReceiver, new IntentFilter("com.easyform.newjitsi.activitys.jitsimeet.COMMENT_NOTIFICATION"),RECEIVER_EXPORTED);

    }

    public class OpeActivity extends AsyncTask<Void, Void, Void> {
        String availabilityString;
        int height;
        int width;
        String dHeight;
        String dWidth;

        @Override
        protected Void doInBackground(Void... voids) {
            availabilityString = String.valueOf(availability);
            DisplayMetrics displayMetrics = new DisplayMetrics();
            getWindowManager().getDefaultDisplay().getMetrics(displayMetrics);
            height = displayMetrics.heightPixels;
            width = displayMetrics.widthPixels;
            dHeight = height + "";//(sharedPreferences.getString("Height", "320"));
            dWidth = width + "";// (sharedPreferences.getString("Width", "240"));
            boolean isNotificationSent = false;
            if (!isNotificationSent) {
                mCustomJitsiMeetViewModel.sendNotificationScreenSize(extras, dHeight, dWidth,CustomJitsiMeetActivity.this);
                isNotificationSent = true;

            }

            return null;
        }

        @Override
        protected void onPostExecute(Void aVoid) {
            Handler mainHandler = new Handler();
            mainHandler.postDelayed(() -> {
                if (availabilityString.equalsIgnoreCase("SUPPORTED_INSTALLED")) {
                    Intent ArDrawIntent = new Intent(CustomJitsiMeetActivity.this, ARDrawActivity.class)
                            .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
                            .putExtra("width", dWidth)
                            .putExtra("height", dHeight);
                    startActivity(ArDrawIntent);

                } else {
                    Intent cameraIntent = new Intent(CustomJitsiMeetActivity.this, CameraPreviewActivity.class)
                            .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
                            .putExtra("width", dWidth)
                            .putExtra("height", dHeight);
                    startActivity(cameraIntent);
                }
            }, 1000);
        }
    }

    @Override
    public void onPictureInPictureModeChanged(boolean isInPictureInPictureMode) {
        super.onPictureInPictureModeChanged(isInPictureInPictureMode);

        Log.d(TAG, "Is in picture-in-picture mode: " + isInPictureInPictureMode);
        if (isInPictureInPictureMode) {
            // Hide your bottom UI
            findViewById(R.id.jitsiRequestPiP).setVisibility(View.GONE);
        } else {
            // Show UI again
            findViewById(R.id.jitsiRequestPiP).setVisibility(View.VISIBLE);
        }
    }


    @Override
    public void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (resultCode == RESULT_OK && data != null) {
            Log.d("ScreenShare", "User clicked START NOW");
            // No need to handle; Jitsi will trigger SCREEN_SHARE_TOGGLED broadcast
            isScreenSharingActive = true;
            Log.d("JitsiScreenShare", "Screen sharing started");
        } else {
            Log.d("ScreenShare", "User clicked CANCEL on screen share");
            boolean isNotificationSent = false;
            isScreenSharingActive = false;
            if (!isNotificationSent) {
                mCustomJitsiMeetViewModel.sendNotificationScreenShearStop(extras, false,CustomJitsiMeetActivity.this);
                isNotificationSent = true;
            }
        }
        if (webDialogFragment != null && webDialogFragment.cordovaWebView != null) {
            webDialogFragment.cordovaInterface.onActivityResult(requestCode, resultCode, data);
        }


    }

    List<ChecklistItem> Checksheetnamelist;
    public void show_CheecksheetList(UserData mUserData,OtherData mOtherData)

    {
        try{

            JSONObject mJsonObject = new JSONObject();
            mJsonObject.put("Company_Id",mUserData.getCompanyId());
            mJsonObject.put("User_Id",mOtherData.getUser_id());
            mJsonObject.put("moduleid",mOtherData.getFlow_id());
            mJsonObject.put("siteid",mOtherData.getSite_id());
            mJsonObject.put("server_task_id",mOtherData.getServer_task_id());
            mJsonObject.put("role_id",mOtherData.getRole_id());

            String responsetxt =  WebApiCallJitsiMeet.ExecuteNetworkRequest(mJsonObject,mOtherData.getCommon_Wcf_Url(),METHOD_NAME_GetCheekshet,mUserData);

            if(responsetxt != null)
            {
                String status = null;
                String message = null;
                JSONArray jsonArray1 = new JSONArray(responsetxt);

                Checksheetnamelist = new ArrayList<>();
                for (int k = 0; k < jsonArray1.length(); k++) {
                    JSONObject jsonObject = jsonArray1.getJSONObject(0);
                    status = jsonObject.getString("status");
                    message = jsonObject.getString("message");

                    if(status.equalsIgnoreCase("1"))
                    {
                        String DataArray = jsonObject.getString("data");

                        if(DataArray == null || DataArray.equalsIgnoreCase(""))
                        {
                            Toast.makeText(CustomJitsiMeetActivity.this, "Flow not found!", Toast.LENGTH_SHORT).show();

                        }
                        else {
                            int found = 0;
                            String start_status = "";
                            JSONArray mJsonArray = new JSONArray(DataArray);

                            for (int i = 0; i < mJsonArray.length(); i++) {
                                JSONObject mjsonObject = mJsonArray.getJSONObject(i);

                                JSONArray dataArray = mjsonObject.getJSONArray("data");

                                for (int j = 0; j < dataArray.length(); j++) {
                                    JSONObject dataItem = dataArray.getJSONObject(j);

                                    String checksheetId = dataItem.getString("checksheetid");
                                    String cName = dataItem.getString("c_name");

                                    if(checksheetId.equalsIgnoreCase("0"))
                                    {

                                    }
                                    else {

                                        start_status =  dataItem.getString("start_status");
                                        if(mOtherData.getStart_status().equalsIgnoreCase(start_status)) {
                                            found++;
                                            Checksheetnamelist.add(new ChecklistItem(cName, checksheetId, 0));
                                        }
                                    }
                                }

                                if(found == 0)
                                {
                                    showerrormsg("Checksheet mapping not found start status is" + start_status);
                                }
                            }

                            if (!Checksheetnamelist.isEmpty()) {
                                if(Checksheetnamelist.size() == 1)
                                {
                                    open_direct_checksheet(Checksheetnamelist,mUserData,mOtherData);
                                }
                                else {
                                    showChecklistDialog(Checksheetnamelist,mUserData,mOtherData);
                                }

                            } else {
                                Log.d("MainActivity", "No valid checklist items found.");
                            }
                        }
                    }

                    if (status.equalsIgnoreCase("3") || status.equalsIgnoreCase("5")){

                        Handler leftHandler = new Handler(Looper.getMainLooper());
                        String finalMessage = message;
                        leftHandler.post(new Runnable() {
                            @Override
                            public void run() {
                                Toast.makeText(context, "APi : " + METHOD_NAME_GetCheekshet + "\n" + finalMessage, Toast.LENGTH_SHORT).show();
                            }
                        });
                    }
                }
            }

        }
        catch (Exception e)
        {

        }
    }

    private void showerrormsg(String Msg) {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("Select Checklist");
        builder.setCancelable(false);
        builder.setMessage(Msg);

        builder.setPositiveButton("Close", null);
        builder.show();
    }
    private void showChecklistDialog(List<ChecklistItem> checklistItems,UserData mUserData,OtherData mOtherData) {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("Select Checklist");
        builder.setCancelable(false);
        // Convert list to array
        ChecklistItem[] itemsArray = checklistItems.toArray(new ChecklistItem[0]);

        builder.setAdapter(new ArrayAdapter<>(this, android.R.layout.simple_list_item_1, itemsArray),
                (dialog, which) -> {
                    ChecklistItem selectedItem = itemsArray[which];
                    String selectedChecksheetId = selectedItem.checksheetId;
                    String selectedChecksheetName = selectedItem.name;

                    Log.d("Dialog", "Selected: " + selectedChecksheetName + ", ID: " + selectedChecksheetId);


//                    WCF_GetCheckSheetData_Port(selectedChecksheetId,mUserData,mOtherData);

                    String taskId = mOtherData.getServer_task_id();
                    String Url = mOtherData.getClickAction();
                    String roleId = mOtherData.getRole_id();
                    String FlowId = mOtherData.getFlow_id();
                    String start_status = mOtherData.getStart_status();
                    String compnay_id = mUserData.getCompanyId();
                    String UserId = mUserData.getUserid();
                    String site_id = mOtherData.getSite_id();
                    String udf_id = mOtherData.getUdf_id();
                    String feature_id = mUserData.getCompanyFeatureId();
                    String dateformate = mUserData.getDateformate();

                    webDialogFragment = new WebDialogFragment(roleId, taskId,Url,FlowId,start_status,compnay_id,UserId,site_id,udf_id,feature_id,dateformate);
                    webDialogFragment.setCancelable(false);
                    webDialogFragment.show(getSupportFragmentManager(), "webDialog");

                });

        builder.setPositiveButton("Close", null);
        builder.show();
    }


    private void open_direct_checksheet(List<ChecklistItem> checklistItems,UserData mUserData , OtherData mOtherData)
    {
        String taskId = mOtherData.getServer_task_id();
        String Url = mOtherData.getClickAction();
        String roleId = mOtherData.getRole_id();
        String FlowId = mOtherData.getFlow_id();
        String start_status = mOtherData.getStart_status();
        String compnay_id = mUserData.getCompanyId();
        String UserId = mUserData.getUserid();
        String site_id = mOtherData.getSite_id();
        String udf_id = mOtherData.getUdf_id();
        String feature_id = mUserData.getCompanyFeatureId();
        String dateformate = mUserData.getDateformate();

        webDialogFragment = new WebDialogFragment(roleId, taskId,Url,FlowId,start_status,compnay_id,UserId,site_id,udf_id,feature_id,dateformate);
        webDialogFragment.setCancelable(false);
        webDialogFragment.show(getSupportFragmentManager(), "webDialog");
    }

    List<ChecklistItem> mChecklistItems;
    public void WCF_GetCheckSheetData_Port(String selectedChecksheetId,UserData mUserData , OtherData mOtherData)
    {

        try{
            JSONObject mJsonObject = new JSONObject();
            mJsonObject.put("Company_Id",mUserData.getCompanyId());
            mJsonObject.put("User_Id",mUserData.getUserid());
            mJsonObject.put("checksheetid",selectedChecksheetId);
            mJsonObject.put("step",1);
            mJsonObject.put("trip_id",0);

            String responsetxt =  WebApiCallJitsiMeet.ExecuteNetworkRequest(mJsonObject,mOtherData.getCommon_Wcf_Url(),METHOD_NAME_GetCheckSheetData,mUserData);

            if(responsetxt != null)
            {
                String status = null;
                String message = null;
                String MainDataArray = null;
                JSONArray jsonArray1 = new JSONArray(responsetxt);
                for (int k = 0; k < jsonArray1.length(); k++) {
                    JSONObject jsonObject = jsonArray1.getJSONObject(0);
                    status = jsonObject.getString("status");
                    message = jsonObject.getString("message");
                    mChecklistItems = new ArrayList<>();
                    if(status.equalsIgnoreCase("1"))
                    {
                        MainDataArray = jsonObject.getString("data");

                        if(MainDataArray != null)
                        {
                            JSONArray mJsonArray = new JSONArray(MainDataArray);

                            for (int i = 0; i < mJsonArray.length(); i++) {
                                JSONObject mjsonObject = mJsonArray.getJSONObject(i);
                                String Subdataarray = mjsonObject.getString("data");
                                JSONArray dataArray = new JSONArray(Subdataarray);

                                for (int j = 0; j < dataArray.length(); j++) {
                                    JSONObject dataItem = dataArray.getJSONObject(j);

                                    int Type = dataItem.getInt("type");

                                    if(Type == 7)
                                    {
                                        int que_id = dataItem.getInt("que_id");
                                        JSONArray propArray = dataItem.getJSONArray("prop");

                                        for (int p = 0; p < propArray.length(); p++) {
                                            JSONObject propObject = propArray.getJSONObject(p);

                                            String name = propObject.optString("name", "");
                                            if (!name.isEmpty()) {

                                                mChecklistItems.add(new ChecklistItem(name, selectedChecksheetId,que_id));
                                            }
                                        }
                                    }
                                }

                            }

                            if (!mChecklistItems.isEmpty()) {
                                showType7Dialog(mChecklistItems);
                            } else {
                                Log.d("MainActivity", "No valid checklist items found.");
                            }
                        }
                    }

                    if (status.equalsIgnoreCase("3") || status.equalsIgnoreCase("5")){

                        Handler leftHandler = new Handler(Looper.getMainLooper());
                        String finalMessage = message;
                        leftHandler.post(new Runnable() {
                            @Override
                            public void run() {
                                Toast.makeText(context, "APi : " + METHOD_NAME_GetCheekshet + "\n" + finalMessage, Toast.LENGTH_SHORT).show();
                            }
                        });
                    }
                }
            }

        }
        catch (Exception e)
        {

        }

    }

    private int selectedIndex = -1; // -1 = nothing selected yet

    private void showType7Dialog(List<ChecklistItem> checklistItems) {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("Select photo");
        builder.setCancelable(false);

        ChecklistAdapter adapter = new ChecklistAdapter(this, checklistItems);

        builder.setAdapter(adapter, (dialog, which) -> {
            ChecklistItem selectedItem = checklistItems.get(which);
            selectedIndex = which; // Update selected index

            // Create JSON to pass to screenshot
            try {
                JSONObject finalObject = new JSONObject();
                JSONArray mJsonArray = new JSONArray();
                JSONObject mJsonObject = new JSONObject();
                mJsonObject.put("checksheet_id", selectedItem.checksheetId);
                mJsonObject.put("que_id", selectedItem.que_id);
                mJsonArray.put(mJsonObject);
                finalObject.put("screenshot", mJsonArray);


                mCustomJitsiMeetViewModel.sendNotificationScreenShearDrawData(extras, screenShearEasyFromUserList, "screenshot", finalObject.toString(),CustomJitsiMeetActivity.this);

            } catch (Exception e) {
                e.printStackTrace();
            }
        });

        builder.setPositiveButton("Close", null);
        builder.show();
    }

    private class ChecklistAdapter extends ArrayAdapter<ChecklistItem> {

        public ChecklistAdapter(Context context, List<ChecklistItem> items) {
            super(context, android.R.layout.simple_list_item_1, items);
        }

        @NonNull
        @Override
        public View getView(int position, View convertView, @NonNull ViewGroup parent) {
            View view = super.getView(position, convertView, parent);
            TextView textView = (TextView) view.findViewById(android.R.id.text1);

            ChecklistItem item = getItem(position);
            if (item != null) {
                // Show ✔ sign if this item is selected
                if (position == selectedIndex) {
                    textView.setText("✔ " + item.name);
                } else {
                    textView.setText(item.name);
                }
            }

            return view;
        }
    }


    public void sendnotification(String jsondata)  {
       // mCustomJitsiMeetViewModel.sendNotificationScreenShearDrawData(extras, screenShearEasyFromUserList, "screenshot", jsondata.toString(),CustomJitsiMeetActivity.this);
//        mCustomJitsiMeetViewModel.sendNotificationforviewcapture(extras,  "screenshot", jsondata,CustomJitsiMeetActivity.this);

//        mCustomJitsiMeetViewModel.ScreenShots(context,extras);
        capturePhoto(CustomJitsiMeetActivity.getInstance(), jsondata);
    }

    private void exitPipAndShowFullScreen() {

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            if (isInPictureInPictureMode()) {
                Intent intent = new Intent(this, CustomJitsiMeetActivity.class);
                intent.addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
                startActivity(intent);
            }
        }
    }

    public static View findVideoView(View view) {
        if (view instanceof SurfaceView || view instanceof TextureView) {
            return view;
        }

        if (view instanceof ViewGroup) {
            ViewGroup group = (ViewGroup) view;
            for (int i = 0; i < group.getChildCount(); i++) {
                View result = findVideoView(group.getChildAt(i));
                if (result != null) return result;
            }
        }
        return null;
    }

    public static void capturePhoto(Activity activity,String JsonData) {
        new Handler(Looper.getMainLooper()).postDelayed(() -> {

            View rootView = activity.getWindow().getDecorView();

            View videoView = findVideoView(rootView);

            if (videoView == null) {
                Log.e("JITSI", "Video view not found!");
                return;
            }

            Bitmap bitmap = Bitmap.createBitmap(
                    videoView.getWidth(),
                    videoView.getHeight(),
                    Bitmap.Config.ARGB_8888
            );

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                if (videoView instanceof SurfaceView) {
                    PixelCopy.request((SurfaceView) videoView, bitmap, result -> {
                        if (result == PixelCopy.SUCCESS) {
                            saveToGallery(bitmap,JsonData);
                        }
                    }, new Handler(Looper.getMainLooper()));
                } else {
                    // TextureView fallback
                    Canvas canvas = new Canvas(bitmap);
                    videoView.draw(canvas);
                    saveToGallery(bitmap,JsonData);
                }
            }

        }, 1000); // wait for rendering
    }
    private static final Gson gson = new Gson();
    public static void saveToGallery(Bitmap bitmap,String jsonData) {
        String filename = "Jitsi_" + System.currentTimeMillis() + ".jpg";

        File dir = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES), "Jitsi");

        if (!dir.exists()) {
            dir.mkdirs();
        }

        File imageFile = new File(dir, filename);

        try {
            FileOutputStream fos = new FileOutputStream(imageFile);
            bitmap.compress(Bitmap.CompressFormat.JPEG, 100, fos);
            fos.flush();
            fos.close();

//            // ✅ Make visible in gallery
//            MediaScannerConnection.scanFile(
//                    context,
//                    new String[]{imageFile.getAbsolutePath()},
//                    new String[]{"image/jpeg"},
//                    null
//            );

            Toast.makeText(getInstance(), "Photo saved successfully", Toast.LENGTH_SHORT).show();
            // send notification when photo save to gallery
          //  CustomJitsiMeetViewModel customJitsiMeetViewModel = new CustomJitsiMeetViewModel();
          //  customJitsiMeetViewModel.sendNotificationforphotosave(mBundle,context);

            String otherDataString  = mBundle.getString(Utils.BroadcastActionExtrasKeys.OTHER_DATA, "");
            String  loginUserDataString  = mBundle.getString(Utils.BroadcastActionExtrasKeys.LOGIN_USER_DATA, "");
            String  pluginArgsString = mBundle.getString(Utils.BroadcastActionExtrasKeys.JITSI_MEETING_PLUGIN_ARGS, "");
            String notificationRemoteDataString = mBundle.getString(Utils.BroadcastActionExtrasKeys.NOTIFICATION_REMOTE_DATA, "");
            OtherData mOtherData = gson.fromJson(otherDataString, OtherData.class);
            UserData mUserData = gson.fromJson(loginUserDataString, UserData.class);

            if(!jsonData.equalsIgnoreCase("")) {
                Log.d("finalPath", imageFile.getAbsolutePath());
                Intent intent = new Intent("com.easyfrom.jitsi.SCREENSHOT_SAVED");
                intent.putExtra("screenshot_path", imageFile.getAbsolutePath());
                intent.putExtra("photo_name", filename);
                intent.putExtra("jsonData", jsonData);
                intent.putExtra("task_id", mOtherData.getServer_task_id());
                intent.putExtra("LOGIN_USER_DATA",loginUserDataString);
                intent.putExtra("OTHER_DATA",otherDataString);
                intent.putExtra("JITSI_MEETING_PLUGIN_ARGS",pluginArgsString);
                intent.putExtra("NOTIFICATION_REMOTE_DATA",notificationRemoteDataString);
                getContext().sendBroadcast(intent);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void showPoorConnectionToast() {

        long currentTime = System.currentTimeMillis();

        // Don't continuously show Toast
        if (currentTime - lastPoorConnectionToastTime < POOR_CONNECTION_TOAST_INTERVAL) {
            return;
        }

        lastPoorConnectionToastTime = currentTime;

        runOnUiThread(() -> {

            if (isFinishing() || isDestroyed()) {
                return;
            }
            Toast.makeText(
                    CustomJitsiMeetActivity.this,
                    "Your internet connection is poor",
                    Toast.LENGTH_LONG
            ).show();
        });
    }

    private void startConnectionQualityMonitoring() {

        if (connectionQualityMonitoring) {
            Log.d(
                    "JitsiConnectionQuality",
                    "Already monitoring"
            );
            return;
        }

        connectionQualityMonitoring = true;

        connectionQualityHandler = new Handler(Looper.getMainLooper());

        connectionQualityRunnable = new Runnable() {

            @Override
            public void run() {

                if (!connectionQualityMonitoring) {
                    return;
                }

                checkConnectionQuality();

                connectionQualityHandler.postDelayed(this, 3000);
            }
        };

        connectionQualityHandler.postDelayed(connectionQualityRunnable, 5000);

//        Log.d(
//                "JitsiConnectionQuality",
//                "Connection quality monitoring started"
//        );
    }
    private void stopConnectionQualityMonitoring() {

        connectionQualityMonitoring = false;

        if (connectionQualityHandler != null && connectionQualityRunnable != null) {

            connectionQualityHandler.removeCallbacks(connectionQualityRunnable);
        }

        connectionQualityHandler = null;
        connectionQualityRunnable = null;

        poorConnectionCount = 0;
        currentConnectionQuality = "unknown";

//        Log.d(
//                "JitsiConnectionQuality",
//                "Connection quality monitoring stopped"
//        );
    }
    private void checkConnectionQuality() {
        try {
            ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
            if (cm == null) return;

            boolean isPoor = false;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Network activeNetwork = cm.getActiveNetwork();
                if (activeNetwork == null) {
                    isPoor = true; // No network available
                } else {
                    NetworkCapabilities nc = cm.getNetworkCapabilities(activeNetwork);
                    if (nc == null || !nc.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                            || !nc.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)) {
                        isPoor = true; // Internet connection is invalid or limited
                    } else {
                        // Check downstream bandwidth (less than 500 Kbps is considered poor for video calls)
                        int downstreamKbps = nc.getLinkDownstreamBandwidthKbps();
                        if (downstreamKbps > 0 && downstreamKbps < 500) {
                            isPoor = true;
                        }
                    }
                }
            } else {
                NetworkInfo activeNetworkInfo = cm.getActiveNetworkInfo();
                if (activeNetworkInfo == null || !activeNetworkInfo.isConnected()) {
                    isPoor = true;
                }
            }

            if (isPoor) {
                poorConnectionCount++;
                if (poorConnectionCount >= REQUIRED_POOR_COUNT) {
                    currentConnectionQuality = "poor";
                    setVideoQuality(180);
                    showPoorConnectionToast(); // Lowers quality to 180p & shows alert

                }
            } else {
                // Connection recovered to good quality
                if ("poor".equals(currentConnectionQuality)) {
                    setVideoQuality(360); // Restore back to standard quality
                   // Toast.makeText(this, "Network restored: Video quality restored to standard", Toast.LENGTH_SHORT).show();
                }
                poorConnectionCount = 0;
                currentConnectionQuality = "good";
            }
        } catch (Exception e) {
            Log.e("JitsiConnectionQuality", "Error checking connection quality", e);
        }
    }

    private void setVideoQuality(int quality) {
        Intent intent = new Intent("org.jitsi.meet.SET_VIDEO_QUALITY");
        intent.putExtra("videoQuality", quality);
        LocalBroadcastManager.getInstance(this).sendBroadcast(intent);
        Log.d("JitsiConnectionQuality", "Video quality changed to: " + quality + "p");
    }

//    private AlertDialog poorConnectionDialog;
//    private boolean hasShownPoorConnectionAlert = false;


//    private void showPoorConnectionAlertDialog() {
//        // Show only 1 time during the entire call
//        if (hasShownPoorConnectionAlert) {
//            return;
//        }
//
//        runOnUiThread(() -> {
//            if (isFinishing() || isDestroyed()) return;
//
//            if (poorConnectionDialog != null && poorConnectionDialog.isShowing()) {
//                return;
//            }
//
//            hasShownPoorConnectionAlert = true; // Mark as shown
//
//            // Automatically lower video quality to 180p
//            setVideoQuality(180);
//
//            poorConnectionDialog = new AlertDialog.Builder(CustomJitsiMeetActivity.this)
//                    .setTitle("Poor Internet Connection")
//                    .setMessage("Your network signal is weak.Video resolution has been automatically lowered so participant voice stays clear.")
//                    .setPositiveButton("OK", (dialog, which) -> dialog.dismiss())
//                    .setCancelable(false)
//                    .create();
//
//            poorConnectionDialog.show();
//        });
//    }
}