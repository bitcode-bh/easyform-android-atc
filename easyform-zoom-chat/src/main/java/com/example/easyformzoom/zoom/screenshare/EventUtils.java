package com.example.easyformzoom.zoom.screenshare;

import android.app.Activity;

import com.google.ar.sceneform.samples.hellosceneform.HelloSceneformActivity;
import com.google.ar.sceneform.samples.hellosceneform.TouchEventAR;

public class EventUtils {

    public static ScreenShareListner screenShareListner1;
    public static TouchEventAR touchEventAR;
    public static Activity activityEvents;

    public EventUtils(ScreenShareListner screenShareListner, HelloSceneformActivity activity1, Activity activity) {
        screenShareListner1=screenShareListner;
        touchEventAR=activity1;
        activityEvents=activity;
    }


}
