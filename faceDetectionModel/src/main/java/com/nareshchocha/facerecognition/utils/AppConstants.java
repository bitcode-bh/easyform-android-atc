package com.nareshchocha.facerecognition.utils;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Matrix;
import android.util.Log;

import androidx.exifinterface.media.ExifInterface;

import java.io.File;

/**
 * Created by NareshChocha on 4/18/2022.
 *
 * @author NareshChocha
 */
public class AppConstants {

    // model settings
    /**
     * Input size for model
     */
    public static final int modelInputSize = 160;
    /**
     * output size for model
     */
    public static final int modelOutputSize = 512;
    /**
     * model face Mach Distance
     */
    public static final float modelDistanceMach = 20.0f; // change face match distance 15.0f to 20.f because comparing face same person with and without facial hair (like bread)
    /**
     * model File name
     */
    public final static String modelFile = "facenet_512.tflite";

    // FaceDetector settings
    /**
     * eye Open Probability Max
     */
    public final static float eyeOpenProbMax = 0.80f;
    /**
     * eye Close Probability Max
     */
    public final static float eyeCloseProbMax = 0.80f;
    /**
     * eye Max Test
     */
    public final static int eyeMaxTestCount = 1;

    private static final String[] okFileExtensions = new String[]{
            "jpg",
            "png",
//            "gif",
            "jpeg"
    };

    public static boolean isImage(File file) {
        for (String extension : okFileExtensions) {
            if (file.getName().toLowerCase().endsWith(extension)) {
                return true;
            }
        }
        return false;
    }


    public static Bitmap getRotateBitmap(String filePath) {
        int rotate = 0;
        try {
            File file = new File(filePath);
            ExifInterface exif = new ExifInterface(
                    file.getAbsolutePath());
            int orientation = exif.getAttributeInt(
                    ExifInterface.TAG_ORIENTATION,
                    ExifInterface.ORIENTATION_NORMAL);
            Log.v("my", "Exif orientation: " + orientation);
            switch (orientation) {
                case ExifInterface.ORIENTATION_ROTATE_270:
                    Log.v("", "rotated " + 270);
                    rotate = 270;
                    Log.e("rotate", "" + rotate);
                    break;
                case ExifInterface.ORIENTATION_ROTATE_180:
                    Log.v("", "rotated " + 180);
                    rotate = 180;
                    Log.e("rotate", "" + rotate);
                    break;
                case ExifInterface.ORIENTATION_ROTATE_90:
                    Log.v("", "rotated " + 90);
                    rotate = 90;
                    break;
            }
            return imageOrientation(file, rotate);

        } catch (Exception e) {
            return BitmapFactory.decodeFile(filePath);
        }
    }

    private static Bitmap imageOrientation(File file, int rotate) {
        Bitmap photo = BitmapFactory.decodeFile(file.getAbsolutePath());
        Matrix matrix = new Matrix();
        matrix.postRotate(rotate); // clockwise by 90 degrees
        photo = Bitmap.createBitmap(photo, 0, 0, photo.getWidth(), photo.getHeight(), matrix, true);
        return photo;
    }


}
