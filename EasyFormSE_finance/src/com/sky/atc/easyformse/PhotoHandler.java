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

import io.michaelrocks.paranoid.Obfuscate;

//Photo Handler Class for process and saving of captured photo
@Obfuscate
public class PhotoHandler implements PictureCallback {

    private final Context context;

    private MakePhotoActivity activity1;

    private View rectangleView;
    private View previewLayout;

    public PhotoHandler(Context context, MakePhotoActivity p1, View rectangleView, View previewLayout) {
        this.context = context;
        activity1 = p1;
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


            Matrix matrix = new Matrix();
            matrix.postRotate(90);
            Bitmap rotatedBitmap = Bitmap.createBitmap(bitmapPicture, 0, 0,
                    bitmapPicture.getWidth(), bitmapPicture.getHeight(), matrix, true);

            //calculate aspect ratio
            float koefX = (float) rotatedBitmap.getWidth() / (float) previewLayout.getWidth();
            float koefY = (float) rotatedBitmap.getHeight() / previewLayout.getHeight();

            //get viewfinder border size and position on the screen
            int x1 = (int) borderCamera.getX();
            int y1 = (int) borderCamera.getY();

            Log.d("##REC_Y_F_HANDLER_BLEFT", String.valueOf(x1));
            Log.d("##REC_Y_F_HANDLER_BTOP", String.valueOf(y1));

            int x2 = borderCamera.getWidth();
            int y2 = borderCamera.getHeight();

            //calculate position and size for cropping
            int cropStartX = Math.round(x1 * koefX);
            int cropStartY = Math.round(y1 * koefY);

            int cropWidthX = Math.round(x2 * koefX);
            int cropHeightY = Math.round(y2 * koefY);

            Log.d("##REC_Y_F_HANDLER_CX", String.valueOf(cropWidthX));
            Log.d("##REC_Y_F_HANDLER_CY", String.valueOf(cropHeightY));

            //check limits and make crop
            Bitmap croppedBitmapNew;
            if (cropStartX + cropWidthX <= rotatedBitmap.getWidth() &&
                    cropStartY + cropHeightY <= rotatedBitmap.getHeight()) {
                croppedBitmapNew = Bitmap.createBitmap(rotatedBitmap, cropStartX,
                        cropStartY, cropWidthX, cropHeightY);
            } else {
                croppedBitmapNew = null;
            }
            finalFile=savebitmap(croppedBitmapNew);
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