package com.sky.atc.easyformse.plugins;


import static com.sky.atc.easyformse.sqlitewraper.context;

import android.annotation.SuppressLint;
import android.app.AlertDialog;
import android.content.Context;
import android.content.Intent;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.AsyncTask;
import android.util.Log;

import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.download.ImageDownloadService;
import com.sky.atc.easyformse.sqlitewraper;
import com.sky.atc.easyformse.upload.UploadUtils;
import com.sky.atc.easyformse.utils.LogUtils;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.io.IOException;
import java.util.concurrent.ExecutorService;

import io.michaelrocks.paranoid.Obfuscate;

//plugin to Upload profile photo
@Obfuscate
public class ProfilePhotoPlugin extends CordovaPlugin {

    private CallbackContext callbackContext;
    private static String flowData;
    ExecutorService executorService;
    String isDownload;
    String filename;
    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        this.callbackContext = callbackContext;
        executorService = this.cordova.getThreadPool();
        try {
            final String[] pUrl = {args.getJSONObject(0).getString("p_url")};
            flowData = args.getJSONObject(0).getString("flowParamData");
            try{
                isDownload = args.getJSONObject(0).getString("is_photo_download");
            }
            catch (Exception e)
            {
                isDownload = "0";
            }
            try{
                filename = args.getJSONObject(0).getString("download_pro_pic_name");
            }
            catch (Exception e)
            {
                filename = "";
            }

            if(pUrl.equals(""))
            {

            }
            else {
                if (isNetworkAvailable()) {
                    executorService.execute(() -> {
                        File file = new File(pUrl[0]);
                        long length = file.length() / 1024;
                        if (length > 1024) {
                            pUrl[0] = UploadUtils.compressImage(pUrl[0]);
                            Log.d("##IMGRESIZE", pUrl[0]);
                        }
                        uploadPhoto(pUrl[0]);
                    });
                } else {
                    showAlertDialogWithMessage(pUrl[0]);
                }
            }


            if(isDownload.equalsIgnoreCase("1"))
            {
                MySharedPreferences pref = sqlitewraper.getSecureShared("MyPref");
                String imageUrl = pref.getString("image_url","");
//                String Profile_photo = pref.getString("Profile_photo","");
               // String filename=Profile_photo.substring(Profile_photo.lastIndexOf("/")+1);

                context.startService(new Intent(context, ImageDownloadService.class)
                        .putExtra("imageUrl", imageUrl)
                        .putExtra("FileName", filename));
            }

            return true;
        } catch (Exception e) {
            LogUtils.writeApiCallLogToFile(e.toString(), "","execute ProfilePhotoPlugin","0");
            callbackContext.error("error");
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

    private void showAlertDialogWithMessage(String filePath) {
        AlertDialog.Builder alertBuilder = new AlertDialog.Builder(cordova.getActivity());
        alertBuilder.setTitle("Internet Not Available");
        alertBuilder.setMessage("Please turn on the internet and Retry");
        alertBuilder.setCancelable(false);
        alertBuilder.setPositiveButton("Retry", (dialog, which) -> {
            dialog.dismiss();
            if (isNetworkAvailable()) {
                executorService.execute(() -> {
                    File file = new File(filePath);
                    long length = file.length() / 1024;
                    String filePath1 = filePath;
                    if (length > 1024) {
                        filePath1 = UploadUtils.compressImage(filePath1);
                        Log.d("##IMGRESIZE", filePath1);
                    }
                    uploadPhoto(filePath1);
                });
            } else {
                showAlertDialogWithMessage(filePath);
            }
        });
        alertBuilder.setNegativeButton("Cancel", (dialog, which) -> {
            callbackContext.error("Fail");
            dialog.dismiss();
        });
        alertBuilder.show();
    }

    Runnable profilePhotoUpload;

    void uploadPhoto(String imageFilePath) {
        profilePhotoUpload = () -> {
            int photoId;

            try {
                if(flowData.equalsIgnoreCase("[]"))
                {
                    callbackContext.success("succes");
                }
                else {
                    JSONArray jsonArray1 = new JSONArray(flowData);
                    JSONObject jsonObject = jsonArray1.getJSONObject(0);

                    String companyId = jsonObject.getString("company_id");
                    // String site_id = jsonObject.getString("site_id");
                    String sId = jsonObject.getString("sid");
                    String queId = jsonObject.getString("que_id");
                    String checksheetid = jsonObject.getString("checksheetid");
                    String stepNo = jsonObject.getString("step_No");
                    String phId = jsonObject.getString("Ph_id");
                    String thPath = jsonObject.getString("th_path");
                    String type = jsonObject.getString("type");
                    String itId = jsonObject.getString("it_id");


                    photoId = UploadUtils.uploadPhotoResumable(imageFilePath, companyId, "0", checksheetid, queId, stepNo, type, phId, itId, thPath, sId);


                    if (photoId > 0) {
                        JSONArray jsonArray = new JSONArray();
                        JSONObject jsonObject1 = new JSONObject();
                        jsonObject1.put("photo_id", photoId);
                        jsonObject1.put("photo_path", imageFilePath);
                        jsonObject1.put("photo_size", UploadUtils.sizeofFile);
                        jsonArray.put(jsonObject1);

                        callbackContext.success(jsonArray.toString());
                    } else {
                        LogUtils.writeApiCallLogToFile("flowData ::" + flowData + " photoId ::" + photoId, "","uploadPhoto::ProfilePhotoPlugin","1");
                        callbackContext.error("Photo Not uploaded");
                    }
                }

            } catch (IOException | JSONException e) {
                LogUtils.writeApiCallLogToFile("flowData ::" + flowData + "Error:  " + e, "","uploadPhoto::ProfilePhotoPlugin","0");
                callbackContext.error("Photo Not uploaded");
            }
        };
        if (executorService != null)
            executorService.execute(profilePhotoUpload);
        else
            LogUtils.writeApiCallLogToFile("executorService is null flowData::: " + flowData + "  imageFilePath:  " + imageFilePath,"" ,"uploadPhoto::ProfilePhotoPlugin","0");
    }
}