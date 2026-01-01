package com.sky.atc.easyformse.geofencenew;

import android.content.ContentValues;
import android.content.Intent;

import com.commonsware.cwac.wakeful.WakefulIntentService;
import com.sky.atc.easyformse.GeofenceDownlaod;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

//To Download Geofence Data
@StringFogIgnore
public class GeofenceDownlodService extends WakefulIntentService {


    public GeofenceDownlodService() {
        super("getlatlong");
        // TODO Auto-generated constructor stub
    }

    @Override
    protected void doWakefulWork(Intent arg0) {

        String geotracking=arg0.getStringExtra("geotracking");
        String id=arg0.getStringExtra("id");

        GeofenceDownlaod geofenceDownlaod = new GeofenceDownlaod();
        geofenceDownlaod.geofence_download_new();

    }
}