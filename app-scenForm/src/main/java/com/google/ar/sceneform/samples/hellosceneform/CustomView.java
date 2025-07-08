package com.google.ar.sceneform.samples.hellosceneform;

import android.animation.Animator;
import android.app.Activity;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.PorterDuff;
import android.os.Handler;
import android.util.AttributeSet;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewAnimationUtils;
import android.view.animation.AccelerateDecelerateInterpolator;

import androidx.core.content.ContextCompat;

public class CustomView extends View implements View.OnTouchListener {

    private Paint paint;
    private Canvas canvas;
    private Context context;
    Animator anim;
    private Bitmap mBitmap;
    private Canvas mCanvas;
    private Paint mBitmapPaint = new Paint(Paint.DITHER_FLAG);
    private  Activity activity;
    private View arView;

    public CustomView(Context context, AttributeSet attrs) {
        super(context, attrs);
        paint = new Paint();
        paint.setColor(Color.GRAY);
        this.context = context;
        Log.d("##OnToch", String.valueOf("Nit"));
    }

    @Override
    protected void onDraw(Canvas canvas) {

        canvas.save();
        mCanvas.drawColor(Color.TRANSPARENT);
        canvas.drawBitmap(mBitmap, 0, 0, mBitmapPaint);
        canvas.restore();
        this.canvas = canvas;
    }

    public void initDrawing(DisplayMetrics metrics,Activity activity,View arView,boolean isDetecte) {

        int height = metrics.heightPixels;
        int width = metrics.widthPixels;

        mBitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        mCanvas = new Canvas(mBitmap);
        this.activity= activity;
        this.arView=arView;
//      mBitmap=getResizedBitmap(mBitmap,1080,1920);

    }

    @Override
    public boolean onTouch(View view, MotionEvent motionEvent) {
        Log.d("##OnToch", String.valueOf(motionEvent.getAction()));
        return false;
    }

    public void drawHit(float hitX, float hitY) {
        Log.d("##HIT", "Hit being drawn");

        activity.runOnUiThread(new Runnable() {

            @Override
            public void run() {

                invalidate();
                Paint paint2 = new Paint();
                paint2.setColor(Color.LTGRAY);
                mCanvas.drawCircle(hitX, hitY, 40, paint2);

//                drawAnimtion(getRootView(), hitX, hitY);
                //Stuff that updates the UI

                final Handler handler = new Handler();
                handler.postDelayed(new Runnable() {
                    @Override
                    public void run() {

                        if (mCanvas != null) {
                            invalidate();
                            mCanvas.drawColor(Color.TRANSPARENT, PorterDuff.Mode.CLEAR);
                        }
                    }
                }, 1000);

            }
        });
    }

    private void drawAnimtion(View view, float getX, float getY) {

        int xPos = (int) getX;
        int yPos = (int) getY;

        float finalRadius = (float) Math.hypot(view.getWidth(), view.getHeight());

        if (anim != null) {
            if (anim.isRunning()) {
                anim.cancel();
            }
        }
        anim = ViewAnimationUtils.createCircularReveal(view, xPos, yPos, 0, 40);
        int color = R.color.rippelColor;
        view.setBackgroundColor(ContextCompat.getColor(context, color));
        view.setBackgroundResource(R.color.rippelColor);
        anim.setDuration(1000);
        anim.setInterpolator(new AccelerateDecelerateInterpolator());
        anim.start();
    }

    public Bitmap getResizedBitmap(Bitmap bm, int newWidth, int newHeight) {
        int width = bm.getWidth();
        int height = bm.getHeight();
        float scaleWidth = ((float) newWidth) / width;
        float scaleHeight = ((float) newHeight) / height;
        // CREATE A MATRIX FOR THE MANIPULATION
        Matrix matrix = new Matrix();
        // RESIZE THE BIT MAP
        matrix.postScale(scaleWidth, scaleHeight);

        // "RECREATE" THE NEW BITMAP
        Bitmap resizedBitmap = Bitmap.createBitmap(
                bm, 0, 0, width, height, matrix, false);

        return resizedBitmap;
    }
}
