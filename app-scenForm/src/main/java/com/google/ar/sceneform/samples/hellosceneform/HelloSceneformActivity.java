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
package com.google.ar.sceneform.samples.hellosceneform;

import android.animation.Animator;
import android.app.Activity;
import android.app.ActivityManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Build;
import android.os.Build.VERSION_CODES;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.SurfaceHolder;
import android.view.SurfaceView;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.RequiresApi;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import com.bumptech.glide.Glide;
import com.google.ar.core.Anchor;
import com.google.ar.core.Config;
import com.google.ar.core.Frame;
import com.google.ar.core.HitResult;
import com.google.ar.core.Plane;
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
import com.google.ar.sceneform.rendering.ModelRenderable;
import com.google.ar.sceneform.rendering.ViewRenderable;
import com.google.ar.sceneform.samples.hellosceneform.drawing.Stroke;
import com.google.ar.sceneform.ux.ArFragment;

import org.json.JSONArray;
import org.json.JSONException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.concurrent.CompletionException;

/*************************************************************************************************
 * This is an example activity that uses the Sceneform UX package to make common AR tasks easier.*
 *************************************************************************************************/

public class HelloSceneformActivity extends AppCompatActivity implements TouchEventAR, Scene.OnPeekTouchListener, SurfaceHolder.Callback {
    private static final String TAG = HelloSceneformActivity.class.getSimpleName();
    private static final double MIN_OPENGL_VERSION = 3.0;
    public static boolean isScreenStop = false;

    private static ArFragment arFragment;
    private static ModelRenderable andyRenderable;

    private static Context context;
    private static float DRAW_DISTANCE = 0.13f;
    private static final com.google.ar.sceneform.rendering.Color WHITE = new com.google.ar.sceneform.rendering.Color(android.graphics.Color.WHITE);
    private static Material material;
    private static Stroke currentStroke;
    private static Stroke arrowStroke;
    private static AnchorNode anchorNode1;
    private final static ArrayList<Stroke> strokes = new ArrayList<>();
    private final static ArrayList<Stroke> arrowStrokes = new ArrayList<>();
    private static Activity activity;
    private static SharedPreferences sharedPreferences;
    private static int calHeight;
    private static Animator anim;


    private ViewRenderable viewRenderable;
    static Node node;
    private final ArrayList<Anchor> anchors = new ArrayList<>();
    private final ArrayList<Node> nodes = new ArrayList<>();
    private static LinearLayout linearLayout;
    private static Session arSession;
    private static String textColor = "#f500d1";
    int ANIM_DURATION = 500;
    private static FrameLayout frameLayout;

    private static LinearLayout linearLayoutRipple;
    private static Button btnClickMe;

    private static CustomView customView;
    private static DisplayMetrics metrics;
    private static LinearLayout ll;
    private SurfaceView surfaceView;
    private AnchorNode anchorNode2;
    public static boolean isArSupportedDevice = false;
    private Button btnStop;
    BroadcastReceiver receiver;
    IntentFilter filter;

    @RequiresApi(api = VERSION_CODES.N)
    @Override
    @SuppressWarnings({"AndroidApiChecker", "FutureReturnValueIgnored"})
    // CompletableFuture requires api level 24
    // FutureReturnValueIgnored is not valid
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        isArSupportedDevice = checkIsSupportedDeviceOrFinish(this);


        filter = new IntentFilter();
        filter.addAction("com.jitsi.finish");

        receiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (intent.getAction().equalsIgnoreCase("com.jitsi.finish")) {
                    sendJitsiMeet();
                    finish();
                }
            }
        };

        Log.d("##isArSupportedDevice1", String.valueOf(isArSupportedDevice));

        if (!isArSupportedDevice) {
            finish();
            return;
        } else {
            isArSupportedDevice = true;
        }

        Log.d("##isArSupportedDevice2", String.valueOf(isArSupportedDevice));


        activity = this;
        try {
            setContentView(R.layout.activity_ux);
        } catch (Exception e) {
            e.printStackTrace();
            Log.d("##AREXCEPTION", e.getMessage());
        }

        arFragment = (ArFragment) getSupportFragmentManager().findFragmentById(R.id.ux_fragment);
        context = this;
        linearLayout = (LinearLayout) LayoutInflater.from(this).inflate(R.layout.text_view, null);
        linearLayoutRipple = findViewById(R.id.main_layout);
        btnClickMe = findViewById(R.id.btn_clickme);
        frameLayout = findViewById(R.id.ar_framelayout);
        customView = findViewById(R.id.customview);
        btnStop = findViewById(R.id.btn_stop);

        surfaceView = arFragment.getArSceneView();
        surfaceView.getHolder().addCallback(this);

//      arFragment.getArSceneView().getScene().addOnPeekTouchListener(this);

        try {
            Intent intent = getIntent();
            int sourceWidth = Integer.parseInt((intent.getStringExtra("width")));
            int sourceHeight = Integer.parseInt((intent.getStringExtra("height")));

            changeLayoutSize(sourceWidth, sourceHeight);
        } catch (Exception e) {
            e.printStackTrace();
        }

        metrics = new DisplayMetrics();
        this.getWindowManager().getDefaultDisplay().getMetrics(metrics);
        customView.initDrawing(metrics, activity, ll, false);


        //When you build a Renderable, Sceneform loads its resources in the background while returning
        //a CompletableFuture. Call thenAccept(), handle(), or check isDone() before calling get().
        ModelRenderable.builder()
                .setSource(this, R.raw.andy)
                .build()
                .thenAccept(renderable -> andyRenderable = renderable)
                .exceptionally(
                        throwable -> {
                            Toast toast =
                                    Toast.makeText(this, "Unable to load andy renderable", Toast.LENGTH_LONG);
                            toast.setGravity(Gravity.CENTER, 0, 0);
                            toast.show();
                            return null;
                        });

        arFragment.setOnTapArPlaneListener(
                (HitResult hitResult, Plane plane, MotionEvent motionEvent) -> {
                    if (andyRenderable == null) {
                        return;
                    }

//                    onSingleTap(motionEvent,"Nitin");
//                    drawAnimtion(linearLayoutRipple,motionEvent);

                    // Create the Anchor.
//                    Anchor anchor = hitResult.createAnchor();
//                    AnchorNode anchorNode = new AnchorNode(anchor);
//                    anchorNode.setParent(arFragment.getArSceneView().getScene());
//                    // Create the transformable andy and add it to the anchor.
//                    TransformableNode andy = new TransformableNode(arFragment.getTransformationSystem());
//                    andy.setParent(anchorNode);
//                    andy.setRenderable(andyRenderable);
//                    andy.select();
//                    onSingleTap(motionEvent,"Nitin");
//                    addLineBetweenHits(hitResult,plane,motionEvent);

                });


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
            e.printStackTrace();
        }

        LocalBroadcastManager.getInstance(this).registerReceiver(mMessageReceiver,
                new IntentFilter("custom-stop-ar"));

        btnStop.setOnClickListener(view -> {
            sendMessage();
            sendJitsiMeet();
            activity.finish();
            currentStroke = null;
            node = null;
            activity = null;
            arFragment = null;
        });
    }

    private void sendJitsiMeet() {


        Intent jitsiBroadcast = null;
        try {
            jitsiBroadcast = new Intent(this, Class.forName("com.easyform.jitsi.broadcasts.JitsiPluginBroadcast"));
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        }
        jitsiBroadcast.setAction("com.easyform.jitsi.StopScreen");
        jitsiBroadcast.putExtra("keyType", "StopScreen");
        jitsiBroadcast.putExtra("keyData", isScreenStop);
        sendBroadcast(jitsiBroadcast);
    }


    @Override
    protected void onDestroy() {
        super.onDestroy();
        LocalBroadcastManager.getInstance(this).unregisterReceiver(mMessageReceiver);
        if (receiver != null) {
            unregisterReceiver(receiver);
            receiver = null;
        }
    }

    /**
     * Returns false and displays an error message if Sceneform can not run, true if Sceneform can run
     * on this device.
     *
     * <p>Sceneform requires Android N on the device as well as OpenGL 3.0 capabilities.
     *
     * <p>Finishes the activity if Sceneform can not run
     */
    public static boolean checkIsSupportedDeviceOrFinish(final Activity activity) {
        if (Build.VERSION.SDK_INT < VERSION_CODES.N) {

            Log.e(TAG, "Sceneform requires Android N or later");
            Toast.makeText(activity, "Sceneform requires Android N or later", Toast.LENGTH_LONG).show();
//            activity.finish();
            return false;
        }
        String openGlVersionString =
                ((ActivityManager) activity.getSystemService(Context.ACTIVITY_SERVICE))
                        .getDeviceConfigurationInfo()
                        .getGlEsVersion();
        if (Double.parseDouble(openGlVersionString) < MIN_OPENGL_VERSION) {
            Log.e(TAG, "Sceneform requires OpenGL ES 3.0 later");
            Toast.makeText(activity, "Sceneform requires OpenGL ES 3.0 or later", Toast.LENGTH_LONG)
                    .show();
//            activity.finish();
            return false;
        }
        return true;
    }

    @Override
    public void onTouchEventArClick() {
        Log.d("##SCENFORM", "1");
    }

    @RequiresApi(api = VERSION_CODES.N)
    @Override
    public void onTouchEventArClick(String values) {
        Log.d("##SCENFORM", values);

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
                new Handler(Looper.getMainLooper()).post(() -> {
                    Log.d("UI thread", "I am the UI thread");
                    initArcore(finalAction, metastate, finalDowntime, finalEventtime, finalGetx, finalGety, finalOldResX, finalOldResY, finalDrawingText);

                });
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    @RequiresApi(api = VERSION_CODES.N)
    @Override
    public void onTouchEventArClick(String values, String val) {
        Log.d("##SCENFORM", values + ":" + val);

        if (values.equalsIgnoreCase("color")) {
            textColor = val;
            int colorLastSelect = Color.parseColor(val);
            com.google.ar.sceneform.rendering.Color colorModel = new com.google.ar.sceneform.rendering.Color(colorLastSelect);

            new Handler(Looper.getMainLooper()).post(() -> {
                Log.d("UI thread", "I am the UI thread");
                MaterialFactory.makeOpaqueWithColor(activity, colorModel)
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

            activity.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    removeDrawing();
                }
            });


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

                    float newX = newCoords(getx, gety, oldResX, oldResY).get("newX");
                    float newY = newCoords(getx, gety, oldResX, oldResY).get("newY");

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


                    new Handler(Looper.getMainLooper()).post(() -> {
                        Log.d("UI thread", "I am the UI thread");
                        initArcore(action, metastate, finalDowntime, finalEventtime, getx, gety, oldResX, oldResY, "imagearrow", arrowType, arrowColor);
                    });
                }
            } catch (JSONException e) {
                e.printStackTrace();
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

                    new Handler(Looper.getMainLooper()).post(() -> {
                        Log.d("UI thread", "I am the UI thread");
                        initArcore(action, metastate, finalDowntime, finalEventtime, getx, gety, oldResX, oldResY, labletext, labletext, "");
                    });
                }
            } catch (JSONException e) {
                e.printStackTrace();
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
                    new Handler(Looper.getMainLooper()).post(() -> {
                        Log.d("UI thread", "I am the UI thread");
                        initArcore(finalAction, metastate, finalDowntime, finalEventtime, finalGetx, finalGety, finalOldResX, finalOldResY, finalDrawingText);

                    });
                }
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }
    }


    @RequiresApi(api = VERSION_CODES.N)
    private void initArcore(int action, int metastate, long downtime, long eventtime, float getx, float gety, int oldResX, int oldResY, String drawingText) {

        try {

            if (arFragment != null) {

                Frame frame = arFragment.getArSceneView().getArFrame();

                if (frame != null) {
                    float newX = newCoords(getx, gety, oldResX, oldResY).get("newX");
                    float newY = newCoords(getx, gety, oldResX, oldResY).get("newY");
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
            e.printStackTrace();
            Log.d("##SCENFORM_1", e.getMessage());
        }
    }


    @RequiresApi(api = VERSION_CODES.N)
    private void initArcore(int action, int metastate, long downtime, long eventtime, float getx, float gety, int oldResX, int oldResY, String drawingText, String arrowType, String arrowColor) {

        try {
            if (arFragment != null) {

                Frame frame = arFragment.getArSceneView().getArFrame();

                if (frame != null) {
                    float newX = newCoords(getx, gety, oldResX, oldResY).get("newX");
                    float newY = newCoords(getx, gety, oldResX, oldResY).get("newY");
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
            e.printStackTrace();
            Log.d("##SCENFORM_2", e.getMessage());
        }
    }


    private HashMap<String, Float> newCoords(float oldX, float oldY, int oldResX, int oldResY) {


        float newX = oldX / oldResX * newResolution().get("getX");
        float newY = oldY / oldResY * newResolution().get("getY");

        HashMap<String, Float> newCordinates = new HashMap<>();
        newCordinates.put("newX", newX);
        newCordinates.put("newY", newY);

        return newCordinates;
    }


    private HashMap<String, Integer> newResolution() {

        DisplayMetrics displayMetrics = new DisplayMetrics();
        WindowManager wm = (WindowManager) context.getSystemService(Context.WINDOW_SERVICE); // the results will be higher than using the activity context object or the getWindowManager() shortcut
        wm.getDefaultDisplay().getMetrics(displayMetrics);

        int screenWidth = displayMetrics.widthPixels;
        int screenHeight = displayMetrics.heightPixels;
//        sharedPreferences = getSharedPreferences("RATIO", Context.MODE_PRIVATE);
//        String dHeight1 =(sharedPreferences.getString("Height","320"));
//        String dWidth1  = (sharedPreferences.getString("Width","240"));
//        int dHeight = Integer.parseInt((sharedPreferences.getString("Height","320")));
//        int dWidth  = Integer.parseInt((sharedPreferences.getString("Width","240")));
        HashMap<String, Integer> newResolution = new HashMap<>();
        newResolution.put("getX", screenWidth);
        newResolution.put("getY", calHeight);

        return newResolution;
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
            e.printStackTrace();
            Log.d("##SCENE_TOUCH_EX", e.getMessage());
        }
    }


    private void changeLayoutSize(int newWidth, int newHeight) {

        DisplayMetrics displayMetrics = new DisplayMetrics();
        WindowManager wm = (WindowManager) context.getSystemService(Context.WINDOW_SERVICE); // the results will be higher than using the activity context object or the getWindowManager() shortcut
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

    @RequiresApi(api = VERSION_CODES.N)
    private void drawText(AnchorNode anchorNode, String drawingText) {

        linearLayout = (LinearLayout) LayoutInflater.from(context).inflate(R.layout.text_view, null);

        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(10, 10);
        params.setMargins(45, 0, 5, 0);

        TextView dynamicTextBackground = new TextView(context);
        dynamicTextBackground.setLayoutParams(params);
        dynamicTextBackground.setBackgroundColor(Color.YELLOW);
        dynamicTextBackground.setText("1");
        dynamicTextBackground.setTextSize(1);

        TextView dynamicTextView = new TextView(context);

        dynamicTextView.setLayoutParams(new LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT));
        dynamicTextView.setText(drawingText);
        dynamicTextView.setId(anchors.size());
        dynamicTextView.setBackgroundColor(Color.WHITE);
        dynamicTextView.setTextColor(Color.parseColor(textColor));
        dynamicTextView.setPadding(2, 2, 2, 2);


        dynamicTextBackground.setBackgroundDrawable(ContextCompat.getDrawable(context, R.drawable.badge_circle));
        linearLayout.addView(dynamicTextBackground);
        linearLayout.addView(dynamicTextView);


        ViewRenderable.builder()
                .setView(context, linearLayout)
                .build()
                .thenAccept(renderable -> {

                    viewRenderable = renderable;
                    viewRenderable.setShadowCaster(false);
                    viewRenderable.setShadowReceiver(false);

                    node = new Node();
                    node.setParent(anchorNode);
                    node.setRenderable(viewRenderable);
                    nodes.add(node);

                })
                .exceptionally(
                        throwable -> {
                            Toast toast =
                                    Toast.makeText(getApplicationContext(), "Unable to load andy renderable", Toast.LENGTH_LONG);
                            toast.setGravity(Gravity.CENTER, 0, 0);
                            toast.show();
                            return null;
                        });
    }

    @RequiresApi(api = VERSION_CODES.N)
    private void onSingleTap(MotionEvent motionEvent, String drawingText, String arrowType, String arrowColor) {


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
                            addArrow(anchorNode, arrowType, arrowColor);
                        } else {
                            drawText(anchorNode, drawingText);
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
                                addArrow(anchorNode, arrowType, arrowColor);
                            } else {
                                drawText(anchorNode, drawingText);
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
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
            arConfig.setPlaneFindingMode(Config.PlaneFindingMode.HORIZONTAL);
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
            registerReceiver(receiver, filter);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void removeDrawing() {
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
            e.printStackTrace();
        }
    }

    private void showTouches(float posX, float posY) {
        customView.drawHit(posX, posY);
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


    @RequiresApi(api = VERSION_CODES.N)
    private void addArrow(AnchorNode anchorNode, String arrowType, String arrowColor) {


        Log.d("##ADDARROW", "1");

        int arrowDrawable = selectArrowdrwable(arrowType, arrowColor);

        linearLayout = (LinearLayout) LayoutInflater.from(context).inflate(R.layout.text_view, null);
        Log.d("##ADDARROW", "2");
        ImageView imgView = new ImageView(context);
        Log.d("##ADDARROW", "3");


        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT);

        Log.d("##ADDARROW", "4");

//        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(100, 100);
        imgView.setLayoutParams(lp);
        Glide.with(context)
                .load(arrowDrawable)
                .override(100, 100)
                .into(imgView);

//        imgView.setRotation(90);

        Log.d("##ADDARROW", "5");


        linearLayout.addView(imgView);

        Log.d("##ADDARROW", "6");


        ViewRenderable.builder()
                .setView(context, linearLayout)
                .build()
                .thenAccept(renderable -> {

                    Log.d("##ADDARROW", "7");

                    viewRenderable = renderable;
                    viewRenderable.setShadowCaster(false);
                    viewRenderable.setShadowReceiver(false);

                    node = new Node();
//                    node.setLocalRotation(Quaternion.axisAngle(new Vector3(1f, 0, 0), 180f));
                    node.setParent(anchorNode);
                    node.setRenderable(viewRenderable);
                    nodes.add(node);

                    Log.d("##ADDARROW", "8");


                })
                .exceptionally(
                        throwable -> {
                            Toast toast =
                                    Toast.makeText(getApplicationContext(), "Unable to load andy renderable", Toast.LENGTH_LONG);
                            toast.setGravity(Gravity.CENTER, 0, 0);
                            toast.show();
                            return null;
                        });

    }


    private int selectArrowdrwable(String arrowType, String arrowColor) {


        //Down with Colors
        if (arrowType.equalsIgnoreCase("down") && arrowColor.equalsIgnoreCase("blue")) {

            return R.drawable.down_blue;
        }
        if (arrowType.equalsIgnoreCase("down") && arrowColor.equalsIgnoreCase("green")) {
            return R.drawable.down_green;
        }
        if (arrowType.equalsIgnoreCase("down") && arrowColor.equalsIgnoreCase("orange")) {

            return R.drawable.down_orange;
        }
        if (arrowType.equalsIgnoreCase("down") && arrowColor.equalsIgnoreCase("yellow")) {

            return R.drawable.down_yellow;
        }

        //Up

        if (arrowType.equalsIgnoreCase("up") && arrowColor.equalsIgnoreCase("blue")) {

            return R.drawable.up_blue;
        }
        if (arrowType.equalsIgnoreCase("up") && arrowColor.equalsIgnoreCase("green")) {

            return R.drawable.up_green;
        }
        if (arrowType.equalsIgnoreCase("up") && arrowColor.equalsIgnoreCase("orange")) {

            return R.drawable.up_orange;
        }
        if (arrowType.equalsIgnoreCase("up") && arrowColor.equalsIgnoreCase("yellow")) {

            return R.drawable.up_yellow;
        }

        //left

        if (arrowType.equalsIgnoreCase("left") && arrowColor.equalsIgnoreCase("blue")) {

            return R.drawable.left_blue;
        }
        if (arrowType.equalsIgnoreCase("left") && arrowColor.equalsIgnoreCase("green")) {

            return R.drawable.left_green;
        }
        if (arrowType.equalsIgnoreCase("left") && arrowColor.equalsIgnoreCase("orange")) {

            return R.drawable.left_orange;
        }
        if (arrowType.equalsIgnoreCase("left") && arrowColor.equalsIgnoreCase("yellow")) {

            return R.drawable.left_yellow;
        }


        //right
        if (arrowType.equalsIgnoreCase("right") && arrowColor.equalsIgnoreCase("blue")) {

            return R.drawable.right_blue;
        }
        if (arrowType.equalsIgnoreCase("right") && arrowColor.equalsIgnoreCase("green")) {

            return R.drawable.right_green;
        }
        if (arrowType.equalsIgnoreCase("right") && arrowColor.equalsIgnoreCase("orange")) {

            return R.drawable.right_orange;
        }
        if (arrowType.equalsIgnoreCase("right") && arrowColor.equalsIgnoreCase("yellow")) {

            return R.drawable.right_yellow;
        }
        return 0;
    }


    @RequiresApi(api = VERSION_CODES.N)
    private void onSingleTap(MotionEvent motionEvent, String drawingText) {


        try {
            Frame frame = arFragment.getArSceneView().getArFrame();

            if (frame != null) {

                Log.d("##TRACKINGSTATE", String.valueOf(frame.getCamera().getTrackingState() == TrackingState.TRACKING));

                if (motionEvent != null && frame.getCamera().getTrackingState() == TrackingState.TRACKING) {

                    Log.d("##HITTEST", String.valueOf(frame.hitTest(motionEvent)));

                    List<HitResult> hitResult = frame.hitTest(motionEvent);

                    if (hitResult.size() != 0) {
                        HitResult hit = hitResult.get(0);
                        Anchor anchor = hit.createAnchor();
                        AnchorNode anchorNode = new AnchorNode(anchor);
                        anchorNode.setParent(arFragment.getArSceneView().getScene());
                        anchors.add(anchor);
                        drawText(anchorNode, drawingText);

                    } else {

                        if (arFragment.getArSceneView().getSession() != null) {
                            Anchor anchor = arFragment.getArSceneView().getSession().createAnchor(frame.getCamera().getPose().compose(Pose.makeTranslation(0, 0, -1f)).extractTranslation());
                            AnchorNode anchorNode = new AnchorNode(anchor);
                            anchorNode.setParent(arFragment.getArSceneView().getScene());
                            anchors.add(anchor);
                            drawText(anchorNode, drawingText);
                        }
                    }
                }

            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void onBackPressed() {
        super.onBackPressed();
        sendMessage();
        sendJitsiMeet();
    }


    private void sendMessage() {
        Log.d("sender", "Broadcasting message");
        Intent intent = new Intent("custom-event-name");
        intent.putExtra("message", "This is my message!");
        LocalBroadcastManager.getInstance(this).sendBroadcast(intent);
    }

    private final BroadcastReceiver mMessageReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            // Get extra data included in the Intent
            String message = intent.getStringExtra("message");
            finish();
        }
    };
}
