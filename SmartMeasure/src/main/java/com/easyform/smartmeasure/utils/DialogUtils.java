package com.easyform.smartmeasure.utils;

import android.content.Context;
import android.content.DialogInterface;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.Button;

import androidx.appcompat.app.AlertDialog;

import com.easyform.smartmeasure.R;
import com.easyform.smartmeasure.databinding.AlertDialogLayoutBinding;
import com.google.android.material.dialog.MaterialAlertDialogBuilder;

import org.jetbrains.annotations.NotNull;

import java.util.Locale;

/**
 * Created by NareshChocha on 5/12/2022.
 *
 * @author NareshChocha
 */
public class DialogUtils {
    public static void displayHardwareMissingWarning(@NotNull Context context, HeightDialogCallBack heightDialogCallBack) {
        AlertDialogLayoutBinding alertDialogLayoutBinding = AlertDialogLayoutBinding.inflate(LayoutInflater.from(context));
        alertDialogLayoutBinding.tilNumber.setHint(R.string.height_manually);
        alertDialogLayoutBinding.tilNumber.setCounterEnabled(false);
        AlertDialog ad = new MaterialAlertDialogBuilder(context, R.style.MyThemeOverlay_App_MaterialAlertDialog)
                .setCancelable(false)
                .setTitle(context.getResources().getString(R.string.gyroscope_missing))
                .setMessage(context.getResources().getString(R.string.gyroscope_missing_message))
                .setView(alertDialogLayoutBinding.getRoot())
                .setPositiveButton(R.string.ok, null)
                .show();

        Button buttonPositive = ad.getButton(AlertDialog.BUTTON_POSITIVE);
        if (buttonPositive != null) {
            buttonPositive.setOnClickListener(v -> {
                if (alertDialogLayoutBinding.tilEtNumber.getText() != null && !alertDialogLayoutBinding.tilEtNumber.getText().toString().isEmpty()) {
                    if (heightDialogCallBack != null) {
                        ad.dismiss();
                        heightDialogCallBack.onSetHeightSuccess(alertDialogLayoutBinding.tilEtNumber.getText().toString());
                    }
                } else {
                    alertDialogLayoutBinding.tilNumber.setErrorEnabled(true);
                    alertDialogLayoutBinding.tilNumber.setError(context.getString(R.string.manually_height_error));
                }
            });
        }
    }

    public static void displayResultData(@NotNull Context context, double height, DialogInterface.OnClickListener buttonClickListener) {
        AlertDialog ad = new MaterialAlertDialogBuilder(context, R.style.MyThemeOverlay_App_MaterialAlertDialog).create();
        ad.setCancelable(false);
        ad.setTitle(R.string.calculated_height_data);
        ad.setMessage(String.format(Locale.getDefault(), context.getResources().getString(R.string.calculated_height), height));
        ad.setButton(DialogInterface.BUTTON_POSITIVE, context.getResources().getString(R.string.reset), buttonClickListener);
        ad.show();
    }

    public static void setHeightDialog(Context context, String height, HeightDialogCallBack heightDialogCallBack) {
        AlertDialogLayoutBinding alertDialogLayoutBinding = AlertDialogLayoutBinding.inflate(LayoutInflater.from(context));
        if (!height.isEmpty()) {
            alertDialogLayoutBinding.tilEtNumber.setText(height);
        }
        AlertDialog alertDialog = new MaterialAlertDialogBuilder(context, R.style.MyThemeOverlay_App_MaterialAlertDialog)
                .setTitle(R.string.set_height)
                .setView(alertDialogLayoutBinding.getRoot())
                .setCancelable(false)
                .setPositiveButton(R.string.set, null)
                .setNeutralButton(R.string.cancel, null).show();
        Button buttonPositive = alertDialog.getButton(AlertDialog.BUTTON_POSITIVE);
        Button buttonNeutral = alertDialog.getButton(AlertDialog.BUTTON_NEUTRAL);
        if (buttonPositive != null) {
            buttonPositive.setOnClickListener(v -> {
                if (alertDialogLayoutBinding.tilEtNumber.getText() != null && !alertDialogLayoutBinding.tilEtNumber.getText().toString().isEmpty()) {
                    if (alertDialogLayoutBinding.tilEtNumber.getText().toString().length() < 6) {
                        alertDialog.dismiss();
                        heightDialogCallBack.onSetHeightSuccess(alertDialogLayoutBinding.tilEtNumber.getText().toString());
                    } else {
                        alertDialogLayoutBinding.tilNumber.setErrorEnabled(true);
                        alertDialogLayoutBinding.tilNumber.setError(context.getString(R.string.user_height_error_1));
                    }
                } else {    
                    alertDialogLayoutBinding.tilNumber.setErrorEnabled(true);
                    alertDialogLayoutBinding.tilNumber.setError(context.getString(R.string.user_height_error_2));
                }
            });
        }
        if (buttonNeutral != null) {
            buttonNeutral.setOnClickListener(v -> {
                alertDialog.dismiss();
            });
        }
    }

    public interface HeightDialogCallBack {


        void onSetHeightSuccess(String height);
    }
}
