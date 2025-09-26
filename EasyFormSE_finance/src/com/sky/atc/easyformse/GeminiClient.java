package com.sky.atc.easyformse;

import android.widget.Toast;

import com.google.gson.Gson;

import net.sqlcipher.Cursor;
import net.sqlcipher.database.SQLiteDatabase;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;

public class GeminiClient {
    static SQLiteDatabase database;
//    private static final String API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyBklsrY31wUPmy1ZBg642ui-d0IGuuCI8M";
    private static String API_URL;
    private static final String WCFURL = sqlitewraper.context.getResources().getString(R.string.WCFURL);
    private static final String METHOD_NAME_corner = "Select_url_from_Modelname";
    public static void sendPrompt(String prompt, String base64Image,String modelname,String mimtype, Callback callback) {

        try {
            String restext = null;
            JSONObject data1 = new JSONObject();
            database = sqlitewraper.getDatabase();
            Cursor c3 = database.rawQuery(
                    "SELECT appid,company_Id FROM Login_Master", null);
            c3.moveToFirst();
            String appid;
            String company_Id;
            int count = c3.getCount();
            try{
                if (count > 0) {
                    appid = c3.getString(0);
                    company_Id = c3.getString(1);


                    data1.put("Company_id",company_Id);

                }
            }catch (Exception e){
                e.printStackTrace();
            }
            c3.close();

            data1.put("model_name",modelname);

            restext = NewWebservicesCallEasyform.ExecuteNetworkHTTPPostRequest(data1, WCFURL, METHOD_NAME_corner);

            if(restext != null) {
                String status = null;
                String message = null;
                JSONObject jsonObject = null;
                JSONArray jsonArray1 = new JSONArray(restext);
                for (int k = 0; k < jsonArray1.length(); k++) {
                    jsonObject = jsonArray1.getJSONObject(0);
                    status = jsonObject.getString("status");
                    message = jsonObject.getString("message");
                }

                if (status.equalsIgnoreCase("1")) {

                    String data = jsonObject.getString("data");
                    JSONArray jsonArray = new JSONArray(data);

                    for (int j = 0; j < jsonArray.length(); j++) {

                        JSONObject jsonObject1 = jsonArray.getJSONObject(j);
                        API_URL = jsonObject1.getString("URL");
                    }

//                    OkHttpClient client = new OkHttpClient();
                    OkHttpClient client = new OkHttpClient.Builder()
                            .connectTimeout(60, TimeUnit.SECONDS)
                            .writeTimeout(60, TimeUnit.SECONDS)
                            .readTimeout(90, TimeUnit.SECONDS)
                            .build();

                    String json = new Gson().toJson(Map.of(
                            "contents", List.of(Map.of(
                                    "role", "user",
                                    "parts", List.of(
                                            Map.of("text", prompt),
                                            Map.of("inlineData", Map.of(
                                                    "mimeType", mimtype,
                                                    "data", base64Image
                                            ))
                                    )
                            ))
                    ));

                    RequestBody body = RequestBody.create(json, MediaType.parse("application/json"));
                    Request request = new Request.Builder().url(API_URL).post(body).build();

                    client.newCall(request).enqueue(callback);
                }
                else {
                    Toast.makeText(CameraAITextActivity.mCameraAITextActivity, message, Toast.LENGTH_SHORT).show();
                    CameraAITextActivity.mCameraAITextActivity.finish();
                }

            }
            else {
                Toast.makeText(CameraAITextActivity.mCameraAITextActivity, METHOD_NAME_corner + "Request : " + data1  +  "\n Response getting null", Toast.LENGTH_SHORT).show();
                CameraAITextActivity.mCameraAITextActivity.finish();
            }
        }

        catch (Exception e)
        {

        }



    }
}
