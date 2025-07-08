package com.sky.atc.easyformse;

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

import android.content.BroadcastReceiver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import net.sqlcipher.database.SQLiteDatabase;
import android.location.Address;
import android.location.Geocoder;
import android.location.Location;
import android.os.Bundle;
import android.util.Log;

import com.commonsware.cwac.wakeful.WakefulIntentService;
import com.sky.atc.easyformse.LocationReceiver_network;
import com.sky.atc.easyformse.sqlitewraper;

import commonsware.cwac.LocationPoller;
import io.michaelrocks.paranoid.Obfuscate;

@Obfuscate
public class LocationReceiver_network extends BroadcastReceiver {
	private SQLiteDatabase database;
	private MySQLiteHelper dbHelper;
	Long time;

	@Override
	public void onReceive(Context context, Intent intent) {
		// File log=
		// new File(Environment.getExternalStorageDirectory(),
		// "LocationLog.txt");

		try {
			// BufferedWriter out=
			// new BufferedWriter(new FileWriter(log.getAbsolutePath(),
			// log.exists()));

			// out.write(new Date().toString());
			// out.write(" : ");

			Bundle b = intent.getExtras();
			Location loc = (Location) b.get(LocationPoller.EXTRA_LOCATION);
			String add = b.getString("address");

			String msg = null;
			String timemilli= String.valueOf(System.currentTimeMillis());

			Intent i = new Intent(sqlitewraper.context, loc_change.class);
			
			i.putExtra("loc", loc);
		
			i.putExtra("address",add );
			i.putExtra("time",timemilli );
			i.putExtra("tripflag","0");

			
			WakefulIntentService.sendWakefulWork(sqlitewraper.context, i);

			// out.write("network :"+msg);
			// out.write("\n");
			// out.close();

		} catch (Exception e) {
			Log.e(getClass().getName(), "Exception appending to log file", e);
		}
	}

	void cal_avg(int i) {
		int s_id = i - 10;
		int e_id = i;
		float total_lat = 0, avg_lat, avg_lon, avg_acc;
		float total_lon = 0;

		float total_acc = 0;

		Cursor c = database.rawQuery(
				"SELECT lat,lon,accuracy  FROM  track_master WHERE   _id >="
						+ s_id + " and _id <=" + e_id + ";", null);
		c.moveToFirst();
		for (int i1 = 0; i1 < c.getCount(); i1++) {

			float lat = (Float.valueOf(c.getString(0)));
			float lon = (Float.valueOf(c.getString(1)));
			float accuracy = (Float.valueOf(c.getString(2)));

			total_lat = lat + total_lat;
			total_lon = total_lon + lon;
			total_acc = total_acc + accuracy;
			c.moveToNext();

		}
		avg_lat = total_lat / 10;
		avg_lon = total_lon / 10;
		avg_acc = total_lon / 10;

	}

	void update_ref_master(double n_lat, double n_lon, Float accuracy) {
		try {

			ContentValues args = new ContentValues();
			args.put("n_lat", n_lat);
			args.put("n_lon", n_lon);
			args.put("accuracy", accuracy);
			long temp = database.update("refrence_master", args, "", null);
			temp++;
		} catch (Exception e) {
			System.out.println(e.getMessage());
			// TODO: handle exception
		}
	}

	private double deg2rad(double deg) {
		return (deg * Math.PI / 180.0);
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

	void chk_insert(float lat, float lon, float acc, String provider,
			String date1, String date_s, String username) {

		Date now = new Date();
		database = sqlitewraper.getDatabase();
		time = now.getTime();
		Cursor check_location = database
				.rawQuery(
						"SELECT lat,lon,address,accuracy,date,date_s,username  FROM  location_log WHERE   _id = (SELECT MAX(_id) FROM location_log where username='"
								+ username + "');", null);
		check_location.moveToFirst();
		if (check_location.getCount() == 0) {

			String address = add(Double.valueOf(lat), Double.valueOf(lon));
			if (address == null) {
				address = "na";
			}

			ContentValues args = new ContentValues();
			args.put("cellid", address);
			args.put("lat", String.valueOf(lat));
			args.put("date", date1);
			args.put("date_s", date_s);
			args.put("lon", String.valueOf(lon));
			args.put("provider", provider);
			args.put("accuracy", String.valueOf(acc));
			args.put("IS_SEND", 0);
			args.put("IS_LOC", time);
			args.put("address", address);
			args.put("wait_time", date1);
			args.put("wait_time_s", date_s);
			args.put("username", username);
			//lac column is use for check the trip status
			// true means trip start false means trip not start (10-01-2024)
			args.put("lac",DeviceEventsUtils.tripStatus());
			database = sqlitewraper.getDatabase();
			long temp = database.insert("location_log", null, args);
			Intent location = new Intent(sqlitewraper.context,
					location_server.class);

			WakefulIntentService
					.sendWakefulWork(sqlitewraper.context, location);
		} else {

			// Cursor check_location1 = database
			// .rawQuery(
			// "SELECT _id  FROM  track_master WHERE   _id = (SELECT MAX(_id) FROM track_master);",
			// null);
			// check_location1.moveToFirst();
			//
			// int id_track = check_location1.getInt(0);
			// String track_lon = check_location1.getString(1);
			// String track_add = check_location1.getString(2);
			// String track_accuracy1 = check_location1.getString(3);
			//

			Cursor check_location12 = database
					.rawQuery(
							"SELECT _id,lat,lon,address,accuracy,date,date_s,wait_time_s,wait_time  FROM  location_log  WHERE   _id = (SELECT MAX(_id) FROM location_log where username='"
									+ username + "');", null);
			check_location12.moveToFirst();
			int track_id = check_location12.getInt(0);
			String track_lat1 = check_location12.getString(1);
			String track_lon2 = check_location12.getString(2);
			String track_add2 = check_location12.getString(3);
			String track_accuracy12 = check_location12.getString(4);
			String track_date = check_location12.getString(5);
			String track_dates = check_location12.getString(6);

			String track_wait_date = check_location12.getString(8);
			String track_wait_dates = check_location12.getString(7);

			// if (track_wait_date == null) {
			// track_wait_date = time.toString();
			//
			// }
			// if (track_wait_dates == null) {
			// track_wait_dates = now.toString();
			//
			// }
			// String lat_cal1 = check_location.getString(0);
			// String lon_cal1 = check_location.getString(1);
			// String add_Cal1 = check_location.getString(2);
			String accuracy12 = check_location.getString(3);
			String date = check_location.getString(4);

			Float acc_new = Float.valueOf(acc);
			Float acc_old = Float.valueOf(accuracy12);

			float diff = Float.valueOf(time.toString()) - (Float.valueOf(date));
			if ((Float.valueOf(time.toString()) - (Float.valueOf(date))) > 21600000
					|| (acc_old / 4 > acc_new)) {
				String address = add(Double.valueOf(lat), Double.valueOf(lon));
				ContentValues args = new ContentValues();
				args.put("cellid", address);
				args.put("lat", String.valueOf(lat));
				args.put("date", date1);
				args.put("date_s", date_s);
				args.put("lon", String.valueOf(lon));
				args.put("provider", provider);
				args.put("accuracy", String.valueOf(acc));
				args.put("IS_SEND", 0);
				args.put("IS_LOC", time);
				args.put("address", address);
				args.put("wait_time", date1);
				args.put("wait_time_s", date_s);
				args.put("username", username);
				//lac column is use for check the trip status
				//true means trip start false means trip not start (10-01-2024)
				args.put("lac",DeviceEventsUtils.tripStatus());
				database = sqlitewraper.getDatabase();
				long temp = database.insert("location_log", null, args);

				System.out.print("out");
			}

			else {

				String lat_cal = check_location.getString(0);
				String lon_cal = check_location.getString(1);
				String add_Cal = check_location.getString(2);
				String accuracy1 = check_location.getString(3);

				final int R = 6371; // Radius of the earth

				Double latDistance = deg2rad((Double.parseDouble(lat_cal))
						- ((double) (lat)));
				Double lonDistance = deg2rad((Double.parseDouble(lon_cal))
						- (double) (lon));
				Double a = Math.sin(latDistance / 2)
						* Math.sin(latDistance / 2)
						+ Math.cos(deg2rad(Double.parseDouble(lat_cal)))
						* Math.cos(deg2rad((double) (lat)))
						* Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
				Double dist_m = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
				double distance = R * dist_m * 1000; // convert to
				// meters

				if (distance > (Float.valueOf(accuracy1) + acc + 600)) {
					System.out.print("Enter");
					String address = add(lat, lon);
					if (address == null) {
						if (sqlitewraper.internetflag == 1) {
							JSONObject ret = getLocationInfo((double) lat,
									(double) lon);
							JSONObject add;
							String location_string = null;
							try {
								add = ret.getJSONArray("results")
										.getJSONObject(0);
								location_string = add
										.getString("formatted_address");
							} catch (JSONException e) {
								// TODO Auto-generated catch block
								//e.printStackTrace();
							}

							if (location_string == null) {
								address = "na";
							}
						} else {
							address = "na";

						}
					}

					// ContentValues args1 = new ContentValues();
					// args1.put("cellid", address);
					// args1.put("lat", String.valueOf(track_lat1));
					// args1.put("date", track_wait_date);
					// args1.put("date_s", track_wait_dates);
					// args1.put("lon", String.valueOf(track_lon2));
					// args1.put("provider", provider);
					// args1.put("accuracy", String.valueOf(track_accuracy12));
					// args1.put("IS_SEND", 0);
					// args1.put("IS_LOC", time);
					// args1.put("address", track_add2);
					// args1.put("wait_time", track_wait_date);
					// args1.put("wait_time_s", track_wait_dates);
					//
					// database = sqlitewraper.getDatabase();
					// long temp1 = database.insert("location_log", null,
					// args1);

					ContentValues args = new ContentValues();
					args.put("cellid", address);
					args.put("lat", String.valueOf(lat));
					args.put("date", date1);
					args.put("date_s", date_s);
					args.put("lon", String.valueOf(lon));
					args.put("provider", provider);
					args.put("accuracy", String.valueOf(acc));
					args.put("IS_SEND", 0);
					args.put("IS_LOC", time);
					args.put("address", address);
					args.put("wait_time", track_wait_date);
					args.put("wait_time_s", track_wait_dates);
					args.put("username", username);
                    //lac column is use for check the trip status
					// true means trip start false means trip not start (10-01-2024)
					args.put("lac",DeviceEventsUtils.tripStatus());
					long temp = database.insert("location_log", null, args);
					Intent location = new Intent(sqlitewraper.context,
							location_server.class);

					WakefulIntentService.sendWakefulWork(sqlitewraper.context,
							location);

				}

				else {
					// update_appsate(track_id);

				}
			}
		}
	}

	String add(double lat, double lon) {
		String address = null;
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
		return address;
	}

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

}