package com.sky.atc.easyformse;

import java.util.ArrayList;

import org.json.JSONObject;

import com.commonsware.cwac.wakeful.WakefulIntentService;

import android.app.ActivityManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

import net.sqlcipher.database.SQLiteDatabase;

import android.os.Build;
import android.util.Log;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

import static androidx.legacy.content.WakefulBroadcastReceiver.completeWakefulIntent;
import static androidx.legacy.content.WakefulBroadcastReceiver.startWakefulService;

//to receive gps status and insert into device event gp_total
@StringFogIgnore
public class gpsreciever extends BroadcastReceiver {
    protected static final int GPS_EVENT_STARTED = 0;
    protected static final int GPS_EVENT_STOPPED = 0;
    Context context;
    SQLiteDatabase database;
    long gprs_on, gprs_off, gps_on, gps_off, phone_on, phone_off;
    int rawlevel;
    Intent broadcastIntent = new Intent();

    ArrayList<JSONObject> list = new ArrayList<JSONObject>();

    @Override
    public void onReceive(Context context, Intent intent) {

        Log.d("####gpsreceiver", "1");

        if (intent.getAction().matches("android.location.PROVIDERS_CHANGED")) {
            boolean check = DeviceEventsUtils.isMyServiceRunning(sqlitewraper.context,
                    GpsReceiverService.class.getName());

            if (check) {

            } else {
                Intent z_n12 = new Intent(context, GpsReceiverService.class);
//            WakefulIntentService.sendWakefulWork(context, z_n12);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startService(z_n12);
                } else {
                    WakefulIntentService.sendWakefulWork(context, z_n12);

                }
            }

        }
    }

}
