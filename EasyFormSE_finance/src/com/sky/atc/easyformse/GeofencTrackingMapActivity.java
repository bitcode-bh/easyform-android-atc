package com.sky.atc.easyformse;

import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.location.Address;
import android.location.Geocoder;
import android.location.Location;
import android.os.Bundle;
import android.text.Html;
import android.util.Log;
import android.view.View;
import android.widget.ImageButton;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.app.ActivityCompat;
import androidx.fragment.app.FragmentActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

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
import com.google.android.gms.maps.model.Circle;
import com.google.android.gms.maps.model.CircleOptions;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.LatLngBounds;
import com.google.android.gms.maps.model.Marker;
import com.google.android.gms.maps.model.MarkerOptions;
import com.sky.atc.easyformse.datautils.MySharedPreferences;

import net.sqlcipher.database.SQLiteDatabase;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import io.michaelrocks.paranoid.Obfuscate;

/**
 * Created by NareshChocha on 9/4/2023.
 *
 * @author NareshChocha
 */
@Obfuscate
public class GeofencTrackingMapActivity extends FragmentActivity implements OnMapReadyCallback, LocationListener, GoogleApiClient.ConnectionCallbacks,
        GoogleApiClient.OnConnectionFailedListener,GoogleMap.InfoWindowAdapter  {

    GoogleApiClient mGoogleApiClient;
    SQLiteDatabase database;

    private GoogleMap mMap;
    Context context;
    Location mLocation;
    LocationRequest mLocationRequest;

    private long UPDATE_INTERVAL = 15000;  /* 15 secs */
    private long FASTEST_INTERVAL = 1000; /* 5 secs */
    Circle circle;
    LatLng latLng;

    private Marker markersite;
    List<Marker> list = new ArrayList<>();
    ImageButton mBtnZoomIn;
    ImageButton mBtnTrackinglist;
    public  RecyclerView mRecyclerViewTrackingList;
    List<Address> addresses;
    GeofenceTrackingListAdapter mGeofenceTrackingListAdapter;
    static LinearLayout mLinearLayoutMap;
    static LinearLayout mLinearLayoutRecycleview;
    ArrayList<GetGeofenceTrakingDetails> mArrayList = new ArrayList<>();
    public static GeofencTrackingMapActivity instance;
    String HideRecycleview = "false";
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.geofence_tracking_activity_map);
        instance = this;
        database = sqlitewraper.getDatabase();

        mBtnZoomIn = findViewById(R.id.btnZoomin);
        mBtnTrackinglist = findViewById(R.id.btnTrackinglist);
        mRecyclerViewTrackingList = findViewById(R.id.mRvTrackingList);
        mLinearLayoutMap =findViewById(R.id.linear_map);
        mLinearLayoutRecycleview = findViewById(R.id.linear_layout_recycleview);

        SupportMapFragment mapFragment = (SupportMapFragment) getSupportFragmentManager().findFragmentById(R.id.map);
        mapFragment.getMapAsync(this);

        buildGoogleApiClient();

        mBtnZoomIn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                addMarkerForGeofence();
            }
        });

        mBtnTrackinglist.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                SetupRecycleview();
            }
        });

    }

    @Override
    protected void onPause() {
        super.onPause();

        Log.e("ONPause", "Application Is in Background");
    }

    @Override
    protected void onResume() {

        if (mGoogleApiClient != null) {
            mGoogleApiClient.connect();
        }
        super.onResume();
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
    public void onMapReady(@NonNull GoogleMap googleMap) {
        context = GeofencTrackingMapActivity.this;
        mMap = googleMap;

        if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            return;
        }
        mMap.setMyLocationEnabled(true);
        if(GeofenceTrackingListAdapter.IsClick.equalsIgnoreCase("true"))
        {
            MySharedPreferences pref = sqlitewraper.getSecureShared("MyPref");
            String latitude = pref.getString("latitude","");
            String longitude = pref.getString("longitude","");
            String Address = pref.getString("Address","");
            String PlaceId = pref.getString("PlaceId","");
            String mRadius = pref.getString("Radius","");

            Highliteitemclick(latitude,longitude,Address,PlaceId,mRadius );
            GeofenceTrackingListAdapter.IsClick = "fasle";
        }
        else {
            addMarkerForGeofence();
        }


    }

    private void addMarkerForGeofence() {
        try{
            Cursor a_t = database.rawQuery(
                    "select place_id,latitude,longitude,flow_id,radius  from geofence_tracking ", null);
            a_t.moveToFirst();
            String place_id = null;
            String lat = null;
            String lng = null;
            String flowid = null;
            String radiusData = null;
            mArrayList.clear();
            mMap.clear();
            if (a_t.getCount() > 0) {

                for (int i = 0; i < a_t.getCount(); i++) {
                    place_id = a_t.getString(0);
                    lat = a_t.getString(1);
                    lng = a_t.getString(2);
                    flowid = a_t.getString(3);
                    radiusData = a_t.getString(4);

                    Log.d("##getSitelatlngInfo", place_id + ": Lat: " + lat + ":Lng: " + lng + ":flowid " + flowid +"radius" + radiusData) ;

                    //  if getting radius 0 from geofence_tracking table get Radius from Flow master
                    if (radiusData.equalsIgnoreCase("0")) {

                        radiusData = getRadiusfromFlowmaster(flowid);
                    }

                    latLng = new LatLng(Double.parseDouble(lat), Double.parseDouble(lng));

                    Geocoder geocoder = new Geocoder(GeofencTrackingMapActivity.this, Locale.getDefault());
                    addresses = geocoder.getFromLocation(Double.parseDouble(lat), Double.parseDouble(lng), 1);
                    String address = addresses.get(0).getAddressLine(0); //0 to obtain first possible address
                    String city = addresses.get(0).getLocality();
                    String state = addresses.get(0).getAdminArea();

                    //create your custom title
                    String title = "Place id - "+place_id ;
                    String info = "<b> Radius - </b> " + radiusData + " m"+ "<br><b>Address</b>  - " + address + "-"+city+"-"+ state +"</br>";


                    markersite = mMap.addMarker(new MarkerOptions().position(latLng).title(title).snippet(info));

                    mMap.setInfoWindowAdapter(this);
                    list.add(markersite);

                    circle = mMap.addCircle(new CircleOptions()
                            .center(latLng)
                            .radius(Float.parseFloat(radiusData))
                            .strokeColor(0x37FF0000)
                            .fillColor(0x35FF0000));

                    LatLngBounds.Builder builder = new LatLngBounds.Builder();
                    for (Marker marker : list) {
                        builder.include(marker.getPosition());
                    }
                    LatLngBounds bounds = builder.build();

                    int padding = 100; // Padding around the bounds (in pixels)
                    CameraUpdate cu = CameraUpdateFactory.newLatLngBounds(bounds, padding);
                    mMap.moveCamera(cu);
                    mMap.animateCamera(cu);

                    GetGeofenceTrakingDetails mGeofenceTrakingDetails = new GetGeofenceTrakingDetails();
                    mGeofenceTrakingDetails.setId(String.valueOf(i+1));
                    mGeofenceTrakingDetails.setPlaceId(place_id);
                    mGeofenceTrakingDetails.setLng(lng);
                    mGeofenceTrakingDetails.setLat(lat);
                    mGeofenceTrakingDetails.setAddress( address + "-"+city+"-"+ state);
                    mGeofenceTrakingDetails.setRadius(radiusData);
                    mArrayList.add(mGeofenceTrakingDetails);

                    a_t.moveToNext();
                }
                a_t.close();
            }
        }
        catch (Exception e)
        {
            e.printStackTrace();
        }

    }

    @Nullable
    @Override
    public View getInfoWindow(@NonNull Marker marker) {
        return null;
    }

    @Nullable
    @Override
    public View getInfoContents(@NonNull Marker marker) {
        // Inflate the custom info window layout
        View infoWindow = getLayoutInflater().inflate(R.layout.custom_info_window, null);

        // Get references to the views in the layout
        TextView titleTextView = infoWindow.findViewById(R.id.titleTextView);
        TextView addressTextView = infoWindow.findViewById(R.id.addressTextView);

        // Set the title and address of the marker
        titleTextView.setText(marker.getTitle());
        addressTextView.setText(Html.fromHtml(marker.getSnippet()));

        return infoWindow;
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

                int radius = obj.getInt("radius");

                radiusData = String.valueOf(radius);
            }
        } catch (Exception e) {
            Log.d("###getRadiusFlowmas", String.valueOf(e));
        }
        c2.close();

        return radiusData;
    }

    protected synchronized void buildGoogleApiClient() {
        mGoogleApiClient = new GoogleApiClient.Builder(this)
                .addConnectionCallbacks(this)
                .addOnConnectionFailedListener(this)
                .addApi(LocationServices.API).build();
        mGoogleApiClient.connect();
    }

    @Override
    public void onLocationChanged(@NonNull Location location) {

        mLocation = location;

        //Place current location marker
        LatLng latLng = new LatLng(location.getLatitude(), location.getLongitude());

       // mMap.moveCamera(CameraUpdateFactory.newLatLng(latLng));

        //stop location updates
        if (mGoogleApiClient != null) {
            LocationServices.FusedLocationApi.removeLocationUpdates(mGoogleApiClient, this);
        }

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


    public void SetupRecycleview()
    {
        mLinearLayoutMap.setVisibility(View.GONE);
        mLinearLayoutRecycleview.setVisibility(View.VISIBLE);
        mGeofenceTrackingListAdapter = new GeofenceTrackingListAdapter(GeofencTrackingMapActivity.this, mArrayList);
        RecyclerView.LayoutManager layoutManager = new LinearLayoutManager(getApplicationContext());
        mRecyclerViewTrackingList.setLayoutManager(layoutManager);
        mRecyclerViewTrackingList.setAdapter(mGeofenceTrackingListAdapter);
        HideRecycleview = "true";
    }

    @Override
    public void onBackPressed() {

        if(HideRecycleview.equalsIgnoreCase("true"))
        {
            mLinearLayoutMap.setVisibility(View.VISIBLE);
            mLinearLayoutRecycleview.setVisibility(View.GONE);
            HideRecycleview = "false";
        }
        else
        {
            super.onBackPressed();
        }

    }

    public void Highliteitemclick(String latitude,String longitude,String mAddress,String mPlaceId,String mRadius )
    {

        try{
            Cursor a_t = database.rawQuery(
                    "select place_id,latitude,longitude,flow_id,radius  from geofence_tracking ", null);
            a_t.moveToFirst();
            String place_id = null;
            String lat = null;
            String lng = null;
            String flowid = null;
            String radiusData = null;
            mArrayList.clear();
            mMap.clear();
            if (a_t.getCount() > 0) {

                for (int i = 0; i < a_t.getCount(); i++) {
                    place_id = a_t.getString(0);
                    lat = a_t.getString(1);
                    lng = a_t.getString(2);
                    flowid = a_t.getString(3);
                    radiusData = a_t.getString(4);

                    Log.d("##getSitelatlngInfo", place_id + ": Lat: " + lat + ":Lng: " + lng + ":flowid " + flowid +"radius" + radiusData) ;

                    //  if getting radius 0 from geofence_tracking table get Radius from Flow master
                    if (radiusData.equalsIgnoreCase("0")) {

                        radiusData = getRadiusfromFlowmaster(flowid);
                    }

                    latLng = new LatLng(Double.parseDouble(lat), Double.parseDouble(lng));

                    Geocoder geocoder = new Geocoder(GeofencTrackingMapActivity.this, Locale.getDefault());
                    addresses = geocoder.getFromLocation(Double.parseDouble(lat), Double.parseDouble(lng), 1);
                    String address = addresses.get(0).getAddressLine(0); //0 to obtain first possible address
                    String city = addresses.get(0).getLocality();
                    String state = addresses.get(0).getAdminArea();

                    //create your custom title
                    String title = "Place id - "+place_id ;
                    String info = "<b> Radius - </b> " + radiusData + " m"+ "<br><b>Address</b>  - " + address + "-"+city+"-"+ state +"</br>";


                    markersite = mMap.addMarker(new MarkerOptions().position(latLng).title(title).snippet(info));

                    mMap.setInfoWindowAdapter(this);
                    list.add(markersite);

                    circle = mMap.addCircle(new CircleOptions()
                            .center(latLng)
                            .radius(Float.parseFloat(radiusData))
                            .strokeColor(0x37FF0000)
                            .fillColor(0x35FF0000));

                    LatLng marker1 = new LatLng(Double.parseDouble(latitude), Double.parseDouble(longitude));

                    mMap.animateCamera(CameraUpdateFactory.newLatLngZoom(marker1, 14), new GoogleMap.CancelableCallback() {
                        @Override
                        public void onFinish() {
                            String PlaceId = "Place id - "+mPlaceId ;
                            String mInfo = "<b> Radius - </b> " + mRadius + " m"+ "<br><b>Address</b>  - " + mAddress +"</br>";
                            Marker marker =  mMap.addMarker(new MarkerOptions().position(marker1).title(PlaceId).snippet(mInfo));

                            marker.showInfoWindow();
                        }
                        @Override
                        public void onCancel() {
                        }
                    });


//                    LatLngBounds.Builder builder = new LatLngBounds.Builder();
//                    for (Marker marker : list) {
//                        builder.include(marker.getPosition());
//                    }
//                    LatLngBounds bounds = builder.build();
////
//                    int padding = 100; // Padding around the bounds (in pixels)
//                    CameraUpdate cu = CameraUpdateFactory.newLatLngBounds(bounds, padding);
//                    mMap.moveCamera(cu);
//                    mMap.animateCamera(cu);

                    GetGeofenceTrakingDetails mGeofenceTrakingDetails = new GetGeofenceTrakingDetails();
                    mGeofenceTrakingDetails.setId(String.valueOf(i+1));
                    mGeofenceTrakingDetails.setPlaceId(place_id);
                    mGeofenceTrakingDetails.setLng(lng);
                    mGeofenceTrakingDetails.setLat(lat);
                    mGeofenceTrakingDetails.setAddress( address + "-"+city+"-"+ state);
                    mGeofenceTrakingDetails.setRadius(radiusData);
                    mArrayList.add(mGeofenceTrakingDetails);


                    a_t.moveToNext();
                }
                a_t.close();
            }
        }
        catch (Exception e)
        {
            e.printStackTrace();
        }


    }

    public static void refreshActivity() {
        GeofencTrackingMapActivity.refresh();
    }
    public static GeofencTrackingMapActivity getInstance() {
        return instance;
    }
    public static void refresh() {
        Intent intent = new Intent(GeofencTrackingMapActivity.getInstance(), GeofencTrackingMapActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_NEW_TASK);
        GeofencTrackingMapActivity.getInstance().startActivity(intent);
    }
    
}
