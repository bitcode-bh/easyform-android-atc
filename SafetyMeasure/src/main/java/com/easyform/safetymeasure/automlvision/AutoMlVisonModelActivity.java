package com.easyform.safetymeasure.automlvision;



import android.Manifest;
import android.annotation.SuppressLint;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.Matrix;
import android.media.ExifInterface;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.StrictMode;
import android.view.View;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.camera.core.CameraSelector;
import androidx.camera.core.ImageCapture;
import androidx.camera.core.ImageCaptureException;
import androidx.camera.core.Preview;
import androidx.camera.lifecycle.ProcessCameraProvider;
import androidx.camera.view.PreviewView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.easyform.safetymrasure.R;
import com.google.common.util.concurrent.ListenableFuture;

import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.io.Writer;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class AutoMlVisonModelActivity extends AppCompatActivity {

    private static final int PERMISSION_REQUEST_CODE = 123;
    private ExecutorService cameraExecutor;

    private TFLiteDetector detector;
    private OverlayView overlayView;
    private PreviewView previewView;
    ImageView mImageView;
    private ImageCapture imageCapture;
    TextView textViewDetectionResults;
    ImageView imageViewCaptured;
    int rot = 0;
    ImageView switchcamera;
    private int lensFacing = CameraSelector.LENS_FACING_BACK;
    @SuppressLint("MissingInflatedId")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
        StrictMode.setThreadPolicy(policy);

        setContentView(R.layout.activity_automl);
//        FrameLayout root = new FrameLayout(this);
//        setContentView(root);

        previewView = findViewById(R.id.previewView);
        overlayView = findViewById(R.id.overlay);
        mImageView = findViewById(R.id.captureFront);
        imageViewCaptured = findViewById(R.id.imageViewCaptured);
        textViewDetectionResults = findViewById(R.id.textViewDetectionResults);
        switchcamera = findViewById(R.id.switchcamera);
        cameraExecutor = Executors.newSingleThreadExecutor();

        // Check for permissions
        if (allPermissionsGranted()) {
            startCamera();
        } else {
            ActivityCompat.requestPermissions(this,
                    new String[]{
                            Manifest.permission.CAMERA,
                            Manifest.permission.WRITE_EXTERNAL_STORAGE,
                            Manifest.permission.READ_EXTERNAL_STORAGE
                    },
                    PERMISSION_REQUEST_CODE);
        }

        // Capture button click
        mImageView.setOnClickListener(view -> captureAndDetect());

        switchcamera.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {


                if (lensFacing == CameraSelector.LENS_FACING_FRONT) {
                    lensFacing = CameraSelector.LENS_FACING_BACK;
                    switchcamera.setImageResource(R.drawable.frontcamera_foreground);
                } else {
                    lensFacing = CameraSelector.LENS_FACING_FRONT;
                    switchcamera.setImageResource(R.drawable.backcamera_foreground);
                }

                startCamera();

            }
        });

        // Load detection model
        try {
            detector = new TFLiteDetector();
            detector.loadModel(getAssets(), "PPE_model.tflite", "autoclasses.txt");
        } catch (Exception e) {
            e.printStackTrace();
            Toast.makeText(this, "Model load failed: " + e.getMessage(), Toast.LENGTH_LONG).show();
        }



        // Camera preview view
//        previewView = new PreviewView(this);
//        // set scale type dynamically (same as app:scaleType="fitCenter")
//        previewView.setScaleType(PreviewView.ScaleType.FIT_CENTER);
//
//// optional: set performance vs. compatibility mode
//        previewView.setImplementationMode(PreviewView.ImplementationMode.PERFORMANCE);
//        root.addView(previewView, new FrameLayout.LayoutParams(
//                ViewGroup.LayoutParams.MATCH_PARENT,
//                ViewGroup.LayoutParams.MATCH_PARENT
//        ));
//
//        // Overlay for drawing detections
//        overlayView = new OverlayView(AutoMlVisonModelActivity.this);
//        root.addView(overlayView, new FrameLayout.LayoutParams(
//                ViewGroup.LayoutParams.MATCH_PARENT,
//                ViewGroup.LayoutParams.MATCH_PARENT
//        ));



        // Permissions
//        if (allPermissionsGranted()) {
//            startCamera();
//        } else {
//            ActivityCompat.requestPermissions(this,
//                    new String[]{Manifest.permission.CAMERA,Manifest.permission.WRITE_EXTERNAL_STORAGE,Manifest.permission.READ_EXTERNAL_STORAGE} ,
//                    PERMISSION_REQUEST_CODE);
//        }
//
//        mImageView.setOnClickListener(new View.OnClickListener() {
//            @Override
//            public void onClick(View view) {
//
//            }
//        });
//
//        // Load model
//        try {
//            detector = new TFLiteDetector();
//            detector.loadModel(getAssets(), "PPE_model.tflite", "autoclasses.txt");
//        } catch (Exception e) {
//            e.printStackTrace();
//            Toast.makeText(this, "Model load failed: " + e.getMessage(), Toast.LENGTH_LONG).show();
//        }
    }



    private void startCamera() {
        ListenableFuture<ProcessCameraProvider> cameraProviderFuture =
                ProcessCameraProvider.getInstance(this);

        cameraProviderFuture.addListener(() -> {
            try {
                ProcessCameraProvider cameraProvider = cameraProviderFuture.get();

                Preview preview = new Preview.Builder().build();
                preview.setSurfaceProvider(previewView.getSurfaceProvider());

                // ImageCapture use case
                imageCapture = new ImageCapture.Builder()
//                        .setTargetResolution(new Size(1280, 720))
                        .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
                        .build();

                CameraSelector cameraSelector ;
                cameraSelector = new CameraSelector.Builder()
                        .requireLensFacing(lensFacing)
                        .build();

                cameraProvider.unbindAll();
                cameraProvider.bindToLifecycle(
                        this,
                        cameraSelector,
                        preview,
                        imageCapture
                );

            } catch (Exception e) {
                e.printStackTrace();
            }
        }, ContextCompat.getMainExecutor(this));
    }

    private void captureAndDetect() {
        if (imageCapture == null) {
            Toast.makeText(this, "Camera not ready", Toast.LENGTH_SHORT).show();
            return;
        }
        File photoFile;
        String dir = Environment.getExternalStorageDirectory() + File.separator + "myDirectory";
        File folder = new File(dir);
        folder.mkdirs();

        String name = "captured_" + System.currentTimeMillis() + ".jpeg";
        photoFile = new File(dir, name);


        ImageCapture.OutputFileOptions outputOptions =
                new ImageCapture.OutputFileOptions.Builder(photoFile).build();

        imageCapture.takePicture(outputOptions, cameraExecutor,
                new ImageCapture.OnImageSavedCallback() {
                    @Override
                    public void onImageSaved(@NonNull ImageCapture.OutputFileResults outputFileResults) {
                        Bitmap bitmap = BitmapFactory.decodeFile(photoFile.getAbsolutePath());
                        bitmap = imageOreintationValidator(bitmap, photoFile.getAbsolutePath());

                        if (bitmap != null) {
                            Bitmap finalBitmap = bitmap;
                            runOnUiThread(() -> {
                                stopCamera();

                                previewView.setVisibility(View.GONE);
                                mImageView.setVisibility(View.GONE);
                                imageViewCaptured.setVisibility(View.VISIBLE);
                                imageViewCaptured.setImageBitmap(finalBitmap);

                                if (detector != null) {
                                    List<DetectionResult> results = detector.runDetection(finalBitmap, 0.35f);
                                    overlayView.setDetections(results, finalBitmap.getWidth(), finalBitmap.getHeight());

                                    if(results != null) {
                                        String label;
                                        float score;
                                        StringBuilder resultText = new StringBuilder();
                                        for (DetectionResult result : results) {
                                            label = result.label;   // Adjust based on your model structure
                                            score = result.score;    // Adjust based on your model structure
                                            resultText.append(String.format(" %s -  %.2f\n", label, score));
                                        }

                                        textViewDetectionResults.setVisibility(View.VISIBLE);
                                        textViewDetectionResults.setTextColor(Color.GREEN);
                                        textViewDetectionResults.setText(resultText.toString().trim());

                                        Handler handler = new Handler();
                                        handler.postDelayed(() -> {
                                            setResultSucceededData(photoFile, results);
                                        }, 2000);
                                    }
                                    else {
                                        Toast.makeText(AutoMlVisonModelActivity.this, "Recapture Image", Toast.LENGTH_SHORT).show();
                                        setResultErrorData("error");
                                    }

                                }
                            });
                        }
                    }

                    @Override
                    public void onError(@NonNull ImageCaptureException exception) {
                        exception.printStackTrace();
                        runOnUiThread(() -> Toast.makeText(getApplicationContext(),
                                "Capture failed: " + exception.getMessage(),
                                Toast.LENGTH_SHORT).show());
                    }
                });
    }

    private void saveBitmapToFile(Bitmap bitmap, File file) {
        try (FileOutputStream out = new FileOutputStream(file)) {
            bitmap.compress(Bitmap.CompressFormat.JPEG, 100, out);
            out.flush();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }


    private void stopCamera() {
        try {
            ProcessCameraProvider cameraProvider = ProcessCameraProvider.getInstance(this).get();
            cameraProvider.unbindAll(); // Stops preview and image capture
            imageCapture = null; // Optional: free memory
        } catch (ExecutionException | InterruptedException e) {
            e.printStackTrace();
        }
    }

    private boolean allPermissionsGranted() {
        return ActivityCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED &&
                ActivityCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED &&
                ActivityCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED;
    }

    @Override
    public void onRequestPermissionsResult(int requestCode,
                                           @NonNull String[] permissions,
                                           @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERMISSION_REQUEST_CODE) {
            if (allPermissionsGranted()) {
                startCamera();
            } else {
                Toast.makeText(this, "Camera permission required", Toast.LENGTH_SHORT).show();
                finish();
            }
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (cameraExecutor != null) {
            cameraExecutor.shutdown();
        }

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

    private void setResultSucceededData(File detectionFile, List<DetectionResult> results) {
        try{
            System.out.println("called: " + detectionFile.getAbsolutePath());
            JSONObject output = new JSONObject();
            Intent resultIntent = new Intent();

            for (DetectionResult result : results) {
              String  label = result.label;   // Adjust based on your model structure
              float  score = result.score;    // Adjust based on your model structure
              String formattedScore = String.format("%.2f", score);

                if(label.equalsIgnoreCase("Helmet"))
                {
                    output.put("Helmet",formattedScore);
                }
                if (label.equalsIgnoreCase("harness jacket"))
                {
                    output.put("Harnessjacket",formattedScore);
                }
                if(label.equalsIgnoreCase("reflective jacket"))
                {
                    output.put("Reflectivejacket",formattedScore);
                }
                if(label.equalsIgnoreCase("safety shoes"))
                {
                    output.put("Safetyshoes",formattedScore);
                }
                if(label.equalsIgnoreCase("hand glows"))
                {
                    output.put("Handglows",formattedScore);
                }
            }



           // resultIntent.putExtra("detectionFilePath", detectionFile.getAbsolutePath());
            output.put("photo_path",detectionFile.getAbsolutePath());
            List<JSONObject> finalOutput = new ArrayList<>();
            finalOutput.add(output);
            resultIntent.putExtra("value", finalOutput.toString());
            setResult(RESULT_OK, resultIntent);
            finish();
        }
        catch (Exception e)
        {

        }

    }

    private void setResultErrorData(String errorMessage) {
        Intent resultIntent = new Intent();
        resultIntent.putExtra("message", errorMessage);
        setResult(RESULT_CANCELED, resultIntent);
        finish();
    }

    @Override
    public void onBackPressed() {
        setResultErrorData("error");
        super.onBackPressed();
    }


    //    private long lastSavedTime = 0;
//    private final long SAVE_INTERVAL_MS = 5000; // Save at most every 5 seconds
//
//    private void saveImageOnce(Bitmap bitmap) {
//        long currentTime = System.currentTimeMillis();
//        if (currentTime - lastSavedTime >= SAVE_INTERVAL_MS) {
//            saveBitmapToGallery(bitmap);
//            lastSavedTime = currentTime;
//        }
//    }
//
//    private void saveBitmapToGallery(Bitmap bitmap) {
//        String displayName = "detected_" + System.currentTimeMillis() + ".jpg";
//        ContentValues values = new ContentValues();
//        values.put(MediaStore.Images.Media.DISPLAY_NAME, displayName);
//        values.put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg");
//        values.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/Detections");
//
//        Uri uri = getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values);
//
//        try (OutputStream out = getContentResolver().openOutputStream(uri)) {
//            bitmap.compress(Bitmap.CompressFormat.JPEG, 90, out);
//            Log.d("ImageSave", "Image saved: " + displayName);
//        } catch (IOException e) {
//            Log.e("ImageSave", "Failed to save image", e);
//        }
//    }
//
//    private Bitmap drawDetectionsOnBitmap(Bitmap bitmap, List<DetectionResult> results) {
//        Bitmap mutableBitmap = bitmap.copy(Bitmap.Config.ARGB_8888, true);
//        Canvas canvas = new Canvas(mutableBitmap);
//        Paint boxPaint = new Paint();
//        boxPaint.setColor(Color.RED);
//        boxPaint.setStyle(Paint.Style.STROKE);
//        boxPaint.setStrokeWidth(4f);
//
//        Paint textPaint = new Paint();
//        textPaint.setColor(Color.WHITE);
//        textPaint.setTextSize(36f);
//        textPaint.setTypeface(Typeface.create(Typeface.DEFAULT, Typeface.BOLD));
//
//        for (DetectionResult result : results) {
//            RectF box = result.bbox;
//            String label = result.label;
//            float score = result.score;
//
//            canvas.drawRect(box, boxPaint);
//            canvas.drawText(label + " " + String.format("%.2f", score), box.left, box.top - 10, textPaint);
//        }
//
//        return mutableBitmap;
//    }





}
