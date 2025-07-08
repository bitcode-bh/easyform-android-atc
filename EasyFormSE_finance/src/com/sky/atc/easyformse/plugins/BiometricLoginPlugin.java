package com.sky.atc.easyformse.plugins;


import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.widget.Toast;

import androidx.biometric.BiometricManager;
import com.sky.atc.easyformse.BiometricLogin;
import com.sky.atc.easyformse.sqlitewraper;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;


public class BiometricLoginPlugin extends CordovaPlugin {

    private CallbackContext callbackContext;
    static final int requestCode = 10023;
    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        this.callbackContext = callbackContext;

        if (action.equals("LoginWithFingerprint")) {

            if (isBiometricPromptEnabled(sqlitewraper.context)) {
                // biometric available on device show prompt
                Intent mIntent = new Intent(sqlitewraper.context,BiometricLogin.class);
                this.cordova.startActivityForResult(this, mIntent, requestCode);
                return true;
            }
        }
        return false;

    }

    public static boolean isBiometricPromptEnabled(Context context) {
        BiometricManager biometricManager = BiometricManager.from(context);
        switch (biometricManager.canAuthenticate()) {
            case BiometricManager.BIOMETRIC_SUCCESS:
                return biometricManager.canAuthenticate() == BiometricManager.BIOMETRIC_SUCCESS;
            case BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE:
               // Toast.makeText(sqlitewraper.context, "No biometric features available on this device", Toast.LENGTH_LONG).show();
                return false;

            case BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE:
               // Toast.makeText(sqlitewraper.context, "Biometric features are currently unavailable", Toast.LENGTH_LONG).show();
                return false;

            case BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED:
                Toast.makeText(sqlitewraper.context, "Fingerprint is not registered in device, please set it from setting", Toast.LENGTH_LONG).show();
                return false;

        }
        return false;
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent intent) {
        super.onActivityResult(requestCode, resultCode, intent);

        if (requestCode == BiometricLoginPlugin.requestCode  && resultCode == Activity.RESULT_OK) {
                if(intent.getExtras() != null)
                {
                    try{
                        if (intent.getExtras().containsKey("result"))
                        {
                            this.callbackContext.success("success");
                        }
                    }
                    catch (Exception e)
                    {
                        this.callbackContext.error("error");
                    }
                }
        }
    }
}
