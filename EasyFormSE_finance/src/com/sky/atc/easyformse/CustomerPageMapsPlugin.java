package com.sky.atc.easyformse;

import android.content.Intent;
import android.os.Bundle;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;

import io.michaelrocks.paranoid.Obfuscate;

/**
 * Created by Chetan Patel on 26-Aug-16.
 */
@Obfuscate
public class CustomerPageMapsPlugin extends CordovaPlugin {

    public CallbackContext callbackContext;

    CustomerPageMapsPlugin context;

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {

        this.callbackContext = callbackContext;
        context=this;

        String site_lat=args.getJSONObject(0).getString("site_lat");
        String site_lng=args.getJSONObject(0).getString("site_long");
        String imeino=args.getJSONObject(0).getString("IMEI");
        String company_id =args.getJSONObject(0).getString("Company_Id");
        String username=args.getJSONObject(0).getString("Username");
        String selected_sitename=args.getJSONObject(0).getString("Customer_Unique");
        String siteid=args.getJSONObject(0).getString("siteid");
        String device_lat=args.getJSONObject(0).getString("Device_Lat");
        String device_lng=args.getJSONObject(0).getString("Device_long");
        String radius=args.getJSONObject(0).getString("Radius");
        String Accuracy=args.getJSONObject(0).getString("Accuracy");
        String supportDetailsst=args.getJSONObject(0).getString("Support_Details");


        Intent intent = new Intent(this.cordova.getActivity(),CustomerPageMapsActivity.class);
        intent.putExtra("site_lat", site_lat);
        intent.putExtra("site_lng", site_lng);
        intent.putExtra("Device_Lat", device_lat);
        intent.putExtra("Device_long", device_lng);
        intent.putExtra("IMEI", imeino);
        intent.putExtra("Company_Id", company_id);
        intent.putExtra("Username", username);
        intent.putExtra("Customer_Unique", selected_sitename);
        intent.putExtra("siteid", siteid);
        intent.putExtra("Radius", radius);
        intent.putExtra("Accuracy", Accuracy);
        intent.putExtra("Support_Details", supportDetailsst);





        if (this.cordova != null) {
            this.cordova.startActivityForResult(this, intent,101);
            return true;
        }
        return false;
    }
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
