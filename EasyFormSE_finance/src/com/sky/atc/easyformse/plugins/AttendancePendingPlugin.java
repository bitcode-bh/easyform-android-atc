package com.sky.atc.easyformse.plugins;

import static com.sky.atc.easyformse.sqlitewraper.context;

import android.content.Intent;

import com.sky.atc.easyformse.CreateAttendanceDynamictask;
import com.sky.atc.easyformse.DeviceEventsUtils;
import com.sky.atc.easyformse.FaceDetactionActivity;
import com.sky.atc.easyformse.attendance.newattendanceutils.AttendanceUtil;
import com.sky.atc.easyformse.attendance.newattendanceutils.attendanceutils.AttendanceTaskUtil;
import com.sky.atc.easyformse.attendance.newattendanceutils.broadcasts.AttendanceNotificationShow;
import com.sky.atc.easyformse.attendance.newattendanceutils.models.AttendanceData;
import com.sky.atc.easyformse.attendance.newattendanceutils.models.TaskData;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.sqlitewraper;
import com.sky.atc.easyformse.utils.LogUtils;

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
// for click pending attendance msg from home page

public class AttendancePendingPlugin extends CordovaPlugin {
    CallbackContext callbackContext;


    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        this.callbackContext = callbackContext;

        try {
//                TaskData mTaskData = new Gson().fromJson(jsonObject.getJSONObject("attendanceData").toString(), TaskData.class);
            AttendanceData mAttendanceData = AttendanceUtil.getAttendanceDataList().get(0);
            TaskData mTaskData = new TaskData();
            mTaskData.setCheckSheetId(mAttendanceData.getChecksheetId());
//            mTaskData.setModuleName(mAttendanceData.getKey());
            if(mAttendanceData.getFlow_name() == null || mAttendanceData.getFlow_name().equalsIgnoreCase("null") )
            {
                mTaskData.setModuleName(mAttendanceData.getKey());
            }
            else {
                mTaskData.setModuleName(mAttendanceData.getFlow_name());
            }
            mTaskData.setModuleId(Integer.parseInt(mAttendanceData.getFlowId()));
            mTaskData.setUserId(DeviceEventsUtils.getLoginDetails().get(0));
            mTaskData.setUsername(DeviceEventsUtils.getLoginDetails().get(3));
            mTaskData.setCheckOutBtn(mAttendanceData.getChekOutBtn());
            mTaskData.setCheckInBtn(mAttendanceData.getChekInBtn());

            if(mAttendanceData.getPunchin_Status() == null || mAttendanceData.getPunchin_Status().equalsIgnoreCase("null"))
            {
                mTaskData.setPunchin_Status("1");
            }
            else {
                mTaskData.setPunchin_Status(mAttendanceData.getPunchin_Status());
            }

            if(mAttendanceData.getPunchout_Status() == null || mAttendanceData.getPunchout_Status().equalsIgnoreCase("null"))
            {
                mTaskData.setPunchout_Status("2");
            }
            else {
                mTaskData.setPunchout_Status(mAttendanceData.getPunchout_Status());
            }
            mTaskData.setFacedetection(mAttendanceData.getFacedetection());

            if(mAttendanceData.getFacedetection() == null || mAttendanceData.getFacedetection().equalsIgnoreCase("null") || mAttendanceData.getFacedetection().equalsIgnoreCase("true"))
            {
               // if (!AttendanceTaskUtil.isAttendanceDone(sqlitewraper.getDatabase(), mTaskData.getModuleId(), mTaskData.getModuleName(), mTaskData.getUsername(), mTaskData.getUserId(), "1")) {

                    mTaskData.getCheckOutBtn();
                    mTaskData.getCheckInBtn();
                    MySharedPreferences pref = sqlitewraper.getSecureShared("MyPref");
                    pref.putString("task_checksheet_id", mAttendanceData.getChecksheetId());
                    pref.putString("flow_id", String.valueOf(mAttendanceData.getFlowId()));

                    if(mAttendanceData.getFlow_name() == null || mAttendanceData.getFlow_name().equalsIgnoreCase("null") )
                    {
                        mTaskData.setModuleName(mAttendanceData.getKey());
                        pref.putString("flow_name", mAttendanceData.getKey());
                    }
                    else {
                        mTaskData.setModuleName(mAttendanceData.getFlow_name());
                        pref.putString("flow_name", mAttendanceData.getFlow_name());
                    }

                    pref.commit();

                    if (cordova != null) {
                        Intent faceRecognizerActivityIntent = new Intent(cordova.getActivity(), FaceDetactionActivity.class);
                        faceRecognizerActivityIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        faceRecognizerActivityIntent.putExtra("IsCheckInNoti", "true");
                        faceRecognizerActivityIntent.putExtra(AttendanceNotificationShow.taskDataKey, mTaskData);
                        this.cordova.startActivityForResult(this, faceRecognizerActivityIntent, 0);
                        return true;
                    }
               // }
            }
            else {

                Intent LoadHtmlpage = new Intent(context, CreateAttendanceDynamictask.class);
                LoadHtmlpage.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                LoadHtmlpage.putExtra("photo_url","");
                LoadHtmlpage.putExtra("photo_name","");
                LoadHtmlpage.putExtra(AttendanceNotificationShow.taskDataKey, mTaskData);
                context.startActivity(LoadHtmlpage);
                return true;
            }



        } catch (Exception e) {
            this.callbackContext.error("error: " + e.toString());
            return false;
        }
        return false;
    }

}
