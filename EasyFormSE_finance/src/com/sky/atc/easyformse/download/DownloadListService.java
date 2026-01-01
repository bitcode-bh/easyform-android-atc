package com.sky.atc.easyformse.download;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.ActivityManager;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Bundle;
import android.os.Looper;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;

import com.commonsware.cwac.wakeful.WakefulIntentService;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.sky.atc.easyformse.AddressApi;
import com.sky.atc.easyformse.AutoTripStopService;
import com.sky.atc.easyformse.B_new;
import com.sky.atc.easyformse.DeviceEventsUtils;
import com.sky.atc.easyformse.R;
import com.sky.atc.easyformse.TripService;
import com.sky.atc.easyformse.geofencenew.GeofenceDownlodService;
import com.sky.atc.easyformse.location_server;
import com.sky.atc.easyformse.ph_s;
import com.sky.atc.easyformse.sqlitewraper;
import com.sky.atc.easyformse.touch_server;

import net.sqlcipher.database.SQLiteDatabase;

import java.util.Date;
import java.util.List;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

//Main Service to initiate download
//Download Intent Service
@StringFogIgnore
public class DownloadListService extends WakefulIntentService implements LocationListener{

    SQLiteDatabase database;
    Context context;
    int touchFlag = 0;
    B_new b;

    LocationManager locationManager;
    String  mlat;
    String  mlon;
    String accuary;
    int locentry = 0;
    private FusedLocationProviderClient fusedLocationClient;
    private LocationCallback locationCallback;
    private LocationRequest locationRequest;
    public DownloadListService() {
        super("f_download");
    }

    @Override
    protected void doWakefulWork(Intent intent) {

        Log.d("##Download", "1");

        b = new B_new();
        int dwnCount = 1;
        int userFlowCount = 1;
        int checksheetCount = 1;
        int flowMasterCount = 1;
        int taskCount = 1;
        int k = 0;
        int taskuserwapCount = 1;
        int thresholdnewCount = 1;

        try {
            database = sqlitewraper.getDatabase();

            DownloadMainStructure w = new DownloadMainStructure();

            context = sqlitewraper.context;
            if(locentry == 0) {
                locentry = 1;
                reqLocation();

                // auto punch out code
                if(tripStatus() > 0) {
                    boolean check2 = isMyServiceRunning(sqlitewraper.context,
                            AutoTripStopService.class.getName());
                    if (check2) {
                    } else {
                        //check trip service runing or not

                        Intent Autotripservice = new Intent(sqlitewraper.context,
                                AutoTripStopService.class);
                        WakefulIntentService.sendWakefulWork(sqlitewraper.context,
                                Autotripservice);
                    }
                }
            }
            //First time DeviceSatatusIMEI entry at server side //will  exicute only one time in case of multipal download request
            if (touchFlag == 0) {
                boolean check2 = DeviceEventsUtils.isMyServiceRunning(context,
                        touch_server.class.getName());
                if (!check2) {
                    touchFlag = 1;
                    Log.d("##DownloadStart", "touchserverClled");
                    Intent z_n12 = new Intent(context,
                            touch_server.class);
                    WakefulIntentService.sendWakefulWork(context,
                            z_n12);
                }
            }
            //MAKE FORE GROUND SERVICE
            generateNotification("Download Started !!");

            //DOWNLOAD MODULES COUNT
            while (dwnCount == 1) {
                String u_c1 = b.GetValue();
                if (!u_c1.equalsIgnoreCase("NA")) {
                    dwnCount = w.downloadCounter();
                }
            }
            //DOWNLOAD USERDEFINE FLOW MASTER
            //Loop will be closed when status 2 will be returned from server indicating download complete
            while (userFlowCount == 1) {
                String u_c1 = b.GetValue();
                if (!u_c1.equalsIgnoreCase("NA")) {
                    userFlowCount = w.downloadUserDefineFlowMaster();
                }
            }
            //If User define completed successfully than checksheet will be download
            //CHECKSHEET DOWNLOAD
            if (userFlowCount == 2) {
                while (checksheetCount == 1) {
                    String u_c1 = b.GetValue();
                    if (!u_c1.equalsIgnoreCase("NA")) {
                        checksheetCount = w.checksheetDownload();
                    }
                }
            }

            //If Checksheet completede successfully than flow master will be download
            //FLOW MASTER DOWNLOAD
            if (checksheetCount == 2) {
                while (flowMasterCount == 1) {
                    String u_c1 = b.GetValue();
                    if (!u_c1.equalsIgnoreCase("NA")) {
                        flowMasterCount = w.flowMasterDownload();
                    }
                }
            }

            //When flow master download completed successfully than task download will begin
            //Task Download
            //GEOFENCE DOWNLOAD will run parallel with task download
            if (flowMasterCount == 2) {
                String u_c1 = b.GetValue();

                if (!u_c1.equalsIgnoreCase("NA")) {
                    Intent geotrackingService = new Intent(sqlitewraper.context, GeofenceDownlodService.class);
                    WakefulIntentService.sendWakefulWork(sqlitewraper.context, geotrackingService);
                    while (taskCount == 1) {

                        taskCount = w.taskmasterDownloadGlobal(k);
                        k++;
                    }
                }
            }
            // Threshold_new download
            // If task completed successfully than threshold_new will be download
            if(taskCount == 2)
            {
                while (thresholdnewCount == 1) {
                    String u_c1 = b.GetValue();
                    if (!u_c1.equalsIgnoreCase("NA")) {
                        thresholdnewCount = w.thresholdnewDownload();
                    }
                }
            }

            //TASK SWAP DOWANLOAD
            while (taskuserwapCount == 1) {
                //task will be downloaded with 0 values if userswap of task is there
                taskuserwapCount = w.taskMasterDownloadAfterUserSwap();
            }

            //Update the status of counter table after download finish
            if (userFlowCount == 2 && flowMasterCount == 2 && taskCount == 2 && checksheetCount == 2 &&  thresholdnewCount == 2) {

                updateStatus("1");
                updateStatus("2");
                updateStatus("3");
                updateStatus("4");
                updateStatus("5");

                generateNotification("Download Finished!!");
            }

            //Map locally parent task id in table based on parent relationship on server
            updateParentTaskId();

        } catch (Exception e) {
            e.printStackTrace();

        }
    }

    //UPDATE STATUS
    private void updateStatus(String id) {

        String t1;
        t1 = "_id = " + id;
        ContentValues cv2 = new ContentValues();

        cv2.put("status", "2");

        long temp12 = database.update("download_counter", cv2, t1,
                null);
    }

    //Map locally parent task id in table based on parent relationship on server
    void updateParentTaskId() {

        Cursor c = database
                .rawQuery(
                        "select p_server_task_id from task_master where p_tid is null and p_server_task_id !=0  GROUP BY p_server_task_id",
                        null);
        c.moveToFirst();
        if (c.getCount() > 0) {
            for (int i = 0; i < c.getCount(); i++) {

                int p_sid = c.getInt(0);

                Cursor check = database.rawQuery(
                        "select tid from task_master where server_task_id="
                                + p_sid, null);

                check.moveToFirst();
                if (check.getCount() > 0) {

                    int tid_task = check.getInt(0);
                    check.close();
                    String t = "p_server_task_id=" + p_sid;
                    ContentValues c_value = new ContentValues();
                    c_value.put("p_tid", tid_task);
                    long temp = database
                            .update("task_master", c_value, t, null);
                }
                check.close();
                c.moveToNext();
            }
        }
        c.close();
    }


    private void generateNotification(String downloadstatus) {

        int icon = R.drawable.atc_logo;
        Intent intent = new Intent(sqlitewraper.context, ph_s.class);
        PendingIntent contentIntent = PendingIntent.getActivity(sqlitewraper.context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        NotificationCompat.Builder b = new NotificationCompat.Builder(sqlitewraper.context);

        b.setAutoCancel(false)

                .setWhen(System.currentTimeMillis())
                .setSmallIcon(icon)
                .setContentTitle(getApplicationName(sqlitewraper.context) + " Download")
                .setContentIntent(contentIntent)
                .setContentText(downloadstatus)
                .setOngoing(true);


        NotificationManager notificationManager = (NotificationManager) sqlitewraper.context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (notificationManager != null) {
            notificationManager.notify(147, b.build());
            notificationManager.cancel(147);
        }

    }

    public String getApplicationName(Context context) {
        ApplicationInfo applicationInfo = context.getApplicationInfo();
        int stringId = applicationInfo.labelRes;
        return stringId == 0 ? applicationInfo.nonLocalizedLabel.toString() : context.getString(stringId);
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d("##Download", "2");
    }

//    insert location_log entery at login time
    public void Insert_current_location()
    {
        try{

            Date now = new Date();
            long time = now.getTime();
            String Date = now.toString();

            database = sqlitewraper.getDatabase();

            Cursor a_t = database.rawQuery(
                    "SELECT username FROM Login_Master", null);
            a_t.moveToFirst();
            int j = a_t.getCount();
            j++;
            String username = null;
            if (a_t.getCount() > 0) {

                username = a_t.getString(0);
            }

            String address = AddressApi.getCompleteAddress(Double.parseDouble(mlat), Double.parseDouble(mlon));
            if (address == null) {
                address = "na";
            }
            String imei1 = DeviceEventsUtils.getLoginDetails().get(1);

            ContentValues args = new ContentValues();
            args.put("cellid", imei1);
            args.put("lat", String.valueOf(mlat));
            args.put("date", time);
            args.put("date_s", Date);
            args.put("lon", String.valueOf(mlon));
            args.put("provider", "");
            args.put("accuracy", accuary);
            args.put("IS_SEND", 0);
            args.put("IS_LOC", time);
            args.put("address", address);
            args.put("wait_time", time);
            args.put("wait_time_s", Date);
            args.put("username", username);
            args.put("speed", 0);
            //lac column is use for check the trip status
            //true means trip start false means trip not start (10-01-2024)
            args.put("lac",DeviceEventsUtils.tripStatus());


            long temp = database.insert("location_log", null, args);

//            upload location entry into server
            Intent location = new Intent(sqlitewraper.context, location_server.class);
            WakefulIntentService.sendWakefulWork(sqlitewraper.context,
                    location);


        }
        catch (Exception e)
        {

        }


    }


    public void Insert_current_location_track_master()
    {
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
            String address = AddressApi.getCompleteAddress(Double.parseDouble(mlat), Double.parseDouble(mlon));
            if (address == null) {
                address = "na";
            }

            ContentValues args1 = new ContentValues();
            args1.put("cellid",address );
            args1.put("lat", String.valueOf(mlat));
            args1.put("date", time);
            args1.put("date_s", Date);
            args1.put("lon", String.valueOf(mlon));
            args1.put("provider", "");
            args1.put("accuracy", accuary);
            args1.put("IS_SEND", 0);
            args1.put("IS_LOC", time);
            args1.put("address", address);
            args1.put("username", username);
            args1.put("tripflag", "0");

            // only insert into track_master
            long temp_mast = database.insert("track_master", null, args1);
        }catch (Exception e){

            ////e.printStackTrace()();
        }
    }



    public void reqLocation() {

//        LocationListener locationListener = new MyLocationListner();
//        Location location1 = getLastKnownLocation();
//        if (location1 != null) {
//            locationListener.onLocationChanged(location1);
//        }else {
//            //Toast.makeText(sqlitewraper.context, "No Location Provider found", Toast.LENGTH_SHORT).show();
//        }

        try {
            fusedLocationClient = LocationServices.getFusedLocationProviderClient(getApplicationContext());
            locationRequest = createLocationRequestNew();
            onLocationChanged();
            startLocationUpdatesFused();
        } catch (SecurityException e) {
            e.printStackTrace();
        }
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

    protected LocationRequest createLocationRequestNew() {
        LocationRequest locationRequest = LocationRequest.create();
        locationRequest.setInterval(5000);
        locationRequest.setFastestInterval(2000);
        locationRequest.setPriority(LocationRequest.PRIORITY_HIGH_ACCURACY);
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
                    try{
                        mlat = DeviceEventsUtils.LatlngRoundff(String.valueOf(location.getLatitude()));
                        mlon = DeviceEventsUtils.LatlngRoundff(String.valueOf(location.getLongitude()));
                        accuary = String.format("%.2f", location.getAccuracy());

                        String address = AddressApi.getCompleteAddress(Double.parseDouble(mlat), Double.parseDouble(mlon));

                        Log.d("##lat :", String.valueOf(mlat) + "##lng :" + mlon);
                        Insert_current_location();
                        Insert_current_location_track_master();

                        if (fusedLocationClient != null) {
                            fusedLocationClient.removeLocationUpdates(locationCallback);
                        }

                    }
                    catch (Exception e)
                    {
                        e.printStackTrace();
                    }
                }
            }
        };
    }
    @Override
    public void onLocationChanged(Location location) {

    }

    @Override
    public void onProviderEnabled(@NonNull String provider) {

    }

    @Override
    public void onProviderDisabled(@NonNull String provider) {

    }

    @Override
    public void onStatusChanged(String provider, int status, Bundle extras) {

    }

//    private Location getLastKnownLocation() {
//        locationManager = (LocationManager) sqlitewraper.context.getSystemService(LOCATION_SERVICE);
//        List<String> providers = locationManager.getProviders(true);
//        Location bestLocation = null;
//        for (String provider : providers) {
//            @SuppressLint("MissingPermission") Location l = locationManager.getLastKnownLocation(provider);
//            if (l == null) {
//                continue;
//            }
//            if (bestLocation == null || l.getAccuracy() < bestLocation.getAccuracy()) {
//                // Found best last known location: %s", l);
//                bestLocation = l;
//            }
//        }
//        return bestLocation;
//    }
//
//    public class MyLocationListner implements LocationListener {
//        @Override
//        public void onLocationChanged(Location location) {
//
//            mlat = DeviceEventsUtils.LatlngRoundff(String.valueOf(location.getLatitude()));
//            mlon = DeviceEventsUtils.LatlngRoundff(String.valueOf(location.getLongitude()));
//            accuary =  String.format("%.2f",location.getAccuracy());
//
//            String address = AddressApi.getCompleteAddress(Double.parseDouble(mlat), Double.parseDouble(mlon));
//
//            Log.d("##lat :", String.valueOf(mlat) + "##lng :" + mlon);
//            Insert_current_location();
//        }
//
//        @Override
//        public void onStatusChanged(String provider, int status, Bundle extras) {
//        }
//
//        @Override
//        public void onProviderEnabled(String provider) {
//        }
//
//        @Override
//        public void onProviderDisabled(String provider) {
//
//        }
//    }

    private int tripStatus(){

        android.database.Cursor tripflag = database.rawQuery(
                "select * from lat_plug where trip_status = 0", null);
        tripflag.moveToFirst();
        int tripflagCount = tripflag.getCount();
        tripflag.close();
        return tripflagCount;
    }

    //function for checking if service is running or not
    private boolean isMyServiceRunning(Context context, String Myservice) {
        ActivityManager manager = (ActivityManager) context
                .getSystemService(Context.ACTIVITY_SERVICE);
        for (ActivityManager.RunningServiceInfo service : manager
                .getRunningServices(Integer.MAX_VALUE)) {
            if (Myservice.equals(service.service.getClassName())) {

                return true;
            }
        }
        return false;
    }
}
