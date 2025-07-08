package com.sky.atc.easyformse.attendance;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

import io.michaelrocks.paranoid.Obfuscate;

//Not Used
@Obfuscate
public class AutoCheckOutReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d("##AutoCheckOutReceiver","1");
//        AttendanceClass.isCheckOut();

    }
}
