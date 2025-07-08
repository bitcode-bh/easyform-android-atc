package com.sky.atc.easyformse;

import static android.content.Context.MODE_PRIVATE;
import static com.sky.atc.easyformse.sqlitewraper.context;

import android.content.BroadcastReceiver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.SharedPreferences.Editor;
import android.database.Cursor;
import android.location.LocationManager;
import android.net.ConnectivityManager;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.text.TextUtils;
import android.util.Log;
import android.widget.Toast;

import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import com.sky.atc.easyformse.attendance.newattendanceutils.AttendanceUtil;
import com.sky.atc.easyformse.datautils.LoginUtils;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.download.ImageDownloadService;
import com.sky.atc.easyformse.download.utils.Utils;

import net.sqlcipher.database.SQLiteDatabase;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaArgs;
import org.apache.cordova.PluginResult;
import org.apache.cordova.PluginResult.Status;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.LinkedHashMap;

public class login_plug implements Runnable {

    public static final String TYPE_NONE = "NONE";
    public static final String GET_FILE = "GetFile/Select_File_Details?";
    private static final String RESUMABLE = context.getResources().getString(R.string.Resumable_URL);

    private static final String WCFURL = context.getResources().getString(R.string.LOGINWCFURL);
    private static final String METHOD_NAME_corner = "Device_Login_With_Multi_Role_Crypto";
    private static final int TIMEOUT = 520000;
    private static final String METHOD_NAME_corner1 = "Wcf_LDAP_authentication_check";
    public CallbackContext callbackContext;
    NewWebservicesCallEasyform NewWebservicesCallEasyform = new NewWebservicesCallEasyform();
    BroadcastReceiver receiver;
    MySharedPreferences pref;
    Editor editor;
    int i;
    int gps;
    SQLiteDatabase database;
    // public CallbackContext callbackContext;
    JSONObject json;
    // CordovaArgs args;
    String action;
    CordovaArgs args;

    public login_plug(String ac, CordovaArgs args, Context c,
                      CallbackContext callbackContext1) {

        this.action = ac;
        this.args = args;
        this.callbackContext = callbackContext1;

    }

    @Override
    public void run() {

        try {

            String restext = null;
            try {

                //gets the parameter from plugin
                String log_flag = "";
                String servermilli = "";
                String appid = "";
                if (!args.getJSONObject(0).getString("appid").equalsIgnoreCase("null")) {
                    appid = args.getJSONObject(0).getString("appid");
                }
                if (!args.getJSONObject(0).getString("servermilli").equalsIgnoreCase("null")) {
                    servermilli = args.getJSONObject(0).getString("servermilli");
                }
                String username_ = args.getJSONObject(0).getString("username_");
                String uniq_code = args.getJSONObject(0).getString("uniq_code");
                String imeino = args.getJSONObject(0).getString("imeino");
                String password_ = args.getJSONObject(0).getString("password_");
//                String password1_ = args.getJSONObject(0).getString("password1_");

                String version = args.getJSONObject(0).getString("version");
                String otp = args.getJSONObject(0).getString("otp");

                JSONObject data12 = new JSONObject();
                data12.put("username_", username_);
                JSONArray j = new JSONArray();
                j.put(data12);

                //from here

                pref = sqlitewraper.getSecureShared("MyPref");
                final String olduser = pref.getString("olduser", null);


                if (args.getJSONObject(0).has("log_flag")) {

                    log_flag = args.getJSONObject(0).getString("log_flag");
                }

                if (!log_flag.equalsIgnoreCase("logout")) {

                    if (olduser != null) {

                        //check if there is any previous data is pending for upload
                        //stop the execution if data pending

                        if (!olduser.equalsIgnoreCase(username_)) {

                            if (uploadPending()) {
                                JSONObject jsonObjectInner = new JSONObject();
                                jsonObjectInner.put("status", "5000");

                                JSONArray array = new JSONArray();
                                array.put(jsonObjectInner);

                                JSONArray jsonArray = new JSONArray();
                                JSONObject jsonObject = new JSONObject();
                                jsonArray.put(jsonObject);
                                jsonObject.put("responseText", array.toString());

                                new Handler(Looper.getMainLooper()).post(new Runnable() {
                                    public void run() {
                                        Toast toast = Toast.makeText(context, "Some data of previous user " + olduser + " are pending for upload, please Login with previous user", Toast.LENGTH_LONG);
                                        toast.show();
                                    }
                                });

                                PluginResult result = new PluginResult(Status.OK, jsonArray.toString());
                                callbackContext.sendPluginResult(result);
                                return;

                            }

                        }
                    }
                }


                //LDAP WEBSERVICE CALL
                restext = NewWebservicesCallEasyform.ExecuteNetworkHTTPPostRequest(data12, WCFURL, METHOD_NAME_corner1);
                String message = "NA";
                if (restext != null && !restext.equals("")) {
                    JSONArray jsonArray1 = new JSONArray(restext);
                    for (int k = 0; k < jsonArray1.length(); k++) {
                        JSONObject jsonObject = jsonArray1.getJSONObject(0);
                        message = jsonObject.getString("message");
                    }
                }

                String uctLogin = null;

                if (log_flag.equals("login")) {
                    uctLogin = LoginUtils.getRandomString(10);
                }

                ArrayList<String> utcmi = new ArrayList<>();
                if (servermilli != null && !servermilli.equalsIgnoreCase("")) {
                    utcmi = utcCalculationOffset(servermilli);
                }
                String timezone = utcmi.get(1);
                String utcmilliseconds = utcmi.get(0);

                JSONObject data2 = new JSONObject();
                data2.put("username_", username_);
                data2.put("uniq_code", uniq_code);
                data2.put("imeino", imeino);
                data2.put("version", version);
                data2.put("appid", appid);
                data2.put("servermilli", servermilli);
                data2.put("timezone", timezone);
                data2.put("utcmilliseconds", utcmilliseconds);
                String deviceinfo = DeviceInformation.getDeviceInformation();
                deviceinfo = deviceinfo.replaceAll("(\r\n|\n)", "");
                data2.put("deviceinfo", deviceinfo);
                data2.put("uct", uctLogin);
                data2.put("otp", otp);


                if (args.getJSONObject(0).has("log_flag")) {

                    log_flag = args.getJSONObject(0).getString("log_flag");
                    data2.put("log_flag", log_flag);
                }

                if (message.equals("true")) {
                    data2.put("password_", password_);
                } else {
                    data2.put("password_", password_);
                }
                JSONArray data3 = new JSONArray();
                data3.put(data2);

                //current gps status
                i = check();


                //LOGIN WEBSERVICES CALL
                restext = NewWebservicesCallEasyform.ExecuteNetworkHTTPPostRequest(data2, WCFURL, METHOD_NAME_corner);

                String status = null;
                String unique_code = "NA";
                String login_key = "NA";
                String gpsflag = "0";
                String roleIDArray;
                String responseUCT = null;
                JSONObject jsonObject = null;
                String attendanceValues = "[]";

                //Receive single object in Array
                JSONArray jsonArray12 = new JSONArray(restext);
                for (int k = 0; k < jsonArray12.length(); k++) {
                    jsonObject = jsonArray12.getJSONObject(0);
                    status = jsonObject.getString("status");
                }
                String fullPath = "";
                if (status.equals("1")) {

                    unique_code = jsonObject.getString("Uniq_Code");
                    gpsflag = jsonObject.getString("GPS");
                    attendanceValues = jsonObject.getString("Attendance");
                    pref = sqlitewraper.getSecureShared("MyPref");
                    pref.putString("Attendance",jsonObject.getString("Attendance"));
                    pref.commit();

                    //For Register Alarm for Attendance
                    if (attendanceValues.equalsIgnoreCase("true")) {
                        attendanceValues = jsonObject.getString("AttendanceJson");
                        Log.d("attendanceJson ", attendanceValues);
                        final String finalAttendanceValues = attendanceValues;
                        AttendanceUtil.setAttendanceDataListAndSave(finalAttendanceValues);
                        new Handler(Looper.getMainLooper()).postDelayed(() -> {
                           // AttendanceUtil.setAttendanceDataListAndSave(finalAttendanceValues);
                            Log.e("attendanceDataList : ", AttendanceUtil.getAttendanceDataList().toString());
                            AttendanceUtil.setAttendanceNotificationAlarm(AttendanceUtil.getAttendanceDataList().get(0));
                        }, 2000);
                    }

                    //for location tracking type if continues tracking or app tracking.
                    if (gpsflag.equalsIgnoreCase("1") || gpsflag.equalsIgnoreCase("2")) {
                        //to start gps from ph_s
                        Intent intent = new Intent("com.easyform.CUSTOM_BROADCAST");
                        sqlitewraper.context.sendBroadcast(intent);
                        i = 1;
                    }


                    //pending
                    try {
                        login_key = jsonObject.getString("One_Time_Login");
                        if (login_key.equals("") || login_key.equals("NA") || login_key.equals("null")) {
                            login_key = "False";
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                        login_key = "False";
                    }

//                    if (log_flag.equalsIgnoreCase("login")){
//                        if (jsonObject.has("role_id_array")){
//                            roleIDArray = jsonObject.getString("role_id_array");
//                            checkRoleid(roleIDArray);
//                        }
//                    }
//
//                    if (log_flag.equalsIgnoreCase("login")){
//                        if (jsonObject.has("role_id_array") && jsonObject.has("company_feature_id")){
//                            String roleIDArraynew = jsonObject.getString("role_id_array");
//                            String companyFeatureId = jsonObject.getString("company_feature_id");
//                            saveRoleandCompanyfeatureID(roleIDArraynew,companyFeatureId);
//                        }
//                    }

                    if (jsonObject.getString("responseuct").equalsIgnoreCase("null")) {
                        final String format = Settings.System.getString(context.getContentResolver(), Settings.System.DATE_FORMAT);
                        DateFormat dateFormat;
                        if (TextUtils.isEmpty(format)) {
                            dateFormat = android.text.format.DateFormat.getMediumDateFormat(context);
                        } else {
                            dateFormat = new SimpleDateFormat(format);
                        }
                        final String pattern = ((SimpleDateFormat) dateFormat).toPattern();

                        LinkedHashMap<String, Object> lHashMap = new LinkedHashMap<String, Object>();
                        lHashMap.put("responseText", restext);
                        lHashMap.put("dateFormat", pattern);

                        Log.d("profileFilePath 419", fullPath);
                        lHashMap.put("profileFilePath", fullPath);

                        lHashMap.put("url", context.getResources().getString(R.string.App_URL) + "/services/");

                        lHashMap.put("gps", i); // respond value in key
                        ArrayList<JSONObject> list = new ArrayList<JSONObject>();
                        JSONObject json = null;
                        json = new JSONObject(lHashMap);
                        list.add(json);

                        pref = sqlitewraper.getSecureShared("MyPref");
//                editor = pref.edit();
                        pref.putString("olduser", username_); // Saving string
//                editor.commit();
                        pref.commit();


                        PluginResult result = new PluginResult(Status.OK,
                                list.toString());

                        //crashlytics
                        callbackContext.sendPluginResult(result);
                    } else {

                        //If role id is not same than redownload UDF and Checksheet
                        if (log_flag.equalsIgnoreCase("login")) {
                            if (jsonObject.has("role_id_array")) {
                                roleIDArray = jsonObject.getString("role_id_array");
                                checkRoleid(roleIDArray);
                            }
                        }

                        //save company ID and role id and pass it to future webservice call in headers

                        if (log_flag.equalsIgnoreCase("login")) {
                            if (jsonObject.has("role_id_array") && jsonObject.has("company_feature_id")) {
                                String roleIDArraynew = jsonObject.getString("role_id_array");
                                String companyFeatureId = jsonObject.getString("company_feature_id");
                                saveRoleandCompanyfeatureID(roleIDArraynew, companyFeatureId);
                            }
                        }

                        if (log_flag.equals("login")) {
                            B_new b = new B_new();
                            b.SetValue(unique_code, password_);

                            //DOWNLOAD METER ANYLINE METER READING APP
                            try {
                                assert jsonObject != null;
                                String meterreading = jsonObject.getString("Meter_Reading");

                                if (meterreading.equalsIgnoreCase("true")) {
                                    String meterpackage = jsonObject.getString("PackageName_MeterReading");
                                    String meterversion = jsonObject.getString("VersionName_MeterReading");
                                    MySharedPreferences editor1 = sqlitewraper.getSecureShared("pre1");
                                    editor1.putString("PackageName_MeterReading", meterpackage);
                                    editor1.putString("VersionName_MeterReading", meterversion);
                                    editor1.commit();

                                }
                            } catch (Exception e) {
                                e.printStackTrace();
                            }


                            //SERVER SIDE AUTHENTICATION OF UNIQUE CODE

                            if (jsonObject.has("responseuct")) {

                                responseUCT = jsonObject.getString("responseuct");
                                boolean isLoginValid = LoginUtils.isValidLogin(responseUCT, unique_code, uctLogin);

                                if (!isLoginValid) {
                                    this.callbackContext.error("Not Valid Login");
                                    return;
                                } else {

                                    String checktype;
                                    int type22_img_que_id = 0;
                                    int t_row_index_no = 0;
                                    int checksheet_type_filter = 7;
                                    int que_id = 4008;
//                                int que_id = 0;
                                    String random_str = "";
                                    String uniqcode;
                                    String user_id = "";
                                    String imageUrl = null;
                                    String filename = null;

                                    try {
                                        uniqcode = jsonObject.getString("Uniq_Code");

                                        user_id = jsonObject.getString("user_id");
                                        checktype = jsonObject.getString("checksheet_id");
                                        imageUrl = WCFURL + GET_FILE + "cid=" + checktype + "&t22id=" + type22_img_que_id + "&t22i=" + t_row_index_no + "&id=" + user_id + "&qd=" + que_id + "&ctype=" + checksheet_type_filter + "&ud=" + user_id + "&uc=" + uniqcode + random_str + "";
                                        Log.d("##URLPATH1", imageUrl);
                                        MySharedPreferences pref = sqlitewraper.getSecureShared("MyPref");
                                        pref.putString("image_url",imageUrl);
                                        pref.commit();


                                        if (jsonObject.has("userdata")) {

                                            String thrsoldArray = jsonObject.getString("userdata");
                                            JSONObject jsonObject1 = null;

                                            JSONArray jsonArray = new JSONArray(thrsoldArray);

                                            for (int i = 0; i < jsonArray.length(); i++) {

                                                jsonObject1 = jsonArray.getJSONObject(i);
                                                String questionId = jsonObject1.getString("que_id");
                                                Log.d("##QUESTIONID", questionId);

                                                if (questionId.equalsIgnoreCase("4008")) {

                                                    if (jsonObject1.has("ans")) {
//
                                                        JSONArray array = jsonObject1.getJSONArray("ans");
                                                        filename = array.getString(1);


                                                        Log.d("##URLPATH2", filename);
                                                    }
                                                }
                                            }


                                        }

                                    } catch (JSONException e) {
                                        e.printStackTrace();
                                    }
                                    if (filename == null || filename.isEmpty()) {
                                        filename = "" + user_id + System.currentTimeMillis() + ".jpeg";
                                    }
                                    // get filename from login response and set it
                                    fullPath = Utils.getDownloadPathFile(context).getAbsolutePath() + "/" + filename;
                                    context.startService(new Intent(context, ImageDownloadService.class)
                                            .putExtra("imageUrl", imageUrl)
                                            .putExtra("FileName", filename));

                                }

                            }


                            //SAVING THRESOLD VALUES FOR ACCELARATION
                            if (jsonObject.has("Threshold")) {

                                String thrsoldArray = jsonObject.getString("Threshold");

                                JSONArray jsonArray = new JSONArray(thrsoldArray);
                                JSONObject jsonObject1 = jsonArray.getJSONObject(0);

                                if (jsonObject1.has("speed_violation_time")) {
                                    String speedViolation = jsonObject1.getString("speed_violation_time");
                                    MySharedPreferences editor = sqlitewraper.getSecureShared("pre1");
                                    editor.putString("speedviolation", speedViolation);
                                    editor.commit();

                                }
                            }

                            //For Chat Login
                            mchatResponse(jsonObject);
//                        DownloadURl(jsonObject);

                            MySharedPreferences editor = sqlitewraper.getSecureShared("pre1");
                            editor.putString("login_key", login_key);
                            editor.commit();

                        /*int timeout = 0;
                        while (true) {
                            if (PreferencesUtil.getPreferences(context).getBoolean(PreferencesKey.isDownloaded, false)) {
                                fullPath = PreferencesUtil.getPreferences(context).getString(PreferencesKey.fileFullPath, "");
                                if (!fullPath.isEmpty()) {
                                    if (new File(fullPath).exists()) {
                                        break;
                                    }
                                }
                            } else if (timeout >= 31) {
                                break;
                            } else {
                                try {
                                    timeout++;
                                    Thread.sleep(1000);
                                } catch (Exception e) {
                                    Log.d("Error ", e.toString());
                                }
                            }
                        }
                        if (!fullPath.isEmpty()) {
                            Log.d("FilePath ", fullPath);
                        } else {
                            Log.d("FilePath ", fullPath);
                        }*/

                        }
                        if (log_flag.equals("logout")) {

                            B_new b = new B_new();
                            b.SetValue("NA", "NA");

                            login_key = "False";
                            MySharedPreferences editor = sqlitewraper.getSecureShared("pre1");
                            editor.putString("login_key", login_key);
                            editor.commit();


                            pref = sqlitewraper.getSecureShared("MyPref");
//                        editor = pref.edit();
                            pref.putString("olduser", username_); // Saving string
                            pref.commit();
//                        editor.commit();

                        }

                        final String format = Settings.System.getString(context.getContentResolver(), Settings.System.DATE_FORMAT);
                        DateFormat dateFormat;
                        if (TextUtils.isEmpty(format)) {
                            dateFormat = android.text.format.DateFormat.getMediumDateFormat(context);
                        } else {
                            dateFormat = new SimpleDateFormat(format);
                        }
                        final String pattern = ((SimpleDateFormat) dateFormat).toPattern();

                        LinkedHashMap<String, Object> lHashMap = new LinkedHashMap<String, Object>();
                        lHashMap.put("responseText", restext);
                        lHashMap.put("dateFormat", pattern);

                        Log.d("profileFilePath 419", fullPath);
                        lHashMap.put("profileFilePath", fullPath);

                        lHashMap.put("url", context.getResources().getString(R.string.App_URL) + "/services/");

                        lHashMap.put("gps", i); // respond value in key
                        ArrayList<JSONObject> list = new ArrayList<JSONObject>();
                        JSONObject json = null;
                        json = new JSONObject(lHashMap);
                        list.add(json);

                        pref = sqlitewraper.getSecureShared("MyPref");
//                editor = pref.edit();
                        pref.putString("olduser", username_); // Saving string
//                editor.commit();
                        pref.commit();


                        PluginResult result = new PluginResult(Status.OK,
                                list.toString());

                        //crashlytics
                        callbackContext.sendPluginResult(result);
                    }
                } else {
                    final String format = Settings.System.getString(context.getContentResolver(), Settings.System.DATE_FORMAT);
                    DateFormat dateFormat;
                    if (TextUtils.isEmpty(format)) {
                        dateFormat = android.text.format.DateFormat.getMediumDateFormat(context);
                    } else {
                        dateFormat = new SimpleDateFormat(format);
                    }
                    final String pattern = ((SimpleDateFormat) dateFormat).toPattern();

                    LinkedHashMap<String, Object> lHashMap = new LinkedHashMap<String, Object>();
                    lHashMap.put("responseText", restext);
                    lHashMap.put("dateFormat", pattern);

                    Log.d("profileFilePath 419", fullPath);
                    lHashMap.put("profileFilePath", fullPath);

                    lHashMap.put("url", context.getResources().getString(R.string.App_URL) + "/services/");

                    lHashMap.put("gps", i); // respond value in key
                    ArrayList<JSONObject> list = new ArrayList<JSONObject>();
                    JSONObject json = null;
                    json = new JSONObject(lHashMap);
                    list.add(json);

                    pref = sqlitewraper.getSecureShared("MyPref");
//                editor = pref.edit();
                    pref.putString("olduser", username_); // Saving string
//                editor.commit();
                    pref.commit();


                    PluginResult result = new PluginResult(Status.OK,
                            list.toString());

                    //crashlytics
                    callbackContext.sendPluginResult(result);
                }


            } catch (Exception e) {
                this.callbackContext.error(restext);
                // TODO: handle exception
            }

        } catch (
                Exception e) {
        }
        return;
    }


    // check GPS is on or off
    int check() {
        final ConnectivityManager connMgr = (ConnectivityManager) context
                .getSystemService(Context.CONNECTIVITY_SERVICE);
        final android.net.NetworkInfo mobile = connMgr
                .getNetworkInfo(ConnectivityManager.TYPE_MOBILE);
        LocationManager lm = (LocationManager) context
                .getSystemService(context.LOCATION_SERVICE);
        boolean isGPSEnabled = lm
                .isProviderEnabled(LocationManager.GPS_PROVIDER);

        if (isGPSEnabled == true) {
            gps = 1;

        } else {
            gps = 0;
        }
        return gps;
    }

    //CONVERTING MILLI TO UTC
    private ArrayList utcCalculationOffset(String millisecond) {

        ArrayList<String> arrayList = new ArrayList<>();

        long milliseconds = Long.parseLong(millisecond);

        Calendar rightNow = Calendar.getInstance();

        long offset = rightNow.get(Calendar.ZONE_OFFSET) +
                rightNow.get(Calendar.DST_OFFSET);

        long utcmilliseconds = milliseconds - offset;
        long zoneOffset = rightNow.get(Calendar.ZONE_OFFSET);

        String timezone = String.valueOf((zoneOffset));
        arrayList.add(String.valueOf(utcmilliseconds));
        arrayList.add(timezone.toString());
        return arrayList;
    }

    //CHECK IF ANYTHING IN UPLOAD PENDING OF PREVIOUS USER
    private boolean uploadPending() {

        int flag = 0;

        database = sqlitewraper.getDatabase();


        Cursor c = database
                .rawQuery(
                        "select tid,siteid,checksheetid,height,tower_type,server_task_id,status,step from task_master where flag='1' ",
                        null);

        if (c.getCount() > 0) {
            flag = 1;

            Log.e("task_master_flag", String.valueOf(flag));

        }

        cursour_close(c);

        c = database
                .rawQuery(
                        "select fid,f_name,f_data,f_key,f_value,f_type,c_type from f_master where flag='0'",
                        null);
        if (c.getCount() > 0) {
            flag = 1;
            Log.e("f_master_flag", String.valueOf(flag));
        }

        cursour_close(c);

        c = database
                .rawQuery(
                        "select pid,p_name,p_url,p_key,p_value,p_type,it_id,que_id,checksheetid from p_master where flag='0' ",
                        null);

        if (c.getCount() > 0) {
            flag = 1;
            Log.e("p_master_flag", String.valueOf(flag));
        }

        cursour_close(c);

        c = database
                .rawQuery(
                        "select tid,siteid,checksheetid,height,tower_type,server_task_id,status,step,moduledef,global_var,tid_n,moduleid from task_master_history where flag='1'",
                        null);

        if (c.getCount() > 0) {
            flag = 1;
            Log.e("history_flag", String.valueOf(flag));
        }

        cursour_close(c);

        if (flag == 1) {

            return true;
        } else {
            return false;
        }
    }

    private void cursour_close(Cursor c) {
        try {
            c.close();
        } catch (Exception ignore) {

        }

    }

    //CHECK ROLE ID OF PREVIOUS LOGIN
    private void checkRoleid(String roleIDArray) {

        MySharedPreferences prefs = sqlitewraper.getSecureShared("mypre2");
        String shareroleidarray = prefs.getString("roleidarray", "");

        if (shareroleidarray.equals("")) {

            MySharedPreferences editor = sqlitewraper.getSecureShared("mypre2");
            editor.putString("roleidarray", String.valueOf(roleIDArray));
            editor.commit();

        } else {

            String[] strArr1 = new String[]{shareroleidarray};
            String[] strArr2 = new String[]{roleIDArray};
            compareArrays(strArr1, strArr2, roleIDArray);

        }
    }


    private void compareArrays(String[] array1, String[] array2, String normalroleidarray) {
        boolean b = false;
        for (String anArray2 : array2) {

            for (String anArray1 : array1) {
                if (anArray2.equals(anArray1)) {
                    b = true;
                    System.out.println("true");
                } else {
                    b = false;
                    Editor editor = context.getSharedPreferences("mypre2", MODE_PRIVATE).edit();
                    editor.putString("roleidarray", normalroleidarray);
                    editor.apply();
                    updateUdf();
                    break;
                }
            }
        }
    }

    //UPDATE USERDEFINE FLOW MASTER MILLISECOND FOR DIFFERENT ROLE ID
    private void updateUdf() {

        database = sqlitewraper.getDatabase();
        String t1 = "";
        ContentValues v = new ContentValues();
        v.put("millisecond", "0");
        long temp = database.update("User_Define_Flow_Master", v, t1, null);
        long temp2 = database.update("checksheet", v, t1, null);
        long temp3 = database.update("flow_master", v, t1, null);
        Log.d("hello", String.valueOf(temp));

        ContentValues v1 = new ContentValues();
        v1.put("main_milli", "0");
        v1.put("sub_milli", "0");
        v1.put("main_id", "0");
        v1.put("sub_id", "0");
        long temp4 = database.update("Login_Master", v1, t1, null);
    }


    private void saveRoleandCompanyfeatureID(String roleIDArray, String companyFeatureID) {

        String[] namesArray = roleIDArray.split(",");
        String roleId = namesArray[0];
        roleId = roleId.replaceAll("[\\[\\]]", "");

        MySharedPreferences editor = sqlitewraper.getSecureShared("mypre2");
        editor.putString("authroleidn", roleId);
        editor.putString("authcompanyfid", String.valueOf(companyFeatureID));
        editor.commit();
    }


    //FOR CHAT LOGIN
    private void mchatResponse(JSONObject jsonObject) {

        try {

            setParameterToZoomSDK();

            MySharedPreferences editor = sqlitewraper.getSecureShared("pre1");

            if (jsonObject.has("Chat_Response")) {

                String chatresponse = jsonObject.getString("Chat_Response");

                if (!chatresponse.equalsIgnoreCase("")) {

                    JSONObject jsonObjectMain = new JSONObject(chatresponse);
                    JSONObject jsonObject1 = jsonObjectMain.getJSONObject("Response");
                    JSONObject jsonObject2 = jsonObject1.getJSONObject("user");

                    String login = jsonObject2.getString("email");

                    editor.putString("Chat_Response", login);
                    editor.commit();
                }

                //For Dynamic Download of Chat application
//                if (!chatresponse.equalsIgnoreCase("")){
//                    DownloadAndInstallAPK.downloadAndInstallChatApplication();
//                }
            }

            if (jsonObject.has("Random_Password")) {
                String randomPassword = jsonObject.getString("Random_Password");
                editor.putString("Random_Password", randomPassword);
                editor.commit();
                sendMessageToAr();
            }
            if (jsonObject.has("Occupants_id")) {
                String occupantsId = jsonObject.getString("Occupants_id");
                editor.putString("Occupants_id", occupantsId);
                editor.commit();
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    //BRODCAST TO LOGIN INTO CHAT
    private void sendMessageToAr() {
        Intent intent = new Intent("dynamic-login-chat");
        LocalBroadcastManager.getInstance(context).sendBroadcast(intent);
    }

    private void setParameterToZoomSDK() {

        try {
            Log.e("##ZOOM_LOGIN", "1: ");


            SQLiteDatabase database = sqlitewraper.getDatabase();
            Cursor c3 = database.rawQuery("SELECT username,company_id,appid,user_id FROM Login_Master",
                    null);
            c3.moveToLast();

            String username = c3.getString(0);
            int company_id = c3.getInt(1);
            String appid = c3.getString(2);
            String UserId = c3.getString(3);
            c3.close();
            B_new b = new B_new();
            String u_c = b.GetValue();

            MySharedPreferences prefs = sqlitewraper.getSecureShared("mypre2");
            String roleid = prefs.getString("authroleidn", "0");
            String companyFeatureid = prefs.getString("authcompanyfid", "0");

            Intent i = null;
            try {
                i = new Intent(context, Class.forName("com.example.easyformzoom.broadcast_receiver.Zoom_Broadcast"));
            } catch (ClassNotFoundException e) {
                e.printStackTrace();
            }
            if (i != null) {
                i.setAction("com.example.easyformzoom.DeviceUtilsdata");
                i.putExtra("username", username);
                i.putExtra("appid", appid);
                i.putExtra("company_id", String.valueOf(company_id));
                i.putExtra("UserId", UserId);
                i.putExtra("u_c", u_c);
                i.putExtra("roleid", roleid);
                i.putExtra("companyFeatureid", companyFeatureid);
                Log.e("##ZOOM_LOGIN", "1: ");
                context.sendBroadcast(i);
            }

//            DeviceEventsUtilsZoom.username = username;
//            DeviceEventsUtilsZoom.appid = appid;
//            DeviceEventsUtilsZoom.company_id = String.valueOf(company_id);
//            DeviceEventsUtilsZoom.UserId = UserId;
//            DeviceEventsUtilsZoom.u_c = u_c;
//            DeviceEventsUtilsZoom.roleid = roleid;
//            DeviceEventsUtilsZoom.companyFeatureid = companyFeatureid;
//            Log.e("##ZOOM_LOGIN", "2: ");
//
//            DeviceEventsUtilsZoom.saveLoginDetailsToPreferences(username,appid,UserId,u_c,roleid,companyFeatureid, String.valueOf(company_id));

        } catch (Exception e) {
            Log.e("##ZOOM_PLUGIN", "4: " + e.getMessage());
        }

    }


}