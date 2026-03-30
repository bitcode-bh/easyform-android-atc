package com.sky.atc.easyformse;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.database.Cursor;
import android.os.Build;
import android.util.JsonReader;
import android.util.JsonToken;
import android.util.Log;
import android.widget.Toast;

import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.geofencenew.GeoFenceDraw;
import com.sky.atc.easyformse.utils.LogUtils;
import com.sky.atc.easyformse.utils.Utils;

import net.sqlcipher.database.SQLiteDatabase;

import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.NameValuePair;
import org.apache.http.StatusLine;
import org.apache.http.client.HttpClient;
import org.apache.http.client.entity.UrlEncodedFormEntity;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.message.BasicNameValuePair;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.ksoap2.SoapEnvelope;
import org.ksoap2.serialization.PropertyInfo;
import org.ksoap2.serialization.SoapObject;
import org.ksoap2.serialization.SoapPrimitive;
import org.ksoap2.serialization.SoapSerializationEnvelope;
import org.ksoap2.transport.HttpTransportSE;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.stream.Collectors;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

import static android.content.Context.MODE_PRIVATE;
import static com.sky.atc.easyformse.DemoDeviceAdminReceiver.TAG;
import static com.sky.atc.easyformse.sqlitewraper.context;

import androidx.core.app.NotificationCompat;

/**
 * updated by NareshChocha on 11/03/2022.
 *
 * @author NareshChocha
 */
//To download geofence for that
@StringFogIgnore
public class GeofenceDownlaod {

    private static final String UPLOADWCFURL = sqlitewraper.context.getResources().getString(R.string.GEOWCFURL);
    private static final String APPURL = sqlitewraper.context.getResources().getString(R.string.TASKDOWNLOADURL);

    private static final String METHOD_NAME_corner = "WCF_Insertinto_geofence_uploaddata";
    private static final String METHOD_NAME_InOut = "InsertUpdate_Geofence_Active_Master";
    private static final String NAMESPACE = "http://tempuri.org/";
    private String isSSL = sqlitewraper.context.getResources().getString(R.string.SSL);
    boolean isShowNoti = false;
    int incr=0;
    static SQLiteDatabase database = sqlitewraper.getDatabase();
    NotificationManager notificationManager;
    public static int uploadGeofenceTracking() {

        int k = 0;

        Cursor c = database
                .rawQuery(
                        "select user_id,place_id,in_time,out_time,duration,id,flowid,appid,service_outage from geofence_user_tracking_detail where is_send='1' and place_id != 'BIG'", null);

        c.moveToFirst();
        int j = c.getCount();
        for (int i = 0; i < c.getCount(); i++) {
            try {
                // check geofence feature is assign or not
                Cursor c2 = database
                        .rawQuery("SELECT id,data,task_millisecond,company_id FROM  User_Define_Flow_Master where type = 'GeoTracking' GROUP BY id", null);
                c2.moveToFirst();

                //if (c2.getCount() > 0) {

                    String user_id = c.getString(0);
                    String place_id = c.getString(1);
                    String in_time = c.getString(2);
                    String out_time = c.getString(3);
                    String duration = c.getString(4);
                    String id = c.getString(5);
                    String flowid = c.getString(6);
                    String appid = c.getString(7);
                    String service_outage = c.getString(8);

                    if (service_outage == null) {
                        service_outage = "";
                    }

                    if (user_id.equalsIgnoreCase("")) {
                        user_id = DeviceEventsUtils.getLoginDetails().get(0);
                    }

                    if (appid.equalsIgnoreCase("")) {
                        appid = DeviceEventsUtils.getLoginDetails().get(2);
                    }

                    SoapObject data = new SoapObject(NAMESPACE, METHOD_NAME_corner);

                    JSONObject data2 = new JSONObject();
                    data2.put("user_id", user_id);
                    data2.put("place_id", place_id);
                    data2.put("in_time", in_time);
                    data2.put("out_time", out_time);
                    data2.put("duration", duration);
                    data2.put("user_defineid", flowid);
                    data2.put("app_id", appid);
                    data2.put("mobile_primarykey", id);
                    data2.put("service_outage", service_outage);

                    //String restext = webservice(data2, data, URL6,SOAP_ACTION_site6);


                    if (user_id == null || user_id.equalsIgnoreCase("")) {

                    } else {
                        //If the duration of in-time and out-time is more than 5 minutes, server will be inserted into table.
                        String resString = NewWebservicesCallEasyform.ExecuteNetworkHTTPPostRequestfile(data2, UPLOADWCFURL, METHOD_NAME_corner, data2);
                        JSONArray jsonArray = new JSONArray(resString);

                        for (int k1 = 0; k1 < jsonArray.length(); k1++) {
                            JSONObject jsonObject = jsonArray.getJSONObject(0);
                            String status = jsonObject.getString("status");
                            String message = "";
                            if (jsonObject.has("message")) {
                                message = jsonObject.getString("message");
                            }
                            if (status.equalsIgnoreCase("1")) {
                                updateGeofence(Integer.parseInt(id));

                            }
                            else if(status.equalsIgnoreCase("3"))
                            {
                                LogUtils.writeUploadLogToFile( "Status:" +status + " ( " + message + " ) " +"\n" + data2.toString() ,METHOD_NAME_corner , "uploadGeofenceTracking");
                            }
                            else if (status.equalsIgnoreCase("4")) {
                                Utils.logoutUser(message);

                            } else {
                                k++;
                            }
                        }

                    }
//                }
//                else {
//                    Toast.makeText(context, "Geo Tracking data is not found. Please add Geo Tracking module to this role from flow navigation.", Toast.LENGTH_LONG).show();
//                }



            } catch (final Exception e) {
                LogUtils.writeUploadLogToFile(e.toString(),"", "uploadGeofenceTracking");
                k++;
            }
            c.moveToNext();
        }
        c.close();
        return k;
    }

    private static void updateGeofence(int id) {


        String cnd;
        cnd = "id=" + id;
        ContentValues c_path = new ContentValues();
        c_path.put("is_send", "2");
        long temp = database.update("geofence_user_tracking_detail",
                c_path, cnd, null);
        Log.d("###GeoFenceUploaded", String.valueOf(temp));

    }

// place is came from rowquery
    public void geofence_download_new() {

        String geotracking = null;
        Cursor c2 = database
                .rawQuery("SELECT id,data,task_millisecond,company_id FROM  User_Define_Flow_Master where type = 'GeoTracking' GROUP BY id", null);
        c2.moveToFirst();
        if (c2.getCount() > 0) {
            for (int i = 0; i < c2.getCount(); i++) {

                String id = c2.getString(0);
                String geodata = c2.getString(1);

                try {
                    JSONArray jsonary = new JSONArray(geodata);
                    JSONObject geojsonobject = jsonary.getJSONObject(0);
                    geotracking = geojsonobject.getString("geotracking");


                } catch (JSONException e) {
                    e.printStackTrace();
                }

                JSONArray jsondata = null;
                int k = 0;
                try {
                    jsondata = new JSONArray(geotracking);
                    JSONArray replcaeddata = replaceData(jsondata);

                    JSONObject data1 = replcaeddata.getJSONObject(0);

                    JSONArray json = new JSONArray();
                    json.put(data1);

                    String url =  APPURL + "Site_Download_Using_GeoTracking?Data=";

                    String da = null;
                    try {
                        da = URLEncoder.encode(json.toString(), "UTF-8");
                    } catch (UnsupportedEncodingException e) {
                        e.printStackTrace();
                    }
                    url = url + da;
                    k = getJSONFromUrl1(url, da, data1, Integer.parseInt(id));

                } catch (JSONException e) {
                    e.printStackTrace();
                }

                c2.moveToNext();
            }
        }
        c2.close();
    }

    private int getJSONFromUrl1(String url, String json, JSONObject data1, int id) {

        java.net.URL k_n = null;

        int k = 0;
        try {
            ArrayList<NameValuePair> postParameters;
            postParameters = new ArrayList<NameValuePair>();
            postParameters.add(new BasicNameValuePair("Data", json));

            StringBuilder builder = new StringBuilder();
            HttpClient client = new DefaultHttpClient();
            HttpGet httpGet = new HttpGet(url);


            HttpPost post = new HttpPost("/Services/Download_For_Mobile.asmx/DataStreaming");
            post.setHeader("host", sqlitewraper.context.getResources().getString(R.string.App_URL));

            StringEntity se = new StringEntity(URLEncoder.encode(json, "UTF-8"));
            post.setEntity(new UrlEncodedFormEntity(postParameters));

            int status = 0;
            String message = null;
            JSONObject data2 = null;
            String u_c = null;
            String username = null;

            try {
                database = sqlitewraper.getDatabase();

                Cursor c3 = database.rawQuery("SELECT username,u_c,company_id,appid,user_id FROM Login_Master",
                        null);
                c3.moveToLast();
                username = c3.getString(0);
                u_c = c3.getString(1);
                int company_id = c3.getInt(2);
                String appid = c3.getString(3);
                String UserId = c3.getString(4);
                c3.close();

                data2 = new JSONObject();
                data2.put("username", username);
                data2.put("u_c", u_c);
                data2.put("appid", appid);
                data2.put("user_id", UserId);

            } catch (Exception e) {
                ////e.printStackTrace()();
            }
            httpGet.addHeader("auth1", data2.toString());
            httpGet.addHeader("uname", username);
            httpGet.addHeader("u_c", u_c);

            if (isSSL.equalsIgnoreCase("true")) {
                client = DeviceEventsUtils.getClientWithPinnedCertificate();
            }


            HttpResponse response = client.execute(httpGet);
            StatusLine statusLine = response.getStatusLine();
            int statusCode = statusLine.getStatusCode();

            if (statusCode != 200) {
                k = 1;
                return k;

            }

            if (statusCode == 200) {
                HttpEntity entity = response.getEntity();
                InputStream content = entity.getContent();

                Reader streamReader = new InputStreamReader(content);

                JsonReader reader = new JsonReader(streamReader);
                reader.setLenient(true);

                try {

                    while (reader.hasNext() && (!(reader.peek() == JsonToken.END_DOCUMENT))) {

                        if (!(reader.peek() == JsonToken.END_DOCUMENT)) {
                            reader.beginObject();

                            String parent_id = reader.nextName();
                            if (parent_id.equals("status")) {
                                status = reader.nextInt();
                            }
                            String sub_id = reader.nextName();

                            if (sub_id.equals("message")) {
                                message = reader.nextString();
                                Log.d("##response", message);

                            }

                            if (status == 1) {
                                JSONArray jsonArray = new JSONArray(message);

                                JSONObject jsonObject = jsonArray.getJSONObject(0);
                                isShowNoti = true;
                                generateNotification(1,null);
                                String Customerid = jsonObject.getString("Customerid");
                                String Lat = jsonObject.getString("Lat");
                                String Long = jsonObject.getString("Long");
                                String millisecond = jsonObject.getString("millisecond");
                                String Radius = jsonObject.getString("Radius");
                                String Duration = jsonObject.getString("Duration");

                                insertintogeofencetracking(Customerid, Lat, Long, millisecond, Duration ,Radius, id);
                            }
                            if (status == 2) {
                                isShowNoti = false;
                                GeoFenceDraw geoFenceDraw = new GeoFenceDraw();
                                geoFenceDraw.getSiteinfoNew();
                                notificationManager.cancel(147);
                                Log.d("###GeofenceDownload", String.valueOf(status));
                            }

                            reader.endObject();


                        } else {
                            reader.close();
                            reader = null;
                            streamReader.close();

                        }


                    }
                    reader.close();
                    streamReader.close();
                } catch (Exception e) {
                    reader.close();
                    streamReader.close();
                }

            }
        } catch (Exception e) {
            ////e.printStackTrace()();
            return k;

        }

        return k;
    }

    public JSONArray replaceData(JSONArray array) {
        // Creating JSONObject from String
        JSONArray jsonArray = null;
        JSONArray jsonArray1 = null;
        JSONArray jsonArray2 = null;
        JSONArray jsonArray3 = null;

        String millisecond = String.valueOf(System.currentTimeMillis());


        Cursor c2 = database
                .rawQuery("SELECT MAX(milisecond) FROM geofence_tracking", null);

        c2.moveToFirst();

        String milli = c2.getString(0);

        if (milli == null || milli.equalsIgnoreCase("")) {
            milli = "0";
        }
        c2.close();
        Cursor c3 = database.rawQuery(
                "SELECT company_id,user_id FROM  Login_Master", null);
        c3.moveToLast();
        String c_id = c3.getString(0);
        String u_id = c3.getString(1);
        c3.close();
        try {
//            array = new JSONArray(data);
            JSONObject obj = array.getJSONObject(0);

            // Creating JSONArray from JSONObject
            jsonArray = obj.getJSONArray("queryval");
            int radius = obj.getInt("radius");
            int duration = obj.getInt("duration");

            if (obj.has("geofencetime")) {
                String geofencetime = obj.getString("geofencetime");

                if (geofencetime != null) {
                    MySharedPreferences editor = sqlitewraper.getSecureShared("mypre1");
                    editor.putString("geofencetime", geofencetime);
                    editor.commit();
                }
            }


            // JSONArray has x JSONObject
            for (int i = 0; i < jsonArray.length(); i++) {

                // Creating JSONObject from JSONArray
                JSONObject jsonObj = jsonArray.getJSONObject(i);

                String querytext = jsonObj.getString("querytext");

                // Getting data from individual JSONObject
                jsonArray1 = jsonObj.getJSONArray("querydata");

                for (int j = 0; j < jsonArray1.length(); j++) {
                    JSONObject itemArr = (JSONObject) jsonArray1.get(j);
                    // set or condition @key 21/08/2024
                    if (itemArr.get("key").equals("company_id") || (itemArr.get("key").equals("@company_id")))
                    {
                        itemArr.put("value", c_id);
                    } else if (itemArr.get("key").equals("user_id") || (itemArr.get("key").equals("@user_id"))) {
                        itemArr.put("value", u_id);
                    }
                    if (itemArr.get("key").equals("millisecond") || (itemArr.get("key").equals("@millisecond"))) {
                        itemArr.put("value", milli);
                    }
                }

                JSONObject jsonObject = new JSONObject();
                jsonObject.put("rowquery_data", jsonArray1);
                jsonObject.put("rowquery_id", querytext);
                jsonObject.put("duration", duration);
                jsonObject.put("radius", radius);
                jsonObject.put("company_id", c_id);

                jsonArray3 = new JSONArray();
                jsonArray3.put(jsonObject);
            }
        } catch (JSONException e1) {

            e1.printStackTrace();

        }

        return jsonArray3;
    }

    public void insertintogeofencetracking(String placeid, String lat, String lng, String milli, String durition, String radious, int flowid) {


        try {

            ContentValues c = new ContentValues();
            c.put("place_id", placeid);
            c.put("latitude", lat);
            c.put("longitude", lng);
            c.put("milisecond", milli);
            c.put("duration", durition);
            c.put("radius", radious);
            c.put("flow_id", flowid);


            Cursor c2 = database
                    .rawQuery("SELECT id,place_id FROM  geofence_tracking where place_id='" + placeid + "'", null);
            c2.moveToFirst();

            if (c2.getCount() > 0) {

                String id = c2.getString(0);
                String place_id1 = c2.getString(1);

                String t = "id='" + id + "'";
                long temp = database.update("geofence_tracking", c, t, null);

            } else {

                long temp = database.insert("geofence_tracking", null, c);
                Log.d("###geofence_tracking", String.valueOf(temp) + "Lat: " + lat);
            }
            c2.close();

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void generateNotification(int id, String moduleName ) {

        String contentText = "Download";

        if (moduleName == null) {
            moduleName = "";
        }

        if (id == 1) {
            contentText = "Geofence Downloding...";
        }
        int icon = R.drawable.atc_logo;

        NotificationChannel mChannel = null;
        String CHANNEL_ID = "my_channel_01";// The id of the channel.

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            CharSequence name = "Easyform";// The user-visible name of the channel.
            int importance = NotificationManager.IMPORTANCE_HIGH;
            mChannel = new NotificationChannel(CHANNEL_ID, name, NotificationManager.IMPORTANCE_LOW);
            mChannel.setSound(null,null);

        }

        Intent intent = new Intent(sqlitewraper.context, ph_s.class);
        PendingIntent contentIntent = PendingIntent.getActivity(sqlitewraper.context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        NotificationCompat.Builder b = new NotificationCompat.Builder(sqlitewraper.context);

        notificationManager = (NotificationManager) sqlitewraper.context.getSystemService(Context.NOTIFICATION_SERVICE);
        b.setAutoCancel(false)
                .setWhen(System.currentTimeMillis())
                .setSmallIcon(icon)
                .setContentTitle("Downloading")
                .setContentIntent(contentIntent)
                .setContentText(contentText)
                .setSubText(contentText)
                .setOngoing(true)
                .setChannelId(CHANNEL_ID);
//                    if(isShowNoti)
//                    {
//                        new Thread(new Runnable() {
//                            @Override
//                                    public void run() {
//                                        int incr;
//                                        for (incr = 0; incr <= 100; incr+=10) {
//                                            // Sets the progress indicator to a max value, the current completion percentage and "determinate" state
//                                            b.setProgress(100, incr, false);
//                                            // Displays the progress bar for the first time.
//                                            if (notificationManager != null) {
//                                                notificationManager.notify(147, b.build());
//                                            }
//                                            try {
//                                                // notification display issue so sleep thread 1 second
//                                                // Sleep for 1 second
//                                                Thread.sleep(1*1000);
//                                            } catch (InterruptedException e) {
//                                                Log.d("TAG", "sleep failure");
//                                            }
//                                        }
//                                        // When the loop is finished, updates the notification
//                                        // Removes the progress bar and cancel notification
//                                        b.setContentText("Finish")
//                                                .setProgress(0,0,false);
//                                        if (notificationManager != null) {
//                                            notificationManager.cancel(147);
//                                        }
//                                    }
//                                }
//                                // Starts the thread by calling the run() method in its Runnable
//                        ).start();
//                    }
//                    else {
//                        b.setContentText("Finish")
//                                .setProgress(0,0,false);
//                        if (notificationManager != null) {
//                            notificationManager.cancel(147);
//                        }
//                    }



        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            mChannel.setSound(null,null);
            notificationManager.createNotificationChannel(mChannel);
        }

        if (notificationManager != null) {
            notificationManager.notify(147, b.build());
        }
    }




// when trip running and user enter geofence in entry upload and exit geofence out entry upload
    public static int uploadGeofenceINOutTracking() {

        int k = 0;

        Cursor c = database
                .rawQuery(
                        "select user_id,place_id,in_time,out_time,duration,id,flowid,appid,service_outage,event from geofence_user_tracking_In_Out where is_send='0' and place_id != 'BIG'", null);

        c.moveToFirst();
        int j = c.getCount();
        for (int i = 0; i < c.getCount(); i++) {
            try {

                String user_id = c.getString(0);
                String place_id = c.getString(1);
                String in_time = c.getString(2);
                String out_time = c.getString(3);
                String duration = c.getString(4);
                String id = c.getString(5);
                String flowid = c.getString(6);
                String appid = c.getString(7);
                String service_outage = c.getString(8);
                String event = c.getString(9);

                if (service_outage == null) {
                    service_outage = "";
                }

                if (user_id.equalsIgnoreCase("")) {
                    user_id = DeviceEventsUtils.getLoginDetails().get(0);
                }

                if (appid.equalsIgnoreCase("")) {
                    appid = DeviceEventsUtils.getLoginDetails().get(2);
                }


                Cursor c3 = database.rawQuery("SELECT username FROM Login_Master",
                        null);
                c3.moveToLast();
                String username = c3.getString(0);
                c3.close();

                MySharedPreferences prefs = sqlitewraper.getSecureShared("mypre2");
                String roleid = prefs.getString("authroleidn", "0");

                JSONObject data2 = new JSONObject();
                data2.put("user_ID", user_id);
                data2.put("userName", username);
                data2.put("Site_ID", place_id);
                data2.put("In_time_ms", in_time);
                data2.put("Out_time_ms", out_time);
                data2.put("Role_Id", roleid);
                data2.put("event",event);



                if (user_id == null || user_id.equalsIgnoreCase("")) {

                } else {
                    String resString = NewWebservicesCallEasyform.ExecuteNetworkHTTPPostRequestfile(data2, UPLOADWCFURL, METHOD_NAME_InOut, data2);
                    JSONArray jsonArray = new JSONArray(resString);

                    for (int k1 = 0; k1 < jsonArray.length(); k1++) {
                        JSONObject jsonObject = jsonArray.getJSONObject(0);
                        String status = jsonObject.getString("status");
                        String message = "";
                        if (jsonObject.has("message")) {
                            message = jsonObject.getString("message");
                        }
                        if (status.equalsIgnoreCase("1")) {
                            updateGeofenceINoutflag(Integer.parseInt(id));
                        }
                        else if(status.equalsIgnoreCase("3"))
                        {
                            LogUtils.writeUploadLogToFile( "Status:" +status + " ( " + message + " ) " +"\n" + data2.toString() ,METHOD_NAME_corner , "uploadGeofenceTracking");
                        }
                        else if (status.equalsIgnoreCase("4")) {
                            Utils.logoutUser(message);

                        } else {
                            k++;
                        }
                    }

                }

            } catch (final Exception e) {
                LogUtils.writeUploadLogToFile(e.toString(),"", "uploadGeofenceTracking");
                k++;
            }
            c.moveToNext();
        }
        c.close();
        return k;
    }


    private static void updateGeofenceINoutflag(int id) {


        String cnd;
        cnd = "id=" + id;
        ContentValues c_path = new ContentValues();
        c_path.put("is_send", "1");
        long temp = database.update("geofence_user_tracking_In_Out",
                c_path, cnd, null);

    }
}
