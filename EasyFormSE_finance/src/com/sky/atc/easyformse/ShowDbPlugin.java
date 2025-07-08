package com.sky.atc.easyformse;

import android.content.Intent;
import android.os.Bundle;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;

import io.michaelrocks.paranoid.Obfuscate;


//plugin to show Database class
@Obfuscate
public class ShowDbPlugin extends CordovaPlugin {
    public CallbackContext callbackContext;

    ShowDbPlugin context;

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        this.callbackContext = callbackContext;
        context=this;

        Intent intent = new Intent(this.cordova.getActivity(), TabActivity.class);
        if (this.cordova != null) {
            this.cordova.startActivityForResult(this, intent,101);
            return true;
        }

        return false;
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent intent) {
        switch (requestCode) {
            case 101:
                if (resultCode == android.app.Activity.RESULT_OK) { // 0:ok
                    Bundle bundle = intent.getExtras();
                    String status = bundle.getString("result");
                    this.callbackContext.success(status);
                }

                else {
                    String message = "error";
                    this.callbackContext.error(message);
                }
        }
    }
}
