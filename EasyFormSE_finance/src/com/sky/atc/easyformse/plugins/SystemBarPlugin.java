package com.sky.atc.easyformse.plugins;

import android.graphics.Color;
import android.os.Build;
import android.view.View;
import android.view.Window;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaArgs;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONException;

// Lets a page set the system navigation bar's colour, so it can continue
// whatever the page puts above it (the light tab bar, or the black one on the
// Micro Learning reels). Action "navColor": [colour as #RRGGBB, darkButtons].
public class SystemBarPlugin extends CordovaPlugin {

    @Override
    public boolean execute(String action, CordovaArgs args, final CallbackContext callbackContext) throws JSONException {
        // "pageColor": [colour] -- the WebView's own background, which is what
        // shows between one page and the next (white under Login, grey elsewhere).
        if ("pageColor".equals(action)) {
            final int page;
            try {
                page = Color.parseColor(args.getString(0));
            } catch (IllegalArgumentException e) {
                callbackContext.error("bad colour");
                return true;
            }
            cordova.getActivity().runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    webView.getView().setBackgroundColor(page);
                    callbackContext.success();
                }
            });
            return true;
        }
        if (!"navColor".equals(action)) {
            return false;
        }
        final int color;
        try {
            color = Color.parseColor(args.getString(0));
        } catch (IllegalArgumentException e) {
            callbackContext.error("bad colour");
            return true;
        }
        final boolean darkButtons = args.optBoolean(1);
        cordova.getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                Window window = cordova.getActivity().getWindow();
                window.setNavigationBarColor(color);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    View decor = window.getDecorView();
                    int flags = decor.getSystemUiVisibility();
                    if (darkButtons) {
                        flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                    } else {
                        flags &= ~View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                    }
                    decor.setSystemUiVisibility(flags);
                }
                callbackContext.success();
            }
        });
        return true;
    }
}
