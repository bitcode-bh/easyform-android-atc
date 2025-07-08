package com.sky.atc.easyformse;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.util.Log;

import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.geofencenew.GeoFenceDraw;

import io.michaelrocks.paranoid.Obfuscate;

import static android.content.Context.MODE_PRIVATE;

//Boot Receiver to redraw geofence
@Obfuscate
public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d("##BOOTCOMLETERECEIVER","Boot Completed");

        MySharedPreferences editor =sqlitewraper.getSecureShared("MY_PREFS_NAME");
        editor.putInt("bootflag",0);
        editor.commit();

        GeoFenceDraw geoFenceDraw= new GeoFenceDraw();
        geoFenceDraw.getSiteinfoNew();

    }
}
