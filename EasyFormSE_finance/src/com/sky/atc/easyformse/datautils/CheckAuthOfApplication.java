package com.sky.atc.easyformse.datautils;


import android.app.Activity;
import android.app.ActivityManager;
import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.hardware.Sensor;
import android.hardware.SensorManager;
import android.os.Build;
import android.telephony.TelephonyManager;
import android.util.Base64;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.security.MessageDigest;
import java.util.List;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;
import com.sky.atc.easyformse.NativeClass;

//Data Utils Class for checking Auth of an application
@StringFogIgnore
public class CheckAuthOfApplication {

    //For Checking of app signature
    //For Checking of app signature
    public static int checkAppSignature(Context context) {

        Activity activity = (Activity) context;

        try {
            PackageInfo packageInfo = context.getPackageManager()
                    .getPackageInfo(context.getPackageName(), PackageManager.GET_SIGNATURES);

            for (Signature signature : packageInfo.signatures) {

                byte[] signatureBytes = signature.toByteArray();

                MessageDigest md = MessageDigest.getInstance("SHA");

                md.update(signature.toByteArray());

                final String currentSignature = Base64.encodeToString(md.digest(), Base64.DEFAULT);


                //compare signatures
                if (NativeClass.stringFromJNI().equals(currentSignature)) {
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


    public static boolean IsMagiskInstall(Context context) {
        String[] rootPackages = {"com.topjohnwu.magisk","com.yellowes.su","com.thirdparty.superuser"}; ;
        PackageManager pm = context.getPackageManager();
        for (String packagename : rootPackages) {
            try {
                pm.getPackageInfo(packagename, PackageManager.GET_ACTIVITIES);
                //  Log.i("ContentValues", "Root package detected: + packagename);
                return true;
            } catch (PackageManager.NameNotFoundException e) {
                return false;
            }
        }
        return false;
    }

    public static boolean isFridaCheckpath() {
        String[] fridaPaths = {
                "/data/local/tmp/frida-server",
                "/data/local/tmp/frida",
                "/system/bin/frida",
                "/data/local/tmp/fridaserver",
                "/system/bin/frida-server",
                "/data/adb/zygisk/"
        };

        for (String path : fridaPaths) {
            File file = new File(path);
            if (file.exists()) {
                return true;
            }
        }

        return false;

    }

    public static boolean isZygiskDetected() {
        try {
            for (String lib : System.getProperty("java.library.path").split(":")) {
                if (lib.toLowerCase().contains("zygisk")) {
                    return true;
                }
            }
        } catch (Exception ignored) {}
        return false;
    }





    // public static native boolean isCheckRoot();

    //public static native boolean isCheckDebug();

    // public static native boolean isFridaServer();


    public static boolean checkRootFilesAndPackages(Context context) {
        String[] rootApps = {
                "com.noshufou.android.su",
                "com.noshufou.android.su.elite",
                "eu.chainfire.supersu",
                "com.koushikdutta.superuser",
                "com.thirdparty.superuser",
                "com.yellowes.su",
                "com.topjohnwu.magisk",
                "com.kingroot.kinguser",
                "com.kingo.root",
                "com.smedialink.oneclickroot",
                "com.zhiqupk.root.global",
                "com.alephzain.framaroot"
        };

        PackageManager pm =  context.getPackageManager();
        for (String packageName : rootApps) {
            try {
                pm.getPackageInfo(packageName, 0);
                return true; // App found
            } catch (PackageManager.NameNotFoundException ignored) {
            }
        }
        return false; // No root apps found
    }

    public boolean checkOTACerts()
    {
        String OTAPath = "/etc/security/otacerts.zip";
        File f = new File(OTAPath);
        boolean fileExists = f.exists();
        if (fileExists) {
            return true;
        } else
        {
            return false;
        }
    }

    public static boolean knownDangerousAppsPackages(Context mContext)
    {
        String[] knownDangerousAppsPackages = {
                "com.koushikdutta.rommanager",
                "com.koushikdutta.rommanager.license",
                "com.dimonvideo.luckypatcher",
                "com.chelpus.lackypatch",
                "com.ramdroid.appquarantine",
                "com.ramdroid.appquarantinepro",
                "com.android.vending.billing.InAppBillingService.COIN",
                "com.android.vending.billing.InAppBillingService.LUCK",
                "com.chelpus.luckypatcher",
                "com.blackmartalpha",
                "org.blackmart.market",
                "com.allinone.free",
                "com.repodroid.app",
                "org.creeplays.hack",
                "com.baseappfull.fwd",
                "com.zmapp",
                "com.dv.marketmod.installer",
                "org.mobilism.android",
                "com.android.wp.net.log",
                "com.android.camera.update",
                "cc.madkite.freedom",
                "com.solohsu.android.edxp.manager",
                "org.meowcat.edxposed.manager",
                "com.xmodgame",
                "com.cih.game_cih",
                "com.charles.lpoqasert",
                "catch_.me_.if_.you_.can_"
        };

        PackageManager pm =  mContext.getPackageManager();
        for (String packageName : knownDangerousAppsPackages) {
            try {
                pm.getPackageInfo(packageName, 0);
                return true; // App found
            } catch (PackageManager.NameNotFoundException ignored) {
            }
        }
        return false; // No root apps found
    }

    public static boolean knownRootCloakingPackages(Context mContext)
    {
        String[] knownRootCloakingPackages = {
                "com.devadvance.rootcloak",
                "com.devadvance.rootcloakplus",
                "de.robv.android.xposed.installer",
                "com.saurik.substrate",
                "com.zachspong.temprootremovejb",
                "com.amphoras.hidemyroot",
                "com.amphoras.hidemyrootadfree",
                "com.formyhm.hiderootPremium",
                "com.formyhm.hideroot"
        };

        PackageManager pm =  mContext.getPackageManager();
        for (String packageName : knownRootCloakingPackages) {
            try {
                pm.getPackageInfo(packageName, 0);
                return true; // App found
            } catch (PackageManager.NameNotFoundException ignored) {
            }
        }
        return false; // No root apps found
    }


    public static boolean hasMagiskFilesRoot() {
        try {
            Process process = Runtime.getRuntime().exec(new String[]{"su", "-c", "ls /data/adb"});
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String line;
            while ((line = reader.readLine()) != null) {
                // Log.d(TAG, "Rooted Magisk check: " + line);
                if (line.toLowerCase().contains("magisk") || line.toLowerCase().contains("zygisk")) {
                    return true;
                }
            }
            process.waitFor();
        } catch (Exception e) {
            // Non-rooted devices will fail here
            return false;
        }
        return false;
    }

    public static boolean detectXposedStack() {
        try {
            throw new Exception();
        } catch (Exception e) {
            for (StackTraceElement el : e.getStackTrace()) {
                String l = el.getClassName().toLowerCase();
                if (l.contains("xposed") || l.contains("lsposed") || l.contains("edxp")) {
                    return true;
                }
            }
        }
        return false;
    }

    public static boolean checkBuildProps() {
        String[] emulatorIndicators = {
                "generic", "unknown", "emulator", "sdk", "goldfish", "ranchu", "vbox", "test-keys"
        };
        String fingerprint = Build.FINGERPRINT.toLowerCase();
        String model = Build.MODEL.toLowerCase();
        String manufacturer = Build.MANUFACTURER.toLowerCase();
        String brand = Build.BRAND.toLowerCase();
        String device = Build.DEVICE.toLowerCase();

        for (String indicator : emulatorIndicators) {
            if (fingerprint.contains(indicator) ||
                    model.contains(indicator) ||
                    manufacturer.contains(indicator) ||
                    brand.contains(indicator) ||
                    device.contains(indicator)) {
                return true; // likely emulator
            }
        }
        return false;
    }

    public static boolean checkEmulatorFiles() {
        String[] knownFiles = {
                "/dev/qemu_pipe",
                "/dev/socket/qemud",
                "/system/lib/libc_malloc_debug_qemu.so",
                "/sys/qemu_trace",
                "/system/bin/qemu-props"
        };

        for (String file : knownFiles) {
            if (new File(file).exists()) {
                return true; // emulator detected
            }
        }
        return false;
    }


    public static boolean checkSensorsAndTelephony(Context context) {
        SensorManager sm = (SensorManager) context.getSystemService(Context.SENSOR_SERVICE);
        if (sm.getSensorList(Sensor.TYPE_ACCELEROMETER).isEmpty()) return true;

        TelephonyManager tm = (TelephonyManager) context.getSystemService(Context.TELEPHONY_SERVICE);
        if (tm.getPhoneType() == TelephonyManager.PHONE_TYPE_NONE) return true;

        return false;
    }


}
