package com.sky.atc.easyformse;

import java.io.FileOutputStream;
import java.io.IOException;
import java.text.DecimalFormat;
import java.util.Collections;
import java.util.List;

import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.hardware.Camera;
import android.hardware.Camera.Parameters;
import android.hardware.Camera.PreviewCallback;
import android.os.Build;
import android.os.Handler;
import android.util.Log;
import android.util.Size;
import android.view.MotionEvent;
import android.view.Surface;
import android.view.SurfaceHolder;
import android.view.SurfaceView;
import android.view.View;

import androidx.annotation.RequiresApi;

import com.google.gson.JsonObject;
import com.sky.atc.easyformse.azurevision.AutofocusTouchListner;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.utils.LogUtils;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

import static android.content.Context.MODE_PRIVATE;

//To set Camera Preview and camera parameter
@StringFogIgnore
class Preview extends SurfaceView implements SurfaceHolder.Callback, AutofocusTouchListner {
    private static final String TAG = "Preview";
    boolean isfocus = false;
    SurfaceHolder mHolder;
    public Camera camera;
    public Activity acti;
    public int cam_id;
    public int cameraviewid;
    B_new b = new B_new();
    float mDist = 0;
    private int previewHeight;
    private int previewWidth;

    Preview(Context context) {
        super(context);

        // Install a SurfaceHolder.Callback so we get notified when the
        // underlying surface is created and destroyed.

        MakePhotoActivity.autofocusTouchListner = this;

        mHolder = getHolder();
        mHolder.addCallback(this);
        mHolder.setType(SurfaceHolder.SURFACE_TYPE_PUSH_BUFFERS);
    }

    public void surfaceCreated(SurfaceHolder holder) {
        // The Surface has been created, acquire the camera and tell it where
        // to draw.
        if (camera == null) {
            camera = Camera.open(cameraviewid);
            Parameters p = camera.getParameters();
            int k = b.getFlash();
            set_flash(k);
            b.setC(camera);

        }

        try {
            camera.setPreviewDisplay(holder);

//            camera.setPreviewCallback(new PreviewCallback() {
//                public void onPreviewFrame(byte[] data, Camera arg1) {
//                    FileOutputStream outStream = null;
//                    Preview.this.invalidate();
//                }
//            });
        } catch (IOException e) {
            LogUtils.photoLogFile("Exception: " + e.toString(), Preview.class.getSimpleName() + "surfaceCreated");
        }
    }


    //To set flash
    void set_flash(int i) {
        Parameters p = camera.getParameters();

        List<String> supportedFlashModes = p.getSupportedFlashModes();
        if (supportedFlashModes == null
                || supportedFlashModes.isEmpty()
                || supportedFlashModes.size() == 1
                && supportedFlashModes.get(0).equals(
                Parameters.FLASH_MODE_OFF)) {

        } else {

            if (i == 1) {
                p.setFlashMode(Parameters.FLASH_MODE_ON);
            } else if (i == 0 || i == -1) {
                p.setFlashMode(Parameters.FLASH_MODE_OFF);
            } else if (i == 2) {
                p.setFlashMode(Parameters.FLASH_MODE_AUTO);
            }
        }

        camera.setParameters(p);
    }


    public void surfaceDestroyed(SurfaceHolder holder) {
        // Surface will be destroyed when we return, so stop the preview.
        // Because the CameraDevice object is not a shared resource, it's very
        // important to release it when the activity is paused.
        camera.stopPreview();
        camera.setPreviewCallback(null);
        camera.release();
        camera = null;
    }

    @RequiresApi(api = Build.VERSION_CODES.LOLLIPOP)
    public void surfaceChanged(SurfaceHolder holder, int format, int w, int h) {
        // Now that the size is known, set up the camera parameters and begin
        // the preview.
        camera.stopPreview();

        Parameters parameters = camera.getParameters();
        List<Camera.Size> size = parameters.getSupportedPictureSizes();
        int max_width = Integer.MAX_VALUE;
        int max_height = Integer.MAX_VALUE;


        int max = 0;
        int index = 0;

        int previewMax = 0;
        int previewIndex = 0;

        for (int i = 0; i < size.size(); i++) {
            Camera.Size s = size.get(i);

            float heightR = size.get(i).width;
            float widthR = size.get(i).height;

            float ratio = heightR / widthR;

            String s2 = String.format("%.2f", ratio);
            Log.d("##PREVIEWRATIO", String.valueOf(s2));

            Size deviceReolution = MakePhotoActivity.deviceRealSize;

            float deviceRatio;
            deviceRatio = (float) deviceReolution.getHeight() / (float) deviceReolution.getWidth();
            String deviRatio = String.format("%.2f", deviceRatio);

            if (s.width < 2000) {
//                if (s2.equalsIgnoreCase("1.33") || s2.equalsIgnoreCase("1.78")) {
                if (s2.equalsIgnoreCase("1.78")) {
                    if (s.width > max) {
                        index = i;
                        max = s.width;
                        max_width = size.get(i).width;
                        max_height = size.get(i).height;
                        LogUtils.photoLogFile("##DeviceRatio: " + s2 + " ##PREVIEWHEGHT: " + "Height :" + max_height + " Width:" + max_width, Preview.class.getSimpleName() + "deviRatio 1");
                    }
                }
//                if (s2.equalsIgnoreCase(deviRatio)) {
//
//                    if (previewWidth == 0) {
//                        previewWidth = size.get(i).width;
//                        previewHeight = size.get(i).height;
//                        Log.d("##PREVIEWSIZE", "Height :" + previewHeight + " Width:" + previewWidth);
//                    }
//                }
            }
        }

        if (previewWidth == 0) {
            previewWidth = max_width;
            previewHeight = max_height;
        }

        parameters.setPictureSize(size.get(index).width, size.get(index).height);


        MySharedPreferences editor = sqlitewraper.getSecureShared("Size");
        editor.putInt("max_width", max_width);
        editor.putInt("max_height", max_height);
        editor.commit();


        try {
            parameters.setFocusMode(Parameters.FOCUS_MODE_AUTO);
            parameters.setPreviewSize(previewWidth, previewHeight);
            setCameraDisplayOrientation(acti, cam_id, camera);
            parameters.setPictureSize(max_width, max_height);
            final Handler handler = new Handler();
            handler.postDelayed(() -> {
                try {
                    handleFocus(parameters);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }, 1000);
        } catch (Exception e) {
            LogUtils.photoLogFile("Exception: " + e.toString(), Preview.class.getSimpleName());

            for (int i = 0; i < size.size(); i++) {
                Camera.Size s = size.get(i);
//          int size1 = s.height * s.width;

                float heightR = size.get(i).width;
                float widthR = size.get(i).height;

                float ratio = heightR / widthR;

                String s2 = String.format("%.2f", ratio);
                Log.d("##PREVIEWRATIO", String.valueOf(s2));

                Size deviceReolution = MakePhotoActivity.deviceRealSize;

                float deviceRatio;
                deviceRatio = (float) deviceReolution.getHeight() / (float) deviceReolution.getWidth();
                String deviRatio = String.format("%.2f", deviceRatio);

                if (s.width < 2000) {

//                    if (s2.equalsIgnoreCase("1.33") || s2.equalsIgnoreCase("1.78")) {
                    if (s2.equalsIgnoreCase("1.78")) {

                        if (s.width > max) {
                            index = i;
                            max = s.width;
                            max_width = size.get(i).width;
                            max_height = size.get(i).height;
                            Log.d("##PREVIEWHEGHT", "Height :" + max_height + " Width:" + max_width);
                        }
                    }
//                    if (s2.equalsIgnoreCase(deviRatio)) {
//
//                        if (previewWidth == 0) {
//                            previewWidth = size.get(i).width;
//                            previewHeight = size.get(i).height;
//                            Log.d("##PREVIEWSIZE", "Height :" + previewHeight + " Width:" + previewWidth);
//                        }
//                    }
                }
            }

            if (previewWidth == 0) {
                previewWidth = max_width;
                previewHeight = max_height;
            }

            parameters.setPictureSize(size.get(index).width, size.get(index).height);

            MySharedPreferences editor1 = sqlitewraper.getSecureShared("Size");
            editor1.putInt("max_width", max_width);
            editor1.putInt("max_height", max_height);
            editor1.commit();


            try {
                parameters.setFocusMode(Parameters.FOCUS_MODE_AUTO);
                parameters.setPreviewSize(max_width, max_height);
                setCameraDisplayOrientation(acti, cam_id, camera);
                parameters.setPictureSize(max_width, max_height);
                final Handler handler = new Handler();
                handler.postDelayed(() -> {
                    try {
                        handleFocus(parameters);
                    } catch (Exception e1) {
                        e1.printStackTrace();
                    }
                }, 1000);
            } catch (Exception e1) {
                LogUtils.photoLogFile("Exception: " + e.toString(), Preview.class.getSimpleName());

            }
        }

        try {
            camera.setParameters(parameters);
        } catch (Exception e) {
            LogUtils.photoLogFile("Exception: " + e.toString(), Preview.class.getSimpleName() + "set Parametesrs");

        }
        camera.startPreview();
    }


    //to set display orientation
    public static void setCameraDisplayOrientation(Activity activity,
                                                   int cameraId, Camera camera) {
        Camera.CameraInfo info = new Camera.CameraInfo();
        Camera.getCameraInfo(cameraId, info);
        int rotation = activity.getWindowManager().getDefaultDisplay()
                .getRotation();
        int degrees = 0;
        switch (rotation) {
            case Surface.ROTATION_0:
                degrees = 0;
                break;
            case Surface.ROTATION_90:
                degrees = 90;
                break;
            case Surface.ROTATION_180:
                degrees = 180;
                break;
            case Surface.ROTATION_270:
                degrees = 270;
                break;
        }

        int result;
        if (info.facing == Camera.CameraInfo.CAMERA_FACING_FRONT) {
            result = (info.orientation + degrees) % 360;
            result = (360 - result) % 360; // compensate the mirror
        } else { // back-facing
            result = (info.orientation - degrees + 360) % 360;
        }
        camera.setDisplayOrientation(result);
    }

    @Override
    public void draw(Canvas canvas) {

        Paint p = new Paint(Color.RED);
        Log.d(TAG, "draw");
        canvas.drawText("PREVIEW", canvas.getWidth() / 2,
                canvas.getHeight() / 2, p);
        super.draw(canvas);
    }


    //Touch Event to handle auto focus and etc
    @Override
    public boolean onTouchEvent(final MotionEvent event) {

        Log.d("##PREVIEW_ONTOUCH", String.valueOf(event.getAction()));

        // Get the pointer ID
        final Camera.Parameters params = camera.getParameters();
        int action = event.getAction();

        try {
            if (event.getPointerCount() > 1) {
                // handle multi-touch events
                if (action == MotionEvent.ACTION_POINTER_DOWN) {
                    mDist = getFingerSpacing(event);
                } else if (action == MotionEvent.ACTION_MOVE && params.isZoomSupported()) {
                    camera.cancelAutoFocus();
                    handleZoom(event, params);
                }
            } else {
                // handle single touch events
                if (action == MotionEvent.ACTION_UP) {
                    try {
                        final Handler handler = new Handler();
                        handler.postDelayed(new Runnable() {
                            @Override
                            public void run() {
                                try {
                                    handleFocus(event, params);
                                } catch (Exception e) {
                                    e.printStackTrace();
                                }
                            }
                        }, 1000);
                    } catch (Exception e) {
                    }
                }
            }
        } catch (Exception e) {

        }
        return true;
    }

    //handle zoom
    private void handleZoom(MotionEvent event, Camera.Parameters params) {
        int maxZoom = params.getMaxZoom();
        int zoom = params.getZoom();
        float newDist = getFingerSpacing(event);
        if (newDist > mDist) {
            //zoom in
            if (zoom < maxZoom)
                zoom++;
        } else if (newDist < mDist) {
            //zoom out
            if (zoom > 0)
                zoom--;
        }
        mDist = newDist;
        params.setZoom(zoom);
        camera.setParameters(params);
    }

    public void handleFocus(MotionEvent event, Camera.Parameters params) {
        try {
            int pointerId = event.getPointerId(0);
            int pointerIndex = event.findPointerIndex(pointerId);
            // Get the pointer's current position
            float x = event.getX(pointerIndex);
            float y = event.getY(pointerIndex);

            List<String> supportedFocusModes = params.getSupportedFocusModes();
            if (supportedFocusModes != null && supportedFocusModes.contains(Camera.Parameters.FOCUS_MODE_AUTO)) {
                camera.autoFocus(new Camera.AutoFocusCallback() {
                    @Override
                    public void onAutoFocus(boolean b, Camera camera) {
                        // currently set to auto-focus on single touch
                    }
                });
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /**
     * Determine the space between the first two fingers
     */
    private float getFingerSpacing(MotionEvent event) {
        // ...
        float x = event.getX(0) - event.getX(1);
        float y = event.getY(0) - event.getY(1);
        return (float) Math.sqrt(x * x + y * y);
    }

    private Camera.Size getOptimalPreviewSize(List<Camera.Size> sizes, int w, int h) {
        final double ASPECT_TOLERANCE = 0.1;
        double targetRatio = (double) h / w;

        if (sizes == null) return null;

        Camera.Size optimalSize = null;
        double minDiff = Double.MAX_VALUE;

        int targetHeight = h;

        for (Camera.Size size : sizes) {
            double ratio = (double) size.width / size.height;
            if (Math.abs(ratio - targetRatio) > ASPECT_TOLERANCE) continue;
            if (Math.abs(size.height - targetHeight) < minDiff) {
                optimalSize = size;
                minDiff = Math.abs(size.height - targetHeight);
            }
        }

        if (optimalSize == null) {
            minDiff = Double.MAX_VALUE;
            for (Camera.Size size : sizes) {
                if (Math.abs(size.height - targetHeight) < minDiff) {
                    optimalSize = size;
                    minDiff = Math.abs(size.height - targetHeight);
                }
            }
        }
        return optimalSize;
    }

    @Override
    public void onFocusTap() {
        Log.d("##TAP_FOCUS", "FOCUS_MODE");
        try {
            camera.autoFocus((b, camera) -> {
                // currently set to auto-focus on single touch
                Log.d("##TAP_FOCUS", String.valueOf(b));

            });
        } catch (Exception e) {
            LogUtils.photoLogFile("Exception: " + e.toString(), Preview.class.getSimpleName() + "onFocusTap");
            e.printStackTrace();
        }
    }

    public void handleFocus(Parameters params) {
        try {
            List<String> supportedFocusModes = params.getSupportedFocusModes();
            if (supportedFocusModes != null && supportedFocusModes.contains(Parameters.FOCUS_MODE_AUTO)) {
                camera.autoFocus(new Camera.AutoFocusCallback() {
                    @Override
                    public void onAutoFocus(boolean b, Camera camera) {
                        // currently set to auto-focus on single touch
                    }
                });
            }
        } catch (Exception e) {
            LogUtils.photoLogFile("Exception: " + e.toString(), Preview.class.getSimpleName() + "handleFocus");

            e.printStackTrace();
        }
    }
}