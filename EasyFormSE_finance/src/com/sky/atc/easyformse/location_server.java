package com.sky.atc.easyformse;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;

import org.apache.http.HttpEntity;
import org.apache.http.client.ClientProtocolException;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.DefaultHttpClient;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.ContentValues;
import android.content.Intent;
import android.database.Cursor;
import net.sqlcipher.database.SQLiteDatabase;

import android.location.Address;
import android.location.Geocoder;
import android.net.Uri;
import android.provider.MediaStore;
import androidx.core.app.ActivityCompat;

import com.commonsware.cwac.wakeful.WakefulIntentService;
import com.sky.atc.easyformse.datautils.MySharedPreferences;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

@StringFogIgnore
public class location_server extends WakefulIntentService {
	SQLiteDatabase database;
	String lat = null;
	String lng = null;
	String radius = null;
	String fileid = null;
	String d_url = null;
	String filename = null, nick;
	Cursor c;
	int p_f, f_f;
	HashMap<String, String> m = new HashMap<String, String>();
	ArrayList<JSONObject> list = new ArrayList<JSONObject>();
	JSONArray jsonArray1 = new JSONArray();

	NewWebservicesCallEasyform NewWebservicesCallEasyform;
	private static final String WCFURL = sqlitewraper.context.getResources().getString(R.string.WCFURL);
	private static final String METHOD_NAME_corner = "Wcf_InsertLocationData";

	long time;
	private static final int TIMEOUT = 520000;
	private boolean isUpload=false;
	MySharedPreferences pref;
	public location_server() {
		super("location_server");
		// TODO Auto-generated constructor stub
	}

	//to upload location log on server location_log
	@Override
	protected void doWakefulWork(Intent arg0) {

		if (sqlitewraper.internetflag == 1) {
			MySharedPreferences prefs = sqlitewraper.getSecureShared("mypre2");
			String companyFeatureid = prefs.getString("authcompanyfid", "0");
			if (companyFeatureid == null || companyFeatureid.equalsIgnoreCase("") || companyFeatureid.equalsIgnoreCase("0")) {

			} else {


				time = System.currentTimeMillis();
				database = sqlitewraper.getDatabase();
				NewWebservicesCallEasyform = new NewWebservicesCallEasyform();

				int tid_n = 0;

				c = database
						.rawQuery(
								"select _id,lat,lon,date,date_s,accuracy,provider,IS_SEND,address,username,speed,lac from location_log where IS_SEND='0'",
								null);

				c.moveToFirst();
				int count = c.getCount();
				if (c.getCount() > 0) {
					for (int i = 0; i < c.getCount(); i++) {
						try {
							int p_flag, f_flag;
							p_f = 0;
							f_f = 0;
							int tid = c.getInt(0);
							tid_n = tid;
							String lat = c.getString(1);
							String lon = c.getString(2);
							String date = c.getString(3);
							String date_s = c.getString(4);
							String accuracy = c.getString(5);
							String provider = c.getString(6);

							pref = sqlitewraper.getSecureShared("MyPref");
							pref.putLong("uploadmilisecond", Long.valueOf(date));
							pref.commit();

							int IS_SEND = c.getInt(7);
							String username = c.getString(9);
							String speed = c.getString(10);
//						String address = add(Double.valueOf(lat), Double.valueOf(lon));
							String address = AddressApi.getCompleteAddress(Double.valueOf(lat), Double.valueOf(lon));

							String is_trip_location = c.getString(11);

							String imei1 = DeviceEventsUtils.getImei();
							try {
								JSONObject ret = getLocationInfo(
										Double.valueOf(lat), Double.valueOf(lon));
								JSONObject add1;
								String location_string = null;

								add1 = ret.getJSONArray("results").getJSONObject(0);

								address = add1.getString("formatted_address");
							} catch (Exception e) {
							}

							if (address == null) {

								try {

									Geocoder gcd = new Geocoder(
											sqlitewraper.context,
											Locale.getDefault());
									List<Address> addresses = gcd.getFromLocation(
											Double.valueOf(lat),
											Double.valueOf(lon), 1);
									if (addresses.size() > 0) {
										Address a = addresses.get(0);
										for (int k = 0; k < a
												.getMaxAddressLineIndex(); k++) {
											if (address == null)
												address = a.getAddressLine(k);
											else
												address = address + ","
														+ a.getAddressLine(k);
										}
										address = address + ","
												+ a.getCountryName();
									}

								} catch (Exception e) {
									//e.printStackTrace();

								}

							}

							ArrayList<String> utcmi;
							utcmi = utcCalculationOffset(String.valueOf(time));
							String timezone = utcmi.get(1);
							String utcmilliseconds = utcmi.get(0);


							// ------------------put data in jason----------------//

							JSONObject data1 = new JSONObject();
							data1.put("cellid", imei1);
							data1.put("lat", lat);
							data1.put("username", username);
							data1.put("lon", lon);
							data1.put("date", date);
							data1.put("date_s", date_s);
							data1.put("accuracy", accuracy);
							data1.put("provider", provider);
							data1.put("IS_SEND", IS_SEND);
							data1.put("address", address);
							data1.put("speed", speed);
							data1.put("timezone", timezone);
							data1.put("utcmilliseconds", utcmilliseconds);
							data1.put("is_trip_location", is_trip_location);
							// --------------- put jason
							// auth-----------------------//

							Cursor c3 = database.rawQuery(
									"SELECT username,u_c ,company_id FROM Login_Master where username='"
											+ username + "'", null);
							c3.moveToFirst();
							JSONObject data2 = new JSONObject();
							if (c3.getCount() > 0) {
								String username1 = c3.getString(0);
								B_new b = new B_new();
								String u_c = b.GetValue();
								data2.put("username", username);
								data2.put("u_c", u_c);
							}
							c3.close();


							//temporary call to server is closed as per suggestion
							isUpload = true;

							if (isUpload) {

								String restext = NewWebservicesCallEasyform.ExecuteNetworkHTTPPostRequestfile(data1, WCFURL, METHOD_NAME_corner, data2);

								JSONArray jsonArray = new JSONArray(restext);
								String status1 = null;
								for (int k1 = 0; k1 < jsonArray.length(); k1++) {
									JSONObject jsonObject = jsonArray.getJSONObject(0);
									status1 = jsonObject.getString("status");
								}
								if (status1.equalsIgnoreCase("1")) {
									{
										String t;
										t = "_id='" + tid + "'";
										ContentValues t_i = new ContentValues();
										t_i.put("IS_SEND", 1);
										long task = database.update("location_log",
												t_i, t, null);
										task++;
										c.moveToNext();
									}
								}


							} else {

								String t;
								t = "_id='" + tid + "'";
								ContentValues t_i = new ContentValues();
								t_i.put("IS_SEND", 1);
								long task = database.update("location_log",
										t_i, t, null);
								task++;
								c.moveToNext();
							}

						} catch (Exception e) {
							//e.printStackTrace();

						}
					}
				}
				try {
					c.close();
				} catch (Exception e) {

				}
			}
		}
	}

	public void update(String value) {
		String t1;
		ContentValues args = new ContentValues();
		t1 = "fileid='" + value + "'";
		args.put("is_download", "1");
		database.update("total_file", args, t1, null);
	}

	public String getRealPathFromURI(Uri contentUri) {
		// can post image
		String[] proj = { MediaStore.Images.Media.DATA };
		Cursor cursor = sqlitewraper.context.getContentResolver().query(
				contentUri, proj, // Which columns to
				// return
				null, // WHERE clause; which rows to return (all rows)
				null, // WHERE clause selection arguments (none)
				null); // Order-by clause (ascending by name)
		int column_index = cursor
				.getColumnIndexOrThrow(MediaStore.Images.Media.DATA);
		cursor.moveToFirst();
		return cursor.getString(column_index);
	}

	public String value(String field) {
		try {
			// dbHelper = new MySQLiteHelper(context);
			// database = sqlitewraper.getDatabase();

			Cursor cursor = database.rawQuery(
					"select VALUE from APP_states where ITEAM='" + field + "'",
					null);
			cursor.moveToFirst();
			String t = "";

			t = cursor.getString(0);
			cursor.close();

			return t;
		} catch (Exception e) {
			return "";
		}
	}



	String add(double lat, double lon) {

		String address = null;

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
		return address;

	}

	// --------------------address-------------------------

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

	// ----------------------------No Usage found for below Methods----------------------------------------//

	public void delete(String value) {
		database = sqlitewraper.getDatabase();
		String t1;

		t1 = "fileid='" + value + "'";
		Cursor cursor = database.rawQuery(
				"select fileid,lon,lat,radius from geofence where fileid='"
						+ value + "'", null);
		cursor.moveToFirst();
		int cnt = cursor.getCount();
		if (cnt > 0) {
			long temp = database.delete("geofence", t1, null);
			temp++;
			// geomain g = new geomain();
			// g.onUnregisterGeofence1Clicked(value);

		}
		Cursor cursor1 = database.rawQuery(
				"select fileid,d_url,filename from total_file where fileid='"
						+ value + "'", null);
		cursor.moveToFirst();
		int cnt1 = cursor.getCount();
		if (cnt1 > 0) {
			long temp1 = database.delete("total_file", t1, null);
			temp1++;
		}
	}
	public ArrayList utcCalculationOffset(String millisecond){

		ArrayList<String> arrayList=new ArrayList<>();

		long milliseconds = Long.parseLong(millisecond);

		Calendar rightNow = Calendar.getInstance();

		long offset = rightNow.get(Calendar.ZONE_OFFSET) +
				rightNow.get(Calendar.DST_OFFSET);

		long utcmilliseconds=milliseconds-offset;
		long zoneOffset =rightNow.get(Calendar.ZONE_OFFSET);

		String timezone= String.valueOf((zoneOffset));
		arrayList.add(String.valueOf(utcmilliseconds));
		arrayList.add(timezone.toString());
		return arrayList;
	}
	
}