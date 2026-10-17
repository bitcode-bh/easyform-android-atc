package org.apache.cordova;

import android.content.res.Resources;
import android.graphics.Canvas;
import android.graphics.ColorFilter;
import android.graphics.Outline;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.PixelFormat;
import android.graphics.Rect;
import android.graphics.drawable.Drawable;

/**
 * A filled (optionally outlined) rectangle whose corners are squircles: the
 * same superellipse corner the web screens draw with CSS
 * `corner-shape: squircle`, so native pop-ups match them. The radius is the
 * size of the corner box, as with border-radius.
 *
 * Also usable from XML (API 24+) as
 * {@code <drawable class="org.apache.cordova.SquircleDrawable$Dialog" />},
 * which is a white 16dp squircle for dialog windows.
 */
public class SquircleDrawable extends Drawable {
    private static final int STEPS = 12;           // points per corner
    private static final double EXPONENT = 0.5;    // 2 / n with n = 4 (CSS squircle)

    private final Paint fill = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint stroke = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Path path = new Path();
    private float radius;

    public SquircleDrawable() {
        this(0xFFFFFFFF, 0f);
    }

    public SquircleDrawable(int color, float radiusPx) {
        fill.setStyle(Paint.Style.FILL);
        fill.setColor(color);
        stroke.setStyle(Paint.Style.STROKE);
        stroke.setStrokeWidth(0f);
        radius = radiusPx;
    }

    public SquircleDrawable setStroke(float widthPx, int color) {
        stroke.setStrokeWidth(widthPx);
        stroke.setColor(color);
        invalidateSelf();
        return this;
    }

    public void setRadius(float radiusPx) {
        radius = radiusPx;
        buildPath(getBounds());
        invalidateSelf();
    }

    @Override
    protected void onBoundsChange(Rect bounds) {
        super.onBoundsChange(bounds);
        buildPath(bounds);
    }

    private void buildPath(Rect b) {
        path.reset();
        if (b.isEmpty()) return;
        float inset = stroke.getStrokeWidth() / 2f;
        float l = b.left + inset, t = b.top + inset, r = b.right - inset, bt = b.bottom - inset;
        float rad = Math.min(radius, Math.min(r - l, bt - t) / 2f);
        // Corner centres, walked clockwise from the top-left corner.
        corner(l + rad, t + rad, rad, -1, -1, true);
        corner(r - rad, t + rad, rad, 1, -1, false);
        corner(r - rad, bt - rad, rad, 1, 1, true);
        corner(l + rad, bt - rad, rad, -1, 1, false);
        path.close();
    }

    // One superellipse quarter around (cx, cy); sx/sy pick the quadrant.
    private void corner(float cx, float cy, float rad, int sx, int sy, boolean fromSide) {
        for (int i = 0; i <= STEPS; i++) {
            double a = (Math.PI / 2) * i / STEPS;
            double u = Math.pow(Math.cos(a), EXPONENT), v = Math.pow(Math.sin(a), EXPONENT);
            // fromSide: start on the vertical edge and end on the horizontal one.
            double dx = fromSide ? u : v, dy = fromSide ? v : u;
            float x = (float) (cx + sx * rad * dx), y = (float) (cy + sy * rad * dy);
            if (path.isEmpty()) path.moveTo(x, y);
            else path.lineTo(x, y);
        }
    }

    @Override
    public void draw(Canvas canvas) {
        canvas.drawPath(path, fill);
        if (stroke.getStrokeWidth() > 0f) canvas.drawPath(path, stroke);
    }

    @Override
    public void getOutline(Outline outline) {
        if (path.isEmpty()) return;
        outline.setConvexPath(path);   // a squircle is convex
    }

    @Override public void setAlpha(int alpha) { fill.setAlpha(alpha); stroke.setAlpha(alpha); invalidateSelf(); }
    @Override public void setColorFilter(ColorFilter cf) { fill.setColorFilter(cf); stroke.setColorFilter(cf); invalidateSelf(); }
    @Override public int getOpacity() { return PixelFormat.TRANSLUCENT; }

    /** White 16dp squircle for dialog window backgrounds (inflated from XML). */
    public static class Dialog extends SquircleDrawable {
        public Dialog() {
            super(0xFFFFFFFF, 16 * Resources.getSystem().getDisplayMetrics().density);
        }
    }
}
