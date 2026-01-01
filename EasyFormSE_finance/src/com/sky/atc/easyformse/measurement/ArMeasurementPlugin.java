package com.sky.atc.easyformse.measurement;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;

//import com.easyform.smartmeasure.ui.activitys.MeasureTwoActivity;
import com.hl3hl3.arcoremeasure.ArMeasureActivity;
import com.sky.atc.easyformse.DeviceEventsUtils;
import com.sky.atc.easyformse.sqlitewraper;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.math.BigDecimal;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

//AR measurement plugin to start measurement activity
@StringFogIgnore
public class ArMeasurementPlugin extends CordovaPlugin {

//import com.easyform.smartmeasure.ui.activitys.MeasureTwoActivity;

    public CallbackContext callbackContext;

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {

        this.callbackContext = callbackContext;

        try {
            String measurementType = "m";
            try {
                if (args.getJSONObject(0).has("ar_measurement_type")) {
                    measurementType = args.getJSONObject(0).getString("ar_measurement_type");
                }
                Intent i2 = new Intent(sqlitewraper.context, ArMeasureActivity.class);
                i2.putExtra("mtype", measurementType);
                /*
                Intent i2 = new Intent(sqlitewraper.context, MeasureTwoActivity.class);
                i2.putExtra("mtype", measurementType);
                */
                this.cordova.startActivityForResult(this, i2, 104);
            } catch (Exception e) {
                e.printStackTrace();
            }

        } catch (Exception e) {
            this.callbackContext.error(e.getMessage());
        }
        return true;

    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent intent) {
        super.onActivityResult(requestCode, resultCode, intent);
        if (requestCode == 104) {

            try {
                if (callbackContext != null) {

                    if (resultCode == Activity.RESULT_OK) {
                        Bundle bundle = intent.getExtras();
                        //float distance = bundle.getFloat("distance");
                        String distance = bundle.getString("distance");
                        JSONArray jsonArray= new JSONArray();
                        JSONObject jsonObject= new JSONObject();
                        jsonObject.put("code",distance);
                        jsonArray.put(jsonObject);
                        this.callbackContext.success(jsonArray.toString());

                    } else {
                        this.callbackContext.error("error");
                    }
                } else {

                    DeviceEventsUtils.isFinishActivitiesOptionEnabled(sqlitewraper.context);
                }
            } catch (Exception e) {

                DeviceEventsUtils.isFinishActivitiesOptionEnabled(sqlitewraper.context);
            }
        }
    }
}

