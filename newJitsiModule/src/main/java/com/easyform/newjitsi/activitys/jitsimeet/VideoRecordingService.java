package com.easyform.newjitsi.activitys.jitsimeet;

import static com.easyform.newjitsi.App.context;
import static com.easyform.newjitsi.App.getContext;
import static com.easyform.newjitsi.activitys.drawing.CameraPreviewActivity.currentCameraId;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Matrix;
import android.graphics.PixelFormat;
import android.hardware.Camera;
import android.media.MediaRecorder;
import android.media.MediaScannerConnection;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.util.Log;
import android.view.SurfaceHolder;
import android.view.SurfaceView;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;

import com.easyform.newjitsi.R;
import com.easyform.newjitsi.activitys.CountDownTimerPausable;
import com.easyform.newjitsi.activitys.chat.WebApiCallJitsiMeet;
import com.easyform.newjitsi.activitys.drawing.CameraPreviewActivity;
import com.easyform.newjitsi.activitys.drawing.ChecklistItem;
import com.easyform.newjitsi.network.Models.OtherData;
import com.easyform.newjitsi.network.Models.UserData;
import com.easyform.newjitsi.utils.Utils;
import com.google.gson.Gson;


import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

/**
 * Created by NareshChocha on 9/25/2023.
 *
 * @author NareshChocha
 */
public class VideoRecordingService extends Service {

    private static final String TAG = "RecorderService";

    private static SurfaceHolder mSurfaceHolder;
    private static Camera mServiceCamera;
    private MediaRecorder mMediaRecorder;

    private boolean isRecording = false;

    private CountDownTimerPausable countDownTimerPausable;
    int hours = 0, minutes = 0, seconds = 0;

    static Activity mActivity;
    Bundle extras;

    private static final Gson mGson = new Gson();
    public static OtherData mOtherData;
    public static UserData mUserData;
    static String otherDataString;
    static String loginUserDataString;
    static String pluginArgsString;
    static String notificationRemoteDataString;
    @Override
    public void onCreate() {
        super.onCreate();

        // REQUIRED: Foreground service for camera & mic
      //  startForegroundServiceNotification();

        mActivity = CameraPreviewActivity.cameraPreviewActivity;

        // Receive data from activity
        if (mActivity == null || mActivity.isFinishing() || CameraPreviewActivity.surfaceHolder == null) { stopSelf(); return; }
        Intent intent = mActivity.getIntent();
        extras = intent.getBundleExtra("Bundle_extras");
        if (extras == null) { stopSelf(); return; }

         otherDataString = extras.getString(Utils.BroadcastActionExtrasKeys.OTHER_DATA, "");
         loginUserDataString = extras.getString(Utils.BroadcastActionExtrasKeys.LOGIN_USER_DATA, "");
        pluginArgsString = extras.getString(Utils.BroadcastActionExtrasKeys.JITSI_MEETING_PLUGIN_ARGS, "");
        notificationRemoteDataString = extras.getString(Utils.BroadcastActionExtrasKeys.NOTIFICATION_REMOTE_DATA, "");
        try {
            mOtherData = mGson.fromJson(otherDataString, OtherData.class);
            mUserData = mGson.fromJson(loginUserDataString, UserData.class);
        } catch (RuntimeException e) { stopSelf(); return; }
        if (mOtherData == null || mUserData == null) { stopSelf(); return; }

        // Use current Activity preview holder
        mSurfaceHolder = CameraPreviewActivity.surfaceHolder;

        startRecording();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        return START_NOT_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        stopRecording();
        super.onDestroy();
    }

    @SuppressLint("ForegroundServiceType")
    private void startForegroundServiceNotification() {

//        String channelId = "video_record_service";
//        NotificationChannel channel = new NotificationChannel(
//                channelId,
//                "Recording Service",
//                NotificationManager.IMPORTANCE_LOW
//        );
//
//        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
//        manager.createNotificationChannel(channel);
//
//        Notification notif = new NotificationCompat.Builder(this, channelId)
//                .setContentTitle("Recording video")
//                .setContentText("Recording in progress…")
//                .setSmallIcon(R.drawable.atc_logo)
//                .build();
//
//        startForeground(1, notif);
    }

    public boolean startRecording() {
        try {
            // Open camera only ONCE
            mServiceCamera = CameraPreviewActivity.camera;
            if (mServiceCamera == null) {
                mServiceCamera = Camera.open(currentCameraId);
            }

            mServiceCamera.stopPreview();
            mServiceCamera.setDisplayOrientation(90);

            Camera.Parameters params = mServiceCamera.getParameters();
            List<Camera.Size> sizeList = params.getSupportedPreviewSizes();
            Camera.Size selectedSize = sizeList.get(0);
            params.setPreviewSize(selectedSize.width, selectedSize.height);
            mServiceCamera.setParameters(params);

            mServiceCamera.setPreviewDisplay(mSurfaceHolder);
            mServiceCamera.startPreview();

            // Unlock camera for MediaRecorder
            mServiceCamera.unlock();

            // Prepare MediaRecorder
            mMediaRecorder = new MediaRecorder();
            mMediaRecorder.setCamera(mServiceCamera);
            mMediaRecorder.setAudioSource(MediaRecorder.AudioSource.MIC);
            mMediaRecorder.setVideoSource(MediaRecorder.VideoSource.CAMERA);
            mMediaRecorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4);
            mMediaRecorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC);
            mMediaRecorder.setVideoEncoder(MediaRecorder.VideoEncoder.H264);
            mMediaRecorder.setOrientationHint(90);

            mMediaRecorder.setOutputFile(getOutputFilePath());
            mMediaRecorder.setVideoSize(selectedSize.width, selectedSize.height);
            mMediaRecorder.setPreviewDisplay(mSurfaceHolder.getSurface());

            mMediaRecorder.prepare();
            mMediaRecorder.start();

            startTimer();

            isRecording = true;
            Toast.makeText(getBaseContext(), "Recording Started", Toast.LENGTH_SHORT).show();

            return true;

        } catch (Exception e) {
            Log.e(TAG, "ERROR startRecording: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    public void stopRecording() {

        if (!isRecording) return;

        try {
            if (mMediaRecorder != null) {

                // Stop the timer UI
                countDownTimerPausable.cancel();
                CameraPreviewActivity.mTextViewTimer.setVisibility(View.GONE);

                try {
                    mMediaRecorder.stop();  // finalize MP4 file
                } catch (Exception ee) {
                    Log.e(TAG, "stop() failed: " + ee.getMessage());
                }

                // Make video appear in Gallery
                if (lastVideoPath != null) {

                    MediaScannerConnection.scanFile(
                            this,
                            new String[]{lastVideoPath},
                            new String[]{"video/mp4"},
                            null
                    );
                }

                mMediaRecorder.reset();
                mMediaRecorder.release();
                mMediaRecorder = null;
            }

            // Restart preview safely
            if (mServiceCamera != null) {

                try {
                    mServiceCamera.lock();
                } catch (Exception ignored) {}

                try {
                    mServiceCamera.reconnect();
                } catch (Exception ignored) {}

                try {
                    mServiceCamera.startPreview();
                } catch (Exception ignored) {}

            }

            Toast.makeText(getBaseContext(), "Recording Stopped", Toast.LENGTH_SHORT).show();

        } catch (Exception e) {
            Log.e(TAG, "stopRecording error: " + e.getMessage());
        }

        isRecording = false;
    }

    private void startTimer() {

        countDownTimerPausable = new CountDownTimerPausable(Long.MAX_VALUE, 1000) {
            @Override
            public void onTick(long millisUntilFinished) {

                CameraPreviewActivity.mTextViewTimer.setVisibility(View.VISIBLE);
                CameraPreviewActivity.mTextViewTimer.setText(
                        String.format("%02d:%02d:%02d", hours, minutes, seconds)
                );

                seconds++;
                if (seconds == 60) {
                    seconds = 0;
                    minutes++;
                }
            }

            @Override
            public void onFinish() { }
        }.start();
    }
    private String lastVideoPath = null;

    private String getOutputFilePath() {

        // Public Movies/MyAppVideos folder
        File dir = new File(
                Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MOVIES),
                "VideoRecording"
        );

        if (!dir.exists()) dir.mkdirs();

        String timeStamp = new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(new Date());
        String fileName = "Video_" + timeStamp + ".mp4";

        File videoFile = new File(dir, fileName);

        // Save the path for MediaScanner update after stop
        lastVideoPath = videoFile.getAbsolutePath();

        return lastVideoPath;
    }



    public static void zoomIn() {
        try {
            if (mServiceCamera == null) return;

            Camera.Parameters params = mServiceCamera.getParameters();
            if (params.isZoomSupported()) {
                int currentZoom = params.getZoom();
                int maxZoom = params.getMaxZoom();

                if (currentZoom < maxZoom) {
                    params.setZoom(currentZoom + 5);  // step size 5
                    mServiceCamera.setParameters(params);
                }
            }
        } catch (Exception e) {
            Log.e("Zoom", "zoomIn error: " + e);
        }
    }


    public static void zoomOut() {
        try {
            if (mServiceCamera == null) return;

            Camera.Parameters params = mServiceCamera.getParameters();
            if (params.isZoomSupported()) {
                int currentZoom = params.getZoom();

                if (currentZoom > 0) {
                    params.setZoom(currentZoom - 5);  // step size 5
                    mServiceCamera.setParameters(params);
                }
            }
        } catch (Exception e) {
            Log.e("Zoom", "zoomOut error: " + e);
        }
    }


    public static void zoomClear() {
        try {
            if (mServiceCamera == null) return;

            Camera.Parameters params = mServiceCamera.getParameters();
            params.setZoom(0);
            mServiceCamera.setParameters(params);

        } catch (Exception e) {
            Log.e("Zoom", "zoomClear error: " + e);
        }
    }
    public static void OnOffFlashLight(String jsondata) {
        try {
            JSONArray jsonArray = new JSONArray(jsondata);
            String keyname = jsonArray.getString(0);

            if ("on".equalsIgnoreCase(keyname)) {
                turnFlashlightOn();
            } else {
                turnFlashlightOff();
            }

        } catch (Exception e) {
            Log.e("Flash", "Flash JSON error: " + e);
        }
    }
    public static void turnFlashlightOn() {
        try {
            if (mServiceCamera == null) return;

            Camera.Parameters params = mServiceCamera.getParameters();

            if (!params.getSupportedFlashModes().contains(Camera.Parameters.FLASH_MODE_TORCH))
                return;

            params.setFlashMode(Camera.Parameters.FLASH_MODE_TORCH);
            mServiceCamera.setParameters(params);

            CameraPreviewActivity.mFlashOff.setVisibility(View.VISIBLE);
            CameraPreviewActivity.mFlashOn.setVisibility(View.GONE);

        } catch (Exception e) {
            Log.e("Flash", "Flash ON error: " + e);
        }
    }
    public static void turnFlashlightOff() {
        try {
            if (mServiceCamera == null) return;

            Camera.Parameters params = mServiceCamera.getParameters();
            params.setFlashMode(Camera.Parameters.FLASH_MODE_OFF);
            mServiceCamera.setParameters(params);

            CameraPreviewActivity.mFlashOff.setVisibility(View.GONE);
            CameraPreviewActivity.mFlashOn.setVisibility(View.VISIBLE);

        } catch (Exception e) {
            Log.e("Flash", "Flash OFF error: " + e);
        }
    }
    public static void takescreenshot(String jsonData) {

        try {
            CameraPreviewActivity.mImageViewLoading.setVisibility(View.VISIBLE);

            mServiceCamera.takePicture(null, null, (data, camera) -> {
                Bitmap bitmap = BitmapFactory.decodeByteArray(data, 0, data.length);
                TakeScreenshot(bitmap, jsonData);
            });

        } catch (Exception e) {
            Log.e("Screenshot", "TakePicture error: " + e);
        }
    }
    public static void TakeScreenshot(Bitmap bitmap, String jsonData) {

        try {
            // Rotate photo based on preview orientation
            Matrix matrix = new Matrix();
            matrix.postRotate(90);
            bitmap = Bitmap.createBitmap(bitmap, 0, 0, bitmap.getWidth(), bitmap.getHeight(), matrix, true);

            // Prepare storage folder
            File dir = new File(getContext().getExternalFilesDir(Environment.DIRECTORY_PICTURES), "Screenshots");
            if (!dir.exists()) dir.mkdirs();

            String fileName = "IMG_" + System.currentTimeMillis() + ".jpeg";
            File photoFile = new File(dir, fileName);

            // Save file
            FileOutputStream fos = new FileOutputStream(photoFile);
            bitmap.compress(Bitmap.CompressFormat.JPEG, 100, fos);
            fos.close();

            // Show thumbnail
            Bitmap thumb = CameraPreviewActivity.createThumbnail(bitmap, 200);
            CameraPreviewActivity.mImageViewLoading.setVisibility(View.GONE);
            CameraPreviewActivity.mScreenshotThumbnail.setVisibility(View.VISIBLE);
            CameraPreviewActivity.mScreenshotThumbnail.setImageBitmap(thumb);

            new Handler(Looper.getMainLooper()).post(() ->
                    CameraPreviewActivity.showToast("Screenshot saved")
            );

            // Broadcast result
            if(!jsonData.equalsIgnoreCase(""))  {
                Intent intent = new Intent("com.easyfrom.jitsi.SCREENSHOT_SAVED");
                intent.putExtra("screenshot_path", photoFile.getAbsolutePath());
                intent.putExtra("photo_name", fileName);
                intent.putExtra("jsonData", jsonData);
                intent.putExtra("task_id", mOtherData.getServer_task_id());
                intent.putExtra("LOGIN_USER_DATA",loginUserDataString);
                intent.putExtra("OTHER_DATA",otherDataString);
                intent.putExtra("JITSI_MEETING_PLUGIN_ARGS",pluginArgsString);
                intent.putExtra("NOTIFICATION_REMOTE_DATA",notificationRemoteDataString);
                mActivity.sendBroadcast(intent);
            }

            // Restart preview
            mServiceCamera.startPreview();

            new Handler().postDelayed(() ->
                    CameraPreviewActivity.mScreenshotThumbnail.setVisibility(View.GONE), 2000);

        } catch (Exception e) {
            Log.e("Screenshot", "Save error: " + e);
        }
    }
    public static void backfroncamera(String jsondata) {

        try {
            JSONArray jsonArray = new JSONArray(jsondata);
            String keyname = jsonArray.getString(0);

            // Stop preview first
            try {
                if (mServiceCamera != null) {
                    mServiceCamera.stopPreview();
                    mServiceCamera.release();
                }
            } catch (Exception ignored) {}

            // Set new camera ID
            if (keyname.equalsIgnoreCase("front")) {
                currentCameraId = Camera.CameraInfo.CAMERA_FACING_FRONT;
                CameraPreviewActivity.FrontCamera.setVisibility(View.GONE);
                CameraPreviewActivity.BackCamera.setVisibility(View.VISIBLE);
            } else {
                currentCameraId = Camera.CameraInfo.CAMERA_FACING_BACK;
                CameraPreviewActivity.FrontCamera.setVisibility(View.VISIBLE);
                CameraPreviewActivity.BackCamera.setVisibility(View.GONE);
            }

            // Open new camera
            mServiceCamera = Camera.open(currentCameraId);
            CameraPreviewActivity.setCameraDisplayOrientation(mActivity, currentCameraId, mServiceCamera);

            mServiceCamera.setPreviewDisplay(mSurfaceHolder);
            mServiceCamera.startPreview();

        } catch (Exception e) {
            Log.e("CameraSwitch", "Switch error: " + e);
        }
    }


}
