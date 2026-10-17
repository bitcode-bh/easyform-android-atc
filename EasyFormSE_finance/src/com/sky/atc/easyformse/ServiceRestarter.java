package com.sky.atc.easyformse;

import android.app.ActivityManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;


public class ServiceRestarter extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {



        boolean check = DeviceEventsUtils.isMyServiceRunning(sqlitewraper.context,
                newfused.class.getName());

        if (check) {

        }
        else {
            Intent serviceIntent = new Intent(context, newfused.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }
        }


    }
}
