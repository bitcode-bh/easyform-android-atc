package com.sky.atc.easyformse.attendance;

import android.app.NotificationManager;
import android.content.SharedPreferences;
import com.sky.atc.easyformse.sqlitewraper;
import java.util.Calendar;
import com.github.megatronking.stringfog.annotation.StringFogIgnore;
import static android.content.Context.NOTIFICATION_SERVICE;

@StringFogIgnore
public class AttandanceUtils {

    public static  void aftertaskCreatedReg(){

        SharedPreferences pref = sqlitewraper.context.getSharedPreferences("MyPref", 0);
        String ischeckIN = pref.getString("ischeckin", "true");

        if (ischeckIN.equalsIgnoreCase("false")) {

            cancleNotification();
            Calendar c = Calendar.getInstance();
            int dayOfWeek = c.get(Calendar.DAY_OF_WEEK);

            pref = sqlitewraper.context.getSharedPreferences("MyPref", 0);
            String daysstring = pref.getString("daysstring", "");

            int timeSlot = 0;
            dayOfWeek = dayOfWeek + 1;
            if (dayOfWeek == 8) {
                dayOfWeek = 1;
            }
            CheckSheetJsonConstant.getNotificationTime(timeSlot, dayOfWeek, daysstring);
        }
    }

    private static void cancleNotification() {

        NotificationManager manager = (NotificationManager) sqlitewraper.context.getSystemService(NOTIFICATION_SERVICE);
        if (manager != null) {
            manager.cancel(1029);
        }
    }
}
