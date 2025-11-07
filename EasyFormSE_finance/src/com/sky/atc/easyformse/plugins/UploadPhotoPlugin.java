package com.sky.atc.easyformse.plugins;

import static com.sky.atc.easyformse.sqlitewraper.context;

import android.annotation.SuppressLint;
import android.app.AlertDialog;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.database.Cursor;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.widget.Toast;

import com.google.gson.Gson;
import com.sky.atc.easyformse.CameraAITextActivity;
import com.sky.atc.easyformse.CaptureSignature;
import com.sky.atc.easyformse.DeviceEventsUtils;
import com.sky.atc.easyformse.EditPhotoActivity;
import com.sky.atc.easyformse.FaceDetactionActivity;
import com.sky.atc.easyformse.MakePhotoActivity;
import com.sky.atc.easyformse.OnlySavPhotoAcivity;
import com.sky.atc.easyformse.VideoActivity;
import com.sky.atc.easyformse.attendance.newattendanceutils.AttendanceUtil;
import com.sky.atc.easyformse.attendance.newattendanceutils.broadcasts.AttendanceNotificationShow;
import com.sky.atc.easyformse.attendance.newattendanceutils.models.AttendanceData;
import com.sky.atc.easyformse.attendance.newattendanceutils.models.TaskData;
import com.sky.atc.easyformse.camera_new;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.sqlitewraper;
import com.sky.atc.easyformse.upload.UploadUtils;
import com.sky.atc.easyformse.upload_large_file;
import com.sky.atc.easyformse.utils.LogUtils;

import net.sqlcipher.database.SQLiteDatabase;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

import io.michaelrocks.paranoid.Obfuscate;

//upload customer photo online
@Obfuscate
public class UploadPhotoPlugin extends CordovaPlugin {

    private MySharedPreferences pref;
    private CallbackContext callbackContext;
    private String mobExt;
    private static String flowData;
    private boolean isPluginValid;
    private static String photoType;
    String info;
    String max_file_size;
    String allow_multiple_image;
    SQLiteDatabase database;

    String ModelName;
    String PromtText;
    public static UploadPhotoPlugin instance;
    String document_type;
    String GroupUrl ;
    List<String> downloadedPaths ;
    String url;
    String Photo_url;
    String attendanceData;
    String WithoutTaskAttendance;
    public static final String photoUrlKey = "photoUrlKey";
    public static final String photoNameKey = "photoNameKey";
    public static final String resultDataKey = "resultDataKey";
    public static final String WithoutTaskAttendanceKey = "WithoutTaskAttendanceKey";
    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {

        this.callbackContext = callbackContext;
        pref = sqlitewraper.getSecureShared("MyPref");
        database = sqlitewraper.getDatabase();
        //for Camera
        photoType = args.getJSONObject(0).getString("photo_type");
        flowData = args.getJSONObject(0).getString("flowParamData");

        String time = "";
        String b_write = "true";
        String width = "";
        String height = "";
        String quality = "100";
        String camera_type = "";
        String camera_edit = "1";
        String docpick = "";

        if (photoType.equalsIgnoreCase("camera")) {
            camera_new.isScanmode = false;
            camera_new.isburstMode = "false";
            camera_new.isCropMode = false;
            time = args.getJSONObject(0).getString("time");
            b_write = args.getJSONObject(0).getString("flag");
            width = args.getJSONObject(0).getString("width");
            height = args.getJSONObject(0).getString("height");
            quality = args.getJSONObject(0).getString("quality");
            camera_type = args.getJSONObject(0).getString("camera_type");
            camera_edit = args.getJSONObject(0).getString("camera_edit");


        }
        try {
            info = args.getJSONObject(0).getString("info");
//            if array null info string set blank
            if (info.equalsIgnoreCase("[]")) {
                info = "";
            }
        } catch (Exception e) {
            info = "";
        }

        try{
            max_file_size =args.getJSONObject(0).getString("max_file_size");
        }
        catch (Exception e)
        {
            max_file_size ="5";
        }

        try{
            allow_multiple_image = args.getJSONObject(0).getString("allow_multiple_image");
        }
        catch (Exception e)
        {
            allow_multiple_image = "false";
        }

        try {
            ModelName = args.getJSONObject(0).getString("model_name");
        } catch (Exception e) {
            ModelName = "";
        }

        try {
            PromtText = args.getJSONObject(0).getString("prompt_text");
        } catch (Exception e) {
            PromtText = "";
        }

        if (photoType.equalsIgnoreCase("browse")) {

            //For Browse file
            docpick = args.getJSONObject(0).getString("p");
            try {
                b_write = args.getJSONObject(0).getString("flag");
            } catch (Exception e) {
                b_write = "false";
            }

            try {
                if (docpick.equals("2")) {
                    if (args.getJSONObject(0).has("mob_ext")) {

                        mobExt = args.getJSONObject(0).getString("mob_ext");
                    } else {

                        mobExt = "";
                    }
                }
            } catch (Exception e) {

                Log.d("##Hi", "1");
            }
        }

        if (camera_type.equals("Native")) {
            camera_type = "0";
        } else {
            camera_type = "1";
        }
        if (camera_edit.equals("False")) {
            camera_edit = "0";
        } else {
            camera_edit = "1";
        }


//        photoType="video";

        if (photoType.equalsIgnoreCase("Attendance")) {
            try{
                Photo_url = args.getJSONObject(0).getString("photoUrl");
            }
            catch (Exception e)
            {
                Photo_url = "";
            }
            try{
//                    get key without task create attendance
                WithoutTaskAttendance = args.getJSONObject(0).getString("WithoutTaskAttendance");
            }
            catch (Exception e)
            {
                WithoutTaskAttendance = "true";
            }
            try{
                attendanceData = args.getJSONObject(0).getString("attendanceData");
            }
            catch (Exception e)
            {
                attendanceData = "";
            }
            isPluginValid = Facedetectioncmera(Photo_url,WithoutTaskAttendance,attendanceData);
        }
        if (photoType.equalsIgnoreCase("camera")) {
            isPluginValid = easydrawCamera(time, b_write, width, height, quality, action);
        }
        if (photoType.equalsIgnoreCase("browse")) {
            isPluginValid = bowrseFilefromstorage(b_write, "720", "1080", "0", docpick, "");
        }
        if (photoType.equalsIgnoreCase("signature")) {
            isPluginValid = captureSignature();
        }
        if (photoType.equalsIgnoreCase("video")) {
            isPluginValid = captureVideo();
        }
        if (photoType.equalsIgnoreCase("SafetyMeasure")) {
            isPluginValid = SafetyMeasure();
        }
        if (photoType.equalsIgnoreCase("AI")) {

            b_write = args.getJSONObject(0).getString("flag");
            width = args.getJSONObject(0).getString("width");
            height = args.getJSONObject(0).getString("height");
            quality = args.getJSONObject(0).getString("quality");

            isPluginValid = CameraAITextPlugin(time, b_write, width, height, quality, action,ModelName,PromtText);
        }

        if (photoType.equalsIgnoreCase("GroupAttendance")) {

            String photoUrl = args.getJSONObject(0).getString("photoUrl");

            if (photoUrl.equalsIgnoreCase(""))
            {
                GroupUrl = args.getJSONObject(0).getString("group_photoUrl");

                try {
                    JSONArray photoArray = new JSONArray(GroupUrl);
                    downloadedPaths = new ArrayList<>();
                    String realpath;
                    for (int i = 0; i < photoArray.length(); i++) {
                        url  = photoArray.getString(i);

                        Uri uri = Uri.parse(url);
                        realpath = uri.getPath();
                        realpath = realpath.replace("external_files", Environment.getExternalStorageDirectory().toString());

                        downloadedPaths.add(realpath);
                    }

                    isPluginValid = openFaceRecognizerActivity(context,downloadedPaths);
                }
                catch (Exception e)
                {
                    e.printStackTrace();
                }
            }
        }

        if(photoType.equalsIgnoreCase("PhotoEdit"))
        {
            String photoUrl = args.getJSONObject(0).getString("photo_path");
            isPluginValid = EditphotoActivity(photoUrl);
        }
        if (photoType.equalsIgnoreCase("DirectUpload")) {
            String photoUrl = args.getJSONObject(0).getString("photo_path");
            isPluginValid = DirectUpload(photoUrl);

        }
        return isPluginValid;
    }

    //online task listing camera with attendance (profile photo)
    public boolean Facedetectioncmera(String photoUrl,String withoutTaskAttendance,String attendanceData)
    {
        String Attendance = pref.getString("Attendance","false");
        if(Attendance.equalsIgnoreCase("false") || Attendance.equalsIgnoreCase("null"))
        {
            Toast.makeText(cordova.getActivity(), "Attendance Feature is not assign", Toast.LENGTH_SHORT).show();
        }
        else {

            if(photoUrl.equalsIgnoreCase(""))
            {
                AttendanceData mAttendanceData = AttendanceUtil.getAttendanceDataList().get(0);
                TaskData mTaskData = new TaskData();
                mTaskData.setCheckSheetId(mAttendanceData.getChecksheetId());
                mTaskData.setModuleName(mAttendanceData.getKey());
                mTaskData.setModuleId(Integer.parseInt(mAttendanceData.getFlowId()));
                mTaskData.setUserId(DeviceEventsUtils.getLoginDetails().get(0));
                mTaskData.setUsername(DeviceEventsUtils.getLoginDetails().get(3));
                mTaskData.setCheckOutBtn(mAttendanceData.getChekOutBtn());
                mTaskData.setCheckInBtn(mAttendanceData.getChekInBtn());
                mTaskData.setPunchin_Status(mAttendanceData.getPunchin_Status());
                mTaskData.setPunchout_Status(mAttendanceData.getPunchout_Status());

                mTaskData.getCheckSheetId();
                mTaskData.getModuleId();
                mTaskData.getModuleName();
                mTaskData.getUsername();
                mTaskData.getUserId();
                mTaskData.getCheckOutBtn();
                mTaskData.getCheckInBtn();
                mTaskData.getPunchin_Status();
                mTaskData.getPunchout_Status();

                Intent faceRecognizerActivityIntent = new Intent(this.cordova.getActivity(), FaceDetactionActivity.class);
                faceRecognizerActivityIntent.putExtra(AttendancePlugin.WithoutTaskAttendanceKey, "true");
                faceRecognizerActivityIntent.putExtra(AttendanceNotificationShow.taskDataKey, mTaskData);
                if (this.cordova != null) {
                    this.cordova.startActivityForResult(this, faceRecognizerActivityIntent, 102);
                    return true;
                }
            }
            else {

                TaskData mTaskData = new Gson().fromJson(attendanceData, TaskData.class);


                String photoName = mTaskData.getUserId() + System.currentTimeMillis() + ".jpeg";

                Intent faceRecognizerActivityIntent = new Intent(context, FaceDetactionActivity.class);
                faceRecognizerActivityIntent.putExtra(photoUrlKey, photoUrl);
                faceRecognizerActivityIntent.putExtra(photoNameKey, photoName);
                faceRecognizerActivityIntent.putExtra(WithoutTaskAttendanceKey,withoutTaskAttendance);
                faceRecognizerActivityIntent.putExtra(AttendanceNotificationShow.taskDataKey,
                        mTaskData);
                try {
                    this.cordova.startActivityForResult(this, faceRecognizerActivityIntent, 102);//null pointer check in case package name was not found
                    return true;
                } catch (Exception e) {
                    LogUtils.writeAttendanceLogToFile("Exception : " + e.toString(), "openFaceRecognizerActivity AttendancePlugin");
                    this.callbackContext.error("error: " + e.toString());
                    return false;
                }
            }





        }
        return false;
    }
    private boolean easydrawCamera(String time, String b_write, String width, String height, String quality, String action) {

        String time1 = pref.getString("time", "0");

        Long time_l = Long.valueOf(time);
        Long time1_l = Long.valueOf(time1);

        if ((!time.equalsIgnoreCase(time1)) && (time_l > time1_l + 3000)) {

            pref.putString("b_write", b_write); // Saving string
            pref.putString("time", time); // Saving string
            pref.commit();

            if (action.equals("anAction")) {
                Intent intent = new Intent(this.cordova.getActivity(),
                        MakePhotoActivity.class);

                intent.putExtra("width", width);
                intent.putExtra("height", height);
                intent.putExtra("quality", quality);
                intent.putExtra("info", info);
                intent.putExtra("max_file_size",max_file_size);
                if (this.cordova != null) {
                    this.cordova.startActivityForResult(this, intent, 102);
                    return true;
                }
            }
            return false;
        } else {

            pref.putString("time", time); // Saving string
            pref.commit();
        }
        return false;
    }


    private boolean bowrseFilefromstorage(String b_write, String width, String height, String quality, String docpick, String query) {


        Intent intent = new Intent(this.cordova.getActivity(), upload_large_file.class);
        intent.putExtra("jason", query);
        intent.putExtra("b_write", b_write);
        intent.putExtra("width", width);
        intent.putExtra("height", height);
        intent.putExtra("quality", quality);
        intent.putExtra("p", docpick);
        intent.putExtra("mob_ext", mobExt);
        intent.putExtra("info",info);
        intent.putExtra("max_file_size",max_file_size);
        intent.putExtra("allow_multiple_image",allow_multiple_image);
        if (this.cordova != null) {
            this.cordova.startActivityForResult(this, intent, 102);
            return true;
        }
        return false;
    }

    private boolean captureSignature() {

        Intent intent = new Intent(this.cordova.getActivity(),
                CaptureSignature.class);
        if (this.cordova != null) {
            this.cordova.startActivityForResult(this, intent, 102);
            return true;
        }

        return false;
    }

//
//    private boolean captureVideo() {
//
//        String imei = DeviceEventsUtils.getImei();
//        Intent i = new Intent("com.testapp.ws.new");
//        i.setPackage("life.knowledge4.videocroppersample");
//        i.putExtra("imei", imei);
//        i.putExtra("MINVideo", TimeUnit.SECONDS.convert(1, TimeUnit.SECONDS)); // change recoding setting 30 to 15 sec
//        i.putExtra("MAXVideo", TimeUnit.MILLISECONDS.convert(1, TimeUnit.MINUTES));// MILLISECONDS
//        i.putExtra("MAXVideoSize", 5L);// long and MB
//        if (this.cordova != null) {
//            this.cordova.startActivityForResult(this, i, 103);
//            return true;
//        }
//        return false;
//    }
//    call video module 9/02/2024
   private boolean captureVideo() {
       Cursor c3 = database.rawQuery(
               "SELECT username,u_c,company_id,imei FROM Login_Master",
               null);
       c3.moveToLast();
       int company_id = c3.getInt(2);
      String imei = c3.getString(3);
       c3.close();

       Intent i = new Intent(this.cordova.getActivity(), VideoActivity.class);
       i.putExtra("imei",imei);
       if (this.cordova != null) {
        this.cordova.startActivityForResult(this, i, 103);
        return true;
        }
    return false;
   }

    private boolean SafetyMeasure() {
        try {
            Intent SafetyMeasure = new Intent(sqlitewraper.context, Class.forName("com.easyform.safetymeasure.automlvision.AutoMlVisonModelActivity"));
            this.cordova.startActivityForResult(this, SafetyMeasure, 101);
            return true;
        } catch (Exception e) {
            Toast.makeText(this.cordova.getActivity(),"SafetyMeasure Module is Not Added",Toast.LENGTH_LONG).show();
            this.callbackContext.error("error: " + e.toString());
            return false;
        }
    }

    private boolean CameraAITextPlugin(String time, String b_write, String width, String height, String quality, String action,String modelname,String prompttext) {
//        pref.putString("b_write", b_write); // Saving string
//        pref.putString("time", time); // Saving string
//        pref.commit();

        Intent intent = new Intent(this.cordova.getActivity(),
                CameraAITextActivity.class);

        intent.putExtra("width", width);
        intent.putExtra("height", height);
        intent.putExtra("quality", quality);
        intent.putExtra("info", info);
        intent.putExtra("max_file_size",max_file_size);
        intent.putExtra("modelname",modelname);
        intent.putExtra("prompttext",prompttext);
        intent.putExtra("camera_type", photoType);
        intent.putExtra("AI_type", "Camera");
        if (this.cordova != null) {
            this.cordova.startActivityForResult(this, intent, 104);
            return true;
        }

        return false;
    }

    public boolean openFaceRecognizerActivity(Context context, List<String> filePaths) {

        try {
            Intent intent = new Intent(context, Class.forName("com.nareshchocha.facerecognition.ui.activitys.GroupFaceRecognizerActivity"));
            intent.putStringArrayListExtra("imageFilePathList", new ArrayList<>(filePaths));
            this.cordova.startActivityForResult(this, intent, 105);
            return true;
        } catch (Exception e) {
            LogUtils.writeAttendanceLogToFile("Exception : " + e.toString(), "openFaceRecognizerActivity GroupAttendancePlugin");
            this.callbackContext.error("error: " + e.toString());
            return false;
        }

    }

    public boolean EditphotoActivity(String photo_path)
    {
        try {
            Intent intent = new Intent(cordova.getActivity(), EditPhotoActivity.class);
            intent.putExtra("photo_path", photo_path);
            this.cordova.startActivityForResult(this, intent, 106);
            return true;
        } catch (Exception e) {
            this.callbackContext.error("error: " + e.toString());
            return false;
        }
    }

    public boolean DirectUpload(String photo_path)
    {
        try {
            Intent intent = new Intent(cordova.getActivity(), OnlySavPhotoAcivity.class);
            intent.putExtra("photo_path", photo_path);
            this.cordova.startActivityForResult(this, intent, 106);
            return true;
        } catch (Exception e) {
            this.callbackContext.error("error: " + e.toString());
            return false;
        }
    }

    private boolean isNetworkAvailable() {
        ConnectivityManager connectivityManager = (ConnectivityManager) sqlitewraper.context
                .getSystemService(Context.CONNECTIVITY_SERVICE);
        @SuppressLint("MissingPermission")
        NetworkInfo activeNetworkInfo = connectivityManager
                .getActiveNetworkInfo();
        return activeNetworkInfo != null && activeNetworkInfo.isConnected();
    }

    public void onActivityResult(int requestCode, int resultCode, Intent intent) {
        try {
            switch (requestCode) {
                case 102:
                    if (resultCode == android.app.Activity.RESULT_OK) {
                        String status = null;
                        Bundle bundle = intent.getExtras();

                        if (intent.getExtras().containsKey(AttendancePlugin.resultDataKey))
                        {
                            status = pref.getString("detectionFilePath", null);
                        }
                        else {
                            if (bundle != null) {
                                status = bundle.getString("status");
                            }
                        }

                        if (isNetworkAvailable()) {
                            new uploadphoto().execute(status, "102");
                        } else {
                            showAlertDialogWithMessage(status, "102");
                        }


                    } else {
//                    String message = intent.getStringExtra("result");
                        this.callbackContext.error("Fail");
                    }
                    break;

                case 103:
                    if (resultCode == android.app.Activity.RESULT_OK) {
                        String status = null;
                        String videopath = null;
                        Bundle bundle = intent.getExtras();
                        if (bundle != null) {
                            status = bundle.getString("status");
                        }

                        if (isNetworkAvailable()) {
                            new uploadphoto().execute(status, "103");
                        } else {
                            showAlertDialogWithMessage(status, "103");

                        }


                    } else {
//                    String message = intent.getStringExtra("result");
                        this.callbackContext.error("Fail");
                    }
                    break;
                case 101 :
                    if (resultCode == android.app.Activity.RESULT_OK) {
                        String status = null;
                        Bundle bundle = intent.getExtras();
                        if (bundle != null) {
//                            SharedPreferences sharedPreferences;
//                            sharedPreferences = this.cordova.getActivity().getSharedPreferences("SafetyMeasure",0);
//                            status = sharedPreferences.getString("photo_path", null);
                            status = bundle.getString("value");
                        }

                        if (isNetworkAvailable()) {
                            new uploadphoto().execute(status, "101");
                        } else {
                            showAlertDialogWithMessage(status, "101");

                        }


                    } else {
//                    String message = intent.getStringExtra("result");
                        this.callbackContext.error("Fail");
                    }
                    break;

                case 104:
                {
                    if (resultCode == android.app.Activity.RESULT_OK) {
                        String status = null;
                        String responsetxt = null;
                        Bundle bundle = intent.getExtras();
                        if (bundle != null) {
//                            SharedPreferences sharedPreferences;
//                            sharedPreferences = this.cordova.getActivity().getSharedPreferences("SafetyMeasure",0);
//                            status = sharedPreferences.getString("photo_path", null);
                            status = bundle.getString("response");

                        }

                        if (isNetworkAvailable()) {
                            new uploadphoto().execute(status, "104");
                        } else {
                            showAlertDialogWithMessage(status, "104");

                        }


                    } else {
//                    String message = intent.getStringExtra("result");
                        this.callbackContext.error("Fail");
                    }
                    break;
                }
                // for Group Attendance
                case 105:
                {
                    if (resultCode == android.app.Activity.RESULT_OK) {
                        String status = null;
                        Bundle bundle = intent.getExtras();
                        if (bundle != null) {
                            status = bundle.getString("detectionFilePath");
                        }

                        if (isNetworkAvailable()) {
                            new uploadphoto().execute(status, "105");
                        } else {
                            showAlertDialogWithMessage(status, "105");

                        }


                    } else {
                        this.callbackContext.error("Fail");
                    }
                    break;
                }

                case 106:
                {
                    if (resultCode == android.app.Activity.RESULT_OK) {
                        String status = null;
                        Bundle bundle = intent.getExtras();
                        if (bundle != null) {
                            status = bundle.getString("status");
                        }

                        if (isNetworkAvailable()) {
                            new uploadphoto().execute(status, "106");
                        } else {
                            showAlertDialogWithMessage(status, "106");

                        }


                    } else {
                        this.callbackContext.error("Fail");
                    }
                    break;
                }
                default:
                    break;
            }
        } catch (Exception e) {
            LogUtils.writeVideoCaptureLogToFile(" Exception ::: => " + e, "onActivityResult - UploadPhotoPlugin");
        }

    }

    private void showAlertDialogWithMessage(String filePath, String requestCode) {
        AlertDialog.Builder alertBuilder = new AlertDialog.Builder(cordova.getActivity());
        alertBuilder.setTitle("Internet Not Available");
        alertBuilder.setMessage("Please turn on the internet and Retry");
        alertBuilder.setCancelable(false);
        alertBuilder.setPositiveButton("Retry", (dialog, which) -> {
            dialog.dismiss();
            if (isNetworkAvailable()) {
                new uploadphoto().execute(filePath, requestCode);
            } else {
                showAlertDialogWithMessage(filePath, requestCode);
            }

        });
        alertBuilder.setNegativeButton("Cancel", (dialog, which) -> {
            UploadPhotoPlugin.this.callbackContext.error("Fail");
            dialog.dismiss();

        });
        alertBuilder.show();
    }

    @SuppressLint("StaticFieldLeak")
    private class uploadphoto extends AsyncTask<String, String, String> {
        @Override
        protected void onPreExecute() {
            super.onPreExecute();
        }


        @Override
        protected String doInBackground(String... strings) {
            int photoId;
            String videopath = "";
            String photopath = "";
            String WithHelmet ="";
            String reflective_jacket = "";
            String Hand_glows= "";
            String Safety_shoes ="";
            String Harness_jacket="";
            String status = strings[0];
            String caseid = strings[1];
            String responsetext = "";

            //In case of video status will contain json object so need to extract video path
            if (caseid.equalsIgnoreCase("103")) {
                try {
                    JSONArray jsonArray = new JSONArray(status);
                    JSONObject jsonObject = jsonArray.getJSONObject(0);
                    videopath = jsonObject.getString("video_path");
                } catch (JSONException e) {
                    e.printStackTrace();
                }

            }

            if (caseid.equalsIgnoreCase("101")) {
                try {
                    JSONArray jsonArray = new JSONArray(status);
                    JSONObject jsonObject = jsonArray.getJSONObject(0);
                    photopath = jsonObject.getString("photo_path");
                    if(jsonObject.has("Helmet"))
                    {
                        WithHelmet = jsonObject.getString("Helmet");
                    }
                    if(jsonObject.has("Harnessjacket"))
                    {
                        Harness_jacket = jsonObject.getString("Harnessjacket");
                    }
                    if(jsonObject.has("Handglows"))
                    {
                        Hand_glows = jsonObject.getString("Handglows");
                    }
                    if(jsonObject.has("Reflectivejacket"))
                    {
                        reflective_jacket = jsonObject.getString("Reflectivejacket");
                    }
                    if(jsonObject.has("Safetyshoes"))
                    {
                        Safety_shoes = jsonObject.getString("Safetyshoes");
                    }

                } catch (JSONException e) {
                    e.printStackTrace();
                }

            }

            if (caseid.equalsIgnoreCase("104"))
            {
                try {
                    JSONArray jsonArray = new JSONArray(status);
                    JSONObject jsonObject = jsonArray.getJSONObject(0);
                    photopath = jsonObject.getString("photo_path");
                    if(jsonObject.has("responsetext"))
                    {
                        responsetext = jsonObject.getString("responsetext");
                    }
                } catch (JSONException e) {
                    e.printStackTrace();
                }
            }

            if (photoType.equalsIgnoreCase("video")) {
                try {
                    JSONArray jsonArray = new JSONArray(status);
                    JSONObject jsonObject = jsonArray.getJSONObject(0);
//                    status = jsonObject.getString("video_path");

                } catch (JSONException e) {
                    e.printStackTrace();
                }
            }
//            }
            try {
                JSONArray jsonArray1 = new JSONArray(flowData);
                JSONObject jsonObject = jsonArray1.getJSONObject(0);

                String companyId = jsonObject.getString("company_id");
                String site_id = jsonObject.getString("site_id");
                String sId = jsonObject.getString("sid");
                String queId = jsonObject.getString("que_id");
                String checksheetid = jsonObject.getString("checksheetid");
                String stepNo = jsonObject.getString("step_No");
                String phId = jsonObject.getString("Ph_id");
                String thPath = jsonObject.getString("th_path");
                String type = jsonObject.getString("type");
                String itId = jsonObject.getString("it_id");

                //103 will indicate video upload else photo upload
                if (caseid.equalsIgnoreCase("103")) {
                    photoId = UploadUtils.uploadPhotoResumable(videopath, companyId, "0", checksheetid, queId, stepNo, type, phId, itId, thPath, sId);
                }
                else if (caseid.equalsIgnoreCase("101")) {
                    photoId = UploadUtils.uploadPhotoResumable(photopath, companyId, "0", checksheetid, queId, stepNo, type, phId, itId, thPath, sId);
                }
                else if (caseid.equalsIgnoreCase("104")) {
                    photoId = UploadUtils.uploadPhotoResumable(photopath, companyId, "0", checksheetid, queId, stepNo, type, phId, itId, thPath, sId);
                }
                else {
                    photoId = UploadUtils.uploadPhotoResumable(status, companyId, "0", checksheetid, queId, stepNo, type, phId, itId, thPath, sId);
                }

                if (photoId > 0) {

                    if(caseid.equalsIgnoreCase("101"))
                    {
                        JSONArray jsonArray = new JSONArray();
                        JSONObject jsonObject1 = new JSONObject();
                        jsonObject1.put("photo_id", photoId);
                        jsonObject1.put("photo_path", photopath);
                        jsonObject1.put("photo_size", UploadUtils.sizeofFile);
                        jsonObject1.put("Helmet", WithHelmet);
                        jsonObject1.put("Harnessjacket", Harness_jacket);
                        jsonObject1.put("Reflectivejacket", reflective_jacket);
                        jsonObject1.put("Safetyshoes", Safety_shoes);
                        jsonObject1.put("Handglows", Hand_glows);
                        jsonArray.put(jsonObject1);

                        pref.putString("photo_path", status);
                        pref.commit();
                        callbackContext.success(jsonArray.toString());
                    }
                    else if(caseid.equalsIgnoreCase("104"))
                    {
                        JSONArray jsonArray = new JSONArray();
                        JSONObject jsonObject1 = new JSONObject();
                        jsonObject1.put("photo_id", photoId);
                        jsonObject1.put("photo_path", photopath);
                        jsonObject1.put("photo_size", UploadUtils.sizeofFile);
                        jsonObject1.put("responsetext", responsetext);
                        jsonArray.put(jsonObject1);

                        pref.putString("photo_path", status);
                        pref.commit();
                        callbackContext.success(jsonArray.toString());
                    }
                    else {
                        JSONArray jsonArray = new JSONArray();
                        JSONObject jsonObject1 = new JSONObject();
                        jsonObject1.put("photo_id", photoId);
                        jsonObject1.put("photo_path", status);
                        jsonObject1.put("photo_size", UploadUtils.sizeofFile);
                        jsonArray.put(jsonObject1);

                        pref.putString("photo_path", status);
                        pref.commit();
                        callbackContext.success(jsonArray.toString());
                    }

                } else {

                    new Handler(Looper.getMainLooper()).post(new Runnable() {
                        public void run() {
                            Toast.makeText(sqlitewraper.context, "Photo_id is 0 " , Toast.LENGTH_LONG).show();
                        }
                    });
                    callbackContext.error("Photo Not uploaded");

                }

            } catch (IOException | JSONException e) {
                callbackContext.error("Photo Not uploaded");
                e.printStackTrace();
            }

            return "";

        }

        @Override
        protected void onPostExecute(String s) {
            super.onPostExecute(s);

        }
    }
}
