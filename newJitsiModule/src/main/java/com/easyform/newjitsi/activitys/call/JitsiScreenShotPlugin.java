package com.easyform.newjitsi.activitys.call;

import android.util.Log;
import android.widget.Toast;

import com.easyform.newjitsi.activitys.drawing.CameraPreviewActivity;
import com.easyform.newjitsi.activitys.jitsimeet.CustomJitsiMeetActivity;
import com.easyform.newjitsi.activitys.jitsimeet.CustomJitsiMeetViewModel;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;

public class JitsiScreenShotPlugin extends CordovaPlugin {

    CallbackContext callbackContext;
    String JsonData ;
    private static CallbackContext pendingCallback;
    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        this.callbackContext = callbackContext;

        try{

            JsonData =  args.getJSONObject(0).getString("data");
            Log.d("JsonData",JsonData);
            CustomJitsiMeetActivity activity =
                    CustomJitsiMeetActivity.getInstance();
            if (activity == null) {
                callbackContext.error("CustomJitsiMeetActivity not running");
                return true;
            }
            pendingCallback = callbackContext;

            PluginResult pr =
                    new PluginResult(PluginResult.Status.NO_RESULT);
            pr.setKeepCallback(true);
            callbackContext.sendPluginResult(pr);

            cordova.getActivity().runOnUiThread(() -> {
                try {
                    activity.sendnotification(JsonData);
                } catch (Exception e) {
                    Log.d("Exception",e.toString());
                }

            });

            Toast.makeText(cordova.getActivity(), "Please wait photo capturing", Toast.LENGTH_SHORT).show();
        }
        catch (Exception e)
        {
            this.callbackContext.error("error: " + e.toString());
            return false;
        }


        return true;
    }

    public static void sendSuccessToJS(String message) {
        if (pendingCallback != null) {
            PluginResult result =
                    new PluginResult(PluginResult.Status.OK, message);
            pendingCallback.sendPluginResult(result);
            pendingCallback = null; // release callback
        }
    }
}
