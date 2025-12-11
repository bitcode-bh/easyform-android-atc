package com.sky.atc.easyformse;


import android.Manifest;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Looper;
import android.os.StrictMode;
import android.util.Log;
import android.widget.Toast;

import androidx.core.app.ActivityCompat;

import com.commonsware.cwac.wakeful.WakefulIntentService;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.sky.atc.easyformse.attendance.newattendanceutils.AttendanceUtil;
import com.sky.atc.easyformse.attendance.newattendanceutils.models.AttendanceData;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.trip.LocationOutageUtils;
import com.sky.atc.easyformse.trip.TripBackgroundMapActivity;

import net.sqlcipher.Cursor;
import net.sqlcipher.database.SQLiteDatabase;


import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;

import io.michaelrocks.paranoid.Obfuscate;

//for Auto trip stop and upload
@Obfuscate
public class AutoTripStopService extends WakefulIntentService implements LocationListener {

    private static final String MY_PREFS_NAME = "MY_TRIP";
    SQLiteDatabase database;

    TripUploadNew tripUploadNew;
    private static final String PATHURL = sqlitewraper.context.getResources().getString(R.string.PATHURL);

    private LocationManager locationManager;
    private Location startLocation;
    private static final float LOCATION_THRESHOLD = 100; // meters
    private boolean tripStarted = false;
    MySharedPreferences editor;
    //Fused Location provider
    private FusedLocationProviderClient fusedLocationClient;
    private LocationCallback locationCallback;
    private LocationRequest locationRequest;
    private String TripStartTime;
    public AutoTripStopService() {
        super("TripService");
    }

    @Override
    protected void doWakefulWork(Intent intent) {

        database = sqlitewraper.getDatabase();
        String tid = null;
        String unique_trip_id = null;
        tripUploadNew = new TripUploadNew();
        editor = sqlitewraper.getSecureShared(MY_PREFS_NAME);
        locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);

        // Start location tracking
        try {
//            locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 1000, 10, this);
            fusedLocationClient = LocationServices.getFusedLocationProviderClient(getApplicationContext());
            locationRequest = createLocationRequestNew();
            onLocationChanged();
            startLocationUpdatesFused();
        } catch (SecurityException e) {
            e.printStackTrace();
        }


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

    private boolean shouldAutoStopTrip(long tripStartTimeMillis, String autoEndTime, long currentTimeMillis) {
        try {
            // Convert trip start time to yyyy-MM-dd
            Date tripStartDate = new Date(tripStartTimeMillis);
            SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
            String tripDateStr = dateFormat.format(tripStartDate);

            // Combine date + auto end time
            String fullDateTime = tripDateStr + " " + autoEndTime;

            // Parse full datetime
            SimpleDateFormat dateTimeFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault());
            Date tripAutoEndDateTime = dateTimeFormat.parse(fullDateTime);
            long tripAutoEndMillis = tripAutoEndDateTime.getTime();

            // Check time and location
            return currentTimeMillis > tripAutoEndMillis;

        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    private int tripStatus(){

        android.database.Cursor tripflag = database.rawQuery(
                "select * from lat_plug where trip_status = 0", null);
        tripflag.moveToFirst();
        int tripflagCount = tripflag.getCount();
        tripflag.close();
        return tripflagCount;
    }

    private  void GetTripStartLocation()
    {
        try {
            android.database.Cursor check = database.rawQuery(
                    "select s_lat,s_lon,min_milli from lat_plug where trip_status = 0", null);

            check.moveToFirst();
            if ((check.getCount() > 0)) {
                String latStr = check.getString(0);
                String lonStr = check.getString(1);
                TripStartTime = check.getString(2);
                check.close();

                if (latStr != null && lonStr != null &&
                        !latStr.trim().isEmpty() && !lonStr.trim().isEmpty()) {

                    try {
                        double lat = Double.parseDouble(latStr.trim());
                        double lon = Double.parseDouble(lonStr.trim());

                        startLocation = new Location("");
                        startLocation.setLatitude(lat);
                        startLocation.setLongitude(lon);

                    } catch (NumberFormatException e) {
                        Log.e("TripService", "Invalid latitude or longitude format: " +
                                "lat=" + latStr + ", lon=" + lonStr, e);
                    }

                }

            }
        }
        catch (Exception e)
        {
            Log.d("Exception",e.toString());
        }
    }
    @Override
    public void onLocationChanged(Location location) {
//        if(tripStatus() > 0 )
//        {
//            GetTripStartLocation();
//            if(startLocation != null) {
//                float distance = location.distanceTo(startLocation);
//                if (distance < LOCATION_THRESHOLD && isAfter6PM()) {
//                    Log.d("tag","Callstoptrip");
//                    stopTrip(location);
//                }
//            }
//        }

    }

    public void stopTrip(Location location,String punchoutstatus)
    {
        try{

            editor = sqlitewraper.getSecureShared(MY_PREFS_NAME);
            MySharedPreferences prefs = sqlitewraper.getSecureShared(MY_PREFS_NAME);
            String t;
            String tid = prefs.getString("tid", null);
            String siteLng = "0";
            String siteLat = "0";
            String sid = "0";
            String millisecond = "0";
            String step_id = "1";
            String checkid = "0";
            String s_lat = "0";
            String s_lon = "0";
            String status = "";

            String unique_trip_id = null;
            String site_name = null;
            String matchKeyID = null;

            Cursor c1 = database
                    .rawQuery(
                            "select lat,long,server_task_id,millisecond,checksheetid,site_name,match_temp_id,status from task_master where tid="
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
                    status = c1.getString(7);
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


            // s_lat = String.valueOf(pointOneLat);
            // s_lon = String.valueOf(pointOneLang);


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
            //latc.put("odometer_point", odometerpoint);
            // latc.put("trip_status", trip_status);
            latc.put("site_name", site_name);
            latc.put("sh_path", "");
            latc.put("ac_path", "");
            latc.put("Event", "");
            //latc.put("etaflag", etaFlag);
            latc.put("match_temp_id", matchKeyID);




            editor.putString("llat", String.valueOf(location.getLatitude()));
            editor.putString("llon", String.valueOf(location.getLongitude()));
            editor.commit();


            String restoredText = prefs.getString("tid", null);
            if (restoredText != null) {
                unique_trip_id = prefs.getString("unique_trip_id", "");//"No name defined" is the default value.
            }



            Cursor tidcursor = database.rawQuery(
                    "SELECT tid  FROM  lat_plug WHERE   _id = (SELECT MAX(_id) FROM lat_plug);", null);
            tidcursor.moveToFirst();

            int j = tidcursor.getCount();

            String tid1 = null;
            t = "tid='" + tid + "' and trip_status='" + 0 + "'";

            insertTrackmaster(String.valueOf(location.getLatitude()), String.valueOf(location.getLongitude()), String.valueOf(location.getAccuracy()));
            insertLocation_log_Tbl(String.valueOf(location.getLatitude()), String.valueOf(location.getLongitude()), String.valueOf(location.getAccuracy()));


            latc.put("trip_status", "1");
            latc.put("trip_shflag", "1");
            latc.put("max_milli", System.currentTimeMillis());
            latc.put("llat", String.valueOf(location.getLatitude()));
            latc.put("llon", String.valueOf(location.getLongitude()));

            long temp = database.update("lat_plug", latc, t, null);
            Log.d("##TripUpdate", String.valueOf(temp));
//        if (temp == 0) {
//            checkAvailibilityOftrip(tid, latc, s_lat, s_lon, unique_trip_id);
//        }

            task_master_history(Integer.parseInt(tid), status,punchoutstatus);
            String cnd;
            cnd = "tid=" + tid;
            ContentValues c_path = new ContentValues();
            c_path.put("flag", "1");
            long temp2 = database.update("task_master",
                    c_path, cnd, null);

            Intent i_ch2 = new Intent(sqlitewraper.context,
                    f_upload_new_structure.class);
            WakefulIntentService.sendWakefulWork(sqlitewraper.context,
                    i_ch2);
           // Toast.makeText(this, "trip stoped", Toast.LENGTH_SHORT).show();
            MySharedPreferences pref = sqlitewraper.getSecureShared("MyPref");
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
            else {
                TripBackgroundMapActivity.mActivity.finish();
            }


        }
        catch (Exception e)
        {
            Log.d("Exceptionautotrip",e.toString());
        }
    }

    //insert into task master history
    void task_master_history(int tid, String oldstatus,String punchoutstatus) {
        android.database.Cursor c1_n = database
                .rawQuery(
                        "Select tid,task_id ,server_task_id ,flag ,user_id ,username ,rate ,siteid ,site_name ,site_address ,percentage ,survey_date ,lat ,long ,inspect_count ,checksheetid ,height ,display_siteid ,step ,status ,upload_date ,updateddate ,millisecond , end_of_date , data ,tower_type ,moduleid ,module_name ,moduledef,srnumber,global_var,punch_flag,in_ms,out_ms,duration,is_delete_photo,is_delete_log,initialstatus,edit_global_var,is_delete_sub,list_html,islogdown,que_milli,que_id,edit_flag,p_udf_id,match_temp_id from task_master where tid="
                                + tid, null);
        c1_n.moveToFirst();
        if (c1_n.getCount() > 0) {
            int tid_n = c1_n.getInt(0);
            String task_id = c1_n.getString(1);
            int server_task_id = c1_n.getInt(2);
            String flag = c1_n.getString(3);
            int user_id = c1_n.getInt(4);
            String username = c1_n.getString(5);
            float rate = c1_n.getFloat(6);
            String siteid = c1_n.getString(7);
            String site_name = c1_n.getString(8);
            String site_address = c1_n.getString(9);
            float percentage = c1_n.getFloat(10);
            String survey_date = c1_n.getString(11);
            float lat = c1_n.getFloat(12);
            float lon = c1_n.getFloat(13);

            int inspect_count = c1_n.getInt(14);
            int checksheetid = c1_n.getInt(15);
            float height = c1_n.getFloat(16);
            String display_siteid = c1_n.getString(17);
            int step = c1_n.getInt(18);
            int status = c1_n.getInt(19);
            String upload_date = c1_n.getString(20);
            String updateddate = c1_n.getString(21);
            String millisecond = c1_n.getString(22);

            String end_of_date = c1_n.getString(23);
            String data = c1_n.getString(24);
            String tower_type = c1_n.getString(25);
            String moduleid = c1_n.getString(26);
            String module_name = c1_n.getString(27);
            String moduledef = c1_n.getString(28);
            String srnumber = c1_n.getString(29);

            String global_var = c1_n.getString(30);


            String punchFlag = c1_n.getString(31);
            String inMs = c1_n.getString(32);
            String outMs = c1_n.getString(33);
            String durationPunch = c1_n.getString(34);

            String is_delete_photo = c1_n.getString(35);
            String is_delete_log = c1_n.getString(36);
            String initialstatus = c1_n.getString(37);
            String edit_global_var = c1_n.getString(38);
            String is_delete_sub = c1_n.getString(39);
            String list_html = c1_n.getString(40);
            String islogdown = c1_n.getString(41);
            String que_milli = c1_n.getString(42);
            String que_id = c1_n.getString(43);
            String edit_flag = c1_n.getString(44);
            String p_udf_id = c1_n.getString(45);
            String match_temp_id = c1_n.getString(46);


            if (punchFlag == null) {
                punchFlag = "0";

            }
            if (inMs == null) {
                inMs = "0";
            }
            if (outMs == null) {
                outMs = "0";

            }
            if (durationPunch == null) {
                durationPunch = "0";
            }


            ContentValues c = new ContentValues();
            c.put("tid", tid_n);
            c.put("task_id", task_id);
            c.put("server_task_id", server_task_id);
            c.put("flag", "1");
            c.put("user_id", user_id);
            c.put("username", username);
            c.put("rate", rate);
            c.put("siteid", siteid);
            c.put("site_name", site_name);
            c.put("site_address", site_address);
            c.put("percentage", percentage);
            c.put("survey_date", survey_date);
            c.put("lat", lat);
            c.put("long", lon);
            c.put("inspect_count", inspect_count);
            c.put("checksheetid", checksheetid);
            c.put("height", height);
            c.put("display_siteid", display_siteid);
            c.put("step", step);
            c.put("status", punchoutstatus);
            c.put("upload_date", upload_date);
            c.put("updateddate", updateddate);
            c.put("millisecond", millisecond);
            c.put("end_of_date", end_of_date);
            c.put("data", data);
            c.put("tower_type", tower_type);
            c.put("moduleid", moduleid);
            c.put("module_name", module_name);
            c.put("moduledef", moduledef);
            c.put("srnumber", srnumber);
            c.put("global_var", global_var);

            //-----------punch--------//

            c.put("punch_flag", punchFlag);
            c.put("in_ms", inMs);
            c.put("out_ms", outMs);

            c.put("is_delete_photo", is_delete_photo);
            c.put("is_delete_log", is_delete_log);
            c.put("initialstatus", initialstatus);
            c.put("edit_global_var", edit_global_var);
            c.put("is_delete_sub", is_delete_sub);
            c.put("list_html", list_html);
            c.put("islogdown", islogdown);
            c.put("que_milli", que_milli);
            c.put("que_id", que_id);
            c.put("edit_flag", edit_flag);
            c.put("p_udf_id", p_udf_id);
            c.put("match_temp_id", match_temp_id);
            c.put("local_milli", System.currentTimeMillis());
            c.put("entry_type", "and_autotrip");
            c.put("old_status", oldstatus);

            c1_n.close();


            android.database.Cursor c2_n = database.rawQuery(
                    "Select * from task_master_history where status= " + status
                            + "  and tid=" + tid, null);
            c2_n.moveToFirst();

            if (c2_n.getCount() > 0) {

                String t;
                int tid_new = c2_n.getInt(0);
                t = "tid_n=" + tid_new;
                long temp = database.update("task_master_history", c, t, null);

            } else {

                long temp = database.insert("task_master_history", null, c);
//                Log.d("##OLDSTATUS3", String.valueOf(temp));
                temp++;

            }
            c2_n.close();
        }
    }

    public void insertTrackmaster(String lat, String lon,String accuracy1) {


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
        String Date = now.toLocaleString();

        ContentValues args1 = new ContentValues();
        args1.put("cellid", add);
        args1.put("lat", lat);
        args1.put("date", time.toString());
        args1.put("date_s", Date);
        args1.put("lon", lon);
        args1.put("provider", "gps");
        args1.put("accuracy", accuracy1);
        args1.put("speed", "0.0");
        args1.put("IS_SEND", 0);
        args1.put("IS_LOC", time);
        args1.put("address", add);
        args1.put("username", username);
        args1.put("tripflag", "2");

        long temp_mast = database.insert("track_master", null, args1);

    }


    // trip start and end time insert entry in location_log tbl and upload
    public void insertLocation_log_Tbl(String lat, String lon ,String accuracy1) {


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
    @Override
    public void onStatusChanged(String provider, int status, Bundle extras) {

    }

    @Override
    public void onProviderEnabled(String provider) {

    }

    @Override
    public void onProviderDisabled(String provider) {

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
        locationRequest.setSmallestDisplacement(10);
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
                    if(tripStatus() > 0 )
                    {
                        GetTripStartLocation();
                        if(startLocation != null) {
                            float distance = location.distanceTo(startLocation);
//                            if (distance < LOCATION_THRESHOLD && isAfter6PM()) {
//                                Log.d("tag","Callstoptrip");
//                                stopTrip(location);
//                            }
                            AttendanceData mAttendanceData = AttendanceUtil.getAttendanceDataList().get(0);
                            String punchoutstatus = mAttendanceData.getPunchout_Status();

                            if(punchoutstatus != null)
                            {
                                boolean shouldStopTrip = false;
                                String Duration ;
                                String SameLocation = "false";
                                String duration_hour = "";

                                if (mAttendanceData.getAllow_round_trip() != null) {
                                    SameLocation = mAttendanceData.getAllow_round_trip();
                                }

                                //  Condition 1: Trip start + duration time
//
                                if( mAttendanceData.getAuto_punchout_duration_hours() == null || mAttendanceData.getAuto_punchout_duration_hours().equalsIgnoreCase(""))
                                {
                                    // duration hours getting null use 24 hours
                                    duration_hour = "24:00";
                                    if (isTripFinished_hourbase(TripStartTime,duration_hour)) {
                                        stopTrip(location,punchoutstatus);
                                        return;
                                    }
                                }
                                else {
                                    duration_hour = mAttendanceData.getAuto_punchout_duration_hours();
//                                    duration_hour = "5:00";
                                    if (isTripFinished_hourbase(TripStartTime,duration_hour)) {
                                        stopTrip(location,punchoutstatus);
                                        return;
                                    }
                                }


                                //Condition 2: Use configured auto punch-out duration
                                // Check duration or 24-hour time condition
                                if (mAttendanceData.getAuto_punchout_duration() == null || mAttendanceData.getAuto_punchout_duration().equalsIgnoreCase("")) {
                                    if (is24HoursPassed(Long.parseLong(TripStartTime))) {
                                        stopTrip(location,punchoutstatus);
                                        return;
                                    }
                                }
                                else {
                                    try {
                                        Duration = mAttendanceData.getAuto_punchout_duration();
                                        if(shouldAutoStopTrip(Long.parseLong(TripStartTime),Duration,System.currentTimeMillis()))
                                        {
                                            shouldStopTrip = true;
                                        }
                                    } catch (Exception e) {
                                        // log warning if needed
                                    }
                                }

                                if (shouldStopTrip) {

                                    MySharedPreferences pref1 = sqlitewraper.getSecureShared("MyPref");
                                    boolean ISTripStartAfter6PM = pref1.getBoolean("ISTripStartAfter6PM",false);
                                    boolean ISExitGeofence = pref1.getBoolean("ISExitGeofence",false);

                                    if(SameLocation.equalsIgnoreCase("true"))
                                    {
                                        if (!ISTripStartAfter6PM && distance < LOCATION_THRESHOLD) {
                                            stopTrip(location,punchoutstatus);
                                            return;
                                        }
                                        else if (ISTripStartAfter6PM &&  isTripFinished_hourbase(TripStartTime,duration_hour)){
                                            stopTrip(location,punchoutstatus);

                                            pref1.putBoolean("ISTripStartAfter6PM",false);
                                            pref1.putBoolean("ISExitGeofence",false);
                                            pref1.commit();
                                            return;

                                        }

                                    }
                                    else {
                                        if (!ISTripStartAfter6PM) {
                                            stopTrip(location,punchoutstatus);
                                            return;
                                        }
                                        else if (ISTripStartAfter6PM &&  isTripFinished_hourbase(TripStartTime,duration_hour) ){
                                            stopTrip(location,punchoutstatus);

                                            pref1.putBoolean("ISTripStartAfter6PM",false);
                                            pref1.putBoolean("ISExitGeofence",false);
                                            pref1.commit();
                                            return;

                                        }
                                    }
                                }

                            }

                        }
                    }
                }
            }
        };
    }

    private static boolean is24HoursPassed(long pastTimeMillis) {
        long currentTimeMillis = System.currentTimeMillis();
        long diff = currentTimeMillis - pastTimeMillis;

        long hoursPassed = diff / (1000 * 60 * 60); // convert to hours
        return hoursPassed >= 24;
    }

    public static boolean isTripFinished_hourbase(String startTimeStr,String duration) {
        try {
            long startMillis = Long.parseLong(startTimeStr);  // epoch millis
            Date startDate = new Date(startMillis);

            String[] separated = duration.split(":");
            Calendar calendar = Calendar.getInstance();
            calendar.setTime(startDate);
            calendar.add(Calendar.HOUR_OF_DAY, Integer.parseInt(separated[0]));
            calendar.add(Calendar.MINUTE, Integer.parseInt(separated[1]));


            Date stopTime = calendar.getTime();

            // Get current time
            Date currentTime = new Date();

            return currentTime.after(stopTime);

        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
}
