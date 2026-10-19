package com.sky.atc.easyformse.photo;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Matrix;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.util.Log;
import android.util.Size;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewTreeObserver;
import android.view.WindowManager;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.Toast;

import androidx.annotation.RequiresApi;
import androidx.appcompat.app.ActionBar;
import androidx.appcompat.app.AppCompatActivity;
import androidx.constraintlayout.widget.ConstraintLayout;

import com.sky.atc.easyformse.MakePhotoActivity;
import com.sky.atc.easyformse.R;
import com.sky.atc.easyformse.azurevision.TextRecognizationUtils;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;

/**
 * An example full-screen activity that shows and hides the system UI (i.e.
 * status bar and navigation/system bar) with user interaction.
 */
public class PhotoPreviewActivity extends AppCompatActivity implements View.OnTouchListener {


    private float dX;
    private float dY;
    private int lastAction;

    private static final boolean AUTO_HIDE = true;

    /**
     * If {@link #AUTO_HIDE} is set, the number of milliseconds to wait after
     * user interaction before hiding the system UI.
     */
    private static final int AUTO_HIDE_DELAY_MILLIS = 3000;

    /**
     * Some older devices needs a small delay between UI widget updates
     * and a change of the status and navigation bar.
     */
    private static final int UI_ANIMATION_DELAY = 300;
    private final Handler mHideHandler = new Handler();
    private ImageView mContentView;
    private final Runnable mHidePart2Runnable = new Runnable() {
        @SuppressLint("InlinedApi")
        @Override
        public void run() {
            // Delayed removal of status and navigation bar

            // Note that some of these constants are new as of API 16 (Jelly Bean)
            // and API 19 (KitKat). It is safe to use them, as they are inlined
            // at compile-time and do nothing on earlier devices.
//            mContentView.setSystemUiVisibility(View.SYSTEM_UI_FLAG_LOW_PROFILE
//                    | View.SYSTEM_UI_FLAG_FULLSCREEN
//                    | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
//                    | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
//                    | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
//                    | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION);
        }
    };
    private View mControlsView;
    private final Runnable mShowPart2Runnable = new Runnable() {
        @Override
        public void run() {
            // Delayed display of UI elements
            ActionBar actionBar = getSupportActionBar();
            if (actionBar != null) {
                actionBar.show();
            }
            mControlsView.setVisibility(View.VISIBLE);
        }
    };
    private boolean mVisible;
    private final Runnable mHideRunnable = () -> {
//            hide();

    };
    /**
     * Touch listener to use for in-layout UI controls to delay hiding the
     * system UI. This is to prevent the jarring behavior of controls going away
     * while interacting with activity UI.
     */
    private final View.OnTouchListener mDelayHideTouchListener = new View.OnTouchListener() {
        @Override
        public boolean onTouch(View view, MotionEvent motionEvent) {
            switch (motionEvent.getAction()) {
                case MotionEvent.ACTION_DOWN:
                    if (AUTO_HIDE) {
                        delayedHide(AUTO_HIDE_DELAY_MILLIS);
                    }
                    break;
                case MotionEvent.ACTION_UP:
                    view.performClick();
                    break;
                default:
                    break;
            }
            return false;
        }
    };
    private View viewRectangle;
    private FrameLayout mainFrameLay;
    private View leftView;
    private View rightView;
    private View topView;
    private View bottomView;
    private View viewRectangleMask;
    private Size deviceRealSize;

    @SuppressLint("MissingInflatedId")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        setContentView(R.layout.activity_photo_preview);
//        Objects.requireNonNull(getActionBar()).setDisplayHomeAsUpEnabled(true);
        getSupportActionBar().hide();
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        deviceRealSize = MakePhotoActivity.deviceRealSize;
        TextRecognizationUtils textRecognizationUtils = MakePhotoActivity.textRecognizationUtils;

        mVisible = true;
        mControlsView = findViewById(R.id.fullscreen_content_controls);
        mContentView = findViewById(R.id.fullscreen_imageview);
//        viewRectangle = findViewById(R.id.viewRectangleSecond);
        mainFrameLay = findViewById(R.id.lay_frame);
//        viewRectangle.setOnTouchListener(this);
        viewRectangleMask = findViewById(R.id.viewRectangleMaskSecond);

        topView = findViewById(R.id.topview);
        bottomView = findViewById(R.id.bottomview);
        leftView = findViewById(R.id.leftiew);
        rightView = findViewById(R.id.rightiew);

        viewRectangleMask.setOnTouchListener(this);
//        viewRectangle.setVisibility(View.GONE);

        // Set up the user interaction to manually show or hide the system UI.
        mContentView.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
//                toggle();
            }
        });



        View viewReView= textRecognizationUtils.getRectangleView();


        float getX = viewReView.getTranslationX();
        float getY = viewReView.getTranslationY();


        viewRectangleMask.setX(getX);
        viewRectangleMask.setY(getY);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
//            moveRectanglePosition();
        }

        Intent intent = getIntent();
        String imagePath = intent.getStringExtra("imgpath");
        Bitmap myBitmap = BitmapFactory.decodeFile(imagePath);


        Matrix matrix = new Matrix();
        matrix.postRotate(90);
        Bitmap rotatedBitmap = Bitmap.createBitmap(myBitmap, 0, 0,
                myBitmap.getWidth(), myBitmap.getHeight(), matrix, true);

        mContentView.setImageBitmap(rotatedBitmap);


        findViewById(R.id.dummy_button).setOnClickListener(view -> {
            mContentView.setScaleType(ImageView.ScaleType.FIT_CENTER);
            File pictureFile = cropImageToRectangle(imagePath, viewRectangleMask);
            viewRectangleMask.setVisibility(View.GONE);
            findViewById(R.id.lay_saving).setVisibility(View.VISIBLE);
            findViewById(R.id.fullscreen_content_controls).setVisibility(View.GONE);
            Bundle b = new Bundle();
            b.putString("photopath", pictureFile.getAbsolutePath());
            Intent intent1 = new Intent();
            intent1.putExtras(b);
            setResult(RESULT_OK, intent1);
            finish();
        });

        findViewById(R.id.btn_cancle).setOnClickListener(view -> {
            Bundle b = new Bundle();
            Intent intent1 = new Intent();
            intent1.putExtras(b);
            setResult(RESULT_CANCELED, intent1);
            finish();
        });


    }

    private int[] getLocation(final View view) {
        final int[] locations = new int[]{0, 0, 0, 0};
        if (view != null) {
            ViewTreeObserver vto = view.getViewTreeObserver();
            vto.addOnGlobalLayoutListener(new ViewTreeObserver.OnGlobalLayoutListener() {
                @Override
                public void onGlobalLayout() {
                    int[] location = new int[2];
                    viewRectangleMask.getLocationInWindow(location);
                    locations[0] = location[0];//x postion
                    locations[1] = location[1];//y postion
                    locations[2] = view.getWidth();
                    locations[3] = view.getHeight();

                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN) {
                        view.getViewTreeObserver().removeOnGlobalLayoutListener(this);
                    } else {
                        view.getViewTreeObserver().removeGlobalOnLayoutListener(this);
                    }
                }
            });
        }
        return locations;
    }

    @Override
    protected void onPostCreate(Bundle savedInstanceState) {
        super.onPostCreate(savedInstanceState);

        // Trigger the initial hide() shortly after the activity has been
        // created, to briefly hint to the user that UI controls
        // are available.
        delayedHide(100);
    }

    private void toggle() {
        if (mVisible) {
            hide();
        } else {
            show();
        }
    }

    private void hide() {
        // Hide UI first
        ActionBar actionBar = getSupportActionBar();
        if (actionBar != null) {
            actionBar.hide();
        }
        mControlsView.setVisibility(View.GONE);
        mVisible = false;

        // Schedule a runnable to remove the status and navigation bar after a delay
        mHideHandler.removeCallbacks(mShowPart2Runnable);
        mHideHandler.postDelayed(mHidePart2Runnable, UI_ANIMATION_DELAY);
    }

    private void show() {
        // Show the system bar
        mContentView.setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
        mVisible = true;

        // Schedule a runnable to display UI elements after a delay
        mHideHandler.removeCallbacks(mHidePart2Runnable);
        mHideHandler.postDelayed(mShowPart2Runnable, UI_ANIMATION_DELAY);
    }

    /**
     * Schedules a call to hide() in delay milliseconds, canceling any
     * previously scheduled calls.
     */
    private void delayedHide(int delayMillis) {
        mHideHandler.removeCallbacks(mHideRunnable);
        mHideHandler.postDelayed(mHideRunnable, delayMillis);
    }


    @Override
    public boolean onTouch(View view, MotionEvent event) {
        switch (event.getActionMasked()) {
            case MotionEvent.ACTION_DOWN:
                dX = view.getX() - event.getRawX();
                dY = view.getY() - event.getRawY();
                lastAction = MotionEvent.ACTION_DOWN;
                break;

            case MotionEvent.ACTION_MOVE:
                view.setY(event.getRawY() + dY);
                view.setX(event.getRawX() + dX);

                lastAction = MotionEvent.ACTION_MOVE;
                viewRectangleMask = view;
                Log.d("##REC_Y", String.valueOf(event.getRawY() + dY));

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    moveRectanglePosition(event);
                }

                break;

            case MotionEvent.ACTION_UP:
                if (lastAction == MotionEvent.ACTION_DOWN)
                    Toast.makeText(PhotoPreviewActivity.this, "Clicked!", Toast.LENGTH_SHORT).show();
                break;
            default:

                return false;
        }
        return true;
    }

    private File cropImageToRectangle(String filepath, View borderCamera) {

        File finalFile = null;
        try {

            Log.d("##REC_Y_F_HANDLER", String.valueOf(borderCamera.getY()));

            File f = new File(filepath);
            finalFile = f;
            BitmapFactory.Options options = new BitmapFactory.Options();
            options.inPreferredConfig = Bitmap.Config.ARGB_8888;
            Bitmap bitmapPicture = BitmapFactory.decodeStream(new FileInputStream(f), null, options);


            Matrix matrix = new Matrix();
            matrix.postRotate(90);
            Bitmap rotatedBitmap = Bitmap.createBitmap(bitmapPicture, 0, 0,
                    bitmapPicture.getWidth(), bitmapPicture.getHeight(), matrix, true);

            //calculate aspect ratio
            float koefX = (float) rotatedBitmap.getWidth() / (float) mainFrameLay.getWidth();
            float koefY = (float) rotatedBitmap.getHeight() / mainFrameLay.getHeight();

            //get viewfinder border size and position on the screen
            int x1 = (int) borderCamera.getX();
            int y1 = (int) borderCamera.getY();

            Log.d("##REC_Y_F_HANDLER_BLEFT", String.valueOf(x1));
            Log.d("##REC_Y_F_HANDLER_BTOP", String.valueOf(y1));

            int x2 = borderCamera.getWidth();
            int y2 = borderCamera.getHeight();

            //calculate position and size for cropping
            int cropStartX = Math.round(x1 * koefX);
            int cropStartY = Math.round(y1 * koefY);

            int cropWidthX = Math.round(x2 * koefX);
            int cropHeightY = Math.round(y2 * koefY);


            Log.d("##REC_Y_F_HANDLER_CX", String.valueOf(cropWidthX));
            Log.d("##REC_Y_F_HANDLER_CY", String.valueOf(cropHeightY));

            //check limits and make crop
            Bitmap croppedBitmapNew;
            if (cropStartX + cropWidthX <= rotatedBitmap.getWidth() &&
                    cropStartY + cropHeightY <= rotatedBitmap.getHeight()) {
                croppedBitmapNew = Bitmap.createBitmap(rotatedBitmap, cropStartX,
                        cropStartY, cropWidthX, cropHeightY);
            } else {
                croppedBitmapNew = null;
            }
            mContentView.setImageBitmap(croppedBitmapNew);

            finalFile = savebitmap(croppedBitmapNew);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return finalFile;
    }

    private File savebitmap(Bitmap bmp) throws IOException {
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        bmp.compress(Bitmap.CompressFormat.PNG, 60, bytes);
        File f = new File(createNewDirectory("Easyform photos"), "cropimage_" + System.currentTimeMillis() + ".jpg");
        f.createNewFile();
        FileOutputStream fo = new FileOutputStream(f);
        fo.write(bytes.toByteArray());
        fo.close();
        return f;
    }

    public String createNewDirectory(String name) {
        // create a directory before creating a new file inside it.
        File directory = new File(com.sky.atc.easyformse.utils.AppStorage.root(), name);
        if (!directory.exists()) {
            directory.mkdirs();
        }
        return directory.getAbsolutePath();
    }

    @RequiresApi(api = Build.VERSION_CODES.LOLLIPOP)
    private void moveRectanglePosition(MotionEvent event) {


        leftView.setY(event.getRawY() + dY);
        rightView.setY(event.getRawY() + dY);
        bottomView.setY(event.getRawY() + dY + viewRectangleMask.getHeight());

        int newHeight = (int) viewRectangleMask.getY();

        Log.d("##REC_NewHEIGHT", String.valueOf(newHeight));

        int newWidth = (int) (deviceRealSize.getWidth() - (viewRectangleMask.getX() + viewRectangleMask.getWidth()));

        int newBottomHeght = (int) (deviceRealSize.getHeight() - (viewRectangleMask.getY() + viewRectangleMask.getHeight()));

        rightView.setX(viewRectangleMask.getX() + viewRectangleMask.getWidth());
        topView.setLayoutParams(new ConstraintLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, newHeight));
        leftView.setLayoutParams(new ConstraintLayout.LayoutParams((int) viewRectangleMask.getX(), leftView.getHeight()));
        rightView.setLayoutParams(new ConstraintLayout.LayoutParams(newWidth, leftView.getHeight()));
        bottomView.setLayoutParams(new ConstraintLayout.LayoutParams(bottomView.getWidth(), newBottomHeght));

    }


//    @RequiresApi(api = Build.VERSION_CODES.LOLLIPOP)
//    private void moveRectanglePosition() {
//
//
//        leftView.setY(viewRectangleMask.getY());
//        rightView.setY(viewRectangleMask.getY());
//        bottomView.setY(viewRectangleMask.getY() + viewRectangleMask.getHeight());
//
//        int newHeight = (int) viewRectangleMask.getY();
//
//        Log.d("##REC_NewHEIGHT", String.valueOf(newHeight));
//
//        int newWidth = (int) (deviceRealSize.getWidth() - (viewRectangleMask.getX() + viewRectangleMask.getWidth()));
//
//        int newBottomHeght = (int) (deviceRealSize.getHeight() - (viewRectangleMask.getY() + viewRectangleMask.getHeight()));
//
//        rightView.setX(viewRectangleMask.getX() + viewRectangleMask.getWidth());
//        topView.setLayoutParams(new ConstraintLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, newHeight));
//        leftView.setLayoutParams(new ConstraintLayout.LayoutParams((int) viewRectangleMask.getX(), leftView.getHeight()));
//        rightView.setLayoutParams(new ConstraintLayout.LayoutParams(newWidth, leftView.getHeight()));
//        bottomView.setLayoutParams(new ConstraintLayout.LayoutParams(bottomView.getWidth(), newBottomHeght));
//
//    }

}