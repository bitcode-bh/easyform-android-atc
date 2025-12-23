package com.sky.atc.easyformse.plugins;

import static com.sky.atc.easyformse.sqlitewraper.context;

import android.app.Activity;
import android.content.Intent;
import android.database.Cursor;
import android.os.Bundle;

import com.sky.atc.easyformse.DeviceEventsUtils;
import com.sky.atc.easyformse.RedirectPageView;
import com.sky.atc.easyformse.attendance.newattendanceutils.NotificationUtil;
import com.sky.atc.easyformse.attendance.newattendanceutils.attendanceutils.AttendanceTaskUtil;
import com.sky.atc.easyformse.attendance.newattendanceutils.broadcasts.AttendanceNotificationShow;
import com.sky.atc.easyformse.attendance.newattendanceutils.models.TaskData;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.sqlitewraper;
import com.sky.atc.easyformse.utils.LogUtils;

import net.sqlcipher.database.SQLiteDatabase;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Created by NareshChocha on 6/15/2023.
 *
 * @author NareshChocha
 */
// Self attendance single user with dynamic taskchecksheetjson

public class AttendanceTaskCreatePlugin extends CordovaPlugin {
    CallbackContext callbackContext;

    TaskData mTaskData;
    String TaskCheckSheetJSon;

    String photo_url,photo_name;
    MySharedPreferences pref;
    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        this.callbackContext = callbackContext;

        JSONObject jsonObject = args.getJSONObject(0);
        pref = sqlitewraper.getSecureShared("MyPref");

        Bundle mBundle =cordova.getActivity().getIntent().getExtras();
        if(mBundle != null)
        {
            photo_url = mBundle.getString("photo_url");
            photo_name = mBundle.getString("photo_name");
            mTaskData = (TaskData) mBundle.getSerializable(AttendanceNotificationShow.taskDataKey);
        }

        if(jsonObject != null)
        {
            try {
                TaskCheckSheetJSon = jsonObject.getString("data");
//            insert into taskmaster with dynamic tasckchecksheetJson
                AttendanceTaskUtil.insertIntoTaskmaster(sqlitewraper.getDatabase(),
                        TaskCheckSheetJSon,
                        mTaskData.getUsername() + "",
                        mTaskData.getUserId() + "",
                        mTaskData.getModuleId(),
                        mTaskData.getCheckSheetId() + "",
                        mTaskData.getModuleName() + "",
                        photo_url + "",
                        photo_name + "","true",mTaskData.getCheckOutBtn(), mTaskData.getPunchin_Status(),
                        mTaskData.getPunchout_Status(),mTaskData.getFacedetection());



//                if(cordova != null)
//                {
//                    Intent mIntent = new Intent(cordova.getActivity(), RedirectPageView.class);
//                    this.cordova.startActivityForResult(this, mIntent, 0);
//                    return true;
//                }
                if(this.cordova != null) {
                    String attendance_tid = pref.getString("attendance_tid", "");
                  //  String server_task_id = pref.getString("Server_task_id","");

                    String CheckLastCheckinNoti = pref.getString("LastCheckinNoti","");
                    if(CheckLastCheckinNoti.equalsIgnoreCase("true"))
                    {
                        NotificationUtil.cancelNotification(context,0);
                        pref.putString("LastCheckinNoti", "");
                        pref.commit();
                    }
                    JSONObject object = new JSONObject();
                    JSONArray jsonArray = new JSONArray();
                    object.put("tid", attendance_tid);
                  //  object.put("server_task_id", server_task_id);
                    jsonArray.put(object);
                    this.callbackContext.success(jsonArray.toString());
                    return true;
                }

            }
            catch (Exception e)
            {
                this.callbackContext.error("error: " + e.toString());
                return false;
            }

        }
        else {
            LogUtils.writeAttendanceLogToFile("jsonObject is null", "AttendancePlugin");
            this.callbackContext.error("error: jsonObject is null");
            return false;
        }

        return false;
    }

}
