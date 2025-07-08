package com.nareshchocha.databasemanager.Utils;

import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.view.View;
import android.widget.LinearLayout;

import androidx.core.widget.NestedScrollView;

import com.google.android.material.dialog.MaterialAlertDialogBuilder;
import com.nareshchocha.databasemanager.R;


/**
 * Created by NareshChocha on 3/28/2022.
 *
 * @author NareshChocha
 */
public class DialogUtils {
    public static void createTableDialog(Context context, String title, View rootView,
                                         DialogInterface.OnClickListener positiveButtonOnClick,
                                         DialogInterface.OnClickListener negativeButtonOnClick, String positiveButtonText, String negativeButtonText) {
        new MaterialAlertDialogBuilder(context, R.style.DatabaseThemeOverlay_App_MaterialAlertDialog)
                .setCancelable(false)
                .setTitle(title)
                .setView(rootView)
                .setPositiveButton(positiveButtonText, positiveButtonOnClick)
                .setNegativeButton(negativeButtonText, negativeButtonOnClick)
                .create().show();
    }

    public static void createUpdateOrDeleteTableDialog(Context context, String title, View rootView,
                                                       DialogInterface.OnClickListener positiveButtonOnClick,
                                                       DialogInterface.OnClickListener negativeButtonOnClick,
                                                       DialogInterface.OnClickListener deleteButtonOnClick,
                                                       String positiveButtonText, String negativeButtonText, String deleteButtonText) {
        MaterialAlertDialogBuilder materialAlertDialogBuilder = new MaterialAlertDialogBuilder(context, R.style.DatabaseThemeOverlay_App_MaterialAlertDialog)
                .setCancelable(false)
                .setTitle(title)
                .setView(rootView);
        if (!deleteButtonText.equalsIgnoreCase("")) {
            materialAlertDialogBuilder.setNeutralButton(deleteButtonText, deleteButtonOnClick);
        }
        if (!positiveButtonText.equalsIgnoreCase("")) {
            materialAlertDialogBuilder.setPositiveButton(positiveButtonText, positiveButtonOnClick);
        }
        if (!negativeButtonText.equalsIgnoreCase("")) {
            materialAlertDialogBuilder.setNegativeButton(negativeButtonText, negativeButtonOnClick);
        }

        materialAlertDialogBuilder.create().show();
    }

    public static void createDropTableDialog(Context context, String tableName, DialogInterface.OnClickListener positiveButtonOnClick, DialogInterface.OnClickListener negativeButtonOnClick) {
        new MaterialAlertDialogBuilder(context, R.style.DatabaseThemeOverlay_App_MaterialAlertDialog)
                .setCancelable(false)
                .setTitle("Are you sure ?")
                .setMessage("Pressing Yes will Remove " + tableName + " Table from Database")
                .setPositiveButton("Yes", positiveButtonOnClick)
                .setNegativeButton("No", negativeButtonOnClick)
                .create().show();
    }

    public static void createDeleteTableDialog(Context context, String tableName, DialogInterface.OnClickListener positiveButtonOnClick, DialogInterface.OnClickListener negativeButtonOnClick) {
        new MaterialAlertDialogBuilder(context, R.style.DatabaseThemeOverlay_App_MaterialAlertDialog)
                .setCancelable(false)
                .setTitle("Are you sure ?")
                .setMessage("Clicking on Yes will Delete All The Data of " + tableName + " Table from Database")
                .setPositiveButton("Yes", positiveButtonOnClick)
                .setNegativeButton("No", negativeButtonOnClick)
                .create().show();
    }
}
