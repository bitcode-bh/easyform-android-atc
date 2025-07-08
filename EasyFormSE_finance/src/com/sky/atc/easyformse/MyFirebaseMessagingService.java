package com.sky.atc.easyformse;


import static com.sky.atc.easyformse.sqlitewraper.context;
import static com.sky.atc.easyformse.sqlitewraper.mainactivity;

import android.annotation.SuppressLint;
import android.app.ActivityManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.TaskStackBuilder;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.res.Resources;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.media.RingtoneManager;
import android.os.AsyncTask;
import android.os.Build;
import android.os.Bundle;
import android.os.FileUtils;
import android.os.Handler;
import android.os.Looper;
import android.os.PowerManager;
import android.util.DisplayMetrics;
import android.util.Log;
import android.widget.RemoteViews;
import android.widget.Toast;

import androidx.core.app.NotificationCompat;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import com.commonsware.cwac.wakeful.WakefulIntentService;
//import com.easyform.jitsi.utils.drawing.App;
import com.google.ar.sceneform.samples.hellosceneform.HelloSceneformActivity;
import com.google.firebase.BuildConfig;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.download.DownloadListService;
import com.sky.atc.easyformse.mapview.CurrentLocation;
import com.sky.atc.easyformse.mapview.LocationInterface;
import com.sky.atc.easyformse.mapview.UserMapViewActivity;
import com.sky.atc.easyformse.plugins.JitsiMeetingPlugin;
import com.sky.atc.easyformse.trip.FloatingBubbleService;
import com.sky.atc.easyformse.zoom.firebase.SendPushNotification;
import com.sky.atc.easyformse.zoom.screenshare.MessageReceivedUtils;
import com.sky.atc.easyformse.zoom.screenshare.Utils;

import net.sqlcipher.database.SQLiteDatabase;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Map;

import io.michaelrocks.paranoid.Obfuscate;

//Firebase push notification receiver
@Obfuscate
public class MyFirebaseMessagingService extends FirebaseMessagingService {

    SQLiteDatabase database;
    MySharedPreferences pref;
    String message = null;

    JSONArray DBInfo = null;

    private static final String TAG = "MyFirebaseMsgService";

    private static NotificationChannel mChannel = null;
    private static String CHANNEL_ID = "my_channel_01";
    private LocationInterface iocationInterface;
    private LocalBroadcastManager broadcaster;
    boolean toastShown;
    SharedPreferences preferences;
    @Override
    public void onCreate() {
        super.onCreate();
        broadcaster = LocalBroadcastManager.getInstance(this);
    }

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {

        Log.d("##FCM", "onMessageReceived: " + remoteMessage.getData());

        Map<String, String> data = remoteMessage.getData();
        /*String customData = data.get("body");
        String title2 = data.get("title");*/

        MessageReceivedUtils.messageDetailsCheck(getApplicationContext(), remoteMessage);

        if (data.containsKey("videocallType")) {
            if (data.get("videocallType").matches("jitsiMeet")) {
                try {
                    Intent jitsiPluginBroadcast = null;
                    try {
                        jitsiPluginBroadcast = new Intent(getApplicationContext(), Class.forName(JitsiMeetingPlugin.JitsiPluginBroadcastClass));
                    } catch (ClassNotFoundException e) {
                        e.printStackTrace();
                    }
                    ArrayList<String> loginDetails = DeviceEventsUtils.getLoginDetails();
                    ArrayList<String> loginfcmid = DeviceEventsUtils.getFCMID();
                    JSONObject loginJson = new JSONObject();
                    if (loginDetails.size() > 4) {
                        loginJson.put("appVersion", BuildConfig.VERSION_NAME);
                        loginJson.put("userId", loginDetails.get(0));
                        loginJson.put("imei", loginDetails.get(1));
                        loginJson.put("appId", loginDetails.get(2));
                        loginJson.put("username", loginDetails.get(3));
                        loginJson.put("companyId", loginDetails.get(4));
                        loginJson.put("uc", new B_new().GetValue());
                        loginJson.put("senderfcmid", loginfcmid.get(0));
                        Log.d("loginDetails :: ", loginJson + "");
                    }
                    String WCFURL = sqlitewraper.context.getResources().getString(R.string.WCFURL) + "JwtToken/JwtToken_String";
                    if (jitsiPluginBroadcast != null) {
                        jitsiPluginBroadcast.setAction("com.easyform.newjitsi.notification");
//                        jitsiPluginBroadcast.putExtra("Args", args.toString());
                        jitsiPluginBroadcast.putExtra("Url", WCFURL);
                        jitsiPluginBroadcast.putExtra("remoteMessageData", new JSONObject(data).toString());
                        jitsiPluginBroadcast.putExtra("loginJson", loginJson.toString());
                        sqlitewraper.context.sendBroadcast(jitsiPluginBroadcast);
                    }
                } catch (JSONException e) {
                    e.printStackTrace();
                }
            }
            else if (data.get("videocallType").matches("jitsiMeetreject")) {
                try {

                    Intent jitsiPluginBroadcast = null;
                    try {
                        jitsiPluginBroadcast = new Intent(getApplicationContext(), Class.forName(JitsiMeetingPlugin.JitsiPluginBroadcastClass));
                    } catch (ClassNotFoundException e) {
                        e.printStackTrace();
                    }

                    ArrayList<String> loginDetails = DeviceEventsUtils.getLoginDetails();
                    ArrayList<String> loginfcmid = DeviceEventsUtils.getFCMID();
                    JSONObject loginJson = new JSONObject();
                    if (loginDetails.size() > 4) {
                        loginJson.put("appVersion", BuildConfig.VERSION_NAME);
                        loginJson.put("userId", loginDetails.get(0));
                        loginJson.put("imei", loginDetails.get(1));
                        loginJson.put("appId", loginDetails.get(2));
                        loginJson.put("username", loginDetails.get(3));
                        loginJson.put("companyId", loginDetails.get(4));
                        loginJson.put("uc", new B_new().GetValue());
                        loginJson.put("senderfcmid", loginfcmid.get(0));
                        Log.d("loginDetails :: ", loginJson + "");
                    }
                    String WCFURL = sqlitewraper.context.getResources().getString(R.string.WCFURL) + "JwtToken/JwtToken_String";
                    if (jitsiPluginBroadcast != null) {
                        jitsiPluginBroadcast.setAction("com.easyform.jitsi.rejectnotification");
//                        jitsiPluginBroadcast.putExtra("Args", args.toString());
                        jitsiPluginBroadcast.putExtra("Url", WCFURL);
                        jitsiPluginBroadcast.putExtra("remoteMessageData", new JSONObject(data).toString());
                        jitsiPluginBroadcast.putExtra("loginJson", loginJson.toString());
                        sqlitewraper.context.sendBroadcast(jitsiPluginBroadcast);
                    }
                } catch (JSONException e) {
                    e.printStackTrace();
                }
            }
            else if (data.get("videocallType").matches("jitsimeetScreenShare")) {





                try {

                    Intent jitsiPluginBroadcast = null;
                    try {
                        jitsiPluginBroadcast = new Intent(getApplicationContext(), Class.forName(JitsiMeetingPlugin.JitsiPluginBroadcastClass));
                    } catch (ClassNotFoundException e) {
                        e.printStackTrace();
                    }

                    ArrayList<String> loginDetails = DeviceEventsUtils.getLoginDetails();
                    ArrayList<String> loginfcmid = DeviceEventsUtils.getFCMID();
                    JSONObject loginJson = new JSONObject();
                    if (loginDetails.size() > 4) {
                        loginJson.put("appVersion", BuildConfig.VERSION_NAME);
                        loginJson.put("userId", loginDetails.get(0));
                        loginJson.put("imei", loginDetails.get(1));
                        loginJson.put("appId", loginDetails.get(2));
                        loginJson.put("username", loginDetails.get(3));
                        loginJson.put("companyId", loginDetails.get(4));
                        loginJson.put("uc", new B_new().GetValue());
                        loginJson.put("senderfcmid", loginfcmid.get(0));
                        Log.d("loginDetails :: ", loginJson + "");
                    }
                    String WCFURL = sqlitewraper.context.getResources().getString(R.string.WCFURL) + "JwtToken/JwtToken_String";
                    if (jitsiPluginBroadcast != null) {
                        jitsiPluginBroadcast.setAction("com.easyform.jitsi.ScreenshareAccept");
                        jitsiPluginBroadcast.putExtra("Url", WCFURL);
                        jitsiPluginBroadcast.putExtra("remoteMessageData", new JSONObject(data).toString());
                        jitsiPluginBroadcast.putExtra("loginJson", loginJson.toString());
                        sqlitewraper.context.sendBroadcast(jitsiPluginBroadcast);
                    }
                } catch (JSONException e) {
                    e.printStackTrace();
                }

            }
            else if (data.get("videocallType").equalsIgnoreCase("ARDAW")) {



                Intent jitsiPluginBroadcast = null;
                try {
                    jitsiPluginBroadcast = new Intent(getApplicationContext(), Class.forName(JitsiMeetingPlugin.JitsiPluginBroadcastClass));
                } catch (ClassNotFoundException e) {
                    e.printStackTrace();
                }
                Log.d("RemoteData", new JSONObject(data).toString());
                jitsiPluginBroadcast.setAction("com.easyform.jitsi.Jitsi-event_broadcast-noti");
                jitsiPluginBroadcast.putExtra("remoteMessageData", new JSONObject(data).toString());
                sqlitewraper.context.sendBroadcast(jitsiPluginBroadcast);

//                remotesize
            }
            else if (data.get("videocallType").matches("remotesize")) {
                Intent jitsiPluginBroadcast = null;
                try {
                    jitsiPluginBroadcast = new Intent(getApplicationContext(), Class.forName(JitsiMeetingPlugin.JitsiPluginBroadcastClass));
                } catch (ClassNotFoundException e) {
                    e.printStackTrace();
                }
                jitsiPluginBroadcast.setAction("com.easyform.jitsi.sizeRemote");
                jitsiPluginBroadcast.putExtra("remoteMessageData", new JSONObject(data).toString());
                sqlitewraper.context.sendBroadcast(jitsiPluginBroadcast);
            }

        }
        super.onMessageReceived(remoteMessage);

        handleMessage(data);

    }


    public JSONArray getDBValuesListing(String query) throws JSONException {

        Cursor c = database.rawQuery(query, null);
        c.moveToFirst();
        String t;
        String t1;
        ArrayList<JSONObject> list = new ArrayList<>();

        String imei = DeviceEventsUtils.getImei();

        for (int i = 0; i < c.getCount(); i++) {
            JSONObject obj = new JSONObject();

            t = "";
            for (int j = 0; j < c.getColumnCount(); j++) {
                t1 = c.getString(j);
                if (t1 == null) {
                    obj.put(c.getColumnName(j), "Unknown");
                    t = t + " ";
                } else {
                    t = t + t1;

                    obj.put(c.getColumnName(j), t1);

                }
            }
            obj.put("imei", imei);
            list.add(obj);

            c.moveToNext();
            Log.v("sqlitePlugin", obj + " " + t);
        }
        c.close();

        int length = 0;
        JSONArray jsArray;
        jsArray = new JSONArray(list);

        return jsArray;

    }

    @SuppressLint("WrongConstant")
    private void Notification(String notificationTitle,
                              String notificationMessage) {


        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            CharSequence name = "Easyform";// The user-visible name of the channel.
            int importance = NotificationManager.IMPORTANCE_HIGH;
            mChannel = new NotificationChannel(CHANNEL_ID, name, importance);

        }


        NotificationCompat.Builder mBuilder = new NotificationCompat.Builder(
                this);

        RemoteViews contentView = new RemoteViews(getPackageName(), R.layout.custom_notification);
        Bitmap bmURL = BitmapFactory.decodeResource(this.getResources(), R.drawable.atc_logo);
        float multiplier = getImageFactor(getResources());
        bmURL = Bitmap.createScaledBitmap(bmURL, (int) (bmURL.getWidth() * multiplier), (int) (bmURL.getHeight() * multiplier), false);
        if (bmURL != null) {
            mBuilder.setLargeIcon(bmURL);
            contentView.setImageViewBitmap(R.id.image, bmURL);
        }
        if(notificationTitle!=null && !notificationTitle.isEmpty()) {
            contentView.setTextViewText(R.id.Notiy_title, notificationTitle);
        }
        if(notificationMessage!=null && !notificationMessage.isEmpty()) {
            contentView.setTextViewText(R.id.Notiy_Text, notificationMessage);
        }
        mBuilder.setSmallIcon(R.drawable.atc_logo)
                .setContentTitle(notificationTitle)
                // .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setDefaults(Notification.DEFAULT_SOUND | Notification.DEFAULT_LIGHTS | Notification.DEFAULT_VIBRATE | NotificationCompat.PRIORITY_HIGH)
                .setCustomBigContentView(contentView)
                .setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION))
                .setChannelId(CHANNEL_ID)
                .setOngoing(false)
                .setAutoCancel(true);


        NotificationManager mNotificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        // mId allows you to update the notification later on.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            mNotificationManager.createNotificationChannel(mChannel);
        }
        mNotificationManager.notify(1234, mBuilder.build());
        PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        boolean isScreenOn = Build.VERSION.SDK_INT >= 20 ? pm.isInteractive() : pm.isScreenOn(); // check if screen is on
        if (!isScreenOn) {
            PowerManager.WakeLock wl = pm.newWakeLock(PowerManager.SCREEN_DIM_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP, "myApp:notificationLock");
            wl.acquire(10 * 60 * 1000L /*10 minutes*/); //set your time in milliseconds
            wl.release();
        }



    }


    @SuppressLint("WrongConstant")
    private void Notificationlocation(String notificationTitle,
                              String notificationMessage,String subtitle,String senderid,String receiverid,String Company_Id,String Notitype) {


        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            CharSequence name = "Easyform";// The user-visible name of the channel.
            int importance = NotificationManager.IMPORTANCE_HIGH;
            mChannel = new NotificationChannel(CHANNEL_ID, name, importance);

        }


        NotificationCompat.Builder mBuilder = new NotificationCompat.Builder(
                this);

        RemoteViews contentView = new RemoteViews(getPackageName(), R.layout.custom_notification);
        Bitmap bmURL = BitmapFactory.decodeResource(this.getResources(), R.drawable.atc_logo);
        float multiplier = getImageFactor(getResources());
        bmURL = Bitmap.createScaledBitmap(bmURL, (int) (bmURL.getWidth() * multiplier), (int) (bmURL.getHeight() * multiplier), false);
        if (bmURL != null) {
            mBuilder.setLargeIcon(bmURL);
            contentView.setImageViewBitmap(R.id.image, bmURL);
        }
        if(notificationTitle!=null && !notificationTitle.isEmpty()) {
            contentView.setTextViewText(R.id.Notiy_title, notificationTitle);
        }
        if(notificationMessage!=null && !notificationMessage.isEmpty()) {
            contentView.setTextViewText(R.id.Notiy_Text, notificationMessage);
        }
        mBuilder.setSmallIcon(R.drawable.atc_logo)
                .setContentTitle(notificationTitle)
                // .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setDefaults(Notification.DEFAULT_SOUND | Notification.DEFAULT_LIGHTS | Notification.DEFAULT_VIBRATE | NotificationCompat.PRIORITY_HIGH)
                .setCustomBigContentView(contentView)
                .setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION))
                .setChannelId(CHANNEL_ID)
                .setOngoing(false)
                .setExtras(createCustomlocationExtras(subtitle,senderid,receiverid,Company_Id,Notitype))
                .setAutoCancel(true);


        NotificationManager mNotificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        // mId allows you to update the notification later on.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            mNotificationManager.createNotificationChannel(mChannel);
        }
        mNotificationManager.notify(1234, mBuilder.build());


        PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        boolean isScreenOn = Build.VERSION.SDK_INT >= 20 ? pm.isInteractive() : pm.isScreenOn(); // check if screen is on
        if (!isScreenOn) {
            PowerManager.WakeLock wl = pm.newWakeLock(PowerManager.SCREEN_DIM_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP, "myApp:notificationLock");
            wl.acquire(10 * 60 * 1000L /*10 minutes*/); //set your time in milliseconds
            wl.release();
        }



    }


    private Bundle createCustomlocationExtras(String subtitle,String senderid,String receiverid,String Company_Id,String Notitype) {
        Bundle extras = new Bundle();
        extras.putString("body", subtitle);
        extras.putString("SenderId", senderid);
        extras.putString("ReceiverId", receiverid);
        extras.putString("CompanyId", Company_Id);
        extras.putString("NotiType",Notitype);
        extras.putString("packagename",getApplication().getPackageName());
        return extras;
    }

    @SuppressLint("WrongConstant")
    private void Notification1(String notificationTitle,
                               String notificationMessage, String flow_id, String udf_id,String task_id,String Readnoti,String NotiType) {


        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            CharSequence name = "Easyform";// The user-visible name of the channel.
            int importance = NotificationManager.IMPORTANCE_HIGH;
            mChannel = new NotificationChannel(CHANNEL_ID, name, importance);

        }

        NotificationCompat.Builder mBuilder = new NotificationCompat.Builder(
                this);
        Bitmap bmURL = BitmapFactory.decodeResource(this.getResources(), R.drawable.atc_logo);
        float multiplier = getImageFactor(getResources());
        bmURL = Bitmap.createScaledBitmap(bmURL, (int) (bmURL.getWidth() * multiplier), (int) (bmURL.getHeight() * multiplier), false);
        if (bmURL != null) {
            mBuilder.setLargeIcon(bmURL);
        }
        mBuilder.setSmallIcon(R.drawable.atc_logo)
                .setContentTitle(notificationTitle)
                .setDefaults(Notification.DEFAULT_SOUND | Notification.DEFAULT_LIGHTS | Notification.DEFAULT_VIBRATE | NotificationCompat.PRIORITY_DEFAULT)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(notificationMessage)).setContentText(notificationMessage)
                .setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION))
                .setChannelId(CHANNEL_ID)
                .setOngoing(false)
                .setExtras(createCustomExtras(flow_id,udf_id,task_id,Readnoti,NotiType))
                .setAutoCancel(false);
        // Creates an explicit intent for an Activity in your app
        Intent resultIntent = new Intent(this, select_view.class).putExtra("flow_id", flow_id).putExtra("udf_id", udf_id).putExtra("task_id",task_id).putExtra("Readnoti",Readnoti);

        // The stack builder object will contain an artificial back stack for
        // the
        // started Activity.
        // This ensures that navigating backward from the Activity leads out of
        // your application to the Home screen.
        TaskStackBuilder stackBuilder = TaskStackBuilder.create(this);
        // Adds the back stack for the Intent (but not the Intent itself)
        stackBuilder.addParentStack(select_view.class);
        // Adds the Intent that starts the Activity to the top of the stack
        stackBuilder.addNextIntent(resultIntent);
        PendingIntent resultPendingIntent = stackBuilder.getPendingIntent(0,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        mBuilder.setContentIntent(resultPendingIntent);
        NotificationManager mNotificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            mNotificationManager.createNotificationChannel(mChannel);
        }
        // mId allows you to update the notification later on.
        mNotificationManager.notify(1234, mBuilder.build());
//        startForeground(1234, mBuilder.build());

        PowerManager pm = (PowerManager) sqlitewraper.context.getSystemService(Context.POWER_SERVICE);
        boolean isScreenOn = Build.VERSION.SDK_INT >= 20 ? pm.isInteractive() : pm.isScreenOn(); // check if screen is on
        if (!isScreenOn) {
            PowerManager.WakeLock wl = pm.newWakeLock(PowerManager.SCREEN_DIM_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP, "myApp:notificationLock");
            wl.acquire(3000); //set your time in milliseconds
        }




    }

    private Bundle createCustomExtras(String flow_id,String udf_id,String task_id,String Readnoti,String NotiType) {
        Bundle extras = new Bundle();
        extras.putString("flow_id", flow_id);
        extras.putString("udf_id", udf_id);
        extras.putString("task_id", task_id);
        extras.putString("Readnoti", Readnoti);
        extras.putString("NotiType",NotiType);
        extras.putString("packagename",getApplication().getPackageName());
        return extras;
    }

    public static float getImageFactor(Resources r) {
        DisplayMetrics metrics = r.getDisplayMetrics();
        float multiplier = metrics.density / 4f;
        return multiplier;
    }


    private void handleMessage(Map<String, String> data) {
        database = sqlitewraper.getDatabase();
        pref = sqlitewraper.getSecureShared("MyPref");
//        SharedPreferences.Editor editor = pref.edit();

        try {
            database = sqlitewraper.getDatabase();

            String message = data.get("message");

            String query12 = data.get("query");
            int CompanyId = Integer.parseInt(data.get("CompanyId"));

            Cursor c4 = database.rawQuery(
                    "SELECT username,u_c,company_id FROM  Login_Master", null);
            c4.moveToLast();
            int company_id = 0;
            if (c4.getCount() > 0) {
                String username = c4.getString(0);
                String u_c = c4.getString(1);
                company_id = c4.getInt(2);
            }
            System.out.print(query12);
            c4.close();
            if (company_id == CompanyId) {

                if (message.equalsIgnoreCase("Download")) {
                    Intent i = new Intent(sqlitewraper.context,
                            DownloadListService.class);
                    WakefulIntentService.sendWakefulWork(sqlitewraper.context, i);

                }

                if (message.equalsIgnoreCase("Redirect")) {

                    String title = data.get("title");
                    String subtitle = data.get("subtitle");
                    String flow_id = data.get("flow_id");
                    String udf_id = data.get("udf_id");
                    String task_id = data.get("task_id");
                    String Readnoti = data.get("ReadNoti");
                    String flow_name = "";
                    String flow_type = "";
                    String udf_data = "";

                    boolean check = isMyServiceRunning(sqlitewraper.context,
                            DownloadListService.class.getName());
                    if (!check) {
                        Intent z_n12 = new Intent(sqlitewraper.context,
                                DownloadListService.class);
                        WakefulIntentService.sendWakefulWork(sqlitewraper.context,
                                z_n12);
                    }
                    boolean check1 = isMyServiceRunning(sqlitewraper.context,
                            NotificationListener.class.getName());
                    if (!check1) {

                        Intent mIntent = new Intent(sqlitewraper.context, NotificationListener.class);
                        sqlitewraper.context.startService(mIntent);
                    }
                    Notification1(title, subtitle, flow_id, udf_id,task_id,Readnoti,message);

                }
                if (message.equalsIgnoreCase("Notification")) {
                    String title = data.get("title");
                    String subtitle = data.get("subtitle");
                    Notification(title, subtitle);
                }


                Cursor c3 = database.rawQuery("SELECT username,u_c FROM  Login_Master", null);
                c3.moveToLast();
                String username = null;

                String time;
                time = (java.text.DateFormat.getDateTimeInstance().format(Calendar
                        .getInstance().getTime()));

                if (c3.getCount() > 0) {
                    username = c3.getString(0);
                }
                c3.close();
                if (message.contains("SHOW_DB_VALUES_ACTION")) {

                    DBInfo = getDBValuesListing(query12);

                    ContentValues d_insr = new ContentValues();
                    d_insr.put("username", username);
                    d_insr.put("Type", "QUERY" + DBInfo.toString());
                    d_insr.put("time", time);
                    d_insr.put("flag", "0");
                    d_insr.put("status", company_id);
                    long temp = database.insert("upload_file_clone", null, d_insr);
                    fcmDataUpload();
                }

                if (message.contains("insertValuse")) {

                    if (sqlitewraper.internetflag == 1) {

                        int flag = 0;
                        try {
                            flag = 1;
                            database.execSQL(query12);

                        } catch (Exception e) {
                            flag = 2;
                            // TODO: handle exception
                        }

                        ContentValues d_insr = new ContentValues();
                        d_insr.put("username", username);
                        if (flag == 1) {
                            d_insr.put("Type", "QUERY" + "Success");
                        }
                        if (flag == 2) {
                            d_insr.put("Type", "QUERY" + "fail");
                        }
                        d_insr.put("time", time);
                        d_insr.put("flag", "0");
                        d_insr.put("status", company_id);
                        long temp = database.insert("upload_file_clone", null,
                                d_insr);
                        temp++;

                        Intent i = new Intent(sqlitewraper.context,
                                upload_clone.class);
                        WakefulIntentService.sendWakefulWork(sqlitewraper.context,
                                i);

                    }
                }
                if (message.equalsIgnoreCase("uploadDb")) {
                    new GetDbUploadAsync().execute("");
                }
                if (message.equalsIgnoreCase("uploadLog")) {
                    DeviceEventsUtils.uploadErrorLog();
                }
                if (message.equalsIgnoreCase("uploadForce")) {

                    boolean check = isMyServiceRunning(sqlitewraper.context,
                            f_upload_new_structure.class.getName());
                    if (!check) {
                        Intent z_n12 = new Intent(sqlitewraper.context,
                                f_upload_new_structure.class);
                        WakefulIntentService.sendWakefulWork(sqlitewraper.context,
                                z_n12);
                    }
                }

                //share user lat long with another app to show live location on map like UBER
                if (message.equalsIgnoreCase("UserLatLong")) {
                    String title = data.get("title");
                    String subtitle = data.get("body");
                    String senderid = data.get("SenderId");
                    String receiverid = data.get("ReceiverId");
                    String Company_Id = data.get("CompanyId");
                    String IssendCurrent = data.get("IssendCurrent");

//                    boolean check1 = isMyServiceRunning(sqlitewraper.context,
//                            NotificationListener.class.getName());
//                    if (check1) {
//
//                        Intent mIntent = new Intent(sqlitewraper.context, NotificationListener.class);
//                        sqlitewraper.context.startService(mIntent);
//                    }
                    Notificationlocation("Easyform", "Your data is being Shared",subtitle,senderid,receiverid,Company_Id,"UserLatLong");
                     preferences = context.getSharedPreferences("MyPrefs", Context.MODE_PRIVATE);
                     toastShown = preferences.getBoolean("toastShown", false);
                    if(!toastShown) {
                        if (IssendCurrent.equalsIgnoreCase("true")) {
                            new Handler(Looper.getMainLooper()).post(() -> Toast.makeText(sqlitewraper.context, "Location Received.", Toast.LENGTH_SHORT).show());

                        } else {
                            new Handler(Looper.getMainLooper()).post(() -> Toast.makeText(sqlitewraper.context, "Request Received.", Toast.LENGTH_SHORT).show());

                        }
                    }
//                    //This will send current location as reply to the request
//                    //Initialize the service to send location continuously if body is blank
                    if (subtitle.equalsIgnoreCase("")) {

                        Intent i = new Intent(sqlitewraper.context, CurrentLocation.class);
                        i.putExtra("senderid", senderid);
                        i.putExtra("receiverid", receiverid);
                        i.putExtra("Company_Id", Company_Id);
                        sqlitewraper.context.startService(i);

                    } else {
                        //This will update the opponent location in map through broadcast
                        //If body is available we are receiving location from opponent user
                        String[] separated = subtitle.split(" ");
                        String lat = separated[0];
                        String lng = separated[1];
                        Intent intent = new Intent("MyData");
                        intent.putExtra("lat", lat);
                        intent.putExtra("lng", lng);
                        broadcaster.sendBroadcast(intent);

                    }
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
            // TODO: handle exception
        }

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

    private static class GetDbUploadAsync extends AsyncTask<String, String, String> {


        @Override
        protected void onPreExecute() {
        }

        @Override
        protected String doInBackground(String... postParams) {
            DeviceEventsUtils.exportDB();
            return null;
        }

        @Override
        protected void onPostExecute(String status) {
            super.onPostExecute(status);
            Toast.makeText(sqlitewraper.context, "Backup Successful!",
                    Toast.LENGTH_SHORT).show();
        }
    }

    private void fcmDataUpload() {

        Intent i = new Intent(sqlitewraper.context,
                upload_clone.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            sqlitewraper.context.startForegroundService(i);
        } else {
            sqlitewraper.context.startService(i);
        }
    }
}