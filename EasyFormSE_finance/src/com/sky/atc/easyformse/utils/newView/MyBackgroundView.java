package com.sky.atc.easyformse.utils.newView;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.RectF;
import android.util.AttributeSet;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.View;

import androidx.annotation.Nullable;

import com.otaliastudios.cameraview.CameraView;

/**
 * Created by NareshChocha on 12/8/2021.
 *
 * @author NareshChocha
 */
public class MyBackgroundView extends View {
    int viewWidth = 0;
    int viewHeight = 0;
    CameraView cvMainCamera;

    public MyBackgroundView(Context context, @Nullable AttributeSet attrs) {
        super(context, attrs);
    }

    public MyBackgroundView(Context context, @Nullable AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
    }

    public MyBackgroundView(Context context) {
        super(context);
    }

    Paint backGroundPaint = new Paint();
    Paint textPaint = new Paint();
    Rect rect;

    public void setRect(View view,boolean isFinish) {
        rect = new Rect(((int) view.getX()), ((int) view.getY()), view.getMeasuredWidth(), view.getMeasuredHeight());
        if (cvMainCamera != null && isFinish) {
            RectF rectF = new RectF(rect);
            Log.d("rectData: ", rectF.toString());
            cvMainCamera.startAutoFocus(rectF);
        }
        invalidate();
    }
    public static int convertDpToPixel(int dp, Context context){
        //return dp * (context.getResources().getDisplayMetrics().densityDpi / DisplayMetrics.DENSITY_DEFAULT);
        return (dp * context.getResources().getDisplayMetrics().densityDpi ) / DisplayMetrics.DENSITY_DEFAULT;
    }
    @Override
    protected void onDraw(Canvas canvas) {
        backGroundPaint.setColor(Color.parseColor("#70FF0000"));
        backGroundPaint.setStyle(Paint.Style.FILL);

        if (rect == null) {
            rect = new Rect(convertDpToPixel(50,getContext()),
                    convertDpToPixel(110,getContext()), viewWidth, viewHeight);
            if (cvMainCamera != null) {
                RectF rectF = new RectF(rect);
                Log.d("rectData In: ", rectF.toString());
                cvMainCamera.startAutoFocus(rectF);
            } else {
                Log.d("rectData B: ", " Camera null");
            }
        }
        Log.d("rectData: ", rect.toString());
        textPaint.setColor(Color.TRANSPARENT);
        canvas.drawRect(rect, textPaint);

        // Top
        Rect rectTop = new Rect(0, 0, getMeasuredWidth(), rect.top);
        canvas.drawRect(rectTop, backGroundPaint);

        // Bottom
        Rect rectBottom = new Rect(0, (int) rect.top + rect.bottom, getMeasuredWidth(), getMeasuredHeight());
        canvas.drawRect(rectBottom, backGroundPaint);

        // Start
        Rect rectStart = new Rect(0, rectTop.bottom, rect.left, rectBottom.top);
        canvas.drawRect(rectStart, backGroundPaint);


        // End
        Rect rectEnd = new Rect(rect.left + rect.right, rectTop.bottom, getMeasuredWidth(), rectBottom.top);
        canvas.drawRect(rectEnd, backGroundPaint);


        super.onDraw(canvas);
    }


    public void setCvMainCamera(CameraView cvMainCamera) {
        this.cvMainCamera = cvMainCamera;
        invalidate();
    }

    public void setViewWidth(int viewWidth) {
        this.viewWidth = viewWidth;
        invalidate();
    }

    public void setViewHeight(int viewHeight) {
        this.viewHeight = viewHeight;
        invalidate();
    }
}
