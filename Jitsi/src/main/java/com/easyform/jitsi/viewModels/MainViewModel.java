package com.easyform.jitsi.viewModels;


import android.annotation.SuppressLint;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Point;
import android.os.Handler;
import android.os.StrictMode;
import android.util.Log;
import android.util.Size;
import android.view.Display;
import android.view.Gravity;
import android.view.WindowManager;
import android.widget.FrameLayout;

import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import com.easyform.jitsi.network.requests.AuthJson;
import com.easyform.jitsi.network.requests.LoginData;
import com.easyform.jitsi.network.requests.ParticipateId;
import com.easyform.jitsi.ui.activitys.CameraPreviewActivity;
import com.easyform.jitsi.ui.activitys.JitsiMeetViewActivity;
import com.easyform.jitsi.ui.activitys.MainActivityJitsi;
import com.easyform.jitsi.utils.drawing.App;
import com.easyform.jitsi.utils.drawing.ArDrawingUtils;
import com.easyform.jitsi.utils.drawing.RemoteUtils;
import com.google.ar.core.ArCoreApk;
import com.google.ar.sceneform.samples.hellosceneform.HelloSceneformActivity;
import com.google.gson.Gson;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.concurrent.TimeUnit;

import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

/**
 * Created by  SAVAN SOLANKI on 10/06/2022.
 *
 * @author SAVAN SOLANKI
 */
public class MainViewModel extends ViewModel {


    /**
     * Initialize default options for Jitsi Meet conferences.
     */

    @SuppressLint("LogNotTimber")
    public void joinJitsiMeet(MainActivityJitsi context, String JWTToken, String UserDataURL, String body, String auth1, String Rold_id, String companyFeatureid, AuthJson authJson, LoginData loginData, String args, String senderfcmid, Boolean accept, String remoteMessageData, String getUserData, String authData, String roomName) {
        Log.e("ErrorData=> ", JWTToken);
        try {
            WindowManager wm = (WindowManager) context.getSystemService(Context.WINDOW_SERVICE);
            Display display = wm.getDefaultDisplay();
            Point size = new Point();
            display.getRealSize(size);
            int width = size.x;
            int height = size.y;
            if (JWTToken.length() > 0) {
                Intent jitsiMeetView = new Intent(context, JitsiMeetViewActivity.class);
                jitsiMeetView.setFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
                jitsiMeetView.putExtra("token", JWTToken);
                jitsiMeetView.putExtra("UserDataURL", UserDataURL);
                jitsiMeetView.putExtra("body", body);
                jitsiMeetView.putExtra("auth1", auth1);
                jitsiMeetView.putExtra("Rold_id", Rold_id);
                jitsiMeetView.putExtra("companyFeatureid", companyFeatureid);
                jitsiMeetView.putExtra("authJson", authJson);
                jitsiMeetView.putExtra("loginData", loginData);
                jitsiMeetView.putExtra("Args", args);
                jitsiMeetView.putExtra("senderfcmid", senderfcmid);
                jitsiMeetView.putExtra("accept", accept);
                jitsiMeetView.putExtra("remoteMessageData", remoteMessageData);
                jitsiMeetView.putExtra("userGetData", getUserData);
                jitsiMeetView.putExtra("authData", authData);
                jitsiMeetView.putExtra("width", width);
                jitsiMeetView.putExtra("height", height);
                jitsiMeetView.putExtra("roomName", roomName);
                context.startActivity(jitsiMeetView);
                context.finish();
            }
        } catch (RuntimeException e) {
            e.printStackTrace();
        }
    }

    @SuppressLint("LogNotTimber")
    public String UserGet(String userDataURL, JSONArray getUserData, JSONObject auth1, String rold_id, String companyFeatureid) {
        StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
        StrictMode.setThreadPolicy(policy);

        OkHttpClient okHttpClient = getHttpClientWithTimeout();
        String response = null;

        MediaType JSON = MediaType.parse("application/json; charset=utf-8");
        RequestBody body1 = RequestBody.create(JSON, getUserData.toString());
        Request request = new Request.Builder()
                .header("Company_Feature_Id", companyFeatureid)
                .header("Role_Id", rold_id)
                .header("API_Key", "0")
                .header("matchId", "0")
                .header("auth1", auth1.toString())
                .post(body1)
                .url(userDataURL)
                .build();
        Log.d("Auth1", auth1.toString());
        if (!auth1.toString().equalsIgnoreCase("")) {


            try {
                Response response1 = okHttpClient.newCall(request).execute();
                response = response1.body().string();
                response = response.replaceAll("(\r\n|\n)", "");
                Log.d("##WEBSERVICEDATA", response);
            } catch (IOException e) {
                Log.d("WEBEXCEPTION", e.toString());
                e.printStackTrace();
            }
        }
        return response;
    }

    private OkHttpClient getHttpClientWithTimeout() {
        final OkHttpClient client1 = new OkHttpClient.Builder()
                .connectTimeout(60, TimeUnit.SECONDS)
                .readTimeout(60, TimeUnit.SECONDS)
                .writeTimeout(60, TimeUnit.SECONDS)
                .build();
        return client1;
    }


    @SuppressLint("LogNotTimber")
    public void screen(HashMap<String, Object> data, JitsiMeetViewActivity jitsiMeetViewActivity, String participantIds1) {
        ArCoreApk.Availability availability = ArCoreApk.getInstance().checkAvailability(jitsiMeetViewActivity);
        String availabilityString = String.valueOf(availability);
        Boolean sharing = ScreenSharingData(data);
        String participateId = ScreeSharingParticipateId(data);

        Log.d("screenshare", "Screen share:" + sharing);
        Log.d("screenshare", "Screen share:" + participateId);
        Log.d("screenshare", "Screen share:" + participantIds1);
        JSONArray participatelist = null;
        String pid = null;
        SharedPreferences sharedPreferences = jitsiMeetViewActivity.getSharedPreferences("REMOTERATIO", Context.MODE_PRIVATE);
        String dHeight = (sharedPreferences.getString("Height", "320"));
        String dWidth = (sharedPreferences.getString("Width", "240"));

        Log.d("##HELLO_SIZE_HEIGHT", dHeight);
        Log.d("##HELLO_SIZE_WIDTH", dWidth);

        SharedPreferences sh = jitsiMeetViewActivity.getSharedPreferences("Plugin", Context.MODE_PRIVATE);
        String isPluginCall = sh.getString("isPlugin", "");
        String loginjson = sh.getString("loginjson", "");

        if (participantIds1 != null) {
            try {
                participatelist = new JSONArray(participantIds1);
                Log.d("screenshare", "Screen share:" + participatelist);
                for (int p = 0; p < participatelist.length(); p++) {
                    JSONObject jsonObject = participatelist.getJSONObject(p);
                    if (participateId.equalsIgnoreCase(jsonObject.getString("participantId"))) {
                        pid = jsonObject.getString("participantId");
                        Log.d("screenshare", "Screen share:" + pid);
                    } else {
                        pid = jsonObject.getString("participantId");
                    }
                }

            } catch (JSONException e) {
                e.printStackTrace();
            }


            if (sharing) {

                if (participateId.equalsIgnoreCase(pid)) {
                    setScreenSizeOfReciever(true, jitsiMeetViewActivity);
                    ArDrawingUtils.isDrawingEnable = false;
                    Log.d("AfterScreenShare", dWidth + "::" + dHeight);
                    Handler mainHandler = new Handler();
                    mainHandler.postDelayed(() -> {
                        if (availabilityString.equalsIgnoreCase("SUPPORTED_INSTALLED")) {
                            Intent ArDrawIntent = new Intent(jitsiMeetViewActivity, HelloSceneformActivity.class)
                                    .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
                                    .putExtra("width", dWidth)
                                    .putExtra("height", dHeight);
                            jitsiMeetViewActivity.startActivity(ArDrawIntent);

                        } else {
                            Intent cameraIntent = new Intent(jitsiMeetViewActivity, CameraPreviewActivity.class)
                                    .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
                                    .putExtra("width", dWidth)
                                    .putExtra("height", dHeight);
                            jitsiMeetViewActivity.startActivity(cameraIntent);
                        }
                    }, 1000);
                }
//                else {
//                    ArDrawingUtils.isDrawingEnable = true;
//                    setScreenSizeOfReciever(false, jitsiMeetViewActivity);
//
//                }

                LoginData loginData = null;
                if (loginjson != null) {
                    loginData = new Gson().fromJson(loginjson, LoginData.class);

                    if (isPluginCall.equalsIgnoreCase("isPluginCall")) {
                        setScreenSizeOfReciever(true, jitsiMeetViewActivity);
                        Log.d("AfterScreenShare", dWidth + "::" + dHeight);
                        Handler mainHandler = new Handler();
                        mainHandler.postDelayed(() -> {
                            if (availabilityString.equalsIgnoreCase("SUPPORTED_INSTALLED")) {
                                Intent ArDrawIntent = new Intent(jitsiMeetViewActivity, HelloSceneformActivity.class)
                                        .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
                                        .putExtra("width", dWidth)
                                        .putExtra("height", dHeight);
                                jitsiMeetViewActivity.startActivity(ArDrawIntent);

                            } else {
                                Intent cameraIntent = new Intent(jitsiMeetViewActivity, CameraPreviewActivity.class)
                                        .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
                                        .putExtra("width", dWidth)
                                        .putExtra("height", dHeight);
                                jitsiMeetViewActivity.startActivity(cameraIntent);
                            }
                        }, 1000);

                    } else {

                        setScreenSizeOfReciever(false, jitsiMeetViewActivity);
                    }
                }

//            if (!isPluginCall.equalsIgnoreCase("isPluginCall") && participantIds1 != null && !participateId.equalsIgnoreCase(pid)) {
//                setScreenSizeOfReciever(true, jitsiMeetViewActivity);
//                Log.d("AfterScreenShare", dWidth + "::" + dHeight);
//                Handler mainHandler = new Handler();
//                mainHandler.postDelayed(() -> {
//                    if (availabilityString.equalsIgnoreCase("SUPPORTED_INSTALLED")) {
//                        Intent ArDrawIntent = new Intent(jitsiMeetViewActivity, HelloSceneformActivity.class)
//                                .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
//                                .putExtra("width", dWidth)
//                                .putExtra("height", dHeight);
//                        jitsiMeetViewActivity.startActivity(ArDrawIntent);
//
//                    } else {
//                        Intent cameraIntent = new Intent(jitsiMeetViewActivity, CameraPreviewActivity.class)
//                                .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
//                                .putExtra("width", dWidth)
//                                .putExtra("height", dHeight);
//                        jitsiMeetViewActivity.startActivity(cameraIntent);
//                    }
//                }, 1000);
//
//            } else {
//                setScreenSizeOfReciever(false, jitsiMeetViewActivity);
//            }
            } else if (!sharing) {
                for (int r = 0; r < participatelist.length(); r++) {
                    JSONObject jsonObject = null;
                    try {
                        jsonObject = participatelist.getJSONObject(r);
                        jsonObject.remove("participantId");
                    } catch (JSONException e) {
                        e.printStackTrace();
                    }


                }
            }
        }
    }

    @SuppressLint("LogNotTimber")
    private String ScreeenShareRole(HashMap<String, Object> data) {

        String role = null;
        JSONArray mJSONArray = new JSONArray(Arrays.asList(data));
        Log.d("screenshare", mJSONArray.toString());
        for (int i = 0; i < mJSONArray.length(); i++) {
            try {
                JSONObject jsonObject = mJSONArray.getJSONObject(i);

                role = jsonObject.getString("role");
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }
        return role;
    }

    private void setScreenSizeOfReciever(boolean b, JitsiMeetViewActivity jitsiMeetViewActivity) {

        Size size = getSizeAdjustedToAspectRatio(b, jitsiMeetViewActivity);

        if (b) {
            FrameLayout.LayoutParams layoutParams = new FrameLayout.LayoutParams(size.getWidth(), size.getHeight());
            layoutParams.gravity = Gravity.CENTER;
        }
    }

    @SuppressLint("LogNotTimber")
    private Size getSizeAdjustedToAspectRatio(Boolean b, JitsiMeetViewActivity jitsiMeetViewActivity) {


        Log.d("##MEETING", "getSizeAdjustedToAspectRatio:" + "1");

        float newHeight;
        float newWidth;


        Size size = jitsiMeetViewActivity.getRealSizeOfDisplay();

        int sourceWidth = size.getWidth();
        int sourceHeight = size.getHeight();

        Log.d("##MEETING", "getSizeAdjustedToAspectRatio:" + " SHEIGHT: " + sourceHeight + " SWIDTH: " + sourceWidth);

        SharedPreferences sharedPreferences = App.getContext().getSharedPreferences("RATIO", Context.MODE_PRIVATE);
        float dHeight = Float.parseFloat(sharedPreferences.getString("Height", "320"));
        float dWidth = Float.parseFloat(sharedPreferences.getString("Width", "240"));
        final float srcAspect = (float) sourceWidth / (float) sourceHeight;
        final float dstAspect = dWidth / dHeight;
        boolean isLandscape = sourceWidth > sourceHeight;

        if (b) {
            dHeight = RemoteUtils.getRemoteHeight();
            dWidth = RemoteUtils.getRemoteWidth();
        } else {
            Size size1 = jitsiMeetViewActivity.getRealSizeOfDisplay();
            dHeight = size1.getHeight();
            dWidth = size1.getWidth();
//            dHeight = 1600;
//            dWidth = 720;
        }
        Log.d("##MEETING", "getSizeAdjustedToAspectRatio:" + " DHEIGHT: " + dHeight + " DWIDTH: " + dWidth);


        int newHeight1;
        int newWidth1;
        if (srcAspect < dstAspect) {

            if (isLandscape) {
                newHeight = dWidth * sourceHeight / sourceWidth;
                newWidth = dWidth;
                newWidth1 = (int) newWidth;
                newHeight1 = (int) newHeight;
            } else {
                newWidth = dHeight * sourceWidth / sourceHeight;
                newHeight = dHeight;
                newHeight1 = (int) newHeight;
                newWidth1 = (int) newWidth;
            }
        } else {
            newHeight1 = 320;
            newWidth1 = 240;
        }
        float newDRatio = dHeight / dWidth;
        newHeight1 = (int) (newDRatio * sourceWidth);

        SharedPreferences sharedpreferences = App.getContext().getSharedPreferences("NEWRATIO", Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = sharedpreferences.edit();
        editor.putString("Width", String.valueOf(sourceWidth));
        editor.putString("Height", String.valueOf(newHeight1));
        editor.apply();
        Log.d("##MEETING", "getSizeAdjustedToAspectRatio:2");
        if (dHeight > sourceHeight) {
            RemoteUtils.calRatioHeight = sourceHeight;
        } else {
            RemoteUtils.calRatioHeight = newHeight1;
        }

        Log.d("##DIMENSION", "HEIGHT: " + newHeight1 + "WIDTH: " + newWidth1);

        Log.d("##MEETING", "getSizeAdjustedToAspectRatio:" + " FHEIGHT: " + newHeight1 + " FWIDTH: " + sourceWidth);


        return new Size(sourceWidth, newHeight1);
    }

    @SuppressLint("LogNotTimber")
    private String ScreeSharingParticipateId(HashMap<String, Object> data) {
        String participantId = null;
        JSONArray mJSONArray = new JSONArray(Arrays.asList(data));
        Log.d("screenshare", mJSONArray.toString());
        for (int i = 0; i < mJSONArray.length(); i++) {
            try {
                JSONObject jsonObject = mJSONArray.getJSONObject(i);

                participantId = jsonObject.getString("participantId");
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }
        return participantId;
    }

    @SuppressLint("LogNotTimber")
    public Boolean ScreenSharingData(HashMap<String, Object> data) {
        Boolean share = null;
        JSONArray mJSONArray = new JSONArray(Arrays.asList(data));
        Log.d("screenshare", mJSONArray.toString());
        for (int i = 0; i < mJSONArray.length(); i++) {
            try {
                JSONObject jsonObject = mJSONArray.getJSONObject(i);
                share = jsonObject.getBoolean("sharing");
                String participantId = jsonObject.getString("participantId");
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }

        return share;
    }


}
