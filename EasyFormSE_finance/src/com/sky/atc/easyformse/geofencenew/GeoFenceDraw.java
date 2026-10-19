package com.sky.atc.easyformse.geofencenew;

import android.Manifest;
import android.app.PendingIntent;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.location.Location;
import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;

import android.util.Log;

import com.google.android.gms.common.api.GoogleApiClient;
import com.google.android.gms.common.api.ResultCallback;
import com.google.android.gms.common.api.Status;
import com.google.android.gms.location.Geofence;
import com.google.android.gms.location.GeofencingRequest;
import com.google.android.gms.location.LocationListener;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.maps.model.LatLng;
import com.sky.atc.easyformse.sqlitewraper;

import net.sqlcipher.database.SQLiteDatabase;

import org.json.JSONArray;
import org.json.JSONObject;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;
import com.sky.atc.easyformse.utils.LogUtils;

//To Draw geofence
@StringFogIgnore
public class GeoFenceDraw implements
        LocationListener,
        ResultCallback<Status> {

    private final static int GEOFENCE_REQ_CODE = 0;
    private static SQLiteDatabase database;
    private static String TAG = "###GefenceDrawClass";
    private static int GEOFENCE_REQ_ID = 0;
    private final long GEO_DURATION = Geofence.NEVER_EXPIRE;
    private final int REQ_PERMISSION = 999;
    // Defined in mili seconds.
    // This number in extremely low, and should be used only for debug
    private final int UPDATE_INTERVAL = 10000;
    private final int FASTEST_INTERVAL = 9000;
    private GoogleApiClient googleApiClient;
    private Location lastLocation;
    private LocationRequest locationRequest;
    private LocationRequest mLocationRequest;
    private float GEOFENCE_RADIUS = 500.0f; // in meters
    private PendingIntent geoFencePendingIntent;
    private GoogleApiHelper googleApiHelper;


    //Create and start google geofence client
    public void getSiteinfoNew() {

        try {



            database = sqlitewraper.getDatabase();

            if (sqlitewraper.getGoogleApiHelper().isConnected()) {

                //Get google api client from anywhere
                googleApiClient = sqlitewraper.getGoogleApiHelper().getGoogleApiClient();
                clearGeofence(0);
                startLocationUpdates();
                getLastKnownLocation();
//                clearGeofence();
            }

            double userlat = 0;
            double userlng = 0;

            if (lastLocation!=null) {
                userlat = lastLocation.getLatitude();
                userlng = lastLocation.getLongitude();
            }else {

                Cursor c = database
                        .rawQuery(
                                "SELECT lat,lon,address, c_accuracy,date  FROM  track_master WHERE   _id = (SELECT MAX(_id) FROM track_master);", null);

                if (c.getCount() > 0) {
                    c.moveToFirst();
                    userlat = Double.parseDouble(c.getString(0));
                    userlng = Double.parseDouble(c.getString(1));
                }
                c.close();
            }

            Cursor c2 = database.rawQuery(
                    "select place_id from geofence_user_tracking_detail where out_time='0' and place_id !='BIG'", null);

            int pendinggeofence = c2.getCount();

            String placeid = "0";
            c2.moveToFirst();
            String placeidString="";

            if (pendinggeofence > 0) {

                for (int i = 0; i < pendinggeofence; i++) {
                    placeid = c2.getString(0);
                    c2.moveToNext();
                    LogUtils.writeGeofenceLogToFile("pendinggeofence : " + placeid ," site in new");
                    redrawpendingWithExit(placeid);
                    placeidString = placeidString +","+ placeid;

                }
            }
            c2.close();
            if (!placeidString.equalsIgnoreCase("")) {
                placeidString = placeidString.substring(1);
            }

            int limit = 97 - pendinggeofence;


            Cursor a_t = database.rawQuery(
                    "select place_id,latitude,longitude,radius,flow_id,(((" + userlat + "-latitude)*(" + userlat + "-latitude)) + ((" + userlng + "-longitude)*(" + userlng + "-longitude))) as distance from geofence_tracking where place_id not in (" + placeidString + ") ORDER BY distance  ASC  limit " + limit + "", null);
            a_t.moveToFirst();
            int j = a_t.getCount();
            String siteid = null;
            String lat = null;
            String lng = null;
            String radiusData = null;
            String flowid;
            if (j > 0) {

                for (int i = 0; i < j; i++) {
                    siteid = a_t.getString(0);
                    lat = a_t.getString(1);
                    lng = a_t.getString(2);
                    radiusData = a_t.getString(3);
                    flowid = a_t.getString(4);

//                    if getting radius 0 from geofence_tracking table get Radius from Flow master
                    if (radiusData.equalsIgnoreCase("0")) {

                        radiusData = getRadiusfromFlowmaster(flowid);
                    }

                    Log.d("##getSiteInfo", siteid + ": Lat: " + lat);
                    markerForGeofence(new LatLng(Double.parseDouble(lat), Double.parseDouble(lng)), siteid, Float.parseFloat(radiusData),0);

                    if (i == (j - 1)) {


                        float[] distance = new float[2];
                        Location.distanceBetween(userlat, userlng, Double.parseDouble(lat), Double.parseDouble(lng), distance);
                        float distance2 = distance[0];

                        float distanceRadius = Float.parseFloat(distance2 + (radiusData));
                        GEOFENCE_RADIUS = distanceRadius;
                        markerForGeofence(new LatLng(userlat, userlng), "BIG", distanceRadius,0);
                        Log.d("###BiGCircle", String.valueOf(distanceRadius));

                    }

                    a_t.moveToNext();
                }

            }
            a_t.close();
        } catch (Exception e) {

            e.printStackTrace();
        }

    }


    public void getSiteinfo() {


        if (sqlitewraper.getGoogleApiHelper().isConnected()) {
            //Get google api client from anywhere
            googleApiClient = sqlitewraper.getGoogleApiHelper().getGoogleApiClient();
//            startLocationUpdates();
            getLastKnownLocation();
        }

//        clearGeofence();


        double userlat = lastLocation.getLatitude();
        double userlng = lastLocation.getLongitude();

        database = sqlitewraper.getDatabase();
        Cursor a_t = database.rawQuery(
                "select place_id,latitude,longitude,radius,flow_id,(((" + userlat + "-latitude)*(" + userlat + "-latitude)) + ((" + userlng + "-longitude)*(" + userlng + "-longitude))) as distance from geofence_tracking ORDER BY distance  ASC  limit 5", null);
        a_t.moveToFirst();
        int j = a_t.getCount();
        String siteid = null;
        String lat = null;
        String lng = null;
        String radiusData = null;
        String flowid;
        if (j > 0) {

            for (int i = 0; i < j; i++) {
                siteid = a_t.getString(0);
                lat = a_t.getString(1);
                lng = a_t.getString(2);
                radiusData = a_t.getString(3);
                flowid = a_t.getString(4);

                if (radiusData.equalsIgnoreCase("0")) {

                    radiusData = getRadiusfromFlowmaster(flowid);
                }

                Log.d("##getSiteInfo", siteid + ": Lat: " + lat);
                markerForGeofence(new LatLng(Double.parseDouble(lat), Double.parseDouble(lng)), siteid, Float.parseFloat(radiusData),0);

                if (i == (j - 1)) {


                    float[] distance = new float[2];
                    Location.distanceBetween(userlat, userlng, Double.parseDouble(lat), Double.parseDouble(lng), distance);
                    float distance2 = distance[0];

//                    float distanceRadius = Float.parseFloat(distance2 + (radiusData));
                    float distanceRadius = distance2 + Float.valueOf((radiusData));
                    GEOFENCE_RADIUS = distanceRadius;
                    markerForGeofence(new LatLng(userlat, userlng), "BIG", distanceRadius,0);
                    Log.d("###BiGCircle", String.valueOf(distanceRadius));

                }

                a_t.moveToNext();
            }

        }
        a_t.close();

    }

    //To get Radius from Flow master
    private String getRadiusfromFlowmaster(String flow_id) {


        String radiusData = null;
        JSONArray jsondata;
        JSONArray jsonArray;
        Cursor c2 = database.rawQuery(
                "SELECT data FROM  User_Define_Flow_Master where id='" + flow_id + "'",
                null);
        try {
            if (c2.getCount() > 0) {
                c2.moveToFirst();
                String data = c2.getString(0);
                JSONArray geodata = new JSONArray(data);
                JSONObject geojsonobject = geodata.getJSONObject(0);
                String geotracking = geojsonobject.getString("geotracking");
                jsondata = new JSONArray(geotracking);
                JSONObject obj = jsondata.getJSONObject(0);

                jsonArray = obj.getJSONArray("queryval");
                int radius = obj.getInt("radius");
                int duration = obj.getInt("duration");

                radiusData = String.valueOf(radius);
            }
        } catch (Exception e) {
            Log.d("###getRadiusFlowmas", String.valueOf(e));
        }
        c2.close();

        return radiusData;
    }

    private void markerForGeofence(LatLng latLng, String siteid, float distanceRadius,int enterExitflag) {
        Log.i(TAG, "###markerForGeofence(" + latLng + ")");
        String title = latLng.latitude + ", " + latLng.longitude;
        startGeofence(latLng, siteid, distanceRadius,enterExitflag);
        LogUtils.writeGeofenceLogToFile(String.valueOf(enterExitflag),"markerForGeofence");
    }

    // Start Geofence creation process
    private void startGeofence(LatLng geoFenceMarker, String siteid, float geofenceRadius,int enterExitflag) {
        if (geoFenceMarker != null) {
            Geofence geofence = createGeofence(geoFenceMarker, geofenceRadius, siteid);
            GeofencingRequest geofenceRequest = createGeofenceRequest(geofence,enterExitflag);
            addGeofence(geofenceRequest);
            Log.i("####startgeofence", geoFenceMarker.latitude + " : " + geoFenceMarker.longitude);
            LogUtils.writeGeofenceLogToFile(geoFenceMarker.latitude + " : " + geoFenceMarker.longitude,"startGeofence");
        } else {
            Log.e(TAG, "###Geofence marker is null");
        }
    }

    // Create a Geofence
    private Geofence createGeofence(LatLng latLng, float radius, String siteid) {
        Log.d(TAG, "###createGeofence");

        return new Geofence.Builder()
                .setRequestId(String.valueOf(siteid))
                .setCircularRegion(latLng.latitude, latLng.longitude, radius)
                .setExpirationDuration(GEO_DURATION)
                .setTransitionTypes(Geofence.GEOFENCE_TRANSITION_DWELL
                         | Geofence.GEOFENCE_TRANSITION_EXIT)
                .setLoiteringDelay(5 * 60 * 1000)  //  5 min geofence create e
//                .setTransitionTypes(Geofence.GEOFENCE_TRANSITION_ENTER  // remove enter type and use dwell 24062026
//                        | Geofence.GEOFENCE_TRANSITION_EXIT)
                .build();
    }

    // Create a Geofence Request
    private GeofencingRequest createGeofenceRequest(Geofence geofence,int enterExitflag) {
        Log.d(TAG, "###createGeofenceRequest");

//        int intialTrigger = GeofencingRequest.INITIAL_TRIGGER_ENTER;

        int intialTrigger  = GeofencingRequest.INITIAL_TRIGGER_DWELL;

        if (enterExitflag==1){
            intialTrigger = GeofencingRequest.INITIAL_TRIGGER_EXIT;
        }

        return new GeofencingRequest.Builder()
                .setInitialTrigger(intialTrigger)
                .addGeofence(geofence)
                .build();
    }

    //to create geofence pending intent
    private PendingIntent createGeofencePendingIntent() {
        Log.d(TAG, "###createGeofencePendingIntent");
        if (geoFencePendingIntent != null)
            return geoFencePendingIntent;

        Intent intent = new Intent(sqlitewraper.getInstance(), GeofenceTrasitionService.class);
        return PendingIntent.getService(
                sqlitewraper.getInstance(), GEOFENCE_REQ_CODE, intent, PendingIntent.FLAG_UPDATE_CURRENT | (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S ? PendingIntent.FLAG_MUTABLE : 0));
    }

    //add geofennce request
    private void addGeofence(GeofencingRequest request) {
        Log.d(TAG, "###addGeofence");

        if (ActivityCompat.checkSelfPermission(sqlitewraper.context, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            return;
        }
        LocationServices.GeofencingApi.addGeofences(
                googleApiClient,
                request,
                createGeofencePendingIntent()
        ).setResultCallback(this);
    }

    @Override
    public void onResult(@NonNull Status status) {
        Log.i(TAG, "###onResult: " + status);
        if (status.isSuccess()) {
//            saveGeofence();
//            drawGeofence();
            Log.i(TAG, "###onResult: 1" + status);

        } else {
            // inform about fail
        }
    }

    // Clear Geofence
    public void clearGeofence(final int i) {

        try {

            if (googleApiClient == null){
                Log.d("##CRASH", "googleApiClient");
                googleApiHelper = new GoogleApiHelper(sqlitewraper.context);
            }

            if (sqlitewraper.getGoogleApiHelper().isConnected()) {
                //Get google api client from anywhere
                googleApiClient = sqlitewraper.getGoogleApiHelper().getGoogleApiClient();
            }

            Log.d("##CRASH", "###clearGeofence()");
            LocationServices.GeofencingApi.removeGeofences(
                    googleApiClient,
                    createGeofencePendingIntent()
            ).setResultCallback(new ResultCallback<Status>() {
                @Override
                public void onResult(@NonNull Status status) {
                    if (status.isSuccess()) {
                        // remove drawing
                        Log.d("##CRASHSUCCESS", String.valueOf(status));
                        if (i == 1) {
                            getSiteinfoNew();
                        }
                    }
                }
            });
        }
        catch (Exception e){
            Log.d("##CRASHEXCE",e.getMessage());
        }
    }


    //get last known location
    private void getLastKnownLocation() {

        Log.d(TAG, "getLastKnownLocation()");
        if (ActivityCompat.checkSelfPermission(sqlitewraper.context, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(sqlitewraper.context, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {

            return;
        }
        lastLocation = LocationServices.FusedLocationApi.getLastLocation(googleApiClient);
        if (lastLocation != null) {
            Log.i(TAG, "LasKnown location. " +
                    "Long: " + lastLocation.getLongitude() +
                    " | Lat: " + lastLocation.getLatitude());
//            startLocationUpdates();
        } else {
            Log.w(TAG, "No location retrieved yet");
//            startLocationUpdates();
        }

    }

    @Override
    public void onLocationChanged(Location location) {
        lastLocation = location;
        Log.d(TAG, String.valueOf(location.getLatitude()));
    }

//    // Start location Updates
//    private void startLocationUpdates() {
//        Log.i(TAG, "startLocationUpdates()");
//        locationRequest = LocationRequest.create()
//                .setPriority(LocationRequest.PRIORITY_HIGH_ACCURACY)
//                .setInterval(UPDATE_INTERVAL)
//                .setFastestInterval(FASTEST_INTERVAL);
//
//        if (ActivityCompat.checkSelfPermission(sqlitewraper.context, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(sqlitewraper.context, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
//            return;
//        }
//        LocationServices.FusedLocationApi.requestLocationUpdates(googleApiClient, locationRequest, this);
//    }


    //redraw the pending intent
    public void redrawpendingWithExit(String placeid){


        Cursor c2 = database.rawQuery(
                "select latitude,longitude,radius,flow_id from geofence_tracking where place_id='"+placeid+"'", null);

        int pendinggeofence = c2.getCount();

        String lat;
        String lng;
        String radius;
        String flow_id;

        c2.moveToFirst();

        if (pendinggeofence > 0) {
            LogUtils.writeGeofenceLogToFile("redrawpendingWithExit : " + placeid ,"re draw");

            for (int i = 0; i < pendinggeofence; i++) {
                lat = c2.getString(0);
                lng = c2.getString(1);
                radius = c2.getString(2);
                flow_id = c2.getString(3);

                if (radius.equalsIgnoreCase("0")) {
                    radius = getRadiusfromFlowmaster(flow_id);
                }

                Log.d("##getSiteInfo", placeid + ": Lat: " + lat);
                markerForGeofence(new LatLng(Double.parseDouble(lat), Double.parseDouble(lng)), placeid, Float.parseFloat(radius),1);
                c2.moveToNext();
            }
            c2.close();

        }

    }

    protected void startLocationUpdates() {
        mLocationRequest = new LocationRequest();
        mLocationRequest.setPriority(LocationRequest.PRIORITY_HIGH_ACCURACY);
        mLocationRequest.setInterval(UPDATE_INTERVAL);
        mLocationRequest.setFastestInterval(FASTEST_INTERVAL);
//        mLocationRequest.setSmallestDisplacement(100);
        if (ActivityCompat.checkSelfPermission(sqlitewraper.context, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(sqlitewraper.context, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
//            Toast.makeText(getApplicationContext(), "Enable Permissions", Toast.LENGTH_LONG).show();
        }

        LocationServices.FusedLocationApi.requestLocationUpdates(
                googleApiClient, mLocationRequest, this);
    }
}
