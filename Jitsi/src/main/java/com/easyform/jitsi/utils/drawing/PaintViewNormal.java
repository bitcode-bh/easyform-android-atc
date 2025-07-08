package com.easyform.jitsi.utils.drawing;

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
import android.os.Handler;
import android.util.AttributeSet;
import android.util.Log;
import android.util.Size;
import android.view.MotionEvent;
import android.view.View;

import java.util.ArrayList;

public class PaintViewNormal extends View implements NormalDrawingListeners, CustomNormalDrawingListners {

    public static int BRUSH_SIZE = 10;
    public static int DEFAULT_COLOR = Color.WHITE;
    public static int DEFAULT_BG_COLOR = Color.TRANSPARENT;
    private static final float TOUCH_TOLERANCE = 4;
    private float mX, mY;
    private Path mPath;
    private Path mPathArrow;
    private Path mPathArrowSecond;
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


    private PointF startPoint;
    private PointF endPoint;
    //ArDrawingUtils arDrawingUtils = new ArDrawingUtils();
    Canvas canvas;
    public static NormalDrawingListeners normalDrawingListener;
    private float positionX;
    private float positionY;
    private Bitmap bitmapNew;
    private String isTextLable = "";
    private String textLableNew = "NA";
    public static CustomNormalDrawingListners customNormalDrawingListner;
    private float pointx1;
    private float pointy1;
    private boolean first;
    private float pointx2;
    private float pointy2;


    public PaintViewNormal(Context context) {
        this(context, null);
    }

    public PaintViewNormal(Context context, AttributeSet attrs) {
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

        normalDrawingListener = this;
        customNormalDrawingListner = this;

    }

    @Override
    protected void onLayout(boolean b, int i, int i1, int i2, int i3) {

    }

    public void init(Size screensSize) {

        int height;
        int width = screensSize.getWidth();

        height = RemoteUtils.newNormalHeight;

        if (height == 0) {
            height = screensSize.getHeight();
        }
        mBitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        mCanvas = new Canvas(mBitmap);

        currentColor = DEFAULT_COLOR;
        strokeWidth = BRUSH_SIZE;
    }

    public void normal() {
        emboss = false;
        blur = false;
    }



    public void blur() {
        emboss = false;
        blur = true;
    }

    public void clear() {


        textLableNew = "";
        isTextLable = "clear";
        if (mCanvas != null)
            mCanvas.drawColor(Color.TRANSPARENT, PorterDuff.Mode.CLEAR);
        backgroundColor = DEFAULT_BG_COLOR;
        if (paths != null)
            paths.clear();
        normal();
        invalidate();
    }

    @Override
    protected void onDraw(Canvas canvas) {
        canvas.save();
        mCanvas.drawColor(backgroundColor);

        drawTextImage(mCanvas);

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

//      mCanvas=canvas;
    }

    private void touchStart(float x, float y) {
        mPath = new Path();
        FingerPath fp = new FingerPath(currentColor, emboss, blur, strokeWidth, mPath);
        paths.add(fp);

        mPathArrow = new Path();
        FingerPath fpArrow = new FingerPath(currentColor, emboss, blur, strokeWidth, mPathArrow);
        paths.add(fpArrow);


        mPathArrowSecond = new Path();
        FingerPath fpArrow2 = new FingerPath(currentColor, emboss, blur, strokeWidth, mPathArrowSecond);
        paths.add(fpArrow2);


        mPath.reset();
        mPath.moveTo(x, y);

        mPathArrow.reset();
        mPathArrow.moveTo(x, y);


        mPathArrowSecond.reset();
        mPathArrowSecond.moveTo(x, y);


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
            mCanvas.drawPath(mPath, mPaint);
            endPoint.x = event.getX();
            endPoint.y = event.getY();

        }

    }


    @SuppressLint("LogNotTimber")
    private void touchOutside(MotionEvent event) {

        if (!first) {
            Log.d("##ARROW_DRAW", "1");
            pointx2 = event.getX();
            pointy2 = event.getY();
            mPathArrow.moveTo(pointx1, pointy1);
            mPathArrow.lineTo(pointx2, pointy2);
            mCanvas.drawPath(mPathArrow, mPaint);
            endPoint.x = event.getX();
            endPoint.y = event.getY();
            first = true;
        } else {

            Log.d("##ARROW_DRAW", "2");
            float pointx3 = event.getX();
            float pointy3 = event.getY();

            mPathArrowSecond.lineTo(pointx2, pointy2);
            mPathArrowSecond.lineTo(pointx3, pointy3);
            mCanvas.drawPath(mPathArrowSecond, mPaint);

            first = false;

        }
    }

    private void touchMask(MotionEvent event) {
        pointx1 = event.getX();
        pointy1 = event.getY();
    }


    @Override
    public void onDrawForeground(Canvas canvas) {
        super.onDrawForeground(canvas);
        this.canvas = canvas;
    }


    @SuppressLint("LogNotTimber")
    public void normalDrawing(MotionEvent event, String drawingType) {

        float x = event.getX();
        float y = event.getY();
        mPaint.setColor(DEFAULT_COLOR);

        switch (event.getAction()) {
            case MotionEvent.ACTION_DOWN:

                if (drawingType.equalsIgnoreCase("text")) {
                    invalidate();
                } else if (drawingType.equalsIgnoreCase("imagearrow")) {
                    Log.d("TYPE", drawingType);
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
                final Handler handler = new Handler();
                handler.postDelayed(this::clear, 5000);
                break;
            case MotionEvent.ACTION_OUTSIDE:
                touchOutside(event);
                invalidate();
                break;

            case MotionEvent.ACTION_MASK:
                touchMask(event);
                invalidate();
                break;
        }
    }


    @SuppressLint("LogNotTimber")
    @Override
    public void onNormalDrawing(MotionEvent event, String drawingType) {

        Log.d("##onNormalDrawing", drawingType);

        if (drawingType.equalsIgnoreCase("delete")) {
            clear();
            return;
        }

        isTextLable = "text";
        textLableNew = "";
        positionX = event.getX();
        positionY = event.getY();
        invalidate();

        normalDrawing(event, drawingType);
    }

    @Override
    public void onTextDrawn(MotionEvent event, String textLable) {

        isTextLable = "text";
        textLableNew = textLable;
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

    private void drawTextImage(Canvas canvas) {


        if (isTextLable.equalsIgnoreCase("text")) {
            Paint paint = new Paint();
            paint.setStyle(Paint.Style.FILL);
            canvas.save();
            canvas.drawColor(Color.TRANSPARENT);
            paint.setStrokeWidth(1);
            paint.setColor(Color.MAGENTA);
            paint.setTextSize(50);
            paint.setStyle(Paint.Style.FILL);
            paint.setAntiAlias(true);
            canvas.drawText(textLableNew, positionX, positionY, paint);
            canvas.restore();
        }
        if (isTextLable.equalsIgnoreCase("img")) {
            Bitmap scaledBitmap = Bitmap.createScaledBitmap(bitmapNew, 100, 200, false);
            canvas.drawBitmap(scaledBitmap, positionX, positionY, mPaint);
        }

        if (isTextLable.equalsIgnoreCase("clear")) {
            canvas.drawColor(Color.TRANSPARENT, PorterDuff.Mode.CLEAR);
        }
    }
}