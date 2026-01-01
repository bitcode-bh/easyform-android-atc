package com.sky.atc.easyformse;

import android.content.Context;
import android.content.SharedPreferences;
import android.content.SharedPreferences.Editor;
import android.database.Cursor;

import com.sky.atc.easyformse.datautils.MySharedPreferences;

import net.sqlcipher.database.SQLiteDatabase;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

import static android.content.Context.MODE_PRIVATE;

//to store different values
@StringFogIgnore
public class data {

    private static String event_name = "NA";

    private static int flag;

    public static int getWip_flag() {
        return wip_flag;
    }

    public static void setWip_flag(int wip_flag) {
        data.wip_flag = wip_flag;
    }

    private static int wip_flag = 0;

    public String getDownloadid() {
        return downloadid;
    }

    public void setDownloadid(String downloadid) {
        data.downloadid = downloadid;
    }

    public static String downloadid = "NA";

    public static int getRet() {
        return ret;
    }

    public static void setRet(int ret) {
        data.ret = ret;
    }

    private static int ret;


    private static long hard_time = 0;

    private static double hard_acc = 200f;
    private static double hard_deacc = -200f;
    private static double normal_acc = 200f;
    private static double normal_deacc = -200f;

    private static long gap_milli = 0;
    private static long deacc_time = 0;
    private static long normal_acc_time = 0;
    private static long normal_deacc_time = 0;
    private static float speed_time = 0;
    private static String username = "0";
    private static String FeatureFlag = "0";
    private static float speed = 0;
    SQLiteDatabase database = sqlitewraper.getDatabase();
    static int gplay_ser = 0;
    static double normal_acc_cutoff = 200f, normal_deacc_cutoff = -200f,
            hard_acc_cutoff = 200f, hard_deacc_cutoff = -200f;


    public static int getGplay_ser() {
        return gplay_ser;
    }

    public static void setGplay_ser(int gplay_ser) {
        data.gplay_ser = gplay_ser;
    }

    MySharedPreferences pref = sqlitewraper.getSecureShared("MyPref");
//    Editor editor = pref.edit();

    // public method to get the age variable
    public int getAge() {
        return this.flag;
    }

    // public method to set the age variable
    public void sethard_time(long hard_time) {
        this.hard_time = hard_time;
    }

    public long gethardacc_time() {
        return this.hard_time;
    }

    public void setnormal_acc_time(long normal_acc_time) {
        this.normal_acc_time = normal_acc_time;
    }

    public long getnormal_acc_time() {
        return this.normal_acc_time;
    }

    public void setnormal_deacc_time(long normal_deacc_time) {
        this.normal_deacc_time = normal_deacc_time;
    }

    public long getnormal_deacc_time() {
        return this.normal_deacc_time;
    }

    public void setspeed_time(Float setspeed_time) {
        this.speed_time = setspeed_time;
    }

    public float getspeed_time() {
        return this.speed_time;
    }

    public void setdeacc_time(long hard_time) {
        this.deacc_time = hard_time;
    }

    public long getdeacc_time() {
        return this.deacc_time;
    }

    // public method to set the age variable
    public void setAge(int age) {
        this.flag = age;
    }

    public void setusername(String username) {
        this.username = username;
    }

    public String getusername() {
        database = sqlitewraper.getDatabase();
//        username = pref.getString("u_name", "0");

        // Init

        username = sqlitewraper.preferences.getString("u_name",null);
        if (username == null) {
            username = "0";
        }

        return this.username;
    }

    public String getFeatureFlag(String Flag) {

        FeatureFlag = pref.getString(Flag, "0");
        return this.FeatureFlag;
    }

    public float getSpeedLimit() {

        String sp = pref.getString("speed_limit", "0");

        if (sp == null || sp.isEmpty() || sp.equals("null")) {
            sp = "100";
        }

        speed = Float.parseFloat(sp);

        return this.speed;
    }

    public double hard_acc() {

        if (hard_acc != 200) {
            return this.hard_acc;
        } else {

            String sp = pref.getString("hard_acc", "0");

            if (sp == null || sp.isEmpty() || sp.equals("null")
                    || sp.equalsIgnoreCase("0")) {
                        sp = "200";
                    }
            hard_acc = Double.valueOf(sp);
        }

        return this.hard_acc;
    }

    public double hard_deacc() {

        if (hard_deacc != -200) {
            return this.hard_deacc;
        } else {

            String sp = pref.getString("hard_deacc", "0");

            if (sp != null && !sp.isEmpty() && !sp.equals("null")
                    && !sp.equalsIgnoreCase("0")) {

            } else {
                sp = "-200";
            }
            hard_deacc = Double.valueOf(sp);
        }

        return this.hard_deacc;
    }

    public double normal_acc() {

        if (normal_acc != 200) {
            return this.normal_acc;
        } else {

            String sp = pref.getString("normal_acc", "0");

            if (sp != null && !sp.isEmpty() && !sp.equals("null")
                    && !sp.equalsIgnoreCase("0")) {

            } else {
                sp = "200";

            }
            normal_acc = Double.valueOf(sp);
        }

        return this.normal_acc;
    }

    public double normal_deacc() {

        if (normal_deacc != -200) {
            return this.normal_deacc;
        } else {

            String sp = pref.getString("normal_deacc", "0");

            if (sp != null && !sp.isEmpty() && !sp.equals("null")
                    && !sp.equalsIgnoreCase("0")) {

            } else {
                sp = "-200";
            }
            normal_deacc = Double.valueOf(sp);
        }

        return this.normal_deacc;
    }

    public long gap_milli() {

        String sp = pref.getString("gap_milli", "0");

        if (sp == null || sp.isEmpty() || sp.equals("null")) {
            sp = "100";
        }

        gap_milli = Long.valueOf(sp);

        return this.gap_milli;
    }

    public void setevent_name(String event_name) {

        pref.putString("event_name", event_name);
        pref.commit();

    }

    public String getevent_name() {

        event_name = pref.getString("event_name", "NA");
        return this.event_name;
    }

    public String[] getlatlon() {

        String[] lat_lon = new String[4];
        String lon = "NA";
        String lat = "NA";
        Cursor c = database
                .rawQuery(
                        "SELECT lat,lon,address, c_accuracy,date_s,speed FROM  track_master WHERE   _id = (SELECT MAX(_id) FROM track_master);",
                        null);
        c.moveToFirst();

        if (c.getCount() > 0) {
            lat = c.getString(0);
            lon = c.getString(1);
        }

        c.close();

        lat_lon[0] = lat;
        lat_lon[1] = lon;
        return lat_lon;

    }

    public double normal_acc_cutoff() {

        if (normal_acc_cutoff != 200) {
            return this.normal_acc_cutoff;
        } else {

            String sp = pref.getString("normal_acc_cutoff", "0");

            if (sp != null && !sp.isEmpty() && !sp.equals("null")
                    && !sp.equalsIgnoreCase("0")) {

            } else {
                sp = "200";

            }
            normal_acc_cutoff = Double.valueOf(sp);
        }

        return this.normal_acc_cutoff;
    }

    public double hard_acc_cutoff() {

        if (hard_acc_cutoff != 200) {
            return this.normal_acc_cutoff;
        } else {

            String sp = pref.getString("hard_acc_cutoff", "0");

            if (sp != null && !sp.isEmpty() && !sp.equals("null")
                    && !sp.equalsIgnoreCase("0")) {

            } else {
                sp = "200";

            }
            hard_acc_cutoff = Double.valueOf(sp);
        }

        return this.hard_acc_cutoff;
    }

    public double normal_deacc_cutoff() {

        if (normal_deacc_cutoff != -200) {
            return this.normal_deacc_cutoff;
        } else {

            String sp = pref.getString("normal_deacc_cutoff", "0");

            if (sp != null && !sp.isEmpty() && !sp.equals("null")
                    && !sp.equalsIgnoreCase("0")) {

            } else {
                sp = "-200";
            }
            normal_deacc_cutoff = Double.valueOf(sp);
        }

        return this.normal_deacc_cutoff;
    }

    public double hard_deacc_cutoff() {

        if (hard_deacc_cutoff != -200) {
            return this.normal_deacc_cutoff;
        } else {

            String sp = pref.getString("hard_deacc_cutoff", "0");

            if (sp != null && !sp.isEmpty() && !sp.equals("null")
                    && !sp.equalsIgnoreCase("0")) {

            } else {
                sp = "-200";
            }
            hard_deacc_cutoff = Double.valueOf(sp);
        }

        return this.hard_deacc_cutoff;
    }

}
