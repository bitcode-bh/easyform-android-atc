package com.easyform.safetymeasure.automlvision;

import android.content.res.AssetFileDescriptor;
import android.content.res.AssetManager;
import android.graphics.Bitmap;
import android.graphics.RectF;
import android.util.Log;

import org.tensorflow.lite.DataType;
import org.tensorflow.lite.Interpreter;

import java.io.BufferedReader;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.MappedByteBuffer;
import java.nio.channels.FileChannel;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public class TFLiteDetector {

    private static final String TAG = "TFLiteDetector";
    private Interpreter interpreter;
    private List<String> labels;
    private int inputWidth, inputHeight;
    private DataType inputDataType;
    private final int MAX_DETECTIONS = 48;

    public void loadModel(AssetManager assetManager, String modelPath, String labelPath) throws IOException {
        // load model
        try (AssetFileDescriptor fd = assetManager.openFd(modelPath);
             FileInputStream fis = new FileInputStream(fd.getFileDescriptor())) {
            FileChannel fc = fis.getChannel();
            long startOffset = fd.getStartOffset();
            long declaredLength = fd.getDeclaredLength();
            MappedByteBuffer mbb = fc.map(FileChannel.MapMode.READ_ONLY, startOffset, declaredLength);
            Interpreter.Options options = new Interpreter.Options();
            options.setNumThreads(4);
            options.setUseXNNPACK(true);
            interpreter = new Interpreter(mbb,options);
        }

        // load labels
        labels = new ArrayList<>();
        BufferedReader br = new BufferedReader(new InputStreamReader(assetManager.open(labelPath)));
        String line;
        while ((line = br.readLine()) != null) labels.add(line.trim());
        br.close();

        // input tensor info
        int[] shape = interpreter.getInputTensor(0).shape(); // [1, h, w, 3]
        inputHeight = shape[1];
        inputWidth = shape[2];
        inputDataType = interpreter.getInputTensor(0).dataType();

        Log.i(TAG, "Model loaded. inputWxH=" + inputWidth + "x" + inputHeight + " labels=" + labels.size());
        Log.i(TAG, "Labels list:");
        for (int i = 0; i < labels.size(); i++) {
            Log.i(TAG, "  " + i + " -> " + labels.get(i));
        }
    }

    private ByteBuffer convertBitmapToByteBuffer(Bitmap bitmap) {
        Bitmap resized = Bitmap.createScaledBitmap(bitmap, inputWidth, inputHeight, true);
        int pixelSize = 3;

        if (inputDataType == DataType.UINT8) {
            ByteBuffer bb = ByteBuffer.allocateDirect(inputWidth * inputHeight * pixelSize);
            bb.order(ByteOrder.nativeOrder());
            int[] intValues = new int[inputWidth * inputHeight];
            resized.getPixels(intValues, 0, inputWidth, 0, 0, inputWidth, inputHeight);
            for (int px : intValues) {
                bb.put((byte) ((px >> 16) & 0xFF));
                bb.put((byte) ((px >> 8) & 0xFF));
                bb.put((byte) (px & 0xFF));
            }
            bb.rewind();
            return bb;
        } else {
            ByteBuffer bb = ByteBuffer.allocateDirect(4 * inputWidth * inputHeight * pixelSize);
            bb.order(ByteOrder.nativeOrder());
            int[] intValues = new int[inputWidth * inputHeight];
            resized.getPixels(intValues, 0, inputWidth, 0, 0, inputWidth, inputHeight);
            for (int px : intValues) {
                bb.putFloat(((px >> 16) & 0xFF) / 255.0f);
                bb.putFloat(((px >> 8) & 0xFF) / 255.0f);
                bb.putFloat((px & 0xFF) / 255.0f);
            }
            bb.rewind();
            return bb;
        }
    }

    // helper: checks if label contains any keyword (case-insensitive)
    private boolean labelHasKeyword(String label, String[] keywords) {
        if (label == null) return false;
        String lower = label.toLowerCase();
        for (String k : keywords) {
            if (lower.contains(k)) return true;
        }
        return false;
    }

    public List<DetectionResult> runDetection(Bitmap bitmap, float scoreThreshold) {

        ByteBuffer input = convertBitmapToByteBuffer(bitmap);

        float[][][] outputLocations = new float[1][MAX_DETECTIONS][4];
        float[][] outputClasses = new float[1][MAX_DETECTIONS];
        float[][] outputScores = new float[1][MAX_DETECTIONS];
        float[] numDetections = new float[1];

        Map<Integer, Object> outputMap = new HashMap<>();
        outputMap.put(0, outputLocations);
        outputMap.put(1, outputClasses);
        outputMap.put(2, outputScores);
        outputMap.put(3, numDetections);

        interpreter.runForMultipleInputsOutputs(new Object[]{input}, outputMap);


        int detCount = (int) numDetections[0];

        List<DetectionResult> results = new ArrayList<>();
        int maxDetections = 20;

        for (int i = 0; i < detCount && results.size() < maxDetections; i++) {
            float score = outputScores[0][i];
//            Log.d("score", String.valueOf(score));
            if (score < scoreThreshold) continue;

            float top = outputLocations[0][i][0];
            float left = outputLocations[0][i][1];
            float bottom = outputLocations[0][i][2];
            float right = outputLocations[0][i][3];

            RectF box = new RectF(
                    left * bitmap.getWidth(),
                    top * bitmap.getHeight(),
                    right * bitmap.getWidth(),
                    bottom * bitmap.getHeight()
            );

            int rawClassIdx = (int) outputClasses[0][i];

            String predictedLabel = labels.get(rawClassIdx - 1 ).toLowerCase();
            String overlayLabel = predictedLabel.replace("_", " ").trim();

            Log.i(TAG, "DETECT i=" + i +
                    " score=" + String.format("%.3f", score) +
                    " rawClassIdx=" + rawClassIdx +
                    " label=" + predictedLabel +
                    " box=" + box);
            List<String> detectedLabels = new ArrayList<>();

            results.add(new DetectionResult(box, overlayLabel, score));
            Log.d("Result size", String.valueOf(results.size()));
        }

        return results;

//        for (int i = 0; i < detCount; i++) {
//            float score = outputScores[0][i];
//            if (score < scoreThreshold) continue;
//
//            // convert normalized box to bitmap pixel coordinates
//            float top = outputLocations[0][i][0];
//            float left = outputLocations[0][i][1];
//            float bottom = outputLocations[0][i][2];
//            float right = outputLocations[0][i][3];
//            RectF box = new RectF(
//                    left * bitmap.getWidth(),
//                    top * bitmap.getHeight(),
//                    right * bitmap.getWidth(),
//                    bottom * bitmap.getHeight()
//            );
//
//            // get predicted class label
//            int rawClassIdx = (int) outputClasses[0][i];
//            String predictedLabel = labels.get(rawClassIdx - 1 ).toLowerCase();
//
//            // Collect all PPE labels for this detection
//            List<String> detectedLabels = new ArrayList<>();
//            if (labelHasKeyword(predictedLabel, helmetKeys)) detectedLabels.add("helmet");
////            if (labelHasKeyword(predictedLabel, maskKeys)) detectedLabels.add("mask");
////            if (labelHasKeyword(predictedLabel, vestKeys)) detectedLabels.add("vest");
//
//            // Add each PPE label separately
//            for (String detectedLabel : detectedLabels) {
//                Log.i(TAG, "Detected: " + detectedLabel + " @ " + box + " score=" + score);
//
//                results.add(new DetectionResult(box, detectedLabel, score));
//            }
//
//            // Debug log
//            Log.i(TAG, "DETECT i=" + i +
//                    " score=" + String.format("%.3f", score) +
//                    " rawClassIdx=" + rawClassIdx +
//                    " labels=" + detectedLabels);
//        }


    }

        private float getIoU(RectF a, RectF b) {
            float intersectionLeft = Math.max(a.left, b.left);
            float intersectionTop = Math.max(a.top, b.top);
            float intersectionRight = Math.min(a.right, b.right);
            float intersectionBottom = Math.min(a.bottom, b.bottom);

            float intersectionArea = Math.max(0, intersectionRight - intersectionLeft) *
                    Math.max(0, intersectionBottom - intersectionTop);

            float unionArea = a.width() * a.height() + b.width() * b.height() - intersectionArea;
            return (unionArea > 0) ? (intersectionArea / unionArea) : 0f;
        }


}
