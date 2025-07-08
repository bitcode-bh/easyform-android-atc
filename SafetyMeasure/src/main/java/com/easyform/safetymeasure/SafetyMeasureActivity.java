package com.easyform.safetymeasure;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.ImageFormat;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.SurfaceTexture;
import android.graphics.YuvImage;
import android.hardware.camera2.CameraAccessException;
import android.hardware.camera2.CameraCaptureSession;
import android.hardware.camera2.CameraCharacteristics;
import android.hardware.camera2.CameraDevice;
import android.hardware.camera2.CameraManager;
import android.hardware.camera2.CaptureRequest;
import android.hardware.camera2.params.StreamConfigurationMap;
import android.media.ExifInterface;
import android.media.Image;
import android.media.ImageReader;
import android.os.Bundle;

import com.easyform.safetymrasure.R;
import com.google.android.material.snackbar.Snackbar;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;

import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.os.StrictMode;
import android.util.Log;
import android.util.Size;
import android.view.Surface;
import android.view.TextureView;
import android.view.View;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import android.widget.Button;
import android.widget.ImageView;
import android.widget.ProgressBar;
import android.widget.RelativeLayout;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;
import org.tensorflow.lite.Interpreter;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.io.Writer;
import java.nio.ByteBuffer;
import java.nio.MappedByteBuffer;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class SafetyMeasureActivity extends AppCompatActivity {

    private static final int CAMERA_PERMISSION_REQUEST_CODE = 100;
    private RelativeLayout layoutDetect;
    private TextView buttonDetect;
    private TextureView textureViewCamera;
    private ImageView imageViewDetection;
    private CameraDevice cameraDevice;
    private CameraCaptureSession cameraCaptureSession;
    private YOLOModel yoloModel;
    private YOLODetector yoloDetector;
    Bitmap outputImage;
    String photopath;
    public static JSONArray jsonArray = new JSONArray();
    private Handler handler;
    private Runnable detectionRunnable;
    OverlayView overlayView;
    ImageView switchcamera;
    private boolean isFront = true;
    private String cameraId;
    private boolean isDetecting = true;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
        StrictMode.setThreadPolicy(policy);
        setContentView(R.layout.activity_safety);


        layoutDetect = findViewById(R.id.relativeLayout_detect);
        buttonDetect = findViewById(R.id.button_detect);
        textureViewCamera = findViewById(R.id.textureView_camera);
        imageViewDetection = findViewById(R.id.imageView_detection);
        overlayView = findViewById(R.id.overlay_view);
        switchcamera = findViewById(R.id.switchcamera);

        handler = new Handler();
        start();

        buttonDetect.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                isDetecting = false;
                handler.removeCallbacks(detectionRunnable);
                runOnUiThread(() -> {

                    outputImage = captureDetectionBitmap(textureViewCamera, overlayView);
                    if (outputImage != null) {
                        SaveBitmap(); // From previous answer
                    }
                });
            }
        });
        switchcamera.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {

                closeCamera();
                if(isFront)
                {
                    isFront = false;
                    switchcamera.setImageResource(R.drawable.backcamera_foreground);
                }
                else {
                    isFront = true;
                    switchcamera.setImageResource(R.drawable.frontcamera_foreground);
                }

                if (textureViewCamera.isAvailable()) {
                    openCamera(); // Directly open camera if surface is already ready
                } else {
                    textureViewCamera.setSurfaceTextureListener(new TextureView.SurfaceTextureListener() {
                        @Override
                        public void onSurfaceTextureAvailable(@NonNull SurfaceTexture surface, int width, int height) {
                            openCamera();
                        }

                        @Override public void onSurfaceTextureSizeChanged(@NonNull SurfaceTexture surface, int width, int height) {}
                        @Override public boolean onSurfaceTextureDestroyed(@NonNull SurfaceTexture surface) { return true; }
                        @Override public void onSurfaceTextureUpdated(@NonNull SurfaceTexture surface) {}
                    });
                }
            }
        });

    }
    private void closeCamera() {
        if (cameraCaptureSession != null) {
            cameraCaptureSession.close();
            cameraCaptureSession = null;
        }
        if (cameraDevice != null) {
            cameraDevice.close();
            cameraDevice = null;
        }
    }
    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == CAMERA_PERMISSION_REQUEST_CODE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED
                    && grantResults[1] == PackageManager.PERMISSION_GRANTED
                    && grantResults[2] == PackageManager.PERMISSION_GRANTED) {

                start();
            } else {
//                Snackbar.make(findViewById(R.id.button_start), "Camera permission denied!", Snackbar.LENGTH_LONG)
//                        .setAction("Action", null).show();
            }
        }
    }

    void start() {
        if (!checkCameraPermission()) {
            requestCameraPermission();
            return;
        }
        layoutDetect.setVisibility(View.VISIBLE);
        startCameraStream();
        loadModel();

    }

    void startCameraStream() {
        if (!checkCameraPermission()) {
            requestCameraPermission();
            return;
        }

        textureViewCamera.setSurfaceTextureListener(new TextureView.SurfaceTextureListener() {
            @Override
            public void onSurfaceTextureAvailable(@NonNull SurfaceTexture surface, int width, int height) {
                openCamera();
            }

            @Override
            public void onSurfaceTextureSizeChanged(@NonNull SurfaceTexture surface, int width, int height) {

            }

            @Override
            public boolean onSurfaceTextureDestroyed(@NonNull SurfaceTexture surface) {
                return true;
            }

            @Override
            public void onSurfaceTextureUpdated(@NonNull SurfaceTexture surface) {

            }
        });
    }

    void openCamera() {
        if (!checkCameraPermission()) return;

        CameraManager cameraManager = (CameraManager) getSystemService(CAMERA_SERVICE);

        try {
            if(isFront)
            {
                cameraId = cameraManager.getCameraIdList()[1];
            }
            else {
                cameraId = cameraManager.getCameraIdList()[0];
            }

            cameraManager.openCamera(cameraId, new CameraDevice.StateCallback() {
                @Override
                public void onOpened(@NonNull CameraDevice camera) {
                    cameraDevice = camera;
                    createCameraPreviewSession();
                }

                @Override
                public void onDisconnected(@NonNull CameraDevice camera) {
                    camera.close();
                    cameraDevice = null;
                }

                @Override
                public void onError(@NonNull CameraDevice camera, int error) {
                    camera.close();
                    cameraDevice = null;
                }
            }, null);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    void createCameraPreviewSession() {
        imageViewDetection.setVisibility(View.INVISIBLE);
        textureViewCamera.setVisibility(View.VISIBLE);

        try {
            SurfaceTexture surfaceTexture = textureViewCamera.getSurfaceTexture();
            surfaceTexture.setDefaultBufferSize(640, 640);
            Surface surface = new Surface(surfaceTexture);

            final CaptureRequest.Builder captureRequestBuilder = cameraDevice.createCaptureRequest(CameraDevice.TEMPLATE_PREVIEW);
            captureRequestBuilder.addTarget(surface);
            captureRequestBuilder.set(CaptureRequest.CONTROL_AF_MODE, CaptureRequest.CONTROL_AF_MODE_CONTINUOUS_PICTURE);
            captureRequestBuilder.set(CaptureRequest.CONTROL_AE_MODE, CaptureRequest.CONTROL_AE_MODE_ON_AUTO_FLASH);
            cameraDevice.createCaptureSession(Collections.singletonList(surface), new CameraCaptureSession.StateCallback() {
                @Override
                public void onConfigured(@NonNull CameraCaptureSession session) {
                    if (cameraDevice == null) {
                        return;
                    }
                    cameraCaptureSession = session;
                    try {
//                        captureRequestBuilder.set(CaptureRequest.CONTROL_MODE, CaptureRequest.CONTROL_MODE_AUTO);
//                        captureRequestBuilder.set(CaptureRequest.CONTROL_AE_MODE, CaptureRequest.CONTROL_AE_MODE_ON_AUTO_FLASH);
                        cameraCaptureSession.setRepeatingRequest(captureRequestBuilder.build(), null, null);

                        new Handler(Looper.getMainLooper()).postDelayed(() -> {
                            startAutoDetection();  // real time detection like face detection
                        }, 1000);

                    } catch (CameraAccessException e) {
                        e.printStackTrace();
                    }
                }

                @Override
                public void onConfigureFailed(@NonNull CameraCaptureSession session) {

                }
            }, null);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void startAutoDetection() {
        if (!isDetecting) return;

        detectionRunnable = new Runnable() {
            @Override
            public void run() {
                if (textureViewCamera.isAvailable()) {
                    Bitmap bitmap = textureViewCamera.getBitmap();

                    if (bitmap != null) {

                        List<YOLODetection> detections = yoloDetector.detectObjects(bitmap);

                        if (detections.isEmpty()) {
                            overlayView.setDetections(Collections.emptyList());
                            overlayView.invalidate();

                            // Recall after 500ms
                            handler.postDelayed(detectionRunnable, 500);
                        }
                        else {
                            List<YOLODetection> helmets = new ArrayList<>();
                            List<YOLODetection> masks = new ArrayList<>();
                            List<YOLODetection> vests = new ArrayList<>();
                            for (YOLODetection det : detections) {
                                switch (det.classIndex) {
                                    case 1: masks.add(det); break;
                                    case 0: helmets.add(det); break;
                                    case 7: vests.add(det); break;
                                }
                            }

                            // Shared accumulation list
                            List<YOLODetection> accumulated = new ArrayList<>();

                            runOnUiThread(() -> {
                                accumulated.clear();
                                accumulated.addAll(helmets);
                                overlayView.setDetections(new ArrayList<>(accumulated));
                                overlayView.invalidate();

                            });
                            handler.postDelayed(() -> runOnUiThread(() -> {
                                accumulated.addAll(vests);
                                overlayView.setDetections(new ArrayList<>(accumulated));
                                overlayView.invalidate();

                            }), 300);

                            handler.postDelayed(() -> runOnUiThread(() -> {
                                accumulated.addAll(masks);
                                overlayView.setDetections(new ArrayList<>(accumulated));
                                overlayView.invalidate();

                                if(accumulated.size() == 3) {
                                    outputImage = captureDetectionBitmap(textureViewCamera, overlayView);
                                    isDetecting = false;
                                    if (outputImage != null) {
                                        SaveBitmap();
                                    }
                                }
                                else if(accumulated.size() == 2) {
                                    buttonDetect.setVisibility(View.VISIBLE);
                                    buttonDetect.setText("Save");
                                }

                            }), 600);

                            handler.postDelayed(detectionRunnable, 500);
                        }
                    }
                    else {
                        handler.postDelayed(detectionRunnable, 500);
                    }
                }
            }
        };
        handler.postDelayed(detectionRunnable, 1000);
    }

        void loadModel () {
            yoloModel = new YOLOModel(this, Constants.MODEL_PATH, Constants.CLASSES_PATH);
            yoloDetector = new YOLODetector(yoloModel);

//            Snackbar.make(findViewById(R.id.button_detect), "Model loaded", Snackbar.LENGTH_LONG)
//                    .setAction("Action", null).show();
        }

        void requestCameraPermission () {
            ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.CAMERA, Manifest.permission.WRITE_EXTERNAL_STORAGE, Manifest.permission.READ_EXTERNAL_STORAGE}, CAMERA_PERMISSION_REQUEST_CODE);
        }

        boolean checkCameraPermission () {
            return (ActivityCompat.checkSelfPermission(this, Manifest.permission.CAMERA) +
                    ActivityCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) +
                    ActivityCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE)) == PackageManager.PERMISSION_GRANTED;
        }
    void SaveBitmap() {

        try{
            isDetecting = false;
            outputImage = Bitmap.createScaledBitmap(outputImage,outputImage.getWidth(),outputImage.getHeight(), true);

            File mfile = null;
            if (!Environment.getExternalStorageState().equals(
                    Environment.MEDIA_MOUNTED)) {
                // handle case of no SDCARD present
                Toast.makeText(getApplicationContext(),
                                "Opps ? SD Card Not Present..", Toast.LENGTH_SHORT)
                        .show();

            } else {
                String dir = Environment.getExternalStorageDirectory()
                        + File.separator + "SafetyMeasure";
                // create folder
                File folder = new File(dir); // folder name
                folder.mkdirs();
                // create file
                String name = "IMG" + System.currentTimeMillis() + ".jpeg";
                mfile = new File(dir, name);
            }


            FileOutputStream out = new FileOutputStream(mfile.getAbsolutePath());
            outputImage.compress(Bitmap.CompressFormat.PNG, 100, out);
            out.flush();
            out.close();
            photopath = mfile.getAbsolutePath();

            JSONObject output = new JSONObject();
            for (int i = 0; i < jsonArray.length(); i++) {
                JSONObject item = jsonArray.getJSONObject(i);
                String name = item.getString("Name").replaceAll("\\s+", "");
                String confidence = item.getString("confidence");
                output.put(name, confidence);
            }
            output.put("photo_path", photopath.replaceAll("\\+",""));
            List<JSONObject> finalOutput = new ArrayList<>();
            finalOutput.add(output);
            Intent successIntent = new Intent();
            successIntent.putExtra("value", finalOutput.toString());
            Log.d("sucessvalue",finalOutput.toString());
//                successIntent.putExtra("photo_path",photopath);
//            Log.d("JsonArray value",finalOutput.toString());
            jsonArray = new JSONArray();
            setResult(RESULT_OK, successIntent);
            this.finish();
        } catch (Exception e) {
//            Log.d("Exception",e.toString());
        }

    }


    private Bitmap captureDetectionBitmap(TextureView textureView, View overlayView) {
        Bitmap cameraBitmap = textureView.getBitmap();  // Frame from camera
        if (cameraBitmap == null) return null;

        Bitmap finalBitmap = Bitmap.createBitmap(
                cameraBitmap.getWidth(),
                cameraBitmap.getHeight(),
                Bitmap.Config.ARGB_8888
        );

        Canvas canvas = new Canvas(finalBitmap);
        canvas.drawBitmap(cameraBitmap, 0, 0, null); // Draw camera frame
        overlayView.draw(canvas); // Draw bounding boxes from overlay

        return finalBitmap;
    }
    @Override
    public void onBackPressed() {
        super.onBackPressed();
        closeCamera();
        Intent errorIntent = new Intent();
        setResult(RESULT_CANCELED, errorIntent);
        jsonArray = new JSONArray();
        this.finish();
    }
    @Override
    protected void onPause() {
        closeCamera();
        super.onPause();
    }

}