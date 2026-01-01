package com.sky.atc.easyformse;

import android.content.BroadcastReceiver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.database.Cursor;
import android.location.LocationManager;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.Build;
import android.preference.PreferenceManager;
import android.util.Log;

import com.commonsware.cwac.wakeful.WakefulIntentService;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.jobshedulers.SetAlarmTrip;
import com.sky.atc.easyformse.jobshedulers.Util;

import net.sqlcipher.database.SQLiteDatabase;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Date;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

//Receiver to Add Phone on/off event
@StringFogIgnore
public class phoneon extends BroadcastReceiver {
    Context context;
    SQLiteDatabase database;
    long gprs_on, gprs_off, gps_on, gps_off, phone_on, phone_off;
    int rawlevel;
    MySharedPreferences pref;


    ArrayList<JSONObject> list = new ArrayList<>();

    @Override
    public void onReceive(Context context, Intent intent) {

        SetAlarmTrip setAlarmTrip= new SetAlarmTrip();
        pref = sqlitewraper.getSecureShared("PHONERESTART");

        Date now = new Date();
        Long time = now.getTime();
        final ConnectivityManager connMgr = (ConnectivityManager) sqlitewraper.context
                .getSystemService(Context.CONNECTIVITY_SERVICE);
        final NetworkInfo mobile = connMgr
                .getNetworkInfo(ConnectivityManager.TYPE_MOBILE);

        Intent batteryIntent = sqlitewraper.context.registerReceiver(null,
                new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
        rawlevel = batteryIntent.getIntExtra("level", -1);

        database = sqlitewraper.getDatabase();
        Cursor c;

        LocationManager lm = (LocationManager) sqlitewraper.context
                .getSystemService(sqlitewraper.context.LOCATION_SERVICE);
        boolean isGPSEnabled = lm
                .isProviderEnabled(LocationManager.GPS_PROVIDER);

        phone_on = time;
        System.out.print("gprs");
        Log.d("###PHONE_ON", String.valueOf(phone_on));

        if (!isValidLog()) {

            Log.d("###PHONE_ON", String.valueOf(phone_on));

            ContentValues args = new ContentValues();
            args.put("phone_on", String.valueOf(phone_on));

            args.put("battery", rawlevel);
            long temp = database.update("gpsrec", args, null, null);

            insert();

        }

        startJobShedulers();

        setAlarmTrip.setAlarm(context);



    }

    void update_appsate() {
        try {

            Cursor c = database
                    .rawQuery(
                            "Select g_ontime,g_offtime,gp_ontime,gp_offtime,phone_on,phone_off,battery from gpsrec",
                            null);
            c.getCount();
            c.moveToFirst();
            if (c.getCount() > 0) {
                String t = c.getString(0);
                System.out.print("a");

            } else {
                System.out.print("a");

            }

            ContentValues args = new ContentValues();

            args.put("g_ontime", String.valueOf(gps_on));
            args.put("g_offtime", String.valueOf(gps_off));
            args.put("gp_ontime", String.valueOf(gprs_on));
            args.put("gp_offtime", String.valueOf(gprs_off));
            args.put("phone_on", String.valueOf(phone_on));
            args.put("phone_off", String.valueOf(phone_off));
            args.put("battery", rawlevel);
            long temp = database.update("gpsrec", args, null, null);
            if (temp > 0) {

            }
        } catch (Exception e) {
            System.out.println(e.getMessage());
            // TODO: handle exception
        }
    }

    void insert() {
        try {
            Cursor c = database
                    .rawQuery(
                            "Select g_ontime,g_offtime,gp_ontime,gp_offtime,phone_on,phone_off,battery,date from gpsrec",
                            null);
            c.moveToFirst();
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

            if (!phone_on1.equals("0") && !phone_off2.equals("0")) {
                long g_ontime1 = Long.valueOf(phone_on1);
                long g_offtime1 = Long.valueOf(phone_off2);


                if (g_ontime1 > g_offtime1) {
                    phone_duration = g_ontime1 - g_offtime1;
                    insert_t(g_ontime, g_offtime, gp_ontime, gp_offtime,
                            phone_on1, phone_off2, gp_duration, gprs_duration,phone_duration, date);

                    boolean isInserted = DeviceEventsUtils.insertIntoEvents(phone_off2,phone_on1, String.valueOf(phone_duration),"Phone_outage");

                    pref.putString("PHONEOFF", phone_off2); // Saving string
                    pref.commit();

                } else {
                    phone_duration = 0;

                }
            }

        } catch (Exception e) {
            System.out.println(e.getMessage());
            // TODO: handle exception
        }
    }

    public void insert_t(String g_ontime, String g_offtime, String gp_ontime,
                         String gp_offtime, String phone_on1, String phone_off2,
                         long gp_duration, long gprs_duration, long phone_duration,
                         String date) {
        try {

            Cursor a_t = database.rawQuery(
                    "select Value from APP_states where ITEAM ='nick'", null);
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

    private boolean isNetworkAvailable() {
        ConnectivityManager connectivityManager = (ConnectivityManager) sqlitewraper.context
                .getSystemService(Context.CONNECTIVITY_SERVICE);
        NetworkInfo activeNetworkInfo = connectivityManager
                .getActiveNetworkInfo();
        return activeNetworkInfo != null;
    }


    private void startJobShedulers() {

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            Util.scheduleJob(sqlitewraper.context);
        }
        Util.scheduleJobFirebase(sqlitewraper.context);

    }

    private boolean isValidLog(){

        Cursor c = database
                .rawQuery(
                        "Select phone_on,phone_off from gpsrec",
                        null);
        c.getCount();
        c.moveToFirst();
        if (c.getCount() > 0) {
            String phoneON = c.getString(0);
            String phoneOFF = c.getString(1);

            Log.d("###PHONE_OFF_MILII", String.valueOf(phoneOFF));
            String phoneoffMilli = pref.getString("PHONEOFF", "0");
            Log.d("###PHONE_OFF_MILII_LAST", String.valueOf(phoneoffMilli));
            if (phoneoffMilli.equalsIgnoreCase(phoneOFF)){

                return true;
            }else {

                return false;
            }

        }
        return false;
    }
}
