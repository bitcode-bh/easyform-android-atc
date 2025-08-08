package com.sky.atc.easyformse.attendance.newattendanceutils;

import static android.content.Context.ALARM_SERVICE;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import com.sky.atc.easyformse.DeviceEventsUtils;
import com.sky.atc.easyformse.attendance.NotificationReceiver;
import com.sky.atc.easyformse.attendance.newattendanceutils.attendanceutils.AttendanceTaskUtil;
import com.sky.atc.easyformse.attendance.newattendanceutils.attendanceutils.NotificationType;
import com.sky.atc.easyformse.attendance.newattendanceutils.broadcasts.AttendanceNotificationShow;
import com.sky.atc.easyformse.attendance.newattendanceutils.models.AttendanceData;
import com.sky.atc.easyformse.attendance.newattendanceutils.models.DaysTimes;
import com.sky.atc.easyformse.attendance.newattendanceutils.models.TaskData;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.sqlitewraper;
import com.sky.atc.easyformse.utils.LogUtils;

import net.sqlcipher.Cursor;
import net.sqlcipher.database.SQLiteDatabase;

import java.lang.reflect.Type;
import java.util.Arrays;
import java.util.Calendar;
import java.util.List;

/**
 * Created by NareshChocha on 4/6/2022.
 *
 * @author NareshChocha
 */
public class AttendanceUtil {
    private static List<AttendanceData> attendanceDataList;

    public static List<AttendanceData> getAttendanceDataList() {
        if (attendanceDataList == null) {
            MySharedPreferences mySharedPreferences = sqlitewraper.getSecureShared("AttendanceData");
            String attendanceJson = mySharedPreferences.getString("attendanceJson", "");
            if (!attendanceJson.equalsIgnoreCase("")) {
                Type listType = new TypeToken<List<AttendanceData>>() {
                }.getType();
                AttendanceUtil.setAttendanceDataList(new Gson().fromJson(attendanceJson, listType));
            } else {
                return null;
            }
        }
        return attendanceDataList;
    }

    private static void setAttendanceDataList(List<AttendanceData> attendanceDataList) {
        AttendanceUtil.attendanceDataList = attendanceDataList;
    }

    public static void setAttendanceDataListAndSave(String attendanceJson) {
        MySharedPreferences mySharedPreferences = sqlitewraper.getSecureShared("AttendanceData");
        mySharedPreferences.putString("attendanceJson", attendanceJson);
        Type listType = new TypeToken<List<AttendanceData>>() {
        }.getType();
        setAttendanceDataList(new Gson().fromJson(attendanceJson, listType));
    }

    public static void setAttendanceNotificationAlarm(AttendanceData attendanceData) {
        TaskData mTaskData = new TaskData();
        mTaskData.setModuleId(Integer.parseInt(attendanceData.getFlowId()));
        mTaskData.setCheckSheetId(attendanceData.getChecksheetId());
        SQLiteDatabase database = sqlitewraper.getDatabase();
//        Cursor flowMasterCursor = database
//                .rawQuery("select module_name from flow_master where moduleid=" + mTaskData.getModuleId(), null);
//        flowMasterCursor.moveToLast();
//        int count = flowMasterCursor.getCount();
//        if (count > 0) {
//            mTaskData.setModuleName(flowMasterCursor.getString(0));
//        } else {
//            mTaskData.setModuleName("null");
//            LogUtils.writeAttendanceLogToFile("attendanceData : " + attendanceData + "\n flow_master is null", "setAttendanceNotificationAlarm");
//        }
        mTaskData.setModuleName(attendanceData.getKey());
        mTaskData.setUsername(DeviceEventsUtils.getLoginDetails().get(3));
        mTaskData.setUserId(DeviceEventsUtils.getLoginDetails().get(0));
        mTaskData.setCheckOutBtn(attendanceData.getChekOutBtn());
        mTaskData.setCheckInBtn(attendanceData.getChekInBtn());
        if(attendanceData.getPunchin_Status() == null || attendanceData.getPunchin_Status().equalsIgnoreCase("null"))
        {
            mTaskData.setPunchin_Status("1");
        }
        else {
            mTaskData.setPunchin_Status(attendanceData.getPunchin_Status());
        }

        if(attendanceData.getPunchout_Status() == null || attendanceData.getPunchout_Status().equalsIgnoreCase("null"))
        {
            mTaskData.setPunchout_Status("2");
        }
        else {
            mTaskData.setPunchout_Status(attendanceData.getPunchout_Status());
        }

        Calendar c = Calendar.getInstance();
        int dayOfWeek = c.get(Calendar.DAY_OF_WEEK);

        List<String> dayTime;
        DaysTimes daysTimes = attendanceData.getDaysTimesList().get(0);
        if (dayOfWeek == 1) {
            dayTime = daysTimes.getDayOne();
        } else if (dayOfWeek == 2) {
            dayTime = daysTimes.getDayTwo();
        } else if (dayOfWeek == 3) {
            dayTime = daysTimes.getDayThree();
        } else if (dayOfWeek == 4) {
            dayTime = daysTimes.getDayFor();
        } else if (dayOfWeek == 5) {
            dayTime = daysTimes.getDayFive();
        } else if (dayOfWeek == 6) {
            dayTime = daysTimes.getDaySix();
        } else if (dayOfWeek == 7) {
            dayTime = daysTimes.getDaySeven();
        } else {
            dayTime = Arrays.asList("10:00", "19:30");
        }
        Intent notificationShowIntent = new Intent(sqlitewraper.context, AttendanceNotificationShow.class);

        if (!AttendanceTaskUtil.isAttendanceDone(database, mTaskData.getModuleId(), mTaskData.getModuleName(), mTaskData.getUsername(), mTaskData.getUserId(), "2")) {

                if(mTaskData.getCheckInBtn().equalsIgnoreCase("false"))
                {

                }
                else{
                    notificationShowIntent.putExtra(AttendanceNotificationShow.notificationTypeKey, String.valueOf(NotificationType.CheckIn));
                    notificationShowIntent.putExtra(AttendanceNotificationShow.taskDataKey, new Gson().toJson(mTaskData));

                    PendingIntent attendanceNotificationShowPendingIntent = PendingIntent.getBroadcast(sqlitewraper.context, 1899, notificationShowIntent, PendingIntent.FLAG_CANCEL_CURRENT | PendingIntent.FLAG_IMMUTABLE);

                    setAlarmNotification(sqlitewraper.context,
                            dayTime.get(0)
                            , dayOfWeek, attendanceNotificationShowPendingIntent, String.valueOf(NotificationType.CheckIn));
                }


            // sqlitewraper.context.sendBroadcast(intent);
        }
        else {
            String tid = AttendanceTaskUtil.getTaskMasterTid(database, mTaskData.getModuleId(), mTaskData.getModuleName(), mTaskData.getUsername(), mTaskData.getUserId());

            if (!tid.equalsIgnoreCase("")) {
//                SQLiteDatabase mSqLiteDatabase = sqlitewraper.getDatabase();
//                Cursor c3 = mSqLiteDatabase.rawQuery(
//                                "SELECT username,company_id,user_id FROM  Login_Master",
//                                null);
//                c3.moveToLast();
//                int company_id = 0;
//                if (c3.getCount() > 0) {
//                    String username = c3.getString(0);
//                    company_id = c3.getInt(1);
//                    int user_id = c3.getInt(2);
//
//                    c3.close();
//                }
//               check out btn true hide checkout notification
                if(mTaskData.getCheckOutBtn() == null ||  mTaskData.getCheckOutBtn().equalsIgnoreCase("false"))
                {
                }
                else {

                    String Status = AttendanceTaskUtil.getTaskMasterStatus(database, mTaskData.getModuleId(), mTaskData.getModuleName(), mTaskData.getUsername(), mTaskData.getUserId() , tid);
                    int tripstatus = AttendanceTaskUtil.getTripRuningOrnot(database, tid);

                    boolean istripstart = false;
                    if(tripstatus > 0)
                    {
                        istripstart = true;
                    }
                    else {
                        istripstart = false;
                    }
                    //show check out notification
                    if(Status.equalsIgnoreCase(mTaskData.getPunchout_Status()))
                    {
                        if(istripstart)
                        {
                            notificationShowIntent.putExtra(AttendanceNotificationShow.notificationTypeKey, String.valueOf(NotificationType.CheckOut));
                            notificationShowIntent.putExtra(AttendanceNotificationShow.taskDataKey, new Gson().toJson(mTaskData));

                            PendingIntent attendanceNotificationShowPendingIntent = PendingIntent.getBroadcast(sqlitewraper.context, 1899, notificationShowIntent, PendingIntent.FLAG_CANCEL_CURRENT | PendingIntent.FLAG_IMMUTABLE);

                            setAlarmNotification(sqlitewraper.context,
                                    dayTime.get(1)
                                    , dayOfWeek, attendanceNotificationShowPendingIntent, String.valueOf(NotificationType.CheckOut));
                        }
                    }
                    else {

                        if(istripstart)
                        {
                            notificationShowIntent.putExtra(AttendanceNotificationShow.notificationTypeKey, String.valueOf(NotificationType.CheckOut));
                            notificationShowIntent.putExtra(AttendanceNotificationShow.taskDataKey, new Gson().toJson(mTaskData));

                            PendingIntent attendanceNotificationShowPendingIntent = PendingIntent.getBroadcast(sqlitewraper.context, 1899, notificationShowIntent, PendingIntent.FLAG_CANCEL_CURRENT | PendingIntent.FLAG_IMMUTABLE);

                            setAlarmNotification(sqlitewraper.context,
                                    dayTime.get(1)
                                    , dayOfWeek, attendanceNotificationShowPendingIntent, String.valueOf(NotificationType.CheckOut));
                        }

//                        notificationShowIntent.putExtra(AttendanceNotificationShow.notificationTypeKey, String.valueOf(NotificationType.CheckOut));
//                        notificationShowIntent.putExtra(AttendanceNotificationShow.taskDataKey, new Gson().toJson(mTaskData));
//
//                        PendingIntent attendanceNotificationShowPendingIntent = PendingIntent.getBroadcast(sqlitewraper.context, 1899, notificationShowIntent, PendingIntent.FLAG_CANCEL_CURRENT | PendingIntent.FLAG_IMMUTABLE);
//
//                        setAlarmNotification(sqlitewraper.context,
//                                dayTime.get(1)
//                                , dayOfWeek, attendanceNotificationShowPendingIntent, String.valueOf(NotificationType.CheckOut));
                    }

                }

            }
        }
    }

    //Set alarm for Notification as per time slot
    public static void setAlarmNotification(Context context, String startTime, int dayCount, PendingIntent attendanceNotificationShowPendingIntent,String notificationtype) {
       try{
           Calendar now = Calendar.getInstance();
           if(notificationtype.equalsIgnoreCase("CheckIn"))
           {
               Calendar calendar = Calendar.getInstance();
               String[] separated = startTime.split(":");
               calendar.set(Calendar.HOUR_OF_DAY, Integer.parseInt(separated[0])); // hour 0
               calendar.set(Calendar.MINUTE, Integer.parseInt(separated[1])); // minute 1
               calendar.set(Calendar.DAY_OF_WEEK, dayCount);
               long currentTimeInMillis = calendar.getTimeInMillis();

               Log.e("attendanceDataList : ", "currentTimeInMillis " + currentTimeInMillis);
               AlarmManager alarmManager = (AlarmManager) context.getSystemService(ALARM_SERVICE);
               if (alarmManager != null) {
                   alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, currentTimeInMillis, attendanceNotificationShowPendingIntent);
               } else {
                   LogUtils.writeAttendanceLogToFile("alarmManager : Null ", "NotificationReceiver");
               }
           }
           else {
               Calendar punchOutTime = Calendar.getInstance();
               String[] separated = startTime.split(":");
               punchOutTime.set(Calendar.HOUR_OF_DAY, Integer.parseInt(separated[0])); // hour 0
               punchOutTime.set(Calendar.MINUTE, Integer.parseInt(separated[1])); // minute 1
               punchOutTime.set(Calendar.DAY_OF_WEEK, dayCount);
               long currentTimeInMillis = punchOutTime.getTimeInMillis();

                   AlarmManager alarmManager = (AlarmManager) context.getSystemService(ALARM_SERVICE);
                   if (alarmManager != null) {
                       alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, currentTimeInMillis, attendanceNotificationShowPendingIntent);
                   } else {
                       LogUtils.writeAttendanceLogToFile("alarmManager : Null ", "NotificationReceiver");
                   }
           }

       }
       catch (Exception e)
       {
           Log.d("Exception Attandeance",e.toString());
       }

    }


}
