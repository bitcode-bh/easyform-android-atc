package com.easyform.smartmeasure.utils;

import android.content.Context;
import android.content.SharedPreferences;

/**
 * Created by NareshChocha on 12/05/2021.
 *
 * @author NareshChocha
 */
public class PreferencesUtil {
    private static final String preferencesName = "smartMeasure";
    private static SharedPreferences mySharedPreferences;

    public synchronized static SharedPreferences getPreferences(Context context) {
        if (mySharedPreferences == null) {
            mySharedPreferences = context.getSharedPreferences(preferencesName, Context.MODE_PRIVATE);
        }
        return mySharedPreferences;
    }
}
