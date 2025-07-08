package com.sky.atc.easyformse.datautils;


import android.app.Activity;
import android.app.ActivityManager;
import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.util.Base64;

import java.security.MessageDigest;
import java.util.List;

import io.michaelrocks.paranoid.Obfuscate;

//Data Utils Class for checking Auth of an application
@Obfuscate
public class CheckAuthOfApplication {

    //For Checking of app signature
    public static int checkAppSignature(Context context) {

        Activity activity = (Activity) context;

        try {
            PackageInfo packageInfo = context.getPackageManager()
                    .getPackageInfo(context.getPackageName(), PackageManager.GET_SIGNATURES);

            for (Signature signature : packageInfo.signatures) {

                byte[] signatureBytes = signature.toByteArray();

                MessageDigest md = MessageDigest.getInstance("SHA-2");

                md.update(signature.toByteArray());

                final String currentSignature = Base64.encodeToString(md.digest(), Base64.DEFAULT);


                //compare signatures
                if (stringFromJNI().equals(currentSignature)) {
                    return 1;
                }else {
                    activity.finish();
                    System.exit(0);
                }
            }
        } catch (Exception e) {
//assumes an issue in checking signature., but we let the caller decide on what to do.
        }
        return 0;

    }

    public static boolean verifyInstaller(final Context context) {

        final String installer = context.getPackageManager()

                .getInstallerPackageName(context.getPackageName());

        return installer != null

                && installer.startsWith("PLAY_STORE_APP_ID");
    }
    public static boolean checkRunningProcesses(Context context) {
        ActivityManager manager = (ActivityManager) context.getSystemService(Context.ACTIVITY_SERVICE);
        boolean returnValue = false;
        // Get currently running application processes
        List<ActivityManager.RunningServiceInfo> list = manager.getRunningServices(300);
        if (list != null) {
            String tempName;
            for (int i = 0; i < list.size(); ++i) {
                tempName = list.get(i).process;

                if (tempName.contains("fridaserver")) {
                    returnValue = true;
                }
            }
        }
        return returnValue;
    }

    //check if application is debuggable or not
    public static boolean checkDebuggable(Context context){

        return (context.getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0;

    }

    public static native String stringFromJNI();
    public static native String getEmail();



    public static native boolean isCheckRoot();

    public static native boolean isCheckDebug();

    public static native boolean isFridaServer();

}
