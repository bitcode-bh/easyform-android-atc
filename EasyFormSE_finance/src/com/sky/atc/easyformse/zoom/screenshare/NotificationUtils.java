package com.sky.atc.easyformse.zoom.screenshare;

import android.annotation.SuppressLint;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.util.Log;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;
import com.sky.atc.easyformse.sqlitewraper;

import org.json.JSONObject;


public class NotificationUtils {

    private static String meetingIdGlo;
    private static String meetingPassGlo;
    private static String meetingCallfrom;
    private static String remoteTokenNew;
    private static String deviceTypeNew;

    @SuppressLint("WrongConstant")
    public static void callalertNotification(String meetinId, String meetingPass, String callfrrom, String remoteToken, String deviceType) {

        Log.d("##FCM", "callalertNotification: " + "1");
        meetingIdGlo = meetinId;
        meetingPassGlo = meetingPass;
        meetingCallfrom = callfrrom;

        remoteTokenNew = remoteToken;
        deviceTypeNew = deviceType;

//        Uri sound = Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE + "://" + sqlitewraper.context.getPackageName() + "/" + R.raw.emergencytone);
        NotificationChannel channel;

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {

            Log.d("##FCM", "callalertNotification: " + "2");
            AudioAttributes attributes;
            attributes = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                    .build();
            channel = new NotificationChannel("channel01", "name", NotificationManager.IMPORTANCE_HIGH);
            channel.setDescription("description");
//            channel.setSound(sound, attributes);
            NotificationManager notificationManager = sqlitewraper.context.getSystemService(NotificationManager.class);
            notificationManager.createNotificationChannel(channel);
            Log.d("##FCM", "callalertNotification: " + "3");
        }

        Log.d("##FCM", "callalertNotification: " + "4");
        //For Action Button Click event
        Intent intentAction = new Intent(sqlitewraper.context, ActionReceiver.class);
        //This is optional if you have more than one buttons and want to differentiate between two
        intentAction.putExtra("action", "reject");
        PendingIntent pIntentlogin = PendingIntent.getBroadcast(sqlitewraper.context, 1, intentAction, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Log.d("##FCM", "callalertNotification: " + "5");

        Intent intentActionAnswer = new Intent(sqlitewraper.context, ActionReceiver.class);
        //This is optional if you have more than one buttons and want to differentiate between two
        intentActionAnswer.putExtra("action", "accept");
        PendingIntent pIntentloginAccept = PendingIntent.getBroadcast(sqlitewraper.context, 2, intentActionAnswer, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Intent notifyIntent = null;
        try {
            notifyIntent = new Intent(sqlitewraper.context, Class.forName("com.example.easyformzoom.zoom.ui.IncomingCallActivity"));
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        }
        if (notifyIntent != null) {
            notifyIntent.setAction("open");
            notifyIntent.putExtra("meetingid", meetinId);
            notifyIntent.putExtra("meetingpass", meetingPass);
            notifyIntent.putExtra("callfrom", callfrrom);
            notifyIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            PendingIntent notifyPendingIntent = PendingIntent.getActivity(
                    sqlitewraper.context, 0, notifyIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

// Register channel with system
            Notification notification = new NotificationCompat.Builder(sqlitewraper.context, "channel01")
                    .setSmallIcon(android.R.drawable.ic_dialog_info)
                    .setContentTitle(callfrrom + " is calling...")
                    .setContentText("You have a new meeting please respond to it.")
//                .setSound(sound)
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
            NotificationManagerCompat notificationManager1 = NotificationManagerCompat.from(sqlitewraper.context);
            notificationManager1.notify(202, notification);
        }
    }

    public static class ActionReceiver extends BroadcastReceiver {

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
                    sendMessagetoBroadcast("pushar", jsonObject.toString());
                } catch (Exception e) {
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
            NotificationManagerCompat notificationManager1 = NotificationManagerCompat.from(sqlitewraper.context);
            notificationManager1.cancel(202);
        }

        public void openCallActivity() {
            Intent i = null;
            try {
                i = new Intent(sqlitewraper.context, Class.forName("com.example.easyformzoom.zoom.ui.IncomingCallActivity"));
            } catch (ClassNotFoundException e) {
                e.printStackTrace();
            }
            if (i != null) {
                i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                i.setAction("join");
                i.putExtra("meetingid", meetingIdGlo);
                i.putExtra("meetingpass", meetingPassGlo);
                i.putExtra("callfrom", meetingCallfrom);
                sqlitewraper.context.startActivity(i);
            }
        }

        private void sendMessagetoBroadcast(String msgKey, String msgValue) {
            Log.d("sender", "Broadcasting message");
            Intent intent = new Intent("zoom-event-receiver");
            intent.putExtra("keytype", msgKey);
            intent.putExtra("jsonData", msgValue);
            LocalBroadcastManager.getInstance(sqlitewraper.context).sendBroadcast(intent);
        }
    }
}
