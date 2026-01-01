package com.sky.atc.easyformse;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.admin.DevicePolicyManager;
import android.content.ActivityNotFoundException;
import android.content.ComponentName;
import android.content.ContentValues;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.database.Cursor;
import net.sqlcipher.database.SQLiteDatabase;
import android.net.Uri;
import android.os.Bundle;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

/**
 * Created by Mikka on 8/12/2016.
 */

//to programattically force stop the application
@StringFogIgnore
public class force_st extends Activity {
    SQLiteDatabase database;
    DevicePolicyManager devicePolicyManager;
    ComponentName demoDeviceAdmin;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        database = sqlitewraper.getDatabase();
        devicePolicyManager = (DevicePolicyManager) sqlitewraper.context
                .getSystemService(Context.DEVICE_POLICY_SERVICE);
        demoDeviceAdmin = new ComponentName(sqlitewraper.context,
                DemoDeviceAdminReceiver.class);
        Cursor a_t2 = database.rawQuery(
                "select VALUE from APP_states where ITEAM='admin'", null);
        a_t2.moveToFirst();
        String admin = a_t2.getString(0);

        //If Device admin is active it will remove first than showing alert for force stop
        if (admin.equalsIgnoreCase("1")) {

            devicePolicyManager.removeActiveAdmin(demoDeviceAdmin);
            update_appsate("0", "admin");
        }


        alertbox();
    }

    void alertbox() {

        AlertDialog.Builder alertDialogBuilder = new AlertDialog.Builder(this);
        alertDialogBuilder.setMessage("You are Trying to Swap user.There is Some Background Process Still running.Click on ForceStop and Restart App");

        alertDialogBuilder.setPositiveButton("Ok", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface arg0, int arg1) {

                String packageName = getPackageName();
                try {
                    //Open the specific App Info page:
                    Intent intent = new Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                    intent.setData(Uri.parse("package:" + packageName));
                    intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                    startActivity(intent);
                    finish();
                    int pid = android.os.Process.myPid();
                    android.os.Process.killProcess(pid);
                    System.exit(0);
                } catch (ActivityNotFoundException e) {
                    ////e.printStackTrace();

                    //Open the generic Apps page:
                    Intent intent = new Intent(android.provider.Settings.ACTION_MANAGE_APPLICATIONS_SETTINGS);
                    startActivity(intent);

                }


            }
        });

        AlertDialog alertDialog = alertDialogBuilder.create();
        alertDialog.show();


    }

    void update_appsate(String value, String ITEAM) {
        try {
            String t;
            ContentValues args = new ContentValues();
            t = "ITEAM='" + ITEAM + "'";
            args.put("VALUE", value);
            database.update("APP_states", args, t, null);

        } catch (Exception e) {
            System.out.println(e.getMessage());
            // TODO: handle exception
        }
    }
}
