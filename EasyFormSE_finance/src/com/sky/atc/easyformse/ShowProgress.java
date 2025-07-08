package com.sky.atc.easyformse;

import android.app.ProgressDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.provider.Settings;
import androidx.appcompat.app.AlertDialog;

import io.michaelrocks.paranoid.Obfuscate;

/**
 * Created by Nisarg on 13-07-2017.
 */

//For Showing progress
@Obfuscate
public class ShowProgress {


    ProgressDialog progressbar;

    public void showProgressDialog(Context mContext, String Text) {

        progressbar = new ProgressDialog(mContext);
        progressbar.setMessage(Text);
        progressbar.setIndeterminate(true);
        progressbar.show();
        progressbar.setCancelable(false);
    }


    public void hideProgressDialog(Context mContext) {
        if (progressbar != null && progressbar.isShowing()) {
            progressbar.dismiss();
        }
    }


    public void buildAlertMessageNoGps(final Context c) {
        final AlertDialog.Builder builder = new AlertDialog.Builder(c);
        builder.setMessage("Your GPS seems to be disabled, do you want to enable it?")
                .setCancelable(false)
                .setPositiveButton("Yes", new DialogInterface.OnClickListener() {
                    public void onClick(@SuppressWarnings("unused") final DialogInterface dialog, @SuppressWarnings("unused") final int id) {
                        c.startActivity(new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS));
                    }
                });
//                .setNegativeButton("No", new DialogInterface.OnClickListener() {
//                    public void onClick(final DialogInterface dialog, @SuppressWarnings("unused") final int id) {
//                        android.os.Process.killProcess(android.os.Process.myPid());
//                    }
//                });
        final AlertDialog alert = builder.create();
        alert.show();
    }


}
