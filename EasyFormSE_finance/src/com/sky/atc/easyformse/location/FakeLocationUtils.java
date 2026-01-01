package com.sky.atc.easyformse.location;

import android.content.ContentValues;
import android.text.format.DateFormat;
import android.util.Log;

import com.sky.atc.easyformse.sqlitewraper;

import net.sqlcipher.Cursor;
import net.sqlcipher.database.SQLiteDatabase;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

//To insert Fae location enrty to databse
@StringFogIgnore
public class FakeLocationUtils {



    private static SQLiteDatabase database= sqlitewraper.getDatabase();

    private static void insertDatabase() {

        String username = "";
        String user_id = "";
        String appid = "";
        String appversion = "";

        Cursor c1 = database
                .rawQuery(
                        "select username,user_id,appid,appversion from Login_Master", null);
        c1.moveToFirst();
        int count = c1.getCount();

        if (count > 0) {
            for (int i = 0; i < c1.getCount(); i++) {
                username = c1.getString(0);
                user_id = c1.getString(1);
                appid = c1.getString(2);
                appversion = c1.getString(3);
            }
        }
        c1.close();
        ContentValues latc = new ContentValues();
        latc.put("username", username);
        latc.put("user_id", user_id);
        latc.put("appid", appid);
        latc.put("appversion", appversion);
        latc.put("milliseonds", System.currentTimeMillis());
        latc.put("flag", "0");
        long temp = database.insert("fake_location", null, latc);
        Log.d("##FakeLocation", String.valueOf(temp));
    }

    //restrict multiple fake location alert entry
    //allow only single entry per day
    public static void checkTodaysEntryandInsertIntoDatabse(){

        Cursor c1 = database
                .rawQuery(
                        "select milliseonds from fake_location", null);
        c1.moveToLast();
        int count = c1.getCount();
        if (count > 0) {
            String milliseconds = c1.getString(0);
            milliseconds = convertDate(milliseconds, "dd-MMM-yyyy");
            Date c = Calendar.getInstance().getTime();
            SimpleDateFormat df = new SimpleDateFormat("dd-MMM-yyyy");
            String formattedDate = df.format(c);

            if (!milliseconds.equalsIgnoreCase(formattedDate)){
                insertDatabase();
            }
        }else {
            insertDatabase();
        }
        c1.close();
    }

    private static String convertDate(String dateInMilliseconds, String dateFormat) {
        return DateFormat.format(dateFormat, Long.parseLong(dateInMilliseconds)).toString();
    }
}
