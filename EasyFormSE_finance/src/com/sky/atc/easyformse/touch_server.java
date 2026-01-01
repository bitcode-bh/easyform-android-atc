package com.sky.atc.easyformse;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.ProgressDialog;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.location.Address;
import android.location.Geocoder;
import android.location.Location;
import android.location.LocationManager;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.AsyncTask;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.preference.PreferenceManager;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;

import android.util.Log;

import com.commonsware.cwac.wakeful.WakefulIntentService;
import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.api.GoogleApiClient;
import com.google.android.gms.common.api.PendingResult;
import com.google.android.gms.common.api.Status;
import com.google.android.gms.location.LocationListener;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationServices;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.trip.LocationOutageUtils;

import net.sqlcipher.database.SQLiteDatabase;

import org.apache.http.HttpEntity;
import org.apache.http.client.ClientProtocolException;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.DefaultHttpClient;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;


//to Entry in Device status imei master
@StringFogIgnore
public class touch_server extends WakefulIntentService implements
        LocationListener,
        GoogleApiClient.ConnectionCallbacks,
        GoogleApiClient.OnConnectionFailedListener {

    private static final String URL = sqlitewraper.context.getResources().getString(R.string.App_URL) + "/Services/uploadwebservice.asmx?WSDL";
    //WCF URL
    private static final String WCFURL = sqlitewraper.context.getResources().getString(R.string.WCFURL);
    private static final String METHOD_NAME_corner = "WCF_InsertDeviceStatusImei";


    String Code;
    String gprs, gps, battery;
    // Use your own client id
    Context context;
    private SQLiteDatabase database;
    private ProgressDialog pDialog;

    private static final String TAG = "LocationActivity";
    private static final long INTERVAL = 10000 * 10;
    private static final long FASTEST_INTERVAL = 10000 * 5;

    LocationRequest mLocationRequest;
    GoogleApiClient mGoogleApiClient;
    Location mCurrentLocation;
    String mLastUpdateTime;
    NotificationChannel mChannel = null;
    String CHANNEL_ID = "my_channel_01";

    private boolean isLocationUpdated;

    public touch_server() {
        super("touch_server");
        // TODO Auto-generated constructor stub
    }

    @Override
    protected void doWakefulWork(Intent intent) {
        initLocation();
        makeForegroundService();
        checkLocationUpdate();
        Log.d("##TOUCHSERVER", "CALLED");
    }

    void update_appsate(String value, String ITEAM) {
        String t;
        ContentValues args = new ContentValues();
        t = " ITEAM='" + ITEAM + "'";
        args.put("VALUE", value);
        long temp = database.update("APP_states", args, t, null);
    }

    public String value(Context context, String field) {
        try {

            Cursor cursor = database.rawQuery(
                    "select VALUE from APP_states where ITEAM='" + field + "'",
                    null);
            cursor.moveToFirst();
            String t = "";

            t = cursor.getString(0);
            cursor.close();
            return t;
        } catch (Exception e) {
            return "";
        }
    }

    public JSONObject getLocationInfo(Double lat, Double lng) {

        HttpGet httpGet = new HttpGet(
                "http://maps.google.com/maps/api/geocode/json?latlng=" + lat
                        + "," + lng + "&sensor=true");
        HttpClient client = new DefaultHttpClient();
        org.apache.http.HttpResponse response;
        StringBuilder stringBuilder = new StringBuilder();

        try {
            response = client.execute(httpGet);
            HttpEntity entity = response.getEntity();
            java.io.InputStream stream = entity.getContent();
            int b;
            while ((b = stream.read()) != -1) {
                stringBuilder.append((char) b);
            }
        } catch (ClientProtocolException e) {
        } catch (IOException e) {
        }

        JSONObject jsonObject = new JSONObject();
        try {
            jsonObject = new JSONObject(stringBuilder.toString());
        } catch (JSONException e) {
            e.printStackTrace();
        }
        return jsonObject;
    }

    @Override
    public void onConnected(@Nullable Bundle bundle) {
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

        Log.d("##TOUCHSERVER", "LOCATIONUPDATE");

        isLocationUpdated = true;
        Log.d("##Location", String.valueOf(location.getLatitude()));
        uploadDetailsServer(location);
    }

    private void initLocation() {

        createLocationRequest();
        mGoogleApiClient = new GoogleApiClient.Builder(this)
                .addApi(LocationServices.API)
                .addConnectionCallbacks(this)
                .addOnConnectionFailedListener(this)
                .build();

        if (mGoogleApiClient != null) {
            mGoogleApiClient.connect();
        }
    }

    protected void createLocationRequest() {
        mLocationRequest = new LocationRequest();
        mLocationRequest.setInterval(INTERVAL);
        mLocationRequest.setFastestInterval(FASTEST_INTERVAL);
        mLocationRequest.setPriority(LocationRequest.PRIORITY_HIGH_ACCURACY);
    }

    protected void startLocationUpdates() {

        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            return;
        }
        PendingResult<Status> pendingResult = LocationServices.FusedLocationApi.requestLocationUpdates(
                mGoogleApiClient, mLocationRequest, this);
        Log.d(TAG, "Location update started ..............: ");
    }

    protected void stopLocationUpdates() {
        LocationServices.FusedLocationApi.removeLocationUpdates(
                mGoogleApiClient, this);
        Log.d(TAG, "Location update stopped .......................");
    }


    private void uploadDetailsServer(Location location) {

        try {
            ArrayList<JSONObject> list_loc = new ArrayList<JSONObject>();
            database = sqlitewraper.getDatabase();
            String address = null;

            String lat;
            String lon;
            String accuracy;
            String date;
            String speed;

            lat = String.valueOf(location.getLatitude());
            lon = String.valueOf(location.getLongitude());
            accuracy = String.valueOf(location.getAccuracy());
            date = String.valueOf(location.getTime());
            speed = String.valueOf(location.getSpeed());

            float ac1 = 0;
            ac1 = Float.valueOf(accuracy);

            if (!lat.equalsIgnoreCase("0") || !lon.equalsIgnoreCase("0")) {
                address = AddressApi.getCompleteAddress(Double.parseDouble(lat), Double.parseDouble(lon));
            } else {
                address = "";
            }

            if (address == null) {
                try {
                    Geocoder gcd = new Geocoder(sqlitewraper.context,
                            Locale.getDefault());
                    List<Address> addresses = gcd.getFromLocation(
                            Double.valueOf(lat), Double.valueOf(lon), 1);
                    if (addresses.size() > 0) {
                        Address a = addresses.get(0);
                        for (int k = 0; k < a.getMaxAddressLineIndex(); k++) {
                            if (address == null)
                                address = a.getAddressLine(k);
                            else
                                address = address + ","
                                        + a.getAddressLine(k);
                        }
                        address = address + "," + a.getCountryName();
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }

            if (sqlitewraper.internetflag == 1) {
                database = sqlitewraper.getDatabase();

                database = sqlitewraper.getDatabase();

                final ConnectivityManager connMgr = (ConnectivityManager) sqlitewraper.context
                        .getSystemService(Context.CONNECTIVITY_SERVICE);
                final NetworkInfo mobile = connMgr
                        .getNetworkInfo(ConnectivityManager.TYPE_MOBILE);
                LocationManager lm = (LocationManager) sqlitewraper.context
                        .getSystemService(sqlitewraper.context.LOCATION_SERVICE);
                boolean isGPSEnabled = lm
                        .isProviderEnabled(LocationManager.GPS_PROVIDER);
                Intent batteryIntent = sqlitewraper.context
                        .registerReceiver(null, new IntentFilter(
                                Intent.ACTION_BATTERY_CHANGED));
                int rawlevel = batteryIntent.getIntExtra("level", -1);

                if (isGPSEnabled) {
                    gps = "1";
                } else {
                    gps = "0";

                }

                final ConnectivityManager conMgr1 = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
                final NetworkInfo activeNetwork = conMgr1
                        .getActiveNetworkInfo();
                if (activeNetwork != null && activeNetwork.isConnected()) {
                    gprs = "1";

                } else {
                    gprs = "0";
                }
                SharedPreferences dialog1 = PreferenceManager
                        .getDefaultSharedPreferences(sqlitewraper.context);

                String imei = dialog1.getString("imei", "0");

//                if (imei.equalsIgnoreCase("0")) {
//                    imei = DeviceEventsUtils.getImei();
//                }

                ArrayList<JSONObject> list = new ArrayList<JSONObject>();
                LinkedHashMap<String, Object> lHashMap = new LinkedHashMap<String, Object>();
                lHashMap.put("imei", imei);
                lHashMap.put("gps", gps);
                lHashMap.put("gprs", gprs);
                lHashMap.put("battery", rawlevel);

                lHashMap.put("lat", Double.valueOf(lat));
                lHashMap.put("lon", Double.valueOf(lon));
                lHashMap.put("address", address);

                lHashMap.put("accuracy", ac1);
                lHashMap.put("date", date);

                JSONObject json = new JSONObject(lHashMap);
                list.add(json);

                Cursor a_t = database.rawQuery(
                        "select value from APP_states where ITEAM ='nick'",
                        null);
                a_t.moveToFirst();
                int j = a_t.getCount();

                String username = null;
                if (a_t.getCount() > 0) {
                    username = a_t.getString(0);
                }

                if (!username.equalsIgnoreCase("0")) {

                    JSONObject data1 = new JSONObject();
//                    data1.put("imei", imei);
                    data1.put("lat", Double.valueOf(lat));
                    data1.put("lon", Double.valueOf(lon));
                    data1.put("gps", gps);
                    data1.put("gprs", gprs);
                    data1.put("date", date);
                    data1.put("address", address);
                    data1.put("accuracy", ac1);
                    data1.put("battery", String.valueOf(rawlevel));
                    data1.put("username", username);
                    data1.put("speed", "o");

                    //To take imei from  newer android OS
                    new webcallmethod().execute(String.valueOf(data1));

                }
                a_t.close();
            } else {
                stopLocationUpdates();
            }
        } catch (Exception e) {
            e.printStackTrace();
            // TODO: handle exception
        }
    }

    @SuppressLint("WrongConstant")
    private void makeForegroundService() {

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            CharSequence name = "Easyform";// The user-visible name of the channel.
            int importance = NotificationManager.IMPORTANCE_HIGH;
            mChannel = new NotificationChannel(CHANNEL_ID, name, importance);
        }

        Notification notification = new NotificationCompat.Builder(sqlitewraper.context)
                .setSmallIcon(R.drawable.atc_logo)
                .setContentTitle(DeviceEventsUtils.getPackagename().get(0))
                .setContentText(DeviceEventsUtils.getPackagename().get(1))
                .setAutoCancel(false)
                .setOngoing(true)
                .setChannelId(CHANNEL_ID)
                .build();

        NotificationManager notificationCompatManager =
                (NotificationManager) getSystemService(NOTIFICATION_SERVICE);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            notificationCompatManager.createNotificationChannel(mChannel);
        }
        startForeground(1026, notification);
    }

    class webcallmethod extends AsyncTask<String, String, String> {

        @Override
        protected void onPreExecute() {
            super.onPreExecute();
        }

        @Override
        protected void onPostExecute(String s) {
            super.onPostExecute(s);
            if (s != null) {
                stopLocationUpdates();
                stopSelf();
            }
        }

        @Override
        protected String doInBackground(String... strings) {
            String restext1 = null;
            JSONObject jsonObj = null;
            String data = strings[0];
            try {

                SharedPreferences dialog1 = PreferenceManager
                        .getDefaultSharedPreferences(sqlitewraper.context);

                String imei = dialog1.getString("imei", "0");
                jsonObj = new JSONObject(data);

                if (imei.equalsIgnoreCase("0")) {
                    imei = DeviceEventsUtils.getImei();
                }
                jsonObj.put("imei", imei);

            } catch (JSONException e) {
                e.printStackTrace();
            }

            try {
                MySharedPreferences prefs = sqlitewraper.getSecureShared("mypre2");
                String companyFeatureid = prefs.getString("authcompanyfid", "0");
                if (companyFeatureid == null || companyFeatureid.equalsIgnoreCase("") || companyFeatureid.equalsIgnoreCase("0")) {

                } else {
                    restext1 = NewWebservicesCallEasyform.ExecuteNetworkHTTPPostRequestfile(jsonObj, WCFURL, METHOD_NAME_corner, jsonObj);
                    Log.d("##touchserverResponse", restext1);
                }


            } catch (Exception e) {
                e.printStackTrace();
            }

            return restext1;
        }
    }


    private void checkLocationUpdate() {



        final Handler handler = new Handler(Looper.getMainLooper());
        handler.postDelayed(new Runnable() {
            @Override
            public void run() {

                if (!isLocationUpdated) {
                    LocationOutageUtils.locatiupdateAlert();
                }
            }
        }, 20000);

    }
}
