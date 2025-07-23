package com.sky.atc.easyformse.jobshedulers;

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

import static com.sky.atc.easyformse.DeviceEventsUtils.isMyServiceRunning;

//Set alarm while idle for location services
@Obfuscate
public class SetAlarmWhileIdle extends BroadcastReceiver {


    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d("#####SETALART", "1");
        PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        PowerManager.WakeLock wl = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "Trip:SetAlarmTrip");
        wl.acquire();
        // Put here YOUR code.
//        Toast.makeText(context, "Alarm !!!!!!!!!!", Toast.LENGTH_LONG).show();// For example
        if (sqlitewraper.context != null) {
            setAlarm(sqlitewraper.context);
        }

        try {
//            boolean check = isMyServiceRunning(sqlitewraper.context,
//                    newfused_gps.class.getName());
//            if (!check) {
//
//                if (ActivityCompat.checkSelfPermission(context, android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(context, android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
//
////                Toast.makeText(sqlitewraper.context,"Give Required Location Permission!!",Toast.LENGTH_SHORT).show();
//
//                } else {
//
//                    if (tripStatus() > 0) {
//                        //hide newfused and activity_recognition code  23-07-2025
////                        Intent i = new Intent(sqlitewraper.context, newfused_gps.class);
////                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
////                            sqlitewraper.context.startForegroundService(i);
////                        } else {
////                            sqlitewraper.context.startService(i);
////                        }
//                    }
//                }
//            }else {
//                long currentMilli=System.currentTimeMillis();
//                long duration=currentMilli- DataUtils.getServiceMilli();
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
                        } else {
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
//                        } else {
//                            sqlitewraper.context.startService(i);
//                        }
//                    }
//                }
//            }

            wl.release();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private int tripStatus() {

        SQLiteDatabase database = sqlitewraper.getDatabase();

        Cursor tripflag = database.rawQuery(
                "select * from lat_plug where trip_status = 0", null);
        tripflag.moveToFirst();
        int tripflagCount = tripflag.getCount();
        tripflag.close();
        return tripflagCount;
    }

    public void setAlarm(Context context) {
        Log.d("#####SETALART", "2");
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        Intent i = new Intent(context, SetAlarmWhileIdle.class);
        PendingIntent pi = PendingIntent.getBroadcast(context, 91, i, 0);
        am.cancel(pi);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
//            am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, System.currentTimeMillis() + 1000 * 60, pi);
            am.setAlarmClock(new AlarmManager.AlarmClockInfo(System.currentTimeMillis() + 1000 * 60,pi),pi);
            Log.d("##ALARM","3");
        }
    }
}
