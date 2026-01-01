package com.easyform.newjitsi.activitys.drawing.AR;

import android.os.Bundle;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

public class NewJavaActivity extends AppCompatActivity {

    TouchEventAR touchEventAR;
    ARDrawActivity activity = new ARDrawActivity();

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
