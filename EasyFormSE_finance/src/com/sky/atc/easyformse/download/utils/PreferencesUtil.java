package com.sky.atc.easyformse.download.utils;

import android.content.Context;
import android.content.SharedPreferences;

/**
 * Created by NareshChocha on 29/09/2021.
 *
 * @author NareshChocha
 */
public class PreferencesUtil {
    private static final String preferencesName = "EasyForm";
    private static SharedPreferences mySharedPreferences;

    public synchronized static SharedPreferences getPreferences(Context context) {
        if (mySharedPreferences == null) {
            mySharedPreferences = context.getSharedPreferences(preferencesName, Context.MODE_PRIVATE);
        }
        return mySharedPreferences;
    }
}
