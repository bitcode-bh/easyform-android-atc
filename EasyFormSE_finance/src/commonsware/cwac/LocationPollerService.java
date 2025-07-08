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

package commonsware.cwac;

import java.io.IOException;
import java.util.Date;
import java.util.List;
import java.util.Locale;

import org.apache.http.HttpEntity;
import org.apache.http.client.ClientProtocolException;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.DefaultHttpClient;
import org.json.JSONException;
import org.json.JSONObject;

import android.app.Service;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import net.sqlcipher.database.SQLiteDatabase;
import android.location.Address;
import android.location.Geocoder;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.PowerManager;
import android.util.Log;

import com.commonsware.cwac.wakeful.WakefulIntentService;
import com.google.android.gms.location.LocationRequest;
import com.sky.atc.easyformse.sqlitewraper;
import com.sky.atc.easyformse.touch_server;

/**
 * Service providing the guts of the location polling engine. Uses a WakeLock to
 * ensure the CPU stays on while the location lookup is going on. Handles both
 * successful and timeout conditions.
 * 
 * Those wishing to leverage this service should do so via the LocationPoller
 * class.
 */
public class LocationPollerService extends Service implements LocationListener {
	private static final String LOCK_NAME_STATIC = "com.commonsware.cwac.locpoll.LocationPoller";
	private static final int DEFAULT_TIMEOUT = 60000 * 2; // two minutes
	private static final long UPDATE_INTERVAL = 60000;
	private static final long FASTEST_INTERVAL = 10000;
	private static int TIMEOUT = DEFAULT_TIMEOUT;
	private static volatile PowerManager.WakeLock lockStatic = null;
	private Handler handler = new Handler();
	private Runnable onTimeout = null;
	private Intent bintent;

	private LocationRequest locationRequest;
	private PowerManager.WakeLock lock;
	private static final int LOCATION_UPDATES_INTERVAL = 300000;

	LocationRequest request;
	PollerThread poller;
	static String m12;
	private SQLiteDatabase database;

	/**
	 * Lazy-initializes the WakeLock when we first use it. We use a partial
	 * WakeLock since we only need the CPU on, not the screen.
	 */
	synchronized private static PowerManager.WakeLock getLock(Context context) {
		if (lockStatic == null) {
			PowerManager mgr = (PowerManager) context.getApplicationContext()
					.getSystemService(Context.POWER_SERVICE);

			lockStatic = mgr.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK,
					LOCK_NAME_STATIC);
			lockStatic.setReferenceCounted(true);
		}

		return (lockStatic);
	}

	/**
	 * Called by LocationPoller to trigger a poll for the location. Acquires the
	 * WakeLock, then starts the service using the supplied Intent (setting the
	 * component so routing always goes to the service).
	 */
	public static void requestLocation(Context ctxt, Intent i) {
		String provider = i.getStringExtra(LocationPoller.EXTRA_PROVIDER);
		Intent toBroadcast = (Intent) i.getExtras().get(
				LocationPoller.EXTRA_INTENT);
		m12 = i.getStringExtra("m");
		if (provider == null) {
			Log.e("LocationPoller", "Invalid Intent -- has no provider");
		} else if (toBroadcast == null) {
			Log.e("LocationPoller",
					"Invalid Intent -- has no Intent to broadcast");
		} else {
			lockStatic = null;
			getLock(sqlitewraper.context.getApplicationContext()).acquire();

			i.setClass(sqlitewraper.context, LocationPollerService.class);

			// ctxt.stopService(i);

			if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
				sqlitewraper.context.startForegroundService(i);
			}else {
				sqlitewraper.context.startService(i);
			}
		}
	}

	/**
	 * Obtain the LocationManager on startup
	 */

	public JSONObject getLocationInfo(Double lat, Double lng) {

		HttpGet httpGet = new HttpGet(
				"http://maps.google.com/maps/api/geocode/json?latlng=" + lat
						+ "," + lng + "&sensor=true");
		HttpClient client = new DefaultHttpClient();
		org.apache.http.HttpResponse response;
		StringBuilder stringBuilder = new StringBuilder();

		try {
			response = client.execute(httpGet);
			HttpEntity entity = response.getEntity();
			java.io.InputStream stream = entity.getContent();
			int b;
			while ((b = stream.read()) != -1) {
				stringBuilder.append((char) b);
			}
		} catch (ClientProtocolException e) {
		} catch (IOException e) {
		}

		JSONObject jsonObject = new JSONObject();
		try {
			jsonObject = new JSONObject(stringBuilder.toString());
		} catch (JSONException e) {
			//e.printStackTrace();
		}
		return jsonObject;
	}

	private void init() {
		// initializing, connecting locationClient

	}

	/**
	 * No-op implementation as required by superclass
	 */
	@Override
	public IBinder onBind(Intent i) {
		return (null);
	}

	/**
	 * Validates the required extras (EXTRA_PROVIDER and EXTRA_INTENT). If
	 * valid, updates the Intent to be broadcast with the application's own
	 * package (required to keep the broadcast within this application, so we do
	 * not leak security information). Then, forks a PollerThread to do the
	 * actual location lookup.
	 * 
	 * @return START_REDELIVER_INTENT to ensure we get the last request again
	 */
	@Override
	public int onStartCommand(Intent intent, int flags, int startId) {
		lock = getLock(this.getApplicationContext());

		if (!lock.isHeld() || (flags & START_FLAG_REDELIVERY) != 0) {
			lock.acquire();
		}

		String provider = intent.getStringExtra(LocationPoller.EXTRA_PROVIDER);
		bintent = (Intent) intent.getExtras().get(LocationPoller.EXTRA_INTENT);
		TIMEOUT = (int) intent.getLongExtra(LocationPoller.EXTRA_TIMEOUT,
				DEFAULT_TIMEOUT);
		// --------------------check whether gps or wi-fi start
		// -----------------------------//
		// LocationManager locationManager = (LocationManager) this
		// .getSystemService(Context.LOCATION_SERVICE);

//		database = sqlitewraper.getDatabase();
//		ContentValues c = new ContentValues();
//		c.put("att", "GPS");
//		c.put("time", String.valueOf(System.currentTimeMillis()));
//		c.put("loca", "att");
//
//		long temp = database.insert("gps_att", null, c);

		ConnectivityManager conMgr = (ConnectivityManager) sqlitewraper.context
				.getSystemService(Context.CONNECTIVITY_SERVICE);
		LocationManager locationManager = (LocationManager) this
				.getSystemService(Context.LOCATION_SERVICE);
		if (!(locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER))

		) {
			sendbroadcast1(null);
			stopSelf();
		} else {
			bintent.setPackage(getPackageName());

			locationManager.requestLocationUpdates(
					LocationManager.GPS_PROVIDER, 0, 0, this);

		}
		poller = new PollerThread(lock, provider, bintent);
		poller.start();

		return (START_REDELIVER_INTENT);
	}

	void location(Location loc, String add) {

		String msg = null;
		if (loc == null) {

		} else {

			Date now = new Date();

			Long time = now.getTime();
			String Date = now.toLocaleString();

			msg = "latest data" + Date + "\n";
			Double lat = loc.getLatitude();
			Double lon = loc.getLongitude();
			Float accuracy = loc.getAccuracy();
			String provider = loc.getProvider();
			String address = add;
			if (address == null) {
				try {

					Geocoder gcd = new Geocoder(sqlitewraper.context,
							Locale.getDefault());
					List<Address> addresses = gcd.getFromLocation(lat, lon, 1);
					if (addresses.size() > 0) {
						Address a = addresses.get(0);
						for (int k = 0; k < a.getMaxAddressLineIndex(); k++) {
							if (address == null)
								address = a.getAddressLine(k);
							else
								address = address + "," + a.getAddressLine(k);
						}
						address = address + "," + a.getCountryName();
					}

				} catch (Exception e) {
					//e.printStackTrace();

				}
			}
			database = sqlitewraper.getDatabase();
			// Cursor c_loc = database
			// .rawQuery(
			// "SELECT lat,lon,address,accuracy  FROM  location_log WHERE   _id = (SELECT MAX(_id) FROM location_log);",
			// null);
			// c_loc.moveToFirst();

			// ContentValues args1 = new ContentValues();
			// args1.put("cellid", address);
			// args1.put("lat", lat.toString());
			// args1.put("date", time.toString());
			// args1.put("date_s", Date);
			// args1.put("lon", lon.toString());
			// args1.put("provider", provider);
			// args1.put("accuracy", accuracy);
			// args1.put("IS_SEND", 0);
			// args1.put("IS_LOC", time);
			// args1.put("address", address);
			// // args1.put("lat", "");
			// // args1.put("lon", "");
			// // args1.put("accuracy", "");
			//
			// long temp_mast = database.insert("track_master", null, args1);
			// // temp_mast++;
			//
			// if ((((int) (temp_mast)) / 5 > 0) && (((int) (temp_mast)) % 5 ==
			// 0)) {
			// // cal_avg((int) temp_mast);
			//
			// Intent i = new Intent(sqlitewraper.context, new_loc.class);
			// i.putExtra("start", (int) temp_mast);
			// WakefulIntentService.sendWakefulWork(sqlitewraper.context, i);
			//
			// }
			//
			/*
			 * Cursor c = database .rawQuery(
			 * "SELECT lat,lon,address,accuracy,date  FROM  location_log WHERE   _id = (SELECT MAX(_id) FROM location_log);"
			 * , null); c.moveToFirst();
			 * 
			 * if (c.getCount() == 0) { // String lat_cal = c.getString(0); //
			 * String lon_cal = c.getString(1); // String add_Cal =
			 * c.getString(2);
			 * 
			 * ContentValues args = new ContentValues(); args.put("cellid",
			 * address); args.put("lat", lat.toString()); args.put("date",
			 * time.toString()); args.put("date_s", Date); args.put("lon",
			 * lon.toString()); args.put("provider", provider);
			 * args.put("accuracy", accuracy); args.put("IS_SEND", 0);
			 * args.put("IS_LOC", time); args.put("address", address); database
			 * = sqlitewraper.getDatabase(); long temp =
			 * database.insert("location_log", null, args); }
			 * 
			 * else {
			 * 
			 * String lat_cal = c.getString(0); String lon_cal = c.getString(1);
			 * String add_Cal = c.getString(2); String accuracy1 =
			 * c.getString(3); String date = c.getString(4);
			 * 
			 * final int R = 6371; // Radius of the earth
			 * 
			 * Double latDistance = deg2rad((Double.parseDouble(lat_cal)) -
			 * (double) (lat)); Double lonDistance =
			 * deg2rad((Double.parseDouble(lon_cal)) - (double) (lon)); Double a
			 * = Math.sin(latDistance / 2) Math.sin(latDistance / 2) +
			 * Math.cos(deg2rad(Double.parseDouble(lat_cal)))
			 * Math.cos(deg2rad((double) (lat))) Math.sin(lonDistance / 2)
			 * Math.sin(lonDistance / 2); Double dist_m = 2 *
			 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); double distance = R *
			 * dist_m * 1000; // convert to // meters
			 * 
			 * if ((Float.valueOf(time.toString()) - (Float.valueOf(date))) >
			 * 14400000) { // String address = add(Double.valueOf(lat), //
			 * Double.valueOf(lon)); ContentValues args = new ContentValues();
			 * args.put("cellid", address); args.put("lat", lat.toString());
			 * args.put("date", time.toString()); args.put("date_s", Date);
			 * args.put("lon", lon.toString()); args.put("provider", provider);
			 * args.put("accuracy", accuracy); args.put("IS_SEND", 0);
			 * args.put("IS_LOC", time); args.put("address", address); //
			 * args.put("wait_time", date1); // args.put("wait_time_s", date_s);
			 * database = sqlitewraper.getDatabase(); long temp =
			 * database.insert("location_log", null, args);
			 * 
			 * System.out.print("out"); }
			 * 
			 * if (distance > (Float.valueOf(accuracy1) + accuracy)) {
			 * System.out.print("Enter");
			 * 
			 * ContentValues args = new ContentValues(); args.put("cellid",
			 * address); args.put("lat", lat.toString()); args.put("date",
			 * time.toString()); args.put("date_s", Date); args.put("lon",
			 * lon.toString()); args.put("provider", provider);
			 * args.put("accuracy", accuracy); args.put("IS_SEND", 0);
			 * args.put("IS_LOC", time); args.put("address", address); long temp
			 * = database.insert("location_log", null, args);
			 * 
			 * }
			 * 
			 * else {
			 * 
			 * Float acc_old = Float.valueOf(accuracy1); Float acc_new =
			 * Float.valueOf(accuracy); if ((acc_old / 2) > acc_new) {
			 * 
			 * ContentValues args = new ContentValues(); args.put("cellid",
			 * address); args.put("lat", lat.toString()); args.put("date",
			 * time.toString()); args.put("date_s", Date); args.put("lon",
			 * lon.toString()); args.put("provider", provider);
			 * args.put("accuracy", accuracy); args.put("IS_SEND", 0);
			 * args.put("IS_LOC", time); args.put("address", address); //
			 * args.put("wait_time", date1); // args.put("wait_time_s", date_s);
			 * database = sqlitewraper.getDatabase(); long temp =
			 * database.insert("location_log", null, args);
			 * 
			 * }
			 * 
			 * }
			 */
			// }
			// else {
			//
			// Cursor c1 = database
			// .rawQuery(
			// "select n_lat,n_lon,accuracy from refrence_master",
			// null);
			// c1.moveToFirst();
			// if (c1.getCount() > 0) {
			//
			// float n_acc1 = Float.valueOf(c1.getString(2));
			// double n_lat1 = (Double
			// .parseDouble(c1.getString(0)));
			// double n_lon1 = (Double
			// .parseDouble(c1.getString(1)));
			//
			// Float n_acc = (n_acc1 + accuracy) / 2;
			// double n_lat = (n_lat1 + lat) / 2;
			// double n_lon = (n_lon1 + lon) / 2;
			// update_ref_master(n_lat, n_lon, n_acc);
			// final int R1 = 6371; // Radius of the earth
			//
			// Double latDistance1 = deg2rad(((n_lat))
			// - (double) (lat));
			// Double lonDistance1 = deg2rad(((n_lon))
			// - (double) (lon));
			// Double a1 = Math.sin(latDistance / 2)
			// * Math.sin(latDistance / 2)
			// + Math.cos(deg2rad((n_lat1)))
			// * Math.cos(deg2rad((double) (lat)))
			// * Math.sin(lonDistance / 2)
			// * Math.sin(lonDistance / 2);
			// Double dist_m1 = 2 * Math.atan2(Math.sqrt(a),
			// Math.sqrt(1 - a1));
			// double distance1 = R * dist_m1 * 1000; // convert to
			// // meters
			//
			// if (distance1 > (n_acc + accuracy)) {
			// System.out.print("Enter");
			//
			// ContentValues args = new ContentValues();
			// args.put("cellid", address);
			// args.put("lat", lat.toString());
			// args.put("date", time.toString());
			// args.put("date_s", Date);
			// args.put("lon", lon.toString());
			// args.put("provider", provider);
			// args.put("accuracy", accuracy);
			// args.put("IS_SEND", 0);
			// args.put("IS_LOC", time);
			// args.put("address", address);
			// long temp = database.insert("location_log",
			// null, args);
			//
			// }
			//
			// } else {
			// Float n_acc = (Float.valueOf(accuracy1) + accuracy) / 2;
			// double n_lat = (Double.parseDouble(lat_cal) + lat) / 2;
			// double n_lon = (Double.parseDouble(lon_cal) + lon) / 2;
			//
			// update_ref_master(n_lat, n_lon, n_acc);
			//
			// }
			// }
			// }

			// ContentValues args = new ContentValues();
			// args.put("cellid", address);
			// args.put("lat", lat.toString());
			// args.put("date", time.toString());
			// args.put("date_s", Date);
			// args.put("lon", lon.toString());
			// args.put("provider", provider);
			// args.put("accuracy", accuracy);
			// args.put("IS_SEND", 0);
			// args.put("IS_LOC", time);
			// args.put("address", address);

			try {
				// dbHelper = new MySQLiteHelper(context);
				database = sqlitewraper.getDatabase();
				// long temp = database.insert("location_log", null,
				// args);
				// out.write((int)temp);
				// Intent location = new Intent(sqlitewraper.context,
				// new_loc.class);
				//
				// WakefulIntentService.sendWakefulWork(sqlitewraper.context,
				// location);

			} catch (Exception e) {

			}

		}

	}

	public void sendbroadcast1(Intent sendbroudcast) {
		if (onTimeout != null) {
			handler.removeCallbacks(onTimeout);
			onTimeout = null;
		}

		sendBroadcast(sendbroudcast);

		if (lock.isHeld()) {
			lock.release();
		}
		if (!lock.isHeld()) {
			stopSelf();
		}
	}

	/**
	 * A WakefulThread subclass that knows how to look up the current location,
	 * plus handle the timeout scenario.
	 */
	private class PollerThread extends WakefulThread {

		private String provider = null;
		private Intent intentTemplate = null;

		/**
		 * Constructor.
		 * 
		 * @param lock
		 *            Already-locked WakeLock
		 * @param locMgr
		 *            LocationManager for doing the location lookup
		 * @param provider
		 *            name of the location provider to use
		 * @param intentTemplate
		 *            Intent to be broadcast when location found or timeout
		 *            occurs
		 */
		PollerThread(PowerManager.WakeLock lock, String provider,
				Intent intentTemplate) {
			super(lock, "LocationPoller-PollerThread");

			this.provider = provider;
			this.intentTemplate = intentTemplate;
		}

		/**
		 * Called before the Handler loop begins. Registers a timeout, so we do
		 * not wait forever for a location. When a timeout occurs, broadcast an
		 * Intent containing an error extra, then terminate the thread. Also,
		 * requests a location update from the LocationManager.
		 */

		@Override
		protected void onPreExecute() {

			// Added in enabled check to even check if there is a provider
			// enabled.

			onTimeout = new Runnable() {
				public void run() {

//					Cursor c = database.rawQuery(
//							"select max(_id) from gps_att", null);
//					c.moveToFirst();
//					int id = c.getInt(0);
//
//					String t = "_id=" + id;
//					ContentValues c1 = new ContentValues();
//					c1.put("loca", "not get");
//
//					long temp = database.update("gps_att", c1, t, null);
//					temp++;
					Intent toBroadcast = new Intent(intentTemplate);

					toBroadcast
							.putExtra(LocationPoller.EXTRA_ERROR, "Timeout!");
					toBroadcast
							.putExtra(
									LocationPoller.EXTRA_ERROR_PROVIDER_DISABLED,
									false);

					sendBroadcast(toBroadcast);

					// locationClient.removeLocationUpdates(mLocationCallback);
					quit();
				}
			};
			handler.postDelayed(onTimeout, TIMEOUT);

		}

		/**
		 * Called when the Handler loop ends. Removes the location listener.
		 */
		@Override
		protected void onPostExecute() {

			super.onPostExecute();
		}

		/**
		 * Called when the WakeLock is completely unlocked. Stops the service,
		 * so everything shuts down.
		 */
		@Override
		protected void onUnlocked() {
			stopSelf();
		}
	}

	@Override
	public void onLocationChanged(Location location) {

			Intent toBroadcast = new Intent(bintent);

		toBroadcast.putExtra(LocationPoller.EXTRA_LOCATION, location);
		// toBroadcast.setAction("maddy");

		Double lat = location.getLatitude();
		Double lon = location.getLongitude();

//		Cursor c = database.rawQuery("select max(_id) from gps_att", null);
//		c.moveToFirst();
//		int id = c.getInt(0);
//
//		String t = "_id=" + id;
//		ContentValues c1 = new ContentValues();
//		c1.put("loca", lat.toString() + "__" + lon.toString());
//
//		long temp = database.update("gps_att", c1, t, null);
//		temp++;

		Date now = new Date();

		Long time = now.getTime();

		Intent m_p = new Intent(bintent);

		// JSONObject ret = getLocationInfo(lat, lon);
		JSONObject add;
		String location_string = null;
//		if (location_string == null) {
//			try {
//
//				Geocoder gcd = new Geocoder(sqlitewraper.context,
//						Locale.getDefault());
//				List<Address> addresses = gcd.getFromLocation(lat, lon, 1);
//				if (addresses.size() > 0) {
//					Address a = addresses.get(0);
//					for (int k = 0; k < a.getMaxAddressLineIndex(); k++) {
//						if (location_string == null)
//							location_string = a.getAddressLine(k);
//						else
//							location_string = location_string + ","
//									+ a.getAddressLine(k);
//					}
//					location_string = location_string + ","
//							+ a.getCountryName();
//				}
//
//			} catch (Exception e) {
//				//e.printStackTrace();
//
//			}
//		}

//		Intent i_ser = new Intent(sqlitewraper.context, touch_server.class);
//		i_ser.putExtra("lat", lat);
//		i_ser.putExtra("long", lon);
//		i_ser.putExtra("address", location_string);
//		i_ser.putExtra("accuracy", location.getAccuracy());
//		i_ser.putExtra("Date", now.toString());
//		WakefulIntentService.sendWakefulWork(sqlitewraper.context, i_ser);
		//

		// Intent intent = new Intent();
		// intent.setAction("com.skyproductivity.android.cam.capture");
		// intent.putExtra("lat", lat.toString());
		// intent.putExtra("lon", lon.toString());
		// intent.putExtra("add", location_string);
		// sqlitewraper.context.sendBroadcast(intent);

		// location(location, location_string);
		toBroadcast.putExtra("address", location_string);

		toBroadcast.putExtra("time", time);
		sendbroadcast1(toBroadcast);
		if (m12 != null) {

			// maulik m = new maulik();
			// m.notify();
		}
		// stopService(toBroadcast);
		// locationClient.removeLocationUpdates(mLocationCallback);
		if (lock.isHeld()) {
			lock.release();

			stopSelf();
			// stopService(toBroadcast);
		}
		if (!lock.isHeld()) {
			// stopService(toBroadcast);
			stopSelf();

		}
		poller.forcestop();
	}

	// TODO Auto-generated method stub

	@Override
	public void onProviderDisabled(String provider) {
		// TODO Auto-generated method stub

	}

	@Override
	public void onProviderEnabled(String provider) {
		// TODO Auto-generated method stub

	}

	@Override
	public void onStatusChanged(String provider, int status, Bundle extras) {
		// TODO Auto-generated method stub

	}

}
