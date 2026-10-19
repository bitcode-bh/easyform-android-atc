package com.sky.atc.easyformse;


import static com.sky.atc.easyformse.sqlitewraper.mainactivity;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.plugins.UploadPhotoPlugin;

import org.json.JSONException;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class OnlySavPhotoAcivity extends AppCompatActivity {


    Bundle Extras;
    String photo_path;
    Bitmap bmp = null;
    MySharedPreferences pref;
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        overridePendingTransition(0, 0);

        Extras = getIntent().getExtras();


        pref = sqlitewraper.getSecureShared("MyPref");
        if (Extras != null) {

            photo_path = Extras.getString("photo_path");
//            photo_path = "https://atcmwfm.americantower.com/UploadFile_After_05222019/ReferencePhotos/Correcr%20ODC%20Earthing.png";


        }

        if (checkPermission()) {
            photosave(photo_path);
        } else {
            requestPermission();
        }



    }


    @Override
    public void finish() {
        super.finish();
        overridePendingTransition(0, 0); // remove exit animation
    }
    public void photosave(String photo_path)
    {
        try {
            if (photo_path.startsWith("https://")) {
                new Thread(() -> {
                    try {
                        URL url = new URL(photo_path);
                        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                        connection.setDoInput(true);
                        connection.connect();
                        InputStream input = connection.getInputStream();
                        bmp = BitmapFactory.decodeStream(input);

                        Save_photo(bmp);


                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }).start();
            } else {
                try {
                    File imgFile = new File(photo_path);
                    if (imgFile.exists()) {

                        bmp = BitmapFactory.decodeFile(photo_path);
                        Save_photo(bmp);

                    }
                } catch (Exception e) {

                }
            }

        }

        catch (Exception e)
        {

        }
    }
    public void Save_photo(Bitmap bitmap)
    {
        try{
            String dir = com.sky.atc.easyformse.utils.AppStorage.root()
                    + File.separator + "myDirectory";
            // create folder
            File folder = new File(dir); // folder name
            folder.mkdirs();
            // create file
            String name = "IMG" + System.currentTimeMillis() + ".jpeg";
            File file = new File(dir, name);
            FileOutputStream out = new FileOutputStream(file);
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, out);
            out.flush();
            out.close();
            Bundle b = new Bundle();
            String path = file.getAbsolutePath();
            File filelenght = new File(path);
            long lengthoffile = filelenght.length();
            lengthoffile = lengthoffile / 1024;

            int filesize = Integer.parseInt("5") * 1000;
            if (lengthoffile < filesize) {

                b.putString("status", file.getAbsolutePath());
                Intent intent = new Intent();
                intent.putExtras(b);
                if (getParent() == null) {

                    setResult(RESULT_OK, intent);
                } else {
                    getParent().setResult(Activity.RESULT_OK, intent);
                }
                pref.putString("photo_path", file.getAbsolutePath());
                pref.commit();
                finish();


            } else {
                new Handler(Looper.getMainLooper()).post(new Runnable() {
                    @Override
                    public void run() {
                        Toast.makeText(OnlySavPhotoAcivity.this, "File size is too big ! \n File size must be less than " + 5 + "MB!", Toast.LENGTH_LONG).show();
                    }
                });

            }
        }
        catch (Exception e)
        {
            Bundle b = new Bundle();
            b.putString("result", e.toString());
            Intent intent = new Intent();
            intent.putExtras(b);
            setResult(RESULT_CANCELED, intent);
            finish();
        }
    }
    private static final int PERMISSION_REQUEST_CODE = 201;
    void requestPermission () {
        ActivityCompat.requestPermissions(this, new String[]{ Manifest.permission.WRITE_EXTERNAL_STORAGE, Manifest.permission.READ_EXTERNAL_STORAGE}, PERMISSION_REQUEST_CODE);
    }

    boolean checkPermission () {
        return (ActivityCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) +
                ActivityCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE)) == PackageManager.PERMISSION_GRANTED;
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERMISSION_REQUEST_CODE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED
                    && grantResults[1] == PackageManager.PERMISSION_GRANTED) {

                photosave(photo_path);
            } else {
                if (ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) +
                        ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED)  {

                    showMessageOKCancel("You need to allow access file and media permissions",
                            new DialogInterface.OnClickListener() {
                                @Override
                                public void onClick(DialogInterface dialog, int which) {
                                    Intent intent = new Intent();
                                    intent.setAction(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                                    intent.setData(Uri.fromParts("package", mainactivity.getPackageName(), null));
                                    mainactivity.startActivity(intent);
                                    finish();
                                }
                            });

                }
            }
        }
    }

    private void showMessageOKCancel(String message, DialogInterface.OnClickListener okListener) {
        new AlertDialog.Builder(OnlySavPhotoAcivity.this)
                .setMessage(message)
                .setPositiveButton("OK", okListener)
                .setCancelable(false)
                .create()
                .show();
    }
}
