package com.easyform.smartmeasure.ui.activitys;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.Typeface;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Bundle;
import android.os.Environment;
import android.util.Log;
import android.view.View;
import android.view.WindowManager;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.exifinterface.media.ExifInterface;

import com.easyform.smartmeasure.R;
import com.easyform.smartmeasure.databinding.ActivityMeasureBinding;
import com.easyform.smartmeasure.models.TriangleData;
import com.easyform.smartmeasure.utils.DialogUtils;
import com.easyform.smartmeasure.utils.sensorUtils.HardwareChecker;
import com.easyform.smartmeasure.utils.PreferencesKey;
import com.easyform.smartmeasure.utils.PreferencesUtil;
import com.easyform.smartmeasure.utils.sensorUtils.SensorChecker;
import com.easyform.smartmeasure.utils.TriangleConstants;
import com.otaliastudios.cameraview.CameraListener;
import com.otaliastudios.cameraview.FileCallback;
import com.otaliastudios.cameraview.PictureResult;
import com.otaliastudios.cameraview.size.Size;
import com.otaliastudios.cameraview.size.SizeSelector;
import com.squareup.picasso.Picasso;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.io.Writer;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import android.os.Handler;
import android.os.Looper;


public class MeasureTwoActivity extends AppCompatActivity implements FileCallback, SensorEventListener {
    ActivityMeasureBinding activityMeasureBinding;
    final static String TAG = "MeasureTwoActivity";

    private float[] fusedOrientation = new float[3];
    private SensorManager mSensorManager;
    private Sensor accelerometer;
    private Sensor magnetometer;
    List<TriangleData> triangleDataList = new ArrayList<>();
    double base = -3;
    SharedPreferences mSharedPreferences;
    private String mtype = "m";
    int rot = 0;
    String photopath;
    Runnable mRunnable;
    private Handler mhandler;
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        activityMeasureBinding = ActivityMeasureBinding.inflate(getLayoutInflater());
        setContentView(activityMeasureBinding.getRoot());
        mSharedPreferences = PreferencesUtil.getPreferences(this);

        if (getIntent() != null && getIntent().getExtras() != null) {
            mtype = getIntent().getExtras().getString("mtype", "m");
        }

        //getWindow().addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
        getWindow().setStatusBarColor(this.getResources().getColor(R.color.cardview_dark_background));

        permissionList.add(Manifest.permission.CAMERA);
        permissionList.add(Manifest.permission.RECORD_AUDIO);
        permissionList.add(Manifest.permission.READ_EXTERNAL_STORAGE);
        permissionList.add(Manifest.permission.WRITE_EXTERNAL_STORAGE);
        mSensorManager = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
        checkPermission();
        activityMeasureBinding.acIvClickImage.setOnClickListener(v -> {
            if (triangleDataList.size() < 2) {
                activityMeasureBinding.cpIndicator.setVisibility(View.VISIBLE);
                activityMeasureBinding.cvMainCamera.takePicture();
            }
        });
        activityMeasureBinding.acIvAppSetting.setOnClickListener(v -> {
            String height = mSharedPreferences.getString(PreferencesKey.heightKey, "1.5");
            DialogUtils.setHeightDialog(this, height, enteredHeight -> mSharedPreferences.edit().putString(PreferencesKey.heightKey, enteredHeight).apply());

        });
        SensorChecker checker = new HardwareChecker(mSensorManager);
        if (!checker.IsGyroscopeAvailable()) {
            DialogUtils.displayHardwareMissingWarning(this, height -> {
                setSuccessMessage(height ,"");
            });
        } else {
            accelerometer = mSensorManager
                    .getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
            magnetometer = mSensorManager
                    .getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD);
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        if (accelerometer != null && magnetometer != null) {
            mSensorManager.registerListener(this, accelerometer,
                    SensorManager.SENSOR_DELAY_UI);
            mSensorManager.registerListener(this, magnetometer,
                    SensorManager.SENSOR_DELAY_UI);
        }
    }

    @Override
    public void onPause() {
        mSensorManager.unregisterListener(this);
        super.onPause();
    }

    private void updateText() {
        double xValue = ((Math.toDegrees(fusedOrientation[1]) + 360) % 360);
        if (xValue > 0 && xValue < 90) {
            xValue = 90 - xValue;
        } else if (xValue > 270 && xValue < 360) {
            xValue = 360 - xValue;
            xValue += 90;
        }
        activityMeasureBinding.mtvTlaX.setText(String.format(Locale.getDefault(), "X-Axis: %.1f", xValue));


        activityMeasureBinding.mtvTlaY.setText(String.format(Locale.getDefault(), "Y-Axis: %.1f", ((Math.toDegrees(fusedOrientation[2]) + 360) % 360)));
        activityMeasureBinding.mtvTlaZ.setText(String.format(Locale.getDefault(), "Z-Axis: %.1f", (Math.toDegrees(fusedOrientation[0]) + 360) % 360));
    }

    private void updateGauges() {
        activityMeasureBinding.gaugeBearingCalibrated.updateBearing(fusedOrientation[0]);
        activityMeasureBinding.gaugeTiltCalibrated.updateRotation(fusedOrientation[1], fusedOrientation[2]);
    }


    private void checkPermission() {
        checkPermissions.launch(permissionList.toArray(new String[0]));
    }


    final private List<String> permissionList = new ArrayList<>();
    final private ActivityResultLauncher<String[]> checkPermissions = registerForActivityResult(new ActivityResultContracts.RequestMultiplePermissions(), result -> {
        permissionList.clear();
        for (String key : result.keySet()) {
            // Log.d(TAG, "=> " + key + "  ::=> " + result.get(key));
            if (!result.get(key)) {
                permissionList.add(key);
            }
        }
        if (permissionList.size() > 0) {
            checkPermission();
        } else {
            setupCamera();
        }
    });

    private void setupCamera() {
        activityMeasureBinding.cvMainCamera.setLifecycleOwner(this);
        activityMeasureBinding.cvMainCamera.addCameraListener(new CameraListener() {
            @Override
            public void onPictureTaken(@NonNull PictureResult result) {
                File folderFile = new File(getCacheDir(), "SmartMeasure");
                if (!folderFile.exists()) {
                    if (!folderFile.mkdir()) {
                        return;
                    }
                }
                File imageFile = new File(folderFile, System.currentTimeMillis() + ".jpg");
                if (triangleDataList.size() < 2) {
                    double xValue = ((Math.toDegrees(fusedOrientation[1]) + 360) % 360);
                    if (xValue > 0 && xValue < 90) {
                        xValue = 90 - xValue;
                    } else if (xValue > 270 && xValue < 360) {
                        xValue = 360 - xValue;
                        xValue += 90;
                    }
                    triangleDataList.add(new TriangleData(xValue, imageFile.getAbsolutePath()));
                }
                result.toFile(imageFile, MeasureTwoActivity.this);
            }
        });
        activityMeasureBinding.cvMainCamera.setUseDeviceOrientation(false);
        setPictureAndPreviewSize();
    }

    void setPictureAndPreviewSize() {
        activityMeasureBinding.cvMainCamera.setPictureSize(source -> {
            List<Size> selectedSize = new ArrayList<>();
            for (Size size : source) {
                // if (size.getHeight() > 2000)
                if (size.getHeight() < 2000)
                    selectedSize.add(size);
            }
            Collections.sort(selectedSize, (o1, o2) -> o2.compareTo(o1));
            Log.d("SizeSelector", selectedSize.toString());

            if (!selectedSize.isEmpty())
                return selectedSize;
            else
                return source;
        });
        activityMeasureBinding.cvMainCamera.setPreviewStreamSize(new SizeSelector() {
            @Override
            public List<Size> select(List<Size> source) {
                // Receives a list of available sizes.
                // Must return a list of acceptable sizes.
                Collections.sort(source, (o1, o2) -> o2.compareTo(o1));
                return source;
            }
        });
    }


    float[] mGravity;
    float[] mGeomagnetic;

    private float[] exponentialSmoothing(float[] input, float[] output,
                                         float alpha) {
        if (output == null)
            return input;
        for (int i = 0; i < input.length; i++) {
            output[i] = output[i] + alpha * (input[i] - output[i]);
        }
        return output;
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() == Sensor.TYPE_ACCELEROMETER) {
            mGravity = exponentialSmoothing(event.values.clone(), mGravity,
                    0.2f);
        }
        if (event.sensor.getType() == Sensor.TYPE_MAGNETIC_FIELD) {
            try {
                mGeomagnetic = exponentialSmoothing(event.values.clone(),
                        mGeomagnetic, 0.4f);
            } catch (Exception e) {
                Log.e(TAG, e.toString());
            }
        }
        if (mGravity != null && mGeomagnetic != null) {
            float[] R = new float[9];
            float[] I = new float[9];
            float[] R1 = new float[9];
            boolean success = SensorManager.getRotationMatrix(R, I, mGravity,
                    mGeomagnetic);
            if (success) {
                float[] orientation = new float[3];
                SensorManager.remapCoordinateSystem(R, SensorManager.AXIS_X,
                        SensorManager.AXIS_Z, R1);
                SensorManager.getOrientation(R1, orientation);
                fusedOrientation = orientation;
                updateText();
                updateGauges();
            }
        }

    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {

    }


    @SuppressLint("WrongThread")
    @Override
    public void onFileReady(@Nullable File file) {
        activityMeasureBinding.cpIndicator.setVisibility(View.GONE);
        if (file != null) {
            if (!triangleDataList.isEmpty()) {
                if (triangleDataList.size() == 1) {
                    Picasso.with(this)
                            .load(new File(triangleDataList.get(0).getFilePath()))
                            .into(activityMeasureBinding.sIvStartImage);
                    if (triangleDataList.get(0).getTriangleX() < 90f) {
                        base = TriangleConstants.getBase(Double.parseDouble(mSharedPreferences.getString(PreferencesKey.heightKey, "1.5")),
                                triangleDataList.get(0).getTriangleX());
                        activityMeasureBinding.mtvBaseValue.setText(String.format(Locale.getDefault(), "Base: %.1f", base));
                    }
                }
                if (triangleDataList.size() == 2) {

                    Picasso.with(this)
                            .load(new File(triangleDataList.get(1).getFilePath()))
                            .into(activityMeasureBinding.sIvEndImage);
                    if (base != -3 && triangleDataList.get(1).getTriangleX() > 90f) {
                        double height = TriangleConstants.getHeight(base, triangleDataList.get(1).getTriangleX());
                        height += Double.parseDouble(mSharedPreferences.getString(PreferencesKey.heightKey, "1.5"));

                        // draw text in image height
                        Bitmap bitmap = BitmapFactory.decodeFile(String.valueOf(new File(triangleDataList.get(1).getFilePath())));
                        bitmap = imageOreintationValidator(bitmap, String.valueOf(new File(triangleDataList.get(1).getFilePath())));
                        File mfile = null;
                        if (!Environment.getExternalStorageState().equals(
                                Environment.MEDIA_MOUNTED)) {
                            // handle case of no SDCARD present
                            Toast.makeText(getApplicationContext(),
                                            "Opps ? SD Card Not Present..", Toast.LENGTH_SHORT)
                                    .show();

                        } else {
                            String dir = Environment.getExternalStorageDirectory()
                                    + File.separator + "SmartMeasure";
                            // create folder
                            File folder = new File(dir); // folder name
                            folder.mkdirs();
                            // create file
                            String name = "IMG" + System.currentTimeMillis() + ".jpeg";
                            mfile = new File(dir, name);
                        }

                        try{

                            Canvas cs = new Canvas(bitmap);
                            Paint tPaint = new Paint();
                            tPaint.setTextSize(40);
                            tPaint.setColor(Color.BLACK);
                            tPaint.setTypeface(Typeface.DEFAULT);
                            tPaint.setStyle(Paint.Style.FILL);

                            Paint  backgroundPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
                            backgroundPaint.setColor(Color.WHITE);
                            float padding = 20; // Padding around text

                            Paint.FontMetrics fontMetrics = tPaint.getFontMetrics();
                            float textWidth = tPaint.measureText(String.valueOf(height));
                            float textHeight = fontMetrics.bottom - fontMetrics.top;

                            int towerWidth = bitmap.getWidth(); // Width of the tower
                            int towerHeight = bitmap.getHeight(); // Height of the tower
                            // Calculate the center of the tower
                            float centerX =  (towerWidth / 2f) ;
                            float centerY =  (towerHeight / 2f);

                            // Draw text with background
                            float backgroundPadding = 20;
                            float backgroundLeft = centerX  + 100;
                            float backgroundTop = centerY - (textHeight ) - backgroundPadding;
                            float backgroundRight = centerX + (textWidth ) + 90;
                            float backgroundBottom = centerY +  backgroundPadding;

                            // Draw background
                            cs.drawRect(backgroundLeft, backgroundTop, backgroundRight, backgroundBottom, backgroundPaint);
                            // Draw line
                            Paint  paint = new Paint();
                            paint.setColor(Color.GREEN);
                            paint.setStrokeWidth(5); // Line thickness
                            paint.setStyle(Paint.Style.STROKE);

                            // Calculate the starting point for the line (x, y)
                            float startX = centerX - 20 ; // Start line after text
                            float startY = centerY - fontMetrics.bottom; // Align with the baseline of the text
                            float stopX = backgroundLeft ; // End the line at the right edge of the view
                            float stopY = startY; // Keep the line height same as the text

                            cs.drawLine(startX , startY, stopX, stopY, paint);

                            // Draw circle
                            Paint dotPaint = new Paint();
                            dotPaint.setColor(Color.GREEN);
                            cs.drawCircle(startX, startY, 13, dotPaint);

                            float height1 = tPaint.measureText("yY");
                            height =  BigDecimal.valueOf(Double.parseDouble(String.valueOf(height))).setScale(2, BigDecimal.ROUND_HALF_UP)
                                    .doubleValue();
                            cs.drawText(" Top height: " + String.valueOf(height) + " " + mtype,  centerX + 110, centerY - fontMetrics.bottom, tPaint);

                            FileOutputStream out = new FileOutputStream(mfile.getAbsolutePath());
                            bitmap.compress(Bitmap.CompressFormat.PNG, 100, out);
                            out.flush();
                            out.close();
                            photopath = mfile.getAbsolutePath();
                        }
                        catch (Exception e)
                        {
                            Log.d("Exception",e.toString());
                        }
                       // showResultData(height,photopath);

                            Intent  mIntent = new Intent(this, PhotoPreviewActivity.class);
                            mIntent.putExtra("height",height);
                            mIntent.putExtra("photo_path",photopath);
                            mIntent.putExtra("type",mtype);
                            startActivityForResult(mIntent, 101);

                            Log.e(TAG, "base : " + base + " Height : " + height);


                    }

                    else {

                        mhandler = new Handler(Looper.getMainLooper());
                        mRunnable = new Runnable() {
                            @Override
                            public void run() {
                                Toast.makeText(MeasureTwoActivity.this, "Error while capturing the measurement. Please try again!", Toast.LENGTH_LONG).show();
                                triangleDataList.clear();
                                activityMeasureBinding.sIvEndImage.setImageDrawable(null);
                                activityMeasureBinding.sIvStartImage.setImageDrawable(null);
                            }
                        };
                        mhandler.postDelayed(mRunnable, 1000);
                    }
                }

            } else {
                Log.d("onFileReady : ", file.getAbsolutePath());
            }
        } else {
            Log.e("onFileReady : ", "File is null");
        }
    }
    @Override
    protected void onActivityResult(int requestCode, int resultCode,
                                    Intent intent) {
        super.onActivityResult(requestCode, resultCode, intent);
        if (requestCode == 101) {
            if (resultCode == Activity.RESULT_OK) {

                Bundle bundle = intent.getExtras();
                String height = String.valueOf(bundle.getFloat("distance"));
                String photo_path = bundle.getString("photo_path");
                Intent successIntent = new Intent();
                successIntent.putExtra("distance", height);
                successIntent.putExtra("photo_path",photo_path);
                setResult(RESULT_OK, successIntent);
                finish();

            }
        }
    }
//    private void showResultData(double height,String photopath) {
//        setSuccessMessage(getDistanceByType(height), photopath);
//        /*DialogUtils.displayResultData(this, height, (dialog, which) -> {
//            triangleDataList.clear();
//            base = -3;
//            activityMeasureBinding.sIvStartImage.setImageBitmap(null);
//            activityMeasureBinding.sIvEndImage.setImageBitmap(null);
//            activityMeasureBinding.mtvBaseValue.setText("");
//
//        });*/
//    }

    private float getDistanceByType(double distanceMeters) {

        double distanceCm = ((int) (distanceMeters * 1000)) / 10.0f;
        float floatFeet = (float) ((distanceMeters) * 3.28084);
        double inch = distanceCm * 0.394;

        if (mtype.equalsIgnoreCase("cm")) {
            return (float) distanceCm;
        } else if (mtype.equalsIgnoreCase("ft")) {
            return floatFeet;
        } else if (mtype.equalsIgnoreCase("in")) {
            return (float) inch;
        } else {
            return (float) distanceMeters;
        }
    }

    private void setSuccessMessage(String distance,String photopath) {
        Intent successIntent = new Intent();
        // successIntent.putExtra("isManuallyEnterKey", isManuallyEnter);
        successIntent.putExtra("distance", distance);
        successIntent.putExtra("photo_path",photopath);
        setResult(RESULT_OK, successIntent);
        this.finish();
    }


    private void setErrorMessage() {
        Intent errorIntent = new Intent();
        setResult(RESULT_CANCELED, errorIntent);
        this.finish();
    }

    private Bitmap imageOreintationValidator(Bitmap bitmap, String path) {

        ExifInterface ei;
            try {
                ei = new ExifInterface(path);
                int orientation = ei.getAttributeInt(ExifInterface.TAG_ORIENTATION,
                        ExifInterface.ORIENTATION_NORMAL);
                switch (orientation) {
                    case ExifInterface.ORIENTATION_ROTATE_90:
                        bitmap = rotateImage(bitmap, 90);
                        rot++;
                        break;
                    case ExifInterface.ORIENTATION_ROTATE_180:
                        bitmap = rotateImage(bitmap, 180);
                        rot++;
                        break;
                    case ExifInterface.ORIENTATION_ROTATE_270:
                        bitmap = rotateImage(bitmap, 270);
                        rot++;
                        break;
                }
            } catch (IOException e) {
                e.printStackTrace();
            }

        return bitmap;
    }
    public static Bitmap rotateImage(Bitmap source, float angle) {

        Bitmap retVal = source;


            try {
                Matrix matrix = new Matrix();
                matrix.postRotate(angle);
                retVal = Bitmap.createBitmap(source, 0, 0, source.getWidth(),
                        source.getHeight(), matrix, true);
            } catch (Exception e) {


                final Writer result = new StringWriter();
                final PrintWriter printWriter = new PrintWriter(result);
                //////e.printStackTrac//////e.printWriter);
                String stacktrace = result.toString();
                printWriter.close();
                retVal = source;

            }

        return retVal;

    }
}