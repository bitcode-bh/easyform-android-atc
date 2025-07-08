package com.sky.atc.easyformse.photo;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Matrix;
import android.graphics.Rect;
import android.os.Environment;
import android.util.Log;

import com.sky.atc.easyformse.NewCameraActivity;
import com.sky.atc.easyformse.camera_new;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.ArrayList;

import io.michaelrocks.paranoid.Obfuscate;


//photo Constant class for saving values for photo
@Obfuscate
public class PhotoConstants {

    public static String originalPhoto;

    public static Rect getLastRect() {
        return lastRect;
    }

    public static void setLastRect(Rect lastRect) {
        PhotoConstants.lastRect = lastRect;
    }

    public static Rect lastRect;

    public static ArrayList<String> originalPhotoList = new ArrayList<>();


    public String getOriginalPhoto() {
        return originalPhoto;
    }

    public void setOriginalPhoto(String originalPhoto) {
        this.originalPhoto = originalPhoto;
    }


    public static String rotateAndCompress(String filepath, int serverWidth, int serverHeight) {

        File f2 = null;
        Bitmap rotatedBitmap;
        try {

            File f = new File(filepath);
            BitmapFactory.Options options = new BitmapFactory.Options();
            options.inPreferredConfig = Bitmap.Config.ARGB_8888;
            Bitmap bitmapPicture = BitmapFactory.decodeStream(new FileInputStream(f), null, options);
            Matrix matrix = new Matrix();
            if (camera_new.isCropMode) {
                matrix.postRotate(NewCameraActivity.rotation);
            } else {
                matrix.postRotate(90);
            }
            rotatedBitmap = Bitmap.createBitmap(bitmapPicture, 0, 0,
                    bitmapPicture.getWidth(), bitmapPicture.getHeight(), matrix, true);

            f2 = savebitmap(rotatedBitmap, serverWidth, serverHeight);

        } catch (Exception e) {
            e.printStackTrace();
        }
        return f2.getAbsolutePath();
    }

    private static File savebitmap(Bitmap bmp, int serverWidth, int serverHeight) throws IOException {
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();

        Log.d("##OR_CROP_BEFORE", "Height: " + bmp.getHeight() + "Width: " + bmp.getWidth());

        bmp = resizeBitmap(bmp, serverWidth, serverHeight);

        Log.d("##OR_CROP_SERVER", "Height: " + serverHeight + "Width: " + serverWidth);
        Log.d("##OR_CROP", "Height: " + bmp.getHeight() + "Width: " + bmp.getWidth());


        bmp.compress(Bitmap.CompressFormat.JPEG, 100, bytes);
        File f = new File(createNewDirectory("Easyform photos"), "OR_" + System.currentTimeMillis() + ".jpg");
        f.createNewFile();
        FileOutputStream fo = new FileOutputStream(f);
        fo.write(bytes.toByteArray());
        fo.close();
        return f;
    }

    private static String createNewDirectory(String name) {
        // create a directory before creating a new file inside it.
        File directory = new File(Environment.getExternalStorageDirectory(), name);
        if (!directory.exists()) {
            directory.mkdirs();
        }
        return directory.getAbsolutePath();
    }


    private static Bitmap resizeBitmap(Bitmap image, int maxWidth, int maxHeight) {
        if (maxHeight > 0 && maxWidth > 0) {

            int width = image.getWidth();
            int height = image.getHeight();

            float ratioBitmap = (float) height / (float) width;
            float ratioMax = (float) maxHeight / (float) maxWidth;

            int finalWidth = maxWidth;
            int finalHeight = (int) (((float) maxWidth * ratioBitmap));

//            if (ratioMax > ratioBitmap) {
//                finalWidth = (int) ((float) maxHeight * ratioBitmap);
//            } else {
//                finalHeight = (int) ((float) maxWidth / ratioBitmap);
//            }
            image = Bitmap.createScaledBitmap(image, finalWidth, finalHeight, true);
        }
        return image;
    }
}
