package com.sky.atc.easyformse;

import static android.view.View.VISIBLE;

import static com.sky.atc.easyformse.sqlitewraper.mainactivity;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.Matrix;
import android.graphics.Point;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.provider.Settings;
import android.util.DisplayMetrics;
import android.util.Log;
import android.util.Size;
import android.view.Display;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.RelativeLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.result.ActivityResultCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.AppCompatButton;
import androidx.appcompat.widget.AppCompatImageView;
import androidx.constraintlayout.widget.ConstraintLayout;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.google.android.gms.common.api.GoogleApiClient;
import com.google.android.gms.location.LocationServices;
import com.google.android.material.button.MaterialButton;
import com.otaliastudios.cameraview.CameraListener;
import com.otaliastudios.cameraview.CameraView;
import com.otaliastudios.cameraview.FileCallback;
import com.otaliastudios.cameraview.PictureResult;
import com.otaliastudios.cameraview.controls.Facing;
import com.otaliastudios.cameraview.controls.Flash;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.photo.PhotoConstants;
import com.sky.atc.easyformse.utils.LogUtils;
import com.sky.atc.easyformse.utils.newView.MyBackgroundView;
import com.sky.atc.easyformse.utils.newView.MyCustomView;
import com.sky.atc.easyformse.utils.newView.OnDragDownTouchListener;
import com.sky.atc.easyformse.utils.newView.OnDragEndTouchListener;
import com.sky.atc.easyformse.utils.newView.OnDragStartTouchListener;
import com.sky.atc.easyformse.utils.newView.OnDragTopTouchListener;
import com.sky.atc.easyformse.utils.newView.OnDragTouchListener;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

public class NewCameraActivity extends AppCompatActivity implements FileCallback, SensorEventListener, LocationListener {
    private static final String TAG = "NewCameraActivity";
    CameraView cvMainCamera;
    ProgressBar progressBar;
    AppCompatImageView ivSwitchCamera, ivCaptureFront, ivFlash;
    AppCompatButton btnUpSide, btnDownSide, btnStartSide, btnEndSide;
    ConstraintLayout rlView;
    View viewRectangleMask;
    MyCustomView mcvData;
    MyBackgroundView mbView;
    RelativeLayout rlCameraViews;
    LinearLayout llButtons;
    AppCompatImageView acIvImagePreview;
    DisplayMetrics displayMetrics = new DisplayMetrics();
    MaterialButton mbtCrop, mbtCancel;


    private SensorManager mSensorManager;
    TextView txtSi, txtMGnt;
    Sensor accelerometer;
    Sensor magnetometer;


    private LocationManager locationManager;
    private GoogleApiClient googleApiClient;
    private static final int PERMISSION_REQUEST_CODE = 200;
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_new_camera);
        com.sky.atc.easyformse.utils.newView.CameraChrome.apply(this);
        googleApiClient = sqlitewraper.getGoogleApiHelper().getGoogleApiClient();
        if (checkPermission_camera()) {
            //main logic or main code
        } else {
            requestPermission();
        }
        initUi();
        rotation = 0;
        getLastKnownLocation();
        setUpSensor();
        permissionList.add(Manifest.permission.CAMERA);
        permissionList.add(Manifest.permission.RECORD_AUDIO);
        permissionList.add(Manifest.permission.READ_EXTERNAL_STORAGE);
        permissionList.add(Manifest.permission.WRITE_EXTERNAL_STORAGE);
        permissionList.add(Manifest.permission.ACCESS_FINE_LOCATION);
        permissionList.add(Manifest.permission.ACCESS_COARSE_LOCATION);
        checkPermission();


    }

    private void setUpSensor() {
        mSensorManager = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
        accelerometer = mSensorManager
                .getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
        magnetometer = mSensorManager
                .getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD);
        if ((mSensorManager.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD)) == null || (mSensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER) == null)) {
            ivCaptureFront.setVisibility(VISIBLE);
            txtSi.setVisibility(View.INVISIBLE);
            txtMGnt.setVisibility(View.INVISIBLE);
        } else {
            txtSi.setVisibility(VISIBLE);
            txtMGnt.setVisibility(VISIBLE);
        }
        mSensorManager.registerListener(this, accelerometer,
                SensorManager.SENSOR_DELAY_UI);
        mSensorManager.registerListener(this, magnetometer,
                SensorManager.SENSOR_DELAY_UI);
    }

    @Override
    protected void onDestroy() {
        mSensorManager.unregisterListener(this);
        super.onDestroy();
    }

    @Override
    protected void onResume() {
        super.onResume();

        mSensorManager.registerListener(this, accelerometer,
                SensorManager.SENSOR_DELAY_UI);
        mSensorManager.registerListener(this, magnetometer,
                SensorManager.SENSOR_DELAY_UI);
    }

    public static int maxHeightView;
    public static int minHeightView;
    public static int minWidthView;

    OnDragTouchListener onDragTouchListener;
    OnDragTopTouchListener onDragTopTouchListener;
    OnDragDownTouchListener onDragDownTouchListener;
    OnDragStartTouchListener onDragStartTouchListener;
    OnDragEndTouchListener onDragEndTouchListener;

    private void initUi() {
        rlView = findViewById(R.id.rlView);
        ivSwitchCamera = findViewById(R.id.ivSwitchCamera);
        progressBar = findViewById(R.id.progressBar);
        ivCaptureFront = findViewById(R.id.ivCaptureFront);
        viewRectangleMask = findViewById(R.id.viewRectangleMask);
        rlCameraViews = findViewById(R.id.rlCameraViews);
        llButtons = findViewById(R.id.llButtons);
        acIvImagePreview = findViewById(R.id.acIvImagePreview);
        mcvData = findViewById(R.id.mcvData);
        mbView = findViewById(R.id.mbView);
        ivFlash = findViewById(R.id.ivFlash);
        txtSi = findViewById(R.id.txtSi);
        txtMGnt = findViewById(R.id.txtMGnt);

        mbtCrop = findViewById(R.id.mbtCrop);
        mbtCancel = findViewById(R.id.mbtCancel);

        btnUpSide = findViewById(R.id.btnUpSide);
        btnDownSide = findViewById(R.id.btnDownSide);
        btnStartSide = findViewById(R.id.btnStartSide);
        btnEndSide = findViewById(R.id.btnEndSide);
        setOnClickListeners();

        getScreenSize();
        ConstraintLayout.LayoutParams layoutParams = (ConstraintLayout.LayoutParams) viewRectangleMask.getLayoutParams();
        layoutParams.setMargins(convertDpToPixel(50), convertDpToPixel(110), 0, 0);
        layoutParams.width = (displayMetrics.widthPixels - convertDpToPixel(100));
        layoutParams.height = convertDpToPixel(120);
        viewRectangleMask.setLayoutParams(layoutParams);
        minHeightView = layoutParams.height;
        minWidthView = layoutParams.width;
        maxHeightView = (int) (minHeightView * 1.5);
        setupTopTouchListener();
        mbView.setViewWidth(minWidthView);
        mbView.setViewHeight(minHeightView);
    }

    private void setOnClickListeners() {
        mbtCrop.setOnClickListener(v -> {
            if (takenPictureFile != null) {
                try {
                    PhotoConstants.originalPhoto = takenPictureFile.getAbsolutePath();
                    File cropImageFile = cropImageToRectangle(takenPictureFile.getAbsolutePath(), viewRectangleMask);
                    getResult(cropImageFile);
                } catch (Exception e) {
                    LogUtils.photoLogFile("Exception: " + e.toString(), MakePhotoActivity.class.getSimpleName() + " mbtCrop OnClick");
                }
            } else {
                LogUtils.photoLogFile("takenPictureFile is null ", MakePhotoActivity.class.getSimpleName() + " mbtCrop OnClick");
            }
        });
        mbtCancel.setOnClickListener(v -> finish());
        ivSwitchCamera.setOnClickListener(v -> {
            if (cvMainCamera != null) {
                if (cvMainCamera.getFacing() == Facing.BACK) {
                    cvMainCamera.setFacing(Facing.FRONT);
                    ivSwitchCamera.setImageResource(R.drawable.backcamera_foreground);
                } else {
                    cvMainCamera.setFacing(Facing.BACK);
                    ivSwitchCamera.setImageResource(R.drawable.frontcamera_foreground);
                }
            }
        });
        ivCaptureFront.setOnClickListener(v -> {
            if (cvMainCamera != null) {

                cvMainCamera.takePicture();
            }
        });
        ivFlash.setOnClickListener(v -> {
            if (cvMainCamera != null) {
                if (cvMainCamera.getFlash() == Flash.OFF) {
                    ivFlash.setImageResource(R.drawable.flashon_foreground);
                    cvMainCamera.setFlash(Flash.ON);
                } else if (cvMainCamera.getFlash() == Flash.ON) {
                    ivFlash.setImageResource(R.drawable.flashauto_foreground);
                    cvMainCamera.setFlash(Flash.AUTO);
                } else if (cvMainCamera.getFlash() == Flash.AUTO) {
                    ivFlash.setImageResource(R.drawable.flashoff_foreground);
                    cvMainCamera.setFlash(Flash.OFF);
                }
            }
        });
    }

    void getResult(File path) {
        try {
            if (camera_new.isburstMode.equalsIgnoreCase("false")) {

                MySharedPreferences prefs = sqlitewraper.getSecureShared("Size");
                MySharedPreferences pref = sqlitewraper.getSecureShared("MyPref");
                pref.putString("photo_path", path.getAbsolutePath());
                String b_write = pref.getString("b_write", "k2");
                int width1 = prefs.getInt("max_width", 0);
                int height1 = prefs.getInt("max_height", 0);

                String max_width = String.valueOf(width1);
                String max_height = String.valueOf(height1);


                Bundle Extras = getIntent().getExtras();
                String width = Extras.getString("width");
                String height = Extras.getString("height");
                String quality = Extras.getString("quality");

                Intent i = new Intent(this, easy_draw_new.class);
                i.putExtra("File", path);
                i.putExtra("b_write", b_write);
                i.putExtra("width", max_width);
                i.putExtra("quality", quality);
                i.putExtra("height", max_height);
                i.putExtra("picclicklat", String.valueOf(deviceLat));
                i.putExtra("picclicklng", String.valueOf(deviceLng));
                i.putExtra("flagdraw", "0");
                i.putExtra("drawflag", "0");
                i.putExtra("cameraview", cvMainCamera.getId());
                i.putExtra("serverwidth", width);
                i.putExtra("serverheight", height);
                i.putExtra("serverheight", height);
                i.putExtra("serverheight", height);
                i.putExtra("canInsert", 1);
                startActivityForResult(i, 101);

            }
        } catch (Exception e) {
            LogUtils.photoLogFile("Exception: " + e.toString(), MakePhotoActivity.class.getSimpleName() + "getresult");
        }

    }

    public int convertDpToPixel(int dp) {
        return (dp * displayMetrics.densityDpi) / DisplayMetrics.DENSITY_DEFAULT;
    }


    private void setupTopTouchListener() {
        onDragTopTouchListener = new OnDragTopTouchListener(btnUpSide, viewRectangleMask, mbView);
        onDragTopTouchListener.setBtnDownSide(btnDownSide);
        onDragTopTouchListener.setBtnEndSide(btnEndSide);
        onDragTopTouchListener.setBtnStartSide(btnStartSide);
        btnUpSide.setOnTouchListener(onDragTopTouchListener);
        onDragDownTouchListener = new OnDragDownTouchListener(btnDownSide, viewRectangleMask, mbView);
        onDragDownTouchListener.setBtnUpSide(btnUpSide);
        onDragDownTouchListener.setBtnEndSide(btnEndSide);
        onDragDownTouchListener.setBtnStartSide(btnStartSide);
        btnDownSide.setOnTouchListener(onDragDownTouchListener);
        onDragStartTouchListener = new OnDragStartTouchListener(btnStartSide, viewRectangleMask, mbView);
        onDragStartTouchListener.setBtnUpSide(btnUpSide);
        onDragStartTouchListener.setBtnEndSide(btnEndSide);
        onDragStartTouchListener.setBtnDownSide(btnDownSide);
        btnStartSide.setOnTouchListener(onDragStartTouchListener);
        onDragEndTouchListener = new OnDragEndTouchListener(btnEndSide, viewRectangleMask, mbView);
        onDragEndTouchListener.setBtnUpSide(btnUpSide);
        onDragEndTouchListener.setBtnStartSide(btnStartSide);
        onDragEndTouchListener.setBtnDownSide(btnDownSide);
        btnEndSide.setOnTouchListener(onDragEndTouchListener);

        onDragTouchListener = new OnDragTouchListener(viewRectangleMask, mbView, new OnDragTouchListener.OnDragActionListener() {
            @Override
            public void onDragStart(View view) {
                btnUpSide.setVisibility(VISIBLE);
                btnDownSide.setVisibility(VISIBLE);
                btnStartSide.setVisibility(VISIBLE);
                btnEndSide.setVisibility(VISIBLE);
            }

            @Override
            public void onDragEnd(View view) {

            }
        });
        onDragTouchListener.setBtnUpSide(btnUpSide);
        onDragTouchListener.setBtnDownSide(btnDownSide);
        onDragTouchListener.setBtnEndSide(btnEndSide);
        onDragTouchListener.setBtnStartSide(btnStartSide);

        viewRectangleMask.setOnTouchListener(onDragTouchListener);
    }


    private void getScreenSize() {
        getWindowManager().getDefaultDisplay().getMetrics(displayMetrics);
    }

    private void getLastKnownLocation() {

        if (ActivityCompat.checkSelfPermission(sqlitewraper.context, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(sqlitewraper.context, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {

            return;
        }
        Location lastLocation = LocationServices.FusedLocationApi.getLastLocation(googleApiClient);
        if (lastLocation != null) {
            deviceLat = lastLocation.getLatitude();
            deviceLng = lastLocation.getLongitude();
            mcvData.setLat(deviceLat);
            mcvData.setLon(deviceLng);
            mcvData.invalidate();
        }
    }

    File imageFile;
    public static int rotation = 0;

    private String getRealSizeOfDisplay() {
        Display display = getWindowManager().getDefaultDisplay();
        Point size = new Point();
        display.getRealSize(size);
        final int height = size.y;
        final int width = size.x;
        Size size1 = new Size(width, height);
        String aspect = "" + size1.getHeight() / size1.getWidth();
        return aspect;
    }

    private void setupCamera() {
        cvMainCamera = findViewById(R.id.cvMainCamera);
        cvMainCamera.setLifecycleOwner(this);
        cvMainCamera.addCameraListener(new CameraListener() {

            @Override
            public void onPictureTaken(@NonNull PictureResult result) {
                rotation = result.getRotation();
                Log.d("onPictureTaken", String.valueOf(result.getSize()));
                result.toFile(imageFile, NewCameraActivity.this);
                cvMainCamera.setVisibility(View.GONE);
                progressBar.setVisibility(VISIBLE);
                acIvImagePreview.setVisibility(VISIBLE);


            }
        });
        cvMainCamera.setUseDeviceOrientation(false);
        Log.d("rectData: ", "setupCamera ");
        if (mbView != null && cvMainCamera != null) {
            mbView.setCvMainCamera(cvMainCamera);
            mbView.invalidate();
        } else {
            Log.d("rectData: ", " Camera null");
        }
        setPictureAndPreviewSize();
    }

    void setPictureAndPreviewSize() {
        cvMainCamera.setPictureSize(source -> {
            List<com.otaliastudios.cameraview.size.Size> selectedSize = new ArrayList<>();
            for (com.otaliastudios.cameraview.size.Size size : source) {
                @SuppressLint("DefaultLocale")
                String aspectRatio = String.format("%.2f", ((float) size.getHeight() / (float) size.getWidth()));
                if (size.getHeight() < 2000)
                    if (aspectRatio.equalsIgnoreCase("1.78")) {
                        selectedSize.add(size);
                    }
            }
            Collections.sort(selectedSize, (o1, o2) -> Integer.compare(o2.getHeight(), o1.getHeight()));
            Log.d("SizeSelector", selectedSize.toString());

            if (!selectedSize.isEmpty())
                return selectedSize;
            else
                return source;
        });
        cvMainCamera.setPreviewStreamSize(source -> {
            List<com.otaliastudios.cameraview.size.Size> selectedSize1 = new ArrayList<>();
            for (com.otaliastudios.cameraview.size.Size size : source) {
                @SuppressLint("DefaultLocale")
                String aspectRatio = String.format("%.2f", ((float) size.getHeight() / (float) size.getWidth()));
                if (size.getHeight() < 2000)
                    if (aspectRatio.equalsIgnoreCase("1.78")) {
                        selectedSize1.add(size);
                    }
            }
            Collections.sort(selectedSize1, (o1, o2) -> Integer.compare(o2.getHeight(), o1.getHeight()));
            Log.d("SizeSelectorPriview", selectedSize1.toString());

            if (!selectedSize1.isEmpty())
                return selectedSize1;
            else
                return source;
        });
    }

    final private List<String> permissionList = new ArrayList<>();
    final private ActivityResultLauncher<String[]> checkPermissions = registerForActivityResult(new ActivityResultContracts.RequestMultiplePermissions(), new ActivityResultCallback<Map<String, Boolean>>() {
        @Override
        public void onActivityResult(Map<String, Boolean> result) {
            permissionList.clear();
            for (String key : result.keySet()) {
                Log.d(TAG, "=> " + key + "  ::=> " + result.get(key));
                if (!result.get(key)) {
                    permissionList.add(key);
                }
            }
            Log.d(TAG, permissionList.toString());

            if (permissionList.size() > 0) {
                checkPermission();
                //   showAlertDialogPermission("You need to allow access before using application.", false);
            } else {
                locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
                if (ActivityCompat.checkSelfPermission(NewCameraActivity.this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(NewCameraActivity.this, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                    return;
                }
                locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER,
                        2,
                        (float) 50.4,
                        NewCameraActivity.this);


                createNewImageFile();
                setupCamera();
            }
        }
    });


    private void createNewImageFile() {
        File sdDir = com.sky.atc.easyformse.utils.AppStorage.pictures();
        File myDir = new File(sdDir, "Easy_form");
        myDir.mkdirs();
        Log.d(TAG, "=> " + myDir.getAbsolutePath());
        String fname = "image_" + System.currentTimeMillis() + ".jpeg";
        imageFile = new File(myDir, fname);
        if (imageFile.exists()) imageFile.delete();
        Log.d(TAG, "=> " + imageFile.getAbsolutePath());
    }

    private void checkPermission() {
        checkPermissions.launch(permissionList.toArray(new String[permissionList.size()]));
    }

    File takenPictureFile;

    @Override
    public void onFileReady(@Nullable File file) {
        progressBar.setVisibility(View.GONE);
        cvMainCamera.setVisibility(View.GONE);
        mcvData.setVisibility(View.GONE);
        rlCameraViews.setVisibility(View.GONE);
        llButtons.setVisibility(VISIBLE);
        Log.d("File Path: ", file.getAbsolutePath());
        Log.d("File Path: ", String.valueOf(acIvImagePreview.getMeasuredHeight()));
        Log.d("File Path: ", String.valueOf(acIvImagePreview.getMeasuredWidth()));

        BitmapFactory.Options options = new BitmapFactory.Options();
        options.inPreferredConfig = Bitmap.Config.ARGB_8888;

        options.outWidth = acIvImagePreview.getMeasuredWidth();
        options.outHeight = acIvImagePreview.getMeasuredHeight();
        Bitmap bitmapPicture = null;
        takenPictureFile = file.getAbsoluteFile();

        bitmapPicture = BitmapFactory.decodeFile(takenPictureFile.getAbsolutePath(), options);

        Matrix matrix = new Matrix();
        matrix.postRotate(rotation);
        Bitmap rotatedBitmap = Bitmap.createBitmap(bitmapPicture, 0, 0,
                bitmapPicture.getWidth(), bitmapPicture.getHeight(), matrix, true);
        if (rotatedBitmap != null)
            acIvImagePreview.setImageBitmap(rotatedBitmap);

        createNewImageFile();
    }

    private File cropImageToRectangle(String filepath, View borderCamera) {

        File finalFile = null;
        try {
            File f = new File(filepath);
            finalFile = f;
            BitmapFactory.Options options = new BitmapFactory.Options();
            options.inPreferredConfig = Bitmap.Config.ARGB_8888;
            Bitmap bitmapPicture = BitmapFactory.decodeStream(new FileInputStream(f), null, options);


            Matrix matrix = new Matrix();
            matrix.postRotate(rotation);
            Bitmap rotatedBitmap = Bitmap.createBitmap(bitmapPicture, 0, 0,
                    bitmapPicture.getWidth(), bitmapPicture.getHeight(), matrix, true);

            //calculate aspect ratio
            float koefX = (float) rotatedBitmap.getWidth() / (float) ((View) borderCamera.getParent()).getWidth();
            float koefY = (float) rotatedBitmap.getHeight() / ((View) borderCamera.getParent()).getHeight();

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
            if (croppedBitmapNew != null) {
                finalFile = saveBitmap(croppedBitmapNew);
            } else {
                LogUtils.photoLogFile("Exception: croppedBitmapNew is null", MakePhotoActivity.class.getSimpleName() + "cropImageToRectangle in try ");
                Log.d("croppedBitmapNew:", "is null");
            }
        } catch (Exception e) {
            LogUtils.photoLogFile("Exception: " + e.toString(), MakePhotoActivity.class.getSimpleName() + "cropImageToRectangle");
        }
        return finalFile;
    }


    private File saveBitmap(Bitmap bmp) throws IOException {
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        bmp.compress(Bitmap.CompressFormat.JPEG, 100, bytes);
        File f = new File(createNewDirectory("Easyform photos"), "cropimage_" + System.currentTimeMillis() + ".jpeg");
        f.createNewFile();
        FileOutputStream fo = new FileOutputStream(f);
        fo.write(bytes.toByteArray());
        fo.close();
        return f;
    }

    public String createNewDirectory(String name) {
        // create a directory before creating a new file inside it.
        File directory = new File(com.sky.atc.easyformse.utils.AppStorage.root(), name);
        if (!directory.exists()) {
            directory.mkdirs();
        }
        return directory.getAbsolutePath();
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        float[] mGravity = new float[event.values.clone().length];
        Float azimut = (float) 0.0; // View to draw a compass
        Float pich = (float) 0.0;
        Float roll = (float) 0.0;
        Double az = 0.0;
        Double pich1 = 0.0;
        Double roll1 = 0.0;
        float[] mGeomagnetic = new float[event.values.clone().length];
        Double mt = (double) 0;
        int flag = 0;
        int j = -1;


        String temp_jason_array;
        int[] degree_id = new int[0];
        try {
            int temp = 0;
            if (temp == 0) {
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

                    } else if ((degree_id[i] - 5 < az && degree_id[i] + 5 > az)
                            && flag == 0) {
                        j = i;
                        flag = 1;

                    } else if (degree_id[i] != -1
                            && mt < 50
                            && flag == 1
                            && !(degree_id[i] - 5 < az && degree_id[i] + 5 > az)
                            && (j == i)) {
                        flag = 0;

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
        txtSi.setTextColor(Color.WHITE);
        txtSi.setText(az_temp.toString() + (char) 0x00B0 + " " + notation);
        Integer mt_temp = (int) Math.ceil(mt);
        txtMGnt.setTextColor(Color.WHITE);
        txtMGnt.setText("MF : " + mt_temp.toString());
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {

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

    double deviceLat;
    double deviceLng;

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
        mcvData.setLat(deviceLat);
        mcvData.setLon(deviceLng);
        mcvData.invalidate();
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

    @Override
    protected void onActivityResult(int requestCode, int resultCode,
                                    Intent intent) {
        super.onActivityResult(requestCode, resultCode, intent);
        MySharedPreferences pref = sqlitewraper.getSecureShared("MyPref");
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
        }
    }

    private boolean checkPermission_camera() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) +
                ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) +
                ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
            // Permission is not granted
            return false;
        }
        return true;
    }

    private void requestPermission() {

        ActivityCompat.requestPermissions(NewCameraActivity.this,
                new String[]{Manifest.permission.CAMERA,Manifest.permission.WRITE_EXTERNAL_STORAGE,Manifest.permission.READ_EXTERNAL_STORAGE},
                PERMISSION_REQUEST_CODE);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String permissions[], int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
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
                            ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {

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
        new AlertDialog.Builder(NewCameraActivity.this)
                .setMessage(message)
                .setPositiveButton("OK", okListener)
                .setCancelable(false)
                .create()
                .show();
    }
}