package com.sky.atc.easyformse.jobshedulers;

import com.sky.atc.easyformse.DeviceEventsUtils;


import android.app.ActivityManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.os.Build;
import androidx.core.app.ActivityCompat;
import android.util.Log;

import com.firebase.jobdispatcher.JobParameters;
import com.firebase.jobdispatcher.JobService;
import com.sky.atc.easyformse.Activity_recognition;
import com.sky.atc.easyformse.newfused;
import com.sky.atc.easyformse.sqlitewraper;

import net.sqlcipher.database.SQLiteDatabase;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

//Job Scheduler to for location services
//Used Firebase JOb dispatcher
@StringFogIgnore
public class MyJobService extends JobService {

    SQLiteDatabase database;


    @Override
    public boolean onStartJob(JobParameters job) {
        // Do some work here
        database=sqlitewraper.getDatabase();

        Log.d("###FireBaseJobDisp",job.getService());
//        boolean check = DeviceEventsUtils.isMyServiceRunning(sqlitewraper.context,
//                newfused_gps.class.getName());
//        if (!check) {
//
//            if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
//
////                Toast.makeText(sqlitewraper.context,"Give Required Location Permission!!",Toast.LENGTH_SHORT).show();
//
//            }else {
//
//                if (DeviceEventsUtils.liveTripCount()>0) {
//                    //hide newfused and activity_recognition code  23-07-2025
////                    Intent i = new Intent(sqlitewraper.context, newfused_gps.class);
////                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
////                        sqlitewraper.context.startForegroundService(i);
////                    }else {
////                        sqlitewraper.context.startService(i);
////                    }
//                }
//
//            }
//        }

        boolean checkfused = DeviceEventsUtils.isMyServiceRunning(sqlitewraper.context,
                newfused.class.getName());
        if (!checkfused) {

            if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {

//                Toast.makeText(sqlitewraper.context,"Give Required Location Permission!!",Toast.LENGTH_SHORT).show();

            }else {

                if (DeviceEventsUtils.liveTripCount()>0) {
                    Intent i = new Intent(sqlitewraper.context, newfused.class);
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        sqlitewraper.context.startForegroundService(i);
                    }else {
                        sqlitewraper.context.startService(i);
                    }
                }
            }
        }

        //hide newfused and activity_recognition code  23-07-2025
        // enbale activity_recognition code  07082026
        boolean checkfused3 = DeviceEventsUtils.isMyServiceRunning(sqlitewraper.context,
                Activity_recognition.class.getName());
        if (!checkfused3) {

            if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {

//                Toast.makeText(sqlitewraper.context,"Give Required Location Permission!!",Toast.LENGTH_SHORT).show();

            }else {

                if (DeviceEventsUtils.liveTripCount()>0) {
                    Intent i = new Intent(sqlitewraper.context, Activity_recognition.class);
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        sqlitewraper.context.startForegroundService(i);
                    }else {
                        sqlitewraper.context.startService(i);
                    }
                }
            }
        }



        
        return false; // Answers the question: "Is there still work going on?"
    }

    @Override
    public boolean onStopJob(JobParameters job) {
        return false; // Answers the question: "Should this job be retried?"
    }


}