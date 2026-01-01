/*
 * Copyright 2018 Google LLC. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.easyform.newjitsi.activitys.drawing.AR;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Build;
import android.os.Build.VERSION_CODES;
import android.os.Bundle;
import android.os.StrictMode;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.SurfaceHolder;
import android.view.SurfaceView;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.FrameLayout;

import androidx.annotation.RequiresApi;
import androidx.appcompat.app.AppCompatActivity;
import androidx.lifecycle.ViewModelProvider;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import com.easyform.newjitsi.R;
import com.easyform.newjitsi.utils.LogUtils;
import com.easyform.newjitsi.utils.Utils;
import com.easyform.newjitsi.utils.UtilsAR;
import com.google.ar.core.Anchor;
import com.google.ar.core.Config;
import com.google.ar.core.Frame;
import com.google.ar.core.HitResult;
import com.google.ar.core.Pose;
import com.google.ar.core.Session;
import com.google.ar.core.TrackingState;
import com.google.ar.sceneform.AnchorNode;
import com.google.ar.sceneform.ArSceneView;
import com.google.ar.sceneform.Camera;
import com.google.ar.sceneform.HitTestResult;
import com.google.ar.sceneform.Node;
import com.google.ar.sceneform.Scene;
import com.google.ar.sceneform.collision.Ray;
import com.google.ar.sceneform.math.Vector3;
import com.google.ar.sceneform.rendering.Material;
import com.google.ar.sceneform.rendering.MaterialFactory;
import com.google.ar.sceneform.ux.ArFragment;

import org.json.JSONArray;
import org.json.JSONException;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletionException;

public class ARDrawActivity extends AppCompatActivity implements TouchEventAR, Scene.OnPeekTouchListener, SurfaceHolder.Callback {
    private static final String TAG = ARDrawActivity.class.getSimpleName();
    private static final double MIN_OPENGL_VERSION = 3.0;

    private static ArFragment arFragment;

    private static float DRAW_DISTANCE = 0.13f;
    private static final com.google.ar.sceneform.rendering.Color WHITE = new com.google.ar.sceneform.rendering.Color(Color.WHITE);
    private static Material material;
    private static Stroke currentStroke;
    private static Stroke arrowStroke;
    private static AnchorNode anchorNode1;
    private final static ArrayList<Stroke> strokes = new ArrayList<>();
    private final static ArrayList<Stroke> arrowStrokes = new ArrayList<>();
    private static SharedPreferences sharedPreferences;
    private static int calHeight;


    static Node node;
    private final ArrayList<Anchor> anchors = new ArrayList<>();
    private static Session arSession;
    public static boolean isArSupportedDevice = false;
    private Button btnStop;
    ArDrawViewModel arDrawViewModel;
    private final BroadcastReceiver broadcastScreenShearReceiver = new BroadcastReceiver() {
        public void onReceive(Context context, Intent intent) {
            currentStroke = null;
            node = null;
            arFragment = null;
            ARDrawActivity.this.finish();
        }
    };

    private void registerForBroadcastMessages() {
        IntentFilter intentScreenShearFilter = new IntentFilter();
        intentScreenShearFilter.addAction(Utils.BroadcastAction.JITSI_SCREEN_SHEAR_ACTION_DRAW);
        LocalBroadcastManager.getInstance(this).registerReceiver(this.broadcastScreenShearReceiver, intentScreenShearFilter);
    }

    @Override
    protected void onDestroy() {
        LocalBroadcastManager.getInstance(this).unregisterReceiver(broadcastScreenShearReceiver);
        super.onDestroy();
    }

    EventUtils eventUtils;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
        StrictMode.setThreadPolicy(policy);
        try {
            setContentView(R.layout.activity_ux);
        } catch (Exception e) {
            e.printStackTrace();
            LogUtils.JitsiLogFile("setContentView onCreate Error:::: " + e.toString(), TAG);
            Log.d("##AREXCEPTION", e.getMessage());
        }

        registerForBroadcastMessages();
        arDrawViewModel = new ViewModelProvider(this).get(ArDrawViewModel.class);
        isArSupportedDevice = UtilsAR.isARSupported(this);
        LogUtils.JitsiLogFile("isArSupportedDevice onCreate Error:::: " + isArSupportedDevice, TAG);
        Log.d("##isArSupportedDevice1", String.valueOf(isArSupportedDevice));
        if (!isArSupportedDevice) {
            onBackPressed();
            return;
        } else {
            eventUtils = new EventUtils(this);
        }

        Log.d("##isArSupportedDevice2", String.valueOf(isArSupportedDevice));


        arFragment = (ArFragment) getSupportFragmentManager().findFragmentById(R.id.ux_fragment);

        btnStop = findViewById(R.id.btn_stop);

        arFragment.getArSceneView().getHolder().addCallback(this);
        init();
    }

    void init() {
        try {
            Intent intent = getIntent();
            int sourceWidth = Integer.parseInt((intent.getStringExtra("width")));
            int sourceHeight = Integer.parseInt((intent.getStringExtra("height")));

            changeLayoutSize(sourceWidth, sourceHeight);
        } catch (Exception e) {
            e.printStackTrace();
            LogUtils.JitsiLogFile("init() onCreate Error:::: " + isArSupportedDevice, TAG);
        }

        MaterialFactory.makeOpaqueWithColor(this, WHITE)
                .thenAccept(material1 -> material = material1.makeCopy())
                .exceptionally(
                        throwable -> {
                            throw new CompletionException(throwable);
                        });

        try {
            sharedPreferences = getApplicationContext().getSharedPreferences("NEWRATIO", Context.MODE_PRIVATE);
            int dHeight = Integer.parseInt((sharedPreferences.getString("Height", "320")));
            int dWidth = Integer.parseInt((sharedPreferences.getString("Width", "240")));
//            changeLayoutSize(1080,2168);
        } catch (Exception e) {
            LogUtils.JitsiLogFile("init() onCreate Error:::: " + isArSupportedDevice, TAG);
        }

        btnStop.setOnClickListener(view -> {
            onBackPressed();
        });
    }


    void stopScreenShear() {
        Intent jitsiPluginBroadcast = new Intent();
        jitsiPluginBroadcast.setAction(Utils.BroadcastAction.JITSI_SCREEN_SHEAR_ACTION);
        jitsiPluginBroadcast.putExtra("SHARE_TOGGLE", false);
        LocalBroadcastManager.getInstance(getApplicationContext()).sendBroadcast(jitsiPluginBroadcast);
    }


    @Override
    public void onTouchEventArClick() {
        Log.d("##SCENFORM", "1");
    }

    @RequiresApi(api = VERSION_CODES.N)
    @Override
    public void onTouchEventArClick(String values) {
        Log.d("##SCENFORM", values);
        LogUtils.JitsiLogFile("onTouchEventArClick() Values:::: " + values, TAG);

        try {
            JSONArray jsonArray = new JSONArray(values);

            int action = 0;
            int metastate = 0;
            long downtime = 0;
            long eventtime = 0;
            float getx = 0;
            float gety = 0;
            int oldResX = 0;
            int oldResY = 0;
            String drawingText = "";

            for (int i = 0; i < jsonArray.length(); i++) {

                JSONArray jsonObject = jsonArray.getJSONArray(i);
                if (i == 0) {

                    try {

                        oldResX = Integer.parseInt((jsonObject.getString(0)));
                        oldResY = Integer.parseInt((jsonObject.getString(1)));

                        Log.d("##OLDRESOLTION", "X: " + oldResX + " Y: " + oldResY);

                        downtime = Long.parseLong(jsonObject.getString(2));
                        eventtime = Long.parseLong(jsonObject.getString(3));
                        getx = Float.parseFloat(jsonObject.getString(4));
                        gety = Float.parseFloat(jsonObject.getString(5));
//                    action= Integer.parseInt(jsonObject.getString(6));
                        action = 0;
                        Log.d("##HELLOACTIONSTRIN1", String.valueOf(action));
                        drawingText = jsonObject.getString(7);
                    } catch (Exception e) {

                        e.printStackTrace();
                    }


                } else if (i > 0) {

                    action = 2;
                    eventtime += 50;
                    getx = Float.parseFloat(jsonObject.getString(0));
                    gety = Float.parseFloat(jsonObject.getString(1));
                    action = Integer.parseInt(jsonObject.getString(2));
                    Log.d("##HELLOACTIONSTRIN2", String.valueOf(action));

                } else if (i == jsonArray.length() - 1) {
                    action = 1;
                    eventtime += 50;
                    getx = Float.parseFloat(jsonObject.getString(0));
                    gety = Float.parseFloat(jsonObject.getString(1));
//                    action= Integer.parseInt(jsonObject.getString(2));
                    Log.d("##HELLOACTIONSTRIN3", String.valueOf(action));
                }

                int finalAction = action;
                long finalDowntime = downtime;
                long finalEventtime = eventtime;
                float finalGetx = getx;
                float finalGety = gety;
                int finalOldResX = oldResX;
                int finalOldResY = oldResY;
                int finalAction1 = action;
                String finalDrawingText = drawingText;
                runOnUiThread(() -> {
                    Log.d("UI thread", "I am the UI thread");
                    initArcore(finalAction, metastate, finalDowntime, finalEventtime, finalGetx, finalGety, finalOldResX, finalOldResY, finalDrawingText);

                });
            }
        } catch (JSONException e) {
            LogUtils.JitsiLogFile("onTouchEventArClick() Error:::: " + e.toString(), TAG);

        }
    }

    @RequiresApi(api = VERSION_CODES.N)
    @Override
    public void onTouchEventArClick(String values, String val) {
        LogUtils.JitsiLogFile("onTouchEventArClick() Values-val:::: " + values+"\n"+val, TAG);
        Log.d("##SCENFORM", values + ":" + val);

        if (values.equalsIgnoreCase("color")) {
            int colorLastSelect = Color.parseColor(val);
            com.google.ar.sceneform.rendering.Color colorModel = new com.google.ar.sceneform.rendering.Color(colorLastSelect);

            runOnUiThread(() -> {
                Log.d("UI thread", "I am the UI thread");
                MaterialFactory.makeOpaqueWithColor(ARDrawActivity.this, colorModel)
                        .thenAccept(material1 ->
                                material = material1.makeCopy()
                        )
                        .exceptionally(
                                throwable -> {
                                    throw new CompletionException(throwable);
                                });
            });
        }

        if (values.equalsIgnoreCase("size")) {

            if (val.equalsIgnoreCase("10")) {
                DRAW_DISTANCE = 0.1f;
            } else if (val.equalsIgnoreCase("9")) {
                DRAW_DISTANCE = 0.2f;
            } else if (val.equalsIgnoreCase("8")) {
                DRAW_DISTANCE = 0.3f;
            } else if (val.equalsIgnoreCase("7")) {
                DRAW_DISTANCE = 0.4f;
            } else if (val.equalsIgnoreCase("6")) {
                DRAW_DISTANCE = 0.5f;
            } else if (val.equalsIgnoreCase("5")) {
                DRAW_DISTANCE = 0.6f;
            } else if (val.equalsIgnoreCase("4")) {
                DRAW_DISTANCE = 0.8f;
            } else if (val.equalsIgnoreCase("3")) {
                DRAW_DISTANCE = 0.9f;
            } else if (val.equalsIgnoreCase("2")) {
                DRAW_DISTANCE = 1f;
            } else if (val.equalsIgnoreCase("1")) {
                DRAW_DISTANCE = 1.2f;
            } else {
                DRAW_DISTANCE = 0.13f;
            }
//            DRAW_DISTANCE = Float.parseFloat(val);
        }

        if (values.equalsIgnoreCase("delete")) {
            runOnUiThread(() -> removeDrawing());
        }

        if (values.equalsIgnoreCase("touches")) {
            try {
                JSONArray jsonArray = new JSONArray(val);
                JSONArray jsonArray1 = new JSONArray(jsonArray.toString());

                for (int i = 0; i < jsonArray1.length(); i++) {


                    JSONArray jsonArray2 = jsonArray1.getJSONArray(i);

                    int oldResX = Integer.parseInt((jsonArray2.getString(0)));
                    int oldResY = Integer.parseInt((jsonArray2.getString(1)));

                    float getx = Float.parseFloat(jsonArray2.getString(2));
                    float gety = Float.parseFloat(jsonArray2.getString(3));

                    float newX = arDrawViewModel.newCoords(getx, gety, oldResX, oldResY).get("newX");
                    float newY = arDrawViewModel.newCoords(getx, gety, oldResX, oldResY).get("newY");

                    showTouches(newX, newY);

                }
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }

        if (values.equalsIgnoreCase("imagearrow")) {
            try {
                JSONArray jsonArray = new JSONArray(val);
                JSONArray jsonArray1 = new JSONArray(jsonArray.toString());

                for (int i = 0; i < jsonArray1.length(); i++) {


                    JSONArray jsonArray2 = jsonArray1.getJSONArray(i);

                    int oldResX = Integer.parseInt((jsonArray2.getString(0)));
                    int oldResY = Integer.parseInt((jsonArray2.getString(1)));

                    float getx = Float.parseFloat(jsonArray2.getString(2));
                    float gety = Float.parseFloat(jsonArray2.getString(3));
                    int action = Integer.parseInt(jsonArray2.getString(4));
                    int metastate = Integer.parseInt((jsonArray2.getString(5)));
                    long finalEventtime = Long.parseLong((jsonArray2.getString(6)));
                    long finalDowntime = Long.parseLong((jsonArray2.getString(7)));
                    String arrowType = jsonArray2.getString(8);
                    String arrowColor = jsonArray2.getString(9);


                    runOnUiThread(() -> {
                        Log.d("UI thread", "I am the UI thread");
//                       arDrawViewModel.initArcore(arFragment, action, metastate, finalDowntime, finalEventtime, getx, gety, oldResX, oldResY, "imagearrow", arrowType, arrowColor);
                        initArcore(action, metastate, finalDowntime, finalEventtime, getx, gety, oldResX, oldResY, "imagearrow", arrowType, arrowColor);
                    });
                }
            } catch (JSONException e) {
                LogUtils.JitsiLogFile("onTouchEventArClick (2) Error:::: " + e.toString(), TAG);
            }
        }


        if (values.equalsIgnoreCase("textlable")) {
            try {
                JSONArray jsonArray = new JSONArray(val);
                JSONArray jsonArray1 = new JSONArray(jsonArray.toString());

                for (int i = 0; i < jsonArray1.length(); i++) {


                    JSONArray jsonArray2 = jsonArray1.getJSONArray(i);

                    int oldResX = Integer.parseInt((jsonArray2.getString(0)));
                    int oldResY = Integer.parseInt((jsonArray2.getString(1)));

                    float getx = Float.parseFloat(jsonArray2.getString(2));
                    float gety = Float.parseFloat(jsonArray2.getString(3));
                    int action = Integer.parseInt(jsonArray2.getString(4));
                    int metastate = Integer.parseInt((jsonArray2.getString(5)));
                    long finalEventtime = Long.parseLong((jsonArray2.getString(6)));
                    long finalDowntime = Long.parseLong((jsonArray2.getString(7)));
                    String labletext = jsonArray2.getString(8);

                    runOnUiThread(() -> {
                        Log.d("UI thread", "I am the UI thread");
//                        arDrawViewModel.initArcore(arFragment, action, metastate, finalDowntime, finalEventtime, getx, gety, oldResX, oldResY, labletext, labletext, "");
                        initArcore(action, metastate, finalDowntime, finalEventtime, getx, gety, oldResX, oldResY, labletext, labletext, "");
                    });
                }
            } catch (JSONException e) {
                LogUtils.JitsiLogFile("onTouchEventArClick (2) Error:::: " + e.toString(), TAG);
            }
        }

        if (values.equalsIgnoreCase("gestures")) {
            try {
                JSONArray jsonArray = new JSONArray(val);
                JSONArray jsonArray1 = new JSONArray(jsonArray.toString());


                int action = 0;
                int metastate = 0;
                long downtime = 0;
                long eventtime = 0;
                float getx = 0;
                float gety = 0;
                int oldResX = 0;
                int oldResY = 0;
                String drawingText = "";


                for (int i = 0; i < jsonArray1.length(); i++) {


                    JSONArray jsonObject = jsonArray.getJSONArray(i);
                    if (i == 0) {

                        try {

                            oldResX = Integer.parseInt((jsonObject.getString(0)));
                            oldResY = Integer.parseInt((jsonObject.getString(1)));

                            Log.d("##OLDRESOLTION", "X: " + oldResX + " Y: " + oldResY);

                            downtime = Long.parseLong(jsonObject.getString(2));
                            eventtime = Long.parseLong(jsonObject.getString(3));
                            getx = Float.parseFloat(jsonObject.getString(4));
                            gety = Float.parseFloat(jsonObject.getString(5));
//                    action= Integer.parseInt(jsonObject.getString(6));
                            action = 0;
                            Log.d("##HELLOACTIONSTRIN1", String.valueOf(action));
                            drawingText = jsonObject.getString(7);
                        } catch (Exception e) {

                            e.printStackTrace();
                        }


                    } else if (i > 0) {

                        action = 2;
                        eventtime += 50;
                        getx = Float.parseFloat(jsonObject.getString(0));
                        gety = Float.parseFloat(jsonObject.getString(1));
                        action = Integer.parseInt(jsonObject.getString(2));
                        Log.d("##HELLOACTIONSTRIN2", String.valueOf(action));

                    } else if (i == jsonArray.length() - 1) {
                        action = 1;
                        eventtime += 50;
                        getx = Float.parseFloat(jsonObject.getString(0));
                        gety = Float.parseFloat(jsonObject.getString(1));
//                    action= Integer.parseInt(jsonObject.getString(2));
                        Log.d("##HELLOACTIONSTRIN3", String.valueOf(action));
                    }

                    int finalAction = action;
                    long finalDowntime = downtime;
                    long finalEventtime = eventtime;
                    float finalGetx = getx;
                    float finalGety = gety;
                    int finalOldResX = oldResX;
                    int finalOldResY = oldResY;
                    int finalAction1 = action;
                    String finalDrawingText = drawingText;
                    runOnUiThread(() -> {
                        Log.d("UI thread", "I am the UI thread");
                        initArcore(finalAction, metastate, finalDowntime, finalEventtime, finalGetx, finalGety, finalOldResX, finalOldResY, finalDrawingText);

                    });
                }
            } catch (JSONException e) {
                LogUtils.JitsiLogFile("onTouchEventArClick (2) Error:::: " + e.toString(), TAG);
            }
        }
    }


    @RequiresApi(api = VERSION_CODES.N)
    private void initArcore(int action, int metastate, long downtime, long eventtime, float getx, float gety, int oldResX, int oldResY, String drawingText) {

        try {

            if (arFragment != null) {

                Frame frame = arFragment.getArSceneView().getArFrame();

                if (frame != null) {
                    float newX = arDrawViewModel.newCoords(getx, gety, oldResX, oldResY).get("newX");
                    float newY = arDrawViewModel.newCoords(getx, gety, oldResX, oldResY).get("newY");
                    MotionEvent motionEvent = MotionEvent.obtain(downtime, eventtime, action, newX, newY, metastate);

                    if (drawingText.equalsIgnoreCase("delete")) {
                        removeDrawing();
                    } else if (!drawingText.equalsIgnoreCase("")) {
                        onSingleTap(motionEvent, drawingText, "", "");
                    } else {
                        touchDraw(motionEvent);
                    }

                } else {
                    Log.d("##SCENFORM", "frame is null");
                }
            } else {
                Log.d("##SCENFORM", "Ar Fragment is null");
            }
        } catch (Exception e) {
            LogUtils.JitsiLogFile("initArcore () Error:::: " + e.toString(), TAG);
            Log.d("##SCENFORM_1", e.getMessage());
        }
    }


    @RequiresApi(api = Build.VERSION_CODES.N)
    public void initArcore(int action, int metastate, long downtime, long eventtime, float getx, float gety, int oldResX, int oldResY, String drawingText, String arrowType, String arrowColor) {
        try {
            if (arFragment != null) {
//
                Frame frame = arFragment.getArSceneView().getArFrame();
//
                if (frame != null) {
                    float newX = arDrawViewModel.newCoords(getx, gety, oldResX, oldResY).get("newX");
                    float newY = arDrawViewModel.newCoords(getx, gety, oldResX, oldResY).get("newY");
                    MotionEvent motionEvent = MotionEvent.obtain(downtime, eventtime, action, newX, newY, metastate);

                    if (drawingText.equalsIgnoreCase("imagearrow")) {

                        onSingleTap(motionEvent, drawingText, arrowType, arrowColor);
                    } else {
                        onSingleTap(motionEvent, drawingText, "", "");
                    }

                } else {
                    Log.d("##SCENFORM", "frame is null");
                }
            } else {
                Log.d("##SCENFORM", "Ar Fragment is null");
            }
        } catch (Exception e) {
            LogUtils.JitsiLogFile("initArcore two () Error:::: " + e.toString(), TAG);
            Log.d("##SCENFORM_2", e.getMessage());
        }
    }

    private void touchDraw(MotionEvent tap) {

        try {

            int action = tap.getAction();
            Log.d("##HELLOACTION", String.valueOf(action));
            Camera camera = arFragment.getArSceneView().getScene().getCamera();
            Ray ray = camera.screenPointToRay(tap.getX(), tap.getY());
            Vector3 drawPoint = ray.getPoint(DRAW_DISTANCE);

            Log.d("HELLODRWAPOINT", String.valueOf(drawPoint.x));

            if (action == MotionEvent.ACTION_DOWN) {

//                if (anchorNode1 == null) {
                ArSceneView arSceneView = arFragment.getArSceneView();
                com.google.ar.core.Camera coreCamera = arSceneView.getArFrame().getCamera();
                if (coreCamera.getTrackingState() != TrackingState.TRACKING) {
                    return;
                }
                Pose pose = coreCamera.getPose();
                anchorNode1 = new AnchorNode(arSceneView.getSession().createAnchor(pose));
                anchorNode1.setParent(arSceneView.getScene());

                currentStroke = new Stroke(anchorNode1, material);
                strokes.add(currentStroke);
                currentStroke.add(drawPoint);

            } else if (action == MotionEvent.ACTION_MOVE && currentStroke != null) {
                currentStroke.add(drawPoint);
            } else if (action == MotionEvent.ACTION_MASK) {
                arrowStroke = new Stroke(anchorNode1, material);
                arrowStrokes.add(arrowStroke);
                arrowStroke.add(drawPoint);
            } else if ((action == MotionEvent.ACTION_OUTSIDE) && arrowStroke != null) {
                arrowStroke.add(drawPoint);
            } else if (action == MotionEvent.ACTION_UP && currentStroke != null) {
                currentStroke.add(drawPoint);
            }
        } catch (Exception e) {
            LogUtils.JitsiLogFile("touchDraw() Error:::: " + e.toString(), TAG);
            Log.d("##SCENE_TOUCH_EX", e.getMessage());
        }
    }

    public void removeDrawing() {
//        if (currentStroke != null) {
//            currentStroke.clear();
//        }
//        if (arrowStroke != null) {
//            arrowStroke.clear();
//        }

        try {

            if (!strokes.isEmpty()) {
//                strokes.clear();
                for (int i = 0; i < strokes.size(); i++) {
                    Stroke currentStroke = strokes.get(i);
                    if (currentStroke != null) {
                        currentStroke.clear();
                    }
                }
            }

            if (!arrowStrokes.isEmpty()) {
//                strokes.clear();
                for (int i = 0; i < arrowStrokes.size(); i++) {
                    Stroke currentStroke = arrowStrokes.get(i);
                    if (currentStroke != null) {
                        currentStroke.clear();
                    }
                }
            }

            if (anchors.size() > 0) {
                for (int i = 0; i < anchors.size(); i++) {
                    anchors.get(i).detach();
                }

            }
        } catch (Exception e) {
            LogUtils.JitsiLogFile("removeDrawing() Error:::: " + e.toString(), TAG);
        }
    }

    @RequiresApi(api = Build.VERSION_CODES.N)
    public void onSingleTap(MotionEvent motionEvent, String drawingText, String arrowType, String arrowColor) {


        float finalGetX = motionEvent.getX();
        float finalGetY = motionEvent.getY();

        if (arrowType.equalsIgnoreCase("up")) {
            finalGetY = finalGetY + 300;

        }
        if (arrowType.equalsIgnoreCase("right")) {
            finalGetX = finalGetX - 150;
            finalGetY = finalGetY + 50;
        }
        if (arrowType.equalsIgnoreCase("left")) {
            finalGetX = finalGetX + 150;
            finalGetY = finalGetY + 50;

        }

        try {
            Frame frame = arFragment.getArSceneView().getArFrame();

            if (frame != null) {

                Log.d("##TRACKINGSTATE", String.valueOf(frame.getCamera().getTrackingState() == TrackingState.TRACKING));

                if (motionEvent != null && frame.getCamera().getTrackingState() == TrackingState.TRACKING) {

                    Log.d("##HITTEST", String.valueOf(frame.hitTest(motionEvent)));

                    List<HitResult> hitResult = frame.hitTest(motionEvent);

                    if (hitResult.size() != 0) {

                        Log.d("##HITTEST", "1");

                        HitResult hit = hitResult.get(0);
                        Anchor anchor = hit.createAnchor();
                        AnchorNode anchorNode = new AnchorNode(anchor);
                        anchorNode.setParent(arFragment.getArSceneView().getScene());
                        anchors.add(anchor);

                        if (drawingText.equalsIgnoreCase("imagearrow")) {
                            arDrawViewModel.addArrow(anchorNode, arrowType, arrowColor);
                        } else {
                            arDrawViewModel.drawText(anchorNode, drawingText);
                        }

                    } else {

                        if (arFragment.getArSceneView().getSession() != null) {

                            Log.d("##HITTEST", "2");

                            int action = motionEvent.getAction();
                            Log.d("##HELLOACTION", String.valueOf(action));
                            Camera camera = arFragment.getArSceneView().getScene().getCamera();

                            Ray ray = camera.screenPointToRay(finalGetX, finalGetY);
                            Vector3 drawPoint = ray.getPoint(1f);

                            Log.d("HELLODRWAPOINT", String.valueOf(drawPoint.x));

                            ArSceneView arSceneView = arFragment.getArSceneView();
                            com.google.ar.core.Camera coreCamera = arSceneView.getArFrame().getCamera();
                            if (coreCamera.getTrackingState() != TrackingState.TRACKING) {
                                return;
                            }

                            float[] position = {drawPoint.x, drawPoint.y, drawPoint.z};
                            float[] rotation = {camera.getWorldRotation().x, camera.getWorldRotation().y, camera.getWorldRotation().z, camera.getWorldRotation().w};

                            Session session = arFragment.getArSceneView().getSession();
                            Anchor anchor = session.createAnchor(new Pose(position, rotation));
                            AnchorNode anchorNode = new AnchorNode(anchor);
                            anchorNode.setParent(arFragment.getArSceneView().getScene());
                            anchors.add(anchor);

                            if (drawingText.equalsIgnoreCase("imagearrow")) {
                                arDrawViewModel.addArrow(anchorNode, arrowType, arrowColor);
                            } else {
                                arDrawViewModel.drawText(anchorNode, drawingText);
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {

            LogUtils.JitsiLogFile("onSingleTap() Error:::: " + e.toString(), TAG);
        }
    }

    private void changeLayoutSize(int newWidth, int newHeight) {

        DisplayMetrics displayMetrics = new DisplayMetrics();
        WindowManager wm = (WindowManager) getSystemService(Context.WINDOW_SERVICE); // the results will be higher than using the activity context object or the getWindowManager() shortcut
        wm.getDefaultDisplay().getMetrics(displayMetrics);

        int screenWidth = displayMetrics.widthPixels;
        int screenHeight = displayMetrics.heightPixels;

        float aspect_ratio = (float) newHeight / (float) newWidth;
        int newHeight1 = (int) (aspect_ratio * screenWidth);
        calHeight = newHeight1;
        FrameLayout ll = findViewById(R.id.ar_framelayout);
//        ll.setGravity(Gravity.CENTER);
        FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(screenWidth, newHeight1);
        params.gravity = Gravity.CENTER;
        ll.setLayoutParams(params);

        Log.d("##CALHEIGHT", String.valueOf(calHeight));
    }


    @RequiresApi(api = VERSION_CODES.N)
    @Override
    public void onPeekTouch(HitTestResult hitTestResult, MotionEvent motionEvent) {
//        customView.drawHit(motionEvent.getX(), motionEvent.getY());
        showTouches(motionEvent.getX(), motionEvent.getY());
        onSingleTap(motionEvent, "Nitin", "", "");
//        touchDraw(motionEvent);

//        putArrowonScreen(motionEvent);
    }


    private void setupAutofocus() {
//        arSession=arFragment.getArSceneView().getSession();
        //Create the config
        Config arConfig = null;
        if (arSession != null) {
            arConfig = new Config(arSession);
        }
        //Check if the configuration is set to fixed
        if (arConfig != null && arConfig.getFocusMode() == Config.FocusMode.FIXED) {
            arConfig.setFocusMode(Config.FocusMode.AUTO);
        }
        //Sceneform requires that the ARCore session is configured to the UpdateMode LATEST_CAMERA_IMAGE.
        //This is probably not required for just auto focus. I was updating the camera configuration as well
        if (arConfig != null) {
            arConfig.setUpdateMode(Config.UpdateMode.LATEST_CAMERA_IMAGE);
        }
        //Reconfigure the session
        if (arSession != null) {
            arConfig.setPlaneFindingMode(Config.PlaneFindingMode.VERTICAL);
            arSession.configure(arConfig);
        }
        //Setup the session with ARSceneView
        arFragment.getArSceneView().setupSession(arSession);
        //log out if the camera is in auto focus mode
    }

    @Override
    protected void onResume() {
        super.onResume();
        try {
            arFragment.getArSceneView().getScene().getSunlight().setEnabled(false);
            arFragment.getArSceneView().getPlaneRenderer().setShadowReceiver(false);
            arSession = new Session(this);
            setupAutofocus();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }


    private void showTouches(float posX, float posY) {
        // customView.drawHit(posX, posY);
    }

    @Override
    public void surfaceCreated(SurfaceHolder surfaceHolder) {

        Log.d("##SURFAC", "CREATED");

    }

    @Override
    public void surfaceChanged(SurfaceHolder surfaceHolder, int i, int i1, int i2) {

        Log.d("##SURFAC", "CHANGED");

    }

    @Override
    public void surfaceDestroyed(SurfaceHolder surfaceHolder) {

        Log.d("##SURFAC", "DESTROYED");
    }

    @Override
    public void onBackPressed() {
        currentStroke = null;
        node = null;
        arFragment = null;
        stopScreenShear();
        this.finish();
    }

}
