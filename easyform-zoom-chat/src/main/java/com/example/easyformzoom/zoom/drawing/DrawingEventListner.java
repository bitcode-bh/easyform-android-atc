package com.example.easyformzoom.zoom.drawing;

import android.view.MotionEvent;

public interface DrawingEventListner {

    void touchPaintView(MotionEvent event);
    void touchPaintView(MotionEvent event, String drawingText);
    void showTouches(MotionEvent event, boolean isShowing);
}
