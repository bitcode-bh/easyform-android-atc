package com.easyform.jitsi.utils.drawing;

import android.view.MotionEvent;

public interface DrawingEventListners {

    void touchPaintView(MotionEvent event);
    void touchPaintView(MotionEvent event, String drawingText);
    void showTouches(MotionEvent event, boolean isShowing);
}
