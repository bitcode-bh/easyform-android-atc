package com.sky.atc.easyformse.plugins;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Toast;

import com.sky.atc.easyformse.MakePhotoActivity;
import com.sky.atc.easyformse.cameraactivity;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.sqlitewraper;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import io.michaelrocks.paranoid.Obfuscate;

//to open Anyline meter Reading APK
@Obfuscate
public class MeterReadingPlugin extends CordovaPlugin {

    private MySharedPreferences pref;
    private CallbackContext callbackContext;
    private boolean isPluginValid = true;
    String camera_type;
    String camera_edit;
    boolean returnValue=false;
    String time;
    String b_write;
    String width;
    String height;
    String quality;
    String act;
    String info;
    String  max_file_size;
    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {

        this.callbackContext = callbackContext;
        pref = sqlitewraper.getSecureShared("MyPref");

        pref = sqlitewraper.getSecureShared("MyPref");
         time = args.getJSONObject(0).getString("time");
         b_write = args.getJSONObject(0).getString("flag");
         width = args.getJSONObject(0).getString("width");
         height = args.getJSONObject(0).getString("height");
         quality = args.getJSONObject(0).getString("quality");
        camera_type = args.getJSONObject(0).getString("camera_type");
        camera_edit = args.getJSONObject(0).getString("camera_edit");
        act = action;

        if(camera_type.equals("Native")){
            camera_type="0";
        }else {
            camera_type="1";
        }
        if(camera_edit.equals("False")){
            camera_edit= "0";
        }else {
            camera_edit="1";
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

//        Intent intent = new Intent(this.cordova.getActivity(),
//                MeterMainActivity.class);
//        if (this.cordova != null) {
//            this.cordova.startActivityForResult(this, intent, 102);
//            return true;
//        }
        try{
            MySharedPreferences sharedPreferences = sqlitewraper.getSecureShared("pre1");
            String meterpackage = sharedPreferences.getString("PackageName_MeterReading", "NA");
        Intent intent = sqlitewraper.context.getPackageManager().getLaunchIntentForPackage(meterpackage);
        if (this.cordova != null) {
            intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
            this.cordova.startActivityForResult((CordovaPlugin) this,intent,102);
            return true;
        } else {
            Toast.makeText(sqlitewraper.context, "There is no package available in android", Toast.LENGTH_LONG).show();
        }
        }catch (Exception e){
            e.printStackTrace();
        }
        return isPluginValid;
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent intent) {
        super.onActivityResult(requestCode, resultCode, intent);
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

                    pref.putString("photo_path", status); // Saving string
                    pref.commit(); // commit changes
                    // pref.getString("key_name5", null); // getting String

                    JSONArray jsonArray2 = new JSONArray();
                    JSONObject jsonObject = new JSONObject();
                    try {
                        jsonObject.put("path",status);
                        jsonObject.put("reading","");
                        jsonObject.put("photo_type","0");
                        jsonArray2.put(jsonObject);
                        this.callbackContext.success(jsonArray2.toString());
                    } catch (JSONException e) {
                        e.printStackTrace();
                    }

                    this.callbackContext.success(status);
                } else {

                    String message = intent.getStringExtra("result");
                    this.callbackContext.error(message);

                }

                break;

            case 121:

                if (resultCode == android.app.Activity.RESULT_OK) { // 0:ok
                    Bundle bundle = intent.getExtras();

                    status = bundle.getString("status");

                    status = pref.getString("photo_path", null);

                    pref.putString("photo_path", status); // Saving string
                    pref.commit(); // commit changes
                    // pref.getString("key_name5", null); // getting String

                    JSONArray jsonArray2 = new JSONArray();
                    JSONObject jsonObject = new JSONObject();
                    try {
                        jsonObject.put("path",status);
                        jsonObject.put("reading","");
                        jsonObject.put("photo_type","0");
                        jsonArray2.put(jsonObject);
                        this.callbackContext.success(jsonArray2.toString());
                    } catch (JSONException e) {
                        e.printStackTrace();
                    }

                } else if (intent == null) {

                    String message = "error";
                    this.callbackContext.error(message);
                } else {

                    Bundle bundle = intent.getExtras();
                    String message = bundle.getString("result");
                    this.callbackContext.error(message);
                }

                break;

            case 102:
                if (resultCode == android.app.Activity.RESULT_OK) {
                    String energyResult = null;
                    String path = null;
                    String photo_type = null;
                    Bundle bundle = intent.getExtras();
                    if (bundle != null) {
                        energyResult = bundle.getString("energyResult");
                        path = bundle.getString("path");
                        photo_type = bundle.getString("photo_type");

                        if(photo_type.equalsIgnoreCase("1")){

                            JSONArray jsonArray2 = new JSONArray();
                            JSONObject jsonObject = new JSONObject();
                            try {
                                jsonObject.put("path",path);
                                jsonObject.put("reading",energyResult);
                                jsonObject.put("photo_type",photo_type);
                                jsonArray2.put(jsonObject);
                                this.callbackContext.success(jsonArray2.toString());
                            } catch (JSONException e) {
                                e.printStackTrace();
                            }
                        }

                        if(photo_type.equalsIgnoreCase("0")){
                            if (camera_type.equals("0")) {
                                returnValue=nativeCamera(time, b_write, width, height, quality, act,camera_edit);
                            }
                            if (camera_type.equals("1")) {
                                returnValue = easydrawCamera(time, b_write, width, height, quality, act);
                            }

                        }
                    }
                } else {
//                    String message = intent.getStringExtra("result");
                    this.callbackContext.error("Fail");
                }
                break;
            default:
                break;
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
                if (this.cordova != null) {
                    this.cordova.startActivityForResult(this, intent, 0);
                    return true;
                }
            }
            return false;
        }
        return false;
    }

    public boolean easydrawCamera( String time, String b_write, String width, String height, String quality,String action) {

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
                Intent intent = new Intent(this.cordova.getActivity(),
                        MakePhotoActivity.class);

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
