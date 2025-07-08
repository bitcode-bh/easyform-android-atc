package com.example.nitin.newcustomvideorecording;

/**
 * Created by Divyang on 2/17/2017.
 */

import static com.example.nitin.newcustomvideorecording.Mp4ParserWrapper.TAG;

import android.app.Activity;
import android.app.ProgressDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.hardware.Camera;
import android.media.MediaRecorder;
import android.os.AsyncTask;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.util.Log;
import android.view.SurfaceHolder;
import android.view.SurfaceView;
import android.view.View;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AlertDialog;

import java.io.File;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.TimeUnit;

public class AndroidVideoCapture extends Activity implements MediaRecorder.OnInfoListener {

    private Camera myCamera;
    private MyCameraSurfaceView myCameraSurfaceView;
    private MediaRecorder mediaRecorder;

    Button myButton;
    Button pauseButton;
    SurfaceHolder surfaceHolder;
    boolean recording;
    TextView timerText;
    TextView timerText2;
    File f_file_new;
    String compress_path;
    Context context;

    int vc = 0;
    int cnt = 0;

    int pcnt = 0;
    int scnt = 0;
    int arraycnt = 0;

    int onpcnt = 0;
    int backcnt = 0;
    int trimcnt = 0;
    int reccnt = 0;


    int seconds = 0;
    int minutes = 0;
    int hours = 0;


    FrameLayout myCameraPreview;
    ArrayList<String> pausepath;

    CountDownTimerPausable countDownTimerPausable;
    Context c;
    long MINVideoSeconds;
    long MAXVideoMs = -1;
    long MAXVideoSize = 4; // mb
    String imei;
    private int previewHeight;
    private int previewWidth;
    /**
     * Called when the activity is first created.
     */
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        recording = false;
        c = this;

        setContentView(R.layout.video_layout);

        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);

        //Get Camera for preview
        myCamera = getCameraInstance();
        if (myCamera == null) {
            Toast.makeText(AndroidVideoCapture.this,
                    "Fail to get Camera",
                    Toast.LENGTH_LONG).show();
        }

        myCameraSurfaceView = new MyCameraSurfaceView(this, myCamera);
        myCameraPreview = (FrameLayout) findViewById(R.id.videoview);
        try {
            Bundle mBundle = getIntent().getExtras();
            if (mBundle != null) {
                MINVideoSeconds = mBundle.getLong("MINVideo", TimeUnit.SECONDS.convert(15, TimeUnit.SECONDS));
                MAXVideoMs = mBundle.getLong("MAXVideo", -1);
                MAXVideoSize = mBundle.getLong("MAXVideoSize", 4);
                imei = mBundle.getString("imei", "");
            } else {
                MINVideoSeconds = TimeUnit.SECONDS.convert(15, TimeUnit.SECONDS);
                MAXVideoMs = -1;
                MAXVideoSize = 4;
                imei = "";
            }
        } catch (Exception e) {
            MINVideoSeconds = TimeUnit.SECONDS.convert(15, TimeUnit.SECONDS);
            MAXVideoMs = -1;
            MAXVideoSize = 4;
            imei = "";
        }


        myCameraPreview.addView(myCameraSurfaceView);

        timerText = (TextView) findViewById(R.id.cam_timer);
        timerText2 = (TextView) findViewById(R.id.cam_timer2);

        myButton = (Button) findViewById(R.id.mybutton);
        pauseButton = (Button) findViewById(R.id.mypause);
        myButton.setOnClickListener(myButtonOnClickListener);
        pauseButton.setOnClickListener(myButtonOnClickListener);
        pauseButton.setVisibility(View.GONE);

        pausepath = new ArrayList<>();

        context = AndroidVideoCapture.this;
    }

    Button.OnClickListener myButtonOnClickListener
            = new Button.OnClickListener() {

        @Override
        public void onClick(View v) {
            // TODO Auto-generated method stub

            int id = v.getId();
            if (id == R.id.mybutton) {
                pauseButton.setVisibility(View.VISIBLE);
                recordVideo();
            } else if (id == R.id.mypause) {
                pauseVideo();
            }
        }
    };

    private Camera getCameraInstance() {
        // TODO Auto-generated method stub
        Camera c = null;
        try {
            c = Camera.open(); // attempt to get a Camera instance
            c.setDisplayOrientation(90);

        } catch (Exception e) {

            // Camera is not available (in use or does not exist)
        }
        return c; // returns null if camera is unavailable
    }

    private boolean prepareMediaRecorder() {

        int max = 0;
        int index = 0;
        myCamera = getCameraInstance();
        Camera.Parameters p = myCamera.getParameters();
        final List<Camera.Size> listSize = p.getSupportedPreviewSizes();
        int max_width = Integer.MAX_VALUE;
        int max_height = Integer.MAX_VALUE;
        for (int i = 0; i < listSize.size(); i++) {
            Camera.Size s = listSize.get(i);

            float heightR = listSize.get(i).width;
            float widthR = listSize.get(i).height;

            float ratio = heightR / widthR;

            String s2 = String.format("%.2f", ratio);
            Log.d("##PREVIEWRATIO", String.valueOf(s2));

            if (s.width < 2000) {
//                if (s2.equalsIgnoreCase("1.33") || s2.equalsIgnoreCase("1.78")) {
                if (s2.equalsIgnoreCase("1.78")) {
                    if (s.width > max) {
                        index = i;
                        max = s.width;
                        max_width = listSize.get(i).width;
                        max_height = listSize.get(i).height;
                        Log.d("##DeviceRatio: " + s2 + " ##PREVIEWHEGHT: " + "Height :" + max_height + " Width:" + max_width, "deviRatio 1");
                    }
                }

            }
        }

        if (previewWidth == 0) {
            previewWidth = max_width;
            previewHeight = max_height;
        }

        p.setPictureSize(listSize.get(index).width, listSize.get(index).height);
        p.setPreviewSize(previewWidth,previewHeight);
        myCamera.setParameters(p);
        try {
            myCamera.setDisplayOrientation(90);
            myCamera.setPreviewDisplay(myCameraSurfaceView.mHolder);
            p.setFocusMode(Camera.Parameters.FOCUS_MODE_AUTO);
            final Handler handler = new Handler();
            handler.postDelayed(() -> {
                try {
                    handleFocus(p);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }, 1000);
            myCamera.startPreview();
        } catch (IOException e) {
            Log.e(TAG, e.getMessage());
            e.printStackTrace();
        }
        mediaRecorder = new MediaRecorder();
        if (MAXVideoMs != -1) {
            mediaRecorder.setMaxDuration((int) MAXVideoMs);
        }
        myCamera.unlock();
        mediaRecorder.setCamera(myCamera);
        mediaRecorder.setOnInfoListener(new MediaRecorder.OnInfoListener() {
            @Override
            public void onInfo(MediaRecorder mr, int what, int extra) {

            }
        });

        countDownTimerPausable = new CountDownTimerPausable(Long.MAX_VALUE, 1000) {
            @Override
            public void onTick(long millisUntilFinished) {

                timerText2.setText(String.format("%02d:%02d:%02d", hours, minutes, seconds));

                seconds++;
                if (seconds >= MINVideoSeconds) {
                    vc = 1;
                    myButton.setVisibility(View.VISIBLE);
                }

                if (seconds >= 60) {
                    seconds = 0;
                    minutes++;
                }

            }

            @Override
            public void onFinish() {
            }
        }.start();


        File sdcard = Environment.getExternalStorageDirectory();
        f_file_new = new File(sdcard + "/Video_EasyForm");
        f_file_new.mkdir();


        String dst = Environment.getExternalStorageDirectory().getAbsolutePath();

        final String timeStamp = new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(new Date());
        final String fileName = "VID_" + timeStamp + "_" + imei + ".mp4";
        String filePath = dst + "/Video_EasyForm/" + fileName;

        f_file_new = new File(filePath);


        mediaRecorder.setAudioSource(MediaRecorder.AudioSource.MIC);
        mediaRecorder.setVideoSource(MediaRecorder.VideoSource.DEFAULT);
        mediaRecorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4);
        mediaRecorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC);
        mediaRecorder.setVideoEncoder(MediaRecorder.VideoEncoder.H264);

//        mediaRecorder.setLocation(23.56f,72.56f);
        mediaRecorder.setOrientationHint(90);
        mediaRecorder.setOutputFile(filePath);
        mediaRecorder.setMaxFileSize(MAXVideoSize * 1024 * 1024);  //Set max file size 5M
        mediaRecorder.setOnInfoListener(this);
        // mediaRecorder.setVideoFrameRate(30);
        //mediaRecorder.setVideoSize(640,480);
        mediaRecorder.setPreviewDisplay(myCameraSurfaceView.getHolder().getSurface());

        return true;
    }

    @Override
    protected void onPause() {
        super.onPause();

        releaseMediaRecorder(); // if you are using MediaRecorder, release it first
        releaseCamera(); // release the camera immediately on pause event

        if (onpcnt == 1 || backcnt == 1) {

            finish();
        } else {

            if (arraycnt == 0 && reccnt != 0) {

                pauseVideo();
            }

        }


    }

    private void releaseMediaRecorder() {

        if (mediaRecorder != null) {
            mediaRecorder.reset();      // clear recorder configuration
            mediaRecorder.release();   // release the recorder object
            mediaRecorder = null;
            myCamera.lock();           // lock camera for later use
        }
    }

    private void releaseCamera() {

        if (myCamera != null) {

            myCamera.release();        // release the camera for other applications
            myCamera = null;

        }
    }

    @Override
    public void onInfo(MediaRecorder mr, int what, int extra) {
        if (MAXVideoMs != -1) {
            if (what == MediaRecorder.MEDIA_RECORDER_INFO_MAX_DURATION_REACHED) {
                if (vc == 1) {
                    myButton.performClick();
                }
            }
        }
        if (what == MediaRecorder.MEDIA_RECORDER_INFO_MAX_FILESIZE_REACHED) {
            releaseMediaRecorder();
            releaseCamera();
            alert();
        }
    }

    public void recordVideo() {

        reccnt = 1;

        if (pcnt == 1) {

            compress_path = f_file_new.getAbsolutePath();

            if (scnt == 1) {

                // mediaRecorder.stop();  // stop the recording
                releaseMediaRecorder(); // release the MediaRecorder object

                //Exit after saved
                compress_path = f_file_new.getAbsolutePath();
                Bundle b = new Bundle();
                Intent intent = new Intent();
                intent.putExtra("video_path", compress_path);
                intent.putExtras(b);
                setResult(RESULT_OK, intent);
                finish();

            } else {

                // mediaRecorder.stop();  // stop the recording
                releaseMediaRecorder();
                if (arraycnt != 1) {
                    pausepath.add(compress_path);
                }

                new MergeVideo().execute();

            }
        }

        if (recording) {

            Toast.makeText(getApplicationContext(), "Stop", Toast.LENGTH_SHORT).show();

            if (vc == 1) {

                if (pcnt != 1) {

                    //stop recording and release camera
                    mediaRecorder.stop();  // stop the recording
                    releaseMediaRecorder(); // release the MediaRecorder object

                    //Exit after saved
                    onpcnt = 1;
                    compress_path = f_file_new.getAbsolutePath();
                    Bundle b = new Bundle();
                    Intent intent = new Intent();
                    intent.putExtra("video_path", compress_path);
                    intent.putExtras(b);
                    setResult(RESULT_OK, intent);
                    finish();

                }
            }

        } else {


            //Release Camera before MediaRecorder start
            releaseCamera();

            if (pcnt != 1) {

                if (!prepareMediaRecorder()) {
                    Toast.makeText(AndroidVideoCapture.this,
                            "Fail in prepareMediaRecorder()!\n - Ended -",
                            Toast.LENGTH_LONG).show();
                    finish();
                }
                Toast.makeText(getApplicationContext(), "Recording... \n You have to record for 15 seconds.", Toast.LENGTH_LONG).show();
                try {
                    mediaRecorder.prepare();
                } catch (IOException e) {
                    releaseMediaRecorder();
                    e.printStackTrace();
                }
                mediaRecorder.start();
                recording = true;
                myButton.setText("STOP");
                myButton.setVisibility(View.GONE);

            }

        }
    }
    public void handleFocus(Camera.Parameters params) {
        try {
            List<String> supportedFocusModes = params.getSupportedFocusModes();
            if (supportedFocusModes != null && supportedFocusModes.contains(Camera.Parameters.FOCUS_MODE_AUTO)) {
                myCamera.autoFocus(new Camera.AutoFocusCallback() {
                    @Override
                    public void onAutoFocus(boolean b, Camera camera) {
                        // currently set to auto-focus on single touch
                    }
                });
            }
        } catch (Exception e) {
            // LogUtils.photoLogFile("Exception: " + e.toString(), Preview.class.getSimpleName() + "handleFocus");

            e.printStackTrace();
        }
    }
    public void pauseVideo() {

        reccnt = 1;

        if (recording) {

            if (trimcnt != 1) {

                Toast.makeText(getApplicationContext(), "Paused", Toast.LENGTH_SHORT).show();
                // pause timer
                countDownTimerPausable.pause();

                //stop recording and release camera

                mediaRecorder.stop();  // stop the recording
                releaseMediaRecorder();// release the MediaRecorder object
                pauseButton.setText("RESUME");
                recording = false;
                pcnt = 1;
                scnt++;
                arraycnt = 1;

                //for merging video on pause click
                compress_path = f_file_new.getAbsolutePath();
                pausepath.add(compress_path);
            }

        } else {

            Toast.makeText(getApplicationContext(), "Resume", Toast.LENGTH_SHORT).show();
            //Release Camera before MediaRecorder start
            releaseCamera();
            if (!prepareMediaRecorder()) {
                Toast.makeText(AndroidVideoCapture.this,
                        "Fail in prepareMediaRecorder()!\n - Ended -",
                        Toast.LENGTH_LONG).show();
                finish();
            }
            try {
                mediaRecorder.prepare();
            } catch (IOException e) {
                e.printStackTrace();
            }
            mediaRecorder.start();
            pauseButton.setText("PAUSE");
            recording = true;
            scnt++;
            arraycnt = 0;

        }
    }

    public class MyCameraSurfaceView extends SurfaceView implements SurfaceHolder.Callback {

        private SurfaceHolder mHolder;
        private Camera mCamera;

        private List<Camera.Size> mSupportedPreviewSizes;
        private Camera.Size mPreviewSize;

        private int mRatioWidth = 0;
        private int mRatioHeight = 0;

        public MyCameraSurfaceView(Context context, Camera camera) {
            super(context);
            mCamera = camera;

            mSupportedPreviewSizes = mCamera.getParameters().getSupportedPreviewSizes();
            for (Camera.Size str : mSupportedPreviewSizes)
                Log.e("Ji", str.width + "/" + str.height);

            setKeepScreenOn(true);

            // Install a SurfaceHolder.Callback so we get notified when the
            // underlying surface is created and destroyed.
            mHolder = getHolder();
            mHolder.addCallback(this);
            mHolder.setType(SurfaceHolder.SURFACE_TYPE_PUSH_BUFFERS);
        }

        @Override
        public void surfaceChanged(SurfaceHolder holder, int format, int weight,
                                   int height) {
            // If your preview can change or rotate, take care of those events here.
            // Make sure to stop the preview before resizing or reformatting it.

            if (mHolder.getSurface() == null) {
                // preview surface does not exist
                return;
            }

            // stop preview before making changes
            try {

                mCamera.stopPreview();
                Camera.Parameters parameters = mCamera.getParameters();
                parameters.setPreviewSize(mPreviewSize.width, mPreviewSize.height);
                mCamera.setParameters(parameters);
                mCamera.setDisplayOrientation(90);
                mCamera.setPreviewDisplay(mHolder);
                mCamera.startPreview();

            } catch (Exception e) {
                // ignore: tried to stop a non-existent preview
            }
        }

        @Override
        public void surfaceCreated(SurfaceHolder holder) {
            // TODO Auto-generated method stub
            // The Surface has been created, now tell the camera where to draw the preview.
            try {
                Camera.Parameters cameraParameters = mCamera.getParameters();
                List<Camera.Size> previewSizes = cameraParameters.getSupportedPreviewSizes();
                Camera.Size optimalPreviewSize = getOptimalPreviewSize(previewSizes, getResources().getDisplayMetrics().widthPixels, getResources().getDisplayMetrics().heightPixels);
                cameraParameters.setPreviewSize(optimalPreviewSize.width, optimalPreviewSize.height);
                mCamera.setParameters(cameraParameters);

                mCamera.setDisplayOrientation(90);
                mCamera.setPreviewDisplay(mHolder);
                mCamera.startPreview();

            } catch (IOException e) {

            }
        }

        @Override
        public void surfaceDestroyed(SurfaceHolder holder) {
            // TODO Auto-generated method stub

        }

        @Override
        protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {

            int width = MeasureSpec.getSize(widthMeasureSpec);
            int height = MeasureSpec.getSize(heightMeasureSpec);

            if (mSupportedPreviewSizes != null) {

                mPreviewSize = getOptimalPreviewSize(mSupportedPreviewSizes, width, height);
            }


            if (0 == mRatioWidth || 0 == mRatioHeight) {
                setMeasuredDimension(width, height);
            } else {
                if (width < height * mRatioWidth / mRatioHeight) {

                    setMeasuredDimension(width, width * mRatioHeight / mRatioWidth);
                } else {

                    setMeasuredDimension(height * mRatioWidth / mRatioHeight, height);
                }
            }
//            }
        }

        private Camera.Size getOptimalPreviewSize(List<Camera.Size> sizes, int w, int h) {


            final double ASPECT_TOLERANCE = 0.1;
            double targetRatio = (double) h / w;

            if (sizes == null)
                return null;

            Camera.Size optimalSize = null;
            double minDiff = Double.MAX_VALUE;

            int targetHeight = h;

            for (Camera.Size size : sizes) {
                double ratio = (double) size.height / size.width;
                if (Math.abs(ratio - targetRatio) > ASPECT_TOLERANCE)
                    continue;

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

    }

    void alert() {

        countDownTimerPausable.pause();
        AlertDialog.Builder builder1 = new AlertDialog.Builder(this);
        builder1.setMessage("You have Reached Maximum File Size");
        builder1.setCancelable(true);
        builder1.setPositiveButton(
                "OK",
                new DialogInterface.OnClickListener() {
                    public void onClick(DialogInterface dialog, int id) {

                        compress_path = f_file_new.getAbsolutePath();

                        if (scnt <= 0) {

                            // mediaRecorder.stop();  // stop the recording
                            releaseMediaRecorder(); // release the MediaRecorder object

                            //Exit after saved
                            onpcnt = 1;

                            Bundle b = new Bundle();
                            Intent intent = new Intent();
                            intent.putExtra("video_path", compress_path);
                            intent.putExtras(b);
                            setResult(RESULT_OK, intent);
                            finish();
                        } else {

                            // mediaRecorder.stop();  // stop the recording
                            releaseMediaRecorder();
                            if (arraycnt != 1) {
                                pausepath.add(compress_path);
                            }

                            new MergeVideo().execute();
                        }
                    }
                });

        builder1.setOnCancelListener(new DialogInterface.OnCancelListener() {
            @Override
            public void onCancel(DialogInterface dialog) {
            }
        });

        AlertDialog alert11 = builder1.create();
        alert11.show();

    }

    @Override
    public void onBackPressed() {
        super.onBackPressed();

        backcnt = 1;
        Bundle b = new Bundle();
        Intent intent = new Intent();
        intent.putExtras(b);
        setResult(RESULT_CANCELED, intent);
        finish();
    }


    public class MergeVideo extends AsyncTask<String, Integer, String> {

        ProgressDialog progressDialog;


        @Override
        protected void onPreExecute() {
            progressDialog = ProgressDialog.show(AndroidVideoCapture.this,
                    "Preparing Video", "Please wait...", true);

            //do initialization of required objects objects here
        }

        @Override
        protected String doInBackground(String... params) {


            String mergedPath = Mp4ParserWrapper.append(pausepath);

            return mergedPath;
        }

        @Override
        protected void onPostExecute(String value) {
            super.onPostExecute(value);
            progressDialog.dismiss();

            File file = new File(value);
            long fileSizeInBytes = file.length();
            float fileSizeInMB = fileSizeInBytes / (float) (1024 * 1024);

            if (fileSizeInMB > 4.8) {

                trimcnt = 1;

                Toast.makeText(AndroidVideoCapture.this, "Your File size is more than 5MB !!", Toast.LENGTH_LONG).show();

                Intent intent = new Intent(AndroidVideoCapture.this, trim.class);
                intent.putExtra("PATH", value);
//              intent.putExtra("imei", newimei);
                startActivityForResult(intent, 101);

            } else {

                onpcnt = 1;
                Bundle b = new Bundle();
                Intent intent = new Intent();
                intent.putExtra("video_path", value);
                intent.putExtras(b);
                setResult(RESULT_OK, intent);
                finish();
            }
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (resultCode == Activity.RESULT_OK) {
            String compressvideo_path = data.getStringExtra("compressvideo_path");
            Intent i = new Intent();
            i.putExtra("video_path", compressvideo_path);
            setResult(Activity.RESULT_OK, i);
        } else {
            Bundle b = new Bundle();
            Intent intent = new Intent();
            intent.putExtras(b);
            setResult(RESULT_CANCELED, intent);
        }
        finish();
    }
}

