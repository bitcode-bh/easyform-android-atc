package com.nareshchocha.facerecognition.ui.activitys;

import android.Manifest;

import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.os.StrictMode;
import android.provider.Settings;
import android.util.Log;
import android.util.Size;
import android.view.View;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.camera.core.CameraSelector;
import androidx.camera.core.ImageAnalysis;
import androidx.camera.core.Preview;
import androidx.camera.lifecycle.ProcessCameraProvider;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.lifecycle.LifecycleOwner;
import androidx.lifecycle.ViewModelProvider;

import com.nareshchocha.facerecognition.R;
import com.nareshchocha.facerecognition.databinding.ActivityRecognizerFaceBinding;
import com.nareshchocha.facerecognition.utils.AppConstants;
import com.nareshchocha.facerecognition.utils.Utils;
import com.nareshchocha.facerecognition.viewModels.FaceRecognizerViewModel;
import com.nareshchocha.facerecognition.viewModels.viewModelFactorys.FaceRecognizerViewModelFactory;

import com.google.common.util.concurrent.ListenableFuture;

import java.io.File;
import java.util.ArrayList;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;


public class FaceRecognizerActivity extends AppCompatActivity {

    ActivityRecognizerFaceBinding mActivityRecognizerFaceBinding;
    FaceRecognizerViewModel mFaceRecognizerViewModel;
    CameraSelector cameraSelector;
    Executor executor = Executors.newFixedThreadPool(2);
    private int lensFacing = CameraSelector.LENS_FACING_FRONT;
    String Is2FA = "";
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
        StrictMode.setThreadPolicy(policy);
        mActivityRecognizerFaceBinding = ActivityRecognizerFaceBinding.inflate(getLayoutInflater());
        setContentView(mActivityRecognizerFaceBinding.getRoot());
        String imageFilePath = "";

        if (getIntent().getExtras() != null) {
            // getExternalFilesDir(null).getAbsolutePath() + "/1.jpg"
            imageFilePath = getIntent().getExtras().getString("imageFilePathKey", "");
            Utils.writeLogToFile(this, "FilePath : " + imageFilePath, "getExtras ");
            Is2FA = getIntent().getExtras().getString("Is2FA","false");
        }
        if (!imageFilePath.isEmpty()) {
            if ((new File(imageFilePath)).exists()) {
                if (!AppConstants.isImage((new File(imageFilePath)))) {
                    setResultErrorData("File is not a Image, please check provided file!");
                } else {
                    mActivityRecognizerFaceBinding.acIvFileImage.setImageBitmap(AppConstants.getRotateBitmap(imageFilePath));
                }
            } else {
                setResultErrorData("File is not exists, please check provided file path!");
            }
        } else {
            setResultErrorData("imagePath is empty please provide an image file path!");
        }
        FaceRecognizerViewModelFactory faceRecognizerViewModelFactory
                = new FaceRecognizerViewModelFactory(this, imageFilePath);

        mFaceRecognizerViewModel = new ViewModelProvider(this, faceRecognizerViewModelFactory).get(FaceRecognizerViewModel.class);
        try{
            setObserves();
        }
        catch (Exception e)
        {
            Log.d("Exception",e.toString());
        }

        mActivityRecognizerFaceBinding.btnSwitchCamera.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {

                if (lensFacing == CameraSelector.LENS_FACING_FRONT) {
                    lensFacing = CameraSelector.LENS_FACING_BACK;
                    mActivityRecognizerFaceBinding.btnSwitchCamera.setImageResource(R.drawable.frontcamera_foreground);
                } else {
                    lensFacing = CameraSelector.LENS_FACING_FRONT;
                    mActivityRecognizerFaceBinding.btnSwitchCamera.setImageResource(R.drawable.backcamera_foreground);
                }

                cameraBind();

            }
        });

    }

    private void setObserves() {
        mFaceRecognizerViewModel.getIsLoadingData().observe(this, loading -> {
            if (loading) {
                mActivityRecognizerFaceBinding.pbLoader.setVisibility(View.VISIBLE);
            } else {
                mActivityRecognizerFaceBinding.pbLoader.setVisibility(View.GONE);
                permissionCheck();
            }
        });

        mFaceRecognizerViewModel.faceDetectionMessage.observe(this, messages -> {
            if (messages != null) {
                for (Boolean key : messages.keySet()) {
                    mActivityRecognizerFaceBinding.mtvFaceDetectionMessage.setText(messages.get(key));
                    if (key) {
                        mActivityRecognizerFaceBinding.mtvFaceDetectionMessage.setTextColor(Color.RED);
                        mActivityRecognizerFaceBinding.mtvFaceDetectionMessage.setCompoundDrawablesWithIntrinsicBounds(R.drawable.cross_circle_cancel, 0, 0, 0);
                    } else {
                        mActivityRecognizerFaceBinding.mtvFaceDetectionMessage.setTextColor(Color.GREEN);
                        mActivityRecognizerFaceBinding.mtvFaceDetectionMessage.setCompoundDrawablesWithIntrinsicBounds(R.drawable.check_circle_done, 0, 0, 0);
                    }
                }
            }
        });

        // as per discuss with sir open and close eyes detection code remove 24-05-2024
//        mFaceRecognizerViewModel.eyeOpenMessage.observe(this, messages -> {
//            if (messages != null) {
//                for (Boolean key : messages.keySet()) {
//                    mActivityRecognizerFaceBinding.mtvEyeOpenMessage.setText(messages.get(key));
//                    if (key) {
//                        mActivityRecognizerFaceBinding.mtvEyeOpenMessage.setTextColor(Color.RED);
//                        mActivityRecognizerFaceBinding.mtvEyeOpenMessage.setCompoundDrawablesWithIntrinsicBounds(R.drawable.cross_circle_cancel, 0, 0, 0);
//                    } else {
//                        mActivityRecognizerFaceBinding.mtvEyeOpenMessage.setTextColor(Color.GREEN);
//                        mActivityRecognizerFaceBinding.mtvEyeOpenMessage.setCompoundDrawablesWithIntrinsicBounds(R.drawable.check_circle_done, 0, 0, 0);
//                    }
//                }
//            }
//        });
//        mFaceRecognizerViewModel.eyeCloseMessage.observe(this, messages -> {
//            if (messages != null) {
//                for (Boolean key : messages.keySet()) {
//                    mActivityRecognizerFaceBinding.mtvEyeCloseMessage.setText(messages.get(key));
//                    if (key) {
//                        mActivityRecognizerFaceBinding.mtvEyeCloseMessage.setTextColor(Color.RED);
//                        mActivityRecognizerFaceBinding.mtvEyeCloseMessage.setCompoundDrawablesWithIntrinsicBounds(R.drawable.cross_circle_cancel, 0, 0, 0);
//                    } else {
//                        mActivityRecognizerFaceBinding.mtvEyeCloseMessage.setTextColor(Color.GREEN);
//                        mActivityRecognizerFaceBinding.mtvEyeCloseMessage.setCompoundDrawablesWithIntrinsicBounds(R.drawable.check_circle_done, 0, 0, 0);
//                    }
//                }
//            }
//        });
        mFaceRecognizerViewModel.messages.observe(this, messages -> {
            if (messages != null) {
                for (Boolean key : messages.keySet()) {
                    mActivityRecognizerFaceBinding.tvFaceRecognizer.setText(messages.get(key));
                    if (key) {
                        Toast.makeText(this, messages.get(key), Toast.LENGTH_LONG).show();
                        setResultErrorData(messages.get(key));
                        mActivityRecognizerFaceBinding.tvFaceRecognizer.setTextColor(Color.RED);
                    } else {
                        mActivityRecognizerFaceBinding.tvFaceRecognizer.setTextColor(Color.GREEN);
                    }
                }
            }
        });
        mFaceRecognizerViewModel.detectedFile.observe(this, file -> {
            if (file == null) {
                // 2FA case (no file saved)
                if (Is2FA.equalsIgnoreCase("true")) {
                    TwoFASendOnlySuccess();
                }
                return;
            }

            setResultSucceededData(file);

        });
    }

    private void setResultSucceededData(File detectionFile) {
        System.out.println("called: " + detectionFile.getAbsolutePath());
        Intent resultIntent = new Intent();
        resultIntent.putExtra("message", "successfully");
        resultIntent.putExtra("detectionFilePath", detectionFile.getAbsolutePath());
        resultIntent.putExtra("detectionFileName", detectionFile.getName());
        setResult(RESULT_OK, resultIntent);
        finish();
    }

    private void TwoFASendOnlySuccess()
    {
        Intent resultintent = new Intent();
        setResult(RESULT_OK, resultintent);
        finish();
    }

    private void setResultErrorData(String errorMessage) {
        Intent resultIntent = new Intent();
        resultIntent.putExtra("message", errorMessage);
        setResult(RESULT_CANCELED, resultIntent);
        finish();
    }

    ArrayList<String> permissionList = new ArrayList<>();

    void createPermissionList() {

        permissionList.add(Manifest.permission.WRITE_EXTERNAL_STORAGE);
        permissionList.add(Manifest.permission.READ_EXTERNAL_STORAGE);
        permissionList.add(Manifest.permission.CAMERA);
        permissionList.add(Manifest.permission.INTERNET);
    }

    void permissionCheck() {
        if (permissionList.size() > 0) {
            if (!checkSelfPermission(permissionList)) {
                ActivityCompat.requestPermissions(this,
                        permissionList.toArray(new String[0]),
                        4812);

            } else {
                cameraBind();
            }
        } else {
            createPermissionList();
            permissionCheck();
        }
    }

    boolean checkSelfPermission(@NonNull ArrayList<String> permissionList) {
        boolean permissionGranted = true;
        for (int n = 0; n < permissionList.size(); n++) {
            permissionGranted = (ContextCompat.checkSelfPermission(this, permissionList.get(n)) == PackageManager.PERMISSION_GRANTED);
            if (!permissionGranted) {
                break;
            }
        }
        return permissionGranted;
    }

    @Override
    public void onRequestPermissionsResult(int requestCode,
                                           @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == 4812) {// If request is cancelled, the result arrays are empty.
            if (grantResults.length > 0 && grantPermissionsResults(grantResults)) {
                cameraBind();
            } else {
                if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) +
                        ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) +
                        ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED)  {

                    showMessageOKCancel("You need to allow access camera & file and media permissions",
                            new DialogInterface.OnClickListener() {
                                @Override
                                public void onClick(DialogInterface dialog, int which) {
                                    Intent intent = new Intent();
                                    intent.setAction(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                                    intent.setData(Uri.fromParts("package", getPackageName(), null));
                                    startActivity(intent);
                                    finish();
                                }
                            });

                }
            }
        }
    }
    private void showMessageOKCancel(String message, DialogInterface.OnClickListener okListener) {
        new AlertDialog.Builder(FaceRecognizerActivity.this)
                .setMessage(message)
                .setPositiveButton("OK", okListener)
                .setCancelable(false)
                .create()
                .show();
    }
    boolean grantPermissionsResults(int[] grantResults) {
        boolean grantPermissions = true;
        for (int grantResult : grantResults) {
            grantPermissions = (grantResult == PackageManager.PERMISSION_GRANTED);
            if (!grantPermissions) {
                break;
            }
        }
        return grantPermissions;
    }

    private void cameraBind() {
        ListenableFuture<ProcessCameraProvider> cameraProviderFuture = ProcessCameraProvider.getInstance(this);

        cameraProviderFuture.addListener(() -> {
            try {
                ProcessCameraProvider cameraProvider = cameraProviderFuture.get();

                bindPreview(cameraProvider);
            } catch (ExecutionException | InterruptedException e) {
                // No errors need to be handled for this in Future.
                // This should never be reached.
            }
        }, ContextCompat.getMainExecutor(this));
    }



    void bindPreview(@NonNull ProcessCameraProvider cameraProvider) {
        try{
            cameraProvider.unbindAll();

            Preview preview = new Preview.Builder()
                    .build();

            cameraSelector = new CameraSelector.Builder()
                    .requireLensFacing(lensFacing)
                    .build();
            preview.setSurfaceProvider(mActivityRecognizerFaceBinding.previewView.getSurfaceProvider());
            ImageAnalysis imageAnalysis =
                    new ImageAnalysis.Builder()
                            .setTargetResolution(new Size(1080, 1920))
                            .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST) //Latest frame is shown
                            .build();
            mFaceRecognizerViewModel.startRecognizeImageSave(2000);

            imageAnalysis.setAnalyzer(executor, imageProxy -> mFaceRecognizerViewModel.recognizeImageFromCamera(imageProxy, Is2FA));
            cameraProvider.bindToLifecycle(this, cameraSelector, imageAnalysis, preview);
        }
        catch (Exception e)
        {
            //Log.d("exception",e.toString());
        }

    }

    @Override
    protected void onDestroy() {
        super.onDestroy();

    }
}

