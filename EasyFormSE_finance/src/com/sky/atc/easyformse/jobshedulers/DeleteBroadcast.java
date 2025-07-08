package com.sky.atc.easyformse.jobshedulers;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

import com.sky.atc.easyformse.sqlitewraper;
import com.sky.atc.easyformse.utils.LogUtils;

import net.sqlcipher.Cursor;
import net.sqlcipher.database.SQLiteDatabase;

import java.io.File;
import java.util.Calendar;
import java.util.Date;
import java.util.GregorianCalendar;
import java.util.concurrent.TimeUnit;

import io.michaelrocks.paranoid.Obfuscate;

/**
 * this Broadcast Receiver is use for deleting old task
 * <p>
 * this is Broadcast send by AlarmManager and AlarmManager set {@link #setDeleteBroadcastAlarm(Context)}
 */
@Obfuscate
public class DeleteBroadcast extends BroadcastReceiver {
    private SQLiteDatabase database;
    private final static long alarmIntervalMillis = TimeUnit.MILLISECONDS.convert(1, TimeUnit.DAYS);

    @Override
    public void onReceive(Context context, Intent intent) {
        database = sqlitewraper.getDatabase();

        deleteOldTaskData();

    }

    /**
     * SET alarm for daily check for old task
     * this alarm will set from {@link com.sky.atc.easyformse.MainActivity}
     */
    public void setDeleteBroadcastAlarm(Context context) {
        Log.d("##SETALART", "");

        Calendar calendar = Calendar.getInstance();
        calendar.setTimeInMillis(System.currentTimeMillis());
        calendar.set(Calendar.HOUR_OF_DAY, 10);
        calendar.set(Calendar.MINUTE, 10);

        AlarmManager mAlarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        Intent deleteBroadcastIntent = new Intent(context, DeleteBroadcast.class);
        PendingIntent pendingBroadcast = PendingIntent.getBroadcast(context, 0, deleteBroadcastIntent, 0);
        assert mAlarmManager != null;
        mAlarmManager.cancel(pendingBroadcast);
        mAlarmManager.setRepeating(AlarmManager.RTC_WAKEUP, calendar.getTimeInMillis(), alarmIntervalMillis, pendingBroadcast); // Millisec * Second * Minute
//
    }

    //Delete 30 days old data from database for below tables
    public void deleteOldTaskData() {
        try {
            Calendar cal = GregorianCalendar.getInstance();
            cal.setTime(new Date());
            cal.add(Calendar.DAY_OF_YEAR, -30);
            long date2 = cal.getTimeInMillis();

            Cursor c2 = database
                    .rawQuery("SELECT tid,server_task_id from task_master LEFT JOIN delete_old_task on task_master.moduleid = " +
                            "delete_old_task.flow_id and task_master.status = delete_old_task.allowstatus " +
                            "where delete_old_task.id IS NULL and task_master.millisecond <= " + date2 + " AND task_master.flag = 2", null);

            c2.moveToFirst();
            int count = c2.getCount();
            if (count > 0) {
                for (int i = 0; i < c2.getCount(); i++) {
                    String tid = c2.getString(0);
                    String serverTaskId = c2.getString(1);
                    delete_p_master(tid);
                    delete_f_master(tid);
                    delete_task_master(tid);
                    // inserting delete task in to table
                    insertToDeleteTask(tid, serverTaskId);
                    c2.moveToNext();
                }
            }
            c2.close();
        } catch (Exception e) {
            LogUtils.writeDeleteOldTaskLogToFile("Exception:: " + e.toString(), DeleteBroadcast.class.getSimpleName() + " deleteOldTaskData()");
        }
    }

    private void insertToDeleteTask(String tid, String serverTaskId) {
        try {
            ContentValues mContentValues = new ContentValues();
            mContentValues.put("tid", tid);
            mContentValues.put("server_task_id", serverTaskId);
            mContentValues.put("dataTime", new Date().toString());
            database.insert("deleted_task", null, mContentValues);
        } catch (Exception e) {
            LogUtils.writeDeleteOldTaskLogToFile("Exception:: " + e.toString(), DeleteBroadcast.class.getSimpleName() + " insertToDeleteTask()");
        }
    }

    //delete p_master data(photo)
    public void delete_p_master(String tid) {
        try {
            Cursor c2 = database
                    .rawQuery("SELECT p_url,pid from p_master where tid = " + tid, null);

            c2.moveToFirst();
            int count = c2.getCount();
            if (count > 0) {

                for (int i = 0; i < c2.getCount(); i++) {

                    String imgurl = c2.getString(0);
                    String pid = c2.getString(1);
                    File fdelete = new File(imgurl);
                    if (fdelete.exists() && fdelete.isFile()) {
                        if (fdelete.delete()) {
                            System.out.println("file Deleted :" + imgurl);
                        } else {
                            LogUtils.writeDeleteOldTaskLogToFile("file not Deleted:: " + imgurl, DeleteBroadcast.class.getSimpleName() + " delete_p_master()");
                        }
                    }
                    try {
                        database.execSQL("DELETE FROM p_master WHERE pid=" + pid);
                    } catch (Exception e) {
                        LogUtils.writeDeleteOldTaskLogToFile("Exception:: " + e.toString(), DeleteBroadcast.class.getSimpleName() + " delete_p_master()");
                    }

                    c2.moveToNext();
                }
            }
            c2.close();
        } catch (Exception e) {
            LogUtils.writeDeleteOldTaskLogToFile("TopException:: " + e.toString(), DeleteBroadcast.class.getSimpleName() + " delete_p_master()");
        }

    }

    //delete f_master data(Log)
    public void delete_f_master(String tid) {
        try {
            database.execSQL("DELETE FROM f_master WHERE tid=" + tid);
        } catch (Exception e) {
            LogUtils.writeDeleteOldTaskLogToFile("Exception:: " + e.toString(), DeleteBroadcast.class.getSimpleName() + " delete_f_master()");
        }

    }

    //delete task_master(task)
    public void delete_task_master(String tid) {
        try {
            database.execSQL("DELETE FROM task_master WHERE tid=" + tid);
            database.execSQL("DELETE FROM task_master_history WHERE tid=" + tid);
        } catch (Exception e) {
            LogUtils.writeDeleteOldTaskLogToFile("Exception:: " + e.toString(), DeleteBroadcast.class.getSimpleName() + " delete_task_master()");
        }

    }

}