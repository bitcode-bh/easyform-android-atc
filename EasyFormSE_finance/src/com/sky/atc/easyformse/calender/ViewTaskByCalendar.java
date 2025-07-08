package com.sky.atc.easyformse.calender;

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;

import io.michaelrocks.paranoid.Obfuscate;

@Obfuscate
public class ViewTaskByCalendar extends CordovaPlugin {

    public CallbackContext callbackContext;


    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {

        this.callbackContext = callbackContext;

        if (this.cordova != null) {
            try {

                Context context = cordova.getActivity().getApplicationContext();
                Intent intent = new Intent(context, MonthActivtiy.class);
                if (this.cordova != null) {
                    this.cordova.startActivityForResult(this, intent, 0);
                    return true;
                }

//                Intent ii = new Intent("com.easyform.chat");
//                if (this.cordova != null) {
//                    this.cordova.startActivityForResult(this, ii, 0);
//                    return true;
//                }


            } catch (Exception e) {
                e.printStackTrace();
            }
            return true;
        }

//        if (this.cordova != null) {
//            try {
//
//                Intent ii = new Intent("com.easyform.chat");
//                if (this.cordova != null) {
//                    this.cordova.startActivityForResult(this, ii, 0);
//                    return true;
//                }
//
//
//            } catch (Exception e) {
//                e.printStackTrace();
//            }
//            return true;
//        }

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


}