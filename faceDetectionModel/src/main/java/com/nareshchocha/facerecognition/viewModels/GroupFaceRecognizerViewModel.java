package com.nareshchocha.facerecognition.viewModels;

import android.annotation.SuppressLint;
import android.content.Context;
import android.content.res.AssetFileDescriptor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.ImageFormat;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.YuvImage;
import android.media.Image;
import android.os.Build;
import android.os.Handler;
import android.os.StrictMode;
import android.util.Log;
import android.util.Pair;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.face.Face;
import com.google.mlkit.vision.face.FaceDetection;
import com.google.mlkit.vision.face.FaceDetector;
import com.google.mlkit.vision.face.FaceDetectorOptions;
import com.nareshchocha.facerecognition.model.SimilarityClassifier;
import com.nareshchocha.facerecognition.utils.AppConstants;
import com.nareshchocha.facerecognition.utils.Utils;

import org.tensorflow.lite.Interpreter;
import org.tensorflow.lite.gpu.CompatibilityList;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.MappedByteBuffer;
import java.nio.ReadOnlyBufferException;
import java.nio.channels.FileChannel;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Created by NareshChocha on 4/18/2022.
 *
 * @author NareshChocha
 */
public class GroupFaceRecognizerViewModel extends ViewModel {

    private final MutableLiveData<Boolean> _isLoadingData = new MutableLiveData<>(true);
    public LiveData<Boolean> isLoadingData = _isLoadingData;

    private final MutableLiveData<Map<Boolean, String>> _messages = new MutableLiveData<>();
    public LiveData<Map<Boolean, String>> messages = _messages;

    private final MutableLiveData<List<Pair<Boolean, String>>> _faceDetectionMessage = new MutableLiveData<>();
    public LiveData<List<Pair<Boolean, String>>> faceDetectionMessage = _faceDetectionMessage;


//    private final MutableLiveData<Map<Boolean, String>> _faceDetectionMessage = new MutableLiveData<>();
//    public LiveData<Map<Boolean, String>> faceDetectionMessage = _faceDetectionMessage;

    private final MutableLiveData<Map<Boolean, String>> _eyeOpenMessage = new MutableLiveData<>();
    public LiveData<Map<Boolean, String>> eyeOpenMessage = _eyeOpenMessage;

    private final MutableLiveData<Map<Boolean, String>> _eyeCloseMessage = new MutableLiveData<>();
    public LiveData<Map<Boolean, String>> eyeCloseMessage = _eyeCloseMessage;

    private final MutableLiveData<File> _detectedFile = new MutableLiveData<>();
    public LiveData<File> detectedFile = _detectedFile;

    public LiveData<Boolean> getIsLoadingData() {
        return isLoadingData;
    }


    public FaceDetector mFaceDetector;
    Interpreter tfLiteInterpreter;
    @SuppressLint("StaticFieldLeak")
    Context mContext;

    ExecutorService mExecutorService;

    int[] intValues;
    boolean isModelQuantized = false;
    float IMAGE_MEAN = 127.5f;
    float IMAGE_STD = 127.5f;

    int openEye = 0;
    int closeEye = 0;
    List<File> imageFileList = new ArrayList<>();
    private final HashMap<String, SimilarityClassifier.Recognition> registered; //saved Faces

    private int currentImageIndex = 0;
    private List<File> fileListToLoad = new ArrayList<>();
    private int faceIndex;

    public GroupFaceRecognizerViewModel(Context context, List<String> filePath) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            mExecutorService = Executors.newWorkStealingPool(4);
        } else {
            mExecutorService = Executors.newFixedThreadPool(4);
        }
        this.mContext = context;
        registered = new HashMap<>();
        loadModelAndFaceDetection(filePath);
    }

    void loadModelAndFaceDetection(List<String> filePath) {
        mExecutorService.execute(() -> {
            FaceDetectorOptions highAccuracyOpts =
                    new FaceDetectorOptions.Builder()
                            .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_FAST)
                            .setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_ALL)
                            .setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_ALL)
                            .setContourMode(FaceDetectorOptions.CONTOUR_MODE_ALL)
                            .build();
            mFaceDetector = FaceDetection.getClient(highAccuracyOpts);
            try {
                Interpreter.Options options = new Interpreter.Options().setUseXNNPACK(true);

                if (new CompatibilityList().isDelegateSupportedOnThisDevice()) {
                    Log.d("Loadingmodel", "addDelegate");
                    // options.addDelegate(new GpuDelegate(new CompatibilityList().getBestOptionsForThisDevice()));
                } else {
                    options.setNumThreads(4);
                }
                tfLiteInterpreter = new Interpreter(loadModelFile(mContext), options);
                getFileLists(filePath);
            } catch (Exception e) {
                Log.e("Loadingmodel", e.toString());
                e.printStackTrace();
            }
        });
    }

    private MappedByteBuffer loadModelFile(@NonNull Context context) throws IOException {
        AssetFileDescriptor fileDescriptor = context.getAssets().openFd(AppConstants.modelFile);
        FileInputStream inputStream = new FileInputStream(fileDescriptor.getFileDescriptor());
        FileChannel fileChannel = inputStream.getChannel();
        long startOffset = fileDescriptor.getStartOffset();
        long declaredLength = fileDescriptor.getDeclaredLength();
        return fileChannel.map(FileChannel.MapMode.READ_ONLY, startOffset, declaredLength);
    }


    private void getFileLists(@NonNull List<String> filePaths) {
        mExecutorService.execute(() -> {
            _isLoadingData.postValue(true);

            Map<Boolean, String> stringMap = new HashMap<>();
            stringMap.put(false, "Images Are Loading");
            _messages.postValue(stringMap);


            for (String path : filePaths) {
                File imageFile = new File(path);
                if (imageFile.exists() && imageFile.isFile() && AppConstants.isImage(imageFile)) {
                    imageFileList.add(imageFile);
                } else {
                    Log.d("Error", "File not valid or doesn't exist: " + path);
                }
            }

            if (!imageFileList.isEmpty()) {
                LoadImageFrom(imageFileList);
            } else {
                Map<Boolean, String> stringMapTwo = new HashMap<>();
                stringMapTwo.put(true, "Image Files not Found");
                _messages.postValue(stringMapTwo);
                Log.d("Error", "No valid image files found.");
            }

            _isLoadingData.postValue(false);
        });
    }

    private void processNextImage() {
        if (currentImageIndex >= fileListToLoad.size()) {
            _isLoadingData.postValue(false);
            Map<Boolean, String> stringMap = new HashMap<>();
            stringMap.put(false, "Images are Loaded");
            _messages.postValue(stringMap);
            return;
        }

        if (imageFileList.size() > 0) {
            File imageFile = imageFileList.get(currentImageIndex);
            Bitmap bitmap = AppConstants.getRotateBitmap(imageFile.getAbsolutePath());

            if (bitmap != null) {
                InputImage inputImage = InputImage.fromBitmap(bitmap, 0);
                mFaceDetector.process(inputImage).addOnSuccessListener(faces -> {
                    if (faces.size() > 0) {
                        int faceCount = 0;
                        for (Face face : faces) {
//                            Face face = faces.get(0);
                            Log.d("face match", String.valueOf(faces.size()));
                            Bitmap frame_bmp1 = rotateBitmap(bitmap, 0, false, false);
                            RectF boundingBox = new RectF(face.getBoundingBox());
                            Bitmap cropped_face = getCropBitmapByCPU(frame_bmp1, boundingBox);
                            Log.d("AddedF", "Done " + imageFile.getName());
                            if (cropped_face != null) {
                                Utils.writeLogToFile(mContext, "FilePath : " + imageFile.getAbsolutePath(), "LoadImageFrom ");
                                String personName = "Person_" + (currentImageIndex + 1); // or use imageFile.getName()
                                addImage(getResizedBitmap(cropped_face, AppConstants.modelInputSize, AppConstants.modelInputSize), personName);
                            }


                            faceCount++;

                            // imageFileList.remove(imageFile);
                            // LoadImageFrom(imageFileList);
                        }
                    } else {
                        // _isLoadingData.postValue(false);
                        Map<Boolean, String> stringMap = new HashMap<>();
                        stringMap.put(true, "Face is not detected This Image Please Change Image");
                        _messages.postValue(stringMap);
                    }

                    // Proceed to next image
                    currentImageIndex++;
                    processNextImage();
                }).addOnFailureListener(e -> {
                    Map<Boolean, String> stringMap = new HashMap<>();
                    stringMap.put(true, " Failure Face is not detected " + e);
                    _messages.postValue(stringMap);
                    Log.e("detectorF", e.toString());
                    currentImageIndex++;
                    processNextImage();
                });
            } else {
                // _isLoadingData.postValue(false);
                Map<Boolean, String> stringMap = new HashMap<>();
                stringMap.put(true, " Image File has Same Problem Please Change Image");
                _messages.postValue(stringMap);
            }
        } else {
            _isLoadingData.postValue(false);
            Map<Boolean, String> stringMap = new HashMap<>();
            stringMap.put(false, "Images are Loaded");
            _messages.postValue(stringMap);
            currentImageIndex++;
            processNextImage();
        }
    }

    void LoadImageFrom(@NonNull List<File> imageFileList) {

        StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
        StrictMode.setThreadPolicy(policy);

        fileListToLoad.clear();
        fileListToLoad.addAll(imageFileList);
        currentImageIndex = 0;
        processNextImage();


    }

    public Bitmap rotateBitmap(
            Bitmap bitmap, int rotationDegrees, boolean flipX, boolean flipY) {
        Matrix matrix = new Matrix();

        if (bitmap == null) {
            return null;
        }
        // Rotate the image back to straight.
        matrix.postRotate(rotationDegrees);

        // Mirror the image along the X or Y axis.
        matrix.postScale(flipX ? -1.0f : 1.0f, flipY ? -1.0f : 1.0f);
        Bitmap rotatedBitmap =
                Bitmap.createBitmap(bitmap, 0, 0, bitmap.getWidth(), bitmap.getHeight(), matrix, true);

        // Recycle the old bitmap if it has changed.
        if (rotatedBitmap != bitmap) {
            bitmap.recycle();
        }
        return rotatedBitmap;
    }

    public Bitmap getCropBitmapByCPU(Bitmap source, @NonNull RectF cropRectF) {
        if (source == null) {
            Log.e("CropBitmap", "Source bitmap is null");
            return null;
        }

        Bitmap resultBitmap = Bitmap.createBitmap(
                (int) cropRectF.width(),
                (int) cropRectF.height(),
                Bitmap.Config.ARGB_8888
        );
        Canvas canvas = new Canvas(resultBitmap);

        // Draw background
        Paint paint = new Paint(Paint.FILTER_BITMAP_FLAG);
        paint.setColor(Color.WHITE);
        canvas.drawRect(new RectF(0, 0, cropRectF.width(), cropRectF.height()), paint);

        Matrix matrix = new Matrix();
        matrix.postTranslate(-cropRectF.left, -cropRectF.top);

        canvas.drawBitmap(source, matrix, paint);
        if (source == null || source.isRecycled()) {
            Log.e("BitmapError", "Bitmap is null or recycled");
            return null;
        }
//        if (!source.isRecycled()) {
//            source.recycle();
//        }

        resultBitmap = resultBitmap.copy(Bitmap.Config.ARGB_8888, false);


        return resultBitmap;
    }

    public Bitmap getCropBitmapByCPU_new(Bitmap source, RectF cropRectF) {
                if (source == null) return null;

        // Clamp crop rect to stay within image bounds
        int left = Math.max(0, (int) cropRectF.left);
        int top = Math.max(0, (int) cropRectF.top);
        int right = Math.min(source.getWidth(), (int) cropRectF.right);
        int bottom = Math.min(source.getHeight(), (int) cropRectF.bottom);

        Rect cropRect = new Rect(left, top, right, bottom);

        return Bitmap.createBitmap(source, cropRect.left, cropRect.top,
                cropRect.width(), cropRect.height());
    }




    public Bitmap getResizedBitmap(@NonNull Bitmap bm, int newWidth, int newHeight) {
        int width = bm.getWidth();
        int height = bm.getHeight();
        float scaleWidth = ((float) newWidth) / width;
        float scaleHeight = ((float) newHeight) / height;
        // CREATE A MATRIX FOR THE MANIPULATION
        Matrix matrix = new Matrix();
        // RESIZE THE BIT MAP
        matrix.postScale(scaleWidth, scaleHeight);

        // "RECREATE" THE NEW BITMAP
        Bitmap resizedBitmap = Bitmap.createBitmap(
                bm, 0, 0, width, height, matrix, false);
        bm.recycle();
        return resizedBitmap;
    }


    public void addImage(@NonNull final Bitmap bitmap, @NonNull String personName) {
        try {
            ByteBuffer imgData = ByteBuffer.allocateDirect(AppConstants.modelInputSize * AppConstants.modelInputSize * 3 * 4);
            imgData.order(ByteOrder.nativeOrder());

            intValues = new int[AppConstants.modelInputSize * AppConstants.modelInputSize];
            bitmap.getPixels(intValues, 0, bitmap.getWidth(), 0, 0, bitmap.getWidth(), bitmap.getHeight());
            imgData.rewind();

            for (int i = 0; i < AppConstants.modelInputSize; ++i) {
                for (int j = 0; j < AppConstants.modelInputSize; ++j) {
                    int pixelValue = intValues[i * AppConstants.modelInputSize + j];
                    if (isModelQuantized) {
                        imgData.put((byte) ((pixelValue >> 16) & 0xFF));
                        imgData.put((byte) ((pixelValue >> 8) & 0xFF));
                        imgData.put((byte) (pixelValue & 0xFF));
                    } else {
                        imgData.putFloat((((pixelValue >> 16) & 0xFF) - IMAGE_MEAN) / IMAGE_STD);
                        imgData.putFloat((((pixelValue >> 8) & 0xFF) - IMAGE_MEAN) / IMAGE_STD);
                        imgData.putFloat(((pixelValue & 0xFF) - IMAGE_MEAN) / IMAGE_STD);
                    }
                }
            }

            float[][] embeddings = new float[1][AppConstants.modelOutputSize];
            tfLiteInterpreter.run(imgData, embeddings);

            SimilarityClassifier.Recognition result = new SimilarityClassifier.Recognition("0", personName, -1f);
            result.setExtra(embeddings);

            registered.put(personName, result);   // ✅ save with unique key
            Log.d("FaceRegister", "Registered: " + personName);
           // createDirectoryAndSaveFile(  bitmap,"Registered: " + personName );
        } catch (Exception e) {
            Log.d("Exception", e.toString());
        }
    }


    boolean startImageSave = false;

    public void startRecognizeImageSave(int delayMillis) {
        Log.e("CalledTime", "startRecognizeImageSave");
        startImageSave = false;
        new Handler().postDelayed(() -> startImageSave = true, delayMillis);
    }


    public void recognizeImage(final ArrayList<Bitmap> faceBitmaps) {
        try {
            List<Pair<Boolean, String>> allUiMessages = new ArrayList<>();


            List<float[]> faceEmbeddings = new ArrayList<>();
            for (Bitmap faceBitmap : faceBitmaps) {
                ByteBuffer imgData = convertBitmapToBuffer(faceBitmap);
                float[][] emb = new float[1][AppConstants.modelOutputSize];
                tfLiteInterpreter.run(imgData, emb);
                faceEmbeddings.add(emb[0]);
            }


            int personIndex = 0;
            for (Map.Entry<String, SimilarityClassifier.Recognition> entry : registered.entrySet()) {
                String personName = entry.getKey();
                float[] knownEmb = ((float[][]) entry.getValue().getExtra())[0];

                float bestDistance = Float.MAX_VALUE;
                int bestFaceIndex = -1;

                for (int f = 0; f < faceEmbeddings.size(); f++) {
                    float[] emb = faceEmbeddings.get(f);

                    float distance = 0f;
                    for (int i = 0; i < emb.length; i++) {
                        float diff = emb[i] - knownEmb[i];
                        distance += diff * diff;
                    }
                    distance = (float) Math.sqrt(distance);

                    if (distance < bestDistance) {
                        bestDistance = distance;
                        bestFaceIndex = f;
                    }
                }

                if (bestDistance < AppConstants.modelDistanceMach) {
                    allUiMessages.add(new Pair<>(false,
                            "Face " + bestFaceIndex + " → " + personName +
                                    " ✅ Match (Dist: " + String.format(Locale.getDefault(), "%.3f", bestDistance) + ")"));
                    Log.d("FaceMatch", "Person " + personName + " matched with Face " + bestFaceIndex);
                } else {
                    allUiMessages.add(new Pair<>(true,
                            "Face " + personIndex + " → " + personName +
                                    " ❌ Not Match (Dist: " + String.format(Locale.getDefault(), "%.3f", bestDistance) + ")"));
                    Log.d("FaceMatch", "Person " + personName + " not matched with any face");
                }

                personIndex++;
            }

            // Post result
            _faceDetectionMessage.postValue(allUiMessages);

        } catch (Exception e) {
            Log.e("FaceRecognition", "Error: " + e.toString());
        }
    }
    private ByteBuffer convertBitmapToBuffer(Bitmap bitmap) {
        ByteBuffer imgData = ByteBuffer.allocateDirect(AppConstants.modelInputSize *
                AppConstants.modelInputSize * 3 * 4);
        imgData.order(ByteOrder.nativeOrder());
        imgData.rewind();

        int[] intValues = new int[AppConstants.modelInputSize * AppConstants.modelInputSize];
        bitmap.getPixels(intValues, 0, bitmap.getWidth(), 0, 0,
                bitmap.getWidth(), bitmap.getHeight());

        int pixel = 0;
        for (int i = 0; i < AppConstants.modelInputSize; ++i) {
            for (int j = 0; j < AppConstants.modelInputSize; ++j) {
                int pixelValue = intValues[pixel++];
                if (isModelQuantized) {
                    imgData.put((byte) ((pixelValue >> 16) & 0xFF));
                    imgData.put((byte) ((pixelValue >> 8) & 0xFF));
                    imgData.put((byte) (pixelValue & 0xFF));
                } else {
                    imgData.putFloat((((pixelValue >> 16) & 0xFF) - IMAGE_MEAN) / IMAGE_STD);
                    imgData.putFloat((((pixelValue >> 8) & 0xFF) - IMAGE_MEAN) / IMAGE_STD);
                    imgData.putFloat(((pixelValue & 0xFF) - IMAGE_MEAN) / IMAGE_STD);
                }
            }
        }
        return imgData;
    }


//    public void recognizeImage(final ArrayList<Bitmap> bitmaps) {
//        try {
//            List<Pair<Boolean, String>> allUiMessages = new ArrayList<>();
//
//            for (int k = 0; k < bitmaps.size(); k++) {
//                Bitmap faceBitmap = bitmaps.get(k);
//                Log.d("Bitmapsize", "Processing face " + k + "/" + bitmaps.size());
//
//                // Save cropped face (unique filename)
//                createDirectoryAndSaveFile(faceBitmap, "cropped_face_" + k);
//
//                // Convert bitmap → ByteBuffer
//                ByteBuffer imgData = ByteBuffer.allocateDirect(
//                        AppConstants.modelInputSize * AppConstants.modelInputSize * 3 * 4
//                );
//                imgData.order(ByteOrder.nativeOrder());
//
//                int[] intValues = new int[AppConstants.modelInputSize * AppConstants.modelInputSize];
//                faceBitmap.getPixels(intValues, 0, faceBitmap.getWidth(), 0, 0,
//                        faceBitmap.getWidth(), faceBitmap.getHeight());
//                imgData.rewind();
//
//                for (int i = 0; i < AppConstants.modelInputSize; ++i) {
//                    for (int j = 0; j < AppConstants.modelInputSize; ++j) {
//                        int pixelValue = intValues[i * AppConstants.modelInputSize + j];
//                        if (isModelQuantized) {
//                            imgData.put((byte) ((pixelValue >> 16) & 0xFF));
//                            imgData.put((byte) ((pixelValue >> 8) & 0xFF));
//                            imgData.put((byte) (pixelValue & 0xFF));
//                        } else {
//                            imgData.putFloat((((pixelValue >> 16) & 0xFF) - IMAGE_MEAN) / IMAGE_STD);
//                            imgData.putFloat((((pixelValue >> 8) & 0xFF) - IMAGE_MEAN) / IMAGE_STD);
//                            imgData.putFloat(((pixelValue & 0xFF) - IMAGE_MEAN) / IMAGE_STD);
//                        }
//                    }
//                }
//
//                // Run inference
//                float[][] embeddings = new float[1][AppConstants.modelOutputSize];
//                tfLiteInterpreter.run(imgData, embeddings);
//
//                // Find nearest registered face(s)
//                final List<Pair<String, Float>> nearestList = findNearest(embeddings[0]);
//                List<Pair<Boolean, String>> uiMessages = new ArrayList<>();
//
//
////                if (!nearestList.isEmpty()) {
////                    // Top-1 best match only
////                    Pair<String, Float> bestMatch = nearestList.get(0);
////                    String name = bestMatch.first;
////                    float distance = bestMatch.second;
////
////                    if (distance < AppConstants.modelDistanceMach) {
////                        uiMessages.add(new Pair<>(false,
////                                "Face " + k + " → " + name +
////                                        " : Match ✅ (Dist: " + String.format(Locale.getDefault(), "%.3f", distance) + ")"));
////                        Log.d("FaceMatch", "Face " + k + " matched " + name + " | Distance: " + distance);
////                    } else {
////                        uiMessages.add(new Pair<>(true,
////                                "Face " + k + " → Unknown ❌ (Closest: " + name +
////                                        " Dist: " + String.format(Locale.getDefault(), "%.3f", distance) + ")"));
////                        Log.d("FaceMatch", "Face " + k + " NOT matched. Closest: " + name + " | Distance: " + distance);
////                    }
////
////                    // Save face with best label
////                    createDirectoryAndSaveFile(faceBitmap,
////                            "face_" + k + "_" + name + "_" + String.format(Locale.US, "%.3f", distance));
////                } else {
////                    uiMessages.add(new Pair<>(true, "Face " + k + " → No registered faces found"));
////                }
//
//                for (Pair<String, Float> match : nearestList) {
//                    String name = match.first;
//                    float distance = match.second;
//
//                    if (distance < AppConstants.modelDistanceMach) {
//                        uiMessages.add(new Pair<>(false,
//                                "Face " + k + " → " + name +
//                                        " : Match ✅ (Dist: " + String.format(Locale.getDefault(), "%.3f", distance) + ")"));
//                        Log.d("FaceMatch", "Face " + k + " matched " + name + " | Distance: " + distance);
//                    } else {
//                        uiMessages.add(new Pair<>(true,
//                                "Face " + k + " → " + name +
//                                        " : Not Match ❌ (Dist: " + String.format(Locale.getDefault(), "%.3f", distance) + ")"));
//                        Log.d("FaceMatch", "Face " + k + " NOT matched " + name + " | Distance: " + distance);
//                    }
//
//                    // Save face with label
//                    createDirectoryAndSaveFile(faceBitmap, "face_" + k + "_" + name + "_" + distance);
//                }
//
//
//                // Add this face's messages to the global list
//                allUiMessages.addAll(uiMessages);
//            }
//
//            // Post results for all faces at once
//            _faceDetectionMessage.postValue(allUiMessages);
//
//        } catch (Exception e) {
//            Log.e("recognizeImage", "Exception in recognition", e);
//        }
//    }

//    public void recognizeImage(final ArrayList<Bitmap> bitmap) {
//        // mExecutorService.execute(() -> {
//        // StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
//        // StrictMode.setThreadPolicy(policy);
//        try {
//
//            for(int k = 0 ; k < bitmap.size(); k++) {
//                Log.d("Bitmpsize", String.valueOf(bitmap.size()));
//                createDirectoryAndSaveFile(bitmap.get(k), "cropped_face_" );
//                ByteBuffer imgData = ByteBuffer.allocateDirect(AppConstants.modelInputSize * AppConstants.modelInputSize * 3 * 4);
//                imgData.order(ByteOrder.nativeOrder());
//
//                intValues = new int[AppConstants.modelInputSize * AppConstants.modelInputSize];
//
//                bitmap.get(k).getPixels (intValues, 0, bitmap.get(k).getWidth(), 0, 0, bitmap.get(k).getWidth(), bitmap.get(k).getHeight());
//                imgData.rewind();
//
//                for (int i = 0; i < AppConstants.modelInputSize; ++i) {
//                    for (int j = 0; j < AppConstants.modelInputSize; ++j) {
//                        int pixelValue = intValues[i * AppConstants.modelInputSize + j];
//                        if (isModelQuantized) {
//                            // Quantized model
//                            imgData.put((byte) ((pixelValue >> 16) & 0xFF));
//                            imgData.put((byte) ((pixelValue >> 8) & 0xFF));
//                            imgData.put((byte) (pixelValue & 0xFF));
//                        } else { // Float model
//                            imgData.putFloat((((pixelValue >> 16) & 0xFF) - IMAGE_MEAN) / IMAGE_STD);
//                            imgData.putFloat((((pixelValue >> 8) & 0xFF) - IMAGE_MEAN) / IMAGE_STD);
//                            imgData.putFloat(((pixelValue & 0xFF) - IMAGE_MEAN) / IMAGE_STD);
//
//                        }
//                    }
//                }
//                float[][] embeddings = new float[0][];
//                try {
//                    embeddings = new float[1][AppConstants.modelOutputSize]; //output of model will be stored in this variable
//                    tfLiteInterpreter.run(imgData, embeddings); //Run model
//                } catch (Exception e) {
//                    Log.d("Exception", e.toString());
//                }
//
//                float distance_local;
//
//                final List<Pair<String, Float>> nearestList = findNearest(embeddings[0]);
//                List<Pair<Boolean, String>> uiMessages = new ArrayList<>();
//
//                boolean matched = false;
//                for (Pair<String, Float> match : nearestList) {
//                    String name = match.first;
//                    float distance = match.second;
//
//                    if (distance < AppConstants.modelDistanceMach) {
//                        uiMessages.add(new Pair<>(false, name + " : Face Match Successful (Distance: " + String.format(Locale.getDefault(), "%.3f", distance) + ")"));
//                        System.out.println("Matched: " + name + " | Distance: " + distance);
//                    } else {
//                        // If distance is above threshold, consider not matched
//                        uiMessages.add(new Pair<>(true, name + " : Face Not Matched (Distance: " + String.format(Locale.getDefault(), "%.3f", distance) + ")"));
//                        System.out.println("Not Matched: " + name + " | Distance: " + distance);
//                    }
//
//                    createDirectoryAndSaveFile(bitmap.get(k), String.valueOf(name + " - " + distance));
//                }
//                _faceDetectionMessage.postValue(uiMessages);
//            }
//// Post results
//
//        } catch (Exception e) {
//            Log.d("exception", e.toString());
//        }
//        //  });
//    }


//    public void recognizeImage(final Bitmap bitmap, Bitmap frameBmpRotated, Face face) {
//        try {
//            ByteBuffer imgData = ByteBuffer.allocateDirect(AppConstants.modelInputSize * AppConstants.modelInputSize * 3 * 4);
//            imgData.order(ByteOrder.nativeOrder());
//
//            intValues = new int[AppConstants.modelInputSize * AppConstants.modelInputSize];
//            bitmap.getPixels(intValues, 0, bitmap.getWidth(), 0, 0, bitmap.getWidth(), bitmap.getHeight());
//            imgData.rewind();
//
//            for (int i = 0; i < AppConstants.modelInputSize; ++i) {
//                for (int j = 0; j < AppConstants.modelInputSize; ++j) {
//                    int pixelValue = intValues[i * AppConstants.modelInputSize + j];
//                    if (isModelQuantized) {
//                        imgData.put((byte) ((pixelValue >> 16) & 0xFF));
//                        imgData.put((byte) ((pixelValue >> 8) & 0xFF));
//                        imgData.put((byte) (pixelValue & 0xFF));
//                    } else {
//                        imgData.putFloat((((pixelValue >> 16) & 0xFF) - IMAGE_MEAN) / IMAGE_STD);
//                        imgData.putFloat((((pixelValue >> 8) & 0xFF) - IMAGE_MEAN) / IMAGE_STD);
//                        imgData.putFloat(((pixelValue & 0xFF) - IMAGE_MEAN) / IMAGE_STD);
//                    }
//                }
//            }
//
//            float[][] embeddings = new float[1][AppConstants.modelOutputSize];
//            tfLiteInterpreter.run(imgData, embeddings);
//
//            // 🔹 Collect all messages
//            List<Pair<Boolean, String>> uiMessages = new ArrayList<>();
//            boolean allMatched = true;  // assume all matched
//
//            for (Map.Entry<String, SimilarityClassifier.Recognition> entry : registered.entrySet()) {
//                String name = entry.getKey();
//                float[] knownEmb = ((float[][]) entry.getValue().getExtra())[0];
//
//                float distance = 0f;
//                for (int i = 0; i < embeddings[0].length; i++) {
//                    float diff = embeddings[0][i] - knownEmb[i];
//                    distance += diff * diff;
//                }
//                distance = (float) Math.sqrt(distance);
//
//                if (distance < AppConstants.modelDistanceMach) {
//                    uiMessages.add(new Pair<>(false, name + " : Face Match Successfully" + distance));
//                    Log.d("FaceMatch", "✅ " + name + " matched (dist=" + distance + ")");
//                } else {
//                    uiMessages.add(new Pair<>(true, name + " : Face Not Match" + distance));
//                    Log.d("FaceMatch", "❌ " + name + " not match (dist=" + distance + ")");
//                    allMatched = false; // if any person not match, set false
//                }
//            }
//
//            // 🔹 Update UI
//            _faceDetectionMessage.postValue(uiMessages);
//
//            // 🔹 Save image ONLY if ALL matched
//            if (allMatched) {
//                Log.d("FaceMatch", "🎉 All persons matched → Saving image...");
//                createDirectoryAndSaveFile(frameBmpRotated);

    /// /                if (startImageSave) {
    /// /                    startImageSave = false;
    /// /                    createDirectoryAndSaveFile(bitmap);
    /// /                }
//            }
//
//        } catch (Exception e) {
//            Log.d("exception", e.toString());
//        }
//    }


    //Compare Faces by distance between face embeddings
    @NonNull
    private List<Pair<String, Float>> findNearest(float[] emb) {
        List<Pair<String, Float>> neighbourList = new ArrayList<>();
        try {
            for (Map.Entry<String, SimilarityClassifier.Recognition> entry : registered.entrySet()) {
                final String name = entry.getKey();
                final float[] knownEmb = ((float[][]) entry.getValue().getExtra())[0];

                float distance = 0;
                for (int i = 0; i < emb.length; i++) {
                    float diff = emb[i] - knownEmb[i];
                    distance += diff * diff;
                }
                distance = (float) Math.sqrt(distance);
                neighbourList.add(new Pair<>(name, distance));
            }

            // Sort by distance (ascending)
            Collections.sort(neighbourList, new Comparator<Pair<String, Float>>() {
                @Override
                public int compare(Pair<String, Float> o1, Pair<String, Float> o2) {
                    return Float.compare(o1.second, o2.second);
                }
            });

        } catch (Exception e) {
            Log.d("Exception", e.toString());
        }

        return neighbourList;
    }


    public void createDirectoryAndSaveFile(Bitmap imageToSave,String distance) {

        File direct = new File(Utils.getDownloadPathFile(mContext).getAbsolutePath() + "/FaceDetection", "/EasyFromFace");

        if (!direct.exists()) {
            if (!direct.mkdirs()) {
                return;
            }
        } /*else {
            //   Log.d("detectionFile", direct.getAbsolutePath() + " " + direct.exists());
        }*/
        String fileName = distance + ".jpg";
        File detectionFile = new File(direct.getAbsoluteFile(), fileName);

        if (detectionFile.exists()) {
            if (!detectionFile.delete()) {
                return;
            }
        }
        Utils.writeLogToFile(mContext, detectionFile.getAbsolutePath(), "createDirectoryAndSaveFile File Path Line: 235");
        try {
            FileOutputStream out = new FileOutputStream(detectionFile);
            imageToSave.compress(Bitmap.CompressFormat.JPEG, 100, out);
            out.flush();
            out.close();
        } catch (Exception e) {
            Utils.writeLogToFile(mContext, e.toString(), "createDirectoryAndSaveFile Line: 248");
        }
        if (detectionFile.exists() && detectionFile.isFile()) {
            _detectedFile.postValue(detectionFile);
        }
    }


    //IMPORTANT. If conversion not done ,the toBitmap conversion does not work on some devices.
    private static byte[] YUV_420_888toNV21(@NonNull Image image) {

        try {
            int width = image.getWidth();
            int height = image.getHeight();
            int ySize = width * height;
            int uvSize = width * height / 4;

            byte[] nv21 = new byte[ySize + uvSize * 2];

            ByteBuffer yBuffer = image.getPlanes()[0].getBuffer(); // Y
            ByteBuffer uBuffer = image.getPlanes()[1].getBuffer(); // U
            ByteBuffer vBuffer = image.getPlanes()[2].getBuffer(); // V

            int rowStride = image.getPlanes()[0].getRowStride();
            assert (image.getPlanes()[0].getPixelStride() == 1);

            int pos = 0;

            if (rowStride == width) { // likely
                yBuffer.get(nv21, 0, ySize);
                pos += ySize;
            } else {
                long yBufferPos = -rowStride; // not an actual position
                for (; pos < ySize; pos += width) {
                    yBufferPos += rowStride;
                    yBuffer.position((int) yBufferPos);
                    yBuffer.get(nv21, pos, width);
                }
            }

            rowStride = image.getPlanes()[2].getRowStride();
            int pixelStride = image.getPlanes()[2].getPixelStride();

            assert (rowStride == image.getPlanes()[1].getRowStride());
            assert (pixelStride == image.getPlanes()[1].getPixelStride());

            if (pixelStride == 2 && rowStride == width && uBuffer.get(0) == vBuffer.get(1)) {
                // maybe V an U planes overlap as per NV21, which means vBuffer[1] is alias of uBuffer[0]
                byte savePixel = vBuffer.get(1);
                try {
                    vBuffer.put(1, (byte) ~savePixel);
                    if (uBuffer.get(0) == (byte) ~savePixel) {
                        vBuffer.put(1, savePixel);
                        vBuffer.position(0);
                        uBuffer.position(0);
                        vBuffer.get(nv21, ySize, 1);
                        uBuffer.get(nv21, ySize + 1, uBuffer.remaining());

                        return nv21; // shortcut
                    }
                } catch (ReadOnlyBufferException ex) {
                    // unfortunately, we cannot check if vBuffer and uBuffer overlap
                }

                // unfortunately, the check failed. We must save U and V pixel by pixel
                vBuffer.put(1, savePixel);
            }

            // other optimizations could check if (pixelStride == 1) or (pixelStride == 2),
            // but performance gain would be less significant

            for (int row = 0; row < height / 2; row++) {
                for (int col = 0; col < width / 2; col++) {
                    int vuPos = col * pixelStride + row * rowStride;
                    nv21[pos++] = vBuffer.get(vuPos);
                    nv21[pos++] = uBuffer.get(vuPos);
                }
            }
            return nv21;
        } catch (Exception e) {
            Log.d("Exception", e.toString());
            return null;
        }
    }

    public Bitmap toBitmap(Image image) {
        try {
            byte[] nv21 = YUV_420_888toNV21(image);


            YuvImage yuvImage = new YuvImage(nv21, ImageFormat.NV21, image.getWidth(), image.getHeight(), null);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            yuvImage.compressToJpeg(new Rect(0, 0, yuvImage.getWidth(), yuvImage.getHeight()), 75, out);

            byte[] imageBytes = out.toByteArray();

            return BitmapFactory.decodeByteArray(imageBytes, 0, imageBytes.length);
        } catch (Exception e) {
            Log.d("Exception", e.toString());
            return null;
        }
    }


//    public void recognizeImageFromCamera(ImageProxy imageProxy) {
//        mExecutorService.execute(() -> {
//
//            StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
//            StrictMode.setThreadPolicy(policy);
//            try{
//                if (registered.size() == 0) {
//                    Map<Boolean, String> stringMap = new HashMap<>();
//                    stringMap.put(true, "Image Files not Found");
//                    _messages.postValue(stringMap);
//                    return;
//                }
//
//                InputImage image = null;
//                @SuppressLint({"UnsafeExperimentalUsageError", "UnsafeOptInUsageError"})
//                Image mediaImage = imageProxy.getImage();
//                List<Pair<Boolean, String>> allResults = new ArrayList<>();
//
//                if (mediaImage != null) {
//                    image = InputImage.fromMediaImage(mediaImage, imageProxy.getImageInfo().getRotationDegrees());
//                }
//                if (image != null) {
//                    mFaceDetector.process(image)
//                            .addOnSuccessListener(
//                                    faces -> {
//
//                                        if (faces.size() != 0) {
//
//                                            for (Face face : faces) {
//                                                Log.d("face match", String.valueOf(faces.size()));
////                                                Face face = faces.get(0);
//                                                Bitmap frame_bmp = toBitmap(mediaImage);
//                                                int rot = imageProxy.getImageInfo().getRotationDegrees();
//                                                Bitmap  frame_bmp1 = rotateBitmap(frame_bmp, rot, false, false);
//                                                RectF boundingBox = new RectF(face.getBoundingBox());
//                                                Bitmap cropped_face = getCropBitmapByCPU(frame_bmp1, boundingBox);
//                                                if (cropped_face == null) continue;
//                                                cropped_face = rotateBitmap(cropped_face, 0, false, false);
//                                                Bitmap scaled = getResizedBitmap(cropped_face, AppConstants.modelInputSize, AppConstants.modelInputSize);
//
//                                                // 🔹 modified recognizeImage to return Pair<Boolean,String>
//                                                recognizeImage(scaled, face);
//
//                                            }
//
//                                        } else {
//
//                                            openEye = 0;
//                                            closeEye = 0;
//
//                                            List<Pair<Boolean, String>> noFaceList = new ArrayList<>();
//                                            noFaceList.add(new Pair<>(true, "No Face Detected!"));
//
//                                            _faceDetectionMessage.postValue(noFaceList);
//
//
//                                        }
//                                    })
//                            .addOnFailureListener(
//                                    e -> {
//                                        // Task failed with an exception
//                                        // ..
//                                        imageProxy.close();
//                                    })
//                            .addOnCompleteListener(task -> {
//                                imageProxy.close(); //v.important to acquire next frame for analysis
//                            });
//                }
//            }
//            catch (Exception e)
//            {
//                imageProxy.close();
//                // Log.d(" Exception ::: => ",e.toString());
//            }

    /// /            finally {
    /// /                imageProxy.close();
    /// /            }
//
//        });
//    }
    public void processCapturedImage(Bitmap bitmap) {
//        StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
//        StrictMode.setThreadPolicy(policy);
        mExecutorService.execute(() -> {
            InputImage inputImage = InputImage.fromBitmap(bitmap, 0);

            mFaceDetector.process(inputImage)
                    .addOnSuccessListener(faces -> {
                        if (faces.isEmpty()) {
                            //  Toast.makeText(mContext.getApplicationContext(), "No face detected", Toast.LENGTH_SHORT).show();
                            List<Pair<Boolean, String>> noFaceList = new ArrayList<>();
                            noFaceList.add(new Pair<>(true, "No Face Detected!"));

                            _faceDetectionMessage.postValue(noFaceList);
                            return;
                        }
                        int faceCount = 0;
                        Bitmap resizedFace = null;
                        ArrayList<Bitmap> mBitmaps = new ArrayList<>();
                        for (Face face : faces) {
                           // Bitmap frame_bmp1 = rotateBitmap(bitmap, 0, false, false);
                            Log.d("face size ", String.valueOf(faces.size()));
                            RectF boundingBox = new RectF(face.getBoundingBox());

                            Bitmap croppedFace = getCropBitmapByCPU(bitmap, boundingBox);
                            if (croppedFace == null) {
                                faceCount++;
                                continue;
                            }
                            croppedFace = rotateBitmap(croppedFace, 0, false, false);

                            resizedFace = getResizedBitmap(croppedFace, AppConstants.modelInputSize, AppConstants.modelInputSize);

                            // Recognize face and get match result

                            mBitmaps.add(resizedFace);

                            faceCount++;
                        }
                        recognizeImage(mBitmaps);

                    })
                    .addOnFailureListener(e -> {
                        Toast.makeText(mContext.getApplicationContext(), "Face detection failed", Toast.LENGTH_SHORT).show();
                    });

        });
    }


}
