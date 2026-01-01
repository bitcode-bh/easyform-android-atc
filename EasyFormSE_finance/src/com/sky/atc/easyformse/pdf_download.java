package com.sky.atc.easyformse;

import android.content.Intent;

import com.sky.atc.easyformse.datautils.MySharedPreferences;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

/**
 * Created by Mikka on 8/11/2016.
 */

//Plugin to download pdf

@StringFogIgnore
public class pdf_download extends CordovaPlugin {

    public CallbackContext callbackContext;
    MySharedPreferences pref;

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {

        pref = sqlitewraper.getSecureShared("MyPref");
        String path = args.getJSONObject(0).getString("path");
        String name = args.getJSONObject(0).getString("name");
        this.callbackContext = callbackContext;
        Intent intent = new Intent(this.cordova.getActivity(),
                pdf_act.class);

        intent.putExtra("path", path);
        intent.putExtra("name",name);
        if (this.cordova != null) {
            this.cordova.startActivityForResult(this, intent,101);
            return true;
        }
        return false;
    }

    public void onActivityResult(int requestCode, int resultCode, Intent intent) {
        if (requestCode == 101) {
            if (pref != null) {
                try {
                    String ss = pref.getString("pdf_path", "");

                    if (!ss.equals("")) {

                        this.callbackContext.success(ss);
                    } else {
                        String message = "error";
                        this.callbackContext.error(message);
                    }
                } catch (Exception e) {
                    DeviceEventsUtils.isFinishActivitiesOptionEnabled(sqlitewraper.context);
                }
            } else {
                DeviceEventsUtils.isFinishActivitiesOptionEnabled(sqlitewraper.context);
            }
        }
    }
}
