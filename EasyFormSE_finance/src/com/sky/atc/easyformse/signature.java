package com.sky.atc.easyformse;


import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.SharedPreferences.Editor;
import android.os.Bundle;

import com.sky.atc.easyformse.datautils.MySharedPreferences;

import io.michaelrocks.paranoid.Obfuscate;

import static android.content.Context.MODE_PRIVATE;


//plugin for capturing signature
@Obfuscate
public class signature extends CordovaPlugin {

	public static final String TYPE_NONE = "NONE";
	BroadcastReceiver receiver;
	public CallbackContext callbackContext;
	MySharedPreferences pref;
//	Editor editor;

	@Override
	public boolean execute(String action, JSONArray args,
			CallbackContext callbackContext) throws JSONException {
		
		//to save storage key and value
		pref = sqlitewraper.getSecureShared("MyPref");

		/////////

		this.callbackContext = callbackContext;

		if (action.equals("anAction")) {
			Intent intent = new Intent(this.cordova.getActivity(),
					CaptureSignature.class);
			if (this.cordova != null) {
				this.cordova.startActivityForResult(this, intent, 0);
				return true;
			}
		}
		return false;
	}
	public void onActivityResult(int requestCode, int resultCode, Intent intent) {
		switch (requestCode) {
		case 0:
			// retour de la version utilisant le sample de imense alpr
			try {
				if (resultCode == android.app.Activity.RESULT_OK) { // 0:ok
					Bundle bundle = intent.getExtras();
					String status = bundle.getString("status");

					pref.putString("photo_path", status); // Saving string
					pref.commit(); // commit changes

					this.callbackContext.success(status);
				} else {
					String message = intent.getStringExtra("result");
					this.callbackContext.error(message);
				}
			}catch (Exception e){
				DeviceEventsUtils.isFinishActivitiesOptionEnabled(sqlitewraper.context);
			}
			break;
		default:
			break;
		}
	}
}