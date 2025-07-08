package com.sky.atc.easyformse.attendance;

import android.os.Bundle;

import org.apache.cordova.CordovaActivity;

import io.michaelrocks.paranoid.Obfuscate;

//Open Checksheet Logic pending
@Obfuscate
public class OpenChecksheet extends CordovaActivity {


    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        super.loadUrl("file:///android_asset/www2/pending_status.html");
    }
}
