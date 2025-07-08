package com.sky.atc.easyformse.attendance.newattendanceutils.broadcasts;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;

import com.commonsware.cwac.wakeful.WakefulIntentService;
import com.sky.atc.easyformse.CreateAttendanceDynamictask;
import com.sky.atc.easyformse.DeviceEventsUtils;
import com.sky.atc.easyformse.FaceDetactionActivity;
import com.sky.atc.easyformse.attendance.newattendanceutils.AttendanceUtil;
import com.sky.atc.easyformse.attendance.newattendanceutils.NotificationUtil;
import com.sky.atc.easyformse.attendance.newattendanceutils.attendanceutils.AttendanceTaskUtil;
import com.sky.atc.easyformse.attendance.newattendanceutils.attendanceutils.NotificationType;
import com.sky.atc.easyformse.attendance.newattendanceutils.models.AttendanceData;
import com.sky.atc.easyformse.attendance.newattendanceutils.models.TaskData;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.f_upload_new_structure;
import com.sky.atc.easyformse.sqlitewraper;

/**
 * Created by NareshChocha on 4/6/2022.
 *
 * @author NareshChocha
 */
public class AttendanceNotificationAction extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        NotificationUtil.cancelNotification(context);
        Bundle myBundle = intent.getExtras();
        if (myBundle != null && myBundle.containsKey(AttendanceNotificationShow.notificationTypeKey)) {
            NotificationType notificationType = (NotificationType) myBundle.getSerializable(AttendanceNotificationShow.notificationTypeKey);
            if (notificationType == NotificationType.CheckIn) {
                AttendanceData mAttendanceData = AttendanceUtil.getAttendanceDataList().get(0);
                MySharedPreferences pref = sqlitewraper.getSecureShared("MyPref");
                pref.putString("task_checksheet_id", mAttendanceData.getChecksheetId());
                pref.putString("flow_id", String.valueOf(mAttendanceData.getFlowId()));
                pref.putString("flow_name", mAttendanceData.getKey());
                pref.commit();

                Intent faceRecognizerActivityIntent = new Intent(context, FaceDetactionActivity.class);
                faceRecognizerActivityIntent.putExtras(myBundle);
                faceRecognizerActivityIntent.putExtra("IsCheckInNoti","true");
                faceRecognizerActivityIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(faceRecognizerActivityIntent);

            } else if (notificationType == NotificationType.CheckOut && myBundle.containsKey(AttendanceNotificationShow.taskDataKey)) {
                TaskData mTaskData = (TaskData) myBundle.getSerializable(AttendanceNotificationShow.taskDataKey);
                String tid = AttendanceTaskUtil.getTaskMasterTid(sqlitewraper.getDatabase(), mTaskData.getModuleId(), mTaskData.getModuleName(), mTaskData.getUsername(), mTaskData.getUserId());
                AttendanceTaskUtil.insertPunchMaster(sqlitewraper.getDatabase(), mTaskData.getUsername(), tid,
                        DeviceEventsUtils.getLoginDetails().get(2), mTaskData.getUserId(), 1,mTaskData.getPunchout_Status());
                AttendanceTaskUtil.insertTaskmasterHistory(sqlitewraper.getDatabase(), Integer.parseInt(tid),mTaskData.getPunchin_Status(),mTaskData.getPunchout_Status());
                AttendanceTaskUtil.updatelatplug(sqlitewraper.getDatabase(),tid,mTaskData.getPunchout_Status()); // upload trip
                //call upload service
                Intent fUploadNewStructureIntent = new Intent(context, f_upload_new_structure.class);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(fUploadNewStructureIntent);
                } else {
                    WakefulIntentService.sendWakefulWork(context, fUploadNewStructureIntent);
                }
            }
        }


    }
}
