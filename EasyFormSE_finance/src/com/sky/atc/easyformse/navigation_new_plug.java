package com.sky.atc.easyformse;

import java.util.ArrayList;
import java.util.Date;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;
import org.json.JSONObject;

import android.app.FragmentManager.OnBackStackChangedListener;
import android.content.Intent;
import net.sqlcipher.database.SQLiteDatabase;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;

import io.michaelrocks.paranoid.Obfuscate;

//open google map navigation
@Obfuscate
public class navigation_new_plug extends CordovaPlugin {

	private static final String TAG = "maulik";
	private static final String args1 = "nck";
	private SQLiteDatabase database;

	JSONObject json;
	int gps;
	Long diff_time;
	public CallbackContext callbackContext;
	private final ExecutorService threadPool = Executors.newCachedThreadPool();
	@Override
	public boolean execute(String action, org.apache.cordova.CordovaArgs args,
			org.apache.cordova.CallbackContext callbackContext)
			throws org.json.JSONException {
		this.callbackContext = callbackContext;
		Log.i(TAG, "Plugin Called");
		Date now = new Date();
		Long time = now.getTime();
		ArrayList<JSONObject> list = new ArrayList<JSONObject>();

		PluginResult result = null;
		try {

			String user_lat = args.getJSONObject(0).getString("user_lat");
			String user_long = args.getJSONObject(0).getString("user_long");
			String site_lat = args.getJSONObject(0).getString("site_lat");
			String site_long = args.getJSONObject(0).getString("site_long");



			if (sqlitewraper.internetflag == 1) {

				Uri gmmIntentUri = Uri.parse("google.navigation:q=" + site_lat
						+ "," + site_long);
				Intent mapIntent = new Intent(Intent.ACTION_VIEW, gmmIntentUri);
				mapIntent.setClassName("com.google.android.apps.maps", "com.google.android.maps.MapsActivity");
				// mapIntent.setPackage("com.google.android.apps.maps");
				this.cordova.getActivity().startActivity(mapIntent);
			} else {
				// String message = intent.getStringExtra("result");
				this.callbackContext.error("error");

			}
			

			if (this.cordova != null) {
				// this.cordova.startActivityForResult(this, intent, 0);
				return true;
			}

		} catch (Exception e) {
			// TODO: handle exception
		}

		return true;

	}

	public ExecutorService getThreadPool() {
		return threadPool;
	}

	public void onActivityResult(int requestCode, int resultCode, Intent intent) {
		switch (requestCode) {
		case 0:
			// retour de la version utilisant le sample de imense alpr
			if (resultCode == android.app.Activity.RESULT_OK) { // 0:ok
				Bundle bundle = intent.getExtras();
				String status = bundle.getString("status");
				this.callbackContext.success(status);
			} else {
				String message = intent.getStringExtra("result");
				this.callbackContext.error(message);
			}

			break;
		default:
			break;
		}
	}

}
