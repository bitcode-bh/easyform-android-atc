package com.sky.atc.easyformse.photo;

import android.annotation.SuppressLint;
import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Point;
import android.graphics.Rect;
import android.util.AttributeSet;
import android.view.View;

import androidx.annotation.Nullable;

public class RectangleView extends View {
    private Paint drawPaint;
    private Canvas canvas;

    public static  int topN;
    public static  int bottomN;
    public static  int leftN;
    public static  int rightN;


    public RectangleView(Context context) {
        super(context);
    }

    public RectangleView(Context context, @Nullable AttributeSet attrs) {
        super(context, attrs);
        setupPaint();
    }

    private void setupPaint() {
        drawPaint = new Paint();
        drawPaint.setColor(Color.WHITE);
        drawPaint.setAntiAlias(true);
        drawPaint.setStrokeWidth(5);
        drawPaint.setStyle(Paint.Style.STROKE);
        drawPaint.setStrokeJoin(Paint.Join.ROUND);
        drawPaint.setStrokeCap(Paint.Cap.ROUND);
    }


    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        this.canvas = canvas;

//        final RectF rectF = new RectF();
////      final Paint paint = new Paint();
//        drawPaint.setARGB(128, 255, 255, 255);
//        rectF.set(50,1000, getMeasuredWidth()-50, getMeasuredHeight()-1000);
//        canvas.drawRect(rectF, drawPaint);

        int canvasW = getWidth();
        int canvasH = getHeight();
        @SuppressLint("DrawAllocation") Point centerOfCanvas = new Point(canvasW / 2, canvasH / 2);
        int rectW = 1000;
        int rectH = 300;
        int left = centerOfCanvas.x - (rectW / 2);
        int top = centerOfCanvas.y - (rectH / 2);
        int right = centerOfCanvas.x + (rectW / 2);
        int bottom = centerOfCanvas.y + (rectH / 2);


        leftN=left;
        rightN=right;
        topN=top;
        bottomN=bottom;

        @SuppressLint("DrawAllocation") Rect rect = new Rect(left, top, right, bottom);
        canvas.drawRect(rect, drawPaint);

    }
}
