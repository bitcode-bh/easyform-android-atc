package com.sky.atc.easyformse.plugins;

import android.content.pm.ActivityInfo;
import android.os.Handler;
import android.os.Looper;
import android.view.KeyEvent;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;

@StringFogIgnore
public class SafetyVideoOrientationPlugin extends CordovaPlugin {
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    private void restoreCordovaBackButton() {
        if (webView != null) {
            webView.setButtonPlumbedToJs(KeyEvent.KEYCODE_BACK, true);
        }
    }

    private void restoreCordovaBackButtonAfterFullscreen() {
        restoreCordovaBackButton();
        mainHandler.postDelayed(new Runnable() {
            @Override
            public void run() {
                restoreCordovaBackButton();
            }
        }, 250);
        mainHandler.postDelayed(new Runnable() {
            @Override
            public void run() {
                restoreCordovaBackButton();
            }
        }, 750);
    }

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        final int requestedOrientation;

        if ("landscape".equals(action)) {
            requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE;
        }
        else if ("portrait".equals(action)) {
            requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_PORTRAIT;
        }
        else {
            return false;
        }

        cordova.getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                cordova.getActivity().setRequestedOrientation(requestedOrientation);
                // Android System WebView can clear Cordova's bound back-key
                // state while its fullscreen custom view/orientation changes.
                // Re-plumb it so subsequent presses fire the JS backbutton.
                restoreCordovaBackButtonAfterFullscreen();
            }
        });
        callbackContext.success();
        return true;
    }

    @Override
    public void onResume(boolean multitasking) {
        restoreCordovaBackButtonAfterFullscreen();
    }
}
