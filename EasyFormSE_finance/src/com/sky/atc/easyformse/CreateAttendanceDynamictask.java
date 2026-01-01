package com.sky.atc.easyformse;

import android.database.Cursor;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;

import com.sky.atc.easyformse.attendance.newattendanceutils.broadcasts.AttendanceNotificationShow;
import com.sky.atc.easyformse.attendance.newattendanceutils.models.TaskData;


import org.apache.cordova.CordovaActivity;
import com.github.megatronking.stringfog.annotation.StringFogIgnore;

//to load html taskchecksheet dynamic json page
@StringFogIgnore
public class CreateAttendanceDynamictask extends CordovaActivity {

    String photo_url,photo_name;
    TaskData mTaskData;
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Bundle b = this.getIntent().getExtras();
        photo_url = b.getString("photo_url");
        photo_name = b.getString("photo_name");
        mTaskData = (TaskData) b.getSerializable(AttendanceNotificationShow.taskDataKey);

        super.loadUrl("file:///android_asset/www2/viewsitedata_task.html"); // default

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
