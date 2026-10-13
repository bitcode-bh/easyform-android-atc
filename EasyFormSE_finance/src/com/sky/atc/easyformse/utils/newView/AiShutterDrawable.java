package com.sky.atc.easyformse.utils.newView;

import android.animation.ValueAnimator;
import android.graphics.Canvas;
import android.graphics.ColorFilter;
import android.graphics.LinearGradient;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.PixelFormat;
import android.graphics.Rect;
import android.graphics.Shader;
import android.graphics.drawable.Drawable;
import android.view.animation.AccelerateDecelerateInterpolator;

/**
 * The shutter of the AI photo camera: a disc filled with colours that drift
 * from side to side, with a white sparkle in the middle and no outer ring.
 * It marks the photo as one the AI will check.
 */
public class AiShutterDrawable extends Drawable {
    private static final int[] COLORS = {
            0xFF3FB6E0, 0xFF7F77DD, 0xFFD4537E, 0xFFEF9F27, 0xFF3FB6E0, 0xFF7F77DD};

    private final Paint fill = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint spark = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Matrix shift = new Matrix();
    private final Path sparkle = new Path();
    private LinearGradient gradient;
    private float drift;   // 0..1, how far the colours have moved
    private ValueAnimator animator;

    public AiShutterDrawable() {
        spark.setColor(0xFFFFFFFF);
    }

    /** Starts the drift; call once the drawable is on a view. */
    public void start() {
        if (animator != null) return;
        animator = ValueAnimator.ofFloat(0f, 1f);
        animator.setDuration(3200);
        animator.setRepeatCount(ValueAnimator.INFINITE);
        animator.setRepeatMode(ValueAnimator.REVERSE);
        animator.setInterpolator(new AccelerateDecelerateInterpolator());
        animator.addUpdateListener(new ValueAnimator.AnimatorUpdateListener() {
            @Override
            public void onAnimationUpdate(ValueAnimator a) {
                drift = (Float) a.getAnimatedValue();
                invalidateSelf();
            }
        });
        animator.start();
    }

    public void stop() {
        if (animator != null) {
            animator.cancel();
            animator = null;
        }
    }

    @Override
    protected void onBoundsChange(Rect b) {
        float w = b.width();
        // Three widths of colour, so there is always more to drift into view.
        gradient = new LinearGradient(0, 0, w * 3f, w * 0.6f, COLORS, null, Shader.TileMode.CLAMP);
        fill.setShader(gradient);

        // A four-point sparkle, about a third of the disc across.
        float cx = b.exactCenterX(), cy = b.exactCenterY(), r = Math.min(b.width(), b.height()) * 0.19f, k = r * 0.24f;
        sparkle.reset();
        sparkle.moveTo(cx, cy - r);
        sparkle.quadTo(cx + k, cy - k, cx + r, cy);
        sparkle.quadTo(cx + k, cy + k, cx, cy + r);
        sparkle.quadTo(cx - k, cy + k, cx - r, cy);
        sparkle.quadTo(cx - k, cy - k, cx, cy - r);
        sparkle.close();
    }

    @Override
    public void draw(Canvas canvas) {
        Rect b = getBounds();
        if (gradient == null || b.isEmpty()) return;
        shift.setTranslate(b.left - drift * b.width() * 2f, b.top);
        gradient.setLocalMatrix(shift);
        canvas.drawCircle(b.exactCenterX(), b.exactCenterY(), Math.min(b.width(), b.height()) / 2f, fill);
        canvas.drawPath(sparkle, spark);
    }

    @Override
    public void setAlpha(int alpha) {
        fill.setAlpha(alpha);
        spark.setAlpha(alpha);
    }

    @Override
    public void setColorFilter(ColorFilter cf) {
        fill.setColorFilter(cf);
    }

    @Override
    public int getOpacity() {
        return PixelFormat.TRANSLUCENT;
    }
}
