package com.sky.atc.easyformse.trip;

import com.sky.atc.easyformse.R;
import com.sky.atc.easyformse.sqlitewraper;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

//Trip Map background UTils class
@StringFogIgnore
public class TripMapUtils {

    private static boolean isAppRunnig;

    public static boolean isIsAppRunnig() {
        return isAppRunnig;
    }

    public static void setIsAppRunnig(boolean isAppRunnig) {
        TripMapUtils.isAppRunnig = isAppRunnig;
    }

    public static boolean isIsBypassActivity() {
        return isBypassActivity;
    }

    public static void setIsBypassActivity(boolean isBypassActivity) {
        TripMapUtils.isBypassActivity = isBypassActivity;
    }

    private static  boolean isBypassActivity;

    public static String TRIPMAPBACK = sqlitewraper.context.getResources().getString(R.string.TRIPMAPBACK);
    public static String MOCKLOCATION = sqlitewraper.context.getResources().getString(R.string.MOCKLOCATION);

}
