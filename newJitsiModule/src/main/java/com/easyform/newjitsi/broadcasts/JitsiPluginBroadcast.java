package com.easyform.newjitsi.broadcasts;


import static android.content.Context.MODE_PRIVATE;

import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.os.Bundle;

import androidx.annotation.Keep;

import com.easyform.newjitsi.R;
import com.easyform.newjitsi.activitys.ProgressActivity;
import com.easyform.newjitsi.network.requests.Args;
import com.easyform.newjitsi.network.requests.AuthJson;
import com.easyform.newjitsi.network.requests.LoginData;
import com.easyform.newjitsi.network.requests.ZoomMeetingItem;
import com.easyform.newjitsi.network.requests.notifcation.NotificationData;
import com.easyform.newjitsi.network.requests.usershow.AuthData;
import com.easyform.newjitsi.utils.NotificationUtils;
import com.easyform.newjitsi.utils.Utils;
import com.google.gson.Gson;

import java.util.ArrayList;
import java.util.List;

import okhttp3.internal.Util;
import timber.log.Timber;

/**
 * Created by NareshChocha on 18/2/2023.
 */
@Keep
public class JitsiPluginBroadcast extends BroadcastReceiver {
    static final String TAG = JitsiPluginBroadcast.class.getName();

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        Bundle extras = intent.getExtras();
        if (extras != null) {
            if (action.matches(Utils.BroadcastAction.JITSI_PLUGIN_CALL)) {
                pluginCalled(context, extras);
            } else if (action.matches(Utils.BroadcastAction.JITSI_NOTIFICATION)) {
                JoinMeetNow(context, extras);
            }
        } else {
            Timber.tag(TAG).e("Extras Data is null");
        }
    }

    Gson mGson = new Gson();

    private void pluginCalled(Context context, Bundle extras) {

        String click_action = extras.getString(Utils.BundleExtras.CLICK_ACTION, "");
        String userGetData = extras.getString(Utils.BundleExtras.GET_USER_DATA, "");
        String Role_id = extras.getString(Utils.BundleExtras.ROLE_ID, "");
        String companyFeatureid = extras.getString(Utils.BundleExtras.COMPANY_FEATURE_ID, "");
        String auth1 = extras.getString(Utils.BundleExtras.AUTH1, "");
        String webpush = extras.getString(Utils.BundleExtras.WEB_PUSH, "");
        String senderfcmid = extras.getString(Utils.BundleExtras.SENDER_FCM_ID, "");
        String loginjson = extras.getString(Utils.BundleExtras.LOGIN_DATA, "");
        String arg = extras.getString(Utils.BundleExtras.ARGS, "");
        String body = extras.getString(Utils.BundleExtras.BODY, "");
        String url = extras.getString(Utils.BundleExtras.URL, "");

        //LogUtils.JitsiLogFile(loginjson, "plugincallloginjson line172");

        SharedPreferences sharedPreferences = context.getSharedPreferences("Plugin", MODE_PRIVATE);
        SharedPreferences.Editor myEdit = sharedPreferences.edit();
        myEdit.putString("isPlugin", "isPluginCall");


        myEdit.putString("loginjson", loginjson);
        myEdit.apply();
        LoginData loginData = mGson.fromJson(loginjson, LoginData.class);


        Args args = mGson.fromJson(arg.substring(1, arg.length() - 1), Args.class);

        AuthJson authJson = new AuthJson();
        authJson.setAppversion(loginData.getAppVersion());
        authJson.setAppid(loginData.getAppId());
        authJson.setDevicetype("android");//ios //Web
        authJson.setUserId(loginData.getUserId());
        authJson.setUsername(loginData.getUsername());
        authJson.setUC(loginData.getUc());

        List<String> fcmIosIds = new ArrayList<>();

        List<String> fcmIds = new ArrayList<>();
        for (int i = 0; i < args.getZoomMeeting().size(); i++) {
            ZoomMeetingItem zoomMeetingItem = args.getZoomMeeting().get(i);
            if (zoomMeetingItem.getDeviceType().matches("ios")) {
                fcmIosIds.add(zoomMeetingItem.getFcmid());
            } else {
                fcmIds.add(zoomMeetingItem.getFcmid());
            }
        }

        String participntId = null;
        NotificationData data = new NotificationData(loginData.getUsername() + " is calling to you!", "EASYFORM CALL",
                "call", loginData.getUsername(), loginData.getUserId() + "" + loginData.getCompanyId(),
                "jitsiMeet", "0", senderfcmid, arg, click_action, webpush, authJson.getDevicetype(), senderfcmid, Role_id, companyFeatureid, auth1, userGetData, participntId, loginData.getUc(), "", "");

        Intent mIntent = new Intent(context, ProgressActivity.class);
        mIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        mIntent.putExtra(Utils.BundleExtras.NOTIFICATION_DATA, data);
        mIntent.putExtra(Utils.BundleExtras.AUTHJSON_DATA, authJson);
        mIntent.putExtra(Utils.BundleExtras.LOGIN_DATA, loginData);
        mIntent.putExtra(Utils.BundleExtras.FCM_IOS_IDS_LIST, mGson.toJson(fcmIosIds));
        mIntent.putExtra(Utils.BundleExtras.FCM_IDS_LIST, mGson.toJson(fcmIds));
        mIntent.putExtra(Utils.BundleExtras.AUTH1, auth1);
        mIntent.putExtra(Utils.BundleExtras.ROLE_ID, Role_id);
        mIntent.putExtra(Utils.BundleExtras.COMPANY_FEATURE_ID, companyFeatureid);
        mIntent.putExtra(Utils.BundleExtras.ARGS, arg.substring(1, arg.length() - 1));
        mIntent.putExtra(Utils.BundleExtras.SENDER_FCM_ID, senderfcmid);
        mIntent.putExtra(Utils.BundleExtras.URL, url);
        mIntent.putExtra(Utils.BundleExtras.BODY, body);
        mIntent.putExtra(Utils.BundleExtras.USER_GET_DATA, userGetData);
        context.startActivity(mIntent);
    }

    private void JoinMeetNow(Context context, Bundle extras) {
        String remoteMessageData = extras.getString(Utils.BundleExtras.REMOTE_MESSAGE_DATA, "");
        NotificationData notificationData = new Gson().fromJson(remoteMessageData, NotificationData.class);
        String url = extras.getString(Utils.BundleExtras.URL, "");
        String loginJson = extras.getString(Utils.BundleExtras.LOGIN_DATA, "");
        LoginData loginData = new Gson().fromJson(loginJson, LoginData.class);


        AuthJson authJson = new AuthJson();
        authJson.setAppversion(loginData.getAppVersion());
        authJson.setAppid(loginData.getAppId());
        authJson.setDevicetype("android");
        authJson.setUserId(loginData.getUserId());
        authJson.setUsername(loginData.getUsername());
        authJson.setUC(loginData.getUc());

        AuthData authData = new AuthData();
        authData.setUsername(loginData.getUsername());
        authData.setUc(loginData.getUc());
        authData.setUserId(loginData.getUserId());

        int NOTIFICATION_ID = (int) System.currentTimeMillis();

        NotificationUtils.createNotification(NOTIFICATION_ID, context,
                getAcceptCallPendingIntent(NOTIFICATION_ID, context, notificationData.getRoomName(), url, loginData, authJson, remoteMessageData, notificationData.getArgs(), notificationData.getWebpush(), notificationData.getClick_action(), notificationData.getAuth1(), notificationData.getUserGetData(), notificationData.getRole_id(), notificationData.getCompanyFeatureid(), authData, notificationData.getBody()),
                getRejectCallPendingIntent(NOTIFICATION_ID, context, notificationData.getSenderfcmid(), url, loginData, loginJson, authJson, notificationData.getArgs(), remoteMessageData, notificationData.getWebpush(), notificationData.getClick_action(), notificationData.getRemotetoken()),
                notificationData.getTitle(),
                notificationData.getBody(),
                R.drawable.atc_logo);
    }


    /**
     * @param NOTIFICATION_ID Notification id to use in show Notification
     * @param context         pass context
     * @return is returning pending intent is will call on user reject call on Notification
     * @author SavanSolanki
     */
    private PendingIntent getRejectCallPendingIntent(int NOTIFICATION_ID, Context
            context, String senderfcmid, String url, LoginData logindata, String loginjson, AuthJson
                                                             authjson, String args, String remoteMessagedata, String webpush, String action_click, String
                                                             remotetoken) {
        Intent jitsiBroadcast = new Intent(context, JitsiPluginBroadcast.class);
        jitsiBroadcast.setAction("com.easyform.jitsi.Reject");
        jitsiBroadcast.putExtra("notificationId", NOTIFICATION_ID);
        jitsiBroadcast.putExtra("senderfcmid", senderfcmid);
        jitsiBroadcast.putExtra("remotetoken", remotetoken);
        jitsiBroadcast.putExtra("url", url);
        jitsiBroadcast.putExtra("logindata", logindata);
        jitsiBroadcast.putExtra("loginjson", loginjson);
        jitsiBroadcast.putExtra("authjson", authjson);
        jitsiBroadcast.putExtra("args", args);
        jitsiBroadcast.putExtra("remoteMessagedata", remoteMessagedata);
        jitsiBroadcast.putExtra("webpush", webpush);
        jitsiBroadcast.putExtra("action_click", action_click);

        return PendingIntent.getBroadcast(context, 4812, jitsiBroadcast, PendingIntent.FLAG_CANCEL_CURRENT);
    }

    /**
     * @param NOTIFICATION_ID Notification id to use in show Notification
     * @param context         pass context
     * @param roomName        roomName user join to meet
     * @param url             url to getKey form server
     * @param loginData       {@link LoginData} pass login data
     * @param authJson        {@link AuthJson} pass authJson
     * @return is returning pending intent is will call on user Accept call on Notification
     * @author SavanSolanki
     */
    private PendingIntent getAcceptCallPendingIntent(int NOTIFICATION_ID, Context
            context, String roomName, String url, LoginData loginData, AuthJson authJson, String
                                                             remoteMessageData, String args, String webpush, String click_action, String auth1, String
                                                             userGetData, String role_id, String companyFeatureid, AuthData authData, String body) {
        Intent mainActivityJitsi = new Intent(context, ProgressActivity.class);
        mainActivityJitsi.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        mainActivityJitsi.putExtra(Utils.BundleExtras.URL, url);
        mainActivityJitsi.putExtra(Utils.BundleExtras.AUTHJSON_DATA, authJson);
        mainActivityJitsi.putExtra(Utils.BundleExtras.LOGIN_DATA, loginData);
        mainActivityJitsi.putExtra(Utils.BundleExtras.ROOM_NAME, roomName);
        mainActivityJitsi.putExtra(Utils.BundleExtras.NOTIFICATION_ID, NOTIFICATION_ID);
        mainActivityJitsi.putExtra(Utils.BundleExtras.ARGS, args);
        mainActivityJitsi.putExtra(Utils.BundleExtras.WEB_PUSH, webpush);
        mainActivityJitsi.putExtra("action_click", click_action);
        mainActivityJitsi.putExtra(Utils.BundleExtras.AUTH1, auth1);
        mainActivityJitsi.putExtra("remoteMessageData", remoteMessageData);
        mainActivityJitsi.putExtra(Utils.BundleExtras.USER_GET_DATA, userGetData);
        mainActivityJitsi.putExtra(Utils.BundleExtras.ROLE_ID, role_id);
        mainActivityJitsi.putExtra(Utils.BundleExtras.COMPANY_FEATURE_ID, companyFeatureid);
        //mainActivityJitsi.putExtra(Utils.BundleExtras.AUTHJSON_DATA, authData);
        mainActivityJitsi.putExtra(Utils.BundleExtras.BODY, body);
        return PendingIntent.getActivity(context, 4812, mainActivityJitsi, PendingIntent.FLAG_CANCEL_CURRENT);
    }

}
