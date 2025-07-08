package com.sky.atc.easyformse;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;
import org.apache.cordova.PluginResult.Status;
import org.json.JSONArray;
import org.json.JSONException;

import android.content.BroadcastReceiver;
import android.content.Intent;
import android.os.Bundle;

import io.michaelrocks.paranoid.Obfuscate;

/**
 * @author Tommy-Carlos Williams, Huge chunks lifted/adapted from the
 *         NextworkManager core PhoneGap plugin
 */

//To show route between user and site
@Obfuscate
public class map extends CordovaPlugin {

	public static final String TYPE_NONE = "NONE";
	private static final String LOG_TAG = "PhoneListener";

	private String phoneListenerCallbackId;

	BroadcastReceiver receiver;

	public CallbackContext callbackContext;

	@Override
	public boolean execute(String action, JSONArray args,
			CallbackContext callbackContext) throws JSONException {
		this.callbackContext = callbackContext;

		if (sqlitewraper.internetflag == 0) {
			// internet is off
			callbackContext.sendPluginResult(new PluginResult(Status.ERROR));
		}
		else{
			// internet is on
			if (action.equals("anAction")) {
				String user_lat = args.getJSONObject(0).getString("user_lat");
				String user_long = args.getJSONObject(0).getString("user_long");
				String site_lat = args.getJSONObject(0).getString("site_lat");
				String site_long = args.getJSONObject(0).getString("site_long");

				Intent intent = new Intent(this.cordova.getActivity(),
						navigation.class);

				Bundle data = new Bundle();
				data.putString("user_lat", user_lat);
				data.putString("user_long", user_long);

				data.putString("site_lat", site_lat);
				data.putString("site_long", site_long);
				intent.putExtras(data);
				if (this.cordova != null) {
					this.cordova.startActivityForResult(this, intent, 0);
					return true;
				}
			}
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