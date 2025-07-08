package com.sky.atc.easyformse.zoom.firebase;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

import com.sky.atc.easyformse.sqlitewraper;

import org.json.JSONObject;

public class ZoomBrodcastFromLibrary extends BroadcastReceiver {

    SendPushNotification sendNotificationToGroup;

    @Override
    public void onReceive(Context context, Intent intent) {
        String keyType = intent.getExtras().getString("keytype");
        String jsonData = intent.getExtras().getString("jsonData");
        Log.d("##ZOOM", "KeyType: " + keyType);
        try {

            sendNotificationToGroup = new SendPushNotification();

            if (keyType.equalsIgnoreCase("callpush")) {

                JSONObject jsonObject = new JSONObject(jsonData);
                String meetingId = jsonObject.getString("meetingId");
                String meetingPassword = jsonObject.getString("meetingPassword");
                String userName = jsonObject.getString("userName");
                String dType = jsonObject.getString("dtype");
                sendNotificationToGroup.sendNotificationToGroup(meetingId, meetingPassword, sqlitewraper.context, userName, dType);
            } else if (keyType.equalsIgnoreCase("OPPONENT_FCMID")) {
                SendPushNotification.OpponentFCMID = String.valueOf(jsonData);
            } else if (keyType.equalsIgnoreCase("startremote")) {
                ScreenARPushUtils.startRemoteScreenshare();
            } else if (keyType.equalsIgnoreCase("screensize")) {

                if (!jsonData.equalsIgnoreCase("NA")) {
                    JSONObject jsonObject = new JSONObject(jsonData);
                    String fid = jsonObject.getString("fid");
                    String deviceType = jsonObject.getString("deviceType");
                    ScreenARPushUtils.sendScreensizeRemote(fid, deviceType);
                } else {
                    ScreenARPushUtils.sendScreensizeRemote("NA");
                }

            } else if (keyType.equalsIgnoreCase("cleardrawing")) {
                ScreenARPushUtils.clearRemoteDrawing();
            } else if (keyType.equalsIgnoreCase("selectedColor")) {
                ScreenARPushUtils.sendColorCodeToRemote(jsonData);
            } else if (keyType.equalsIgnoreCase("pushar")) {

                JSONObject jsonObject = new JSONObject(jsonData);
                String remoteTokenNew = jsonObject.getString("remoteTokenNew");
                String deviceTypeNew = jsonObject.getString("deviceTypeNew");

                sendNotificationToGroup.sendPushToArScreen(remoteTokenNew, deviceTypeNew, null);

            } else if (keyType.equalsIgnoreCase("sharedecline")) {

                ScreenARPushUtils.sendScreenShareDecline();

            } else if (keyType.equalsIgnoreCase("gestures")) {
                ScreenARPushUtils.sendGestureToRemote(jsonData);

            } else if (keyType.equalsIgnoreCase("imagearrow")) {
                ScreenARPushUtils.sendGestureToRemote(jsonData);

            } else if (keyType.equalsIgnoreCase("textlable")) {
                ScreenARPushUtils.sendGestureToRemote(jsonData);
            } else if (keyType.equalsIgnoreCase("showuser")) {
                JSONObject jsonObject = new JSONObject(jsonData);
                String meetingId = jsonObject.getString("meetingID");
                String meetingPassword = jsonObject.getString("meetingPassword");
                String userName = jsonObject.getString("userName");
                String deviceType = jsonObject.getString("deviceType");
                String userId = jsonObject.getString("userId");
                ScreenARPushUtils.sendNotificationToSingleUser(meetingId, meetingPassword,
                        sqlitewraper.context, userName, deviceType, userId);

            }

        } catch (Exception e) {
            Log.d("##ZOOM_REC", "onReceive: " + e.getMessage());
        }
    }
}
