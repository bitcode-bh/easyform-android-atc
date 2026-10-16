package com.sky.atc.easyformse.camera;

/** Camera stream geometry is independent of viewport dimensions. */
public final class CameraGeometry {
    private CameraGeometry() {}
    public static int previewRotation(int sensor, int display, boolean front) {
        return front ? (360 - (sensor + display) % 360) % 360 : (sensor - display + 360) % 360;
    }
    public static int jpegRotation(int sensor, int display, boolean front) {
        return (sensor + (front ? -display : display) + 360) % 360;
    }
    public static int[] fit(int width, int height, int streamWidth, int streamHeight, int rotation) {
        if (rotation % 180 != 0) { int temp = streamWidth; streamWidth = streamHeight; streamHeight = temp; }
        float scale = Math.min((float) width / streamWidth, (float) height / streamHeight);
        return new int[]{Math.max(1, Math.round(streamWidth * scale)), Math.max(1, Math.round(streamHeight * scale))};
    }
    public static boolean needsLegacyFlip(boolean front, boolean mirror) { return front && !mirror; }
}
