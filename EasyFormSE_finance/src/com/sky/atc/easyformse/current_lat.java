package com.sky.atc.easyformse;

import java.util.ArrayList;
import java.util.LinkedHashMap;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;
import org.json.JSONObject;

import android.app.ActivityManager;
import android.app.ActivityManager.RunningServiceInfo;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.SharedPreferences.Editor;
import net.sqlcipher.database.SQLiteDatabase;
import android.location.LocationManager;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;

import com.sky.atc.easyformse.datautils.MySharedPreferences;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

import static android.content.Context.MODE_PRIVATE;

//Used in rare case if maulik.java plugin not working
//logic to push new location as and when it received
@StringFogIgnore
public class current_lat extends CordovaPlugin {

	private static final String TAG = "maulik";
	private static final String args1 = "nck";
	private SQLiteDatabase database;

	JSONObject json;
	int gps;
	Long diff_time;
	MySharedPreferences pref;
	CallbackContext callback;
	int gprs;
//	Editor editor;

	@Override
	public boolean execute(String action, org.apache.cordova.CordovaArgs args,
			org.apache.cordova.CallbackContext callbackContext)
			throws org.json.JSONException {
		pref = sqlitewraper.getSecureShared("MyPref");
//		editor = pref.edit();

		pref.putString("lat_status_flag", "2");

		pref.putInt("plug_location", 0);

		// Saving string
		pref.commit();

		final ConnectivityManager connMgr = (ConnectivityManager) sqlitewraper.context
				.getSystemService(Context.CONNECTIVITY_SERVICE);
		final android.net.NetworkInfo mobile = connMgr
				.getNetworkInfo(ConnectivityManager.TYPE_MOBILE);
		LocationManager lm = (LocationManager) sqlitewraper.context
				.getSystemService(sqlitewraper.context.LOCATION_SERVICE);

		// -------------------GPS-------------------
		boolean isGPSEnabled = lm
				.isProviderEnabled(LocationManager.GPS_PROVIDER);

		if (connMgr.getNetworkInfo(0).getState() == NetworkInfo.State.CONNECTED
				|| connMgr.getNetworkInfo(1).getState() == NetworkInfo.State.CONNECTING
				|| isGPSEnabled == true) {
			if (isGPSEnabled == true) {
				gps = 1;
			} else {
				gps = 0;
			}
			boolean icheck = isNetworkAvailable();
			if (icheck == true) {
				gprs = 1;
			} else {
				gprs = 0;
			}

			IntentFilter wifiFilter = new IntentFilter("Location");
			sqlitewraper.context.registerReceiver(mReceiver, wifiFilter);
			this.callback = callbackContext;
			PluginResult result = new PluginResult(
					PluginResult.Status.NO_RESULT);
			Intent i = new Intent(sqlitewraper.context, newfused.class);
			cordova.getActivity().startService(i);
			result.setKeepCallback(true);
//			call();
			this.callback.sendPluginResult(result);

		} else {

			PluginResult result = new PluginResult(PluginResult.Status.ERROR);
			callbackContext.error("Gps & internet not working");

		}
		return true;

	}

	public BroadcastReceiver mReceiver = new BroadcastReceiver() {
		@Override
		public void onReceive(Context context, Intent intent) {
			final String action = intent.getAction();
			if (action.equals("Location")) {

				Double lat = Double.valueOf(pref.getString("lat", ""));
				Double lon = Double.valueOf(pref.getString("lon", ""));
				Double accuracy = Double
						.valueOf(pref.getString("accuracy", ""));

				// Bundle bundle = intent.getExtras();
				// Double lat = bundle.getDouble("lat");
				// Double lon = bundle.getDouble("lon");
				// float accuracy = bundle.getFloat("accuracy");
				PluginResult result = null;

				ArrayList<JSONObject> list = new ArrayList<JSONObject>();

				// result.setKeepCallback(false);
				if (callback != null) {
					if (lat != 0) {

						LinkedHashMap<String, Object> lHashMap = new LinkedHashMap<String, Object>();
						lHashMap.put("lat", lat);
						lHashMap.put("lon", lon);
						lHashMap.put("gps", gps);
						lHashMap.put("gprs", gprs);
						lHashMap.put("accuracy", accuracy);

						json = new JSONObject(lHashMap);
						list.add(json);

						callback.sendPluginResult(new PluginResult(
								PluginResult.Status.OK, list.toString()));
					} else {

						callback.error("lat & Lon not found");

					}
					// callback.sendPluginResult(result);
					callback = null;
				}
			}
		}

	};

	private boolean isNetworkAvailable() {
		ConnectivityManager connectivityManager = (ConnectivityManager) sqlitewraper.context
				.getSystemService(Context.CONNECTIVITY_SERVICE);
		NetworkInfo activeNetworkInfo = connectivityManager
				.getActiveNetworkInfo();
		return activeNetworkInfo != null;
	}



}
