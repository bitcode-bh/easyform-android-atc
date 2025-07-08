package com.sky.atc.easyformse.attendance;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

import com.sky.atc.easyformse.utils.LogUtils;

import java.util.Calendar;

import io.michaelrocks.paranoid.Obfuscate;

//To Show Notification on Received Alarm
@Obfuscate
public class NotificationReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        Bundle extras = intent.getExtras();
        int userGetDay = 0;
        int timslot = 0;

        if (extras != null) {
            userGetDay = extras.getInt("day");
            timslot = extras.getInt("timeslot");
        } else {
            LogUtils.writeAttendanceLogToFile("extras: Null ", "NotificationReceiver");
        }

        Calendar c = Calendar.getInstance();
        int currentDayOfWeek = c.get(Calendar.DAY_OF_WEEK);

//        once Brodcast is receive for attandance will show check or check out notification
        if (currentDayOfWeek == userGetDay) {
            //Showing Notification
            AttendanceClass.showNotification(userGetDay, timslot);
        } else {
            LogUtils.writeAttendanceLogToFile("userGetDay: " + userGetDay + " currentDayOfWeek" + currentDayOfWeek, "NotificationReceiver");
        }
    }
}