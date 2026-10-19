/*
 * Copyright 2020 Google LLC. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.sky.atc.easyformse.billscanner.java;

import android.app.ActivityManager;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.os.Environment;
import android.os.SystemClock;
import android.util.Log;
import android.view.View;
import android.widget.Toast;

import androidx.annotation.GuardedBy;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.google.android.gms.tasks.Task;
import com.google.android.gms.tasks.TaskExecutors;
import com.google.mlkit.vision.common.InputImage;
import com.sky.atc.easyformse.billscanner.BitmapUtils;
import com.sky.atc.easyformse.billscanner.CameraImageGraphic;
import com.sky.atc.easyformse.billscanner.FrameMetadata;
import com.sky.atc.easyformse.billscanner.GraphicOverlay;
import com.sky.atc.easyformse.billscanner.InferenceInfoGraphic;
import com.sky.atc.easyformse.billscanner.ScopedExecutor;
import com.sky.atc.easyformse.billscanner.VisionImageProcessor;
import com.sky.atc.easyformse.billscanner.preference.PreferenceUtils;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Timer;
import java.util.TimerTask;

public abstract class VisionProcessorBase<T> implements VisionImageProcessor {

  protected static final String MANUAL_TESTING_LOG = "LogTagForTest";
  private static final String TAG = "VisionProcessorBase";

  private final ActivityManager activityManager;
  private final Timer fpsTimer = new Timer();
  private final ScopedExecutor executor;

  // Whether this processor is already shut down
  private boolean isShutdown;

  // Used to calculate latency, running in the same thread, no sync needed.
  private int numRuns = 0;
  private long totalRunMs = 0;
  private long maxRunMs = 0;
  private long minRunMs = Long.MAX_VALUE;

  // Frame count that have been processed so far in an one second interval to calculate FPS.
  private int frameProcessedInOneSecondInterval = 0;
  private int framesPerSecond = 0;

  // To keep the latest images and its metadata.
  @GuardedBy("this")
  private ByteBuffer latestImage;

  @GuardedBy("this")
  private FrameMetadata latestImageMetaData;
  // To keep the images and metadata in process.
  @GuardedBy("this")
  private ByteBuffer processingImage;

  @GuardedBy("this")
  private FrameMetadata processingMetaData;

  protected VisionProcessorBase(Context context) {
    activityManager = (ActivityManager) context.getSystemService(Context.ACTIVITY_SERVICE);
    executor = new ScopedExecutor(TaskExecutors.MAIN_THREAD);
    fpsTimer.scheduleAtFixedRate(
        new TimerTask() {
          @Override
          public void run() {
            framesPerSecond = frameProcessedInOneSecondInterval;
            frameProcessedInOneSecondInterval = 0;
          }
        },
        /* delay= */ 0,
        /* period= */ 1000);
  }

  // -----------------Code for processing single still image----------------------------------------
  @Override
  public void processBitmap(Bitmap bitmap, final GraphicOverlay graphicOverlay) {
    requestDetectInImage(
        InputImage.fromBitmap(bitmap, 0),
        graphicOverlay,
        /* originalCameraImage= */ null,
        /* shouldShowFps= */ false);
  }

  // -----------------Code for processing live preview frame from Camera1 API-----------------------
//  @Override
//  public synchronized void processByteBuffer(
//      ByteBuffer data, final FrameMetadata frameMetadata, final GraphicOverlay graphicOverlay) {
//    latestImage = data;
//    latestImageMetaData = frameMetadata;
//    if (processingImage == null && processingMetaData == null) {
//      processLatestImage(graphicOverlay);
//    }
//  }

  private synchronized void processLatestImage(final GraphicOverlay graphicOverlay) {
    processingImage = latestImage;
    processingMetaData = latestImageMetaData;
    latestImage = null;
    latestImageMetaData = null;
    if (processingImage != null && processingMetaData != null && !isShutdown) {
      processImage(processingImage, processingMetaData, graphicOverlay);
    }
  }

  private void processImage(
      ByteBuffer data, final FrameMetadata frameMetadata, final GraphicOverlay graphicOverlay) {
    // If live viewport is on (that is the underneath surface view takes care of the camera preview
    // drawing), skip the unnecessary bitmap creation that used for the manual preview drawing.

    Bitmap bitmap =
        PreferenceUtils.isCameraLiveViewportEnabled(graphicOverlay.getContext())
            ? BitmapUtils.getBitmap(data, frameMetadata)
            : BitmapUtils.getBitmap(data, frameMetadata);

    requestDetectInImage(
            InputImage.fromByteBuffer(
                data,
                frameMetadata.getWidth(),
                frameMetadata.getHeight(),
                frameMetadata.getRotation(),
                InputImage.IMAGE_FORMAT_NV21),
            graphicOverlay,
            bitmap,
            /* shouldShowFps= */ true)
        .addOnSuccessListener(executor, results -> processLatestImage(graphicOverlay));
        graphicOverlay.setVisibility(View.GONE);
  }

  private void storeImage(Bitmap image, int yangle) {

//        int height = (int) (image.getHeight() * 0.8);
//        int widht = image.getWidth();
//        image = Bitmap.createBitmap(image, 0, (int) (image.getHeight() * 0.2), widht, height);

    File pictureFile = getOutputMediaFile(yangle);
    if (pictureFile == null) {
      return;
    }
    try {
      FileOutputStream fos = new FileOutputStream(pictureFile);
      image.compress(Bitmap.CompressFormat.JPEG, 100, fos);
      fos.close();
      Log.d("####IMAGE", String.valueOf(pictureFile));
    } catch (IOException e) {
      e.printStackTrace();
    }
  }

  private File getOutputMediaFile(int angley) {
    // To be safe, you should check that the SDCard is mounted
    // using Environment.getExternalStorageState() before doing this.
    File mediaStorageDir = new File(com.sky.atc.easyformse.utils.AppStorage.root()
            + "/Android");

    // This location works best if you want the created images to be shared
    // between applications and persist after your app has been uninstalled.

    // Create the storage directory if it does not exist
    if (!mediaStorageDir.exists()) {
      if (!mediaStorageDir.mkdirs()) {
        return null;
      }
    }
    // Create a media file name
    String timeStamp = new SimpleDateFormat("ddMMyyyy_HHmm").format(new Date());
    File mediaFile;
    String mImageName = angley + ".jpg";
    mediaFile = new File(mediaStorageDir.getPath() + File.separator + mImageName);
    return mediaFile;
  }

  public static Bitmap loadBitmapFromView(View v) {
    Bitmap b = Bitmap.createBitmap(v.getWidth(), v.getHeight(), Bitmap.Config.ARGB_8888);
    Canvas c = new Canvas(b);
    v.draw(c);
    return b;
  }

//  // -----------------Code for processing live preview frame from CameraX API-----------------------
//  @Override
//  @RequiresApi(VERSION_CODES.KITKAT)
//  public void processImageProxy(ImageProxy image, GraphicOverlay graphicOverlay) {
//    if (isShutdown) {
//      image.close();
//      return;
//    }
//
//    Bitmap bitmap = null;
//    if (PreferenceUtils.isCameraLiveViewportEnabled(graphicOverlay.getContext())) {
//      bitmap = BitmapUtils.getBitmap(image);
//    }
////    bitmap = BitmapUtils.getBitmap(image);
//    requestDetectInImage(
//            InputImage.fromMediaImage(image.getImage(), image.getImageInfo().getRotationDegrees()),
//            graphicOverlay,
//            /* originalCameraImage= */ bitmap,
//            /* shouldShowFps= */ true)
//        // When the image is from CameraX analysis use case, must call image.close() on received
//        // images when finished using them. Otherwise, new images may not be received or the camera
//        // may stall.
//        .addOnCompleteListener(results -> image.close());
//  }

  // -----------------Common processing logic-------------------------------------------------------
  private Task<T> requestDetectInImage(
      final InputImage image,
      final GraphicOverlay graphicOverlay,
      @Nullable final Bitmap originalCameraImage,
      boolean shouldShowFps) {
    final long startMs = SystemClock.elapsedRealtime();
    return detectInImage(image)
        .addOnSuccessListener(
            executor,
            results -> {
              long currentLatencyMs = SystemClock.elapsedRealtime() - startMs;
//              numRuns++;
//              frameProcessedInOneSecondInterval++;
//              totalRunMs += currentLatencyMs;
//              maxRunMs = Math.max(currentLatencyMs, maxRunMs);
//              minRunMs = Math.min(currentLatencyMs, minRunMs);

              // Only log inference info once per second. When frameProcessedInOneSecondInterval is
              // equal to 1, it means this is the first frame processed during the current second.
//              if (frameProcessedInOneSecondInterval == 1) {
//                Log.d(TAG, "Max latency is: " + maxRunMs);
//                Log.d(TAG, "Min latency is: " + minRunMs);
//                Log.d(TAG, "Num of Runs: " + numRuns + ", Avg latency is: " + totalRunMs / numRuns);
//                MemoryInfo mi = new MemoryInfo();
//                activityManager.getMemoryInfo(mi);
//                long availableMegs = mi.availMem / 0x100000L;
//                Log.d(TAG, "Memory available in system: " + availableMegs + " MB");
//              }

              graphicOverlay.clear();
              if (originalCameraImage != null) {
                graphicOverlay.add(new CameraImageGraphic(graphicOverlay, originalCameraImage));
              }
              graphicOverlay.add(new InferenceInfoGraphic(graphicOverlay, currentLatencyMs, shouldShowFps ? framesPerSecond : null));
              VisionProcessorBase.this.onSuccess(results, graphicOverlay);
              graphicOverlay.postInvalidate();
            })
        .addOnFailureListener(
            executor,
            e -> {
              graphicOverlay.clear();
              graphicOverlay.postInvalidate();
              String error = "Failed to process. Error: " + e.getLocalizedMessage();
              Toast.makeText(
                      graphicOverlay.getContext(),
                      error + "\nCause: " + e.getCause(),
                      Toast.LENGTH_SHORT)
                  .show();
              Log.d(TAG, error);
              e.printStackTrace();
              VisionProcessorBase.this.onFailure(e);
            });
  }

  @Override
  public void stop() {
    executor.shutdown();
    isShutdown = true;
    numRuns = 0;
    totalRunMs = 0;
    fpsTimer.cancel();
  }

  protected abstract Task<T> detectInImage(InputImage image);

  protected abstract void onSuccess(@NonNull T results, @NonNull GraphicOverlay graphicOverlay);

  protected abstract void onFailure(@NonNull Exception e);
}
