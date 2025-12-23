package com.sky.atc.easyformse.attendance.newattendanceutils.broadcasts;

import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

import com.google.gson.Gson;
import com.sky.atc.easyformse.attendance.newattendanceutils.NotificationUtil;
import com.sky.atc.easyformse.attendance.newattendanceutils.attendanceutils.NotificationType;
import com.sky.atc.easyformse.attendance.newattendanceutils.models.TaskData;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.sqlitewraper;

/**
 * Created by NareshChocha on 4/6/2022.
 *
 * @author NareshChocha
 */
public class AttendanceNotificationShow extends BroadcastReceiver {
    int NotificationId;
    @Override
    public void onReceive(Context context, Intent intent) {

        if (intent.getExtras() != null && intent.getExtras().containsKey(notificationTypeKey)) {
            NotificationId = intent.getExtras().getInt("Notificationid");

            NotificationType notificationType = NotificationType.valueOf(intent.getExtras().getString(notificationTypeKey, ""));
            Intent actionReceiverIntent = new Intent(context, AttendanceNotificationAction.class);
            String contentText, actionString;
             actionReceiverIntent.putExtras(intent.getExtras());
            actionReceiverIntent.putExtra(notificationTypeKey, notificationType);
            actionReceiverIntent.putExtra("NotificationId",NotificationId);
            actionReceiverIntent.putExtra(taskDataKey,
                    new Gson().fromJson(intent.getExtras().getString(taskDataKey, ""), TaskData.class));


            if (notificationType == NotificationType.CheckIn) {
//                contentText = "Mark your attendance by CHECK IN for today";  // change notification msg and remove click action 30062025
//                actionString = "Check In";
                contentText = "Once you start, your trip will be tracked for accurate reporting.";
                actionString = "Check In";
                MySharedPreferences pref = sqlitewraper.getSecureShared("MyPref");
                pref.putString("LastCheckinNoti", "true");
                pref.commit();
            } else if (notificationType == NotificationType.CheckOut) {
//                contentText = "End your day by CHECK OUT for today";
//                actionString = "Check Out";
                contentText = "Your today's end trip is pending , do it from Driver Safety Excellence.";
                actionString = "";
            } else {
                contentText = "";
                actionString = "";
            }
            PendingIntent actionIntentLogin = PendingIntent.getBroadcast(context, 1, actionReceiverIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE); // remove click action
//            PendingIntent actionIntentLogin = PendingIntent.getBroadcast(context, 1,  new Intent(), PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            NotificationUtil.createNotification(context, contentText, actionString,NotificationId, actionIntentLogin);
        } else {
            Log.e("AttendanceNotification", intent.getExtras().toString() +
                    " notificationTypeKey" + intent.getExtras().containsKey(taskDataKey));
        }
    }

    public static String notificationTypeKey = "NotificationTypeKey";
    public static String taskDataKey = "taskDataKey";
}
