package com.sky.atc.easyformse.attendance;

import android.content.SharedPreferences;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import com.sky.atc.easyformse.sqlitewraper;
import com.sky.atc.easyformse.utils.LogUtils;

import net.sqlcipher.Cursor;
import net.sqlcipher.database.SQLiteDatabase;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;

import io.michaelrocks.paranoid.Obfuscate;

//AttandaceValues class to for generate class
@Obfuscate
public class AttandanceValues {
    static int saveAttandanceValuesCount = 0;

    //Will call from login_plug to Generate Notification for Attendance
    public static void saveAttandanceValues(String attendanceValues) {
        try {
            JSONArray jsonArray = new JSONArray(attendanceValues);
            JSONObject jsonObject = jsonArray.getJSONObject(0);
            String value = jsonObject.getString("Value");//JSON of Days with time
            String checkSheetID = jsonObject.getString("Checksheet_id");
            String flowID = jsonObject.getString("flow_id");
            String ischeckin = jsonObject.getString("Chek_in_btn");

            SQLiteDatabase database = sqlitewraper.getDatabase();
            Cursor c1 = database
                    .rawQuery("select checksheet_id,module_name from flow_master where moduleid=" + flowID, null);
            c1.moveToFirst();

            if (c1.getCount() == 0) {
                c1.close();
                new Handler(Looper.getMainLooper()).postDelayed(() -> {
                    if (AttandanceValues.saveAttandanceValuesCount > 2) {
                        LogUtils.writeAttendanceLogToFile("attendanceValues : " + attendanceValues + "\n flow_master is null", "saveAttandanceValues");
                    } else {

                        saveAttandanceValues(attendanceValues);
                        AttandanceValues.saveAttandanceValuesCount++;
                    }
                }, 20000);
                return;
            } else {
                AttandanceValues.saveAttandanceValuesCount=0;
                c1.close();
            }


            //check in button false indicate
            //simple notification which is used for opening login screen once task is updated next notification will be set from sql class
            //check in button true indicates notification with ChekIN-CheckOut buttons
//           AttendanceClass.setAttendanceforWeek(value);

            Calendar c = Calendar.getInstance();
            int dayOfWeek = c.get(Calendar.DAY_OF_WEEK);

            //Save values to shared preferences
            SharedPreferences pref = sqlitewraper.context.getSharedPreferences("MyPref", 0);
            SharedPreferences.Editor editor = pref.edit();
            editor.putString("FLOWID", String.valueOf(flowID)); // Saving string
            editor.putString("Checksheet_id", checkSheetID); // Saving string
            editor.putString("daysstring", value); // Saving string
            editor.putString("ischeckin", ischeckin); // Saving string
            editor.apply();
            if (!ischeckin.equalsIgnoreCase("true")) {
                LogUtils.writeAttendanceLogToFile("ischeckin : " + ischeckin, "saveAttandanceValues");
            }
            Cursor c2_n = database.rawQuery(
                    "select tid,notiflag,millisecond from task_master where moduleid=" + flowID, null);
            c2_n.moveToLast();
            int count = c2_n.getCount();
            if (count > 0) {
                String notiflag = c2_n.getString(1);
                String milliseconds = c2_n.getString(2);
                milliseconds = AttendanceClass.convertDate(milliseconds, "dd-MMM-yyyy");

                Date mDate = Calendar.getInstance().getTime();
                SimpleDateFormat df = new SimpleDateFormat("dd-MMM-yyyy");
                String currentData = df.format(mDate);

                if (notiflag.equalsIgnoreCase("1")) {
                    //To Generate Notification
                        CheckSheetJsonConstant.getNotificationTime(0, dayOfWeek, value);
                } else {
                    if (!milliseconds.equalsIgnoreCase(currentData)) {
                        //To Generate Notification
                            CheckSheetJsonConstant.getNotificationTime(0, dayOfWeek, value);
                    }
                }
            } else {
                    //To Generate Notification
                    CheckSheetJsonConstant.getNotificationTime(0, dayOfWeek, value);
            }

        } catch (JSONException e) {
            LogUtils.writeAttendanceLogToFile("JSONException : " + e.toString(), "saveAttandanceValues");
            e.printStackTrace();
        }
    }
}
