package com.sky.atc.easyformse.plugins;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.Intent;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.AsyncTask;
import android.os.Bundle;
import android.util.Log;
import android.widget.Toast;

import com.sky.atc.easyformse.DeviceEventsUtils;
import com.sky.atc.easyformse.sqlitewraper;
import com.sky.atc.easyformse.upload.UploadUtils;
import com.sky.atc.easyformse.utils.LogUtils;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.LOG;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;

public class ArMeasurePlugin extends CordovaPlugin {

    public CallbackContext callbackContext;
    private static String flowData;
    JSONArray mJsonArray;
    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        this.callbackContext = callbackContext;

        try {
            String smartMeasureType = "m";
            try {
                if (args.getJSONObject(0).has("img_array")) {

                    mJsonArray = args.getJSONObject(0).getJSONArray("img_array");
                    if(mJsonArray.length() > 0 && mJsonArray != null) {
                        flowData = mJsonArray.getJSONObject(0).getString("flowParamData");
                    }
                }
                if (args.getJSONObject(0).has("ar_measurement_type")) {
                    smartMeasureType = args.getJSONObject(0).getString("ar_measurement_type");
                }

                if (smartMeasureType.matches("tilt") || smartMeasureType.matches("azim")) {

                    try {
                        Intent ArMeasureIntent = new Intent(sqlitewraper.context, Class.forName("com.easyform.smartmeasure.ui.activitys.MeasureThreeActivity"));
//                    ArMeasureIntent.putExtra("mtype", smartMeasureType);
                        ArMeasureIntent.putExtra("mtype", smartMeasureType);
                        this.cordova.startActivityForResult(this, ArMeasureIntent, 105);
                        return true;
                    } catch (Exception e) {
                        Toast.makeText(this.cordova.getActivity(),"SmartMeasure Module is Not Added",Toast.LENGTH_LONG).show();
                        this.callbackContext.error("error: " + e.toString());
                        return false;
                    }
                } else {
                    try {
                        Intent ArMeasureIntent = new Intent(sqlitewraper.context, Class.forName("com.easyform.smartmeasure.ui.activitys.MeasureTwoActivity"));
                        ArMeasureIntent.putExtra("mtype", smartMeasureType);
                        this.cordova.startActivityForResult(this, ArMeasureIntent, 104);
                        return true;
                    } catch (Exception e) {
                        Toast.makeText(this.cordova.getActivity(),"SmartMeasure Module is Not Added",Toast.LENGTH_LONG).show();
                        this.callbackContext.error("error: " + e.toString());
                        return false;
                    }


                }

            } catch (Exception e) {
                e.printStackTrace();
            }

        } catch (Exception e) {
            this.callbackContext.error(e.getMessage());
        }

        return true;
    }


    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent intent) {
        super.onActivityResult(requestCode, resultCode, intent);

        if (requestCode == 104) {
            try {
                if (callbackContext != null) {

                    if (resultCode == Activity.RESULT_OK) {
                        Bundle bundle = intent.getExtras();
                        String distance = bundle.getString("distance");
//                        String distanceMeter = String.format("%.2f", distance);
                        String photo_path = bundle.getString("photo_path");
                        JSONArray jsonArray = new JSONArray();
                        JSONObject jsonObject = new JSONObject();
                        jsonObject.put("code", distance);
                        jsonObject.put("photo_path",photo_path);
                        jsonArray.put(jsonObject);
                        Log.d("####Succces", jsonArray.toString());

                        if(mJsonArray.length() > 0 && mJsonArray != null)
                        {
                            if (isNetworkAvailable()) {
                                //ar not supported device send only code value
                                if(photo_path.equalsIgnoreCase(""))
                                {
                                    JSONArray mjsonArray = new JSONArray();
                                    JSONObject mjsonObject = new JSONObject();
                                    mjsonObject.put("code", distance);
                                    mjsonArray.put(mjsonObject);
                                    this.callbackContext.success(mjsonArray.toString());
                                }
                                else {
                                    new uploadphoto().execute(photo_path,distance, "104");
                                }

                            } else {
                                showAlertDialogWithMessage(photo_path,distance, "104");
                            }
                        }
                        else {
                             this.callbackContext.success(jsonArray.toString());
                        }


                    } else {
                        this.callbackContext.error("error");
                    }
                } else {

                    DeviceEventsUtils.isFinishActivitiesOptionEnabled(sqlitewraper.context);
                }
            } catch (Exception e) {

                DeviceEventsUtils.isFinishActivitiesOptionEnabled(sqlitewraper.context);
            }
        } else if (requestCode == 105) {
            try {
                if (callbackContext != null) {
                    if (resultCode == Activity.RESULT_OK) {
                        Bundle bundle = intent.getExtras();
                        double tiltDistance = bundle.getDouble("result");
                        String distances = String.format("%.0f", tiltDistance);
                        Log.d("distance", distances);
                        JSONArray jsonArray = new JSONArray();
                        JSONObject jsonObject = new JSONObject();
                        jsonObject.put("code", distances);
                        jsonArray.put(jsonObject);
                        this.callbackContext.success(jsonArray.toString());

                    } else {
                        this.callbackContext.error("error");

                    }
                } else {
                    DeviceEventsUtils.isFinishActivitiesOptionEnabled(sqlitewraper.context);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
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


            String status = strings[0];
            String distance = strings[1];
            String caseid = strings[2];


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

//                //103 will indicate video upload else photo upload
//                if (caseid.equalsIgnoreCase("103")) {
//                    photoId = UploadUtils.uploadPhotoResumable(videopath, companyId, "0", checksheetid, queId, stepNo, type, phId, itId, thPath, sId);
//
//                } else {
                    photoId = UploadUtils.uploadPhotoResumable(status, companyId, "0", checksheetid, queId, stepNo, type, phId, itId, thPath, sId);

//                }

                if (photoId > 0) {
                    JSONArray jsonArray = new JSONArray();
                    JSONObject jsonObject1 = new JSONObject();
                    jsonObject1.put("photo_id", photoId);
                    jsonObject1.put("photo_path", status);
                    jsonObject1.put("code",distance);
                    jsonObject1.put("photo_size", UploadUtils.getFileSize(new java.io.File(status).length()));
                    jsonArray.put(jsonObject1);

//                    pref.putString("photo_path", status);
//                    pref.commit();
                    Log.d("plugin success" ,jsonArray.toString());
                    callbackContext.success(jsonArray.toString());
                } else {
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

    private boolean isNetworkAvailable() {
        ConnectivityManager connectivityManager = (ConnectivityManager) sqlitewraper.context
                .getSystemService(Context.CONNECTIVITY_SERVICE);
        @SuppressLint("MissingPermission")
        NetworkInfo activeNetworkInfo = connectivityManager
                .getActiveNetworkInfo();
        return activeNetworkInfo != null && activeNetworkInfo.isConnected();
    }

    private void showAlertDialogWithMessage(String filePath,String distance, String requestCode) {
        AlertDialog.Builder alertBuilder = new AlertDialog.Builder(cordova.getActivity());
        alertBuilder.setTitle("Internet Not Available");
        alertBuilder.setMessage("Please turn on the internet and Retry");
        alertBuilder.setCancelable(false);
        alertBuilder.setPositiveButton("Retry", (dialog, which) -> {
            dialog.dismiss();
            if (isNetworkAvailable()) {
                new uploadphoto().execute(filePath,distance, requestCode);
            } else {
                showAlertDialogWithMessage(filePath,distance, requestCode);
            }

        });
        alertBuilder.setNegativeButton("Cancel", (dialog, which) -> {
            this.callbackContext.error("Fail");
            dialog.dismiss();

        });
        alertBuilder.show();
    }
}
