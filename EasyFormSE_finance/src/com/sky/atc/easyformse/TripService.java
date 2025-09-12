package com.sky.atc.easyformse;

import android.content.ContentValues;
import android.content.Intent;
import android.os.StrictMode;
import android.util.Log;

import com.commonsware.cwac.wakeful.WakefulIntentService;
import com.sky.atc.easyformse.datautils.MySharedPreferences;

import net.sqlcipher.Cursor;
import net.sqlcipher.database.SQLiteDatabase;

import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.impl.client.BasicResponseHandler;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.protocol.BasicHttpContext;
import org.apache.http.protocol.HttpContext;
import org.json.JSONArray;
import org.json.JSONObject;

import io.michaelrocks.paranoid.Obfuscate;

//for ETA calculation ad upload it to the server
@Obfuscate
public class TripService extends WakefulIntentService {

    private static final String MY_PREFS_NAME = "MY_TRIP";
    SQLiteDatabase database;

    TripUploadNew tripUploadNew;
    private static final String PATHURL = sqlitewraper.context.getResources().getString(R.string.PATHURL);


    public TripService() {
        super("TripService");
    }

    @Override
    protected void doWakefulWork(Intent intent) {

        database = sqlitewraper.getDatabase();
        String tid = null;
        String unique_trip_id = null;
        tripUploadNew = new TripUploadNew();


        MySharedPreferences prefs = sqlitewraper.getSecureShared(MY_PREFS_NAME);
        String restoredText = prefs.getString("tid", null);
        if (restoredText != null) {
            tid = prefs.getString("tid", "");//"No name defined" is the default value.
            unique_trip_id = prefs.getString("unique_trip_id", "");//"No name defined" is the default value.
        }

        String cnd;
        cnd = "unique_trip_id='" + unique_trip_id + "'";
        ContentValues c_path = new ContentValues();
//										c_path.put("issend", "1");
        c_path.put("last_upload_ms", System.currentTimeMillis());
        long temp = database.update("lat_plug",
                c_path, cnd, null);
        Log.d("##milliUpdate", String.valueOf(temp));


        String issend = "0";
        String etaflag = "0";
        Cursor c1 = database
                .rawQuery(
                        "select issend,etaflag from lat_plug where  unique_trip_id="
                                + "'" + unique_trip_id + "'", null);
        c1.moveToFirst();
        int count = c1.getCount();

        //Change issend flag with trip_status
        if (count > 0) {
            for (int i = 0; i < c1.getCount(); i++) {
                issend = c1.getString(0);
                etaflag = c1.getString(1);
            }
        }
        c1.close();

        if (count > 0) {
            if (!issend.equalsIgnoreCase("1")) {
                if (etaflag.equalsIgnoreCase("true")) {
                    tripCalculation(tid, unique_trip_id);
                }
            }
        }
    }

    //Calculation for ETA
    private void tripCalculation(String tid, String unique_trip_id) {

        String siteLng = null;
        String siteLat = null;
        String userLat = null;
        String userLng = null;
        String trip_status = null;


        Cursor c1 = database
                .rawQuery(
                        "select d_lat,d_lon,trip_status from lat_plug where  unique_trip_id="
                                + "'" + unique_trip_id + "'", null);
        c1.moveToFirst();
        int count = c1.getCount();

        if (count > 0) {
            for (int i = 0; i < c1.getCount(); i++) {
                siteLat = c1.getString(0);
                siteLng = c1.getString(1);
                trip_status = c1.getString(2);
            }
        }
        c1.close();
        Cursor c2 = database
                .rawQuery(
                        "SELECT lat,lon,address, c_accuracy,date  FROM  track_master WHERE   _id = (SELECT MAX(_id) FROM track_master);",
                        null);
        c2.moveToFirst();
        c2.moveToFirst();
        int count1 = c2.getCount();

        if (count1 > 0) {

            for (int i = 0; i < c2.getCount(); i++) {
                userLat = c2.getString(0);
                userLng = c2.getString(1);
            }
        }
        c2.close();

        getETAValue(siteLat, siteLng, userLat, userLng, Integer.parseInt(tid), trip_status, unique_trip_id);

    }

    //get ETA from API
    private void getETAValue(String siteLat, String siteLng, String userLat, String userLng, int tid, String trip_status, String unique_trip_id) {


//     String appUrl = "http://maps.googleapis.com/maps/api/directions/json?origin=" + siteLat + "," + siteLng + "&destination=" + userLat + "," + userLng + "&sensor=false&mode=DRIVING";
        String appUrl = PATHURL + userLng + "," + userLat + ";" + siteLng + "," + siteLat + "?geometries=geojson";
//     String restext = NewWebservicesCallEasyform.ExecuteNetworkHTTPPostRequest(null, appUrl, null);

        String restext = getResponse(appUrl);

        String duration = "NA";
        String distance1 = "NA";

        try {

            JSONObject jsonObj = new JSONObject(restext);
            // Getting JSON Array node
            JSONArray routes = jsonObj.getJSONArray("routes");
            JSONObject jsonObject = routes.getJSONObject(0);
            duration = jsonObject.getString("duration");
            distance1 = jsonObject.getString("distance");

            duration = getDurationString(Float.parseFloat(duration));

            distance1 = getKM(Float.parseFloat(distance1));

            updateDatabase(duration, tid, trip_status, unique_trip_id, userLat, userLng, siteLat, siteLng, distance1);

        }
//        catch (Exception e){
//
//        }
//
//        String duration = "NA";
//        if (restext != null) {
//
//            try {
//
//                JSONObject jsonObject2 = new JSONObject(restext);
//                String status = String.valueOf(jsonObject2.get("status"));
//
//
//                JSONObject jsonObject = new JSONObject(restext);
//                JSONArray routes = jsonObject.getJSONArray("routes");
//                JSONObject routesObject = routes.getJSONObject(0);
//                JSONArray legsArray = routesObject.getJSONArray("legs");
//                JSONObject legsObject = legsArray.getJSONObject(0);
//                JSONObject durationObject = legsObject.getJSONObject("duration");
//                duration = durationObject.getString("text");
//                updateDatabase(duration, tid, trip_status, unique_trip_id, userLat, userLng,siteLat,siteLng);
//
//            }
        catch (Exception e) {
            Log.e("##TripPlugin", e.toString());
            Cursor c1 = database
                    .rawQuery(
                            "select eta from lat_plug where  unique_trip_id="
                                    + "'" + unique_trip_id + "'", null);
            c1.moveToFirst();
            int count = c1.getCount();
            if (count > 0) {
                for (int i = 0; i < c1.getCount(); i++) {
                    duration = c1.getString(0);
                }
            }
            c1.close();
            if (duration == null) {
                duration = "";
            }

            updateDatabase(duration, tid, trip_status, unique_trip_id, userLat, userLng, siteLat, siteLng, distance1);
        }
    }


    //update in to database
    private void updateDatabase(String duration, int tid, String trip_status, String unique_trip_id, String s_lat, String s_lon, String llat, String llon, String distance1) {

        String t = "unique_trip_id=" + "'" + unique_trip_id + "'";
        ContentValues v = new ContentValues();
        v.put("eta", duration);
        v.put("s_lat_eta", s_lat);
        v.put("s_lon_eta", s_lon);
        v.put("distance", distance1);
        long temp = database.update("lat_plug", v, t, null);
        Log.d("##ETAUpdate", duration);

        if (trip_status.equalsIgnoreCase("0")) {

            Log.d("##TripServiceNew", trip_status);
            tripUploadNew.uploadTripContinues();
        }
    }


    public String getResponse(String url) {

        String jsonResponse = null;
        try {
            StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder()
                    .permitAll().build();
            StrictMode.setThreadPolicy(policy);
            HttpClient httpClient = new DefaultHttpClient();
            HttpContext localContext = new BasicHttpContext();
            HttpPost httpPost = new HttpPost(url);
            HttpResponse response = httpClient.execute(httpPost, localContext);

            jsonResponse = new BasicResponseHandler().handleResponse(response);

        } catch (Exception e) {
            e.printStackTrace();
        }
        return jsonResponse;
    }

    private String getDurationString(float seconds) {

        int hours = (int) (seconds / 3600);
        int minutes = (int) ((seconds % 3600) / 60);
        seconds = seconds % 60;

        return twoDigitString(hours) + " hours " + twoDigitString(minutes) + " mins";
    }

    private String twoDigitString(int number) {

        if (number == 0) {
            return "00";
        }
        if (number / 10 == 0) {
            return "0" + number;
        }
        return String.valueOf(number);
    }

    private String getKM(float meters) {

        float km1 = meters / 1000;
        return km1 + " KM";
    }

}
