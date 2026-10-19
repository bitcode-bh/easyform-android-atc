//http://stackoverflow.com/questions/32858422/android-drawing-on-bitmap-is-disappear-after-touch-up-event
package com.sky.atc.easyformse;

import android.graphics.Bitmap;
import android.hardware.Camera;

import com.sky.atc.easyformse.datautils.MySharedPreferences;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

//Data Utils class to hold different constatnts
@StringFogIgnore
public class B_new {

    static Preview p;
    private static Bitmap mutableBitmap;
    private static int count_new = -1;
    private static int flash = -1;
    private static Camera c;
    private static String path_final;
    private static Bitmap b;
    private static int mCurrentX;
    private static int mCurrentColor = 0xFF4488CC;
    private static float mCurrentHue;
    private static int[] mMainColors = new int[65536];
    private static int mCurrentY;
    private static int camviewid;


    //    SharedPreferences pref = sqlitewraper.getSecureShared("MyPref");
    MySharedPreferences editor;

    public static boolean isIsInBackgeound() {
        return isInBackgeound;
    }

    public static void setIsInBackgeound(boolean isInBackgeound) {
        B_new.isInBackgeound = isInBackgeound;
    }

    private static boolean isInBackgeound;

    public static Preview getP() {
        return p;
    }

    public static void setP(Preview p) {
        B_new.p = p;
    }

    public static Camera getC() {
        return c;
    }

    public static void setC(Camera c) {
        B_new.c = c;
    }

    public static int getFlash() {
        return flash;
    }

    public static void setFlash(int flash) {

        p.set_flash(flash);
        B_new.flash = flash;
    }

    public static String getPath_final() {
        return path_final;
    }

    public static void setPath_final(String path_final) {
        B_new.path_final = path_final;
    }

    public static int getCount_new() {
        return count_new;
    }

    public static void setCount_new(int count_new) {
        B_new.count_new = count_new;
    }

    public static Bitmap getMutableBitmap() {
        return mutableBitmap;
    }

    public static void setMutableBitmap(Bitmap mutableBitmap) {
        B_new.mutableBitmap = mutableBitmap;
    }

    public static int[] getmMainColors() {
        return mMainColors;
    }

    public static void setmMainColors(int[] mMainColors) {
        B_new.mMainColors = mMainColors;
    }

    public static float getmCurrentHue() {
        return mCurrentHue;
    }

    public static void setmCurrentHue(float mCurrentHue) {
        B_new.mCurrentHue = mCurrentHue;
    }

    public static int getmCurrentColor() {
        return mCurrentColor;
    }

    public static void setmCurrentColor(int mCurrentColor) {
        B_new.mCurrentColor = mCurrentColor;
    }

    public static int getmCurrentX() {
        return mCurrentX;
    }

    public static void setmCurrentX(int mCurrentX) {
        B_new.mCurrentX = mCurrentX;
    }

    public static int getmCurrentY() {
        return mCurrentY;
    }

    public static void setmCurrentY(int mCurrentY) {
        B_new.mCurrentY = mCurrentY;
    }

    public static Bitmap getB() {
        return b;
    }

    public static void setB(Bitmap b) {
        B_new.b = b;
    }

    public static int getCamviewid() {
        return camviewid;
    }

    public static void setCamviewid(int camviewid) {
        B_new.camviewid = camviewid;
    }


    public void SetValue(String uniqueid, String pass) {
//        editor = preferences.edit();
        //with Encryption
//        sqlitewraper.preferences.put("uniqueid", uniqueid);
//        preferences.put("password", pass);
//        editor.commit();

        //for new Auth without Encryption
        editor = sqlitewraper.getSecureShared("my-preferences");
        editor.putString("uniqueid", uniqueid); // Saving string
        editor.commit();

    }

    public void saveImei(String imei) {
        editor = sqlitewraper.getSecureShared("my-preferences");
        editor.putString("SaveImei", imei); // Saving string
        editor.commit();
    }

    /** The device id this install has used since it first had one; see DeviceEventsUtils.getImei(). */
    public String getPinnedDeviceId() {
        editor = sqlitewraper.getSecureShared("my-preferences");
        return editor.getString("PinnedDeviceId", "");
    }

    public void pinDeviceId(String id) {
        editor = sqlitewraper.getSecureShared("my-preferences");
        editor.putString("PinnedDeviceId", id);
        editor.commit();
    }

    public String getSaveImei() {
        editor = sqlitewraper.getSecureShared("my-preferences");
        return editor.getString("SaveImei", "NA");
    }

    public String GetValue() {
//        String uniqueid = sqlitewraper.preferences.getString("uniqueid");
        //for new Auth without Encryption
        editor = sqlitewraper.getSecureShared("my-preferences");
        String uniqueid = editor.getString("uniqueid", "NA");
        return uniqueid;
    }
}
