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

import androidx.annotation.NonNull;
import androidx.camera.core.ImageProxy;
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
import org.tensorflow.lite.gpu.GpuDelegate;

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
public class FaceRecognizerViewModel extends ViewModel {


    private final MutableLiveData<Boolean> _isLoadingData = new MutableLiveData<>(true);
    public LiveData<Boolean> isLoadingData = _isLoadingData;

    private final MutableLiveData<Map<Boolean, String>> _messages = new MutableLiveData<>();
    public LiveData<Map<Boolean, String>> messages = _messages;


    private final MutableLiveData<Map<Boolean, String>> _faceDetectionMessage = new MutableLiveData<>();
    public LiveData<Map<Boolean, String>> faceDetectionMessage = _faceDetectionMessage;

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

    private final HashMap<String, SimilarityClassifier.Recognition> registered; //saved Faces

    public FaceRecognizerViewModel(Context context, String filePath) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            mExecutorService = Executors.newWorkStealingPool(4);
        } else {
            mExecutorService = Executors.newFixedThreadPool(4);
        }
        this.mContext = context;
        registered = new HashMap<>();
        loadModelAndFaceDetection(filePath);
    }

    void loadModelAndFaceDetection(String filePath) {
        mExecutorService.execute(() -> {
            FaceDetectorOptions highAccuracyOpts =
                    new FaceDetectorOptions.Builder()
                            .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_FAST)
                            .setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_ALL)
                            .setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_NONE)
                            .setContourMode(FaceDetectorOptions.CONTOUR_MODE_NONE)
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


    private void getFileLists(@NonNull String filePath) {
        mExecutorService.execute(() -> {
            _isLoadingData.postValue(true);
            Map<Boolean, String> stringMap = new HashMap<>();
            stringMap.put(false, "Images Are Loading");
            _messages.postValue(stringMap);
            File imageFile = new File(filePath);
            List<File> imageFileList = new ArrayList<>();
            if (imageFile.exists() && imageFile.isFile() && AppConstants.isImage(imageFile)) {
                imageFileList.add(imageFile);
            } else {
                Log.d("Error :", "Folder not Exists Or not File Exists");
            }
            if (imageFileList.size() > 0) {
                LoadImageFrom(imageFileList);
            } else {
                Map<Boolean, String> stringMapTwo = new HashMap<>();
                stringMapTwo.put(true, "Image Files not Found");
                _messages.postValue(stringMapTwo);
                // _isLoadingData.postValue(false);
                Log.d("Error :", "Files not Found");
            }
        });

    }

    void LoadImageFrom(@NonNull List<File> imageFileList) {
        if (imageFileList.size() > 0) {
            File imageFile = imageFileList.get(imageFileList.size() - 1);
            Bitmap bitmap = AppConstants.getRotateBitmap(imageFile.getAbsolutePath());
            if (bitmap != null) {
                InputImage inputImage = InputImage.fromBitmap(bitmap, 0);
                mFaceDetector.process(inputImage).addOnSuccessListener(faces -> {
                    if (faces.size() > 0) {
                        Face face = faces.get(0);
                        Bitmap frame_bmp1 = rotateBitmap(bitmap, 0, false, false);
                        RectF boundingBox = new RectF(face.getBoundingBox());
                        Bitmap cropped_face = getCropBitmapByCPU(frame_bmp1, boundingBox);
                        Log.d("AddedF", "Done " + imageFile.getName());
                        Utils.writeLogToFile(mContext, "FilePath : " + imageFile.getAbsolutePath(), "LoadImageFrom ");
                        addImage(getResizedBitmap(cropped_face, AppConstants.modelInputSize, AppConstants.modelInputSize));
                        imageFileList.remove(imageFile);
                        LoadImageFrom(imageFileList);
                    } else {
                        // _isLoadingData.postValue(false);
                        Map<Boolean, String> stringMap = new HashMap<>();
                        stringMap.put(true, "Face is not detected This Image Please Change Image");
                        _messages.postValue(stringMap);
                    }
                }).addOnFailureListener(e -> {
                    Map<Boolean, String> stringMap = new HashMap<>();
                    stringMap.put(true, " Failure Face is not detected " + e);
                    _messages.postValue(stringMap);
                    Log.e("detectorF", e.toString());
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
        }

    }

    public Bitmap rotateBitmap(
            Bitmap bitmap, int rotationDegrees, boolean flipX, boolean flipY) {
        Matrix matrix = new Matrix();

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
        Bitmap resultBitmap = Bitmap.createBitmap((int) cropRectF.width(),
                (int) cropRectF.height(), Bitmap.Config.ARGB_8888);
        Canvas cavas = new Canvas(resultBitmap);

        // draw background
        Paint paint = new Paint(Paint.FILTER_BITMAP_FLAG);
        paint.setColor(Color.WHITE);
        cavas.drawRect(
                new RectF(0, 0, cropRectF.width(), cropRectF.height()),
                paint);

        Matrix matrix = new Matrix();
        matrix.postTranslate(-cropRectF.left, -cropRectF.top);

        cavas.drawBitmap(source, matrix, paint);

        if (source != null && !source.isRecycled()) {
            source.recycle();
        }

        return resultBitmap;
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


    public void addImage(@NonNull final Bitmap bitmap) {
        ByteBuffer imgData;
        try{
             imgData = ByteBuffer.allocateDirect(AppConstants.modelInputSize * AppConstants.modelInputSize * 3 * 4);
            imgData.order(ByteOrder.nativeOrder());

            intValues = new int[AppConstants.modelInputSize * AppConstants.modelInputSize];

            bitmap.getPixels(intValues, 0, bitmap.getWidth(), 0, 0, bitmap.getWidth(), bitmap.getHeight());
            imgData.rewind();

            for (int i = 0; i < AppConstants.modelInputSize; ++i) {
                for (int j = 0; j < AppConstants.modelInputSize; ++j) {
                    int pixelValue = intValues[i * AppConstants.modelInputSize + j];
                    if (isModelQuantized) {
                        // Quantized model
                        imgData.put((byte) ((pixelValue >> 16) & 0xFF));
                        imgData.put((byte) ((pixelValue >> 8) & 0xFF));
                        imgData.put((byte) (pixelValue & 0xFF));
                    } else { // Float model
                        imgData.putFloat((((pixelValue >> 16) & 0xFF) - IMAGE_MEAN) / IMAGE_STD);
                        imgData.putFloat((((pixelValue >> 8) & 0xFF) - IMAGE_MEAN) / IMAGE_STD);
                        imgData.putFloat(((pixelValue & 0xFF) - IMAGE_MEAN) / IMAGE_STD);

                    }
                }
            }

            float[][] embeedings = new float[1][AppConstants.modelOutputSize]; //output of model will be stored in this variable
//             tfLite.runForMultipleInputsOutputs(inputArray, outputMap); //Run model
            tfLiteInterpreter.run(imgData, embeedings); //Run model
            SimilarityClassifier.Recognition result = new SimilarityClassifier.Recognition(
                    "0", "", -1f);
            result.setExtra(embeedings);
            registered.put("Naresh", result);
        }
        catch (Exception e)
        {
            Log.d("Exception",e.toString());
        }


    }

    boolean startImageSave = false;

    public void startRecognizeImageSave(int delayMillis) {
        Log.e("CalledTime", "startRecognizeImageSave");
        startImageSave = false;
        new Handler().postDelayed(() -> startImageSave = true, delayMillis);
    }


    public void recognizeImage(final Bitmap bitmap, Face face,String Is2FA) {
        //mExecutorService.execute(() -> {
            StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
            StrictMode.setThreadPolicy(policy);
            try{
                ByteBuffer imgData = ByteBuffer.allocateDirect(AppConstants.modelInputSize * AppConstants.modelInputSize * 3 * 4);
                imgData.order(ByteOrder.nativeOrder());

                intValues = new int[AppConstants.modelInputSize * AppConstants.modelInputSize];

                bitmap.getPixels(intValues, 0, bitmap.getWidth(), 0, 0, bitmap.getWidth(), bitmap.getHeight());
                imgData.rewind();

                    for (int i = 0; i < AppConstants.modelInputSize; ++i) {
                        for (int j = 0; j < AppConstants.modelInputSize; ++j) {
                            int pixelValue = intValues[i * AppConstants.modelInputSize + j];
                            if (isModelQuantized) {
                                // Quantized model
                                imgData.put((byte) ((pixelValue >> 16) & 0xFF));
                                imgData.put((byte) ((pixelValue >> 8) & 0xFF));
                                imgData.put((byte) (pixelValue & 0xFF));
                            } else { // Float model
                                imgData.putFloat((((pixelValue >> 16) & 0xFF) - IMAGE_MEAN) / IMAGE_STD);
                                imgData.putFloat((((pixelValue >> 8) & 0xFF) - IMAGE_MEAN) / IMAGE_STD);
                                imgData.putFloat(((pixelValue & 0xFF) - IMAGE_MEAN) / IMAGE_STD);

                            }
                        }
                    }
                float[][] embeddings = new float[0][];
                   try{
                      embeddings = new float[1][AppConstants.modelOutputSize]; //output of model will be stored in this variable
                      tfLiteInterpreter.run(imgData, embeddings); //Run model
                   }
                   catch (Exception e){
                       Log.d("Exception",e.toString());
                   }

                float distance_local;

                //Compare new face with saved Faces.
                final List<Pair<String, Float>> nearest = findNearest(embeddings[0]);//Find 2 closest matching face
                if (nearest.get(0) != null)
                {
                    final String name = nearest.get(0).first; //get name and distance of closest matching face
                    // label = name;
                    distance_local = nearest.get(0).second;
                    if(distance_local != 0.0) {
                        if (distance_local < AppConstants.modelDistanceMach) //If distance between Closest found face is more than 1.000 ,then output UNKNOWN face.
                        {
                            Map<Boolean, String> faceDetectionMessage = new HashMap<>();
                            //System.out.println("Nearest: " + name + "\nDist: " + String.format("%.3f", distance_local) + "\n2nd Nearest: " + nearest.get(1).first + "\nDist: " + String.format("%.3f", nearest.get(1).second));
                            faceDetectionMessage.put(false, "Face Match Successfully");
                            _faceDetectionMessage.postValue(faceDetectionMessage);

                            // as per discuss with sir open and close eyes detection code remove 24-05-2024
//                    if (openEye > AppConstants.eyeMaxTestCount && closeEye > AppConstants.eyeMaxTestCount && startImageSave)

                            if (startImageSave) {
                                startImageSave = false;
                                createDirectoryAndSaveFile(bitmap,Is2FA);
                            }
                        } else {
                            Map<Boolean, String> stringMap = new HashMap<>();
                            //when Unknown face detected set open and close eye count 0 (09-0-2024)
                            openEye = 0;
                            closeEye = 0;
                            stringMap.put(true, "Unknown Face Detected");
                            _faceDetectionMessage.postValue(stringMap);
                            System.out.println("Unknown " + "\nDist: " + String.format(Locale.getDefault(), "%.3f", distance_local) + "\nNearest: " + name + "\nDist: " + String.format(Locale.getDefault(), "%.3f", distance_local) + "\n2nd Nearest: " + nearest.get(1).first + "\nDist: " + String.format(Locale.getDefault(), "%.3f", nearest.get(1).second));
                        }
                    }
                  // as per discuss with sir open and close eyes detection code remove 24-05-2024
//                if (face != null && face.getRightEyeOpenProbability() != null && face.getLeftEyeOpenProbability() != null) {
//                    if (face.getRightEyeOpenProbability() != -1 && face.getLeftEyeOpenProbability() != -1) {
//                        float rightEyeOpenProb = face.getRightEyeOpenProbability();
//                        float leftEyeOpenProb = face.getLeftEyeOpenProbability();
//                        if (rightEyeOpenProb > AppConstants.eyeOpenProbMax && leftEyeOpenProb > AppConstants.eyeOpenProbMax) {
//                            openEye++;
//                        } else if (rightEyeOpenProb < AppConstants.eyeCloseProbMax && leftEyeOpenProb < AppConstants.eyeCloseProbMax) {
//                            closeEye++;
//                        }
//                        Map<Boolean, String> eyeOpenMessageMap = new HashMap<>();
//                        if (openEye > AppConstants.eyeMaxTestCount) {
//                            eyeOpenMessageMap.put(false, "Open eyes confirm");
//                        } else {
//                            eyeOpenMessageMap.put(true, "Please open eyes to confirm");
//                        }
//                        _eyeOpenMessage.postValue(eyeOpenMessageMap);
//                        Map<Boolean, String> eyeCloseMessageMap = new HashMap<>();
//                        if (closeEye > AppConstants.eyeMaxTestCount) {
//                            eyeCloseMessageMap.put(false, "Close eyes confirm");
//                        } else {
//                            eyeCloseMessageMap.put(true, "Please close your eyes to confirm");
//                        }
//                        _eyeCloseMessage.postValue(eyeCloseMessageMap);
//                    } else {
//                        openEye = 0;
//                        closeEye = 0;
//                        Map<Boolean, String> eyeOpenMessageMap = new HashMap<>();
//                        eyeOpenMessageMap.put(true, "Please open eyes to confirm");
//                        _eyeOpenMessage.postValue(eyeOpenMessageMap);
//                        Map<Boolean, String> eyeCloseMessageMap = new HashMap<>();
//                        eyeCloseMessageMap.put(true, "Please close your eyes to confirm");
//                        _eyeCloseMessage.postValue(eyeCloseMessageMap);
//                    }
//                }

                }
            }
            catch (Exception e)
            {
                Log.d("exception",e.toString());
            }
       // });
    }

    //Compare Faces by distance between face embeddings
    @NonNull
    private List<Pair<String, Float>> findNearest(float[] emb) {
        List<Pair<String, Float>> neighbour_list = new ArrayList<>();
        try{
            Pair<String, Float> ret = null; //to get closest match
            Pair<String, Float> prev_ret = null; //to get second closest match
            for (Map.Entry<String, SimilarityClassifier.Recognition> entry : registered.entrySet()) {

                final String name = entry.getKey();
                final float[] knownEmb = ((float[][]) entry.getValue().getExtra())[0];

                float distance = 0;
                for (int i = 0; i < emb.length; i++) {
                    float diff = emb[i] - knownEmb[i];
                    distance += diff * diff;
                }
                distance = (float) Math.sqrt(distance);
                if (ret == null || distance < ret.second) {
                    prev_ret = ret;
                    ret = new Pair<>(name, distance);
                }
            }
            if (prev_ret == null) prev_ret = ret;
            neighbour_list.add(ret);
            neighbour_list.add(prev_ret);


        }
        catch (Exception e)
        {
            Log.d("Exception",e.toString());
        }
        return neighbour_list;

    }


    public void createDirectoryAndSaveFile(Bitmap imageToSave,String Is2FA) {
        File detectionFile = null;
        if(Is2FA.equalsIgnoreCase("true"))
        {
            _detectedFile.postValue(null);
        }
        else {
            File direct = new File(Utils.getDownloadPathFile(mContext).getAbsolutePath() + "/FaceDetection", "/EasyFromFace");

            if (!direct.exists()) {
                if (!direct.mkdirs()) {
                    return;
                }
            } /*else {
            //   Log.d("detectionFile", direct.getAbsolutePath() + " " + direct.exists());
        }*/
            String fileName = System.currentTimeMillis() + ".jpg";
             detectionFile = new File(direct.getAbsoluteFile(), fileName);

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
        

    }


    //IMPORTANT. If conversion not done ,the toBitmap conversion does not work on some devices.
    private static byte[] YUV_420_888toNV21(@NonNull Image image) {

        try{
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
        }
        catch (Exception e)
        {
            Log.d("Exception",e.toString());
            return null;
        }
    }

    public Bitmap toBitmap(Image image) {
        try{
            byte[] nv21 = YUV_420_888toNV21(image);


            YuvImage yuvImage = new YuvImage(nv21, ImageFormat.NV21, image.getWidth(), image.getHeight(), null);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            yuvImage.compressToJpeg(new Rect(0, 0, yuvImage.getWidth(), yuvImage.getHeight()), 75, out);

            byte[] imageBytes = out.toByteArray();

            return BitmapFactory.decodeByteArray(imageBytes, 0, imageBytes.length);
        }
        catch (Exception e)
        {
            Log.d("Exception",e.toString());
            return null;
        }
    }


    public void recognizeImageFromCamera(ImageProxy imageProxy,String Is2FA) {
        mExecutorService.execute(() -> {

            try{
                if (registered.size() == 0) {
                    Map<Boolean, String> stringMap = new HashMap<>();
                    stringMap.put(true, "Image Files not Found");
                    _messages.postValue(stringMap);
                    return;
                }

                InputImage image = null;
                @SuppressLint({"UnsafeExperimentalUsageError", "UnsafeOptInUsageError"})
                Image mediaImage = imageProxy.getImage();

                if (mediaImage != null) {
                    image = InputImage.fromMediaImage(mediaImage, imageProxy.getImageInfo().getRotationDegrees());
                }
                if (image != null) {
                    mFaceDetector.process(image)
                            .addOnSuccessListener(
                                    faces -> {
                                        if (faces.size() != 0) {
                                            Face face = faces.get(0);
                                            Bitmap frame_bmp = toBitmap(mediaImage);
                                            int rot = imageProxy.getImageInfo().getRotationDegrees();
                                            Bitmap frame_bmp1 = rotateBitmap(frame_bmp, rot, false, false);
                                            RectF boundingBox = new RectF(face.getBoundingBox());
                                            Bitmap cropped_face = getCropBitmapByCPU(frame_bmp1, boundingBox);
                                            cropped_face = rotateBitmap(cropped_face, 0, false, false);
                                            Bitmap scaled = getResizedBitmap(cropped_face, AppConstants.modelInputSize, AppConstants.modelInputSize);

                                            recognizeImage(scaled, face,Is2FA); //Send scaled bitmap to create face embeddings.
                                        } else {
                                            Map<Boolean, String> stringMap = new HashMap<>();
                                            //when face not detected remove green mark and set red mark text (09-0-2024)
                                            openEye = 0;
                                            closeEye = 0;
                                            stringMap.put(true, "No Face Detected!");

                                            // as per discuss with sir open and close eyes detection code remove 24-05-2024
//                                             Map<Boolean, String> eyeOpenMessageMap = new HashMap<>();
//                                             eyeOpenMessageMap.put(true, "Please open eyes to confirm");
//                                             _eyeOpenMessage.postValue(eyeOpenMessageMap);
//                                              Map<Boolean, String> eyeCloseMessageMap = new HashMap<>();
//                                              eyeCloseMessageMap.put(true, "Please close your eyes to confirm");
//                                              _eyeCloseMessage.postValue(eyeCloseMessageMap);

                                            _faceDetectionMessage.postValue(stringMap);
                                        }
                                    })
                            .addOnFailureListener(
                                    e -> {
                                        // Task failed with an exception
                                        // ..
                                        imageProxy.close();
                                    })
                            .addOnCompleteListener(task -> {
                                imageProxy.close(); //v.important to acquire next frame for analysis
                            });
                }
            }
            catch (Exception e)
            {
                imageProxy.close();
               // Log.d(" Exception ::: => ",e.toString());
            }

        });
    }
}
