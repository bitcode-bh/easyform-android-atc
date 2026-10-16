package com.sky.atc.easyformse;

import android.content.Context;
import android.graphics.*;
import android.view.MotionEvent;
import android.view.ScaleGestureDetector;
import android.view.View;
import com.sky.atc.easyformse.annotation.AnnotationDocument;
import com.sky.atc.easyformse.annotation.ImageGeometry;
import java.util.ArrayList;
import java.util.List;

/** The same fit/zoom transform paints the image and maps touches back into it. */
class DrawingViewEditphoto extends View {
    enum Tool { NAVIGATE, DRAW, ERASE }
    final AnnotationDocument document;
    private final Bitmap image, overlay;
    private final Canvas overlayCanvas;
    private final Matrix transform = new Matrix(), inverse = new Matrix();
    private final ScaleGestureDetector scaleDetector;
    private final ArrayList<Float> points = new ArrayList<>();
    private Tool tool = Tool.DRAW;
    private int color = Color.RED;
    private float thickness = 6, fitScale, zoom = 1;
    private boolean navigating;
    private float lastX, lastY;
    private Runnable onChange;
    DrawingViewEditphoto(Context context, Bitmap image, AnnotationDocument document) {
        super(context); this.image = image; this.document = document;
        overlay = Bitmap.createBitmap(image.getWidth(), image.getHeight(), Bitmap.Config.ARGB_8888);
        image.setDensity(Bitmap.DENSITY_NONE);
        overlay.setDensity(Bitmap.DENSITY_NONE);
        overlayCanvas = new Canvas(overlay);
        scaleDetector = new ScaleGestureDetector(context, new ScaleGestureDetector.SimpleOnScaleGestureListener() {
            @Override public boolean onScale(ScaleGestureDetector detector) {
                float next = Math.max(1, Math.min(8, zoom * detector.getScaleFactor()));
                float factor = next / zoom;
                transform.postScale(factor, factor, detector.getFocusX(), detector.getFocusY());
                zoom = next; constrain(); invalidate(); return true;
            }
        });
        rebuild();
    }
    void onChange(Runnable listener) { onChange = listener; }
    void setTool(Tool next) { points.clear(); tool = next; invalidate(); }
    Tool getTool() { return tool; }
    void setColor(int next) { color = next; }
    void setThickness(float value) { thickness = Math.max(1, value); }
    void historyChanged() { points.clear(); rebuild(); invalidate(); if (onChange != null) onChange.run(); }
    private void rebuild() { overlay.eraseColor(Color.TRANSPARENT); render(overlayCanvas, document.snapshot(), image.getWidth(), image.getHeight()); }
    @Override protected void onSizeChanged(int width, int height, int oldWidth, int oldHeight) {
        if (width <= 0 || height <= 0) return;
        ImageGeometry fit = ImageGeometry.fit(image.getWidth(), image.getHeight(), width, height);
        fitScale = fit.scale;
        zoom = 1; transform.setScale(fitScale, fitScale);
        transform.postTranslate(fit.x, fit.y);
    }
    @Override protected void onDraw(Canvas canvas) {
        if (image.isRecycled() || overlay.isRecycled()) return;
        canvas.save(); canvas.concat(transform);
        canvas.drawBitmap(image, null, new RectF(0, 0, image.getWidth(), image.getHeight()), null);
        canvas.save(); canvas.clipRect(0, 0, image.getWidth(), image.getHeight());
        if (points.isEmpty()) canvas.drawBitmap(overlay, null, new RectF(0, 0, image.getWidth(), image.getHeight()), null);
        else {
            int layer = canvas.saveLayer(0, 0, image.getWidth(), image.getHeight(), null);
            canvas.drawBitmap(overlay, null, new RectF(0, 0, image.getWidth(), image.getHeight()), null);
            drawStroke(canvas, pointsArray(), tool == Tool.ERASE, color, strokeWidth(), image.getWidth(), image.getHeight());
            canvas.restoreToCount(layer);
        }
        canvas.restore(); canvas.restore();
    }
    private float strokeWidth() { return thickness * getResources().getDisplayMetrics().density / (fitScale * zoom * Math.min(image.getWidth(), image.getHeight())); }
    private float[] pointsArray() { float[] result = new float[points.size()]; for (int i = 0; i < result.length; i++) result[i] = points.get(i); return result; }
    private boolean addPoint(float x, float y) {
        if (!transform.invert(inverse)) return false;
        float[] point = { x, y }; inverse.mapPoints(point);
        if (points.isEmpty() && (point[0] < 0 || point[1] < 0 || point[0] > image.getWidth() || point[1] > image.getHeight())) return false;
        points.add(ImageGeometry.normalized(point[0], image.getWidth()));
        points.add(ImageGeometry.normalized(point[1], image.getHeight())); return true;
    }
    @Override public boolean onTouchEvent(MotionEvent event) {
        if (!isEnabled()) return false;
        int action = event.getActionMasked();
        if (action == MotionEvent.ACTION_POINTER_DOWN) { points.clear(); navigating = true; lastX = centerX(event); lastY = centerY(event); }
        scaleDetector.onTouchEvent(event);
        if (action == MotionEvent.ACTION_DOWN) {
            getParent().requestDisallowInterceptTouchEvent(true);
            navigating = tool == Tool.NAVIGATE; lastX = event.getX(); lastY = event.getY(); points.clear();
            if (!navigating) addPoint(lastX, lastY);
        } else if (action == MotionEvent.ACTION_MOVE) {
            if (navigating || event.getPointerCount() > 1) {
                float x = centerX(event), y = centerY(event);
                transform.postTranslate(x - lastX, y - lastY); lastX = x; lastY = y; constrain();
            } else if (!points.isEmpty()) {
                for (int i = 0; i < event.getHistorySize(); i++) addPoint(event.getHistoricalX(i), event.getHistoricalY(i));
                addPoint(event.getX(), event.getY());
            }
        } else if (action == MotionEvent.ACTION_POINTER_UP) {
            int remaining = event.getActionIndex() == 0 ? 1 : 0;
            lastX = event.getX(remaining); lastY = event.getY(remaining);
            // Stay in navigation until every finger is lifted; no accidental post-pinch stroke.
            navigating = true;
        } else if (action == MotionEvent.ACTION_UP) {
            if (!navigating && !points.isEmpty()) {
                addPoint(event.getX(), event.getY());
                document.stroke(tool == Tool.ERASE, color, strokeWidth(), pointsArray()); rebuild();
                if (onChange != null) onChange.run();
            }
            points.clear(); navigating = false; performClick();
        } else if (action == MotionEvent.ACTION_CANCEL) { points.clear(); navigating = false; }
        invalidate(); return true;
    }
    @Override public boolean performClick() { super.performClick(); return true; }
    private float centerX(MotionEvent event) { float x = 0; for (int i = 0; i < event.getPointerCount(); i++) x += event.getX(i); return x / event.getPointerCount(); }
    private float centerY(MotionEvent event) { float y = 0; for (int i = 0; i < event.getPointerCount(); i++) y += event.getY(i); return y / event.getPointerCount(); }
    private void constrain() {
        RectF bounds = new RectF(0, 0, image.getWidth(), image.getHeight()); transform.mapRect(bounds);
        float dx = bounds.width() <= getWidth() ? (getWidth() - bounds.width()) / 2 - bounds.left : Math.min(0, -bounds.left) + Math.max(0, getWidth() - bounds.right);
        float dy = bounds.height() <= getHeight() ? (getHeight() - bounds.height()) / 2 - bounds.top : Math.min(0, -bounds.top) + Math.max(0, getHeight() - bounds.bottom);
        transform.postTranslate(dx, dy);
    }
    static void render(Canvas canvas, List<AnnotationDocument.Command> commands, int width, int height) {
        DrawingRenderer renderer = new DrawingRenderer();
        for (AnnotationDocument.Command command : commands) {
            if (command.clear) canvas.drawColor(Color.TRANSPARENT, PorterDuff.Mode.CLEAR);
            else renderer.draw(canvas, command.points(), command.erase, command.color, command.width, width, height);
        }
    }
    private void drawStroke(Canvas canvas, float[] pts, boolean erase, int color, float width, int w, int h) { new DrawingRenderer().draw(canvas, pts, erase, color, width, w, h); }
    private static class DrawingRenderer {
        private final Paint brush = new Paint(Paint.ANTI_ALIAS_FLAG);
        void draw(Canvas canvas, float[] points, boolean erase, int color, float thickness, int width, int height) {
            brush.setStyle(Paint.Style.STROKE); brush.setStrokeJoin(Paint.Join.ROUND); brush.setStrokeCap(Paint.Cap.ROUND);
            brush.setColor(color); brush.setStrokeWidth(thickness * Math.min(width, height));
            brush.setXfermode(erase ? new PorterDuffXfermode(PorterDuff.Mode.CLEAR) : null);
            Path path = new Path(); path.moveTo(points[0] * width, points[1] * height);
            boolean moved = false;
            float previousX = points[0] * width, previousY = points[1] * height;
            for (int i = 2; i < points.length; i += 2) {
                float x = points[i] * width, y = points[i + 1] * height;
                moved |= x != previousX || y != previousY;
                path.quadTo(previousX, previousY, (previousX + x) / 2, (previousY + y) / 2);
                previousX = x; previousY = y;
            }
            path.lineTo(previousX, previousY);
            if (!moved) canvas.drawPoint(previousX, previousY, brush); else canvas.drawPath(path, brush);
        }
    }
    void release() { overlay.recycle(); }
}
