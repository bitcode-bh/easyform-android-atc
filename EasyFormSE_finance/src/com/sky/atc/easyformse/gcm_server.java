package com.sky.atc.easyformse;

import org.json.JSONArray;
import org.json.JSONObject;

import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import net.sqlcipher.database.SQLiteDatabase;

import androidx.core.app.ActivityCompat;

import com.commonsware.cwac.wakeful.WakefulIntentService;

import io.michaelrocks.paranoid.Obfuscate;


//To upload fcm data to server
@Obfuscate
public class gcm_server extends WakefulIntentService {

	private SQLiteDatabase database;

	private static final String METHOD_NAME_corner = "Wcf_InsertGCM";
	NewWebservicesCallEasyform NewWebservicesCallEasyform;
	private static final String WCFURL = sqlitewraper.context.getResources().getString(R.string.WCFURL);


	Context context;


	public gcm_server() {
		super("gcm_server");
		// TODO Auto-generated constructor stub
	}

	@Override
	protected void doWakefulWork(Intent intent) {
		try {

			database = sqlitewraper.getDatabase();
			NewWebservicesCallEasyform = new NewWebservicesCallEasyform();

			database = sqlitewraper.getDatabase();

			if (sqlitewraper.internetflag == 1) {

				s_row();

			}
		} catch (Exception e) {
			// TODO: handle exception
		}
	}


	void s_row() {
		try {

			database = sqlitewraper.getDatabase();
			Cursor a_t = database
					.rawQuery(
							"select _id,gid,username,version,flag,company_id from gcm_server where flag='0' and username!='0' and gid!='0'",
							null);
			a_t.moveToFirst();
			int j = a_t.getCount();
			j++;
			for (int i = 0; i < a_t.getCount(); i++) {

				int id = a_t.getInt(0);
				String gid = a_t.getString(1);

				String username = a_t.getString(2);

				String version = a_t.getString(3);

				String flag = a_t.getString(4);
				int c_id =a_t.getInt(5);

				String imei = DeviceEventsUtils.getImei();
				JSONObject data1 = new JSONObject();
				data1.put("IMEI", imei);
				data1.put("GID", gid);
				data1.put("VERSION", version);
				data1.put("username", username);
				data1.put("CompanyId", c_id);
				data1.put("deviceinfo", DeviceInformation.getDeviceInformation());


				String restext = NewWebservicesCallEasyform.ExecuteNetworkHTTPPostRequest(data1, WCFURL, METHOD_NAME_corner);

				String status = null;
				JSONArray jsonArray1 = new JSONArray(restext);
				for (int k = 0; k < jsonArray1.length(); k++) {
					JSONObject jsonObject = jsonArray1.getJSONObject(0);
					status = jsonObject.getString("status");
				}

				if (status.equalsIgnoreCase("1")) {
					update_gdrive("1", id, "gcm_server");

				}

				a_t.moveToNext();
			}
			cursour_close(a_t);
		} catch (Exception e) {
			// TODO: handle exception
		}
	}

	void update_gdrive(String value, int ITEAM, String drive) {
		try {
			String t;
			ContentValues args = new ContentValues();
			t = "_id=" + ITEAM;
			args.put("flag", value);
			long t1 = database.update(drive, args, t, null);
			t1++;
		} catch (Exception e) {
			System.out.println(e.getMessage());
			// TODO: handle exception
		}
	}

	void cursour_close(Cursor c) {
		try {
			if (c != null){

				c.close();
			}
		} catch (Exception e) {

		}

	}
	

}
