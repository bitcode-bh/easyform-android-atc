package com.sky.atc.easyformse;

import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.os.Bundle;
import android.os.Environment;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.CompoundButton;
import android.widget.CompoundButton.OnCheckedChangeListener;
import android.widget.ToggleButton;

import androidx.fragment.app.Fragment;

import net.sqlcipher.database.SQLiteDatabase;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.nio.channels.FileChannel;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

//to export DB from tablayout
@StringFogIgnore
public class SecurityFragment extends Fragment {
	ComponentName demoDeviceAdmin;
	ToggleButton toggleButton;
	DevicePolicyManager devicePolicyManager;
	private SQLiteDatabase database;
	String username;
	static final int ACTIVATION_REQUEST = 47;

	@Override
	public View onCreateView(LayoutInflater inflater, ViewGroup container,
			Bundle savedInstanceState) {

		devicePolicyManager = (DevicePolicyManager) sqlitewraper.context
				.getSystemService(Context.DEVICE_POLICY_SERVICE);
		demoDeviceAdmin = new ComponentName(sqlitewraper.context,
				DemoDeviceAdminReceiver.class);
		View rootView = inflater.inflate(R.layout.fragment_security, container,
				false);
		toggleButton = (ToggleButton) rootView
				.findViewById(R.id.toggle_device_admin);

		database = sqlitewraper.getDatabase();
		Cursor a_t2 = database.rawQuery(
				"select VALUE from APP_states where ITEAM='admin'", null);
		a_t2.moveToFirst();
		Cursor c3 = database.rawQuery("SELECT username,u_c FROM Login_Master",
				null);
		c3.moveToLast();
		username = c3.getString(0);
		c3.close();

		String admin = a_t2.getString(0);
		a_t2.close();
		if (admin.equalsIgnoreCase("1")) {

			toggleButton.setChecked(true);

		}

		toggleButton.setOnCheckedChangeListener(new OnCheckedChangeListener() {

			@Override
			public void onCheckedChanged(CompoundButton buttonView,
					boolean isChecked) {

				if (isChecked) {
					// Activate device administration
					Intent intent = new Intent(
							DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN);
					intent.putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN,
							demoDeviceAdmin);
					intent.putExtra(DevicePolicyManager.EXTRA_ADD_EXPLANATION,
							"Your boss told you to do this");
					startActivityForResult(intent, ACTIVATION_REQUEST);

					update_appsate("1", "admin");
//					ContentValues c_upload = new ContentValues();
//					long time = System.currentTimeMillis();
//					c_upload.put("type", "Enable Again");
//					c_upload.put("time", time);
//					c_upload.put("flag", "0");
//					c_upload.put("username", username);
//					long temp = database.insert("upload_file_clone", null,
//							c_upload);
//
//					temp++;

				} else {

					try {
						devicePolicyManager.removeActiveAdmin(demoDeviceAdmin);
						exportDB();
						
						update_appsate("0", "admin");
						long time = System.currentTimeMillis();
						

					} catch (Exception e) {
						//e.printStackTrace();
					}
				}
				// Log.d(TAG, "onCheckedChanged to: " + isChecked);

				// TODO Auto-generated method stub

			}
		});
		return rootView;
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
	
	
	private void exportDB() {
		try {
			File sd = com.sky.atc.easyformse.utils.AppStorage.root();
			File data = Environment.getDataDirectory();

			if (sd.canWrite()) {
				String currentDBPath = "//data//" + BuildConfig.APPLICATION_ID
						+ "//databases//" + "location.db";
				String backupDBPath = "location_back.db";
				File currentDB = new File(data, currentDBPath);
				File backupDB = new File(sd, backupDBPath);

				FileChannel src = new FileInputStream(currentDB).getChannel();
				FileChannel dst = new FileOutputStream(backupDB).getChannel();
				dst.transferFrom(src, 0, src.size());
				src.close();
				dst.close();
				

			}
		} catch (Exception e) {

			

		}
	}
	
}
