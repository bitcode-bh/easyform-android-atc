package com.easyform.newjitsi.activitys.drawing;


import static android.Manifest.permission.CAMERA;
import static android.Manifest.permission.RECORD_AUDIO;
import static android.Manifest.permission.WRITE_EXTERNAL_STORAGE;
import static com.easyform.newjitsi.App.context;
import static com.easyform.newjitsi.App.getContext;
import static com.easyform.newjitsi.activitys.drawing.NormalDrawingUtils.showTouches;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.ActivityManager;
import android.app.AlertDialog;
import android.content.BroadcastReceiver;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Matrix;
import android.hardware.Camera;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.os.StrictMode;
import android.provider.MediaStore;
import android.util.DisplayMetrics;
import android.util.Log;
import android.util.Size;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.Surface;
import android.view.SurfaceHolder;
import android.view.SurfaceView;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.widget.ArrayAdapter;
import android.widget.FrameLayout;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.Switch;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import com.easyform.newjitsi.R;
import com.easyform.newjitsi.activitys.chat.WebApiCallJitsiMeet;
import com.easyform.newjitsi.activitys.drawing.AR.ARDrawActivity;
import com.easyform.newjitsi.activitys.drawing.AR.EventUtils;
import com.easyform.newjitsi.activitys.drawing.AR.TouchEventAR;
import com.easyform.newjitsi.activitys.drawing.models.RemoteUtils;
import com.easyform.newjitsi.activitys.jitsimeet.CustomJitsiMeetActivity;
import com.easyform.newjitsi.activitys.jitsimeet.CustomJitsiMeetViewModel;
import com.easyform.newjitsi.activitys.jitsimeet.VideoRecordingService;
import com.easyform.newjitsi.broadcasts.FlashlightToggleReceiver;
import com.easyform.newjitsi.network.Models.OtherData;
import com.easyform.newjitsi.network.Models.UserData;

import com.easyform.newjitsi.utils.Utils;
import com.google.ar.sceneform.HitTestResult;
import com.google.ar.sceneform.Scene;
import com.google.gson.Gson;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.List;

public class CameraPreviewActivity extends AppCompatActivity implements SurfaceHolder.Callback, Camera.PictureCallback, Scene.OnPeekTouchListener {

    public static final String TAG = CameraPreviewActivity.class.getSimpleName();
    public static SurfaceHolder surfaceHolder;
    public static Camera camera;

    public static final int REQUEST_CODE = 100;

    public static SurfaceView surfaceView;

    private String[] neededPermissions ;

    private PaintViewNormal paintViewNormal;

    private FrameLayout frameLayoutCamera;
    public static boolean isSupportedDevice = true;
    private Camera.Size mPreviewSize;
    Intent intent;
   static Bundle extras;
    CustomJitsiMeetViewModel mCustomJitsiMeetViewModel;
    Switch mASwitch;
    private static boolean isFlashlightOn = false;

    ImageButton mImageViewScreenShot;
    int sourceWidth;
    int sourceHeight;
    private Bitmap bmp1;

   public static ImageButton mImageViewVideoStart;
    public static ImageButton mImageViewVideoStop;
    public static ImageButton mFlashOn;
    public static ImageButton mFlashOff;
   public static TextView mTextViewTimer;
   public  static ImageView mScreenshotThumbnail;
   public static ImageButton FrontCamera;
   public static  ImageButton BackCamera;
   public static int currentCameraId;
   public static CameraPreviewActivity  cameraPreviewActivity;
   String cameratype;
   public static ImageButton ZoomIn;
   public static  ImageButton ZoomOut;
   public static  ImageButton zoom_clear;
   public static ImageView mImageViewLoading;

    private static final Gson mGson = new Gson();
    public static OtherData mOtherData;
    public static  UserData  mUserData;
    static String otherDataString;
    static String loginUserDataString;
    static String pluginArgsString;
    static String notificationRemoteDataString;
    private static final String METHOD_NAME_GetCheekshet = "WCF_GetCustomerWithGlobalVar_With_Role_Port";
    private static final String METHOD_NAME_GetCheckSheetData = "WCF_GetCheckSheetData_Port";
    public static Activity mActivity;

    private final BroadcastReceiver broadcastScreenShearReceiver = new BroadcastReceiver() {
        public void onReceive(Context context, Intent intent) {
            CameraPreviewActivity.this.finish();
        }
    };

    private void registerForBroadcastMessages() {
        IntentFilter intentScreenShearFilter = new IntentFilter();
        intentScreenShearFilter.addAction(Utils.BroadcastAction.JITSI_SCREEN_SHEAR_ACTION_DRAW);
        LocalBroadcastManager.getInstance(this).registerReceiver(this.broadcastScreenShearReceiver, intentScreenShearFilter);
    }

    @Override
    protected void onDestroy() {
        LocalBroadcastManager.getInstance(this).unregisterReceiver(broadcastScreenShearReceiver);
        super.onDestroy();
        if (camera != null) {
            camera.stopPreview();
            camera.release();
            camera = null;
        }
    }

    @SuppressLint("MissingInflatedId")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        this.getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,WindowManager.LayoutParams.FLAG_FULLSCREEN);
        setContentView(R.layout.normalcamerapreview);
        StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
        StrictMode.setThreadPolicy(policy);
        registerForBroadcastMessages();
        cameraPreviewActivity = this;
        isSupportedDevice = false;
        mActivity = CameraPreviewActivity.this;
//        isSend = true;

        hideSystemUI();
        surfaceView = findViewById(R.id.surfaceView);
        frameLayoutCamera = findViewById(R.id.frame_cameraview);
        paintViewNormal = findViewById(R.id.paintviewNormal);
        if (surfaceView != null) {
            boolean result = checkPermission();
            if (result) {
                setupSurfaceHolder();
            }
        }

        try {
            Intent intent = getIntent();
            sourceWidth = Integer.parseInt((intent.getStringExtra("width")));
            sourceHeight = Integer.parseInt((intent.getStringExtra("height")));
            extras = intent.getBundleExtra("Bundle_extras");
            changeLayoutSize(sourceWidth, sourceHeight);

            otherDataString  = extras.getString(Utils.BroadcastActionExtrasKeys.OTHER_DATA, "");
            loginUserDataString  = extras.getString(Utils.BroadcastActionExtrasKeys.LOGIN_USER_DATA, "");
            pluginArgsString = extras.getString(Utils.BroadcastActionExtrasKeys.JITSI_MEETING_PLUGIN_ARGS, "");
            notificationRemoteDataString = extras.getString(Utils.BroadcastActionExtrasKeys.NOTIFICATION_REMOTE_DATA, "");
            mOtherData = mGson.fromJson(otherDataString, OtherData.class);
            mUserData = mGson.fromJson(loginUserDataString, UserData.class);

        } catch (Exception e) {
            e.printStackTrace();
        }
//        initNormalDrawing();

        mFlashOn = findViewById(R.id.flashon);
        mFlashOff = findViewById(R.id.flashoff);
        mImageViewScreenShot = findViewById(R.id.Screenshot);
        mImageViewVideoStart = findViewById(R.id.videostar);
        mImageViewVideoStop = findViewById(R.id.videostop);
        mTextViewTimer = findViewById(R.id.videotimer);
        mScreenshotThumbnail = findViewById(R.id.screenshotimag);
        FrontCamera = findViewById(R.id.frontcamera);
        BackCamera = findViewById(R.id.backcamera);
        ZoomIn = findViewById(R.id.zoomin);
        ZoomOut = findViewById(R.id.zoomout);
        zoom_clear = findViewById(R.id.zoom_clear);
        mImageViewLoading = findViewById(R.id.screenshotloading);
        inti();
    }

    public void inti()
    {

        final Handler handler = new Handler();
        handler.postDelayed(() -> {

            mImageViewVideoStart.setVisibility(View.GONE);
            mImageViewScreenShot.setVisibility(View.GONE);
            mFlashOn.setVisibility(View.GONE);
            FrontCamera.setVisibility(View.GONE);
            ZoomIn.setVisibility(View.GONE);
            ZoomOut.setVisibility(View.GONE);
            zoom_clear.setVisibility(View.GONE);


        }, 10000);


        mImageViewScreenShot.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                boolean check = isMyServiceRunning(CameraPreviewActivity.this,
                        VideoRecordingService.class.getName());
                if(check)
                {
                    Intent toggleFlashlightIntent = new Intent(getApplicationContext(), FlashlightToggleReceiver.class);
                    toggleFlashlightIntent.setAction("com.easyform.newjitsi.screenshot");
                    toggleFlashlightIntent.putExtra("isFlashlightOn", "[\"screenshot\"]");
                    toggleFlashlightIntent.putExtra("task_id",mOtherData.getServer_task_id());
                    sendBroadcast(toggleFlashlightIntent);
                }
                else {

                    if(mOtherData.getServer_task_id().equalsIgnoreCase("") || mOtherData.getServer_task_id().equalsIgnoreCase("0"))
                    {
                        String JsonData = "";
                        takescreenshot(JsonData);
                    }
                    else {
                        show_CheecksheetList();
                    }
                }

            }
        });

        mFlashOn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                boolean check = isMyServiceRunning(CameraPreviewActivity.this,
                        VideoRecordingService.class.getName());

                if (check) {

                    isFlashlightOn = true;
                    Intent toggleFlashlightIntent = new Intent(getApplicationContext(), FlashlightToggleReceiver.class);
                    toggleFlashlightIntent.setAction("com.easyform.newjitsi.Flash_light");
                    toggleFlashlightIntent.putExtra("isFlashlightOn", "[\"on\"]");
                    sendBroadcast(toggleFlashlightIntent);
                    mFlashOff.setVisibility(View.GONE);
                    mFlashOn.setVisibility(View.GONE);
//                    }
                } else {

                    turnFlashlightOn();

                }
            }
        });

        mFlashOff.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                boolean check = isMyServiceRunning(CameraPreviewActivity.this,
                        VideoRecordingService.class.getName());

                if(check)
                {
                    isFlashlightOn = false;
                    Intent toggleFlashlightIntent = new Intent(getApplicationContext(), FlashlightToggleReceiver.class);
                    toggleFlashlightIntent.setAction("com.easyform.newjitsi.Flash_light");
                    toggleFlashlightIntent.putExtra("isFlashlightOn", "[\"off\"]");
                    sendBroadcast(toggleFlashlightIntent);
                    mFlashOff.setVisibility(View.GONE);
                    mFlashOn.setVisibility(View.GONE);
                }
                else {
                    turnFlashlightOff();

                }
            }
        });

        mImageViewVideoStart.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {

                boolean check = isMyServiceRunning(CameraPreviewActivity.this,
                        VideoRecordingService.class.getName());
                if (!check) {

                    Intent mIntent = new Intent(CameraPreviewActivity.this, VideoRecordingService.class);
                    mIntent.putExtra("Bundle_extras",extras);
                    startService(mIntent);
                    mImageViewVideoStop.setVisibility(View.VISIBLE);
                    mImageViewVideoStart.setVisibility(View.GONE);

                }


            }
        });

        mImageViewVideoStop.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {

                boolean check = isMyServiceRunning(CameraPreviewActivity.this,
                        VideoRecordingService.class.getName());
                if (check) {
                    Intent mIntent = new Intent(CameraPreviewActivity.this, VideoRecordingService.class);
                    stopService(mIntent);
                    mImageViewVideoStop.setVisibility(View.GONE);
                    mImageViewVideoStart.setVisibility(View.VISIBLE);
                }

            }
        });




        BackCamera.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                boolean check = isMyServiceRunning(CameraPreviewActivity.this,
                        VideoRecordingService.class.getName());


                if(check)
                {
                    Intent toggleFlashlightIntent = new Intent(getApplicationContext(), FlashlightToggleReceiver.class);
                    toggleFlashlightIntent.setAction("com.easyform.newjitsi.camera");
                    toggleFlashlightIntent.putExtra("Cameratype", "[\"back\"]");
                    sendBroadcast(toggleFlashlightIntent);
                }
                else {
                    cameratype = "[\"back\"]";
                    backfroncamera(cameratype);
                }

            }
        });

        FrontCamera.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                boolean check = isMyServiceRunning(CameraPreviewActivity.this,
                        VideoRecordingService.class.getName());


                if(check)
                {
                    Intent toggleFlashlightIntent = new Intent(getApplicationContext(), FlashlightToggleReceiver.class);
                    toggleFlashlightIntent.setAction("com.easyform.newjitsi.camera");
                    toggleFlashlightIntent.putExtra("Cameratype", "[\"front\"]");
                    sendBroadcast(toggleFlashlightIntent);
                }
                else {
                    cameratype = "[\"front\"]";
                    backfroncamera(cameratype);
                }

            }
        });

        ZoomIn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                boolean check = isMyServiceRunning(CameraPreviewActivity.this,
                        VideoRecordingService.class.getName());


                if(check)
                {
                    Intent intent = new Intent(getApplicationContext(), FlashlightToggleReceiver.class);
                    intent.setAction("com.easyform.newjitsi.ZoomControlIn");
                    intent.putExtra("zoom_in", "[\"zoom_in\"]");
                    sendBroadcast(intent);
                }
                else {
                    zoomIn();
                }

            }
        });

        ZoomOut.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {

                boolean check = isMyServiceRunning(CameraPreviewActivity.this,
                        VideoRecordingService.class.getName());


                if(check)
                {
                    Intent intent = new Intent(getApplicationContext(), FlashlightToggleReceiver.class);
                    intent.setAction("com.easyform.newjitsi.ZoomControlOut");
                    intent.putExtra("zoom_out", "[\"zoom_out\"]");
                    sendBroadcast(intent);
                }
                else {
                    zoomOut();
                }

            }
        });

        zoom_clear.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {

                boolean check = isMyServiceRunning(CameraPreviewActivity.this,
                        VideoRecordingService.class.getName());


                if(check)
                {
                    Intent intent = new Intent(getApplicationContext(), FlashlightToggleReceiver.class);
                    intent.setAction("com.easyform.newjitsi.ZoomControlClear");
                    intent.putExtra("zoom_original", "[\"zoom_original\"]");
                    sendBroadcast(intent);
                }
                else {
                    zoom_clear();
                }
            }
        });
    }
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

//      applyAspectRatio(paintView);
        DisplayMetrics metrics = new DisplayMetrics();
        getWindowManager().getDefaultDisplay().getMetrics(metrics);
        Size size = new Size(sourceWidth, sourceHeight);
//      Size size = new Size(1080, 2340);
        if (size.getHeight() == 0) {
            size = new Size(metrics.widthPixels, metrics.heightPixels);
        }
        paintViewNormal.init(size);
        paintViewNormal.normal();
    }

    @SuppressLint("MissingSuperCall")
    @Override
    public void onBackPressed() {
        stopScreenShear();
        this.finish();
    }

    private boolean checkPermission() {
        int currentAPIVersion = Build.VERSION.SDK_INT;
        if (currentAPIVersion >= Build.VERSION_CODES.M) {
            ArrayList<String> permissionsNotGranted = new ArrayList<>();

//            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU)
//            {
//                neededPermissions =  new String[]{CAMERA, Manifest.permission.READ_MEDIA_VIDEO,Manifest.permission.READ_MEDIA_IMAGES , Manifest.permission.RECORD_AUDIO};
//            }
//            else {
//            }
            neededPermissions =  new String[]{CAMERA, WRITE_EXTERNAL_STORAGE , RECORD_AUDIO};
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
        alertBuilder.setPositiveButton(android.R.string.yes, new DialogInterface.OnClickListener() {
            public void onClick(DialogInterface dialog, int which) {
                requestPermissions(permissions);
            }
        });
        AlertDialog alert = alertBuilder.create();
        alert.show();
    }

    private void requestPermissions(String[] permissions) {
        ActivityCompat.requestPermissions(CameraPreviewActivity.this, permissions, REQUEST_CODE);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        switch (requestCode) {
            case REQUEST_CODE:
                for (int result : grantResults) {
                    if (result == PackageManager.PERMISSION_DENIED) {
                        Toast.makeText(CameraPreviewActivity.this, "Permission", Toast.LENGTH_LONG).show();
                        setViewVisibility(R.id.showPermissionMsg, View.VISIBLE);
                        return;
                    }
                }

                setupSurfaceHolder();
                break;
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
        ImageButton startBtn = findViewById(R.id.startBtn);
        if (startBtn != null) {
            startBtn.setOnClickListener(view -> {
                boolean check = isMyServiceRunning(CameraPreviewActivity.this,
                        VideoRecordingService.class.getName());

                if (check) {
                    stopService(new Intent(CameraPreviewActivity.this, VideoRecordingService.class));
                }
                // Ensure the screen stop logic properly resets the necessary states
              //  mCustomJitsiMeetViewModel = new CustomJitsiMeetViewModel();
             //   mCustomJitsiMeetViewModel.screenstop(extras);

                new Handler(Looper.getMainLooper()).postDelayed(() -> {
                    stopScreenShear();
                    onBackPressed();
                }, 1000);

            });
        }
    }

    void stopScreenShear() {
        Intent jitsiPluginBroadcast = new Intent();
        jitsiPluginBroadcast.setAction(Utils.BroadcastAction.JITSI_SCREEN_SHEAR_ACTION);
        jitsiPluginBroadcast.putExtra("SHARE_TOGGLE", false);
        LocalBroadcastManager.getInstance(getApplicationContext()).sendBroadcast(jitsiPluginBroadcast);
    }


    public void captureImage() {
        if (camera != null) {
            camera.takePicture(null, null, this);
        }
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
            //   startRecording();
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
        //  stopCamera();
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
        } catch (FileNotFoundException e) {
            e.printStackTrace();
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

//        calHeight = newHeight1;
//        ll.setGravity(Gravity.CENTER);
        FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(screenWidth, newHeight1);
        params.gravity = Gravity.CENTER;
        frameLayoutCamera.setLayoutParams(params);
        RemoteUtils.newNormalHeight = newHeight1;
        initNormalDrawing();
    }


    @Override
    public void onPeekTouch(HitTestResult hitTestResult, MotionEvent motionEvent) {
        showTouches(motionEvent.getX(), motionEvent.getY());
    }

    public static void OnOffFlashLight(String jsondata) {
        try {
            JSONArray jsonArray = new JSONArray(jsondata);
            String keyname = jsonArray.getString(0);

            if (keyname.equalsIgnoreCase("on")) {
                turnFlashlightOn();
            } else {
                turnFlashlightOff();
            }

        } catch (Exception e) {

        }

    }


    public static void turnFlashlightOn() {
        if (!isFlashlightOn) {
            camerastart();
            Camera.Parameters parameters = camera.getParameters();
            parameters.setFlashMode(Camera.Parameters.FLASH_MODE_TORCH);
            camera.setParameters(parameters);
            isFlashlightOn = true;
            mFlashOff.setVisibility(View.GONE);
            mFlashOn.setVisibility(View.GONE);
        }
    }

    public static void turnFlashlightOff() {
        if (isFlashlightOn) {
            Camera.Parameters parameters = camera.getParameters();
            parameters.setFlashMode(Camera.Parameters.FLASH_MODE_OFF);
            camera.setParameters(parameters);
            isFlashlightOn = false;
            mFlashOff.setVisibility(View.GONE);
            mFlashOn.setVisibility(View.GONE);
        }
    }

    private boolean isMyServiceRunning(Context context, String Myservice) {
        ActivityManager manager = (ActivityManager) context
                .getSystemService(Context.ACTIVITY_SERVICE);
        for (ActivityManager.RunningServiceInfo service : manager
                .getRunningServices(Integer.MAX_VALUE)) {
            if (Myservice.equals(service.service.getClassName())) {

                return true;
            }
        }
        return false;
    }

    public static void TakeScreenshot(Bitmap bitmap,String jsonData) {

        Matrix matrix = new Matrix();
        matrix.postRotate(90);
        bitmap = Bitmap.createBitmap(bitmap, 0, 0, bitmap.getWidth(), bitmap.getHeight(), matrix, true);

        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        bitmap.compress(Bitmap.CompressFormat.JPEG, 100, bos);
        byte[] bitmapdata = bos.toByteArray();
        ByteArrayInputStream fis = new ByteArrayInputStream(bitmapdata);

        //  String picId=String.valueOf(nu);
//        String myfile = "Screenshot_" + System.currentTimeMillis() + ".jpeg";
//
//        File dir_image = new File(Environment.getExternalStorageDirectory() + "/VideoScreenshots");
//        dir_image.mkdirs();

        String dir = Environment.getExternalStorageDirectory()
                + File.separator + "/VideoScreenshots";
        // create folder
        File folder = new File(dir); // folder name
        folder.mkdirs();
        // create file
        String fname = "IMG" + System.currentTimeMillis() + ".jpeg";
        File photoFile = new File(dir, fname);



//        File photoFile;
//        File myDir = new File(getContext().getExternalFilesDir(Environment.DIRECTORY_PICTURES), ".myDirectory");
//        if (!myDir.exists()) myDir.mkdirs();
//
//        String fname = "IMG" + System.currentTimeMillis() + ".jpeg";
//        photoFile = new File(myDir, fname);

        Bitmap thumbnail = createThumbnail(bitmap, 200);
        mImageViewLoading.setVisibility(View.GONE);
        mScreenshotThumbnail.setVisibility(View.VISIBLE);
        mScreenshotThumbnail.setImageBitmap(thumbnail);


        try {
//            File tmpFile = new File(myDir, photoFile);
//            FileOutputStream fos = new FileOutputStream(photoFile);
//
//            byte[] buf = new byte[1024];
//            int len;
//            while ((len = fis.read(buf)) > 0) {
//                fos.write(buf, 0, len);
//            }
//            fis.close();
//            fos.close();
//
//            MediaScannerConnection.scanFile(
//                    context,
//                    new String[]{photoFile.getAbsolutePath()},
//                    new String[]{"image/jpeg"},
//                    null
//            );

             FileOutputStream fos = new FileOutputStream(photoFile);
             bitmap.compress(Bitmap.CompressFormat.JPEG, 100, fos);
             fos.flush();


            camera.startPreview();
            Handler mainHandler = new Handler();
            mainHandler.postDelayed(() -> {

                mScreenshotThumbnail.setVisibility(View.GONE);
            }, 2000);//RESETING THE PREVIEW
            new Handler(Looper.getMainLooper()).post(new Runnable() {
                public void run() {
                    CameraPreviewActivity.showToast( "Screenshot saved");
                }
            });

            if(!jsonData.equalsIgnoreCase("")) {

                Intent intent = new Intent("com.easyfrom.jitsi.SCREENSHOT_SAVED");
                intent.putExtra("screenshot_path", photoFile.getAbsolutePath());
                intent.putExtra("photo_name", fname);
                intent.putExtra("jsonData", jsonData);
                intent.putExtra("task_id", mOtherData.getServer_task_id());
                intent.putExtra("LOGIN_USER_DATA",loginUserDataString);
                intent.putExtra("OTHER_DATA",otherDataString);
                intent.putExtra("JITSI_MEETING_PLUGIN_ARGS",pluginArgsString);
                intent.putExtra("NOTIFICATION_REMOTE_DATA",notificationRemoteDataString);
                getContext().sendBroadcast(intent);
            }
        } catch (FileNotFoundException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }


    public static void takescreenshot(String JsonData)  {
        try{
            mImageViewLoading.setVisibility(View.VISIBLE);

            camera.takePicture(null, null, new Camera.PictureCallback() {
                @Override
                public void onPictureTaken(byte[] data, Camera camera) {
                    // Convert the byte array to a bitmap
                    Bitmap bitmap = BitmapFactory.decodeByteArray(data, 0, data.length);
                    TakeScreenshot(bitmap,JsonData);
                }
            });
        }
        catch (Exception e)
        {
             camerastart();
            camera.takePicture(null, null, new Camera.PictureCallback() {
                @Override
                public void onPictureTaken(byte[] data, Camera camera) {
                    // Convert the byte array to a bitmap
                    Bitmap bitmap = BitmapFactory.decodeByteArray(data, 0, data.length);
                    TakeScreenshot(bitmap,JsonData);
                }
            });
        }

    }


    public static Bitmap createThumbnail(Bitmap bitmap, int thumbnailSize) {
        float scale = (float) thumbnailSize / Math.max(bitmap.getWidth(), bitmap.getHeight());
        int width = Math.round(bitmap.getWidth() * scale);
        int height = Math.round(bitmap.getHeight() * scale);
        return Bitmap.createScaledBitmap(bitmap, width, height, false);
    }

    public static void showToast(String msg)
    {
        Toast.makeText(context.getApplicationContext(), msg, Toast.LENGTH_LONG).show();
    }



    @Override
    public boolean onTouchEvent(MotionEvent event) {

        boolean check = isMyServiceRunning(CameraPreviewActivity.this,
                VideoRecordingService.class.getName());
        if (check) {

        }
         else {
             camerastart();
            Log.d("##PREVIEW_ONTOUCH", String.valueOf(event.getAction()));

            // Get the pointer ID
             Camera.Parameters params = null;
            try {
                params = camera.getParameters();
            } catch (Exception e) {
                // Some devices throw internally
                params = null;
            }

            int action = event.getAction();

            try {
                if (event.getPointerCount() > 1) {
                    // handle multi-touch events
                    if (action == MotionEvent.ACTION_POINTER_DOWN) {
                        //  mDist = getFingerSpacing(event);
                    } else if (action == MotionEvent.ACTION_MOVE && params.isZoomSupported()) {
                        camera.cancelAutoFocus();
                        //  handleZoom(event, params);
                    }
                } else {
                    // handle single touch events
                    if (action == MotionEvent.ACTION_UP) {
                        try {
                            final Handler handler = new Handler();
                            Camera.Parameters finalParams = params;
                            handler.postDelayed(new Runnable() {
                                @Override
                                public void run() {
                                    try {
                                        handleFocus(event, finalParams);
                                    } catch (Exception e) {
                                        e.printStackTrace();
                                    }
                                }
                            }, 1000);
                        } catch (Exception e) {
                        }
                    }
                }
            } catch (Exception e) {

            }
        }
        return true;
    }

    public void handleFocus(MotionEvent event, Camera.Parameters params) {
        try {
            int pointerId = event.getPointerId(0);
            int pointerIndex = event.findPointerIndex(pointerId);
            // Get the pointer's current position
            float x = event.getX(pointerIndex);
            float y = event.getY(pointerIndex);

            List<String> supportedFocusModes = params.getSupportedFocusModes();
            if (supportedFocusModes != null && supportedFocusModes.contains(Camera.Parameters.FOCUS_MODE_AUTO)) {
                camera.autoFocus(new Camera.AutoFocusCallback() {
                    @Override
                    public void onAutoFocus(boolean b, Camera camera) {
                        // currently set to auto-focus on single touch
                    }
                });
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }


    public static void setCameraDisplayOrientation(Activity mActivity ,int cameraid, Camera camera)
    {
        // Set the camera rotation
        Camera.CameraInfo cameraInfo = new Camera.CameraInfo();
        Camera.getCameraInfo(cameraid, cameraInfo);
        int rotation = mActivity.getWindowManager().getDefaultDisplay()
                .getRotation();
        int degrees = 0;
        switch (rotation) {
            case Surface.ROTATION_0:
                degrees = 0;
                break;
            case Surface.ROTATION_90:
                degrees = 90;
                break;
            case Surface.ROTATION_180:
                degrees = 180;
                break;
            case Surface.ROTATION_270:
                degrees = 270;
                break;
        }
        int result;
        if (cameraInfo.facing == Camera.CameraInfo.CAMERA_FACING_FRONT) {
            result = (cameraInfo.orientation + degrees) % 360;
            result = (360 - result) % 360;  // compensate the mirror
        } else {  // back-facing
            result = (cameraInfo.orientation - degrees + 360) % 360;
        }
        camera.setDisplayOrientation(result);

    }


    public static void backfroncamera(String cameratype)
    {
        camera.stopPreview();
        camera.release();

        try {
            JSONArray jsonArray = new JSONArray(cameratype);
            String keyname = jsonArray.getString(0);

            if (keyname.equalsIgnoreCase("front")) {
                currentCameraId = Camera.CameraInfo.CAMERA_FACING_FRONT;
                FrontCamera.setVisibility(View.GONE);
                 BackCamera.setVisibility(View.GONE);
            } else {
                currentCameraId = Camera.CameraInfo.CAMERA_FACING_BACK;
                FrontCamera.setVisibility(View.GONE);
                BackCamera.setVisibility(View.GONE);
            }

        } catch (Exception e) {

        }

        try{

            camera = Camera.open(currentCameraId);
        }
        catch (Exception e)
        {
            camerastart();
            camera.stopPreview();
            camera.release();
            camera = Camera.open(currentCameraId);
        }
        try {
            setCameraDisplayOrientation(cameraPreviewActivity, currentCameraId, camera);
            camera.setPreviewDisplay(surfaceHolder);
        } catch (IOException e) {
            e.printStackTrace();
        }
        camera.startPreview();
    }

    public static void zoomIn() {

        try{
            Camera.Parameters parameters = camera.getParameters();
            if (parameters.isZoomSupported()) {
                int maxZoom = parameters.getMaxZoom();
                int currentZoom = parameters.getZoom();
                if (currentZoom < maxZoom) {
                    parameters.setZoom(currentZoom + 5);
                    camera.setParameters(parameters);
                }
            }
        }
        catch (Exception e)
        {
            camerastart();
        }

    }

    public static void zoomOut() {

       try{
           Camera.Parameters parameters = camera.getParameters();
           if (parameters.isZoomSupported()) {
               int currentZoom = parameters.getZoom();
               if (currentZoom > 0) {
                   parameters.setZoom(currentZoom - 5);
                   camera.setParameters(parameters);
               }
           }
       }
       catch (Exception e)
       {
            camerastart();
       }

    }

    public static void zoom_clear() {
        try{
            camerastart();
        }
        catch (Exception e)
        {
        }

    }

    public static void camerastart()
    {
//        if (camera != null) {
//            camera.release();
//            camera = null;
//        }
        if (camera != null) {
            camera = Camera.open();
            camera.setDisplayOrientation(90);
            try {
                camera.setPreviewDisplay(surfaceHolder);
                new Handler(Looper.getMainLooper()).postDelayed(() -> {
                    try {
                        camera.startPreview();
                    } catch (Exception ignored) {}
                }, 200);
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }

    public void finishActivity()
    {
        finish();
    }

    List<ChecklistItem> Checksheetnamelist;
    public void show_CheecksheetList()

    {
        try{

            JSONObject mJsonObject = new JSONObject();
            mJsonObject.put("Company_Id",mUserData.getCompanyId());
            mJsonObject.put("User_Id",mOtherData.getUser_id());
            mJsonObject.put("moduleid",mOtherData.getFlow_id());
            mJsonObject.put("siteid",mOtherData.getSite_id());
            mJsonObject.put("server_task_id",mOtherData.getServer_task_id());
            mJsonObject.put("role_id",mOtherData.getRole_id());

            String responsetxt =  WebApiCallJitsiMeet.ExecuteNetworkRequest(mJsonObject,mOtherData.getCommon_Wcf_Url(),METHOD_NAME_GetCheekshet,mUserData);

            if(responsetxt != null)
            {
                String status = null;
                String message = null;
                JSONArray jsonArray1 = new JSONArray(responsetxt);
                Checksheetnamelist = new ArrayList<>();
                for (int k = 0; k < jsonArray1.length(); k++) {
                    JSONObject jsonObject = jsonArray1.getJSONObject(0);
                    status = jsonObject.getString("status");
                    message = jsonObject.getString("message");

                    if(status.equalsIgnoreCase("1"))
                    {
                        String DataArray = jsonObject.getString("data");

                        if(DataArray == null || DataArray.equalsIgnoreCase(""))
                        {
                            Toast.makeText(CameraPreviewActivity.this, "Flow not found!", Toast.LENGTH_SHORT).show();

                        }
                        else {
                            JSONArray mJsonArray = new JSONArray(DataArray);
                            int found = 0;
                            String start_status = "";
                            for (int i = 0; i < mJsonArray.length(); i++) {
                                JSONObject mjsonObject = mJsonArray.getJSONObject(i);

                                JSONArray dataArray = mjsonObject.getJSONArray("data");

                                for (int j = 0; j < dataArray.length(); j++) {
                                    JSONObject dataItem = dataArray.getJSONObject(j);

                                    String checksheetId = dataItem.getString("checksheetid");
                                    String cName = dataItem.getString("c_name");

                                    if(checksheetId.equalsIgnoreCase("0"))
                                    {

                                    }
                                    else {

                                         start_status =  dataItem.getString("start_status");
                                        if(mOtherData.getStart_status().equalsIgnoreCase(start_status)) {
                                            found++;
                                            Checksheetnamelist.add(new ChecklistItem(cName, checksheetId, 0));
                                        }
                                    }
                                }
                                if(found == 0)
                                {
                                    showerrormsg("Checksheet mapping not found start status is " + start_status);

                                }

                            }
                            if (!Checksheetnamelist.isEmpty()) {
                                showChecklistDialog(Checksheetnamelist);
                            } else {
                                Log.d("MainActivity", "No valid checklist items found.");
                            }
                        }
                    }

                    if (status.equalsIgnoreCase("3") || status.equalsIgnoreCase("5")){

                        Handler leftHandler = new Handler(Looper.getMainLooper());
                        String finalMessage = message;
                        leftHandler.post(new Runnable() {
                            @Override
                            public void run() {
                                Toast.makeText(context, "APi : " + METHOD_NAME_GetCheekshet + "\n" + finalMessage, Toast.LENGTH_SHORT).show();
                            }
                        });
                    }
                }
            }

        }
        catch (Exception e)
        {

        }
    }


    private void showChecklistDialog(List<ChecklistItem> checklistItems) {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("Select Checklist");
        builder.setCancelable(false);
        // Convert list to array
        ChecklistItem[] itemsArray = checklistItems.toArray(new ChecklistItem[0]);

        builder.setAdapter(new ArrayAdapter<>(this, android.R.layout.simple_list_item_1, itemsArray),
                (dialog, which) -> {
                    ChecklistItem selectedItem = itemsArray[which];
                    String selectedChecksheetId = selectedItem.checksheetId;
                    String selectedChecksheetName = selectedItem.name;

                    Log.d("Dialog", "Selected: " + selectedChecksheetName + ", ID: " + selectedChecksheetId);


                    WCF_GetCheckSheetData_Port(selectedChecksheetId);
                });

        builder.setPositiveButton("Close", null);
        builder.show();
    }


    private void showerrormsg(String Msg) {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("Select Checklist");
        builder.setCancelable(false);
        builder.setMessage(Msg);

        builder.setPositiveButton("Close", null);
        builder.show();
    }

    List<ChecklistItem> mChecklistItems;
    public void WCF_GetCheckSheetData_Port(String selectedChecksheetId)
    {

        try{
            JSONObject mJsonObject = new JSONObject();
            mJsonObject.put("Company_Id",mUserData.getCompanyId());
            mJsonObject.put("User_Id",mUserData.getUserid());
            mJsonObject.put("checksheetid",selectedChecksheetId);
            mJsonObject.put("step",1);
            mJsonObject.put("trip_id",0);

            String responsetxt =  WebApiCallJitsiMeet.ExecuteNetworkRequest(mJsonObject,mOtherData.getCommon_Wcf_Url(),METHOD_NAME_GetCheckSheetData,mUserData);

            if(responsetxt != null)
            {
                String status = null;
                String message = null;
                String MainDataArray = null;
                JSONArray jsonArray1 = new JSONArray(responsetxt);
                for (int k = 0; k < jsonArray1.length(); k++) {
                    JSONObject jsonObject = jsonArray1.getJSONObject(0);
                    status = jsonObject.getString("status");
                    message = jsonObject.getString("message");
                    mChecklistItems = new ArrayList<>();
                    if(status.equalsIgnoreCase("1"))
                    {
                        MainDataArray = jsonObject.getString("data");

                        if(MainDataArray != null)
                        {
                            JSONArray mJsonArray = new JSONArray(MainDataArray);

                            for (int i = 0; i < mJsonArray.length(); i++) {
                                JSONObject mjsonObject = mJsonArray.getJSONObject(i);
                                String Subdataarray = mjsonObject.getString("data");
                                JSONArray dataArray = new JSONArray(Subdataarray);

                                for (int j = 0; j < dataArray.length(); j++) {
                                    JSONObject dataItem = dataArray.getJSONObject(j);

                                    int Type = dataItem.getInt("type");

                                    if(Type == 7)
                                    {
                                        int que_id = dataItem.getInt("que_id");
                                        JSONArray propArray = dataItem.getJSONArray("prop");

                                        for (int p = 0; p < propArray.length(); p++) {
                                            JSONObject propObject = propArray.getJSONObject(p);

                                            String name = propObject.optString("name", "");
                                            if (!name.isEmpty()) {

                                                mChecklistItems.add(new ChecklistItem(name, selectedChecksheetId,que_id));
                                            }
                                        }
                                    }
                                }

                            }

                            if (!mChecklistItems.isEmpty()) {
                                showType7Dialog(mChecklistItems);
                            } else {
                                Log.d("MainActivity", "No valid checklist items found.");
                            }
                        }
                    }

                    if (status.equalsIgnoreCase("3") || status.equalsIgnoreCase("5")){

                        Handler leftHandler = new Handler(Looper.getMainLooper());
                        String finalMessage = message;
                        leftHandler.post(new Runnable() {
                            @Override
                            public void run() {
                                Toast.makeText(context, "APi : " + METHOD_NAME_GetCheekshet + "\n" + finalMessage, Toast.LENGTH_SHORT).show();
                            }
                        });
                    }
                }
            }

        }
        catch (Exception e)
        {

        }

    }

    private int selectedIndex = -1; // -1 = nothing selected yet

    private void showType7Dialog(List<ChecklistItem> checklistItems) {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("Select photo");
        builder.setCancelable(false);

        ChecklistAdapter adapter = new ChecklistAdapter(this, checklistItems);

        builder.setAdapter(adapter, (dialog, which) -> {
            ChecklistItem selectedItem = checklistItems.get(which);
            selectedIndex = which; // Update selected index

            // Create JSON to pass to screenshot
            try {
                JSONArray mJsonArray = new JSONArray();
                JSONObject mJsonObject = new JSONObject();
                mJsonObject.put("checksheet_id", selectedItem.checksheetId);
                mJsonObject.put("que_id", selectedItem.que_id);
                mJsonArray.put(mJsonObject);

                takescreenshot(mJsonArray.toString());
            } catch (Exception e) {
                e.printStackTrace();
            }
        });

        builder.setPositiveButton("Close", null);
        builder.show();
    }

    private class ChecklistAdapter extends ArrayAdapter<ChecklistItem> {

        public ChecklistAdapter(Context context, List<ChecklistItem> items) {
            super(context, android.R.layout.simple_list_item_1, items);
        }

        @NonNull
        @Override
        public View getView(int position, View convertView, @NonNull ViewGroup parent) {
            View view = super.getView(position, convertView, parent);
            TextView textView = (TextView) view.findViewById(android.R.id.text1);

            ChecklistItem item = getItem(position);
            if (item != null) {
                // Show ✔ sign if this item is selected
                if (position == selectedIndex) {
                    textView.setText("✔ " + item.name);
                } else {
                    textView.setText(item.name);
                }
            }

            return view;
        }
    }

}