package com.sky.atc.easyformse;

import java.util.ArrayList;
import java.util.LinkedHashMap;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;
import org.apache.cordova.PluginResult.Status;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.commonsware.cwac.wakeful.WakefulIntentService;
import com.sky.atc.easyformse.scanner.barcodeactivity;

import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.ContentValues;
import android.content.Intent;
import net.sqlcipher.database.SQLiteDatabase;
import android.os.Bundle;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

/**
 * @author Tommy-Carlos Williams, Huge chunks lifted/adapted from the
 *         NextworkManager core PhoneGap plugin
 */

//to open scanner plugin application
@StringFogIgnore
public class scanner_plug extends CordovaPlugin {

	public static final String TYPE_NONE = "NONE";
	private static final String LOG_TAG = "PhoneListener";
	PluginResult result = null;
	private String phoneListenerCallbackId;

	BroadcastReceiver receiver;
	SQLiteDatabase database;

	public CallbackContext callbackContext;

	@Override
	public boolean execute(String action, JSONArray args,
			CallbackContext callbackContext) throws JSONException {
		database = sqlitewraper.getDatabase();

		this.callbackContext = callbackContext;
		if (this.cordova != null) {
			try {

//				Intent intent = new Intent(android.content.Intent.ACTION_VIEW);
//				intent.setComponent(new ComponentName("packagename//com.easyform.scanner",
//						"classname//com.example.scanner.MainActivity"));
//				this.cordova.startActivityForResult(this, intent, 101);


				Intent i = new Intent(sqlitewraper.context, barcodeactivity.class);

				if (this.cordova != null) {
					this.cordova.startActivityForResult(this, i, 101);
					return true;
				}

			} catch (Exception e) {
				e.printStackTrace();
			}
			return true;
		}

		return true;
	}

	public void onActivityResult(int requestCode, int resultCode, Intent intent) {
		switch (requestCode) {
		case 101:
			// retour de la version utilisant le sample de imense alpr
			if (resultCode == android.app.Activity.RESULT_OK) {
				ArrayList<JSONObject> list = new ArrayList<JSONObject>();
				JSONObject json;
				Bundle bundle = intent.getExtras();
				String code = bundle.getString("code");

				LinkedHashMap<String, Object> lHashMap = new LinkedHashMap<String, Object>();
				lHashMap.put("code", code);

				json = new JSONObject(lHashMap);
				list.add(json);

				result = new PluginResult(Status.OK);

				callbackContext.sendPluginResult(new PluginResult(
						PluginResult.Status.OK, list.toString()));
			} else {
				// String message = intent.getStringExtra("result");
				this.callbackContext.error("Back Pressed");
			}

			break;
		default:
			break;
		}
	}
}