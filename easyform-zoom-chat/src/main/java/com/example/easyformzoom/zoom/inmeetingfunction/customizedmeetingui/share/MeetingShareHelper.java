package com.example.easyformzoom.zoom.inmeetingfunction.customizedmeetingui.share;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.media.projection.MediaProjectionManager;
import android.os.Build;
import android.os.Handler;
import android.util.AttributeSet;
import android.util.Log;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.ListView;
import android.widget.PopupWindow;
import android.widget.TextView;
import android.widget.Toast;

import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import com.example.easyformzoom.zoom.firebase.NetworkCallZoomChat;
import com.example.easyformzoom.zoom.screenshare.EventUtils;
import com.google.ar.sceneform.samples.hellosceneform.HelloSceneformActivity;
import com.example.easyformzoom.R;
import com.example.easyformzoom.zoom.datautils.ListUsernameFId;
import com.example.easyformzoom.zoom.inmeetingfunction.customizedmeetingui.AndroidAppUtil;
import com.example.easyformzoom.zoom.inmeetingfunction.customizedmeetingui.MeetingShareHelperCallback;
import com.example.easyformzoom.zoom.inmeetingfunction.customizedmeetingui.MyMeetingActivity;
import com.example.easyformzoom.zoom.inmeetingfunction.customizedmeetingui.view.adapter.SimpleMenuAdapter;
import com.example.easyformzoom.zoom.inmeetingfunction.customizedmeetingui.view.adapter.SimpleMenuItem;
import com.example.easyformzoom.zoom.screenshare.ScreenShareListner;
import com.zipow.videobox.sdk.SDKShareView;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

import us.zoom.sdk.InMeetingService;
import us.zoom.sdk.InMeetingShareController;
import us.zoom.sdk.InMeetingUserInfo;
import us.zoom.sdk.MobileRTCSDKError;
import us.zoom.sdk.MobileRTCShareView;
import us.zoom.sdk.ZoomSDK;

import static com.zipow.videobox.confapp.ConfMgr.getApplicationContext;

public class MeetingShareHelper extends MobileRTCShareView implements ScreenShareListner {

    private final static String TAG = MeetingShareHelper.class.getSimpleName();

    private final int MENU_SHARE_SCREEN = 0;
    private final int MENU_SHARE_IMAGE = 1;
    private final int MENU_SHARE_WEBVIEW = 2;
    private final int MENU_WHITE_BOARD = 3;
    private final int MENU_SHARE_REMOTE = 4;
    private MeetingShareHelperCallback meetingShareHelperCallback;

//    MessageReceivedUtils messageReceivedUtils;
    private SharedPreferences sharedPreferences;
    private View mContentView;

    public MeetingShareHelper(Context var1, AttributeSet var2) {
        super(var1, var2);
    }

    @Override
    public void startScreenShareRemote() {
        askScreenSharePermission();
    }

    public interface MeetingShareUICallBack {
        void showShareMenu(PopupWindow popupWindow);

        MeetingShareHelper getShareView();
    }

    private InMeetingShareController mInMeetingShareController;
    private InMeetingService mInMeetingService;
    private MeetingShareUICallBack callBack;
    private Activity activity;
//    private ArFragment arFragment;

    public MeetingShareHelper(Activity activity, MeetingShareUICallBack callBack) {
        super(activity, null);
        mInMeetingShareController = ZoomSDK.getInstance().getInMeetingService().getInMeetingShareController();
        mInMeetingService = ZoomSDK.getInstance().getInMeetingService();
        this.activity = activity;
        this.callBack = callBack;
        HelloSceneformActivity activity1 = new HelloSceneformActivity();
//        messageReceivedUtils = new MessageReceivedUtils(this, activity1,activity);
        EventUtils eventUtils = new EventUtils(this,activity1,activity);
        meetingShareHelperCallback = (MeetingShareHelperCallback) activity;
//      this.arFragment = arFragment;
    }

    public void onClickShare() {
        if (mInMeetingShareController.isOtherSharing()) {
//          showOtherSharingTip();
            meetingShareHelperCallback.onscreenShareMenuClick("1");
            return;
        }
        if (!mInMeetingShareController.isSharingOut()) {
            showShareActionPopupWindow();
        } else {
            stopShare();
        }
    }

    public boolean isSenderSupportAnnotation(long userId) {
        return mInMeetingShareController.isSenderSupportAnnotation(userId);
    }

    public boolean isSharingScreen() {
        return mInMeetingShareController.isSharingScreen();
    }

    public boolean isOtherSharing() {
        return mInMeetingShareController.isOtherSharing();
    }

    public boolean isSharingOut() {
        return mInMeetingShareController.isSharingOut();
    }

    public MobileRTCSDKError startShareScreenSession(Intent intent) {
        return mInMeetingShareController.startShareScreenSession(intent);
    }


    public void stopShare() {
        mInMeetingShareController.stopShareScreen();
        if (null != callBack) {
            MobileRTCShareView shareView = callBack.getShareView();
            if (shareView != null) {

                Log.d("##SCREEN_SHARE","STOP");
                mInMeetingShareController.stopShareView();
                shareView.setVisibility(View.GONE);
                sendStopArMessage();
//                ZoomSDK.getInstance().getInMeetingService().getInMeetingVideoController().muteMyVideo(false);
            }
        }
    }

    public void showOtherSharingTip() {
        new AlertDialog.Builder(activity)
                .setTitle(R.string.alert_other_is_sharing)
                .setNegativeButton("OK", new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        dialog.dismiss();
                    }
                })
                .create().show();

    }

    public void onShareActiveUser(long currentShareUserId, long userId) {
        if (currentShareUserId > 0 && mInMeetingService.isMyself(currentShareUserId)) {
            if (userId < 0 || !mInMeetingService.isMyself(userId)) { //My share stopped or other start share and stop my share
                mInMeetingShareController.stopShareView();
                mInMeetingShareController.stopShareScreen();
                return;
            }
        }
        if (mInMeetingService.isMyself(userId)) {
            if (mInMeetingShareController.isSharingOut()) {
                if (mInMeetingShareController.isSharingScreen()) {
                    mInMeetingShareController.startShareScreenContent();
                } else {
                    if (null != callBack) {
                        mInMeetingShareController.startShareViewContent(callBack.getShareView());
                    }
                }
            }
        }
    }


    public void showShareActionPopupWindow() {

        final SimpleMenuAdapter menuAdapter = new SimpleMenuAdapter(activity);

        if (Build.VERSION.SDK_INT >= 21) {
            menuAdapter.addItem(new SimpleMenuItem(MENU_SHARE_SCREEN, "Screen"));
        }
//        menuAdapter.addItem(new SimpleMenuItem(MENU_SHARE_IMAGE, "Image"));
//        menuAdapter.addItem(new SimpleMenuItem(MENU_SHARE_WEBVIEW, "Web url"));
//        menuAdapter.addItem(new SimpleMenuItem(MENU_WHITE_BOARD, "WhiteBoard"));
//        if (ZoomMeetingPlugin.listUsernameFIds != null) {
        menuAdapter.addItem(new SimpleMenuItem(MENU_SHARE_REMOTE, "Remote Screen"));
//        }
        View popupWindowLayout = LayoutInflater.from(activity).inflate(R.layout.popupwindow, null);

        ListView shareActions = (ListView) popupWindowLayout.findViewById(R.id.actionListView);
        final PopupWindow window = new PopupWindow(popupWindowLayout, ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        window.setBackgroundDrawable(activity.getResources().getDrawable(R.drawable.bg_transparent));
        shareActions.setAdapter(menuAdapter);

        shareActions.setOnItemClickListener((parent, view, position, id) -> {
            if (mInMeetingShareController.isOtherSharing()) {
                showOtherSharingTip();
                window.dismiss();
                return;
            }

            SimpleMenuItem item = (SimpleMenuItem) menuAdapter.getItem(position);
            if (item.getAction() == MENU_SHARE_WEBVIEW) {
                startShareWebUrl();
            } else if (item.getAction() == MENU_SHARE_IMAGE) {
                startShareImage();
            } else if (item.getAction() == MENU_SHARE_SCREEN) {
                sendScreenSizeToAllUser();
                final Handler handler = new Handler();
                handler.postDelayed(() -> askScreenSharePermission(), 3000);

            } else if (item.getAction() == MENU_WHITE_BOARD) {
                startShareWhiteBoard();
            } else if (item.getAction() == MENU_SHARE_REMOTE) {
                getRemoteScreenView();
            }
            window.dismiss();
        });

        window.setFocusable(true);
        window.setOutsideTouchable(true);
        window.update();
        if (null != callBack) {
            callBack.showShareMenu(window);
        }
    }

    private void sendManualScreenShareUser() {

        List<Long> userlist = mInMeetingService.getInMeetingUserList();

        for (int i = 0; i < userlist.size(); i++) {


        }


    }

    private void getRemoteScreenView() {
        showUserList();

//        meetingShareHelperCallback.onscreenShareMenuClick("2");
//        ScreenARPushUtils.startRemoteScreenshare();
    }

    @SuppressLint("NewApi")
    protected void askScreenSharePermission() {
        if (Build.VERSION.SDK_INT < 21) {
            return;
        }
        if (mInMeetingShareController.isOtherSharing()) {
            showOtherSharingTip();
            return;
        }
        MediaProjectionManager mgr = (MediaProjectionManager) activity.getSystemService(Context.MEDIA_PROJECTION_SERVICE);
        if (mgr != null) {
            Intent intent = mgr.createScreenCaptureIntent();
            if (AndroidAppUtil.hasActivityForIntent(activity, intent)) {
                try {
                    activity.startActivityForResult(mgr.createScreenCaptureIntent(), MyMeetingActivity.REQUEST_SHARE_SCREEN_PERMISSION);
                } catch (Exception e) {
                    Log.e(TAG, "askScreenSharePermission failed");
                }
            }
        }
    }

    private void startShareImage() {
        if (mInMeetingShareController.isOtherSharing()) {
            showOtherSharingTip();
            return;
        }
        boolean success = (mInMeetingShareController.startShareViewSession() == MobileRTCSDKError.SDKERR_SUCCESS);
        if (!success) {
            Log.i(TAG, "startShare is failed");
            return;
        }
        if (null == callBack) {
            return;
        }
        MobileRTCShareView shareView = callBack.getShareView();
        shareView.setVisibility(View.VISIBLE);
        shareView.setShareImageBitmap(BitmapFactory.decodeResource(activity.getResources(), R.drawable.zoom_intro1_share));
    }

    private void startShareWebUrl() {
        if (mInMeetingShareController.isOtherSharing()) {
            showOtherSharingTip();
            return;
        }
        boolean success = (mInMeetingShareController.startShareViewSession() == MobileRTCSDKError.SDKERR_SUCCESS);
        if (!success) {
            Log.i(TAG, "startShare is failed");
            return;
        }
        if (null == callBack) {
            return;
        }
        MobileRTCShareView shareView = callBack.getShareView();
        shareView.setVisibility(View.VISIBLE);
        shareView.setShareWebview("www.zoom.us");
    }

    MeetingShareHelper shareView1;

    private void startShareWhiteBoard() {

        if (mInMeetingShareController.isOtherSharing()) {
            showOtherSharingTip();
            return;
        }
        if (null == callBack) {
            return;
        }
        shareView1 = callBack.getShareView();
        boolean success = (mInMeetingShareController.startShareViewSession() == MobileRTCSDKError.SDKERR_SUCCESS);
        if (!success) {
            Log.i(TAG, "startShare is failed");
            return;
        }
        shareView1.setVisibility(View.VISIBLE);
        LinearLayout ll = new LinearLayout(getContext());
        LinearLayout.LayoutParams llP = new LinearLayout.LayoutParams(1080, 1920);
        ll.setLayoutParams(llP);
        ll.setBackgroundColor(Color.BLUE);
        TextView textView = new TextView(getContext());
        textView.setText("Nitin Thakor");
        textView.setTextSize(25);
        ll.addView(textView);
        shareView1.setShareWhiteboard();
//        shareView1.addView(ll);

//        final Handler handler = new Handler(Looper.getMainLooper());
//        handler.postDelayed(() -> {
//            //Do something after 100ms
//            shareView.addView(ll);
//        }, 8000);
//        View mView = LayoutInflater.from(getContext()).inflate(R.layout.zm_sharinglayout_sdk, (ViewGroup)null, false);
//        FrameLayout mShareContainer = (FrameLayout)mView.findViewById(R.id.shareContainer);
//        mShareContainer.addView(mView);
//        ShareImageView var1 = new ShareImageView(getContext());
//        FrameLayout.LayoutParams var2 = new FrameLayout.LayoutParams(1080, 1920);
//        var1.setLayoutParams(var2);
//        var1.a();
//        mContentView = var1;
//        mShareContainer.addView(var1);
//
//        // TEXTVIEW
//        if (mShareContainer.getParent() != null) {
//            ((ViewGroup) mShareContainer.getParent()).removeView(mShareContainer); // <- fix
//        }
//        shareView.addView(mShareContainer);

//        View tv = arFragment.getArSceneView();
//        tv.setVisibility(View.VISIBLE);
//        // TEXTVIEW
//        if (tv.getParent() != null) {
//            ((ViewGroup) tv.getParent()).removeView(tv); // <- fix
//        }
//        shareView.addView(arFragment.getArSceneView());
//        int height = shareView.getHeight();
//        int width = shareView.getWidth();
//        Size size = getSizeAdjustedToAspectRatio();

//        FrameLayout.LayoutParams flParam = new FrameLayout.LayoutParams(1080, 1920);
//        flParam.gravity = Gravity.CENTER;
//        shareView.setLayoutParams(flParam);
//        Log.d("##HEIGHT", String.valueOf(height));
    }

    @Override
    public boolean setShareWhiteboard() {
//        return super.setShareWhiteboard();
        Log.d("##SET", "1");
//        LinearLayout ll = new LinearLayout(getContext());
//        LinearLayout.LayoutParams llP = new LinearLayout.LayoutParams(1080, 1920);
//        ll.setLayoutParams(llP);
//        ll.setBackgroundColor(Color.BLUE);
//        TextView textView = new TextView(getContext());
//        textView.setText("Nitin Thakor");
//        textView.setTextSize(25);
//        ll.addView(textView);
//        shareView1.addView(ll);
        try {

            SDKShareView sdkShareView = new SDKShareView(getApplicationContext(), null);
            sdkShareView.setWhiteboardBackground();

//          CustomShareView customShareView = new CustomShareView(getApplicationContext());
//          customShareView.setWhiteboardBackground();

        } catch (Exception e) {
            e.printStackTrace();

        }
        return true;
    }

    private void sendStopArMessage() {
        Log.d("sender", "Broadcasting message");
        Intent intent = new Intent("custom-stop-ar");
        // You can also include some extra data.
        intent.putExtra("message", "This is my message!");
        LocalBroadcastManager.getInstance(activity).sendBroadcast(intent);
    }

    private List<String> getListOfAttendedUser() {

        List<String> listOfUser = new ArrayList<>();

        List<Long> userlist = mInMeetingService.getInMeetingUserList();
        int userCount = 0;
        if (userlist != null) {
            userCount = userlist.size();
        }
        if (userCount > 1) {
            int preCount = userCount;
            for (int i = 0; i < preCount; i++) {
                InMeetingUserInfo userInfo = mInMeetingService.getUserInfoById(userlist.get(i));
                if (userInfo != null) {
                    Log.d("##JOINEDUSER", userInfo.getUserName());
                    listOfUser.add(userInfo.getUserName());
                    userCount--;
                } else {
                    Log.d("##JOINEDUSER", "USERINFO IS NULL");
                }
            }
        }
        return listOfUser;
    }

    private void showUserList() {

        final boolean[] isUserselected = new boolean[1];

        AlertDialog.Builder builder = new AlertDialog.Builder(activity);
        LinearLayout linearLayout = new LinearLayout(activity);
        linearLayout.setOrientation(LinearLayout.VERTICAL);
        LinearLayout.LayoutParams layoutParams = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        layoutParams.gravity = Gravity.CENTER;

        ArrayList<ListUsernameFId> listUsernameFIds = NetworkCallZoomChat.getListOfUserAndFCMID();

        List<String> joinedAttendees = getListOfAttendedUser();

        for (int i = 0; i < listUsernameFIds.size(); i++) {

            String userName = listUsernameFIds.get(i).getUsername();

            if (joinedAttendees.contains(userName)) {

                TextView textView = new TextView(activity);
                textView.setText(userName);
                textView.setTextColor(Color.BLUE);
                textView.setTextSize(20);
                textView.setId(i);
                textView.setPadding(10, 10, 10, 10);
                textView.setTag(listUsernameFIds.get(i).getUserid());
                linearLayout.addView(textView);

                textView.setOnClickListener(v -> {

                    isUserselected[0] = true;
                    Log.d("##USERCLICK", String.valueOf(v.getTag()));
                    int idofTextView = v.getId();
                    TextView duplicateText = linearLayout.findViewById(idofTextView);
                    duplicateText.setBackgroundColor(Color.GREEN);
                    duplicateText.setTextColor(Color.WHITE);
//                    SendPushNotification.OpponentFCMID = String.valueOf(v.getTag());
                    sendMessagetoBroadcast("OPPONENT_FCMID", String.valueOf(v.getTag()));

                });
            }
        }


        builder.setTitle("Please select user from list");
        builder.setCancelable(true);
        builder.setView(linearLayout)
                // Add action buttons
                .setPositiveButton("OK", (dialog, id) -> {
                    if (isUserselected[0]) {
                        dialog.dismiss();
                        meetingShareHelperCallback.onscreenShareMenuClick("2");
//                      ScreenARPushUtils.startRemoteScreenshare();
                        sendMessagetoBroadcast("startremote","");

                    } else {
                        Toast.makeText(getContext(), "Please select user from list", Toast.LENGTH_SHORT).show();
                    }
                });
        builder.create();
        builder.show();
    }

    private void sendScreenSizeToAllUser() {

        ArrayList<ListUsernameFId> listUsernameFIds = null;

        if (listUsernameFIds == null) {
            listUsernameFIds = NetworkCallZoomChat.getListOfUserAndFCMID();
        }

        List<String> joinedAttendees = getListOfAttendedUser();

        for (int i = 0; i < listUsernameFIds.size(); i++) {

            String userName = listUsernameFIds.get(i).getUsername();

            if (joinedAttendees.contains(userName)) {
                String fid = listUsernameFIds.get(i).getUserid();
                String deviceType = listUsernameFIds.get(i).getDeviceType();
//                ScreenARPushUtils.sendScreensizeRemote(fid, deviceType);
                try {
                    JSONObject jsonObject = new JSONObject();
                    jsonObject.put("fid", fid);
                    jsonObject.put("deviceType", deviceType);
                    sendMessagetoBroadcast("screensize", jsonObject.toString());
                }catch (Exception e){
                    e.printStackTrace();
                }

            }
        }
    }

    private void sendMessagetoBroadcast(String msgKey,String msgValue) {
        Log.d("sender", "Broadcasting message");
        Intent intent = new Intent("zoom-event-receiver");
        intent.putExtra("keytype", msgKey);
        intent.putExtra("jsonData",msgValue);
        LocalBroadcastManager.getInstance(getContext()).sendBroadcast(intent);
    }
}