package com.sky.atc.easyformse;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Date;
import java.util.LinkedHashMap;

import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;
import org.apache.cordova.PluginResult.Status;
import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.client.ClientProtocolException;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.protocol.BasicHttpContext;
import org.apache.http.protocol.HttpContext;
import org.json.JSONObject;

import android.R.string;
import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import net.sqlcipher.database.SQLiteDatabase;
import android.graphics.DashPathEffect;
import android.location.LocationManager;
import android.net.ConnectivityManager;
import android.telephony.TelephonyManager;
import android.util.Log;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

@StringFogIgnore
// Plugin for calculating MSL (altitude)
//
public class elevation extends CordovaPlugin {

	private static final String TAG = "maulik";
	private static final String args1 = "nck";
	private SQLiteDatabase database;

//	private  static  String APIKEY="AIzaSyDnHlyBY37veDJyBC8x8kzI7lL0L7Xok2c";
	private  static  String APIKEY="AIzaSyC2LNIN89S5svstw8JYs4ZILyfl8o5KW78";

	JSONObject json;
	int gps;
	Long diff_time;

	@Override
	public boolean execute(String action, org.apache.cordova.CordovaArgs args,
			org.apache.cordova.CallbackContext callbackContext)
			throws org.json.JSONException {
		Log.i(TAG, "Plugin Called");
		ArrayList<JSONObject> list = new ArrayList<JSONObject>();

		String lat = args.getJSONObject(0).getString("lat");
		String lon = args.getJSONObject(0).getString("long");


		PluginResult result = null;

		/*
		 * database = sqlitewraper.getDatabase(); Cursor c = database .rawQuery(
		 * "SELECT c_lat,c_lon,address, c_accuracy,date  FROM  track_master WHERE   _id = (SELECT MAX(_id) FROM track_master);"
		 * , null); c.moveToFirst(); Double lat =
		 * Double.valueOf(c.getString(0)); Double lon =
		 * Double.valueOf(c.getString(1));
		 */
		String altitude = getElevationFromGoogleMaps(Double.valueOf(lon),
				Double.valueOf(lat));

		try {

			LinkedHashMap<String, Object> lHashMap = new LinkedHashMap<String, Object>();
			lHashMap.put("altitude", altitude);
			json = new JSONObject(lHashMap);
			list.add(json);
			result = new PluginResult(Status.OK);
		} catch (Exception e) {
			//e.printStackTrace();
			callbackContext.sendPluginResult(new PluginResult(
					Status.ERROR));

		}

		callbackContext.sendPluginResult(new PluginResult(
				Status.OK, list.toString()));
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

	private String getElevationFromGoogleMaps(double longitude, double latitude) {
		double result = Double.NaN;

		String value = null;
		HttpClient httpClient = new DefaultHttpClient();
		HttpContext localContext = new BasicHttpContext();
		String url = "https://maps.googleapis.com/maps/api/elevation/"
				+ "xml?locations=" + String.valueOf(latitude) + ","
				+ String.valueOf(longitude) + "&sensor=true"+"&key="+APIKEY;
		HttpGet httpGet = new HttpGet(url);
		try {
			HttpResponse response = httpClient.execute(httpGet, localContext);
			HttpEntity entity = response.getEntity();
			if (entity != null) {
				InputStream instream = entity.getContent();
				int r = -1;
				StringBuffer respStr = new StringBuffer();
				while ((r = instream.read()) != -1)
					respStr.append((char) r);
				String tagOpen = "<elevation>";
				String tagClose = "</elevation>";
				if (respStr.indexOf(tagOpen) != -1) {
					int start = respStr.indexOf(tagOpen) + tagOpen.length();
					int end = respStr.indexOf(tagClose);
					value = respStr.substring(start, end);
					// result = (double) (Double.parseDouble(value) *
					// 3.2808399); // convert
					// from
					// meters
					// to
					// feet
				}
				instream.close();
			}
		} catch (ClientProtocolException e) {
		} catch (IOException e) {
		}

		return value;
	}

}
