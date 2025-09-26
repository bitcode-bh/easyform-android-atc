package com.easyform.safetymeasure.automlvision;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Rect;
import android.util.AttributeSet;
import android.view.View;

import java.util.ArrayList;
import java.util.List;

public class OverlayView extends View {
    private List<DetectionResult> detections = new ArrayList<>();

    public Paint boxPaint;
    public  Paint textPaint;
    public  Paint debugPaint;
    Paint labelBackgroundPaint;
    private int previewBitmapWidth = 1;
    private int previewBitmapHeight = 1;
    int index = 0;
    // Toggle to draw the actual displayed image rectangle (helps debug mapping)
    private static final boolean DEBUG_VIEWPORT = true;

    public OverlayView(Context context) {
        super(context);
        init();
    }

    public OverlayView(Context context, AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    public void init()
    {

        boxPaint = new Paint();
        boxPaint.setStyle(Paint.Style.STROKE);
        boxPaint.setColor(Color.RED);
        boxPaint.setStrokeWidth(4f);

        labelBackgroundPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        labelBackgroundPaint.setColor(Color.RED);


        textPaint = new Paint();
        textPaint.setTextSize(25f);
        textPaint.setColor(Color.GREEN);
        textPaint.setStrokeWidth(2f);

        debugPaint = new Paint();
        debugPaint.setStyle(Paint.Style.STROKE);
        debugPaint.setStrokeWidth(4f);
        debugPaint.setColor(Color.parseColor("#ffffff"));
    }

    /**
     * Provide detection results (boxes are in bitmap pixel coordinates)
     * bmpW/bmpH are the width/height of the bitmap that the model used.
     */
    public void setDetections(List<DetectionResult> dets, int bmpW, int bmpH) {
        this.detections = dets;
        this.previewBitmapWidth = Math.max(1, bmpW);
        this.previewBitmapHeight = Math.max(1, bmpH);
        invalidate();
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);

        float viewW = getWidth();
        float viewH = getHeight();

        if (previewBitmapWidth <= 0 || previewBitmapHeight <= 0) return;

        // compute scale for FIT_CENTER-like mapping: center scaled inside view (no crop)
        float scale = Math.min(viewW / (float) previewBitmapWidth, viewH / (float) previewBitmapHeight);
        float scaledW = previewBitmapWidth * scale;
        float scaledH = previewBitmapHeight * scale;

        // compute top-left offset (letterbox/pillarbox)
        float dx = (viewW - scaledW) / 2f;
        float dy = (viewH - scaledH) / 2f;

        // optional: draw green box showing where the camera image is displayed
        if (DEBUG_VIEWPORT) {
            canvas.drawRect(dx, dy, dx + scaledW, dy + scaledH, debugPaint);
        }

        if (detections == null || detections.isEmpty()) return;

        for (DetectionResult d : detections) {
            // d.bbox is in pixels relative to the bitmap used for detection
            float left = d.bbox.left * scale + dx;
            float top = d.bbox.top * scale + dy;
            float right = d.bbox.right * scale + dx;
            float bottom = d.bbox.bottom * scale + dy;

            // clamp to view bounds
            left = Math.max(0, Math.min(left, viewW));
            right = Math.max(0, Math.min(right, viewW));
            top = Math.max(0, Math.min(top, viewH));
            bottom = Math.max(0, Math.min(bottom, viewH));


            // draw box and label
            canvas.drawRect(left, top, right, bottom, boxPaint);
            String label = d.label + " " + String.format("%.2f", d.score);

            // draw label background for readability (optional)
            float textX = left + 8;
            float textY = Math.max(40, top - 10);
            canvas.drawText(label, textX, textY, textPaint);
        }
    }

}
