package com.sky.atc.easyformse.utils.newView;

import android.app.Activity;
import android.graphics.Color;
import android.view.View;
import android.view.Window;

import com.sky.atc.easyformse.R;

/**
 * What every camera screen shares around its picture: black system bars (the
 * navigation bar used to show as a white strip under the controls) and the
 * close button at the top left, which does what Back does.
 */
public final class CameraChrome {
    private CameraChrome() { }

    public static void apply(final Activity activity) {
        try {
            Window window = activity.getWindow();
            window.setNavigationBarColor(Color.BLACK);
            window.setStatusBarColor(Color.BLACK);
            View decor = window.getDecorView();
            decor.setSystemUiVisibility(decor.getSystemUiVisibility()
                    & ~View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR & ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);
            View close = activity.findViewById(R.id.cam_close);
            if (close != null) {
                close.setOnClickListener(new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        activity.onBackPressed();
                    }
                });
            }
        } catch (Exception ignored) { }
    }
}
