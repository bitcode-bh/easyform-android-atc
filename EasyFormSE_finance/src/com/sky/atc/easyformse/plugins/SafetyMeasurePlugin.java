package com.sky.atc.easyformse.plugins;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.widget.Toast;

import com.sky.atc.easyformse.DeviceEventsUtils;
import com.sky.atc.easyformse.sqlitewraper;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Created by NareshChocha on 4/18/2025.
 *
 * @author NareshChocha
 */
public class SafetyMeasurePlugin extends CordovaPlugin {
    public CallbackContext callbackContext;

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        this.callbackContext = callbackContext;

        try{

            try {
                Intent SafetyMeasure = new Intent(sqlitewraper.context, Class.forName("com.easyform.safetymeasure.automlvision.AutoMlVisonModelActivity"));
                this.cordova.startActivityForResult(this, SafetyMeasure, 101);
                return true;
            } catch (Exception e) {
                Toast.makeText(this.cordova.getActivity(),"SafetyMeasure Module is Not Added",Toast.LENGTH_LONG).show();
                this.callbackContext.error("error: " + e.toString());
                return false;
            }
        }
        catch (Exception e)
        {
            this.callbackContext.error(e.getMessage());
        }

        return true;
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent intent) {
        super.onActivityResult(requestCode, resultCode, intent);
        if (requestCode == 101) {

            try{
                if (callbackContext != null)
                {
                    if (resultCode == Activity.RESULT_OK){
                        Bundle bundle = intent.getExtras();
                        String value = bundle.getString("value");
//String photo_path = bundle.getString("photo_path");
//                        JSONObject jsonObject = new JSONObject();
//                        jsonObject.put("value", value);
                        //  jsonObject.put("photo_path",photo_path);

                        Log.d("####Succces", value);
                        this.callbackContext.success(value);
                    }
                    else {
                        this.callbackContext.error("error");
                        DeviceEventsUtils.isFinishActivitiesOptionEnabled(sqlitewraper.context);
                    }
                }
                else {
                    this.callbackContext.error("error");
                    DeviceEventsUtils.isFinishActivitiesOptionEnabled(sqlitewraper.context);
                }
            }
            catch (Exception e)
            {
                DeviceEventsUtils.isFinishActivitiesOptionEnabled(sqlitewraper.context);

            }

        }

    }
}
