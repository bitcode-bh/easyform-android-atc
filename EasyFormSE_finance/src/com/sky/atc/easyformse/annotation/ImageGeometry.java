package com.sky.atc.easyformse.annotation;

/** Geometry shared by preview fitting and image-relative input. */
public final class ImageGeometry {
    public final float scale, x, y;
    private ImageGeometry(float scale, float x, float y) { this.scale = scale; this.x = x; this.y = y; }
    public static ImageGeometry fit(int imageWidth, int imageHeight, int viewportWidth, int viewportHeight) {
        if (imageWidth <= 0 || imageHeight <= 0 || viewportWidth <= 0 || viewportHeight <= 0) throw new IllegalArgumentException("Invalid image/viewport");
        float scale = Math.min((float) viewportWidth / imageWidth, (float) viewportHeight / imageHeight);
        return new ImageGeometry(scale, (viewportWidth - imageWidth * scale) / 2, (viewportHeight - imageHeight * scale) / 2);
    }
    public static float normalized(float value, int dimension) { return Math.max(0, Math.min(1, value / dimension)); }
}
