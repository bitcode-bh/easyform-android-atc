package com.sky.atc.easyformse;

import static com.sky.atc.easyformse.sqlitewraper.context;
import static com.sky.atc.easyformse.sqlitewraper.mainactivity;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.ContentUris;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.ImageDecoder;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.SurfaceTexture;
import android.hardware.Camera;
import android.hardware.camera2.CameraCaptureSession;
import android.hardware.camera2.CameraCharacteristics;
import android.hardware.camera2.CameraDevice;
import android.hardware.camera2.CameraManager;
import android.hardware.camera2.CameraMetadata;
import android.hardware.camera2.CaptureRequest;
import android.media.ExifInterface;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.provider.DocumentsContract;
import android.provider.MediaStore;
import android.provider.Settings;
import android.util.Base64;
import android.util.Log;
import android.view.Surface;
import android.view.TextureView;
import android.view.View;
import android.view.inputmethod.InputMethodManager;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.sky.atc.easyformse.datautils.MySharedPreferences;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.io.Writer;
import java.util.Collections;
import java.util.Iterator;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.Response;

public class CameraAITextActivity extends AppCompatActivity {

    private ImageView imageView;
    private TextView PromptText;
    private TextView textOutput,pdftext;
    private Bitmap selectedBitmap;
    Button mButtonDone;
    ProgressBar progressBar;
    LinearLayout mLinearLayout;
    String modelname;
    String promttext;
    String photo_path;
    String themecolor;
    MySharedPreferences pref;
    static final int REQUEST_IMAGE_CAPTURE = 1;

    private static final int PERMISSION_REQUEST_CODE = 200;
    static Activity mCameraAITextActivity;
    String AI_type;
    private final int SELECT_PDF = 2;
    String extension;
    String mimtypeforapi;
    String quality;
    String width;
    String height;

    private Camera camera;

    private TextureView textureView;
    private CameraDevice cameraDevice;
    private CameraCaptureSession captureSession;
    private CaptureRequest.Builder previewRequestBuilder;
    ImageView CaptureImage,BrowseImage,switchcamera;
    FrameLayout mFrameLayout;
    LinearLayout mLinearLayoutmain,linearsecond;
    int rot = 0;
    private boolean isFrontCamera = false;
    FrameLayout loadingOverlay;

    @SuppressLint("MissingInflatedId")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_ai_text);
        mCameraAITextActivity = this;
        imageView = findViewById(R.id.imageView);
        PromptText = findViewById(R.id.PromptText);
        textOutput = findViewById(R.id.textOutput);
        progressBar = findViewById(R.id.progressBar);
        mButtonDone = findViewById(R.id.btnOK);
        pdftext = (TextView) findViewById(R.id.pdftext);
        mLinearLayout = findViewById(R.id.responselayout);
        CaptureImage = findViewById(R.id.captureFront);
        mFrameLayout = findViewById(R.id.framlayout);
        linearsecond = findViewById(R.id.linearsecond);
        textureView = findViewById(R.id.textureView);
        mLinearLayoutmain = findViewById(R.id.linearmain);
        BrowseImage = findViewById(R.id.browseimage);
        switchcamera = findViewById(R.id.switchcamera);
        loadingOverlay = findViewById(R.id.loadingOverlay);

        pref = sqlitewraper.getSecureShared("MyPref");
//        themecolor = pref.getString("themecolor","");
//        if(themecolor.equalsIgnoreCase(""))
//        { }
//        else {
//            mButtonDone.setBackgroundColor(Color.parseColor(themecolor));
//
//        }


        try{
            Bundle Extras = getIntent().getExtras();

            modelname =  Extras.getString("modelname");
            promttext =  Extras.getString("prompttext");
//            promttext ="=== MANDATORY IMAGE AUTHENTICITY CHECK (evaluate FIRST) === Before assessing any PPE, determine if this is a LIVE photo or a photo of a photo/screen. REJECT as SPOOF if ANY of the following are present: - A screen, monitor, tablet, or phone display is visible in the frame - Visible screen glare, pixel grid, moire pattern, or scan lines - A printed photo held up or placed on a surface - Photo edges or white borders visible (indicating a printed or cropped image) - The image contains another image (nested framing) - Reflection of a camera or person in a screen taking a photo - Unusual color banding, compression artifacts consistent with screen photography - The background shows a desk, table, or hand holding a device showing a photo - Timestamp or UI elements from another app overlaid on the photo - The image appears 2D-flat with no depth or natural shadow variation If ANY spoof indicator is detected: set spoof_detected = true and result = FAIL immediately. Do NOT assess PPE content if spoof is detected. === You are a strict PPE compliance inspector for telecom tower operations in India. Your sole task is binary: confirm whether valid head protection is CLEARLY VISIBLE in this image.   VALID Head Protection Types:   Type A: Construction Helmet: (Hard Hat): Rigid shell, must show a clear brim and dome shape.  Type B: Full-Face Helmet: Hard-shell protective headgear covering the entire head and jaw, typically with a visor.  Type C: Half-Face Helmet: Hard-shell protective headgear covering the top and sides of the head, leaving the face/chin exposed.  Type D: Turban (Pagri/Dastar): Must be a full, properly wrapped fabric head covering; not a loose cloth, bandana, or cap.   REJECTION Criteria (FAIL if ANY apply):   Proximity: Face fills more than 60% of the frame (selfie too close, cannot assess PPE).  Quality: Image is blurry, dark, or low resolution. If you cannot read fabric/shell texture, REJECT.  Framing: Only partial head visible (top of frame cuts the crown).  Invalid Gear: A cap, beanie, bandana, or any non-qualifying item is worn.  Ambiguity: If you are GUESSING or INFERRING, FAIL.   STRICT Rules:   Do NOT infer presence from shadows, partial edges, or background context.  Do NOT pass because the person is at a tower site and \\\"likely\\\" has a helmet.  Do NOT consider helmets in the background or held in hand.  A single unclear pixel region is NOT sufficient for PASS.  Turban Rule: Must be a traditional, multi-layered wrap.   Respond ONLY with one word: PASS or FAIL. if detected,also return PPE bounding box coordinates. Format:{ \"Result\" : \"Your Answer\". \"Box\":[coordinates] , \"label\" :\" \"} ";
//            promttext = "Q93 : === MANDATORY IMAGE AUTHENTICITY CHECK (evaluate FIRST) === Before assessing any PPE, determine if this is a LIVE photo or a photo of a photo/screen. REJECT as SPOOF if ANY of the following are present: - A screen, monitor, tablet, or phone display is visible in the frame - Visible screen glare, pixel grid, moire pattern, or scan lines - A printed photo held up or placed on a surface - Photo edges or white borders visible (indicating a printed or cropped image) - The image contains another image (nested framing) - Reflection of a camera or person in a screen taking a photo - Unusual color banding, compression artifacts consistent with screen photography - The background shows a desk, table, or hand holding a device showing a photo - Timestamp or UI elements from another app overlaid on the photo - The image appears 2D-flat with no depth or natural shadow variation If ANY spoof indicator is detected: set spoof_detected = true and result = FAIL immediately. Do NOT assess PPE content if spoof is detected. === You are a safety compliance inspector. Your task: verify a high-visibility (hi-vis) reflective jacket is WORN and VISIBLE in this image. PASS criteria (ALL must be true): - A vest or jacket with fluorescent yellow, orange, or lime-green base fabric is visible ON the persons torso - At minimum 2 retroreflective silver/grey stripe bands are visible on the jacket body or shoulders - The jacket is being WORN not held, hanging, or on another person FAIL criteria (any one is enough to fail): - No fluorescent base color visible on torso area - Reflective stripes absent or fewer than 2 visible - Jacket open and flopped to the sides reflective surface not frontal - Image does not show the torso (head-only or lower-body-only shot) - A regular safety vest without retroreflective stripes â€” color alone does NOT qualify - Image quality: dark, backlit, or resolution too low to distinguish stripe texture CRITICAL anti-hallucination rules: - A yellow shirt or t-shirt is NOT a hi-vis jacket. Reflective stripes are MANDATORY. - Do NOT infer stripes from glare or bright light artifacts - Do NOT pass because the environment looks like a construction site - If you cannot clearly see the stripe texture: FAIL Respond ONLY in ONE WORD FAIL or PASS Q98 : === MANDATORY IMAGE AUTHENTICITY CHECK (evaluate FIRST) === Before assessing any PPE, determine if this is a LIVE photo or a photo of a photo/screen. REJECT as SPOOF if ANY of the following are present: - A screen, monitor, tablet, or phone display is visible in the frame - Visible screen glare, pixel grid, moire pattern, or scan lines - A printed photo held up or placed on a surface - Photo edges or white borders visible (indicating a printed or cropped image) - The image contains another image (nested framing) - Reflection of a camera or person in a screen taking a photo - Unusual color banding, compression artifacts consistent with screen photography - The background shows a desk, table, or hand holding a device showing a photo - Timestamp or UI elements from another app overlaid on the photo - The image appears 2D-flat with no depth or natural shadow variation If ANY spoof indicator is detected: set spoof_detected = true, set both item results to FAIL immediately. Do NOT assess PPE content if spoof is detected. === You are a safety compliance inspector. Evaluate TWO items independently from this image. === ITEM 1: Protective Safety Goggles === PASS criteria: - Goggles or Specs of any kind are visibly worn on the face OR clipped/hanging on the helmet in ready position - Standard spectacles or sunglasses also qualify - Goggles must be around the head or on the helmet or with Tool Kit or worn over the face FAIL criteria: - Image quality too poor to assess face area - No glasses of any kind Identified over the face . - Helmet visors are a red flag and clear fail Respond ONLY in only ONE WORD FAIL or PASS Q94 : === MANDATORY IMAGE AUTHENTICITY CHECK (evaluate FIRST) === Before assessing any PPE, determine if this is a LIVE photo or a photo of a photo/screen. REJECT as SPOOF if ANY of the following are present: - A screen, monitor, tablet, or phone display is visible in the frame - Visible screen glare, pixel grid, moire pattern, or scan lines - A printed photo held up or placed on a surface - Photo edges or white borders visible (indicating a printed or cropped image) - The image contains another image (nested framing) - Reflection of a camera or person in a screen taking a photo - Unusual color banding, compression artifacts consistent with screen photography - The background shows a desk, table, or hand holding a device showing a photo - Timestamp or UI elements from another app overlaid on the photo - The image appears 2D-flat with no depth or natural shadow variation If ANY spoof indicator is detected: set spoof_detected = true and result = FAIL immediately. Do NOT assess PPE content if spoof is detected. === You are a safety compliance inspector for electrical telecom work. Your task: verify insulated rubber gloves are present and worn on at least one hand. IMPORTANT LIMITATION: You CANNOT determine electrical insulation class (Class 0, Class 00, Class 1 etc.) from visual inspection alone. Your job is limited to: PASS criteria (ALL must be true): - At least one hand have/has glove worn that are CLEARLY visible and WORN (not tucked in belt/pocket) - Glove material appears to be rubber or thick synthetic or combination of synthetic with cloth usually colors of yellow and grey, red and blue, or others combinations but NOT thin full latex/complete nitrile/complete cotton - Gloves extend past the wrist (gauntlet-style preferred, minimum to wrist line) - Gloves show no visible damage, cuts, tears, or punctures in visible areas FAIL criteria: - Bare hands visible or - Thin disposable gloves (latex, medical-style) these are NOT insulating gloves - No glove worn - Gloves not actually on hands (held or lying nearby) - Hands not in frame cannot assess - Image too blurry or dark to see glove texture STRICT rule: Do NOT pass Class verification. Output class_verified = false always. Class compliance requires physical certification tag check that is NOT your function. Respond ONLY in only ONE WORD FAIL or PASS Q96 : === MANDATORY IMAGE AUTHENTICITY CHECK (evaluate FIRST) === Before assessing any PPE, determine if this is a LIVE photo or a photo of a photo/screen. REJECT as SPOOF if ANY of the following are present: - A screen, monitor, tablet, or phone display is visible - Visible screen glare, pixel grid, moire pattern, or scan lines - A printed photo held or placed on a surface - Visible photo borders or edges - Nested image (image within image) - Reflection of camera/person on a screen - Strong compression artifacts or unnatural color banding - Device UI elements (timestamp, icons, overlays) - Scene appears flat with no natural depth/shadows If ANY spoof indicator is detected: ? spoof_detected = true ? result = FAIL ? STOP (Do NOT assess PPE) === PPE VALIDATION === You are a strict PPE compliance inspector for telecom tower operations in India. Task: Determine if valid head protection is CLEARLY VISIBLE. VALID head protection (PASS if clearly visible): - Type A: Construction helmet (hard hat) - Any color (including WHITE) - Must show a rigid dome shape - Brim/edge should be partially or fully visible - Type B: Turban (Pagri/Dastar) - Fully wrapped and structured - Clearly covers entire head REJECT (FAIL) if ANY apply: - Face occupies >60% of image (too close/selfie) - Image is blurry, dark, or low resolution - Top of head is cut off / not fully visible - Helmet is NOT clearly identifiable as a hard shell - Only a small/ambiguous portion of helmet is visible - Person is wearing cap, cloth, bandana, or non-PPE item - PPE is only in hand or background IMPORTANT RELAXATION: - Helmet strap visibility is NOT mandatory - Accept helmet if dome shape and structure are clearly visible - Do NOT reject valid white helmets due to lighting or low contrast STRICT RULES: - Do NOT infer from context (location, shadows, etc.) - Do NOT consider background helmets - If visibility is unclear ? FAIL === OUTPUT === Respond ONLY with: PASS or FAIL .if detected,also return PPE bounding box coordinates. Give Response in JSON object : {Q93 : \"{ \"Result\" : \"Your Answer\". \"Box\":[coordinates] , \"label\" :\" \"}\", Q98 : \"{ \"Result\" : \"Your Answer\". \"Box\":[coordinates] , \"label\" :\" \"}\", Q94 : \"{ \"Result\" : \"Your Answer\". \"Box\":[coordinates] , \"label\" :\" \"}\", Q96 : \"{ \"Result\" : \"Your Answer\". \"Box\":[coordinates] , \"label\" :\" \"}\"}\n";
            // photo_path = Extras.getString("photoPathUri");
            AI_type = Extras.getString("AI_type");
            quality = Extras.getString("quality");
            width = Extras.getString("width");
            height = Extras.getString("height");

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
            setup();

            CaptureImage.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    captureImage();
                }
            });
//            mButtonDone.setOnClickListener(v -> SendPluginSuccess());

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
        isFrontCamera = !isFrontCamera;


        if (isFrontCamera) {
            switchcamera.setImageResource(R.drawable.backcamera_foreground);
            textureView.setScaleX(-1);
        } else {
            switchcamera.setImageResource(R.drawable.frontcamera_foreground);
            textureView.setScaleX(1);
        }

        closeCamera();

        if (textureView.isAvailable()) {
            openCamera();
        } else {
            startCamera();
        }
    }

    private void closeCamera() {
        try {
            if (captureSession != null) {
                captureSession.close();
                captureSession = null;
            }

            if (cameraDevice != null) {
                cameraDevice.close();
                cameraDevice = null;
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void startCamera() {
        if (textureView.isAvailable()) {
            // TextureView is already ready → open now
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
        CameraManager manager = (CameraManager) getSystemService(Context.CAMERA_SERVICE);
        try {
            String selectedCameraId = null;

            for (String id : manager.getCameraIdList()) {
                CameraCharacteristics chars = manager.getCameraCharacteristics(id);
                Integer facing = chars.get(CameraCharacteristics.LENS_FACING);

                if (isFrontCamera) {
                    if (facing != null && facing == CameraCharacteristics.LENS_FACING_FRONT) {
                        selectedCameraId = id;
                        break;
                    }
                } else {
                    if (facing != null && facing == CameraCharacteristics.LENS_FACING_BACK) {
                        selectedCameraId = id;
                        break;
                    }
                }
            }

            // fallback
            if (selectedCameraId == null && manager.getCameraIdList().length > 0) {
                selectedCameraId = manager.getCameraIdList()[0];
            }

            if (ActivityCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
                return;
            }

            manager.openCamera(selectedCameraId, new CameraDevice.StateCallback() {
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
                    // Toast.makeText(CameraAITextActivity.this, "Camera error: " + error, Toast.LENGTH_SHORT).show();
                }
            }, null);
        } catch (Exception e) {
            e.printStackTrace();
            Toast.makeText(this, "openCamera failed: " + e.getMessage(), Toast.LENGTH_SHORT).show();
        }
    }


    private void createCameraPreview() {
        try {
            SurfaceTexture texture = textureView.getSurfaceTexture();
            if (texture == null || cameraDevice == null) return;

            texture.setDefaultBufferSize(textureView.getWidth(), textureView.getHeight());
            Surface surface = new Surface(texture);

            previewRequestBuilder = cameraDevice.createCaptureRequest(CameraDevice.TEMPLATE_PREVIEW);
            previewRequestBuilder.addTarget(surface);

            cameraDevice.createCaptureSession(Collections.singletonList(surface),
                    new CameraCaptureSession.StateCallback() {
                        @Override
                        public void onConfigured(@NonNull CameraCaptureSession session) {
                            if (cameraDevice == null) return;
                            captureSession = session;
                            updatePreview();
                        }
                        @Override
                        public void onConfigureFailed(@NonNull CameraCaptureSession session) {
                            Toast.makeText(CameraAITextActivity.this, "Preview config failed", Toast.LENGTH_SHORT).show();
                        }
                    }, null);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void updatePreview() {
        try {
            previewRequestBuilder.set(CaptureRequest.CONTROL_MODE, CameraMetadata.CONTROL_MODE_AUTO);

            // 🔑 Enable continuous autofocus for preview
            previewRequestBuilder.set(CaptureRequest.CONTROL_AF_MODE,
                    CaptureRequest.CONTROL_AF_MODE_CONTINUOUS_PICTURE);

            captureSession.setRepeatingRequest(previewRequestBuilder.build(), null, null);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }



    // Capture the image
    private void captureImage() {

        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (textureView.isAvailable()) {
                    // Get Bitmap from preview
                    selectedBitmap = textureView.getBitmap();

                    if (selectedBitmap != null) {

                        // Save the rotated bitmap to file
                        File pictureFile = getOutputMediaFile();
                        selectedBitmap = imageOreintationValidator(selectedBitmap, pictureFile.getAbsolutePath());
                        try (FileOutputStream fos = new FileOutputStream(pictureFile)) {
                            selectedBitmap.compress(Bitmap.CompressFormat.JPEG, Integer.parseInt(quality), fos);
                            fos.flush();

                            photo_path = pictureFile.getAbsolutePath();

                            // Update UI
                            mFrameLayout.setVisibility(View.GONE);
                            mLinearLayoutmain.setVisibility(View.GONE);
                            linearsecond.setVisibility(View.GONE);
                            imageView.setVisibility(View.GONE);
                            imageView.setImageBitmap(selectedBitmap);
                            PromptText.setVisibility(View.GONE);
                            PromptText.setText(promttext);

                            loadingOverlay.setVisibility(View.VISIBLE);
                            // Send to Gemini

                            new Thread(new Runnable() {
                                @Override
                                public void run() {
                                    runOnUiThread(new Runnable() {
                                        @Override
                                        public void run() {
                                            String prompt = PromptText.getText().toString();
                                            String base64Image = bitmapToBase64(selectedBitmap);
                                            sendToGemini(promttext, base64Image, "image/jpeg");
                                        }
                                    });
                                }
                            }).start();

                        } catch (IOException e) {
                            e.printStackTrace();
                            Toast.makeText(CameraAITextActivity.this,
                                    "Error saving image", Toast.LENGTH_SHORT).show();
                        }
                    } else {
                        Toast.makeText(CameraAITextActivity.this, "Failed to capture image", Toast.LENGTH_SHORT).show();
                    }
                }
            }
        });

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
        super.onPause();
        if (camera != null) {
            camera.stopPreview();
            camera.release();
            camera = null;
        }
    }

    public void setup()
    {
        if (!checkCameraPermission()) {
            requestCameraPermission();
            return;
        }

//        if(AI_type.equalsIgnoreCase("document"))
//        {
//            opendocument();
//        }
//        else {
//
//            startCamera();
//        }

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
                    // Toast.makeText(getApplicationContext(), "Permission Granted", Toast.LENGTH_SHORT).show();
                    setup();
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
        new AlertDialog.Builder(CameraAITextActivity.this)
                .setMessage(message)
                .setPositiveButton("OK", okListener)
                .setCancelable(false)
                .create()
                .show();
    }
//    private void openCamera() {
//        Intent cameraIntent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
//        if (cameraIntent.resolveActivity(getPackageManager()) != null) {
//            startActivityForResult(cameraIntent, REQUEST_IMAGE_CAPTURE);
//        }
//    }



    private void opendocument()
    {
        Intent photoPickerIntent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        photoPickerIntent.addCategory(Intent.CATEGORY_OPENABLE);

        photoPickerIntent.setType("*/*");
//        String[] mimetypes   = new String[]{ "application/pdf", "image/*"};
        String[] mimetypes   = new String[]{"image/*"};
        photoPickerIntent.putExtra(Intent.EXTRA_MIME_TYPES, mimetypes);
        startActivityForResult(photoPickerIntent, SELECT_PDF);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        switch (requestCode) {

            case REQUEST_IMAGE_CAPTURE:
                if (resultCode == RESULT_OK) {
                    Bundle extras = data.getExtras();
                    selectedBitmap= (Bitmap) extras.get("data");
                    //   mainlinear.setVisibility(View.VISIBLE);
                    photo_path = saveBitmapToFile(selectedBitmap, this);
                    imageView.setVisibility(View.GONE);
                    imageView.setImageBitmap(selectedBitmap);
                    PromptText.setVisibility(View.GONE);
                    PromptText.setText(promttext);

                    String prompt = PromptText.getText().toString();
                    String base64Image = bitmapToBase64(selectedBitmap);
                    sendToGemini(promttext,base64Image,"image/jpeg");
                }
                else {

                    Bundle b = new Bundle();

                    Intent intent = new Intent();
                    intent.putExtras(b);
                    setResult(RESULT_CANCELED, intent);

                    finish();

                }
                break;

            case SELECT_PDF:
                if (resultCode == RESULT_OK) {
                    try {
                        final Uri imageUri = data.getData();
                        photo_path = getPath(context, imageUri);
                        if (photo_path == null) {
                            photo_path = data.getData().getPath();
                        }
                        File f = new File(photo_path);
                        File file = new File(photo_path);
                        long lengthoffile = file.length();
                        lengthoffile = lengthoffile / 1024;

                        int filesize = Integer.parseInt("5") * 1000;
                        //Only Less than 5MB of file size allowed
                        if (lengthoffile < filesize) {
                            String path = file.getAbsolutePath();
                            String filename = path.substring(path.lastIndexOf("/") + 1);


                            extension = filename.substring(filename.lastIndexOf("."));

                            if(extension.contains(".pdf"))
                            {
                                mimtypeforapi = "application/pdf";
                                imageView.setImageResource(R.drawable.documentlogo);
                            }
                            else {
                                mimtypeforapi = "image/jpeg";
                                // imageView.setImageURI(imageUri);
                                Bitmap geminiBitmap = uriToBitmap(imageUri);

                                geminiBitmap = imageOreintationValidator(geminiBitmap, photo_path);
                                selectedBitmap = geminiBitmap;
                            }
                            runOnUiThread(() -> {
                                mFrameLayout.setVisibility(View.GONE);
                                loadingOverlay.setVisibility(View.VISIBLE);
                            });


//                            mLinearLayoutmain.setVisibility(View.GONE);
//                            linearsecond.setVisibility(View.GONE);
//                            imageView.setVisibility(View.GONE);
//                            pdftext.setVisibility(View.GONE);
//                            pdftext.setText(filename);
//                            PromptText.setVisibility(View.GONE);
//                            PromptText.setText(promttext);
                             String prompt = PromptText.getText().toString();

                            new Thread(new Runnable() {
                                @Override
                                public void run() {
                                    runOnUiThread(new Runnable() {
                                        @Override
                                        public void run() {
                                            String base64Image;
                                            if(extension.contains(".pdf"))
                                            {
                                                base64Image = convertPdfToBase64(imageUri);
                                            }
                                            else {
                                                base64Image = bitmapToBase64(selectedBitmap);
                                            }
                                            sendToGemini(promttext,base64Image,mimtypeforapi);
                                        }
                                    });
                                }
                            }).start();

                        }
                    } catch (Exception e) {
                        throw new RuntimeException(e);
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
    private Bitmap uriToBitmap(Uri uri) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                ImageDecoder.Source source = ImageDecoder.createSource(getContentResolver(), uri);
                return ImageDecoder.decodeBitmap(source);
            } else {
                // For older Android versions
                return MediaStore.Images.Media.getBitmap(getContentResolver(), uri);
            }
        } catch (IOException e) {
            e.printStackTrace();
            return null;
        }
    }


    public String saveBitmapToFile(Bitmap bitmap, Context context) {
        //Bitmap resizedBitmap = Bitmap.createScaledBitmap(bitmap, Integer.parseInt(width), Integer.parseInt(height), true);

        String dir = Environment.getExternalStorageDirectory()
                + File.separator + "myDirectory";
        // create folder
        File folder = new File(dir); // folder name
        folder.mkdirs();
        // create file
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

    // call api for firebase ai model name base
    private void sendToGemini(String prompt, String base64Image,String mimtype) {
        // ⌨️ Hide keyboard
        InputMethodManager imm = (InputMethodManager) getSystemService(Context.INPUT_METHOD_SERVICE);
        View view = this.getCurrentFocus();
        if (view != null) {
            imm.hideSoftInputFromWindow(view.getWindowToken(), 0);
        }


        progressBar.setVisibility(View.GONE);

        GeminiClient.sendPrompt(prompt, base64Image, modelname,mimtype , new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                runOnUiThread(() -> {
                    progressBar.setVisibility(View.GONE);
                    mLinearLayout.setVisibility(View.GONE);
                    textOutput.setVisibility(View.GONE);
                    textOutput.setText("Error: " + e.getMessage());
                    SendPluginfailed("Error: " + e.getMessage());
                });
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                String json = "";

                if (response.isSuccessful()) {
                    json  = response.body().string();
                }
                else {
                    try{
                        json = response.body().string();
                        Log.d("json",json);
                        JSONObject mjson = new JSONObject(json);
                        String code = mjson.getJSONObject("error").getString("code");
                        String message = mjson.getJSONObject("error").getString("message");
                        new Handler(Looper.getMainLooper()).post(new Runnable() {
                            public void run() {
                                ToastUtil.show(sqlitewraper.context,  "Firebase Api Response code: " + code + "\n message:" + message);

                               // Toast.makeText(CameraAITextActivity.this, " Firebase Api Response : " + message, Toast.LENGTH_LONG).show();
                            }
                        });
                        CameraAITextActivity.this.finish();

                    }
                    catch (Exception e)
                    {
                    }
                }

                String finalJson = json;
                runOnUiThread(() -> {
                    progressBar.setVisibility(View.GONE);

                    try {
                        JsonObject obj = JsonParser.parseString(finalJson).getAsJsonObject();
                        String result = obj.getAsJsonArray("candidates")
                                .get(0).getAsJsonObject()
                                .getAsJsonObject("content")
                                .getAsJsonArray("parts")
                                .get(0).getAsJsonObject()
                                .get("text").getAsString();
                       // mLinearLayout.setVisibility(View.GONE);
                       // textOutput.setVisibility(View.GONE);
                        //textOutput.setText(result);
//                        mButtonDone.setVisibility(View.VISIBLE);

                      //  Log.d("Result",finalJson);

                        Bitmap mutableBitmap = selectedBitmap.copy(Bitmap.Config.ARGB_8888, true);
//                        JSONObject jsonObject = new JSONObject(result);
//
//                        String status = jsonObject.getString("Result");
//                        String label = jsonObject.getString("label");
//
//                        JSONArray boxArray = jsonObject.getJSONArray("Box");
//
//
//                            int top = boxArray.getInt(0);
//                            int left = boxArray.getInt(1);
//                            int bottom = boxArray.getInt(2);
//                            int right = boxArray.getInt(3);
//
//                            Log.d("BOX",
//                                    "left=" + left +
//                                            " top=" + top +
//                                            " right=" + right +
//                                            " bottom=" + bottom);
//                            Canvas canvas = new Canvas(mutableBitmap);
//
//                            Paint boxPaint = new Paint();
//                            boxPaint.setColor(Color.RED);
//                            boxPaint.setStyle(Paint.Style.STROKE);
//                            boxPaint.setStrokeWidth(10);
//
//                            Paint textPaint = new Paint();
//                            textPaint.setColor(Color.RED);
//                            textPaint.setTextSize(60);
//                            textPaint.setStyle(Paint.Style.FILL);
//
//                            float scaledLeft =
//                                    (left / 1000f) * mutableBitmap.getWidth();
//
//                            float scaledTop =
//                                    (top / 1000f) * mutableBitmap.getHeight();
//
//                            float scaledRight =
//                                    (right / 1000f) * mutableBitmap.getWidth();
//
//                            float scaledBottom =
//                                    (bottom / 1000f) * mutableBitmap.getHeight();
//
//                            canvas.drawRect(
//                                    scaledLeft,
//                                    scaledTop,
//                                    scaledRight,
//                                    scaledBottom,
//                                    boxPaint
//                            );
//
//                            // Draw label
//                            canvas.drawText(
//                                    "",
//                                    left,
//                                    top - 20,
//                                    textPaint
//                            );

                        result = cleanJson(result);
                        Log.d("Result cleanJson",result);


                        if (!result.startsWith("{")
                                && !result.startsWith("[")) {

                            Log.d("PLAIN_TEXT", result);
                            textOutput.setText(result);
                            loadingOverlay.setVisibility(View.GONE);
                            SendPluginSuccess(result);
                            return;
                        }

                        Canvas canvas = new Canvas(mutableBitmap);

                        Paint boxPaint = new Paint();
                        boxPaint.setColor(Color.RED);
                        boxPaint.setStyle(Paint.Style.STROKE);
                        boxPaint.setStrokeWidth(5);

                        Paint textPaint = new Paint();
                        textPaint.setColor(Color.RED);
                        textPaint.setTextSize(13);
                        textPaint.setStyle(Paint.Style.FILL);


                        JSONObject root = new JSONObject(result);
                        if (root.has("Result")) {

                            drawDetection(root, canvas,
                                    mutableBitmap,
                                    boxPaint,
                                    textPaint);

                        }
                        else {

                            Iterator<String> keys = root.keys();

                            while (keys.hasNext()) {

                                String key = keys.next();

                                Object value = root.get(key);


                                if (value instanceof JSONObject) {

                                    JSONObject item =
                                            (JSONObject) value;

                                    drawDetection(
                                            item,
                                            canvas,
                                            mutableBitmap,
                                            boxPaint,
                                            textPaint
                                    );
                                }


                                else if (value instanceof String) {

                                    String itemString =
                                            (String) value;

                                    JSONObject converted = new JSONObject(itemString);

                                    if (converted != null) {

                                        drawDetection(
                                                converted,
                                                canvas,
                                                mutableBitmap,
                                                boxPaint,
                                                textPaint
                                        );
                                    }
                                }
                            }
                        }


                            String dir = Environment.getExternalStorageDirectory()
                                    + File.separator + "ATC_AIImage";

                            File folder = new File(dir); // folder name
                            folder.mkdirs();

                            String name = "AI_" + System.currentTimeMillis() + ".jpeg";
                            File finalFile = new File(dir, name);

                            FileOutputStream out = new FileOutputStream(finalFile);

                            mutableBitmap.compress(
                                    Bitmap.CompressFormat.JPEG,
                                    100,
                                    out
                            );

                            out.flush();
                            out.close();

                            photo_path = finalFile.getAbsolutePath();
//                            Log.d("SavedImage", finalFile.getAbsolutePath());
//
//                            Toast.makeText(
//                                    CameraAITextActivity.this,
//                                    "Saved: " + finalFile.getAbsolutePath(),
//                                    Toast.LENGTH_LONG
//                            ).show();



                        textOutput.setText(result);

                        loadingOverlay.setVisibility(View.GONE);

                        SendPluginSuccess(result);

                    } catch (Exception e) {
                        SendPluginfailed(e.toString());
                        Log.d("Failed to parse response",e.toString());
                        textOutput.setText("Failed to parse response");
                    }
                });
            }
        });
    }

//    private JSONObject convertStringToJson(String text) {
//
//        try {
//
//            JSONObject obj = new JSONObject();
//
//            Matcher resultMatcher = Pattern.compile("Result\\s*:\\s*\"(.*?)\"").matcher(text);
//
//            if (resultMatcher.find()) {
//
//                obj.put("Result", resultMatcher.group(1));
//            }
//
//            Matcher labelMatcher = Pattern.compile("label\\s*:\\s*\"(.*?)\"").matcher(text);
//
//            if (labelMatcher.find()) {
//                obj.put("label", labelMatcher.group(1));
//            }
//
//            Matcher boxMatcher =
//                    Pattern.compile("\\[(.*?)\\]").matcher(text);
//
//            if (boxMatcher.find()) {
//
//                String[] nums =
//                        boxMatcher.group(1)
//                                .split(",");
//
//                JSONArray arr =
//                        new JSONArray();
//
//                for (String n : nums) {
//                    arr.put(Integer.parseInt(n.trim()));
//                }
//
//                obj.put("Box", arr);
//            }
//
//            return obj;
//
//        } catch (Exception e) {
//            e.printStackTrace();
//        }
//
//        return null;
//    }

    private String cleanJson(String text) {

        text = text
                .replace("```json", "")
                .replace("```", "")
                .trim();

        return text.trim();
    }
    private void drawDetection(
            JSONObject item,
            Canvas canvas,
            Bitmap bitmap,
            Paint boxPaint,
            Paint textPaint) {

        try {

            String status = item.getString("Result");

            if (!status.equalsIgnoreCase("PASS")) {
                return;
            }

            String label = item.optString("label", "");

            JSONArray boxArray = item.getJSONArray("Box");

            int top = boxArray.getInt(0);
            int left = boxArray.getInt(1);
            int bottom = boxArray.getInt(2);
            int right = boxArray.getInt(3);

            float scaledLeft =
                    (left / 1000f) * bitmap.getWidth();

            float scaledTop =
                    (top / 1000f) * bitmap.getHeight();

            float scaledRight =
                    (right / 1000f) * bitmap.getWidth();

            float scaledBottom =
                    (bottom / 1000f) * bitmap.getHeight();

            canvas.drawRect(
                    scaledLeft,
                    scaledTop,
                    scaledRight,
                    scaledBottom,
                    boxPaint
            );

            canvas.drawText(
                    "",
                    scaledLeft,
                    scaledTop - 10,
                    textPaint
            );

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private String bitmapToBase64(Bitmap bitmap) {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        bitmap.compress(Bitmap.CompressFormat.JPEG, Integer.parseInt(quality), output);
        return Base64.encodeToString(output.toByteArray(), Base64.NO_WRAP);
    }


    private String convertPdfToBase64(Uri pdfUri)  {
        try {
            InputStream inputStream = getContentResolver().openInputStream(pdfUri);
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            byte[] buffer = new byte[1024];
            int bytesRead;

            while ((bytesRead = inputStream.read(buffer)) != -1) {
                outputStream.write(buffer, 0, bytesRead);
            }

            byte[] pdfBytes = outputStream.toByteArray();
            return Base64.encodeToString(pdfBytes, Base64.NO_WRAP);
        } catch (Exception e) {
//            throw new RuntimeException(e);
            return e.toString();
        }

    }

    private void SendPluginSuccess(String result)
    {

        try{
            Intent resultIntent = new Intent();
            JSONArray mJsonArray = new JSONArray();
            JSONObject mJsonObject = new JSONObject();
            mJsonObject.put("photo_path", photo_path);
            mJsonObject.put("responsetext", result);
            mJsonArray.put(mJsonObject);
//            pref.putString("responsetext",textOutput.getText().toString());
//            pref.commit();
            resultIntent.putExtra("response",mJsonArray.toString());
            setResult(RESULT_OK, resultIntent);
            finish();
            overridePendingTransition(0,0);
        }
        catch (Exception e)
        {

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

    public static String getPath(final Context context, final Uri uri) {

        final boolean isKitKat = Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT;
        String filePath = "";
        // DocumentProvider
        if (isKitKat && DocumentsContract.isDocumentUri(context, uri)) {
            // ExternalStorageProvider
            if (isExternalStorageDocument(uri)) {
                final String docId = DocumentsContract.getDocumentId(uri);
                final String[] split = docId.split(":");
                final String type = split[0];

                if ("primary".equalsIgnoreCase(type)) {
                    return Environment.getExternalStorageDirectory() + "/"
                            + split[1];
                } else {

                    filePath = "/storage/" + type + "/" + split[1];
                    return filePath;
                }


                // TODO handle non-primary volumes
            }
            // DownloadsProvider
            else if (isDownloadsDocument(uri)) {
                final String id = DocumentsContract.getDocumentId(uri);
                if (id != null && id.startsWith("raw:")) {
                    return id.substring(4);
                }
                String[] contentUriPrefixesToTry = new String[]{
                        "content://downloads/public_downloads",
                        "content://downloads/my_downloads",
                        "content://downloads/all_downloads"
                };
                for (String contentUriPrefix : contentUriPrefixesToTry) {
                    try {
                        Uri  contentUri = ContentUris.withAppendedId(Uri.parse(contentUriPrefix), Long.valueOf(id));
                        return getDataColumn(context, contentUri, null, null);
                    } catch (NumberFormatException e) {
                        //In Android 8 and Android P the id is not a number
                        return uri.getPath().replaceFirst("^/document/raw:", "").replaceFirst("^raw:", "");
                    }
                }
            }
            // MediaProvider
            else if (isMediaDocument(uri)) {
                final String docId = DocumentsContract.getDocumentId(uri);
                final String[] split = docId.split(":");
                final String type = split[0];

                Uri contentUri = null;
                if ("image".equals(type)) {
                    contentUri = MediaStore.Images.Media.EXTERNAL_CONTENT_URI;
                } else if ("video".equals(type)) {
                    contentUri = MediaStore.Video.Media.EXTERNAL_CONTENT_URI;
                } else if ("audio".equals(type)) {
                    contentUri = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI;
                } else {
                    contentUri = MediaStore.Files.getContentUri("external");
                }

                final String selection = "_id=?";
                final String[] selectionArgs = new String[]{split[1]};

                return getDataColumn(context, contentUri, selection,
                        selectionArgs);
            }
        }
        // MediaStore (and general)
        else if ("content".equalsIgnoreCase(uri.getScheme())) {

            // Return the remote address
            if (isGooglePhotosUri(uri))
                return uri.getLastPathSegment();

            return getDataColumn(context, uri, null, null);
        }
        // File
        else if ("file".equalsIgnoreCase(uri.getScheme())) {
            return uri.getPath();
        }

        return null;
    }


    public static String getDataColumn(Context context, Uri uri,
                                       String selection, String[] selectionArgs) {

        Cursor cursor = null;
        final String column = "_data";
        final String[] projection = {column};

        try {
            cursor = context.getContentResolver().query(uri, projection,
                    selection, selectionArgs, null);
            if (cursor != null && cursor.moveToFirst()) {
                final int index = cursor.getColumnIndexOrThrow(column);
                return cursor.getString(index);
            }
        } finally {
            if (cursor != null)
                cursor.close();
        }
        return null;
    }


    public static boolean isExternalStorageDocument(Uri uri) {
        return "com.android.externalstorage.documents".equals(uri
                .getAuthority());
    }

    /**
     * @param uri The Uri to check.
     * @return Whether the Uri authority is DownloadsProvider.
     */
    public static boolean isDownloadsDocument(Uri uri) {
        return "com.android.providers.downloads.documents".equals(uri
                .getAuthority());
    }

    /**
     * @param uri The Uri to check.
     * @return Whether the Uri authority is MediaProvider.
     */
    public static boolean isMediaDocument(Uri uri) {
        return "com.android.providers.media.documents".equals(uri
                .getAuthority());
    }

    /**
     * @param uri The Uri to check.
     * @return Whether the Uri authority is Google Photos.
     */
    public static boolean isGooglePhotosUri(Uri uri) {
        return "com.google.android.apps.photos.content".equals(uri
                .getAuthority());
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
