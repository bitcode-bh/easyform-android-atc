package com.sky.atc.easyformse;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Date;
import java.util.LinkedHashMap;

import org.json.JSONArray;
import org.json.JSONObject;

import com.commonsware.cwac.wakeful.WakefulIntentService;

import android.content.BroadcastReceiver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.database.Cursor;
import net.sqlcipher.database.SQLiteDatabase;
import android.net.ConnectivityManager;
import android.os.Environment;
import android.preference.PreferenceManager;
import android.util.Log;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;


//shutDown receiver
@StringFogIgnore
public class ShutdownReceiver extends BroadcastReceiver {
	Context context;
	SQLiteDatabase database;
	long gprs_off, gps_off, phone_off;
	int rawlevel;

	ArrayList<JSONObject> list = new ArrayList<>();

	@Override
	public void onReceive(Context context, Intent intent) {


		Log.d("##SHUTDOWN","1");

		Intent batteryIntent = sqlitewraper.context.registerReceiver(null,
				new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
		rawlevel = batteryIntent.getIntExtra("level", -1);

		database = sqlitewraper.getDatabase();
		Date now = new Date();
		Long time = now.getTime();

		gps_off = time;
		gprs_off = time;
		phone_off = time;

		Log.d("###PHONE_OFF", String.valueOf(phone_off));

		ContentValues args = new ContentValues();
		args.put("phone_off", String.valueOf(phone_off));

		args.put("battery", rawlevel);
		long temp = database.update("gpsrec", args, null, null);
		temp++;
		insert();
	}


	//phone on/off entry in table
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

			args.put("g_offtime", String.valueOf(gps_off));

			args.put("gp_offtime", String.valueOf(gprs_off));

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
							phone_on1, phone_off2, gp_duration, gprs_duration,
							phone_duration, date);

					boolean isInserted = DeviceEventsUtils.insertIntoEvents(phone_off2,phone_on1, String.valueOf(phone_duration),"Phone_outage");

				}

				else {
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

			}

			else {

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

}
