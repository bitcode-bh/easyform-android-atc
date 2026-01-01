package com.easyform.newjitsi.activitys.drawing;

import android.view.MotionEvent;

public interface NormalDrawingListener {

    void onNormalDrawing(MotionEvent event,String drawingType);
    void drawHit(float hitX, float hitY);
}
