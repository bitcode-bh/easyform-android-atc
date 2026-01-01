package com.easyform.newjitsi.activitys.drawing;

import android.annotation.SuppressLint;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BlurMaskFilter;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.EmbossMaskFilter;
import android.graphics.MaskFilter;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.PointF;
import android.graphics.PorterDuff;
import android.os.Build;
import android.os.Handler;
import android.util.AttributeSet;
import android.util.Log;
import android.util.Size;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewTreeObserver;

import java.util.ArrayList;

public class PaintView extends View {

    public static int BRUSH_SIZE = 10;
    public static int DEFAULT_COLOR = Color.WHITE;
    public static final int DEFAULT_BG_COLOR = Color.TRANSPARENT;
    private static final float TOUCH_TOLERANCE = 4;
    private float mX, mY;
    private Path mPath;
    private Paint mPaint;
    private ArrayList<FingerPath> paths = new ArrayList<>();
    public static int currentColor;
    private int backgroundColor = DEFAULT_BG_COLOR;
    private int strokeWidth;
    private boolean emboss;
    private boolean blur;
    private MaskFilter mEmboss;
    private MaskFilter mBlur;
    private Bitmap mBitmap;
    private Canvas mCanvas;
    private Paint mBitmapPaint = new Paint(Paint.DITHER_FLAG);


    private DrawingEventListner eventListner;
    private PointF startPoint;
    private PointF endPoint;
    private boolean isDrawing;
    //ArDrawingUtils arDrawingUtils = new ArDrawingUtils();
    Canvas canvas;
    View view;
    private int widthPaint;
    private int heightPaint;
    public static NormalDrawingListener normalDrawingListener;


    public PaintView(Context context) {
        this(context, null);
    }

    public PaintView(Context context, AttributeSet attrs) {
        super(context, attrs);
        mPaint = new Paint();
        mPaint.setAntiAlias(true);
        mPaint.setDither(true);
        mPaint.setColor(DEFAULT_COLOR);
        mPaint.setStyle(Paint.Style.STROKE);
        mPaint.setStrokeJoin(Paint.Join.ROUND);
        mPaint.setStrokeCap(Paint.Cap.ROUND);
        mPaint.setXfermode(null);
        mPaint.setAlpha(0xff);

        mEmboss = new EmbossMaskFilter(new float[]{1, 1, 1}, 0.4f, 6, 3.5f);
        mBlur = new BlurMaskFilter(5, BlurMaskFilter.Blur.NORMAL);
//      normalDrawingListener = this;
    }

    @Override
    protected void onLayout(boolean b, int i, int i1, int i2, int i3) {

    }

    public void init(Size screensSize, DrawingEventListner eventListner, View view) {

        Log.d("##INIT", String.valueOf(screensSize.getHeight()));

        this.eventListner = eventListner;
        this.view = view;
        int height = screensSize.getHeight();
        int width = screensSize.getWidth();

        mBitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        mCanvas = new Canvas(mBitmap);

        currentColor = DEFAULT_COLOR;
        strokeWidth = BRUSH_SIZE;

        ViewTreeObserver vto = view.getViewTreeObserver();
        vto.addOnGlobalLayoutListener(new ViewTreeObserver.OnGlobalLayoutListener() {
            @Override
            public void onGlobalLayout() {
                if (Build.VERSION.SDK_INT < Build.VERSION_CODES.JELLY_BEAN) {
                    view.getViewTreeObserver().removeGlobalOnLayoutListener(this);
                } else {
                    view.getViewTreeObserver().removeOnGlobalLayoutListener(this);
                }
                widthPaint = view.getLeft();
                heightPaint = view.getTop();

            }
        });
        invalidate();
    }

    public void normal() {
        emboss = false;
        blur = false;
    }

    public void emboss() {
        emboss = true;
        blur = false;
    }

    public void blur() {
        emboss = false;
        blur = true;
    }

    public void clear() {

        mCanvas.drawColor(Color.TRANSPARENT, PorterDuff.Mode.CLEAR);

        backgroundColor = DEFAULT_BG_COLOR;
        paths.clear();
        normal();
        invalidate();
    }

    @Override
    protected void onDraw(Canvas canvas) {
        if (canvas == null) {
            return;
        }
        canvas.save();
        if (mCanvas == null) {
            mCanvas = canvas;
        }

        mCanvas.drawColor(backgroundColor);

        for (FingerPath fp : paths) {
            mPaint.setColor(fp.color);
            mPaint.setStrokeWidth(fp.strokeWidth);
            mPaint.setMaskFilter(null);

            if (fp.emboss)
                mPaint.setMaskFilter(mEmboss);
            else if (fp.blur)
                mPaint.setMaskFilter(mBlur);

            mCanvas.drawPath(fp.path, mPaint);

        }

        int startX = (getWidth() - mBitmap.getWidth()) / 2;
        int startY = (getHeight() - mBitmap.getHeight()) / 2;

        canvas.drawBitmap(mBitmap, startX, startY, mBitmapPaint);
        canvas.restore();
//        mCanvas=canvas;
    }

    private void touchStart(float x, float y) {
        mPath = new Path();
        FingerPath fp = new FingerPath(currentColor, emboss, blur, strokeWidth, mPath);
        paths.add(fp);

        mPath.reset();
        mPath.moveTo(x, y);
        mX = x;
        mY = y;

        startPoint = new PointF(x, y);
        endPoint = new PointF();
    }

    private void touchMove(float x, float y) {

        if (ArDrawingUtils.getDrawingType().equalsIgnoreCase("")) {

            float dx = Math.abs(x - mX);
            float dy = Math.abs(y - mY);

            if (dx >= TOUCH_TOLERANCE || dy >= TOUCH_TOLERANCE) {
                mPath.quadTo(mX, mY, (x + mX) / 2, (y + mY) / 2);
                mX = x;
                mY = y;
            }
        }

        if (ArDrawingUtils.getDrawingType().equalsIgnoreCase("arrow")) {
            endPoint.x = x;
            endPoint.y = y;
        }
    }

    private void touchUp(MotionEvent event) {


        mX = event.getX();
        mY = event.getY();
        mPath.lineTo(mX, mY);

        if (ArDrawingUtils.getDrawingType().equalsIgnoreCase("arrow")) {


            float deltaX = endPoint.x - startPoint.x;
            float deltaY = endPoint.y - startPoint.y;
            float frac = (float) 0.1;
            float point_x_1 = startPoint.x + ((1 - frac) * deltaX + frac * deltaY);
            float point_y_1 = startPoint.y + ((1 - frac) * deltaY - frac * deltaX);
            float point_x_2 = endPoint.x;
            float point_y_2 = endPoint.y;
            float point_x_3 = startPoint.x + ((1 - frac) * deltaX - frac * deltaY);
            float point_y_3 = startPoint.y + ((1 - frac) * deltaY + frac * deltaX);
            mPath.moveTo(point_x_1, point_y_1);
            mPath.lineTo(point_x_2, point_y_2);
            mPath.lineTo(point_x_3, point_y_3);
//          mPath.lineTo(point_x_1, point_y_1);
//          mPath.lineTo(point_x_1, point_y_1);
            mCanvas.drawPath(mPath, mPaint);
            endPoint.x = event.getX();
            endPoint.y = event.getY();

            MotionEvent motionEvent = MotionEvent.obtain(event.getDownTime(), event.getEventTime(), MotionEvent.ACTION_MASK, point_x_1, point_y_1, event.getMetaState());
            eventListner.touchPaintView(motionEvent);

            MotionEvent motionEvent2 = MotionEvent.obtain(event.getDownTime() + 50, event.getEventTime() + 50, MotionEvent.ACTION_OUTSIDE, point_x_2, point_y_2, event.getMetaState());
            eventListner.touchPaintView(motionEvent2);

            MotionEvent motionEvent3 = MotionEvent.obtain(event.getDownTime() + 100, event.getEventTime() + 100, MotionEvent.ACTION_OUTSIDE, point_x_3, point_y_3, event.getMetaState());
            eventListner.touchPaintView(motionEvent3);
        }

    }

    @SuppressLint("ClickableViewAccessibility")
    @Override
    public boolean onTouchEvent(MotionEvent event) {

        if (ArDrawingUtils.isDrawingEnable) {

            float x = event.getX();
            float y = event.getY();

            mPaint.setColor(DEFAULT_COLOR);

            if (ConstantUtills.isIsPlainDrawing()) {

                switch (event.getAction()) {
                    case MotionEvent.ACTION_DOWN:

                        eventListner.showTouches(event, true);

                        if (ArDrawingUtils.getDrawingType().equalsIgnoreCase("text")) {
                            drawText(event);
                        } else if (ArDrawingUtils.getDrawingType().equalsIgnoreCase("imagearrow")) {
                            drawImageArrow(event);
                        } else {
                            touchStart(x, y);
                            invalidate();
                            eventListner.touchPaintView(event);
                        }
                        break;
                    case MotionEvent.ACTION_MOVE:
                        touchMove(x, y);
                        invalidate();

                        if (ArDrawingUtils.getDrawingType().equalsIgnoreCase("")) {
                            eventListner.touchPaintView(event);
                        }
                        break;
                    case MotionEvent.ACTION_UP:

                        if (!ArDrawingUtils.getDrawingType().equalsIgnoreCase("text") && !ArDrawingUtils.getDrawingType().equalsIgnoreCase("imagearrow")) {
                            touchUp(event);
                            invalidate();
                            eventListner.touchPaintView(event);
                        }

                        final Handler handler = new Handler();
                        handler.postDelayed(this::clear, 3000);

                        break;
                }
            }
        }
        return true;
    }

    @Override
    public void onDrawForeground(Canvas canvas) {
        super.onDrawForeground(canvas);
        this.canvas = canvas;
    }

    private void drawText(MotionEvent event) {
        String drawingText = "RaamBhai";
        eventListner.touchPaintView(event, drawingText);
    }

    private void drawImageArrow(MotionEvent event) {
        String drawingText = "imagearrow";
        eventListner.touchPaintView(event, drawingText);
    }

    public void normalDrawing(MotionEvent event, String drawingType) {

        float x = event.getX();
        float y = event.getY();
        mPaint.setColor(DEFAULT_COLOR);

        switch (event.getAction()) {
            case MotionEvent.ACTION_DOWN:

                if (drawingType.equalsIgnoreCase("text")) {
                    drawTextNormal(event);
                    invalidate();
                } else if (drawingType.equalsIgnoreCase("imagearrow")) {
                    drawImageArrow(event);
                } else {
                    touchStart(x, y);
                    invalidate();
                }
                break;
            case MotionEvent.ACTION_MOVE:
                touchMove(x, y);
                invalidate();

                break;
            case MotionEvent.ACTION_UP:

                if (!drawingType.equalsIgnoreCase("text") && !drawingType.equalsIgnoreCase("imagearrow")) {
                    touchUp(event);
                    invalidate();
                }
//                final Handler handler = new Handler();
//                handler.postDelayed(this::clear, 3000);
                break;
        }
    }

//    @Override
//    public void onNormalDrawing(MotionEvent event, String drawingType) {
//        normalDrawing(event, drawingType);
//    }

    private void drawTextNormal(MotionEvent event) {
        float x = event.getX();
        float y = event.getY();

        canvas.drawPaint(mPaint);
        canvas.drawText("Nitin", x, y, mPaint);
    }
}