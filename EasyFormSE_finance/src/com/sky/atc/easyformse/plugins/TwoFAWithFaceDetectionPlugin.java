package com.sky.atc.easyformse.plugins;

import static com.sky.atc.easyformse.sqlitewraper.context;

import android.app.Activity;
import android.content.Intent;
import com.sky.atc.easyformse.FaceDetactionActivity;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;

public class TwoFAWithFaceDetectionPlugin  extends CordovaPlugin {

    CallbackContext callbackContext;
    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        this.callbackContext = callbackContext;


        try{
            Intent faceRecognizerActivityIntent = new Intent(context, FaceDetactionActivity.class);
            faceRecognizerActivityIntent.putExtra("Is2FA", "true");
            this.cordova.startActivityForResult(this, faceRecognizerActivityIntent, 1002);
            return true;

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
        if(requestCode == 1002) {
            if (resultCode == Activity.RESULT_OK) {

                try {
                    this.callbackContext.success("success");
                } catch (Exception e) {
                    this.callbackContext.error(e.toString());
                }
            }
            else {
                this.callbackContext.error("");
            }
        }
    }


}
