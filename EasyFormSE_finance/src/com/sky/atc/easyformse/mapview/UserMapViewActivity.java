package com.sky.atc.easyformse.mapview;

import android.Manifest;
import android.app.AlertDialog;
import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.StrictMode;
import android.provider.Settings;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.ImageButton;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.api.GoogleApiClient;
import com.google.android.gms.location.LocationListener;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.maps.CameraUpdate;
import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.SupportMapFragment;
import com.google.android.gms.maps.model.BitmapDescriptorFactory;
import com.google.android.gms.maps.model.CameraPosition;
import com.google.android.gms.maps.model.Circle;
import com.google.android.gms.maps.model.CircleOptions;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.LatLngBounds;
import com.google.android.gms.maps.model.Marker;
import com.google.android.gms.maps.model.MarkerOptions;
import com.sky.atc.easyformse.NotificationListener;
import com.sky.atc.easyformse.R;
import com.sky.atc.easyformse.ph_s;
import com.sky.atc.easyformse.sqlitewraper;

import net.sqlcipher.database.SQLiteDatabase;

import org.apache.cordova.CallbackContext;

import java.util.List;
import java.util.Timer;
import java.util.TimerTask;

import io.michaelrocks.paranoid.Obfuscate;

@Obfuscate
public class UserMapViewActivity extends AppCompatActivity implements OnMapReadyCallback, LocationListener, GoogleApiClient.ConnectionCallbacks,
        GoogleApiClient.OnConnectionFailedListener {

    private GoogleMap mMap;
    LatLng pointOne;
    LatLng pointTwo;
    Circle circle;
    Context context;
    private static final int PERMISSION_REQUEST_CODE = 1;
    LocationListener mlocListener;

    int i;
    Button btnBack;
    Button refreshLat;
    ImageButton siteBtn;
    TextView supportDetails;
    GoogleApiClient mGoogleApiClient;
    SQLiteDatabase database;


    double pointOneLat;
    double pointOneLang;

    double deviceLat;
    double deviceLng;

    String radius;
    String companyid;
    String provider;
    Location mLocation;
    private LocationRequest mLocationRequest;
    private long UPDATE_INTERVAL = 5000;  /* 15 secs */
    private long FASTEST_INTERVAL = 1000; /* 5 secs */
    private Marker markersite;
    private int mapcount = 0;

    //For Timer
    private final static int DELAY = 5000;
    private Timer timer = new Timer();
    LocalBroadcastManager localBroadcastManager;
    ProgressBar progressBar;
    View relativeLayout;
    TextView textView;
    private CallbackContext callbackContext;
    String receivertoken = null;
    String senderid = null;
    private String isGeofence;
    boolean showtoast = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_user_map_view);
        this.callbackContext = callbackContext;
        database = sqlitewraper.getDatabase();
        progressBar = (ProgressBar) findViewById(R.id.progress_bar);
        relativeLayout = (View) findViewById(R.id.mapoverview);
        textView = (TextView) findViewById(R.id.progressBarinsideText);

        localBroadcastManager = LocalBroadcastManager.getInstance(this);
        localBroadcastManager.registerReceiver((mMessageReceiver),
                new IntentFilter("MyData")
        );
        SupportMapFragment mapFragment = (SupportMapFragment) getSupportFragmentManager().findFragmentById(R.id.usermap);
        mapFragment.getMapAsync(this);

        Bundle extras = getIntent().getExtras();
        String userName;

        if (extras != null) {
            senderid = extras.getString("senderid");
            receivertoken = extras.getString("receivertoken");
            radius = extras.getString("radius");
            companyid = extras.getString("companyid");
            isGeofence = extras.getString("isGeofence");

            // and get whatever type user account id is
        }

        mlocListener = new UserMapViewActivity();

        //for running work on main Thread
        StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
        StrictMode.setThreadPolicy(policy);

        //send push notification to opponent to request his current location
        SendNotification.notification(sqlitewraper.context, "", "", "1", senderid, receivertoken, companyid);
        Toast.makeText(UserMapViewActivity.this, "Request Location", Toast.LENGTH_LONG).show();
        progressBar.setVisibility(View.VISIBLE);
        relativeLayout.setVisibility(View.VISIBLE);
        textView.setVisibility(View.VISIBLE);

        //start timer for every 30 seconds to request new location
        startUpdateTask();

        locationProvider();

        pointToPosition(pointOne, 0);



    }

    @Override
    public void onBackPressed() {
        if (timer != null) {
            timer.cancel();
        }
        Bundle b = new Bundle();
        Intent intent = new Intent();
        intent.putExtras(b);
        setResult(RESULT_CANCELED, intent);
        finish();
        super.onBackPressed();

    }

    @Override
    protected void onStart() {
        super.onStart();
        localBroadcastManager = LocalBroadcastManager.getInstance(this);
        localBroadcastManager.registerReceiver((mMessageReceiver),
                new IntentFilter("MyData")
        );
    }

    @Override
    public void onConnected(@Nullable Bundle bundle) {

        if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            return;
        }
        mLocation = LocationServices.FusedLocationApi.getLastLocation(mGoogleApiClient);

        if (mLocation != null) {
        }
        startLocationUpdates();
    }

    @Override
    public void onConnectionSuspended(int i) {

    }

    @Override
    public void onConnectionFailed(@NonNull ConnectionResult connectionResult) {

    }

    @Override
    public void onLocationChanged(Location location) {
        deviceLat = location.getLatitude();
        deviceLng = location.getLongitude();

        pointTwo = new LatLng(deviceLat, deviceLng);
        Log.e("location", String.valueOf(pointTwo));
        location.setAccuracy(LocationRequest.PRIORITY_HIGH_ACCURACY);
        float accuracy = location.getAccuracy();
        provider = location.getProvider();


        if (deviceLat != 0.0 || deviceLng != 0.0) {
//            countDistance();

        }
        if (mapcount == 0) {
            pointToPosition(pointTwo, 0);
            mapcount++;
        }
    }

    @Override
    public void onMapReady(GoogleMap googleMap) {
        context = UserMapViewActivity.this;
        mMap = googleMap;
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            return;
        }
        mMap.setMyLocationEnabled(true);

        if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            return;
        }
        mMap.setMyLocationEnabled(true);
        pointToPosition(pointOne, 0);

//
        Location location = getLastKnownLocation();
        if (location != null) {
            mMap.animateCamera(CameraUpdateFactory.newLatLngZoom(new LatLng(location.getLatitude(), location.getLongitude()), 13));
            CameraPosition cameraPosition = new CameraPosition.Builder()
                    .target(new LatLng(location.getLatitude(), location.getLongitude()))      // Sets the center of the map to location user
                    .zoom(12)                   // Sets the zoom
//                    .bearing(90)                // Sets the orientation of the camera to east
                    .build();                   // Creates a CameraPosition from the builder
            mMap.animateCamera(CameraUpdateFactory.newCameraPosition(cameraPosition));
        }

        if (isGeofence.equalsIgnoreCase("true")) {

            circle = mMap.addCircle(new CircleOptions()
                    .center(new LatLng(location.getLatitude(), location.getLongitude()))
                    .radius(Double.parseDouble(radius))
                    .strokeColor(0x37FF0000)
                    .fillColor(0x35FF0000));
        }

        mMap.setOnCameraChangeListener(new GoogleMap.OnCameraChangeListener() {
            @Override
            public void onCameraChange(CameraPosition cameraPosition) {
                deviceLat = cameraPosition.target.latitude;
                deviceLng = cameraPosition.target.longitude;
            }
        });

    }

    //for Zoom  marker Position
    private void pointToPosition(LatLng position, int i) {

        try {

            if (position != null) {

                if (i == 0) {

                    if (pointTwo != null) {
                        LatLngBounds.Builder builder = new LatLngBounds.Builder();
                        builder.include(markersite.getPosition());
                        builder.include(pointTwo);
                        LatLngBounds bounds = builder.build();
                        int padding = 150; // offset from edges of the map in pixels
                        CameraUpdate cu = CameraUpdateFactory.newLatLngBounds(bounds, padding);
                        // mMap.moveCamera(cu);
                        mMap.animateCamera(cu);
                    }
                }
                if (i == 1) {

//                    refreshLat.setText("Refresh Location");

                    refreshLat.setEnabled(true);

                    CameraPosition cameraPosition = new CameraPosition.Builder()
                            .target(position)
                            .zoom(15.5F).build();
                    mMap.animateCamera(CameraUpdateFactory.newCameraPosition(cameraPosition));

                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void locationProvider() {
        mGoogleApiClient = new GoogleApiClient.Builder(this)
                .addApi(LocationServices.API)
                .addConnectionCallbacks(this)
                .addOnConnectionFailedListener(this)
                .build();
    }

    protected void startLocationUpdates() {
        mLocationRequest = new LocationRequest();
        mLocationRequest.setPriority(LocationRequest.PRIORITY_HIGH_ACCURACY);
        mLocationRequest.setInterval(UPDATE_INTERVAL);
        mLocationRequest.setFastestInterval(FASTEST_INTERVAL);
//        mLocationRequest.setSmallestDisplacement(100);
        if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            Toast.makeText(getApplicationContext(), "Enable Permissions", Toast.LENGTH_LONG).show();
        }

        LocationServices.FusedLocationApi.requestLocationUpdates(
                mGoogleApiClient, mLocationRequest, this);

    }

    private Location getLastKnownLocation() {
        LocationManager mLocationManager;
        mLocationManager = (LocationManager) getApplicationContext().getSystemService(LOCATION_SERVICE);
        List<String> providers = mLocationManager.getProviders(true);
        Location bestLocation = null;
        for (String provider : providers) {
            if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {

                return null;
            }
            Location l = mLocationManager.getLastKnownLocation(provider);
            if (l == null) {
                continue;
            }
            if (bestLocation == null || l.getAccuracy() < bestLocation.getAccuracy()) {
                bestLocation = l;
            }
        }
        return bestLocation;
    }


    private BroadcastReceiver mMessageReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {



            pointOneLat = Double.parseDouble(intent.getExtras().getString("lat")); //setting values to the TextViews
            pointOneLang = Double.parseDouble(intent.getExtras().getString("lng"));

            pointOne = new LatLng(pointOneLat, pointOneLang);
//            pointTwo = new LatLng(deviceLat,deviceLng);
            if (markersite != null) {

                markersite.remove();
            }
            mMap.clear();
            markersite = mMap.addMarker(new MarkerOptions().position(pointOne)
                    .icon((BitmapDescriptorFactory.fromResource(R.drawable.red_car)))
                    .title("Site"));
            // markersite = mMap.addMarker(new MarkerOptions().position(pointOne).title("Site"));

            pointToPosition(pointOne, 0);

            if (pointOneLat != 0.0 || pointOneLang != 0.0) {
                if (isGeofence.equalsIgnoreCase("true")) {
                    countDistance();
                }
            }
//            localBroadcastManager.unregisterReceiver(mMessageReceiver);
            progressBar.setVisibility(View.GONE);
            relativeLayout.setVisibility(View.GONE);
            textView.setVisibility(View.GONE);
//            if (mapcount1==0){
//                pointToPosition(pointOne,0);
//                mapcount1++;
//            }

            Location location = getLastKnownLocation();
            if (location != null) {
                pointTwo = new LatLng(location.getLatitude(), location.getLongitude());
            }


            if (isGeofence.equalsIgnoreCase("true")) {

                circle = mMap.addCircle(new CircleOptions()
                        .center(pointTwo)
                        .radius(Double.parseDouble(radius))
                        .strokeColor(0x37FF0000)
                        .fillColor(0x35FF0000));
            }

        }
    };

    @Override
    protected void onPause() {
        super.onPause();
        if (timer != null) {
            timer.cancel();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        startUpdateTask();
//        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q)
//        {
//            boolean isEnabled = isNotificationServiceEnabled(this);
//            if (isEnabled) {
//
//            }
//            else {
//                requestNotificationaccess();
//            }
//
//         }
    }

    private void startUpdateTask() {

        if (timer != null) {
            timer.cancel();
        }
        timer = new Timer();

        timer.scheduleAtFixedRate(new TimerTask() {
            @Override
            public void run() {
                SendNotification.notification(sqlitewraper.context, "", "", "1", senderid, receivertoken, companyid);
            }
        }, DELAY, DELAY);
    }

    private void countDistance() {

        float[] distance = new float[2];
        Location.distanceBetween(pointOne.latitude, pointOne.longitude,
                circle.getCenter().latitude, circle.getCenter().longitude, distance);
        SharedPreferences preferences = context.getSharedPreferences("MyPrefs", Context.MODE_PRIVATE);
        boolean toastShown = preferences.getBoolean("toastShown", false);
        if (distance[0] > circle.getRadius()) {
            i = 0;
            if(!toastShown) {
                new Handler(Looper.getMainLooper()).post(() -> Toast.makeText(sqlitewraper.context, "Location does not match.", Toast.LENGTH_SHORT).show());

                // Save that the Toast has been shown
                SharedPreferences.Editor editor = preferences.edit();
                editor.putBoolean("toastShown", true);
                editor.apply();
            }
        } else {
            i = 1;
            if(!toastShown) {
                new Handler(Looper.getMainLooper()).post(() -> Toast.makeText(sqlitewraper.context, "Location match.", Toast.LENGTH_SHORT).show());

                // Save that the Toast has been shown
                SharedPreferences.Editor editor = preferences.edit();
                editor.putBoolean("toastShown", true);
                editor.apply();
            }
            checkInside();
        }
    }

    void checkInside() {
//        Toast.makeText(this, "Inside", Toast.LENGTH_SHORT).show(); // hide toast 13-02-2025
        Bundle b = new Bundle();
        Intent intent = new Intent();
        intent.putExtras(b);
        setResult(RESULT_OK, intent);
        finish();
    }
    boolean isnotificationDialog = false;
    boolean isoverlyaDialog = false;
    public boolean isNotificationServiceEnabled(Context context) {
        String enabledServices = Settings.Secure.getString(context.getContentResolver(), "enabled_notification_listeners");
        String packageName = context.getPackageName();
        return enabledServices != null && enabledServices.contains(packageName);
    }
    public void requestNotificationaccess() {
        int NotificationListner = ContextCompat.checkSelfPermission(UserMapViewActivity.this, Manifest.permission.BIND_NOTIFICATION_LISTENER_SERVICE);
        boolean NotificationListnerGranted =(NotificationListner == PackageManager.PERMISSION_GRANTED);

        if(!NotificationListnerGranted)
        {
            AlertDialog dialog;
            AlertDialog.Builder builder = new AlertDialog.Builder(this);
            builder.setCancelable(false);
            builder.setTitle("Notification access");
            builder.setMessage("This app requires 'Notification access' permission from System Settings.");
            builder.setPositiveButton("Allow in Settings", new DialogInterface.OnClickListener() {
                @Override
                public void onClick(DialogInterface dialog, int which) {
                    Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
                    startActivity(intent);
                    // finish();
                    isnotificationDialog = false;
                }
            });
            if(!isnotificationDialog)
            {
                dialog = builder.create();
                dialog.show();
                isnotificationDialog = true;
            }

        }


    }

    private boolean checkOverlayDisplayPermission() {
        // Android Version is lesser than Marshmallow or
        // the API is lesser than 23
        // doesn't need 'Display over other apps' permission enabling.
        if (Build.VERSION.SDK_INT > Build.VERSION_CODES.M) {
            // If 'Display over other apps' is not enabled
            // it will return false or else true
            if (!Settings.canDrawOverlays(this)) {
                return false;
            } else {
                return true;
            }
        } else {
            return true;
        }
    }

    public void requestOverlayDisplayPermission() {
        AlertDialog dialog;
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setCancelable(false);
        builder.setTitle("Screen Overlay Permission Needed");
        builder.setMessage("This app requires 'Display over other apps' permission from System Settings.");
        builder.setPositiveButton("Allow in Settings", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + getPackageName()));
                startActivityForResult(intent, 1012);
                //  finish();
                isoverlyaDialog = false;
            }
        });
        if(!isoverlyaDialog)
        {
            dialog = builder.create();
            dialog.show();
            isoverlyaDialog = true;
        }

    }
}
