package com.sky.atc.easyformse.jobshedulers;

import com.sky.atc.easyformse.DeviceEventsUtils;

import android.app.ActivityManager;
import android.app.job.JobParameters;
import android.app.job.JobService;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;

import android.os.Build;
import androidx.annotation.RequiresApi;
import androidx.core.app.ActivityCompat;

import android.os.StrictMode;
import android.util.Log;
import android.widget.Toast;

import com.sky.atc.easyformse.Activity_recognition;
import com.sky.atc.easyformse.newfused;
import com.sky.atc.easyformse.sqlitewraper;

import net.sqlcipher.database.SQLiteDatabase;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

//Job schedulers to start the location  service
@StringFogIgnore
public class TestJobService extends JobService {

    SQLiteDatabase database;

    @Override
    public boolean onStartJob(JobParameters params) {

        database=sqlitewraper.getDatabase();

        Log.d("###onStartJob", "that");
//        boolean check = DeviceEventsUtils.isMyServiceRunning(sqlitewraper.context,
//                newfused_gps.class.getName());
//        if (!check) {
//
//            if(getApplicationContext().getPackageName().equals("com.easyform.muvr") || getApplicationContext().getPackageName().equals("com.easyform.muvr2") )
//            {
//
//            }
//            else {
//                if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
//
//                    Toast.makeText(sqlitewraper.context,"Give Required Location Permission!!",Toast.LENGTH_SHORT).show();
//
//                }else {
//
//                    if (DeviceEventsUtils.liveTripCount()>0) {
//
////                        Intent i = new Intent(sqlitewraper.context, newfused_gps.class);
////                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
////                            sqlitewraper.context.startForegroundService(i);
////                        }else {
////                            sqlitewraper.context.startService(i);
////                        }
//                    }
//                }
//            }
//
//        }


        boolean checkfused = DeviceEventsUtils.isMyServiceRunning(sqlitewraper.context,
                newfused.class.getName());
        if (!checkfused) {

            if(getApplicationContext().getPackageName().equals("com.easyform.muvr") || getApplicationContext().getPackageName().equals("com.easyform.muvr2") )
            {

            }
            else {


                if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {

                    Toast.makeText(sqlitewraper.context, "Give Required Location Permission!!", Toast.LENGTH_SHORT).show();

                } else {

                    if (DeviceEventsUtils.liveTripCount() > 0) {
                        Intent i = new Intent(sqlitewraper.context, newfused.class);
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                            sqlitewraper.context.startForegroundService(i);
                        } else {
                            sqlitewraper.context.startService(i);
                        }
                    }
                }
            }
        }

        //hide newfused and activity_recognition code  23-07-2025
        // enbale activity_recognition code  07082026
        boolean checkfused2 = DeviceEventsUtils.isMyServiceRunning(sqlitewraper.context,
                Activity_recognition.class.getName());
        if (!checkfused2) {

            if(getApplicationContext().getPackageName().equals("com.easyform.muvr") || getApplicationContext().getPackageName().equals("com.easyform.muvr2") )
            {

            }
            else {
                if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {

                    Toast.makeText(sqlitewraper.context,"Give Required Location Permission!!",Toast.LENGTH_SHORT).show();

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

        }


        Util.scheduleJob(getApplicationContext()); //reschedule the job
        return true;
    }


    @Override
    public boolean onStopJob(JobParameters params) {
        return true;
    }

}
