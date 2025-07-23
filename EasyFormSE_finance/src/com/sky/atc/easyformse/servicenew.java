package com.sky.atc.easyformse;

/***
 Copyright (c) 2010 CommonsWare, LLC

 Licensed under the Apache License, Version 2.0 (the "License"); you may
 not use this file except in compliance with the License. You may obtain
 a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;

import android.app.ActivityManager;
import android.app.ActivityManager.RunningServiceInfo;
import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.database.Cursor;
import net.sqlcipher.database.SQLiteDatabase;
import android.location.LocationManager;
import android.os.Build;
import android.os.SystemClock;
import androidx.core.app.ActivityCompat;
import android.util.Log;

import com.commonsware.cwac.wakeful.WakefulIntentService;

import commonsware.cwac.LocationPoller;
import io.michaelrocks.paranoid.Obfuscate;

/**
 * BroadcastReceiver to be launched by AlarmManager. Simply passes the work over
 * to LocationPollerService, who arranges to make sure the WakeLock stuff is
 * done properly.
 */
@Obfuscate
public class servicenew extends BroadcastReceiver {


	public static final String EXTRA_ERROR = "com.commonsware.cwac.locpoll.EXTRA_ERROR";
	public static final String EXTRA_INTENT = "com.commonsware.cwac.locpoll.EXTRA_INTENT";
	public static final String EXTRA_LOCATION = "com.commonsware.cwac.locpoll.EXTRA_LOCATION";
	public static final String EXTRA_PROVIDER = "com.commonsware.cwac.locpoll.EXTRA_PROVIDER";
	public static final String EXTRA_LASTKNOWN = "com.commonsware.cwac.locpoll.EXTRA_LASTKNOWN";
	SQLiteDatabase database;
	/**
	 * If this is returned true (defaults to false unless provider is explicitly
	 * NOT enabled), then the provider could not be enabled.
	 */
	public static final String EXTRA_ERROR_PROVIDER_DISABLED = "com.commonsware.cwac.locpoll.EXTRA_ERROR_PROV_DISABLED";
	/**
	 * Optional Timeout. Pass milliseconds as a long. Defaults to 2 minutes.
	 */
	public static final String EXTRA_TIMEOUT = "com.commonsware.cwac.locpoll.EXTRA_TIMEOUT";

	/**
	 * Standard entry point for a BroadcastReceiver. Delegates the event to
	 * LocationPollerService for processing.
	 */
	@Override
	public void onReceive(Context context, Intent intent) {
		database = sqlitewraper.getDatabase();
		System.out.print("cc");
		try {
			 SharedPreferences sharedPreferences= sqlitewraper.context.getSharedPreferences("LogWrite",0);
			 boolean mStringLogbackup = sharedPreferences.getBoolean("isLogWrite",false);
			if (!mStringLogbackup) {
				throw new IOException("isLogWrite is false");
			}
			File myFile = new File("mnt/sdcard/mysdfile.txt");
			myFile.createNewFile();
			FileOutputStream fOut = new FileOutputStream(myFile);
			OutputStreamWriter myOutWriter = new OutputStreamWriter(fOut);
			myOutWriter.append("AFTER INSIDE IN BROADCAST");
			myOutWriter.close();
			fOut.close();
		} catch (Exception e) {

		}
		data d = new data();
		String Key = intent.getStringExtra("Key");

		if (Key.equalsIgnoreCase("wake")) {

//			boolean check = isMyServiceRunning(sqlitewraper.context,
//					wake_geo_server.class.getName());
//			if (check) {
//			} else {
////				Intent z = new Intent(sqlitewraper.context,
////						wake_geo_server.class);
////				WakefulIntentService.sendWakefulWork(sqlitewraper.context, z);
//			}
		}

		if (Key.equalsIgnoreCase("download_easy")) {

//			boolean check = isMyServiceRunning(sqlitewraper.context,
//					f_download_new_stuctrutre.class.getName());
//			if (check) {
//			} else {
//
//				Intent z_n12 = new Intent(sqlitewraper.context,
//						f_download_new_stuctrutre.class);
//				WakefulIntentService.sendWakefulWork(sqlitewraper.context,
//						z_n12);
//			}
		}

		if (Key.equalsIgnoreCase("upload_easy")) {

			call();

			boolean check = isMyServiceRunning(sqlitewraper.context,
					f_upload_new_structure.class.getName());
			if (!check) {

				Intent z_n12 = new Intent(sqlitewraper.context,
						f_upload_new_structure.class);

				if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
					sqlitewraper.context.startForegroundService(z_n12);
				}else {
					WakefulIntentService.sendWakefulWork(sqlitewraper.context, z_n12);
				}
			}

			String is_trip_flag = d.getFeatureFlag("istrip");
			String isact_track = d.getFeatureFlag("isact_track");

//			boolean check1 = isMyServiceRunning(sqlitewraper.context,
//					upload_path.class.getName());
//			if (check1) {
//			} else {
//
//				Intent z_n12 = new Intent(sqlitewraper.context,
//						upload_path.class);
//				WakefulIntentService.sendWakefulWork(sqlitewraper.context,
//						z_n12);
//			}

//			boolean check2 = isMyServiceRunning(sqlitewraper.context,
//					shortest_path.class.getName());
//			if (check2) {
//			} else {
//
////				Intent z_n12 = new Intent(sqlitewraper.context,
////						shortest_path.class);
////				WakefulIntentService.sendWakefulWork(sqlitewraper.context,
////						z_n12);
//			}

			if (isact_track.equalsIgnoreCase("1")) {
				boolean check3 = isMyServiceRunning(sqlitewraper.context,
						Event.class.getName());
				if (!check3) {
					try {
						Intent z_n12 = new Intent(sqlitewraper.context, Event.class);
						WakefulIntentService.sendWakefulWork(sqlitewraper.context,
								z_n12);
					}catch(Exception e){
						e.printStackTrace();
					}
				}
				//hide newfused and activity_recognition code  23-07-2025
//				boolean check4 = isMyServiceRunning(sqlitewraper.context,
//						Activity_recognition.class.getName());
//				if (!check4) {
//
//					Intent i = new Intent(sqlitewraper.context,
//							Activity_recognition.class);
//					if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
//						sqlitewraper.context.startForegroundService(i);
//					}else {
//						sqlitewraper.context.startService(i);
//					}
//
//				}
			}

		}

		if (Key.equalsIgnoreCase("locat_ser")) {

			String loc_flag = d.getFeatureFlag("isloc_track");

			if (loc_flag.equalsIgnoreCase("1")) {

				boolean check = isMyServiceRunning(sqlitewraper.context,
						location_server.class.getName());
				if (!check) {

					try {
						Intent z_n2 = new Intent(sqlitewraper.context,
								location_server.class);
						WakefulIntentService.sendWakefulWork(sqlitewraper.context,
								z_n2);

					}catch (Exception e){
						e.printStackTrace();
					}
				}
			}
		}
//		if (Key.equalsIgnoreCase("georeg")) {
//			boolean check = isMyServiceRunning(sqlitewraper.context,
//					geo_send_server.class.getName());
//			if (check) {
//			} else {
//
////				Intent z_n = new Intent(sqlitewraper.context,
////						geo_send_server.class);
////				WakefulIntentService.sendWakefulWork(sqlitewraper.context, z_n);
//
//			}
//		}

		if (Key.equalsIgnoreCase("touch")) {

			boolean check = isMyServiceRunning(sqlitewraper.context,
					touch_server.class.getName());
			if (!check) {

				try {
					Intent z_n = new Intent(sqlitewraper.context,
							touch_server.class);
					if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
						sqlitewraper.context.startForegroundService(z_n);
					}else {
						sqlitewraper.context.startService(z_n);
					}
				}catch (Exception e){
					e.printStackTrace();
				}
			}

			// //////-----delete photo after upload--------///////
			// boolean check1 = isMyServiceRunning(sqlitewraper.context,
			// delete_photo.class.getName());
			// if (check1) {
			// } else {
			//
			// Intent z_n12 = new Intent(sqlitewraper.context,
			// delete_photo.class);
			// WakefulIntentService.sendWakefulWork(sqlitewraper.context,
			// z_n12);
			// }
			// ////////////
		}

//		if (Key.equalsIgnoreCase("geo_send")) {
//
//			boolean check = isMyServiceRunning(sqlitewraper.context,
//					geo_send_server.class.getName());
//			if (check) {
//			} else {
//
////				Intent z_n = new Intent(sqlitewraper.context,
////						geo_send_server.class);
////				WakefulIntentService.sendWakefulWork(sqlitewraper.context, z_n);
//
//			}
//		}
		if (Key.equalsIgnoreCase("loget")) {

			AlarmManager alarmManager = (AlarmManager) sqlitewraper.context
					.getSystemService(Context.ALARM_SERVICE);

			Intent i = new Intent(sqlitewraper.context, LocationPoller.class);
			i.putExtra("intent", "loc");
			i.putExtra(LocationPoller.EXTRA_INTENT, new Intent(
					sqlitewraper.context, LocationReceiver_network.class));
			i.putExtra(LocationPoller.EXTRA_PROVIDER,
					LocationManager.NETWORK_PROVIDER);
			PendingIntent pi = PendingIntent.getBroadcast(sqlitewraper.context,
					106, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

			alarmManager.setRepeating(AlarmManager.ELAPSED_REALTIME_WAKEUP,
					SystemClock.elapsedRealtime() + 0, 240000, pi);
		}

		if (Key.equalsIgnoreCase("trip")) {

			tripService();
		}
	}

	// Google Play services was not available for some reason

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

	void call() {
		// Intent i12 = new Intent(sqlitewraper.context, upload_path.class);
		// sqlitewraper.context.startService(i12);
		data d = new data();
		database = sqlitewraper.getDatabase();
		Cursor a_t = database.rawQuery(
				"select value from APP_states where ITEAM ='nick'", null);
		a_t.moveToFirst();
		int j = a_t.getCount();
		j++;
		String username = null;
		if (a_t.getCount() > 0) {

			username = a_t.getString(0);
		}
		a_t.close();

		if (username.equalsIgnoreCase("0")) {
		} else {

			Cursor a_t12 = database.rawQuery(
					"select value from APP_states where ITEAM ='gps'", null);
			a_t12.moveToFirst();
			int j1 = a_t12.getCount();
			j++;
			String gps = null;
			if (a_t12.getCount() > 0) {

				gps = a_t12.getString(0);

				if (gps.equalsIgnoreCase("0")) {
				} else if (gps.equalsIgnoreCase("1")) {

					boolean check = isMyServiceRunning(sqlitewraper.context,
							newfused.class.getName());
					if (check) {
					} else {

						Intent i = new Intent(sqlitewraper.context,
								newfused.class);
						if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
							sqlitewraper.context.startForegroundService(i);
						}else {
							sqlitewraper.context.startService(i);
						}
						// GPSTracker gps = new
						// GPSTracker(sqlitewraper.context);

					}
					a_t12.close();


//					boolean check12 = isMyServiceRunning(sqlitewraper.context,
//							GPSTracker_test.class.getName());
//					if (check12) {
//					} else {
//
//						Intent i = new Intent(sqlitewraper.context,
//								GPSTracker_test.class);
//						sqlitewraper.context.startService(i);
//						// GPSTracker gps = new
//						// GPSTracker(sqlitewraper.context);
//
//					}






				}

				// Cursor a_t2 = database.rawQuery(
				// "select value from APP_states where ITEAM ='speed'", null);
				// a_t2.moveToFirst();
				// String speed;
				// if (a_t1.getCount() > 0) {
				//
				// speed = a_t2.getString(0);
				//
				// }
			}
			a_t12.close();
			Cursor a_t1 = database.rawQuery(
					"select value from APP_states where ITEAM ='nick'", null);
			a_t1.moveToFirst();
			String username1 = null;
			if (a_t1.getCount() > 0) {

				username1 = a_t1.getString(0);
				d.setusername(username1);
			}
			a_t1.close();
		}
	}

	private void tripService(){


		Log.d("###onStartJob", "that");
//		boolean check = isMyServiceRunning(sqlitewraper.context,
//				newfused_gps.class.getName());
//		if (!check) {
//
//			if (ActivityCompat.checkSelfPermission(sqlitewraper.context, android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(sqlitewraper.context, android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
//
////				Toast.makeText(sqlitewraper.context,"Give Required Location Permission!!",Toast.LENGTH_SHORT).show();
//
//			}else {
//
//				if (tripStatus()>0) {
//
//					Intent i = new Intent(sqlitewraper.context, newfused_gps.class);
//					if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
//						sqlitewraper.context.startForegroundService(i);
//					}else {
//						sqlitewraper.context.startService(i);
//					}
//				}
//			}
//		}


		boolean checkfused = isMyServiceRunning(sqlitewraper.context,
				newfused.class.getName());
		if (!checkfused) {

			if (ActivityCompat.checkSelfPermission(sqlitewraper.context, android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(sqlitewraper.context, android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {

//				Toast.makeText(sqlitewraper.context,"Give Required Location Permission!!",Toast.LENGTH_SHORT).show();

			}else {

				if (tripStatus()>0) {
					Intent i = new Intent(sqlitewraper.context, newfused.class);
					if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
						sqlitewraper.context.startForegroundService(i);
					}else {
						sqlitewraper.context.startService(i);
					}
				}
			}
		}

	}

	private int tripStatus(){

		Cursor tripflag = database.rawQuery(
				"select * from lat_plug where trip_status = 0", null);
		tripflag.moveToFirst();
		int tripflagCount = tripflag.getCount();
		tripflag.close();
		return tripflagCount;
	}
}
