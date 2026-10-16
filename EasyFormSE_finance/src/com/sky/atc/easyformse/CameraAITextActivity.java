package com.sky.atc.easyformse;

import static com.sky.atc.easyformse.sqlitewraper.context;
import static com.sky.atc.easyformse.sqlitewraper.mainactivity;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.ImageDecoder;
import android.graphics.Matrix;
import android.graphics.SurfaceTexture;
import android.hardware.Camera;
import android.hardware.camera2.CameraCaptureSession;
import android.hardware.camera2.CameraCharacteristics;
import android.hardware.camera2.CameraDevice;
import android.hardware.camera2.CameraManager;
import android.hardware.camera2.CameraMetadata;
import android.hardware.camera2.CaptureRequest;
import android.hardware.camera2.params.StreamConfigurationMap;
import android.media.ExifInterface;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.provider.MediaStore;
import android.provider.Settings;
import android.util.Log;
import android.util.Size;
import android.view.OrientationEventListener;
import android.view.Surface;
import android.view.TextureView;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.sky.atc.easyformse.utils.LogUtils;

import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;

public class CameraAITextActivity extends AppCompatActivity {

    private ImageView processingImage;
    private boolean processing, processingFailureShown;
    private Bitmap selectedBitmap;
    String modelname;
    String promttext;
    String photo_path;
    static final int REQUEST_IMAGE_CAPTURE = 1;

    private static final int PERMISSION_REQUEST_CODE = 200;
    static Activity mCameraAITextActivity;
    String AI_type;
    private final int SELECT_PHOTO = 2;
    String quality;
    String width;
    String height;
    String max_file_size;

    private TextureView textureView;
    private CameraDevice cameraDevice;
    private CameraCaptureSession captureSession;
    private CaptureRequest.Builder previewRequestBuilder;
    ImageView CaptureImage,BrowseImage,switchcamera;
    FrameLayout mFrameLayout;
    private boolean isFrontCamera = false;
    private boolean mirrorSelected = true;
    private com.sky.atc.easyformse.camera.MirrorControl mirrorControl;
    FrameLayout loadingOverlay;
    private int currentDeviceAngle = 0;
    private OrientationEventListener orientationEventListener;
    private com.sky.atc.easyformse.utils.newView.AiShutterDrawable aiShutter;
    Uri imageUri;
    private Size previewSize;
    private String cameraId;
    private int sensorOrientation;
    private float sensorAspect = 4f/3f;
    private android.media.ImageReader stillReader;
    private final android.os.HandlerThread imageWorker = new android.os.HandlerThread("camera-jpeg");
    private volatile boolean captureInFlight;
    private volatile boolean capturedMirror;
    private volatile int cameraGeneration;
    @SuppressLint("MissingInflatedId")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        imageWorker.start();
        setContentView(R.layout.activity_ai_text);
        com.sky.atc.easyformse.utils.newView.CameraChrome.apply(this);
        mCameraAITextActivity = this;
        CaptureImage = findViewById(R.id.captureFront);
        try {
            aiShutter = new com.sky.atc.easyformse.utils.newView.AiShutterDrawable();
            ((android.widget.ImageView) CaptureImage).setImageDrawable(aiShutter);
        } catch (Exception ignored) { }
        mFrameLayout = findViewById(R.id.framlayout);
        textureView = findViewById(R.id.textureView);
        mirrorControl = new com.sky.atc.easyformse.camera.MirrorControl(this,mFrameLayout,value->{mirrorSelected=value; applyMirror();});

        BrowseImage = findViewById(R.id.browseimage);
        switchcamera = findViewById(R.id.switchcamera);
        loadingOverlay = findViewById(R.id.loadingOverlay);
        processingImage = findViewById(R.id.ai_processing_image);

        orientationEventListener = new OrientationEventListener(this) {
            @Override
            public void onOrientationChanged(int orientation) {
                if (orientation == ORIENTATION_UNKNOWN) return;

                if (orientation >= 315 || orientation < 45) {
                    currentDeviceAngle = 0;   //  (Portrait)
                } else if (orientation >= 45 && orientation < 135) {
                    currentDeviceAngle = 90;  // (Landscape)
                } else if (orientation >= 135 && orientation < 225) {
                    currentDeviceAngle = 180; //  (Reverse Portrait)
                } else if (orientation >= 225 && orientation < 315) {
                    currentDeviceAngle = 270; //  (Landscape)
                }
            }
        };
        orientationEventListener.enable();

        try{
            Bundle Extras = getIntent().getExtras();

            modelname =  Extras.getString("modelname");
            promttext =  Extras.getString("prompttext");
            AI_type = Extras.getString("AI_type");
            quality = Extras.getString("quality");
            width = Extras.getString("width");
            height = Extras.getString("height");
            max_file_size = Extras.getString("max_file_size");

            if(AI_type.equalsIgnoreCase(""))
            {
                AI_type = "camera";
            }

            if(modelname.equalsIgnoreCase(""))
            {
                modelname = "gemini-2.5-flash";
            }
            if(promttext.equalsIgnoreCase(""))
            {
                promttext = "Tell me about something this ";
            }

            CaptureImage.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    captureImage();
                }
            });

            BrowseImage.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View view) {
                    opendocument();
                }
            });

            switchcamera.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    switchCamera();
                }
            });

        }
        catch (Exception e)
        {

        }

    }

    private void switchCamera() {
        if (captureInFlight) return;
        isFrontCamera = !isFrontCamera;

        if (isFrontCamera) {
            switchcamera.setImageResource(R.drawable.backcamera_foreground);
            applyMirror();
        } else {
            switchcamera.setImageResource(R.drawable.frontcamera_foreground);
            applyMirror();
        }

        closeCamera();

        if (textureView.isAvailable()) {
            openCamera();
        } else {
            startCamera();
        }
    }

    private void applyMirror() {
        textureView.setScaleX(isFrontCamera && !mirrorSelected ? -1 : 1);
        if(mirrorControl != null) { mirrorControl.show(isFrontCamera); mirrorControl.setMirrored(mirrorSelected); }
    }
    private void configurePreviewTransform() {
        if(previewSize == null || textureView.getWidth()==0 || textureView.getHeight()==0) return;
        int degrees=getWindowManager().getDefaultDisplay().getRotation()*90;
        boolean swap=(sensorOrientation-(isFrontCamera?degrees:-degrees)+360)%180!=0;
        float width=textureView.getWidth(), height=textureView.getHeight();
        float sx=width/(swap?previewSize.getHeight():previewSize.getWidth());
        float sy=height/(swap?previewSize.getWidth():previewSize.getHeight());
        if(sensorOrientation==0) { sx=width/(swap?previewSize.getWidth():previewSize.getHeight()); sy=height/(swap?previewSize.getHeight():previewSize.getWidth()); }
        float scale=Math.min(sx,sy);
        Matrix transform=new Matrix();
        transform.setScale(swap?scale/sx:height/width/sy*scale,swap?scale/sy:width/height/sx*scale,width/2,height/2);
        transform.postRotate(-degrees,width/2,height/2); textureView.setTransform(transform);
        View grid = findViewById(R.id.ai_preview_grid);
        int[] fitted = com.sky.atc.easyformse.camera.CameraGeometry.fit((int)width, (int)height,
                previewSize.getWidth(), previewSize.getHeight(), swap ? 90 : 0);
        android.widget.FrameLayout.LayoutParams gridParams = new android.widget.FrameLayout.LayoutParams(
                fitted[0], fitted[1], android.view.Gravity.CENTER);
        grid.setLayoutParams(gridParams);
    }

    private void closeCamera() {
        cameraGeneration++;
        try {
            if (captureSession != null) {
                captureSession.close();
                captureSession = null;
            }

            if (cameraDevice != null) {
                cameraDevice.close();
                cameraDevice = null;
            }
            previewRequestBuilder = null;
            if(stillReader != null) { stillReader.close(); stillReader = null; }
            captureInFlight = false;
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void startCamera() {
        if (textureView.isAvailable()) {
            openCamera();
        }
        else {
            textureView.setSurfaceTextureListener(new TextureView.SurfaceTextureListener() {
                @Override
                public void onSurfaceTextureAvailable(@NonNull SurfaceTexture surface, int width, int height) {
                    openCamera();
                }

                @Override
                public void onSurfaceTextureSizeChanged(@NonNull SurfaceTexture surface, int width, int height) {
                    configurePreviewTransform();
                }

                @Override
                public boolean onSurfaceTextureDestroyed(@NonNull SurfaceTexture surface) {
                    closeCamera();
                    return true;
                }

                @Override
                public void onSurfaceTextureUpdated(@NonNull SurfaceTexture surface) {
                }
            });
        }
    }

    private void openCamera() {

        CameraManager manager =
                (CameraManager) getSystemService(Context.CAMERA_SERVICE);

        try {

            cameraId = null;

            for (String id : manager.getCameraIdList()) {

                CameraCharacteristics chars =
                        manager.getCameraCharacteristics(id);

                Integer facing = chars.get(CameraCharacteristics.LENS_FACING);

                if (facing == null) {
                    continue;
                }

                if (isFrontCamera && facing == CameraCharacteristics.LENS_FACING_FRONT) {

                    cameraId = id;
                    break;

                } else if (!isFrontCamera && facing == CameraCharacteristics.LENS_FACING_BACK) {

                    cameraId = id;
                    break;
                }
            }

            if (cameraId == null && manager.getCameraIdList().length > 0) {

                cameraId = manager.getCameraIdList()[0];
            }

            if (cameraId == null) {
                return;
            }

            CameraCharacteristics chars = manager.getCameraCharacteristics(cameraId);

            Size pixelArray = chars.get(CameraCharacteristics.SENSOR_INFO_PIXEL_ARRAY_SIZE);
            if(pixelArray != null) sensorAspect = (float)pixelArray.getWidth()/pixelArray.getHeight();
            Integer sensor = chars.get(CameraCharacteristics.SENSOR_ORIENTATION);
            sensorOrientation = sensor == null ? 0 : sensor;
            Integer actualFacing = chars.get(CameraCharacteristics.LENS_FACING);
            isFrontCamera = actualFacing != null && actualFacing == CameraCharacteristics.LENS_FACING_FRONT;
            applyMirror();

            StreamConfigurationMap map =
                    chars.get(
                            CameraCharacteristics
                                    .SCALER_STREAM_CONFIGURATION_MAP
                    );

            if (map == null) {
                return;
            }

            Size[] choices = map.getOutputSizes(SurfaceTexture.class);

            previewSize = chooseOptimalSize(choices, textureView.getWidth(), textureView.getHeight());

            if (ActivityCompat.checkSelfPermission(
                    this,
                    Manifest.permission.CAMERA
            ) != PackageManager.PERMISSION_GRANTED) {
                return;
            }

            manager.openCamera(cameraId,

                    new CameraDevice.StateCallback() {

                        @Override
                        public void onOpened(@NonNull CameraDevice camera) {

                            cameraDevice = camera;
                            createCameraPreview();
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
                            LogUtils.writeAttendanceLogToFile("open camera error" + error,"Opencamera");
                            Log.e("CameraAI", "Camera error: " + error);
                        }

                    },

                    null
            );

        }
        catch (Exception e) {
            LogUtils.writeAttendanceLogToFile("open camera" + e.toString(),"Opencamera");
            Log.e("CameraAI", "openCamera error", e);
        }
    }

    private void createCameraPreview() {

        try {

            if (cameraDevice == null) {
                return;
            }

            SurfaceTexture texture = textureView.getSurfaceTexture();

            if (texture == null) {
                return;
            }

            if (previewSize == null) {

                previewSize = new Size(1280, 720);
            }

            texture.setDefaultBufferSize(previewSize.getWidth(), previewSize.getHeight());
            configurePreviewTransform();

            Surface surface = new Surface(texture);
            android.hardware.camera2.CameraManager cameraManager=(android.hardware.camera2.CameraManager)getSystemService(CAMERA_SERVICE);
            Size[] jpegSizes=cameraManager.getCameraCharacteristics(cameraId).get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP).getOutputSizes(android.graphics.ImageFormat.JPEG);
            Size jpegSize=chooseOptimalSize(jpegSizes,1920,1920);
            stillReader=android.media.ImageReader.newInstance(jpegSize.getWidth(),jpegSize.getHeight(),android.graphics.ImageFormat.JPEG,2);
            final int generation = cameraGeneration;
            stillReader.setOnImageAvailableListener(reader->{
                android.media.Image image=null; File source=null;
                final boolean mirror=capturedMirror;
                try {
                    image=reader.acquireNextImage(); if(image==null) return;
                    java.nio.ByteBuffer buffer=image.getPlanes()[0].getBuffer(); byte[] bytes=new byte[buffer.remaining()]; buffer.get(bytes);
                    image.close(); image=null;
                    source=File.createTempFile("camera-jpeg-", ".jpg", getCacheDir());
                    try(FileOutputStream output=new FileOutputStream(source)) { output.write(bytes); }
                    Bitmap ready=com.sky.atc.easyformse.camera.CameraImages.orient(BitmapFactory.decodeFile(source.getPath()),source);
                    runOnUiThread(()->{ if(generation != cameraGeneration || isFinishing() || isDestroyed()) { ready.recycle(); return; } captureInFlight=false; processCapture(ready,mirror); });
                } catch(Exception | OutOfMemoryError error) { runOnUiThread(()->{ if(generation != cameraGeneration) return; captureInFlight=false; com.sky.atc.easyformse.camera.AppCameraDialog.show(this,"Unable to capture image","Please try taking the photo again.","OK",false,()->{}); }); }
                finally { if(image!=null) image.close(); if(source!=null) source.delete(); }
            },new android.os.Handler(imageWorker.getLooper()));

            previewRequestBuilder = cameraDevice.createCaptureRequest(CameraDevice.TEMPLATE_PREVIEW);

            previewRequestBuilder.addTarget(surface);

            previewRequestBuilder.set(CaptureRequest.CONTROL_MODE, CameraMetadata.CONTROL_MODE_AUTO);

            previewRequestBuilder.set(CaptureRequest.CONTROL_AF_MODE, CaptureRequest.CONTROL_AF_MODE_CONTINUOUS_PICTURE);

            cameraDevice.createCaptureSession(
                    java.util.Arrays.asList(surface,stillReader.getSurface()),

                    new CameraCaptureSession.StateCallback() {

                        @Override
                        public void onConfigured(
                                @NonNull CameraCaptureSession session
                        ) {

                            if (cameraDevice == null || generation != cameraGeneration) {
                                session.close();
                                return;
                            }

                            captureSession = session;

                            try {

                                captureSession.setRepeatingRequest(
                                        previewRequestBuilder.build(),
                                        null,
                                        null
                                );

                            } catch (Exception e) {
                                LogUtils.writeAttendanceLogToFile("createCameraPreview error" + e.toString(),"createCameraPreview");
                                Log.e(
                                        "CameraAI",
                                        "Preview error",
                                        e
                                );
                            }
                        }

                        @Override
                        public void onConfigureFailed(
                                @NonNull CameraCaptureSession session) {
                            LogUtils.writeAttendanceLogToFile("createCameraPreview onConfigureFailed" + session.toString(),"createCameraPreview");

                            Log.e("CameraAI",
                                    "Preview config failed"
                            );
                        }

                    },

                    null
            );

        }
        catch (Exception e) {
            LogUtils.writeAttendanceLogToFile("createCameraPreview Exception" + e.toString(),"Exception");

            Log.e("CameraAI", "createCameraPreview error", e);
        }
    }

    private void updatePreview() {
        try {
            previewRequestBuilder.set(CaptureRequest.CONTROL_MODE, CameraMetadata.CONTROL_MODE_AUTO);

            previewRequestBuilder.set(CaptureRequest.CONTROL_AF_MODE,
                    CaptureRequest.CONTROL_AF_MODE_CONTINUOUS_PICTURE);

            captureSession.setRepeatingRequest(previewRequestBuilder.build(), null, null);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void captureImage() {
        if(cameraDevice==null || captureSession==null || stillReader==null || captureInFlight) return;
        try {
            captureInFlight=true; capturedMirror=isFrontCamera && mirrorSelected;
            CaptureRequest.Builder request=cameraDevice.createCaptureRequest(CameraDevice.TEMPLATE_STILL_CAPTURE);
            request.addTarget(stillReader.getSurface());
            request.set(CaptureRequest.CONTROL_AF_MODE,CaptureRequest.CONTROL_AF_MODE_CONTINUOUS_PICTURE);
            request.set(CaptureRequest.JPEG_ORIENTATION,com.sky.atc.easyformse.camera.CameraGeometry.jpegRotation(sensorOrientation,currentDeviceAngle,isFrontCamera));
            captureSession.capture(request.build(),new CameraCaptureSession.CaptureCallback() {
                @Override public void onCaptureFailed(@NonNull CameraCaptureSession session,@NonNull CaptureRequest request,@NonNull android.hardware.camera2.CaptureFailure failure) {
                    captureInFlight=false;
                    com.sky.atc.easyformse.camera.AppCameraDialog.show(CameraAITextActivity.this,"Unable to capture image","Please try taking the photo again.","OK",false,()->{});
                }
            },null);
        } catch(Exception error) { captureInFlight=false; com.sky.atc.easyformse.camera.AppCameraDialog.show(this,"Unable to capture image","Please try taking the photo again.","OK",false,()->{}); }
    }

    private void processCapture(Bitmap image, boolean mirror) {

        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (textureView.isAvailable()) {
                    selectedBitmap = image;

                    if (selectedBitmap != null) {

                        if (mirror) {
                            Matrix flip = new Matrix(); flip.setScale(-1,1);
                            Bitmap mirrored = Bitmap.createBitmap(selectedBitmap,0,0,selectedBitmap.getWidth(),selectedBitmap.getHeight(),flip,true);
                            if(mirrored != selectedBitmap) selectedBitmap.recycle(); selectedBitmap = mirrored;
                        }
                        File pictureFile = getOutputMediaFile();
                        photo_path = pictureFile.getAbsolutePath();
                        try (FileOutputStream fos = new FileOutputStream(pictureFile)) {
                            selectedBitmap.compress(Bitmap.CompressFormat.JPEG, Integer.parseInt(quality), fos);

                            selectedBitmap = resize(selectedBitmap, Integer.parseInt(width), Integer.parseInt(height));
                            fos.flush();
                            fos.close();

                            if (returnCapturedPhoto()) return;
                            showProcessingImage();
                            if (isNetworkAvailable()) {
                                new AiPhotoTask().execute(photo_path);
                            } else {
                                showAlertDialogWithMessage(photo_path, "104");

                            }

                        } catch (IOException e) {
                            e.printStackTrace();
                            com.sky.atc.easyformse.camera.AppCameraDialog.show(CameraAITextActivity.this,
                                    "Unable to save image", "Please try taking the photo again.", "OK", false, () -> {});
                        }
                    } else {
                        com.sky.atc.easyformse.camera.AppCameraDialog.show(CameraAITextActivity.this,
                                "Unable to capture image", "Please try taking the photo again.", "OK", false, () -> {});
                    }
                }
            }
        });

    }

    private boolean returnCapturedPhoto() {
        if (!getIntent().getBooleanExtra("capture_only", false)) return false;
        Intent result = new Intent(); result.putExtras(new Bundle(getIntent().getExtras()));
        result.putExtra("captured_only",true); result.putExtra("photo_path",photo_path);
        result.putExtra("quality",quality); result.putExtra("modelname",modelname); result.putExtra("prompttext",promttext);
        setResult(RESULT_OK,result); finish(); overridePendingTransition(0,0); return true;
    }

    private void showProcessingImage() {
        if (isFinishing() || isDestroyed() || selectedBitmap == null) return;
        processing = true;
        processingImage.setImageBitmap(selectedBitmap);
        processingImage.setVisibility(View.VISIBLE);
        ((com.sky.atc.easyformse.camera.AiProcessingOverlay)findViewById(R.id.ai_processing_sweep))
                .setImageSize(selectedBitmap.getWidth(), selectedBitmap.getHeight());
        mFrameLayout.setVisibility(View.GONE);
        loadingOverlay.setVisibility(View.VISIBLE); loadingOverlay.bringToFront();
        closeCamera();
    }
    private void failProcessing(String message) {
        runOnUiThread(() -> {
            if (isFinishing() || isDestroyed() || processingFailureShown) return;
            processingFailureShown = true;
            loadingOverlay.setVisibility(View.GONE);
            com.sky.atc.easyformse.camera.AppCameraDialog.show(this, "Unable to process image",
                    message, "OK", false, () -> SendPluginfailed("error"));
        });
    }

    private static Bitmap resize(Bitmap image,
                                 int maxWidth,
                                 int maxHeight) {

        int[] fit = com.sky.atc.easyformse.camera.CameraGeometry.fit(640,480,image.getWidth(),image.getHeight(),0);
        return Bitmap.createScaledBitmap(image,fit[0],fit[1],true);
    }

    private File getOutputMediaFile() {
        String dir = Environment.getExternalStorageDirectory() + File.separator + "myDirectory";
        File folder = new File(dir);
        if (!folder.exists()) folder.mkdirs();

        String name = "IMG_" + System.currentTimeMillis() + ".jpeg";
        return new File(folder, name);
    }

    @Override
    protected void onPause() {
        if (aiShutter != null) aiShutter.stop();
        super.onPause();
        closeCamera();
    }

    public void setup()
    {
        if (processing) return;
        if (!checkCameraPermission()) {
            requestCameraPermission();
            return;
        }

        startCamera();
    }

    void requestCameraPermission () {
        ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.CAMERA, Manifest.permission.WRITE_EXTERNAL_STORAGE, Manifest.permission.READ_EXTERNAL_STORAGE}, PERMISSION_REQUEST_CODE);
    }

    boolean checkCameraPermission () {
        return (ActivityCompat.checkSelfPermission(this, Manifest.permission.CAMERA) +
                ActivityCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) +
                ActivityCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE)) == PackageManager.PERMISSION_GRANTED;
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String permissions[], int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        switch (requestCode) {
            case PERMISSION_REQUEST_CODE:
                if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED
                        && grantResults[1] == PackageManager.PERMISSION_GRANTED
                        && grantResults[2] == PackageManager.PERMISSION_GRANTED) {
                    setup();
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
        new AlertDialog.Builder(CameraAITextActivity.this)
                .setMessage(message)
                .setPositiveButton("OK", okListener)
                .setCancelable(false)
                .create()
                .show();
    }

    private void opendocument()
    {
        Intent photoPickerIntent = new Intent(Intent.ACTION_GET_CONTENT);

        photoPickerIntent.setType("image/*");
        startActivityForResult(photoPickerIntent, SELECT_PHOTO);

    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        switch (requestCode) {

            case REQUEST_IMAGE_CAPTURE:
                if (resultCode == RESULT_OK) {
                    Bundle extras = data.getExtras();
                    selectedBitmap= (Bitmap) extras.get("data");
                    photo_path = saveBitmapToFile(selectedBitmap, this);
                    if (returnCapturedPhoto()) return;
                    showProcessingImage();

                    if (isNetworkAvailable()) {
                        new AiPhotoTask().execute(photo_path);
                    } else {
                        showAlertDialogWithMessage(photo_path, "104");

                    }
                }
                else {

                    Bundle b = new Bundle();

                    Intent intent = new Intent();
                    intent.putExtras(b);
                    setResult(RESULT_CANCELED, intent);

                    finish();

                }
                break;

            case SELECT_PHOTO:
                if (resultCode == RESULT_OK) {
                    try {
                        imageUri = data.getData();
                        if (imageUri == null) return;

                        long lengthoffile = 0;
                        try (android.database.Cursor cursor = context.getContentResolver().query(imageUri, null, null, null, null)) {
                            if (cursor != null && cursor.moveToFirst()) {
                                int sizeIndex = cursor.getColumnIndex(android.provider.OpenableColumns.SIZE);
                                if (sizeIndex != -1) {
                                    lengthoffile = cursor.getLong(sizeIndex);
                                }
                            }
                        }
                        lengthoffile = lengthoffile / 1024;

                        int filesize = Integer.parseInt(max_file_size) * 1000;

                        if (lengthoffile < filesize) {

                            Bitmap geminiBitmap = uriToBitmap(imageUri);

                            geminiBitmap = imageOrientationValidatorFromUri(context, geminiBitmap, imageUri);
                            geminiBitmap = resize(geminiBitmap, Integer.parseInt(width), Integer.parseInt(height));
                            selectedBitmap = geminiBitmap;

                            photo_path = createTempFileFromUri(context, imageUri);
                            if (photo_path != null) {
                                if (returnCapturedPhoto()) return;
                                showProcessingImage();
                                if (isNetworkAvailable()) {
                                    new AiPhotoTask().execute(photo_path);
                                } else {
                                    showAlertDialogWithMessage(photo_path, "104");
                                }
                            } else {
                                Toast.makeText(context, "Failed to process image file.", Toast.LENGTH_SHORT).show();
                            }

                        } else {
                            new Handler(Looper.getMainLooper()).post(() ->
                                    Toast.makeText(context, "File size must be less than " + max_file_size + "MB!", Toast.LENGTH_LONG).show()
                            );
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
                else {

                    Bundle b = new Bundle();

                    Intent intent = new Intent();
                    intent.putExtras(b);
                    setResult(RESULT_CANCELED, intent);

                    finish();

                }
                break;
        }
    }

    private Bitmap imageOrientationValidatorFromUri(Context context, Bitmap bitmap, Uri uri) {
        try (java.io.InputStream inputStream = context.getContentResolver().openInputStream(uri)) {
            if (inputStream == null) return bitmap;

            android.media.ExifInterface exifInterface = new android.media.ExifInterface(inputStream);
            int orientation = exifInterface.getAttributeInt(android.media.ExifInterface.TAG_ORIENTATION, android.media.ExifInterface.ORIENTATION_NORMAL);

            android.graphics.Matrix matrix = new android.graphics.Matrix();
            if (orientation == android.media.ExifInterface.ORIENTATION_ROTATE_90) matrix.postRotate(90);
            else if (orientation == android.media.ExifInterface.ORIENTATION_ROTATE_180) matrix.postRotate(180);
            else if (orientation == android.media.ExifInterface.ORIENTATION_ROTATE_270) matrix.postRotate(270);

            return Bitmap.createBitmap(bitmap, 0, 0, bitmap.getWidth(), bitmap.getHeight(), matrix, true);
        } catch (Exception e) {
            return bitmap;
        }
    }

    private String createTempFileFromUri(Context context, Uri uri) {
        try (java.io.InputStream inputStream = context.getContentResolver().openInputStream(uri)) {
            File tempFile = new File(context.getCacheDir(), "upload_image_" + System.currentTimeMillis() + ".jpeg");
            try (java.io.FileOutputStream outputStream = new java.io.FileOutputStream(tempFile)) {
                byte[] buffer = new byte[4096];
                int bytesRead;
                while ((bytesRead = inputStream.read(buffer)) != -1) {
                    outputStream.write(buffer, 0, bytesRead);
                }
                return tempFile.getAbsolutePath();
            }
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    private Bitmap uriToBitmap(Uri uri) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                ImageDecoder.Source source = ImageDecoder.createSource(getContentResolver(), uri);
                return ImageDecoder.decodeBitmap(source);
            } else {
                return MediaStore.Images.Media.getBitmap(getContentResolver(), uri);
            }
        } catch (IOException e) {
            e.printStackTrace();
            return null;
        }
    }
    @Override
    protected void onResume() {
        super.onResume();
        if (aiShutter != null) aiShutter.start();
        setup();
    }

    public String saveBitmapToFile(Bitmap bitmap, Context context) {

        String dir = Environment.getExternalStorageDirectory()
                + File.separator + "myDirectory";
        File folder = new File(dir); // folder name
        folder.mkdirs();
        String name = "IMG" + System.currentTimeMillis() + ".jpeg";
        File file = new File(dir, name);

        try (FileOutputStream fos = new FileOutputStream(file)) {
            bitmap.compress(Bitmap.CompressFormat.JPEG, Integer.parseInt(quality), fos);
            fos.flush();
            return file.getAbsolutePath();
        } catch (IOException e) {
            e.printStackTrace();
            return null;
        }
    }

    private void SendPluginfailed(String Error)
    {

        try{
            Intent intent = new Intent();
            intent.putExtra("Error",Error);
            setResult(RESULT_CANCELED, intent);
            finish();
            overridePendingTransition(0,0);
        }
        catch (Exception e)
        {

        }

    }

    @Override
    public void onBackPressed() {
        Bundle b = new Bundle();

        Intent intent = new Intent();
        intent.putExtras(b);
        setResult(RESULT_CANCELED, intent);

        finish();
        super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        imageWorker.quitSafely();
        if (aiShutter != null) aiShutter.stop();
        super.onDestroy();
        if (orientationEventListener != null) orientationEventListener.disable();
    }

    private boolean isNetworkAvailable() {
        ConnectivityManager connectivityManager = (ConnectivityManager) context
                .getSystemService(Context.CONNECTIVITY_SERVICE);
        @SuppressLint("MissingPermission")
        NetworkInfo activeNetworkInfo = connectivityManager
                .getActiveNetworkInfo();
        return activeNetworkInfo != null && activeNetworkInfo.isConnected();
    }

    private final class AiPhotoTask extends AsyncTask<String, Void, String> {
        private String error;
        @Override protected void onPreExecute() { showProcessingImage(); }
        @Override protected String doInBackground(String... paths) {
            try {
                JSONObject request = com.sky.atc.easyformse.camera.AiPhotoProcessor.request(getIntent(), paths[0]);
                request.put("quality", quality); request.put("modelname", modelname); request.put("prompttext", promttext);
                return new com.sky.atc.easyformse.camera.AiPhotoProcessor(getApplicationContext(), request).process().toString();
            } catch (Exception failure) { error = failure.getMessage(); return null; }
        }
        @Override protected void onPostExecute(String response) {
            if (isFinishing() || isDestroyed()) return;
            if (response == null) failProcessing(error == null ? "AI could not process this photo. Please try again." : error);
            else { setResult(RESULT_OK, new Intent().putExtra("response", response)); finish(); }
        }
    }
    private void showAlertDialogWithMessage(String path, String requestCode) {
        AlertDialog.Builder dialog = new AlertDialog.Builder(this);
        dialog.setTitle("Internet Not Available").setMessage("Please turn on the internet and Retry").setCancelable(false);
        dialog.setPositiveButton("Retry", (view, which) -> {
            if (isNetworkAvailable()) new AiPhotoTask().execute(path);
            else showAlertDialogWithMessage(path, requestCode);
        });
        dialog.setNegativeButton("Cancel", (view, which) -> SendPluginfailed("error")); dialog.show();
    }

    private Size chooseOptimalSize(
            Size[] choices,
            int viewWidth,
            int viewHeight
    ) {

        if (choices == null ||
                choices.length == 0) {
            return new Size(1280, 720);
        }

        Size bestSize = null; double score = Double.MAX_VALUE;
        boolean bounded = false; int limit = Math.max(1280,Math.min(viewWidth,1920));
        for(Size option:choices) if(option.getWidth() <= limit) bounded=true;
        for(Size option:choices) {
            if(bounded && option.getWidth() > limit) continue;
            double candidate=Math.abs((double)option.getWidth()/option.getHeight()-sensorAspect);
            if(bestSize==null || candidate<score-.0001 || (Math.abs(candidate-score)<.0001 && (long)option.getWidth()*option.getHeight()>(long)bestSize.getWidth()*bestSize.getHeight())) { bestSize=option; score=candidate; }
        }

        return bestSize;
    }
}
