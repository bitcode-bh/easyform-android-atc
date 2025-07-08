package com.sky.atc.easyformse;

import android.content.ContentValues;
import android.database.Cursor;
import android.util.Log;

import net.sqlcipher.database.SQLiteDatabase;

import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;
import org.apache.cordova.PluginResult.Status;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.LinkedHashMap;

import io.michaelrocks.paranoid.Obfuscate;

//To return distance from site
@Obfuscate
public class distance extends CordovaPlugin {

	private static final String TAG = "maulik";
	private static final String args1 = "nck";
	private SQLiteDatabase database;

	JSONObject json;
	int gps;
	Long diff_time;

	@Override
	public boolean execute(String action, org.apache.cordova.CordovaArgs args,
			org.apache.cordova.CallbackContext callbackContext)
			throws org.json.JSONException {
		Log.i(TAG, "Plugin Called");
		database = sqlitewraper.getDatabase();
		
		double lat1 = Double
				.parseDouble(args.getJSONObject(0).getString("lat"));
		double lon1 = Double.parseDouble(args.getJSONObject(0)
				.getString("long"));
		String tid = args.getJSONObject(0).getString("tid");
		double distance = 0.0;
		if (tid != null) {
			Cursor c = database.rawQuery(
					"SELECT lat,long FROM  task_master WHERE   tid ="
							+ tid, null);
			c.moveToFirst();

			if (c.getCount() > 0) {
				double lat2 = (double) c.getFloat(0);
				double lon2 = (double) c.getFloat(1);

				distance = dist(lat1, lat2, lon1, lon2);
			}
		}

		ArrayList<JSONObject> list = new ArrayList<JSONObject>();
		PluginResult result = null;

		
		/*
		 * Cursor c = database .rawQuery(
		 * "SELECT c_lat,c_lon,address, c_accuracy,date  FROM  track_master WHERE   _id = (SELECT MAX(_id) FROM track_master);"
		 * , null); c.moveToFirst(); Double lat =
		 * Double.valueOf(c.getString(0)); Double lon =
		 * Double.valueOf(c.getString(1)); Double altitude =
		 * getElevationFromGoogleMaps(lat, lon);
		 */
		try {

			LinkedHashMap<String, Object> lHashMap = new LinkedHashMap<String, Object>();
			lHashMap.put("distance", distance);
			json = new JSONObject(lHashMap);
			list.add(json);
			result = new PluginResult(Status.OK);
		} catch (Exception e) {
			//e.printStackTrace();
			callbackContext.sendPluginResult(new PluginResult(
					PluginResult.Status.ERROR));

		}

		callbackContext.sendPluginResult(new PluginResult(
				PluginResult.Status.OK, list.toString()));
		return true;
	}

	void update_appsate(String value, String ITEAM) {
		try {
			database = sqlitewraper.getDatabase();
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

	double dist(double lat1, double lat2, double lon1, double lon2) {

		final int R = 6371; // Radius of the earth

		double latDistance = deg2rad((lat1) - (lat2));
		double lonDistance = deg2rad((lon1) - (lon2));
		double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
				+ Math.cos(deg2rad((lat1))) * Math.cos(deg2rad(lat2))
				* Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
		double dist_m = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		double distance = R * dist_m * 1000;
		return distance;

	}

	private double deg2rad(double deg) {
		return (deg * Math.PI / 180.0);
	}

}
