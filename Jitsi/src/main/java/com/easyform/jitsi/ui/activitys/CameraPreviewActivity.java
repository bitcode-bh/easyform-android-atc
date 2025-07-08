package com.easyform.jitsi.ui.activitys;

import static android.Manifest.permission.CAMERA;
import static android.Manifest.permission.WRITE_EXTERNAL_STORAGE;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.BroadcastReceiver;
import android.content.ContentValues;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.hardware.Camera;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.DisplayMetrics;
import android.util.Size;
import android.view.Gravity;
import android.view.SurfaceHolder;
import android.view.SurfaceView;
import android.view.View;
import android.view.ViewTreeObserver;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.ImageButton;
import android.widget.Toast;

import com.easyform.jitsi.R;
import com.easyform.jitsi.utils.cameradraw.DrawView;
import com.easyform.jitsi.utils.drawing.App;
import com.easyform.jitsi.utils.drawing.PaintViewNormal;
import com.easyform.jitsi.utils.drawing.RemoteUtils;
import com.google.android.material.slider.RangeSlider;
import com.google.ar.sceneform.samples.hellosceneform.HelloSceneformActivity;

import org.jitsi.meet.sdk.BroadcastIntentHelper;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.ArrayList;

import petrov.kristiyan.colorpicker.ColorPicker;

/**
 * Created by  SAVAN SOLANKI on 10/06/2022.
 *
 * @author SAVAN SOLANKI
 */
public class CameraPreviewActivity extends AppCompatActivity implements SurfaceHolder.Callback, Camera.PictureCallback {

    public static Activity activity;
    private SurfaceHolder surfaceHolder;
    private Camera camera;

    public static final int REQUEST_CODE = 100;

    private SurfaceView surfaceView;

    private String[] neededPermissions = new String[]{CAMERA, WRITE_EXTERNAL_STORAGE};

    private PaintViewNormal paintViewNormal;

    private FrameLayout frameLayoutCamera;

    public static boolean isSupportedDevice = true;

    private DrawView paint;
    private ImageButton save, color, stroke, undo;
    private RangeSlider rangeSlider;

    private BroadcastReceiver receiver;
    private IntentFilter filter;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_camera_preview);


        isSupportedDevice = false;
        HelloSceneformActivity.isArSupportedDevice = false;

        hideSystemUI();
        surfaceView = findViewById(R.id.surfaceView);
        frameLayoutCamera = findViewById(R.id.frame_cameraview);
        paintViewNormal = findViewById(R.id.paintviewNormal);


        filter = new IntentFilter();
        filter.addAction("com.jitsi.finish");

        receiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (intent.getAction().equalsIgnoreCase("com.jitsi.finish")) {
                    finish();
                }
            }
        };

        registerReceiver(receiver, filter);
//        paint = (DrawView) findViewById(R.id.draw_view);
//        rangeSlider = (RangeSlider) findViewById(R.id.rangebar);
//        undo = (ImageButton) findViewById(R.id.btn_undo);
//        save = (ImageButton) findViewById(R.id.btn_save);
//        color = (ImageButton) findViewById(R.id.btn_color);
//        stroke = (ImageButton) findViewById(R.id.btn_stroke);


        if (surfaceView != null) {
            boolean result = checkPermission();
            if (result) {
                setupSurfaceHolder();
            }
        }

        try {
            Intent intent = getIntent();
            int sourceWidth = Integer.parseInt((intent.getStringExtra("width")));
            int sourceHeight = Integer.parseInt((intent.getStringExtra("height")));

            changeLayoutSize(sourceWidth, sourceHeight);
//            drawcamera();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

//    private void drawcamera() {
//
//        // recent stroke from the canvas
//        undo.setOnClickListener(new View.OnClickListener() {
//            @Override
//            public void onClick(View view) {
//                paint.undo();
//            }
//        });
//
//
//        save.setOnClickListener(new View.OnClickListener() {
//            @Override
//            public void onClick(View view) {
//
//                // getting the bitmap from DrawView class
//                Bitmap bmp = paint.save();
//
//                // opening a OutputStream to write into the file
//                OutputStream imageOutStream = null;
//
//                ContentValues cv = new ContentValues();
//
//                // name of the file
//                cv.put(MediaStore.Images.Media.DISPLAY_NAME, "drawing.png");
//
//                // type of the file
//                cv.put(MediaStore.Images.Media.MIME_TYPE, "image/png");
//
//                // location of the file to be saved
//                cv.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES);
//
//                // get the Uri of the file which is to be created in the storage
//                Uri uri = getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, cv);
//                try {
//                    // open the output stream with the above uri
//                    imageOutStream = getContentResolver().openOutputStream(uri);
//
//                    // this method writes the files in storage
//                    bmp.compress(Bitmap.CompressFormat.PNG, 100, imageOutStream);
//
//                    // close the output stream after use
//                    imageOutStream.close();
//                } catch (Exception e) {
//                    e.printStackTrace();
//                }
//            }
//        });
//
//
//        color.setOnClickListener(new View.OnClickListener() {
//            @Override
//            public void onClick(View view) {
//                final ColorPicker colorPicker = new ColorPicker(CameraPreviewActivity.this);
//                colorPicker.setOnFastChooseColorListener(new ColorPicker.OnFastChooseColorListener() {
//                            @Override
//                            public void setOnFastChooseColorListener(int position, int color) {
//                                // get the integer value of color
//                                // selected from the dialog box and
//                                // set it as the stroke color
//                                paint.setColor(color);
//                            }
//
//                            @Override
//                            public void onCancel() {
//                                colorPicker.dismissDialog();
//                            }
//                        })
//                        // set the number of color columns
//                        // you want  to show in dialog.
//                        .setColumns(5)
//                        // set a default color selected
//                        // in the dialog
//                        .setDefaultColorButton(Color.parseColor("#000000"))
//                        .show();
//            }
//        });
//        // the button will toggle the visibility of the RangeBar/RangeSlider
//        stroke.setOnClickListener(new View.OnClickListener() {
//            @Override
//            public void onClick(View view) {
//                if (rangeSlider.getVisibility() == View.VISIBLE)
//                    rangeSlider.setVisibility(View.GONE);
//                else
//                    rangeSlider.setVisibility(View.VISIBLE);
//            }
//        });
//
//        // set the range of the RangeSlider
//        rangeSlider.setValueFrom(0.0f);
//        rangeSlider.setValueTo(100.0f);
//
//        // adding a OnChangeListener which will
//        // change the stroke width
//        // as soon as the user slides the slider
//        rangeSlider.addOnChangeListener(new RangeSlider.OnChangeListener() {
//            @SuppressLint("RestrictedApi")
//            @Override
//            public void onValueChange(@NonNull RangeSlider slider, float value, boolean fromUser) {
//                paint.setStrokeWidth((int) value);
//            }
//        });
//
//        // pass the height and width of the custom view
//        // to the init method of the DrawView object
//        ViewTreeObserver vto = paint.getViewTreeObserver();
//        vto.addOnGlobalLayoutListener(new ViewTreeObserver.OnGlobalLayoutListener() {
//            @Override
//            public void onGlobalLayout() {
//                paint.getViewTreeObserver().removeOnGlobalLayoutListener(this);
//                int width = paint.getMeasuredWidth();
//                int height = paint.getMeasuredHeight();
//                paint.init(height, width);
//            }
//        });
//    }

    private void hideSystemUI() {
        this.getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION // hide nav bar
                        | View.SYSTEM_UI_FLAG_FULLSCREEN // hide status bar
                        | View.SYSTEM_UI_FLAG_IMMERSIVE
        );
    }

    private void initNormalDrawing() {

        DisplayMetrics metrics = new DisplayMetrics();
        getWindowManager().getDefaultDisplay().getMetrics(metrics);
        Size size = new Size(RemoteUtils.getRealSizeWidth(), RemoteUtils.getRealSizeHeight());
        if (size.getHeight() == 0) {
            size = new Size(metrics.widthPixels, metrics.heightPixels);
        }
        paintViewNormal.init(size);
        paintViewNormal.normal();
    }

    @Override
    protected void onResume() {
        super.onResume();

        registerReceiver(receiver, filter);
    }

    @Override
    public void onBackPressed() {
        super.onBackPressed();
        stopScreenShare();
        finish();

    }

    @Override
    protected void onDestroy() {
        if (receiver != null) {
            unregisterReceiver(receiver);
            receiver = null;
        }
        super.onDestroy();
    }

    public static void Stop() {

        activity.finish();
    }

    private boolean checkPermission() {
        int currentAPIVersion = Build.VERSION.SDK_INT;
        if (currentAPIVersion >= Build.VERSION_CODES.M) {
            ArrayList<String> permissionsNotGranted = new ArrayList<>();
            for (String permission : neededPermissions) {
                if (ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) {
                    permissionsNotGranted.add(permission);
                }
            }
            if (permissionsNotGranted.size() > 0) {
                boolean shouldShowAlert = false;
                for (String permission : permissionsNotGranted) {
                    shouldShowAlert = ActivityCompat.shouldShowRequestPermissionRationale(this, permission);
                }
                if (shouldShowAlert) {
                    showPermissionAlert(permissionsNotGranted.toArray(new String[permissionsNotGranted.size()]));
                } else {
                    requestPermissions(permissionsNotGranted.toArray(new String[permissionsNotGranted.size()]));
                }
                return false;
            }
        }
        return true;
    }

    private void showPermissionAlert(final String[] permissions) {
        AlertDialog.Builder alertBuilder = new AlertDialog.Builder(this);
        alertBuilder.setCancelable(true);
        alertBuilder.setTitle("Persmission required");
        alertBuilder.setMessage("Please allow");
        alertBuilder.setPositiveButton(android.R.string.yes, (dialog, which) -> requestPermissions(permissions));
        AlertDialog alert = alertBuilder.create();
        alert.show();
    }

    private void requestPermissions(String[] permissions) {
        ActivityCompat.requestPermissions(CameraPreviewActivity.this, permissions, REQUEST_CODE);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        if (requestCode == REQUEST_CODE) {
            for (int result : grantResults) {
                if (result == PackageManager.PERMISSION_DENIED) {
                    Toast.makeText(CameraPreviewActivity.this, "Permission", Toast.LENGTH_LONG).show();
                    setViewVisibility(R.id.showPermissionMsg, View.VISIBLE);
                    return;
                }
            }

            setupSurfaceHolder();
        }
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
    }

    private void setViewVisibility(int id, int visibility) {
        View view = findViewById(id);
        if (view != null) {
            view.setVisibility(visibility);
        }
    }

    private void setupSurfaceHolder() {
        setViewVisibility(R.id.startBtn, View.VISIBLE);
        setViewVisibility(R.id.surfaceView, View.VISIBLE);

        surfaceHolder = surfaceView.getHolder();
        surfaceHolder.addCallback(this);
        setBtnClick();
    }

    private void setBtnClick() {
        Button startBtn = findViewById(R.id.startBtn);
        if (startBtn != null) {
            startBtn.setOnClickListener(view -> stopScreenShare());
        }
    }

    private void stopScreenShare() {
        Intent ScreenOnIntent = BroadcastIntentHelper.buildToggleScreenShareIntent(false);
        LocalBroadcastManager.getInstance(this).sendBroadcast(ScreenOnIntent);
        finish();
    }


    @Override
    public void surfaceCreated(SurfaceHolder surfaceHolder) {
        try {
            if (camera != null) {
                camera.stopPreview();
            }
            startCamera();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void startCamera() {
        camera = Camera.open();
        camera.setDisplayOrientation(90);
        try {
            camera.setPreviewDisplay(surfaceHolder);
            camera.startPreview();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    @Override
    public void surfaceChanged(SurfaceHolder surfaceHolder, int i, int i1, int i2) {
        resetCamera();
    }

    public void resetCamera() {
        if (surfaceHolder.getSurface() == null) {
            // Return if preview surface does not exist
            return;
        }

        if (camera != null) {
            // Stop if preview surface is already running.
            camera.stopPreview();
            try {
                // Set preview display
                camera.setPreviewDisplay(surfaceHolder);
            } catch (IOException e) {
                e.printStackTrace();
            }
            // Start the camera preview...
            camera.startPreview();
        }
    }


    @Override
    public void surfaceDestroyed(SurfaceHolder surfaceHolder) {
        releaseCamera();
    }

    private void releaseCamera() {
        if (camera != null) {
            camera.stopPreview();
            camera.release();
            camera = null;
        }
    }

    @Override
    public void onPictureTaken(byte[] bytes, Camera camera) {
        saveImage(bytes);
        resetCamera();
    }

    private void saveImage(byte[] bytes) {
        FileOutputStream outStream;
        try {
            String fileName = "TUTORIALWING_" + System.currentTimeMillis() + ".jpg";
            File file = new File(Environment.getExternalStorageDirectory(), fileName);
            outStream = new FileOutputStream(file);
            outStream.write(bytes);
            outStream.close();
            Toast.makeText(CameraPreviewActivity.this, "Picture Saved: " + fileName, Toast.LENGTH_LONG).show();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }


    private void changeLayoutSize(int newWidth, int newHeight) {

        DisplayMetrics displayMetrics = new DisplayMetrics();
        WindowManager wm = (WindowManager) getSystemService(Context.WINDOW_SERVICE); // the results will be higher than using the activity context object or the getWindowManager() shortcut
        wm.getDefaultDisplay().getMetrics(displayMetrics);

        int screenWidth = displayMetrics.widthPixels;
        int screenHeight = displayMetrics.heightPixels;

        float aspect_ratio = (float) newHeight / (float) newWidth;
        int newHeight1 = (int) (aspect_ratio * screenWidth);

        if (newHeight1 < screenHeight) {
            newHeight1 = screenHeight;
        }

        FrameLayout.LayoutParams layoutParams = new FrameLayout.LayoutParams(newWidth, newHeight1);
        layoutParams.gravity = Gravity.CENTER;
        frameLayoutCamera.setLayoutParams(layoutParams);
        RemoteUtils.newNormalHeight = newHeight1;
        initNormalDrawing();
    }

}