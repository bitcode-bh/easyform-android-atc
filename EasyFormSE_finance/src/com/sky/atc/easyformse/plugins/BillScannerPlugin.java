package com.sky.atc.easyformse.plugins;


import android.app.Activity;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.Bundle;
import android.provider.MediaStore;

import com.sky.atc.easyformse.billscanner.MySuperAppApplication;
import com.sky.atc.easyformse.billscanner.java.StillImageActivity;
import com.sky.atc.easyformse.billscanner.preference.ScannerConstants;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;

import java.io.FileNotFoundException;
import java.io.InputStream;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

@StringFogIgnore
public class BillScannerPlugin extends CordovaPlugin {


    private CallbackContext callbackContext;
    private final int SELECT_IMAGE = 1;
    private final int CAPTURE_IMAGE = 2;
    private final int CROP_IMAGE = 3;
    private final int STILL_IMAGE = 4;

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {

        this.callbackContext = callbackContext;
        try {
//                String pickoption = args.getJSONObject(0).getString("pickoption");
                //Cameraoption = 2 , ImagePick = 1, TextSelection = 1, Entityselection = 2
                String cameraoption = "2";
                String imagePick = "1";
                String textselection = "1";
                String entityselection = "2";
                MySuperAppApplication.setTextorentity(entityselection);

                if(imagePick.equalsIgnoreCase("1")){
                    Intent photoPickerIntent = new Intent(Intent.ACTION_PICK);
                    photoPickerIntent.setType("image/*");
                    if (this.cordova != null) {
                        this.cordova.startActivityForResult(this, photoPickerIntent, SELECT_IMAGE);
                        return true;
                    }
                }

                if(imagePick.equalsIgnoreCase("2")){
                    Intent takePictureIntent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
                    if (takePictureIntent.resolveActivity(this.cordova.getActivity().getPackageManager()) != null) {
                        if (this.cordova != null) {
                            this.cordova.startActivityForResult(this, takePictureIntent, SELECT_IMAGE);
                            return true;
                        }
                    }
                }


        } catch (Exception e) {
            this.callbackContext.error(e.getMessage());
        }
        return true;
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent intent) {
        switch (requestCode){
            case SELECT_IMAGE:
                if (resultCode == Activity.RESULT_OK) {

                    final Uri imageUri = intent.getData();
                    InputStream inputStream = null;
                    try {
                        inputStream = this.cordova.getActivity().getContentResolver().openInputStream(imageUri);
                        Bitmap btimap = BitmapFactory.decodeStream(inputStream);

                        ScannerConstants.selectedImageBitmap = btimap;
                        Intent intent1 = new Intent(this.cordova.getActivity(), Class.forName("com.labters.documentscanner.ImageCropActivity"));
                        if (this.cordova != null) {
                            this.cordova.startActivityForResult(this, intent1, CROP_IMAGE);
                        }

                    } catch (FileNotFoundException | ClassNotFoundException e) {
                        e.printStackTrace();
                    }
                }else {
                    this.callbackContext.error("Fail");
                }

                break;

            case CROP_IMAGE:

                if (resultCode == Activity.RESULT_OK) {
                    if (ScannerConstants.selectedImageBitmap != null) {
//                imgBitmap.setImageBitmap(ScannerConstants.selectedImageBitmap)
                        Intent intent1 = new Intent(this.cordova.getActivity(), StillImageActivity.class);
                        if (this.cordova != null) {
                            this.cordova.startActivityForResult(this, intent1, STILL_IMAGE);
                        }
                    }
                }else {
                    this.callbackContext.error("Fail");
                }


                break;

            case STILL_IMAGE:

                if (resultCode == Activity.RESULT_OK) {
                    Bundle bundle = intent.getExtras();
                    String status = null;

                    if (bundle != null) {
                        status = bundle.getString("selectedtext");
                    }
                    this.callbackContext.success(status);
                }else {
                    this.callbackContext.error("Fail");
                }

                break;
            default:
                break;
        }

        super.onActivityResult(requestCode, resultCode, intent);

    }
}
