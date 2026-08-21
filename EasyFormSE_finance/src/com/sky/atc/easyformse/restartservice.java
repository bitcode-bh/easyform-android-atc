package com.sky.atc.easyformse;

import android.app.ActivityManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;

import android.util.Log;

import net.sqlcipher.database.SQLiteDatabase;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;
//Custom Brodcast to restart the location service if there is trip running
@StringFogIgnore
public class restartservice extends BroadcastReceiver {

    SQLiteDatabase database;

    public restartservice() {
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        // TODO: This method is called when the BroadcastReceiver is receiving
        // an Intent broadcast.

        Log.d("####restartservice","brodcastcalled");

        database=sqlitewraper.getDatabase();

        try {
            boolean check = isMyServiceRunning(sqlitewraper.context,
                    newfused.class.getName());
            if(check) {
            } else {

                Log.d("####restartservice","brodcastcalled1");
                Cursor tripflag = database.rawQuery(
                        "select * from lat_plug where trip_status = 0", null);
                tripflag.moveToFirst();
                int tripflagCount = tripflag.getCount();
                tripflag.close();

                Log.d("####restartservice", String.valueOf(tripflagCount));
                if (tripflagCount==0) {

                    Log.d("####restartservice","brodcastcalled2");
                    Intent i = new Intent(sqlitewraper.context,
                            newfused.class);
                    sqlitewraper.context.startService(i);
                }

            }
        } catch(Exception e) {
            Log.d("####restartserviceEx",e.toString());
        }
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
