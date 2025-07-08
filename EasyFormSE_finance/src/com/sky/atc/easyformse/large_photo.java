package com.sky.atc.easyformse;

import android.content.BroadcastReceiver;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.SharedPreferences.Editor;
import android.os.Bundle;
import android.os.Environment;

import com.sky.atc.easyformse.datautils.MySharedPreferences;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;

import java.io.File;

import io.michaelrocks.paranoid.Obfuscate;

import static android.content.Context.MODE_PRIVATE;

/**
 * @author Tommy-Carlos Williams, Huge chunks lifted/adapted from the
 *         NextworkManager core PhoneGap plugin
 */

//plugin to browse files
@Obfuscate
public class large_photo extends CordovaPlugin {

	public static final String TYPE_NONE = "NONE";
	private static final String LOG_TAG = "PhoneListener";

	private String phoneListenerCallbackId;

	BroadcastReceiver receiver;

	public CallbackContext callbackContext;
	MySharedPreferences pref;
//	Editor editor;
	String mobExt;
	String info;
	String max_file_size;
	String allow_multiple_image;
	@Override
	public boolean execute(String action, JSONArray args,
			CallbackContext callbackContext) throws JSONException {

		String query = args.getJSONObject(0).getString("data");
		String b_write = args.getJSONObject(0).getString("flag");

		// //to save storage key and value
		pref = sqlitewraper.getSecureShared("MyPref");
//		editor = pref.edit();
		// /////////

		 String width=args.getJSONObject(0).getString("width");
		 String height=args.getJSONObject(0).getString("height");
		 String quality=args.getJSONObject(0).getString("quality");
		 String docpick=args.getJSONObject(0).getString("p");

		try {
			info = args.getJSONObject(0).getString("info");
//            if array null info string set blank
			if (info.equalsIgnoreCase("[]")) {
				info = "";
			}
		} catch (Exception e) {
			info = "";
		}

		try{
			max_file_size =args.getJSONObject(0).getString("max_file_size");
		}
		catch (Exception e)
		{
			max_file_size ="5";
		}

		try{
			allow_multiple_image = args.getJSONObject(0).getString("allow_multiple_image");
		}
		catch (Exception e)
		{
			allow_multiple_image = "false";
		}

		try {
			if (docpick.equals("2")){

				//Mime Type JSON
				if (args.getJSONObject(0).has("mob_ext")){

					mobExt =args.getJSONObject(0).getString("mob_ext");
				}else {

					mobExt ="";
				}
			}
		}catch (Exception e){

			//e.printStackTrace();
		}


		this.callbackContext = callbackContext;

		Intent intent = new Intent(this.cordova.getActivity(),
				upload_large_file.class);
		intent.putExtra("jason", query);
		intent.putExtra("b_write", b_write);
		intent.putExtra("width", width);
		intent.putExtra("height", height);
		intent.putExtra("quality", quality);
		intent.putExtra("p",docpick);
		intent.putExtra("mob_ext",mobExt);
		intent.putExtra("info",info);
		intent.putExtra("max_file_size",max_file_size);
		intent.putExtra("allow_multiple_image",allow_multiple_image);
		
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
				// pref.getString("key_name5", null); // getting String
				System.out.println("photo_path" + status);
				this.callbackContext.success(status);
			} else {
				if(intent != null)
				{
					String message = intent.getStringExtra("result");
					this.callbackContext.error(message);
				}

			}

			break;
		default:
			break;
		}
	}
}
