package com.sky.atc.easyformse;

import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;

import com.commonsware.cwac.wakeful.WakefulIntentService;

import net.sqlcipher.database.SQLiteDatabase;

import org.json.JSONArray;
import org.json.JSONObject;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

//it will Called when Device event generated
@StringFogIgnore
public class status_server extends WakefulIntentService {

	private SQLiteDatabase database;

	//WCF URL
	private static final String WCFURL = sqlitewraper.context.getResources().getString(R.string.WCFURL);
	private static final String METHOD_NAME_corner = "WCF_InsertDeviceStatusTbl";

	String Code;
	//Use your own client id
	Context context;


	public status_server() {
		super("status_server");
		// TODO Auto-generated constructor stub
	}

	@Override
	protected void doWakefulWork(Intent intent) {
		try {

			database = sqlitewraper.getDatabase();

			database = sqlitewraper.getDatabase();

			if (sqlitewraper.internetflag == 1) {

				//upload diffrent device log to server
				s_row();

			}
		} catch (Exception e) {
			// TODO: handle exception
		}
		// add wake service here//

	}

	void s_row() {
		try {

			database = sqlitewraper.getDatabase();
			Cursor a_t = database
					.rawQuery(
							"select _id,g_ontime,g_offtime,gp_ontime,gp_offtime,phone_on,phone_off,battery,gp_duration,gprs_duration,phone_duration,date,username,appstop,appstart,appduration from gp_total where send='0'",
							null);
			a_t.moveToFirst();
			int j = a_t.getCount();
			j++;
			for (int i = 0; i < a_t.getCount(); i++) {

				int id = a_t.getInt(0);
				String g_ontime = a_t.getString(1);

				String g_offtime = a_t.getString(2);

				String gp_ontime = a_t.getString(3);

				String gp_offtime = a_t.getString(4);

				String phone_on = a_t.getString(5);
				String phone_off = a_t.getString(6);
				String battery = a_t.getString(7);

				String gp_duration = a_t.getString(8);
				String gprs_duration = a_t.getString(9);
				String phone_duration = a_t.getString(10);
				String date = a_t.getString(11);
				String username = a_t.getString(12);
				String appstop = a_t.getString(13);
				String appstart = a_t.getString(14);
				String appduration = a_t.getString(15);

				String imei = DeviceEventsUtils.getImei();
				JSONObject data1 = new JSONObject();
				data1.put("imei", imei);
				data1.put("Gps_On", g_ontime);
				data1.put("Gps_Off", g_offtime);
				data1.put("Gprs_On", gp_ontime);
				data1.put("Gprs_Off", gp_offtime);
				data1.put("Ph_On", phone_on);
				data1.put("Ph_Off", phone_off);
				data1.put("Gps_Duration", gp_duration);
				data1.put("Gprs_Duration", gprs_duration);
				data1.put("Ph_Duration", phone_duration);
				data1.put("Battery_Level", battery);
				data1.put("date", date);
				data1.put("username", username);
				data1.put("appstop", appstop);
				data1.put("appstart", appstart);
				data1.put("appduration", appduration);

				String restext = NewWebservicesCallEasyform.ExecuteNetworkHTTPPostRequestfile(data1, WCFURL, METHOD_NAME_corner, data1);

				String status = null;
				JSONArray jsonArray1 = new JSONArray(restext);
				for (int k = 0; k < jsonArray1.length(); k++) {
					JSONObject jsonObject = jsonArray1.getJSONObject(0);
					status = jsonObject.getString("status");
				}
				if (status !=null) {
					if (status.equalsIgnoreCase("1")) {
						update_gdrive("1", id, "gp_total");
					}
				}

				a_t.moveToNext();
			}
		} catch (Exception e) {
			//e.printStackTrace();
			// TODO: handle exception
		}
	}

	// -------------------------update the row---------------------------//
	void update_gdrive(String value, int ITEAM, String drive) {
		try {
			String t;
			ContentValues args = new ContentValues();
			t = "_id=" + ITEAM;
			args.put("send", value);
			long t1 = database.update(drive, args, t, null);
			t1++;
		} catch (Exception e) {
			System.out.println(e.getMessage());
			// TODO: handle exception
		}
	}

}
