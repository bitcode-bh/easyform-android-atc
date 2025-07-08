package com.google.ar.sceneform.samples.hellosceneform;

import android.os.Bundle;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

public class NewJavaActivity extends AppCompatActivity {

    TouchEventAR touchEventAR;
    HelloSceneformActivity activity = new HelloSceneformActivity();

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        try {
            touchEventAR= activity;
            touchEventAR.onTouchEventArClick("Nitin");
        }catch (Exception e){
            e.printStackTrace();
        }
    }
}
