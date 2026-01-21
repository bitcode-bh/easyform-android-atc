package com.sky.atc.easyformse.zoom.firebase;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;


import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.datautils.SecurePrefs;
import com.sky.atc.easyformse.sqlitewraper;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class ScreenARPushUtils {
    private static final SendPushNotification sendPushNotification = new SendPushNotification();
    private static MySharedPreferences pref;

    public static void startRemoteScreenshare() {
        JSONObject motionevent = new JSONObject();
        JSONArray jsonArrayEvent = new JSONArray();
        try {

//            SharedPreferences sharedPreferences = sqlitewraper.context.getSharedPreferences("FCMTOKEN", Context.MODE_PRIVATE);
//            String remoteToken = (sharedPreferences.getString("fcmtoken", "NA"));
            String remoteToken = SecurePrefs.get(sqlitewraper.context).getString("fcmtoken", "NA");

            motionevent.put("screenshare", "start");
            motionevent.put("fcmtoken", remoteToken);
            motionevent.put("devicetype", "android");
            jsonArrayEvent.put(motionevent);
            JSONObject jsonObject = new JSONObject();
            jsonObject.put("shareevent", jsonArrayEvent);
            Log.d("##FCM", "startRemoteScreenshare(): " + jsonObject.toString());
            sendPushNotification.sendPushToArScreen(jsonObject.toString());
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    //Send Screen size to remote
    public static void sendScreensizeRemote(String remoteToken) {
        try {
            JSONArray jsonArrayEvent = new JSONArray();

            int sourceWidth;
            int sourceHeight;
            if (getRealSizeHeight() == 0) {

                pref = sqlitewraper.getSecureShared("SCREEN_SIZE");
                sourceHeight = Integer.parseInt(pref.getString("MY_HEIGHT", "1280"));
                sourceWidth = Integer.parseInt(pref.getString("MY_WIDTH", "720"));

                Log.d("##SHARED_HEIGHT", String.valueOf(sourceHeight));

//                DisplayMetrics displayMetrics = new DisplayMetrics();
//                WindowManager wm = (WindowManager) getApplicationContext().getSystemService(Context.WINDOW_SERVICE); // the results will be higher than using the activity context object or the getWindowManager() shortcut
//                wm.getDefaultDisplay().getMetrics(displayMetrics);
//                sourceWidth = displayMetrics.widthPixels;
//                sourceHeight = displayMetrics.heightPixels;
            } else {
                sourceWidth = getRealSizeWidth();
                sourceHeight = getRealSizeHeight();
            }
            JSONArray motionevent = new JSONArray();
            motionevent.put(sourceWidth);
            motionevent.put(sourceHeight);
            motionevent.put("android");
            jsonArrayEvent.put(motionevent);

            JSONObject jsonObject = new JSONObject();
            jsonObject.put("screensize", jsonArrayEvent);
            if (remoteToken.equalsIgnoreCase("NA")) {
                sendPushNotification.sendPushToArScreen(jsonObject.toString());
            } else {
                sendPushNotification.sendPushToArScreen(jsonObject.toString(), remoteToken);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    static int getRealSizeHeight() {
        MySharedPreferences pref = sqlitewraper.getSecureShared("SCREEN_SIZE");
        return Integer.parseInt(pref.getString("MY_HEIGHT", "1280"));
    }

    static int getRealSizeWidth() {
        MySharedPreferences pref = sqlitewraper.getSecureShared("SCREEN_SIZE");
        return Integer.parseInt(pref.getString("MY_WIDTH", "720"));
    }


    //Send Screen size to remote
    public static void sendScreensizeRemote(String remoteToken, String deviceType) {
        try {
            JSONArray jsonArrayEvent = new JSONArray();

            Log.d("##SCREEN_SHARE_MANUAL", deviceType);

            int sourceWidth;
            int sourceHeight;
            if (getRealSizeHeight() == 0) {

                pref = sqlitewraper.getSecureShared("SCREEN_SIZE");
                sourceHeight = Integer.parseInt(pref.getString("MY_HEIGHT", "1280"));
                sourceWidth = Integer.parseInt(pref.getString("MY_WIDTH", "720"));

                Log.d("##SHARED_HEIGHT", String.valueOf(sourceHeight));

//                DisplayMetrics displayMetrics = new DisplayMetrics();
//                WindowManager wm = (WindowManager) getApplicationContext().getSystemService(Context.WINDOW_SERVICE); // the results will be higher than using the activity context object or the getWindowManager() shortcut
//                wm.getDefaultDisplay().getMetrics(displayMetrics);
//                sourceWidth = displayMetrics.widthPixels;
//                sourceHeight = displayMetrics.heightPixels;
            } else {
                sourceWidth = getRealSizeWidth();
                sourceHeight = getRealSizeHeight();
            }
            JSONArray motionevent = new JSONArray();
            motionevent.put(sourceWidth);
            motionevent.put(sourceHeight);
            motionevent.put("android");
            jsonArrayEvent.put(motionevent);

            JSONObject jsonObject = new JSONObject();
            jsonObject.put("screensize", jsonArrayEvent);
            sendPushNotification.sendPushToArScreenToAll(jsonObject.toString(), deviceType, remoteToken);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }


    public static void sendColorCodeToRemote(String selectedColor) {
        JSONObject jsonObject = new JSONObject();
        try {
            jsonObject.put("selectedcolor", selectedColor);
            sendGestureToRemote(jsonObject.toString());
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    public static void clearRemoteDrawing() {

        JSONObject jsonObject = new JSONObject();
        try {
            jsonObject.put("delete", "1");
            sendGestureToRemote(jsonObject.toString());
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    //sendDrawingPushRemoteScreen
    public static void sendGestureToRemote(String arjson) {
        sendPushNotification.sendPushToArScreen(arjson);
    }

    public static void sendScreenShareDecline() {
        sendPushNotification.declineScreenShareReq();
    }

    public static void sendNotificationToSingleUser(String meetingId, String meetingPassword,
                                                    Context context, String userName,
                                                    String deviceType, String userToken) {
        sendPushNotification.sendNotificationToSingleUser(meetingId, meetingPassword,
                context, userName, deviceType, userToken);

    }

}
