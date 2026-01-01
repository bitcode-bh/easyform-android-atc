package com.easyform.newjitsi.utils;

import android.app.Activity;
import android.content.Context;

import com.google.ar.core.ArCoreApk;
import com.google.ar.core.exceptions.UnavailableDeviceNotCompatibleException;
import com.google.ar.core.exceptions.UnavailableUserDeclinedInstallationException;

public class UtilsAR {

    public static Boolean isARSupported(Context context) {
        return ArCoreApk.getInstance().checkAvailability(context.getApplicationContext()).isSupported();
    }

    public static Boolean isARCoreInstalledUpdated(Activity activity) {
        try {
            switch (ArCoreApk.getInstance().requestInstall(activity, false)) {
                case INSTALLED:
                    return true;
                case INSTALL_REQUESTED:
                    return false;
            }
        } catch (UnavailableDeviceNotCompatibleException |
                 UnavailableUserDeclinedInstallationException e) {
            return false;
        }
        return false;
    }
}
