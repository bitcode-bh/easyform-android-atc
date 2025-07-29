package com.sky.atc.easyformse.plugins;

import static android.content.Context.LOCATION_SERVICE;

import android.annotation.SuppressLint;
import android.content.ContentValues;
import android.database.Cursor;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Bundle;
import android.os.Looper;
import android.util.Log;
import android.widget.Toast;

import com.sky.atc.easyformse.AddressApi;
import com.sky.atc.easyformse.DeviceEventsUtils;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.maulik;
import com.sky.atc.easyformse.sqlitewraper;

import net.sqlcipher.database.SQLiteDatabase;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaArgs;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Date;
import java.util.List;

/**
 * Created by NareshChocha on 11/25/2024.
 *
 * @author NareshChocha
 */
// insert track master entry
public class InsertNewLatLngPlugin extends CordovaPlugin {

    private static final String TAG = "InsertNewLatLngPlugin";
    public CallbackContext callbackContext;
    private SQLiteDatabase database;
    String lat = null;
    String lon = null;
    MySharedPreferences pref;
    LocationManager locationManager;
    String accuracy = null;
    String Provider;
    String waypoint;
    String address = null, date;
    int meterdistancevalue = 100;
    String speed;
    long locatiiontime;
    String Waypointtype;
    @Override
    public boolean execute(String action, CordovaArgs args,
                           org.apache.cordova.CallbackContext callbackContext)
            throws org.json.JSONException {
        this.callbackContext = callbackContext;
        database = sqlitewraper.getDatabase();
        pref = sqlitewraper.getSecureShared("MyPref");
        try{
            // Waypointtype = task_click / create_task / status_change waypoint added
            Waypointtype = args.getJSONObject(0).getString("waypoint_type");
        }
        catch (Exception e)
        {
            Waypointtype = "";
        }

        Date now = new Date();
        Long time = now.getTime();

        reqLocation();
        try {
            Cursor c = database
                    .rawQuery(
                            "SELECT lat,lon,address, accuracy,date,waypoint  FROM  track_master WHERE   _id = (SELECT MAX(_id) FROM track_master);",
                            null);
            if (c.getCount() > 0) {
                c.moveToFirst();
                // lat =c.getString(0);
                //lon = c.getString(1);
                // address = c.getString(2);
                //  accuracy = c.getString(3);
                // date = c.getString(4);
                waypoint = c.getString(5);

                //if waypoint is 1 check distance and insert entry
                if (waypoint != null && waypoint.equalsIgnoreCase("1")) {
                    String lat_cal = c.getString(0);
                    String lon_cal = c.getString(1);

                    final int R = 6371; // Radius of the earth

                    Double latDistance = deg2rad((Double.parseDouble(lat_cal))
                            - (Double.parseDouble(lat)));
                    Double lonDistance = deg2rad((Double.parseDouble(lon_cal))
                            - Double.parseDouble(lon));
                    Double a = Math.sin(latDistance / 2)
                            * Math.sin(latDistance / 2)
                            + Math.cos(deg2rad(Double.parseDouble(lat_cal)))
                            * Math.cos(deg2rad(Double.parseDouble(lat)))
                            * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
                    Double dist_m = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    double distance = R * dist_m * 1000; // convert to meters

                    //insert if the distance is more than 100 meter
                    // remove distance condition because always insert waypoint entry
//                    if (distance > meterdistancevalue) {
                        address = AddressApi.getCompleteAddress(Double.parseDouble(lat), Double.parseDouble(lon));
                        insert(address, lat, lon, accuracy,speed,Provider,locatiiontime);
//                    }

                } else {

                    address = AddressApi.getCompleteAddress(Double.parseDouble(lat), Double.parseDouble(lon));
                    insert(address, String.valueOf(lat), String.valueOf(lon), accuracy,speed,Provider,locatiiontime);
                }
            }

            c.close();

        } catch (Exception e) {
            this.callbackContext.error(e.getMessage());
        }


        return true;
    }

    private double deg2rad(double deg) {
        return (deg * Math.PI / 180.0);
    }

    public void reqLocation() {

        LocationListener locationListener = new MyLocationListner();
        Location location1 = getLastKnownLocation();
        if (location1 != null) {
            locationListener.onLocationChanged(location1);
        } else {
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
            accuracy = String.format("%.2f", location.getAccuracy());
            Provider = location.getProvider();
            speed = String.valueOf(location.getSpeed());
            locatiiontime = location.getTime();
            Log.d("##lat :", String.valueOf(lat) + "##lng :" + lon);

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

    void insert(String add, String lat, String lon, String accuary,String speed,String provider,long locatiiontime) {


        try {
            Cursor a_t = database.rawQuery(
                    "select value from APP_states where ITEAM ='nick'", null);
            a_t.moveToFirst();
            int j = a_t.getCount();
            j++;
            String username = null;
            if (a_t.getCount() > 0) {

                username = a_t.getString(0);
                a_t.close();
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
            args1.put("provider",provider );
            args1.put("accuracy", accuary);
            args1.put("IS_SEND", 0);
            args1.put("IS_LOC", time);
            args1.put("address", add);
            args1.put("username", username);
            args1.put("tripflag", "2");
            args1.put("waypoint", "1");
            args1.put("speed", speed);
            args1.put("locationtime", locatiiontime);
            args1.put("waypoint_type",Waypointtype);

            long temp_mast = database.insert("track_master", null, args1);
            callbackContext.success();
        } catch (Exception e) {
            callbackContext.error("");
        }
    }


}
