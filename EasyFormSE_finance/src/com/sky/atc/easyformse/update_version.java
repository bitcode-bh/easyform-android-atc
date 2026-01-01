package com.sky.atc.easyformse;

import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.PackageManager.NameNotFoundException;
import android.util.Log;

import com.sky.atc.easyformse.datautils.MySharedPreferences;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;
import org.apache.cordova.PluginResult.Status;
import org.json.JSONArray;
import org.json.JSONException;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

@StringFogIgnore
/**
 * @author Tommy-Carlos Williams, Huge chunks lifted/adapted from the
 *         NextworkManager core PhoneGap plugin
 */
public class update_version extends CordovaPlugin {

    public static final String TYPE_NONE = "NONE";
    public CallbackContext callbackContext;
    String type;
    String Colorcode;

    @Override
    public boolean execute(String action, JSONArray args,
                           CallbackContext callbackContext) throws JSONException {
        Log.e("##DOWNLOADID1", "demo update_version");
        try {

            this.callbackContext = callbackContext;
            String username = args.getJSONObject(0).getString("username");
            type = args.getJSONObject(0).getString("type");

            try{
                Colorcode = args.getJSONObject(0).getString("colorcode");
            }
            catch (Exception e)
            {
                Colorcode = "#e60000";
            }
            //scanner
            if (type.equalsIgnoreCase("barcode")) {
                PluginResult result = new PluginResult(Status.OK);
                this.callbackContext.sendPluginResult(result);
                return false;
            }

            //video application
            if (type.equalsIgnoreCase("video")) {
                if (!BuildConfig.APPLICATION_ID.equals("com.easyform.parammitra") && !BuildConfig.VERSION_NAME.equals("D_19.6.22_F7")) {
                    boolean isInstalled = isPackageInstalled("life.knowledge4.videocroppersample", sqlitewraper.context);
                    boolean isInstallednew = isPackageInstalled("com.easyform.video", sqlitewraper.context);


                    if (isInstalled || isInstallednew) {
                        PluginResult result = new PluginResult(Status.OK);
                        this.callbackContext.sendPluginResult(result);
                        return false;
                    }
                } else {
                    PluginResult result = new PluginResult(Status.OK);
                    this.callbackContext.sendPluginResult(result);
                    return false;
                }

            }

            //anyline Meter Reading
            if (type.equalsIgnoreCase("meter_reading")) {

                MySharedPreferences sharedPreferences = sqlitewraper.getSecureShared("pre1");
                String meterpackage = sharedPreferences.getString("PackageName_MeterReading", "");
                String meterversion = sharedPreferences.getString("VersionName_MeterReading", "");

                boolean isInstalled = isPackageInstalled(meterpackage, sqlitewraper.context);

                if (isInstalled) {

                    PackageInfo pinfo = sqlitewraper.context.getPackageManager().getPackageInfo(meterpackage, 0);
                    String versionName = pinfo.versionName;

                    if (meterversion.equalsIgnoreCase(versionName)) {

                        PluginResult result = new PluginResult(Status.OK);
                        this.callbackContext.sendPluginResult(result);
                        return false;

                    }

                }

            }

            // rf Tracking
            if (type.equalsIgnoreCase("rftracking")) {

                boolean isInstallednew = isPackageInstalled("com.easyform.rftrack", sqlitewraper.context);
                if (isInstallednew) {
                    PluginResult result = new PluginResult(Status.OK);
                    this.callbackContext.sendPluginResult(result);
                    return true;
                }

            }

            // to save storage key and value
            Intent i = new Intent(sqlitewraper.context, AppDownloadActivity.class);
            i.putExtra("username", username);
            i.putExtra("type", type);
            i.putExtra("Colorcode",Colorcode);
            this.cordova.startActivityForResult(this, i, 101);
            return true;
        } catch (Exception e) {
            Log.e("##DOWNLOADID1", "demo " + e.toString());
            this.callbackContext.success("Error");
            return false;
        }

    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent intent) {
        super.onActivityResult(requestCode, resultCode, intent);

        if (requestCode == 101) {
            if (type != null) {
                try {
                    checktype(type);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            } else {
                DeviceEventsUtils.isFinishActivitiesOptionEnabled(sqlitewraper.context);
            }
        }
    }

    private boolean isPackageInstalled(String packagename, Context context) {
        PackageManager pm = context.getPackageManager();
        try {
            pm.getPackageInfo(packagename, PackageManager.GET_ACTIVITIES);
            return true;
        } catch (NameNotFoundException e) {
            return false;
        }

    }

    void checktype(String type) {


        if (type.equalsIgnoreCase("barcode")) {
            boolean isInstalled = isPackageInstalled("com.dm.zbar.android.examples", sqlitewraper.context);
            boolean isInstallednew = isPackageInstalled("com.easyform.scanner", sqlitewraper.context);

            if (isInstalled || isInstallednew) {
                PluginResult result = new PluginResult(Status.OK);
                this.callbackContext.sendPluginResult(result);

            } else {

                this.callbackContext.error("Error");
            }

        }
        if (type.equalsIgnoreCase("video")) {
            boolean isInstalled = isPackageInstalled("life.knowledge4.videocroppersample", sqlitewraper.context);
            boolean isInstallednew = isPackageInstalled("com.easyform.video", sqlitewraper.context);

            if (isInstalled || isInstallednew) {

                PluginResult result = new PluginResult(Status.OK);
                this.callbackContext.sendPluginResult(result);
            } else {
                this.callbackContext.error("Error");
            }

        }

        if (type.equalsIgnoreCase("meter_reading")) {
            MySharedPreferences sharedPreferences = sqlitewraper.getSecureShared("pre1");
            String meterpackage = sharedPreferences.getString("PackageName_MeterReading", "");
            boolean isInstalled = isPackageInstalled(meterpackage, sqlitewraper.context);

            if (isInstalled) {
                PluginResult result = new PluginResult(Status.OK);
                this.callbackContext.sendPluginResult(result);
            } else {

                this.callbackContext.error("Error");
            }

        }

        if (type.equalsIgnoreCase("rftracking")) {

            boolean isInstallednew = isPackageInstalled("com.easyform.rftrack", sqlitewraper.context);

            if (isInstallednew) {

                PluginResult result = new PluginResult(Status.OK);
                this.callbackContext.sendPluginResult(result);
            } else {
                this.callbackContext.error("Error");
            }

        }
    }


}
