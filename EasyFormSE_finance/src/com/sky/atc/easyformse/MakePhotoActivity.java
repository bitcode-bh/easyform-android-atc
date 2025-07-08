package com.sky.atc.easyformse;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.app.Dialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.Paint.Style;
import android.graphics.Point;
import android.graphics.Typeface;
import android.hardware.Camera;
import android.hardware.Camera.CameraInfo;
import android.hardware.Camera.ShutterCallback;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.icu.text.IDNA;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.util.DisplayMetrics;
import android.util.Log;
import android.util.Size;
import android.view.Display;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewTreeObserver;
import android.view.Window;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.RequiresApi;
import androidx.constraintlayout.widget.ConstraintLayout;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.google.android.gms.common.api.GoogleApiClient;
import com.google.android.gms.location.LocationServices;
import com.sky.atc.easyformse.azurevision.AutofocusTouchListner;
import com.sky.atc.easyformse.azurevision.TextRecognizationUtils;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.photo.BurstPhotoActivity;
import com.sky.atc.easyformse.utils.LogUtils;

import net.sqlcipher.Cursor;
import net.sqlcipher.database.SQLiteDatabase;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;

import io.michaelrocks.paranoid.Obfuscate;

import static android.view.View.GONE;
import static android.view.View.VISIBLE;
import static com.sky.atc.easyformse.sqlitewraper.mainactivity;

//for camera preview and photo saving
@Obfuscate
public class MakePhotoActivity extends Activity implements SensorEventListener, LocationListener, View.OnTouchListener {


    private final static String DEBUG_TAG = "MakePhotoActivity";
    Float azimut = (float) 0.0; // View to draw a compass
    Float pich = (float) 0.0;
    Float roll = (float) 0.0;
    Double az = 0.0;
    Double pich1 = 0.0;
    Double roll1 = 0.0;
    float[] mGravity;
    float[] mGeomagnetic;
    Double mt = (double) 0;
    TextView txtsm;
    TextView txtmgnt;
    String temp_jason_array;
    int[] degree_id;
    int j = -1;
    MySharedPreferences pref;
    //    Editor editor;
    double deviceLat;
    double deviceLng;
    String width, height, quality, flagdraw;
    String b_write;
    int ret;
    TextView imgdate, imglat, imglng, imgusername;
    B_new b_count = new B_new();
    CustomDrawableView mCustomDrawableView;
    Sensor accelerometer;
    Sensor magnetometer;
    ShutterCallback shutterCallback = () -> {// Log.d(TAG, "onShutter'd");
    };
    LocationListener mlocListener;
    SQLiteDatabase database;
    MySharedPreferences sharedpreferences;
    private Camera camera;
    private Preview preview;

    private int cameraId = 0;
    private LocationManager locationManager;
    private ImageView ivCaptureFront;
    private ImageView flash;
    private int deg;
    private int flag = 0;
    private int flash_c = 0;
    private int camviewid = 1;
    private SensorManager mSensorManager;
    private GoogleApiClient googleApiClient;
    private ImageView switchcamera;
    Preview p;
    private ArrayList<File> listOfPhotoPath = new ArrayList<>();
    private TextView textAnimatorView;
    private int photoNumber = 3;
    //    private View viewRectangle;
    private View viewRectangleMask;
    private FrameLayout framelayout;
    float dX;
    float dY;
    int lastAction;
    public static Size deviceRealSize;
    public static AutofocusTouchListner autofocusTouchListner;

    private View topView;
    private View bottomView;
    private View leftView;
    private View rightView;
    private ConstraintLayout firstView;
    private ImageView cameraImagePreview;
    private View layCameraText;
    private View layCameraControl;

    private Button btnCancle;
    private Button btnCrop;
    private String imagePath;
    private ConstraintLayout mainFrameLay;
    private ProgressBar progressPhoto;
    private Button btnUp;
    private Button btnDown;
    private Button btnLeft;
    private Button btnRight;

    private int count = 10;
    private float downDY;
    private float downX;
    private float downY;
    private int rectHeight;
    private float downDX;
    private int rectWidth;
    private float viewRectangleMaskX;
    private float btnLeftY;
    public static TextRecognizationUtils textRecognizationUtils;
    String smText;
    String info = "";
    LinearLayout mLayoutTextview;
    String max_file_size;
    private static final int PERMISSION_REQUEST_CODE = 200;

    @RequiresApi(api = Build.VERSION_CODES.LOLLIPOP)
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.camera_preview);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        if (checkPermission()) {
            //main logic or main code
        } else {
            requestPermission();
        }
        deviceRealSize = getRealSizeOfDisplay();

        B_new.setCount_new(0);
        sharedpreferences = sqlitewraper.getSecureShared("Pre1");
        googleApiClient = sqlitewraper.getGoogleApiHelper().getGoogleApiClient();

        mlocListener = new MakePhotoActivity();
        locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);

        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            return;
        }
        locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 0, 10, this);

        pref = sqlitewraper.getSecureShared("MyPref");
//        editor = pref.edit();

        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        String dateTime = sdf.format(Calendar.getInstance().getTime());

        pref.putString("photo_path", ""); // Saving string
        pref.commit();
        String time1 = pref.getString("time", "k2");

        String time2 = pref.getString("time2", "k2");
        b_write = pref.getString("b_write", "k2");

        try {
            Bundle Extras = getIntent().getExtras();
            width = Extras.getString("width");
            height = Extras.getString("height");
            quality = Extras.getString("quality");
            info = Extras.getString("info");
            max_file_size = Extras.getString("max_file_size");
        } catch (Exception e) {
            LogUtils.photoLogFile(e.toString(), "MakePhotoActivity");
        }


        imgdate = findViewById(R.id.imgdate);
        imglat = findViewById(R.id.imglat);
        imglng = findViewById(R.id.imglng);
        imgusername = findViewById(R.id.imgusername);
        mLayoutTextview = findViewById(R.id.tvlinear);
        ivCaptureFront = findViewById(R.id.captureFront);
        switchcamera = findViewById(R.id.switchcamera);
        textAnimatorView = findViewById(R.id.text_animator);
//        viewRectangle = findViewById(R.id.viewRectangle);
        viewRectangleMask = findViewById(R.id.viewRectangleMask);
        cameraImagePreview = findViewById(R.id.fullscreen_imagepreview);
        layCameraText = findViewById(R.id.lay_cameratext);
        layCameraControl = findViewById(R.id.la_cameracontrol);
        btnCancle = findViewById(R.id.cancle_btn);
        btnCrop = findViewById(R.id.crop_btn);
        mainFrameLay = findViewById(R.id.main_contraint_lay);
        progressPhoto = findViewById(R.id.photoProgress);

        ivCaptureFront.setOnClickListener(this::onClick);
        btnUp = findViewById(R.id.btn_upside);
        btnUp.setOnTouchListener(this::onTouch);

        btnDown = findViewById(R.id.btn_down_side);
        btnDown.setOnTouchListener(this);


        btnLeft = findViewById(R.id.btn_left_side);
        btnLeft.setOnTouchListener(this);

        btnRight = findViewById(R.id.btn_right_side);
        btnRight.setOnTouchListener(this);

        if (camera_new.isburstMode.equalsIgnoreCase("true")) {
            textAnimatorView.setVisibility(VISIBLE);
        } else {
            textAnimatorView.setVisibility(View.GONE);
        }
        textAnimatorView.setText("" + photoNumber);

        framelayout = findViewById(R.id.preview);

//        if (camera_new.isCropMode) {
//            viewRectangle.setVisibility(VISIBLE);
//        } else {
//            viewRectangle.setVisibility(View.GONE);
//        }
//        viewRectangle.setOnTouchListener(this);
        viewRectangleMask.setOnTouchListener(this);
//        viewRectangle.setVisibility(View.GONE);

//      setCustomViewMask();


        topView = findViewById(R.id.topview);
        bottomView = findViewById(R.id.bottomview);
        leftView = findViewById(R.id.leftiew);
        rightView = findViewById(R.id.rightiew);
        firstView = findViewById(R.id.firstview);

        if (camera_new.isScanmode) {
            textRecognizationUtils = new TextRecognizationUtils();
            viewRectangleMask.setVisibility(VISIBLE);
            rightView.setVisibility(VISIBLE);
            leftView.setVisibility(VISIBLE);
        } else {
            rightView.setVisibility(GONE);
            leftView.setVisibility(GONE);
        }

        String lat_str;
        String long_str;
        String username;
        database = sqlitewraper.getDatabase();

        Cursor c3 = database.rawQuery(
                "SELECT username,u_c,appid FROM Login_Master", null);
        c3.moveToLast();
        username = c3.getString(0);
        c3.close();


        Cursor c = database
                .rawQuery(
                        "SELECT lat,lon,address, c_accuracy,date  FROM  track_master WHERE   _id = (SELECT MAX(_id) FROM track_master);",
                        null);
        c.moveToFirst();

        if (c.getCount() > 0) {

            String lat = pref.getString("lat", "k2");

            String lon = pref.getString("lon", "k2");

            String lat_n = c.getString(0);
            String lon_n = c.getString(1);
            if (lat_n == null) {

                lat_str = "Lat: " + lat;

                long_str = "Long: " + lon;

            } else {

                //
                lat_str = "Lat: " + lat_n;

                long_str = "Long: " + lon_n;
            }
        } else {

            getLastKnownLocation();

            String lat = pref.getString("lat", String.valueOf(deviceLat));

            String lon = pref.getString("lon", String.valueOf(deviceLng));

            if (lat.equals("0.0") && lon.equals("0.0")) {
                ivCaptureFront.setClickable(false);
                Toast.makeText(this, "LatLong not found", Toast.LENGTH_SHORT).show();
            } else {
                ivCaptureFront.setClickable(true);
            }

            Double lat_n = new BigDecimal(Double.valueOf(lat))
                    .setScale(5, BigDecimal.ROUND_HALF_UP)
                    .doubleValue();
            Double lon_n = new BigDecimal(Double.valueOf(lon))
                    .setScale(5, BigDecimal.ROUND_UP).doubleValue();

            lat_str = "Lat: " + lat_n.toString();

            long_str = "Long: " + lon_n.toString();

        }
//        if(lat_str.equals("0.0") && long_str.equals("0.0")){
//            b.setClickable(false);
//            Toast.makeText(this,"LatLong not found",Toast.LENGTH_SHORT).show();
//        }else {
//            b.setClickable(true);
//        }

        imgdate.setText(dateTime);
        imgusername.setText("Username: " + username);
        imglat.setText(lat_str);
        imglng.setText(long_str);
        if(info.equalsIgnoreCase("") || info.equalsIgnoreCase("null") )
        {
        }
        else {
            try {
                JSONArray mJsonArray = new JSONArray(info);
                String[] strArr = new String[mJsonArray.length()];
                for (int i = 0; i < mJsonArray.length(); i++) {
                    strArr[i] = mJsonArray.getString(i);

                    TextView textView1 = new TextView(this);
                    textView1.setLayoutParams(new ViewGroup.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT,
                            ViewGroup.LayoutParams.WRAP_CONTENT));
                    textView1.setText(strArr[i]);
                    textView1.setTextSize(14);
                    textView1.setPadding(0,-7,0,0);
                    textView1.setTextColor(Color.parseColor("#000000"));
                    textView1.setTypeface(textView1.getTypeface(), Typeface.BOLD);
                    mLayoutTextview.addView(textView1);
                }
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }

        txtsm = findViewById(R.id.txtsi);
        txtmgnt = findViewById(R.id.txtmgnt);

        mSensorManager = (SensorManager) getSystemService(Context.SENSOR_SERVICE);

        flash = findViewById(R.id.flash);


        p = new Preview(this);
        p.acti = this;
        p.cam_id = findrearFacingCamera();
        preview = p;
        B_new.setP(p);

        int myColor = Color.parseColor("#1AFF0000");

//        p.setBackgroundColor(getResources().getColor(R.color.red));
//        viewRectangle.setBackgroundColor(myColor);


        int k = B_new.getFlash();
        B_new.setCamviewid(0);
        int k1 = B_new.getCamviewid();

        if (k1 == 0) {
            switchcamera.setImageResource(R.drawable.frontcamera_foreground);
            camviewid = 0;
        }
        if (k1 == 1) {
            switchcamera.setImageResource(R.drawable.backcamera_foreground);
            camviewid = 1;
        }

        switchcamera.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {

                if (camviewid == 0) {
                    switchcamera.setImageResource(R.drawable.backcamera_foreground);
                    B_new.setCamviewid(1);
                    camviewid = 1;
                    p.cameraviewid = 1;
                    ((FrameLayout) findViewById(R.id.preview)).removeView(preview);
                    ((FrameLayout) findViewById(R.id.preview)).addView(preview);

                } else if (camviewid == 1) {
                    switchcamera.setImageResource(R.drawable.frontcamera_foreground);
                    B_new.setCamviewid(0);
                    camviewid = 0;
                    p.cameraviewid = 0;
                    ((FrameLayout) findViewById(R.id.preview)).removeView(preview);
                    ((FrameLayout) findViewById(R.id.preview)).addView(preview);
                }

            }
        });


        if (k == 0 || k == -1) {
            flash.setImageResource(R.drawable.flashon_foreground);

            flash_c = 0;
        }

        if (k == 1) {
            flash.setImageResource(R.drawable.flashauto_foreground);
            flash_c = 1;
        }
        if (k == 2) {
            flash.setImageResource(R.drawable.flashoff_foreground);
            flash_c = 2;

        }

//        b_count.setFlash(-1);
        flash.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {

                if (!camera_new.isScanmode) {

                    if (flash_c == 0) {
                        flash.setImageResource(R.drawable.flashon_foreground);
                        B_new.setFlash(1);
                        flash_c = 1;

                    } else if (flash_c == 1) {
                        flash.setImageResource(R.drawable.flashauto_foreground);
                        B_new.setFlash(2);
                        flash_c = 2;

                    } else if (flash_c == 2) {
                        flash.setImageResource(R.drawable.flashoff_foreground);
                        B_new.setFlash(0);
                        flash_c = 0;
                    }
                } else {
                    Toast.makeText(MakePhotoActivity.this, "Flash mode not supported in meter Reading", Toast.LENGTH_SHORT).show();
                    LogUtils.photoLogFile("Flash mode not supported in meter Reading", MakePhotoActivity.class.getSimpleName() + "flash onClick");
                }
            }
        });


//		b.setVisibility(Button.INVISIBLE);
        flag = 0;

        if ((mSensorManager.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD)) == null || (mSensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER) == null)) {
            ivCaptureFront.setVisibility(VISIBLE);
            txtsm.setVisibility(View.INVISIBLE);
            txtmgnt.setVisibility(View.INVISIBLE);

        }

        try {
            int temp = 0;
            if (temp == 0) {
//				temp_jason_array = "[{\"numbers\": [0, 10,20,30,40,50,60,70,80,90,100,110,120,130,140,150,160,170,180,190,200,210,220,230,240,250,260,270,280,290,300,310,320,330,340,350,360] }]";
                temp_jason_array = "[{\"numbers\": [-10] }]";
            } else {
                temp_jason_array = "[{\"numbers\": [1, 43, 165, 34] }]";

            }

            JSONArray array = new JSONArray(temp_jason_array);
            JSONObject obj = array.optJSONObject(0);
            JSONArray array_new = obj.optJSONArray("numbers");
            degree_id = new int[array_new.length()];
            for (int i = 0; i < array_new.length(); ++i) {
                degree_id[i] = array_new.optInt(i);
            }


        } catch (Exception e) {
            //e.printStackTrace();
        }


        Intent my_intent = getIntent();
        try {

            PackageManager pm = getPackageManager();
            if (pm.hasSystemFeature(PackageManager.FEATURE_SENSOR_COMPASS)) {
                // This device does not have a compass, turn off the compass
                // feature
                deg = 30;
            } else {
                deg = -1;
            }

            // deg= Integer.parseInt(my_intent.getStringExtra("deg"));

        } catch (Exception e) {
            deg = -1;
        }


        // ((FrameLayout) findViewById(R.id.preview)).addView(preview);

        // do we have a camera?
        if (!getPackageManager()
                .hasSystemFeature(PackageManager.FEATURE_CAMERA)) {
            Toast.makeText(this, "No camera on this device", Toast.LENGTH_LONG)
                    .show();
        } else {
            cameraId = findFrontFacingCamera();
            if (cameraId < 0) {
                Toast.makeText(this, "No front facing camera found.",
                        Toast.LENGTH_LONG).show();
            }
        }

        mCustomDrawableView = new CustomDrawableView(this);
        mSensorManager = (SensorManager) getSystemService(SENSOR_SERVICE);
        accelerometer = mSensorManager
                .getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
        magnetometer = mSensorManager
                .getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD);
//        sqlitewraper.zoomControls = (ZoomControls) findViewById(R.id.CAMERA_ZOOM_CONTROLS);


        btnCancle.setOnClickListener(view -> {
            finish();

        });

        btnCrop.setOnClickListener(view -> {
            try {
                File pictureFile = cropImageToRectangle(imagePath, viewRectangleMask);
                String photoPath = pictureFile.getAbsolutePath();
                File pictureFile1 = new File(photoPath);
                getresult(pictureFile1);
                viewRectangleMask.setVisibility(View.GONE);
                topView.setVisibility(View.GONE);
                bottomView.setVisibility(View.GONE);
                leftView.setVisibility(View.GONE);
                rightView.setVisibility(View.GONE);
                progressPhoto.setVisibility(VISIBLE);
                btnCancle.setVisibility(View.GONE);
                btnCrop.setVisibility(View.GONE);
            } catch (Exception e) {
                LogUtils.photoLogFile("Exception: " + e.toString(), MakePhotoActivity.class.getSimpleName() + "btnCrop onClick");
            }

        });


        int margingPX = dpToPx(100);

        Log.d("##DP_PX", String.valueOf(margingPX));


        ViewTreeObserver viewTreeObserver = viewRectangleMask.getViewTreeObserver();
        if (viewTreeObserver.isAlive()) {
            viewTreeObserver.addOnGlobalLayoutListener(new ViewTreeObserver.OnGlobalLayoutListener() {
                @Override
                public void onGlobalLayout() {
                    viewRectangleMask.getViewTreeObserver().removeOnGlobalLayoutListener(this);

                    viewRectangleMask.getLayoutParams().width = deviceRealSize.getWidth() - margingPX;
                    viewRectangleMask.getLayoutParams().height = viewRectangleMask.getHeight();
                    maxHeight = (int) (viewRectangleMask.getHeight() * 1.5);
                    viewRectangleMask.requestLayout();
                }
            });
        }


        ViewTreeObserver viewTreeObserverTop = topView.getViewTreeObserver();
        if (viewTreeObserverTop.isAlive()) {
            viewTreeObserverTop.addOnGlobalLayoutListener(new ViewTreeObserver.OnGlobalLayoutListener() {
                @Override
                public void onGlobalLayout() {
                    topView.getViewTreeObserver().removeOnGlobalLayoutListener(this);

                    topView.getLayoutParams().width = topView.getWidth();
                    topView.getLayoutParams().height = (int) viewRectangleMask.getY();
                    topView.requestLayout();
                }
            });
        }


    }

    int maxHeight = 0;

    @Override
    public void onBackPressed() {
        super.onBackPressed();

        Bundle b = new Bundle();
        b.putString("result", "error");
        Intent intent = new Intent();
        intent.putExtras(b);
        setResult(RESULT_CANCELED, intent);
        finish();
    }

    //On Photo capture button clicked
    public void onClick(View view) {
        // camera = Camera.open(cameraId);
        LogUtils.photoLogFile("onClick Called", MakePhotoActivity.class.getSimpleName() + "onClick");

        try {
            List<String> supportedFocusModes = preview.camera.getParameters().getSupportedFocusModes();
            boolean hasAutoFocus = supportedFocusModes != null && supportedFocusModes.contains(Camera.Parameters.FOCUS_MODE_AUTO);
            PhotoHandler photo = new PhotoHandler(getApplicationContext(), this, viewRectangleMask, framelayout);
            if (hasAutoFocus) {
                if (preview.isfocus) {
                    preview.camera.takePicture(shutterCallback, null, photo);
                    LogUtils.photoLogFile("takePicture called after", MakePhotoActivity.class.getSimpleName() + "onClick");
                    ivCaptureFront.setClickable(false);
                    cameraImagePreview.setVisibility(VISIBLE);
                    layCameraText.setVisibility(View.GONE);
                    switchcamera.setVisibility(View.GONE);
                    layCameraControl.setVisibility(View.GONE);
                    if (camera_new.isScanmode) {
                        btnCrop.setVisibility(VISIBLE);
                        btnCancle.setVisibility(VISIBLE);
                    }
                } else {
                    preview.camera.autoFocus((b1, camera) -> {
                        preview.isfocus = b1;
                        if (b1) {
                            preview.camera.takePicture(shutterCallback, null, photo);
                            LogUtils.photoLogFile("takePicture called after", MakePhotoActivity.class.getSimpleName() + "onClick");
                            ivCaptureFront.setClickable(false);
                            cameraImagePreview.setVisibility(VISIBLE);
                            layCameraText.setVisibility(View.GONE);
                            switchcamera.setVisibility(View.GONE);
                            layCameraControl.setVisibility(View.GONE);
                            if (camera_new.isScanmode) {
                                btnCrop.setVisibility(VISIBLE);
                                btnCancle.setVisibility(VISIBLE);
                            }
                        } else {
                            LogUtils.photoLogFile("Just tap the screen to focus", MakePhotoActivity.class.getSimpleName() + "onClick");
                            preview.camera.takePicture(shutterCallback, null, photo);
                            LogUtils.photoLogFile("takePicture called after", MakePhotoActivity.class.getSimpleName() + "onClick");
                            ivCaptureFront.setClickable(false);
                            cameraImagePreview.setVisibility(VISIBLE);
                            layCameraText.setVisibility(View.GONE);
                            switchcamera.setVisibility(View.GONE);
                            layCameraControl.setVisibility(View.GONE);
                            if (camera_new.isScanmode) {
                                btnCrop.setVisibility(VISIBLE);
                                btnCancle.setVisibility(VISIBLE);
                            }
                            // Toast.makeText(getApplicationContext(), "Just tap the screen to focus", Toast.LENGTH_SHORT).show();
                        }
                    });
                }
            } else {
                preview.camera.takePicture(shutterCallback, null, photo);
                LogUtils.photoLogFile("takePicture called after", MakePhotoActivity.class.getSimpleName() + "onClick");
                ivCaptureFront.setClickable(false);
                cameraImagePreview.setVisibility(VISIBLE);
                layCameraText.setVisibility(View.GONE);
                switchcamera.setVisibility(View.GONE);
                layCameraControl.setVisibility(View.GONE);
                if (camera_new.isScanmode) {
                    btnCrop.setVisibility(VISIBLE);
                    btnCancle.setVisibility(VISIBLE);
                }
            }
        } catch (Exception e) {

            LogUtils.photoLogFile("Exception: " + e.toString(), MakePhotoActivity.class.getSimpleName() + "onClick");
        }
    }

    private int findFrontFacingCamera() {
        int cameraId = -1;
        // Search for the front facing camera
        int numberOfCameras = Camera.getNumberOfCameras();
        for (int i = 0; i < numberOfCameras; i++) {
            CameraInfo info = new CameraInfo();
            Camera.getCameraInfo(i, info);
            if (info.facing == CameraInfo.CAMERA_FACING_FRONT) {
                Log.d(DEBUG_TAG, "Camera found");
                cameraId = i;
                break;
            }
        }
        return cameraId;
    }

    private int findrearFacingCamera() {
        int cameraId = -1;
        // Search for the front facing camera
        int numberOfCameras = Camera.getNumberOfCameras();
        for (int i = 0; i < numberOfCameras; i++) {
            CameraInfo info = new CameraInfo();
            Camera.getCameraInfo(i, info);
            if (info.facing == CameraInfo.CAMERA_FACING_BACK) {
                Log.d(DEBUG_TAG, "Camera found");
                cameraId = i;
                break;
            }
        }
        return cameraId;
    }

    @Override
    protected void onPause() {
        if (preview.camera != null) {
            ((FrameLayout) findViewById(R.id.preview)).removeView(preview);
        }
        mSensorManager.unregisterListener(this);
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        if (preview.camera != null) {
            preview.camera.release();
            preview.camera = null;
        }
        mSensorManager.unregisterListener(this);
        super.onDestroy();
    }

    @Override
    protected void onResume() {
        // if (preview.camera == null) {
        //check device time auto or manual and stop user if it is manual
        String checkDeviceTime = sqlitewraper.context.getResources().getString(R.string.RestrictDeviceTime);
        if(checkDeviceTime.equalsIgnoreCase("true"))
        {
            checkDeviceTime();
        }
        ((FrameLayout) findViewById(R.id.preview)).removeView(preview);
        ((FrameLayout) findViewById(R.id.preview)).addView(preview);
        mSensorManager.registerListener(this, accelerometer,
                SensorManager.SENSOR_DELAY_UI);
        mSensorManager.registerListener(this, magnetometer,
                SensorManager.SENSOR_DELAY_UI);
        super.onResume();
    }


    public void checkDeviceTime() {
        try {
            int hh = Settings.Global.getInt(getContentResolver(), Settings.Global.AUTO_TIME);
            Log.d("##TIMEZONE", String.valueOf(hh));
            if (hh == 0) {
                showAlertDialogTimeDetect(this, "Please set time as Automatic/Network provided time from time setting.");
            }
        } catch (Settings.SettingNotFoundException e) {
            e.printStackTrace();
            Log.d("##TIMEZONE", String.valueOf(e.getMessage()));
        }
    }

    public void showAlertDialogTimeDetect(Activity activity, String msg) {
        final Dialog dialog = new Dialog(activity);
        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE);
        dialog.setCancelable(false);
        dialog.setContentView(R.layout.timedetection_dialog);

        TextView text = dialog.findViewById(R.id.text_dialog);
        text.setText(msg);

        Button dialogButton = dialog.findViewById(R.id.btn_dialog);
        dialogButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                dialog.dismiss();
                startActivityForResult(new Intent(android.provider.Settings.ACTION_DATE_SETTINGS), 0);
            }
        });
        if (!dialog.isShowing()) {
            dialog.show();
        }
    }

    public void onAccuracyChanged(Sensor sensor, int accuracy) {
    }

    //Calculating magnetic field setting
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() == Sensor.TYPE_ACCELEROMETER) {
            mGravity = exponentialSmoothing(event.values.clone(), mGravity,
                    (float) 0.3);

        }
        if (event.sensor.getType() == Sensor.TYPE_MAGNETIC_FIELD) {
            try {
                mGeomagnetic = exponentialSmoothing(event.values.clone(),
                        mGeomagnetic, (float) 0.6);
                float mt_temp = 0;
                for (int i = 0; i < mGeomagnetic.length; i++) {
                    mt_temp += mGeomagnetic[i] * mGeomagnetic[i];
                }
                mt = (mt + Math.sqrt(mt_temp)) / 2;
            } catch (Exception e) {

            }
        }
        if (mGravity != null && mGeomagnetic != null) {
            float[] R = new float[9];
            float[] I = new float[9];
            float[] R1 = new float[9];
            float[] R_4 = new float[16];
            float[] I_4 = new float[16];
            float[] R1_4 = new float[16];

            boolean success = SensorManager.getRotationMatrix(R, I, mGravity,
                    mGeomagnetic);
            if (success) {
                float[] orientation = new float[3];
                SensorManager.remapCoordinateSystem(R, SensorManager.AXIS_X,
                        SensorManager.AXIS_Z, R1);
                SensorManager.getOrientation(R1, orientation);

                azimut = orientation[0]; // orientation contains: azimut, pitch
                // and roll
                pich = orientation[1];
                roll = orientation[2];

                az = Math.toDegrees(azimut);
                pich1 = Math.toDegrees(pich);
                roll1 = Math.toDegrees(roll);

                if (az < 0) {
                    az = 360 + az;
                }
                if (pich1 < 0) {
                    pich1 = 360 + pich1;
                }
                if (roll1 < 0) {
                    roll1 = 360 + roll1;
                }

                for (int i = 0; i < degree_id.length; i++) {
                    if ((degree_id[i] == -1 || mt > 50) && flag == 0) {
                        flag = 1;
                        ivCaptureFront.setVisibility(VISIBLE);

                    } else if ((degree_id[i] - 5 < az && degree_id[i] + 5 > az)
                            && flag == 0) {
                        j = i;
                        flag = 1;
                        ivCaptureFront.setVisibility(VISIBLE);
                    } else if (degree_id[i] != -1
                            && mt < 50
                            && flag == 1
                            && !(degree_id[i] - 5 < az && degree_id[i] + 5 > az)
                            && (j == i)) {
                        flag = 0;
                        ivCaptureFront.setVisibility(View.INVISIBLE);
                    }

                }
            }

        }

        Integer az_temp = (int) Math.ceil(az);
        String notation = "N";
        if (az_temp < 23) {
            notation = "N";
        } else if (az_temp < 68) {
            notation = "NE";
        } else if (az_temp < 113) {
            notation = "E";
        } else if (az_temp < 158) {
            notation = "SE";
        } else if (az_temp < 203) {
            notation = "S";
        } else if (az_temp < 248) {
            notation = "SW";
        } else if (az_temp < 293) {
            notation = "W";
        } else if (az_temp < 338) {
            notation = "NW";
        }
        txtsm.setTextColor(Color.WHITE);
        txtsm.setText(az_temp.toString() + (char) 0x00B0 + " " + notation);
        Integer mt_temp = (int) Math.ceil(mt);
        txtmgnt.setTextColor(Color.WHITE);
        txtmgnt.setText("MF : " + mt_temp.toString());
    }

    private float[] exponentialSmoothing(float[] input, float[] output,
                                         float alpha) {
        if (output == null)
            return input;
        for (int i = 0; i < input.length; i++) {
            output[i] = output[i] + alpha * (input[i] - output[i]);
        }
        return output;
    }


    //getting result after photo clicked and save
    void getresult(File path) {

        try {
            listOfPhotoPath.add(path);

            if (camera_new.isburstMode.equalsIgnoreCase("false")) {

                MySharedPreferences prefs = sqlitewraper.getSecureShared("Size");
                int width1 = prefs.getInt("max_width", 0);
                int height1 = prefs.getInt("max_height", 0);

                String max_width = String.valueOf(width1);
                String max_height = String.valueOf(height1);
                Integer mt_temp = (int) Math.ceil(mt);
                String SMText = txtsm.getText().toString();

                Intent i = new Intent(sqlitewraper.context, easy_draw_new.class);
//            Intent i = new Intent(sqlitewraper.context, BurstPhotoActivity.class);
                i.putExtra("File", path);
                i.putExtra("b_write", b_write);
                i.putExtra("width", max_width);
                i.putExtra("quality", quality);
                i.putExtra("height", max_height);
                i.putExtra("picclicklat", String.valueOf(deviceLat));
                i.putExtra("picclicklng", String.valueOf(deviceLng));
                i.putExtra("flagdraw", "0");
                i.putExtra("drawflag", "0");
                i.putExtra("cameraview", p.cameraviewid);
                i.putExtra("serverwidth", width);
                i.putExtra("serverheight", height);
                i.putExtra("serverheight", height);
                i.putExtra("serverheight", height);
                i.putExtra("canInsert", 1);
                i.putExtra("MFtext", mt_temp);
                i.putExtra("SMText", SMText);
                i.putExtra("info", info);
                i.putExtra("max_file_size",max_file_size);
                startActivityForResult(i, 101);

            } else {
                Integer mt_temp = (int) Math.ceil(mt);
                String SMText = txtsm.getText().toString();
                if (listOfPhotoPath.size() >= 3) {

                    MySharedPreferences prefs = sqlitewraper.getSecureShared("Size");
                    int width1 = prefs.getInt("max_width", 0);
                    int height1 = prefs.getInt("max_height", 0);

                    String max_width = String.valueOf(width1);
                    String max_height = String.valueOf(height1);

//          Intent i = new Intent(sqlitewraper.context, easy_draw_new.class);
                    Intent i = new Intent(sqlitewraper.context, BurstPhotoActivity.class);
                    i.putExtra("File", path);
                    i.putExtra("b_write", b_write);
                    i.putExtra("width", max_width);
                    i.putExtra("quality", quality);
                    i.putExtra("height", max_height);
                    i.putExtra("picclicklat", String.valueOf(deviceLat));
                    i.putExtra("picclicklng", String.valueOf(deviceLng));
                    i.putExtra("flagdraw", "0");
                    i.putExtra("drawflag", "0");
                    i.putExtra("cameraview", p.cameraviewid);
                    i.putExtra("serverwidth", width);
                    i.putExtra("serverheight", height);
                    i.putExtra("listofphoto", listOfPhotoPath);
                    i.putExtra("max_width", String.valueOf(width1));
                    i.putExtra("max_height", String.valueOf(height1));
                    i.putExtra("canInsert", 1);
                    i.putExtra("MFtext", mt_temp);
                    i.putExtra("SMText", SMText);
                    startActivityForResult(i, 101);

                    listOfPhotoPath.clear();
                } else {
                    Toast.makeText(getApplicationContext(), "Please capture another photo", Toast.LENGTH_LONG).show();
                    ivCaptureFront.setClickable(true);
                    ((FrameLayout) findViewById(R.id.preview)).removeView(preview);
                    ((FrameLayout) findViewById(R.id.preview)).addView(preview);
                    photoNumber--;
                    textAnimatorView.setText("" + photoNumber);
//            animateTextView(,3,textAnimatorView);
                }
            }
        } catch (Exception e) {
            LogUtils.photoLogFile("Exception: " + e.toString(), MakePhotoActivity.class.getSimpleName() + "getresult");
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode,
                                    Intent intent) {
        // TODO Auto-generated method stub
        super.onActivityResult(requestCode, resultCode, intent);

        if (requestCode == 101) {
//            if (resultCode == android.app.Activity.RESULT_OK) { //
            data d = new data();
            if (data.getRet() == 1 && intent == null) {
                if (resultCode == Activity.RESULT_OK) {
                    data.setRet(0);
                    String status = pref.getString("photo_path", "");
                    Bundle b = new Bundle();
                    b.putString("status", status);
                    Intent intent1 = new Intent();
                    intent1.putExtras(b);
                    setResult(RESULT_OK, intent1);
                    finish();
                } else {

                    Bundle b = new Bundle();
                    Intent intent1 = new Intent();
                    intent1.putExtras(b);
                    setResult(RESULT_CANCELED, intent1);
                    finish();
                }
            } else {
                B_new.setCount_new(1);
                // retour de la version utilisant le sample de imense alpr
                if (resultCode == Activity.RESULT_OK) { // 0:ok
                    Bundle bundle = intent.getExtras();
                    String status = bundle.getString("status");
                    ret = bundle.getInt("ret");

                    pref.putString("photo_path", status); // Saving string
                    pref.commit(); // commit changes
                    // pref.getString("key_name5", null); // getting String

                    Bundle b = new Bundle();

                    b.putString("status", status);
                    Intent intent1 = new Intent();
                    intent1.putExtras(b);
                    setResult(RESULT_OK, intent);
                    B_new.setPath_final(status);

                    pref.putString("photo_path", status); // Saving
                    // string

                    pref.commit();

                    finish();


                } else if (intent == null && resultCode != Activity.RESULT_CANCELED) {

                    if (B_new.getCount_new() == 1) {

                        Bundle b = new Bundle();

                        b.putString("status", B_new.getPath_final());
                        Intent intent1 = new Intent();
                        intent1.putExtras(b);


                        if (B_new.getPath_final() == null) {
                            setResult(RESULT_CANCELED, intent1);
                        } else {
                            setResult(RESULT_OK, intent1);
                        }

                        pref.putString("photo_path", B_new.getPath_final()); // Saving
                        // string

                        pref.commit();

                    } else {

                        Bundle b = new Bundle();
                        b.putString("result", "error");
                        Intent intent1 = new Intent();
                        intent1.putExtras(b);
                        setResult(RESULT_CANCELED, intent1);
                    }
                    finish();

                } else {

                    Bundle b = new Bundle();
                    b.putString("result", "error");
                    Intent intent1 = new Intent();
                    intent1.putExtras(b);
                    setResult(RESULT_CANCELED, intent1);

                    finish();

                }

            }
        } else if (requestCode == 158) {
            if (resultCode == Activity.RESULT_OK) {
                Bundle bundle = intent.getExtras();
                String photoPath = bundle.getString("photopath");
                Log.d("##IMAGEPATH", photoPath);
                File pictureFile = new File(photoPath);
                getresult(pictureFile);
            } else {
                Bundle b = new Bundle();
                b.putString("result", "error");
                Intent intent1 = new Intent();
                intent1.putExtras(b);
                setResult(RESULT_CANCELED, intent1);
                finish();
            }
        }
    }

    @Override
    public void onLocationChanged(Location location) {

        deviceLat = location.getLatitude();
        deviceLng = location.getLongitude();


        if (deviceLat == 0.0 && deviceLng == 0.0) {
            ivCaptureFront.setClickable(false);
            Toast.makeText(this, "LatLong not found", Toast.LENGTH_SHORT).show();

        } else {
            ivCaptureFront.setClickable(true);
        }

        imglat.setText("Lat: " + (float) deviceLat);
        imglng.setText("Lng: " + (float) deviceLng);

    }

    @Override
    public void onStatusChanged(String provider, int status, Bundle extras) {

    }

    @Override
    public void onProviderEnabled(String provider) {

    }

    @Override
    public void onProviderDisabled(String provider) {

    }

    private void getLastKnownLocation() {

        if (ActivityCompat.checkSelfPermission(sqlitewraper.context, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(sqlitewraper.context, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {

            return;
        }
        Location lastLocation = LocationServices.FusedLocationApi.getLastLocation(googleApiClient);
        if (lastLocation != null) {

            deviceLat = lastLocation.getLatitude();
            deviceLng = lastLocation.getLongitude();

        } else {

        }

    }

    public class CustomDrawableView extends View {
        Paint paint = new Paint();
        Paint paint1 = new Paint();

        public CustomDrawableView(Context context) {
            super(context);
            paint.setColor(0xff00ff00);
            paint.setStyle(Style.STROKE);
            paint.setStrokeWidth(2);
            paint.setAntiAlias(true);
            paint.setTextSize(25);

            paint.setColor(0xff00ff00);
            paint.setStyle(Style.STROKE);
            paint.setStrokeWidth(2);
            paint.setAntiAlias(true);

        }

        protected void onDraw(Canvas canvas) {
            int width = getWidth() / 5;
            int height = getHeight() / 10;
            int centerx = 0;
            int centery = 0;

            if (azimut != null)
                // canvas.rotate(-azimut*360/(2*3.14159f), centerx, centery);
                paint.setColor(0xff0000ff);

            try {

                int az_temp = (int) Math.ceil(az);
                String notation = "N";
                if (az_temp < 23) {
                    notation = "N";
                } else if (az_temp < 68) {
                    notation = "NE";
                } else if (az_temp < 113) {
                    notation = "E";
                } else if (az_temp < 158) {
                    notation = "SE";
                } else if (az_temp < 203) {
                    notation = "S";
                } else if (az_temp < 248) {
                    notation = "SW";
                } else if (az_temp < 293) {
                    notation = "W";
                } else if (az_temp < 338) {
                    notation = "NW";
                }
                txtsm.setTextColor(Color.WHITE);
                txtsm.setText(Integer.toString(az_temp) + (char) 0x00B0 + " " + notation);
                smText = txtsm.getText().toString();
                Integer mt_temp = (int) Math.ceil(mt);
                txtmgnt.setTextColor(Color.WHITE);
                txtmgnt.setText("MF: " + mt_temp.toString());
            } catch (Exception e) {
            }
        }
    }

    @Override
    public boolean onTouch(View view, MotionEvent event) {


        int xX = (int) event.getRawX();
        int yY = (int) event.getRawY();
        rectHeight = viewRectangleMask.getHeight();
        rectWidth = viewRectangleMask.getWidth();
        switch (event.getActionMasked()) {

            case MotionEvent.ACTION_DOWN:


                if (view.getId() == R.id.viewRectangleMask) {

                    btnRight.setVisibility(VISIBLE);
                    btnLeft.setVisibility(VISIBLE);
                    btnUp.setVisibility(VISIBLE);
                    btnDown.setVisibility(VISIBLE);

                    autofocusTouchListner.onFocusTap();
                    dX = view.getX() - event.getRawX();
                    dY = view.getY() - event.getRawY();
                    lastAction = MotionEvent.ACTION_DOWN;
                } else if (view.getId() == R.id.btn_upside) {

                    Log.d("##TOUCH_REC", "DOWN");


                    downY = view.getY() - event.getRawY();
                    downDY = event.getRawY();

                    Log.d("##TOUCH_REC_DOWNY", String.valueOf(downDY));

                } else if (view.getId() == R.id.btn_down_side) {

                    downDY = event.getRawY();
                } else if (view.getId() == R.id.btn_right_side) {

                    viewRectangleMaskX = viewRectangleMask.getX();
                    downDX = event.getRawX();

                    btnLeftY = btnLeft.getY();

                } else if (view.getId() == R.id.btn_left_side) {
                    downX = view.getX() - event.getRawX();
                    downDX = event.getRawX();
                }

                break;

            case MotionEvent.ACTION_MOVE:

                if (view.getId() == R.id.viewRectangleMask) {

                    changeViewSize(event, view);

                } else if (view.getId() == R.id.btn_upside) {
                    Log.d("##TOUCH_REC", "MOVE");


                    float newDifference = downDY - yY;

                    int newHeight = (int) (rectHeight + newDifference);

                    Log.d("##TOUCH_VIEW_HEIGHT", String.valueOf(newHeight));
                    int maxSize = Math.abs((deviceRealSize.getHeight() / 2) - 100);

                    if (newHeight >= 240 && newHeight <= maxHeight) {

                        viewRectangleMask.setY(event.getRawY() + downY);
                        viewRectangleMask.getLayoutParams().width = viewRectangleMask.getWidth();
                        viewRectangleMask.getLayoutParams().height = newHeight;
                        viewRectangleMask.requestLayout();

                        int newTopHeight = (int) viewRectangleMask.getY();

                        topView.getLayoutParams().width = topView.getWidth();
                        topView.getLayoutParams().height = newTopHeight;
                        topView.requestLayout();

                        leftView.setY(viewRectangleMask.getY());
                        leftView.getLayoutParams().width = leftView.getWidth();
                        leftView.getLayoutParams().height = newHeight;
                        leftView.requestLayout();

                        rightView.setY(viewRectangleMask.getY());
                        rightView.getLayoutParams().width = rightView.getWidth();
                        rightView.getLayoutParams().height = newHeight;
                        rightView.requestLayout();


                        int newWidth = 0;
                        int newBottomHeght = 0;
                        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
                            newWidth = (int) (deviceRealSize.getWidth() - (viewRectangleMask.getX() + viewRectangleMask.getWidth()));
                            newBottomHeght = (int) (deviceRealSize.getHeight() - (viewRectangleMask.getY() + viewRectangleMask.getHeight()));
                        }

                        bottomView.setY(viewRectangleMask.getY() + viewRectangleMask.getHeight());
                        bottomView.getLayoutParams().width = bottomView.getWidth();
                        bottomView.getLayoutParams().height = newBottomHeght;
                        bottomView.requestLayout();

                    }


                } else if (view.getId() == R.id.btn_down_side) {


                    float newDifference = yY - downDY;

                    int newHeight = (int) (rectHeight + newDifference);

                    Log.d("##TOUCH_VIEW_HEIGHT", String.valueOf(newHeight) + " " + (newHeight >= 240) + " ::" + (newHeight <= maxHeight));

                    int maxSize = Math.abs((deviceRealSize.getHeight() / 2) - 100);
                    if (newHeight >= 240 && newHeight <= maxHeight) {

                        viewRectangleMask.getLayoutParams().width = viewRectangleMask.getWidth();
                        viewRectangleMask.getLayoutParams().height = newHeight;
                        viewRectangleMask.requestLayout();


                        int newWidth = 0;
                        int newBottomHeght = 0;
                        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
                            newWidth = (int) (deviceRealSize.getWidth() - (viewRectangleMask.getX() + viewRectangleMask.getWidth()));
                            newBottomHeght = (int) (deviceRealSize.getHeight() - (viewRectangleMask.getY() + viewRectangleMask.getHeight()));
                        }


                        bottomView.setY(viewRectangleMask.getY() + viewRectangleMask.getHeight());
                        bottomView.getLayoutParams().width = bottomView.getWidth();
                        bottomView.getLayoutParams().height = newBottomHeght;
                        bottomView.requestLayout();


                        leftView.setY(viewRectangleMask.getY());
                        leftView.getLayoutParams().width = leftView.getWidth();
                        leftView.getLayoutParams().height = newHeight;
                        leftView.requestLayout();

                        rightView.setY(viewRectangleMask.getY());
                        rightView.getLayoutParams().width = rightView.getWidth();
                        rightView.getLayoutParams().height = newHeight;
                        rightView.requestLayout();


                    }

                } else if (view.getId() == R.id.btn_right_side) {


                    float newDifference = xX - downDX;

                    int newWidth = (int) (rectWidth + newDifference);

                    Log.d("##TOUCH_VIEW_WIDTH", String.valueOf(newWidth));
                    int btnx = (int) btnLeft.getX();

                    if (newWidth >= 500 && btnx > 2) {

                        viewRectangleMask.setX(viewRectangleMaskX);

                        viewRectangleMask.getLayoutParams().width = newWidth;
                        viewRectangleMask.getLayoutParams().height = viewRectangleMask.getHeight();
                        viewRectangleMask.requestLayout();


                        Log.d("##TOUCH_VI_MASK_WIDTH", String.valueOf(viewRectangleMask.getWidth()));


                        int newWidthRight = 0;
                        int newBottomHeght = 0;
                        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
                            newWidthRight = (int) (deviceRealSize.getWidth() - (viewRectangleMask.getX() + viewRectangleMask.getWidth()));
                            newBottomHeght = (int) (deviceRealSize.getHeight() - (viewRectangleMask.getY() + viewRectangleMask.getHeight()));
                        }

                        int newRectangle = (int) (viewRectangleMask.getX() + viewRectangleMask.getWidth());

                        rightView.setX(newRectangle);
                        rightView.getLayoutParams().width = newWidthRight;
                        rightView.getLayoutParams().height = rightView.getHeight();
                        rightView.requestLayout();

                        float viewxset = viewRectangleMask.getX() - btnLeft.getWidth();
                        btnLeft.setX(viewxset);
                        btnRight.setX(viewRectangleMask.getX() + viewRectangleMask.getWidth());

                    }


                } else if (view.getId() == R.id.btn_left_side) {


                    float newDifference = downDX - xX;

                    int newWidth = (int) (rectWidth + newDifference);
                    int btnx = (int) btnLeft.getX();

                    if (newWidth >= 500 && btnx > 20) {

                        Log.d("##L_TOUCH_NEWWIDTH", String.valueOf(newWidth));
                        Log.d("##L_TOUCH_VIEW_1", String.valueOf(viewRectangleMask.getWidth()));

                        viewRectangleMask.setX(event.getRawX() + downX);
                        viewRectangleMask.getLayoutParams().width = newWidth;
                        viewRectangleMask.getLayoutParams().height = viewRectangleMask.getHeight();
                        viewRectangleMask.requestLayout();

                        Log.d("##L_TOUCH_VIEW_2", String.valueOf(viewRectangleMask.getWidth()));


                        leftView.getLayoutParams().width = (int) viewRectangleMask.getX();
                        leftView.getLayoutParams().height = leftView.getHeight();
                        leftView.requestLayout();


                        rightView.setX((int) viewRectangleMask.getX() + viewRectangleMask.getWidth());
                        rightView.getLayoutParams().width = (int) viewRectangleMask.getX() + viewRectangleMask.getWidth();
                        rightView.getLayoutParams().height = leftView.getHeight();
                        rightView.requestLayout();

                        btnLeft.setX(viewRectangleMask.getX() - btnLeft.getMeasuredWidth());
                        btnRight.setX(viewRectangleMask.getX() + viewRectangleMask.getWidth());

                    }


                }

                break;
            case MotionEvent.ACTION_UP:
                if (lastAction == MotionEvent.ACTION_DOWN)
                    Toast.makeText(MakePhotoActivity.this, "Clicked!", Toast.LENGTH_SHORT).show();
                break;
            default:

                return false;

        }
        return true;
    }


    //Showing captured Photo  to the view
    public void gotoPreviewActivity(String photoPath) {

        imagePath = photoPath;

        Bitmap myBitmap = BitmapFactory.decodeFile(photoPath);

        Matrix matrix = new Matrix();
        matrix.postRotate(90);
        Bitmap rotatedBitmap = Bitmap.createBitmap(myBitmap, 0, 0,
                myBitmap.getWidth(), myBitmap.getHeight(), matrix, true);

        cameraImagePreview.setImageBitmap(rotatedBitmap);

//        cropImage(rotatedBitmap);

//        Intent i = new Intent(this, PhotoPreviewActivity.class);
//        i.putExtra("imgpath", photoPath);
//        startActivityForResult(i, 158);
    }

    //Real Display of Device
    @RequiresApi(api = Build.VERSION_CODES.LOLLIPOP)
    private Size getRealSizeOfDisplay() {
        Display display = getWindowManager().getDefaultDisplay();
        Point size = new Point();
        display.getRealSize(size);
        final int height = size.y;
        final int width = size.x;
        return new Size(width, height);
    }


    //Calculation to crop image to rectangle size
    private File cropImageToRectangle(String filepath, View borderCamera) {

        File finalFile = null;
        try {
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
            float koefX = (float) rotatedBitmap.getWidth() / (float) mainFrameLay.getWidth();
            float koefY = (float) rotatedBitmap.getHeight() / mainFrameLay.getHeight();

            //get viewfinder border size and position on the screen
            int x1 = (int) borderCamera.getX();
            int y1 = (int) borderCamera.getY();

            if (x1 < 0) {
                x1 = 0;
            }
            if (y1 < 0) {
                y1 = 0;
            }

            int x2 = borderCamera.getWidth();
            int y2 = borderCamera.getHeight();

            //calculate position and size for cropping
            int cropStartX = Math.round(x1 * koefX);
            int cropStartY = Math.round(y1 * koefY);

            int cropWidthX = Math.round(x2 * koefX);
            int cropHeightY = Math.round(y2 * koefY);

            //check limits and make crop
            Bitmap croppedBitmapNew;
            if (cropStartX + cropWidthX <= rotatedBitmap.getWidth() &&
                    cropStartY + cropHeightY <= rotatedBitmap.getHeight()) {
                croppedBitmapNew = Bitmap.createBitmap(rotatedBitmap, cropStartX,
                        cropStartY, cropWidthX, cropHeightY);
            } else {
                croppedBitmapNew = null;
            }
            if (camera_new.isScanmode)
                cameraImagePreview.setImageBitmap(croppedBitmapNew);

            finalFile = savebitmap(croppedBitmapNew);
        } catch (Exception e) {
            LogUtils.photoLogFile("Exception: " + e.toString(), MakePhotoActivity.class.getSimpleName() + "cropImageToRectangle");
        }
        return finalFile;
    }

    //to save Bitmap
    private File savebitmap(Bitmap bmp) throws IOException {
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        bmp.compress(Bitmap.CompressFormat.PNG, 100, bytes);
        File f = new File(createNewDirectory("Easyform photos"), "cropimage_" + System.currentTimeMillis() + ".jpg");
        f.createNewFile();
        FileOutputStream fo = new FileOutputStream(f);
        fo.write(bytes.toByteArray());
        fo.close();
        return f;
    }

    //to create new directory
    public String createNewDirectory(String name) {
        // create a directory before creating a new file inside it.
        File directory = new File(Environment.getExternalStorageDirectory(), name);
        if (!directory.exists()) {
            directory.mkdirs();
        }
        return directory.getAbsolutePath();
    }


    //to change the view on Drag
    private void changeViewSize(MotionEvent event, View view) {

        int viewBottom = (int) (event.getRawY() + dY + view.getHeight());
        int viewRight = (int) (event.getRawX() + dX + view.getWidth());


        if (event.getRawX() + dX > 20 && event.getRawY() + dY > 20 && viewRight < deviceRealSize.getWidth() - 20 && view.getX() > 10) {

            view.setY(event.getRawY() + dY);
            view.setX(event.getRawX() + dX);

            Log.d("##VISIBLE_VIEW_X_2", String.valueOf(view.getX()));


            lastAction = MotionEvent.ACTION_MOVE;
            viewRectangleMask = view;

            leftView.setY(event.getRawY() + dY);
            rightView.setY(event.getRawY() + dY);
            bottomView.setY(event.getRawY() + dY + viewRectangleMask.getHeight());

            int newHeight = (int) viewRectangleMask.getY();

            int newWidth = 0;
            int newBottomHeght = 0;
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
                newWidth = (int) (deviceRealSize.getWidth() - (viewRectangleMask.getX() + viewRectangleMask.getWidth()));
                newBottomHeght = (int) (deviceRealSize.getHeight() - (viewRectangleMask.getY() + viewRectangleMask.getHeight()));
            }

            rightView.setX(viewRectangleMask.getX() + viewRectangleMask.getWidth());
            topView.setLayoutParams(new ConstraintLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, newHeight));
            leftView.setLayoutParams(new ConstraintLayout.LayoutParams((int) viewRectangleMask.getX(), leftView.getHeight()));
            rightView.setLayoutParams(new ConstraintLayout.LayoutParams(newWidth, leftView.getHeight()));
            bottomView.setLayoutParams(new ConstraintLayout.LayoutParams(bottomView.getWidth(), newBottomHeght));

            // int margingPX = dpToPx(btnLeft.getWidth());

            btnLeft.setX(viewRectangleMask.getX() - btnLeft.getMeasuredWidth());
            btnRight.setX(viewRectangleMask.getX() + viewRectangleMask.getWidth());


        }

    }

    public int dpToPx(int dp) {
        DisplayMetrics displayMetrics = getApplicationContext().getResources().getDisplayMetrics();
        return Math.round(dp * (displayMetrics.xdpi / DisplayMetrics.DENSITY_DEFAULT));
    }

    private boolean checkPermission() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) +
                ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) +
                ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
            // Permission is not granted
            return false;
        }
        return true;
    }

    private void requestPermission() {

        ActivityCompat.requestPermissions(MakePhotoActivity.this,
                new String[]{Manifest.permission.CAMERA,Manifest.permission.WRITE_EXTERNAL_STORAGE,Manifest.permission.READ_EXTERNAL_STORAGE},
                PERMISSION_REQUEST_CODE);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String permissions[], int[] grantResults) {
        switch (requestCode) {
            case PERMISSION_REQUEST_CODE:
                if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED
                        && grantResults[1] == PackageManager.PERMISSION_GRANTED
                        && grantResults[2] == PackageManager.PERMISSION_GRANTED) {
                   // Toast.makeText(getApplicationContext(), "Permission Granted", Toast.LENGTH_SHORT).show();

                    // main logic
                } else {
                   // Toast.makeText(getApplicationContext(), "Permission Denied", Toast.LENGTH_SHORT).show();
                    if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) +
                            ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) +
                            ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED)  {

                        showMessageOKCancel("You need to allow access camera & file and media permissions",
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
                break;
        }
    }

    private void showMessageOKCancel(String message, DialogInterface.OnClickListener okListener) {
        new AlertDialog.Builder(MakePhotoActivity.this)
                .setMessage(message)
                .setPositiveButton("OK", okListener)
                .setCancelable(false)
                .create()
                .show();
    }
}
