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
import android.os.Handler;
import android.os.Looper;
import android.os.PowerManager;
import android.util.DisplayMetrics;
import android.util.Log;
import android.widget.RemoteViews;
import android.widget.Toast;

import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import com.commonsware.cwac.wakeful.WakefulIntentService;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.download.DownloadListService;
import com.sky.atc.easyformse.mapview.CurrentLocation;
import com.sky.atc.easyformse.mapview.LocationInterface;
import com.sky.atc.easyformse.plugins.JitsiMeetingPlugin;

import com.sky.atc.easyformse.zoom.screenshare.MessageReceivedUtils;

import net.sqlcipher.database.SQLiteDatabase;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Map;


import com.github.megatronking.stringfog.annotation.StringFogIgnore;

//Firebase push notification receiver
@StringFogIgnore
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


        if (data.containsKey("videocallType")) {
            Log.d("remoteMessage :: ", new JSONObject(data) + "");
            if (data.get("videocallType").matches("jitsiMeet")) {
                try {
                    MySharedPreferences prefs = sqlitewraper.getSecureShared("mypre2");
                    String roleid = prefs.getString("authroleidn", "0");
                    String companyFeatureid = prefs.getString("authcompanyfid", "0");
                    ArrayList<String> loginDetails = DeviceEventsUtils.getLoginDetails();
                    ArrayList<String> loginUserFcmDataList = DeviceEventsUtils.getFCMID();

                    JSONObject apiAuth = new JSONObject();
                    apiAuth.put("username", loginDetails.get(3));
                    apiAuth.put("u_c", new B_new().GetValue());
                    apiAuth.put("user_id", loginDetails.get(0));

                    JSONObject loginUserData = new JSONObject();
                    loginUserData.put("FCM_Token", loginUserFcmDataList.get(0));
                    loginUserData.put("UNIQUE_KEY", new B_new().GetValue());
                    loginUserData.put("COMPANY_FEATURE_ID", companyFeatureid);
                    loginUserData.put("ROLE_ID", roleid);


                    if (loginDetails.size() > 4) {
                        loginUserData.put("USER_ID", loginDetails.get(0));
                        loginUserData.put("USERNAME", loginDetails.get(3));
                        loginUserData.put("IMEI", loginDetails.get(1));
                        loginUserData.put("APP_ID", loginDetails.get(2));
                        loginUserData.put("COMPANY_ID", loginDetails.get(4));
                        loginUserData.put("APP_VERSION", com.sky.atc.easyformse.BuildConfig.VERSION_NAME);
                        // loginJson.put("servertaskid", servertaskid); get from arges;
                    }
                    JSONObject linkObject = new JSONObject();
                    linkObject.put("link", sqlitewraper.context.getResources().getString(R.string.App_URL));
                    JSONObject fcmOptionsObject = new JSONObject();
                    fcmOptionsObject.put("fcm_options", linkObject);
                    JSONObject webpush = new JSONObject();
                    webpush.put("webpush", fcmOptionsObject);

                    JSONObject otherData = new JSONObject();
                    otherData.put("WEB_PUSH", webpush);
                    //  otherData.put("CLICK_ACTION", "click_action: https://development.easyform.in/WEB,");
                    otherData.put("CLICK_ACTION", sqlitewraper.context.getResources().getString(R.string.App_URL));
                    otherData.put("WCFURL", sqlitewraper.context.getResources().getString(R.string.WCFURL) + "JwtToken/JwtToken_String");
                    otherData.put("USERDATA_FROM_COMPANY_ID_URL", getApplicationContext().getResources().getString(R.string.WCFURL) + "WCF_Getuserdata_using_companyid");
                    otherData.put("Common_Wcf_Url", sqlitewraper.context.getResources().getString(R.string.Common_Wcf_Url) );
//                    otherData.put("role_id",roleid);
                    String jsondata = data.get("args");
                    if(jsondata != null) {
                        JSONArray mJsonArray = new JSONArray(jsondata);
                        JSONObject jsonObject = mJsonArray.getJSONObject(0);
                        JSONArray zoomMeetingArray = jsonObject.getJSONArray("zoom_meeting");
                        otherData.put("server_task_id", zoomMeetingArray.getJSONObject(0).get("task_id"));
                        otherData.put("flow_id",zoomMeetingArray.getJSONObject(0).get("flow_id"));
                        if(zoomMeetingArray.getJSONObject(0).has("site_id")) {
                            otherData.put("site_id", zoomMeetingArray.getJSONObject(0).get("site_id"));
                        }
                        if(zoomMeetingArray.getJSONObject(0).has("start_status")) {
                            otherData.put("start_status", zoomMeetingArray.getJSONObject(0).get("start_status"));
                        }
                        if(zoomMeetingArray.getJSONObject(0).has("role_id")) {
                            otherData.put("role_id", zoomMeetingArray.getJSONObject(0).getString("role_id"));
                        }
                        if(zoomMeetingArray.getJSONObject(0).has("user_id"))
                        {
                            otherData.put("user_id", zoomMeetingArray.getJSONObject(0).getString("user_id"));
                        }
                        if(zoomMeetingArray.getJSONObject(0).has("udf_id"))
                        {
                            otherData.put("udf_id", zoomMeetingArray.getJSONObject(0).getString("udf_id"));
                        }

                    }
                    Intent jitsiPluginBroadcast = null;
                    try {
                        jitsiPluginBroadcast = new Intent(getApplicationContext(), Class.forName(JitsiMeetingPlugin.JITSI_PLUGIN_BROADCAST_CLASS));
                    } catch (ClassNotFoundException e) {
                        e.printStackTrace();
                    }
                    if (jitsiPluginBroadcast != null) {
                        jitsiPluginBroadcast.setAction(JitsiMeetingPlugin.JITSI_BASE_ACTION + "notification");

                        jitsiPluginBroadcast.putExtra("API_AUTH", apiAuth.toString());
                        jitsiPluginBroadcast.putExtra("LOGIN_USER_DATA", loginUserData.toString());
                        jitsiPluginBroadcast.putExtra("OTHER_DATA", otherData.toString());
                        jitsiPluginBroadcast.putExtra("NOTIFICATION_REMOTE_DATA", new JSONObject(data).toString());


                        sqlitewraper.context.sendBroadcast(jitsiPluginBroadcast);
                    }

                } catch (JSONException e) {
                    e.printStackTrace();
                }
            } else if (data.get("videocallType").matches("jitsimeetScreenShare")) {

                Intent jitsiPluginBroadcast = new Intent();
                jitsiPluginBroadcast.setAction(JitsiMeetingPlugin.JITSI_SCREEN_SHEAR_ACTION);
                Boolean screenShear = false;
                try {
                    screenShear = (new JSONObject(data)).getBoolean("screenShear");
                } catch (JSONException e) {
                    throw new RuntimeException(e);
                }

                jitsiPluginBroadcast.putExtra("SHARE_TOGGLE", screenShear);
                LocalBroadcastManager.getInstance(getApplicationContext()).sendBroadcast(jitsiPluginBroadcast);

            } else if (data.get("videocallType").matches("jitsiMeetreject")) {
                Intent jitsiPluginBroadcast = null;
                try {
                    jitsiPluginBroadcast = new Intent(getApplicationContext(), Class.forName(JitsiMeetingPlugin.JITSI_PLUGIN_BROADCAST_CLASS));
                } catch (ClassNotFoundException e) {
                    e.printStackTrace();
                }
                if (jitsiPluginBroadcast != null) {
                    jitsiPluginBroadcast.setAction(JitsiMeetingPlugin.JITSI_BASE_ACTION + "rejectNotification");
                    jitsiPluginBroadcast.putExtra("NOTIFICATION_REMOTE_DATA", new JSONObject(data).toString());
                    sqlitewraper.context.sendBroadcast(jitsiPluginBroadcast);
                }
            } else if (data.get("videocallType").matches("remotesize")) {
                Intent jitsiPluginBroadcast = null;
                try {
                    jitsiPluginBroadcast = new Intent(getApplicationContext(), Class.forName(JitsiMeetingPlugin.JITSI_PLUGIN_BROADCAST_CLASS));
                } catch (ClassNotFoundException e) {
                    e.printStackTrace();
                }
                if (jitsiPluginBroadcast != null) {
                    jitsiPluginBroadcast.setAction(JitsiMeetingPlugin.JITSI_BASE_ACTION + "ScreenSizeRemote");
                    jitsiPluginBroadcast.putExtra("NOTIFICATION_REMOTE_DATA", new JSONObject(data).toString());
                    sqlitewraper.context.sendBroadcast(jitsiPluginBroadcast);
                }
            } else if (data.get("videocallType").equalsIgnoreCase("ARDAW")) {

                Intent jitsiPluginBroadcast = null;
                try {
                    jitsiPluginBroadcast = new Intent(getApplicationContext(), Class.forName(JitsiMeetingPlugin.JITSI_PLUGIN_BROADCAST_CLASS));
                } catch (ClassNotFoundException e) {
                    e.printStackTrace();
                }
                if (jitsiPluginBroadcast != null) {
                    jitsiPluginBroadcast.setAction(JitsiMeetingPlugin.JITSI_BASE_ACTION + "ScreenDrawData");
                    jitsiPluginBroadcast.putExtra("NOTIFICATION_REMOTE_DATA", new JSONObject(data).toString());
                    sqlitewraper.context.sendBroadcast(jitsiPluginBroadcast);
                }
            }

            else if (data.get("videocallType").equalsIgnoreCase("screenshot")) {

                Intent jitsiPluginBroadcast = null;
                try {
                    jitsiPluginBroadcast = new Intent(getApplicationContext(), Class.forName(JitsiMeetingPlugin.JITSI_PLUGIN_BROADCAST_CLASS));
                } catch (ClassNotFoundException e) {
                    e.printStackTrace();
                }
                if (jitsiPluginBroadcast != null) {
                    jitsiPluginBroadcast.setAction(JitsiMeetingPlugin.JITSI_BASE_ACTION + "ScreenShot");
                    jitsiPluginBroadcast.putExtra("NOTIFICATION_REMOTE_DATA", new JSONObject(data).toString());
                    sqlitewraper.context.sendBroadcast(jitsiPluginBroadcast);
                }
            }

            else if(data.get("videocallType").equalsIgnoreCase("jitsicallstop"))
            {
                Intent jitsiPluginBroadcast = null;
                try {
                    jitsiPluginBroadcast = new Intent(getApplicationContext(), Class.forName(JitsiMeetingPlugin.JITSI_PLUGIN_BROADCAST_CLASS));
                } catch (ClassNotFoundException e) {
                    e.printStackTrace();
                }
                if (jitsiPluginBroadcast != null) {
                    jitsiPluginBroadcast.setAction(JitsiMeetingPlugin.JITSI_BASE_ACTION + "CallStop");
                    jitsiPluginBroadcast.putExtra("NOTIFICATION_REMOTE_DATA", new JSONObject(data).toString());
                    sqlitewraper.context.sendBroadcast(jitsiPluginBroadcast);
                }
            }

            else if(data.get("videocallType").equalsIgnoreCase("jitsicallPhotoId"))
            {
                Intent jitsiPluginBroadcast = null;
                try {
                    jitsiPluginBroadcast = new Intent(getApplicationContext(), Class.forName(JitsiMeetingPlugin.JITSI_PLUGIN_BROADCAST_CLASS));
                } catch (ClassNotFoundException e) {
                    e.printStackTrace();
                }
                if (jitsiPluginBroadcast != null) {
                    jitsiPluginBroadcast.setAction(JitsiMeetingPlugin.JITSI_BASE_ACTION + "Get_PhotoId");
                    jitsiPluginBroadcast.putExtra("NOTIFICATION_REMOTE_DATA", new JSONObject(data).toString());
                    sqlitewraper.context.sendBroadcast(jitsiPluginBroadcast);
                }
            }

            else if(data.get("videocallType").equalsIgnoreCase("photosave"))
            {
                Intent jitsiPluginBroadcast = null;
                try {
                    jitsiPluginBroadcast = new Intent(getApplicationContext(), Class.forName(JitsiMeetingPlugin.JITSI_PLUGIN_BROADCAST_CLASS));
                } catch (ClassNotFoundException e) {
                    e.printStackTrace();
                }
                if (jitsiPluginBroadcast != null) {
                    jitsiPluginBroadcast.setAction(JitsiMeetingPlugin.JITSI_BASE_ACTION + "photosave");
                    jitsiPluginBroadcast.putExtra("NOTIFICATION_REMOTE_DATA", new JSONObject(data).toString());
                    sqlitewraper.context.sendBroadcast(jitsiPluginBroadcast);
                }
            }

        } else {
            Intent jitsiPluginBroadcast = null;
            try {
                jitsiPluginBroadcast = new Intent(getApplicationContext(), Class.forName(JitsiMeetingPlugin.JITSI_PLUGIN_BROADCAST_CLASS));
            } catch (ClassNotFoundException e) {
                e.printStackTrace();
            }
            if (jitsiPluginBroadcast == null) {
                MessageReceivedUtils.messageDetailsCheck(getApplicationContext(), remoteMessage);
            } else {

            }
        }

        if(data.containsKey("textType"))
        {
            if(data.get("textType").equalsIgnoreCase("Comment")) {
                String task_id = data.get("task_id");

                Intent intent = new Intent("com.easyform.newjitsi.activitys.jitsimeet.COMMENT_NOTIFICATION");
                intent.putExtra("textType", "Comment");
                intent.putExtra("task_id",task_id);
                sendBroadcast(intent);

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
        int flags = PendingIntent.FLAG_CANCEL_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            flags = PendingIntent.FLAG_MUTABLE;
        }
        PendingIntent resultPendingIntent = stackBuilder.getPendingIntent(0,
                flags);
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
            int CompanyId= 0;
            try{
                CompanyId = Integer.parseInt(data.get("CompanyId"));
            }
            catch (Exception e)
            {

            }

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
                        Context appContext = sqlitewraper.context.getApplicationContext();

                        Intent i = new Intent(sqlitewraper.context, CurrentLocation.class);
                        i.putExtra("senderid", senderid);
                        i.putExtra("receiverid", receiverid);
                        i.putExtra("Company_Id", Company_Id);
                       // sqlitewraper.context.startService(i);
                        ContextCompat.startForegroundService(appContext, i);


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