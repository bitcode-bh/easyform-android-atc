package com.easyform.jitsi.utils.drawing;

import android.annotation.SuppressLint;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.util.AttributeSet;
import android.view.MotionEvent;
import android.view.View;

/**
 * Created by  SAVAN SOLANKI on 10/06/2022.
 *
 * @author Savan Solanki
 * @see com.easyform.jitsi.utils.drawing.CustomNormalDrawingListners
 *
 */
public class CustomNormalDrawing extends View implements CustomNormalDrawingListners {
    private String isTextLable = "";
    float positionX = 5;
    float positionY = 15;
    Paint mPaint;
    private Canvas mCanvas;
    private Bitmap mBitmap;
    //    private String isTextLable = "img";
    private static String textLable = "NA";
    public static CustomNormalDrawingListners customNormalDrawingListners;
    private Bitmap bitmapNew;

    public CustomNormalDrawing(Context context) {
        super(context);
        mPaint = new Paint();
        mPaint.setTextSize(100);
        mPaint.setColor(0xFF0000FF);
        setWillNotDraw(false);
        customNormalDrawingListners = this;
    }

    public CustomNormalDrawing(Context context, AttributeSet attrs) {
        super(context, attrs);
    }

    public void init() {

//        int height = screensSize.getHeight();
//        int width = screensSize.getWidth();
//        mBitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
//        mCanvas = new Canvas(mBitmap);
        mPaint = new Paint();
        mPaint.setTextSize(100);
        mPaint.setColor(0xFF0000FF);
        setWillNotDraw(false);
        customNormalDrawingListners = this;
    }


    @SuppressLint("ClickableViewAccessibility")
    @Override
    public boolean onTouchEvent(MotionEvent event) {
        if (event.getAction() == MotionEvent.ACTION_DOWN) {
            positionX = (int) event.getX();
            positionY = (int) event.getY();
            invalidate();
        }
        return true;
    }

    @Override
    public void onDraw(Canvas canvas) {
        if (isTextLable.equalsIgnoreCase("text")) {
            @SuppressLint("DrawAllocation") Paint paint = new Paint();
            paint.setStyle(Paint.Style.FILL);
            canvas.save();
            canvas.drawColor(Color.TRANSPARENT);
            paint.setStrokeWidth(1);
            paint.setColor(Color.MAGENTA);
            paint.setTextSize(50);
            paint.setStyle(Paint.Style.FILL);
            paint.setAntiAlias(true);
            canvas.drawText(textLable, positionX, positionY, paint);
            canvas.restore();
        }
        if (isTextLable.equalsIgnoreCase("img")) {

            @SuppressLint("DrawAllocation") Bitmap scaledBitmap = Bitmap.createScaledBitmap(bitmapNew, 100, 200, false);
//          canvas.translate(-100, -100);
            canvas.drawBitmap(scaledBitmap, positionX, positionY, mPaint);

//          Rect imageBounds = canvas.getClipBounds();  // Adjust this for where you want it
//          mCustomImage.setBounds(imageBounds);
//          mCustomImage.draw(canvas);
        }
    }

    @Override
    public void onTextDrawn(MotionEvent event, String textLable) {
        isTextLable = "text";
        CustomNormalDrawing.textLable = textLable;
        positionX = event.getX();
        positionY = event.getY();
        invalidate();
    }

    @Override
    public void onImageShown(MotionEvent event, Bitmap bitmap) {
        isTextLable = "img";

        bitmapNew = bitmap;
        positionX = event.getX();
        positionY = event.getY();
        invalidate();
    }
}
