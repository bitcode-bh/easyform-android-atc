package com.sky.atc.easyformse;

import static com.sky.atc.easyformse.sqlitewraper.context;

import android.content.Intent;
import android.content.SharedPreferences;
import android.content.res.Resources;
import android.database.Cursor;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.widget.Toast;

import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.utils.LogUtils;
import com.sky.atc.easyformse.utils.UnsafeOkHttpClient;

import net.sqlcipher.database.SQLiteDatabase;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.InputStream;
import java.util.concurrent.TimeUnit;

import io.michaelrocks.paranoid.Obfuscate;
import okhttp3.CertificatePinner;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

/**
 * updated by NareshChocha on 11/03/2022.
 *
 * @author NareshChocha
 */

//Web service client to call different webservice
@Obfuscate
public class NewWebservicesCallEasyform {


    static SQLiteDatabase database;
    static MySharedPreferences pref;
    private static OkHttpClient okHttpClient = getHttpClientWithTimeout();

    public static OkHttpClient getOkHttpClient() {
        if (okHttpClient == null) {
            okHttpClient = getHttpClientWithTimeout();
        }
        return okHttpClient;
    }


    // json object response url

    public static String ExecuteNetworkHTTPPostRequest(JSONObject jsonData, String appUrl, String webMethod) {


        String jsonResponse = null;

        B_new b1 = new B_new();
        String u_c2 = b1.GetValue();
        if (u_c2 == null) {
            u_c2 = "";
        }

        if (webMethod.equalsIgnoreCase("Device_Login_With_Multi_Role_Crypto") ||
                webMethod.equalsIgnoreCase("Wcf_Select_ThemeForPackage") ||
                webMethod.equalsIgnoreCase("Wcf_GetApplicationURL_New") ||
                webMethod.equalsIgnoreCase("WCF_getGCMdataByUsername") ||
                (!u_c2.equalsIgnoreCase("NA") && !u_c2.equalsIgnoreCase("")) ||
                webMethod.equalsIgnoreCase("WCF_ForgotPassword") ||
                webMethod.equalsIgnoreCase("Wcf_LDAP_authentication_check")) {

            appUrl = appUrl + webMethod;

            JSONArray jsds = new JSONArray();
            jsds.put(jsonData);

            JSONObject data2 = null;
            try {
                database = sqlitewraper.getDatabase();
                Cursor c3 = database.rawQuery("SELECT username,company_id,appid,user_id FROM Login_Master",
                        null);
                c3.moveToLast();
                String username = c3.getString(0);
                B_new b = new B_new();
                String u_c = b.GetValue();
                int company_id = c3.getInt(1);
                String appid = c3.getString(2);
                String UserId = c3.getString(3);
                c3.close();


                MySharedPreferences prefs = sqlitewraper.getSecureShared("mypre2");
                String roleid = prefs.getString("authroleidn", "0");
                String companyFeatureid = prefs.getString("authcompanyfid", "0");

                if(webMethod.equalsIgnoreCase("Wcf_GetApplicationURL_New"))
                {
                    pref = sqlitewraper.getSecureShared("MyPref");
                    username = pref.getString("username","");
                    data2 = new JSONObject();
                    data2.put("username", username);
                    data2.put("u_c", u_c);
                    data2.put("appid", appid);
                    data2.put("user_id", UserId);
                    data2.put("Role_Id", roleid);
                    data2.put("Company_Feature_Id", companyFeatureid);
                    data2.put("matchId", "0");

                }
                else {
                    data2 = new JSONObject();
                    data2.put("username", username);
                    data2.put("u_c", u_c);
                    data2.put("appid", appid);
                    data2.put("user_id", UserId);
                    data2.put("Role_Id", roleid);
                    data2.put("Company_Feature_Id", companyFeatureid);
                    data2.put("matchId", "0");

                }

                String auth1 = data2.toString();


                MediaType JSON = MediaType.parse("application/json; charset=utf-8");
                RequestBody body1 = RequestBody.create(JSON, jsds.toString());
                Request request = new Request.Builder()
                        .header("Accept", "application/json")
                        .header("Content-Type", "application/json; charset=utf-8")
                        .header("auth1", auth1)
                        .header("Role_Id", roleid)
                        .header("Company_Feature_Id", companyFeatureid)
                        .header("matchId", "0")
                        .post(body1)
                        .url(appUrl)
                        .build();
                String forErrorLog = "\nauth1 :" + auth1 + "Role_Id :" + roleid + "Company_Feature_Id :" + companyFeatureid +
                        "matchId" + "0" + "\nBody :" + jsds;

                Log.d("##WEBSERVICE1", webMethod);

                if (!auth1.equalsIgnoreCase("")) {

                    Response response = okHttpClient.newCall(request).execute();
                    Log.d("##WEBSERVICE2", response.toString());
                    try {
                        jsonResponse = response.body().string();
                        jsonResponse = jsonResponse.replaceAll("(\r\n|\n)", "");
                        after_response(jsonResponse, webMethod, forErrorLog,companyFeatureid,appUrl);
                    } catch (Exception e) {
                        LogUtils.writeApiCallLogToFile(e +
                                "\nJsonData: " + jsonData + "Auth1: " + auth1,  appUrl, "ExecuteNetworkHTTPPostRequest","0");
                        return null;
                    }
                    if (response.code() != 200) {
                        new Handler(Looper.getMainLooper()).post(new Runnable() {
                            public void run() {
                                Toast.makeText(context, "Response code: " + response.code() + "\nMethod: " + webMethod, Toast.LENGTH_LONG).show();
                            }
                        });

                        LogUtils.writeApiCallLogToFile("Response code: " + response.code()
                                + "\nJsonData: " + jsonData + "Auth1: " + auth1,appUrl, "ExecuteNetworkHTTPPostRequest","1");
                        return null;
                    }
                } else {
                    LogUtils.writeApiCallLogToFile(
                            "\nJsonData: " + jsonData + "Auth1: " + auth1 + " null or empty",  appUrl, "ExecuteNetworkHTTPPostRequest","0");
                    return null;
                }

            } catch (Exception e) {
                LogUtils.writeApiCallLogToFile(
                        e + "\nJsonData: " + jsonData,appUrl, "ExecuteNetworkHTTPPostRequest","0");
                return null;
            } finally {
//       TrafficStats.clearThreadStatsTag();
            }
//        }
        }
        return jsonResponse;

    }


    static String currentUrl = null;
    static String finalMessage;
    public static void after_response(String json, final String webmethod, String errorLogString ,String companyFeatureid,String appUrl) {
        try {
            String status = null;
            String message = null;
            String unique_code = "NA";
            JSONArray jsonArray12 = new JSONArray(json);
            for (int k = 0; k < jsonArray12.length(); k++) {
                JSONObject jsonObject = jsonArray12.getJSONObject(0);
                if (jsonObject.has("status"))
                {
                    status = jsonObject.getString("status");
                }
                else {
                    status = jsonObject.getString("Status");
                }
                message = jsonObject.getString("message");

                if (status.equals("1") || status.equals("2") ) {
                }
                else {
                    LogUtils.writeApiCallLogToFile("Status: " + status + " ( " + message + " )" + errorLogString  , appUrl , " after_response","1");
                }

                if(status.equals("3") || status.equals("5"))
                {
                    String finalStatus = status;
                    String finalMessage1 = message;
                    new Handler(Looper.getMainLooper()).post(new Runnable() {
                        public void run() {
                            Toast.makeText(sqlitewraper.context, "Feature Id :" + companyFeatureid +"\nUrl :" + appUrl + "\nStatus :" + finalStatus + "\nMessage :" + finalMessage1, Toast.LENGTH_LONG).show();

                        }
                    });
                }

                if (status.equals("4")) {
                    if (!webmethod.equalsIgnoreCase("Device_Login_With_Multi_Role_Crypto")) {


                        String finalMessage2 = message;
                        // multiple log out issue resolve 16072025
                        new Handler(Looper.getMainLooper()).post(() -> {
                            currentUrl = ph_s.getCurrentHtmlUrl();

                            if (currentUrl != null && currentUrl.toLowerCase().contains("login.html")) {
                                Log.d("##Check", "login.html is already shown, skipping Android code.");
                                return;
                            }
                            else {

                                B_new b = new B_new();
                                b.SetValue("NA", "NA");

                                finalMessage = finalMessage2;

                                String login_key = "False";

                                MySharedPreferences editor = sqlitewraper.getSecureShared("pre1");
                                editor.putString("login_key", login_key);
                                editor.commit();

                                Intent i = new Intent(sqlitewraper.context, MainActivity.class);
                                i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                                sqlitewraper.context.startActivity(i);

                                new Handler(Looper.getMainLooper()).post(new Runnable() {
                                    public void run() {
                                        Toast toast = Toast.makeText(sqlitewraper.context, finalMessage, Toast.LENGTH_LONG);
                                        toast.show();
                                        B_new b_new = new B_new();

                                        Log.d("##webmethod", finalMessage + "=" + webmethod + " " + b_new);
                                    }
                                });
                            }
                        });






                    }
                }

            }

        } catch (Exception e) {
            LogUtils.writeApiCallLogToFile(e.toString(), appUrl , "after_response","0");
            //e.printStackTrace()();

        }
    }

    public static String ExecuteNetworkHTTPPostRequestfile(JSONObject jsonData, String appUrl, String webMethod, JSONObject jsonObject) {

        String jsonResponse = null;

        B_new b1 = new B_new();
        String u_c2 = b1.GetValue();
        if (u_c2 == null) {
            u_c2 = "";
        }

        if (!u_c2.equalsIgnoreCase("NA") && !u_c2.equalsIgnoreCase("")) {

            appUrl = appUrl + webMethod;
            JSONObject data2;
            try {
                database = sqlitewraper.getDatabase();
                Cursor c3 = database.rawQuery("SELECT username,company_id,appid,user_id FROM Login_Master",
                        null);
                c3.moveToLast();
                String username = c3.getString(0);
                B_new b = new B_new();
                String u_c = b.GetValue();
                int company_id = c3.getInt(1);
                String appid = c3.getString(2);
                String UserId = c3.getString(3);
                c3.close();


                MySharedPreferences prefs = sqlitewraper.getSecureShared("mypre2");
                String roleid = prefs.getString("authroleidn", "0");
                String companyFeatureid = prefs.getString("authcompanyfid", "0");


                data2 = new JSONObject();
                data2.put("username", username);
                data2.put("u_c", u_c);
                data2.put("appid", appid);
                data2.put("user_id", UserId);
                data2.put("Role_Id", roleid);
                data2.put("Company_Feature_Id", companyFeatureid);
                data2.put("matchId", "0");


                JSONArray jsds = new JSONArray();
                jsds.put(jsonData);

                String auth1 = data2.toString();

                MediaType JSON = MediaType.parse("application/json; charset=utf-8");
                RequestBody body1 = RequestBody.create(JSON, jsds.toString());
                Request request = new Request.Builder()
                        .header("Accept", "application/json")
                        .header("Content-Type", "application/json; charset=utf-8")
                        .header("auth1", auth1)
                        .header("Role_Id", roleid)
                        .header("Company_Feature_Id", companyFeatureid)
                        .header("matchId", "0")
                        .post(body1)
                        .url(appUrl)
                        .build();
                String forErrorLog = "\nauth1 :" + auth1 + "Role_Id :" + roleid + "Company_Feature_Id :" + companyFeatureid +
                        "matchId" + "0" + "\nBody :" + jsds;
                Log.d("##WEBSERVICEUPLOAD1", webMethod);

                if (!auth1.equalsIgnoreCase("")) {

                    Response response = okHttpClient.newCall(request).execute();
//                    Log.d("##WEBSERVICEUPLOAD2", response.toString());

                    try {
                        jsonResponse = response.body().string();
                        jsonResponse = jsonResponse.replaceAll("(\r\n|\n)", "");
                        after_response(jsonResponse, webMethod, forErrorLog,companyFeatureid,appUrl);
                    } catch (Exception e) {
                        Toast.makeText(context, e + "\n" + appUrl, Toast.LENGTH_SHORT).show();
                        LogUtils.writeApiCallLogToFile("Body: " + jsds + "\nAuth: " + auth1 + "\nResponse parse: " + e, appUrl,"ExecuteNetworkHTTPPostRequestfile","0");
                        //e.printStackTrace()();
                    }
                    if (response.code() != 200) {
                        new Handler(Looper.getMainLooper()).post(new Runnable() {
                            public void run() {
                                Toast.makeText(context, "Response code: " + response.code() + "\nMethod: " + webMethod, Toast.LENGTH_LONG).show();
                            }
                        });
                        LogUtils.writeApiCallLogToFile("Body: " + jsds + "\nAuth: " + auth1 + "\nResponse code: " + response.code() + "",  appUrl,"ExecuteNetworkHTTPPostRequestfile","1");
                        return null;
                    }
                } else {
                    LogUtils.writeApiCallLogToFile("Body: " + jsds + "\nAuth: " + auth1 + "\nauth is empty", appUrl,"ExecuteNetworkHTTPPostRequestfile","0");
                    return null;
                }

            } catch (Exception e) {
                LogUtils.writeApiCallLogToFile(e + " \nExecuteNetworkHTTPPostRequestfile", appUrl,"ExecuteNetworkHTTPPostRequestfile","0");
                return null;
            }
        }
        return jsonResponse;
    }

    //-------timeout
    private static OkHttpClient getHttpClientWithTimeout() {

        String isSSL = sqlitewraper.context.getResources().getString(R.string.SSL);
        OkHttpClient.Builder builder;
        if (isSSL.equalsIgnoreCase("true")) {
            builder = new OkHttpClient.Builder();
            // myaims.vedangcellular.com url is not working in android 6 same ssl problem
            /* if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                builder = new OkHttpClient.Builder();
            } else {
                builder = UnsafeOkHttpClient.getUnsafeOkHttpClient();
            } */
        } else {
            //  wfmtest.grameenphone.com url is not working in android same ssl problem as per discuss with sir we skip the check ssl
            builder = UnsafeOkHttpClient.getUnsafeOkHttpClient();
        }
        builder.connectTimeout(60, TimeUnit.SECONDS)
                .readTimeout(60, TimeUnit.SECONDS)
                .writeTimeout(60, TimeUnit.SECONDS);

        if (isSSL.equalsIgnoreCase("true")) {
            String appURL;
            try {
                appURL = sqlitewraper.context.getResources().getString(R.string.App_URL).split("/")[2].trim();
                Log.i("appURL", "appURL ::: " + appURL);
            } catch (Exception e) {
                appURL = "viu.vodafoneidea.com";
            }
//            Resources res = context.getResources();
//            InputStream file = res.openRawResource(R.raw.viu_vodafoneidea_com);
//            String hashKey = PeerCertificateExtractor.extract(file);
            CertificatePinner certPinner = new CertificatePinner.Builder()
                    .add(appURL, "sha256/+K9l1+oT7O4+ZyDmtftPtAD7JqUzI8/fB/hwkMQR0JQ=")
                    .add(appURL,"sha256/Wec45nQiFwKvHtuHxSAMGkt19k+uPSw9JlEkxhvYPHk=")
                    .add(appURL,"sha256/i7WTqTvh0OioIruIfFR4kMPnBqrS2rdiVPl/s2uC/CY=")
                    .add(appURL,"sha256/DtA+el5OloRQ2t7Al4CUK/m/tddYC8HGEtzd9nTarz0=")
                    .build();
            builder.certificatePinner(certPinner);
        }
        return builder.build();
    }

    public static String ExecuteNetworkHTTPPostRequestFilesAndPhotoUpload(JSONObject jsonData, String appUrl, String webMethod, String matchKeyId, String roleID) {

        String jsonResponse = null;

        B_new b1 = new B_new();
        String u_c2 = b1.GetValue();
        if (u_c2 == null) {
            u_c2 = "";
        }

        if (!u_c2.equalsIgnoreCase("NA") && !u_c2.equalsIgnoreCase("")) {

            appUrl = appUrl + webMethod;
            JSONObject data2;
            try {
                database = sqlitewraper.getDatabase();
                Cursor c3 = database.rawQuery("SELECT username,company_id,appid,user_id FROM Login_Master",
                        null);
                c3.moveToLast();
                String username = c3.getString(0);
                B_new b = new B_new();
                String u_c = b.GetValue();
                int company_id = c3.getInt(1);
                String appid = c3.getString(2);
                String UserId = c3.getString(3);
                c3.close();

                MySharedPreferences prefs = sqlitewraper.getSecureShared("mypre2");

                if (roleID == null || roleID.equalsIgnoreCase("0")) {
                    roleID = prefs.getString("authroleidn", "0");
                }
                String companyFeatureid = prefs.getString("authcompanyfid", "0");


                data2 = new JSONObject();
                data2.put("username", username);
                data2.put("u_c", u_c);
                data2.put("appid", appid);
                data2.put("user_id", UserId);
                data2.put("Role_Id", roleID);
                data2.put("Company_Feature_Id", companyFeatureid);
                data2.put("matchId", matchKeyId);


                JSONArray jsds = new JSONArray();
                jsds.put(jsonData);

                String auth1 = data2.toString();
                String forErrorLog = "\nauth1 :" + auth1 + "Role_Id :" + roleID + "Company_Feature_Id :" + companyFeatureid +
                        "matchId" + matchKeyId + "\nBody :" + jsds;
                MediaType JSON = MediaType.parse("application/json; charset=utf-8");
                RequestBody body1 = RequestBody.create(JSON, jsds.toString());

                Request request = new Request.Builder()
                        .header("Accept", "application/json")
                        .header("Content-Type", "application/json; charset=utf-8")
                        .header("auth1", auth1)
                        .header("Role_Id", roleID)
                        .header("Company_Feature_Id", companyFeatureid)
                        .header("matchId", matchKeyId)
                        .post(body1)
                        .url(appUrl)
                        .build();

                Log.d("##WEBSERVICEUPLOAD1", webMethod);

                if (!auth1.equalsIgnoreCase("")) {

                    Response response = okHttpClient.newCall(request).execute();
                    Log.d("##WEBSERVICEUPLOAD2", response.toString());
                    try {
                        jsonResponse = response.body().string();
                        jsonResponse = jsonResponse.replaceAll("(\r\n|\n)", "");
                        after_response(jsonResponse, webMethod, forErrorLog,companyFeatureid,appUrl);
                    } catch (Exception e) {
                        LogUtils.writeApiCallLogToFile("Body: " + jsds + "\nAuth: " + auth1 + "\nResponse parse: " + e, appUrl,"ExecuteNetworkHTTPPostRequestFilesAndPhotoUpload","0");
                        //e.printStackTrace()();
                    }
                    if (response.code() != 200) {
                        new Handler(Looper.getMainLooper()).post(new Runnable() {
                            public void run() {
                                Toast.makeText(context, "Response code: " + response.code() + "\nMethod: " + webMethod, Toast.LENGTH_LONG).show();
                            }
                        });
                        LogUtils.writeApiCallLogToFile("Body: " + jsds + "\nAuth: " + auth1 + "\nResponse code: " + response.code() + "",  appUrl,"ExecuteNetworkHTTPPostRequestFilesAndPhotoUpload","1");
                        return null;
                    }
                } else {
                    return null;
                }

            } catch (Exception e) {
                LogUtils.writeApiCallLogToFile(e + " \nExecuteNetworkHTTPPostRequestFilesAndPhotoUpload", webMethod,"ExecuteNetworkHTTPPostRequestFilesAndPhotoUpload","0");
                e.getMessage();
                return null;
            }
        }
        return jsonResponse;
    }


}