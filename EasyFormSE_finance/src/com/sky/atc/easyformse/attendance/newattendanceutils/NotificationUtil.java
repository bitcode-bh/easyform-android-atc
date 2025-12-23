package com.sky.atc.easyformse.attendance.newattendanceutils;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.graphics.Color;
import android.os.Build;

import androidx.annotation.RequiresApi;
import androidx.core.app.NotificationCompat;

import com.sky.atc.easyformse.R;

import java.util.Random;

/**
 * Created by NareshChocha on 4/6/2022.
 *
 * @author NareshChocha
 */
public class NotificationUtil {
    private static final int NotificationID = 48121233;
    private static final String notificationChannelName = "Attendance";
    private static final String description = " showing notification for getting Attendance";
    private static final String notificationIDName = notificationChannelName + (new Random(10).nextInt());


    @RequiresApi(api = Build.VERSION_CODES.O)
    private static NotificationChannel createNotificationChannel() {
        NotificationChannel notificationChannel = new NotificationChannel(NotificationUtil.notificationIDName, NotificationUtil.notificationChannelName, NotificationManager.IMPORTANCE_HIGH);
        notificationChannel.setDescription(NotificationUtil.description);
        notificationChannel.setLightColor(Color.BLUE);
        return notificationChannel;
    }

    public static void createNotification(Context context, String contentText, String actionString,int notiid, PendingIntent actionPendingIntent) {
        NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        NotificationCompat.Builder notificationBuilder = new NotificationCompat.Builder(context, NotificationUtil.notificationIDName)
                .setSmallIcon(R.drawable.atc_logo)
                .setAutoCancel(false)
                .setOngoing(false)
                .setContentTitle("Ready to Begin Your Daily Trip?")
                .setContentText(contentText)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setContentIntent(actionPendingIntent)
                .addAction(android.R.drawable.arrow_down_float, actionString, actionPendingIntent)
                .setStyle(new NotificationCompat.BigTextStyle()
                        .bigText(contentText));
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            notificationManager.createNotificationChannel(createNotificationChannel());
        }
        notificationManager.notify(notiid, notificationBuilder.build());
    }

    public static void cancelNotification(Context context,int NotificationId) {
        NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if(NotificationId == 0)
        {
            notificationManager.cancel(NotificationID);
        }
        else {
            notificationManager.cancel(NotificationId);
        }

    }


}
