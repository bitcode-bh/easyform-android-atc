package com.sky.atc.easyformse.trip;

import android.util.Log;

import com.sky.atc.easyformse.DeviceEventsUtils;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.sqlitewraper;

import net.sqlcipher.database.SQLiteDatabase;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

//To genrate screen on/off event on power button click
@StringFogIgnore
public class ScreenOnoffUtils {
    private static long offtime = 0;
    private static MySharedPreferences pref = sqlitewraper.getSecureShared("SCREENONOFF");

    static void insertIntoScreenoff(String action) {

        if (DeviceEventsUtils.liveTripCount() > 0) {

            if (action.equalsIgnoreCase("android.intent.action.SCREEN_OFF")) {
                offtime = System.currentTimeMillis();
            }
            if (action.equalsIgnoreCase("android.intent.action.SCREEN_ON")) {

                long ontime = System.currentTimeMillis();
                long duration = ontime - offtime;

                if (offtime != 0) {
                    boolean isInserted = DeviceEventsUtils.insertIntoEvents(String.valueOf(offtime), String.valueOf(ontime), String.valueOf(duration), "screen");
                    Log.d("##SCREENONOFF", String.valueOf(isInserted));
                    offtime = 0;
                }
            }
        }
    }


    private static boolean isValidEntry(long currentofftime) {

        String currentOffTime = String.valueOf(currentofftime);
        String phoneoffMilli = pref.getString("OFFTIME", "0");

        if (!currentOffTime.equalsIgnoreCase(phoneoffMilli)) {
            return true;
        } else {
            return false;
        }
    }
}
