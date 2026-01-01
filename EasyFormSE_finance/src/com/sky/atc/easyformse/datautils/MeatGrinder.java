package com.sky.atc.easyformse.datautils;

import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;

import androidx.annotation.NonNull;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

//For Root Detection Using NDK
@StringFogIgnore
public class MeatGrinder {
    private final static String LIB_NAME = "native-lib";
    private static boolean isLoaded;
    private static boolean isUnderTest = false;

    private MeatGrinder() {

    }

    public boolean isLibraryLoaded() {
        if (isLoaded) {
            return true;
        }
        try {
            if(isUnderTest) {
                throw new UnsatisfiedLinkError("under test");
            }
            System.loadLibrary(LIB_NAME);
            isLoaded = true;
        } catch (UnsatisfiedLinkError e) {

        }
        return isLoaded;
    }


    public static void isRooted(Context context) {

        if(isDetectedTestKeys()||isFoundSuBinary()||isDetectedDevKeys()||isNotFoundReleaseKeys()||isFoundDangerousProps()||isFoundDangerousProps()||isSuExists()||isAccessedSuperuserApk()||isFoundXposed()||isFoundResetprop()||isFoundWrongPathPermission()||isFoundHooks()){
//            Toast.makeText(context,"This device is rooted. You can't use this app.",Toast.LENGTH_SHORT).show();
            showAlertDialogAndExitApp(context);
        }
    }

    public static native boolean isDetectedDevKeys();

    public static native boolean isDetectedTestKeys();

    public static native boolean isNotFoundReleaseKeys();

    public static native boolean isFoundDangerousProps();

    public static native boolean isSuExists();

    public static native boolean isAccessedSuperuserApk();

    public static native boolean isFoundSuBinary();

    public static native boolean isFoundBusyboxBinary();

    public static native boolean isFoundXposed();

    public static native boolean isFoundResetprop();

    public static native boolean isFoundWrongPathPermission();

    public static native boolean isFoundHooks();

    public static native boolean isPermissiveSelinux();

    @NonNull
    public static MeatGrinder getInstance() {
        return InstanceHolder.INSTANCE;
    }

    private static class InstanceHolder {
        private static final MeatGrinder INSTANCE = new MeatGrinder();
    }

    public static void showAlertDialogAndExitApp(Context context) {

        AlertDialog alertDialog = new AlertDialog.Builder(context).create();
        alertDialog.setTitle("Alert");
        alertDialog.setCancelable(false);
        alertDialog.setMessage("This device is rooted. You can't use this app.");
        alertDialog.setButton(AlertDialog.BUTTON_NEUTRAL, "OK",
                new DialogInterface.OnClickListener() {
                    public void onClick(DialogInterface dialog, int which) {
                        dialog.dismiss();
                        System.exit(0);
                    }
                });

        alertDialog.show();
    }
}
