package com.sky.atc.easyformse.attendance;

import android.os.Bundle;

import org.apache.cordova.CordovaActivity;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

//Open Checksheet Logic pending
@StringFogIgnore
public class OpenChecksheet extends CordovaActivity {


    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        super.loadUrl("file:///android_asset/www2/pending_status.html");
    }
}
