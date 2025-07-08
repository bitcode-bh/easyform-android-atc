package com.sky.atc.easyformse.plugins;

import android.content.Context;
import android.os.VibrationEffect;
import android.os.Vibrator;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;

import io.michaelrocks.paranoid.Obfuscate;

/**
 * Created by NareshChocha on 12/4/2023.
 *
 * @author NareshChocha
 */
@Obfuscate
public class VibrationPlugin extends CordovaPlugin {
    private Vibrator vibrator;
    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {

        Context context = cordova.getActivity().getApplicationContext();
        vibrator = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);

        if (action.equals("vibrate")) {
          //  long duration = args.getLong(0);
            vibrate(200);
            return true;
        }
        return false;
    }

    private void vibrate(long duration) {
        if (vibrator != null) {
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                VibrationEffect vibrationEffect = VibrationEffect.createOneShot(duration, VibrationEffect.DEFAULT_AMPLITUDE);
                vibrator.vibrate(vibrationEffect);
            } else {
                vibrator.vibrate(duration);
            }
        }
    }
}
