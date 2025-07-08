package com.sky.atc.easyformse;

import android.os.Build;
import android.os.Bundle;
import android.util.Log;

import com.sky.atc.easyformse.attendance.newattendanceutils.broadcasts.AttendanceNotificationShow;
import com.sky.atc.easyformse.attendance.newattendanceutils.models.TaskData;
import com.sky.atc.easyformse.datautils.MySharedPreferences;

import org.apache.cordova.CordovaActivity;

import io.michaelrocks.paranoid.Obfuscate;

//to page redirect after add attendance successfully
@Obfuscate
public class RedirectPageView extends CordovaActivity {

    String login_key;
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
//     u_c1  getting NA or blank load html page

        B_new b = new B_new();
        String u_c1 = b.GetValue();

        if(u_c1.equalsIgnoreCase("NA") || u_c1.equalsIgnoreCase(""))
        {
            super.loadUrl("file:///android_asset/www2/Login.html");
        }
        else {
            super.loadUrl("file:///android_asset/www2/selection.html"); // default
        }


    }

    public void onReceivedError(int errorCode, String description,
                                String failingUrl) {

        if (failingUrl.contains("?")) {
            Log.v("LOG", "failing url:" + failingUrl);
            final int sdkVersion = Integer.parseInt(Build.VERSION.SDK);
            if (sdkVersion > 9) {

                this.loadUrl(failingUrl);
            } else {
                this.loadUrl("file:///android_asset/tableofcontents.html");
            }

        }
        return;

    }

}
