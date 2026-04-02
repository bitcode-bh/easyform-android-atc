package com.easyform.newjitsi.utils;

import static android.content.Context.NOTIFICATION_SERVICE;

import android.app.NotificationManager;
import android.content.Context;

/**
 * Created by NareshChocha on 18/2/2023.
 */
public class Utils {
    public static class BroadcastAction {
        public static final String JITSI_PLUGIN_CALL = "com.easyform.newjitsi.JitsiPluginCall";
        public static final String JITSI_NOTIFICATION = "com.easyform.newjitsi.notification";
        public static final String JITSI_REJECT_NOTIFICATION = "com.easyform.newjitsi.rejectNotification";
        public static final String JITSI_SCREEN_SIZE_REMOTE = "com.easyform.newjitsi.ScreenSizeRemote";
        public static final String JITSI_SCREEN_SIZE_REMOTE_ACTIVITY = "com.easyform.newjitsi.ScreenSizeRemoteActivity";
        public static final String JITSI_SCREEN_DRAW_DATA = "com.easyform.newjitsi.ScreenDrawData";

        public static final String JITSI_CALL_REJECT = "com.easyform.newjitsi.Reject";
        public static final String JITSI_CALL_ACCEPT = "com.easyform.newjitsi.Accept";

        public static final String JITSI_SCREEN_SHEAR_ACTION = "com.easyform.newjitsi.CustomJitsiMeetActivity.ScreenShear";
        public static final String JITSI_SCREEN_SHEAR_ACTION_DRAW = "com.easyform.newjitsi.CustomJitsiMeetActivity.ScreenShearDraw";
        public static final String JITSI_CLEAR_NOTIFICATION = "com.easyform.newjitsi.clearNotification";

        public static final String JITSI_CALL_STOP = "com.easyform.newjitsi.CallStop";
        public static final String JITSI_CALL_STOP_Action = "com.easyform.newjitsi.CallStop.Action";

        public static final String JITSI_CALL_PhotoId = "com.easyform.newjitsi.PhotoId";

        public static final String JITSI_CALL_Get_PhotoId = "com.easyform.newjitsi.Get_PhotoId";
        public static final String JITSI_CALL_webviewload = "com.easyform.newjitsi.Webviewload";
        public static final String JITSI_CALL_screenshot = "com.easyform.newjitsi.ScreenShot";

    }

    public static class BroadcastActionExtrasKeys {
        // JITSI_PLUGIN_CALL
        public static final String JITSI_MEETING_PLUGIN_ARGS = "JITSI_MEETING_PLUGIN_ARGS";
        public static final String API_AUTH = "API_AUTH";
        public static final String LOGIN_USER_DATA = "LOGIN_USER_DATA";
        public static final String OTHER_DATA = "OTHER_DATA";
        public static final String NOTIFICATION_REMOTE_DATA = "NOTIFICATION_REMOTE_DATA";
        public static final String NOTIFICATION_ID = "NOTIFICATION_ID";
        public static final String SHARE_TOGGLE = "SHARE_TOGGLE";


    }


    public static void clearNotification(Context context, int notificationId) {
        if (notificationId != -2) {
            NotificationManager mNotificationManager = (NotificationManager) context.getSystemService(NOTIFICATION_SERVICE);
            mNotificationManager.cancel(notificationId);
        }
    }

}
