package com.sky.atc.easyformse;

import android.annotation.SuppressLint;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.Bundle;
import android.util.Log;

import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.location.MapLatlongActivity;

import net.sqlcipher.database.SQLiteDatabase;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaArgs;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;
import org.apache.cordova.PluginResult.Status;
import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;

import io.michaelrocks.paranoid.Obfuscate;

import static android.content.Context.LOCATION_SERVICE;

//to return latest location data in plugin
@Obfuscate
public class maulik extends CordovaPlugin {

    private static final String TAG = "maulik";
    private static final String args1 = "nck";
    int gps;
    int gprs;
    private Long diff_time;
    MySharedPreferences pref;
//    Editor editor;
    LocationManager locationManager;
    String mprovider;
    String lat = null;
    String lon = null;
    private SQLiteDatabase database;
    public CallbackContext callbackContext;
    private String mapview = "false";
    String accuracy = null;

    @Override
    public boolean execute(String action, CordovaArgs args,
                           org.apache.cordova.CallbackContext callbackContext)
            throws org.json.JSONException {
        Log.i(TAG, "Plugin Called");
        Date now = new Date();
        Long time = now.getTime();

        this.callbackContext = callbackContext;

        pref = sqlitewraper.getSecureShared("MyPref");
//        editor = pref.edit();


        //if map view is true than show map(it used for type 13)
        //else provide
         try{
             if (args.getJSONObject(0).has("map_view")){

                 mapview = args.getJSONObject(0).getString("map_view");

             }
         }catch (Exception e){
             mapview = "false";
         }

        final ConnectivityManager connMgr = (ConnectivityManager) sqlitewraper.context
                .getSystemService(Context.CONNECTIVITY_SERVICE);
        final NetworkInfo mobile = connMgr
                .getNetworkInfo(ConnectivityManager.TYPE_MOBILE);
        LocationManager lm = (LocationManager) sqlitewraper.context
                .getSystemService(LOCATION_SERVICE);

        // -------------------GPS-------------------
        boolean isGPSEnabled = lm
                .isProviderEnabled(LocationManager.GPS_PROVIDER);

        if (isGPSEnabled) {
            gps = 1;
        } else {
            gps = 0;
        }

        // -------------------GPRS-------------------
        boolean icheck = isNetworkAvailable();


        if (connMgr.getNetworkInfo(0).getState() == NetworkInfo.State.CONNECTED
                || connMgr.getNetworkInfo(1).getState() == NetworkInfo.State.CONNECTING
                || sqlitewraper.internetflag == 1 || icheck == true) {
            gprs = 1;
        } else {
            gprs = 0;
        }

        if(mapview.equalsIgnoreCase("true")){
            reqLocation();
            // get current lat lng without open maplatlongactivity 09-02-2024 changes for tata project
//            Intent intent = new Intent(this.cordova.getActivity(), MapLatlongActivity.class);
//            this.cordova.startActivityForResult(this, intent,101);
        }else {

        PluginResult result = null;
        try {


            // check currently gps is on or off


            database = sqlitewraper.getDatabase();
            Cursor c = database
                    .rawQuery(
                            "SELECT lat,lon,address, accuracy,date  FROM  track_master WHERE   _id = (SELECT MAX(_id) FROM track_master);",
                            null);
            String  add = null, date;


            if (c.getCount() > 0) {
                c.moveToFirst();
                lat = c.getString(0);
                lon = c.getString(1);
                add = c.getString(2);
                accuracy = c.getString(3);
                date = c.getString(4);
                diff_time = time - Long.valueOf(date);
            }

            c.close();

            String imei = DeviceEventsUtils.getImei();
            if (lat == null) {
//                lat = "";
//                lat = pref.getString("lat", "");
            }

            if (lon == null) {
//                lon = pref.getString("lon", "");

            }
            if (add == null) {
                add = "NA";
            } else {
                if (add.contains("null")) {
                    add = "NA";
                }

            }
            if (accuracy == null || accuracy.equalsIgnoreCase("null")) {
//                accuracy = pref.getString("accuracy", "");
                accuracy = "0";
            }
            if (imei == null) {
                imei = "";
            }

            if (lat == null || lon == null) {
                reqLocation();
//              insert(add, lat, lon);
            }

            LinkedHashMap<String, Object> lHashMap = new LinkedHashMap<String, Object>();
            lHashMap.put("lat", lat);
            lHashMap.put("lon", lon);
            lHashMap.put("address", add);
            lHashMap.put("accuracy", accuracy);
            lHashMap.put("imei", imei);
            lHashMap.put("gps", gps);
            lHashMap.put("gprs", gprs);
            lHashMap.put("diff_time", diff_time);

            JSONObject json = new JSONObject(lHashMap);
            ArrayList<JSONObject> list = new ArrayList<JSONObject>();
            list.add(json);
            callbackContext.sendPluginResult(new PluginResult(
                    Status.OK, list.toString()));
//            result = new PluginResult(Status.OK);

        } catch (Exception e) {
           // e.printStackTrace();
            callbackContext.sendPluginResult(new PluginResult(
                    Status.ERROR, e.getMessage()));
        }
        }

        return true;


    }

    private boolean isNetworkAvailable() {
        ConnectivityManager connectivityManager = (ConnectivityManager) sqlitewraper.context
                .getSystemService(Context.CONNECTIVITY_SERVICE);
        NetworkInfo activeNetworkInfo = connectivityManager
                .getActiveNetworkInfo();
        return activeNetworkInfo != null;
    }

    void insert(String add, String lat, String lon ,String accuary) {
        Cursor a_t = database.rawQuery(
                "select value from APP_states where ITEAM ='nick'", null);
        a_t.moveToFirst();
        int j = a_t.getCount();
        j++;
        String username = null;
        if (a_t.getCount() > 0) {

            username = a_t.getString(0);
        }

        Date now = new Date();

        Long time = now.getTime();
        String Date = now.toLocaleString();

        ContentValues args1 = new ContentValues();
        args1.put("cellid", add);
        args1.put("lat", DeviceEventsUtils.LatlngRoundff(lat));
        args1.put("date", time.toString());
        args1.put("date_s", Date);
        args1.put("lon", DeviceEventsUtils.LatlngRoundff(lon));
        args1.put("provider", "");
        args1.put("accuracy", accuary);
        args1.put("IS_SEND", 0);
        args1.put("IS_LOC", time);
        args1.put("address", add);
        args1.put("username", username);
        args1.put("tripflag", "0");

        long temp_mast = database.insert("track_master", null, args1);
    }


    public void reqLocation() {

        LocationListener locationListener = new MyLocationListner();
        Location location1 = getLastKnownLocation();
        if (location1 != null) {
            locationListener.onLocationChanged(location1);
        }else {
               //Toast.makeText(sqlitewraper.context, "No Location Provider found", Toast.LENGTH_SHORT).show();
        }
    }

    private Location getLastKnownLocation() {
        locationManager = (LocationManager) sqlitewraper.context.getSystemService(LOCATION_SERVICE);
        List<String> providers = locationManager.getProviders(true);
        Location bestLocation = null;
        for (String provider : providers) {
            @SuppressLint("MissingPermission") Location l = locationManager.getLastKnownLocation(provider);
            if (l == null) {
                continue;
            }
            if (bestLocation == null || l.getAccuracy() < bestLocation.getAccuracy()) {
                // Found best last known location: %s", l);
                bestLocation = l;
            }
        }
        return bestLocation;
    }

    public class MyLocationListner implements LocationListener {
        @Override
        public void onLocationChanged(Location location) {

          lat = String.valueOf(location.getLatitude());
          lon = String.valueOf(location.getLongitude());
            accuracy =  String.format("%.2f",location.getAccuracy());

            String address = AddressApi.getCompleteAddress(Double.parseDouble(lat), Double.parseDouble(lon));

            Log.d("##lat :", String.valueOf(lat) + "##lng :" + lon);
            // if mapview get true pass current lat lng in plugin success 09-02-2024 changes for tata project
            if(mapview.equalsIgnoreCase("true"))
            {
                try{
                    JSONObject jsonObject = new JSONObject();
                    JSONArray jsonArray = new JSONArray();
                    jsonObject.put("lat", lat);
                    jsonObject.put("lon", lon);
                    jsonArray.put(jsonObject);
                    callbackContext.success(jsonArray.toString());
                }
                catch (Exception e)
                {

                }
            }
            else {
                insert(address, String.valueOf(lat), String.valueOf(lon),accuracy);
            }


        }

        @Override
        public void onStatusChanged(String provider, int status, Bundle extras) {
        }

        @Override
        public void onProviderEnabled(String provider) {
        }

        @Override
        public void onProviderDisabled(String provider) {

        }
    }

    public void onActivityResult(int requestCode, int resultCode, Intent intent) {
        switch (requestCode) {
            case 101:
                if (callbackContext!=null) {
                    try {
                        if (resultCode == android.app.Activity.RESULT_OK) { // 0:ok
                            Bundle bundle = intent.getExtras();
                            String lat = bundle.getString("lat");
                            String lon = bundle.getString("lon");


                            LinkedHashMap<String, Object> lHashMap = new LinkedHashMap<String, Object>();
                            lHashMap.put("lat", lat);
                            lHashMap.put("lon", lon);
                            lHashMap.put("address", "");
                            lHashMap.put("accuracy", "0");
                            lHashMap.put("imei", DeviceEventsUtils.getLoginDetails().get(1));
                            lHashMap.put("gps", gps);
                            lHashMap.put("gprs", gprs);
                            lHashMap.put("diff_time", System.currentTimeMillis());

                            JSONObject json = new JSONObject(lHashMap);
                            ArrayList<JSONObject> list = new ArrayList<JSONObject>();
                            list.add(json);
                            callbackContext.sendPluginResult(new PluginResult(
                                    Status.OK, list.toString()));

                            this.callbackContext.success(list.toString());
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
