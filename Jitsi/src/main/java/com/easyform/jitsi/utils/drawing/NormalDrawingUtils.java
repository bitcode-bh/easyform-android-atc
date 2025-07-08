package com.easyform.jitsi.utils.drawing;

import static com.easyform.jitsi.utils.drawing.App.context;

import android.annotation.SuppressLint;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Handler;
import android.os.Looper;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.MotionEvent;
import android.view.WindowManager;

import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import com.google.ar.sceneform.samples.hellosceneform.HelloSceneformActivity;

import org.jitsi.meet.sdk.BroadcastIntentHelper;
import org.json.JSONArray;
import org.json.JSONException;


import java.util.HashMap;

public class NormalDrawingUtils {


    static NormalDrawingListeners normalDrawingListener = PaintViewNormal.normalDrawingListener;
    static CustomNormalDrawingListners customNormalDrawingListner = PaintViewNormal.customNormalDrawingListner;


    // @RequiresApi(api = Build.VERSION_CODES.N)
    @SuppressLint("LogNotTimber")
    public static void drawingNormal(String values, String val) {


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
//                            oldResY = 1280;

                            Log.d("##OLDRESOLTION_NO", "X: " + oldResX + " Y: " + oldResY);

                            downtime = Long.parseLong(jsonObject.getString(2));
                            eventtime = Long.parseLong(jsonObject.getString(3));
                            getx = Float.parseFloat(jsonObject.getString(4));
                            gety = Float.parseFloat(jsonObject.getString(5));
//                    action= Integer.parseInt(jsonObject.getString(6));
                            action = 0;
                            Log.d("##HELLOACTION_NO", String.valueOf(action));
                            drawingText = "";
                        } catch (Exception e) {

                            e.printStackTrace();
                        }


                    } else if (i > 0) {

                        action = 2;
                        eventtime += 50;
                        getx = Float.parseFloat(jsonObject.getString(0));
                        gety = Float.parseFloat(jsonObject.getString(1));
                        action = Integer.parseInt(jsonObject.getString(2));
                        Log.d("##HELLOACTIONSTRIN2_NO", String.valueOf(action));

                    } else if (i == jsonArray.length() - 1) {
                        action = 1;
                        eventtime += 50;
                        getx = Float.parseFloat(jsonObject.getString(0));
                        gety = Float.parseFloat(jsonObject.getString(1));
//                    action= Integer.parseInt(jsonObject.getString(2));
                        Log.d("##HELLOACTIONSTRIN3_NO", String.valueOf(action));
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
                        Log.d("##UI thread", "I am the UI thread");
                        initArcore(finalAction, metastate, finalDowntime, finalEventtime, finalGetx, finalGety, finalOldResX, finalOldResY, finalDrawingText);

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
        if (values.equalsIgnoreCase("delete")) {
            normalDrawingListener.onNormalDrawing(null, "delete");
        }


        if (values.equalsIgnoreCase("StopScreen")) {
            Intent finishIntent = new Intent();
            finishIntent.setAction("com.jitsi.finish");
            App.getContext().sendBroadcast(finishIntent);
            Intent ScreenOnIntent = BroadcastIntentHelper.buildToggleScreenShareIntent(false);
            LocalBroadcastManager.getInstance(App.getContext()).sendBroadcast(ScreenOnIntent);
        }

    }

    //    @RequiresApi(api = Build.VERSION_CODES.N)
    @SuppressLint("LogNotTimber")
    private static void initArcore(int action, int metastate, long downtime, long eventtime, float getx, float gety, int oldResX, int oldResY, String drawingText) {

        try {
            float newX = newCoords(getx, gety, oldResX, oldResY).get("newX");
            float newY = newCoords(getx, gety, oldResX, oldResY).get("newY");
            MotionEvent motionEvent = MotionEvent.obtain(downtime, eventtime, action, newX, newY, metastate);

            if (drawingText.equalsIgnoreCase("delete")) {
            } else if (!drawingText.equalsIgnoreCase("")) {
                NormalDrawingListeners normalDrawingListener = PaintViewNormal.normalDrawingListener;
                normalDrawingListener.onNormalDrawing(motionEvent, "text");
            } else {
                NormalDrawingListeners normalDrawingListener = PaintViewNormal.normalDrawingListener;
                normalDrawingListener.onNormalDrawing(motionEvent, "gesture");
            }
        } catch (Exception e) {
            e.printStackTrace();
            Log.d("##SCENFORM", e.getMessage());
        }
    }

    private static HashMap<String, Float> newCoords(float oldX, float oldY, int oldResX, int oldResY) {

        float newX = oldX / oldResX * newResolution().get("getX");
        float newY = oldY / oldResY * newResolution().get("getY");

        HashMap<String, Float> newCordinates = new HashMap<>();
        newCordinates.put("newX", newX);
        newCordinates.put("newY", newY);

        return newCordinates;
    }

    private static HashMap<String, Integer> newResolution() {
        DisplayMetrics displayMetrics = new DisplayMetrics();
        WindowManager wm = (WindowManager) App.getContext().getSystemService(Context.WINDOW_SERVICE); // the results will be higher than using the activity context object or the getWindowManager() shortcut
        wm.getDefaultDisplay().getMetrics(displayMetrics);

        int screenWidth;
        int screenHeight;

        screenWidth = RemoteUtils.getRealSizeWidth();
        screenHeight = RemoteUtils.getRealSizeHeight();

        screenHeight = RemoteUtils.newNormalHeight;


        HashMap<String, Integer> newResolution = new HashMap<>();
        newResolution.put("getX", screenWidth);
        newResolution.put("getY", screenHeight);
        return newResolution;
    }

    @SuppressLint("LogNotTimber")
    private static void initArcore(int action, int metastate, long downtime, long eventtime, float getx, float gety, int oldResX, int oldResY, String drawingText, String arrowType, String arrowColor) {

        try {
            float newX = newCoords(getx, gety, oldResX, oldResY).get("newX");
            float newY = newCoords(getx, gety, oldResX, oldResY).get("newY");
            MotionEvent motionEvent = MotionEvent.obtain(downtime, eventtime, action, newX, newY, metastate);

            if (drawingText.equalsIgnoreCase("imagearrow")) {
                addImagetoScreen(motionEvent, arrowType, arrowColor);
            } else {

                customNormalDrawingListner.onTextDrawn(motionEvent, drawingText);
            }

        } catch (Exception e) {
            e.printStackTrace();
            Log.d("##SCENFORM", e.getMessage());
        }
    }

    private static void addImagetoScreen(MotionEvent event, String arrowType, String arrowColor) {
        Bitmap b = BitmapFactory.decodeResource(App.getContext().getResources(), selectArrowdrwable(arrowType, arrowColor));
        customNormalDrawingListner.onImageShown(event, b);
    }

    private static int selectArrowdrwable(String arrowType, String arrowColor) {
        //Down with Colors
        if (arrowType.equalsIgnoreCase("down") && arrowColor.equalsIgnoreCase("blue")) {

            return com.google.ar.sceneform.samples.hellosceneform.R.drawable.down_blue;
        }
        if (arrowType.equalsIgnoreCase("down") && arrowColor.equalsIgnoreCase("green")) {
            return com.google.ar.sceneform.samples.hellosceneform.R.drawable.down_green;
        }
        if (arrowType.equalsIgnoreCase("down") && arrowColor.equalsIgnoreCase("orange")) {

            return com.google.ar.sceneform.samples.hellosceneform.R.drawable.down_orange;
        }
        if (arrowType.equalsIgnoreCase("down") && arrowColor.equalsIgnoreCase("yellow")) {

            return com.google.ar.sceneform.samples.hellosceneform.R.drawable.down_yellow;
        }

        //Up
        if (arrowType.equalsIgnoreCase("up") && arrowColor.equalsIgnoreCase("blue")) {

            return com.google.ar.sceneform.samples.hellosceneform.R.drawable.up_blue;
        }
        if (arrowType.equalsIgnoreCase("up") && arrowColor.equalsIgnoreCase("green")) {

            return com.google.ar.sceneform.samples.hellosceneform.R.drawable.up_green;
        }
        if (arrowType.equalsIgnoreCase("up") && arrowColor.equalsIgnoreCase("orange")) {

            return com.google.ar.sceneform.samples.hellosceneform.R.drawable.up_orange;
        }
        if (arrowType.equalsIgnoreCase("up") && arrowColor.equalsIgnoreCase("yellow")) {

            return com.google.ar.sceneform.samples.hellosceneform.R.drawable.up_yellow;
        }

        //left
        if (arrowType.equalsIgnoreCase("left") && arrowColor.equalsIgnoreCase("blue")) {

            return com.google.ar.sceneform.samples.hellosceneform.R.drawable.left_blue;
        }
        if (arrowType.equalsIgnoreCase("left") && arrowColor.equalsIgnoreCase("green")) {

            return com.google.ar.sceneform.samples.hellosceneform.R.drawable.left_green;
        }
        if (arrowType.equalsIgnoreCase("left") && arrowColor.equalsIgnoreCase("orange")) {

            return com.google.ar.sceneform.samples.hellosceneform.R.drawable.left_orange;
        }
        if (arrowType.equalsIgnoreCase("left") && arrowColor.equalsIgnoreCase("yellow")) {

            return com.google.ar.sceneform.samples.hellosceneform.R.drawable.left_yellow;
        }


        //right
        if (arrowType.equalsIgnoreCase("right") && arrowColor.equalsIgnoreCase("blue")) {

            return com.google.ar.sceneform.samples.hellosceneform.R.drawable.right_blue;
        }
        if (arrowType.equalsIgnoreCase("right") && arrowColor.equalsIgnoreCase("green")) {

            return com.google.ar.sceneform.samples.hellosceneform.R.drawable.right_green;
        }
        if (arrowType.equalsIgnoreCase("right") && arrowColor.equalsIgnoreCase("orange")) {

            return com.google.ar.sceneform.samples.hellosceneform.R.drawable.right_orange;
        }
        if (arrowType.equalsIgnoreCase("right") && arrowColor.equalsIgnoreCase("yellow")) {

            return com.google.ar.sceneform.samples.hellosceneform.R.drawable.right_yellow;
        }
        return 0;
    }

}
