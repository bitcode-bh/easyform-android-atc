package com.sky.atc.easyformse;

import android.content.ContentValues;
import android.database.Cursor;
import android.location.Address;
import android.location.Geocoder;
import android.util.Log;

import com.google.android.gms.maps.model.LatLng;
import com.sky.atc.easyformse.utils.LogUtils;
import com.sky.atc.easyformse.utils.Utils;

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
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import io.michaelrocks.paranoid.Obfuscate;

//Upload Finished Trip to the server
@Obfuscate
public class TripUploadNew {

    //WCF URL
    private static final String WCFURL = sqlitewraper.context.getResources().getString(R.string.WCFURL);
    private static final String METHOD_NAME_corner13 = "WCF_InsertPathTable_12042018";
    private static final String METHOD_NAME_corner2 = "WCF_InsertPathTable";


    SQLiteDatabase database = sqlitewraper.getDatabase();
    JSONObject jObjd_new = new JSONObject();
    JSONArray act_new = new JSONArray();
    private String s_lat = null;
    private String s_lon = null;
    private String d_lat = null;
    private String d_lon = null;
    private String way_point = null;

    //For Shortest path calculation
    void shortestPathNew(String slat, String slon, String llat, String llon, String tid, int id, String min_milli, String max_milli, String way_point) {

        int flag = 0;

        try {
//
//            s_lat = slat;
//            s_lon = slon;
//            d_lat = llat;
//            d_lon = llon;
//
//            String way = start_end(way_point, Integer.parseInt(tid), s_lat, s_lon, d_lat,
//                    d_lon, way_point);
//            String params_n = null;
//
//            try {
//                params_n = URLEncoder.encode(way, "UTF-8");
//            } catch (UnsupportedEncodingException e1) {
//                // TODO Auto-generated catch block
//                e1.printStackTrace();
//            }
//
//            GMapV2Direction md = new GMapV2Direction();
//
//            LatLng origin = new LatLng(Double.valueOf(s_lat),
//                    Double.valueOf(s_lon));
//            LatLng dest = new LatLng(Double.valueOf(d_lat),
//                    Double.valueOf(d_lon));
//
//             ArrayList<LatLng> doc = md.getDocument(origin, dest, params_n,
//                            GMapV2Direction.MODE_DRIVING, way);
//                    JSONArray di_n = new JSONArray();
//                    if (doc != null) {
////                        String getDistanceText = md.getDistanceText(doc);
//
////                        if (getDistanceText.equals("")) {
////
////                        }
//
////                        String getDurationText = md.getDurationText(doc);
////                        if (getDurationText.equals("")) {
////
////                        }
//
////                        int getDistanceValue = md.getDistanceValue(doc);
////                        if (getDistanceValue == 0.0) {
////
////                        }
////                       ArrayList<LatLng> directionPoint = md.getDirection(doc);
//
//                        // String cnd;
//                        // cnd = "tid=" + tid;
//                        // ContentValues c_path = new ContentValues();
//                        // c_path.put("sh_path", directionPoint.toString());
//                        // c_path.put("isshort", "1");
//
//                        // String cnd;
//                        // cnd = "tid=" + tid;
//                        // ContentValues c_path = new ContentValues();
//                        // c_path.put("sh_path", directionPoint.toString());
//                        // c_path.put("isshort", "1");
//                        //
//                        //
//                        //
//                        // long temp = database.update("lat_plug", c_path, cnd,
//                        // null);
//
//                        for (int k = 0; k < doc.size(); k++) {
//
//                            JSONObject jObjd = new JSONObject();
//                            try {
//
//                                if (k == 0) {
//                                    jObjd.put("lat", s_lat);
//                                    jObjd.put("lng", s_lon);
//
//                                    di_n.put(jObjd);
//
//                                } else if (k > 0) {
//                                    jObjd.put("lat",
//                                            String.valueOf(doc
//                                                    .get(k).latitude));
//                                    jObjd.put("lng",
//                                            String.valueOf(doc
//                                                    .get(k).longitude));
//                                    di_n.put(jObjd);
//                                }
//                                if (k == doc.size() - 1) {
//                                    jObjd.put("lat", d_lat);
//                                    jObjd.put("lng", d_lon);
//                                    di_n.put(jObjd);
//                                }
//
//                    } catch (Exception e) {
//                        // TODO: handle exception
//                                writeLogToFile(e.getMessage(),"SHORTEST_PATH");
//                    }
//
//                }
//            } else {
//                flag = start_end1(way_point, Integer.parseInt(tid), s_lat, s_lon,
//                        min_milli, d_lat, d_lon, max_milli);
//            }
//
//            String cnd;
//            cnd = "_id=" + id;
//            ContentValues c_path = new ContentValues();
//            if (doc != null) {
//
//                c_path.put("sh_path", di_n.toString());
//            } else if (flag == 0) {
//
//                c_path.put("sh_path", "NA");
//            }

            String cnd;
            cnd = "_id=" + id;
            ContentValues c_path = new ContentValues();

            c_path.put("sh_path", "NA");
            c_path.put("isshort", "1");
            long temp = database.update("lat_plug", c_path, cnd, null);


        } catch (Exception e) {
            e.printStackTrace();
            writeLogToFile(e.getMessage(),"","SHORTEST_PATH");
        }

    }


    String start_end(String point, int tid, String s_lat, String s_lon,
                     String d_lat, String d_lon, String check) {

        database = sqlitewraper.getDatabase();
        String params = null;
        if (check.equalsIgnoreCase("NA")) {
            params = Double.valueOf(s_lat) + "," + Double.valueOf(s_lon) + "|"
                    + Double.valueOf(d_lat) + "," + Double.valueOf(d_lon);
        } else {

            try {
                String lat = null, lon = null, millisecond = null;

                String step_id = null, checkid = null;
                JSONArray j = new JSONArray(point);
                int i = 0;

                for (int k = 0; k < j.length(); k++) {

                    JSONObject jsonObject1 = j.getJSONObject(k);
                    checkid = jsonObject1.getString("checksheet_id");
                    step_id = jsonObject1.getString("step_id");

                    Cursor c = database.rawQuery(
                            "Select lat,long,millisecond from f_master where c_id="
                                    + Integer.valueOf(checkid) + " and tid="
                                    + tid + " and  step="
                                    + Integer.valueOf(step_id), null);
                    c.moveToFirst();
                    if (c.getCount() > 0) {
                        lat = c.getString(0);
                        lon = c.getString(1);
                        millisecond = c.getString(2);

                        c.close();

                        if (i == 0) {

                            params = Double.valueOf(lat) + ","
                                    + Double.valueOf(lon);

                        } else {
                            params += "|" + Double.valueOf(lat) + ","
                                    + Double.valueOf(lon);

                        }

                        i++;

                    }

                }

            } catch (Exception e) {

                e.printStackTrace();

            }
        }
        return params;
    }

    int start_end1(String point, int tid, String s_lat, String s_lon,
                   String min_mill, String d_lat, String d_lon, String max_mill) {
        int flag = 0;
        database = sqlitewraper.getDatabase();
        String params = null;
        try {
            jObjd_new = new JSONObject();
            act_new = new JSONArray();
            jObjd_new.put("lat", s_lat);
            jObjd_new.put("lng", s_lon);
            jObjd_new.put("date", min_mill);
            act_new.put(jObjd_new);
            String lat = null, lon = null, millisecond = null;

            String step_id = null, checkid = null;

            if (point.equalsIgnoreCase("NA")) {
                jObjd_new.put("lat", d_lat);
                jObjd_new.put("lng", d_lon);
                jObjd_new.put("date", max_mill);
                act_new.put(jObjd_new);
            } else {
                JSONArray j = new JSONArray(point);
                int i = 0;

                for (int k = 0; k < j.length(); k++) {

                    JSONObject jsonObject1 = j.getJSONObject(k);
                    checkid = jsonObject1.getString("checksheet_id");
                    step_id = jsonObject1.getString("step_id");

                    Cursor c = database.rawQuery(
                            "Select lat,long,millisecond from f_master where c_id="
                                    + Integer.valueOf(checkid) + " and tid="
                                    + tid + " and  step="
                                    + Integer.valueOf(step_id), null);
                    c.moveToFirst();
                    if (c.getCount() > 0) {
                        lat = c.getString(0);
                        lon = c.getString(1);
                        millisecond = c.getString(2);

                        jObjd_new.put("lat", lat);
                        jObjd_new.put("lng", lon);
                        jObjd_new.put("date", millisecond);
                        act_new.put(jObjd_new);

                    }
                    c.close();

                }
            }

            jObjd_new.put("lat", d_lat);
            jObjd_new.put("lng", d_lon);
            jObjd_new.put("date", max_mill);
            act_new.put(jObjd_new);

        } catch (Exception e) {
            flag++;
            e.printStackTrace();

        }
        return flag;
    }

    //For Actual Path calculation
    void actualPathNew(String slat1, String slon1, String llat, String llon, int tid, String min_milli, String max_milli, int id) {

        Log.d("##ActualPathCount", "Start");

        lat_long(id);

        long miili = System.currentTimeMillis();
        int id_n;

        JSONArray di_n = new JSONArray();
        String s_address = null;
        String d_address = null;
        try {

//            s_address = getCompleteAddressString(Double.valueOf(slat1), Double.valueOf(slon1));
//            d_address = getCompleteAddressString(Double.valueOf(llat), Double.valueOf(llon));
            s_address = AddressApi.getCompleteAddress(Double.valueOf(slat1), Double.valueOf(slon1));
            d_address = AddressApi.getCompleteAddress(Double.valueOf(llat), Double.valueOf(llon));

        } catch (Exception e) {
            if (e instanceof NullPointerException) {

                s_address = "NA";
                d_address = "NA";
            }
        }

        //tripflag=1 : GPS Latlong  3 = Speed Violation latlong
        Cursor check = database.rawQuery(
                "select _id,lat,lon,date,speed,address,accuracy,tripflag,waypoint,waypoint_type from track_master where tripflag IN (1,3) and date>="
                        + min_milli + " and date <=" + max_milli
                        + " order by date", null);

        check.moveToFirst();
        if ((check.getCount() > 0)) {
            for (int i = 0; i < check.getCount(); i++)
                try {
                    JSONObject jObjd = new JSONObject();
                    if (check.getCount() > 0) {
                        id_n = check.getInt(0);
                        String lat = check.getString(1);
                        String lon = check.getString(2);
                        String date = check.getString(3);
                        String speed = check.getString(4);
                        String accuracy = check.getString(6);
                        String tripflag = check.getString(7);
                        String waypoint = check.getString(8);
                        String waypoint_type = check.getString(9);

                        if (i == 0) {
                            JSONObject jObjd1 = new JSONObject();
                            jObjd1.put("lat", slat1);
                            jObjd1.put("lng", slon1);
                            jObjd1.put("date", min_milli);
                            jObjd1.put("address", s_address);
                            jObjd1.put("speed", "0.0");
                            jObjd1.put("accuracy", accuracy);
                            jObjd1.put("tripflag", tripflag);
                            if(waypoint != null && waypoint.equalsIgnoreCase("1"))
                            {
                                jObjd1.put("waypoint", waypoint);
                                jObjd1.put("waypoint_type",waypoint_type);
                            }
                            di_n.put(jObjd1);
                        } else if (i > 0) {

                            jObjd.put("lat", lat);
                            jObjd.put("lng", lon);
                            jObjd.put("date", date);
                            jObjd.put("address", "");
                            jObjd.put("speed", speed);
                            jObjd.put("accuracy", accuracy);
                            jObjd.put("tripflag", tripflag);
                            if(waypoint != null && waypoint.equalsIgnoreCase("1"))
                            {
                                jObjd.put("waypoint", waypoint);
                                jObjd.put("waypoint_type",waypoint_type);
                            }
                            di_n.put(jObjd);
                        }

                        if (i == check.getCount() - 1) {

                            JSONObject jObjd2 = new JSONObject();
                            jObjd2.put("lat", llat);
                            jObjd2.put("lng", llon);
                            jObjd2.put("date", max_milli);
                            jObjd2.put("address", d_address);
                            jObjd2.put("speed", "0.0");
                            jObjd2.put("accuracy", accuracy);
                            jObjd2.put("tripflag", tripflag);
                            if(waypoint != null && waypoint.equalsIgnoreCase("1"))
                            {
                                jObjd2.put("waypoint", waypoint);
                                jObjd2.put("waypoint_type",waypoint_type);
                            }
                            di_n.put(jObjd2);
                        }
                        check.moveToNext();
                    }

                } catch (Exception e) {
                    e.printStackTrace();

                    writeLogToFile(e.getMessage(),"","ACTUAL_PATH");

                }

            String cnd;
            cnd = "_id=" + id;
            ContentValues c_path = new ContentValues();
            c_path.put("ac_path", di_n.toString());

            c_path.put("isacc", "1");
            c_path.put("issend", "0");
            long temp = database.update("lat_plug", c_path, cnd, null);

        } else {
            try {

                JSONObject jObjd = new JSONObject();

                jObjd.put("lat", slat1);
                jObjd.put("lng", slon1);
                jObjd.put("date", min_milli);
                jObjd.put("address", s_address);
                jObjd.put("speed", "0.0");
                di_n.put(jObjd);

                JSONObject jObjd1 = new JSONObject();

                jObjd1.put("lat", llat);
                jObjd1.put("lng", llon);
                jObjd1.put("date", max_milli);

                jObjd1.put("address", d_address);
                jObjd1.put("speed", "0.0");
                di_n.put(jObjd1);

                String cnd;
                cnd = "_id=" + id;
                ContentValues c_path = new ContentValues();
                c_path.put("ac_path", di_n.toString());
                c_path.put("isacc", "1");
                c_path.put("issend", "0");
                long temp = database.update("lat_plug", c_path, cnd, null);

            } catch (Exception e) {
            }
        }
        actualPathFused(slat1,slon1,llat,llon,tid,min_milli,max_milli,id);

    }

    void lat_long(int id) {

        Cursor c1 = database
                .rawQuery(
                        "select _id,tid,s_lat,s_lon,d_lat,d_lon,way_point,min_milli,max_milli from lat_plug where _id="
                                + id, null);

        c1.moveToFirst();

        int tid = 0;

        if (c1.getCount() > 0) {

            for (int i = 0; i < c1.getCount(); i++) {
                try {
                    id = c1.getInt(0);
                    tid = c1.getInt(1);

                    s_lat = c1.getString(2);
                    s_lon = c1.getString(3);
                    d_lat = c1.getString(4);
                    d_lon = c1.getString(5);

                    String min_milli1 = c1.getString(6);
                    String max_milli1 = c1.getString(7);

                    way_point = c1.getString(6);

                } catch (Exception e) {

                    e.printStackTrace();
                }
            }

        }
    }

    String add(double lat, double lon) {

        String address = null;

        try {
            Geocoder gcd = new Geocoder(sqlitewraper.context,
                    Locale.getDefault());
            List<Address> addresses = gcd.getFromLocation(lat, lon, 1);
            if (addresses.size() > 0) {
                Address a = addresses.get(0);
                for (int k = 0; k < a.getMaxAddressLineIndex(); k++) {
                    if (address == null)
                        address = a.getAddressLine(k);
                    else
                        address = address + "," + a.getAddressLine(k);
                }
                address = address + "," + a.getCountryName();
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        if (address == null) {

            JSONObject ret = getLocationInfo(Double.valueOf(lat),
                    Double.valueOf(lon));
            JSONObject add1;
            String location_string = null;
            try {

                add1 = ret.getJSONArray("results").getJSONObject(0);

                address = add1.getString("formatted_address");
            } catch (Exception e) {
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
                                address = address + "," + a.getAddressLine(k);
                        }
                        address = address + "," + a.getCountryName();
                    }

                } catch (Exception e) {
                    e.printStackTrace();

                }

            }
        }

        return address;

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

    //Event Upload
    void event(int id, String min_milli, String max_milli) {

        Log.d("##EventCount", "EventStart");

        lat_long(id);

        Cursor check = database.rawQuery(
                "select _id,Event_strt,Event_end,Event_type,lat,lon,th_s from Events where Event_strt>="
                        + min_milli + " and Event_strt <=" + max_milli
                        + " and Event_type IN ('Still','vehicle','ACC','DEACC','speed')", null);
        //'Normal_Deacc','NormalAcc' remove event type as per discuss with sir 03-12-2024
        JSONArray di_n = new JSONArray();
        check.moveToFirst();
        if ((check.getCount() > 0)) {
            for (int i = 0; i < check.getCount(); i++)
                try {
                    JSONObject jObjd = new JSONObject();
                    if (check.getCount() > 0) {

                        String Event_strt = check.getString(1);
                        String Event_end = check.getString(2);
                        String Event_type = check.getString(3);

                        String lat = check.getString(4);
                        String lon = check.getString(5);
                        String th_s = check.getString(6);

//                        String address = getCompleteAddressString(Double.valueOf(lat),
//                                Double.valueOf(lon));
//                        String address = AddressApi.getCompleteAddress(Double.valueOf(lat), Double.valueOf(lon));


                        jObjd.put("Event_strt", Event_strt);
                        jObjd.put("Event_end", Event_end);
                        jObjd.put("Event_type", Event_type);
                        jObjd.put("address", "");
                        jObjd.put("lat", lat);
                        jObjd.put("lon", lon);
                        jObjd.put("th_value", th_s);
                        di_n.put(jObjd);
                        check.moveToNext();

                    }

                } catch (Exception e) {
                    e.printStackTrace();
                    writeLogToFile(e.getMessage(),"","EVENT");
                }

            String cnd;
            cnd = "_id=" + id;
            ContentValues c_path = new ContentValues();
            c_path.put("Event", di_n.toString());
            c_path.put("iseve", "1");
            c_path.put("issend", "0");
            long temp = database.update("lat_plug", c_path, cnd, null);

        } else {
            try {
                String cnd;
                cnd = "_id=" + id;
                ContentValues c_path = new ContentValues();
                c_path.put("Event", "");
                c_path.put("iseve", "1");
                c_path.put("issend", "0");
                long temp = database.update("lat_plug", c_path, cnd, null);
            } catch (Exception e) {
            }
        }

    }

    //Device Event Upload
    void device_event(int id, String min_milli, String max_milli) {


        //New Device Events
        Log.d("##EventCount", "EventStart");
        lat_long(id);

        Cursor check = database.rawQuery(
                "select _id,Event_strt,Event_end,Event_type,lat,lon,th_s,duration,battery from Events where Event_strt>="
                        + min_milli + " and Event_strt <=" + max_milli
                        + " and Event_type IN ('Gps_outage','Gprs_outage','Phone_outage','App_outage','Service_outage','screen','background','PowerSavingMode')", null);

        JSONArray di_n = new JSONArray();
        check.moveToFirst();
        if ((check.getCount() > 0)) {
            for (int i = 0; i < check.getCount(); i++)
                try {
                    JSONObject jObjd = new JSONObject();
                    if (check.getCount() > 0) {

                        String Event_strt = check.getString(1);
                        String Event_end = check.getString(2);
                        String Event_type = check.getString(3);

                        String lat = check.getString(4);
                        String lon = check.getString(5);
                        String th_s = check.getString(6);
                        String duration = check.getString(7);
                        String battery = check.getString(8);

//                        String address = getCompleteAddressString(Double.valueOf(lat),
//                                Double.valueOf(lon));
//                        String address = AddressApi.getCompleteAddress(Double.valueOf(lat), Double.valueOf(lon));


                        jObjd.put("Event_strt", Event_strt);
                        jObjd.put("Event_end", Event_end);
                        jObjd.put("Event_type", Event_type);
                        jObjd.put("Event_duration", duration);
                        jObjd.put("battery", battery);
                        di_n.put(jObjd);

                        check.moveToNext();

                    }

                } catch (Exception e) {
                    e.printStackTrace();
                    writeLogToFile(e.getMessage(),"","DEVICE_EVENT");

                }

            String cnd;
            cnd = "_id=" + id;
            ContentValues c_path = new ContentValues();
            c_path.put("dv_eve", di_n.toString());
            c_path.put("isdv_eve", "1");
            c_path.put("issend", "0");
            long temp = database.update("lat_plug", c_path, cnd, null);
            Log.d("##DeviceEvent", String.valueOf(temp));

        } else {
            try {

                String cnd;
                cnd = "_id=" + id;
                ContentValues c_path = new ContentValues();
                c_path.put("dv_eve", "");
                c_path.put("isdv_eve", "1");
                c_path.put("issend", "0");
                long temp = database.update("lat_plug", c_path, cnd, null);

            } catch (Exception e) {
            }
        }
    }



    //Upload trip to the server
    public int uploadTrip(int tid2) {

        Log.d("##UploadTrip", String.valueOf(tid2));

        Cursor check;

        int k = 0;

        Cursor c3 = database.rawQuery(
                "SELECT user_id FROM Login_Master", null);
        c3.moveToFirst();
        int user_id = c3.getInt(0);
        c3.close();

        check = database
                .rawQuery(
                        "select _id,tid,sh_path,ac_path,chkid,step,sid,way_point,s_lat,s_lon,d_lat,d_lon,odometer_point,Event,dv_eve,trip_status,site_name,last_upload_ms,eta,unique_trip_id,fused_ac,match_temp_id from lat_plug where isacc=1 and issend=0 and isshort=1 and iseve=1 and sid!=0 and tid=" + tid2,
                        null);
        check.moveToFirst();
        int id, tid, chkid, step, sid;
        String sh_path, ac_path, way_point, s_lat, s_lon, d_lat, d_lon, odometer_point, Event, dv_eve;
        String last_upload_ms = "";
        String site_name = "";
        String trip_status = "";
        String eta = "";
        String unique_trip_id = "";
        String fusedactualpath="";
        String matchKeyID;

        if (check.getCount() > 0) {

            for (int i = 0; i < check.getCount(); i++) {
                try {
                    id = check.getInt(0);
                    tid = check.getInt(1);
                    sh_path = check.getString(2);
                    ac_path = check.getString(3);
                    chkid = check.getInt(4);
                    step = check.getInt(5);
                    sid = check.getInt(6);
                    way_point = check.getString(7);
                    s_lat = check.getString(8);
                    s_lon = check.getString(9);
                    d_lat = check.getString(10);
                    d_lon = check.getString(11);
                    odometer_point = check.getString(12);
                    Event = check.getString(13);
                    dv_eve = check.getString(14);
                    trip_status = check.getString(15);
                    site_name = check.getString(16);
                    last_upload_ms = check.getString(17);
                    eta = check.getString(18);
                    unique_trip_id = check.getString(19);
                    fusedactualpath = check.getString(20);
                    matchKeyID = check.getString(21);

                    if (sh_path.equalsIgnoreCase("NA")) {
//                        JSONArray sh = sh_path(way_point, s_lat, s_lon,
//                                d_lat, d_lon, tid);
//                        sh_path = sh.toString();
                    }

                    if (eta == null) {
                        eta = "NA";
                    }

                    JSONObject data1 = new JSONObject();
                    data1.put("task_id", tid);
                    data1.put("sh_path", sh_path);
                    data1.put("ac_path", ac_path);
                    data1.put("chkid", chkid);
                    data1.put("step", step);
                    data1.put("sid", sid);
                    data1.put("odometer_point", odometer_point);
                    data1.put("Event", Event);
                    data1.put("user_id", user_id);
                    data1.put("dv_eve", dv_eve);
                    data1.put("trip_status", trip_status);
                    data1.put("site_name", site_name);
                    data1.put("last_upload_ms", last_upload_ms);
                    data1.put("eta", eta);
                    data1.put("unique_trip_id", unique_trip_id);
                    data1.put("fused_ac", fusedactualpath);
//							writeToFile(data1.toString());
//                    SoapObject data = new SoapObject(NAMESPACE_13,
//                            METHOD_NAME_corner13);
//                    String restext = webserviceTrip(data1, data, URL13,
//                            SOAP_ACTION_site13);

//                    SoapObject data2 = new SoapObject(NAMESPACE_2,
//                            METHOD_NAME_corner2);
//                    String restext2 = webserviceTrip(data1, data2, URL2,
//                            SOAP_ACTION_site2);
                    String restext = NewWebservicesCallEasyform.ExecuteNetworkHTTPPostRequestFilesAndPhotoUpload(data1, WCFURL, METHOD_NAME_corner2, matchKeyID,null);

                    Log.d("##EndTripSeWebserice", restext);
                    Log.d("##EndTripSeWebserice", restext);

                    JSONArray jsonArray = new JSONArray(restext);
                    String status1 = null;
                    String message = "";

                    for (int k1 = 0; k1 < jsonArray.length(); k1++) {
                        JSONObject jsonObject = jsonArray
                                .getJSONObject(0);

                        status1 = jsonObject.getString("status");
                        if (jsonObject.has("message")) {
                            message = jsonObject.getString("message");
                        }
                        if (status1.equalsIgnoreCase("1")) {
                            String cnd;
                            cnd = "_id=" + id;
                            ContentValues c_path = new ContentValues();
                            c_path.put("issend", "1");
                            long temp = database.update("lat_plug",
                                    c_path, cnd, null);
                            Log.d("##TripCompleted", String.valueOf(temp));
                        } else if (status1.equalsIgnoreCase("4")) {
                            Utils.logoutUser(message);
                        } else {
                            k++;
                            writeLogToFile("Status: " + status1 + " ( " + message + " ) ",METHOD_NAME_corner2,"uploadTrip");
                        }
                    }
                } catch (Exception e) {
                    k++;
                    e.printStackTrace();
                    writeLogToFile(e.getMessage(),"","UPLOAD_TRIP");
                }
                check.moveToNext();
            }
        }
        check.close();
        return k;
    }

    //For ETA UPLOAD TRIP AT SPECIFIC TIME
    public int uploadTripContinues() {

        Log.d("##uploadTripContinues", "1");

        int k = 0;
        Cursor c3 = database.rawQuery(
                "SELECT user_id FROM Login_Master", null);
        c3.moveToFirst();
        int user_id = c3.getInt(0);
        c3.close();

        Cursor check = database
                .rawQuery(
                        "select _id,tid,sh_path,ac_path,chkid,step,sid,way_point,s_lat,s_lon,d_lat,d_lon,odometer_point,Event,dv_eve,trip_status,site_name,last_upload_ms,eta,unique_trip_id,s_lat_eta,s_lon_eta,distance,match_temp_id from lat_plug where isacc=0 and issend=0 and sid!=0",
                        null);
        check.moveToFirst();
        int id, tid, chkid, step, sid;
        String sh_path = "", ac_path = "", way_point = "", s_lat = "", s_lon = "", d_lat = "", d_lon, odometer_point, Event, dv_eve;
        String last_upload_ms = "";
        String site_name = "";
        String trip_status = "";
        String eta = "";
        String unique_trip_id = "";

        if (check.getCount() > 0) {
            Log.d("##uploadTripContinues", "1");

            for (int i = 0; i < check.getCount(); i++) {
                try {
                    id = check.getInt(0);
                    tid = check.getInt(1);
                    sh_path = check.getString(2);
                    ac_path = check.getString(3);
                    chkid = check.getInt(4);
                    step = check.getInt(5);
                    sid = check.getInt(6);
                    way_point = check.getString(7);
                    s_lat = check.getString(8);
                    s_lon = check.getString(9);
                    d_lat = check.getString(10);
                    d_lon = check.getString(11);
                    odometer_point = check.getString(12);
                    Event = check.getString(13);
                    dv_eve = check.getString(14);
                    trip_status = check.getString(15);
                    site_name = check.getString(16);
                    last_upload_ms = check.getString(17);
                    eta = check.getString(18);
                    unique_trip_id = check.getString(19);
                    String s_lat_eta = check.getString(20);
                    String s_lon_eta = check.getString(21);
                    String distance = check.getString(22);
                    String matchKeyID = check.getString(23);

                    JSONArray di_n = new JSONArray();

                    JSONObject jObjd = new JSONObject();
                    JSONObject jObjd2 = new JSONObject();

                    jObjd.put("lat", s_lat_eta);
                    jObjd.put("lng", s_lon_eta);
                    di_n.put(jObjd);

                    jObjd2.put("lat", d_lat);
                    jObjd2.put("lng", d_lon);
                    di_n.put(jObjd2);


                    JSONObject data1 = new JSONObject();
                    data1.put("task_id", tid);

                    data1.put("sh_path", di_n.toString());
                    data1.put("ac_path", ac_path);
                    data1.put("chkid", chkid);
                    data1.put("step", step);
                    data1.put("sid", sid);
                    data1.put("odometer_point", "1234");
                    data1.put("Event", Event);
                    data1.put("user_id", user_id);
                    data1.put("trip_status", trip_status);
                    data1.put("site_name", site_name);
                    data1.put("last_upload_ms", last_upload_ms);
                    data1.put("eta", eta);
                    data1.put("unique_trip_id", unique_trip_id);
                    data1.put("distance", distance);

                    String data12=data1.toString();

                    String restext = NewWebservicesCallEasyform.ExecuteNetworkHTTPPostRequestFilesAndPhotoUpload(data1, WCFURL, METHOD_NAME_corner13, matchKeyID,null);
                    JSONArray jsonArray = new JSONArray(restext);
                    String status1 = null;
                    String message="";
                    for (int k1 = 0; k1 < jsonArray.length(); k1++) {
                        JSONObject jsonObject = jsonArray
                                .getJSONObject(0);

                        status1 = jsonObject.getString("status");
                        if (jsonObject.has("message")) {
                            message = jsonObject.getString("message");
                        }

                        if (status1.equalsIgnoreCase("1")) {
                            Log.d("##milliUpdate", "Pulling Ruuning");
                        }else if (status1.equalsIgnoreCase("4")) {
                            Utils.logoutUser(message);
                        }else {
                            k++;
                            writeLogToFile("Status: "+ status1 + " ( " + message + " ) ",METHOD_NAME_corner13,"uploadTripContinues");
                        }
                    }
                } catch (Exception e) {
                    k++;
                    e.printStackTrace();
                    writeLogToFile(e.getMessage(),"","UPLOAD_TRIP_CONTINUES");
                }
                check.moveToNext();
            }
        }
        return k;
    }


    JSONArray sh_path(String way_point, String s_lat, String s_lon,
                      String d_lat, String d_lon, int tid) {

        String way = start_end(way_point, tid, s_lat, s_lon, d_lat, d_lon,
                way_point);
        String params_n = null;

        try {
            params_n = URLEncoder.encode(way, "UTF-8");
        } catch (UnsupportedEncodingException e1) {
            // TODO Auto-generated catch block
            e1.printStackTrace();
        }

        GMapV2Direction md = new GMapV2Direction();

        LatLng origin = new LatLng(Double.valueOf(s_lat), Double.valueOf(s_lon));
        LatLng dest = new LatLng(Double.valueOf(d_lat), Double.valueOf(d_lon));

        ArrayList<LatLng>doc = md.getDocument(origin, dest, params_n,
                GMapV2Direction.MODE_DRIVING, way_point);
        JSONArray di_n = new JSONArray();
        if (doc != null) {
//            String getDistanceText = md.getDistanceText(doc);
//
//            if (getDistanceText.equals("")) {
//
//            }

//            String getDurationText = md.getDurationText(doc);
//            if (getDurationText.equals("")) {
//
//            }

//            int getDistanceValue = md.getDistanceValue(doc);
//            if (getDistanceValue == 0.0) {
//
//            }
//            ArrayList<LatLng> directionPoint = md.getDirection(doc);
//

//            for (int k = 0; k < directionPoint.size(); k++) {
//
//                JSONObject jObjd = new JSONObject();
//                try {
//
//                    if (k == 0) {
//                        jObjd.put("lat", s_lat);
//                        jObjd.put("lng", s_lon);
//                        di_n.put(jObjd);
//
//                    } else if (k > 0) {
//                        jObjd.put("lat",
//                                String.valueOf(directionPoint.get(k).latitude));
//                        jObjd.put("lng",
//                                String.valueOf(directionPoint.get(k).longitude));
//                        di_n.put(jObjd);
//                    }
//                    if (k == directionPoint.size() - 1) {
//                        jObjd.put("lat", d_lat);
//                        jObjd.put("lng", d_lon);
//                        di_n.put(jObjd);
//                    }
//
//                } catch (Exception e) {
//                    // TODO: handle exception
//                }
//
//            }

            for (int k = 0; k < doc.size(); k++) {

                JSONObject jObjd = new JSONObject();
                try {

                    if (k == 0) {
                        jObjd.put("lat", s_lat);
                        jObjd.put("lng", s_lon);

                        di_n.put(jObjd);

                    } else if (k > 0) {
                        jObjd.put("lat",
                                String.valueOf(doc
                                        .get(k).latitude));
                        jObjd.put("lng",
                                String.valueOf(doc
                                        .get(k).longitude));
                        di_n.put(jObjd);
                    }
                    if (k == doc.size() - 1) {
                        jObjd.put("lat", d_lat);
                        jObjd.put("lng", d_lon);
                        di_n.put(jObjd);
                    }

                } catch (Exception e) {
                    // TODO: handle exception
                }

            }
        }

        return di_n;
    }

//Fused actual path
    private void actualPathFused(String slat1, String slon1, String llat, String llon, int tid, String min_milli, String max_milli, int id) {

        Log.d("##ActualPathCount", "Start");

        lat_long(id);

        long miili = System.currentTimeMillis();
        int id_n;

        JSONArray di_n = new JSONArray();
        String s_address = null;
        String d_address = null;
        try {

//            s_address = getCompleteAddressString(Double.valueOf(slat1), Double.valueOf(slon1));
//            d_address = getCompleteAddressString(Double.valueOf(llat), Double.valueOf(llon));
            s_address = AddressApi.getCompleteAddress(Double.valueOf(slat1), Double.valueOf(slon1));
            d_address = AddressApi.getCompleteAddress(Double.valueOf(llat), Double.valueOf(llon));

        } catch (Exception e) {
            if (e instanceof NullPointerException) {

                s_address = "NA";
                d_address = "NA";
            }
        }

        //trip flag = 2 fused loaction
        Cursor check = database.rawQuery(
                "select _id,lat,lon,date,speed,address,accuracy from track_master where tripflag IN(2,3) and date>="
                        + min_milli + " and date <=" + max_milli
                        + " order by date", null);

        check.moveToFirst();
        if ((check.getCount() > 0)) {
            for (int i = 0; i < check.getCount(); i++)
                try {
                    JSONObject jObjd = new JSONObject();
                    if (check.getCount() > 0) {
                        id_n = check.getInt(0);
                        String lat = check.getString(1);
                        String lon = check.getString(2);
                        String date = check.getString(3);
                        String speed = check.getString(4);
                        String accuracy = check.getString(6);


                        if (i == 0) {
                            JSONObject jObjd1 = new JSONObject();
                            jObjd1.put("lat", slat1);
                            jObjd1.put("lng", slon1);
                            jObjd1.put("date", min_milli);
                            jObjd1.put("address", s_address);
                            jObjd1.put("speed", "0.0");
                            jObjd1.put("accuracy", accuracy);
                            di_n.put(jObjd1);
                        } else if (i > 0) {

                            jObjd.put("lat", lat);
                            jObjd.put("lng", lon);
                            jObjd.put("date", date);
                            jObjd.put("address", "");
                            jObjd.put("speed", speed);
                            jObjd.put("accuracy", accuracy);
                            di_n.put(jObjd);
                        }

                        if (i == check.getCount() - 1) {

                            JSONObject jObjd2 = new JSONObject();
                            jObjd2.put("lat", llat);
                            jObjd2.put("lng", llon);
                            jObjd2.put("date", max_milli);
                            jObjd2.put("address", d_address);
                            jObjd2.put("speed", "0.0");
                            jObjd2.put("accuracy", accuracy);
                            di_n.put(jObjd2);
                        }
                        check.moveToNext();
                    }

                } catch (Exception e) {
                    e.printStackTrace();
                    writeLogToFile(e.getMessage(),"","FUSED_PATH");
                }

            String cnd;
            cnd = "_id=" + id;
            ContentValues c_path = new ContentValues();
            c_path.put("fused_ac", di_n.toString());
            long temp = database.update("lat_plug", c_path, cnd, null);

        } else {
            try {

                JSONObject jObjd = new JSONObject();

                jObjd.put("lat", slat1);
                jObjd.put("lng", slon1);
                jObjd.put("date", min_milli);
                jObjd.put("address", s_address);
                jObjd.put("speed", "0.0");
                di_n.put(jObjd);

                JSONObject jObjd1 = new JSONObject();

                jObjd1.put("lat", llat);
                jObjd1.put("lng", llon);
                jObjd1.put("date", max_milli);

                jObjd1.put("address", d_address);
                jObjd1.put("speed", "0.0");
                di_n.put(jObjd1);

                String cnd;
                cnd = "_id=" + id;
                ContentValues c_path = new ContentValues();
                c_path.put("fused_ac", di_n.toString());
                long temp = database.update("lat_plug", c_path, cnd, null);

            } catch (Exception e) {
            }
        }
    }


    //Write Error log to file
    private void writeLogToFile(String response, String method,String classname) {
        LogUtils.writeTripLogToFile(response, method,classname);
    }
}
