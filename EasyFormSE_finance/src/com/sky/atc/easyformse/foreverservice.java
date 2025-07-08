package com.sky.atc.easyformse;

import java.text.SimpleDateFormat;
import java.util.Date;

import android.annotation.SuppressLint;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import net.sqlcipher.database.SQLiteDatabase;
import android.os.Build;
import android.os.IBinder;
import androidx.core.app.NotificationCompat;

import io.michaelrocks.paranoid.Obfuscate;

//For Showing Upload pending Notification
@Obfuscate
public class foreverservice extends Service {
    private static final String TAG = "Forever Service";
    SQLiteDatabase database = sqlitewraper.getDatabase();
    String imei = "";
    Cursor c, c1, c2;
    int pm, onm, acquisition, ddv1;
    NotificationManager notificationManager = null;
    private static NotificationChannel mChannel = null;
    private static String CHANNEL_ID = "my_channel_01";

    @Override
    public IBinder onBind(Intent arg0) {
        // TODO Auto-generated method stub
        return null;
    }

    @Override
    public void onCreate() {
    }

    @SuppressLint("WrongConstant")
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        c = database
                .rawQuery(
                        "select tid,siteid,checksheetid,height,tower_type,server_task_id,status,step from task_master where flag='1'",
                        null);

        c.moveToFirst();
        int count = c.getCount();
        c.close();

        c1 = database.rawQuery("select * from f_master where flag='0'", null);

        c1.moveToFirst();
        int count1 = c1.getCount();
        c1.close();

        c2 = database.rawQuery("select * from p_master where flag='0'", null);

        c2.moveToFirst();
        int count2 = c2.getCount();
        c2.close();

        //This specific block of code is for atc
        {
            pm = count(1); // flowid = 1
            acquisition = count(2);
            onm = count(3);
            ddv1 = count(5);
            // notify1();
            //
            // String MyNotificationText = "PM:" + pm + " DDV1:" + pm
            // + " site acqusition:'" + onm + "' ";
            String pm_s = " PM: " + pm;
            String Site_ac = " Acquisition: " + acquisition;
            String onm_s = " O&M: " + onm;
            String DDV1_s = " DDV1: " + ddv1;
            if (pm > 0) {
//            notification(pm_s, 2);
                generateNotification(sqlitewraper.context, pm_s, 2);
            }
            if (onm > 0) {
//            notification(onm_s, 3);
                generateNotification(sqlitewraper.context, onm_s, 3);
            }
            if (ddv1 > 0) {
//            notification(DDV1_s, 4);
                generateNotification(sqlitewraper.context, onm_s, 3);

            }
            if (acquisition > 0) {
//            notification(Site_ac, 5);
                generateNotification(sqlitewraper.context, Site_ac, 3);

            }
        }
//        NotificationManager notificationManager = null;
        // if pending survey 0 then send notification for upload pending survey
        if (count > 0) {


            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                CharSequence name = "Easyform";// The user-visible name of the channel.
                int importance = NotificationManager.IMPORTANCE_HIGH;
                mChannel = new NotificationChannel(CHANNEL_ID, name, importance);

            }


            int icon = R.drawable.atc_logo;
            long when = System.currentTimeMillis();

            Intent intent1 = new Intent(sqlitewraper.context, ph_s1.class);
            intent1.putExtra("extra_bypass", "3");
            PendingIntent contentIntent = PendingIntent.getActivity(sqlitewraper.context, 0, intent1, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            String MyNotificationTitle = "Easy Form - Pending Site";
            NotificationCompat.Builder b = new NotificationCompat.Builder(sqlitewraper.context);

            b.setAutoCancel(true)
                    .setDefaults(Notification.DEFAULT_ALL)
                    .setWhen(System.currentTimeMillis())
                    .setSmallIcon(icon)
                    .setContentTitle("Easy Form")
                    .setContentText(count
                        + " surveys are pending to upload ")
                    .setDefaults(Notification.DEFAULT_LIGHTS | Notification.DEFAULT_SOUND)
                    .setContentIntent(contentIntent)
                    .setChannelId(CHANNEL_ID)
                    .setContentInfo("Info");


            notificationManager = (NotificationManager) sqlitewraper.context.getSystemService(Context.NOTIFICATION_SERVICE);


            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                notificationManager.createNotificationChannel(mChannel);
            }

            notificationManager.notify(6, b.build());




//            mManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
//            Notification notification = new Notification(R.drawable.atc_logo,
//                    "Easy Form - Upload Pending Survey: " + count,
//                    System.currentTimeMillis());
//
//            notification.flags |= Notification.FLAG_AUTO_CANCEL;
//            Intent dialogIntent = new Intent(this, ph_s1.class);
//            dialogIntent.putExtra("extra_bypass", "3");
//            // dialogIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
//            dialogIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
//
//
//            if (android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.HONEYCOMB) {
//                notification.setLatestEventInfo(getBaseContext(), "Easy Form", count
//                        + " surveys are pending to upload ", PendingIntent
//                        .getActivity(this.getBaseContext(), 0, dialogIntent,
//                                PendingIntent.FLAG_UPDATE_CURRENT));
//                // startForeground(6, notification);
//
//                mManager.notify(6, notification);
//            } else {
//
//
//            }
        } else {

            if (notificationManager != null) {
                notificationManager.cancel(6);

            }

        }
        return START_STICKY;
    }

    // find task for particular flow where end_of_date is < current date
    int count(Integer moduleid) {
        Date date = new Date();
        String modifiedDate = new SimpleDateFormat("yyyy/MM/dd").format(date);
        Cursor c_pm = database.rawQuery(
                "select * from task_master where moduleid= '" + moduleid
                        + "' and status !='2' and end_of_date<" + modifiedDate,
                null);
        c_pm.moveToFirst();
        int count3 = c_pm.getCount();
        c_pm.close();
        return count3;
    }

    // notify user
//    void notification(String myString, int id) {
//        NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
//
//        String MyText = "Reminder";
//        Notification mNotification = new Notification(R.drawable.atc_logo,
//                MyText, System.currentTimeMillis());
//        mNotification.flags |= Notification.FLAG_AUTO_CANCEL;
//        // The three parameters are: 1. an icon, 2. a title, 3. time when the
//        // notification appears
//
//        String MyNotificationTitle = "Easy Form - Pending Site";
//
//        NotificationCompat.InboxStyle inboxStyle = new NotificationCompat.InboxStyle();
//
//        // inboxStyle.addLine("PM:" + pm);
//        // inboxStyle.addLine("PM:" + pm);
//
//        Intent MyIntent = new Intent(sqlitewraper.context, ph_s.class);
//        MyIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
//        PendingIntent StartIntent = PendingIntent.getActivity(
//                getApplicationContext(), 0, MyIntent,
//                PendingIntent.FLAG_CANCEL_CURRENT);
//        // A PendingIntent will be fired when the notification is clicked. The
//        // FLAG_CANCEL_CURRENT flag cancels the pendingintent
//
//        mNotification.setLatestEventInfo(getApplicationContext(),
//                MyNotificationTitle, myString, StartIntent);
//
//        int NOTIFICATION_ID = 1;
//        notificationManager.notify(id, mNotification);
//    }
    @SuppressLint("WrongConstant")
    private static void generateNotification(Context context, String message, int id) {

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            CharSequence name = "Easyform";// The user-visible name of the channel.
            int importance = NotificationManager.IMPORTANCE_HIGH;
            mChannel = new NotificationChannel(CHANNEL_ID, name, importance);

        }

        int icon = R.drawable.atc_logo;
        long when = System.currentTimeMillis();

        Intent intent = new Intent(context, ph_s.class);
        PendingIntent contentIntent = PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        String MyNotificationTitle = "Easy Form - Pending Site";
        NotificationCompat.Builder b = new NotificationCompat.Builder(context);

        b.setAutoCancel(true)
                .setDefaults(Notification.DEFAULT_ALL)
                .setWhen(System.currentTimeMillis())
                .setSmallIcon(icon)
                .setTicker("ATC")
                .setContentTitle("MyNotificationTitle")
                .setContentText(message)
                .setDefaults(Notification.DEFAULT_LIGHTS | Notification.DEFAULT_SOUND)
                .setContentIntent(contentIntent)
                .setChannelId(CHANNEL_ID)
                .setContentInfo("Info");


        NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            notificationManager.createNotificationChannel(mChannel);
        }
        notificationManager.notify(id, b.build());
    }


}
