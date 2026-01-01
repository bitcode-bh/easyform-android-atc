package com.sky.atc.easyformse;

import android.content.Context;
import android.util.Log;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.util.ArrayList;
import java.util.List;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

/**
 * Created by Divyang on 2/19/2018.
 */

//Utils class fro root detection method
@StringFogIgnore
class DeviceUtils {

    public static boolean checkExecuteCommand() {
        return filesAccess() || canExecuteCommand() || fileAccess();
    }

    private static boolean fileAccess() {
        boolean executedSuccesfully;
        Runtime runtime = Runtime.getRuntime();
        try {
            Process process = runtime.exec(new String[]{"su", "-c", "ls data/"});
            if (process != null) {
                Log.e("fileAccess ", "rooted:=> " + process.getInputStream());
            } else {
                Log.e("fileAccess ", "Null process");
            }
            BufferedReader r = new BufferedReader(new InputStreamReader(process.getInputStream()));
            StringBuilder total = new StringBuilder();
            for (String line; (line = r.readLine()) != null; ) {
                total.append(line).append('\n');
            }
            Log.e("fileAccess ", "process => " + total.toString());
            executedSuccesfully = total.length() > 0;

        } catch (Exception e) {
            Log.e("fileAccess ", e.toString());
            executedSuccesfully = false;
        }
        return executedSuccesfully;
    }

    private static boolean filesAccess() {
        boolean executedSuccesfully = false;
        List<String[]> filePath = new ArrayList<>();
        filePath.add(new String[]{"su", "-c", "mkdir data/myFolder"});
        filePath.add(new String[]{"su", "-c", "mkdir proc/myFolder"});
        filePath.add(new String[]{"su", "-c", "mkdir system/myFolder"});

        for (int i = 0; i < filePath.size(); i++) {
            try {
                Runtime runtime = Runtime.getRuntime();
                /*Process process =*/ runtime.exec(filePath.get(i));
                executedSuccesfully = true;
                break;
            } catch (IOException e) {
                Log.e("fileAccess ", e.toString());
            }
        }
        return executedSuccesfully;
    }


    // executes a command on the system
    private static boolean canExecuteCommand() {
        boolean executedSuccesfully;
        try {
            Runtime runtime = Runtime.getRuntime();
            Process process = runtime.exec(new String[]{"su", "-c", "id"});
            if (process != null) {
                Log.e("Error ", "rooted:=> " + process.getInputStream());
            } else {
                Log.e("Error ", "Null process");
            }
            BufferedReader r = new BufferedReader(new InputStreamReader(process.getInputStream()));
            StringBuilder total = new StringBuilder();
            for (String line; (line = r.readLine()) != null; ) {
                total.append(line).append('\n');
            }
            Log.e("Error ", "process => " + total.toString());

            if (total.length() > 0) {
                String[] data = total.toString().split(" ");
                if (data != null && data.length > 0) {
                    String isRoot = data[0].split("=")[data[0].split("=").length - 1];
                    Log.e("Error Data=> ", isRoot);
                    executedSuccesfully = isRoot.contains("root") || isRoot.contains("0(root)");
                } else {
                    executedSuccesfully = true;
                }
            } else {
                executedSuccesfully = true;
            }
        } catch (Exception e) {
            Log.e("Error ", e.toString());
            executedSuccesfully = false;
        }
        return executedSuccesfully;
    }


    static boolean isDeviceRooted() {
        return checkRootMethod1() || checkRootMethod2() || checkRootMethod3();
    }

    private static boolean checkRootMethod1() {
        String buildTags = android.os.Build.TAGS;
        return buildTags != null && buildTags.contains(sqlitewraper.context.getResources().getString(R.string.testkeys));
    }

    private static boolean checkRootMethod2() {

        String appnameRoot = sqlitewraper.context.getResources().getString(R.string.approotstring);
        String appnameRoot1 = sqlitewraper.context.getResources().getString(R.string.approotstring1);
        String appnameRoot2 = sqlitewraper.context.getResources().getString(R.string.approotstring2);
        String appnameRoot3 = sqlitewraper.context.getResources().getString(R.string.approotstring3);
        String appnameRoot4 = sqlitewraper.context.getResources().getString(R.string.approotstring4);
        String appnameRoot5 = sqlitewraper.context.getResources().getString(R.string.approotstring5);
        String appnameRoot6 = sqlitewraper.context.getResources().getString(R.string.approotstring6);
        String appnameRoot7 = sqlitewraper.context.getResources().getString(R.string.approotstring7);
        String appnameRoot8 = sqlitewraper.context.getResources().getString(R.string.approotstring8);
        String appnameRoot9 = sqlitewraper.context.getResources().getString(R.string.approotstring9);

        String[] paths = {appnameRoot, appnameRoot1, appnameRoot2, appnameRoot3, appnameRoot4, appnameRoot5, appnameRoot6,
                appnameRoot7, appnameRoot8, appnameRoot9};
        for (String path : paths) {
            if (new File(path).exists()) return true;
        }
        return false;
    }

    private static boolean checkRootMethod3() {
        Process process = null;
        String rootname = sqlitewraper.context.getResources().getString(R.string.rootnamemethod);
        String rootname1 = sqlitewraper.context.getResources().getString(R.string.rootnamemethod1);
        try {
            process = Runtime.getRuntime().exec(new String[]{rootname, rootname1});
            BufferedReader in = new BufferedReader(new InputStreamReader(process.getInputStream()));
            if (in.readLine() != null) return true;
            return false;
        } catch (Throwable t) {
            return false;
        } finally {
            if (process != null) process.destroy();
        }
    }
}