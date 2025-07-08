package com.sky.atc.easyformse.plugins;

import android.content.Intent;
import android.os.Bundle;

import com.sky.atc.easyformse.DeviceEventsUtils;
import com.sky.atc.easyformse.GeofencTrackingMapActivity;
import com.sky.atc.easyformse.SupportPageMapsActivity;
import com.sky.atc.easyformse.sqlitewraper;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;

/**
 * Created by NareshChocha on 9/4/2023.
 *
 * @author NareshChocha
 */
public class GeofenceTrackingPlugin extends CordovaPlugin {

    public CallbackContext callbackContext;

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        this.callbackContext = callbackContext;

        try {
            if(this.callbackContext != null)
            {
                Intent intent = new Intent(this.cordova.getActivity(), GeofencTrackingMapActivity.class);
                this.cordova.startActivityForResult(this, intent,0);
                return true;
            }
        }
        catch (Exception e)
        {
            this.callbackContext.error("error");
        }


        return false;

    }


}
