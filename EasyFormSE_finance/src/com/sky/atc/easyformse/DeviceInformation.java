package com.sky.atc.easyformse;

import android.app.ActivityManager;
import android.os.Build;
import android.os.Environment;
import android.os.StatFs;
import android.util.Log;

import com.google.ar.core.ArCoreApk;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

import static android.content.Context.ACTIVITY_SERVICE;
//get device information
@StringFogIgnore
public class DeviceInformation {


    //to get device infromation
    public static String getDeviceInformation() {

        String deviceOSVersion = Build.VERSION.RELEASE;
        String deviceBrand = Build.BRAND;
        String deviceModel = Build.MODEL;
        JSONObject deviceRam = getDeviceRam();
        JSONObject deviceStorage=getDeviceStorage();

        ArCoreApk.Availability arAvailability = ArCoreApk.getInstance().checkAvailability(sqlitewraper.context);


        JSONObject jsonDevice = new JSONObject();
        JSONArray jsonArray = new JSONArray();
        try {
            jsonDevice.put("OSVERSION", deviceOSVersion);
            jsonDevice.put("BRAND", deviceBrand);
            jsonDevice.put("MODEL", deviceModel);
            jsonDevice.put("ARCORE", arAvailability);

        } catch (JSONException e) {
            e.printStackTrace();
        }
        jsonArray.put(jsonDevice);
        jsonArray.put(deviceStorage);
        jsonArray.put(deviceRam);

        String jsonArrayDevice = jsonArray.toString();
        Log.d("##DeviceInfo", deviceOSVersion + " : " + deviceBrand + " : " + deviceModel + " : " + deviceRam);

        return jsonArrayDevice;
    }

    //to get device memory
    private static JSONObject getDeviceRam() {

        ActivityManager.MemoryInfo mi = new ActivityManager.MemoryInfo();
        ActivityManager activityManager = (ActivityManager) sqlitewraper.context.getSystemService(ACTIVITY_SERVICE);
        activityManager.getMemoryInfo(mi);
        long freeMemory = mi.availMem ;
        long totalMemory = mi.totalMem ;
        long usedMemory = totalMemory - freeMemory;

        JSONObject jsonObject = new JSONObject();
        try {
            jsonObject.put("FREEMEMORY", formatSize(freeMemory));
            jsonObject.put("TOTALMEMORY", formatSize(totalMemory));
            jsonObject.put("USEDMEMORY", formatSize(usedMemory));
        } catch (JSONException e) {
            e.printStackTrace();
        }
        return jsonObject;
    }

    public static long getAvailableInternalMemorySize() {
        File path = Environment.getDataDirectory();
        StatFs stat = new StatFs(path.getPath());
        long blockSize = stat.getBlockSize();
        long availableBlocks = stat.getAvailableBlocks();
        return availableBlocks * blockSize;
    }

    public static long getTotalInternalMemorySize() {
        File path = Environment.getDataDirectory();
        StatFs stat = new StatFs(path.getPath());
        long blockSize = stat.getBlockSize();
        long totalBlocks = stat.getBlockCount();
        return totalBlocks * blockSize;
    }


    private static String formatSize(double size) {
        String suffix = null;

        if (size >= 1024) {
            suffix = " KB";
            size /= 1024;
            if (size >= 1024) {
                suffix = " MB";
                size /= 1024;
            }
        }
        StringBuilder resultBuffer = new StringBuilder(Long.toString((long) size));

        int commaOffset = resultBuffer.length() - 3;
        while (commaOffset > 0) {
            resultBuffer.insert(commaOffset, ',');
            commaOffset -= 3;
        }
        if (suffix != null) resultBuffer.append(suffix);
        return resultBuffer.toString();
    }

    private static JSONObject getDeviceStorage(){

        long totalstorage = getTotalInternalMemorySize();
        String totalstorage1 = formatSize(totalstorage);
        long availableMemory = getAvailableInternalMemorySize();
        String availableMemory1 = formatSize(availableMemory);

        JSONObject jsonObject = new JSONObject();
        try {
            jsonObject.put("FREESTORAGE",availableMemory1 );
            jsonObject.put("TOTALSTORAGE", totalstorage1);
        } catch (JSONException e) {
            e.printStackTrace();
        }
        return jsonObject;
    }
}
