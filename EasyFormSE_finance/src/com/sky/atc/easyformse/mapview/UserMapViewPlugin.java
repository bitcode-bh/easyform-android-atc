package com.sky.atc.easyformse.mapview;


import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.database.Cursor;
import android.widget.Toast;

import com.sky.atc.easyformse.NewWebservicesCallEasyform;
import com.sky.atc.easyformse.R;
import com.sky.atc.easyformse.sqlitewraper;

import net.sqlcipher.database.SQLiteDatabase;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

//Plugin will call to start the UserMapViewActivity to initialize live mapview
@StringFogIgnore
public class UserMapViewPlugin extends CordovaPlugin {


    private CallbackContext callbackContext;
    private static final String WCFURL = sqlitewraper.context.getResources().getString(R.string.WCFURL);
    private final String METHOD_FORGOT = "WCF_getGCMdataByUsername";
    SQLiteDatabase database;
    private static final int UserMapViewActivityRequestCode = 4812;

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        database = sqlitewraper.getDatabase();

        this.callbackContext = callbackContext;
        try {
            String username = args.getJSONObject(0).getString("Username");
            String companyid = args.getJSONObject(0).getString("Company_Id");
            String radius = args.getJSONObject(0).getString("Radius");
            String isGeofenceShowing = "true"; //args.getJSONObject(0).getString("isgeofence");
            String receivertoken = null;
            String senderid = null;
            if (username != null || companyid != null) {

                JSONObject data = new JSONObject();
                data.put("username", username);
                data.put("company_id", companyid);

                //Webservice to get FCM TOKEN of opponent based on opponent's username and company id
                String restext = NewWebservicesCallEasyform.ExecuteNetworkHTTPPostRequest(data, WCFURL, METHOD_FORGOT);

                JSONArray jsonArray = null;
                String Status = null;
                String message = null;

                if (restext == null) {
                    this.callbackContext.error("Error");
                    return false;
                } else {
                    try {
                        jsonArray = new JSONArray(restext);
                        JSONObject jsonObject = jsonArray.getJSONObject(0);
                        Status = jsonObject.getString("status");
                        message = jsonObject.getString("message");

                        if (Status.equalsIgnoreCase("1")) {

                            receivertoken = jsonObject.getString("data");

                            Cursor a_t2 = database.rawQuery(
                                    "select gid from gcm_server", null);
                            a_t2.moveToFirst();

                            senderid = a_t2.getString(0);
                            a_t2.close();

                            SharedPreferences preferences = sqlitewraper.context.getSharedPreferences("MyPrefs", Context.MODE_PRIVATE);
                            SharedPreferences.Editor editor = preferences.edit();
                            editor.putBoolean("toastShown", false);
                            editor.apply();

                            //start the UserMapViewActivity to show Live Mapview of opponent
                            Intent intent = new Intent(sqlitewraper.context, UserMapViewActivity.class);
                            intent.putExtra("senderid", senderid);
                            intent.putExtra("receivertoken", receivertoken);
                            intent.putExtra("radius", radius);
                            intent.putExtra("companyid", companyid);
                            intent.putExtra("isGeofence", isGeofenceShowing);
                            this.cordova.startActivityForResult(this, intent, UserMapViewActivityRequestCode);
                            return true;
                            //sqlitewraper.context.startActivity(intent);

                        } else {
                            Toast.makeText(sqlitewraper.context, message, Toast.LENGTH_SHORT).show();
                            this.callbackContext.error(message);
                            return false;
                        }

                    } catch (JSONException e) {
                        this.callbackContext.error(e.getMessage());
                        e.printStackTrace();
                        return false;
                    }
                }
            } else {
                this.callbackContext.error("Data Missing");
                Toast.makeText(sqlitewraper.context, "Data Missing", Toast.LENGTH_SHORT).show();
                return false;
            }
        } catch (Exception e) {
            this.callbackContext.error(e.getMessage());
            return false;
        }
    }


    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent intent) {
        super.onActivityResult(requestCode, resultCode, intent);
        if (resultCode == Activity.RESULT_OK) {
            if (requestCode == UserMapViewActivityRequestCode) {
                callbackContext.success("success");
            }
        } else {
            callbackContext.error("Canceled");
        }


    }
}
