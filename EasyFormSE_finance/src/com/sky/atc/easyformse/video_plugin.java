package com.sky.atc.easyformse;

import static com.sky.atc.easyformse.sqlitewraper.mainactivity;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.database.Cursor;
import android.net.Uri;
import android.os.Bundle;
import android.provider.Settings;
import android.widget.Toast;

//import com.example.nitin.newcustomvideorecording.VideoActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;


import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.utils.LogUtils;

import net.sqlcipher.database.SQLiteDatabase;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;

import java.util.List;
import java.util.concurrent.TimeUnit;

import io.michaelrocks.paranoid.Obfuscate;


//plugin to open video application
@Obfuscate
public class video_plugin extends CordovaPlugin {
    public static final String TYPE_NONE = "NONE";
    private CallbackContext mCallbackContext;
    MySharedPreferences pref;
    String imei;
    SQLiteDatabase database;
    private static final int PERMISSION_REQUEST_CODE = 201;
    @Override
    public boolean execute(String action, JSONArray args,
                           CallbackContext callbackContext) throws JSONException {

        this.mCallbackContext = callbackContext;

        database = sqlitewraper.getDatabase();
        // to save storage key and value
        pref = sqlitewraper.getSecureShared("MyPref");

        String time = args.getJSONObject(0).getString("time");

        String time1 = pref.getString("time_video", "k2");

        if (!time.equalsIgnoreCase(time1)) {

            Cursor c3 = database.rawQuery(
                    "SELECT username,u_c,company_id,imei FROM Login_Master",
                    null);
            c3.moveToLast();
            int company_id = c3.getInt(2);
            imei = c3.getString(3);
            c3.close();

            if (action.equals("anAction")) {

                startvideoactivity();
                return true;

//                if (checkPermission()) {
//                    startvideoactivity();
//                    return true;
//                } else {
//                    requestPermission();
//                    return false;
//                }


            } else {
                LogUtils.writeVideoCaptureLogToFile("anAction is empty args:" + args + " action:: " + action, "execute - video_plugin");
                return false;
            }
        } else {
            return false;
        }
    }

//    private void startvideoactivity()
//    {
//
//
//        Intent i = new Intent("com.testapp.ws.new");
//        i.putExtra("imei", imei);
//        i.setPackage("life.knowledge4.videocroppersample");
//        i.putExtra("MINVideo", TimeUnit.SECONDS.convert(1, TimeUnit.SECONDS)); // change recoding setting 30 to 15 sec
//        i.putExtra("MAXVideo", TimeUnit.MILLISECONDS.convert(1, TimeUnit.MINUTES));//  MILLISECONDS
//        i.putExtra("MAXVideoSize", 5L);// long and MB
//        if (this.cordova != null) {
//            PackageManager packageManager = this.cordova.getActivity().getPackageManager();
//            List<ResolveInfo> activities = packageManager.queryIntentActivities(i, 0);
//
//            if(activities.size() > 0)
//            {
//                this.cordova.startActivityForResult(this, i, 0);
//                LogUtils.writeVideoCaptureLogToFile("startActivityForResult started ", "execute - video_plugin");
//
//            }
//            else {
//                Toast.makeText(this.cordova.getActivity(), "Video feature is not assign!", Toast.LENGTH_LONG).show();
//
//            }
//
//        } else {
//
//        }
//    }

   // call video module 9/02/2024
    private boolean startvideoactivity()
    {
        // use video module
                Intent i = new Intent(this.cordova.getActivity(), VideoActivity.class);
                i.putExtra("imei",imei);
                if( this.cordova != null)
                {
                    this.cordova.startActivityForResult(this, i, 0);//null pointer check in case package name was not found
                    return true;
                }
                else {
                    return false;
                }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        LogUtils.writeVideoCaptureLogToFile("onDestroy ","execute - video_plugin");
    }

    public void onActivityResult(int requestCode, int resultCode, Intent intent) {
        try {
            if (requestCode == 0) {
                try {
                    if (resultCode == Activity.RESULT_OK) {
                        Bundle bundle = intent.getExtras();
                        String status = bundle.getString("status");
                        if (mCallbackContext != null)
                            this.mCallbackContext.success(status);
                        else
                            LogUtils.writeVideoCaptureLogToFile(" mCallbackContext success  is null ::"+status, "onActivityResult - video_plugin");
                    } else {
                        LogUtils.writeVideoCaptureLogToFile(" resultCode is not OK  resultCode ::: " + resultCode + "  bundle :::" + intent.getExtras(), "onActivityResult - video_plugin");
                        if (mCallbackContext != null)
                            this.mCallbackContext.error("Error...");
                        else
                            LogUtils.writeVideoCaptureLogToFile(" mCallbackContext Error  is null ", "onActivityResult - video_plugin");
                    }
                } catch (Exception e) {
                    LogUtils.writeVideoCaptureLogToFile(" Exception ::: => " + e, "onActivityResult - video_plugin");
                    DeviceEventsUtils.isFinishActivitiesOptionEnabled(sqlitewraper.context);
                    if (mCallbackContext != null)
                        this.mCallbackContext.error("Error...");
                    else
                        LogUtils.writeVideoCaptureLogToFile(" mCallbackContext Error  is null ", "onActivityResult - video_plugin");
                }
            } else {
                LogUtils.writeVideoCaptureLogToFile("requestCode is not 0: requestCode= " + requestCode, "onActivityResult - video_plugin");
                if (mCallbackContext != null)
                    this.mCallbackContext.error("Error...");
                else
                    LogUtils.writeVideoCaptureLogToFile(" mCallbackContext Error  is null ", "onActivityResult - video_plugin");
            }
        } catch (Exception e) {
            LogUtils.writeVideoCaptureLogToFile(" outException ::: => " + e, "onActivityResult - video_plugin");
        }
    }

    private boolean checkPermission() {
        if (ContextCompat.checkSelfPermission(this.cordova.getActivity(), Manifest.permission.WRITE_EXTERNAL_STORAGE) +
                ContextCompat.checkSelfPermission(this.cordova.getActivity(), Manifest.permission.READ_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
            // Permission is not granted
            return false;
        }
        return true;
    }

    private void requestPermission() {

        cordova.requestPermissions(this,PERMISSION_REQUEST_CODE,
                new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE,Manifest.permission.READ_EXTERNAL_STORAGE});
    }
    @Override
    public void onRequestPermissionResult(int requestCode, String[] permissions, int[] grantResults) throws JSONException {
        if (requestCode == PERMISSION_REQUEST_CODE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                // Permission granted, handle accordingly
                startvideoactivity();
            } else {
                if ( ContextCompat.checkSelfPermission(this.cordova.getActivity(), Manifest.permission.WRITE_EXTERNAL_STORAGE) +
                        ContextCompat.checkSelfPermission(this.cordova.getActivity(), Manifest.permission.READ_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED)  {

                    showMessageOKCancel("You need to allow access file and media permissions",
                            new DialogInterface.OnClickListener() {
                                @Override
                                public void onClick(DialogInterface dialog, int which) {
                                    Intent intent = new Intent();
                                    intent.setAction(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                                    intent.setData(Uri.fromParts("package", mainactivity.getPackageName(), null));
                                    mainactivity.startActivity(intent);
                                    //finish();
                                }
                            });

                }

            }
        }
    }
    private void showMessageOKCancel(String message, DialogInterface.OnClickListener okListener) {
        new AlertDialog.Builder(this.cordova.getActivity())
                .setMessage(message)
                .setPositiveButton("OK", okListener)
                .setCancelable(false)
                .create()
                .show();
    }


}