package com.easyform.newjitsi.utils;

import static android.content.Context.NOTIFICATION_SERVICE;

import android.annotation.SuppressLint;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;

import androidx.annotation.DrawableRes;
import androidx.annotation.Keep;
import androidx.core.app.NotificationCompat;


import com.easyform.newjitsi.R;
import com.easyform.newjitsi.activitys.ProgressActivity;

import org.jitsi.meet.sdk.BroadcastIntentHelper;


/**
 * Created by Savan Solanki on 20/06/2022.
 *
 * @author Savan Solanki
 */
@Keep
public class NotificationUtils {
    private static final String NOTIFICATION_CHANNEL_ID = "EasyFrom Call";
    private static final String default_notification_channel_id = "EasyFrom Call";


    /**
     * @param NOTIFICATION_ID         Notification id to identify Notification unique
     * @param context                 pass context
     * @param acceptCallPendingIntent pass pendingIntent to call on accept action
     * @param rejectCallPendingIntent pass pendingIntent to call on reject action
     * @param title                   pass String to display in notification Title
     * @param text                    pass String to display in notification text
     * @param smallIconId             pass Drawable id for small icon in notification
     * @apiNote this method is display notification with NOTIFICATION_ID to identify this Notification
     */
    public static void createNotification(int NOTIFICATION_ID, Context context,
                                          PendingIntent acceptCallPendingIntent,
                                          PendingIntent rejectCallPendingIntent,
                                          String title,
                                          String text,
                                          @DrawableRes int smallIconId) {

        @SuppressLint("UnspecifiedImmutableFlag") PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, new Intent(context, ProgressActivity.class), 0);

        NotificationManager mNotificationManager = (NotificationManager) context.getSystemService(NOTIFICATION_SERVICE);
        NotificationCompat.Builder mBuilder = new NotificationCompat.Builder(context, default_notification_channel_id);
        mBuilder.setContentTitle(title);
        // mBuilder.setContentIntent(pendingIntent);


        Uri uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
        mBuilder.setSound(uri);

        mBuilder.addAction(R.drawable.reject_icon, "Reject", rejectCallPendingIntent);
        mBuilder.addAction(R.drawable.call_icon, "Accept", acceptCallPendingIntent);

        mBuilder.setContentText(text);
        mBuilder.setSmallIcon(smallIconId);
        mBuilder.setAutoCancel(false);
        mBuilder.setOngoing(true);
        //  mBuilder.setDeleteIntent(getDeleteIntent(context));
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .build();
            int importance = NotificationManager.IMPORTANCE_MAX;
            @SuppressLint("WrongConstant") NotificationChannel notificationChannel = new NotificationChannel(NOTIFICATION_CHANNEL_ID, "NOTIFICATION_CHANNEL_NAME", importance);
            mBuilder.setChannelId(NOTIFICATION_CHANNEL_ID);
            notificationChannel.setSound(uri, audioAttributes);

            assert mNotificationManager != null;
            mNotificationManager.createNotificationChannel(notificationChannel);
        }
        assert mNotificationManager != null;
        mNotificationManager.notify(NOTIFICATION_ID, mBuilder.build());

    }


    public static void rejectcallnotification(int NOTIFICATION_ID, Context context, String title,
                                              String text,
                                              @DrawableRes int smallIconId, PendingIntent doneNotiPendingIntent) {
        NotificationManager mNotificationManager = (NotificationManager) context.getSystemService(NOTIFICATION_SERVICE);
        NotificationCompat.Builder mBuilder = new NotificationCompat.Builder(context, default_notification_channel_id);
        mBuilder.setContentTitle(title);
        Uri uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
        mBuilder.setSound(uri);
        mBuilder.addAction(R.drawable.reject_icon, "Done", doneNotiPendingIntent);
        mBuilder.setContentText(text);
        mBuilder.setSmallIcon(smallIconId);
        mBuilder.setAutoCancel(false);
        mBuilder.setOngoing(true);
        //  mBuilder.setDeleteIntent(getDeleteIntent(context));
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .build();
            int importance = NotificationManager.IMPORTANCE_MAX;
            @SuppressLint("WrongConstant") NotificationChannel notificationChannel = new NotificationChannel(NOTIFICATION_CHANNEL_ID, "NOTIFICATION_CHANNEL_NAME", importance);
            mBuilder.setChannelId(NOTIFICATION_CHANNEL_ID);
            notificationChannel.setSound(uri, audioAttributes);

            assert mNotificationManager != null;
            mNotificationManager.createNotificationChannel(notificationChannel);
        }
        assert mNotificationManager != null;
        mNotificationManager.notify(NOTIFICATION_ID, mBuilder.build());
    }


    public static void ScreenShareNotification(int NOTIFICATION_ID, Context context, String title, String text, @DrawableRes int smallIconId, PendingIntent ScreenSharePendingIntent) {
        NotificationManager mNotificationManager = (NotificationManager) context.getSystemService(NOTIFICATION_SERVICE);
        NotificationCompat.Builder mBuilder = new NotificationCompat.Builder(context, default_notification_channel_id);
        mBuilder.setContentTitle(title);
        Uri uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
        mBuilder.setSound(uri);
        mBuilder.addAction(R.drawable.ic_screen_share, "ScreenShare", ScreenSharePendingIntent);
        mBuilder.setContentText(text);
        mBuilder.setSmallIcon(smallIconId);
        mBuilder.setAutoCancel(false);
        mBuilder.setOngoing(true);
        //  mBuilder.setDeleteIntent(getDeleteIntent(context));
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .build();
            int importance = NotificationManager.IMPORTANCE_MAX;
            @SuppressLint("WrongConstant") NotificationChannel notificationChannel = new NotificationChannel(NOTIFICATION_CHANNEL_ID, "NOTIFICATION_CHANNEL_NAME", importance);
            mBuilder.setChannelId(NOTIFICATION_CHANNEL_ID);
            notificationChannel.setSound(uri, audioAttributes);

            assert mNotificationManager != null;
            mNotificationManager.createNotificationChannel(notificationChannel);
        }
        assert mNotificationManager != null;
        mNotificationManager.notify(NOTIFICATION_ID, mBuilder.build());
    }

    public static void createOngoingCallNotification(Context context, String title, @DrawableRes int smallIconId) {

        //  PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, new Intent(context, CallActivity.class), 0);

        NotificationManager mNotificationManager = (NotificationManager) context.getSystemService(NOTIFICATION_SERVICE);
        NotificationCompat.Builder mBuilder = new NotificationCompat.Builder(context, default_notification_channel_id);
        mBuilder.setContentTitle(title);

        /*Uri alarmSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
        mBuilder.setSound(alarmSound);*/
        NotificationCompat.Action action =
                new NotificationCompat.Action.Builder(
                        0, "hangup", hangupBroadcastIntent(context)
                ).build();

        mBuilder.addAction(action);

        mBuilder.setContentText("Call");
        mBuilder.setSmallIcon(smallIconId);
        mBuilder.setOngoing(true);
        //  mBuilder.setDeleteIntent(getDeleteIntent(context));
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            int importance = NotificationManager.IMPORTANCE_DEFAULT;
            NotificationChannel notificationChannel = new NotificationChannel(NOTIFICATION_CHANNEL_ID, "NOTIFICATION_CHANNEL_NAME", importance);
            mBuilder.setChannelId(NOTIFICATION_CHANNEL_ID);
            assert mNotificationManager != null;
            mNotificationManager.createNotificationChannel(notificationChannel);
        }
        assert mNotificationManager != null;
        mNotificationManager.notify(48124812, mBuilder.build());
    }


    @SuppressLint("UnspecifiedImmutableFlag")
    private static PendingIntent hangupBroadcastIntent(Context context) {
        Intent hangupBroadcastIntent = BroadcastIntentHelper.buildHangUpIntent();
        return PendingIntent.getBroadcast(context, 4812, hangupBroadcastIntent, PendingIntent.FLAG_CANCEL_CURRENT);
    }

}
