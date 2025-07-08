package com.easyform.smartmeasure.customViews;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.PorterDuff.Mode;
import android.graphics.PorterDuffXfermode;
import android.graphics.RectF;
import android.os.Bundle;
import android.os.Parcelable;
import android.util.AttributeSet;
import android.util.Log;
import android.view.View;

/**
 * Draws an analog gauge (a compass) for displaying bearing measurements from
 * device sensors.
 *
 * @author Kaleb
 */
public final class GaugeBearing extends View {

    private static final String tag = GaugeBearing.class.getSimpleName();

    private static final int DEGREE_CENTER = 0;
    private static final int DEGREE_MIN = 0;
    private static final int DEGREE_MAX = 360;

    private boolean handInitialized = false;

    private double handPosition = DEGREE_CENTER;
    private double handTarget = DEGREE_CENTER;
    private double handVelocity = 0.0f;
    private double handAcceleration = 0.0f;

    private long lastHandMoveTime = -1L;

    // Static bitmaps
    private Bitmap background;
    private Bitmap hand;

    private Paint backgroundPaint;
    private Paint facePaint;
    private Paint handPaint;
    private Paint rimPaint;
    private Paint rimOuterPaint;

    private Path handPath;

    private RectF faceRect;
    private RectF rimRect;
    private RectF rimOuterRect;

    public GaugeBearing(Context context) {
        super(context);
        init();
    }


    public GaugeBearing(Context context, AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    public GaugeBearing(Context context, AttributeSet attrs, int defStyle) {
        super(context, attrs, defStyle);
        init();
    }

    public void updateBearing(double azimuth) {
        // Adjust the range: 0 < range <= 360 (from: -180 < range <=
        // 180)
       // azimuth = (float) (Math.toDegrees(azimuth) + 360) % 360;

        setHandTarget( (Math.toDegrees(azimuth) + 360) % 360);
    }

    /**
     * Run the instance. This can be thought of as onDraw().
     */
    @Override
    protected void onDraw(Canvas canvas) {
        drawBackground(canvas);

        drawHand(canvas);

        moveHand();
    }

    @Override
    protected void onRestoreInstanceState(Parcelable state) {
        Bundle bundle = (Bundle) state;
        Parcelable superState = bundle.getParcelable("superState");
        super.onRestoreInstanceState(superState);

        handInitialized = bundle.getBoolean("handInitialized");
        handPosition = bundle.getFloat("handPosition");
        handTarget = bundle.getFloat("handTarget");
        handVelocity = bundle.getFloat("handVelocity");
        handAcceleration = bundle.getFloat("handAcceleration");
        lastHandMoveTime = bundle.getLong("lastHandMoveTime");
    }

    @Override
    protected Parcelable onSaveInstanceState() {
        Parcelable superState = super.onSaveInstanceState();

        Bundle state = new Bundle();
        state.putParcelable("superState", superState);
        state.putBoolean("handInitialized", handInitialized);
        state.putDouble("handPosition", handPosition);
        state.putDouble("handTarget", handTarget);
        state.putDouble("handVelocity", handVelocity);
        state.putDouble("handAcceleration", handAcceleration);
        state.putLong("lastHandMoveTime", lastHandMoveTime);
        return state;
    }

    /**
     * Initialize the instance.
     */
    private void init() {
        initDrawingTools();
    }

    /**
     * Initialize the drawing tools.
     */
    private void initDrawingTools() {

        // Rectangle for the rim of the gauge bezel
        rimRect = new RectF(0.12f, 0.12f, 0.88f, 0.88f);

        // Paint for the rim of the gauge bezel
        rimPaint = new Paint();
        rimPaint.setFlags(Paint.ANTI_ALIAS_FLAG);
        // The linear gradient is a bit skewed for realism
        rimPaint.setXfermode(new PorterDuffXfermode(Mode.CLEAR));

        float rimOuterSize = -0.04f;
        rimOuterRect = new RectF();
        rimOuterRect.set(rimRect.left + rimOuterSize, rimRect.top
                + rimOuterSize, rimRect.right - rimOuterSize, rimRect.bottom
                - rimOuterSize);

        rimOuterPaint = new Paint();
        rimOuterPaint.setFlags(Paint.ANTI_ALIAS_FLAG);
        rimOuterPaint.setColor(Color.rgb(158, 158, 158));

        float rimSize = 0.03f;
        faceRect = new RectF();
        faceRect.set(rimRect.left + rimSize, rimRect.top + rimSize,
                rimRect.right - rimSize, rimRect.bottom - rimSize);

        facePaint = new Paint();
        facePaint.setStyle(Paint.Style.FILL);
        facePaint.setFlags(Paint.ANTI_ALIAS_FLAG);
        facePaint.setAntiAlias(true);
        facePaint.setColor(Color.TRANSPARENT);

        handPaint = new Paint();
        handPaint.setAntiAlias(true);
        handPaint.setFlags(Paint.ANTI_ALIAS_FLAG);
        handPaint.setColor(Color.rgb(158, 158, 158));
        handPaint.setStyle(Paint.Style.FILL);

        handPath = new Path();
        handPath.moveTo(0.5f, 0.5f + 0.32f);
        handPath.lineTo(0.5f - 0.02f, 0.5f + 0.32f - 0.32f);

        handPath.lineTo(0.5f, 0.5f - 0.32f);
        handPath.lineTo(0.5f + 0.02f, 0.5f + 0.32f - 0.32f);
        handPath.lineTo(0.5f, 0.5f + 0.32f);
        handPath.addCircle(0.5f, 0.5f, 0.025f, Path.Direction.CW);

        backgroundPaint = new Paint();
        backgroundPaint.setFilterBitmap(true);
    }

    @Override
    protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
        int widthMode = MeasureSpec.getMode(widthMeasureSpec);
        int widthSize = MeasureSpec.getSize(widthMeasureSpec);

        int heightMode = MeasureSpec.getMode(heightMeasureSpec);
        int heightSize = MeasureSpec.getSize(heightMeasureSpec);

        int chosenWidth = chooseDimension(widthMode, widthSize);
        int chosenHeight = chooseDimension(heightMode, heightSize);

        int chosenDimension = Math.min(chosenWidth, chosenHeight);

        setMeasuredDimension(chosenDimension, chosenDimension);
    }

    /**
     * Chose the dimension of the view.
     */
    private int chooseDimension(int mode, int size) {
        if (mode == MeasureSpec.AT_MOST || mode == MeasureSpec.EXACTLY) {
            return size;
        } else { // (mode == MeasureSpec.UNSPECIFIED)
            return getPreferredSize();
        }
    }

    /**
     * In case there is no size specified
     */
    private int getPreferredSize() {
        return 300;
    }

    /**
     * Draw the rim of the gauge.
     */
    private void drawRim(Canvas canvas) {
        // First draw the most back rim
        canvas.drawOval(rimOuterRect, rimOuterPaint);
        // Then draw the small black line
        canvas.drawOval(rimRect, rimPaint);
    }

    /**
     * Draw the face of the gauge.
     */
    private void drawFace(Canvas canvas) {
        canvas.drawOval(faceRect, facePaint);
    }


    /**
     * Draw the gauge hand.
     */
    private void drawHand(Canvas canvas) {
        // *Bug Notice* We draw the hand with a bitmap and a new canvas because
        // canvas.drawPath() doesn't work. This seems to be related to devices
        // with hardware acceleration enabled.

        // free the old bitmap
        if (hand != null) {
            hand.recycle();
        }

        hand = Bitmap.createBitmap(getWidth(), getHeight(),
                Bitmap.Config.ARGB_8888);
        Canvas handCanvas = new Canvas(hand);
        float scale = (float) getWidth();
        handCanvas.scale(scale, scale);

        handCanvas.save();
        handCanvas.rotate((float) handPosition, 0.5f, 0.5f);
        handCanvas.drawPath(handPath, handPaint);

        canvas.drawBitmap(hand, 0, 0, backgroundPaint);
    }

    /**
     * Draw the background of the gauge.
     */
    private void drawBackground(Canvas canvas) {
        if (background == null) {
            Log.w(tag, "Background not created");
        } else {
            canvas.drawBitmap(background, 0, 0, backgroundPaint);
        }
    }

    @Override
    protected void onSizeChanged(int w, int h, int oldw, int oldh) {
        Log.d(tag, "Size changed to " + w + "x" + h);

        regenerateBackground();
    }

    /**
     * Regenerate the background image. This should only be called when the size
     * of the screen has changed. The background will be cached and can be
     * reused without needing to redraw it.
     */
    private void regenerateBackground() {
        // free the old bitmap
        if (background != null) {
            background.recycle();
        }

        background = Bitmap.createBitmap(getWidth(), getHeight(),
                Bitmap.Config.ARGB_8888);
        Canvas backgroundCanvas = new Canvas(background);
        float scale = (float) getWidth();
        backgroundCanvas.scale(scale, scale);

        drawRim(backgroundCanvas);
        drawFace(backgroundCanvas);
    }

    /**
     * Move the hand.
     */
    private void moveHand() {
        handPosition = handTarget;
    }

    /**
     * Indicate where the hand should be moved to.
     */
    private void setHandTarget(double bearing) {
        if (bearing < DEGREE_MIN) {
            bearing = DEGREE_MIN;
        } else if (bearing > DEGREE_MAX) {
            bearing = DEGREE_MAX;
        }

        handTarget = bearing;
        handInitialized = true;

        invalidate();
    }

}
