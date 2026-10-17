package com.sky.atc.easyformse;

import com.sky.atc.easyformse.location.TamperWatch;

import android.annotation.SuppressLint;
import android.app.ActivityManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.database.Cursor;
import android.location.LocationManager;
import android.net.ConnectivityManager;
import android.os.Build;
import android.preference.PreferenceManager;
import androidx.core.app.NotificationCompat;
import android.util.Log;

import com.commonsware.cwac.wakeful.WakefulIntentService;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.geofencenew.GeoFenceDraw;

import net.sqlcipher.database.SQLiteDatabase;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Date;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

//to handle gps status
@StringFogIgnore
public class GpsReceiverService extends WakefulIntentService {


    protected static final int GPS_EVENT_STARTED = 0;
    protected static final int GPS_EVENT_STOPPED = 0;
    Context context;
    SQLiteDatabase database;
    long gprs_on, gprs_off, gps_on, gps_off, phone_on, phone_off;
    int rawlevel;
    Intent broadcastIntent = new Intent();

    ArrayList<JSONObject> list = new ArrayList<JSONObject>();


    public GpsReceiverService() {
        super("getlatlong");
    }

    @Override
    protected void doWakefulWork(Intent arg0) {


        Date now = new Date();
        Long time = now.getTime();
        final ConnectivityManager connMgr = (ConnectivityManager) sqlitewraper.context
                .getSystemService(Context.CONNECTIVITY_SERVICE);
        final android.net.NetworkInfo mobile = connMgr
                .getNetworkInfo(ConnectivityManager.TYPE_MOBILE);

        Intent batteryIntent = sqlitewraper.context.registerReceiver(null,
                new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
        rawlevel = batteryIntent.getIntExtra("level", -1);


        database = sqlitewraper.getDatabase();
        // Records Gps_outage once, shared with the location service, which may not be running.
        TamperWatch.get(sqlitewraper.context).checkGps();
        Cursor c;

        LocationManager lm = (LocationManager) sqlitewraper.context
                .getSystemService(sqlitewraper.context.LOCATION_SERVICE);
        boolean isGPSEnabled = lm
                .isProviderEnabled(LocationManager.GPS_PROVIDER);
        String f_gps;
        if (isGPSEnabled == true) {
            f_gps = "1";

            GeoFenceDraw geoFenceDraw= new GeoFenceDraw();
            geoFenceDraw.getSiteinfoNew();
//
//            Intent i = new Intent(sqlitewraper.context, geounreg.class);
//            WakefulIntentService.sendWakefulWork(sqlitewraper.context, i);


        } else {

            f_gps = "0";

            MySharedPreferences editor =sqlitewraper.getSecureShared("MY_PREFS_NAME");
            editor.putInt("bootflag",0);
            editor.commit();

        }

        // update_appsate(String.valueOf(isGPSEnabled), "gps");

        Cursor refresh1 = database.rawQuery(
                "select VALUE from APP_states where ITEAM='gps'", null);
        refresh1.moveToFirst();
        String gps = refresh1.getString(0);
        if (!gps.equalsIgnoreCase(f_gps)) {
            if (isGPSEnabled == true) {


                if (mobile.isConnectedOrConnecting()) {

                    gps_on = time;
                    // gprs_on = time;
                    // phone_on = time;
                    System.out.print("gprs");

                    ContentValues args = new ContentValues();

                    args.put("g_ontime", String.valueOf(gps_on));
                    args.put("date", String.valueOf(gps_on));

                    // args.put("gp_ontime", String.valueOf(gprs_on));

                    // args.put("phone_on", String.valueOf(phone_on));

                    args.put("battery", rawlevel);
                    long temp = database.update("gpsrec", args, null, null);

                    insert();
//                        update_appsate("1", "gps");

                } else {

                    gps_on = time;
                    // gprs_off = time;
                    // phone_on = time;

                    ContentValues args = new ContentValues();

                    args.put("g_ontime", String.valueOf(gps_on));
                    args.put("date", String.valueOf(gps_on));

                    // args.put("gp_offtime", String.valueOf(gprs_off));
                    // args.put("phone_on", String.valueOf(phone_on));

                    args.put("battery", rawlevel);
                    long temp = database.update("gpsrec", args, null, null);

                    insert();
//                        update_appsate("1", "gps");
                    System.out.print("gprsoff");

                }
                call();
            } else {
                if (mobile.isConnectedOrConnecting()) {

                    gps_off = time;
                    // gprs_on = time;
                    // phone_on = time;

                    ContentValues args = new ContentValues();

                    args.put("g_offtime", String.valueOf(gps_off));
                    // args.put("gp_ontime", String.valueOf(gprs_on));
                    args.put("date", String.valueOf(gps_off));
                    // args.put("phone_on", String.valueOf(phone_on));

                    args.put("battery", rawlevel);
                    long temp = database.update("gpsrec", args, null, null);

                    insert();
//                        update_appsate("0", "gps");
                    System.out.print("gprs");

                } else {

                    gps_off = time;
                    // gprs_off = time;
                    // phone_on = time;

                    ContentValues args = new ContentValues();

                    args.put("g_offtime", String.valueOf(gps_off));
                    args.put("date", String.valueOf(gps_off));
                    // args.put("gp_offtime", String.valueOf(gprs_off));
                    // args.put("phone_on", String.valueOf(phone_on));

                    args.put("battery", rawlevel);
                    long temp = database.update("gpsrec", args, null, null);

                    insert();
//                        update_appsate("0", "gps");
                    System.out.print("gprsoff");

                }

            }

        }


    }

    void insert() {
        try {
            Cursor c = database
                    .rawQuery(
                            "Select g_ontime,g_offtime,gp_ontime,gp_offtime,phone_on,phone_off,battery,date from gpsrec",
                            null);
            c.moveToFirst();
            if (c.getCount() > 0) {
                String g_ontime = c.getString(0);
                String g_offtime = c.getString(1);
                String gp_ontime = c.getString(2);
                String gp_offtime = c.getString(3);
                String phone_on1 = c.getString(4);
                String phone_off2 = c.getString(5);
                String date = c.getString(7);

                long gp_duration = 0;
                long gprs_duration = 0;
                ;
                long phone_duration = 0;
                long battery = c.getInt(6);


                if (!g_ontime.equals("0") && !g_offtime.equals("0")) {
                    long g_ontime1 = Long.valueOf(g_ontime);
                    long g_offtime1 = Long.valueOf(g_offtime);

                    if (g_ontime1 > g_offtime1) {
                        gp_duration = g_ontime1 - g_offtime1;

                        if(gp_duration > 1000)
                        {
                        insert_t(g_ontime, g_offtime, gp_ontime, gp_offtime,
                                phone_on1, phone_off2, gp_duration, gprs_duration, phone_duration, date);

                            // Gps_outage is recorded by TamperWatch (see doWakefulWork).
                            ContentValues args = new ContentValues();
                            args.put("g_offtime", String.valueOf(0));
                            database.update("gpsrec", args, null, null);
                        }

                    } else {
                        gp_duration = 0;

                    }
                }
            }
        } catch (Exception e) {
            System.out.println(e.getMessage());
            // TODO: handle exception
        }
    }

    @SuppressLint("WrongConstant")
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (Build.VERSION.SDK_INT >= 26) {
            String CHANNEL_ID = "my_channel_01";
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID,
                    "Channel human readable title",
                    NotificationManager.IMPORTANCE_DEFAULT);

            ((NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE)).createNotificationChannel(channel);

            Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                    .setContentTitle("")
                    .setContentText("").build();

            startForeground(1, notification);
        }
        return super.onStartCommand(intent, flags, startId);
    }

    public void insert_t(String g_ontime, String g_offtime, String gp_ontime,
                         String gp_offtime, String phone_on1, String phone_off2,
                         long gp_duration, long gprs_duration, long phone_duration,
                         String date) {
        try {

            Cursor a_t = database.rawQuery(
                    "select Value from APP_states where ITEAM ='nick'",
                    null);
            a_t.moveToFirst();
            int j1 = a_t.getCount();
            j1++;
            String username = null;
            if (a_t.getCount() > 0) {

                username = a_t.getString(0);
            }
            if (username.equalsIgnoreCase("0")) {

            } else {


                SharedPreferences dialog1 = PreferenceManager
                        .getDefaultSharedPreferences(sqlitewraper.context);
                // SharedPreferences.Editor preferencesEditor = dialog1.edit();
                String imei = dialog1.getString("imei", "0");

                list = new ArrayList<JSONObject>();
                ContentValues values;
                values = new ContentValues();
                values.put("g_ontime", g_ontime);
                values.put("g_offtime", g_offtime);
                values.put("gp_ontime", gp_ontime);
                values.put("gp_offtime", gp_offtime);
                values.put("phone_on", phone_on1);
                values.put("phone_off", phone_off2);
                values.put("battery", rawlevel);
                values.put("send", "0");
                values.put("date", date);
                values.put("gp_duration", gp_duration);
                values.put("gprs_duration", gprs_duration);
                values.put("phone_duration", phone_duration);
                values.put("username", username);

                long temp = database.insert("gp_total", null, values);

            }
            Intent i = new Intent(sqlitewraper.context, status_server.class);
            WakefulIntentService.sendWakefulWork(sqlitewraper.context, i);
        } catch (Exception e) {
            // TODO: handle exception
        }

    }

    void update_appsate(String value, String ITEAM) {
        String t;
        ContentValues args = new ContentValues();
        t = " ITEAM='" + ITEAM + "'";
        args.put("VALUE", value);
        long temp = database.update("APP_states", args, t, null);

    }


    void call() {
        database = sqlitewraper.getDatabase();

        Cursor a_t = database.rawQuery(
                "select value from APP_states where ITEAM ='nick'", null);
        a_t.moveToFirst();
        String j = a_t.getString(0);
        if (j.equalsIgnoreCase("0")) {

        } else {

            Cursor a_t12 = database.rawQuery(
                    "select value from APP_states where ITEAM ='gps'", null);
            a_t12.moveToFirst();
            int j1 = a_t12.getCount();
            String gps = null;
            if (a_t12.getCount() > 0) {

                gps = a_t12.getString(0);

                if (gps.equalsIgnoreCase("0")) {


                } else if (gps.equalsIgnoreCase("1") || gps.equalsIgnoreCase("2")) {

                    if(DeviceEventsUtils.liveTripCount()>0){
                        //hide newfused and activity_recognition code  23-07-2025
//                        boolean check = DeviceEventsUtils.isMyServiceRunning(sqlitewraper.context,
//                                newfused_gps.class.getName());
//                        if (!check) {
//
//                            Intent i = new Intent(sqlitewraper.context,
//                                    newfused_gps.class);
//                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
//                                sqlitewraper.context.startForegroundService(i);
//                            }else {
//                                sqlitewraper.context.startService(i);
//                            }
//
//                        }

                        boolean check1 = DeviceEventsUtils.isMyServiceRunning(sqlitewraper.context,
                                newfused.class.getName());
                        if (!check1) {

                            Intent i = new Intent(sqlitewraper.context,
                                    newfused.class);
                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                                sqlitewraper.context.startForegroundService(i);
                            }else {
                                sqlitewraper.context.startService(i);
                            }
                        }
                    }


                }

            }
        }


        Cursor a_t1 = database.rawQuery(
                "select value from APP_states where ITEAM ='nick'", null);
        a_t1.moveToFirst();
        String username;
        if (a_t1.getCount() > 0) {

            username = a_t1.getString(0);


        }


        Cursor a_t3 = database.rawQuery(
                "select istrip,isact_track,isloc_track from Features", null);
        a_t3.moveToFirst();

        if (a_t3.getCount() > 0) {

            String istrip, isspeed, isact_track, isloc_track;
            istrip = a_t3.getString(0);

            isact_track = a_t3.getString(1);


            if (isact_track.equalsIgnoreCase("1")) {
                //hide newfused and activity_recognition code  23-07-2025
                // enbale activity_recognition code  07082026
                boolean check4 = DeviceEventsUtils.isMyServiceRunning(sqlitewraper.context,
                        Activity_recognition.class.getName());
                if (check4) {
                } else {

                    Intent i = new Intent(sqlitewraper.context,
                            Activity_recognition.class);
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        sqlitewraper.context.startForegroundService(i);
                    }else {
                        sqlitewraper.context.startService(i);
                    }


                }
            }


        }


    }
}
