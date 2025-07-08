package com.sky.atc.easyformse;

import android.Manifest;
import android.app.PendingIntent;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.location.Location;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;

import com.google.android.gms.common.api.GoogleApiClient;
import com.google.android.gms.common.api.ResultCallback;
import com.google.android.gms.common.api.Status;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.Geofence;
import com.google.android.gms.location.GeofencingRequest;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationListener;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.maps.model.LatLng;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.geofencenew.GeofenceTrasitionServicenew;
import com.sky.atc.easyformse.trip.LocationOutageUtils;
import com.sky.atc.easyformse.trip.TripBackgroundMapActivity;

import net.sqlcipher.database.SQLiteDatabase;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import io.michaelrocks.paranoid.Obfuscate;

//import com.sky.atc.easyformse.geofencenew.GeofenceTrasitionServicenew;


/**
 * Created by Chetan Patel on 26-Aug-16.
 */
@Obfuscate
public class SupportPageMapsPlugin_Green extends CordovaPlugin implements LocationListener, ResultCallback<Status> {

    public CallbackContext callbackContext;
    private FusedLocationProviderClient fusedLocationClient;
    private LocationCallback locationCallback;
    private LocationRequest locationRequest;
    private LocationRequest mLocationRequest;
    SupportPageMapsPlugin_Green context;
    SQLiteDatabase database;
    static int mockalert = 1;
    String site_lat;
    String site_lng;
    String company_id;
    String username;
    String selected_sitename;
    String server_task_id;
    String radius;

    String supportDetails;
    String customerId;
    private GoogleApiClient googleApiClient;
    private final long GEO_DURATION = Geofence.NEVER_EXPIRE;
    private final static int GEOFENCE_REQ_CODE = 0;
    private PendingIntent geoFencePendingIntent;

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {

        this.callbackContext = callbackContext;
        context = this;
        database = sqlitewraper.getDatabase();
        site_lat = args.getJSONObject(0).getString("site_lat");
        site_lng = args.getJSONObject(0).getString("site_long");
        company_id = args.getJSONObject(0).getString("Company_Id");
        username = args.getJSONObject(0).getString("Username");
        selected_sitename = args.getJSONObject(0).getString("Customer_Unique");
        server_task_id = args.getJSONObject(0).getString("Task_Id");
        radius = args.getJSONObject(0).getString("Radius");
        supportDetails = args.getJSONObject(0).getString("Support_Details");
        customerId = args.getJSONObject(0).getString("customer_id");

        // geofence with task without customer id 29-07-2024
//        if (customerId.equalsIgnoreCase("0")) {
//            String message = "Customer id may be 0";
//            this.callbackContext.error(message);
//        } else {
//            getLocation();
//        }

        getLocation();

        return true;
    }

    public void getLocation() {
        try {
            //New Location Method
            fusedLocationClient = LocationServices.getFusedLocationProviderClient(sqlitewraper.context);
            locationRequest = createLocationRequestNew();
            onLocationChanged();
            startLocationUpdates();

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void onLocationUpdate(Location location) {

        double lat = location.getLatitude();
        double lon = location.getLongitude();

        double sitelat = Double.parseDouble(site_lat);
        double sitelng = Double.parseDouble(site_lng);
        double finalradius = Double.parseDouble(radius);

        double dostance = distance(lat, lon, sitelat, sitelng);

        double disinmeter = milesToMeters(dostance);

        //If user is inside geofence
        if (disinmeter <= (finalradius + location.getAccuracy())) {

            Cursor c3 = database.rawQuery("select user_id,appid FROM Login_Master",
                    null);
            c3.moveToLast();
            String appid = "";            // TODO: Consider calling

            String user_id = "";
            if (c3.getCount() > 0) {
                user_id = c3.getString(0);
                appid = c3.getString(1);
                c3.close();
            }

            String flowid = "";
            Cursor c4 = database.rawQuery("select flow_id FROM geofence_tracking where place_id='" + customerId + "'",
                    null);
            c4.moveToLast();
            if (c4.getCount() > 0) {
                flowid = c4.getString(0);
                c4.close();
            }

            Cursor a_t = database.rawQuery(
                    "SELECT out_time FROM geofence_user_tracking_detail where place_id='" + customerId + "'ORDER BY id desc LIMIT 1", null);
            a_t.moveToFirst();
            int j = a_t.getCount();
            String out_time = null;


            if (j > 0) {
                out_time = a_t.getString(0);

                //Check out time for that perticular place to ensure that last entry is punched out
                //if last entry is completed than insert new geofence entry
                if (!out_time.equals("0")) {
                    ContentValues c = new ContentValues();
                    c.put("user_id", user_id);
                    c.put("place_id", customerId);
                    c.put("in_time", System.currentTimeMillis());
                    c.put("out_time", "0");
                    c.put("duration", "");
                    c.put("is_send", "0");
                    c.put("appid", appid);
                    c.put("flowid", flowid);
                    new Handler(Looper.getMainLooper()).post(new Runnable() {
                        public void run() {
                            Toast toast = Toast.makeText(sqlitewraper.context,customerId + "- In ", Toast.LENGTH_LONG);
                            toast.show();
                        }
                    });
                    long temp = database.insert("geofence_user_tracking_detail", null, c);

                }
                //start monitoring out event for specific place
                if (!customerId.equalsIgnoreCase("0")) {
                    MySharedPreferences pref = sqlitewraper.getSecureShared("MyPref");
                    pref.putString("isTripPauseAfterTask","true");
                    pref.commit();
                    startGeofence(new LatLng(Double.parseDouble(site_lat), Double.parseDouble(site_lng)), customerId, Float.parseFloat(radius), 1);
                    String ismapcheck;
                    ismapcheck = pref.getString("IsMapcheck","false");
                    if(LocationOutageUtils.isPiP)
                    {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                            if (ismapcheck.equalsIgnoreCase("true"))
                            {
                                pref.putString("IsMapcheck","false");
                                pref.commit();
                                TripBackgroundMapActivity.mActivity.finish();
                            }
                        }
                    }
                }
                try {
                    JSONObject jsonObject = new JSONObject();
                    JSONArray jsonArray = new JSONArray();
                    jsonObject.put("site_result", "green");
                    jsonArray.put(jsonObject);
                    this.callbackContext.success(jsonArray.toString());
                } catch (JSONException e) {
                    e.printStackTrace();
                }
            } else {

                //insert new geofence entry if no previous entry exists
                ContentValues c = new ContentValues();
                c.put("user_id", user_id);
                c.put("place_id", customerId);
                c.put("in_time", System.currentTimeMillis());
                c.put("out_time", "0");
                c.put("duration", "");
                c.put("is_send", "0");
                c.put("appid", appid);
                c.put("flowid", flowid);
                new Handler(Looper.getMainLooper()).post(new Runnable() {
                    public void run() {
                        Toast toast = Toast.makeText(sqlitewraper.context, customerId + "- In ", Toast.LENGTH_LONG);
                        toast.show();
                    }
                });
                long temp = database.insert("geofence_user_tracking_detail", null, c);

                if (!customerId.equalsIgnoreCase("0")) {
                    //start monitoring out event for specific place
                    MySharedPreferences pref = sqlitewraper.getSecureShared("MyPref");
                    pref.putString("isTripPauseAfterTask","true");
                    pref.commit();
                    startGeofence(new LatLng(Double.parseDouble(site_lat), Double.parseDouble(site_lng)), customerId, Float.parseFloat(radius), 1);

                    String ismapcheck;
                    ismapcheck = pref.getString("IsMapcheck","false");
                    if(LocationOutageUtils.isPiP)
                    {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                            if (ismapcheck.equalsIgnoreCase("true"))
                            {
                                pref.putString("IsMapcheck","false");
                                pref.commit();
                                TripBackgroundMapActivity.mActivity.finish();
                            }
                        }
                    }

                }

                try {
                    JSONObject jsonObject = new JSONObject();
                    JSONArray jsonArray = new JSONArray();
                    jsonObject.put("site_result", "green");
                    jsonArray.put(jsonObject);
                    this.callbackContext.success(jsonArray.toString());
                } catch (JSONException e) {
                    e.printStackTrace();
                }

            }
            a_t.close();


        } else {

            //User is outside geofence
            try {
                JSONObject jsonObject = new JSONObject();
                JSONArray jsonArray = new JSONArray();
                jsonObject.put("site_result", "red");
                jsonArray.put(jsonObject);
                this.callbackContext.success(jsonArray.toString());
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }
    }

    protected LocationRequest createLocationRequestNew() {
        LocationRequest locationRequest = LocationRequest.create();
        locationRequest.setInterval(10000);
        locationRequest.setFastestInterval(5000);
        locationRequest.setPriority(LocationRequest.PRIORITY_HIGH_ACCURACY);
        locationRequest.setSmallestDisplacement(100);
        return locationRequest;
    }

    public void onLocationChanged() {

        locationCallback = new LocationCallback() {
            @Override
            public void onLocationResult(LocationResult locationResult) {
                if (locationResult == null) {
                    return;
                }
                for (Location location : locationResult.getLocations()) {
                    try {

                        onLocationUpdate(location);

                        if (fusedLocationClient != null) {
                            fusedLocationClient.removeLocationUpdates(locationCallback);
                        }

                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            }
        };

    }

    private void startLocationUpdates() {
        if (ActivityCompat.checkSelfPermission(sqlitewraper.context, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(sqlitewraper.context, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {

            return;
        }
        fusedLocationClient.requestLocationUpdates(locationRequest,
                locationCallback,
                Looper.getMainLooper());
    }

    @Override
    public void onLocationChanged(Location location) {

    }

    private double distance(double lat1, double lon1, double lat2, double lon2) {
        double theta = lon1 - lon2;
        double dist = Math.sin(deg2rad(lat1))
                * Math.sin(deg2rad(lat2))
                + Math.cos(deg2rad(lat1))
                * Math.cos(deg2rad(lat2))
                * Math.cos(deg2rad(theta));
        dist = Math.acos(dist);
        dist = rad2deg(dist);
        dist = dist * 60 * 1.1515;
        return (dist);
    }

    private double deg2rad(double deg) {
        return (deg * Math.PI / 180.0);
    }

    private double rad2deg(double rad) {
        return (rad * 180.0 / Math.PI);
    }

    public static double milesToMeters(double miles) {
        return miles / 0.0006213711;
    }

    // Start Geofence creation process
    private void startGeofence(LatLng geoFenceMarker, String siteid, float geofenceRadius, int enterExitflag) {
        if (geoFenceMarker != null) {
            Geofence geofence = createGeofence(geoFenceMarker, geofenceRadius, siteid);
            GeofencingRequest geofenceRequest = createGeofenceRequest(geofence, enterExitflag);
            addGeofence(geofenceRequest);
        }
    }

    // Create a Geofence
    private Geofence createGeofence(LatLng latLng, float radius, String siteid) {

        return new Geofence.Builder()
                .setRequestId(String.valueOf(siteid))
                .setCircularRegion(latLng.latitude, latLng.longitude, radius)
                .setExpirationDuration(GEO_DURATION)
                .setTransitionTypes(Geofence.GEOFENCE_TRANSITION_ENTER | Geofence.GEOFENCE_TRANSITION_EXIT)
                .build();
    }

    // Create a Geofence Request
    private GeofencingRequest createGeofenceRequest(Geofence geofence, int enterExitflag) {

        int intialTrigger = GeofencingRequest.INITIAL_TRIGGER_ENTER;

        if (enterExitflag == 1) {
            intialTrigger = GeofencingRequest.INITIAL_TRIGGER_EXIT;
        }

        return new GeofencingRequest.Builder()
                .setInitialTrigger(intialTrigger)
                .addGeofence(geofence)
                .build();
    }

    private void addGeofence(GeofencingRequest request) {
        googleApiClient = sqlitewraper.getGoogleApiHelper().getGoogleApiClient();
        if (ActivityCompat.checkSelfPermission(sqlitewraper.context, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            return;
        }
        LocationServices.GeofencingApi.addGeofences(
                googleApiClient,
                request,
                createGeofencePendingIntent()
        ).setResultCallback(this);
    }

    private PendingIntent createGeofencePendingIntent() {
        if (geoFencePendingIntent != null)
            return geoFencePendingIntent;

        Intent intent = new Intent(sqlitewraper.context, GeofenceTrasitionServicenew.class);
        return PendingIntent.getService(
                sqlitewraper.getInstance(), GEOFENCE_REQ_CODE, intent, PendingIntent.FLAG_UPDATE_CURRENT);
    }

    @Override
    public void onResult(@NonNull Status status) {

        if (status.isSuccess()) {

        } else {
        }
    }

}
