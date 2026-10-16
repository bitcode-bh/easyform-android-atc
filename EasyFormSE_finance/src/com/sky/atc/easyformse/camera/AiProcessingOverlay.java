package com.sky.atc.easyformse.camera;

import android.animation.ValueAnimator;
import android.content.Context;
import android.graphics.*;
import android.util.AttributeSet;
import android.view.View;

/** The form's light-sweep processing effect, confined to the captured image. */
public final class AiProcessingOverlay extends View {
    private final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final RectF imageRect = new RectF();
    private final ValueAnimator sweep = ValueAnimator.ofFloat(-.4f, 1.4f);
    private int imageWidth = 1, imageHeight = 1;
    private float position;
    public AiProcessingOverlay(Context context, AttributeSet attrs) {
        super(context, attrs);
        sweep.setDuration(1500); sweep.setRepeatCount(ValueAnimator.INFINITE);
        sweep.addUpdateListener(value -> { position = (Float)value.getAnimatedValue(); invalidate(); });
        setImportantForAccessibility(IMPORTANT_FOR_ACCESSIBILITY_NO);
    }
    public void setImageSize(int width, int height) {
        imageWidth = width; imageHeight = height; fit(); invalidate();
    }
    private void fit() {
        int[] size = CameraGeometry.fit(getWidth(), getHeight(), imageWidth, imageHeight, 0);
        float left = (getWidth()-size[0])/2f, top = (getHeight()-size[1])/2f;
        imageRect.set(left, top, left+size[0], top+size[1]);
    }
    @Override protected void onSizeChanged(int w, int h, int oldw, int oldh) { fit(); }
    @Override protected void onDraw(Canvas canvas) {
        int state = canvas.save(); canvas.clipRect(imageRect);
        paint.setShader(null); paint.setColor(0x332A3086); canvas.drawRect(imageRect, paint);
        float center = imageRect.left + imageRect.width()*position;
        float band = Math.max(1, imageRect.width()*.28f);
        paint.setShader(new LinearGradient(center-band, imageRect.bottom, center+band, imageRect.top,
                new int[]{0x003FB6E0,0x663FB6E0,0xA6FFFFFF,0x663FB6E0,0x003FB6E0},
                new float[]{0,.35f,.5f,.65f,1}, Shader.TileMode.CLAMP));
        canvas.drawRect(imageRect, paint); paint.setShader(null); canvas.restoreToCount(state);
    }
    private void animateIfVisible() { if(isShown() && getWindowVisibility()==VISIBLE) { if(!sweep.isStarted()) sweep.start(); } else sweep.cancel(); }
    @Override protected void onAttachedToWindow() { super.onAttachedToWindow(); animateIfVisible(); }
    @Override protected void onVisibilityChanged(View changed, int visibility) { super.onVisibilityChanged(changed, visibility); if(sweep != null) animateIfVisible(); }
    @Override protected void onWindowVisibilityChanged(int visibility) { super.onWindowVisibilityChanged(visibility); if(sweep != null) animateIfVisible(); }
    @Override protected void onDetachedFromWindow() { sweep.cancel(); super.onDetachedFromWindow(); }
}
