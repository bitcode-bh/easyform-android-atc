package com.sky.atc.easyformse.zoom.screenshare;

import static android.content.Context.NOTIFICATION_SERVICE;
import static com.sky.atc.easyformse.zoom.screenshare.NotificationUtils.callalertNotification;

import android.annotation.SuppressLint;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Build;
import android.util.Log;
import android.widget.Toast;

import androidx.core.app.NotificationCompat;


import com.google.ar.sceneform.samples.hellosceneform.HelloSceneformActivity;
import com.google.firebase.messaging.RemoteMessage;
import com.sky.atc.easyformse.MainActivity;
import com.sky.atc.easyformse.R;
import com.sky.atc.easyformse.attendance.NotificationClickReceiver;
import com.sky.atc.easyformse.zoom.firebase.ScreenARPushUtils;
import com.sky.atc.easyformse.zoom.firebase.SendPushNotification;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.Map;

public class MessageReceivedUtils {
    private static String remoteToken;
    private static NotificationManager notifManager;


    // @RequiresApi(api = Build.VERSION_CODES.N)
    public static void messageDetailsCheck(Context applicationContext, RemoteMessage remoteMessage) {


        try {

            Map<String, String> data = remoteMessage.getData();
            String message = data.get("message");
            Log.d("##FCM", "messageDetailsCheck: " + message);
            Log.d("##FCM", "messageDetailsCheck: " + data);


            if (message.equalsIgnoreCase("call")) {

                Log.d("##FCM", "messageDetailsCheck: " + "1");

                String meetinId = data.get("id");
                String meetingPass = data.get("password");
                String callername = data.get("callfrom");
                remoteToken = data.get("remotetoken");


                if (!remoteToken.equalsIgnoreCase("NA")) {
                    Log.d("##REMOTETOKEN", remoteToken);
                    ScreenARPushUtils.sendScreensizeRemote(remoteToken);
                }
                if (meetinId != null) {
                    Log.d("##FCM", "messageDetailsCheck: " + "2");
                    callalertNotification(meetinId, meetingPass, callername, remoteToken,Utils.screenDeviceType);
                }
            } else if (message.equalsIgnoreCase("ar")) {

                String pushmessage = data.get("arjson");

                Log.d("##FCM", "messageDetailsCheck: PUSH: " + pushmessage);

                try {
                    JSONObject jsonObject = new JSONObject(pushmessage);
                    JSONArray screenshareEventObj = jsonObject.getJSONArray("shareevent");
                    JSONObject screenshareEventO = screenshareEventObj.getJSONObject(0);
                    String screenshareEvent = screenshareEventO.getString("screenshare");

                    String fcmToken = screenshareEventO.getString("fcmtoken");
                    String deviceype = screenshareEventO.getString("devicetype");

                    Utils.screenRemoteToken = fcmToken;
                    Utils.screenDeviceType = deviceype;

                    if (screenshareEvent.equalsIgnoreCase("start")) {
                        Intent i = null;
                        try {
                            i = new Intent(applicationContext, Class.forName("com.example.easyformzoom.broadcast_receiver.Zoom_Broadcast"));
                        } catch (ClassNotFoundException e) {
                            e.printStackTrace();
                        }
                        if (i != null) {
                            i.setAction("com.example.easyformzoom.screenShareListner");
                            i.putExtra("myAction", "startScreenShareRemote");
                            applicationContext.sendBroadcast(i);
                        }
                        // screenShareListner.startScreenShareRemote();
                    } else if (screenshareEvent.equalsIgnoreCase("stop")) {
                        Intent i = null;
                        try {
                            i = new Intent(applicationContext, Class.forName("com.example.easyformzoom.broadcast_receiver.Zoom_Broadcast"));
                        } catch (ClassNotFoundException e) {
                            e.printStackTrace();
                        }
                        if (i != null) {
                            i.setAction("com.example.easyformzoom.screenShareListner");
                            i.putExtra("myAction", "startScreenShareRemote");
                            applicationContext.sendBroadcast(i);
                        }
                        // screenShareListner.startScreenShareRemote();
                    }
                } catch (Exception e) {
                    Log.d("##FCM", "messageDetailsCheck: PUSH: " + e.getMessage());

                }

                try {
                    JSONObject jsonArray = new JSONObject(pushmessage);
                    String arrayKey = jsonArray.getString("screensize");

                    JSONArray jsonArray3 = new JSONArray(arrayKey);
                    JSONArray jsonArray1 = new JSONArray(jsonArray3.toString());

                    for (int i = 0; i < jsonArray1.length(); i++) {
                        JSONArray jsonArray2 = jsonArray1.getJSONArray(i);
                        String dWidth = (jsonArray2.getString(0));
                        String dHeight = (jsonArray2.getString(1));
                        String typeCall = jsonArray2.getString(2);

                        Log.d("##FCM", "messageDetailsCheck: " + "HEIGHT: " + dHeight + "WIDTH: " + dWidth);
                        if (typeCall.equalsIgnoreCase("web")) {

                           /* RemoteUtils.setRemoteHeight(RemoteUtils.getRealSizeHeight());
                            RemoteUtils.setRemoteWidth(RemoteUtils.getRemoteWidth());*/
                            Intent intent1 = null;
                            try {
                                intent1= new Intent(applicationContext, Class.forName("com.example.easyformzoom.broadcast_receiver.Zoom_Broadcast"));
                            } catch (ClassNotFoundException e) {
                                e.printStackTrace();
                            }
                            if (intent1 != null) {
                                intent1.setAction("com.example.easyformzoom.DisplayRemoteUtils");
                                intent1.putExtra("height", SendPushNotification.getRealSizeHeight());
                                intent1.putExtra("width",  SendPushNotification.getRealSizeWidth());
                                applicationContext.sendBroadcast(intent1);
           /* RemoteUtils.setRealSizeHeight(height);
        RemoteUtils.setRealSizeWidth(width);*/
                            }

                            SharedPreferences sharedpreferences = applicationContext.getSharedPreferences("REMOTERATIO", Context.MODE_PRIVATE);
                            SharedPreferences.Editor editor = sharedpreferences.edit();
                            editor.putString("Width", String.valueOf( SendPushNotification.getRealSizeWidth()));
                            editor.putString("Height", String.valueOf( SendPushNotification.getRealSizeHeight()));
                            editor.apply();
                            editor.commit();
                            ScreenARPushUtils.sendScreensizeRemote(remoteToken);
                            Intent intent = null;
                            try {
                                intent = new Intent(applicationContext, Class.forName("com.example.easyformzoom.broadcast_receiver.Zoom_Broadcast"));
                            } catch (ClassNotFoundException e) {
                                e.printStackTrace();
                            }
                            if (intent != null) {
                                intent.setAction("com.example.easyformzoom.screenShareListner");
                                intent.putExtra("myAction", "startScreenShareRemote");
                                applicationContext.sendBroadcast(intent);
                            }
                            /*   screenShareListner.startScreenShareRemote();*/

                        } else {

                            Intent intent1 = null;
                            try {
                                intent1= new Intent(applicationContext, Class.forName("com.example.easyformzoom.broadcast_receiver.Zoom_Broadcast"));
                            } catch (ClassNotFoundException e) {
                                e.printStackTrace();
                            }
                            if (intent1 != null) {
                                intent1.setAction("com.example.easyformzoom.DisplayRemoteUtils");
                                intent1.putExtra("height", Integer.parseInt(dHeight));
                                intent1.putExtra("width",  Integer.parseInt(dWidth));
                                applicationContext.sendBroadcast(intent1);
                            }
                           /* RemoteUtils.setRemoteHeight(Integer.parseInt(dHeight));
                            RemoteUtils.setRemoteWidth(Integer.parseInt(dWidth));*/

                            SharedPreferences sharedpreferences = applicationContext.getSharedPreferences("REMOTERATIO", Context.MODE_PRIVATE);
                            SharedPreferences.Editor editor = sharedpreferences.edit();
                            editor.putString("Width", dWidth);
                            editor.putString("Height", dHeight);
                            editor.apply();
                            editor.commit();
                        }
                    }
                } catch (JSONException e) {
                    e.printStackTrace();
                }
                try {
                    JSONObject jsonArray = new JSONObject(pushmessage);
                    String arrayKey = jsonArray.getString("gestures");
//                  touchEventAR.onTouchEventArClick("gestures", arrayKey);

                    if (HelloSceneformActivity.isArSupportedDevice) {
                        Log.d("##FCM", "GESTURE: SUPPORTED:" + HelloSceneformActivity.isArSupportedDevice);
                        Intent intent = null;
                        try {
                            intent = new Intent(applicationContext, Class.forName("com.example.easyformzoom.broadcast_receiver.Zoom_Broadcast"));
                        } catch (ClassNotFoundException e) {
                            e.printStackTrace();
                        }
                        if (intent != null) {
                            intent.setAction("com.example.easyformzoom.screenShareListner");
                            intent.putExtra("myAction", "gestures");
                            intent.putExtra("isArSupportedDevice", true);
                            intent.putExtra("gestures", arrayKey);
                            applicationContext.sendBroadcast(intent);
                        }
                        //  touchEventAR.onTouchEventArClick("gestures", arrayKey);
//                            NormalDrawingUtils.drawingNormal("gestures", arrayKey);
                        Log.d("##FCM", "GESTURE: SUPPORTED:" + "2");
                    } else {
                        Log.d("##FCM", "GESTURE: SUPPORTED:" + HelloSceneformActivity.isArSupportedDevice);
                        Intent intent = null;
                        try {
                            intent = new Intent(applicationContext, Class.forName("com.example.easyformzoom.broadcast_receiver.Zoom_Broadcast"));
                        } catch (ClassNotFoundException e) {
                            e.printStackTrace();
                        }
                        if (intent != null) {
                            intent.setAction("com.example.easyformzoom.screenShareListner");
                            intent.putExtra("myAction", "gestures");
                            intent.putExtra("isArSupportedDevice", false);
                            intent.putExtra("gestures", arrayKey);
                            applicationContext.sendBroadcast(intent);
                        }
                        // NormalDrawingUtils.drawingNormal("gestures", arrayKey);
                    }

                } catch (JSONException e) {
                    Log.d("##FCM", "GESTURE: " + e.getMessage());
                    e.printStackTrace();
                }

                try {
                    JSONObject jsonArray = new JSONObject(pushmessage);
                    String touchKey = jsonArray.getString("imagearrow");
                    Intent intent = null;
                    try {
                        intent = new Intent(applicationContext, Class.forName("com.example.easyformzoom.broadcast_receiver.Zoom_Broadcast"));
                    } catch (ClassNotFoundException e) {
                        e.printStackTrace();
                    }
                    if (intent != null) {
                        intent.setAction("com.example.easyformzoom.screenShareListner");
                        intent.putExtra("myAction", "imagearrow");
                        //  intent.putExtra("isArSupportedDevice", false);
                        intent.putExtra("imagearrow", touchKey);
                        applicationContext.sendBroadcast(intent);
                    }

                    // touchEventAR.onTouchEventArClick("imagearrow", touchKey);

                    {
                        if (HelloSceneformActivity.isArSupportedDevice) {
                            Intent intentTwo = null;
                            try {
                                intentTwo = new Intent(applicationContext, Class.forName("com.example.easyformzoom.broadcast_receiver.Zoom_Broadcast"));
                            } catch (ClassNotFoundException e) {
                                e.printStackTrace();
                            }
                            if (intentTwo != null) {
                                intentTwo.setAction("com.example.easyformzoom.screenShareListner");
                                intentTwo.putExtra("myAction", "imagearrow");
                                intentTwo.putExtra("isArSupportedDevice", true);
                                intentTwo.putExtra("imagearrow", touchKey);
                                applicationContext.sendBroadcast(intentTwo);
                            }
                            // touchEventAR.onTouchEventArClick("imagearrow", touchKey);
//                            NormalDrawingUtils.drawingNormal("imagearrow", touchKey);
                        } else {
                            Intent intentTwo = null;
                            try {
                                intentTwo = new Intent(applicationContext, Class.forName("com.example.easyformzoom.broadcast_receiver.Zoom_Broadcast"));
                            } catch (ClassNotFoundException e) {
                                e.printStackTrace();
                            }
                            if (intentTwo != null) {
                                intentTwo.setAction("com.example.easyformzoom.screenShareListner");
                                intentTwo.putExtra("myAction", "imagearrow");
                                intentTwo.putExtra("isArSupportedDevice", false);
                                intentTwo.putExtra("imagearrow", touchKey);
                                applicationContext.sendBroadcast(intentTwo);
                            }
                            //NormalDrawingUtils.drawingNormal("imagearrow", touchKey);
                        }
                    }

                } catch (JSONException e) {
                    e.printStackTrace();
                }
                try {
                    JSONObject jsonArray = new JSONObject(pushmessage);
                    String touchKey = jsonArray.getString("textlable");
                    {
                        if (HelloSceneformActivity.isArSupportedDevice) {
                            Intent intentTwo = null;
                            try {
                                intentTwo = new Intent(applicationContext, Class.forName("com.example.easyformzoom.broadcast_receiver.Zoom_Broadcast"));
                            } catch (ClassNotFoundException e) {
                                e.printStackTrace();
                            }
                            if (intentTwo != null) {
                                intentTwo.setAction("com.example.easyformzoom.screenShareListner");
                                intentTwo.putExtra("myAction", "textlable");
                                intentTwo.putExtra("isArSupportedDevice", true);
                                intentTwo.putExtra("textlable", touchKey);
                                applicationContext.sendBroadcast(intentTwo);
                            }
                            // touchEventAR.onTouchEventArClick("textlable", touchKey);
//                            NormalDrawingUtils.drawingNormal("textlable", touchKey);
                        } else {
                            Intent intentTwo = null;
                            try {
                                intentTwo = new Intent(applicationContext, Class.forName("com.example.easyformzoom.broadcast_receiver.Zoom_Broadcast"));
                            } catch (ClassNotFoundException e) {
                                e.printStackTrace();
                            }
                            if (intentTwo != null) {
                                intentTwo.setAction("com.example.easyformzoom.screenShareListner");
                                intentTwo.putExtra("myAction", "textlable");
                                intentTwo.putExtra("isArSupportedDevice", false);
                                intentTwo.putExtra("textlable", touchKey);
                                applicationContext.sendBroadcast(intentTwo);
                            }
                            // NormalDrawingUtils.drawingNormal("textlable", touchKey);
                        }
                    }
                } catch (JSONException e) {
                    e.printStackTrace();
                }

                try {
                    JSONObject jsonArray = new JSONObject(pushmessage);
                    String touchKey = jsonArray.getString("touches");
                    Intent intentTwo = null;
                    try {
                        intentTwo = new Intent(applicationContext, Class.forName("com.example.easyformzoom.broadcast_receiver.Zoom_Broadcast"));
                    } catch (ClassNotFoundException e) {
                        e.printStackTrace();
                    }
                    if (intentTwo != null) {
                        intentTwo.setAction("com.example.easyformzoom.screenShareListner");
                        intentTwo.putExtra("myAction", "touches");
                        intentTwo.putExtra("touches", touchKey);
                        applicationContext.sendBroadcast(intentTwo);
                    }
                    //   touchEventAR.onTouchEventArClick("touches", touchKey);
                } catch (JSONException e) {
                    e.printStackTrace();
                }

                try {
                    JSONObject jsonArray = new JSONObject(pushmessage);
                    String deleteKey = jsonArray.getString("delete");


                    if (HelloSceneformActivity.isArSupportedDevice) {
                        Intent intentTwo = null;
                        try {
                            intentTwo = new Intent(applicationContext, Class.forName("com.example.easyformzoom.broadcast_receiver.Zoom_Broadcast"));
                        } catch (ClassNotFoundException e) {
                            e.printStackTrace();
                        }
                        if (intentTwo != null) {
                            intentTwo.setAction("com.example.easyformzoom.screenShareListner");
                            intentTwo.putExtra("myAction", "delete");
                            intentTwo.putExtra("isArSupportedDevice", true);
                            intentTwo.putExtra("delete", deleteKey);
                            applicationContext.sendBroadcast(intentTwo);
                        }
                        // touchEventAR.onTouchEventArClick("delete", deleteKey);
//                            NormalDrawingUtils.drawingNormal("textlable", touchKey);
                    } else {
                        Intent intentTwo = null;
                        try {
                            intentTwo = new Intent(applicationContext, Class.forName("com.example.easyformzoom.broadcast_receiver.Zoom_Broadcast"));
                        } catch (ClassNotFoundException e) {
                            e.printStackTrace();
                        }
                        if (intentTwo != null) {
                            intentTwo.setAction("com.example.easyformzoom.screenShareListner");
                            intentTwo.putExtra("myAction", "delete");
                            intentTwo.putExtra("isArSupportedDevice", false);
                            intentTwo.putExtra("delete", deleteKey);
                            applicationContext.sendBroadcast(intentTwo);
                        }
                        //NormalDrawingUtils.drawingNormal("delete", deleteKey);
                    }

                } catch (JSONException e) {
                    e.printStackTrace();
                }
                try {
                    JSONObject jsonArray = new JSONObject(pushmessage);
                    String selectedColor = jsonArray.getString("selectedcolor");
                    Log.d("##Jsonarray", jsonArray.getString("selectedcolor"));

                    if (HelloSceneformActivity.isArSupportedDevice) {
                        Intent intentTwo = null;
                        try {
                            intentTwo = new Intent(applicationContext, Class.forName("com.example.easyformzoom.broadcast_receiver.Zoom_Broadcast"));
                        } catch (ClassNotFoundException e) {
                            e.printStackTrace();
                        }
                        if (intentTwo != null) {
                            intentTwo.setAction("com.example.easyformzoom.screenShareListner");
                            intentTwo.putExtra("myAction", "Color");
                            intentTwo.putExtra("isArSupportedDevice", true);
                            intentTwo.putExtra("Color", selectedColor);
                            applicationContext.sendBroadcast(intentTwo);
                        }
                        // touchEventAR.onTouchEventArClick("Color", selectedColor);
                    } else {
                        Intent intentTwo = null;
                        try {
                            intentTwo = new Intent(applicationContext, Class.forName("com.example.easyformzoom.broadcast_receiver.Zoom_Broadcast"));
                        } catch (ClassNotFoundException e) {
                            e.printStackTrace();
                        }
                        if (intentTwo != null) {
                            intentTwo.setAction("com.example.easyformzoom.screenShareListner");
                            intentTwo.putExtra("myAction", "Color");
                            intentTwo.putExtra("isArSupportedDevice", false);
                            intentTwo.putExtra("Color", selectedColor);
                            applicationContext.sendBroadcast(intentTwo);
                        }
                        // PaintViewNormal.currentColor = Color.parseColor(selectedColor);
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            } else if (message.equalsIgnoreCase("decline")) {

                String username = data.get("username");
                createNotification(applicationContext, username);
            } else if (message.equalsIgnoreCase("ssharedecline")) {
                String username = data.get("username");
                Toast.makeText(applicationContext, "Screen share declined by " + username, Toast.LENGTH_SHORT).show();
                /*activity.runOnUiThread(() -> {
                    String username = data.get("username");
                    Toast.makeText(applicationContext, "Screen share declined by " + username, Toast.LENGTH_SHORT).show();
                });*/
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }


    @SuppressLint("WrongConstant")
    public static void createNotification(Context applicationContext, String username) {

        String title = username + " has rejected your call";
        String subLineText = "";

        NotificationChannel mChannel = null;
        String CHANNEL_ID = "my_channel_01";

        // Build notification
        // Actions are just fake
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            CharSequence name = "Easyform";// The user-visible name of the channel.
            int importance = NotificationManager.IMPORTANCE_HIGH;
            mChannel = new NotificationChannel(CHANNEL_ID, name, importance);

        }

        NotificationCompat.Builder noti = null;
        //This is the intent of PendingIntent
        Intent intentAction = new Intent(applicationContext, NotificationClickReceiver.class);
        intentAction.putExtra("createtask", 1);
        PendingIntent pIntentlogin = PendingIntent.getBroadcast(applicationContext, 1, intentAction, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);//data to pass


        noti = new NotificationCompat.Builder(applicationContext)
                .setContentTitle(title)
                .setContentText(subLineText).setSmallIcon(R.drawable.atc_logo)
                .setChannelId(CHANNEL_ID)
                .setAutoCancel(false)
                .setPriority(NotificationCompat.PRIORITY_HIGH);

        NotificationManager notificationCompatManager =
                (NotificationManager) applicationContext.getSystemService(NOTIFICATION_SERVICE);


        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (notificationCompatManager != null) {
                notificationCompatManager.createNotificationChannel(mChannel);
            }
        }
        // hide the notification after its selected
//        noti.flags |= Notification.FLAG_AUTO_CANCEL;
        if (notificationCompatManager != null) {
            if (noti != null) {
                notificationCompatManager.notify(1035, noti.build());
            }
        }
    }


    @SuppressLint("WrongConstant")
    public static void createNotificationNew(Context applicationContext, String username) {
        final int NOTIFY_ID = 1002;

        // There are hardcoding only for show it's just strings
        String name = "my_package_channel";
        String id = "my_package_channel_1"; // The user-visible name of the channel.
        String description = "my_package_first_channel"; // The user-visible description of the channel.


        String aMessage = username + " has rejected your call";
        String subLineText = "";

        Intent intent;
        PendingIntent pendingIntent;
        NotificationCompat.Builder builder;

        if (notifManager == null) {
            notifManager =
                    (NotificationManager) applicationContext.getSystemService(Context.NOTIFICATION_SERVICE);
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            int importance = NotificationManager.IMPORTANCE_HIGH;
            NotificationChannel mChannel = notifManager.getNotificationChannel(id);
            if (mChannel == null) {
                mChannel = new NotificationChannel(id, name, importance);
                mChannel.setDescription(description);
                mChannel.enableVibration(true);
                mChannel.setLightColor(Color.GREEN);
                mChannel.setVibrationPattern(new long[]{100, 200, 300, 400, 500, 400, 300, 200, 400});
                notifManager.createNotificationChannel(mChannel);
            }
            builder = new NotificationCompat.Builder(applicationContext, id);

            intent = new Intent(applicationContext, MainActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            pendingIntent = PendingIntent.getActivity(applicationContext, 0, intent, 0);

            builder.setContentTitle(aMessage)  // required
                    .setSmallIcon(android.R.drawable.ic_popup_reminder) // required
                    .setContentText(applicationContext.getString(R.string.app_name))  // required
                    .setDefaults(Notification.DEFAULT_ALL)
                    .setAutoCancel(true)
                    .setContentIntent(pendingIntent)
                    .setTicker(aMessage)
                    .setVibrate(new long[]{100, 200, 300, 400, 500, 400, 300, 200, 400});
        } else {

            builder = new NotificationCompat.Builder(applicationContext);

            intent = new Intent(applicationContext, MainActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            pendingIntent = PendingIntent.getActivity(applicationContext, 0, intent, 0);

            builder.setContentTitle(aMessage)                           // required
                    .setSmallIcon(android.R.drawable.ic_popup_reminder) // required
                    .setContentText(applicationContext.getString(R.string.app_name))  // required
                    .setDefaults(Notification.DEFAULT_ALL)
                    .setAutoCancel(true)
                    .setContentIntent(pendingIntent)
                    .setTicker(aMessage)
                    .setVibrate(new long[]{100, 200, 300, 400, 500, 400, 300, 200, 400})
                    .setPriority(Notification.PRIORITY_HIGH);
        } // else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {

        Notification notification = builder.build();
        notifManager.notify(NOTIFY_ID, notification);
    }
}
