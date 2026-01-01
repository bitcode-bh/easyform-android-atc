package com.sky.atc.easyformse;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.TimeUnit;

import android.app.ActivityManager;
import android.app.Notification;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.location.Address;
import android.location.Geocoder;
import android.location.Location;
import android.os.Build;
import android.os.Bundle;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.widget.Toast;

import com.commonsware.cwac.wakeful.WakefulIntentService;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.trip.LocationOutageUtils;
import com.sky.atc.easyformse.trip.SpeedViolation;
import com.sky.atc.easyformse.trip.TripMapUtils;

import net.sqlcipher.database.SQLiteDatabase;

import commonsware.cwac.LocationPoller;
import com.github.megatronking.stringfog.annotation.StringFogIgnore;

@StringFogIgnore
public class loc_change extends WakefulIntentService {
	SQLiteDatabase database;
	Long time;
	Location loc;
	String tripflag;
	Long fusedtime;
	// location distance meter value
	int meterdistancevalue = 300;
	static ArrayList<Long> arrayList = new ArrayList<>();
	public loc_change() {
		super("loc_change");
		// TODO Auto-generated constructor stub
	}

	@Override
	protected void doWakefulWork(Intent arg0) {

		try {
			database = sqlitewraper.getDatabase();

			Bundle b = arg0.getExtras();
			loc = b.getParcelable("loc");
			String add = b.getString("address");

			//tripflag 2= fused location  1=gps location
			tripflag = b.getString("tripflag");
			time = Long.valueOf(b.getString("time"));

			//if loc is null (that will not happen)
			if (loc == null) {

				database = sqlitewraper.getDatabase();
				Cursor a_t = database.rawQuery(
						"select value from APP_states where ITEAM ='count'",
						null);
				a_t.moveToFirst();
				String j = a_t.getString(0);

				a_t.close();

				if (j.equalsIgnoreCase("0")) {

					Intent i = new Intent(sqlitewraper.context,
							LocationPoller.class);
					i.putExtra(LocationPoller.EXTRA_INTENT, new Intent(
							sqlitewraper.context,
							LocationReceiver_network.class));
					i.putExtra("intent", "fused");
					sqlitewraper.context.sendBroadcast(i);
					update_appsate("1", "count");
				}

			} else {
				update_appsate("1", "count");

				database = sqlitewraper.getDatabase();

				Cursor a_t = database.rawQuery(
						"select value from APP_states where ITEAM ='nick'",
						null);
				a_t.moveToFirst();
				String username = null;
				if (a_t.getCount() > 0) {
					username = a_t.getString(0);
				}
				a_t.close();

				if (!username.equalsIgnoreCase("0")) {

					Date now = new Date();

					String Date = now.toString();

					Double lat = loc.getLatitude();
					Double lon = loc.getLongitude();
					Float accuracy = loc.getAccuracy();
					String provider = loc.getProvider();
					String address = add;
					String speed = String.valueOf(loc.getSpeed());

					long locatiiontime=loc.getTime();

					//Nisarg- Change Logic
					powersavingmode(provider);

					//to insert location into track_master
					chk_insert1(Float.parseFloat(DeviceEventsUtils.LatlngRoundff(String.valueOf(lat))),
							Float.parseFloat(DeviceEventsUtils.LatlngRoundff(String.valueOf(lon))),
							loc.getAccuracy(), provider, time.toString(), Date,
							username, speed,locatiiontime);

					//to insert location into location_log
					//temporary call to server is closed as per suggestion
					chk_insert(Float.parseFloat(DeviceEventsUtils.LatlngRoundff(String.valueOf(lat))),
							Float.parseFloat(DeviceEventsUtils.LatlngRoundff(String.valueOf(lon))),
							loc.getAccuracy(), provider, time.toString(), Date,
							username, speed);
				}

				try {
					database = sqlitewraper.getDatabase();
				} catch (Exception e) {

				}

			}

		} catch (Exception e) {
			e.printStackTrace();
			// TODO: handle exception
		}

	}

	void chk_insert(float lat, float lon, float acc, String provider,
			String date1, String date_s, String username, String speed) {

		Date now = new Date();
		database = sqlitewraper.getDatabase();
		time = now.getTime();
		Cursor check_location = database
				.rawQuery(
						"SELECT lat,lon,address,accuracy,date,date_s,username  FROM  location_log WHERE   _id = (SELECT MAX(_id) FROM location_log where username='"
								+ username + "');", null);
		check_location.moveToFirst();

		//insert location for the first time
		if (check_location.getCount() == 0) {

			// String address = add(Double.valueOf(lat), Double.valueOf(lon));
			String address = AddressApi.getCompleteAddress(lat, lon);
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
			args.put("speed", speed);
			//lac column is use for check the trip status
			//true means trip start false means trip not start (10-01-2024)
			args.put("lac",DeviceEventsUtils.tripStatus());

			database = sqlitewraper.getDatabase();
			if (TripMapUtils.MOCKLOCATION.equalsIgnoreCase("false")) {
				if (sqlitewraper.isMockAvailable) {
					new Handler(Looper.getMainLooper()).post(new Runnable() {
						public void run() {
							Toast toast = Toast.makeText(sqlitewraper.context, "You are using fake location! Please turn off your fake location and restart your device GPS.", Toast.LENGTH_SHORT);
							toast.show();
						}
					});
				}
				else {
					long temp = database.insert("location_log", null, args);
				}
			}
			else {
				long temp = database.insert("location_log", null, args);
			}


			Intent location = new Intent(sqlitewraper.context,
					location_server.class);

			WakefulIntentService
					.sendWakefulWork(sqlitewraper.context, location);


		} else {


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

			String accuracy12 = check_location.getString(3);
			String date = check_location.getString(4);

			Float acc_new = Float.valueOf(acc);
			Float acc_old = Float.valueOf(accuracy12);

			// upload separate location (no relation with trip location)
			//insert location if previous location 10 mini old or accurcy is higher
			float diff = Float.valueOf(time.toString()) - (Float.valueOf(date));
			if ((diff > 600000) || ((acc_old / 4) > acc_new)) {
//				String address = add(Double.valueOf(lat), Double.valueOf(lon));
				String address = AddressApi.getCompleteAddress(Double.valueOf(lat), Double.valueOf(lon));
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
				args.put("speed", speed);
				//lac column is use for check the trip status
				// true means trip start false means trip not start (10-01-2024)
				args.put("lac",DeviceEventsUtils.tripStatus());
				database = sqlitewraper.getDatabase();
				if (TripMapUtils.MOCKLOCATION.equalsIgnoreCase("false")) {
					if (sqlitewraper.isMockAvailable) {
						new Handler(Looper.getMainLooper()).post(new Runnable() {
							public void run() {
								Toast toast = Toast.makeText(sqlitewraper.context, "You are using fake location! Please turn off your fake location and restart your device GPS.", Toast.LENGTH_SHORT);
								toast.show();
							}
						});
					}
					else {
						long temp = database.insert("location_log", null, args);
					}
				}
				else {
					long temp = database.insert("location_log", null, args);
				}


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

				//insert if the distance is more than 80 meter
				if (distance > (Float.valueOf(accuracy1) + acc + meterdistancevalue)) {
					System.out.print("Enter");
//					String address = add(lat, lon);
					String address = AddressApi.getCompleteAddress(lat, lon);

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
					args.put("speed", speed);
					//lac column is use for check the trip status
					// true means trip start false means trip not start (10-01-2024)
					args.put("lac",DeviceEventsUtils.tripStatus());
					if (TripMapUtils.MOCKLOCATION.equalsIgnoreCase("false")) {
						if (sqlitewraper.isMockAvailable) {
							new Handler(Looper.getMainLooper()).post(new Runnable() {
								public void run() {
									Toast toast = Toast.makeText(sqlitewraper.context, "You are using fake location! Please turn off your fake location and restart your device GPS.", Toast.LENGTH_SHORT);
									toast.show();
								}
							});
						}
						else {
							long temp = database.insert("location_log", null, args);
						}
					}
					else {
						long temp = database.insert("location_log", null, args);
					}



				}
				//temporary call to server is closed as per suggestion
				Intent location = new Intent(sqlitewraper.context,
						location_server.class);
				WakefulIntentService.sendWakefulWork(sqlitewraper.context,
						location);
			}
			check_location12.close();
			check_location.close();
		}

	}



	//to insert location into track
	void chk_insert1(float lat, float lon, float acc, String provider,
					 String date1, String date_s, String username, String speed, long locatiiontime) {

		Date now = new Date();
		database = sqlitewraper.getDatabase();
		Cursor check_location = database
				.rawQuery(
						"SELECT lat,lon,address,accuracy,date,date_s,username  FROM  track_master WHERE   _id = (SELECT MAX(_id) FROM track_master where tripflag='"+tripflag+"'"+");",
						null);
		check_location.moveToFirst();

		//insert location for the first time
		if (check_location.getCount() == 0) {

			// String address = add(Double.valueOf(lat), Double.valueOf(lon));
			String address = AddressApi.getCompleteAddress(lat, lon);
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
			args.put("accuracy",acc);
			args.put("IS_SEND", 0);
			args.put("IS_LOC", time);
			args.put("address", address);
			args.put("username", username);
			args.put("speed", speed);
			args.put("tripflag", tripflag);
			args.put("locationtime", locatiiontime);

			database = sqlitewraper.getDatabase();

			if (TripMapUtils.MOCKLOCATION.equalsIgnoreCase("false")) {
				if (sqlitewraper.isMockAvailable) {
					new Handler(Looper.getMainLooper()).post(new Runnable() {
						public void run() {
							Toast toast = Toast.makeText(sqlitewraper.context, "You are using fake location! Please turn off your fake location and restart your device GPS.", Toast.LENGTH_SHORT);
							toast.show();
						}
					});
				}
				else {
					long temp = database.insert("track_master", null, args);
				}
			}
			else {
				long temp = database.insert("track_master", null, args);
			}


			//Device status IMEI master upload to show that device is still connected
			Intent z_n12 = new Intent(sqlitewraper.context,
					touch_server.class);
			WakefulIntentService.sendWakefulWork(sqlitewraper.context,
					z_n12);


		} else {


			Cursor check_location12 = database
					.rawQuery(
							"SELECT _id,lat,lon,address,accuracy,date,date_s  FROM  track_master  WHERE _id = (SELECT MAX(_id) FROM track_master where tripflag='"+tripflag+"'"+");",
							null);
			check_location12.moveToFirst();

			String accuracy12 = check_location.getString(3);
			String date = check_location.getString(4);

			float acc_new = acc;
			float acc_old = Float.parseFloat(accuracy12);

			// track_matser used for trip location
			//insert location if previous location 10 min old or accurcy is higher
			float diff = Float.parseFloat(time.toString()) - (Float.parseFloat(date));
			if ( (diff > 600000) || ((acc_old / 4) > acc_new)) {

//				String address = add(Double.valueOf(lat), Double.valueOf(lon));
				String address = AddressApi.getCompleteAddress(lat, lon);
				ContentValues args = new ContentValues();
				args.put("cellid", address);
				args.put("lat", String.valueOf(lat));
				args.put("date", date1);
				args.put("date_s", date_s);
				args.put("lon", String.valueOf(lon));
				args.put("provider", provider);
				args.put("accuracy",acc);
				args.put("IS_SEND", 0);
				args.put("IS_LOC", time);
				args.put("address", address);

				args.put("username", username);
				args.put("speed", speed);

				args.put("tripflag", tripflag);
				args.put("locationtime", locatiiontime);

				database = sqlitewraper.getDatabase();
				if (TripMapUtils.MOCKLOCATION.equalsIgnoreCase("false")) {
					if (sqlitewraper.isMockAvailable) {
						new Handler(Looper.getMainLooper()).post(new Runnable() {
							public void run() {
								Toast toast = Toast.makeText(sqlitewraper.context, "You are using fake location! Please turn off your fake location and restart your device GPS.", Toast.LENGTH_SHORT);
								toast.show();
							}
						});
					}
					else {
						long temp = database.insert("track_master", null, args);
					}
				}
				else {
					long temp = database.insert("track_master", null, args);
				}


				System.out.print("out");
			}

			else {

				String lat_cal = check_location12.getString(1);
				String lon_cal = check_location12.getString(2);

				final int R = 6371; // Radius of the earth

				double latDistance = deg2rad((Double.parseDouble(lat_cal))
						- ((double) (lat)));
				double lonDistance = deg2rad((Double.parseDouble(lon_cal))
						- (double) (lon));
				double a = Math.sin(latDistance / 2)
						* Math.sin(latDistance / 2)
						+ Math.cos(deg2rad(Double.parseDouble(lat_cal)))
						* Math.cos(deg2rad((double) (lat)))
						* Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
				double dist_m = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
				double distance = R * dist_m * 1000; // convert to

				//insert if the location is 80 meter or more
				if (distance >  acc + meterdistancevalue)
				{
					System.out.print("Enter");

					String address = "";

					ContentValues args = new ContentValues();
					args.put("cellid", address);
					args.put("lat", String.valueOf(lat));
					args.put("date", date1);
					args.put("date_s", date_s);
					args.put("lon", String.valueOf(lon));
					args.put("provider", provider);
					args.put("accuracy", acc);
					args.put("IS_SEND", 0);
					args.put("IS_LOC", time);
					args.put("address", address);

					args.put("username", username);
					args.put("speed", speed);
					args.put("tripflag", tripflag);
					args.put("locationtime",locatiiontime);

					if (TripMapUtils.MOCKLOCATION.equalsIgnoreCase("false")) {
						if (sqlitewraper.isMockAvailable) {
							new Handler(Looper.getMainLooper()).post(new Runnable() {
								public void run() {
									Toast toast = Toast.makeText(sqlitewraper.context, "You are using fake location! Please turn off your fake location and restart your device GPS.", Toast.LENGTH_SHORT);
									toast.show();
								}
							});
						}
						else {
							long temp = database.insert("track_master", null, args);
						}
					}
					else {
						long temp = database.insert("track_master", null, args);
					}

					//for speed violation calculation
                    SpeedViolation.onSpeedViolationOccured(Float.parseFloat(speed),lat,lon,provider,tripflag,acc,date1);
                    //Broadcast Location update in TripMapBackgroundActivity.java
					LocationOutageUtils.sendLocationToBackgrounMap(lat,lon);

				}

				//temporary call to server is closed as per suggestion

				//for new trip related task
				String unique_trip_id = "";
				MySharedPreferences prefs = sqlitewraper.getSecureShared("MY_TRIP");
				String restoredText = prefs.getString("tid", null);
				if (restoredText != null) {
					unique_trip_id = prefs.getString("unique_trip_id", "");//"No name defined" is the default value.
				}

				long last_upload_ms = 0;
				String etaflag = "";
				Cursor c3 = database
						.rawQuery(
								"select last_upload_ms,etaflag from lat_plug where  unique_trip_id='"
										+ unique_trip_id+"'", null);
				c3.moveToFirst();
				int count3 = c3.getCount();

				if (count3 > 0) {
					for (int i = 0; i < c3.getCount(); i++) {
						last_upload_ms = Long.parseLong(c3.getString(0));
						etaflag =c3.getString(1);
					}
				}
				c3.close();

				//to check if trip service is running or not
				long nowmilliseconds = System.currentTimeMillis();


				if (nowmilliseconds - last_upload_ms > 300000) {

					boolean check2 = isMyServiceRunning(sqlitewraper.context,
							TripService.class.getName());
					if (!check2) {
						//temporary close for ETA
						if (etaflag.equalsIgnoreCase("true")) {
							Intent tripservice = new Intent(sqlitewraper.context,
									TripService.class);
							WakefulIntentService.sendWakefulWork(sqlitewraper.context,
									tripservice);
						}
					} else {

						Log.d("##TripserviceCall","service already running");
					}
				}
			}
			check_location12.close();
			check_location.close();
		}
	}
	private boolean isMyServiceRunning(Context context, String Myservice) {
		ActivityManager manager = (ActivityManager) context
				.getSystemService(Context.ACTIVITY_SERVICE);
		for (ActivityManager.RunningServiceInfo service : manager
				.getRunningServices(Integer.MAX_VALUE)) {
			if (Myservice.equals(service.service.getClassName())) {

				return true;
			}
		}
		return false;
	}

	private double deg2rad(double deg) {
		return (deg * Math.PI / 180.0);
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
				////e.printStackTrace();

			}

		}
		return address;
	}

	public void sendalert(){
		Notification notification = new NotificationCompat.Builder(sqlitewraper.context, "channel01")
				.setSmallIcon(android.R.drawable.ic_dialog_info)
				.setContentTitle("Power Saving Mode")
				.setContentText("Please Disable Power Saving Mode")
				.setPriority(NotificationCompat.PRIORITY_HIGH)   // heads-up
				.build();

		NotificationManagerCompat notificationManager1 = NotificationManagerCompat.from(sqlitewraper.context);
		notificationManager1.notify(505, notification);
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


	//to check if power saving mode activated or not
	public void powersavingmode(String provider){

		if(provider.equalsIgnoreCase("fused")){

			fusedtime = System.currentTimeMillis();
			if(arrayList.size() >= 2){
				arrayList.remove(1);
				arrayList.add(fusedtime);

				Long starttime  = arrayList.get(0);
				Long endtime = arrayList.get(1);

				long timediff = endtime - starttime;
				long minutes = TimeUnit.MILLISECONDS.toMinutes(timediff);
				powersavingcalculation(minutes,starttime,endtime);
			}else {
				arrayList.add(fusedtime);
			}

		}

		if(provider.equalsIgnoreCase("gps")){

			if(arrayList.size() >= 2){
				Long starttime  = arrayList.get(0);
				Long endtime = arrayList.get(1);

				long timediff = endtime - starttime;

				long minutes = TimeUnit.MILLISECONDS.toMinutes(timediff);

				powersavingcalculation(minutes,starttime,endtime);

			}
			arrayList.clear();
		}
	}

	public void powersavingcalculation(long timediff,long starttime,long endtime){

		if(timediff > 60){
			boolean isInserted = DeviceEventsUtils.insertIntoEvents(String.valueOf(starttime), String.valueOf(endtime), String.valueOf(timediff), "PowerSavingMode");

			if(isInserted){
				sendalert();
			}
			arrayList.clear();
		}

	}


}