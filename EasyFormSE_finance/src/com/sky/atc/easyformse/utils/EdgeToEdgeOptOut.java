package com.sky.atc.easyformse.utils;

import android.app.Activity;
import android.app.Application;
import android.os.Build;
import android.os.Bundle;

import com.sky.atc.easyformse.R;

/**
 * From Android 15 an app that targets 35 is drawn edge to edge, behind the status and navigation
 * bars. The screens here were laid out for the bars, so every activity (the app's own and the
 * libraries') is opted out as it is created, before its window exists. Android 16 removes the
 * opt-out for apps that target 36; moving to it will mean fitting each screen to the insets.
 */
public final class EdgeToEdgeOptOut {

    private EdgeToEdgeOptOut() {
    }

    public static void install(Application application) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.VANILLA_ICE_CREAM) return;
        application.registerActivityLifecycleCallbacks(new Application.ActivityLifecycleCallbacks() {
            @Override
            public void onActivityPreCreated(Activity activity, Bundle savedInstanceState) {
                activity.getTheme().applyStyle(R.style.EdgeToEdgeOptOut, true);
            }

            @Override public void onActivityCreated(Activity activity, Bundle savedInstanceState) { }
            @Override public void onActivityStarted(Activity activity) { }
            @Override public void onActivityResumed(Activity activity) { }
            @Override public void onActivityPaused(Activity activity) { }
            @Override public void onActivityStopped(Activity activity) { }
            @Override public void onActivitySaveInstanceState(Activity activity, Bundle outState) { }
            @Override public void onActivityDestroyed(Activity activity) { }
        });
    }
}
