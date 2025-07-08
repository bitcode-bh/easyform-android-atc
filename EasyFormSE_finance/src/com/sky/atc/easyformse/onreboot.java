package com.sky.atc.easyformse;

import java.util.Calendar;

import com.commonsware.cwac.wakeful.WakefulIntentService;

import commonsware.cwac.LocationPoller;
import io.michaelrocks.paranoid.Obfuscate;

import android.app.ActivityManager;
import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.ActivityManager.RunningServiceInfo;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import net.sqlcipher.database.SQLiteDatabase;
import android.location.LocationManager;
import android.os.SystemClock;
import android.telephony.TelephonyManager;
import android.widget.Toast;


//User unlock the screen it will called
@Obfuscate
public class onreboot extends BroadcastReceiver {

	private Context mContext;
	private SQLiteDatabase database;
	private MySQLiteHelper dbHelper;

	@Override
	public void onReceive(Context context, Intent intent) {
		mContext = context;
		// call();

		// ala_new();
		try {
			ala_new1("Key", "wake", 101, 12000, 800000, "s");

			ala_new1("Key", "upload_easy", 102, 15000, 70000, "s");


			ala_new1("Key", "locat_ser", 103, 20000, 300000, "s");

			ala_new1("Key", "georeg", 104, 25000, 400000, "s");

			ala_new1("Key", "geo_send", 105, 30000, 480000, "s");

			ala_new1("Key", "touch", 107, 40000, 900000, "s");

			//new Added for Trip
			ala_new1("Key", "trip", 147, 10000, 70000, "s");

			Intent p2 = new Intent(context, foreverservice.class);
			context.startService(p2);

		} catch (Exception e) {

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


	void ala_new1(String key, String value, int id, long start, long repeat,
			String ch) {
		AlarmManager alarmManager = (AlarmManager) mContext
				.getSystemService(Context.ALARM_SERVICE);


		if (ch.equalsIgnoreCase("s")) {

			boolean alarmUp1 = (PendingIntent.getBroadcast(
					sqlitewraper.context, id, new Intent(mContext,
							servicenew.class), PendingIntent.FLAG_NO_CREATE) != null);

			if (alarmUp1) {

			} else {

				Intent i = new Intent(mContext, servicenew.class);
				i.putExtra(key, value);
				PendingIntent pi = PendingIntent.getBroadcast(
						sqlitewraper.context, id, i, 0);
				// autoupdate GPS lat long in every 15 minutes
				alarmManager.cancel(pi);
				alarmManager.setRepeating(AlarmManager.ELAPSED_REALTIME_WAKEUP,
						SystemClock.elapsedRealtime() + start, repeat, pi);

				boolean alarmUp12 = (PendingIntent.getBroadcast(
						sqlitewraper.context, id, i,
						PendingIntent.FLAG_UPDATE_CURRENT) != null);
				if (alarmUp12) {
					System.out.print("k");

				}

			}

		}

		if (ch.equalsIgnoreCase("l")) {
			boolean alarmUp1 = (PendingIntent
					.getBroadcast(sqlitewraper.context, id, new Intent(
							sqlitewraper.context, LocationPoller.class),
							PendingIntent.FLAG_NO_CREATE) != null);

			if (alarmUp1) {

			} else {
				alarmManager = (AlarmManager) sqlitewraper.context
						.getSystemService(Context.ALARM_SERVICE);

				Intent i = new Intent(sqlitewraper.context,
						LocationPoller.class);
				i.putExtra("intent", "loc");
				i.putExtra(LocationPoller.EXTRA_INTENT, new Intent(
						sqlitewraper.context, LocationReceiver_network.class));
				i.putExtra(LocationPoller.EXTRA_PROVIDER,
						LocationManager.NETWORK_PROVIDER);
				PendingIntent pi = PendingIntent.getBroadcast(
						sqlitewraper.context, 106, i,
						PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

				alarmManager.setRepeating(AlarmManager.ELAPSED_REALTIME_WAKEUP,
						SystemClock.elapsedRealtime() + start, repeat, pi);

			}
		}

	}

}