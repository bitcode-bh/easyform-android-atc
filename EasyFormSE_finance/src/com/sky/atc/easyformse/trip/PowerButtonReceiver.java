package com.sky.atc.easyformse.trip;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

import io.michaelrocks.paranoid.Obfuscate;

//Power button click receiver
@Obfuscate
public class PowerButtonReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {

        String action =intent.getAction();
        Log.d("##POWERBUTTON","Clicked");
        if (action != null) {
            ScreenOnoffUtils.insertIntoScreenoff(action);
        }
    }

}
