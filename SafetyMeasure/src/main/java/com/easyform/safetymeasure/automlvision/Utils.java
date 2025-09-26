package com.easyform.safetymeasure.automlvision;

import android.annotation.SuppressLint;
import android.graphics.Bitmap;
import android.graphics.ImageFormat;
import android.graphics.Matrix;
import android.media.Image;

import androidx.camera.core.ImageProxy;

import java.nio.ByteBuffer;

public class Utils {

    public static Bitmap imageToBitmap(ImageProxy image) {
        @SuppressLint("UnsafeOptInUsageError") Image img = image.getImage();
        if (img == null) return null;

        if (image.getFormat() != ImageFormat.YUV_420_888) return null;

        int width = image.getWidth();
        int height = image.getHeight();

        ByteBuffer yBuffer = img.getPlanes()[0].getBuffer();
        ByteBuffer uBuffer = img.getPlanes()[1].getBuffer();
        ByteBuffer vBuffer = img.getPlanes()[2].getBuffer();

        int yRowStride = img.getPlanes()[0].getRowStride();
        int uvRowStride = img.getPlanes()[1].getRowStride();
        int uvPixelStride = img.getPlanes()[1].getPixelStride();

        int[] out = new int[width * height];

        for (int j = 0; j < height; j++) {
            for (int i = 0; i < width; i++) {
                int y = (yBuffer.get(j * yRowStride + i) & 0xFF);

                int uvIndex = (j / 2) * uvRowStride + (i / 2) * uvPixelStride;
                int u = (uBuffer.get(uvIndex) & 0xFF) - 128;
                int v = (vBuffer.get(uvIndex) & 0xFF) - 128;

                int r = (int) (y + 1.370705f * v);
                int g = (int) (y - 0.337633f * u - 0.698001f * v);
                int b = (int) (y + 1.732446f * u);

                r = Math.max(0, Math.min(255, r));
                g = Math.max(0, Math.min(255, g));
                b = Math.max(0, Math.min(255, b));

                out[j * width + i] = 0xFF000000 | (r << 16) | (g << 8) | b;
            }
        }

        Bitmap bmp = Bitmap.createBitmap(out, width, height, Bitmap.Config.ARGB_8888);

        // 🔥 handle rotation
        int rotationDegrees = image.getImageInfo().getRotationDegrees();
        if (rotationDegrees != 0) {
            Matrix m = new Matrix();
            m.postRotate(rotationDegrees);
            bmp = Bitmap.createBitmap(bmp, 0, 0, bmp.getWidth(), bmp.getHeight(), m, true);
        }

        return bmp;
    }
}
