package com.sky.atc.easyformse.jobshedulers;

import android.app.ActivityManager;
import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.os.Build;
import android.os.PowerManager;
import androidx.core.app.ActivityCompat;
import android.util.Log;

import com.sky.atc.easyformse.Activity_recognition;
import com.sky.atc.easyformse.datautils.DataUtils;
import com.sky.atc.easyformse.newfused;
import com.sky.atc.easyformse.newfused_gps;
import com.sky.atc.easyformse.sqlitewraper;

import net.sqlcipher.database.SQLiteDatabase;

import io.michaelrocks.paranoid.Obfuscate;

//alarm for loaction service start
@Obfuscate
public class SetAlarmTrip extends BroadcastReceiver
{
    @Override
    public void onReceive(Context context, Intent intent)
    {
        PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        PowerManager.WakeLock wl = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "Trip:SetAlarmTrip");
        wl.acquire();
        // Put here YOUR code.
//        Toast.makeText(context, "Alarm !!!!!!!!!!", Toast.LENGTH_LONG).show();// For example

        try {
//            boolean check = isMyServiceRunning(sqlitewraper.context,
//                    newfused_gps.class.getName());
//            if (!check) {
//
//                if (ActivityCompat.checkSelfPermission(context, android.Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED || ActivityCompat.checkSelfPermission(context, android.Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
//
//                    if (tripStatus() > 0) {
//                        //hide newfused and activity_recognition code  23-07-2025
////                        Intent i = new Intent(sqlitewraper.context, newfused_gps.class);
////                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
////                            sqlitewraper.context.startForegroundService(i);
////                        }else {
////                            sqlitewraper.context.startService(i);
////                        }
//                    }
//                }
//            }else {
//                long currentMilli=System.currentTimeMillis();
//                long duration=currentMilli-DataUtils.getServiceMilli();
//
//                if (duration>60000){
//
//                    if (tripStatus() > 0) {
//                        Intent i = new Intent(sqlitewraper.context, newfused_gps.class);
//                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
//                            sqlitewraper.context.startForegroundService(i);
//                        }else {
//                            sqlitewraper.context.startService(i);
//                        }
//                    }
//                }
//            }
            boolean checkfused = isMyServiceRunning(sqlitewraper.context,
                    newfused.class.getName());
            if (!checkfused) {

                if (ActivityCompat.checkSelfPermission(context, android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(context, android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {

//                Toast.makeText(sqlitewraper.context,"Give Required Location Permission!!",Toast.LENGTH_SHORT).show();

                } else {

                    if (tripStatus() > 0) {
                        Intent i = new Intent(sqlitewraper.context, newfused.class);
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                            sqlitewraper.context.startForegroundService(i);
                        }else {
                            sqlitewraper.context.startService(i);
                        }
                    }
                }
            }else {

                long currentMilli=System.currentTimeMillis();
                long duration=currentMilli-DataUtils.getServiceMilli();

                if (duration>60000){
                    if (tripStatus() > 0) {
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
//            boolean checkfused2 = isMyServiceRunning(sqlitewraper.context,
//                    Activity_recognition.class.getName());
//            if (!checkfused2) {
//
//                if (ActivityCompat.checkSelfPermission(context, android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(context, android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
//
////                Toast.makeText(sqlitewraper.context,"Give Required Location Permission!!",Toast.LENGTH_SHORT).show();
//
//                } else {
//
//                    if (tripStatus() > 0) {
//                        Intent i = new Intent(sqlitewraper.context, Activity_recognition.class);
//                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
//                            sqlitewraper.context.startForegroundService(i);
//                        }else {
//                            sqlitewraper.context.startService(i);
//                        }
//                    }
//                }
//            }

            Log.d("##SETALARM", "1");
            wl.release();
        }catch (Exception e){
            e.printStackTrace();
        }
    }

    public void setAlarm(Context context)
    {
        Log.d("##SETALART","");
        AlarmManager am =( AlarmManager)context.getSystemService(Context.ALARM_SERVICE);
        Intent i = new Intent(context, SetAlarmTrip.class);
        PendingIntent pi = PendingIntent.getBroadcast(context, 0, i, 0);
        am.cancel(pi);
        am.setRepeating(AlarmManager.RTC_WAKEUP, System.currentTimeMillis(), 1000 * 60, pi); // Millisec * Second * Minute
    }

    public void cancelAlarm(Context context)
    {
        Intent intent = new Intent(context, SetAlarmTrip.class);
        PendingIntent sender = PendingIntent.getBroadcast(context, 0, intent, 0);
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        alarmManager.cancel(sender);
    }

    private int tripStatus(){

        SQLiteDatabase database=sqlitewraper.getDatabase();

        Cursor tripflag = database.rawQuery(
                "select * from lat_plug where trip_status = 0", null);
        tripflag.moveToFirst();
        int tripflagCount = tripflag.getCount();
        tripflag.close();
        return tripflagCount;
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