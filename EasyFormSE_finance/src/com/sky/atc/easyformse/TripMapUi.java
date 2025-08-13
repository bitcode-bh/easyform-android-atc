package com.sky.atc.easyformse;

import static com.sky.atc.easyformse.sqlitewraper.context;
import static com.sky.atc.easyformse.sqlitewraper.mainactivity;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.AlertDialog;
import android.app.PendingIntent;
import android.content.ContentValues;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.location.Address;
import android.location.Geocoder;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.RequiresApi;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentActivity;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import android.os.PowerManager;
import android.provider.Settings;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.ProgressBar;
import android.widget.Toast;

import com.commonsware.cwac.wakeful.WakefulIntentService;
import com.google.android.gms.common.api.GoogleApiClient;
import com.google.android.gms.common.api.ResultCallback;
import com.google.android.gms.common.api.Status;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.Geofence;
import com.google.android.gms.location.GeofencingClient;
import com.google.android.gms.location.GeofencingRequest;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.SupportMapFragment;
import com.google.android.gms.maps.model.CameraPosition;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.Marker;
import com.sky.atc.easyformse.attendance.newattendanceutils.AttendanceUtil;
import com.sky.atc.easyformse.attendance.newattendanceutils.attendanceutils.AttendanceTaskUtil;
import com.sky.atc.easyformse.attendance.newattendanceutils.models.AttendanceData;
import com.sky.atc.easyformse.datautils.MySharedPreferences;

import com.sky.atc.easyformse.geofencenew.GeofenceTrasitionServicenew;

import net.sqlcipher.Cursor;
import net.sqlcipher.database.SQLiteDatabase;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Locale;

import io.michaelrocks.paranoid.Obfuscate;

//Open Map for Trip start and end and Insert data into databse
@Obfuscate
public class TripMapUi extends FragmentActivity implements OnMapReadyCallback, ResultCallback<Status> {

    private static final String MY_PREFS_NAME = "MY_TRIP";
    LatLng pointOne;
    Context context;
    Button btnBack;
    Location mLocation;
    GoogleApiClient mGoogleApiClient;
    SQLiteDatabase database;
    Marker marker;
    MySharedPreferences editor;
    String tid;
    String tripstatus;
    private double pointOneLat;
    private double pointOneLang;
    private String uniqtripid;
    private GoogleMap mMap;
    private Button refreshLat;
    private LocationRequest mLocationRequest;
    private long UPDATE_INTERVAL = 15000;  /* 15 secs */
    private long FASTEST_INTERVAL = 1000; /* 5 secs */
    private float accuracy1;
    private float speed;
    private String provider;
    private String odometerpoint;
    private boolean isClickable = true;
    private boolean isFirstUpdate = true;
    ProgressBar progressBar;
    private boolean isfinished;
    private String etaFlag;
    private boolean isAlert;
    private LocationManager locationManager;
    LocationListener locationListener;

    //Fused Location provider
    private FusedLocationProviderClient fusedLocationClient;
    private LocationCallback locationCallback;
    private LocationRequest locationRequest;
    MySharedPreferences pref = sqlitewraper.getSecureShared("MyPref");

    private static final int PERMISSION_REQUEST_CODE = 101;
    private String[] locationPermissions = {
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_BACKGROUND_LOCATION
    };
    private static final int REQUEST_CODE_LOCATION = 101;
    boolean alltimelocation = false;
    private final static int GEOFENCE_REQ_CODE = 0;
    private PendingIntent geoFencePendingIntent;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        setContentView(R.layout.tripmap_layout);

        SupportMapFragment mapFragment = (SupportMapFragment) getSupportFragmentManager().findFragmentById(R.id.map);
        mapFragment.getMapAsync(this);
        btnBack = (Button) findViewById(R.id.btn_back);
        refreshLat = (Button) findViewById(R.id.btn_refresh);


        database = sqlitewraper.getDatabase();
        refreshLat.setClickable(false);
        refreshLat.setEnabled(false);
        progressBar = (ProgressBar) findViewById(R.id.progress_bar);
//        locationProvider();
//        locationManagerGPS();
        progressBar.setVisibility(View.VISIBLE);


        tid = getIntent().getExtras().getString("tid");
        tripstatus = getIntent().getExtras().getString("tripstatus");
        odometerpoint = getIntent().getExtras().getString("odometer_point");
        etaFlag = getIntent().getExtras().getString("ETA");

        updateTripflagTaskMaster(tid, "1");

        //Cancle the trip(NOT IN USE)
        btnBack.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                btnBack.setBackgroundDrawable(getResources().getDrawable(R.drawable.button_selected));
                Bundle b = new Bundle();
                b.putString("result", "outside");
                Intent intent = new Intent();
                intent.putExtras(b);
                setResult(RESULT_CANCELED, intent);
                finish();
            }
        });
        //click on refresh lat (Not in use)
        refreshLat.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                refreshLat.setBackgroundDrawable(getResources().getDrawable(R.drawable.button_selected));
//                tripStart(pointOneLat,pointOneLang,uniqtripid);

                if (isClickable) {

//                  latPlugUpdate(tid, tripstatus, odometerpoint);
                    Bundle b = new Bundle();
                    Intent intent = new Intent();
                    intent.putExtras(b);
                    setResult(RESULT_OK, intent);
                    finish();
                    isClickable = false;

                }
            }

        });



    }

    //Load map
    @Override
    public void onMapReady(GoogleMap googleMap) {


        context = TripMapUi.this;
        mMap = googleMap;
//        mMap.addMarker(new MarkerOptions().position(pointOne).title("Trip start point !!")).showInfoWindow();
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            return;
        }
        mMap.setMyLocationEnabled(true);

    }


    //request for GPS location update
    private void locationManagerGPS() {
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            return;
        }
        locationManager =
                (LocationManager) this.getSystemService(Context.LOCATION_SERVICE);
        boolean isgps = locationManager
                .isProviderEnabled(LocationManager.GPS_PROVIDER);
        locationListener = new MyLocationListener();

        locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 2000, 0, locationListener);
    }


    //for Zoom  marker Position ans start the trip
    private void pointToPosition(final LatLng position, int zoomlevel) {

        float zoom;


        //tripstatus=0 start 1= trip end
        if (tripstatus.equalsIgnoreCase("0")) {

            refreshLat.setText("Starting Trip please wait...");
            mMap.clear();
            if (pointOneLat != 0.0 || pointOneLang != 0.0) {


                refreshLat.setEnabled(false);
                zoom = 14.5F;
                CameraPosition cameraPosition = new CameraPosition.Builder()
                        .target(position)
                        .zoom(zoom).build();
                mMap.animateCamera(CameraUpdateFactory.newCameraPosition(cameraPosition));

                isfinished = true;

                new GetHashesFromServerTask().execute("");
            }

        }
        if (tripstatus.equalsIgnoreCase("1")) {
            refreshLat.setText("Stopping Trip please wait...");
            mMap.clear();

            if (pointOneLat != 0.0 || pointOneLang != 0.0) {


                refreshLat.setEnabled(false);
                zoom = 14.5F;
                CameraPosition cameraPosition = new CameraPosition.Builder()
                        .target(position)
                        .zoom(zoom).build();
                mMap.animateCamera(CameraUpdateFactory.newCameraPosition(cameraPosition));


                isfinished = true;
                new GetHashesFromServerTask().execute("");

            }


        }

        if (zoomlevel == 2) {

            float zoom1 = mMap.getCameraPosition().zoom;
            CameraPosition cameraPosition = new CameraPosition.Builder()
                    .target(position)
                    .zoom(zoom1).build();
            mMap.animateCamera(CameraUpdateFactory.newCameraPosition(cameraPosition));

        } else {

            refreshLat.setEnabled(false);
            zoom = 14.5F;
            CameraPosition cameraPosition = new CameraPosition.Builder()
                    .target(position)
                    .zoom(zoom).build();
            mMap.animateCamera(CameraUpdateFactory.newCameraPosition(cameraPosition));

        }

    }

    @Override
    protected void onStart() {
        super.onStart();

//        if (mGoogleApiClient != null) {
//            mGoogleApiClient.connect();
//        }
    }

    @Override
    protected void onResume() {
        super.onResume();

        checkActivityRecognitionPermission();

//        if (mGoogleApiClient != null) {
//            mGoogleApiClient.connect();
//        }


        Log.d("##STARTLOCATIONUPDATES", "1");

    }

    private class MyLocationListener implements LocationListener {

        @Override
        public void onLocationChanged(@NonNull Location location) {

        startEndLocationInsert(location);
//        pointOneLat = location.getLatitude();
//        pointOneLang = location.getLongitude();
//        accuracy1 = location.getAccuracy();
//        speed = location.getSpeed();
//        provider = location.getProvider();
//        isAlert=true;
//        if (pointOneLat != 0.0 || pointOneLang != 0.0) {
//
//            pointOne = new LatLng(pointOneLat, pointOneLang);
//
//            if (isFirstUpdate) {
//                pointToPosition(pointOne, 1);
//                isFirstUpdate = false;
//            }
//            if (!isfinished) {
//                isfinished = true;
//                pointToPosition(pointOne, 0);
//            }
//        }
    }

        @Override
        public void onProviderDisabled(String provider) {
        }

        @Override
        public void onProviderEnabled(String provider) {
        }

        @Override
        public void onStatusChanged(String provider, int status, Bundle extras) {
        }
    }

//    @Override
//    public void onConnected(@Nullable Bundle bundle) {
//
//        if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
//            return;
//        }
//        mLocation = LocationServices.FusedLocationApi.getLastLocation(mGoogleApiClient);
//
//        if (mLocation != null) {
//        }
//        startLocationUpdates();
//    }


    protected void startLocationUpdates() {
        mLocationRequest = new LocationRequest();
        mLocationRequest.setPriority(LocationRequest.PRIORITY_HIGH_ACCURACY);
        mLocationRequest.setInterval(UPDATE_INTERVAL);
        mLocationRequest.setFastestInterval(FASTEST_INTERVAL);
        mLocationRequest.setSmallestDisplacement(0);
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            Toast.makeText(getApplicationContext(), "Enable Permissions", Toast.LENGTH_LONG).show();
        }
//
//        LocationServices.FusedLocationApi.requestLocationUpdates(
//                mGoogleApiClient, mLocationRequest, this);

    }

//    @Override
//    public void onConnectionSuspended(int i) {
//
//    }

//    @Override
//    public void onConnectionFailed(@NonNull ConnectionResult connectionResult) {
//
//
//    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        stopLocationUpdates();
    }


    public void stopLocationUpdates() {
        if (locationManager != null) {
            locationManager.removeUpdates(locationListener);
        }
    }

//    public void stopLocationUpdates() {
//        if (mGoogleApiClient.isConnected()) {
//            LocationServices.FusedLocationApi
//                    .removeLocationUpdates(mGoogleApiClient, this);
//            mGoogleApiClient.disconnect();
//        }
//    }

//    public void locationProvider() {
//        mGoogleApiClient = new GoogleApiClient.Builder(this)
//                .addApi(LocationServices.API)
//                .addConnectionCallbacks(this)
//                .addOnConnectionFailedListener(this)
//                .build();
//    }


    //start and End the trip and insert data in to database
    private void latPlugUpdate(String tid, String trip_status, String odometerpoint, String etaFlag) {


        editor = sqlitewraper.getSecureShared(MY_PREFS_NAME);

        String siteLng = "0";
        String siteLat = "0";
        String sid = "0";
        String millisecond = "0";
        String step_id = "1";
        String checkid = "0";
        String s_lat = "0";
        String s_lon = "0";

        String unique_trip_id = null;
        String site_name = null;
        String matchKeyID = null;

        Cursor c1 = database
                .rawQuery(
                        "select lat,long,server_task_id,millisecond,checksheetid,site_name,match_temp_id from task_master where tid="
                                + tid, null);
        c1.moveToFirst();
        int count = c1.getCount();

        if (count > 0) {
            for (int i = 0; i < c1.getCount(); i++) {

                siteLat = c1.getString(0);
                siteLng = c1.getString(1);
                sid = c1.getString(2);
                millisecond = c1.getString(3);
                checkid = c1.getString(4);
                site_name = c1.getString(5);
                matchKeyID = c1.getString(6);
            }
        }

        if (siteLat == null) {
            siteLat = "0";
        }

        if (siteLng == null) {
            siteLng = "0";
        }
        if (sid == null) {
            sid = "0";
        }
        if (checkid == null) {
            checkid = "0";
        }
        if (site_name == null) {
            site_name = "0";
        }
        if (matchKeyID == null) {
            matchKeyID = "0";
        }

        c1.close();

        Cursor c3 = database.rawQuery(
                "SELECT appid FROM  Login_Master", null);

        c3.moveToFirst();
        int count3 = c3.getCount();

        if (count3 > 0) {
            unique_trip_id = c3.getString(0);
        }

        unique_trip_id = unique_trip_id + "_" + System.currentTimeMillis();
        c3.close();


        s_lat = String.valueOf(pointOneLat);
        s_lon = String.valueOf(pointOneLang);


        ContentValues latc = new ContentValues();

        latc.put("sid", Integer.valueOf(sid));
        latc.put("d_lat", siteLat);
        latc.put("d_lon", siteLng);
        latc.put("isacc", "0");
        latc.put("isshort", "0");
        latc.put("iseve", "0");
        latc.put("isdv_eve", "0");
        latc.put("issend", "0");
        latc.put("step", Integer.valueOf(step_id));
        latc.put("chkid", checkid);
        latc.put("tid", Integer.valueOf(tid));
        latc.put("odometer_point", odometerpoint);
        latc.put("trip_status", trip_status);
        latc.put("site_name", site_name);
        latc.put("sh_path", "");
        latc.put("ac_path", "");
        latc.put("Event", "");
        latc.put("etaflag", etaFlag);
        latc.put("match_temp_id", matchKeyID);


        //start the trip
        if (trip_status.equalsIgnoreCase("0")) {





            Cursor c4 = database
                    .rawQuery(
                            "select s_lat,s_lon,llat,llon from lat_plug where trip_shflag=0 and tid='" + tid + "'", null);
            c4.moveToFirst();
            int j2 = c4.getCount();
            //if (j2 == 0) {

//                long temp = database.insert("lat_plug", null, latc);
//                Log.d("##TripPluginInsert", String.valueOf(temp));
                String t;

                t = "tid='" + tid + "' and trip_status='" + 0 + "'";

                latc.put("unique_trip_id", unique_trip_id);
                latc.put("s_lat", s_lat);
                latc.put("s_lon", s_lon);
                latc.put("last_upload_ms", "0");
                latc.put("way_point", "NA");
                latc.put("trip_shflag", "0");
                //  latc.put("min_milli", System.currentTimeMillis());
                editor.putString("unique_trip_id", unique_trip_id);
                editor.putString("slat", s_lat);
                editor.putString("slon", s_lon);
                editor.putString("trip_start_battery", String.valueOf(DeviceEventsUtils.getBatteryInfo()));
                editor.commit();

                insertTrackmaster(s_lat, s_lon);
                insertLocation_log_Tbl(s_lat, s_lon);

                Check_PowerSavingMode(trip_status);  // check power saving mode on off in trip start time 29072025
            // location get after update lat_plug entry for start trip 07072025
                long temp = database.update("lat_plug", latc, t, null);
            AttendanceData mAttendanceData = AttendanceUtil.getAttendanceDataList().get(0);
            String Duration ;
            boolean shouldStopTrip = false;
            if(mAttendanceData.getAuto_punchout_duration() != null) {
                try {
                    Duration = mAttendanceData.getAuto_punchout_duration();
                    if (isAfterDuaration(Duration)) {
                        shouldStopTrip = true;
                    }
                } catch (NumberFormatException e) {
                    // log warning if needed
                }
            }
            if (shouldStopTrip) {
                    MySharedPreferences pref1 = sqlitewraper.getSecureShared("MyPref");
                    pref1.putBoolean("ISTripStartAfter6PM",true);
                    pref1.commit();
                    startgeofence(new LatLng(Double.parseDouble(s_lat), Double.parseDouble(s_lon)),200,tid,1);
                }

                //for ETA
                Intent i = new Intent(sqlitewraper.context, TripService.class);
                WakefulIntentService.sendWakefulWork(sqlitewraper.context, i);
          //  }
            c4.close();

        } else {

            //For Ending the trip
            editor.putString("llat", s_lat);
            editor.putString("llon", s_lon);
            editor.commit();


            pref.putString("event_start","0");
            pref.putBoolean("isAlarmSet",false);
            pref.commit();

            MySharedPreferences prefs = sqlitewraper.getSecureShared(MY_PREFS_NAME);
            String restoredText = prefs.getString("tid", null);
            if (restoredText != null) {
                unique_trip_id = prefs.getString("unique_trip_id", "");//"No name defined" is the default value.
            }

            //new tid logic

            String t;

            t = "tid='" + tid + "' and trip_status='" + 0 + "'";
            //insert lat long in to track_master
            insertTrackmaster(s_lat, s_lon);
            insertLocation_log_Tbl(s_lat, s_lon);

            Check_PowerSavingMode(trip_status);  // check power saving mode on off in trip start time 29072025

            latc.put("trip_shflag", "1");
            latc.put("max_milli", System.currentTimeMillis());
            latc.put("llat", s_lat);
            latc.put("llon", s_lon);

            long temp = database.update("lat_plug", latc, t, null);
            Log.d("##TripUpdate", String.valueOf(temp));

            //Check availability of trip if already running or not
            //if not than start and end trip with current lat/long
            if (temp == 0) {
                checkAvailibilityOftrip(tid, latc, s_lat, s_lon, unique_trip_id);
            }
//            Attendance flag true trip end time update task_master notiflag
//            String Attendance = pref.getString("Attendance","false");
//            if(Attendance.equalsIgnoreCase("true"))
//            {
//                AttendanceData mAttendanceData = AttendanceUtil.getAttendanceDataList().get(0);
//                String t_id = AttendanceTaskUtil.getTaskMasterTid(sqlitewraper.getDatabase(),Integer.valueOf( mAttendanceData.getFlowId()), mAttendanceData.getKey(), DeviceEventsUtils.getLoginDetails().get(3), DeviceEventsUtils.getLoginDetails().get(0));
//                AttendanceTaskUtil.updateTaskmaster(sqlitewraper.getDatabase(), t_id,mAttendanceData.getPunchout_Status());
//            }

            //update the task master flag for upload
            String cnd;
            cnd = "tid=" + tid;
            ContentValues c_path = new ContentValues();
            c_path.put("flag", "1");
            long temp2 = database.update("task_master",
                    c_path, cnd, null);

            //start the upload service
            Intent i = new Intent(sqlitewraper.context, f_upload_new_structure.class);
            WakefulIntentService.sendWakefulWork(sqlitewraper.context, i);

        }
    }

    private boolean isAfter6PM() {
        Calendar now = Calendar.getInstance();
        int hour = now.get(Calendar.HOUR_OF_DAY);
        return hour >= 18;
    }
    private boolean isAfterDuaration(String value) {
        if (value == null || value.isEmpty()) {
            return false; // Handle empty or null input safely
        }

        // Split the string value by ":"
        String[] timeParts = value.split(":");
        if (timeParts.length != 2) {
            return false; // If the string doesn't contain a valid hour:minute format, return false
        }

        try {
            int valueHour = Integer.parseInt(timeParts[0]); // Hour part (e.g., "14" -> 14)
            int valueMinute = Integer.parseInt(timeParts[1]); // Minute part (e.g., "00" -> 0)

            // Get the current time
            Calendar now = Calendar.getInstance();
            int currentHour = now.get(Calendar.HOUR_OF_DAY); // Current hour (0-23)
            int currentMinute = now.get(Calendar.MINUTE); // Current minute (0-59)

            // If the current time hour is greater than the input value hour
            if (currentHour > valueHour) {
                return true;
            }
            // If the current time hour is equal to the input value hour, compare minutes
            else if (currentHour == valueHour) {
                return currentMinute >= valueMinute; // If minutes are equal or after the specified minutes, return true
            }
            return false; // If the current time is before the input time
        } catch (NumberFormatException e) {
            return false; // If parsing fails, handle gracefully by returning false
        }
    }
    private void startgeofence(LatLng geoFenceMarker,float Radius ,String siteid,int enterExitflag) {
        if (geoFenceMarker != null) {
            Geofence geofence = createGeofence(geoFenceMarker, Radius, siteid);
            GeofencingRequest geofenceRequest = createGeofenceRequest(geofence,enterExitflag);
            addGeofence(geofenceRequest);
        }
    }

    private Geofence createGeofence(LatLng latLng, float radius, String siteid) {

        return new Geofence.Builder()
                .setRequestId(String.valueOf(siteid))
                .setCircularRegion(latLng.latitude, latLng.longitude, radius)
                .setExpirationDuration(Geofence.NEVER_EXPIRE)
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


    private GoogleApiClient googleApiClient;
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

    @SuppressLint("WrongConstant")
    private PendingIntent createGeofencePendingIntent() {
        if (geoFencePendingIntent != null)
            return geoFencePendingIntent;

        Intent intent = new Intent(sqlitewraper.context, GeofenceTrasitionServicenew.class);
        int flag = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S)
        {
            flag = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_MUTABLE;
        }
        geoFencePendingIntent = PendingIntent.getService(
                sqlitewraper.context,
                GEOFENCE_REQ_CODE,
                intent,
                flag
        );
        return geoFencePendingIntent;
    }


    @Override
    public void onResult(@NonNull Status status) {
        if (status.isSuccess()) {

        } else {
        }
    }

    public void insertTrackmaster(String lat, String lon) {


        android.database.Cursor a_t = database.rawQuery(
                "select value from APP_states where ITEAM ='nick'", null);
        a_t.moveToFirst();
        int j = a_t.getCount();

        j++;

        String username = null;
        if (a_t.getCount() > 0) {

            username = a_t.getString(0);
        }

//        String add = getCompleteAddressString(Double.parseDouble(lat), Double.parseDouble(lon));
        String add = AddressApi.getCompleteAddress(Double.parseDouble(lat), Double.parseDouble(lon));
        Date now = new Date();

        Long time = now.getTime();
        String Date1 = now.toString();

        ContentValues args1 = new ContentValues();
        args1.put("cellid", add);
        args1.put("lat", DeviceEventsUtils.LatlngRoundff(lat));
        args1.put("date", time.toString());
        args1.put("date_s", Date1);
        args1.put("lon", DeviceEventsUtils.LatlngRoundff(lon));
        args1.put("provider", "gps");
        args1.put("accuracy",accuracy1);
        args1.put("speed", "0.0");
        args1.put("IS_SEND", 0);
        args1.put("IS_LOC", time);
        args1.put("address", add);
        args1.put("username", username);
        args1.put("tripflag", "2");

        long temp_mast = database.insert("track_master", null, args1);

    }


    @Override
    public void onBackPressed() {

        if (tripstatus.equalsIgnoreCase("0")) {

            Toast.makeText(context, "Please start trip first", Toast.LENGTH_LONG).show();
        } else {

            Toast.makeText(context, "Please stop trip first", Toast.LENGTH_LONG).show();
        }

    }

    @Override
    protected void onPause() {
        super.onPause();
        stopLocationUpdates();
    }


    private class GetHashesFromServerTask extends AsyncTask<String, String, String> {
        ShowProgress progress = new ShowProgress();

        @Override
        protected void onPreExecute() {

//            progress.showProgressDialog(TripMapUi.this, "Please wait...");
        }

        @Override
        protected String doInBackground(String... postParams) {
            latPlugUpdate(tid, tripstatus, odometerpoint, etaFlag);
            return null;
        }


        @Override
        protected void onPostExecute(String status) {
            super.onPostExecute(status);

            stopLocationUpdatesFused();
//            progress.hideProgressDialog(TripMapUi.this);
            if (tripstatus.equalsIgnoreCase("0")) {
                updateTripflagTaskMaster(tid, "2");
            }

            //TripMapBackground  startMilli=0  logic
            if (tripstatus.equalsIgnoreCase("1")) {
                Intent intent = new Intent("trip-end-event");
                LocalBroadcastManager.getInstance(sqlitewraper.context).sendBroadcast(intent);
            }

            isfinished = true;
            Bundle b = new Bundle();
            Intent intent = new Intent();
            intent.putExtras(b);
            setResult(RESULT_OK, intent);
            finish();
            progressBar.setVisibility(View.GONE);
        }
    }

    private void checkAvailibilityOftrip(String tid, ContentValues latc, String s_lat, String s_lon, String unique_trip_id) {

        Cursor c = database.rawQuery("select trip_status from lat_plug where tid='" + tid + "'", null);
        c.moveToFirst();
        int j1 = c.getCount();
        if (j1 == 0) {

            //remove this query
            Cursor c4 = database
                    .rawQuery(
                            "select s_lat,s_lon,llat,llon from lat_plug where trip_shflag=0 and tid='" + tid + "'", null);
            c4.moveToFirst();
            int j2 = c4.getCount();
            if (j2 == 0) {


                latc.put("unique_trip_id", unique_trip_id);
                latc.put("s_lat", s_lat);
                latc.put("s_lon", s_lon);
                latc.put("last_upload_ms", "0");
                latc.put("way_point", "NA");
                latc.put("trip_shflag", "0");
                latc.put("min_milli", System.currentTimeMillis());
                latc.put("trip_shflag", "1");
                latc.put("max_milli", System.currentTimeMillis());
                latc.put("llat", s_lat);
                latc.put("llon", s_lon);

                long temp = database.insert("lat_plug", null, latc);
                Log.d("##TripPluginInsert", String.valueOf(temp));
            }
            c4.close();

        }
        c.close();


    }

    //Showing alert dialog if unable to fetch location
    public void showAlertDelayLatLong(String message) {

        AlertDialog alertDialog = new AlertDialog.Builder(this).create();
        alertDialog.setTitle("Unable to get your location");
        alertDialog.setMessage(message);
        alertDialog.setCancelable(false);
        alertDialog.setButton(AlertDialog.BUTTON_NEUTRAL, "OK",
                new DialogInterface.OnClickListener() {
                    public void onClick(DialogInterface dialog, int which) {

//                        Bundle b = new Bundle();
//                        Intent intent = new Intent();
//                        intent.putExtras(b);
//                        setResult(RESULT_CANCELED, intent);
//                        finish();
//                        dialog.dismiss();
//                        finish();

                        // change location get call method
                        locationManagerGPS();

//                        fusedLocationClient = LocationServices.getFusedLocationProviderClient(getApplicationContext());
//                        locationRequest = createLocationRequestNew();
//                        onLocationChanged();
//                        startLocationUpdatesFused();
//                        manageHandler(20000);
                    }
                });

        alertDialog.show();
    }

    protected LocationRequest createLocationRequestNew() {
        LocationRequest locationRequest = LocationRequest.create();
        locationRequest.setInterval(5000);
        locationRequest.setFastestInterval(2000);
        locationRequest.setPriority(LocationRequest.PRIORITY_HIGH_ACCURACY);
        locationRequest.setSmallestDisplacement(0);
        return locationRequest;
    }

    private void onLocationChanged() {

        locationCallback = new LocationCallback() {
            @Override
            public void onLocationResult(LocationResult locationResult) {
                if (locationResult == null) {
                    return;
                }
                for (Location location : locationResult.getLocations()) {
                    Log.d("##LOCATIONSERVIE", String.valueOf(location.getAccuracy()));
                    startEndLocationInsert(location);
                }
            }
        };
    }

    private void startLocationUpdatesFused() {
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            // TODO: Consider calling
            //    ActivityCompat#requestPermissions
            // here to request the missing permissions, and then overriding
            //   public void onRequestPermissionsResult(int requestCode, String[] permissions,
            //                                          int[] grantResults)
            // to handle the case where the user grants the permission. See the documentation
            // for ActivityCompat#requestPermissions for more details.
            return;
        }
        fusedLocationClient.requestLocationUpdates(locationRequest,
                locationCallback,
                Looper.getMainLooper());
    }


    private void startEndLocationInsert(Location location) {


        location.setSpeed(0.0f);

        pointOneLat = location.getLatitude();
        pointOneLang = location.getLongitude();
        accuracy1 = location.getAccuracy();
        speed = location.getSpeed();
        provider = location.getProvider();
        isAlert = true;
        if (pointOneLat != 0.0 || pointOneLang != 0.0) {

            pointOne = new LatLng(pointOneLat, pointOneLang);

            if (isFirstUpdate) {
                pointToPosition(pointOne, 1);
                isFirstUpdate = false;
            }
            if (!isfinished) {
                isfinished = true;
                pointToPosition(pointOne, 0);
            }
        }

    }


    private void stopLocationUpdatesFused() {

        if (fusedLocationClient != null) {

            if (locationCallback != null) {
                fusedLocationClient.removeLocationUpdates(locationCallback);
            }
        }

    }

    private void manageHandler(long delayMillis) {

        new Handler().postDelayed(new Runnable() {
            @Override
            public void run() {

                if (!isAlert) {
                    showAlertDelayLatLong("Application is unable to get your location hence it is taking more time.please be patient & wait for little longer.");
//                    showAlertDelayLatLong("App is unable to get your GPS location , keep your device in open space and retry after restarting your GPS service.");
                }
            }
        }, delayMillis);
    }

    private void manageHandlerFused(long delayMillis) {

        new Handler().postDelayed(new Runnable() {
            @Override
            public void run() {
                fusedLocationClient = LocationServices.getFusedLocationProviderClient(getApplicationContext());
                locationRequest = createLocationRequestNew();
                onLocationChanged();
                startLocationUpdatesFused();
            }
        }, delayMillis);
    }

    private void updateTripflagTaskMaster(String tid, String tripflag) {

        if (tripstatus.equalsIgnoreCase("0")) {
            String t;
            t = "tid='" + tid + "'";
            ContentValues t_i = new ContentValues();
            t_i.put("tripflag", tripflag);
            long task = database.update("task_master", t_i, t, null);
        }
    }

    // trip start and end time insert entry in location_log tbl and upload
    public void insertLocation_log_Tbl(String lat, String lon) {


        android.database.Cursor a_t = database.rawQuery(
                "select value from APP_states where ITEAM ='nick'", null);
        a_t.moveToFirst();
        int j = a_t.getCount();

        j++;

        String username = null;
        if (a_t.getCount() > 0) {

            username = a_t.getString(0);
        }

//        String add = getCompleteAddressString(Double.parseDouble(lat), Double.parseDouble(lon));
        String add = AddressApi.getCompleteAddress(Double.parseDouble(lat), Double.parseDouble(lon));
        Date now = new Date();

        Long time = now.getTime();
        String Date1 = now.toString();

        String imei1 = DeviceEventsUtils.getLoginDetails().get(1);
        ContentValues args = new ContentValues();
        args.put("cellid", imei1);
        args.put("lat", DeviceEventsUtils.LatlngRoundff(lat));
        args.put("date", time);
        args.put("date_s", Date1);
        args.put("lon", DeviceEventsUtils.LatlngRoundff(lon));
        args.put("provider", "gps");
        args.put("accuracy", accuracy1);
        args.put("IS_SEND", 0);
        args.put("IS_LOC", time);
        args.put("address", add);
        args.put("wait_time", time);
        args.put("wait_time_s", Date1);
        args.put("username", username);
        args.put("speed", 0);
        //lac column is use for check the trip status
        //true means trip start false means trip not start
        args.put("lac",DeviceEventsUtils.tripStatus());

        long temp = database.insert("location_log", null, args);

//            upload location entry into server
        Intent location = new Intent(sqlitewraper.context, location_server.class);
        WakefulIntentService.sendWakefulWork(sqlitewraper.context,
                location);

    }

//    public boolean checkPermission() {
//        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACTIVITY_RECOGNITION)
//                != PackageManager.PERMISSION_GRANTED) {
//            // Permission is not granted
//            return false;
//        }
//        return true;
//    }

//    public void requestPermission() {
//        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
//            ActivityCompat.requestPermissions(TripMapUi.this,
//                    new String[]{Manifest.permission.ACTIVITY_RECOGNITION},
//                    PERMISSION_REQUEST_CODE);
//        }
//        else {
//
//            //if location does not received than show message after delay
////            manageHandler(30000);
////            //start the fused location update
////            manageHandlerFused(20000);
//            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
//                Locationpermissioncheck();
//            }
//        }
//    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String permissions[], int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);

        if (requestCode == PERMISSION_REQUEST_CODE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                checkLocationPermissions();
            } else {
                //Toast.makeText(getApplicationContext(), "Permission Denied", Toast.LENGTH_SHORT).show();
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACTIVITY_RECOGNITION)
                        != PackageManager.PERMISSION_GRANTED) {

                    showMessageOKCancel("You need to allow access Physical activity permissions",
                            new DialogInterface.OnClickListener() {
                                @Override
                                public void onClick(DialogInterface dialog, int which) {
                                    Intent intent = new Intent();
                                    intent.setAction(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                                    intent.setData(Uri.fromParts("package", mainactivity.getPackageName(), null));
                                    mainactivity.startActivity(intent);
                                    finish();
                                }
                            });
                    }
                }
            }
        }
    }

    private void showMessageOKCancel(String message, DialogInterface.OnClickListener okListener) {
        new AlertDialog.Builder(TripMapUi.this)
                .setMessage(message)
                .setPositiveButton("OK", okListener)
                .setCancelable(false)
                .create()
                .show();
    }
    private void checkActivityRecognitionPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACTIVITY_RECOGNITION)
                    != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this,
                        new String[]{Manifest.permission.ACTIVITY_RECOGNITION},
                        PERMISSION_REQUEST_CODE);
            }
            else {
                checkLocationPermissions();
            }
        }
        else {
            checkLocationPermissions();
        }
    }
    private void checkLocationPermissions() {
        if (!hasLocationPermissions()) {
//            ActivityCompat.requestPermissions(this, locationPermissions, REQUEST_CODE_LOCATION);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                Locationpermissioncheck();
            }
            else {
                manageHandler(30000);
                //start the fused location update
                manageHandlerFused(200);
            }
        } else {
            manageHandler(30000);
            //start the fused location update
            manageHandlerFused(200);
        }
    }
    private boolean hasLocationPermissions() {
        for (String permission : locationPermissions) {
            if (ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED)
                return false;
        }
        return true;
    }
    @RequiresApi(api = Build.VERSION_CODES.Q)
    public void Locationpermissioncheck()
    {
//        int bgLocation = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_BACKGROUND_LOCATION);
//        int coarseLocation = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION);
//
//        boolean isAppLocationPermissionGranted = (bgLocation == PackageManager.PERMISSION_GRANTED) &&
//                (coarseLocation == PackageManager.PERMISSION_GRANTED);
        AlertDialog alertDialog = null;
       // if (!hasLocationPermissions()) {
            alertDialog = new AlertDialog.Builder(this).create();
            alertDialog.setTitle("Missing Permission!");
            alertDialog.setCancelable(false);
            alertDialog.setMessage("We need background location access to track your trip in real-time, even when the app is running in the background.\n\nin your mobile go to :  Permissions > Location > Select Allow all the time\n");
            alertDialog.setButton(AlertDialog.BUTTON_NEUTRAL, "Allow in Settings",
                    (dialog, which) -> {
                        dialog.dismiss();
                        Intent intent = new Intent();
                        intent.setAction(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                        intent.setData(Uri.fromParts("package", mainactivity.getPackageName(), null));
                        mainactivity.startActivity(intent);
                        alltimelocation = false;
//                        finish();
                    });

            if(!alltimelocation) {
                alertDialog.show();
                alltimelocation = true;
            }
      //  }
//        else {
//            manageHandler(30000);
//            //start the fused location update
//            manageHandlerFused(20000);
//
//
//        }
    }


    public void Check_PowerSavingMode(String trip_status)
    {
        boolean isPowerSaving;
        long PowersavingmodeOn;
        String Event_strt;
        String Event_end;
        String Event_type;

        PowerManager powerManager = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        isPowerSaving = powerManager.isPowerSaveMode();

        Date now = new Date();
        Long time = now.getTime();


        ArrayList<String> logindetails = new ArrayList<>();
        logindetails = DeviceEventsUtils.getLoginDetails();
        String userid = logindetails.get(0);
        String imei = logindetails.get(1);
        String appid = logindetails.get(2);
        String username1 = logindetails.get(3);


        ContentValues c = new ContentValues();
        c.put("username", username1);
        c.put("lat", DeviceEventsUtils.getCurrentLatLng().latitude);
        c.put("lon", DeviceEventsUtils.getCurrentLatLng().longitude);
        c.put("th_s", "");
        c.put("is_send", "0");
        c.put("battery", DeviceEventsUtils.getBatteryInfo());
        c.put("timezone", DeviceEventsUtils.getTimeZone());
        c.put("imei", imei);
        c.put("appid", appid);
        c.put("userid", userid);
        String tid = DeviceEventsUtils.gettid();
        c.put("tid",tid);
        if (isPowerSaving) {
            if(trip_status.equalsIgnoreCase("0")) {

                PowersavingmodeOn = time;
                c.put("Event_strt", PowersavingmodeOn);
                c.put("Event_end", "0");
                c.put("Event_type", "PowerSavingMode");
                c.put("duration", "0");
                c.put("utcstart", DeviceEventsUtils.utcCalculationOffset(PowersavingmodeOn));
                c.put("utcend", DeviceEventsUtils.utcCalculationOffset(0));

                long tempinsert = database.insert("Events", null, c);
            }
            else if(trip_status.equalsIgnoreCase("1"))
            {
                android.database.Cursor c2 = database.rawQuery("SELECT _id,Event_strt,Event_end,Event_type FROM  Events WHERE _id = " +
                    "(SELECT MAX(_id) FROM Events where Event_type in('Still','StillViolation','Vehicle','Walking','On Bicycle','On Foot','Running','PowerSavingMode') )", null);
                    c2.moveToFirst();



                if (c2.getCount() > 0) {
                    String id = c2.getString(0);
                    Event_strt = c2.getString(1);
                    Event_end = c2.getString(2);
                    Event_type = c2.getString(3);

                    if(Event_type.equalsIgnoreCase("PowerSavingMode")) {
                        if (Event_end.equalsIgnoreCase("0")) {

                          long  Duration = time - Long.parseLong(Event_strt);

                            String cnd;
                            cnd = "_id=" + id;
                            ContentValues c_path = new ContentValues();
                            c_path.put("Event_end", time);
                            c_path.put("duration", Duration);
                            c_path.put("utcend", DeviceEventsUtils.utcCalculationOffset(time));

                            long temp = database.update("Events", c_path, cnd, null);


                                Intent z_n12 = new Intent(sqlitewraper.context, Event.class);
                                WakefulIntentService.sendWakefulWork(sqlitewraper.context,
                                        z_n12);


                        }
                    }
                }
            }
        }


    }
}
