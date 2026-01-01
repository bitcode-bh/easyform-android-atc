package com.sky.atc.easyformse;

import static android.content.Context.LOCATION_SERVICE;
import static com.sky.atc.easyformse.sqlitewraper.context;

import android.Manifest;
import android.app.ActivityManager;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.res.Resources;
import android.location.Address;
import android.location.Geocoder;
import android.location.LocationManager;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.Build;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.telephony.TelephonyManager;
import android.util.Log;
import android.widget.Toast;

import androidx.core.app.ActivityCompat;

import com.commonsware.cwac.wakeful.WakefulIntentService;
import com.google.android.gms.ads.identifier.AdvertisingIdClient;
import com.google.android.gms.common.GooglePlayServicesNotAvailableException;
import com.google.android.gms.common.GooglePlayServicesRepairableException;
import com.google.android.gms.maps.model.LatLng;
import com.sky.atc.easyformse.attendance.newattendanceutils.models.AttendanceData;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.utils.LogUtils;

import net.sqlcipher.Cursor;
import net.sqlcipher.database.SQLiteDatabase;

import org.apache.http.conn.ClientConnectionManager;
import org.apache.http.conn.scheme.Scheme;
import org.apache.http.conn.scheme.SchemeRegistry;
import org.apache.http.conn.ssl.SSLSocketFactory;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.impl.conn.SingleClientConnManager;
import org.apache.http.params.BasicHttpParams;
import org.apache.http.params.HttpParams;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedInputStream;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStream;
import java.nio.channels.FileChannel;
import java.security.KeyStore;
import java.security.cert.Certificate;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Random;

import javax.net.ssl.TrustManagerFactory;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;


//Different Utils functins
@StringFogIgnore
public class DeviceEventsUtils {

    static SQLiteDatabase database = sqlitewraper.getDatabase();


    //To get current latlong
    public static LatLng getCurrentLatLng() {


        double userLat = 0;
        double userLng = 0;

        Cursor c2 = database
                .rawQuery(
                        "SELECT lat,lon  FROM  track_master WHERE   _id = (SELECT MAX(_id) FROM track_master);",
                        null);
        c2.moveToFirst();
        c2.moveToFirst();
        int count1 = c2.getCount();

        if (count1 > 0) {

            for (int i = 0; i < c2.getCount(); i++) {
                userLat = Double.parseDouble(c2.getString(0));
                userLng = Double.parseDouble(c2.getString(1));
            }
        }
        c2.close();
        return new LatLng(userLat, userLng);
    }

    //battery info
    public static int getBatteryInfo() {

        Intent batteryIntent = sqlitewraper.context.registerReceiver(null,
                new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
        return batteryIntent.getIntExtra("level", -1);
    }

    //utc milliseconds
    public static long utcCalculationOffset(long millisecond) {

        long milliseconds = millisecond;

        Calendar rightNow = Calendar.getInstance();

        long offset = rightNow.get(Calendar.ZONE_OFFSET) +
                rightNow.get(Calendar.DST_OFFSET);

        return milliseconds - offset;
    }

    //get timezone
    public static long getTimeZone() {

        Calendar rightNow = Calendar.getInstance();
        long offset = rightNow.get(Calendar.ZONE_OFFSET) +
                rightNow.get(Calendar.DST_OFFSET);

        return (long) rightNow.get(Calendar.ZONE_OFFSET);

    }

    //get login details from login_master
    public static ArrayList<String> getLoginDetails() {

        ArrayList<String> arrayList = new ArrayList<>();

        android.database.Cursor c3 = database.rawQuery(
                "SELECT  user_id,imei,appid,username,company_id FROM Login_Master",
                null);
        c3.moveToLast();
        String user_id = "";
        String imei = "";
        String appid = "";
        String username = "";
        String companyID = "";
        if (c3.getCount() > 0) {

            user_id = c3.getString(0);
            imei = c3.getString(1);
            appid = c3.getString(2);
            username = c3.getString(3);
            companyID = c3.getString(4);
            c3.close();
        }

        arrayList.add(user_id);
        arrayList.add(imei);
        arrayList.add(appid);
        arrayList.add(username);
        arrayList.add(companyID);
        return arrayList;


    }

    public static ArrayList<String>getFCMID(){
        ArrayList<String> arrayList1 = new ArrayList<>();
        android.database.Cursor a_t = database
                .rawQuery(
                        "select _id,gid,username,version,flag,company_id from gcm_server",
                        null);
        a_t.moveToLast();
        String gid = "";
        String username = "";
        String version = "";
        String flag = "";
        String companyID = "";
        if (a_t.getCount()>0){
            gid=a_t.getString(1);
            username=a_t.getString(2);
            version=a_t.getString(3);
            flag=a_t.getString(4);
            companyID=a_t.getString(5);
            a_t.close();
        }
        arrayList1.add(gid);
        arrayList1.add(username);
        arrayList1.add(version);
        arrayList1.add(flag);
        arrayList1.add(companyID);
        return arrayList1;
    }
    //insert into Events Table
    public static boolean insertIntoEvents(String eventstart, String eventend, String eventduration, String eventType) {

        try {

            boolean isInserted = false;

            ArrayList<String> logindetails = new ArrayList<>();
            logindetails = DeviceEventsUtils.getLoginDetails();
            String userid = logindetails.get(0);
            String imei = logindetails.get(1);
            String appid = logindetails.get(2);
            String username1 = logindetails.get(3);


            ContentValues c = new ContentValues();
            c.put("Event_strt", eventstart);
            c.put("Event_end", eventend);
            c.put("username", username1);
            c.put("Event_type", eventType);
            c.put("lat", DeviceEventsUtils.getCurrentLatLng().latitude);
            c.put("lon", DeviceEventsUtils.getCurrentLatLng().longitude);
            c.put("th_s", "");
            c.put("is_send", "0");
            c.put("duration", eventduration);
            c.put("battery", DeviceEventsUtils.getBatteryInfo());
            c.put("timezone", DeviceEventsUtils.getTimeZone());
            c.put("utcstart", DeviceEventsUtils.utcCalculationOffset(Long.parseLong(eventstart)));
            c.put("utcend", DeviceEventsUtils.utcCalculationOffset(Long.parseLong(eventend)));
            c.put("imei", imei);
            c.put("appid", appid);
            c.put("userid", userid);
            String tid = gettid();

            c.put("tid",tid);
            long temp = database.insert("Events", null, c);

            if (temp > 0) {

                isInserted = true;

                boolean check3 = isMyServiceRunning(sqlitewraper.context,
                        Event.class.getName());
                if (check3) {
                } else {
                    Intent z_n12 = new Intent(sqlitewraper.context, Event.class);
                    WakefulIntentService.sendWakefulWork(sqlitewraper.context,
                            z_n12);
                }
            }
            return isInserted;
        } catch (Exception e) {
            return false;
        }
    }

    public static String gettid(){
        android.database.Cursor tripflag = database.rawQuery("select tid from lat_plug where trip_status = 0", null);
        tripflag.moveToLast();
        int tripflagCount = tripflag.getCount();

        String tid = "0";

        if (tripflagCount>0){
            tid = tripflag.getString(0);
        }

        tripflag.close();
        return tid;
    }

    public static boolean isMyServiceRunning(Context context, String Myservice) {
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

    //to get address from google geocoder
    public static String getCompleteAddressString(double LATITUDE, double LONGITUDE) {
        String strAdd = "";
        Geocoder geocoder = new Geocoder(sqlitewraper.context, Locale.getDefault());
        try {
            List<Address> addresses = geocoder.getFromLocation(LATITUDE, LONGITUDE, 1);
            if (addresses != null) {
                Address returnedAddress = addresses.get(0);
                StringBuilder strReturnedAddress = new StringBuilder("");

                for (int i = 0; i <= returnedAddress.getMaxAddressLineIndex(); i++) {
                    strReturnedAddress.append(returnedAddress.getAddressLine(i)).append("\n");
                }
                strAdd = strReturnedAddress.toString();
                Log.w("##MyCurrentaddress", strReturnedAddress.toString());
            } else {
                Log.w("##MyCurerentAdress", "No Address returned!");
            }
        } catch (Exception e) {
            e.printStackTrace();
            Log.w("##MyCurrent", "Canont get Address!");
        }
        return strAdd;
    }

    //upload database to server
    public static void uploadDatabase(String path) {

        ArrayList<String> logindetails = DeviceEventsUtils.getLoginDetails();
        String userid = logindetails.get(0);
        String username1 = logindetails.get(3);
        String companyID = logindetails.get(4);

        String l_name = path.substring(path.lastIndexOf("."));
        String extn = l_name.substring(l_name.lastIndexOf(".") + 1);

        String name_file = userid + "_" + username1 + "_" + System.currentTimeMillis() + l_name;

        File file = new File(path);
        long length = file.length();
        float mb = (float) length / (1024 * 1024);

        try {
            int k =
                    UploadDatabase.sendFileToServer1(path,
                            "http://fileupload.easyform.in/api/Device_DB_Upload_Insert", name_file, userid, companyID, extn, mb);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    //export db through FCM
    public static void exportDB() {
        try {
            File sd = Environment.getExternalStorageDirectory();
            File data = Environment.getDataDirectory();

            if (sd.canWrite()) {

                String PACKAGE_NAME = context.getPackageName();

                String currentDBPath12 = "//data//" + PACKAGE_NAME
                        + "//databases//" + "location.db";
                String backupDBPath = "EFbackup.db";
                File currentDB = new File(data, currentDBPath12);
                File backupDB = new File(sd, backupDBPath);

                FileChannel src = new FileInputStream(currentDB).getChannel();
                FileChannel dst = new FileOutputStream(backupDB).getChannel();
                dst.transferFrom(src, 0, src.size());
                src.close();
                dst.close();
                uploadDatabase(backupDB.getAbsolutePath());

            }

        } catch (Exception e) {

        }
    }

    //upload upload error log
    public static void uploadErrorLog() {
        LogUtils.uploadErrorFilesToServer();
    }

    //check if there is finish activity enabled in developer options
    public static boolean isFinishActivitiesOptionEnabled(Context context) {
        int result;
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.JELLY_BEAN_MR1) {
            result = Settings.System.getInt(context.getContentResolver(), Settings.System.ALWAYS_FINISH_ACTIVITIES, 0);
        } else {
            result = Settings.Global.getInt(context.getContentResolver(), Settings.Global.ALWAYS_FINISH_ACTIVITIES, 0);
        }

        if (result == 1) {

            new Handler(Looper.getMainLooper()).post(new Runnable() {
                public void run() {
                    Toast toast = Toast.makeText(sqlitewraper.context, "Please turn off 'Do not Keep Activity' from Developer Options in setting", Toast.LENGTH_LONG);
                    toast.show();
                }
            });
        }
        return result == 1;
    }

    //get pinned certificate clients
    public static DefaultHttpClient getClientWithPinnedCertificate() {

        DefaultHttpClient httpClient = null;

        try {

            Resources res = context.getResources();
            InputStream file = res.openRawResource(R.raw.viu_vodafoneidea_com);

            CertificateFactory cf = CertificateFactory.getInstance("X.509");
            InputStream caInput = new BufferedInputStream(file);
            Certificate ca;
            try {
                ca = cf.generateCertificate(caInput);
                System.out.println("ca=" + ((X509Certificate) ca).getSubjectDN());
            } finally {
                caInput.close();
            }
            /* Create a KeyStore containing our trusted CAs */
            String keyStoreType = KeyStore.getDefaultType();
            KeyStore keyStore = KeyStore.getInstance(keyStoreType);
            keyStore.load(null, null);
            keyStore.setCertificateEntry("ca", ca);

            MySSLSocketFactory sf1 = new MySSLSocketFactory(keyStore);
            sf1.setHostnameVerifier(org.apache.http.conn.ssl.SSLSocketFactory.STRICT_HOSTNAME_VERIFIER);

            /* Create a TrustManager that trusts the CAs in our KeyStore */
            String tmfAlgorithm = TrustManagerFactory.getDefaultAlgorithm();
            TrustManagerFactory tmf = TrustManagerFactory.getInstance(tmfAlgorithm);
            tmf.init(keyStore);

//            /* Create an SSLContext that uses our TrustManager */
//            SSLContext context = SSLContext.getInstance("TLS");
//            context.init(null, tmf.getTrustManagers(), null);
//            SSLSocketFactory sslSocketFactory = context.getSocketFactory();

            HttpParams params = new BasicHttpParams();

//            SchemeRegistry registry = new SchemeRegistry();
//            registry.register(new Scheme("http", PlainSocketFactory.getSocketFactory(), 80));
//            registry.register(new Scheme("https", sf1, 443));
//            ClientConnectionManager ccm = new ThreadSafeClientConnManager(params, registry);
//            httpClient = new DefaultHttpClient(ccm,params);

            org.apache.http.conn.ssl.SSLSocketFactory sf = new SSLSocketFactory(keyStore);
            Scheme httpsScheme = new Scheme("https", sf, 443);
            SchemeRegistry schemeRegistry = new SchemeRegistry();
            schemeRegistry.register(httpsScheme);

// apache HttpClient version >4.2 should use BasicClientConnectionManager
            ClientConnectionManager cm = new SingleClientConnManager(params, schemeRegistry);
            httpClient = new DefaultHttpClient(params);
            return httpClient;

        } catch (Exception e) {
            e.printStackTrace();
            return new DefaultHttpClient();
        }
    }

    //to get pakckage name for notification
    public static ArrayList<String> getPackagename() {

        ArrayList<java.lang.String> arrayList1 = new ArrayList<>();

        String PACKAGE_NAME = context.getPackageName();
        String Title;
        String ContentTextGps;
        String ContentTextFused;

        if (PACKAGE_NAME.equalsIgnoreCase("com.easyform.latteys")) {
            Title = "Working";
            ContentTextGps = "Latteys";
            ContentTextFused = "Latteys";

        } else if (PACKAGE_NAME.equalsIgnoreCase("com.easyform.tinkerly")) {
            Title = "Tinkerly";
            ContentTextGps = "Account Management";
            ContentTextFused = "Account Management";
        } else {
            Title = "Tracking";
            ContentTextGps = "Location GPS";
            ContentTextFused = "Location Fused";
        }

        arrayList1.add(Title);
        arrayList1.add(ContentTextGps);
        arrayList1.add(ContentTextFused);


        return arrayList1;
    }

    /**
     * @return imei if api laval is O or higher than gating imei and
     * this is null than we gating ad id and if this is null we pass
     * System.currentTimeMillis() plus random number and saving in SharedPreferences
     */
    public static String getImei() {
        TelephonyManager telephonyManager = (TelephonyManager) context
                .getSystemService(Context.TELEPHONY_SERVICE);
        ActivityCompat.checkSelfPermission(context, Manifest.permission.READ_PHONE_STATE);
        String imei = null;
        if (telephonyManager != null) {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    imei = telephonyManager.getImei(0);
                } else {
                    imei = telephonyManager.getDeviceId(0);
                }
                if (imei == null) {
                    imei = telephonyManager.getDeviceId(0);
                }
            } catch (Exception e) {
                imei = null;
            }

        }

        if (imei == null) {
            AdvertisingIdClient.Info adInfo;
            try {
                adInfo = AdvertisingIdClient.getAdvertisingIdInfo(context);
                //when device setting on opt out personalization getting 0000 imei number so at that time used android_id 13-12-2023
                if(adInfo.getId().equalsIgnoreCase("00000000-0000-0000-0000-000000000000"))
                {
                    imei =  android.provider.Settings.Secure.getString(context.getContentResolver(), android.provider.Settings.Secure.ANDROID_ID);
                }
                else {
                    imei = adInfo.getId();
                }
            } catch (IOException | GooglePlayServicesNotAvailableException | GooglePlayServicesRepairableException e) {
                imei = null;
            }
        }

        if (imei == null) {
            B_new b_new = new B_new();
            if (b_new.getSaveImei() != null && !b_new.getSaveImei().matches("NA")) {
                imei = b_new.getSaveImei();
            } else {
                Random random = new Random();
                imei = System.currentTimeMillis() + "" + Math.abs(random.nextInt());// 1628079277254:383482536
                b_new.saveImei(imei);
            }
        }
        return imei;
    }


    //size converter for files to convert in KB
    public static String VideoSizeConverter(String videosize) {
        double kb;
        String size = videosize.substring(0, videosize.length() - 2);
        String type = videosize.length() > 2 ? videosize.substring(videosize.length() - 2) : videosize;

        if (type.equalsIgnoreCase("MB")) {
            double mb = Double.parseDouble(size);
            kb = mb * 1024;
            videosize = String.valueOf(kb);
        } else {
            videosize = size;
        }

        return videosize;
    }

    //to get gps and internet status
    public static HashMap<String, String> getGPSandIternetStatus() {
        HashMap<String, String> devicestatus = new HashMap<>();

        int gps;
        int gprs = 0;

        //check currently gps is on or off
        final ConnectivityManager connMgr = (ConnectivityManager) sqlitewraper.context
                .getSystemService(Context.CONNECTIVITY_SERVICE);
        if (connMgr != null) {
            final NetworkInfo mobile = connMgr
                    .getNetworkInfo(ConnectivityManager.TYPE_MOBILE);
        }
        LocationManager lm = (LocationManager) sqlitewraper.context.getSystemService(LOCATION_SERVICE);

        //-------------------GPS------------------
        boolean isGPSEnabled = false;
        if (lm != null) {
            isGPSEnabled = lm
                    .isProviderEnabled(LocationManager.GPS_PROVIDER);
        }

        if (isGPSEnabled) {
            gps = 1;
        } else {
            gps = 0;
        }
        //-------------------GPRS-------------------
        boolean icheck = isNetworkAvailable();

        if (connMgr != null) {
            if (connMgr.getNetworkInfo(0).getState() == NetworkInfo.State.CONNECTED
                    || connMgr.getNetworkInfo(1).getState() == NetworkInfo.State.CONNECTING
                    || sqlitewraper.internetflag == 1 || icheck) {
                gprs = 1;
            } else {
                gprs = 0;
            }
        }
        devicestatus.put("gps", String.valueOf(gps));
        devicestatus.put("gprs", String.valueOf(gprs));
        return devicestatus;
    }

    private static boolean isNetworkAvailable() {
        ConnectivityManager connectivityManager = (ConnectivityManager) sqlitewraper.context
                .getSystemService(Context.CONNECTIVITY_SERVICE);
        NetworkInfo activeNetworkInfo = connectivityManager
                .getActiveNetworkInfo();
        return activeNetworkInfo != null;
    }

    //to revert task_master status
    public static void insert_task_master_revert(String reverttype, String revertstatus, int tid) {

        database = sqlitewraper.getDatabase();

        android.database.Cursor c1 = database.rawQuery(
                "Select p_tid,server_task_id,p_server_task_id,status,username from task_master WHERE tid =" + tid, null);
        c1.moveToLast();
        int k = c1.getCount();
        if (k > 0) {
            int p_tid = c1.getInt(0);
            int server_task_id = c1.getInt(1);
            int p_server_task_id = c1.getInt(2);
            String status = c1.getString(3);
            String username = c1.getString(4);
            c1.close();

            String milli = String.valueOf(System.currentTimeMillis());

            ContentValues c = new ContentValues();
            c.put("tid", tid);
            c.put("p_tid", p_tid);
            c.put("server_task_id", server_task_id);
            c.put("p_server_task_id", p_server_task_id);
            c.put("username", username);
            c.put("old_status", status);
            c.put("revert_status", revertstatus);
            c.put("revert_type", reverttype);
            c.put("millisecond", milli);

            long temp1 = database.insert("Task_master_revert", null, c);
            Log.d("##STATUSREVERT", String.valueOf(temp1));
        }

    }

    // check trip start or not
    public static String tripStatus() {

        SQLiteDatabase database = sqlitewraper.getDatabase();
        android.database.Cursor tripflag = database.rawQuery(
                "select * from lat_plug where trip_status = 0", null);
        tripflag.moveToFirst();
        int tripflagCount = tripflag.getCount();
        tripflag.close();

        String triplocation;
        if(tripflagCount == 0)
        {
            triplocation = "false";
        }
        else {
            triplocation = "true";
        }

        return triplocation;
    }

    // split the latlng value and decimal part more than 6 it will truncate it to 6 digit
    public static String LatlngRoundff(String Latlng)
    {
        String[] splitValue = Latlng.split("\\.");

        String wholePart = splitValue[0];
        String decimalPart = splitValue[1];

        int length = decimalPart.length();
        if (length > 6) {
            decimalPart = decimalPart.substring(0, 6);
        }

        String result = wholePart + "." + decimalPart;

        return  result;
    }


    public static boolean CheckRoleIdForAttendance(String  attendanceData){
        try{
            MySharedPreferences prefs = sqlitewraper.getSecureShared("mypre2");
            String roleid = prefs.getString("authroleidn", "0");

            JSONArray jsonArray = new JSONArray(attendanceData);
            JSONObject firstObject = jsonArray.getJSONObject(0);
            JSONArray roleIdArray = firstObject.getJSONArray("role_id_array");

            if (roleIdArray == null || roleIdArray.length() == 0) {
                return true;
            }

            for (int i = 0; i < roleIdArray.length(); i++) {
                String roleId = roleIdArray.getString(i);

                if (roleId.equals(roleid)) {
                    return true;
                }
            }

        }
        catch (Exception e)
        {
            e.printStackTrace();
            return true;
        }
        return false;
    }
}

