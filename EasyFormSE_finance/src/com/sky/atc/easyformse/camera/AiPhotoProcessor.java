package com.sky.atc.easyformse.camera;
import android.content.*;
import android.graphics.*;
import android.util.Base64;
import android.util.Log;
import com.google.gson.*;
import com.sky.atc.easyformse.*;
import com.sky.atc.easyformse.upload.UploadUtils;
import net.sqlcipher.Cursor;
import net.sqlcipher.database.SQLiteDatabase;
import org.json.*;
import java.io.*;
import java.util.*;

/** Owns a single immutable photo request without retaining a camera Activity. */
public final class AiPhotoProcessor {
    private final Context context;
    private final JSONObject request;
    private final SQLiteDatabase database;
    private Bitmap selectedBitmap;
    private String quality,modelname,promttext,photo_path,Pname;
    private String companyId,site_id,sId,queId,checksheetid,stepNo,phId,thPath,type,itId,Client_Primary_Key,WCFURL;
    private int company_id;
    private final String METHOD_NAME_corner="PhotoAIMaster",mimtypeforapi="image/jpeg";
    public AiPhotoProcessor(Context context, JSONObject request) throws JSONException {
        this.context=context.getApplicationContext(); this.request=new JSONObject(request.toString());
        database=sqlitewraper.getDatabase(); WCFURL=context.getString(R.string.WCFURL);
    }
    public static JSONObject request(Intent capture, String path) throws JSONException {
        JSONObject request = new JSONObject().put("photo_path", path);
        for (String name : new String[]{"quality", "modelname", "prompttext", "flowData"}) request.put(name, capture.getStringExtra(name));
        return request;
    }
    public JSONArray process() throws Exception {
        try {
            photo_path=request.getString("photo_path"); Pname=new File(photo_path).getName();
            quality=request.optString("quality","90");
            modelname=request.optString("modelname",""); if(modelname.isEmpty()) modelname="gemini-2.5-flash";
            promttext=request.optString("prompttext","");
            JSONObject flow=new JSONArray(request.getString("flowData")).getJSONObject(0);
            companyId=flow.getString("company_id"); site_id=flow.getString("site_id"); sId=flow.getString("sid");
            queId=flow.getString("que_id"); checksheetid=flow.getString("checksheetid"); stepNo=flow.getString("step_No");
            phId=flow.getString("Ph_id"); thPath=flow.getString("th_path"); type=flow.getString("type"); itId=flow.getString("it_id");
            String userId;
            try(Cursor cursor=database.rawQuery("SELECT company_id,user_id FROM Login_Master",null)) {
                if(!cursor.moveToLast()) throw new IOException("Please sign in again.");
                company_id=cursor.getInt(0); userId=cursor.getString(1);
            }
            Client_Primary_Key=checksheetid+"_"+queId+"_"+userId+"_"+System.currentTimeMillis();
            Bitmap upright=CameraImages.orient(BitmapFactory.decodeFile(photo_path),new File(photo_path));
            int[] fit=CameraGeometry.fit(640,480,upright.getWidth(),upright.getHeight(),0);
            selectedBitmap=Bitmap.createScaledBitmap(upright,fit[0],fit[1],true); if(selectedBitmap!=upright) upright.recycle();
            int id=UploadUtils.uploadPhotoResumable(photo_path,companyId,"0",checksheetid,queId,stepNo,type,phId,itId,thPath,sId);
            if(id<=0) throw new IOException("The photo could not be uploaded. Please try again.");
            String result = validationText(Geminiapi(promttext, mimtypeforapi, modelname, bitmapToBase64(selectedBitmap), id));
            saveDetectionImage(result);
            return photoResult(result, id);
        } finally { if(selectedBitmap!=null) selectedBitmap.recycle(); }
    }
    private JSONArray photoResult(String result,int photoId) throws JSONException, IOException {
        insert_p_master(result);
        JSONObject photo=new JSONObject(); photo.put("photo_path",photo_path); photo.put("responsetext",result);
        photo.put("photo_id",photoId); photo.put("photo_size",UploadUtils.getFileSize(new File(photo_path).length()));
        photo.put("attempt",getPMasterCount());
        com.sky.atc.easyformse.datautils.MySharedPreferences prefs=sqlitewraper.getSecureShared("MyPref");
        prefs.putString("photo_path",photo_path); prefs.commit();
        return new JSONArray().put(photo);
    }
    // Server errors are distinct from a completed AI decision, including FAIL.
    static String validationText(String reply) throws IOException {
        if (reply == null || reply.trim().isEmpty()) throw new IOException("AI did not return a result. Please try again.");
        try {
            Object value = new JSONTokener(reply.trim()).nextValue();
            if (value instanceof String) value = new JSONTokener(((String)value).trim()).nextValue();
            if (value instanceof JSONArray && ((JSONArray)value).length() == 1) value = ((JSONArray)value).get(0);
            if (!(value instanceof JSONObject)) throw new IOException("AI returned an unreadable result. Please try again.");
            JSONObject envelope = (JSONObject)value;
            if (envelope.has("status") || envelope.has("Status")) {
                String message = envelope.optString("message", envelope.optString("Message", ""));
                throw new IOException(message.trim().isEmpty() ? "AI could not process this photo. Please try again." : message);
            }
            if (envelope.has("error")) {
                JSONObject error = envelope.optJSONObject("error");
                throw new IOException(error == null ? "AI could not process this photo. Please try again." : error.optString("message", "AI could not process this photo. Please try again."));
            }
            JSONArray candidates = envelope.optJSONArray("candidates");
            JSONObject candidate = candidates == null ? null : candidates.optJSONObject(0);
            JSONObject content = candidate == null ? null : candidate.optJSONObject("content");
            JSONArray parts = content == null ? null : content.optJSONArray("parts");
            StringBuilder text = new StringBuilder();
            if (parts != null) for (int i = 0; i < parts.length(); i++) {
                JSONObject part = parts.optJSONObject(i);
                if (part != null && !part.optBoolean("thought", false)) text.append(part.optString("text", ""));
            }
            String result = text.toString().trim().replaceFirst("(?i)^```(?:json)?\\s*", "").replaceFirst("\\s*```$", "").trim();
            if (result.isEmpty()) throw new IOException("AI did not return a usable result. Please try again.");
            if (result.startsWith("{")) return new JSONObject(result).toString();
            if (result.startsWith("[")) return new JSONArray(result).toString();
            return result;
        } catch (JSONException error) { throw new IOException("AI returned an unreadable result. Please try again.", error); }
    }
    private String bitmapToBase64(Bitmap bitmap) {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        bitmap.compress(Bitmap.CompressFormat.JPEG, Integer.parseInt(quality), output);
        return Base64.encodeToString(output.toByteArray(), Base64.NO_WRAP);
    }
    private void saveDetectionImage(String result) {
        if (!result.startsWith("{") && !result.startsWith("[")) return;
        Bitmap annotated = null; File output = null;
        try {
            Object detections = new JSONTokener(result).nextValue();
            annotated = selectedBitmap.copy(Bitmap.Config.ARGB_8888, true);
            Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG); paint.setColor(Color.RED);
            paint.setStyle(Paint.Style.STROKE); paint.setStrokeWidth(5);
            if (!drawDetections(detections, new Canvas(annotated), annotated, paint, 0)) return;
            File folder = context.getExternalFilesDir("ai_photos");
            if (folder == null) folder = new File(context.getFilesDir(), "ai_photos");
            if (!folder.isDirectory() && !folder.mkdirs()) throw new IOException("Unable to create photo folder");
            output = File.createTempFile("AI_", ".jpeg", folder);
            try (OutputStream stream = new FileOutputStream(output)) {
                if (!annotated.compress(Bitmap.CompressFormat.JPEG, 100, stream)) throw new IOException("Unable to encode photo");
            }
            photo_path = output.getAbsolutePath(); Pname = output.getName(); output = null;
        } catch (Exception error) {
            // An optional box must never discard the uploaded image or server decision.
            Log.w("AIPhoto", "Using captured image; detection overlay could not be saved", error);
        } finally { if (annotated != null) annotated.recycle(); if (output != null) output.delete(); }
    }
    private boolean drawDetections(Object value, Canvas canvas, Bitmap bitmap, Paint paint, int depth) throws JSONException {
        if (depth > 8) return false;
        boolean drawn = false;
        if (value instanceof JSONObject) {
            JSONObject object = (JSONObject)value;
            JSONArray box = object.optJSONArray("Box");
            if ("PASS".equalsIgnoreCase(object.optString("Result")) && box != null && box.length() == 4) {
                double top = box.optDouble(0), left = box.optDouble(1), bottom = box.optDouble(2), right = box.optDouble(3);
                if (top >= 0 && left >= 0 && bottom <= 1000 && right <= 1000 && bottom > top && right > left) {
                    canvas.drawRect((float)(left * bitmap.getWidth()/1000), (float)(top * bitmap.getHeight()/1000),
                            (float)(right * bitmap.getWidth()/1000), (float)(bottom * bitmap.getHeight()/1000), paint); drawn = true;
                }
            }
            Iterator<String> keys = object.keys();
            while (keys.hasNext()) drawn |= drawDetections(object.get(keys.next()), canvas, bitmap, paint, depth + 1);
        } else if (value instanceof JSONArray) {
            JSONArray array = (JSONArray)value;
            for (int i = 0; i < array.length(); i++) drawn |= drawDetections(array.get(i), canvas, bitmap, paint, depth + 1);
        } else if (value instanceof String) {
            String text = ((String)value).trim();
            if (text.startsWith("{") || text.startsWith("[")) {
                try { drawn = drawDetections(new JSONTokener(text).nextValue(), canvas, bitmap, paint, depth + 1); }
                catch (JSONException ignored) { }
            }
        }
        return drawn;
    }

    public String Geminiapi(String promttext, String mimtypeforapi, String modelname,String base64Image,int photoId) {

        String restext = null;
        try {
            Map<String, Object> requestMap = new HashMap<>();

            requestMap.put("Photo_Id", String.valueOf(photoId));
            requestMap.put("Client_Primary_Key",Client_Primary_Key);
            requestMap.put("Task_Id",sId);
            requestMap.put("Checksheet_Id",checksheetid);
            requestMap.put("Que_Id",queId);
            requestMap.put("ModelName",modelname);
            requestMap.put("Company_id",company_id);

            requestMap.put("contents", List.of(
                    Map.of(
                            "role", "user",
                            "parts", List.of(
                                    Map.of("text", promttext),
                                    Map.of("inlineData", Map.of(
                                            "mimeType", mimtypeforapi,
                                            "data", base64Image
                                    ))
                            )
                    )
            ));

            if (modelname != null &&
                    !modelname.toLowerCase().startsWith("gemini-2")) {

                requestMap.put("generationConfig",
                        Map.of(
                                "thinkingConfig",
                                Map.of("thinkingLevel", "MINIMAL")
                        )
                );
            }
            JSONObject jsonObject = new JSONObject(new Gson().toJson(requestMap));

            restext = NewWebservicesCallEasyform.ExecuteNetworkHTTPPostRequestForGemini( jsonObject, WCFURL, METHOD_NAME_corner);

        } catch (Exception e) {
            e.printStackTrace();
        }
        return restext;
    }

    private void insert_p_master(String ai_response) throws IOException
    {
            int tid = gettid(sId);

            ContentValues PMasterValues = new ContentValues();
            PMasterValues.put("tid", tid);
            PMasterValues.put("checksheetid", checksheetid);
            PMasterValues.put("p_name", Pname);
            PMasterValues.put("p_url", photo_path);
            PMasterValues.put("millisecond", System.currentTimeMillis());
            PMasterValues.put("p_key", stepNo);
            PMasterValues.put("p_value", "image");
            PMasterValues.put("p_type", "image/jpg");
            PMasterValues.put("Ph_id", phId);
            PMasterValues.put("it_id", itId);
            PMasterValues.put("que_name", "Ai Photo");
            PMasterValues.put("que_id", queId);
            PMasterValues.put("match_temp_id","0");
            PMasterValues.put("flag", "1");
            PMasterValues.put("ai_photo_response",ai_response);
            if (database.insert("p_master", null, PMasterValues) < 0)
                throw new IOException("The photo could not be saved. Please try again.");
    }

    private int gettid(String serverTaskId) {
        try (Cursor cursor = database.rawQuery("SELECT tid FROM task_master WHERE server_task_id=?",new String[]{serverTaskId})) {
            return cursor.moveToFirst() ? cursor.getInt(0) : 0;
        }
    }
    private int getPMasterCount() {
        try (Cursor cursor=database.rawQuery("SELECT count(*) FROM p_master WHERE tid=? AND checksheetid=? AND p_key=? AND que_id=? AND Ph_id=? AND it_id=?",
                new String[]{String.valueOf(gettid(sId)),checksheetid,stepNo,queId,phId,itId})) {
            return cursor.moveToFirst() ? cursor.getInt(0) : 0;
        }
    }

}
