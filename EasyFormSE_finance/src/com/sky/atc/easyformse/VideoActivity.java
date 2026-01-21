package com.sky.atc.easyformse;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ActivityInfo;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.media.ThumbnailUtils;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.util.ArrayList;
import java.util.LinkedHashMap;
@StringFogIgnore
public class VideoActivity extends AppCompatActivity {


    static final int ACTIVATION_REQUEST_code = 101;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);

        checkpermission();


        File imagesFolder = new File(Environment.getExternalStorageDirectory(),
                "Error_Easy_Video");
        imagesFolder.mkdirs();

        if (!(Thread.getDefaultUncaughtExceptionHandler() instanceof custom_ex)) {
            Thread.setDefaultUncaughtExceptionHandler(new custom_ex());
        }

        // int k=1/0;

    }


    void checkpermission() {


        if (ContextCompat.checkSelfPermission(VideoActivity.this, Manifest.permission.RECORD_AUDIO)
                + ContextCompat.checkSelfPermission(VideoActivity.this, Manifest.permission.WRITE_EXTERNAL_STORAGE)
                + ContextCompat.checkSelfPermission(VideoActivity.this, Manifest.permission.READ_EXTERNAL_STORAGE)
                + ContextCompat.checkSelfPermission(VideoActivity.this, Manifest.permission.CAMERA)
                != PackageManager.PERMISSION_GRANTED) {

            if (ActivityCompat.shouldShowRequestPermissionRationale(VideoActivity.this, Manifest.permission.RECORD_AUDIO) &&
                    ActivityCompat.shouldShowRequestPermissionRationale(VideoActivity.this, Manifest.permission.WRITE_EXTERNAL_STORAGE) &&
                    ActivityCompat.shouldShowRequestPermissionRationale(VideoActivity.this, Manifest.permission.READ_EXTERNAL_STORAGE) &&
                    ActivityCompat.shouldShowRequestPermissionRationale(VideoActivity.this, Manifest.permission.CAMERA)
            ) {


            } else {

                ActivityCompat.requestPermissions(VideoActivity.this,
                        new String[]{Manifest.permission.RECORD_AUDIO,
                                Manifest.permission.WRITE_EXTERNAL_STORAGE,
                                Manifest.permission.READ_EXTERNAL_STORAGE,
                                Manifest.permission.CAMERA,
                        },
                        ACTIVATION_REQUEST_code);
            }
        } else {

            startCamActivity();
//            Intent i= new Intent(this,AndroidVideoCapture.class);
//            startActivity(i);

        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode,
                                           String permissions[], int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == ACTIVATION_REQUEST_code) {// If request is cancelled, the result arrays are empty.
            if (grantResults.length > 0
                    && grantResults[0] == PackageManager.PERMISSION_GRANTED
                    && grantResults[1] == PackageManager.PERMISSION_GRANTED
                    && grantResults[2] == PackageManager.PERMISSION_GRANTED
                    && grantResults[3] == PackageManager.PERMISSION_GRANTED) {

                startCamActivity();

            } else {

                final AlertDialog.Builder builder = new AlertDialog.Builder(this);
                builder.setMessage("This Application cannot record video because it does not have the required permission.");
                builder.setPositiveButton("OK", null);
                builder.show();

                checkpermission();

            }
        }
    }

    public void startCamActivity()  {
        try {
            String newimei;
            Bundle bundle = getIntent().getExtras();
            Intent intentAndroidVideoCapture = new Intent(this, Class.forName("com.example.nitin.newcustomvideorecording.AndroidVideoCapture"));
            if (bundle == null) {

//            final android.app.AlertDialog.Builder builder = new android.app.AlertDialog.Builder(this);
//            builder.setMessage("You Can not open Application Directly...");
//            builder.setPositiveButton("OK", null);
//            builder.show();

            } else {

                newimei = bundle.getString("imei");
                SharedPreferences.Editor editor = getSharedPreferences("MY_PREFS_NAME", MODE_PRIVATE).edit();
                editor.putString("imei", newimei);
                intentAndroidVideoCapture.putExtras(bundle);
                editor.apply();
            }

            startActivityForResult(intentAndroidVideoCapture, 101);
        }
        catch (ClassNotFoundException e)
        {
            Toast.makeText(this,"Video Module is Not Added",Toast.LENGTH_LONG).show();
            Bundle b = new Bundle();
            Intent intent = new Intent();
            intent.putExtras(b);
            setResult(RESULT_CANCELED, intent);
            finish();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == 101) {

            if (resultCode == RESULT_OK) {
                String compressvideo_path = data.getStringExtra("video_path");
                setPath(compressvideo_path);

            } else {

                Bundle b = new Bundle();
                Intent intent = new Intent();
                intent.putExtras(b);
                setResult(RESULT_CANCELED, intent);
                finish();
            }

        }

    }

    private void setPath(String videopath) {


        File sdcard = Environment.getExternalStorageDirectory();
//        File sdcard = getExternalFilesDir(Environment.DIRECTORY_MOVIES);
        File f_file = new File(sdcard + "/Video_EasyForm/thumbnail");
        f_file.mkdir();

        ArrayList<JSONObject> list = new ArrayList<JSONObject>();


        String new_path = f_file.getAbsolutePath() + "/"
                + System.currentTimeMillis() + "." + "jpg";

        try {

            Bitmap bMap = ThumbnailUtils.createVideoThumbnail(videopath,
                    MediaStore.Video.Thumbnails.MICRO_KIND);
            bMap.compress(Bitmap.CompressFormat.JPEG, 100,
                    new FileOutputStream(new File(new_path)));

            //String base64v = BitMapToString(bMap);
            String file_size;
            File file = new File(videopath);
            long fileSizeInBytes = file.length();
            float fileSizeInKB = fileSizeInBytes / (float) (1024);
            float fileSizeInMB = fileSizeInBytes / (float) (1024 * 1024);
            long millisecond = System.currentTimeMillis();

            LinkedHashMap<String, Object> lHashMap = new LinkedHashMap<String, Object>();
            lHashMap.put("th_path", new_path);
            lHashMap.put("video_path", videopath);


            if (fileSizeInMB == 0) {

                file_size = String.format("%.2f", fileSizeInKB) + "KB";
            } else {

                file_size = String.format("%.2f", fileSizeInMB) + "MB";
            }
            lHashMap.put("video_size", file_size);
            lHashMap.put("type", "video");
            lHashMap.put("millisecond", millisecond);

            JSONObject json = new JSONObject(lHashMap);
            list.add(json);

            Intent res = new Intent();
            res.putExtra("status", list.toString());
            setResult(Activity.RESULT_OK, res);
            finish();

        } catch (Exception e) {

            e.printStackTrace();
        }
    }
}
