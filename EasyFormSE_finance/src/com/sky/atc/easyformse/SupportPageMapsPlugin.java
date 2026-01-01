package com.sky.atc.easyformse;

import android.content.Intent;
import android.os.Bundle;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

/**
 * Created by Chetan Patel on 26-Aug-16.
 */

//For show site for geofencing when red mark is available
@StringFogIgnore
public class SupportPageMapsPlugin extends CordovaPlugin {

    public CallbackContext callbackContext;

    SupportPageMapsPlugin context;

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {

        this.callbackContext = callbackContext;
        context=this;
//
        String site_lat=args.getJSONObject(0).getString("site_lat");
        String site_lng=args.getJSONObject(0).getString("site_long");
        String company_id =args.getJSONObject(0).getString("Company_Id");
        String username=args.getJSONObject(0).getString("Username");
        String selected_sitename=args.getJSONObject(0).getString("Customer_Unique");
        String server_task_id=args.getJSONObject(0).getString("Task_Id");
        String radius=args.getJSONObject(0).getString("Radius");
        String Accuracy=args.getJSONObject(0).getString("Accuracy");
        String supportDetails=args.getJSONObject(0).getString("Support_Details");
        String geofence_by;
        try{
             geofence_by  = args.getJSONObject(0).getString("geofence_by");
        }
        catch (Exception e)
        {
            geofence_by = "";
        }




        Intent intent = new Intent(this.cordova.getActivity(),SupportPageMapsActivity.class);
        intent.putExtra("site_lat", site_lat);
        intent.putExtra("site_lng", site_lng);

        intent.putExtra("Company_Id", company_id);
        intent.putExtra("Username", username);
        intent.putExtra("Customer_Unique", selected_sitename);
        intent.putExtra("Task_Id", server_task_id);
        intent.putExtra("Radius", radius);
        intent.putExtra("Accuracy", Accuracy);
        intent.putExtra("Support_Details", supportDetails);
        intent.putExtra("geofence_by",geofence_by);



        if (this.cordova != null) {
            this.cordova.startActivityForResult(this, intent,101);
            return true;
        }
         return false;
    }
    public void onActivityResult(int requestCode, int resultCode, Intent intent) {
        switch (requestCode) {
            case 101:
                if (callbackContext!=null) {
                    try {
                        if (resultCode == android.app.Activity.RESULT_OK) { // 0:ok
                            Bundle bundle = intent.getExtras();
                            String status = bundle.getString("result");
                            this.callbackContext.success(status);
                        } else {
                            String message = "error";
                            this.callbackContext.error(message);
                        }
                    } catch (Exception e) {

                    }
                }else {

                    DeviceEventsUtils.isFinishActivitiesOptionEnabled(sqlitewraper.context);
                }
      }
    }
}
