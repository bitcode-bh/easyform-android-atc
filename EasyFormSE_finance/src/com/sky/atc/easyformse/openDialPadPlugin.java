package com.sky.atc.easyformse;


import android.content.Intent;
import net.sqlcipher.database.SQLiteDatabase;
import android.net.Uri;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

//open dialpad
@StringFogIgnore
public class openDialPadPlugin extends CordovaPlugin {





    public CallbackContext callbackContext;
    SQLiteDatabase database;

    @Override
    public boolean execute(String action, JSONArray args,
                           CallbackContext callbackContext) throws JSONException {

        this.callbackContext = callbackContext;
        String mobilenumber = args.getJSONObject(0).getString("mobilenumber");

        if (mobilenumber != null){

            Intent i = new Intent(Intent.ACTION_DIAL);
            i.setData(Uri.parse("tel:"+mobilenumber));

            if (this.cordova != null) {
                this.cordova.startActivityForResult(this, i, 0);
                return true;
            }
        }

            return false;
    }

    public void onActivityResult(int requestCode, int resultCode, Intent intent) {
        switch (requestCode) {
            case 0:
                if (resultCode == android.app.Activity.RESULT_OK) {

                    this.callbackContext.success("Success");

                } else {
                    this.callbackContext.error("Error...");
                }

                break;
            default:
                break;
        }
    }
	
}
