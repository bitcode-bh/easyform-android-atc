package com.example.easyformzoom.broadcast_receiver;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Point;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.Display;

import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import com.example.easyformzoom.zoom.App;
import com.example.easyformzoom.zoom.datautils.ListUsernameFId;
import com.example.easyformzoom.zoom.drawing.NormalDrawingUtils;
import com.example.easyformzoom.zoom.drawing.PaintViewNormal;
import com.example.easyformzoom.zoom.firebase.DeviceEventsUtilsZoom;
import com.example.easyformzoom.zoom.firebase.NetworkCallZoomChat;
import com.example.easyformzoom.zoom.firebase.RemoteUtils;
import com.example.easyformzoom.zoom.inmeetingfunction.customizedmeetingui.share.MeetingShareHelper;
import com.example.easyformzoom.zoom.screenshare.EventUtils;
import com.example.easyformzoom.zoom.screenshare.ScreenShareListner;
import com.google.ar.sceneform.samples.hellosceneform.HelloSceneformActivity;
import com.google.ar.sceneform.samples.hellosceneform.TouchEventAR;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import us.zoom.sdk.InMeetingUserInfo;
import us.zoom.sdk.ZoomSDK;

public class Zoom_Broadcast extends BroadcastReceiver {


    @Override
    public void onReceive(Context context, Intent intent) {
        ScreenShareListner screenShareListner = EventUtils.screenShareListner1;
        Activity activity = EventUtils.activityEvents;
        TouchEventAR touchEventAR = EventUtils.touchEventAR;

        App.setContext(context);
        //Notification Utils
        String action = intent.getAction();
        Log.d("recieved", action);
        Bundle myExtras;
        if (intent.getExtras() != null) {
            myExtras = intent.getExtras();
        } else {
            myExtras = null;
        }

        if (action.equals("com.example.easyformzoom.DeviceUtilsdata")) {

            if (myExtras != null) {
                String username = myExtras.getString("username", "");
                String appid = myExtras.getString("appid", "");
                String company_id = myExtras.getString("company_id", "");
                String UserId = myExtras.getString("UserId", "");
                String u_c = myExtras.getString("u_c", "");
                String roleid = myExtras.getString("roleid", "");
                String companyFeatureid = myExtras.getString("companyFeatureid", "");

                if (username != null && appid != null && UserId != null && u_c != null && roleid != null && company_id != null && companyFeatureid != null) {
                    DeviceEventsUtilsZoom.username = username;
                    DeviceEventsUtilsZoom.appid = appid;
                    DeviceEventsUtilsZoom.company_id = company_id;
                    DeviceEventsUtilsZoom.UserId = UserId;
                    DeviceEventsUtilsZoom.u_c = u_c;
                    DeviceEventsUtilsZoom.roleid = roleid;
                    DeviceEventsUtilsZoom.companyFeatureid = companyFeatureid;
                    Log.d("####DedviceData", "recieved2");
                    DeviceEventsUtilsZoom.saveLoginDetailsToPreferences(username, appid, UserId, u_c, roleid, companyFeatureid, company_id);
                }
            }
        } else if (action.equals("com.example.easyformzoom.DisplayRemoteUtils")) {
            if (myExtras != null) {
                final int height = myExtras.getInt("height", 0);
                final int width = myExtras.getInt("width", 0);
                RemoteUtils.setRealSizeHeight(height);
                RemoteUtils.setRealSizeWidth(width);
            }
        } else if (action.equals("com.example.easyformzoom.DeviceEventsUtilsZoom")) {
            if (myExtras != null) {
                String username = myExtras.getString("username", "");
                String appid = myExtras.getString("appid", "");
                String company_id = myExtras.getString("company_id", "");
                String UserId = myExtras.getString("UserId", "");
                String u_c = myExtras.getString("u_c", "");
                String roleid = myExtras.getString("roleid", "");
                String companyFeatureid = myExtras.getString("companyFeatureid", "");
                String iosAndroidOpponentArray = myExtras.getString("iosAndroidOpponentArray", "");
                String webAndroidOpponentArray = myExtras.getString("webAndroidOpponentArray", "");
                DeviceEventsUtilsZoom.username = username;
                DeviceEventsUtilsZoom.appid = appid;
                DeviceEventsUtilsZoom.company_id = String.valueOf(company_id);
                DeviceEventsUtilsZoom.UserId = UserId;
                DeviceEventsUtilsZoom.u_c = u_c;
                DeviceEventsUtilsZoom.roleid = roleid;
                DeviceEventsUtilsZoom.companyFeatureid = companyFeatureid;
                try {
                    DeviceEventsUtilsZoom.iosAndroidOpponentArray = new JSONArray(iosAndroidOpponentArray);
                    DeviceEventsUtilsZoom.webAndroidOpponentArray = new JSONArray(webAndroidOpponentArray);
                } catch (JSONException e) {
                    Log.e("##ZOOM_PLUGIN", "6: " + e.getMessage());
                    e.printStackTrace();
                }
            }
        } else if (action.equals("com.example.easyformzoom.screenShareListner")) {
            if (myExtras != null) {
                if (myExtras.containsKey("myAction")) {
                    String myAction = myExtras.getString("myAction", "");
                    if (myAction.equals("startScreenShareRemote")) {
                        screenShareListner.startScreenShareRemote();
                        sendScreenSizeToAllUser(context);
                    } else if (myAction.equals("startScreenShareRemote")) {
                        screenShareListner.startScreenShareRemote();
                        sendScreenSizeToAllUser(context);
                    } else if (myAction.equals("gestures")) {
                        Boolean isArSupportedDevice;
                        if (myExtras.containsKey("isArSupportedDevice")) {
                            isArSupportedDevice = myExtras.getBoolean("isArSupportedDevice");
                        } else {
                            isArSupportedDevice = null;
                        }
                        String gestures = myExtras.getString("gestures", "");
                        if (isArSupportedDevice != null) {
                            if (isArSupportedDevice) {
                                touchEventAR.onTouchEventArClick("gestures", gestures);
                            } else {
                                NormalDrawingUtils.drawingNormal("gestures", gestures);
                            }
                        }

                    } else if (myAction.equals("imagearrow")) {
                        Boolean isArSupportedDevice;
                        if (myExtras.containsKey("isArSupportedDevice")) {
                            isArSupportedDevice = myExtras.getBoolean("isArSupportedDevice");
                        } else {
                            isArSupportedDevice = null;
                        }
                        String imagearrow = myExtras.getString("imagearrow", "");
                        if (isArSupportedDevice != null) {
                            if (isArSupportedDevice) {
                                touchEventAR.onTouchEventArClick("imagearrow", imagearrow);
                            } else {
                                NormalDrawingUtils.drawingNormal("imagearrow", imagearrow);
                            }
                        } else {
                            touchEventAR.onTouchEventArClick("imagearrow", imagearrow);
                        }
                    } else if (myAction.equals("textlable")) {
                        Boolean isArSupportedDevice;
                        if (myExtras.containsKey("isArSupportedDevice")) {
                            isArSupportedDevice = myExtras.getBoolean("isArSupportedDevice");
                        } else {
                            isArSupportedDevice = null;
                        }
                        String textlable = myExtras.getString("textlable", "");
                        if (isArSupportedDevice != null) {
                            if (isArSupportedDevice) {
                                touchEventAR.onTouchEventArClick("textlable", textlable);
                            } else {
                                NormalDrawingUtils.drawingNormal("textlable", textlable);
                            }
                        }
                    } else if (myAction.equals("touches")) {
                        String textlable = myExtras.getString("touches", "");
                        touchEventAR.onTouchEventArClick("touches", textlable);
                    } else if (myAction.equals("delete")) {
                        Boolean isArSupportedDevice;
                        if (myExtras.containsKey("isArSupportedDevice")) {
                            isArSupportedDevice = myExtras.getBoolean("isArSupportedDevice");
                        } else {
                            isArSupportedDevice = null;
                        }
                        String delete = myExtras.getString("delete", "");
                        if (isArSupportedDevice != null) {
                            if (isArSupportedDevice) {
                                touchEventAR.onTouchEventArClick("delete", delete);
                            } else {
                                NormalDrawingUtils.drawingNormal("delete", delete);
                            }
                        }
                    } else if (myAction.equals("Color")) {
                        Boolean isArSupportedDevice;
                        if (myExtras.containsKey("isArSupportedDevice")) {
                            isArSupportedDevice = myExtras.getBoolean("isArSupportedDevice");
                        } else {
                            isArSupportedDevice = null;
                        }
                        String color = myExtras.getString("Color", "");
                        if (isArSupportedDevice != null) {
                            if (isArSupportedDevice) {
                                touchEventAR.onTouchEventArClick("Color", color);
                            } else {
                                PaintViewNormal.currentColor = Color.parseColor(color);
                            }
                        }
                    }
                }
            }
        }
    }

    private void sendScreenSizeToAllUser(Context context) {

        ArrayList<ListUsernameFId> listUsernameFIds = null;

        if (listUsernameFIds == null) {
            listUsernameFIds = NetworkCallZoomChat.getListOfUserAndFCMID();
        }

        List<String> joinedAttendees = getListOfAttendedUser();

        for (int i = 0; i < listUsernameFIds.size(); i++) {

            String userName = listUsernameFIds.get(i).getUsername();

            if (joinedAttendees.contains(userName)) {
                String fid = listUsernameFIds.get(i).getUserid();
                String deviceType = listUsernameFIds.get(i).getDeviceType();
//                ScreenARPushUtils.sendScreensizeRemote(fid, deviceType);
                try {
                    JSONObject jsonObject = new JSONObject();
                    jsonObject.put("fid", fid);
                    jsonObject.put("deviceType", deviceType);
                    sendMessagetoBroadcast(context, "screensize", jsonObject.toString());
                } catch (Exception e) {
                    e.printStackTrace();
                }

            }
        }
    }

    private List<String> getListOfAttendedUser() {

        List<String> listOfUser = new ArrayList<>();

        List<Long> userlist = ZoomSDK.getInstance().getInMeetingService().getInMeetingUserList();
        int userCount = 0;
        if (userlist != null) {
            userCount = userlist.size();
        }
        if (userCount > 1) {
            int preCount = userCount;
            for (int i = 0; i < preCount; i++) {
                InMeetingUserInfo userInfo = ZoomSDK.getInstance().getInMeetingService().getUserInfoById(userlist.get(i));
                if (userInfo != null) {
                    Log.d("##JOINEDUSER", userInfo.getUserName());
                    listOfUser.add(userInfo.getUserName());
                    userCount--;
                } else {
                    Log.d("##JOINEDUSER", "USERINFO IS NULL");
                }
            }
        }
        return listOfUser;
    }


    private void sendMessagetoBroadcast(Context context, String msgKey, String msgValue) {
        Log.d("sender", "Broadcasting message");
        Intent intent = new Intent("zoom-event-receiver");
        intent.putExtra("keytype", msgKey);
        intent.putExtra("jsonData", msgValue);
        LocalBroadcastManager.getInstance(context).sendBroadcast(intent);
    }
}

