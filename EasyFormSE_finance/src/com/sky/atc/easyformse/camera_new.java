package com.sky.atc.easyformse;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.location.Location;
import android.os.Bundle;

import androidx.core.app.ActivityCompat;

import android.util.Log;
import android.widget.Toast;

import com.google.android.gms.common.api.GoogleApiClient;
import com.google.android.gms.location.LocationServices;
import com.sky.atc.easyformse.azurevision.AzureUtils;
import com.sky.atc.easyformse.azurevision.ComputerVisionDetection;
import com.sky.atc.easyformse.azurevision.TextRecognizationUtils;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.photo.PhotoConstants;

import net.sqlcipher.database.SQLiteDatabase;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;


/**
 * @author Tommy-Carlos Williams, Huge chunks lifted/adapted from the
 * NextworkManager core PhoneGap plugin
 */
@StringFogIgnore
public class camera_new extends CordovaPlugin {

    public static final String TYPE_NONE = "NONE";
    String camera_type;
    String camera_edit;
    private static int serverWidth;
    private static int serverHeight;


    public CallbackContext callbackContext;
    MySharedPreferences pref;
    public static String isburstMode = "false";
    public static boolean isCropMode = false;
    public static boolean isScanmode = false;
    Context c1;
//	Editor editor;
    String info;
    String max_file_size;

    @Override
    public boolean execute(String action, JSONArray args,
                           CallbackContext callbackContext) throws JSONException {

        // to save storage key and value
        if (PhotoConstants.originalPhotoList != null) {
            PhotoConstants.originalPhotoList.clear();
        }
        c1 = this.cordova.getActivity();
        this.callbackContext = callbackContext;
        boolean returnValue = false;
        pref = sqlitewraper.getSecureShared("MyPref");
        String time = args.getJSONObject(0).getString("time");
        String b_write = args.getJSONObject(0).getString("flag");
        String width = args.getJSONObject(0).getString("width");
        String height = args.getJSONObject(0).getString("height");
        String quality = args.getJSONObject(0).getString("quality");
        camera_type = args.getJSONObject(0).getString("camera_type");
        camera_edit = args.getJSONObject(0).getString("camera_edit");
        camera_edit = "true";

        serverWidth = Integer.parseInt(width);
        serverHeight = Integer.parseInt(height);
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

        try {
            isburstMode = args.getJSONObject(0).getString("burstmode");
        } catch (Exception e) {
            isburstMode = "false";
        }

        if (isburstMode.equalsIgnoreCase("")) {
            isburstMode = "false";
        }

        try {
            String isCropModeS = args.getJSONObject(0).getString("metercrop");
            isCropMode = isCropModeS.equalsIgnoreCase("true");
        } catch (Exception e) {
            isCropMode = false;
        }

        try {
            String isScaneMode = args.getJSONObject(0).getString("scan_mode");
            isScanmode = isScaneMode.equalsIgnoreCase("true");
        } catch (Exception e) {
            isScanmode = false;
        }

        try {

            String questionID = args.getJSONObject(0).getString("questionID");
            String checksheetID = args.getJSONObject(0).getString("checksheetID");
            String serverTaskId = args.getJSONObject(0).getString("serverTaskId");


            AzureUtils.checksheetID = checksheetID;
            AzureUtils.questionID = questionID;
            AzureUtils.serverTaskId = serverTaskId;

            Log.d("##CAMERA_NEW_SID", serverTaskId);

        } catch (Exception e) {
            ComputerVisionDetection.writeLogToFile("error : " + e.toString(), "execute gating questionID checksheetID serverTaskId");
            e.printStackTrace();
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

        if (camera_type.equals("0")) {
            returnValue = nativeCamera(time, b_write, width, height, quality, action, camera_edit);
        }
        if (camera_type.equals("1")) {
            ComputerVisionDetection.writeLogToFile("args " + args.toString(), "execute all data");
            returnValue = getDataFromDatabase(b_write, width, height, quality);
            if (!returnValue) {
                returnValue = easydrawCamera(time, b_write, width, height, quality, action);
            }
        }

        // editor.putString("time","0"); // Saving string
        // editor.commit();
        return returnValue;
    }

    public void onActivityResult(int requestCode, int resultCode, Intent intent) {

        try {
            if (resultCode == Activity.RESULT_OK && intent != null) {
                switch (requestCode) {

                    case 0:
                        // retour de la version utilisant le sample de imense alpr
                        String status = null;
                        if (resultCode == android.app.Activity.RESULT_OK) { // 0:ok
                            Bundle bundle = intent.getExtras();


                            if (camera_type.equals("0") && camera_edit.equals("0")) {
                                status = bundle.getString("status");
                            }
                            if (camera_type.equals("0") && camera_edit.equals("1")) {
                                status = pref.getString("photo_path", null);
                            }
                            if (camera_type.equals("1")) {
                                status = pref.getString("photo_path", null);
                            }

                            if (camera_new.isCropMode) {
                                Log.d("##CROP_ORIGINAL", PhotoConstants.originalPhoto);
                                JSONObject jsonObject = new JSONObject();
                                jsonObject.put("crop_photo", status);
                                jsonObject.put("original_photo", PhotoConstants.rotateAndCompress(PhotoConstants.originalPhoto, serverWidth, serverHeight));
                                status = jsonObject.toString();
                            }

                            pref.putString("photo_path", status); // Saving string
                            pref.commit(); // commit changes
                            // pref.getString("key_name5", null); // getting String

                            this.callbackContext.success(status);
                        } else {

                            String message = intent.getStringExtra("result");
                            this.callbackContext.error(message);

                        }

                        break;

                    case 1:
                        // retour de la version utilisant le sample de imense alpr
                        if (resultCode == android.app.Activity.RESULT_OK) { // 0:ok
                            Bundle bundle = intent.getExtras();

                            status = bundle.getString("status");

                            status = pref.getString("photo_path", null);

                            pref.putString("photo_path", status); // Saving string
                            pref.commit(); // commit changes
                            // pref.getString("key_name5", null); // getting String

                            this.callbackContext.success(status);
                        } else {

                            String message = intent.getStringExtra("result");
                            this.callbackContext.error(message);

                        }

                        break;


                    case 121:
                        // retour de la version utilisant le sample de imense alpr
                        if (resultCode == android.app.Activity.RESULT_OK) { // 0:ok
                            Bundle bundle = intent.getExtras();

                            status = bundle.getString("status");

                            status = pref.getString("photo_path", null);

                            if (camera_new.isCropMode) {
                                try {
                                    Log.d("##CROP_ORIGINAL", PhotoConstants.originalPhoto);

                                    JSONArray jsonArray = new JSONArray();

                                    JSONObject jsonObject = new JSONObject();
                                    jsonObject.put("crop_photo", status);
                                    jsonObject.put("original_photo", PhotoConstants.rotateAndCompress(PhotoConstants.originalPhoto, serverWidth, serverHeight));
                                    if (isScanmode) {
                                        String detectedText = !TextRecognizationUtils.detectedText.equals("") ? TextRecognizationUtils.detectedText : " ";
                                        jsonObject.put("detected_text", detectedText);
                                        jsonObject.put("selected_text", TextRecognizationUtils.finalTextString);
                                        jsonObject.put("input_type", TextRecognizationUtils.inputType);
//                                jsonObject.put("path",status);
//                                jsonObject.put("reading",TextRecognizationUtils.finalTextString);
//                                jsonObject.put("photo_type","1");
                                    }
                                    jsonArray.put(jsonObject);
                                    status = jsonArray.toString();
                                    Log.d("##FINAL_CAM_CBACK", status);
                                } catch (Exception e) {
                                    ComputerVisionDetection.writeLogToFile("error : " + e.toString(), "Camera_new onActivityResult 121");
                                }

                            }

                            pref.putString("photo_path", status); // Saving string
                            pref.commit(); // commit changes
                            // pref.getString("key_name5", null); // getting String
                            Log.d("##CROP_ORIGINAL_1", status);

                            this.callbackContext.success(status);
                        } else if (intent == null) {

                            String message = "error";
                            this.callbackContext.error(message);
                        } else {

                            Bundle bundle = intent.getExtras();
                            String message = bundle.getString("result");
                            this.callbackContext.error(message);
                        }

                        break;
                    default:
                        break;
                }

            } else if (resultCode == Activity.RESULT_CANCELED) {
                if (intent != null) {
                    Bundle bundle = intent.getExtras();
                    if (bundle != null) {
                        boolean islogin = bundle.getBoolean("logout", false);
                        String message = bundle.getString("result", "");
                        if (islogin) {
                            String login_key = "False";

                            MySharedPreferences editor = sqlitewraper.getSecureShared("pre1");
                            editor.putString("login_key", login_key);
                            editor.commit();

                            Intent i = new Intent(sqlitewraper.context, MainActivity.class);
                            i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                            sqlitewraper.context.startActivity(i);
                            this.callbackContext.error(message);
                        } else if (!message.equalsIgnoreCase("")) {
                            this.callbackContext.error(message);
                        } else {
                            this.callbackContext.error("Error");
                        }
                    } else {
                        this.callbackContext.error("Error");
                    }
                } else {
                    this.callbackContext.error("intent Null");
                }
            }
        } catch (Exception e) {
            ComputerVisionDetection.writeLogToFile("error : " + e.toString(), "Camera_new onActivityResult");
            DeviceEventsUtils.isFinishActivitiesOptionEnabled(sqlitewraper.context);
            //ExitActivity.exit(sqlitewraper.context);
        }
    }

    public boolean nativeCamera(String time, String b_write, String width, String height, String quality, String action, String drawflag) {
        String time1 = pref.getString("time", "k2");
        // ///////

        if (!time.equalsIgnoreCase(time1)) {

            pref.putString("b_write", b_write); // Saving string
            pref.putString("time", time); // Saving string
            pref.commit();

            if (action.equals("anAction")) {
                Intent intent = new Intent(this.cordova.getActivity(),
                        cameraactivity.class);

                intent.putExtra("width", width);
                intent.putExtra("height", height);
                intent.putExtra("quality", quality);
                intent.putExtra("drawflag", drawflag);
                intent.putExtra("max_file_size",max_file_size);
                if (this.cordova != null) {
                    this.cordova.startActivityForResult(this, intent, 0);
                    return true;
                }
            }
            return false;
        }
        return false;
    }

    private boolean getDataFromDatabase(String b_write, String width, String height, String quality) {
        try {
            String sid = AzureUtils.serverTaskId;
            String queid = AzureUtils.questionID;
            String checkSheetID = AzureUtils.checksheetID;

            String selectQuery = "SELECT imgpath,Unique_id,hasResponse,orpath FROM meterreading where sid=" + sid + " AND checksheetid='" + checkSheetID + "' AND queid=" + queid + " ORDER BY id DESC LIMIT 1";

            ComputerVisionDetection.writeLogToFile(selectQuery, "Camera_new getDataFromDatabase");
            SQLiteDatabase db = sqlitewraper.getDatabase();
            Cursor cursor = db.rawQuery(selectQuery, null);
            if (cursor.getCount() > 0) {
                cursor.moveToFirst();
                //  final String detectedText = cursor.getString(0);
                final String imgPath = cursor.getString(0);
                final String Unique_id = cursor.getString(1);
                final int hasResponse = cursor.getInt(2);
                final String orpath = cursor.getString(3);
               /* final String detectionType = cursor.getString(2);
                final String originalPath = cursor.getString(3);*/
                cursor.close();
                MySharedPreferences prefs = sqlitewraper.getSecureShared("Size");
                int width1 = prefs.getInt("max_width", 0);
                int height1 = prefs.getInt("max_height", 0);

                String max_width = String.valueOf(width1);
                String max_height = String.valueOf(height1);
                ComputerVisionDetection.writeLogToFile("selectQuery Data : imgPath :" + imgPath
                        + " Unique_id :" + Unique_id + " hasResponse :" + hasResponse + " orpath :" + orpath, "Camera_new getDataFromDatabase");
                return getLastKnownLocation(b_write, width, height, quality, imgPath, max_width, max_height, Unique_id, hasResponse, orpath);
            } else {
                cursor.close();
                return false;
            }
        } catch (Exception e) {
            ComputerVisionDetection.writeLogToFile("error : " + e.toString(), "Camera_new getDataFromDatabase");
            Log.d("##DATA_DETECTED_ERROR", e.getMessage());
            return false;
        }
    }

    private Boolean getLastKnownLocation(String b_write, String width, String height, String quality, String imgPath, String max_width, String max_height, String unique_id, int hasResponse, String orpath) {
        GoogleApiClient googleApiClient = sqlitewraper.getGoogleApiHelper().getGoogleApiClient();
        if (ActivityCompat.checkSelfPermission(sqlitewraper.context, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(sqlitewraper.context, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            Toast.makeText(sqlitewraper.context, "Allow All Permissions", Toast.LENGTH_SHORT).show();
            return false;
        }
        Location lastLocation = LocationServices.FusedLocationApi.getLastLocation(googleApiClient);
        if (lastLocation != null) {
            double deviceLat = lastLocation.getLatitude();
            double deviceLng = lastLocation.getLongitude();
            PhotoConstants.originalPhoto = orpath;
            File originalImage = new File(orpath);
            File cropImage = new File(imgPath);
            if (cropImage.exists() && originalImage.exists()) {
                Intent i = new Intent(sqlitewraper.context, easy_draw_new.class);
                i.putExtra("File", cropImage);
                i.putExtra("b_write", b_write);
                i.putExtra("width", max_width);
                i.putExtra("quality", quality);
                i.putExtra("height", max_height);
                i.putExtra("picclicklat", String.valueOf(deviceLat));
                i.putExtra("picclicklng", String.valueOf(deviceLng));
                i.putExtra("flagdraw", "0");
                i.putExtra("drawflag", "0");
                i.putExtra("cameraview", -2);
                i.putExtra("serverwidth", width);
                i.putExtra("serverheight", height);
                i.putExtra("uniqueId", unique_id);
                i.putExtra("hasResponse", hasResponse);
                i.putExtra("canInsert", hasResponse);
                if (hasResponse == 1) {
                    i.putExtra("ShowOldImage", 1);
                } else {
                    i.putExtra("ShowOldImage", 2);
                }
                this.cordova.startActivityForResult(this, i, 121);
                return true;
            } else {
                deleteFromDatabase(unique_id, originalImage.getAbsolutePath(), cropImage.getAbsolutePath());
                return getDataFromDatabase(b_write, width, height, quality);
            }
        } else {
            Toast.makeText(sqlitewraper.context, "LatLong not found", Toast.LENGTH_SHORT).show();
            return false;
        }

    }

    private void deleteFromDatabase(String uniqueCode, String originalImage, String cropImage) {
        String sid = AzureUtils.serverTaskId;
        String queid = AzureUtils.questionID;
        String checkSheetID = AzureUtils.checksheetID;

        String selectQuery = "SELECT id FROM meterreading where sid=" + sid + " AND checksheetid='" + checkSheetID + "' AND queid=" + queid + " AND Unique_id='" + uniqueCode + "' AND orpath='" + originalImage + "' AND imgpath='" + cropImage + "' ORDER BY id DESC LIMIT 1";
        ComputerVisionDetection.writeLogToFile(selectQuery, "deleteFromDatabase");
        SQLiteDatabase db = sqlitewraper.getDatabase();
        Cursor cursor = db.rawQuery(selectQuery, null);
        if (cursor.getCount() > 0) {
            cursor.moveToFirst();
            final String id = cursor.getString(0);
            cursor.close();
            long temp = db.delete("meterreading", "id=?", new String[]{id});
            ComputerVisionDetection.writeLogToFile(temp + "  ", "delete Result");
        } else {
            ComputerVisionDetection.writeLogToFile("NoData Found", "deleteFromDatabase");
        }
    }

    public boolean easydrawCamera(String time, String b_write, String width, String height, String quality, String action) {

        String time1 = pref.getString("time", "0");

        Long time_l = Long.valueOf(time);
        Long time1_l = Long.valueOf(time1);
        // ///////

        if ((!time.equalsIgnoreCase(time1)) && (time_l > time1_l + 3000)) {
            this.callbackContext = callbackContext;
            pref.putString("b_write", b_write); // Saving string
            pref.putString("time", time); // Saving string
            pref.commit();

            if (action.equals("anAction")) {
                Intent intent;
                if (isCropMode) {
                    intent = new Intent(this.cordova.getActivity(),
                            NewCameraActivity.class);
                } else {
                    intent = new Intent(this.cordova.getActivity(),
                            MakePhotoActivity.class);
                }
                intent.putExtra("width", width);
                intent.putExtra("height", height);
                intent.putExtra("quality", quality);
                intent.putExtra("info", info);
                intent.putExtra("max_file_size",max_file_size);
                if (this.cordova != null) {
                    this.cordova.startActivityForResult(this, intent, 121);
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
}