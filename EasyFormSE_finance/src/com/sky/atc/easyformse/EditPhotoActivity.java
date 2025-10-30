package com.sky.atc.easyformse;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.Matrix;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.text.Html;
import android.view.MotionEvent;
import android.view.ScaleGestureDetector;
import android.view.View;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.SeekBar;
import android.widget.Toast;

import androidx.exifinterface.media.ExifInterface;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.io.Writer;
import java.net.HttpURLConnection;
import java.net.URL;

public class EditPhotoActivity extends Activity {

    private ImageView imageView;
    Button mButtonSave, mButtonEdit;
    private LinearLayout layColor, layBrush, layErase;
    ImageButton btnColor, btnBrush, btnErase;
    LinearLayout mLinearLayoutBtn;
    Bundle Extras;
    String photo_path;
    private Matrix matrix = new Matrix();
    private float scale = 1f;
    private ScaleGestureDetector scaleDetector;
    String themecolor;

    MySharedPreferences pref;
    DrawingView mydrawingView;
    Uri image_file;
    Bitmap bmp;
    int ret;
    Bitmap alteredBitmap;
    Bitmap mutableBitmap;
    private Bitmap lastBitmap;
    B_new b;
    FrameLayout mLayoutpaint;
    SeekBar seekBar;
    Runnable mRunnable;
    Handler mHandler = new Handler();
    int size = 1;
    float lastX = 0f, lastY = 0f;
    int mode = 0;
    private float minScale = 0.8f, maxScale = 5f;

    @SuppressLint("MissingInflatedId")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.edit_photo);

        pref = sqlitewraper.getSecureShared("MyPref");
        b = new B_new();
        imageView = findViewById(R.id.imageView);
        mButtonSave = findViewById(R.id.save_draw);
        mButtonEdit = findViewById(R.id.edit_image);
        mLinearLayoutBtn = findViewById(R.id.Layoutbtn);
        layColor = findViewById(R.id.layColor);
        layBrush = findViewById(R.id.layBrush);
        layErase = findViewById(R.id.layErase);
        mLayoutpaint = findViewById(R.id.ChoosenImageView_lay);
        btnColor = findViewById(R.id.btnColor);
        btnBrush = findViewById(R.id.btnBrush);
        btnErase = findViewById(R.id.btnErase);
        seekBar = findViewById(R.id.seekBar1);

        themecolor = pref.getString("themecolor", "");
        if (themecolor.equalsIgnoreCase("")) {
        } else {
            mButtonSave.setBackgroundColor(Color.parseColor(themecolor));
            mButtonEdit.setBackgroundColor(Color.parseColor(themecolor));
            mLinearLayoutBtn.setBackgroundColor(Color.parseColor(themecolor));
        }

        Extras = getIntent().getExtras();
        if (Extras != null) {

            photo_path = Extras.getString("photo_path");
//            photo_path = "https://atcmwfm.americantower.com/UploadFile_After_05222019/ReferencePhotos/Correcr%20ODC%20Earthing.png";
            try {
                if (photo_path.startsWith("https://")) {
                    new Thread(() -> {
                        try {
                            URL url = new URL(photo_path);
                            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                            connection.setDoInput(true);
                            connection.connect();
                            InputStream input = connection.getInputStream();
                            bmp = BitmapFactory.decodeStream(input);

                            alteredBitmap = Bitmap.createScaledBitmap(bmp, 720, 1080, true);
                            mutableBitmap = alteredBitmap.copy(Bitmap.Config.ARGB_8888, true);
                            lastBitmap = mutableBitmap;
                            runOnUiThread(() -> imageView.setImageBitmap(mutableBitmap));

                        } catch (Exception e) {
                            e.printStackTrace();
                        }
                    }).start();
                } else {
                    showImage(photo_path);
                }

            } catch (Exception e) {

            }

        }

        scaleDetector = new ScaleGestureDetector(this, new ScaleListener());

        imageView.setOnTouchListener((v, event) -> {
            scaleDetector.onTouchEvent(event);

            switch (event.getAction() & MotionEvent.ACTION_MASK) {
                case MotionEvent.ACTION_DOWN:
                    lastX = event.getX();
                    lastY = event.getY();
                    mode = 1; // DRAG
                    break;

                case MotionEvent.ACTION_POINTER_DOWN:
                    mode = 2; // ZOOM
                    break;

                case MotionEvent.ACTION_MOVE:
                    if (mode == 1) {
                        float dx = event.getX() - lastX;
                        float dy = event.getY() - lastY;

                        // Adjust for current scale
                        dx /= scale;
                        dy /= scale;

                        matrix.postTranslate(dx, dy);
                        fixTranslation();
                        imageView.setImageMatrix(matrix);

                        lastX = event.getX();
                        lastY = event.getY();
                    }
                    break;

                case MotionEvent.ACTION_UP:
                case MotionEvent.ACTION_POINTER_UP:
                    mode = 0;
                    break;
            }
            return true; // consume event
        });

        mButtonSave.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                save_bitmap();
            }
        });

        mButtonEdit.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                mLinearLayoutBtn.setVisibility(View.VISIBLE);
                GetColor color2 = new GetColor();
                color2.setColorValue(-54784);

                mydrawingView = new DrawingView(EditPhotoActivity.this, mutableBitmap);
                mydrawingView.setBackgroundColor(Color.TRANSPARENT);
                b.setMutableBitmap(mutableBitmap);
                b.setB(mutableBitmap);

                mLayoutpaint.addView(mydrawingView);
//                matrix.setScale(scale, scale);
//                mydrawingView.setMatrix(matrix);
            }
        });

        btnErase.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                final DrawingView mDrawingView2 = new DrawingView(EditPhotoActivity.this,
                        alteredBitmap);
                AlertDialog.Builder eraseDialog = new AlertDialog.Builder(
                        EditPhotoActivity.this);
                eraseDialog.setIcon(R.drawable.eraser);
                eraseDialog.setTitle(Html
                        .fromHtml("<font color='#337ab7'>Erase Drowing</font>"));
                eraseDialog.setMessage("Are You Sure You Want To Erase ?");
                eraseDialog.setPositiveButton("Yes",
                        new DialogInterface.OnClickListener() {
                            public void onClick(DialogInterface dialog,
                                                int which) {
                                // System.out.println("eraseAll() Method Call");
                                mLayoutpaint.removeView(mydrawingView);
                                alteredBitmap = Bitmap.createBitmap(
                                        bmp.getWidth(), bmp.getHeight(),
                                        bmp.getConfig());
                                Bitmap mutableBitmap = bmp.copy(
                                        Bitmap.Config.ARGB_8888, true);
                                GetColor.setStrockWidth(5);
                                GetColor.setDefaultBrushSize(GetColor
                                        .getStrockWidth());
                                DrawingView mDrawingView1 = new DrawingView(
                                        EditPhotoActivity.this, mutableBitmap);
                                mDrawingView1.eraseAll();
                                mLayoutpaint.addView(mDrawingView1);
                                mydrawingView = mDrawingView1;
                                b.setB(mutableBitmap);
                                dialog.dismiss();
                                Toast.makeText(getApplicationContext(),
                                        "Drawing Erase Successfully",
                                        Toast.LENGTH_SHORT).show();
                            }
                        });
                eraseDialog.setNegativeButton("Cancel",
                        new DialogInterface.OnClickListener() {
                            public void onClick(DialogInterface dialog,
                                                int which) {
                                dialog.cancel();
                            }
                        });
                eraseDialog.show();
            }
        });

        btnBrush.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {

                seekBar.setProgress(GetColor.getDefaultBrushSize());
                seekBar.setMax(20);
                seekBar.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {

                    @Override
                    public void onStopTrackingTouch(SeekBar seekBar) {
                        // TODO Auto-generated method stub
                        mHandler.postDelayed(mRunnable, 2500);
                    }

                    @Override
                    public void onStartTrackingTouch(SeekBar seekBar) {
                        // TODO Auto-generated method stub

                    }

                    @Override
                    public void onProgressChanged(SeekBar seekBar,
                                                  int progress, boolean fromUser) {
                        // TODO Auto-generated method stub
                        seekBar.setVisibility(View.VISIBLE);
                        seekBar.removeCallbacks(mRunnable);
                        seekBar.postDelayed(mRunnable, 2500);
                        GetColor getColor = new GetColor();
                        GetColor.setStrockWidth(progress);
                        getColor.setDefaultBrushSize(getColor
                                .getStrockWidth());
                        size = progress;
                    }
                });
                Toast.makeText(getApplicationContext(),
                                "Selected Size Is : " + size, Toast.LENGTH_SHORT)
                        .show();
                mRunnable = new Runnable() {
                    @Override
                    public void run() {
                        // TODO Auto-generated method stub
                        seekBar.setVisibility(View.INVISIBLE);
                        seekBar.setVisibility(View.GONE);
                    }
                };

                if (seekBar.getVisibility() == View.GONE)
                    seekBar.setVisibility(View.VISIBLE);
                else if (seekBar.getVisibility() == View.VISIBLE)
                    seekBar.setVisibility(View.GONE);

            }
        });
        btnColor.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View arg0) {

                HSVColorPickerDialog cpd = new HSVColorPickerDialog(
                        EditPhotoActivity.this, 0xFF4488CC,
                        new HSVColorPickerDialog.OnColorSelectedListener() {
                            @Override
                            public void colorSelected(Integer color) {
                                // Do something with the selected color
                                System.out.print("color" + color);
                                GetColor colorpaint = new GetColor();
                                colorpaint.setColorValue(color);
                                colorpaint.setDefaultColor(colorpaint
                                        .getColorValue());
                                // colorpaint.setDefaultColor(colorpaint.getDefaultColor());
                                Toast.makeText(getApplicationContext(),
                                        "Brush Color Selected",
                                        Toast.LENGTH_SHORT).show();
                            }
                        });
                cpd.setTitle("Pick a color");
                cpd.show();

            }
        });
    }

    private void fixTranslation() {
        float[] values = new float[9];
        matrix.getValues(values);

        float transX = values[Matrix.MTRANS_X];
        float transY = values[Matrix.MTRANS_Y];
        float currentScale = values[Matrix.MSCALE_X];

        Drawable d = imageView.getDrawable();
        if (d == null) return;

        int imgWidth = (int) (d.getIntrinsicWidth() * currentScale);
        int imgHeight = (int) (d.getIntrinsicHeight() * currentScale);

        int viewWidth = imageView.getWidth();
        int viewHeight = imageView.getHeight();

        float minTransX, maxTransX, minTransY, maxTransY;

        if (imgWidth > viewWidth) {
            minTransX = viewWidth - imgWidth;
            maxTransX = 0;
        } else {
            // Center horizontally if image smaller than view
            minTransX = maxTransX = (viewWidth - imgWidth) / 2f;
        }

        if (imgHeight > viewHeight) {
            minTransY = viewHeight - imgHeight;
            maxTransY = 0;
        } else {
            // Center vertically if image smaller than view
            minTransY = maxTransY = (viewHeight - imgHeight) / 2f;
        }

        float newTransX = Math.min(Math.max(transX, minTransX), maxTransX);
        float newTransY = Math.min(Math.max(transY, minTransY), maxTransY);

        matrix.postTranslate(newTransX - transX, newTransY - transY);
    }


    public void showImage(String photo_path) {
        try {
            File imgFile = new File(photo_path);
            if (imgFile.exists()) {
                image_file = Uri.fromFile(imgFile);

                bmp = BitmapFactory.decodeFile(photo_path);

                ExifInterface ei = new ExifInterface(imgFile.getAbsolutePath());
                bmp = imageOreintationValidator(bmp, imgFile.getAbsolutePath());

                alteredBitmap = Bitmap.createScaledBitmap(bmp, 720, 1080, true);
                mutableBitmap = alteredBitmap.copy(Bitmap.Config.ARGB_8888, true);
                lastBitmap = mutableBitmap;
                imageView.setImageBitmap(mutableBitmap);

            }
        } catch (Exception e) {

        }
    }

    int rot = 0;

    private Bitmap imageOreintationValidator(Bitmap bitmap, String path) {

        if (!camera_new.isCropMode) {

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
        }
        return bitmap;
    }

    public static Bitmap rotateImage(Bitmap source, float angle) {

        Bitmap retVal = source;
        if (!camera_new.isCropMode) {

            try {
                Matrix matrix = new Matrix();
                matrix.postRotate(angle);

                retVal = Bitmap.createBitmap(source, 0, 0, source.getWidth(),
                        source.getHeight(), matrix, true);
            } catch (Exception e) {


                final Writer result = new StringWriter();
                final PrintWriter printWriter = new PrintWriter(result);
                String stacktrace = result.toString();
                printWriter.close();

                retVal = source;

            }
        }
        return retVal;

    }

    private class ScaleListener extends ScaleGestureDetector.SimpleOnScaleGestureListener {
        //        @Override
//        public boolean onScale(ScaleGestureDetector detector) {
//            scale *= detector.getScaleFactor();
//            scale = Math.max(0.8f, Math.min(scale, 8.0f));
//            matrix.setScale(scale, scale);
//            imageView.setImageMatrix(matrix);
//
//
//            return true;
//        }
        public boolean onScale(ScaleGestureDetector detector) {
            float scaleFactor = detector.getScaleFactor();
            float newScale = scale * scaleFactor;

            if (newScale < minScale) scaleFactor = minScale / scale;
            if (newScale > maxScale) scaleFactor = maxScale / scale;

            scale *= scaleFactor;
            matrix.postScale(scaleFactor, scaleFactor, detector.getFocusX(), detector.getFocusY());
            fixTranslation();
            imageView.setImageMatrix(matrix);
            return true;
        }
    }

    void save_bitmap() {
        Bitmap b_n = b.getB();
        try {
            File file = null;
            if (!Environment.getExternalStorageState().equals(
                    Environment.MEDIA_MOUNTED)) {
                // handle case of no SDCARD present
                Toast.makeText(getApplicationContext(),
                                "Opps ? SD Card Not Present..", Toast.LENGTH_SHORT)
                        .show();

            } else {
                String dir = Environment.getExternalStorageDirectory()
                        + File.separator + "myDirectory";
                // create folder
                File folder = new File(dir); // folder name
                folder.mkdirs();
                // create file
                String name = "IMG" + System.currentTimeMillis() + ".jpeg";
                file = new File(dir, name);
            }
            b_n = Bitmap.createScaledBitmap(b_n, bmp.getWidth(),
                    bmp.getHeight(), true);

            FileOutputStream out = new FileOutputStream(file.getAbsolutePath());


            b_n.compress(Bitmap.CompressFormat.JPEG, Integer.valueOf(100), out);


            out.flush();
            out.close();

            Bundle b = new Bundle();

            String path = file.getAbsolutePath();
            File filelenght = new File(path);
            long lengthoffile = filelenght.length();
            lengthoffile = lengthoffile / 1024;

            int filesize = Integer.parseInt("5") * 1000;
            if (lengthoffile < filesize) {
                b.putString("status", file.getAbsolutePath());
                Intent intent = new Intent();
                intent.putExtras(b);
                if (getParent() == null) {

                    setResult(RESULT_OK, intent);
                } else {
                    getParent().setResult(Activity.RESULT_OK, intent);
                }
                pref.putString("photo_path", file.getAbsolutePath());
                pref.commit();
                finish();
            } else {
                new Handler(Looper.getMainLooper()).post(new Runnable() {
                    @Override
                    public void run() {
                        Toast.makeText(EditPhotoActivity.this, "File size is too big ! \n File size must be less than " + 5 + "MB!", Toast.LENGTH_LONG).show();
                    }
                });

            }

        } catch (Exception e) {
            Bundle b = new Bundle();
            b.putString("result", e.toString());
            Intent intent = new Intent();
            intent.putExtras(b);
            setResult(RESULT_CANCELED, intent);
            finish();
        }
    }
}
