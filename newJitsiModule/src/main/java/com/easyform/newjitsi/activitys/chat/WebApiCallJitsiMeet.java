package com.easyform.newjitsi.activitys.chat;




import static android.content.ContentValues.TAG;

import android.os.Bundle;
import android.util.Log;

import com.easyform.newjitsi.network.Models.UserData;
import com.easyform.newjitsi.utils.Utils;
import com.google.gson.Gson;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.io.InputStream;
import java.util.concurrent.TimeUnit;


import okhttp3.Interceptor;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

/**
 * Created by NareshChocha on 10/13/2023.
 *
 * @author NareshChocha
 */
public class WebApiCallJitsiMeet {

    private static OkHttpClient okHttpClient = getHttpClientWithTimeout();


    public static String ExecuteNetworkRequest(JSONObject jsonData, String appUrl, String webMethod,UserData mUserData) {


        String jsonResponse = null;
        appUrl = appUrl + webMethod;

        JSONArray jsds = new JSONArray();
        jsds.put(jsonData);

        JSONObject data2 = null;

        try{
            data2 = new JSONObject();
            data2.put("username", mUserData.getUsername());
            data2.put("u_c", mUserData.getUniqueKey());
            data2.put("appid", mUserData.getAppId());
            data2.put("user_id", mUserData.getUserid());
            data2.put("Role_Id", mUserData.getRoleId());
            data2.put("Company_Feature_Id", mUserData.getCompanyFeatureId());
            data2.put("matchId", "0");

            String auth1 = data2.toString();


            MediaType JSON = MediaType.parse("application/json; charset=utf-8");
            RequestBody body1 = RequestBody.create(JSON, jsds.toString());
            Request request = new Request.Builder()
                    .header("Accept", "application/json")
                    .header("Content-Type", "application/json; charset=utf-8")
                    .header("auth1", auth1)
                    .header("Role_Id", mUserData.getRoleId())
                    .header("Company_Feature_Id", mUserData.getCompanyFeatureId())
                    .header("matchId", "0")
                    .post(body1)
                    .url(appUrl)
                    .build();

            String forErrorLog = "\nauth1 :" + auth1 + "Role_Id :" + mUserData.getRoleId() + "Company_Feature_Id :" + mUserData.getCompanyFeatureId() +
                    "matchId" + "0" + "\n Body :" + jsds;

            Log.d("##WEBSERVICE1", forErrorLog);
            if(!auth1.equalsIgnoreCase(""))
            {
                Response response = okHttpClient.newCall(request).execute();
                try{
                    jsonResponse = response.body().string();
                    Log.d("Response---",jsonResponse);
                    jsonResponse = jsonResponse.replaceAll("(\r\n|\n)", "");

                }
                catch (Exception e)
                {
                    e.printStackTrace();
                    return null;
                }
            }
        }
        catch (Exception e)
        {
        }



        return jsonResponse;
    }


    public static String ExecuteNetworkStringRequest(String jsonData, String appUrl, String webMethod,UserData mUserData) {


        String jsonResponse = null;
        appUrl = appUrl + webMethod;

        JSONArray jsds = new JSONArray();
        jsds.put(jsonData);

        JSONObject data2 = null;

        try{
            data2 = new JSONObject();
            data2.put("username", mUserData.getUsername());
            data2.put("u_c", mUserData.getUniqueKey());
            data2.put("appid", mUserData.getAppId());
            data2.put("user_id", mUserData.getUserid());
            data2.put("Role_Id", mUserData.getRoleId());
            data2.put("Company_Feature_Id", mUserData.getCompanyFeatureId());
            data2.put("matchId", "0");

            String auth1 = data2.toString();


            MediaType JSON = MediaType.parse("application/json; charset=utf-8");
            RequestBody body1 = RequestBody.create(JSON, jsds.toString());
            Request request = new Request.Builder()
                    .header("Accept", "application/json")
                    .header("Content-Type", "application/json; charset=utf-8")
                    .header("auth1", auth1)
                    .header("Role_Id", mUserData.getRoleId())
                    .header("Company_Feature_Id", mUserData.getCompanyFeatureId())
                    .header("matchId", "0")
                    .post(body1)
                    .url(appUrl)
                    .build();

            String forErrorLog = "\nauth1 :" + auth1 + "Role_Id :" + mUserData.getRoleId() + "Company_Feature_Id :" + mUserData.getCompanyFeatureId() +
                    "matchId" + "0" + "\n Body :" + jsonData;

            Log.d("##WEBSERVICE1", forErrorLog);
            if(!auth1.equalsIgnoreCase(""))
            {
                Response response = okHttpClient.newCall(request).execute();
                try{
                    jsonResponse = response.body().string();
                    Log.d("Response--",jsonResponse);
                    jsonResponse = jsonResponse.replaceAll("(\r\n|\n)", "");

                }
                catch (Exception e)
                {
                    e.printStackTrace();
                    return null;
                }
            }
        }
        catch (Exception e)
        {
        }



        return jsonResponse;
    }
    private static OkHttpClient getHttpClientWithTimeout() {

        OkHttpClient.Builder builder;
        builder = new OkHttpClient.Builder();

        builder.connectTimeout(60, TimeUnit.SECONDS)
                .readTimeout(60, TimeUnit.SECONDS)
                .writeTimeout(60, TimeUnit.SECONDS)
                .addInterceptor(new RetryConnectInterceptor(3));


        return builder.build();
    }

    static class RetryConnectInterceptor implements Interceptor {
        private final int maxRetries;
        RetryConnectInterceptor(int maxRetries) { this.maxRetries = maxRetries; }

        @Override public Response intercept(Chain chain) throws IOException {
            Request req = chain.request();
            long waitMs = 300;

            for (int attempt = 0; attempt <= maxRetries; attempt++) {
                try {
                    return chain.proceed(req);
                } catch (IOException e) {
                    boolean connectRefused =
                            (e instanceof java.net.ConnectException) ||
                                    String.valueOf(e.getMessage()).contains("ECONNREFUSED") ||
                                    String.valueOf(e.getMessage()).contains("Connection refused") ||
                                    String.valueOf(e.getMessage()).contains("Failed to connect");

                    if (!connectRefused || attempt == maxRetries) throw e;

                    try { Thread.sleep(waitMs); } catch (InterruptedException ignored) {}
                    waitMs = Math.min(waitMs * 2, 2000);
                }
            }
            return chain.proceed(req);
        }
    }

}
