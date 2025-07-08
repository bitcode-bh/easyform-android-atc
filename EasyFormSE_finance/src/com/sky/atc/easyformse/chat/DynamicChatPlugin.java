package com.sky.atc.easyformse.chat;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.widget.Toast;

import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.sqlitewraper;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;

import io.michaelrocks.paranoid.Obfuscate;

//Chat Plugin for call from EasyForm
//
@Obfuscate
public class DynamicChatPlugin extends CordovaPlugin {

    public CallbackContext callbackContext;

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {

        this.callbackContext = callbackContext;

        if (this.cordova != null) {
            try {
                String users = args.getJSONObject(0).getString("users");
                MySharedPreferences sharedPreferences = sqlitewraper.getSecureShared("pre1");
                String chatResponse = sharedPreferences.getString("Chat_Response", "");
                String randomPassword = sharedPreferences.getString("Random_Password", "");
                String occupantsID = sharedPreferences.getString("Occupants_id", "");




                if (!chatResponse.equalsIgnoreCase("")) {

                    Intent ii = new Intent("com.easyform.chat");
                    ii.putExtra("Chat_Response",chatResponse);
                    ii.putExtra("Random_Password",randomPassword);
                    ii.putExtra("Occupants_id",users);

                    if (this.cordova != null) {
                        this.cordova.startActivityForResult(this, ii, 0);
                        return true;
                    }
                }else {
                    showToast("Not a valid chat user");
                    this.callbackContext.error("Error...");
                }


            } catch (Exception e) {
                e.printStackTrace();
            }
            return true;
        }

        return super.execute(action, args, callbackContext);
    }

    public void onActivityResult(int requestCode, int resultCode, Intent intent) {
        switch (requestCode) {
            case 0:
                if (resultCode == android.app.Activity.RESULT_OK) { // 0:ok
                    Bundle bundle = intent.getExtras();
                    String status = bundle.getString("status");
                    this.callbackContext.success(status);

                } else {
                    this.callbackContext.error("Error...");
                }

                break;
            default:
                break;
        }
    }

    private void showToast(final String message){

        new Handler(Looper.getMainLooper()).post(new Runnable() {
            public void run() {
                Toast toast = Toast.makeText(sqlitewraper.context,message, Toast.LENGTH_SHORT);
                toast.show();
            }
        });

    }

}
