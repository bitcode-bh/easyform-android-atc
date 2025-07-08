package com.sky.atc.easyformse;

import static com.sky.atc.easyformse.sqlitewraper.context;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.provider.ContactsContract;
import android.util.Log;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;

import java.util.Random;

/**
 * Created by NareshChocha on 11/21/2022.
 *
 * @author NareshChocha
 */
public class openWhatsappPlugin extends CordovaPlugin {
    public CallbackContext callbackContext;
    String MobileNo;
    @SuppressLint("Range")
    @Override
    public boolean execute(String action, JSONArray args,
                           CallbackContext callbackContext) throws JSONException {

        this.callbackContext = callbackContext;
        MobileNo =  args.getJSONObject(0).getString("mob_number");

        Intent intent = new Intent(this.cordova.getActivity(), OpenWhatsappActivity.class);
        intent.putExtra("MobileNo", MobileNo);
        if (this.cordova != null) {
            this.cordova.startActivityForResult(this, intent,101);
            return true;
        }

        return false;

    }

    public void onActivityResult(int requestCode, int resultCode, Intent intent) {
        switch (requestCode) {
            case 101:
                if (resultCode == android.app.Activity.RESULT_OK) { // 0:ok

                    this.callbackContext.success("Success");

                } else {

                    this.callbackContext.error("Error...");
                }

                break;
            default:
                break;
        }

    }
}
