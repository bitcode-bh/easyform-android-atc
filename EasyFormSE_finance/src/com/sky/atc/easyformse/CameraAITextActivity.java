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
import android.graphics.Matrix;
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
import android.view.Surface;
import android.view.TextureView;
import android.view.View;
import android.view.inputmethod.InputMethodManager;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.ScrollView;
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
    ImageView CaptureImage;
    FrameLayout mFrameLayout;
    ScrollView mScrollView;
    LinearLayout mLinearLayoutmain;
    int rot = 0;
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
        mScrollView = findViewById(R.id.scrollview);
        textureView = findViewById(R.id.textureView);
        mLinearLayoutmain = findViewById(R.id.linearmain);


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
            mButtonDone.setOnClickListener(v -> SendPluginSuccess());


        }
        catch (Exception e)
        {

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
            String backCameraId = null;
            for (String id : manager.getCameraIdList()) {
                CameraCharacteristics chars = manager.getCameraCharacteristics(id);
                Integer facing = chars.get(CameraCharacteristics.LENS_FACING);
                if (facing != null && facing == CameraCharacteristics.LENS_FACING_BACK) {
                    backCameraId = id;
                    break;
                }
            }
            if (backCameraId == null && manager.getCameraIdList().length > 0) {
                backCameraId = manager.getCameraIdList()[0]; // fallback
            }
            if (ActivityCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
                return;
            }
            manager.openCamera(backCameraId, new CameraDevice.StateCallback() {
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
                    Toast.makeText(CameraAITextActivity.this, "Camera error: " + error, Toast.LENGTH_SHORT).show();
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
                    mLinearLayoutmain.setVisibility(View.VISIBLE);
                    mScrollView.setVisibility(View.VISIBLE);
                    imageView.setVisibility(View.VISIBLE);
                    imageView.setImageBitmap(selectedBitmap);
                    PromptText.setVisibility(View.VISIBLE);
                    PromptText.setText(promttext);

                    // Send to Gemini
                    String prompt = PromptText.getText().toString();
                    String base64Image = bitmapToBase64(selectedBitmap);
                    sendToGemini(prompt, base64Image, "image/jpeg");

                } catch (IOException e) {
                    e.printStackTrace();
                    Toast.makeText(CameraAITextActivity.this,
                            "Error saving image", Toast.LENGTH_SHORT).show();
                }
            } else {
                Toast.makeText(this, "Failed to capture image", Toast.LENGTH_SHORT).show();
            }
        }
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

        if(AI_type.equalsIgnoreCase("document"))
        {
            opendocument();
        }
        else {
            startCamera();

        }
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
        String[] mimetypes   = new String[]{ "application/pdf", "image/*"};

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
                    imageView.setVisibility(View.VISIBLE);
                    imageView.setImageBitmap(selectedBitmap);
                    PromptText.setVisibility(View.VISIBLE);
                    PromptText.setText(promttext);

                    String prompt = PromptText.getText().toString();
                    String base64Image = bitmapToBase64(selectedBitmap);
                    sendToGemini(prompt,base64Image,"image/jpeg");
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
                            }
                            else {
                                mimtypeforapi = "image/jpeg";
                            }
                            mFrameLayout.setVisibility(View.GONE);
                            mLinearLayoutmain.setVisibility(View.VISIBLE);
                            mScrollView.setVisibility(View.VISIBLE);
                            imageView.setVisibility(View.VISIBLE);
                            pdftext.setVisibility(View.VISIBLE);
                            pdftext.setText(filename);
                            imageView.setImageResource(R.drawable.documentlogo);
                            PromptText.setVisibility(View.VISIBLE);
                            PromptText.setText(promttext);

                            String prompt = PromptText.getText().toString();
                            String base64Image = convertPdfToBase64(imageUri);
                            sendToGemini(prompt,base64Image,mimtypeforapi);

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


        progressBar.setVisibility(View.VISIBLE);

        GeminiClient.sendPrompt(prompt, base64Image, modelname,mimtype , new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                runOnUiThread(() -> {
                    progressBar.setVisibility(View.GONE);
                    mLinearLayout.setVisibility(View.VISIBLE);
                    textOutput.setVisibility(View.VISIBLE);
                    textOutput.setText("Error: " + e.getMessage());
                });
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                String json;
                if (response.isSuccessful()) {
                    json  = response.body().string();
                }
                else {
                    json = response.body().string();
                    new Handler(Looper.getMainLooper()).post(new Runnable() {
                        public void run() {
                            Toast.makeText(CameraAITextActivity.this, " Firebase Api Response : " + json, Toast.LENGTH_LONG).show();
                        }
                    });

                    CameraAITextActivity.this.finish();
                }

                runOnUiThread(() -> {
                    progressBar.setVisibility(View.GONE);

                    try {
                        JsonObject obj = JsonParser.parseString(json).getAsJsonObject();
                        String result = obj.getAsJsonArray("candidates")
                                .get(0).getAsJsonObject()
                                .getAsJsonObject("content")
                                .getAsJsonArray("parts")
                                .get(0).getAsJsonObject()
                                .get("text").getAsString();
                        mLinearLayout.setVisibility(View.VISIBLE);
                        textOutput.setVisibility(View.VISIBLE);
                        textOutput.setText(result);
                        mButtonDone.setVisibility(View.VISIBLE);
                    } catch (Exception e) {
                        textOutput.setText("Failed to parse response");
                    }
                });
            }
        });
    }

    private String bitmapToBase64(Bitmap bitmap) {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        bitmap.compress(Bitmap.CompressFormat.JPEG, Integer.parseInt(quality), output);
        return Base64.encodeToString(output.toByteArray(), Base64.NO_WRAP);
    }


    private String convertPdfToBase64(Uri pdfUri) throws IOException {
        InputStream inputStream = getContentResolver().openInputStream(pdfUri);
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        byte[] buffer = new byte[1024];
        int bytesRead;

        while ((bytesRead = inputStream.read(buffer)) != -1) {
            outputStream.write(buffer, 0, bytesRead);
        }

        byte[] pdfBytes = outputStream.toByteArray();
        return Base64.encodeToString(pdfBytes, Base64.NO_WRAP);
    }

    private void SendPluginSuccess()
    {

        try{
            Intent resultIntent = new Intent();
            JSONArray mJsonArray = new JSONArray();
            JSONObject mJsonObject = new JSONObject();
            mJsonObject.put("photo_path", photo_path);
            mJsonObject.put("responsetext", textOutput.getText().toString());
            mJsonArray.put(mJsonObject);
//            pref.putString("responsetext",textOutput.getText().toString());
//            pref.commit();
            resultIntent.putExtra("response",mJsonArray.toString());
            setResult(RESULT_OK, resultIntent);
            finish();
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
