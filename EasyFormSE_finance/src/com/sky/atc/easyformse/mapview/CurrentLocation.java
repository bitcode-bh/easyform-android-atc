package com.sky.atc.easyformse.mapview;

import static com.sky.atc.easyformse.sqlitewraper.context;

import android.Manifest;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationManager;
import android.os.IBinder;
import android.os.Looper;

import androidx.core.app.ActivityCompat;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import android.util.Log;
import android.widget.Toast;

import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.sky.atc.easyformse.sqlitewraper;

import io.michaelrocks.paranoid.Obfuscate;

@Obfuscate
public class CurrentLocation extends Service {

    private LocationManager locationManager;
    private String provider;
    String senderid;
    String receiverid;
    String Company_Id;
    String lat;
    String lng;
    LocalBroadcastManager localBroadcastManager;


    //Fused Location

    private FusedLocationProviderClient fusedLocationClient;
    private LocationCallback locationCallback;
    private LocationRequest locationRequest;

    public CurrentLocation() {

    }


    @Override
    public IBinder onBind(Intent intent) {
        // TODO: Return the communication channel to the service.
        throw new UnsupportedOperationException("Not yet implemented");
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
//        Get the location manager
//        locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
        // Define the criteria how to select the locatioin provider -> use
        // default

        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this);
        locationRequest = createLocationRequestNew();
        onLocationChanged();
        startLocationUpdates();

        if (intent != null) {
            senderid = intent.getExtras().getString("senderid");
            receiverid = intent.getExtras().getString("receiverid");
            Company_Id = intent.getExtras().getString("Company_Id");
        }

        return (START_STICKY);


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

                    lat = String.valueOf(location.getLatitude());
                    lng = String.valueOf(location.getLongitude());
                    //send current location to opponent as per request and stop the service
                    SendNotification.notification(sqlitewraper.context, lat, lng, "2", receiverid, senderid, Company_Id);
                    Toast.makeText(CurrentLocation.this, "Location sent. ", Toast.LENGTH_SHORT).show();
                    stopLocationUpdatesFused();
                    stopSelf();
                }
            }
        };
    }

    private void startLocationUpdates() {
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {

            return;
        }
        fusedLocationClient.requestLocationUpdates(locationRequest,
                locationCallback,
                Looper.getMainLooper());
    }

    protected LocationRequest createLocationRequestNew() {
        LocationRequest locationRequest = LocationRequest.create();
        locationRequest.setInterval(5000);
        locationRequest.setFastestInterval(1000);
        locationRequest.setPriority(LocationRequest.PRIORITY_HIGH_ACCURACY);
        locationRequest.setSmallestDisplacement(100);
        return locationRequest;
    }

    private void stopLocationUpdatesFused() {

        if (fusedLocationClient != null){

            if (locationCallback != null) {
                fusedLocationClient.removeLocationUpdates(locationCallback);
            }
        }

    }

}
