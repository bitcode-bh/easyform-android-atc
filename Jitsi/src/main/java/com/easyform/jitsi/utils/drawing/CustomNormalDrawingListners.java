package com.easyform.jitsi.utils.drawing;

import android.graphics.Bitmap;
import android.view.MotionEvent;

public interface CustomNormalDrawingListners {
    void onTextDrawn(MotionEvent event,String textLable);
    void onImageShown(MotionEvent event, Bitmap bitmap);
}
