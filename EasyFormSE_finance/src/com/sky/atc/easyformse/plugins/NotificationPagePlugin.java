package com.sky.atc.easyformse.plugins;

import com.sky.atc.easyformse.DeviceEventsUtils;

import static com.sky.atc.easyformse.sqlitewraper.context;

import android.annotation.SuppressLint;
import android.app.ActivityManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.view.View;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import com.sky.atc.easyformse.NotificationActivity;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.sqlitewraper;
import com.sky.atc.easyformse.trip.FloatingBubbleService;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;

import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.Set;

/**
 * Created by NareshChocha on 9/25/2024.
 *
 * @author NareshChocha
 */
public class NotificationPagePlugin extends CordovaPlugin {
    CallbackContext callbackContext;

    String notificationTitle;
    String ReadNoti;
    String addnotificationlist;
    ArrayList<String> mStrings;
    SharedPreferences sharedPreferences;
    SharedPreferences.Editor mEditor;

    @SuppressLint("SuspiciousIndentation")
    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        this.callbackContext = callbackContext;
        sharedPreferences = sqlitewraper.context.getSharedPreferences("Notivalue", 0);

        if (this.callbackContext != null) {
            notificationTitle = sharedPreferences.getString("notification_title", "");
            ReadNoti = sharedPreferences.getString("readnoti", "yes");
            addnotificationlist = sharedPreferences.getString("notification_list", null);


            Gson gson = new Gson();
            Type type = new TypeToken<ArrayList<String>>() {}.getType();
            mStrings = gson.fromJson(addnotificationlist, type);

            if(mStrings == null )
            {
                NotificationActivity.textToSpeech.stop();
                NotificationActivity.textToSpeech.shutdown();
                this.callbackContext.success("success");
            }
            else {
                NotificationActivity.textToSpeech.stop();
                NotificationActivity.textToSpeech.shutdown();
                Intent activityIntent = new Intent(context, NotificationActivity.class);
                activityIntent.putExtra("notification_title", notificationTitle);
                activityIntent.putExtra("readnoti", ReadNoti);
                activityIntent.putExtra("notification_list", mStrings);
                activityIntent.putExtra("IsFromPlugin", "true");
                activityIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(activityIntent);
                this.callbackContext.success("success");
            }
            boolean check4 = DeviceEventsUtils.isMyServiceRunning(context, FloatingBubbleService.class.getName());
            if (check4) {
                int count = mStrings.size();
                FloatingBubbleService.mTextViewNotificationCount.setText(String.valueOf(count));
            }

            return true;
        }

        return false;
    }

}
