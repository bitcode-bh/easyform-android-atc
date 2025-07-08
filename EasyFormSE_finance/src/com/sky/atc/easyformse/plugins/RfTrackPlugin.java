package com.sky.atc.easyformse.plugins;

import android.app.Activity;
import android.content.Intent;
import android.os.Environment;
import android.util.Log;

import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.sqlitewraper;
import com.sky.atc.easyformse.utils.LogUtils;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class RfTrackPlugin extends CordovaPlugin {
    private static final String TAG = "RfTrackPlugin";
    CallbackContext callbackContext;
    MySharedPreferences mySharedPreferences = sqlitewraper.getSecureShared("MyPref");

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        this.callbackContext = callbackContext;
        JSONObject jsonObject = args.getJSONObject(0);
        if (jsonObject != null) {
            if (jsonObject.has("isOldLogs")) {
                try {
                    boolean isOldLogs = jsonObject.getBoolean("isOldLogs");
                    if (isOldLogs) {
                        try {
                            String oldJsonData = mySharedPreferences.getString(Constants.RfTrackLogKey, "");
                            if (!oldJsonData.isEmpty()) {
                                JSONObject oldJsonObject = new JSONObject(oldJsonData);
                                mySharedPreferences.removeValue(Constants.RfTrackLogKey);
                                callbackContext.success(oldJsonObject);
                              //  LogUtils.writeRfTrackLogToFile("Android oldJsonData :" + oldJsonObject, "onActivityResult");
                            } else {
                                sendCallBackResultError(callbackContext, "Android Error oldJsonData :  is empty", "execute forgetting old from SharedPreferences", "Android Error : oldJsonData is empty");
                            }
                        } catch (JSONException e) {
                            sendCallBackResultError(callbackContext, "Error JSONException : " + e.toString(), "execute forgetting old json", "Android Error : " + e.toString());
                        }
                        return false;
                    }
                } catch (Exception e) {
                    sendCallBackResultError(callbackContext, "Error : isOldLogs " + e.toString(), "execute", "Android Error : isOldLogs " + e.toString());
                    return false;
                }
            } else {
                sendCallBackResultError(callbackContext, "Android Error : in JsonObject isOldLogs key is not Found", "execute", "Android Error : in JsonObject isOldLogs key is not Found");
                return false;
            }
            // mode =  '2G [Idle Mode]' or '4G Network' or '2G [Dedicated Mode]'

            if (jsonObject.has("mode")) {
               // LogUtils.writeRfTrackLogToFile("JsonObject not has mode key" + jsonObject.getString("mode"), "onActivityResult");
                return openRfTrackApp(jsonObject.getString("mode"));
            } else {
                sendCallBackResultError(callbackContext, "Error : JsonObject not has mode key", "execute", "Android Error : JsonObject not has mode key");
                return false;
            }
        } else {
            sendCallBackResultError(callbackContext, "Error : JsonObject is null", "execute", "Android Error : JsonObject is null");
            return false;
        }
    }



    Boolean openRfTrackApp(String mode) {
        String folderPath = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES).getAbsolutePath();

        Log.d("folderPath", folderPath);
        Intent rfAppIntent = new Intent();
        rfAppIntent.setAction(Constants.action);
        rfAppIntent.setPackage(Constants.packageName);
        rfAppIntent.putExtra("Mode", mode);
        rfAppIntent.putExtra("folderPath", "appFolder");
        try {
            this.cordova.startActivityForResult(this, rfAppIntent, Constants.requestCode);//null pointer check in case package name was not found
            return true;
        } catch (Exception e) {
            sendCallBackResultError(callbackContext, "Error : " + e.toString(), "openRfTrackApp", "Android Error : " + e.toString());
            return false;
        }
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent intent) {
        super.onActivityResult(requestCode, resultCode, intent);
        try {
            if (Constants.requestCode == requestCode && resultCode == Activity.RESULT_OK) {
                Log.d(TAG, "requestCode : " + requestCode + " resultCode: " + resultCode + " intent : " + intent.getExtras().getString("RfTrackData", "null"));
                if (intent.getExtras() != null) {
                    try {
                        JSONObject jsonObject = new JSONObject(intent.getExtras().getString("RfTrackData", "null"));
                        mySharedPreferences.putString(Constants.RfTrackLogKey, jsonObject.toString());
                        callbackContext.success(jsonObject);
                       // LogUtils.writeRfTrackLogToFile("Plugin success : " + jsonObject.toString(), "onActivityResult");
                    } catch (JSONException e) {
                        sendCallBackResultError(callbackContext, "Error JSONException : " + e.toString(), "onActivityResult", "Android Error : " + e.toString());
                    }
                } else {
                    sendCallBackResultError(callbackContext, "Error : Extras is null ", "onActivityResult", "Android Error : Extras is null");
                }
            } else {
                sendCallBackResultError(callbackContext, "Error : resultCode is not ok " + resultCode, "onActivityResult", "Android Error : resultCode is not ok " + resultCode);
            }
        } catch (Exception e) {
            LogUtils.writeRfTrackLogToFile("Error : " + e.toString(), "onActivityResult");
        }
    }

    private void sendCallBackResultError(CallbackContext callbackContext, String errorString, String errorClass, String errorReturn) {
        LogUtils.writeRfTrackLogToFile(errorString, errorClass);
        callbackContext.error(errorReturn);
    }

    private static class Constants {
        static final int requestCode = 4812;
        static final String action = "com.easyform.rftrack.StartUI";
        static final String packageName = "com.easyform.rftrack";
        static final String RfTrackLogKey = "RfTrackLogKey";
    }
}
