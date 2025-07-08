package com.sky.atc.easyformse.plugins;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

import com.sky.atc.easyformse.navigation;
import com.sky.atc.easyformse.sqlitewraper;

import net.sqlcipher.database.SQLiteDatabase;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Date;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

//To show route between two sites
public class SiteRoutePlugin extends CordovaPlugin {

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
			CallbackContext callbackContext)
			throws org.json.JSONException {
		this.callbackContext = callbackContext;
		Log.i(TAG, "Plugin Called");
		Date now = new Date();
		Long time = now.getTime();
		ArrayList<JSONObject> list = new ArrayList<JSONObject>();

		PluginResult result = null;
		try {

			String user_lat = args.getJSONObject(0).getString("site1_lat");
			String user_long = args.getJSONObject(0).getString("site1_long");
			String site_lat = args.getJSONObject(0).getString("site2_lat");
			String site_long = args.getJSONObject(0).getString("site2_long");

			if (sqlitewraper.internetflag == 1) {

				Intent intent = new Intent(this.cordova.getActivity(),
						navigation.class);

				Bundle data = new Bundle();
				data.putString("user_lat", user_lat);
				data.putString("user_long", user_long);

				data.putString("site_lat", site_lat);
				data.putString("site_long", site_long);
				intent.putExtras(data);
				if (this.cordova != null) {
					this.cordova.startActivityForResult(this, intent, 0);
					return true;
				}
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
			if (resultCode == android.app.Activity.RESULT_OK) { // 0:ok
				this.callbackContext.success("Success");
			} else {
				this.callbackContext.error("Null");
			}

			break;
		default:
			break;
		}
	}

}
