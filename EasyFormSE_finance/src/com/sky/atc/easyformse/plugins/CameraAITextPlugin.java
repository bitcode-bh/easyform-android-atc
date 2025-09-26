package com.sky.atc.easyformse.plugins;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;

import com.sky.atc.easyformse.CameraAITextActivity;
import com.sky.atc.easyformse.DeviceEventsUtils;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.sqlitewraper;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

// CameraAITextPlugin for Text base photo capture with AI
public class CameraAITextPlugin extends CordovaPlugin {
    Context c1;
    public CallbackContext callbackContext;
    MySharedPreferences pref;
    String info;
    String max_file_size;
    String ModelName;
    String PromptText;
    String camera_type;
    public static CameraAITextPlugin instance;
    String AI_type;

    @Override
    public boolean execute(String action, JSONArray args,
                           CallbackContext callbackContext) throws JSONException {

        c1 = this.cordova.getActivity();
        instance = this;
        this.callbackContext = callbackContext;
        String query = args.getJSONObject(0).getString("data");
        String b_write = args.getJSONObject(0).getString("flag");

        // //to save storage key and value
        pref = sqlitewraper.getSecureShared("MyPref");
//		editor = pref.edit();
        // /////////

        String width = args.getJSONObject(0).getString("width");
        String height = args.getJSONObject(0).getString("height");
        String quality = args.getJSONObject(0).getString("quality");
        String docpick = args.getJSONObject(0).getString("p");
        camera_type = args.getJSONObject(0).getString("camera_type");
        try {
            AI_type = args.getJSONObject(0).getString("AI_type");
        }
        catch (Exception e)
        {
            AI_type = "camera";
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

        try {
            max_file_size = args.getJSONObject(0).getString("max_file_size");
        } catch (Exception e) {
            max_file_size = "5";
        }

        try {
            ModelName = args.getJSONObject(0).getString("model_name");
        } catch (Exception e) {
            ModelName = "";
        }

        try {
            PromptText = args.getJSONObject(0).getString("prompt_text");
        } catch (Exception e) {
            PromptText = "";
        }

        pref.putString("b_write", b_write); // Saving string
        pref.putString("prompttext", PromptText);
        pref.putString("modelname", ModelName);
        pref.commit();

        Intent intent = new Intent(this.cordova.getActivity(),
                CameraAITextActivity.class);

        intent.putExtra("width", width);
        intent.putExtra("height", height);
        intent.putExtra("quality", quality);
        intent.putExtra("info", info);
        intent.putExtra("max_file_size", max_file_size);
        intent.putExtra("modelname", ModelName);
        intent.putExtra("prompttext", PromptText);
        intent.putExtra("camera_type", camera_type);
        intent.putExtra("AI_type",AI_type);
        if (this.cordova != null) {
            this.cordova.startActivityForResult(this, intent, 121);
            return true;
        }


        return false;
    }



    public void onActivityResult(int requestCode, int resultCode, Intent intent) {

        try {
            if (resultCode == Activity.RESULT_OK && intent != null) {
                switch (requestCode) {
                    case 121:
                        String status = null;
                        String responsetext = null;
                        String response = null;
                        if (resultCode == Activity.RESULT_OK) {
                            Bundle bundle = intent.getExtras();

                            response = bundle.getString("response");

                            JSONArray jsonArray = new JSONArray(response);
                            JSONObject jsonObject = jsonArray.getJSONObject(0);
                            status = jsonObject.getString("photo_path");

//                            status = pref.getString("photo_path", null);

                            pref.putString("photo_path", status); // Saving string
                            pref.commit(); // commit changes

                            this.callbackContext.success(response);
                        }

                        break;
                    default:
                        break;
                }
            }
            else {
                this.callbackContext.error("error");
            }

        } catch (Exception e) {
            this.callbackContext.error("error");
            DeviceEventsUtils.isFinishActivitiesOptionEnabled(sqlitewraper.context);
        }
    }
}

