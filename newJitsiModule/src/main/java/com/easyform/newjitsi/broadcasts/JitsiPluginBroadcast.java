package com.easyform.newjitsi.broadcasts;


import static android.content.Context.MODE_PRIVATE;
import static com.easyform.newjitsi.App.context;
import static com.easyform.newjitsi.App.getContext;

import android.app.ActivityManager;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.service.notification.StatusBarNotification;
import android.util.Log;
import android.view.View;

import androidx.annotation.Keep;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import com.easyform.newjitsi.R;
import com.easyform.newjitsi.activitys.call.IncomingCallActivity;
import com.easyform.newjitsi.activitys.drawing.AR.ARDrawActivity;
import com.easyform.newjitsi.activitys.drawing.AR.EventUtils;
import com.easyform.newjitsi.activitys.drawing.AR.TouchEventAR;
import com.easyform.newjitsi.activitys.drawing.CameraPreviewActivity;
import com.easyform.newjitsi.activitys.drawing.NormalDrawingUtils;
import com.easyform.newjitsi.activitys.drawing.PaintViewNormal;
import com.easyform.newjitsi.activitys.drawing.models.RemoteUtils;
import com.easyform.newjitsi.activitys.jitsimeet.CustomJitsiMeetActivity;
import com.easyform.newjitsi.activitys.jitsimeet.CustomJitsiMeetViewModel;
import com.easyform.newjitsi.activitys.jitsimeet.VideoRecordingService;
import com.easyform.newjitsi.activitys.jitsimeet.WebDialogFragment;
import com.easyform.newjitsi.activitys.loading.LoadingActivity;
import com.easyform.newjitsi.fragments.InviteListItem;
import com.easyform.newjitsi.fragments.MultiChoiceDialogFragment;
import com.easyform.newjitsi.network.Models.OtherData;
import com.easyform.newjitsi.network.Models.UserData;
import com.easyform.newjitsi.network.requests.notifcation.FirebaseRequest;
import com.easyform.newjitsi.network.requests.notifcation.FirebaseRequestData;
import com.easyform.newjitsi.network.response.notifcation.FirebaseResponse;
import com.easyform.newjitsi.utils.FCMNotificationApiCall;
import com.easyform.newjitsi.utils.JitsiMeetBroadcastUtils;
import com.easyform.newjitsi.utils.NotificationUtils;
import com.easyform.newjitsi.utils.Utils;

import com.google.gson.Gson;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import retrofit2.Response;

/**
 * Created by NareshChocha on 18/2/2023.
 */
@Keep
public class JitsiPluginBroadcast extends BroadcastReceiver {
    static final String TAG = "JitsiPluginBroadcast";
    SharedPreferences sharedPreferences;
    SharedPreferences.Editor editor;

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        Bundle extras = intent.getExtras();

        if (extras != null) {
            if (action.matches(Utils.BroadcastAction.JITSI_PLUGIN_CALL)) {

                context.startActivity(getLoadingActivityIntent(context, action, extras));
            } else if (action.matches(Utils.BroadcastAction.JITSI_NOTIFICATION)) {
                showNotificationForCall(context, extras);
            } else if (action.matches(Utils.BroadcastAction.JITSI_CALL_REJECT)) {
                sendAndClearNotification(context, extras);
            } else if (action.matches(Utils.BroadcastAction.JITSI_REJECT_NOTIFICATION)) {
                showRejectNotification(context, extras);
            } else if (action.matches(Utils.BroadcastAction.JITSI_SCREEN_SIZE_REMOTE)) {
                remoteScreenSize(context, extras);
            } else if (action.matches(Utils.BroadcastAction.JITSI_SCREEN_DRAW_DATA)) {
                try {
                    ScreenARDraw(context,extras);
                } catch (JSONException e) {
                    e.printStackTrace();
                }
            } else if (action.matches(Utils.BroadcastAction.JITSI_CALL_STOP)) {
                StopIncomingCallActivity(context, extras);
            } else if (action.matches(Utils.BroadcastAction.JITSI_CALL_STOP_Action)) {
                CallStopAction(context, extras);
            } else if (action.matches(Utils.BroadcastAction.JITSI_CALL_PhotoId)) {
                SendPhotoId(context, extras);
            } else if (action.matches(Utils.BroadcastAction.JITSI_CALL_Get_PhotoId)) {
                Get_photoId(context, extras);
            }
            else if(action.matches(Utils.BroadcastAction.JITSI_CALL_screenshot))
            {
                try {
                    ScreenShots(context,extras);
                } catch (JSONException e) {
                    e.printStackTrace();
                }
            }
        }
    }

    Intent getLoadingActivityIntent(Context context, String action, Bundle extras) {
        Intent loadingActivityIntent = new Intent(context, LoadingActivity.class);
        loadingActivityIntent.setAction(action);
        loadingActivityIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        loadingActivityIntent.putExtras(extras);
        return loadingActivityIntent;
    }

    Gson mGson = new Gson();

    private void showNotificationForCall(Context context, Bundle extras) {
        int notificationId = 9999;
        if (isNotificationActive(context, notificationId)) {

        } else {
            String notificationRemoteDataString = extras.getString(Utils.BroadcastActionExtrasKeys.NOTIFICATION_REMOTE_DATA, "");
            FirebaseRequestData mFirebaseRequestData = mGson.fromJson(notificationRemoteDataString, FirebaseRequestData.class);


            NotificationUtils.createNotification(notificationId, context,
                    getAcceptCallPendingIntent(context, extras, notificationId),
                    getRejectCallPendingIntent(context, extras, notificationId),
                    "EASYFORM CALL",
                    mFirebaseRequestData.getCallfrom() + " is Inviting you for Meet !",
                    R.drawable.atc_logo,extras);

            sharedPreferences = context.getSharedPreferences("Jitsiuser", MODE_PRIVATE);
            editor = sharedPreferences.edit();
            editor.putString("call_username", mFirebaseRequestData.getCallfrom());
            editor.commit();

//            Intent callIntent = new Intent(context, IncomingCallActivity.class);
//            callIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
//            callIntent.putExtra("Bundle_extras", extras);
//            callIntent.putExtra("notificationId", notificationId);
//            callIntent.putExtra("callfrom", mFirebaseRequestData.getCallfrom() + " is Inviting you for Meet !");
//            context.startActivity(callIntent);

        }
    }


    private PendingIntent getAcceptCallPendingIntent(Context context, Bundle extras, int notificationId) {
        Intent loadingActivityIntent = getLoadingActivityIntent(context, Utils.BroadcastAction.JITSI_CALL_ACCEPT, extras);
        loadingActivityIntent.putExtra(Utils.BroadcastActionExtrasKeys.NOTIFICATION_ID, notificationId);
        return PendingIntent.getActivity(context, 4812, loadingActivityIntent, PendingIntent.FLAG_CANCEL_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private PendingIntent getRejectCallPendingIntent(Context context, Bundle extras, int notificationId) {
        Intent jitsiPluginBroadcastIntent = new Intent(context, JitsiPluginBroadcast.class);
        jitsiPluginBroadcastIntent.setAction(Utils.BroadcastAction.JITSI_CALL_REJECT);
        jitsiPluginBroadcastIntent.putExtra(Utils.BroadcastActionExtrasKeys.NOTIFICATION_ID, notificationId);
        jitsiPluginBroadcastIntent.putExtras(extras);
        return PendingIntent.getBroadcast(context, 5850, jitsiPluginBroadcastIntent, PendingIntent.FLAG_CANCEL_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    ExecutorService mExecutorService = Build.VERSION.SDK_INT >= Build.VERSION_CODES.N ? Executors.newWorkStealingPool(4) :
            Executors.newFixedThreadPool(4);

    private void sendAndClearNotification(Context context, Bundle extras) {
        mExecutorService.execute(() -> {

            NotificationUtils.stopRingtone();
            String loginUserDataString = extras.getString(Utils.BroadcastActionExtrasKeys.LOGIN_USER_DATA, "");
            String otherDataString = extras.getString(Utils.BroadcastActionExtrasKeys.OTHER_DATA, "");
            int notificationId = extras.getInt(Utils.BroadcastActionExtrasKeys.NOTIFICATION_ID, -2);

            String notificationRemoteDataString = extras.getString(Utils.BroadcastActionExtrasKeys.NOTIFICATION_REMOTE_DATA, "");
            FirebaseRequestData mFirebaseRequestData = mGson.fromJson(notificationRemoteDataString, FirebaseRequestData.class);

            UserData mUserData = mGson.fromJson(loginUserDataString, UserData.class);
            OtherData mOtherData = mGson.fromJson(otherDataString, OtherData.class);
            SharedPreferences sharedPreferences = context.getSharedPreferences("Jitsi_roomname", MODE_PRIVATE);
            String roomname = sharedPreferences.getString("Roomname", "");
            FirebaseRequestData data = new FirebaseRequestData("Call Rejected",
                    mUserData.getUsername() + " has declined your call !",
                    "Decline", mUserData.getUsername(), roomname,
                    "jitsiMeetreject",
                    "0",
                    "",
                    mOtherData.getClickAction() + "",
                    mOtherData.getWebPush().toString() + "",
                    mUserData.getDeviceType() + "",
                    mUserData.getFCMToken() + "",
                    mUserData.getUserid() + "", mOtherData.getServer_task_id() + "", "rejected", "", "", false, "", ""
            );
            List<String> fcmIosIds = new ArrayList<>();
            List<String> fcmIds = new ArrayList<>();
            if (mFirebaseRequestData.getDevice_type().matches("ios")) {
                fcmIosIds.add(mFirebaseRequestData.getRemotetoken());
            } else {
                fcmIds.add(mFirebaseRequestData.getRemotetoken());
            }
            callNotificationApi(context, data, false, fcmIds, fcmIosIds, notificationId);
        });
    }

    void callNotificationApi(Context context, FirebaseRequestData data, Boolean isiOS, List<String> fcmIds, List<String> fcmIosIds, int notificationId) {
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
                callNotificationApi(context, data, true, fcmIds, fcmIosIds, notificationId);
            } else {
                Utils.clearNotification(context, notificationId);
            }


        } catch (Exception e) {

        }

//        try {
//            if (!fcmIds.isEmpty() || isiOS) {
//                Response<FirebaseResponse> firebaseResponse = FCMNotificationApiCall.sendNotification(firebaseRequest).execute();
//                if (firebaseResponse.isSuccessful() && firebaseResponse.code() == 200) {
//                    if (!fcmIosIds.isEmpty() && !isiOS) {
//                        callNotificationApi(context, data, true, fcmIds, fcmIosIds, notificationId);
//                    } else {
//                        Utils.clearNotification(context, notificationId);
//                    }
//                }
//            } else if (!fcmIosIds.isEmpty()) {
//                callNotificationApi(context, data, true, fcmIds, fcmIosIds, notificationId);
//            }
//        } catch (Exception e) {
//
//        }
    }

    private void showRejectNotification(Context context, Bundle extras) {
        String notificationRemoteDataString = extras.getString(Utils.BroadcastActionExtrasKeys.NOTIFICATION_REMOTE_DATA, "");
        FirebaseRequestData mFirebaseRequestData = mGson.fromJson(notificationRemoteDataString, FirebaseRequestData.class);
        int notificationId = (int) System.currentTimeMillis();

        String username = mFirebaseRequestData.getCallfrom();
        sharedPreferences = context.getSharedPreferences("Jitsiuser", MODE_PRIVATE);
        editor = sharedPreferences.edit();
        editor.putString("rejectnoti", username);
        editor.commit();

//        sharedPreferences = context.getSharedPreferences("jitsicall", MODE_PRIVATE);
//        editor = sharedPreferences.edit();
//        editor.putString("isclick","true");
//        editor.commit();

        if (MultiChoiceDialogFragment.adapter != null) {
            MultiChoiceDialogFragment.adapter.notifyDataSetChanged();
        }

        NotificationUtils.rejectCallNotification(notificationId, context,
                mFirebaseRequestData.getTitle(),
                mFirebaseRequestData.getBody(),
                R.drawable.atc_logo);
    }

    private void remoteScreenSize(Context context, Bundle extras) {
        String notificationRemoteDataString = extras.getString(Utils.BroadcastActionExtrasKeys.NOTIFICATION_REMOTE_DATA, "");
        FirebaseRequestData mFirebaseRequestData = mGson.fromJson(notificationRemoteDataString, FirebaseRequestData.class);
        int height;
        int width;
        try {
            JSONObject jsonObject = new JSONObject(mFirebaseRequestData.getArjson());
            JSONArray screensizeArr = jsonObject.getJSONArray("screensize");
            JSONArray inner = screensizeArr.getJSONArray(0);
            width = inner.getInt(0); // "720"
            height = inner.getInt(1); // "1600"

            //  height = jsonObject.getInt("remoteHeight");
            // width = jsonObject.getInt("remoteWidth");
            RemoteUtils.setRemoteHeight(height);
            RemoteUtils.setRemoteWidth(width);
            stopScreenShearRemote(context);
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    void stopScreenShearRemote(Context context) {
        Intent jitsiPluginBroadcast = new Intent();
        jitsiPluginBroadcast.setAction(Utils.BroadcastAction.JITSI_SCREEN_SIZE_REMOTE_ACTIVITY);
        LocalBroadcastManager.getInstance(context).sendBroadcast(jitsiPluginBroadcast);
    }

    private void ScreenARDraw(Context context, Bundle extras) throws JSONException {
        if (!extras.containsKey(Utils.BroadcastActionExtrasKeys.NOTIFICATION_REMOTE_DATA)) {
            return;
        }
        String notificationRemoteDataString = extras.getString(Utils.BroadcastActionExtrasKeys.NOTIFICATION_REMOTE_DATA, "");
        FirebaseRequestData mFirebaseRequestData = mGson.fromJson(notificationRemoteDataString, FirebaseRequestData.class);

        TouchEventAR touchEventAR = EventUtils.touchEventAR;
        String JsonData = null;
        JSONObject jsonObject = null;
        try {
            jsonObject = new JSONObject(mFirebaseRequestData.getJsonData());
            JsonData = jsonObject.getJSONArray(mFirebaseRequestData.getKeyType()).toString();

        } catch (JSONException e) {
            e.printStackTrace();
        }

        if (mFirebaseRequestData.getKeyType().equalsIgnoreCase("gestures")) {
            if (ARDrawActivity.isArSupportedDevice) {
                touchEventAR.onTouchEventArClick("gestures", JsonData);
            } else {
                NormalDrawingUtils.drawingNormal("gestures", JsonData);
            }
        } else if (mFirebaseRequestData.getKeyType().equalsIgnoreCase("Color")) {
            String JsonColor = jsonObject.getString("selectedcolor");
            if (ARDrawActivity.isArSupportedDevice) {
                touchEventAR.onTouchEventArClick("Color", JsonColor);
            } else {
                PaintViewNormal.currentColor = Color.parseColor(JsonColor);
            }
        } else if (mFirebaseRequestData.getKeyType().equalsIgnoreCase("clear")) {
            if (ARDrawActivity.isArSupportedDevice) {
                touchEventAR.onTouchEventArClick("delete", JsonData);
            } else {
                NormalDrawingUtils.drawingNormal("delete", JsonData);
            }
        } else if (mFirebaseRequestData.getKeyType().equalsIgnoreCase("arrow")) {
            if (ARDrawActivity.isArSupportedDevice) {
                touchEventAR.onTouchEventArClick("arrow", JsonData);
            } else {
                NormalDrawingUtils.drawingNormal("arrow", JsonData);
            }
        } else if (mFirebaseRequestData.getKeyType().equalsIgnoreCase("textlable")) {
            if (ARDrawActivity.isArSupportedDevice) {
                touchEventAR.onTouchEventArClick("textlable", JsonData);
            } else {
                NormalDrawingUtils.drawingNormal("textlable", JsonData);
            }
        } else if (mFirebaseRequestData.getKeyType().equalsIgnoreCase("imagearrow")) {
            if (ARDrawActivity.isArSupportedDevice) {

                touchEventAR.onTouchEventArClick("imagearrow", JsonData);
            } else {
                NormalDrawingUtils.drawingNormal("imagearrow", JsonData);
            }

        } else if (mFirebaseRequestData.getKeyType().equalsIgnoreCase("touches")) {
            if (ARDrawActivity.isArSupportedDevice) {
                touchEventAR.onTouchEventArClick("touches", JsonData);
            } else {
                NormalDrawingUtils.drawingNormal("touches", JsonData);
            }
        } else if (mFirebaseRequestData.getKeyType().equalsIgnoreCase("screenshot")) {
            if (ARDrawActivity.isArSupportedDevice) {
            } else {

                boolean check = isMyServiceRunning(context,
                        VideoRecordingService.class.getName());

                if (check) {
                    VideoRecordingService.takescreenshot(JsonData);

                } else {
                    CameraPreviewActivity.takescreenshot(JsonData);

                }
            }
        } else if (mFirebaseRequestData.getKeyType().equalsIgnoreCase("flash")) {
            if (ARDrawActivity.isArSupportedDevice) {
            } else {
                boolean check = isMyServiceRunning(context,
                        VideoRecordingService.class.getName());

                if (check) {
                    VideoRecordingService.OnOffFlashLight(JsonData);
                } else {

                    CameraPreviewActivity.OnOffFlashLight(JsonData);
                }
            }
        } else if (mFirebaseRequestData.getKeyType().equalsIgnoreCase("video_recording")) {
            if (ARDrawActivity.isArSupportedDevice) {
            } else {
                // CameraPreviewActivity.startstopservice(JsonData);
                try {
                    JSONArray jsonArray = new JSONArray(JsonData);
                    String keyname = jsonArray.getString(0);

                    if (keyname.equalsIgnoreCase("start")) {

                        Intent serviceIntent = new Intent(context, VideoRecordingService.class);
                        serviceIntent.putExtra("Bundle_extras",extras);
                        context.startService(serviceIntent);
                        CameraPreviewActivity.mImageViewVideoStop.setVisibility(View.GONE);
                        CameraPreviewActivity.mImageViewVideoStart.setVisibility(View.GONE);
                    } else {

                        Intent serviceIntent = new Intent(context, VideoRecordingService.class);
                        serviceIntent.putExtra("Bundle_extras",extras);
                        context.stopService(serviceIntent);
                        CameraPreviewActivity.mImageViewVideoStop.setVisibility(View.GONE);
                        CameraPreviewActivity.mImageViewVideoStart.setVisibility(View.GONE);
                    }

                } catch (Exception e) {

                }

            }
        } else if (mFirebaseRequestData.getKeyType().equalsIgnoreCase("zoom_in")) {
            if (ARDrawActivity.isArSupportedDevice) {
            } else {
                boolean check = isMyServiceRunning(context,
                        VideoRecordingService.class.getName());
                if (check) {
                    VideoRecordingService.zoomIn();
                } else {
                    CameraPreviewActivity.zoomIn();
                }
            }
        } else if (mFirebaseRequestData.getKeyType().equalsIgnoreCase("zoom_out")) {
            if (ARDrawActivity.isArSupportedDevice) {
            } else {
                boolean check = isMyServiceRunning(context,
                        VideoRecordingService.class.getName());
                if (check) {
                    VideoRecordingService.zoomOut();
                } else {
                    CameraPreviewActivity.zoomOut();
                }

            }
        } else if (mFirebaseRequestData.getKeyType().equalsIgnoreCase("zoom_original")) {
            if (ARDrawActivity.isArSupportedDevice) {
            } else {
                boolean check = isMyServiceRunning(context,
                        VideoRecordingService.class.getName());
                if (check) {
                    VideoRecordingService.zoomClear();
                } else {
                    CameraPreviewActivity.zoom_clear();
                }

            }
        } else if (mFirebaseRequestData.getKeyType().equalsIgnoreCase("flip_camera")) {
            if (ARDrawActivity.isArSupportedDevice) {
            } else {
                boolean check = isMyServiceRunning(context,
                        VideoRecordingService.class.getName());

                if (check) {
                    VideoRecordingService.backfroncamera(JsonData);
                } else {

                    CameraPreviewActivity.backfroncamera(JsonData);
                }
            }
        } else if (mFirebaseRequestData.getKeyType().equalsIgnoreCase("stop")) {
            if (ARDrawActivity.isArSupportedDevice) {
            } else {
                boolean check = isMyServiceRunning(context,
                        VideoRecordingService.class.getName());

                if (check) {
                    getContext().stopService(new Intent(context, VideoRecordingService.class));
                }

                CameraPreviewActivity mCameraPreviewActivity = new CameraPreviewActivity();
                mCameraPreviewActivity.finishActivity();
            }
        }

        sendDeleteData();
    }

    private void ScreenShots(Context context, Bundle extras) throws JSONException
    {
        if (!extras.containsKey(Utils.BroadcastActionExtrasKeys.NOTIFICATION_REMOTE_DATA)) {
            return;
        }
        String notificationRemoteDataString = extras.getString(Utils.BroadcastActionExtrasKeys.NOTIFICATION_REMOTE_DATA, "");
        FirebaseRequestData mFirebaseRequestData = mGson.fromJson(notificationRemoteDataString, FirebaseRequestData.class);

        TouchEventAR touchEventAR = EventUtils.touchEventAR;
        String JsonData = null;
        JSONObject jsonObject = null;
        try {
            jsonObject = new JSONObject(mFirebaseRequestData.getJsonData());
            JsonData = jsonObject.getJSONArray(mFirebaseRequestData.getKeyType()).toString();

        } catch (JSONException e) {
            e.printStackTrace();
        }

        if (mFirebaseRequestData.getKeyType().equalsIgnoreCase("screenshot")) {
            if (ARDrawActivity.isArSupportedDevice) {
            } else {

                CustomJitsiMeetActivity.capturePhoto(CustomJitsiMeetActivity.getInstance(), JsonData);
            }
        }
    }

    void sendDeleteData() {
        mExecutorService.execute(() -> {
            try {
                Thread.sleep(5000);
            } catch (InterruptedException e) {
            }
            TouchEventAR touchEventAR = EventUtils.touchEventAR;
            if (ARDrawActivity.isArSupportedDevice) {
                touchEventAR.onTouchEventArClick("delete", "");
            } else {
                NormalDrawingUtils.drawingNormal("delete", "");
            }
        });
    }

    private boolean isMyServiceRunning(Context context, String Myservice) {
        ActivityManager manager = (ActivityManager) context
                .getSystemService(Context.ACTIVITY_SERVICE);
        for (ActivityManager.RunningServiceInfo service : manager
                .getRunningServices(Integer.MAX_VALUE)) {
            if (Myservice.equals(service.service.getClassName())) {

                return true;
            }
        }
        return false;
    }

    private static boolean isNotificationActive(Context context, int notificationId) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            StatusBarNotification[] notifications = manager.getActiveNotifications();

            for (StatusBarNotification notification : notifications) {
                if (notification.getId() == notificationId) {
                    return true;
                }
            }
        }
        return false;
    }

    private void StopIncomingCallActivity(Context context, Bundle bundle) {

        String notificationRemoteDataString = bundle.getString(Utils.BroadcastActionExtrasKeys.NOTIFICATION_REMOTE_DATA, "");
        FirebaseRequestData mFirebaseRequestData = mGson.fromJson(notificationRemoteDataString, FirebaseRequestData.class);
        int notificationId = (int) System.currentTimeMillis();

        NotificationUtils.rejectCallNotification(notificationId, context,
                mFirebaseRequestData.getTitle(),
                mFirebaseRequestData.getBody(),
                R.drawable.atc_logo);
        if (IncomingCallActivity.mActivity != null) {
            NotificationUtils.stopRingtone();
            IncomingCallActivity.mActivity.finish();
        }
        if (CameraPreviewActivity.mActivity != null) {
            CameraPreviewActivity.mActivity.finish();
        }

        JitsiMeetBroadcastUtils.endMeeting(context);

        sharedPreferences = context.getSharedPreferences("Jitsiuser", MODE_PRIVATE);
        SharedPreferences.Editor  editor = sharedPreferences.edit();
        editor.clear().commit();

        sharedPreferences = context.getSharedPreferences("Jitsi_roomname", MODE_PRIVATE);
        SharedPreferences.Editor  meditor = sharedPreferences.edit();
        meditor.clear().commit();

        sharedPreferences = context.getSharedPreferences("Jitsiscreen",MODE_PRIVATE);
        SharedPreferences.Editor mEditor1 = sharedPreferences.edit();
        mEditor1.clear().commit();
    }

    CustomJitsiMeetViewModel meetViewModel;

    private void CallStopAction(Context context, Bundle bundle) {

        meetViewModel = new CustomJitsiMeetViewModel();
        meetViewModel.sendNotificationforstopcall(bundle, context);
    }

    private void SendPhotoId(Context context, Bundle mBundle) {
        meetViewModel = new CustomJitsiMeetViewModel();
        meetViewModel.sendNotificationforPhotoId(mBundle, context);

    }

    private void Get_photoId(Context context, Bundle bundle) {


       meetViewModel = new CustomJitsiMeetViewModel();
       meetViewModel.Get_photoid(bundle,context);


    }
}
