package com.easyform.newjitsi.utils;

import static android.content.Context.MODE_PRIVATE;
import static android.content.Context.NOTIFICATION_SERVICE;

import android.annotation.SuppressLint;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.util.Log;
import android.widget.RemoteViews;

import androidx.annotation.DrawableRes;
import androidx.annotation.Keep;
import androidx.core.app.NotificationCompat;


import com.easyform.newjitsi.R;
import com.easyform.newjitsi.activitys.call.IncomingCallActivity;
import com.easyform.newjitsi.activitys.loading.LoadingActivity;

import org.jitsi.meet.sdk.BroadcastIntentHelper;

import java.io.IOException;


/**
 * Created by NareshChocha on 20/06/2022.
 *
 * @author NareshChocha
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
     * @apiNote this method
     // public static void createNotification(int NOTIFICATION_ID,
     * //                                          Context context,
     * //                                          PendingIntent acceptCallPendingIntent,
     * //                                          PendingIntent rejectCallPendingIntent,
     * //                                          String title,
     * //                                          String text,
     * //                                          @DrawableRes int smallIconId) {
     * //
     * ////        Uri soundUri = Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE + "://" +
     * ////                context.getPackageName() + "/" + R.raw.ringtone_video_call);
     * //
     * //        new Handler(Looper.getMainLooper()).postDelayed(() -> {
     * //             startRingtone(context); // Start playing ringtone
     * //        }, 500);
     * //
     * //        NotificationManager notificationManager =
     * //                (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
     * //
     * //        final String CHANNEL_ID = "incoming_call_channel_v2"; // Make sure it's unique
     * //        final String CHANNEL_NAME = "Incoming Call Notifications";
     * //
     * //        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
     * //
     * //            if (notificationManager.getNotificationChannel(CHANNEL_ID) != null) {
     * //                notificationManager.deleteNotificationChannel(CHANNEL_ID);
     * //            }
     * //
     * ////            AudioAttributes audioAttributes = new AudioAttributes.Builder()
     * ////                    .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
     * ////                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
     * ////                    .build();
     * //
     * //            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, CHANNEL_NAME, NotificationManager.IMPORTANCE_LOW);
     * //            channel.enableVibration(true);
     * //            channel.enableLights(true);
     * //
     * //            notificationManager.createNotificationChannel(channel);
     * //        }
     * //
     * ////        Intent loadingActivityIntent = new Intent(context, LoadingActivity.class);
     * ////        loadingActivityIntent.setAction(Utils.BroadcastAction.JITSI_CALL_ACCEPT);
     * ////        loadingActivityIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
     * ////        loadingActivityIntent.putExtras(extras);
     * //
     * //        @SuppressLint("UnspecifiedImmutableFlag")
     * //        PendingIntent contentIntent = PendingIntent.getActivity(
     * //                context,
     * //                0,
     * //                new Intent(),
     * //                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
     * //        );
     * //
     * //        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
     * //                .setSmallIcon(smallIconId)
     * //                .setContentTitle(title)
     * //                .setContentText(text)
     * //                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
     * //                .setCategory(NotificationCompat.CATEGORY_CALL)
     * //                .setAutoCancel(false)
     * //                .setOngoing(false)
     * //                .setContentIntent(contentIntent)
     * //                .addAction(R.drawable.reject_icon, "Reject", rejectCallPendingIntent)
     * //                .addAction(R.drawable.call_icon, "Accept", acceptCallPendingIntent);
     * //
     * //        // ✅ Show notification
     * //        notificationManager.notify(NOTIFICATION_ID, builder.build());
     * //    } is display notification with NOTIFICATION_ID to identify this Notification
     */


//    public static void createNotification(int NOTIFICATION_ID,
//                                          Context context,
//                                          PendingIntent acceptCallPendingIntent,
//                                          PendingIntent rejectCallPendingIntent,
//                                          String title,
//                                          String text,
//                                          @DrawableRes int smallIconId, Bundle extra) {
//
////        Uri soundUri = Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE + "://" +
////                context.getPackageName() + "/" + R.raw.ringtone_video_call);
//
//        new Handler(Looper.getMainLooper()).postDelayed(() -> {
//            startRingtone(context); // Start playing ringtone
//        }, 500);
//
//        NotificationManager notificationManager =
//                (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
//
//        final String CHANNEL_ID = "incoming_call_channel_v2"; // Make sure it's unique
//        final String CHANNEL_NAME = "Incoming Call Notifications";
//
//        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
//
//            if (notificationManager.getNotificationChannel(CHANNEL_ID) != null) {
//                notificationManager.deleteNotificationChannel(CHANNEL_ID);
//            }
//
////            AudioAttributes audioAttributes = new AudioAttributes.Builder()
////                    .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
////                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
////                    .build();
//
//            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, CHANNEL_NAME, NotificationManager.IMPORTANCE_LOW);
//            channel.enableVibration(true);
//            channel.enableLights(true);
//
//            notificationManager.createNotificationChannel(channel);
//        }
//
////        Intent loadingActivityIntent = new Intent(context, LoadingActivity.class);
////        loadingActivityIntent.setAction(Utils.BroadcastAction.JITSI_CALL_ACCEPT);
////        loadingActivityIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
////        loadingActivityIntent.putExtras(extras);
//
//        @SuppressLint("UnspecifiedImmutableFlag")
//        PendingIntent contentIntent = PendingIntent.getActivity(
//                context,
//                0,
//                new Intent(),
//                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
//        );
//
//        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
//                .setSmallIcon(smallIconId)
//                .setContentTitle(title)
//                .setContentText(text)
//                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
//                .setCategory(NotificationCompat.CATEGORY_CALL)
//                .setAutoCancel(false)
//                .setOngoing(false)
//                .setContentIntent(contentIntent)
//                .addAction(R.drawable.reject_icon, "Reject", rejectCallPendingIntent)
//                .addAction(R.drawable.call_icon, "Accept", acceptCallPendingIntent);
//
//        // ✅ Show notification
//        notificationManager.notify(NOTIFICATION_ID, builder.build());
//    }

    public static void createNotification(int notificationId, Context context, PendingIntent acceptCallPendingIntent,
                                          PendingIntent rejectCallPendingIntent,
                                          String title,
                                          String text,
                                          @DrawableRes int smallIcon,
                                          Bundle extras) {

        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            startRingtone(context);
        }, 500);


        NotificationManager manager =
                (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);


        String CHANNEL_ID = "incoming_call_channel_v2";


        // Android 8+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {

            NotificationChannel channel = manager.getNotificationChannel(CHANNEL_ID);


            if (channel == null) {

                channel = new NotificationChannel(CHANNEL_ID, "Incoming Calls", NotificationManager.IMPORTANCE_HIGH);


                channel.setDescription("Incoming call notifications");
                channel.enableLights(true);
                channel.enableVibration(true);
                channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
                manager.createNotificationChannel(channel);
            }
        }

        // Full screen activity intent
        Intent fullIntent = new Intent(context, IncomingCallActivity.class);
        fullIntent.putExtra("Bundle_extras", extras);
        fullIntent.putExtra("notificationId", notificationId);
        fullIntent.putExtra("callfrom", text);

        fullIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(context, notificationId, fullIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);



        // Android 14/15 Full screen check
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {

            if (!manager.canUseFullScreenIntent()) {

                Log.e(
                        "CALL_NOTIFICATION",
                        "Full screen intent permission disabled"
                );
//                Intent intent = new Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT);
//                intent.setData(Uri.parse("package:" + context.getPackageName()));
//                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
//                context.startActivity(intent);
                // Notification will still appear,
                // but activity will not auto open.
            }
        }

        // Custom notification layout
        RemoteViews remoteViews = new RemoteViews(context.getPackageName(), R.layout.incoming_call_notification);


        remoteViews.setTextViewText(R.id.tvTitle, text);
        remoteViews.setOnClickPendingIntent(R.id.btnAccept, acceptCallPendingIntent);
        remoteViews.setOnClickPendingIntent(R.id.btnReject, rejectCallPendingIntent);


        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(smallIcon)
                .setCustomHeadsUpContentView(remoteViews)
                .setStyle(new NotificationCompat.DecoratedCustomViewStyle())
                .setContentTitle(title)
                .setContentText(text)
                .setCategory(NotificationCompat.CATEGORY_CALL)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setOngoing(false)
                .setAutoCancel(false)
                .setContentIntent(fullScreenPendingIntent)
                .setFullScreenIntent(fullScreenPendingIntent, true);


        manager.notify(notificationId, builder.build());
    }


    public static void rejectCallNotification(int NOTIFICATION_ID, Context context, String title,
                                              String text,
                                              @DrawableRes int smallIconId) {
        NotificationManager mNotificationManager = (NotificationManager) context.getSystemService(NOTIFICATION_SERVICE);
        NotificationCompat.Builder mBuilder = new NotificationCompat.Builder(context, default_notification_channel_id);
        mBuilder.setContentTitle(title);
        mBuilder.setContentText(text);
        mBuilder.setSmallIcon(smallIconId);
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            int importance = NotificationManager.IMPORTANCE_MAX;
            @SuppressLint("WrongConstant") NotificationChannel notificationChannel = new NotificationChannel(NOTIFICATION_CHANNEL_ID, "NOTIFICATION_CHANNEL_NAME", importance);
            mBuilder.setChannelId(NOTIFICATION_CHANNEL_ID);
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
            @SuppressLint("WrongConstant") NotificationChannel notificationChannel = new NotificationChannel(NOTIFICATION_CHANNEL_ID, "NOTIFICATION_CHANNEL_NAME", importance);
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
        return PendingIntent.getBroadcast(context, 4812, hangupBroadcastIntent, PendingIntent.FLAG_CANCEL_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }


//    private static MediaPlayer mediaPlayer;
//
//    public static void startRingtone(Context context) {
//        if (mediaPlayer != null && mediaPlayer.isPlaying()) return;
//
//        try {
//            Uri soundUri = Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE + "://" +
//                    context.getPackageName() + "/" + R.raw.ringtone_video_call);
//
//            mediaPlayer = new MediaPlayer();
//            mediaPlayer.setDataSource(context, soundUri);
//            mediaPlayer.setAudioStreamType(AudioManager.STREAM_RING);
//            mediaPlayer.setLooping(true);
//            mediaPlayer.prepare();
//            mediaPlayer.start();
//        } catch (IOException e) {
//            e.printStackTrace();
//        }
//    }

    private static MediaPlayer mediaPlayer;

    public static void startRingtone(Context context) {
        // 1. Prevent duplicate playback if already ringing
        if (mediaPlayer != null && mediaPlayer.isPlaying()) return;

        try {
            stopRingtone(); // Clean up existing player if any

            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build();

            mediaPlayer = MediaPlayer.create(context, R.raw.ringtone_video_call);
            if (mediaPlayer != null) {
                mediaPlayer.setAudioAttributes(audioAttributes);
                mediaPlayer.setLooping(true); // Loop until answered/rejected
                mediaPlayer.start();
            }
        } catch (Exception e) {
            Log.e("NotificationUtils", "Error starting ringtone", e);
        }
    }

    public static void stopRingtone() {
        if (mediaPlayer != null) {
            mediaPlayer.stop();
            mediaPlayer.release();
            mediaPlayer = null;
        }
    }

    static MediaPlayer outgoingPlayer;
    public static void startOutgoingRing(Context context) {

       try{
           stopOutgoingRing();

           outgoingPlayer = MediaPlayer.create(context, R.raw.outgoing_sound);
           outgoingPlayer.setLooping(true);
           outgoingPlayer.start();
       }
       catch (Exception e)
       {
           e.printStackTrace();
       }
    }

    public static void stopOutgoingRing() {

        if (outgoingPlayer != null) {

            if (outgoingPlayer.isPlaying()) {
                outgoingPlayer.stop();
            }

            outgoingPlayer.release();
            outgoingPlayer = null;
        }
    }

}
