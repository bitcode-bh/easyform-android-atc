package com.easyform.jitsi.utils.drawing;

import static com.easyform.jitsi.ui.activitys.CameraPreviewActivity.activity;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.Application;
import android.content.Context;

import com.easyform.jitsi.ui.activitys.CameraPreviewActivity;
import com.google.ar.sceneform.samples.hellosceneform.HelloSceneformActivity;


public class App extends Application {

    @SuppressLint("StaticFieldLeak")
    public static Context context;
    //    public static Activity activity = HelloSceneformActivity.activity;
    public static Activity activity1 = activity;

    public static void setContext(Context context) {
        App.context = context;
    }

    public static boolean Hellofinish() {

        activity.finish();

        return true;
    }

    public static boolean cameraFinish() {
        activity1.finish();

        return true;
    }


    @Override
    public void onCreate() {
        super.onCreate();
        context = this;
    }

    public static Context getContext() {
        return context;
    }


}
