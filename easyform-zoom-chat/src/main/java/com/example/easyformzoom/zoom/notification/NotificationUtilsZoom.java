package com.example.easyformzoom.zoom.notification;

import android.annotation.SuppressLint;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.net.Uri;
import android.util.Log;

import androidx.annotation.RequiresPermission;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import com.example.easyformzoom.R;
import com.example.easyformzoom.zoom.App;
import com.example.easyformzoom.zoom.ui.IncomingCallActivity;

import org.json.JSONObject;


public class NotificationUtilsZoom {

    private static String meetingIdGlo;
    private static String meetingPassGlo;
    private static String meetingCallfrom;
    private static String remoteTokenNew;
    private static String deviceTypeNew;

    @SuppressLint("WrongConstant")
    public static void callalertNotification(String meetinId, String meetingPass, String callfrrom,String remoteToken,String deviceType) {

        Log.d("##FCM","callalertNotification: "+"1");
        meetingIdGlo = meetinId;
        meetingPassGlo = meetingPass;
        meetingCallfrom = callfrrom;

        remoteTokenNew= remoteToken;
        deviceTypeNew=deviceType;

        Uri sound = Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE + "://" + App.getContext().getPackageName() + "/" + us.zoom.videomeetings.R.raw.ring_original);
        NotificationChannel channel;

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {

            AudioAttributes attributes;
            attributes = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                    .build();
            channel = new NotificationChannel("channel01", "name", NotificationManager.IMPORTANCE_HIGH);
            channel.setDescription("description");
            channel.setSound(sound, attributes);
            NotificationManager notificationManager = App.getContext().getSystemService(NotificationManager.class);
            notificationManager.createNotificationChannel(channel);
        }

        //Custom Notification
//        RemoteViews expandedView = new RemoteViews(App.getContext().getPackageName(), R.layout.custom_notification);
//        expandedView.setTextViewText(R.id.timestamp, DateUtils.formatDateTime(this, System.currentTimeMillis(), DateUtils.FORMAT_SHOW_TIME));
//        expandedView.setTextViewText(R.id.notification_message, mEditText.getText());
        // adding action to left button
//        Intent leftIntent = new Intent(App.getContext(), NotificationIntentService.class);
//        leftIntent.setAction("reject");
//        expandedView.setOnClickPendingIntent(R.id.btn_reject, PendingIntent.getService(App.getContext(), 0, leftIntent, PendingIntent.FLAG_UPDATE_CURRENT));

        //For Action Button Click event
        Intent intentAction = new Intent(App.getContext(), ActionReceiver.class);
        //This is optional if you have more than one buttons and want to differentiate between two
        intentAction.putExtra("action", "reject");
        PendingIntent pIntentlogin = PendingIntent.getBroadcast(App.getContext(), 1, intentAction, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);


        Intent intentActionAnswer = new Intent(App.getContext(), ActionReceiver.class);
        //This is optional if you have more than one buttons and want to differentiate between two
        intentActionAnswer.putExtra("action", "accept");
        PendingIntent pIntentloginAccept = PendingIntent.getBroadcast(App.getContext(), 2, intentActionAnswer, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Intent notifyIntent = new Intent(App.getContext(), IncomingCallActivity.class);
        notifyIntent.setAction("open");
        notifyIntent.putExtra("meetingid", meetinId);
        notifyIntent.putExtra("meetingpass", meetingPass);
        notifyIntent.putExtra("callfrom", callfrrom);
        notifyIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        PendingIntent notifyPendingIntent = PendingIntent.getActivity(
                App.getContext(), 0, notifyIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
// Register channel with system
        Notification notification = new NotificationCompat.Builder(App.getContext(), "channel01")
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(callfrrom + " is calling...")
                .setContentText("You have a new meeting please respond to it.")
                .setSound(sound)
                .setPriority(NotificationCompat.PRIORITY_HIGH)// heads-up
                .setContentIntent(notifyPendingIntent)
                .setFullScreenIntent(notifyPendingIntent, true)
                .setAutoCancel(false)
                .setOngoing(true)
                .addAction(0, "Reject", pIntentlogin)
                .addAction(0, "Accept", pIntentloginAccept)
//                .setCustomContentView(expandedView)
//                .setCustomBigContentView(expandedView)
                .setStyle(new NotificationCompat.DecoratedCustomViewStyle())
                .build();

//        notification.bigContentView = expandedView;
//        notification.flags = Notification.FLAG_NO_CLEAR;
        NotificationManagerCompat notificationManager1 = NotificationManagerCompat.from(App.getContext());
        notificationManager1.notify(202, notification);

    }

    public static class ActionReceiver extends BroadcastReceiver {

        @RequiresPermission("android.permission.BROADCAST_CLOSE_SYSTEM_DIALOGS")
        @Override
        public void onReceive(Context context, Intent intent) {

            String action = intent.getStringExtra("action");
            if (action.equals("reject")) {

                dismissNotification();

                try {
//                    SendPushNotification sendPushNotification = new SendPushNotification();
//                    sendPushNotification.sendPushToArScreen(remoteTokenNew, deviceTypeNew, null);

                    JSONObject jsonObject = new JSONObject();
                    jsonObject.put("remoteTokenNew", remoteTokenNew);
                    jsonObject.put("deviceTypeNew", deviceTypeNew);
                    sendMessagetoBroadcast("pushar",jsonObject.toString());
                }catch (Exception e){
                    e.printStackTrace();
                }



            } else if (action.equals("accept")) {
                dismissNotification();
                openCallActivity();
            }
            //This is used to close the notification tray
            Intent it = new Intent(Intent.ACTION_CLOSE_SYSTEM_DIALOGS);
            context.sendBroadcast(it);
        }

        public void dismissNotification() {
            NotificationManagerCompat notificationManager1 = NotificationManagerCompat.from(App.getContext());
            notificationManager1.cancel(202);
        }

        public void openCallActivity() {
            Intent i = new Intent(App.getContext(), IncomingCallActivity.class);
            i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            i.setAction("join");
            i.putExtra("meetingid", meetingIdGlo);
            i.putExtra("meetingpass", meetingPassGlo);
            i.putExtra("callfrom", meetingCallfrom);
            App.getContext().startActivity(i);
        }

        private void sendMessagetoBroadcast(String msgKey,String msgValue) {
            Log.d("sender", "Broadcasting message");
            Intent intent = new Intent("zoom-event-receiver");
            intent.putExtra("keytype", msgKey);
            intent.putExtra("jsonData",msgValue);
            LocalBroadcastManager.getInstance(App.getContext()).sendBroadcast(intent);
        }
    }
}
