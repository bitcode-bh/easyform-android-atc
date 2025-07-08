package com.sky.atc.easyformse.azurevision;

import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.os.StrictMode;
import android.util.Log;

import com.sky.atc.easyformse.B_new;
import com.sky.atc.easyformse.R;
import com.sky.atc.easyformse.azurevision.tflite.Classifier;
import com.sky.atc.easyformse.azurevision.tflite.RectangleData;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.sqlitewraper;
import com.sky.atc.easyformse.utils.LogUtils;

import net.sqlcipher.database.SQLiteDatabase;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.TimeUnit;

import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

//Utils Azure calling
public class ComputerVisionDetection {

    OkHttpClient okHttpClient = getOkhttpClient();
    private final static String API_KEY = "7cd4bc8d7eb64ff0a113d22b1c0bf30f";
    public JSONArray linesBoundingBoxArray;
    public ArrayList<JSONArray> listOflines;
    private OkHttpClient getOkhttpClient() {
        return new OkHttpClient()
                .newBuilder()
                .connectTimeout(1, TimeUnit.MINUTES)
                .writeTimeout(1, TimeUnit.MINUTES)
                .readTimeout(1, TimeUnit.MINUTES)
                .build();
    }
    private static Bitmap lastFinalBitmap;
    public static Classifier detector;
    public static final int TF_OD_API_INPUT_SIZE = 512;
    public static final boolean TF_OD_API_IS_QUANTIZED = true;
    public static final String TF_OD_API_MODEL_FILE = "detnew.tflite";
    public static final String TF_OD_API_LABELS_FILE = "file:///android_asset/labnew.txt";

    private static final String OCR = sqlitewraper.context.getResources().getString(R.string.OCR);
    private static final String TEXT_READING = "TextReadingApi";
    private static final String TEXT_READING_SECOND = "TextReading_SecondUrlCall";
    private static final String TEXT_READING_SEVEN_SEGMENT = "TextReading_SevensegmentApi";


    //Second API call for Text
    public String getImageText(String appURl) throws IOException, JSONException {

        StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
        StrictMode.setThreadPolicy(policy);

        Request request = new Request.Builder()
                .header("Content-Type", "application/octet-stream")
                .header("Ocp-Apim-Subscription-Key", API_KEY)
                .url(appURl)
                .build();
        Response response = okHttpClient.newCall(request).execute();
        String responseString = response.body().string();

        JSONObject jsonObject = new JSONObject(responseString);

        Log.d("##COMPUTER_RESONSE", responseString);

        String status;
        try {
            status = jsonObject.getString("status");
        } catch (Exception e) {
            status = "Something goes wrong";
            e.printStackTrace();
        }
        if (status.equalsIgnoreCase("running")) {
            return "running";
        } else {
            return getStringFromJson(responseString);
        }
    }

    private String getStringFromJson(String responseString) throws JSONException {

        String finalString = "";
        JSONObject mainObject = new JSONObject(responseString);
        String anaLyzedString = mainObject.getString("analyzeResult");
        JSONObject analyzeResultObject = new JSONObject(anaLyzedString);

        JSONArray analyzeResultArray = analyzeResultObject.getJSONArray("readResults");

        for (int i = 0; i < analyzeResultArray.length(); i++) {

            JSONObject readResultsObject = analyzeResultArray.getJSONObject(i);
            JSONArray linesArray = readResultsObject.getJSONArray("lines");

            listOflines = new ArrayList<>();


            for (int j = 0; j < linesArray.length(); j++) {
                JSONObject linesObject = linesArray.getJSONObject(j);
                JSONArray wordsArray = linesObject.getJSONArray("words");


                for (int k = 0; k < wordsArray.length(); k++) {
                    JSONObject wordsObject = wordsArray.getJSONObject(k);
                    String textKey = wordsObject.getString("text");
                    finalString = finalString + " " + textKey;

                    linesBoundingBoxArray = wordsObject.getJSONArray("boundingBox");
                    listOflines.add(linesBoundingBoxArray);
                }
                finalString = finalString + "\n";

                //for Bounding box new code
//                linesBoundingBoxArray = linesObject.getJSONArray("boundingBox");
//                listOflines.add(linesBoundingBoxArray);

//              drawLineToCanvas(linesBoundingBoxArray);

            }
        }
        return finalString;
    }

    public String gettfLiteDetection(Bitmap croppedBitmap) {

        int cropSize = 512;

        StringBuilder finalString;
        try {

            final List<Classifier.Recognition> results = detector.recognizeImage(croppedBitmap);

            ArrayList<RectangleData> rectFS = new ArrayList<>();

            for (int i = 0; i < results.size(); i++) {

                RectF rectF = results.get(i).getLocation();
                String detectedText = results.get(i).getTitle();
                float confidencePercentage = results.get(i).getConfidence();

                Log.d("##RECTFS_COFIDENCE", confidencePercentage + " :Lable: " + results.get(i).getTitle());

                if (confidencePercentage > 0.5f) {
                    RectangleData rectangleData = new RectangleData(rectF.left, rectF.top, rectF.right, rectF.bottom, detectedText);
                    Log.d("##RECTFS_SIZE_1", "" + "LEFT: " + rectF.left + " RIGHT: " + rectF.right + " BOTTOM: " + rectF.bottom + " TOP:" + rectF.top);
                    rectFS.add(rectangleData);
                    rectangeOnImage(croppedBitmap, rectangleData);
                }
            }
            Log.d("##RECTFS_SIZE", String.valueOf(rectFS.size()));

            Collections.sort(rectFS, new Comparator<RectangleData>() {
                @Override
                public int compare(RectangleData rectangleData, RectangleData t1) {
                    return Float.compare(rectangleData.getLeft(), t1.getLeft());
                }
            });
            finalString = new StringBuilder();
            for (int i = 0; i < rectFS.size(); i++) {
                Log.d("##RECT_AFTER", String.valueOf(rectFS.get(i).getLeft()) + " :" + rectFS.get(i).getDetectedText());
                finalString.append(rectFS.get(i).getDetectedText());
            }

        } catch (Exception e) {
            e.printStackTrace();
            return "";
        }
        return finalString.toString();
    }


    private void rectangeOnImage(Bitmap bmp, RectangleData rectangleData) {

        Canvas canvas = new Canvas(bmp);

        Paint paint = new Paint();
        paint.setAlpha(0xA0); // the transparency
        paint.setColor(Color.WHITE); // color is red
        paint.setStyle(Paint.Style.STROKE); // stroke or fill or ...
        paint.setStrokeWidth(3);
        paint.setTextSize(40);


        RectF r = new RectF(rectangleData.getLeft(), rectangleData.getTop(), rectangleData.getRight(), rectangleData.getBottom());
        canvas.drawRect(r, paint);
        canvas.drawText(rectangleData.getDetectedText(), r.left, r.top, paint); //x=300,y=300

    }


    private void drawLineToCanvas(JSONArray linesBoundingBoxArray) {

        try {

            Canvas canvas = new Canvas(lastFinalBitmap);

            Paint paint = new Paint();
            paint.setAlpha(0xA0); // the transparency
            paint.setColor(Color.WHITE); // color is white
            paint.setStyle(Paint.Style.STROKE); // stroke or fill or ...
            paint.setStrokeWidth(3);
            paint.setTextSize(40);

            int leftX = linesBoundingBoxArray.getInt(0);
            int leftY = linesBoundingBoxArray.getInt(1);
            int rightX = linesBoundingBoxArray.getInt(2);
            int rightY = linesBoundingBoxArray.getInt(3);


            canvas.drawLine(leftX, leftY, rightX, rightY, paint);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }


    public static Bitmap resizeBitmapImageForFitSquare(Bitmap image, int maxResolution) {

        if (maxResolution <= 0)
            return image;

        int width = image.getWidth();
        int height = image.getHeight();
        float ratio = (width >= height) ? (float) maxResolution / width : (float) maxResolution / height;

        int finalWidth = (int) ((float) width * ratio);
        int finalHeight = (int) ((float) height * ratio);

        image = Bitmap.createScaledBitmap(image, finalWidth, finalHeight, true);

        if (image.getWidth() == image.getHeight())
            return image;
        else {
            //fit height and width
            int left = 0;
            int top = 0;

            if (image.getWidth() != maxResolution)
                left = (maxResolution - image.getWidth()) / 2;

            if (image.getHeight() != maxResolution)
                top = (maxResolution - image.getHeight()) / 2;

            Bitmap bitmap = Bitmap.createBitmap(maxResolution, maxResolution, Bitmap.Config.ARGB_8888);
            Canvas canvas = new Canvas(bitmap);
            canvas.drawBitmap(image, left, top, null);
            canvas.save();
            canvas.restore();

            return bitmap;
        }
    }

    //Easyform First API call
    public String computervisionReqEasyform(Bitmap bitmap, String uniqueCode) throws IOException, JSONException {


        StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
        StrictMode.setThreadPolicy(policy);


        lastFinalBitmap = bitmap;


        SQLiteDatabase database;
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


        JSONObject data2 = new JSONObject();
        data2.put("username", username);
        data2.put("u_c", u_c);
        data2.put("appid", appid);
        data2.put("user_id", UserId);
        data2.put("Role_Id", roleid);
        data2.put("Company_Feature_Id", companyFeatureid);
        data2.put("matchId", "0");

        String auth1 = data2.toString();


        //String appUrl = "https://development.easyform.in/coreapi/api/TextReadingApi";
        String appUrl = OCR + TEXT_READING;


        ByteArrayOutputStream stream = new ByteArrayOutputStream();
        bitmap.compress(Bitmap.CompressFormat.JPEG, 100, stream);
        byte[] byteArray = stream.toByteArray();


        OkHttpClient client = new OkHttpClient().newBuilder()
                .connectTimeout(1, TimeUnit.MINUTES)
                .writeTimeout(1, TimeUnit.MINUTES)
                .readTimeout(1, TimeUnit.MINUTES)
                .build();
        MediaType mediaType = MediaType.parse("text/plain");
        RequestBody body = new MultipartBody.Builder().setType(MultipartBody.FORM)
                .addFormDataPart("taskid", AzureUtils.serverTaskId)
                .addFormDataPart("checksheetid", AzureUtils.checksheetID)
                .addFormDataPart("Unique_id", uniqueCode)
                .addFormDataPart("queid", AzureUtils.questionID)
                .addFormDataPart("imagedata", "meter.PNG",
                        RequestBody.create(MediaType.parse("application/octet-stream"), byteArray))
                .build();
        Request request = new Request.Builder()
                .url(appUrl)
                .method("POST", body)
                .addHeader("auth1", auth1)
                .addHeader("Company_Feature_Id", companyFeatureid)
                .addHeader("Role_id", roleid)
                .addHeader("match_temp_id", "0")
                .build();
        Response response = client.newCall(request).execute();
        String responseString = response.body().string();
        Log.d("##RESPONSE_EASY", responseString);
        writeLogToFile(responseString, "computervisionReqEasyform");
        return responseString;
      /*  JSONArray jsonArray = new JSONArray(responseString);
        JSONObject jsonObject = jsonArray.getJSONObject(0);
        String status = jsonObject.getString("status");

        String secondUrl;
        if (status.equalsIgnoreCase("1")) {
            secondUrl = jsonObject.getString("data");
        } else {
            secondUrl = jsonObject.getString("data");
        }
        return secondUrl;*/
    }


    //Second API TEXT recognition
    public String getImageTextEasyform(String secondUrl) throws IOException, JSONException {


        StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
        StrictMode.setThreadPolicy(policy);

        // String appURl = "https://development.easyform.in/coreapi/api/TextReading_SecondUrlCall";
        String appURl = OCR + TEXT_READING_SECOND;
        JSONArray mainArray = new JSONArray();
        JSONObject jsonDataObj = new JSONObject();
        jsonDataObj.put("taskid", AzureUtils.serverTaskId);
        jsonDataObj.put("checksheetid", AzureUtils.checksheetID);
        jsonDataObj.put("queid", AzureUtils.questionID);
        jsonDataObj.put("secondurl", secondUrl);
        mainArray.put(jsonDataObj);


        SQLiteDatabase database;
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


        JSONObject data2 = new JSONObject();
        data2.put("username", username);
        data2.put("u_c", u_c);
        data2.put("appid", appid);
        data2.put("user_id", UserId);
        data2.put("Role_Id", roleid);
        data2.put("Company_Feature_Id", companyFeatureid);
        data2.put("matchId", "0");

        String auth1 = data2.toString();

        OkHttpClient client = new OkHttpClient().newBuilder()
                .build();
        MediaType mediaType = MediaType.parse("application/json");
        RequestBody body = RequestBody.create(mediaType, mainArray.toString());

        Request request = new Request.Builder()
                .url(appURl)
                .method("POST", body)
                .addHeader("auth1", auth1)
                .addHeader("Company_Feature_Id", companyFeatureid)
                .addHeader("Role_id", roleid)
                .addHeader("match_temp_id", "0")
                .addHeader("Content-Type", "application/json")
                .build();

        Response response = client.newCall(request).execute();
        String responseString = response.body().string();
        Log.d("##RESPONSE_EASY", " getImageTextEasyform => " + responseString);
        JSONArray jsonArray = new JSONArray(responseString);
        JSONObject jsonObj = jsonArray.getJSONObject(0);

        String statusRe = jsonObj.getString("status");
        if (statusRe.equalsIgnoreCase("1")) {

            String dataString = jsonObj.getString("data");

            JSONObject jsonObject = new JSONObject(dataString);

            Log.d("##COMPUTER_RESONSE", responseString);

            String status;
            try {
                status = jsonObject.getString("status");
            } catch (Exception e) {
                status = "Something goes wrong";
                e.printStackTrace();
            }
            if (status.equalsIgnoreCase("running")) {
                return "running";
            } else {
                return getStringFromJson(dataString);
            }
        } else {
            return "0";
        }
    }

    //Seven segment API call for Easy_form API
    public String computerVision7SegReqEasyform(Bitmap bitmap, String uniqueCode) throws IOException, JSONException {

        StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
        StrictMode.setThreadPolicy(policy);


        SQLiteDatabase database;
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


        JSONObject data2 = new JSONObject();
        data2.put("username", username);
        data2.put("u_c", u_c);
        data2.put("appid", appid);
        data2.put("user_id", UserId);
        data2.put("Role_Id", roleid);
        data2.put("Company_Feature_Id", companyFeatureid);
        data2.put("matchId", "0");

        String auth1 = data2.toString();

        //String appURl = "https://development.easyform.in/coreapi/api/TextReading_SevensegmentApi";
        String appURl = OCR + TEXT_READING_SEVEN_SEGMENT;

        ByteArrayOutputStream stream = new ByteArrayOutputStream();
        bitmap.compress(Bitmap.CompressFormat.JPEG, 100, stream);
        byte[] byteArray = stream.toByteArray();


        OkHttpClient client = new OkHttpClient().newBuilder()
                .build();
        MediaType mediaType = MediaType.parse("text/plain");
        RequestBody body = new MultipartBody.Builder().setType(MultipartBody.FORM)
                .addFormDataPart("taskid", AzureUtils.serverTaskId)
                .addFormDataPart("checksheetid", AzureUtils.checksheetID)
                .addFormDataPart("queid", AzureUtils.questionID)
                .addFormDataPart("Unique_id", uniqueCode)
                .addFormDataPart("imagedata", "meter.PNG",
                        RequestBody.create(MediaType.parse("application/octet-stream"), byteArray))
                .build();
        Request request = new Request.Builder()
                .url(appURl)
                .method("POST", body)
                .addHeader("auth1", auth1)
                .addHeader("Company_Feature_Id", companyFeatureid)
                .addHeader("Role_id", roleid)
                .addHeader("match_temp_id", "0")
                .build();
        Response response = client.newCall(request).execute();

        String responseString = response.body().string();
        writeLogToFile(responseString, "computerVision7SegReqEasyform");
        Log.d("##7SEG_RESPONSE", responseString);
        return responseString;
      /*  JSONArray jsonArray = new JSONArray(responseString);
        JSONObject jsonObject = jsonArray.getJSONObject(0);
        String status = jsonObject.getString("status");
        String dataString;
        if (status.equalsIgnoreCase("1")) {
            dataString = jsonObject.getString("data");
            return get7SegStringfromResponse(dataString, bitmap);
        } else {
            dataString = jsonObject.getString("data");
            dataString = "limit_exceed";
            return dataString;
        }*/
    }

    public static void writeLogToFile(String response, String method) {
        LogUtils.writeComputerVisionDetectionLogToFile(response, method);//ComputerVisionDetection
    }
}
