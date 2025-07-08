package com.easyform.jitsi.utils.drawing;

import android.annotation.SuppressLint;
import android.app.Activity;

import com.google.ar.sceneform.samples.hellosceneform.HelloSceneformActivity;
import com.google.ar.sceneform.samples.hellosceneform.TouchEventAR;

public class EventUtils {

    //    public static ScreenShareListner screenShareListner1;
    public static TouchEventAR touchEventAR;

    @SuppressLint("StaticFieldLeak")
    public static Activity activityEvents;

    public EventUtils(HelloSceneformActivity activity1, Activity activity) {
//        screenShareListner1=screenShareListner;
        touchEventAR = activity1;
        activityEvents = activity;
    }


}
