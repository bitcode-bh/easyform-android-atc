package com.sky.atc.easyformse.plugins;

import android.app.Activity;
import android.content.Intent;
import android.util.Log;
import android.widget.Toast;

import com.sky.atc.easyformse.AppDownloadActivity;
import com.sky.atc.easyformse.DeviceEventsUtils;
import com.sky.atc.easyformse.VideoURLDownloadActivity;
import com.sky.atc.easyformse.sqlitewraper;
import com.sky.atc.easyformse.utils.LogUtils;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;

public class VideoDownloadPlugin extends CordovaPlugin {

    public static final String TYPE_NONE = "NONE";
    public CallbackContext callbackContext;
    String video_url;
    @Override
    public boolean execute(String action, JSONArray args,
                           CallbackContext callbackContext) throws JSONException {
        try {
            this.callbackContext = callbackContext;
            video_url = args.getJSONObject(0).getString("video_url");

            Intent i = new Intent(sqlitewraper.context, VideoURLDownloadActivity.class);
            i.putExtra("video_url", video_url);

            this.cordova.startActivityForResult(this, i, 101);
            return true;
        }
        catch ( Exception e)
        {
            this.callbackContext.success("Error");
            return false;
        }
    }


    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent intent) {
        super.onActivityResult(requestCode, resultCode, intent);

        if (requestCode == requestCode && resultCode == Activity.RESULT_OK) {
            if (intent.getExtras() != null) {
                String status = null;
                try {
                    String success = intent.getExtras().getString("success");
                    //Log.d("Videoplugin",success);
                    this.callbackContext.success(success);
                } catch (Exception e) {
                    LogUtils.writeAttendanceLogToFile("Exception :" + e.toString(), "onActivityResult GroupAttendancePlugin");
                    this.callbackContext.error("error:  " + e.toString());
                }
            }
        }
    }
}
