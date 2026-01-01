package com.sky.atc.easyformse.datautils;


import android.util.Log;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

//For Root Detection
@StringFogIgnore
public class RootUtils {

    public static boolean checkRooted() {
        Log.d("##M1", String.valueOf(checkRootAccessMethod1()));
        Log.d("##M2", String.valueOf(checkRootAccessMethod2()));
        Log.d("##M3", String.valueOf(checkRootAccessMethod3()));
//
        if( checkRootAccessMethod3() == 0 || checkRootAccessMethod1() == 0|| checkRootAccessMethod2() == 0) {

            return true;
        }
        return false;
    }
    public static native int checkRootAccessMethod1();
    public static native int checkRootAccessMethod2();
    public static native int checkRootAccessMethod3();
}
