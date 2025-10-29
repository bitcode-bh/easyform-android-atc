package com.sky.atc.easyformse.plugins;


import android.app.Activity;
import android.content.Intent;

import com.sky.atc.easyformse.EditPhotoActivity;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;


public class EditPhotoplugin extends CordovaPlugin {

    private static final String TAG = "EditPhotoplugin";
    CallbackContext callbackContext;
    String photo_path;
    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        this.callbackContext = callbackContext;

            try{
                photo_path =args.getJSONObject(0).getString("photo_path");
//                photo_path = "/storage/emulated/0/myDirectory/IMG1761537102987.jpeg";

                try {
                    Intent intent = new Intent(cordova.getActivity(), EditPhotoActivity.class);
                    intent.putExtra("photo_path", photo_path);
                    this.cordova.startActivityForResult(this, intent, 101);
                    return true;
                } catch (Exception e) {
                    this.callbackContext.error("error: " + e.toString());
                    return false;
                }
            }
            catch (Exception e)
            {
                this.callbackContext.error("error: " + e.toString());
                return false;
            }


    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent intent) {
        super.onActivityResult(requestCode, resultCode, intent);
        if (resultCode == Activity.RESULT_OK) {
            if (intent.getExtras() != null) {
                try {
                    String photo_path = intent.getExtras().getString("status");
                    this.callbackContext.success(photo_path);
                } catch (Exception e) {
                    this.callbackContext.error("error:  " + e.toString());
                }
            } else {
                this.callbackContext.error("error: intent.getExtras() is null " + intent.getExtras().toString());
            }
        } else {

            if(this.callbackContext != null) {
                this.callbackContext.error("");
            }

        }

    }
}
