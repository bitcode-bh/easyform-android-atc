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
    private int displayAngle = 90;
    private boolean mirrored = true;

    Preview(Context context) {
        super(context);
        setLayoutParams(new android.widget.FrameLayout.LayoutParams(-1, -1, android.view.Gravity.CENTER));

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
            cam_id = findCamera(cameraviewid == 1);
            camera = Camera.open(cam_id);
            Parameters p = camera.getParameters();
            int k = b.getFlash();
            set_flash(k);
            b.setC(camera);

        }

        try {
            camera.setPreviewDisplay(holder);
            applyMirror();
            if (acti instanceof MakePhotoActivity) ((MakePhotoActivity) acti).onCameraReady(isFrontCamera());

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
        if (p.getSupportedFlashModes() == null || p.getSupportedFlashModes().isEmpty()) return;

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
        if (camera == null) return;
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
        if (camera == null) return;
        try {
            camera.stopPreview();
            Parameters parameters = camera.getParameters();
            Camera.CameraInfo info = new Camera.CameraInfo(); Camera.getCameraInfo(cam_id, info);
            int degrees = acti.getWindowManager().getDefaultDisplay().getRotation() * 90;
            displayAngle = com.sky.atc.easyformse.camera.CameraGeometry.previewRotation(info.orientation, degrees, isFrontCamera());
            List<Camera.Size> pictures = parameters.getSupportedPictureSizes();
            Camera.Size sensor = pictures.get(0);
            for(Camera.Size candidate:pictures) if((long)candidate.width*candidate.height > (long)sensor.width*sensor.height) sensor=candidate;
            Camera.Size picture = chooseSize(pictures, (float)sensor.width/sensor.height, 2000);
            Camera.Size stream = chooseSize(parameters.getSupportedPreviewSizes(), (float)picture.width/picture.height, 1920);
            previewWidth = stream.width; previewHeight = stream.height;
            parameters.setPreviewSize(stream.width, stream.height);
            parameters.setPictureSize(picture.width, picture.height);
            parameters.setRotation(com.sky.atc.easyformse.camera.CameraGeometry.jpegRotation(info.orientation, degrees, isFrontCamera()));
            List<String> modes = parameters.getSupportedFocusModes();
            if (modes != null && modes.contains(Parameters.FOCUS_MODE_CONTINUOUS_PICTURE)) parameters.setFocusMode(Parameters.FOCUS_MODE_CONTINUOUS_PICTURE);
            camera.setParameters(parameters); camera.setDisplayOrientation(displayAngle);
            MySharedPreferences prefs = sqlitewraper.getSecureShared("Size");
            prefs.putInt("max_width", picture.width); prefs.putInt("max_height", picture.height); prefs.commit();
            requestLayout(); applyMirror(); camera.startPreview();
        } catch (RuntimeException error) {
            LogUtils.photoLogFile("Unable to configure preview: " + error.getClass().getSimpleName(), TAG);
        }
    }
    private Camera.Size chooseSize(List<Camera.Size> sizes, float ratio, int maxWidth) {
        Camera.Size best = null; double score = Double.MAX_VALUE;
        boolean bounded = false; for(Camera.Size size:sizes) if(size.width <= maxWidth) bounded = true;
        for(Camera.Size size:sizes) {
            if(bounded && size.width > maxWidth) continue;
            double candidate = Math.abs((double)size.width/size.height-ratio);
            if(best==null || candidate < score-0.0001 || (Math.abs(candidate-score)<0.0001 && (long)size.width*size.height > (long)best.width*best.height)) { best=size; score=candidate; }
        }
        return best;
    }
    private int findCamera(boolean front) {
        for(int id=0;id<Camera.getNumberOfCameras();id++) { Camera.CameraInfo info=new Camera.CameraInfo(); Camera.getCameraInfo(id,info); if((info.facing==Camera.CameraInfo.CAMERA_FACING_FRONT)==front) return id; }
        return 0;
    }
    boolean isFrontCamera() { Camera.CameraInfo info=new Camera.CameraInfo(); Camera.getCameraInfo(cam_id,info); return info.facing==Camera.CameraInfo.CAMERA_FACING_FRONT; }
    void setMirrored(boolean value) { mirrored=value; applyMirror(); }
    private void applyMirror() { setScaleX(com.sky.atc.easyformse.camera.CameraGeometry.needsLegacyFlip(isFrontCamera(),mirrored) ? -1 : 1); }
    @Override protected void onMeasure(int widthSpec,int heightSpec) {
        int width=MeasureSpec.getSize(widthSpec), height=MeasureSpec.getSize(heightSpec);
        if(width<=0) { super.onMeasure(widthSpec,heightSpec); return; }
        if(height<=0) height=width*2;
        int[] fit=com.sky.atc.easyformse.camera.CameraGeometry.fit(width,height,previewWidth>0?previewWidth:1920,previewHeight>0?previewHeight:1080,displayAngle);
        setMeasuredDimension(fit[0],fit[1]);
    }

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