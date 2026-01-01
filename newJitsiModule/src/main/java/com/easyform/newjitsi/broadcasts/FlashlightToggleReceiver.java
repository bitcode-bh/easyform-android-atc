package com.easyform.newjitsi.broadcasts;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;

import com.easyform.newjitsi.activitys.jitsimeet.VideoRecordingService;
import com.easyform.newjitsi.utils.Utils;

/**
 * Created by NareshChocha on 10/3/2023.
 *
 * @author NareshChocha
 */
public class FlashlightToggleReceiver extends BroadcastReceiver {

    private String isFlashlightOn;

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();


        if (action.matches("com.easyform.newjitsi.Flash_light")) {
            Bundle extras = intent.getExtras();
            isFlashlightOn = extras.getString("isFlashlightOn");

            VideoRecordingService.OnOffFlashLight(isFlashlightOn);

        }
        if (action.matches("com.easyform.newjitsi.screenshot")) {
            Bundle extras = intent.getExtras();
            String task_id = extras.getString("task_id");

            if(task_id == null || task_id.equalsIgnoreCase("")) {

                new Handler(Looper.getMainLooper()).post(new Runnable() {
                    @Override
                    public void run() {
                        String JsonData = "";
                        VideoRecordingService.takescreenshot(JsonData);
                    }
                });
            }
            else {
               // new Handler(Looper.getMainLooper()).post(VideoRecordingService::show_CheecksheetList);
            }
        }

        if (action.matches("com.easyform.newjitsi.camera")) {
            String Cameratype = intent.getExtras().getString("Cameratype");
            VideoRecordingService.backfroncamera(Cameratype);
        }
        if (action.matches("com.easyform.newjitsi.ZoomControlIn")) {
            VideoRecordingService.zoomIn();
        }
        if (action.matches("com.easyform.newjitsi.ZoomControlOut")) {
            VideoRecordingService.zoomOut();
        }
        if (action.matches("com.easyform.newjitsi.ZoomControlClear")) {
            VideoRecordingService.zoomClear();
        }


    }
}
