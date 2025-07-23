package com.sky.atc.easyformse.jobshedulers;

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
import com.sky.atc.easyformse.newfused_gps;
import com.sky.atc.easyformse.sqlitewraper;

import net.sqlcipher.database.SQLiteDatabase;

import io.michaelrocks.paranoid.Obfuscate;

//Job schedulers to start the location  service
@Obfuscate
@RequiresApi(api = Build.VERSION_CODES.LOLLIPOP)
public class TestJobService extends JobService {

    SQLiteDatabase database;

    @Override
    public boolean onStartJob(JobParameters params) {
        StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
        StrictMode.setThreadPolicy(policy);
        database=sqlitewraper.getDatabase();

        Log.d("###onStartJob", "that");
//        boolean check = isMyServiceRunning(sqlitewraper.context,
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
//                    if (tripStatus()>0) {
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


        boolean checkfused = isMyServiceRunning(sqlitewraper.context,
                newfused.class.getName());
        if (!checkfused) {

            if(getApplicationContext().getPackageName().equals("com.easyform.muvr") || getApplicationContext().getPackageName().equals("com.easyform.muvr2") )
            {

            }
            else {


                if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {

                    Toast.makeText(sqlitewraper.context, "Give Required Location Permission!!", Toast.LENGTH_SHORT).show();

                } else {

                    if (tripStatus() > 0) {
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
//        boolean checkfused2 = isMyServiceRunning(sqlitewraper.context,
//                Activity_recognition.class.getName());
//        if (!checkfused2) {
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
//                    if (tripStatus()>0) {
//                        Intent i = new Intent(sqlitewraper.context, Activity_recognition.class);
//                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
//                            sqlitewraper.context.startForegroundService(i);
//                        }else {
//                            sqlitewraper.context.startService(i);
//                        }
//                    }
//                }
//            }
//
//        }


        Util.scheduleJob(getApplicationContext()); //reschedule the job
        return true;
    }

    private int tripStatus(){

        Cursor tripflag = database.rawQuery(
                "select * from lat_plug where trip_status = 0", null);
        tripflag.moveToFirst();
        int tripflagCount = tripflag.getCount();
        tripflag.close();
        return tripflagCount;
    }

    @Override
    public boolean onStopJob(JobParameters params) {
        return true;
    }

    private boolean isMyServiceRunning(Context context, String Myservice) {
        ActivityManager manager = (ActivityManager) context
                .getSystemService(Context.ACTIVITY_SERVICE);
        for (ActivityManager.RunningServiceInfo service : manager
                .getRunningServices(Integer.MAX_VALUE)) {
            if (Myservice.equals(service.service.getClassName())) {

                return true;
            }
        }
        return false;
    }
}
