package com.easyform.smartmeasure.ui.activitys;

import androidx.appcompat.app.AppCompatActivity;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.view.WindowManager;

import com.easyform.smartmeasure.R;
import com.easyform.smartmeasure.databinding.ActivityMeasureThreeBinding;
import com.easyform.smartmeasure.models.TriangleData;
import com.easyform.smartmeasure.utils.DialogUtils;
import com.easyform.smartmeasure.utils.PreferencesKey;
import com.easyform.smartmeasure.utils.PreferencesUtil;
import com.easyform.smartmeasure.utils.sensorUtils.HardwareChecker;
import com.easyform.smartmeasure.utils.sensorUtils.SensorChecker;

import java.text.DecimalFormat;
import java.text.NumberFormat;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class MeasureThreeActivity extends AppCompatActivity implements SensorEventListener {
    ActivityMeasureThreeBinding measureThreeBinding = null;
    final static String TAG = "MeasureThreeActivity";
    private float[] fusedOrientation = new float[3];
    private SensorManager mSensorManager;
    private Sensor accelerometer;
    private Sensor magnetometer;
    SharedPreferences mSharedPreferences;
    String mtype;
    List<TriangleData> triangleDataList = new ArrayList<>();
    double base = -3;
    private static final int UPDATE_THRESHOLD = 700;
    private long mLastUpdate;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        measureThreeBinding = ActivityMeasureThreeBinding.inflate(getLayoutInflater());
        setContentView(measureThreeBinding.getRoot());
        mSharedPreferences = PreferencesUtil.getPreferences(this);

        getWindow().addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);

        if (getIntent() != null && getIntent().getExtras() != null) {
            mtype = getIntent().getExtras().getString("mtype", "m");
        }
//        measureThreeBinding.acIvAppSetting.setOnClickListener(v -> {
//            String height = mSharedPreferences.getString(PreferencesKey.heightKey, "1.5");
//            DialogUtils.setHeightDialog(this, height, enteredHeight -> mSharedPreferences.edit().putString(PreferencesKey.heightKey, enteredHeight).apply());
//        });
        mSensorManager = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
        accelerometer = mSensorManager.getDefaultSensor(Sensor.TYPE_GRAVITY);
        SensorChecker checker = new HardwareChecker(mSensorManager);
        String height = mSharedPreferences.getString(PreferencesKey.heightKey, "1.5");
        if (!checker.IsGyroscopeAvailable()) {
            DialogUtils.displayHardwareMissingWarning(this, height1 -> {
                setSuccessMessage(Float.parseFloat(height));
            });
        } else {
            accelerometer = mSensorManager
                    .getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
            magnetometer = mSensorManager
                    .getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD);
        }

    }

    private void setSuccessMessage(float distance) {


    }

    float[] mGravity;
    float[] mGeomagnetic;

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

    private void updateGauges() {


    }

    private void updateText() {

        double xValue = ((Math.toDegrees(fusedOrientation[1]) + 360) % 360);

        if (xValue > 0 && xValue < 90) {
            xValue = 90 - xValue;
        } else if (xValue > 270 && xValue < 360) {
            xValue = 360 - xValue;
            xValue += 90;
        }

        long actualTime = System.currentTimeMillis();

        if (actualTime - mLastUpdate > UPDATE_THRESHOLD) {
            mLastUpdate = actualTime;
            if (mtype.equalsIgnoreCase("azim")) {
                measureThreeBinding.txtZ.setVisibility(View.VISIBLE);

                double zValue = (Math.toDegrees(fusedOrientation[0]) + 360) % 360;

                measureThreeBinding.txtZ.setText(String.format(Locale.getDefault(), "AziMuth: %.0f", (Math.toDegrees(fusedOrientation[0]) + 360) % 360) + "\u00B0");

                tiltCalculate(zValue);
                Log.d("azimuth", String.valueOf(zValue));
            } else if (mtype.equalsIgnoreCase("tilt")) {
                double pi = Math.PI;
                pi = Math.PI / 2;
                double degree = Math.toDegrees(pi);
                xValue = degree - xValue;
                measureThreeBinding.txtX.setVisibility(View.VISIBLE);
                measureThreeBinding.txtX.setText(String.format(Locale.getDefault(), "Tilt: %.0f", xValue) + "\u00B0");

                if (xValue < 0) {
                    measureThreeBinding.txtX.setText(String.format(Locale.getDefault(), "Tilt: %.2f", xValue) + "\u00B0");
                }

                tiltCalculate(xValue);
            }


            Log.d("tilt", String.valueOf(xValue));
        }

    }


    @Override
    public void onBackPressed() {
        super.onBackPressed();
        setErrorMessage();
    }

    private void setErrorMessage() {
        Intent errorIntent = new Intent();
        setResult(RESULT_CANCELED, errorIntent);
        this.finish();
    }

    ///  tilt=90-x
    //aziuth=z axis;
    private void tiltCalculate(double value) {
        measureThreeBinding.done.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {

                if (triangleDataList.size() < 2) {

                    if (mtype.equalsIgnoreCase("tilt")) {
                        double tiltData = value;

                        ResultData(tiltData);
                    } else if (mtype.equalsIgnoreCase("azim")) {
                        double aziMuth = value;
                        ResultData(aziMuth);
                    }
                }
            }
        });


    }

    private void ResultData(double data) {
        Intent successIntent = new Intent();
        successIntent.putExtra("result", data);
        setResult(RESULT_OK, successIntent);
        this.finish();
    }


    private float[] exponentialSmoothing(float[] input, float[] output, float alpha) {

        if (output == null)
            return input;
        for (int i = 0; i < input.length; i++) {
            output[i] = output[i] + alpha * (input[i] - output[i]);
        }
        return output;
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int i) {

    }

    @Override
    protected void onResume() {
        super.onResume();
        if (accelerometer != null && magnetometer != null) {
            mSensorManager.registerListener(this, accelerometer,
                    SensorManager.SENSOR_DELAY_UI);
            mSensorManager.registerListener(this, magnetometer,
                    SensorManager.SENSOR_DELAY_UI);
            mLastUpdate = System.currentTimeMillis();
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        mSensorManager.unregisterListener(this);
    }
}