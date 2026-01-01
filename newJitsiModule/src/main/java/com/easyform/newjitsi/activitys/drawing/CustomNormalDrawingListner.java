package com.easyform.newjitsi.activitys.drawing;

import android.graphics.Bitmap;
import android.view.MotionEvent;

public interface CustomNormalDrawingListner {
    void onTextDrawn(MotionEvent event,String textLable);
    void onImageShown(MotionEvent event, Bitmap bitmap,String arrowType);
}
