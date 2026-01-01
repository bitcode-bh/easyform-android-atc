package com.sky.atc.easyformse;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.database.Cursor;
import android.location.Address;
import android.location.Geocoder;
import android.location.LocationManager;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.StrictMode;
import android.widget.Toast;

import com.sky.atc.easyformse.datautils.MySharedPreferences;

import net.sqlcipher.database.SQLiteDatabase;

import org.apache.http.HttpEntity;
import org.apache.http.client.ClientProtocolException;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.DefaultHttpClient;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.Locale;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

/**
 * Created by NareshChocha on 1/24/2024.
 *
 * @author NareshChocha
 */
@StringFogIgnore
public class newfused_recevier extends BroadcastReceiver {
    MySharedPreferences pref;
    long intervalMillis = 10 * 60 * 1000; // 10 minutes
    String gprs, gps, battery;
    //WCF URL
    private static final String WCFURL = sqlitewraper.context.getResources().getString(R.string.WCFURL);
    private static final String METHOD_NAME_corner = "WCF_InsertDeviceStatusImei";
    private SQLiteDatabase database;
    @Override
    public void onReceive(Context context, Intent intent) {
        StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
        StrictMode.setThreadPolicy(policy);
        database = sqlitewraper.getDatabase();
        pref = sqlitewraper.getSecureShared("MyPref");
        boolean isuploadlastentry = pref.getBoolean("isuploadlastentry",false);
//        check location and upload in server
        if(isuploadlastentry) {
            MySharedPreferences prefs = sqlitewraper.getSecureShared("mypre2");
            String companyFeatureid = prefs.getString("authcompanyfid", "0");
            if (companyFeatureid == null || companyFeatureid.equalsIgnoreCase("") || companyFeatureid.equalsIgnoreCase("0")) {

            } else {
                Check_location_and_upload();
            }

        }
    }

    public void Check_location_and_upload() {
        Cursor a_t = database.rawQuery(
                "select value from APP_states where ITEAM ='nick'",
                null);
        a_t.moveToFirst();
        String user_name = null;
        if (a_t.getCount() > 0) {
            user_name = a_t.getString(0);
        }
        a_t.close();


        Cursor c = database
                .rawQuery(
                        "select _id,lat,lon,date,date_s,accuracy,provider,IS_SEND,address,username,speed FROM  location_log WHERE   _id = (SELECT MAX(_id) FROM location_log where username='"
                                + user_name + "');", null);
        c.moveToFirst();

        if (c.getCount() > 0)
        {
            try {

                int tid = c.getInt(0);
                String lat = c.getString(1);
                String lon = c.getString(2);
                String date = c.getString(3);
                String date_s = c.getString(4);
                String accuracy = c.getString(5);
                String provider = c.getString(6);

                int IS_SEND = c.getInt(7);
                String username = c.getString(9);
                String speed = c.getString(10);
//						String address = add(Double.valueOf(lat), Double.valueOf(lon));
                String address = AddressApi.getCompleteAddress(Double.valueOf(lat), Double.valueOf(lon));

//                pref.putString("uploadmilisecond",date);
//                pref.commit();
                String imei1 = DeviceEventsUtils.getLoginDetails().get(1);
                try {
                    JSONObject ret = getLocationInfo(
                            Double.valueOf(lat), Double.valueOf(lon));
                    JSONObject add1;
                    String location_string = null;

                    add1 = ret.getJSONArray("results").getJSONObject(0);

                    address = add1.getString("formatted_address");
                } catch (Exception e) {
                }

                if (address == null) {
                    try {

                        Geocoder gcd = new Geocoder(
                                sqlitewraper.context,
                                Locale.getDefault());
                        List<Address> addresses = gcd.getFromLocation(
                                Double.valueOf(lat),
                                Double.valueOf(lon), 1);
                        if (addresses.size() > 0) {
                            Address a = addresses.get(0);
                            for (int k = 0; k < a
                                    .getMaxAddressLineIndex(); k++) {
                                if (address == null)
                                    address = a.getAddressLine(k);
                                else
                                    address = address + ","
                                            + a.getAddressLine(k);
                            }
                            address = address + ","
                                    + a.getCountryName();
                        }
                    } catch (Exception e) {
                        //e.printStackTrace();
                    }

                }
                long curr_ms = System.currentTimeMillis();
                ArrayList<String> utcmi;
                utcmi = utcCalculationOffset(String.valueOf(curr_ms));
                String timezone = utcmi.get(1);
                String utcmilliseconds = utcmi.get(0);

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

                final ConnectivityManager conMgr1 = (ConnectivityManager)sqlitewraper.context.getSystemService(Context.CONNECTIVITY_SERVICE);
                final NetworkInfo activeNetwork = conMgr1
                        .getActiveNetworkInfo();
                if (activeNetwork != null && activeNetwork.isConnected()) {
                    gprs = "1";

                } else {
                    gprs = "0";
                }

                JSONObject data2 = new JSONObject();
                data2.put("username", username);
                B_new b = new B_new();
                String u_c = b.GetValue();
                data2.put("u_c", u_c);


                // ------------------put data in jason----------------//
                boolean isUpload = true;


                if(isUpload)
                {
                    // upload last entry
                    JSONObject data1 = new JSONObject();
                    data1.put("imei", imei1);
                    data1.put("lat", Double.valueOf(lat));
                    data1.put("lon", Double.valueOf(lon));
                    data1.put("gps", gps);
                    data1.put("gprs", gprs);
                    data1.put("date", date);
                    data1.put("address", address);
                    data1.put("accuracy", accuracy);
                    data1.put("battery", String.valueOf(rawlevel));
                    data1.put("username", username);
                    data1.put("speed", "0");

//                    data1.put("cellid", imei1);
//                    data1.put("lat", lat);
//                    data1.put("username", username);
//                    data1.put("lon", lon);
//                    data1.put("date", date);
//                    data1.put("date_s", date_s);
//                    data1.put("accuracy", accuracy);
//                    data1.put("provider", provider);
//                    data1.put("IS_SEND", IS_SEND);
//                    data1.put("address", address);
//                    data1.put("speed", speed);
//                    data1.put("timezone", timezone);
//                    data1.put("utcmilliseconds", utcmilliseconds);

                    // --------------- put jason
                    // auth-----------------------//


                    // upload location log entry in to device status imei master
                    String restext = NewWebservicesCallEasyform.ExecuteNetworkHTTPPostRequestfile(data1, WCFURL, METHOD_NAME_corner,data1);

                    JSONArray jsonArray = new JSONArray(restext);
                    String status1 = null;
                    for (int k1 = 0; k1 < jsonArray.length(); k1++) {
                        JSONObject jsonObject = jsonArray.getJSONObject(0);
                        status1 = jsonObject.getString("status");
                    }
//                    if (status1.equalsIgnoreCase("1")) {
//                        {
//                            String t;
//                            t = "_id='" + tid + "'";
//                            ContentValues t_i = new ContentValues();
//                            t_i.put("IS_SEND", 1);
//                            long task = database.update("location_log",
//                                    t_i, t, null);
//                            task++;
//                            c.moveToNext();
//                        }
//                    }


                }


            } catch (Exception e) {
                //e.printStackTrace();

            }
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
            //e.printStackTrace();
        }
        return jsonObject;
    }

    public ArrayList utcCalculationOffset(String millisecond){

        ArrayList<String> arrayList=new ArrayList<>();

        long milliseconds = Long.parseLong(millisecond);

        Calendar rightNow = Calendar.getInstance();

        long offset = rightNow.get(Calendar.ZONE_OFFSET) +
                rightNow.get(Calendar.DST_OFFSET);

        long utcmilliseconds=milliseconds-offset;
        long zoneOffset =rightNow.get(Calendar.ZONE_OFFSET);

        String timezone= String.valueOf((zoneOffset));
        arrayList.add(String.valueOf(utcmilliseconds));
        arrayList.add(timezone.toString());
        return arrayList;
    }

}
