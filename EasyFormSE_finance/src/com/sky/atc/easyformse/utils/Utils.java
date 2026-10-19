package com.sky.atc.easyformse.utils;

import android.content.Context;
import android.content.Intent;
import android.os.Environment;
import android.widget.Toast;

import com.sky.atc.easyformse.MainActivity;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.sqlitewraper;

import java.io.File;

/**
 * Created by NareshChocha on 02-09-2021.
 */
public class Utils {

    public static File getRootFolderFile(Context context) {
        return com.sky.atc.easyformse.utils.AppStorage.root();
        /*if (context != null) {
            return context.getExternalFilesDir(null);
        } else {
            return com.sky.atc.easyformse.utils.AppStorage.root();
        }*/
    }

    public static void logoutUser(String message) {
        Toast.makeText(sqlitewraper.context, message, Toast.LENGTH_SHORT).show();
        String login_key = "False";
        MySharedPreferences editor = sqlitewraper.getSecureShared("pre1");
        editor.putString("login_key", login_key);
        editor.commit();
        Intent i = new Intent(sqlitewraper.context, MainActivity.class);
        i.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        sqlitewraper.context.startActivity(i);
    }
}