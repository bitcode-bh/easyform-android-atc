package com.sky.atc.easyformse;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;

import org.apache.http.HttpEntity;
import org.apache.http.client.ClientProtocolException;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.DefaultHttpClient;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.ksoap2.SoapEnvelope;
import org.ksoap2.serialization.PropertyInfo;
import org.ksoap2.serialization.SoapObject;
import org.ksoap2.serialization.SoapPrimitive;
import org.ksoap2.serialization.SoapSerializationEnvelope;
import org.ksoap2.transport.HttpTransportSE;
import org.w3c.dom.Document;

import android.content.ContentValues;
import android.content.Intent;
import android.database.Cursor;
import net.sqlcipher.database.SQLiteDatabase;
import android.graphics.BitmapFactory;
import android.graphics.BitmapFactory.Options;
import android.location.Address;
import android.location.Geocoder;
import android.net.Uri;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.provider.MediaStore;
import android.util.Log;
import android.widget.Toast;

import com.commonsware.cwac.wakeful.WakefulIntentService;
import com.google.android.gms.maps.model.LatLng;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.utils.LogUtils;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

//Upload Events to the server
@StringFogIgnore
public class Event extends WakefulIntentService {

    SQLiteDatabase database;
    //WCF URL
    private static final String WCFURL = sqlitewraper.context.getResources().getString(R.string.WCFURL);
//  private static final String METHOD_NAME_corner13 = "WCF_Insert_Device_Event_Master";
    private static final String METHOD_NAME_corner13 = "Insert_Device_Event_Master";

    public Event() {
        super("getlatlong");
        // TODO Auto-generated constructor stub
    }

    @Override
    protected void doWakefulWork(Intent arg0) {
        // time = System.currentTimeMillis();

        Cursor check = null;
        try {

            if (sqlitewraper.internetflag == 1) {
                MySharedPreferences prefs = sqlitewraper.getSecureShared("mypre2");
                String companyFeatureid = prefs.getString("authcompanyfid", "0");
                if (companyFeatureid == null || companyFeatureid.equalsIgnoreCase("") || companyFeatureid.equalsIgnoreCase("0")) {

                } else {
                database = sqlitewraper.getDatabase();
                // added more event type upload time 03/12/2024
                check = database
                        .rawQuery(
                                "select _id,Event_strt,Event_end,username,Event_type,lat,lon,duration,battery,timezone,utcstart,utcend,imei,appid,userid,maxviolation,tid from Events where is_send=0 and Event_type IN ('StillViolation','speed','Harsh Brake','Gps_outage','Gprs_outage','Phone_outage','App_outage','Service_outage','PowerSavingMode')",
                                null);
                check.moveToFirst();
                int id;
                String Event_strt, Event_end, username, Event_type, lat, lon;

                if (check.getCount() > 0) {

                    for (int i = 0; i < check.getCount(); i++) {
                        try {
                            id = check.getInt(0);
                            Event_strt = check.getString(1);
                            Event_end = check.getString(2);
                            username = check.getString(3);
                            Event_type = check.getString(4);
                            lat = check.getString(5);
                            lon = check.getString(6);
                            String duration = check.getString(7);
                            String battery = check.getString(8);
                            String timezone = check.getString(9);
                            String utcstart = check.getString(10);
                            String utcend = check.getString(11);
                            String imei = check.getString(12);
                            String appid = check.getString(13);
                            String userid = check.getString(14);
                            String maxVioData = check.getString(15);
                            String tid = check.getString(16);


                            String address = AddressApi.getCompleteAddress(Double.valueOf(lat), Double.valueOf(lon));


                            try {
                                if (address == null) {
                                    JSONObject ret = getLocationInfo(
                                            Double.valueOf(lat), Double.valueOf(lon));
                                    JSONObject add1;
                                    String location_string = null;
                                    add1 = ret.getJSONArray("results").getJSONObject(0);
                                    address = add1.getString("formatted_address");
                                }
                            } catch (Exception e) {
                            }


                            JSONObject data1 = new JSONObject();
                            data1.put("Event_strt", Event_strt);

                            data1.put("Event_end", Event_end);
                            data1.put("username", username);
                            data1.put("Event_type", Event_type);
                            data1.put("lat", lat);
                            data1.put("lon", lon);
                            if (address != null) {
                                data1.put("address", address);
                            } else {
                                data1.put("address", "NA");
                            }

                            data1.put("duration", duration);
                            data1.put("battery_level", battery);
                            data1.put("mobile_timezone", timezone);
                            data1.put("Event_Start_Milli_UTC", utcstart);
                            data1.put("Event_End_Milli_UTC", utcend);
                            data1.put("imei", imei);
                            data1.put("app_id", appid);
                            data1.put("userid", userid);
                            data1.put("mobile_primary_key",id);
                            data1.put("maxviolation",maxVioData);
                            data1.put("tid",tid);

                          //  if (Event_type.equalsIgnoreCase("speed")){

                                Cursor c3 = database.rawQuery(
                                        "SELECT server_task_id from task_master where tid="+tid, null);
                                c3.moveToLast();
                                String sid = "0";
                                if(c3.getCount()>0){
                                    sid = c3.getString(0);

                                }
                                data1.put("sid",sid);
                                c3.close();

//                                android.database.Cursor tripflag = database.rawQuery("select tid,sid from lat_plug where trip_status = 0", null);
//                                tripflag.moveToLast();
//                                int tripflagCount = tripflag.getCount();
//
//                                String tid = "0";
//                                String sid = "0";
//
//                                if (tripflagCount>0){
//                                    tid = tripflag.getString(0);
//                                    sid = tripflag.getString(1);
//                                }
//
//                                data1.put("tid",tid);
//                                data1.put("sid",sid);
//
//                                tripflag.close();
                           // }
                            String restext = null;
                            if(Event_type.equalsIgnoreCase("PowerSavingMode"))
                            {
                                if(!Event_end.equalsIgnoreCase("0"))
                                {
                                    restext = NewWebservicesCallEasyform.ExecuteNetworkHTTPPostRequestfile(data1, WCFURL, METHOD_NAME_corner13, data1);

                                }
                            }
                            else {
                                restext = NewWebservicesCallEasyform.ExecuteNetworkHTTPPostRequestfile(data1, WCFURL, METHOD_NAME_corner13, data1);

                            }
                            if(restext == null)
                            {
//                                new Handler(Looper.getMainLooper()).post(new Runnable() {
//                                    public void run() {
//                                        Toast toast = Toast.makeText(sqlitewraper.context, "Network Error..", Toast.LENGTH_LONG);
//                                        toast.show();
//                                    }
//                                });
                            }
                            else {
                                JSONArray jsonArray = new JSONArray(restext);
                               String status1 = null;

                                for (int k1 = 0; k1 < jsonArray.length(); k1++) {
                                    JSONObject jsonObject = jsonArray
                                            .getJSONObject(0);

                                    status1 = jsonObject.getString("status");
                                    String message;

                                    new Handler(Looper.getMainLooper()).post(new Runnable() {
                                        public void run() {
                                            Toast toast = null;
                                            try {
                                               String ShowEventToast = sqlitewraper.context.getResources().getString(R.string.EventToast);
                                                if(ShowEventToast.equalsIgnoreCase("true")) {
                                                    toast = Toast.makeText(sqlitewraper.context, "Events.. status: " + jsonObject.getString("status") + "; Message: " + jsonObject.getString("message"), Toast.LENGTH_LONG);
                                                    toast.show();
                                                }
                                                LogUtils.writeAttendanceLogToFile("Status: " + jsonObject.getString("status")
                                                        + " ( " + jsonObject.getString("message") + " ) ", METHOD_NAME_corner13);
                                            } catch (JSONException e) {
                                                throw new RuntimeException(e);
                                            }

                                        }
                                    });
                                    if (status1.equalsIgnoreCase("1")) {

                                        String cnd;
                                        cnd = "_id=" + id;
                                        ContentValues c_path = new ContentValues();
                                        c_path.put("is_send", "1");
                                        long temp = database.update("Events",
                                                c_path, cnd, null);
                                    }
                                }
                            }

                        } catch (Exception e) {
                            ////e.printStackTrace()();
//							check.moveToNext();

                        }
                        check.moveToNext();
                    }

                }
                check.close();
                }
            }

        } catch (Exception e) {
            ////e.printStackTrace()();

        }

    }

    //-----------------------------------------------------

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
            ////e.printStackTrace()();
        }
        return jsonObject;
    }
}