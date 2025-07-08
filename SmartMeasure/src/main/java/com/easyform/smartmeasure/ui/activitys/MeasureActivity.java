package com.easyform.smartmeasure.ui.activitys;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;


import android.Manifest;
import android.os.Bundle;
import android.util.Log;
import android.view.WindowManager;

import com.easyform.smartmeasure.databinding.ActivityMeasureBinding;
import com.kircherelectronics.fsensor.observer.SensorSubject;
import com.kircherelectronics.fsensor.sensor.FSensor;
import com.kircherelectronics.fsensor.sensor.gyroscope.ComplementaryGyroscopeSensor;
import com.kircherelectronics.fsensor.sensor.gyroscope.GyroscopeSensor;
import com.otaliastudios.cameraview.CameraListener;
import com.otaliastudios.cameraview.FileCallback;
import com.otaliastudios.cameraview.PictureResult;
import com.otaliastudios.cameraview.size.Size;


import java.io.File;
import java.util.ArrayList;
import java.util.Collections;

import java.util.List;
import java.util.Locale;

public class MeasureActivity extends AppCompatActivity implements FileCallback {
    ActivityMeasureBinding activityMeasureBinding;
    final static String TAG = "MeasureActivity";

    private float[] fusedOrientation = new float[3];
    private FSensor fSensor;
    //  Mode.GYROSCOPE_ONLY or Mode.COMPLIMENTARY_FILTER for best result
    // Mode mode = Mode.COMPLIMENTARY_FILTER;
    Mode mode = Mode.GYROSCOPE_ONLY;

    private final SensorSubject.SensorObserver sensorObserver = values -> {
        fusedOrientation = values;
        updateText();
        updateGauges();
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        activityMeasureBinding = ActivityMeasureBinding.inflate(getLayoutInflater());
        setContentView(activityMeasureBinding.getRoot());
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);

        permissionList.add(Manifest.permission.CAMERA);
        permissionList.add(Manifest.permission.RECORD_AUDIO);
        permissionList.add(Manifest.permission.READ_EXTERNAL_STORAGE);
        /*if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        } else {*/
        permissionList.add(Manifest.permission.WRITE_EXTERNAL_STORAGE);
        //}
        checkPermission();
        activityMeasureBinding.acIvClickImage.setOnClickListener(v -> {
            // activityMeasureBinding.cvMainCamera.takePicture();
        });


    }


    @Override
    public void onResume() {
        super.onResume();
        switch (mode) {
            case GYROSCOPE_ONLY:
                fSensor = new GyroscopeSensor(this);
                break;
            case COMPLIMENTARY_FILTER:
                fSensor = new ComplementaryGyroscopeSensor(this);
                ((ComplementaryGyroscopeSensor) fSensor).setFSensorComplimentaryTimeConstant(0.5f);
                break;
        }
        fSensor.register(sensorObserver);
        fSensor.start();
    }

    @Override
    public void onPause() {
        fSensor.unregister(sensorObserver);
        fSensor.stop();
        super.onPause();
    }

    private void updateText() {
        activityMeasureBinding.mtvTlaX.setText(String.format(Locale.getDefault(), "X-Axis: %.1f", fusedOrientation[1]));
        activityMeasureBinding.mtvTlaY.setText(String.format(Locale.getDefault(), "Y-Axis: %.1f", (Math.toDegrees(fusedOrientation[2]) + 360) % 360));
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
            Log.d(TAG, "=> " + key + "  ::=> " + result.get(key));
            if (!result.get(key)) {
                permissionList.add(key);
            }
        }
        Log.d(TAG, permissionList.toString());
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
                Log.d("onPictureTaken", String.valueOf(result.getSize()));
                File folderFile = new File(getCacheDir(), "Demo");
                if (!folderFile.exists()) {
                    if (!folderFile.mkdir()) {
                        return;
                    }
                }
                File imageFile = new File(folderFile, System.currentTimeMillis() + ".jpg");
                Log.e("imageFile : ", String.valueOf(imageFile.canWrite()));
                result.toFile(imageFile, MeasureActivity.this);
            }
        });
        activityMeasureBinding.cvMainCamera.setUseDeviceOrientation(false);

        setPictureAndPreviewSize();
    }

    void setPictureAndPreviewSize() {
        activityMeasureBinding.cvMainCamera.setPictureSize(source -> {
            List<Size> selectedSize = new ArrayList<>();
            for (Size size : source) {
                if (size.getHeight() > 2000)
                    selectedSize.add(size);
            }

            Collections.sort(selectedSize, (o1, o2) -> o2.compareTo(o1));
            Log.d("SizeSelector", selectedSize.toString());

            if (!selectedSize.isEmpty())
                return selectedSize;
            else
                return source;
        });
        activityMeasureBinding.cvMainCamera.setPreviewStreamSize(source -> {
            Collections.sort(source, (o1, o2) -> o2.compareTo(o1));
            return source;
        });
    }

    @Override
    public void onFileReady(@Nullable File file) {
        if (file != null) {
            Log.d("onFileReady : ", file.getAbsolutePath());
        } else {
            Log.e("onFileReady : ", "File is null");
        }
    }

    private enum Mode {
        GYROSCOPE_ONLY,
        COMPLIMENTARY_FILTER,
    }
}