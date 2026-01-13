package com.sky.atc.easyformse.mapview;

import static com.sky.atc.easyformse.sqlitewraper.context;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationManager;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;

import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import android.util.Log;
import android.widget.Toast;

import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.sky.atc.easyformse.R;
import com.sky.atc.easyformse.sqlitewraper;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@StringFogIgnore
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
    private boolean isLocationSent = false;
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
        startForegroundServiceWithNotification();

        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this);
        locationRequest = createLocationRequestNew();
        onLocationChanged();
        startLocationUpdates();

        if (intent != null) {
            senderid = intent.getExtras().getString("senderid");
            receiverid = intent.getExtras().getString("receiverid");
            Company_Id = intent.getExtras().getString("Company_Id");
        }

        return (START_NOT_STICKY);


    }

    private static final String CHANNEL_ID = "location_service_channel";
    private static final int NOTIFICATION_ID = 1;

    private void startForegroundServiceWithNotification() {

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Location Service",
                    NotificationManager.IMPORTANCE_LOW
            );
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(channel);
        }

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Sharing Location")
                .setContentText("Your location is being sent")
                .setSmallIcon(R.drawable.atc_logo) // MUST exist
                .setOngoing(true)
                .build();

        startForeground(NOTIFICATION_ID, notification);
    }
    private static final ExecutorService networkExecutor =
            Executors.newSingleThreadExecutor();

    private void onLocationChanged() {

        locationCallback = new LocationCallback() {
            @Override
            public void onLocationResult(LocationResult locationResult) {

                if (locationResult == null || isLocationSent) return;

                Location location = locationResult.getLastLocation();
                if (location == null) return;

                String lat = String.valueOf(location.getLatitude());
                String lng = String.valueOf(location.getLongitude());

                Log.d("LocationService", "Lat: " + lat + " Lng: " + lng);

                networkExecutor.execute(() -> {
                    SendNotification.notification(getApplicationContext(), lat, lng, "2", receiverid, senderid, Company_Id);
                });

                stopLocationUpdatesFused();

                new Handler(Looper.getMainLooper()).postDelayed(() -> {
                    stopSelf();
                }, 1000);
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
