package com.nareshchocha.facerecognition.ui.activitys;

import android.Manifest;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.Matrix;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.os.StrictMode;
import android.provider.Settings;
import android.util.Log;
import android.util.Pair;
import android.view.Surface;
import android.view.View;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.camera.core.AspectRatio;
import androidx.camera.core.CameraSelector;
import androidx.camera.core.ImageAnalysis;
import androidx.camera.core.ImageCapture;
import androidx.camera.core.ImageCaptureException;
import androidx.camera.core.Preview;
import androidx.camera.lifecycle.ProcessCameraProvider;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.exifinterface.media.ExifInterface;
import androidx.lifecycle.ViewModelProvider;

import com.google.android.material.imageview.ShapeableImageView;
import com.google.android.material.shape.CornerFamily;
import com.google.android.material.shape.ShapeAppearanceModel;
import com.google.common.util.concurrent.ListenableFuture;
import com.nareshchocha.facerecognition.R;
import com.nareshchocha.facerecognition.databinding.ActivityRecognizerGroupFaceBinding;
import com.nareshchocha.facerecognition.utils.AppConstants;
import com.nareshchocha.facerecognition.utils.Utils;
import com.nareshchocha.facerecognition.viewModels.GroupFaceRecognizerViewModel;
import com.nareshchocha.facerecognition.viewModels.viewModelFactorys.FaceRecognizerViewModelFactoryMultipleImage;

import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.io.Writer;
import java.util.ArrayList;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;


public class GroupFaceRecognizerActivity extends AppCompatActivity {

    ActivityRecognizerGroupFaceBinding mActivityRecognizerFaceBinding;
    GroupFaceRecognizerViewModel mFaceRecognizerViewModel;
    CameraSelector cameraSelector;
    Executor executor = Executors.newFixedThreadPool(2);
    private int lensFacing = CameraSelector.LENS_FACING_FRONT;
    ArrayList<String> imageFilePathList;
    ScrollView mScrollViewImage;
    private ImageCapture imageCapture;
    private boolean hasCapturedOnce = false;
    File photoFile;
    int rot = 0;
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);

        StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
        StrictMode.setThreadPolicy(policy);
        mActivityRecognizerFaceBinding = ActivityRecognizerGroupFaceBinding.inflate(getLayoutInflater());
        setContentView(mActivityRecognizerFaceBinding.getRoot());
        String imageFilePath = "";
        if (getIntent().getExtras() != null) {
            // getExternalFilesDir(null).getAbsolutePath() + "/1.jpg"
            Utils.writeLogToFile(this, "FilePath : " + imageFilePath, "getExtras ");
          imageFilePathList = getIntent().getStringArrayListExtra("imageFilePathList");
        }

            if (imageFilePathList != null && !imageFilePathList.isEmpty()) {
                mScrollViewImage = findViewById(R.id.imageScrollView);
                LinearLayout imageContainer = findViewById(R.id.imageContainer);
               // mScrollViewImage.setVisibility(View.VISIBLE);
                for (String path : imageFilePathList) {
                    File imageFile = new File(path);
                    if (imageFile.exists() && AppConstants.isImage(imageFile)) {
                        Bitmap bitmap = AppConstants.getRotateBitmap(path);

                        ShapeableImageView imageView = new ShapeableImageView(this);
                        LinearLayout.LayoutParams layoutParams = new LinearLayout.LayoutParams(210, 230);
                        layoutParams.setMargins(5, 0, 5, 0);
                        imageView.setLayoutParams(layoutParams);

                        imageView.setScaleType(ImageView.ScaleType.CENTER_CROP);
                        ShapeAppearanceModel shapeModel = new ShapeAppearanceModel.Builder()
                                .setAllCorners(CornerFamily.ROUNDED, 20f)  // Set corner type and radius
                                .build();
                        imageView.setShapeAppearanceModel(shapeModel);

                        imageView.setImageBitmap(bitmap);

                        imageContainer.addView(imageView);
                    } else {
                        Log.e("FaceRecognizer", "Invalid image path: " + path);
                    }
                }

                FaceRecognizerViewModelFactoryMultipleImage faceRecognizerViewModelFactory
                        = new FaceRecognizerViewModelFactoryMultipleImage(this, imageFilePathList);
                mFaceRecognizerViewModel = new ViewModelProvider(this, faceRecognizerViewModelFactory).get(GroupFaceRecognizerViewModel.class);
            } else {
                setResultErrorData("No image paths provided.");
            }


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

        mActivityRecognizerFaceBinding.captureFront.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
               // Toast.makeText(GroupFaceRecognizerActivity.this, "click", Toast.LENGTH_SHORT).show();
                capturePhoto();

            }
        });

        mActivityRecognizerFaceBinding.btnrecapture.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {

                mActivityRecognizerFaceBinding.capturedImageView.setVisibility(View.GONE);
                mActivityRecognizerFaceBinding.previewView.setVisibility(View.VISIBLE);
                mActivityRecognizerFaceBinding.captureFront.setVisibility(View.VISIBLE);
                mActivityRecognizerFaceBinding.captureFront.setEnabled(true);
                LinearLayout container = mActivityRecognizerFaceBinding.llFaceDetectionContainer;
                container.removeAllViews();
                hasCapturedOnce = false;
                cameraBind();
                mActivityRecognizerFaceBinding.btnrecapture.setVisibility(View.GONE);
            }
        });

    }

    private void setObserves() {
//        mFaceRecognizerViewModel.getIsLoadingData().observe(this, loading -> {
//            if (loading) {
//                mActivityRecognizerFaceBinding.pbLoader.setVisibility(View.VISIBLE);
//            } else {
//                mActivityRecognizerFaceBinding.pbLoader.setVisibility(View.GONE);
//                permissionCheck();
//            }
//        });

        permissionCheck();
        mActivityRecognizerFaceBinding.pbLoader.setVisibility(View.GONE);
        mFaceRecognizerViewModel.faceDetectionMessage.observe(this, messages -> {

            LinearLayout container = mActivityRecognizerFaceBinding.llFaceDetectionContainer;
            container.removeAllViews();

            boolean allMatched = true;

            for (Pair<Boolean, String> entry : messages) {
                boolean isUnknown = entry.first;
                String msg = entry.second;

                TextView tv = new TextView(this);
                tv.setText(msg);
                tv.setTextSize(16);
                tv.setPadding(5,5,0,5);

                if (isUnknown) {
                    tv.setTextColor(Color.RED);
                    tv.setCompoundDrawablesWithIntrinsicBounds(R.drawable.cross_circle_cancel, 0, 0, 0);
                    allMatched = false;
                } else {
                    tv.setTextColor(Color.GREEN);
                    tv.setCompoundDrawablesWithIntrinsicBounds(R.drawable.check_circle_done, 0, 0, 0);
                }

                container.addView(tv);
            }

            if (allMatched) {
                setResultSucceededData(photoFile);
            } else {
                mActivityRecognizerFaceBinding.btnrecapture.setVisibility(View.VISIBLE);

            }
        });


//        mFaceRecognizerViewModel.faceDetectionMessage.observe(this, messages -> {
//            if (messages != null) {
//                StringBuilder sb = new StringBuilder();
//                for (Pair<Boolean, String> entry : messages) {
//                    boolean isUnknown = entry.first;
//                    String msg = entry.second;
//                    sb.append(msg).append("\n");
//
//                    if (isUnknown) {
//                        mActivityRecognizerFaceBinding.mtvFaceDetectionMessage.setTextColor(Color.RED);
//                        mActivityRecognizerFaceBinding.mtvFaceDetectionMessage.setCompoundDrawablesWithIntrinsicBounds(R.drawable.cross_circle_cancel, 0, 0, 0);
//                    } else {
//                        mActivityRecognizerFaceBinding.mtvFaceDetectionMessage.setTextColor(Color.GREEN);
//                        mActivityRecognizerFaceBinding.mtvFaceDetectionMessage.setCompoundDrawablesWithIntrinsicBounds(R.drawable.check_circle_done, 0, 0, 0);
//                    }
//
//                }
//                mActivityRecognizerFaceBinding.mtvFaceDetectionMessage.setText(sb.toString());
//
//            }
//        });







//        mFaceRecognizerViewModel.messages.observe(this, messages -> {
//            if (messages != null) {
//                for (Boolean key : messages.keySet()) {
//                    mActivityRecognizerFaceBinding.tvFaceRecognizer.setText(messages.get(key));
//                    if (key) {
//                        Toast.makeText(this, messages.get(key), Toast.LENGTH_LONG).show();
//                        setResultErrorData(messages.get(key));
//                        mActivityRecognizerFaceBinding.tvFaceRecognizer.setTextColor(Color.RED);
//                    } else {
//                        mActivityRecognizerFaceBinding.tvFaceRecognizer.setTextColor(Color.GREEN);
//                    }
//                }
//            }
//        });

//        mFaceRecognizerViewModel.messages.observe(this, messages -> {
//            if (messages != null && !messages.isEmpty()) {
//                StringBuilder sb = new StringBuilder();
//                for (int i = 0; i < messages.size(); i++) {
//
//                    String personLabel = "Person " + (i + 1);
//
//                    // Append line
//                    sb.append(personLabel).append("\n");
//                }
//                mActivityRecognizerFaceBinding.mtvFaceDetectionMessage.setText(sb.toString());
//            }
//        });

//        mFaceRecognizerViewModel.detectedFile.observe(this, file -> {
//            if (file != null) {
//                setResultSucceededData(file);
//            }
//        });
    }



    private void setResultSucceededData(File detectionFile) {
        System.out.println("called: " + detectionFile.getAbsolutePath());
        Intent resultIntent = new Intent();
       // resultIntent.putExtra("message", "successfully");
        resultIntent.putExtra("detectionFilePath", detectionFile.getAbsolutePath());
     //   resultIntent.putExtra("detectionFileName", detectionFile.getName());
        setResult(RESULT_OK, resultIntent);
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
        new AlertDialog.Builder(GroupFaceRecognizerActivity.this)
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
                ProcessCameraProvider cameraProvider = ProcessCameraProvider.getInstance(this).get();


                bindPreview(cameraProvider);
            } catch (ExecutionException | InterruptedException e) {
                // No errors need to be handled for this in Future.
                // This should never be reached.
            }
        }, ContextCompat.getMainExecutor(this));
    }



    private void bindPreview(ProcessCameraProvider cameraProvider) {
        mActivityRecognizerFaceBinding.previewView.post(() -> {
            try {
                cameraProvider.unbindAll();
                Toast.makeText(this, "Please hold the phone vertically to capture the group photo.", Toast.LENGTH_LONG).show();
                Preview preview = new Preview.Builder().setTargetAspectRatio(AspectRatio.RATIO_16_9).build();

                cameraSelector = new CameraSelector.Builder()
                        .requireLensFacing(lensFacing)
                        .build();

                imageCapture = new ImageCapture.Builder()
                        .setTargetAspectRatio(AspectRatio.RATIO_16_9)
                        .setTargetRotation(Surface.ROTATION_0)
                        .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
                        .build();



                ImageAnalysis imageAnalysis = new ImageAnalysis.Builder()
                        .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                        .build();

                // ✅ Must set analyzer, otherwise preview may freeze
                imageAnalysis.setAnalyzer(executor, imageProxy -> {
                    imageProxy.close();
                });
                preview.setSurfaceProvider(
                        mActivityRecognizerFaceBinding.previewView.getSurfaceProvider()
                );

                cameraProvider.bindToLifecycle(
                        this, cameraSelector, preview, imageCapture, imageAnalysis
                );
            } catch (Exception e) {
                Log.e("CameraX", "Binding failed: " + e.getMessage());
            }
        });
    }


    @Override
    protected void onDestroy() {
        super.onDestroy();

    }


    private void capturePhoto() {
        if (imageCapture == null || hasCapturedOnce) return;

        hasCapturedOnce = true; // ✅ Prevent future captures


        String dir = Environment.getExternalStorageDirectory() + File.separator + "myDirectory";
        File folder = new File(dir);
        folder.mkdirs();

        String name = "captured_" + System.currentTimeMillis() + ".jpeg";
        photoFile = new File(dir, name);

        ImageCapture.OutputFileOptions outputOptions =
                new ImageCapture.OutputFileOptions.Builder(photoFile).build();

        imageCapture.takePicture(
                outputOptions,
                ContextCompat.getMainExecutor(this),
                new ImageCapture.OnImageSavedCallback() {
                    @Override
                    public void onImageSaved(@NonNull ImageCapture.OutputFileResults outputFileResults) {
                        runOnUiThread(() -> {
                            Bitmap bitmap = BitmapFactory.decodeFile(photoFile.getAbsolutePath());
                            bitmap = imageOreintationValidator(bitmap, photoFile.getAbsolutePath());
                            // ✅ Show captured image
                            mActivityRecognizerFaceBinding.capturedImageView.setVisibility(View.VISIBLE);
                            mActivityRecognizerFaceBinding.capturedImageView.setImageBitmap(bitmap);

                            // ✅ Hide preview to "freeze" camera
                            mActivityRecognizerFaceBinding.previewView.setVisibility(View.GONE);

                            // Disable capture button
                            mActivityRecognizerFaceBinding.captureFront.setEnabled(false);
                            mActivityRecognizerFaceBinding.captureFront.setVisibility(View.GONE);
                            mActivityRecognizerFaceBinding.btnrecapture.setVisibility(View.GONE);
                            // Optional: toast or log
                          //  Toast.makeText(getApplicationContext(), "Capture saved: " + photoFile.getAbsolutePath(), Toast.LENGTH_SHORT).show();

                            // Process image for recognition
                            mFaceRecognizerViewModel.processCapturedImage(bitmap);
                        });
                    }

                    @Override
                    public void onError(@NonNull ImageCaptureException exception) {
                        exception.printStackTrace();
                        Log.e("CaptureError", exception.getMessage());
                        Toast.makeText(getApplicationContext(), "Capture failed: " + exception.getMessage(), Toast.LENGTH_SHORT).show();

                        hasCapturedOnce = false; // ✅ Allow retry if failed
                    }
                }
        );
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

