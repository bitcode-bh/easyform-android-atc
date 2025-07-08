package com.example.easyformzoom.zoom.firebase;

import android.os.StrictMode;
import android.util.Log;
import android.widget.Toast;

import com.example.easyformzoom.zoom.App;
import com.example.easyformzoom.zoom.datautils.ListUsernameFId;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;

import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class NetworkCallZoomChat {

    private static OkHttpClient okHttpClient = new OkHttpClient();


    public static ArrayList<ListUsernameFId> getListOfUserAndFCMID() {


        StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
        StrictMode.setThreadPolicy(policy);

        String appUrl = "https://development.easyform.in/coreapi/api/";
        String webMethod = "WCF_Getuserdata_using_companyid";


        JSONArray jsonArray = new JSONArray();
        JSONObject jsonObject = new JSONObject();
        try {
            jsonObject.put("company_id", DeviceEventsUtilsZoom.company_id);
            jsonArray.put(jsonObject);
        } catch (JSONException e) {
            e.printStackTrace();
        }

        Log.d("##NETWORK_CALL","getListOfUserAndFCMID: "+jsonObject.toString());
        String jsonResponse = ExecuteNetworkHTTPPostRequest(jsonObject, appUrl, webMethod);

        Log.d("##NETWORK_CALL", jsonResponse);

        return getListOfUserResponse(jsonResponse);
    }

    private static ArrayList<ListUsernameFId> getListOfUserResponse(String response) {

        ArrayList<ListUsernameFId> listUsernameFIds = new ArrayList<>();
        try {
            JSONArray jsonArray = new JSONArray(response);

            for (int i = 0; i < jsonArray.length(); i++) {
                JSONObject jsonObject = jsonArray.getJSONObject(i);
                String status = jsonObject.getString("status");

                if (status.equalsIgnoreCase("1")) {

                    String data = jsonObject.getString("data");
                    JSONArray jsonArray1 = new JSONArray(data);

                    for (int j = 0; j < jsonArray1.length(); j++) {

                        JSONObject jsonObject1 = jsonArray1.getJSONObject(j);
                        String username = jsonObject1.getString("username");
                        String fcmid = jsonObject1.getString("fcmid");
                        String DeviceType = jsonObject1.getString("DeviceType");
                        Log.d("##FCM_RESPONSE_USER", username);
                        if (!DeviceEventsUtilsZoom.username.equalsIgnoreCase(username)) {
                            ListUsernameFId listUsernameFId = new ListUsernameFId(username, fcmid, DeviceType);
                            listUsernameFIds.add(listUsernameFId);
                        }
                    }
                } else {
                    Log.d("##FCM_RESPONSE","1");
//                    Toast.makeText(App.getContext(), "Something went wrong", Toast.LENGTH_SHORT).show();
                }
            }

        } catch (JSONException e) {
            e.printStackTrace();
        }
        return listUsernameFIds;
    }

    public static String ExecuteNetworkHTTPPostRequest(JSONObject jsonData, String appUrl, String webMethod) {


        String jsonResponse = null;

        if (1 == 1) {

            appUrl = appUrl + webMethod;

            JSONArray jsds = new JSONArray();
            jsds.put(jsonData);

            JSONObject data2 = null;
            try {

                String username = DeviceEventsUtilsZoom.username;
                String u_c = DeviceEventsUtilsZoom.u_c;
//                String company_id = String.valueOf(DeviceEventsUtilsZoom.company_id);
                String appid = DeviceEventsUtilsZoom.appid;
                String UserId = DeviceEventsUtilsZoom.UserId;

                String roleid = DeviceEventsUtilsZoom.roleid;
                String companyFeatureid = DeviceEventsUtilsZoom.companyFeatureid;


                data2 = new JSONObject();
                data2.put("username", username);
                data2.put("u_c", u_c);
                data2.put("appid", appid);
                data2.put("user_id", UserId);
                data2.put("Role_Id", roleid);
                data2.put("Company_Feature_Id", companyFeatureid);
                data2.put("matchId", "0");

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

                Log.d("##WEBSERVICE1", webMethod);

                if (!auth1.equalsIgnoreCase("")) {

                    Response response = okHttpClient.newCall(request).execute();
                    Log.d("##WEBSERVICE2", response.toString());
                    try {
                        jsonResponse = response.body().string();
                        jsonResponse = jsonResponse.replaceAll("(\r\n|\n)", "");
//                        after_response(jsonResponse, webMethod);
                    } catch (Exception e) {
                        //e.printStackTrace()();
                        return null;
                    }
                    if (response.code() != 200) {
                        return null;
                    }
                } else {
                    return null;
                }

            } catch (IllegalArgumentException e) {
                e.getMessage();
                return null;
            } catch (Exception e) {
                e.getMessage();
                return null;
            } finally {
//       TrafficStats.clearThreadStatsTag();
            }
//        }
        }
        return jsonResponse;
    }

}
