package commonsware.cwac;

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

import com.sky.atc.easyformse.*;
import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GooglePlayServicesUtil;

import android.app.ActivityManager;
import android.app.ActivityManager.RunningServiceInfo;
import android.content.BroadcastReceiver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import net.sqlcipher.database.SQLiteDatabase;
import android.location.LocationManager;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;

/**
 * BroadcastReceiver to be launched by AlarmManager. Simply passes the work over
 * to LocationPollerService, who arranges to make sure the WakeLock stuff is
 * done properly.
 */
public class LocationPoller extends BroadcastReceiver {
	public static final String EXTRA_ERROR = "com.commonsware.cwac.locpoll.EXTRA_ERROR";
	public static final String EXTRA_INTENT = "com.commonsware.cwac.locpoll.EXTRA_INTENT";
	public static final String EXTRA_LOCATION = "com.commonsware.cwac.locpoll.EXTRA_LOCATION";
	public static final String EXTRA_PROVIDER = "com.commonsware.cwac.locpoll.EXTRA_PROVIDER";
	public static final String EXTRA_LASTKNOWN = "com.commonsware.cwac.locpoll.EXTRA_LASTKNOWN";
	/**
	 * If this is returned true (defaults to false unless provider is explicitly
	 * NOT enabled), then the provider could not be enabled.
	 */
	public static final String EXTRA_ERROR_PROVIDER_DISABLED = "com.commonsware.cwac.locpoll.EXTRA_ERROR_PROV_DISABLED";
	/**
	 * Optional Timeout. Pass milliseconds as a long. Defaults to 2 minutes.
	 */
	public static final String EXTRA_TIMEOUT = "com.commonsware.cwac.locpoll.EXTRA_TIMEOUT";
	private SQLiteDatabase database;

	/**
	 * Standard entry point for a BroadcastReceiver. Delegates the event to
	 * LocationPollerService for processing.
	 */
	@Override
	public void onReceive(Context context, Intent intent) {
		database = sqlitewraper.getDatabase();
		LocationManager lm = (LocationManager) sqlitewraper.context
				.getSystemService(sqlitewraper.context.LOCATION_SERVICE);
		boolean isGPSEnabled = lm
				.isProviderEnabled(LocationManager.GPS_PROVIDER);
		boolean isnetwork = lm
				.isProviderEnabled(LocationManager.NETWORK_PROVIDER);

		String in = intent.getStringExtra("intent");

//		if (in == null) {
//			in = "b";
//
//		}

		ConnectivityManager conMgr = (ConnectivityManager) sqlitewraper.context
				.getSystemService(Context.CONNECTIVITY_SERVICE);

		// Check that Google Play services is available

		// In debug mode, log the status

		// Continue

		if (isGPSEnabled == true) {

			if (in.equalsIgnoreCase("fused")) {

				if (!isMyServiceRunning(sqlitewraper.context,
						fused_location_provider.class.getName())) {

					fused_location_provider.requestLocation(context, intent);

				}
			} else {
				if (!isMyServiceRunning(sqlitewraper.context,
						LocationPollerService.class.getName())) {

					update_appsate("0", "count");
					// fused_location_provider.requestLocation(context, intent);
					LocationPollerService.requestLocation(context, intent);
				}
			}
		}

		// Google Play services was not available for some reason
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
}
