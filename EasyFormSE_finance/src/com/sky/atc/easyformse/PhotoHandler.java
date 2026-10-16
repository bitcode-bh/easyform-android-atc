package com.sky.atc.easyformse;

import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Matrix;
import android.hardware.Camera;
import android.hardware.Camera.PictureCallback;
import android.os.Bundle;
import android.os.Environment;
import android.util.Log;
import android.view.View;
import android.widget.Toast;

import com.sky.atc.easyformse.photo.PhotoConstants;
import com.sky.atc.easyformse.utils.LogUtils;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

//Photo Handler Class for process and saving of captured photo
@StringFogIgnore
public class PhotoHandler implements PictureCallback {

    private final Context context;
    private final boolean mirrored;

    private MakePhotoActivity activity1;

    private View rectangleView;
    private View previewLayout;

    public PhotoHandler(Context context, MakePhotoActivity p1, View rectangleView, View previewLayout) {
        this.context = context;
        activity1 = p1;
        mirrored = p1.isPhotoMirrored();
        this.rectangleView = rectangleView;
        this.previewLayout = previewLayout;
    }

    @Override
    public void onPictureTaken(byte[] data, Camera camera) {

        File pictureFileDir = getDir();

        if (!pictureFileDir.exists() && !pictureFileDir.mkdirs()) {

            Toast.makeText(context, "Can't create directory to save image.",
                    Toast.LENGTH_LONG).show();
            return;

        }

        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyymmddhhmmss");
        String date = dateFormat.format(new Date());
        String photoFile = "Picture_" + date + ".jpg";

        String filename_phisical = pictureFileDir.getPath() + File.separator
                + photoFile;
        File pictureFile = new File(filename_phisical);

        try {
            FileOutputStream fos = new FileOutputStream(pictureFile);
            fos.write(data);
            fos.close();
            if (mirrored) com.sky.atc.easyformse.camera.CameraImages.mirrorFile(pictureFile);


            Bundle b = new Bundle();
            b.putString("status", filename_phisical);
            Intent intent = new Intent();
            intent.putExtras(b);

            //Crop mode and scan mode
            if (camera_new.isCropMode) {
                PhotoConstants.originalPhoto=pictureFile.getAbsolutePath();

                //camera scan mode
                if (camera_new.isScanmode){
                    gotoPhotoPreviewActivity(pictureFile);
                }else {
                    if (camera_new.isburstMode.equalsIgnoreCase("true")){
                        PhotoConstants.originalPhotoList.add(pictureFile.getAbsolutePath());
                        Log.d("##CROP_ORGILNALLIST", PhotoConstants.originalPhoto);
                    }
                    File newFile = cropImageToRectangle(pictureFile.getPath(),rectangleView);
                    activity1.getresult(newFile);
                }
            }else
                //Normal photo mode
                {
                activity1.getresult(pictureFile);
            }
        } catch (Exception error) {
            LogUtils.photoLogFile("Exception: " + error.toString(), PhotoHandler.class.getSimpleName() + "onPictureTaken");

            Toast.makeText(context, "Image could not be saved.",
                    Toast.LENGTH_LONG).show();
        }
    }

    //GoTo preview after photo click for scan mode
    private void gotoPhotoPreviewActivity(File pictureFile){
        String photoPath= pictureFile.getAbsolutePath();
        activity1.gotoPreviewActivity(photoPath);
    }

    private File getDir() {
        File sdDir = Environment
                .getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES);
        return new File(sdDir, "Easy_form");
    }


    //to save cropped bitmap
    private  File savebitmap(Bitmap bmp) throws IOException {
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        bmp.compress(Bitmap.CompressFormat.PNG, 100, bytes);
        File f = new File(createNewDirectory("Easyform photos") ,"cropimage_" + System.currentTimeMillis() + ".jpg");
        f.createNewFile();
        FileOutputStream fo = new FileOutputStream(f);
        fo.write(bytes.toByteArray());
        fo.close();
        return f;
    }


    //Crop Bitmap to rectangle
    private File cropImageToRectangle(String filepath, View borderCamera) {

        File finalFile = null;
        try {

            Log.d("##REC_Y_F_HANDLER", String.valueOf(borderCamera.getY()));

            File f = new File(filepath);
            finalFile = f;
            BitmapFactory.Options options = new BitmapFactory.Options();
            options.inPreferredConfig = Bitmap.Config.ARGB_8888;
            Bitmap bitmapPicture = BitmapFactory.decodeStream(new FileInputStream(f), null, options);


            Bitmap rotatedBitmap = com.sky.atc.easyformse.camera.CameraImages.orient(bitmapPicture, f);

            // Map the mask through the fitted preview, excluding any letterbox area.
            View livePreview = ((android.view.ViewGroup) previewLayout).getChildAt(0);
            int[] previewLocation = new int[2], maskLocation = new int[2];
            livePreview.getLocationOnScreen(previewLocation);
            borderCamera.getLocationOnScreen(maskLocation);
            float scaleX = (float) rotatedBitmap.getWidth() / livePreview.getWidth();
            float scaleY = (float) rotatedBitmap.getHeight() / livePreview.getHeight();
            int left = Math.max(0, Math.round((maskLocation[0] - previewLocation[0]) * scaleX));
            int top = Math.max(0, Math.round((maskLocation[1] - previewLocation[1]) * scaleY));
            int right = Math.min(rotatedBitmap.getWidth(), Math.round((maskLocation[0] - previewLocation[0] + borderCamera.getWidth()) * scaleX));
            int bottom = Math.min(rotatedBitmap.getHeight(), Math.round((maskLocation[1] - previewLocation[1] + borderCamera.getHeight()) * scaleY));
            if (right <= left || bottom <= top) throw new IOException("Crop is outside the camera image");
            Bitmap croppedBitmapNew = Bitmap.createBitmap(rotatedBitmap, left, top, right - left, bottom - top);
            finalFile = savebitmap(croppedBitmapNew);

        } catch (Exception e) {
            e.printStackTrace();
        }
        return  finalFile;
    }

    //to create New Directory
    public  String createNewDirectory(String name) {
        // create a directory before creating a new file inside it.
        File directory = new File(Environment.getExternalStorageDirectory(), name);
        if (!directory.exists()) {
            directory.mkdirs();
        }
        return directory.getAbsolutePath();
    }
}