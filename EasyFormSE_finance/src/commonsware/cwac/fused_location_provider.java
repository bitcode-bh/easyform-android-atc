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

import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.location.Address;
import android.location.Geocoder;
import android.location.Location;
import android.location.LocationManager;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.PowerManager;
import android.util.Log;

import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GooglePlayServicesUtil;
import com.google.android.gms.common.api.GoogleApiClient;
import com.google.android.gms.common.api.PendingResult;
import com.google.android.gms.common.api.Status;
import com.google.android.gms.location.LocationListener;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationServices;
import com.sky.atc.easyformse.sqlitewraper;

import net.sqlcipher.database.SQLiteDatabase;

import org.apache.http.HttpEntity;
import org.apache.http.client.ClientProtocolException;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.DefaultHttpClient;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.util.Date;
import java.util.List;
import java.util.Locale;

/**
 * Service providing the guts of the location polling engine. Uses a WakeLock to
 * ensure the CPU stays on while the location lookup is going on. Handles both
 * successful and timeout conditions.
 * 
 * Those wishing to leverage this service should do so via the LocationPoller
 * class.
 */
public class fused_location_provider extends Service implements
		LocationListener, GoogleApiClient.ConnectionCallbacks,
		GoogleApiClient.OnConnectionFailedListener {
	private static final String LOCK_NAME_STATIC = "com.commonsware.cwac.locpoll.LocationPoller";

	private static volatile PowerManager.WakeLock lockStatic = null;
	private Handler handler = new Handler();
	private Runnable onTimeout = null;
	private Intent bintent;
	LocationRequest mLocationRequest;
	private LocationRequest locationRequest;
	private PowerManager.WakeLock lock;
	Location mCurrentLocation;
	LocationRequest request;
	PollerThread poller;
	static String m12;
	private SQLiteDatabase database;

	private static final long INTERVAL = 60000;
	private static final long FASTEST_INTERVAL = 120000;

	private static final long millis = 130000;
	private static final long MIN_DISTANCE_CHANGE_FOR_UPDATES = 800; // 10
																		// meters
	GoogleApiClient mGoogleApiClient;
	private static final String TAG = "Fused_location";
	private static int TIMEOUT = 125000;

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

		lockStatic = null;
		getLock(sqlitewraper.context.getApplicationContext()).acquire();

		i.setClass(sqlitewraper.context, fused_location_provider.class);

		// ctxt.stopService(i);

		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
			sqlitewraper.context.startForegroundService(i);
		}else {
			sqlitewraper.context.startService(i);
		}

	}

	protected void createLocationRequest() {

		mLocationRequest = new LocationRequest();
		mLocationRequest
				.setPriority(LocationRequest.PRIORITY_HIGH_ACCURACY);

		// mLocationRequest = new LocationRequest();
		// mLocationRequest.setInterval(6000);
		// mLocationRequest.setFastestInterval(3000);
		// // mLocationRequest.setMaxWaitTime(120000);
		// // mLocationRequest.setSmallestDisplacement(800);
		// mLocationRequest
		// .setPriority(LocationRequest.PRIORITY_BALANCED_POWER_ACCURACY);

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

		bintent = (Intent) intent.getExtras().get(LocationPoller.EXTRA_INTENT);
		// --------------------check whether gps or wi-fi start
		// -----------------------------//
		LocationManager locationManager = (LocationManager) this
				.getSystemService(Context.LOCATION_SERVICE);
		ConnectivityManager conMgr = (ConnectivityManager) sqlitewraper.context
				.getSystemService(Context.CONNECTIVITY_SERVICE);

		if ((!(sqlitewraper.internetflag == 1))
				&& (!(conMgr.getNetworkInfo(0).getState() == NetworkInfo.State.CONNECTED || conMgr
						.getNetworkInfo(1).getState() == NetworkInfo.State.CONNECTING))
				&& (!locationManager
						.isProviderEnabled(LocationManager.GPS_PROVIDER))

		) {
			sendbroadcast1(null);
			stopSelf();
		} else {
			getLocation();
			bintent.setPackage(getPackageName());

		}
		poller = new PollerThread(lock, bintent);
		poller.start();

		return (START_REDELIVER_INTENT);
	}

	public void getLocation() {
		try {
			if (!isGooglePlayServicesAvailable()) {
				System.out.print("Google play service not available");
			}
			createLocationRequest();
			database = sqlitewraper.getDatabase();

			mGoogleApiClient = new GoogleApiClient.Builder(sqlitewraper.context)
					.addApi(LocationServices.API).addConnectionCallbacks(this)
					.addOnConnectionFailedListener(this).build();
			mGoogleApiClient.connect();

		} catch (Exception e) {
			//e.printStackTrace();
		}

	}

	private boolean isGooglePlayServicesAvailable() {
		int status = GooglePlayServicesUtil
				.isGooglePlayServicesAvailable(sqlitewraper.context);
		if (ConnectionResult.SUCCESS == status) {
			return true;
		} else {
			// GooglePlayServicesUtil.getErrorDialog(status, this, 0).show();
			return false;
		}
	}

	@Override
	public void onConnected(Bundle bundle) {
		Log.d(TAG, "onConnected - isConnected ...............: "
				+ mGoogleApiClient.isConnected());
		startLocationUpdates();
	}

	protected void startLocationUpdates() {
		try {
			PendingResult<Status> pendingResult = LocationServices.FusedLocationApi
					.requestLocationUpdates(mGoogleApiClient, mLocationRequest,
							this);
			Log.d(TAG, "Location update started ..............: ");
		} catch (Exception e) {
		}
	}

	@Override
	public void onConnectionSuspended(int i) {

	}

	@Override
	public void onConnectionFailed(ConnectionResult connectionResult) {
		Log.d(TAG, "Connection failed: " + connectionResult.toString());
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
		PollerThread(PowerManager.WakeLock lock, Intent intentTemplate) {
			super(lock, "LocationPoller-PollerThread");

			// this.provider = provider;
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

	private void updateUI() {
		Log.d(TAG, "UI update initiated .............");
		if (null != mCurrentLocation) {
			String lat = String.valueOf(mCurrentLocation.getLatitude());
			String lng = String.valueOf(mCurrentLocation.getLongitude());
			stopLocationUpdates();
		} else {
			Log.d(TAG, "location is null ...............");
		}
	}

	protected void stopLocationUpdates() {
		LocationServices.FusedLocationApi.removeLocationUpdates(
				mGoogleApiClient, this);
		Log.d(TAG, "Location update stopped .......................");
	}

	// TODO Auto-generated method stub

	@Override
	public void onLocationChanged(Location location) {

		
		Intent toBroadcast = new Intent(bintent);

		toBroadcast.putExtra(LocationPoller.EXTRA_LOCATION, location);
		// toBroadcast.setAction("maddy");

		Double lat = location.getLatitude();
		Double lon = location.getLongitude();

		Date now = new Date();

		Long time = now.getTime();

		Intent m_p = new Intent(bintent);

		
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

		updateUI();
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

}
