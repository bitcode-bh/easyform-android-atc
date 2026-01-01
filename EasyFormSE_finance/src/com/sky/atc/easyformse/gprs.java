package com.sky.atc.easyformse;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.util.ArrayList;
import java.util.Date;
import java.util.LinkedHashMap;

import org.json.JSONArray;
import org.json.JSONObject;

import com.commonsware.cwac.wakeful.WakefulIntentService;

import android.app.ActivityManager;
import android.app.ActivityManager.RunningServiceInfo;
import android.content.BroadcastReceiver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.database.Cursor;
import net.sqlcipher.database.SQLiteDatabase;
import android.location.LocationManager;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.Build;
import android.os.Environment;
import android.preference.PreferenceManager;
import android.widget.Toast;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

//Receiver to receive Internet status and insert outage in gp_total
@StringFogIgnore
public class gprs extends BroadcastReceiver {

	protected static final int GPS_EVENT_STARTED = 0;
	protected static final int GPS_EVENT_STOPPED = 0;
	Context context;
	SQLiteDatabase database;
	long gprs_on, gprs_off, gps_on, gps_off, phone_on, phone_off;
	int rawlevel;

	ArrayList<JSONObject> list = new ArrayList<JSONObject>();
	private String firstConnect;

	@Override
	public void onReceive(Context context, Intent intent) {
		Date now = new Date();
		Long time = now.getTime();
		database = sqlitewraper.getDatabase();
		Cursor a_t = database.rawQuery(
				"select value from APP_states where ITEAM ='firstConnect'",
				null);
		a_t.moveToFirst();
		firstConnect = a_t.getString(0);
		a_t.close();

		Intent batteryIntent = sqlitewraper.context.registerReceiver(null,
				new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
		rawlevel = batteryIntent.getIntExtra("level", -1);
		final ConnectivityManager connMgr = (ConnectivityManager) sqlitewraper.context
				.getSystemService(Context.CONNECTIVITY_SERVICE);
		final NetworkInfo mobile = connMgr
				.getNetworkInfo(ConnectivityManager.TYPE_MOBILE);
		LocationManager lm = (LocationManager) sqlitewraper.context
				.getSystemService(sqlitewraper.context.LOCATION_SERVICE);
		boolean isGPSEnabled = lm
				.isProviderEnabled(LocationManager.GPS_PROVIDER);

		NetworkInfo netInfo = connMgr.getActiveNetworkInfo();

		ConnectivityManager conMgr = (ConnectivityManager) sqlitewraper.context
				.getSystemService(Context.CONNECTIVITY_SERVICE);

		boolean icheck = isNetworkAvailable();

		if (netInfo != null && netInfo.isConnected()) {

		}

		if (conMgr.getNetworkInfo(0).getState() == NetworkInfo.State.CONNECTED
				|| conMgr.getNetworkInfo(1).getState() == NetworkInfo.State.CONNECTING
				|| sqlitewraper.internetflag == 1 || icheck == true) {

			boolean check1 = isMyServiceRunning(sqlitewraper.context,
					f_upload_new_structure.class.getName());
			if (check1) {
			} else {

				Intent z_n12 = new Intent(sqlitewraper.context,
						f_upload_new_structure.class);

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    sqlitewraper.context.startForegroundService(z_n12);
                }else {
                    WakefulIntentService.sendWakefulWork(sqlitewraper.context, z_n12);
                }
			}
			if (firstConnect.equalsIgnoreCase("0")) {

				if (isGPSEnabled == true) {

					// gps_on = time;
					gprs_on = time;
					// phone_on = time;

					ContentValues args = new ContentValues();

					// args.put("g_ontime", String.valueOf(gps_on));

					args.put("gp_ontime", String.valueOf(gprs_on));
					args.put("date", String.valueOf(time));
					// args.put("phone_on", String.valueOf(phone_on));

					args.put("battery", rawlevel);
					long temp = database.update("gpsrec", args, null, null);
					insert();
					update_appsate("1", "firstConnect");
				} else {

					// gps_off = time;
					gprs_on = time;
					// phone_on = time;

					ContentValues args = new ContentValues();
					args.put("gp_ontime", String.valueOf(gprs_on));
					args.put("date", String.valueOf(time));
					args.put("battery", rawlevel);
					long temp = database.update("gpsrec", args, null, null);
					insert();
					update_appsate("1", "firstConnect");
				}
			}
		} else {

			Toast.makeText(sqlitewraper.context, "We have lost internet connection.",
					Toast.LENGTH_SHORT).show();

			if (isGPSEnabled == true) {

				// gps_on = time;
				gprs_off = time;
				// phone_on = time;

				ContentValues args = new ContentValues();

				// args.put("g_ontime", String.valueOf(gps_on));

				args.put("gp_offtime", String.valueOf(gprs_off));
				args.put("date", String.valueOf(time));
				// args.put("phone_on", String.valueOf(phone_on));

				args.put("battery", rawlevel);
				long temp = database.update("gpsrec", args, null, null);
				insert();
				// firstConnect = true;

				update_appsate("0", "firstConnect");
			} else {

				gps_off = time;
				gprs_off = time;
				phone_on = time;

				ContentValues args = new ContentValues();

				// args.put("g_offtime", String.valueOf(gps_off));
				args.put("date", String.valueOf(time));
				args.put("gp_offtime", String.valueOf(gprs_off));
				// args.put("phone_on", String.valueOf(phone_on));

				args.put("battery", rawlevel);
				long temp = database.update("gpsrec", args, null, null);
				insert();
				update_appsate("0", "firstConnect");
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

				if (!gp_ontime.equals("0") && !gp_offtime.equals("0")) {
					long g_ontime1 = Long.valueOf(gp_ontime);
					long g_offtime1 = Long.valueOf(gp_offtime);

					if (g_ontime1 > g_offtime1) {
						gprs_duration = g_ontime1 - g_offtime1;
						if (gprs_duration > 1000) {
							insert_t(g_ontime, g_offtime, gp_ontime, gp_offtime,
									phone_on1, phone_off2, gp_duration,
									gprs_duration, phone_duration, date);

							boolean isInserted = DeviceEventsUtils.insertIntoEvents(gp_offtime, gp_ontime, String.valueOf(gprs_duration), "Gprs_outage");
						}
					}

					else {
						gprs_duration = 0;

					}
				}
			}
			c.close();

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
				values.put("username", username);

				values.put("gp_duration", gp_duration);
				values.put("gprs_duration", gprs_duration);
				values.put("phone_duration", phone_duration);

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

	void update_appsate(String value, String ITEAM) {
		try {
			String t;
			ContentValues args = new ContentValues();
			t = "ITEAM='" + ITEAM + "'";
			args.put("VALUE", value);
			database.update("APP_states", args, t, null);

		} catch (Exception e) {
			System.out.println(e.getMessage());
			// TODO: handle exception
		}
	}

	private boolean isMyServiceRunning(Context context, String Myservice) {
		ActivityManager manager = (ActivityManager) context
				.getSystemService(Context.ACTIVITY_SERVICE);
		for (RunningServiceInfo service : manager
				.getRunningServices(Integer.MAX_VALUE)) {
			if (Myservice.equals(service.service.getClassName())) {

				return true;
			}
		}
		return false;
	}
}
