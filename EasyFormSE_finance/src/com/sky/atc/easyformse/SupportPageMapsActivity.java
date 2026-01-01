package com.sky.atc.easyformse;


import android.app.ProgressDialog;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import net.sqlcipher.database.SQLiteDatabase;
import android.location.Address;
import android.location.Geocoder;
import android.location.Location;
import android.os.Bundle;
import android.os.Handler;
import android.os.StrictMode;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.app.ActivityCompat;
import androidx.fragment.app.FragmentActivity;

import android.text.Html;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.ImageButton;
import android.widget.TextView;
import android.widget.Toast;

import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.maps.CameraUpdate;
import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.SupportMapFragment;
import com.google.android.gms.maps.model.CameraPosition;
import com.google.android.gms.maps.model.Circle;
import com.google.android.gms.maps.model.CircleOptions;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.LatLngBounds;
import com.google.android.gms.maps.model.MarkerOptions;


//newfused


import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.api.GoogleApiClient;
import com.google.android.gms.location.LocationListener;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.maps.model.Marker;


import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.ksoap2.SoapEnvelope;
import org.ksoap2.serialization.PropertyInfo;
import org.ksoap2.serialization.SoapObject;
import org.ksoap2.serialization.SoapPrimitive;
import org.ksoap2.serialization.SoapSerializationEnvelope;
import org.ksoap2.transport.HttpTransportSE;

import java.util.Date;
import java.util.List;
import java.util.Locale;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

@StringFogIgnore
public class SupportPageMapsActivity extends FragmentActivity implements OnMapReadyCallback, LocationListener,GoogleApiClient.ConnectionCallbacks,
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

    String company_id;
    String username;
    String selected_sitename;
    String server_task_id;
    String radius;
    String Accuracy;
    String supportDetailsst;
    String provider;
    String geofence_by;
    private static int zoomcount;
    Location mLocation;
    private LocationRequest mLocationRequest;
    private long UPDATE_INTERVAL = 15000;  /* 15 secs */
    private long FASTEST_INTERVAL = 1000; /* 5 secs */
    private Marker markersite;
    private int mapcount=0;

    //WCF URL
    private static final String WCFURL = sqlitewraper.context.getResources().getString(R.string.GEOWCFURL);
    private static final String METHOD_NAME_corner = "WCF_Show_Customer_Unique_At_Geofence_New";
    ProgressDialog progressbar;
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.support_page_activity_maps);

        database = sqlitewraper.getDatabase();


        SupportMapFragment mapFragment = (SupportMapFragment) getSupportFragmentManager().findFragmentById(R.id.map);
        mapFragment.getMapAsync(this);

        mlocListener = new SupportPageMapsActivity();

        pointOneLat = Double.parseDouble(getIntent().getExtras().getString("site_lat"));
        pointOneLang = Double.parseDouble(getIntent().getExtras().getString("site_lng"));



        company_id = getIntent().getExtras().getString("Company_Id");
        username = getIntent().getExtras().getString("Username");
        selected_sitename = getIntent().getExtras().getString("Customer_Unique");
        server_task_id = getIntent().getExtras().getString("Task_Id");
        radius = getIntent().getExtras().getString("Radius");

        Accuracy = getIntent().getExtras().getString("Accuracy");
        supportDetailsst = getIntent().getExtras().getString("Support_Details");
        geofence_by = getIntent().getExtras().getString("geofence_by");

        pointOne = new LatLng(pointOneLat, pointOneLang);
        btnBack = (Button) findViewById(R.id.btn_back);
        refreshLat = (Button) findViewById(R.id.btn_refresh);
        siteBtn = (ImageButton) findViewById(R.id.sitebtn);

        refreshLat.setClickable(false);
        refreshLat.setEnabled(false);

        locationProvider();

        //for support details
        supportDetails = (TextView) findViewById(R.id.info_text6);
        supportDetails.setText(supportDetailsst);

        //for running work on main Thread
        StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
        StrictMode.setThreadPolicy(policy);

        //for setting postion to sitw
        siteBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {

                pointToPosition(pointOne,0);
            }
        });


        //click on button back
        btnBack.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {

                btnBack.setBackgroundDrawable(getResources().getDrawable(R.drawable.button_selected));
//                String responsetext = mapLatlng(company_id, username, selected_sitename, server_task_id, deviceLat, deviceLng, Accuracy, radius,geofence_by);
//                String distance = null;
//                String distance2 = null;
//                String Status = null;
//                String message = null;
//                JSONArray jsonArray12 = null;
//                if (responsetext != null) {
//                    try {
//                        jsonArray12 = new JSONArray(responsetext);
//                        JSONObject jsonObject = jsonArray12.getJSONObject(0);
//                        Status = jsonObject.getString("Status");
//                        message = jsonObject.getString("message");
//
//                        if (Status.equalsIgnoreCase("1")) {
//
//                            distance = jsonObject.getString("Distance");
//                            distance2 = jsonObject.getString("Distance_1");
//
//                            if (distance.equals("1")) {
//
//                                checkInside(responsetext);
//
//                                if (deviceLat != 0.0 && deviceLng != 0.0) {
//                                    insertintoTrackmaster(deviceLat, deviceLng, Accuracy);
//                                }
//                            } else {
//                                Toast.makeText(getBaseContext(), "Outside", Toast.LENGTH_LONG).show();
//                                Bundle b = new Bundle();
//                                b.putString("result", "outside");
//                                Intent intent = new Intent();
//                                intent.putExtras(b);
//                                setResult(RESULT_CANCELED, intent);
//                                finish();
//                            }
//
//                        }else{
//                            Toast.makeText(SupportPageMapsActivity.this, message, Toast.LENGTH_SHORT).show();
//
//                        }
//                    } catch (JSONException e) {
//                        e.printStackTrace();
//                    }
//                }else {


//                    if (sqlitewraper.internetflag == 1) {
//                        Toast.makeText(SupportPageMapsActivity.this, "Something goes wrong!!!", Toast.LENGTH_SHORT).show();
//                    } else {
//                        Toast.makeText(SupportPageMapsActivity.this, "Please check your internet Connectivity!!!", Toast.LENGTH_SHORT).show();
//                    }

//                }


//                Toast.makeText(SupportPageMapsActivity.this, "Outside", Toast.LENGTH_LONG).show();
                Bundle b = new Bundle();
                b.putString("result", "outside");
                Intent intent = new Intent();
                intent.putExtras(b);
                setResult(RESULT_CANCELED, intent);
                finish();
//
            }
        });

        //click on refresh lat
        refreshLat.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                refreshLat.setBackgroundDrawable(getResources().getDrawable(R.drawable.button_selected));
                showprogressbar(SupportPageMapsActivity.this,"Please Wait...");
                final Handler handler = new Handler();
                handler.postDelayed(() -> {
                    try {
                        callWebserviceInside();
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }, 300);

                refreshLat.setBackgroundDrawable(getResources().getDrawable(R.drawable.support_layout_border));
            }

        });
    }

    public void callWebserviceInside() {

        String responsetext = mapLatlng(company_id, username, selected_sitename, server_task_id, deviceLat, deviceLng, Accuracy, radius,geofence_by);
        String distance = null;
        String distance2 = null;
        String Status = null;
        String message = null;
        JSONArray jsonArray12 = null;
        if (responsetext != null) {
            try {
                jsonArray12 = new JSONArray(responsetext);
                JSONObject jsonObject = jsonArray12.getJSONObject(0);
                Status = jsonObject.getString("Status");
                message = jsonObject.getString("message");

                if (Status.equalsIgnoreCase("1")) {

                    distance = jsonObject.getString("Distance");
                    distance2 = jsonObject.getString("Distance_1");
                    String  mdistance =  String.format("%.2f", Double.parseDouble(distance2));
                    if (progressbar != null && progressbar.isShowing()) {
                        progressbar.dismiss();
                    }
                    if (distance.equals("1")) {

                        checkInside(responsetext);

                        if (deviceLat != 0.0 && deviceLng != 0.0) {
                            insertintoTrackmaster(deviceLat, deviceLng, Accuracy);
                        }
                    } else {

                        String ToastString =  "<b>" + "Request sent: " + "</b>" + "<br>" + "You are " + mdistance + " meters far from site! " +"</br>" + "<br>" +  "Radius: " + radius + ", Accuracy: " + Accuracy + ", " + "</br> <br>" + "\nUser: " + deviceLat + ", "
                                + deviceLng + "," + "</br> <br>" +" \nSite: " + pointOneLat + ", " + pointOneLang + "" + "</br>";
                        Toast.makeText(SupportPageMapsActivity.this, Html.fromHtml(ToastString), Toast.LENGTH_LONG).show();
                    }
                }
                else if(Status.equalsIgnoreCase("3"))
                {
                    if (progressbar != null && progressbar.isShowing()) {
                        progressbar.dismiss();
                    }
                }
                else {

                    String imei = sqlitewraper.imeino;

                    JSONObject data1 = new JSONObject();
                    data1.put("Imei", imei);
                    data1.put("Company_Id", company_id);
                    data1.put("Username", username);
                    data1.put("Customer_Unique", selected_sitename);
                    data1.put("Task_Id", server_task_id);
                    data1.put("Device_Lat", deviceLat);
                    data1.put("Device_long", deviceLng);
                    data1.put("Accuracy", Accuracy);
                    data1.put("Radius", radius);
                    if (progressbar != null && progressbar.isShowing()) {
                        progressbar.dismiss();
                    }
                    Toast.makeText(SupportPageMapsActivity.this, "Status: " + Status + "\nMessage: " + message +"\nRequest Param: \n" + data1, Toast.LENGTH_LONG).show();
                }

            } catch (JSONException e) {
                if (progressbar != null && progressbar.isShowing()) {
                    progressbar.dismiss();
                }
                ////e.printStackTrace()();
            }
        }else {
            if (progressbar != null && progressbar.isShowing()) {
                progressbar.dismiss();
            }
            Toast.makeText(SupportPageMapsActivity.this, "Please check your internet Connectivity!!!", Toast.LENGTH_SHORT).show();


        }
    }

    @Override
    public void onMapReady(GoogleMap googleMap) {

        context = SupportPageMapsActivity.this;
        mMap = googleMap;
        mMap.addMarker(new MarkerOptions().position(pointOne).title("Site"));
        markersite= mMap.addMarker(new MarkerOptions().position(pointOne).title("Site"));

        if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            return;
        }
        mMap.setMyLocationEnabled(true);
//        pointToPosition(pointOne,0);

        circle = mMap.addCircle(new CircleOptions()
                .center(pointOne)
                .radius(Double.parseDouble(radius))
                .strokeColor(0x37FF0000)
                .fillColor(0x35FF0000));
    }

    @Override
    public void onLocationChanged(Location location) {

        deviceLat = location.getLatitude();
        deviceLng = location.getLongitude();

        refreshLat.setText("Refresh Location");

        refreshLat.setEnabled(true);

        pointTwo = new LatLng(deviceLat, deviceLng);
        Log.e("location", String.valueOf(pointTwo));
        location.setAccuracy(LocationRequest.PRIORITY_HIGH_ACCURACY);
        float accuracy = location.getAccuracy();
        provider = location.getProvider();


        if (deviceLat != 0.0 || deviceLng != 0.0) {
            countDistance();
            refreshLat.setClickable(true);
        }
        if (mapcount==0){
            pointToPosition(pointTwo,0);
            mapcount++;
        }


    }
//
//    //for Zoom  marker Position
//    private void pointToPosition(LatLng position) {
//        CameraPosition cameraPosition = new CameraPosition.Builder()
//                .target(position)
//                .zoom(15.5F).build();
//        mMap.animateCamera(CameraUpdateFactory.newCameraPosition(cameraPosition));
//    }


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

                        mMap.moveCamera(cu);
                        mMap.animateCamera(cu);
                    }
                }
                if (i == 1) {

                    refreshLat.setText("Refresh Location");

                    refreshLat.setEnabled(true);

                    CameraPosition cameraPosition = new CameraPosition.Builder()
                            .target(position)
                            .zoom(15.5F).build();
                    mMap.animateCamera(CameraUpdateFactory.newCameraPosition(cameraPosition));

                }
            }
        }catch (Exception e){
            e.printStackTrace();
        }
    }

    //for Counting Distance Between radius of
    private void countDistance() {

        float[] distance = new float[2];
        Location.distanceBetween(pointTwo.latitude, pointTwo.longitude,
                circle.getCenter().latitude, circle.getCenter().longitude, distance);

        if (distance[0] > circle.getRadius()) {
            i = 0;
        } else {
            i = 1;
            callWebserviceInside();
        }
    }

//    @Override
//    public void onStatusChanged(String provider, int status, Bundle extras) {
//    }
//
//    @Override
//    public void onProviderEnabled(String provider) {
//    }
//
//    @Override
//    public void onProviderDisabled(String provider) {
//    }

    @Override
    protected void onPause() {
        super.onPause();

//        locationManager.removeUpdates(this);
        Log.e("ONPause", "Application Is in Background");
    }

    @Override
    protected void onResume() {
//
//        if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
//            return;
//        }
////        locationManager.requestLocationUpdates(LocationManager.NETWORK_PROVIDER, 0, 10, this);
//        locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 0, 10, this);
//        Log.e("ONResume", "Application Resumed");



        if (mGoogleApiClient != null) {
            mGoogleApiClient.connect();
        }


        super.onResume();
    }

    public String mapLatlng(String company_id, String username, String selected_sitename, String server_task_id, double deviceLatw, double deviceLngw, String accuracy, String radius,String geofence_by) {


        String restext = null;
        try {

//            String imei = DeviceEventsUtils.getImei();

                String imei= sqlitewraper.imeino;

                JSONObject data1 = new JSONObject();
                data1.put("Imei", imei);
                data1.put("Company_Id", company_id);
                data1.put("Username", username);
                data1.put("Customer_Unique", selected_sitename);
                data1.put("Task_Id", server_task_id);

                if (deviceLatw == 0.0 && deviceLngw == 0.0){

                    Cursor c = database
                            .rawQuery(
                                    "SELECT lat,lon  FROM  track_master WHERE   _id = (SELECT MAX(_id) FROM track_master);",
                                    null);
                    c.moveToFirst();

                    if (c.getCount() > 0) {

                        deviceLatw = Double.parseDouble(c.getString(0));
                        deviceLngw = Double.parseDouble(c.getString(1));
                    }
                }

                data1.put("Device_Lat", deviceLatw);
                data1.put("Device_long",deviceLngw);
                data1.put("Accuracy", accuracy);
                data1.put("Radius", radius);
                data1.put("geofence_by",geofence_by);

                JSONArray j = new JSONArray();
                j.put(data1);


//            SoapObject data = new SoapObject(NAMESPACE, METHOD_NAME_corner);
//            restext = webservice(data1, data, URL, SOAP_ACTION_site);

             restext = NewWebservicesCallEasyform.ExecuteNetworkHTTPPostRequestfile(data1, WCFURL, METHOD_NAME_corner, data1);


        } catch (JSONException e1) {
                 e1.printStackTrace();
        }
        return restext;
    }

    void checkInside(String restext){

            Toast.makeText(getBaseContext(), "Inside", Toast.LENGTH_LONG).show();
            Bundle b = new Bundle();
            b.putString("result",restext);
            Intent intent = new Intent();
            intent.putExtras(b);
            setResult(RESULT_OK, intent);
            finish();
    }

    public void insertintoTrackmaster(double deviceLatw,double deviceLngw,String accuracy){

        try{

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
//            String address = add(Double.valueOf(deviceLatw), Double.valueOf(deviceLngw));
            String address = AddressApi.getCompleteAddress(deviceLatw, deviceLngw);

            ContentValues args1 = new ContentValues();
            args1.put("cellid",address );
            args1.put("lat", DeviceEventsUtils.LatlngRoundff(String.valueOf(deviceLatw)));
            args1.put("date", time.toString());
            args1.put("date_s", Date);
            args1.put("lon", DeviceEventsUtils.LatlngRoundff(String.valueOf(deviceLngw)));
            args1.put("provider",provider);
            args1.put("accuracy", accuracy);
            args1.put("IS_SEND", 0);
            args1.put("IS_LOC", time);
            args1.put("address", address);
            args1.put("username", username);
            args1.put("tripflag", "0");

            long temp_mast = database.insert("track_master", null, args1);
        }catch (Exception e){

            ////e.printStackTrace()();
        }
    }

    @Override
    protected void onStart() {
        super.onStart();


        if (mGoogleApiClient != null) {
            mGoogleApiClient.connect();
        }
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

    @Override
    protected void onDestroy() {
        super.onDestroy();

        stopLocationUpdates();
    }

    public void stopLocationUpdates() {
        if (mGoogleApiClient.isConnected()) {
            LocationServices.FusedLocationApi
                    .removeLocationUpdates(mGoogleApiClient, this);
            mGoogleApiClient.disconnect();
        }
    }

    public void locationProvider() {
        mGoogleApiClient = new GoogleApiClient.Builder(this)
                .addApi(LocationServices.API)
                .addConnectionCallbacks(this)
                .addOnConnectionFailedListener(this)
                .build();
    }

    public void showprogressbar(Context mContext,String Text)
    {
        progressbar = new ProgressDialog(mContext);
        progressbar.setMessage(Text);
        progressbar.setIndeterminate(true);
        progressbar.show();
        progressbar.setCancelable(false);
    }
}
