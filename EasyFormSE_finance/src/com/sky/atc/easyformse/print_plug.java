package com.sky.atc.easyformse;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;

import android.content.BroadcastReceiver;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.SharedPreferences.Editor;
import android.os.Bundle;
import android.view.animation.Animation;
import android.view.animation.AnimationUtils;

import com.sky.atc.easyformse.datautils.MySharedPreferences;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

/**
 * @author Tommy-Carlos Williams, Huge chunks lifted/adapted from the
 *         NextworkManager core PhoneGap plugin
 */
@StringFogIgnore
public class print_plug extends CordovaPlugin {

	public static final String TYPE_NONE = "NONE";
	private static final String LOG_TAG = "PhoneListener";

	private String phoneListenerCallbackId;

	BroadcastReceiver receiver;

	public CallbackContext callbackContext;
	MySharedPreferences pref;
//	Editor editor;

	@Override
	public boolean execute(String action, JSONArray args,
			CallbackContext callbackContext) throws JSONException {
		
		String query = args.getJSONObject(0).getString("data");
		
//		//to save storage key and value
//		pref = this.cordova.getActivity().getSharedPreferences(
//				"MyPref", 0);
//		editor = pref.edit();
//		/////////
		
		this.callbackContext = callbackContext;

		
			Intent intent = new Intent(this.cordova.getActivity(),
					printnew.class);
			intent.putExtra("jason", query);
			if (this.cordova != null) {
				this.cordova.startActivityForResult(this, intent, 0);
				return true;
			}
		
		return false;
	}

	public void onActivityResult(int requestCode, int resultCode, Intent intent) {
		switch (requestCode) {
		case 0:
			// retour de la version utilisant le sample de imense alpr
			if (resultCode == android.app.Activity.RESULT_OK) { // 0:ok
				Bundle bundle = intent.getExtras();
				String status = bundle.getString("status");

				pref.putString("photo_path", status); // Saving string
				pref.commit(); // commit changes
				//pref.getString("key_name5", null);          // getting String

				this.callbackContext.success(status);
			} else {
				String message = intent.getStringExtra("result");
				this.callbackContext.error(message);
			}

			break;
		default:
			break;
		}
	}
}